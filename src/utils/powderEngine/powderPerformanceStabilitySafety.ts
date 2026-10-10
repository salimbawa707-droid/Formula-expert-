import {
  ClassifiedIngredient,
  PowderCleaningReport,
  PowderDissolutionReport,
  PowderFoamReport,
  PowderLabMeasurementInputs,
  PowderSafetyReport,
  PowderStabilityReport
} from './types';

/**
 * Powder Dissolution & Dispersibility Engine
 * 
 * Rules:
 * - Records laboratory measured dissolution time, residue %, and visual dispersibility observations.
 * - If no measurement is provided: dissolutionStatus is 'NOT_MEASURED'.
 * - Predicted cold water solubility is clearly labelled as 'PREDICTED' / 'SCREENING'.
 * - Identifies insoluble inorganic builder constituents (Zeolite 4A, Bentonite, Talc) that form dispersed suspensions rather than true aqueous solutions.
 */
export function calculatePowderDissolution(
  classifiedIngredients: ClassifiedIngredient[],
  labInputs?: PowderLabMeasurementInputs
): PowderDissolutionReport {
  const insolubleInorganics: string[] = [];
  let insolublePct = 0;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    if (
      name.includes('zeolite') ||
      name.includes('bentonite') ||
      name.includes('talc') ||
      name.includes('calcium carbonate') ||
      name.includes('clay')
    ) {
      insolubleInorganics.push(ing.name);
      insolublePct += ing.inputPercentage;
    }
  });

  const hasInsolubleInorganics = insolubleInorganics.length > 0;
  let predictedSolubility: PowderDissolutionReport['predictedColdWaterSolubility'] = 'Fast Dissolving (<60s)';

  if (insolublePct > 20) {
    predictedSolubility = 'Slow / High Insoluble Solids';
  } else if (insolublePct > 5) {
    predictedSolubility = 'Moderate (60-180s)';
  }

  const isMeasured = labInputs?.measuredDissolutionTimeSec !== undefined && labInputs.measuredDissolutionTimeSec > 0;
  const isResidueMeasured = labInputs?.measuredUndissolvedResiduePct !== undefined;
  const isObservationProvided = labInputs?.dispersibilityObservation !== undefined && labInputs.dispersibilityObservation !== 'not observed';

  const testConditions = (isMeasured || isResidueMeasured || isObservationProvided)
    ? {
        doseGPerL: 5.0,
        waterVolumeMl: 1000,
        waterTempC: labInputs?.dissolutionWaterTempC ?? 20,
        waterHardnessPpm: 150,
        agitationMethod: 'Standard Laboratory Magnetic Stirrer (200 RPM)',
        agitationRpm: labInputs?.dissolutionAgitationRpm ?? 200,
        measuredDissolutionTimeSec: labInputs?.measuredDissolutionTimeSec,
        measuredUndissolvedResiduePct: labInputs?.measuredUndissolvedResiduePct,
        undissolvedMaterialNotes: labInputs?.dispersibilityNotes
      }
    : undefined;

  return {
    testConditions,
    dissolutionStatus: isMeasured ? 'MEASURED' : 'NOT_MEASURED',
    dispersibilityStatus: isObservationProvided ? 'MEASURED' : 'PREDICTED',
    dispersibilityObservation: labInputs?.dispersibilityObservation,
    dispersibilityNotes: labInputs?.dispersibilityNotes,
    predictedColdWaterSolubility: predictedSolubility,
    hasInsolubleInorganics,
    insolubleInorganicNames: insolubleInorganics,
    source: isMeasured ? 'MEASURED' : 'PREDICTED'
  };
}

/**
 * Powder Foam Profile Engine
 * 
 * Rules:
 * - Distinguishes between screening foam profile and measured Ross-Miles foam heights.
 * - Never fabricates fake measured Ross-Miles millimeters.
 */
export function calculatePowderFoam(
  classifiedIngredients: ClassifiedIngredient[],
  productCategory: string = 'Laundry Powder',
  labInputs?: PowderLabMeasurementInputs
): PowderFoamReport {
  let anionicPct = 0;
  let nonionicPct = 0;
  let hasSoapOrDefoamer = false;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    if (ing.functionalClass === 'Anionic Surfactant') anionicPct += ing.inputPercentage;
    if (ing.functionalClass === 'Nonionic Surfactant') nonionicPct += ing.inputPercentage;
    if (name.includes('soap') || name.includes('silicone') || name.includes('defoamer') || name.includes('fatty acid')) {
      hasSoapOrDefoamer = true;
    }
  });

  const isFrontLoad = /front|matic|auto|low foam/i.test(productCategory);
  let screeningFoamProfile: PowderFoamReport['screeningFoamProfile'] = 'High Foam (Manual/Top Load)';

  if (hasSoapOrDefoamer || (nonionicPct > anionicPct && isFrontLoad)) {
    screeningFoamProfile = 'Controlled / Low Foam (Front Load Matic)';
  } else if (anionicPct > 12) {
    screeningFoamProfile = 'High Foam (Manual/Top Load)';
  } else {
    screeningFoamProfile = 'Moderate Foam';
  }

  const isMeasured = labInputs?.measuredRossMilesInitialMm !== undefined && labInputs.measuredRossMilesInitialMm > 0;

  return {
    screeningFoamProfile,
    measuredRossMilesInitialMm: labInputs?.measuredRossMilesInitialMm,
    measuredRossMiles5MinMm: labInputs?.measuredRossMiles5MinMm,
    source: isMeasured ? 'MEASURED' : 'PREDICTED'
  };
}

/**
 * Powder Cleaning Performance Engine
 * 
 * Rules:
 * - Provides formulation detergency screening across soil spectra.
 * - Supports laboratory measured Terg-O-Tometer soil removal percentage.
 * - Clearly discloses that screening model is not a substitute for EMPA/wfk test swatches.
 */
export function calculatePowderCleaningPerformance(
  classifiedIngredients: ClassifiedIngredient[],
  activeSurfactantPct: number,
  labInputs?: PowderLabMeasurementInputs
): PowderCleaningReport {
  let builderPct = 0;
  let enzymeCount = 0;
  let hasBleach = false;
  let hasAntiRedeposition = false;

  classifiedIngredients.forEach((ing) => {
    if (ing.functionalClass === 'Builder (Precipitation / Ion-Exchange)') builderPct += ing.inputPercentage;
    if (ing.functionalClass === 'Enzyme') enzymeCount++;
    if (ing.functionalClass === 'Bleaching Agent') hasBleach = true;
    if (ing.functionalClass === 'Anti-redeposition Polymer') hasAntiRedeposition = true;
  });

  // Empirical Detergency Screening Model (0 - 100)
  const surfactantScore = Math.min(45, (activeSurfactantPct / 14) * 45);
  const builderScore = Math.min(30, (builderPct / 30) * 30);
  const enzymeScore = Math.min(12, enzymeCount * 6);
  const bleachScore = hasBleach ? 8 : 0;
  const polymerScore = hasAntiRedeposition ? 5 : 0;

  const screeningDetergencyScore = Math.min(98, Math.round(surfactantScore + builderScore + enzymeScore + bleachScore + polymerScore));

  const particulateRemovalScore = Math.min(95, Math.round(builderScore * 1.8 + polymerScore * 4 + surfactantScore * 0.5));
  const oilyGreaseScore = Math.min(95, Math.round(surfactantScore * 1.6 + builderScore * 0.7));
  const enzymaticStainScore = enzymeCount > 0 ? Math.min(95, 60 + enzymeCount * 15) : 30;
  const bleachableStainScore = hasBleach ? 85 : 25;

  const isMeasured = labInputs?.measuredSoilRemovalPct !== undefined && labInputs.measuredSoilRemovalPct > 0;

  return {
    screeningDetergencyScore,
    measuredSoilRemovalPct: labInputs?.measuredSoilRemovalPct,
    particulateRemovalScore,
    oilyGreaseScore,
    enzymaticStainScore,
    bleachableStainScore,
    evaluationBasis: 'Multifactorial powder detergency screening model (Surfactant Synergies + Alkaline Saponification + Builder Dispersing + Enzyme/Bleach Spectrum). For commercial and regulatory performance claims, conduct standardized laboratory wash swatch testing.',
    source: isMeasured ? 'MEASURED' : 'PREDICTED'
  };
}

/**
 * Powder Stability & Packaging Compatibility Engine
 */
export function calculatePowderStability(classifiedIngredients: ClassifiedIngredient[]): PowderStabilityReport {
  let hasEnzyme = false;
  let hasBleach = false;
  let hasBleachActivator = false;
  let hasFragrance = false;
  let sodaAshPct = 0;

  classifiedIngredients.forEach((ing) => {
    if (ing.functionalClass === 'Enzyme') hasEnzyme = true;
    if (ing.functionalClass === 'Bleaching Agent') hasBleach = true;
    if (ing.functionalClass === 'Bleach Activator') hasBleachActivator = true;
    if (ing.functionalClass === 'Fragrance') hasFragrance = true;
    if (ing.name.toLowerCase().includes('soda ash') || ing.name.toLowerCase().includes('sodium carbonate')) {
      sodaAshPct += ing.inputPercentage;
    }
  });

  let enzymeBleachCompatibility: PowderStabilityReport['enzymeBleachCompatibility'] = 'No Bleach / Enzyme Present';
  if (hasEnzyme && hasBleach) {
    enzymeBleachCompatibility = hasBleachActivator
      ? 'Bleach Activated (High Enzyme Deactivation Risk)'
      : 'Bleach Deactivates Enzymes';
  } else if (hasEnzyme || hasBleach) {
    enzymeBleachCompatibility = 'Compatible';
  }

  const fragranceStability: PowderStabilityReport['fragranceStabilityRating'] = (hasFragrance && sodaAshPct > 30)
    ? 'Fragrance Bleed / Oxidation Risk'
    : 'Stable in Alkaline Matrix';

  const moistureSensitivity: PowderStabilityReport['moistureAbsorptionSensitivity'] = sodaAshPct > 25 ? 'Moderate' : 'Low';

  const storageGuidelines = 'Store in dry, climate-controlled warehouse below 30°C and <60% relative humidity. Protect from direct atmospheric moisture pickup and pallet compression.';

  return {
    moistureAbsorptionSensitivity: moistureSensitivity,
    fragranceStabilityRating: fragranceStability,
    enzymeBleachCompatibility,
    storageGuidelines,
    source: 'PREDICTED'
  };
}

/**
 * Powder Safety & Occupational Screening Engine
 * 
 * Rules:
 * - Distinguishes FORMAL GHS CLASSIFICATION (requires supplier SDS toxicological dossiers)
 *   from FORMULATION OCCUPATIONAL SAFETY SCREENING / PPE ADVISORY.
 * - If raw-material SDS dossiers are not provided, formal GHS is INSUFFICIENT_DATA.
 * - Screening provides conservative handling guidelines and PPE advisories.
 */
export function calculatePowderSafety(classifiedIngredients: ClassifiedIngredient[]): PowderSafetyReport {
  const hazards: string[] = [];
  const ppe: string[] = [
    'Safety glasses or chemical splash goggles',
    'Dust respirator / particle face mask (FFP2/N95)',
    'Nitrile or chemical-resistant gloves'
  ];

  let highAlkaline = false;
  let highSurfactant = false;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    const pct = ing.inputPercentage;

    if (name.includes('soda ash') || name.includes('sodium carbonate')) {
      if (pct >= 20) {
        hazards.push('Eye Irritation Category 2 / Serious Eye Damage (H319 / H318)');
        highAlkaline = true;
      }
    }
    if (name.includes('metasilicate') || name.includes('hydroxide') || name.includes('caustic')) {
      hazards.push('Skin Corrosion / Eye Damage Category 1B (H314 / H318)');
      highAlkaline = true;
    }
    if (ing.functionalClass === 'Anionic Surfactant' && pct > 15) {
      hazards.push('Skin Irritation Category 2 (H315)');
      highSurfactant = true;
    }
    if (ing.functionalClass === 'Enzyme') {
      hazards.push('Respiratory Sensitizer (H334) — avoid airborne enzyme dust inhalation');
    }
  });

  const signalWord: PowderSafetyReport['signalWord'] = highAlkaline ? 'DANGER' : highSurfactant ? 'WARNING' : 'NONE';
  const screeningSignalWord: PowderSafetyReport['screeningSignalWord'] = highAlkaline ? 'DANGER' : highSurfactant ? 'WARNING' : 'NONE';

  const hazardStatements = hazards.length > 0 ? hazards : ['Low acute hazard profile under normal manufacturing handling.'];
  const precautionaryStatements = [
    'P260: Do not breathe dust.',
    'P280: Wear protective gloves, eye protection, and dust face mask during manufacturing.',
    'P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes.'
  ];

  return {
    formalGHSStatus: 'INSUFFICIENT_DATA (Requires Supplier SDS Dossiers)',
    formalGHSClassification: 'INSUFFICIENT_DATA — Official GHS mixture classification (UN GHS Rev. 9 / CLP) requires supplier SDS toxicological endpoints and regulatory dossier validation.',
    hasInsufficientFormalGHSData: true,
    screeningSignalWord,
    screeningHazardAdvisories: hazardStatements,
    recommendedPPE: ppe,
    handlingPrecautions: precautionaryStatements,
    regulatoryDisclaimer: 'Formulation Safety Screening: For official regulatory SDS authoring and transport compliance, compile supplier SDS toxicological dossiers.',
    ghsHazardClasses: hazards,
    signalWord,
    hazardStatements,
    precautionaryStatements,
    hasInsufficientSafetyData: false,
    source: 'SCREENING'
  };
}

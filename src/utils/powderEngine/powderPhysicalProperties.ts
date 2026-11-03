import {
  ClassifiedIngredient,
  PowderAngleOfReposeReport,
  PowderCakingReport,
  PowderDensityReport,
  PowderFlowabilityReport,
  PowderHygroscopicityReport,
  PowderLabMeasurementInputs,
  PowderParticleSizeReport
} from './types';

/**
 * Calculates loose (bulk) density and tapped bulk density.
 * 
 * Rules:
 * - If sample mass & volume OR direct measured density is provided: status is 'MEASURED'.
 * - If not provided: status is 'NOT_MEASURED', with a predicted screening range based on dry raw materials.
 * - NEVER fabricate a measured density value.
 */
export function calculatePowderDensity(
  classifiedIngredients: ClassifiedIngredient[],
  labInputs?: PowderLabMeasurementInputs
): PowderDensityReport {
  // Case A: Measured from Mass & Volume or direct g/L input
  let measuredBulkGPerL: number | undefined;
  let measuredTappedGPerL: number | undefined;
  let sampleMassG: number | undefined = labInputs?.measuredSampleMassG;
  let looseVolumeMl: number | undefined = labInputs?.measuredLooseVolumeMl;
  let tappedVolumeMl: number | undefined = labInputs?.measuredTappedVolumeMl;

  if (sampleMassG && sampleMassG > 0 && looseVolumeMl && looseVolumeMl > 0) {
    measuredBulkGPerL = (sampleMassG / looseVolumeMl) * 1000;
  } else if (labInputs?.measuredBulkDensityGPerL && labInputs.measuredBulkDensityGPerL > 0) {
    measuredBulkGPerL = labInputs.measuredBulkDensityGPerL;
  }

  if (sampleMassG && sampleMassG > 0 && tappedVolumeMl && tappedVolumeMl > 0) {
    measuredTappedGPerL = (sampleMassG / tappedVolumeMl) * 1000;
  } else if (labInputs?.measuredTappedDensityGPerL && labInputs.measuredTappedDensityGPerL > 0) {
    measuredTappedGPerL = labInputs.measuredTappedDensityGPerL;
  }

  if (measuredBulkGPerL !== undefined && measuredBulkGPerL > 0) {
    const bulkGPerL = Number(measuredBulkGPerL.toFixed(1));
    const tappedGPerL = measuredTappedGPerL !== undefined ? Number(measuredTappedGPerL.toFixed(1)) : undefined;

    const bulkGPerMl = Number((bulkGPerL / 1000).toFixed(3));
    const tappedGPerMl = tappedGPerL !== undefined ? Number((tappedGPerL / 1000).toFixed(3)) : undefined;

    const bulkKgPerM3 = Number(bulkGPerL.toFixed(1));
    const tappedKgPerM3 = tappedGPerL !== undefined ? Number(tappedGPerL.toFixed(1)) : undefined;

    const tappedText = tappedGPerL ? ` | Tapped: ${tappedGPerL} g/L (${tappedGPerMl} g/mL)` : ' (Tapped: Not Measured)';

    return {
      measuredBulkDensityGPerL: bulkGPerL,
      measuredTappedDensityGPerL: tappedGPerL,
      sampleMassG,
      looseVolumeMl,
      tappedVolumeMl,
      bulkDensityGPerMl: bulkGPerMl,
      tappedDensityGPerMl: tappedGPerMl,
      bulkDensityKgPerM3: bulkKgPerM3,
      tappedDensityKgPerM3: tappedKgPerM3,
      bulkDensityGPerCm3: bulkGPerMl,
      tappedDensityGPerCm3: tappedGPerMl,
      densityType: 'MEASURED',
      displayRange: `${bulkGPerL} g/L (${bulkGPerMl} g/mL / ${bulkKgPerM3} kg/m³)${tappedText}`,
      method: sampleMassG && looseVolumeMl ? 'Graduated Cylinder Mass-to-Volume Method (Calculated from measured mass and volume)' : 'Laboratory Measured Bulk Density',
      source: 'MEASURED',
      notes: 'Measured laboratory graduated cylinder tap-density value.'
    };
  }

  // Case B: Not measured -> Provide formulation matrix screening estimate
  let denseWeightSum = 0;
  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    if (name.includes('soda ash dense') || name.includes('sodium sulfate') || name.includes('sodium chloride')) {
      denseWeightSum += ing.inputPercentage;
    }
  });

  const isHighDensityRawMaterials = denseWeightSum > 40;
  const screeningEstimatedRange = isHighDensityRawMaterials
    ? '650 – 850 g/L (Compact / Dry-Blend Matrix)'
    : '450 – 650 g/L (Standard Granular / Spray-Dried Matrix)';

  return {
    densityType: 'SCREENING_ESTIMATE',
    displayRange: screeningEstimatedRange,
    source: 'PREDICTED',
    notes: 'Physical density depends on manufacturing process (Spray-Drying Tower vs Dry Neutralization / Ribbon Blender). Enter laboratory graduated cylinder measurements for exact density, Carr index, and packaging volume design.'
  };
}

/**
 * Calculates Carr Compressibility Index and Hausner Ratio from measured bulk and tapped densities.
 * 
 * Rules:
 * - When both densities exist: Carr Index = ((Tapped - Bulk) / Tapped) * 100, Hausner = Tapped / Bulk.
 * - When densities are unavailable: INSUFFICIENT_DATA / NOT_MEASURED.
 * - Distinguishes CALCULATED INDICATOR from MEASURED FLOW TEST.
 */
export function calculatePowderFlowability(
  densityReport: PowderDensityReport,
  _labInputs?: PowderLabMeasurementInputs
): PowderFlowabilityReport {
  const bulk = densityReport.measuredBulkDensityGPerL;
  const tapped = densityReport.measuredTappedDensityGPerL;

  if (
    densityReport.densityType === 'MEASURED' &&
    bulk !== undefined &&
    tapped !== undefined &&
    tapped > bulk &&
    bulk > 0
  ) {
    const carrIndex = Number((((tapped - bulk) / tapped) * 100).toFixed(1));
    const hausner = Number((tapped / bulk).toFixed(2));

    let flowRating: PowderFlowabilityReport['flowRating'] = 'Good';
    let description = '';

    if (carrIndex < 10) {
      flowRating = 'Excellent';
      description = `Excellent free-flowing powder (Carr Index: ${carrIndex}%, Hausner: ${hausner}). Minimal interparticle cohesion, ideal for gravity feeding and high-speed automated carton packing.`;
    } else if (carrIndex <= 15) {
      flowRating = 'Good';
      description = `Good commercial flowability (Carr Index: ${carrIndex}%, Hausner: ${hausner}). Consistent volumetric dosing with standard hopper discharge.`;
    } else if (carrIndex <= 20) {
      flowRating = 'Fair';
      description = `Fair flowability (Carr Index: ${carrIndex}%, Hausner: ${hausner}). Mild powder cohesion; light aeration or hopper vibration recommended during discharge.`;
    } else if (carrIndex <= 25) {
      flowRating = 'Passable';
      description = `Passable flow (Carr Index: ${carrIndex}%, Hausner: ${hausner}). Susceptible to bridging or arching in silos under storage compaction or humidity.`;
    } else if (carrIndex <= 31) {
      flowRating = 'Poor (Cohesive)';
      description = `Poor cohesive powder (Carr Index: ${carrIndex}%, Hausner: ${hausner}). High interparticle friction; requires flow aid (fumed silica / zeolite) and mechanical agitation.`;
    } else {
      flowRating = 'Very Poor';
      description = `Very poor, highly cohesive or agglomerated powder (Carr Index: ${carrIndex}%, Hausner: ${hausner}). High risk of severe silo caking. Anti-caking agent mandatory.`;
    }

    return {
      flowType: 'CALCULATED_INDICATOR',
      carrIndexPct: carrIndex,
      hausnerRatio: hausner,
      flowRating,
      description,
      source: 'CALCULATED'
    };
  }

  return {
    flowType: 'INSUFFICIENT_DATA',
    flowRating: 'Not Measured',
    description: 'Requires both loose bulk density and tapped density cylinder measurements to calculate Carr Compressibility Index and Hausner Ratio.',
    source: 'INSUFFICIENT_DATA'
  };
}

/**
 * Calculates or records Angle of Repose.
 * 
 * Rules:
 * - If direct angle entered: status is MEASURED.
 * - If height & radius entered: Angle = arctan(height / radius) * (180 / π), status is MEASURED.
 * - If no measurement: status is NOT_MEASURED.
 */
export function calculatePowderAngleOfRepose(labInputs?: PowderLabMeasurementInputs): PowderAngleOfReposeReport {
  let angleDegrees: number | undefined;
  let method: string | undefined;
  let isDirectGoniometer = false;

  if (labInputs?.measuredAngleOfReposeDegrees !== undefined && labInputs.measuredAngleOfReposeDegrees > 0) {
    angleDegrees = labInputs.measuredAngleOfReposeDegrees;
    method = 'Direct Goniometer / Protractor Measurement';
    isDirectGoniometer = true;
  } else if (
    labInputs?.measuredAngleHeightMm !== undefined &&
    labInputs.measuredAngleHeightMm > 0 &&
    labInputs?.measuredAngleRadiusMm !== undefined &&
    labInputs.measuredAngleRadiusMm > 0
  ) {
    const h = labInputs.measuredAngleHeightMm;
    const r = labInputs.measuredAngleRadiusMm;
    angleDegrees = (Math.atan(h / r) * 180) / Math.PI;
    method = `Fixed Funnel Height-to-Radius Geometry (h=${h}mm, r=${r}mm, θ=arctan(h/r))`;
    isDirectGoniometer = false;
  }

  if (angleDegrees !== undefined && angleDegrees > 0) {
    const deg = Number(angleDegrees.toFixed(1));
    let rating: PowderAngleOfReposeReport['rating'] = 'Standard Flow (30°-38°)';

    if (deg < 30) rating = 'Free Flowing (<30°)';
    else if (deg <= 38) rating = 'Standard Flow (30°-38°)';
    else if (deg <= 45) rating = 'Fair Flow (38°-45°)';
    else if (deg <= 55) rating = 'Cohesive (45°-55°)';
    else rating = 'Very Cohesive (>55°)';

    return {
      measuredAngleDegrees: deg,
      measuredHeightMm: labInputs?.measuredAngleHeightMm,
      measuredRadiusMm: labInputs?.measuredAngleRadiusMm,
      method,
      rating,
      source: isDirectGoniometer ? 'MEASURED' : 'CALCULATED'
    };
  }

  return {
    rating: 'Not Measured',
    source: 'INSUFFICIENT_DATA'
  };
}

/**
 * Evaluates Particle Size Distribution (PSD).
 * 
 * Rules:
 * - Support D10, D50, D90, fines (<150µm), coarse (>1000µm).
 * - Do NOT invent PSD values if unavailable.
 */
export function calculatePowderParticleSize(labInputs?: PowderLabMeasurementInputs): PowderParticleSizeReport {
  if (labInputs?.measuredD50Um && labInputs.measuredD50Um > 0) {
    const d50 = Number(labInputs.measuredD50Um.toFixed(0));
    const d10 = labInputs.measuredD10Um ? Number(labInputs.measuredD10Um.toFixed(0)) : undefined;
    const d90 = labInputs.measuredD90Um ? Number(labInputs.measuredD90Um.toFixed(0)) : undefined;
    const fines = labInputs.measuredFinesPct !== undefined ? Number(labInputs.measuredFinesPct.toFixed(1)) : undefined;
    const coarse = labInputs.measuredCoarsePct !== undefined ? Number(labInputs.measuredCoarsePct.toFixed(1)) : undefined;

    let dustRisk: PowderParticleSizeReport['dustinessRisk'] = 'Unknown';
    if (fines !== undefined) {
      dustRisk = fines > 20 ? 'High' : fines > 10 ? 'Moderate' : 'Low';
    }

    const testMethod = labInputs.psdTestMethod || 'Laboratory Sieve Analysis / Laser Diffraction Particle Sizing';

    return {
      measuredD10Um: d10,
      measuredD50Um: d50,
      measuredD90Um: d90,
      finesFractionUnder150UmPct: fines,
      coarseFractionOver1000UmPct: coarse,
      testMethod,
      status: 'MEASURED',
      dustinessRisk: dustRisk,
      source: 'MEASURED'
    };
  }

  return {
    status: 'NOT_MEASURED',
    dustinessRisk: 'Unknown',
    source: 'INSUFFICIENT_DATA'
  };
}

/**
 * Evaluates Caking Risk and Hygroscopicity of the formulation matrix.
 * 
 * Rules:
 * - Labelled clearly as "CAKING RISK SCREENING".
 * - If important data missing: "Insufficient data for reliable caking assessment".
 * - Never present screening model as laboratory proof.
 */
export function calculatePowderCakingAndHygroscopicity(
  classifiedIngredients: ClassifiedIngredient[]
): { caking: PowderCakingReport; hygroscopicity: PowderHygroscopicityReport } {
  if (!classifiedIngredients || classifiedIngredients.length === 0) {
    return {
      caking: {
        cakingRisk: 'Insufficient Data',
        screeningTitle: 'CAKING RISK SCREENING',
        liquidLoadingPct: 0,
        hygroscopicSaltPct: 0,
        antiCakingAgentPresent: false,
        packagingRecommendation: 'Insufficient data for reliable caking assessment. Add raw materials to evaluate formulation caking tendency.',
        hasSufficientData: false,
        source: 'INSUFFICIENT_DATA'
      },
      hygroscopicity: {
        hygroscopicityRating: 'Unknown',
        ingredientBreakdown: [],
        source: 'UNKNOWN'
      }
    };
  }

  let liquidLoading = 0;
  let hygroscopicSalt = 0;
  let hasAntiCaking = false;
  const hygroBreakdown: PowderHygroscopicityReport['ingredientBreakdown'] = [];

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    const pct = ing.inputPercentage;

    // Liquid additions (perfume, liquid nonionics, acid slurry, liquid colorants)
    if (
      ing.functionalClass === 'Fragrance' ||
      ing.functionalClass === 'Nonionic Surfactant' ||
      name.includes('liquid') ||
      name.includes('perfume') ||
      name.includes('fragrance') ||
      (name.includes('labsa') && !name.includes('powder') && !name.includes('neutralized'))
    ) {
      liquidLoading += pct;
    }

    let itemHygro: 'Low' | 'Moderate' | 'High' | 'Unknown' = 'Low';
    if (name.includes('metasilicate') || name.includes('caustic') || name.includes('sodium hydroxide')) {
      hygroscopicSalt += pct;
      itemHygro = 'High';
    } else if (name.includes('soda ash') || name.includes('sodium carbonate') || name.includes('percarbonate') || name.includes('sodium chloride') || name.includes('salt')) {
      hygroscopicSalt += pct;
      itemHygro = 'Moderate';
    } else if (name.includes('sodium sulfate') || name.includes('zeolite') || name.includes('optical brightener') || name.includes('polymer')) {
      itemHygro = 'Low';
    } else if (name.includes('labsa') || name.includes('lae')) {
      itemHygro = 'Moderate';
    }

    hygroBreakdown.push({
      name: ing.name,
      percentage: Number(pct.toFixed(2)),
      hygroscopicity: itemHygro
    });

    if (
      ing.functionalClass === 'Anti-caking Agent' ||
      name.includes('silica') ||
      name.includes('aerosil') ||
      name.includes('zeolite') ||
      name.includes('magnesium silicate')
    ) {
      hasAntiCaking = true;
    }
  });

  let cakingRisk: PowderCakingReport['cakingRisk'] = 'Low Risk';
  let packagingRecommendation = 'Standard polyethylene-lined folding box or laminated moisture-barrier pouch.';

  if (liquidLoading > 4.0 && !hasAntiCaking) {
    cakingRisk = 'High Caking Risk';
    packagingRecommendation = `High liquid surfactant/perfume loading (${liquidLoading.toFixed(1)}%) without dry silica flow aid. High propensity for lump formation and moisture bridging. Add 1.0–2.0% precipitated silica/zeolite and specify laminated hermetic moisture-barrier packaging (PET/ALU/PE).`;
  } else if (liquidLoading > 2.0 || hygroscopicSalt > 35) {
    cakingRisk = 'Moderate Risk';
    packagingRecommendation = `Moderate hygroscopic salt (${hygroscopicSalt.toFixed(1)}%) and liquid loading (${liquidLoading.toFixed(1)}%). Recommend moisture-barrier pouch (BOPP/PE laminated) with hermetic heat seal to prevent atmospheric moisture pickup in tropical or high-humidity storage.`;
  }

  const highHygroCount = hygroBreakdown.filter(h => h.hygroscopicity === 'High').length;
  const modHygroCount = hygroBreakdown.filter(h => h.hygroscopicity === 'Moderate').length;
  const overallHygro: PowderHygroscopicityReport['hygroscopicityRating'] = highHygroCount > 0 ? 'High' : modHygroCount > 1 ? 'Moderate' : 'Low';

  return {
    caking: {
      cakingRisk,
      screeningTitle: 'CAKING RISK SCREENING',
      liquidLoadingPct: Number(liquidLoading.toFixed(2)),
      hygroscopicSaltPct: Number(hygroscopicSalt.toFixed(2)),
      antiCakingAgentPresent: hasAntiCaking,
      packagingRecommendation,
      hasSufficientData: true,
      source: 'SCREENING'
    },
    hygroscopicity: {
      hygroscopicityRating: overallHygro,
      ingredientBreakdown: hygroBreakdown,
      source: 'SCREENING'
    }
  };
}

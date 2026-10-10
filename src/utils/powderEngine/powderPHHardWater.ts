import { StoichiometricNeutralizationEngine } from '../../domain/ph/stoichiometricNeutralizationEngine';
import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import {
  ClassifiedIngredient,
  PowderHardWaterReport,
  PowderLabMeasurementInputs,
  PowderPHReport,
  PowderSlurryBasis
} from './types';

/**
 * Powder pH Engine — Universal Thermodynamic Slurry Test Basis
 * 
 * CLASSIFICATION: AUTHORITATIVE SCIENTIFIC THERMODYNAMIC EVALUATOR
 * The authoritative scientific thermodynamic equilibrium engine is PHEngineV2 (domain/ph/pHEngineV2.ts),
 * which evaluates powder products on an explicitly defined aqueous slurry basis.
 */
export function calculatePowderPH(
  classifiedIngredients: ClassifiedIngredient[],
  productCategory: string = 'Laundry Powder',
  labInputs?: PowderLabMeasurementInputs
): PowderPHReport {
  const isDelicate = /delicate|wool|silk|baby|hand wash/i.test(productCategory);
  const isDishwash = /dishwash|automatic dishwasher|machine dish/i.test(productCategory);

  // Target Range determination
  let targetMin: number | undefined;
  let targetMax: number | undefined;
  let targetLabel = '';
  let isSpecified = true;

  if (labInputs?.customPHTargetMin !== undefined || labInputs?.customPHTargetMax !== undefined) {
    targetMin = labInputs.customPHTargetMin ?? 7.0;
    targetMax = labInputs.customPHTargetMax ?? 11.5;
    targetLabel = labInputs.customPHTargetLabel || `User-Defined Specification Target (${targetMin} – ${targetMax})`;
  } else if (isDelicate) {
    targetMin = 7.0;
    targetMax = 8.5;
    targetLabel = 'Delicate / Neutral Fabric Target (7.0 – 8.5)';
  } else if (isDishwash) {
    targetMin = 10.0;
    targetMax = 12.0;
    targetLabel = 'Automatic Dishwasher Powder Target (10.0 – 12.0)';
  } else if (/industrial|heavy duty|alkaline/i.test(productCategory)) {
    targetMin = 10.0;
    targetMax = 12.0;
    targetLabel = 'Heavy-Duty Industrial Powder Target (10.0 – 12.0)';
  } else if (/powder/i.test(productCategory)) {
    targetMin = 9.5;
    targetMax = 11.2;
    targetLabel = 'Standard Heavy-Duty Alkaline Laundry Powder Target (9.5 – 11.2)';
  } else {
    isSpecified = false;
    targetLabel = 'Target not specified';
  }

  // 1. CALCULATE LEGACY HEURISTIC FOR NON_AUTHORITATIVE DIAGNOSTIC USE
  let legacyHeuristicPH = 10.5;
  let sodaAshPct = 0;
  let metasilicatePct = 0;
  let causticPct = 0;
  let labsaPct = 0;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    const pct = ing.inputPercentage;

    if (name.includes('soda ash') || name.includes('sodium carbonate')) sodaAshPct += pct;
    if (name.includes('metasilicate')) metasilicatePct += pct;
    if (name.includes('hydroxide') || name.includes('caustic')) causticPct += pct;
    if (name.includes('labsa') || name.includes('acid slurry')) labsaPct += pct;
  });

  if (causticPct > 2 || metasilicatePct > 15) {
    legacyHeuristicPH = 11.8;
  } else if (sodaAshPct > 15 || metasilicatePct > 5) {
    legacyHeuristicPH = 10.6;
  } else if (sodaAshPct > 5) {
    legacyHeuristicPH = 9.8;
  } else if (isDelicate || (sodaAshPct === 0 && metasilicatePct === 0)) {
    legacyHeuristicPH = 8.0;
  }

  if (labsaPct > 0) {
    const rawIngs = classifiedIngredients.map(i => ({
      name: i.name,
      percentage: i.inputPercentage,
      activeMatterPct: i.activeMatterPct
    }));
    const neutResult = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization(rawIngs, 100);
    if (neutResult.value.status === 'UNDER_NEUTRALIZED') {
      legacyHeuristicPH = 4.5;
    }
  }

  const concentrationPct = labInputs?.customPHConcentrationPct || 1.0;

  // 2. AUTHORITATIVE ELECTROLYTE SPECIATION VIA THE UNIVERSAL pH ENGINE v2
  const v2Category = isDishwash ? 'AUTOMATIC_DISHWASH_POWDER' : 'LAUNDRY_POWDER';
  const engineInputs = classifiedIngredients.map(i => ({
    name: i.name,
    rawPercent: i.inputPercentage,
    activePercent: i.activeMatterPct
  }));

  let calculatedPH = legacyHeuristicPH;
  if (classifiedIngredients.length > 0) {
    try {
      const v2Res = PHEngineV2.calculatePH(engineInputs, 100, {
        productCategory: v2Category,
        assumeSlurryBasisIfPowder: true,
        slurryConcentrationPct: concentrationPct,
        temperatureC: 25.0
      });
      calculatedPH = v2Res.pH;
    } catch (err) {
      console.warn('PHEngineV2 calculation failed inside powder engine, falling back to legacy heuristic.', err);
      calculatedPH = legacyHeuristicPH;
    }
  } else {
    calculatedPH = legacyHeuristicPH;
  }

  const measuredPH = labInputs?.measured1PctAqueousPH;
  const effectivePH = measuredPH !== undefined && measuredPH > 0 ? measuredPH : calculatedPH;

  let isWithinTarget = true;
  let statusMessage = '';

  if (isSpecified && targetMin !== undefined && targetMax !== undefined) {
    isWithinTarget = effectivePH >= targetMin && effectivePH <= targetMax;
    statusMessage = isWithinTarget
      ? `1% aqueous test solution pH (${effectivePH.toFixed(2)}) complies with ${targetLabel}. Alkaline wash liquor saponifies fatty acids and maintains builder dispersion.`
      : effectivePH > targetMax
      ? `1% aqueous test solution pH (${effectivePH.toFixed(2)}) exceeds target specification (${targetMin}–${targetMax}).`
      : `1% aqueous test solution pH (${effectivePH.toFixed(2)}) is below the intended target window (${targetMin}–${targetMax}). Check acid slurry (LABSA) neutralization by alkaline builders.`;
  } else {
    isWithinTarget = true;
    statusMessage = `1% aqueous test solution pH is ${effectivePH.toFixed(2)}. Target not specified.`;
  }

  // 3. DEFINE EXPLICIT SCIENTIFIC SLURRY PREPARATION CONFIGURATION
  const slurryBasis: PowderSlurryBasis = {
    powderMassG: concentrationPct,
    waterMassG: 100.0 - concentrationPct,
    slurryPercent: concentrationPct,
    isWeightByWeight: false, // Standard potentiometric method is w/v
    finalVolumeMl: 100,
    temperatureC: 25.0,
    preparationAssumptions: [
      'Standardized 1.0% w/v sample dissolution in demineralized water.',
      'Potentiometric glass electrode calibrated with standard pH buffers.',
      'Continuous stirring to reach solid-liquid analytical equilibrium.'
    ],
    equilibrationTimeMin: 10,
    measurementBasis: `Standard ${concentrationPct}% w/v Aqueous Solution Potentiometric Glass Electrode Method`
  };

  return {
    testBasis: {
      sampleConcentrationPct: concentrationPct,
      waterVolumeMl: 100,
      sampleMassG: concentrationPct,
      temperatureC: 25,
      solutionHardnessPpm: 0,
      waterQuality: 'Demineralized / Distilled Water',
      equilibrationTimeMin: 10,
      method: `Standard ${concentrationPct}% w/v Aqueous Solution Potentiometric Glass Electrode Method`
    },
    slurryBasis,
    measuredPH,
    calculatedAqueousPH: calculatedPH,
    targetRange: {
      min: targetMin,
      max: targetMax,
      label: targetLabel,
      isSpecified
    },
    isWithinTarget,
    statusMessage,
    isAlkalineIntended: !isDelicate,
    source: measuredPH !== undefined && measuredPH > 0 ? 'MEASURED' : 'CALCULATED',
    nonAuthoritativeHeuristicPH: legacyHeuristicPH
  };
}

/**
 * Hard Water Analysis Engine for Powders
 * 
 * Evaluates wash liquor builder delivery vs water hardness demand.
 */
export function calculatePowderHardWaterPerformance(
  classifiedIngredients: ClassifiedIngredient[],
  waterHardnessPpm: number = 150,
  washDoseG: number = 50,
  washVolumeL: number = 10
): PowderHardWaterReport {
  if (!classifiedIngredients || classifiedIngredients.length === 0) {
    return {
      waterHardnessDemandPpm: waterHardnessPpm,
      washDoseG,
      washVolumeL,
      builderProtectionRating: 'Insufficient validated data',
      anionicSensitivityRisk: 'Insufficient validated data',
      details: 'Insufficient formulation data to calculate hard-water builder protection.',
      source: 'INSUFFICIENT_DATA'
    };
  }

  let builderPct = 0;
  let chelatorPct = 0;
  let anionicPct = 0;
  let nonionicPct = 0;

  classifiedIngredients.forEach((ing) => {
    if (ing.functionalClass === 'Builder (Precipitation / Ion-Exchange)') builderPct += ing.inputPercentage;
    if (ing.functionalClass === 'Chelating Agent / Soluble Sequestrant') chelatorPct += ing.inputPercentage;
    if (ing.functionalClass === 'Anionic Surfactant') anionicPct += ing.inputPercentage;
    if (ing.functionalClass === 'Nonionic Surfactant') nonionicPct += ing.inputPercentage;
  });

  const powderConcentrationGPerL = washDoseG / Math.max(1, washVolumeL);
  const builderGPerLInWash = powderConcentrationGPerL * (builderPct / 100);

  let builderProtectionRating: PowderHardWaterReport['builderProtectionRating'] = 'Sufficient Protection';
  let anionicRisk: PowderHardWaterReport['anionicSensitivityRisk'] = 'Protected by Builders';

  if (builderPct < 10 && chelatorPct === 0) {
    builderProtectionRating = 'Insufficient Builder Loading';
    anionicRisk = 'Vulnerable to Ca2+ Precipitation';
  } else if (builderPct < 20 && waterHardnessPpm > 250) {
    builderProtectionRating = 'Moderate / Borderline';
    anionicRisk = 'Protected by Builders';
  }

  const details = `At ${waterHardnessPpm} ppm CaCO₃ hardness demand and ${washDoseG}g wash dose (${washVolumeL}L wash liquor, ~${powderConcentrationGPerL.toFixed(1)} g/L wash liquor concentration), the formulation delivers ${builderGPerLInWash.toFixed(2)} g/L inorganic builder system. Soda Ash precipitates hardness cations as insoluble CaCO₃, protecting anionic LAS-Na from calcium precipitation.`;

  return {
    waterHardnessDemandPpm: waterHardnessPpm,
    washDoseG,
    washVolumeL,
    builderProtectionRating,
    anionicSensitivityRisk: anionicRisk,
    details,
    source: 'CALCULATED'
  };
}

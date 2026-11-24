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
    targetMin = labInputs.customPHTargetMin ?? null;
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
  let legacyHeuristicPH: number | undefined = classifiedIngredients.length > 0 ? 10.5 : undefined;
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

  if (classifiedIngredients.length > 0) {
    if (causticPct > 2 || metasilicatePct > 15) {
      legacyHeuristicPH = 11.8;
    } else if (sodaAshPct > 15 || metasilicatePct > 5) {
      legacyHeuristicPH = 10.6;
    } else if (sodaAshPct > 5) {
      legacyHeuristicPH = 9.8;
    } else if (isDelicate || (sodaAshPct === 0 && metasilicatePct === 0)) {
      legacyHeuristicPH = 8.0;
    }
  }

  const rawIngs = classifiedIngredients.map(i => ({
    name: i.name,
    percentage: i.inputPercentage,
    activeMatterPct: i.activeMatterPct
  }));
  const neutralizationResult = classifiedIngredients.length > 0
    ? StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization(rawIngs, 100)
    : null;
  if (labsaPct > 0 && neutralizationResult?.value.status === 'UNDER_NEUTRALIZED') {
    legacyHeuristicPH = 4.5;
  }

  const rawConcentrationPct = labInputs?.customPHConcentrationPct;
  const concentrationPct = rawConcentrationPct === undefined || rawConcentrationPct === null
    ? 1.0
    : Number(rawConcentrationPct);
  const concentrationValid = Number.isFinite(concentrationPct) && concentrationPct > 0 && concentrationPct <= 100;
  const concentrationWasAssumed = rawConcentrationPct === undefined || rawConcentrationPct === null;

  // 2. AUTHORITATIVE ELECTROLYTE SPECIATION VIA THE UNIVERSAL pH ENGINE v2
  const v2Category = isDishwash ? 'AUTOMATIC_DISHWASH_POWDER' : 'LAUNDRY_POWDER';
  const engineInputs = classifiedIngredients.map(i => ({
    name: i.name,
    rawPercent: i.inputPercentage,
    activePercent: i.activeMatterPct
  }));

  let calculatedPH: number | undefined = undefined;
  let isPHAvailable = false;
  const neutralizationStatus = neutralizationResult?.value.status;
  const hasSecondaryAcidBaseChemistry =
    (neutralizationResult?.value.secondaryAcidsPresent?.length ?? 0) > 0 ||
    (neutralizationResult?.value.secondaryBasesPresent?.length ?? 0) > 0;
  const hasPHActiveChemistry =
    ['FULLY_NEUTRALIZED', 'ACID_EXCESS', 'UNDER_NEUTRALIZED', 'BASE_EXCESS'].includes(String(neutralizationStatus)) ||
    hasSecondaryAcidBaseChemistry;

  if (classifiedIngredients.length > 0 && concentrationValid && hasPHActiveChemistry) {
    try {
      const v2Res = PHEngineV2.calculatePH(engineInputs, 100, {
        productCategory: v2Category,
        assumeSlurryBasisIfPowder: true,
        slurryConcentrationPct: concentrationPct,
        temperatureC: 25.0
      });
      if (v2Res && v2Res.converged && Number.isFinite(v2Res.pH) && v2Res.pH >= 0 && v2Res.pH <= 14) {
        calculatedPH = v2Res.pH;
        isPHAvailable = true;
      }
    } catch (err) {
      console.warn('PHEngineV2 calculation failed inside powder engine.', err);
      calculatedPH = undefined;
      isPHAvailable = false;
    }
  }

  const measuredPH = labInputs?.measured1PctAqueousPH;
  const isMeasuredAvailable = concentrationValid && measuredPH !== undefined &&
    Number.isFinite(measuredPH) && measuredPH >= 0 && measuredPH <= 14;
  const effectivePH = isMeasuredAvailable ? measuredPH : (isPHAvailable ? calculatedPH : undefined);

  let isWithinTarget = false;
  let statusMessage = '';

  if (effectivePH !== undefined && Number.isFinite(effectivePH) && !isNaN(effectivePH)) {
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
  } else {
    isWithinTarget = false;
    statusMessage = !concentrationValid
      ? 'INVALID_INPUT: slurry concentration must be a finite value greater than 0% and no more than 100%.'
      : classifiedIngredients.length === 0
        ? 'INSUFFICIENT_DATA: no powder ingredients were supplied; no pH value or heuristic baseline is returned.'
        : !hasPHActiveChemistry && !isMeasuredAvailable
          ? 'INSUFFICIENT_DATA: no acid/base or secondary buffer chemistry is identified and no measured pH was supplied.'
          : `UNAVAILABLE: pH calculation did not produce a valid result. Cannot verify compliance against ${targetLabel || 'target specification'}.`;
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
      concentrationWasAssumed ? 'Standardized 1.0% w/v slurry reference assumed because no custom concentration was supplied.' : 'User-supplied slurry concentration used; verify the laboratory method and record it in the batch record.',
      'Potentiometric glass electrode calibrated with standard pH buffers.',
      'Continuous stirring to reach solid-liquid analytical equilibrium.'
    ],
    equilibrationTimeMin: 10,
    measurementBasis: concentrationValid ? `Standard ${concentrationPct}% w/v Aqueous Solution Potentiometric Glass Electrode Method` : 'UNAVAILABLE — invalid slurry concentration'
  };

  return {
    testBasis: {
      sampleConcentrationPct: concentrationValid ? concentrationPct : Number.NaN,
      waterVolumeMl: 100,
      sampleMassG: concentrationValid ? concentrationPct : Number.NaN,
      temperatureC: 25,
      solutionHardnessPpm: 0,
      waterQuality: 'Demineralized / Distilled Water',
      equilibrationTimeMin: 10,
      method: concentrationValid ? `Standard ${concentrationPct}% w/v Aqueous Solution Potentiometric Glass Electrode Method` : 'UNAVAILABLE — invalid slurry concentration'
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
    source: isMeasuredAvailable ? 'MEASURED' : (isPHAvailable ? 'CALCULATED' : 'INSUFFICIENT_DATA'),
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
  waterHardnessPpm?: number,
  washDoseG?: number,
  washVolumeL?: number
): PowderHardWaterReport {
  const hasScenario =
    typeof waterHardnessPpm === 'number' && Number.isFinite(waterHardnessPpm) && waterHardnessPpm >= 0 &&
    typeof washDoseG === 'number' && Number.isFinite(washDoseG) && washDoseG > 0 &&
    typeof washVolumeL === 'number' && Number.isFinite(washVolumeL) && washVolumeL > 0;
  const safeIngredients = Array.isArray(classifiedIngredients) ? classifiedIngredients : [];
  if (!hasScenario || safeIngredients.length === 0) {
    return {
      waterHardnessDemandPpm: undefined,
      washDoseG: undefined,
      washVolumeL: undefined,
      builderDeliveryGPerL: undefined,
      builderProtectionRating: 'Insufficient validated data',
      anionicSensitivityRisk: 'Insufficient validated data',
      details: 'NOT_EVALUATED: provide exact measured water hardness (ppm as CaCO3), wash dose (g), and final wash-liquor volume (L). Builder percentage alone cannot establish Ca/Mg sequestration or anionic surfactant protection.',
      source: 'INSUFFICIENT_DATA'
    };
  }

  let builderPct = 0;
  safeIngredients.forEach((ing) => {
    if (ing.functionalClass === 'Builder (Precipitation / Ion-Exchange)' ||
        ing.functionalClass === 'Anti-redeposition Polymer') {
      builderPct += ing.inputPercentage;
    }
  });

  const powderConcentrationGPerL = washDoseG / washVolumeL;
  const builderDeliveryGPerL = powderConcentrationGPerL * (builderPct / 100);
  return {
    waterHardnessDemandPpm: waterHardnessPpm,
    washDoseG,
    washVolumeL,
    builderDeliveryGPerL: Number(builderDeliveryGPerL.toFixed(4)),
    builderProtectionRating: 'Insufficient validated data',
    anionicSensitivityRisk: 'Insufficient validated data',
    details: `Composition arithmetic only: at ${waterHardnessPpm} ppm CaCO3, ${washDoseG} g dose in ${washVolumeL} L, the formula delivers ${builderDeliveryGPerL.toFixed(4)} g/L of ingredients classified as builders/co-builders. This does not prove hardness removal or surfactant protection; grade-specific stoichiometry, competing ions, pH and measured residual hardness/free Ca2+/Mg2+ are unavailable.`,
    source: 'SCREENING'
  };
}

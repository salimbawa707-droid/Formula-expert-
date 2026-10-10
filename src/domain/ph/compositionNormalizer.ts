/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - COMPOSITION NORMALIZER
 * ============================================================================
 * Converts formulation ingredient inputs into mass/molar quantities, computes
 * real solvent/water balances, handles commercial assays, and calculates
 * molar analytical concentrations (mol/L) for the chemical equilibrium solver.
 * ============================================================================
 */

import { IngredientInput } from '../../types';
import { ProductCategoryId, normalizeProductCategory } from '../productTaxonomy';
import { getScientificProductProfile } from '../scientificProductProfiles';
import { classifyChemicalSpecies } from './chemicalSpeciesRegistry';
import { NormalizedComposition, NormalizedIngredient, PHCalculationOptions } from './types';
import { resolveScientificAcidBaseProfile } from './acidBaseDataModel';

export function normalizeFormulationComposition(
  ingredients: IngredientInput[],
  totalMassKg: number = 100,
  options: PHCalculationOptions = {}
): NormalizedComposition {
  const temperatureC = options.temperatureC ?? 25.0;
  const categoryRaw = options.productCategory;
  let isPowder = false;
  let resolvedCategory: ProductCategoryId | undefined = undefined;

  if (categoryRaw !== undefined && categoryRaw !== null && categoryRaw !== '') {
    const normCategory = normalizeProductCategory(categoryRaw);
    if (normCategory === 'UNKNOWN_PRODUCT_CATEGORY') {
      throw new Error(
        `Cannot normalize composition: Unrecognized product category "${categoryRaw}". ` +
        `Product category must resolve to a valid canonical ProductCategoryId.`
      );
    }
    resolvedCategory = normCategory;
    const profile = getScientificProductProfile(normCategory);
    isPowder = profile.physicalForm === 'POWDER';
  }

  // Process ingredients and calculate masses
  let sumExplicitMassKg = 0;
  const rawIngsWithMass = ingredients.map(ing => {
    let massKg = 0;
    if (ing.rawKg !== undefined && ing.rawKg !== null && !isNaN(ing.rawKg) && ing.rawKg > 0) {
      massKg = ing.rawKg;
    } else if (ing.weightKg !== undefined && ing.weightKg !== null && !isNaN(ing.weightKg) && ing.weightKg > 0) {
      massKg = ing.weightKg;
    } else {
      const rawPct = ing.rawPercent ?? 0;
      massKg = (rawPct / 100) * totalMassKg;
    }
    sumExplicitMassKg += massKg;
    return { ing, massKg };
  });

  const effectiveBatchMassKg = Math.max(totalMassKg, sumExplicitMassKg);

  let explicitWaterKg = 0;
  let rawMaterialWaterKg = 0;
  let totalRecognizedMassKg = 0;
  let unrecognizedCount = 0;

  const normalizedIngredients: NormalizedIngredient[] = [];

  for (const { ing, massKg } of rawIngsWithMass) {
    const rawName = ing.name || '';
    const species = classifyChemicalSpecies(rawName);

    // Active concentration fraction
    let activeFraction = 1.0;
    if (ing.activePercent !== undefined && ing.activePercent !== null && !isNaN(ing.activePercent)) {
      activeFraction = ing.activePercent > 1 ? ing.activePercent / 100 : ing.activePercent;
    } else if (ing.purity !== undefined && ing.purity !== null && !isNaN(ing.purity)) {
      activeFraction = ing.purity > 1 ? ing.purity / 100 : ing.purity;
    } else if (rawName.toLowerCase().includes('50%')) {
      activeFraction = 0.50;
    } else if (rawName.toLowerCase().includes('85%')) {
      activeFraction = 0.85;
    } else if (rawName.toLowerCase().includes('47%')) {
      activeFraction = 0.47;
    } else if (rawName.toLowerCase().includes('40%')) {
      activeFraction = 0.40;
    } else if (rawName.toLowerCase().includes('37%')) {
      activeFraction = 0.37;
    } else if (rawName.toLowerCase().includes('96%')) {
      activeFraction = 0.96;
    } else if (rawName.toLowerCase().includes('90%')) {
      activeFraction = 0.90;
    } else if (rawName.toLowerCase().includes('70%')) {
      activeFraction = 0.70;
    } else if (rawName.toLowerCase().includes('28%')) {
      activeFraction = 0.28;
    } else if (rawName.toLowerCase().includes('30%')) {
      activeFraction = 0.30;
    }

    activeFraction = Math.max(0, Math.min(1.0, activeFraction));

    const activeMassKg = massKg * activeFraction;
    let waterFraction = 0;
    let waterMassKg = 0;

    if (species?.isSolventWater) {
      explicitWaterKg += massKg;
      waterFraction = 1.0;
      waterMassKg = massKg;
    } else {
      waterFraction = 1.0 - activeFraction;
      waterMassKg = massKg * waterFraction;
      rawMaterialWaterKg += waterMassKg;
    }

    let moles = 0;
    if (species && species.mw > 0) {
      moles = (activeMassKg * 1000) / species.mw;
    }

    if (species) {
      totalRecognizedMassKg += massKg;
    } else {
      unrecognizedCount++;
    }

    const acidBaseProfile = resolveScientificAcidBaseProfile(ing);

    normalizedIngredients.push({
      inputName: rawName,
      resolvedSpecies: species,
      rawMassKg: massKg,
      activeFraction,
      activeMassKg,
      moles,
      molarity: 0,
      density: ing.density,
      waterFraction,
      waterMassKg,
      isRecognized: Boolean(species),
      acidBaseProfile
    });
  }

  // Account for implicit water remainder in formulation batch
  const implicitWaterKg = Math.max(0, effectiveBatchMassKg - sumExplicitMassKg);
  const totalWaterKg = explicitWaterKg + rawMaterialWaterKg + implicitWaterKg;
  const waterMassFraction = totalWaterKg / effectiveBatchMassKg;

  // Calculate batch volume
  let apparentDensity = 1.0;
  if (isPowder) {
    apparentDensity = 1.0;
  } else {
    let weightedVol = 0;
    let massWithDensity = 0;
    for (const item of normalizedIngredients) {
      if (item.density && item.density > 0.5 && item.density < 2.5) {
        weightedVol += item.rawMassKg / item.density;
        massWithDensity += item.rawMassKg;
      }
    }
    if (massWithDensity > 0.5 * effectiveBatchMassKg) {
      const remainingMass = effectiveBatchMassKg - massWithDensity;
      weightedVol += remainingMass / 1.0;
      apparentDensity = effectiveBatchMassKg / Math.max(0.001, weightedVol);
    } else {
      apparentDensity = 1.0;
    }
  }

  let totalVolumeL = effectiveBatchMassKg / apparentDensity;
  let slurryDilutionFactor = 1.0;

  if (isPowder && (options.assumeSlurryBasisIfPowder ?? true)) {
    const slurryPct = options.slurryConcentrationPct ?? 1.0;
    slurryDilutionFactor = slurryPct / 100.0;
    totalVolumeL = (effectiveBatchMassKg / slurryDilutionFactor) / 1.0;
  }

  // Compute final molarity (mol/L) for each ingredient in the aqueous formulation phase
  for (const item of normalizedIngredients) {
    item.molarity = item.moles / Math.max(0.0001, totalVolumeL);
  }

  const recognizedMassFraction = totalRecognizedMassKg / effectiveBatchMassKg;

  return {
    totalMassKg: effectiveBatchMassKg,
    totalVolumeL,
    apparentDensity,
    explicitWaterKg: explicitWaterKg + implicitWaterKg,
    rawMaterialWaterKg,
    totalWaterKg,
    waterMassFraction,
    temperatureC,
    productCategory: resolvedCategory,
    ingredients: normalizedIngredients,
    recognizedMassFraction,
    unrecognizedCount,
    isPowder,
    slurryDilutionFactor
  };
}

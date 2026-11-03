import { FormulationIngredient } from '../types';

export type IngredientPricingStatus =
  | 'EXPLICIT_USER_PRICE'
  | 'MISSING_PRICE'
  | 'INVALID_PRICE'
  | 'UNKNOWN_PRICE';

export type FormulaPricingStatus =
  | 'COMPLETE_PRICING'
  | 'PARTIAL_PRICING'
  | 'NO_PRICING'
  | 'UNKNOWN';

export interface IngredientCostItem {
  id: string;
  name: string;
  percentage: number;
  weightKg: number;
  costPerKg: number;
  userPrice: number | null;
  totalCost: number;
  hasUserPrice: boolean;
  pricingStatus: IngredientPricingStatus;
  costPercentageOfTotal: number;
}

export interface FormulaCostReport {
  ingredientCosts: IngredientCostItem[];
  totalBatchWeightKg: number;
  totalBatchCost: number;
  costPerKg: number;
  isComplete: boolean;
  pricingStatus: FormulaPricingStatus;
  missingPriceCount: number;
  completePriceCount: number;
  totalIngredientsCount: number;
  pricedIngredientCount: number;
  unpricedIngredientCount: number;
  invalidPercentageCount: number;
  invalidPriceCount: number;
  formulaTotalPercentage: number;
  isMassBalanced: boolean;
  massBalanceStatus: 'BALANCED' | 'INCOMPLETE' | 'EXCESS' | 'INVALID';
  missingIngredientIds: string[];
  warnings: string[];
  costLabel: 'TOTAL COST' | 'PARTIAL COST — EXCLUDES UNPRICED INGREDIENTS' | 'PARTIAL COST — FORMULA MASS BALANCE INCOMPLETE' | 'COST UNAVAILABLE';
  status: 'COMPLETE' | 'PRICE INPUT REQUIRED' | 'FORMULA INPUT REQUIRED' | 'BATCH SIZE REQUIRED';
  statusMessage: string;
}

/**
 * Authoritative Commercial Costing Calculator.
 * 
 * Rules:
 * 1. User-controlled pricing ONLY. Never injects or invents raw-material prices from databases or AI.
 * 2. Explicit zero (costPerKg = 0) is a valid user entry and distinguishable from missing/unknown.
 * 3. ingredientCost = ingredientWeightKg * userEnteredCostPerKg
 * 4. Total Batch Cost = SUM(ingredientCost)
 * 5. Finished Formula Cost/kg = Total Batch Cost / Total Batch Weight
 * 6. Incomplete pricing exposes PARTIAL_PRICING and blocks false complete costing.
 */
export function calculateFormulaCost(
  ingredients: FormulationIngredient[] = [],
  batchSizeKg: number = 100
): FormulaCostReport {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  const hasValidBatchSize = typeof batchSizeKg === 'number' && Number.isFinite(batchSizeKg) && batchSizeKg > 0;
  const validBatchSize = hasValidBatchSize ? batchSizeKg : Number.NaN;

  let totalBatchCost = 0;
  let missingPriceCount = 0;
  let completePriceCount = 0;
  let activeIngredientsCount = 0;
  let invalidPercentageCount = 0;
  let invalidPriceCount = 0;
  let formulaTotalPercentage = 0;
  let actualKnownWeightKg = 0;
  const missingIngredientIds: string[] = [];
  const warnings: string[] = [];

  if (safeList.length === 0) warnings.push('EMPTY_FORMULA: No ingredient composition was supplied.');
  if (!hasValidBatchSize) warnings.push('INVALID_BATCH_SIZE: Batch size must be a finite value greater than zero.');

  const rawItems = safeList.map((ing, idx) => {
    const rawPctValue = ing?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? (ing as any)?.rawPercent;
    const rawPct = rawPctValue === undefined || rawPctValue === null || (typeof rawPctValue === 'string' && rawPctValue.trim() === '')
      ? Number.NaN
      : Number(rawPctValue);
    const hasValidPercentage = Number.isFinite(rawPct) && rawPct >= 0 && rawPct <= 100;

    if (hasValidPercentage) {
      formulaTotalPercentage += rawPct;
      if (hasValidBatchSize) actualKnownWeightKg += (rawPct / 100) * validBatchSize;
    } else {
      invalidPercentageCount++;
      warnings.push(`INVALID_INGREDIENT_PERCENTAGE: ${ing?.name || `Ingredient ${idx + 1}`} has a missing or invalid percentage.`);
    }

    // Distinguish an intentionally entered zero price from missing/invalid pricing.
    const rawPrice = ing?.costPerKg ?? (ing as any)?.rawMaterialCostPerKg ?? (ing as any)?.cost ?? (ing as any)?.unitCost;
    const isMissingPrice = rawPrice === undefined || rawPrice === null || rawPrice === '';
    const parsedPrice = isMissingPrice ? Number.NaN : Number(rawPrice);
    const hasValidPrice = !isMissingPrice && Number.isFinite(parsedPrice) && parsedPrice >= 0;
    const isInvalidPrice = !isMissingPrice && !hasValidPrice;
    const userPrice = hasValidPrice ? parsedPrice : null;
    const numericPrice = hasValidPrice ? parsedPrice : 0;

    const ingId = ing?.id || `ing-${idx}`;
    const hasPositiveValidPercentage = hasValidPercentage && rawPct > 0;
    if (hasPositiveValidPercentage) {
      activeIngredientsCount++;
      if (hasValidPrice) {
        completePriceCount++;
      } else if (isInvalidPrice) {
        invalidPriceCount++;
        missingIngredientIds.push(ingId);
        warnings.push(`INVALID_INGREDIENT_PRICE: ${ing?.name || ingId} has a non-finite or negative price.`);
      } else {
        missingPriceCount++;
        missingIngredientIds.push(ingId);
      }
    }

    const weightKg = hasValidPercentage && hasValidBatchSize ? (rawPct / 100) * validBatchSize : Number.NaN;
    const totalCost = hasPositiveValidPercentage && hasValidBatchSize && hasValidPrice
      ? weightKg * numericPrice
      : 0;
    totalBatchCost += totalCost;

    return {
      id: ingId,
      name: ing?.name || `Ingredient ${idx + 1}`,
      percentage: rawPct,
      weightKg: Number.isFinite(weightKg) ? Number(weightKg.toFixed(4)) : Number.NaN,
      costPerKg: hasValidPrice ? Number(numericPrice.toFixed(2)) : Number.NaN,
      userPrice,
      totalCost: hasValidPrice && hasPositiveValidPercentage && hasValidBatchSize ? Number(totalCost.toFixed(2)) : Number.NaN,
      hasUserPrice: hasValidPrice,
      pricingStatus: (hasValidPrice ? 'EXPLICIT_USER_PRICE' : (isInvalidPrice ? 'INVALID_PRICE' : 'MISSING_PRICE')) as IngredientPricingStatus,
      costPercentageOfTotal: 0
    };
  });

  const isMassBalanced = safeList.length > 0 &&
    invalidPercentageCount === 0 &&
    Number.isFinite(formulaTotalPercentage) &&
    Math.abs(formulaTotalPercentage - 100) <= 0.05;
  const massBalanceStatus: FormulaCostReport['massBalanceStatus'] =
    invalidPercentageCount > 0 ? 'INVALID' :
    formulaTotalPercentage < 99.95 ? 'INCOMPLETE' :
    formulaTotalPercentage > 100.05 ? 'EXCESS' : 'BALANCED';

  if (invalidPercentageCount === 0 && !isMassBalanced) {
    warnings.push(`FORMULA_MASS_BALANCE_${massBalanceStatus}: Ingredient percentages sum to ${formulaTotalPercentage.toFixed(3)}%, not 100.000%.`);
  }

  const isComplete =
    hasValidBatchSize &&
    isMassBalanced &&
    activeIngredientsCount > 0 &&
    missingPriceCount === 0 &&
    invalidPriceCount === 0;

  let pricingStatus: FormulaPricingStatus = 'UNKNOWN';
  let costLabel: FormulaCostReport['costLabel'] = 'COST UNAVAILABLE';

  if (activeIngredientsCount === 0) {
    pricingStatus = 'UNKNOWN';
  } else if (missingPriceCount === 0 && invalidPriceCount === 0) {
    // Pricing coverage can be complete while the formula itself is unbalanced.
    // Keep those two independent facts separate in the report.
    pricingStatus = 'COMPLETE_PRICING';
    costLabel = isMassBalanced && hasValidBatchSize ? 'TOTAL COST' : 'COST UNAVAILABLE';
  } else if (completePriceCount > 0) {
    pricingStatus = 'PARTIAL_PRICING';
    costLabel = isMassBalanced && hasValidBatchSize
      ? 'PARTIAL COST — EXCLUDES UNPRICED INGREDIENTS'
      : 'COST UNAVAILABLE';
    warnings.push(`Partial cost subtotal excludes ${missingPriceCount + invalidPriceCount} ingredient(s) with missing or invalid prices.`);
  } else {
    pricingStatus = 'NO_PRICING';
  }

  const ingredientCosts: IngredientCostItem[] = rawItems.map(item => ({
    ...item,
    costPercentageOfTotal: totalBatchCost > 0 && Number.isFinite(item.totalCost)
      ? Number(((item.totalCost / totalBatchCost) * 100).toFixed(1))
      : 0
  }));

  let status: FormulaCostReport['status'] = 'COMPLETE';
  let statusMessage = 'Formula mass balance and all ingredient prices are complete.';
  if (!hasValidBatchSize) {
    status = 'BATCH SIZE REQUIRED';
    statusMessage = 'A finite batch size greater than zero is required. No default batch size is substituted for an explicitly invalid value.';
  } else if (invalidPercentageCount > 0 || !isMassBalanced) {
    status = 'FORMULA INPUT REQUIRED';
    statusMessage = `Formula percentages are ${massBalanceStatus.toLowerCase()} (total ${Number.isFinite(formulaTotalPercentage) ? formulaTotalPercentage.toFixed(3) + '%' : 'unknown'}). Correct the ingredient percentages before calculating finished-product cost per kg.`;
  } else if (!isComplete) {
    status = 'PRICE INPUT REQUIRED';
    statusMessage = 'Enter a valid non-negative price for every ingredient with a non-zero percentage.';
  }

  return {
    ingredientCosts,
    totalBatchWeightKg: Number.isFinite(actualKnownWeightKg) ? Number(actualKnownWeightKg.toFixed(3)) : Number.NaN,
    totalBatchCost: Number(totalBatchCost.toFixed(2)),
    costPerKg: isComplete ? Number((totalBatchCost / validBatchSize).toFixed(2)) : Number.NaN,
    isComplete,
    pricingStatus,
    missingPriceCount,
    completePriceCount,
    totalIngredientsCount: activeIngredientsCount,
    pricedIngredientCount: completePriceCount,
    unpricedIngredientCount: missingPriceCount + invalidPriceCount,
    invalidPercentageCount,
    invalidPriceCount,
    formulaTotalPercentage: Number.isFinite(formulaTotalPercentage) ? Number(formulaTotalPercentage.toFixed(3)) : Number.NaN,
    isMassBalanced,
    massBalanceStatus,
    missingIngredientIds,
    warnings,
    costLabel,
    status,
    statusMessage
  };
}

export type CommercialMarginStatus = 'COMPLETE' | 'PRICING_INCOMPLETE';

export interface CommercialMarginChain {
  status: CommercialMarginStatus;
  missingInputs: string[];
  isComplete: boolean;
  rawMaterialCostPerKg: number;
  batchRawMaterialCost: number;
  manufacturingOverhead: number;
  manufacturingCost: number;
  packagingCost: number;
  finalExFactoryCost: number;
  suggestedDistributor: number;
  suggestedWholesale: number;
  suggestedRetail: number;
  suggestedMRP: number;
}

function roundCurrency(val: number): number {
  return Number(val.toFixed(2));
}

export function calculateCommercialMarginChain(
  ingredients: FormulationIngredient[],
  batchSizeKg: number = 100,
  overheadPct: number = 12,
  packagingCost: number = 15
): CommercialMarginChain {
  const costReport = calculateFormulaCost(ingredients, batchSizeKg);

  if (!costReport.isComplete) {
    return {
      status: 'PRICING_INCOMPLETE',
      isComplete: false,
      missingInputs: costReport.missingIngredientIds,
      rawMaterialCostPerKg: 0,
      batchRawMaterialCost: 0,
      manufacturingOverhead: 0,
      manufacturingCost: 0,
      packagingCost: packagingCost,
      finalExFactoryCost: 0,
      suggestedDistributor: 0,
      suggestedWholesale: 0,
      suggestedRetail: 0,
      suggestedMRP: 0
    };
  }

  const rawMaterialCostPerKg = costReport.costPerKg;
  const batchRawMaterialCost = roundCurrency(rawMaterialCostPerKg * batchSizeKg);
  const manufacturingOverhead = roundCurrency(rawMaterialCostPerKg * (overheadPct / 100));
  const manufacturingCost = roundCurrency(rawMaterialCostPerKg + manufacturingOverhead);
  const finalExFactoryCost = roundCurrency(manufacturingCost + packagingCost);

  const suggestedDistributor = roundCurrency(finalExFactoryCost * 1.15);
  const suggestedWholesale = roundCurrency(finalExFactoryCost * 1.20);
  const suggestedRetail = roundCurrency(finalExFactoryCost * 1.25);
  const suggestedMRP = roundCurrency(suggestedRetail * 1.18);

  return {
    status: 'COMPLETE',
    isComplete: true,
    missingInputs: [],
    rawMaterialCostPerKg,
    batchRawMaterialCost,
    manufacturingOverhead,
    manufacturingCost,
    packagingCost,
    finalExFactoryCost,
    suggestedDistributor,
    suggestedWholesale,
    suggestedRetail,
    suggestedMRP
  };
}


import { FormulationIngredient } from '../types';

export type IngredientPricingStatus =
  | 'EXPLICIT_USER_PRICE'
  | 'MISSING_PRICE'
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
  missingIngredientIds: string[];
  warnings: string[];
  costLabel: 'TOTAL COST' | 'PARTIAL COST — EXCLUDES UNPRICED INGREDIENTS' | 'COST UNAVAILABLE';
  status: 'COMPLETE' | 'PRICE INPUT REQUIRED';
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
  const validBatchSize = typeof batchSizeKg === 'number' && !isNaN(batchSizeKg) && batchSizeKg > 0 ? batchSizeKg : 100;

  let totalBatchCost = 0;
  let missingPriceCount = 0;
  let completePriceCount = 0;
  let activeIngredientsCount = 0;
  const missingIngredientIds: string[] = [];
  const warnings: string[] = [];

  const rawItems = safeList.map((ing, idx) => {
    const rawPct = Number(ing.percentage ?? (ing as any).percent ?? (ing as any).percentageInFormula ?? 0);
    const weightKg = (rawPct / 100) * validBatchSize;

    // Distinguish between explicit user-entered price (including 0) and missing price
    const rawPrice = ing.costPerKg ?? (ing as any).rawMaterialCostPerKg ?? (ing as any).cost ?? (ing as any).unitCost;
    const isMissing = rawPrice === undefined || rawPrice === null || rawPrice === '' || isNaN(Number(rawPrice));
    const hasPrice = !isMissing && Number(rawPrice) >= 0;
    const userPrice = hasPrice ? Number(rawPrice) : null;
    const numericPrice = hasPrice ? Math.max(0, Number(rawPrice)) : 0;

    const totalCost = weightKg * numericPrice;
    totalBatchCost += totalCost;

    const ingId = ing.id || `ing-${idx}`;

    if (rawPct > 0) {
      activeIngredientsCount++;
      if (hasPrice) {
        completePriceCount++;
      } else {
        missingPriceCount++;
        missingIngredientIds.push(ingId);
      }
    }

    return {
      id: ingId,
      name: ing.name || `Ingredient ${idx + 1}`,
      percentage: rawPct,
      weightKg: Number(weightKg.toFixed(4)),
      costPerKg: Number(numericPrice.toFixed(2)),
      userPrice,
      totalCost: Number(totalCost.toFixed(2)),
      hasUserPrice: hasPrice,
      pricingStatus: (hasPrice ? 'EXPLICIT_USER_PRICE' : 'MISSING_PRICE') as IngredientPricingStatus,
      costPercentageOfTotal: 0
    };
  });

  const costPerKg = validBatchSize > 0 ? (totalBatchCost / validBatchSize) : 0;

  const ingredientCosts: IngredientCostItem[] = rawItems.map(item => ({
    ...item,
    costPercentageOfTotal: totalBatchCost > 0 ? Number(((item.totalCost / totalBatchCost) * 100).toFixed(1)) : 0
  }));

  const isComplete = activeIngredientsCount > 0 && missingPriceCount === 0;

  let pricingStatus: FormulaPricingStatus = 'UNKNOWN';
  let costLabel: FormulaCostReport['costLabel'] = 'COST UNAVAILABLE';

  if (activeIngredientsCount === 0) {
    pricingStatus = 'UNKNOWN';
    costLabel = 'COST UNAVAILABLE';
  } else if (missingPriceCount === 0) {
    pricingStatus = 'COMPLETE_PRICING';
    costLabel = 'TOTAL COST';
  } else if (completePriceCount > 0) {
    pricingStatus = 'PARTIAL_PRICING';
    costLabel = 'PARTIAL COST — EXCLUDES UNPRICED INGREDIENTS';
    warnings.push(`Partial cost estimate excludes ${missingPriceCount} unpriced ingredient${missingPriceCount > 1 ? 's' : ''}.`);
  } else {
    pricingStatus = 'NO_PRICING';
    costLabel = 'COST UNAVAILABLE';
    warnings.push('No ingredient prices configured.');
  }

  return {
    ingredientCosts,
    totalBatchWeightKg: Number(validBatchSize.toFixed(3)),
    totalBatchCost: Number(totalBatchCost.toFixed(2)),
    costPerKg: Number(costPerKg.toFixed(2)),
    isComplete,
    pricingStatus,
    missingPriceCount,
    completePriceCount,
    totalIngredientsCount: activeIngredientsCount,
    pricedIngredientCount: completePriceCount,
    unpricedIngredientCount: missingPriceCount,
    missingIngredientIds,
    warnings,
    costLabel,
    status: isComplete ? "COMPLETE" : "PRICE INPUT REQUIRED",
    statusMessage: isComplete
      ? "All ingredient prices configured. Commercial cost calculated."
      : missingPriceCount === activeIngredientsCount
      ? "Enter raw-material prices (₹/kg) to calculate formula cost."
      : `${missingPriceCount} ingredient price${missingPriceCount > 1 ? 's' : ''} missing. Enter raw-material prices for complete costing.`
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


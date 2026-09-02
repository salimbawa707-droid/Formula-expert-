import { FormulationIngredient } from '../types';

export interface IngredientCostItem {
  id: string;
  name: string;
  percentage: number;
  weightKg: number;
  costPerKg: number;
  totalCost: number;
  hasUserPrice: boolean;
  costPercentageOfTotal: number;
}

export interface FormulaCostReport {
  ingredientCosts: IngredientCostItem[];
  totalBatchWeightKg: number;
  totalBatchCost: number;
  costPerKg: number;
  isComplete: boolean;
  missingPriceCount: number;
  completePriceCount: number;
  totalIngredientsCount: number;
  status: "COMPLETE" | "PRICE INPUT REQUIRED";
  statusMessage: string;
}

/**
 * Authoritative Commercial Costing Calculator.
 * 
 * Rules:
 * 1. User-controlled pricing ONLY. Never injects or invents raw-material prices from databases or AI.
 * 2. ingredientCost = ingredientWeightKg * userEnteredCostPerKg
 * 3. Total Batch Cost = SUM(ingredientCost)
 * 4. Finished Formula Cost/kg = Total Batch Cost / Total Batch Weight
 * 5. Scale invariant unit cost: Finished Formula Cost/kg remains constant when batch size scales.
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

  const rawItems = safeList.map((ing, idx) => {
    const rawPct = Number(ing.percentage ?? (ing as any).percent ?? (ing as any).percentageInFormula ?? 0);
    const weightKg = (rawPct / 100) * validBatchSize;

    // User-entered costPerKg ONLY
    const rawPrice = ing.costPerKg ?? (ing as any).rawMaterialCostPerKg ?? (ing as any).cost ?? (ing as any).unitCost;
    const hasPrice = rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0;
    const userPrice = (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))) ? Math.max(0, Number(rawPrice)) : 0;

    const totalCost = weightKg * userPrice;
    totalBatchCost += totalCost;

    if (rawPct > 0) {
      activeIngredientsCount++;
      if (hasPrice) {
        completePriceCount++;
      } else {
        missingPriceCount++;
      }
    }

    return {
      id: ing.id || `ing-${idx}`,
      name: ing.name || `Ingredient ${idx + 1}`,
      percentage: rawPct,
      weightKg: Number(weightKg.toFixed(4)),
      costPerKg: Number(userPrice.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      hasUserPrice: hasPrice,
      costPercentageOfTotal: 0
    };
  });

  const costPerKg = validBatchSize > 0 ? (totalBatchCost / validBatchSize) : 0;

  const ingredientCosts: IngredientCostItem[] = rawItems.map(item => ({
    ...item,
    costPercentageOfTotal: totalBatchCost > 0 ? Number(((item.totalCost / totalBatchCost) * 100).toFixed(1)) : 0
  }));

  const isComplete = activeIngredientsCount > 0 && missingPriceCount === 0;

  return {
    ingredientCosts,
    totalBatchWeightKg: Number(validBatchSize.toFixed(3)),
    totalBatchCost: Number(totalBatchCost.toFixed(2)),
    costPerKg: Number(costPerKg.toFixed(2)),
    isComplete,
    missingPriceCount,
    completePriceCount,
    totalIngredientsCount: activeIngredientsCount,
    status: isComplete ? "COMPLETE" : "PRICE INPUT REQUIRED",
    statusMessage: isComplete
      ? "All ingredient prices configured. Commercial cost calculated."
      : missingPriceCount === activeIngredientsCount
      ? "Enter raw-material prices (₹/kg) to calculate formula cost."
      : `${missingPriceCount} ingredient price${missingPriceCount > 1 ? 's' : ''} missing. Enter raw-material prices for complete costing.`
  };
}

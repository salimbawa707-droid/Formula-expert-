import { ClassifiedIngredient, PowderCostingReport } from './types';

export function calculatePowderCosting(
  classifiedIngredients: ClassifiedIngredient[],
  batchSizeKg: number = 100,
  washDoseG: number = 50
): PowderCostingReport {
  let costPerKg = 0;
  let hasZeroCost = false;

  const contributions = classifiedIngredients.map((ing) => {
    const pct = ing.inputPercentage;
    const price = ing.costPerKg || 0;
    if (pct > 0 && price === 0) hasZeroCost = true;

    const costContribution = (pct / 100) * price;
    costPerKg += costContribution;

    return {
      name: ing.name,
      percentage: Number(pct.toFixed(2)),
      costPerKg: price,
      costContribution: Number(costContribution.toFixed(4)),
      costPercentage: 0 // Will be computed after total cost is known
    };
  });

  const finalCostPerKg = Number(costPerKg.toFixed(4));
  const totalBatchCost = Number((finalCostPerKg * batchSizeKg).toFixed(2));
  const costPerWashDose = Number(((washDoseG / 1000) * finalCostPerKg).toFixed(4));

  contributions.forEach((c) => {
    c.costPercentage = finalCostPerKg > 0 ? Number(((c.costContribution / finalCostPerKg) * 100).toFixed(1)) : 0;
  });

  return {
    costPerKg: finalCostPerKg,
    totalBatchCost,
    batchSizeKg,
    costPerWashDose,
    hasZeroCostIngredients: hasZeroCost,
    ingredientCostContributions: contributions,
    source: 'CALCULATED'
  };
}

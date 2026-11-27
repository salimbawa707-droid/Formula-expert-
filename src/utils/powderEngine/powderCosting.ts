import { ClassifiedIngredient, PowderCostingReport } from './types';

export function calculatePowderCosting(
  classifiedIngredients: ClassifiedIngredient[],
  batchSizeKg?: number | null,
  washDoseG?: number
): PowderCostingReport {
  const validBatchSize =
    typeof batchSizeKg === 'number' &&
    Number.isFinite(batchSizeKg) &&
    batchSizeKg > 0
      ? batchSizeKg
      : null;

  let costPerKg = 0;
  let hasZeroCost = false;
  const missingCostIngredients: string[] = [];
  const invalidCostIngredients: string[] = [];
  const invalidPercentageIngredients: string[] = [];

  const safeIngredients = Array.isArray(classifiedIngredients) ? classifiedIngredients : [];
  const contributions = safeIngredients.map((ing) => {
    const rawPct = ing.inputPercentage;
    const pctIsValid = Number.isFinite(rawPct) && rawPct >= 0 && rawPct <= 100;
    const pct = pctIsValid ? rawPct : 0;
    if (!pctIsValid) invalidPercentageIngredients.push(ing.name);

    const rawPrice = ing.costPerKg;
    const isMissingPrice = Number.isNaN(rawPrice);
    const priceIsValid = Number.isFinite(rawPrice) && rawPrice >= 0;
    const price = priceIsValid ? rawPrice : 0;
    if (isMissingPrice) missingCostIngredients.push(ing.name);
    else if (!priceIsValid) invalidCostIngredients.push(ing.name);
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

  const hasInvalidInputs = missingCostIngredients.length > 0 || invalidCostIngredients.length > 0 || invalidPercentageIngredients.length > 0;
  const finalCostPerKg = Number(costPerKg.toFixed(4));
  const validWashDose = typeof washDoseG === 'number' && Number.isFinite(washDoseG) && washDoseG > 0 ? washDoseG : null;
  const costPerWashDose = validWashDose === null || hasInvalidInputs
    ? null
    : Number(((validWashDose / 1000) * finalCostPerKg).toFixed(4));

  contributions.forEach((c) => {
    c.costPercentage = finalCostPerKg > 0 ? Number(((c.costContribution / finalCostPerKg) * 100).toFixed(1)) : 0;
  });

  if (validBatchSize === null || hasInvalidInputs) {
    return {
      costPerKg: hasInvalidInputs ? null : finalCostPerKg,
      totalBatchCost: null,
      batchSizeKg: validBatchSize,
      costPerWashDose,
      hasZeroCostIngredients: hasZeroCost,
      missingCostIngredients,
      invalidCostIngredients,
      invalidPercentageIngredients,
      ingredientCostContributions: contributions,
      source: 'INSUFFICIENT_DATA'
    };
  }

  const totalBatchCost = Number((finalCostPerKg * validBatchSize).toFixed(2));

  return {
    costPerKg: finalCostPerKg,
    totalBatchCost,
    batchSizeKg: validBatchSize,
    costPerWashDose,
    hasZeroCostIngredients: hasZeroCost,
    invalidCostIngredients,
    invalidPercentageIngredients,
    ingredientCostContributions: contributions,
    source: 'CALCULATED'
  };
}

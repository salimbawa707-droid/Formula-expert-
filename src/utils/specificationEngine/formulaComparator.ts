import {
  FormulaVersionSnapshot,
  FormulaComparisonReport,
  IngredientDelta,
  ParameterDelta,
  ResultSource
} from './types';
import { isValidNumber } from './unitConversions';

/**
 * Compares two formula snapshots (Formula A vs Formula B, or Version 1 vs Version 2)
 * producing an objective, provenance-aware comparison report.
 */
export function compareFormulas(
  formulaA: FormulaVersionSnapshot,
  formulaB: FormulaVersionSnapshot
): FormulaComparisonReport {
  // 1. Calculate Ingredient Composition Deltas
  const ingMap = new Map<string, { a?: (typeof formulaA.ingredients)[0]; b?: (typeof formulaB.ingredients)[0] }>();

  for (const ing of formulaA.ingredients) {
    const key = ing.name.trim().toLowerCase();
    if (!ingMap.has(key)) ingMap.set(key, {});
    ingMap.get(key)!.a = ing;
  }

  for (const ing of formulaB.ingredients) {
    const key = ing.name.trim().toLowerCase();
    if (!ingMap.has(key)) ingMap.set(key, {});
    ingMap.get(key)!.b = ing;
  }

  const ingredientDeltas: IngredientDelta[] = [];

  for (const [, pair] of ingMap.entries()) {
    const name = pair.a?.name || pair.b?.name || 'Unknown';
    const pctA = pair.a?.percentage ?? 0;
    const pctB = pair.b?.percentage ?? 0;
    const deltaPct = pctB - pctA;

    const activeA = pair.a?.activeMatterPct ?? 0;
    const activeB = pair.b?.activeMatterPct ?? 0;
    const deltaActiveMatter = (pctB * activeB / 100) - (pctA * activeA / 100);

    const costA = pair.a?.costPerKg ?? 0;
    const costB = pair.b?.costPerKg ?? 0;
    const deltaCost = costB - costA;

    let changeType: IngredientDelta['changeType'] = 'UNCHANGED';
    if (!pair.a && pair.b) changeType = 'ADDED';
    else if (pair.a && !pair.b) changeType = 'REMOVED';
    else if (Math.abs(deltaPct) > 0.001 || Math.abs(costB - costA) > 0.001) changeType = 'MODIFIED';

    ingredientDeltas.push({
      name,
      pctA,
      pctB,
      deltaPct,
      activeMatterA: activeA,
      activeMatterB: activeB,
      deltaActiveMatter,
      costA,
      costB,
      deltaCost,
      changeType
    });
  }

  // 2. Calculate Key Parameter Deltas
  const parameterDeltas: ParameterDelta[] = [];

  const addParamDelta = (
    key: string,
    name: string,
    unit: any,
    valA: number | undefined,
    provA: ResultSource,
    valB: number | undefined,
    provB: ResultSource
  ) => {
    const validA = valA !== undefined && isValidNumber(valA);
    const validB = valB !== undefined && isValidNumber(valB);

    let displayA = validA ? `${valA!.toFixed(2)} ${unit === 'none' ? '' : unit}`.trim() : 'INSUFFICIENT_DATA';
    let displayB = validB ? `${valB!.toFixed(2)} ${unit === 'none' ? '' : unit}`.trim() : 'INSUFFICIENT_DATA';
    let delta: number | undefined = undefined;
    let deltaDisplay = 'N/A';
    let status: ParameterDelta['status'] = 'INSUFFICIENT_DATA';

    if (validA && validB) {
      delta = valB! - valA!;
      const sign = delta > 0 ? '+' : '';
      deltaDisplay = `${sign}${delta.toFixed(2)} ${unit === 'none' ? '' : unit}`.trim();
      if (Math.abs(delta) < 0.001) status = 'UNCHANGED';
      else status = 'DIFFERENT';
    }

    parameterDeltas.push({
      parameterKey: key,
      parameterName: name,
      unit,
      valueA: valA,
      valueB: valB,
      displayA,
      displayB,
      provenanceA: provA,
      provenanceB: provB,
      delta,
      deltaDisplay,
      status
    });
  };

  addParamDelta('massBalance', 'Formula Mass Total', '%', formulaA.totalPercentage, 'CALCULATED', formulaB.totalPercentage, 'CALCULATED');
  addParamDelta('activeMatter', 'Total Surfactant Active', '%', formulaA.activeMatterPct, 'CALCULATED', formulaB.activeMatterPct, 'CALCULATED');
  addParamDelta('ph', 'Equilibrium pH', 'pH units', formulaA.measuredPH, formulaA.measuredPH !== undefined ? 'MEASURED' : 'INSUFFICIENT_DATA', formulaB.measuredPH, formulaB.measuredPH !== undefined ? 'MEASURED' : 'INSUFFICIENT_DATA');
  addParamDelta('costPerKg', 'Formula Cost / kg', '₹/kg', formulaA.costPerKg, 'CALCULATED', formulaB.costPerKg, 'CALCULATED');
  addParamDelta('totalBatchCost', 'Total Batch Cost', '₹/batch', formulaA.totalBatchCost, 'CALCULATED', formulaB.totalBatchCost, 'CALCULATED');

  // 3. Mass Balance
  const unassignedA = Math.max(0, 100 - formulaA.totalPercentage);
  const unassignedB = Math.max(0, 100 - formulaB.totalPercentage);

  // 4. Cost Delta
  const deltaCostPerKg = formulaB.costPerKg - formulaA.costPerKg;
  const deltaTotalBatchCost = formulaB.totalBatchCost - formulaA.totalBatchCost;

  // 5. Summary Insights
  const summaryInsights: string[] = [];
  if (Math.abs(formulaB.activeMatterPct - formulaA.activeMatterPct) > 0.05) {
    const dir = formulaB.activeMatterPct > formulaA.activeMatterPct ? 'increased' : 'reduced';
    summaryInsights.push(`Total active surfactant matter was ${dir} by ${Math.abs(formulaB.activeMatterPct - formulaA.activeMatterPct).toFixed(2)} percentage points.`);
  }

  if (Math.abs(deltaCostPerKg) > 0.05) {
    const dir = deltaCostPerKg > 0 ? 'increased' : 'decreased';
    summaryInsights.push(`Raw material cost per kilogram ${dir} by ₹${Math.abs(deltaCostPerKg).toFixed(2)} / kg.`);
  }

  const addedCount = ingredientDeltas.filter(i => i.changeType === 'ADDED').length;
  const removedCount = ingredientDeltas.filter(i => i.changeType === 'REMOVED').length;
  const modifiedCount = ingredientDeltas.filter(i => i.changeType === 'MODIFIED').length;

  summaryInsights.push(`Recipe changes: ${modifiedCount} modified, ${addedCount} added, ${removedCount} removed raw materials.`);

  return {
    titleA: formulaA.formulaName,
    versionA: formulaA.versionNumber,
    categoryA: formulaA.productCategory,
    titleB: formulaB.formulaName,
    versionB: formulaB.versionNumber,
    categoryB: formulaB.productCategory,
    batchSizeKgA: formulaA.batchSizeKg,
    batchSizeKgB: formulaB.batchSizeKg,
    ingredientDeltas,
    parameterDeltas,
    massBalanceA: { totalPct: formulaA.totalPercentage, unassignedPct: unassignedA },
    massBalanceB: { totalPct: formulaB.totalPercentage, unassignedPct: unassignedB },
    costDelta: {
      costPerKgA: formulaA.costPerKg,
      costPerKgB: formulaB.costPerKg,
      deltaCostPerKg,
      totalBatchCostA: formulaA.totalBatchCost,
      totalBatchCostB: formulaB.totalBatchCost,
      deltaTotalBatchCost
    },
    verdictA: formulaA.specReport?.verdict.status,
    verdictB: formulaB.specReport?.verdict.status,
    summaryInsights
  };
}

/**
 * Computes Change Impact Analysis for a single ingredient modification
 */
export function analyzeIngredientChangeImpact(
  ingredientName: string,
  oldPct: number,
  newPct: number,
  activeMatterPct: number = 100,
  costPerKg: number = 0,
  category: string = ''
): {
  impacts: Array<{ metric: string; delta: number; unit: string; description: string }>;
} {
  const deltaPct = newPct - oldPct;
  const deltaActive = (deltaPct * activeMatterPct) / 100;
  const deltaCost = (deltaPct / 100) * costPerKg;
  const catLabel = category ? ` (${category})` : '';

  const impacts = [
    {
      metric: 'Formula Mass Total',
      delta: deltaPct,
      unit: '%',
      description: deltaPct > 0 ? `Adds ${deltaPct.toFixed(2)}% of ${ingredientName}${catLabel} to formula mass balance.` : `Deducts ${Math.abs(deltaPct).toFixed(2)}% of ${ingredientName}${catLabel} from formula mass balance.`
    },
    {
      metric: 'Active Surfactant Matter',
      delta: deltaActive,
      unit: '%',
      description: Math.abs(deltaActive) > 0.001 
        ? `${deltaActive > 0 ? 'Increases' : 'Decreases'} active matter by ${Math.abs(deltaActive).toFixed(2)} percentage points via ${ingredientName}.`
        : `Zero direct active matter change from ${ingredientName}.`
    },
    {
      metric: 'Raw Material Cost Contribution',
      delta: deltaCost,
      unit: '₹/kg',
      description: Math.abs(deltaCost) > 0.001 
        ? `${deltaCost > 0 ? 'Increases' : 'Decreases'} raw material batch cost by ₹${Math.abs(deltaCost).toFixed(2)} / kg via ${ingredientName}.`
        : `No direct cost impact from ${ingredientName}.`
    }
  ];

  return { impacts };
}

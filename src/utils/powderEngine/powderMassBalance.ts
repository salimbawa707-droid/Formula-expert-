import { FormulationIngredient } from '../../types';
import { PowderMassBalanceReport } from './types';

/**
 * Calculates strict dry-formulation mass balance for detergent powders.
 * 
 * Rules:
 * - Handled strictly as dry-formulation mass balance.
 * - Missing percentage is reported as an explicit unassigned amount.
 * - ZERO automatic filler or builder recommendation to fill the missing mass.
 * - ZERO automatic water conversion.
 */
export function calculatePowderMassBalance(ingredients: FormulationIngredient[]): PowderMassBalanceReport {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  
  const rawSum = safeList.reduce((acc, ing) => {
    const pct = Number((ing as any)?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0);
    return acc + (isNaN(pct) ? 0 : pct);
  }, 0);

  const formulaTotalPct = Number(rawSum.toFixed(4));
  const assignedPercentage = Number(formulaTotalPct.toFixed(2));
  const diff = Number((100 - formulaTotalPct).toFixed(4));

  if (Math.abs(diff) < 0.01) {
    return {
      assignedPercentage: 100.0,
      unassignedPercentage: 0,
      formulaTotalPct: 100.0,
      status: 'BALANCED',
      missingPercentage: 0,
      excessPercentage: 0,
      statusMessage: '100.00% Balanced Powder Formula — All dry constituents, active surfactants, builders, and functional additives sum to complete batch.',
      source: 'CALCULATED'
    };
  } else if (diff > 0) {
    const missingPercentage = Number(diff.toFixed(2));
    const unassignedPercentage = missingPercentage;
    return {
      assignedPercentage,
      unassignedPercentage,
      formulaTotalPct: assignedPercentage,
      status: 'INCOMPLETE',
      missingPercentage,
      excessPercentage: 0,
      statusMessage: `FORMULA INCOMPLETE: Assigned formulation = ${assignedPercentage.toFixed(2)}%, Unassigned formulation = ${unassignedPercentage.toFixed(2)}%. Formula is unassigned by ${missingPercentage.toFixed(2)} percentage points. In powder technology, batch mass balance must be fulfilled with solid raw materials by formulator assignment — do NOT add water.`,
      source: 'CALCULATED'
    };
  } else {
    const excessPercentage = Number(Math.abs(diff).toFixed(2));
    return {
      assignedPercentage,
      unassignedPercentage: 0,
      formulaTotalPct: assignedPercentage,
      status: 'EXCESS',
      missingPercentage: 0,
      excessPercentage,
      statusMessage: `EXCESS / OVER-100% POWDER FORMULA: Formula sums to ${assignedPercentage.toFixed(2)}% (exceeds 100.00% by ${excessPercentage.toFixed(2)} percentage points). Re-normalize ingredient quantities.`,
      source: 'CALCULATED'
    };
  }
}

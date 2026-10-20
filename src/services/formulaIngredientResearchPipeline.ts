import { ActiveFormulaState, FormulationIngredient } from '../types';
import { IngredientResearchBridge } from './ingredientResearchBridge';

export interface FormulaIngredientResearchOptions {
  grade?: string;
  apiKey?: string;
  jurisdiction?: 'IN' | 'EU' | 'US';
}

export interface FormulaIngredientResearchResult {
  formula: ActiveFormulaState;
  researchedCount: number;
  cachedCount: number;
  unresolved: string[];
  warnings: string[];
  calculationReady: boolean;
}

/**
 * Calculation boundary for researched ingredients.
 *
 * This is deliberately separate from the UI: formula calculation receives only
 * ingredients that have a local-library match or source-backed research that
 * does not require approval. Unknown, conflicting, or incomplete evidence is
 * kept out of the calculation-ready formula rather than silently guessing.
 */
export async function prepareFormulaForCalculation(
  formula: ActiveFormulaState,
  options: FormulaIngredientResearchOptions = {}
): Promise<FormulaIngredientResearchResult> {
  const unresolved: string[] = [];
  const warnings: string[] = [];
  let researchedCount = 0;
  let cachedCount = 0;

  const resolvedIngredients: FormulationIngredient[] = [];

  for (const ingredient of formula.ingredients) {
    const result = await IngredientResearchBridge.resolveForFormula(ingredient.name, options);

    if (!result.ingredient) {
      unresolved.push(ingredient.name);
      if (result.warning) warnings.push(`${ingredient.name}: ${result.warning}`);
      continue;
    }

    if (result.source === 'WEB_RESEARCH') researchedCount += 1;
    if (result.source === 'RESEARCH_CACHE') cachedCount += 1;

    // Never discard the user's formula quantity/position when enriching the
    // ingredient with research-backed properties.
    const merged: FormulationIngredient = {
      ...result.ingredient,
      id: ingredient.id ?? result.ingredient.id,
      name: result.ingredient.name || ingredient.name,
      percent: ingredient.percent,
      percentage: ingredient.percentage,
      percentageInFormula: ingredient.percentageInFormula,
      costPerKg: result.ingredient.costPerKg ?? ingredient.costPerKg,
      notes: [ingredient.notes, result.ingredient.notes, result.warning]
        .filter(Boolean)
        .join(' | ')
        .trim()
    };

    if (result.requiresUserApproval) {
      unresolved.push(ingredient.name);
      warnings.push(
        `${ingredient.name}: research exists but requires verification before calculation/release.`
      );
      continue;
    }

    resolvedIngredients.push(merged);
  }

  const calculationReady = unresolved.length === 0;

  return {
    formula: {
      ...formula,
      ingredients: resolvedIngredients
    },
    researchedCount,
    cachedCount,
    unresolved,
    warnings,
    calculationReady
  };
}

/**
 * Strict calculation gate. Call this immediately before deterministic formula
 * calculations. It prevents incomplete AI research from entering the engine.
 */
export async function requireCalculationReadyFormula(
  formula: ActiveFormulaState,
  options: FormulaIngredientResearchOptions = {}
): Promise<ActiveFormulaState> {
  const result = await prepareFormulaForCalculation(formula, options);
  if (!result.calculationReady) {
    throw new Error(
      `Formula is not calculation-ready. Verification required for: ${result.unresolved.join(', ')}`
    );
  }
  return result.formula;
}

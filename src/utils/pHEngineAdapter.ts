import { FormulationIngredient, IngredientInput } from '../types';

/**
 * Standardized pure adapter that maps a single application FormulationIngredient
 * into the exact IngredientInput format required by pHEngine.
 *
 * Mappings:
 * - name: ing.name
 * - rawPercent: ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0
 * - activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity
 */
export function mapFormulationIngredientToPHEngineInput(
  ing: FormulationIngredient
): IngredientInput {
  if (!ing) {
    return {
      name: '',
      rawPercent: 0,
    };
  }

  // Determine raw percentage with explicit nullish priority
  // Preserves explicit 0 percentage without converting to fallback
  const rawPercent =
    ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;

  // Determine active concentration percentage with explicit nullish priority
  // Priority: activeMatterPct -> activePercent -> activeMatterPurity
  const activePercent =
    ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity;

  const result: IngredientInput = {
    id: ing.id,
    name: ing.name ?? '',
    category: ing.category,
    function: ing.function ?? ing.role,
    rawPercent,
    costPerKg: ing.costPerKg,
    hlb: ing.hlbValue ?? ing.hlb,
    density: ing.density,
    purity: ing.activeMatterPurity,
  };

  if (activePercent !== undefined && activePercent !== null) {
    result.activePercent = activePercent;
  }

  return result;
}

/**
 * Array-level pure helper that maps an array of FormulationIngredients
 * to IngredientInputs for pHEngine.
 */
export function mapFormulationIngredientsToPHEngineInput(
  ings: FormulationIngredient[]
): IngredientInput[] {
  if (!Array.isArray(ings)) {
    return [];
  }
  return ings.map(mapFormulationIngredientToPHEngineInput);
}

import { FormulationIngredient, IngredientInput, PHAdvancedResult, PHSimpleResult } from '../types';
import { normalizeProductCategory, ProductCategoryId } from '../domain/productTaxonomy';
import { PHCalculationOptions } from '../domain/ph/types';
import {
  INGREDIENT_DATABASE,
  calculatePHAdvanced as calculatePHAdvancedV2,
  calculatePHSimple as calculatePHSimpleV2
} from './pHEngine';

export { INGREDIENT_DATABASE };

/**
 * Preserves every formulation ingredient at the pH-engine boundary.
 * The authoritative pH engine must see the complete mass balance and decide
 * whether unknown species make the equilibrium result insufficiently identified.
 * Register known neutral excipients explicitly instead of dropping them here.
 */
export function getSolverReadyIngredients(rawIngredients: IngredientInput[]): IngredientInput[] {
  // Preserve the complete formulation mass. Filtering unknown/inert-looking
  // ingredients here would let the pH solver calculate from a partial formula
  // and bypass PHEngineV2's fail-closed unrecognized-mass guard.
  // Known neutral species should be explicitly registered as neutral in the
  // chemical species registry; they must not be silently dropped by this adapter.
  return Array.isArray(rawIngredients) ? [...rawIngredients] : [];
}

/**
 * Standardized pure adapter that maps a single application FormulationIngredient
 * into the exact IngredientInput format required by pHEngine.
 *
 * Mappings:
 * - name: ing.name
 * - rawPercent: first explicitly supplied percentage field; missing input remains unavailable
 * - activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity
 */
export function mapFormulationIngredientToPHEngineInput(
  ing: FormulationIngredient
): IngredientInput {
  if (!ing) {
    return {
      name: '',
      rawPercent: Number.NaN,
    };
  }

  // Preserve explicit zero and support the documented legacy rawPercent field.
  // Missing/blank values remain unavailable; they are never silently converted to zero.
  const rawPercentage =
    ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? (ing as any).rawPercent;
  const rawPercent =
    rawPercentage === undefined || rawPercentage === null ||
    (typeof rawPercentage === 'string' && rawPercentage.trim() === '')
      ? Number.NaN
      : Number(rawPercentage);

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

/**
 * Creates and normalizes PHCalculationOptions ensuring productCategory is canonical
 * and survives application-to-science adapter boundaries without being dropped or defaulting.
 */
export function createPHCalculationOptions(
  categoryOrId?: string,
  extraOptions?: Partial<PHCalculationOptions>
): PHCalculationOptions {
  if (!categoryOrId) {
    return { ...extraOptions };
  }
  const norm = normalizeProductCategory(categoryOrId);
  return {
    ...extraOptions,
    productCategory: norm !== 'UNKNOWN_PRODUCT_CATEGORY' ? norm : undefined
  };
}

/**
 * Authoritative adapter for calculatePHAdvanced delegating through pHEngineAdapter.
 */
export function calculatePHAdvanced(
  ingredients: IngredientInput[],
  totalMassKg: number = 100,
  options?: PHCalculationOptions | ProductCategoryId | string
): PHAdvancedResult {
  const opts: PHCalculationOptions =
    typeof options === 'string'
      ? createPHCalculationOptions(options)
      : createPHCalculationOptions(options?.productCategory, options);
  return calculatePHAdvancedV2(ingredients, totalMassKg, opts);
}

/**
 * Authoritative adapter for calculatePHSimple delegating through pHEngineAdapter.
 */
export function calculatePHSimple(
  ingredients: IngredientInput[],
  totalMassKg: number = 100,
  options?: PHCalculationOptions | ProductCategoryId | string
): PHSimpleResult {
  const opts: PHCalculationOptions =
    typeof options === 'string'
      ? createPHCalculationOptions(options)
      : createPHCalculationOptions(options?.productCategory, options);
  return calculatePHSimpleV2(ingredients, totalMassKg, opts);
}


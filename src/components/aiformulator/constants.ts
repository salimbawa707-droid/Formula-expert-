import { getIngredientCmcData, calculateMixedCMC } from "../../utils/calculators";
import {
  CANONICAL_PRODUCT_CATEGORY_IDS,
  ProductCategoryId,
  ProductCategoryDefinition,
  PRODUCT_CATEGORIES as TAXONOMY_CATEGORIES,
  PRODUCT_TAXONOMY_MAP,
  getProductCategory,
  getProductCategoryLabel,
  normalizeProductCategory,
  isValidProductCategory,
  validateProductCategory,
  validateCategoryCompatibility
} from "../../domain/productTaxonomy";

export {
  CANONICAL_PRODUCT_CATEGORY_IDS,
  type ProductCategoryId,
  type ProductCategoryDefinition,
  PRODUCT_TAXONOMY_MAP,
  getProductCategory,
  getProductCategoryLabel,
  normalizeProductCategory,
  isValidProductCategory,
  validateProductCategory,
  validateCategoryCompatibility
};

export const getIngredientCmc = (name: string): { cmcMolar: number; cmcPpm: number } | null => {
  const data = getIngredientCmcData(name);
  return data ? { cmcMolar: data.cmcMolar, cmcPpm: data.cmcPpm } : null;
};

export const calculateMixedCmc = (ingredients: any[]) => {
  return calculateMixedCMC(ingredients);
};

/**
 * List of Canonical Product Categories (Definitions)
 */
export const PRODUCT_CATEGORIES = TAXONOMY_CATEGORIES;

/**
 * List of Display Labels for UI rendering
 */
export const PRODUCT_CATEGORY_LABELS = TAXONOMY_CATEGORIES.map((c) => c.label);

export type ProductCategory = ProductCategoryId | typeof PRODUCT_CATEGORY_LABELS[number];

export interface CategoryMetadata {
  category: string;
  targetPHMin: number;
  targetPHMax: number;
  defaultPH: number;
  activeMatterMinPct: number;
  activeMatterTargetPct: number;
  foamExpectation: string;
  primaryFunction: string;
  keyConstraints: string[];
}

/**
 * Category metadata lookup map keyed by both Canonical ID and Display Label.
 */
export const CATEGORY_METADATA_MAP: Record<string, CategoryMetadata> = {};

TAXONOMY_CATEGORIES.forEach((def) => {
  const meta: CategoryMetadata = {
    category: def.label,
    targetPHMin: def.targetPHMin,
    targetPHMax: def.targetPHMax,
    defaultPH: def.defaultPH,
    activeMatterMinPct: def.activeMatterMinPct,
    activeMatterTargetPct: def.activeMatterTargetPct,
    foamExpectation: def.foamExpectation,
    primaryFunction: def.primaryFunction,
    keyConstraints: def.keyConstraints
  };
  CATEGORY_METADATA_MAP[def.id] = meta;
  CATEGORY_METADATA_MAP[def.label] = meta;
});

export const getCategoryMetadata = (category: string): CategoryMetadata => {
  const def = getProductCategory(category);
  if (def) {
    return {
      category: def.label,
      targetPHMin: def.targetPHMin,
      targetPHMax: def.targetPHMax,
      defaultPH: def.defaultPH,
      activeMatterMinPct: def.activeMatterMinPct,
      activeMatterTargetPct: def.activeMatterTargetPct,
      foamExpectation: def.foamExpectation,
      primaryFunction: def.primaryFunction,
      keyConstraints: def.keyConstraints
    };
  }
  throw new Error(`Unrecognized product category: "${category}". Expected one of the 13 canonical product categories.`);
};

export const isMetricApplicable = (
  category: string,
  metric: 'hlb' | 'cmc' | 'viscosity' | 'cleaningScore' | 'foam' | 'builder'
): boolean => {
  const def = getProductCategory(category);
  if (!def) {
    // If unknown, do not default to powder/liquid bypass
    return true;
  }
  return def.categoryApplicability[metric] ?? true;
};

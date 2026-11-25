import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';
import {
  LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS,
  AOS_LAUNDRY_EVIDENCE_REVIEWS,
  ANIONIC_SURFACTANT_EVIDENCE_REVIEWS,
  NONIONIC_SURFACTANT_EVIDENCE_REVIEWS
} from './ingredientApplicabilityEvidenceReviews';
import {
  CANONICAL_PRODUCT_CATEGORY_IDS,
  PRODUCT_TAXONOMY_MAP,
  type ProductCategoryId
} from '../domain/productTaxonomy';

/**
 * Evidence-first ingredient × product applicability review matrix.
 *
 * IMPORTANT:
 * - Taxonomy pH/active-matter values are screening targets, not supplier limits.
 * - activeDefault is a catalog default, not a verified assay.
 * - Missing chemical limits remain null; never infer a safe concentration.
 * - No pair is approved by name/category matching alone.
 */
export type ApplicabilityReviewDecision =
  | 'NOT_REVIEWED'
  | 'APPLICABLE'
  | 'CONDITIONALLY_APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN';

export interface IngredientCategoryReview {
  ingredientId: string;
  ingredientName: string;
  ingredientCatalogCategory: string;
  casNumber: string | null;
  identityType: string | null;
  chemicalRole: string | null;
  roleBasis: 'EXPLICIT_ROLE' | 'FUNCTION_DESCRIPTION' | 'MISSING';
  commercialGradeDefaultPct: number | null;
  commercialGradeDefaultBasis: 'CATALOG_DEFAULT_NOT_VERIFIED_ASSAY' | 'MISSING';
  supplierActiveMatterPct: number | null;
  ingredientPHMin: number | null;
  ingredientPHMax: number | null;
  productCategoryId: ProductCategoryId;
  productTargetPHMin: number;
  productTargetPHMax: number;
  productTargetActiveMatterPct: number;
  decision: ApplicabilityReviewDecision;
  permittedUseMinPct: number | null;
  permittedUseMaxPct: number | null;
  concentrationBasis: string | null;
  compatibilityMechanism: string | null;
  incompatibilityRisks: string[];
  evidenceRefs: string[];
  reviewerNote: string;
}

const ALL_EVIDENCE_REVIEWS = [
  ...LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS,
  ...AOS_LAUNDRY_EVIDENCE_REVIEWS,
  ...ANIONIC_SURFACTANT_EVIDENCE_REVIEWS,
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS
];

const evidenceReviewByPair = new Map(
  ALL_EVIDENCE_REVIEWS.map((review) => [
    `${review.ingredientId}::${review.productCategoryId}`,
    review
  ])
);

export const INGREDIENT_CATEGORY_REVIEW_MATRIX: IngredientCategoryReview[] =
  UNIVERSAL_INGREDIENTS.flatMap((ingredient) =>
    CANONICAL_PRODUCT_CATEGORY_IDS.map((productCategoryId) => {
      const product = PRODUCT_TAXONOMY_MAP[productCategoryId];
      const explicitRole = ingredient.role?.trim();
      const functionRole = ingredient.function?.trim();
      const evidenceReview = evidenceReviewByPair.get(`${ingredient.id}::${productCategoryId}`);
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        ingredientCatalogCategory: ingredient.category,
        casNumber: ingredient.casNumber,
        identityType: ingredient.identityType ?? null,
        chemicalRole: evidenceReview?.chemicalRole ?? (explicitRole || functionRole || null),
        roleBasis: evidenceReview ? 'EXPLICIT_ROLE' : explicitRole ? 'EXPLICIT_ROLE' : functionRole ? 'FUNCTION_DESCRIPTION' : 'MISSING',
        commercialGradeDefaultPct: typeof ingredient.activeDefault === 'number' ? ingredient.activeDefault : null,
        commercialGradeDefaultBasis: typeof ingredient.activeDefault === 'number'
          ? 'CATALOG_DEFAULT_NOT_VERIFIED_ASSAY'
          : 'MISSING',
        supplierActiveMatterPct: typeof ingredient.activeMatter === 'number' ? ingredient.activeMatter : null,
        ingredientPHMin: typeof ingredient.phMin === 'number' ? ingredient.phMin : null,
        ingredientPHMax: typeof ingredient.phMax === 'number' ? ingredient.phMax : null,
        productCategoryId,
        productTargetPHMin: product.targetPHMin,
        productTargetPHMax: product.targetPHMax,
        productTargetActiveMatterPct: product.activeMatterTargetPct,
        decision: evidenceReview?.decision ?? 'NOT_REVIEWED',
        permittedUseMinPct: null,
        permittedUseMaxPct: null,
        concentrationBasis: evidenceReview?.concentrationFinding ?? null,
        compatibilityMechanism: evidenceReview?.compatibilityMechanism ?? null,
        incompatibilityRisks: evidenceReview?.incompatibilityRisks ?? [],
        evidenceRefs: evidenceReview?.evidence.map((item) => item.url) ?? [],
        reviewerNote: evidenceReview
          ? `Evidence review recorded. Concentration: ${evidenceReview.concentrationFinding} pH: ${evidenceReview.pHFinding} Limitations: ${evidenceReview.limitations.join(' ')}`
          : 'Pending ingredient-specific chemical identity, supplier-grade limits, pH stability, use-level evidence and finished-product compatibility review. Taxonomy targets are screening context only.'
      } satisfies IngredientCategoryReview;
    })
  );

export const INGREDIENT_APPLICABILITY_REVIEW_SUMMARY = {
  ingredientCount: UNIVERSAL_INGREDIENTS.length,
  categoryCount: CANONICAL_PRODUCT_CATEGORY_IDS.length,
  matrixPairCount: INGREDIENT_CATEGORY_REVIEW_MATRIX.length,
  decisionCounts: INGREDIENT_CATEGORY_REVIEW_MATRIX.reduce<Record<ApplicabilityReviewDecision, number>>(
    (counts, entry) => {
      counts[entry.decision] += 1;
      return counts;
    },
    {
      NOT_REVIEWED: 0,
      APPLICABLE: 0,
      CONDITIONALLY_APPLICABLE: 0,
      NOT_APPLICABLE: 0,
      UNKNOWN: 0
    }
  )
};

export function getIngredientApplicabilityReviewQueue(productCategoryId: ProductCategoryId) {
  return INGREDIENT_CATEGORY_REVIEW_MATRIX.filter(
    (entry) => entry.productCategoryId === productCategoryId
  );
}

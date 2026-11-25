import {
  INGREDIENT_APPLICABILITY_REVIEW_MATRIX,
  INGREDIENT_APPLICABILITY_REVIEW_SUMMARY
} from '../src/data/ingredientApplicabilityReviewMatrix';
import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../src/domain/productTaxonomy';

const expectedPairs = UNIVERSAL_INGREDIENTS.length * CANONICAL_PRODUCT_CATEGORY_IDS.length;
const pairKeys = new Set(INGREDIENT_APPLICABILITY_REVIEW_MATRIX.map(
  (entry) => `${entry.ingredientId}::${entry.productCategoryId}`
));
if (INGREDIENT_APPLICABILITY_REVIEW_MATRIX.length !== expectedPairs) {
  throw new Error(`Matrix size mismatch: expected ${expectedPairs}, got ${INGREDIENT_APPLICABILITY_REVIEW_MATRIX.length}`);
}
if (pairKeys.size !== expectedPairs) throw new Error('Duplicate or missing ingredient/category pair.');
if (INGREDIENT_APPLICABILITY_REVIEW_MATRIX.some((entry) => entry.decision !== 'NOT_REVIEWED')) {
  throw new Error('Unreviewed baseline must not auto-approve applicability.');
}
if (INGREDIENT_APPLICABILITY_REVIEW_MATRIX.some((entry) =>
  entry.permittedUseMinPct !== null || entry.permittedUseMaxPct !== null ||
  entry.concentrationBasis !== null || entry.evidenceRefs.length !== 0
)) {
  throw new Error('Unverified use limits or evidence must not be fabricated.');
}
if (INGREDIENT_APPLICABILITY_REVIEW_SUMMARY.matrixPairCount !== expectedPairs) {
  throw new Error('Review summary count mismatch.');
}
console.log(`PASS: ${UNIVERSAL_INGREDIENTS.length} ingredients × ${CANONICAL_PRODUCT_CATEGORY_IDS.length} categories = ${expectedPairs} unique, fail-closed review pairs.`);

import { LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS } from '../src/data/ingredientApplicabilityEvidenceReviews';

const reviewedKeys = new Set<string>();
for (const review of LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS) {
  const key = `${review.ingredientId}::${review.productCategoryId}`;
  if (reviewedKeys.has(key)) throw new Error(`Duplicate evidence review: ${key}`);
  reviewedKeys.add(key);
  if (!UNIVERSAL_INGREDIENTS.some((ingredient) => ingredient.id === review.ingredientId)) {
    throw new Error(`Evidence review references unknown ingredient: ${review.ingredientId}`);
  }
  if (review.productCategoryId !== 'LAUNDRY_LIQUID') {
    throw new Error('First evidence batch must remain scoped to LAUNDRY_LIQUID.');
  }
  if (!review.chemicalRole.trim() || !review.compatibilityMechanism.trim() ||
      !review.concentrationFinding.trim() || !review.pHFinding.trim() ||
      review.evidence.length === 0 || review.limitations.length === 0) {
    throw new Error(`Incomplete chemistry/evidence review: ${key}`);
  }
  if (review.decision === 'APPLICABLE' && review.incompatibilityRisks.length === 0) {
    throw new Error(`Applicable entry must disclose incompatibility risks: ${key}`);
  }
}
console.log(`PASS: ${LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS.length} sourced liquid-laundry surfactant reviews.`);

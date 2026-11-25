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

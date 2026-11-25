import {
  INGREDIENT_CATEGORY_REVIEW_MATRIX,
  INGREDIENT_APPLICABILITY_REVIEW_SUMMARY
} from '../src/data/ingredientApplicabilityReviewMatrix';
import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../src/domain/productTaxonomy';

const expectedPairs = UNIVERSAL_INGREDIENTS.length * CANONICAL_PRODUCT_CATEGORY_IDS.length;
const pairKeys = new Set(INGREDIENT_CATEGORY_REVIEW_MATRIX.map(
  (entry) => `${entry.ingredientId}::${entry.productCategoryId}`
));
if (INGREDIENT_CATEGORY_REVIEW_MATRIX.length !== expectedPairs) {
  throw new Error(`Matrix size mismatch: expected ${expectedPairs}, got ${INGREDIENT_CATEGORY_REVIEW_MATRIX.length}`);
}
if (pairKeys.size !== expectedPairs) throw new Error('Duplicate or missing ingredient/category pair.');
if (INGREDIENT_CATEGORY_REVIEW_MATRIX.some((entry) => entry.decision !== 'NOT_REVIEWED')) {
  throw new Error('Unreviewed baseline must not auto-approve applicability.');
}
if (INGREDIENT_CATEGORY_REVIEW_MATRIX.some((entry) =>
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

import { AOS_LAUNDRY_EVIDENCE_REVIEWS, ANIONIC_SURFACTANT_EVIDENCE_REVIEWS } from '../src/data/ingredientApplicabilityEvidenceReviews';

for (const review of AOS_LAUNDRY_EVIDENCE_REVIEWS) {
  if (!UNIVERSAL_INGREDIENTS.some((ingredient) => ingredient.id === review.ingredientId)) {
    throw new Error(`AOS review references unknown ingredient: ${review.ingredientId}`);
  }
  if (review.ingredientId === 'aos-38' && review.productCategoryId !== 'LAUNDRY_LIQUID') {
    throw new Error('AOS 38 liquid grade must be reviewed against LAUNDRY_LIQUID.');
  }
  if (review.ingredientId === 'aos-92' && review.productCategoryId !== 'LAUNDRY_POWDER') {
    throw new Error('AOS 92 powder grade must be reviewed against LAUNDRY_POWDER.');
  }
  if (!review.chemicalRole || !review.compatibilityMechanism ||
      !review.concentrationFinding || !review.pHFinding ||
      review.evidence.length === 0 || review.limitations.length === 0) {
    throw new Error(`Incomplete AOS evidence review: ${review.ingredientId}`);
  }
}
console.log(`PASS: ${AOS_LAUNDRY_EVIDENCE_REVIEWS.length} evidence-reviewed AOS grade/category pairs.`);

const expectedAnionic = new Map([
  ['sas-60', 'LAUNDRY_LIQUID'],
  ['sls-needles', 'LAUNDRY_POWDER'],
  ['sls-30', 'LAUNDRY_LIQUID']
]);
for (const review of ANIONIC_SURFACTANT_EVIDENCE_REVIEWS) {
  const expectedCategory = expectedAnionic.get(review.ingredientId);
  if (!expectedCategory || review.productCategoryId !== expectedCategory) {
    throw new Error(`Unexpected SAS/SLS review scope: ${review.ingredientId} / ${review.productCategoryId}`);
  }
  if (!UNIVERSAL_INGREDIENTS.some((ingredient) => ingredient.id === review.ingredientId)) {
    throw new Error(`SAS/SLS review references unknown ingredient: ${review.ingredientId}`);
  }
  if (!review.chemicalRole.trim() || !review.compatibilityMechanism.trim() ||
      !review.concentrationFinding.trim() || !review.pHFinding.trim() ||
      review.evidence.length === 0 || review.limitations.length === 0) {
    throw new Error(`Incomplete SAS/SLS chemistry review: ${review.ingredientId}`);
  }
  if (/permittedUse(Min|Max)Pct/.test(review.concentrationFinding)) {
    throw new Error('Do not claim a numeric permitted use range without structured evidence.');
  }
}
if (ANIONIC_SURFACTANT_EVIDENCE_REVIEWS.length !== expectedAnionic.size) {
  throw new Error('Missing SAS/SLS review record.');
}
console.log(`PASS: ${ANIONIC_SURFACTANT_EVIDENCE_REVIEWS.length} SAS/SLS grade/category chemistry reviews.`);

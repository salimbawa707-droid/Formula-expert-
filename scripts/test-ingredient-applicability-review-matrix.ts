import {
  INGREDIENT_CATEGORY_REVIEW_MATRIX,
  INGREDIENT_APPLICABILITY_REVIEW_SUMMARY
} from '../src/data/ingredientApplicabilityReviewMatrix';
import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../src/domain/productTaxonomy';
import { LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS, AOS_LAUNDRY_EVIDENCE_REVIEWS, ANIONIC_SURFACTANT_EVIDENCE_REVIEWS, NONIONIC_SURFACTANT_EVIDENCE_REVIEWS, NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_2, NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_3 } from '../src/data/ingredientApplicabilityEvidenceReviews';

const expectedPairs = UNIVERSAL_INGREDIENTS.length * CANONICAL_PRODUCT_CATEGORY_IDS.length;
const pairKeys = new Set(INGREDIENT_CATEGORY_REVIEW_MATRIX.map(
  (entry) => `${entry.ingredientId}::${entry.productCategoryId}`
));
if (INGREDIENT_CATEGORY_REVIEW_MATRIX.length !== expectedPairs) {
  throw new Error(`Matrix size mismatch: expected ${expectedPairs}, got ${INGREDIENT_CATEGORY_REVIEW_MATRIX.length}`);
}
if (pairKeys.size !== expectedPairs) throw new Error('Duplicate or missing ingredient/category pair.');
if (INGREDIENT_CATEGORY_REVIEW_MATRIX.some((entry) =>
  entry.decision === 'NOT_REVIEWED' && (
    entry.permittedUseMinPct !== null || entry.permittedUseMaxPct !== null ||
    entry.concentrationBasis !== null || entry.evidenceRefs.length !== 0
  )
)) {
  throw new Error('Unreviewed pairs must remain fail-closed and contain no fabricated evidence.');
}
const evidenceReviews = [
  ...LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS,
  ...AOS_LAUNDRY_EVIDENCE_REVIEWS,
  ...ANIONIC_SURFACTANT_EVIDENCE_REVIEWS,
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS,
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_2,
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_3
];
const evidenceKeys = new Set(evidenceReviews.map((review) => `${review.ingredientId}::${review.productCategoryId}`));
if (evidenceKeys.size !== evidenceReviews.length) throw new Error('Duplicate evidence review pair.');
for (const review of evidenceReviews) {
  const row = INGREDIENT_CATEGORY_REVIEW_MATRIX.find((entry) =>
    entry.ingredientId === review.ingredientId && entry.productCategoryId === review.productCategoryId
  );
  if (!row) throw new Error(`Evidence review missing from master matrix: ${review.ingredientId}`);
  if (row.decision !== review.decision || row.evidenceRefs.length !== review.evidence.length ||
      row.compatibilityMechanism !== review.compatibilityMechanism) {
    throw new Error(`Evidence review not reconciled into matrix: ${review.ingredientId}`);
  }
  if (row.permittedUseMinPct !== null || row.permittedUseMaxPct !== null) {
    throw new Error(`Unverified numeric use limit found: ${review.ingredientId}`);
  }
}
if (INGREDIENT_APPLICABILITY_REVIEW_SUMMARY.matrixPairCount !== expectedPairs) {
  throw new Error('Review summary count mismatch.');
}
console.log(`PASS: ${UNIVERSAL_INGREDIENTS.length} ingredients × ${CANONICAL_PRODUCT_CATEGORY_IDS.length} categories = ${expectedPairs} unique matrix pairs.`);


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

const nonionicReviews = [
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS,
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_2,
  ...NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_3
];
const expectedNonionicPairs = new Set([
  'lae-7::LAUNDRY_LIQUID', 'lae-9::LAUNDRY_LIQUID', 'apg-0810::LAUNDRY_LIQUID',
  'lae-3::LAUNDRY_LIQUID', 'lae-12::LAUNDRY_LIQUID',
  'apg-1214::LAUNDRY_LIQUID', 'apg-1214::DISHWASH_MANUAL', 'apg-1214::KITCHEN_DEGREASER',
  'np-6::LAUNDRY_LIQUID', 'np-9::LAUNDRY_LIQUID', 'np-10::LAUNDRY_LIQUID'
]);
const actualNonionicPairs = new Set(nonionicReviews.map((review) => `${review.ingredientId}::${review.productCategoryId}`));
if (actualNonionicPairs.size !== nonionicReviews.length) throw new Error('Duplicate nonionic ingredient/category evidence pair.');
for (const key of expectedNonionicPairs) {
  if (!actualNonionicPairs.has(key)) throw new Error(`Missing nonionic review pair: ${key}`);
}
for (const review of nonionicReviews) {
  if (!UNIVERSAL_INGREDIENTS.some((ingredient) => ingredient.id === review.ingredientId)) {
    throw new Error(`Nonionic review references unknown ingredient: ${review.ingredientId}`);
  }
  if (!review.chemicalRole.trim() || !review.compatibilityMechanism.trim() ||
      !review.concentrationFinding.trim() || !review.pHFinding.trim() ||
      review.evidence.length === 0 || review.limitations.length === 0) {
    throw new Error(`Incomplete nonionic chemistry review: ${review.ingredientId}`);
  }
}
if (actualNonionicPairs.size !== expectedNonionicPairs.size) {
  throw new Error('Unexpected or missing nonionic ingredient/category evidence pair.');
}
console.log(`PASS: ${actualNonionicPairs.size} nonionic ingredient/category reviews across three batches.`);
import assert from 'node:assert/strict';
import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../src/domain/productTaxonomy';
import { MASTER_INGREDIENT_APPLICABILITY_SCREEN, getMasterIngredientApplicabilityScreenSummary } from '../src/data/masterIngredientApplicabilityScreen';

const summary = getMasterIngredientApplicabilityScreenSummary();
assert.equal(summary.ingredientCount, UNIVERSAL_INGREDIENTS.length, 'screen must cover every canonical master ingredient');
assert.equal(summary.categoryCount, CANONICAL_PRODUCT_CATEGORY_IDS.length, 'screen must use the canonical taxonomy');
assert.equal(summary.categoryCount, 13, 'canonical product category count must remain 13');
assert.equal(summary.pairCount, UNIVERSAL_INGREDIENTS.length * 13, 'every ingredient must have exactly 13 category rows');
assert.equal(summary.uniqueIngredientIds, UNIVERSAL_INGREDIENTS.length, 'master ingredient IDs must be unique');
assert.equal(summary.duplicateIngredientIds, 0, 'duplicate ingredient IDs must block the screen');
assert.equal(summary.finalApprovals, 0, 'AI desk-screen must never grant final applicability approval');
assert.equal(MASTER_INGREDIENT_APPLICABILITY_SCREEN.length, summary.pairCount);
assert(MASTER_INGREDIENT_APPLICABILITY_SCREEN.every(row => row.rationale.trim().length > 20), 'every pair needs a specific rationale');
assert(MASTER_INGREDIENT_APPLICABILITY_SCREEN.every(row => row.criticalUnknowns.length > 0), 'every pair must retain unresolved evidence requirements');
assert(MASTER_INGREDIENT_APPLICABILITY_SCREEN.every(row => row.inciName.length > 0), 'every pair must preserve the catalog INCI identity');
assert(MASTER_INGREDIENT_APPLICABILITY_SCREEN.every(row => row.finalApplicability === 'NOT_APPROVED'), 'no screening pair may be promoted by the desk screen');
for (const row of MASTER_INGREDIENT_APPLICABILITY_SCREEN) {
  const source = UNIVERSAL_INGREDIENTS.find(item => item.id === row.ingredientId);
  assert(source, `screen row ${row.ingredientId} must resolve to a canonical master ingredient`);
  assert.equal(row.casNumber, source.casNumber, 'CAS identity must remain linked to the exact commercial-grade record');
  assert.equal(row.provenanceSource, source.provenance?.source, 'provenance source must not be fabricated');
  assert.equal(row.provenanceUrl, source.provenance?.sourceUrl, 'provenance URL must not be fabricated');
}

const labsaSoftener = MASTER_INGREDIENT_APPLICABILITY_SCREEN.find(row => row.ingredientId === 'labsa-96' && row.productCategory === 'FABRIC_SOFTENER');
assert.equal(labsaSoftener?.preliminaryDisposition, 'CHEMISTRY_CONFLICT_RISK', 'anionic surfactant must flag cationic softener incompatibility risk');
const aristoSoftener = MASTER_INGREDIENT_APPLICABILITY_SCREEN.find(row => row.ingredientId === 'aristo-9' && row.productCategory === 'FABRIC_SOFTENER');
assert.equal(aristoSoftener?.preliminaryDisposition, 'IDENTITY_OR_EVIDENCE_UNKNOWN', 'proprietary blend must remain unknown in every category');
const labsaAutoDish = MASTER_INGREDIENT_APPLICABILITY_SCREEN.find(row => row.ingredientId === 'labsa-96' && row.productCategory === 'DISHWASH_AUTOMATIC');
assert.equal(labsaAutoDish?.preliminaryDisposition, 'CONDITIONAL_SCREEN', 'automatic-dish surfactant needs low-foam grade evidence');
assert.equal(summary.provenanceMetadataRecords, UNIVERSAL_INGREDIENTS.filter(item => Boolean(item.provenance)).length, 'provenance count must reconcile to source records');
assert.equal(summary.missingPHRangeRecords, UNIVERSAL_INGREDIENTS.filter(item => item.phMin == null || item.phMax == null).length, 'missing pH ranges must remain explicit');

console.log('MASTER INGREDIENT APPLICABILITY SCREEN PASS');
console.log(JSON.stringify(summary, null, 2));

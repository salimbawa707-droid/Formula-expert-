import assert from 'node:assert/strict';
import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';
import { MASTER_INGREDIENT_IDENTITY_COVERAGE, getMasterIngredientIdentityCoverageSummary } from '../src/data/masterIngredientIdentityCoverage';

const summary = getMasterIngredientIdentityCoverageSummary();
assert.equal(summary.ingredientCount, UNIVERSAL_INGREDIENTS.length, 'identity crosswalk must cover the complete master catalog');
assert.equal(summary.uniqueIngredientIds, UNIVERSAL_INGREDIENTS.length, 'all master ingredient IDs must be unique');
assert.equal(summary.duplicateIngredientIds, 0);
assert.equal(summary.exactCasInciSsotMatches, 33, 'only exact CAS+INCI identity matches may be counted');
assert.equal(summary.ambiguousOrConflicting, 0, 'no ambiguous identity may be silently mapped');
assert.equal(summary.noExactSsotMatch, 397, 'unmapped catalog identities must remain visible');
assert.equal(summary.exactCasInciSsotMatches + summary.ambiguousOrConflicting + summary.noExactSsotMatch, 430);
assert.equal(summary.catalogProvenanceRecords, 3, 'catalog provenance metadata count must be reconciled');
assert.equal(summary.catalogProvenanceUrlRecords, 1, 'catalog provenance URL count must be reconciled');
assert.equal(summary.gradeSpecificEvidenceRecords, 0, 'identity SSOT cannot be promoted into supplier-grade evidence');
assert.deepEqual(summary.missingFieldCounts, {
  identityType: 423,
  casStatus: 423,
  manufacturer: 427,
  productName: 427,
  supplierAssay: 430,
  verifiedPHBounds: 430,
  structuredProvenance: 427,
  provenanceUrl: 429
}, 'catalog grade/provenance gaps must be reproducible');
assert.equal(summary.activeDefaultPresentButSupplierAssayMissing, 430, 'activeDefault is not a substitute for supplier assay');
assert(MASTER_INGREDIENT_IDENTITY_COVERAGE.every(row => row.activeDefaultPresentButSupplierAssayMissing));
assert(MASTER_INGREDIENT_IDENTITY_COVERAGE.every(row => row.gradeSpecificEvidenceStatus === 'NOT_ESTABLISHED_BY_IDENTITY_SSOT'));
assert(MASTER_INGREDIENT_IDENTITY_COVERAGE.every(row => row.unresolvedReason && row.unresolvedReason.length > 20));
const proprietary = MASTER_INGREDIENT_IDENTITY_COVERAGE.find(row => row.ingredientId === 'aristo-9');
assert.equal(proprietary?.identityCoverageStatus, 'NO_EXACT_SSOT_MATCH');
assert.equal(proprietary?.ssotIdentityId, null);
const labsa = MASTER_INGREDIENT_IDENTITY_COVERAGE.filter(row => row.ssotIdentityId === 'labsa');
assert.equal(labsa.length, 5);
console.log('MASTER INGREDIENT IDENTITY COVERAGE PASS');
console.log(JSON.stringify(summary, null, 2));

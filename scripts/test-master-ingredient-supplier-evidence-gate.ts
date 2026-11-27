import assert from 'node:assert/strict';
import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';
import {
  MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE,
  getMasterIngredientSupplierEvidenceGateSummary
} from '../src/data/masterIngredientSupplierEvidenceGate';

const summary = getMasterIngredientSupplierEvidenceGateSummary();
assert.equal(summary.ingredientCount, UNIVERSAL_INGREDIENTS.length);
assert.equal(summary.uniqueIngredientIds, UNIVERSAL_INGREDIENTS.length);
assert.equal(summary.duplicateIngredientIds, 0);
assert.equal(MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE.length, UNIVERSAL_INGREDIENTS.length);
assert.equal(summary.supplierTdsVerified, 0, 'no supplier TDS may be invented from public comparator data');
assert.equal(summary.supplierSdsVerified, 0, 'no supplier SDS may be inferred from chemical family identity');
assert.equal(summary.matchingLotCoAVerified, 0, 'no matching-lot CoA is present in the catalog');
assert.equal(summary.lotAssayVerified, 0, 'catalog activeDefault is not a lot-specific assay');
assert.equal(summary.namedFormulaApplicabilityValidated, 0, 'no formula applicability may be approved without named-formula test evidence');
assert.equal(summary.supplierContacted, 0, 'register must not claim suppliers were contacted');
assert.equal(summary.releaseApproved, 0, 'supplier-grade evidence gate must remain fail-closed');

for (const row of MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE) {
  assert.equal(row.supplierTdsState, 'NOT_PROVIDED');
  assert.equal(row.supplierSdsState, 'NOT_PROVIDED');
  assert.equal(row.lotCoAState, 'NOT_PROVIDED');
  assert.equal(row.formulaApplicabilityState, 'NOT_TESTED');
  assert.equal(row.releaseDecision, 'BLOCKED');
  assert(row.blockers.length >= 4, `${row.ingredientId} must preserve evidence blockers`);
}
const ldao = MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE.find(row => row.ingredientId === 'lauryl-amine-oxide');
assert.equal(ldao?.chargeBehavior, 'PH_DEPENDENT_AMINE_OXIDE');
assert.equal(ldao?.identityRouteStatus, 'ROUTED');
const tallow = MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE.find(row => row.ingredientId === 'tallow-amine-oxide');
assert.equal(tallow?.identityRouteStatus, 'BLOCKED');
assert(tallow?.blockers.some(item => item.includes('Functional identity route is explicitly blocked')));
const ligno = MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE.find(row => row.ingredientId === 'lignosulfonate-na');
assert.equal(ligno?.functionalRole, 'POLYMERIC_DISPERSANT');

console.log('MASTER INGREDIENT SUPPLIER EVIDENCE GATE PASS');
console.log(JSON.stringify(summary, null, 2));

import assert from 'node:assert/strict';
import { getFunctionalClassAuditRows, getFunctionalClassAuditRow, validateFunctionalClassAuditAgainstCatalog } from '../src/data/ingredientFunctionalClassAudit';

const rows = getFunctionalClassAuditRows();
assert.equal(rows.length, 3);
assert.deepEqual(validateFunctionalClassAuditAgainstCatalog(), []);
assert.equal(new Set(rows.map(row => row.ingredientId)).size, rows.length);
assert(rows.every(row => row.approvalState === 'NOT_APPROVED'));
assert(rows.every(row => row.doNotInfer.length >= 3));
assert.equal(getFunctionalClassAuditRow('lignosulfonate-na')?.disposition, 'FUNCTIONAL_SUBCLASS_REQUIRED');
assert.equal(getFunctionalClassAuditRow('lauryl-amine-oxide')?.disposition, 'TAXONOMY_REVIEW_REQUIRED');
assert.equal(getFunctionalClassAuditRow('tallow-amine-oxide')?.disposition, 'IDENTITY_CONFLICT_BLOCKED');
assert.equal(getFunctionalClassAuditRow('missing-id'), null);
const mutable = getFunctionalClassAuditRow('lignosulfonate-na');
mutable!.doNotInfer.push('tamper');
assert.equal(getFunctionalClassAuditRow('lignosulfonate-na')!.doNotInfer.includes('tamper'), false);
console.log('INGREDIENT FUNCTIONAL CLASS AUDIT PASS');
console.log(JSON.stringify(rows.map(({ingredientId, disposition, approvalState}) => ({ingredientId, disposition, approvalState})), null, 2));

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const csvPath = fileURLToPath(new URL('../evidence_vault/datasets/phase4b_identity_source_audit_batch4_sles_sas_2026-11-28.csv', import.meta.url));
const lines = readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
assert.equal(lines[0].split(',').length, 16, 'batch 4 CSV must retain its 16-field schema');
assert.equal(lines.length, 3, 'batch 4 must contain exactly two audited candidate groups');
const rows = lines.slice(1).map(line => line.split(','));
assert(rows.every(row => row.length === 16), 'every CSV row must have 16 fields');
assert.deepEqual(rows.map(row => row[0]), ['MICG-073', 'MICG-085']);
assert.deepEqual(rows.map(row => Number(row[3])), [4, 8]);
assert.equal(rows.reduce((sum, row) => sum + Number(row[3]), 0), 12);

const sas = rows[0];
assert.equal(sas[1], '68037-49-0');
assert(sas[5].includes('echa.europa.eu'));
assert(sas[6].includes('chem.echa.europa.eu'));
assert(sas[7].includes('clariant.com'));
assert(sas[11].includes('AMBIGUOUS'));
assert(sas[12].includes('AMBIGUOUS_CAS'));
assert(sas[13].includes('DO_NOT_PROMOTE'));
assert(sas[14].includes('NAMED_REFERENCE_ONLY'));
assert(sas[15].includes('applies only'));

const sles = rows[1];
assert.equal(sles[1], '68585-34-2');
assert(sles[5].includes('echa.europa.eu'));
assert(sles[6].includes('yeserchem.com'));
assert(sles[7].includes('alliedinds.com'));
assert(sles[11].includes('AUTHORITATIVE_FAMILY_IDENTITY_SUPPORTED'));
assert(sles[12].includes('GRADE_DISTRIBUTION'));
assert(sles[13].includes('DO_NOT_PROMOTE'));
assert(sles[14].includes('NOT_ESTABLISHED'));
assert(sles[15].includes('Keep SLES-70 paste and SLES-28 liquid as distinct'));

console.log('PHASE 4B IDENTITY SOURCE AUDIT BATCH 4 PASS');
console.log(JSON.stringify({
  candidateGroups: 2,
  catalogVariants: 12,
  familyIdentitySupported: 1,
  ambiguousCasScope: 1,
  automaticCasCorrections: 0,
  supplierGradeApprovals: 0,
  lotAssaysVerified: 0
}, null, 2));

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const csvPath = fileURLToPath(new URL('../evidence_vault/datasets/phase4b_identity_source_audit_batch1_2026-11-28.csv', import.meta.url));
const lines = readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
const header = lines[0].split(',');
assert.equal(header.length, 13, 'identity source audit CSV must retain its 13-field schema');
const rows = lines.slice(1);
assert.equal(rows.length, 6, 'batch 1 must contain six source-reviewed identity candidates');
const ids = rows.map(line => line.split(',')[0]);
assert.equal(new Set(ids).size, rows.length, 'candidate groups must be unique');
const catalogCounts = rows.map(line => Number(line.split(',')[3]));
assert(catalogCounts.every(Number.isInteger));
assert.equal(catalogCounts.reduce((sum, count) => sum + count, 0), 32, 'catalog variant coverage count must reconcile');
for (const line of rows) {
  assert.match(line, /https:\/\/pubchem\.ncbi\.nlm\.nih\.gov\//);
  assert.match(line, /NCBI PubChem/);
  assert.match(line, /Substance identity and CAS association only/);
  assert.match(line, /PUBCHEM_IDENTITY_SUPPORTED/);
  assert.match(line, /NOT_INDEPENDENTLY_VERIFIED/);
  assert.match(line, /DO_NOT_PROMOTE_TO_EXACT_CAS_INCI_SSOT_MATCH/);
  assert.match(line, /NOT_ESTABLISHED/);
}
console.log('PHASE 4B IDENTITY SOURCE AUDIT BATCH 1 PASS');
console.log(JSON.stringify({ candidates: rows.length, catalogVariants: catalogCounts.reduce((sum, count) => sum + count, 0), exactSsotPromotions: 0, supplierGradeApprovals: 0 }, null, 2));

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const csvPath = fileURLToPath(new URL('../evidence_vault/datasets/phase4b_identity_source_audit_batch1_2026-11-28.csv', import.meta.url));
const lines = readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
const header = lines[0].split(',');
assert.equal(header.length, 13, 'identity source audit CSV must retain its 13-field schema');
const rows = lines.slice(1);
assert.equal(rows.length, 6, 'batch 1 must contain the six source-reviewed identity candidates');
const parsed = rows.map(line => {
  const values = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g)?.map(cell => cell.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) ?? [];
  assert.equal(values.length, header.length, 'every audit row must match the declared CSV schema');
  return Object.fromEntries(header.map((key, index) => [key, values[index]]));
});
assert.equal(new Set(parsed.map(row => row.candidate_group_id)).size, parsed.length, 'candidate groups must be unique');
assert.equal(parsed.reduce((sum, row) => sum + Number(row.catalog_record_count), 0), 32, 'catalog variant coverage count must reconcile');
for (const row of parsed) {
  assert.match(row.identity_source_url, /^https:\/\/pubchem\.ncbi\.nlm\.nih\.gov\//);
  assert.equal(row.source_authority, 'NCBI PubChem');
  assert.equal(row.source_claim_scope, 'Substance identity and CAS association only');
  assert.equal(row.cas_identity_status, 'PUBCHEM_IDENTITY_SUPPORTED');
  assert.equal(row.inci_nomenclature_status, 'NOT_INDEPENDENTLY_VERIFIED');
  assert.equal(row.ssot_crosswalk_disposition, 'DO_NOT_PROMOTE_TO_EXACT_CAS_INCI_SSOT_MATCH');
  assert.equal(row.grade_evidence_disposition, 'NOT_ESTABLISHED');
}
console.log('PHASE 4B IDENTITY SOURCE AUDIT BATCH 1 PASS');
console.log(JSON.stringify({ candidates: parsed.length, catalogVariants: parsed.reduce((sum, row) => sum + Number(row.catalog_record_count), 0), exactSsotPromotions: 0, supplierGradeApprovals: 0 }, null, 2));

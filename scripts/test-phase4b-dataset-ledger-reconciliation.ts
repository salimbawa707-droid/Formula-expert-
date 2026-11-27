import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INITIAL_VAULT_STATE } from '../src/domain/vault/initialData';

const evidence = INITIAL_VAULT_STATE.evidence;
const datasets = INITIAL_VAULT_STATE.datasets;
const evidenceIds = new Set(evidence.map(item => item.id));
const datasetIds = new Set(datasets.map(item => item.id));
const csv = readFileSync('evidence_vault/datasets/source-register.csv', 'utf8').trim().split(/\r?\n/);
function parseCsv(line: string): string[] {
  const fields: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      fields.push(value); value = '';
    } else value += ch;
  }
  fields.push(value);
  return fields;
}
const sourceRows = csv.slice(1).map(parseCsv);
const sourceIds = new Set(sourceRows.map(row => row[0]));

assert.equal(evidence.length, 25, 'vault evidence registry must include all 25 current records');
assert.equal(new Set(evidence.map(item => item.id)).size, evidence.length, 'evidence IDs must be unique');
assert.deepEqual(evidence.reduce((acc, item) => { const key = item.licenseReviewStatus || 'UNREVIEWED'; acc[key] = (acc[key] || 0) + 1; return acc; }, {} as Record<string, number>), { RESTRICTED: 2, UNKNOWN: 2, REVIEW_PENDING: 10, PERMITTED_FOR_COMMERCIAL_REUSE: 11 }, 'rights states must reconcile to the current evidence registry');
assert.deepEqual(evidence.reduce((acc, item) => { acc[item.downloadStatus] = (acc[item.downloadStatus] || 0) + 1; return acc; }, {} as Record<string, number>), { NOT_DOWNLOADED: 15, DOWNLOADED: 8, BLOCKED: 2 }, 'download states must reconcile to the current evidence registry');
assert.equal(datasets.length, 8, 'dataset ledger must include the four primary and four auxiliary reference datasets');
assert.equal(datasetIds.size, datasets.length, 'dataset IDs must be unique');
for (const dataset of datasets) {
  assert(evidenceIds.has(dataset.evidenceId), `${dataset.id} must link to a registered evidence record`);
  assert(dataset.originalDatasetUrl.startsWith('https://'), `${dataset.id} must have an HTTPS source URL`);
  assert(dataset.actualRowCount !== null && dataset.actualRowCount > 0, `${dataset.id} must preserve its inspected row inventory`);
  assert.equal(dataset.numericalValidationReadiness, 'DEFICIENT', `${dataset.id} must not be promoted to validation-ready without matched formula data`);
  assert.equal(dataset.inspectionStatus, 'NUMERICALLY_INSPECTED');
}
const expectedRows: Record<string, number> = {
  'DS-001': 1624, 'DS-002': 11626, 'DS-004': 143, 'DS-005': 23,
  'DS-006': 202, 'DS-007': 4990, 'DS-008': 979, 'DS-009': 20
};
for (const [id, count] of Object.entries(expectedRows)) {
  assert.equal(datasets.find(item => item.id === id)?.actualRowCount, count, `${id} row count must reconcile to its parser/source manifest`);
}
assert.equal(sourceRows.length, 28, 'source register must retain all 28 source rows');
for (const id of ['SRC-REPOD-CMC-IMF2OE', 'SRC-PSDI-CMC', 'SRC-P2SURF-MIXED-CMC', 'SRC-IUPAC-2002-PH-STANDARDS']) {
  assert(sourceIds.has(id), `source register must contain ${id}`);
}
assert(evidenceIds.has('EVD-023') && evidenceIds.has('EVD-024') && evidenceIds.has('EVD-025') && evidenceIds.has('EVD-026'));
assert(datasets.some(item => item.id === 'DS-006' && item.evidenceId === 'EVD-023'));
assert(datasets.some(item => item.id === 'DS-007' && item.evidenceId === 'EVD-024'));
assert(datasets.some(item => item.id === 'DS-008' && item.evidenceId === 'EVD-025'));
assert(datasets.some(item => item.id === 'DS-009' && item.evidenceId === 'EVD-026'));
assert(datasets.every(item => item.applicableEngineIds.length === 0 || item.numericalValidationReadiness === 'DEFICIENT'));
console.log('PHASE 4B DATASET LEDGER RECONCILIATION PASS');
console.log(JSON.stringify({
  evidenceRecords: evidence.length,
  sourceRegisterRows: sourceRows.length,
  datasetRecords: datasets.length,
  validationReadyDatasets: datasets.filter(item => item.numericalValidationReadiness === 'READY').length,
  allDatasetEvidenceLinksResolved: datasets.every(item => evidenceIds.has(item.evidenceId)),
  datasets: datasets.map(item => ({ id: item.id, rows: item.actualRowCount, evidenceId: item.evidenceId, readiness: item.numericalValidationReadiness }))
}, null, 2));

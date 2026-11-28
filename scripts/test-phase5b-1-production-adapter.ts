import assert from 'node:assert/strict';
import { buildBoundedActiveMatterReport, buildBoundedCostReport } from '../src/components/BoundedFormulaEvidencePanel';
const active = buildBoundedActiveMatterReport([
  { id: 'sles', name: 'SLES 28%', percentage: 10, activeMatterPct: 28, activeMatterInputSource: 'CATALOG_DEFAULT' } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]);
assert.equal(active.status, 'COMPLETE');
assert.equal(active.totalActiveNominalPct, 2.8);
assert.equal(active.releaseEligible, false);
assert(active.provenance.some(item => item.evidenceClass === 'CATALOG_DEFAULT'));
assert(active.provenance.some(item => item.evidenceClass === 'PUBLISHED_REFERENCE'));
const unknown = buildBoundedActiveMatterReport([
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
  { id: 'unknown', name: 'Unidentified surfactant grade', percentage: 10 } as any,
]);
assert.equal(unknown.status, 'INSUFFICIENT_DATA');
assert.equal(unknown.unknownRawPercent, 10);
assert.equal(unknown.totalActiveNominalPct, null);
const costComplete = buildBoundedCostReport([
  { id: 'sles', name: 'SLES', percentage: 10, costPerKg: 100 } as any,
  { id: 'water', name: 'Water', percentage: 90, costPerKg: 1 } as any,
], 100);
assert.equal(costComplete.status, 'COMPLETE');
assert.equal(costComplete.totalCostNominalPerKg, 10.9);
assert.equal(costComplete.batchCostNominal, 1090);
assert.equal(costComplete.releaseEligible, false);
const costIncomplete = buildBoundedCostReport([
  { id: 'priced', name: 'Priced', percentage: 90, costPerKg: 1 } as any,
  { id: 'unpriced', name: 'Unpriced', percentage: 10, costPerKg: null } as any,
], 100);
assert.equal(costIncomplete.status, 'INSUFFICIENT_DATA');
assert.equal(costIncomplete.knownSubtotalNominalPerKg, 0.9);
assert.equal(costIncomplete.totalCostNominalPerKg, null);
assert.equal(costIncomplete.unknownRawPercent, 10);
const sourceBacked = buildBoundedActiveMatterReport([{
  id: 'source-backed', name: 'SLES source backed', percentage: 100, activeMatterPct: 70,
  activeMatterInputSource: 'SOURCE_BACKED', activeMatterEvidenceId: 'TDS-123',
  activeMatterEvidenceUrl: 'https://supplier.example/tds.pdf',
  activeMatterEvidenceSourceType: 'MANUFACTURER_TDS',
  provenance: { verificationStatus: 'VERIFIED', sourceUrl: 'https://supplier.example/tds.pdf' },
} as any]);
assert.equal(sourceBacked.status, 'COMPLETE');
assert(sourceBacked.provenance.some(item => item.evidenceClass === 'SUPPLIER_SPECIFIED'));
console.log('PHASE 5B-1 PRODUCTION BOUNDED ADAPTER TESTS PASS');

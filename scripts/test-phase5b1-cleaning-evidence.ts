import assert from 'node:assert/strict';
import { calculateCleaningPerformance } from '../src/utils/cleaningPerformanceEngine';

const knownPointAssay = calculateCleaningPerformance([
  { id: 'sles', name: 'SLES', category: 'anionic surfactant', percentage: 10, activeMatterPct: 28 } as any,
  { id: 'water', name: 'Deionized Water', category: 'water', percentage: 90, activeMatterPct: 0 } as any,
], 7, 'HAND_WASH');

assert.ok(knownPointAssay.boundedActiveMatterEvidence);
assert.equal(knownPointAssay.boundedActiveMatterEvidence.releaseEligible, false);
assert(knownPointAssay.boundedActiveMatterEvidence.provenance.some(x => x.evidenceClass === 'USER_ENTERED' || x.evidenceClass === 'CATALOG_DEFAULT'));
assert.equal(knownPointAssay.provenance, 'PREDICTED');

const unknownSurfactantAssay = calculateCleaningPerformance([
  { id: 'unknown-surfactant', name: 'Unverified surfactant grade', category: 'surfactant', percentage: 10 } as any,
  { id: 'water', name: 'Deionized Water', category: 'water', percentage: 90, activeMatterPct: 0 } as any,
], 7, 'HAND_WASH');

assert.ok(unknownSurfactantAssay.boundedActiveMatterEvidence);
assert.equal(unknownSurfactantAssay.boundedActiveMatterEvidence.status, 'INSUFFICIENT_DATA');
assert.equal(unknownSurfactantAssay.boundedActiveMatterEvidence.unknownRawPercent, 10);
assert.equal(unknownSurfactantAssay.cpi, null);
assert.equal(unknownSurfactantAssay.provenance, 'INSUFFICIENT_DATA');

console.log('PHASE 5B-1 CLEANING PERFORMANCE EVIDENCE REGRESSIONS PASS');

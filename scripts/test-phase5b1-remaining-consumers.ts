import assert from 'node:assert/strict';
import { buildBoundedActiveMatterReport, buildBoundedCostReport } from '../src/utils/boundedFormulaAdapter';

const completeScenario = buildBoundedActiveMatterReport([
  { id: 'sles', name: 'SLES 28%', percentage: 10, activeMatterPct: 28, activeMatterInputSource: 'CATALOG_DEFAULT' } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]);
assert.equal(completeScenario.status, 'COMPLETE');
assert.equal(completeScenario.totalActiveNominalPct, 2.8);
assert.equal(completeScenario.releaseEligible, false);
assert(completeScenario.provenance.some(x => x.evidenceClass === 'CATALOG_DEFAULT'));

const unknownAssay = buildBoundedActiveMatterReport([
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
  { id: 'unknown', name: 'Unknown surfactant grade', percentage: 10 } as any,
]);
assert.equal(unknownAssay.status, 'INSUFFICIENT_DATA');
assert.equal(unknownAssay.unknownRawPercent, 10);
assert.equal(unknownAssay.totalActiveNominalPct, null);
assert.deepEqual(unknownAssay.missingIngredientIds, ['unknown']);

const incompletePrice = buildBoundedCostReport([
  { id: 'priced', name: 'Priced ingredient', percentage: 90, costPerKg: 2 } as any,
  { id: 'unpriced', name: 'Unpriced ingredient', percentage: 10, costPerKg: null } as any,
], 100);
assert.equal(incompletePrice.status, 'INSUFFICIENT_DATA');
assert.equal(incompletePrice.knownSubtotalNominalPerKg, 1.8);
assert.equal(incompletePrice.totalCostNominalPerKg, null);
assert.equal(incompletePrice.batchCostNominal, null);
assert.equal(incompletePrice.unknownRawPercent, 10);
assert.equal(incompletePrice.releaseEligible, false);

const fullPrice = buildBoundedCostReport([
  { id: 'a', name: 'A', percentage: 50, costPerKg: 2 } as any,
  { id: 'b', name: 'B', percentage: 50, costPerKg: 4 } as any,
], 20);
assert.equal(fullPrice.status, 'COMPLETE');
assert.equal(fullPrice.totalCostNominalPerKg, 3);
assert.equal(fullPrice.batchCostNominal, 60);
assert.equal(fullPrice.releaseEligible, false);

console.log('PHASE 5B-1 REMAINING CONSUMER ADAPTER REGRESSIONS PASS');

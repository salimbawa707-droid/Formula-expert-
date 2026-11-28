import assert from 'node:assert/strict';
import {
  calculateBoundedActiveMatter,
  calculateBoundedFormulaCost,
  resolveBoundedInput,
} from '../src/utils/preliminaryBoundedCalculations';

const sles70 = {
  nominal: 70, lower: 68, upper: 72, unit: '% w/w',
  basis: 'as-supplied active matter, mass fraction',
  evidenceClass: 'ENGINEERING_ESTIMATE' as const,
  uncertaintyNote: 'Illustrative bounded scenario only; not a supplier or lot assay.',
};
const waterActive = {
  nominal: 0, unit: '% w/w', basis: 'water active-solids convention',
  evidenceClass: 'USER_ENTERED' as const,
};
const active = calculateBoundedActiveMatter([
  { id: 'sles', name: 'SLES scenario', rawPercent: 10, activeMatter: sles70 },
  { id: 'water', name: 'Water', rawPercent: 90, activeMatter: waterActive },
]);
assert.equal(active.status, 'COMPLETE');
assert.equal(active.massBalanced, true);
assert.equal(active.totalActiveNominalPct, 7);
assert.equal(active.totalActiveLowerPct, 6.8);
assert.equal(active.totalActiveUpperPct, 7.2);
assert.equal(active.releaseEligible, false);
assert(active.warnings.some(x => x.includes('point assumption')));

const unknownActive = calculateBoundedActiveMatter([
  { id: 'known', name: 'Known scenario', rawPercent: 90, activeMatter: waterActive },
  { id: 'unknown', name: 'Unknown grade', rawPercent: 10, activeMatter: null },
]);
assert.equal(unknownActive.status, 'INSUFFICIENT_DATA');
assert.equal(unknownActive.unknownRawPercent, 10);
assert.equal(unknownActive.totalActiveNominalPct, null);
assert.equal(unknownActive.totalActiveLowerPct, null);
assert.equal(unknownActive.totalActiveUpperPct, null);
assert.equal(unknownActive.missingIngredientIds[0], 'unknown');

const invalidActive = resolveBoundedInput({
  nominal: 101, unit: '% w/w', basis: 'as supplied',
  evidenceClass: 'USER_ENTERED',
}, '% w/w', 0, 100, 'invalid-active');
assert.equal(invalidActive.valid, false);
assert(invalidActive.errors.some(x => x.includes('range must be within')));

const wrongUnit = resolveBoundedInput({
  nominal: 70, unit: 'g/L', basis: 'as supplied',
  evidenceClass: 'USER_ENTERED',
}, '% w/w', 0, 100, 'wrong-unit');
assert.equal(wrongUnit.valid, false);
assert(wrongUnit.errors.some(x => x.includes('expected unit')));

const estimateWithoutUncertainty = resolveBoundedInput({
  nominal: 50, unit: '% w/w', basis: 'estimate',
  evidenceClass: 'ENGINEERING_ESTIMATE',
}, '% w/w', 0, 100, 'unsupported-estimate');
assert.equal(estimateWithoutUncertainty.valid, false);
assert(estimateWithoutUncertainty.errors.some(x => x.includes('uncertainty note')));

const priceSles = {
  nominal: 110, lower: 105, upper: 115, unit: 'INR/kg',
  basis: 'user-supplied raw-material price scenario',
  evidenceClass: 'USER_ENTERED' as const,
};
const priceWater = {
  nominal: 1, unit: 'INR/kg', basis: 'user-supplied water price',
  evidenceClass: 'USER_ENTERED' as const,
};
const cost = calculateBoundedFormulaCost([
  { id: 'sles', name: 'SLES', rawPercent: 10, pricePerKg: priceSles },
  { id: 'water', name: 'Water', rawPercent: 90, pricePerKg: priceWater },
], 100);
assert.equal(cost.status, 'COMPLETE');
assert.equal(cost.totalCostNominalPerKg, 11.9);
assert.equal(cost.totalCostLowerPerKg, 11.4);
assert.equal(cost.totalCostUpperPerKg, 12.4);
assert.equal(cost.batchCostNominal, 1190);
assert.equal(cost.batchCostLower, 1140);
assert.equal(cost.batchCostUpper, 1240);
assert.equal(cost.releaseEligible, false);

const partialCost = calculateBoundedFormulaCost([
  { id: 'known', name: 'Known', rawPercent: 90, pricePerKg: priceWater },
  { id: 'unknown', name: 'Unknown', rawPercent: 10, pricePerKg: null },
], 100);
assert.equal(partialCost.status, 'INSUFFICIENT_DATA');
assert.equal(partialCost.knownSubtotalNominalPerKg, 0.9);
assert.equal(partialCost.totalCostNominalPerKg, null);
assert.equal(partialCost.batchCostNominal, null);
assert.equal(partialCost.unknownRawPercent, 10);

const unbalanced = calculateBoundedFormulaCost([
  { id: 'sles', name: 'SLES', rawPercent: 10, pricePerKg: priceSles },
], 100);
assert.equal(unbalanced.status, 'PARTIAL');
assert.equal(unbalanced.massBalanced, false);
assert.equal(unbalanced.totalCostNominalPerKg, null);

const badBatch = calculateBoundedFormulaCost([
  { id: 'all', name: 'All', rawPercent: 100, pricePerKg: priceWater },
], 0);
assert.equal(badBatch.status, 'INVALID_INPUT');
assert.equal(badBatch.totalCostNominalPerKg, null);

console.log('PHASE 5B-1 BOUNDED ACTIVE MATTER AND COST TESTS PASS');

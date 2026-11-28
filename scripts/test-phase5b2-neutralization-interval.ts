import assert from 'node:assert/strict';
import { calculatePrimaryNeutralizationInterval } from '../src/domain/ph/neutralizationIntervalEngine';

const acid = (lowerEq: number, nominalEq: number, upperEq: number) => ({
  id: 'acid-1', name: 'Reference acid', lowerEq, nominalEq, upperEq,
  evidenceRef: 'TEST-ACID-COA', basis: 'mol-equivalent per batch'
});
const base = (lowerEq: number, nominalEq: number, upperEq: number) => ({
  id: 'base-1', name: 'Reference base', lowerEq, nominalEq, upperEq,
  evidenceRef: 'TEST-BASE-COA', basis: 'mol-equivalent per batch'
});

// Exact stoichiometric equivalence.
const exact = calculatePrimaryNeutralizationInterval([acid(2, 2, 2)], [base(2, 2, 2)]);
assert.equal(exact.status, 'BOUNDED_INPUT');
assert.equal(exact.classification, 'FULLY_NEUTRALIZED');
assert.equal(exact.reactionExtent?.nominal, 2);
assert.deepEqual(exact.neutralizationFraction, { lower: 1, nominal: 1, upper: 1 });
assert.equal(exact.residualAcidEquivalents?.nominal, 0);
assert.equal(exact.residualBaseEquivalents?.nominal, 0);
assert.equal(exact.waterGeneratedGrams?.nominal, 36.03056);
assert.equal(exact.releaseEligible, false);

// Acid-limited and base-limited point scenarios.
assert.equal(calculatePrimaryNeutralizationInterval([acid(3, 3, 3)], [base(2, 2, 2)]).classification, 'UNDER_NEUTRALIZED');
assert.equal(calculatePrimaryNeutralizationInterval([acid(2, 2, 2)], [base(3, 3, 3)]).classification, 'BASE_EXCESS');

// Crossed independent uncertainty must not be collapsed to a single classification.
const crossed = calculatePrimaryNeutralizationInterval([acid(1, 2, 3)], [base(1, 2, 3)]);
assert.equal(crossed.status, 'BOUNDED_INPUT');
assert.equal(crossed.classification, 'AMBIGUOUS_REACTION_SYSTEM');
assert.deepEqual(crossed.neutralizationFraction, { lower: 1 / 3, nominal: 1, upper: 1 });
assert.equal(crossed.scenarioClassifications.length, 3);
assert(crossed.residualAcidEquivalents!.upper >= crossed.residualAcidEquivalents!.lower);
assert(crossed.residualBaseEquivalents!.upper >= crossed.residualBaseEquivalents!.lower);

// Unknown evidence and empty input fail closed; they never become zero equivalents.
const noEvidence = calculatePrimaryNeutralizationInterval([
  { ...acid(1, 1, 1), evidenceRef: '' }
], [base(1, 1, 1)]);
assert.equal(noEvidence.status, 'INSUFFICIENT_DATA');
assert.equal(noEvidence.reactionExtent, null);
assert(noEvidence.missingInputs.length > 0);

const empty = calculatePrimaryNeutralizationInterval([], []);
assert.equal(empty.status, 'INSUFFICIENT_DATA');
assert.equal(empty.reactionExtent, null);

// Invalid ordering and mixed units/bases are rejected.
const badOrder = calculatePrimaryNeutralizationInterval([acid(2, 1, 3)], [base(1, 1, 1)]);
assert.equal(badOrder.status, 'INVALID_INPUT');
assert.equal(badOrder.reactionExtent, null);

const mixedBasis = calculatePrimaryNeutralizationInterval(
  [{ ...acid(1, 1, 1), basis: 'mol/kg' }],
  [{ ...base(1, 1, 1), basis: 'mol per batch' }]
);
assert.equal(mixedBasis.status, 'INVALID_INPUT');

console.log('PHASE 5B-2 NEUTRALIZATION INTERVAL REGRESSION PASS');

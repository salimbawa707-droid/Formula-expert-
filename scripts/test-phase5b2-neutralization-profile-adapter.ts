import assert from 'node:assert/strict';
import { adaptFormulaToPrimaryNeutralizationInterval } from '../src/domain/ph/neutralizationProfileIntervalAdapter';

// Source-verified pure reference reactants with explicit exact assay bounds.
// 326.49 g pure monoprotic LABSA = 1 mol-equivalent.
// 40.00 g pure mono-equivalent NaOH = 1 mol-equivalent.
const supported = adaptFormulaToPrimaryNeutralizationInterval([
  { name: 'LABSA 100% Reference', rawKg: 0.32649 } as any,
  { name: 'NaOH 100% Reference', rawKg: 0.04 } as any
], 1);
assert.equal(supported.status, 'READY_FOR_ARITHMETIC');
assert.equal(supported.blockedIngredients.length, 0);
assert.equal(supported.report?.status, 'BOUNDED_INPUT');
assert(Math.abs((supported.report?.acidEquivalents?.nominal ?? 0) - 1) < 1e-5);
assert(Math.abs((supported.report?.baseEquivalents?.nominal ?? 0) - 1) < 1e-5);
assert.equal(supported.report?.classification, 'FULLY_NEUTRALIZED');
assert.equal(supported.report?.waterGeneratedGrams, null);
assert.equal(supported.releaseEligible, false);
assert.equal(supported.evidence.length, 2);

// Commercial LABSA is deliberately blocked: its free-acid contribution and
// total commercial titration capacity are not established by active assay alone.
const commercialLabsa = adaptFormulaToPrimaryNeutralizationInterval([
  { name: 'LABSA 90%', rawKg: 1 },
  { name: 'NaOH 100% Reference', rawKg: 0.1 }
] as any, 1);
assert.equal(commercialLabsa.status, 'INSUFFICIENT_DATA');
assert.equal(commercialLabsa.report, null);
assert(commercialLabsa.blockedIngredients.some(x => x.name === 'LABSA 90%'));

// Missing mass on a primary reactant must block the whole interval.
const missingMass = adaptFormulaToPrimaryNeutralizationInterval([
  { name: 'LABSA 100% Reference' } as any,
  { name: 'NaOH 100% Reference', rawKg: 0.04 } as any
], 1);
assert.equal(missingMass.status, 'INSUFFICIENT_DATA');
assert.equal(missingMass.report, null);

// Weak citric acid is secondary chemistry in the primary-neutralization model;
// it must not be misclassified as a strong primary acid or counted as equivalents.
const weakSecondary = adaptFormulaToPrimaryNeutralizationInterval([
  { name: 'Citric Acid', rawKg: 1 } as any,
  { name: 'NaOH 100% Reference', rawKg: 0.1 } as any
], 1);
assert.equal(weakSecondary.status, 'READY_FOR_ARITHMETIC');
assert.equal(weakSecondary.acidInputs.length, 0);
assert.equal(weakSecondary.baseInputs.length, 1);
assert.equal(weakSecondary.report?.classification, 'BASE_EXCESS');

// A formula with only weak acid chemistry has no supported primary reactant.
const weakOnly = adaptFormulaToPrimaryNeutralizationInterval([
  { name: 'Citric Acid', rawKg: 1 } as any
], 1);
assert.equal(weakOnly.status, 'INSUFFICIENT_DATA');
assert.equal(weakOnly.report, null);

console.log('PHASE 5B-2 PROFILE-TO-EQUIVALENT ADAPTER REGRESSION PASS');

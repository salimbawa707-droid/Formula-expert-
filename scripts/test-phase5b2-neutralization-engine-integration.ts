import assert from 'node:assert/strict';
import { StoichiometricNeutralizationEngine } from '../src/domain/ph/stoichiometricNeutralizationEngine';

// The production engine exposes the bounded adapter as a separate diagnostic.
// It must never silently replace its existing nominal stoichiometric state.
const supported = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
  { name: 'LABSA 100% Reference', rawKg: 0.32649 } as any,
  { name: 'NaOH 100% Reference', rawKg: 0.04 } as any
], 1).value;
assert.equal(supported.boundedNeutralizationInterval?.status, 'READY_FOR_ARITHMETIC');
assert.equal(supported.boundedNeutralizationInterval?.report?.classification, 'FULLY_NEUTRALIZED');
assert.equal(supported.boundedNeutralizationInterval?.releaseEligible, false);
assert.equal(supported.boundedNeutralizationInterval?.report?.waterGeneratedGrams, null);

// Commercial LABSA is not accepted merely because the legacy nominal path can
// resolve an active assay. The bounded result must explicitly withhold output.
const commercial = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
  { name: 'LABSA 90%', rawKg: 1 } as any,
  { name: 'NaOH 100% Reference', rawKg: 0.1 } as any
], 1).value;
assert.equal(commercial.boundedNeutralizationInterval?.status, 'INSUFFICIENT_DATA');
assert.equal(commercial.boundedNeutralizationInterval?.report, null);
assert(commercial.boundedNeutralizationInterval?.blockedIngredients.some(x => x.name === 'LABSA 90%'));

console.log('PHASE 5B-2 STOICHIOMETRIC ENGINE INTEGRATION REGRESSION PASS');

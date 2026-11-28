import assert from 'node:assert/strict';
import { evaluatePHScenarios } from '../src/domain/ph/phScenarioEngine';
import { mergePHWarnings } from '../src/domain/ph/phDiagnostics';

const common = {
  totalMassKg: 100,
  evidenceRefs: ['test-fixture:citric-acid-sodium-citrate-buffer-v1'],
  options: { temperatureC: 25, activityModel: 'ideal' as const, maxIterations: 60, tolerance: 1e-8 }
};
const scenarios = [
  {
    ...common, scenarioId: 'acid-low', label: 'Lower acid loading',
    ingredients: [
      { name: 'Water', rawPercent: 97.8, activePercent: 0 },
      { name: 'Citric Acid Anhydrous', rawPercent: 0.2, activePercent: 100 },
      { name: 'Sodium Citrate', rawPercent: 2, activePercent: 100 }
    ]
  },
  {
    ...common, scenarioId: 'acid-nominal', label: 'Nominal acid loading',
    ingredients: [
      { name: 'Water', rawPercent: 97.7, activePercent: 0 },
      { name: 'Citric Acid Anhydrous', rawPercent: 0.3, activePercent: 100 },
      { name: 'Sodium Citrate', rawPercent: 2, activePercent: 100 }
    ]
  },
  {
    ...common, scenarioId: 'acid-high', label: 'Higher acid loading',
    ingredients: [
      { name: 'Water', rawPercent: 97.6, activePercent: 0 },
      { name: 'Citric Acid Anhydrous', rawPercent: 0.4, activePercent: 100 },
      { name: 'Sodium Citrate', rawPercent: 2, activePercent: 100 }
    ]
  }
];

const result = evaluatePHScenarios(scenarios);
assert.equal(result.status, 'SAMPLED_ENVELOPE_READY', JSON.stringify(result.scenarios));
assert.equal(result.seedInvariant, true);
assert.equal(result.scenarios.length, 3);
assert(result.envelope !== null);
assert(result.envelope!.minimumPH <= result.envelope!.maximumPH);
assert(result.scenarios.every(s => s.status === 'CONVERGED' && s.seedSpreadPH !== null && s.seedSpreadPH <= 0.01));
assert.equal(result.releaseEligible, false);
assert.equal(result.envelopeSemantics, 'SAMPLED_SCENARIO_ENVELOPE_NOT_GUARANTEED_BOUND');

const unknown = evaluatePHScenarios([
  { ...common, scenarioId: 'known', label: 'Known buffer', ingredients: scenarios[0].ingredients },
  { ...common, scenarioId: 'unknown', label: 'Unknown material included', ingredients: [
    ...scenarios[1].ingredients,
    { name: 'Unregistered proprietary additive', rawPercent: 0.1, activePercent: 100 }
  ] }
]);
assert.equal(unknown.status, 'INCOMPLETE_SCENARIOS');
assert.equal(unknown.envelope, null);
assert.equal(unknown.scenarios[1].status, 'INSUFFICIENT_DATA');

const mismatchedBasis = evaluatePHScenarios([
  scenarios[0],
  { ...scenarios[1], totalMassKg: 50 }
]);
assert.equal(mismatchedBasis.status, 'INVALID_INPUT');
assert.equal(mismatchedBasis.envelope, null);

const merged = mergePHWarnings(
  ['No identified acid/base or secondary buffer chemistry is present; solvent-water equilibrium is not accepted as a formulation pH result.'],
  ['PH_ACTIVE_SPECIES_UNAVAILABLE: No recognized acid/base/buffer contributor is present; neutral pH is not inferred.']
);
assert.equal(merged.length, 2);
assert(merged[0].startsWith('No identified acid/base'));
assert(merged[1].startsWith('PH_ACTIVE_SPECIES_UNAVAILABLE'));
assert.equal(mergePHWarnings(['duplicate', 'keep'], ['duplicate']).length, 2);

console.log('PHASE 5B-2 PHEngineV2 SCENARIO / INITIAL-GUESS / WARNING REGRESSIONS PASS');

import { getChelatorBindingCapacity, validateChelatorCapacity, calculateGreenChelators } from '../chelatorEngine';

export function runChelatorBindingTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  details: string[];
} {
  let passed = 0;
  let failed = 0;
  const details: string[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      passed++;
      details.push(`[PASS] ${name}`);
    } else {
      failed++;
      details.push(`[FAIL] ${name}: ${message || 'Assertion failed'}`);
    }
  }

  // TEST 1: Validate only the registered grade-specific capacity.
  const knownGLDA = getChelatorBindingCapacity('GLDA 47% Liquid');
  const res1 = validateChelatorCapacity(
    knownGLDA.capacityMgCaCO3PerGram,
    knownGLDA.evidenceId
  );
  assert('Validate registered GLDA capacity status is VALID', res1.status === 'VALID');
  assert('Validate registered GLDA capacity is 137 mg/g', res1.capacityMgCaCO3PerGram === 137);

  const mismatchedCapacity = validateChelatorCapacity(260, 'EVID-GLDA-47-SPEC');
  assert('Reject unsupported numeric capacity for a valid evidence ID', mismatchedCapacity.status === 'INSUFFICIENT_DATA');

  // TEST 2: Reject missing capacity
  const res2 = validateChelatorCapacity(null as any, 'EVID-GLDA-47-SPEC');
  assert('Reject missing capacity is INSUFFICIENT_DATA', res2.status === 'INSUFFICIENT_DATA');

  // TEST 3: Reject missing evidenceId
  const res3 = validateChelatorCapacity(260, '');
  assert('Reject empty evidenceId is INSUFFICIENT_DATA', res3.status === 'INSUFFICIENT_DATA');

  // TEST 3B: Reject arbitrary strings that are not registered evidence identifiers.
  const fakeEvidence = validateChelatorCapacity(260, 'Citation A');
  assert('Reject unregistered evidence identifier', fakeEvidence.status === 'INSUFFICIENT_DATA');

  // TEST 4: Return INSUFFICIENT_DATA for unknown ingredient
  const res4 = getChelatorBindingCapacity('Unknown Chelator');
  assert('Unknown chelator is INSUFFICIENT_DATA', res4.status === 'INSUFFICIENT_DATA');

  const ambiguousCitrate = getChelatorBindingCapacity('Sodium Citrate');
  assert('Ambiguous citrate hydration grade is INSUFFICIENT_DATA', ambiguousCitrate.status === 'INSUFFICIENT_DATA');

  // TEST 5: Return VALID for known ingredient with citation
  const res5 = knownGLDA;
  assert('Known ingredient status is VALID', res5.status === 'VALID');
  assert('Known ingredient capacity is 137', res5.capacityMgCaCO3PerGram === 137);
  assert('Known ingredient evidenceId is defined', res5.evidenceId !== undefined && res5.evidenceId.length > 0);

  const noScenario = calculateGreenChelators([{ name: 'GLDA 47% Liquid' }]);
  assert('Green chelator calculator refuses hidden scenario defaults', noScenario.status === 'INSUFFICIENT_DATA' && noScenario.totalCaCO3ToBindMg === undefined);

  const explicitScenario = calculateGreenChelators({
    waterHardnessPpm: 150,
    washVolumeL: 10,
    washDoseGrams: 50,
    safetyMarginPct: 25,
    coBuilderTargetPct: 10,
    maxFormulationCapPct: 3,
    chelators: [{ name: 'GLDA 47% Liquid' }]
  });
  assert('Explicit chelator scenario calculates only with supplied conditions', explicitScenario.status === 'CALCULATED');
  assert('10% co-builder target is not mislabeled as full hardness protection', explicitScenario.isHardnessLoadFullyCovered === false);
  assert('Calculated co-builder coverage is approximately 10%', Math.abs((explicitScenario.stoichiometricCoveragePct ?? 0) - 10) < 0.1);
  assert('Green chelator output does not claim a fabricated eco score', explicitScenario.score === 0);

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runChelatorBindingTestSuite();
if (_res.failed > 0) {
  throw new Error(`chelatorBinding.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}

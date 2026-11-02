import { getChelatorBindingCapacity, validateChelatorCapacity } from '../chelatorEngine';

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

  // TEST 1: Validate valid capacity
  const res1 = validateChelatorCapacity(260, 'Citation A');
  assert('Validate valid capacity status is VALID', res1.status === 'VALID');
  assert('Validate valid capacity value is 260', res1.capacityMgCaCO3PerGram === 260);

  // TEST 2: Reject missing capacity
  const res2 = validateChelatorCapacity(null as any, 'Citation A');
  assert('Reject missing capacity is INSUFFICIENT_DATA', res2.status === 'INSUFFICIENT_DATA');

  // TEST 3: Reject missing evidenceId
  const res3 = validateChelatorCapacity(260, '');
  assert('Reject empty evidenceId is INSUFFICIENT_DATA', res3.status === 'INSUFFICIENT_DATA');

  // TEST 4: Return INSUFFICIENT_DATA for unknown ingredient
  const res4 = getChelatorBindingCapacity('Unknown Chelator');
  assert('Unknown chelator is INSUFFICIENT_DATA', res4.status === 'INSUFFICIENT_DATA');

  // TEST 5: Return VALID for known ingredient with citation
  const res5 = getChelatorBindingCapacity('GLDA 47% Liquid');
  assert('Known ingredient status is VALID', res5.status === 'VALID');
  assert('Known ingredient capacity is 137', res5.capacityMgCaCO3PerGram === 137);
  assert('Known ingredient evidenceId is defined', res5.evidenceId !== undefined && res5.evidenceId.length > 0);

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

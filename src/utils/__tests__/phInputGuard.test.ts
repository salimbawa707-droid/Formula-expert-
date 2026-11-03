import { validatePHInput } from '../phInputGuard';

export function runPHInputGuardTestSuite(): {
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

  // Valid pH
  assert('Validate pH 7 is VALID', validatePHInput(7).status === 'VALID' && validatePHInput(7).value === 7);
  assert('Validate pH 0 is VALID', validatePHInput(0).status === 'VALID' && validatePHInput(0).value === 0);
  assert('Validate pH 14 is VALID', validatePHInput(14).status === 'VALID' && validatePHInput(14).value === 14);
  assert('Validate pH 4.5 is VALID', validatePHInput(4.5).status === 'VALID' && validatePHInput(4.5).value === 4.5);

  // Missing / null / undefined
  assert('Reject null pH', validatePHInput(null).status === 'INSUFFICIENT_DATA');
  assert('Reject undefined pH', validatePHInput(undefined).status === 'INSUFFICIENT_DATA');

  // Non-numeric
  assert('Reject string pH', validatePHInput('7').status === 'INSUFFICIENT_DATA');
  assert('Reject object pH', validatePHInput({}).status === 'INSUFFICIENT_DATA');

  // NaN and Infinity
  assert('Reject NaN pH', validatePHInput(NaN).status === 'INSUFFICIENT_DATA');
  assert('Reject Infinity pH', validatePHInput(Infinity).status === 'INSUFFICIENT_DATA');

  // Range boundaries
  assert('Reject negative pH', validatePHInput(-0.1).status === 'INSUFFICIENT_DATA');
  assert('Reject pH > 14', validatePHInput(14.1).status === 'INSUFFICIENT_DATA');

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runPHInputGuardTestSuite();
if (_res.failed > 0) {
  throw new Error(`phInputGuard.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}

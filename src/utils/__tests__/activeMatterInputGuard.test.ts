import { validateActiveMatterInput } from '../activeMatterInputGuard';

export function runActiveMatterInputGuardTestSuite(): {
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

  // Valid values
  assert('Validate 50% is VALID', validateActiveMatterInput(50).status === 'VALID' && validateActiveMatterInput(50).value === 50);
  assert('Validate 100% is VALID', validateActiveMatterInput(100).status === 'VALID');
  assert('Validate 0% is VALID', validateActiveMatterInput(0).status === 'VALID');
  assert('Validate 0.1% is VALID', validateActiveMatterInput(0.1).status === 'VALID');

  // Missing / null / undefined
  assert('Reject null active matter', validateActiveMatterInput(null).status === 'INSUFFICIENT_DATA');
  assert('Reject undefined active matter', validateActiveMatterInput(undefined).status === 'INSUFFICIENT_DATA');

  // Non-numeric
  assert('Reject string active matter', validateActiveMatterInput('50').status === 'INSUFFICIENT_DATA');
  assert('Reject object active matter', validateActiveMatterInput({}).status === 'INSUFFICIENT_DATA');

  // NaN and Infinity
  assert('Reject NaN active matter', validateActiveMatterInput(NaN).status === 'INSUFFICIENT_DATA');
  assert('Reject Infinity active matter', validateActiveMatterInput(Infinity).status === 'INSUFFICIENT_DATA');

  // Negative and > 100
  assert('Reject negative active matter', validateActiveMatterInput(-1).status === 'INSUFFICIENT_DATA');
  assert('Reject >100% active matter', validateActiveMatterInput(100.1).status === 'INSUFFICIENT_DATA');

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runActiveMatterInputGuardTestSuite();
if (_res.failed > 0) {
  throw new Error(`activeMatterInputGuard.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}

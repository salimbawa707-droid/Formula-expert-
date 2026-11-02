import { validateManufacturingAssay } from '../manufacturingEngine';

export function runManufacturingAssayTestSuite(): {
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

  // Valid assay values
  assert('Validate 50 is VALID', validateManufacturingAssay(50).status === 'VALID' && validateManufacturingAssay(50).value === 50);
  assert('Validate 100 is VALID', validateManufacturingAssay(100).status === 'VALID');
  assert('Validate 0.1 is VALID', validateManufacturingAssay(0.1).status === 'VALID');

  // Reject missing / null / undefined
  assert('Reject null assay', validateManufacturingAssay(null).status === 'INSUFFICIENT_DATA');
  assert('Reject undefined assay', validateManufacturingAssay(undefined).status === 'INSUFFICIENT_DATA');

  // Reject non-numeric
  assert('Reject string assay', validateManufacturingAssay('50').status === 'INSUFFICIENT_DATA');
  assert('Reject object assay without assayPct', validateManufacturingAssay({}).status === 'INSUFFICIENT_DATA');

  // Reject NaN and Infinity
  assert('Reject NaN assay', validateManufacturingAssay(NaN).status === 'INSUFFICIENT_DATA');
  assert('Reject Infinity assay', validateManufacturingAssay(Infinity).status === 'INSUFFICIENT_DATA');

  // Reject negative and > 100
  assert('Reject negative assay', validateManufacturingAssay(-1).status === 'INSUFFICIENT_DATA');
  assert('Reject >100 assay', validateManufacturingAssay(100.1).status === 'INSUFFICIENT_DATA');

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runManufacturingAssayTestSuite();
if (_res.failed > 0) {
  throw new Error(`manufacturingAssay.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}

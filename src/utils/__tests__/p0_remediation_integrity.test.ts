import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';

export function runP0RemediationIntegrityTestSuite(): {
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

  // TEST 1: Unknown active matter should NOT result in 100% active matter and must be INSUFFICIENT_DATA
  const amResult = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Test P0 Integrity',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [{ name: 'Unknown Chemical', percentage: 10 }]
  });

  assert(
    'Unknown active matter < 100%',
    Number.isNaN(amResult.totalActiveMatterPct) || Number(amResult.totalActiveMatterPct) < 100,
    `Got ${amResult.totalActiveMatterPct}`
  );
  assert(
    'Unknown active matter status is INSUFFICIENT_DATA',
    amResult.activeMatterStatus === 'INSUFFICIENT_DATA',
    `Got ${amResult.activeMatterStatus}`
  );

  // TEST 2: Formulation designed to fail pH solver must not fallback to 7.0
  const phResult = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Test pH Fallback',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [{ name: 'Strong Acid', percentage: 100, activeMatterPct: 100 }]
  });

  assert(
    'Failed pH should NOT be 7.0',
    phResult.finalEquilibriumPH !== 7.0,
    `Got ${phResult.finalEquilibriumPH}`
  );
  assert(
    'Failed pH status is INSUFFICIENT_DATA',
    phResult.phStatus === 'INSUFFICIENT_DATA',
    `Got ${phResult.phStatus}`
  );

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runP0RemediationIntegrityTestSuite();
if (_res.failed > 0) {
  throw new Error(`p0_remediation_integrity.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}

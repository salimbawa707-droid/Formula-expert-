import { ActiveMatterEngine } from '../activeMatterEngine';
import { computeFormulaFingerprint } from '../provenanceEngine';
import { FormulationIngredient } from '../../types';

export function runActiveMatterIntegrityTestSuite(): {
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

  const baseIngredient: FormulationIngredient = {
    name: 'SLES 70%',
    percentage: 15.0,
    activeMatterPct: 70
  };

  // TEST 1: Flag non-numeric active matter as insufficient data
  const invalidIng1 = { ...baseIngredient, activeMatterPct: 'invalid' as any };
  const report1 = ActiveMatterEngine.calculateActiveMatterReport([invalidIng1]);
  assert('Flag non-numeric active matter count', report1.ingredientsWithMissingActive === 1);
  assert('Non-numeric active matter status is INSUFFICIENT_DATA', report1.activeMatterStatus === 'INSUFFICIENT_DATA');
  assert('Non-numeric active matter diagnostics', report1.diagnostics.some(d => d.includes('invalid')));

  // TEST 2: Flag out-of-range active matter ( > 100%)
  const invalidIng2 = { ...baseIngredient, activeMatterPct: 150 };
  const report2 = ActiveMatterEngine.calculateActiveMatterReport([invalidIng2]);
  assert('Flag >100% active matter count', report2.ingredientsWithMissingActive === 1);
  assert('>100% active matter diagnostics', report2.diagnostics.some(d => d.includes('invalid')));

  // TEST 3: Flag out-of-range active matter ( < 0%)
  const invalidIng3 = { ...baseIngredient, activeMatterPct: -5 };
  const report3 = ActiveMatterEngine.calculateActiveMatterReport([invalidIng3]);
  assert('Flag <0% active matter count', report3.ingredientsWithMissingActive === 1);
  assert('<0% active matter diagnostics', report3.diagnostics.some(d => d.includes('invalid')));

  // TEST 4: Fingerprint contains UNKNOWN for invalid active matter
  const validFp = computeFormulaFingerprint('F1', '1.0.0', [baseIngredient], 'LAUNDRY_LIQUID');
  const invalidFp = computeFormulaFingerprint('F1', '1.0.0', [{ ...baseIngredient, activeMatterPct: -1 }], 'LAUNDRY_LIQUID');
  assert('Valid fingerprint has AM[70.00]', validFp.includes('AM[70.00]'));
  assert('Invalid fingerprint has AM[UNKNOWN]', invalidFp.includes('AM[UNKNOWN]'));
  assert('Invalid fingerprint has INTEGRITY[INVALID_AM]', invalidFp.includes('INTEGRITY[INVALID_AM]'));
  assert('Fingerprints are not equal', validFp !== invalidFp);

  // TEST 5: Fingerprint is distinctive for different valid active matter levels
  const fp70 = computeFormulaFingerprint('F1', '1.0.0', [baseIngredient], 'LAUNDRY_LIQUID');
  const fp28 = computeFormulaFingerprint('F1', '1.0.0', [{ ...baseIngredient, activeMatterPct: 28 }], 'LAUNDRY_LIQUID');
  assert('fp70 has AM[70.00]', fp70.includes('AM[70.00]'));
  assert('fp28 has AM[28.00]', fp28.includes('AM[28.00]'));
  assert('Distinct fingerprints for distinct AM', fp70 !== fp28);

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runActiveMatterIntegrityTestSuite();
if (_res.failed > 0) {
  throw new Error(`activeMatterIntegrity.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}

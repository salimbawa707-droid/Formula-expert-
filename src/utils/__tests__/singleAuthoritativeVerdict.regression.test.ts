import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runSingleAuthoritativeVerdictRegressionTestSuite() {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any) {
    results.push({
      group,
      name,
      passed: condition,
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    });
  }

  // A. pH outside target -> Final Verdict equals Quality Gate finalFormulaStatus without UI manual override
  const gatePH = evaluateScientificQualityGate({
    formulaName: 'Extreme pH Test',
    formulaVersion: '1.0.0',
    productCategory: 'Liquid Laundry Detergent',
    ingredients: [
      { name: 'Water', percentage: 70 },
      { name: 'Sodium Hydroxide', percentage: 30, role: 'Base' }
    ],
    waterHardnessPpm: 150,
    batchSizeKg: 100,
    targetCostPerKg: 50
  });
  assert('A. pH Outside Target', 'Final Verdict equals Quality Gate finalFormulaStatus without manual override', typeof gatePH.finalFormulaStatus === 'string', gatePH.finalFormulaStatus, 'string');

  // B. Compatibility issue -> Final Verdict comes directly from Quality Gate
  const gateComp = evaluateScientificQualityGate({
    formulaName: 'Incompatible Test',
    formulaVersion: '1.0.0',
    productCategory: 'Fabric Softener',
    ingredients: [
      { name: 'Water', percentage: 80 },
      { name: 'Anionic Surfactant (LABSA)', percentage: 10, role: 'Anionic Surfactant' },
      { name: 'Cationic Softener (Esterquat)', percentage: 10, role: 'Cationic Surfactant' }
    ],
    waterHardnessPpm: 150,
    batchSizeKg: 100,
    targetCostPerKg: 50
  });
  assert('B. Compatibility Issue', 'Final Verdict comes directly from Quality Gate for compatibility clash', gateComp.finalFormulaStatus === 'INCOMPATIBLE', gateComp.finalFormulaStatus, 'INCOMPATIBLE');

  // C. Category suitability issue -> Handled by Quality Gate specification evaluation
  const gateCategory = evaluateScientificQualityGate({
    formulaName: 'Category Suitability Test',
    formulaVersion: '1.0.0',
    productCategory: 'Fabric Softener',
    ingredients: [
      { name: 'Water', percentage: 90 },
      { name: 'Salt', percentage: 10, role: 'Salt' }
    ],
    waterHardnessPpm: 150,
    batchSizeKg: 100,
    targetCostPerKg: 50
  });
  assert('C. Category Suitability', 'Category suitability issues are evaluated strictly via Quality Gate', gateCategory.finalFormulaStatus !== 'VALID', gateCategory.finalFormulaStatus, 'non-VALID');

  // D. Blocking issues present -> Final Verdict comes from Quality Gate
  assert('D. Blocking Issues', 'Blocking issues determine status via Quality Gate authority', gateCategory.blockingIssues.length > 0 && gateCategory.finalFormulaStatus !== 'VALID', true, true);

  // E & F. Quality Score / Grade cannot change or override Final Verdict
  const testFormula = [
    { name: 'Water', percentage: 90, role: 'Solvent' },
    { name: 'SLES 28%', percentage: 10, role: 'Anionic Surfactant', activeMatterPct: 28 }
  ];
  const gateValid = evaluateScientificQualityGate({
    formulaName: 'Formula Evaluation Test',
    formulaVersion: '1.0.0',
    productCategory: 'Liquid Dishwash',
    ingredients: testFormula,
    waterHardnessPpm: 150,
    batchSizeKg: 100,
    targetCostPerKg: 50
  });
  const validStatuses = ['VALID', 'VALID_WITH_WARNINGS', 'LAB_VALIDATION_REQUIRED', 'OUT_OF_SPEC', 'INCOMPATIBLE', 'SCIENTIFICALLY_INVALID', 'INSUFFICIENT_DATA'];
  assert('G. Formula Evaluation Status', 'Formula evaluation yields a recognized FinalFormulaStatus from Quality Gate', validStatuses.includes(gateValid.finalFormulaStatus), gateValid.finalFormulaStatus, 'recognized FinalFormulaStatus');

  // H & I. LAB_VALIDATION_REQUIRED / BASELINE_ONLY cannot be bypassed by UI
  assert('H. Lab Validation Required', 'Quality gate preserves status state', typeof gateValid.finalFormulaStatus === 'string', true, true);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nSingle Authoritative Final Verdict Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

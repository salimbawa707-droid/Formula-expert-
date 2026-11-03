import { calculateDilution } from '../calculators';

export interface DilutionTestResult {
  name: string;
  group: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runDilutionRegressionTestSuite(): { passed: number; failed: number; total: number; results: DilutionTestResult[] } {
  const results: DilutionTestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any, message?: string) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
    });
  }

  function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.001) {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    assert(
      group,
      name,
      passed,
      actual,
      `${expected} ± ${tolerance}`,
      passed ? `PASS (diff: ${diff.toFixed(6)})` : `FAIL: got ${actual}, expected ${expected} ± ${tolerance} (diff: ${diff.toFixed(6)})`
    );
  }

  // ==========================================
  // MANDATORY USER TEST MATRIX
  // ==========================================

  // TEST 1: C1 = 50%, C2 = 10%, V2 = 100 L -> V1 = 20 L, Water = 80 L
  const t1 = calculateDilution(50, 10, 100);
  assertNear('Mandatory Matrix', 'TEST 1: C1=50%, C2=10%, V2=100L -> V1', t1.v1, 20.0, 0.0001);
  assertNear('Mandatory Matrix', 'TEST 1: C1=50%, C2=10%, V2=100L -> Water', t1.waterNeeded, 80.0, 0.0001);
  assert('Mandatory Matrix', 'TEST 1: Balance V1 + Water = V2', Math.abs((t1.v1 + t1.waterNeeded) - 100) < 0.0001, t1.v1 + t1.waterNeeded, 100);
  assert('Mandatory Matrix', 'TEST 1: Concentration Identity (C1 * V1)/V2 = C2', Math.abs(((50 * t1.v1) / 100) - 10) < 0.0001, (50 * t1.v1) / 100, 10);
  assert('Mandatory Matrix', 'TEST 1: isValid', t1.isValid === true, t1.isValid, true);

  // TEST 2: C1 = 70%, C2 = 15%, V2 = 100 L -> V1 = 21.428571... L, Water = 78.571428... L
  const t2 = calculateDilution(70, 15, 100);
  assertNear('Mandatory Matrix', 'TEST 2: C1=70%, C2=15%, V2=100L -> V1', t2.v1, 21.4286, 0.001);
  assertNear('Mandatory Matrix', 'TEST 2: C1=70%, C2=15%, V2=100L -> Water', t2.waterNeeded, 78.5714, 0.001);
  assert('Mandatory Matrix', 'TEST 2: Balance V1 + Water = V2', Math.abs((t2.v1 + t2.waterNeeded) - 100) < 0.001, t2.v1 + t2.waterNeeded, 100);

  // TEST 3: C1 = 40%, C2 = 20%, V2 = 50 L -> V1 = 25 L, Water = 25 L
  const t3 = calculateDilution(40, 20, 50);
  assertNear('Mandatory Matrix', 'TEST 3: C1=40%, C2=20%, V2=50L -> V1', t3.v1, 25.0, 0.0001);
  assertNear('Mandatory Matrix', 'TEST 3: C1=40%, C2=20%, V2=50L -> Water', t3.waterNeeded, 25.0, 0.0001);
  assert('Mandatory Matrix', 'TEST 3: Balance V1 + Water = V2', Math.abs((t3.v1 + t3.waterNeeded) - 50) < 0.0001, t3.v1 + t3.waterNeeded, 50);

  // TEST 4: C1 = 30%, C2 = 5%, V2 = 200 L -> V1 = 33.333333... L, Water = 166.666666... L
  const t4 = calculateDilution(30, 5, 200);
  assertNear('Mandatory Matrix', 'TEST 4: C1=30%, C2=5%, V2=200L -> V1', t4.v1, 33.3333, 0.001);
  assertNear('Mandatory Matrix', 'TEST 4: C1=30%, C2=5%, V2=200L -> Water', t4.waterNeeded, 166.6667, 0.001);
  assert('Mandatory Matrix', 'TEST 4: Balance V1 + Water = V2', Math.abs((t4.v1 + t4.waterNeeded) - 200) < 0.001, t4.v1 + t4.waterNeeded, 200);

  // TEST 5: C1 = 10%, C2 = 10%, V2 = 100 L -> V1 = 100 L, Water = 0 L
  const t5 = calculateDilution(10, 10, 100);
  assertNear('Mandatory Matrix', 'TEST 5: C1=10%, C2=10%, V2=100L -> V1', t5.v1, 100.0, 0.0001);
  assertNear('Mandatory Matrix', 'TEST 5: C1=10%, C2=10%, V2=100L -> Water', t5.waterNeeded, 0.0, 0.0001);
  assert('Mandatory Matrix', 'TEST 5: Balance V1 + Water = V2', t5.v1 + t5.waterNeeded === 100, t5.v1 + t5.waterNeeded, 100);

  // TEST 6: C1 = 80%, C2 = 20%, V2 = 10 L -> V1 = 2.5 L, Water = 7.5 L
  const t6 = calculateDilution(80, 20, 10);
  assertNear('Mandatory Matrix', 'TEST 6: C1=80%, C2=20%, V2=10L -> V1', t6.v1, 2.5, 0.0001);
  assertNear('Mandatory Matrix', 'TEST 6: C1=80%, C2=20%, V2=10L -> Water', t6.waterNeeded, 7.5, 0.0001);
  assert('Mandatory Matrix', 'TEST 6: Balance V1 + Water = V2', t6.v1 + t6.waterNeeded === 10, t6.v1 + t6.waterNeeded, 10);

  // TEST 7: C1 = 50%, C2 = 5%, V2 = 1000 L -> V1 = 100 L, Water = 900 L
  const t7 = calculateDilution(50, 5, 1000);
  assertNear('Mandatory Matrix', 'TEST 7: C1=50%, C2=5%, V2=1000L -> V1', t7.v1, 100.0, 0.0001);
  assertNear('Mandatory Matrix', 'TEST 7: C1=50%, C2=5%, V2=1000L -> Water', t7.waterNeeded, 900.0, 0.0001);
  assert('Mandatory Matrix', 'TEST 7: Balance V1 + Water = V2', t7.v1 + t7.waterNeeded === 1000, t7.v1 + t7.waterNeeded, 1000);

  // TEST 8: C1 = 99%, C2 = 1%, V2 = 500 L -> V1 = 5.050505 L, Water = 494.949495 L
  const t8 = calculateDilution(99, 1, 500);
  assertNear('Mandatory Matrix', 'TEST 8: C1=99%, C2=1%, V2=500L -> V1', t8.v1, 5.050505, 0.001);
  assertNear('Mandatory Matrix', 'TEST 8: C1=99%, C2=1%, V2=500L -> Water', t8.waterNeeded, 494.949495, 0.001);
  assert('Mandatory Matrix', 'TEST 8: Balance V1 + Water = V2', Math.abs((t8.v1 + t8.waterNeeded) - 500) < 0.001, t8.v1 + t8.waterNeeded, 500);
  assertNear('Mandatory Matrix', 'TEST 8: Concentration check', (99 * t8.v1) / 500, 1.0, 0.001);

  // TEST 9: C1 = 25%, C2 = 12.5%, V2 = 80 L -> V1 = 40 L, Water = 40 L
  const t9 = calculateDilution(25, 12.5, 80);
  assertNear('Mandatory Matrix', 'TEST 9: C1=25%, C2=12.5%, V2=80L -> V1', t9.v1, 40.0, 0.0001);
  assertNear('Mandatory Matrix', 'TEST 9: C1=25%, C2=12.5%, V2=80L -> Water', t9.waterNeeded, 40.0, 0.0001);
  assert('Mandatory Matrix', 'TEST 9: Balance V1 + Water = V2', t9.v1 + t9.waterNeeded === 80, t9.v1 + t9.waterNeeded, 80);
  assertNear('Mandatory Matrix', 'TEST 9: Concentration check', (25 * t9.v1) / 80, 12.5, 0.0001);

  // ==========================================
  // VALIDATION & ERROR STATE TESTS
  // ==========================================

  // VALIDATION TEST: C1 = 10%, C2 = 20%, V2 = 100 L (Target C2 > C1)
  const val1 = calculateDilution(10, 20, 100);
  assert('Validation Tests', 'C2 > C1 returns isValid: false', val1.isValid === false, val1.isValid, false);
  assert('Validation Tests', 'C2 > C1 has descriptive errorMessage', Boolean(val1.errorMessage && val1.errorMessage.includes('exceed')), val1.errorMessage, 'Descriptive error');
  assert('Validation Tests', 'C2 > C1 v1 is 0', val1.v1 === 0, val1.v1, 0);

  // C1 = 0 (Division by zero protection)
  const val2 = calculateDilution(0, 10, 100);
  assert('Validation Tests', 'C1 = 0 returns isValid: false', val2.isValid === false, val2.isValid, false);
  assert('Validation Tests', 'C1 = 0 v1 is 0', val2.v1 === 0, val2.v1, 0);

  // V2 = 0
  const val3 = calculateDilution(50, 10, 0);
  assert('Validation Tests', 'V2 = 0 returns isValid: false', val3.isValid === false, val3.isValid, false);

  // Negative inputs
  const val4 = calculateDilution(-50, 10, 100);
  assert('Validation Tests', 'Negative C1 returns isValid: false', val4.isValid === false, val4.isValid, false);

  const val5 = calculateDilution(50, -10, 100);
  assert('Validation Tests', 'Negative C2 returns isValid: false', val5.isValid === false, val5.isValid, false);

  const val6 = calculateDilution(50, 10, -100);
  assert('Validation Tests', 'Negative V2 returns isValid: false', val6.isValid === false, val6.isValid, false);

  // Malformed / NaN / null / undefined inputs
  const valNaN1 = calculateDilution(NaN as any, 10, 100);
  assert('Validation Tests', 'NaN C1 returns isValid: false', valNaN1.isValid === false, valNaN1.isValid, false);

  const valNaN2 = calculateDilution(50, NaN as any, 100);
  assert('Validation Tests', 'NaN C2 returns isValid: false', valNaN2.isValid === false, valNaN2.isValid, false);

  const valNull = calculateDilution(null as any, null as any, null as any);
  assert('Validation Tests', 'Null inputs return isValid: false', valNull.isValid === false, valNull.isValid, false);

  // ==========================================
  // DECIMAL & EXTREME RANGE TESTS
  // ==========================================

  // Decimal case: C1 = 47.5%, C2 = 12.25%, V2 = 37.5 L
  const decTarget = calculateDilution(47.5, 12.25, 37.5);
  const decTargetV1Expected = (12.25 * 37.5) / 47.5; // 9.6710526...
  const decTargetWaterExpected = 37.5 - decTargetV1Expected; // 27.828947...
  assertNear('Decimal Tests', 'Decimal C1=47.5%, C2=12.25%, V2=37.5L -> V1', decTarget.v1, decTargetV1Expected, 0.001);
  assertNear('Decimal Tests', 'Decimal C1=47.5%, C2=12.25%, V2=37.5L -> Water', decTarget.waterNeeded, decTargetWaterExpected, 0.001);
  assert('Decimal Tests', 'Decimal C1=47.5% balance check', Math.abs((decTarget.v1 + decTarget.waterNeeded) - 37.5) < 0.001, decTarget.v1 + decTarget.waterNeeded, 37.5);
  assertNear('Decimal Tests', 'Decimal C1=47.5% concentration check', (47.5 * decTarget.v1) / 37.5, 12.25, 0.001);

  // Decimal concentrations: C1 = 27.5%, C2 = 3.25%, V2 = 125.5 L
  const dec1 = calculateDilution(27.5, 3.25, 125.5);
  const decV1Expected = (3.25 * 125.5) / 27.5; // 14.831818...
  assertNear('Decimal Tests', 'Decimal concentrations & volume -> V1', dec1.v1, decV1Expected, 0.001);
  assertNear('Decimal Tests', 'Decimal concentrations & volume -> Water', dec1.waterNeeded, 125.5 - decV1Expected, 0.001);
  assert('Decimal Tests', 'Decimal balance V1 + Water = V2', Math.abs((dec1.v1 + dec1.waterNeeded) - 125.5) < 0.001, dec1.v1 + dec1.waterNeeded, 125.5);

  // Micro-scale: C1 = 0.5%, C2 = 0.05%, V2 = 0.25 L
  const micro = calculateDilution(0.5, 0.05, 0.25);
  assertNear('Extreme Tests', 'Micro-scale dilution -> V1', micro.v1, 0.025, 0.0001);
  assertNear('Extreme Tests', 'Micro-scale dilution -> Water', micro.waterNeeded, 0.225, 0.0001);

  // Large industrial scale: C1 = 98%, C2 = 2%, V2 = 50000 L
  const macro = calculateDilution(98, 2, 50000);
  const macroV1Expected = (2 * 50000) / 98; // 1020.40816...
  assertNear('Extreme Tests', 'Industrial large batch -> V1', macro.v1, macroV1Expected, 0.01);
  assertNear('Extreme Tests', 'Industrial large batch -> Water', macro.waterNeeded, 50000 - macroV1Expected, 0.01);

  // Polymorphic object signature: { c1: 70, c2: 15, v2: 50 }
  const objTest = calculateDilution({ c1: 70, c2: 15, v2: 50 } as any);
  assertNear('Polymorphic Input', 'Object input format -> V1', objTest.v1, 10.7143, 0.001);
  assertNear('Polymorphic Input', 'Object input format -> Water', objTest.waterNeeded, 39.2857, 0.001);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return { passed, failed, total: results.length, results };
}

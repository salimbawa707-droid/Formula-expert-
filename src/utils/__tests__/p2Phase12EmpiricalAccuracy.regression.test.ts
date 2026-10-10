/**
 * ============================================================================
 * P2-12 — EMPIRICAL 95% ACCURACY FRAMEWORK REGRESSION TEST SUITE
 * ============================================================================
 * Verifies empirical accuracy contracts, laboratory observation registration,
 * synthetic data rejection, regression error metrics (MAE, RMSE, Bias),
 * validation gates, and 95-98% target governance.
 * ============================================================================
 */

import { EmpiricalAccuracyEngine } from '../empiricalAccuracyFramework';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP2Phase12EmpiricalAccuracyTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({
        name,
        passed: false,
        message: `Assertion failed. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
        actual,
        expected
      });
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  EmpiricalAccuracyEngine.resetFramework();

  // 1. Synthetic data rejection test
  const syntheticRes = EmpiricalAccuracyEngine.registerObservation({
    observationId: 'obs-syn-1',
    datasetId: 'ds-syn',
    datasetVersion: '1.0',
    formulaId: 'F-1',
    formulaVersion: '1.0',
    formulaFingerprint: 'fp-1',
    productCategory: 'LAUNDRY_LIQUID',
    batchId: 'B-1',
    waterProfile: { hardnessPpm: 150 },
    temperatureC: 25,
    dosageGramsPerL: 5,
    contactTimeMin: 15,
    testMethod: 'ASTM D3050',
    replicateId: 1,
    measuredResult: 85,
    unit: 'Score',
    laboratoryName: 'Lab-A',
    operator: 'Op-1',
    testDate: '2026-10-05',
    evidenceId: 'ev-1',
    datasetStatus: 'SYNTHETIC_TEST_DATA'
  });
  assert(
    'Synthetic test data is successfully rejected from empirical calibration and validation datasets',
    syntheticRes.success === false && syntheticRes.errors.some(e => e.includes('Synthetic test data')),
    syntheticRes.success,
    false
  );

  // 2. Real laboratory observation registration test
  const realRes = EmpiricalAccuracyEngine.registerObservation({
    observationId: 'obs-real-1',
    datasetId: 'ds-real-v1',
    datasetVersion: '1.0',
    formulaId: 'F-1',
    formulaVersion: '1.0',
    formulaFingerprint: 'fp-formula-123',
    productCategory: 'LAUNDRY_LIQUID',
    batchId: 'B-101',
    waterProfile: { hardnessPpm: 150 },
    temperatureC: 25,
    dosageGramsPerL: 5,
    contactTimeMin: 15,
    testMethod: 'ASTM D3050',
    replicateId: 1,
    measuredResult: 88.5,
    unit: 'Score',
    laboratoryName: 'Certified-Lab',
    operator: 'Dr. Smith',
    testDate: '2026-10-05',
    evidenceId: 'ev-cert-1',
    datasetStatus: 'APPROVED_FOR_VALIDATION'
  });
  assert(
    'Valid certified laboratory observation with provenance fingerprint successfully registers',
    realRes.success === true && EmpiricalAccuracyEngine.getObservations().length === 1,
    realRes.success,
    true
  );

  // 3. Regression Error Metrics (MAE, RMSE, Bias) calculation test
  const predicted = [85.0, 90.0, 78.0];
  const measured = [88.0, 89.0, 77.0];
  const metrics = EmpiricalAccuracyEngine.computeRegressionMetrics(predicted, measured, 'Cleaning Score');
  assert(
    'Regression error metrics (MAE, RMSE, Bias) compute correctly',
    metrics.sampleCount === 3 && metrics.mae === 1.6667 && metrics.rmse === 1.9149 && metrics.bias === -0.3333,
    metrics.mae,
    1.6667
  );

  // 4. Validation Gate Evaluation Test
  const gatePass = EmpiricalAccuracyEngine.evaluateValidationGate('target-cleaning-score', {
    property: 'Cleaning Score',
    sampleCount: 120,
    mae: 4.2,
    rmse: 4.8,
    bias: 0.1
  });
  assert(
    'Validation gate correctly passes when MAE meets acceptance threshold',
    gatePass.canPromoteToLabValidated === true,
    gatePass.canPromoteToLabValidated,
    true
  );

  const gateFail = EmpiricalAccuracyEngine.evaluateValidationGate('target-cleaning-score', {
    property: 'Cleaning Score',
    sampleCount: 120,
    mae: 6.5,
    rmse: 7.0,
    bias: 0.5
  });
  assert(
    'Validation gate correctly fails when MAE exceeds acceptance threshold',
    gateFail.canPromoteToLabValidated === false,
    gateFail.canPromoteToLabValidated,
    false
  );

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P2-12 EMPIRICAL ACCURACY TESTS : ${results.length}`);
  console.log(`PASSED                               : ${results.filter(r => r.passed).length}`);
  console.log(`FAILED                               : ${results.filter(r => !r.passed).length}`);
  console.log("--------------------------------------------------------------------------------");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (process.argv[1] && process.argv[1].includes('p2Phase12EmpiricalAccuracy.regression.test')) {
  runP2Phase12EmpiricalAccuracyTestSuite();
}

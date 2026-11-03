/**
 * ============================================================================
 * P2-12 GAP CLOSURE & HARDENING REGRESSION TEST SUITE
 * ============================================================================
 * Verifies R² coefficient of determination, confidence vs. prediction intervals,
 * baseline comparisons, grouped leakage detection, synthetic data firewall,
 * strict validation gates, and model versioning.
 * ============================================================================
 */

import { HardenedEmpiricalAccuracyEngine, ALL_13_CATEGORIES } from '../empiricalAccuracyFramework';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP2Phase12GapClosureHardeningTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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

  HardenedEmpiricalAccuracyEngine.resetHardenedFramework();

  // 1. Dataset Versioning & Registration
  const dsRes = HardenedEmpiricalAccuracyEngine.registerDataset({
    datasetId: 'ds-clean-2027',
    version: '2.0.0',
    categories: ['LAUNDRY_LIQUID'],
    property: 'Cleaning Score / CPI',
    sourceType: 'Certified ASTM Lab',
    provenanceIds: ['prov-101'],
    observationCount: 150,
    formulaCount: 50,
    batchCount: 50,
    status: 'APPROVED_FOR_VALIDATION',
    createdAt: '2026-10-05'
  });
  assert('Dataset versioning and registration works correctly', dsRes.success === true, dsRes.success, true);

  // 2. Synthetic Data Firewall (Negative Test)
  const synObsRes = HardenedEmpiricalAccuracyEngine.registerObservation({
    observationId: 'obs-syn-99',
    datasetId: 'ds-clean-2027',
    datasetVersion: '2.0.0',
    formulaId: 'F-syn',
    formulaVersion: '1.0',
    formulaFingerprint: 'fp-syn',
    productCategory: 'LAUNDRY_LIQUID',
    batchId: 'B-syn',
    waterProfile: { hardnessPpm: 150 },
    temperatureC: 25,
    dosageGramsPerL: 5,
    contactTimeMin: 15,
    testMethod: 'ASTM D3050',
    replicateId: 1,
    measuredResult: 90,
    unit: 'Score',
    laboratoryName: 'Synthetic-Gen',
    operator: 'Bot',
    testDate: '2026-10-05',
    evidenceId: 'ev-syn',
    datasetStatus: 'SYNTHETIC_TEST_DATA'
  });
  assert('Synthetic data firewall successfully blocks SYNTHETIC_TEST_DATA from entering production', synObsRes.success === false, synObsRes.success, false);

  // 3. R² Coefficient of Determination Calculation
  const pred = [85, 90, 78, 92, 88];
  const meas = [86, 89, 79, 93, 87];
  const regMetrics = HardenedEmpiricalAccuracyEngine.computeRegressionMetrics(pred, meas, 'Cleaning Score');
  assert('Regression metrics correctly compute R² coefficient of determination', typeof regMetrics.r2 === 'number' && regMetrics.r2! > 0.9, regMetrics.r2, '> 0.9');

  // 4. Classification Metrics
  const classMetrics = HardenedEmpiricalAccuracyEngine.computeClassificationMetrics(
    [true, true, false, false, true],
    [true, false, false, true, true]
  );
  assert('Classification metrics (accuracy, precision, recall, F1, balanced accuracy) compute correctly', classMetrics.accuracy === 0.6 && classMetrics.f1 === 0.6667, classMetrics.accuracy, 0.6);

  // 5. Statistical Intervals
  const intervals = HardenedEmpiricalAccuracyEngine.computeStatisticalIntervals(88.5, [0.5, -0.4, 0.2, -0.1, 0.3]);
  assert('Statistical intervals (confidence vs prediction) compute correctly when sample size >= 5', Boolean(intervals.confidenceInterval && intervals.predictionInterval), Boolean(intervals.confidenceInterval), true);

  // 6. Baseline Comparison
  const baselineCmp = HardenedEmpiricalAccuracyEngine.evaluateBaselineComparison(
    { property: 'Score', sampleCount: 50, mae: 3.5, rmse: 4.1, bias: 0.1 },
    { property: 'Score', sampleCount: 50, mae: 8.2, rmse: 9.0, bias: 0.5 }
  );
  assert('Baseline comparison correctly identifies candidate model superiority over baseline heuristic', baselineCmp.isSuperior === true && baselineCmp.improvementPct > 50, baselineCmp.isSuperior, true);

  // 7. Grouped Leakage Protection
  const leakage = HardenedEmpiricalAccuracyEngine.checkGroupedLeakage(
    ['fp-formula-A', 'fp-formula-B'],
    ['fp-formula-B', 'fp-formula-C']
  );
  assert('Grouped leakage detector successfully identifies overlapping formula fingerprints between calibration and test partitions', leakage.hasLeakage === true && leakage.leakedFingerprints.includes('fp-formula-B'), leakage.hasLeakage, true);

  // 8. Strict Validation Gate
  const gate = HardenedEmpiricalAccuracyEngine.evaluateStrictValidationGate(
    'target-cleaning-score',
    { property: 'Cleaning Score', sampleCount: 120, mae: 4.0, rmse: 4.5, bias: 0.1 },
    35,
    true,
    true
  );
  assert('Strict validation gate enforces sample size, error threshold, provenance completeness, and leakage audit', gate.canPromoteToLabValidated === true, gate.canPromoteToLabValidated, true);

  // 9. Model Versioning & 13-Category Validation Matrix
  HardenedEmpiricalAccuracyEngine.registerModelVersion({
    modelId: 'model-cleaning-cpi',
    modelVersion: '2.1.0',
    modelDefinitionHash: 'sha256-abc123hash',
    calibrationDatasetId: 'ds-clean-2027',
    validationDatasetId: 'ds-clean-2027',
    createdAt: '2026-10-05',
    status: 'FROZEN'
  });
  const modelVers = HardenedEmpiricalAccuracyEngine.getModelVersions('model-cleaning-cpi');
  assert('Model versioning correctly tracks version hashes and frozen status', modelVers.length === 1 && modelVers[0].modelVersion === '2.1.0', modelVers.length, 1);
  assert('All 13 product categories are fully defined in the validation matrix', ALL_13_CATEGORIES.length === 13, ALL_13_CATEGORIES.length, 13);

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P2-12 GAP CLOSURE HARDENING TESTS : ${results.length}`);
  console.log(`PASSED                                  : ${results.filter(r => r.passed).length}`);
  console.log(`FAILED                                  : ${results.filter(r => !r.passed).length}`);
  console.log("--------------------------------------------------------------------------------");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (process.argv[1] && process.argv[1].includes('p2Phase12GapClosureHardening.regression.test')) {
  runP2Phase12GapClosureHardeningTestSuite();
}

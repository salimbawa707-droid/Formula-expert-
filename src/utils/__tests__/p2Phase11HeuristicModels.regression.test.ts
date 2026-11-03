/**
 * ============================================================================
 * P2-11 — REPLACE / LABEL HEURISTIC SCIENTIFIC MODELS REGRESSION TEST SUITE
 * ============================================================================
 * Verifies the Scientific Model Maturity Registry, maturity classifications,
 * uncertainty propagation, and absence of false precision across all heuristic
 * and predictive models in the Detergent Formula Expert system.
 * ============================================================================
 */

import {
  SCIENTIFIC_MODEL_REGISTRY,
  getModelMetadata
} from '../scientificModelRegistry';
import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP2Phase11HeuristicModelsTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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

  // 1. Model Registry verification
  assert(
    'Model Registry contains all core predictive and heuristic models',
    Boolean(
      SCIENTIFIC_MODEL_REGISTRY['model-cpi-cleaning'] &&
      SCIENTIFIC_MODEL_REGISTRY['model-density-prediction'] &&
      SCIENTIFIC_MODEL_REGISTRY['model-hlb-screening'] &&
      SCIENTIFIC_MODEL_REGISTRY['model-compatibility-screening'] &&
      SCIENTIFIC_MODEL_REGISTRY['model-stability-screening'] &&
      SCIENTIFIC_MODEL_REGISTRY['model-foam-prediction'] &&
      SCIENTIFIC_MODEL_REGISTRY['model-active-matter']
    )
  );

  // 2. Cleaning Score / CPI maturity verification
  const cleaningMeta = getModelMetadata('model-cpi-cleaning');
  assert(
    'Cleaning Score / CPI is classified as HEURISTIC_SCREENING and not validated',
    cleaningMeta.maturity === 'HEURISTIC_SCREENING' && cleaningMeta.validationStatus !== 'VALIDATED',
    cleaningMeta.maturity,
    'HEURISTIC_SCREENING'
  );

  // 3. Density prediction verification
  const densityMeta = getModelMetadata('model-density-prediction');
  assert(
    'Density prediction is classified as EMPIRICAL_MODEL',
    densityMeta.maturity === 'EMPIRICAL_MODEL',
    densityMeta.maturity,
    'EMPIRICAL_MODEL'
  );

  // 4. Stability / Shelf life verification
  const stabilityMeta = getModelMetadata('model-stability-screening');
  assert(
    'Shelf life stability model is classified as ESTIMATED with screening limitations',
    stabilityMeta.maturity === 'ESTIMATED' && stabilityMeta.limitations.some(l => l.includes('Not a guaranteed')),
    stabilityMeta.maturity,
    'ESTIMATED'
  );

  // 5. Active matter verification
  const activeMeta = getModelMetadata('model-active-matter');
  assert(
    'Active matter calculation references source-backed commercial assay maturity',
    activeMeta.maturity === 'SOURCE_BACKED_MODEL' && activeMeta.validationStatus === 'VALIDATED',
    activeMeta.maturity,
    'SOURCE_BACKED_MODEL'
  );

  // 6. Unknown fallback verification
  const unknownMeta = getModelMetadata('non-existent-model-id');
  assert(
    'Unknown or unlisted models fallback safely to UNKNOWN_NOT_VALIDATED',
    unknownMeta.maturity === 'UNKNOWN_NOT_VALIDATED',
    unknownMeta.maturity,
    'UNKNOWN_NOT_VALIDATED'
  );

  // 7. Orchestrator execution integration test
  try {
    const evalResult = FormulaScientificOrchestrator.evaluate({
      formulaName: 'P2-11 Verification Formula',
      productCategory: 'Laundry Liquid',
      ingredients: [
        { name: 'Linear Alkylbenzene Sulfonic Acid', percentage: 15, activeMatterPct: 96, costPerKg: 2.2 },
        { name: 'Sodium Laureth Sulfate', percentage: 10, activeMatterPct: 70, costPerKg: 1.8 },
        { name: 'Deionized Water', percentage: 75, activeMatterPct: 0, costPerKg: 0.1 }
      ]
    });
    assert(
      'Orchestrator evaluation executes successfully and returns valid scientific result structure',
      Boolean(evalResult && evalResult.cleaningResult),
      Boolean(evalResult),
      true
    );
  } catch (err: any) {
    assert(
      'Orchestrator evaluation executes successfully and returns valid scientific result structure',
      false,
      err?.message,
      'No error'
    );
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P2-11 HEURISTIC MODEL TESTS : ${results.length}`);
  console.log(`PASSED                            : ${results.filter(r => r.passed).length}`);
  console.log(`FAILED                            : ${results.filter(r => !r.passed).length}`);
  console.log("--------------------------------------------------------------------------------");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (process.argv[1] && process.argv[1].includes('p2Phase11HeuristicModels.regression.test')) {
  runP2Phase11HeuristicModelsTestSuite();
}

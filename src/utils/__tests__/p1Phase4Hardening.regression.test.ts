/**
 * ============================================================================
 * P1 PHASE 4 HARDENING — SCIENTIFIC INTEGRITY GATE REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Audits and verifies scientific integrity constraints for Phase 4:
 * 1. Default formula without lab measurements returns isMeasured === false and provenance 'PREDICTED'.
 * 2. KPI names and descriptions explicitly contain "Predicted" and "(Model Estimate)".
 * 3. Formula with explicit labMeasurements returns isMeasured === true, provenance 'MEASURED',
 *    accurate predictionVariance, predictionErrorPct, and high-variance warnings.
 * 4. Fabric Softener returns cleaningScore === null, isCleaningApplicable === false, and NOT_APPLICABLE provenance.
 * 5. Empty / zero-data formula returns provenance 'INSUFFICIENT_DATA' without fabricating certainty.
 * 6. All 13 canonical product categories pass with hardened predictive terminology.
 */

import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import { FormulationIngredient } from '../../types';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase4HardeningTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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

  console.log('\n================================================================================');
  console.log('  P1 PHASE 4 HARDENING — SCIENTIFIC INTEGRITY GATE TEST SUITE ');
  console.log('================================================================================\n');

  // Sample standard laundry liquid formula
  const sampleLaundryFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 6, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 4, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, category: 'Builder' },
    { name: 'Protease Enzyme', percentage: 1, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Water', percentage: 76, category: 'Solvent' }
  ];

  // --------------------------------------------------------------------------
  // REQUIREMENT 1: Default Formula Provenance & Unmeasured Safeguards
  // --------------------------------------------------------------------------
  const defaultRes = calculateCleaningPerformance(sampleLaundryFormula, 8.5, 'LAUNDRY_LIQUID');
  assert('Default Formula isMeasured is False', defaultRes.isMeasured === false, defaultRes.isMeasured, false);
  assert('Default Formula Provenance is PREDICTED', defaultRes.provenance === 'PREDICTED', defaultRes.provenance, 'PREDICTED');
  assert('Default Formula Prediction Variance is Undefined', defaultRes.predictionVariance === undefined, defaultRes.predictionVariance, undefined);
  assert('Default Formula Limitations Disclaims Lab Validation', defaultRes.limitations.includes('NOT an empirical laboratory test result'), true, true);

  // --------------------------------------------------------------------------
  // REQUIREMENT 2: Terminology Hardening (Predicted + Model Estimate)
  // --------------------------------------------------------------------------
  const defaultKPIs = defaultRes.categoryKPIs.filter(k => k.isApplicable && k.provenance !== 'NOT_APPLICABLE');
  assert('Applicable KPIs Have "Predicted" in Name', defaultKPIs.every(k => k.name.startsWith('Predicted')), true, true);
  assert('Applicable KPIs Have "(Model Estimate)" in Description', defaultKPIs.every(k => k.description.includes('(Model Estimate)')), true, true);

  // --------------------------------------------------------------------------
  // REQUIREMENT 3: Explicit Empirical Laboratory Measurements & Variance
  // --------------------------------------------------------------------------
  const labData = {
    measuredSoilRemovalPct: 88.0,
    testMethod: 'ASTM D4265 Terg-O-Tometer Swatch Reflectometry',
    testDate: '2026-09-29',
    operator: 'Lead Formulation Chemist'
  };
  const measuredRes = calculateCleaningPerformance(sampleLaundryFormula, 8.5, 'LAUNDRY_LIQUID', labData);
  assert('Measured Result isMeasured is True', measuredRes.isMeasured === true, measuredRes.isMeasured, true);
  assert('Measured Result Provenance is MEASURED', measuredRes.provenance === 'MEASURED', measuredRes.provenance, 'MEASURED');
  assert('Measured Model Type Refers to Standard Protocol', measuredRes.modelType.includes('ASTM D4265 Terg-O-Tometer'), true, true);
  
  const expectedVariance = Number((88.0 - measuredRes.cpi).toFixed(1));
  assert('Measured Result Prediction Variance Correct', measuredRes.predictionVariance === expectedVariance, measuredRes.predictionVariance, expectedVariance);
  
  const expectedErrorPct = Number(((Math.abs(expectedVariance) / 88.0) * 100).toFixed(1));
  assert('Measured Result Prediction Error Pct Correct', measuredRes.predictionErrorPct === expectedErrorPct, measuredRes.predictionErrorPct, expectedErrorPct);

  // Check measured status on KPIs
  const measuredKPIs = measuredRes.categoryKPIs.filter(k => k.isApplicable && k.provenance !== 'NOT_APPLICABLE');
  assert('Measured KPIs Have MEASURED Provenance', measuredKPIs.every(k => k.provenance === 'MEASURED'), true, true);

  // --------------------------------------------------------------------------
  // REQUIREMENT 4: High Prediction Variance Warning Threshold (>20%)
  // --------------------------------------------------------------------------
  // Suppose model predicts ~80, but actual lab test measures 40% (50% error)
  const divergentLabData = {
    measuredSoilRemovalPct: 40.0,
    testMethod: 'ASTM D4265 Terg-O-Tometer'
  };
  const divergentRes = calculateCleaningPerformance(sampleLaundryFormula, 8.5, 'LAUNDRY_LIQUID', divergentLabData);
  assert('High Variance (>20%) Generates Negative Factor Warning', divergentRes.keyNegativeFactors.some(f => f.includes('High prediction variance detected')), true, true);

  // --------------------------------------------------------------------------
  // REQUIREMENT 5: Fabric Softener Non-Detergent Conditioning Category
  // --------------------------------------------------------------------------
  const softenerFormula: FormulationIngredient[] = [
    { name: 'Esterquat 90%', percentage: 6, activeMatterPct: 90, category: 'Cationic Surfactant' },
    { name: 'Water', percentage: 94, category: 'Solvent' }
  ];
  const softenerRes = calculateCleaningPerformance(softenerFormula, 3.5, 'FABRIC_SOFTENER');
  assert('Fabric Softener isCleaningApplicable is False', softenerRes.isCleaningApplicable === false, softenerRes.isCleaningApplicable, false);
  assert('Fabric Softener cleaningScore is Null', softenerRes.cleaningScore === null, softenerRes.cleaningScore, null);
  
  const softenerCleaningKpi = softenerRes.categoryKPIs.find(k => k.id === 'cleaningScore');
  assert('Fabric Softener Cleaning KPI Provenance is NOT_APPLICABLE', softenerCleaningKpi?.provenance === 'NOT_APPLICABLE', softenerCleaningKpi?.provenance, 'NOT_APPLICABLE');

  // --------------------------------------------------------------------------
  // REQUIREMENT 6: Empty Formula / Zero Data Handling
  // --------------------------------------------------------------------------
  const emptyRes = calculateCleaningPerformance([], 7.0, 'LAUNDRY_LIQUID');
  assert('Empty Formula cpi is 0', emptyRes.cpi === 0, emptyRes.cpi, 0);
  assert('Empty Formula Provenance is INSUFFICIENT_DATA', emptyRes.provenance === 'INSUFFICIENT_DATA', emptyRes.provenance, 'INSUFFICIENT_DATA');
  assert('Empty Formula Model Type is Insufficient Ingredient Data', emptyRes.modelType === 'Insufficient Ingredient Data', emptyRes.modelType, 'Insufficient Ingredient Data');
  assert('Empty Formula Limitations States Insufficient Data', emptyRes.limitations.includes('Insufficient formulation ingredient data'), true, true);

  // --------------------------------------------------------------------------
  // REQUIREMENT 7: All 13 Canonical Categories Terminology Audit
  // --------------------------------------------------------------------------
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const catRes = calculateCleaningPerformance(sampleLaundryFormula, 8.0, catId);
    assert(`Category Terminology Hardened: ${catId}`, catRes.productCategory === catId, catRes.productCategory, catId);
    
    if (catId !== 'FABRIC_SOFTENER') {
      const applicable = catRes.categoryKPIs.filter(k => k.isApplicable && k.provenance !== 'NOT_APPLICABLE');
      assert(`Category KPIs Hardened (${catId})`, applicable.every(k => k.name.startsWith('Predicted') && k.description.includes('(Model Estimate)')), true, true);
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 4 HARDENING TESTS : ${total}`);
  console.log(`PASSED                          : ${passed}`);
  console.log(`FAILED                          : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

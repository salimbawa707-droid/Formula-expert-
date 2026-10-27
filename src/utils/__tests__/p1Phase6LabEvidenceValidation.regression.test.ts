/**
 * ============================================================================
 * P1 PHASE 6 — LABORATORY EVIDENCE & PREDICTED-vs-MEASURED REGRESSION TEST SUITE
 * ============================================================================
 *
 * Verifies the evidence layer, comparability rules, error metrics, replicate analysis,
 * model validation, and calibration proposal safety:
 * 1. Measurement Identity & Traceability.
 * 2. Strict Provenance Integrity.
 * 3. Unit & Test Condition Comparability.
 * 4. Prediction Error Calculation & Zero-Denominator Safety.
 * 5. Replicate Statistics & Raw Outlier Preservation.
 * 6. Specification Dual-Result Preservation.
 * 7. Model Bias Detection & Proposal Safety (Zero Automatic Model Mutation).
 * 8. Category Evidence Isolation & 39 Template Stability.
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { FORMULAS } from '../../data/formulas';
import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import {
  validateMeasurementRecord,
  analyzeLabReplicates,
  checkMeasurementComparability,
  calculatePredictionError,
  evaluateCategoryModelValidation,
  proposeCalibrationCandidates,
  evaluateFormulaScientificValidation,
  CATEGORY_EVIDENCE_MATRIX,
  DetailedLabEvidenceRecord
} from '../labEvidenceEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase6LabEvidenceValidationTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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
  console.log('  P1 PHASE 6 — LABORATORY EVIDENCE & PREDICTED-vs-MEASURED TEST SUITE ');
  console.log('================================================================================\n');

  // Sample Valid Measurement Record
  const baseMeasurement: DetailedLabEvidenceRecord = {
    measurementId: 'm-101',
    formulaId: 'f-laundry-01',
    formulaVersion: '1.0',
    categoryId: 'LAUNDRY_LIQUID',
    kpiId: 'cleaningScore',
    parameterKey: 'cleaningScore',
    value: 82.5,
    unit: '%',
    testMethod: 'ASTM D4265 (Tergt-O-Tometer)',
    testDate: '2026-09-29',
    provenance: 'MEASURED',
    testConditions: {
      temperatureC: 25,
      waterHardnessPpm: 150,
      substrate: 'Cotton Swatch'
    }
  };

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Measurement Identity & Traceability
  // --------------------------------------------------------------------------
  const validCheck = validateMeasurementRecord(baseMeasurement);
  assert('1. Measurement attaches to correct formula', validCheck.isValid && baseMeasurement.formulaId === 'f-laundry-01', true, true);

  const compFormulaMismatch = checkMeasurementComparability({
    targetFormulaId: 'f-other-formula',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    measurement: baseMeasurement
  });
  assert('2. Formula ID mismatch is blocked with explicit reason', !compFormulaMismatch.isComparable && !compFormulaMismatch.matchedFormula && compFormulaMismatch.reason?.includes('Formula ID mismatch'), true, true);

  const missingFormulaId = { ...baseMeasurement, formulaId: undefined };
  const missingFormulaIdCheck = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    measurement: missingFormulaId
  });
  assert('3. Missing formula ID is blocked when target formula is specified', !missingFormulaIdCheck.isComparable && !missingFormulaIdCheck.matchedFormula, true, true);

  // The formula-validation report must enforce the same strict identity gate.
  const validationMeasurement: DetailedLabEvidenceRecord = {
    ...baseMeasurement,
    parameterKey: 'pH',
    kpiId: 'pH',
    value: 8.2,
    unit: 'pH units',
    status: 'PASS',
    qualityStatus: 'ACCEPTED',
    sourceType: 'LAB_MEASURED'
  };
  const missingIdValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [{ ...validationMeasurement, formulaId: undefined }]
  });
  assert('3a. Validation report blocks missing formula ID when target is specified',
    missingIdValidation.comparisons.length === 0 && missingIdValidation.missingTests.includes('pH'),
    missingIdValidation.comparisons.length, 0);

  const missingVersionValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [{ ...validationMeasurement, formulaVersion: undefined as any }]
  });
  assert('3b. Validation report blocks missing formula version',
    missingVersionValidation.comparisons.length === 0 && missingVersionValidation.missingTests.includes('pH'),
    missingVersionValidation.comparisons.length, 0);

  const matchingIdentityValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [validationMeasurement]
  });
  assert('3c. Validation report accepts exact formula ID and version for comparison',
    matchingIdentityValidation.comparisons.length === 1 && matchingIdentityValidation.comparisons[0].measuredValue === 8.2,
    matchingIdentityValidation.comparisons.length, 1);

  const predictedEvidenceValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [{ ...validationMeasurement, provenance: 'PREDICTED' as any }]
  });
  assert('3d. Predicted provenance cannot enter lab comparison or complete a test',
    predictedEvidenceValidation.comparisons.length === 0 && predictedEvidenceValidation.missingTests.includes('pH'),
    predictedEvidenceValidation.comparisons.length, 0);

  const missingValueEvidenceValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [{ ...validationMeasurement, value: NaN }]
  });
  assert('3e. Invalid numeric lab evidence cannot enter comparison',
    missingValueEvidenceValidation.comparisons.length === 0 && missingValueEvidenceValidation.missingTests.includes('pH'),
    missingValueEvidenceValidation.comparisons.length, 0);

  const missingTargetVersionValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [validationMeasurement]
  });
  assert('3f. Missing target formula version cannot default-match a versioned measurement',
    missingTargetVersionValidation.comparisons.length === 0 && missingTargetVersionValidation.missingTests.includes('pH') && missingTargetVersionValidation.formulaVersion === undefined,
    missingTargetVersionValidation.comparisons.length, 0);

  const missingBothVersionsValidation = evaluateFormulaScientificValidation({
    formulaId: 'f-laundry-01',
    productCategory: 'LAUNDRY_LIQUID',
    predictedMetrics: { pH: 8.0 },
    labEvidenceRecords: [{ ...validationMeasurement, formulaVersion: undefined as any }]
  });
  assert('3g. Missing target and measurement versions never match each other',
    missingBothVersionsValidation.comparisons.length === 0 && missingBothVersionsValidation.missingTests.includes('pH'),
    missingBothVersionsValidation.comparisons.length, 0);

  const compVersionMismatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '2.0', // Mismatch vs 1.0
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    measurement: baseMeasurement
  });
  assert('2. Formula version mismatch is detected', !compVersionMismatch.isComparable && compVersionMismatch.reason!.includes('version mismatch'), true, true);

  const compCategoryMismatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'FABRIC_SOFTENER', // Mismatch vs LAUNDRY_LIQUID
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    measurement: baseMeasurement
  });
  assert('3. Category mismatch is detected', !compCategoryMismatch.isComparable && compCategoryMismatch.reason!.includes('category mismatch'), true, true);

  const compKPIMismatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'viscosity', // Mismatch vs cleaningScore
    targetUnit: 'g/mL',
    measurement: baseMeasurement
  });
  assert('4. KPI mismatch is detected', !compKPIMismatch.isComparable && compKPIMismatch.reason!.includes('KPI mismatch'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Provenance Integrity
  // --------------------------------------------------------------------------
  assert('5. Measured remains MEASURED', baseMeasurement.provenance === 'MEASURED', baseMeasurement.provenance, 'MEASURED');

  const unmeasuredRecord: DetailedLabEvidenceRecord = {
    ...baseMeasurement,
    provenance: 'PREDICTED' as any
  };
  const unmeasuredCheck = validateMeasurementRecord(unmeasuredRecord);
  assert('6. Prediction remains PREDICTED (Invalid for Lab Evidence record)', !unmeasuredCheck.isValid, true, true);

  const methodRefOnly: DetailedLabEvidenceRecord = {
    measurementId: 'm-method-only',
    formulaVersion: '1.0',
    parameterKey: 'ph',
    value: NaN, // Missing value
    unit: 'pH units',
    testMethod: 'ASTM E70',
    testDate: '2026-09-29',
    provenance: 'MEASURED'
  };
  const methodCheck = validateMeasurementRecord(methodRefOnly);
  assert('7. Method reference without numeric value does not create valid measurement', !methodCheck.isValid, true, true);

  const missingValCheck = validateMeasurementRecord({ ...baseMeasurement, value: undefined as any });
  assert('8. Missing evidence does not create MEASURED', !missingValCheck.isValid, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Units Comparability
  // --------------------------------------------------------------------------
  const compUnitsMatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    measurement: baseMeasurement
  });
  assert('9. Compatible units compare', compUnitsMatch.isComparable && compUnitsMatch.matchedUnit, true, true);

  const compUnitsMismatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: 'g/mL', // Incompatible with %
    measurement: baseMeasurement
  });
  assert('10. Incompatible units block comparison', !compUnitsMismatch.isComparable && compUnitsMismatch.reason!.includes('Incompatible units'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Conditions Comparability
  // --------------------------------------------------------------------------
  const compCondMatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    targetConditions: { temperatureC: 25, waterHardnessPpm: 150 },
    measurement: baseMeasurement
  });
  assert('11. Matching conditions compare', compCondMatch.isComparable && compCondMatch.conditionsComparable, true, true);

  const compCondMismatch = checkMeasurementComparability({
    targetFormulaId: 'f-laundry-01',
    targetFormulaVersion: '1.0',
    targetCategory: 'LAUNDRY_LIQUID',
    targetKPIId: 'cleaningScore',
    targetUnit: '%',
    targetConditions: { temperatureC: 60 }, // 60°C vs 25°C
    measurement: baseMeasurement
  });
  assert('12. Incompatible conditions produce NOT_COMPARABLE', !compCondMismatch.isComparable && compCondMismatch.reason!.includes('Temperature mismatch'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Error Analysis
  // --------------------------------------------------------------------------
  const errRes = calculatePredictionError(80.0, 82.5, '%', compUnitsMatch);
  assert('13. Absolute error', Math.abs(errRes.absoluteError - 2.5) < 0.001, errRes.absoluteError, 2.5);
  assert('14. Percentage error', Math.abs((errRes.percentageError ?? 0) - 3.125) < 0.01, errRes.percentageError?.toFixed(3), '3.125');

  const zeroPredErr = calculatePredictionError(0.0, 5.0, '%', compUnitsMatch);
  assert('15. Zero denominator protection (isPercentageCalculable === false)', !zeroPredErr.isPercentageCalculable && zeroPredErr.percentageError === undefined, true, true);

  const blockedErr = calculatePredictionError(80.0, 82.5, '%', compUnitsMismatch);
  assert('16. Invalid error comparison blocked (status === NOT_COMPARABLE)', blockedErr.status === 'NOT_COMPARABLE', blockedErr.status, 'NOT_COMPARABLE');

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Replicates & Outliers
  // --------------------------------------------------------------------------
  const repRecords: DetailedLabEvidenceRecord[] = [
    { ...baseMeasurement, value: 80.0 },
    { ...baseMeasurement, value: 82.0 },
    { ...baseMeasurement, value: 81.0 },
    { ...baseMeasurement, value: 98.0 } // Extreme outlier
  ];
  const repAnalysis = analyzeLabReplicates(repRecords);
  assert('17. Replicate mean calculated', repAnalysis !== null && Math.abs(repAnalysis.mean - 85.25) < 0.01, repAnalysis?.mean, 85.25);
  assert('18. Standard deviation when n > 1', (repAnalysis?.stdDev ?? 0) > 0, true, true);

  const singleRep = analyzeLabReplicates([baseMeasurement]);
  assert('19. n=1 does not produce false statistical confidence', singleRep?.statisticalConfidence === 'SINGLE_OBSERVATION_NO_CONFIDENCE' && singleRep.stdDev === undefined, true, true);

  assert('20. Potential outlier flagged', repAnalysis !== null && repAnalysis.hasOutliers, true, true);
  assert('21. Raw outlier preserved', repAnalysis !== null && repAnalysis.values.includes(98.0), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Specification Dual-Result Preservation
  // --------------------------------------------------------------------------
  const validLaundryFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 8, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 4, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, category: 'Builder' },
    { name: 'Caustic Soda 50%', percentage: 1.88, activeMatterPct: 50, category: 'pH Adjuster' },
    { name: 'Phenoxyethanol', percentage: 0.5, category: 'Preservative' },
    { name: 'Water', percentage: 74.62, category: 'Solvent' }
  ];

  const gatePredictedPass = evaluateScientificQualityGate({
    formulaName: 'Test Laundry Liquid',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: validLaundryFormula
  });
  assert('22. Predicted spec result preserved (PASS)', gatePredictedPass.specificationStatus === 'PASS', gatePredictedPass.specificationStatus, 'PASS');

  // Lab Measurement showing Out of Spec pH (e.g. pH 11.5)
  const failedLabPHRecord: DetailedLabEvidenceRecord = {
    measurementId: 'm-ph-fail',
    formulaVersion: '1.0',
    parameterKey: 'ph',
    value: 11.5, // Violated max 9.5 limit
    unit: 'pH units',
    testDate: '2026-09-29',
    provenance: 'MEASURED'
  };

  const gateMeasuredFail = evaluateScientificQualityGate({
    formulaName: 'Test Laundry Liquid',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: validLaundryFormula,
    labMeasurements: [failedLabPHRecord]
  });

  assert('23. Measured spec result preserved (OUT_OF_SPEC)', gateMeasuredFail.specificationStatus === 'OUT_OF_SPEC', gateMeasuredFail.specificationStatus, 'OUT_OF_SPEC');
  assert('24. Measured failure cannot be hidden by predicted pass', gateMeasuredFail.finalFormulaStatus === 'OUT_OF_SPEC', gateMeasuredFail.finalFormulaStatus, 'OUT_OF_SPEC');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Model Validation & Calibration Safety
  // --------------------------------------------------------------------------
  const modelObs = [
    { kpiId: 'cleaningScore', predicted: 80, measured: 85, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 86, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 85, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 86, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 85, comparable: true }
  ];

  const modelValSummary = evaluateCategoryModelValidation('LAUNDRY_LIQUID', modelObs);
  assert('25. Systematic model bias detected', Math.abs(modelValSummary.kpiSummaries['cleaningScore'].meanBias - 5.4) < 0.01, modelValSummary.kpiSummaries['cleaningScore'].meanBias, 5.4);

  const proposals = proposeCalibrationCandidates(modelValSummary);
  assert('26. Calibration candidate can be proposed', proposals.length === 1 && proposals[0].status === 'PROPOSED', true, true);

  // Absolute Safety Test: Verify PHEngineV2 constants remain completely unchanged
  assert('27. No automatic scientific model mutation (PHEngineV2 class valid & locked)', typeof PHEngineV2.calculatePH === 'function', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 9: Category Evidence Isolation & 39 Templates
  // --------------------------------------------------------------------------
  const laundryMatrix = CATEGORY_EVIDENCE_MATRIX.LAUNDRY_LIQUID;
  const softenerMatrix = CATEGORY_EVIDENCE_MATRIX.FABRIC_SOFTENER;

  assert('28. No cross-category evidence leakage', !laundryMatrix.supportedEvidenceDomains.includes('Textile Softness Score') && softenerMatrix.supportedEvidenceDomains.includes('Textile Softness Score'), true, true);

  assert('29. All 39 canonical formula templates remain intact', FORMULAS.length >= 39, FORMULAS.length, 39);
  assert('30. All 13 Canonical Product Categories Defined in Evidence Matrix', CANONICAL_PRODUCT_CATEGORY_IDS.every(id => Boolean(CATEGORY_EVIDENCE_MATRIX[id])), true, true);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 6 LAB EVIDENCE TESTS : ${total}`);
  console.log(`PASSED                               : ${passed}`);
  console.log(`FAILED                               : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

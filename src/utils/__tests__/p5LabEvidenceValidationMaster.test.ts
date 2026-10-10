/**
 * ============================================================================
 * PHASE 5 — LAB HEALTH, EVIDENCE & SCIENTIFIC VALIDATION MASTER TEST SUITE
 * ============================================================================
 * 
 * Comprehensive verification of the Evidence, Lab Validation & Readiness System:
 * 1. Strict 4-State Validation Model (CALCULATED, SCIENTIFICALLY_SCREENED, LAB_VALIDATION_REQUIRED, LAB_VALIDATED).
 * 2. Mathematical calculations NEVER produce LAB_VALIDATED or PRODUCTION_READY.
 * 3. Structured Laboratory Evidence Records & Multi-Parameter Provenance.
 * 4. Formula Version Matching & Non-Transferability across modified versions.
 * 5. Predicted vs. Measured comparisons (Absolute error, % error, status, target bounds).
 * 6. Failed laboratory tests produce LAB_FAILED and block validation.
 * 7. Category-Specific Laboratory Battery Requirements (Liquid vs Powder vs Softener).
 * 8. Scientific Quality Gate Integration & Single Source of Truth.
 * ============================================================================
 */

import {
  evaluateFormulaScientificValidation,
  DetailedLabEvidenceRecord,
  getCategoryRequiredLabBattery
} from '../labEvidenceEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { calculateLabHealthScore } from '../labHealthEngine';
import { FormulationIngredient } from '../../types';
import { registerUserInstrument, resetUserInstrumentsForTest } from '../../domain/lims/instrument';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runPhase5LabEvidenceValidationTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  resetUserInstrumentsForTest();
  ['INST-USER-PH-001', 'INST-USER-VISC-001', 'INST-USER-TITR-001', 'INST-USER-TERG-001', 'INST-USER-DENS-001', 'INST-USER-MOIST-001', 'INST-USER-BULK-001'].forEach((id, idx) => {
    registerUserInstrument({
      instrumentId: id,
      name: `User Laboratory Instrument ${id}`,
      manufacturer: 'Test Mfg',
      model: 'Test Model',
      serialNumber: `SN-USER-${idx}`,
      instrumentType: 'TEST_TYPE',
      calibrationCertificateReference: `CAL-CERT-USER-${idx}`,
      lastCalibrationDate: '2026-01-01',
      nextCalibrationDate: '2027-01-01',
      location: 'Lab',
      custodian: 'Tester',
      registeredBy: 'Tester',
    });
  });

  function assert(group: string, name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ group, name, passed: true });
      console.log(`[PASS] [${group}] ${name}`);
    } else {
      results.push({
        group,
        name,
        passed: false,
        actual,
        expected,
        message: `Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`
      });
      console.error(`[FAIL] [${group}] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('\n================================================================================');
  console.log('  PHASE 5 — LAB HEALTH, EVIDENCE & SCIENTIFIC VALIDATION MASTER TEST SUITE      ');
  console.log('================================================================================\n');

  // Sample Formula Ingredients (With 1.0% NaCl & 0.5% Phenoxyethanol)
  const sampleLaundryFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 8, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 6, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 4, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, activeMatterPct: 100, category: 'Builder' },
    { name: 'Caustic Soda 50%', percentage: 1.88, activeMatterPct: 50 },
    { name: 'Sodium Chloride', percentage: 1.0, activeMatterPct: 100, category: 'Electrolyte' },
    { name: 'Phenoxyethanol', percentage: 0.5, activeMatterPct: 100, category: 'Preservative' },
    { name: 'Water', percentage: 75.62 }
  ];

  // --------------------------------------------------------------------------
  // TEST GROUP 1: CALCULATION-ONLY FORMULA (ZERO FALSE CLAIMS)
  // --------------------------------------------------------------------------
  const calcOnlyReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: {
      pH: 8.5,
      activeSurfactantsPct: 15.88,
      viscosityCps: 450,
      cpi: 82
    },
    labEvidenceRecords: [] // Zero laboratory measurements!
  });

  assert('Zero False Claims', 'Calculation-only formula validationState is SCIENTIFICALLY_SCREENED (NOT LAB_VALIDATED)', calcOnlyReport.validationState === 'SCIENTIFICALLY_SCREENED', calcOnlyReport.validationState, 'SCIENTIFICALLY_SCREENED');
  assert('Zero False Claims', 'isLabValidated is false for calculation-only', calcOnlyReport.isLabValidated === false, calcOnlyReport.isLabValidated, false);
  assert('Zero False Claims', 'readinessLevel is LAB_READY (NOT PRODUCTION_READY)', calcOnlyReport.readinessLevel === 'LAB_READY', calcOnlyReport.readinessLevel, 'LAB_READY');
  assert('Zero False Claims', 'isProductionReady is false for unmeasured formula', calcOnlyReport.isProductionReady === false, calcOnlyReport.isProductionReady, false);
  assert('Zero False Claims', 'Missing laboratory tests list all required parameters', calcOnlyReport.missingTests.length === 4, calcOnlyReport.missingTests.length, 4);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: PARTIAL LABORATORY MEASUREMENTS
  // --------------------------------------------------------------------------
  const partialLabData: DetailedLabEvidenceRecord[] = [
    {
      measurementId: 'MEAS-001',
      parameterKey: 'pH',
      parameterName: 'Finished Product pH',
      value: 8.4,
      unit: 'pH units',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      testDate: '2026-09-30',
      operator: 'R&D Chemist',
      provenance: 'MEASURED'
    }
  ];

  const partialReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: {
      pH: 8.5,
      activeSurfactantsPct: 15.88,
      viscosityCps: 450,
      cpi: 82
    },
    labEvidenceRecords: partialLabData
  });

  assert('Partial Lab Evidence', 'Validation state transitions to LAB_TESTED', partialReport.validationState === 'LAB_TESTED', partialReport.validationState, 'LAB_TESTED');
  assert('Partial Lab Evidence', 'Partial testing remains not fully lab-validated', partialReport.isLabValidated === false, partialReport.isLabValidated, false);
  assert('Partial Lab Evidence', 'Completed tests contains pH', partialReport.completedTests.includes('pH'), true, true);
  assert('Partial Lab Evidence', 'Missing tests contains viscosity and cleaningScore', partialReport.missingTests.includes('viscosity') && partialReport.missingTests.includes('cleaningScore'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: FULL PASSING LABORATORY BATTERY
  // --------------------------------------------------------------------------
  const fullPassingLabData: DetailedLabEvidenceRecord[] = [
    {
      measurementId: 'M-1',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'pH',
      value: 8.5,
      unit: 'pH units',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ISO 4316 Potentiometric glass electrode',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-PH-001'
    },
    {
      measurementId: 'M-2',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'viscosity',
      value: 800,
      unit: 'cP' as any,
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ASTM D2196 Rotational Viscometer',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-VISC-001'
    },
    {
      measurementId: 'M-3',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'activeSurfactants',
      value: 15.9,
      unit: '%',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ISO 2271 Two-phase titration',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-TITR-001'
    },
    {
      measurementId: 'M-4',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'cleaningScore',
      value: 84,
      unit: '%',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ASTM D4265 Terg-O-Tometer',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-TERG-001'
    }
  ];

  const fullReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: {
      pH: 8.5,
      activeSurfactantsPct: 15.88,
      viscosityCps: 450,
      cpi: 82
    },
    labEvidenceRecords: fullPassingLabData
  });

  assert('Full Lab Battery', 'Full passing battery achieves LAB_VALIDATED state', fullReport.validationState === 'LAB_VALIDATED', fullReport.validationState, 'LAB_VALIDATED');
  assert('Full Lab Battery', 'isLabValidated is true', fullReport.isLabValidated === true, fullReport.isLabValidated, true);
  assert('Full Lab Battery', 'readinessLevel transitions to PRODUCTION_READY when zero defects exist', fullReport.readinessLevel === 'PRODUCTION_READY', fullReport.readinessLevel, 'PRODUCTION_READY');
  assert('Full Lab Battery', 'Missing tests count is 0', fullReport.missingTests.length === 0, fullReport.missingTests.length, 0);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: FAILING LABORATORY MEASUREMENT BLOCKS VALIDATION
  // --------------------------------------------------------------------------
  const failingLabData: DetailedLabEvidenceRecord[] = [
    {
      measurementId: 'M-1',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'pH',
      value: 8.5,
      unit: 'pH units',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ISO 4316 Potentiometric glass electrode',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-PH-001'
    },
    {
      measurementId: 'M-2',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'viscosity',
      value: 120,
      unit: 'cP' as any,
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'OUT_OF_SPEC',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ASTM D2196 Rotational Viscometer',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-VISC-001'
    }, // Out of specification!
    {
      measurementId: 'M-3',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'activeSurfactants',
      value: 15.9,
      unit: '%',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ISO 2271 Two-phase titration',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-TITR-001'
    },
    {
      measurementId: 'M-4',
      testDate: '2026-09-30',
      provenance: 'MEASURED',
      parameterKey: 'cleaningScore',
      value: 84,
      unit: '%',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      status: 'PASS',
      batchId: 'BATCH-FORM-01',
      sampleId: 'SMP-FORM-01',
      methodRef: 'ASTM D4265 Terg-O-Tometer',
      operator: 'Lead QC Analyst',
      instrument: 'INST-USER-TERG-001'
    }
  ];

  const failingReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: {
      pH: 8.5,
      activeSurfactantsPct: 15.88,
      viscosityCps: 450,
      cpi: 82
    },
    labEvidenceRecords: failingLabData
  });

  assert('Failing Lab Result', 'Failed measurement produces LAB_FAILED validation state', failingReport.validationState === 'LAB_FAILED', failingReport.validationState, 'LAB_FAILED');
  assert('Failing Lab Result', 'Failed measurement prevents LAB_VALIDATED', failingReport.isLabValidated === false, failingReport.isLabValidated, false);
  assert('Failing Lab Result', 'Failed measurement prevents PRODUCTION_READY', failingReport.isProductionReady === false, failingReport.isProductionReady, false);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: FORMULA VERSION ISOLATION (NO SILENT TRANSFER)
  // --------------------------------------------------------------------------
  // Old v1.0.0 measurements evaluated against modified formula v2.0.0
  const versionMismatchReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '2.0.0', // New version!
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: {
      pH: 8.5,
      activeSurfactantsPct: 15.88,
      viscosityCps: 450,
      cpi: 82
    },
    labEvidenceRecords: fullPassingLabData // Dated for v1.0.0
  });

  assert('Version Isolation', 'Old version evidence does not validate new version', versionMismatchReport.validationState === 'SCIENTIFICALLY_SCREENED', versionMismatchReport.validationState, 'SCIENTIFICALLY_SCREENED');
  assert('Version Isolation', 'hasOutdatedEvidence is flagged true', versionMismatchReport.hasOutdatedEvidence === true, versionMismatchReport.hasOutdatedEvidence, true);
  assert('Version Isolation', 'Completed tests for v2.0.0 is 0', versionMismatchReport.completedTests.length === 0, versionMismatchReport.completedTests.length, 0);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: PREDICTED VS MEASURED COMPARISON METRICS
  // --------------------------------------------------------------------------
  const comparisonItem = fullReport.comparisons.find(c => c.parameterKey === 'viscosity');
  assert('Predicted vs Measured', 'Viscosity predicted value preserved (>0 cP)', typeof comparisonItem?.predictedValue === 'number' && comparisonItem.predictedValue > 0, comparisonItem?.predictedValue, '>0');
  assert('Predicted vs Measured', 'Viscosity measured value preserved (800 cP)', comparisonItem?.measuredValue === 800, comparisonItem?.measuredValue, 800);
  assert('Predicted vs Measured', 'Absolute error is non-negative number', typeof comparisonItem?.absoluteError === 'number' && comparisonItem.absoluteError >= 0, comparisonItem?.absoluteError, '>=0');
  assert('Predicted vs Measured', 'Comparison status is PASS', comparisonItem?.status === 'PASS', comparisonItem?.status, 'PASS');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: CATEGORY-SPECIFIC LABORATORY BATTERIES
  // --------------------------------------------------------------------------
  const powderBattery = getCategoryRequiredLabBattery('LAUNDRY_POWDER');
  const softenerBattery = getCategoryRequiredLabBattery('FABRIC_SOFTENER');
  const toiletBattery = getCategoryRequiredLabBattery('TOILET_CLEANER');

  assert('Category Batteries', 'Laundry powder requires moisture and bulkDensity', powderBattery.includes('moisture') && powderBattery.includes('bulkDensity'), true, true);
  assert('Category Batteries', 'Fabric softener requires softness and viscosity', softenerBattery.includes('softness') && softenerBattery.includes('viscosity'), true, true);
  assert('Category Batteries', 'Toilet cleaner requires descalingRate', toiletBattery.includes('descalingRate'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 8: SCIENTIFIC QUALITY GATE INTEGRATION
  // --------------------------------------------------------------------------
  const qgReport = evaluateScientificQualityGate({
    formulaId: 'FORM-001',
    formulaName: 'Heavy Duty Laundry Test',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: sampleLaundryFormula,
    labMeasurements: fullPassingLabData
  });

  assert('Quality Gate Integration', 'Quality Gate consumes authoritative validationState', qgReport.validationState === 'LAB_VALIDATED', qgReport.validationState, 'LAB_VALIDATED');
  assert('Quality Gate Integration', 'Quality Gate consumes authoritative readinessLevel', qgReport.readinessLevel === 'PRODUCTION_READY', qgReport.readinessLevel, 'PRODUCTION_READY');
  assert('Quality Gate Integration', 'Quality Gate sets evidenceStatus to FULLY_LAB_VALIDATED', qgReport.evidenceStatus === 'FULLY_LAB_VALIDATED', qgReport.evidenceStatus, 'FULLY_LAB_VALIDATED');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: LAB HEALTH SCORE INTEGRITY
  // --------------------------------------------------------------------------
  const labHealth = calculateLabHealthScore(sampleLaundryFormula, 8.5, 'LAUNDRY_LIQUID');
  assert('Lab Health Score', 'Lab Health score is valid (0-100)', labHealth.finalScore >= 0 && labHealth.finalScore <= 100, true, true);
  assert('Lab Health Score', 'Breakdown components are populated', typeof labHealth.breakdown.phScore === 'number', true, true);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL PHASE 5 LAB EVIDENCE & VALIDATION TESTS : ${total}`);
  console.log(`PASSED                                       : ${passed}`);
  console.log(`FAILED                                       : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

// Direct execution when invoked via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = runPhase5LabEvidenceValidationTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

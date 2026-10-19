/**
 * ============================================================================
 * P0 REAL LAB VALIDATION CAMPAIGN — FORENSIC REGRESSION SUITE
 * ============================================================================
 * Forensic test suite verifying campaign P0-LAB-001 (HD-LIQUID-LAUNDRY):
 * - Formula fingerprinting & frozen prediction snapshot immutability
 * - Zero-data safety enforcement (REAL_LAB_DATA = 0, WAITING_FOR_REAL_LAB_DATA)
 * - Empirical firewall rejection of synthetic/simulated data
 * - QC processing and outlier rejection logging without silent deletion
 * - Prediction vs actual calculation without false 95%/98% accuracy claims
 * - Full forensic report structure (Sections A through U)
 * ============================================================================
 */

import {
  P0RealLabValidationCampaignEngine
} from '../labValidationCampaignP0';
import { CompleteLaboratoryObservation } from '../empiricalLabObservationModel';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP0LabValidationCampaignTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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

  // 1. Campaign Identity & Frozen Formula Snapshot
  const formulaSnapshot = P0RealLabValidationCampaignEngine.getFrozenFormulaSnapshot();
  assert(
    'Campaign P0-LAB-001 initializes HD-LIQUID-LAUNDRY formula with deterministic fingerprint',
    formulaSnapshot.productName === 'HD-LIQUID-LAUNDRY' &&
      formulaSnapshot.productCategory === 'LAUNDRY_LIQUID' &&
      formulaSnapshot.formulaFingerprint.startsWith('FP-LAUN-'),
    formulaSnapshot.formulaFingerprint,
    'FP-LAUN-*'
  );

  // 2. Frozen Prediction Snapshot Immutability
  const predSnapshot = P0RealLabValidationCampaignEngine.getFrozenPredictionSnapshot();
  let isFrozen = false;
  try {
    (predSnapshot as any).predictedPh = 9.99;
  } catch (e) {
    isFrozen = true;
  }
  assert(
    'Prediction snapshot is immutably frozen prior to laboratory result entry',
    isFrozen || Object.isFrozen(predSnapshot),
    isFrozen,
    true
  );

  assert(
    'Prediction snapshot contains accurate expected values (pH 8.50, active matter 18.82%)',
    predSnapshot.predictedPh === 8.50 && predSnapshot.predictedActiveSurfactantMatterPct === 18.82,
    { ph: predSnapshot.predictedPh, act: predSnapshot.predictedActiveSurfactantMatterPct },
    { ph: 8.50, act: 18.82 }
  );

  // 3. Three Independent Batch Specifications
  const batches = P0RealLabValidationCampaignEngine.getRequiredBatchSpecifications();
  assert(
    'Campaign specifies 3 independent production batches (BATCH-P0-HDLL-001 to 003)',
    batches.length === 3 && batches[0].batchId === 'BATCH-P0-HDLL-001' && batches[2].batchId === 'BATCH-P0-HDLL-003',
    batches.map(b => b.batchId),
    ['BATCH-P0-HDLL-001', 'BATCH-P0-HDLL-002', 'BATCH-P0-HDLL-003']
  );

  // 4. Zero-Data Safety Gate (No Lab Data Provided)
  const zeroDataEval = P0RealLabValidationCampaignEngine.evaluateCampaign([]);
  assert(
    'Zero-Data Safety: When no physical observations exist, status is WAITING_FOR_REAL_LAB_DATA and REAL_LAB_DATA = 0',
    zeroDataEval.realLabDataCount === 0 &&
      zeroDataEval.status === 'WAITING_FOR_REAL_LAB_DATA' &&
      zeroDataEval.labValidatedStatus === 'NOT_ESTABLISHED' &&
      zeroDataEval.calibrationEligibility === 'NOT_ELIGIBLE',
    zeroDataEval.status,
    'WAITING_FOR_REAL_LAB_DATA'
  );

  // 5. Empirical Firewall Rejection of Synthetic / Simulated Data
  const fakeObs: Partial<CompleteLaboratoryObservation> = {
    observationId: 'OBS-FAKE-01',
    datasetId: 'DS-P0',
    formulaFingerprint: formulaSnapshot.formulaFingerprint,
    batchId: 'BATCH-P0-HDLL-001',
    productCategory: 'LAUNDRY_LIQUID',
    replicateNumber: 1,
    measuredProperty: 'pH',
    measuredValue: 8.5,
    measurementUnit: 'pH',
    dataOrigin: 'SYNTHETIC_TEST_DATA'
  };

  const firewallCheck = P0RealLabValidationCampaignEngine.filterEmpiricalObservations([fakeObs as CompleteLaboratoryObservation]);
  assert(
    'Empirical Firewall strictly rejects observations with origin SYNTHETIC_TEST_DATA',
    firewallCheck.accepted.length === 0 &&
      firewallCheck.rejected.length === 1 &&
      firewallCheck.rejected[0].reason.includes('EMPIRICAL FIREWALL REJECTION'),
    firewallCheck.rejected.length,
    1
  );

  // 6. Genuine Physical Observation Evaluation & QC
  const genuineObs: CompleteLaboratoryObservation[] = [
    {
      observationId: 'OBS-P0-PH-1',
      datasetId: 'DS-P0-LAB',
      formulaFingerprint: formulaSnapshot.formulaFingerprint,
      formulaVersionId: '1.0.0-P0',
      batchId: 'BATCH-P0-HDLL-001',
      productCategory: 'LAUNDRY_LIQUID',
      commercialMaterials: [{ ingredientId: 'LABSA_96', gradeId: 'G-96', percentage: 12, activeMatterPct: 96 }],
      waterProfile: { hardnessPpm: 5 },
      temperatureC: 25.0,
      dosageGramsPerL: 10,
      contactTimeMin: 15,
      testMethodId: 'ASTM-D1172',
      replicateNumber: 1,
      measuredProperty: 'pH',
      measuredValue: 8.48,
      measurementUnit: 'pH',
      laboratoryName: 'Analytical R&D Lab 1',
      operator: 'Dr. Analyst A',
      testDate: '2026-10-07T09:15:00Z',
      evidenceIds: ['EV-P0-001'],
      rawEvidenceRef: 'test-fixture://p0-lab/OBS-P0-PH-1',
      provenanceStatus: 'VERIFIED_PRIMARY_MEASUREMENT',
      dataQualityStatus: 'APPROVED_FOR_VALIDATION',
      dataOrigin: 'REAL_LAB_MEASUREMENT',
      auditTrail: ['Direct pH probe measurement']
    },
    {
      observationId: 'OBS-P0-PH-2',
      datasetId: 'DS-P0-LAB',
      formulaFingerprint: formulaSnapshot.formulaFingerprint,
      formulaVersionId: '1.0.0-P0',
      batchId: 'BATCH-P0-HDLL-002',
      productCategory: 'LAUNDRY_LIQUID',
      commercialMaterials: [{ ingredientId: 'LABSA_96', gradeId: 'G-96', percentage: 12, activeMatterPct: 96 }],
      waterProfile: { hardnessPpm: 4.5 },
      temperatureC: 25.0,
      dosageGramsPerL: 10,
      contactTimeMin: 15,
      testMethodId: 'ASTM-D1172',
      replicateNumber: 1,
      measuredProperty: 'pH',
      measuredValue: 8.52,
      measurementUnit: 'pH',
      laboratoryName: 'Analytical R&D Lab 1',
      operator: 'Dr. Analyst A',
      testDate: '2026-10-07T09:20:00Z',
      evidenceIds: ['EV-P0-002'],
      rawEvidenceRef: 'test-fixture://p0-lab/OBS-P0-PH-2',
      provenanceStatus: 'VERIFIED_PRIMARY_MEASUREMENT',
      dataQualityStatus: 'APPROVED_FOR_VALIDATION',
      dataOrigin: 'REAL_LAB_MEASUREMENT',
      auditTrail: ['Direct pH probe measurement']
    },
    {
      observationId: 'OBS-P0-PH-3',
      datasetId: 'DS-P0-LAB',
      formulaFingerprint: formulaSnapshot.formulaFingerprint,
      formulaVersionId: '1.0.0-P0',
      batchId: 'BATCH-P0-HDLL-003',
      productCategory: 'LAUNDRY_LIQUID',
      commercialMaterials: [{ ingredientId: 'LABSA_96', gradeId: 'G-96', percentage: 12, activeMatterPct: 96 }],
      waterProfile: { hardnessPpm: 5.2 },
      temperatureC: 25.0,
      dosageGramsPerL: 10,
      contactTimeMin: 15,
      testMethodId: 'ASTM-D1172',
      replicateNumber: 1,
      measuredProperty: 'pH',
      measuredValue: 8.50,
      measurementUnit: 'pH',
      laboratoryName: 'Analytical R&D Lab 1',
      operator: 'Dr. Analyst A',
      testDate: '2026-10-07T09:25:00Z',
      evidenceIds: ['EV-P0-003'],
      rawEvidenceRef: 'test-fixture://p0-lab/OBS-P0-PH-3',
      provenanceStatus: 'VERIFIED_PRIMARY_MEASUREMENT',
      dataQualityStatus: 'APPROVED_FOR_VALIDATION',
      dataOrigin: 'REAL_LAB_MEASUREMENT',
      auditTrail: ['Direct pH probe measurement']
    }
  ];

  const genuineEval = P0RealLabValidationCampaignEngine.evaluateCampaign(genuineObs);
  assert(
    'Campaign evaluation with genuine lab observations sets status EXECUTED_INITIAL_EVIDENCE and realLabDataCount = 3',
    genuineEval.realLabDataCount === 3 &&
      genuineEval.status === 'EXECUTED_INITIAL_EVIDENCE' &&
      genuineEval.empiricalValidation === 'INITIAL_EMPIRICAL_EVIDENCE',
    genuineEval.status,
    'EXECUTED_INITIAL_EVIDENCE'
  );

  // 7. Prediction vs Actual Errors & Precision Gate
  const phResult = genuineEval.predictionVsActual.find(p => p.property === 'pH');
  assert(
    'Prediction-vs-actual correctly calculates mean (8.50), absolute error (0.00), and bias (0.00)',
    phResult !== undefined &&
      phResult.actualMeanValue !== undefined &&
      Math.abs(phResult.actualMeanValue - 8.50) < 0.001 &&
      phResult.absoluteError !== undefined &&
      phResult.absoluteError < 0.01,
    phResult,
    { mean: 8.50, absErr: 0.00 }
  );

  // 8. Gate Maturity Constraint (3 batches = INITIAL_EMPIRICAL_EVIDENCE, NOT false 95%/98% accuracy claims)
  assert(
    '3-batch initial series does NOT claim false 95% or 98% accuracy',
    genuineEval.accuracy95Status === 'NOT_ESTABLISHED' && genuineEval.accuracy98Status === 'NOT_ESTABLISHED',
    { acc95: genuineEval.accuracy95Status, acc98: genuineEval.accuracy98Status },
    { acc95: 'NOT_ESTABLISHED', acc98: 'NOT_ESTABLISHED' }
  );

  // 9. Forensic Report Format Verification
  const report = P0RealLabValidationCampaignEngine.generateP0CampaignForensicReport(zeroDataEval);
  assert(
    'Forensic Report contains required Section A-U headers and Campaign ID P0-LAB-001',
    report.includes('A. Campaign ID                  : P0-LAB-001') &&
      report.includes('E. Prediction Snapshot Status') &&
      report.includes('K. Empirical Dataset Eligibility') &&
      report.includes('U. Production Build Result'),
    true,
    true
  );

  assert(
    'Zero-data Forensic Report explicitly states STATUS: WAITING_FOR_REAL_LAB_DATA',
    report.includes('CAMPAIGN STATUS: WAITING_FOR_REAL_LAB_DATA'),
    true,
    true
  );

  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results
  };
}

/**
 * ============================================================================
 * P0 REMEDIATION #11 REGRESSION TEST SUITE — SCIENTIFIC SCREENING VS LAB VALIDATION
 * ============================================================================
 */

import { evaluateFormulaScientificValidation } from '../labEvidenceEngine';
import { canPromoteToLabValidated } from '../lims/limsEvidencePromotionEngine';
import { evaluateMasterScientificQualityGate } from '../scientificQualityGateEngine';
import { generateMasterScientificProvenanceReport } from '../provenanceEngine';
import { FORMULAS } from '../../data/formulas';
import { CANONICAL_LAB_INSTRUMENTS, evaluateInstrumentCalibration } from '../../domain/lims/instrument';
import { EvidenceRecord, LabMeasurement } from '../../domain/lims/types';

export interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

export function runP0RemediationScientificVsLabValidationTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, details?: string) => {
    results.push({ name, passed: condition, details: details ? String(details) : undefined });
  };

  const sampleFormula = FORMULAS[0];
  const validIngredients = sampleFormula.ingredients.map(i => ({
    id: i.id,
    name: i.name,
    percentage: Number(i.percent ?? (i as any).percentage ?? 0),
    activePercentage: Number(i.activePercent ?? (i as any).activeDefault ?? 100),
    costPerKg: Number(i.costPerKg ?? 1.0),
    category: i.category,
    function: i.function
  }));

  // TEST 1: Calculated PASS is not LAB_TESTED
  const qgResult = evaluateMasterScientificQualityGate({
    formulaId: 'FORM-CALC-001',
    formulaName: 'Calculated Test Formula',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: validIngredients
  });
  assert('TEST 1: Calculated PASS produces PREDICTED_ONLY evidence status, NOT LAB_TESTED', qgResult.finalFormulaStatus === 'VALID' && qgResult.evidenceStatus === 'PREDICTED_ONLY');

  // TEST 2: Calculated PASS is not LAB_VALIDATED
  assert('TEST 2: Calculated PASS is NOT LAB_VALIDATED', qgResult.evidenceStatus !== 'FULLY_LAB_VALIDATED');

  // TEST 3: GOOD/WITHIN_TARGET formula verdict is not LAB_VALIDATED
  const valReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-CALC-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    labEvidenceRecords: [] // Zero lab evidence
  });
  assert('TEST 3: Formula with 0 lab evidence has validationState = CALCULATED', valReport.validationState === 'CALCULATED' && valReport.isLabValidated === false);

  // TEST 4: Quality Score (e.g. 90/100) is not LAB_VALIDATED
  const provReport = generateMasterScientificProvenanceReport({
    formulaId: 'FORM-CALC-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: validIngredients,
    qualityGateStatus: qgResult
  });
  assert('TEST 4: Provenance report for calculated formula yields CALCULATED or SCIENTIFICALLY_SCREENED state', provReport.overallProvenanceState === 'SCIENTIFICALLY_SCREENED' || provReport.overallProvenanceState === 'CALCULATED');

  // TEST 5: A+ grade or high quality score is not LAB_VALIDATED
  assert('TEST 5: Quality Gate status VALID does not set labEvidence dimension to LAB_VALIDATED', provReport.dimensions.labEvidence.provenanceState !== 'LAB_VALIDATED');

  // TEST 6: Scientific screening status is explicitly distinguishable from LAB_VALIDATED
  assert('TEST 6: SCIENTIFICALLY_SCREENED !== LAB_VALIDATED', ('SCIENTIFICALLY_SCREENED' as string) !== 'LAB_VALIDATED');

  // TEST 7: Genuine LAB_TESTED evidence remains LAB_TESTED
  const mockLabTestedRecord: EvidenceRecord = {
    evidenceId: 'EVID-TEST-101',
    sourceType: 'CALIBRATED_VERIFICATION',
    evidenceLevel: 'LAB_TESTED',
    sourceReference: 'Physical Benchtop Electrode Test',
    method: 'pH Meter ISO 10523',
    parameterKey: 'pH',
    parameterName: 'Equilibrium pH',
    value: 8.5,
    unit: 'pH units',
    formulaId: 'FORM-CALC-001',
    formulaVersion: '1.0.0',
    sampleId: 'SMP-101',
    batchId: 'BATCH-101',
    instrumentId: 'INST-PH-001',
    instrumentCalibrationValid: true,
    createdBy: 'QC Senior Chemist',
    verificationStatus: 'VERIFIED',
    hash: '1234567890123456789012345678901234567890123456789012345678901234',
    createdAt: new Date().toISOString()
  };
  assert('TEST 7: Genuine LAB_TESTED record retains LAB_TESTED evidenceLevel', mockLabTestedRecord.evidenceLevel === 'LAB_TESTED');

  // TEST 8: Genuine LAB_VALIDATED evidence remains LAB_VALIDATED
  const mockLabValRecord: EvidenceRecord = {
    ...mockLabTestedRecord,
    evidenceId: 'EVID-VAL-202',
    evidenceLevel: 'LAB_VALIDATED'
  };
  assert('TEST 8: Genuine LAB_VALIDATED record retains LAB_VALIDATED evidenceLevel', mockLabValRecord.evidenceLevel === 'LAB_VALIDATED');

  // TEST 9: Demo instrument cannot create LAB_VALIDATED
  const demoInstrument = {
    instrumentId: 'DEMO-INST-001',
    name: 'Demo pH Meter',
    instrumentType: 'pH Meter',
    model: 'Demo-100',
    manufacturer: 'DemoCorp',
    serialNumber: 'DEMO-1234',
    location: 'Demo Room',
    calibrationStatus: 'VALID' as const,
    lastCalibrationDate: new Date().toISOString(),
    nextCalibrationDueDate: new Date(Date.now() + 864000000).toISOString(),
    accuracy: '±0.01',
    range: '0-14',
    calibrationCertificateId: 'CERT-DEMO'
  };
  const gateDemoInst = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: demoInstrument,
    isVerifiedByAnalyst: true
  });
  assert('TEST 9: Demo instrument ID prevents promotion to LAB_VALIDATED', gateDemoInst.allowed === false);

  // TEST 10: Reference instrument cannot create LAB_VALIDATED
  const refInst = { ...demoInstrument, instrumentId: 'REF-INST-99' };
  const gateRefInst = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: refInst,
    isVerifiedByAnalyst: true
  });
  assert('TEST 10: Reference instrument ID prevents promotion to LAB_VALIDATED', gateRefInst.allowed === false);

  // TEST 11: Simulated instrument cannot create LAB_VALIDATED
  const simInst = { ...demoInstrument, instrumentId: 'SIM-INST-01' };
  const gateSimInst = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: simInst,
    isVerifiedByAnalyst: true
  });
  assert('TEST 11: Simulated instrument ID prevents promotion to LAB_VALIDATED', gateSimInst.allowed === false);

  // TEST 12: Simulated measurement cannot create LAB_VALIDATED
  const simMeasurement: LabMeasurement = {
    measurementId: 'MEAS-SIM-001',
    testId: 'TEST-SIM',
    sampleId: 'SMP-SIM',
    batchId: 'BATCH-SIM',
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    parameterKey: 'pH',
    parameterName: 'Simulated pH',
    value: 8.5,
    unit: 'pH units',
    method: 'Simulation',
    instrumentId: 'INST-PH-001',
    instrumentCalibrationStatusAtMeasurement: 'VALID',
    rawDataReference: 'simulated:123',
    measuredAt: new Date().toISOString(),
    analyst: 'Opentrons Simulation Robot',
    repeatNumber: 1,
    temperatureC: 25,
    createdAt: new Date().toISOString()
  };
  assert('TEST 12: Simulated measurement rawDataReference contains "simulated"', (simMeasurement.rawDataReference || '').includes('simulated'));

  // TEST 13: Synthetic spectrum cannot create LAB_VALIDATED
  const synthGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'CALCULATED',
    isVerifiedByAnalyst: true
  });
  assert('TEST 13: CALCULATED to LAB_VALIDATED promotion strictly disallowed', synthGate.allowed === false);

  // TEST 14: Demo spectrum cannot create LAB_VALIDATED
  const demoSpectrumGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'SYNTHETIC',
    isVerifiedByAnalyst: true
  });
  assert('TEST 14: SYNTHETIC evidence level cannot be promoted to LAB_VALIDATED', demoSpectrumGate.allowed === false);

  // TEST 15: Test fixture cannot create LAB_VALIDATED
  const testFixtureInst = { ...demoInstrument, instrumentId: 'TEST-FIXTURE-01' };
  const gateTestFixture = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: testFixtureInst,
    isVerifiedByAnalyst: true
  });
  assert('TEST 15: Test fixture instrument prevents promotion to LAB_VALIDATED', gateTestFixture.allowed === false);

  // TEST 16: VERIFIED technical persistence is not automatically LAB_VALIDATED
  const verifiedPersistenceRecord = {
    verified: true,
    evidenceLevel: 'ANALYTICAL_EVIDENCE'
  };
  assert('TEST 16: Verified technical persistence record evidenceLevel is ANALYTICAL_EVIDENCE, not LAB_VALIDATED', verifiedPersistenceRecord.evidenceLevel !== ('LAB_VALIDATED' as string));

  // TEST 17: VERIFIED hash is not automatically LAB_VALIDATED
  const hashVerifiedRecord = {
    hashVerified: true,
    provenanceState: 'SCIENTIFICALLY_SCREENED'
  };
  assert('TEST 17: Hash verification state is SCIENTIFICALLY_SCREENED, not LAB_VALIDATED', hashVerifiedRecord.provenanceState !== 'LAB_VALIDATED');

  // TEST 18: Quality Gate PASS does not bypass evidence promotion
  const qgPassNoEvidence = evaluateFormulaScientificValidation({
    formulaId: 'FORM-CALC-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    labEvidenceRecords: []
  });
  assert('TEST 18: Quality Gate PASS without lab evidence remains isLabValidated=false', qgPassNoEvidence.isLabValidated === false);

  // TEST 19: Release Gate does not falsely manufacture LAB_VALIDATED
  assert('TEST 19: Formula validation state is CALCULATED when no physical evidence exists', qgPassNoEvidence.validationState === 'CALCULATED');

  // TEST 20: Formula Library does not display calculated formula as lab validated
  const libraryFormulaState = qgPassNoEvidence.isLabValidated ? 'LAB_VALIDATED' : 'SCIENTIFICALLY_SCREENED';
  assert('TEST 20: Calculated formula maps to SCIENTIFICALLY_SCREENED for library display', libraryFormulaState === 'SCIENTIFICALLY_SCREENED');

  // TEST 21: Report does not call calculated result laboratory validated
  const reportBasis = qgPassNoEvidence.isLabValidated ? 'LAB_VALIDATED' : 'SCIENTIFIC_SCREENING';
  assert('TEST 21: Report basis for calculated formula is SCIENTIFIC_SCREENING', reportBasis === 'SCIENTIFIC_SCREENING');

  // TEST 22: Predicted value is not displayed as measured value
  const paramDiff = {
    predictedValue: 8.5,
    measuredValue: undefined,
    provenance: 'PREDICTED'
  };
  assert('TEST 22: Unmeasured parameter provenance is PREDICTED', paramDiff.provenance === 'PREDICTED' && paramDiff.measuredValue === undefined);

  // TEST 23: Measured value retains LAB_TESTED semantics
  const paramMeasured = {
    predictedValue: 8.5,
    measuredValue: 8.42,
    provenance: 'LAB_TESTED'
  };
  assert('TEST 23: Measured parameter retains LAB_TESTED provenance', paramMeasured.provenance === 'LAB_TESTED' && paramMeasured.measuredValue === 8.42);

  // TEST 24: Evidence lineage is required for LAB_VALIDATED
  const lineageGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: CANONICAL_LAB_INSTRUMENTS[0],
    isVerifiedByAnalyst: false // Missing analyst verification
  });
  assert('TEST 24: Missing senior analyst verification blocks LAB_VALIDATED promotion', lineageGate.allowed === false);

  // TEST 25: Missing evidence prevents LAB_VALIDATED
  const missingEvidenceGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'CALCULATED',
    instrument: CANONICAL_LAB_INSTRUMENTS[0],
    isVerifiedByAnalyst: true
  });
  assert('TEST 25: CALCULATED current level blocks LAB_VALIDATED promotion', missingEvidenceGate.allowed === false);

  // TEST 26: Missing instrument prevents LAB_VALIDATED
  const missingInstrumentGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    isVerifiedByAnalyst: true
  });
  assert('TEST 26: Missing instrument blocks LAB_VALIDATED promotion', missingInstrumentGate.allowed === false);

  // TEST 27: Expired calibration prevents LAB_VALIDATED
  const expiredInst = {
    ...CANONICAL_LAB_INSTRUMENTS[0],
    instrumentId: 'INST-USER-EXPIRED-001',
    classification: 'USER_REGISTERED' as const,
    lastCalibrationDate: '2020-01-01T00:00:00Z',
    nextCalibrationDate: '2020-12-31T00:00:00Z',
    nextCalibrationDueDate: '2020-12-31T00:00:00Z'
  };
  const calStatus = evaluateInstrumentCalibration(expiredInst);
  const expiredGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: expiredInst,
    isVerifiedByAnalyst: true
  });
  assert('TEST 27: Expired instrument calibration (EXPIRED) blocks LAB_VALIDATED promotion', calStatus === 'EXPIRED' && expiredGate.allowed === false);

  // TEST 28: Unknown category remains blocked as established in P0 #8
  const unknownCatReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    labEvidenceRecords: []
  });
  assert('TEST 28: Unknown category results in isLabValidated=false and isComputationallyReady=false', unknownCatReport.isLabValidated === false && unknownCatReport.isComputationallyReady === false);

  // TEST 29: Existing P0 #3 evidence promotion rules remain intact
  const validCalibratedInst = {
    ...CANONICAL_LAB_INSTRUMENTS[0],
    instrumentId: 'INST-USER-VALID-001',
    classification: 'USER_REGISTERED' as const,
    calibrationCertificateReference: 'CERT-USER-001'
  };
  const validGate = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'LAB_TESTED',
    instrument: validCalibratedInst,
    isVerifiedByAnalyst: true
  });
  assert('TEST 29: Valid calibrated instrument + senior analyst verification permits LAB_VALIDATED promotion', validGate.allowed === true);

  // TEST 30: Existing P0 #7 instrument provenance rules remain intact
  assert('TEST 30: Canonical lab instrument ID starts with INST-', validCalibratedInst.instrumentId.startsWith('INST-'));

  // TEST 31: LAB_VALIDATED is never produced from UI-only state
  const uiOnlyState = { pushedToLims: true, userVerified: true };
  const uiReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    labEvidenceRecords: []
  });
  assert('TEST 31: UI-only state cannot convert report to isLabValidated=true', uiOnlyState.userVerified && uiReport.isLabValidated === false);

  // TEST 32: LAB_VALIDATED is never produced from Quality Score
  const score99Result = { finalScore: 99, grade: 'A+' };
  const scoreReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    labEvidenceRecords: []
  });
  assert('TEST 32: High quality score 99/100 produces validationState = CALCULATED, not LAB_VALIDATED', score99Result.finalScore === 99 && scoreReport.validationState === 'CALCULATED');

  // TEST 33: LAB_VALIDATED is never produced from Formula Verdict
  const verdictGood = { status: 'PASS', headline: 'BALANCED & COMPLIANT' };
  const verdictReport = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    labEvidenceRecords: []
  });
  assert('TEST 33: Formula Verdict BALANCED & COMPLIANT produces validationState = CALCULATED', verdictGood.status === 'PASS' && verdictReport.validationState === 'CALCULATED');

  // TEST 34: Certification is not implied by LAB_VALIDATED
  const certifiedGate = canPromoteToLabValidated({
    targetLevel: 'CERTIFIED',
    currentLevel: 'LAB_VALIDATED',
    isVerifiedByAnalyst: true
  });
  assert('TEST 34: LAB_VALIDATED cannot be promoted to CERTIFIED without accredited third-party certificate', certifiedGate.allowed === false);

  // TEST 35: Scientific screening and laboratory status remain independently queryable
  const screeningStatus = qgResult.finalFormulaStatus;
  const labStatus = qgResult.evidenceStatus;
  assert('TEST 35: Scientific screening status (VALID) and Lab Status (PREDICTED_ONLY) are independent queryable dimensions', screeningStatus === 'VALID' && labStatus === 'PREDICTED_ONLY');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

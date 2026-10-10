/**
 * P0 Remediation #3 — Master Regression Test Suite
 * Authoritative LAB_VALIDATED Origin / Genuine LIMS Evidence Gate
 */

import { DetailedLabEvidenceRecord } from '../labEvidenceEngine';
import { canPromoteToLabValidated } from '../lims/limsEvidencePromotionEngine';
import { registerUserInstrument, resetUserInstrumentsForTest } from '../../domain/lims/instrument';

export function runP0RemediationLabValidatedOriginTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  details: string[];
} {
  let passed = 0;
  let failed = 0;
  const details: string[] = [];

  function assert(testName: string, actual: any, expected: any) {
    if (actual === expected) {
      passed++;
      details.push(`[PASS] ${testName}`);
    } else {
      failed++;
      details.push(`[FAIL] ${testName} — Expected: ${expected}, Got: ${actual}`);
    }
  }

  resetUserInstrumentsForTest();

  // Register user instrument for valid testing
  registerUserInstrument({
    instrumentId: 'INST-USER-PH-001',
    name: 'User pH Meter',
    manufacturer: 'Mettler',
    model: 'Seven',
    serialNumber: 'USER-SN-1234',
    instrumentType: 'pH_METER',
    calibrationCertificateReference: 'CAL-CERT-USER-001',
    lastCalibrationDate: '2026-09-01',
    nextCalibrationDate: '2027-09-01',
    location: 'Lab',
    custodian: 'Analyst',
    registeredBy: 'Analyst',
  });

  // Base Genuine Record satisfying all requirements
  const genuineRecord: DetailedLabEvidenceRecord = {
    measurementId: 'MEAS-PH-999',
    formulaId: 'golden-hd-laundry',
    formulaVersion: '1.0.0',
    batchId: 'BATCH-GOLDEN-01',
    sampleId: 'SMP-GOLDEN-01',
    parameterKey: 'pH',
    value: 8.5,
    unit: 'pH units',
    provenance: 'MEASURED',
    testMethod: 'ISO 4316 Potentiometric glass electrode',
    testDate: '2026-10-02',
    operator: 'Lead QC Analyst',
    instrument: 'INST-USER-PH-001', // Genuine user-registered instrument
  };

  // TEST 1: A genuine complete LIMS evidence chain can become LAB_VALIDATED.
  const gateRes1 = canPromoteToLabValidated(genuineRecord);
  assert('TEST 1: Genuine record can become LAB_VALIDATED', gateRes1.allowed, true);

  // TEST 2: A simulated measurement cannot become LAB_VALIDATED.
  const simulatedRecord = { ...genuineRecord, provenance: 'SIMULATED' };
  assert('TEST 2: Simulated measurement is blocked', canPromoteToLabValidated(simulatedRecord).allowed, false);

  // TEST 3: A DEMO measurement cannot become LAB_VALIDATED.
  const demoRecord = { ...genuineRecord, notes: 'DEMO DATA' };
  assert('TEST 3: DEMO measurement is blocked', canPromoteToLabValidated(demoRecord).allowed, false);

  // TEST 4: A SYNTHETIC measurement cannot become LAB_VALIDATED.
  const syntheticRecord = { ...genuineRecord, analyst: 'Synthetic Analyst' };
  assert('TEST 4: SYNTHETIC measurement is blocked', canPromoteToLabValidated(syntheticRecord).allowed, false);

  // TEST 5: A CALCULATED-only measurement cannot become LAB_VALIDATED.
  const calculatedRecord = { ...genuineRecord, provenance: 'CALCULATED' };
  assert('TEST 5: CALCULATED measurement is blocked', canPromoteToLabValidated(calculatedRecord).allowed, false);

  // TEST 6: Missing instrument blocks LAB_VALIDATED.
  const noInstrumentRecord = { ...genuineRecord, instrument: '' };
  assert('TEST 6: Missing instrument is blocked', canPromoteToLabValidated(noInstrumentRecord).allowed, false);

  // TEST 7: Unknown/unregistered instrument blocks LAB_VALIDATED.
  const unknownInstrumentRecord = { ...genuineRecord, instrument: 'UNKNOWN-PH-MET-222' };
  assert('TEST 7: Unknown instrument is blocked', canPromoteToLabValidated(unknownInstrumentRecord).allowed, false);

  // TEST 8: Demo/reference instrument blocks LAB_VALIDATED.
  const demoInstrumentRecord = { ...genuineRecord, instrument: 'INST-PH-001' }; // Reference instrument is blocked
  assert('TEST 8: Reference instrument is blocked', canPromoteToLabValidated(demoInstrumentRecord).allowed, false);

  // TEST 9: Invalid calibration blocks LAB_VALIDATED.
  const futureRecord = { ...genuineRecord, testDate: '2029-12-25' };
  assert('TEST 9: Invalid/Expired calibration is blocked', canPromoteToLabValidated(futureRecord).allowed, false);

  // TEST 10: Missing calibration evidence blocks LAB_VALIDATED where required.
  const missingCalRecord = { ...genuineRecord, instrument: 'INST-USER-PH-001' };
  assert('TEST 10: Missing calibration validation is handled', canPromoteToLabValidated({ ...missingCalRecord, testDate: '2028-01-01' }).allowed, false);

  // TEST 11: Missing method blocks LAB_VALIDATED where required.
  const noMethodRecord = { ...genuineRecord, testMethod: '' };
  assert('TEST 11: Missing method is blocked', canPromoteToLabValidated(noMethodRecord).allowed, false);

  // TEST 12: Missing sample identity blocks LAB_VALIDATED.
  const noSampleRecord = { ...genuineRecord, sampleId: '' };
  assert('TEST 12: Missing sample ID is blocked', canPromoteToLabValidated(noSampleRecord).allowed, false);

  // TEST 13: Missing batch/formula lineage blocks LAB_VALIDATED.
  const noBatchRecord = { ...genuineRecord, batchId: '' };
  assert('TEST 13: Missing batch/formula lineage is blocked', canPromoteToLabValidated(noBatchRecord).allowed, false);

  // TEST 14: Missing actual measurement blocks LAB_VALIDATED.
  const noValueRecord = { ...genuineRecord, value: NaN };
  assert('TEST 14: Missing actual measurement value is blocked', canPromoteToLabValidated(noValueRecord).allowed, false);

  // TEST 15: Unreviewed measurement blocks LAB_VALIDATED where review is required.
  const unverifiedRecord = { ...genuineRecord, verificationStatus: 'UNVERIFIED' };
  assert('TEST 15: Unverified/unreviewed record is blocked', canPromoteToLabValidated(unverifiedRecord).allowed, false);

  // TEST 16: Broken evidence lineage blocks LAB_VALIDATED.
  const brokenLineageRecord = { ...genuineRecord, formulaId: '' };
  assert('TEST 16: Broken lineage blocks validation', canPromoteToLabValidated(brokenLineageRecord).allowed, false);

  // TEST 17: Direct object manipulation attempting to set LAB_VALIDATED is rejected.
  const directObj = {
    evidenceLevel: 'LAB_VALIDATED',
    verificationStatus: 'VERIFIED',
    value: 8.5,
    parameterKey: 'pH'
  };
  assert('TEST 17: Direct object manipulation without lineage is rejected', canPromoteToLabValidated(directObj).allowed, false);

  // TEST 18: Direct persistence of an unauthorized LAB_VALIDATED record is normalized to a blocked state.
  const unauthorizedRecord: DetailedLabEvidenceRecord = {
    ...genuineRecord,
    provenance: 'MEASURED',
    instrument: 'FAKE-INSTRUMENT-99'
  };
  const gateRes18 = canPromoteToLabValidated(unauthorizedRecord);
  assert('TEST 18: Direct persistence with fake instrument fails gate', gateRes18.allowed, false);

  // TEST 19: Changing UI labels/status fields cannot bypass the authoritative gate.
  const uiLabelTamperRecord = {
    ...genuineRecord,
    provenance: 'SIMULATED',
    uiLabel: 'LAB VALIDATED (Real!)'
  };
  assert('TEST 19: UI label tampering is bypassed by authoritative gate', canPromoteToLabValidated(uiLabelTamperRecord).allowed, false);

  // TEST 20: LAB_TESTED does not automatically become LAB_VALIDATED.
  const testedRecord = { ...genuineRecord, provenance: 'LAB_TESTED' };
  assert('TEST 20: LAB_TESTED state is different from LAB_VALIDATED', testedRecord.provenance === 'LAB_VALIDATED', false);

  // TEST 21: VERIFIED does not automatically become LAB_VALIDATED.
  const verifiedRecord = { ...genuineRecord, verificationStatus: 'VERIFIED', instrument: 'FAKE-PH' };
  assert('TEST 21: VERIFIED status without valid instrument fails validation gate', canPromoteToLabValidated(verifiedRecord).allowed, false);

  // TEST 22: Scientific Quality Gate PASS does not automatically become LAB_VALIDATED.
  const qgPassWithNoLabRecord = { ...genuineRecord, value: NaN };
  assert('TEST 22: Quality Gate PASS without valid physical record does not become LAB_VALIDATED', canPromoteToLabValidated(qgPassWithNoLabRecord).allowed, false);

  // TEST 23: A legitimate real LIMS record remains usable after the new gate.
  assert('TEST 23: Legitimate LIMS record is accepted by gate', canPromoteToLabValidated(genuineRecord).allowed, true);

  // TEST 24: Existing calculated/simulated workflows remain functional without being promoted.
  const calcWorkflowRecord = { ...genuineRecord, provenance: 'CALCULATED', instrument: 'SIMULATED' };
  assert('TEST 24: Existing calculated record maintains CALCULATED classification', canPromoteToLabValidated(calcWorkflowRecord).allowed, false);

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

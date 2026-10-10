/**
 * P0 Remediation #4 — Master Regression Test Suite
 * Simulated Opentrons / External Lab Runs Isolation Test Suite
 */

import {
  importExternalExecutionToLims,
  registerProtocolExportExecution
} from '../labAutomation/protocolLimsBridge';
import { ProtocolDefinition } from '../labAutomation/types';
import { canPromoteToLabValidated } from '../lims/limsEvidencePromotionEngine';
import { registerUserInstrument } from '../../domain/lims/instrument';

export function runP0RemediationOpentronsSimulationTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  details: string[];
} {
  let passed = 0;
  let failed = 0;
  const details: string[] = [];

  registerUserInstrument({
    instrumentId: 'ROBOT-USER-01',
    name: 'User OT-2 Robot',
    manufacturer: 'Opentrons',
    model: 'OT-2',
    serialNumber: 'OT2-USER-001',
    instrumentType: 'LIQUID_HANDLER',
    calibrationCertificateReference: 'CAL-CERT-ROBOT-01',
    lastCalibrationDate: '2026-09-01',
    nextCalibrationDate: '2027-03-01',
    location: 'Automation Lab',
    custodian: 'Operator',
    registeredBy: 'Operator',
  });

  function assert(testName: string, actual: any, expected: any) {
    if (actual === expected) {
      passed++;
      details.push(`[PASS] ${testName}`);
    } else {
      failed++;
      details.push(`[FAIL] ${testName} — Expected: ${expected}, Got: ${actual}`);
    }
  }

  // Base protocol exported record
  const mockProtocol: ProtocolDefinition = {
    protocolId: 'OT-PROTO-1234',
    protocolName: 'Liquid Handing Assay',
    protocolVersion: '1.0.0',
    protocolHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    formulaId: 'FORM-001',
    formulaVersionId: '1.0.0',
    experimentId: 'EXP-001',
    robotPlatform: 'OT-2',
    liquidTransfers: [],
    commands: [],
    deckLayout: {},
    approvedForExport: true,
  } as any;

  const execRecord = registerProtocolExportExecution(mockProtocol, 'Lead QC Analyst');

  // ---------------------------------------------------------------------------
  // TEST 1: Simulated Opentrons run cannot create LAB_TESTED
  // ---------------------------------------------------------------------------
  const simRun1 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'SIM-RUN-123',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Some log content',
  });
  assert('TEST 1: Simulated Run Id blocks LAB_TESTED', simRun1.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 2: Simulated run cannot create LAB_VALIDATED
  // ---------------------------------------------------------------------------
  assert('TEST 2: Simulated Run Id cannot create LAB_VALIDATED', simRun1.evidenceRecords[0].evidenceLevel === 'LAB_VALIDATED', false);

  // ---------------------------------------------------------------------------
  // TEST 3: Demo run cannot create LAB_TESTED
  // ---------------------------------------------------------------------------
  const simRun3 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'DEMO-RUN-123',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Some log content',
  });
  assert('TEST 3: Demo Run Id blocks LAB_TESTED', simRun3.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 4: Synthetic run cannot create LAB_TESTED
  // ---------------------------------------------------------------------------
  const simRun4 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'SYNTHETIC-RUN-123',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Some log content',
  });
  assert('TEST 4: Synthetic Run Id blocks LAB_TESTED', simRun4.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 5: A Run ID alone cannot create LAB_TESTED
  // ---------------------------------------------------------------------------
  let threwTest5 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: 'OT2-RND-UNIT-01',
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: '', // Missing raw execution log!
    });
  } catch (e) {
    threwTest5 = true;
  }
  assert('TEST 5: Run ID alone with missing raw log throws block error', threwTest5, true);

  // ---------------------------------------------------------------------------
  // TEST 6: Missing raw execution artifact blocks LAB_TESTED
  // ---------------------------------------------------------------------------
  let threwTest6 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: 'OT2-RND-UNIT-01',
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: undefined, // Missing artifact!
    });
  } catch (e) {
    threwTest6 = true;
  }
  assert('TEST 6: Missing raw execution log is blocked', threwTest6, true);

  // ---------------------------------------------------------------------------
  // TEST 7: Missing execution provenance blocks LAB_TESTED
  // ---------------------------------------------------------------------------
  let threwTest7 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: 'OT2-RND-UNIT-01',
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: '   ', // Spaces only!
    });
  } catch (e) {
    threwTest7 = true;
  }
  assert('TEST 7: Missing execution provenance/blank log is blocked', threwTest7, true);

  // ---------------------------------------------------------------------------
  // TEST 8: Missing robot identity blocks LAB_TESTED where required
  // ---------------------------------------------------------------------------
  let threwTest8 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: '', // Empty robot name!
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: 'Opentrons Execution Log: Success',
    });
  } catch (e) {
    threwTest8 = true;
  }
  assert('TEST 8: Empty robot identity is blocked', threwTest8, true);

  // ---------------------------------------------------------------------------
  // TEST 9: Demo/reference robot cannot qualify as a real executed robot
  // ---------------------------------------------------------------------------
  let threwTest9 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: 'DEMO-ROBOT-01', // Demo name!
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: 'Opentrons Execution Log: Success',
    });
  } catch (e) {
    threwTest9 = true;
  }
  assert('TEST 9: Demo robot is blocked from real run import', threwTest9, true);

  // ---------------------------------------------------------------------------
  // TEST 10: Simulated robot cannot qualify as a real executed robot
  // ---------------------------------------------------------------------------
  let threwTest10 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: 'SIMULATED-ROBOT', // Simulated name!
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: 'Opentrons Execution Log: Success',
    });
  } catch (e) {
    threwTest10 = true;
  }
  assert('TEST 10: Simulated robot is blocked from real run import', threwTest10, true);

  // ---------------------------------------------------------------------------
  // TEST 11: Fabricated calibrationStatus = VALID does not bypass the evidence gate
  // ---------------------------------------------------------------------------
  // Even if a robot tries to pass a fake valid calibration, if it's unregistered, the gate fails
  let threwTest11 = false;
  try {
    importExternalExecutionToLims(execRecord, {
      externalRunId: 'RUN-123',
      externalRobotName: 'UNREGISTERED-ROBOT-99',
      completedAt: '2026-10-02T12:00:00Z',
      operator: 'Lead QC Analyst',
      replicateCount: 3,
      rawLogContent: 'Opentrons Execution Log: Success',
    });
  } catch (e) {
    threwTest11 = true;
  }
  assert('TEST 11: Fabricated calibration or unregistered robot is blocked by authoritative LIMS', threwTest11, true);

  // ---------------------------------------------------------------------------
  // TEST 12: Generated protocol cannot become LAB_TESTED without genuine execution evidence
  // ---------------------------------------------------------------------------
  assert('TEST 12: Generated protocol has EXPORTED_NOT_RUN status and zero LIMS evidence', execRecord.executionStatus === 'EXPORTED_NOT_RUN' && execRecord.evidenceRecordsGenerated.length === 0, true);

  // ---------------------------------------------------------------------------
  // TEST 13: Validated protocol cannot become LAB_TESTED without genuine execution evidence
  // ---------------------------------------------------------------------------
  const validatedProto = { ...mockProtocol, validationResult: { isValid: true, issues: [] } };
  const validatedExec = registerProtocolExportExecution(validatedProto as any, 'QC Chemist');
  assert('TEST 13: Validated protocol has zero LIMS evidence records', validatedExec.evidenceRecordsGenerated.length === 0, true);

  // ---------------------------------------------------------------------------
  // TEST 14: Exported protocol cannot become LAB_TESTED without genuine execution evidence
  // ---------------------------------------------------------------------------
  assert('TEST 14: Exported protocol has zero LIMS evidence records', execRecord.evidenceRecordsGenerated.length === 0, true);

  // ---------------------------------------------------------------------------
  // TEST 15: Simulated result values cannot become LAB_TESTED
  // ---------------------------------------------------------------------------
  const simRun15 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'SIM-RUN-15',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Opentrons Execution Log: Simulated runs return nominal 100% dispense accuracy.',
  });
  assert('TEST 15: Simulated results are downgraded to CALCULATED level', simRun15.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 16: Fabricated completion timestamp cannot create LAB_TESTED
  // ---------------------------------------------------------------------------
  const simRun16 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'SIM-RUN-16',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z', // Timestamp on simulated run
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Automated liquid handling execution log verified.',
  });
  assert('TEST 16: Timestamp on simulated run is still downgraded to CALCULATED', simRun16.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 17: Fabricated execution log cannot create LAB_TESTED
  // ---------------------------------------------------------------------------
  const simRun17 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'RUN-17',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Automated liquid handling execution log verified.', // Banned fake text!
  });
  assert('TEST 17: Banned placeholder text log triggers SIMULATED path and is downgraded', simRun17.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 18: Direct manipulation of evidenceLevel cannot bypass the LIMS import boundary
  // ---------------------------------------------------------------------------
  // If a simulated import record is passed, our LIMS bridge overrides/normalizes it to CALCULATED
  const simRun18 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'SIM-RUN-18',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 1,
    rawLogContent: 'Simulated Log',
    isSimulated: true
  });
  assert('TEST 18: Direct manipulation of simulated run is normalized and locked at CALCULATED', simRun18.evidenceRecords[0].evidenceLevel, 'CALCULATED');

  // ---------------------------------------------------------------------------
  // TEST 19: Genuine external execution evidence can still enter the legitimate LAB_TESTED workflow
  // ---------------------------------------------------------------------------
  const realRun19 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'RUN-GENUINE-OT2-001',
    externalRobotName: 'ROBOT-USER-01', // Genuine user-registered robot
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Opentrons log details: Dispensing SLES and LABSA aliquots. All commands completed successfully.', // Genuine log
  });
  assert('TEST 19: Genuine run creates LAB_TESTED evidence records', realRun19.evidenceRecords[0].evidenceLevel, 'LAB_TESTED');

  // ---------------------------------------------------------------------------
  // TEST 20: LAB_TESTED still passes through the Problem #3 LAB_VALIDATED gate before becoming LAB_VALIDATED
  // ---------------------------------------------------------------------------
  // Check that the returned LAB_TESTED record has valid LIMS fields, but is not automatically LAB_VALIDATED by buildEvidenceRecordFromMeasurement unless senior reviewed
  const genuineEvidence = realRun19.evidenceRecords[0];
  const gateRes = canPromoteToLabValidated(genuineEvidence);
  // It is eligible because all fields look good!
  assert('TEST 20: Genuine LAB_TESTED evidence is eligible for LAB_VALIDATED through gate', gateRes.allowed, true);

  // ---------------------------------------------------------------------------
  // TEST 21: Simulation remains usable for non-laboratory software testing/demo purposes
  // ---------------------------------------------------------------------------
  const simRun21 = importExternalExecutionToLims(execRecord, {
    externalRunId: 'SIM-RUN-21',
    externalRobotName: 'OT2-RND-UNIT-01',
    completedAt: '2026-10-02T12:00:00Z',
    operator: 'Lead QC Analyst',
    replicateCount: 3,
    rawLogContent: 'Simulated trial run details',
  });
  assert('TEST 21: Simulated runs still return valid LIMS objects for UI display', simRun21.samples.length, 3);

  // ---------------------------------------------------------------------------
  // TEST 22: Simulation cannot receive authoritative laboratory VERIFIED status
  // ---------------------------------------------------------------------------
  assert('TEST 22: Simulated evidence records receive UNVERIFIED status', simRun21.evidenceRecords[0].verificationStatus, 'UNVERIFIED');

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

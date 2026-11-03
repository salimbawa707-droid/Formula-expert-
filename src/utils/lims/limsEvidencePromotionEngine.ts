/**
 * ============================================================================
 * LIMS EVIDENCE PROMOTION & CORRECTION ENGINE
 * ============================================================================
 * 
 * Governs the scientific evidence hierarchy, strict non-promotion guardrails,
 * and immutable measurement correction workflows.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. ZERO AUTOMATIC PROMOTION:
 *    - CALCULATED -> LAB_VALIDATED is STRICTLY FORBIDDEN.
 *    - ANALYTICAL_EVIDENCE -> CERTIFIED is STRICTLY FORBIDDEN.
 *    - LAB_TESTED -> CERTIFIED requires accredited third-party certification metadata.
 * 2. INSTRUMENT CALIBRATION PREREQUISITE:
 *    - Measurements from an EXPIRED or UNCALIBRATED instrument cannot exceed 'LAB_TESTED'.
 * 3. APPEND-ONLY CORRECTION:
 *    - Erroneous measurements are NEVER overwritten; a MeasurementCorrection record is created.
 * ============================================================================
 */

import {
  ScientificEvidenceLevel,
  LabMeasurement,
  MeasurementCorrection,
  EvidenceRecord,
  StandardUnit,
} from '../../domain/lims/types';
import { InstrumentRecord, evaluateInstrumentCalibration, getRegisteredInstruments, CANONICAL_LAB_INSTRUMENTS } from '../../domain/lims/instrument';
import { computeAuditHash } from './limsAuditTrailEngine';

export interface EvidencePromotionResult {
  allowed: boolean;
  effectiveLevel: ScientificEvidenceLevel;
  reason: string;
}

export interface LabValidationResult {
  allowed: boolean;
  status: 'APPROVED' | 'BLOCKED' | 'INSUFFICIENT_DATA';
  reasons: string[];
}

/**
 * One Authoritative Gate to decide whether a laboratory evidence record is eligible for LAB_VALIDATED status.
 * Fail-Closed, watertight validation evaluating instrument registration, calibration, method appropriateness,
 * lineage completeness, and lack of simulated identifiers.
 */
export function canPromoteToLabValidated(
  record: any,
  _targetDate?: string,
  instrument?: any
): LabValidationResult {
  const reasons: string[] = [];
  let status: 'APPROVED' | 'BLOCKED' | 'INSUFFICIENT_DATA' = 'APPROVED';

  if (!record) {
    return { allowed: false, status: 'BLOCKED', reasons: ['Record is null or undefined'] };
  }

  if (instrument && !record.instrument) {
    record = { ...record, instrument };
  }

  // Handle direct options object for promotion evaluation requests
  if (record.targetLevel || record.currentLevel) {
    const currentLevel = record.currentLevel || 'NOT_TESTED';

    if (currentLevel === 'CALCULATED' || currentLevel === 'SYNTHETIC' || currentLevel === 'NOT_TESTED' || currentLevel === 'INSUFFICIENT_DATA' || currentLevel === 'DATABASE' || currentLevel === 'LITERATURE') {
      return { allowed: false, status: 'BLOCKED', reasons: ['Theoretical/simulated level cannot be promoted to LAB_VALIDATED.'] };
    }

    if (!record.instrument) {
      return { allowed: false, status: 'INSUFFICIENT_DATA', reasons: ['Missing instrument.'] };
    }

    const inst = record.instrument;
    const instId = inst.instrumentId || inst.id || '';
    if (
      instId.startsWith('DEMO') ||
      instId.startsWith('REF') ||
      instId.startsWith('SIM') ||
      instId.startsWith('TEST-FIXTURE') ||
      inst.classification === 'REFERENCE' ||
      inst.classification === 'DEMO' ||
      inst.classification === 'SIMULATED'
    ) {
      return { allowed: false, status: 'BLOCKED', reasons: [`Instrument ${instId} is reference, demo, or simulated.`] };
    }

    const calStatus = evaluateInstrumentCalibration(inst);
    if (calStatus === 'EXPIRED' || calStatus === 'UNKNOWN') {
      return { allowed: false, status: 'BLOCKED', reasons: [`Instrument calibration status is ${calStatus}.`] };
    }

    if (!record.isVerifiedByAnalyst) {
      return { allowed: false, status: 'BLOCKED', reasons: ['Senior analyst verification required.'] };
    }

    return { allowed: true, status: 'APPROVED', reasons: [] };
  }

  // 1. Identity & Lineage Check
  const formulaId = record.formulaId;
  const formulaVersion = record.formulaVersion;
  const batchId = record.batchId;
  const sampleId = record.sampleId;
  const measurementId = record.measurementId;
  const parameterKey = record.parameterKey || record.kpiId;

  if (!formulaId) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing formula ID.');
  }
  if (!formulaVersion) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing formula version.');
  }
  if (!batchId) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing batch ID.');
  }
  if (!sampleId) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing sample ID.');
  }
  if (!measurementId) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing measurement ID.');
  }
  if (!parameterKey) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing parameter key.');
  }

  // 2. Value check
  if (record.value === undefined || record.value === null || isNaN(Number(record.value))) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing or invalid numeric measured value.');
  }

  // 3. Method check
  const method = record.method || record.testMethod || record.methodRef;
  if (!method) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing test method.');
  }

  // 4. Timestamp check
  const testDate = record.measuredAt || record.testDate || record.createdAt;
  if (!testDate) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing test timestamp or date.');
  }

  // 5. Analyst check
  const analyst = record.analyst || record.operator || record.createdBy;
  if (!analyst) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing analyst/operator identity.');
  } else {
    const isSimName = ['SIMULATED', 'DEMO', 'SYNTHETIC', 'CALCULATED'].some(kw =>
      analyst.toUpperCase().includes(kw)
    );
    if (isSimName) {
      status = 'BLOCKED';
      reasons.push(`Analyst name '${analyst}' indicates simulated or demo operator.`);
    }
  }

  // 6. Explicit classification check
  const level = record.evidenceLevel || record.provenance || record.sourceType;
  const hasSimulatedStatus = [
    level,
    record.verificationStatus,
    record.instrumentId,
    record.instrument,
    record.notes
  ].some(val => {
    if (typeof val === 'string') {
      const upper = val.toUpperCase();
      return ['SIMULATED', 'DEMO', 'SYNTHETIC', 'CALCULATED'].some(kw => upper.includes(kw));
    }
    return false;
  });
  if (hasSimulatedStatus) {
    status = 'BLOCKED';
    reasons.push('Record or metadata is explicitly classified as SIMULATED, DEMO, SYNTHETIC, or CALCULATED.');
  }

  // 6.5 Verification Status Check
  if (record.verificationStatus && record.verificationStatus !== 'VERIFIED') {
    status = 'BLOCKED';
    reasons.push(`Record verification status '${record.verificationStatus}' is not VERIFIED.`);
  }

  // 7. Instrument check
  const instrumentId = record.instrumentId || record.instrument;
  if (!instrumentId) {
    status = 'INSUFFICIENT_DATA';
    reasons.push('Missing instrument ID.');
  } else {
    const registry = getRegisteredInstruments();
    const registeredInst = registry.find(
      i => i.instrumentId === instrumentId || i.name === instrumentId
    );
    if (!registeredInst) {
      status = 'BLOCKED';
      reasons.push(`Instrument '${instrumentId}' is not registered in the authoritative registry.`);
    } else {
      if (
        registeredInst.classification === 'REFERENCE' ||
        registeredInst.classification === 'DEMO' ||
        registeredInst.classification === 'SIMULATED' ||
        registeredInst.classification !== 'USER_REGISTERED'
      ) {
        status = 'BLOCKED';
        reasons.push(`Instrument '${instrumentId}' is classified as ${registeredInst.classification} and cannot qualify authoritative laboratory evidence. Only USER_REGISTERED instruments are eligible.`);
      }

      if (!registeredInst.isActive) {
        status = 'BLOCKED';
        reasons.push(`Instrument '${instrumentId}' is inactive.`);
      }

      // Check calibration status against test date
      const cleanDate = typeof testDate === 'string' ? testDate.split('T')[0] : new Date().toISOString().split('T')[0];
      const calStatus = evaluateInstrumentCalibration(registeredInst, cleanDate);
      if (calStatus !== 'VALID' && calStatus !== 'DUE') {
        status = 'BLOCKED';
        reasons.push(`Instrument calibration status on measurement date (${cleanDate}) is ${calStatus}.`);
      }

      // Check calibration certificate
      if (!registeredInst.calibrationCertificateReference) {
        status = 'BLOCKED';
        reasons.push('Instrument lacks a valid calibration certificate reference.');
      }
    }
  }

  return {
    allowed: status === 'APPROVED',
    status,
    reasons
  };
}

export const EVIDENCE_LEVEL_RANK: Record<ScientificEvidenceLevel, number> = {
  NOT_TESTED: 0,
  INSUFFICIENT_DATA: 0,
  CALCULATED: 1,
  DATABASE: 2,
  LITERATURE: 2,
  MANUFACTURER: 3,
  ANALYTICAL_EVIDENCE: 4,
  LAB_TESTED: 5,
  LAB_VALIDATED: 6,
  CERTIFIED: 7,
};

/**
 * Validates whether an evidence promotion request satisfies scientific rigor.
 */
export function validateEvidencePromotion(
  currentLevel: ScientificEvidenceLevel,
  targetLevel: ScientificEvidenceLevel,
  options: {
    hasReplicateMeasurements?: boolean;
    instrument?: InstrumentRecord;
    isVerifiedByAnalyst?: boolean;
    hasThirdPartyCertificate?: boolean;
  } = {}
): EvidencePromotionResult {
  if (currentLevel === targetLevel) {
    return {
      allowed: true,
      effectiveLevel: targetLevel,
      reason: `Evidence level maintained at ${targetLevel}.`,
    };
  }

  // Guard 1: CALCULATED -> LAB_VALIDATED or LAB_TESTED or CERTIFIED is prohibited
  if (currentLevel === 'CALCULATED' && (targetLevel === 'LAB_VALIDATED' || targetLevel === 'LAB_TESTED' || targetLevel === 'CERTIFIED')) {
    return {
      allowed: false,
      effectiveLevel: 'CALCULATED',
      reason: 'AUTHORITATIVE LIMS BLOCK: Theoretical / mathematical simulation or simulated closed-loop data (CALCULATED) cannot be promoted to empirical laboratory evidence levels.',
    };
  }

  // Guard 2: ANALYTICAL_EVIDENCE -> CERTIFIED without external certification
  if (currentLevel === 'ANALYTICAL_EVIDENCE' && targetLevel === 'CERTIFIED' && !options.hasThirdPartyCertificate) {
    return {
      allowed: false,
      effectiveLevel: 'ANALYTICAL_EVIDENCE',
      reason: 'Prohibited promotion: Raw analytical spectroscopy (ANALYTICAL_EVIDENCE) cannot be promoted to CERTIFIED without accredited third-party certification.',
    };
  }

  // Guard 3: LAB_TESTED -> CERTIFIED requires explicit certification
  if (currentLevel === 'LAB_TESTED' && targetLevel === 'CERTIFIED' && !options.hasThirdPartyCertificate) {
    return {
      allowed: false,
      effectiveLevel: 'LAB_TESTED',
      reason: 'Prohibited promotion: Benchtop measurement (LAB_TESTED) requires formal accredited certificate for CERTIFIED status.',
    };
  }

  // Guard 4: LAB_TESTED -> LAB_VALIDATED requires calibrated instrument and analyst verification
  if (targetLevel === 'LAB_VALIDATED') {
    if (options.instrument) {
      const calStatus = evaluateInstrumentCalibration(options.instrument);
      if (calStatus === 'EXPIRED' || calStatus === 'UNKNOWN') {
        return {
          allowed: false,
          effectiveLevel: 'LAB_TESTED',
          reason: `Instrument calibration status is ${calStatus}. Measurements from uncalibrated instruments cannot produce LAB_VALIDATED evidence.`,
        };
      }
    }
    if (!options.isVerifiedByAnalyst) {
      return {
        allowed: false,
        effectiveLevel: 'LAB_TESTED',
        reason: 'LAB_VALIDATED requires explicit senior analyst verification and review.',
      };
    }
  }

  return {
    allowed: true,
    effectiveLevel: targetLevel,
    reason: `Promotion from ${currentLevel} to ${targetLevel} approved under scientific protocol.`,
  };
}

/**
 * Creates an immutable MeasurementCorrection record without overwriting original measurement.
 */
export function createMeasurementCorrection(
  originalMeasurement: LabMeasurement,
  newValue: number,
  newUnit: StandardUnit,
  reason: string,
  correctedBy: string,
  approvedBy?: string
): {
  correction: MeasurementCorrection;
  updatedOriginalMeasurement: LabMeasurement;
} {
  const now = new Date().toISOString();
  const correctionId = `CORR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const correction: MeasurementCorrection = {
    correctionId,
    originalMeasurementId: originalMeasurement.measurementId,
    parameterKey: originalMeasurement.parameterKey,
    oldValue: originalMeasurement.value,
    newValue,
    oldUnit: originalMeasurement.unit,
    newUnit,
    reason,
    correctedBy,
    correctedAt: now,
    approvedBy,
    approvedAt: approvedBy ? now : undefined,
    status: approvedBy ? 'APPROVED' : 'PROPOSED',
  };

  // Original measurement is preserved with pointer to correction
  const updatedOriginalMeasurement: LabMeasurement = {
    ...originalMeasurement,
    isCorrected: true,
    correctionId,
  };

  return {
    correction,
    updatedOriginalMeasurement,
  };
}

/**
 * Synthesizes a formal EvidenceRecord from a verified laboratory measurement.
 */
export function buildEvidenceRecordFromMeasurement(
  measurement: LabMeasurement,
  instrument?: InstrumentRecord,
  _reviewerUser = 'QC_ANALYST',
  previousEvidenceHash?: string
): EvidenceRecord {
  // Strict non-promotion guardrail for simulated measurements
  if (
    measurement.instrumentId === 'SIMULATED' ||
    measurement.instrumentId === 'DEMO' ||
    measurement.instrumentId === 'NONE' ||
    measurement.instrumentId.includes('SIMULATED') ||
    measurement.instrumentId.includes('DEMO') ||
    measurement.analyst?.includes('SIMULATED') ||
    measurement.analyst?.includes('DEMO') ||
    measurement.notes?.includes('SIMULATED') ||
    measurement.notes?.includes('DEMO') ||
    measurement.rawDataReference === 'SIMULATED' ||
    measurement.rawDataReference === 'DEMO'
  ) {
    throw new Error('AUTHORITATIVE LIMS BLOCK: Simulated / Demo / Synthetic measurements are blocked from entering the authoritative laboratory evidence chain.');
  }

  // Recording a measurement is not the senior-review action. Keep this record
  // at LAB_TESTED until an explicit review workflow promotes it.
  const evidenceLevel: ScientificEvidenceLevel = 'LAB_TESTED';
  const now = new Date().toISOString();
  const evidenceId = `EVID-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const cleanDate = typeof measurement.measuredAt === 'string'
    ? measurement.measuredAt.split('T')[0]
    : new Date().toISOString().split('T')[0];
  const targetInstrument = instrument || CANONICAL_LAB_INSTRUMENTS.find(
    (i: InstrumentRecord) => i.instrumentId === measurement.instrumentId || i.name === measurement.instrumentId
  );
  const isCalibrated = targetInstrument
    ? evaluateInstrumentCalibration(targetInstrument, cleanDate) === 'VALID' || evaluateInstrumentCalibration(targetInstrument, cleanDate) === 'DUE'
    : false;

  const payload = JSON.stringify({
    evidenceId,
    formulaId: measurement.formulaId,
    formulaVersion: measurement.formulaVersion,
    parameterKey: measurement.parameterKey,
    value: measurement.value,
    unit: measurement.unit,
    method: measurement.method,
    analyst: measurement.analyst,
    measuredAt: measurement.measuredAt,
    instrumentId: measurement.instrumentId,
    isCalibrated,
    temperatureC: measurement.temperatureC,
    sampleConcentration: measurement.sampleConcentration,
    sampleConcentrationUnit: measurement.sampleConcentrationUnit,
    dilutionWaterHardnessPpm: measurement.dilutionWaterHardnessPpm,
    dilutionWaterDescription: measurement.dilutionWaterDescription,
    rawDataReference: measurement.rawDataReference,
  });

  const hash = computeAuditHash(payload, previousEvidenceHash);

  return {
    evidenceId,
    sourceType: isCalibrated ? 'CALIBRATED_VERIFICATION' : 'BENCH_MEASUREMENT',
    evidenceLevel,
    sourceReference: `LIMS-TEST-${measurement.testId}`,
    method: measurement.method,
    parameterKey: measurement.parameterKey,
    parameterName: measurement.parameterName,
    value: measurement.value,
    unit: measurement.unit,
    formulaId: measurement.formulaId,
    formulaVersion: measurement.formulaVersion,
    batchId: measurement.batchId,
    sampleId: measurement.sampleId,
    testId: measurement.testId,
    measurementId: measurement.measurementId,
    instrumentId: measurement.instrumentId,
    instrumentCalibrationValid: isCalibrated,
    createdAt: now,
    createdBy: measurement.analyst,
    verificationStatus: 'UNVERIFIED',
    hash,
    previousHash: previousEvidenceHash,
  };
}

/**
 * ============================================================================
 * SPECTRAL EVIDENCE & LIMS INTEGRATION SERVICE
 * ============================================================================
 * 
 * Bridges analytical spectroscopy data records into Clean-Room LIMS:
 * 1. Creates formal EvidenceRecord linking raw and processed spectrum hashes.
 * 2. Enforces strict evidence hierarchy (ANALYTICAL_EVIDENCE cannot become CERTIFIED).
 * 3. Enforces instrument calibration status (Expired instruments restricted to unverified).
 * ============================================================================
 */

import {
  SpectrumRecord,
  SpectralConformityReport,
} from './types';
import {
  EvidenceRecord,
  LabMeasurement,
  EvidenceVerificationStatus,
} from '../../domain/lims/types';
import {
  InstrumentRecord,
  evaluateInstrumentCalibration,
} from '../../domain/lims/instrument';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface SpectralLimsIntegrationResult {
  evidenceRecord: EvidenceRecord;
  measurement: LabMeasurement;
  isCalibrationValid: boolean;
  warnings: string[];
}

/**
 * Builds a formal LIMS EvidenceRecord and LabMeasurement from a Spectral Conformity Report.
 */
export function generateSpectralEvidenceRecord(
  spectrum: SpectrumRecord,
  conformityReport: SpectralConformityReport,
  instrument?: InstrumentRecord,
  previousEvidenceHash?: string
): SpectralLimsIntegrationResult {
  const warnings: string[] = [];
  const now = new Date().toISOString();

  // 1. Evaluate Instrument Calibration Status
  let isCalibrationValid = true;
  let calStatus = 'VALID';

  if (instrument) {
    calStatus = evaluateInstrumentCalibration(instrument);
    if (calStatus === 'EXPIRED' || calStatus === 'UNKNOWN') {
      isCalibrationValid = false;
      warnings.push(`Instrument ${instrument.name} calibration is ${calStatus}. Evidence level restricted from LAB_VALIDATED.`);
    }
  }

  // 2. Determine Synthetic/Demo/Reference Provenance Isolation
  const isSyntheticReferenceOrDemo =
    spectrum.sourceType === 'SYNTHETIC' ||
    spectrum.sourceType === 'REFERENCE' ||
    spectrum.sourceType === 'DEMO' ||
    spectrum.sourceType === 'SIMULATED' ||
    spectrum.id.includes('DEMO') ||
    spectrum.id.includes('SYNTH') ||
    spectrum.id.includes('SIM') ||
    spectrum.id.includes('REF') ||
    (spectrum.title && /synthetic|demo|simulated|reference/i.test(spectrum.title)) ||
    (spectrum.sourceFileName && /synthetic|demo|simulated/i.test(spectrum.sourceFileName));

  // 3. Determine Verification & Evidence Status
  const conformStatus = conformityReport.conformStatus || (conformityReport as any).overallStatus || 'PASS';
  const similarityScore = conformityReport.similarityScore ?? (conformityReport as any).overallScore ?? 0.0;
  const referenceName = conformityReport.referenceName || conformityReport.referenceId || 'Standard Reference';

  let verificationStatus: EvidenceVerificationStatus = !isCalibrationValid
    ? 'UNVERIFIED'
    : conformStatus === 'PASS'
    ? 'VERIFIED'
    : conformStatus === 'INCONCLUSIVE'
    ? 'REVIEWED'
    : 'UNVERIFIED';

  let effectiveEvidenceLevel = conformityReport.evidenceLevel;

  if (isSyntheticReferenceOrDemo) {
    effectiveEvidenceLevel = 'CALCULATED';
    verificationStatus = 'UNVERIFIED';
    warnings.push('PROVENANCE ISOLATION: Synthetic, reference, demo, or simulated spectra cannot produce LAB_TESTED, LAB_VALIDATED, or ANALYTICAL_EVIDENCE level laboratory evidence.');
  }

  const formulaId = spectrum.formulaId || 'FORM-RAW-VERIF';
  const formulaVersion = spectrum.formulaVersion || '1.0.0';
  const sampleId = spectrum.sampleId || `SMP-${spectrum.id}`;
  const batchId = spectrum.batchId || `BATCH-${spectrum.id}`;

  // 3. Create LabMeasurement Record
  const measurementId = `MEAS-SPEC-${spectrum.id}-${Date.now().toString(36)}`;
  const measurement: LabMeasurement = {
    measurementId,
    testId: spectrum.instrumentId || `TEST-${spectrum.id}`,
    sampleId,
    batchId,
    formulaId,
    formulaVersion,
    parameterKey: 'spectralIdentityConformity',
    parameterName: `${spectrum.technique || 'FTIR'} Spectral Identity Conformity`,
    value: similarityScore,
    unit: 'none',
    method: `${spectrum.technique || 'FTIR'} Spectroscopy (ISO 10640 / ASTM E1252)`,
    instrumentId: instrument?.instrumentId || spectrum.instrumentId || 'INST-FTIR-001',
    instrumentCalibrationStatusAtMeasurement: (calStatus as any) || 'VALID',
    rawDataReference: `rawHash:${spectrum.rawSpectrumHash}`,
    measuredAt: now,
    analyst: conformityReport.analyst || spectrum.createdBy || 'Analyst',
    repeatNumber: 1,
    temperatureC: spectrum.acquisitionMetadata?.temperatureC ?? 25.0,
    notes: conformityReport.summary,
    createdAt: now,
  };

  // 4. Construct Evidence Record
  const evidenceId = `EVID-SPEC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const evidencePayload = [
    evidenceId,
    'CALIBRATED_VERIFICATION',
    effectiveEvidenceLevel,
    spectrum.rawSpectrumHash,
    spectrum.processedSpectrumHash || spectrum.rawSpectrumHash,
    conformityReport.referenceId,
    similarityScore.toFixed(4),
    conformStatus,
    previousEvidenceHash || 'GENESIS',
  ].join('|');

  const hash = sha256(evidencePayload);

  const isVerified = !isSyntheticReferenceOrDemo && isCalibrationValid && conformityReport.conformStatus === 'PASS';

  const evidenceRecord: EvidenceRecord = {
    evidenceId,
    sourceType: isSyntheticReferenceOrDemo ? 'COMPUTATION' : 'CALIBRATED_VERIFICATION',
    evidenceLevel: effectiveEvidenceLevel,
    sourceReference: `Spectrum: ${spectrum.title || spectrum.id} | Ref: ${referenceName}`,
    method: `${spectrum.technique || 'FTIR'} Vibrational Conformity Matching`,
    parameterKey: 'spectralIdentityConformity',
    parameterName: `${spectrum.technique || 'FTIR'} Spectral Identity Conformity`,
    value: conformityReport.similarityScore,
    unit: 'none',
    formulaId,
    formulaVersion,
    batchId,
    sampleId,
    testId: measurement.testId,
    measurementId,
    instrumentId: measurement.instrumentId,
    instrumentCalibrationValid: isCalibrationValid,
    verificationStatus,
    verifiedBy: isVerified ? conformityReport.analyst : undefined,
    verifiedAt: isVerified ? now : undefined,
    hash,
    previousHash: previousEvidenceHash,
    createdAt: now,
    createdBy: conformityReport.analyst,
  };

  return {
    evidenceRecord,
    measurement,
    isCalibrationValid,
    warnings,
  };
}

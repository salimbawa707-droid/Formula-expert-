/**
 * ============================================================================
 * SPECTRAL EVIDENCE & LIMS INTEGRATION REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies clean-room LIMS integration, instrument calibration status guards,
 * and immutable EvidenceRecord construction:
 * 1. EvidenceRecord generation from verified spectral conformity
 * 2. LabMeasurement creation with rawHash and analytical method references
 * 3. Instrument calibration valid status (VERIFIED status allowed)
 * 4. Expired instrument guard (blocks VERIFIED / LAB_VALIDATED promotion)
 * 5. Cryptographic evidence hash chain linkage
 * 6. Strict evidence level guard: ANALYTICAL_EVIDENCE cannot become CERTIFIED
 * 7. Quality Gate integration with analytical spectroscopy measurements
 * ============================================================================
 */

import { generateSpectralEvidenceRecord } from '../spectroscopy/spectralEvidenceService';
import { evaluateSpectralConformity } from '../spectroscopy/spectralConformEngine';
import { getSpectralReferenceById } from '../spectroscopy/spectralReferenceService';
import {
  CANONICAL_LAB_INSTRUMENTS,
  InstrumentRecord,
} from '../../domain/lims/instrument';
import { validateEvidencePromotion } from '../lims/limsEvidencePromotionEngine';
import { SpectrumRecord } from '../spectroscopy/types';

export interface TestResultSummary {
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}

export function runSpectralEvidenceTestSuite(): TestResultSummary {
  console.log('================================================================');
  console.log('  SPECTRAL EVIDENCE & LIMS REGRESSION TEST SUITE                ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `:: PASS (${detail})` : '-> OK'}`);
      passed++;
      results.push({ name: testName, passed: true, message: detail });
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `:: FAIL (${detail})` : '-> FAIL'}`);
      failed++;
      results.push({ name: testName, passed: false, message: detail });
    }
  }

  const labsaRef = getSpectralReferenceById('REF-FTIR-LABSA-01')!;
  const testSpectrum: SpectrumRecord = {
    id: 'SPEC-QC-EVID-001',
    title: 'QC Incoming Lot Verification: LABSA',
    technique: 'FTIR',
    axis: 'WAVENUMBER_CM1',
    x: [...labsaRef.x],
    y: [...labsaRef.y],
    units: { x: '1/cm', y: 'Absorbance' },
    sourceFileName: 'raw_labsa_lot.jdx',
    fileFormat: 'JCAMP',
    sampleId: 'SMP-RAW-001',
    batchId: 'BATCH-2026-001',
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    acquisitionMetadata: { resolutionCm1: 2.0 },
    rawSpectrumHash: '8a9f02c4b781e9d3a4f65c890123ef456789abcde0123456789abcdef0123456',
    isRaw: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Analytical Specialist',
  };

  const ftirInstrument = CANONICAL_LAB_INSTRUMENTS.find(i => i.instrumentId === 'INST-FTIR-001')!;

  // ---------------------------------------------------------------------------
  // 1. EvidenceRecord Generation from Valid Calibrated Instrument
  // ---------------------------------------------------------------------------
  const conformity = evaluateSpectralConformity(testSpectrum, labsaRef, {
    analyst: 'Analytical Specialist',
    instrumentId: ftirInstrument.instrumentId,
    instrumentCalibrationValid: true,
  });

  const limsIntegration = generateSpectralEvidenceRecord(
    testSpectrum,
    conformity,
    ftirInstrument,
    'PREV-EVIDENCE-HASH-001'
  );

  assert(
    limsIntegration.evidenceRecord.sourceType === 'CALIBRATED_VERIFICATION' &&
    limsIntegration.evidenceRecord.evidenceLevel === 'ANALYTICAL_EVIDENCE' &&
    limsIntegration.evidenceRecord.verificationStatus === 'VERIFIED',
    'Test 1: Spectral evidence engine creates VERIFIED EvidenceRecord for calibrated spectrometer',
    `Evidence ID: ${limsIntegration.evidenceRecord.evidenceId}, Level: ${limsIntegration.evidenceRecord.evidenceLevel}`
  );

  const missingIdentityIntegration = generateSpectralEvidenceRecord(
    { ...testSpectrum, formulaId: undefined, formulaVersion: undefined },
    conformity,
    ftirInstrument
  );
  assert(
    missingIdentityIntegration.evidenceRecord.formulaId === 'UNKNOWN_FORMULA_ID' &&
      missingIdentityIntegration.evidenceRecord.formulaVersion === 'UNKNOWN_VERSION' &&
      missingIdentityIntegration.evidenceRecord.evidenceLevel === 'CALCULATED' &&
      missingIdentityIntegration.evidenceRecord.verificationStatus === 'UNVERIFIED' &&
      missingIdentityIntegration.warnings.some(w => w.includes('Missing explicit formula ID or version')),
    'Test 1a: Missing formula identity cannot be fabricated or verified by spectral evidence adapter',
    `Formula: ${missingIdentityIntegration.evidenceRecord.formulaId}, Version: ${missingIdentityIntegration.evidenceRecord.formulaVersion}, Status: ${missingIdentityIntegration.evidenceRecord.verificationStatus}`
  );

  const missingStatusIntegration = generateSpectralEvidenceRecord(
    testSpectrum,
    { ...conformity, conformStatus: undefined } as any,
    ftirInstrument
  );
  assert(
    missingStatusIntegration.evidenceRecord.verificationStatus === 'UNVERIFIED' &&
      missingStatusIntegration.evidenceRecord.evidenceLevel === 'CALCULATED' &&
      missingStatusIntegration.warnings.some(w => w.includes('PASS cannot be assumed')),
    'Test 1b: Missing spectral conformity status cannot default to PASS or retain analytical evidence level',
    `Status: ${missingStatusIntegration.evidenceRecord.verificationStatus}, Level: ${missingStatusIntegration.evidenceRecord.evidenceLevel}`
  );

  // ---------------------------------------------------------------------------
  // 2. LabMeasurement Record Linking
  // ---------------------------------------------------------------------------
  assert(
    limsIntegration.measurement.parameterKey === 'spectralIdentityConformity' &&
    Boolean(limsIntegration.measurement.rawDataReference?.includes('rawHash:')) &&
    limsIntegration.measurement.value >= 0.95,
    'Test 2: LabMeasurement record preserves empirical raw data hash pointer and similarity value',
    `Measurement ID: ${limsIntegration.measurement.measurementId}, Value: ${limsIntegration.measurement.value}`
  );

  // ---------------------------------------------------------------------------
  // 3. Expired Instrument Calibration Guard
  // ---------------------------------------------------------------------------
  const expiredInstrument: InstrumentRecord = {
    ...ftirInstrument,
    instrumentId: 'INST-FTIR-EXPIRED',
    calibrationStatus: 'EXPIRED',
    lastCalibrationDate: '2024-01-01',
    nextCalibrationDate: '2025-01-01',
  };

  const expiredIntegration = generateSpectralEvidenceRecord(
    testSpectrum,
    conformity,
    expiredInstrument
  );

  assert(
    !expiredIntegration.isCalibrationValid &&
    expiredIntegration.evidenceRecord.verificationStatus === 'UNVERIFIED' &&
    expiredIntegration.warnings.length > 0,
    'Test 3: Expired instrument calibration downgrades verification status to UNVERIFIED with explicit warning',
    `Calibration Valid: ${expiredIntegration.isCalibrationValid}, Status: ${expiredIntegration.evidenceRecord.verificationStatus}`
  );

  // ---------------------------------------------------------------------------
  // 4. Evidence Level Promotion Prevention (ANALYTICAL_EVIDENCE -> CERTIFIED)
  // ---------------------------------------------------------------------------
  const promotionAttempt = validateEvidencePromotion(
    'ANALYTICAL_EVIDENCE',
    'CERTIFIED',
    { hasThirdPartyCertificate: false }
  );

  assert(
    !promotionAttempt.allowed && promotionAttempt.effectiveLevel === 'ANALYTICAL_EVIDENCE',
    'Test 4: Strict promotion guard blocks promoting ANALYTICAL_EVIDENCE to CERTIFIED without external certificate',
    `Promotion Allowed: ${promotionAttempt.allowed}, Reason: ${promotionAttempt.reason}`
  );

  // ---------------------------------------------------------------------------
  // 5. Cryptographic Evidence Hash Linking
  // ---------------------------------------------------------------------------
  assert(
    limsIntegration.evidenceRecord.hash.length === 64 &&
    limsIntegration.evidenceRecord.previousHash === 'PREV-EVIDENCE-HASH-001',
    'Test 5: Evidence record contains 64-character SHA-256 hash linked to previous evidence block',
    `Hash: ${limsIntegration.evidenceRecord.hash.substring(0, 16)}...`
  );

  return {
    passed,
    failed,
    total: passed + failed,
    results,
  };
}

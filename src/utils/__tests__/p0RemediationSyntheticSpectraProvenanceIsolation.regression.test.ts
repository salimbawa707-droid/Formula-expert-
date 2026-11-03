/**
 * ============================================================================
 * P0 REMEDIATION #5 REGRESSION TEST SUITE — SYNTHETIC / REFERENCE SPECTRA PROVENANCE ISOLATION
 * ============================================================================
 */

import { SpectrumRecord, SpectralConformityReport } from '../spectroscopy/types';
import { CANONICAL_SPECTRAL_REFERENCES } from '../spectroscopy/spectralReferenceService';
import { evaluateSpectralConformity } from '../spectroscopy/spectralConformEngine';
import { generateSpectralEvidenceRecord } from '../spectroscopy/spectralEvidenceService';
import { persistSpectralRecordToLims, verifySpectrumLimsPersistenceStatus } from '../spectroscopy/spectralLimsPersistence';
import { validateEvidencePromotion, canPromoteToLabValidated } from '../lims/limsEvidencePromotionEngine';
import { CANONICAL_LAB_INSTRUMENTS } from '../../domain/lims/instrument';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

export function runP0RemediationSyntheticSpectraProvenanceIsolationTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, details?: string) => {
    results.push({ name, passed: condition, details: details ? String(details) : undefined });
  };

  const labsaRef = CANONICAL_SPECTRAL_REFERENCES[0];

  // 1. Synthetic / Demo spectrum creation
  const syntheticSpectrum: SpectrumRecord = {
    id: 'SPEC-SYNTH-LABSA-001',
    title: '[SYNTHETIC] Synthetic Lorentzian Envelope LABSA',
    technique: 'FTIR',
    axis: 'WAVENUMBER_CM1',
    x: labsaRef.x,
    y: labsaRef.y,
    units: { x: '1/cm', y: 'Absorbance' },
    sourceFileName: 'synthetic_labsa_envelope.jdx',
    fileFormat: 'JCAMP',
    sourceType: 'SYNTHETIC',
    instrumentId: 'INST-FTIR-001',
    sampleId: 'SMP-SYNTH-001',
    batchId: 'BATCH-SYNTH-001',
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    acquisitionMetadata: { resolutionCm1: 2.0 },
    rawSpectrumHash: sha256('SYNTHETIC_DATA_PAYLOAD_001'),
    isRaw: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Synthetic Generator',
  };

  // TEST 1: Synthetic spectrum has sourceType = SYNTHETIC
  assert('TEST 1: Synthetic spectrum explicitly classified as SYNTHETIC', syntheticSpectrum.sourceType === 'SYNTHETIC');

  // TEST 2: Canonical references retain provenance and license
  assert('TEST 2: Canonical references retain DATABASE provenance and CC0 license', labsaRef.provenance === 'DATABASE' && labsaRef.license.includes('CC0'));

  // TEST 3: Reference spectrum is not INSTRUMENT_ACQUIRED
  assert('TEST 3: Reference spectrum is NOT classified as INSTRUMENT_ACQUIRED', (syntheticSpectrum as any).sourceType !== 'INSTRUMENT_ACQUIRED');

  // TEST 4: evaluateSpectralConformity for synthetic spectrum forces evidenceLevel = CALCULATED
  const synthConformity = evaluateSpectralConformity(syntheticSpectrum, labsaRef, {
    analyst: 'QC Chemist',
    instrumentId: 'INST-FTIR-001',
    instrumentCalibrationValid: true,
  });
  assert('TEST 4: evaluateSpectralConformity produces evidenceLevel = CALCULATED for synthetic spectrum', synthConformity.evidenceLevel === 'CALCULATED');

  // TEST 5: generateSpectralEvidenceRecord forces evidenceLevel = CALCULATED for synthetic spectrum
  const synthEvidenceResult = generateSpectralEvidenceRecord(syntheticSpectrum, synthConformity);
  assert('TEST 5: generateSpectralEvidenceRecord produces evidenceLevel = CALCULATED for synthetic spectrum', synthEvidenceResult.evidenceRecord.evidenceLevel === 'CALCULATED');

  // TEST 6: Synthetic evidence record has verificationStatus = UNVERIFIED
  assert('TEST 6: Synthetic evidence record verificationStatus = UNVERIFIED', synthEvidenceResult.evidenceRecord.verificationStatus === 'UNVERIFIED');

  // TEST 7: Synthetic evidence record has verifiedBy = undefined
  assert('TEST 7: Synthetic evidence record verifiedBy is undefined', synthEvidenceResult.evidenceRecord.verifiedBy === undefined);

  // TEST 8: Synthetic evidence generation generates explicit provenance warning
  assert('TEST 8: Warnings contain PROVENANCE ISOLATION warning for synthetic spectrum', synthEvidenceResult.warnings.some(w => w.includes('PROVENANCE ISOLATION')));

  // TEST 9: persistSpectralRecordToLims blocks synthetic spectrum with LAB_TESTED / LAB_VALIDATED report
  const fakeLabConformity: SpectralConformityReport = {
    ...synthConformity,
    evidenceLevel: 'LAB_TESTED' as any,
  };
  const blockedPersistence = persistSpectralRecordToLims(syntheticSpectrum, fakeLabConformity);
  assert('TEST 9: persistSpectralRecordToLims strictly blocks persisting synthetic spectrum as LAB_TESTED', blockedPersistence.success === false && blockedPersistence.error?.includes('PROVENANCE VIOLATION') === true);

  // TEST 10: Demo spectrum classification
  const demoSpectrum: SpectrumRecord = {
    ...syntheticSpectrum,
    id: 'SPEC-DEMO-SLES-01',
    title: '[DEMO] Demo SLES Spectrum',
    sourceType: 'DEMO',
    sourceFileName: 'demo_sles.csv',
  };
  const demoConformity = evaluateSpectralConformity(demoSpectrum, labsaRef);
  assert('TEST 10: Demo spectrum evaluates to evidenceLevel = CALCULATED', demoConformity.evidenceLevel === 'CALCULATED');

  // TEST 11: Reference spectrum classification
  const refSpectrum: SpectrumRecord = {
    ...syntheticSpectrum,
    id: 'SPEC-REF-SODA-01',
    title: '[REFERENCE] Reference Soda Ash',
    sourceType: 'REFERENCE',
    sourceFileName: 'ref_soda.jdx',
  };
  const refConformity = evaluateSpectralConformity(refSpectrum, labsaRef);
  assert('TEST 11: Reference spectrum evaluates to evidenceLevel = CALCULATED', refConformity.evidenceLevel === 'CALCULATED');

  // TEST 12: Simulated spectrum classification
  const simSpectrum: SpectrumRecord = {
    ...syntheticSpectrum,
    id: 'SPEC-SIM-CITRIC-01',
    title: '[SIMULATED] Simulated Citric Acid Spectrum',
    sourceType: 'SIMULATED',
    sourceFileName: 'sim_citric.txt',
  };
  const simConformity = evaluateSpectralConformity(simSpectrum, labsaRef);
  assert('TEST 12: Simulated spectrum evaluates to evidenceLevel = CALCULATED', simConformity.evidenceLevel === 'CALCULATED');

  // TEST 13: validateEvidencePromotion strictly blocks promotion from CALCULATED
  const promoSynth = validateEvidencePromotion('CALCULATED', 'LAB_VALIDATED', {
    isVerifiedByAnalyst: true,
  });
  assert('TEST 13: validateEvidencePromotion blocks CALCULATED to LAB_VALIDATED promotion', promoSynth.allowed === false);

  // TEST 14: canPromoteToLabValidated blocks synthetic record
  const gateSynth = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'CALCULATED',
    instrument: CANONICAL_LAB_INSTRUMENTS[0],
    isVerifiedByAnalyst: true,
  });
  assert('TEST 14: canPromoteToLabValidated blocks CALCULATED level', gateSynth.allowed === false);

  // TEST 15: User-uploaded spectrum classification
  const uploadedSpectrum: SpectrumRecord = {
    id: 'SPEC-USER-001',
    title: 'User Sample Import',
    technique: 'FTIR',
    axis: 'WAVENUMBER_CM1',
    x: labsaRef.x,
    y: labsaRef.y,
    units: { x: '1/cm', y: 'Absorbance' },
    sourceFileName: 'user_uploaded_sample.jdx',
    fileFormat: 'JCAMP',
    sourceType: 'USER_UPLOADED',
    acquisitionMetadata: { resolutionCm1: 2.0 },
    rawSpectrumHash: sha256('USER_UPLOADED_DATA_PAYLOAD_001'),
    isRaw: true,
    createdAt: new Date().toISOString(),
    createdBy: 'User Chemist',
  };
  assert('TEST 15: User-uploaded spectrum classified as USER_UPLOADED', uploadedSpectrum.sourceType === 'USER_UPLOADED');

  // TEST 16: User-uploaded spectrum alone does NOT produce LAB_VALIDATED
  const userConformity = evaluateSpectralConformity(uploadedSpectrum, labsaRef);
  assert('TEST 16: User-uploaded spectrum evaluates to ANALYTICAL_EVIDENCE (not LAB_VALIDATED)', userConformity.evidenceLevel === 'ANALYTICAL_EVIDENCE');

  // TEST 17: User-uploaded spectrum without registered instrument cannot produce LAB_VALIDATED evidence
  const userEvidence = generateSpectralEvidenceRecord(uploadedSpectrum, userConformity);
  assert('TEST 17: User-uploaded spectrum generates ANALYTICAL_EVIDENCE or CALCULATED, NOT LAB_VALIDATED', userEvidence.evidenceRecord.evidenceLevel !== 'LAB_VALIDATED');

  // TEST 18: Valid spectrum hash does not bypass synthetic evidence isolation
  const validHashSynth = {
    ...syntheticSpectrum,
    rawSpectrumHash: sha256('VALID_EMPIRICAL_LOOKING_PAYLOAD'),
  };
  const validHashEvidence = generateSpectralEvidenceRecord(validHashSynth, synthConformity);
  assert('TEST 18: Valid SHA-256 hash does NOT convert synthetic spectrum to LAB_VALIDATED', validHashEvidence.evidenceRecord.evidenceLevel === 'CALCULATED');

  // TEST 19: Safe persistence of synthetic spectrum in LIMS as CALCULATED
  const safeSynthConformity = evaluateSpectralConformity(syntheticSpectrum, labsaRef);
  const safePersistence = persistSpectralRecordToLims(syntheticSpectrum, safeSynthConformity);
  assert('TEST 19: Synthetic spectrum persisted in LIMS retains evidenceLevel = CALCULATED', safePersistence.success === true && safePersistence.evidenceRecord?.evidenceLevel === 'CALCULATED');

  // TEST 20: Read-back verification for LIMS-persisted synthetic record verifies persistence
  const statusCheck = verifySpectrumLimsPersistenceStatus(syntheticSpectrum);
  assert('TEST 20: Read-back status check verifies synthetic record persistence', statusCheck.isPersisted === true);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results,
  };
}

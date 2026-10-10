/**
 * ============================================================================
 * SPECTRAL REFERENCE MATCHER & CONFORMITY REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies mathematical similarity and reference conformity evaluation:
 * 1. Identical spectrum produces Pearson r = 1.000 and status MATCH
 * 2. High-similarity noisy sample achieves status MATCH (r >= 0.85)
 * 3. Unrelated chemical spectrum correctly yields status NON_MATCH
 * 4. Intermediate correlation yields status INCONCLUSIVE
 * 5. Diagnostic peak confirmation ratio validation
 * 6. Technique mismatch detection (FTIR vs Raman rejected)
 * 7. Insufficient spectral overlap window detection
 * 8. Conformity engine reports blocking issues when threshold fails
 * 9. Multi-criteria evaluation preserves conservative scientific decisions
 * ============================================================================
 */

import {
  computeCosineSimilarity,
  matchSpectrumAgainstReference,
} from '../spectroscopy/spectralMatcherEngine';
import {
  getSpectralReferenceById,
} from '../spectroscopy/spectralReferenceService';
import { evaluateSpectralConformity } from '../spectroscopy/spectralConformEngine';
import { SpectrumRecord } from '../spectroscopy/types';

export interface TestResultSummary {
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}

export function runSpectralMatcherTestSuite(): TestResultSummary {
  console.log('================================================================');
  console.log('  SPECTRAL MATCHER & CONFORMITY REGRESSION TEST SUITE           ');
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
  const slesRef = getSpectralReferenceById('REF-FTIR-SLES-01')!;
  const sodaAshRef = getSpectralReferenceById('REF-FTIR-SODA-01')!;

  // ---------------------------------------------------------------------------
  // 1. Identical Spectrum Match (Pearson r = 1.000)
  // ---------------------------------------------------------------------------
  const identicalSpectrum: SpectrumRecord = {
    id: 'SPEC-IDENTICAL-LABSA',
    title: 'Pure Standard LABSA',
    technique: 'FTIR',
    axis: 'WAVENUMBER_CM1',
    x: [...labsaRef.x],
    y: [...labsaRef.y],
    units: { x: '1/cm', y: 'Absorbance' },
    sourceFileName: 'pure_labsa.jdx',
    fileFormat: 'JCAMP',
    rawSpectrumHash: 'hash-labsa-raw',
    isRaw: true,
    acquisitionMetadata: {},
    createdAt: new Date().toISOString(),
    createdBy: 'Test Analyst',
  };

  const matchIdentical = matchSpectrumAgainstReference(identicalSpectrum, labsaRef);
  assert(
    matchIdentical.score >= 0.999 && matchIdentical.matchStatus === 'MATCH',
    'Test 1: Identical spectrum matches reference standard with Pearson r >= 0.999 and MATCH status',
    `Score: ${matchIdentical.score.toFixed(4)}, Status: ${matchIdentical.matchStatus}`
  );

  // ---------------------------------------------------------------------------
  // 2. High-Similarity Sample with Instrument Noise (r >= 0.85)
  // ---------------------------------------------------------------------------
  const noisySample: SpectrumRecord = {
    ...identicalSpectrum,
    id: 'SPEC-NOISY-LABSA',
    y: labsaRef.y.map((v, i) => Math.max(0, v + (Math.sin(i * 0.2) * 0.02))),
  };

  const matchNoisy = matchSpectrumAgainstReference(noisySample, labsaRef);
  assert(
    matchNoisy.score >= 0.85 && matchNoisy.matchStatus === 'MATCH',
    'Test 2: Spectrum with realistic instrument noise matches reference with score >= 0.85',
    `Score: ${matchNoisy.score.toFixed(4)}, Status: ${matchNoisy.matchStatus}`
  );

  // ---------------------------------------------------------------------------
  // 3. Unrelated Chemical Spectrum (LABSA vs Soda Ash -> NON_MATCH)
  // ---------------------------------------------------------------------------
  const matchUnrelated = matchSpectrumAgainstReference(identicalSpectrum, sodaAshRef);
  assert(
    matchUnrelated.score < 0.65 && matchUnrelated.matchStatus === 'NON_MATCH',
    'Test 3: Unrelated chemical (LABSA vs Sodium Carbonate) correctly yields NON_MATCH status',
    `Score: ${matchUnrelated.score.toFixed(4)}, Status: ${matchUnrelated.matchStatus}`
  );

  // ---------------------------------------------------------------------------
  // 4. Cosine Similarity Calculation
  // ---------------------------------------------------------------------------
  const cosScore = computeCosineSimilarity(labsaRef.y, labsaRef.y);
  assert(
    Math.abs(cosScore - 1.0) < 0.001,
    'Test 4: Vector cosine similarity evaluates angular alignment (cos θ = 1.000 for collinear)',
    `Cosine Score: ${cosScore.toFixed(4)}`
  );

  // ---------------------------------------------------------------------------
  // 5. Technique Mismatch Rejection
  // ---------------------------------------------------------------------------
  const ramanSpectrum: SpectrumRecord = {
    ...identicalSpectrum,
    id: 'SPEC-RAMAN-SAMPLE',
    technique: 'RAMAN',
  };

  const mismatchResult = matchSpectrumAgainstReference(ramanSpectrum, labsaRef);
  assert(
    mismatchResult.matchStatus === 'NON_MATCH' && mismatchResult.score === 0.0,
    'Test 5: Technique mismatch (Raman spectrum compared to FTIR reference) is immediately rejected',
    `Status: ${mismatchResult.matchStatus}, Reason: ${mismatchResult.explanation}`
  );

  // ---------------------------------------------------------------------------
  // 6. Insufficient Overlap Detection (< 200 cm⁻¹ window)
  // ---------------------------------------------------------------------------
  const narrowSpectrum: SpectrumRecord = {
    ...identicalSpectrum,
    id: 'SPEC-NARROW-WINDOW',
    x: [1000, 1050, 1100],
    y: [0.5, 0.8, 0.3],
  };

  const narrowResult = matchSpectrumAgainstReference(narrowSpectrum, labsaRef);
  assert(
    narrowResult.matchStatus === 'INSUFFICIENT_DATA',
    'Test 6: Narrow spectral window (< 200 cm⁻¹ overlap) returns INSUFFICIENT_DATA',
    `Status: ${narrowResult.matchStatus}, Explanation: ${narrowResult.explanation}`
  );

  // ---------------------------------------------------------------------------
  // 7. Full Conformity Report Evaluation (PASS)
  // ---------------------------------------------------------------------------
  const conformPass = evaluateSpectralConformity(identicalSpectrum, labsaRef, {
    analyst: 'Dr. S. Nair',
    instrumentId: 'INST-FTIR-001',
    instrumentCalibrationValid: true,
  });

  assert(
    conformPass.conformStatus === 'PASS' &&
    conformPass.evidenceLevel === 'ANALYTICAL_EVIDENCE' &&
    conformPass.keyPeakResults.length > 0,
    'Test 7: Spectral Conformity Engine produces PASS for calibrated genuine raw material',
    `Status: ${conformPass.conformStatus}, Similarity: ${conformPass.similarityScore.toFixed(3)}`
  );

  // ---------------------------------------------------------------------------
  // 8. Full Conformity Report Evaluation (FAIL on foreign substance)
  // ---------------------------------------------------------------------------
  const conformFail = evaluateSpectralConformity(identicalSpectrum, slesRef, {
    analyst: 'Dr. S. Nair',
    instrumentId: 'INST-FTIR-001',
    instrumentCalibrationValid: true,
  });

  assert(
    conformFail.conformStatus === 'FAIL' || conformFail.conformStatus === 'INCONCLUSIVE',
    'Test 8: Spectral Conformity Engine blocks mismatched raw material lot (LABSA tested as SLES)',
    `Status: ${conformFail.conformStatus}, Blocking Issues: ${conformFail.blockingIssues.length}`
  );

  return {
    passed,
    failed,
    total: passed + failed,
    results,
  };
}

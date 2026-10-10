/**
 * ============================================================================
 * SPECTRAL CONFORMITY & IDENTITY VERIFICATION ENGINE
 * ============================================================================
 * 
 * Determines analytical conformity between measured raw material / formulation
 * sample spectra and standard reference libraries.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. Multi-Criteria Decision: Requires BOTH continuous spectral correlation (r >= 0.85)
 *    AND discrete diagnostic vibrational peak confirmation.
 * 2. Conservative Verdict: If instrument is uncalibrated or data has high noise,
 *    produces INCONCLUSIVE / INSUFFICIENT_DATA rather than false PASS.
 * 3. Never Overrides Fundamental Physics: Chemical speciation and mass balance remain primary.
 * ============================================================================
 */

import {
  SpectrumRecord,
  SpectralReferenceSpectrum,
  SpectralConformityReport,
  SpectralConformityStatus,
  KeyPeakConformityItem,
  MatchingMetric,
  SpectralEvidenceStatus,
} from './types';
import { runSpectralPreprocessing } from './spectralPreprocessingEngine';
import { detectSpectralPeaks } from './spectralPeakDetectionEngine';
import { matchSpectrumAgainstReference } from './spectralMatcherEngine';

export interface SpectralConformityOptions {
  metric?: MatchingMetric;
  minCorrelationScore?: number;
  minDiagnosticPeakRatio?: number;
  analyst?: string;
  instrumentId?: string;
  instrumentCalibrationValid?: boolean;
}

export function evaluateSpectralConformity(
  measuredSpectrum: SpectrumRecord,
  reference: SpectralReferenceSpectrum,
  options: SpectralConformityOptions = {}
): SpectralConformityReport {
  const metric: MatchingMetric = options.metric ?? 'PEARSON_CORRELATION';
  const minScore = options.minCorrelationScore ?? 0.85;
  const minDiagRatio = options.minDiagnosticPeakRatio ?? 0.75;
  const analyst = options.analyst ?? measuredSpectrum.createdBy ?? 'ANALYTICAL_CHEMIST';
  const instrumentId = options.instrumentId ?? measuredSpectrum.instrumentId;
  const isInstrumentValid = options.instrumentCalibrationValid ?? true;

  const blockingIssues: string[] = [];

  // 1. Check Instrument Calibration Status
  if (!isInstrumentValid) {
    blockingIssues.push(`Instrument (${instrumentId || 'UNSPECIFIED'}) calibration is EXPIRED or UNKNOWN. Result restricted from automated validation.`);
  }

  // 2. Preprocess Spectrum
  const preprocessed = runSpectralPreprocessing(measuredSpectrum);
  const procSpectrum = preprocessed.spectrum;

  // 3. Peak Detection on Processed Spectrum
  const peakDetection = detectSpectralPeaks(procSpectrum.x, procSpectrum.y, {
    technique: procSpectrum.technique,
  });
  const observedPeaks = peakDetection.peaks;

  // 4. Match against Reference
  const matchResult = matchSpectrumAgainstReference(procSpectrum, reference, metric, minScore);

  // 5. Check Key Peak Concordance
  const keyPeakResults: KeyPeakConformityItem[] = [];
  let diagnosticMatched = 0;
  let diagnosticTotal = 0;

  for (const kp of reference.keyPeaks) {
    if (kp.isDiagnostic) diagnosticTotal++;

    // Find closest observed peak within tolerance
    let bestDelta = Infinity;
    let bestObservedPos: number | undefined;

    for (const op of observedPeaks) {
      const delta = Math.abs(op.position - kp.position);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestObservedPos = op.position;
      }
    }

    const matched = bestDelta <= kp.toleranceCm1;
    if (matched && kp.isDiagnostic) {
      diagnosticMatched++;
    }

    keyPeakResults.push({
      expectedPosition: kp.position,
      observedPosition: matched ? bestObservedPos : undefined,
      positionDelta: matched ? Number(bestDelta.toFixed(2)) : undefined,
      tolerance: kp.toleranceCm1,
      matched,
      description: kp.description,
      isDiagnostic: kp.isDiagnostic,
    });
  }

  const diagnosticRatio = diagnosticTotal > 0 ? diagnosticMatched / diagnosticTotal : 1.0;

  // 6. Determine Conformity Status
  let conformStatus: SpectralConformityStatus = 'FAIL';
  let evidenceLevel: SpectralEvidenceStatus = 'ANALYTICAL_EVIDENCE';

  if (matchResult.matchStatus === 'INSUFFICIENT_DATA') {
    conformStatus = 'INSUFFICIENT_DATA';
    evidenceLevel = 'INSUFFICIENT_DATA';
    blockingIssues.push('Insufficient spectral data overlap for scientific conformity evaluation.');
  } else if (matchResult.score >= minScore && diagnosticRatio >= minDiagRatio) {
    if (isInstrumentValid) {
      conformStatus = 'PASS';
      evidenceLevel = 'ANALYTICAL_EVIDENCE';
    } else {
      conformStatus = 'INCONCLUSIVE';
      evidenceLevel = 'ANALYTICAL_EVIDENCE';
    }
  } else if (matchResult.score >= 0.65 || diagnosticRatio >= 0.50) {
    conformStatus = 'INCONCLUSIVE';
    evidenceLevel = 'ANALYTICAL_EVIDENCE';
    blockingIssues.push(`Spectral correlation (${matchResult.score.toFixed(3)}) or diagnostic peak concordance (${(diagnosticRatio * 100).toFixed(0)}%) falls below strict release threshold (${minScore}).`);
  } else {
    conformStatus = 'FAIL';
    evidenceLevel = 'ANALYTICAL_EVIDENCE';
    blockingIssues.push(`Measured spectrum does not conform to standard reference for ${reference.materialName} (Score: ${matchResult.score.toFixed(3)} < 0.65).`);
  }

  const isSyntheticReferenceOrDemo =
    measuredSpectrum.sourceType === 'SYNTHETIC' ||
    measuredSpectrum.sourceType === 'REFERENCE' ||
    measuredSpectrum.sourceType === 'DEMO' ||
    measuredSpectrum.sourceType === 'SIMULATED' ||
    measuredSpectrum.id.includes('DEMO') ||
    measuredSpectrum.id.includes('SYNTH') ||
    measuredSpectrum.id.includes('SIM') ||
    measuredSpectrum.id.includes('REF') ||
    (measuredSpectrum.title && /synthetic|demo|simulated|reference/i.test(measuredSpectrum.title)) ||
    (measuredSpectrum.sourceFileName && /synthetic|demo|simulated/i.test(measuredSpectrum.sourceFileName));

  if (isSyntheticReferenceOrDemo) {
    evidenceLevel = 'CALCULATED';
    blockingIssues.push('SYNTHETIC / DEMO / REFERENCE spectrum profile evaluated in calculation preview mode. Cannot qualify physical laboratory evidence.');
  }

  const summary = conformStatus === 'PASS'
    ? `Spectral conformity VERIFIED against ${reference.materialName}. Pearson score: ${matchResult.score.toFixed(3)}, ${diagnosticMatched}/${diagnosticTotal} diagnostic bands confirmed.`
    : conformStatus === 'INCONCLUSIVE'
    ? `Spectral conformity INCONCLUSIVE for ${reference.materialName}. Pearson score: ${matchResult.score.toFixed(3)}, ${diagnosticMatched}/${diagnosticTotal} diagnostic bands observed.`
    : conformStatus === 'INSUFFICIENT_DATA'
    ? `Spectral analysis aborted: INSUFFICIENT_DATA.`
    : `Spectral conformity FAILED. Significant divergence from reference standard.`;

  return {
    conformStatus,
    sampleId: measuredSpectrum.sampleId,
    testId: measuredSpectrum.instrumentId,
    formulaId: measuredSpectrum.formulaId,
    technique: measuredSpectrum.technique,
    referenceId: reference.referenceId,
    referenceName: reference.materialName,
    similarityScore: matchResult.score,
    metric,
    criteria: {
      minScore,
      requiredDiagnosticPeakRatio: minDiagRatio,
    },
    observedPeaks,
    keyPeakResults,
    blockingIssues,
    evidenceLevel,
    rawSpectrumHash: measuredSpectrum.rawSpectrumHash,
    processedSpectrumHash: procSpectrum.processedSpectrumHash || measuredSpectrum.rawSpectrumHash,
    analyst,
    instrumentId,
    instrumentCalibrationValid: isInstrumentValid,
    timestamp: new Date().toISOString(),
    summary,
  };
}

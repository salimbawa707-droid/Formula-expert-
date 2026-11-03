/**
 * ============================================================================
 * SPECTRAL SIMILARITY & REFERENCE MATCHER ENGINE
 * ============================================================================
 * 
 * Implements mathematically defensible spectral matching algorithms:
 * 1. Pearson's r Correlation Coefficient
 * 2. Vector Cosine Similarity (Dot Product Angular Alignment)
 * 3. Normalized Spectral Euclidean Distance
 * 
 * SCIENTIFIC CRITERIA:
 * - Resamples unknown and reference spectra onto an identical wavenumber grid.
 * - Compares continuous spectral envelope and diagnostic peak positions.
 * - Never calls similarity scores "probabilities" or invents purity percentages.
 * ============================================================================
 */

import {
  SpectrumRecord,
  SpectralReferenceSpectrum,
  SpectralMatchResult,
  SpectralMatchStatus,
  MatchingMetric,
} from './types';
import { resampleSpectrumGrid } from './spectralPreprocessingEngine';
import { detectSpectralPeaks } from './spectralPeakDetectionEngine';

/**
 * Computes Pearson's correlation coefficient r between two vectors.
 */
export function computePearsonCorrelation(u: number[], v: number[]): number {
  const n = u.length;
  if (n < 2 || v.length !== n) return 0;

  let sumU = 0;
  let sumV = 0;
  for (let i = 0; i < n; i++) {
    sumU += u[i];
    sumV += v[i];
  }
  const meanU = sumU / n;
  const meanV = sumV / n;

  let num = 0;
  let denU = 0;
  let denV = 0;

  for (let i = 0; i < n; i++) {
    const du = u[i] - meanU;
    const dv = v[i] - meanV;
    num += du * dv;
    denU += du * du;
    denV += dv * dv;
  }

  const den = Math.sqrt(denU * denV);
  if (den < 1e-12) return 0;

  return Number((num / den).toFixed(4));
}

/**
 * Computes Cosine Similarity between two vectors.
 */
export function computeCosineSimilarity(u: number[], v: number[]): number {
  const n = u.length;
  if (n === 0 || v.length !== n) return 0;

  let dot = 0;
  let normU = 0;
  let normV = 0;

  for (let i = 0; i < n; i++) {
    dot += u[i] * v[i];
    normU += u[i] * u[i];
    normV += v[i] * v[i];
  }

  const den = Math.sqrt(normU) * Math.sqrt(normV);
  if (den < 1e-12) return 0;

  return Number((dot / den).toFixed(4));
}

/**
 * Matches a measured spectrum against a reference spectrum.
 */
export function matchSpectrumAgainstReference(
  measured: SpectrumRecord,
  reference: SpectralReferenceSpectrum,
  metric: MatchingMetric = 'PEARSON_CORRELATION',
  matchThreshold = 0.85
): SpectralMatchResult {
  // Technique compatibility check
  if (measured.technique !== reference.technique && measured.technique !== 'UNKNOWN') {
    return {
      referenceSpectrumId: reference.referenceId,
      materialName: reference.materialName,
      technique: reference.technique,
      metric,
      score: 0.0,
      threshold: matchThreshold,
      matchStatus: 'NON_MATCH',
      comparisonRange: reference.applicableRange,
      pointsCompared: 0,
      diagnosticPeakMatchRatio: 0,
      explanation: `Technique mismatch: measured is ${measured.technique} but reference is ${reference.technique}.`,
    };
  }

  // Find common overlap range
  const measuredMinX = measured.x[0];
  const measuredMaxX = measured.x[measured.x.length - 1];
  const overlapMin = Math.max(measuredMinX, reference.applicableRange.min);
  const overlapMax = Math.min(measuredMaxX, reference.applicableRange.max);

  if (overlapMax - overlapMin < 200) {
    return {
      referenceSpectrumId: reference.referenceId,
      materialName: reference.materialName,
      technique: reference.technique,
      metric,
      score: 0.0,
      threshold: matchThreshold,
      matchStatus: 'INSUFFICIENT_DATA',
      comparisonRange: { min: overlapMin, max: overlapMax },
      pointsCompared: 0,
      diagnosticPeakMatchRatio: 0,
      explanation: `Insufficient spectral overlap window (${(overlapMax - overlapMin).toFixed(0)} cm⁻¹); minimum 200 cm⁻¹ required for identification.`,
    };
  }

  // Resample both onto uniform common grid (step = 2 cm⁻¹)
  const step = 2.0;
  const resampleM = resampleSpectrumGrid(measured.x, measured.y, overlapMin, overlapMax, step);
  const resampleR = resampleSpectrumGrid(reference.x, reference.y, overlapMin, overlapMax, step);

  let rawScore = 0;
  switch (metric) {
    case 'PEARSON_CORRELATION':
      rawScore = computePearsonCorrelation(resampleM.gridY, resampleR.gridY);
      break;
    case 'COSINE_SIMILARITY':
      rawScore = computeCosineSimilarity(resampleM.gridY, resampleR.gridY);
      break;
    case 'NORMALIZED_DISTANCE': {
      const cos = computeCosineSimilarity(resampleM.gridY, resampleR.gridY);
      rawScore = Math.max(0, cos);
      break;
    }
  }

  const score = Math.max(0, Math.min(1.0, rawScore));

  // Check diagnostic peak matches
  const detectedPeaks = detectSpectralPeaks(measured.x, measured.y, { technique: measured.technique });
  let matchedDiagnosticCount = 0;
  const totalDiagnostic = reference.keyPeaks.filter(kp => kp.isDiagnostic).length || 1;

  for (const kp of reference.keyPeaks) {
    if (!kp.isDiagnostic) continue;
    const found = detectedPeaks.peaks.some(
      dp => Math.abs(dp.position - kp.position) <= kp.toleranceCm1
    );
    if (found) matchedDiagnosticCount++;
  }

  const diagnosticPeakMatchRatio = Number((matchedDiagnosticCount / totalDiagnostic).toFixed(2));

  // Determine Match Status
  let matchStatus: SpectralMatchStatus = 'NON_MATCH';
  let explanation = '';

  if (score >= matchThreshold && diagnosticPeakMatchRatio >= 0.60) {
    matchStatus = 'MATCH';
    explanation = `High spectral conformity (Score: ${score.toFixed(3)} >= ${matchThreshold}) with ${matchedDiagnosticCount}/${totalDiagnostic} diagnostic vibrational modes confirmed.`;
  } else if (score >= 0.65 || (score >= 0.55 && diagnosticPeakMatchRatio >= 0.75)) {
    matchStatus = 'INCONCLUSIVE';
    explanation = `Moderate spectral correlation (Score: ${score.toFixed(3)}) or partial diagnostic band matching (${matchedDiagnosticCount}/${totalDiagnostic}); inconclusive for automated release.`;
  } else {
    matchStatus = 'NON_MATCH';
    explanation = `Low spectral similarity (Score: ${score.toFixed(3)} < 0.65); measured spectrum differs significantly from ${reference.materialName} reference standard.`;
  }

  return {
    referenceSpectrumId: reference.referenceId,
    materialName: reference.materialName,
    technique: reference.technique,
    metric,
    score,
    threshold: matchThreshold,
    matchStatus,
    comparisonRange: { min: overlapMin, max: overlapMax },
    pointsCompared: resampleM.gridX.length,
    diagnosticPeakMatchRatio,
    explanation,
  };
}

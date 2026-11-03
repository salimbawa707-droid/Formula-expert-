/**
 * ============================================================================
 * UNIFIED SPECTRAL PREPROCESSING PIPELINE
 * ============================================================================
 * 
 * Coordinates multi-stage scientific spectral conditioning:
 * Range Selection -> Baseline Correction -> Smoothing -> Normalization -> Resampling.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. Fully reproducible & auditable pipeline state.
 * 2. Original raw spectrum is NEVER mutated.
 * 3. Exact SHA-256 hashes generated for raw input vs processed output.
 * ============================================================================
 */

import {
  SpectrumRecord,
  PreprocessingPipelineConfig,
  PreprocessedSpectrumResult,
} from './types';
import { correctBaseline } from './baselineCorrectionEngine';
import { reduceSpectralNoise } from './spectralNoiseReductionEngine';
import { normalizeSpectrum } from './spectralNormalizationEngine';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export const DEFAULT_FTIR_PIPELINE: PreprocessingPipelineConfig = {
  rangeCrop: { min: 400, max: 4000 },
  baselineMethod: 'POLYNOMIAL',
  baselinePolyOrder: 2,
  smoothingMethod: 'SAVITZKY_GOLAY',
  smoothingWindowSize: 7,
  smoothingPolyOrder: 2,
  normalizationMethod: 'VECTOR',
};

export const DEFAULT_RAMAN_PIPELINE: PreprocessingPipelineConfig = {
  rangeCrop: { min: 100, max: 3500 },
  baselineMethod: 'RUBBERBAND',
  smoothingMethod: 'SAVITZKY_GOLAY',
  smoothingWindowSize: 9,
  smoothingPolyOrder: 2,
  normalizationMethod: 'VECTOR',
};

/**
 * Linearly resamples (x, y) onto a uniform grid [min, max] with specified step.
 */
export function resampleSpectrumGrid(
  x: number[],
  y: number[],
  min: number,
  max: number,
  step = 1.0
): { gridX: number[]; gridY: number[] } {
  const gridX: number[] = [];
  const gridY: number[] = [];

  const n = x.length;
  if (n < 2) return { gridX: [...x], gridY: [...y] };

  for (let targetX = min; targetX <= max; targetX += step) {
    gridX.push(Number(targetX.toFixed(2)));

    // Find bounding bracket in x array
    if (targetX <= x[0]) {
      gridY.push(y[0]);
    } else if (targetX >= x[n - 1]) {
      gridY.push(y[n - 1]);
    } else {
      // Binary search for bracket
      let low = 0;
      let high = n - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (x[mid] <= targetX) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      const idx0 = Math.max(0, high);
      const idx1 = Math.min(n - 1, idx0 + 1);

      const x0 = x[idx0];
      const x1 = x[idx1];
      const y0 = y[idx0];
      const y1 = y[idx1];

      const frac = x1 !== x0 ? (targetX - x0) / (x1 - x0) : 0;
      const interpY = y0 + frac * (y1 - y0);
      gridY.push(Number(interpY.toFixed(6)));
    }
  }

  return { gridX, gridY };
}

/**
 * Runs the complete scientific spectral preprocessing pipeline.
 */
export function runSpectralPreprocessing(
  rawSpectrum: SpectrumRecord,
  config?: Partial<PreprocessingPipelineConfig>
): PreprocessedSpectrumResult {
  const startTime = Date.now();

  const pipelineConfig: PreprocessingPipelineConfig = {
    ...(rawSpectrum.technique === 'RAMAN' ? DEFAULT_RAMAN_PIPELINE : DEFAULT_FTIR_PIPELINE),
    ...(config || {}),
  };

  let currentX = [...rawSpectrum.x];
  let currentY = [...rawSpectrum.y];

  // 1. Range Crop
  if (pipelineConfig.rangeCrop) {
    const minCrop = pipelineConfig.rangeCrop.min;
    const maxCrop = pipelineConfig.rangeCrop.max;

    const croppedIndices: number[] = [];
    for (let i = 0; i < currentX.length; i++) {
      if (currentX[i] >= minCrop && currentX[i] <= maxCrop) {
        croppedIndices.push(i);
      }
    }

    if (croppedIndices.length >= 10) {
      currentX = croppedIndices.map(i => currentX[i]);
      currentY = croppedIndices.map(i => currentY[i]);
    }
  }

  // 2. Baseline Correction
  const baselineResult = correctBaseline(currentX, currentY, pipelineConfig.baselineMethod, {
    polynomialOrder: pipelineConfig.baselinePolyOrder,
  });
  const baselineSubtractedY = baselineResult.correctedY;
  currentY = baselineSubtractedY;

  // 3. Smoothing / Noise Reduction
  const noiseResult = reduceSpectralNoise(currentY, pipelineConfig.smoothingMethod, {
    windowSize: pipelineConfig.smoothingWindowSize,
    polyOrder: pipelineConfig.smoothingPolyOrder,
  });
  currentY = noiseResult.smoothedY;

  // 4. Normalization
  const normResult = normalizeSpectrum(currentY, pipelineConfig.normalizationMethod, currentX);
  const normalizedY = normResult.normalizedY;
  currentY = normalizedY;

  // 5. Grid Resampling (if requested)
  if (pipelineConfig.gridResampling) {
    const resampled = resampleSpectrumGrid(
      currentX,
      currentY,
      pipelineConfig.gridResampling.min,
      pipelineConfig.gridResampling.max,
      pipelineConfig.gridResampling.step
    );
    currentX = resampled.gridX;
    currentY = resampled.gridY;
  }

  const processedDataPayload = currentX.map((x, i) => `${x.toFixed(2)}:${currentY[i].toFixed(6)}`).join('|');
  const processedHash = sha256(processedDataPayload);
  const executionTimeMs = Date.now() - startTime;

  const processedRecord: SpectrumRecord = {
    ...rawSpectrum,
    id: `PROC-${rawSpectrum.id}`,
    x: currentX,
    y: currentY,
    rawSpectrumHash: rawSpectrum.rawSpectrumHash,
    processedSpectrumHash: processedHash,
    isRaw: false,
    createdAt: new Date().toISOString(),
  };

  return {
    spectrum: processedRecord,
    pipelineConfig,
    rawHash: rawSpectrum.rawSpectrumHash,
    processedHash,
    processingVersion: '2.0.0',
    executionTimeMs,
    baselineSubtractedY,
    normalizedY,
  };
}

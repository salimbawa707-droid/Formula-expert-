/**
 * ============================================================================
 * SPECTROSCOPY NOISE REDUCTION & SMOOTHING ENGINE
 * ============================================================================
 * 
 * Implements conservative digital filtering for vibrational spectra:
 * 1. Savitzky-Golay Smoothing Filter (Polynomial convolution)
 * 2. Moving Average Filter
 * 3. Gaussian Kernel Smoothing
 * 
 * SCIENTIFIC CRITERIA:
 * - Preserves peak apex positions, area, and relative peak height ratios.
 * - Prevents over-smoothing that obliterates shoulder or minor diagnostic peaks.
 * ============================================================================
 */

import { SmoothingMethod } from './types';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface NoiseReductionResult {
  smoothedY: number[];
  method: SmoothingMethod;
  parameters: {
    windowSize: number;
    polyOrder?: number;
    sigma?: number;
  };
  inputHash: string;
  outputHash: string;
}

/**
 * Computes Savitzky-Golay convolution weights for zero-th derivative (smoothing).
 * Fits polynomial of degree 'order' over window of size 2m + 1.
 */
function getSavitzkyGolayWeights(windowSize: number, polyOrder: number): number[] {
  const m = Math.floor(windowSize / 2);
  const size = 2 * m + 1;
  const weights = new Array(size).fill(0);

  // Vandermonde design matrix J where J[i, k] = i^k for i in [-m, m]
  const p = polyOrder + 1;
  const J: number[][] = [];
  for (let i = -m; i <= m; i++) {
    const row: number[] = [];
    let val = 1;
    for (let k = 0; k < p; k++) {
      row.push(val);
      val *= i;
    }
    J.push(row);
  }

  // Gram matrix G = J^T * J
  const G: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let r = 0; r < p; r++) {
    for (let c = 0; c < p; c++) {
      let sum = 0;
      for (let i = 0; i < size; i++) {
        sum += J[i][r] * J[i][c];
      }
      G[r][c] = sum;
    }
  }

  // Invert G matrix (for p <= 5 using Gauss-Jordan)
  const invG: number[][] = Array.from({ length: p }, (_, r) =>
    Array.from({ length: p }, (_, c) => (r === c ? 1 : 0))
  );

  for (let i = 0; i < p; i++) {
    let pivot = G[i][i];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = 0; j < p; j++) {
      G[i][j] /= pivot;
      invG[i][j] /= pivot;
    }
    for (let k = 0; k < p; k++) {
      if (k === i) continue;
      const factor = G[k][i];
      for (let j = 0; j < p; j++) {
        G[k][j] -= factor * G[i][j];
      }
      for (let j = 0; j < p; j++) {
        invG[k][j] -= factor * invG[i][j];
      }
    }
  }

  // Convolution coefficients for center point: C = J * invG * [1, 0, 0, ...]
  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let k = 0; k < p; k++) {
      sum += J[i][k] * invG[k][0];
    }
    weights[i] = sum;
  }

  return weights;
}

/**
 * Executes Savitzky-Golay smoothing on Y array.
 */
function savitzkyGolaySmooth(y: number[], windowSize: number, polyOrder: number): number[] {
  const n = y.length;
  const m = Math.floor(windowSize / 2);
  if (n < windowSize || windowSize < 3) return [...y];

  const weights = getSavitzkyGolayWeights(windowSize, polyOrder);
  const out = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    let weightSum = 0;

    for (let j = -m; j <= m; j++) {
      const idx = Math.max(0, Math.min(n - 1, i + j));
      const w = weights[j + m];
      sum += y[idx] * w;
      weightSum += w;
    }

    out[i] = weightSum > 0 ? Number((sum / weightSum).toFixed(6)) : y[i];
  }

  return out;
}

/**
 * Standard Moving Average Filter.
 */
function movingAverageSmooth(y: number[], windowSize: number): number[] {
  const n = y.length;
  const m = Math.floor(windowSize / 2);
  const out = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let j = -m; j <= m; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < n) {
        sum += y[idx];
        count++;
      }
    }
    out[i] = count > 0 ? Number((sum / count).toFixed(6)) : y[i];
  }

  return out;
}

/**
 * Gaussian Kernel Smoothing.
 */
function gaussianSmooth(y: number[], windowSize: number, sigma = 1.5): number[] {
  const n = y.length;
  const m = Math.floor(windowSize / 2);
  const weights: number[] = [];
  let wSum = 0;

  for (let j = -m; j <= m; j++) {
    const w = Math.exp(-(j * j) / (2 * sigma * sigma));
    weights.push(w);
    wSum += w;
  }

  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let countW = 0;
    for (let j = -m; j <= m; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < n) {
        const w = weights[j + m];
        sum += y[idx] * w;
        countW += w;
      }
    }
    out[i] = countW > 0 ? Number((sum / countW).toFixed(6)) : y[i];
  }

  return out;
}

/**
 * Primary noise reduction entrypoint.
 */
export function reduceSpectralNoise(
  y: number[],
  method: SmoothingMethod = 'SAVITZKY_GOLAY',
  options: { windowSize?: number; polyOrder?: number; sigma?: number } = {}
): NoiseReductionResult {
  // Window size must be an odd positive integer >= 3
  let winSize = options.windowSize ?? 7;
  if (winSize % 2 === 0) winSize += 1;
  winSize = Math.max(3, Math.min(31, winSize));

  const polyOrder = Math.max(1, Math.min(4, options.polyOrder ?? 2));
  const sigma = options.sigma ?? 1.5;

  const inputHash = sha256(y.map(val => val.toFixed(6)).join('|'));
  let smoothedY: number[];

  switch (method) {
    case 'SAVITZKY_GOLAY':
      smoothedY = savitzkyGolaySmooth(y, winSize, polyOrder);
      break;
    case 'MOVING_AVERAGE':
      smoothedY = movingAverageSmooth(y, winSize);
      break;
    case 'GAUSSIAN':
      smoothedY = gaussianSmooth(y, winSize, sigma);
      break;
    case 'NONE':
    default:
      smoothedY = [...y];
      break;
  }

  const outputHash = sha256(smoothedY.map(val => val.toFixed(6)).join('|'));

  return {
    smoothedY,
    method,
    parameters: {
      windowSize: winSize,
      polyOrder: method === 'SAVITZKY_GOLAY' ? polyOrder : undefined,
      sigma: method === 'GAUSSIAN' ? sigma : undefined,
    },
    inputHash,
    outputHash,
  };
}

/**
 * ============================================================================
 * SPECTRAL NORMALIZATION ENGINE
 * ============================================================================
 * 
 * Standard spectroscopic normalization algorithms:
 * 1. Vector Normalization (Euclidean L2 norm)
 * 2. Area Normalization (Total integrated peak absorbance area)
 * 3. Standard Normal Variate (SNV)
 * 4. Min-Max Normalization (0.0 to 1.0 scaling)
 * 
 * SCIENTIFIC CRITERIA:
 * - Prevents sample optical path length and dilution discrepancies.
 * - Always records normalization method and scaling factor.
 * ============================================================================
 */

import { NormalizationMethod } from './types';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface NormalizationResult {
  normalizedY: number[];
  method: NormalizationMethod;
  scalingFactor: number;
  inputHash: string;
  outputHash: string;
}

export function normalizeSpectrum(
  y: number[],
  method: NormalizationMethod = 'VECTOR',
  x?: number[]
): NormalizationResult {
  const n = y.length;
  if (n === 0) {
    return {
      normalizedY: [],
      method,
      scalingFactor: 1.0,
      inputHash: sha256('empty'),
      outputHash: sha256('empty'),
    };
  }

  const inputHash = sha256(y.map(v => v.toFixed(6)).join('|'));
  let normalizedY: number[] = new Array(n).fill(0);
  let scalingFactor = 1.0;

  switch (method) {
    case 'VECTOR': {
      // Euclidean L2 Norm: sqrt(sum(y_i^2))
      const sumSq = y.reduce((acc, val) => acc + val * val, 0);
      const norm = Math.sqrt(sumSq);
      scalingFactor = norm > 1e-12 ? norm : 1.0;
      normalizedY = y.map(val => Number((val / scalingFactor).toFixed(6)));
      break;
    }

    case 'AREA': {
      // Trapezoidal Area Integration: sum(0.5 * (y[i] + y[i-1]) * dx)
      let totalArea = 0;
      if (x && x.length === n) {
        for (let i = 1; i < n; i++) {
          const dx = Math.abs(x[i] - x[i - 1]);
          totalArea += 0.5 * (Math.abs(y[i]) + Math.abs(y[i - 1])) * dx;
        }
      } else {
        totalArea = y.reduce((acc, val) => acc + Math.abs(val), 0);
      }
      scalingFactor = totalArea > 1e-12 ? totalArea : 1.0;
      normalizedY = y.map(val => Number((val / scalingFactor).toFixed(6)));
      break;
    }

    case 'SNV': {
      // Standard Normal Variate: (y - mean) / stdDev
      const mean = y.reduce((acc, val) => acc + val, 0) / n;
      const variance = y.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      scalingFactor = stdDev > 1e-12 ? stdDev : 1.0;
      normalizedY = y.map(val => Number(((val - mean) / scalingFactor).toFixed(6)));
      break;
    }

    case 'MIN_MAX': {
      // Scale min to 0.0, max to 1.0
      let yMin = Infinity;
      let yMax = -Infinity;
      for (let i = 0; i < n; i++) {
        if (y[i] < yMin) yMin = y[i];
        if (y[i] > yMax) yMax = y[i];
      }
      const range = yMax - yMin;
      scalingFactor = range > 1e-12 ? range : 1.0;
      normalizedY = y.map(val => Number(((val - yMin) / scalingFactor).toFixed(6)));
      break;
    }

    case 'NONE':
    default:
      normalizedY = [...y];
      scalingFactor = 1.0;
      break;
  }

  const outputHash = sha256(normalizedY.map(v => v.toFixed(6)).join('|'));

  return {
    normalizedY,
    method,
    scalingFactor,
    inputHash,
    outputHash,
  };
}

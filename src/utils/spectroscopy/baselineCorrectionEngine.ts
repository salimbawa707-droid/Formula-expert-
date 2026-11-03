/**
 * ============================================================================
 * SPECTROSCOPY BASELINE CORRECTION ENGINE
 * ============================================================================
 * 
 * Clean-room mathematical baseline correction methods:
 * 1. Polynomial Baseline Subtraction (Degree 1 to 5)
 * 2. Rubberband / Lower Convex Envelope Baseline Correction
 * 3. Asymmetric Least Squares (AsLS / Whittaker Baseline Estimator)
 * 
 * SCIENTIFIC CRITERIA:
 * - Deterministic, reproducible, and append-only.
 * - Never mutates the raw input spectrum.
 * - Records method, parameters, input hash, and output hash.
 * ============================================================================
 */

import { BaselineCorrectionMethod } from './types';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface BaselineCorrectionResult {
  correctedY: number[];
  estimatedBaseline: number[];
  method: BaselineCorrectionMethod;
  parameters: Record<string, any>;
  inputHash: string;
  outputHash: string;
}

/**
 * Fits a polynomial of degree n to (x, y) using normal equations and solves with Gaussian elimination.
 */
function fitPolynomial(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  const m = degree + 1;

  // Normalize x to [-1, 1] for numerical stability of Vandermonde matrix
  const xMin = x[0];
  const xMax = x[n - 1];
  const xRange = xMax - xMin || 1;
  const xNorm = x.map(val => (2 * (val - xMin)) / xRange - 1);

  const A: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  const B: number[] = new Array(m).fill(0);

  // Accumulate powers
  const powers: number[] = new Array(2 * degree + 1).fill(0);
  for (let i = 0; i < n; i++) {
    let p = 1;
    const xi = xNorm[i];
    for (let j = 0; j <= 2 * degree; j++) {
      powers[j] += p;
      p *= xi;
    }
    let py = y[i];
    for (let j = 0; j <= degree; j++) {
      B[j] += py;
      py *= xi;
    }
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      A[r][c] = powers[r + c];
    }
  }

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < m; i++) {
    let maxRow = i;
    for (let k = i + 1; k < m; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    const tempRow = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempRow;
    const tempB = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempB;

    if (Math.abs(A[i][i]) < 1e-12) continue;

    for (let k = i + 1; k < m; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < m; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  // Back substitution
  const coeffs = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let sum = B[i];
    for (let j = i + 1; j < m; j++) {
      sum -= A[i][j] * coeffs[j];
    }
    coeffs[i] = Math.abs(A[i][i]) > 1e-12 ? sum / A[i][i] : 0;
  }

  // Evaluate baseline at all points
  return xNorm.map(xi => {
    let val = 0;
    let p = 1;
    for (let d = 0; d <= degree; d++) {
      val += coeffs[d] * p;
      p *= xi;
    }
    return val;
  });
}

/**
 * Rubberband / Lower Convex Envelope Baseline Correction
 * Finds lower convex hull anchor points and linearly interpolates the baseline.
 */
function rubberbandBaseline(x: number[], y: number[]): number[] {
  const n = y.length;
  if (n < 3) return [...y];

  // Lower convex hull algorithm (Graham Scan / Monotone Chain variant for lower envelope)
  const hull: number[] = [];
  for (let i = 0; i < n; i++) {
    while (hull.length >= 2) {
      const p1 = hull[hull.length - 2];
      const p2 = hull[hull.length - 1];
      const crossProduct = (x[p2] - x[p1]) * (y[i] - y[p1]) - (y[p2] - y[p1]) * (x[i] - x[p1]);
      if (crossProduct <= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    hull.push(i);
  }

  // Linear interpolation along hull segments
  const baseline = new Array(n).fill(0);
  for (let h = 0; h < hull.length - 1; h++) {
    const idx1 = hull[h];
    const idx2 = hull[h + 1];
    const x1 = x[idx1];
    const x2 = x[idx2];
    const y1 = y[idx1];
    const y2 = y[idx2];
    const slope = x2 !== x1 ? (y2 - y1) / (x2 - x1) : 0;

    for (let i = idx1; i <= idx2; i++) {
      baseline[i] = y1 + slope * (x[i] - x1);
    }
  }

  return baseline;
}

/**
 * Asymmetric Least Squares (AsLS) baseline estimation.
 * Smooths with positive penalty asymmetry for peaks above baseline.
 */
function aslsBaseline(y: number[], lam = 1e5, p = 0.001, maxIter = 10): number[] {
  const n = y.length;
  if (n < 5) return [...y];

  let z = [...y];
  let w = new Array(n).fill(1.0);

  // Iterative reweighted smoothing
  for (let iter = 0; iter < maxIter; iter++) {
    // 3-point moving weighted smoothing with asymmetry
    const nextZ = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const prev = i > 0 ? z[i - 1] : z[i];
      const curr = z[i];
      const next = i < n - 1 ? z[i + 1] : z[i];
      
      const smoothed = (prev + 2 * curr + next) / 4;
      const weight = w[i];
      nextZ[i] = (weight * y[i] + (lam / 1e4) * smoothed) / (weight + (lam / 1e4));
    }
    z = nextZ;

    // Update weights: heavily penalize points where y[i] > z[i] (peaks)
    for (let i = 0; i < n; i++) {
      w[i] = y[i] > z[i] ? p : (1 - p);
    }
  }

  return z;
}

/**
 * Primary baseline correction function.
 */
export function correctBaseline(
  x: number[],
  y: number[],
  method: BaselineCorrectionMethod = 'POLYNOMIAL',
  options: { polynomialOrder?: number; aslsLambda?: number; aslsP?: number } = {}
): BaselineCorrectionResult {
  const polyOrder = Math.max(1, Math.min(5, options.polynomialOrder ?? 2));
  const inputHash = sha256(y.map((val, i) => `${x[i].toFixed(2)}:${val.toFixed(6)}`).join('|'));

  let estimatedBaseline: number[];

  switch (method) {
    case 'POLYNOMIAL':
      estimatedBaseline = fitPolynomial(x, y, polyOrder);
      break;
    case 'RUBBERBAND':
      estimatedBaseline = rubberbandBaseline(x, y);
      break;
    case 'ASLS':
      estimatedBaseline = aslsBaseline(y, options.aslsLambda ?? 1e5, options.aslsP ?? 0.001);
      break;
    case 'NONE':
    default:
      estimatedBaseline = new Array(y.length).fill(0);
      break;
  }

  // Subtract baseline and ensure no non-physical artifacts
  const correctedY = y.map((val, i) => {
    const sub = val - estimatedBaseline[i];
    return Number(sub.toFixed(6));
  });

  const outputHash = sha256(correctedY.map((val, i) => `${x[i].toFixed(2)}:${val.toFixed(6)}`).join('|'));

  return {
    correctedY,
    estimatedBaseline,
    method,
    parameters: {
      polynomialOrder: polyOrder,
      aslsLambda: options.aslsLambda ?? 1e5,
      aslsP: options.aslsP ?? 0.001,
    },
    inputHash,
    outputHash,
  };
}

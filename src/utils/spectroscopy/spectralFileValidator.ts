/**
 * ============================================================================
 * SPECTRAL DATA VALIDATOR & INTEGRITY ENGINE
 * ============================================================================
 * 
 * Verifies mathematical validity, physical reasonableness, and signal integrity
 * of raw analytical spectral data before preprocessing or matching.
 * 
 * ENFORCEMENT MANDATES:
 * 1. Strict Numerical Rigor: Rejects NaN, Infinity, and empty/mismatched arrays.
 * 2. Resolution & Density: Ensures sufficient analytical data points (>= 15 points).
 * 3. Unit Integrity: Validates technique and units without silent guessing.
 * ============================================================================
 */

import {
  SpectrumRecord,
  SpectralValidationResult,
  SpectralValidationStatus,
  SpectralTechnique,
} from './types';

export function validateRawSpectrumData(
  x: number[] | undefined | null,
  y: number[] | undefined | null,
  technique: SpectralTechnique = 'UNKNOWN',
  units?: { x?: string; y?: string }
): SpectralValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Array Existence & Length Check
  if (!x || !Array.isArray(x) || x.length === 0) {
    errors.push('Spectral X-axis (wavenumber/wavelength) array is empty or undefined.');
  }
  if (!y || !Array.isArray(y) || y.length === 0) {
    errors.push('Spectral Y-axis (intensity/absorbance) array is empty or undefined.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      status: 'INVALID_DATA',
      errors,
      warnings,
      pointCount: 0,
      xMin: 0,
      xMax: 0,
      yMin: 0,
      yMax: 0,
      meanResolution: 0,
      isMonotonic: false,
      hasDuplicates: false,
      hasNaNOrInf: false,
    };
  }

  const validX = x!;
  const validY = y!;

  if (validX.length !== validY.length) {
    errors.push(`Dimensional mismatch: X array length (${validX.length}) does not match Y array length (${validY.length}).`);
  }

  const pointCount = validX.length;

  // 2. Minimum Point Density
  if (pointCount < 15) {
    errors.push(`Insufficient spectral resolution: dataset contains only ${pointCount} points (minimum required: 15).`);
  }

  // 3. Finite Numbers / NaN / Infinity Check
  let hasNaNOrInf = false;
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let hasDuplicates = false;

  for (let i = 0; i < pointCount; i++) {
    const xi = validX[i];
    const yi = validY[i];

    if (!Number.isFinite(xi) || isNaN(xi)) {
      hasNaNOrInf = true;
      errors.push(`Invalid non-finite or NaN coordinate found in X-axis at index ${i}.`);
      break;
    }
    if (!Number.isFinite(yi) || isNaN(yi)) {
      hasNaNOrInf = true;
      errors.push(`Invalid non-finite or NaN coordinate found in Y-axis at index ${i}.`);
      break;
    }

    if (xi < xMin) xMin = xi;
    if (xi > xMax) xMax = xi;
    if (yi < yMin) yMin = yi;
    if (yi > yMax) yMax = yi;

    if (i > 0 && Math.abs(xi - validX[i - 1]) < 1e-9) {
      hasDuplicates = true;
    }
  }

  if (hasDuplicates) {
    warnings.push('Duplicate contiguous X-axis coordinates detected.');
  }

  // 4. Monotonicity & Resolution
  let isMonotonicIncreasing = true;
  let isMonotonicDecreasing = true;
  let deltaSum = 0;

  for (let i = 1; i < pointCount; i++) {
    const delta = validX[i] - validX[i - 1];
    deltaSum += Math.abs(delta);
    if (delta <= 0) isMonotonicIncreasing = false;
    if (delta >= 0) isMonotonicDecreasing = false;
  }

  const isMonotonic = isMonotonicIncreasing || isMonotonicDecreasing;
  const meanResolution = pointCount > 1 ? Number((deltaSum / (pointCount - 1)).toFixed(4)) : 0;

  if (!isMonotonic) {
    warnings.push('Spectral X-axis is not strictly monotonic; sorting will be applied before processing.');
  }

  // 5. Technique & Range Realism
  if (technique === 'FTIR') {
    if (xMin < 200 || xMax > 10000) {
      warnings.push(`FTIR wavenumber range [${xMin.toFixed(1)}, ${xMax.toFixed(1)} cm⁻¹] extends outside standard mid-IR region (400 - 4000 cm⁻¹).`);
    }
  } else if (technique === 'RAMAN') {
    if (xMin < 50 || xMax > 5000) {
      warnings.push(`Raman shift range [${xMin.toFixed(1)}, ${xMax.toFixed(1)} cm⁻¹] extends outside typical Raman fingerprint region (100 - 3500 cm⁻¹).`);
    }
  }

  // 6. Unit Awareness
  let status: SpectralValidationStatus = 'VALID';
  if (errors.length > 0) {
    status = pointCount < 15 ? 'INSUFFICIENT_DATA' : 'INVALID_DATA';
  } else if (!units || !units.x || units.x.trim() === '' || units.x.toLowerCase() === 'unknown') {
    warnings.push('X-axis units undefined or unverified; scientific claim restricted to UNIT_UNKNOWN.');
    status = 'UNIT_UNKNOWN';
  }

  return {
    isValid: errors.length === 0,
    status,
    errors,
    warnings,
    pointCount,
    xMin: isFinite(xMin) ? xMin : 0,
    xMax: isFinite(xMax) ? xMax : 0,
    yMin: isFinite(yMin) ? yMin : 0,
    yMax: isFinite(yMax) ? yMax : 0,
    meanResolution,
    isMonotonic,
    hasDuplicates,
    hasNaNOrInf,
  };
}

/**
 * Validates a complete SpectrumRecord object.
 */
export function validateSpectrumRecord(record: SpectrumRecord): SpectralValidationResult {
  return validateRawSpectrumData(record.x, record.y, record.technique, record.units);
}

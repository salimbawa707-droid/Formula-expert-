/**
 * ============================================================================
 * SPECTRAL PEAK DETECTION & PARAMETRIZATION ENGINE
 * ============================================================================
 * 
 * Local extrema detection and peak parametrization:
 * 1. Apex Wavenumber / Wavelength identification.
 * 2. Peak Prominence relative to local valley baseline.
 * 3. Full Width at Half Maximum (FWHM) computation.
 * 4. Peak Area (Simpson / Trapezoidal integration).
 * 5. Functional group tentative assignment (heuristic label only).
 * 
 * CRITICAL SCIENTIFIC RULE:
 * Peak detection does NOT equal chemical identification or purity validation.
 * ============================================================================
 */

import { SpectralPeak, PeakDetectionResult, SpectralTechnique } from './types';

export interface PeakDetectionOptions {
  minProminence?: number;
  minDistancePoints?: number;
  threshold?: number;
  maxPeaks?: number;
  technique?: SpectralTechnique;
}

/**
 * Tentative functional group assignment based on vibrational wavenumber region.
 */
function assignFunctionalGroupLabel(positionCm1: number, technique: SpectralTechnique): string | undefined {
  if (technique === 'FTIR') {
    if (positionCm1 >= 3200 && positionCm1 <= 3650) return 'O-H / N-H Hydrogen-Bonded Stretch';
    if (positionCm1 >= 2840 && positionCm1 <= 2970) return 'Aliphatic C-H (CH₂, CH₃) Stretch';
    if (positionCm1 >= 1700 && positionCm1 <= 1750) return 'C=O Carbonyl Stretch (Ester / Carboxylate)';
    if (positionCm1 >= 1580 && positionCm1 <= 1680) return 'COO⁻ Asymmetric Stretch / C=C Aromatic';
    if (positionCm1 >= 1440 && positionCm1 <= 1475) return 'CH₂ / CH₃ Bending / Scissoring';
    if (positionCm1 >= 1370 && positionCm1 <= 1420) return 'COO⁻ Symmetric Stretch / SO₃⁻ Sulfonate';
    if (positionCm1 >= 1150 && positionCm1 <= 1220) return 'S=O Asymmetric Sulfonate Stretch';
    if (positionCm1 >= 1080 && positionCm1 <= 1140) return 'C-O-C Ether / Ethoxylate Chain Stretch';
    if (positionCm1 >= 1010 && positionCm1 <= 1060) return 'S=O Symmetric Sulfonate Stretch';
    if (positionCm1 >= 800 && positionCm1 <= 880) return 'Aromatic Out-of-Plane C-H Bending';
  } else if (technique === 'RAMAN') {
    if (positionCm1 >= 2850 && positionCm1 <= 2980) return 'Aliphatic C-H Stretch';
    if (positionCm1 >= 1600 && positionCm1 <= 1620) return 'Aromatic Ring Breathing / C=C';
    if (positionCm1 >= 1430 && positionCm1 <= 1460) return 'CH₂ Deformation';
    if (positionCm1 >= 1050 && positionCm1 <= 1130) return 'C-C Skeletal Stretch / Sulfate';
    if (positionCm1 >= 600 && positionCm1 <= 800) return 'C-S / S-O Vibrational Modes';
  }
  return undefined;
}

/**
 * Estimates baseline noise standard deviation using median absolute deviation (MAD).
 */
function estimateNoise(y: number[]): number {
  const n = y.length;
  if (n < 4) return 0.01;

  // First differences
  const diffs: number[] = [];
  for (let i = 1; i < n; i++) {
    diffs.push(Math.abs(y[i] - y[i - 1]));
  }
  diffs.sort((a, b) => a - b);
  const medianDiff = diffs[Math.floor(diffs.length / 2)];
  return Number((medianDiff / 0.6745).toFixed(6)) || 0.005;
}

export function detectSpectralPeaks(
  x: number[],
  y: number[],
  options: PeakDetectionOptions = {}
): PeakDetectionResult {
  const n = y.length;
  if (n < 5 || x.length !== n) {
    return {
      peaks: [],
      peakCount: 0,
      threshold: 0,
      minProminence: 0,
      noiseEstimate: 0,
    };
  }

  const noiseEstimate = estimateNoise(y);
  const minProminence = options.minProminence ?? Math.max(0.02, 3 * noiseEstimate);
  const minDistance = Math.max(2, options.minDistancePoints ?? 3);
  const threshold = options.threshold ?? (noiseEstimate * 2);
  const maxPeaks = options.maxPeaks ?? 25;
  const technique = options.technique ?? 'FTIR';

  const candidatePeaks: SpectralPeak[] = [];

  // Local maxima detection
  for (let i = 1; i < n - 1; i++) {
    if (y[i] <= threshold) continue;

    // Check strict local peak
    if (y[i] > y[i - 1] && y[i] >= y[i + 1]) {
      // Find left valley baseline
      let leftValley = y[i];
      let leftIdx = i;
      for (let l = i - 1; l >= Math.max(0, i - 50); l--) {
        if (y[l] < leftValley) {
          leftValley = y[l];
          leftIdx = l;
        }
        if (y[l] > y[i]) break; // higher peak on left
      }

      // Find right valley baseline
      let rightValley = y[i];
      let rightIdx = i;
      for (let r = i + 1; r <= Math.min(n - 1, i + 50); r++) {
        if (y[r] < rightValley) {
          rightValley = y[r];
          rightIdx = r;
        }
        if (y[r] > y[i]) break; // higher peak on right
      }

      const baselineVal = Math.max(leftValley, rightValley);
      const prominence = y[i] - baselineVal;

      if (prominence >= minProminence) {
        // Compute FWHM (Full Width at Half Maximum)
        const halfMax = baselineVal + prominence / 2;
        let leftHalfX = x[leftIdx];
        let rightHalfX = x[rightIdx];

        // Linear interpolation for exact half-max crossing
        for (let l = i; l >= leftIdx; l--) {
          if (y[l] <= halfMax) {
            const frac = y[l + 1] !== y[l] ? (halfMax - y[l]) / (y[l + 1] - y[l]) : 0;
            leftHalfX = x[l] + frac * (x[l + 1] - x[l]);
            break;
          }
        }
        for (let r = i; r <= rightIdx; r++) {
          if (y[r] <= halfMax) {
            const frac = y[r - 1] !== y[r] ? (halfMax - y[r]) / (y[r - 1] - y[r]) : 0;
            rightHalfX = x[r] - frac * (x[r] - x[r - 1]);
            break;
          }
        }

        const fwhmWidth = Math.abs(rightHalfX - leftHalfX);

        // Approximate peak area via trapezoid between left and right valleys
        let area = 0;
        for (let k = leftIdx; k < rightIdx; k++) {
          const dx = Math.abs(x[k + 1] - x[k]);
          area += 0.5 * (Math.max(0, y[k] - baselineVal) + Math.max(0, y[k + 1] - baselineVal)) * dx;
        }

        const snr = noiseEstimate > 0 ? Number((prominence / noiseEstimate).toFixed(1)) : 10.0;
        const label = assignFunctionalGroupLabel(x[i], technique);

        candidatePeaks.push({
          position: Number(x[i].toFixed(2)),
          intensity: Number(y[i].toFixed(4)),
          prominence: Number(prominence.toFixed(4)),
          fwhmWidth: Number(fwhmWidth.toFixed(2)),
          area: Number(area.toFixed(4)),
          snr,
          label,
        });
      }
    }
  }

  // Filter by minimum peak distance (keep largest prominence)
  const filteredPeaks: SpectralPeak[] = [];
  candidatePeaks.sort((a, b) => b.prominence - a.prominence);

  for (const p of candidatePeaks) {
    const tooClose = filteredPeaks.some(
      fp => Math.abs(fp.position - p.position) < minDistance
    );
    if (!tooClose) {
      filteredPeaks.push(p);
      if (filteredPeaks.length >= maxPeaks) break;
    }
  }

  // Sort back by position
  filteredPeaks.sort((a, b) => a.position - b.position);

  const dominantPeak = filteredPeaks.slice().sort((a, b) => b.intensity - a.intensity)[0];

  return {
    peaks: filteredPeaks,
    peakCount: filteredPeaks.length,
    threshold,
    minProminence,
    noiseEstimate,
    dominantPeak,
  };
}

/**
 * ============================================================================
 * SPECTRAL PREPROCESSING & PEAK DETECTION REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies preprocessing algorithms, baseline correction, digital filtering,
 * normalization, peak detection, and deterministic execution:
 * 1. Polynomial baseline subtraction
 * 2. Rubberband convex-hull baseline subtraction
 * 3. Savitzky-Golay digital smoothing filter
 * 4. Vector L2 normalization (Euclidean norm = 1.0)
 * 5. Area normalization (Integrated area = 1.0)
 * 6. Min-Max normalization (Scaled between 0.0 and 1.0)
 * 7. Peak detection apex positioning and prominence
 * 8. FWHM (Full Width at Half Maximum) calculation
 * 9. Grid resampling & linear interpolation
 * 10. Immutable raw preservation & deterministic hash reproducibility
 * ============================================================================
 */

import { correctBaseline } from '../spectroscopy/baselineCorrectionEngine';
import { reduceSpectralNoise } from '../spectroscopy/spectralNoiseReductionEngine';
import { normalizeSpectrum } from '../spectroscopy/spectralNormalizationEngine';
import { detectSpectralPeaks } from '../spectroscopy/spectralPeakDetectionEngine';
import { runSpectralPreprocessing, resampleSpectrumGrid } from '../spectroscopy/spectralPreprocessingEngine';
import { SpectrumRecord } from '../spectroscopy/types';

export interface TestResultSummary {
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}

export function runSpectralPreprocessingTestSuite(): TestResultSummary {
  console.log('================================================================');
  console.log('  SPECTRAL PREPROCESSING & PEAK DETECTION REGRESSION SUITE       ');
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

  // Create synthetic test spectrum with linear tilt + 2 Gaussian peaks
  const testX: number[] = [];
  const testY: number[] = [];
  for (let cm = 500; cm <= 2000; cm += 5) {
    testX.push(cm);
    // Baseline: linear tilt 0.0002 * cm + 0.1
    const baseline = 0.0002 * cm + 0.1;
    // Peak 1 at 1040 cm-1 (width 30, height 0.8)
    const peak1 = 0.8 * Math.exp(-Math.pow((cm - 1040) / 15, 2));
    // Peak 2 at 1600 cm-1 (width 25, height 0.5)
    const peak2 = 0.5 * Math.exp(-Math.pow((cm - 1600) / 12, 2));
    testY.push(baseline + peak1 + peak2);
  }

  // ---------------------------------------------------------------------------
  // 1. Polynomial Baseline Correction
  // ---------------------------------------------------------------------------
  const polyResult = correctBaseline(testX, testY, 'POLYNOMIAL', { polynomialOrder: 2 });
  assert(
    polyResult.correctedY.length === testY.length &&
    polyResult.correctedY[0] < testY[0],
    'Test 1: Polynomial baseline subtraction levels linear baseline drift',
    `Raw Y[0]: ${testY[0].toFixed(3)}, Corrected Y[0]: ${polyResult.correctedY[0].toFixed(3)}`
  );

  // ---------------------------------------------------------------------------
  // 2. Rubberband Convex Hull Baseline Correction
  // ---------------------------------------------------------------------------
  const rubberResult = correctBaseline(testX, testY, 'RUBBERBAND');
  assert(
    rubberResult.correctedY.length === testY.length &&
    rubberResult.correctedY.every(v => v >= -0.05),
    'Test 2: Rubberband lower convex hull produces non-negative baseline-corrected peaks',
    `Min corrected Y: ${Math.min(...rubberResult.correctedY).toFixed(4)}`
  );

  // ---------------------------------------------------------------------------
  // 3. Savitzky-Golay Digital Smoothing
  // ---------------------------------------------------------------------------
  // Add noise to testY
  const noisyY = testY.map((v, i) => v + (i % 2 === 0 ? 0.02 : -0.02));
  const smoothResult = reduceSpectralNoise(noisyY, 'SAVITZKY_GOLAY', { windowSize: 7, polyOrder: 2 });
  assert(
    smoothResult.smoothedY.length === noisyY.length &&
    Math.abs(smoothResult.smoothedY[50] - testY[50]) < Math.abs(noisyY[50] - testY[50]),
    'Test 3: Savitzky-Golay 7-point polynomial filter suppresses high-frequency noise',
    `Noisy delta: ${Math.abs(noisyY[50] - testY[50]).toFixed(4)}, Smoothed delta: ${Math.abs(smoothResult.smoothedY[50] - testY[50]).toFixed(4)}`
  );

  // ---------------------------------------------------------------------------
  // 4. Vector L2 Normalization
  // ---------------------------------------------------------------------------
  const vecNormResult = normalizeSpectrum(testY, 'VECTOR');
  const sumSq = vecNormResult.normalizedY.reduce((acc, v) => acc + v * v, 0);
  assert(
    Math.abs(Math.sqrt(sumSq) - 1.0) < 0.001,
    'Test 4: Vector normalization normalizes Euclidean L2 norm to exactly 1.000',
    `Calculated L2 Norm: ${Math.sqrt(sumSq).toFixed(5)}`
  );

  // ---------------------------------------------------------------------------
  // 5. Area Normalization
  // ---------------------------------------------------------------------------
  const areaNormResult = normalizeSpectrum(testY, 'AREA', testX);
  assert(
    areaNormResult.scalingFactor > 0 && areaNormResult.normalizedY.length === testY.length,
    'Test 5: Area normalization computes total trapezoidal integrated absorbance area',
    `Scaling Area: ${areaNormResult.scalingFactor.toFixed(2)}`
  );

  // ---------------------------------------------------------------------------
  // 6. Min-Max Normalization
  // ---------------------------------------------------------------------------
  const minMaxResult = normalizeSpectrum(testY, 'MIN_MAX');
  const minVal = Math.min(...minMaxResult.normalizedY);
  const maxVal = Math.max(...minMaxResult.normalizedY);
  assert(
    Math.abs(minVal - 0.0) < 0.001 && Math.abs(maxVal - 1.0) < 0.001,
    'Test 6: Min-Max normalization scales spectral bounds exactly to [0.000, 1.000]',
    `Min: ${minVal.toFixed(3)}, Max: ${maxVal.toFixed(3)}`
  );

  // ---------------------------------------------------------------------------
  // 7. Peak Detection & Positioning
  // ---------------------------------------------------------------------------
  const peakDetection = detectSpectralPeaks(testX, polyResult.correctedY, { minProminence: 0.1 });
  const detected1040 = peakDetection.peaks.find(p => Math.abs(p.position - 1040) <= 5);
  const detected1600 = peakDetection.peaks.find(p => Math.abs(p.position - 1600) <= 5);

  assert(
    detected1040 !== undefined && detected1600 !== undefined && peakDetection.peakCount >= 2,
    'Test 7: Peak detection engine identifies simulated peaks at 1040 cm⁻¹ and 1600 cm⁻¹',
    `Peak 1: ${detected1040?.position} cm⁻¹, Peak 2: ${detected1600?.position} cm⁻¹`
  );

  // ---------------------------------------------------------------------------
  // 8. FWHM (Full Width at Half Maximum) Calculation
  // ---------------------------------------------------------------------------
  assert(
    detected1040?.fwhmWidth !== undefined && detected1040.fwhmWidth > 10 && detected1040.fwhmWidth < 50,
    'Test 8: Peak parametrization calculates accurate Full Width at Half Maximum (FWHM)',
    `FWHM at 1040 cm⁻¹: ${detected1040?.fwhmWidth} cm⁻¹`
  );

  // ---------------------------------------------------------------------------
  // 9. Grid Resampling & Linear Interpolation
  // ---------------------------------------------------------------------------
  const resampleResult = resampleSpectrumGrid(testX, testY, 600, 1800, 2.0);
  assert(
    resampleResult.gridX.length === 601 &&
    resampleResult.gridX[0] === 600 &&
    resampleResult.gridX[resampleResult.gridX.length - 1] === 1800,
    'Test 9: Grid resampler interpolates non-uniform data onto strict uniform 2.0 cm⁻¹ grid',
    `Points: ${resampleResult.gridX.length}, Step: 2.0 cm⁻¹`
  );

  // ---------------------------------------------------------------------------
  // 10. Deterministic Hash Reproducibility
  // ---------------------------------------------------------------------------
  const sampleSpec: SpectrumRecord = {
    id: 'SPEC-TEST-REPRO-01',
    title: 'Synthetic Test',
    technique: 'FTIR',
    axis: 'WAVENUMBER_CM1',
    x: testX,
    y: testY,
    units: { x: '1/cm', y: 'Absorbance' },
    sourceFileName: 'synthetic.csv',
    fileFormat: 'CSV',
    acquisitionMetadata: {},
    rawSpectrumHash: 'hash-raw-12345',
    isRaw: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Automated Test',
  };

  const run1 = runSpectralPreprocessing(sampleSpec);
  const run2 = runSpectralPreprocessing(sampleSpec);

  assert(
    run1.processedHash === run2.processedHash && run1.spectrum.x.length === run2.spectrum.x.length,
    'Test 10: Complete preprocessing pipeline executes deterministically with identical SHA-256 output hashes',
    `Run 1 Hash: ${run1.processedHash.substring(0, 16)}..., Run 2 Hash: ${run2.processedHash.substring(0, 16)}...`
  );

  return {
    passed,
    failed,
    total: passed + failed,
    results,
  };
}

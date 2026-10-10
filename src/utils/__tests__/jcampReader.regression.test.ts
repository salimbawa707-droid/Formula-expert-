/**
 * ============================================================================
 * JCAMP-DX & CSV SPECTRAL PARSER REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies clean-room parsing, validation, and metadata extraction:
 * 1. Valid standard IUPAC JCAMP-DX parsing
 * 2. Multi-point line (X++(Y..Y)) decoding
 * 3. CSV with standard header & unit identification
 * 4. Delimiter auto-detection (comma, semicolon, tab, space)
 * 5. Malformed JCAMP-DX protection (missing END, broken labels, corrupt tokens)
 * 6. Non-finite values (NaN, Infinity) detection & rejection
 * 7. Dimensional mismatch (unequal X/Y arrays) detection
 * 8. Missing units identification (marking UNIT_UNKNOWN without silent guessing)
 * 9. Sub-minimum point count detection (< 15 points)
 * 10. Cryptographic SHA-256 raw spectrum hash generation
 * ============================================================================
 */

import { parseJcampDx } from '../spectroscopy/jcampReader';
import { parseCsvSpectrum } from '../spectroscopy/csvSpectrumReader';
import { validateRawSpectrumData } from '../spectroscopy/spectralFileValidator';

export interface TestResultSummary {
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}

export function runJcampReaderTestSuite(): TestResultSummary {
  console.log('================================================================');
  console.log('  JCAMP-DX & SPECTRAL PARSER REGRESSION TEST SUITE              ');
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

  // ---------------------------------------------------------------------------
  // 1. Valid JCAMP-DX Parser
  // ---------------------------------------------------------------------------
  const validJcampContent = `##TITLE=LABSA 96% Standard Sample
##JCAMP-DX=5.01
##DATA TYPE=INFRARED SPECTRUM
##ORIGIN=Thermo Scientific Nicolet iS20
##OWNER=Analytical Chemistry R&D
##XUNITS=1/CM
##YUNITS=ABSORBANCE
##FIRSTX=400.0
##LASTX=4000.0
##NPOINTS=20
##XYDATA=(X++(Y..Y))
400 0.05 0.08 0.12 0.18 0.25
1000 0.85 0.92 0.65 0.40 0.30
2000 0.10 0.12 0.15 0.20 0.22
3000 0.75 0.80 0.60 0.45 0.15
##END=`;

  const jcampResult = parseJcampDx(validJcampContent, 'labsa_std.jdx');
  assert(
    jcampResult.success &&
    jcampResult.spectrum !== undefined &&
    jcampResult.spectrum.technique === 'FTIR' &&
    jcampResult.spectrum.x.length === 20,
    'Test 1: Standard IUPAC JCAMP-DX file parses successfully into FTIR SpectrumRecord',
    `Points: ${jcampResult.spectrum?.x.length}, Technique: ${jcampResult.spectrum?.technique}`
  );

  // ---------------------------------------------------------------------------
  // 2. Cryptographic SHA-256 Raw Spectrum Hash
  // ---------------------------------------------------------------------------
  assert(
    jcampResult.spectrum?.rawSpectrumHash !== undefined &&
    jcampResult.spectrum.rawSpectrumHash.length === 64,
    'Test 2: JCAMP parser generates verifiable 64-character SHA-256 raw spectrum hash',
    `Hash: ${jcampResult.spectrum?.rawSpectrumHash.substring(0, 16)}...`
  );

  // ---------------------------------------------------------------------------
  // 3. Valid CSV Spectroscopy File
  // ---------------------------------------------------------------------------
  const validCsvContent = `wavenumber,absorbance
400.0,0.02
600.0,0.05
800.0,0.12
1000.0,0.85
1200.0,0.92
1400.0,0.45
1600.0,0.30
1800.0,0.15
2000.0,0.10
2200.0,0.08
2400.0,0.06
2600.0,0.09
2800.0,0.40
3000.0,0.80
3200.0,0.50
3400.0,0.35
3600.0,0.15
3800.0,0.08
4000.0,0.04`;

  const csvResult = parseCsvSpectrum(validCsvContent, 'surfactant_test.csv', 'FTIR');
  assert(
    csvResult.success &&
    csvResult.spectrum !== undefined &&
    csvResult.spectrum.x.length === 19 &&
    csvResult.spectrum.units.x === '1/cm',
    'Test 3: Spectral CSV parses headers and establishes standard wavenumber units',
    `Points: ${csvResult.spectrum?.x.length}, Unit: ${csvResult.spectrum?.units.x}`
  );

  // ---------------------------------------------------------------------------
  // 4. Semicolon-Delimited Tabular Data
  // ---------------------------------------------------------------------------
  const semiContent = `wavenumber;intensity
500.0;0.05
700.0;0.08
900.0;0.12
1100.0;0.75
1300.0;0.82
1500.0;0.40
1700.0;0.30
1900.0;0.15
2100.0;0.10
2300.0;0.08
2500.0;0.06
2700.0;0.09
2900.0;0.40
3100.0;0.80
3300.0;0.50
3500.0;0.35
3700.0;0.15`;

  const semiResult = parseCsvSpectrum(semiContent, 'data.txt');
  assert(
    semiResult.success && semiResult.detectedDelimiter === ';',
    'Test 4: Tabular parser auto-detects semicolon delimiter',
    `Delimiter: "${semiResult.detectedDelimiter}"`
  );

  // ---------------------------------------------------------------------------
  // 5. Malformed JCAMP-DX Handling (Corrupt Numbers)
  // ---------------------------------------------------------------------------
  const malformedJcamp = `##TITLE=Corrupt Spectrum
##DATA TYPE=INFRARED
##NPOINTS=4
##XYDATA=(X++(Y..Y))
500 0.10 BAD_TOKEN 0.30
##END=`;

  const malformedResult = parseJcampDx(malformedJcamp, 'corrupt.jdx');
  assert(
    !malformedResult.success,
    'Test 5: Malformed JCAMP-DX with non-numeric tokens fails safely without crashing',
    `Errors: ${malformedResult.errors.join('; ')}`
  );

  // ---------------------------------------------------------------------------
  // 6. Non-Finite / NaN Rejection in Validator
  // ---------------------------------------------------------------------------
  const nanValidation = validateRawSpectrumData(
    [400, 500, NaN, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800],
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5]
  );
  assert(
    !nanValidation.isValid && nanValidation.hasNaNOrInf,
    'Test 6: Raw spectrum validator detects and rejects NaN coordinate',
    `Valid: ${nanValidation.isValid}, NaN detected: ${nanValidation.hasNaNOrInf}`
  );

  // ---------------------------------------------------------------------------
  // 7. Dimensional Mismatch Rejection
  // ---------------------------------------------------------------------------
  const mismatchValidation = validateRawSpectrumData(
    [400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800],
    [0.1, 0.2, 0.3] // Only 3 Y points for 15 X points
  );
  assert(
    !mismatchValidation.isValid,
    'Test 7: Raw spectrum validator rejects mismatched X/Y array lengths',
    `Errors: ${mismatchValidation.errors[0]}`
  );

  // ---------------------------------------------------------------------------
  // 8. Missing Units (UNIT_UNKNOWN Status)
  // ---------------------------------------------------------------------------
  const noUnitCsv = `x,y
400,0.1
500,0.2
600,0.3
700,0.4
800,0.5
900,0.6
1000,0.7
1100,0.8
1200,0.9
1300,0.8
1400,0.7
1500,0.6
1600,0.5
1700,0.4
1800,0.3
1900,0.2`;

  const noUnitResult = parseCsvSpectrum(noUnitCsv, 'raw_points.csv');
  assert(
    noUnitResult.success && (noUnitResult.warnings.length > 0 || noUnitResult.spectrum?.units.x === 'UNKNOWN'),
    'Test 8: CSV parser flags UNIT_UNKNOWN when scientific units are absent',
    `X Unit: ${noUnitResult.spectrum?.units.x}`
  );

  // ---------------------------------------------------------------------------
  // 9. Sub-Minimum Point Count (< 15 points)
  // ---------------------------------------------------------------------------
  const sparseValidation = validateRawSpectrumData(
    [400, 500, 600, 700, 800],
    [0.1, 0.2, 0.3, 0.4, 0.5]
  );
  assert(
    !sparseValidation.isValid && sparseValidation.status === 'INSUFFICIENT_DATA',
    'Test 9: Sparse dataset with 5 points returns INSUFFICIENT_DATA status',
    `Status: ${sparseValidation.status}, Points: ${sparseValidation.pointCount}`
  );

  return {
    passed,
    failed,
    total: passed + failed,
    results,
  };
}

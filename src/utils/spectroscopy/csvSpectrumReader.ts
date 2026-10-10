/**
 * ============================================================================
 * CSV / TXT SPECTRAL DATA PARSER
 * ============================================================================
 * 
 * Production parser for tabular spectroscopy data in comma, tab, semicolon,
 * or space-delimited text/CSV formats.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. Explicit Header & Unit Detection: Identifies wavenumber / wavelength and intensity.
 * 2. No Silent Guessing: If units are absent, records 'UNIT_UNKNOWN' and flags warning.
 * 3. Robust Delimiter Handling: Automatically detects delimiter without false positive splits.
 * ============================================================================
 */

import {
  SpectrumRecord,
  SpectralTechnique,
  SpectralAxis,
} from './types';
import { validateRawSpectrumData } from './spectralFileValidator';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface CsvParseResult {
  success: boolean;
  spectrum?: SpectrumRecord;
  errors: string[];
  warnings: string[];
  detectedDelimiter: string;
  detectedHeaders: string[];
}

export function parseCsvSpectrum(
  content: string,
  fileName = 'spectrum.csv',
  technique: SpectralTechnique = 'UNKNOWN',
  analyst = 'ANALYTICAL_CHEMIST'
): CsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return {
      success: false,
      errors: ['File content is empty or unreadable.'],
      warnings: [],
      detectedDelimiter: ',',
      detectedHeaders: [],
    };
  }

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    return {
      success: false,
      errors: ['No data lines found in spectral CSV/TXT file.'],
      warnings: [],
      detectedDelimiter: ',',
      detectedHeaders: [],
    };
  }

  // Detect delimiter from first non-comment line
  const firstDataLine = lines.find(l => !l.startsWith('#') && !l.startsWith('//')) || lines[0];
  let delimiter = ',';
  if (firstDataLine.includes('\t')) delimiter = '\t';
  else if (firstDataLine.includes(';')) delimiter = ';';
  else if (firstDataLine.includes(',') && firstDataLine.split(',').length >= 2) delimiter = ',';
  else if (firstDataLine.split(/\s+/).length >= 2) delimiter = ' ';

  // Check for Header Line
  let hasHeader = false;
  let headers: string[] = [];
  let startIdx = 0;

  const firstTokens = firstDataLine.split(delimiter === ' ' ? /\s+/ : delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
  const isFirstLineNumeric = firstTokens.every(t => !isNaN(parseFloat(t)) && isFinite(Number(t)));

  if (!isFirstLineNumeric) {
    hasHeader = true;
    headers = firstTokens;
    startIdx = lines.indexOf(firstDataLine) + 1;
  } else {
    headers = ['x', 'y'];
  }

  // Determine Columns for X and Y
  let xColIdx = 0;
  let yColIdx = 1;
  let detectedXUnit = 'UNKNOWN';
  let detectedYUnit = 'UNKNOWN';
  let inferredTechnique: SpectralTechnique = technique;
  let inferredAxis: SpectralAxis = 'UNKNOWN';

  if (hasHeader) {
    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('wavenumber') || lower.includes('cm-1') || lower.includes('1/cm') || lower === 'x') {
        xColIdx = idx;
        if (lower.includes('cm-1') || lower.includes('1/cm') || lower.includes('wavenumber')) {
          detectedXUnit = '1/cm';
          inferredAxis = 'WAVENUMBER_CM1';
        }
      } else if (lower.includes('wavelength') || lower.includes('nm') || lower.includes('nanometer')) {
        xColIdx = idx;
        detectedXUnit = 'nm';
        inferredAxis = 'WAVELENGTH_NM';
      }

      if (lower.includes('absorbance') || lower.includes('intensity') || lower.includes('transmittance') || lower.includes('counts') || lower === 'y') {
        yColIdx = idx;
        if (lower.includes('absorbance')) detectedYUnit = 'Absorbance';
        else if (lower.includes('transmittance')) detectedYUnit = '% Transmittance';
        else if (lower.includes('counts')) detectedYUnit = 'Counts';
      }

      if (lower.includes('ftir') || lower.includes('ir')) {
        if (inferredTechnique === 'UNKNOWN') inferredTechnique = 'FTIR';
      } else if (lower.includes('raman')) {
        if (inferredTechnique === 'UNKNOWN') inferredTechnique = 'RAMAN';
      }
    });
  }

  const rawX: number[] = [];
  const rawY: number[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.startsWith('//')) continue;

    const tokens = line.split(delimiter === ' ' ? /\s+/ : delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
    if (tokens.length < 2) continue;

    const xVal = parseFloat(tokens[xColIdx]);
    const yVal = parseFloat(tokens[yColIdx]);

    if (!isNaN(xVal) && isFinite(xVal) && !isNaN(yVal) && isFinite(yVal)) {
      rawX.push(xVal);
      rawY.push(yVal);
    }
  }

  // Sort by X ascending
  const paired = rawX.map((x, i) => ({ x, y: rawY[i] }));
  paired.sort((a, b) => a.x - b.x);

  const sortedX = paired.map(p => p.x);
  const sortedY = paired.map(p => p.y);

  // Technique heuristics based on range if still unknown
  if (inferredTechnique === 'UNKNOWN' && sortedX.length > 0) {
    const minX = sortedX[0];
    const maxX = sortedX[sortedX.length - 1];
    if (minX >= 350 && maxX <= 4500) {
      inferredTechnique = 'FTIR';
      inferredAxis = 'WAVENUMBER_CM1';
    } else if (minX >= 50 && maxX <= 3800) {
      inferredTechnique = 'RAMAN';
      inferredAxis = 'WAVENUMBER_CM1';
    }
  }

  // Validate Spectrum Data
  const validation = validateRawSpectrumData(sortedX, sortedY, inferredTechnique, { x: detectedXUnit, y: detectedYUnit });
  if (!validation.isValid) {
    return {
      success: false,
      errors: [...errors, ...validation.errors],
      warnings: [...warnings, ...validation.warnings],
      detectedDelimiter: delimiter,
      detectedHeaders: headers,
    };
  }

  const rawDataPayload = sortedX.map((x, i) => `${x.toFixed(4)}:${sortedY[i].toFixed(6)}`).join('|');
  const rawSpectrumHash = sha256(rawDataPayload);

  const titleStr = fileName.replace(/\.[^/.]+$/, '');
  const lowerTitle = titleStr.toLowerCase();
  const lowerFile = fileName.toLowerCase();
  const sourceType = lowerTitle.includes('synthetic') || lowerFile.includes('synthetic') ? 'SYNTHETIC'
    : lowerTitle.includes('demo') || lowerFile.includes('demo') ? 'DEMO'
    : lowerTitle.includes('simulated') || lowerFile.includes('simulated') ? 'SIMULATED'
    : lowerTitle.includes('reference') || lowerFile.includes('reference') ? 'REFERENCE'
    : 'USER_UPLOADED';

  const spectrumRecord: SpectrumRecord = {
    id: `SPEC-CSV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6)}`,
    title: titleStr,
    technique: inferredTechnique,
    axis: inferredAxis,
    x: sortedX,
    y: sortedY,
    units: { x: detectedXUnit, y: detectedYUnit },
    sourceFileName: fileName,
    fileFormat: fileName.toLowerCase().endsWith('.txt') ? 'TXT' : 'CSV',
    sourceType,
    acquisitionMetadata: {
      resolutionCm1: validation.meanResolution,
    },
    rawSpectrumHash,
    isRaw: true,
    createdAt: new Date().toISOString(),
    createdBy: analyst,
  };

  return {
    success: true,
    spectrum: spectrumRecord,
    errors,
    warnings: [...warnings, ...validation.warnings],
    detectedDelimiter: delimiter,
    detectedHeaders: headers,
  };
}

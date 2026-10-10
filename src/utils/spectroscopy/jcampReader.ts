/**
 * ============================================================================
 * JCAMP-DX SPECTRAL FILE PARSER (CLEAN-ROOM IMPLEMENTATION)
 * ============================================================================
 * 
 * Independent TypeScript parser for the IUPAC JCAMP-DX standard spectroscopic
 * file format (Joint Committee on Atomic and Molecular Physical Data Exchange).
 * 
 * SUPPORTS:
 * 1. Metadata extraction: TITLE, DATA TYPE, ORIGIN, OWNER, XUNITS, YUNITS, FIRSTX, LASTX, NPOINTS.
 * 2. Data formats: (X++(Y..Y)), (XY..XY), standard whitespace/comma delimited XY table blocks.
 * 3. Safe error handling: Malformed records return structured errors without crashing.
 * ============================================================================
 */

import {
  SpectrumRecord,
  SpectralTechnique,
  SpectralAxis,
} from './types';
import { validateRawSpectrumData } from './spectralFileValidator';
import { sha256 } from '../specificationEngine/releaseGateEngine';

export interface JcampParseResult {
  success: boolean;
  spectrum?: SpectrumRecord;
  errors: string[];
  warnings: string[];
  metadata: Record<string, string>;
}

export function parseJcampDx(
  fileContent: string,
  fileName = 'spectrum.jdx',
  analyst = 'ANALYTICAL_CHEMIST'
): JcampParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, string> = {};

  if (!fileContent || typeof fileContent !== 'string' || fileContent.trim().length === 0) {
    return {
      success: false,
      errors: ['JCAMP-DX file content is empty or unreadable.'],
      warnings: [],
      metadata: {},
    };
  }

  const lines = fileContent.split(/\r?\n/);
  let title = 'Untitled Spectrum';
  let dataType = 'INFRARED SPECTRUM';
  let xUnits = '1/CM';
  let yUnits = 'TRANSMITTANCE';
  let firstX: number | undefined;
  let lastX: number | undefined;
  let nPoints: number | undefined;
  let inDataBlock = false;
  let dataBlockFormat = '';

  const rawX: number[] = [];
  const rawY: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Handle JCAMP Header Labels (starting with ##)
    if (rawLine.startsWith('##')) {
      const equalsIdx = rawLine.indexOf('=');
      if (equalsIdx !== -1) {
        const label = rawLine.substring(2, equalsIdx).trim().toUpperCase();
        const value = rawLine.substring(equalsIdx + 1).trim();

        metadata[label] = value;

        if (label === 'TITLE') title = value;
        else if (label === 'DATA TYPE') dataType = value;
        else if (label === 'XUNITS') xUnits = value;
        else if (label === 'YUNITS') yUnits = value;
        else if (label === 'FIRSTX') firstX = parseFloat(value);
        else if (label === 'LASTX') lastX = parseFloat(value);
        else if (label === 'NPOINTS') nPoints = parseInt(value, 10);
        else if (label.startsWith('XYDATA') || label.startsWith('PEAK TABLE')) {
          inDataBlock = true;
          dataBlockFormat = value;
          continue;
        } else if (label === 'END') {
          inDataBlock = false;
          break;
        }
      }
      continue;
    }

    // Handle Comment Lines (starting with $$)
    if (rawLine.startsWith('$$')) {
      continue;
    }

    // Handle Data Lines within XYDATA block
    if (inDataBlock) {
      // Clean comments at end of line
      const cleanLine = rawLine.split('$$')[0].trim();
      if (!cleanLine) continue;

      // Extract numbers (supporting scientific notation e.g. 1.23E-04, positive/negative)
      const tokens = cleanLine.split(/[\s,;]+/).filter(t => t.length > 0);
      if (tokens.length === 0) continue;

      const numTokens: number[] = [];
      for (const t of tokens) {
        const num = parseFloat(t);
        if (!isNaN(num) && isFinite(num)) {
          numTokens.push(num);
        }
      }

      if (numTokens.length === 0) continue;

      // Detect line mode
      // If dataBlockFormat contains (X++(Y..Y)), first number is X, following are consecutive Y values
      if (dataBlockFormat.includes('X++(Y..Y)') || dataBlockFormat.includes('X++') || numTokens.length > 2) {
        const startX = numTokens[0];
        const yVals = numTokens.slice(1);
        
        // If we know deltaX from metadata or consecutive points
        let stepX = 1.0;
        if (firstX !== undefined && lastX !== undefined && nPoints && nPoints > 1) {
          stepX = (lastX - firstX) / (nPoints - 1);
        }

        for (let j = 0; j < yVals.length; j++) {
          rawX.push(startX + j * stepX);
          rawY.push(yVals[j]);
        }
      } else if (numTokens.length === 2) {
        // Standard X Y pair
        rawX.push(numTokens[0]);
        rawY.push(numTokens[1]);
      }
    }
  }

  // Determine Technique
  const upperDT = dataType.toUpperCase();
  let technique: SpectralTechnique = 'UNKNOWN';
  if (upperDT.includes('INFRARED') || upperDT.includes('FTIR') || upperDT.includes('FT-IR') || upperDT.includes('IR')) {
    technique = 'FTIR';
  } else if (upperDT.includes('RAMAN')) {
    technique = 'RAMAN';
  } else if (upperDT.includes('NIR') || upperDT.includes('NEAR INFRARED')) {
    technique = 'NIR';
  }

  // Determine Axis
  const upperXU = xUnits.toUpperCase();
  let axis: SpectralAxis = 'UNKNOWN';
  if (upperXU.includes('1/CM') || upperXU.includes('CM-1') || upperXU.includes('WAVENUMBER') || upperXU.includes('CM^-1')) {
    axis = 'WAVENUMBER_CM1';
  } else if (upperXU.includes('NM') || upperXU.includes('NANOMETER') || upperXU.includes('WAVELENGTH')) {
    axis = 'WAVELENGTH_NM';
  }

  // Sort if needed to ensure increasing order
  const paired: Array<{ x: number; y: number }> = rawX.map((x, idx) => ({ x, y: rawY[idx] }));
  paired.sort((a, b) => a.x - b.x);

  const sortedX = paired.map(p => p.x);
  const sortedY = paired.map(p => p.y);

  // Validate Spectrum Data
  const validation = validateRawSpectrumData(sortedX, sortedY, technique, { x: xUnits, y: yUnits });
  if (!validation.isValid) {
    return {
      success: false,
      errors: [...errors, ...validation.errors],
      warnings: [...warnings, ...validation.warnings],
      metadata,
    };
  }

  // Hash Calculation for Raw Integrity
  const rawDataPayload = sortedX.map((x, i) => `${x.toFixed(4)}:${sortedY[i].toFixed(6)}`).join('|');
  const rawSpectrumHash = sha256(rawDataPayload);

  const lowerTitle = title.toLowerCase();
  const lowerFile = fileName.toLowerCase();
  const sourceType = lowerTitle.includes('synthetic') || lowerFile.includes('synthetic') ? 'SYNTHETIC'
    : lowerTitle.includes('demo') || lowerFile.includes('demo') ? 'DEMO'
    : lowerTitle.includes('simulated') || lowerFile.includes('simulated') ? 'SIMULATED'
    : lowerTitle.includes('reference') || lowerFile.includes('reference') ? 'REFERENCE'
    : 'USER_UPLOADED';

  const spectrumRecord: SpectrumRecord = {
    id: `SPEC-JCAMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    technique,
    axis,
    x: sortedX,
    y: sortedY,
    units: { x: xUnits, y: yUnits },
    sourceFileName: fileName,
    fileFormat: 'JCAMP',
    sourceType,
    acquisitionMetadata: {
      instrumentName: metadata['ORIGIN'] || 'Standard Spectrophotometer',
      resolutionCm1: metadata['RESOLUTION'] ? parseFloat(metadata['RESOLUTION']) : validation.meanResolution,
      comments: metadata['COMMENTS'] || metadata['OWNER'],
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
    metadata,
  };
}

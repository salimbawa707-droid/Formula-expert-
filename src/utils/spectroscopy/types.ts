/**
 * ============================================================================
 * SCIENTIFIC SPECTRAL ANALYSIS & SPECTROSCOPY DOMAIN CONTRACTS
 * ============================================================================
 * 
 * Clean-room TypeScript data contracts for vibrational spectroscopy (FTIR, Raman, NIR).
 * Implements strict analytical validation, immutable raw spectrum preservation,
 * reproducible preprocessing pipelines, peak detection, and reference matching.
 * ============================================================================
 */

// =============================================================================
// SPECTRAL TECHNIQUES & AXES
// =============================================================================

export type SpectralTechnique =
  | 'FTIR'
  | 'RAMAN'
  | 'NIR'
  | 'UNKNOWN';

export type SpectralAxis =
  | 'WAVENUMBER_CM1'
  | 'WAVELENGTH_NM'
  | 'UNKNOWN';

export type SpectrumSourceType =
  | 'SYNTHETIC'
  | 'REFERENCE'
  | 'DEMO'
  | 'SIMULATED'
  | 'USER_UPLOADED'
  | 'INSTRUMENT_ACQUIRED';

export type SpectralEvidenceStatus =
  | 'CALCULATED'
  | 'ANALYTICAL_EVIDENCE'
  | 'LAB_TESTED'
  | 'LAB_VALIDATED'
  | 'CERTIFIED'
  | 'INSUFFICIENT_DATA'
  | 'NOT_TESTED';

export type SpectralValidationStatus =
  | 'VALID'
  | 'INVALID_DATA'
  | 'INSUFFICIENT_DATA'
  | 'UNIT_UNKNOWN';

export type BaselineCorrectionMethod =
  | 'POLYNOMIAL'
  | 'RUBBERBAND'
  | 'ASLS'
  | 'NONE';

export type NormalizationMethod =
  | 'VECTOR'
  | 'AREA'
  | 'MIN_MAX'
  | 'SNV'
  | 'NONE';

export type SmoothingMethod =
  | 'SAVITZKY_GOLAY'
  | 'MOVING_AVERAGE'
  | 'GAUSSIAN'
  | 'NONE';

export type MatchingMetric =
  | 'PEARSON_CORRELATION'
  | 'COSINE_SIMILARITY'
  | 'NORMALIZED_DISTANCE';

export type SpectralMatchStatus =
  | 'MATCH'
  | 'NON_MATCH'
  | 'INCONCLUSIVE'
  | 'INSUFFICIENT_DATA';

export type SpectralConformityStatus =
  | 'PASS'
  | 'FAIL'
  | 'INCONCLUSIVE'
  | 'INSUFFICIENT_DATA'
  | 'NOT_TESTED';

// =============================================================================
// SPECTRUM RECORD & VALIDATION
// =============================================================================

export interface SpectrumUnits {
  x: string; // e.g. 'cm-1', 'nm'
  y: string; // e.g. 'Absorbance', 'Transmittance', 'Counts', 'Arbitrary Units'
}

export interface SpectrumAcquisitionMetadata {
  instrumentName?: string;
  instrumentModel?: string;
  instrumentSerialNumber?: string;
  scanCount?: number;
  resolutionCm1?: number;
  laserWavelengthNm?: number;
  integrationTimeMs?: number;
  temperatureC?: number;
  sampleHolder?: string;
  comments?: string;
}

export interface SpectrumRecord {
  id: string;
  title: string;
  technique: SpectralTechnique;
  axis: SpectralAxis;
  x: number[];
  y: number[];
  units: SpectrumUnits;
  sourceFileName: string;
  fileFormat: 'JCAMP' | 'CSV' | 'TXT' | 'MANUAL';
  sourceType?: SpectrumSourceType;
  instrumentId?: string;
  sampleId?: string;
  batchId?: string;
  formulaId?: string;
  formulaVersion?: string;
  acquisitionMetadata: SpectrumAcquisitionMetadata;
  rawSpectrumHash: string;
  processedSpectrumHash?: string;
  isRaw: boolean;
  createdAt: string;
  createdBy: string;
}

export interface SpectralValidationResult {
  isValid: boolean;
  status: SpectralValidationStatus;
  errors: string[];
  warnings: string[];
  pointCount: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  meanResolution: number;
  isMonotonic: boolean;
  hasDuplicates: boolean;
  hasNaNOrInf: boolean;
}

// =============================================================================
// PREPROCESSING & PEAKS
// =============================================================================

export interface PreprocessingPipelineConfig {
  rangeCrop?: { min: number; max: number };
  baselineMethod: BaselineCorrectionMethod;
  baselinePolyOrder?: number;
  smoothingMethod: SmoothingMethod;
  smoothingWindowSize?: number; // Must be odd positive integer
  smoothingPolyOrder?: number;
  normalizationMethod: NormalizationMethod;
  gridResampling?: { min: number; max: number; step: number };
}

export interface PreprocessedSpectrumResult {
  spectrum: SpectrumRecord;
  pipelineConfig: PreprocessingPipelineConfig;
  rawHash: string;
  processedHash: string;
  processingVersion: string;
  executionTimeMs: number;
  baselineSubtractedY?: number[];
  normalizedY?: number[];
}

export interface SpectralPeak {
  position: number;     // Wavenumber / Wavelength at peak apex
  intensity: number;    // Peak apex intensity
  prominence: number;   // Height relative to surrounding baseline
  fwhmWidth?: number;   // Full Width at Half Maximum
  area?: number;        // Integrated peak area
  snr?: number;         // Signal to noise ratio at peak
  label?: string;       // Functional group assignment (e.g. 'S=O Sulfonate Stretch')
}

export interface PeakDetectionResult {
  peaks: SpectralPeak[];
  peakCount: number;
  threshold: number;
  minProminence: number;
  noiseEstimate: number;
  dominantPeak?: SpectralPeak;
}

// =============================================================================
// REFERENCE SPECTRUM & MATCHING
// =============================================================================

export interface ReferenceKeyPeak {
  position: number;
  relativeIntensity: number; // 0.0 - 1.0
  description: string;
  toleranceCm1: number;
  isDiagnostic: boolean;
}

export interface SpectralReferenceSpectrum {
  referenceId: string;
  materialName: string;
  casNumber?: string;
  chemicalFormula?: string;
  technique: SpectralTechnique;
  axis: SpectralAxis;
  xUnits: string;
  yUnits: string;
  x: number[];
  y: number[];
  keyPeaks: ReferenceKeyPeak[];
  applicableRange: { min: number; max: number };
  source: string;
  license: string;
  provenance: 'DATABASE' | 'LITERATURE' | 'MANUFACTURER';
  version: string;
}

export interface SpectralMatchResult {
  referenceSpectrumId: string;
  materialName: string;
  technique: SpectralTechnique;
  metric: MatchingMetric;
  score: number; // 0.0 to 1.0 (or -1.0 to 1.0 for Pearson)
  threshold: number;
  matchStatus: SpectralMatchStatus;
  comparisonRange: { min: number; max: number };
  pointsCompared: number;
  diagnosticPeakMatchRatio: number;
  explanation: string;
}

export interface KeyPeakConformityItem {
  expectedPosition: number;
  observedPosition?: number;
  positionDelta?: number;
  tolerance: number;
  matched: boolean;
  description: string;
  isDiagnostic: boolean;
}

export interface SpectralConformityReport {
  conformStatus: SpectralConformityStatus;
  sampleId?: string;
  testId?: string;
  formulaId?: string;
  technique: SpectralTechnique;
  referenceId: string;
  referenceName: string;
  similarityScore: number;
  metric: MatchingMetric;
  criteria: {
    minScore: number;
    requiredDiagnosticPeakRatio: number;
  };
  observedPeaks: SpectralPeak[];
  keyPeakResults: KeyPeakConformityItem[];
  blockingIssues: string[];
  evidenceLevel: SpectralEvidenceStatus;
  rawSpectrumHash: string;
  processedSpectrumHash: string;
  analyst: string;
  instrumentId?: string;
  instrumentCalibrationValid?: boolean;
  timestamp: string;
  summary: string;
}

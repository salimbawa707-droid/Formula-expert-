/**
 * ============================================================================
 * P1 PHASE 6 — LABORATORY EVIDENCE, CALIBRATION & PREDICTED-vs-MEASURED ENGINE
 * ============================================================================
 *
 * Authoritative, evidence-driven validation layer for detergent laboratory measurements:
 * 1. Measurement Identity & Traceability (Formula ID, Version, Category, KPI, Sample, Batch).
 * 2. Strict Measurement Validation (Numeric range, unit normalization, metadata completeness).
 * 3. Comparability Assessment (KPI matching, unit compatibility, condition alignment).
 * 4. Prediction-vs-Measurement Error Engine (Absolute error, % error with zero-denominator safety).
 * 5. Replicate Statistics & Outlier Flagging (n, mean, stdDev, range; outlier preservation).
 * 6. Model Validation Layer (MAE, Bias, MAPE; insufficient data safeguards).
 * 7. Calibration Safety & Proposal Layer (Strict candidate proposals, zero automatic model mutations).
 * 8. Category Isolation (13 canonical category evidence boundaries without cross-leakage).
 * ============================================================================
 */

import { ProductCategoryId, normalizeProductCategory, getProductCategoryLabel } from '../domain/productTaxonomy';
import { LabMeasurementRecord, StandardUnit } from './specificationEngine/types';
import { isValidNumber, convertUnitValue } from './specificationEngine/unitConversions';
import { canPromoteToLabValidated } from './lims/limsEvidencePromotionEngine';

// =============================================================================
// TYPES & ENUMS
// =============================================================================

export type MeasurementQualityStatus =
  | 'ACCEPTED'
  | 'ACCEPTED_WITH_WARNING'
  | 'INVALID_MEASUREMENT'
  | 'NOT_COMPARABLE'
  | 'INSUFFICIENT_METADATA'
  | 'POTENTIAL_OUTLIER';

export interface TestConditions {
  temperatureC?: number;
  waterHardnessPpm?: number;
  dilutionRatio?: string;
  concentrationPct?: number;
  substrate?: string;
  soilType?: string;
  washTimeMinutes?: number;
  agitationRpm?: number;
}

export interface DetailedLabEvidenceRecord extends LabMeasurementRecord {
  categoryId?: ProductCategoryId;
  sampleId?: string;
  batchId?: string;
  kpiId?: string;
  testConditions?: TestConditions;
  instrument?: string;
  evidenceRef?: string;
  qualityStatus?: MeasurementQualityStatus;
  validationWarnings?: string[];
  parameterName?: string;
  status?: 'PASS' | 'OUT_OF_SPEC' | 'WARNING';
  targetRangeDisplay?: string;
  methodRef?: string;
  sourceType?: 'CALCULATED' | 'USER_ENTERED' | 'LAB_MEASURED';
  isCalibratedInstrument?: boolean;
}

export interface ReplicateAnalysisResult {
  parameterKey: string;
  count: number;
  values: number[];
  mean: number;
  median?: number;
  stdDev?: number;
  min: number;
  max: number;
  range: number;
  hasReplicates: boolean;
  hasOutliers: boolean;
  outlierIndices: number[];
  outlierValues: number[];
  statisticalConfidence: 'HIGH' | 'MODERATE' | 'LOW' | 'SINGLE_OBSERVATION_NO_CONFIDENCE';
}

export interface ComparabilityCheckResult {
  isComparable: boolean;
  reason?: string;
  matchedFormula: boolean;
  matchedVersion: boolean;
  matchedCategory: boolean;
  matchedKPI: boolean;
  matchedUnit: boolean;
  conditionsComparable: boolean;
  conditionWarnings: string[];
}

export interface ErrorAnalysisResult {
  predictedValue: number;
  measuredValue: number;
  unit: StandardUnit;
  absoluteError: number;              // measured - predicted
  absoluteErrorMagnitude: number;     // |measured - predicted|
  percentageError?: number;           // (|measured - predicted| / predicted) * 100
  isPercentageCalculable: boolean;
  normalizedErrorScore?: number;      // KPI-scaled 0-100 error penalty
  errorDirection: 'OVER_PREDICTION' | 'UNDER_PREDICTION' | 'EXACT_MATCH';
  status: 'CALCULATED' | 'NOT_CALCULABLE' | 'NOT_COMPARABLE';
  explanation?: string;
}

export interface KPIValidationAssessment {
  kpiId: string;
  kpiName: string;
  canonicalCategory: ProductCategoryId;
  predictedValue: number;
  measuredValue?: number;
  qualityStatus: MeasurementQualityStatus;
  comparability: ComparabilityCheckResult;
  errorAnalysis?: ErrorAnalysisResult;
  replicateAnalysis?: ReplicateAnalysisResult;
  findings: string[];
}

export interface CategoryModelValidationSummary {
  canonicalCategory: ProductCategoryId;
  categoryLabel: string;
  totalMeasurementsCount: number;
  comparableObservationsCount: number;
  kpiSummaries: Record<string, {
    kpiId: string;
    sampleCount: number;
    meanAbsoluteError: number;
    meanBias: number;
    meanAbsolutePercentageError?: number;
    validationStatus: 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'INSUFFICIENT_VALIDATION_DATA';
  }>;
  overallValidationStatus: 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'INSUFFICIENT_VALIDATION_DATA';
  engineeringValidationThreshold: number; // e.g. 5 comparable observations required
}

export interface CalibrationCandidateProposal {
  proposalId: string;
  canonicalCategory: ProductCategoryId;
  kpiId: string;
  parameterName: string;
  currentModelParameterValue?: number;
  currentModelValue?: number;
  proposedShiftOffset: number;
  proposedCalibratedValue?: number;
  observedBias: number;
  sampleCount: number;
  meanAbsoluteError: number;
  mae?: number;
  rationale: string;
  recommendation?: string;
  proposedAt: string;
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'REJECTED';
  safetyWarning: string;
  evidenceReferenceIds?: string[];
}

// =============================================================================
// 1. MEASUREMENT IDENTITY & TRACEABILITY
// =============================================================================

/**
 * Validates laboratory measurement identity and contract completeness.
 */
export function validateMeasurementRecord(record: DetailedLabEvidenceRecord): {
  isValid: boolean;
  qualityStatus: MeasurementQualityStatus;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // A. Numeric sanity check
  if (!isValidNumber(record.value)) {
    errors.push(`Measurement value is invalid or non-numeric: ${record.value}`);
  }

  // B. Parameter & KPI Key
  if (!record.parameterKey && !record.kpiId) {
    errors.push('Measurement missing both parameterKey and kpiId');
  }

  // C. Formula & Version Identity
  if (!record.formulaVersion) {
    errors.push('Measurement missing formulaVersion');
  }

  // D. Provenance
  if (record.provenance !== 'MEASURED') {
    errors.push(`Invalid provenance '${record.provenance}'. Laboratory evidence must be strictly 'MEASURED'`);
  }

  // E. Category Validation
  if (record.categoryId) {
    const normCat = normalizeProductCategory(record.categoryId);
    if (normCat === 'UNKNOWN_PRODUCT_CATEGORY') {
      warnings.push(`Category '${record.categoryId}' could not be normalized to a canonical category`);
    }
  }

  // F. Physical Plausibility Checks per Parameter
  const param = (record.parameterKey || record.kpiId || '').toLowerCase();
  const val = record.value;

  if (param.includes('ph') && (val < 0 || val > 14.5)) {
    errors.push(`pH value (${val}) outside physical water-ion product boundary [0 - 14.5]`);
  }
  if ((param.includes('percent') || param.includes('pct') || param.includes('active') || param.includes('soilremoval')) && val < 0) {
    errors.push(`Percentage parameter '${param}' cannot be negative (${val})`);
  }
  if (param.includes('viscosity') && val < 0) {
    errors.push(`Viscosity cannot be negative (${val})`);
  }

  // G. Metadata Completeness
  if (!record.testMethod) {
    warnings.push('Laboratory measurement lacks explicit test method reference');
  }
  if (!record.testDate) {
    warnings.push('Laboratory measurement lacks explicit test date');
  }

  const isValid = errors.length === 0;
  let qualityStatus: MeasurementQualityStatus = 'ACCEPTED';

  if (!isValid) {
    qualityStatus = 'INVALID_MEASUREMENT';
  } else if (warnings.length > 0) {
    qualityStatus = 'ACCEPTED_WITH_WARNING';
  }

  return { isValid, qualityStatus, errors, warnings };
}

// =============================================================================
// 2. REPLICATE ANALYSIS & OUTLIER DETECTION
// =============================================================================

/**
 * Analyzes replicate laboratory measurements for a single parameter.
 * Preserves outliers without deleting them.
 */
export function analyzeLabReplicates(records: DetailedLabEvidenceRecord[]): ReplicateAnalysisResult | null {
  const validRecords = records.filter(r => validateMeasurementRecord(r).isValid);
  if (validRecords.length === 0) return null;

  const paramKey = validRecords[0].parameterKey || validRecords[0].kpiId || 'unknown';
  const values = validRecords.map(r => r.value);
  const n = values.length;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Median
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 1
    ? sorted[Math.floor(n / 2)]
    : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

  // Standard Deviation (n > 1)
  let stdDev: number | undefined = undefined;
  if (n > 1) {
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
    stdDev = Math.sqrt(variance);
  }

  // Outlier Detection via Modified Z-score (MAD) or stdDev threshold (n >= 3)
  const outlierIndices: number[] = [];
  const outlierValues: number[] = [];

  if (n >= 3) {
    const absDeviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = n % 2 === 1
      ? absDeviations[Math.floor(n / 2)]
      : (absDeviations[n / 2 - 1] + absDeviations[n / 2]) / 2;

    values.forEach((v, idx) => {
      let isOutlier = false;
      if (mad > 0) {
        const modZScore = 0.6745 * (Math.abs(v - median) / mad);
        if (modZScore > 2.5) isOutlier = true;
      } else if (stdDev && stdDev > 0) {
        if (Math.abs(v - mean) > 1.5 * stdDev) isOutlier = true;
      }

      if (isOutlier) {
        outlierIndices.push(idx);
        outlierValues.push(v);
      }
    });
  }

  let confidence: ReplicateAnalysisResult['statisticalConfidence'] = 'SINGLE_OBSERVATION_NO_CONFIDENCE';
  if (n >= 5) confidence = 'HIGH';
  else if (n >= 3) confidence = 'MODERATE';
  else if (n === 2) confidence = 'LOW';

  return {
    parameterKey: paramKey,
    count: n,
    values,
    mean,
    median,
    stdDev,
    min,
    max,
    range,
    hasReplicates: n > 1,
    hasOutliers: outlierIndices.length > 0,
    outlierIndices,
    outlierValues,
    statisticalConfidence: confidence
  };
}

// =============================================================================
// 3. COMPARABILITY ASSESSMENT
// =============================================================================

export interface ComparabilityInput {
  targetFormulaId?: string;
  targetFormulaVersion: string;
  targetCategory: ProductCategoryId;
  targetKPIId: string;
  targetUnit: StandardUnit;
  targetConditions?: TestConditions;
  measurement: DetailedLabEvidenceRecord;
}

/**
 * Checks whether a laboratory measurement can be compared against a prediction.
 */
export function checkMeasurementComparability(input: ComparabilityInput): ComparabilityCheckResult {
  const m = input.measurement;
  const conditionWarnings: string[] = [];

  // 1. Formula & Version Match
  const matchedFormula = !input.targetFormulaId || m.formulaId === input.targetFormulaId;
  const matchedVersion = m.formulaVersion === input.targetFormulaVersion;

  // 2. Category Match
  const normTargetCat = normalizeProductCategory(input.targetCategory);
  const normMeasCat = m.categoryId ? normalizeProductCategory(m.categoryId) : normTargetCat;
  if (normTargetCat === 'UNKNOWN_PRODUCT_CATEGORY' || normMeasCat === 'UNKNOWN_PRODUCT_CATEGORY') {
    return {
      isComparable: false,
      reason: 'Product category is unknown or invalid. Cannot establish measurement comparability without valid category.',
      matchedFormula,
      matchedVersion,
      matchedCategory: false,
      matchedKPI: false,
      matchedUnit: false,
      conditionsComparable: false,
      conditionWarnings: ['Unknown product category prevents comparability check.']
    };
  }
  const matchedCategory = normTargetCat === normMeasCat;

  // 3. KPI Match
  const mKPI = (m.kpiId || m.parameterKey || '').toLowerCase();
  const tKPI = input.targetKPIId.toLowerCase();
  const matchedKPI = mKPI === tKPI || (mKPI === 'ph' && tKPI.includes('ph')) || (mKPI === 'cleaningscore' && tKPI.includes('clean'));

  // 4. Unit Compatibility
  const matchedUnit = m.unit === input.targetUnit || convertUnitValue(m.value, m.unit, input.targetUnit) !== undefined;

  // 5. Test Conditions Compatibility
  let conditionsComparable = true;
  if (input.targetConditions && m.testConditions) {
    const tCond = input.targetConditions;
    const mCond = m.testConditions;

    if (tCond.temperatureC !== undefined && mCond.temperatureC !== undefined) {
      if (Math.abs(tCond.temperatureC - mCond.temperatureC) > 5) {
        conditionsComparable = false;
        conditionWarnings.push(`Temperature mismatch: test run at ${mCond.temperatureC}°C vs target ${tCond.temperatureC}°C`);
      }
    }

    if (tCond.waterHardnessPpm !== undefined && mCond.waterHardnessPpm !== undefined) {
      if (Math.abs(tCond.waterHardnessPpm - mCond.waterHardnessPpm) > 50) {
        conditionsComparable = false;
        conditionWarnings.push(`Water hardness mismatch: tested in ${mCond.waterHardnessPpm} ppm hard water vs target ${tCond.waterHardnessPpm} ppm`);
      }
    }

    if (tCond.substrate && mCond.substrate && tCond.substrate.toLowerCase() !== mCond.substrate.toLowerCase()) {
      conditionWarnings.push(`Substrate difference: tested on ${mCond.substrate} vs target ${tCond.substrate}`);
    }
  }

  const isComparable = matchedFormula && matchedVersion && matchedCategory && matchedKPI && matchedUnit && conditionsComparable;

  let reason: string | undefined = undefined;
  if (!matchedFormula) reason = `Formula ID mismatch (Measurement: ${m.formulaId || 'missing'}, Target: ${input.targetFormulaId})`;
  else if (!matchedVersion) reason = `Formula version mismatch (Measurement: v${m.formulaVersion}, Target: v${input.targetFormulaVersion})`;
  else if (!matchedCategory) reason = `Product category mismatch (Measurement: ${normMeasCat}, Target: ${normTargetCat})`;
  else if (!matchedKPI) reason = `KPI mismatch (Measurement KPI: '${mKPI}', Target KPI: '${tKPI}')`;
  else if (!matchedUnit) reason = `Incompatible units (Measurement: ${m.unit}, Target: ${input.targetUnit})`;
  else if (!conditionsComparable) reason = `Test conditions incompatible: ${conditionWarnings.join('; ')}`;

  return {
    isComparable,
    reason,
    matchedFormula,
    matchedVersion,
    matchedCategory,
    matchedKPI,
    matchedUnit,
    conditionsComparable,
    conditionWarnings
  };
}

// =============================================================================
// 4. PREDICTION ERROR CALCULATION
// =============================================================================

/**
 * Calculates deterministic prediction error metrics.
 */
export function calculatePredictionError(
  predictedValue: number,
  measuredValue: number,
  unit: StandardUnit,
  comparability: ComparabilityCheckResult
): ErrorAnalysisResult {
  if (!comparability.isComparable) {
    return {
      predictedValue,
      measuredValue,
      unit,
      absoluteError: NaN,
      absoluteErrorMagnitude: NaN,
      isPercentageCalculable: false,
      errorDirection: 'EXACT_MATCH',
      status: 'NOT_COMPARABLE',
      explanation: comparability.reason || 'Measurement is not comparable to prediction'
    };
  }

  const absoluteError = measuredValue - predictedValue;
  const absoluteErrorMagnitude = Math.abs(absoluteError);

  // Percentage error calculation safeguard
  let percentageError: number | undefined = undefined;
  let isPercentageCalculable = false;

  if (isValidNumber(predictedValue) && Math.abs(predictedValue) > 0.001) {
    percentageError = (absoluteErrorMagnitude / Math.abs(predictedValue)) * 100;
    isPercentageCalculable = true;
  }

  let errorDirection: ErrorAnalysisResult['errorDirection'] = 'EXACT_MATCH';
  if (absoluteError > 0.001) errorDirection = 'UNDER_PREDICTION'; // Model predicted lower than actual
  else if (absoluteError < -0.001) errorDirection = 'OVER_PREDICTION'; // Model predicted higher than actual

  return {
    predictedValue,
    measuredValue,
    unit,
    absoluteError,
    absoluteErrorMagnitude,
    percentageError,
    isPercentageCalculable,
    errorDirection,
    status: 'CALCULATED'
  };
}

// =============================================================================
// 5. MODEL VALIDATION LAYER
// =============================================================================

/**
 * Aggregates comparable predicted vs measured pairs across a category to evaluate model bias.
 */
export function evaluateCategoryModelValidation(
  category: ProductCategoryId,
  observations: Array<{
    kpiId: string;
    predicted: number;
    measured: number;
    comparable: boolean;
  }>
): CategoryModelValidationSummary {
  const normCatRaw = normalizeProductCategory(category);
  if (normCatRaw === 'UNKNOWN_PRODUCT_CATEGORY') {
    return {
      canonicalCategory: 'UNKNOWN_PRODUCT_CATEGORY' as any,
      categoryLabel: 'Unknown Product Category',
      totalMeasurementsCount: 0,
      comparableObservationsCount: 0,
      kpiSummaries: {},
      overallValidationStatus: 'INSUFFICIENT_VALIDATION_DATA',
      engineeringValidationThreshold: 5
    };
  }
  const normCat: ProductCategoryId = normCatRaw;
  const categoryLabel = getProductCategoryLabel(normCat);
  const engineeringValidationThreshold = 5; // Engineering threshold for category validation

  const kpiGroups: Record<string, Array<{ predicted: number; measured: number }>> = {};

  observations.forEach(obs => {
    if (obs.comparable && isValidNumber(obs.predicted) && isValidNumber(obs.measured)) {
      if (!kpiGroups[obs.kpiId]) kpiGroups[obs.kpiId] = [];
      kpiGroups[obs.kpiId].push({ predicted: obs.predicted, measured: obs.measured });
    }
  });

  const kpiSummaries: CategoryModelValidationSummary['kpiSummaries'] = {};
  let totalComparable = 0;

  Object.entries(kpiGroups).forEach(([kpiId, pairs]) => {
    const count = pairs.length;
    totalComparable += count;

    const absErrors = pairs.map(p => Math.abs(p.measured - p.predicted));
    const biases = pairs.map(p => p.measured - p.predicted);

    const mae = absErrors.reduce((a, b) => a + b, 0) / count;
    const meanBias = biases.reduce((a, b) => a + b, 0) / count;

    // MAPE
    const mapes = pairs
      .filter(p => Math.abs(p.predicted) > 0.001)
      .map(p => (Math.abs(p.measured - p.predicted) / Math.abs(p.predicted)) * 100);

    const mape = mapes.length > 0 ? mapes.reduce((a, b) => a + b, 0) / mapes.length : undefined;

    let validationStatus: 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'INSUFFICIENT_VALIDATION_DATA' = 'INSUFFICIENT_VALIDATION_DATA';
    if (count >= engineeringValidationThreshold && mae < 10) {
      validationStatus = 'VALIDATED';
    } else if (count >= 2) {
      validationStatus = 'PARTIALLY_VALIDATED';
    }

    kpiSummaries[kpiId] = {
      kpiId,
      sampleCount: count,
      meanAbsoluteError: mae,
      meanBias,
      meanAbsolutePercentageError: mape,
      validationStatus
    };
  });

  let overallValidationStatus: CategoryModelValidationSummary['overallValidationStatus'] = 'INSUFFICIENT_VALIDATION_DATA';
  const summaryValues = Object.values(kpiSummaries);

  if (summaryValues.length > 0 && summaryValues.every(s => s.validationStatus === 'VALIDATED')) {
    overallValidationStatus = 'VALIDATED';
  } else if (summaryValues.some(s => s.validationStatus === 'VALIDATED' || s.validationStatus === 'PARTIALLY_VALIDATED')) {
    overallValidationStatus = 'PARTIALLY_VALIDATED';
  }

  return {
    canonicalCategory: normCat,
    categoryLabel,
    totalMeasurementsCount: observations.length,
    comparableObservationsCount: totalComparable,
    kpiSummaries,
    overallValidationStatus,
    engineeringValidationThreshold
  };
}

// =============================================================================
// 6. CALIBRATION CANDIDATE PROPOSAL LAYER (ZERO AUTOMATIC MUTATION)
// =============================================================================

/**
 * Assesses model validation data to detect systematic bias and generate CALIBRATION CANDIDATES.
 * STRICT SAFETY RULE: Generates proposals ONLY. NEVER mutates PHEngineV2 or chemistry constants.
 */
export function proposeCalibrationCandidates(
  validationSummary: CategoryModelValidationSummary
): CalibrationCandidateProposal[] {
  const proposals: CalibrationCandidateProposal[] = [];

  Object.values(validationSummary.kpiSummaries).forEach(kpiSum => {
    // Systematic bias threshold: >= 5 observations, |meanBias| >= 0.3
    if (kpiSum.sampleCount >= 5 && Math.abs(kpiSum.meanBias) >= 0.3) {
      const isPositiveBias = kpiSum.meanBias > 0;
      const shiftDirection = isPositiveBias ? '+' : '-';

      proposals.push({
        proposalId: `calib-prop-${validationSummary.canonicalCategory}-${kpiSum.kpiId}-${Date.now()}`,
        canonicalCategory: validationSummary.canonicalCategory,
        kpiId: kpiSum.kpiId,
        parameterName: `Model Bias Adjustment for ${kpiSum.kpiId}`,
        proposedShiftOffset: -kpiSum.meanBias, // Offset to counter systematic bias
        observedBias: kpiSum.meanBias,
        sampleCount: kpiSum.sampleCount,
        meanAbsoluteError: kpiSum.meanAbsoluteError,
        rationale: `Systematic ${isPositiveBias ? 'under-prediction' : 'over-prediction'} detected across ${kpiSum.sampleCount} comparable laboratory observations (Observed Bias: ${shiftDirection}${Math.abs(kpiSum.meanBias).toFixed(2)}).`,
        proposedAt: new Date().toISOString(),
        status: 'PROPOSED',
        safetyWarning: 'PROPOSAL ONLY: Must NOT automatically alter PHEngineV2, equilibrium constants, or physical constants. Requires senior chemist review.'
      });
    }
  });

  return proposals;
}

// =============================================================================
// 7. 13-CATEGORY EVIDENCE MATRIX DEFINITION
// =============================================================================

export interface CategoryEvidenceMatrixEntry {
  canonicalCategory: ProductCategoryId;
  categoryLabel: string;
  supportedEvidenceDomains: string[];
  primaryLabTestMethods: string[];
}

export const CATEGORY_EVIDENCE_MATRIX: Record<ProductCategoryId, CategoryEvidenceMatrixEntry> = {
  LAUNDRY_LIQUID: {
    canonicalCategory: 'LAUNDRY_LIQUID',
    categoryLabel: 'Heavy-Duty Liquid Laundry Detergent',
    supportedEvidenceDomains: ['Soil Removal %', 'Active Surfactant %', 'Finished Product pH', 'Product Viscosity @ 25°C', 'Hard Water Detergency'],
    primaryLabTestMethods: ['ASTM D4265 (Tergt-O-Tometer)', 'Potentiometric pH', 'Brookfield Viscosity Spindle 2']
  },
  LAUNDRY_POWDER: {
    canonicalCategory: 'LAUNDRY_POWDER',
    categoryLabel: 'Commercial Laundry Powder Detergent',
    supportedEvidenceDomains: ['Detergency %', '1.0% Slurry pH', 'Active Matter %', 'Moisture Content %', 'Uncompacted Bulk Density'],
    primaryLabTestMethods: ['ISO 4312 (Washing Powder Performance)', '1.0% w/v Slurry Potentiometry', 'Gravimetric Loss on Drying @ 105°C']
  },
  DISHWASH_MANUAL: {
    canonicalCategory: 'DISHWASH_MANUAL',
    categoryLabel: 'Manual Liquid Dishwashing Detergent',
    supportedEvidenceDomains: ['Grease Cutting %', 'Foam Height / Mileage', 'Hand Mildness Index', 'Viscosity @ 25°C'],
    primaryLabTestMethods: ['ASTM D4009 (Plates Washed Test)', 'Ross-Miles Foam Test ASTM D1173']
  },
  DISHWASH_AUTOMATIC: {
    canonicalCategory: 'DISHWASH_AUTOMATIC',
    categoryLabel: 'Automatic Machine Dishwash Detergent',
    supportedEvidenceDomains: ['Food Soil Removal', 'Spotting & Filming Score', 'Foam Suppression', 'Machine Corrosion'],
    primaryLabTestMethods: ['ASTM D3556 (Machine Dishwashing Spotting & Filming)', 'Low-Foam Cylinder Test']
  },
  FLOOR_CLEANER: {
    canonicalCategory: 'FLOOR_CLEANER',
    categoryLabel: 'Hard Surface Floor Cleaner',
    supportedEvidenceDomains: ['Soil Removal %', 'Residue / Streaking Score', 'Gloss Retention', 'Drying Time'],
    primaryLabTestMethods: ['Gardner Straight-Line Washability ASTM D2486', 'Glossmeter Readout @ 60°']
  },
  MULTIPURPOSE_CLEANER: {
    canonicalCategory: 'MULTIPURPOSE_CLEANER',
    categoryLabel: 'All-Purpose Household Surface Cleaner',
    supportedEvidenceDomains: ['General Soil Detergency', 'Grease Emulsification', 'Surface Compatibility', 'pH'],
    primaryLabTestMethods: ['CSPA DCC-09 Multi-Surface Detergency', 'Potentiometric pH']
  },
  TOILET_CLEANER: {
    canonicalCategory: 'TOILET_CLEANER',
    categoryLabel: 'Viscous Acidic Toilet Bowl Cleaner',
    supportedEvidenceDomains: ['CaCO3 Scale Dissolution Rate', 'Surface Adhesion / Viscosity', 'Acid Corrosion Rate'],
    primaryLabTestMethods: ['Gravimetric CaCO3 Coupon Dissolution', 'Vertical Surface Cling Timed Run']
  },
  BATHROOM_CLEANER: {
    canonicalCategory: 'BATHROOM_CLEANER',
    categoryLabel: 'Bathroom Soap Scum & Descaler',
    supportedEvidenceDomains: ['Soap Scum Removal %', 'Limescale Dissolution', 'Surface Polish'],
    primaryLabTestMethods: ['CSPA DCC-16 Synthetic Soap Scum Removal']
  },
  GLASS_CLEANER: {
    canonicalCategory: 'GLASS_CLEANER',
    categoryLabel: 'Non-Streaking Glass & Window Cleaner',
    supportedEvidenceDomains: ['Optical Transmission %', 'Streaking Rating', 'Evaporation Rate'],
    primaryLabTestMethods: ['CSPA DCC-09 Glass Clarity Spectrophotometry', 'Visual Smear Index']
  },
  FABRIC_SOFTENER: {
    canonicalCategory: 'FABRIC_SOFTENER',
    categoryLabel: 'Cationic Fabric Softener & Conditioner',
    supportedEvidenceDomains: ['Textile Softness Score', 'Static Charge Reduction', 'Viscosity Stability'],
    primaryLabTestMethods: ['Panel Handle Evaluation (ASTM D5237)', 'Electrostatic Charge Voltmeter']
  },
  HAND_WASH: {
    canonicalCategory: 'HAND_WASH',
    categoryLabel: 'Liquid Hand Wash & Pearlized Soap',
    supportedEvidenceDomains: ['Foam Density & Volume', 'Skin Mildness Score', 'pH', 'Dispensing Viscosity'],
    primaryLabTestMethods: ['In-Vitro Zein Protein Mildness Test', 'Potentiometric pH (5.0 - 6.8)']
  },
  KITCHEN_DEGREASER: {
    canonicalCategory: 'KITCHEN_DEGREASER',
    categoryLabel: 'Heavy-Duty Kitchen & Oven Degreaser',
    supportedEvidenceDomains: ['Gravimetric Baked Grease Removal %', 'Saponification Rate', 'Alkaline Viscosity'],
    primaryLabTestMethods: ['ASTM D4488 Baked-On Lard / Soil Removal']
  },
  CAR_SHAMPOO: {
    canonicalCategory: 'CAR_SHAMPOO',
    categoryLabel: 'pH-Neutral Snow Foam Car Shampoo',
    supportedEvidenceDomains: ['Snow Foam Stability', 'Paintwork Lubricity / Friction Coefficient', 'Wax-Safe Neutral pH'],
    primaryLabTestMethods: ['Tribometer Friction Coefficient Measurement', 'Foam Lance Expansion Ratio']
  }
};

// =============================================================================
// 8. PHASE 5 — AUTHORITATIVE SCIENTIFIC VALIDATION & READINESS ENGINE
// =============================================================================

export type ScientificValidationState =
  | 'CALCULATED'
  | 'SCIENTIFICALLY_SCREENED'
  | 'LAB_VALIDATION_REQUIRED'
  | 'LAB_TESTED'
  | 'LAB_VALIDATED'
  | 'LAB_FAILED';

export type FormulaReadinessLevel =
  | 'COMPUTATIONAL_READY'
  | 'LAB_READY'
  | 'LAB_VALIDATED'
  | 'PRODUCTION_READY';

export type EvidenceProvenance =
  | 'CALCULATED'
  | 'ESTIMATED'
  | 'INFERRED'
  | 'DATABASE_DERIVED'
  | 'LABORATORY_MEASURED'
  | 'USER_ENTERED_LAB';

export interface PredictedVsMeasuredComparison {
  parameterKey: string;
  parameterName: string;
  unit: string;
  predictedValue: number;
  measuredValue: number;
  absoluteError: number;
  percentageError?: number;
  isWithinAcceptanceRange: boolean;
  acceptanceRangeDisplay?: string;
  status: 'PASS' | 'WARNING' | 'OUT_OF_SPEC' | 'NOT_COMPARABLE';
  methodRef?: string;
  testDate?: string;
  operator?: string;
}

export interface FormulaValidationEvaluationInput {
  formulaId?: string;
  formulaVersion?: string;
  productCategory: string;
  isComputationallyValid?: boolean;
  predictedMetrics?: {
    pH?: number;
    activeMatterPct?: number;
    activeSurfactantsPct?: number;
    viscosityCps?: number;
    cpi?: number;
    densityGCm3?: number;
    waterHardnessTolerancePpm?: number;
  };
  labEvidenceRecords: DetailedLabEvidenceRecord[];
  qualityGateFindings?: {
    blockingIssuesCount: number;
    majorWarningsCount: number;
  };
}

export interface FormulaValidationReport {
  formulaId?: string;
  formulaVersion?: string;
  category: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  validationState: ScientificValidationState;
  readinessLevel: FormulaReadinessLevel;
  isLabValidated: boolean;
  isComputationallyReady: boolean;
  isProductionReady: boolean;
  comparisons: PredictedVsMeasuredComparison[];
  requiredTestsBattery: string[];
  completedTests: string[];
  missingTests: string[];
  hasFailedTests: boolean;
  hasOutdatedEvidence: boolean;
  provenanceMap: Record<string, EvidenceProvenance>;
  summaryMessage: string;
  scientificDisclaimer: string;
}

/**
 * Gets product-specific mandatory laboratory parameter battery.
 */
export function getCategoryRequiredLabBattery(category: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY'): string[] {
  if (category === 'UNKNOWN_PRODUCT_CATEGORY') {
    return [];
  }
  switch (category) {
    case 'LAUNDRY_POWDER':
      return ['pH', 'activeMatter', 'moisture', 'bulkDensity'];
    case 'FABRIC_SOFTENER':
      return ['pH', 'viscosity', 'activeMatter', 'softness'];
    case 'TOILET_CLEANER':
      return ['pH', 'viscosity', 'descalingRate'];
    case 'BATHROOM_CLEANER':
      return ['pH', 'viscosity', 'soapScumRemoval'];
    case 'GLASS_CLEANER':
      return ['pH', 'streakRating', 'opticalTransmission'];
    case 'HAND_WASH':
      return ['pH', 'viscosity', 'activeSurfactants', 'mildness'];
    case 'DISHWASH_AUTOMATIC':
      return ['pH', 'zeroFoamCompliance', 'foodSoilRemoval'];
    case 'DISHWASH_MANUAL':
      return ['pH', 'viscosity', 'activeSurfactants', 'greaseCutting'];
    case 'LAUNDRY_LIQUID':
    case 'FLOOR_CLEANER':
    case 'MULTIPURPOSE_CLEANER':
    case 'KITCHEN_DEGREASER':
    case 'CAR_SHAMPOO':
      return ['pH', 'viscosity', 'activeSurfactants', 'cleaningScore'];
    default:
      return [];
  }
}

/**
 * Authoritatively evaluates formulation validation state, readiness level, and predicted vs measured deviations.
 * Enforces zero false claims: Calculations alone NEVER produce LAB_VALIDATED or PRODUCTION_READY.
 */
export function evaluateFormulaScientificValidation(input: FormulaValidationEvaluationInput): FormulaValidationReport {
  const normCat = normalizeProductCategory(input.productCategory);
  const category: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY' = normCat;

  const targetVersion = input.formulaVersion || '1.0.0';
  const targetId = input.formulaId;
  const records = Array.isArray(input.labEvidenceRecords) ? input.labEvidenceRecords : [];

  if (category === 'UNKNOWN_PRODUCT_CATEGORY') {
    return {
      formulaId: targetId,
      formulaVersion: targetVersion,
      category: 'UNKNOWN_PRODUCT_CATEGORY',
      validationState: 'CALCULATED',
      readinessLevel: 'COMPUTATIONAL_READY',
      isLabValidated: false,
      isComputationallyReady: false,
      isProductionReady: false,
      comparisons: [],
      requiredTestsBattery: [],
      completedTests: [],
      missingTests: [],
      hasFailedTests: false,
      hasOutdatedEvidence: false,
      provenanceMap: {},
      summaryMessage: 'Product category is unknown or missing. Mandatory category test battery and scientific validation cannot be evaluated.',
      scientificDisclaimer: 'Calculated metrics are derived from theoretical chemical equilibria and empirical surfactant models. Laboratory physical testing (ASTM/ISO/AATCC) is mandatory to certify commercial claims and product safety.'
    };
  }

  const requiredBattery = getCategoryRequiredLabBattery(category);
  const completedTests: string[] = [];
  const comparisons: PredictedVsMeasuredComparison[] = [];
  const provenanceMap: Record<string, EvidenceProvenance> = {};

  let hasFailedTests = false;
  let hasOutdatedEvidence = false;

  // Filter records strictly belonging to this formula version
  const validVersionRecords = records.filter(r => {
    // Never treat missing identity metadata as a match when a target is known.
    // Version is always explicit here (targetVersion defaults to 1.0.0), so
    // measurements without the exact version are not comparable.
    const isMatchingVersion = r.formulaVersion === targetVersion;
    const isMatchingId = !targetId || r.formulaId === targetId;
    if (!isMatchingVersion && (r.formulaId === targetId || !targetId || isMatchingId)) {
      hasOutdatedEvidence = true;
    }
    // Identity alone is not evidence: only valid numeric records explicitly
    // classified as MEASURED may enter predicted-vs-measured comparisons.
    return isMatchingVersion && isMatchingId && validateMeasurementRecord(r).isValid;
  });

  // Evaluate matching parameters
  for (const record of validVersionRecords) {
    const paramKey = record.parameterKey || record.kpiId || '';
    if (!paramKey) continue;

    const lowerKey = paramKey.toLowerCase();
    let predictedVal: number | undefined = undefined;
    const pred = input.predictedMetrics || {};

    if (lowerKey === 'ph' || lowerKey.includes('ph')) {
      predictedVal = pred.pH;
    } else if (lowerKey === 'viscosity' || lowerKey.includes('visco')) {
      predictedVal = pred.viscosityCps;
    } else if (lowerKey === 'activesurfactants' || lowerKey.includes('surfactant')) {
      predictedVal = pred.activeSurfactantsPct;
    } else if (lowerKey === 'activematter' || lowerKey.includes('matter') || lowerKey.includes('solids')) {
      predictedVal = pred.activeMatterPct ?? pred.activeSurfactantsPct;
    } else if (lowerKey === 'cleaningscore' || lowerKey === 'cpi' || lowerKey.includes('detergency') || lowerKey.includes('soil')) {
      predictedVal = pred.cpi;
    } else if (lowerKey === 'density' || lowerKey.includes('bulkdensity')) {
      predictedVal = pred.densityGCm3;
    }

    if (predictedVal !== undefined && typeof record.value === 'number' && !isNaN(record.value)) {
      const absErr = Number(Math.abs(record.value - predictedVal).toFixed(2));
      const pctErr = predictedVal > 0.001 ? Number(((absErr / Math.abs(predictedVal)) * 100).toFixed(1)) : undefined;

      const isPass = record.status !== 'OUT_OF_SPEC' && record.qualityStatus !== 'INVALID_MEASUREMENT';
      if (!isPass) hasFailedTests = true;

      comparisons.push({
        parameterKey: paramKey,
        parameterName: record.parameterName || paramKey,
        unit: record.unit || '',
        predictedValue: predictedVal,
        measuredValue: record.value,
        absoluteError: absErr,
        percentageError: pctErr,
        isWithinAcceptanceRange: isPass,
        acceptanceRangeDisplay: record.targetRangeDisplay,
        status: isPass ? 'PASS' : 'OUT_OF_SPEC',
        methodRef: record.methodRef || record.instrument,
        testDate: record.testDate,
        operator: record.operator
      });

      completedTests.push(paramKey);
      provenanceMap[paramKey] = record.sourceType === 'USER_ENTERED' ? 'USER_ENTERED_LAB' : 'LABORATORY_MEASURED';
    }
  }

  // Populate default calculated provenance for unmeasured parameters
  for (const [key, val] of Object.entries(input.predictedMetrics || {})) {
    if (val !== undefined && !provenanceMap[key]) {
      provenanceMap[key] = 'CALCULATED';
    }
  }

  const missingTests = requiredBattery.filter(req => !completedTests.some(c => c.toLowerCase() === req.toLowerCase()));

  // Determine Scientific Validation State
  let validationState: ScientificValidationState = 'CALCULATED';

  // Strict check that every required parameter has at least one matching record that is permitted to be LAB_VALIDATED
  const allBatteryTestsValidated = requiredBattery.every(req => {
    const matchingRecords = validVersionRecords.filter(r => (r.parameterKey || r.kpiId || '').toLowerCase() === req.toLowerCase());
    return matchingRecords.length > 0 && matchingRecords.every(r => canPromoteToLabValidated(r).allowed);
  });

  if (hasFailedTests) {
    validationState = 'LAB_FAILED';
  } else if (completedTests.length > 0 && missingTests.length === 0 && allBatteryTestsValidated) {
    validationState = 'LAB_VALIDATED';
  } else if (completedTests.length > 0) {
    validationState = 'LAB_TESTED';
  } else if (input.isComputationallyValid) {
    validationState = 'SCIENTIFICALLY_SCREENED';
  } else {
    validationState = 'CALCULATED';
  }

  // Determine Formula Readiness Level
  let readinessLevel: FormulaReadinessLevel = 'COMPUTATIONAL_READY';
  const hasBlockingIssues = (input.qualityGateFindings?.blockingIssuesCount ?? 0) > 0;

  if (validationState === 'LAB_VALIDATED' && !hasBlockingIssues) {
    // Production ready requires full lab validation AND clean quality gate
    readinessLevel = 'PRODUCTION_READY';
  } else if (validationState === 'LAB_VALIDATED') {
    readinessLevel = 'LAB_VALIDATED';
  } else if (validationState === 'LAB_TESTED') {
    readinessLevel = 'LAB_READY';
  } else if (input.isComputationallyValid && !hasBlockingIssues) {
    readinessLevel = 'LAB_READY';
  } else {
    readinessLevel = 'COMPUTATIONAL_READY';
  }

  const isLabValidated = validationState === 'LAB_VALIDATED';
  const isComputationallyReady = Boolean(input.isComputationallyValid && !hasBlockingIssues);
  const isProductionReady = readinessLevel === 'PRODUCTION_READY';

  let summaryMessage = '';
  if (validationState === 'LAB_VALIDATED') {
    summaryMessage = `Formulation v${targetVersion} is laboratory validated across all mandatory category test parameters.`;
  } else if (validationState === 'LAB_TESTED') {
    summaryMessage = `Formulation v${targetVersion} has partial laboratory evidence (${completedTests.length}/${requiredBattery.length} parameters tested). Physical bench validation in progress.`;
  } else if (validationState === 'LAB_FAILED') {
    summaryMessage = `Formulation v${targetVersion} failed one or more empirical laboratory acceptance criteria. Re-formulation required.`;
  } else if (input.isComputationallyValid) {
    summaryMessage = `Formulation v${targetVersion} has passed all mathematical and chemical screening rules. Bench laboratory validation required before scale-up.`;
  } else {
    summaryMessage = `Formulation v${targetVersion} contains computational specification or compatibility errors.`;
  }

  const scientificDisclaimer = 'Calculated metrics are derived from theoretical chemical equilibria and empirical surfactant models. Laboratory physical testing (ASTM/ISO/AATCC) is mandatory to certify commercial claims and product safety.';

  return {
    formulaId: targetId,
    formulaVersion: targetVersion,
    category,
    validationState,
    readinessLevel,
    isLabValidated,
    isComputationallyReady,
    isProductionReady,
    comparisons,
    requiredTestsBattery: requiredBattery,
    completedTests,
    missingTests,
    hasFailedTests,
    hasOutdatedEvidence,
    provenanceMap,
    summaryMessage,
    scientificDisclaimer
  };
}

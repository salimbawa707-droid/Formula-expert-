/**
 * ============================================================================
 * AUTHORITATIVE EMPIRICAL VALIDATION & PREDICTION-VS-ACTUAL EVALUATION ENGINE
 * ============================================================================
 * Evaluates real-world laboratory observations against scientific predictions.
 * Computes MAE, RMSE, Bias, Residual Variance, Confidence Intervals,
 * Independent Batch Counts, Out-of-Domain Coverage, and assigns Scientific
 * Maturity according to strict evidence gates.
 * ============================================================================
 */

import { CompleteLaboratoryObservation, validateLaboratoryObservation } from './empiricalLabObservationModel';
import { ModelValidationStatus15, DataSplittingEngine, LeakageAuditResult } from './empiricalCalibrationEngine';
import { ScientificMaturity } from '../domain/scientificCertainty/types';
import { CANONICAL_PRODUCT_CATEGORY_IDS, ProductCategoryId, getProductCategory } from '../domain/productTaxonomy';

export interface EmpiricalTargetConfig {
  targetId: string;
  property: string;
  unit: string;
  primaryMetric: 'MAE' | 'RMSE' | 'MAPE';
  acceptanceThreshold: number;
  minIndependentBatches: number;
  minIndependentObservations: number;
  description: string;
  testMethod: string;
}

export const CANONICAL_EMPIRICAL_TARGETS: Record<string, EmpiricalTargetConfig> = {
  'pH Prediction': {
    targetId: 'target-ph-prediction',
    property: 'pH Prediction',
    unit: 'pH units',
    primaryMetric: 'MAE',
    acceptanceThreshold: 0.15,
    minIndependentBatches: 5,
    minIndependentObservations: 15,
    description: 'Direct potentiometric glass electrode measurement (ASTM D1172)',
    testMethod: 'ASTM-D1172'
  },
  'Density': {
    targetId: 'target-density-prediction',
    property: 'Density',
    unit: 'g/cm³',
    primaryMetric: 'MAE',
    acceptanceThreshold: 0.015,
    minIndependentBatches: 5,
    minIndependentObservations: 15,
    description: 'Finished-product density at a declared temperature using a product-appropriate registered protocol; ASTM D1298 is petroleum-only and is not accepted for detergents.',
    testMethod: 'PRODUCT_DENSITY_METHOD_REQUIRED'
  },
  'Active Matter': {
    targetId: 'target-active-matter',
    property: 'Active Matter',
    unit: '%',
    primaryMetric: 'MAE',
    acceptanceThreshold: 0.50,
    minIndependentBatches: 5,
    minIndependentObservations: 15,
    description: 'Two-phase titration / analytical surfactant assay (ISO 2271 / ASTM D1681)',
    testMethod: 'ISO-2271'
  },
  'Viscosity': {
    targetId: 'target-viscosity-prediction',
    property: 'Viscosity',
    unit: 'cP',
    primaryMetric: 'MAPE',
    acceptanceThreshold: 15.0, // 15% relative error
    minIndependentBatches: 5,
    minIndependentObservations: 15,
    description: 'Rotational viscometry using the applicable ASTM D2196 procedure with geometry/shear conditions, sample preparation, and temperature recorded.',
    testMethod: 'ASTM-D2196'
  },
  'Cleaning Score / CPI': {
    targetId: 'target-cleaning-cpi',
    property: 'Cleaning Score / CPI',
    unit: 'points (0-100)',
    primaryMetric: 'MAE',
    acceptanceThreshold: 5.0,
    minIndependentBatches: 5,
    minIndependentObservations: 20,
    description: 'Artificially soiled fabric screening (ASTM D3050-26); soil selection must be documented and results are not suitable for detergent ranking.',
    testMethod: 'ASTM-D3050'
  }
};
export const MIN_WITHIN_ACCEPTANCE_TARGET_PCT = 90;

/** Category-specific lab scorecard. These are measurement targets, not claims of validation. */
export const CATEGORY_EMPIRICAL_SCORECARDS: Record<ProductCategoryId, {
  requiredTargets: string[];
  engineGroups: string[];
}> = Object.fromEntries(CANONICAL_PRODUCT_CATEGORY_IDS.map(category => {
  const applicability = getProductCategory(category)?.categoryApplicability;
  const engineGroups = ['Formula identity / mass balance', 'pH / neutralization', 'active matter', 'density / stability', 'regulatory / cost QA'];
  if (applicability?.hlb || applicability?.cmc) engineGroups.push('surfactant / HLB / CMC');
  if (applicability?.viscosity) engineGroups.push('rheology / viscosity');
  if (applicability?.cleaningScore) engineGroups.push('cleaning performance');
  if (applicability?.foam) engineGroups.push('foam performance');
  if (applicability?.builder) engineGroups.push('hardness / builder / chelation');
  if (category === 'LAUNDRY_POWDER') engineGroups.push('powder flow / dissolution');
  if (category === 'FABRIC_SOFTENER') engineGroups.push('fabric conditioning / cationic compatibility');
  if (category === 'GLASS_CLEANER') engineGroups.push('streaking / residue');
  return [category, {
  requiredTargets: category === 'LAUNDRY_POWDER'
    ? ['pH Prediction', 'Bulk Density', 'Active Matter', 'Cleaning Score / CPI', 'Dissolution / Residue']
    : category === 'DISHWASH_MANUAL'
      ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Grease Removal / Plate Count']
      : category === 'DISHWASH_AUTOMATIC'
        ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Spotting / Film']
        : category === 'FLOOR_CLEANER' || category === 'MULTIPURPOSE_CLEANER'
          ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Soil Removal / Residue']
          : category === 'TOILET_CLEANER'
            ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Scale Removal / Corrosion Compatibility']
            : category === 'BATHROOM_CLEANER'
              ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Scale / Soap Scum Removal']
              : category === 'GLASS_CLEANER'
                ? ['pH Prediction', 'Density', 'Active Matter', 'Streaking / Haze', 'Evaporation Residue']
                : category === 'FABRIC_SOFTENER'
                  ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Softening / Antistatic Performance']
                  : category === 'HAND_WASH'
                    ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Soil Removal / Mildness']
                    : category === 'KITCHEN_DEGREASER'
                      ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Grease Removal / Substrate Compatibility']
                      : category === 'CAR_SHAMPOO'
                        ? ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Soil Removal / Paint Safety']
                        : ['pH Prediction', 'Density', 'Active Matter', 'Viscosity', 'Cleaning Score / CPI'],
  engineGroups
  }];
})) as Record<ProductCategoryId, { requiredTargets: string[]; engineGroups: string[] }>;

export function getCategoryEmpiricalCoverage(observations: CompleteLaboratoryObservation[]) {
  return CANONICAL_PRODUCT_CATEGORY_IDS.map(category => {
    const scorecard = CATEGORY_EMPIRICAL_SCORECARDS[category];
    const categoryObs = observations.filter(o => o.productCategory === category);
    const targetStatus = scorecard.requiredTargets.map(property => {
      const matched = categoryObs.filter(o => isObservationForProperty(o.measuredProperty, property));
      const eligible = matched.filter(o => o.dataOrigin === 'REAL_LAB_MEASUREMENT' && o.dataQualityStatus === 'APPROVED_FOR_VALIDATION' && validateLaboratoryObservation(o).status === 'APPROVED_FOR_VALIDATION');
      return { property, observationCount: matched.length, approvedRealLabCount: eligible.length,
        status: eligible.length ? 'EVIDENCE_AVAILABLE' as const : 'DATA_PENDING' as const };
    });
    return { category, requiredTargetCount: targetStatus.length,
      evidenceAvailableCount: targetStatus.filter(t => t.status === 'EVIDENCE_AVAILABLE').length,
      observations: categoryObs.length, targetStatus, engineGroups: scorecard.engineGroups };
  });
}

function isObservationForProperty(measuredProperty: string, property: string): boolean {
  const measured = measuredProperty.trim().toLowerCase();
  const target = property.toLowerCase();
  if (target === 'pH Prediction'.toLowerCase()) return measured === 'ph' || measured === target;
  if (target === 'Cleaning Score / CPI'.toLowerCase()) return ['cleaning score / cpi', 'cleaning score', 'cpi'].includes(measured);
  return measured === target;
}

export interface DetailedPredictionComparisonRecord {
  observationId: string;
  batchId: string;
  formulaFingerprint: string;
  predictedValue: number;
  measuredValue: number;
  rawMeasuredValue: number;
  rawUnit: string;
  residual: number; // predicted - measured
  absoluteError: number;
  relativeErrorPct: number;
  isWithinAcceptance: boolean;
  isInDomain: boolean;
  testDate: string;
  operator: string;
  testMethod: string;
}

export interface EmpiricalPropertyEvaluationResult {
  property: string;
  unit: string;
  datasetVersion: string;
  totalObservationCount: number;
  acceptedRecordCount: number;
  independentBatchCount: number;
  uniqueFormulaCount: number;
  outOfDomainRecordCount: number;
  excludedRecordCount: number;
  
  // Statistical Error Metrics
  mae: number | null;
  rmse: number | null;
  meanSignedBias: number | null;
  residualVariance: number | null;
  standardErrorOfMean: number | null;
  r2?: number;

  // Statistical Confidence Interval on Mean Error (Student's t)
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidenceLevel: number;
    degreesOfFreedom: number;
    assumptions: string;
  };

  // Prediction Interval for Individual Observation
  predictionInterval?: {
    lower: number;
    upper: number;
    confidenceLevel: number;
    assumptions: string;
  };

  // Leakage Audit Result
  leakageAudit: LeakageAuditResult;

  // Acceptance Gate & Scientific Maturity
  primaryMetric: 'MAE' | 'RMSE' | 'MAPE';
  acceptanceThreshold: number;
  isAcceptanceThresholdMet: boolean;
  isBatchSufficiencyMet: boolean;
  validationGateVerdict: ModelValidationStatus15;
  assignedScientificMaturity: ScientificMaturity;
  gateReasons: string[];

  // Detailed Comparisons
  comparisons: DetailedPredictionComparisonRecord[];
  withinAcceptanceRatePct?: number;
  validationObservationCount?: number;
  hasRegisteredTarget: boolean;
}

export class EmpiricalValidationEvaluationEngine {
  /**
   * Evaluates prediction-vs-actual performance for a specific property using real lab observations.
   */
  public static evaluatePropertyAgainstLabData(input: {
    property: string;
    predictionsMap: Map<string, number>; // formulaFingerprint or observationId -> predictedValue
    observations: CompleteLaboratoryObservation[];
    datasetVersion?: string;
    category?: ProductCategoryId;
  }): EmpiricalPropertyEvaluationResult {
    const { property, predictionsMap, observations, datasetVersion = 'DS-CURRENT', category } = input;
    const hasRegisteredTarget = Boolean(CANONICAL_EMPIRICAL_TARGETS[property]);
    const targetConfig = CANONICAL_EMPIRICAL_TARGETS[property] || {
      targetId: `target-${property.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      property,
      unit: 'units',
      primaryMetric: 'MAE',
      acceptanceThreshold: 0,
      minIndependentBatches: 5,
      minIndependentObservations: 15,
      description: `Empirical evaluation for ${property}`,
      testMethod: 'UNCONFIGURED'
    };

    // Filter relevant observations
    const propObs = observations.filter(o => isObservationForProperty(o.measuredProperty, property) && (!category || o.productCategory === category));

    // If zero real observations exist: Strict honest empty return
    if (propObs.length === 0) {
      return {
        property,
        unit: targetConfig.unit,
        datasetVersion,
        totalObservationCount: 0,
        acceptedRecordCount: 0,
        independentBatchCount: 0,
        uniqueFormulaCount: 0,
        outOfDomainRecordCount: 0,
        excludedRecordCount: 0,
        mae: null,
        rmse: null,
        meanSignedBias: null,
        residualVariance: null,
        standardErrorOfMean: null,
        leakageAudit: {
          passed: false,
          overlappingFingerprints: [],
          overlappingBatches: [],
          message: 'Leakage audit not evaluated because the dataset contains no observations.'
        },
        primaryMetric: targetConfig.primaryMetric,
        acceptanceThreshold: targetConfig.acceptanceThreshold,
        isAcceptanceThresholdMet: false,
        isBatchSufficiencyMet: false,
        validationGateVerdict: 'DATA_PENDING',
        assignedScientificMaturity: 'MODEL_PREDICTION',
        gateReasons: [
          'Laboratory validation pending — no qualifying real laboratory dataset is available for this prediction target.'
        ],
        comparisons: [],
        hasRegisteredTarget
      };
    }

    // Filter for real experimental data origin firewall
    const validRealObs = propObs.filter(o =>
      o.dataOrigin === 'REAL_LAB_MEASUREMENT' && 
      o.dataQualityStatus === 'APPROVED_FOR_VALIDATION' &&
      validateLaboratoryObservation(o).status === 'APPROVED_FOR_VALIDATION'
    );
    const excludedCount = propObs.length - validRealObs.length;

    // Formula-level holdout: never report calibration rows as independent validation metrics.
    let evaluationObs: CompleteLaboratoryObservation[] = [];
    let splitAudit: LeakageAuditResult = {
      passed: false, overlappingFingerprints: [], overlappingBatches: [],
      message: 'Independent holdout unavailable; at least two distinct formula fingerprints with eligible real-lab observations are required.'
    };
    if (new Set(validRealObs.map(o => o.formulaFingerprint)).size >= 2) {
      const split = DataSplittingEngine.splitDatasetGrouped(validRealObs, 0.7);
      evaluationObs = split.independentValidationSet;
      splitAudit = split.audit;
    }

    // Build comparisons
    const comparisons: DetailedPredictionComparisonRecord[] = [];
    const predictedArr: number[] = [];
    const measuredArr: number[] = [];
    let outOfDomainCount = 0;

    for (const obs of evaluationObs) {
      let predVal = predictionsMap.get(obs.observationId);
      if (predVal === undefined) predVal = predictionsMap.get(obs.formulaFingerprint);
      // If no prediction available for this formula, skip
      if (predVal === undefined || isNaN(predVal) || !isFinite(predVal)) continue;

      const measVal = obs.measuredValue;
      if (typeof measVal !== 'number' || isNaN(measVal) || !isFinite(measVal)) continue;

      const residual = predVal - measVal;
      const absErr = Math.abs(residual);
      const relErrPct = measVal !== 0 ? (absErr / Math.abs(measVal)) * 100 : 0;
      const isWithin = hasRegisteredTarget && (targetConfig.primaryMetric === 'MAPE'
        ? relErrPct <= targetConfig.acceptanceThreshold
        : absErr <= targetConfig.acceptanceThreshold);

      // Check applicability domain if ranges available
      let inDomain = true;
      if (obs.temperatureC && (obs.temperatureC < 10 || obs.temperatureC > 60)) inDomain = false;
      if (obs.waterProfile?.hardnessPpm && obs.waterProfile.hardnessPpm > 600) inDomain = false;
      if (!inDomain) outOfDomainCount++;

      comparisons.push({
        observationId: obs.observationId,
        batchId: obs.batchId,
        formulaFingerprint: obs.formulaFingerprint,
        predictedValue: Number(predVal.toFixed(3)),
        measuredValue: Number(measVal.toFixed(3)),
        rawMeasuredValue: obs.rawMeasuredValue ?? measVal,
        rawUnit: obs.rawMeasurementUnit ?? obs.measurementUnit,
        residual: Number(residual.toFixed(4)),
        absoluteError: Number(absErr.toFixed(4)),
        relativeErrorPct: Number(relErrPct.toFixed(2)),
        isWithinAcceptance: isWithin,
        isInDomain: inDomain,
        testDate: obs.testDate,
        operator: obs.operator,
        testMethod: obs.testMethodId
      });

      predictedArr.push(predVal);
      measuredArr.push(measVal);
    }

    const n = comparisons.length;
    if (n === 0) {
      return {
        property,
        unit: targetConfig.unit,
        datasetVersion,
        totalObservationCount: propObs.length,
        acceptedRecordCount: 0,
        independentBatchCount: 0,
        uniqueFormulaCount: 0,
        outOfDomainRecordCount: outOfDomainCount,
        excludedRecordCount: excludedCount,
        mae: null,
        rmse: null,
        meanSignedBias: null,
        residualVariance: null,
        standardErrorOfMean: null,
        leakageAudit: {
          passed: false,
          overlappingFingerprints: [],
          overlappingBatches: [],
          message: 'Leakage audit not evaluated because no comparable prediction/measurement pairs were available.'
        },
        primaryMetric: targetConfig.primaryMetric,
        acceptanceThreshold: targetConfig.acceptanceThreshold,
        isAcceptanceThresholdMet: false,
        isBatchSufficiencyMet: false,
        validationGateVerdict: validRealObs.length ? 'DATA_INSUFFICIENT' : 'DATA_PENDING',
        assignedScientificMaturity: 'MODEL_PREDICTION',
        gateReasons: [
          validRealObs.length
            ? 'No independent formula holdout with matching prediction values is available. Calibration observations are excluded from validation metrics.'
            : 'No comparable approved real-lab observations are available for this target and category.'
        ],
        comparisons: [],
        hasRegisteredTarget
      };
    }

    // Compute MAE, RMSE, Mean Signed Error (Bias)
    const sumAbs = comparisons.reduce((acc, c) => acc + c.absoluteError, 0);
    const sumSq = comparisons.reduce((acc, c) => acc + (c.residual * c.residual), 0);
    const sumSigned = comparisons.reduce((acc, c) => acc + c.residual, 0);

    const mae = Number((sumAbs / n).toFixed(4));
    const rmse = Number((Math.sqrt(sumSq / n)).toFixed(4));
    const bias = Number((sumSigned / n).toFixed(4));

    // Residual Variance: s^2 = sum((e_i - bias)^2) / (n - 1)
    const residualVariance = n > 1
      ? Number((comparisons.reduce((acc, c) => acc + Math.pow(c.residual - bias, 2), 0) / (n - 1)).toFixed(6))
      : 0;

    const stdError = n > 1 ? Number((Math.sqrt(residualVariance / n)).toFixed(5)) : 0;

    // R2 Calculation vs measured mean
    const meanMeas = measuredArr.reduce((a, b) => a + b, 0) / n;
    const ssTot = measuredArr.reduce((acc, m) => acc + Math.pow(m - meanMeas, 2), 0);
    const r2 = (n >= 2 && ssTot > 0)
      ? Number((1 - (sumSq / ssTot)).toFixed(4))
      : undefined;

    // Degrees of Freedom and Student's t critical values for 95% confidence
    const df = n - 1;
    let tCrit = 1.96;
    if (df === 1) tCrit = 12.706;
    else if (df === 2) tCrit = 4.303;
    else if (df === 3) tCrit = 3.182;
    else if (df === 4) tCrit = 2.776;
    else if (df <= 10) tCrit = 2.228;
    else if (df <= 20) tCrit = 2.086;
    else if (df <= 30) tCrit = 2.042;
    else tCrit = 1.960;

    // Confidence Interval on Mean Bias
    const marginOfError = tCrit * stdError;
    const confidenceInterval = n >= 5 ? {
      lower: Number((bias - marginOfError).toFixed(4)),
      upper: Number((bias + marginOfError).toFixed(4)),
      confidenceLevel: 0.95,
      degreesOfFreedom: df,
      assumptions: "Student's t distribution on residuals; assumes independent and identically distributed normal errors."
    } : undefined;

    // Prediction Interval for an individual observation
    const predMargin = tCrit * Math.sqrt(residualVariance * (1 + (1 / n)));
    const predictionInterval = n >= 5 ? {
      lower: Number((bias - predMargin).toFixed(4)),
      upper: Number((bias + predMargin).toFixed(4)),
      confidenceLevel: 0.95,
      assumptions: "Prediction interval covers single future observation with 95% probability assuming residual homoscedasticity."
    } : undefined;

    // Independent batches & formulas counts
    const uniqueBatches = new Set(comparisons.map(c => c.batchId)).size;
    const uniqueFormulas = new Set(comparisons.map(c => c.formulaFingerprint)).size;

    // Leakage Audit using DataSplittingEngine
    const leakageAudit = splitAudit;

    // Metric Acceptance Check
    const mape = comparisons.reduce((sum, c) => sum + c.relativeErrorPct, 0) / n;
    const withinAcceptanceRatePct = Number((comparisons.filter(c => c.isWithinAcceptance).length / n * 100).toFixed(2));
    const metricValue = targetConfig.primaryMetric === 'RMSE' ? rmse : targetConfig.primaryMetric === 'MAPE' ? mape : mae;
    const isThresholdMet = hasRegisteredTarget && metricValue <= targetConfig.acceptanceThreshold;
    const isBatchSufficiencyMet = uniqueBatches >= targetConfig.minIndependentBatches && n >= targetConfig.minIndependentObservations;

    // Determine Final Gate Verdict and Maturity
    const gateReasons: string[] = [];
    if (!isThresholdMet) {
      gateReasons.push(hasRegisteredTarget
        ? `Error threshold not met: achieved ${targetConfig.primaryMetric} = ${metricValue} exceeds threshold ${targetConfig.acceptanceThreshold} ${targetConfig.unit}.`
        : 'No registered test method and acceptance threshold exist for this property; comparison is exploratory and cannot validate the model.');
    }
    if (withinAcceptanceRatePct < MIN_WITHIN_ACCEPTANCE_TARGET_PCT) {
      gateReasons.push(`Within-tolerance holdout rate ${withinAcceptanceRatePct}% is below the ${MIN_WITHIN_ACCEPTANCE_TARGET_PCT}% target.`);
    }
    if (!isBatchSufficiencyMet) {
      gateReasons.push(`Insufficient independent sample size: ${uniqueBatches}/${targetConfig.minIndependentBatches} batches, ${n}/${targetConfig.minIndependentObservations} observations.`);
    }
    if (!leakageAudit.passed) {
      gateReasons.push(`Data leakage detected across train/test partitions: ${leakageAudit.overlappingBatches.length} shared batches.`);
    }
    if (outOfDomainCount > 0) {
      gateReasons.push(`${outOfDomainCount} observations evaluated outside supported empirical applicability domain.`);
    }

    let verdict: ModelValidationStatus15 = 'LAB_VALIDATED';
    let maturity: ScientificMaturity = 'LAB_VALIDATED';

    if (gateReasons.length > 0) {
      if (!isBatchSufficiencyMet) {
        verdict = 'DATA_INSUFFICIENT';
        maturity = 'EMPIRICALLY_CALIBRATED';
      } else {
        verdict = 'VALIDATED_WITH_LIMITATIONS';
        maturity = 'EMPIRICALLY_CALIBRATED';
      }
    } else {
      verdict = 'LAB_VALIDATED';
      maturity = 'LAB_VALIDATED';
      gateReasons.push(`All empirical criteria satisfied: MAE=${mae} ${targetConfig.unit}, ${uniqueBatches} independent batches, zero data leakage.`);
    }

    return {
      property,
      unit: targetConfig.unit,
      datasetVersion,
      totalObservationCount: propObs.length,
      acceptedRecordCount: n,
      independentBatchCount: uniqueBatches,
      uniqueFormulaCount: uniqueFormulas,
      outOfDomainRecordCount: outOfDomainCount,
      excludedRecordCount: excludedCount,
      mae,
      rmse,
      meanSignedBias: bias,
      residualVariance,
      standardErrorOfMean: stdError,
      r2,
      confidenceInterval,
      predictionInterval,
      leakageAudit,
      primaryMetric: targetConfig.primaryMetric,
      acceptanceThreshold: targetConfig.acceptanceThreshold,
      isAcceptanceThresholdMet: isThresholdMet,
      isBatchSufficiencyMet,
      validationGateVerdict: verdict,
      assignedScientificMaturity: maturity,
      gateReasons,
      comparisons,
      withinAcceptanceRatePct,
      validationObservationCount: n,
      hasRegisteredTarget
    };
  }
}

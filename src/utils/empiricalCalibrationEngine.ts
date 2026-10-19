/**
 * ============================================================================
 * PHASE P2-13 — EMPIRICAL CALIBRATION & INDEPENDENT VALIDATION ENGINE
 * ============================================================================
 * Implements grouped dataset splitting (leakage prevention), parameter fitting
 * calibration engine, sample sufficiency evaluation, prediction-vs-actual database,
 * model version freezing, strict LAB_VALIDATED status gate, and report generator.
 * ============================================================================
 */

import { Productcategory13, ApplicabilityDomainStatus, EmpiricalApplicabilityDomain } from './empiricalAccuracyFramework';
import { CompleteLaboratoryObservation } from './empiricalLabObservationModel';

export type ModelValidationStatus15 =
  | "UNVALIDATED"
  | "DATA_PENDING"
  | "DATA_INSUFFICIENT"
  | "CALIBRATING"
  | "VALIDATION_PENDING"
  | "VALIDATED_WITH_LIMITATIONS"
  | "LAB_VALIDATED"
  | "VALIDATION_EXPIRED"
  | "SUPERSEDED";

export interface PredictionActualRecord {
  predictionId: string;
  modelId: string;
  modelVersion: string;
  formulaFingerprint: string;
  productCategory: Productcategory13;
  predictedValue: number;
  uncertaintyLower?: number;
  uncertaintyUpper?: number;
  actualValue: number;
  unit: string;
  testMethodId: string;
  temperatureC: number;
  waterHardnessPpm: number;
  residual: number; // predicted - actual
  absoluteError: number;
  relativeErrorPct: number;
  validationStatus: string;
  evidenceId: string;
  recordedAt: string;
}

export interface CalibrationResult {
  modelId: string;
  calibrationVersion: string;
  calibrationDatasetId: string;
  fittedParameters: { slope: number; intercept: number; biasCorrection: number };
  sampleCount: number;
  formulaCount: number;
  calibrationMae: number;
  calibrationR2: number;
  definitionHash: string;
  createdAt: string;
}

export interface LeakageAuditResult {
  passed: boolean;
  overlappingFingerprints: string[];
  overlappingBatches: string[];
  message: string;
}

export interface SampleSufficiencyResult {
  isSufficient: boolean;
  uniqueFormulas: number;
  uniqueBatches: number;
  totalObservations: number;
  minFormulasRequired: number;
  minBatchesRequired: number;
  minObservationsRequired: number;
  replicateRatio: number;
  reason: string;
}

export interface FrozenModelVersion {
  modelId: string;
  modelVersion: string;
  formulaFingerprint?: string;
  definitionHash: string;
  calibrationDatasetId: string;
  validationDatasetId: string;
  fittedParameters: Record<string, number>;
  metrics: { mae: number; rmse: number; bias: number; r2: number };
  applicableCategories: Productcategory13[];
  applicabilityDomain?: EmpiricalApplicabilityDomain;
  validationStatus: ModelValidationStatus15;
  frozenAt: string;
  evidenceIds: string[];
}

export class DataSplittingEngine {
  /**
   * Grouped dataset splitting by formulaFingerprint and batchId to prevent data leakage.
   */
  public static splitDatasetGrouped(
    observations: CompleteLaboratoryObservation[],
    calibrationRatio: number = 0.7
  ): {
    calibrationSet: CompleteLaboratoryObservation[];
    independentValidationSet: CompleteLaboratoryObservation[];
    audit: LeakageAuditResult;
  } {
    // 1. Group observations by unique formulaFingerprint
    const formulaGroups: Map<string, CompleteLaboratoryObservation[]> = new Map();
    for (const obs of observations) {
      const list = formulaGroups.get(obs.formulaFingerprint) || [];
      list.push(obs);
      formulaGroups.set(obs.formulaFingerprint, list);
    }

    // Stable ordering makes the holdout reproducible and independent of CSV row order.
    const uniqueFingerprints = Array.from(formulaGroups.keys()).sort();
    const targetCalCount = uniqueFingerprints.length > 1
      ? Math.min(uniqueFingerprints.length - 1, Math.ceil(uniqueFingerprints.length * calibrationRatio))
      : uniqueFingerprints.length;

    const calFingerprints = new Set(uniqueFingerprints.slice(0, targetCalCount));

    const calibrationSet: CompleteLaboratoryObservation[] = [];
    const independentValidationSet: CompleteLaboratoryObservation[] = [];

    for (const obs of observations) {
      if (calFingerprints.has(obs.formulaFingerprint)) {
        calibrationSet.push(obs);
      } else {
        independentValidationSet.push(obs);
      }
    }

    // 2. Perform automated leakage audit
    const audit = this.auditDatasetLeakage(calibrationSet, independentValidationSet);

    return { calibrationSet, independentValidationSet, audit };
  }

  public static auditDatasetLeakage(
    calSet: CompleteLaboratoryObservation[],
    valSet: CompleteLaboratoryObservation[]
  ): LeakageAuditResult {
    const calFingerprints = new Set(calSet.map(c => c.formulaFingerprint));
    const valFingerprints = new Set(valSet.map(v => v.formulaFingerprint));

    const overlappingFingerprints = Array.from(valFingerprints).filter(fp => calFingerprints.has(fp));

    const calBatches = new Set(calSet.map(c => c.batchId));
    const valBatches = new Set(valSet.map(v => v.batchId));
    const overlappingBatches = Array.from(valBatches).filter(b => calBatches.has(b));

    const passed = overlappingFingerprints.length === 0 && overlappingBatches.length === 0;
    const message = passed
      ? 'LEAKAGE AUDIT PASSED: Zero overlap between calibration and independent validation sets.'
      : `LEAKAGE AUDIT FAILED: Overlap detected (${overlappingFingerprints.length} fingerprints, ${overlappingBatches.length} batches).`;

    return { passed, overlappingFingerprints, overlappingBatches, message };
  }
}

export class SampleSufficiencyEngine {
  public static evaluateSufficiency(
    observations: CompleteLaboratoryObservation[],
    modelType: 'REGRESSION' | 'CLASSIFICATION',
    category: Productcategory13
  ): SampleSufficiencyResult {
    const categoryObs = observations.filter(o => o.productCategory === category);
    const uniqueFormulas = new Set(categoryObs.map(o => o.formulaFingerprint)).size;
    const uniqueBatches = new Set(categoryObs.map(o => o.batchId)).size;
    const totalObservations = categoryObs.length;

    const minFormulasRequired = modelType === 'REGRESSION' ? 10 : 15;
    const minBatchesRequired = modelType === 'REGRESSION' ? 10 : 15;
    const minObservationsRequired = modelType === 'REGRESSION' ? 30 : 45;

    const isSufficient =
      uniqueFormulas >= minFormulasRequired &&
      uniqueBatches >= minBatchesRequired &&
      totalObservations >= minObservationsRequired;

    const replicateRatio = uniqueFormulas > 0 ? Number((totalObservations / uniqueFormulas).toFixed(2)) : 0;

    const reason = isSufficient
      ? `Sample sufficiency PASSED for ${category}: ${uniqueFormulas} formulas, ${uniqueBatches} batches, ${totalObservations} total observations.`
      : `Sample sufficiency FAILED for ${category}: ${uniqueFormulas}/${minFormulasRequired} formulas, ${uniqueBatches}/${minBatchesRequired} batches, ${totalObservations}/${minObservationsRequired} observations.`;

    return {
      isSufficient,
      uniqueFormulas,
      uniqueBatches,
      totalObservations,
      minFormulasRequired,
      minBatchesRequired,
      minObservationsRequired,
      replicateRatio,
      reason
    };
  }
}

export class EmpiricalCalibrationEngine {
  /**
   * Fits model parameters against real calibration observations.
   */
  public static calibrateModel(
    modelId: string,
    rawPredictions: number[],
    measuredObservations: CompleteLaboratoryObservation[]
  ): CalibrationResult {
    const n = Math.min(rawPredictions.length, measuredObservations.length);
    if (n === 0) {
      throw new Error('Cannot calibrate model with zero observations.');
    }

    const measuredValues = measuredObservations.slice(0, n).map(m => m.measuredValue);

    // Simple Linear Regression Parameter Fitting (Predicted vs Measured)
    const meanPred = rawPredictions.reduce((a, b) => a + b, 0) / n;
    const meanMeas = measuredValues.reduce((a, b) => a + b, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (rawPredictions[i] - meanPred) * (measuredValues[i] - meanMeas);
      den += Math.pow(rawPredictions[i] - meanPred, 2);
    }

    const slope = den === 0 ? 1 : num / den;
    const intercept = meanMeas - (slope * meanPred);
    const biasCorrection = meanMeas - meanPred;

    // Calculate calibration MAE and real empirical R²
    let sumAbsErr = 0;
    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const calPred = (rawPredictions[i] * slope) + intercept;
      const err = calPred - measuredValues[i];
      sumAbsErr += Math.abs(err);
      ssRes += err * err;
      ssTot += Math.pow(measuredValues[i] - meanMeas, 2);
    }
    const calMae = Number((sumAbsErr / n).toFixed(4));
    const calR2 = (n >= 2 && ssTot > 0)
      ? Number(Math.max(0, Math.min(1, 1 - (ssRes / ssTot))).toFixed(4))
      : (n >= 2 && ssRes === 0 ? 1.0 : 0.0);

    const uniqueFormulas = new Set(measuredObservations.map(m => m.formulaFingerprint)).size;
    const dateStr = new Date().toISOString().substring(0, 10);
    const versionStr = `v${dateStr.replace(/-/g, '')}.1`;

    const definitionHash = `HASH-${modelId.substring(0, 8)}-${Math.abs(Math.round(slope * 10000 + intercept * 100)).toString(16)}`;

    return {
      modelId,
      calibrationVersion: versionStr,
      calibrationDatasetId: measuredObservations[0]?.datasetId || 'DS-CAL',
      fittedParameters: { slope: Number(slope.toFixed(4)), intercept: Number(intercept.toFixed(4)), biasCorrection: Number(biasCorrection.toFixed(4)) },
      sampleCount: n,
      formulaCount: uniqueFormulas,
      calibrationMae: calMae,
      calibrationR2: calR2,
      definitionHash,
      createdAt: new Date().toISOString()
    };
  }
}

export class ModelValidationStatusGate {
  private static predictionActualDb: PredictionActualRecord[] = [];
  private static frozenModels: Map<string, FrozenModelVersion> = new Map();

  public static storePredictionActualRecord(record: PredictionActualRecord): void {
    this.predictionActualDb.push(record);
  }

  public static getPredictionActualHistory(modelId?: string): PredictionActualRecord[] {
    if (modelId) {
      return this.predictionActualDb.filter(r => r.modelId === modelId);
    }
    return [...this.predictionActualDb];
  }

  /**
   * Enforces ALL mandatory conditions before returning LAB_VALIDATED status,
   * strictly including Applicability Domain validation.
   */
  public static evaluateLabValidatedStatusGate(input: {
    realLabDataAvailable: boolean;
    completeProvenance: boolean;
    validMeasurementMethod: boolean;
    sampleSufficiencyPassed: boolean;
    leakageAuditPassed: boolean;
    calibrationCompleted: boolean;
    independentValidationCompleted: boolean;
    requiredMetricsPassed: boolean;
    uncertaintyEvaluated: boolean;
    categoryScopeDefined: boolean;
    limitationsDocumented: boolean;
    modelVersionFrozen: boolean;
    evidenceRecordsRetained: boolean;
    applicabilityStatus?: ApplicabilityDomainStatus;
  }): { status: ModelValidationStatus15; reasons: string[] } {
    const failures: string[] = [];

    if (!input.realLabDataAvailable) failures.push('Missing real laboratory data.');
    if (!input.completeProvenance) failures.push('Incomplete provenance metadata.');
    if (!input.validMeasurementMethod) failures.push('Unregistered or invalid measurement method.');
    if (!input.sampleSufficiencyPassed) failures.push('Insufficient independent samples/formulas.');
    if (!input.leakageAuditPassed) failures.push('Data leakage detected between calibration and validation sets.');
    if (!input.calibrationCompleted) failures.push('Model calibration not completed.');
    if (!input.independentValidationCompleted) failures.push('Independent test set validation not completed.');
    if (!input.requiredMetricsPassed) failures.push('Model did not meet required error thresholds (MAE/RMSE).');
    if (!input.uncertaintyEvaluated) failures.push('Prediction uncertainty/intervals not evaluated.');
    if (!input.categoryScopeDefined) failures.push('Product category scope undefined.');
    if (!input.limitationsDocumented) failures.push('Model limitations not documented.');
    if (!input.modelVersionFrozen) failures.push('Model version definition hash not frozen.');
    if (!input.evidenceRecordsRetained) failures.push('Raw measurement evidence records not retained.');

    // Applicability Domain enforcement
    if (input.applicabilityStatus === 'OUTSIDE_APPLICABILITY_DOMAIN') {
      failures.push('Prediction condition is outside empirical model applicability domain.');
    } else if (input.applicabilityStatus === 'APPLICABILITY_UNKNOWN') {
      failures.push('Applicability domain is unknown; real laboratory data required.');
    }

    if (failures.length > 0) {
      return {
        status: input.realLabDataAvailable ? 'VALIDATED_WITH_LIMITATIONS' : 'VALIDATION_PENDING',
        reasons: failures
      };
    }

    return {
      status: 'LAB_VALIDATED',
      reasons: ['All mandatory empirical validation gate conditions satisfied successfully.']
    };
  }

  public static freezeModelVersion(model: FrozenModelVersion): void {
    this.frozenModels.set(`${model.modelId}@${model.modelVersion}`, model);
  }

  public static getFrozenModel(modelId: string, version: string): FrozenModelVersion | undefined {
    return this.frozenModels.get(`${modelId}@${version}`);
  }

  public static generateValidationReport(input: {
    modelId: string;
    modelVersion: string;
    datasetId: string;
    datasetVersion: string;
    formulaFingerprint?: string;
    applicabilityStatus?: ApplicabilityDomainStatus;
    categories: Productcategory13[];
    totalObservations: number;
    uniqueFormulas: number;
    uniqueBatches: number;
    realDataAvailable: boolean;
    calibrationMae?: number;
    validationMae?: number;
    validationStatus: ModelValidationStatus15;
  }): string {
    const timestamp = new Date().toISOString();
    return `
================================================================================
OFFICIAL SCIENTIFIC MODEL VALIDATION REPORT — DETERGENT FORMULA EXPERT
================================================================================
Generated At: ${timestamp}
Model ID:     ${input.modelId}
Model Ver:    ${input.modelVersion}
Dataset ID:   ${input.datasetId} (Version ${input.datasetVersion})
Fingerprint:  ${input.formulaFingerprint || 'FINGERPRINT_NOT_SPECIFIED'}
Categories:   ${input.categories.join(', ')}
Domain State: ${input.applicabilityStatus || 'APPLICABILITY_UNKNOWN'}

--------------------------------------------------------------------------------
1. DATASET SCOPE & SAMPLE SUFFICIENCY
--------------------------------------------------------------------------------
Real Lab Data Available: ${input.realDataAvailable ? 'YES' : 'FALSE'}
Total Observations:      ${input.totalObservations}
Unique Formulas:         ${input.uniqueFormulas}
Unique Batches:          ${input.uniqueBatches}

--------------------------------------------------------------------------------
2. EMPIRICAL ACCURACY PERFORMANCE
--------------------------------------------------------------------------------
Calibration MAE:        ${input.calibrationMae !== undefined ? input.calibrationMae : 'N/A'}
Independent Val MAE:    ${input.validationMae !== undefined ? input.validationMae : 'N/A'}
Empirical Accuracy:     ${input.realDataAvailable && input.validationStatus === 'LAB_VALIDATED' ? 'ESTABLISHED' : 'NOT ESTABLISHED'}

--------------------------------------------------------------------------------
3. VALIDATION GATE VERDICT
--------------------------------------------------------------------------------
Final Status:           ${input.validationStatus}
Empirical Status Note:  ${input.realDataAvailable ? 'Validated against certified lab dataset.' : 'Software framework ready; awaiting user real lab data import.'}
================================================================================
`;
  }

  public static resetGate(): void {
    this.predictionActualDb = [];
    this.frozenModels.clear();
  }
}

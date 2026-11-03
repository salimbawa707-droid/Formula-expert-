/**
 * Closed-Loop Scientific R&D — Types
 * 
 * Clean-Room TypeScript Data Models for Laboratory Feedback Ingestion,
 * Prediction vs. Measurement Analysis, Scientific Deviation Classification,
 * Feedback Decision Engine, Reformulation Candidate Generation, and Lineage Auditing.
 * 
 * Complies with Prompt 08 Safety & Scientific Architecture.
 * Preserves strict immutability of historical FormulaVersions and LIMS evidence.
 */

import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';
import { ScientificEvidenceLevel, EvidenceVerificationStatus } from '../../domain/lims/types';
import { StandardUnit } from '../specificationEngine/types';

// ============================================================================
// 1. DATA QUALITY & INGESTION ENUMS
// ============================================================================

export type DataQualityStatus =
  | 'VALID'
  | 'INVALID'
  | 'INCOMPLETE'
  | 'CONFLICT_REQUIRES_REVIEW'
  | 'DUPLICATE'
  | 'INSUFFICIENT_DATA'
  | 'REQUIRES_REVIEW';

export type IngestionSourceType =
  | 'LIMS_RECORD'
  | 'OPENTRONS_EXECUTION'
  | 'OPENSPECY_SPECTRAL'
  | 'MANUAL_BENCH_ENTRY'
  | 'INSTRUMENT_CSV_EXPORT'
  | 'THIRD_PARTY_COA';

// ============================================================================
// 2. PREDICTED VS OBSERVED MEASUREMENT MODELS
// ============================================================================

export interface PredictedMeasurement {
  parameterKey: string;
  parameterName: string;
  value: number;
  unit: StandardUnit;
  engineName: string;
  engineVersion: string;
  calculationTimestamp: string;
  acceptableToleranceRange?: {
    min: number;
    max: number;
  };
}

export interface ObservedMeasurement {
  measurementId: string;
  evidenceRecordId: string;
  parameterKey: string;
  parameterName: string;
  value: number;
  unit: StandardUnit;
  method: string;
  instrumentId: string;
  instrumentCalibrationValid: boolean;
  measurementTimestamp: string;
  analyst: string;
  replicateCount: number;
  uncertainty?: number;
  temperatureC?: number;
  evidenceLevel: ScientificEvidenceLevel;
  verificationStatus: EvidenceVerificationStatus;
}

export interface PredictionVsMeasurementComparison {
  parameterKey: string;
  parameterName: string;
  unit: StandardUnit;
  predicted: PredictedMeasurement;
  observed: ObservedMeasurement;
  absoluteDifference: number;
  relativeDifferencePercent: number;
  signedDeviation: number;
  hasUncertainty: boolean;
  uncertaintyFormatted: string;
  isWithinPredictionTolerance: boolean;
  deviationReasoning: string;
}

// ============================================================================
// 3. SCIENTIFIC DEVIATION & SPECIFICATION EVALUATION
// ============================================================================

export type ScientificDeviationState =
  | 'WITHIN_SPECIFICATION'
  | 'OUTSIDE_SPECIFICATION'
  | 'PREDICTION_DEVIATION'
  | 'MEASUREMENT_VARIABILITY'
  | 'INSUFFICIENT_DATA'
  | 'NOT_APPLICABLE'
  | 'NOT_TESTED'
  | 'REQUIRES_REVIEW';

export interface SpecificationEvaluationResult {
  parameterKey: string;
  parameterName: string;
  measuredValue: number;
  unit: StandardUnit;
  targetValue?: number;
  lowerLimit?: number;
  upperLimit?: number;
  isPass: boolean;
  state: ScientificDeviationState;
  method: string;
  evidenceLevel: ScientificEvidenceLevel;
  evaluatorNotes: string;
}

// ============================================================================
// 4. EXPERIMENT RESULT ENTITY
// ============================================================================

export interface ExperimentResult {
  resultId: string;
  experimentId: string;
  formulaId: string;
  formulaVersionId: string;
  batchId: string;
  sampleId: string;
  protocolId?: string;
  protocolVersion?: string;
  protocolHash?: string;
  externalRunId?: string;
  testId: string;
  measurementId: string;
  evidenceRecordId: string;
  parameterKey: string;
  parameterName: string;
  measuredValue: number;
  measuredUnit: StandardUnit;
  measurementTimestamp: string;
  instrumentId: string;
  methodId: string;
  evidenceLevel: ScientificEvidenceLevel;
  verificationStatus: EvidenceVerificationStatus;
  dataQuality: DataQualityStatus;
  ingestionSource: IngestionSourceType;
  ingestedAt: string;
  ingestedBy: string;
}

// ============================================================================
// 5. FEEDBACK DECISION & REFORMULATION MODELS
// ============================================================================

export type FeedbackActionCategory =
  | 'NO_CHANGE_REQUIRED'
  | 'MONITOR'
  | 'REVIEW_FORMULA'
  | 'REPEAT_EXPERIMENT'
  | 'REQUIRES_MORE_DATA'
  | 'REFORMULATION_CANDIDATE';

export interface ScientificFeedbackDiagnosis {
  parameterKey: string;
  observedFact: string; // e.g. "Measured pH 8.15 is below target 8.50"
  possibleCause: string; // e.g. "Lower than expected neutralization of LABSA by Caustic Soda"
  hypothesis: string; // e.g. "Raw material alkaline assay variance or batch scale error"
  actionProposal: string; // e.g. "Adjust Sodium Hydroxide active % target by +0.15% in IntelliForm"
  evidenceLevel: ScientificEvidenceLevel;
  confidence: 'HIGH_EVIDENCE' | 'SUPPORTED_HYPOTHESIS' | 'TENTATIVE';
}

export interface ReformulationCandidate {
  candidateId: string;
  parentFormulaId: string;
  parentFormulaVersionId: string;
  iterationCycle: number;
  targetCategory: ProductCategoryId;
  physicalForm: PhysicalForm;
  diagnoses: ScientificFeedbackDiagnosis[];
  recommendedAdjustments: Array<{
    canonicalIngredientId: string;
    ingredientName: string;
    oldTargetPercent: number;
    proposedTargetPercent: number;
    deltaPercent: number;
    rationale: string;
  }>;
  actionCategory: FeedbackActionCategory;
  createdBy: string;
  createdAt: string;
  humanApprovalStatus: 'PENDING_HUMAN_REVIEW' | 'APPROVED_FOR_NEW_VERSION' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  resultingFormulaVersionId?: string;
}

// ============================================================================
// 6. CLOSED-LOOP R&D ITERATION & LINEAGE
// ============================================================================

export interface ClosedLoopIterationRecord {
  iterationCycle: number;
  formulaId: string;
  inputFormulaVersionId: string;
  experimentId: string;
  protocolId?: string;
  protocolHash?: string;
  externalRunId?: string;
  batchId: string;
  sampleId: string;
  evidenceRecordIds: string[];
  comparisons: PredictionVsMeasurementComparison[];
  specEvaluations: SpecificationEvaluationResult[];
  actionCategory: FeedbackActionCategory;
  reformulationCandidateId?: string;
  outputFormulaVersionId?: string;
  sha256AuditHash: string;
  createdAt: string;
  createdBy: string;
}

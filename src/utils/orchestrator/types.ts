/**
 * ============================================================================
 * AUTHORITATIVE FORMULA SCIENTIFIC ORCHESTRATOR TYPES
 * ============================================================================
 *
 * Single Source of Truth (SSOT) contract definitions for the unified
 * scientific execution pipeline across all UI components and subsystems.
 * ============================================================================
 */

import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';
import { LabMeasurementRecord, SpecificationReport } from '../specificationEngine/types';
import { FormulaValidationReport, ScientificValidationState, FormulaReadinessLevel } from '../labEvidenceEngine';
import {
  ScientificValidityStatus,
  QualityGateSpecificationStatus,
  QualityGateEvidenceStatus,
  FinalFormulaStatus,
  QualityGateFinding
} from '../scientificQualityGateEngine';
import { PerformanceProvenance } from '../cleaningPerformanceEngine';
import { RegulatoryContext, RegulatoryEvaluationReport } from '../regulatoryEngine';
import { AIGradeResult } from '../gradeEngine';

// =============================================================================
// EVALUATION PIPELINE STAGES
// =============================================================================

export type EvaluationStage =
  | 'VALIDATION'
  | 'NORMALIZATION'
  | 'IDENTITY_RESOLUTION'
  | 'CATEGORY_ROUTING'
  | 'SCIENTIFIC_CALCULATION'
  | 'EVIDENCE_EVALUATION'
  | 'QUALITY_GATE'
  | 'FINALIZATION';

export interface StageDiagnostic {
  stage: EvaluationStage;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  messages: string[];
  findings?: QualityGateFinding[];
  uncertainties?: string[];
  unknownParameters?: string[];
}

// =============================================================================
// CANONICAL INPUT CONTRACT
// =============================================================================

export interface CanonicalIngredientInput {
  ingredientId?: string;
  id?: string;
  name: string;
  commercialGradeId?: string;
  percentage: number;
  rawKg?: number;
  activeMatterPct?: number;
  activePercent?: number;
  costPerKg?: number | null;
  role?: string;
  category?: string;
  function?: string;
  casNumber?: string;
  inciName?: string;
  hlb?: number;
  hlbValue?: number;
  density?: number;
  pKa?: number;
  phMin?: number;
  phMax?: number;
  supplier?: string;
  isUnknown?: boolean;
}

export interface WaterProfileInput {
  hardnessPpm?: number;
  calciumPpm?: number;
  magnesiumPpm?: number;
  temperatureC?: number;
  ph?: number;
}

export interface MachineProfileInput {
  machineType?: 'FRONT_LOAD' | 'TOP_LOAD' | 'HAND_WASH' | 'AUTOMATIC_DISHWASHER' | 'MANUAL_DISH' | 'INDUSTRIAL';
  waterVolumeL?: number;
  washCycleTimeMin?: number;
}

export interface ManufacturingProcessInput {
  mixingMethod?: string;
  shearLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  heatingRequired?: boolean;
  targetTemperatureC?: number;
}

export interface CostContextInput {
  targetCostPerKg?: number;
  overheadPct?: number;
  packagingCostPerUnit?: number;
  currency?: string;
  profitMarginTargetPct?: number;
  distributorMarginPct?: number;
  retailerMarginPct?: number;
}

export interface CanonicalFormulaInput {
  formulaId?: string;
  formulaName?: string;
  formulaVersion?: string;
  productCategory?: string | ProductCategoryId;
  physicalForm?: PhysicalForm;
  ingredients: CanonicalIngredientInput[];
  batchSize?: number;
  batchSizeKg?: number;
  targetPH?: number;
  targetViscosity?: number;
  waterProfile?: WaterProfileInput;
  hardness?: number;
  waterHardnessPpm?: number;
  temperature?: number;
  temperatureC?: number;
  machineProfile?: MachineProfileInput;
  dose?: number;
  doseGrams?: number;
  manufacturingProcess?: ManufacturingProcessInput;
  costContext?: CostContextInput;
  regulatoryContext?: RegulatoryContext;
  climatePreset?: string;
  labEvidence?: LabMeasurementRecord[];
  researchEvidence?: any[];
}

// =============================================================================
// CANONICAL OUTPUT CONTRACT
// =============================================================================

export interface FormulaIdentityOutput {
  id: string;
  name: string;
  version: string;
  canonicalCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  categoryLabel: string;
  physicalForm: PhysicalForm;
  fingerprint: string;
  evaluatedAt: string;
}

export interface MassBalanceOutput {
  totalPercentage: number;
  isBalanced: boolean;
  deviation: number;
  waterPercentage: number;
  activeSurfactantsTotal: number;
  rawSurfactantsTotal: number;
}

export interface PHResultOutput {
  ph: number;
  isMeasured: boolean;
  provenance: 'PREDICTED' | 'MEASURED' | 'ESTIMATED';
  bufferCapacity: number;
  ionicStrength: number;
  confidence: string;
  solverConverged: boolean;
  warnings: string[];
  slurryBasis?: string;
  measuredPH?: number | null;
  predictionError?: number | null;
  details?: any;
}

export interface ActiveMatterResultOutput {
  totalSurfactantActivePct: number;
  totalActiveMatterPct: number;
  meetsCategoryMin: boolean;
  categoryMinPct: number;
  surfactantBreakdown: {
    anionic: number;
    nonionic: number;
    amphoteric: number;
    cationic: number;
    total: number;
  };
}

export interface HLBResultOutput {
  blendedHLB: number | null;
  hasSurfactants: boolean;
  totalSurfactantRawWeight: number;
  totalSurfactantActiveWeight: number;
  surfactantsCount: number;
  surfactantsWithAuthoritativeHLB: number;
  surfactantsWithMissingHLB: number;
  isFullyAuthoritative: boolean;
  hasIonicSurfactants: boolean;
  methodMetadata: string;
  emulsionRegion: string;
  interpretation: string;
  scientificNotes: string;
  contributions: Array<{
    id?: string;
    name: string;
    category?: string;
    percentage: number;
    activeMatterPct: number;
    activeWeight: number;
    hlb: number | null;
    dataSource: string;
    isIonicSurfactant: boolean;
    methodMetadata: string;
    notes?: string;
  }>;
  limitations: string[];
  status: 'VALID' | 'NOT_APPLICABLE' | 'UNKNOWN' | 'INSUFFICIENT_DATA';
}

export interface HardnessResultOutput {
  waterHardnessPpm: number;
  status: 'PASS' | 'OPTIMAL' | 'SUFFICIENT' | 'INSUFFICIENT' | 'WARNING' | 'NOT_APPLICABLE' | 'NOT_EVALUATED';
  maxSupportedPpm: number;
  washVolumeL: number;
  washDoseGrams: number;
  sufficiency: string;
  hardnessLoadMg: number;
  totalSequestrationMg: number;
}

export interface ChelationResultOutput {
  isSufficient: boolean;
  chelatorActivePct: number;
  chelatorNames: string[];
  bindingCapacityCaCO3GPer100g?: number;
  hardnessProtectionRatio?: number;
}

export interface CompatibilityResultOutput {
  compatible: boolean;
  compatibilityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alerts: Array<{ id: string; title: string; message: string; severity: string; recommendation?: string }>;
  warnings: string[];
  stabilityStatus: string;
  compatibilityStatusSemantic?: 'INCOMPATIBLE' | 'COMPATIBLE_BY_RULE' | 'NO_KNOWN_CONFLICT' | 'REQUIRES_COMPATIBILITY_TEST' | 'UNKNOWN' | 'KNOWN_COMPATIBLE' | 'KNOWN_INCOMPATIBLE' | 'SCREENING_COMPATIBLE' | 'INSUFFICIENT_DATA';
  evidenceStatus?: 'KNOWN_COMPATIBLE' | 'KNOWN_INCOMPATIBLE' | 'SCREENING_COMPATIBLE' | 'UNKNOWN' | 'INSUFFICIENT_DATA';
}

export interface CleaningResultOutput {
  cpi: number;
  overallScore: number;
  cleaningScore?: number | null;
  scoreType: string;
  modelId: string;
  modelVersion: string;
  productCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  isCleaningApplicable: boolean;
  qualitativePower: string;
  cleaningPower: string;
  degreasingScore: number;
  greaseRemoval: number;
  particulateSoilRemoval: number;
  foamStabilityScore: number;
  builderContribution: number;
  enzymeBonus: number;
  surfactantSynergy: number;
  domainScores?: Record<string, number>;
  provenance: PerformanceProvenance;
  isMeasured: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  uncertainty: string;
  evidenceLevel: string;
  limitingFactors: string[];
  positiveFactors: string[];
  warnings: string[];
  missingInputs: string[];
  foamProfile?: string;
  categorySuitability?: string;
  categoryKPIs?: any[];
}

export interface ViscosityResultOutput {
  predictedViscosityCp: number | null;
  rating: string;
  isFluid: boolean;
  flowMechanism: string;
  description: string;
  assumedShearRate?: string;
  temperatureC?: number;
  modelMaturity?: string;
  viscosityReport?: any;
  status?: string;
  reason?: string;
}

export interface DensityResultOutput {
  densityGPerCm3: number;
  specificGravity: number;
  densityKgPerM3: number;
  totalVolumeCm3: number;
  totalSolidsPct: number;
  nvrPercentage: number;
  isNvrComplete: boolean;
  dataCompleteness: number;
  isIdealVolumeAdditivity?: boolean;
  modelType?: string;
  unknownIngredients?: string[];
}

export interface StabilityResultOutput {
  shelfLifeMonths: number | null;
  shelfLifeStatus?: 'UNKNOWN' | 'NOT_VALIDATED' | 'ESTIMATED' | 'LAB_VALIDATED';
  preservativeStatus: 'ADEQUATE' | 'WARNING' | 'CRITICAL' | 'NOT_APPLICABLE';
  preservativeWarning?: string | null;
  syneresisRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedTests?: string[];
  limitations?: string[];
}

export interface CostResultOutput {
  costPerKg: number;
  totalBatchCost: number;
  isWithinTarget: boolean;
  targetCostPerKg?: number;
  costBreakdown?: Array<{ name: string; costPerKg: number; percentage: number; contributionPerKg: number }>;
  marginChain?: any;
}

export interface LabEvidenceResultOutput {
  evidenceLevel: QualityGateEvidenceStatus;
  validationState: ScientificValidationState;
  readinessLevel: FormulaReadinessLevel;
  verifiedMeasurementsCount: number;
  missingMeasurements: string[];
  isLabValidated: boolean;
  validationReport?: FormulaValidationReport;
  verdict: string;
}

export interface UncertaintyOutput {
  overallLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
}

export type FinalReleaseStatus = 'APPROVED' | 'CONDITIONAL_APPROVAL' | 'REJECTED' | 'BLOCKED';

export interface VerdictMatrixOutput {
  screeningStatus: string;
  specVerdict: string;
  labEvidenceVerdict: string;
  releaseGateDecision: string;
  verdictStatus: string;
  verdictReasons: Array<{ label: string; ok: boolean; message: string; provenance?: string }>;
  attentionExplanation: string;
}

export interface CanonicalFormulaEvaluationResult {
  formulaIdentity: FormulaIdentityOutput;
  scientificValidity: ScientificValidityStatus;
  massBalance: MassBalanceOutput;
  pHResult: PHResultOutput;
  activeMatterResult: ActiveMatterResultOutput;
  hlbResult: HLBResultOutput;
  hardnessResult: HardnessResultOutput;
  chelationResult: ChelationResultOutput;
  compatibilityResult: CompatibilityResultOutput;
  cleaningResult: CleaningResultOutput;
  viscosityResult: ViscosityResultOutput;
  densityResult: DensityResultOutput;
  stabilityResult: StabilityResultOutput;
  costResult: CostResultOutput;
  labEvidenceResult: LabEvidenceResultOutput;
  regulatoryResult: RegulatoryEvaluationReport;
  aiGrade: AIGradeResult;
  confidence: number;
  uncertainty: UncertaintyOutput;
  evidenceLevel: QualityGateEvidenceStatus;
  warnings: QualityGateFinding[];
  errors: QualityGateFinding[];
  blockingIssues: QualityGateFinding[];
  assumptions: string[];
  unknownParameters: string[];
  finalScientificStatus: FinalFormulaStatus;
  finalReleaseStatus: FinalReleaseStatus;
  specificationStatus: QualityGateSpecificationStatus;
  specificationResult?: SpecificationReport;
  verdictMatrix: VerdictMatrixOutput;
  qualityGateResult?: any;
  provenanceReport?: any;
  foamProfile?: string;
  categorySuitability?: string;
  expertReport?: any;
  powderReport?: any;
  stageDiagnostics: StageDiagnostic[];
  labHealthResult?: any;
  climateResult?: any;
  machineResult?: any;
  manufacturingResult?: any;
  substitutionResult?: any;
  troubleshooterResult?: any;
  engineHealthStatus?: Record<string, 'CONNECTED' | 'CONDITIONAL' | 'DISCONNECTED' | 'FAILED' | 'NOT_VALIDATED' | 'DEPRECATED'>;
  provenance: {
    orchestratorVersion: string;
    engineVersions: Record<string, string>;
    fingerprint: string;
    timestamp: string;
    dataVersion: string;
    assumptions: string[];
  };
  executionTrace?: ScientificExecutionTrace;
}

// =============================================================================
// SCIENTIFIC EXECUTION TRACE CONTRACTS (PHASE 6)
// =============================================================================

export type ExecutionNodeType =
  | 'DIRECT_ENGINE'
  | 'ADAPTER'
  | 'AGGREGATOR'
  | 'QUALITY_GATE'
  | 'EVIDENCE'
  | 'RECOMMENDATION';

export type ExecutionStatus = 'EXECUTED' | 'SKIPPED' | 'FAILED' | 'BYPASSED';

export type TraceEvidenceStatus =
  | 'MEASURED_LAB'
  | 'AUTHORITATIVE_CALCULATED'
  | 'ESTIMATED_HEURISTIC'
  | 'SCREENING_ONLY'
  | 'INSUFFICIENT_DATA'
  | 'UNKNOWN';

export interface DAGNodeExecutionTrace {
  nodeId: string;
  engineName: string;
  nodeType: ExecutionNodeType;
  executionStatus: ExecutionStatus;
  skipReason?: string;
  inputsConsumed: Record<string, any>;
  upstreamDependencies: string[];
  intermediateStatesConsumed: string[];
  outputsProduced: Record<string, any>;
  evidenceStatus: TraceEvidenceStatus;
  uncertaintyNotes: string[];
  durationMs: number;
  downstreamConsumers: string[];
  startTime?: number;
  endTime?: number;
}

export interface ScientificTraceSummary {
  totalNodesExecuted: number;
  totalNodesSkipped: number;
  totalNodesFailed: number;
  overallEvidenceStatus: TraceEvidenceStatus;
  criticalWarningsCount: number;
  qualityGateStatus: string;
  formulaGrade: string;
}

export interface ScientificExecutionTrace {
  traceId: string;
  formulaFingerprint: string;
  timestamp: string;
  nodeTraces: Record<string, DAGNodeExecutionTrace>;
  executionOrder: string[];
  overallStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE';
  totalDurationMs: number;
  summary: ScientificTraceSummary;
}

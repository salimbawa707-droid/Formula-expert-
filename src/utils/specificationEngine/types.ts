export type SpecificationCriticality = 'CRITICAL' | 'MAJOR' | 'INFORMATIONAL';

export type SpecificationStatus = 
  | 'PASS'
  | 'OUT_OF_SPEC'
  | 'TARGET_NOT_MET'
  | 'NOT_TESTED'
  | 'INSUFFICIENT_DATA'
  | 'TARGET_NOT_DEFINED'
  | 'NOT_APPLICABLE';

export type TargetSource = 
  | 'USER_DEFINED'
  | 'PRODUCT_SPECIFICATION'
  | 'VALIDATED_REFERENCE'
  | 'LAB_METHOD'
  | 'INTERNAL_R_AND_D_TARGET'
  | 'NOT_DEFINED';

export type ResultSource = 
  | 'MEASURED' 
  | 'CALCULATED' 
  | 'PREDICTED' 
  | 'SCREENING' 
  | 'ESTIMATED' 
  | 'INSUFFICIENT_DATA' 
  | 'NOT_APPLICABLE';

export type RecommendationConfidence = 
  | 'CALCULATED' 
  | 'RULE_BASED' 
  | 'PREDICTED' 
  | 'SCREENING' 
  | 'INSUFFICIENT_DATA';

export type OverallVerdictStatus = 
  | 'PASS' 
  | 'NEEDS_REVISION' 
  | 'INSUFFICIENT_DATA' 
  | 'SPECIFICATION_NOT_DEFINED';

export type StandardUnit = 
  | '%' 
  | 'g/mL' 
  | 'mPa·s'
  | 'kg/m³' 
  | 'seconds' 
  | 'minutes' 
  | 'pH units' 
  | 'ppm' 
  | 'g/L' 
  | 'degrees' 
  | 'mm' 
  | '₹/kg' 
  | '$/kg' 
  | '₹/batch' 
  | '₹/wash' 
  | 'none';

/**
 * Individual Product Specification Parameter Definition
 */
export interface SpecificationParameter {
  id: string;
  parameterKey: string;
  parameterName: string;
  categoryApplicability?: string[]; // e.g. ['Laundry Powder', 'Dishwasher Powder'] or ['ALL']
  target?: number;
  min?: number;
  max?: number;
  unit: StandardUnit;
  testBasis?: string;
  criticality: SpecificationCriticality;
  source: TargetSource;
  requiresLabMeasurement?: boolean;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reusable Specification Template
 */
export interface SpecificationTemplate {
  id: string;
  name: string;
  description: string;
  productCategory: string;
  sourceType: 'SYSTEM_PROVIDED' | 'USER_CREATED';
  parameters: SpecificationParameter[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Single Laboratory Measurement Record
 */
export interface LabMeasurementRecord {
  measurementId: string;
  formulaId?: string;
  formulaVersion: string;
  parameterKey: string;
  value: number;
  unit: StandardUnit;
  testBasis?: string;
  testMethod?: string;
  temperatureC?: number;
  waterBasis?: string;
  sampleId?: string;
  replicateNumber?: number;
  operator?: string;
  testDate: string;
  notes?: string;
  provenance: 'MEASURED';
}

/**
 * Aggregated Replicate Set for a Parameter
 */
export interface LabReplicateSummary {
  parameterKey: string;
  replicatesCount: number;
  values: number[];
  mean: number;
  stdDev?: number;
  min: number;
  max: number;
  range: number;
  unit: StandardUnit;
  testBasis?: string;
  hasReplicates: boolean;
}

/**
 * Evaluated Single Parameter Result
 */
export interface SpecificationEvaluationItem {
  parameterKey: string;
  parameterName: string;
  criticality: SpecificationCriticality;
  target?: number;
  min?: number;
  max?: number;
  unit: StandardUnit;
  currentValue?: number;
  currentValueDisplay: string;
  provenance: ResultSource;
  status: SpecificationStatus;
  statusMessage: string;
  targetMet: boolean;
  gap?: number;
  gapDisplay: string;
  testBasis?: string;
  source: TargetSource;
  isMeasured: boolean;
  requiresLabMeasurement: boolean;
}

/**
 * Gap Analysis Entry
 */
export interface TargetGapItem {
  parameterKey: string;
  parameterName: string;
  currentValue: number | undefined;
  currentValueDisplay: string;
  targetValue: number | undefined;
  targetValueDisplay: string;
  min?: number;
  max?: number;
  gap: number | undefined;
  gapDisplay: string;
  unit: StandardUnit;
  status: SpecificationStatus;
  provenance: ResultSource;
  direction: 'ON_TARGET' | 'BELOW_TARGET' | 'ABOVE_TARGET' | 'OUT_OF_BOUNDS' | 'NO_TARGET';
}

/**
 * Evidence-Based Formulation Recommendation
 */
export interface FormulationRecommendation {
  id: string;
  parameterKey?: string;
  title: string;
  observation: string;
  impactExplanation: string;
  potentialAction: string;
  confidence: RecommendationConfidence;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  tradeoffNotice?: string;
}

/**
 * Overall Expert Specification Verdict
 */
export interface ExpertSpecificationVerdict {
  status: OverallVerdictStatus;
  headline: string;
  summary: string;
  criticalCount: number;
  criticalPassCount: number;
  criticalOutCount: number;
  criticalMissingCount: number;
  majorCount: number;
  majorPassCount: number;
  majorOutCount: number;
  informationalCount: number;
  totalEvaluated: number;
  outOfSpecParameters: SpecificationEvaluationItem[];
  missingLabTestParameters: SpecificationEvaluationItem[];
  evaluationTimestamp: string;
}

/**
 * Full Specification Evaluation Report
 */
export interface SpecificationReport {
  formulaId?: string;
  formulaName: string;
  formulaVersion: string;
  productCategory: string;
  evaluatedAt: string;
  verdict: ExpertSpecificationVerdict;
  items: SpecificationEvaluationItem[];
  criticalItems: SpecificationEvaluationItem[];
  majorItems: SpecificationEvaluationItem[];
  informationalItems: SpecificationEvaluationItem[];
  gapAnalysis: TargetGapItem[];
  recommendations: FormulationRecommendation[];
  labMeasurementsCount: number;
  replicateSummaries: LabReplicateSummary[];
}

/**
 * Formula Version Snapshot
 */
export interface FormulaVersionSnapshot {
  versionId: string;
  versionNumber: string; // e.g. "1.0", "1.1"
  formulaId?: string;
  formulaName: string;
  productCategory: string;
  batchSizeKg: number;
  ingredients: Array<{
    id?: string;
    name: string;
    percentage: number;
    activeMatterPct?: number;
    costPerKg?: number;
    role?: string;
  }>;
  totalPercentage: number;
  activeMatterPct: number;
  costPerKg: number;
  totalBatchCost: number;
  measuredPH?: number;
  labInputs?: Record<string, any>;
  labMeasurements: LabMeasurementRecord[];
  specReport?: SpecificationReport;
  notes?: string;
  createdAt: string;
  author?: string;
}

/**
 * Ingredient Delta in Formula Comparison
 */
export interface IngredientDelta {
  name: string;
  pctA: number;
  pctB: number;
  deltaPct: number;
  activeMatterA: number;
  activeMatterB: number;
  deltaActiveMatter: number;
  costA: number;
  costB: number;
  deltaCost: number;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
}

/**
 * Parameter Delta in Formula Comparison
 */
export interface ParameterDelta {
  parameterKey: string;
  parameterName: string;
  unit: StandardUnit;
  valueA?: number;
  valueB?: number;
  displayA: string;
  displayB: string;
  provenanceA: ResultSource;
  provenanceB: ResultSource;
  delta?: number;
  deltaDisplay: string;
  status: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED' | 'INSUFFICIENT_DATA' | 'DIFFERENT';
}

/**
 * Formula Comparison Report (Formula A vs B, or Version 1 vs Version 2)
 */
export interface FormulaComparisonReport {
  titleA: string;
  versionA: string;
  categoryA: string;
  titleB: string;
  versionB: string;
  categoryB: string;
  batchSizeKgA: number;
  batchSizeKgB: number;
  ingredientDeltas: IngredientDelta[];
  parameterDeltas: ParameterDelta[];
  massBalanceA: { totalPct: number; unassignedPct: number };
  massBalanceB: { totalPct: number; unassignedPct: number };
  costDelta: {
    costPerKgA: number;
    costPerKgB: number;
    deltaCostPerKg: number;
    totalBatchCostA: number;
    totalBatchCostB: number;
    deltaTotalBatchCost: number;
  };
  verdictA?: OverallVerdictStatus;
  verdictB?: OverallVerdictStatus;
  summaryInsights: string[];
}

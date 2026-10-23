export const VAULT_SCHEMA_VERSION = '1.1.0';

export type ScientificMaturityStatus =
  | 'UNVERIFIED'
  | 'CONCEPTUAL'
  | 'HEURISTIC'
  | 'CODE_IMPLEMENTED'
  | 'READY_FOR_VALIDATION'
  | 'VALIDATED_WITH_LIMITATIONS'
  | 'LAB_VALIDATED'
  | 'BLOCKED';

export type EvidenceType =
  | 'EXPERIMENTAL'
  | 'REFERENCE_DATABASE'
  | 'THEORY'
  | 'MANUFACTURER_SPECIFICATION'
  | 'SIMULATION'
  | 'SOFTWARE_TEST';

export type AccessStatus =
  | 'IDENTIFIED'
  | 'ACCESS_CONFIRMED'
  | 'DOWNLOADED'
  | 'BLOCKED';

export type DownloadStatus =
  | 'NOT_DOWNLOADED'
  | 'DOWNLOADED'
  | 'PENDING_RETRIEVAL'
  | 'BLOCKED';

export type InspectionStatus =
  | 'UNINSPECTED'
  | 'IN_PROGRESS'
  | 'NUMERICALLY_INSPECTED'
  | 'FAILED';

export type ValidationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'READY_FOR_VALIDATION'
  | 'VALIDATED_WITH_LIMITATIONS'
  | 'LAB_VALIDATED'
  | 'BLOCKED';

export type AuditSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INFORMATIONAL';

export type ReviewDecision =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUIRES_REWORK';

export type PhaseStatus =
  | 'CLOSED'
  | 'ACTIVE'
  | 'LOCKED'
  | 'PENDING_REVIEW';

export interface EngineRecord {
  id: string;
  name: string;
  category: string;
  implementationStatus?: 'IMPLEMENTED' | 'UNAVAILABLE';
  sourceFile: string;
  entryPoint: string;
  inputs: { name: string; unit: string; description: string }[];
  outputs: { name: string; unit: string; description: string }[];
  equationsModels: string[];
  assumptions: string[];
  dependencies: string[];
  consumingEngines: string[];
  intendedProducts: string[];
  operatingConditions: string;
  existingEvidenceIds: string[];
  requiredExperimentalVariables: string[];
  referenceOutputsRequired: string[];
  evidenceCoveragePct: number;
  numericalValidationReadiness: 'NOT_READY' | 'DATASET_REQUIRED' | 'READY' | 'IN_PROGRESS' | 'VALIDATED';
  scientificMaturity: ScientificMaturityStatus;
  independentVerificationStatus: 'UNVERIFIED' | 'REPORTED_COMPLETE_UNVERIFIED' | 'VERIFIED';
  openQuestions: string[];
  knownLimitations: string[];
  lastAudited: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  authors: string;
  publicationDate: string;
  publisher: string;
  doi?: string;
  originalUrl: string;
  repositoryUrl?: string;
  license: string;
  licenseReviewStatus?: 'UNREVIEWED' | 'REVIEW_PENDING' | 'PERMITTED_FOR_COMMERCIAL_REUSE' | 'RESTRICTED' | 'UNKNOWN';
  licenseEvidenceReference?: string | null;
  licenseReviewedAt?: string | null;
  licenseRestrictions?: string[];
  datasetVersion?: string;
  fileName?: string;
  fileFormat?: string;
  sizeBytes?: number;
  sha256Hash?: string;
  accessStatus: AccessStatus;
  downloadStatus: DownloadStatus;
  numericalInspectionStatus: InspectionStatus;
  evidenceType: EvidenceType;
  measuredVariables: string[];
  units: string[];
  conditions: string;
  sampleCount: number | null;
  sourcePublicationRef: string;
  supportedEngineIds: string[];
  supportedClaims: string[];
  applicabilityMismatches: string[];
  limitations: string[];
  followUpActions: string[];
  isLeadSeed: boolean;
}

export interface DatasetColumn {
  name: string;
  unit: string;
  missingCount: number | null; // NULL when missingness has not been inspected; zero means measured zero missing values.
  isExperimental: boolean;
}

export interface DatasetRecord {
  id: string;
  name: string;
  evidenceId: string;
  originalDatasetUrl: string;
  localFileReference?: string;
  sha256Hash?: string;
  actualRowCount: number | null; // NULL when uninspected!
  actualColumnCount: number | null; // NULL when uninspected!
  columns: DatasetColumn[];
  experimentalVsImputedNotes: string;
  duplicateOverlapCheck: string;
  designation: 'TRAINING' | 'VALIDATION' | 'TEST' | 'BENCHMARK' | 'UNASSIGNED';
  originalSourceMapping: string;
  applicableEngineIds: string[];
  numericalValidationReadiness: 'NOT_INSPECTED' | 'INSPECTION_PENDING' | 'READY' | 'DEFICIENT';
  inspectionStatus: InspectionStatus;
  inspectedBy?: string;
  inspectionDate?: string;
  inspectionNotes?: string;
}

export interface Finding {
  id: string;
  description: string;
  severity: AuditSeverity;
  verifiedFact: boolean;
  aiClaimOnly: boolean;
}

export interface AuditRecord {
  id: string;
  date: string;
  phase: string;
  scope: string;
  repoCommitOrZipHash: string;
  filesInspected: string[];
  findings: Finding[];
  reproducibleEvidence: string;
  reportPathOrRef: string;
  promptUsed: string;
  toolEnvironmentLimitations: string;
  filesChanged: string[];
  independentReviewerDecision: ReviewDecision;
  closureCriteria: string[];
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PromptRecord {
  id: string;
  title: string;
  phase: string;
  category: string;
  version: string;
  author: string;
  content: string;
  intendedOutcome: string;
  lastModified: string;
}

export interface KeyDeliverable {
  title: string;
  status: 'DONE' | 'IN_PROGRESS' | 'BLOCKED' | 'PENDING';
  verified: boolean;
  notes?: string;
}

export interface ProjectPhase {
  phaseId: string;
  name: string;
  subtitle: string;
  status: PhaseStatus;
  closureReportDate?: string;
  reportedClosed: boolean;
  independentVerificationStatus: 'UNESTABLISHED' | 'CONFIRMED' | 'REJECTED';
  blockers: string[];
  description: string;
  keyDeliverables: KeyDeliverable[];
}

export interface PricingIntegrityRecord {
  ingredientId: string;
  canonicalName: string;
  tradeName?: string;
  inchiKey: string;
  pricePerKg: number | null; // MUST REMAIN NULL IF UNKNOWN, NEVER 0!
  currency: string;
  priceStatus: 'CONFIRMED' | 'UNKNOWN_NULL' | 'MARKET_ESTIMATE';
  sourceNote: string;
}

export interface EngineCountDiscrepancy {
  claimedA: number; // 64
  reconciledFiles: number; // 59
  claimedSubmodules: number; // 97
  status: 'REPORTED_UNVERIFIED';
  notes: string;
}

export interface ActiveBlocker {
  id: string;
  title: string;
  impact: string;
  environmentLimitation: string;
  workaroundOrNextAction: string;
  phaseId: string;
}

export type InventoryMetricCategory = 'FLOW' | 'FILM' | 'BUBBLE' | 'RHEOMETER' | 'HISTORICAL' | 'MIXED';

export type InventoryMetricVerificationStatus = 'REPORTED_UNVERIFIED' | 'REPRODUCIBLE' | 'UNRESOLVED';

export interface InventoryMetricRecord {
  id: string;
  category: InventoryMetricCategory;
  metricKey: string;
  value: number | null;
  unit: string;
  countingUnit: string;
  verificationStatus: InventoryMetricVerificationStatus;
  sourceReference: string;
  notes: string;
}

export interface HistoricalReconciliationRecord {
  id: string;
  claimValue: number | null;
  claimUnit: string;
  reconciliationStatus: 'UNRESOLVED' | 'RECONCILED';
  sourceReference: string;
  relatedMetricIds: string[];
  comparisonAggregateValue: number | null;
  notes: string;
}

export interface DaviesModelCoefficientRecord {
  /** Model-specific coefficient name (for example, the symbol used by the cited equation). */
  name: string;
  /** Null until a traceable source establishes the numeric value; never default unknown coefficients to zero. */
  value: number | null;
  /** Explicit units or "dimensionless" as supported by the source. */
  unit: string;
  valueOrigin: 'SOURCE_REPORTED' | 'CALCULATED_FROM_SOURCE' | 'ESTIMATED' | 'UNKNOWN';
  sourceReference: string;
  notes: string;
}

export interface DaviesIonConditionRecord {
  /** Chemical species identity as stated by the source; do not infer identity from charge alone. */
  species: string;
  charge: number;
  /** Null when species concentration is not provided for the evaluated condition. */
  concentrationM: number | null;
  sourceReference: string;
}

export interface DaviesActivityModelRecord {
  id: string;
  modelName: string;
  modelVersion: string;
  temperatureK: number | null;
  ionicStrengthM: number | null;
  speciesCharges: number[];
  /** Optional additive detail for traceable coefficient and condition records. */
  coefficients?: DaviesModelCoefficientRecord[];
  ionConditions?: DaviesIonConditionRecord[];
  applicabilityStatus: 'WITHIN_DOCUMENTED_DOMAIN' | 'OUTSIDE_DOCUMENTED_DOMAIN' | 'UNKNOWN';
  applicabilityEvidenceReference?: string | null;
  sourceReference: string;
  assumptions: string[];
  notes: string;
}

export interface SurfactantPhasePropertyRecord {
  id: string;
  surfactantId: string | null;
  reportedName: string;
  composition: string | null;
  propertyName: 'KRAFFT_POINT';
  value: number | null;
  unit: string;
  concentration: number | null;
  concentrationUnit: string | null;
  solutionComposition: string | null;
  measurementMethod: string | null;
  valueOrigin: 'MEASURED' | 'REPORTED' | 'ESTIMATED' | 'IMPUTED' | 'MODEL_PREDICTED' | 'UNKNOWN';
  evidenceStatus: 'UNVERIFIED' | 'SOURCE_REVIEWED' | 'BLOCKED';
  uncertaintyValue: number | null;
  uncertaintyUnit: string | null;
  sourceReference: string;
  notes: string;
}

export interface VaultState {
  version: string;
  exportedAt?: string;
  inventoryMetrics: InventoryMetricRecord[];
  historicalReconciliations: HistoricalReconciliationRecord[];
  daviesActivityModels: DaviesActivityModelRecord[];
  surfactantPhaseProperties: SurfactantPhasePropertyRecord[];
  phases: ProjectPhase[];
  engines: EngineRecord[];
  evidence: EvidenceRecord[];
  datasets: DatasetRecord[];
  audits: AuditRecord[];
  prompts: PromptRecord[];
  pricingRecords: PricingIntegrityRecord[];
  engineCountDiscrepancy: EngineCountDiscrepancy;
  activeBlockers: ActiveBlocker[];
  authoritativeProvenanceStatus?: 'VERIFIED' | 'NOT_INDEPENDENTLY_VERIFIED';
  accountingReconciliationStatus?: 'RECONCILED' | 'UNRESOLVED';
  ledgerConsistencyStatus?: 'CONSISTENT' | 'INCONSISTENT';
}

/**
 * ============================================================================
 * SCIENTIFIC EVIDENCE & CLEAN-ROOM LIMS DOMAIN CONTRACTS
 * ============================================================================
 * 
 * Clean-room TypeScript implementation of Laboratory Information Management
 * System (LIMS) data models for Detergent Formula Expert.
 * 
 * ARCHITECTURAL INTEGRITY:
 * - Independent clean-room TypeScript architecture (NO GPL / PHP code copied).
 * - Implements complete traceability chain:
 *   Formula -> FormulaVersion -> Batch -> Sample -> Test -> Raw Measurement ->
 *   Verified Measurement -> Evidence Record -> Quality Gate -> Release Decision.
 * - Enforces strict evidence level boundaries and append-only immutability.
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { ProductCategoryId, PhysicalForm } from '../productTaxonomy';
import { StandardUnit } from '../../utils/specificationEngine/types';

export type { StandardUnit };

// =============================================================================
// EVIDENCE LEVELS & VERIFICATION STATUS
// =============================================================================

export type ScientificEvidenceLevel =
  | 'CALCULATED'              // Pure theoretical / mathematical simulation output
  | 'DATABASE'                // Published chemical / thermodynamic property database
  | 'LITERATURE'              // Academic / scientific journal reference
  | 'MANUFACTURER'            // Raw material technical data sheet / certificate of analysis
  | 'ANALYTICAL_EVIDENCE'     // Spectroscopic / chromatographic signal (FTIR, Raman, HPLC)
  | 'LAB_TESTED'              // Single raw empirical benchtop measurement
  | 'LAB_VALIDATED'           // Verified replicate measurement on calibrated instrument
  | 'CERTIFIED'               // Regulatory / third-party accredited standard certificate
  | 'INSUFFICIENT_DATA'       // Missing or incomplete analytical data
  | 'NOT_TESTED';             // Parameter defined in specification but unmeasured

export type EvidenceVerificationStatus =
  | 'UNVERIFIED'
  | 'REVIEWED'
  | 'VERIFIED'
  | 'REJECTED';

// =============================================================================
// BATCH, SAMPLE & TEST STATUS ENUMS
// =============================================================================

export type LimsBatchStatus =
  | 'PLANNED'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'QUARANTINED'
  | 'RELEASED'
  | 'REJECTED';

export type LimsSampleStatus =
  | 'CREATED'
  | 'RECEIVED'
  | 'QUEUED'
  | 'IN_TESTING'
  | 'TEST_COMPLETE'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'QUARANTINED'
  | 'REJECTED';

export type LimsTestStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type InstrumentCalibrationStatus =
  | 'VALID'
  | 'DUE'
  | 'EXPIRED'
  | 'UNKNOWN';

export type InstrumentClassification =
  | 'REFERENCE'
  | 'DEMO'
  | 'SIMULATED'
  | 'USER_REGISTERED';

export type FormulaLabValidationStatus =
  | 'CALCULATION_VALID'
  | 'LAB_VALIDATION_REQUIRED'
  | 'LAB_TEST_IN_PROGRESS'
  | 'LAB_VALIDATED'
  | 'LAB_FAILED'
  | 'INSUFFICIENT_EVIDENCE';

// =============================================================================
// CORE LIMS ENTITIES
// =============================================================================

/**
 * Formula Version Entity
 * Immutable snapshot of formulation recipe linked to ProvenanceEngine fingerprint.
 */
export interface FormulaVersion {
  formulaId: string;
  formulaVersion: string;
  formulaHash: string;
  formulaName: string;
  composition: FormulationIngredient[];
  productCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  physicalForm: PhysicalForm;
  createdAt: string;
  createdBy: string;
  labValidationStatus?: FormulaLabValidationStatus;
  validationStatusReason?: string;
  validationReviewedBy?: string;
  validationReviewedAt?: string;
  notes?: string;
}

/**
 * Batch Record Entity
 * Industrial or laboratory compounding run producing a physical chemical batch.
 */
export interface BatchRecord {
  batchId: string;
  formulaId: string;
  formulaVersion: string;
  batchNumber: string;
  targetBatchSizeKg: number;
  actualBatchSizeKg: number;
  manufacturingDate: string;
  manufacturingNotes?: string;
  operator: string;
  rawMaterialLotIds: Record<string, string>; // ingredientId -> lot/batch#
  status: LimsBatchStatus;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lab Sample Entity
 * Physical aliquot or specimen drawn from a manufactured batch or raw material.
 */
export interface LabSample {
  sampleId: string;
  barcode: string;
  batchId: string;
  formulaId: string;
  formulaVersion: string;
  sampleType: 'IN_PROCESS' | 'FINISHED_PRODUCT' | 'RAW_MATERIAL' | 'STABILITY_PULL' | 'RETAIN';
  collectionDate: string;
  collectedBy: string;
  storageCondition: 'ROOM_TEMPERATURE_25C' | 'ELEVATED_40C' | 'REFRIGERATED_4C' | 'ACCELERATED_CHAMBER';
  storageLocation: string;
  custodian: string;
  status: LimsSampleStatus;
  statusHistory: Array<{
    fromStatus: LimsSampleStatus;
    toStatus: LimsSampleStatus;
    timestamp: string;
    user: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Test Method Definition
 * Standard analytical procedure specification.
 */
export interface TestMethod {
  methodId: string;
  name: string;
  parameterKey: string;
  parameterName: string;
  standardUnit: StandardUnit;
  procedureReference: string; // e.g. "ISO 4316", "ASTM D1172", "CIPAC MT 75.3"
  sourceRegistryId?: string;
  applicableProductForms: PhysicalForm | 'ALL';
  applicableProductCategories?: ProductCategoryId[];
  acceptanceCriteriaStatus?: 'SOURCE_DEFINED' | 'USER_DEFINED' | 'NEEDS_EXPERT_REVIEW';
  acceptanceCriteriaSource?: string;
  samplePreparation?: string;
  controls?: string;
  acceptanceCriteria?: {
    min?: number;
    max?: number;
    target?: number;
  };
  requiredInstrumentType?: string;
  version: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';
}

/**
 * Lab Test Assignment Entity
 * Specific test task scheduled on a sample using an analytical method.
 */
export interface LabTest {
  testId: string;
  sampleId: string;
  batchId: string;
  formulaId: string;
  formulaVersion: string;
  testMethodId: string;
  parameterKey: string;
  parameterName: string;
  targetSpecification?: string;
  standardUnit: StandardUnit;
  requestedBy: string;
  assignedTo: string;
  instrumentId?: string;
  startedAt?: string;
  completedAt?: string;
  status: LimsTestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lab Measurement Entity
 * Empirical numerical observation with mandatory unit, instrument, and analyst tracking.
 */
export interface LabMeasurement {
  measurementId: string;
  testId: string;
  sampleId: string;
  batchId: string;
  formulaId: string;
  formulaVersion: string;
  parameterKey: string;
  parameterName: string;
  value: number;
  unit: StandardUnit;
  method: string;
  instrumentId: string;
  instrumentCalibrationStatusAtMeasurement: InstrumentCalibrationStatus;
  rawDataReference?: string;
  measuredAt: string;
  analyst: string;
  repeatNumber: number;
  uncertainty?: number;
  temperatureC?: number;
  sampleConcentration?: number;
  sampleConcentrationUnit?: '%' | 'g/L';
  dilutionWaterHardnessPpm?: number;
  dilutionWaterDescription?: string;
  isOutlier?: boolean;
  notes?: string;
  isCorrected?: boolean;
  correctionId?: string;
  createdAt: string;
}

/**
 * Measurement Correction Entity
 * Immutable correction tracking record preserving original raw data.
 */
export interface MeasurementCorrection {
  correctionId: string;
  originalMeasurementId: string;
  parameterKey: string;
  oldValue: number;
  newValue: number;
  oldUnit: StandardUnit;
  newUnit: StandardUnit;
  reason: string;
  correctedBy: string;
  correctedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
}

/**
 * Scientific Evidence Record Entity
 * Formal evidence node consumed by Quality Gate and Release Decision engines.
 */
export interface EvidenceRecord {
  evidenceId: string;
  sourceType: 'COMPUTATION' | 'BENCH_MEASUREMENT' | 'CALIBRATED_VERIFICATION' | 'CERTIFICATE' | 'SUPPLIER_TDS';
  evidenceLevel: ScientificEvidenceLevel;
  sourceReference: string;
  method: string;
  parameterKey: string;
  parameterName: string;
  value: number | string;
  unit: StandardUnit;
  formulaId: string;
  formulaVersion: string;
  batchId?: string;
  sampleId?: string;
  testId?: string;
  measurementId?: string;
  instrumentId?: string;
  instrumentCalibrationValid: boolean;
  createdAt: string;
  createdBy: string;
  verificationStatus: EvidenceVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  hash: string;
  previousHash?: string;
}

/**
 * Analytical Instrument Record
 */
export interface InstrumentRecord {
  instrumentId: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  instrumentType: string;
  classification: InstrumentClassification;
  calibrationStatus: InstrumentCalibrationStatus;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  calibrationCertificateReference?: string;
  calibrationTolerance?: string;
  location?: string;
  custodian?: string;
  isActive: boolean;
}

/**
 * LIMS Audit Trail Record
 */
export interface LimsAuditRecord {
  auditId: string;
  timestamp: string;
  user: string;
  action: string;
  entity: 'FORMULA_VERSION' | 'BATCH' | 'SAMPLE' | 'TEST' | 'MEASUREMENT' | 'CORRECTION' | 'EVIDENCE' | 'INSTRUMENT';
  entityId: string;
  previousState: any;
  newState: any;
  reason: string;
  previousHash?: string;
  newHash: string;
}

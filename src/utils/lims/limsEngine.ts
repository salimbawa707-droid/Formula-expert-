/**
 * ============================================================================
 * AUTHORITATIVE LIMS ORCHESTRATION & EVIDENCE ENGINE
 * ============================================================================
 * 
 * Clean-room TypeScript LIMS coordinator bridging formulation recipes, batches,
 * samples, laboratory tests, measurements, and formal evidence records.
 * 
 * ENFORCEMENT MANDATES:
 * 1. Physical Form Routing: Powder methods are strictly excluded from liquids.
 * 2. Mandatory Units: Every measurement requires a valid StandardUnit.
 * 3. Immutable Chain: Full audit trail with cryptographic hash linking.
 * 4. Distinct Evidence States: Never conflate CALCULATED with LAB_VALIDATED.
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { PhysicalForm, normalizeProductCategory } from '../../domain/productTaxonomy';
import { isPowderCategory } from '../formulationEngineRouter';
import { computeFormulaFingerprint } from '../provenanceEngine';
import {
  FormulaVersion,
  BatchRecord,
  LabSample,
  LabTest,
  LabMeasurement,
  EvidenceRecord,
  LimsAuditRecord,
  StandardUnit,
} from '../../domain/lims/types';
import { CANONICAL_LAB_INSTRUMENTS, getInstrumentWithCurrentStatus, InstrumentRecord } from '../../domain/lims/instrument';
import { CANONICAL_TEST_METHODS, getApplicableTestMethods } from '../../domain/lims/testMethods';

export interface LimsSessionState {
  formulaVersions: FormulaVersion[];
  batches: BatchRecord[];
  samples: LabSample[];
  tests: LabTest[];
  measurements: LabMeasurement[];
  evidenceRecords: EvidenceRecord[];
  instruments: InstrumentRecord[];
  auditTrail: LimsAuditRecord[];
}

export interface MeasurementConditions {
  sampleConcentration?: number;
  sampleConcentrationUnit?: '%' | 'g/L';
  dilutionWaterHardnessPpm?: number;
  dilutionWaterDescription?: string;
}

/**
 * Creates a new immutable FormulaVersion snapshot linked to ProvenanceEngine fingerprint.
 */
export function createFormulaVersionSnapshot(
  formulaId: string,
  formulaVersion: string,
  formulaName: string,
  categoryInput: string,
  ingredients: FormulationIngredient[],
  createdBy = 'FORMULATION_SCIENTIST',
  notes?: string
): FormulaVersion {
  const categoryId = normalizeProductCategory(categoryInput);
  const isPowder = isPowderCategory(categoryId);
  const physicalForm: PhysicalForm = isPowder ? 'POWDER' : 'LIQUID';

  const formulaHash = computeFormulaFingerprint(formulaId, formulaVersion, ingredients, categoryId);

  return {
    formulaId,
    formulaVersion,
    formulaHash,
    formulaName,
    composition: ingredients.map(i => ({ ...i })),
    productCategory: categoryId,
    physicalForm,
    createdAt: new Date().toISOString(),
    createdBy,
    labValidationStatus: 'INSUFFICIENT_EVIDENCE',
    validationStatusReason: 'Formula snapshot created; calculation and laboratory evidence have not been reviewed.',
    notes,
  };
}

/**
 * Creates a physical compound BatchRecord for a formula version.
 */
export function createBatchRecord(
  formula: FormulaVersion,
  batchNumber: string,
  targetBatchSizeKg: number,
  actualBatchSizeKg: number,
  operator = 'BATCH_OPERATOR',
  rawMaterialLotIds: Record<string, string> = {},
  notes?: string
): BatchRecord {
  const now = new Date().toISOString();
  const batchId = `BATCH-${formula.formulaId}-${Date.now().toString(36).toUpperCase()}`;

  return {
    batchId,
    formulaId: formula.formulaId,
    formulaVersion: formula.formulaVersion,
    batchNumber,
    targetBatchSizeKg,
    actualBatchSizeKg,
    manufacturingDate: now.split('T')[0],
    manufacturingNotes: notes,
    operator,
    rawMaterialLotIds,
    status: 'PLANNED',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Draws a physical laboratory sample from a batch.
 */
export function drawLabSample(
  batch: BatchRecord,
  formula: FormulaVersion,
  sampleType: LabSample['sampleType'] = 'FINISHED_PRODUCT',
  collectedBy = 'QC_SAMPLER',
  storageLocation = 'Analytical QC Retain Rack A4',
  storageCondition: LabSample['storageCondition'] = 'ROOM_TEMPERATURE_25C'
): LabSample {
  const now = new Date().toISOString();
  const sampleId = `SMP-${batch.batchNumber}-${Date.now().toString(36).toUpperCase()}`;
  const barcode = `BAR-${sampleId}`;

  return {
    sampleId,
    barcode,
    batchId: batch.batchId,
    formulaId: formula.formulaId,
    formulaVersion: formula.formulaVersion,
    sampleType,
    collectionDate: now.split('T')[0],
    collectedBy,
    storageCondition,
    storageLocation,
    custodian: collectedBy,
    status: 'CREATED',
    statusHistory: [
      {
        fromStatus: 'CREATED',
        toStatus: 'CREATED',
        timestamp: now,
        user: collectedBy,
        reason: `Initial sample drawn from Batch ${batch.batchNumber}`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Automatically creates all applicable analytical test assignments for a sample
 * based on product physical form (excluding powder tests from liquids and vice versa).
 */
export function generateApplicableTestsForSample(
  sample: LabSample,
  categoryInput: string,
  requestedBy = 'QC_MANAGER'
): LabTest[] {
  const categoryId = normalizeProductCategory(categoryInput);
  const applicableMethods = getApplicableTestMethods(categoryId);
  const now = new Date().toISOString();

  return applicableMethods.map(method => ({
    testId: `TEST-${sample.sampleId}-${method.parameterKey.toUpperCase()}`,
    sampleId: sample.sampleId,
    batchId: sample.batchId,
    formulaId: sample.formulaId,
    formulaVersion: sample.formulaVersion,
    testMethodId: method.methodId,
    parameterKey: method.parameterKey,
    parameterName: method.parameterName,
    standardUnit: method.standardUnit,
    requestedBy,
    assignedTo: 'QC_ANALYST',
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Records an empirical laboratory measurement on a test.
 * Enforces mandatory unit and non-null validation.
 */
export function recordLabMeasurement(
  test: LabTest,
  value: number,
  unit: StandardUnit,
  methodName: string,
  instrumentId: string,
  analyst: string,
  repeatNumber = 1,
  instrumentRegistry: InstrumentRecord[] = CANONICAL_LAB_INSTRUMENTS,
  temperatureC: number | undefined = undefined,
  notes?: string,
  conditions: MeasurementConditions = {}
): LabMeasurement {
  // Strict non-promotion guardrail for simulated measurements
  if (
    instrumentId === 'SIMULATED' ||
    instrumentId === 'DEMO' ||
    instrumentId === 'NONE' ||
    instrumentId.includes('SIMULATED') ||
    instrumentId.includes('DEMO') ||
    analyst?.includes('SIMULATED') ||
    analyst?.includes('DEMO') ||
    notes?.includes('SIMULATED') ||
    notes?.includes('DEMO')
  ) {
    throw new Error('AUTHORITATIVE LIMS BLOCK: Simulated / Demo / Synthetic measurements are blocked from entering the authoritative laboratory evidence chain.');
  }

  if (!Number.isFinite(value)) {
    throw new Error(`Cannot record measurement for ${test.parameterName}: a finite numeric value is required.`);
  }
  if (temperatureC === undefined || !Number.isFinite(temperatureC)) {
    throw new Error('Cannot record measurement: actual measurement temperature is required and must be finite.');
  }
  if (conditions.sampleConcentration !== undefined && (!Number.isFinite(conditions.sampleConcentration) || conditions.sampleConcentration <= 0)) {
    throw new Error('Sample concentration must be a positive finite number when provided.');
  }
  if (conditions.dilutionWaterHardnessPpm !== undefined && (!Number.isFinite(conditions.dilutionWaterHardnessPpm) || conditions.dilutionWaterHardnessPpm < 0)) {
    throw new Error('Dilution water hardness must be a non-negative finite number when provided.');
  }
  if (!unit || unit !== test.standardUnit) {
    throw new Error(`Cannot record measurement for ${test.parameterName}: unit must match the test unit (${test.standardUnit}).`);
  }

  const instrument = getInstrumentWithCurrentStatus(instrumentId, instrumentRegistry);
  if (!instrument || instrument.classification !== 'USER_REGISTERED') {
    throw new Error(`AUTHORITATIVE LIMS BLOCK: Instrument '${instrumentId}' is not a user-registered instrument (classified as ${instrument?.classification || 'UNKNOWN'}). Reference and demo instruments cannot record authoritative laboratory measurements.`);
  }
  const method = CANONICAL_TEST_METHODS.find(item => item.methodId === test.testMethodId);
  if (!method) {
    throw new Error(`Cannot record measurement: test method '${test.testMethodId}' is not in the reviewed method registry.`);
  }
  if (method.requiredInstrumentType && instrument.instrumentType !== method.requiredInstrumentType) {
    throw new Error(`Instrument type mismatch: '${method.name}' requires ${method.requiredInstrumentType}, selected ${instrument.instrumentType}.`);
  }
  const calStatus = instrument.calibrationStatus;

  const measurementId = `MEAS-${test.testId}-R${repeatNumber}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  return {
    measurementId,
    testId: test.testId,
    sampleId: test.sampleId,
    batchId: test.batchId,
    formulaId: test.formulaId,
    formulaVersion: test.formulaVersion,
    parameterKey: test.parameterKey,
    parameterName: test.parameterName,
    value,
    unit,
    method: methodName,
    instrumentId,
    instrumentCalibrationStatusAtMeasurement: calStatus,
    measuredAt: now,
    analyst,
    repeatNumber,
    temperatureC,
    ...conditions,
    notes,
    createdAt: now,
  };
}

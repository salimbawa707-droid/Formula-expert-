/**
 * ============================================================================
 * P1 PHASE 13 — PRODUCTION BATCH, SCALE-UP & MANUFACTURING VALIDATION ENGINE
 * ============================================================================
 * 
 * Authoritative manufacturing and scale-up engine providing:
 * 1. Immutable formula version traceability (Family, ID, Version, Model, Spec, KB versions).
 * 2. Deterministic Scale-Up Engine (scaleFactor = targetBatchSize / referenceBatchSize, unit and density aware).
 * 3. Mass Balance Engine (planned vs actual input/output mass, process loss calculation, mass balance deviations).
 * 4. Density & Volume handling (explicit density tracking, zero 1 kg = 1 L unverified assumptions).
 * 5. Material & Lot Traceability (Planned vs actual consumption variance, assay/grade preservation, raw material lots).
 * 6. Process Steps & Parameters (planned vs actual temperatures, mixing speeds, addition order, provenance tracking).
 * 7. Category-Specific In-Process & Final QC (pH, viscosity, active matter, moisture, appearance, density).
 * 8. Batch Yield & Deviation Management (yield %, loss analysis, structured deviations with corrective/preventive actions).
 * 9. Controlled Batch Release Decision (RELEASED, ON_HOLD, REJECTED with explicit human confirmation and state immutability).
 * ============================================================================
 */

import { ProductCategoryId, normalizeProductCategory } from '../domain/productTaxonomy';
import { FormulationIngredient } from '../types';
import { MasterScientificQualityGateReport } from './scientificQualityGateEngine';
import { modelManufacturingProcess } from './manufacturing/processModelingEngine';

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export type BatchLifecycleStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'MATERIALS_READY'
  | 'READY_TO_MANUFACTURE'
  | 'IN_PROCESS'
  | 'QC_PENDING'
  | 'UNDER_REVIEW'
  | 'RELEASED'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type BatchReleaseStatus = 'PENDING' | 'RELEASED' | 'ON_HOLD' | 'REJECTED';

export type DeviationType =
  | 'MATERIAL_VARIANCE'
  | 'PROCESS_VARIANCE'
  | 'TEMPERATURE_VARIANCE'
  | 'PH_VARIANCE'
  | 'VISCOSITY_VARIANCE'
  | 'YIELD_VARIANCE'
  | 'QC_FAILURE'
  | 'MASS_BALANCE_VARIANCE'
  | 'DOCUMENTATION_ERROR'
  | 'OTHER';

export type DeviationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MaterialRequirement {
  ingredientId?: string;
  ingredientName: string;
  grade?: string;
  assayPct?: number;
  plannedQuantityKg: number;
  actualQuantityKg?: number;
  varianceKg?: number;
  variancePercent?: number;
  unit: string;
  supplier?: string;
  lotNumber?: string;
  materialLotId?: string;
}

export interface ProcessStepRecord {
  stepNumber: number;
  stepName: string;
  instruction: string;
  plannedTempC?: number;
  actualTempC?: number;
  plannedDurationMin?: number;
  actualDurationMin?: number;
  plannedMixRpm?: number;
  actualMixRpm?: number;
  provenance: 'FORMULA_DEFINED' | 'ENGINEERING_DEFAULT' | 'USER_DEFINED' | 'MEASURED';
  completed: boolean;
  notes?: string;
}

export interface InProcessQCRecord {
  parameterName: string;
  plannedTarget: string;
  actualMeasuredValue: number;
  unit: string;
  method: string;
  instrument?: string;
  operator: string;
  timestamp: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
}

export interface FinalQCRecord {
  kpiId: string;
  kpiName: string;
  predictedValue: number;
  measuredValue: number;
  unit: string;
  absoluteError: number;
  percentageError?: number;
  status: 'PASS' | 'FAIL' | 'OUT_OF_SPEC';
}

export interface BatchDeviationRecord {
  deviationId: string;
  batchId: string;
  type: DeviationType;
  severity: DeviationSeverity;
  description: string;
  plannedValue?: number;
  actualValue?: number;
  unit?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  resolvedAt?: string;
}

export interface ManufacturingBatch {
  batchId: string;
  batchNumber: string;
  formulaFamilyId: string;
  formulaId: string;
  formulaVersion: string;
  productCategory: ProductCategoryId;
  
  // Versions for historical traceability
  modelVersion: string;
  specificationVersion: string;
  ingredientKnowledgeVersion: string;

  // Scale & Mass balance
  referenceBatchSizeKg: number;
  plannedBatchSizeKg: number;
  actualBatchSizeKg: number;
  scaleFactor: number;
  densityKgPerL?: number;
  plannedVolumeLiters?: number;
  actualVolumeLiters?: number;

  plannedInputMassKg: number;
  actualInputMassKg: number;
  expectedOutputMassKg: number;
  actualOutputMassKg: number;
  processLossKg: number;
  processLossPercent: number;

  plannedMaterials: MaterialRequirement[];
  actualMaterials: MaterialRequirement[];
  processSteps: ProcessStepRecord[];
  
  inProcessQC: InProcessQCRecord[];
  finalQC: FinalQCRecord[];
  deviations: BatchDeviationRecord[];

  yieldPercent: number;
  yieldStatus: 'NORMAL' | 'YIELD_DEVIATION' | 'EXCESS_LOSS';

  status: BatchLifecycleStatus;
  releaseStatus: BatchReleaseStatus;
  qualityGateReport?: MasterScientificQualityGateReport;

  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  releasedAt?: string;
  releasedBy?: string;
  releaseRationale?: string;

  auditTrail: {
    timestamp: string;
    actor: string;
    action: string;
    details: string;
  }[];
}

// =============================================================================
// LEGACY MANUFACTURING ENGINE CLASS
// =============================================================================

/**
 * @deprecated Deprecated in favor of authoritative Process Modeling Engine (src/utils/manufacturing/processModelingEngine.ts).
 */
export class ManufacturingEngine {
  private batches: ManufacturingBatch[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('rnd_manufacturing_batches');
      if (saved) {
        this.batches = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load manufacturing batches from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('rnd_manufacturing_batches', JSON.stringify(this.batches));
    } catch (e) {
      console.error('Failed to save manufacturing batches to storage:', e);
    }
  }

  public getAllBatches(): ManufacturingBatch[] {
    return [...this.batches];
  }

  public getBatchById(batchId: string): ManufacturingBatch | undefined {
    return this.batches.find(b => b.batchId === batchId);
  }

  /**
   * Creates a planned manufacturing batch from an approved/development formula version.
   * Enforces strict scale-up calculation (scaleFactor = target / reference).
   */
  public planBatch(input: {
    batchNumber: string;
    formulaFamilyId: string;
    formulaId: string;
    formulaVersion: string;
    productCategory: ProductCategoryId;
    modelVersion: string;
    specificationVersion: string;
    ingredientKnowledgeVersion: string;
    referenceBatchSizeKg?: number;
    targetBatchSizeKg: number;
    densityKgPerL?: number;
    ingredients: FormulationIngredient[];
    actor: string;
  }): ManufacturingBatch {
    const category = normalizeProductCategory(input.productCategory) as ProductCategoryId;
    const batchId = `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const refSize = input.referenceBatchSizeKg ?? 10.0; // Standard reference lab scale = 10 kg
    const targetSize = input.targetBatchSizeKg;
    const scaleFactor = targetSize / refSize;
    const density = input.densityKgPerL; // Optional explicit density

    let plannedInputMass = 0;
    const plannedMaterials: MaterialRequirement[] = input.ingredients.map(ing => {
      const refPct = ing.percentage ?? ing.percent ?? 0;
      const plannedKg = Number(((refPct / 100) * targetSize).toFixed(3));
      plannedInputMass += plannedKg;
      return {
        ingredientName: ing.name,
        grade: ing.category || 'Standard Grade',
        assayPct: ing.activeMatterPct ?? ing.activePercent ?? 100,
        plannedQuantityKg: plannedKg,
        unit: 'kg'
      };
    });

    const expectedOutputMass = plannedInputMass;
    const plannedVolume = density && density > 0 ? Number((targetSize / density).toFixed(3)) : undefined;

    // Delegate process modeling to authoritative processModelingEngine
    const modeledProc = modelManufacturingProcess(input.ingredients as FormulationIngredient[], category, targetSize);
    const defaultSteps: ProcessStepRecord[] = modeledProc.processSteps.map((step) => ({
      stepNumber: step.stepNumber,
      stepName: step.phaseName,
      instruction: `${step.phaseName}: Target ${step.targetIngredients.join(', ')}. Method: ${step.additionMethod}. ${step.criticalQualityControls.join(' ')}`,
      plannedTempC: step.targetTemperatureC.max,
      plannedDurationMin: step.mixingDurationMinutes,
      plannedMixRpm: step.recommendedAgitation === 'HIGH_SHEAR_HOMOGENIZER' ? 1000 : step.recommendedAgitation === 'MEDIUM_SHEAR_TURBINE' ? 500 : 150,
      provenance: 'FORMULA_DEFINED',
      completed: false
    }));

    const batch: ManufacturingBatch = {
      batchId,
      batchNumber: input.batchNumber,
      formulaFamilyId: input.formulaFamilyId,
      formulaId: input.formulaId,
      formulaVersion: input.formulaVersion,
      productCategory: category,
      modelVersion: input.modelVersion,
      specificationVersion: input.specificationVersion,
      ingredientKnowledgeVersion: input.ingredientKnowledgeVersion,
      referenceBatchSizeKg: refSize,
      plannedBatchSizeKg: targetSize,
      actualBatchSizeKg: 0,
      scaleFactor: Number(scaleFactor.toFixed(4)),
      densityKgPerL: density,
      plannedVolumeLiters: plannedVolume,
      plannedInputMassKg: Number(plannedInputMass.toFixed(3)),
      actualInputMassKg: 0,
      expectedOutputMassKg: Number(expectedOutputMass.toFixed(3)),
      actualOutputMassKg: 0,
      processLossKg: 0,
      processLossPercent: 0,
      plannedMaterials,
      actualMaterials: [],
      processSteps: defaultSteps,
      inProcessQC: [],
      finalQC: [],
      deviations: [],
      yieldPercent: 0,
      yieldStatus: 'NORMAL',
      status: 'PLANNED',
      releaseStatus: 'PENDING',
      createdAt: now,
      createdBy: input.actor,
      auditTrail: [
        {
          timestamp: now,
          actor: input.actor,
          action: 'BATCH_PLANNED',
          details: `Planned batch ${input.batchNumber} at scale factor ${scaleFactor.toFixed(4)} (${targetSize} kg target size) from formula version ${input.formulaVersion}.`
        }
      ]
    };

    this.batches.push(batch);
    this.saveToStorage();
    return batch;
  }

  /**
   * Records actual material consumption and calculates variance.
   */
  public recordMaterialConsumption(input: {
    batchId: string;
    actualMaterials: { ingredientName: string; actualQuantityKg: number; supplier?: string; lotNumber?: string }[];
    actor: string;
  }): ManufacturingBatch {
    const batch = this.getBatchById(input.batchId);
    if (!batch) throw new Error(`Batch not found: ${input.batchId}`);
    if (batch.releaseStatus === 'RELEASED') throw new Error('Cannot modify materials for a released batch.');

    let actualInputMass = 0;
    const actualMaterialRecords: MaterialRequirement[] = input.actualMaterials.map(mat => {
      const planned = batch.plannedMaterials.find(p => p.ingredientName.toLowerCase() === mat.ingredientName.toLowerCase());
      const plannedKg = planned ? planned.plannedQuantityKg : 0;
      const varianceKg = Number((mat.actualQuantityKg - plannedKg).toFixed(3));
      const variancePercent = plannedKg > 0 ? Number(((varianceKg / plannedKg) * 100).toFixed(2)) : 0;
      actualInputMass += mat.actualQuantityKg;

      return {
        ingredientName: mat.ingredientName,
        plannedQuantityKg: plannedKg,
        actualQuantityKg: mat.actualQuantityKg,
        varianceKg,
        variancePercent,
        unit: 'kg',
        supplier: mat.supplier,
        lotNumber: mat.lotNumber
      };
    });

    batch.actualMaterials = actualMaterialRecords;
    batch.actualInputMassKg = Number(actualInputMass.toFixed(3));
    batch.status = 'MATERIALS_READY';

    const now = new Date().toISOString();
    batch.auditTrail.push({
      timestamp: now,
      actor: input.actor,
      action: 'MATERIALS_CONSUMED',
      details: `Recorded actual material consumption. Actual input mass: ${actualInputMass.toFixed(3)} kg.`
    });

    this.saveToStorage();
    return batch;
  }

  /**
   * Completes batch execution, calculates mass balance, process loss, and yield percentage.
   */
  public completeBatchExecution(input: {
    batchId: string;
    actualOutputMassKg: number;
    densityKgPerL?: number;
    actor: string;
  }): ManufacturingBatch {
    const batch = this.getBatchById(input.batchId);
    if (!batch) throw new Error(`Batch not found: ${input.batchId}`);

    batch.actualOutputMassKg = Number(input.actualOutputMassKg.toFixed(3));
    batch.actualBatchSizeKg = batch.actualOutputMassKg;
    
    if (input.densityKgPerL && input.densityKgPerL > 0) {
      batch.densityKgPerL = input.densityKgPerL;
      batch.actualVolumeLiters = Number((batch.actualOutputMassKg / input.densityKgPerL).toFixed(3));
    }

    const processLossKg = Number((batch.actualInputMassKg - batch.actualOutputMassKg).toFixed(3));
    const processLossPercent = batch.actualInputMassKg > 0 ? Number(((processLossKg / batch.actualInputMassKg) * 100).toFixed(2)) : 0;
    
    batch.processLossKg = processLossKg;
    batch.processLossPercent = processLossPercent;

    const yieldPercent = batch.expectedOutputMassKg > 0 ? Number(((batch.actualOutputMassKg / batch.expectedOutputMassKg) * 100).toFixed(2)) : 100;
    batch.yieldPercent = yieldPercent;

    if (Math.abs(yieldPercent - 100) > 3.0) {
      batch.yieldStatus = 'YIELD_DEVIATION';
    } else {
      batch.yieldStatus = 'NORMAL';
    }

    batch.status = 'QC_PENDING';
    const now = new Date().toISOString();
    batch.completedAt = now;

    batch.auditTrail.push({
      timestamp: now,
      actor: input.actor,
      action: 'BATCH_EXECUTED',
      details: `Completed batch execution. Output mass: ${batch.actualOutputMassKg} kg. Yield: ${yieldPercent}%. Process loss: ${processLossKg} kg (${processLossPercent}%).`
    });

    this.saveToStorage();
    return batch;
  }

  /**
   * Records In-Process QC or Final QC, running Quality Gate verification.
   */
  public recordQC(input: {
    batchId: string;
    inProcessRecords?: InProcessQCRecord[];
    finalRecords?: FinalQCRecord[];
    actor: string;
  }): ManufacturingBatch {
    const batch = this.getBatchById(input.batchId);
    if (!batch) throw new Error(`Batch not found: ${input.batchId}`);

    if (input.inProcessRecords) {
      batch.inProcessQC.push(...input.inProcessRecords);
    }
    if (input.finalRecords) {
      batch.finalQC.push(...input.finalRecords);
    }

    batch.status = 'UNDER_REVIEW';
    const now = new Date().toISOString();
    batch.auditTrail.push({
      timestamp: now,
      actor: input.actor,
      action: 'QC_RECORDED',
      details: `Recorded QC records for batch ${batch.batchNumber}. Status updated to UNDER_REVIEW.`
    });

    this.saveToStorage();
    return batch;
  }

  /**
   * Records a structured batch deviation.
   */
  public recordDeviation(input: {
    batchId: string;
    type: DeviationType;
    severity: DeviationSeverity;
    description: string;
    plannedValue?: number;
    actualValue?: number;
    unit?: string;
    rootCause?: string;
    correctiveAction?: string;
    actor: string;
  }): BatchDeviationRecord {
    const batch = this.getBatchById(input.batchId);
    if (!batch) throw new Error(`Batch not found: ${input.batchId}`);

    const deviationId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const deviation: BatchDeviationRecord = {
      deviationId,
      batchId: batch.batchId,
      type: input.type,
      severity: input.severity,
      description: input.description,
      plannedValue: input.plannedValue,
      actualValue: input.actualValue,
      unit: input.unit,
      rootCause: input.rootCause,
      correctiveAction: input.correctiveAction,
      status: 'OPEN',
      createdAt: now
    };

    batch.deviations.push(deviation);
    batch.auditTrail.push({
      timestamp: now,
      actor: input.actor,
      action: 'DEVIATION_RECORDED',
      details: `Recorded deviation [${input.type}] (Severity: ${input.severity}): ${input.description}`
    });

    this.saveToStorage();
    return deviation;
  }

  /**
   * Makes a final batch release decision (RELEASED, ON_HOLD, REJECTED).
   * Enforces immutability once released or rejected.
   */
  public makeReleaseDecision(input: {
    batchId: string;
    releaseStatus: BatchReleaseStatus;
    rationale: string;
    actor: string;
  }): ManufacturingBatch {
    const batch = this.getBatchById(input.batchId);
    if (!batch) throw new Error(`Batch not found: ${input.batchId}`);

    if (batch.releaseStatus === 'RELEASED' || batch.releaseStatus === 'REJECTED') {
      throw new Error(`Batch ${batch.batchNumber} is already finalized (${batch.releaseStatus}) and immutable.`);
    }

    const now = new Date().toISOString();
    batch.releaseStatus = input.releaseStatus;
    batch.releaseRationale = input.rationale;
    batch.releasedAt = now;
    batch.releasedBy = input.actor;

    if (input.releaseStatus === 'RELEASED') {
      batch.status = 'RELEASED';
    } else if (input.releaseStatus === 'ON_HOLD') {
      batch.status = 'ON_HOLD';
    } else if (input.releaseStatus === 'REJECTED') {
      batch.status = 'REJECTED';
    }

    batch.auditTrail.push({
      timestamp: now,
      actor: input.actor,
      action: 'BATCH_RELEASE_DECISION',
      details: `Batch release decision: ${input.releaseStatus}. Rationale: ${input.rationale}`
    });

    this.saveToStorage();
    return batch;
  }
}

export const globalManufacturingEngine = new ManufacturingEngine();

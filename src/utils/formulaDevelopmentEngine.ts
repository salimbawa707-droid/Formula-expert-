/**
 * ============================================================================
 * P1 PHASE 12 — FORMULA DEVELOPMENT & ITERATION LIFECYCLE ENGINE
 * ============================================================================
 * 
 * Authoritative lifecycle engine for controlled, scientifically traceable formula R&D:
 * 1. Formula Family vs. Formula Version separation (Lineage vs. Specific state).
 * 2. Strict Formula Version Immutability (Tested/Approved versions are historical and immutable; edits spawn revisions).
 * 3. Explicit Version Lifecycle States (DRAFT, IN_DEVELOPMENT, READY_FOR_TRIAL, UNDER_TEST, EVIDENCE_REVIEW, CANDIDATE, APPROVED, REJECTED, SUPERSEDED, ARCHIVED).
 * 4. Structured Formula Change Records & Deterministic Diff Engine (Ingredient deltas, dosage shifts, assay/grade tracking).
 * 5. Structured Change Reasons (PERFORMANCE_IMPROVEMENT, PH_ADJUSTMENT, VISCOSITY_ADJUSTMENT, etc.).
 * 6. Experiment & Evidence Traceability (Linking version directly to P1 Phase 11 trials, measurements, and learning candidates).
 * 7. Development Decisions (CONTINUE_DEVELOPMENT, REVISE_FORMULA, RUN_MORE_EXPERIMENTS, HOLD, REJECT_VERSION, PROMOTE_TO_CANDIDATE).
 * 8. Governance & Quality Gate Integration (Approval requires passing authoritative P1 Phase 5/10 Scientific Quality Gate).
 * 9. Rollback & Supersession Semantics (Controlled rollback reference without historical destruction).
 * ============================================================================
 */

import { ProductCategoryId, normalizeProductCategory } from '../domain/productTaxonomy';
import { FormulationIngredient } from '../types';
import { evaluateScientificQualityGate, MasterScientificQualityGateReport } from './scientificQualityGateEngine';

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export type FormulaDevelopmentStatus =
  | 'DRAFT'
  | 'IN_DEVELOPMENT'
  | 'READY_FOR_TRIAL'
  | 'UNDER_TEST'
  | 'EVIDENCE_REVIEW'
  | 'CANDIDATE'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type ChangeReason =
  | 'PERFORMANCE_IMPROVEMENT'
  | 'PH_ADJUSTMENT'
  | 'VISCOSITY_ADJUSTMENT'
  | 'HARD_WATER_IMPROVEMENT'
  | 'COMPATIBILITY_FIX'
  | 'STABILITY_FIX'
  | 'COST_ADJUSTMENT'
  | 'RAW_MATERIAL_CHANGE'
  | 'SUPPLIER_GRADE_CHANGE'
  | 'PROCESS_CHANGE'
  | 'LAB_EVIDENCE_RESPONSE'
  | 'SPECIFICATION_RESPONSE'
  | 'USER_INITIATED'
  | 'OTHER';

export type DevelopmentDecisionType =
  | 'CONTINUE_DEVELOPMENT'
  | 'REVISE_FORMULA'
  | 'RUN_MORE_EXPERIMENTS'
  | 'HOLD'
  | 'REJECT_VERSION'
  | 'PROMOTE_TO_CANDIDATE';

export interface IngredientChangeDelta {
  ingredientName: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED';
  previousPercentage?: number;
  newPercentage?: number;
  percentagePointDelta?: number;
  previousGrade?: string;
  newGrade?: string;
}

export interface FormulaChangeRecord {
  parentVersionId?: string;
  changeReason: ChangeReason;
  summary: string;
  ingredientDeltas: IngredientChangeDelta[];
  processInstructionChanges?: string;
  changedAt: string;
  changedBy: string;
}

export interface FormulaVersion {
  versionId: string;
  formulaFamilyId: string;
  versionNumber: string; // e.g. "V1", "V2"
  productCategory: ProductCategoryId;
  status: FormulaDevelopmentStatus;
  ingredients: FormulationIngredient[];
  targetPH?: number;
  batchSizeKg?: number;
  description?: string;
  changeRecord?: FormulaChangeRecord;
  
  // Scientific Context Tracking (Phase 7/12 separation)
  modelVersion: string;
  specificationVersion: string;
  ingredientKnowledgeVersion: string;
  
  // Snapshot of authoritative quality gate & predictions
  predictionSnapshot?: Record<string, number>;
  qualityGateResult?: MasterScientificQualityGateReport;
  
  // Traceability links
  experimentIds: string[];
  evidenceRecordIds: string[];
  learningCandidateIds: string[];
  decisionIds: string[];
  
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  rejectedBy?: string;
}

export interface DevelopmentDecisionRecord {
  decisionId: string;
  formulaVersionId: string;
  decision: DevelopmentDecisionType;
  reason: string;
  evidenceReferences: string[];
  experimentReferences: string[];
  createdAt: string;
  createdBy: string;
}

export interface FormulaDevelopmentFamily {
  developmentId: string;
  familyTitle: string;
  productCategory: ProductCategoryId;
  currentVersionId: string;
  activeApprovedVersionId?: string;
  objective: string;
  targetProfile?: string;
  versions: FormulaVersion[];
  decisions: DevelopmentDecisionRecord[];
  createdAt: string;
  updatedAt: string;
  auditTrail: {
    timestamp: string;
    actor: string;
    action: string;
    details: string;
  }[];
}

export interface FormulaDiffResult {
  versionAId: string;
  versionBId: string;
  category: ProductCategoryId;
  ingredientDeltas: IngredientChangeDelta[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  totalPercentageDelta: number;
  predictionDiffs: Record<string, { valA: number; valB: number; delta: number }>;
}

// =============================================================================
// AUTHORITATIVE FORMULA DEVELOPMENT ENGINE CLASS
// =============================================================================

export class FormulaDevelopmentEngine {
  private families: FormulaDevelopmentFamily[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.families.length === 0) {
      this.seedDefaultFamilies();
    }
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('rnd_formula_development_families');
      if (saved) {
        this.families = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load formula development families from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('rnd_formula_development_families', JSON.stringify(this.families));
    } catch (e) {
      console.error('Failed to save formula development families to storage:', e);
    }
  }

  private seedDefaultFamilies() {
    // Seed an initial standard formula family for testing and baseline workflow
    this.createFamily({
      familyTitle: 'Premium Liquid Laundry Detergent Lineage',
      productCategory: 'LAUNDRY_LIQUID',
      objective: 'High-efficiency liquid laundry detergent with enzyme synergy and hard water tolerance.',
      targetProfile: 'pH 8.0 - 8.5, Active Matter 22%, Hard water chelation up to 300 ppm CaCO3',
      initialIngredients: [
        { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
        { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA)', percentage: 6, activeMatterPct: 96, category: 'Anionic Surfactant' },
        { name: 'Sodium Citrate', percentage: 4, activeMatterPct: 100, category: 'Builder' },
        { name: 'Water', percentage: 78, activeMatterPct: 0, category: 'Solvent' }
      ],
      author: 'Senior R&D Chemist'
    });
  }

  public getAllFamilies(): FormulaDevelopmentFamily[] {
    return [...this.families];
  }

  public getFamilyById(developmentId: string): FormulaDevelopmentFamily | undefined {
    return this.families.find(f => f.developmentId === developmentId);
  }

  public getVersionById(versionId: string): { family: FormulaDevelopmentFamily; version: FormulaVersion } | undefined {
    for (const family of this.families) {
      const version = family.versions.find(v => v.versionId === versionId);
      if (version) {
        return { family, version };
      }
    }
    return undefined;
  }

  /**
   * Creates a new Formula Development Family with V1 draft.
   */
  public createFamily(input: {
    familyTitle: string;
    productCategory: ProductCategoryId;
    objective: string;
    targetProfile?: string;
    initialIngredients: FormulationIngredient[];
    author: string;
  }): FormulaDevelopmentFamily {
    const category = normalizeProductCategory(input.productCategory) as ProductCategoryId;
    const developmentId = `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const versionId = `ver-${developmentId}-v1`;
    const now = new Date().toISOString();

    const v1: FormulaVersion = {
      versionId,
      formulaFamilyId: developmentId,
      versionNumber: 'V1',
      productCategory: category,
      status: 'IN_DEVELOPMENT',
      ingredients: input.initialIngredients,
      targetPH: 8.2,
      batchSizeKg: 100,
      description: 'Initial formulation draft.',
      modelVersion: 'v2.4.0',
      specificationVersion: 'v1.2.0',
      ingredientKnowledgeVersion: 'v3.0.0',
      experimentIds: [],
      evidenceRecordIds: [],
      learningCandidateIds: [],
      decisionIds: [],
      createdAt: now,
      createdBy: input.author
    };

    const family: FormulaDevelopmentFamily = {
      developmentId,
      familyTitle: input.familyTitle,
      productCategory: category,
      currentVersionId: versionId,
      objective: input.objective,
      targetProfile: input.targetProfile,
      versions: [v1],
      decisions: [],
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          timestamp: now,
          actor: input.author,
          action: 'FAMILY_CREATED',
          details: `Created formula family "${input.familyTitle}" with V1.`
        }
      ]
    };

    this.families.push(family);
    this.saveToStorage();
    return family;
  }

  /**
   * Creates a new Formula Version (Revision) from an existing version.
   * Enforces immutability of past versions and calculates deterministic change deltas.
   */
  public createNewVersion(input: {
    familyId: string;
    parentVersionId: string;
    newIngredients: FormulationIngredient[];
    changeReason: ChangeReason;
    summary: string;
    author: string;
    processInstructionChanges?: string;
  }): FormulaVersion {
    const family = this.getFamilyById(input.familyId);
    if (!family) throw new Error(`Formula family not found: ${input.familyId}`);

    const parentVersion = family.versions.find(v => v.versionId === input.parentVersionId);
    if (!parentVersion) throw new Error(`Parent version not found: ${input.parentVersionId}`);

    const nextVersionNumber = `V${family.versions.length + 1}`;
    const versionId = `ver-${family.developmentId}-${nextVersionNumber.toLowerCase()}`;
    const now = new Date().toISOString();

    // Calculate ingredient deltas
    const ingredientDeltas: IngredientChangeDelta[] = [];
    const parentMap = new Map<string, number>();
    parentVersion.ingredients.forEach(i => parentMap.set(i.name.toLowerCase(), i.percentage ?? i.percent ?? 0));

    const newMap = new Map<string, number>();
    input.newIngredients.forEach(i => newMap.set(i.name.toLowerCase(), i.percentage ?? i.percent ?? 0));

    // Check added or modified
    input.newIngredients.forEach(ing => {
      const nameKey = ing.name.toLowerCase();
      const newPct = ing.percentage ?? ing.percent ?? 0;
      if (parentMap.has(nameKey)) {
        const oldPct = parentMap.get(nameKey)!;
        if (Math.abs(oldPct - newPct) > 0.001) {
          ingredientDeltas.push({
            ingredientName: ing.name,
            changeType: 'MODIFIED',
            previousPercentage: oldPct,
            newPercentage: newPct,
            percentagePointDelta: Number((newPct - oldPct).toFixed(3))
          });
        }
      } else {
        ingredientDeltas.push({
          ingredientName: ing.name,
          changeType: 'ADDED',
          newPercentage: newPct
        });
      }
    });

    // Check removed
    parentVersion.ingredients.forEach(parentIng => {
      const nameKey = parentIng.name.toLowerCase();
      if (!newMap.has(nameKey)) {
        ingredientDeltas.push({
          ingredientName: parentIng.name,
          changeType: 'REMOVED',
          previousPercentage: parentIng.percentage ?? parentIng.percent ?? 0
        });
      }
    });

    const changeRecord: FormulaChangeRecord = {
      parentVersionId: parentVersion.versionId,
      changeReason: input.changeReason,
      summary: input.summary,
      ingredientDeltas,
      processInstructionChanges: input.processInstructionChanges,
      changedAt: now,
      changedBy: input.author
    };

    const newVersion: FormulaVersion = {
      versionId,
      formulaFamilyId: family.developmentId,
      versionNumber: nextVersionNumber,
      productCategory: family.productCategory,
      status: 'IN_DEVELOPMENT',
      ingredients: input.newIngredients,
      targetPH: parentVersion.targetPH,
      batchSizeKg: parentVersion.batchSizeKg,
      description: input.summary,
      changeRecord,
      modelVersion: parentVersion.modelVersion,
      specificationVersion: parentVersion.specificationVersion,
      ingredientKnowledgeVersion: parentVersion.ingredientKnowledgeVersion,
      experimentIds: [],
      evidenceRecordIds: [],
      learningCandidateIds: [],
      decisionIds: [],
      createdAt: now,
      createdBy: input.author
    };

    family.versions.push(newVersion);
    family.currentVersionId = versionId;
    family.updatedAt = now;
    family.auditTrail.push({
      timestamp: now,
      actor: input.author,
      action: 'VERSION_CREATED',
      details: `Created ${nextVersionNumber} from ${parentVersion.versionNumber} due to ${input.changeReason}: ${input.summary}`
    });

    this.saveToStorage();
    return newVersion;
  }

  /**
   * Updates the status of a formula version.
   */
  public updateVersionStatus(versionId: string, newStatus: FormulaDevelopmentStatus, actor: string): FormulaVersion {
    const res = this.getVersionById(versionId);
    if (!res) throw new Error(`Version not found: ${versionId}`);

    const { family, version } = res;
    const oldStatus = version.status;
    version.status = newStatus;
    family.updatedAt = new Date().toISOString();

    family.auditTrail.push({
      timestamp: family.updatedAt,
      actor,
      action: 'STATUS_CHANGED',
      details: `Version ${version.versionNumber} status changed from ${oldStatus} to ${newStatus}`
    });

    this.saveToStorage();
    return version;
  }

  /**
   * Links an experiment trial ID to a formula version.
   */
  public linkExperimentToVersion(versionId: string, experimentId: string, actor: string): FormulaVersion {
    const res = this.getVersionById(versionId);
    if (!res) throw new Error(`Version not found: ${versionId}`);

    const { family, version } = res;
    if (!version.experimentIds.includes(experimentId)) {
      version.experimentIds.push(experimentId);
      family.updatedAt = new Date().toISOString();
      family.auditTrail.push({
        timestamp: family.updatedAt,
        actor,
        action: 'EXPERIMENT_LINKED',
        details: `Linked experiment ${experimentId} to version ${version.versionNumber}`
      });
      this.saveToStorage();
    }
    return version;
  }

  /**
   * Records a structured Development Decision.
   */
  public recordDevelopmentDecision(input: {
    versionId: string;
    decision: DevelopmentDecisionType;
    reason: string;
    evidenceReferences?: string[];
    experimentReferences?: string[];
    actor: string;
  }): DevelopmentDecisionRecord {
    const res = this.getVersionById(input.versionId);
    if (!res) throw new Error(`Version not found: ${input.versionId}`);

    const { family, version } = res;
    const decisionId = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: DevelopmentDecisionRecord = {
      decisionId,
      formulaVersionId: version.versionId,
      decision: input.decision,
      reason: input.reason,
      evidenceReferences: input.evidenceReferences || [],
      experimentReferences: input.experimentReferences || version.experimentIds,
      createdAt: now,
      createdBy: input.actor
    };

    family.decisions.push(record);
    version.decisionIds.push(decisionId);

    // Automatically transition status based on decision if appropriate
    if (input.decision === 'PROMOTE_TO_CANDIDATE') {
      version.status = 'CANDIDATE';
    } else if (input.decision === 'REJECT_VERSION') {
      version.status = 'REJECTED';
      version.rejectionReason = input.reason;
      version.rejectedBy = input.actor;
    }

    family.updatedAt = now;
    family.auditTrail.push({
      timestamp: now,
      actor: input.actor,
      action: 'DEVELOPMENT_DECISION_RECORDED',
      details: `Recorded decision ${input.decision} for version ${version.versionNumber}: ${input.reason}`
    });

    this.saveToStorage();
    return record;
  }

  /**
   * Explicitly approves a formula version after running the authoritative Quality Gate.
   */
  public approveVersion(versionId: string, actor: string): { version: FormulaVersion; qualityGateResult: MasterScientificQualityGateReport } {
    const res = this.getVersionById(versionId);
    if (!res) throw new Error(`Version not found: ${versionId}`);

    const { family, version } = res;
    const now = new Date().toISOString();

    // 1. Run authoritative Scientific Quality Gate
    const qgResult = evaluateScientificQualityGate({
      productCategory: version.productCategory,
      ingredients: version.ingredients,
      formulaName: `${family.familyTitle} (${version.versionNumber})`
    });

    version.qualityGateResult = qgResult;
    version.predictionSnapshot = {
      pH: qgResult.speciationResult?.pH ?? 8.0,
      activeMatterPct: qgResult.activeMatterResult?.totalActiveMatterPct ?? 20.0,
      cleaningIndex: qgResult.performanceResult?.cpi ?? 85.0
    };

    if (qgResult.finalFormulaStatus === 'SCIENTIFICALLY_INVALID' || qgResult.finalFormulaStatus === 'INCOMPATIBLE' || qgResult.compatibilityStatus === 'CRITICAL_HAZARD') {
      const reasonMsg = qgResult.blockingIssues?.map(i => i.message).join('; ') || 'Quality gate failure';
      throw new Error(`Cannot approve formula version ${version.versionNumber}: Quality Gate failed with status ${qgResult.finalFormulaStatus}. Reason: ${reasonMsg}`);
    }

    version.status = 'APPROVED';
    version.approvedAt = now;
    version.approvedBy = actor;

    // Supersede previous active approved version if any
    if (family.activeApprovedVersionId && family.activeApprovedVersionId !== version.versionId) {
      const prevActive = family.versions.find(v => v.versionId === family.activeApprovedVersionId);
      if (prevActive && prevActive.status === 'APPROVED') {
        prevActive.status = 'SUPERSEDED';
      }
    }

    family.activeApprovedVersionId = version.versionId;
    family.updatedAt = now;
    family.auditTrail.push({
      timestamp: now,
      actor,
      action: 'VERSION_APPROVED',
      details: `Approved version ${version.versionNumber} with Quality Gate status ${qgResult.finalFormulaStatus}`
    });

    this.saveToStorage();
    return { version, qualityGateResult: qgResult };
  }

  /**
   * Rejects a formula version.
   */
  public rejectVersion(versionId: string, rejectionReason: string, actor: string): FormulaVersion {
    const res = this.getVersionById(versionId);
    if (!res) throw new Error(`Version not found: ${versionId}`);

    const { family, version } = res;
    const now = new Date().toISOString();

    version.status = 'REJECTED';
    version.rejectionReason = rejectionReason;
    version.rejectedBy = actor;
    family.updatedAt = now;

    family.auditTrail.push({
      timestamp: now,
      actor,
      action: 'VERSION_REJECTED',
      details: `Rejected version ${version.versionNumber}: ${rejectionReason}`
    });

    this.saveToStorage();
    return version;
  }

  /**
   * Controlled Rollback reference to an earlier approved version without deleting newer history.
   */
  public rollbackFamilyReference(familyId: string, targetVersionId: string, actor: string): FormulaDevelopmentFamily {
    const family = this.getFamilyById(familyId);
    if (!family) throw new Error(`Family not found: ${familyId}`);

    const targetVersion = family.versions.find(v => v.versionId === targetVersionId);
    if (!targetVersion) throw new Error(`Target version not found: ${targetVersionId}`);
    if (targetVersion.status !== 'APPROVED' && targetVersion.status !== 'SUPERSEDED') {
      throw new Error(`Cannot rollback to version ${targetVersion.versionNumber} because it was never approved.`);
    }

    const now = new Date().toISOString();
    family.activeApprovedVersionId = targetVersion.versionId;
    family.currentVersionId = targetVersion.versionId;
    family.updatedAt = now;

    family.auditTrail.push({
      timestamp: now,
      actor,
      action: 'FAMILY_ROLLED_BACK',
      details: `Rolled back family active reference to version ${targetVersion.versionNumber}. Newer versions remain preserved in history.`
    });

    this.saveToStorage();
    return family;
  }

  /**
   * Deterministic Formula Diff Engine comparing two versions.
   */
  public compareVersions(versionAId: string, versionBId: string): FormulaDiffResult {
    const resA = this.getVersionById(versionAId);
    const resB = this.getVersionById(versionBId);

    if (!resA || !resB) throw new Error('One or both comparison versions not found.');
    const vA = resA.version;
    const vB = resB.version;

    if (vA.productCategory !== vB.productCategory) {
      throw new Error('Cannot compare versions across different product categories.');
    }

    const mapA = new Map<string, number>();
    vA.ingredients.forEach(i => mapA.set(i.name.toLowerCase(), i.percentage ?? i.percent ?? 0));

    const mapB = new Map<string, number>();
    vB.ingredients.forEach(i => mapB.set(i.name.toLowerCase(), i.percentage ?? i.percent ?? 0));

    const ingredientDeltas: IngredientChangeDelta[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let totalPercentageDelta = 0;

    vB.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase();
      const pctB = ing.percentage ?? ing.percent ?? 0;
      if (mapA.has(key)) {
        const pctA = mapA.get(key)!;
        const delta = Number((pctB - pctA).toFixed(3));
        if (Math.abs(delta) > 0.001) {
          modifiedCount++;
          totalPercentageDelta += Math.abs(delta);
          ingredientDeltas.push({
            ingredientName: ing.name,
            changeType: 'MODIFIED',
            previousPercentage: pctA,
            newPercentage: pctB,
            percentagePointDelta: delta
          });
        }
      } else {
        addedCount++;
        totalPercentageDelta += pctB;
        ingredientDeltas.push({
          ingredientName: ing.name,
          changeType: 'ADDED',
          newPercentage: pctB
        });
      }
    });

    vA.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase();
      const pctA = ing.percentage ?? ing.percent ?? 0;
      if (!mapB.has(key)) {
        removedCount++;
        totalPercentageDelta += pctA;
        ingredientDeltas.push({
          ingredientName: ing.name,
          changeType: 'REMOVED',
          previousPercentage: pctA
        });
      }
    });

    const predictionDiffs: Record<string, { valA: number; valB: number; delta: number }> = {};
    const snapA = vA.predictionSnapshot || {};
    const snapB = vB.predictionSnapshot || {};
    const allKeys = new Set([...Object.keys(snapA), ...Object.keys(snapB)]);

    allKeys.forEach(k => {
      const valA = snapA[k] ?? 0;
      const valB = snapB[k] ?? 0;
      predictionDiffs[k] = {
        valA,
        valB,
        delta: Number((valB - valA).toFixed(3))
      };
    });

    return {
      versionAId,
      versionBId,
      category: vA.productCategory,
      ingredientDeltas,
      addedCount,
      removedCount,
      modifiedCount,
      totalPercentageDelta: Number(totalPercentageDelta.toFixed(3)),
      predictionDiffs
    };
  }
}

export const globalFormulaDevelopmentEngine = new FormulaDevelopmentEngine();

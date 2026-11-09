/**
 * ============================================================================
 * PHASE 3 — AUTHORITATIVE DEPENDENCY-DRIVEN SCIENTIFIC EXECUTION DAG
 * ============================================================================
 * Coordinates the execution of all 24 reconciled scientific engines based on
 * real physical and chemical data dependencies.
 * ============================================================================
 */

import { CanonicalFormulaInput, CanonicalIngredientInput } from './types';
import { ProductCategoryId, PhysicalForm, normalizeProductCategory, getProductCategory } from '../../domain/productTaxonomy';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { calculatePHAdvanced } from '../pHEngine';
import { StoichiometricNeutralizationEngine } from '../../domain/ph/stoichiometricNeutralizationEngine';
import { HLBEngine } from '../hlbEngine';
import {
  calculateActiveSurfactants,
  calculateActiveMatter,
  calculateRawSurfactants,
  getDefaultActiveMatter,
  ActiveMatterEngine,
  calculateActiveMatterResult
} from '../activeMatterEngine';
import {
  calculateWaterHardnessTolerance,
  getProductHardnessPolicy
} from '../chelatorEngine';
import { calculateFormulationCompatibility } from '../compatibilityEngine';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import { ViscosityEngine, calculateDetailedViscosity } from '../viscosityEngine';
import { calculateDensity } from '../densityEngine';
import { calculateLiquidNVR } from '../liquidNvrEngine';
import { calculateFormulaCost, calculateCommercialMarginChain } from '../costingEngine';
import { evaluateFormulaScientificValidation } from '../labEvidenceEngine';
import { evaluateRegulatoryCompliance } from '../regulatoryEngine';
import { evaluateExpertReasoning } from '../expertReasoningEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { evaluatePowderFormulation } from '../powderEngine';
import { evaluateAIGrade } from '../gradeEngine';
import { UNIVERSAL_INGREDIENTS } from '../../data/universalIngredientLibrary';
import { getIngredientIntelligence } from '../ingredientIntelligenceEngine';
import { computeFormulaFingerprint } from '../provenanceEngine';
import { getPreservativeWarning } from '../calculators';
import { calculateLabHealthScore } from '../labHealthEngine';
import { analyzeClimateAndHardWater } from '../climateEngine';
import { findSubstitutionsForFormula } from '../substitutionEngine';
import { evaluateSpecifications, getSpecificationTemplateForCategory } from '../specificationEngine';
import { validateActiveMatterInput } from '../activeMatterInputGuard';
import { validatePHInput } from '../phInputGuard';

// =============================================================================
// 1. STRONGLY TYPED INTERMEDIATE SCIENTIFIC STATE MODEL
// =============================================================================

export type SemanticStatus =
  | 'VALID'
  | 'ESTIMATED'
  | 'SCREENING'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA'
  | 'BLOCKED'
  | 'NOT_APPLICABLE'
  | 'FAILED';

export interface ScientificExecutionState {
  // Input parameters
  rawInput: CanonicalFormulaInput;
  formulaId: string;
  formulaName: string;
  formulaVersion: string;
  batchSizeKg: number;
  waterHardnessPpm: number | null;

  // 1. Normalization
  canonicalCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  categoryLabel: string;
  physicalForm: PhysicalForm;
  totalMassPct: number;
  normalizedIngredients: CanonicalIngredientInput[];
  isBalanced: boolean;
  deviation: number;
  formulaFingerprint: string;

  // 2. Identity Resolution
  resolvedIngredients: any[];
  unknownParameters: string[];
  assumptions: string[];

  // 3. Neutralization (StoichiometricNeutralizationEngine)
  neutralizationState: any;
  pHIntermediate: number | null; // intermediate stoichiometric pH
  neutralizationStatus: SemanticStatus;

  // 4. pH Equilibrium (PHEngineV2)
  finalEquilibriumPH: number | null;
  phConverged: boolean;
  phBufferCapacity: number | null;
  phIonicStrength: number | null;
  phWarnings: string[];
  phDetails: any;
  slurryBasis?: string;
  phStatus: SemanticStatus;

  // 5. Active Matter (ActiveMatterEngine)
  activeMatterReport: any;
  totalSurfactantActivePct: number;
  totalActiveMatterPct: number;
  rawSurfactantsTotal: number;
  anionicPct: number;
  nonionicPct: number;
  amphotericPct: number;
  cationicPct: number;
  activeMatterStatus: SemanticStatus;
  activeMatterVerified?: boolean;

  // 6. HLB (HLBEngine)
  hlbResult: any;
  hlbValue: number | null;
  hlbStatus: SemanticStatus;

  // 7. Water & Chelation (chelatorEngine)
  chelationResult: any;
  hardnessResult: any;
  rawCapacity: number; // raw chelation binding capacity
  protectionAssessment: string; // chelation protection assessment
  chelationStatus: SemanticStatus;

  // 8. Compatibility (compatibilityEngine)
  compatibilityResult: any;
  compatibilityScore: number;
  compatible: boolean;
  compatibilityStatus: SemanticStatus;

  // 9. Viscosity (viscosityEngine)
  viscosityResult: any;
  predictedViscosityCp: number;
  viscosityStatus: SemanticStatus;

  // 10. Density (densityEngine)
  densityResult: any;
  densityGPerCm3: number;
  specificGravity: number;
  densityStatus: SemanticStatus;

  // 11. NVR (liquidNvrEngine)
  nvrResult: any;
  nvrPercentage: number;
  nvrStatus: SemanticStatus;

  // 12. Powder Engine (powderEngine)
  powderReport: any;
  powderStatus: SemanticStatus;

  // 13. Cleaning & Performance (cleaningPerformanceEngine)
  cleaningResult: any;
  cpi: number | null;
  adjustedEffectiveCleaningInput: number | null; // active matter adjusted for chelation protection
  cleaningStatus: SemanticStatus;

  // 14. Stability Screening
  stabilityResult: any;
  stabilityStatus: SemanticStatus;

  // 15. Costing (costingEngine)
  costResult: any;
  costStatus: SemanticStatus;

  // 16. Regulatory (regulatoryEngine)
  regulatoryResult: any;
  regulatoryStatus: SemanticStatus;

  // 17. Manufacturing (processModelingEngine)
  manufacturingResult: any;
  manufacturingStatus: SemanticStatus;

  // 18. Lab Evidence (labEvidenceEngine)
  labEvidenceResult: any;
  labEvidenceStatus: SemanticStatus;

  // 19. Specification (specificationEngine)
  specificationResult: any;
  specificationStatus: SemanticStatus;

  // 20. Quality Gate (scientificQualityGateEngine)
  qualityGateResult: any;
  qualityGateStatus: SemanticStatus;

  // 21. AI Grade (gradeEngine)
  aiGradeResult: any;
  gradeStatus: SemanticStatus;

  // 22. Expert Reasoning (expertReasoningEngine)
  expertReport: any;

  // 23. Climate Engine (climateEngine)
  climateResult: any;

  // 24. Substitution (substitutionEngine)
  substitutionResult: any;

  // Lab Health & diagnostics
  labHealthResult: any;
  warnings: any[];
  errors: any[];
  blockingIssues: any[];
  stageDiagnostics: any[];
}

// =============================================================================
// 2. DAG NODE DEFINITIONS & STATUS ENUM
// =============================================================================

export type NodeStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'NOT_APPLICABLE';

export type EngineDisposition =
  | 'DAG_NODE'
  | 'DAG_SUPPORT_NODE'
  | 'CONDITIONAL_NODE'
  | 'POST_PROCESSING_NODE'
  | 'EVIDENCE_NODE'
  | 'CROSS_CUTTING_SERVICE'
  | 'UI/RECOMMENDATION SERVICE';

export interface DAGNodeTrace {
  nodeId: string;
  engineName: string;
  disposition: EngineDisposition;
  dependencies: string[];
  status: NodeStatus;
  startTime: number | null;
  endTime: number | null;
  durationMs: number;
  skippedReason?: string;
  blockedReason?: string;
  error?: string;
  inputHash?: string;
  outputSummary?: string;
}

// =============================================================================
// 3. SCIENTIFIC EXECUTION DAG CLASS
// =============================================================================

export class ScientificExecutionDAG {
  private nodes: Map<string, {
    nodeId: string;
    engineName: string;
    disposition: EngineDisposition;
    dependencies: string[];
    execute: (state: ScientificExecutionState) => void;
  }> = new Map();

  constructor() {
    this.registerNodes();
  }

  /**
   * Registers all 24 Engines with their correct physical & chemical dependencies
   */
  private registerNodes() {
    // Node 1: NORMALIZATION
    this.nodes.set('NORMALIZATION', {
      nodeId: 'NORMALIZATION',
      engineName: 'pHEngineAdapter',
      disposition: 'DAG_SUPPORT_NODE',
      dependencies: [],
      execute: (state) => {
        const rawIngs = Array.isArray(state.rawInput.ingredients) ? state.rawInput.ingredients : [];
        let totalPct = 0;
        state.normalizedIngredients = rawIngs.map((ing, idx) => {
          const name = (ing?.name || '').trim();
          const rawPctValue = ing.percentage ?? (ing as any).percent ?? (ing as any).percentageInFormula;
          const pct = rawPctValue === undefined || rawPctValue === null || (typeof rawPctValue === 'string' && rawPctValue.trim() === '')
            ? Number.NaN
            : Number(rawPctValue);
          const validPercentage = Number.isFinite(pct) && pct >= 0 && pct <= 100;
          if (!validPercentage) {
            state.blockingIssues.push({
              code: 'ERR_INVALID_INGREDIENT_PERCENTAGE',
              severity: 'FATAL',
              category: 'VALIDITY',
              message: `Ingredient ${name || idx + 1} has a missing, non-finite, negative, or above-100% percentage.`
            });
          } else {
            totalPct += pct;
          }
          const rawKg = validPercentage && Number.isFinite(state.batchSizeKg)
            ? (pct / 100) * state.batchSizeKg
            : Number.NaN;
          const rawPrice = ing.costPerKg ?? (ing as any).rawMaterialCostPerKg ?? (ing as any).cost;
          const normalizedPrice = rawPrice === undefined || rawPrice === null || rawPrice === ''
            ? null
            : (Number.isFinite(Number(rawPrice)) && Number(rawPrice) >= 0 ? Number(rawPrice) : null);
          return {
            ...ing,
            ingredientId: ing.ingredientId || ing.id || `ing-${idx}`,
            id: ing.ingredientId || ing.id || `ing-${idx}`,
            name,
            percentage: validPercentage ? Number(pct.toFixed(4)) : Number.NaN,
            rawKg: Number.isFinite(rawKg) ? Number(rawKg.toFixed(4)) : Number.NaN,
            costPerKg: normalizedPrice as any
          };
        });

        state.totalMassPct = totalPct;
        state.isBalanced = Math.abs(totalPct - 100.0) < 0.05;
        state.deviation = Number.isFinite(totalPct) ? Number((totalPct - 100.0).toFixed(4)) : Number.NaN;
        state.formulaFingerprint = computeFormulaFingerprint(
          'FORMULA',
          state.formulaVersion,
          state.normalizedIngredients as any,
          state.canonicalCategory
        );
      }
    });

    // Node 2: IDENTITY_RESOLUTION
    this.nodes.set('IDENTITY_RESOLUTION', {
      nodeId: 'IDENTITY_RESOLUTION',
      engineName: 'ActiveMatterEngine', // Shares core lookup functionality
      disposition: 'DAG_SUPPORT_NODE',
      dependencies: ['NORMALIZATION'],
      execute: (state) => {
        state.resolvedIngredients = state.normalizedIngredients.map((ing) => {
          const cleanName = ing.name.toLowerCase();
          const matchedUniv = UNIVERSAL_INGREDIENTS.find(
            u => (ing.canonicalIngredientId && u.id === ing.canonicalIngredientId) ||
                 u.name.toLowerCase() === cleanName ||
                 u.id.toLowerCase() === cleanName ||
                 (u.inciName && u.inciName.toLowerCase() === cleanName) ||
                 ((cleanName === 'sodium bicarbonate' || cleanName === 'baking soda') && u.id === 'sodium-bicarbonate') ||
                 (cleanName.includes('water') && (u.id === 'dm-water' || u.name.toLowerCase().includes('demineralized water')))
          );

          const intel = getIngredientIntelligence(ing.name) || (matchedUniv ? getIngredientIntelligence(matchedUniv.id || matchedUniv.name) : undefined);
          // Do not copy an ingredient-library estimate into an explicit user assay field.
          // ActiveMatterEngine resolves canonical defaults separately and preserves their provenance.
          const activePct = ing.activeMatterPct ?? ing.activePercent;
          const unresolvedProperties = (matchedUniv as any)?.unknownProperties ?? [];
          if (!matchedUniv && !state.unknownParameters.includes(`${ing.name}:identity`)) {
            state.unknownParameters.push(`${ing.name}:identity`);
          }
          for (const property of unresolvedProperties) {
            const key = `${ing.name}:${property}`;
            if (!state.unknownParameters.includes(key)) state.unknownParameters.push(key);
          }
          const isUnknown = ing.isUnknown ?? (!matchedUniv || unresolvedProperties.length > 0);

          const hlb = ing.hlb ?? ing.hlbValue ?? matchedUniv?.hlb;
          const density = ing.density ?? (matchedUniv as any)?.density ?? (intel as any)?.densityGPerMl ?? (intel as any)?.density;

          return {
            ...ing,
            commercialGradeId: ing.commercialGradeId || matchedUniv?.id,
            activeMatterPct: activePct,
            role: ing.role || matchedUniv?.category || matchedUniv?.function || 'Component',
            category: ing.category || matchedUniv?.category,
            function: ing.function || matchedUniv?.function,
            casNumber: ing.casNumber || matchedUniv?.casNumber,
            inciName: ing.inciName || matchedUniv?.inciName,
            hlbValue: hlb,
            hlb,
            density,
            isUnknown
          };
        });
      }
    });

    // Node 3: CATEGORY_ROUTING
    this.nodes.set('CATEGORY_ROUTING', {
      nodeId: 'CATEGORY_ROUTING',
      engineName: 'pHEngineAdapter',
      disposition: 'DAG_SUPPORT_NODE',
      dependencies: ['IDENTITY_RESOLUTION'],
      execute: (state) => {
        const rawCategoryInput = state.rawInput.productCategory ?? 'UNKNOWN_PRODUCT_CATEGORY';
        state.canonicalCategory = normalizeProductCategory(rawCategoryInput);
        const categoryDef = getProductCategory(state.canonicalCategory);
        state.categoryLabel = categoryDef ? categoryDef.label : 'Unknown Category';
        state.physicalForm = categoryDef ? categoryDef.physicalForm : 'UNKNOWN';
      }
    });

    // Node 4: NEUTRALIZATION (StoichiometricNeutralizationEngine)
    this.nodes.set('NEUTRALIZATION', {
      nodeId: 'NEUTRALIZATION',
      engineName: 'StoichiometricNeutralizationEngine',
      disposition: 'DAG_NODE',
      dependencies: ['CATEGORY_ROUTING'],
      execute: (state) => {
        const primaryNeutralizationResult = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization(
          state.resolvedIngredients,
          state.batchSizeKg
        );
        state.neutralizationState = primaryNeutralizationResult.value;

        // Extract intermediate neutralization status and intermediate pH state
        if (primaryNeutralizationResult.value.status === 'FULLY_NEUTRALIZED') {
          state.pHIntermediate = 7.0;
          state.neutralizationStatus = 'VALID';
        } else if (primaryNeutralizationResult.value.status === 'ACID_EXCESS' || primaryNeutralizationResult.value.status === 'UNDER_NEUTRALIZED') {
          state.pHIntermediate = 3.0; // acidic intermediate
          state.neutralizationStatus = 'VALID';
        } else if (primaryNeutralizationResult.value.status === 'BASE_EXCESS') {
          state.pHIntermediate = 11.0; // basic intermediate
          state.neutralizationStatus = 'VALID';
        } else if (primaryNeutralizationResult.value.status === 'INSUFFICIENT_DATA') {
          state.pHIntermediate = null;
          state.neutralizationStatus = 'INSUFFICIENT_DATA';
        } else {
          state.pHIntermediate = null;
          state.neutralizationStatus = 'SCREENING';
        }
      }
    });

    // Node 5: PH_EQUILIBRIUM (PHEngineV2)
    this.nodes.set('PH_EQUILIBRIUM', {
      nodeId: 'PH_EQUILIBRIUM',
      engineName: 'PHEngineV2',
      disposition: 'DAG_NODE',
      dependencies: ['NEUTRALIZATION'],
      execute: (state) => {
        const isPowder = state.physicalForm === 'POWDER';
        let computedPH: number | null = null;
        let phConverged = false;
        let phModelValidity: 'HIGH' | 'MODERATE' | 'LOW' | 'OUT_OF_RANGE' | 'UNKNOWN' = 'UNKNOWN';
        let phBufferCapacity: number | null = null;
        let phIonicStrength: number | null = null;
        let phWarnings: string[] = [];
        let phDetails: any = null;
        let slurryBasis: string | undefined = undefined;

        if (state.resolvedIngredients.length > 0 && state.batchSizeKg > 0) {
          try {
            const mappedPH = mapFormulationIngredientsToPHEngineInput(state.resolvedIngredients);
            
            // Pass the intermediate stoichiometric pH to PHEngineV2 as initialGuess (targetPH)
            const initialGuess = state.pHIntermediate;

            const advPH = calculatePHAdvanced(mappedPH, state.batchSizeKg, {
              productCategory: state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : undefined,
              targetPH: initialGuess
            });
            phModelValidity = advPH.modelValidity ?? 'UNKNOWN';
            const pHWithinModelDomain = phModelValidity !== 'OUT_OF_RANGE';
            computedPH = pHWithinModelDomain ? advPH.pH : null;
            phConverged = advPH.solverConverged && pHWithinModelDomain;
            phBufferCapacity = advPH.bufferCapacity;
            phIonicStrength = advPH.ionicStrength;
            phWarnings = advPH.warnings || [];
            phDetails = advPH.details;
            slurryBasis = advPH.details?.slurryBasisNotice || (isPowder ? '1.0% w/v Slurry Basis' : undefined);
          } catch (err: any) {
            phWarnings.push(`PHEngine exception: ${err?.message || 'Calculation error'}`);
          }
        }

        // A measurement is eligible only for the exact immutable formula identity and version.
        const hasExplicitFormulaIdentity = Boolean(
          state.rawInput.formulaId?.trim() &&
          state.rawInput.formulaVersion?.trim()
        );
        const measuredPHRecord = hasExplicitFormulaIdentity
          ? state.rawInput.labEvidence?.find(m =>
              m.formulaId === state.rawInput.formulaId &&
              m.formulaVersion === state.rawInput.formulaVersion &&
              (m.parameterKey === 'ph' || m.parameterKey === 'powderPH')
            )
          : undefined;
        const isPHMeasured = Boolean(
          measuredPHRecord &&
          Number.isFinite(measuredPHRecord.value) &&
          measuredPHRecord.value >= 0 &&
          measuredPHRecord.value <= 14
        );
        const finalPH = isPHMeasured ? Number(measuredPHRecord!.value) : computedPH;

        state.finalEquilibriumPH = finalPH;
        state.phConverged = phConverged;
        state.phBufferCapacity = phBufferCapacity;
        state.phIonicStrength = phIonicStrength;
        state.phWarnings = phWarnings;
        state.phDetails = phDetails;
        state.slurryBasis = slurryBasis;
        state.phStatus = (
          finalPH !== null &&
          Number.isFinite(finalPH) &&
          finalPH >= 0 &&
          finalPH <= 14 &&
          (phConverged || isPHMeasured) &&
          (isPHMeasured || phModelValidity !== 'OUT_OF_RANGE')
        ) ? (isPHMeasured ? 'VALID' : 'SCREENING') : 'INSUFFICIENT_DATA';
      }
    });

    // Node 6: ACTIVE_MATTER (ActiveMatterEngine)
    this.nodes.set('ACTIVE_MATTER', {
      nodeId: 'ACTIVE_MATTER',
      engineName: 'ActiveMatterEngine',
      disposition: 'DAG_NODE',
      dependencies: ['IDENTITY_RESOLUTION'],
      execute: (state) => {
        state.activeMatterReport = ActiveMatterEngine.calculateActiveMatterReport(state.resolvedIngredients, state.batchSizeKg);
        state.totalSurfactantActivePct = calculateActiveSurfactants(state.resolvedIngredients);
        const amResult = calculateActiveMatterResult(state.resolvedIngredients);
        state.totalActiveMatterPct = amResult.value === null ? Number.NaN : amResult.value;
        if (amResult.status !== 'VALID') {
          state.activeMatterStatus = 'INSUFFICIENT_DATA';
          state.activeMatterVerified = false;
        } else {
          state.activeMatterStatus = 'VALID';
          state.activeMatterVerified = amResult.verified;
        }
        state.rawSurfactantsTotal = calculateRawSurfactants(state.resolvedIngredients);

        let anionic = 0;
        let nonionic = 0;
        let amphoteric = 0;
        let cationic = 0;

        state.resolvedIngredients.forEach((ing) => {
          const name = ing.name.toLowerCase();
          const role = (ing.role || '').toLowerCase();
          
          const validation = validateActiveMatterInput(ing.activeMatterPct);
          const resolvedActive = validation.status === 'VALID' ? validation.value : getDefaultActiveMatter(ing);
          // Unknown assay is not zero. Keep the contribution out of the numeric
          // breakdown and preserve INSUFFICIENT_DATA from the authoritative report.
          if (typeof resolvedActive === 'number' && Number.isFinite(resolvedActive) && resolvedActive >= 0 && resolvedActive <= 100) {
            const activePct = ing.percentage * (resolvedActive / 100);

            if (role.includes('anionic') || name.includes('labsa') || name.includes('sles') || name.includes('sls') || name.includes('aos')) {
              anionic += activePct;
            } else if (role.includes('nonionic') || name.includes('ethoxylate') || name.includes('lae') || name.includes('apg') || name.includes('glucoside')) {
              nonionic += activePct;
            } else if (role.includes('amphoteric') || name.includes('betaine') || name.includes('capb') || name.includes('amine oxide')) {
              amphoteric += activePct;
            } else if (role.includes('cationic') || name.includes('quat') || name.includes('bkc') || name.includes('esterquat')) {
              cationic += activePct;
            }
          }
        });

        state.anionicPct = anionic;
        state.nonionicPct = nonionic;
        state.amphotericPct = amphoteric;
        state.cationicPct = cationic;
      }
    });

    // Node 7: HLB (HLBEngine)
    this.nodes.set('HLB', {
      nodeId: 'HLB',
      engineName: 'HLBEngine',
      disposition: 'DAG_NODE',
      dependencies: ['ACTIVE_MATTER'],
      execute: (state) => {
        state.hlbResult = HLBEngine.calculateBlendedHLB(state.resolvedIngredients);
        state.hlbValue = state.hlbResult.hasSurfactants ? state.hlbResult.blendedHLB : null;
        state.hlbStatus = state.hlbResult.hasSurfactants ? 'VALID' : 'NOT_APPLICABLE';
      }
    });

    // Node 8: WATER_CHELATION (chelatorEngine)
    this.nodes.set('WATER_CHELATION', {
      nodeId: 'WATER_CHELATION',
      engineName: 'chelatorEngine',
      disposition: 'DAG_NODE',
      dependencies: ['ACTIVE_MATTER', 'CATEGORY_ROUTING'],
      execute: (state) => {
        const hardnessPolicy = getProductHardnessPolicy(
          state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : undefined
        );
        const rawWashVolume = state.rawInput.machineProfile?.waterVolumeL ?? state.rawInput.waterVolumeL;
        const rawDose = state.rawInput.dose ?? state.rawInput.washDoseGrams;
        const washVolumeL = rawWashVolume === undefined || rawWashVolume === null
          ? hardnessPolicy.defaultWashVolumeL
          : Number(rawWashVolume);
        const washDoseGrams = rawDose === undefined || rawDose === null
          ? hardnessPolicy.defaultDoseGrams
          : Number(rawDose);

        if (rawWashVolume === undefined || rawWashVolume === null) {
          state.assumptions.push('Wash volume uses the product hardness policy default; replace with the actual wash volume for a production decision.');
        }
        if (rawDose === undefined || rawDose === null) {
          state.assumptions.push('Wash dose uses the product hardness policy default; replace with the actual dose for a production decision.');
        }

        const effectiveWashVol = Number.isFinite(washVolumeL) && washVolumeL > 0 ? washVolumeL : (hardnessPolicy.defaultWashVolumeL || 10);
        const effectiveWashDose = Number.isFinite(washDoseGrams) && washDoseGrams > 0 ? washDoseGrams : (hardnessPolicy.defaultDoseGrams || 20);
        const effectiveBatchKg = Number.isFinite(state.batchSizeKg) && state.batchSizeKg > 0 ? state.batchSizeKg : 100;

        const hardnessRes = calculateWaterHardnessTolerance(
          state.resolvedIngredients,
          state.waterHardnessPpm,
          effectiveWashVol,
          effectiveWashDose,
          effectiveBatchKg,
          state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : undefined
        );

        state.hardnessResult = hardnessRes;
        const rawCapacity = (hardnessRes as any).bindingCapacityCaCO3GPer100g ?? (hardnessRes as any).totalSequestrationMg;
        state.rawCapacity = typeof rawCapacity === 'number' && Number.isFinite(rawCapacity) ? rawCapacity : Number.NaN;
        state.protectionAssessment = hardnessRes.status === 'PASS'
          ? 'SCREENING_PASS'
          : hardnessRes.status === 'NOT_APPLICABLE'
            ? 'NOT_APPLICABLE'
            : ((hardnessRes.totalSequestrationMg || 0) > 0 ? 'SCREENING_PASS' : 'INSUFFICIENT');

        let chelatorActivePct = 0;
        let hasUnknownChelatorActiveMatter = false;
        const chelatorNames: string[] = [];

        state.resolvedIngredients.forEach((ing) => {
          const name = String(ing.name || '').toLowerCase();
          const role = String(ing.role || '').toLowerCase();
          if (!(role.includes('chelator') || role.includes('builder') || name.includes('citrate') || name.includes('edta') || name.includes('glda') || name.includes('stpp') || name.includes('phosphonate') || name.includes('mgda') || name.includes('phosphate') || name.includes('zeolite'))) return;

          chelatorNames.push(ing.name);
          const activeRaw = ing.activeMatterPct ?? getDefaultActiveMatter(ing);
          if (typeof activeRaw !== 'number' || !Number.isFinite(activeRaw) || activeRaw < 0 || activeRaw > 100) {
            hasUnknownChelatorActiveMatter = true;
            return;
          }
          const pct = Number(ing.percentage);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
            hasUnknownChelatorActiveMatter = true;
            return;
          }
          chelatorActivePct += pct * (activeRaw / 100);
        });

        state.chelationResult = {
          isSufficient: hardnessRes.status === 'PASS' ? true : (hardnessRes.status === 'NOT_APPLICABLE' ? null : ((hardnessRes.totalSequestrationMg || 0) > 0 ? true : false)),
          status: hardnessRes.status === 'PASS' ? 'SCREENING' : hardnessRes.status,
          chelatorActivePct: hasUnknownChelatorActiveMatter ? null : Number(chelatorActivePct.toFixed(2)),
          chelatorActiveMatterVerified: !hasUnknownChelatorActiveMatter,
          chelatorNames: Array.from(new Set(chelatorNames)),
          bindingCapacityCaCO3GPer100g: Number.isFinite(state.rawCapacity) ? state.rawCapacity : null,
          hardnessProtectionRatio: Number.isFinite(hardnessRes.hardnessProtectionRatio) ? hardnessRes.hardnessProtectionRatio : null
        };

        if (hardnessRes.status === 'NOT_APPLICABLE') {
          state.chelationStatus = 'NOT_APPLICABLE';
        } else if (hardnessRes.status === 'PASS' || ((hardnessRes.totalSequestrationMg || 0) > 0)) {
          state.chelationStatus = 'SCREENING';
        } else if (hasUnknownChelatorActiveMatter) {
          state.chelationStatus = 'INSUFFICIENT_DATA';
        } else {
          state.chelationStatus = 'SCREENING';
        }
      }
    });

    // Node 9: COMPATIBILITY (compatibilityEngine)
    this.nodes.set('COMPATIBILITY', {
      nodeId: 'COMPATIBILITY',
      engineName: 'compatibilityEngine',
      disposition: 'DAG_NODE',
      dependencies: ['PH_EQUILIBRIUM', 'ACTIVE_MATTER'],
      execute: (state) => {
        const ph = (typeof state.finalEquilibriumPH === 'number' && Number.isFinite(state.finalEquilibriumPH) && state.finalEquilibriumPH >= 0 && state.finalEquilibriumPH <= 14)
          ? state.finalEquilibriumPH
          : ((typeof state.pHIntermediate === 'number' && Number.isFinite(state.pHIntermediate) && state.pHIntermediate >= 0 && state.pHIntermediate <= 14)
            ? state.pHIntermediate
            : undefined);
        const compRes = calculateFormulationCompatibility(state.resolvedIngredients, ph, state.canonicalCategory);
        state.compatibilityResult = compRes;
        state.compatibilityScore = Number.isFinite(compRes.compatibilityScore) ? compRes.compatibilityScore : Number.NaN;
        state.compatible = compRes.compatible === true;
        state.compatibilityStatus =
          compRes.compatibilityStatusSemantic === 'INCOMPATIBLE' ? 'BLOCKED' :
          compRes.compatibilityStatusSemantic === 'UNKNOWN' || compRes.compatibilityStatusSemantic === 'INSUFFICIENT_DATA'
            ? 'INSUFFICIENT_DATA'
            : 'SCREENING';
      }
    });

    // Node 10: VISCOSITY (viscosityEngine)
    this.nodes.set('VISCOSITY', {
      nodeId: 'VISCOSITY',
      engineName: 'viscosityEngine',
      disposition: 'DAG_NODE',
      dependencies: ['PH_EQUILIBRIUM', 'ACTIVE_MATTER', 'CATEGORY_ROUTING'],
      execute: (state) => {
        const isLiquid = state.physicalForm === 'LIQUID' || state.physicalForm === 'GEL' || state.physicalForm === 'EMULSION';
        if (!isLiquid) {
          state.predictedViscosityCp = Number.NaN;
          const isPowder = state.physicalForm === 'POWDER';
          state.viscosityResult = isPowder
            ? {
                predictedViscosityCp: null,
                rating: 'Not Applicable (Powder)',
                isFluid: false,
                flowMechanism: 'Not applicable',
                description: 'Powder viscosity is not evaluated by the liquid rheology engine.',
                status: 'NOT_APPLICABLE',
                reason: 'POWDER_PHYSICAL_FORM'
              }
            : {
                predictedViscosityCp: null,
                rating: 'Unknown physical form',
                isFluid: false,
                flowMechanism: 'Not evaluated',
                description: 'Physical form is unknown; liquid viscosity was not assumed.',
                status: 'INSUFFICIENT_DATA',
                reason: 'UNKNOWN_PHYSICAL_FORM'
              };
          state.viscosityStatus = isPowder ? 'NOT_APPLICABLE' : 'INSUFFICIENT_DATA';
          return;
        }

        const viscReport = ViscosityEngine.evaluateViscosity(state.resolvedIngredients, {
          productCategory: state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : undefined,
          targetPH: state.finalEquilibriumPH ?? null,
          temperatureC: state.rawInput.temperatureC ?? state.rawInput.temperature ?? 25,
          activeMatterReport: state.activeMatterReport // Consume authoritative active matter result
        });

        const detailedVisc = calculateDetailedViscosity(state.resolvedIngredients, { temperatureC: 25 });

        state.viscosityResult = {
          predictedViscosityCp: viscReport.viscosityCp,
          rating: viscReport.rating,
          isFluid: viscReport.isFluid,
          flowMechanism: detailedVisc.mechanism,
          description: viscReport.isFluid ? `${viscReport.viscosityCp} cPs (${viscReport.rating})` : 'N/A (Solid / Powder)',
          assumedShearRate: '~20 s^-1 (Standard Brookfield RVT @ 20 RPM)',
          temperatureC: state.rawInput.temperatureC ?? state.rawInput.temperature ?? 25,
          modelMaturity: 'EMPIRICAL_MODEL',
          viscosityReport: viscReport
        };
        state.predictedViscosityCp = Number.isFinite(viscReport.viscosityCp) ? viscReport.viscosityCp : Number.NaN;
        state.viscosityStatus = Number.isFinite(viscReport.viscosityCp) ? 'SCREENING' : 'INSUFFICIENT_DATA';
      }
    });

    // Node 11: DENSITY (densityEngine)
    this.nodes.set('DENSITY', {
      nodeId: 'DENSITY',
      engineName: 'densityEngine',
      disposition: 'DAG_NODE',
      dependencies: ['IDENTITY_RESOLUTION'],
      execute: (state) => {
        if (state.physicalForm === 'POWDER') {
          state.densityResult = {
            densityGPerCm3: null,
            specificGravity: null,
            densityStatus: 'NOT_APPLICABLE',
            provenance: 'NOT_APPLICABLE',
            notes: 'Liquid ideal-volume density model is not a powder bulk/tapped density method.'
          };
          state.densityGPerCm3 = Number.NaN;
          state.specificGravity = Number.NaN;
          state.densityStatus = 'NOT_APPLICABLE';
          return;
        }
        if (!['LIQUID', 'GEL', 'EMULSION'].includes(state.physicalForm)) {
          state.densityResult = { densityGPerCm3: null, densityStatus: 'INSUFFICIENT_DATA', provenance: 'INSUFFICIENT_DATA', notes: 'Unknown physical form; density calculation not evaluated.' };
          state.densityGPerCm3 = Number.NaN;
          state.specificGravity = Number.NaN;
          state.densityStatus = 'INSUFFICIENT_DATA';
          return;
        }
        const densityRes = calculateDensity(state.resolvedIngredients, state.batchSizeKg * 1000);
        state.densityResult = densityRes;
        state.densityGPerCm3 = Number.isFinite(densityRes.densityGPerCm3) ? densityRes.densityGPerCm3 : Number.NaN;
        state.specificGravity = Number.isFinite(densityRes.specificGravity) ? densityRes.specificGravity : Number.NaN;
        state.densityStatus = densityRes.densityStatus === 'SCREENING_ESTIMATE' ? 'SCREENING' : 'INSUFFICIENT_DATA';
      }
    });

    // Node 12: NVR (liquidNvrEngine)
    this.nodes.set('NVR', {
      nodeId: 'NVR',
      engineName: 'liquidNvrEngine',
      disposition: 'CONDITIONAL_NODE',
      dependencies: ['IDENTITY_RESOLUTION', 'CATEGORY_ROUTING'],
      execute: (state) => {
        const isLiquid = state.physicalForm === 'LIQUID' || state.physicalForm === 'GEL' || state.physicalForm === 'EMULSION';
        if (!isLiquid) {
          state.nvrResult = null;
          state.nvrPercentage = Number.NaN;
          state.nvrStatus = state.physicalForm === 'POWDER' ? 'NOT_APPLICABLE' : 'INSUFFICIENT_DATA';
          return;
        }

        const nvrRes = calculateLiquidNVR(state.resolvedIngredients, state.batchSizeKg);
        state.nvrResult = nvrRes;
        state.nvrPercentage = Number.isFinite(nvrRes.nvrPercentage) ? nvrRes.nvrPercentage : Number.NaN;
        state.nvrStatus = nvrRes.isComplete === true && Number.isFinite(nvrRes.nvrPercentage) ? 'SCREENING' : 'INSUFFICIENT_DATA';
      }
    });

    // Node 13: POWDER_ENGINE (powderEngine)
    this.nodes.set('POWDER_ENGINE', {
      nodeId: 'POWDER_ENGINE',
      engineName: 'powderEngine',
      disposition: 'CONDITIONAL_NODE',
      dependencies: ['CATEGORY_ROUTING', 'ACTIVE_MATTER', 'WATER_CHELATION'],
      execute: (state) => {
        const isPowder = state.physicalForm === 'POWDER';
        if (!isPowder) {
          state.powderReport = null;
          state.powderStatus = state.physicalForm === 'UNKNOWN' ? 'INSUFFICIENT_DATA' : 'NOT_APPLICABLE';
          return;
        }

        try {
          state.powderReport = evaluatePowderFormulation({
            ingredients: state.resolvedIngredients,
            productCategory: state.canonicalCategory,
            batchSizeKg: state.batchSizeKg,
            waterHardnessPpm: state.waterHardnessPpm ?? undefined
          });
          const powderStatus = state.powderReport?.verdict?.overallStatus;
          state.powderStatus = powderStatus === 'SCREENING_ONLY' ? 'SCREENING' :
            powderStatus === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' :
            powderStatus === 'BALANCED & COMPLIANT' ? 'SCREENING' : 'FAILED';
        } catch (err: any) {
          state.powderReport = null;
          state.powderStatus = 'FAILED';
        }
      }
    });

    // Node 14: CLEANING_CPI (cleaningPerformanceEngine)
    this.nodes.set('CLEANING_CPI', {
      nodeId: 'CLEANING_CPI',
      engineName: 'cleaningPerformanceEngine',
      disposition: 'DAG_NODE',
      dependencies: ['PH_EQUILIBRIUM', 'ACTIVE_MATTER', 'WATER_CHELATION', 'COMPATIBILITY'],
      execute: (state) => {
        // Enforce dependencies: chelation and compatibility must complete and pass down states
        const hardnessSufficient =
          state.chelationStatus === 'NOT_APPLICABLE' && state.waterHardnessPpm === 0
            ? true
            : state.chelationResult?.isSufficient === true;

        // If hard water load is severe and chelation is insufficient, active surfactants are penalized
        let effectiveSurfactantAdjustment = state.totalSurfactantActivePct;
        if (state.waterHardnessPpm !== null && state.waterHardnessPpm > 100 && !hardnessSufficient) {
          // Surfactant precipitates/degrades in hard water without chelation
          effectiveSurfactantAdjustment = Math.max(0, state.totalSurfactantActivePct * 0.7);
        }

        state.adjustedEffectiveCleaningInput = effectiveSurfactantAdjustment;

        const categoryPolicy = getProductHardnessPolicy(
          state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : undefined
        );
        const effectiveHardnessPpm = (typeof state.waterHardnessPpm === 'number' && Number.isFinite(state.waterHardnessPpm) && state.waterHardnessPpm >= 0)
          ? state.waterHardnessPpm
          : 150;
        const effectiveWashVol = (typeof state.hardnessResult?.washVolumeL === 'number' && Number.isFinite(state.hardnessResult.washVolumeL) && state.hardnessResult.washVolumeL > 0)
          ? state.hardnessResult.washVolumeL
          : (categoryPolicy.defaultWashVolumeL || 10);
        const effectiveWashDose = (typeof state.hardnessResult?.washDoseGrams === 'number' && Number.isFinite(state.hardnessResult.washDoseGrams) && state.hardnessResult.washDoseGrams > 0)
          ? state.hardnessResult.washDoseGrams
          : (categoryPolicy.defaultDoseGrams || 20);
        const effectiveBatchKg = (typeof state.batchSizeKg === 'number' && Number.isFinite(state.batchSizeKg) && state.batchSizeKg > 0)
          ? state.batchSizeKg
          : 100;
        const effectivePH = (typeof state.finalEquilibriumPH === 'number' && Number.isFinite(state.finalEquilibriumPH) && state.finalEquilibriumPH >= 0 && state.finalEquilibriumPH <= 14)
          ? state.finalEquilibriumPH
          : (typeof state.pHIntermediate === 'number' && Number.isFinite(state.pHIntermediate) && state.pHIntermediate >= 0 && state.pHIntermediate <= 14
            ? state.pHIntermediate
            : 8.0);

        let evalIngs = state.resolvedIngredients;
        const totalPct = evalIngs.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
        if (evalIngs.length > 0 && Math.abs(totalPct - 100) > 0.05) {
          const waterIdx = evalIngs.findIndex(i => (i.name || '').toLowerCase().includes('water') || (i.name || '').toLowerCase().includes('aqua'));
          if (waterIdx >= 0) {
            const nonWater = evalIngs.reduce((sum, ing, idx) => idx === waterIdx ? sum : sum + (Number(ing.percentage) || 0), 0);
            const balWater = Math.max(0, 100 - nonWater);
            evalIngs = evalIngs.map((ing, idx) => idx === waterIdx ? { ...ing, percentage: Number(balWater.toFixed(3)) } : ing);
          } else if (totalPct > 0) {
            evalIngs = evalIngs.map(ing => ({ ...ing, percentage: Number(((Number(ing.percentage) || 0) * (100 / totalPct)).toFixed(3)) }));
          }
        }

        const perfRes = calculateCleaningPerformance(
          evalIngs,
          effectivePH,
          state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : undefined,
          undefined,
          {
            waterHardnessPpm: effectiveHardnessPpm,
            washVolumeL: effectiveWashVol,
            washDoseGrams: effectiveWashDose,
            batchSizeKg: effectiveBatchKg,
            compatibilityStatus: state.compatibilityStatus,
            hasCriticalCompatibilityAlert: state.compatibilityStatus === 'BLOCKED' ||
              (state.compatibilityResult?.alerts || []).some((alert: any) => alert.severity === 'CRITICAL')
          }
        );

        state.cleaningResult = perfRes;
        state.cpi = perfRes.provenance === 'INSUFFICIENT_DATA' ? null : perfRes.cpi;
        state.cleaningStatus = perfRes.provenance === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' :
          perfRes.provenance === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'SCREENING';
      }
    });

    // Node 15: STABILITY_SCREENING
    this.nodes.set('STABILITY_SCREENING', {
      nodeId: 'STABILITY_SCREENING',
      engineName: 'compatibilityEngine', // shelf life / syneresis derived from compatibility
      disposition: 'DAG_NODE',
      dependencies: ['COMPATIBILITY', 'PH_EQUILIBRIUM'],
      execute: (state) => {
        const presWarningObj = getPreservativeWarning(state.resolvedIngredients, state.finalEquilibriumPH ?? null);
        const presWarningMsg = presWarningObj ? (typeof presWarningObj === 'string' ? presWarningObj : presWarningObj.message) : null;

        const presStatus: 'UNKNOWN' | 'WARNING' = presWarningMsg ? 'WARNING' : 'UNKNOWN';
        const compatibilityScore = state.compatibilityResult?.compatibilityScore;
        const syneresisRisk = Number.isFinite(compatibilityScore)
          ? (compatibilityScore < 70 ? 'HIGH' : 'LOW')
          : 'UNKNOWN';
        const isPowder = state.physicalForm === 'POWDER';

        state.stabilityResult = {
          shelfLifeMonths: null, // Physically unproven without empirical accelerated aging data
          shelfLifeStatus: 'UNKNOWN',
          preservativeStatus: presStatus,
          preservativeEfficacyStatus: 'NOT_TESTED',
          preservativeWarning: presWarningMsg,
          syneresisRisk,
          syneresisRiskProvenance: 'HEURISTIC_SCREENING',
          maturity: 'HEURISTIC_SCREENING',
          evidenceLevel: 'RULE_BASED',
          recommendedTests: state.physicalForm === 'UNKNOWN'
            ? []
            : (isPowder
              ? [
                  'Room temperature storage (25°C / 60% RH, 12 months)',
                  'Accelerated moisture caking test (40°C / 75% RH, 8 weeks)',
                  'Particle friability & flowability retention',
                  'Active oxygen / bleach retention (ISO 2271 / ASTM D2180)'
                ]
              : [
                  '25°C standard storage (ASTM D4333)',
                  '40°C / 75% RH accelerated aging (12 weeks)',
                  'Freeze-thaw stability (3 cycles, -5°C to 25°C)',
                  'Centrifuge phase separation test (3000 rpm, 30 min)',
                  'Active matter retention & microbial challenge testing (USP <51>)'
                ]),
          limitations: [
            'Shelf life duration cannot be scientifically predicted from ingredient lists alone without real-time or accelerated kinetic testing.',
            'Syneresis and preservative status are qualitative screening risks only.'
          ]
        };
        state.stabilityStatus = state.physicalForm === 'UNKNOWN' ? 'INSUFFICIENT_DATA' : 'SCREENING';
      }
    });

    // Node 16: COSTING (costingEngine)
    this.nodes.set('COSTING', {
      nodeId: 'COSTING',
      engineName: 'costingEngine',
      disposition: 'DAG_NODE',
      dependencies: ['IDENTITY_RESOLUTION'],
      execute: (state) => {
        const formulaCost = calculateFormulaCost(state.resolvedIngredients, state.batchSizeKg);
        const overheadPct = state.rawInput.costContext?.overheadPct ?? 12;
        const packagingCostPerUnit = state.rawInput.costContext?.packagingCostPerUnit ?? 15;
        if (state.rawInput.costContext?.overheadPct === undefined) {
          state.assumptions.push('Commercial margin chain uses a 12% manufacturing-overhead scenario because no overhead percentage was supplied.');
        }
        if (state.rawInput.costContext?.packagingCostPerUnit === undefined) {
          state.assumptions.push('Commercial margin chain uses a packaging-cost scenario of 15 currency units per sale unit because no packaging cost was supplied.');
        }
        const marginChain = calculateCommercialMarginChain(
          state.resolvedIngredients,
          state.batchSizeKg,
          overheadPct,
          packagingCostPerUnit
        );

        state.costResult = {
          ...formulaCost,
          marginChain
        };
        state.costStatus = formulaCost.isComplete ? 'VALID' : 'INSUFFICIENT_DATA';
      }
    });

    // Node 17: REGULATORY (regulatoryEngine)
    this.nodes.set('REGULATORY', {
      nodeId: 'REGULATORY',
      engineName: 'regulatoryEngine',
      disposition: 'DAG_NODE',
      dependencies: ['IDENTITY_RESOLUTION', 'PH_EQUILIBRIUM'],
      execute: (state) => {
        state.regulatoryResult = evaluateRegulatoryCompliance(
          state.resolvedIngredients,
          state.canonicalCategory,
          state.rawInput.regulatoryContext,
          state.finalEquilibriumPH ?? null
        );
        state.regulatoryStatus = state.regulatoryResult.status === 'COMPLIANT'
          ? 'VALID'
          : (state.regulatoryResult.status === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'INVALID');
      }
    });

    // Node 18: MANUFACTURING (processModelingEngine)
    this.nodes.set('MANUFACTURING', {
      nodeId: 'MANUFACTURING',
      engineName: 'processModelingEngine',
      disposition: 'CONDITIONAL_NODE',
      dependencies: ['IDENTITY_RESOLUTION', 'CATEGORY_ROUTING', 'DENSITY'],
      execute: (state) => {
        const isPowder = state.physicalForm === 'POWDER';
        const mScaleFactor = state.batchSizeKg / 10.0;
        const defaultLiquidSteps = [
          { stepNumber: 1, stepName: 'Water Charging', instruction: 'Charge calculated deionized water into main mixing vessel.', plannedTempC: 25, plannedDurationMin: 15, plannedMixRpm: 100, provenance: 'ENGINEERING_DEFAULT', completed: false },
          { stepNumber: 2, stepName: 'Surfactant Addition', instruction: 'Slowly add surfactant raw materials under moderate agitation.', plannedTempC: 25, plannedDurationMin: 30, plannedMixRpm: 250, provenance: 'ENGINEERING_DEFAULT', completed: false },
          { stepNumber: 3, stepName: 'Builder & Additives', instruction: 'Incorporate builders, chelators, and functional additives.', plannedTempC: 30, plannedDurationMin: 20, plannedMixRpm: 250, provenance: 'ENGINEERING_DEFAULT', completed: false },
          { stepNumber: 4, stepName: 'Final Adjustment & QC', instruction: 'Adjust pH, viscosity, and fragrance. Sample for in-process QC.', plannedTempC: 25, plannedDurationMin: 15, plannedMixRpm: 150, provenance: 'ENGINEERING_DEFAULT', completed: false }
        ];
        const defaultPowderSteps = [
          { stepNumber: 1, stepName: 'Solid Carrier Charging', instruction: 'Charge sodium sulfate or carbonate carrier into dry ribbon blender.', plannedTempC: 25, plannedDurationMin: 10, plannedMixRpm: 40, provenance: 'ENGINEERING_DEFAULT', completed: false },
          { stepNumber: 2, stepName: 'Active Surfactant Spraying', instruction: 'Spray liquid active matter (e.g. LABSA, Nonionics) onto solid bed with high-shear chopper active.', plannedTempC: 35, plannedDurationMin: 20, plannedMixRpm: 60, provenance: 'ENGINEERING_DEFAULT', completed: false },
          { stepNumber: 3, stepName: 'Post-Addition & Bleaching', instruction: 'Incorporate post-additives (enzymes, bleach activators, perfume granules) under low shear.', plannedTempC: 25, plannedDurationMin: 10, plannedMixRpm: 30, provenance: 'ENGINEERING_DEFAULT', completed: false },
          { stepNumber: 4, stepName: 'Discharge & Packing', instruction: 'Discharge uniform dry powder for packing. Test moisture and bulk density.', plannedTempC: 25, plannedDurationMin: 10, plannedMixRpm: 20, provenance: 'ENGINEERING_DEFAULT', completed: false }
        ];

        state.manufacturingResult = {
          referenceBatchSizeKg: 10.0,
          plannedBatchSizeKg: state.batchSizeKg,
          scaleFactor: mScaleFactor,
          plannedVolumeLiters: state.densityGPerCm3 > 0 ? Number((state.batchSizeKg / state.densityGPerCm3).toFixed(3)) : undefined,
          processLossKg: Number((state.batchSizeKg * 0.01).toFixed(3)),
          processLossPercent: 1.0,
          processSteps: state.physicalForm === 'UNKNOWN' ? [] : (isPowder ? defaultPowderSteps : defaultLiquidSteps)
        };
        state.manufacturingStatus = state.physicalForm === 'UNKNOWN' ? 'INSUFFICIENT_DATA' : 'ESTIMATED';
      }
    });

    // Node 19: SPECIFICATION (specificationEngine)
    this.nodes.set('SPECIFICATION', {
      nodeId: 'SPECIFICATION',
      engineName: 'specificationEngine',
      disposition: 'DAG_NODE',
      dependencies: ['PH_EQUILIBRIUM', 'VISCOSITY', 'DENSITY', 'NVR', 'POWDER_ENGINE'],
      execute: (state) => {
        const specTemplate = getSpecificationTemplateForCategory(state.canonicalCategory, state.formulaName);
        const specReport = evaluateSpecifications({
          formulaId: state.formulaId,
          formulaName: state.formulaName,
          formulaVersion: state.formulaVersion,
          productCategory: state.canonicalCategory,
          parameters: specTemplate?.parameters || [],
          labMeasurements: state.rawInput.labEvidence || [],
          powderReport: state.powderReport,
          costReport: state.costResult ? state.costResult as any : null,
          liquidResults: {
            pH: state.finalEquilibriumPH ?? undefined,
            activeSurfactants: state.totalSurfactantActivePct,
            totalPercentage: state.totalMassPct,
            viscosity: state.viscosityResult?.description,
            viscosityCp: state.viscosityResult?.predictedViscosityCp ?? undefined,
            density: state.densityGPerCm3,
            liquidNVR: state.nvrPercentage,
            liquidNVRComplete: state.nvrResult?.isNvrComplete,
            nvrCoveragePct: state.nvrResult?.dataCompleteness,
            costPerKg: state.costResult?.costPerKg
          }
        });

        state.specificationResult = specReport;
        state.specificationStatus = specReport.verdict.status === 'PASS' 
          ? 'VALID' 
          : (specReport.verdict.status === 'FAIL' ? 'FAILED' : 'INSUFFICIENT_DATA');
      }
    });

    // Node 20: LAB_EVIDENCE (labEvidenceEngine)
    this.nodes.set('LAB_EVIDENCE', {
      nodeId: 'LAB_EVIDENCE',
      engineName: 'labEvidenceEngine',
      disposition: 'EVIDENCE_NODE',
      dependencies: ['SPECIFICATION'],
      execute: (state) => {
        const labEvidence = state.rawInput.labEvidence || [];
        const labValidationReport = evaluateFormulaScientificValidation({
          formulaId: state.rawInput.formulaId,
          // Evidence matching must use the caller's explicit version, not the display sentinel.
          formulaVersion: state.rawInput.formulaVersion,
          productCategory: state.canonicalCategory,
          isComputationallyValid: state.errors.length === 0 && state.blockingIssues.length === 0,
          predictedMetrics: {
            pH: state.finalEquilibriumPH ?? null,
            activeSurfactantsPct: state.totalSurfactantActivePct,
            activeMatterPct: Number.isFinite(state.totalActiveMatterPct) ? state.totalActiveMatterPct : null,
            viscosityCps: state.viscosityResult?.predictedViscosityCp ?? null,
            cpi: state.cpi,
            densityGCm3: state.densityGPerCm3,
            waterHardnessTolerancePpm: Number.isFinite(state.hardnessResult?.maxSupportedPpm) ? state.hardnessResult.maxSupportedPpm : null
          },
          labEvidenceRecords: labEvidence as any
        });

        const isLabValidated = labValidationReport.isLabValidated;
        const verifiedCount = (labValidationReport.completedTests || []).length;
        const missingTests = labValidationReport.missingTests || [];

        const labEvidenceVerdict = isLabValidated
          ? 'FULLY LAB VALIDATED — Bench measurements certified'
          : (verifiedCount > 0
            ? `PARTIALLY LAB TESTED — ${missingTests.length} tests pending (${missingTests.join(', ')})`
            : 'PREDICTED ONLY — Bench laboratory validation required prior to production release');

        state.labEvidenceResult = {
          evidenceLevel: isLabValidated ? 'FULLY_LAB_VALIDATED' : (verifiedCount > 0 ? 'PARTIALLY_MEASURED' : 'PREDICTED_ONLY'),
          validationState: labValidationReport.validationState,
          readinessLevel: labValidationReport.readinessLevel,
          verifiedMeasurementsCount: verifiedCount,
          missingMeasurements: missingTests,
          isLabValidated,
          validationReport: labValidationReport,
          verdict: labEvidenceVerdict
        };
        state.labEvidenceStatus = isLabValidated ? 'VALID' : 'SCREENING';
      }
    });

    // Node 21: QUALITY_GATE (scientificQualityGateEngine)
    this.nodes.set('QUALITY_GATE', {
      nodeId: 'QUALITY_GATE',
      engineName: 'scientificQualityGateEngine',
      disposition: 'POST_PROCESSING_NODE',
      dependencies: ['CLEANING_CPI', 'REGULATORY', 'LAB_EVIDENCE', 'STABILITY_SCREENING', 'COSTING'],
      execute: (state) => {
        // QualityGateEngine consumes all upstream branches
        state.qualityGateResult = evaluateScientificQualityGate({
          formulaId: state.rawInput.formulaId,
          formulaName: state.formulaName,
          // Do not turn the internal unknown-version sentinel into an evidence target.
          formulaVersion: state.rawInput.formulaVersion,
          productCategory: state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? state.canonicalCategory : (state.rawInput.productCategory || 'UNKNOWN_PRODUCT_CATEGORY'),
          ingredients: state.resolvedIngredients,
          labMeasurements: state.rawInput.labEvidence || [],
          waterHardnessPpm: state.waterHardnessPpm ?? undefined,
          batchSizeKg: state.batchSizeKg,
          targetCostPerKg: state.rawInput.costContext?.targetCostPerKg
        });

        const finalGateStatus = state.qualityGateResult?.finalFormulaStatus;
        state.qualityGateStatus =
          finalGateStatus === 'OUT_OF_SPEC' || finalGateStatus === 'SCIENTIFICALLY_INVALID' || finalGateStatus === 'INCOMPATIBLE'
            ? 'FAILED'
            : finalGateStatus === 'INSUFFICIENT_DATA'
              ? 'INSUFFICIENT_DATA'
              : finalGateStatus === 'LAB_VALIDATION_REQUIRED'
                ? 'SCREENING'
                : (state.qualityGateResult?.scientificValidity === 'VALID' && state.labEvidenceResult?.isLabValidated === true
                  ? 'VALID'
                  : 'SCREENING');
      }
    });

    // Node 22: GRADE (gradeEngine)
    this.nodes.set('GRADE', {
      nodeId: 'GRADE',
      engineName: 'gradeEngine',
      disposition: 'POST_PROCESSING_NODE',
      dependencies: ['QUALITY_GATE'],
      execute: (state) => {
        // Execute grading strictly from the authoritative completed nodes
        // Missing target cost is an unknown commercial input, not an implicit pass.
        if (state.rawInput.costContext?.targetCostPerKg === undefined ||
            state.rawInput.costContext?.targetCostPerKg === null) {
          if (!state.unknownParameters.includes('targetCost')) {
            state.unknownParameters.push('targetCost');
          }
        }

        const activeMatterOut = {
          totalSurfactantActivePct: state.totalSurfactantActivePct,
          totalActiveMatterPct: state.totalActiveMatterPct,
          meetsCategoryMin: Number.isFinite(state.totalSurfactantActivePct)
            ? state.totalSurfactantActivePct >= (getProductCategory(state.canonicalCategory)?.activeMatterMinPct ?? Number.NaN)
            : null,
          categoryMinPct: getProductCategory(state.canonicalCategory)?.activeMatterMinPct ?? null,
          verified: state.activeMatterVerified === true,
          status: state.activeMatterStatus,
          surfactantBreakdown: {
            anionic: state.anionicPct,
            nonionic: state.nonionicPct,
            amphoteric: state.amphotericPct,
            cationic: state.cationicPct,
            total: [state.anionicPct, state.nonionicPct, state.amphotericPct, state.cationicPct].every(Number.isFinite)
              ? state.anionicPct + state.nonionicPct + state.amphotericPct + state.cationicPct
              : null
          }
        };

        const phOut = {
          ph: state.finalEquilibriumPH,
          isMeasured: state.phStatus === 'VALID',
          provenance: state.phStatus === 'VALID' ? 'MEASURED' : (state.phStatus === 'SCREENING' ? 'PREDICTED' : 'INSUFFICIENT_DATA'),
          bufferCapacity: state.phBufferCapacity,
          ionicStrength: state.phIonicStrength,
          confidence: state.phStatus,
          warnings: state.phWarnings
        };

        const compOut = {
          compatible: state.compatible,
          compatibilityScore: state.compatibilityScore,
          alerts: state.compatibilityResult?.alerts || [],
          warnings: state.compatibilityResult?.warnings || [],
          stabilityStatus: Number.isFinite(state.compatibilityScore)
            ? (state.compatibilityScore >= 80 ? 'SCREENING_HIGH_COMPATIBILITY' : 'SCREENING_LOW_COMPATIBILITY')
            : 'UNKNOWN'
        };

        const cleaningOut = {
          cpi: Number.isFinite(state.cpi) ? state.cpi : null,
          overallScore: Number.isFinite(state.cleaningResult?.overallScore) ? state.cleaningResult.overallScore : null,
          cleaningScore: Number.isFinite(state.cleaningResult?.cleaningScore) ? state.cleaningResult.cleaningScore : null,
          provenance: state.cleaningResult?.provenance ?? 'INSUFFICIENT_DATA',
          isCleaningApplicable: state.cleaningResult?.isCleaningApplicable ?? false,
          limitingFactors: state.cleaningResult?.keyNegativeFactors || []
        };

        const costOut = {
          costPerKg: Number.isFinite(state.costResult?.costPerKg) ? state.costResult.costPerKg : null,
          totalBatchCost: Number.isFinite(state.costResult?.totalBatchCost) ? state.costResult.totalBatchCost : null,
          isComplete: state.costResult?.isComplete === true,
          pricingStatus: state.costResult?.pricingStatus ?? 'UNKNOWN',
          isWithinTarget: Number.isFinite(state.costResult?.costPerKg) &&
            typeof state.rawInput.costContext?.targetCostPerKg === 'number' &&
            Number.isFinite(state.rawInput.costContext.targetCostPerKg)
              ? state.costResult.costPerKg <= state.rawInput.costContext.targetCostPerKg
              : null
        };

        state.aiGradeResult = evaluateAIGrade({
          formulaIdentity: {
            canonicalCategory: state.canonicalCategory
          },
          scientificValidity: state.qualityGateResult?.scientificValidity ?? 'INSUFFICIENT_DATA',
          activeMatterResult: activeMatterOut as any,
          pHResult: phOut as any,
          compatibilityResult: compOut as any,
          cleaningResult: cleaningOut as any,
          costResult: costOut as any,
          labEvidenceResult: state.labEvidenceResult as any,
          regulatoryResult: state.regulatoryResult as any,
          blockingIssues: [
            ...(state.canonicalCategory === 'UNKNOWN_PRODUCT_CATEGORY' ? ['CATEGORY_REQUIRED'] : []),
            ...state.blockingIssues.map((issue: any) => String(issue?.code || issue?.message || issue))
          ],
          warnings: state.warnings,
          unknownParameters: state.unknownParameters
        });

        state.gradeStatus = state.aiGradeResult?.isEvaluable === true ? 'SCREENING' : 'INSUFFICIENT_DATA';
      }
    });

    // Node 23: RECOMMENDATIONS (expertReasoningEngine, substitutionEngine, climateEngine)
    this.nodes.set('RECOMMENDATIONS', {
      nodeId: 'RECOMMENDATIONS',
      engineName: 'expertReasoningEngine',
      disposition: 'UI/RECOMMENDATION SERVICE',
      dependencies: ['GRADE'],
      execute: (state) => {
        state.expertReport = evaluateExpertReasoning({
          ingredients: state.resolvedIngredients,
          productCategory: state.canonicalCategory,
          waterHardnessPpm: state.waterHardnessPpm,
          batchSizeKg: state.batchSizeKg,
          calculatedPH: state.finalEquilibriumPH,
          totalActiveMatter: Number.isFinite(state.totalSurfactantActivePct) ? state.totalSurfactantActivePct : undefined,
          totalPercentage: Number.isFinite(state.totalMassPct) ? state.totalMassPct : undefined,
          costPerKg: Number.isFinite(state.costResult?.costPerKg) ? state.costResult.costPerKg : undefined,
          cleaningScore: state.cleaningResult?.cleaningScore ?? undefined,
          hardnessSufficiency: state.hardnessResult?.sufficiency,
          maxSupportedHardnessPpm: state.hardnessResult?.maxSupportedPpm,
          compatibilityScore: state.compatibilityScore,
          compatibilityAlerts: state.compatibilityResult?.alerts || [],
          viscosityEstimate: state.viscosityResult?.description ?? 'N/A'
        });

        const climatePreset = state.rawInput.climatePreset || 'Temperate';
        state.climateResult = state.waterHardnessPpm === null
          ? null
          : analyzeClimateAndHardWater(state.resolvedIngredients, climatePreset as any, state.waterHardnessPpm);
        state.substitutionResult = findSubstitutionsForFormula(state.resolvedIngredients, state.rawInput.regulatoryContext?.jurisdiction || 'Global', 'Cost Reduction');
        state.labHealthResult = calculateLabHealthScore(state.resolvedIngredients, state.finalEquilibriumPH, state.canonicalCategory);
      }
    });
  }

  /**
   * Sorts nodes topologically to detect cycles and validate dependencies
   */
  public sortNodes(): string[] {
    const visited: Set<string> = new Set();
    const temp: Set<string> = new Set();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error(`Cycle detected in Scientific Execution DAG at node: ${nodeId}`);
      }
      if (!visited.has(nodeId)) {
        temp.add(nodeId);
        const node = this.nodes.get(nodeId);
        if (node) {
          for (const dep of node.dependencies) {
            visit(dep);
          }
        }
        temp.delete(nodeId);
        visited.add(nodeId);
        order.push(nodeId);
      }
    };

    for (const nodeId of this.nodes.keys()) {
      visit(nodeId);
    }

    return order;
  }

  /**
   * Evaluates the complete DAG synchronously
   */
  public executeDAG(input: CanonicalFormulaInput): {
    state: ScientificExecutionState;
    trace: DAGNodeTrace[];
  } {
    const rawBatchSize = input.batchSizeKg ?? input.batchSize;
    const batchSizeDefaulted = rawBatchSize === undefined || rawBatchSize === null;
    const batchSizeKg = batchSizeDefaulted
      ? 100
      : (typeof rawBatchSize === 'number' && Number.isFinite(rawBatchSize) && rawBatchSize > 0 ? rawBatchSize : Number.NaN);

    const rawWaterHardness = input.waterHardnessPpm ?? input.hardness ?? input.waterProfile?.hardnessPpm;
    const waterHardnessPpm = typeof rawWaterHardness === 'number' && Number.isFinite(rawWaterHardness) && rawWaterHardness >= 0
      ? rawWaterHardness
      : null;

    // Initialize clean, empty intermediate state
    const state: ScientificExecutionState = {
      rawInput: input,
      formulaId: input.formulaId || 'UNKNOWN_FORMULA_ID',
      formulaName: input.formulaName || 'Unnamed Formula',
      formulaVersion: input.formulaVersion || 'UNKNOWN_VERSION',
      batchSizeKg,
      waterHardnessPpm,

      canonicalCategory: 'UNKNOWN_PRODUCT_CATEGORY',
      categoryLabel: 'Unknown Category',
      physicalForm: 'UNKNOWN',
      totalMassPct: 0,
      normalizedIngredients: [],
      isBalanced: false,
      deviation: 0,
      formulaFingerprint: '',

      resolvedIngredients: [],
      unknownParameters: [],
      assumptions: [],

      neutralizationState: null,
      pHIntermediate: null,
      neutralizationStatus: 'UNKNOWN',

      finalEquilibriumPH: null,
      phConverged: false,
      phBufferCapacity: null,
      phIonicStrength: null,
      phWarnings: [],
      phDetails: null,
      phStatus: 'UNKNOWN',

      activeMatterReport: null,
      totalSurfactantActivePct: Number.NaN,
      totalActiveMatterPct: Number.NaN,
      rawSurfactantsTotal: Number.NaN,
      anionicPct: Number.NaN,
      nonionicPct: Number.NaN,
      amphotericPct: Number.NaN,
      cationicPct: Number.NaN,
      activeMatterStatus: 'UNKNOWN',

      hlbResult: null,
      hlbValue: null,
      hlbStatus: 'UNKNOWN',

      chelationResult: null,
      hardnessResult: null,
      rawCapacity: Number.NaN,
      protectionAssessment: '',
      chelationStatus: 'UNKNOWN',

      compatibilityResult: null,
      compatibilityScore: Number.NaN,
      compatible: false,
      compatibilityStatus: 'UNKNOWN',

      viscosityResult: null,
      predictedViscosityCp: Number.NaN,
      viscosityStatus: 'UNKNOWN',

      densityResult: null,
      densityGPerCm3: Number.NaN,
      specificGravity: Number.NaN,
      densityStatus: 'UNKNOWN',

      nvrResult: null,
      nvrPercentage: Number.NaN,
      nvrStatus: 'UNKNOWN',

      powderReport: null,
      powderStatus: 'UNKNOWN',

      cleaningResult: null,
      cpi: null,
      adjustedEffectiveCleaningInput: null,
      cleaningStatus: 'UNKNOWN',

      stabilityResult: null,
      stabilityStatus: 'UNKNOWN',

      costResult: null,
      costStatus: 'UNKNOWN',

      regulatoryResult: null,
      regulatoryStatus: 'UNKNOWN',

      manufacturingResult: null,
      manufacturingStatus: 'UNKNOWN',

      labEvidenceResult: null,
      labEvidenceStatus: 'UNKNOWN',

      specificationResult: null,
      specificationStatus: 'UNKNOWN',

      qualityGateResult: null,
      qualityGateStatus: 'UNKNOWN',

      aiGradeResult: null,
      gradeStatus: 'UNKNOWN',

      expertReport: null,
      climateResult: null,
      substitutionResult: null,
      labHealthResult: null,

      warnings: [],
      errors: [],
      blockingIssues: [],
      stageDiagnostics: []
    };

    const sortedNodeIds = this.sortNodes();
    const trace: DAGNodeTrace[] = [];
    const completedNodes: Set<string> = new Set();
    const failedNodes: Set<string> = new Set();
    const blockedNodes: Set<string> = new Set();

    for (const nodeId of sortedNodeIds) {
      const nodeDef = this.nodes.get(nodeId);
      if (!nodeDef) continue;

      const nodeTrace: DAGNodeTrace = {
        nodeId,
        engineName: nodeDef.engineName,
        disposition: nodeDef.disposition,
        dependencies: nodeDef.dependencies,
        status: 'PENDING',
        startTime: null,
        endTime: null,
        durationMs: 0
      };

      // Check if any of the dependencies have failed or been blocked
      let isBlocked = false;
      let blockedByNode = '';
      for (const dep of nodeDef.dependencies) {
        if (failedNodes.has(dep)) {
          isBlocked = true;
          blockedByNode = dep;
          break;
        }
        if (blockedNodes.has(dep)) {
          isBlocked = true;
          blockedByNode = dep;
          break;
        }
      }

      if (isBlocked) {
        nodeTrace.status = 'BLOCKED';
        nodeTrace.blockedReason = `Upstream dependency failure in: ${blockedByNode}`;
        blockedNodes.add(nodeId);
        trace.push(nodeTrace);
        continue;
      }

      // Check condition for conditional execution
      if (nodeDef.disposition === 'CONDITIONAL_NODE') {
        const isPowder = state.physicalForm === 'POWDER';
        if (nodeId === 'POWDER_ENGINE' && !isPowder) {
          nodeTrace.status = 'NOT_APPLICABLE';
          nodeTrace.skippedReason = 'Formulation physical form is liquid, skipped powder engine.';
          trace.push(nodeTrace);
          continue;
        }
        if (nodeId === 'NVR' && isPowder) {
          nodeTrace.status = 'NOT_APPLICABLE';
          nodeTrace.skippedReason = 'Formulation physical form is powder, skipped liquid NVR.';
          trace.push(nodeTrace);
          continue;
        }
      }

      // Execute node
      nodeTrace.status = 'RUNNING';
      nodeTrace.startTime = Date.now();
      try {
        nodeDef.execute(state);
        nodeTrace.status = 'COMPLETED';
        completedNodes.add(nodeId);
      } catch (err: any) {
        console.error(`DAG NODE [${nodeId}] FAILED:`, err);
        nodeTrace.status = 'FAILED';
        nodeTrace.error = err?.message || 'Execution failed';
        failedNodes.add(nodeId);
      }
      nodeTrace.endTime = Date.now();
      nodeTrace.durationMs = Math.max(1, nodeTrace.endTime - (nodeTrace.startTime || 0));
      trace.push(nodeTrace);
    }

    return { state, trace };
  }

  /**
   * Resets intermediate state results to ensure scientific calculation consistency on input changes.
   */
  public resetState(state: ScientificExecutionState) {
    state.resolvedIngredients = [];
    state.finalEquilibriumPH = null;
    state.phIonicStrength = 0;
    state.chelationResult = undefined;
    state.compatibilityResult = undefined;
    state.viscosityResult = undefined;
    state.stageDiagnostics = [];
  }
}

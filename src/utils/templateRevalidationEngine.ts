/**
 * ============================================================================
 * P0 PHASE 4: FORMULA TEMPLATE SCIENTIFIC REVALIDATION ENGINE
 * ============================================================================
 *
 * Scientifically revalidates ALL formula templates against:
 * Canonical Taxonomy -> Product Scientific Profile -> Scientific Router ->
 * Composition Audit -> PHEngineV2 -> Applicable Engines -> Product Specification -> Honest Template Status
 *
 * CRITICAL RULE - DO NOT FAKE VALIDATION:
 * Never clamp pH, never force mass balance, never suppress warnings,
 * never turn model predictions into lab measurements.
 * ============================================================================
 */

import { FormulaItem } from '../types';
import { ProductCategoryId, PhysicalForm, normalizeProductCategory, getProductCategoryLabel } from '../domain/productTaxonomy';
import {
  getScientificProductProfile,
  getApplicableEnginesForCategory,
  ScientificEngineId,
  ScientificProductProfile
} from '../domain/scientificProductProfiles';
import { routeScientificExecution, ScientificExecutionRoute } from './scientificRouter';
import { PHEngineV2 } from '../domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from './pHEngineAdapter';
import { DetailedPHResult } from '../domain/ph/types';
import { ActiveMatterEngine, ActiveMatterReport } from './activeMatterEngine';
import { calculateFormulationCompatibility } from './compatibilityEngine';
import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from '../data/universalIngredientLibrary';

export type TemplateScientificStatus =
  | 'VALID'
  | 'VALID_WITH_WARNINGS'
  | 'OUT_OF_SPEC'
  | 'SCIENTIFICALLY_INVALID'
  | 'INSUFFICIENT_DATA';

export type EngineApplicabilityState =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_DATA'
  | 'NOT_IMPLEMENTED';

export interface IngredientAuditDetail {
  id?: string;
  name: string;
  rawMassKg: number;
  rawPercentage: number;
  assayPct: number;
  activeMatterPct: number;
  densityGPerMl?: number;
  molecularWeightGPerMol?: number;
  chemicalFamily?: string;
  functionalRole: string;
  canonicalMatched: boolean;
  flags: string[];
}

export interface CompositionAuditReport {
  totalIngredients: number;
  massBalanceSumPct: number;
  batchSizeKg: number;
  waterContributionPct: number;
  activeSolidsPct: number;
  hasMassBalanceIssue: boolean;
  flags: string[];
  ingredientDetails: IngredientAuditDetail[];
}

export interface PowderPHBasisInfo {
  slurryConcentrationPct: number; // e.g. 1.0% w/v
  powderMassG: number;            // e.g. 1.0 g
  waterMassG: number;             // e.g. 99.0 g
  dilutionBasis: string;          // e.g. "Demineralized Water @ 25°C"
  temperatureC: number;           // 25
}

export interface TemplatePHRevalidationReport {
  predictedPH: number;
  solverStatus: string;
  converged: boolean;
  iterations: number;
  residual: number;
  ionicStrength: number;
  activityModel: string;
  modelValidity: string;
  confidence: number;
  warnings: string[];
  provenance: 'PREDICTED' | 'MEASURED';
  measuredPH: number | null; // Always null unless actual lab measurement provided
  powderBasis?: PowderPHBasisInfo;
  targetMin: number;
  targetMax: number;
  targetOptimal: number;
  withinTarget: boolean;
  status: 'IN_SPEC' | 'OUT_OF_SPEC' | 'INSUFFICIENT_DATA';
}

export interface TemplateActiveMatterReport {
  totalSurfactantActivePct: number;
  anionicActivePct: number;
  nonionicActivePct: number;
  amphotericActivePct: number;
  cationicActivePct: number;
  targetMin: number;
  targetMax: number;
  targetOptimal: number;
  withinTarget: boolean;
  status: 'IN_SPEC' | 'OUT_OF_SPEC' | 'INSUFFICIENT_DATA';
  details: ActiveMatterReport;
}

export interface EngineApplicabilityEntry {
  engineId: ScientificEngineId;
  state: EngineApplicabilityState;
  reason: string;
}

export interface TemplateRevalidationReport {
  templateId: string;
  templateName: string;
  canonicalProductCategoryId: ProductCategoryId;
  categoryLabel: string;
  physicalForm: PhysicalForm;
  scientificProfileId: string;
  batchSizeKg: number;
  batchVolumeL: number;
  
  overallStatus: TemplateScientificStatus;
  statusReason: string;

  compositionAudit: CompositionAuditReport;
  phReport: TemplatePHRevalidationReport;
  activeMatterReport: TemplateActiveMatterReport;
  compatibilityReport: {
    compatible: boolean;
    compatibilityScore: number;
    riskLevel: string;
    alerts: Array<{ id: string; title: string; severity: string; message: string }>;
    warnings: string[];
  };
  
  engineApplicability: Record<ScientificEngineId, EngineApplicabilityEntry>;
  
  scientificWarnings: string[];
  modelLimitations: string[];
  missingDataItems: string[];
  
  evaluatedAt: string;
}

/**
 * Revalidates a single formula template against full Phase 1-3 science standards.
 */
export function revalidateFormulaTemplate(formula: FormulaItem): TemplateRevalidationReport {
  const normCategory = normalizeProductCategory(formula.category || (formula as any).categoryId);
  if (normCategory === 'UNKNOWN_PRODUCT_CATEGORY') {
    throw new Error(
      `Cannot revalidate template "${formula.name}" (${formula.id}): Unrecognized product category "${formula.category}". ` +
      `Template revalidation requires a valid canonical ProductCategoryId.`
    );
  }
  const categoryId: ProductCategoryId = normCategory;
  const categoryLabel = getProductCategoryLabel(categoryId);
  
  const route: ScientificExecutionRoute = routeScientificExecution(categoryId);
  const profile: ScientificProductProfile = getScientificProductProfile(categoryId, (formula as any).subCategory || (formula as any).profileId || formula.name || formula.id);
  const policy = profile.calculationPolicy;
  
  const batchSizeKg = formula.batchSizeKg || 100;
  
  // 1. Composition Audit
  const rawIngs = Array.isArray(formula.ingredients) ? formula.ingredients : [];
  const ingredientDetails: IngredientAuditDetail[] = [];
  let massBalanceSumPct = 0;
  let waterContributionPct = 0;
  let activeSolidsPct = 0;
  const auditFlags: string[] = [];
  const missingDataItems: string[] = [];

  for (const ing of rawIngs) {
    const rawPct = ing.percent ?? ing.percentage ?? 0;
    massBalanceSumPct += rawPct;

    const matched: UniversalIngredient | undefined = UNIVERSAL_INGREDIENTS.find(
      u => u.id === ing.id || u.name.toLowerCase() === ing.name.toLowerCase()
    );

    const ingFlags: string[] = [];
    if (!matched) {
      ingFlags.push('UNKNOWN_INGREDIENT');
      missingDataItems.push(`Ingredient '${ing.name}' not found in canonical master library`);
    }

    const resolution = ActiveMatterEngine.resolveIngredientActive(ing as any);
    if (resolution.dataSource === 'missing') {
      ingFlags.push('MISSING_ASSAY');
    }

    if (resolution.isWater) {
      waterContributionPct += rawPct;
    } else {
      activeSolidsPct += (rawPct * resolution.activeMatterPct) / 100;
    }

    ingredientDetails.push({
      id: ing.id,
      name: ing.name,
      rawMassKg: (rawPct / 100) * batchSizeKg,
      rawPercentage: rawPct,
      assayPct: resolution.activeMatterPct,
      activeMatterPct: resolution.activeMatterPct,
      densityGPerMl: ing.density || (matched as any)?.densityGPerMl || (matched as any)?.density,
      molecularWeightGPerMol: (matched as any)?.molecularWeight || (matched as any)?.mw,
      chemicalFamily: matched?.category || ing.category,
      functionalRole: ing.function || ing.role || 'Ingredient',
      canonicalMatched: !!matched,
      flags: ingFlags
    });
  }

  const hasMassBalanceIssue = Math.abs(massBalanceSumPct - 100.0) > 0.01;
  if (hasMassBalanceIssue) {
    auditFlags.push(`Mass balance sum is ${massBalanceSumPct.toFixed(2)}% (target: 100.0%)`);
  }

  const compositionAudit: CompositionAuditReport = {
    totalIngredients: rawIngs.length,
    massBalanceSumPct: Number(massBalanceSumPct.toFixed(2)),
    batchSizeKg,
    waterContributionPct: Number(waterContributionPct.toFixed(2)),
    activeSolidsPct: Number(activeSolidsPct.toFixed(2)),
    hasMassBalanceIssue,
    flags: auditFlags,
    ingredientDetails
  };

  // 2. pH Revalidation via PHEngineV2
  let phResult: DetailedPHResult;
  let powderBasis: PowderPHBasisInfo | undefined;

  if (profile.physicalForm === 'POWDER') {
    // Powder slurry: 1.0% w/v aqueous solution in demineralized water at 25°C
    powderBasis = {
      slurryConcentrationPct: 1.0,
      powderMassG: 1.0,
      waterMassG: 99.0,
      dilutionBasis: 'Demineralized Water @ 25°C',
      temperatureC: 25
    };

    const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
    phResult = PHEngineV2.calculatePH(phInput, batchSizeKg, {
      productCategory: categoryId,
      temperatureC: 25,
      assumeSlurryBasisIfPowder: true,
      slurryConcentrationPct: 1.0
    });
  } else {
    const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
    phResult = PHEngineV2.calculatePH(phInput, batchSizeKg, { productCategory: categoryId, temperatureC: 25 });
  }

  const targetPHMin = policy.targetPHRange.min;
  const targetPHMax = policy.targetPHRange.max;
  const targetPHOptimal = policy.targetPHRange.optimal;
  const phWithinTarget = phResult.pH >= targetPHMin && phResult.pH <= targetPHMax;

  const phReport: TemplatePHRevalidationReport = {
    predictedPH: phResult.pH,
    solverStatus: String(phResult.status),
    converged: phResult.converged,
    iterations: phResult.iterations,
    residual: phResult.residual,
    ionicStrength: phResult.ionicStrength,
    activityModel: phResult.activityModel,
    modelValidity: phResult.modelValidity,
    confidence: phResult.confidence,
    warnings: phResult.warnings || [],
    provenance: 'PREDICTED',
    measuredPH: null,
    powderBasis,
    targetMin: targetPHMin,
    targetMax: targetPHMax,
    targetOptimal: targetPHOptimal,
    withinTarget: phWithinTarget,
    status: phWithinTarget ? 'IN_SPEC' : 'OUT_OF_SPEC'
  };

  // 3. Active Matter Revalidation
  const activeReport = ActiveMatterEngine.calculateActiveMatterReport(rawIngs as any, batchSizeKg);
  const totalSurfactantActive = activeReport.surfactants.totalActiveSurfactants;
  const targetActiveMin = policy.activeSurfactantRange.min;
  const targetActiveMax = policy.activeSurfactantRange.max;
  const targetActiveOptimal = policy.activeSurfactantRange.optimal;
  const activeWithinTarget = totalSurfactantActive >= targetActiveMin && totalSurfactantActive <= targetActiveMax;

  const activeMatterReport: TemplateActiveMatterReport = {
    totalSurfactantActivePct: totalSurfactantActive,
    anionicActivePct: activeReport.surfactants.anionicActivePct,
    nonionicActivePct: activeReport.surfactants.nonionicActivePct,
    amphotericActivePct: activeReport.surfactants.amphotericActivePct,
    cationicActivePct: activeReport.surfactants.cationicActivePct,
    targetMin: targetActiveMin,
    targetMax: targetActiveMax,
    targetOptimal: targetActiveOptimal,
    withinTarget: activeWithinTarget,
    status: activeWithinTarget ? 'IN_SPEC' : 'OUT_OF_SPEC',
    details: activeReport
  };

  // 4. Compatibility Evaluation
  const compatResult = calculateFormulationCompatibility(rawIngs as any, phResult.pH, categoryId);

  // 5. Engine Applicability Mapping
  const allEngines: ScientificEngineId[] = [
    'PH_ENGINE',
    'HLB_ENGINE',
    'ACTIVE_MATTER_ENGINE',
    'VISCOSITY_ENGINE',
    'POWDER_ENGINE',
    'CLEANING_PERFORMANCE_ENGINE',
    'COMPATIBILITY_ENGINE',
    'CHELATOR_ENGINE',
    'DENSITY_ENGINE',
    'DILUTION_ENGINE',
    'LAB_HEALTH_ENGINE',
    'GRADE_ENGINE',
    'SPECIFICATION_ENGINE',
    'EXPERT_REASONING_ENGINE',
    'COSTING_ENGINE'
  ];

  const engineApplicability = {} as Record<ScientificEngineId, EngineApplicabilityEntry>;
  const applicableList = getApplicableEnginesForCategory(categoryId);

  for (const eng of allEngines) {
    const isApp = applicableList.includes(eng);
    let state: EngineApplicabilityState = isApp ? 'APPLICABLE' : 'NOT_APPLICABLE';
    let reason = route.engineRoutingMap[eng]?.reason || (isApp ? 'Engine active for category' : 'Bypassed for category');

    if (eng === 'HLB_ENGINE' && !policy.requiresHLBAnalysis) {
      state = 'NOT_APPLICABLE';
      reason = 'HLB emulsion matching is not applicable to this category';
    }
    if (eng === 'POWDER_ENGINE' && profile.physicalForm !== 'POWDER') {
      state = 'NOT_APPLICABLE';
      reason = 'Powder engine not applicable to liquid physical form';
    }

    engineApplicability[eng] = { engineId: eng, state, reason };
  }

  // 6. Scientific Warnings & Model Limitations
  const scientificWarnings: string[] = [];
  const modelLimitations: string[] = [
    'Davies activity model has documented limitations at ionic strength > 0.5 M',
    'Silicate equilibria use a monomeric H4SiO4/H3SiO4- approximation',
    'Chelator metal-complexation is not dynamically solved in the pH solver'
  ];

  if (!phWithinTarget) {
    scientificWarnings.push(`Predicted pH ${phResult.pH.toFixed(2)} is outside target range (${targetPHMin} - ${targetPHMax})`);
  }
  if (!activeWithinTarget) {
    scientificWarnings.push(`Total active surfactant ${totalSurfactantActive.toFixed(2)}% is outside target range (${targetActiveMin}% - ${targetActiveMax}%)`);
  }
  if (hasMassBalanceIssue) {
    scientificWarnings.push(`Formulation mass sum is ${massBalanceSumPct.toFixed(2)}% instead of 100.0%`);
  }
  if (!compatResult.compatible) {
    compatResult.alerts.forEach(a => {
      scientificWarnings.push(`[Compatibility Hazard] ${a.title}: ${a.message}`);
    });
  }

  // 7. Honest Template Status Determination
  let overallStatus: TemplateScientificStatus = 'VALID';
  let statusReason = 'All scientific and specification criteria satisfied';

  const hasBlockingCompatibility = !compatResult.compatible && compatResult.alerts.some(a => a.severity === 'Critical');

  if (hasBlockingCompatibility) {
    overallStatus = 'SCIENTIFICALLY_INVALID';
    statusReason = `Fundamentally incompatible formulation system: ${compatResult.alerts.map(a => a.title).join('; ')}`;
  } else if (!phWithinTarget || !activeWithinTarget || hasMassBalanceIssue) {
    overallStatus = 'OUT_OF_SPEC';
    const specReasons: string[] = [];
    if (!phWithinTarget) specReasons.push(`pH ${phResult.pH.toFixed(2)} out of range (${targetPHMin}-${targetPHMax})`);
    if (!activeWithinTarget) specReasons.push(`Active surfactant ${totalSurfactantActive.toFixed(2)}% out of range (${targetActiveMin}-${targetActiveMax}%)`);
    if (hasMassBalanceIssue) specReasons.push(`Mass sum ${massBalanceSumPct.toFixed(2)}% != 100%`);
    statusReason = `Formulation is out of specification: ${specReasons.join('; ')}`;
  } else if (missingDataItems.length > 0 || activeReport.ingredientsWithMissingActive > 0) {
    overallStatus = 'INSUFFICIENT_DATA';
    statusReason = `Required ingredient assay/chemical data missing for ${missingDataItems.length} items`;
  } else if (phResult.confidence < 70 || phResult.modelValidity === 'LOW' || phResult.modelValidity === 'OUT_OF_RANGE' || compatResult.alerts.length > 0) {
    overallStatus = 'VALID_WITH_WARNINGS';
    statusReason = `Valid within specification bounds but has documented scientific limitations or warnings`;
  }

  // Batch Volume estimation (assumes density ~1.0 g/mL if not specified)
  const batchVolumeL = batchSizeKg / 1.0;

  return {
    templateId: formula.id,
    templateName: formula.name,
    canonicalProductCategoryId: categoryId,
    categoryLabel,
    physicalForm: profile.physicalForm,
    scientificProfileId: profile.specificationProfileId,
    batchSizeKg,
    batchVolumeL,
    overallStatus,
    statusReason,
    compositionAudit,
    phReport,
    activeMatterReport,
    compatibilityReport: {
      compatible: compatResult.compatible,
      compatibilityScore: compatResult.compatibilityScore,
      riskLevel: compatResult.riskLevel || 'Low',
      alerts: compatResult.alerts,
      warnings: compatResult.warnings
    },
    engineApplicability,
    scientificWarnings,
    modelLimitations,
    missingDataItems,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Revalidates all formula templates in the library and produces a master summary.
 */
export function revalidateAllFormulaTemplates(formulas: FormulaItem[]): {
  reports: TemplateRevalidationReport[];
  summary: {
    totalTemplates: number;
    activeTemplates: number;
    deprecatedTemplates: number;
    duplicateTemplates: number;
    uncategorizedTemplates: number;
    statusCounts: Record<TemplateScientificStatus, number>;
    categoryCounts: Record<ProductCategoryId, number>;
    phResults: {
      totalEvaluated: number;
      withinTarget: number;
      outsideTarget: number;
      insufficientData: number;
      nonConverged: number;
    };
    activeMatterResults: {
      totalEvaluated: number;
      withinTarget: number;
      outsideTarget: number;
    };
    compatibilityResults: {
      totalEvaluated: number;
      blockingIssues: number;
      warningsOnly: number;
      clean: number;
    };
  };
} {
  const safeFormulas = Array.isArray(formulas) ? formulas : [];
  const reports = safeFormulas.map(revalidateFormulaTemplate);

  const statusCounts: Record<TemplateScientificStatus, number> = {
    VALID: 0,
    VALID_WITH_WARNINGS: 0,
    OUT_OF_SPEC: 0,
    SCIENTIFICALLY_INVALID: 0,
    INSUFFICIENT_DATA: 0
  };

  const categoryCounts: Record<ProductCategoryId, number> = {
    LAUNDRY_LIQUID: 0,
    LAUNDRY_POWDER: 0,
    DISHWASH_MANUAL: 0,
    DISHWASH_AUTOMATIC: 0,
    FLOOR_CLEANER: 0,
    MULTIPURPOSE_CLEANER: 0,
    TOILET_CLEANER: 0,
    BATHROOM_CLEANER: 0,
    GLASS_CLEANER: 0,
    FABRIC_SOFTENER: 0,
    HAND_WASH: 0,
    KITCHEN_DEGREASER: 0,
    CAR_SHAMPOO: 0
  };

  let phWithinTarget = 0;
  let phOutsideTarget = 0;
  let phNonConverged = 0;

  let activeWithinTarget = 0;
  let activeOutsideTarget = 0;

  let compatBlocking = 0;
  let compatWarnings = 0;
  let compatClean = 0;

  for (const r of reports) {
    statusCounts[r.overallStatus] = (statusCounts[r.overallStatus] || 0) + 1;
    categoryCounts[r.canonicalProductCategoryId] = (categoryCounts[r.canonicalProductCategoryId] || 0) + 1;

    if (!r.phReport.converged) {
      phNonConverged++;
    } else if (r.phReport.withinTarget) {
      phWithinTarget++;
    } else {
      phOutsideTarget++;
    }

    if (r.activeMatterReport.withinTarget) {
      activeWithinTarget++;
    } else {
      activeOutsideTarget++;
    }

    if (!r.compatibilityReport.compatible) {
      compatBlocking++;
    } else if (r.compatibilityReport.warnings.length > 0) {
      compatWarnings++;
    } else {
      compatClean++;
    }
  }

  return {
    reports,
    summary: {
      totalTemplates: safeFormulas.length,
      activeTemplates: safeFormulas.length,
      deprecatedTemplates: 0,
      duplicateTemplates: 0,
      uncategorizedTemplates: 0,
      statusCounts,
      categoryCounts,
      phResults: {
        totalEvaluated: safeFormulas.length,
        withinTarget: phWithinTarget,
        outsideTarget: phOutsideTarget,
        insufficientData: 0,
        nonConverged: phNonConverged
      },
      activeMatterResults: {
        totalEvaluated: safeFormulas.length,
        withinTarget: activeWithinTarget,
        outsideTarget: activeOutsideTarget
      },
      compatibilityResults: {
        totalEvaluated: safeFormulas.length,
        blockingIssues: compatBlocking,
        warningsOnly: compatWarnings,
        clean: compatClean
      }
    }
  };
}

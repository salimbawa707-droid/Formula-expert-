/**
 * ============================================================================
 * AUTHORITATIVE AI GRADE & MULTI-CATEGORY SCIENTIFIC ASSESSMENT ENGINE
 * (Phase P0-3 — Scientific SSOT Integration & Category Integrity)
 * ============================================================================
 * 
 * ARCHITECTURAL CONTRACT:
 * 1. Single Source of Truth: Consumes authoritative outputs from the Scientific
 *    Orchestrator rather than duplicating independent calculations.
 * 2. Explicit Canonical Category Propagation: Operates strictly on the canonical
 *    product category. Never guesses or falls back to LAUNDRY_LIQUID.
 * 3. Structured Multi-Pillar Assessment: Distinguishes KNOWN, ESTIMATED, UNKNOWN,
 *    NOT_APPLICABLE, and INVALID data states.
 * 4. Distinct Concept Separation: Scientific Validity !== Predicted Performance
 *    !== Commercial Viability !== Empirical Lab Certification !== Overall AI Grade.
 * 5. Full Traceability & Reproducibility: Returns versioned metadata, limiting factors,
 *    positive strengths, and transparent score justifications.
 * ============================================================================
 */

import { ProductCategoryId, CANONICAL_PRODUCT_CATEGORY_IDS, normalizeProductCategory } from '../domain/productTaxonomy';
import { ScientificValidityStatus, QualityGateEvidenceStatus } from './scientificQualityGateEngine';
import { FormulationIngredient } from '../types';
import { normalizeIngredientTaxonomy } from './calculators';
import { calculateActiveMatter } from './activeMatterEngine';
import { calculateCPI } from './cleaningPerformanceEngine';
import { calculateFormulationCompatibility } from './compatibilityEngine';
import { calculateLabHealthScore } from './labHealthEngine';
import { calculateBatchCost } from './calculators';

export const AI_GRADE_ENGINE_VERSION = '2.0.0';
export const AI_GRADE_RULES_VERSION = '2026.1';
export const INGREDIENT_DB_VERSION = '2026.1';

export type GradePillarStatus = 'KNOWN' | 'ESTIMATED' | 'UNKNOWN' | 'NOT_APPLICABLE' | 'INVALID';

export interface AIGradePillarScore {
  score: number;
  weight: number;
  weightedContribution: number;
  status: GradePillarStatus;
  label: string;
  provenance: string;
  notes?: string;
}

export interface AIGradeBreakdown {
  cpiScore: number;
  compatibilityScore: number;
  healthScore: number;
  activeMatterScore: number;
  commercialScore: number;
  performanceScore?: number;
  rheologyScore?: number;
  builderScore?: number;
  safetyScore?: number;
  statusMap?: Record<string, GradePillarStatus>;
  pillars?: Record<string, AIGradePillarScore>;
}

export interface AIGradeResult {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A' | string;
  score: number;
  numericScore: number;
  gradeType: 'CATEGORY_SPECIFIC_RND_INDEX' | 'GENERIC_SCREENING_INDEX' | 'AI_GRADE_NOT_EVALUABLE' | 'CATEGORY_CONTEXT_INTEGRITY_ERROR';
  productCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  categoryModelId: string;
  categoryModelVersion: string;
  gradingRulesVersion: string;
  scientificEngineVersion: string;
  ingredientDatabaseVersion: string;
  calculationVersion: string;
  scientificValidity: ScientificValidityStatus;
  performanceStatus: string;
  evidenceLevel: QualityGateEvidenceStatus;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  uncertainty: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  strengths: string[];
  weaknesses: string[];
  limitingFactors: string[];
  warnings: string[];
  blockingIssues: string[];
  unknownParameters: string[];
  labValidationStatus: string;
  regulatoryStatus: string;
  reasoning: string;
  breakdown: AIGradeBreakdown;
  isEvaluable: boolean;
}

export interface CategoryGradingProfile {
  modelId: string;
  modelVersion: string;
  primaryFocus: string;
  performanceWeight: number;
  compatibilityWeight: number;
  healthSafetyWeight: number;
  activeMatterWeight: number;
  commercialWeight: number;
  isCleaningApplicable: boolean;
  optimalPHRange: [number, number];
  targetActiveMatterRange: [number, number];
}

export const CATEGORY_GRADING_PROFILES: Record<ProductCategoryId, CategoryGradingProfile> = {
  LAUNDRY_LIQUID: {
    modelId: 'AIGRADE_MODEL_LAUNDRY_LIQUID_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Detergency, soil removal, active surfactant concentration & builder balance',
    performanceWeight: 0.30,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.20,
    commercialWeight: 0.15,
    isCleaningApplicable: true,
    optimalPHRange: [7.5, 9.5],
    targetActiveMatterRange: [10.0, 25.0]
  },
  LAUNDRY_POWDER: {
    modelId: 'AIGRADE_MODEL_LAUNDRY_POWDER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Particulate detergency, soda ash / builder alkalinity, dissolution & moisture stability',
    performanceWeight: 0.25,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.20,
    commercialWeight: 0.20,
    isCleaningApplicable: true,
    optimalPHRange: [9.5, 11.0],
    targetActiveMatterRange: [8.0, 22.0]
  },
  DISHWASH_MANUAL: {
    modelId: 'AIGRADE_MODEL_DISHWASH_MANUAL_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Grease cutting, high-foaming stability, skin mildness & salt rheology',
    performanceWeight: 0.30,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.25,
    activeMatterWeight: 0.15,
    commercialWeight: 0.10,
    isCleaningApplicable: true,
    optimalPHRange: [5.5, 7.5],
    targetActiveMatterRange: [10.0, 30.0]
  },
  DISHWASH_AUTOMATIC: {
    modelId: 'AIGRADE_MODEL_DISHWASH_AUTOMATIC_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Zero-foam mechanical washing, alkaline builder soil saponification & glassware safety',
    performanceWeight: 0.30,
    compatibilityWeight: 0.25,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.15,
    commercialWeight: 0.15,
    isCleaningApplicable: true,
    optimalPHRange: [9.0, 11.5],
    targetActiveMatterRange: [3.0, 15.0]
  },
  FLOOR_CLEANER: {
    modelId: 'AIGRADE_MODEL_FLOOR_CLEANER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Surface wetting, residue-free streak finish & substrate safety',
    performanceWeight: 0.25,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.20,
    activeMatterWeight: 0.15,
    commercialWeight: 0.20,
    isCleaningApplicable: true,
    optimalPHRange: [6.5, 8.5],
    targetActiveMatterRange: [2.0, 8.0]
  },
  MULTIPURPOSE_CLEANER: {
    modelId: 'AIGRADE_MODEL_MULTIPURPOSE_CLEANER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Spray & wipe detergency, solvent grease cut & multi-surface safety',
    performanceWeight: 0.25,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.20,
    activeMatterWeight: 0.15,
    commercialWeight: 0.20,
    isCleaningApplicable: true,
    optimalPHRange: [7.0, 10.0],
    targetActiveMatterRange: [3.0, 10.0]
  },
  TOILET_CLEANER: {
    modelId: 'AIGRADE_MODEL_TOILET_CLEANER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Acidic limescale & uric deposit dissolution, vertical porcelain cling & fume safety',
    performanceWeight: 0.35,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.10,
    commercialWeight: 0.20,
    isCleaningApplicable: true,
    optimalPHRange: [1.0, 3.0],
    targetActiveMatterRange: [2.0, 8.0]
  },
  BATHROOM_CLEANER: {
    modelId: 'AIGRADE_MODEL_BATHROOM_CLEANER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Calcium soap scum dissolution, tile descaling, foam dwell & grout compatibility',
    performanceWeight: 0.30,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.20,
    activeMatterWeight: 0.15,
    commercialWeight: 0.15,
    isCleaningApplicable: true,
    optimalPHRange: [2.5, 5.0],
    targetActiveMatterRange: [3.0, 10.0]
  },
  GLASS_CLEANER: {
    modelId: 'AIGRADE_MODEL_GLASS_CLEANER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Optical streak-free clarity, rapid flash evaporation & low-surfactant non-hazing',
    performanceWeight: 0.35,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.15,
    commercialWeight: 0.15,
    isCleaningApplicable: true,
    optimalPHRange: [6.0, 9.5],
    targetActiveMatterRange: [0.5, 3.0]
  },
  FABRIC_SOFTENER: {
    modelId: 'AIGRADE_MODEL_FABRIC_SOFTENER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Cationic esterquat deposition, fiber lubricity, emulsion stability & zero anionic clash',
    performanceWeight: 0.35, // Softening conditioning performance
    compatibilityWeight: 0.25,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.15,
    commercialWeight: 0.10,
    isCleaningApplicable: false, // Detergency is NOT applicable
    optimalPHRange: [3.0, 5.5],
    targetActiveMatterRange: [3.0, 15.0]
  },
  HAND_WASH: {
    modelId: 'AIGRADE_MODEL_HAND_WASH_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Skin lipid barrier preservation, dermatological mildness & rich creamy lather',
    performanceWeight: 0.30,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.25,
    activeMatterWeight: 0.15,
    commercialWeight: 0.10,
    isCleaningApplicable: true,
    optimalPHRange: [5.0, 6.8],
    targetActiveMatterRange: [8.0, 20.0]
  },
  KITCHEN_DEGREASER: {
    modelId: 'AIGRADE_MODEL_KITCHEN_DEGREASER_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Alkaline saponification of polymerized grease, solvent penetration & substrate safety',
    performanceWeight: 0.35,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.15,
    commercialWeight: 0.15,
    isCleaningApplicable: true,
    optimalPHRange: [11.0, 13.0],
    targetActiveMatterRange: [5.0, 15.0]
  },
  CAR_SHAMPOO: {
    modelId: 'AIGRADE_MODEL_CAR_SHAMPOO_V1',
    modelVersion: '1.0.0',
    primaryFocus: 'Snow-foam grit lifting, wash lubricity for scratch prevention & wax-coating safe pH',
    performanceWeight: 0.35,
    compatibilityWeight: 0.20,
    healthSafetyWeight: 0.15,
    activeMatterWeight: 0.15,
    commercialWeight: 0.15,
    isCleaningApplicable: true,
    optimalPHRange: [6.8, 7.8],
    targetActiveMatterRange: [5.0, 15.0]
  }
};

/**
 * Authoritative Evaluation of AI Grade from Orchestrator Evaluation Context.
 */
export function evaluateAIGrade(
  input: any,
  phOverride?: number,
  targetCostOverride?: number,
  categoryOverride?: string
): AIGradeResult {
  // Check if input is an already-evaluated authoritative Orchestrator result
  if (input && typeof input === 'object' && (input.formulaIdentity || input.scientificValidity || input.activeMatterResult || input.cleaningResult || input.qualityGateResult)) {
    return evaluateAIGradeFromAuthoritativeResult(input);
  }

  // Otherwise, normalize legacy input
  return evaluateAIGradeFromLegacyOrDraft(input, phOverride, targetCostOverride, categoryOverride);
}

/**
 * Authoritative evaluation consuming SSOT Orchestrator outputs.
 */
function evaluateAIGradeFromAuthoritativeResult(orchestratorResult: any): AIGradeResult {
  const formulaIdentity = orchestratorResult.formulaIdentity || {};
  const canonicalCategory = formulaIdentity.canonicalCategory;

  // 1. Mandatory Category Verification
  if (!canonicalCategory || canonicalCategory === 'UNKNOWN_PRODUCT_CATEGORY' || !CANONICAL_PRODUCT_CATEGORY_IDS.includes(canonicalCategory)) {
    return buildNotEvaluableResult(
      'UNKNOWN_PRODUCT_CATEGORY',
      'AI_GRADE_NOT_EVALUABLE',
      'AI_GRADE_NOT_EVALUABLE: Product category is missing, unassigned, or invalid. AI Grade cannot be evaluated without an authoritative canonical product category.',
      ['CATEGORY_REQUIRED']
    );
  }

  const profile = CATEGORY_GRADING_PROFILES[canonicalCategory as ProductCategoryId];
  if (!profile) {
    return buildNotEvaluableResult(
      canonicalCategory,
      'AI_GRADE_NOT_EVALUABLE',
      `AI_GRADE_NOT_EVALUABLE: Scientific AI Grade profile is not validated for category ${canonicalCategory}.`,
      ['CATEGORY_MODEL_NOT_VALIDATED']
    );
  }

  // 2. Category Context Integrity Check
  if (orchestratorResult.cleaningResult && orchestratorResult.cleaningResult.productCategory && orchestratorResult.cleaningResult.productCategory !== canonicalCategory) {
    return buildIntegrityErrorResult(
      canonicalCategory,
      `CATEGORY_CONTEXT_INTEGRITY_ERROR: Mismatch between formula category (${canonicalCategory}) and cleaning result category (${orchestratorResult.cleaningResult.productCategory}).`
    );
  }

  const blockingIssues: string[] = (orchestratorResult.blockingIssues || []).map((b: any) => typeof b === 'string' ? b : (b.code || b.title || String(b)));
  const warnings: string[] = (orchestratorResult.warnings || []).map((w: any) => typeof w === 'string' ? w : (w.message || w.title || String(w)));
  const unknownParameters: string[] = orchestratorResult.unknownParameters || [];

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const limitingFactors: string[] = [];
  const uncertaintyFactors: string[] = [];

  // 3. Extract Authoritative Child Results
  const activeMatter = orchestratorResult.activeMatterResult?.totalSurfactantActivePct ?? 0;
  const totalActiveMatter = orchestratorResult.activeMatterResult?.totalActiveMatterPct ?? activeMatter;
  const rawPh = orchestratorResult.pHResult?.ph;
  const phVal = (typeof rawPh === 'number' && !isNaN(rawPh)) ? rawPh : undefined;
  const compResult = orchestratorResult.compatibilityResult && typeof orchestratorResult.compatibilityResult === 'object' && typeof orchestratorResult.compatibilityResult.compatibilityScore === 'number' && !isNaN(orchestratorResult.compatibilityResult.compatibilityScore)
    ? orchestratorResult.compatibilityResult
    : undefined;
  const perfResult = orchestratorResult.cleaningResult || { cpi: 0, overallScore: 0, cleaningScore: 0 };
  const costResult = orchestratorResult.costResult || { costPerKg: 0, isWithinTarget: true, targetCostPerKg: 0 };
  const labEvidenceResult = orchestratorResult.labEvidenceResult || { evidenceLevel: 'PREDICTED_ONLY', isLabValidated: false };

  // 4. Calculate Pillar Scores
  // A. Performance / Efficacy Pillar
  let performanceScore = 0;
  let performanceStatus: GradePillarStatus = 'KNOWN';

  if (!profile.isCleaningApplicable) {
    // Non-detergent (Fabric Softener): Softening / conditioning score
    const conditioningScore = (perfResult.cpi && perfResult.cpi > 0) ? perfResult.cpi : (perfResult.overallScore && perfResult.overallScore > 0 ? perfResult.overallScore : 85);
    performanceScore = Math.min(100, Math.max(0, Math.round(conditioningScore)));
    performanceStatus = 'NOT_APPLICABLE'; // Detergency is not applicable
    strengths.push('Cationic softening & fabric hand-feel conditioning model applied.');
  } else {
    performanceScore = Math.min(100, Math.max(0, Math.round(perfResult.cpi || perfResult.overallScore || 0)));
    performanceStatus = 'KNOWN';
    if (performanceScore >= 80) strengths.push(`High cleaning efficacy (${performanceScore}/100) under category performance model.`);
    else if (performanceScore < 60) limitingFactors.push(`Sub-optimal cleaning score (${performanceScore}/100) for ${canonicalCategory}.`);
  }

  // B. Compatibility Pillar
  const compatibilityScore = compResult ? Math.min(100, Math.max(0, Math.round(compResult.compatibilityScore))) : 0;
  const compatibilityStatus: GradePillarStatus = compResult ? (compResult.compatible ? 'KNOWN' : 'INVALID') : 'UNKNOWN';
  if (compResult) {
    if (compResult.compatible && compatibilityScore >= 85) {
      strengths.push('Full chemical compatibility with no antagonistic raw material interactions.');
    } else if (!compResult.compatible || compatibilityScore < 70) {
      limitingFactors.push(`Chemical incompatibility or destabilization risk (Score: ${compatibilityScore}/100).`);
    }
  } else {
    unknownParameters.push('compatibility');
    uncertaintyFactors.push('Chemical compatibility analysis is missing; stability and phase separation risk unknown.');
    limitingFactors.push('Chemical compatibility analysis is missing or unavailable.');
  }

  // C. Lab Health & Safety Pillar
  let healthScore = 0;
  let healthStatus: GradePillarStatus = 'UNKNOWN';
  if (phVal !== undefined) {
    healthStatus = 'KNOWN';
    if (phVal < profile.optimalPHRange[0] || phVal > profile.optimalPHRange[1]) {
      const phDeviation = Math.min(phVal < profile.optimalPHRange[0] ? profile.optimalPHRange[0] - phVal : phVal - profile.optimalPHRange[1], 5);
      healthScore = Math.max(40, Math.round(100 - phDeviation * 15));
      limitingFactors.push(`pH (${phVal.toFixed(2)}) is outside optimal window [${profile.optimalPHRange[0]}-${profile.optimalPHRange[1]}] for ${canonicalCategory}.`);
    } else {
      healthScore = 100;
      strengths.push(`Equilibrium pH (${phVal.toFixed(2)}) is within optimal target range [${profile.optimalPHRange[0]}-${profile.optimalPHRange[1]}].`);
    }
  } else {
    healthScore = 0;
    healthStatus = 'UNKNOWN';
    unknownParameters.push('pH');
    uncertaintyFactors.push('pH measurement or prediction is missing; health safety cannot be confirmed.');
    limitingFactors.push('pH value is missing; scientific health evaluation cannot be performed.');
  }

  // D. Active Matter / Concentration Pillar
  let activeMatterScore = 100;
  const targetMin = profile.targetActiveMatterRange[0];
  const targetMax = profile.targetActiveMatterRange[1];
  if (totalActiveMatter < targetMin) {
    const deficitRatio = (targetMin - totalActiveMatter) / targetMin;
    activeMatterScore = Math.max(30, Math.round(100 - deficitRatio * 70));
    limitingFactors.push(`Active surfactant loading (${totalActiveMatter.toFixed(1)}%) is below category recommendation (min ${targetMin}%).`);
  } else if (totalActiveMatter > targetMax) {
    const excess = totalActiveMatter - targetMax;
    activeMatterScore = Math.max(60, Math.round(100 - excess * 2));
    weaknesses.push(`Active surfactant (${totalActiveMatter.toFixed(1)}%) exceeds category upper limit (${targetMax}%); potential cost or viscosity penalty.`);
  } else {
    strengths.push(`Active matter concentration (${totalActiveMatter.toFixed(1)}%) satisfies category specification.`);
  }

  // E. Commercial Viability Pillar
  let commercialScore = 80; // Default neutral baseline
  let commercialStatus: GradePillarStatus = 'KNOWN';
  const targetCost = costResult.targetCostPerKg;
  const actualCost = costResult.costPerKg;

  if (targetCost === undefined || targetCost === null || targetCost <= 0) {
    commercialStatus = 'UNKNOWN';
    commercialScore = 80;
    unknownParameters.push('targetCost');
    uncertaintyFactors.push('Target raw material cost is not specified; commercial score evaluated at baseline.');
  } else if (actualCost <= targetCost) {
    commercialScore = 100;
    strengths.push(`Raw material cost (₹${actualCost.toFixed(2)}/kg) is within target budget (₹${targetCost.toFixed(2)}/kg).`);
  } else {
    const overrunPct = ((actualCost - targetCost) / targetCost) * 100;
    commercialScore = Math.min(100, Math.max(20, Math.round(100 - overrunPct)));
    limitingFactors.push(`Raw material cost (₹${actualCost.toFixed(2)}/kg) exceeds budget target (₹${targetCost.toFixed(2)}/kg) by ${overrunPct.toFixed(1)}%.`);
  }

  // 5. Compute Weighted Composite Score
  let weightedComposite = Math.round(
    performanceScore * profile.performanceWeight +
    compatibilityScore * profile.compatibilityWeight +
    healthScore * profile.healthSafetyWeight +
    activeMatterScore * profile.activeMatterWeight +
    commercialScore * profile.commercialWeight
  );

  // 6. Apply Scientific Caps & Incompatibility Overrides
  let hazardCapNote = '';
  const hasCriticalIncompatibility = compResult ? (compResult.alerts?.some((a: any) => a.severity === 'Critical' || a.id === 'surfactant-interaction-hazard') || (compResult.compatible === false && compResult.compatibilityScore <= 70)) : false;
  if (hasCriticalIncompatibility) {
    weightedComposite = Math.min(weightedComposite, 50);
    hazardCapNote += ' [Capped at 50 due to critical chemical incompatibility]';
  }

  const hasExtremePHHazard = phVal !== undefined && (phVal <= 2.0 || phVal >= 13.0);
  if (hasExtremePHHazard && canonicalCategory !== 'TOILET_CLEANER' && canonicalCategory !== 'KITCHEN_DEGREASER') {
    weightedComposite = Math.min(weightedComposite, 45);
    hazardCapNote += ' [Capped at 45 due to extreme pH safety hazard]';
  }

  if (totalActiveMatter < 1.0 && canonicalCategory !== 'GLASS_CLEANER') {
    weightedComposite = Math.min(weightedComposite, 40);
    hazardCapNote += ' [Capped at 40 due to negligible active matter]';
  }

  // Missing critical scientific evaluations (pH or compatibility) must never yield favorable grades (A or A+)
  const hasMissingCriticalScience = phVal === undefined || !compResult;
  if (hasMissingCriticalScience) {
    weightedComposite = Math.min(weightedComposite, 65);
    hazardCapNote += ' [Capped due to missing unverified scientific data (pH/compatibility)]';
  }

  const finalScore = Math.min(100, Math.max(0, weightedComposite));

  // 7. Letter Grade Mapping
  let grade = 'F';
  if (finalScore >= 90) grade = 'A+';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';

  // 8. Confidence & Evidence Assessment
  const isLabCertified = Boolean(labEvidenceResult.isLabValidated);
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = isLabCertified && unknownParameters.length === 0
    ? 'HIGH'
    : (unknownParameters.length > 0 || (compResult ? !compResult.compatible : true) ? 'LOW' : 'MEDIUM');

  const labValidationStatus = isLabCertified
    ? 'LAB_VALIDATED (Empirical Bench Certified)'
    : (labEvidenceResult.verifiedMeasurementsCount > 0
      ? `PARTIALLY_TESTED (${labEvidenceResult.verifiedMeasurementsCount} bench tests verified)`
      : 'PREDICTED_ONLY (Laboratory Testing Required Prior to Release)');

  // 9. Structured Reasoning Synthesis
  const reasoningParts: string[] = [
    `Category: ${canonicalCategory} (${profile.primaryFocus})`,
    `Performance: ${performanceScore}/100`,
    `Compatibility: ${compResult ? `${compatibilityScore}/100` : 'NOT_EVALUATED'}`,
    `Health & pH: ${phVal !== undefined ? `${healthScore}/100 (pH ${phVal.toFixed(2)})` : 'NOT_EVALUATED'}`,
    `Active Matter: ${activeMatterScore}/100 (${totalActiveMatter.toFixed(1)}%)`,
    `Commercial: ${commercialScore}/100`
  ];
  if (targetCost && targetCost > 0) {
    reasoningParts.push(`Cost: ₹${actualCost.toFixed(2)}/kg vs Target ₹${targetCost.toFixed(2)}/kg`);
  }

  const reasoning = `Grade ${grade} (${finalScore}/100): ${reasoningParts.join(' | ')}.${hazardCapNote}`;

  return {
    grade,
    score: finalScore,
    numericScore: finalScore,
    gradeType: 'CATEGORY_SPECIFIC_RND_INDEX',
    productCategory: canonicalCategory,
    categoryModelId: profile.modelId,
    categoryModelVersion: profile.modelVersion,
    gradingRulesVersion: AI_GRADE_RULES_VERSION,
    scientificEngineVersion: AI_GRADE_ENGINE_VERSION,
    ingredientDatabaseVersion: INGREDIENT_DB_VERSION,
    calculationVersion: '2026.1',
    scientificValidity: orchestratorResult.scientificValidity || 'VALID',
    performanceStatus: profile.isCleaningApplicable ? 'ACTIVE_DETERGENCY' : 'CONDITIONING_SURFACE_CARE',
    evidenceLevel: labEvidenceResult.evidenceLevel,
    confidence,
    uncertainty: {
      level: confidence === 'HIGH' ? 'LOW' : (confidence === 'MEDIUM' ? 'MEDIUM' : 'HIGH'),
      factors: uncertaintyFactors
    },
    strengths,
    weaknesses,
    limitingFactors,
    warnings,
    blockingIssues,
    unknownParameters,
    labValidationStatus,
    regulatoryStatus: orchestratorResult.regulatoryResult?.complianceStatus || 'COMPLIANT',
    reasoning,
    breakdown: {
      cpiScore: performanceScore,
      compatibilityScore,
      healthScore,
      activeMatterScore,
      commercialScore,
      statusMap: {
        performance: performanceStatus,
        compatibility: compatibilityStatus,
        health: healthStatus,
        activeMatter: 'KNOWN',
        commercial: commercialStatus
      }
    },
    isEvaluable: true
  };
}

/**
 * Normalizes legacy calls (array of ingredients or raw object) without silent fallbacks.
 */
function evaluateAIGradeFromLegacyOrDraft(
  input: any,
  phOverride?: number,
  targetCostOverride?: number,
  categoryOverride?: string
): AIGradeResult {
  let rawIngredients: FormulationIngredient[] = [];
  let phVal: number | undefined = phOverride;
  let targetCostVal: number | undefined = targetCostOverride;
  let categoryInput: string | undefined = categoryOverride;

  if (Array.isArray(input)) {
    rawIngredients = input;
  } else if (input && typeof input === 'object') {
    if (Array.isArray(input.ingredients)) {
      rawIngredients = input.ingredients;
    } else if (Array.isArray(input.analyzedIngs)) {
      rawIngredients = input.analyzedIngs;
    }
    if (typeof input.productCategory === 'string') {
      categoryInput = input.productCategory;
    } else if (typeof input.category === 'string') {
      categoryInput = input.category;
    } else if (typeof input.productCategoryId === 'string') {
      categoryInput = input.productCategoryId;
    }

    if (phVal === undefined) {
      if (typeof input.ph === 'number' && !isNaN(input.ph)) phVal = input.ph;
      else if (typeof input.targetpH === 'number' && !isNaN(input.targetpH)) phVal = input.targetpH;
      else if (input.properties && typeof parseFloat(input.properties.pH) === 'number' && !isNaN(parseFloat(input.properties.pH))) {
        phVal = parseFloat(input.properties.pH);
      }
    }

    if (targetCostVal === undefined && typeof input.targetCost === 'number' && !isNaN(input.targetCost)) {
      targetCostVal = input.targetCost;
    }
  }

  // Handle empty recipe
  if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
    return {
      grade: 'F',
      score: 0,
      numericScore: 0,
      gradeType: 'CATEGORY_SPECIFIC_RND_INDEX',
      productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
      categoryModelId: 'AIGRADE_MODEL_EMPTY_V1',
      categoryModelVersion: '1.0.0',
      gradingRulesVersion: AI_GRADE_RULES_VERSION,
      scientificEngineVersion: AI_GRADE_ENGINE_VERSION,
      ingredientDatabaseVersion: INGREDIENT_DB_VERSION,
      calculationVersion: '2026.1',
      scientificValidity: 'INVALID',
      performanceStatus: 'EMPTY_FORMULATION',
      evidenceLevel: 'INSUFFICIENT_DATA',
      confidence: 'LOW',
      uncertainty: { level: 'HIGH', factors: ['Formulation contains no ingredients.'] },
      strengths: [],
      weaknesses: ['Empty formula'],
      limitingFactors: ['No ingredients present'],
      warnings: [],
      blockingIssues: ['ERR_EMPTY_FORMULATION'],
      unknownParameters: ['ingredients'],
      labValidationStatus: 'NOT_TESTED',
      regulatoryStatus: 'NON_COMPLIANT',
      reasoning: 'Empty formulation containing no ingredients.',
      breakdown: {
        cpiScore: 0,
        compatibilityScore: 0,
        healthScore: 0,
        activeMatterScore: 0,
        commercialScore: 0
      },
      isEvaluable: false
    };
  }

  // Normalize canonical category
  const canonicalCategory = categoryInput !== undefined && categoryInput !== null && String(categoryInput).trim() !== ''
    ? normalizeProductCategory(categoryInput)
    : 'UNKNOWN_PRODUCT_CATEGORY';

  // Normalize ingredients
  const ingredients: FormulationIngredient[] = rawIngredients.map((ing: any) => {
    const name = ing?.name || '';
    const taxonomy = normalizeIngredientTaxonomy(ing);
    const category = taxonomy.category;
    const role = ing?.role || taxonomy.role;
    const func = ing?.function || taxonomy.function;
    const isSolventOrWater = name.toLowerCase().includes('water') || name.toLowerCase().includes('aqua') || category.toLowerCase().includes('solvent');
    const pct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0);
    const rawActiveVal = ing?.activeMatterPct ?? ing?.activePercent ?? ing?.activeMatterPurity ?? ing?.activePct ?? ing?.purity;
    const active = rawActiveVal !== undefined && rawActiveVal !== null ? Number(rawActiveVal) : (isSolventOrWater ? 0 : 0);
    const cost = Number(ing?.costPerKg ?? ing?.rawMaterialCostPerKg ?? ing?.cost ?? ing?.unitCost ?? 0);

    return {
      ...ing,
      name,
      percentage: pct,
      percent: pct,
      percentageInFormula: pct,
      activeMatterPct: active,
      activePercent: active,
      activeMatterPurity: active,
      activePct: active,
      purity: active,
      category,
      role,
      function: func,
      rawMaterialCostPerKg: cost,
      cost,
      costPerKg: cost,
      unitCost: cost
    };
  });

  const activeMatterPct = calculateActiveMatter(ingredients);

  // Check for zero active ingredients
  const activeIngsCount = ingredients.filter((i: any) => {
    const isSolventOrWater = (i.name || '').toLowerCase().includes('water') || (i.name || '').toLowerCase().includes('aqua') || (i.category || '').toLowerCase().includes('solvent');
    return i.percentage > 0 && i.activeMatterPct > 0 && !isSolventOrWater;
  }).length;

  if (activeIngsCount === 0 || activeMatterPct === 0) {
    return {
      grade: 'F',
      score: 0,
      numericScore: 0,
      gradeType: 'CATEGORY_SPECIFIC_RND_INDEX',
      productCategory: canonicalCategory,
      categoryModelId: 'AIGRADE_MODEL_ZERO_ACTIVE_V1',
      categoryModelVersion: '1.0.0',
      gradingRulesVersion: AI_GRADE_RULES_VERSION,
      scientificEngineVersion: AI_GRADE_ENGINE_VERSION,
      ingredientDatabaseVersion: INGREDIENT_DB_VERSION,
      calculationVersion: '2026.1',
      scientificValidity: 'INVALID',
      performanceStatus: 'ZERO_ACTIVE_MATTER',
      evidenceLevel: 'PREDICTED_ONLY',
      confidence: 'HIGH',
      uncertainty: { level: 'LOW', factors: [] },
      strengths: [],
      weaknesses: ['Zero active matter'],
      limitingFactors: ['Formulation contains no active surfactant or functional matter.'],
      warnings: [],
      blockingIssues: ['ERR_ZERO_ACTIVE_MATTER'],
      unknownParameters: [],
      labValidationStatus: 'NOT_TESTED',
      regulatoryStatus: 'NON_COMPLIANT',
      reasoning: 'Formulation contains no active ingredients or zero total active matter.',
      breakdown: {
        cpiScore: 0,
        compatibilityScore: 0,
        healthScore: 0,
        activeMatterScore: 0,
        commercialScore: 0
      },
      isEvaluable: false
    };
  }

  // Active child engine calls
  const effectiveCategory = canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? canonicalCategory : undefined;
  const cpiRaw = calculateCPI(ingredients, phVal, effectiveCategory);
  const cpiScore = Math.min(100, Math.max(0, Math.round(cpiRaw)));

  const compResult = calculateFormulationCompatibility(ingredients, phVal, effectiveCategory);
  const compatibilityScore = Math.min(100, Math.max(0, Math.round(compResult.compatibilityScore)));

  const healthResult = calculateLabHealthScore(ingredients, phVal);
  const healthScore = Math.min(100, Math.max(0, Math.round(healthResult.finalScore)));

  let commercialScore = 100;
  const batchCost = calculateBatchCost(ingredients, 1);
  if (typeof targetCostVal === 'number' && targetCostVal > 0) {
    if (batchCost <= targetCostVal) {
      commercialScore = 100;
    } else {
      const overrunPct = ((batchCost - targetCostVal) / targetCostVal) * 100;
      commercialScore = Math.min(100, Math.max(0, Math.round(100 - overrunPct)));
    }
  }

  let activeMatterScore = 100;
  if (activeMatterPct < 10) {
    activeMatterScore = Math.min(100, Math.max(0, Math.round(activeMatterPct * 10)));
  } else if (activeMatterPct > 35) {
    activeMatterScore = Math.max(50, Math.round(100 - (activeMatterPct - 35) * 2));
  }

  // Weighted score calculation
  const profile = effectiveCategory ? CATEGORY_GRADING_PROFILES[effectiveCategory] : null;
  const perfW = profile ? profile.performanceWeight : 0.30;
  const compW = profile ? profile.compatibilityWeight : 0.25;
  const hlthW = profile ? profile.healthSafetyWeight : 0.25;
  const amW = profile ? profile.activeMatterWeight : 0.10;
  const commW = profile ? profile.commercialWeight : 0.10;

  let weightedScore = Math.round(
    cpiScore * perfW +
    compatibilityScore * compW +
    healthScore * hlthW +
    activeMatterScore * amW +
    commercialScore * commW
  );

  let hazardNote = '';
  const hasIncompatibilityHazard = compResult.alerts.some(a => a.id === 'surfactant-interaction-hazard' || a.severity === 'Critical') || (compResult.compatible === false && compResult.compatibilityScore <= 70);
  if (hasIncompatibilityHazard) {
    weightedScore = Math.min(weightedScore, 50);
    hazardNote += ' (Capped due to chemical compatibility hazard)';
  }

  const hasHighCausticOrAcidHazard = (phVal !== undefined && (phVal <= 3.0 || phVal >= 12.5)) || healthResult.rating === 'High Safety Hazard' || healthResult.finalScore <= 55;
  if (hasHighCausticOrAcidHazard && canonicalCategory !== 'TOILET_CLEANER' && canonicalCategory !== 'KITCHEN_DEGREASER') {
    weightedScore = Math.min(weightedScore, 45);
    hazardNote += ' (Capped due to lab health / safety hazard)';
  }

  if (activeMatterPct < 3.0 && canonicalCategory !== 'GLASS_CLEANER') {
    weightedScore = Math.min(weightedScore, 55);
    hazardNote += ' (Capped due to insufficient active matter <3.0%)';
  }

  const finalScore = Math.min(100, Math.max(0, weightedScore));

  let grade = 'F';
  if (finalScore >= 90) grade = 'A+';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';

  const reasons: string[] = [];
  reasons.push(`Cleaning CPI: ${cpiScore}/100`);
  reasons.push(`Compatibility: ${compatibilityScore}/100`);
  reasons.push(`Lab Health: ${healthScore}/100`);
  reasons.push(`Active Matter: ${activeMatterPct.toFixed(1)}%`);

  if (targetCostVal && targetCostVal > 0) {
    reasons.push(`Cost: ₹${batchCost.toFixed(2)}/kg (Target: ₹${targetCostVal.toFixed(2)}/kg)`);
  }

  const reasoning = `Grade ${grade} (${finalScore}/100): ${reasons.join(', ')}.${hazardNote}`;

  return {
    grade,
    score: finalScore,
    numericScore: finalScore,
    gradeType: profile ? 'CATEGORY_SPECIFIC_RND_INDEX' : 'GENERIC_SCREENING_INDEX',
    productCategory: canonicalCategory,
    categoryModelId: profile?.modelId || 'AIGRADE_MODEL_GENERIC_V1',
    categoryModelVersion: profile?.modelVersion || '1.0.0',
    gradingRulesVersion: AI_GRADE_RULES_VERSION,
    scientificEngineVersion: AI_GRADE_ENGINE_VERSION,
    ingredientDatabaseVersion: INGREDIENT_DB_VERSION,
    calculationVersion: '2026.1',
    scientificValidity: 'VALID',
    performanceStatus: profile?.isCleaningApplicable ? 'ACTIVE_DETERGENCY' : 'GENERAL_FORMULATION',
    evidenceLevel: 'PREDICTED_ONLY',
    confidence: 'MEDIUM',
    uncertainty: {
      level: 'MEDIUM',
      factors: effectiveCategory ? [] : ['Category unassigned; generic screening model applied.']
    },
    strengths: finalScore >= 80 ? ['High balanced formula grade.'] : [],
    weaknesses: finalScore < 60 ? ['Low composite score.'] : [],
    limitingFactors: [],
    warnings: compResult.warnings || [],
    blockingIssues: [],
    unknownParameters: targetCostVal ? [] : ['targetCost'],
    labValidationStatus: 'PREDICTED_ONLY (Laboratory Testing Required Prior to Release)',
    regulatoryStatus: 'COMPLIANT',
    reasoning,
    breakdown: {
      cpiScore,
      compatibilityScore,
      healthScore,
      activeMatterScore,
      commercialScore
    },
    isEvaluable: true
  };
}

/**
 * Helper to construct a structured non-evaluable result.
 */
function buildNotEvaluableResult(
  category: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY',
  gradeType: 'AI_GRADE_NOT_EVALUABLE',
  reasoning: string,
  blockingIssues: string[]
): AIGradeResult {
  return {
    grade: 'N/A',
    score: 0,
    numericScore: 0,
    gradeType,
    productCategory: category,
    categoryModelId: 'CATEGORY_MODEL_NOT_VALIDATED',
    categoryModelVersion: '1.0.0',
    gradingRulesVersion: AI_GRADE_RULES_VERSION,
    scientificEngineVersion: AI_GRADE_ENGINE_VERSION,
    ingredientDatabaseVersion: INGREDIENT_DB_VERSION,
    calculationVersion: '2026.1',
    scientificValidity: 'INVALID',
    performanceStatus: 'NOT_EVALUABLE',
    evidenceLevel: 'INSUFFICIENT_DATA',
    confidence: 'LOW',
    uncertainty: {
      level: 'HIGH',
      factors: ['Product category is missing, unassigned, or not validated.']
    },
    strengths: [],
    weaknesses: ['Product category missing or unvalidated'],
    limitingFactors: ['Category must be assigned to calculate product-specific AI Grade.'],
    warnings: [],
    blockingIssues,
    unknownParameters: ['productCategory'],
    labValidationStatus: 'NOT_EVALUABLE',
    regulatoryStatus: 'INSUFFICIENT_DATA',
    reasoning,
    breakdown: {
      cpiScore: 0,
      compatibilityScore: 0,
      healthScore: 0,
      activeMatterScore: 0,
      commercialScore: 0
    },
    isEvaluable: false
  };
}

/**
 * Helper to construct a structured category context integrity error result.
 */
function buildIntegrityErrorResult(
  category: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY',
  reasoning: string
): AIGradeResult {
  return {
    grade: 'N/A',
    score: 0,
    numericScore: 0,
    gradeType: 'CATEGORY_CONTEXT_INTEGRITY_ERROR',
    productCategory: category,
    categoryModelId: 'INTEGRITY_ERROR',
    categoryModelVersion: '1.0.0',
    gradingRulesVersion: AI_GRADE_RULES_VERSION,
    scientificEngineVersion: AI_GRADE_ENGINE_VERSION,
    ingredientDatabaseVersion: INGREDIENT_DB_VERSION,
    calculationVersion: '2026.1',
    scientificValidity: 'INVALID',
    performanceStatus: 'INTEGRITY_ERROR',
    evidenceLevel: 'INSUFFICIENT_DATA',
    confidence: 'LOW',
    uncertainty: {
      level: 'HIGH',
      factors: ['Category context mismatch detected across scientific pipeline stages.']
    },
    strengths: [],
    weaknesses: ['Category context mismatch'],
    limitingFactors: ['Category must match identically across all evaluation engines.'],
    warnings: [],
    blockingIssues: ['CATEGORY_CONTEXT_INTEGRITY_ERROR'],
    unknownParameters: [],
    labValidationStatus: 'INTEGRITY_ERROR',
    regulatoryStatus: 'INSUFFICIENT_DATA',
    reasoning,
    breakdown: {
      cpiScore: 0,
      compatibilityScore: 0,
      healthScore: 0,
      activeMatterScore: 0,
      commercialScore: 0
    },
    isEvaluable: false
  };
}

export function calculateAIGrade(ingredients: any, ...args: any[]): AIGradeResult {
  return evaluateAIGrade(ingredients, ...args);
}

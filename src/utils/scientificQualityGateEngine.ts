import { FormulationIngredient } from '../types';
import {
  normalizeProductCategory,
  getProductCategory,
  CANONICAL_PRODUCT_CATEGORY_IDS,
  ProductCategoryId
} from '../domain/productTaxonomy';
import { mapFormulationIngredientsToPHEngineInput } from './pHEngineAdapter';
import { calculatePHAdvanced } from './pHEngine';
import {
  ActiveMatterEngine,
  calculateActiveSurfactants,
  calculateActiveMatter,
  getDefaultActiveMatter
} from './activeMatterEngine';
import {
  calculateWaterHardnessTolerance,
  getProductHardnessPolicy
} from './chelatorEngine';
import { calculateFormulationCompatibility } from './compatibilityEngine';
import { calculateDetailedViscosity, ViscosityReport } from './viscosityEngine';
import { calculateDensity } from './densityEngine';
import { calculateLiquidNVR } from './liquidNvrEngine';
import {
  calculateCleaningPerformance,
  FormulationPerformanceResult,
  PerformanceProvenance
} from './cleaningPerformanceEngine';
import { evaluateSpecifications } from './specificationEngine/specificationEvaluator';
import { getSpecificationTemplateForCategory } from './specificationEngine/specificationTemplates';
import {
  LabMeasurementRecord,
  SpecificationReport
} from './specificationEngine/types';
import {
  evaluateFormulaScientificValidation,
  FormulaValidationReport,
  ScientificValidationState,
  FormulaReadinessLevel
} from './labEvidenceEngine';
import { INGREDIENT_INTELLIGENCE_REGISTRY } from './ingredientIntelligenceEngine';
import {
  generateMasterScientificProvenanceReport,
  computeFormulaFingerprint,
  type MasterScientificProvenanceReport
} from './provenanceEngine';

// =============================================================================
// QUALITY GATE CONTRACT & STATUS TYPES
// =============================================================================

export type ScientificValidityStatus = 'VALID' | 'INVALID' | 'INSUFFICIENT_DATA';
export type QualityGateSpecificationStatus = 'PASS' | 'OUT_OF_SPEC' | 'NOT_DEFINED' | 'INSUFFICIENT_DATA';
export type QualityGateCompatibilityStatus = 'COMPATIBLE' | 'COMPATIBLE_WITH_WARNINGS' | 'INCOMPATIBLE' | 'CRITICAL_HAZARD' | 'INSUFFICIENT_DATA';
export type QualityGatePerformanceStatus = 'MEETS_PREDICTED_CRITERIA' | 'BELOW_PREDICTED_CRITERIA' | 'NOT_APPLICABLE' | 'INSUFFICIENT_DATA';
export type QualityGateEvidenceStatus = 'PREDICTED_ONLY' | 'PARTIALLY_MEASURED' | 'FULLY_LAB_VALIDATED' | 'INSUFFICIENT_DATA';
export type QualityGateLabReadiness =
  | 'READY_FOR_LAB_BENCH'
  | 'BLOCKED_BY_FATAL_INCOMPATIBILITY'
  | 'BLOCKED_BY_SPECIFICATION_FAILURE'
  | 'BLOCKED_BY_SCIENTIFIC_INVALIDITY'
  | 'REQUIRES_INGREDIENT_IDENTITY'
  | 'REQUIRES_SPECIFICATION_TARGETS';

export type FinalFormulaStatus =
  | 'VALID'
  | 'VALID_WITH_WARNINGS'
  | 'OUT_OF_SPEC'
  | 'SCIENTIFICALLY_INVALID'
  | 'INCOMPATIBLE'
  | 'INSUFFICIENT_DATA'
  | 'LAB_VALIDATION_REQUIRED';

export interface QualityGateFinding {
  id: string;
  code: string;
  title: string;
  category: 'VALIDITY' | 'SPECIFICATION' | 'COMPATIBILITY' | 'PERFORMANCE' | 'EVIDENCE' | 'SAFETY';
  severity: 'FATAL' | 'MAJOR' | 'MINOR' | 'INFO';
  message: string;
  recommendation?: string;
  scientificBasis?: string;
}

export interface MasterScientificQualityGateInput {
  formulaId?: string;
  formulaName?: string;
  formulaVersion?: string;
  productCategory?: string;
  subCategory?: string;
  specificationProfileId?: string;
  ingredients: FormulationIngredient[];
  labMeasurements?: LabMeasurementRecord[];
  waterHardnessPpm?: number;
  washVolumeL?: number;
  washDoseGrams?: number;
  batchSizeKg?: number;
  estimatedPH?: number;
  targetCostPerKg?: number;
}

export interface MasterScientificQualityGateReport {
  formulaName: string;
  formulaVersion: string;
  formulaFingerprint: string;
  canonicalCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  productCategoryLabel: string;
  evaluatedAt: string;

  // Scientific Provenance Traceability
  provenanceReport: MasterScientificProvenanceReport;

  // 5 Distinct Status Dimensions
  scientificValidity: ScientificValidityStatus;
  specificationStatus: QualityGateSpecificationStatus;
  compatibilityStatus: QualityGateCompatibilityStatus;
  performanceStatus: QualityGatePerformanceStatus;
  evidenceStatus: QualityGateEvidenceStatus;
  labReadiness: QualityGateLabReadiness;
  validationState: ScientificValidationState;
  readinessLevel: FormulaReadinessLevel;
  validationReport?: FormulaValidationReport;

  // Authoritative Master Final Formula Status
  finalFormulaStatus: FinalFormulaStatus;

  // Categorized Findings
  blockingIssues: QualityGateFinding[];
  majorWarnings: QualityGateFinding[];
  minorWarnings: QualityGateFinding[];

  // Phase 10 Decision Contract Fields
  severity: 'FATAL' | 'MAJOR' | 'MINOR' | 'INFO';
  warnings: QualityGateFinding[];
  recommendations: string[];
  uncertainties: string[];
  requiredLabTests: string[];
  category: string;
  modelVersion: string;
  ingredientKnowledgeVersion: string;
  specificationVersion: string;
  reasoningTrace: string[];

  // Underlying Consumed Authoritative Engine Outputs
  speciationResult: {
    pH: number | null;
    provenance: 'PREDICTED' | 'MEASURED' | 'INSUFFICIENT_DATA';
    isMeasured: boolean;
    confidence: string;
    powderSlurryBasis?: string;
    solverConverged: boolean;
  };
  activeMatterResult: {
    totalSurfactantActivePct: number;
    totalActiveMatterPct: number;
    meetsCategoryMin: boolean | null;
    categoryMinPct: number;
  };
  chelationResult: {
    isSufficient: boolean | null;
    waterHardnessPpm: number | null;
    capacityCaCO3GPer100g: number | null;
    status?: string;
    hardnessProtectionRatio?: number;
    hardnessLoadMg?: number;
    totalSequestrationMg?: number | null;
    isApplicable?: boolean | null;
  };
  compatibilityResult: {
    compatible: boolean;
    score: number | null;
    riskLevel: string;
    alertsCount: number;
  };
  viscosityResult: {
    predictedViscosityCp: number;
    fluidity: string;
    flowMechanism: string;
  };
  performanceResult: {
    cpi: number | null;
    qualitativePower: string;
    provenance: PerformanceProvenance;
    isMeasured: boolean;
  };
  specificationResult?: SpecificationReport;

  // Engine Lineage & Metadata
  engineVersions: {
    qualityGateEngine: '1.0.0';
    pHEngine: '2.0.0';
    activeMatterEngine: '1.0.0';
    compatibilityEngine: '1.0.0';
    performanceEngine: '1.4.0';
    specificationEvaluator: '1.0.0';
  };
}

// =============================================================================
// MASTER SCIENTIFIC QUALITY GATE EVALUATOR
// =============================================================================

export function evaluateScientificQualityGate(
  input: MasterScientificQualityGateInput
): MasterScientificQualityGateReport {
  const formulaName = input.formulaName || 'Unnamed Formula';
  const formulaVersion = input.formulaVersion || 'UNKNOWN_VERSION';
  const rawIngs = Array.isArray(input.ingredients) ? input.ingredients : [];
  const providedLabMeasurements = Array.isArray(input.labMeasurements) ? input.labMeasurements : [];
  // Measurements may influence formula calculations only when both immutable formula identity
  // and exact version match. A name, category, or version-only match is not sufficient.
  const hasExplicitFormulaIdentity = Boolean(
    input.formulaId?.trim() &&
    input.formulaVersion?.trim() &&
    input.formulaVersion !== 'UNKNOWN_VERSION'
  );
  const labMeasurements = hasExplicitFormulaIdentity
    ? providedLabMeasurements.filter(measurement =>
        Boolean(measurement.formulaId) &&
        measurement.formulaId === input.formulaId &&
        measurement.formulaVersion === input.formulaVersion
      )
    : [];
  const hasExplicitWaterHardness = typeof input.waterHardnessPpm === 'number' && Number.isFinite(input.waterHardnessPpm) && input.waterHardnessPpm >= 0;
  const waterHardnessPpm = hasExplicitWaterHardness ? input.waterHardnessPpm! : null;
  const hasExplicitWashScenario =
    typeof input.washVolumeL === 'number' && Number.isFinite(input.washVolumeL) && input.washVolumeL > 0 &&
    typeof input.washDoseGrams === 'number' && Number.isFinite(input.washDoseGrams) && input.washDoseGrams > 0 &&
    typeof input.batchSizeKg === 'number' && Number.isFinite(input.batchSizeKg) && input.batchSizeKg > 0;
  const hardnessScenarioComplete = hasExplicitWaterHardness && hasExplicitWashScenario;

  const blockingIssues: QualityGateFinding[] = [];
  const majorWarnings: QualityGateFinding[] = [];
  const minorWarnings: QualityGateFinding[] = [];

  // ---------------------------------------------------------------------------
  // STEP 1: CATEGORY VALIDATION
  // ---------------------------------------------------------------------------
  const rawCategoryInput = input.productCategory;
  const canonicalCategory = normalizeProductCategory(rawCategoryInput);
  const categoryDef = canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? getProductCategory(canonicalCategory) : null;
  const productCategoryLabel = categoryDef ? categoryDef.label : (rawCategoryInput || 'Unknown Category');

  if (categoryDef && categoryDef.specificationEvidenceStatus !== 'SOURCE_VERIFIED') {
    majorWarnings.push({
      id: 'gate-unverified-category-targets',
      code: 'WARN_UNVERIFIED_CATEGORY_TARGETS',
      title: 'Category Targets Are Unverified Engineering Defaults',
      category: 'SPECIFICATION',
      severity: 'MAJOR',
      message: categoryDef.specificationEvidenceNote || 'Category pH and active-matter targets have no attached, independently reviewed source dossier.',
      recommendation: 'Treat category pH and active-matter targets as screening guidance only until category-specific standards or technical sources are attached and reviewed.'
    });
  }

  let scientificValidity: ScientificValidityStatus = 'VALID';

  if (canonicalCategory === 'UNKNOWN_PRODUCT_CATEGORY') {
    scientificValidity = 'INVALID';
    blockingIssues.push({
      id: 'gate-unknown-category',
      code: 'ERR_UNKNOWN_CATEGORY',
      title: 'Unrecognized Product Category',
      category: 'VALIDITY',
      severity: 'FATAL',
      message: `Product category "${rawCategoryInput ?? 'undefined'}" is not a recognized canonical category. Category specifications and scientific router constraints cannot be applied.`,
      recommendation: `Select one of the 13 canonical categories: ${CANONICAL_PRODUCT_CATEGORY_IDS.join(', ')}.`,
      scientificBasis: 'Deterministic formulation quality gates require mapping to an authoritative category profile.'
    });
  }

  // ---------------------------------------------------------------------------
  // STEP 2: FORMULA COMPOSITION VALIDATION
  // ---------------------------------------------------------------------------
  if (rawIngs.length === 0) {
    scientificValidity = 'INSUFFICIENT_DATA';
    blockingIssues.push({
      id: 'gate-empty-formula',
      code: 'ERR_EMPTY_FORMULA',
      title: 'Empty Formulation Input',
      category: 'VALIDITY',
      severity: 'FATAL',
      message: 'Formulation contains zero raw material components.',
      recommendation: 'Add ingredients to the recipe before running scientific quality evaluation.',
      scientificBasis: 'Chemistry calculations require non-empty ingredient recipes.'
    });
  }

  // Filter out non-numeric or zero percentage ingredients safely
  let totalMassPct = 0;
  let hasInvalidNumber = false;

  for (const [ingredientIndex, ing] of rawIngs.entries()) {
    const name = (ing?.name || '').trim();
    if (!name) {
      blockingIssues.push({
        id: `gate-missing-name-${ingredientIndex}`,
        code: 'ERR_MISSING_INGREDIENT_NAME',
        title: 'Missing Ingredient Name',
        category: 'VALIDITY',
        severity: 'FATAL',
        message: 'Formulation contains an ingredient entry with an empty or missing chemical name.',
        recommendation: 'Provide explicit chemical names for all raw material components.'
      });
      scientificValidity = 'INVALID';
    }

    const rawPct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula;
    const pct = rawPct === undefined || rawPct === null || (typeof rawPct === 'string' && rawPct.trim() === '')
      ? Number.NaN
      : Number(rawPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      hasInvalidNumber = true;
    } else {
      totalMassPct += pct;
    }

    const resolvedActivePurity = ing?.activeMatterPct ?? ing?.activePercent ?? getDefaultActiveMatter(ing);
    const activePurity = resolvedActivePurity === null || resolvedActivePurity === undefined
      ? null
      : Number(resolvedActivePurity);
    const activeResolution = ActiveMatterEngine.resolveIngredientActive(ing);
    const explicitActiveValue = ing?.activeMatterPct ?? ing?.activePercent ?? (ing as any)?.activeMatterPurity ?? (ing as any)?.activePct ?? (ing as any)?.purity;
    if (
      explicitActiveValue !== null &&
      explicitActiveValue !== undefined &&
      activeResolution.conflict &&
      !(ing as any)?.confirmedGradeActiveOverride
    ) {
      blockingIssues.push({
        id: `gate-active-grade-conflict-${name}`,
        code: 'ERR_ACTIVE_MATTER_GRADE_CONFLICT',
        title: `Active Matter Conflicts With Commercial Grade (${name})`,
        category: 'VALIDITY',
        severity: 'FATAL',
        message: activeResolution.conflict.message,
        recommendation: 'Correct the active-matter value to match the named commercial grade, or explicitly confirm a documented grade override before calculation.'
      });
      scientificValidity = 'INVALID';
    }
    if (activePurity === null && activeResolution.isSurfactant) {
      majorWarnings.push({
        id: `gate-active-purity-unavailable-${name}`,
        code: 'WARN_ACTIVE_MATTER_UNAVAILABLE',
        title: `Surfactant Active Matter Unavailable (${name})`,
        category: 'EVIDENCE',
        severity: 'MAJOR',
        message: `Surfactant ingredient '${name}' has no defensible active-matter value. Its contribution remains unclassified and must not be interpreted as 0% or 100% active.`,
        recommendation: 'Enter a supplier COA/verified assay or an explicitly identified commercial grade concentration before relying on active surfactant totals.'
      });
    } else if (activePurity !== null && (!Number.isFinite(activePurity) || activePurity < 0 || activePurity > 100)) {
      blockingIssues.push({
        id: `gate-invalid-purity-${name}`,
        code: 'ERR_INVALID_ACTIVE_PURITY',
        title: `Invalid Active Matter Purity (${name})`,
        category: 'VALIDITY',
        severity: 'FATAL',
        message: `Ingredient '${name}' active matter purity (${activePurity}%) is invalid (must be between 0% and 100%).`,
        recommendation: 'Correct active purity value.'
      });
      scientificValidity = 'INVALID';
    }
  }

  if (hasInvalidNumber) {
    scientificValidity = 'INVALID';
    blockingIssues.push({
      id: 'gate-invalid-number',
      code: 'ERR_INVALID_NUMERIC_INPUT',
      title: 'Invalid Numeric Percentage',
      category: 'VALIDITY',
      severity: 'FATAL',
      message: 'One or more ingredients specify invalid NaN or negative percentage values.',
      recommendation: 'Ensure all ingredient percentages are non-negative numbers.'
    });
  }

  if (rawIngs.length > 0 && Math.abs(totalMassPct - 100.0) > 1.0) {
    scientificValidity = 'INVALID';
    blockingIssues.push({
      id: 'gate-unbalanced-mass',
      code: 'ERR_MASS_BALANCE_UNBALANCED',
      title: 'Unbalanced Mass Balance Total',
      category: 'VALIDITY',
      severity: 'FATAL',
      message: `Formulation mass total is ${totalMassPct.toFixed(2)}%, which deviates from 100.00% mass balance limit by > 1.0%.`,
      recommendation: 'Adjust solvent (water/filler) to bring recipe total to exactly 100.00%.',
      scientificBasis: 'Conservation of mass principle requires formula stoichiometry to equal 100.0%.'
    });
  }

  // ---------------------------------------------------------------------------
  // STEP 3: CONSUME AUTHORITATIVE ENGINE OUTPUTS
  // ---------------------------------------------------------------------------

  // A. PHEngineV2 Output
  // No neutral/default pH is permitted when the composition cannot be evaluated.
  let computedPH: number | null = null;
  let phConfidence = 'Zero Confidence (Not Evaluated)';
  let phSolverConverged = false;
  let phModelValidity: 'HIGH' | 'MODERATE' | 'LOW' | 'OUT_OF_RANGE' | 'UNKNOWN' = 'UNKNOWN';
  let powderSlurryBasis: string | undefined = undefined;

  if (rawIngs.length > 0 && canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY') {
    try {
      const mappedPH = mapFormulationIngredientsToPHEngineInput(rawIngs);
      const phRes = calculatePHAdvanced(mappedPH, 100, { productCategory: canonicalCategory });
      phModelValidity = phRes.modelValidity ?? 'UNKNOWN';
      const pHWithinModelDomain = phModelValidity !== 'OUT_OF_RANGE';
      computedPH = pHWithinModelDomain ? phRes.pH : null;
      phSolverConverged = phRes.solverConverged && pHWithinModelDomain;
      powderSlurryBasis = phRes.details?.slurryBasisNotice || (canonicalCategory === 'LAUNDRY_POWDER' ? '1.0% w/v Slurry Basis' : undefined);

      if (!pHWithinModelDomain) {
        phConfidence = 'OUT_OF_RANGE (Not Eligible for Scientific Gate)';
      } else if (computedPH === null) {
        phConfidence = 'Zero Confidence (pH Not Identifiable / Solver Failed)';
      } else {
        phConfidence = `${phModelValidity} model domain; engine confidence ${phRes.confidence}/100`;
      }
    } catch {
      computedPH = null;
      phSolverConverged = false;
    }
  }

  // Check if measured pH exists in lab measurements
  const measuredPHRecord = labMeasurements.find(m => m.parameterKey === 'ph' || m.parameterKey === 'powderPH');
  const isPHMeasured = Boolean(
    measuredPHRecord &&
    Number.isFinite(measuredPHRecord.value) &&
    measuredPHRecord.value >= 0 &&
    measuredPHRecord.value <= 14
  );
  const finalPH = isPHMeasured ? measuredPHRecord!.value : computedPH;

  if (finalPH === null || !Number.isFinite(finalPH) || finalPH < 0 || finalPH > 14 || (!isPHMeasured && (!phSolverConverged || phModelValidity === 'OUT_OF_RANGE'))) {
    if (scientificValidity !== 'INVALID') scientificValidity = 'INSUFFICIENT_DATA';
    blockingIssues.push({
      id: 'gate-ph-unavailable',
      code: 'ERR_PH_SOLVER_FAILED',
      title: 'Equilibrium pH Unavailable',
      category: 'VALIDITY',
      severity: 'FATAL',
      message: 'The chemical equilibrium solver failed to converge. Thermodynamic pH and ionic strength could not be determined for this composition.',
      recommendation: 'Check for extreme acid/base imbalances or ingredients outside of supported thermodynamic ranges.',
      scientificBasis: 'A converged speciation solution is required to authorize the chemical validity of an aqueous formulation.'
    });
  }

  // B. Active Matter Output
  const activeMatterAudit = ActiveMatterEngine.calculateActiveMatterReport(rawIngs);
  const missingSurfactantAssays = activeMatterAudit.contributions.filter(
    contribution => contribution.isSurfactant && contribution.activeMatterPct === null
  );
  const hasMissingSurfactantAssay = missingSurfactantAssays.length > 0;
  const totalSurfactantActivePct = hasMissingSurfactantAssay
    ? Number.NaN
    : calculateActiveSurfactants(rawIngs);
  const totalActiveMatterPct = activeMatterAudit.activeMatterStatus === 'COMPLETE'
    ? calculateActiveMatter(rawIngs)
    : Number.NaN;

  if (!activeMatterAudit.isFullyAuthoritative) {
    majorWarnings.push({
      id: 'gate-active-matter-provenance',
      code: 'WARN_ACTIVE_MATTER_NOT_FULLY_AUTHORITATIVE',
      title: 'Active Matter Inputs Are Not Fully Source-Verified',
      category: 'VALIDITY',
      severity: 'MAJOR',
      message: 'At least one active-matter contribution uses a reference default, name-derived grade, or user override without fully authoritative source verification. The calculated value is screening input, not a verified supplier assay.',
      recommendation: 'Attach and independently review the exact supplier COA/assay for each commercial grade. Keep the result screening-only until grade identity and active concentration are verified.'
    });
  }

  if (activeMatterAudit.activeMatterStatus !== 'COMPLETE') {
    if (scientificValidity !== 'INVALID') scientificValidity = 'INSUFFICIENT_DATA';
    const missingAssayNames = activeMatterAudit.contributions
      .filter(item => item.activeMatterPct === null)
      .map(item => item.name);
    blockingIssues.push({
      id: 'gate-active-matter-unavailable',
      code: hasMissingSurfactantAssay ? 'ERR_SURFACTANT_ACTIVE_MATTER_UNKNOWN' : 'ERR_INGREDIENT_ACTIVE_MATTER_UNKNOWN',
      title: hasMissingSurfactantAssay ? 'Surfactant Active Matter Is Unknown' : 'Ingredient Active Matter Is Incomplete',
      category: 'VALIDITY',
      severity: 'FATAL',
      message: `Active matter is unavailable for ${missingAssayNames.join(', ')}. Unknown values are not zero and cannot contribute to a complete total active-matter result.`,
      recommendation: 'Supply grade-specific COA/assay-backed active-matter values or an authoritative master-library record for every ingredient requiring an active-matter value. Otherwise retain INSUFFICIENT_DATA.'
    });
  }

  const specTemplate = canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' 
    ? getSpecificationTemplateForCategory(input.specificationProfileId || input.subCategory || canonicalCategory, formulaName)
    : null;
  const specActiveParam = specTemplate?.parameters?.find(p => p.parameterKey === 'activeMatter');
  const categoryMinActivePct = specActiveParam?.min !== undefined 
    ? specActiveParam.min 
    : (categoryDef ? categoryDef.activeMatterMinPct : 0);
  const meetsCategoryMinActive = totalSurfactantActivePct >= categoryMinActivePct;

  if (rawIngs.length > 0 && categoryDef && !meetsCategoryMinActive && canonicalCategory !== 'FABRIC_SOFTENER') {
    majorWarnings.push({
      id: 'gate-low-active-matter',
      code: 'WARN_LOW_ACTIVE_MATTER',
      title: 'Active Surfactant Below Category Minimum',
      category: 'SPECIFICATION',
      severity: 'MAJOR',
      message: `Total active surfactant (${totalSurfactantActivePct.toFixed(1)}%) is below the minimum threshold (${categoryMinActivePct}%) for ${productCategoryLabel}.`,
      recommendation: 'Increase active surfactant loading to ensure adequate soil detergency.'
    });
  }

  // C. Hard Water & Chelation Output (Product-Aware)
  const productHardnessPolicy = getProductHardnessPolicy(input.specificationProfileId || input.subCategory || canonicalCategory);
  const hardnessTolerance = hardnessScenarioComplete
    ? calculateWaterHardnessTolerance(
        rawIngs,
        waterHardnessPpm as number,
        input.washVolumeL,
        input.washDoseGrams,
        input.batchSizeKg,
        input.specificationProfileId || input.subCategory || canonicalCategory
      )
    : null;

  if (!hardnessScenarioComplete && productHardnessPolicy.requiresHardnessControl) {
    majorWarnings.push({
      id: 'gate-assumed-water-hardness',
      code: 'WARN_ASSUMED_WATER_HARDNESS',
      title: 'Water Hardness Is an Assumed Screening Scenario',
      category: 'SPECIFICATION',
      severity: 'MAJOR',
      message: 'Chelation screening was not evaluated because explicit wash-water hardness, wash volume, detergent dose, and batch size were not all supplied. No default water-hardness or dose scenario was substituted.',
      recommendation: 'Enter measured water hardness (mg/L as CaCO3), wash volume (L), detergent dose (g), and batch size (kg) before interpreting the chelation result.'
    });
  }

  if (rawIngs.length > 0 && hardnessTolerance?.isApplicable && (waterHardnessPpm ?? 0) > 0 && (hardnessTolerance.status === 'INSUFFICIENT' || hardnessTolerance.status === 'WARNING')) {
    minorWarnings.push({
      id: 'gate-chelation-deficit',
      code: 'WARN_CHELATION_DEFICIT',
      title: 'Hard Water Chelation Deficit',
      category: 'SPECIFICATION',
      severity: 'MINOR',
      message: `Predicted chelation capacity (${Math.round(hardnessTolerance.totalSequestrationMg)} mg CaCO₃ in ${hardnessTolerance.washDoseGrams}g dose) is ${hardnessTolerance.status.toLowerCase()} for ${waterHardnessPpm} ppm hard water load (${hardnessTolerance.hardnessLoadMg} mg demanded in ${hardnessTolerance.washVolumeL}L wash). Unbound Ca²⁺/Mg²⁺ ions may reduce anionic surfactant efficacy.`,
      recommendation: `Incorporate additional ${hardnessTolerance.additionalCitrateRequiredPct}% Sodium Citrate or ${hardnessTolerance.additionalGLDA47RequiredPct}% GLDA 47%.`
    });
  }

  // D. Compatibility Engine Output
  const compatibilityPHAvailable = Number.isFinite(finalPH) && (isPHMeasured || phSolverConverged);
  // Evaluate pH-independent interaction rules even when the pH solver is unavailable.
  // Ionic charge clashes can still be detected from ingredient identity and dosage.
  const compRes = calculateFormulationCompatibility(
    rawIngs,
    compatibilityPHAvailable ? finalPH : undefined,
    canonicalCategory
  );
  const criticalCompatibilityAlerts = compRes.alerts.filter(
    alert => alert.severity === 'Critical' || alert.severity === 'High'
  );

  let compatibilityStatus: QualityGateCompatibilityStatus = 'INSUFFICIENT_DATA';
  if (criticalCompatibilityAlerts.length > 0) {
    compatibilityStatus = criticalCompatibilityAlerts.some(a => a.severity === 'Critical')
      ? 'INCOMPATIBLE'
      : 'CRITICAL_HAZARD';
    for (const alert of criticalCompatibilityAlerts) {
      blockingIssues.push({
        id: `gate-compat-${alert.id}`,
        code: 'ERR_CHEMICAL_INCOMPATIBILITY',
        title: alert.title,
        category: 'COMPATIBILITY',
        severity: 'FATAL',
        message: alert.message,
        recommendation: alert.recommendation,
        scientificBasis: alert.message
      });
    }
  } else if (compatibilityPHAvailable && compRes.compatible) {
    compatibilityStatus = compRes.warnings.length > 0 || compRes.alerts.length > 0
      ? 'COMPATIBLE_WITH_WARNINGS'
      : 'COMPATIBLE';
    for (const alert of compRes.alerts) {
      if (alert.severity === 'Medium' || alert.severity === 'Low') {
        minorWarnings.push({
          id: `gate-compat-${alert.id}`,
          code: 'WARN_CHEMICAL_INTERACTION',
          title: alert.title,
          category: 'COMPATIBILITY',
          severity: 'MINOR',
          message: alert.message,
          recommendation: alert.recommendation
        });
      }
    }
  }

  // Fabric Softener Specific Anionic Contamination Check
  if (canonicalCategory === 'FABRIC_SOFTENER') {
    const hasAnionicInSoftener = rawIngs.some(ing => {
      const name = (ing?.name || '').toLowerCase();
      const cat = (ing?.category || ing?.role || '').toLowerCase();
      const pct = Number(ing?.percentage ?? ing?.percent ?? 0);
      return pct > 0 && (cat.includes('anionic') || name.includes('labsa') || name.includes('sles') || name.includes('sls'));
    });

    if (hasAnionicInSoftener) {
      compatibilityStatus = 'INCOMPATIBLE';
      blockingIssues.push({
        id: 'gate-softener-anionic-clash',
        code: 'ERR_FABRIC_SOFTENER_ANIONIC_CONTAMINATION',
        title: 'Anionic Surfactant Contamination in Fabric Softener',
        category: 'COMPATIBILITY',
        severity: 'FATAL',
        message: 'Cationic fabric softeners are strictly incompatible with anionic surfactants. Co-formulation causes rapid electrostatic precipitation and complete loss of softening function.',
        recommendation: 'Remove all anionic surfactants (LABSA/SLES/SLS) from fabric softener recipes.'
      });
    }
  }

  // Dishwash Automatic High Foam Check
  if (canonicalCategory === 'DISHWASH_AUTOMATIC') {
    const highFoamSurfactant = rawIngs.some(ing => {
      const name = (ing?.name || '').toLowerCase();
      const cat = (ing?.category || ing?.role || '').toLowerCase();
      const pct = Number(ing?.percentage ?? ing?.percent ?? 0);
      return pct > 0.5 && (cat.includes('anionic') || cat.includes('amphoteric') || name.includes('labsa') || name.includes('sles') || name.includes('capb') || name.includes('betaine'));
    });

    if (highFoamSurfactant) {
      majorWarnings.push({
        id: 'gate-autodish-high-foam',
        code: 'WARN_HIGH_FOAM_MACHINE_DISHWASH',
        title: 'High Foam Risk in Machine Dishwasher',
        category: 'SAFETY',
        severity: 'MAJOR',
        message: 'High-foaming anionic or amphoteric surfactants present in automatic dishwasher formulation. Risk of foam overflow and pump motor cavitation.',
        recommendation: 'Replace high-foaming surfactants with low-foaming nonionic EO/PO block copolymers or APG.'
      });
    }
  }

  // E. Rheology / Viscosity Output
  const viscosityRes: ViscosityReport = calculateDetailedViscosity(rawIngs, { temperatureC: 25 });

  // F. Performance Engine Output
  const performanceRes: FormulationPerformanceResult = calculateCleaningPerformance(
    rawIngs,
    finalPH,
    canonicalCategory,
    {
      measuredSoilRemovalPct: labMeasurements.find(m => m.parameterKey === 'cleaningScore')?.value,
      measuredGreaseRemovalPct: labMeasurements.find(m => m.parameterKey === 'greaseCutting')?.value
    },
    {
      waterHardnessPpm: waterHardnessPpm ?? undefined,
      washVolumeL: input.washVolumeL,
      washDoseGrams: input.washDoseGrams,
      batchSizeKg: input.batchSizeKg,
      compatibilityStatus,
      hasCriticalCompatibilityAlert: compatibilityStatus === 'INCOMPATIBLE' || compatibilityStatus === 'CRITICAL_HAZARD'
    }
  );

  const measuredCleaningScoreRecord = labMeasurements.find(m => m.parameterKey === 'cleaningScore');
  const hasMeasuredCleaningScore = Boolean(
    measuredCleaningScoreRecord &&
    Number.isFinite(measuredCleaningScoreRecord.value) &&
    measuredCleaningScoreRecord.value >= 0 &&
    measuredCleaningScoreRecord.value <= 100
  );
  const effectiveCpi = hasMeasuredCleaningScore ? measuredCleaningScoreRecord!.value : performanceRes.cpi;

  let performanceStatus: QualityGatePerformanceStatus = 'MEETS_PREDICTED_CRITERIA';
  if (!performanceRes.isCleaningApplicable) {
    performanceStatus = 'NOT_APPLICABLE';
  } else if (
    rawIngs.length === 0 ||
    performanceRes.provenance === 'INSUFFICIENT_DATA' ||
    !Number.isFinite(effectiveCpi)
  ) {
    performanceStatus = 'INSUFFICIENT_DATA';
  } else if (effectiveCpi < 60) {
    performanceStatus = 'BELOW_PREDICTED_CRITERIA';
    majorWarnings.push({
      id: 'gate-low-cpi',
      code: 'WARN_LOW_PREDICTED_PERFORMANCE',
      title: hasMeasuredCleaningScore ? 'Low Measured Cleaning Performance Index' : 'Low Predicted Cleaning Performance Index',
      category: 'PERFORMANCE',
      severity: 'MAJOR',
      message: hasMeasuredCleaningScore
        ? `Measured Cleaning Performance Index (${effectiveCpi}/100) is below standard benchmark (>=60).`
        : `Predicted Cleaning Performance Index (${effectiveCpi}/100) is below standard benchmark (>=60).`,
      recommendation: 'Review active surfactant ratio, builder loading, or enzyme package.'
    });
  }

  // ---------------------------------------------------------------------------
  // STEP 4: SPECIFICATION COMPLIANCE EVALUATION
  // ---------------------------------------------------------------------------
  let specificationStatus: QualityGateSpecificationStatus = 'PASS';
  let specReport: SpecificationReport | undefined = undefined;

  if (canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' && specTemplate) {
    const densityRes = calculateDensity(rawIngs, (input.batchSizeKg ?? Number.NaN) * 1000);
    const nvrRes = calculateLiquidNVR(rawIngs, input.batchSizeKg ?? Number.NaN);

    specReport = evaluateSpecifications({
      formulaName,
      formulaVersion,
      productCategory: canonicalCategory,
      parameters: specTemplate.parameters,
      labMeasurements,
      liquidResults: {
        pH: finalPH,
        activeSurfactants: totalSurfactantActivePct,
        totalPercentage: Number(totalMassPct.toFixed(2)),
        density: densityRes.densityGPerCm3 ?? densityRes.specificGravity,
        viscosity: viscosityRes.viscosityCp,
        liquidNVR: nvrRes.nvrPercentage
      }
    });

    if (specReport.verdict.criticalOutCount > 0) {
      specificationStatus = 'OUT_OF_SPEC';
      for (const item of specReport.verdict.outOfSpecParameters) {
        if (item.criticality === 'CRITICAL') {
          blockingIssues.push({
            id: `gate-spec-out-${item.parameterKey}`,
            code: 'ERR_SPECIFICATION_OUT_OF_BOUNDS',
            title: `${item.parameterName} Out of Specification`,
            category: 'SPECIFICATION',
            severity: 'FATAL',
            message: item.statusMessage,
            recommendation: `Adjust formula composition to bring ${item.parameterName} (${item.currentValueDisplay}) within range (${item.min ?? '-'} to ${item.max ?? '-'}).`
          });
        }
      }
    } else if (specReport.verdict.majorOutCount > 0) {
      specificationStatus = 'OUT_OF_SPEC';
      for (const item of specReport.verdict.outOfSpecParameters) {
        if (item.criticality === 'MAJOR') {
          majorWarnings.push({
            id: `gate-spec-out-${item.parameterKey}`,
            code: 'WARN_SPECIFICATION_MAJOR_DEVIATION',
            title: `${item.parameterName} Major Specification Deviation`,
            category: 'SPECIFICATION',
            severity: 'MAJOR',
            message: item.statusMessage,
            recommendation: `Adjust formula parameters to achieve target ${item.target ?? 'specification'}.`
          });
        }
      }
    } else if (specReport.verdict.criticalMissingCount > 0) {
      // An unrelated measurement must not satisfy a missing critical test.
      // The evaluator has already matched measurements to formula identity/version and parameter.
      specificationStatus = 'INSUFFICIENT_DATA';
    }
  } else {
    specificationStatus = 'NOT_DEFINED';
  }

  // ---------------------------------------------------------------------------
  // STEP 5: EVIDENCE & VALIDATION EVALUATION (PHASE 5 SSOT)
  // ---------------------------------------------------------------------------
  const validationReport = evaluateFormulaScientificValidation({
    // Evidence matching must use caller-supplied identity only; display names are not formula IDs.
    formulaId: input.formulaId,
    // Keep an absent target version unknown; the display/report fallback must not authorize evidence comparisons.
    formulaVersion: input.formulaVersion,
    productCategory: canonicalCategory,
    isComputationallyValid: scientificValidity === 'VALID' && compatibilityStatus === 'COMPATIBLE',
    predictedMetrics: {
      pH: finalPH,
      activeMatterPct: totalActiveMatterPct,
      activeSurfactantsPct: totalSurfactantActivePct,
      viscosityCps: viscosityRes.viscosityCp ?? viscosityRes.estViscosityCps,
      cpi: Number.isFinite(performanceRes.cpi) ? performanceRes.cpi : null,
      waterHardnessTolerancePpm: hardnessTolerance?.maxSupportedPpm
    },
    labEvidenceRecords: (labMeasurements as any) || [],
    qualityGateFindings: {
      blockingIssuesCount: blockingIssues.length,
      majorWarningsCount: majorWarnings.length
    }
  });

  const validationState = validationReport.validationState;
  const readinessLevel = validationReport.readinessLevel;

  if (validationState === 'LAB_FAILED') {
    blockingIssues.push({
      id: 'gate-laboratory-test-failed',
      code: 'ERR_LABORATORY_ACCEPTANCE_FAILED',
      title: 'Laboratory Acceptance Test Failed',
      category: 'SPECIFICATION',
      severity: 'FATAL',
      message: 'At least one identity-matched, version-matched laboratory measurement failed its recorded acceptance criteria.',
      recommendation: 'Investigate the failed test, correct the formulation or process, and repeat the relevant laboratory test. Do not approve this formula.'
    });
  }

  let evidenceStatus: QualityGateEvidenceStatus = 'PREDICTED_ONLY';
  if (validationState === 'LAB_VALIDATED') {
    evidenceStatus = 'FULLY_LAB_VALIDATED';
  } else if (validationState === 'LAB_TESTED' || validationState === 'LAB_FAILED') {
    evidenceStatus = 'PARTIALLY_MEASURED';
  } else {
    evidenceStatus = 'PREDICTED_ONLY';
  }

  // ---------------------------------------------------------------------------
  // STEP 6: FINAL AUTHORITATIVE MASTER FORMULA STATUS AGGREGATION & PHASE 10 DECISION CONTRACT
  // ---------------------------------------------------------------------------
  let finalFormulaStatus: FinalFormulaStatus = 'VALID';
  let labReadiness: QualityGateLabReadiness = 'READY_FOR_LAB_BENCH';

  const uncertainties: string[] = [];
  const requiredLabTests: string[] = [];
  if (!hardnessScenarioComplete && productHardnessPolicy.requiresHardnessControl) {
    uncertainties.push('[MISSING_SCREENING_INPUT] Water-hardness protection was not evaluated because measured/user-supplied hardness and a complete wash scenario were not provided.');
  }
  if (categoryDef && categoryDef.specificationEvidenceStatus !== 'SOURCE_VERIFIED') {
    uncertainties.push('[UNVERIFIED_CATEGORY_TARGETS] Category pH and active-matter targets are engineering screening targets pending source-level validation.');
  }

  // Propagate uncertainty from missing data or estimates
  if (rawIngs.length === 0) {
    uncertainties.push('Formulation is empty; no ingredient profile available.');
  } else {
    rawIngs.forEach(ing => {
      const name = (ing?.name || '').trim();
      if (!name) return;
      const lowerName = name.toLowerCase();
      const registryMatch = Object.keys(INGREDIENT_INTELLIGENCE_REGISTRY).find(
        key => lowerName.includes(key)
      );

      if (!registryMatch) {
        uncertainties.push(`[ENGINEERING_HEURISTIC] Ingredient '${name}' properties are estimated based on generic assumptions.`);
      } else {
        const def = INGREDIENT_INTELLIGENCE_REGISTRY[registryMatch];
        const gradeKey = Object.keys(def.grades)[0];
        const grade = gradeKey ? def.grades[gradeKey] : null;

        if (!grade) {
          uncertainties.push(`[ENGINEERING_HEURISTIC] No commercial grade specified for '${name}'. Using defaults.`);
        }
      }

      // Check missing parameters specifically
      const rawPct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? (ing as any)?.rawPercent;
      const pct = rawPct === undefined || rawPct === null || (typeof rawPct === 'string' && rawPct.trim() === '')
        ? Number.NaN
        : Number(rawPct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        uncertainties.push(`Ingredient '${name}' is missing or has an invalid concentration percentage.`);
      }
      const rawActivePct = ing?.activeMatterPct ?? ing?.activePercent ?? ing?.activeMatterPurity ?? (ing as any)?.activeMatter;
      const activePct = rawActivePct === undefined || rawActivePct === null || (typeof rawActivePct === 'string' && rawActivePct.trim() === '')
        ? Number.NaN
        : Number(rawActivePct);
      if (!Number.isFinite(activePct) || activePct < 0 || activePct > 100) {
        uncertainties.push(`Ingredient '${name}' is missing or has an invalid active-matter percentage.`);
      }
    });
  }

  // Determine required laboratory tests based on predictive outputs and category constraints
  if (canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY') {
    // Viscosity
    const viscosityMeasured = labMeasurements.some(m => m.parameterKey === 'viscosity');
    if (!viscosityMeasured) {
      requiredLabTests.push('Perform Brookfield spindle viscosity measurement across NaCl increments to confirm viscosity salt-curve behavior.');
    }

    // Preservation
    const preservationMeasured = labMeasurements.some(m => m.parameterKey === 'microbialCount' || m.parameterKey === 'preservationChallenge');
    if (!preservationMeasured) {
      requiredLabTests.push('Microbial challenge testing (AET/PET) required to validate preservative shelf life.');
    }

    // Performance
    if (categoryDef?.primaryFunction.toLowerCase().includes('cleaning') || performanceRes.isCleaningApplicable) {
      const cleaningMeasured = labMeasurements.some(m => m.parameterKey === 'cleaningScore' || m.parameterKey === 'greaseCutting');
      if (!cleaningMeasured) {
        requiredLabTests.push('ASTM D4265 Terg-O-Tometer soil-swatch testing required to validate predicted cleaning index.');
      }
    }

    // Mildness/Irritation (For Hand Wash)
    if (canonicalCategory === 'HAND_WASH') {
      const irritationMeasured = labMeasurements.some(m => m.parameterKey === 'mildness' || m.parameterKey === 'dermalIrritation');
      if (!irritationMeasured) {
        requiredLabTests.push('Dermatological patch testing required for clinical safety and mildness validation.');
      }
    }

    // Dynamic Foam Stability (For Automatic Dishwash / Low foam)
    if (canonicalCategory === 'DISHWASH_AUTOMATIC') {
      const foamMeasured = labMeasurements.some(m => m.parameterKey === 'foamHeight' || m.parameterKey === 'sudsStability');
      if (!foamMeasured) {
        requiredLabTests.push('Dynamic suds height and pump motor cavitation testing required to confirm low foam profile under high shear.');
      }
    }

    // Carbonate Dissolution (For Toilet/Bathroom cleaners)
    if (canonicalCategory === 'TOILET_CLEANER' || canonicalCategory === 'BATHROOM_CLEANER') {
      const dissolutionMeasured = labMeasurements.some(m => m.parameterKey === 'dissolutionRate' || m.parameterKey === 'descalingEfficacy');
      if (!dissolutionMeasured) {
        requiredLabTests.push('Carbonate dissolution weight-loss validation required to confirm descaling efficacy.');
      }
    }
  }

  // Precedence Status Logic:
  if (blockingIssues.length > 0) {
    const hasCompatFatal = blockingIssues.some(i => i.category === 'COMPATIBILITY');
    const hasSpecFatal = blockingIssues.some(i => i.category === 'SPECIFICATION');

    const hasMeasuredLabFailure =
      validationState === 'LAB_FAILED' ||
      blockingIssues.some(i => i.code === 'ERR_LABORATORY_ACCEPTANCE_FAILED');
    const hasCompositionFatal = blockingIssues.some(i =>
      i.code === 'ERR_MASS_BALANCE_UNBALANCED' || i.code === 'ERR_INVALID_NUMERIC_INPUT'
    );
    // A confirmed, identity-matched laboratory failure must never be hidden by
    // a separate missing/invalid computational input.
    if (hasMeasuredLabFailure || specificationStatus === 'OUT_OF_SPEC') {
      finalFormulaStatus = 'OUT_OF_SPEC';
      labReadiness = 'BLOCKED_BY_SPECIFICATION_FAILURE';
    } else if (hasCompositionFatal || scientificValidity === 'INVALID') {
      finalFormulaStatus = 'SCIENTIFICALLY_INVALID';
      labReadiness = 'BLOCKED_BY_SCIENTIFIC_INVALIDITY';
    } else if (hasCompatFatal) {
      // A known fatal ingredient interaction remains actionable even when a
      // separate pH/property calculation is unavailable.
      finalFormulaStatus = 'INCOMPATIBLE';
      labReadiness = 'BLOCKED_BY_FATAL_INCOMPATIBILITY';
    } else if (scientificValidity === 'INSUFFICIENT_DATA' || rawIngs.length === 0) {
      // Missing composition/chemistry is not an out-of-spec result: there is
      // insufficient evidence to evaluate the specification at all.
      finalFormulaStatus = 'INSUFFICIENT_DATA';
      labReadiness = rawIngs.length === 0 ? 'REQUIRES_INGREDIENT_IDENTITY' : 'BLOCKED_BY_SCIENTIFIC_INVALIDITY';
    } else if (hasSpecFatal) {
      finalFormulaStatus = 'OUT_OF_SPEC';
      labReadiness = 'BLOCKED_BY_SPECIFICATION_FAILURE';
    } else {
      finalFormulaStatus = 'SCIENTIFICALLY_INVALID';
      labReadiness = 'BLOCKED_BY_SCIENTIFIC_INVALIDITY';
    }
  } else if (evidenceStatus !== 'FULLY_LAB_VALIDATED') {
    // Computational predictions or partial measurements cannot authorize a VALID result.
    finalFormulaStatus = 'LAB_VALIDATION_REQUIRED';
    labReadiness = 'READY_FOR_LAB_BENCH';
  } else if (majorWarnings.length > 0) {
    finalFormulaStatus = 'VALID_WITH_WARNINGS';
    labReadiness = 'READY_FOR_LAB_BENCH';
  } else {
    finalFormulaStatus = 'VALID';
    labReadiness = 'READY_FOR_LAB_BENCH';
  }

  const combinedWarnings = [...majorWarnings, ...minorWarnings];
  const severity: 'FATAL' | 'MAJOR' | 'MINOR' | 'INFO' = 
    blockingIssues.length > 0 ? 'FATAL' :
    majorWarnings.length > 0 ? 'MAJOR' :
    minorWarnings.length > 0 ? 'MINOR' : 'INFO';

  const recommendations = blockingIssues.concat(majorWarnings, minorWarnings)
    .map(w => w.recommendation)
    .filter(Boolean) as string[];

  const reasoningTrace = blockingIssues.concat(majorWarnings, minorWarnings)
    .map(w => w.code || w.id);

  const formulaId = input.formulaId || 'UNKNOWN_FORMULA_ID';
  const formulaFingerprint = computeFormulaFingerprint(
    formulaId,
    formulaVersion,
    rawIngs,
    canonicalCategory
  );

  const provenanceReport = generateMasterScientificProvenanceReport({
    formulaId: input.formulaId,
    formulaVersion: input.formulaVersion,
    productCategory: canonicalCategory,
    ingredients: rawIngs,
    speciationResult: { pH: finalPH, isMeasured: isPHMeasured, confidence: phConfidence },
    activeMatterResult: {
      totalActiveMatterPct: Number.isFinite(totalActiveMatterPct) ? totalActiveMatterPct : null,
      totalSurfactantActivePct: Number.isFinite(totalSurfactantActivePct) ? totalSurfactantActivePct : null
    },
    chelationResult: {
      capacityCaCO3GPer100g: hardnessTolerance ? hardnessTolerance.totalSequestrationMg / 1000 : null,
      isSufficient: hardnessTolerance
        ? (hardnessTolerance.status === 'PASS' || hardnessTolerance.status === 'NOT_APPLICABLE')
        : null
    },
    compatibilityResult: {
      compatible: compRes.compatible,
      score: Number.isFinite(compRes.compatibilityScore) ? compRes.compatibilityScore : null
    },
    performanceResult: { cpi: performanceRes.cpi, isMeasured: performanceRes.isMeasured },
    labEvidenceReport: validationReport ? {
      validationState: validationReport.validationState,
      isLabValidated: validationReport.isLabValidated,
      completedTests: validationReport.completedTests
    } : undefined,
    qualityGateStatus: { finalFormulaStatus, scientificValidity }
  });

  return {
    formulaName,
    formulaVersion,
    formulaFingerprint,
    provenanceReport,
    canonicalCategory,
    productCategoryLabel,
    evaluatedAt: new Date().toISOString(),

    scientificValidity,
    specificationStatus,
    compatibilityStatus,
    performanceStatus,
    evidenceStatus,
    labReadiness,
    validationState,
    readinessLevel,
    validationReport,

    finalFormulaStatus,

    blockingIssues,
    majorWarnings,
    minorWarnings,

    // Phase 10 Decision Contract Fields
    severity,
    warnings: combinedWarnings,
    recommendations,
    uncertainties,
    requiredLabTests,
    category: canonicalCategory,
    modelVersion: '1.0.0',
    ingredientKnowledgeVersion: '1.0.0',
    specificationVersion: '1.0.0',
    reasoningTrace,

    speciationResult: {
      pH: finalPH,
      provenance: isPHMeasured ? 'MEASURED' : (Number.isFinite(finalPH) ? 'PREDICTED' : 'INSUFFICIENT_DATA'),
      isMeasured: isPHMeasured,
      confidence: phConfidence,
      powderSlurryBasis,
      solverConverged: phSolverConverged
    },
    activeMatterResult: {
      totalSurfactantActivePct,
      totalActiveMatterPct,
      meetsCategoryMin: Number.isFinite(totalSurfactantActivePct) ? meetsCategoryMinActive : null,
      categoryMinPct: categoryMinActivePct
    },
    chelationResult: {
      isSufficient: hardnessTolerance
        ? (hardnessTolerance.status === 'PASS' || hardnessTolerance.status === 'NOT_APPLICABLE')
        : null,
      waterHardnessPpm,
      capacityCaCO3GPer100g: hardnessTolerance ? hardnessTolerance.totalSequestrationMg / 1000 : null,
      status: hardnessTolerance?.status ?? (productHardnessPolicy.requiresHardnessControl ? 'NOT_EVALUATED' : 'NOT_APPLICABLE'),
      hardnessProtectionRatio: hardnessTolerance?.hardnessProtectionRatio,
      hardnessLoadMg: hardnessTolerance?.hardnessLoadMg,
      totalSequestrationMg: hardnessTolerance?.totalSequestrationMg,
      isApplicable: hardnessTolerance?.isApplicable ?? productHardnessPolicy.requiresHardnessControl
    },
    compatibilityResult: {
      compatible: compRes.compatible,
      score: compRes.compatibilityScore,
      riskLevel: compRes.riskLevel || 'UNKNOWN',
      alertsCount: compRes.alerts.length
    },
    viscosityResult: {
      predictedViscosityCp: Number.isFinite(viscosityRes.viscosityCp) ? viscosityRes.viscosityCp : null,
      fluidity: viscosityRes.isFluid ? 'Fluid' : 'Non-Fluid / Paste',
      flowMechanism: viscosityRes.mechanism
    },
    performanceResult: {
      cpi: performanceRes.cpi,
      qualitativePower: performanceRes.cleaningPower,
      provenance: performanceRes.provenance,
      isMeasured: performanceRes.isMeasured
    },
    specificationResult: specReport,

    engineVersions: {
      qualityGateEngine: '1.0.0',
      pHEngine: '2.0.0',
      activeMatterEngine: '1.0.0',
      compatibilityEngine: '1.0.0',
      performanceEngine: '1.4.0',
      specificationEvaluator: '1.0.0'
    }
  };
}

export const evaluateMasterScientificQualityGate = evaluateScientificQualityGate;


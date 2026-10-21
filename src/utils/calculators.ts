import { FormulationIngredient } from '../types';
import { resolveEng002PureComponent, type Eng002PureComponentReference, type ActiveMatterInputSource } from './eng002InputProvenance';
import { getProductCategory } from '../domain/productTaxonomy';
import { PURE_SURFACTANT_CMC_REFERENCES, PureSurfactantCmcReference, OPEN_BENCHMARK_IDEAL_MIXING_BIAS } from '../data/experimentalReferenceData';
import { calculatePHAdvanced, calculateNeutralization as calcNeutAuthoritative } from './pHEngine';
import { resolveScientificAcidBaseProfile, calculateReactiveEquivalents } from '../domain/ph/acidBaseDataModel';
import { mapFormulationIngredientsToPHEngineInput } from './pHEngineAdapter';
import { calculateBlendedHLB as calcBlendedHLBAuthoritative, calculateHLB as calcHLBAuthoritative, evaluateAuthoritativeHLB } from './hlbEngine';
import { 
  ActiveMatterEngine, 
  calculateActiveMatter as calcActiveMatterAuthoritative,
  calculateActiveSurfactants as calcActiveSurfactantsAuthoritative,
  calculateRawSurfactants as calcRawSurfactantsAuthoritative,
  getDefaultActiveMatter as getDefaultActiveMatterAuthoritative,
  evaluateAuthoritativeActiveMatter
} from './activeMatterEngine';
import {
  ViscosityEngine,
  calculateDetailedViscosity as calcViscosityAuthoritative,
  calculateSaltCurve as calcSaltCurveAuthoritative,
  type ViscosityReport,
  type SaltCurvePoint,
  type SaltCurveAnalysis
} from './viscosityEngine';

export interface HLBSurfactant {
  name: string;
  hlb: number;
  proportion: number;
}

export interface ActiveMatterIngredient {
  name: string;
  percentageInFormula: number;
  activeMatterPurity: number;
}

// Import newly modularized domain engines
import { calculateFormulationCompatibility, evaluateFormulationStability } from './compatibilityEngine';
import { 
  calculateCleaningPerformance, 
  calculateCPI, 
  getCategoryPerformanceKPIs,
  type FormulationPerformanceResult,
  type CategoryKPI,
  type PerformanceLabMeasurements,
  type PerformanceProvenance
} from './cleaningPerformanceEngine';
import { calculateLabHealthScore, type LabHealthResult } from './labHealthEngine';
import { evaluateAIGrade, type AIGradeResult, type AIGradeBreakdown } from './gradeEngine';
import { 
  evaluateScientificQualityGate, 
  type MasterScientificQualityGateInput, 
  type MasterScientificQualityGateReport,
  type FinalFormulaStatus,
  type ScientificValidityStatus,
  type QualityGateSpecificationStatus,
  type QualityGateCompatibilityStatus,
  type QualityGatePerformanceStatus,
  type QualityGateEvidenceStatus,
  type QualityGateLabReadiness
} from './scientificQualityGateEngine';
import { calculateDensity, calculateTotalSolids, getStandardComponentDensity, type DensityCalculationResult } from './densityEngine';
import {
  generateMasterScientificProvenanceReport,
  computeFormulaFingerprint,
  checkResultTraceability,
  type ProvenanceState,
  type ScientificDimensionKey,
  type ScientificDimensionProvenance,
  type TraceabilityChain,
  type MasterScientificProvenanceReport
} from './provenanceEngine';
import {
  evaluateFormulaScientificValidation,
  validateMeasurementRecord,
  analyzeLabReplicates,
  checkMeasurementComparability,
  calculatePredictionError,
  evaluateCategoryModelValidation,
  proposeCalibrationCandidates,
  CATEGORY_EVIDENCE_MATRIX,
  type DetailedLabEvidenceRecord,
  type TestConditions,
  type ReplicateAnalysisResult,
  type ComparabilityCheckResult,
  type ErrorAnalysisResult,
  type CategoryModelValidationSummary,
  type CalibrationCandidateProposal
} from './labEvidenceEngine';
import {
  evaluateIngredientDataQuality,
  traceCompatibilityReasoning,
  analyzeDependencyPropagation,
  evaluateIngredientSubstitution,
  globalIngredientGovernance,
  INGREDIENT_INTELLIGENCE_REGISTRY,
  INGREDIENT_INTERACTION_RULES,
  type IngredientProvenance,
  type ApplicabilityStatus,
  type SubstitutionTier,
  type IngredientQualityStatus,
  type IngredientChargeProfile,
  type IngredientGradeProfile,
  type IngredientDefinition,
  type InteractionRule,
  type TraceableCompatibilityFinding,
  type DependencyPropagationReport,
  type SubstitutionRecommendation,
  type GovernedIngredientKnowledgeSnapshot
} from './ingredientIntelligenceEngine';
import {
  ScientificModelGovernanceRegistry,
  globalGovernanceRegistry,
  INITIAL_GOVERNED_PARAMETERS,
  GOLDEN_FORMULA_SET,
  calculateModelChangeImpact,
  evaluateHistoricalFormulaReproducibility,
  type ParameterClassification,
  type ParameterScope,
  type GovernanceStatus,
  type GovernedScientificParameter,
  type CalibrationApprovalRecord,
  type ScientificModelVersion,
  type ChangeImpactAnalysisResult,
  type ModelRollbackResult
} from './scientificGovernanceEngine';
import { 
  calculateWaterHardnessTolerance, 
  getChelatorBindingCapacity, 
  calculateWaterHardnessLoad, 
  calculateFormulationChelationCapacity, 
  evaluateFormulationGreenChelators, 
  calculateGreenChelators,
  calculateDynamicChelatorRequirement,
  getProductHardnessPolicy,
  MW_CACO3,
  AUTHORITATIVE_CHELATOR_DATABASE,
  WATER_HARDNESS_SCENARIOS,
  PRODUCT_HARDNESS_POLICIES,
  type WaterHardnessToleranceResult,
  type GreenChelatorResult,
  type ChelatorDetail,
  type GreenChelatorInput,
  type DynamicChelatorRequirement,
  type ChelatorSpecies,
  type FormulationChelationCapacityResult,
  type FormulationChelationIngredientDetail,
  type WaterHardnessScenario,
  type WaterHardnessScenarioId,
  type ProductHardnessPolicy,
  type HardnessProtectionStatus,
  type ChelationMechanism
} from './chelatorEngine';
import { calculateDilution, convertUnit, type DilutionResult } from './dilutionEngine';
import { calculateLiquidNVR, type NVRResult } from './liquidNvrEngine';
import {
  FormulaScientificOrchestrator,
  ORCHESTRATOR_VERSION,
  type CanonicalFormulaInput,
  type CanonicalFormulaEvaluationResult,
  type HLBResultOutput,
  type EvaluationStage,
  type StageDiagnostic
} from './orchestrator';
import { evaluateRegulatoryCompliance, type RegulatoryEvaluationReport, type RegulatoryContext } from './regulatoryEngine';

// Export everything required by the public API
export { 
  FormulaScientificOrchestrator,
  ORCHESTRATOR_VERSION,
  evaluateRegulatoryCompliance,
  generateMasterScientificProvenanceReport,
  computeFormulaFingerprint,
  checkResultTraceability,
  evaluateFormulaScientificValidation,
  evaluateAuthoritativeHLB, 
  evaluateAuthoritativeActiveMatter, 
  ActiveMatterEngine, 
  ViscosityEngine,
  calculateFormulationCompatibility,
  evaluateFormulationStability,
  calculateCleaningPerformance,
  calculateCPI,
  getCategoryPerformanceKPIs,
  calculateLabHealthScore,
  evaluateAIGrade,
  evaluateScientificQualityGate,
  calculateDensity,
  calculateTotalSolids,
  getStandardComponentDensity,
  calculateWaterHardnessTolerance,
  getChelatorBindingCapacity,
  calculateWaterHardnessLoad,
  calculateFormulationChelationCapacity,
  evaluateFormulationGreenChelators,
  calculateGreenChelators,
  calculateDynamicChelatorRequirement,
  getProductHardnessPolicy,
  MW_CACO3,
  AUTHORITATIVE_CHELATOR_DATABASE,
  WATER_HARDNESS_SCENARIOS,
  PRODUCT_HARDNESS_POLICIES,
  calculateDilution,
  convertUnit,
  calculateLiquidNVR
};

export type {
  ProvenanceState,
  ScientificDimensionKey,
  ScientificDimensionProvenance,
  TraceabilityChain,
  MasterScientificProvenanceReport,
  ViscosityReport,
  SaltCurvePoint,
  SaltCurveAnalysis,
  LabHealthResult,
  AIGradeResult,
  AIGradeBreakdown,
  MasterScientificQualityGateInput,
  MasterScientificQualityGateReport,
  FinalFormulaStatus,
  ScientificValidityStatus,
  QualityGateSpecificationStatus,
  QualityGateCompatibilityStatus,
  QualityGatePerformanceStatus,
  QualityGateEvidenceStatus,
  QualityGateLabReadiness,
  DensityCalculationResult,
  WaterHardnessToleranceResult,
  GreenChelatorResult,
  ChelatorDetail,
  GreenChelatorInput,
  DynamicChelatorRequirement,
  ChelatorSpecies,
  FormulationChelationCapacityResult,
  FormulationChelationIngredientDetail,
  WaterHardnessScenario,
  WaterHardnessScenarioId,
  ProductHardnessPolicy,
  HardnessProtectionStatus,
  ChelationMechanism,
  DilutionResult,
  FormulationPerformanceResult,
  CategoryKPI,
  PerformanceLabMeasurements,
  PerformanceProvenance,
  NVRResult,
  CanonicalFormulaInput,
  CanonicalFormulaEvaluationResult,
  HLBResultOutput,
  EvaluationStage,
  StageDiagnostic,
  RegulatoryEvaluationReport,
  RegulatoryContext
};

export function calculateSaltCurve(
  ingredients: FormulationIngredient[] = [],
  options?: { minSalt?: number; maxSalt?: number; steps?: number; targetPH?: number }
): SaltCurveAnalysis {
  return calcSaltCurveAuthoritative(ingredients, options);
}

export function calculateBlendedHLB(ingredients: FormulationIngredient[]): number {
  return calcBlendedHLBAuthoritative(ingredients);
}

export function calculateActiveMatter(ingredients: FormulationIngredient[]): number {
  return calcActiveMatterAuthoritative(ingredients);
}

export function calculateActiveSurfactants(ingredients: FormulationIngredient[]): number {
  return calcActiveSurfactantsAuthoritative(ingredients);
}

export function calculateRawSurfactants(ingredients: FormulationIngredient[]): number {
  return calcRawSurfactantsAuthoritative(ingredients);
}

export function calculateDetailedViscosity(ingredients: FormulationIngredient[], options?: any): ViscosityReport {
  return calcViscosityAuthoritative(ingredients, options);
}

export function calculateAIGrade(ingredients: any, ...args: any[]): AIGradeResult {
  return evaluateAIGrade(ingredients, ...args);
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateBatchCost(ingredients: FormulationIngredient[], batchSizeKg: number = 100): number {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const costPerKg = safeIngs.reduce((acc, ing) => {
    const pct = Number((ing as any)?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0);
    const rawPrice = (ing as any)?.costPerKg ?? (ing as any)?.rawMaterialCostPerKg ?? (ing as any)?.cost ?? (ing as any)?.unitCost;
    const price = (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)))
      ? Math.max(0, Number(rawPrice))
      : 0;
    return acc + (pct / 100) * price;
  }, 0);
  return roundCurrency(costPerKg * batchSizeKg);
}

export function calculateNeutralization(input: any) {
  return calcNeutAuthoritative(input);
}

export function calculateHLB(input: any) {
  return calcHLBAuthoritative(input);
}

/**
 * @deprecated Legacy pH calculation wrapper. Production components must use calculatePHAdvanced() and mapFormulationIngredientsToPHEngineInput() directly.
 */
export function calculateEstimatedPH(a: any, b?: any, c?: any): number {
  const ingredients: FormulationIngredient[] = Array.isArray(a) ? a : (Array.isArray(c) ? c : (Array.isArray(b) ? b : []));
  const mapped = mapFormulationIngredientsToPHEngineInput(ingredients);
  const adv = calculatePHAdvanced(mapped);
  return adv.pH;
}

/**
 * @deprecated Compatibility wrapper delegating directly to authoritative pHEngine.
 */
export function estimateSimplePH(a: any, b?: any, c?: any): number {
  return calculateEstimatedPH(a, b, c);
}

export function getIngredientEcoMetrics(nameOrIng: string | FormulationIngredient) {
  const name = typeof nameOrIng === 'string' ? nameOrIng : (nameOrIng?.name || '');
  const n = (name || "").toLowerCase();
  const isWater = n.includes('water') || n.includes('aqua');
  const isMineral = n.includes('salt') || n.includes('sodium chloride') || n.includes('silicate');
  const isPlant = n.includes('citric') || n.includes('glycerin') || n.includes('coco') || n.includes('apg') || n.includes('glucoside') || n.includes('glucapon') || n.includes('panthenol') || n.includes('essential oil') || n.includes('perfume') || n.includes('fragrance');

  return {
    biodegradabilityPct: isWater || isMineral ? 100 : (isPlant ? 98 : 85),
    biodegradability: isWater || isMineral ? 100 : (isPlant ? 98 : 85),
    renewability: isPlant ? 95 : 40,
    plantBasedPct: isPlant ? 100 : 30,
    toxicity: isWater ? 'None' : (isPlant ? 'Very Low' : 'Low-Moderate'),
    isMineralOrWater: isWater || isMineral
  };
}

export function calculateFormulationEcoMetrics(ingredients: FormulationIngredient[], ..._args: any[]) {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const complexEco = calculateComplexEcoScore(safeIngs);
  
  // Calculate dynamic average biodegradability based on ingredient concentrations
  let totalMass = 0;
  let weightedBiodeg = 0;
  
  safeIngs.forEach(ing => {
    const pct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0;
    if (pct > 0) {
      const eco = getIngredientEcoMetrics(ing);
      weightedBiodeg += pct * eco.biodegradabilityPct;
      totalMass += pct;
    }
  });
  
  const avgBiodeg = totalMass > 0 ? Math.round(weightedBiodeg / totalMass) : 100;
  
  return {
    biodegradabilityIndex: avgBiodeg,
    renewableCarbonIndex: complexEco.plantBasedOverallPct,
    aquaticToxicityScore: complexEco.score >= 80 ? 'Low Risk' : (complexEco.score >= 50 ? 'Moderate Risk' : 'High Risk'),
    ecoScore: complexEco.score,
    biodegradabilityPct: avgBiodeg,
    plantBasedPct: complexEco.plantBasedOverallPct
  };
}

export function calculateCorrectedEcoRating(ingredients: FormulationIngredient[]) {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  return calculateComplexEcoScore(safeIngs).score;
}

export function getPreservativeWarning(ingredients: FormulationIngredient[], _targetPH?: number): { message: string } | string | null {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const hasPreservative = safeIngs.some(i => (i?.category || i?.role || '').toLowerCase().includes('preservative') || (i?.name || "").toLowerCase().includes('preservative') || (i?.name || "").toLowerCase().includes('isothiazolinone'));
  const waterPercent = safeIngs.filter(i => (i?.name || "").toLowerCase().includes('water')).reduce((a, b) => a + (b?.percentage || b?.percent || 0), 0);

  if (waterPercent > 20 && !hasPreservative) {
    const msg = 'High water activity (>20% water) requires a preservative system to prevent microbial growth.';
    return { message: msg };
  }
  return null;
}

export function getTargetPHRange(category: string, _role?: string): { min: number; max: number; label: string } {
  const def = getProductCategory(category);
  if (def) {
    return {
      min: def.targetPHMin,
      max: def.targetPHMax,
      label: `${def.label} Target (${def.targetPHMin} - ${def.targetPHMax})`
    };
  }
  return { min: 6.0, max: 9.0, label: 'General Detergent Range (6.0 - 9.0)' };
}

const VALID_CANONICAL_CATEGORIES = new Set([
  'Anionic Surfactant',
  'Nonionic Surfactant',
  'Non-ionic Surfactant',
  'Amphoteric Surfactant',
  'Cationic Surfactant',
  'Surfactant',
  'Builder',
  'Chelator',
  'Builder / Chelator',
  'Enzyme',
  'Solvent',
  'Preservative',
  'Fragrance',
  'pH Adjuster',
  'Polymer',
  'Thickener',
  'Viscosity Modifier',
  'Hydrotrope',
  'Bleach',
  'Colorant',
  'Dye',
  'Additive',
  'Filler'
]);

const ROLE_LIKE_CATEGORY_TERMS = [
  'primary surfactant',
  'secondary surfactant',
  'co-surfactant',
  'foam booster',
  'water softener',
  'active ingredient',
  'main active'
];

export function deriveCanonicalCategory(rawCat: string, rawRole: string, rawFunc: string, rawName: string): string {
  const catTrimmed = String(rawCat || '').trim();
  const roleTrimmed = String(rawRole || '').trim();
  const funcTrimmed = String(rawFunc || '').trim();
  const nameTrimmed = String(rawName || '').trim();

  const catLower = catTrimmed.toLowerCase();

  // 1. If explicit valid category is present and not a role alias, preserve it
  if (catTrimmed && !ROLE_LIKE_CATEGORY_TERMS.some(term => catLower === term)) {
    for (const validCat of VALID_CANONICAL_CATEGORIES) {
      if (validCat.toLowerCase() === catLower) {
        return validCat;
      }
    }
    if (catTrimmed.length > 0) {
      return catTrimmed;
    }
  }

  // 2. Derive canonical category from role, function, and name
  const combined = `${catTrimmed} ${roleTrimmed} ${funcTrimmed} ${nameTrimmed}`.toLowerCase();

  // Surfactants
  if (combined.includes('anionic')) return 'Anionic Surfactant';
  if (combined.includes('nonionic') || combined.includes('non-ionic') || combined.includes('ethoxylate') || combined.includes('lae') || combined.includes('apg') || combined.includes('glucoside')) return 'Nonionic Surfactant';
  if (combined.includes('amphoteric') || combined.includes('betaine') || combined.includes('capb') || combined.includes('amine oxide')) return 'Amphoteric Surfactant';
  if (combined.includes('cationic') || combined.includes('quat') || combined.includes('quaternary')) return 'Cationic Surfactant';
  if (
    combined.includes('surfactant') ||
    combined.includes('primary surfactant') ||
    combined.includes('secondary surfactant') ||
    combined.includes('co-surfactant') ||
    combined.includes('foam booster') ||
    combined.includes('labsa') ||
    combined.includes('sles') ||
    combined.includes('sls')
  ) {
    return 'Surfactant';
  }

  // Builders & Chelators
  if (combined.includes('chelator') || combined.includes('sequestrant') || combined.includes('sequestering') || combined.includes('glda') || combined.includes('edta') || combined.includes('mgda') || combined.includes('dtpa') || combined.includes('citrate')) {
    return 'Chelator';
  }
  if (combined.includes('builder') || combined.includes('water softener') || combined.includes('zeolite') || combined.includes('silicate') || combined.includes('carbonate') || combined.includes('stpp') || combined.includes('tripolyphosphate')) {
    return 'Builder';
  }

  // Enzymes
  if (combined.includes('enzyme') || combined.includes('protease') || combined.includes('amylase') || combined.includes('lipase') || combined.includes('cellulase') || combined.includes('mannanase')) {
    return 'Enzyme';
  }

  // Solvents
  if (combined.includes('solvent') || combined.includes('water') || combined.includes('aqua') || combined.includes('deionized') || combined.includes('carrier') || combined.includes('glycol') || combined.includes('alcohol')) {
    return 'Solvent';
  }

  // Preservatives
  if (combined.includes('preservative') || combined.includes('biocide') || combined.includes('antimicrobial') || combined.includes('isothiazolinone') || combined.includes('phenoxyethanol') || combined.includes('paraben')) {
    return 'Preservative';
  }

  // Fragrances
  if (combined.includes('fragrance') || combined.includes('perfume') || combined.includes('essential oil') || combined.includes('scent')) {
    return 'Fragrance';
  }

  // pH Adjusters
  if (combined.includes('ph adjuster') || combined.includes('acidifier') || combined.includes('alkali') || combined.includes('neutralizer') || combined.includes('naoh') || combined.includes('acid')) {
    return 'pH Adjuster';
  }

  // Thickeners & Polymers
  if (combined.includes('thickener') || combined.includes('viscosity') || combined.includes('rheology') || combined.includes('xanthan') || combined.includes('cmc') || combined.includes('carbomer')) {
    return 'Thickener';
  }
  if (combined.includes('polymer') || combined.includes('dispersant') || combined.includes('anti-redeposition')) {
    return 'Polymer';
  }

  // Hydrotropes
  if (combined.includes('hydrotrope') || combined.includes('sxs') || combined.includes('xylene') || combined.includes('coumene')) {
    return 'Hydrotrope';
  }

  // Fillers
  if (combined.includes('filler') || combined.includes('sodium sulfate')) {
    return 'Filler';
  }

  if (catTrimmed) return catTrimmed;
  if (roleTrimmed) return roleTrimmed;
  if (funcTrimmed) return funcTrimmed;

  return 'Additive';
}

export function normalizeIngredientTaxonomy(ingredient: any): {
  category: string;
  role: string;
  function: string;
  canonicalCategory: string;
} {
  if (!ingredient || typeof ingredient !== 'object') {
    return {
      category: 'Additive',
      role: '',
      function: '',
      canonicalCategory: 'Additive'
    };
  }

  const rawCat = String(ingredient?.category || '').trim();
  const rawRole = String(ingredient?.role || '').trim();
  const rawFunc = String(ingredient?.function || '').trim();
  const rawName = String(ingredient?.name || '').trim();

  const canonicalCategory = deriveCanonicalCategory(rawCat, rawRole, rawFunc, rawName);

  return {
    category: canonicalCategory,
    role: rawRole,
    function: rawFunc,
    canonicalCategory
  };
}

export function getCanonicalCategory(ingredient: any): string {
  if (typeof ingredient === 'string') {
    return deriveCanonicalCategory('', '', '', ingredient);
  }
  return normalizeIngredientTaxonomy(ingredient).category;
}

export function getAuditedIngredientCategory(nameOrIng: string | any, role?: string, category?: string): string {
  if (typeof nameOrIng === 'object' && nameOrIng !== null) {
    return normalizeIngredientTaxonomy(nameOrIng).category;
  }
  return normalizeIngredientTaxonomy({ name: nameOrIng, role, category }).category;
}

export function getDefaultActiveMatter(nameOrIng: string | FormulationIngredient): number {
  return getDefaultActiveMatterAuthoritative(nameOrIng);
}

export function getInciName(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes('labsa')) return 'Dodecylbenzene Sulfonic Acid';
  if (n.includes('sles')) return 'Sodium Laureth Sulfate';
  if (n.includes('capb')) return 'Cocamidopropyl Betaine';
  if (n.includes('naoh')) return 'Sodium Hydroxide';
  if (n.includes('water')) return 'Aqua';
  return name;
}

export function generateDynamicMixingInstructions(_a: any, ..._args: any[]): string[] {
  return [
    'Add water to vessel.',
    'Add primary surfactant under slow paddle agitation.',
    'Neutralize pH to target range.',
    'Incorporate secondary surfactants and builders.',
    'Adjust viscosity and add fragrance/preservative.'
  ];
}

export function scaleFormula(ingredients: FormulationIngredient[], batchSizeKg: number, targetBatchKg?: number) {
  const target = targetBatchKg || batchSizeKg || 100;
  return ingredients.map(i => {
    const pct = i.percentage ?? i.percent ?? i.percentageInFormula ?? 0;
    const scaledKg = (pct / 100) * target;
    const cost = (typeof i.costPerKg === 'number' && !isNaN(i.costPerKg) && i.costPerKg >= 0)
      ? Number((i.costPerKg * scaledKg).toFixed(2))
      : null;
    return {
      ...i,
      scaledKg,
      scaledWeight: scaledKg,
      convertedWeight: scaledKg,
      costContribution: cost
    };
  });
}

export interface SurfactantCmcEntry {
  cmcMolar: number; // in mM
  cmcPpm: number; // mg/L, assuming dilute aqueous density
  type: 'anionic' | 'nonionic' | 'amphoteric' | 'cationic';
  standardMw: number; // g/mol
  referenceEvidence?: PureSurfactantCmcReference;
  dataProvenance?: 'SOURCE_BACKED' | 'HEURISTIC_SCREENING';
}

function getLegacyIngredientCmcData(name: string): (SurfactantCmcEntry & { matchedKey: string }) | null {
  const n = (name || '').toLowerCase();
  if (n.includes('labsa') || n.includes('acid slurry') || n.includes('sulfonic acid') || n.includes('linear alkylbenzene')) {
    return { cmcMolar: 1.2, cmcPpm: 384, type: 'anionic', standardMw: 320, matchedKey: 'LABSA' };
  }
  if (n.includes('sles') || n.includes('lauryl ether sulfate') || n.includes('sodium laureth sulfate') || n.includes('sodium lauryl ether')) {
    return { cmcMolar: 0.3, cmcPpm: 114, type: 'anionic', standardMw: 380, matchedKey: 'SLES' };
  }
  if (n.includes('sls') || (n.includes('lauryl sulfate') && !n.includes('ether')) || n.includes('sodium dodecyl sulfate')) {
    const referenceEvidence = PURE_SURFACTANT_CMC_REFERENCES.SLS;
    const cmcMolar = referenceEvidence.valueMolar * 1000;
    const standardMw = 288.3; // NIST table molecular weight for compound 1
    return {
      cmcMolar,
      cmcPpm: Number((cmcMolar * standardMw).toFixed(1)),
      type: 'anionic',
      standardMw,
      matchedKey: 'SLS',
      referenceEvidence
    };
  }
  if (n.includes('aos') || n.includes('olefin sulfonate')) {
    return { cmcMolar: 0.6, cmcPpm: 182, type: 'anionic', standardMw: 304, matchedKey: 'AOS' };
  }
  if (n.includes('capb') || n.includes('betaine') || n.includes('cocamidopropyl')) {
    return { cmcMolar: 0.09, cmcPpm: 31, type: 'amphoteric', standardMw: 342, matchedKey: 'CAPB' };
  }
  if (n.includes('lae-9') || n.includes('alcohol ethoxylate') || n.includes('lae') || n.includes('ethoxylated alcohol') || n.includes('lutensol') || n.includes('c12-14') || n.includes('c12-15')) {
    return { cmcMolar: 0.05, cmcPpm: 35, type: 'nonionic', standardMw: 580, matchedKey: 'Alcohol Ethoxylate (LAE-9)' };
  }
  if (n.includes('coco glucoside') || (n.includes('apg') && !n.includes('lauryl'))) {
    return { cmcMolar: 0.04, cmcPpm: 18, type: 'nonionic', standardMw: 420, matchedKey: 'Coco Glucoside (APG)' };
  }
  if (n.includes('lauryl glucoside')) {
    return { cmcMolar: 0.03, cmcPpm: 15, type: 'nonionic', standardMw: 450, matchedKey: 'Lauryl Glucoside' };
  }
  if (n.includes('esterquat') || n.includes('dhtdmac') || n.includes('dialkyl ester')) {
    return { cmcMolar: 0.01, cmcPpm: 6, type: 'cationic', standardMw: 650, matchedKey: 'Esterquat' };
  }
  if (n.includes('bkc') || n.includes('benzalkonium') || n.includes('quaternary ammonium')) {
    return { cmcMolar: 4.5, cmcPpm: 1600, type: 'cationic', standardMw: 354, matchedKey: 'BKC' };
  }
  if (n.includes('cde') || n.includes('cocamide dea') || n.includes('coco diethanolamide')) {
    return { cmcMolar: 0.08, cmcPpm: 24, type: 'nonionic', standardMw: 287, matchedKey: 'Cocamide DEA' };
  }
  if (n.includes('tween 20') || n.includes('polysorbate 20')) {
    return { cmcMolar: 0.06, cmcPpm: 24, type: 'nonionic', standardMw: 1228, matchedKey: 'Polysorbate 20' };
  }
  if (n.includes('tween 80') || n.includes('polysorbate 80')) {
    return { cmcMolar: 0.05, cmcPpm: 22, type: 'nonionic', standardMw: 1310, matchedKey: 'Polysorbate 80' };
  }
  if (n.includes('span 80') || n.includes('sorbitan oleate')) {
    return { cmcMolar: 0.03, cmcPpm: 13, type: 'nonionic', standardMw: 428, matchedKey: 'Span 80' };
  }
  if (n.includes('cocamidopropylamine oxide') || n.includes('cao')) {
    // Unsourced legacy default retained for amidopropyl amine oxide; no curated open reference row yet.
    return { cmcMolar: 0.20, cmcPpm: 46, type: 'amphoteric', standardMw: 230, matchedKey: 'Amine Oxide' };
  }
  if (n.includes('amine oxide') || n.includes('lauramine oxide') || n.includes('dodecylamine oxide') || n.includes('ddao')) {
    const referenceEvidence = PURE_SURFACTANT_CMC_REFERENCES.AMINE_OXIDE_C12;
    const cmcMolar = referenceEvidence.valueMolar * 1000;
    const standardMw = 229.4; // C14H31NO, dimethyldodecylamine oxide
    return {
      cmcMolar,
      cmcPpm: Number((cmcMolar * standardMw).toFixed(1)),
      type: 'amphoteric',
      standardMw,
      matchedKey: 'Amine Oxide (C12, NIST-sourced)',
      referenceEvidence
    };
  }
  return null;
}

/**
 * Legacy name lookup retained for compatibility and descriptive reference comparisons.
 * Values without a curated experimental record are explicitly heuristic and are never
 * admitted to the application-facing Clint prediction gate below.
 */
export function getIngredientCmcData(name: string): (SurfactantCmcEntry & { matchedKey: string }) | null {
  const entry = getLegacyIngredientCmcData(name);
  if (!entry) return null;
  return {
    ...entry,
    dataProvenance: entry.referenceEvidence ? 'SOURCE_BACKED' : 'HEURISTIC_SCREENING'
  };
}

export interface MixedCmcResult {
  available: true;
  eligibilityStatus: 'FULLY_SUPPORTED' | 'PARTIALLY_SUPPORTED';
  eligibilityReasons: string[];

  molar: number; // in mM
  ppm: number;
  idealMolar: number;
  idealPpm: number;
  modelType: string;
  classification: string;
  hasSynergyPair: boolean;
  hasElectrolyteScreening: boolean;
  components: Array<{ name: string; canonicalChemicalKey: string; contributingIngredientIds: string[]; activeFraction: number; activeMassPct: number; moleFraction: number; molecularWeightGPerMol: number; cmcMolar: number; cmcPpm: number; type: string; activeMatterInputSource: ActiveMatterInputSource; referenceEvidence: PureSurfactantCmcReference }>;
  evidenceRefs: string[];
  /** Observed ideal-rule bias for this charge-pair class in the open P2SURF binary-mixture benchmark; informational only. */
  openBenchmarkNonIdeality?: string;
  confidence: 'Higher Confidence' | 'Moderate Confidence' | 'Lower Confidence';
  limitation: string;
  labValidationGuidance: string;
}

export interface MixedCmcUnavailableResult {
  available: false;
  eligibilityStatus: 'INSUFFICIENT_INPUTS';
  eligibilityReasons: string[];
  components: [];
  modelType: 'Ideal Mixed Pseudophase (Clint Model)';
  classification: 'UNAVAILABLE';
}

export type MixedCmcCalculationResult = MixedCmcResult | MixedCmcUnavailableResult;

/**
 * Clint ideal mixed-micelle rule on a surfactant mole-fraction basis:
 * 1 / CMC_mix = sum(alpha_i / CMC_i). Units of CMC are preserved.
 * Benchmarked against open binary-mixture data in
 * evidence_vault/open_reference_benchmarks/cmc_mixed (see scripts/open-reference-benchmark.ts).
 */
export const CMC_MOLE_FRACTION_SUM_TOLERANCE = 0.00101;

export interface ClintComponentInput {
  moleFraction: number;
  cmc: number;
  cmcUnit?: 'mM' | 'M';
}

/**
 * Clint ideal mixed-micelle rule. CMC inputs may be supplied in M or mM and are
 * normalized to mM. Fractions must sum to 1 within the documented 0.00101 tolerance.
 */
export function idealMixedCmcFromMoleFractions(components: ClintComponentInput[]): number {
  if (!Array.isArray(components) || components.length === 0) {
    throw new RangeError('At least one component is required for a Clint calculation.');
  }
  for (const [index, component] of components.entries()) {
    if (!Number.isFinite(component.moleFraction) || component.moleFraction < 0 || component.moleFraction > 1) {
      throw new RangeError(`Component ${index + 1} has an invalid mole fraction.`);
    }
    if (!Number.isFinite(component.cmc) || component.cmc <= 0) {
      throw new RangeError(`Component ${index + 1} has a missing, non-finite, or non-positive pure CMC.`);
    }
    if (component.cmcUnit !== undefined && component.cmcUnit !== 'M' && component.cmcUnit !== 'mM') {
      throw new RangeError(`Component ${index + 1} has an unsupported CMC unit.`);
    }
  }
  const total = components.reduce((sum, component) => sum + component.moleFraction, 0);
  if (total <= 0 || Math.abs(total - 1) > CMC_MOLE_FRACTION_SUM_TOLERANCE) {
    throw new RangeError(`Mole fractions must sum to 1 within ±${CMC_MOLE_FRACTION_SUM_TOLERANCE}; received ${total}.`);
  }
  const inverse = components.reduce((sum, component) => {
    const cmcMmolL = component.cmcUnit === 'M' ? component.cmc * 1000 : component.cmc;
    return sum + (component.moleFraction / total) / cmcMmolL;
  }, 0);
  if (!Number.isFinite(inverse) || inverse <= 0) throw new RangeError('Clint inverse CMC sum is invalid.');
  return 1 / inverse;
}

function describeOpenBenchmarkNonIdeality(types: string[]): string | undefined {
  const charged = (t: string) => (t === 'amphoteric' ? 'zwitterionic' : t);
  const unique = Array.from(new Set(types.map(charged))).sort();
  if (unique.length < 2) return undefined;
  const notes: string[] = [];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const key = `${unique[i]}-${unique[j]}`;
      const entry = OPEN_BENCHMARK_IDEAL_MIXING_BIAS[key];
      if (entry) notes.push(`${key}: ideal rule overestimated measured mixed CMC by median ${entry.medianLogBias.toFixed(2)} log10 units (~${Math.pow(10, entry.medianLogBias).toFixed(1)}x, n=${entry.points} points / ${entry.systems} systems)`);
    }
  }
  return notes.length ? `Open P2SURF binary-mixture benchmark (literature data, MIT-licensed release): ${notes.join('; ')}. Treat the ideal value as an upper bound for these pair classes.` : undefined;
}

export function calculateMixedCMC(ingredients: FormulationIngredient[]): MixedCmcCalculationResult {
  const unavailable = (eligibilityReasons: string[]): MixedCmcUnavailableResult => ({
    available: false,
    eligibilityStatus: 'INSUFFICIENT_INPUTS',
    eligibilityReasons: Array.from(new Set(eligibilityReasons)),
    components: [],
    modelType: 'Ideal Mixed Pseudophase (Clint Model)',
    classification: 'UNAVAILABLE'
  });
  if (!Array.isArray(ingredients)) return unavailable(['Formula ingredients are missing or not an array.']);

  type Resolved = {
    reference: Eng002PureComponentReference;
    name: string;
    id: string;
    rawPct: number;
    activeMatterPct: number;
    activeMassPct: number;
    activeMatterInputSource: ActiveMatterInputSource;
    activeMatterEvidenceId?: string;
    activeMatterEvidenceUrl?: string;
  };
  const resolved: Resolved[] = [];
  const reasons: string[] = [];
  let hasAnionic = false, hasAmphoteric = false, hasNonionic = false, hasCationic = false, hasElectrolyte = false;

  for (const ingredient of ingredients) {
    const name = String(ingredient?.name ?? '').trim();
    const category = String(ingredient?.category ?? '');
    const role = String(ingredient?.role ?? ingredient?.function ?? '');
    const { isSurfactant } = ActiveMatterEngine.classifySurfactantCharge(category, role, name);
    const rawPctValue = ingredient?.percentage ?? ingredient?.percent ?? ingredient?.percentageInFormula;
    const rawPct = rawPctValue === undefined || rawPctValue === null || rawPctValue === '' ? NaN : Number(rawPctValue);

    if (!isSurfactant) {
      if (!Number.isFinite(rawPct) || rawPct < 0 || rawPct > 100) {
        if (rawPctValue !== undefined && rawPctValue !== null && rawPctValue !== '') {
          reasons.push(`${name || 'Unnamed ingredient'} has invalid formula mass percentage ${String(rawPctValue)}; expected 0–100% w/w.`);
        }
      }
      const n = name.toLowerCase();
      if ((n.includes('salt') || n.includes('sodium chloride') || n.includes('sulfate') || n.includes('carbonate') || n.includes('citrate') || n.includes('stpp') || n.includes('soda ash')) && Number.isFinite(rawPct) && rawPct >= 0.5) {
        hasElectrolyte = true;
      }
      continue;
    }

    if (!Number.isFinite(rawPct)) {
      reasons.push(`${name || 'Unnamed surfactant'} is missing a numeric as-supplied formula dose (% w/w).`);
      continue;
    }
    if (rawPct < 0 || rawPct > 100) {
      reasons.push(`${name} has invalid formula mass percentage ${rawPct}; expected 0–100% w/w.`);
      continue;
    }
    if (rawPct === 0) continue;

    const referenceResolution = resolveEng002PureComponent(ingredient);
    if (!referenceResolution.supported) {
      reasons.push(`${name}: ${referenceResolution.reason}`);
      continue;
    }
    const activeValue = ingredient.activeMatterPct ?? ingredient.activePercent ?? ingredient.activeMatterPurity;
    if (activeValue === undefined || activeValue === null || activeValue === '') {
      reasons.push(`${name}: active matter is missing; catalog fallbacks are not applied by the Clint calculation.`);
      continue;
    }
    const activeMatterPct = Number(activeValue);
    if (!Number.isFinite(activeMatterPct) || activeMatterPct < 0 || activeMatterPct > 100) {
      reasons.push(`${name}: active matter ${String(activeValue)} is invalid; expected 0–100% w/w.`);
      continue;
    }
    if (activeMatterPct === 0) {
      reasons.push(`${name}: active matter was explicitly entered as 0%, so no positive surfactant mass is available for Clint calculation.`);
      continue;
    }
    const reference = referenceResolution.reference;
    const source = (ingredient as FormulationIngredient & { activeMatterInputSource?: ActiveMatterInputSource }).activeMatterInputSource ?? 'UNKNOWN';
    const evidenceId = (ingredient as FormulationIngredient & { activeMatterEvidenceId?: string }).activeMatterEvidenceId;
    const evidenceUrl = (ingredient as FormulationIngredient & { activeMatterEvidenceUrl?: string }).activeMatterEvidenceUrl;
    const rawIdentityId = String(ingredient.canonicalIngredientId ?? ingredient.id ?? name);
    resolved.push({
      reference, name, id: rawIdentityId, rawPct, activeMatterPct,
      activeMassPct: rawPct * activeMatterPct / 100,
      activeMatterInputSource: source,
      activeMatterEvidenceId: evidenceId,
      activeMatterEvidenceUrl: evidenceUrl
    });
    if (reference.chargeClass === 'anionic') hasAnionic = true;
    if (reference.chargeClass === 'amphoteric') hasAmphoteric = true;
    if (reference.chargeClass === 'nonionic') hasNonionic = true;
    if (reference.chargeClass === 'cationic') hasCationic = true;
  }

  if (reasons.length > 0) return unavailable(reasons);
  if (resolved.length === 0) {
    return unavailable(['No positive-dose surfactant with a supported exact identity, pure CMC, molecular weight, and explicit active-matter input was found.']);
  }

  // Aggregate duplicate ingredient rows and equivalent exact aliases by chemical identity.
  const grouped = new Map<string, { reference: Eng002PureComponentReference; names: Set<string>; ids: Set<string>; activeMassPct: number; activeSources: Set<ActiveMatterInputSource>; hasSourceEvidence: boolean }>();
  for (const item of resolved) {
    const key = item.reference.chemicalKey;
    const current = grouped.get(key) ?? {
      reference: item.reference, names: new Set<string>(), ids: new Set<string>(),
      activeMassPct: 0, activeSources: new Set<ActiveMatterInputSource>(), hasSourceEvidence: true
    };
    current.names.add(item.name);
    current.ids.add(item.id);
    current.activeMassPct += item.activeMassPct;
    current.activeSources.add(item.activeMatterInputSource);
    current.hasSourceEvidence = current.hasSourceEvidence &&
      item.activeMatterInputSource === 'SOURCE_BACKED' && Boolean(item.activeMatterEvidenceId?.trim()) && Boolean(item.activeMatterEvidenceUrl?.trim());
    grouped.set(key, current);
  }
  const components = Array.from(grouped.entries()).map(([key, item]) => ({
    key, ...item,
    molecularWeight: item.reference.molecularWeightGPerMol,
    cmcMmolL: item.reference.cmcMolar * 1000
  }));
  const totalActiveMass = components.reduce((sum, component) => sum + component.activeMassPct, 0);
  const moleAmounts = components.map(component => component.activeMassPct / component.molecularWeight);
  const totalMoles = moleAmounts.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(totalActiveMass) || totalActiveMass <= 0 || !Number.isFinite(totalMoles) || totalMoles <= 0) {
    return unavailable(['Active surfactant mass or mole total is non-positive or non-finite.']);
  }
  const moleFractions = moleAmounts.map(value => value / totalMoles);
  const idealMolar = idealMixedCmcFromMoleFractions(components.map((component, index) => ({
    moleFraction: moleFractions[index], cmc: component.cmcMmolL, cmcUnit: 'mM'
  })));
  const weightedMw = components.reduce((sum, component, index) => sum + moleFractions[index] * component.molecularWeight, 0);
  const idealPpm = idealMolar * weightedMw;
  const resolvedComponents = components.map((component, index) => ({
    name: Array.from(component.names).join(' / '),
    canonicalChemicalKey: component.key,
    contributingIngredientIds: Array.from(component.ids).sort(),
    activeFraction: Number((component.activeMassPct / totalActiveMass).toFixed(6)),
    activeMassPct: Number(component.activeMassPct.toFixed(6)),
    moleFraction: Number(moleFractions[index].toFixed(6)),
    molecularWeightGPerMol: component.molecularWeight,
    cmcMolar: component.cmcMmolL,
    cmcPpm: Number((component.cmcMmolL * component.molecularWeight).toFixed(3)),
    type: component.reference.chargeClass,
    activeMatterInputSource: component.activeSources.size === 1 ? Array.from(component.activeSources)[0] : 'USER_ENTERED' as ActiveMatterInputSource,
    referenceEvidence: component.reference.evidence
  }));
  const allInputsSourceBacked = components.every(component => component.hasSourceEvidence);
  const eligibilityReasons = allInputsSourceBacked
    ? ['Exact chemical identities and pure-component CMC/MW references are traceable; each active-matter input has a linked source record/URL (metadata presence only; source contents are not re-verified by the calculator). The output remains an ideal-model prediction, not formula validation.']
    : ['Exact chemical identities and pure-component CMC/MW references are source-backed, but at least one active-matter value is a catalog default, user-entered, or provenance-unspecified without a linked assay/CoA record/URL.'];
  const pairClasses = Array.from(new Set(components.map(component => component.reference.chargeClass)));
  const openBenchmarkNonIdeality = describeOpenBenchmarkNonIdeality(pairClasses);

  return {
    available: true,
    eligibilityStatus: allInputsSourceBacked ? 'FULLY_SUPPORTED' : 'PARTIALLY_SUPPORTED',
    eligibilityReasons,
    molar: Number(idealMolar.toFixed(6)),
    ppm: Number(idealPpm.toFixed(3)),
    idealMolar: Number(idealMolar.toFixed(6)),
    idealPpm: Number(idealPpm.toFixed(3)),
    modelType: 'Ideal Mixed Pseudophase (Clint Model)',
    classification: 'Theoretical Ideal Baseline',
    hasSynergyPair: (hasAnionic && hasAmphoteric) || (hasAnionic && hasNonionic) || (hasAnionic && hasCationic) || (hasCationic && hasNonionic),
    hasElectrolyteScreening: hasElectrolyte,
    components: resolvedComponents,
    evidenceRefs: Array.from(new Set(components.map(component => component.reference.evidence.evidenceId))),
    openBenchmarkNonIdeality,
    confidence: 'Lower Confidence',
    limitation: 'Component-level ideal Clint model only. Applicability is restricted to exact supported species and explicit active matter. Matrix conditions, pH/speciation, ionic strength, homolog composition and non-ideal interactions are not comprehensively modeled; no finished-formula validation is implied.' + (openBenchmarkNonIdeality ? ` ${openBenchmarkNonIdeality}` : ''),
    labValidationGuidance: 'Measure equilibrium surface tension against log concentration for the exact formula, solvent, temperature, pH, ionic strength and protocol before making empirical claims.'
  };
}

export interface PHConfidenceResult {
  confidence: 'Higher Confidence' | 'Moderate Confidence' | 'Lower Confidence';
  assumptions: string[];
  shiftFactors: string[];
  labValidationGuidance: string;
}

export function getPHConfidenceAndAssumptions(
  ingredients: FormulationIngredient[],
  calculatedPH: number
): PHConfidenceResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  let hasNeutralizationAcid = false;
  let hasNeutralizationBase = false;
  let hasBuffer = false;
  let totalActivePct = 0;

  for (const ing of safeIngs) {
    const n = (ing?.name || '').toLowerCase();
    const pct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0);
    const active = Number(ing?.activeMatterPct ?? ing?.activePercent ?? getDefaultActiveMatter(ing)) / 100;
    totalActivePct += pct * active;

    if (n.includes('labsa') || n.includes('sulfonic') || n.includes('citric acid')) {
      hasNeutralizationAcid = true;
    }
    if (n.includes('hydroxide') || n.includes('naoh') || n.includes('koh') || n.includes('triethanolamine') || n.includes('tea')) {
      hasNeutralizationBase = true;
    }
    if (n.includes('citrate') || n.includes('carbonate') || n.includes('silicate') || n.includes('phosphate') || n.includes('soda ash')) {
      hasBuffer = true;
    }
  }

  let confidence: 'Higher Confidence' | 'Moderate Confidence' | 'Lower Confidence' = 'Moderate Confidence';
  if (calculatedPH < 2.0 || calculatedPH > 12.5) {
    confidence = 'Lower Confidence'; // Extreme non-ideal activity coefficients and dissociation extremes
  } else if ((hasNeutralizationAcid && hasNeutralizationBase) || hasBuffer) {
    confidence = 'Higher Confidence'; // Well-buffered or stoichiometrically governed system
  } else if (calculatedPH >= 6.0 && calculatedPH <= 8.0 && !hasBuffer) {
    confidence = 'Moderate Confidence'; // Weakly buffered neutral zone susceptible to minor atmospheric CO2/mineral shifts
  }

  return {
    confidence,
    assumptions: [
      'Equilibrium electroneutrality charge balance solved via Newton-Raphson polynomial convergence.',
      'Activity coefficients approximated via extended Debye-Hückel / Davies formulation at 25°C.',
      'Assumes deionized water baseline without unaccounted background mineral hardness.'
    ],
    shiftFactors: [
      'Atmospheric CO₂ absorption during open vessel mixing causing carbonation drift.',
      'Commercial raw material assay tolerances (e.g. free sulfuric acid in LABSA or carbonate in caustic lye).',
      'Municipal water hardness (calcium/magnesium carbonate ions) and batch processing temperature.'
    ],
    labValidationGuidance: 'Benchtop measurement with a calibrated two-point glass electrode pH-meter (pH 4.01/7.00/10.01 standard buffers) recommended for commercial batch release.'
  };
}

export const getIngredientCmc = (name: string) => getIngredientCmcData(name);

export const calculateMixedCmc = (ingredients: any[]) => {
  return calculateMixedCMC(ingredients);
};

export function generateFormulationWarnings(ingredients: FormulationIngredient[]): string[] {
  const warnings: string[] = [];
  const active = calculateActiveMatter(ingredients);
  if (active < 5) warnings.push('Active matter is below 5%, product may have weak cleaning performance.');
  return warnings;
}

export const ShelfLifeHeuristicPolicy = {
  UNPRESERVED_AQUEOUS_LIMIT_MONTHS: 3,
  IONIC_CLASH_LIMIT_MONTHS: 1,
  ENZYMATIC_WATER_LIMIT_MONTHS: 12,
  LOW_WATER_UNPRESERVED_LIMIT_MONTHS: 18,
  STANDARD_STABILITY_MONTHS: 24
};

export interface EcoScoreCoefficientMetadata {
  value: number;
  sourceType: "EMPIRICAL_MODEL_PARAMETER" | "ENGINEERING_DEFAULT" | "REGULATORY_HAZARD_CLASSIFICATION" | "EMPIRICAL_CALIBRATION" | "REFERENCE_DATABASE";
  publishedReference: string;
  calibrationBasis: string;
  mathematicalDerivationBasis?: string;
  isMathematicallyDerived: boolean;
  scoreType: "REGULATORY_HAZARD_PENALTY" | "BIO_BASED_PREMIUM" | "CATALYTIC_PREMIUM" | "PERSISTENCE_PENALTY";
}

export const EcoScoreCoefficientRegistry: Record<string, EcoScoreCoefficientMetadata> = {
  PLANT_BASED_GOOD_BONUS: {
    value: 10,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "USDA BioPreferred Program guidelines / EU Ecolabel Part B",
    calibrationBasis: "Minimum bio-based organic carbon content threshold (>=50%) for bio-preferred labeling.",
    mathematicalDerivationBasis: "Reference defines bio-carbon criteria (>=50%); numeric +10 score is an internal empirical scoring weight.",
    isMathematicallyDerived: false,
    scoreType: "BIO_BASED_PREMIUM"
  },
  PLANT_BASED_EXCELLENT_BONUS: {
    value: 15,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "USDA BioPreferred Program guidelines / EU Ecolabel Part B",
    calibrationBasis: "High bio-based organic carbon content threshold exceeding 75% bio-based carbon.",
    mathematicalDerivationBasis: "Reference defines high bio-carbon criteria (>=75%); numeric +15 score is an internal empirical scoring weight.",
    isMathematicallyDerived: false,
    scoreType: "BIO_BASED_PREMIUM"
  },
  CATALYTIC_ENZYME_BONUS: {
    value: 5,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "DID List (Detergent Ingredients Database) Part A v2016.1",
    calibrationBasis: "Enzyme rapid aerobic biodegradation and low aquatic toxicity weighting.",
    mathematicalDerivationBasis: "DID List supplies aerobic biodegradation and CDV parameters; numeric +5 score is an internal empirical premium.",
    isMathematicallyDerived: false,
    scoreType: "CATALYTIC_PREMIUM"
  },
  BIODEGRADABLE_BUILDER_BONUS: {
    value: 5,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "EU Ecolabel Commission Decision (EU) 2017/1218 / DID List Part A",
    calibrationBasis: "Readily biodegradable organic chelating agents (e.g., GLDA, MGDA, sodium citrate) passing OECD 301 criteria.",
    mathematicalDerivationBasis: "Standards establish OECD 301 biodegradability pass marks; numeric +5 score is an internal empirical premium.",
    isMathematicallyDerived: false,
    scoreType: "CATALYTIC_PREMIUM"
  },
  SYNTHETIC_ALKYL_SULFATE_DEDUCTION: {
    value: 10,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "EU Ecolabel Commission Decision (EU) 2017/1218 / GHS Hazard Classification",
    calibrationBasis: "Aquatic chronic eco-toxicity hazard profile for synthetic commodity anionic surfactants (e.g., LAS, SLES).",
    mathematicalDerivationBasis: "GHS assigns H412/H411 aquatic chronic toxicity; numeric -10 score is an internal empirical penalty.",
    isMathematicallyDerived: false,
    scoreType: "REGULATORY_HAZARD_PENALTY"
  },
  PHOSPHATE_STPP_DEDUCTION: {
    value: 15,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "EU Regulation (EU) No 259/2012 (Phosphates in consumer laundry/dishwasher detergents)",
    calibrationBasis: "Freshwater eutrophication risks and regulatory bans on inorganic polyphosphates in consumer detergents.",
    mathematicalDerivationBasis: "Regulation 259/2012 enacts total phosphorus limits; numeric -15 score is an internal empirical penalty.",
    isMathematicallyDerived: false,
    scoreType: "REGULATORY_HAZARD_PENALTY"
  },
  CHLORINE_BLEACH_DEDUCTION: {
    value: 15,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "EU Ecolabel Commission Decision (EU) 2017/1218 / DID List Part A",
    calibrationBasis: "High aquatic acute/chronic toxicity and generation of absorbable organic halogens (AOX).",
    mathematicalDerivationBasis: "Ecolabel criteria restrict reactive halogenating bleach species; numeric -15 score is an internal empirical penalty.",
    isMathematicallyDerived: false,
    scoreType: "REGULATORY_HAZARD_PENALTY"
  },
  SYNTHETIC_POLYMER_DEDUCTION: {
    value: 10,
    sourceType: "EMPIRICAL_MODEL_PARAMETER",
    publishedReference: "EU Ecolabel Commission Decision (EU) 2017/1218 / GHS Hazard Classification",
    calibrationBasis: "Environmental persistence of recalcitrant synthetic aminopolycarboxylates (EDTA/DTPA) and non-biodegradable polymers (polyacrylates/carbomers).",
    mathematicalDerivationBasis: "Ecolabel excludes persistent non-biodegradable organics; numeric -10 score is an internal empirical penalty.",
    isMathematicallyDerived: false,
    scoreType: "PERSISTENCE_PENALTY"
  }
};

export const EcoScoreEmpiricalCoefficients = {
  BASE_SCORE: 80,
  PLANT_BASED_THRESHOLD_PCT: 50,
  PLANT_BASED_EXCELLENT_THRESHOLD_PCT: 75,
  PLANT_BASED_GOOD_BONUS: EcoScoreCoefficientRegistry.PLANT_BASED_GOOD_BONUS.value,
  PLANT_BASED_EXCELLENT_BONUS: EcoScoreCoefficientRegistry.PLANT_BASED_EXCELLENT_BONUS.value,
  CATALYTIC_ENZYME_BONUS: EcoScoreCoefficientRegistry.CATALYTIC_ENZYME_BONUS.value,
  BIODEGRADABLE_BUILDER_BONUS: EcoScoreCoefficientRegistry.BIODEGRADABLE_BUILDER_BONUS.value,
  SYNTHETIC_ALKYL_SULFATE_DEDUCTION: EcoScoreCoefficientRegistry.SYNTHETIC_ALKYL_SULFATE_DEDUCTION.value,
  PHOSPHATE_STPP_DEDUCTION: EcoScoreCoefficientRegistry.PHOSPHATE_STPP_DEDUCTION.value,
  CHLORINE_BLEACH_DEDUCTION: EcoScoreCoefficientRegistry.CHLORINE_BLEACH_DEDUCTION.value,
  SYNTHETIC_POLYMER_DEDUCTION: EcoScoreCoefficientRegistry.SYNTHETIC_POLYMER_DEDUCTION.value
};

export interface AlkaliConsumptionResult {
  value: number;
  unit: string;
  sourceType: "PREDICTED" | "INSUFFICIENT_DATA";
  modelType: "STOICHIOMETRIC_ESTIMATE";
  sourceEngine: "AlkaliConsumptionEngine" | "StoichiometricNeutralizationEngine";
  engineVersion: "2.0" | "3.0";
  freePercentages: Record<string, number>;
  confidence: number;
  confidenceClassification?: "STOICHIOMETRIC_ESTIMATE" | "MODEL_COVERAGE_HIGH";
  labValidationStatus?: "LAB_VALIDATION_NONE";
  inputBasis: string;
  assumptions: string[];
  limitations: string[];
}

export function calculateAlkaliConsumption(ingredients: FormulationIngredient[]): AlkaliConsumptionResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];

  let totalAcidEquivalents = 0;
  let totalBaseEquivalents = 0;
  const freePercentages: Record<string, number> = {};
  let hasInsufficientData = false;

  const ingredientDetails = safeIngs.map(ing => {
    const name = ing?.name || '';
    const pct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? (ing as any)?.rawPercent ?? 0) || 0;
    
    // Resolve profile
    const profile = resolveScientificAcidBaseProfile(ing);
    
    // Check if it's an acid or base
    const isAcid = profile.classification.protonDonorCount !== undefined && profile.classification.protonDonorCount > 0;
    const isBase = profile.classification.protonAcceptorCount !== undefined && profile.classification.protonAcceptorCount > 0;

    let eq = 0;
    if (pct > 0 && (isAcid || isBase)) {
      // Calculate equivalents (rawMassKg = pct for 100kg batch)
      const eqResult = calculateReactiveEquivalents(profile, pct);
      if (eqResult.status === 'INSUFFICIENT_DATA') {
        hasInsufficientData = true;
      }
      eq = eqResult.totalReactiveEquivalents ?? 0;
    }

    return {
      name,
      pct,
      isAcid,
      isBase,
      eq
    };
  });

  // Sum up total equivalents
  ingredientDetails.forEach(d => {
    if (d.isAcid) totalAcidEquivalents += d.eq;
    if (d.isBase) totalBaseEquivalents += d.eq;
  });

  // Calculate consumed equivalents
  const equivalentsConsumed = Math.min(totalAcidEquivalents, totalBaseEquivalents);
  const alkaliConsumptionKg = (equivalentsConsumed * 39.997) / 1000; // convert g/mol to kg/mol

  // Calculate free percentages of acids
  let freeFraction = 0;
  if (totalAcidEquivalents > totalBaseEquivalents && totalAcidEquivalents > 1e-6) {
    freeFraction = 1.0 - (totalBaseEquivalents / totalAcidEquivalents);
  }

  safeIngs.forEach(ing => {
    const name = ing?.name || '';
    const pct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? (ing as any)?.rawPercent ?? 0) || 0;
    
    const detail = ingredientDetails.find(d => d.name === name);
    if (detail?.isAcid) {
      freePercentages[name] = Number((pct * freeFraction).toFixed(4));
    } else {
      freePercentages[name] = 0;
    }
  });

  return {
    value: Number(alkaliConsumptionKg.toFixed(5)),
    unit: "kg NaOH solid equivalent per 100kg batch",
    sourceType: hasInsufficientData ? "INSUFFICIENT_DATA" : "PREDICTED",
    modelType: "STOICHIOMETRIC_ESTIMATE",
    sourceEngine: "AlkaliConsumptionEngine",
    engineVersion: "3.0",
    freePercentages,
    confidence: hasInsufficientData ? 0 : 100,
    confidenceClassification: "STOICHIOMETRIC_ESTIMATE",
    labValidationStatus: "LAB_VALIDATION_NONE",
    inputBasis: "DETERMINISTIC_STOICHIOMETRIC_REACTIVE_EQUIVALENTS",
    assumptions: [
      "Alkali consumption represents the stoichiometric amount of NaOH solid equivalent reacting in the formulation.",
      "Conversion basis: 1 reactive equivalent of acid/base = 39.997 grams of NaOH solid equivalent."
    ],
    limitations: [
      "Assumes pure stoichiometric reaction based on declared or matched active content.",
      "Does not account for non-ideal aqueous equilibrium thermodynamic speciation under diverse solvent conditions."
    ]
  };
}

export interface EcoBonusEntry {
  name: string;
  type: string;
  value: number;
  sourceType?: string;
  publishedReference?: string;
  calibrationBasis?: string;
  scoreType?: string;
}

export interface EcoDeductionEntry {
  name: string;
  type: string;
  value: number;
  sourceType?: string;
  publishedReference?: string;
  calibrationBasis?: string;
  scoreType?: string;
}

export interface EcoCertificationEntry {
  name: string;
  status: "Eligible" | "Requires Review" | "Ineligible";
  reasons: string[];
  classification: "INTERNAL_SCREENING_ESTIMATE";
  disclaimer: string;
}

export interface ComplexEcoScoreResult {
  score: number;
  plantBasedOverallPct: number;
  bonuses: EcoBonusEntry[];
  deductions: EcoDeductionEntry[];
  certifications: EcoCertificationEntry[];
  sourceType: "PREDICTED";
  modelType: "RULE_BASED_EMPIRICAL";
  sourceEngine: "EcoImpactAssessmentEngine";
  engineVersion: "2.0";
  inputBasis: string;
  assumptions: string[];
  limitations: string[];
  disclaimer: string;
}

export function calculateComplexEcoScore(ingredients: FormulationIngredient[]): ComplexEcoScoreResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  
  let baseScore = EcoScoreEmpiricalCoefficients.BASE_SCORE;
  const bonuses: EcoBonusEntry[] = [];
  const deductions: EcoDeductionEntry[] = [];
  
  let totalPlantPct = 0;
  let hasEnzyme = false;
  let hasGreenChelator = false;
  let hasSulfates = false;
  let hasPhosphates = false;
  let hasChlorine = false;
  let hasSyntheticPolymer = false;
  let hasRecalcitrantChelator = false;

  safeIngs.forEach(ing => {
    const name = (ing?.name || '').toLowerCase();
    const cat = (ing?.category || ing?.role || getAuditedIngredientCategory(ing?.name || '')).toLowerCase();
    const pct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0;

    if (pct <= 0) return;

    const eco = getIngredientEcoMetrics(name);
    totalPlantPct += (pct * eco.plantBasedPct) / 100;

    if (eco.plantBasedPct >= 80) {
      totalPlantPct += pct;
    }

    if (cat.includes('enzyme') || name.includes('protease') || name.includes('amylase') || name.includes('lipase')) {
      hasEnzyme = true;
    }

    if (name.includes('glda') || name.includes('mgda') || name.includes('citrate') || name.includes('gluconate')) {
      hasGreenChelator = true;
    }

    if (name.includes('labsa') || name.includes('sles') || name.includes('sls') || name.includes('sulfate') || name.includes('sulphonate')) {
      hasSulfates = true;
    }

    if (name.includes('tripolyphosphate') || name.includes('stpp') || name.includes('phosphate')) {
      hasPhosphates = true;
    }

    if (name.includes('hypochlorite') || name.includes('chlorine') || name.includes('bleach')) {
      hasChlorine = true;
    }

    if (name.includes('carbomer') || name.includes('acrylate') || name.includes('polycarboxylate')) {
      hasSyntheticPolymer = true;
    }

    if (name.includes('edta') || name.includes('dtpa') || name.includes('hedta')) {
      hasRecalcitrantChelator = true;
    }
  });

  const plantBasedOverallPct = Math.min(100, Math.round(totalPlantPct));

  // Bonuses
  if (plantBasedOverallPct >= EcoScoreEmpiricalCoefficients.PLANT_BASED_THRESHOLD_PCT) {
    const registryKey = plantBasedOverallPct >= EcoScoreEmpiricalCoefficients.PLANT_BASED_EXCELLENT_THRESHOLD_PCT 
      ? "PLANT_BASED_EXCELLENT_BONUS" 
      : "PLANT_BASED_GOOD_BONUS";
    const coef = EcoScoreCoefficientRegistry[registryKey];
    bonuses.push({
      name: "Plant-Based Ingredients",
      type: `${plantBasedOverallPct}% Bio-Renewable Carbon`,
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: coef.calibrationBasis,
      scoreType: coef.scoreType
    });
    baseScore += coef.value;
  }

  if (hasEnzyme) {
    const coef = EcoScoreCoefficientRegistry.CATALYTIC_ENZYME_BONUS;
    bonuses.push({
      name: "Catalytic Enzyme Package",
      type: "Rapid biodegradation booster",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: coef.calibrationBasis,
      scoreType: coef.scoreType
    });
    baseScore += coef.value;
  }

  if (hasGreenChelator) {
    const coef = EcoScoreCoefficientRegistry.BIODEGRADABLE_BUILDER_BONUS;
    bonuses.push({
      name: "Biodegradable Builder/Chelator",
      type: "Eco-friendly scale control",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: coef.calibrationBasis,
      scoreType: coef.scoreType
    });
    baseScore += coef.value;
  }

  // Deductions
  if (hasSulfates) {
    const coef = EcoScoreCoefficientRegistry.SYNTHETIC_ALKYL_SULFATE_DEDUCTION;
    deductions.push({
      name: "Synthetic Alkyl Sulfates",
      type: "Aquatic eco-toxicity hazard",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: coef.calibrationBasis,
      scoreType: coef.scoreType
    });
    baseScore -= coef.value;
  }

  if (hasPhosphates) {
    const coef = EcoScoreCoefficientRegistry.PHOSPHATE_STPP_DEDUCTION;
    deductions.push({
      name: "Phosphate Builders (STPP)",
      type: "Eutrophication risk in water bodies",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: coef.calibrationBasis,
      scoreType: coef.scoreType
    });
    baseScore -= coef.value;
  }

  if (hasChlorine) {
    const coef = EcoScoreCoefficientRegistry.CHLORINE_BLEACH_DEDUCTION;
    deductions.push({
      name: "Organohalogen / Chlorine Bleach",
      type: "Persistently toxic by-products",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: coef.calibrationBasis,
      scoreType: coef.scoreType
    });
    baseScore -= coef.value;
  }

  if (hasRecalcitrantChelator) {
    const coef = EcoScoreCoefficientRegistry.SYNTHETIC_POLYMER_DEDUCTION;
    deductions.push({
      name: "Recalcitrant Synthetic Chelator (EDTA/DTPA)",
      type: "Low aerobic biodegradability & heavy-metal mobilization risk",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: "Persistent synthetic aminopolycarboxylates (e.g. EDTA, DTPA) with low biodegradability.",
      scoreType: coef.scoreType
    });
    baseScore -= coef.value;
  }

  if (hasSyntheticPolymer) {
    const coef = EcoScoreCoefficientRegistry.SYNTHETIC_POLYMER_DEDUCTION;
    deductions.push({
      name: "Synthetic Non-Biodegradable Polymers",
      type: "Microplastic precursor / environmental persistence",
      value: coef.value,
      sourceType: coef.sourceType,
      publishedReference: coef.publishedReference,
      calibrationBasis: "Non-biodegradable synthetic polymers (e.g., polyacrylates, carbomers) with environmental persistence.",
      scoreType: coef.scoreType
    });
    baseScore -= coef.value;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  // Certifications with screening disclaimers
  const certifications: EcoCertificationEntry[] = [
    {
      name: "EU Ecolabel",
      status: (!hasPhosphates && !hasChlorine && !hasSyntheticPolymer && !hasRecalcitrantChelator && finalScore >= 80) ? "Eligible" : "Ineligible",
      reasons: [],
      classification: "INTERNAL_SCREENING_ESTIMATE",
      disclaimer: "This is not an official certification determination."
    },
    {
      name: "USDA BioPreferred",
      status: (plantBasedOverallPct >= 50) ? "Eligible" : (plantBasedOverallPct >= 20 ? "Requires Review" : "Ineligible"),
      reasons: [],
      classification: "INTERNAL_SCREENING_ESTIMATE",
      disclaimer: "This is not an official certification determination."
    },
    {
      name: "Green Seal Standard",
      status: (finalScore >= 75 && !hasChlorine) ? "Eligible" : "Requires Review",
      reasons: [],
      classification: "INTERNAL_SCREENING_ESTIMATE",
      disclaimer: "This is not an official certification determination."
    }
  ];

  certifications.forEach(cert => {
    if (cert.name === "EU Ecolabel") {
      if (hasPhosphates) cert.reasons.push("Contains eutrophying phosphates");
      if (hasChlorine) cert.reasons.push("Contains chlorine bleach chemistry");
      if (hasSyntheticPolymer) cert.reasons.push("Contains non-biodegradable synthetic polymers");
      if (hasRecalcitrantChelator) cert.reasons.push("Contains recalcitrant synthetic chelators (EDTA/DTPA)");
      if (finalScore < 80) cert.reasons.push(`Score ${finalScore} falls below minimum requirement of 80`);
    } else if (cert.name === "USDA BioPreferred") {
      cert.reasons.push(`Bio-renewable organic carbon is ${plantBasedOverallPct}% (target: >=50%)`);
    } else if (cert.name === "Green Seal Standard") {
      if (hasChlorine) cert.reasons.push("Contains chlorine bleach derivatives");
      if (finalScore < 75) cert.reasons.push(`Overall eco score ${finalScore} < 75`);
    }
  });

  return {
    score: finalScore,
    plantBasedOverallPct,
    bonuses,
    deductions,
    certifications,
    sourceType: "PREDICTED",
    modelType: "RULE_BASED_EMPIRICAL",
    sourceEngine: "EcoImpactAssessmentEngine",
    engineVersion: "2.0",
    disclaimer: "Rule-Based Predicted Estimate. Not a laboratory environmental measurement.",
    inputBasis: "Stoichiometric plant-based index and hazard matrices",
    assumptions: [
      "Standard aerobic biodegradation rates under municipal waste conditions.",
      "Renewable organic carbon calculated from plant-based assay loading."
    ],
    limitations: [
      "Empirical rule-based scoring model. Does not substitute for real OECD 301/302 tests.",
      "Actual aquatic toxicology requires experimental OECD 201/202/203 testing."
    ]
  };
}

export interface ShelfLifeResult {
  months: number;
  stabilityRisk: "Low" | "Medium" | "High";
  limitingFactor: string;
  preservativeEfficiency: number;
  confidence: "High" | "Medium" | "Low";
  sourceType: "ENGINEERING_DEFAULT";
  modelType: "RULE_BASED_ESTIMATE";
  sourceEngine: "AntimicrobialShelfLifeEngine";
  engineVersion: "2.0";
  inputBasis: string;
  assumptions: string[];
  limitations: string[];
  shelfLifeStatus: 'UNKNOWN' | 'HEURISTIC_SCREENING' | 'LAB_VALIDATED';
  chemicalStability: 'STABLE' | 'DEGRADATION_RISK' | 'UNKNOWN';
  physicalStability: 'STABLE' | 'PHASE_SEPARATION_RISK' | 'UNKNOWN';
  microbialStability: 'ADEQUATELY_PRESERVED' | 'UNPRESERVED_AQUEOUS_RISK' | 'UNKNOWN';
}

export function calculateShelfLife(ingredients: FormulationIngredient[]): ShelfLifeResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];

  if (safeIngs.length === 0) {
    return {
      months: ShelfLifeHeuristicPolicy.STANDARD_STABILITY_MONTHS,
      stabilityRisk: "Low",
      limitingFactor: "Packaging barrier stability & standard aging",
      preservativeEfficiency: 100,
      confidence: "Low",
      sourceType: "ENGINEERING_DEFAULT",
      modelType: "RULE_BASED_ESTIMATE",
      sourceEngine: "AntimicrobialShelfLifeEngine",
      engineVersion: "2.0",
      inputBasis: "Formulation water activity, preservation indices, and surfactant incompatibility checks",
      assumptions: [
        "24 months is an engineering default used only when formulation data is absent. It is NOT a predicted or laboratory-validated shelf life.",
        "Assumes system is stored in air-tight HDPE containers at 20-25°C.",
        "Assumes preservative active assay meets minimum inhibitory concentration (MIC)."
      ],
      limitations: [
        "Predicted value. Actual shelf life requires accelerated storage chamber validation (40°C at 75% RH for 12 weeks) under ASTM standards.",
        "Real-world container migration, oxygen exposure, and UV exposure can accelerate raw material rancidity."
      ],
      shelfLifeStatus: "UNKNOWN",
      chemicalStability: "UNKNOWN",
      physicalStability: "UNKNOWN",
      microbialStability: "UNKNOWN"
    };
  }

  let months = ShelfLifeHeuristicPolicy.STANDARD_STABILITY_MONTHS;
  let stabilityRisk: "Low" | "Medium" | "High" = "Low";
  let limitingFactor = "Packaging barrier stability & standard aging";
  let preservativeEfficiency = 100;
  let confidence: "High" | "Medium" | "Low" = "High";

  let hasPreservative = false;
  let waterPct = 0;
  let hasAnionic = false;
  let hasCationic = false;
  let hasEnzyme = false;

  safeIngs.forEach(ing => {
    const name = (ing?.name || '').toLowerCase();
    const cat = (ing?.category || ing?.role || '').toLowerCase();
    const pct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0;

    if (pct <= 0) return;

    if (name.includes('water') || name.includes('aqua')) {
      waterPct += pct;
    }

    if (cat.includes('preservative') || cat.includes('biocide') || name.includes('preservative') || name.includes('isothiazolinone') || name.includes('phenoxyethanol') || name.includes('benzoate') || name.includes('kathon')) {
      hasPreservative = true;
    }

    if (cat.includes('anionic') || name.includes('labsa') || name.includes('sles') || name.includes('sls')) {
      hasAnionic = true;
    }

    if (cat.includes('cationic') || name.includes('quat') || name.includes('cetrimonium') || name.includes('esterquat')) {
      hasCationic = true;
    }

    if (cat.includes('enzyme') || name.includes('protease') || name.includes('amylase') || name.includes('lipase')) {
      hasEnzyme = true;
    }
  });

  const isAnionicCationicClash = hasAnionic && hasCationic;

  if (waterPct > 20 && !hasPreservative) {
    months = ShelfLifeHeuristicPolicy.UNPRESERVED_AQUEOUS_LIMIT_MONTHS;
    stabilityRisk = "High";
    limitingFactor = "Unpreserved aqueous phase (high microbial contamination risk)";
    preservativeEfficiency = 0;
    confidence = "Low";
  } else if (isAnionicCationicClash) {
    months = ShelfLifeHeuristicPolicy.IONIC_CLASH_LIMIT_MONTHS;
    stabilityRisk = "High";
    limitingFactor = "Thermodynamic coacervation & phase separation (Ionic precipitation)";
    preservativeEfficiency = 50;
    confidence = "Low";
  } else if (hasEnzyme && waterPct > 30) {
    months = ShelfLifeHeuristicPolicy.ENZYMATIC_WATER_LIMIT_MONTHS;
    stabilityRisk = "Medium";
    limitingFactor = "Enzymatic hydrolysis and thermal denaturation";
    preservativeEfficiency = 80;
    confidence = "Medium";
  } else if (!hasPreservative && waterPct <= 20) {
    months = ShelfLifeHeuristicPolicy.LOW_WATER_UNPRESERVED_LIMIT_MONTHS;
    stabilityRisk = "Medium";
    limitingFactor = "Water activity moisture absorption & raw material caking";
    preservativeEfficiency = 0;
    confidence = "Medium";
  }

  return {
    months,
    stabilityRisk,
    limitingFactor,
    preservativeEfficiency,
    confidence,
    sourceType: "ENGINEERING_DEFAULT",
    modelType: "RULE_BASED_ESTIMATE",
    sourceEngine: "AntimicrobialShelfLifeEngine",
    engineVersion: "2.0",
    inputBasis: "Formulation water activity, preservation indices, and surfactant incompatibility checks",
    assumptions: [
      "Assumes system is stored in air-tight HDPE containers at 20-25°C.",
      "Assumes preservative active assay meets minimum inhibitory concentration (MIC)."
    ],
    limitations: [
      "Predicted value. Actual shelf life requires accelerated storage chamber validation (40°C at 75% RH for 12 weeks) under ASTM standards.",
      "Real-world container migration, oxygen exposure, and UV exposure can accelerate raw material rancidity."
    ],
    shelfLifeStatus: "HEURISTIC_SCREENING",
    chemicalStability: hasEnzyme ? "DEGRADATION_RISK" : "STABLE",
    physicalStability: isAnionicCationicClash ? "PHASE_SEPARATION_RISK" : "STABLE",
    microbialStability: (waterPct > 20 && !hasPreservative) ? "UNPRESERVED_AQUEOUS_RISK" : "ADEQUATELY_PRESERVED"
  };
}

export function getIngredientCost(_name: string): number | null {
  // Authoritative Commercial Costing: Never invent or guess raw-material prices from names.
  // Missing price is strictly null / unknown unless explicitly configured by the user.
  return null;
}

import {
  calculateCommercialMarginChain as calcCommercialMarginChainAuthoritative,
  type CommercialMarginChain
} from './costingEngine';

export type { CommercialMarginChain };
export const calculateCommercialMarginChain = calcCommercialMarginChainAuthoritative;

export function calculateProfitAndMargin(cost: number, sellingPrice: number) {
  const profit = roundCurrency(sellingPrice - cost);
  const markupPct = cost > 0 ? roundCurrency((profit / cost) * 100) : 0;
  const grossMarginPct = sellingPrice > 0 ? roundCurrency((profit / sellingPrice) * 100) : 0;
  return { profit, markupPct, grossMarginPct };
}

export {
  validateMeasurementRecord,
  analyzeLabReplicates,
  checkMeasurementComparability,
  calculatePredictionError,
  evaluateCategoryModelValidation,
  proposeCalibrationCandidates,
  CATEGORY_EVIDENCE_MATRIX,
  ScientificModelGovernanceRegistry,
  globalGovernanceRegistry,
  INITIAL_GOVERNED_PARAMETERS,
  GOLDEN_FORMULA_SET,
  calculateModelChangeImpact,
  evaluateHistoricalFormulaReproducibility,
  type DetailedLabEvidenceRecord,
  type TestConditions,
  type ReplicateAnalysisResult,
  type ComparabilityCheckResult,
  type ErrorAnalysisResult,
  type CategoryModelValidationSummary,
  type CalibrationCandidateProposal,
  type ParameterClassification,
  type ParameterScope,
  type GovernanceStatus,
  type GovernedScientificParameter,
  type CalibrationApprovalRecord,
  type ScientificModelVersion,
  type ChangeImpactAnalysisResult,
  type ModelRollbackResult,
  evaluateIngredientDataQuality,
  traceCompatibilityReasoning,
  analyzeDependencyPropagation,
  evaluateIngredientSubstitution,
  globalIngredientGovernance,
  INGREDIENT_INTELLIGENCE_REGISTRY,
  INGREDIENT_INTERACTION_RULES,
  type IngredientProvenance,
  type ApplicabilityStatus,
  type SubstitutionTier,
  type IngredientQualityStatus,
  type IngredientChargeProfile,
  type IngredientGradeProfile,
  type IngredientDefinition,
  type InteractionRule,
  type TraceableCompatibilityFinding,
  type DependencyPropagationReport,
  type SubstitutionRecommendation,
  type GovernedIngredientKnowledgeSnapshot
};

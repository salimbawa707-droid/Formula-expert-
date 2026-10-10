import { FormulationIngredient } from '../types';
import { getAuditedIngredientCategory } from './calculators';
import { ActiveMatterEngine } from './activeMatterEngine';
import { getProductCategory, normalizeProductCategory } from '../domain/productTaxonomy';
import { calculateDynamicChelatorRequirement } from './chelatorEngine';
import { INGREDIENT_INTELLIGENCE_REGISTRY } from './ingredientIntelligenceEngine';

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export type ScientificBasisType = 'CALCULATED' | 'PREDICTIVE' | 'EMPIRICAL' | 'LABORATORY VERIFIED';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type RecommendationTypeClass =
  | 'ADD_INGREDIENT'
  | 'REMOVE_INGREDIENT'
  | 'REDUCE_DOSAGE'
  | 'INCREASE_DOSAGE'
  | 'REPLACE_INGREDIENT'
  | 'CHANGE_GRADE'
  | 'CHANGE_PROCESS'
  | 'CHECK_COMPATIBILITY'
  | 'RUN_LAB_TEST'
  | 'NO_CHANGE'
  | 'INSUFFICIENT_DATA';

export type RecommendationAuthoritySource =
  | 'DETERMINISTIC_RULE'
  | 'SCIENTIFIC_ENGINE'
  | 'SPECIFICATION_GATE'
  | 'COMPATIBILITY_ENGINE'
  | 'PERFORMANCE_MODEL'
  | 'LAB_EVIDENCE'
  | 'GOVERNED_MODEL'
  | 'AI_INTERPRETATION'
  | 'USER_INPUT';

export interface ReasoningTrace {
  reasoningId: string;
  productCategory: string;
  formulaVersion: string;
  ingredientIds: string[];
  relevantEngines: string[];
  inputData: Record<string, any>;
  scientificOutputs: Record<string, any>;
  evidenceProvenance: string;
  rulesTriggered: string[];
  uncertainty: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_CONFIDENCE' | 'INSUFFICIENT_DATA' | 'LAB_VALIDATION_REQUIRED';
}

export interface SanityIssue {
  id: string;
  issue: string;
  whyItMatters: string;
  scientificBasis: string;
  scientificType: ScientificBasisType;
  severity: SeverityLevel;
  whatToCheck: string;
}

export interface FormulationStrength {
  id: string;
  title: string;
  description: string;
  scientificBasis: string;
  scientificType: ScientificBasisType;
}

export interface ExpertRecommendation {
  id: string;
  problem: string;
  why: string;
  recommendedAction: string;
  expectedEffect: string;
  tradeOff: string;
  confidence: ConfidenceLevel;
  calculationBasis?: string;
  
  // Phase 9 Advanced Reasoning Attributes
  recommendationType: RecommendationTypeClass;
  authority: RecommendationAuthoritySource;
  reasoningTrace?: ReasoningTrace;
}

export interface ProductCategoryContext {
  category: string;
  targetPHMin: number;
  targetPHMax: number;
  targetActiveMatterMin: number;
  foamExpectation: string;
  notes: string;
}

export interface ExpertReasoningReport {
  sanityCheckPassed: boolean;
  overallStatus: 'PASS' | 'PASS WITH LIMITATIONS' | 'FAIL';
  summarySentence: string;
  totalIssuesCount: number;
  criticalIssuesCount: number;
  highIssuesCount: number;
  issues: SanityIssue[];
  strengths: FormulationStrength[];
  recommendations: ExpertRecommendation[];
  productCategoryContext: ProductCategoryContext;
}

export interface ExpertReasoningInput {
  ingredients: FormulationIngredient[];
  productCategory?: string;
  waterHardnessPpm?: number;
  batchSizeKg?: number;
  calculatedPH?: number;
  totalActiveMatter?: number;
  totalPercentage?: number;
  costPerKg?: number;
  cleaningScore?: number;
  hardnessSufficiency?: 'sufficient' | 'borderline' | 'insufficient' | 'not_applicable' | 'baseline';
  maxSupportedHardnessPpm?: number;
  compatibilityScore?: number;
  compatibilityAlerts?: Array<{ id: string; title: string; severity: 'High' | 'Medium' | 'Low' | 'Critical'; message: string }>;
  viscosityEstimate?: string;
}

// =============================================================================
// 13-CATEGORY TARGET CONFIGURATION REGISTRY
// =============================================================================

export function getProductCategoryContext(categoryName?: string): ProductCategoryContext {
  const norm = normalizeProductCategory(categoryName);
  if (norm === 'UNKNOWN_PRODUCT_CATEGORY') {
    throw new Error(
      `Cannot resolve product category context: Unrecognized or undefined category "${categoryName ?? 'undefined'}". ` +
      `Product category must resolve to a valid canonical ProductCategoryId.`
    );
  }
  const def = getProductCategory(norm);
  if (!def) {
    throw new Error(`Category definition not found for canonical ID "${norm}".`);
  }
  return {
    category: def.label,
    targetPHMin: def.targetPHMin,
    targetPHMax: def.targetPHMax,
    targetActiveMatterMin: def.activeMatterMinPct,
    foamExpectation: def.foamExpectation,
    notes: `${def.primaryFunction}. Constraints: ${def.keyConstraints.join('; ')}.`
  };
}

// =============================================================================
// SCIENTIFIC REASONING ENGINE - CORE EVALUATION
// =============================================================================

export function evaluateExpertReasoning(input: ExpertReasoningInput): ExpertReasoningReport {
  const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
  const rawCat = input.productCategory;
  const normCat = normalizeProductCategory(rawCat);

  // Safeguard: Unknown category context failure
  if (normCat === 'UNKNOWN_PRODUCT_CATEGORY') {
    return {
      sanityCheckPassed: false,
      overallStatus: 'FAIL',
      summarySentence: `Evaluation failed: Product category "${rawCat ?? 'undefined'}" is unrecognized. Expert reasoning constraints cannot be verified without an authoritative product category.`,
      totalIssuesCount: 1,
      criticalIssuesCount: 1,
      highIssuesCount: 0,
      issues: [{
        id: 'unknown-product-category',
        issue: `Unrecognized product category: "${rawCat ?? 'undefined'}"`,
        whyItMatters: 'Target pH, active matter, and foam profiles cannot be evaluated without an authoritative category context.',
        scientificBasis: 'Deterministic formulation validation requires mapping to one of the 13 canonical ProductCategoryId entries.',
        scientificType: 'EMPIRICAL',
        severity: 'Critical',
        whatToCheck: 'Ensure the formula specifies a valid canonical product category.'
      }],
      strengths: [],
      recommendations: [{
        id: 'rec-valid-category',
        problem: 'Formulation lacks a valid canonical product category.',
        why: 'Target pH, foam behavior, and active matter thresholds are strictly category-specific.',
        recommendedAction: 'Select one of the 13 canonical product categories (e.g., Laundry Liquid, Dishwash Manual, Floor Cleaner, etc.).',
        expectedEffect: 'Enables deterministic formulation sanity checks and specification compliance.',
        tradeOff: 'None',
        confidence: 'HIGH',
        recommendationType: 'INSUFFICIENT_DATA',
        authority: 'SPECIFICATION_GATE'
      }],
      productCategoryContext: {
        category: rawCat || 'Unknown',
        targetPHMin: 0,
        targetPHMax: 14,
        targetActiveMatterMin: 0,
        foamExpectation: 'moderate',
        notes: 'Unrecognized product category.'
      }
    };
  }

  const catContext = getProductCategoryContext(normCat);
  const waterHardness = Number(input.waterHardnessPpm ?? 150);

  const issues: SanityIssue[] = [];
  const strengths: FormulationStrength[] = [];
  const recommendations: ExpertRecommendation[] = [];

  // Intermediate variable aggregates
  let totalPct = 0;
  let totalActiveSurfactantPct = 0;
  let anionicActivePct = 0;
  let nonionicActivePct = 0;
  let amphotericActivePct = 0;
  let cationicActivePct = 0;
  let inorganicBuilderPct = 0;
  let organicChelatorPct = 0;
  let saltPct = 0;
  let hasEnzyme = false;
  let hasBleach = false;
  let hasPreservative = false;

  const ingredientIds: string[] = [];

  // Parse and audit ingredients cleanly
  for (const ing of ingredients) {
    const rawPct = Number(ing.percentage ?? (ing as any).percent ?? 0);
    const activeRes = ActiveMatterEngine.resolveIngredientActive(ing);
    const activePurity = activeRes.activeMatterPct;
    const activePct = (rawPct * activePurity) / 100;
    const name = (ing.name || '').trim();
    const n = name.toLowerCase();
    const role = (ing.role || (ing as any).category || activeRes.category || getAuditedIngredientCategory(name)).toLowerCase();

    totalPct += rawPct;

    // Track for reasoning trace
    const canonId = Object.keys(INGREDIENT_INTELLIGENCE_REGISTRY).find(
      key => name.toLowerCase().includes(key.toLowerCase())
    ) || 'unknown';
    if (canonId !== 'unknown') {
      ingredientIds.push(canonId);
    }

    if (role.includes('anionic') || n.includes('labsa') || n.includes('sles') || n.includes('sls') || n.includes('aos')) {
      anionicActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    } else if (role.includes('nonionic') || n.includes('lae') || n.includes('ethoxylate') || n.includes('glucoside') || n.includes('apg')) {
      nonionicActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    } else if (role.includes('amphoteric') || n.includes('capb') || n.includes('betaine')) {
      amphotericActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    } else if (role.includes('cationic') || n.includes('esterquat') || n.includes('bkc') || n.includes('ctac')) {
      cationicActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    }

    if (n.includes('sodium chloride') || n.includes('salt') || n.includes('vacuum salt')) {
      saltPct += rawPct;
    }

    if (n.includes('citrate') || n.includes('citric acid') || n.includes('glda') || n.includes('edta') || n.includes('stpp')) {
      organicChelatorPct += rawPct;
    }

    if (n.includes('enzyme') || n.includes('protease') || n.includes('amylase') || n.includes('lipase')) {
      hasEnzyme = true;
    }
    if (n.includes('bleach') || n.includes('hypochlorite') || n.includes('percarbonate')) {
      hasBleach = true;
    }
    if (n.includes('preservative') || n.includes('kathon') || n.includes('phenoxy') || n.includes('benzoate') || n.includes('bit')) {
      hasPreservative = true;
    }
  }

  const calculatedPH = Number(input.calculatedPH ?? 8.5);

  // =============================================================================
  // LEVEL 1: HARD SCIENTIFIC & SAFETY CONSTRAINTS (PRIORITY 1)
  // =============================================================================

  // 1. Ionic Charge Conflict Check (Critical)
  if (anionicActivePct > 0.1 && cationicActivePct > 0.1) {
    issues.push({
      id: 'anionic-cationic-conflict',
      issue: 'Critical Ionic Precipitation Hazard (Anionic + Cationic Co-formulation)',
      whyItMatters: 'Anionic surfactants react stoichiometrically with Cationic agents to form insoluble, non-surface-active complex salts (coacervates), destroying washing properties.',
      scientificBasis: 'Electrostatic charge pairing coacervation and immediate phase precipitation.',
      scientificType: 'CALCULATED',
      severity: 'Critical',
      whatToCheck: 'Remove either anionic surfactants or cationic fabric conditioning agents.'
    });

    recommendations.push({
      id: 'rec-ionic-conflict',
      problem: 'Co-formulating opposing charge anionic and cationic surfactants.',
      why: 'Triggers mutual neutralization and rapid separation of insoluble complexes.',
      recommendedAction: 'Remove the cationic compound or substitute the anionic surfactant with a nonionic surfactant.',
      expectedEffect: 'Restores solubility and surface-active wetting capacity.',
      tradeOff: 'Removing cationic agents eliminates fiber-softening properties.',
      confidence: 'HIGH',
      recommendationType: 'REMOVE_INGREDIENT',
      authority: 'COMPATIBILITY_ENGINE',
      reasoningTrace: {
        reasoningId: 'trace-ionic-clash-' + Date.now(),
        productCategory: normCat,
        formulaVersion: '1.0.0',
        ingredientIds,
        relevantEngines: ['CompatibilityEngine'],
        inputData: { anionicActivePct, cationicActivePct },
        scientificOutputs: { compatibilityScore: 0, status: 'INCOMPATIBLE' },
        evidenceProvenance: 'THEORETICAL_PHYSICAL_CHEMISTRY',
        rulesTriggered: ['ANIONIC_CATIONIC_CHARGE_PAIR_COACERVATION'],
        uncertainty: 'HIGH_CONFIDENCE'
      }
    });
  }

  // 2. Extreme Caustic / Alkaline safety hazard (pH > 12)
  if (calculatedPH > 12.0 && !normCat.includes('DEGREASER')) {
    issues.push({
      id: 'extreme-alkaline-ph',
      issue: `Extreme Caustic Alkalinity Hazard (pH ${calculatedPH.toFixed(2)} > 12.0)`,
      whyItMatters: 'Excessive caustic alkalinity causes severe skin chemical burns, corrodes aluminum vessels, and hydrolyzes delicate fabric fibers.',
      scientificBasis: 'Hydroxide ion activity [OH-] > 10^-2 M causing rapid hydrolysis of proteins, cellulose, and lipids.',
      scientificType: 'CALCULATED',
      severity: 'Critical',
      whatToCheck: 'Reduce Caustic Soda / Sodium Hydroxide concentration, or buffer down with Citric Acid.'
    });

    recommendations.push({
      id: 'rec-ph-alkaline',
      problem: `Formula exhibits hazardous extreme alkalinity (pH ${calculatedPH.toFixed(2)}).`,
      why: 'Exceeds standard R&D dermal exposure and vessel safety envelopes.',
      recommendedAction: 'Reduce Caustic Soda or buffer with Citric Acid down to pH 8.0-10.0.',
      expectedEffect: 'Restores safe product skin compatibility and protects washing fibers.',
      tradeOff: 'Slightly reduces saponification rate of highly complex heavy cooking fats.',
      confidence: 'HIGH',
      recommendationType: 'REDUCE_DOSAGE',
      authority: 'SPECIFICATION_GATE',
      calculationBasis: 'Stoichiometric neutralization curve calculated via Newton-Raphson charge balance.'
    });
  }

  // 3. Extreme Acidic safety hazard (pH < 3.5)
  if (calculatedPH < 3.5 && !normCat.includes('TOILET') && !normCat.includes('BATHROOM') && !normCat.includes('SOFTENER')) {
    issues.push({
      id: 'extreme-acidic-ph',
      issue: `Unneutralized Extreme Acidic Hazard (pH ${calculatedPH.toFixed(2)} < 3.5)`,
      whyItMatters: 'Unneutralized acidic slurry (such as raw LABSA sulfonic acid) causes severe skin irritation and corrodes packaging equipment.',
      scientificBasis: 'Proton activity [H+] > 3 * 10^-4 M causing strong acid dermal irritations.',
      scientificType: 'CALCULATED',
      severity: 'Critical',
      whatToCheck: 'Neutralize with Caustic Soda (NaOH) or Monoethanolamine (MEA) up to neutral pH.'
    });

    recommendations.push({
      id: 'rec-ph-acidic',
      problem: `Formula contains raw unneutralized sulfonic acid (pH ${calculatedPH.toFixed(2)}).`,
      why: 'Acid slurry requires stoichiometric base neutralization to form active cleansing sodium alkylbenzene sulfonate salt.',
      recommendedAction: 'Increase Caustic Soda 50% dosage stoichiometrically until pH reaches 7.5 - 9.0.',
      expectedEffect: 'Neutralizes LABSA to functional, stable, high-foaming sodium sulfonate active matter.',
      tradeOff: 'Increases batch salt loading slightly, minor heat of neutralization released.',
      confidence: 'HIGH',
      recommendationType: 'INCREASE_DOSAGE',
      authority: 'SPECIFICATION_GATE',
      calculationBasis: 'Stoichiometric neutralization curve calculated via Newton-Raphson charge balance.'
    });
  }

  // =============================================================================
  // LEVEL 2: SPECIFICATION CONSTRAINTS (PRIORITY 2)
  // =============================================================================

  // 4. Category-Specific active matter deficiency
  if (totalActiveSurfactantPct < catContext.targetActiveMatterMin) {
    const deficit = catContext.targetActiveMatterMin - totalActiveSurfactantPct;
    issues.push({
      id: 'active-matter-deficit',
      issue: `Surfactant Active Matter Below Category Standard (Active ${totalActiveSurfactantPct.toFixed(1)}% < Target min ${catContext.targetActiveMatterMin.toFixed(1)}%)`,
      whyItMatters: 'Insufficient active surfactant levels fail to lower surface tension below soil wetting limits, causing severe loss of cleaning performance.',
      scientificBasis: 'Surfactant concentration must exceed Critical Micelle Concentration (CMC) under soil load to achieve soil micellization.',
      scientificType: 'CALCULATED',
      severity: 'High',
      whatToCheck: 'Increase primary surfactant (e.g. SLES 70% or LABSA 96%) concentration.'
    });

    // Governed dosage recommendation
    recommendations.push({
      id: 'rec-active-matter-increase',
      problem: `Formulation active matter (${totalActiveSurfactantPct.toFixed(1)}%) is below standard specifications.`,
      why: 'Leaves insufficient micellar surfactant capacity to emulsify particulates.',
      recommendedAction: `Increase SLES 70% dosage by ${(deficit / 0.7).toFixed(1)}% or LABSA 96% by ${(deficit / 0.96).toFixed(1)}% to reach target min active matter.`,
      expectedEffect: 'Restores detergency active matter to passing commercial levels.',
      tradeOff: 'Increases raw material unit batch costing.',
      confidence: 'HIGH',
      recommendationType: 'INCREASE_DOSAGE',
      authority: 'SPECIFICATION_GATE',
      calculationBasis: `dosage base: specification range target of ${catContext.targetActiveMatterMin}% active matter.`
    });
  }

  // =============================================================================
  // LEVEL 3: COMPATIBILITY CONSTRAINTS (PRIORITY 3)
  // =============================================================================

  // 5. Hard Water Chelation Deficit
  if (input.hardnessSufficiency === 'insufficient' || (waterHardness > 200 && organicChelatorPct === 0 && inorganicBuilderPct < 5)) {
    const dynamicReq = calculateDynamicChelatorRequirement(ingredients, waterHardness, 10, 20, 25);
    
    issues.push({
      id: 'chelation-deficit',
      issue: `Hard Water Chelation Deficit (${waterHardness} ppm hard water)`,
      whyItMatters: 'Unbound Ca2+ and Mg2+ water hardness ions bind and precipitate anionic surfactants (SLES/LABSA), causing complete loss of washing foaming.',
      scientificBasis: 'Surfactant-calcium precipitation solubility products (Ksp) causing inactivation.',
      scientificType: 'CALCULATED',
      severity: 'High',
      whatToCheck: `Add stoichiometric chelators like GLDA 47% or Sodium Citrate.`
    });

    if (dynamicReq.isSufficient) {
      recommendations.push({
        id: 'rec-chelation-balanced',
        problem: 'Sufficient chelating capacity is maintained for current hardness.',
        why: 'In-liquor calcium is fully sequestered.',
        recommendedAction: 'No action required for chelation.',
        expectedEffect: 'Protects detergency.',
        tradeOff: 'None',
        confidence: 'HIGH',
        recommendationType: 'NO_CHANGE',
        authority: 'COMPATIBILITY_ENGINE'
      });
    } else {
      recommendations.push({
        id: 'rec-chelation',
        problem: `Anionic surfactants are exposed to unsequestered ${waterHardness} ppm hard water ions.`,
        why: 'Triggers calcium-soap precipitate and graying on textiles.',
        recommendedAction: `Add exactly ${dynamicReq.additionalGLDA47RequiredPct}% GLDA 47% or ${dynamicReq.additionalCitrateRequiredPct}% Sodium Citrate to fully shield active matter.`,
        expectedEffect: 'Binds Ca2+/Mg2+ stoichiometrically, preserving surfactant foam.',
        tradeOff: 'Increases raw material cost, slightly increases formula salt burden.',
        confidence: 'HIGH',
        recommendationType: 'ADD_INGREDIENT',
        authority: 'COMPATIBILITY_ENGINE',
        calculationBasis: `deterministic calculation base: ${dynamicReq.calculationBasis}`,
        reasoningTrace: {
          reasoningId: 'trace-chelation-' + Date.now(),
          productCategory: normCat,
          formulaVersion: '1.0.0',
          ingredientIds,
          relevantEngines: ['ChelatorEngine'],
          inputData: { waterHardness, organicChelatorPct },
          scientificOutputs: { isSufficient: false, additionalGLDAPct: dynamicReq.additionalGLDA47RequiredPct },
          evidenceProvenance: 'PREDICTED_STABILITY',
          rulesTriggered: ['HARD_WATER_ANIONIC_PRECIPITATION'],
          uncertainty: 'HIGH_CONFIDENCE'
        }
      });
    }
  }

  // =============================================================================
  // LEVEL 4: CATEGORY-SPECIFIC AND RHEOLOGY/PERFORMANCE ENGINES (PRIORITY 4)
  // =============================================================================

  // 6. Enzyme + Bleach Oxidation Conflict
  if (hasEnzyme && hasBleach) {
    issues.push({
      id: 'enzyme-bleach-oxidation',
      issue: 'Enzyme-Bleach Oxidation Incompatibility',
      whyItMatters: 'Active oxygen or chlorine bleach ingredients oxidize catalytic sulfur amino acid residues in enzymes, inactivating them instantly in liquid formulations.',
      scientificBasis: 'Oxidative denaturing of disulfide bridges and enzyme structural backbones.',
      scientificType: 'EMPIRICAL',
      severity: 'High',
      whatToCheck: 'Remove enzymes or separate bleach into a stable dual-chamber pack.'
    });

    recommendations.push({
      id: 'rec-enzyme-bleach',
      problem: 'Co-formulating enzymatic catalysts with strong oxidizers.',
      why: 'Causes chemical denaturation of enzymes within minutes.',
      recommendedAction: 'Remove either the enzyme stabilizers or the oxidizer bleach from this liquid formulation.',
      expectedEffect: 'Preserves chemical stability and enzyme longevity.',
      tradeOff: 'Removing bleach reduces oxidation-based tea and fruit stain removal.',
      confidence: 'HIGH',
      recommendationType: 'REMOVE_INGREDIENT',
      authority: 'COMPATIBILITY_ENGINE'
    });
  }

  // 6.1 Enzyme pH Denaturation Check
  if (hasEnzyme && calculatedPH > 10.0) {
    issues.push({
      id: 'enzyme-ph-mismatch',
      issue: `Enzyme pH Denaturation Risk (pH ${calculatedPH.toFixed(2)} > 10.0)`,
      whyItMatters: 'Most standard liquid enzymes (protease, amylase) rapidly denature and lose catalytic activity at pH levels above 10.0 in liquid aqueous systems.',
      scientificBasis: 'Aqueous alkaline peptide backbone charge disruption and salt-bridge cleavage at high pH.',
      scientificType: 'EMPIRICAL',
      severity: 'High',
      whatToCheck: 'Reduce formulation pH to stable enzyme envelope (pH 7.5 - 9.0) or use pH-tolerant enzymes.'
    });

    recommendations.push({
      id: 'rec-enzyme-ph-adjust',
      problem: `Formulation pH (${calculatedPH.toFixed(2)}) causes rapid enzymatic catalyst denaturation.`,
      why: 'Enzyme tertiary structure is unstable at highly alkaline pH levels.',
      recommendedAction: 'Reduce pH with Citric Acid down below 9.0, or transition to specialty highly alkaline-stable bio-catalysts.',
      expectedEffect: 'Maintains long-term enzymatic protease stain cleavage activity.',
      tradeOff: 'Slightly reduces fatty acid saponification rate.',
      confidence: 'HIGH',
      recommendationType: 'REDUCE_DOSAGE',
      authority: 'COMPATIBILITY_ENGINE'
    });
  }

  // 7. Electrolyte Salting-Out Hazard
  if (saltPct > 3.5) {
    issues.push({
      id: 'electrolyte-salting-out',
      issue: `Excessive Salt Salting-Out Hazard (${saltPct}% NaCl)`,
      whyItMatters: 'High ionic strengths dehydrate hydrophilic surfactant micelle crowns, leading to cloud point collapse, phase separation, or precipitation.',
      scientificBasis: 'Hofmeister Series electrolyte dehydration of micellar double layers.',
      scientificType: 'EMPIRICAL',
      severity: 'High',
      whatToCheck: 'Reduce salt content down below 2.0%.'
    });

    recommendations.push({
      id: 'rec-salt-reduction',
      problem: `Excessive electrolyte content (${saltPct}% salt) destabilizes micellar matrix.`,
      why: 'Triggers phase splitting.',
      recommendedAction: 'Reduce Sodium Chloride salt down below 1.5%.',
      expectedEffect: 'Restores single-phase clear liquid surfactant stability.',
      tradeOff: 'Slightly reduces viscosity peak on standard salt-thickening curves.',
      confidence: 'HIGH',
      recommendationType: 'REDUCE_DOSAGE',
      authority: 'COMPATIBILITY_ENGINE',
      calculationBasis: 'governed engineering range limit of 3.5% NaCl.'
    });
  }

  // =============================================================================
  // DETAILED 13 CANONICAL PRODUCT CATEGORY CONSTRAINTS CHECK
  // =============================================================================

  // A. DISHWASH_AUTOMATIC low foam validation
  if (normCat === 'DISHWASH_AUTOMATIC') {
    if (anionicActivePct > 2.5) {
      issues.push({
        id: 'autodish-suds-overflow',
        issue: `High-Foaming Anionic Hazard in Automatic Dishwash (${anionicActivePct.toFixed(1)}% Anionic)`,
        whyItMatters: 'High sudsing in automatic machine dishwashers triggers pump motor cavitation, water leaks, machine lockouts, and poor spraying.',
        scientificBasis: 'Entrainment of atmospheric air in high-pressure rotating pumps causing air-locking.',
        scientificType: 'CALCULATED',
        severity: 'Critical',
        whatToCheck: 'Replace all high-foaming SLES/LABSA with low-foaming nonionic EO/PO block copolymers.'
      });

      recommendations.push({
        id: 'rec-autodish-foam-reduction',
        problem: 'Formulation contains high-suds anionic surfactants in automatic machine context.',
        why: 'Incompatible with dishwasher high-shear mechanical spray bars.',
        recommendedAction: 'Remove SLES/LABSA completely and substitute with low-foam nonionic alkoxylates or APG.',
        expectedEffect: 'Maintains zero-foam pump performance and full hydro-pressure.',
        tradeOff: 'Low-foam nonionics may have slightly slower manual grease cutting.',
        confidence: 'HIGH',
        recommendationType: 'REPLACE_INGREDIENT',
        authority: 'COMPATIBILITY_ENGINE'
      });
    }
  }

  // B. GLASS_CLEANER low active/residue validation
  if (normCat === 'GLASS_CLEANER') {
    if (totalActiveSurfactantPct > 3.0) {
      issues.push({
        id: 'glass-haze-streaking',
        issue: `Glass Cleaner Streaking Hazard (${totalActiveSurfactantPct.toFixed(1)}% Active Matter)`,
        whyItMatters: 'Excessive surfactant concentrations do not dry clear on smooth glass, leaving an optically hazy, smeary monolayer film.',
        scientificBasis: 'Surfactant crystallization and high non-volatile residue (NVR) on smooth hydrophobic surfaces.',
        scientificType: 'CALCULATED',
        severity: 'High',
        whatToCheck: 'Reduce active matter below 2.0% and include fast-drying Isopropanol or Glycol Ether solvents.'
      });

      recommendations.push({
        id: 'rec-glass-streak-reduction',
        problem: `Glass cleaner active surfactant percentage (${totalActiveSurfactantPct.toFixed(1)}%) is too high.`,
        why: 'Leaves crystalline smear trails upon dry-off.',
        recommendedAction: 'Reduce active surfactant below 1.5% and supplement with 5% Isopropanol solvent.',
        expectedEffect: 'Ensures instantaneous flash-off evaporation and zero-streak window clarity.',
        tradeOff: 'Lower active surfactant slightly reduces dirt solubilization rate for non-glass soils.',
        confidence: 'HIGH',
        recommendationType: 'REDUCE_DOSAGE',
        authority: 'SPECIFICATION_GATE',
        calculationBasis: 'deterministic calculation base: target glass non-volatile residue limit of 3.0%.'
      });
    }
  }

  // C. HAND_WASH skin neutral validation
  if (normCat === 'HAND_WASH') {
    if (calculatedPH > 7.8 || calculatedPH < 5.0) {
      issues.push({
        id: 'handwash-skin-irritation',
        issue: `Hand Wash Irritation Hazard (pH ${calculatedPH.toFixed(2)})`,
        whyItMatters: 'Human skin mantles naturally operate at acidic pH 5.5. Highly alkaline soaps cause dry epidermal cracking and strip natural protective sebum.',
        scientificBasis: 'Disruption of acidic stratum corneum enzymes and skin lipid bilayer integrity.',
        scientificType: 'CALCULATED',
        severity: 'High',
        whatToCheck: 'Buffer hand wash pH with Citric Acid down to 5.5 - 6.5.'
      });

      recommendations.push({
        id: 'rec-handwash-ph-buffer',
        problem: `Hand wash pH (${calculatedPH.toFixed(2)}) is outside the skin-compatible acid envelope.`,
        why: 'Hazards dermatitis and severe skin lipid stripping.',
        recommendedAction: 'Incorporate exactly 0.3% Citric Acid buffer to neutralize pH to 5.5 - 6.0.',
        expectedEffect: 'Maintains skin-neutral compatibility and protects dermal barrier.',
        tradeOff: 'Slightly reduces viscosity peak of SLES salt-thickening curve requiring minor NaCl adjustment.',
        confidence: 'HIGH',
        recommendationType: 'ADD_INGREDIENT',
        authority: 'SPECIFICATION_GATE',
        calculationBasis: 'formula template range target of skin-neutral pH 5.5.'
      });
    }
  }

  // D. TOILET_CLEANER acid descaling validation
  if (normCat === 'TOILET_CLEANER') {
    if (calculatedPH > 3.5) {
      issues.push({
        id: 'toilet-insufficient-acid',
        issue: `Toilet Cleaner Acid Deficit (pH ${calculatedPH.toFixed(2)} > 3.5)`,
        whyItMatters: 'Toilet bowl cleaners require strong acidic profiles to chemically dissolve calcium carbonate (limescale) and rust stains.',
        scientificBasis: 'Proton-promoted carbonate dissolution: CaCO3 + 2H+ -> Ca2+ + H2O + CO2.',
        scientificType: 'CALCULATED',
        severity: 'High',
        whatToCheck: 'Add Hydrochloric Acid (HCl), Sulfamic Acid, or Citric Acid down to pH < 2.5.'
      });

      recommendations.push({
        id: 'rec-toilet-acidify',
        problem: `Toilet cleaner formulation lack sufficient acidity (pH ${calculatedPH.toFixed(2)}) for scale removal.`,
        why: 'Requires active hydronium ions to drive carbonate descaling.',
        recommendedAction: 'Add Sulfamic Acid or Citric Acid down below pH 2.0.',
        expectedEffect: 'Enables rapid dissolution of hard-water calcium rings.',
        tradeOff: 'Highly acidic formulations require acid-stable rheology thickeners.',
        confidence: 'HIGH',
        recommendationType: 'ADD_INGREDIENT',
        authority: 'SPECIFICATION_GATE',
        calculationBasis: 'specification range target of toilet descaling pH < 3.5.'
      });
    }
  }

  // E. CAR_SHAMPOO neutral paint-safe validation
  if (normCat === 'CAR_SHAMPOO') {
    if (calculatedPH > 8.5 || calculatedPH < 6.0) {
      issues.push({
        id: 'carwash-wax-strip',
        issue: `Car Shampoo Clearcoat/Wax Stripping Hazard (pH ${calculatedPH.toFixed(2)})`,
        whyItMatters: 'Alkaline or acidic car shampoos chemically hydrolyze protective carnauba wax sealants, stripping clearcoat wax finish.',
        scientificBasis: 'Alkaline ester hydrolysis of carnauba wax wax-ester backbones.',
        scientificType: 'EMPIRICAL',
        severity: 'Medium',
        whatToCheck: 'Adjust pH with Citric Acid or NaOH strictly to neutral 6.8 - 7.5.'
      });

      recommendations.push({
        id: 'rec-carshampoo-neutralize',
        problem: `Car shampoo pH (${calculatedPH.toFixed(2)}) deviates from wax-safe neutrality.`,
        why: 'Hazards stripping paint wax finishes and dulling clearcoat.',
        recommendedAction: 'Neutralize formula to strict wax-safe neutral range of 7.0.',
        expectedEffect: 'Cleans road soil safely without stripping carnauba wax coatings.',
        tradeOff: 'Reduces raw dirt/grease saponification speed compared to heavy alkaline industrial cleaners.',
        confidence: 'HIGH',
        recommendationType: 'REDUCE_DOSAGE',
        authority: 'SPECIFICATION_GATE',
        calculationBasis: 'specification range neutral envelope (6.5 - 7.5).'
      });
    }
  }

  // F. FABRIC_SOFTENER missing cationic active validation
  if (normCat === 'FABRIC_SOFTENER') {
    if (cationicActivePct < 1.0) {
      issues.push({
        id: 'softener-missing-cationic',
        issue: 'Fabric Softener Cationic Conditioning Deficit',
        whyItMatters: 'Fabric softeners require cationic esterquats or dialkyl quaternary salts to deposit on cotton and neutralize negative laundry static.',
        scientificBasis: 'Cationic quaternary ammonium surfactant adsorption on cotton cellulose substrate.',
        scientificType: 'EMPIRICAL',
        severity: 'High',
        whatToCheck: 'Add 4.0 - 8.0% cationic Esterquat conditioning agent.'
      });

      recommendations.push({
        id: 'rec-softener-add-cationic',
        problem: 'Softener formulation lacks cationic quaternary ammonium active matter.',
        why: 'Fails to neutralize fabric static charges or lubricate fibers.',
        recommendedAction: 'Incorporate exactly 5.0% Dialkyl Esterquat active agent.',
        expectedEffect: 'Restores excellent textile softness and reduces static cling.',
        tradeOff: 'Increases formulation batch raw cost.',
        confidence: 'HIGH',
        recommendationType: 'ADD_INGREDIENT',
        authority: 'SPECIFICATION_GATE',
        calculationBasis: 'empirical model standard conditioning dosage of 5.0%.'
      });
    }
  }

  // G. KITCHEN_DEGREASER alkaline validation
  if (normCat === 'KITCHEN_DEGREASER') {
    if (calculatedPH < 11.0) {
      issues.push({
        id: 'degreaser-insufficient-alkalinity',
        issue: `Kitchen Degreaser Alkalinity Deficit (pH ${calculatedPH.toFixed(2)} < 11.0)`,
        whyItMatters: 'Kitchen and oven degreasers require highly alkaline matrices to saponify polymerised fats and hard baked grease.',
        scientificBasis: 'Alkaline fat saponification: Triglyceride + 3OH- -> Glycerol + 3 Soap salts.',
        scientificType: 'CALCULATED',
        severity: 'High',
        whatToCheck: 'Add Caustic Soda (NaOH) or Sodium Metasilicate to pH 11.5 - 13.0.'
      });

      recommendations.push({
        id: 'rec-degreaser-alkalinize',
        problem: `Oven/Kitchen degreaser alkalinity (pH ${calculatedPH.toFixed(2)}) is insufficient for baked-on grease removal.`,
        why: 'Baked carbonized oil polymers require highly concentrated OH- activity to split.',
        recommendedAction: 'Increase Caustic Soda or buffer with Sodium Metasilicate up to pH 12.5.',
        expectedEffect: 'Cleaves polymer grease instantly to form soluble soap salts.',
        tradeOff: 'Highly alkaline solutions require strict corrosive warning labels.',
        confidence: 'HIGH',
        recommendationType: 'INCREASE_DOSAGE',
        authority: 'SPECIFICATION_GATE',
        calculationBasis: 'specification range target of kitchen degreasing pH > 11.0.'
      });
    }
  }

  // =============================================================================
  // LEVEL 5 & 6: LAB TEST ADVISORY AND UNCERTAINTY RESOLUTION
  // =============================================================================

  // Viscosity, preservation, and stability unresolvable computationally -> Recommend Lab Test
  if (ingredients.length > 0 && !hasPreservative) {
    issues.push({
      id: 'preservative-deficit-warning',
      issue: 'Microbial Preservation Deficit',
      whyItMatters: 'Liquid detergent formulations containing high water fraction are highly susceptible to bacterial and mold contamination.',
      scientificBasis: 'Water activity (aw) supports fast bacterial proliferation in non-sterile conditions.',
      scientificType: 'EMPIRICAL',
      severity: 'Medium',
      whatToCheck: 'Add 0.5% Phenoxyethanol or 0.1% Kathon preservative.'
    });

    recommendations.push({
      id: 'rec-preservative-addition',
      problem: 'Formulation lacks broad-spectrum microbial preservation.',
      why: 'Hazards product contamination, off-odors, and turbidity.',
      recommendedAction: 'Add exactly 0.5% Phenoxyethanol preservative and run bacterial challenge test.',
      expectedEffect: 'Guarantees 24+ month product shelf preservation.',
      tradeOff: 'Adds minor cost impact.',
      confidence: 'HIGH',
      recommendationType: 'ADD_INGREDIENT',
      authority: 'GOVERNED_MODEL',
      calculationBasis: 'governed engineering range preservation threshold of 0.5% Phenoxyethanol.'
    });
  }

  // Always suggest lab test for properties that cannot be computed (viscosity salt curve, actual CMC)
  recommendations.push({
    id: 'rec-lab-viscosity-validation',
    problem: 'Actual viscosity salt-thickening curves cannot be deterministically computed in highly mixed systems.',
    why: 'Micellar elongation and peak gel viscosity depend on shear rates and raw material impurities.',
    recommendedAction: 'Perform Brookfield spindle viscosity validation across 0.5% to 2.5% NaCl increments.',
    expectedEffect: 'Maps the precise salt-curve thickening profile for manufacturing consistency.',
    tradeOff: 'Requires laboratory time.',
    confidence: 'MEDIUM',
    recommendationType: 'RUN_LAB_TEST',
    authority: 'LAB_EVIDENCE'
  });

  // =============================================================================
  // STRENGTHS COMPILATION
  // =============================================================================
  if (totalActiveSurfactantPct >= catContext.targetActiveMatterMin) {
    strengths.push({
      id: 'str-active-matter',
      title: `Optimal Active Matter (${totalActiveSurfactantPct.toFixed(1)}%)`,
      description: `Surfactant active concentration meets commercial performance standards for ${catContext.category}.`,
      scientificBasis: 'Sufficient micellar capacity for heavy soil load.',
      scientificType: 'CALCULATED'
    });
  }

  if (calculatedPH >= catContext.targetPHMin && calculatedPH <= catContext.targetPHMax) {
    strengths.push({
      id: 'str-ph-target',
      title: `Target pH Alignment (${calculatedPH.toFixed(2)})`,
      description: `Formulation equilibrium pH matches recommended range (${catContext.targetPHMin} - ${catContext.targetPHMax}) for ${catContext.category}.`,
      scientificBasis: 'Optimal ionization and substrate compatibility.',
      scientificType: 'CALCULATED'
    });
  } else {
    strengths.push({
      id: 'str-ph-target',
      title: `Calculated Speciation pH (${calculatedPH.toFixed(2)})`,
      description: `Charge balance equilibrium pH evaluated via activity coefficient model.`,
      scientificBasis: 'Newton-Raphson aqueous speciation.',
      scientificType: 'CALCULATED'
    });
  }

  if (hasPreservative) {
    strengths.push({
      id: 'str-preservative',
      title: 'Microbial Preservation Protected',
      description: 'Preservative active present to prevent bacterial/fungal spoilage.',
      scientificBasis: 'Broad-spectrum biocide micro-inhibitory concentration.',
      scientificType: 'EMPIRICAL'
    });
  }

  const hardWaterIssue = issues.find(i => i.id === 'chelation-deficit' || i.issue.toLowerCase().includes('hard water'));
  const hardWaterStatusText = waterHardness === 0
    ? 'Hard-water protection: Not evaluated at 0 ppm baseline.'
    : hardWaterIssue
    ? 'Hard-water protection: Needs Revision.'
    : 'Hard-water protection: Pass.';

  if (issues.length === 0) {
    strengths.push({
      id: 'str-balanced-formula',
      title: 'Balanced & Stable Formulation',
      description: `Formulation balance: Pass for evaluated parameters. ${hardWaterStatusText}`,
      scientificBasis: 'Multi-engine equilibrium charge and stability verification.',
      scientificType: 'CALCULATED'
    });
  } else if (!hardWaterIssue && issues.every(i => i.severity !== 'Critical')) {
    strengths.push({
      id: 'str-balanced-formula',
      title: 'Formulation Balance (Evaluated Parameters)',
      description: `Formulation balance: Pass for evaluated parameters. ${hardWaterStatusText}`,
      scientificBasis: 'Multi-engine equilibrium charge and stability verification.',
      scientificType: 'CALCULATED'
    });
  }

  // =============================================================================
  // STATUS VERDICT LOGIC & RESOLUTIONS
  // =============================================================================
  const criticalCount = issues.filter(i => i.severity === 'Critical').length;
  const highCount = issues.filter(i => i.severity === 'High').length;

  let overallStatus: 'PASS' | 'PASS WITH LIMITATIONS' | 'FAIL' = 'PASS';
  if (criticalCount > 0) overallStatus = 'FAIL';
  else if (highCount > 0) overallStatus = 'PASS WITH LIMITATIONS';

  // Conflict Resolution: If there is a Level 1 / Level 2 critical constraint failure, we ensure recommendations resolve them first
  if (overallStatus === 'FAIL') {
    // Elevate critical recommendations to top, filter out minor enhancements
    recommendations.sort((a, b) => {
      const aPriority = a.recommendationType === 'REMOVE_INGREDIENT' || a.recommendationType === 'REDUCE_DOSAGE' || a.recommendationType === 'INCREASE_DOSAGE' ? 1 : 0;
      const bPriority = b.recommendationType === 'REMOVE_INGREDIENT' || b.recommendationType === 'REDUCE_DOSAGE' || b.recommendationType === 'INCREASE_DOSAGE' ? 1 : 0;
      return bPriority - aPriority;
    });
  }

  return {
    sanityCheckPassed: criticalCount === 0,
    overallStatus,
    summarySentence: overallStatus === 'PASS'
      ? `Formulation is scientifically sound and well-balanced for ${catContext.category}.`
      : `Detected ${issues.length} formulation issue(s) requiring attention for ${catContext.category}.`,
    totalIssuesCount: issues.length,
    criticalIssuesCount: criticalCount,
    highIssuesCount: highCount,
    issues,
    strengths,
    recommendations,
    productCategoryContext: catContext
  };
}

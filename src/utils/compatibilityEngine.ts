import { FormulationIngredient } from '../types';
import { mapFormulationIngredientsToPHEngineInput } from './pHEngineAdapter';
import { calculatePHAdvanced } from './pHEngine';
import { calculateActiveSurfactants } from './activeMatterEngine';
import { getAuditedIngredientCategory } from './calculators';
import { getCategoryPHLimits } from './scientificRouter';
import { normalizeProductCategory, ProductCategoryId } from '../domain/productTaxonomy';
import { PHCalculationOptions } from '../domain/ph/types';

// ============================================================================
// PHASE 6 — COMPATIBILITY & FORMULATION STABILITY TYPES & MECHANISMS
// ============================================================================

export type CompatibilityMechanism =
  | 'ACID_BASE'
  | 'IONIC'
  | 'REDOX'
  | 'ENZYME'
  | 'PRESERVATIVE'
  | 'POLYMER_RHEOLOGY'
  | 'PHASE_STABILITY';

export type CompatibilitySeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type CompatibilityStatusSemantic =
  | 'INCOMPATIBLE'
  | 'COMPATIBLE_BY_RULE'
  | 'NO_KNOWN_CONFLICT'
  | 'REQUIRES_COMPATIBILITY_TEST'
  | 'UNKNOWN'
  | 'KNOWN_COMPATIBLE'
  | 'KNOWN_INCOMPATIBLE'
  | 'SCREENING_COMPATIBLE'
  | 'INSUFFICIENT_DATA';

export interface ExtendedCompatibilityAlert {
  id: string;
  title: string;
  severity: CompatibilitySeverity;
  mechanism: CompatibilityMechanism;
  message: string;
  recommendation?: string;
  affectedIngredients?: string[];
  condition?: string;
  categoryApplicability?: string[];
}

export interface PhysicalAndChemicalStabilitySummary {
  physicalStability: {
    status: 'STABLE' | 'RISK_OF_SEPARATION' | 'RISK_OF_PRECIPITATION' | 'UNSTABLE';
    score: number;
    details: string[];
  };
  chemicalStability: {
    status: 'STABLE' | 'RISK_OF_HYDROLYSIS' | 'RISK_OF_OXIDATION' | 'RISK_OF_DEGRADATION' | 'UNSTABLE';
    score: number;
    details: string[];
  };
  rheologicalStability: {
    status: 'STABLE' | 'VISCOSITY_COLLAPSE_RISK' | 'OVER_THICKENING_RISK' | 'GELATION_RISK' | 'UNSTABLE';
    score: number;
    details: string[];
  };
  overallStorageStatus: 'COMPUTATIONALLY_STABLE' | 'STABILITY_RISK' | 'LAB_STABILITY_REQUIRED' | 'LAB_STABILITY_FAILED' | 'LAB_STABILITY_VALIDATED';
}

export interface FormulationCompatibilityResult {
  compatible: boolean;
  compatibilityScore: number;
  alerts: Array<{
    id: string;
    title: string;
    severity: CompatibilitySeverity;
    message: string;
    recommendation?: string;
    mechanism?: CompatibilityMechanism;
    affectedIngredients?: string[];
    condition?: string;
  }>;
  warnings: string[];
  modelType?: string;
  riskLevel?: CompatibilitySeverity;
  keyPositiveFactors?: string[];
  keyNegativeFactors?: string[];
  limitations?: string;
  labValidationGuidance?: string;
  mechanismBreakdown?: Record<CompatibilityMechanism, { alertCount: number; maxSeverity: CompatibilitySeverity | 'NONE' }>;
  stabilitySummary?: PhysicalAndChemicalStabilitySummary;
  compatibilityStatusSemantic: CompatibilityStatusSemantic;
  evidenceStatus: 'KNOWN_COMPATIBLE' | 'KNOWN_INCOMPATIBLE' | 'SCREENING_COMPATIBLE' | 'UNKNOWN' | 'INSUFFICIENT_DATA';
}

// ============================================================================
// COMPATIBILITY CALCULATION ENGINE
// ============================================================================

export function calculateFormulationCompatibility(
  ingredients: FormulationIngredient[],
  estimatedPH?: number | string,
  categoryOrId?: string
): FormulationCompatibilityResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const canonicalCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY' = categoryOrId
    ? normalizeProductCategory(categoryOrId)
    : 'UNKNOWN_PRODUCT_CATEGORY';

  // 1. Resolve pH value
  let phVal = 7.5;
  if (typeof estimatedPH === 'number' && !isNaN(estimatedPH)) {
    phVal = estimatedPH;
  } else if (typeof estimatedPH === 'string' && estimatedPH.trim() !== '') {
    const parsed = parseFloat(estimatedPH);
    if (!isNaN(parsed)) {
      phVal = parsed;
    } else if (safeIngs.length > 0) {
      const phOpts: PHCalculationOptions | undefined =
        canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? { productCategory: canonicalCategory } : undefined;
      const mapped = mapFormulationIngredientsToPHEngineInput(safeIngs);
      const computed = calculatePHAdvanced(mapped, 100, phOpts).pH;
      if (typeof computed === 'number' && !isNaN(computed)) {
        phVal = computed;
      }
    }
  } else if (safeIngs.length > 0) {
    const phOpts: PHCalculationOptions | undefined =
      canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? { productCategory: canonicalCategory } : undefined;
    const mapped = mapFormulationIngredientsToPHEngineInput(safeIngs);
    const computed = calculatePHAdvanced(mapped, 100, phOpts).pH;
    if (typeof computed === 'number' && !isNaN(computed)) {
      phVal = computed;
    }
  }

  // 2. Classify ingredients by functional chemistry & percentage
  let waterPct = 0;
  let hasAnionic = false;
  let hasCationic = false;
  let hasPreservative = false;
  let hasEnzyme = false;
  let hasHydrotrope = false;
  let hasBleachOrOxidizer = false;
  let hasStrongAcid = false;
  let hasStrongAlkali = false;
  let hasAmmoniaOrQuatBiocide = false;
  let hasCarbonateOrBicarb = false;
  let hasSolvent = false;
  let hasPolymerThickener = false;
  let hasElectrolyteSalt = false;
  let hasFragranceOrOil = false;
  let hasEnzymeStabilizer = false;

  let totalElectrolytePct = 0;
  let fragranceOilPct = 0;
  let anionicPct = 0;
  let cationicPct = 0;

  const anionicIngs: string[] = [];
  const cationicIngs: string[] = [];
  const acidIngs: string[] = [];
  const alkaliIngs: string[] = [];
  const oxidizerIngs: string[] = [];
  const enzymeIngs: string[] = [];
  const preservativeIngs: string[] = [];

  for (const ing of safeIngs) {
    const name = (ing?.name || '').toLowerCase();
    const cat = (ing?.category || ing?.role || getAuditedIngredientCategory(ing?.name || '')).toLowerCase();
    const pct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0);

    if (pct <= 0) continue; // Explicit zero percentage ingredients are physically absent

    // Water
    if (name.includes('water') || name.includes('aqua') || (cat.includes('solvent') && name.includes('water'))) {
      waterPct += pct;
    }

    // Anionic
    if (
      cat.includes('anionic') ||
      name.includes('labsa') ||
      name.includes('sles') ||
      name.includes('sls') ||
      name.includes('aos') ||
      name.includes('sulfate') ||
      name.includes('sulphonate') ||
      name.includes('sulfonate') ||
      name.includes('soap')
    ) {
      // Exclude short-chain aryl hydrotropes (SCS, SXS) which lack surfactant micelle foaming properties
      if (!name.includes('cumene') && !name.includes('xylene') && !name.includes('scs') && !name.includes('sxs')) {
        hasAnionic = true;
        anionicPct += pct;
        anionicIngs.push(ing.name);
      }
    }

    // Cationic
    if (
      cat.includes('cationic') ||
      name.includes('quaternary') ||
      name.includes('quat') ||
      name.includes('cetrimonium') ||
      name.includes('behentrimonium') ||
      name.includes('benzalkonium') ||
      name.includes('esterquat')
    ) {
      hasCationic = true;
      cationicPct += pct;
      cationicIngs.push(ing.name);
    }

    // Preservatives / Biocides
    if (
      cat.includes('preservative') ||
      cat.includes('biocide') ||
      cat.includes('disinfectant') ||
      name.includes('preservative') ||
      name.includes('isothiazolinone') ||
      name.includes('formalin') ||
      name.includes('kathon') ||
      name.includes('phenoxyethanol') ||
      name.includes('paraben') ||
      name.includes('benzoate') ||
      name.includes('bkc') ||
      name.includes('benzalkonium') ||
      name.includes('chloroxylenol') ||
      name.includes('pcmx') ||
      name.includes('dmdm') ||
      name.includes('bronopol')
    ) {
      hasPreservative = true;
      preservativeIngs.push(ing.name);
      if (name.includes('bkc') || name.includes('benzalkonium')) {
        hasAmmoniaOrQuatBiocide = true;
      }
    }

    // Enzymes
    if (
      cat.includes('enzyme') ||
      name.includes('protease') ||
      name.includes('amylase') ||
      name.includes('lipase') ||
      name.includes('cellulase') ||
      name.includes('mannanase') ||
      name.includes('stainzyme') ||
      name.includes('savinase')
    ) {
      hasEnzyme = true;
      enzymeIngs.push(ing.name);
    }

    // Enzyme Stabilizer (Polyols, Borates, Calcium salts)
    if (
      name.includes('propylene glycol') ||
      name.includes('glycerin') ||
      name.includes('glycerol') ||
      name.includes('borax') ||
      name.includes('boric acid') ||
      name.includes('calcium chloride') ||
      name.includes('calcium formate')
    ) {
      hasEnzymeStabilizer = true;
    }

    // Hydrotropes
    if (
      cat.includes('hydrotrope') ||
      name.includes('sxs') ||
      name.includes('xylene') ||
      name.includes('coumene') ||
      name.includes('glycol') ||
      name.includes('urea')
    ) {
      hasHydrotrope = true;
    }

    // Oxidizers / Bleach
    if (
      name.includes('percarbonate') ||
      name.includes('peroxide') ||
      name.includes('hypochlorite') ||
      name.includes('bleach') ||
      cat.includes('bleach') ||
      cat.includes('oxidizer')
    ) {
      hasBleachOrOxidizer = true;
      oxidizerIngs.push(ing.name);
    }

    // Strong Acids
    if (
      name.includes('hydrochloric') ||
      name.includes('sulfamic') ||
      name.includes('phosphoric') ||
      name.includes('citric acid') ||
      name.includes('oxalic acid') ||
      cat.includes('acid')
    ) {
      hasStrongAcid = true;
      acidIngs.push(ing.name);
    }

    // Strong Alkali
    if (
      name.includes('sodium hydroxide') ||
      name.includes('caustic') ||
      name.includes('potassium hydroxide') ||
      name.includes('metasilicate') ||
      name.includes('sodium silicate')
    ) {
      hasStrongAlkali = true;
      alkaliIngs.push(ing.name);
    }

    // Carbonates / Bicarbonates
    if (name.includes('carbonate') || name.includes('bicarbonate') || name.includes('soda ash')) {
      hasCarbonateOrBicarb = true;
    }

    // Solvents
    if (
      cat.includes('solvent') ||
      name.includes('isopropanol') ||
      name.includes('ethanol') ||
      name.includes('glycol ether') ||
      name.includes('butyl carbitol') ||
      name.includes('dpm')
    ) {
      hasSolvent = true;
    }

    // Polymers / Thickeners
    if (
      cat.includes('polymer') ||
      cat.includes('thickener') ||
      name.includes('carbomer') ||
      name.includes('xanthan') ||
      name.includes('hydroxyethylcellulose') ||
      name.includes('hpmc') ||
      name.includes('polyacrylate') ||
      name.includes('polyquaternium')
    ) {
      hasPolymerThickener = true;
    }

    // Electrolyte Salts
    if (
      name.includes('sodium chloride') ||
      name.includes('salt') ||
      name.includes('sodium sulfate') ||
      name.includes('potassium chloride')
    ) {
      hasElectrolyteSalt = true;
      totalElectrolytePct += pct;
    }

    // Fragrance / Oils
    if (cat.includes('fragrance') || cat.includes('oil') || name.includes('fragrance') || name.includes('perfume') || name.includes('essential oil')) {
      hasFragranceOrOil = true;
      fragranceOilPct += pct;
    }
  }

  const alerts: ExtendedCompatibilityAlert[] = [];
  let penaltySum = 0;

  // ============================================================================
  // MECHANISM 1: IONIC INCOMPATIBILITY & CHARGE CLASHES
  // ============================================================================
  if (hasAnionic && hasCationic) {
    penaltySum += 30;
    alerts.push({
      id: 'anionic-cationic-incompatibility',
      title: 'Anionic / Cationic Interaction Hazard',
      mechanism: 'IONIC',
      severity: 'Critical',
      message: 'Opposite-charge surfactant systems (anionic and cationic) form insoluble ion-pair coacervation complexes resulting in precipitation, turbidity, loss of detergency, or loss of softening power.',
      recommendation: 'Verify phase stability or replace cationic component with amphoteric or nonionic co-surfactants.',
      affectedIngredients: [...anionicIngs, ...cationicIngs],
      condition: `Anionic active (${anionicPct.toFixed(1)}%) + Cationic active (${cationicPct.toFixed(1)}%)`
    });
  }

  // Fabric Softener Specific Anionic Contamination Check
  if (canonicalCategory === 'FABRIC_SOFTENER' && hasAnionic && anionicPct > 0.1) {
    penaltySum += 40;
    alerts.push({
      id: 'softener-anionic-contamination',
      title: 'Fabric Softener Anionic Contamination Failure',
      mechanism: 'IONIC',
      severity: 'Critical',
      message: 'Fabric softeners rely on cationic esterquats for fiber substantivity. Presence of anionic surfactant (>0.1%) causes catastrophic esterquat charge neutralization, emulsion breakdown, and total loss of fabric softening efficacy.',
      recommendation: 'Remove anionic surfactants completely from cationic fabric softener formulation.',
      affectedIngredients: anionicIngs,
      condition: `Fabric Softener containing ${anionicPct.toFixed(1)}% anionic surfactant`
    });
  }

  // Disinfectant Quat Inactivation (Cationic Quaternary Ammonium Biocides ONLY)
  const hasQuatBiocide =
    hasAmmoniaOrQuatBiocide ||
    safeIngs.some(i => {
      const n = (i.name || '').toLowerCase();
      const c = (i.category || i.role || '').toLowerCase();
      return (
        (n.includes('bkc') || n.includes('benzalkonium') || n.includes('quat') || n.includes('didecyl') || c.includes('quat')) &&
        (i.percentage ?? 0) > 0
      );
    });

  const isDisinfectantContext =
    canonicalCategory === 'MULTIPURPOSE_CLEANER' ||
    canonicalCategory === 'BATHROOM_CLEANER' ||
    canonicalCategory === 'FLOOR_CLEANER' ||
    (categoryOrId && categoryOrId.toUpperCase().includes('DISINFECTANT'));

  if (isDisinfectantContext && hasQuatBiocide && hasAnionic) {
    penaltySum += 35;
    alerts.push({
      id: 'quat-biocide-anionic-inactivation',
      title: 'Quat Biocide Anionic Inactivation Hazard',
      mechanism: 'IONIC',
      severity: 'Critical',
      message: 'Benzalkonium Chloride (BKC) / Quaternary ammonium biocides are completely inactivated by anionic surfactants through stoichiometric ion-pairing, destroying antimicrobial sanitization performance.',
      recommendation: 'Replace anionic surfactants with nonionic alcohol ethoxylates or amine oxides in quat disinfectant formulas.',
      affectedIngredients: [...cationicIngs, ...anionicIngs],
      condition: 'Quat Biocide + Anionic Surfactant matrix'
    });
  }

  // ============================================================================
  // MECHANISM 2: ACID / BASE INCOMPATIBILITY & GAS GENERATION
  // ============================================================================
  // Toxic Chlorine Gas Hazard: Bleach/Hypochlorite + Acid
  const hasHypochlorite = safeIngs.some(i => {
    const n = (i.name || '').toLowerCase();
    return (n.includes('hypochlorite') || n.includes('bleach')) && (i.percentage ?? 0) > 0;
  });

  if (hasHypochlorite && hasStrongAcid) {
    penaltySum += 50;
    alerts.push({
      id: 'chlorine-gas-hazard',
      title: 'CRITICAL HAZARD: Toxic Chlorine Gas Release',
      mechanism: 'ACID_BASE',
      severity: 'Critical',
      message: 'Combining hypochlorite bleach with acid (HCl, Sulfamic Acid, Citric Acid) generates hazardous toxic Chlorine Gas (Cl₂), posing lethal inhalation hazard.',
      recommendation: 'ISOLATE BLEACH AND ACID. Never combine hypochlorite bleach and acids in the same liquid formulation.',
      affectedIngredients: [...oxidizerIngs, ...acidIngs],
      condition: 'Bleach + Acid co-formulation'
    });
  }

  // Toxic Chloramine Gas Hazard: Bleach + Ammonia / Ammonium / Quat bases
  const hasAmmoniaOrAmmonium = safeIngs.some(i => {
    const n = (i.name || '').toLowerCase();
    const c = (i.category || i.role || '').toLowerCase();
    return (
      (n.includes('ammonia') ||
        n.includes('ammonium') ||
        n.includes('quat') ||
        n.includes('benzalkonium') ||
        c.includes('cationic')) &&
      (i.percentage ?? 0) > 0
    );
  });

  if (hasHypochlorite && hasAmmoniaOrAmmonium) {
    penaltySum += 50;
    alerts.push({
      id: 'chloramine-gas-hazard',
      title: 'CRITICAL HAZARD: Toxic Chloramine Gas Release',
      mechanism: 'ACID_BASE',
      severity: 'Critical',
      message: 'Combining hypochlorite bleach with ammonia or ammonium compounds generates toxic, volatile Chloramine Gas (NH₂Cl / NHCl₂), posing severe respiratory hazard.',
      recommendation: 'ISOLATE BLEACH AND AMMONIA. Remove ammonium compounds or bleach from formula.',
      affectedIngredients: [...oxidizerIngs, ...cationicIngs],
      condition: 'Bleach + Ammonia co-formulation'
    });
  }

  // Direct Strong Acid + Strong Alkali Direct Clash
  if (hasStrongAcid && hasStrongAlkali && phVal >= 3.0 && phVal <= 11.5) {
    const acidPctSum = safeIngs
      .filter(i => {
        const n = (i.name || '').toLowerCase();
        return (n.includes('hydrochloric') || n.includes('sulfamic') || n.includes('phosphoric') || n.includes('oxalic')) && !n.includes('labsa');
      })
      .reduce((s, i) => s + Number(i.percentage ?? 0), 0);
    const alkaliPctSum = safeIngs
      .filter(i => (i.name || '').toLowerCase().includes('hydroxide') || (i.name || '').toLowerCase().includes('metasilicate'))
      .reduce((s, i) => s + Number(i.percentage ?? 0), 0);

    if (acidPctSum > 1.0 && alkaliPctSum > 1.0) {
      penaltySum += 25;
      alerts.push({
        id: 'acid-alkali-direct-clash',
        title: 'Strong Acid / Strong Alkali Exothermic Neutralization Hazard',
        mechanism: 'ACID_BASE',
        severity: 'High',
        message: 'Co-formulating significant quantities of strong acid and strong alkali creates high heat of neutralization, rapid salt accumulation, and pH instability.',
        recommendation: 'Select either an acidic or alkaline formulation builder strategy rather than unbuffered counter-neutralization.',
        affectedIngredients: [...acidIngs, ...alkaliIngs],
        condition: `Acid (${acidPctSum.toFixed(1)}%) + Alkali (${alkaliPctSum.toFixed(1)}%)`
      });
    }
  }

  // Liquid Carbonate + Acid Effervescence/Venting Hazard
  if (waterPct > 20 && hasCarbonateOrBicarb && hasStrongAcid && phVal < 6.5) {
    penaltySum += 20;
    alerts.push({
      id: 'carbonate-acid-gas-generation',
      title: 'Liquid Carbonate / Acid CO₂ Gas Evolution Hazard',
      mechanism: 'ACID_BASE',
      severity: 'High',
      message: 'Aqueous formulations containing carbonates/bicarbonates at acidic pH (< 6.5) continuously evolve Carbon Dioxide (CO₂) gas, causing bottle swelling or explosion in sealed containers.',
      recommendation: 'Remove carbonate builders from acidic liquid formulas or use non-gassing chelation builders.',
      affectedIngredients: acidIngs,
      condition: 'Liquid Carbonate + Acid at pH < 6.5'
    });
  }

  // Extreme pH Hazards
  const categoryPHLimits = categoryOrId ? getCategoryPHLimits(categoryOrId) : null;
  const isCategoryExpectedLowPH = categoryPHLimits ? categoryPHLimits.min < 3.0 : false;
  const isCategoryExpectedHighPH = categoryPHLimits ? categoryPHLimits.max > 12.0 : false;

  const isExtremeLow = phVal < 3.0 && !isCategoryExpectedLowPH;
  const isExtremeHigh = phVal > 12.0 && !isCategoryExpectedHighPH;

  if (isExtremeLow || isExtremeHigh) {
    const isSkinCategory = ['HAND_WASH', 'DISHWASH_MANUAL', 'CAR_SHAMPOO'].includes(canonicalCategory);
    const severity: CompatibilitySeverity = isSkinCategory ? 'Critical' : 'High';

    penaltySum += 20;
    alerts.push({
      id: 'extreme-ph-hazard',
      title: 'Extreme pH Operational Hazard',
      mechanism: 'ACID_BASE',
      severity,
      message: `Formulation pH (${phVal.toFixed(1)}) presents severe corrosion, dermal barrier irritation, or chemical stability concerns for standard user contact.`,
      recommendation: 'Incorporate pH adjusters or buffering agents to target standard functional ranges.',
      condition: `Formulation pH = ${phVal.toFixed(1)}`
    });
  }

  // ============================================================================
  // MECHANISM 3: REDOX INCOMPATIBILITY
  // ============================================================================
  if (hasBleachOrOxidizer && hasEnzyme) {
    penaltySum += 30;
    alerts.push({
      id: 'oxidizer-enzyme-inactivation',
      title: 'Oxidizer / Enzyme Catalytic Inactivation Hazard',
      mechanism: 'REDOX',
      severity: 'High',
      message: 'Unencapsulated percarbonates/peroxides oxidatively cleave active site methionine/cysteine residues in Protease, Amylase, or Lipase enzymes, destroying enzymatic stain removal.',
      recommendation: 'Incorporate bleach activators/stabilizers, isolate enzymes into separate compartments, or use bleach-tolerant enzyme variants.',
      affectedIngredients: [...oxidizerIngs, ...enzymeIngs],
      condition: 'Oxidizer + Enzyme co-formulation'
    });
  }

  // ============================================================================
  // MECHANISM 4: ENZYME STABILITY & DENATURATION
  // ============================================================================
  if (hasEnzyme && (phVal < 5.5 || phVal > 10.5)) {
    penaltySum += 15;
    alerts.push({
      id: 'enzyme-ph-denaturation',
      title: 'Enzyme Activity / pH Stability Risk',
      mechanism: 'ENZYME',
      severity: 'High',
      message: `Enzymatic efficacy (protease, amylase, lipase) is significantly lost outside the optimal pH window (pH ${phVal.toFixed(1)} is outside 5.5 - 10.5) due to tertiary protein unfolding.`,
      recommendation: 'Maintain formulation pH within 6.0 - 10.0 or select pH-stabilized enzyme variants.',
      affectedIngredients: enzymeIngs,
      condition: `Enzyme at pH ${phVal.toFixed(1)}`
    });
  }

  if (canonicalCategory === 'LAUNDRY_LIQUID' && hasEnzyme && waterPct > 30 && !hasEnzymeStabilizer) {
    penaltySum += 10;
    alerts.push({
      id: 'liquid-enzyme-unstabilized-autolysis',
      title: 'Liquid Enzyme Autolysis Spoilage Risk',
      mechanism: 'ENZYME',
      severity: 'Medium',
      message: 'Aqueous liquid laundry detergents with enzymes require polyol or borate enzyme stabilizers (Propylene Glycol, Glycerin, Borax, or Calcium Formate) to prevent proteolytic autolysis during storage.',
      recommendation: 'Incorporate 2 - 5% Propylene Glycol or Glycerin with 0.5% Borax for enzyme stabilization.',
      affectedIngredients: enzymeIngs,
      condition: 'Liquid enzyme formula lacking polyol/borate stabilizer'
    });
  }

  // ============================================================================
  // MECHANISM 5: PRESERVATIVE SYSTEM & WATER ACTIVITY
  // ============================================================================
  const isSelfPreserving = phVal < 3.0 || phVal > 11.5;

  if (waterPct > 20 && !hasPreservative && !isSelfPreserving) {
    penaltySum += 10;
    alerts.push({
      id: 'missing-preservative',
      title: 'Microbial Spoilage Risk (Unpreserved Aqueous System)',
      mechanism: 'PRESERVATIVE',
      severity: 'High',
      message: 'Aqueous liquid formulations with high water activity (>20% water) are highly susceptible to bacterial and fungal growth over time if unpreserved.',
      recommendation: 'Incorporate a broad-spectrum preservative system (e.g., Phenoxyethanol, Kathon CG, or Sodium Benzoate) suited for target pH.',
      condition: `Aqueous formula (${waterPct.toFixed(1)}% water) without preservative`
    });
  }

  if (hasPreservative && phVal > 8.5) {
    penaltySum += 10;
    alerts.push({
      id: 'preservative-ph-mismatch',
      title: 'Preservative Alkaline Stability Risk',
      mechanism: 'PRESERVATIVE',
      severity: 'Medium',
      message: `Preservative systems like isothiazolinones (Kathon CG) exhibit accelerated nucleophilic hydrolysis and reduced efficacy in alkaline conditions (pH ${phVal.toFixed(1)} > 8.5).`,
      recommendation: 'Verify supplier pH stability data or select alkali-stable biocides (e.g., Phenoxyethanol or Benzyl Alcohol).',
      affectedIngredients: preservativeIngs,
      condition: `Preservative at alkaline pH ${phVal.toFixed(1)}`
    });
  }

  const hasOrganicAcidPreservative = safeIngs.some(i => {
    const n = (i.name || '').toLowerCase();
    return (n.includes('benzoate') || n.includes('sorbate') || n.includes('benzoic') || n.includes('sorbic')) && (i.percentage ?? 0) > 0;
  });

  if (hasOrganicAcidPreservative && phVal > 5.5) {
    penaltySum += 15;
    alerts.push({
      id: 'organic-acid-preservative-deactivation',
      title: 'Organic Acid Preservative Deactivation (pH > 5.5)',
      mechanism: 'PRESERVATIVE',
      severity: 'High',
      message: `Sodium Benzoate and Potassium Sorbate rely on the undissociated organic acid state (pKa ~4.2 - 4.8) for microbial cell wall penetration. At pH ${phVal.toFixed(1)} (> 5.5), >90% is ionized and completely inactive.`,
      recommendation: 'Lower formulation pH below 5.0 or replace with pH-independent preservative like Phenoxyethanol.',
      affectedIngredients: preservativeIngs,
      condition: `Organic Acid Preservative at pH ${phVal.toFixed(1)}`
    });
  }

  // ============================================================================
  // MECHANISM 6: POLYMER / RHEOLOGY COMPATIBILITY
  // ============================================================================
  if (waterPct > 20 && hasPolymerThickener && hasElectrolyteSalt && totalElectrolytePct > 3.0) {
    penaltySum += 15;
    alerts.push({
      id: 'polymer-electrolyte-viscosity-collapse',
      title: 'Polymer Electrolyte Viscosity Collapse Hazard',
      mechanism: 'POLYMER_RHEOLOGY',
      severity: 'High',
      message: `Salt-sensitive acrylic polymer thickeners (Carbomers, ASE/HASE) collapse their hydrodynamic volume in high electrolyte matrices (${totalElectrolytePct.toFixed(1)}% salt), causing severe viscosity loss and phase thinning.`,
      recommendation: 'Switch to electrolyte-tolerant thickeners (Xanthan Gum, HPMC) or reduce inorganic salt load.',
      condition: `Polymer thickener in high electrolyte load (${totalElectrolytePct.toFixed(1)}%)`
    });
  }

  // ============================================================================
  // MECHANISM 7: PHASE STABILITY, FOAM & EMULSION STABILITY
  // ============================================================================
  const totalActiveSurfactant = calculateActiveSurfactants(safeIngs);
  if (totalActiveSurfactant > 40 && !hasHydrotrope) {
    penaltySum += 10;
    alerts.push({
      id: 'high-active-matter-phase-instability',
      title: 'Phase Instability / Gelation Hazard',
      mechanism: 'PHASE_STABILITY',
      severity: 'Medium',
      message: `Formulations with high active surfactant content (${totalActiveSurfactant.toFixed(1)}% > 40%) without hydrotropes or co-solvents undergo hexagonal gelation or phase split.`,
      recommendation: 'Incorporate 1 - 3% hydrotrope or co-solvent (e.g., Sodium Xylene Sulfonate, Propylene Glycol, or Ethanol).',
      affectedIngredients: anionicIngs,
      condition: `Active Surfactant (${totalActiveSurfactant.toFixed(1)}%) without hydrotrope`
    });
  }

  // Unemulsified Fragrance/Oil Separation
  if (waterPct > 30 && hasFragranceOrOil && fragranceOilPct > 1.5 && totalActiveSurfactant < 3.0 && !hasSolvent) {
    penaltySum += 15;
    alerts.push({
      id: 'unemulsified-fragrance-phase-separation',
      title: 'Fragrance / Essential Oil Phase Separation Hazard',
      mechanism: 'PHASE_STABILITY',
      severity: 'Medium',
      message: `Fragrance or oil loading (${fragranceOilPct.toFixed(1)}%) in low-surfactant aqueous system (<3% active matter) without emulsifier (Polysorbate 20, PEG-40 HCO) will float and form oil droplets.`,
      recommendation: 'Premix fragrance with nonionic solubilizer (e.g., PEG-40 Hydrogenated Castor Oil at 1:3 ratio) before aqueous addition.',
      condition: `Fragrance Oil (${fragranceOilPct.toFixed(1)}%) with low surfactant surfactant solubilization capacity`
    });
  }

  // Automatic Dishwasher High-Foaming Surfactant Machine Hazard
  if (canonicalCategory === 'DISHWASH_AUTOMATIC' && hasAnionic && anionicPct > 0.5) {
    penaltySum += 40;
    alerts.push({
      id: 'autodish-foam-overflow-hazard',
      title: 'Automatic Dishwasher Machine Foam Overflow Hazard',
      mechanism: 'PHASE_STABILITY',
      severity: 'Critical',
      message: `Automatic dishwashers require zero-foam / low-foam detergency. Anionic surfactants (SLES, LABSA, SLS) create intense foaming, causing dishwasher pump cavitation and floor flooding.`,
      recommendation: 'Eliminate anionic surfactants. Use low-foaming EO/PO block copolymer nonionic surfactants.',
      affectedIngredients: anionicIngs,
      condition: `Auto Dishwasher detergent containing ${anionicPct.toFixed(1)}% anionic surfactant`
    });
  }

  // Glass Cleaner Streaking Hazard
  if (canonicalCategory === 'GLASS_CLEANER' && totalActiveSurfactant > 1.5) {
    penaltySum += 15;
    alerts.push({
      id: 'glass-cleaner-surfactant-streaking',
      title: 'Glass Cleaner Excessive Surfactant Streaking Risk',
      mechanism: 'PHASE_STABILITY',
      severity: 'Medium',
      message: `Glass cleaners require minimal non-volatile residue. Surfactant active matter (${totalActiveSurfactant.toFixed(1)}% > 1.5%) leaves heavy film residue, smearing, and streaking on glass surfaces.`,
      recommendation: 'Reduce surfactant active matter below 0.8% and rely on fast-evaporating solvent couplers (Isopropanol, Glycol Ether).',
      condition: `Glass Cleaner active surfactant = ${totalActiveSurfactant.toFixed(1)}%`
    });
  }

  // ============================================================================
  // SCORE & COMPATIBILITY DETERMINATION
  // ============================================================================
  const rawScore = 100 - penaltySum;
  const compatibilityScore = isNaN(rawScore) ? 100 : Math.max(0, Math.min(100, Math.round(rawScore)));

  const hasCriticalOrHigh = alerts.some(a => a.severity === 'Critical' || a.severity === 'High');
  const compatible = !hasCriticalOrHigh;
  const warnings = alerts.map(a => a.message);

  const keyPositiveFactors: string[] = [];
  const keyNegativeFactors: string[] = alerts.map(a => a.title);

  if (!hasAnionic || !hasCationic) {
    keyPositiveFactors.push('Charge compatibility: No opposing anionic-cationic precipitation pairs detected.');
  }
  if (waterPct > 20 && hasPreservative) {
    keyPositiveFactors.push('Preservation system incorporated for aqueous stability.');
  }
  if (totalActiveSurfactant <= 40 || hasHydrotrope) {
    keyPositiveFactors.push('Surfactant concentration within stable micellar dispersion boundaries.');
  }
  if (phVal >= 4.5 && phVal <= 11.5) {
    keyPositiveFactors.push(`pH balance (${phVal.toFixed(1)}) within safe operational window.`);
  }

  const modelType = 'Mechanism-Classified Deterministic Interaction Matrix (Phase 6)';
  const riskLevel: CompatibilitySeverity = alerts.some(a => a.severity === 'Critical')
    ? 'Critical'
    : alerts.some(a => a.severity === 'High')
    ? 'High'
    : alerts.some(a => a.severity === 'Medium')
    ? 'Medium'
    : 'Low';

  const limitations =
    'Predictive thermodynamic and charge compatibility matrix. Does not account for specific surfactant counter-ion packing or high-temperature cloud point depression without experimental confirmation.';
  const labValidationGuidance =
    'Oven stability testing (40-45°C, 3 months), freeze-thaw cyclicity (3 cycles, -5°C to 25°C), and centrifugation (3000 rpm, 30 min) recommended for batch release.';

  // Breakdown by mechanism
  const mechanisms: CompatibilityMechanism[] = [
    'ACID_BASE',
    'IONIC',
    'REDOX',
    'ENZYME',
    'PRESERVATIVE',
    'POLYMER_RHEOLOGY',
    'PHASE_STABILITY'
  ];

  const mechanismBreakdown = mechanisms.reduce((acc, mech) => {
    const mechAlerts = alerts.filter(a => a.mechanism === mech);
    let maxSev: CompatibilitySeverity | 'NONE' = 'NONE';
    if (mechAlerts.some(a => a.severity === 'Critical')) maxSev = 'Critical';
    else if (mechAlerts.some(a => a.severity === 'High')) maxSev = 'High';
    else if (mechAlerts.some(a => a.severity === 'Medium')) maxSev = 'Medium';
    else if (mechAlerts.some(a => a.severity === 'Low')) maxSev = 'Low';

    acc[mech] = { alertCount: mechAlerts.length, maxSeverity: maxSev };
    return acc;
  }, {} as Record<CompatibilityMechanism, { alertCount: number; maxSeverity: CompatibilitySeverity | 'NONE' }>);

  // Compute Stability Summary
  const stabilitySummary = evaluateFormulationStability(safeIngs, phVal, canonicalCategory, alerts);

  // Compute CompatibilityStatusSemantic and evidenceStatus
  let compatibilityStatusSemantic: CompatibilityStatusSemantic = 'UNKNOWN';
  let evidenceStatus: 'KNOWN_COMPATIBLE' | 'KNOWN_INCOMPATIBLE' | 'SCREENING_COMPATIBLE' | 'UNKNOWN' | 'INSUFFICIENT_DATA' = 'UNKNOWN';

  const hasUncharacterizedIngredients = safeIngs.some(ing => {
    const name = (ing?.name || '').toLowerCase().trim();
    const cat = (ing?.category || ing?.role || '').toLowerCase().trim();
    return name.includes('unknown') || name.includes('uncharacterized') || (cat.includes('unknown') && !name.includes('water'));
  });

  if (safeIngs.length === 0) {
    compatibilityStatusSemantic = 'UNKNOWN';
    evidenceStatus = 'INSUFFICIENT_DATA';
  } else if (!compatible || alerts.some(a => a.severity === 'Critical')) {
    compatibilityStatusSemantic = 'INCOMPATIBLE';
    evidenceStatus = 'KNOWN_INCOMPATIBLE';
  } else if (hasUncharacterizedIngredients) {
    compatibilityStatusSemantic = 'UNKNOWN';
    evidenceStatus = 'INSUFFICIENT_DATA';
    warnings.push('Formulation contains uncharacterized ingredient(s). Physical and chemical compatibility cannot be verified without complete chemical identity (INSUFFICIENT_DATA).');
  } else if (alerts.length === 0) {
    // Zero known chemical conflicts detected by rule matrix; physical storage stability requires experimental verification
    compatibilityStatusSemantic = 'NO_KNOWN_CONFLICT';
    evidenceStatus = 'SCREENING_COMPATIBLE';
  } else if (compatibilityScore >= 80) {
    compatibilityStatusSemantic = 'COMPATIBLE_BY_RULE';
    evidenceStatus = 'SCREENING_COMPATIBLE';
  } else {
    compatibilityStatusSemantic = 'REQUIRES_COMPATIBILITY_TEST';
    evidenceStatus = 'UNKNOWN';
  }

  return {
    compatible,
    compatibilityScore,
    alerts,
    warnings,
    modelType,
    riskLevel,
    keyPositiveFactors,
    keyNegativeFactors,
    limitations,
    labValidationGuidance,
    mechanismBreakdown,
    stabilitySummary,
    compatibilityStatusSemantic,
    evidenceStatus
  };
}

// ============================================================================
// FORMULATION STABILITY EVALUATOR (Physical, Chemical, Rheological)
// ============================================================================

export function evaluateFormulationStability(
  ingredients: FormulationIngredient[],
  phVal: number,
  categoryOrId?: string,
  existingAlerts?: ExtendedCompatibilityAlert[]
): PhysicalAndChemicalStabilitySummary {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const alerts = existingAlerts || [];

  const physicalDetails: string[] = [`Formulation pH = ${phVal.toFixed(1)}${categoryOrId ? ` (${categoryOrId})` : ''}.`];
  if (safeIngs.length === 0) {
    physicalDetails.push('Empty formula.');
  }
  const chemicalDetails: string[] = [];
  const rheologicalDetails: string[] = [];

  let physicalScore = 100;
  let chemicalScore = 100;
  let rheologicalScore = 100;

  // Evaluate physical stability risks
  const separationAlerts = alerts.filter(a => a.mechanism === 'PHASE_STABILITY' || a.id.includes('phase') || a.id.includes('separation'));
  if (separationAlerts.length > 0) {
    physicalScore -= 30 * separationAlerts.length;
    physicalDetails.push(...separationAlerts.map(a => a.message));
  } else {
    physicalDetails.push('Homogeneous single-phase micellar/aqueous dispersion predicted.');
  }

  const ionicPrecipAlerts = alerts.filter(a => a.mechanism === 'IONIC');
  if (ionicPrecipAlerts.length > 0) {
    physicalScore -= 40 * ionicPrecipAlerts.length;
    physicalDetails.push(...ionicPrecipAlerts.map(a => a.message));
  }

  // Evaluate chemical stability risks
  const chemicalAlerts = alerts.filter(a => a.mechanism === 'ACID_BASE' || a.mechanism === 'REDOX' || a.mechanism === 'ENZYME' || a.mechanism === 'PRESERVATIVE');
  if (chemicalAlerts.length > 0) {
    chemicalScore -= 25 * chemicalAlerts.length;
    chemicalDetails.push(...chemicalAlerts.map(a => a.message));
  } else {
    chemicalDetails.push('Chemical degradation/hydrolysis risks within standard storage tolerance.');
  }

  // Evaluate rheological stability risks
  const rheoAlerts = alerts.filter(a => a.mechanism === 'POLYMER_RHEOLOGY' || a.id.includes('gelation') || a.id.includes('viscosity'));
  if (rheoAlerts.length > 0) {
    rheologicalScore -= 30 * rheoAlerts.length;
    rheologicalDetails.push(...rheoAlerts.map(a => a.message));
  } else {
    rheologicalDetails.push('Viscosity and rheological yield stress structurally stable.');
  }

  physicalScore = Math.max(0, Math.min(100, physicalScore));
  chemicalScore = Math.max(0, Math.min(100, chemicalScore));
  rheologicalScore = Math.max(0, Math.min(100, rheologicalScore));

  const physicalStatus =
    physicalScore < 50 ? 'UNSTABLE' : physicalScore < 75 ? 'RISK_OF_SEPARATION' : physicalScore < 90 ? 'RISK_OF_PRECIPITATION' : 'STABLE';

  const chemicalStatus =
    chemicalScore < 50 ? 'UNSTABLE' : chemicalScore < 75 ? 'RISK_OF_DEGRADATION' : chemicalScore < 90 ? 'RISK_OF_HYDROLYSIS' : 'STABLE';

  const rheologicalStatus =
    rheologicalScore < 50 ? 'UNSTABLE' : rheologicalScore < 75 ? 'VISCOSITY_COLLAPSE_RISK' : rheologicalScore < 90 ? 'GELATION_RISK' : 'STABLE';

  // Overall Storage Status: Never mark LAB_STABILITY_VALIDATED without physical bench testing
  let overallStorageStatus: 'COMPUTATIONALLY_STABLE' | 'STABILITY_RISK' | 'LAB_STABILITY_REQUIRED' | 'LAB_STABILITY_FAILED' | 'LAB_STABILITY_VALIDATED' = 'COMPUTATIONALLY_STABLE';

  if (physicalScore < 70 || chemicalScore < 70 || rheologicalScore < 70) {
    overallStorageStatus = 'STABILITY_RISK';
  } else {
    overallStorageStatus = 'LAB_STABILITY_REQUIRED'; // Mandatory bench oven stability (45°C) required for shelf life validation
  }

  return {
    physicalStability: { status: physicalStatus, score: physicalScore, details: physicalDetails },
    chemicalStability: { status: chemicalStatus, score: chemicalScore, details: chemicalDetails },
    rheologicalStability: { status: rheologicalStatus, score: rheologicalScore, details: rheologicalDetails },
    overallStorageStatus
  };
}

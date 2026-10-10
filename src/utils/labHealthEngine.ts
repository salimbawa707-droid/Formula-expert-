import { FormulationIngredient } from '../types';
import { mapFormulationIngredientsToPHEngineInput } from './pHEngineAdapter';
import { calculatePHAdvanced } from './pHEngine';
import { normalizeProductCategory } from '../domain/productTaxonomy';
import { PHCalculationOptions } from '../domain/ph/types';

export interface LabHealthAlert {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  recommendation: string;
}

export interface LabHealthBreakdown {
  phScore: number;
  balScore: number;
  costScore: number;
  ecoScore: number;
  compScore: number;
  completenessScore: number;
}

export interface LabHealthResult {
  finalScore: number;
  score: number;
  rating: string;
  riskLevel: string;
  alerts: LabHealthAlert[];
  warnings: string[];
  breakdown: LabHealthBreakdown;
}

export function calculateLabHealthScore(
  input: any,
  phOverride?: number,
  productCategory?: string
): LabHealthResult {
  let ingredients: FormulationIngredient[] = [];
  let phVal: number | undefined = undefined;
  let category: string | undefined = productCategory;

  if (Array.isArray(input)) {
    ingredients = input;
    phVal = typeof phOverride === 'number' && !isNaN(phOverride) ? phOverride : undefined;
  } else if (input && typeof input === 'object') {
    category = input.productCategory || input.category || category;
    if (Array.isArray(input.analyzedIngs)) {
      ingredients = input.analyzedIngs;
    } else if (Array.isArray(input.ingredients)) {
      ingredients = input.ingredients;
    }
    if (typeof input.ph === 'number' && !isNaN(input.ph)) {
      phVal = input.ph;
    } else if (typeof phOverride === 'number' && !isNaN(phOverride)) {
      phVal = phOverride;
    }
  }

  const safeIngs = Array.isArray(ingredients) ? ingredients : [];

  // If pH is missing or NaN, calculate estimated pH using pHEngineAdapter or default to 7.0
  if (phVal === undefined || isNaN(phVal) || typeof phVal !== 'number') {
    if (safeIngs.length > 0) {
      try {
        const normCat = category ? normalizeProductCategory(category) : undefined;
        const phOpts: PHCalculationOptions | undefined = (normCat && normCat !== 'UNKNOWN_PRODUCT_CATEGORY') ? { productCategory: normCat } : undefined;
        const mapped = mapFormulationIngredientsToPHEngineInput(safeIngs);
        const phRes = calculatePHAdvanced(mapped, 100, phOpts);
        phVal = typeof phRes?.pH === 'number' && !isNaN(phRes.pH) ? phRes.pH : 7.0;
      } catch {
        phVal = 7.0;
      }
    } else {
      phVal = 7.0;
    }
  }

  let totalPenalties = 0;
  let phPenalty = 0;
  let rawMaterialPenalty = 0;
  let enzymePenalty = 0;
  let restrictedPenalty = 0;
  let unknownPenalty = 0;
  let otherPenalty = 0;

  const alerts: LabHealthAlert[] = [];

  // Filter ingredients with percentage > 0 (Explicit Zero Safety)
  const activeIngs = safeIngs.filter(ing => {
    const pct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0;
    return typeof pct === 'number' && !isNaN(pct) && pct > 0;
  });

  // 1. Operational pH Hazards (R&D / Handling Safety)
  if (phVal < 3.0) {
    phPenalty += 25;
    alerts.push({
      id: 'ph-extreme-acid',
      title: 'Extreme Acidic pH Hazard',
      severity: 'Critical',
      message: `Formulation pH (${phVal.toFixed(1)}) presents severe skin corrosion, eye damage, and acid chemical burn hazards during handling.`,
      recommendation: 'Incorporate alkaline neutralizing agents (e.g., NaOH, TEA, or Na2CO3) to adjust pH to standard target range (4.5 - 10.5).'
    });
  } else if (phVal < 4.5) {
    phPenalty += 10;
    alerts.push({
      id: 'ph-mild-acid',
      title: 'Mild Acidic Handling Precaution',
      severity: 'Medium',
      message: `Formulation pH (${phVal.toFixed(1)}) is mildly acidic; prolonged skin contact may cause mild dermal irritation.`,
      recommendation: 'Consider buffering with Sodium Citrate or mild alkali if skin-neutral mildness is required.'
    });
  } else if (phVal > 12.0) {
    phPenalty += 25;
    alerts.push({
      id: 'ph-extreme-alkali',
      title: 'Extreme Alkaline Caustic Hazard',
      severity: 'Critical',
      message: `Formulation pH (${phVal.toFixed(1)}) presents severe caustic chemical burn and eye damage hazards.`,
      recommendation: 'Neutralize excess alkalinity with organic acids (e.g., Citric Acid) or reduce strong builder loading.'
    });
  } else if (phVal > 10.5) {
    phPenalty += 10;
    alerts.push({
      id: 'ph-mild-alkali',
      title: 'Mild Alkaline Handling Precaution',
      severity: 'Medium',
      message: `Formulation pH (${phVal.toFixed(1)}) is mildly alkaline; requires standard glove protection during raw material blending.`,
      recommendation: 'Incorporate Citric Acid or acid buffering if neutral mildness is desired.'
    });
  }

  // 2. Raw Material Safety Hazards (Strong Acids, Caustic Alkalis, Enzymes, Volatiles, Dust)
  let hasStrongAcid = false;
  let hasStrongAlkali = false;
  let hasEnzymePowder = false;
  let hasEnzymeLiquid = false;
  let hasHeavyDust = false;
  let hasHighFragrance = false;
  let hasVolatileSolvent = false;

  for (const ing of activeIngs) {
    const name = (ing?.name || '').toLowerCase();
    const cat = (ing?.category || ing?.role || '').toLowerCase();
    const notes = (ing?.notes || '').toLowerCase();
    const pct = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0;

    // Strong Acid Check
    if (
      name.includes('labsa') || name.includes('acid slurry') || name.includes('sulfonic acid') ||
      name.includes('phosphoric acid') || name.includes('hydrochloric') || name.includes('sulfuric acid')
    ) {
      hasStrongAcid = true;
    }

    // Strong Alkali Check
    if (
      name.includes('caustic soda') || name.includes('naoh') || name.includes('sodium hydroxide') ||
      name.includes('koh') || name.includes('potassium hydroxide') || name.includes('sodium metasilicate')
    ) {
      hasStrongAlkali = true;
    }

    // Enzyme Check
    if (
      cat.includes('enzyme') || name.includes('protease') || name.includes('amylase') ||
      name.includes('lipase') || name.includes('cellulase') || name.includes('subtilisin') ||
      name.includes('savinase') || name.includes('stainzyme') || name.includes('enzyme')
    ) {
      if (name.includes('powder') || name.includes('granule') || name.includes('solid') || name.includes('dust') || notes.includes('powder')) {
        hasEnzymePowder = true;
      } else {
        hasEnzymeLiquid = true;
      }
    }

    // Bulk Powder Dust Hazard (Non-enzyme)
    if (
      pct >= 5.0 &&
      !cat.includes('enzyme') && !name.includes('enzyme') &&
      (name.includes('powder') || name.includes('soda ash') || name.includes('sodium carbonate powder') || name.includes('sls needles'))
    ) {
      hasHeavyDust = true;
    }

    // Fragrance / Allergen Check
    if (
      pct > 1.0 &&
      (cat.includes('fragrance') || cat.includes('perfume') || name.includes('fragrance') || name.includes('perfume') || name.includes('limonene') || name.includes('essential oil'))
    ) {
      hasHighFragrance = true;
    }

    // Volatile Solvent Check
    if (
      pct > 5.0 &&
      (name.includes('ethanol') || name.includes('isopropanol') || name.includes('ipa') || name.includes('methanol') || name.includes('acetone'))
    ) {
      hasVolatileSolvent = true;
    }

    // Restricted / Prohibited Ingredients Check
    if (
      pct > 0.1 &&
      (name.includes('nonylphenol') || name.includes('npe-') || name.includes('formaldehyde') || name.includes('borax') || name.includes('triclosan'))
    ) {
      restrictedPenalty += 20;
      alerts.push({
        id: `restricted-${name.replace(/[^a-z0-9]/gi, '-')}`,
        title: 'Restricted Raw Material Alert',
        severity: 'High',
        message: `Ingredient '${ing.name}' is flagged as a restricted raw material due to environmental or regulatory constraints.`,
        recommendation: 'Replace with eco-compliant alternatives (e.g. Alcohol Ethoxylates or GLDA).'
      });
    }

    // Unknown Ingredient Safety Check
    const knownKeywords = [
      'water', 'labsa', 'sles', 'sls', 'lae', 'capb', 'betaine', 'aod', 'aos', 'cde',
      'citrate', 'glda', 'edta', 'mgda', 'gluconate', 'stpp', 'carbonate', 'silicate',
      'zeolite', 'soda ash', 'naoh', 'koh', 'citric', 'protease', 'amylase', 'lipase',
      'cellulase', 'enzyme', 'kathon', 'phenoxyethanol', 'benzoate', 'isothiazolinone',
      'perfume', 'fragrance', 'color', 'dye', 'salt', 'sodium chloride', 'sulfate',
      'glycol', 'alcohol', 'glycerin', 'polymer', 'xanthan', 'cmc', 'surfactant', 'builder',
      'solvent', 'preservative', 'chelator', 'acid', 'base', 'alkali', 'thickener'
    ];
    const isKnown = knownKeywords.some(kw => name.includes(kw) || cat.includes(kw));
    if (!isKnown && pct > 0) {
      if (unknownPenalty < 6) { // cap unknown penalty at 6
        unknownPenalty += 2;
        alerts.push({
          id: `unknown-data-${name.replace(/[^a-z0-9]/gi, '-')}`,
          title: 'Unknown Safety Data Notice',
          severity: 'Low',
          message: `Ingredient '${ing.name}' safety profile is not cataloged in universal library; review supplier Safety Data Sheet (SDS) for handling guidance.`,
          recommendation: 'Obtain supplier SDS and update safety metadata.'
        });
      }
    }
  }

  // Handle Strong Acid Penalties
  if (hasStrongAcid) {
    if (phVal < 4.5) {
      rawMaterialPenalty += 15;
      alerts.push({
        id: 'strong-acid-unneutralized',
        title: 'Unneutralized Acid Slurry Hazard',
        severity: 'High',
        message: `Unneutralized raw surfactant acid present in low pH formulation (pH ${phVal.toFixed(1)}).`,
        recommendation: 'Incorporate alkaline neutralizing agent (e.g. Caustic Soda 50% or TEA) under temperature control.'
      });
    } else {
      rawMaterialPenalty += 5;
      alerts.push({
        id: 'strong-acid-neutralized',
        title: 'Raw Acid Handling Precaution',
        severity: 'Low',
        message: `Raw acid slurry incorporated in batch (neutralized to pH ${phVal.toFixed(1)}); handle neat acid with acid-resistant PPE during vessel charging.`,
        recommendation: 'Maintain PPE during acid addition phase.'
      });
    }
  }

  // Handle Strong Alkali Penalties
  if (hasStrongAlkali) {
    if (phVal > 10.5) {
      rawMaterialPenalty += 20;
      alerts.push({
        id: 'strong-alkali-unneutralized',
        title: 'High Caustic Alkali Load Hazard',
        severity: 'High',
        message: `Unneutralized caustic alkali present in high pH formulation (pH ${phVal.toFixed(1)}).`,
        recommendation: 'Adjust stoichiometry with organic acid or reduce free alkali percentage.'
      });
    } else {
      rawMaterialPenalty += 5;
      alerts.push({
        id: 'strong-alkali-neutralized',
        title: 'Caustic Neutralization Precaution',
        severity: 'Low',
        message: `Concentrated caustic alkali used in batch (neutralized to pH ${phVal.toFixed(1)}); observe exothermic dissolution safeguards during charging.`,
        recommendation: 'Control neutralization temperature below 60°C.'
      });
    }
  }

  // Handle Enzyme Penalties
  if (hasEnzymePowder) {
    enzymePenalty += 15;
    alerts.push({
      id: 'enzyme-powder-dust',
      title: 'Powder Enzyme Inhalation Hazard',
      severity: 'High',
      message: 'Powder enzyme preparation detected: Fine protein dust presents occupational respiratory sensitization hazard.',
      recommendation: 'Use dust-tight transfer hoppers, local exhaust ventilation, and FFP3 respirators during dry enzyme dumping.'
    });
  } else if (hasEnzymeLiquid) {
    enzymePenalty += 5;
    alerts.push({
      id: 'enzyme-liquid-sensitization',
      title: 'Liquid Enzyme Handling Precaution',
      severity: 'Low',
      message: 'Liquid enzyme preparation present: Minimal aerosolization risk; observe standard eye and dermal protection during charging.',
      recommendation: 'Avoid splash aerosolization during liquid dosing.'
    });
  }

  // Handle Bulk Powder Inhalation
  if (hasHeavyDust) {
    otherPenalty += 5;
    alerts.push({
      id: 'powder-dust-inhalation',
      title: 'Bulk Powder Dust Precaution',
      severity: 'Low',
      message: 'High percentage dry powder raw materials present; may generate nuisance dust during dry vessel loading.',
      recommendation: 'Use dust extraction during dry charging.'
    });
  }

  // Handle High Fragrance
  if (hasHighFragrance) {
    otherPenalty += 5;
    alerts.push({
      id: 'fragrance-sensitization',
      title: 'High Fragrance Sensitization Precaution',
      severity: 'Low',
      message: 'Elevated fragrance or allergen loading (>1.0%); observe skin sensitization precautions during neat oil metering.',
      recommendation: 'Ensure adequate room ventilation during fragrance addition.'
    });
  }

  // Handle Volatile Solvent
  if (hasVolatileSolvent) {
    otherPenalty += 10;
    alerts.push({
      id: 'volatile-solvent-flammable',
      title: 'Volatile Solvent Flammability Hazard',
      severity: 'Medium',
      message: 'Volatile solvent present (>5.0%): Vapour accumulation and flammability risk during high-speed agitation.',
      recommendation: 'Use explosion-proof vessel grounding and vapour extraction.'
    });
  }

  totalPenalties = phPenalty + rawMaterialPenalty + enzymePenalty + restrictedPenalty + unknownPenalty + otherPenalty;
  const rawScore = 100 - totalPenalties;
  const finalScore = isNaN(rawScore) ? 100 : Math.max(0, Math.min(100, Math.round(rawScore)));

  let rating = 'Safe / Low Hazard';
  if (finalScore >= 85) {
    rating = 'Safe / Low Hazard';
  } else if (finalScore >= 70) {
    rating = 'Moderate Hazard / Handling Precautions';
  } else if (finalScore >= 50) {
    rating = 'Elevated Safety Concern';
  } else {
    rating = 'High Safety Hazard';
  }

  const warnings = alerts.map(a => a.message);

  const breakdown: LabHealthBreakdown = {
    phScore: Math.max(0, Math.min(20, Math.round(20 - (phPenalty * 0.8)))),
    balScore: Math.max(0, Math.min(20, Math.round(20 - (rawMaterialPenalty * 0.8)))),
    costScore: 15,
    ecoScore: Math.max(0, Math.min(20, Math.round(20 - (restrictedPenalty * 0.8)))),
    compScore: Math.max(0, Math.min(15, Math.round(15 - (enzymePenalty * 0.8)))),
    completenessScore: Math.max(0, Math.min(10, Math.round(10 - unknownPenalty)))
  };

  return {
    finalScore,
    score: finalScore,
    rating,
    riskLevel: rating,
    alerts,
    warnings,
    breakdown,
  };
}
export type { LabHealthResult as LabHealthScoreResult };

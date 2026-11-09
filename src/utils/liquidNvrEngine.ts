/**
 * Liquid NVR / Non-Volatile Matter Calculation Engine
 * Dedicated, ingredient-based calculation for Liquid formulations.
 * Enforces strict data-driven integrity: Unknown ingredients do NOT default to 100% NVR.
 */

export interface FormulationIngredient {
  name: string;
  percentage?: number;
  percent?: number;
  role?: string;
  category?: string;
  nonVolatileFraction?: number; // 0.0 to 1.0 if known
  activeMatterPct?: number;
  activePercent?: number;
}

export type NVRStatus = 'COMPLETE' | 'INSUFFICIENT_DATA' | 'NVR_DATA_REQUIRED' | 'INVALID_INPUT';

export interface NVRResult {
  nvrPercentage: number | null;
  nvrMassKg: number | null;
  knownMassPercent: number;
  unknownMassPercent: number | null;
  dataCompleteness: number; // 0.0 to 100.0%
  status: NVRStatus;
  isComplete: boolean;
  unknownIngredients: string[];
  provenance: 'CALCULATED' | 'ESTIMATED' | 'LABORATORY_MEASURED' | 'INSUFFICIENT_DATA';
  dryingProtocolAssumed?: string;
  limitations?: string[];
}

/**
 * Calculates Non-Volatile Residue (NVR) for liquid formulations.
 * Distinguishes known volatile/non-volatile contributions from unknown ingredients.
 */
export function calculateLiquidNVR(
  ingredients: FormulationIngredient[],
  batchSizeKg?: number
): NVRResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const invalid = (reason: string, unknownIngredients: string[] = []): NVRResult => ({
    nvrPercentage: null,
    nvrMassKg: null,
    knownMassPercent: 0,
    unknownMassPercent: null,
    dataCompleteness: 0,
    status: 'INVALID_INPUT',
    isComplete: false,
    unknownIngredients,
    provenance: 'INSUFFICIENT_DATA',
    limitations: [reason, 'A complete 100% formulation and a valid batch size are required before finished-product NVR can be calculated.']
  });
  if (safeIngs.length === 0) return invalid('No ingredient composition was supplied.');
  if (typeof batchSizeKg !== 'number' || !Number.isFinite(batchSizeKg) || batchSizeKg <= 0) {
    return invalid('Batch size is missing or invalid; no 100 kg default is substituted.');
  }

  let knownNvrSum = 0;
  let knownMassSum = 0;
  let unknownMassSum = 0;
  const unknownIngredients: string[] = [];

  for (const [index, ing] of safeIngs.entries()) {
    const rawPercentage = ing.percentage ?? ing.percent;
    const percentage = rawPercentage === undefined || rawPercentage === null || (typeof rawPercentage === 'string' && rawPercentage.trim() === '')
      ? Number.NaN
      : Number(rawPercentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return invalid(`Ingredient ${ing.name || index + 1} has a missing or invalid percentage.`, [ing.name || 'Unknown Ingredient']);
    }
    if (percentage === 0) continue;

    let fraction = ing.nonVolatileFraction;
    if (fraction === undefined || fraction === null) {
      if (isKnownVolatile(ing)) {
        fraction = 0.0;
      } else if (ing.activeMatterPct !== undefined && !isNaN(Number(ing.activeMatterPct))) {
        fraction = Number(ing.activeMatterPct) / 100;
      } else if (ing.activePercent !== undefined && !isNaN(Number(ing.activePercent))) {
        fraction = Number(ing.activePercent) / 100;
      } else {
        const n = (ing.name || '').toLowerCase();
        if (n.includes('water') || n.includes('aqua')) {
          fraction = 0.0;
        } else if (n.includes('sles') || n.includes('laureth sulfate')) {
          fraction = 0.70;
        } else if (n.includes('labsa') || n.includes('acid slurry') || n.includes('sulfonic')) {
          fraction = 0.90;
        } else if (n.includes('capb') || n.includes('betaine')) {
          fraction = 0.30;
        } else if (n.includes('salt') || n.includes('sodium chloride') || n.includes('sulfate') || n.includes('carbonate') || n.includes('citrate') || n.includes('stpp') || n.includes('soda ash') || n.includes('builder')) {
          fraction = 1.0;
        } else if (n.includes('fragrance') || n.includes('perfume') || n.includes('preservative')) {
          fraction = 1.0;
        } else {
          fraction = 0.85;
        }
      }
    }

    if (Number.isFinite(fraction) && fraction >= 0 && fraction <= 1) {
      knownNvrSum += percentage * fraction;
      knownMassSum += percentage;
    } else {
      unknownMassSum += percentage;
      unknownIngredients.push(ing.name || 'Unknown Ingredient');
    }
  }

  const totalFormulaMass = knownMassSum + unknownMassSum;
  const knownMassPercent = Number(knownMassSum.toFixed(2));
  const unknownMassPercent = Number(unknownMassSum.toFixed(2));
  const dataCompleteness = totalFormulaMass > 0
    ? Number(((knownMassSum / totalFormulaMass) * 100).toFixed(1))
    : 0;
  const massBalanced = Math.abs(totalFormulaMass - 100) <= 0.05;
  const isComplete = unknownMassPercent === 0 && massBalanced;
  const status: NVRStatus = isComplete ? 'COMPLETE' : 'INSUFFICIENT_DATA';
  const provenance = isComplete ? 'CALCULATED' : 'INSUFFICIENT_DATA';

  const nvrPercentage = isComplete ? Number(knownNvrSum.toFixed(2)) : null;
  const nvrMassKg = isComplete ? Number(((nvrPercentage! / 100) * batchSizeKg).toFixed(3)) : null;

  return {
    nvrPercentage,
    nvrMassKg,
    knownMassPercent,
    unknownMassPercent,
    dataCompleteness,
    status,
    isComplete,
    unknownIngredients,
    provenance,
    dryingProtocolAssumed: 'Oven drying at 105°C ± 2°C (METHOD_NOT_VERIFIED; pending authoritative laboratory method citation)',
    limitations: [
      'Calculated value represents theoretical non-volatile solids based on ingredient specifications.',
      'Physical oven drying may show minor deviations due to water-of-crystallization retention or volatile co-solvent stripping.',
      'Laboratory gravimetric measurement is required for certified CoA release testing.',
      ...(!massBalanced ? [`Formula mass totals ${totalFormulaMass.toFixed(2)}%, not 100.00%; finished-product NVR is withheld.`] : []),
      ...(unknownMassPercent > 0 ? [`${unknownMassPercent.toFixed(2)}% of formula mass has unknown NVR contribution.`] : [])
    ]
  };
}

/**
 * Checks whether an ingredient is an explicitly documented volatile solvent or water carrier.
 */
export function isKnownVolatile(ing: FormulationIngredient): boolean {
  const name = (ing.name || '').toLowerCase().trim();
  const role = (ing.role || ing.category || '').toLowerCase().trim();

  // Water / Aqueous carriers
  if (
    /\bwater\b/.test(name) ||
    name === 'aqua' ||
    name === 'deionized water' ||
    name === 'demineralized water' ||
    name === 'di water' ||
    name === 'ro water'
  ) {
    return true;
  }

  // Volatile alcohols and organic solvents (0% NVR upon evaporation)
  if (
    name.includes('ethanol') ||
    name.includes('isopropyl alcohol') ||
    name.includes('isopropanol') ||
    /\bipa\b/.test(name) ||
    name.includes('denatured alcohol') ||
    name.includes('methanol') ||
    name.includes('acetone') ||
    role === 'volatile solvent' ||
    role === 'solvent base' ||
    (role.includes('solvent') && (name.includes('alcohol') || name.includes('water')))
  ) {
    return true;
  }

  return false;
}

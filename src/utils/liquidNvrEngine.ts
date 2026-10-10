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

export type NVRStatus = 'COMPLETE' | 'INSUFFICIENT_DATA' | 'NVR_DATA_REQUIRED';

export interface NVRResult {
  nvrPercentage: number;
  nvrMassKg: number;
  knownMassPercent: number;
  unknownMassPercent: number;
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
  batchSizeKg: number = 100
): NVRResult {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  
  let knownNvrSum = 0;
  let knownMassSum = 0;
  let unknownMassSum = 0;
  const unknownIngredients: string[] = [];

  for (const ing of safeIngs) {
    const percentage = Number(ing.percentage ?? ing.percent ?? 0);
    if (percentage <= 0) continue;

    if (ing.nonVolatileFraction !== undefined && ing.nonVolatileFraction !== null && !isNaN(ing.nonVolatileFraction)) {
      // Authoritative non-volatile fraction provided (clamped 0.0 to 1.0)
      const fraction = Math.max(0, Math.min(1.0, ing.nonVolatileFraction));
      knownNvrSum += percentage * fraction;
      knownMassSum += percentage;
    } else if (isKnownVolatile(ing)) {
      // Explicitly documented volatile / water solvent (0.0 NVR)
      knownNvrSum += 0.0;
      knownMassSum += percentage;
    } else {
      // Unknown volatility / NVR fraction: DO NOT assume 1.0 (100% NVR)!
      unknownMassSum += percentage;
      unknownIngredients.push(ing.name || 'Unknown Ingredient');
    }
  }

  const totalFormulaMass = knownMassSum + unknownMassSum;
  const knownMassPercent = Number(knownMassSum.toFixed(2));
  const unknownMassPercent = Number(unknownMassSum.toFixed(2));
  const dataCompleteness = totalFormulaMass > 0
    ? Number(((knownMassSum / totalFormulaMass) * 100).toFixed(1))
    : 100.0;

  const isComplete = unknownMassPercent === 0;
  const status: NVRStatus = isComplete ? 'COMPLETE' : 'INSUFFICIENT_DATA';
  const provenance = isComplete ? 'CALCULATED' : 'INSUFFICIENT_DATA';

  const nvrPercentage = Number(knownNvrSum.toFixed(2));
  const nvrMassKg = Number(((nvrPercentage / 100) * batchSizeKg).toFixed(3));

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
      'Laboratory gravimetric measurement is required for certified CoA release testing.'
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
    name.includes('water') ||
    name.includes('aqua') ||
    name.includes('deionized') ||
    name.includes('demineralized') ||
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
    name.includes('ipa') ||
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

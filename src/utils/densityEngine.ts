import { FormulationIngredient } from '../types';

export interface DensityCalculationResult {
  densityGPerCm3: number; // Density in g/cm³ (or kg/L) at 20°C
  densityKgPerM3: number; // Density in kg/m³
  specificGravity: number; // Dimensionless relative to water at 20°C (ρ_water = 0.9982 g/cm³)
  totalMassGrams: number;
  totalVolumeCm3: number;
  isIdealVolumeAdditivity: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  modelType: string;
  densityType: 'PREDICTED_DENSITY';
  densityStatus: 'PREDICTED' | 'SCREENING_ESTIMATE' | 'INSUFFICIENT_DATA';
  provenance: 'PREDICTED' | 'ESTIMATED' | 'INSUFFICIENT_DATA';
  unknownDensityIngredients?: string[];
  limitations?: string[];
  contributions: Array<{
    name: string;
    massPercentage: number;
    componentDensityGPerCm3: number;
    volumeCm3: number;
    volumeFraction: number;
  }>;
  notes: string;
}

export function getStandardComponentDensity(name: string): number | null {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('water') || n.includes('aqua') || n === 'di water' || n === 'ro water') return 1.000;
  if (n.includes('labsa') || n.includes('sulfonic') || n.includes('acid slurry')) {
    return n.includes('90') ? 1.050 : 1.060;
  }
  if (n.includes('sles') || n.includes('lauryl ether sulfate') || n.includes('laureth sulfate')) {
    return n.includes('28') ? 1.030 : 1.100;
  }
  if (n.includes('sls') || n.includes('sodium lauryl sulfate')) {
    return n.includes('30') ? 1.040 : 1.100;
  }
  if (n.includes('capb') || n.includes('betaine')) {
    return n.includes('45') ? 1.070 : 1.045;
  }
  if (n.includes('cdea') || n.includes('cocamide dea') || n.includes('diethanolamide')) return 1.000;
  if (n.includes('cmea') || n.includes('cocamide mea')) return 1.020;
  if (n.includes('lae') || n.includes('ethoxylate') || n.includes('np-9') || n.includes('lutensol')) return 1.010;
  if (n.includes('apg') || n.includes('glucoside')) return 1.100;
  if (n.includes('naoh') || n.includes('caustic soda') || n.includes('sodium hydroxide')) {
    if (n.includes('48%') || n.includes('lye (48%)')) return 1.510;
    if (n.includes('50%') || n.includes('lye (50%)')) return 1.530;
    return 1.450;
  }
  if (n.includes('koh') || n.includes('potassium hydroxide')) return 1.450;
  if (n.includes('soda ash') || n.includes('sodium carbonate')) return 1.200;
  if (n.includes('sodium sulfate') || n.includes('sulfate')) return 1.200;
  if (n.includes('sodium chloride') || n.includes('salt') || n.includes('vacuum salt')) return 1.200;
  if (n.includes('sodium citrate') || n.includes('citrate')) return 1.180;
  if (n.includes('citric acid')) return 1.150;
  if (n.includes('glda') || n.includes('dissolvine')) return 1.300;
  if (n.includes('edta')) return 1.280;
  if (n.includes('mgda') || n.includes('trilon')) return 1.280;
  if (n.includes('glycerin') || n.includes('glycerol')) return 1.260;
  if (n.includes('propylene glycol') || n.includes('pg')) return 1.036;
  if (n.includes('ethanol') || n.includes('alcohol')) return 0.805;
  if (n.includes('isopropanol') || n.includes('ipa')) return 0.786;
  if (n.includes('fragrance') || n.includes('perfume') || n.includes('essential oil')) return 0.950;
  if (n.includes('preservative') || n.includes('kathon') || n.includes('phenoxyethanol')) return 1.050;
  if (n.includes('xanthan') || n.includes('carbomer') || n.includes('hpmc') || n.includes('cmc')) return 1.150;
  return null;
}

export function calculateDensity(
  ingredients: FormulationIngredient[] = [],
  totalBatchMassGrams: number = 100
): DensityCalculationResult {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  const unavailable = (
    reason: string,
    unknownDensityIngredients: string[] = []
  ): DensityCalculationResult => ({
    densityGPerCm3: Number.NaN,
    densityKgPerM3: Number.NaN,
    specificGravity: Number.NaN,
    totalMassGrams: Number.NaN,
    totalVolumeCm3: Number.NaN,
    isIdealVolumeAdditivity: true,
    confidence: 'LOW',
    modelType: 'NOT_EVALUATED',
    densityType: 'PREDICTED_DENSITY',
    densityStatus: 'INSUFFICIENT_DATA',
    provenance: 'INSUFFICIENT_DATA',
    unknownDensityIngredients,
    limitations: [reason, 'A measured density (e.g. pycnometer/digital density meter) is required for production or packaging decisions.'],
    contributions: [],
    notes: `INSUFFICIENT_DATA: ${reason}`
  });

  if (safeList.length === 0) {
    return unavailable('No ingredient composition was supplied; pure-water density is not substituted for an empty formula.');
  }
  if (!Number.isFinite(totalBatchMassGrams) || totalBatchMassGrams <= 0) {
    return unavailable('Total batch mass must be a finite value greater than zero.');
  }

  let totalPercentage = 0;
  let totalMass = 0;
  let totalVolume = 0;
  let hasReferenceDensity = false;
  const unknownDensityIngredients: string[] = [];
  const rawContributions: Array<{
    name: string;
    massPercentage: number;
    componentDensityGPerCm3: number;
    volumeCm3: number;
  }> = [];

  for (const [index, ing] of safeList.entries()) {
    const rawPctValue = ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula;
    const rawPct = rawPctValue === undefined || rawPctValue === null || (typeof rawPctValue === 'string' && rawPctValue.trim() === '')
      ? Number.NaN
      : Number(rawPctValue);
    if (!Number.isFinite(rawPct) || rawPct < 0 || rawPct > 100) {
      return unavailable(`Ingredient ${ing?.name || index + 1} has a missing or invalid percentage.`);
    }
    totalPercentage += rawPct;
  }

  if (Math.abs(totalPercentage - 100) > 0.05) {
    return unavailable(`Ingredient percentages sum to ${totalPercentage.toFixed(3)}%, not 100.000%; final mixture density cannot be calculated.`);
  }

  for (const ing of safeList) {
    const rawPct = Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula);
    if (rawPct === 0) continue;
    const name = ing.name || 'Component';
    const explicitDensity = typeof ing.density === 'number' && Number.isFinite(ing.density) && ing.density > 0.1
      ? ing.density
      : undefined;
    const stdDensity = getStandardComponentDensity(name);
    if (explicitDensity === undefined && stdDensity === null) {
      unknownDensityIngredients.push(name);
      continue;
    }

    if (explicitDensity === undefined) hasReferenceDensity = true;
    const compDensity = explicitDensity ?? stdDensity!;
    const compMassG = (rawPct / 100) * totalBatchMassGrams;
    const compVolCm3 = compMassG / compDensity;
    totalMass += compMassG;
    totalVolume += compVolCm3;
    rawContributions.push({
      name,
      massPercentage: rawPct,
      componentDensityGPerCm3: compDensity,
      volumeCm3: compVolCm3
    });
  }

  if (unknownDensityIngredients.length > 0) {
    return unavailable(
      'One or more ingredient component densities are unavailable. Unknown densities are not replaced with 1.000 g/cm³.',
      unknownDensityIngredients
    );
  }
  if (!Number.isFinite(totalMass) || !Number.isFinite(totalVolume) || totalMass <= 0 || totalVolume <= 0) {
    return unavailable('No valid positive-mass ingredient contributions were available for density calculation.');
  }

  const mixDensityGPerCm3 = totalMass / totalVolume;
  const densityKgPerM3 = mixDensityGPerCm3 * 1000.0;
  const specificGravity = mixDensityGPerCm3 / 0.9982;
  const contributions = rawContributions.map(c => ({
    name: c.name,
    massPercentage: Number(c.massPercentage.toFixed(2)),
    componentDensityGPerCm3: Number(c.componentDensityGPerCm3.toFixed(3)),
    volumeCm3: Number(c.volumeCm3.toFixed(3)),
    volumeFraction: Number((c.volumeCm3 / totalVolume).toFixed(4))
  }));

  return {
    densityGPerCm3: Number(mixDensityGPerCm3.toFixed(3)),
    densityKgPerM3: Number(densityKgPerM3.toFixed(1)),
    specificGravity: Number(specificGravity.toFixed(3)),
    totalMassGrams: Number(totalMass.toFixed(2)),
    totalVolumeCm3: Number(totalVolume.toFixed(2)),
    isIdealVolumeAdditivity: true,
    confidence: hasReferenceDensity ? 'LOW' : 'MEDIUM',
    modelType: 'IDEAL_VOLUME_ADDITIVITY_SCREENING',
    densityType: 'PREDICTED_DENSITY',
    densityStatus: 'SCREENING_ESTIMATE',
    provenance: 'ESTIMATED',
    unknownDensityIngredients: undefined,
    limitations: [
      'Uses ideal volume additivity: rho_mix = total mass / sum(component mass / component density).',
      'Built-in component densities are generic screening references, not grade-specific supplier or laboratory measurements.',
      'Non-ideal excess volume of mixing is not modelled.',
      'Empirical pycnometer or digital density-meter measurement is required for packaging and production specifications.'
    ],
    contributions,
    notes: hasReferenceDensity
      ? 'SCREENING ESTIMATE: One or more generic reference densities were used. Do not treat this value as verified.'
      : 'SCREENING ESTIMATE: User-supplied component densities were used with ideal volume additivity. Independent measurement is still required.'
  };
}

export function calculateTotalSolids(ingredients: FormulationIngredient[]): number {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  return Number(safeIngs.reduce((acc, ing) => {
    const name = (ing?.name || '').toLowerCase();
    const role = (ing?.role || (ing as any)?.category || '').toLowerCase();
    const isVolatile = name.includes('water') || name.includes('aqua') || name.includes('alcohol') || name.includes('ipa') || name.includes('ethanol') || role.includes('solvent');
    const pct = Number((ing as any)?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0);
    const solidFraction = isVolatile && (name.includes('water') || name.includes('aqua') || name.includes('alcohol') || name.includes('ipa') || name.includes('ethanol')) ? 0 : 1;
    return acc + (pct * solidFraction);
  }, 0).toFixed(2));
}

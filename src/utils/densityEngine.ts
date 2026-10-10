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
  densityStatus: 'PREDICTED' | 'SCREENING_ESTIMATE';
  provenance: 'PREDICTED';
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
  if (safeList.length === 0) {
    return {
      densityGPerCm3: 1.000,
      densityKgPerM3: 1000.0,
      specificGravity: 1.002,
      totalMassGrams: totalBatchMassGrams,
      totalVolumeCm3: totalBatchMassGrams,
      isIdealVolumeAdditivity: true,
      confidence: 'HIGH',
      modelType: 'Pure Water Reference (20°C)',
      densityType: 'PREDICTED_DENSITY',
      densityStatus: 'PREDICTED',
      provenance: 'PREDICTED',
      contributions: [],
      notes: 'No ingredients provided. Defaulting to pure water baseline at 20°C (1.000 g/cm³).'
    };
  }

  let totalMass = 0;
  let totalVolume = 0;
  let hasUncertainDensity = false;
  const unknownDensityIngredients: string[] = [];

  const rawContributions: Array<{
    name: string;
    massPercentage: number;
    componentDensityGPerCm3: number;
    volumeCm3: number;
  }> = [];

  safeList.forEach(ing => {
    const rawPct = Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0);
    if (rawPct <= 0) return;
    const name = ing.name || 'Component';
    const explicitDensity = typeof ing.density === 'number' && ing.density > 0.1 ? ing.density : undefined;
    const stdDensity = getStandardComponentDensity(name);
    
    if (explicitDensity === undefined && stdDensity === null) {
      hasUncertainDensity = true;
      unknownDensityIngredients.push(name);
    }

    const compDensity = explicitDensity || stdDensity || 1.000;

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
  });

  if (totalMass <= 0 || totalVolume <= 0) {
    return {
      densityGPerCm3: 1.000,
      densityKgPerM3: 1000.0,
      specificGravity: 1.002,
      totalMassGrams: totalBatchMassGrams,
      totalVolumeCm3: totalBatchMassGrams,
      isIdealVolumeAdditivity: true,
      confidence: 'HIGH',
      modelType: 'Pure Water Reference (20°C)',
      densityType: 'PREDICTED_DENSITY',
      densityStatus: 'PREDICTED',
      provenance: 'PREDICTED',
      contributions: [],
      notes: 'Empty or zero active mass. Defaulting to pure water baseline.'
    };
  }

  const mixDensityGPerCm3 = totalMass / totalVolume;
  const densityKgPerM3 = mixDensityGPerCm3 * 1000.0;
  const specificGravity = mixDensityGPerCm3 / 0.9982; // Relative to water at 20°C

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
    confidence: hasUncertainDensity ? 'LOW' : 'HIGH',
    modelType: hasUncertainDensity ? 'Partial Ideal Volume Additivity (Estimated Density)' : 'Ideal Harmonic Volume Additivity',
    densityType: 'PREDICTED_DENSITY',
    densityStatus: hasUncertainDensity ? 'SCREENING_ESTIMATE' : 'PREDICTED',
    provenance: 'PREDICTED',
    unknownDensityIngredients: hasUncertainDensity ? unknownDensityIngredients : undefined,
    limitations: [
      'Assumes ideal volume additivity [ρ_mix = Σ m_i / Σ (m_i / ρ_i)].',
      'Does not model non-ideal excess volume of mixing (contraction or expansion) in concentrated polar solvent/surfactant systems.',
      'Empirical pycnometer or digital density meter measurement is required for certified packaging density.'
    ],
    contributions,
    notes: hasUncertainDensity
      ? 'Formulation contains ingredients with missing/unknown component density. Mixture density is ESTIMATED / INSUFFICIENT_DATA and cannot be reported with HIGH confidence.'
      : 'Mixture density calculated via ideal volume additivity [ρ_mix = Σ m_i / Σ (m_i / ρ_i)]. Minor excess volume of mixing (<1%) may occur in concentrated alcohol/glycol blends.'
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

import { FormulationIngredient } from '../types';
import { calculateWaterHardnessTolerance } from './chelatorEngine';

export type ClimatePreset = 'Temperate' | 'Hot & Humid Tropical' | 'Cold Northern' | 'Arid / Desert';
export type WaterHardnessPreset = 'Soft (< 60 ppm)' | 'Medium (60-120 ppm)' | 'Hard (120-180 ppm)' | 'Very Hard (> 180 ppm)';

export interface ClimateRecommendation {
  id?: string;
  preservativeAdjustment?: string;
  viscosityAdjustment?: string;
  chelatorAdjustment?: string;
  cloudPointWarning?: string;
  climateInfo?: any;
  hardnessInfo?: any;
  calculatedHardnessTolerance?: string;
  isHardnessExceeded?: boolean;
  expectedStabilityScore?: number;
  thermalRisks?: string[];
  recommendations?: any[];
  industrialNotes?: string[];
  recommendedWaterPct?: number;
  saltStrategyNote?: string;
  reason?: string;
  title?: string;
  suggestedIngredientName?: string;
  suggestedPct?: number;
  category?: string;
  suggestedAction?: string;
  targetIngredientName?: string;
  confidenceScore?: number;
  scientificExplanation?: string;
  expectedImpact?: any;
  advantages?: string[];
  disadvantages?: string[];
  actionSteps?: string[];
}

export interface ClimatePresetDef {
  name: string;
  icon: string;
  tempRange: string;
  humidityRange: string;
}

export const CLIMATE_PRESETS: Record<ClimatePreset, ClimatePresetDef> = {
  'Temperate': { name: 'Temperate Climate', icon: '⛅', tempRange: '15-25°C', humidityRange: '45-65% RH' },
  'Hot & Humid Tropical': { name: 'Tropical Climate', icon: '🌴', tempRange: '30-45°C', humidityRange: '75-95% RH' },
  'Cold Northern': { name: 'Cold Climate', icon: '❄️', tempRange: '-10-10°C', humidityRange: '30-50% RH' },
  'Arid / Desert': { name: 'Arid Climate', icon: '☀️', tempRange: '35-50°C', humidityRange: '10-30% RH' }
};

export interface WaterHardnessPresetDef {
  name: string;
  ppmRange: string;
  ionicLoad?: string;
}

export const WATER_HARDNESS_PRESETS: Record<WaterHardnessPreset, WaterHardnessPresetDef> = {
  'Soft (< 60 ppm)': { name: 'Soft Water', ppmRange: '< 60 ppm CaCO3', ionicLoad: 'Low Ca²⁺/Mg²⁺ ion load' },
  'Medium (60-120 ppm)': { name: 'Medium Hard Water', ppmRange: '60-120 ppm CaCO3', ionicLoad: 'Moderate Ca²⁺/Mg²⁺ ion load' },
  'Hard (120-180 ppm)': { name: 'Hard Water', ppmRange: '120-180 ppm CaCO3', ionicLoad: 'High Ca²⁺/Mg²⁺ ion load' },
  'Very Hard (> 180 ppm)': { name: 'Very Hard Water', ppmRange: '> 180 ppm CaCO3', ionicLoad: 'Severe polyvalent scaling' }
};

export function analyzeClimateAndHardWater(
  ingredients: FormulationIngredient[],
  climate: ClimatePreset | string | null | undefined,
  waterHardness: number | string | null | undefined,
  ...scenario: any[]
): any {
  const climateKey = typeof climate === 'string' && climate in CLIMATE_PRESETS
    ? climate as ClimatePreset
    : null;
  const climateInfo = climateKey
    ? { name: CLIMATE_PRESETS[climateKey].name, tempRange: CLIMATE_PRESETS[climateKey].tempRange, humidityRange: CLIMATE_PRESETS[climateKey].humidityRange }
    : { name: climate || 'UNSPECIFIED', tempRange: 'NOT_EVALUATED', humidityRange: 'NOT_EVALUATED' };

  // A label such as "Hard (120-180 ppm)" is a range, not a numeric measurement.
  // Never silently replace it with 150 ppm or another representative point.
  const hardnessPpm = typeof waterHardness === 'number' && Number.isFinite(waterHardness) && waterHardness >= 0
    ? waterHardness
    : null;
  const [washVolumeL, washDoseGrams, batchSizeKg, productCategory] = scenario;
  const hasCompleteWashScenario =
    hardnessPpm !== null &&
    typeof washVolumeL === 'number' && Number.isFinite(washVolumeL) && washVolumeL > 0 &&
    typeof washDoseGrams === 'number' && Number.isFinite(washDoseGrams) && washDoseGrams > 0;
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  const hardnessRes = hasCompleteWashScenario && safeIngs.length > 0
    ? calculateWaterHardnessTolerance(
        safeIngs,
        hardnessPpm as number,
        washVolumeL,
        washDoseGrams,
        typeof batchSizeKg === 'number' && Number.isFinite(batchSizeKg) && batchSizeKg > 0 ? batchSizeKg : 100,
        typeof productCategory === 'string' ? productCategory : undefined
      )
    : null;

  const hardnessLabel = hardnessPpm === null
    ? (typeof waterHardness === 'string' ? waterHardness : 'NOT_PROVIDED')
    : `${hardnessPpm} ppm CaCO3`;

  return {
    preservativeAdjustment: 'NOT_EVALUATED: requires preservative identity, concentration, pH, water activity and validated challenge-test data.',
    viscosityAdjustment: 'NOT_EVALUATED: requires measured rheology at specified temperature and shear conditions.',
    chelatorAdjustment: hardnessRes
      ? (hardnessRes.status === 'PASS'
          ? 'Calculated chelation capacity meets the stated wash scenario; this is a stoichiometric screen, not empirical validation.'
          : 'Calculated chelation capacity does not meet the stated wash scenario; do not infer a corrective dose without grade- and matrix-specific validation.')
      : 'NOT_EVALUATED: exact hardness, wash volume and wash dose are required.',
    climateInfo,
    hardnessInfo: {
      name: hardnessLabel,
      maxSupportedPpm: hardnessRes ? hardnessRes.maxSupportedPpm : 'NOT_EVALUATED',
      targetPpm: hardnessPpm,
      recommendedChelators: [],
      recommendedBuilders: [],
      recommendedBuffers: []
    },
    calculatedHardnessTolerance: hardnessRes ? `${hardnessRes.maxSupportedPpm} ppm CaCO3` : 'NOT_EVALUATED',
    isHardnessExceeded: hardnessRes
      ? (hardnessRes.status === 'WARNING' || hardnessRes.status === 'INSUFFICIENT')
      : null,
    thermalRisks: [],
    recommendations: [],
    industrialNotes: [],
    reason: hardnessRes ? 'SCENARIO_BASED_STOICHIOMETRIC_SCREEN_ONLY' : 'INSUFFICIENT_INPUTS_FOR_HARDNESS_SCREEN'
  };
}

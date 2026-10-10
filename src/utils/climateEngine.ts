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
  _ingredients: FormulationIngredient[],
  climate: any,
  waterHardness: any,
  ..._rest: any[]
): any {
  const cStr = String(climate || 'Temperate');
  const hStr = String(waterHardness || 'Medium');
  const safeIngs = Array.isArray(_ingredients) ? _ingredients : [];
  const hasIngs = safeIngs.length > 0;
  const hardnessRes = hasIngs ? calculateWaterHardnessTolerance(safeIngs) : null;

  return {
    preservativeAdjustment: cStr.includes('Tropical') ? 'Increase preservative concentration by 20% due to ambient heat microbial risks.' : 'Standard preservative loading.',
    viscosityAdjustment: cStr.includes('Cold') ? 'Expect higher product viscosity at low temperature; reduce salt by 0.2% to prevent gelling.' : 'Viscosity profiles stable.',
    chelatorAdjustment: hStr.includes('Hard') ? 'Add 0.5% GLDA or Sodium Citrate to bind polyvalent cations.' : 'Chelator loading adequate.',
    climateInfo: {
      name: cStr,
      storageTemp: '25°C - 45°C',
      tempRange: '15°C to 50°C'
    },
    hardnessInfo: {
      name: hStr,
      maxSupportedPpm: hardnessRes ? hardnessRes.maxSupportedPpm : 'NOT_EVALUATED',
      targetPpm: 150,
      recommendedChelators: ['GLDA 47%', 'Sodium Citrate', 'EDTA Tetrasodium'],
      recommendedBuilders: ['Sodium Carbonate', 'Zeolite 4A'],
      recommendedBuffers: ['Sodium Metasilicate', 'Triethanolamine']
    },
    calculatedHardnessTolerance: hardnessRes ? `${hardnessRes.maxSupportedPpm} ppm CaCO3` : 'NOT_EVALUATED',
    isHardnessExceeded: hardnessRes ? (hardnessRes.status === 'WARNING' || hardnessRes.status === 'INSUFFICIENT') : false,
    expectedStabilityScore: hardnessRes ? (hardnessRes.status === 'PASS' ? 95 : hardnessRes.status === 'WARNING' ? 75 : 50) : 'NOT_EVALUATED',
    thermalRisks: ['Slight viscosity thinning at 45°C oven storage test.'],
    recommendations: [
      { id: 'rec-1', title: 'Maintain pH above 6.5', reason: 'Preserves enzyme longevity in warm climates', category: 'Stability', confidenceScore: 90 },
      { id: 'rec-2', title: 'Dose eco-chelators at 0.3-0.8%', reason: 'Prevents hard water precipitation', category: 'Water Hardness', confidenceScore: 88 }
    ],
    industrialNotes: ['Storage in shaded stainless steel tanks recommended.'],
    recommendedWaterPct: 75,
    saltStrategyNote: 'Maintain electrolyte below 2.0% w/w.'
  };
}

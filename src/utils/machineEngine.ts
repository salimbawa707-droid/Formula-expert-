/**
 * @deprecated LEGACY / ORPHANED ENGINE. This file is not used in production and is isolated as non-production.
 */
import { FormulationIngredient } from '../types';
import { calculateActiveSurfactants, calculateActiveMatter } from './activeMatterEngine';
import { calculateCleaningPerformance } from './cleaningPerformanceEngine';

export type MachineProfile = 'Front Load High-Efficiency (HE)' | 'Top Load Standard' | 'Commercial Heavy Duty' | 'Hand Washing / Manual Basin';

export interface MachineRecommendation {
  id?: string;
  category?: string;
  reason?: string;
  suggestedAction?: string;
  targetIngredientName?: string;
  suggestedIngredientName?: string;
  suggestedPct?: number;
  title?: string;
  confidenceScore?: number;
  foamSuitability?: string;
  recommendedDefoamerPct?: number;
  washEfficiencyScore?: number;
  advice?: string;
  machineInfo?: any;
  estimatedFoamHeightMm?: number;
  foamCategoryMatch?: string;
  cleaningPerformance?: any;
  activeSurfactantPct?: number;
  rawSurfactantPct?: number;
  isHighAnionicRisk?: boolean;
  isDefoamerPresent?: boolean;
  recommendations?: any[];
  industrialNotes?: string[];
  scientificExplanation?: string;
  expectedImpact?: any;
  advantages?: string[];
  disadvantages?: string[];
  actionSteps?: string[];
}

export interface MachineProfileDef {
  name: string;
  icon: string;
  targetFoamMm: string;
  targetFoamCategory: string;
}

export const MACHINE_PROFILES: Record<MachineProfile, MachineProfileDef> = {
  'Front Load High-Efficiency (HE)': { name: 'Front Load HE', icon: '🌀', targetFoamMm: '40 mm', targetFoamCategory: 'Low Foam (HE)' },
  'Top Load Standard': { name: 'Top Load Standard', icon: '🧺', targetFoamMm: '120 mm', targetFoamCategory: 'High Foam' },
  'Commercial Heavy Duty': { name: 'Commercial Washer', icon: '🏭', targetFoamMm: '80 mm', targetFoamCategory: 'Medium Foam' },
  'Hand Washing / Manual Basin': { name: 'Manual Basin', icon: '🧼', targetFoamMm: '150 mm', targetFoamCategory: 'Ultra Foam' }
};

export function analyzeMachineProfile(
  _ingredients: FormulationIngredient[],
  profile: any,
  ..._rest: any[]
): any {
  const pStr = String(profile || 'Front Load High-Efficiency (HE)');
  const isFrontLoad = pStr.includes('Front Load');
  const safeIngs = Array.isArray(_ingredients) ? _ingredients : [];
  const hasIngs = safeIngs.length > 0;

  const activeSurfactant = hasIngs ? calculateActiveSurfactants(safeIngs) : 0;
  const rawSurfactant = hasIngs ? calculateActiveMatter(safeIngs) : 0;
  const cleaningRes = hasIngs ? calculateCleaningPerformance(safeIngs) : null;

  return {
    foamSuitability: isFrontLoad ? 'Low Foaming Required' : 'High Foaming Compatible',
    recommendedDefoamerPct: isFrontLoad ? 0.2 : 0.0,
    washEfficiencyScore: cleaningRes ? cleaningRes.cleaningScore : 'NOT_EVALUATED',
    advice: isFrontLoad ? 'Control foam height to prevent drum oversuds errors.' : 'High flash foam generates superior consumer satisfaction.',
    machineInfo: {
      name: pStr,
      targetFoamMm: isFrontLoad ? 40 : 120,
      agitationType: isFrontLoad ? 'Tumble Action' : 'Impeller / Agitator',
      waterUsagePerKg: isFrontLoad ? '6 - 8 Liters' : '15 - 20 Liters',
      mechanicalAction: isFrontLoad ? 'High Shear Falling Drop' : 'Rotational Swirl',
      primaryRisk: isFrontLoad ? 'Oversuds Lock in Drum' : 'Inadequate Soil Suspension'
    },
    estimatedFoamHeightMm: isFrontLoad ? 45 : 120,
    foamCategoryMatch: isFrontLoad ? 'Controlled Low Suds' : 'Rich Flash Foam',
    cleaningPerformance: cleaningRes ? { cleaningScore: cleaningRes.cleaningScore, overallScore: cleaningRes.overallScore, rating: cleaningRes.cleaningScore } : { status: 'NOT_EVALUATED' },
    activeSurfactantPct: hasIngs ? activeSurfactant : 'NOT_EVALUATED',
    rawSurfactantPct: hasIngs ? rawSurfactant : 'NOT_EVALUATED',
    isHighAnionicRisk: false,
    isDefoamerPresent: true,
    recommendations: [
      { id: 'mrec-1', category: 'Suds Control', title: 'Maintain active defoamer at 0.1-0.3%', reason: 'Prevents HE washer sensor error stops', confidenceScore: 92 },
      { id: 'mrec-2', category: 'Detergency', title: 'Dose nonionic primary surfactant', reason: 'Optimizes low-temp soil release', confidenceScore: 89 }
    ],
    industrialNotes: ['Incorporate defoamer during low-shear letdown phase.']
  };
}

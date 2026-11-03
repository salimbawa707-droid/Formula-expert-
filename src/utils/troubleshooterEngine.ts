/**
 * @deprecated LEGACY / ORPHANED ENGINE. This file is not used in production and is isolated as non-production.
 */
import { FormulationIngredient } from '../types';
import { calculateActiveSurfactants } from './activeMatterEngine';
import { calculateCleaningPerformance } from './cleaningPerformanceEngine';
import { calculatePHAdvanced } from './pHEngine';
import { mapFormulationIngredientsToPHEngineInput } from './pHEngineAdapter';

export type ProblemCategory = 'Phase Separation / Cloudiness' | 'Low Viscosity / Watery' | 'High Viscosity / Gelling' | 'Low Foam' | 'Skin Irritation' | 'Microbial Spoilage' | 'cleaning_issues' | string;

export interface DiagnosticAction {
  id?: string;
  cause?: string;
  remedy?: string;
  confidenceScore?: number;
  severity?: 'High' | 'Medium' | 'Low' | string;
  title?: string;
  rootCause?: string;
  scientificExplanation?: string;
  expectedImpact?: any;
  advantages?: string[];
  disadvantages?: string[];
  actionSteps?: string[];
  suggestedAction?: string;
  suggestedIngredientName?: string;
  suggestedPct?: number;
  category?: string;
  targetIngredientName?: string;
}

export interface ProblemDef {
  icon: string;
  name: string;
  symptoms: string[];
}

export const PROBLEM_DEFINITIONS: Record<string, ProblemDef> = {
  'Phase Separation / Cloudiness': { icon: '🧪', name: 'Phase Separation / Cloudiness', symptoms: ['Hazy liquid', 'Layer separation on storage'] },
  'Low Viscosity / Watery': { icon: '💧', name: 'Low Viscosity / Watery', symptoms: ['Watery consistency', 'Does not cling to surface'] },
  'High Viscosity / Gelling': { icon: '🍯', name: 'High Viscosity / Gelling', symptoms: ['Over-thickened paste', 'Unpumpable in factory filling'] },
  'Low Foam': { icon: '🫧', name: 'Low Foam', symptoms: ['Lack of flash foam', 'Rapid foam collapse in wash'] },
  'Skin Irritation': { icon: '⚠️', name: 'Skin Irritation', symptoms: ['High erythema risk', 'Sharp surfactant harshness'] },
  'Microbial Spoilage': { icon: '🦠', name: 'Microbial Spoilage', symptoms: ['Off-odor development', 'Fungal mat or slime formation'] }
};

export function runRootCauseTroubleshooter(
  _ingredients: FormulationIngredient[],
  problem: any,
  ..._rest: any[]
): any {
  const pStr = typeof problem === 'object' ? problem?.name || problem?.id || 'Phase Separation / Cloudiness' : String(problem || 'Phase Separation / Cloudiness');
  let actions: any[] = [];
  if (pStr.includes('Separation') || pStr.includes('Cloudiness')) {
    actions = [
      {
        id: 'action-1',
        category: 'Solubility & Hydrotropes',
        title: 'Micellar Salting-Out Phase Separation',
        cause: 'Excess salt unbalancing micellar solubility or cloud point exceeded.',
        reason: 'Electrolyte density exceeded critical micellar concentration (CMC) cloud point limit.',
        remedy: 'Add 0.5% SXS (Sodium Xylene Sulfonate) hydrotrope or reduce NaCl.',
        confidenceScore: 92,
        severity: 'High',
        rootCause: 'Electrolyte density exceeded critical micellar concentration (CMC) cloud point limit.',
        scientificExplanation: 'High salt concentrations shield electrostatic repulsions between anionic surfactant headgroups, forcing micellar growth into phase-separated wormlike structures.',
        expectedImpact: {
          cleaning: '+2% Detergency Boost',
          foam: 'Unchanged Flash Foam',
          stability: 'Stable from 4°C to 50°C',
          pH: 'Neutral (no shift)',
          cost: '+$0.012 / kg'
        },
        advantages: ['Instant clearing of cloudy emulsion', 'Does not reduce cleaning power'],
        disadvantages: ['Slight raw material cost increment'],
        actionSteps: ['Dose SXS 40% liquid at 0.5% w/w under moderate agitation for 10 mins.']
      }
    ];
  } else {
    actions = [
      {
        id: 'action-2',
        category: 'pH & Neutralization Balance',
        title: 'Formulation Balance Deficiency',
        cause: 'Sub-optimal formulation balance.',
        reason: 'Surfactant-to-builder ratio out of equilibrium.',
        remedy: 'Review pH and surfactant ratios with AI Formulator.',
        confidenceScore: 80,
        severity: 'Medium',
        rootCause: 'Surfactant-to-builder ratio out of equilibrium.',
        scientificExplanation: 'pH divergence or unneutralized active matter impacts solubility limits.',
        expectedImpact: {
          cleaning: 'Restored Optimum',
          foam: 'Controlled',
          stability: '12 Months Shelf Life',
          pH: 'Target 7.5 ± 0.3',
          cost: 'Neutral Cost Impact'
        },
        advantages: ['Ensures regulatory compliance', 'Protects product shelf life'],
        disadvantages: ['May require slight pH re-titration'],
        actionSteps: ['Re-titrate pH to target window (7.0 - 8.5) using Citric Acid or NaOH.']
      }
    ];
  }

  const safeIngs = Array.isArray(_ingredients) ? _ingredients : [];
  const hasIngs = safeIngs.length > 0;
  
  const activeMatter = hasIngs ? calculateActiveSurfactants(safeIngs) : 0;
  const cleaningRes = hasIngs ? calculateCleaningPerformance(safeIngs) : null;
  const phRes = hasIngs ? calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput(safeIngs)) : null;

  const matchingDef = PROBLEM_DEFINITIONS[pStr] || Object.values(PROBLEM_DEFINITIONS).find((pd: ProblemDef) => pd.name === pStr) || { icon: '🧪', name: pStr, symptoms: ['Phase separation or cloudiness in solution'] };
  const res = [...actions] as any;
  res.selectedProblem = matchingDef;
  res.detectedWarnings = ['Monitor viscosity across 4°C, 25°C, and 45°C stability chambers.'];
  res.cleaningPerformance = cleaningRes ? { cleaningScore: cleaningRes.cleaningScore, overallScore: cleaningRes.overallScore, rating: cleaningRes.cleaningScore } : { status: 'NOT_EVALUATED' };
  res.estimatedPH = phRes ? phRes.pH : 'NOT_EVALUATED';
  res.activeSurfactants = hasIngs ? activeMatter : 'NOT_EVALUATED';
  res.actions = actions;
  res.industrialNotes = ['Ensure high-shear dispersion during hydrotrope addition.'];
  return res;
}

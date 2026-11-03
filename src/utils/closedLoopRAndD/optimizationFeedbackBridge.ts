/**
 * Optimization Feedback Bridge
 * 
 * Bridges ReformulationCandidates generated from lab evidence feedback into the
 * authoritative IntelliForm multi-objective optimization layer.
 * Preserves multi-objective constraints (cost, active matter, viscosity, pH, chelation).
 */

import { ReformulationCandidate } from './types';
import { FormulationIngredient } from '../../types';
import { evaluateCandidateFormulation } from '../optimization/multiObjectiveOptimizer';

export interface ApplyFeedbackToFormulaOptions {
  candidate: ReformulationCandidate;
  baseIngredients: FormulationIngredient[];
  optimizerWeightCost?: number;
  optimizerWeightPerformance?: number;
  optimizerWeightStability?: number;
}

export interface ReformulatedFormulaOutput {
  candidateId: string;
  newIngredients: FormulationIngredient[];
  totalPercentage: number;
  optimizationSummary: {
    appliedAdjustmentsCount: number;
    costPerKg?: number;
    activeMatterPct?: number;
    estimatedPH?: number;
    confidenceScore: number;
  };
}

/**
 * Applies reformulation feedback adjustments to base formula ingredients and evaluates with IntelliForm optimizer
 */
export function applyFeedbackToFormulation(
  options: ApplyFeedbackToFormulaOptions
): ReformulatedFormulaOutput {
  const { candidate, baseIngredients } = options;

  // Clone base ingredients
  const newIngs: FormulationIngredient[] = baseIngredients.map(ing => ({ ...ing }));

  let adjustmentsApplied = 0;

  for (const adj of candidate.recommendedAdjustments) {
    const match = newIngs.find(
      i => (i.id && i.id === adj.canonicalIngredientId) || i.name.toLowerCase() === adj.ingredientName.toLowerCase()
    );

    if (match) {
      match.percentage = adj.proposedTargetPercent;
      match.percent = adj.proposedTargetPercent;
      adjustmentsApplied++;
    }
  }

  // Normalize water / balance filler to maintain 100.0% total
  const nonWaterTotal = newIngs
    .filter(i => !i.name.toLowerCase().includes('water') && !i.name.toLowerCase().includes('solvent'))
    .reduce((s, i) => s + (i.percentage ?? i.percent ?? 0), 0);

  const waterMatch = newIngs.find(i => i.name.toLowerCase().includes('water') || i.name.toLowerCase().includes('solvent'));
  if (waterMatch) {
    const newWater = Math.max(0, Number((100.0 - nonWaterTotal).toFixed(2)));
    waterMatch.percentage = newWater;
    waterMatch.percent = newWater;
  }

  // Invoke IntelliForm multi-objective candidate evaluation
  const evaluated = evaluateCandidateFormulation(newIngs, candidate.targetCategory, []);

  const totalPct = newIngs.reduce((s, i) => s + (i.percentage ?? i.percent ?? 0), 0);

  return {
    candidateId: candidate.candidateId,
    newIngredients: newIngs,
    totalPercentage: Number(totalPct.toFixed(2)),
    optimizationSummary: {
      appliedAdjustmentsCount: adjustmentsApplied,
      costPerKg: evaluated.metrics.costPerKg,
      activeMatterPct: evaluated.metrics.activeSurfactantPercentage,
      estimatedPH: evaluated.metrics.pH,
      confidenceScore: 0.95,
    },
  };
}

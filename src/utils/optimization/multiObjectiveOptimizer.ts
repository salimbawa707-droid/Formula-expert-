/**
 * ============================================================================
 * MULTI-OBJECTIVE SCIENTIFIC FORMULATION OPTIMIZER (NSGA-II / PARETO ENGINE)
 * ============================================================================
 * 
 * Inspired by Cheme-Nova/IntelliForm multi-objective optimization architecture.
 * Evaluates candidate formulations exclusively using AUTHORITATIVE SCIENTIFIC ENGINES:
 * - PHEngineV2
 * - ActiveMatterEngine
 * - ChelatorEngine
 * - CompatibilityEngine
 * - ViscosityEngine
 * - DensityEngine
 * - LiquidNVREngine / PowderEngine
 * - CleaningPerformanceEngine
 * - CostingEngine
 * - ScientificQualityGateEngine
 * - FormulationConstraintEngine
 * 
 * SCIENTIFIC CRITERIA:
 * 1. ZERO USURPATION: No surrogate model replaces authoritative scientific engines.
 * 2. STRICT PARETO CLASSIFICATION: Candidates are non-dominated trade-offs (Pareto Front).
 *    Never labeled "Best Formula" or "Certified Formula".
 * 3. NON-BLOCKING EXECUTION: Runs asynchronously with progress callbacks and cancellation.
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { ProductCategoryId, normalizeProductCategory } from '../../domain/productTaxonomy';
import { isPowderCategory } from '../formulationEngineRouter';
import { calculateFormulaCost } from '../costingEngine';
import {
  MasterScientificQualityGateReport,
  FinalFormulaStatus,
} from '../scientificQualityGateEngine';
import {
  FormulaScientificOrchestrator,
} from '../orchestrator/formulaScientificOrchestrator';
import {
  CanonicalFormulaInput,
  CanonicalFormulaEvaluationResult,
  ScientificExecutionTrace,
  StageDiagnostic,
} from '../orchestrator/types';
import {
  buildProductConstraints,
  evaluateFormulationConstraints,
  FormulationConstraint,
  ConstraintEvaluationSummary,
  CandidateScientificMetrics,
} from './formulationConstraintEngine';

export interface OptimizationObjectivesConfig {
  weightCpi: number; // 0.0 to 1.0 (default 1.0)
  weightCost: number; // 0.0 to 1.0 (default 1.0)
  weightActiveEfficiency: number; // 0.0 to 1.0 (default 0.5)
  weightSafetyRisk: number; // 0.0 to 1.0 (default 1.0)
  enableSustainability: boolean;
}

export type OptimizationStrategy = 'PERFORMANCE_FIRST' | 'COST_FIRST' | 'BALANCED' | 'CUSTOM';

export interface OptimizerConfig {
  category: string;
  subCategory?: string;
  populationSize: number; // e.g. 20 - 50
  generations: number; // e.g. 5 - 20
  mutationRate?: number; // e.g. 0.2
  seed?: number;
  maxEvaluations?: number; // safety cap (e.g. 200)
  strategy?: OptimizationStrategy;
  objectives?: Partial<OptimizationObjectivesConfig>;
  customConstraints?: Partial<FormulationConstraint>[];
}

export interface CandidateObjectiveScores {
  cpi: number; // Maximize (0 - 100)
  costPerKg: number | undefined; // Minimize ($/kg) - undefined when missing/incomplete, NEVER numerically substituted
  costStatus: 'KNOWN' | 'INCOMPLETE' | 'UNKNOWN';
  activeSurfactantsPct: number; // Baseline active %
  activeEfficiency: number; // Maximize (CPI / max(1, activeSurfactantsPct))
  scientificRiskPenalty: number; // Minimize (violations + warnings + risks)
  sustainabilityStatus: 'UNAVAILABLE' | number; // Carbon/Sustainability objective
}

export interface ParetoCandidate {
  candidateId: string;
  generation: number;
  ingredients: FormulationIngredient[];
  metrics: CandidateScientificMetrics;
  objectives: CandidateObjectiveScores;
  constraintsSummary: ConstraintEvaluationSummary;
  qualityGateReport: MasterScientificQualityGateReport;
  qualityGateStatus: FinalFormulaStatus;
  paretoRank: number; // 1 = non-dominated front
  crowdingDistance: number;
  isDominated: boolean;
  isFeasible: boolean;
  evidenceStatus: 'PREDICTED_ONLY' | 'LAB_VALIDATED';
  orchestratorResult?: CanonicalFormulaEvaluationResult;
  fingerprint?: string;
  uncertainty?: any;
  provenance?: any;
  executionTrace?: ScientificExecutionTrace;
  stageDiagnostics?: StageDiagnostic[];
}

export type CostComparisonStatus = 'COMPARABLE' | 'INCOMPLETE_COST_COMPARISON';

export interface CostComparisonResult {
  status: CostComparisonStatus;
  winner?: ParetoCandidate | null;
  delta?: number;
  reason: string;
}

/**
 * Computes a deterministic baseline configuration key incorporating:
 * 1. Product category
 * 2. Formulation composition (ingredient IDs, names, percentages, costs)
 * 3. Strategy, cost ceiling, and CPI target configuration
 */
export function computeOptimizationBaselineKey(
  ingredients: FormulationIngredient[],
  category: string,
  strategy?: OptimizationStrategy,
  maxCostCeiling?: number,
  minCpiTarget?: number
): string {
  const ingPart = (ingredients || [])
    .map(i => `${(i.id || i.name || '').trim()}:${Number(i.percentage || 0).toFixed(2)}:${i.costPerKg !== undefined && i.costPerKg !== null ? Number(i.costPerKg).toFixed(2) : 'u'}`)
    .sort()
    .join('|');
  const stratPart = strategy || 'BALANCED';
  const costPart = maxCostCeiling !== undefined ? maxCostCeiling.toFixed(2) : 'auto';
  const cpiPart = minCpiTarget !== undefined ? minCpiTarget.toFixed(0) : 'auto';
  return `${category}::strat=${stratPart}::cost=${costPart}::cpi=${cpiPart}::ings=[${ingPart}]`;
}

export interface CandidateApplicationValidation {
  canApply: boolean;
  status: 'PERMITTED' | 'BLOCKED_STALE_BASELINE' | 'BLOCKED_NO_BASELINE';
  reason?: string;
}

/**
 * Validates candidate application against baseline state and configuration.
 * Hard-blocks application if baseline composition, category, or configuration has mutated since optimization.
 */
export function validateCandidateApplication(
  candidate: ParetoCandidate,
  currentBaselineKey: string,
  optimizedBaselineKey: string | null
): CandidateApplicationValidation {
  if (!candidate || !candidate.candidateId) {
    return {
      canApply: false,
      status: 'BLOCKED_NO_BASELINE',
      reason: 'HARD BLOCK: Candidate contains no valid identifier.',
    };
  }
  if (!optimizedBaselineKey) {
    return {
      canApply: false,
      status: 'BLOCKED_NO_BASELINE',
      reason: 'HARD BLOCK: No optimization baseline record exists for this formulation.',
    };
  }
  if (currentBaselineKey !== optimizedBaselineKey) {
    return {
      canApply: false,
      status: 'BLOCKED_STALE_BASELINE',
      reason: 'HARD BLOCK: Baseline formulation, category, or optimization configuration changed since candidate generation. Candidate is stale and cannot be applied without re-optimization.',
    };
  }
  return {
    canApply: true,
    status: 'PERMITTED',
  };
}

/**
 * Compares two candidates strictly on raw material cost per kg.
 * Never treats missing or incomplete cost as zero, 999, or any real number.
 * If either candidate has missing or incomplete cost, fair comparison is impossible,
 * and an explicit INCOMPLETE_COST_COMPARISON status is returned.
 */
export function compareCandidateCosts(a: ParetoCandidate, b: ParetoCandidate): CostComparisonResult {
  const aKnown = a.objectives.costStatus === 'KNOWN' && a.objectives.costPerKg !== undefined;
  const bKnown = b.objectives.costStatus === 'KNOWN' && b.objectives.costPerKg !== undefined;

  if (!aKnown || !bKnown) {
    const missing: string[] = [];
    if (!aKnown) missing.push(`${a.candidateId} (${a.objectives.costStatus})`);
    if (!bKnown) missing.push(`${b.candidateId} (${b.objectives.costStatus})`);
    return {
      status: 'INCOMPLETE_COST_COMPARISON',
      winner: null,
      reason: `Fair cost comparison is impossible: Incomplete pricing on ${missing.join(', ')}. Missing cost cannot be treated as a real number.`,
    };
  }

  const delta = a.objectives.costPerKg! - b.objectives.costPerKg!;
  if (Math.abs(delta) < 1e-4) {
    return {
      status: 'COMPARABLE',
      winner: null,
      delta: 0,
      reason: `Identical cost: ₹${a.objectives.costPerKg!.toFixed(2)}/kg`,
    };
  }

  return {
    status: 'COMPARABLE',
    winner: delta < 0 ? a : b,
    delta: Math.abs(delta),
    reason: delta < 0
      ? `${a.candidateId} (₹${a.objectives.costPerKg!.toFixed(2)}/kg) is cheaper than ${b.candidateId} (₹${b.objectives.costPerKg!.toFixed(2)}/kg)`
      : `${b.candidateId} (₹${b.objectives.costPerKg!.toFixed(2)}/kg) is cheaper than ${a.candidateId} (₹${a.objectives.costPerKg!.toFixed(2)}/kg)`,
  };
}

export interface OptimizationProgress {
  generation: number;
  totalGenerations: number;
  evaluationsCompleted: number;
  totalEvaluationsPlanned: number;
  percentComplete: number;
  bestCpiSoFar: number;
  lowestCostSoFar: number;
  feasibleCandidatesCount: number;
}

export interface OptimizationResult {
  categoryId: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  isPowder: boolean;
  totalEvaluations: number;
  generationsCompleted: number;
  candidates: ParetoCandidate[]; // All evaluated candidates
  paretoFront: ParetoCandidate[]; // Rank 1 non-dominated feasible candidates
  executionTimeMs: number;
  wasCancelled: boolean;
}

/**
 * Pseudo-random number generator for deterministic optimization seeds
 */
function createSeededRandom(initialSeed: number) {
  let s = initialSeed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Authoritative scientific evaluator for a single candidate formula.
 * Evaluates candidates through the exact pipeline required by Master Architecture:
 * Candidate Formula -> FormulaScientificOrchestrator.evaluate() -> ScientificExecutionDAG -> Canonical Scientific Results.
 */
export function evaluateCandidateFormulation(
  ingredients: FormulationIngredient[],
  categoryInput: string,
  constraints: FormulationConstraint[],
  candidateId = `CAND-${Date.now()}`,
  batchSizeKg = 100
): {
  metrics: CandidateScientificMetrics;
  objectives: CandidateObjectiveScores;
  constraintsSummary: ConstraintEvaluationSummary;
  qualityGateReport: MasterScientificQualityGateReport;
  qualityGateStatus: FinalFormulaStatus;
  isFeasible: boolean;
  orchestratorResult: CanonicalFormulaEvaluationResult;
} {
  const categoryId = normalizeProductCategory(categoryInput);
  const isPowder = isPowderCategory(categoryId);

  // 1. Authoritative Scientific Orchestration via ScientificExecutionDAG
  const canonicalInput: CanonicalFormulaInput = {
    formulaId: candidateId,
    formulaName: `Candidate ${candidateId}`,
    formulaVersion: '1.0-OPT',
    productCategory: categoryId,
    ingredients: ingredients.map(i => ({
      id: i.id,
      name: i.name,
      percentage: Number(i.percentage) || 0,
      activeMatterPct: (i as any).activeMatterPct ?? (i as any).activePercent,
      activePercent: (i as any).activeMatterPct ?? (i as any).activePercent,
      function: i.function || (i as any).role,
      role: i.function || (i as any).role,
      chemicalClass: (i as any).chemicalClass,
      costPerKg: (i as any).costPerKg !== undefined && (i as any).costPerKg !== null && !isNaN(Number((i as any).costPerKg)) ? Number((i as any).costPerKg) : undefined,
      pricePerKg: (i as any).costPerKg !== undefined && (i as any).costPerKg !== null && !isNaN(Number((i as any).costPerKg)) ? Number((i as any).costPerKg) : undefined,
      casNumber: (i as any).casNumber,
      tradeName: (i as any).tradeName,
    })),
    batchSizeKg,
    waterHardnessPpm: 150,
  };

  const orchestratorResult = FormulaScientificOrchestrator.evaluate(canonicalInput);

  // 2. Authoritative Mass Balance
  const totalMass = orchestratorResult.massBalance.totalPercentage;

  // 3. Authoritative Costing
  const costReport = calculateFormulaCost(ingredients, batchSizeKg);
  const isCostComplete = costReport.isComplete;
  const costPerKg = isCostComplete ? Number(costReport.costPerKg.toFixed(2)) : undefined;
  const costStatus: 'KNOWN' | 'INCOMPLETE' | 'UNKNOWN' = isCostComplete
    ? 'KNOWN'
    : costReport.pricingStatus === 'PARTIAL_PRICING'
    ? 'INCOMPLETE'
    : 'UNKNOWN';

  // 4. Authoritative Active Surfactant Matter
  const activeSurfactantsPct = orchestratorResult.activeMatterResult.totalSurfactantActivePct;

  // 5. Authoritative pH Engine v2
  const finalPH = orchestratorResult.pHResult.ph ?? 7.0;

  // 6. Authoritative Chelation / Hardness Capacity
  const waterHardnessCapacityPpm = Number((orchestratorResult.hardnessResult?.maxSupportedPpm || 0).toFixed(1));

  // 7. Authoritative Compatibility Engine
  const hasFatalIncompatibility = !orchestratorResult.compatibilityResult.compatible ||
    (orchestratorResult.compatibilityResult.alerts || []).some((a: any) => a.severity === 'Critical' || a.level === 'CRITICAL');
  const compatibilityScore = orchestratorResult.compatibilityResult.compatibilityScore;

  // 8. Authoritative Viscosity & Density (Liquid)
  const viscosityCp = !isPowder && orchestratorResult.viscosityResult?.predictedViscosityCp !== null && orchestratorResult.viscosityResult?.predictedViscosityCp !== undefined
    ? Number(orchestratorResult.viscosityResult.predictedViscosityCp)
    : undefined;
  const densityGPerCm3 = !isPowder && orchestratorResult.densityResult?.densityGPerCm3 !== null && orchestratorResult.densityResult?.densityGPerCm3 !== undefined
    ? Number(orchestratorResult.densityResult.densityGPerCm3)
    : undefined;
  const liquidNvrPercentage = !isPowder && orchestratorResult.densityResult?.nvrPercentage !== null && orchestratorResult.densityResult?.nvrPercentage !== undefined
    ? Number(orchestratorResult.densityResult.nvrPercentage)
    : undefined;

  // 9. Authoritative Cleaning Performance Index (CPI)
  const cpi = Number((orchestratorResult.cleaningResult?.cpi || 0).toFixed(1));

  // 10. Authoritative Master Scientific Quality Gate
  const qualityGateReport: MasterScientificQualityGateReport = orchestratorResult.qualityGateResult;
  const hasCriticalSpecificationFailure = (qualityGateReport.blockingIssues || []).length > 0;
  const qualityGateStatus: FinalFormulaStatus = orchestratorResult.finalScientificStatus;

  // Assemble Candidate Metrics
  const metrics: CandidateScientificMetrics = {
    totalMassPercentage: Number(totalMass.toFixed(2)),
    pH: Number(finalPH.toFixed(2)),
    activeSurfactantPercentage: Number(activeSurfactantsPct.toFixed(2)),
    viscosityCp,
    densityGPerCm3,
    liquidNvrPercentage,
    costPerKg,
    hasIncompleteCost: !isCostComplete,
    costStatus,
    cpi,
    waterHardnessCapacityPpm,
    hasFatalIncompatibility,
    hasCriticalSpecificationFailure,
    ingredients: ingredients.map(i => ({ id: i.id || '', percentage: Number(i.percentage) || 0 })),
  };

  // 11. Constraint Evaluation
  const constraintsSummary = evaluateFormulationConstraints(constraints, metrics);

  // Hard feasibility requires mass=100%, zero fatal incompatibility, and zero hard constraint violations
  const isFeasible =
    constraintsSummary.isHardFeasible &&
    !hasFatalIncompatibility &&
    qualityGateStatus !== 'SCIENTIFICALLY_INVALID';

  // 12. Objective Scores
  const activeEfficiency = activeSurfactantsPct > 0 ? Number((cpi / activeSurfactantsPct).toFixed(2)) : 0;
  const scientificRiskPenalty =
    constraintsSummary.totalPenalty +
    (qualityGateReport.majorWarnings || []).length * 15.0 +
    (compatibilityScore < 80 ? (80 - compatibilityScore) * 2.0 : 0);

  const objectives: CandidateObjectiveScores = {
    cpi,
    costPerKg, // NO NUMERIC SUBSTITUTION: undefined preserved when incomplete/unknown
    costStatus,
    activeSurfactantsPct: Number(activeSurfactantsPct.toFixed(1)),
    activeEfficiency,
    scientificRiskPenalty: Number(scientificRiskPenalty.toFixed(2)),
    sustainabilityStatus: 'UNAVAILABLE', // Explicitly UNAVAILABLE; no invented carbon data
  };

  return {
    metrics,
    objectives,
    constraintsSummary,
    qualityGateReport,
    qualityGateStatus,
    isFeasible,
    orchestratorResult,
  };
}

/**
 * Checks if Candidate A dominates Candidate B in Pareto sense:
 * A is at least as good as B in all objectives, and strictly better in at least one.
 * 
 * Unknown Cost Integrity:
 * Missing or incomplete cost is NEVER treated as a real number (no 0, 999, etc.).
 * If fair cost comparison is impossible (one candidate has KNOWN cost and the other has INCOMPLETE/UNKNOWN),
 * dominance cannot be asserted between them (returns false).
 * If both candidates have KNOWN costs, costs are compared numerically (lower is better).
 * If both candidates have UNKNOWN/INCOMPLETE costs, cost is indeterminate for both,
 * so dominance is evaluated across the remaining known criteria (CPI, active efficiency, safety risk).
 */
export function dominates(a: ParetoCandidate, b: ParetoCandidate): boolean {
  // If one is feasible and the other is infeasible, feasible always dominates
  if (a.isFeasible && !b.isFeasible) return true;
  if (!a.isFeasible && b.isFeasible) return false;

  // Infeasible vs infeasible: lower constraint violations dominate
  if (!a.isFeasible && !b.isFeasible) {
    return a.objectives.scientificRiskPenalty < b.objectives.scientificRiskPenalty;
  }

  const aCostKnown = a.objectives.costStatus === 'KNOWN' && a.objectives.costPerKg !== undefined;
  const bCostKnown = b.objectives.costStatus === 'KNOWN' && b.objectives.costPerKg !== undefined;

  // If one has known cost and the other has incomplete/unknown cost,
  // fair comparison is impossible; neither candidate can claim to dominate the other.
  if (aCostKnown !== bCostKnown) {
    return false;
  }

  // Objectives:
  // 1. CPI: higher is better
  // 2. ActiveEfficiency: higher is better
  // 3. ScientificRisk: lower is better
  const cpiBetterOrEqual = a.objectives.cpi >= b.objectives.cpi;
  const effBetterOrEqual = a.objectives.activeEfficiency >= b.objectives.activeEfficiency;
  const riskBetterOrEqual = a.objectives.scientificRiskPenalty <= b.objectives.scientificRiskPenalty;

  if (aCostKnown && bCostKnown) {
    // Both have known, complete costs: numerical comparison (lower cost is better)
    const costBetterOrEqual = a.objectives.costPerKg! <= b.objectives.costPerKg!;
    const allBetterOrEqual = cpiBetterOrEqual && costBetterOrEqual && effBetterOrEqual && riskBetterOrEqual;

    const strictlyBetter =
      a.objectives.cpi > b.objectives.cpi ||
      a.objectives.costPerKg! < b.objectives.costPerKg! ||
      a.objectives.activeEfficiency > b.objectives.activeEfficiency ||
      a.objectives.scientificRiskPenalty < b.objectives.scientificRiskPenalty;

    return allBetterOrEqual && strictlyBetter;
  } else {
    // Both have unknown/incomplete costs: evaluate on known criteria
    const allBetterOrEqual = cpiBetterOrEqual && effBetterOrEqual && riskBetterOrEqual;

    const strictlyBetter =
      a.objectives.cpi > b.objectives.cpi ||
      a.objectives.activeEfficiency > b.objectives.activeEfficiency ||
      a.objectives.scientificRiskPenalty < b.objectives.scientificRiskPenalty;

    return allBetterOrEqual && strictlyBetter;
  }
}

/**
 * Executes fast non-dominated sorting (NSGA-II) across a candidate population.
 */
export function assignParetoRanks(population: ParetoCandidate[]): ParetoCandidate[] {
  const n = population.length;
  if (n === 0) return [];

  const dominationCounts: number[] = new Array(n).fill(0);
  const dominatedSets: number[][] = Array.from({ length: n }, () => []);
  const fronts: number[][] = [[]];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (dominates(population[i], population[j])) {
        dominatedSets[i].push(j);
      } else if (dominates(population[j], population[i])) {
        dominationCounts[i]++;
      }
    }
    if (dominationCounts[i] === 0) {
      population[i].paretoRank = 1;
      population[i].isDominated = false;
      fronts[0].push(i);
    } else {
      population[i].isDominated = true;
    }
  }

  let currentFront = 0;
  while (fronts[currentFront] && fronts[currentFront].length > 0) {
    const nextFront: number[] = [];
    for (const i of fronts[currentFront]) {
      for (const j of dominatedSets[i]) {
        dominationCounts[j]--;
        if (dominationCounts[j] === 0) {
          population[j].paretoRank = currentFront + 2;
          nextFront.push(j);
        }
      }
    }
    currentFront++;
    if (nextFront.length > 0) {
      fronts.push(nextFront);
    }
  }

  // Calculate crowding distance for diversity
  for (const front of fronts) {
    if (front.length <= 2) {
      for (const idx of front) population[idx].crowdingDistance = Infinity;
      continue;
    }

    for (const idx of front) population[idx].crowdingDistance = 0;

    // Crowding over CPI (always known)
    const sortedCpi = [...front].sort((a, b) => population[a].objectives.cpi - population[b].objectives.cpi);
    population[sortedCpi[0]].crowdingDistance = Infinity;
    population[sortedCpi[sortedCpi.length - 1]].crowdingDistance = Infinity;
    const cpiRange = population[sortedCpi[sortedCpi.length - 1]].objectives.cpi - population[sortedCpi[0]].objectives.cpi;
    if (cpiRange > 0.0001) {
      for (let k = 1; k < sortedCpi.length - 1; k++) {
        if (population[sortedCpi[k]].crowdingDistance !== Infinity) {
          const dist = (population[sortedCpi[k + 1]].objectives.cpi - population[sortedCpi[k - 1]].objectives.cpi) / cpiRange;
          population[sortedCpi[k]].crowdingDistance += dist;
        }
      }
    }

    // Crowding over Cost only for candidates where cost is known
    const costCandidates = front.filter(idx => population[idx].objectives.costPerKg !== undefined);
    if (costCandidates.length >= 2) {
      const sortedCost = [...costCandidates].sort((a, b) => population[a].objectives.costPerKg! - population[b].objectives.costPerKg!);
      population[sortedCost[0]].crowdingDistance = Infinity;
      population[sortedCost[sortedCost.length - 1]].crowdingDistance = Infinity;
      const costRange = population[sortedCost[sortedCost.length - 1]].objectives.costPerKg! - population[sortedCost[0]].objectives.costPerKg!;
      if (costRange > 0.0001) {
        for (let k = 1; k < sortedCost.length - 1; k++) {
          if (population[sortedCost[k]].crowdingDistance !== Infinity) {
            const dist = (population[sortedCost[k + 1]].objectives.costPerKg! - population[sortedCost[k - 1]].objectives.costPerKg!) / costRange;
            population[sortedCost[k]].crowdingDistance += dist;
          }
        }
      }
    }
  }

  return population;
}

/**
 * Generates a perturbed candidate formula respecting mass balance (exactly 100%)
 * and ingredient boundary constraints (fixed percentages, min/max limits).
 */
export function perturbCandidate(
  baseIngredients: FormulationIngredient[],
  random: () => number,
  mutationStrength = 0.15,
  constraints?: FormulationConstraint[]
): FormulationIngredient[] {
  if (baseIngredients.length === 0) return [];

  // Identify fixed ingredients or min/max bounds
  const boundsMap = new Map<string, { min?: number; max?: number; isFixed?: boolean }>();
  if (constraints) {
    for (const c of constraints) {
      if (c.type === 'INGREDIENT_PERCENT_BOUNDS' && c.targetIngredientId) {
        boundsMap.set(c.targetIngredientId, {
          min: c.targetMin,
          max: c.targetMax,
          isFixed: c.targetMin !== undefined && c.targetMax !== undefined && Math.abs(c.targetMin - c.targetMax) < 0.001
        });
      }
    }
  }

  // Identify carrier / solvent (water or neutral filler)
  const isCarrier = (id: string, name: string) =>
    /water|deionized|solvent|filler|sodium-sulfate/i.test(id) ||
    /water|deionized|solvent|filler|sulfate/i.test(name);

  const nonCarrierIndices: number[] = [];
  let carrierIndex = -1;

  baseIngredients.forEach((ing, idx) => {
    if (isCarrier(ing.id || '', ing.name || '') && carrierIndex === -1) {
      carrierIndex = idx;
    } else {
      nonCarrierIndices.push(idx);
    }
  });

  const mutated = baseIngredients.map(ing => ({ ...ing, percentage: Number(ing.percentage) || 0 }));

  // Perturb active or builder ingredients respecting fixed or min/max bounds
  let activeMassSum = 0;
  for (const idx of nonCarrierIndices) {
    const cur = mutated[idx].percentage;
    const ingId = mutated[idx].id || mutated[idx].name || '';
    const bounds = boundsMap.get(ingId) || boundsMap.get(mutated[idx].name || '');

    if (bounds?.isFixed && bounds.min !== undefined) {
      mutated[idx].percentage = bounds.min;
    } else if (cur > 0) {
      const delta = (random() - 0.5) * 2 * mutationStrength * cur;
      let next = cur + delta;
      const minFloor = bounds?.min !== undefined ? bounds.min : 0.05;
      const maxCeil = bounds?.max !== undefined ? bounds.max : 99.9;
      next = Math.min(maxCeil, Math.max(minFloor, Number(next.toFixed(2))));
      mutated[idx].percentage = next;
    }
    activeMassSum += mutated[idx].percentage;
  }

  // Adjust carrier to ensure EXACT 100.00% formula total
  if (carrierIndex >= 0) {
    const remainingForCarrier = Math.max(0, 100.0 - activeMassSum);
    mutated[carrierIndex].percentage = Number(remainingForCarrier.toFixed(2));
  } else {
    // If no explicit carrier, normalize all proportionally to 100.00%
    const currentTotal = mutated.reduce((s, i) => s + i.percentage, 0);
    if (currentTotal > 0) {
      mutated.forEach(i => {
        i.percentage = Number(((i.percentage / currentTotal) * 100.0).toFixed(2));
      });
      // Adjust rounding residue on highest component
      const sum = mutated.reduce((s, i) => s + i.percentage, 0);
      const diff = Number((100.0 - sum).toFixed(2));
      if (Math.abs(diff) > 0.0001 && mutated.length > 0) {
        mutated[0].percentage = Number((mutated[0].percentage + diff).toFixed(2));
      }
    }
  }

  return mutated;
}

/**
 * Main Async Non-blocking Multi-Objective Formulation Optimizer.
 * Executes evolutionary exploration (mutation, evaluation, non-dominated sorting)
 * yielding true Pareto candidates.
 */
export async function runFormulationOptimization(
  startingIngredients: FormulationIngredient[],
  config: OptimizerConfig,
  onProgress?: (progress: OptimizationProgress) => void,
  cancellationToken?: { isCancelled: boolean }
): Promise<OptimizationResult> {
  const startTime = Date.now();
  const categoryId = normalizeProductCategory(config.category);
  const isPowder = isPowderCategory(categoryId);

  const popSize = Math.max(6, Math.min(60, config.populationSize || 20));
  const totalGens = Math.max(1, Math.min(25, config.generations || 8));
  const maxEvalCap = config.maxEvaluations || popSize * (totalGens + 1);

  const constraints = buildProductConstraints(categoryId, config.subCategory, config.customConstraints);
  const random = config.seed !== undefined ? createSeededRandom(config.seed) : Math.random;

  const allCandidates: ParetoCandidate[] = [];
  let currentPopulation: ParetoCandidate[] = [];
  let evaluationCount = 0;

  // 1. Evaluate baseline formula (Generation 0 Seed)
  const baselineEval = evaluateCandidateFormulation(
    startingIngredients,
    categoryId,
    constraints,
    'SEED-BASELINE',
    100
  );
  const baselineCandidate: ParetoCandidate = {
    candidateId: 'CAND-SEED-0',
    generation: 0,
    ingredients: startingIngredients.map(i => ({ ...i })),
    metrics: baselineEval.metrics,
    objectives: baselineEval.objectives,
    constraintsSummary: baselineEval.constraintsSummary,
    qualityGateReport: baselineEval.qualityGateReport,
    qualityGateStatus: baselineEval.qualityGateStatus,
    paretoRank: 1,
    crowdingDistance: 0,
    isDominated: false,
    isFeasible: baselineEval.isFeasible,
    evidenceStatus: 'PREDICTED_ONLY',
    orchestratorResult: baselineEval.orchestratorResult,
    fingerprint: baselineEval.orchestratorResult.formulaIdentity.fingerprint,
    uncertainty: baselineEval.orchestratorResult.uncertainty,
    provenance: baselineEval.orchestratorResult.provenance,
    executionTrace: baselineEval.orchestratorResult.executionTrace,
    stageDiagnostics: baselineEval.orchestratorResult.stageDiagnostics,
  };
  currentPopulation.push(baselineCandidate);
  allCandidates.push(baselineCandidate);
  evaluationCount++;

  // 2. Generate initial population variants from seed
  for (let i = 1; i < popSize; i++) {
    if (cancellationToken?.isCancelled || evaluationCount >= maxEvalCap) break;
    const perturbed = perturbCandidate(startingIngredients, random, 0.25, constraints);
    const candId = `CAND-G0-${i}`;
    const evaluated = evaluateCandidateFormulation(perturbed, categoryId, constraints, candId, 100);
    const candidate: ParetoCandidate = {
      candidateId: candId,
      generation: 0,
      ingredients: perturbed,
      metrics: evaluated.metrics,
      objectives: evaluated.objectives,
      constraintsSummary: evaluated.constraintsSummary,
      qualityGateReport: evaluated.qualityGateReport,
      qualityGateStatus: evaluated.qualityGateStatus,
      paretoRank: 1,
      crowdingDistance: 0,
      isDominated: false,
      isFeasible: evaluated.isFeasible,
      evidenceStatus: 'PREDICTED_ONLY',
      orchestratorResult: evaluated.orchestratorResult,
      fingerprint: evaluated.orchestratorResult.formulaIdentity.fingerprint,
      uncertainty: evaluated.orchestratorResult.uncertainty,
      provenance: evaluated.orchestratorResult.provenance,
      executionTrace: evaluated.orchestratorResult.executionTrace,
      stageDiagnostics: evaluated.orchestratorResult.stageDiagnostics,
    };
    currentPopulation.push(candidate);
    allCandidates.push(candidate);
    evaluationCount++;
  }

  assignParetoRanks(currentPopulation);

  // 3. Evolutionary Optimization Loop across Generations
  for (let gen = 1; gen <= totalGens; gen++) {
    if (cancellationToken?.isCancelled || evaluationCount >= maxEvalCap) break;

    // Yield execution to event loop to prevent UI thread freezing
    await new Promise(resolve => setTimeout(resolve, 5));

    // Progress update
    const feasibleList = allCandidates.filter(c => c.isFeasible);
    const bestCpi = feasibleList.length > 0 ? Math.max(...feasibleList.map(c => c.objectives.cpi)) : baselineCandidate.objectives.cpi;
    const feasibleWithCost = feasibleList.filter(c => c.objectives.costPerKg !== undefined);
    const lowestCost = feasibleWithCost.length > 0
      ? Math.min(...feasibleWithCost.map(c => c.objectives.costPerKg!))
      : (baselineCandidate.objectives.costPerKg ?? 0);

    if (onProgress) {
      onProgress({
        generation: gen,
        totalGenerations: totalGens,
        evaluationsCompleted: evaluationCount,
        totalEvaluationsPlanned: maxEvalCap,
        percentComplete: Math.round((gen / totalGens) * 100),
        bestCpiSoFar: bestCpi,
        lowestCostSoFar: lowestCost,
        feasibleCandidatesCount: feasibleList.length,
      });
    }

    // Select parents from elite Pareto front
    const parents = [...currentPopulation].sort((a, b) => a.paretoRank - b.paretoRank || b.crowdingDistance - a.crowdingDistance);
    const offspringPool: ParetoCandidate[] = [];

    for (let j = 0; j < popSize; j++) {
      if (cancellationToken?.isCancelled || evaluationCount >= maxEvalCap) break;
      const parentIdx = Math.floor(random() * Math.min(parents.length, Math.max(3, Math.floor(popSize / 2))));
      const parent = parents[parentIdx];

      const mutatedIngs = perturbCandidate(parent.ingredients, random, config.mutationRate || 0.15, constraints);
      const candId = `CAND-G${gen}-${j}`;
      const evalRes = evaluateCandidateFormulation(mutatedIngs, categoryId, constraints, candId, 100);

      const offspring: ParetoCandidate = {
        candidateId: candId,
        generation: gen,
        ingredients: mutatedIngs,
        metrics: evalRes.metrics,
        objectives: evalRes.objectives,
        constraintsSummary: evalRes.constraintsSummary,
        qualityGateReport: evalRes.qualityGateReport,
        qualityGateStatus: evalRes.qualityGateStatus,
        paretoRank: 999,
        crowdingDistance: 0,
        isDominated: true,
        isFeasible: evalRes.isFeasible,
        evidenceStatus: 'PREDICTED_ONLY',
        orchestratorResult: evalRes.orchestratorResult,
        fingerprint: evalRes.orchestratorResult.formulaIdentity.fingerprint,
        uncertainty: evalRes.orchestratorResult.uncertainty,
        provenance: evalRes.orchestratorResult.provenance,
        executionTrace: evalRes.orchestratorResult.executionTrace,
        stageDiagnostics: evalRes.orchestratorResult.stageDiagnostics,
      };

      offspringPool.push(offspring);
      allCandidates.push(offspring);
      evaluationCount++;
    }

    // Combine current population and offspring, rank them, and select top popSize
    const combined = [...currentPopulation, ...offspringPool];
    assignParetoRanks(combined);
    combined.sort((a, b) => a.paretoRank - b.paretoRank || b.crowdingDistance - a.crowdingDistance);
    currentPopulation = combined.slice(0, popSize);
  }

  // Final Pareto ranking of all evaluated candidates
  assignParetoRanks(allCandidates);

  // Extract Non-Dominated Feasible Pareto Front (Rank 1)
  const paretoFront = allCandidates.filter(c => c.isFeasible && c.paretoRank === 1);
  const prioritizedCandidates = paretoFront.length > 0
    ? paretoFront
    : allCandidates.filter(c => c.isFeasible).slice(0, 5);

  const sortedParetoFront = sortCandidatesByStrategy(prioritizedCandidates, config.strategy);

  return {
    categoryId,
    isPowder,
    totalEvaluations: evaluationCount,
    generationsCompleted: totalGens,
    candidates: allCandidates,
    paretoFront: sortedParetoFront,
    executionTimeMs: Date.now() - startTime,
    wasCancelled: !!cancellationToken?.isCancelled,
  };
}

/**
 * Sorts candidates according to explicit optimization strategy.
 * For COST_FIRST: candidates with complete known costs are ranked by lowest cost.
 * Incomplete/unknown cost candidates are placed at the end with status disclosed.
 */
export function sortCandidatesByStrategy(
  candidates: ParetoCandidate[],
  strategy: OptimizationStrategy = 'BALANCED'
): ParetoCandidate[] {
  const list = [...candidates];
  switch (strategy) {
    case 'COST_FIRST':
      return list.sort((a, b) => {
        if (a.isFeasible !== b.isFeasible) return a.isFeasible ? -1 : 1;
        const aKnown = a.objectives.costStatus === 'KNOWN' && a.objectives.costPerKg !== undefined;
        const bKnown = b.objectives.costStatus === 'KNOWN' && b.objectives.costPerKg !== undefined;
        if (aKnown && !bKnown) return -1;
        if (!aKnown && bKnown) return 1;
        if (aKnown && bKnown) {
          return a.objectives.costPerKg! - b.objectives.costPerKg!;
        }
        return a.paretoRank - b.paretoRank;
      });
    case 'PERFORMANCE_FIRST':
      return list.sort((a, b) => {
        if (a.isFeasible !== b.isFeasible) return a.isFeasible ? -1 : 1;
        return b.objectives.cpi - a.objectives.cpi;
      });
    case 'BALANCED':
    default:
      return list.sort((a, b) => {
        if (a.isFeasible !== b.isFeasible) return a.isFeasible ? -1 : 1;
        if (a.paretoRank !== b.paretoRank) return a.paretoRank - b.paretoRank;
        return b.crowdingDistance - a.crowdingDistance;
      });
  }
}

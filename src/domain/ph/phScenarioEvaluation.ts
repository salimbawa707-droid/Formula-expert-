/**
 * Phase 5B-2 — explicit PHEngineV2 scenario evaluation.
 *
 * This module evaluates caller-supplied, complete compositions. It does not
 * manufacture low/nominal/high assays from registry defaults or neutralization
 * equivalents. Successful output is a sampled scenario envelope, never a
 * guaranteed mathematical interval.
 */
import type { IngredientInput } from '../../types';
import { PHEngineV2 } from './pHEngineV2';
import type { PHCalculationOptions, DetailedPHResult } from './types';

export type PHScenarioStatus =
  | 'CONVERGED'
  | 'NON_CONVERGED'
  | 'INSUFFICIENT_DATA'
  | 'INVALID_FORMULA'
  | 'SEED_SENSITIVE';

export interface PHScenarioDefinition {
  scenarioId: string;
  label: string;
  ingredients: IngredientInput[];
  totalMassKg: number;
  evidenceRefs: string[];
  options?: PHCalculationOptions;
}

export interface PHScenarioRun {
  initialGuess: number;
  pH: number | null;
  status: DetailedPHResult['status'];
  converged: boolean;
  iterations: number;
  residual: number | null;
  ionicStrength: number | null;
  modelValidity: DetailedPHResult['modelValidity'];
  warnings: string[];
}

export interface PHScenarioResult {
  scenarioId: string;
  label: string;
  status: PHScenarioStatus;
  pH: number | null;
  seedSpreadPH: number | null;
  runs: PHScenarioRun[];
  evidenceRefs: string[];
  warnings: string[];
}

export interface PHScenarioAssessment {
  status: 'SAMPLED_ENVELOPE_READY' | 'INCOMPLETE_SCENARIOS' | 'INVALID_INPUT';
  envelope: { minimumPH: number; maximumPH: number } | null;
  envelopeSemantics: 'SAMPLED_SCENARIO_ENVELOPE_NOT_GUARANTEED_BOUND';
  scenarios: PHScenarioResult[];
  initialGuesses: number[];
  seedInvariant: boolean;
  batchMassKg: number | null;
  warnings: string[];
  releaseEligible: false;
}

export const DEFAULT_PH_SCENARIO_SEEDS = [3, 7, 11] as const;
export const DEFAULT_PH_SEED_INVARIANCE_TOLERANCE = 0.0001;

function optionSignature(options: PHCalculationOptions = {}): string {
  return JSON.stringify({
    temperatureC: options.temperatureC ?? 25,
    activityModel: options.activityModel ?? 'ideal',
    productCategory: options.productCategory ?? null,
    assumeSlurryBasisIfPowder: options.assumeSlurryBasisIfPowder ?? true,
    slurryConcentrationPct: options.slurryConcentrationPct ?? 1,
    maxIterations: options.maxIterations ?? 60,
    tolerance: options.tolerance ?? 1e-8
  });
}

function validateScenarioMassBalance(scenario: PHScenarioDefinition): string | null {
  let summedMassKg = 0;
  for (const ingredient of scenario.ingredients) {
    if (!ingredient || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
      return 'Every ingredient must have a non-empty name before mass-balance validation.';
    }
    const raw = ingredient as IngredientInput & { rawKg?: number; weightKg?: number; rawPercent?: number };
    const hasRawKg = raw.rawKg !== undefined && raw.rawKg !== null;
    const hasWeightKg = raw.weightKg !== undefined && raw.weightKg !== null;
    const hasRawPercent = raw.rawPercent !== undefined && raw.rawPercent !== null;
    if (Number(hasRawKg) + Number(hasWeightKg) + Number(hasRawPercent) !== 1) {
      return `Ingredient "${ingredient.name}" must specify exactly one mass basis: rawKg, weightKg, or rawPercent.`;
    }
    if (hasRawKg || hasWeightKg) {
      const mass = Number(hasRawKg ? raw.rawKg : raw.weightKg);
      if (!Number.isFinite(mass) || mass < 0) {
        return `Ingredient "${ingredient.name}" has a negative or non-finite mass.`;
      }
      summedMassKg += mass;
    } else {
      const percent = Number(raw.rawPercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return `Ingredient "${ingredient.name}" has an invalid rawPercent (must be 0–100%).`;
      }
      summedMassKg += scenario.totalMassKg * percent / 100;
    }
  }
  const toleranceKg = Math.max(1e-6, scenario.totalMassKg * 1e-8);
  if (Math.abs(summedMassKg - scenario.totalMassKg) > toleranceKg) {
    return `Ingredient masses sum to ${summedMassKg} kg, not declared batch mass ${scenario.totalMassKg} kg (tolerance ${toleranceKg} kg).`;
  }
  return null;
}

function invalidAssessment(message: string): PHScenarioAssessment {
  return {
    status: 'INVALID_INPUT',
    envelope: null,
    envelopeSemantics: 'SAMPLED_SCENARIO_ENVELOPE_NOT_GUARANTEED_BOUND',
    scenarios: [],
    initialGuesses: [...DEFAULT_PH_SCENARIO_SEEDS],
    seedInvariant: false,
    batchMassKg: null,
    warnings: [message, 'No pH envelope was emitted.'],
    releaseEligible: false
  };
}

function summarizeRun(initialGuess: number, result: DetailedPHResult): PHScenarioRun {
  return {
    initialGuess,
    pH: result.details.solverPHUnrounded ?? result.pH,
    status: result.status,
    converged: result.solverConverged && result.converged,
    iterations: result.solverIterations,
    residual: result.residual,
    ionicStrength: result.ionicStrength,
    modelValidity: result.modelValidity,
    warnings: [...result.warnings]
  };
}

/**
 * Runs each explicit composition through the sole aqueous equilibrium
 * authority (PHEngineV2) at multiple initial guesses. Any missing/invalid or
 * non-converged scenario withholds the complete sampled envelope.
 */
export function evaluatePHScenarios(
  scenarios: PHScenarioDefinition[],
  initialGuesses: number[] = [...DEFAULT_PH_SCENARIO_SEEDS],
  seedInvariantTolerancePH = DEFAULT_PH_SEED_INVARIANCE_TOLERANCE
): PHScenarioAssessment {
  if (!Array.isArray(scenarios) || scenarios.length < 2) {
    return invalidAssessment('At least two explicit, independently identified scenarios are required.');
  }
  if (!Array.isArray(initialGuesses) || initialGuesses.length < 2 ||
      initialGuesses.some(x => !Number.isFinite(x) || x < -1 || x > 15) ||
      new Set(initialGuesses).size !== initialGuesses.length) {
    return invalidAssessment('At least two unique finite initial guesses within the solver search domain are required.');
  }
  if (!Number.isFinite(seedInvariantTolerancePH) || seedInvariantTolerancePH < 0) {
    return invalidAssessment('Seed-invariance tolerance must be finite and non-negative.');
  }

  const first = scenarios[0];
  if (!first || !Number.isFinite(first.totalMassKg) || first.totalMassKg <= 0) {
    return invalidAssessment('Each scenario requires a positive finite batch mass.');
  }
  const batchMassKg = first.totalMassKg;
  const sharedOptions = optionSignature(first.options);

  const seenIds = new Set<string>();
  for (const scenario of scenarios) {
    if (!scenario || typeof scenario.scenarioId !== 'string' || !scenario.scenarioId.trim() ||
        seenIds.has(scenario.scenarioId)) {
      return invalidAssessment('Scenario IDs must be non-empty and unique.');
    }
    seenIds.add(scenario.scenarioId);
    if (typeof scenario.label !== 'string' || !scenario.label.trim() ||
        !Array.isArray(scenario.ingredients) || scenario.ingredients.length === 0) {
      return invalidAssessment('Each scenario requires a label and a non-empty complete ingredient composition.');
    }
    if (!Number.isFinite(scenario.totalMassKg) || scenario.totalMassKg !== batchMassKg) {
      return invalidAssessment('All scenarios must use the same positive batch-mass basis.');
    }
    if (!Array.isArray(scenario.evidenceRefs) || scenario.evidenceRefs.length === 0 ||
        scenario.evidenceRefs.some(ref => typeof ref !== 'string' || !ref.trim())) {
      return invalidAssessment('Every scenario requires explicit non-empty input evidence references.');
    }
    if (optionSignature(scenario.options) !== sharedOptions) {
      return invalidAssessment('All scenarios must share temperature, activity model, product/slurry basis and solver tolerances.');
    }
    const massBalanceError = validateScenarioMassBalance(scenario);
    if (massBalanceError) return invalidAssessment(massBalanceError);
  }

  const results: PHScenarioResult[] = scenarios.map(scenario => {
    const runs = initialGuesses.map(initialGuess => {
      const result = PHEngineV2.calculatePH(
        scenario.ingredients.map(ingredient => ({ ...ingredient })),
        scenario.totalMassKg,
        { ...(scenario.options ?? {}), targetPH: initialGuess }
      );
      return summarizeRun(initialGuess, result);
    });
    const validRuns = runs.every(run =>
      run.converged && run.status === 'CONVERGED' &&
      run.pH !== null && Number.isFinite(run.pH) &&
      run.pH >= 0 && run.pH <= 14 &&
      run.modelValidity !== 'OUT_OF_RANGE' &&
      run.residual !== null && Number.isFinite(run.residual)
    );
    const phValues = runs.map(run => run.pH).filter((value): value is number => value !== null && Number.isFinite(value));
    const spread = phValues.length === runs.length && phValues.length > 0
      ? Math.max(...phValues) - Math.min(...phValues)
      : null;
    const seedStable = spread !== null && spread <= seedInvariantTolerancePH;
    const status: PHScenarioStatus = !validRuns
      ? (runs.some(run => run.status === 'INVALID_FORMULA') ? 'INVALID_FORMULA'
        : runs.some(run => run.status === 'INSUFFICIENT_DATA') ? 'INSUFFICIENT_DATA'
        : 'NON_CONVERGED')
      : (!seedStable ? 'SEED_SENSITIVE' : 'CONVERGED');
    const representativePH = status === 'CONVERGED'
      ? runs.find(run => run.initialGuess === 7)?.pH ?? runs[0].pH
      : null;
    return {
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      status,
      pH: representativePH,
      seedSpreadPH: spread,
      runs,
      evidenceRefs: [...scenario.evidenceRefs],
      warnings: [...new Set(runs.flatMap(run => run.warnings))]
    };
  });

  const allConverged = results.every(result => result.status === 'CONVERGED' && result.pH !== null);
  const values = results.map(result => result.pH).filter((value): value is number => value !== null);
  return {
    status: allConverged ? 'SAMPLED_ENVELOPE_READY' : 'INCOMPLETE_SCENARIOS',
    envelope: allConverged && values.length === results.length
      ? { minimumPH: Math.min(...values), maximumPH: Math.max(...values) }
      : null,
    envelopeSemantics: 'SAMPLED_SCENARIO_ENVELOPE_NOT_GUARANTEED_BOUND',
    scenarios: results,
    initialGuesses: [...initialGuesses],
    seedInvariant: allConverged,
    batchMassKg,
    warnings: [
      'This is a sampled scenario envelope, not a guaranteed mathematical lower/upper pH bound.',
      'Scenario compositions and evidence references are caller-supplied; no assay or equivalent bounds are inferred.',
      'Every scenario must converge at every initial guess; any failure withholds the complete envelope.',
      'PHEngineV2 is the sole equilibrium solver. This assessment is not a measurement, empirical validation or release approval.'
    ],
    releaseEligible: false
  };
}

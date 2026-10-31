/**
 * ============================================================================
 * pH ENGINE & STOICHIOMETRIC DOSING ELIGIBILITY EVALUATOR
 * ============================================================================
 * Pure evaluation function providing strict validity gating for stoichiometric
 * equivalence diagnostics, equilibrium pH results, and corrective reagent dosing.
 *
 * Enforces defensive invariants:
 * - Convergence must be explicitly confirmed as boolean true.
 * - Calculated pH must be finite and within physical bounds [0, 14].
 * - Diagnostic acid/base equivalents must be finite, non-negative numbers.
 * - Reagent parameters (MW, purity/assay, valency) must be strictly valid.
 * - Heuristic display threshold is explicitly labeled as computational noise gate.
 * ============================================================================
 */

import { DetailedPHResult } from '../domain/ph/types';
import { PHAdvancedResult } from '../types';

export interface ReagentConfig {
  name: string;
  mw: number;
  purity: number;
  valency: number;
}

export const DEFAULT_ALKALI_REAGENTS: Record<string, ReagentConfig> = {
  "NaOH Flakes (99% / 100%)": { name: "NaOH Flakes (99% / 100%)", mw: 39.9971, purity: 0.99, valency: 1 },
  "Caustic Lye NaOH (50% Soln)": { name: "Caustic Lye NaOH (50% Soln)", mw: 39.9971, purity: 0.50, valency: 1 },
  "Caustic Lye NaOH (48% Soln)": { name: "Caustic Lye NaOH (48% Soln)", mw: 39.9971, purity: 0.48, valency: 1 },
  "Potassium Hydroxide KOH (90% Flakes)": { name: "Potassium Hydroxide KOH (90% Flakes)", mw: 56.1056, purity: 0.90, valency: 1 },
  "Soda Ash Light Na2CO3 (99.2%)": { name: "Soda Ash Light Na2CO3 (99.2%)", mw: 105.988, purity: 0.992, valency: 2 },
  "Triethanolamine TEA (99%)": { name: "Triethanolamine TEA (99%)", mw: 149.188, purity: 0.99, valency: 1 },
};

export const DEFAULT_ACID_REAGENTS: Record<string, ReagentConfig> = {
  "LABSA (90% Acid Slurry)": { name: "LABSA (90% Acid Slurry)", mw: 326.49, purity: 0.90, valency: 1 },
  "LABSA (96% High-Active)": { name: "LABSA (96% High-Active)", mw: 326.49, purity: 0.96, valency: 1 },
  "Citric Acid Anhydrous (100%)": { name: "Citric Acid Anhydrous (100%)", mw: 192.12, purity: 1.00, valency: 3 },
  "Hydrochloric Acid HCl (33% Technical)": { name: "Hydrochloric Acid HCl (33% Technical)", mw: 36.46, purity: 0.33, valency: 1 },
};

export type DosingStatus =
  | 'UNAVAILABLE'
  | 'ACID_EXCESS'
  | 'ALKALI_EXCESS'
  | 'NEUTRAL';

export interface DosingEligibilityEvaluation {
  /** High-level eligibility and stoichiometric state */
  status: DosingStatus;
  /** Whether diagnostics and equilibrium solver results are strictly valid */
  isCalculationValid: boolean;
  /** Whether corrective dosing numbers are mathematically and physically computable */
  isDosingAvailable: boolean;
  /** Explicit human-readable reason when diagnostics or dosing are unavailable */
  unavailabilityReason: string | null;
  /** Validated current pH, or null if invalid / non-finite */
  validatedPH: number | null;
  /** Validated stoichiometric excess acid in chemical equivalents (eq), or null */
  validatedAcidEquivalents: number | null;
  /** Validated stoichiometric excess base in chemical equivalents (eq), or null */
  validatedBaseEquivalents: number | null;
  /** Computational heuristic epsilon threshold in eq */
  stoichiometricEpsilon: number;
  /** Pure 100% active corrective reagent needed in grams, or null */
  activeReagentGramsNeeded: number | null;
  /** Commercial corrective reagent needed in grams (assay adjusted), or null */
  commercialReagentGrams: number | null;
  /** Commercial corrective reagent needed in kg, or null */
  commercialReagentKg: number | null;
  /** Selected corrective reagent key/name applied */
  selectedReagentName: string | null;
  /** Display action text for Step 2 UI */
  actionRequiredText: string;
  /** Display detail text for Step 2 UI */
  actionDetailText: string;
}

/**
 * Validates a corrective chemical reagent configuration record.
 */
export function isValidReagent(reagent: ReagentConfig | null | undefined): reagent is ReagentConfig {
  if (!reagent || typeof reagent !== 'object') return false;
  if (typeof reagent.name !== 'string' || reagent.name.trim().length === 0) return false;
  if (typeof reagent.mw !== 'number' || !Number.isFinite(reagent.mw) || reagent.mw <= 0) return false;
  if (typeof reagent.purity !== 'number' || !Number.isFinite(reagent.purity) || reagent.purity <= 0 || reagent.purity > 1.0) return false;
  if (typeof reagent.valency !== 'number' || !Number.isInteger(reagent.valency) || reagent.valency < 1) return false;
  return true;
}

/**
 * Evaluates whether formulation calculation results meet strict eligibility
 * for stoichiometric equivalence conclusions and corrective dosing recommendations.
 */
export function evaluateDosingEligibility(
  result: PHAdvancedResult | DetailedPHResult | null | undefined,
  batchSizeKg: number,
  selectedAlkaliKey: string,
  selectedAcidKey: string,
  alkaliReagentsTable: Record<string, ReagentConfig>,
  acidReagentsTable: Record<string, ReagentConfig>
): DosingEligibilityEvaluation {
  // 1. Guard against null, undefined, or malformed result objects
  if (!result || typeof result !== 'object') {
    return createUnavailableEvaluation('Advanced calculation result is missing or uninitialized.');
  }

  // 2. Strict canonical solver convergence verification (must be explicitly true)
  if (result.solverConverged !== true) {
    return createUnavailableEvaluation('Canonical equilibrium solver convergence was not confirmed.');
  }

  // 3. Strict legacy convergence alias consistency check (must not contradict canonical flag)
  const legacyConverged = (result as any).converged;
  if (legacyConverged !== undefined && legacyConverged !== true) {
    return createUnavailableEvaluation('Contradictory convergence state: canonical solver converged but legacy flag indicates non-convergence.');
  }

  // 3. Strict finite pH verification
  const rawPH = result.finalPH ?? result.pH;
  if (typeof rawPH !== 'number' || !Number.isFinite(rawPH) || rawPH < 0 || rawPH > 14) {
    return createUnavailableEvaluation('Calculated pH is non-finite, missing, or outside physical chemical bounds [0, 14].');
  }

  // 4. Strict finite, non-negative acid/base equivalent diagnostics verification
  const rawAcidEq = result.excessAcidEquivalents ?? (result as any).excessAcidMoles;
  const rawBaseEq = result.excessBaseEquivalents ?? (result as any).excessBaseMoles;

  if (typeof rawAcidEq !== 'number' || !Number.isFinite(rawAcidEq)) {
    return createUnavailableEvaluation('Stoichiometric acid equivalent diagnostic is missing or non-finite.');
  }
  if (rawAcidEq < 0) {
    return createUnavailableEvaluation('Stoichiometric acid equivalent diagnostic must be non-negative.');
  }

  if (typeof rawBaseEq !== 'number' || !Number.isFinite(rawBaseEq)) {
    return createUnavailableEvaluation('Stoichiometric base equivalent diagnostic is missing or non-finite.');
  }
  if (rawBaseEq < 0) {
    return createUnavailableEvaluation('Stoichiometric base equivalent diagnostic must be non-negative.');
  }

  // 5. Batch size verification (in kg)
  if (typeof batchSizeKg !== 'number' || !Number.isFinite(batchSizeKg) || batchSizeKg <= 0) {
    return createUnavailableEvaluation('Formulation batch size must be a positive finite mass in kilograms.');
  }

  // 6. Computational heuristic epsilon threshold (0.1 meq/kg relative with 0.01 meq floor)
  // Note: Computational display threshold to suppress floating-point noise; not an empirical lab boundary.
  const stoichiometricEpsilon = Math.max(1e-5, batchSizeKg * 1e-4);

  const isAcidExcess = rawAcidEq > stoichiometricEpsilon;
  const isAlkaliExcess = rawBaseEq > stoichiometricEpsilon;

  // 7. Branch evaluation based on validated stoichiometric excess
  if (isAcidExcess) {
    const alkaliReagent = alkaliReagentsTable[selectedAlkaliKey];
    if (!isValidReagent(alkaliReagent)) {
      return createUnavailableEvaluation(
        `Selected alkali corrective reagent "${selectedAlkaliKey}" has invalid molecular parameters.`,
        rawPH,
        rawAcidEq,
        rawBaseEq,
        stoichiometricEpsilon
      );
    }

    const activeGrams = (rawAcidEq / alkaliReagent.valency) * alkaliReagent.mw;
    const commercialGrams = activeGrams / alkaliReagent.purity;
    const commercialKg = commercialGrams / 1000;

    return {
      status: 'ACID_EXCESS',
      isCalculationValid: true,
      isDosingAvailable: true,
      unavailabilityReason: null,
      validatedPH: rawPH,
      validatedAcidEquivalents: rawAcidEq,
      validatedBaseEquivalents: rawBaseEq,
      stoichiometricEpsilon,
      activeReagentGramsNeeded: activeGrams,
      commercialReagentGrams: commercialGrams,
      commercialReagentKg: commercialKg,
      selectedReagentName: alkaliReagent.name,
      actionRequiredText: `Add ${commercialGrams.toFixed(2)} g ${alkaliReagent.name}`,
      actionDetailText: `(${commercialKg.toFixed(4)} kg ${alkaliReagent.name})`
    };
  }

  if (isAlkaliExcess) {
    const acidReagent = acidReagentsTable[selectedAcidKey];
    if (!isValidReagent(acidReagent)) {
      return createUnavailableEvaluation(
        `Selected acid corrective reagent "${selectedAcidKey}" has invalid molecular parameters.`,
        rawPH,
        rawAcidEq,
        rawBaseEq,
        stoichiometricEpsilon
      );
    }

    const activeGrams = (rawBaseEq / acidReagent.valency) * acidReagent.mw;
    const commercialGrams = activeGrams / acidReagent.purity;
    const commercialKg = commercialGrams / 1000;

    return {
      status: 'ALKALI_EXCESS',
      isCalculationValid: true,
      isDosingAvailable: true,
      unavailabilityReason: null,
      validatedPH: rawPH,
      validatedAcidEquivalents: rawAcidEq,
      validatedBaseEquivalents: rawBaseEq,
      stoichiometricEpsilon,
      activeReagentGramsNeeded: activeGrams,
      commercialReagentGrams: commercialGrams,
      commercialReagentKg: commercialKg,
      selectedReagentName: acidReagent.name,
      actionRequiredText: `Add ${commercialGrams.toFixed(2)} g ${acidReagent.name}`,
      actionDetailText: `(${commercialKg.toFixed(4)} kg ${acidReagent.name})`
    };
  }

  // 8. Stoichiometric Equivalence (both acid and alkali <= epsilon)
  return {
    status: 'NEUTRAL',
    isCalculationValid: true,
    isDosingAvailable: true,
    unavailabilityReason: null,
    validatedPH: rawPH,
    validatedAcidEquivalents: rawAcidEq,
    validatedBaseEquivalents: rawBaseEq,
    stoichiometricEpsilon,
    activeReagentGramsNeeded: 0,
    commercialReagentGrams: 0,
    commercialReagentKg: 0,
    selectedReagentName: null,
    actionRequiredText: 'No Reagents Needed',
    actionDetailText: 'Specification satisfied'
  };
}

function createUnavailableEvaluation(
  reason: string,
  pH: number | null = null,
  acidEq: number | null = null,
  baseEq: number | null = null,
  epsilon: number = 1e-5
): DosingEligibilityEvaluation {
  return {
    status: 'UNAVAILABLE',
    isCalculationValid: false,
    isDosingAvailable: false,
    unavailabilityReason: reason,
    validatedPH: pH,
    validatedAcidEquivalents: acidEq,
    validatedBaseEquivalents: baseEq,
    stoichiometricEpsilon: epsilon,
    activeReagentGramsNeeded: null,
    commercialReagentGrams: null,
    commercialReagentKg: null,
    selectedReagentName: null,
    actionRequiredText: 'Titration Required (Diagnostics Unavailable)',
    actionDetailText: reason
  };
}

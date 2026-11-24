/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - MASTER ORCHESTRATOR
 * ============================================================================
 * Coordinates composition normalization, species mapping, equilibrium solving,
 * activity coefficients, buffer capacity, speciation, and confidence auditing.
 * ============================================================================
 */

import { IngredientInput } from '../../types';
import { ActivityModel } from './activityModel';
import { normalizeFormulationComposition } from './compositionNormalizer';
import { ConfidenceEvaluator } from './confidenceEvaluator';
import { EquilibriumSystem } from './equilibriumSystem';
import { NumericalEquilibriumSolver } from './numericalSolver';
import {
  ActivityModelType,
  DetailedPHResult,
  PHCalculationOptions
} from './types';

export class PHEngineV2 {
  /**
   * Calculates formulation pH through full chemical equilibrium speciation.
   */
  static calculatePH(
    ingredients: IngredientInput[],
    totalMassKg: number = 100,
    options: PHCalculationOptions = {}
  ): DetailedPHResult {
    const temperatureC = options.temperatureC ?? 25.0;
    const activityModel: ActivityModelType = options.activityModel ?? 'ideal';

    // Fail closed before composition normalization can coerce missing or invalid fields.
    const inputErrors: string[] = [];
    if (!Array.isArray(ingredients)) {
      inputErrors.push('Ingredient list must be an array.');
    } else {
      if (!Number.isFinite(totalMassKg) || totalMassKg <= 0) inputErrors.push('Total batch mass must be a finite value greater than zero.');
      ingredients.forEach((ingredient, index) => {
        if (!ingredient || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
          inputErrors.push(`Ingredient ${index + 1} has no valid name.`);
          return;
        }
        const hasRawMass = ingredient.rawKg !== undefined && ingredient.rawKg !== null;
        const hasWeightMass = ingredient.weightKg !== undefined && ingredient.weightKg !== null;
        if (hasRawMass && (!Number.isFinite(Number(ingredient.rawKg)) || Number(ingredient.rawKg) < 0)) {
          inputErrors.push(`Ingredient ${ingredient.name} has invalid rawKg.`);
        } else if (!hasRawMass && hasWeightMass && (!Number.isFinite(Number(ingredient.weightKg)) || Number(ingredient.weightKg) < 0)) {
          inputErrors.push(`Ingredient ${ingredient.name} has invalid weightKg.`);
        } else if (!hasRawMass && !hasWeightMass) {
          const rawPct = ingredient.rawPercent;
          const pct = rawPct === undefined || rawPct === null || (typeof rawPct === 'string' && rawPct.trim() === '')
            ? Number.NaN
            : Number(rawPct);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
            inputErrors.push(`Ingredient ${ingredient.name} has a missing or invalid percentage (0–100%).`);
          }
        }
        const rawAssay = ingredient.activePercent ?? (ingredient as any).activeMatterPct ?? (ingredient as any).activeMatterPurity ?? ingredient.purity;
        if (rawAssay !== undefined && rawAssay !== null) {
          const assay = Number(rawAssay);
          if (!Number.isFinite(assay) || assay < 0 || assay > 100) {
            inputErrors.push(`Ingredient ${ingredient.name} has an invalid active assay/purity (0–100%).`);
          }
        }
      });
    }
    if (!Number.isFinite(temperatureC) || temperatureC <= -273.15 || temperatureC > 200) {
      inputErrors.push('Temperature must be a finite value above absolute zero and no more than 200 °C.');
    }
    if (options.slurryConcentrationPct !== undefined &&
      (!Number.isFinite(options.slurryConcentrationPct) || options.slurryConcentrationPct <= 0 || options.slurryConcentrationPct > 100)) {
      inputErrors.push('Powder slurry concentration must be greater than 0% and no more than 100%.');
    }
    if (inputErrors.length > 0) {
      return {
        pH: null,
        finalPH: null,
        status: 'INVALID_FORMULA',
        method: 'INPUT_VALIDATION',
        converged: false,
        iterations: 0,
        residual: null,
        stepSize: 0,
        ionicStrength: null,
        activityModel,
        modelValidity: 'OUT_OF_RANGE',
        temperatureC,
        assumptions: [],
        warnings: inputErrors,
        confidence: 0,
        measuredPH: null,
        predictionError: null,
        excessAcidEquivalents: 0,
        excessBaseEquivalents: 0,
        excessStrongAcidEquivalents: 0,
        excessStrongBaseEquivalents: 0,
        excessStrongAcid: 0,
        excessStrongBase: 0,
        excessAcidMoles: 0,
        excessBaseMoles: 0,
        bufferCapacity: null,
        totalBufferCapacity: null,
        solverConverged: false,
        solverIterations: 0,
        netEquivalents: 0,
        netMoles: 0,
        details: {
          totalAcidEquivalents: 0,
          totalBaseEquivalents: 0,
          totalStrongAcidEquivalents: 0,
          totalStrongBaseEquivalents: 0,
          netEquivalents: 0,
          totalAcidMoles: 0,
          totalBaseMoles: 0,
          netMoles: 0,
          recognizedContributors: [],
          modelType: activityModel,
          speciation: [],
          ionicStrength: null,
          chargeResidual: null
        }
      };
    }

    // 1. Normalize composition
    const composition = normalizeFormulationComposition(ingredients, totalMassKg, options);
    (composition as any).activityModel = activityModel;

    // A numerical root is not evidence that pH is chemically identifiable.
    // Require at least one recognized acid/base/buffer contributor and reject
    // compositions containing unrecognized mass that could alter the pH.
    const hasPHActiveSpecies = composition.ingredients.some(item =>
      item.resolvedSpecies !== null &&
      item.moles > 0 &&
      item.resolvedSpecies.pHEffect !== 'neutral'
    );
    const isPureWaterComposition = composition.ingredients.length > 0 &&
      composition.ingredients.every(item => item.resolvedSpecies?.isSolventWater === true) &&
      composition.unrecognizedCount === 0;
    const hasUnrecognizedIngredients = composition.unrecognizedCount > 0;
    // Pure water is a supported special case through water autoionization (Kw).
    // Other neutral/inert mixtures are not assigned pH 7 merely because the
    // acid/base model has no recognized contributor.
    const hasAdequatePHChemistry = (hasPHActiveSpecies || isPureWaterComposition) && !hasUnrecognizedIngredients;

    // 2. Numerical equilibrium solver
    const solverRes = NumericalEquilibriumSolver.solve(composition, temperatureC, {
      tolerance: options.tolerance ?? 1e-8,
      maxIterations: options.maxIterations ?? 60,
      initialGuess: (typeof options.targetPH === 'number' && Number.isFinite(options.targetPH)) ? options.targetPH : undefined
    });

    const isConverged = hasAdequatePHChemistry &&
      solverRes.converged === true &&
      Number.isFinite(solverRes.pH) &&
      solverRes.pH >= 0 &&
      solverRes.pH <= 14;
    const solvedPH = isConverged ? solverRes.pH : null;

    // 3. Equilibrium charge balance & speciation at evaluation pH
    // Only perform equilibrium calculations if the solver converged with a finite pH.
    let finalEquilibrium = null;
    let ionicStrength: number | null = null;
    let bufferCapacity: number | null = null;

    if (isConverged && solvedPH !== null) {
      finalEquilibrium = EquilibriumSystem.evaluateChargeBalance(
        solvedPH,
        composition,
        temperatureC
      );

      // 4. Calculate ionic strength from all participating ions
      ionicStrength = Number(ActivityModel.calculateIonicStrength(finalEquilibrium.ions).toFixed(4));

      // 5. Buffer capacity beta
      bufferCapacity = EquilibriumSystem.calculateBufferCapacity(solvedPH, composition, temperatureC);
    }

    // 6. Excess stoichiometric acid/base equivalents (theoretical titratable capacity in eq)
    // Stoichiometric capacity is independent of solver convergence.
    let totalAcidEquivalents = 0;
    let totalBaseEquivalents = 0;
    let totalStrongAcidEquivalents = 0;
    let totalStrongBaseEquivalents = 0;
    const recognizedContributors: string[] = [];

    for (const item of composition.ingredients) {
      if (item.resolvedSpecies && item.moles > 0) {
        recognizedContributors.push(item.resolvedSpecies.speciesId);
        const eq = item.resolvedSpecies.eqPerMole ?? 1;
        const family = item.resolvedSpecies.family;
        if (item.resolvedSpecies.pHEffect === 'acid') {
          totalAcidEquivalents += item.moles * eq;
          if (family === 'STRONG_ACID') {
            totalStrongAcidEquivalents += item.moles * eq;
          }
        } else if (item.resolvedSpecies.pHEffect === 'base') {
          totalBaseEquivalents += item.moles * eq;
          if (family === 'STRONG_BASE') {
            totalStrongBaseEquivalents += item.moles * eq;
          }
        }
      }
    }

    const excessAcidEquivalents = Number(Math.max(0, totalAcidEquivalents - totalBaseEquivalents).toFixed(4));
    const excessBaseEquivalents = Number(Math.max(0, totalBaseEquivalents - totalAcidEquivalents).toFixed(4));
    const excessStrongAcidEquivalents = Number(Math.max(0, totalStrongAcidEquivalents - totalBaseEquivalents).toFixed(4));
    const excessStrongBaseEquivalents = Number(Math.max(0, totalStrongBaseEquivalents - totalAcidEquivalents).toFixed(4));
    const netEquivalents = Number((totalBaseEquivalents - totalAcidEquivalents).toFixed(4));

    // Aliases for legacy backward compatibility
    const totalAcidMoles = totalAcidEquivalents;
    const totalBaseMoles = totalBaseEquivalents;
    const excessAcidMoles = excessAcidEquivalents;
    const excessBaseMoles = excessBaseEquivalents;
    const excessStrongAcid = excessStrongAcidEquivalents;
    const excessStrongBase = excessStrongBaseEquivalents;
    const netMoles = netEquivalents;

    // 7. Confidence & Diagnostics
    const diag =
      isConverged &&
      ionicStrength !== null &&
      Number.isFinite(ionicStrength)
        ? ConfidenceEvaluator.evaluate(
            solverRes,
            composition,
            ionicStrength,
            activityModel,
            temperatureC
          )
        : {
            confidence: 0,
            modelValidity: 'OUT_OF_RANGE' as const,
            assumptions: [],
            warnings: [
              ...(!hasPHActiveSpecies ? ['PH_ACTIVE_SPECIES_UNAVAILABLE: No recognized acid/base/buffer contributor is present; neutral pH is not inferred.'] : []),
              ...(hasUnrecognizedIngredients ? ['PH_UNRECOGNIZED_INGREDIENTS_PRESENT: Unrecognized formulation mass may alter pH; the equilibrium result is withheld.'] : []),
              ...(hasAdequatePHChemistry && !solverRes.converged ? ['PH_SOLVER_NOT_CONVERGED: Confidence and equilibrium-dependent diagnostics are unavailable.'] : [])
            ]
          };

    const outputPH = isConverged && solvedPH !== null ? Number(solvedPH.toFixed(2)) : null;

    // 8. Result Packaging
    return {
      pH: outputPH,
      finalPH: outputPH,
      status: !hasAdequatePHChemistry ? 'INSUFFICIENT_DATA' : (isConverged ? solverRes.status : 'NON_CONVERGED'),
      method: solverRes.method,
      converged: isConverged,
      iterations: solverRes.iterations,
      residual: isConverged ? Number(solverRes.residual.toExponential(4)) : null,
      stepSize: Number(solverRes.stepSize.toFixed(6)),
      ionicStrength,
      activityModel,
      modelValidity: diag.modelValidity,
      temperatureC,
      assumptions: diag.assumptions,
      warnings: diag.warnings,
      confidence: diag.confidence,
      measuredPH: null, // Predicted pH is not laboratory measurement
      predictionError: null,
      excessAcidEquivalents,
      excessBaseEquivalents,
      excessStrongAcidEquivalents,
      excessStrongBaseEquivalents,
      // Legacy backward-compatible aliases
      excessStrongAcid,
      excessStrongBase,
      excessAcidMoles,
      excessBaseMoles,
      bufferCapacity,
      totalBufferCapacity: bufferCapacity,
      solverConverged: isConverged,
      solverIterations: solverRes.iterations,
      details: {
        totalAcidEquivalents,
        totalBaseEquivalents,
        totalStrongAcidEquivalents,
        totalStrongBaseEquivalents,
        netEquivalents,
        // Legacy backward-compatible aliases
        totalAcidMoles,
        totalBaseMoles,
        netMoles,
        recognizedContributors,
        modelType: `Rigorous Chemical Equilibrium (${solverRes.method})`,
        speciation: finalEquilibrium ? finalEquilibrium.speciation : [],
        ionicStrength,
        chargeResidual: isConverged ? solverRes.residual : null,
        normalizedComposition: {
          totalMassKg: composition.totalMassKg,
          totalVolumeL: Number(composition.totalVolumeL.toFixed(3)),
          totalWaterKg: Number(composition.totalWaterKg.toFixed(3)),
          recognizedMassFraction: Number(composition.recognizedMassFraction.toFixed(3)),
          productCategory: composition.productCategory,
          isPowder: composition.isPowder
        }
      }
    };
  }
}

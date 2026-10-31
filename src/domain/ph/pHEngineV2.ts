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

    // 1. Normalize composition
    const composition = normalizeFormulationComposition(ingredients, totalMassKg, options);
    (composition as any).activityModel = activityModel;

    // 2. Numerical equilibrium solver
    const solverRes = NumericalEquilibriumSolver.solve(composition, temperatureC, {
      tolerance: options.tolerance ?? 1e-7,
      maxIterations: options.maxIterations ?? 60,
      initialGuess: options.targetPH ?? null
    });

    const isConverged = solverRes.converged && Number.isFinite(solverRes.pH);
    const solvedPH = isConverged ? solverRes.pH : Number.NaN;
    const evalPH = isConverged ? solvedPH : null;

    // 3. Equilibrium charge balance & speciation at evaluation pH
    const finalEquilibrium = EquilibriumSystem.evaluateChargeBalance(
      evalPH,
      composition,
      temperatureC
    );

    // 4. Calculate ionic strength from all participating ions
    const ionicStrength = Number(ActivityModel.calculateIonicStrength(finalEquilibrium.ions).toFixed(4));

    // 5. Buffer capacity beta
    const bufferCapacity = isConverged
      ? EquilibriumSystem.calculateBufferCapacity(solvedPH, composition, temperatureC)
      : 0;

    // 6. Excess stoichiometric acid/base equivalents (theoretical titratable capacity in eq)
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
    const diag = ConfidenceEvaluator.evaluate(
      solverRes,
      composition,
      ionicStrength,
      activityModel,
      temperatureC
    );

    if (!isConverged) {
      diag.confidence = 0;
      diag.modelValidity = 'OUT_OF_RANGE';
      if (!diag.warnings.some(w => w.includes('unavailable') || w.includes('failed to converge'))) {
        diag.warnings.push('Numerical equilibrium solver failed to converge within maximum iterations; pH calculation is unavailable.');
      }
    }

    const outputPH = isConverged ? Number(solvedPH.toFixed(2)) : Number.NaN;

    // 8. Result Packaging
    return {
      pH: outputPH,
      finalPH: outputPH,
      status: isConverged ? solverRes.status : 'NON_CONVERGED',
      method: solverRes.method,
      converged: isConverged,
      iterations: solverRes.iterations,
      residual: Number(solverRes.residual.toExponential(4)),
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
        speciation: finalEquilibrium.speciation,
        ionicStrength,
        chargeResidual: solverRes.residual,
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

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
      initialGuess: options.targetPH ?? 7.0
    });

    const solvedPH = solverRes.pH;

    // 3. Equilibrium charge balance & speciation at solved pH
    const finalEquilibrium = EquilibriumSystem.evaluateChargeBalance(
      solvedPH,
      composition,
      temperatureC
    );

    // 4. Calculate ionic strength from all participating ions
    const ionicStrength = Number(ActivityModel.calculateIonicStrength(finalEquilibrium.ions).toFixed(4));

    // 5. Buffer capacity beta
    const bufferCapacity = EquilibriumSystem.calculateBufferCapacity(
      solvedPH,
      composition,
      temperatureC
    );

    // 6. Excess acid/base moles
    let totalAcidMoles = 0;
    let totalBaseMoles = 0;
    const recognizedContributors: string[] = [];

    for (const item of composition.ingredients) {
      if (item.resolvedSpecies && item.moles > 0) {
        recognizedContributors.push(item.resolvedSpecies.speciesId);
        const eq = item.resolvedSpecies.eqPerMole ?? 1;
        if (item.resolvedSpecies.pHEffect === 'acid') {
          totalAcidMoles += item.moles * eq;
        } else if (item.resolvedSpecies.pHEffect === 'base') {
          totalBaseMoles += item.moles * eq;
        }
      }
    }

    const excessStrongAcid = Number(Math.max(0, totalAcidMoles - totalBaseMoles).toFixed(4));
    const excessStrongBase = Number(Math.max(0, totalBaseMoles - totalAcidMoles).toFixed(4));
    const netMoles = Number((totalBaseMoles - totalAcidMoles).toFixed(4));

    // 7. Confidence & Diagnostics
    const diag = ConfidenceEvaluator.evaluate(
      solverRes,
      composition,
      ionicStrength,
      activityModel,
      temperatureC
    );

    // 8. Result Packaging
    return {
      pH: Number(solvedPH.toFixed(2)),
      finalPH: Number(solvedPH.toFixed(2)),
      status: solverRes.status,
      method: solverRes.method,
      converged: solverRes.converged,
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
      excessStrongAcid,
      excessStrongBase,
      bufferCapacity,
      totalBufferCapacity: bufferCapacity,
      solverConverged: solverRes.converged,
      solverIterations: solverRes.iterations,
      details: {
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

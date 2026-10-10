/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - CONFIDENCE & DIAGNOSTICS EVALUATOR
 * ============================================================================
 * Evidence-based confidence scoring, assumption tracking, and diagnostic warnings.
 * ============================================================================
 */

import { ActivityModel } from './activityModel';
import {
  ActivityModelType,
  ModelValidityLevel,
  NormalizedComposition,
  NumericalSolverResult
} from './types';

export class ConfidenceEvaluator {
  static evaluate(
    solverResult: NumericalSolverResult,
    composition: NormalizedComposition,
    ionicStrength: number,
    activityModel: ActivityModelType,
    temperatureC: number
  ): {
    confidence: number;
    modelValidity: ModelValidityLevel;
    assumptions: string[];
    warnings: string[];
  } {
    const assumptions: string[] = [];
    const warnings: string[] = [];

    // 1. Thermodynamic assumptions
    assumptions.push(`Calculated at ${temperatureC.toFixed(1)}°C aqueous standard state.`);
    if (composition.isPowder) {
      assumptions.push(
        `Powder product evaluated on standardized 1% aqueous slurry basis (${(composition.slurryDilutionFactor! * 100).toFixed(1)}% w/v = 10 g/L test liquor).`
      );
    } else {
      assumptions.push(`Aqueous batch volume calculated using apparent solution density ${composition.apparentDensity.toFixed(3)} kg/L.`);
    }

    // 2. Activity model validity
    const validity = ActivityModel.evaluateModelValidity(ionicStrength, activityModel);
    assumptions.push(...validity.notes);

    // 3. Confidence scoring (evidence-based)
    let score = 0;

    // A. Solver convergence (+40 max)
    if (solverResult.converged) {
      score += 40;
    } else {
      warnings.push('Numerical solver did not achieve strict convergence tolerance.');
    }

    // B. Chemical species recognized fraction (+30 max)
    const recPct = composition.recognizedMassFraction;
    score += Math.round(recPct * 30);
    if (composition.unrecognizedCount > 0) {
      warnings.push(
        `${composition.unrecognizedCount} formulation ingredient(s) could not be mapped to known acid/base chemical species (treated as neutral).`
      );
    }

    // C. Ionic strength validity regime (+20 max)
    if (validity.level === 'HIGH') {
      score += 20;
    } else if (validity.level === 'MODERATE') {
      score += 15;
    } else if (validity.level === 'LOW') {
      score += 8;
      warnings.push(`High ionic strength (I = ${ionicStrength.toFixed(3)} M). Extended Debye-Hückel predictive uncertainty is elevated.`);
    } else {
      score += 3;
      warnings.push(`Very high electrolyte concentration (I = ${ionicStrength.toFixed(3)} M). Outside standard dilute activity model range.`);
    }

    // D. Water basis adequacy (+10 max)
    if (composition.waterMassFraction > 0.40 || composition.isPowder) {
      score += 10;
    } else if (composition.waterMassFraction > 0.10) {
      score += 5;
      warnings.push('Low aqueous solvent fraction in formula. Non-aqueous solvent effects may influence real measured pH.');
    } else {
      warnings.push('Extremely low water content. Anhydrous/concentrated medium limits aqueous pH definition.');
    }

    // 4. Extreme pH warnings
    if (solverResult.pH < 1.0) {
      warnings.push('Strongly acidic formulation (pH < 1.0). High corrosive hazard.');
    } else if (solverResult.pH > 13.0) {
      warnings.push('Strongly alkaline formulation (pH > 13.0). High caustic hazard.');
    }

    if (validity.level === 'OUT_OF_RANGE') {
      warnings.push('Outside activity model applicability domain (I > 1.5 M): result is LOW_CONFIDENCE_SCREENING / OUT_OF_DOMAIN.');
    }

    // Never claim 95%, 98%, or 99% empirical accuracy without laboratory dataset validation.
    // Concentrated electrolyte regime (I > 1.5 M) drops confidence to <= 30%.
    let finalConfidence = Math.max(10, Math.min(88, score));
    if (validity.level === 'OUT_OF_RANGE') {
      finalConfidence = Math.min(30, finalConfidence);
    }

    return {
      confidence: finalConfidence,
      modelValidity: validity.level,
      assumptions,
      warnings
    };
  }
}

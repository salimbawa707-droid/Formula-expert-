/**
 * ============================================================================
 * REFORMULATION FEEDBACK ENGINE
 * ============================================================================
 * 
 * Inspired by Cheme-Nova/IntelliForm closed-loop feedback architecture.
 * Evaluates systematic deviations between predicted model outputs and measured
 * wet-lab analytical data (pH, Viscosity, Active Matter, CPI, Density, NVR).
 * 
 * IMMUTABLE SCIENTIFIC PRINCIPLES:
 * 1. ZERO AUTOMATIC CONSTANT MUTATION:
 *    Does NOT silently alter authoritative constants in PHEngineV2, ChelatorEngine,
 *    or ActiveMatterEngine.
 * 2. EMPIRICAL DISCIPLINE:
 *    Updates optimizer search tolerances, penalty weights, and generates governed
 *    calibration proposals requiring human chemist confirmation.
 * ============================================================================
 */

import { ProductCategoryId } from '../../domain/productTaxonomy';

export interface MeasuredLabObservation {
  parameterKey: 'ph' | 'viscosity' | 'activeMatter' | 'cpi' | 'density' | 'liquidNvr';
  parameterName: string;
  predictedValue: number;
  measuredValue: number;
  unit: string;
  testMethod?: string;
  isLabValidated: boolean;
}

export interface ParameterDeltaAnalysis {
  parameterKey: string;
  parameterName: string;
  predictedValue: number;
  measuredValue: number;
  unit: string;
  absoluteError: number;
  relativePercentageError: number;
  biasDirection: 'POSITIVE_PREDICTION_BIAS' | 'NEGATIVE_PREDICTION_BIAS' | 'NEUTRAL';
  acceptableTolerance: number;
  isWithinTolerance: boolean;
  scientificExplanation: string;
  optimizerAction: string;
}

export interface ReformulationFeedbackReport {
  formulaId: string;
  formulaVersion: string;
  categoryId: ProductCategoryId;
  evaluationTimestamp: string;
  hasSufficientLabEvidence: boolean;
  deltaAnalyses: ParameterDeltaAnalysis[];
  systemicFindings: string[];
  suggestedOptimizerWeights: {
    recommendedPenaltyMultiplier: number;
    narrowSearchBounds: string[];
    relaxSearchBounds: string[];
  };
  governanceProposal?: {
    proposalId: string;
    description: string;
    requiresHumanReview: boolean;
  };
}

const PARAMETER_ACCEPTABLE_TOLERANCES: Record<string, number> = {
  ph: 0.3,               // ±0.3 pH units
  viscosity: 15.0,       // ±15% relative
  activeMatter: 1.0,     // ±1.0% active
  cpi: 5.0,              // ±5 CPI points
  density: 0.02,         // ±0.02 g/cm³
  liquidNvr: 2.0,        // ±2.0% solids
};

/**
 * Compares predicted vs measured wet-lab values and generates reformulation feedback.
 */
export function analyzeReformulationFeedback(
  formulaId: string,
  formulaVersion: string,
  categoryId: ProductCategoryId,
  observations: MeasuredLabObservation[]
): ReformulationFeedbackReport {
  const deltaAnalyses: ParameterDeltaAnalysis[] = [];
  const systemicFindings: string[] = [];
  const narrowSearchBounds: string[] = [];
  const relaxSearchBounds: string[] = [];

  let totalRelativeError = 0;
  let validatedObservationCount = 0;

  for (const obs of observations) {
    if (!obs.isLabValidated) {
      continue;
    }

    validatedObservationCount++;
    const absError = Math.abs(obs.measuredValue - obs.predictedValue);
    const relError = obs.predictedValue !== 0 ? (absError / Math.abs(obs.predictedValue)) * 100 : 0;
    totalRelativeError += relError;

    let bias: ParameterDeltaAnalysis['biasDirection'] = 'NEUTRAL';
    if (obs.predictedValue - obs.measuredValue > 0.05) {
      bias = 'POSITIVE_PREDICTION_BIAS';
    } else if (obs.measuredValue - obs.predictedValue > 0.05) {
      bias = 'NEGATIVE_PREDICTION_BIAS';
    }

    const tolerance = PARAMETER_ACCEPTABLE_TOLERANCES[obs.parameterKey] ?? 10.0;
    const isWithin = obs.parameterKey === 'ph' || obs.parameterKey === 'density'
      ? absError <= tolerance
      : relError <= tolerance;

    let explanation = 'Predicted value aligns closely with measured wet-lab observation.';
    let action = 'Maintain current optimizer constraint boundaries.';

    if (!isWithin) {
      if (obs.parameterKey === 'ph') {
        explanation = `Measured pH (${obs.measuredValue.toFixed(2)}) deviates from predicted pH (${obs.predictedValue.toFixed(2)}) by ${absError.toFixed(2)} units. Indicates strong builder buffering or unmodeled neutralization kinetics.`;
        action = 'Increase pH constraint penalty weight and narrow target band during reformulation candidate search.';
        narrowSearchBounds.push('ph');
        systemicFindings.push(`pH prediction variance (${absError.toFixed(2)}) exceeds ±0.3 tolerance.`);
      } else if (obs.parameterKey === 'viscosity') {
        explanation = `Measured viscosity (${obs.measuredValue} cP) differs from predicted (${obs.predictedValue} cP) by ${relError.toFixed(1)}%. Indicates non-linear electrolyte surfactant micellar growth.`;
        action = 'Apply empirical rheological offset factor to optimizer search candidates.';
        relaxSearchBounds.push('viscosity');
        systemicFindings.push(`Viscosity variance (${relError.toFixed(1)}%) requires electrolyte curve tuning.`);
      } else if (obs.parameterKey === 'activeMatter') {
        explanation = `Measured active matter (${obs.measuredValue.toFixed(1)}%) differs from nominal specification (${obs.predictedValue.toFixed(1)}%). Raw material active assay variance likely.`;
        action = 'Prompt formulator to audit raw material Certificates of Analysis (COA).';
        systemicFindings.push(`Active matter discrepancy detected (${absError.toFixed(1)}%).`);
      }
    }

    deltaAnalyses.push({
      parameterKey: obs.parameterKey,
      parameterName: obs.parameterName,
      predictedValue: Number(obs.predictedValue.toFixed(2)),
      measuredValue: Number(obs.measuredValue.toFixed(2)),
      unit: obs.unit,
      absoluteError: Number(absError.toFixed(3)),
      relativePercentageError: Number(relError.toFixed(1)),
      biasDirection: bias,
      acceptableTolerance: tolerance,
      isWithinTolerance: isWithin,
      scientificExplanation: explanation,
      optimizerAction: action,
    });
  }

  const hasSufficient = validatedObservationCount >= 2;
  const avgError = validatedObservationCount > 0 ? totalRelativeError / validatedObservationCount : 0;
  const recommendedMultiplier = avgError > 20.0 ? 1.5 : avgError > 10.0 ? 1.25 : 1.0;

  return {
    formulaId,
    formulaVersion,
    categoryId,
    evaluationTimestamp: new Date().toISOString(),
    hasSufficientLabEvidence: hasSufficient,
    deltaAnalyses,
    systemicFindings,
    suggestedOptimizerWeights: {
      recommendedPenaltyMultiplier: recommendedMultiplier,
      narrowSearchBounds,
      relaxSearchBounds,
    },
    governanceProposal: systemicFindings.length > 0 ? {
      proposalId: `PROP-REFORM-${formulaId}`,
      description: `Calibration proposal generated from ${validatedObservationCount} verified wet-lab observations.`,
      requiresHumanReview: true,
    } : undefined,
  };
}

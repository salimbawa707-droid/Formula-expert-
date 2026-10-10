/**
 * Feedback Decision Engine
 * 
 * Classifies evaluation results into actionable scientific states:
 * NO_CHANGE_REQUIRED, MONITOR, REVIEW_FORMULA, REPEAT_EXPERIMENT,
 * REQUIRES_MORE_DATA, REFORMULATION_CANDIDATE.
 * 
 * NEVER uses subjective quality rankings like "BEST", "WORST", or "PERFECT".
 */

import {
  FeedbackActionCategory,
  SpecificationEvaluationResult,
  PredictionVsMeasurementComparison,
} from './types';

export interface EvaluateFeedbackDecisionInput {
  evaluations: SpecificationEvaluationResult[];
  comparisons?: PredictionVsMeasurementComparison[];
  replicateCount?: number;
}

export interface FeedbackDecisionOutput {
  actionCategory: FeedbackActionCategory;
  rationale: string;
  recommendedNextStep: string;
  hasOutofSpec: boolean;
  hasPredictionDeviations: boolean;
  hasInsufficientData: boolean;
}

export function determineFeedbackDecision(
  input: EvaluateFeedbackDecisionInput
): FeedbackDecisionOutput {
  const { evaluations, comparisons = [], replicateCount = 1 } = input;

  const hasOutofSpec = evaluations.some(e => e.state === 'OUTSIDE_SPECIFICATION');
  const hasPredictionDeviations = evaluations.some(e => e.state === 'PREDICTION_DEVIATION') || comparisons.some(c => !c.isWithinPredictionTolerance);
  const hasInsufficientData = evaluations.some(e => e.state === 'INSUFFICIENT_DATA');

  // Rule 1: Out of spec parameter supported by lab measurement requires reformulation candidate
  if (hasOutofSpec) {
    return {
      actionCategory: 'REFORMULATION_CANDIDATE',
      rationale: 'One or more empirical measurements fall outside specification bounds. Formulation adjustment required.',
      recommendedNextStep: 'Generate candidate reformulation in IntelliForm optimizer with feedback adjustments.',
      hasOutofSpec: true,
      hasPredictionDeviations,
      hasInsufficientData,
    };
  }

  // Rule 2: Replicate count insufficient for high variance parameter
  if (replicateCount < 2 && hasPredictionDeviations) {
    return {
      actionCategory: 'REPEAT_EXPERIMENT',
      rationale: 'Prediction deviation observed with only a single replicate measurement. Repeat experiment with triplicates before adjusting formula.',
      recommendedNextStep: 'Schedule replicate lab dispense run in Opentrons protocol studio.',
      hasOutofSpec: false,
      hasPredictionDeviations: true,
      hasInsufficientData,
    };
  }

  // Rule 3: Within spec but prediction differs significantly
  if (hasPredictionDeviations) {
    return {
      actionCategory: 'REVIEW_FORMULA',
      rationale: 'Measured values pass specification limits, but differ from theoretical predictions beyond expected model interval.',
      recommendedNextStep: 'Review raw material purity, pH buffer capacity, or active matter assay assumptions.',
      hasOutofSpec: false,
      hasPredictionDeviations: true,
      hasInsufficientData,
    };
  }

  // Rule 4: Insufficient data or missing parameters
  if (hasInsufficientData) {
    return {
      actionCategory: 'REQUIRES_MORE_DATA',
      rationale: 'Required specification parameters unmeasured or incomplete.',
      recommendedNextStep: 'Perform remaining analytical lab tests before completing cycle.',
      hasOutofSpec: false,
      hasPredictionDeviations: false,
      hasInsufficientData: true,
    };
  }

  // Rule 5: All within spec and prediction matches
  return {
    actionCategory: 'NO_CHANGE_REQUIRED',
    rationale: 'All measured parameters conform to specifications and align with theoretical predictions.',
    recommendedNextStep: 'Maintain active formula version and proceed to scale-up review.',
    hasOutofSpec: false,
    hasPredictionDeviations: false,
    hasInsufficientData: false,
  };
}

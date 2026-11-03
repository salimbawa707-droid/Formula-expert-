/**
 * Scientific Deviation Engine
 * 
 * Classifies empirical lab results and prediction differences into explicit states:
 * WITHIN_SPECIFICATION, OUTSIDE_SPECIFICATION, PREDICTION_DEVIATION,
 * MEASUREMENT_VARIABILITY, INSUFFICIENT_DATA, NOT_APPLICABLE, REQUIRES_REVIEW.
 * 
 * Respects Product Category and Physical Form routing (e.g. powder vs liquid).
 */

import {
  ObservedMeasurement,
  PredictedMeasurement,
  ScientificDeviationState,
  SpecificationEvaluationResult,
} from './types';
import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';
import { isPowderCategory } from '../formulationEngineRouter';

export interface EvaluateDeviationInput {
  category: ProductCategoryId;
  physicalForm: PhysicalForm;
  observed: ObservedMeasurement;
  predicted?: PredictedMeasurement;
  specification?: {
    target?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Evaluates whether a parameter is applicable for a given product category and physical form
 */
export function isParameterApplicable(
  parameterKey: string,
  category: ProductCategoryId,
  physicalForm: PhysicalForm
): boolean {
  const isPowder = isPowderCategory(category) || physicalForm === 'POWDER';

  if (isPowder) {
    // Powder parameters
    if (parameterKey === 'viscosity' || parameterKey === 'liquid_nvr') {
      return false; // Not applicable for powder
    }
  } else {
    // Liquid parameters
    if (parameterKey === 'bulk_density_tapped' || parameterKey === 'flowability_carr') {
      return false; // Not applicable for liquids
    }
  }

  return true;
}

/**
 * Classifies scientific deviation for a measurement
 */
export function classifyScientificDeviation(
  input: EvaluateDeviationInput
): SpecificationEvaluationResult {
  const { category, physicalForm, observed, predicted, specification } = input;

  // 1. Check Category Applicability
  if (!isParameterApplicable(observed.parameterKey, category, physicalForm)) {
    return {
      parameterKey: observed.parameterKey,
      parameterName: observed.parameterName,
      measuredValue: observed.value,
      unit: observed.unit,
      isPass: true,
      state: 'NOT_APPLICABLE',
      method: observed.method,
      evidenceLevel: observed.evidenceLevel,
      evaluatorNotes: `Parameter '${observed.parameterKey}' is NOT_APPLICABLE for product category '${category}' (${physicalForm}).`,
    };
  }

  // 2. Check Specification Bounds
  if (!specification || (specification.min === undefined && specification.max === undefined && specification.target === undefined)) {
    return {
      parameterKey: observed.parameterKey,
      parameterName: observed.parameterName,
      measuredValue: observed.value,
      unit: observed.unit,
      isPass: true,
      state: 'INSUFFICIENT_DATA',
      method: observed.method,
      evidenceLevel: observed.evidenceLevel,
      evaluatorNotes: `No specification limits defined for parameter '${observed.parameterKey}'. Marked as INSUFFICIENT_DATA.`,
    };
  }

  const { min, max, target } = specification;
  let isWithinLimits = true;

  if (min !== undefined && observed.value < min) isWithinLimits = false;
  if (max !== undefined && observed.value > max) isWithinLimits = false;

  let state: ScientificDeviationState = isWithinLimits ? 'WITHIN_SPECIFICATION' : 'OUTSIDE_SPECIFICATION';

  // Check if prediction differs significantly even if within spec limits
  if (isWithinLimits && predicted) {
    const absDiff = Math.abs(predicted.value - observed.value);
    const isPh = observed.parameterKey === 'ph';
    const isSignificantDev = isPh ? absDiff > 0.35 : (absDiff / Math.max(0.1, Math.abs(predicted.value))) > 0.10;

    if (isSignificantDev) {
      state = 'PREDICTION_DEVIATION';
    }
  }

  let notes = `Measured ${observed.value} ${observed.unit}. Spec limits: [${min ?? '-∞'} .. ${max ?? '+∞'}]. State: ${state}.`;

  return {
    parameterKey: observed.parameterKey,
    parameterName: observed.parameterName,
    measuredValue: observed.value,
    unit: observed.unit,
    targetValue: target,
    lowerLimit: min,
    upperLimit: max,
    isPass: isWithinLimits,
    state,
    method: observed.method,
    evidenceLevel: observed.evidenceLevel,
    evaluatorNotes: notes,
  };
}

/**
 * Measurement Evaluation Engine
 * 
 * Interfaces with SpecificationEngine and ScientificQualityGateEngine to evaluate
 * observed measurements without inventing specification bounds.
 */

import {
  ObservedMeasurement,
  PredictedMeasurement,
  SpecificationEvaluationResult,
} from './types';
import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';
import { classifyScientificDeviation } from './scientificDeviationEngine';

export interface EvaluateMeasurementsBatchInput {
  category: ProductCategoryId;
  physicalForm: PhysicalForm;
  observedMeasurements: ObservedMeasurement[];
  predictedMeasurements?: PredictedMeasurement[];
  specifications?: Record<string, { min?: number; max?: number; target?: number }>;
}

export interface EvaluationBatchSummary {
  evaluations: SpecificationEvaluationResult[];
  passCount: number;
  failCount: number;
  notApplicableCount: number;
  insufficientDataCount: number;
  overallPass: boolean;
}

export function evaluateMeasurementsBatch(
  input: EvaluateMeasurementsBatchInput
): EvaluationBatchSummary {
  const { category, physicalForm, observedMeasurements, predictedMeasurements = [], specifications = {} } = input;
  const evaluations: SpecificationEvaluationResult[] = [];

  let passCount = 0;
  let failCount = 0;
  let notApplicableCount = 0;
  let insufficientDataCount = 0;

  for (const obs of observedMeasurements) {
    const pred = predictedMeasurements.find(p => p.parameterKey === obs.parameterKey);
    const spec = specifications[obs.parameterKey];

    const evalRes = classifyScientificDeviation({
      category,
      physicalForm,
      observed: obs,
      predicted: pred,
      specification: spec,
    });

    evaluations.push(evalRes);

    if (evalRes.state === 'NOT_APPLICABLE') {
      notApplicableCount++;
    } else if (evalRes.state === 'INSUFFICIENT_DATA') {
      insufficientDataCount++;
    } else if (evalRes.isPass) {
      passCount++;
    } else {
      failCount++;
    }
  }

  return {
    evaluations,
    passCount,
    failCount,
    notApplicableCount,
    insufficientDataCount,
    overallPass: failCount === 0,
  };
}

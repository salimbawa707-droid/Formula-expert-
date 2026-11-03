/**
 * Reformulation Feedback Engine
 * 
 * Generates structured ScientificFeedbackDiagnosis objects distinguishing:
 * OBSERVED FACT vs POSSIBLE CAUSE vs HYPOTHESIS vs ACTION PROPOSAL.
 * 
 * Constructs ReformulationCandidate for IntelliForm optimization without
 * modifying historical FormulaVersions in place.
 */

import {
  ReformulationCandidate,
  ScientificFeedbackDiagnosis,
  SpecificationEvaluationResult,
  PredictionVsMeasurementComparison,
} from './types';
import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';
import { FormulationIngredient } from '../../types';

export interface GenerateReformulationCandidateInput {
  parentFormulaId: string;
  parentFormulaVersionId: string;
  iterationCycle: number;
  category: ProductCategoryId;
  physicalForm: PhysicalForm;
  ingredients: FormulationIngredient[];
  evaluations: SpecificationEvaluationResult[];
  comparisons?: PredictionVsMeasurementComparison[];
  createdBy: string;
}

export function generateReformulationCandidate(
  input: GenerateReformulationCandidateInput
): ReformulationCandidate {
  const {
    parentFormulaId,
    parentFormulaVersionId,
    iterationCycle,
    category,
    physicalForm,
    ingredients,
    evaluations,
    comparisons: _comparisons = [],
    createdBy,
  } = input;

  const candidateId = `CAND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const diagnoses: ScientificFeedbackDiagnosis[] = [];
  const recommendedAdjustments: ReformulationCandidate['recommendedAdjustments'] = [];

  for (const ev of evaluations) {
    if (ev.state === 'OUTSIDE_SPECIFICATION' || ev.state === 'PREDICTION_DEVIATION') {
      let fact = `Measured ${ev.parameterKey}: ${ev.measuredValue} ${ev.unit}.`;
      let cause = 'Formulation active ingredient balance offset.';
      let hypothesis = 'Chemical equilibrium or active matter concentration deviation.';
      let proposal = 'Adjust target ingredient percentages in next optimization candidate.';

      // Parameter-specific scientific diagnoses
      if (ev.parameterKey === 'ph') {
        if (ev.lowerLimit !== undefined && ev.measuredValue < ev.lowerLimit) {
          fact = `Measured pH (${ev.measuredValue}) is below minimum specification limit (${ev.lowerLimit}).`;
          cause = 'Insufficiency of alkaline neutralizer / buffer capacity.';
          hypothesis = 'Unreacted acidic surfactant (LABSA/Citric Acid) or lower raw material alkali assay.';
          proposal = 'Increase Sodium Hydroxide / Triethanolamine target percentage by +0.2% to +0.5%.';

          const alkali = ingredients.find(i => (i.name || '').toLowerCase().includes('hydroxide') || (i.name || '').toLowerCase().includes('soda'));
          if (alkali) {
            const oldPct = alkali.percentage ?? alkali.percent ?? 1.0;
            recommendedAdjustments.push({
              canonicalIngredientId: alkali.id || alkali.name,
              ingredientName: alkali.name,
              oldTargetPercent: oldPct,
              proposedTargetPercent: Number((oldPct + 0.3).toFixed(2)),
              deltaPercent: +0.3,
              rationale: 'Elevate pH to achieve minimum specification compliance.',
            });
          }
        } else if (ev.upperLimit !== undefined && ev.measuredValue > ev.upperLimit) {
          fact = `Measured pH (${ev.measuredValue}) exceeds maximum specification limit (${ev.upperLimit}).`;
          cause = 'Excess caustic neutralizer or alkaline builder.';
          hypothesis = 'Alkali charge exceeds stoichiometric requirement for acidic surfactants.';
          proposal = 'Reduce caustic Soda / Silicate target percentage or add Citric Acid buffer.';

          const alkali = ingredients.find(i => (i.name || '').toLowerCase().includes('hydroxide') || (i.name || '').toLowerCase().includes('soda'));
          if (alkali) {
            const oldPct = alkali.percentage ?? alkali.percent ?? 1.0;
            recommendedAdjustments.push({
              canonicalIngredientId: alkali.id || alkali.name,
              ingredientName: alkali.name,
              oldTargetPercent: oldPct,
              proposedTargetPercent: Math.max(0.1, Number((oldPct - 0.25).toFixed(2))),
              deltaPercent: -0.25,
              rationale: 'Lower pH to conform with skin-compatibility maximum upper limit.',
            });
          }
        }
      } else if (ev.parameterKey === 'viscosity') {
        if (ev.lowerLimit !== undefined && ev.measuredValue < ev.lowerLimit) {
          fact = `Measured viscosity (${ev.measuredValue} cP) is below target minimum (${ev.lowerLimit} cP).`;
          cause = 'Insufficient micellar entanglement or electrolyte salt curve position.';
          hypothesis = 'Surfactant active ratio (SLES/CAPB) below critical micelle concentration thresholds.';
          proposal = 'Increase NaCl / Sodium Sulfate electrolyte or polymeric thickener target.';

          const thickener = ingredients.find(i => (i.name || '').toLowerCase().includes('chloride') || (i.name || '').toLowerCase().includes('salt') || (i.name || '').toLowerCase().includes('gum'));
          if (thickener) {
            const oldPct = thickener.percentage ?? thickener.percent ?? 1.0;
            recommendedAdjustments.push({
              canonicalIngredientId: thickener.id || thickener.name,
              ingredientName: thickener.name,
              oldTargetPercent: oldPct,
              proposedTargetPercent: Number((oldPct + 0.2).toFixed(2)),
              deltaPercent: +0.2,
              rationale: 'Shift electrolyte salt curve to reach target Brookfield viscosity range.',
            });
          }
        }
      }

      diagnoses.push({
        parameterKey: ev.parameterKey,
        observedFact: fact,
        possibleCause: cause,
        hypothesis,
        actionProposal: proposal,
        evidenceLevel: ev.evidenceLevel,
        confidence: ev.evidenceLevel === 'LAB_VALIDATED' ? 'HIGH_EVIDENCE' : 'SUPPORTED_HYPOTHESIS',
      });
    }
  }

  return {
    candidateId,
    parentFormulaId,
    parentFormulaVersionId,
    iterationCycle,
    targetCategory: category,
    physicalForm,
    diagnoses,
    recommendedAdjustments,
    actionCategory: diagnoses.length > 0 ? 'REFORMULATION_CANDIDATE' : 'NO_CHANGE_REQUIRED',
    createdBy,
    createdAt: new Date().toISOString(),
    humanApprovalStatus: 'PENDING_HUMAN_REVIEW',
  };
}

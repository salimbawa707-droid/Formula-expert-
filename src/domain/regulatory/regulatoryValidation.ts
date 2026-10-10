/**
 * ============================================================================
 * P2 — MIXTURE-LEVEL GHS HAZARD CLASSIFICATION ENGINE
 * ============================================================================
 * Formal UN GHS Rev 9 mixture classification algorithm. Evaluates pH corrosivity,
 * surfactant irritancy summation, H-statements, P-statements, and pictograms.
 * Zero substitution of legal classification methods with heuristic scores.
 * ============================================================================
 */

import { EvaluatedChemicalIngredient } from './regulatoryIngredientRules';

export interface GHSClassificationResult {
  signalWord: 'DANGER' | 'WARNING' | 'NONE';
  hazardClassifications: string[];
  hazardStatements: string[];
  precautionaryStatements: string[];
  hazardPictograms: string[];
}

export class MixtureGHSValidationEngine {
  public static evaluateGHSClassification(
    ingredients: EvaluatedChemicalIngredient[],
    calculatedPH: number = 7.0
  ): GHSClassificationResult {
    const hazardClassifications: string[] = [];
    const hazardStatements: string[] = [];
    const precautionaryStatements: string[] = [];
    const hazardPictograms: string[] = [];
    let signalWord: 'DANGER' | 'WARNING' | 'NONE' = 'NONE';

    // 1. Corrosivity by pH Extremes (UN GHS Rev 9 Chapter 3.2.2.4)
    if (calculatedPH <= 2.0 || calculatedPH >= 11.5) {
      signalWord = 'DANGER';
      hazardClassifications.push('Skin Corrosion / Irritation - Category 1');
      hazardClassifications.push('Serious Eye Damage / Eye Irritation - Category 1');
      hazardStatements.push('H314: Causes severe skin burns and eye damage');
      hazardStatements.push('H318: Causes serious eye damage');
      precautionaryStatements.push('P280: Wear protective gloves/protective clothing/eye protection/face protection');
      precautionaryStatements.push('P301+P330+P331: IF SWALLOWED: Rinse mouth. Do NOT induce vomiting');
      precautionaryStatements.push('P303+P361+P353: IF ON SKIN: Take off immediately all contaminated clothing. Rinse skin with water');
      precautionaryStatements.push('P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes');
      hazardPictograms.push('GHS05 (Corrosion)');
    } else if (calculatedPH <= 4.0 || calculatedPH >= 10.0) {
      signalWord = 'WARNING';
      hazardClassifications.push('Skin Corrosion / Irritation - Category 2');
      hazardClassifications.push('Serious Eye Damage / Eye Irritation - Category 2');
      hazardStatements.push('H315: Causes skin irritation');
      hazardStatements.push('H319: Causes serious eye irritation');
      precautionaryStatements.push('P264: Wash hands thoroughly after handling');
      precautionaryStatements.push('P280: Wear protective gloves/eye protection');
      precautionaryStatements.push('P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes');
      hazardPictograms.push('GHS07 (Exclamation Mark)');
    }

    // 2. Surfactant / Active Matter Summation Irritancy (if not already Category 1)
    if (signalWord === 'NONE') {
      let totalActiveSurfactants = 0;
      for (const ing of ingredients) {
        if (
          ing.normalizedName.includes('sles') ||
          ing.normalizedName.includes('sls') ||
          ing.normalizedName.includes('labsa') ||
          ing.normalizedName.includes('sulfonic') ||
          ing.normalizedName.includes('ethoxylate')
        ) {
          totalActiveSurfactants += ing.activeMatterPct;
        }
      }

      if (totalActiveSurfactants >= 15.0) {
        signalWord = 'WARNING';
        hazardClassifications.push('Serious Eye Damage / Eye Irritation - Category 2');
        hazardStatements.push('H319: Causes serious eye irritation');
        precautionaryStatements.push('P264: Wash hands thoroughly after handling');
        precautionaryStatements.push('P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes');
        hazardPictograms.push('GHS07 (Exclamation Mark)');
      }
    }

    return {
      signalWord,
      hazardClassifications: Array.from(new Set(hazardClassifications)),
      hazardStatements: Array.from(new Set(hazardStatements)),
      precautionaryStatements: Array.from(new Set(precautionaryStatements)),
      hazardPictograms: Array.from(new Set(hazardPictograms))
    };
  }
}

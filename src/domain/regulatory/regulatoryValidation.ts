import { EvaluatedChemicalIngredient } from './regulatoryIngredientRules';

export interface GHSClassificationResult {
  signalWord: 'DANGER' | 'WARNING' | 'NONE';
  hazardClassifications: string[];
  hazardStatements: string[];
  precautionaryStatements: string[];
  hazardPictograms: string[];
  missingDataPoints: string[];
}

export class MixtureGHSValidationEngine {
  public static evaluateGHSClassification(ingredients: EvaluatedChemicalIngredient[], calculatedPH?: number): GHSClassificationResult {
    const hazardClassifications: string[] = [];
    const hazardStatements: string[] = [];
    const precautionaryStatements: string[] = [];
    const hazardPictograms: string[] = [];
    const missingDataPoints: string[] = [];
    let signalWord: 'DANGER' | 'WARNING' | 'NONE' = 'NONE';

    if (calculatedPH !== undefined && Number.isFinite(calculatedPH) && calculatedPH >= 0 && calculatedPH <= 14) {
      if (calculatedPH <= 2 || calculatedPH >= 11.5) {
        signalWord = 'DANGER';
        hazardClassifications.push('Skin Corrosion / Irritation - Category 1', 'Serious Eye Damage / Eye Irritation - Category 1');
        hazardStatements.push('H314: Causes severe skin burns and eye damage', 'H318: Causes serious eye damage');
        precautionaryStatements.push('P280: Wear protective gloves/protective clothing/eye protection/face protection', 'P301+P330+P331: IF SWALLOWED: Rinse mouth. Do NOT induce vomiting', 'P303+P361+P353: IF ON SKIN: Take off immediately all contaminated clothing. Rinse skin with water', 'P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes');
        hazardPictograms.push('GHS05 (Corrosion)');
      } else if (calculatedPH <= 4 || calculatedPH >= 10) {
        signalWord = 'WARNING';
        hazardClassifications.push('Skin Corrosion / Irritation - Category 2', 'Serious Eye Damage / Eye Irritation - Category 2');
        hazardStatements.push('H315: Causes skin irritation', 'H319: Causes serious eye irritation');
        precautionaryStatements.push('P264: Wash hands thoroughly after handling', 'P280: Wear protective gloves/eye protection', 'P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes');
        hazardPictograms.push('GHS07 (Exclamation Mark)');
      }
    } else {
      missingDataPoints.push('Measured or validated formulation pH is missing; pH-based hazard screening is unavailable.');
    }

    if (signalWord === 'NONE') {
      const surfactants = ingredients.filter(ing => ['sles', 'sls', 'labsa', 'sulfonic', 'ethoxylate'].some(term => ing.normalizedName.includes(term)));
      const missing = surfactants.filter(ing => ing.activeMatterPct === undefined);
      if (missing.length) {
        missingDataPoints.push(...missing.map(ing => `Active-matter assay required for surfactant '${ing.rawName}' before surfactant contribution screening.`));
      } else {
        const activeTotal = surfactants.reduce((sum, ing) => sum + (ing.activeMatterPct as number), 0);
        if (activeTotal >= 15) {
          signalWord = 'WARNING';
          hazardClassifications.push('Serious Eye Damage / Eye Irritation - Category 2');
          hazardStatements.push('H319: Causes serious eye irritation');
          precautionaryStatements.push('P264: Wash hands thoroughly after handling', 'P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes');
          hazardPictograms.push('GHS07 (Exclamation Mark)');
        }
      }
    }
    return {
      signalWord,
      hazardClassifications: Array.from(new Set(hazardClassifications)),
      hazardStatements: Array.from(new Set(hazardStatements)),
      precautionaryStatements: Array.from(new Set(precautionaryStatements)),
      hazardPictograms: Array.from(new Set(hazardPictograms)),
      missingDataPoints: Array.from(new Set(missingDataPoints))
    };
  }
}
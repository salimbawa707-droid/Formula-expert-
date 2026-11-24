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
  /**
   * This engine currently performs input-completeness and pH screening only.
   * It does not have the ingredient hazard classifications, concentration
   * limits, bridging rules or acid/alkali reserve data needed for a legal
   * mixture classification. It therefore never invents a signal word.
   */
  public static evaluateGHSClassification(ingredients: EvaluatedChemicalIngredient[], calculatedPH?: number): GHSClassificationResult {
    const missingDataPoints: string[] = [];
    const surfactants = ingredients.filter(ing =>
      ['sles', 'sls', 'labsa', 'sulfonic', 'ethoxylate'].some(term => ing.normalizedName.includes(term))
    );

    if (calculatedPH === undefined || !Number.isFinite(calculatedPH) || calculatedPH < 0 || calculatedPH > 14) {
      missingDataPoints.push('Measured or validated formulation pH is missing or outside the valid 0–14 range; pH screening is unavailable.');
    } else if (calculatedPH <= 2 || calculatedPH >= 11.5) {
      missingDataPoints.push(`Measured pH ${calculatedPH} is an extreme-pH screening trigger only. It does not by itself establish a GHS corrosion category; obtain acid/alkali reserve data and complete mixture classification evidence.`);
    } else if (calculatedPH <= 4 || calculatedPH >= 10) {
      missingDataPoints.push(`Measured pH ${calculatedPH} indicates a potential irritation screening concern, but does not by itself establish a GHS category or signal word.`);
    }

    const missingSurfactantAssays = surfactants.filter(ing => ing.activeMatterPct === undefined);
    if (missingSurfactantAssays.length) {
      missingDataPoints.push(...missingSurfactantAssays.map(ing =>
        `Active-matter assay is missing for surfactant '${ing.rawName}'; supplier COA is required for composition screening.`
      ));
    }
    if (surfactants.some(ing => ing.activeMatterPct !== undefined)) {
      missingDataPoints.push('Surfactant active-matter percentage is not a GHS hazard classification threshold; obtain supplier hazard classifications and apply mixture concentration limits/bridging principles.');
    }

    missingDataPoints.push('Complete GHS mixture classification is unavailable: ingredient-specific hazard categories, concentration limits and validated mixture evidence were not supplied. No signal word or pictogram is inferred.');

    return {
      signalWord: 'NONE',
      hazardClassifications: [],
      hazardStatements: [],
      precautionaryStatements: [],
      hazardPictograms: [],
      missingDataPoints: Array.from(new Set(missingDataPoints))
    };
  }
}

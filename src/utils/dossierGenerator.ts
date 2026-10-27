
import { FormulationIngredient } from '../types';
import { MasterScientificQualityGateReport } from './scientificQualityGateEngine';

/**
 * Technical Dossier Report Structure
 */
export interface TechnicalDossier {
  formulaName: string;
  version: string;
  category: string;
  ingredients: FormulationIngredient[];
  predictedMetrics: {
    pH: number;
    density: number;
    totalSurfactantActivePct: number;
    estimatedViscosityCp: number;
    cpi: number;
  };
  safetyWarnings: string[];
  calibrationStatus: string;
  labRequestInstructions: string[];
  generatedAt: string;
}

/**
 * DossierGenerator
 * 
 * Transforms a formula and its scientific quality gate evaluation
 * into a structured Technical Dossier ready for laboratory submission.
 */
export class DossierGenerator {
  public static generate(
    evaluation: MasterScientificQualityGateReport,
    formulaName: string,
    ingredients: FormulationIngredient[]
  ): TechnicalDossier {
    
    return {
      formulaName: formulaName,
      version: evaluation.formulaVersion,
      category: evaluation.productCategoryLabel,
      ingredients: ingredients,
      predictedMetrics: {
        pH: evaluation.speciationResult.pH,
        density: evaluation.specificationResult?.results.find(r => r.parameterKey === 'density')?.currentValue || 1.0,
        totalSurfactantActivePct: evaluation.activeMatterResult.totalSurfactantActivePct,
        estimatedViscosityCp: evaluation.viscosityResult.predictedViscosityCp,
        cpi: evaluation.performanceResult.cpi
      },
      safetyWarnings: evaluation.majorWarnings.map(w => w.message),
      calibrationStatus: evaluation.validationState,
      labRequestInstructions: evaluation.requiredLabTests,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a printable HTML version of the dossier.
   */
  public static generateHtml(dossier: TechnicalDossier): string {
    return `
      <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; border: 1px solid #ccc;">
        <h1>Technical Laboratory Submission Dossier</h1>
        <p><strong>Formula:</strong> ${dossier.formulaName} (v${dossier.version})</p>
        <p><strong>Category:</strong> ${dossier.category}</p>
        <hr/>
        <h2>1. Ingredient Composition</h2>
        <ul>
          ${dossier.ingredients.map(ing => `<li>${ing.name}: ${ing.percentage}% (Active: ${ing.activeMatterPct || 0}%)</li>`).join('')}
        </ul>
        <hr/>
        <h2>2. Predicted Key Metrics</h2>
        <ul>
          <li>pH: ${dossier.predictedMetrics.pH.toFixed(2)}</li>
          <li>Active Matter: ${dossier.predictedMetrics.totalSurfactantActivePct.toFixed(2)}%</li>
          <li>Viscosity: ${dossier.predictedMetrics.estimatedViscosityCp} cP</li>
        </ul>
        <hr/>
        <h2>3. Laboratory Test Requirements</h2>
        <ul>
          ${dossier.labRequestInstructions.map(instr => `<li>${instr}</li>`).join('')}
        </ul>
      </div>
    `;
  }
}


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
    evaluation: any,
    formulaName: string,
    ingredients: FormulationIngredient[]
  ): TechnicalDossier {
    const safeEval = evaluation || {};

    const rawPH =
      safeEval?.speciationResult?.pH ??
      safeEval?.pHResult?.ph ??
      safeEval?.pHResult?.pH ??
      safeEval?.phResult?.ph ??
      safeEval?.phResult?.pH ??
      safeEval?.pH ??
      safeEval?.ph ??
      7.0;

    const densitySpec = safeEval?.specificationResult?.results?.find(
      (r: any) => r.parameterKey === 'density' || r.parameterKey === 'specificGravity'
    )?.currentValue;
    const rawDensity =
      densitySpec ??
      safeEval?.densityResult?.density ??
      safeEval?.densityResult?.specificGravity ??
      safeEval?.density?.density ??
      safeEval?.density?.specificGravity ??
      1.0;

    const rawActive =
      safeEval?.activeMatterResult?.totalSurfactantActivePct ??
      safeEval?.activeMatterResult?.totalActiveMatterPct ??
      safeEval?.totalSurfactantActivePct ??
      safeEval?.totalActiveMatterPct ??
      safeEval?.activeMatter ??
      0;

    const rawVisc =
      safeEval?.viscosityResult?.predictedViscosityCp ??
      safeEval?.viscosityResult?.viscosityCp ??
      safeEval?.predictedViscosityCp ??
      (typeof safeEval?.viscosity === 'number' ? safeEval.viscosity : (safeEval?.viscosity?.cp ?? 1));

    const rawCpi =
      safeEval?.performanceResult?.cpi ??
      safeEval?.cleaningResult?.cpi ??
      safeEval?.cleaningResult?.cleaningScore ??
      safeEval?.cleaning?.cpi ??
      safeEval?.cleaning?.cleaningScore ??
      safeEval?.cpi ??
      85;

    const rawWarnings =
      safeEval?.majorWarnings ||
      safeEval?.warnings ||
      safeEval?.safetyWarnings ||
      [];
    const safetyWarnings = Array.isArray(rawWarnings)
      ? rawWarnings.map((w: any) => typeof w === 'string' ? w : (w?.message || String(w)))
      : [];

    const rawInstructions =
      safeEval?.requiredLabTests ||
      safeEval?.labRequestInstructions ||
      safeEval?.labInstructions ||
      [];
    const labRequestInstructions = Array.isArray(rawInstructions) ? rawInstructions : [];

    return {
      formulaName: formulaName || 'Untitled Formula',
      version: safeEval?.formulaVersion || safeEval?.version || '1.0',
      category: safeEval?.productCategoryLabel || safeEval?.productCategory || safeEval?.category || 'Formulation',
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      predictedMetrics: {
        pH: typeof rawPH === 'number' && !isNaN(rawPH) ? rawPH : 7.0,
        density: typeof rawDensity === 'number' && !isNaN(rawDensity) ? rawDensity : 1.0,
        totalSurfactantActivePct: typeof rawActive === 'number' && !isNaN(rawActive) ? rawActive : 0,
        estimatedViscosityCp: typeof rawVisc === 'number' && !isNaN(rawVisc) ? rawVisc : 1,
        cpi: typeof rawCpi === 'number' && !isNaN(rawCpi) ? rawCpi : 85
      },
      safetyWarnings,
      calibrationStatus: safeEval?.validationState || safeEval?.verdictStatus || 'SCREENING',
      labRequestInstructions,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a printable HTML version of the dossier.
   */
  public static generateHtml(dossier: TechnicalDossier): string {
    const phVal = dossier?.predictedMetrics?.pH;
    const activeVal = dossier?.predictedMetrics?.totalSurfactantActivePct;
    const viscVal = dossier?.predictedMetrics?.estimatedViscosityCp;
    const ings = dossier?.ingredients || [];
    const labReqs = dossier?.labRequestInstructions || [];

    return `
      <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; border: 1px solid #ccc; background-color: #ffffff; color: #1e293b;">
        <h1 style="color: #0f172a; margin-bottom: 8px;">Technical Laboratory Submission Dossier</h1>
        <p style="color: #475569; margin-top: 0;"><strong>Formula:</strong> ${dossier?.formulaName || 'Formula'} (v${dossier?.version || '1.0'})</p>
        <p style="color: #475569;"><strong>Category:</strong> ${dossier?.category || 'N/A'}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <h2 style="color: #1e293b;">1. Ingredient Composition</h2>
        <ul>
          ${ings.map(ing => `<li><strong>${ing.name}:</strong> ${ing.percentage}% (Active: ${ing.activeMatterPct || 100}%)</li>`).join('')}
        </ul>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <h2 style="color: #1e293b;">2. Predicted Key Metrics</h2>
        <ul>
          <li><strong>pH:</strong> ${typeof phVal === 'number' ? phVal.toFixed(2) : 'N/A'}</li>
          <li><strong>Active Matter:</strong> ${typeof activeVal === 'number' ? activeVal.toFixed(2) : '0'}%</li>
          <li><strong>Viscosity:</strong> ${viscVal ?? 'N/A'} cP</li>
        </ul>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <h2 style="color: #1e293b;">3. Laboratory Test Requirements</h2>
        <ul>
          ${labReqs.length > 0 ? labReqs.map(instr => `<li>${instr}</li>`).join('') : '<li>Standard formulation bench testing & 40°C stability protocol.</li>'}
        </ul>
      </div>
    `;
  }
}

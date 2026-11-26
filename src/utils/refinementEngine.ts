
import { FormulationIngredient } from '../types';
import { DetailedLabEvidenceRecord } from './labEvidenceEngine';

export interface RefinementProposal {
  id: string;
  originalIngredient: string;
  originalPercentage: number;
  proposedPercentage: number;
  rationale: string;
  confidenceScore?: number; // omitted unless a calibrated confidence method exists
}

/**
 * RefinementEngine
 * 
 * Analyzes active formulations against LAB_VALIDATED empirical data 
 * to propose ingredient adjustments for enhanced performance.
 * 
 * STRICT SAFETY RULE: Always proposes adjustments; never mutates formula state.
 */
export class RefinementEngine {
  
  public static proposeAdjustments(
    activeIngredients: FormulationIngredient[],
    labEvidence: DetailedLabEvidenceRecord[]
  ): RefinementProposal[] {
    const proposals: RefinementProposal[] = [];

    // Heuristic: Identify successful "LAB_VALIDATED" trends
    const validatedRecords = labEvidence.filter(r => r.qualityStatus === 'ACCEPTED' && r.sourceType === 'LAB_MEASURED');

    if (validatedRecords.length === 0) return [];

    // Logic: Look for ingredients that consistently perform better in validated records
    activeIngredients.forEach(ing => {
      const validatedIngredientAvg = this.getValidatedAverage(ing.name, validatedRecords);
      
      if (validatedIngredientAvg !== null && Math.abs(validatedIngredientAvg - ing.percentage) > 0.5) {
        proposals.push({
          id: `refine-${ing.name}-${Date.now()}`,
          originalIngredient: ing.name,
          originalPercentage: ing.percentage,
          proposedPercentage: Number(validatedIngredientAvg.toFixed(2)),
          rationale: `Historical validated formula data suggests an optimal level of ${validatedIngredientAvg.toFixed(2)}% for ${ing.name} to achieve desired performance targets.`,
        });
      }
    });

    return proposals;
  }

  private static getValidatedAverage(ingredientName: string, records: DetailedLabEvidenceRecord[]): number | null {
    // Only accept an explicitly ingredient-specific measured percentage.
    // Generic keys such as "activeMatterPct" cannot be attributed to a
    // particular ingredient and must never be averaged into its recipe level.
    const normalizedName = ingredientName.toLowerCase().trim();
    const slug = normalizedName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const acceptedKeys = new Set([
      `ingredient:${normalizedName}:percentage`,
      `ingredient:${slug}:percentage`,
      `ingredient_${slug}_percentage`,
      `${slug}_percentage`,
    ]);
    const matches = records.filter(record => {
      const key = (record.parameterKey || '').toLowerCase().trim();
      const unit = String(record.unit || '').toLowerCase().trim();
      return record.qualityStatus === 'ACCEPTED' &&
        record.sourceType === 'LAB_MEASURED' &&
        record.provenance === 'MEASURED' &&
        acceptedKeys.has(key) &&
        (unit === '%' || unit === 'percent' || unit === 'wt%') &&
        Number.isFinite(record.value) &&
        record.value >= 0 &&
        record.value <= 100 &&
        Boolean(record.formulaId) &&
        Boolean(record.formulaVersion);
    });

    // Require at least three distinct formula/version observations. Repeated
    // instrument reads of one formula are not independent formulation evidence.
    const independentFormulaVersions = new Set(
      matches.map(record => `${record.formulaId}::${record.formulaVersion}`)
    );
    if (independentFormulaVersions.size < 3) return null;

    return matches.reduce((sum, record) => sum + record.value, 0) / matches.length;
  }
}}

import { ProductCategoryId, normalizeProductCategory } from '../domain/productTaxonomy';

export type CompositionMeasurementBasis = 'W_W';
export type CompositionMeasurementMethod = 'GRAVIMETRIC_MASS_BALANCE' | 'VALIDATED_ASSAY' | 'OTHER_VALIDATED_METHOD';

export interface IngredientCompositionEvidence {
  evidenceKind: 'INGREDIENT_COMPOSITION';
  ingredientCanonicalId: string;
  ingredientName: string;
  compositionBasis: CompositionMeasurementBasis;
  compositionMethod: CompositionMeasurementMethod;
  compositionMethodDetails: string;
  instrumentId: string;
  instrumentCalibrationReference: string;
  sourceDocumentReference: string;
  formulaCompositionReference: string;
  batchId: string;
  replicateNumber: number;
}

export interface IngredientCompositionEvidenceInput extends IngredientCompositionEvidence {
  categoryId: string;
  formulaId: string;
  formulaVersion: string;
  sampleId: string;
  value: number;
  unit: string;
  provenance: string;
  sourceType: string;
  qualityStatus: string;
  operator: string;
}

/**
 * Ingredient-composition evidence is deliberately stricter than ordinary KPI logs.
 * A typed value alone is never sufficient to enter refinement.
 */
export function validateIngredientCompositionEvidence(
  input: Partial<IngredientCompositionEvidenceInput>
): { isValid: boolean; errors: string[]; canonicalCategory?: ProductCategoryId } {
  const errors: string[] = [];
  const category = input.categoryId ? normalizeProductCategory(input.categoryId) : 'UNKNOWN_PRODUCT_CATEGORY';
  if (category === 'UNKNOWN_PRODUCT_CATEGORY') errors.push('A recognized canonical product category is required.');
  if (!input.formulaId?.trim()) errors.push('Formula ID is required.');
  if (!input.formulaVersion?.trim()) errors.push('Exact formula version is required.');
  if (!input.batchId?.trim()) errors.push('Manufacturing batch ID is required.');
  if (!input.sampleId?.trim()) errors.push('Physical sample ID is required.');
  if (!input.operator?.trim()) errors.push('Named analyst/operator is required.');
  if (!input.ingredientCanonicalId?.trim()) errors.push('Canonical ingredient ID is required.');
  if (!input.ingredientName?.trim()) errors.push('Ingredient name is required.');
  if (input.compositionBasis !== 'W_W') errors.push('Only explicitly defined mass fraction (w/w) is currently supported.');
  if (!['GRAVIMETRIC_MASS_BALANCE', 'VALIDATED_ASSAY', 'OTHER_VALIDATED_METHOD'].includes(String(input.compositionMethod))) {
    errors.push('A supported measurement method is required.');
  }
  if (!input.compositionMethodDetails?.trim()) errors.push('Measurement method details/reference are required.');
  if (!input.instrumentId?.trim()) errors.push('Instrument identity is required.');
  if (!input.instrumentCalibrationReference?.trim()) errors.push('Current instrument calibration reference is required.');
  if (!input.sourceDocumentReference?.trim()) errors.push('Original laboratory record/source document reference is required.');
  if (!input.formulaCompositionReference?.trim()) errors.push('Exact formula composition snapshot/reference is required.');
  if (!Number.isInteger(input.replicateNumber) || Number(input.replicateNumber) < 1) errors.push('Replicate number must be a positive integer.');
  if (!Number.isFinite(input.value) || Number(input.value) < 0 || Number(input.value) > 100) {
    errors.push('Measured ingredient mass percentage must be finite and within 0–100 wt%.');
  }
  if (input.unit !== '%' && input.unit !== 'wt%') errors.push('Ingredient composition must use wt% units.');
  if (input.provenance !== 'MEASURED' || input.sourceType !== 'LAB_MEASURED' || input.qualityStatus !== 'ACCEPTED') {
    errors.push('Only accepted, directly measured laboratory observations are eligible.');
  }
  return { isValid: errors.length === 0, errors, ...(category === 'UNKNOWN_PRODUCT_CATEGORY' ? {} : { canonicalCategory: category }) };
}

import { ProductCategoryId } from '../productTaxonomy';

export type ValidationPlanArea = 'CHEMICAL_QUALITY' | 'PERFORMANCE' | 'STABILITY_QUALITY' | 'SAFETY_ENVIRONMENT';

export interface ValidationPlanItem {
  id: string;
  area: ValidationPlanArea;
  productCategories: ProductCategoryId[];
  purpose: string;
  suggestedMethodIds: string[];
  status: 'METHOD_AVAILABLE_REVIEW_REQUIRED' | 'METHOD_SELECTION_REQUIRED' | 'EXTERNAL_LAB_REVIEW_REQUIRED';
  reviewNote: string;
}

/** Planning checklist only: it defines no acceptance limits and never represents a passed test. */
export const CLEANING_PRODUCT_VALIDATION_PLAN: ValidationPlanItem[] = [
  { id: 'CHEM-IDENTITY', area: 'CHEMICAL_QUALITY', productCategories: ['LAUNDRY_POWDER', 'LAUNDRY_LIQUID', 'CAR_SHAMPOO'], purpose: 'Confirm identity/composition of relevant surfactant actives and formula-specific quality attributes.', suggestedMethodIds: ['METHOD-ACTIVE-001'], status: 'METHOD_AVAILABLE_REVIEW_REQUIRED', reviewNote: 'Anionic-active method applies only where surfactant chemistry and authorized method scope match; other classes need method selection.' },
  { id: 'CHEM-PH', area: 'CHEMICAL_QUALITY', productCategories: ['LAUNDRY_POWDER', 'LAUNDRY_LIQUID', 'CAR_SHAMPOO'], purpose: 'Measure pH under a specified aqueous preparation.', suggestedMethodIds: ['METHOD-PH-001'], status: 'METHOD_AVAILABLE_REVIEW_REQUIRED', reviewNote: 'Record preparation, dilution water, temperature, calibration and product-specific specification.' },
  { id: 'PERF-LAUNDRY', area: 'PERFORMANCE', productCategories: ['LAUNDRY_POWDER', 'LAUNDRY_LIQUID'], purpose: 'Compare soil/stain removal against a defined control and protocol.', suggestedMethodIds: ['METHOD-CPI-001'], status: 'METHOD_AVAILABLE_REVIEW_REQUIRED', reviewNote: 'ASTM D4265 is diagnostic screening; it does not itself define a consumer-ranking claim or universal pass score.' },
  { id: 'PERF-HARD-SURFACE', area: 'PERFORMANCE', productCategories: ['CAR_SHAMPOO'], purpose: 'Select a vehicle-cleaning soil removal and rinse/residue protocol.', suggestedMethodIds: [], status: 'METHOD_SELECTION_REQUIRED', reviewNote: 'No validated hard-surface/car shampoo method is currently registered; add only after method and control review.' },
  { id: 'QUALITY-STABILITY', area: 'STABILITY_QUALITY', productCategories: ['LAUNDRY_POWDER', 'LAUNDRY_LIQUID', 'CAR_SHAMPOO'], purpose: 'Assess formula-specific appearance, phase separation/caking, viscosity or moisture, packaging compatibility and stability over time.', suggestedMethodIds: ['METHOD-VISC-001', 'METHOD-POWDER-MOIST-001'], status: 'METHOD_SELECTION_REQUIRED', reviewNote: 'Choose physical-form-specific protocols, sampling intervals, packaging and storage conditions; current moisture/NVR methods remain draft.' },
  { id: 'SAFETY-ENVIRONMENT', area: 'SAFETY_ENVIRONMENT', productCategories: ['LAUNDRY_POWDER', 'LAUNDRY_LIQUID', 'CAR_SHAMPOO'], purpose: 'Determine applicable hazard, irritation, aquatic/environmental and biodegradability evidence requirements.', suggestedMethodIds: [], status: 'EXTERNAL_LAB_REVIEW_REQUIRED', reviewNote: 'Requires jurisdiction/product-use review and qualified testing; OECD TG 301 alone does not establish finished-formula compliance.' },
];

export function getValidationPlanForCategory(category: ProductCategoryId): ValidationPlanItem[] {
  return CLEANING_PRODUCT_VALIDATION_PLAN.filter(item => item.productCategories.includes(category));
}

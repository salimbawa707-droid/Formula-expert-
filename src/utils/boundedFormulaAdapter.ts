import { FormulationIngredient } from '../types';
import { ActiveMatterEngine } from './activeMatterEngine';
import { BoundedInput, calculateBoundedActiveMatter, calculateBoundedFormulaCost } from './preliminaryBoundedCalculations';

function finiteOptional(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function getRawPercent(ingredient: any): number {
  const raw = ingredient?.percentage ?? ingredient?.percent ?? ingredient?.percentageInFormula ?? ingredient?.rawPercent;
  return raw === undefined || raw === null || String(raw).trim() === '' ? Number.NaN : Number(raw);
}
export function buildBoundedActiveMatterReport(ingredients: FormulationIngredient[]) {
  const mapped = (Array.isArray(ingredients) ? ingredients : []).map((raw: any, index) => {
    const ingredient = raw || {};
    const resolution = ActiveMatterEngine.resolveIngredientActive(ingredient as FormulationIngredient);
    const sourceBacked = resolution.dataSource === 'authoritative' &&
      ingredient.activeMatterInputSource === 'SOURCE_BACKED' &&
      typeof ingredient.activeMatterEvidenceId === 'string' && ingredient.activeMatterEvidenceId.trim().length > 0 &&
      /^https:\/\/[^\s]+$/i.test(String(ingredient.activeMatterEvidenceUrl || '')) &&
      ingredient.provenance?.verificationStatus === 'VERIFIED' &&
      ingredient.provenance?.sourceUrl === ingredient.activeMatterEvidenceUrl;
    let activeMatter: BoundedInput | null = null;
    if (resolution.activeMatterPct !== null && !resolution.conflict) {
      const evidenceClass = resolution.isWater ? 'PUBLISHED_REFERENCE' : sourceBacked ? 'SUPPLIER_SPECIFIED' : resolution.dataSource === 'explicit_override' ? 'USER_ENTERED' : 'CATALOG_DEFAULT';
      const sourceRef = resolution.isWater ? 'INTRINSIC_WATER_ZERO_ACTIVE_SOLIDS_CONVENTION' : sourceBacked ? String(ingredient.activeMatterEvidenceId) + ' | ' + String(ingredient.activeMatterEvidenceUrl) : undefined;
      activeMatter = {
        nominal: resolution.activeMatterPct, lower: finiteOptional(ingredient.activeMatterLowerPct),
        upper: finiteOptional(ingredient.activeMatterUpperPct), unit: '% w/w',
        basis: 'as-supplied active matter mass fraction', evidenceClass,
        ...(sourceRef ? { sourceRef } : {}),
        ...(typeof ingredient.activeMatterUncertaintyNote === 'string' ? { uncertaintyNote: ingredient.activeMatterUncertaintyNote } : {}),
      };
    }
    return { id: String(ingredient.id || ingredient.ingredientId || 'ingredient-' + (index + 1)), name: String(ingredient.name || 'Unnamed ingredient'), rawPercent: getRawPercent(ingredient), activeMatter };
  });
  return calculateBoundedActiveMatter(mapped);
}
export function buildBoundedCostReport(ingredients: FormulationIngredient[], batchSizeKg?: number) {
  const mapped = (Array.isArray(ingredients) ? ingredients : []).map((raw: any, index) => {
    const ingredient = raw || {};
    const price = finiteOptional(ingredient.costPerKg ?? ingredient.rawMaterialCostPerKg ?? ingredient.cost);
    const priceInput: BoundedInput | null = price === undefined ? null : {
      nominal: price, lower: finiteOptional(ingredient.costPerKgLower), upper: finiteOptional(ingredient.costPerKgUpper),
      unit: 'INR/kg', basis: 'user-entered raw-material price; not a supplier quotation unless separately referenced', evidenceClass: 'USER_ENTERED',
    };
    return { id: String(ingredient.id || ingredient.ingredientId || 'ingredient-' + (index + 1)), name: String(ingredient.name || 'Unnamed ingredient'), rawPercent: getRawPercent(ingredient), pricePerKg: priceInput };
  });
  return calculateBoundedFormulaCost(mapped, batchSizeKg);
}

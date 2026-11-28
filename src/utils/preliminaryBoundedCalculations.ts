/**
 * Phase 5B-1 — bounded preliminary calculations.
 *
 * This module is deliberately separate from release/validation engines. It accepts
 * explicit, provenance-bearing input intervals and never resolves a missing value
 * to zero, a catalog label, or another supplier's published grade.
 */

export type CalculationEvidenceClass =
  | 'MEASURED'
  | 'SUPPLIER_SPECIFIED'
  | 'PUBLISHED_REFERENCE'
  | 'ENGINEERING_ESTIMATE'
  | 'CATALOG_DEFAULT'
  | 'USER_ENTERED'
  | 'UNKNOWN';

export interface BoundedInput {
  nominal: number | null;
  lower?: number | null;
  upper?: number | null;
  unit: string;
  basis: string;
  evidenceClass: CalculationEvidenceClass;
  sourceRef?: string;
  uncertaintyNote?: string;
}

export interface BoundedInputResolution {
  valid: boolean;
  nominal: number | null;
  lower: number | null;
  upper: number | null;
  warnings: string[];
  errors: string[];
  evidenceClass: CalculationEvidenceClass;
  sourceRef?: string;
  basis: string;
  unit: string;
}

export function resolveBoundedInput(
  input: BoundedInput | null | undefined,
  expectedUnit: string,
  minimum: number,
  maximum: number,
  label: string,
): BoundedInputResolution {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input || input.evidenceClass === 'UNKNOWN' || input.nominal === null || input.nominal === undefined) {
    return {
      valid: false, nominal: null, lower: null, upper: null,
      warnings: [], errors: [`${label}: UNKNOWN_INPUT — no value was supplied; it is not zero.`],
      evidenceClass: 'UNKNOWN', basis: input?.basis ?? 'UNKNOWN',
      unit: input?.unit ?? expectedUnit, sourceRef: input?.sourceRef,
    };
  }
  if (input.unit !== expectedUnit) errors.push(`${label}: expected unit ${expectedUnit}, received ${input.unit}.`);
  if (!input.basis.trim() || input.basis === 'UNKNOWN') errors.push(`${label}: calculation basis is missing.`);
  const nominal = input.nominal;
  const lower = input.lower === undefined || input.lower === null ? nominal : input.lower;
  const upper = input.upper === undefined || input.upper === null ? nominal : input.upper;
  if (![nominal, lower, upper].every(Number.isFinite)) errors.push(`${label}: all supplied values must be finite numbers.`);
  if (lower > upper) errors.push(`${label}: lower bound exceeds upper bound.`);
  if (nominal < lower || nominal > upper) errors.push(`${label}: nominal value must lie within its bounds.`);
  if (lower < minimum || upper > maximum) errors.push(`${label}: range must be within ${minimum} to ${maximum}.`);
  if (input.evidenceClass === 'ENGINEERING_ESTIMATE' && !input.uncertaintyNote?.trim()) {
    errors.push(`${label}: engineering estimates require an explicit uncertainty note.`);
  }
  if (input.evidenceClass === 'MEASURED' && !input.sourceRef?.trim()) {
    errors.push(`${label}: measured values require a measurement/evidence record reference.`);
  }
  if (input.evidenceClass === 'PUBLISHED_REFERENCE' && !input.sourceRef?.trim()) {
    errors.push(`${label}: published references require a source reference.`);
  }
  if (input.evidenceClass === 'SUPPLIER_SPECIFIED' && !input.sourceRef?.trim()) {
    errors.push(`${label}: supplier-specified values require a source reference.`);
  }
  if (input.evidenceClass === 'CATALOG_DEFAULT') {
    warnings.push(`${label}: CATALOG_DEFAULT is not a supplier assay or lot CoA.`);
  }
  if (input.evidenceClass === 'USER_ENTERED') {
    warnings.push(`${label}: USER_ENTERED value is an assumption until independently evidenced.`);
  }
  if (lower === upper) warnings.push(`${label}: point assumption only; no uncertainty interval was supplied.`);
  return {
    valid: errors.length === 0, nominal, lower, upper, warnings, errors,
    evidenceClass: input.evidenceClass, sourceRef: input.sourceRef,
    basis: input.basis, unit: input.unit,
  };
}

export interface ActiveMatterBoundedIngredient {
  id: string;
  name: string;
  rawPercent: number;
  activeMatter: BoundedInput | null;
}

export interface ActiveMatterBoundedReport {
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'INVALID_INPUT';
  formulaTotalPercent: number;
  massBalanced: boolean;
  knownActiveNominalPct: number;
  knownActiveLowerPct: number;
  knownActiveUpperPct: number;
  totalActiveNominalPct: number | null;
  totalActiveLowerPct: number | null;
  totalActiveUpperPct: number | null;
  unknownRawPercent: number;
  missingIngredientIds: string[];
  provenance: Array<{ ingredientId: string; evidenceClass: CalculationEvidenceClass; sourceRef?: string; basis: string }>;
  warnings: string[];
  errors: string[];
  releaseEligible: false;
}

export function calculateBoundedActiveMatter(
  ingredients: ActiveMatterBoundedIngredient[],
): ActiveMatterBoundedReport {
  let formulaTotalPercent = 0;
  let knownNominal = 0;
  let knownLower = 0;
  let knownUpper = 0;
  let unknownRawPercent = 0;
  const missingIngredientIds: string[] = [];
  const provenance: ActiveMatterBoundedReport['provenance'] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    errors.push('Formula ingredients are required.');
  }
  for (const ingredient of ingredients ?? []) {
    const raw = ingredient.rawPercent;
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      errors.push(`${ingredient.id}: raw percentage must be finite and between 0 and 100.`);
      continue;
    }
    formulaTotalPercent += raw;
    if (raw === 0) continue;
    const resolved = resolveBoundedInput(ingredient.activeMatter, '% w/w', 0, 100, ingredient.id || ingredient.name);
    warnings.push(...resolved.warnings);
    if (!resolved.valid) {
      unknownRawPercent += raw;
      missingIngredientIds.push(ingredient.id);
      errors.push(...resolved.errors);
      continue;
    }
    knownNominal += raw * (resolved.nominal as number) / 100;
    knownLower += raw * (resolved.lower as number) / 100;
    knownUpper += raw * (resolved.upper as number) / 100;
    provenance.push({ ingredientId: ingredient.id, evidenceClass: resolved.evidenceClass, sourceRef: resolved.sourceRef, basis: resolved.basis });
  }
  const massBalanced = errors.every(error => !error.includes('raw percentage')) &&
    Math.abs(formulaTotalPercent - 100) <= 0.05;
  if (!massBalanced && errors.length === 0) warnings.push(`Formula mass balance is ${formulaTotalPercent.toFixed(3)}%, not 100.000%.`);
  const hasInvalid = errors.some(error => error.includes('raw percentage'));
  const complete = !hasInvalid && missingIngredientIds.length === 0 && massBalanced;
  const status: ActiveMatterBoundedReport['status'] = hasInvalid
    ? 'INVALID_INPUT'
    : complete ? 'COMPLETE'
    : missingIngredientIds.length > 0 ? 'INSUFFICIENT_DATA' : 'PARTIAL';
  return {
    status, formulaTotalPercent, massBalanced,
    knownActiveNominalPct: knownNominal, knownActiveLowerPct: knownLower, knownActiveUpperPct: knownUpper,
    totalActiveNominalPct: complete ? knownNominal : null,
    totalActiveLowerPct: complete ? knownLower : null,
    totalActiveUpperPct: complete ? knownUpper : null,
    unknownRawPercent, missingIngredientIds, provenance, warnings, errors,
    releaseEligible: false,
  };
}

export interface CostBoundedIngredient {
  id: string;
  name: string;
  rawPercent: number;
  pricePerKg: BoundedInput | null;
}

export interface CostBoundedReport {
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'INVALID_INPUT';
  formulaTotalPercent: number;
  massBalanced: boolean;
  knownSubtotalNominalPerKg: number;
  knownSubtotalLowerPerKg: number;
  knownSubtotalUpperPerKg: number;
  totalCostNominalPerKg: number | null;
  totalCostLowerPerKg: number | null;
  totalCostUpperPerKg: number | null;
  unknownRawPercent: number;
  missingIngredientIds: string[];
  provenance: Array<{ ingredientId: string; evidenceClass: CalculationEvidenceClass; sourceRef?: string; basis: string }>;
  warnings: string[];
  errors: string[];
  batchCostNominal: number | null;
  batchCostLower: number | null;
  batchCostUpper: number | null;
  releaseEligible: false;
}

export function calculateBoundedFormulaCost(
  ingredients: CostBoundedIngredient[],
  batchSizeKg?: number,
): CostBoundedReport {
  let formulaTotalPercent = 0;
  let subtotalNominal = 0;
  let subtotalLower = 0;
  let subtotalUpper = 0;
  let unknownRawPercent = 0;
  const missingIngredientIds: string[] = [];
  const provenance: CostBoundedReport['provenance'] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!Array.isArray(ingredients) || ingredients.length === 0) errors.push('Formula ingredients are required.');
  const hasBatchSize = batchSizeKg === undefined || (Number.isFinite(batchSizeKg) && batchSizeKg > 0);
  if (!hasBatchSize) errors.push('Batch size must be finite and greater than zero.');
  for (const ingredient of ingredients ?? []) {
    const raw = ingredient.rawPercent;
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      errors.push(`${ingredient.id}: raw percentage must be finite and between 0 and 100.`);
      continue;
    }
    formulaTotalPercent += raw;
    if (raw === 0) continue;
    const resolved = resolveBoundedInput(ingredient.pricePerKg, 'INR/kg', 0, Number.MAX_VALUE, ingredient.id || ingredient.name);
    warnings.push(...resolved.warnings);
    if (!resolved.valid) {
      unknownRawPercent += raw;
      missingIngredientIds.push(ingredient.id);
      errors.push(...resolved.errors);
      continue;
    }
    subtotalNominal += raw / 100 * (resolved.nominal as number);
    subtotalLower += raw / 100 * (resolved.lower as number);
    subtotalUpper += raw / 100 * (resolved.upper as number);
    provenance.push({ ingredientId: ingredient.id, evidenceClass: resolved.evidenceClass, sourceRef: resolved.sourceRef, basis: resolved.basis });
  }
  const massBalanced = errors.every(error => !error.includes('raw percentage')) &&
    Math.abs(formulaTotalPercent - 100) <= 0.05;
  if (!massBalanced && errors.length === 0) warnings.push(`Formula mass balance is ${formulaTotalPercent.toFixed(3)}%, not 100.000%.`);
  const hasInvalid = errors.some(error => error.includes('raw percentage') || error.startsWith('Batch size'));
  const complete = !hasInvalid && missingIngredientIds.length === 0 && massBalanced;
  const status: CostBoundedReport['status'] = hasInvalid
    ? 'INVALID_INPUT'
    : complete ? 'COMPLETE'
    : missingIngredientIds.length > 0 ? 'INSUFFICIENT_DATA' : 'PARTIAL';
  return {
    status, formulaTotalPercent, massBalanced,
    knownSubtotalNominalPerKg: subtotalNominal,
    knownSubtotalLowerPerKg: subtotalLower,
    knownSubtotalUpperPerKg: subtotalUpper,
    totalCostNominalPerKg: complete ? subtotalNominal : null,
    totalCostLowerPerKg: complete ? subtotalLower : null,
    totalCostUpperPerKg: complete ? subtotalUpper : null,
    unknownRawPercent, missingIngredientIds, provenance, warnings, errors,
    batchCostNominal: complete && batchSizeKg !== undefined ? subtotalNominal * batchSizeKg : null,
    batchCostLower: complete && batchSizeKg !== undefined ? subtotalLower * batchSizeKg : null,
    batchCostUpper: complete && batchSizeKg !== undefined ? subtotalUpper * batchSizeKg : null,
    releaseEligible: false,
  };
}

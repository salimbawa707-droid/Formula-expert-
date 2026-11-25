import { UNIVERSAL_INGREDIENTS } from '../src/data/universalIngredientLibrary';

const ingredients = UNIVERSAL_INGREDIENTS;
const total = ingredients.length;
const uniqueIds = new Set(ingredients.map(i => i.id));
const fields = ['role', 'activeDefault', 'activeMatter', 'commercialConcentrationPct', 'surfactantActiveMatterPct', 'purityPct', 'solidsPct', 'waterContentPct', 'densityGPerMl', 'phMin', 'phMax', 'provenance'] as const;
const coverage = Object.fromEntries(fields.map(field => [
  field,
  ingredients.filter(item => item[field] !== undefined && item[field] !== null && item[field] !== '').length
]));
const missing = Object.fromEntries(fields.map(field => [
  field,
  ingredients.filter(item => item[field] === undefined || item[field] === null || item[field] === '').length
]));
const categories = Object.fromEntries([...new Set(ingredients.map(i => i.category))].sort().map(category => [
  category,
  ingredients.filter(i => i.category === category).length
]));
const invalidPercentages = ingredients.flatMap(item => {
  const keys = ['activeDefault', 'activeMatter', 'commercialConcentrationPct', 'surfactantActiveMatterPct', 'purityPct', 'solidsPct', 'waterContentPct'] as const;
  return keys.flatMap(key => {
    const value = item[key];
    return typeof value === 'number' && (value < 0 || value > 100)
      ? [{ id: item.id, field: key, value }]
      : [];
  });
});
const invalidPhRanges = ingredients.filter(i =>
  (i.phMin !== undefined && (i.phMin < 0 || i.phMin > 14)) ||
  (i.phMax !== undefined && (i.phMax < 0 || i.phMax > 14)) ||
  (i.phMin !== undefined && i.phMax !== undefined && i.phMin > i.phMax)
).map(i => ({ id: i.id, phMin: i.phMin, phMax: i.phMax }));
const applicabilityCoverage = {
  recordsWithExplicitApplicabilityField: ingredients.filter(i =>
    Object.keys(i as Record<string, unknown>).some(k => /applicab|productSuitability|categoryCompatibility/i.test(k))
  ).length,
  status: 'NOT_ASSESSED: applicability is not inferred from master catalog category or name',
  requiredProductCategories: 13
};
const report = {
  audit: 'FULL_MASTER_INGREDIENT_APPLICABILITY_BASELINE',
  generatedAt: new Date().toISOString(),
  totalRecords: total,
  uniqueIds: uniqueIds.size,
  duplicateIds: total - uniqueIds.size,
  fieldCoverage: coverage,
  missingFieldCounts: missing,
  categoryCounts: categories,
  qualityFlags: {
    invalidPercentageValues: invalidPercentages,
    invalidPhRanges,
    recordsWithNoCAS: ingredients.filter(i => !i.casNumber).length,
    recordsWithUnknownProperties: ingredients.filter(i => (i.unknownProperties?.length ?? 0) > 0).length,
    recordsWithoutProvenance: ingredients.filter(i => !i.provenance).length
  },
  applicabilityCoverage
};
console.log(JSON.stringify(report, null, 2));
if (total === 0 || uniqueIds.size !== total) {
  throw new Error('Master ingredient baseline failed: empty catalog or duplicate canonical IDs.');
}
if (invalidPercentages.length || invalidPhRanges.length) {
  throw new Error('Master ingredient baseline failed: invalid numeric ranges require remediation.');
}

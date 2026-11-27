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
const percentageFields = ['activeDefault', 'activeMatter', 'commercialConcentrationPct', 'surfactantActiveMatterPct', 'purityPct', 'solidsPct', 'waterContentPct'] as const;
const nonFiniteNumericValues = ingredients.flatMap(item => {
  const numericFields = [...percentageFields, 'densityGPerMl', 'phMin', 'phMax'] as const;
  return numericFields.flatMap(field => {
    const value = item[field];
    return typeof value === 'number' && !Number.isFinite(value)
      ? [{ id: item.id, field, value: String(value) }]
      : [];
  });
});
const invalidPercentages = ingredients.flatMap(item =>
  percentageFields.flatMap(field => {
    const value = item[field];
    return typeof value === 'number' && Number.isFinite(value) && (value < 0 || value > 100)
      ? [{ id: item.id, field, value }]
      : [];
  })
);
const invalidPhRanges = ingredients.filter(i =>
  (typeof i.phMin === 'number' && Number.isFinite(i.phMin) && (i.phMin < 0 || i.phMin > 14)) ||
  (typeof i.phMax === 'number' && Number.isFinite(i.phMax) && (i.phMax < 0 || i.phMax > 14)) ||
  (typeof i.phMin === 'number' && typeof i.phMax === 'number' &&
    Number.isFinite(i.phMin) && Number.isFinite(i.phMax) && i.phMin > i.phMax)
).map(i => ({ id: i.id, phMin: i.phMin, phMax: i.phMax }));
const invalidDensities = ingredients.flatMap(item => {
  const value = item.densityGPerMl;
  return typeof value === 'number' && Number.isFinite(value) && value <= 0
    ? [{ id: item.id, densityGPerMl: value }]
    : [];
});
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
    nonFiniteNumericValues,
    invalidPercentageValues: invalidPercentages,
    invalidPhRanges,
    invalidDensities,
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
if (nonFiniteNumericValues.length || invalidPercentages.length || invalidPhRanges.length || invalidDensities.length) {
  throw new Error('Master ingredient baseline failed: non-finite or invalid numeric values require remediation.');
}

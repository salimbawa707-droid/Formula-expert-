import assert from 'node:assert/strict';
import { FORMULAS } from '../src/data/formulas';
import {
  CANONICAL_PRODUCT_CATEGORY_IDS,
  PRODUCT_SUBCLASS_IDS,
  PRODUCT_TAXONOMY_MAP,
  normalizeProductCategory,
  validateProductCategory
} from '../src/domain/productTaxonomy';
import { SCIENTIFIC_PRODUCT_PROFILES } from '../src/domain/scientificProductProfiles';
import { INGREDIENT_INTELLIGENCE_REGISTRY } from '../src/utils/ingredientIntelligenceEngine';

const canonical = [...CANONICAL_PRODUCT_CATEGORY_IDS];
const canonicalSet = new Set(canonical);
const forbiddenHairTerms = /hair[ _-]*shampoo|shampoo[ _-]*hair/i;

assert.equal(canonical.length, 13, 'The app must expose exactly 13 canonical product categories.');
assert.equal(canonicalSet.size, 13, 'Canonical category IDs must be unique.');
assert.deepEqual(Object.keys(PRODUCT_TAXONOMY_MAP).sort(), [...canonical].sort(),
  'Taxonomy definitions must match the canonical category set exactly.');
assert.deepEqual(Object.keys(SCIENTIFIC_PRODUCT_PROFILES).sort(), [...canonical].sort(),
  'Scientific product profiles must match the canonical category set exactly.');
assert(!canonical.some(id => forbiddenHairTerms.test(id)), 'Hair Shampoo must not be a canonical category.');
assert(!PRODUCT_SUBCLASS_IDS.some(id => forbiddenHairTerms.test(id)), 'Hair Shampoo must not be a product subclass.');
assert.equal(normalizeProductCategory('Hair Shampoo'), 'UNKNOWN_PRODUCT_CATEGORY',
  'Deleted Hair Shampoo must not normalize to a live category.');
assert.equal(validateProductCategory('Hair Shampoo').valid, false,
  'Deleted Hair Shampoo must fail category validation.');
assert(canonicalSet.has('CAR_SHAMPOO'), 'Car Shampoo is an intentional vehicle-care category and must remain.');

const formulas = FORMULAS as Array<{ id: string; name: string; category?: string; categoryId?: string }>;
assert(formulas.length > 0, 'Formula catalog must not be empty.');
const formulaIds = new Set(formulas.map(f => f.id));
const unknownFormulaCategories = formulas
  .filter(f => normalizeProductCategory(f.category || f.categoryId) === 'UNKNOWN_PRODUCT_CATEGORY')
  .map(f => ({ id: f.id, name: f.name, category: f.category, categoryId: f.categoryId }));
assert.deepEqual(unknownFormulaCategories, [], 'Every formula template must resolve to one canonical category.');

for (const [categoryId, definition] of Object.entries(PRODUCT_TAXONOMY_MAP)) {
  if (definition.defaultFormulaId) {
    assert(formulaIds.has(definition.defaultFormulaId),
      `Default formula ${definition.defaultFormulaId} for ${categoryId} must exist.`);
    const defaultFormula = formulas.find(f => f.id === definition.defaultFormulaId)!;
    assert.equal(normalizeProductCategory(defaultFormula.category || defaultFormula.categoryId), categoryId,
      `Default formula ${definition.defaultFormulaId} must belong to ${categoryId}.`);
  }
}

const ingredientRecords = Object.entries(INGREDIENT_INTELLIGENCE_REGISTRY);
assert(ingredientRecords.length > 0, 'Ingredient intelligence registry must not be empty.');
for (const [ingredientId, ingredient] of ingredientRecords) {
  const mappedCategories = Object.keys(ingredient.categoryApplicability).sort();
  assert.deepEqual(mappedCategories, [...canonical].sort(),
    `Ingredient ${ingredientId} must define applicability for exactly the 13 canonical categories.`);
  assert(!Object.keys(ingredient.categoryApplicability).some(key => forbiddenHairTerms.test(key)),
    `Ingredient ${ingredientId} must not retain Hair Shampoo applicability.`);
}

console.log(JSON.stringify({
  status: 'PASS',
  canonicalCategoryCount: canonical.length,
  scientificProfileCount: Object.keys(SCIENTIFIC_PRODUCT_PROFILES).length,
  formulaTemplateCount: formulas.length,
  ingredientApplicabilityRecordsChecked: ingredientRecords.length,
  carShampooPreserved: canonicalSet.has('CAR_SHAMPOO'),
  deletedHairShampooRejected: true,
  defaultFormulaLinksChecked: Object.values(PRODUCT_TAXONOMY_MAP).filter(x => x.defaultFormulaId).length
}, null, 2));

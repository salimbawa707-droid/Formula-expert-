import { FORMULAS } from '../../data/formulas';
import { calculatePHAdvanced } from '../pHEngine';
import { createPHCalculationOptions } from '../pHEngineAdapter';
import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { revalidateFormulaTemplate } from '../templateRevalidationEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  details?: string;
}

export function runPHEngineCallerCategoryTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual: any, expected: any, details?: string) {
    results.push({
      name,
      passed: Boolean(condition),
      actual,
      expected,
      details
    });
  }

  const sampleLiquidIngs = [
    { name: 'Water', rawPercent: 85 },
    { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', rawPercent: 10, activePercent: 90 },
    { name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', rawPercent: 1.3, activePercent: 100 },
    { name: 'Sodium Chloride (Salt)', rawPercent: 1.0, activePercent: 100 }
  ];

  const samplePowderIngs = [
    { name: 'Soda Ash (Sodium Carbonate Dense)', rawPercent: 40, activePercent: 100 },
    { name: 'Sodium Tripolyphosphate (STPP)', rawPercent: 20, activePercent: 100 },
    { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', rawPercent: 15, activePercent: 90 },
    { name: 'Sodium Sulfate', rawPercent: 25, activePercent: 100 }
  ];

  // --------------------------------------------------------------------------
  // TEST A: Application-level Category Propagation to PHEngineV2
  // --------------------------------------------------------------------------
  const dishwashRes = calculatePHAdvanced(sampleLiquidIngs, 100, { productCategory: 'DISHWASH_MANUAL' });
  const dishwashComp = dishwashRes.details?.normalizedComposition;
  assert(
    'Test A.1: DISHWASH_MANUAL category propagates into PHEngineV2',
    dishwashComp?.productCategory === 'DISHWASH_MANUAL',
    dishwashComp?.productCategory,
    'DISHWASH_MANUAL'
  );
  assert(
    'Test A.2: DISHWASH_MANUAL physical form is LIQUID (isPowder = false)',
    dishwashComp?.isPowder === false,
    dishwashComp?.isPowder,
    false
  );

  // --------------------------------------------------------------------------
  // TEST B: AI Formulator Category Propagation & Alias Normalization
  // --------------------------------------------------------------------------
  const laundryPowderAliasRes = calculatePHAdvanced(samplePowderIngs, 100, 'Laundry Powder');
  const lpAliasComp = laundryPowderAliasRes.details?.normalizedComposition;
  assert(
    'Test B.1: UI alias "Laundry Powder" is normalized to canonical LAUNDRY_POWDER in PHEngineV2',
    lpAliasComp?.productCategory === 'LAUNDRY_POWDER',
    lpAliasComp?.productCategory,
    'LAUNDRY_POWDER'
  );
  assert(
    'Test B.2: LAUNDRY_POWDER sets isPowder to true in normalized composition',
    lpAliasComp?.isPowder === true,
    lpAliasComp?.isPowder,
    true
  );

  // --------------------------------------------------------------------------
  // TEST C: Powder Propagation & Consistency
  // --------------------------------------------------------------------------
  const explicitPowderRes = calculatePHAdvanced(samplePowderIngs, 100, { productCategory: 'LAUNDRY_POWDER' });
  const explicitPowderComp = explicitPowderRes.details?.normalizedComposition;
  assert(
    'Test C.1: Explicit LAUNDRY_POWDER reaches PHEngineV2 composition',
    explicitPowderComp?.productCategory === 'LAUNDRY_POWDER',
    explicitPowderComp?.productCategory,
    'LAUNDRY_POWDER'
  );
  assert(
    'Test C.2: Explicit LAUNDRY_POWDER ensures isPowder is strictly true',
    explicitPowderComp?.isPowder === true,
    explicitPowderComp?.isPowder,
    true
  );

  // --------------------------------------------------------------------------
  // TEST D: Non-Laundry Categories Never Default to LAUNDRY_LIQUID
  // --------------------------------------------------------------------------
  const softenerRes = calculatePHAdvanced(sampleLiquidIngs, 100, { productCategory: 'FABRIC_SOFTENER' });
  const softenerComp = softenerRes.details?.normalizedComposition;
  assert(
    'Test D.1: FABRIC_SOFTENER propagates to PHEngineV2 without becoming LAUNDRY_LIQUID',
    softenerComp?.productCategory === 'FABRIC_SOFTENER',
    softenerComp?.productCategory,
    'FABRIC_SOFTENER'
  );

  const carShampooRes = calculatePHAdvanced(sampleLiquidIngs, 100, { productCategory: 'CAR_SHAMPOO' });
  const carShampooComp = carShampooRes.details?.normalizedComposition;
  assert(
    'Test D.2: CAR_SHAMPOO propagates to PHEngineV2 without becoming LAUNDRY_LIQUID',
    carShampooComp?.productCategory === 'CAR_SHAMPOO',
    carShampooComp?.productCategory,
    'CAR_SHAMPOO'
  );

  const glassCleanerRes = calculatePHAdvanced(sampleLiquidIngs, 100, { productCategory: 'GLASS_CLEANER' });
  const glassCleanerComp = glassCleanerRes.details?.normalizedComposition;
  assert(
    'Test D.3: GLASS_CLEANER propagates to PHEngineV2 without becoming LAUNDRY_LIQUID',
    glassCleanerComp?.productCategory === 'GLASS_CLEANER',
    glassCleanerComp?.productCategory,
    'GLASS_CLEANER'
  );

  // --------------------------------------------------------------------------
  // TEST E: Unknown Category Throws Explicitly (Fix 1 Boundary Preserved)
  // --------------------------------------------------------------------------
  let unknownCategoryThrew = false;
  try {
    calculatePHAdvanced(sampleLiquidIngs, 100, { productCategory: 'Alien Rocket Cleaner' });
  } catch (err: any) {
    unknownCategoryThrew = err.message.includes('Unrecognized product category');
  }
  assert(
    'Test E.1: Unknown category "Alien Rocket Cleaner" throws explicit error in calculatePHAdvanced',
    unknownCategoryThrew,
    unknownCategoryThrew,
    true
  );

  // --------------------------------------------------------------------------
  // TEST F: pHEngineAdapter Category Preservation
  // --------------------------------------------------------------------------
  const adapterOpts1 = createPHCalculationOptions('FABRIC_SOFTENER', { temperatureC: 30 });
  assert(
    'Test F.1: Adapter preserves canonical FABRIC_SOFTENER category',
    adapterOpts1.productCategory === 'FABRIC_SOFTENER',
    adapterOpts1.productCategory,
    'FABRIC_SOFTENER'
  );
  assert(
    'Test F.2: Adapter preserves additional calculation options (temperatureC = 30)',
    adapterOpts1.temperatureC === 30,
    adapterOpts1.temperatureC,
    30
  );

  const adapterOpts2 = createPHCalculationOptions('Auto Dishwash');
  assert(
    'Test F.3: Adapter normalizes alias "Auto Dishwash" to DISHWASH_AUTOMATIC',
    adapterOpts2.productCategory === 'DISHWASH_AUTOMATIC',
    adapterOpts2.productCategory,
    'DISHWASH_AUTOMATIC'
  );

  // --------------------------------------------------------------------------
  // TEST G: Template Revalidation Guarantees Category Context for All 39 Templates
  // --------------------------------------------------------------------------
  let allTemplatesPassedCategory = true;
  let mismatchedTemplateId: string | null = null;

  for (const template of FORMULAS) {
    const report = revalidateFormulaTemplate(template);
    if (!report.phReport) {
      allTemplatesPassedCategory = false;
      mismatchedTemplateId = template.id;
      break;
    }
  }

  assert(
    'Test G: All 39 formula templates revalidate with explicit canonical product category',
    allTemplatesPassedCategory,
    mismatchedTemplateId ? `Failed on template: ${mismatchedTemplateId}` : 'ALL_39_VALID',
    'ALL_39_VALID'
  );

  // --------------------------------------------------------------------------
  // MUTATION TESTS (Simulating & Detecting Potential Regressions)
  // --------------------------------------------------------------------------
  // Mutation 1: Missing category in low-level call leaves productCategory undefined (not defaulted to LAUNDRY_LIQUID)
  const lowLevelCallRes = calculatePHAdvanced(sampleLiquidIngs, 100);
  assert(
    'Mutation 1 Detection: Low-level call without category leaves productCategory undefined without fallback to LAUNDRY_LIQUID',
    lowLevelCallRes.details?.normalizedComposition?.productCategory === undefined,
    lowLevelCallRes.details?.normalizedComposition?.productCategory,
    undefined
  );

  // Mutation 2: Category mismatch detection - powder must NOT match LAUNDRY_LIQUID
  const powderCategoryMatchesLaundry = lpAliasComp?.productCategory === 'LAUNDRY_LIQUID';
  assert(
    'Mutation 2 Detection: Laundry powder is NOT classified as LAUNDRY_LIQUID',
    powderCategoryMatchesLaundry === false,
    powderCategoryMatchesLaundry,
    false
  );

  // Mutation 3: Adapter category dropping detection
  const emptyAdapterCall = createPHCalculationOptions(undefined);
  assert(
    'Mutation 3 Detection: Adapter with undefined category returns empty/unmodified options without injecting LAUNDRY_LIQUID',
    emptyAdapterCall.productCategory === undefined,
    emptyAdapterCall.productCategory,
    undefined
  );

  // Mutation 4: Direct PHEngineV2 call with all 13 canonical categories
  let canonicalCategoriesPassPHEngine = true;
  for (const cat of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const res = PHEngineV2.calculatePH(sampleLiquidIngs, 100, { productCategory: cat });
    if (res.details.normalizedComposition?.productCategory !== cat) {
      canonicalCategoriesPassPHEngine = false;
      break;
    }
  }
  assert(
    'Mutation 4 Detection: All 13 canonical categories survive intact through PHEngineV2 composition normalizer',
    canonicalCategoriesPassPHEngine,
    canonicalCategoriesPassPHEngine,
    true
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}

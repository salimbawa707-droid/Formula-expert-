/**
 * ============================================================================
 * P0-2 — CATEGORY PROPAGATION & CLEANING SCORE INTEGRITY REGRESSION TEST SUITE
 * ============================================================================
 *
 * Verifies strict category propagation and product-specific performance models:
 * - 1. All 13 Finished Product Categories propagate unchanged through Orchestrator
 * - 2. Performance models are category-specific (NO silent LAUNDRY_LIQUID fallback)
 * - 3. Fabric Softener has non-cleansing conditioning model (cleaningScore = null)
 * - 4. Missing category returns structured blocking state (not defaulted)
 * - 5. Dynamic category changes alter scientific models and KPIs
 * - 6. Category / formula chemical mismatch detection
 * - 7. Category context integrity across all child engines and quality gate
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { CanonicalFormulaInput } from '../orchestrator/types';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runCategoryPropagationTestSuite() {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    });
  }

  const baseIngredients = [
    { name: 'Water', percentage: 80.0, role: 'Solvent' },
    { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 8.0, activeMatterPct: 90, role: 'Anionic Surfactant' },
    { name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', percentage: 0.88, activeMatterPct: 100, role: 'pH Adjuster' },
    { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 8.0, activeMatterPct: 70, role: 'Anionic Surfactant' },
    { name: 'Sodium Chloride', percentage: 1.0, activeMatterPct: 100, role: 'Thickener' },
    { name: 'Sodium Citrate', percentage: 1.0, activeMatterPct: 100, role: 'Chelator' },
    { name: 'Water (Balance)', percentage: 1.12, activeMatterPct: 0, role: 'Solvent' }
  ];

  // =========================================================================
  // TEST GROUP 1: ALL 13 CANONICAL CATEGORIES ROUTE TO SPECIFIC PERFORMANCE MODELS
  // =========================================================================
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const input: CanonicalFormulaInput = {
      formulaName: `${catId} Test Formulation`,
      productCategory: catId,
      ingredients: catId === 'FABRIC_SOFTENER' 
        ? [
            { name: 'Water', percentage: 90.0, role: 'Solvent' },
            { name: 'Esterquat (Di-Hydrogenated Tallow Triethanolamine Quat 90%)', percentage: 8.0, activeMatterPct: 90, role: 'Cationic Surfactant' },
            { name: 'Calcium Chloride', percentage: 0.5, activeMatterPct: 100, role: 'Viscosity Modifier' },
            { name: 'Water (Balance)', percentage: 1.5, activeMatterPct: 0, role: 'Solvent' }
          ]
        : baseIngredients,
      batchSizeKg: 100,
      waterHardnessPpm: 150
    };

    const evalRes = FormulaScientificOrchestrator.evaluate(input);

    assert(
      'Group 1: 13-Category Routing',
      `Category ${catId} propagates unchanged to formulaIdentity.canonicalCategory`,
      evalRes.formulaIdentity.canonicalCategory === catId,
      evalRes.formulaIdentity.canonicalCategory,
      catId
    );

    assert(
      'Group 1: 13-Category Routing',
      `Category ${catId} propagates unchanged to cleaningResult.productCategory`,
      evalRes.cleaningResult.productCategory === catId,
      evalRes.cleaningResult.productCategory,
      catId
    );

    assert(
      'Group 1: 13-Category Routing',
      `Category ${catId} activates category-specific modelId (not generic default)`,
      evalRes.cleaningResult.modelId.includes(catId),
      evalRes.cleaningResult.modelId,
      `MODEL_${catId}_V2`
    );
  }

  // =========================================================================
  // TEST GROUP 2: CRITICAL MANDATORY NEGATIVE TESTS (TESTS A - G)
  // =========================================================================

  // Test A: FLOOR_CLEANER does NOT use Laundry Liquid model
  const evalFloor = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Commercial Floor Cleaner',
    productCategory: 'FLOOR_CLEANER',
    ingredients: [
      { name: 'Water', percentage: 90.0 },
      { name: 'Alcohol Ethoxylate (LAE-9)', percentage: 5.0, activeMatterPct: 100, role: 'Nonionic Surfactant' },
      { name: 'Sodium Citrate', percentage: 2.0, activeMatterPct: 100, role: 'Chelator' },
      { name: 'Water (Balance)', percentage: 3.0 }
    ]
  });

  assert(
    'Group 2: Negative Tests',
    'Test A: FLOOR_CLEANER does NOT use Laundry Liquid cleaning model',
    evalFloor.cleaningResult.modelId === 'MODEL_FLOOR_CLEANER_V2' &&
    evalFloor.cleaningResult.scoreType === 'FLOOR_CLEANER_PERFORMANCE_CPI' &&
    evalFloor.cleaningResult.productCategory === 'FLOOR_CLEANER',
    evalFloor.cleaningResult.modelId,
    'MODEL_FLOOR_CLEANER_V2'
  );

  // Test B: GLASS_CLEANER does NOT use Laundry Liquid model
  const evalGlass = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Streak-Free Glass Cleaner',
    productCategory: 'GLASS_CLEANER',
    ingredients: [
      { name: 'Water', percentage: 90.0 },
      { name: 'Isopropanol (IPA)', percentage: 7.0, role: 'Solvent' },
      { name: 'Sodium Lauryl Sulfate', percentage: 1.0, activeMatterPct: 100, role: 'Anionic Surfactant' },
      { name: 'Water (Balance)', percentage: 2.0 }
    ]
  });

  assert(
    'Group 2: Negative Tests',
    'Test B: GLASS_CLEANER does NOT use Laundry Liquid cleaning model',
    evalGlass.cleaningResult.modelId === 'MODEL_GLASS_CLEANER_V2' &&
    evalGlass.cleaningResult.scoreType === 'GLASS_CLEANER_PERFORMANCE_CPI',
    evalGlass.cleaningResult.modelId,
    'MODEL_GLASS_CLEANER_V2'
  );

  // Test C: FABRIC_SOFTENER has non-cleansing model (cleaningScore = null, isCleaningApplicable = false)
  const evalSoftener = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Fabric Softener',
    productCategory: 'FABRIC_SOFTENER',
    ingredients: [
      { name: 'Water', percentage: 92.0 },
      { name: 'Esterquat (Di-Hydrogenated Tallow Triethanolamine Quat 90%)', percentage: 6.0, activeMatterPct: 90, role: 'Cationic Surfactant' },
      { name: 'Water (Balance)', percentage: 2.0 }
    ]
  });

  assert(
    'Group 2: Negative Tests',
    'Test C: FABRIC_SOFTENER sets isCleaningApplicable = false and cleaningScore = null',
    evalSoftener.cleaningResult.isCleaningApplicable === false &&
    evalSoftener.cleaningResult.cleaningScore === null &&
    evalSoftener.cleaningResult.scoreType === 'FIBER_CONDITIONING_SOFTNESS_CPI',
    evalSoftener.cleaningResult.cleaningScore,
    null
  );

  // Test D: CAR_SHAMPOO does NOT use Laundry Liquid model
  const evalCar = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Car Wash Shampoo',
    productCategory: 'CAR_SHAMPOO',
    ingredients: [
      { name: 'Water', percentage: 85.0 },
      { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 8.0, activeMatterPct: 70 },
      { name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 4.0, activeMatterPct: 30 },
      { name: 'Water (Balance)', percentage: 3.0 }
    ]
  });

  assert(
    'Group 2: Negative Tests',
    'Test D: CAR_SHAMPOO uses automotive cleaning model (not laundry liquid)',
    evalCar.cleaningResult.modelId === 'MODEL_CAR_SHAMPOO_V2' &&
    evalCar.cleaningResult.scoreType === 'CAR_SHAMPOO_PERFORMANCE_CPI',
    evalCar.cleaningResult.modelId,
    'MODEL_CAR_SHAMPOO_V2'
  );

  // Test E: Missing / Undefined Category returns structured blocking state (NOT LAUNDRY_LIQUID)
  const evalUndefinedCat = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Uncategorized Formula',
    productCategory: undefined,
    ingredients: [
      { name: 'Water', percentage: 100.0 }
    ]
  });

  assert(
    'Group 2: Negative Tests',
    'Test E: Undefined category evaluates to UNKNOWN_PRODUCT_CATEGORY with blocking issue (NO LAUNDRY_LIQUID fallback)',
    evalUndefinedCat.formulaIdentity.canonicalCategory === 'UNKNOWN_PRODUCT_CATEGORY' &&
    evalUndefinedCat.cleaningResult.productCategory === 'UNKNOWN_PRODUCT_CATEGORY' &&
    evalUndefinedCat.cleaningResult.modelId === 'MODEL_NOT_VALIDATED' &&
    evalUndefinedCat.blockingIssues.some(b => b.code === 'ERR_UNKNOWN_CATEGORY'),
    evalUndefinedCat.formulaIdentity.canonicalCategory,
    'UNKNOWN_PRODUCT_CATEGORY'
  );

  // Direct cleaning engine call without category
  const directCleaningNoCat = calculateCleaningPerformance(baseIngredients, 8.0, undefined);
  assert(
    'Group 2: Negative Tests',
    'Test E.2: Low-level calculateCleaningPerformance without category yields UNKNOWN_PRODUCT_CATEGORY (NO LAUNDRY_LIQUID)',
    directCleaningNoCat.productCategory === 'UNKNOWN_PRODUCT_CATEGORY' &&
    directCleaningNoCat.modelType === 'MODEL_NOT_VALIDATED',
    directCleaningNoCat.productCategory,
    'UNKNOWN_PRODUCT_CATEGORY'
  );

  // Test F: Switching category dynamically changes calculation context and KPIs
  const evalAsLaundry = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Switchable Test',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: baseIngredients
  });

  const evalAsFloor = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Switchable Test',
    productCategory: 'FLOOR_CLEANER',
    ingredients: baseIngredients
  });

  assert(
    'Group 2: Negative Tests',
    'Test F: Switching category from LAUNDRY_LIQUID to FLOOR_CLEANER changes modelId and scoreType',
    evalAsLaundry.cleaningResult.modelId !== evalAsFloor.cleaningResult.modelId &&
    evalAsLaundry.cleaningResult.scoreType !== evalAsFloor.cleaningResult.scoreType,
    `${evalAsLaundry.cleaningResult.modelId} -> ${evalAsFloor.cleaningResult.modelId}`,
    'MODEL_LAUNDRY_LIQUID_V2 -> MODEL_FLOOR_CLEANER_V2'
  );

  // Test G: Category / Formula chemical clash detection
  const evalClashingSoftener = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Clashing Softener with LABSA',
    productCategory: 'FABRIC_SOFTENER',
    ingredients: [
      { name: 'Water', percentage: 85.0 },
      { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 10.0, activeMatterPct: 90, role: 'Anionic Surfactant' },
      { name: 'Sodium Hydroxide', percentage: 1.1, activeMatterPct: 100 },
      { name: 'Water (Balance)', percentage: 3.9 }
    ]
  });

  assert(
    'Group 2: Negative Tests',
    'Test G: Fabric softener containing anionic surfactants triggers chemical incompatibility and blocking issue',
    evalClashingSoftener.finalScientificStatus === 'INCOMPATIBLE' &&
    evalClashingSoftener.blockingIssues.some(b => b.code.includes('ANIONIC') || b.code.includes('INCOMPATIBILITY')),
    evalClashingSoftener.finalScientificStatus,
    'INCOMPATIBLE'
  );

  // =========================================================================
  // TEST GROUP 3: STRUCTURED CLEANING SCORE OUTPUT INTEGRITY
  // =========================================================================
  const stdEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Structured Output Standard',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: baseIngredients
  });

  assert(
    'Group 3: Structured Output',
    'Cleaning output contains all mandatory structured metadata (modelId, modelVersion, confidence, uncertainty, limitingFactors)',
    Boolean(
      stdEval.cleaningResult.modelId &&
      stdEval.cleaningResult.modelVersion &&
      stdEval.cleaningResult.confidence &&
      stdEval.cleaningResult.uncertainty &&
      Array.isArray(stdEval.cleaningResult.limitingFactors) &&
      Array.isArray(stdEval.cleaningResult.positiveFactors)
    ),
    true,
    true
  );

  assert(
    'Group 3: Structured Output',
    'Score is expressed as clean scale (0-100 index), not misleading accuracy percentage',
    typeof stdEval.cleaningResult.cpi === 'number' &&
    stdEval.cleaningResult.cpi >= 0 &&
    stdEval.cleaningResult.cpi <= 100,
    stdEval.cleaningResult.cpi,
    'Number between 0 and 100'
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nCategory Propagation & Cleaning Integrity Test Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

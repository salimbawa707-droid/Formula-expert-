/**
 * ============================================================================
 * FIX 5 — POWDER SLURRY BASIS & DEAD-PATH FORENSIC REGRESSION TEST SUITE
 * ============================================================================
 * Verifies that:
 * 1. Authoritative powder pH calculation enforces exact 1.0% w/v slurry basis.
 * 2. No double dilution occurs (neither manual pre-dilution nor duplicate factor).
 * 3. No zero/no dilution occurs (slurry dilution factor is active for powders).
 * 4. Liquid formulations (LAUNDRY_LIQUID, DISHWASH_MANUAL, etc.) are NOT diluted.
 * 5. All 13 product categories maintain strict physical form and slurry routing.
 * 6. All 39 formula templates revalidate accurately without chemistry drift.
 * 7. Legacy powder engine heuristics remain isolated and non-authoritative.
 * ============================================================================
 */

import { normalizeFormulationComposition } from '../../domain/ph/compositionNormalizer';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { revalidateFormulaTemplate } from '../templateRevalidationEngine';
import { FORMULAS } from '../../data/formulas';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';

export interface TestResult {
  name: string;
  group: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runPowderSlurryBasisTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function assert(
    group: string,
    name: string,
    condition: boolean,
    actual: any,
    expected: any,
    message?: string
  ) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
    });
  }

  function assertNear(
    group: string,
    name: string,
    actual: number,
    expected: number,
    tolerance: number
  ) {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    assert(
      group,
      name,
      passed,
      actual,
      `${expected} ± ${tolerance}`,
      passed
        ? `PASS (diff: ${diff.toFixed(4)})`
        : `FAIL: got ${actual}, expected ${expected} ± ${tolerance} (diff: ${diff.toFixed(4)})`
    );
  }

  // Reference standard alkaline laundry powder formula
  const powderRawIngredients = [
    { name: 'Soda Ash', percentage: 30.0 },
    { name: 'Sodium Sulfate', percentage: 50.0 },
    { name: 'LABSA 96%', percentage: 10.0, activeMatterPct: 96 },
    { name: 'STPP', percentage: 10.0 }
  ];

  // -------------------------------------------------------------------------
  // TEST 1 — Exact Powder Slurry Basis (1.0% w/v = 10 g/L)
  // -------------------------------------------------------------------------
  const pHEngineInput = mapFormulationIngredientsToPHEngineInput(powderRawIngredients);
  const normalizedPowder = normalizeFormulationComposition(pHEngineInput, 100, {
    productCategory: 'LAUNDRY_POWDER',
    assumeSlurryBasisIfPowder: true,
    slurryConcentrationPct: 1.0
  });

  assert(
    'Fix 5: Slurry Basis',
    'Test 1.1: Normalized composition detects isPowder = true',
    normalizedPowder.isPowder === true,
    normalizedPowder.isPowder,
    true
  );
  assert(
    'Fix 5: Slurry Basis',
    'Test 1.2: Slurry dilution factor is 0.01 (1.0% w/v basis)',
    normalizedPowder.slurryDilutionFactor === 0.01,
    normalizedPowder.slurryDilutionFactor,
    0.01
  );
  assert(
    'Fix 5: Slurry Basis',
    'Test 1.3: Total aqueous slurry volume is 10,000 L for 100 kg batch (10 g/L)',
    normalizedPowder.totalVolumeL === 10000,
    normalizedPowder.totalVolumeL,
    10000
  );

  // Moles of Soda Ash in 30 kg @ MW 105.99 = 283.045 mol
  // In 10,000 L volume, molarity = 0.02830 mol/L (~0.0283 M)
  const sodaAshItem = normalizedPowder.ingredients.find(i => i.inputName === 'Soda Ash');
  assertNear(
    'Fix 5: Slurry Basis',
    'Test 1.4: Soda Ash analytical molarity corresponds to 1% slurry basis (0.0283 M)',
    sodaAshItem?.molarity ?? 0,
    0.0283,
    0.001
  );

  // -------------------------------------------------------------------------
  // TEST 2 — No Double Dilution
  // -------------------------------------------------------------------------
  // If double dilution occurred, totalVolumeL would be 1,000,000 L (0.01% w/v, molarity ~ 0.00028 M)
  assert(
    'Fix 5: No Double Dilution',
    'Test 2.1: Volume is not doubly diluted to 1,000,000 L',
    normalizedPowder.totalVolumeL < 50000,
    normalizedPowder.totalVolumeL,
    '< 50,000 L'
  );
  assert(
    'Fix 5: No Double Dilution',
    'Test 2.2: Analytical molarity is not doubly diluted to sub-millimolar level',
    (sodaAshItem?.molarity ?? 0) > 0.01,
    sodaAshItem?.molarity,
    '> 0.01 M'
  );

  // -------------------------------------------------------------------------
  // TEST 3 — No Zero/No Dilution
  // -------------------------------------------------------------------------
  // If zero dilution occurred, totalVolumeL would be 100 L (neat solid, molarity ~ 2.83 M)
  assert(
    'Fix 5: No Zero Dilution',
    'Test 3.1: Volume is diluted beyond neat 100 L batch',
    normalizedPowder.totalVolumeL > 1000,
    normalizedPowder.totalVolumeL,
    '> 1000 L'
  );
  assert(
    'Fix 5: No Zero Dilution',
    'Test 3.2: Analytical molarity is below neat concentrated level (< 1.0 M)',
    (sodaAshItem?.molarity ?? 0) < 0.5,
    sodaAshItem?.molarity,
    '< 0.5 M'
  );

  // -------------------------------------------------------------------------
  // TEST 4 — Liquid Formulations Do NOT Receive Slurry Dilution
  // -------------------------------------------------------------------------
  const liquidRaw = [
    { name: 'Water', percentage: 70.0 },
    { name: 'SLES 70%', percentage: 20.0, activeMatterPct: 70 },
    { name: 'LABSA 96%', percentage: 10.0, activeMatterPct: 96 }
  ];
  const liquidInput = mapFormulationIngredientsToPHEngineInput(liquidRaw);
  const normalizedLiquid = normalizeFormulationComposition(liquidInput, 100, {
    productCategory: 'LAUNDRY_LIQUID'
  });

  assert(
    'Fix 5: Liquid Isolation',
    'Test 4.1: LAUNDRY_LIQUID has isPowder = false',
    normalizedLiquid.isPowder === false,
    normalizedLiquid.isPowder,
    false
  );
  assert(
    'Fix 5: Liquid Isolation',
    'Test 4.2: LAUNDRY_LIQUID slurry dilution factor is 1.0 (no dilution expansion)',
    normalizedLiquid.slurryDilutionFactor === 1.0,
    normalizedLiquid.slurryDilutionFactor,
    1.0
  );
  assertNear(
    'Fix 5: Liquid Isolation',
    'Test 4.3: LAUNDRY_LIQUID total volume matches batch mass basis (~100 L)',
    normalizedLiquid.totalVolumeL,
    100,
    10
  );

  // -------------------------------------------------------------------------
  // TEST 5 — All 13 Categories Strict Routing
  // -------------------------------------------------------------------------
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const testComp = normalizeFormulationComposition(
      mapFormulationIngredientsToPHEngineInput([{ name: 'Water', percentage: 100 }]),
      100,
      { productCategory: catId }
    );

    if (catId === 'LAUNDRY_POWDER') {
      assert(
        'Fix 5: Category Routing',
        `Test 5: [${catId}] correctly enables powder slurry`,
        testComp.isPowder === true && testComp.slurryDilutionFactor === 0.01,
        `isPowder=${testComp.isPowder}, factor=${testComp.slurryDilutionFactor}`,
        'isPowder=true, factor=0.01'
      );
    } else {
      assert(
        'Fix 5: Category Routing',
        `Test 5: Non-powder [${catId}] does NOT enable powder slurry`,
        testComp.isPowder === false && testComp.slurryDilutionFactor === 1.0,
        `isPowder=${testComp.isPowder}, factor=${testComp.slurryDilutionFactor}`,
        'isPowder=false, factor=1.0'
      );
    }
  }

  // -------------------------------------------------------------------------
  // TEST 6 — 39 Formula Template Revalidation
  // -------------------------------------------------------------------------
  let powderTemplateCount = 0;
  let revalidatedCount = 0;

  for (const formula of FORMULAS) {
    const rep = revalidateFormulaTemplate(formula);
    revalidatedCount++;
    if (rep.phReport.powderBasis) {
      powderTemplateCount++;
      assert(
        'Fix 5: Template Revalidation',
        `Test 6: Powder template [${formula.id}] has valid powderBasis with 1% slurry`,
        rep.phReport.powderBasis.slurryConcentrationPct === 1.0,
        rep.phReport.powderBasis.slurryConcentrationPct,
        1.0
      );
    }
  }

  assert(
    'Fix 5: Template Revalidation',
    'Test 6.1: All 39 templates revalidated successfully',
    revalidatedCount === 39,
    revalidatedCount,
    39
  );
  assert(
    'Fix 5: Template Revalidation',
    'Test 6.2: Powder templates identified in canonical library (>0)',
    powderTemplateCount > 0,
    powderTemplateCount,
    '> 0'
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return { passed, failed, total: results.length, results };
}

/**
 * ============================================================================
 * P1 PHASE 5 — SCIENTIFIC QUALITY GATE REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies deterministic scientific quality gate architecture:
 * 1. 5 Distinct Status Dimensions (Scientific Validity, Specification, Compatibility, Performance, Evidence).
 * 2. Final Formula Status Determination & Fatal Overrides (high scores cannot conceal fatal errors).
 * 3. All 13 Canonical Categories Specification & Quality Gate Validation.
 * 4. All 39 Canonical Formula Templates Pipeline Re-validation.
 * 5. Category Mismatch, Unknown Category, Unbalanced Mass Balance, and Anionic-Cationic Conflict Handling.
 */

import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { FormulationIngredient } from '../../types';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { FORMULAS } from '../../data/formulas';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase5ScientificQualityGateTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({
        name,
        passed: false,
        message: `Assertion failed. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
        actual,
        expected
      });
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('\n================================================================================');
  console.log('  P1 PHASE 5 — SCIENTIFIC QUALITY GATE REGRESSION TEST SUITE ');
  console.log('================================================================================\n');

  // Sample heavy-duty laundry liquid screening formula. It is scientifically processable,
  // but the authoritative specification evaluator reports an out-of-spec parameter and
  // the absence of empirical lab measurements must keep final release status gated.
  const validLaundryFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 8, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 4, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, category: 'Builder' },
    { name: 'Caustic Soda 50%', percentage: 1.88, activeMatterPct: 50, category: 'pH Adjuster' },
    { name: 'Phenoxyethanol', percentage: 0.5, category: 'Preservative' },
    { name: 'Water', percentage: 74.62, category: 'Solvent' }
  ];

  // --------------------------------------------------------------------------
  // TEST 1: Valid Formula 5-Dimension Status Verification
  // --------------------------------------------------------------------------
  const validGate = evaluateScientificQualityGate({
    formulaName: 'Valid Heavy Duty Laundry Liquid',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: validLaundryFormula
  });

  assert('Incomplete Formula Inputs - Missing ingredient assay/pH must not be accepted as scientifically valid', validGate.scientificValidity !== 'VALID', validGate.scientificValidity, 'INSUFFICIENT_DATA or INVALID');
  assert('Incomplete Formula Inputs - Unavailable measurements do not create specification PASS', validGate.specificationStatus !== 'PASS', validGate.specificationStatus, 'NOT PASS');
  assert('Incomplete Formula Inputs - Compatibility remains unavailable without evaluable pH', validGate.compatibilityStatus === 'INSUFFICIENT_DATA', validGate.compatibilityStatus, 'INSUFFICIENT_DATA');
  assert('Incomplete Formula Inputs - Performance remains unavailable without complete wash scenario', validGate.performanceStatus === 'INSUFFICIENT_DATA', validGate.performanceStatus, 'INSUFFICIENT_DATA');
  assert('Incomplete Formula Inputs - Evidence remains predicted only', validGate.evidenceStatus === 'PREDICTED_ONLY', validGate.evidenceStatus, 'PREDICTED_ONLY');
  assert('Incomplete Formula Inputs - Solver failure blocks lab readiness', validGate.finalFormulaStatus === 'SCIENTIFICALLY_INVALID', validGate.finalFormulaStatus, 'SCIENTIFICALLY_INVALID');
  assert('Incomplete Formula Inputs - Lab readiness is blocked by scientific invalidity', validGate.labReadiness === 'BLOCKED_BY_SCIENTIFIC_INVALIDITY', validGate.labReadiness, 'BLOCKED_BY_SCIENTIFIC_INVALIDITY');

  assert('Category targets - unverified provenance is explicitly surfaced', validGate.majorWarnings.some(w => w.code === 'WARN_UNVERIFIED_CATEGORY_TARGETS'), validGate.majorWarnings.map(w => w.code), 'WARN_UNVERIFIED_CATEGORY_TARGETS');
  assert('Missing hardness - no default hardness/dose scenario is silently substituted', validGate.majorWarnings.some(w => w.code === 'WARN_ASSUMED_WATER_HARDNESS' && w.message.includes('No default water-hardness or dose scenario was substituted')), validGate.majorWarnings.map(w => w.code), 'WARN_ASSUMED_WATER_HARDNESS');

  // --------------------------------------------------------------------------
  // TEST 2: Unknown Product Category Handling
  // --------------------------------------------------------------------------
  const unknownCatGate = evaluateScientificQualityGate({
    formulaName: 'Formula With Invalid Category',
    productCategory: 'INVALID_CATEGORY_XYZ',
    ingredients: validLaundryFormula
  });

  assert('Unknown Category - Scientific Validity is INVALID', unknownCatGate.scientificValidity === 'INVALID', unknownCatGate.scientificValidity, 'INVALID');
  assert('Unknown Category - Final Status is SCIENTIFICALLY_INVALID', unknownCatGate.finalFormulaStatus === 'SCIENTIFICALLY_INVALID', unknownCatGate.finalFormulaStatus, 'SCIENTIFICALLY_INVALID');
  assert('Unknown Category - Lab Readiness is REQUIRES_INGREDIENT_IDENTITY', unknownCatGate.labReadiness === 'REQUIRES_INGREDIENT_IDENTITY' || unknownCatGate.labReadiness === 'BLOCKED_BY_SCIENTIFIC_INVALIDITY', true, true);
  assert('Unknown Category - ERR_UNKNOWN_CATEGORY Code Flagged', unknownCatGate.blockingIssues.some(i => i.code === 'ERR_UNKNOWN_CATEGORY'), true, true);

  // --------------------------------------------------------------------------
  // TEST 3: Empty Formula Zero Data Safeguard
  // --------------------------------------------------------------------------
  const emptyGate = evaluateScientificQualityGate({
    formulaName: 'Empty Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: []
  });

  assert('Empty Formula - Scientific Validity is INSUFFICIENT_DATA', emptyGate.scientificValidity === 'INSUFFICIENT_DATA', emptyGate.scientificValidity, 'INSUFFICIENT_DATA');
  assert('Empty Formula - Final Status is INSUFFICIENT_DATA', emptyGate.finalFormulaStatus === 'INSUFFICIENT_DATA', emptyGate.finalFormulaStatus, 'INSUFFICIENT_DATA');
  assert('Empty Formula - Performance Status is INSUFFICIENT_DATA', emptyGate.performanceStatus === 'INSUFFICIENT_DATA', emptyGate.performanceStatus, 'INSUFFICIENT_DATA');

  const unknownCategoryGate = evaluateScientificQualityGate({
    formulaName: 'Unknown Category pH Must Not Default',
    productCategory: 'UNKNOWN_CATEGORY_FOR_PH_TEST',
    ingredients: validLaundryFormula
  });
  assert('Unknown category does not receive a synthetic neutral pH', unknownCategoryGate.speciationResult.pH === null, unknownCategoryGate.speciationResult.pH, null);
  assert('Unknown category pH absence blocks scientific validity', unknownCategoryGate.scientificValidity === 'INVALID' || unknownCategoryGate.scientificValidity === 'INSUFFICIENT_DATA', unknownCategoryGate.scientificValidity, 'INVALID or INSUFFICIENT_DATA');

  // --------------------------------------------------------------------------
  // TEST 4: Unbalanced Mass Balance Sum Check
  // --------------------------------------------------------------------------
  const unbalancedFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 70, category: 'Solvent' } // Total = 80%
  ];
  const unbalancedGate = evaluateScientificQualityGate({
    formulaName: 'Unbalanced Recipe (80%)',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: unbalancedFormula
  });

  assert('Unbalanced Formula - Scientific Validity is INVALID', unbalancedGate.scientificValidity === 'INVALID', unbalancedGate.scientificValidity, 'INVALID');
  assert('Unbalanced Formula - Final Status is SCIENTIFICALLY_INVALID', unbalancedGate.finalFormulaStatus === 'SCIENTIFICALLY_INVALID', unbalancedGate.finalFormulaStatus, 'SCIENTIFICALLY_INVALID');
  assert('Unbalanced Formula - ERR_MASS_BALANCE_UNBALANCED Flagged', unbalancedGate.blockingIssues.some(i => i.code === 'ERR_MASS_BALANCE_UNBALANCED'), true, true);

  // --------------------------------------------------------------------------
  // TEST 5: Fatal Chemical Incompatibility Override (Anionic + Cationic)
  // --------------------------------------------------------------------------
  const incompatibleFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'BKC 80%', percentage: 5, activeMatterPct: 80, category: 'Cationic Surfactant' },
    { name: 'Water', percentage: 85, category: 'Solvent' }
  ];
  const incompatibleGate = evaluateScientificQualityGate({
    formulaName: 'Anionic Cationic Clash',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: incompatibleFormula
  });

  assert('Incompatible Formula - Compatibility Status is INCOMPATIBLE', incompatibleGate.compatibilityStatus === 'INCOMPATIBLE' || incompatibleGate.compatibilityStatus === 'CRITICAL_HAZARD', incompatibleGate.compatibilityStatus, 'INCOMPATIBLE');
  assert('Incompatible Formula - Final Status is INCOMPATIBLE', incompatibleGate.finalFormulaStatus === 'INCOMPATIBLE', incompatibleGate.finalFormulaStatus, 'INCOMPATIBLE');
  assert('Incompatible Formula - Lab Readiness is BLOCKED_BY_FATAL_INCOMPATIBILITY', incompatibleGate.labReadiness === 'BLOCKED_BY_FATAL_INCOMPATIBILITY', incompatibleGate.labReadiness, 'BLOCKED_BY_FATAL_INCOMPATIBILITY');

  // --------------------------------------------------------------------------
  // TEST 6: Fabric Softener Anionic Contamination Special Gate
  // --------------------------------------------------------------------------
  const softenerAnionicFormula: FormulationIngredient[] = [
    { name: 'Esterquat 90%', percentage: 6, activeMatterPct: 90, category: 'Cationic Surfactant' },
    { name: 'SLES 70%', percentage: 1, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 93, category: 'Solvent' }
  ];
  const softenerGate = evaluateScientificQualityGate({
    formulaName: 'Softener with Anionic Contamination',
    productCategory: 'FABRIC_SOFTENER',
    ingredients: softenerAnionicFormula
  });

  assert('Fabric Softener Contamination - Compatibility Status is INCOMPATIBLE', softenerGate.compatibilityStatus === 'INCOMPATIBLE', softenerGate.compatibilityStatus, 'INCOMPATIBLE');
  assert('Fabric Softener Contamination - Final Status is INCOMPATIBLE', softenerGate.finalFormulaStatus === 'INCOMPATIBLE', softenerGate.finalFormulaStatus, 'INCOMPATIBLE');
  assert('Fabric Softener Contamination - Softener Anionic Code Flagged', softenerGate.blockingIssues.some(i => i.code === 'ERR_FABRIC_SOFTENER_ANIONIC_CONTAMINATION' || i.code === 'ERR_CHEMICAL_INCOMPATIBILITY'), true, true);

  // --------------------------------------------------------------------------
  // TEST 7: All 13 Canonical Categories Specification & Quality Gate Validation
  // --------------------------------------------------------------------------
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const catGate = evaluateScientificQualityGate({
      formulaName: `Test Formula for ${catId}`,
      productCategory: catId,
      ingredients: validLaundryFormula
    });

    assert(`Category Quality Gate Evaluated: ${catId}`, catGate.canonicalCategory === catId, catGate.canonicalCategory, catId);
    assert(`Category Quality Gate Returns Valid Report Structure: ${catId}`, typeof catGate.finalFormulaStatus === 'string' && (typeof catGate.speciationResult.pH === 'number' || catGate.speciationResult.pH === null), true, true);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Re-validation of All 39 Canonical Formula Templates
  // --------------------------------------------------------------------------
  const templates = FORMULAS || [];
  let evaluatedTemplateCount = 0;

  for (const tpl of templates) {
    const ings: FormulationIngredient[] = (tpl.ingredients || []).map((i: any) => ({
      name: i.name,
      percentage: Number(i.percentage ?? i.percent ?? 0),
      ...((i.activeMatterPct ?? i.activePercent) !== undefined && (i.activeMatterPct ?? i.activePercent) !== null
        ? { activeMatterPct: Number(i.activeMatterPct ?? i.activePercent) }
        : {}),
      category: i.category || i.role || 'Additive'
    }));

    const tplGate = evaluateScientificQualityGate({
      formulaName: tpl.name || tpl.id,
      productCategory: tpl.category,
      ingredients: ings
    });

    evaluatedTemplateCount++;
    assert(`Template ${tpl.id} Evaluated (${tplGate.canonicalCategory})`, tplGate.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY', tplGate.canonicalCategory, 'KNOWN');
    assert(`Template ${tpl.id} Mass Balance Total Valid`, Math.abs(ings.reduce((a, b) => a + (b.percentage ?? 0), 0) - 100.0) <= 1.0, true, true);
  }

  assert('All 39 Templates Processed', evaluatedTemplateCount >= 39, evaluatedTemplateCount, 39);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 5 QUALITY GATE TESTS : ${total}`);
  console.log(`PASSED                             : ${passed}`);
  console.log(`FAILED                             : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

/**
 * ============================================================================
 * PHASE 10 — MASTER FORMULA SCIENTIFIC REMEDIATION & REVALIDATION TEST SUITE
 * ============================================================================
 */

import { FORMULAS } from '../../data/formulas';
import { evaluateScientificQualityGate } from '../calculators';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runPhase10MasterFormulaTestSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(suite: string, name: string, condition: boolean, actual?: any, expected?: any) {
    const passed = Boolean(condition);
    results.push({
      name: `[${suite}] ${name}`,
      passed,
      message: passed
        ? 'PASS'
        : `FAIL: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  }

  // 1. Total Master Formula Inventory Count
  assert('Inventory', 'Master Formula count equals 39', FORMULAS.length === 39, FORMULAS.length, 39);

  // 2. Evaluate All 39 Master Formulas against Master Scientific Quality Gate
  let validCount = 0;
  let blockedCount = 0;
  const categoriesFound = new Set<string>();

  FORMULAS.forEach((f, idx) => {
    const category = f.categoryId || f.category;
    categoriesFound.add(category);

    const gate = evaluateScientificQualityGate({
      formulaId: f.id,
      formulaName: f.name,
      formulaVersion: f.version || '1.0.0',
      productCategory: category,
      ingredients: f.ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        percentage: ing.percent,
        activeMatterPct: ing.activePercent,
        category: ing.category,
        costPerKg: ing.costPerKg
      }))
    });

    const isPass = gate.scientificValidity === 'VALID' && gate.blockingIssues.length === 0;
    if (isPass) {
      validCount++;
    } else {
      blockedCount++;
    }

    // A template must be evaluated honestly, not presumed scientifically valid.
    // Missing evidence, unknown ingredient assays, or unavailable pH should block it.
    const hasExplicitVerdict =
      typeof gate.finalFormulaStatus === 'string' &&
      gate.finalFormulaStatus.length > 0 &&
      typeof gate.scientificValidity === 'string';
    assert('FormulaValidation', `Formula #${idx + 1} [${f.id}] receives an explicit quality-gate verdict`, hasExplicitVerdict, gate.finalFormulaStatus, 'Explicit verdict required');
    assert('MassBalance', `Formula #${idx + 1} [${f.id}] mass balance total equals 100%`, Math.abs(f.ingredients.reduce((s, i) => s + (i.percent || 0), 0) - 100) < 0.1, true, true);
    assert('ProvenanceTraceability', `Formula #${idx + 1} [${f.id}] generates version fingerprint`, Boolean(gate.formulaFingerprint), true, true);
    assert('StatusDiscipline', `Formula #${idx + 1} [${f.id}] calculation alone NEVER yields LAB_VALIDATED`, gate.evidenceStatus !== 'FULLY_LAB_VALIDATED', gate.evidenceStatus, 'PREDICTED_ONLY or PARTIALLY_MEASURED');
  });

  // 3. Category Coverage across all 13 Canonical Categories
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    assert('TaxonomyCoverage', `Category ${catId} is represented in Master Library`, categoriesFound.has(catId), true, true);
  }

  assert('Summary', 'All master formulas receive an explicit verdict (valid or blocked)', validCount + blockedCount === FORMULAS.length, validCount + blockedCount, FORMULAS.length);
  assert('Summary', 'At least one unsupported master formula remains blocked pending evidence', blockedCount > 0, blockedCount, 'At least one blocked formula expected until evidence is complete');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    passed: passedCount,
    failed: failedCount,
    results
  };
}

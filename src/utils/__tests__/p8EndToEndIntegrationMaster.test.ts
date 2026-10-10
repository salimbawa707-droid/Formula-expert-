/**
 * ============================================================================
 * PHASE 8 — FORMULA EXPERT END-TO-END SCIENTIFIC INTEGRATION MASTER TEST SUITE
 * ============================================================================
 */

import {
  evaluateScientificQualityGate,
  computeFormulaFingerprint,
  checkResultTraceability,
  evaluateFormulaScientificValidation,
  calculateCleaningPerformance
} from '../calculators';
import { routeScientificExecution } from '../scientificRouter';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runPhase8EndToEndIntegrationTestSuite(): { passed: number; failed: number; results: TestResult[] } {
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

  // 1. Complete Formula Workflow & All 13 Categories Execution
  for (const categoryId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const route = routeScientificExecution(categoryId);
    assert('Routing', `Category ${categoryId} generates execution route`, Boolean(route), true, true);
    assert('Routing', `Category ${categoryId} canonical ID matches`, route.categoryId === categoryId, route.categoryId, categoryId);

    // Create a representative valid recipe for each category
    const recipe: FormulationIngredient[] = [
      { id: 'water', name: 'Deionized Water', percentage: 70.0, category: 'Solvent' },
      { id: 'surf1', name: 'SLES 70%', percentage: 15.0, category: 'Anionic Surfactant' },
      { id: 'surf2', name: 'CAPB 30%', percentage: 5.0, category: 'Amphoteric Surfactant' },
      { id: 'bldr', name: 'GLDA 47%', percentage: 2.0, category: 'Chelator' },
      { id: 'buffer', name: 'Citric Acid 50%', percentage: 1.0, category: 'Acidifier' },
      { id: 'filler', name: 'Sodium Sulfate', percentage: 7.0, category: 'Bulking Agent' }
    ];

    const gate = evaluateScientificQualityGate({
      formulaId: `F-${categoryId}`,
      formulaVersion: '1.0.0',
      productCategory: categoryId,
      ingredients: recipe,
      waterHardnessPpm: 150,
      batchSizeKg: 100
    });

    assert('Taxonomy13', `Quality Gate executes for ${categoryId}`, Boolean(gate), true, true);
    assert('Taxonomy13', `Category ${categoryId} produces valid provenanceReport`, Boolean(gate.provenanceReport), true, true);
    assert('Taxonomy13', `Category ${categoryId} fingerprint generated`, Boolean(gate.formulaFingerprint), true, true);
  }

  // 2. Authoritative Engine Routing & Powder vs Liquid Distinction
  const powderRoute = routeScientificExecution('LAUNDRY_POWDER');
  assert('EngineRouting', 'Laundry Powder flagged as powder', powderRoute.isPowder === true, powderRoute.isPowder, true);
  assert('EngineRouting', 'Laundry Powder includes POWDER_ENGINE', powderRoute.applicableEngines.includes('POWDER_ENGINE'), true, true);

  const liquidRoute = routeScientificExecution('LAUNDRY_LIQUID');
  assert('EngineRouting', 'Laundry Liquid flagged as liquid (not powder)', liquidRoute.isPowder === false, liquidRoute.isPowder, false);

  // 3. Dependency Synchronization (CPI -> Active Matter & Hardness)
  const lowActiveRecipe: FormulationIngredient[] = [
    { id: 'water', name: 'Water', percentage: 98.0, category: 'Solvent' },
    { id: 'surf', name: 'SLES 70%', percentage: 2.0, category: 'Anionic Surfactant' }
  ];
  const highActiveRecipe: FormulationIngredient[] = [
    { id: 'water', name: 'Water', percentage: 70.0, category: 'Solvent' },
    { id: 'surf', name: 'SLES 70%', percentage: 30.0, category: 'Anionic Surfactant' }
  ];

  const lowActiveScore = calculateCleaningPerformance(lowActiveRecipe, 8.0, 'LAUNDRY_LIQUID').cpi;
  const highActiveScore = calculateCleaningPerformance(highActiveRecipe, 8.0, 'LAUNDRY_LIQUID').cpi;
  assert('DependencySync', 'Downstream CPI increases with higher active matter', highActiveScore > lowActiveScore, highActiveScore > lowActiveScore, true);

  // 4. Stale Result Prevention & Version Isolation
  const recipeA: FormulationIngredient[] = [
    { id: 'w', name: 'Water', percentage: 80.0 },
    { id: 's', name: 'SLES 70%', percentage: 20.0 }
  ];
  const fpA = computeFormulaFingerprint('F-01', '1.0.0', recipeA, 'LAUNDRY_LIQUID');

  const recipeB: FormulationIngredient[] = [
    { id: 'w', name: 'Water', percentage: 79.0 },
    { id: 's', name: 'SLES 70%', percentage: 21.0 }
  ];
  const fpB = computeFormulaFingerprint('F-01', '1.0.0', recipeB, 'LAUNDRY_LIQUID');

  const traceResult = checkResultTraceability(fpA, fpB);
  assert('StalePrevention', 'Recipe change renders recorded fingerprint stale', traceResult.isStale === true, traceResult.isStale, true);

  // 5. Result Consistency & Blocking Overrides
  const fatalIncompatibleRecipe: FormulationIngredient[] = [
    { id: 'bleach', name: 'Sodium Hypochlorite 12%', percentage: 10.0, category: 'Bleach / Oxidizer' },
    { id: 'acid', name: 'Hydrochloric Acid 33%', percentage: 10.0, category: 'Acidifier' },
    { id: 'water', name: 'Water', percentage: 80.0, category: 'Solvent' }
  ];

  const fatalGate = evaluateScientificQualityGate({
    formulaId: 'F-FATAL',
    formulaVersion: '1.0.0',
    productCategory: 'TOILET_CLEANER',
    ingredients: fatalIncompatibleRecipe
  });

  assert('ResultConsistency', 'Fatal Bleach + Acid is flagged INCOMPATIBLE', fatalGate.compatibilityStatus === 'INCOMPATIBLE' || fatalGate.compatibilityStatus === 'CRITICAL_HAZARD', fatalGate.compatibilityStatus, 'INCOMPATIBLE');
  assert('ResultConsistency', 'Fatal formula final status is INCOMPATIBLE', fatalGate.finalFormulaStatus === 'INCOMPATIBLE', fatalGate.finalFormulaStatus, 'INCOMPATIBLE');
  assert('ResultConsistency', 'Fatal formula has blocking issues', fatalGate.blockingIssues.length > 0, fatalGate.blockingIssues.length > 0, true);

  // 6. LAB_VALIDATED & PRODUCTION_READY Restrictions
  const calcValidation = evaluateFormulaScientificValidation({
    formulaId: 'F-UNTESTED',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: { pH: 8.5, viscosityCps: 200, activeSurfactantsPct: 15.0, cpi: 85 },
    labEvidenceRecords: []
  });

  assert('ValidationRestrictions', 'Theoretical calculation alone CANNOT yield isLabValidated=true', calcValidation.isLabValidated === false, calcValidation.isLabValidated, false);
  assert('ValidationRestrictions', 'Theoretical calculation alone CANNOT yield isProductionReady=true', calcValidation.isProductionReady === false, calcValidation.isProductionReady, false);
  assert('ValidationRestrictions', 'State remains SCIENTIFICALLY_SCREENED or CALCULATED', calcValidation.validationState === 'SCIENTIFICALLY_SCREENED' || calcValidation.validationState === 'CALCULATED', calcValidation.validationState, 'SCIENTIFICALLY_SCREENED');

  // 7. Error & Incomplete Data Handling
  const emptyGate = evaluateScientificQualityGate({
    formulaId: 'F-EMPTY',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: []
  });

  assert('ErrorHandling', 'Empty ingredients recipe yields INSUFFICIENT_DATA', emptyGate.scientificValidity === 'INSUFFICIENT_DATA', emptyGate.scientificValidity, 'INSUFFICIENT_DATA');
  assert('ErrorHandling', 'Empty ingredients recipe blocks readiness', emptyGate.blockingIssues.some(b => b.code === 'ERR_EMPTY_FORMULA'), true, true);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    passed: passedCount,
    failed: failedCount,
    results
  };
}

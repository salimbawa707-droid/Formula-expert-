/**
 * ============================================================================
 * P0-3 — AI GRADE CATEGORY PROPAGATION & SCIENTIFIC INTEGRITY REGRESSION SUITE
 * ============================================================================
 * 
 * Verifies that:
 * 1. AI Grade consumes the authoritative SSOT evaluation result from the Orchestrator.
 * 2. Category propagates explicitly for all 13 canonical categories without fallback.
 * 3. Product-specific AI Grade profiles are activated for each canonical category.
 * 4. UNKNOWN data states are NOT treated as 0 or PASS.
 * 5. NOT_APPLICABLE metrics (e.g. Fabric Softener detergency) do not penalize scores.
 * 6. Category context mismatch triggers CATEGORY_CONTEXT_INTEGRITY_ERROR.
 * 7. Missing category yields structured AI_GRADE_NOT_EVALUABLE.
 * 8. Strict determinism and version provenance across repeat evaluations.
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { evaluateAIGrade, CATEGORY_GRADING_PROFILES } from '../gradeEngine';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}

export function runP03AiGradeCategoryPropagationTestSuite(): TestSuiteSummary {
  const results: TestResult[] = [];

  const assert = (group: string, name: string, condition: boolean, actual?: any, expected?: any) => {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected
    });
  };

  // Base ingredients for liquid formulations
  const baseLiquidIngredients = [
    { name: 'Deionized Water', percentage: 75.0, activeMatterPct: 0, role: 'Solvent' },
    { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 14.0, activeMatterPct: 70, role: 'Anionic Surfactant', costPerKg: 110 },
    { name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 5.0, activeMatterPct: 30, role: 'Amphoteric Surfactant', costPerKg: 140 },
    { name: 'Sodium Chloride', percentage: 1.0, activeMatterPct: 100, role: 'Viscosity Modifier', costPerKg: 10 },
    { name: 'Tetrasodium GLDA (47%)', percentage: 2.0, activeMatterPct: 47, role: 'Chelator', costPerKg: 180 },
    { name: 'Preservative', percentage: 0.1, activeMatterPct: 100, role: 'Preservative', costPerKg: 500 },
    { name: 'Water (Balance)', percentage: 2.9, activeMatterPct: 0, role: 'Solvent' }
  ];

  // ===========================================================================
  // GROUP 1: ALL 13 CANONICAL CATEGORIES PROPAGATION & PROFILE ACTIVATION
  // ===========================================================================
  for (const categoryId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const evalResult = FormulaScientificOrchestrator.evaluate({
      formulaId: `F-TEST-${categoryId}`,
      formulaName: `Scientific Test Formula for ${categoryId}`,
      formulaVersion: '1.0.0',
      productCategory: categoryId,
      ingredients: baseLiquidIngredients,
      waterHardnessPpm: 150,
      costContext: {
        targetCostPerKg: 60.0
      }
    });

    const aiGrade = evalResult.aiGrade;
    const expectedProfile = CATEGORY_GRADING_PROFILES[categoryId];

    // 1. Category reaches AI Grade unchanged
    assert(
      'Group 1: 13-Category Propagation',
      `Category ${categoryId} reaches AI Grade unchanged`,
      aiGrade.productCategory === categoryId && aiGrade.productCategory === evalResult.formulaIdentity.canonicalCategory,
      aiGrade.productCategory,
      categoryId
    );

    // 2. Correct category model ID is selected
    assert(
      'Group 1: 13-Category Propagation',
      `Category ${categoryId} activates model ${expectedProfile.modelId}`,
      aiGrade.categoryModelId === expectedProfile.modelId,
      aiGrade.categoryModelId,
      expectedProfile.modelId
    );

    // 3. AI Grade category matches Quality Gate category
    assert(
      'Group 1: 13-Category Propagation',
      `AI Grade category equals Quality Gate category for ${categoryId}`,
      aiGrade.productCategory === evalResult.qualityGateResult.canonicalCategory,
      aiGrade.productCategory,
      evalResult.qualityGateResult.canonicalCategory
    );

    // 4. Structured metadata is complete
    assert(
      'Group 1: 13-Category Propagation',
      `Category ${categoryId} contains versioned metadata`,
      aiGrade.gradingRulesVersion === '2026.1' &&
      aiGrade.scientificEngineVersion === '2.0.0' &&
      aiGrade.ingredientDatabaseVersion === '2026.1' &&
      typeof aiGrade.numericScore === 'number' &&
      aiGrade.numericScore >= 0 &&
      aiGrade.numericScore <= 100,
      true,
      true
    );
  }

  // ===========================================================================
  // GROUP 2: MANDATORY NEGATIVE TESTS (TESTS A - J)
  // ===========================================================================

  // Test A: FLOOR_CLEANER does NOT use Laundry Liquid grading
  const evalFloor = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Floor Cleaner Test',
    productCategory: 'FLOOR_CLEANER',
    ingredients: baseLiquidIngredients
  });
  assert(
    'Group 2: Negative Tests',
    'Test A: FLOOR_CLEANER does NOT use Laundry Liquid AI Grade model',
    evalFloor.aiGrade.categoryModelId === 'AIGRADE_MODEL_FLOOR_CLEANER_V1' &&
    (evalFloor.aiGrade.categoryModelId as string) !== 'AIGRADE_MODEL_LAUNDRY_LIQUID_V1',
    evalFloor.aiGrade.categoryModelId,
    'AIGRADE_MODEL_FLOOR_CLEANER_V1'
  );

  // Test B: GLASS_CLEANER does NOT use Laundry Liquid grading
  const evalGlass = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Glass Cleaner Test',
    productCategory: 'GLASS_CLEANER',
    ingredients: [
      { name: 'Water', percentage: 92.0 },
      { name: 'Isopropanol (IPA 99%)', percentage: 5.0, activeMatterPct: 99, role: 'Solvent' },
      { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 1.0, activeMatterPct: 70, role: 'Surfactant' },
      { name: 'Ammonia 25%', percentage: 0.5, activeMatterPct: 25, role: 'Alkali' },
      { name: 'Water (Balance)', percentage: 1.5 }
    ]
  });
  assert(
    'Group 2: Negative Tests',
    'Test B: GLASS_CLEANER does NOT use Laundry Liquid AI Grade model',
    evalGlass.aiGrade.categoryModelId === 'AIGRADE_MODEL_GLASS_CLEANER_V1' &&
    (evalGlass.aiGrade.categoryModelId as string) !== 'AIGRADE_MODEL_LAUNDRY_LIQUID_V1',
    evalGlass.aiGrade.categoryModelId,
    'AIGRADE_MODEL_GLASS_CLEANER_V1'
  );

  // Test C: FABRIC_SOFTENER sets detergency NOT_APPLICABLE and does NOT penalize
  const evalSoftener = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Fabric Softener Test',
    productCategory: 'FABRIC_SOFTENER',
    ingredients: [
      { name: 'Water', percentage: 90.0 },
      { name: 'Esterquat (90%)', percentage: 8.0, activeMatterPct: 90, role: 'Cationic Surfactant' },
      { name: 'Calcium Chloride', percentage: 0.2, activeMatterPct: 100, role: 'Viscosity Control' },
      { name: 'Fragrance', percentage: 0.5, role: 'Fragrance' },
      { name: 'Water (Balance)', percentage: 1.3 }
    ]
  });
  assert(
    'Group 2: Negative Tests',
    'Test C: FABRIC_SOFTENER uses softening model, detergency NOT_APPLICABLE and earns valid Grade',
    evalSoftener.aiGrade.categoryModelId === 'AIGRADE_MODEL_FABRIC_SOFTENER_V1' &&
    evalSoftener.aiGrade.breakdown.statusMap?.performance === 'NOT_APPLICABLE' &&
    evalSoftener.aiGrade.numericScore >= 70,
    evalSoftener.aiGrade.categoryModelId,
    'AIGRADE_MODEL_FABRIC_SOFTENER_V1'
  );

  // Test D: CAR_SHAMPOO uses automotive grading profile
  const evalCar = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Car Wash Shampoo',
    productCategory: 'CAR_SHAMPOO',
    ingredients: baseLiquidIngredients
  });
  assert(
    'Group 2: Negative Tests',
    'Test D: CAR_SHAMPOO uses automotive AI Grade model',
    evalCar.aiGrade.categoryModelId === 'AIGRADE_MODEL_CAR_SHAMPOO_V1',
    evalCar.aiGrade.categoryModelId,
    'AIGRADE_MODEL_CAR_SHAMPOO_V1'
  );

  // Test E: Missing category yields AI_GRADE_NOT_EVALUABLE with reason CATEGORY_REQUIRED
  const evalNoCat = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unassigned Category Recipe',
    productCategory: undefined,
    ingredients: baseLiquidIngredients
  });
  assert(
    'Group 2: Negative Tests',
    'Test E: Missing category produces AI_GRADE_NOT_EVALUABLE and blocking issue',
    evalNoCat.aiGrade.gradeType === 'AI_GRADE_NOT_EVALUABLE' &&
    evalNoCat.aiGrade.isEvaluable === false &&
    evalNoCat.aiGrade.grade === 'N/A' &&
    evalNoCat.aiGrade.blockingIssues.includes('CATEGORY_REQUIRED'),
    evalNoCat.aiGrade.gradeType,
    'AI_GRADE_NOT_EVALUABLE'
  );

  // Direct evaluateAIGrade call with unknown category
  const directNoCat = evaluateAIGrade({
    formulaIdentity: { canonicalCategory: 'UNKNOWN_PRODUCT_CATEGORY' },
    scientificValidity: 'INVALID'
  });
  assert(
    'Group 2: Negative Tests',
    'Test E.2: Direct evaluateAIGrade with UNKNOWN_PRODUCT_CATEGORY returns AI_GRADE_NOT_EVALUABLE',
    directNoCat.gradeType === 'AI_GRADE_NOT_EVALUABLE' && directNoCat.grade === 'N/A',
    directNoCat.gradeType,
    'AI_GRADE_NOT_EVALUABLE'
  );

  // Test F: Category mismatch triggers CATEGORY_CONTEXT_INTEGRITY_ERROR
  const mismatchResult = evaluateAIGrade({
    formulaIdentity: { canonicalCategory: 'LAUNDRY_LIQUID' },
    scientificValidity: 'VALID',
    cleaningResult: { productCategory: 'FLOOR_CLEANER' }
  });
  assert(
    'Group 2: Negative Tests',
    'Test F: Category mismatch triggers CATEGORY_CONTEXT_INTEGRITY_ERROR',
    mismatchResult.gradeType === 'CATEGORY_CONTEXT_INTEGRITY_ERROR' &&
    mismatchResult.blockingIssues.includes('CATEGORY_CONTEXT_INTEGRITY_ERROR'),
    mismatchResult.gradeType,
    'CATEGORY_CONTEXT_INTEGRITY_ERROR'
  );

  // Test G: Unknown cost does NOT assume cost = 0
  const evalUnknownCost = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unknown Cost Recipe',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: baseLiquidIngredients,
    costContext: { targetCostPerKg: undefined } // Unknown target cost
  });
  assert(
    'Group 2: Negative Tests',
    'Test G: Unknown target cost is marked UNKNOWN with baseline commercial score (not cost = 0)',
    evalUnknownCost.aiGrade.breakdown.statusMap?.commercial === 'UNKNOWN' &&
    evalUnknownCost.aiGrade.unknownParameters.includes('targetCost'),
    evalUnknownCost.aiGrade.breakdown.statusMap?.commercial,
    'UNKNOWN'
  );

  // Test H: Unknown lab evidence is NOT treated as LAB_VALIDATED
  const evalUnmeasured = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Theoretical Only Recipe',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: baseLiquidIngredients,
    labEvidence: [] // No physical measurements
  });
  assert(
    'Group 2: Negative Tests',
    'Test H: Unmeasured formula is flagged PREDICTED_ONLY, not LAB_VALIDATED',
    evalUnmeasured.aiGrade.labValidationStatus.includes('PREDICTED_ONLY') &&
    !evalUnmeasured.aiGrade.labValidationStatus.includes('LAB_VALIDATED'),
    evalUnmeasured.aiGrade.labValidationStatus.includes('PREDICTED_ONLY'),
    true
  );

  // Test I: Not-applicable metric does not penalize score
  const evalHandWash = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Gentle Hand Wash',
    productCategory: 'HAND_WASH',
    ingredients: [
      { name: 'Water', percentage: 75.0 },
      { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 12.0, activeMatterPct: 70, role: 'Surfactant' },
      { name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 8.0, activeMatterPct: 30, role: 'Amphoteric Surfactant' },
      { name: 'Glycerin', percentage: 3.0, activeMatterPct: 100, role: 'Humectant' },
      { name: 'Water (Balance)', percentage: 2.0 }
    ]
  });
  assert(
    'Group 2: Negative Tests',
    'Test I: Hand Wash prioritizes skin mildness and earns strong score',
    evalHandWash.aiGrade.categoryModelId === 'AIGRADE_MODEL_HAND_WASH_V1' &&
    evalHandWash.aiGrade.numericScore >= 75,
    evalHandWash.aiGrade.categoryModelId,
    'AIGRADE_MODEL_HAND_WASH_V1'
  );

  // Test J: Strict Determinism across repeat evaluations
  const evalRepeat1 = FormulaScientificOrchestrator.evaluate({
    formulaId: 'F-DET-01',
    formulaName: 'Determinism Test Recipe',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: baseLiquidIngredients,
    costContext: { targetCostPerKg: 60 }
  });
  const evalRepeat2 = FormulaScientificOrchestrator.evaluate({
    formulaId: 'F-DET-01',
    formulaName: 'Determinism Test Recipe',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: baseLiquidIngredients,
    costContext: { targetCostPerKg: 60 }
  });
  assert(
    'Group 2: Negative Tests',
    'Test J: Identical formula evaluated twice produces strictly identical grade and numeric score',
    evalRepeat1.aiGrade.grade === evalRepeat2.aiGrade.grade &&
    evalRepeat1.aiGrade.numericScore === evalRepeat2.aiGrade.numericScore &&
    evalRepeat1.aiGrade.reasoning === evalRepeat2.aiGrade.reasoning,
    `${evalRepeat1.aiGrade.grade} (${evalRepeat1.aiGrade.numericScore})`,
    `${evalRepeat2.aiGrade.grade} (${evalRepeat2.aiGrade.numericScore})`
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

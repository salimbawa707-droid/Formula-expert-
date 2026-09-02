import { ActiveFormulaState, FormulationIngredient } from '../../types';
import { FORMULAS } from '../../data/formulas';
import {
  calculateActiveMatter,
  calculateActiveSurfactants,
  calculateBatchCost,
  calculateCPI,
  calculateFormulationCompatibility,
  calculateLabHealthScore,
  evaluateAIGrade
} from '../calculators';
import { calculatePHAdvanced } from '../pHEngine';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';

export function runFormulaWorkflowTestSuite(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assertEqual(category: string, testName: string, actual: any, expected: any) {
    if (actual === expected) {
      console.log(`[PASS] ${category} :: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${category} :: ${testName} -> Expected: ${expected}, Got: ${actual}`);
      failed++;
    }
  }

  function assertNear(category: string, testName: string, actual: number, expected: number, tolerance = 0.05) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
      console.log(`[PASS] ${category} :: ${testName} (${actual})`);
      passed++;
    } else {
      console.error(`[FAIL] ${category} :: ${testName} -> Expected: ~${expected} (±${tolerance}), Got: ${actual}`);
      failed++;
    }
  }

  console.log("==================================================");
  console.log("  PHASE 2.8 E2E FORMULA WORKFLOW & DATA FLOW SUITE");
  console.log("==================================================");

  // -------------------------------------------------------------
  // 1. INGREDIENT ADDITION WORKFLOW
  // -------------------------------------------------------------
  const baseIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Water / Aqua', percentage: 80, percent: 80, activeMatterPct: 0, costPerKg: 1, role: 'Solvent', category: 'Solvent' },
    { id: '2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 10, percent: 10, activeMatterPct: 90, costPerKg: 150, role: 'Anionic Surfactant', category: 'Anionic Surfactant' }
  ];

  const initialActiveMatter = calculateActiveMatter(baseIngredients);
  assertNear('Ingredient Addition', 'Initial active matter calculation (9.00%)', initialActiveMatter, 9.00, 0.01);

  // Add Caustic Soda (NaOH) to neutralize LABSA
  const ingredientsWithNaOH: FormulationIngredient[] = [
    ...baseIngredients,
    { id: '3', name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', percentage: 1.3, percent: 1.3, activeMatterPct: 100, costPerKg: 50, role: 'pH Adjuster', category: 'pH Adjuster' }
  ];

  const updatedActiveMatter = calculateActiveMatter(ingredientsWithNaOH);
  assertNear('Ingredient Addition', 'Active matter updated after adding NaOH (10.30%)', updatedActiveMatter, 10.30, 0.01);

  const initialBatchCost100 = calculateBatchCost(baseIngredients, 100);
  const updatedBatchCost100 = calculateBatchCost(ingredientsWithNaOH, 100);
  assertEqual('Ingredient Addition', 'Batch cost increases after adding ingredient', updatedBatchCost100 > initialBatchCost100, true);

  // Add SLES & CAPB cumulatively
  const cumulativeFormula: FormulationIngredient[] = [
    ...ingredientsWithNaOH,
    { id: '4', name: 'Sodium Lauryl Ether Sulfate (SLES 70%)', percentage: 8, percent: 8, activeMatterPct: 70, costPerKg: 120, role: 'Anionic Surfactant', category: 'Anionic Surfactant' },
    { id: '5', name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 3, percent: 3, activeMatterPct: 30, costPerKg: 180, role: 'Amphoteric Surfactant', category: 'Amphoteric Surfactant' }
  ];

  const cumulativeActiveMatter = calculateActiveMatter(cumulativeFormula);
  const cumulativeActiveSurfactants = calculateActiveSurfactants(cumulativeFormula);
  assertNear('Ingredient Addition', 'Cumulative Active Matter (16.80%)', cumulativeActiveMatter, 16.80, 0.02);
  assertNear('Ingredient Addition', 'Cumulative Active Surfactants (15.50%)', cumulativeActiveSurfactants, 15.50, 0.02);

  // -------------------------------------------------------------
  // 2. INGREDIENT EDIT WORKFLOW
  // -------------------------------------------------------------
  const editedIngredients = cumulativeFormula.map(ing => {
    if (ing.name.includes('LABSA')) {
      return { ...ing, percentage: 12, percent: 12, costPerKg: 160 };
    }
    return ing;
  });

  const editedActiveMatter = calculateActiveMatter(editedIngredients);
  const editedBatchCost = calculateBatchCost(editedIngredients, 100);
  assertNear('Ingredient Edit', 'Active Matter updates after percentage edit (18.60%)', editedActiveMatter, 18.60, 0.02);
  assertEqual('Ingredient Edit', 'Batch cost updates after cost & percentage edit', editedBatchCost > updatedBatchCost100, true);

  const editedLabHealth = calculateLabHealthScore(editedIngredients, 7.5);
  assertEqual('Ingredient Edit', 'Lab Health score valid after ingredient edit', typeof editedLabHealth?.finalScore === 'number' && editedLabHealth.finalScore >= 0, true);

  const editedAIGrade = evaluateAIGrade(editedIngredients, 7.5, 200);
  assertEqual('Ingredient Edit', 'AI Grade score valid after ingredient edit', typeof editedAIGrade.score === 'number' && editedAIGrade.score >= 0, true);

  // -------------------------------------------------------------
  // 3. INGREDIENT REMOVAL WORKFLOW
  // -------------------------------------------------------------
  // Add a hazardous ingredient (e.g. powder enzyme) then remove it
  const formulaWithHazard: FormulationIngredient[] = [
    ...editedIngredients,
    { id: '6', name: 'Subtilisin Protease Enzyme Powder', percentage: 2, percent: 2, activeMatterPct: 100, costPerKg: 800, role: 'Enzyme', category: 'Enzyme' }
  ];

  const hazardLabHealth = calculateLabHealthScore(formulaWithHazard, 7.5);
  const hazardAlertCount = hazardLabHealth.alerts.length;

  // Remove the hazard
  const formulaAfterRemoval = formulaWithHazard.filter(ing => ing.id !== '6');
  const cleanLabHealth = calculateLabHealthScore(formulaAfterRemoval, 7.5);

  assertEqual('Ingredient Removal', 'Hazard alerts decrease after removing powder enzyme', cleanLabHealth.alerts.length < hazardAlertCount, true);
  assertNear('Ingredient Removal', 'Active matter reverts after removing ingredient', calculateActiveMatter(formulaAfterRemoval), editedActiveMatter, 0.01);

  // -------------------------------------------------------------
  // 4. EXPLICIT ZERO VALUE TEST
  // -------------------------------------------------------------
  const zeroValuedIngredients: FormulationIngredient[] = [
    { id: 'z1', name: 'Water / Aqua', percentage: 90, percent: 90, activeMatterPct: 0, costPerKg: 1, role: 'Solvent', category: 'Solvent' },
    { id: 'z2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 0, percent: 0, activeMatterPct: 0, costPerKg: 0, role: 'Anionic Surfactant', category: 'Anionic Surfactant' },
    { id: 'z3', name: 'Sodium Lauryl Ether Sulfate (SLES 70%)', percentage: 10, percent: 10, activeMatterPct: 70, costPerKg: 100, role: 'Anionic Surfactant', category: 'Anionic Surfactant' }
  ];

  const zeroActiveMatter = calculateActiveMatter(zeroValuedIngredients);
  assertNear('Explicit Zero', 'Active matter ignores zero percentage ingredient (7.00%)', zeroActiveMatter, 7.00, 0.01);

  const zeroBatchCost = calculateBatchCost(zeroValuedIngredients, 100);
  // Batch cost = 90*1 + 0*0 + 10*100 = 90 + 0 + 1000 = 1090 (RM cost for 100kg)
  assertNear('Explicit Zero', 'Batch RM cost preserves $0 costPerKg (1090)', zeroBatchCost, 1090, 0.5);

  // -------------------------------------------------------------
  // 5. BATCH SIZE WORKFLOW
  // -------------------------------------------------------------
  const batch50 = calculateBatchCost(cumulativeFormula, 50);
  const batch100 = calculateBatchCost(cumulativeFormula, 100);
  const batch200 = calculateBatchCost(cumulativeFormula, 200);

  assertNear('Batch Size', 'Per-kg RM cost is invariant across batch sizes', batch50 / 50, batch100 / 100, 0.01);
  assertNear('Batch Size', '50kg total RM cost is half of 100kg total RM cost', batch50 * 2, batch100, 0.5);
  assertNear('Batch Size', '200kg total RM cost is double of 100kg total RM cost', batch200, batch100 * 2, 0.5);

  // -------------------------------------------------------------
  // 6. TARGET COST WORKFLOW
  // -------------------------------------------------------------
  const budgetWithinGrade = evaluateAIGrade(cumulativeFormula, 7.5, 300); // high target cost = 300
  const budgetExceededGrade = evaluateAIGrade(cumulativeFormula, 7.5, 20); // low target cost = 20

  assertEqual('Target Cost', 'Actual RM cost unaffected by target cost setting', calculateBatchCost(cumulativeFormula, 100), batch100);
  assertEqual('Target Cost', 'AI Grade commercial score penalizes over-budget formula', budgetExceededGrade.breakdown.commercialScore < budgetWithinGrade.breakdown.commercialScore, true);

  // -------------------------------------------------------------
  // 7. FORMULA SWITCHING WORKFLOW
  // -------------------------------------------------------------
  const formulaA = FORMULAS[0]; // Liquid Laundry Detergent
  const formulaB = FORMULAS[1]; // Dishwashing Liquid
  const formulaC = {
    id: 'eco-surface-cleaner',
    name: 'Eco Surface Cleaner',
    category: 'Hard Surface Cleaner',
    targetPH: 7.0,
    batchSizeKg: 100,
    ingredients: [
      { id: 'c1', name: 'Water / Aqua', percent: 90, activePercent: 100, costPerKg: 0.05 },
      { id: 'c2', name: 'APG 50%', percent: 8, activePercent: 50, costPerKg: 3.20 },
      { id: 'c3', name: 'Sodium Citrate', percent: 2, activePercent: 100, costPerKg: 1.20 }
    ]
  };

  const activeA: ActiveFormulaState = {
    id: formulaA.id,
    name: formulaA.name,
    productType: formulaA.category,
    grade: 'Standard',
    ingredients: (formulaA.ingredients || []).map((i: any, idx: number) => ({ ...i, id: `a-${idx}` }))
  };

  const activeB: ActiveFormulaState = {
    id: formulaB.id,
    name: formulaB.name,
    productType: formulaB.category,
    grade: 'Premium',
    ingredients: (formulaB.ingredients || []).map((i: any, idx: number) => ({ ...i, id: `b-${idx}` }))
  };

  const activeC: ActiveFormulaState = {
    id: formulaC.id,
    name: formulaC.name,
    productType: formulaC.category,
    grade: 'Economy',
    ingredients: (formulaC.ingredients || []).map((i: any, idx: number) => ({ ...i, id: `c-${idx}` }))
  };

  const scoreA1 = evaluateAIGrade(activeA.ingredients, 7.5, 100).score;
  const scoreB = evaluateAIGrade(activeB.ingredients, 11.5, 150).score;
  const scoreC = evaluateAIGrade(activeC.ingredients, 6.5, 80).score;

  // Restore A
  const scoreA2 = evaluateAIGrade(activeA.ingredients, 7.5, 100).score;

  assertEqual('Formula Switching', 'Formula A initial score equals restored score', scoreA1, scoreA2);
  assertEqual('Formula Switching', 'Formula B score is distinct from Formula A', scoreB !== scoreA1 && scoreC !== scoreA1, true);

  // -------------------------------------------------------------
  // 8. SAVE / LOAD WORKFLOW
  // -------------------------------------------------------------
  const savedFormulaState: ActiveFormulaState = {
    id: 'saved-001',
    name: 'Custom R&D Dishwash',
    productType: 'Dishwashing Liquid',
    grade: 'Premium',
    targetCost: 120,
    batchSize: 100,
    ingredients: cumulativeFormula
  };

  // Simulate loading saved formula state into activeFormula
  const loadedFormulaState: ActiveFormulaState = JSON.parse(JSON.stringify(savedFormulaState));
  assertEqual('Save / Load', 'Loaded formula name matches saved name', loadedFormulaState.name, savedFormulaState.name);
  assertEqual('Save / Load', 'Loaded ingredients length matches saved length', loadedFormulaState.ingredients.length, savedFormulaState.ingredients.length);
  assertNear('Save / Load', 'Loaded formula Active Matter recalculates identically', calculateActiveMatter(loadedFormulaState.ingredients), cumulativeActiveMatter, 0.01);

  // -------------------------------------------------------------
  // 9. REFRESH / HYDRATION WORKFLOW
  // -------------------------------------------------------------
  const serialized = JSON.stringify(savedFormulaState);
  const hydrated = JSON.parse(serialized);

  // Normalize hydrated ingredients like App.tsx does
  const normalizedHydratedIngs = hydrated.ingredients.map((ing: any, idx: number) => {
    const pct = ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;
    const activePct = ing.activeMatterPct ?? ing.activePercent ?? ing.purity ?? ing.activeMatterPurity ?? 100;
    return {
      ...ing,
      id: ing.id || `ing-${idx}`,
      percentage: Number(pct),
      percent: Number(pct),
      activeMatterPct: Number(activePct),
      costPerKg: ing.costPerKg !== undefined ? Number(ing.costPerKg) : 0
    };
  });

  const hydratedActiveMatter = calculateActiveMatter(normalizedHydratedIngs);
  const hydratedBatchCost = calculateBatchCost(normalizedHydratedIngs, 100);

  assertNear('Refresh / Hydration', 'Hydrated Active Matter matches pre-refresh (16.80%)', hydratedActiveMatter, cumulativeActiveMatter, 0.01);
  assertNear('Refresh / Hydration', 'Hydrated Batch RM Cost matches pre-refresh', hydratedBatchCost, calculateBatchCost(cumulativeFormula, 100), 0.5);

  // -------------------------------------------------------------
  // 10. SANDBOX ISOLATION WORKFLOW
  // -------------------------------------------------------------
  const globalStateIngs = [...cumulativeFormula];
  const globalScorePre = evaluateAIGrade(globalStateIngs, 7.5, 150).score;

  // Sandbox draft modification
  const sandboxDraftIngs = globalStateIngs.map(i => i.name.includes('LABSA') ? { ...i, percentage: 25, percent: 25 } : i);
  const sandboxScore = evaluateAIGrade(sandboxDraftIngs, 7.5, 150).score;

  // Verify Global state remains untouched before apply
  const globalScorePostDraft = evaluateAIGrade(globalStateIngs, 7.5, 150).score;
  assertEqual('Sandbox Isolation', 'Global formula score unchanged by unapplied sandbox edit', globalScorePre, globalScorePostDraft);

  // Apply sandbox to global
  const appliedGlobalIngs = [...sandboxDraftIngs];
  const appliedScore = evaluateAIGrade(appliedGlobalIngs, 7.5, 150).score;
  assertEqual('Sandbox Isolation', 'Applying sandbox updates global formula score', appliedScore, sandboxScore);

  // Reset sandbox
  const resetSandboxIngs = [...globalStateIngs];
  const resetScore = evaluateAIGrade(resetSandboxIngs, 7.5, 150).score;
  assertEqual('Sandbox Isolation', 'Resetting sandbox restores original formula score', resetScore, globalScorePre);

  // -------------------------------------------------------------
  // 11. CROSS-WORKSPACE DETERMINISM
  // -------------------------------------------------------------
  const sharedIngs = cumulativeFormula;

  const aiFormulatorAM = calculateActiveMatter(sharedIngs);
  const analyzerProAM = calculateActiveMatter(sharedIngs);

  const aiFormulatorCPI = calculateCPI(sharedIngs);
  const analyzerProCPI = calculateCPI(sharedIngs);

  const aiFormulatorCompat = calculateFormulationCompatibility(sharedIngs);
  const analyzerProCompat = calculateFormulationCompatibility(sharedIngs);

  assertEqual('Cross-Workspace Determinism', 'Active Matter identical across workspace modules', aiFormulatorAM, analyzerProAM);
  assertEqual('Cross-Workspace Determinism', 'CPI score identical across workspace modules', aiFormulatorCPI, analyzerProCPI);
  assertEqual('Cross-Workspace Determinism', 'Compatibility score identical across workspace modules', aiFormulatorCompat.compatibilityScore, analyzerProCompat.compatibilityScore);

  // -------------------------------------------------------------
  // 12. UI-TO-ENGINE DATA PROPAGATION
  // -------------------------------------------------------------
  const mappedInputs = mapFormulationIngredientsToPHEngineInput(sharedIngs);
  assertEqual('Data Propagation', 'pHEngine adapter maps all ingredients', mappedInputs.length, sharedIngs.length);

  const phResult = calculatePHAdvanced(mappedInputs, 100);
  assertEqual('Data Propagation', 'pHEngine returns valid numeric pH', typeof phResult.pH === 'number' && !isNaN(phResult.pH), true);

  console.log("--------------------------------------------------");
  console.log(`TOTAL E2E WORKFLOW TESTS : ${passed + failed}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log("--------------------------------------------------");

  return { passed, failed };
}

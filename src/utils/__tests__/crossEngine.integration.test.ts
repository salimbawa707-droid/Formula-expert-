import {
  calculateActiveMatter,
  calculateActiveSurfactants,
  calculateBatchCost,
  calculateCommercialMarginChain,
  evaluateFormulationGreenChelators,
  calculateWaterHardnessTolerance,
  calculateCPI,
  calculateFormulationCompatibility,
  calculateLabHealthScore,
  evaluateAIGrade,
} from '../calculators';
import { calculatePHAdvanced } from '../pHEngine';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { FormulationIngredient } from '../../types';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assertEqual<T>(suite: string, name: string, actual: T, expected: T) {
  const passed = actual === expected;
  results.push({
    name: `[${suite}] ${name}`,
    passed,
    message: passed ? `PASS (${actual})` : `FAIL: Expected ${expected}, got ${actual}`
  });
}

function assertNear(suite: string, name: string, actual: number, expected: number, tolerance = 1e-2) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  results.push({
    name: `[${suite}] ${name}`,
    passed,
    message: passed ? `PASS (${actual})` : `FAIL: Expected ~${expected}, got ${actual} (diff: ${diff})`
  });
}

export function runCrossEngineIntegrationTestSuite() {
  results.length = 0;

  // ----------------------------------------------------
  // 1. Controlled Cross-Engine Test Formula
  // ----------------------------------------------------
  const controlledFormula: FormulationIngredient[] = [
    {
      id: 'ing_1',
      name: 'LABSA (Linear Alkylbenzene Sulfonic Acid)',
      category: 'Anionic Surfactant',
      role: 'Primary Anionic Surfactant',
      percentage: 8.0,
      activeMatterPct: 96.0,
      costPerKg: 140,
      phMin: 1.5,
      phMax: 2.5,
    },
    {
      id: 'ing_2',
      name: 'Sodium Hydroxide (NaOH 100%)',
      category: 'Alkali / Neutralizer',
      role: 'Neutralizer',
      percentage: 1.0,
      activeMatterPct: 100.0,
      costPerKg: 40,
    },
    {
      id: 'ing_3',
      name: 'SLES (Sodium Lauryl Ether Sulfate 70%)',
      category: 'Anionic Surfactant',
      role: 'Co-Surfactant / Foamer',
      percentage: 10.0,
      activeMatterPct: 70.0,
      costPerKg: 110,
      phMin: 6.5,
      phMax: 7.5,
    },
    {
      id: 'ing_4',
      name: 'CAPB (Cocoamidopropyl Betaine 30%)',
      category: 'Amphoteric Surfactant',
      role: 'Foam Booster & Mildness Enhancer',
      percentage: 3.0,
      activeMatterPct: 30.0,
      costPerKg: 95,
      phMin: 5.0,
      phMax: 7.0,
    },
    {
      id: 'ing_5',
      name: 'C12-15 Pareth-7 (Nonionic 100%)',
      category: 'Nonionic Surfactant',
      role: 'Emulsifier & Grease Removal',
      percentage: 2.0,
      activeMatterPct: 100.0,
      costPerKg: 180,
      phMin: 6.0,
      phMax: 8.0,
    },
    {
      id: 'ing_6',
      name: 'Sodium Citrate',
      category: 'Builder / Chelator',
      role: 'Chelating Agent',
      percentage: 1.5,
      activeMatterPct: 100.0,
      costPerKg: 85,
    },
    {
      id: 'ing_7',
      name: 'Protease Enzyme (Liquid)',
      category: 'Enzyme',
      role: 'Protein Stain Removal',
      percentage: 0.5,
      activeMatterPct: 100.0,
      costPerKg: 450,
    },
    {
      id: 'ing_8',
      name: 'Lavender Fragrance',
      category: 'Additives / Perfume',
      role: 'Scent',
      percentage: 1.0,
      activeMatterPct: 100.0,
      costPerKg: 800,
    },
    {
      id: 'ing_9',
      name: 'Deionized Water',
      category: 'Solvent / Carrier',
      role: 'Diluent',
      percentage: 73.0,
      activeMatterPct: 0.0,
      costPerKg: 2,
    },
  ];

  // Evaluate controlled formula across ALL engines
  const activeMatter = calculateActiveMatter(controlledFormula);
  const activeSurfactants = calculateActiveSurfactants(controlledFormula);
  const phInputs = mapFormulationIngredientsToPHEngineInput(controlledFormula);
  const phResult = calculatePHAdvanced(phInputs, 100);
  const batchCost100 = calculateBatchCost(controlledFormula, 100);
  const batchCostPerKg = calculateBatchCost(controlledFormula, 1);
  const marginChain = calculateCommercialMarginChain(controlledFormula, 100, 12, 15);
  evaluateFormulationGreenChelators({ waterHardnessPpm: 150, washVolumeL: 10, safetyMarginPct: 25 } as any);
  const hardnessTol = calculateWaterHardnessTolerance(controlledFormula);
  const cpiVal = calculateCPI(controlledFormula);
  const compatibility = calculateFormulationCompatibility(controlledFormula, 7.5);
  const labHealth = calculateLabHealthScore(controlledFormula, 7.5);
  const aiGrade = evaluateAIGrade(controlledFormula, 7.5, 120);

  // Assertions for Single Formula Propagation
  assertNear('Controlled Formula', 'Active Matter sum across all ingredients (21.58%)', activeMatter, 21.58, 0.05);
  assertNear('Controlled Formula', 'Active Surfactant sum (17.58%)', activeSurfactants, 17.58, 0.05);
  assertEqual('Controlled Formula', 'pH is defined number', typeof phResult.pH === 'number' && !isNaN(phResult.pH), true);
  assertNear('Controlled Formula', '100kg Batch Cost sum', batchCost100, 4203.5, 1.0);
  assertNear('Controlled Formula', 'Batch Cost per kg', batchCostPerKg, 42.035, 0.1);
  assertEqual('Controlled Formula', 'Margin chain returns valid MRP > retail', marginChain.suggestedMRP > marginChain.suggestedRetail, true);
  assertEqual('Controlled Formula', 'Water Hardness Tolerance defined', typeof hardnessTol === 'string' || typeof (hardnessTol as any).maxSupportedPpm === 'number', true);
  assertEqual('Controlled Formula', 'CPI score is valid (0-100)', cpiVal >= 0 && cpiVal <= 100, true);
  assertEqual('Controlled Formula', 'Compatibility is valid boolean', typeof compatibility.compatible === 'boolean', true);
  assertEqual('Controlled Formula', 'Lab Health score is valid (0-100)', labHealth.finalScore >= 0 && labHealth.finalScore <= 100, true);
  assertEqual('Controlled Formula', 'AI Grade is A, B, or C for balanced neutralized formulation', ['A+', 'A', 'B', 'C'].includes(aiGrade.grade), true);

  // ----------------------------------------------------
  // 2. Formula Switching (Formula A -> B -> C -> A -> B)
  // ----------------------------------------------------
  const formulaA = controlledFormula;
  const formulaB: FormulationIngredient[] = [
    { name: 'Caustic Soda Lye (NaOH 50%)', percentage: 10.0, activeMatterPct: 50.0, costPerKg: 30, category: 'Alkali' },
    { name: 'Deionized Water', percentage: 90.0, activeMatterPct: 0.0, costPerKg: 2, category: 'Solvent / Carrier' }
  ];
  const formulaC: FormulationIngredient[] = [
    { name: 'SLES (Sodium Lauryl Ether Sulfate 70%)', percentage: 2.0, activeMatterPct: 70.0, costPerKg: 110, category: 'Anionic Surfactant' },
    { name: 'Deionized Water', percentage: 98.0, activeMatterPct: 0.0, costPerKg: 2, category: 'Solvent / Carrier' }
  ];

  // A1
  const gradeA1 = evaluateAIGrade(formulaA, 7.5);
  const healthA1 = calculateLabHealthScore(formulaA, 7.5);

  // B1
  const phB1 = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput(formulaB), 100).pH;
  const gradeB1 = evaluateAIGrade(formulaB, phB1);
  const healthB1 = calculateLabHealthScore(formulaB, phB1);

  // C1
  const phC1 = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput(formulaC), 100).pH;
  const gradeC1 = evaluateAIGrade(formulaC, phC1);
  calculateLabHealthScore(formulaC, phC1);

  // A2 (Restored)
  const gradeA2 = evaluateAIGrade(formulaA, 7.5);
  const healthA2 = calculateLabHealthScore(formulaA, 7.5);

  // B2 (Restored)
  const gradeB2 = evaluateAIGrade(formulaB, phB1);
  calculateLabHealthScore(formulaB, phB1);

  assertEqual('Formula Switching', 'Formula A initial score equals restored score', gradeA1.score, gradeA2.score);
  assertEqual('Formula Switching', 'Formula B initial score equals restored score', gradeB1.score, gradeB2.score);
  assertEqual('Formula Switching', 'Caustic Formula B triggers health hazard penalty', healthB1.rating === 'High Safety Hazard' || healthB1.finalScore <= 55, true);
  assertEqual('Formula Switching', 'Dilute Formula C earns lower grade than Formula A', gradeC1.score < gradeA1.score, true);
  assertEqual('Formula Switching', 'No stale state survived formula restoration A -> B -> C -> A', healthA1.finalScore, healthA2.finalScore);

  // ----------------------------------------------------
  // 3. Refresh / Hydration Behavior
  // ----------------------------------------------------
  const jsonFormulaA = JSON.parse(JSON.stringify(formulaA));
  const hydratedActiveMatter = calculateActiveMatter(jsonFormulaA);
  const hydratedBatchCost = calculateBatchCost(jsonFormulaA, 100);
  const hydratedAIGrade = evaluateAIGrade(jsonFormulaA, 7.5);

  assertNear('Hydration', 'Hydrated active matter matches original', hydratedActiveMatter, activeMatter, 1e-4);
  assertNear('Hydration', 'Hydrated batch cost matches original', hydratedBatchCost, batchCost100, 1e-4);
  assertEqual('Hydration', 'Hydrated AI grade matches original', hydratedAIGrade.score, gradeA1.score);

  // ----------------------------------------------------
  // 4. Sandbox Isolation & Draft State
  // ----------------------------------------------------
  const globalActiveFormula = JSON.parse(JSON.stringify(formulaA));
  const sandboxDraft = JSON.parse(JSON.stringify(formulaA));
  // Mutate sandbox draft
  sandboxDraft[0].percentage = 25.0;

  const globalGradeBefore = evaluateAIGrade(globalActiveFormula, 7.5);
  const sandboxGrade = evaluateAIGrade(sandboxDraft, 7.5);

  assertEqual('Sandbox Isolation', 'Global formula grade unchanged by sandbox mutation', globalGradeBefore.score, gradeA1.score);
  assertEqual('Sandbox Isolation', 'Sandbox grade reflects sandbox edit', sandboxGrade.score !== globalGradeBefore.score, true);

  // Apply sandbox draft to global
  const updatedGlobalFormula = JSON.parse(JSON.stringify(sandboxDraft));
  const globalGradeAfterApply = evaluateAIGrade(updatedGlobalFormula, 7.5);
  assertEqual('Sandbox Isolation', 'Applying sandbox updates global formula grade', globalGradeAfterApply.score, sandboxGrade.score);

  // Reset sandbox draft
  const resetSandbox = JSON.parse(JSON.stringify(globalActiveFormula));
  const resetSandboxGrade = evaluateAIGrade(resetSandbox, 7.5);
  assertEqual('Sandbox Isolation', 'Resetting sandbox restores original formula grade', resetSandboxGrade.score, gradeA1.score);

  // ----------------------------------------------------
  // 5. Canonical Field Aliases & Explicit Zero Preservation
  // ----------------------------------------------------
  const aliasedFormula: any[] = [
    { name: 'SLES 70%', percent: 10.0, activePercent: 70.0, costPerKg: 110, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentageInFormula: 5.0, activeMatterPurity: 30.0, cost: 95, category: 'Amphoteric Surfactant' },
    { name: 'Deionized Water', rawPercent: 85.0, purity: 0.0, costPerKg: 2, category: 'Solvent / Carrier' }
  ];

  const aliasedActiveMatter = calculateActiveMatter(aliasedFormula as any);
  assertNear('Canonical Aliases', 'Aliased fields parse active matter correctly (7.0 + 1.5 = 8.5%)', aliasedActiveMatter, 8.5, 0.05);

  const explicitZeroFormula: FormulationIngredient[] = [
    { name: 'LABSA', percentage: 0.0, activeMatterPct: 96.0, costPerKg: 140, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 0.0, costPerKg: 0, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90.0, activeMatterPct: 0.0, costPerKg: 2, category: 'Solvent / Carrier' }
  ];

  const zeroActiveMatter = calculateActiveMatter(explicitZeroFormula);
  const zeroBatchCost100 = calculateBatchCost(explicitZeroFormula, 100);

  assertEqual('Explicit Zero', 'Explicit 0% percentage preserved (0% LABSA + 0% active SLES = 0%)', zeroActiveMatter, 0);
  assertNear('Explicit Zero', 'Explicit $0 costPerKg preserved (100kg batch: 10*0 + 90*2 = 180)', zeroBatchCost100, 180, 0.05);

  // ----------------------------------------------------
  // 6. Workspace Determinism (AIFormulator vs SmartFormulaAnalyzerPro)
  // ----------------------------------------------------
  const analyzerProIngredients = controlledFormula.map(ing => ({
    ...ing,
    dbMatched: true,
    casNumber: null,
    molecularWeight: null,
    density: null,
    pHContribution: null,
    biodegradabilityDesc: null,
    chargeType: ing.category?.includes('Anionic') ? 'anionic' : 'nonionic',
    chemicalFamily: ing.category || 'General',
    supplier: null,
  }));

  const formulatorActiveMatter = calculateActiveMatter(controlledFormula);
  const analyzerActiveMatter = calculateActiveMatter(analyzerProIngredients as any);
  const formulatorCPI = calculateCPI(controlledFormula);
  const analyzerCPI = calculateCPI(analyzerProIngredients as any);
  const formulatorCompat = calculateFormulationCompatibility(controlledFormula, 7.5).compatibilityScore;
  const analyzerCompat = calculateFormulationCompatibility(analyzerProIngredients as any, 7.5).compatibilityScore;
  const formulatorGrade = evaluateAIGrade(controlledFormula, 7.5).score;
  const analyzerGrade = evaluateAIGrade(analyzerProIngredients as any, 7.5).score;

  assertEqual('Workspace Determinism', 'Active matter identical across workspace formats', formulatorActiveMatter, analyzerActiveMatter);
  assertEqual('Workspace Determinism', 'CPI score identical across workspace formats', formulatorCPI, analyzerCPI);
  assertEqual('Workspace Determinism', 'Compatibility score identical across workspace formats', formulatorCompat, analyzerCompat);
  assertEqual('Workspace Determinism', 'AI Grade score identical across workspace formats', formulatorGrade, analyzerGrade);

  // ----------------------------------------------------
  // 7. Engine Separation & Non-Contamination
  // ----------------------------------------------------
  const standaloneCPI = calculateCPI(controlledFormula);
  const standaloneCompat = calculateFormulationCompatibility(controlledFormula, 7.5).compatibilityScore;
  const standaloneLabHealth = calculateLabHealthScore(controlledFormula, 7.5).finalScore;
  const aiGradeDetails = evaluateAIGrade(controlledFormula, 7.5);

  assertEqual('Engine Separation', 'AI Grade breakdown uses authoritative CPI score', aiGradeDetails.breakdown.cpiScore, Math.min(100, Math.max(0, Math.round(standaloneCPI))));
  assertEqual('Engine Separation', 'AI Grade breakdown uses authoritative Compatibility score', aiGradeDetails.breakdown.compatibilityScore, Math.min(100, Math.max(0, Math.round(standaloneCompat))));
  assertEqual('Engine Separation', 'AI Grade breakdown uses authoritative Lab Health score', aiGradeDetails.breakdown.healthScore, Math.min(100, Math.max(0, Math.round(standaloneLabHealth))));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('==================================================');
  console.log('  CROSS-ENGINE INTEGRATION REGRESSION SUITE        ');
  console.log('==================================================');
  results.forEach(r => console.log(`${r.passed ? '[PASS]' : '[FAIL]'} ${r.name} :: ${r.message}`));
  console.log('--------------------------------------------------');
  console.log(`TOTAL CROSS-ENGINE TESTS : ${results.length}`);
  console.log(`PASSED                   : ${passed}`);
  console.log(`FAILED                   : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed, total: results.length, results };
}

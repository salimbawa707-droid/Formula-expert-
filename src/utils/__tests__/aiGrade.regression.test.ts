import { evaluateAIGrade, calculateAIGrade } from '../calculators';

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

export function runAIGradeTestSuite() {
  results.length = 0;

  // 1. Empty & Zero Ingredient Formulas
  const resEmptyArr = evaluateAIGrade([]);
  assertEqual('Empty Formula', 'Empty array produces Grade F', resEmptyArr.grade, 'F');
  assertEqual('Empty Formula', 'Empty array produces Score 0', resEmptyArr.score, 0);

  const resNull = evaluateAIGrade(null as any);
  assertEqual('Null Formula', 'Null input produces Grade F', resNull.grade, 'F');
  assertEqual('Null Formula', 'Null input produces Score 0', resNull.score, 0);

  const resZeroActive = evaluateAIGrade([
    { id: 'water', name: 'Deionized Water', percentage: 100, activePct: 0, category: 'Solvent' } as any
  ]);
  assertEqual('Zero Active', 'Water-only formula produces Grade F', resZeroActive.grade, 'F');
  assertEqual('Zero Active', 'Water-only formula produces Score 0', resZeroActive.score, 0);

  // 2. High-Quality Balanced Premium Formula
  const premiumFormula = [
    { id: 'sles', name: 'Sodium Lauryl Ether Sulfate (SLES 70%)', percentage: 12, activePct: 70, category: 'Anionic Surfactant', rawMaterialCostPerKg: 120 },
    { id: 'capb', name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 4, activePct: 30, category: 'Amphoteric Surfactant', rawMaterialCostPerKg: 150 },
    { id: 'apg', name: 'Coco Glucoside (APG 50%)', percentage: 2, activePct: 50, category: 'Non-ionic Surfactant', rawMaterialCostPerKg: 200 },
    { id: 'citrate', name: 'Trisodium Citrate Dihydrate', percentage: 3, activePct: 100, category: 'Builder / Chelator', rawMaterialCostPerKg: 90 },
    { id: 'water', name: 'Water', percentage: 79, activePct: 0, category: 'Solvent', rawMaterialCostPerKg: 0 }
  ];

  const resPremium = evaluateAIGrade(premiumFormula, 7.5);
  assertEqual('Premium Formula', 'Balanced formula earns A or A+ grade', resPremium.grade === 'A+' || resPremium.grade === 'A', true);
  assertEqual('Premium Formula', 'Balanced formula score >= 80', resPremium.score >= 80, true);

  // 3. Low Active Matter Dilute Formula
  const diluteFormula = [
    { id: 'sles', name: 'SLES 70%', percentage: 1, activePct: 70, category: 'Anionic Surfactant' },
    { id: 'water', name: 'Water', percentage: 99, activePct: 0, category: 'Solvent' }
  ];

  const resDilute = evaluateAIGrade(diluteFormula, 7.0);
  assertEqual('Dilute Formula', 'Low active formula score < 60', resDilute.score < 60, true);
  assertEqual('Dilute Formula', 'Low active formula grade is D or F', resDilute.grade === 'D' || resDilute.grade === 'F', true);

  // 4. Surfactant Compatibility Hazard Override (Anionic + Cationic)
  const hazardFormula = [
    { id: 'sles', name: 'Sodium Lauryl Ether Sulfate', percentage: 10, activePct: 70, category: 'Anionic Surfactant' },
    { id: 'ctac', name: 'Cetrimonium Chloride (CTAC)', percentage: 5, activePct: 29, category: 'Cationic Surfactant' },
    { id: 'water', name: 'Water', percentage: 85, activePct: 0, category: 'Solvent' }
  ];

  const resHazard = evaluateAIGrade(hazardFormula, 7.0);
  assertEqual('Compatibility Hazard', 'Hazardous formula score <= 50', resHazard.score <= 50, true);
  assertEqual('Compatibility Hazard', 'Hazardous formula grade is D or F', resHazard.grade === 'D' || resHazard.grade === 'F', true);

  // 5. Extreme Safety Hazard Override (High Caustic Soda)
  const causticFormula = [
    { id: 'caustic', name: 'Sodium Hydroxide 50% (Caustic Soda)', percentage: 15, activePct: 50, category: 'Alkali / pH Adjuster' },
    { id: 'sles', name: 'SLES 70%', percentage: 10, activePct: 70, category: 'Anionic Surfactant' },
    { id: 'water', name: 'Water', percentage: 75, activePct: 0, category: 'Solvent' }
  ];

  const resCaustic = evaluateAIGrade(causticFormula, 13.5);
  assertEqual('Health Hazard', 'Extreme pH caustic formula score <= 45', resCaustic.score <= 45, true);
  assertEqual('Health Hazard', 'Extreme pH caustic formula grade is F', resCaustic.grade, 'F');

  // 6. Cost Overrun Penalty
  const expensiveFormula = [
    { id: 'apg', name: 'Glucoside Special', percentage: 20, activePct: 50, category: 'Non-ionic Surfactant', rawMaterialCostPerKg: 500 },
    { id: 'water', name: 'Water', percentage: 80, activePct: 0, category: 'Solvent', rawMaterialCostPerKg: 0 }
  ];

  const resCostPass = evaluateAIGrade(expensiveFormula, 7.0, 150); // Target cost ₹150, batch cost ₹100
  const resCostFail = evaluateAIGrade(expensiveFormula, 7.0, 50);  // Target cost ₹50, batch cost ₹100

  assertEqual('Cost Target', 'Within budget commercial score is 100', resCostPass.breakdown.commercialScore, 100);
  assertEqual('Cost Target', 'Over budget commercial score < 100', resCostFail.breakdown.commercialScore < 100, true);
  assertEqual('Cost Target', 'Over budget overall score lower than within budget', resCostFail.score < resCostPass.score, true);

  // 7. SSOT Reactivity & Formula Switching
  const switchResA1 = evaluateAIGrade(premiumFormula, 7.5);
  evaluateAIGrade(hazardFormula, 7.0);
  const switchResA2 = evaluateAIGrade(premiumFormula, 7.5);

  assertEqual('SSOT Reactivity', 'Formula A initial score equals restored score', switchResA1.score, switchResA2.score);
  assertEqual('SSOT Reactivity', 'Formula A initial grade equals restored grade', switchResA1.grade, switchResA2.grade);

  // 8. Cross-Workspace Determinism (Array vs Object Input)
  const objInput = {
    ingredients: premiumFormula,
    ph: 7.5,
    targetCost: 150
  };

  const resArray = evaluateAIGrade(premiumFormula, 7.5, 150);
  const resObject = evaluateAIGrade(objInput);

  assertEqual('Cross-Workspace', 'Array and Object inputs produce identical score', resArray.score, resObject.score);
  assertEqual('Cross-Workspace', 'Array and Object inputs produce identical grade', resArray.grade, resObject.grade);

  // 9. Alias Function Compatibility
  const aliasRes = calculateAIGrade(premiumFormula, 7.5);
  assertEqual('Alias Compatibility', 'calculateAIGrade alias equals evaluateAIGrade', aliasRes.score, resPremium.score);

  // 10. Ingredient Array Immutability
  const originalLength = premiumFormula.length;
  evaluateAIGrade(premiumFormula);
  assertEqual('Immutability', 'Input ingredients array is not mutated', premiumFormula.length, originalLength);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log("==================================================");
  console.log("  AI GRADE ENGINE REGRESSION SUITE                ");
  console.log("==================================================");
  results.forEach(r => console.log(`${r.passed ? '[PASS]' : '[FAIL]'} ${r.name} :: ${r.message}`));
  console.log("--------------------------------------------------");
  console.log(`TOTAL AI GRADE TESTS : ${results.length}`);
  console.log(`PASSED               : ${passed}`);
  console.log(`FAILED               : ${failed}`);
  console.log("--------------------------------------------------");

  return { passed, failed, total: results.length, results };
}

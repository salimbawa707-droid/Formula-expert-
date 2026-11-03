import { evaluateExpertReasoning } from '../expertReasoningEngine';
import { FormulationIngredient } from '../../types';

export function runCategoryExpertReasoningTestSuite(): { total: number; passed: number; failed: number } {
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}${detail ? ` :: PASS (${detail})` : ''}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` :: FAIL (${detail})` : ''}`);
    }
  }

  console.log('====================================================');
  console.log('  PHASE 1.0 MULTI-CATEGORY EXPERT REASONING SUITE   ');
  console.log('====================================================');

  // Sample ingredients
  const anionicSLES: FormulationIngredient = {
    id: 'sles-1',
    name: 'SLES 70% (Sodium Laureth Sulfate)',
    category: 'Anionic Surfactant',
    percent: 10,
    activePercent: 70,
    costPerKg: 1.8,
  };

  const cationicEsterquat: FormulationIngredient = {
    id: 'quat-1',
    name: 'Esterquat 90% (Triethanolamine Esterquat)',
    category: 'Cationic Surfactant',
    percent: 5,
    activePercent: 90,
    costPerKg: 3.2,
  };

  // Test 1: Fabric Softener - Anionic + Cationic Conflict & Missing Cationic
  const softenerResult = evaluateExpertReasoning({
    ingredients: [anionicSLES],
    productCategory: 'Fabric Softener',
    calculatedPH: 3.5,
  });

  assert(softenerResult.issues.some((i) => i.id === 'softener-missing-cationic'), 'Test 1: Softener flags missing cationic active agent');

  const softenerValid = evaluateExpertReasoning({
    ingredients: [cationicEsterquat],
    productCategory: 'Fabric Softener',
    calculatedPH: 3.5,
  });
  assert(softenerValid.sanityCheckPassed === true, 'Test 1: Valid cationic softener passes sanity check');

  // Test 2: Auto Dishwash - High Suds Anionic Hazard
  const autoDishResult = evaluateExpertReasoning({
    ingredients: [anionicSLES],
    productCategory: 'Auto / Machine Dishwash',
    calculatedPH: 10.0,
  });
  assert(autoDishResult.issues.some((i) => i.id === 'autodish-suds-overflow'), 'Test 2: Auto dishwash flags high anionic sudsing hazard');

  // Test 3: Glass Cleaner - High Active Streaking Hazard
  const glassCleanerResult = evaluateExpertReasoning({
    ingredients: [{ ...anionicSLES, percent: 15 }], // 10.5% active matter
    productCategory: 'Glass / Window Cleaner',
    calculatedPH: 9.5,
  });
  assert(glassCleanerResult.issues.some((i) => i.id === 'glass-haze-streaking'), 'Test 3: Glass cleaner flags >3.0% active matter streaking hazard');

  // Test 4: Hand Wash Liquid Soap - pH Skin Mantle Check
  const handWashResult = evaluateExpertReasoning({
    ingredients: [anionicSLES],
    productCategory: 'Hand Wash Liquid Soap',
    calculatedPH: 8.8, // Too high for skin mantle
  });
  assert(handWashResult.issues.some((i) => i.id === 'handwash-skin-irritation'), 'Test 4: Hand wash flags pH 8.8 skin mantle irritation hazard');

  // Test 5: Car Shampoo - Neutral pH Wax Safety
  const carShampooResult = evaluateExpertReasoning({
    ingredients: [anionicSLES],
    productCategory: 'Car Wash / Car Shampoo',
    calculatedPH: 9.2, // Too alkaline for wax
  });
  assert(carShampooResult.issues.some((i) => i.id === 'carwash-wax-strip'), 'Test 5: Car shampoo flags alkaline wax stripping risk');

  console.log('----------------------------------------------------');
  console.log(`TOTAL CATEGORY REASONING TESTS : ${totalTests}`);
  console.log(`PASSED                         : ${passedTests}`);
  console.log(`FAILED                         : ${totalTests - passedTests}`);
  console.log('----------------------------------------------------');

  return { total: totalTests, passed: passedTests, failed: totalTests - passedTests };
}

if (process.argv[1]?.includes('categoryExpertReasoning.regression.test')) {
  const summary = runCategoryExpertReasoningTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

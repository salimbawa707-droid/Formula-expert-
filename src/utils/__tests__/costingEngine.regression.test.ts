import { calculateFormulaCost } from '../costingEngine';
import { calculateBatchCost } from '../calculators';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  difference: string;
  message: string;
}

const results: TestResult[] = [];

function assertEqual(group: string, name: string, actual: any, expected: any) {
  const passed = actual === expected;
  results.push({
    group,
    name,
    passed,
    actual,
    expected,
    difference: passed ? '0' : `Expected ${expected}, got ${actual}`,
    message: passed ? `PASS (${actual})` : `FAIL (actual: ${actual}, expected: ${expected})`
  });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${group}] ${name} :: ${passed ? 'PASS' : 'FAIL'} (${actual})`);
}

function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  results.push({
    group,
    name,
    passed,
    actual,
    expected,
    difference: diff.toFixed(4),
    message: passed ? `PASS (${actual})` : `FAIL (actual: ${actual}, expected: ${expected}, diff: ${diff.toFixed(4)})`
  });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${group}] ${name} :: ${passed ? 'PASS' : 'FAIL'} (actual: ${actual}, expected: ${expected})`);
}

export function runCostingEngineTestSuite() {
  results.length = 0;

  // =========================================================================
  // TEST 1 — EMPTY PRICE BEHAVIOR (NO AUTO-INJECTED PRICES)
  // =========================================================================
  const unpricedFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 10, costPerKg: 0 },
    { id: '2', name: 'SLES 70%', percentage: 10 },
    { id: '3', name: 'Water', percentage: 80, costPerKg: 0 }
  ];
  const report1 = calculateFormulaCost(unpricedFormula, 100);
  assertNear('Test 1: Empty Price', 'Total Batch Cost is 0.00 when unpriced', report1.totalBatchCost, 0.00);
  assertNear('Test 1: Empty Price', 'Cost per kg is 0.00 when unpriced', report1.costPerKg, 0.00);
  assertEqual('Test 1: Empty Price', 'Status is PRICE INPUT REQUIRED', report1.status, 'PRICE INPUT REQUIRED');
  assertEqual('Test 1: Empty Price', 'calculateBatchCost fallback is 0', calculateBatchCost(unpricedFormula, 100), 0);

  // =========================================================================
  // TEST 2 — SINGLE INGREDIENT PRICE ENTRY
  // =========================================================================
  const singlePricedFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },
    { id: '2', name: 'Water', percentage: 90, costPerKg: 0 }
  ];
  const report2 = calculateFormulaCost(singlePricedFormula, 100);
  // 10 kg @ 140 = 1400. Finished formula cost/kg = 14.00
  assertNear('Test 2: Single Ingredient Price', '10 kg LABSA @ 140 = 1400 batch cost', report2.totalBatchCost, 1400.00);
  assertNear('Test 2: Single Ingredient Price', 'Finished formula cost/kg is 14.00', report2.costPerKg, 14.00);

  // =========================================================================
  // TEST 3 — MULTIPLE INGREDIENT PRICING
  // =========================================================================
  const multiPricedFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },  // 10 kg * 140 = 1400
    { id: '2', name: 'SLES 70%', percentage: 10, costPerKg: 110 },   // 10 kg * 110 = 1100
    { id: '3', name: 'CAPB 30%', percentage: 5, costPerKg: 90 },     // 5 kg * 90 = 450
    { id: '4', name: 'Water', percentage: 75, costPerKg: 1 }         // 75 kg * 1 = 75
  ];
  const report3 = calculateFormulaCost(multiPricedFormula, 100);
  // Total = 1400 + 1100 + 450 + 75 = 3025.00. Cost/kg = 30.25
  assertNear('Test 3: Multi-Ingredient Pricing', 'Batch cost matches sum of components (3025.00)', report3.totalBatchCost, 3025.00);
  assertNear('Test 3: Multi-Ingredient Pricing', 'Cost per kg matches total/100 (30.25)', report3.costPerKg, 30.25);
  assertEqual('Test 3: Multi-Ingredient Pricing', 'Status is COMPLETE', report3.status, 'COMPLETE');

  // =========================================================================
  // TEST 4 — BATCH SIZE SCALING (UNIT COST INVARIANCE)
  // =========================================================================
  const report4_100 = calculateFormulaCost(multiPricedFormula, 100);
  const report4_1000 = calculateFormulaCost(multiPricedFormula, 1000);
  const report4_50 = calculateFormulaCost(multiPricedFormula, 50);

  assertNear('Test 4: Batch Scaling', '100 kg batch cost is 3025.00', report4_100.totalBatchCost, 3025.00);
  assertNear('Test 4: Batch Scaling', '1000 kg batch cost is 30250.00', report4_1000.totalBatchCost, 30250.00);
  assertNear('Test 4: Batch Scaling', '50 kg batch cost is 1512.50', report4_50.totalBatchCost, 1512.50);
  assertNear('Test 4: Batch Scaling', 'Cost/kg at 1000 kg remains 30.25', report4_1000.costPerKg, 30.25);
  assertNear('Test 4: Batch Scaling', 'Cost/kg at 50 kg remains 30.25', report4_50.costPerKg, 30.25);

  // =========================================================================
  // TEST 5 — INGREDIENT DOSAGE CHANGE
  // =========================================================================
  const updatedDosageFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 15, costPerKg: 140 },  // 15 kg * 140 = 2100
    { id: '2', name: 'SLES 70%', percentage: 10, costPerKg: 110 },   // 10 kg * 110 = 1100
    { id: '3', name: 'CAPB 30%', percentage: 5, costPerKg: 90 },     // 5 kg * 90 = 450
    { id: '4', name: 'Water', percentage: 70, costPerKg: 1 }         // 70 kg * 1 = 70
  ];
  const report5 = calculateFormulaCost(updatedDosageFormula, 100);
  // Total = 2100 + 1100 + 450 + 70 = 3720.00. Cost/kg = 37.20
  assertNear('Test 5: Dosage Change', 'Recalculates updated LABSA batch cost to 3720.00', report5.totalBatchCost, 3720.00);
  assertNear('Test 5: Dosage Change', 'Recalculates updated Cost/kg to 37.20', report5.costPerKg, 37.20);

  // =========================================================================
  // TEST 6 — SAME-CAS COMMERCIAL GRADE INDEPENDENCE
  // =========================================================================
  const sles70Formula: FormulationIngredient[] = [
    { id: 'sles70', name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 10, costPerKg: 110 }
  ];
  const sles28Formula: FormulationIngredient[] = [
    { id: 'sles28', name: 'Sodium Laureth Sulfate (SLES 28%)', percentage: 25, costPerKg: 45 }
  ];
  const reportSles70 = calculateFormulaCost(sles70Formula, 100);
  const reportSles28 = calculateFormulaCost(sles28Formula, 100);
  assertNear('Test 6: Commercial Grades', 'SLES 70% @ 110/kg costs 1100 for 10 kg', reportSles70.totalBatchCost, 1100.00);
  assertNear('Test 6: Commercial Grades', 'SLES 28% @ 45/kg costs 1125 for 25 kg', reportSles28.totalBatchCost, 1125.00);
  assertEqual('Test 6: Commercial Grades', 'SLES 70% costPerKg isolated from SLES 28%', reportSles70.ingredientCosts[0].costPerKg, 110);
  assertEqual('Test 6: Commercial Grades', 'SLES 28% costPerKg isolated from SLES 70%', reportSles28.ingredientCosts[0].costPerKg, 45);

  // =========================================================================
  // TEST 7 — ZERO PRICE / EXPLICIT FREE RAW MATERIAL
  // =========================================================================
  const freeWaterFormula: FormulationIngredient[] = [
    { id: '1', name: 'Demineralized Water', percentage: 80, costPerKg: 0 },
    { id: '2', name: 'Surfactant Active', percentage: 20, costPerKg: 100 }
  ];
  const report7 = calculateFormulaCost(freeWaterFormula, 100);
  assertNear('Test 7: Zero Price', 'Water contribution is exactly 0.00', report7.ingredientCosts[0].totalCost, 0.00);
  assertNear('Test 7: Zero Price', 'Total batch cost is 2000.00', report7.totalBatchCost, 2000.00);
  assertNear('Test 7: Zero Price', 'Cost per kg is 20.00', report7.costPerKg, 20.00);

  // =========================================================================
  // TEST 8 — MISSING PRICE DETECTION
  // =========================================================================
  const partiallyPricedFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },
    { id: '2', name: 'SLES 70%', percentage: 10, costPerKg: 110 },
    { id: '3', name: 'CAPB 30%', percentage: 5, costPerKg: null }, // Unpriced
    { id: '4', name: 'Water', percentage: 75, costPerKg: 1 }
  ];
  const report8 = calculateFormulaCost(partiallyPricedFormula, 100);
  assertEqual('Test 8: Missing Price', 'Missing price count is 1', report8.missingPriceCount, 1);
  assertEqual('Test 8: Missing Price', 'Complete price count is 3', report8.completePriceCount, 3);
  assertEqual('Test 8: Missing Price', 'Status is PRICE INPUT REQUIRED', report8.status, 'PRICE INPUT REQUIRED');
  assertEqual('Test 8: Missing Price', 'isComplete is false', report8.isComplete, false);

  // =========================================================================
  // TEST 9 — ALL PRICES CONFIGURED
  // =========================================================================
  const fullyPricedFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },
    { id: '2', name: 'SLES 70%', percentage: 10, costPerKg: 110 },
    { id: '3', name: 'CAPB 30%', percentage: 5, costPerKg: 95 },
    { id: '4', name: 'Water', percentage: 75, costPerKg: 1 }
  ];
  const report9 = calculateFormulaCost(fullyPricedFormula, 100);
  assertEqual('Test 9: All Priced', 'Missing price count is 0', report9.missingPriceCount, 0);
  assertEqual('Test 9: All Priced', 'Status is COMPLETE', report9.status, 'COMPLETE');
  assertEqual('Test 9: All Priced', 'isComplete is true', report9.isComplete, true);

  // =========================================================================
  // TEST 10 — INGREDIENT ADD / DELETE RECALCULATION
  // =========================================================================
  // Starting with 2 ingredients
  const initialList: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },
    { id: '2', name: 'SLES 70%', percentage: 10, costPerKg: 110 }
  ];
  const initialCost = calculateFormulaCost(initialList, 100).totalBatchCost; // 1400 + 1100 = 2500

  // Add a 3rd ingredient (CAPB @ 90)
  const afterAddList: FormulationIngredient[] = [
    ...initialList,
    { id: '3', name: 'CAPB 30%', percentage: 5, costPerKg: 90 }
  ];
  const afterAddCost = calculateFormulaCost(afterAddList, 100).totalBatchCost; // 2500 + 450 = 2950

  // Delete the 1st ingredient (LABSA)
  const afterDeleteList: FormulationIngredient[] = afterAddList.filter(i => i.id !== '1');
  const afterDeleteCost = calculateFormulaCost(afterDeleteList, 100).totalBatchCost; // 1100 + 450 = 1550

  assertNear('Test 10: Add/Delete', 'Initial cost is 2500.00', initialCost, 2500.00);
  assertNear('Test 10: Add/Delete', 'Cost after adding CAPB is 2950.00', afterAddCost, 2950.00);
  assertNear('Test 10: Add/Delete', 'Cost after deleting LABSA is 1550.00', afterDeleteCost, 1550.00);

  // =========================================================================
  // TEST 11 — PHASE 1: UNKNOWN INGREDIENT PRICE REMAINS NULL (NEVER ₹0)
  // =========================================================================
  const unknownPriceFormula: FormulationIngredient[] = [
    { id: 'u1', name: 'Specialty Polymer', percentage: 5, costPerKg: null },
    { id: 'u2', name: 'Bio-Enzyme Blend', percentage: 2, costPerKg: undefined },
    { id: 'u3', name: 'Botanical Extract', percentage: 1, costPerKg: '' as any },
    { id: 'u4', name: 'Fragrance Premium', percentage: 2, costPerKg: NaN }
  ];
  const report11 = calculateFormulaCost(unknownPriceFormula, 100);
  assertEqual('Test 11: Unknown Price Null', 'u1 costPerKg remains null', report11.ingredientCosts[0].userPrice, null);
  assertEqual('Test 11: Unknown Price Null', 'u1 hasUserPrice is false', report11.ingredientCosts[0].hasUserPrice, false);
  assertEqual('Test 11: Unknown Price Null', 'u1 status is MISSING_PRICE', report11.ingredientCosts[0].pricingStatus, 'MISSING_PRICE');
  assertEqual('Test 11: Unknown Price Null', 'u2 costPerKg remains null', report11.ingredientCosts[1].userPrice, null);
  assertEqual('Test 11: Unknown Price Null', 'u3 costPerKg remains null', report11.ingredientCosts[2].userPrice, null);
  assertEqual('Test 11: Unknown Price Null', 'u4 costPerKg remains null', report11.ingredientCosts[3].userPrice, null);
  assertEqual('Test 11: Unknown Price Null', 'All 4 unknown ingredients recognized as missing', report11.missingPriceCount, 4);
  assertEqual('Test 11: Unknown Price Null', 'Formula pricing status is NO_PRICING', report11.pricingStatus, 'NO_PRICING');
  assertEqual('Test 11: Unknown Price Null', 'costLabel is COST UNAVAILABLE', report11.costLabel, 'COST UNAVAILABLE');

  // =========================================================================
  // TEST 12 — PHASE 1: COMPLETE VS PARTIAL VS NO-PRICING CATEGORIZATION
  // =========================================================================
  // Case A: All missing prices
  const allMissingFormula: FormulationIngredient[] = [
    { id: 'a1', name: 'LABSA 90%', percentage: 12, costPerKg: null },
    { id: 'a2', name: 'SLES 70%', percentage: 10, costPerKg: null },
    { id: 'a3', name: 'Water', percentage: 78, costPerKg: null }
  ];
  const report12A = calculateFormulaCost(allMissingFormula, 100);
  assertEqual('Test 12A: No Pricing', 'pricingStatus is NO_PRICING', report12A.pricingStatus, 'NO_PRICING');
  assertEqual('Test 12A: No Pricing', 'costLabel is COST UNAVAILABLE', report12A.costLabel, 'COST UNAVAILABLE');
  assertEqual('Test 12A: No Pricing', 'isComplete is false', report12A.isComplete, false);
  assertEqual('Test 12A: No Pricing', 'missingPriceCount is 3', report12A.missingPriceCount, 3);

  // Case B: Partial pricing (2 priced, 1 unpriced)
  const partialFormula: FormulationIngredient[] = [
    { id: 'b1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },
    { id: 'b2', name: 'SLES 70%', percentage: 10, costPerKg: 110 },
    { id: 'b3', name: 'Water', percentage: 80, costPerKg: null }
  ];
  const report12B = calculateFormulaCost(partialFormula, 100);
  assertEqual('Test 12B: Partial Pricing', 'pricingStatus is PARTIAL_PRICING', report12B.pricingStatus, 'PARTIAL_PRICING');
  assertEqual('Test 12B: Partial Pricing', 'costLabel is PARTIAL COST', report12B.costLabel, 'PARTIAL COST — EXCLUDES UNPRICED INGREDIENTS');
  assertEqual('Test 12B: Partial Pricing', 'isComplete is false', report12B.isComplete, false);
  assertEqual('Test 12B: Partial Pricing', 'completePriceCount is 2', report12B.completePriceCount, 2);
  assertEqual('Test 12B: Partial Pricing', 'missingPriceCount is 1', report12B.missingPriceCount, 1);
  assertNear('Test 12B: Partial Pricing', 'Partial batch cost sums priced items (2500.00)', report12B.totalBatchCost, 2500.00);

  // Case C: Complete pricing (all 3 priced)
  const completeFormula: FormulationIngredient[] = [
    { id: 'c1', name: 'LABSA 90%', percentage: 10, costPerKg: 140 },
    { id: 'c2', name: 'SLES 70%', percentage: 10, costPerKg: 110 },
    { id: 'c3', name: 'Water', percentage: 80, costPerKg: 1 }
  ];
  const report12C = calculateFormulaCost(completeFormula, 100);
  assertEqual('Test 12C: Complete Pricing', 'pricingStatus is COMPLETE_PRICING', report12C.pricingStatus, 'COMPLETE_PRICING');
  assertEqual('Test 12C: Complete Pricing', 'costLabel is TOTAL COST', report12C.costLabel, 'TOTAL COST');
  assertEqual('Test 12C: Complete Pricing', 'isComplete is true', report12C.isComplete, true);
  assertEqual('Test 12C: Complete Pricing', 'missingPriceCount is 0', report12C.missingPriceCount, 0);
  assertNear('Test 12C: Complete Pricing', 'Total batch cost matches sum (2580.00)', report12C.totalBatchCost, 2580.00);

  // =========================================================================
  // TEST 13 — PHASE 1: GENUINELY USER-ENTERED ₹0 DISTINGUISHED FROM MISSING
  // =========================================================================
  const intentionalZeroFormula: FormulationIngredient[] = [
    { id: 'z1', name: 'Free Recovered Process Water', percentage: 80, costPerKg: 0 },
    { id: 'z2', name: 'LABSA 90%', percentage: 20, costPerKg: 140 }
  ];
  const report13 = calculateFormulaCost(intentionalZeroFormula, 100);
  assertEqual('Test 13: Explicit Zero', 'Water hasUserPrice is true', report13.ingredientCosts[0].hasUserPrice, true);
  assertEqual('Test 13: Explicit Zero', 'Water userPrice is 0', report13.ingredientCosts[0].userPrice, 0);
  assertEqual('Test 13: Explicit Zero', 'Water pricingStatus is EXPLICIT_USER_PRICE', report13.ingredientCosts[0].pricingStatus, 'EXPLICIT_USER_PRICE');
  assertEqual('Test 13: Explicit Zero', 'Missing price count is 0', report13.missingPriceCount, 0);
  assertEqual('Test 13: Explicit Zero', 'pricingStatus is COMPLETE_PRICING', report13.pricingStatus, 'COMPLETE_PRICING');
  assertEqual('Test 13: Explicit Zero', 'isComplete is true', report13.isComplete, true);
  assertNear('Test 13: Explicit Zero', 'Batch cost reflects 20 kg @ 140 + 80 kg @ 0 = 2800.00', report13.totalBatchCost, 2800.00);
  assertNear('Test 13: Explicit Zero', 'Cost per kg is 28.00', report13.costPerKg, 28.00);

  // =========================================================================
  // TEST 14 — PHASE 1: PRESERVE CANONICAL INGREDIENT IDS & INTEGRITY
  // =========================================================================
  const canonicalCheckFormula: FormulationIngredient[] = [
    { id: 'labsa', name: 'LABSA 96%', percentage: 15, costPerKg: 145 },
    { id: 'sles-70', name: 'SLES 70%', percentage: 10, costPerKg: 112 },
    { id: 'caustic-soda-50', name: 'Sodium Hydroxide 50%', percentage: 3, costPerKg: 42 }
  ];
  const report14 = calculateFormulaCost(canonicalCheckFormula, 100);
  assertEqual('Test 14: Canonical IDs', 'ID labsa preserved', report14.ingredientCosts[0].id, 'labsa');
  assertEqual('Test 14: Canonical IDs', 'ID sles-70 preserved', report14.ingredientCosts[1].id, 'sles-70');
  assertEqual('Test 14: Canonical IDs', 'ID caustic-soda-50 preserved', report14.ingredientCosts[2].id, 'caustic-soda-50');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`--------------------------------------------------`);
  console.log(`TOTAL COSTING ENGINE TESTS : ${results.length}`);
  console.log(`PASSED                     : ${passedCount}`);
  console.log(`FAILED                     : ${failedCount}`);
  console.log(`--------------------------------------------------`);

  return { passed: passedCount, failed: failedCount, results };
}

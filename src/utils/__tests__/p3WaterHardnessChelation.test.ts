/**
 * ============================================================================
 * PHASE 3 — WATER HARDNESS & CHELATION SCIENTIFIC MASTER TEST SUITE
 * ============================================================================
 * 
 * Comprehensive scientific verification covering:
 * 1. Raw Water Hardness Scenarios (Soft, Moderate, Hard, Very Hard)
 * 2. Wash Liquor Volumes (5 L, 10 L, 20 L, 50 L) & Hardness Load (mg CaCO3)
 * 3. Product Dosage Scaling (5 g, 10 g, 20 g, 30 g, 50 g)
 * 4. Chelator Active Grades, Purity & Molecular Mass Basis
 * 5. Builder vs Soluble Chelator Mechanisms & Multiple Chelator Aggregation
 * 6. Batch Scaling Invariance (100 kg, 10 kg, 1 kg)
 * 7. Formulation-Level Hardness Protection Status (PASS, WARNING, INSUFFICIENT, NOT_APPLICABLE)
 * 8. Product-Specific Hardness Policy Routing
 * 9. Edge Cases, Guards & Scientific Integrity
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import {
  MW_CACO3,
  WATER_HARDNESS_SCENARIOS,
  PRODUCT_HARDNESS_POLICIES,
  AUTHORITATIVE_CHELATOR_DATABASE,
  getProductHardnessPolicy,
  getChelatorBindingCapacity,
  calculateWaterHardnessLoad,
  calculateFormulationChelationCapacity,
  calculateWaterHardnessTolerance,
  calculateDynamicChelatorRequirement
} from '../chelatorEngine';

export interface P3TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message: string;
}

const results: P3TestResult[] = [];

function assert(condition: boolean, group: string, name: string, detail?: string) {
  results.push({
    group,
    name,
    passed: condition,
    actual: condition ? 'PASS' : 'FAIL',
    expected: 'PASS',
    message: condition ? `PASS ${detail ? `(${detail})` : ''}` : `FAIL ${detail ? `(${detail})` : ''}`
  });
  console.log(`[${condition ? 'PASS' : 'FAIL'}] [${group}] ${name} ${detail ? `:: ${detail}` : ''}`);
  if (!condition) {
    console.error(`   ASSERTION FAILED: ${group} - ${name} - ${detail}`);
  }
}

function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.05) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  results.push({
    group,
    name,
    passed,
    actual,
    expected,
    message: passed 
      ? `PASS (actual: ${actual}, expected: ${expected}, diff: ${diff.toFixed(4)})` 
      : `FAIL (actual: ${actual}, expected: ${expected}, diff: ${diff.toFixed(4)})`
  });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${group}] ${name} :: actual: ${actual}, expected: ${expected}`);
  if (!passed) {
    console.error(`   NUMERICAL DIFF EXCEEDS TOLERANCE: ${actual} vs ${expected} (diff: ${diff})`);
  }
}

export function runP3WaterHardnessTestSuite() {
  results.length = 0;

  console.log("================================================================================");
  console.log("  PHASE 3 — WATER HARDNESS & CHELATION SCIENTIFIC MASTER TEST SUITE             ");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // 1. BASIC CALCULATIONS & WATER HARDNESS SCENARIOS
  // ---------------------------------------------------------------------------
  assertNear('Constants', 'CaCO3 Molecular Weight Constant', MW_CACO3, 100.0869, 0.001);
  assert(AUTHORITATIVE_CHELATOR_DATABASE.length >= 10, 'Database', 'Authoritative database contains registered species');
  assert(Boolean(PRODUCT_HARDNESS_POLICIES.LAUNDRY_LIQUID), 'Policies', 'Laundry liquid policy is defined');
  assert(WATER_HARDNESS_SCENARIOS.SOFT.hardnessPpm === 50, 'Scenarios', 'Soft water is 50 ppm');
  assert(WATER_HARDNESS_SCENARIOS.MODERATE.hardnessPpm === 150, 'Scenarios', 'Moderate water is 150 ppm');
  assert(WATER_HARDNESS_SCENARIOS.HARD.hardnessPpm === 300, 'Scenarios', 'Hard water is 300 ppm');
  assert(WATER_HARDNESS_SCENARIOS.VERY_HARD.hardnessPpm === 500, 'Scenarios', 'Very hard water is 500 ppm');

  // Load calculations: ppm * L = mg CaCO3
  assertNear('Hardness Load', 'Soft Water (50 ppm @ 10 L)', calculateWaterHardnessLoad(50, 10), 500);
  assertNear('Hardness Load', 'Moderate Water (150 ppm @ 10 L)', calculateWaterHardnessLoad(150, 10), 1500);
  assertNear('Hardness Load', 'Hard Water (300 ppm @ 10 L)', calculateWaterHardnessLoad(300, 10), 3000);
  assertNear('Hardness Load', 'Very Hard Water (500 ppm @ 10 L)', calculateWaterHardnessLoad(500, 10), 5000);

  // ---------------------------------------------------------------------------
  // 2. WASH VOLUME VARIATIONS (5 L, 10 L, 20 L, 50 L)
  // ---------------------------------------------------------------------------
  assertNear('Volume Scaling', '150 ppm @ 5 L', calculateWaterHardnessLoad(150, 5), 750);
  assertNear('Volume Scaling', '150 ppm @ 10 L', calculateWaterHardnessLoad(150, 10), 1500);
  assertNear('Volume Scaling', '150 ppm @ 20 L', calculateWaterHardnessLoad(150, 20), 3000);
  assertNear('Volume Scaling', '150 ppm @ 50 L', calculateWaterHardnessLoad(150, 50), 7500);
  assertNear('Volume Scaling', '300 ppm @ 50 L', calculateWaterHardnessLoad(300, 50), 15000);

  // ---------------------------------------------------------------------------
  // 3. PRODUCT DOSAGE VARIATIONS (Low 5g, Normal 20g, High 50g)
  // ---------------------------------------------------------------------------
  const testFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2.0 }, // 137 mg/g
    { id: '2', name: 'Sodium Citrate Dihydrate', percentage: 3.0 } // 150 mg/g
  ];

  // In 5g dose:
  // GLDA mass = (2/100)*5 = 0.10g -> binds 0.10 * 137 = 13.7 mg
  // Citrate mass = (3/100)*5 = 0.15g -> binds 0.15 * 150 = 22.5 mg
  // Total in 5g dose = 36.2 mg CaCO3
  const cap5g = calculateFormulationChelationCapacity(testFormula, 5);
  assertNear('Dosage Scaling', '5g Dose Sequestration Capacity', cap5g.totalSequestrationMg, 36.2);

  // In 20g dose:
  // GLDA mass = (2/100)*20 = 0.40g -> binds 54.8 mg
  // Citrate mass = (3/100)*20 = 0.60g -> binds 90.0 mg
  // Total in 20g dose = 144.8 mg CaCO3
  const cap20g = calculateFormulationChelationCapacity(testFormula, 20);
  assertNear('Dosage Scaling', '20g Dose Sequestration Capacity', cap20g.totalSequestrationMg, 144.8);

  // In 50g dose:
  // GLDA mass = (2/100)*50 = 1.00g -> binds 137.0 mg
  // Citrate mass = (3/100)*50 = 1.50g -> binds 225.0 mg
  // Total in 50g dose = 362.0 mg CaCO3
  const cap50g = calculateFormulationChelationCapacity(testFormula, 50);
  assertNear('Dosage Scaling', '50g Dose Sequestration Capacity', cap50g.totalSequestrationMg, 362.0);

  // ---------------------------------------------------------------------------
  // 4. CHELATOR ACTIVE GRADES, PURITY & MOLECULAR WEIGHT BASIS
  // ---------------------------------------------------------------------------
  // GLDA 47% vs 99%
  const glda47Cap = getChelatorBindingCapacity('GLDA 47% Liquid');
  const glda99Cap = getChelatorBindingCapacity('GLDA 99% Powder', 99);
  assertNear('Chelator Grades', 'GLDA 47% Benchmark Capacity', glda47Cap, 137);
  assertNear('Chelator Grades', 'GLDA 99% Active Capacity', glda99Cap, 282.2, 0.5);

  // MGDA 38% vs 40%
  const mgda38Cap = getChelatorBindingCapacity('MGDA 38% Liquid');
  const mgda40Cap = getChelatorBindingCapacity('MGDA 40% Liquid');
  assertNear('Chelator Grades', 'MGDA 38% Liquid Capacity', mgda38Cap, 155);
  assertNear('Chelator Grades', 'MGDA 40% Liquid Capacity', mgda40Cap, 155);

  // EDTA 39% vs 99%
  const edta39Cap = getChelatorBindingCapacity('Tetrasodium EDTA 39% Liquid');
  const edta99Cap = getChelatorBindingCapacity('EDTA Tetrasodium 99% Powder');
  assertNear('Chelator Grades', 'EDTA 39% Liquid Capacity', edta39Cap, 103);
  assertNear('Chelator Grades', 'EDTA 99% Powder Capacity', edta99Cap, 220);

  // Zeolite 4A Builder Powder
  const zeoliteCap = getChelatorBindingCapacity('Zeolite 4A Builder Powder');
  assertNear('Chelator Grades', 'Zeolite 4A Cation Exchange Capacity', zeoliteCap, 110);

  // ---------------------------------------------------------------------------
  // 5. MECHANISM PARTITIONING & MULTI-CHELATOR AGGREGATION
  // ---------------------------------------------------------------------------
  // Soluble Chelation (GLDA 2% = 54.8 mg) + Builder Complexation (Sodium Citrate 3% = 90 mg)
  const partitionedCap = calculateFormulationChelationCapacity(testFormula, 20);
  assertNear('Mechanism Partitioning', 'Soluble Chelation Component', partitionedCap.chelationCapacityMg, 54.8);
  assertNear('Mechanism Partitioning', 'Builder Complexation Component', partitionedCap.builderCapacityMg, 90.0);
  assertNear('Mechanism Partitioning', 'Total Aggregated Sequestration', partitionedCap.totalSequestrationMg, 144.8);

  // STPP + Zeolite + GLDA
  const complexBuilderFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Tripolyphosphate 94% (STPP)', percentage: 10.0 }, // 180 mg/g -> in 30g dose: 3g * 180 = 540 mg
    { id: '2', name: 'Zeolite 4A Builder Powder', percentage: 15.0 }, // 110 mg/g -> in 30g dose: 4.5g * 110 = 495 mg
    { id: '3', name: 'GLDA 47% Liquid', percentage: 2.0 } // 137 mg/g -> in 30g dose: 0.6g * 137 = 82.2 mg
  ];
  const powderCap = calculateFormulationChelationCapacity(complexBuilderFormula, 30);
  assertNear('Mechanism Partitioning', 'Complex Powder Soluble Chelation', powderCap.chelationCapacityMg, 82.2);
  assertNear('Mechanism Partitioning', 'Complex Powder Inorganic Builder Capacity', powderCap.builderCapacityMg, 1035.0); // 540 + 495
  assertNear('Mechanism Partitioning', 'Complex Powder Total Capacity', powderCap.totalSequestrationMg, 1117.2);

  // ---------------------------------------------------------------------------
  // 6. BATCH SCALING INVARIANCE & MASS-BALANCE
  // ---------------------------------------------------------------------------
  // Manufacturing batch sizes: 100 kg, 10 kg, 1 kg
  // Per-dose capacity (mg CaCO3) and wash hardness load MUST be identical across batch sizes.
  // Batch total capacity (grams CaCO3) scales linearly.
  const tol100kg = calculateWaterHardnessTolerance(testFormula, 150, 10, 20, 100, 'LAUNDRY_LIQUID');
  const tol10kg = calculateWaterHardnessTolerance(testFormula, 150, 10, 20, 10, 'LAUNDRY_LIQUID');
  const tol1kg = calculateWaterHardnessTolerance(testFormula, 150, 10, 20, 1, 'LAUNDRY_LIQUID');

  assertNear('Batch Scaling Invariance', '100 kg Dose Capacity', tol100kg.totalSequestrationMg, 144.8);
  assertNear('Batch Scaling Invariance', '10 kg Dose Capacity', tol10kg.totalSequestrationMg, 144.8);
  assertNear('Batch Scaling Invariance', '1 kg Dose Capacity', tol1kg.totalSequestrationMg, 144.8);

  assertNear('Batch Scaling Invariance', '100 kg Hardness Load', tol100kg.hardnessLoadMg, 1500);
  assertNear('Batch Scaling Invariance', '10 kg Hardness Load', tol10kg.hardnessLoadMg, 1500);
  assertNear('Batch Scaling Invariance', '1 kg Hardness Load', tol1kg.hardnessLoadMg, 1500);

  // Batch-level grams CaCO3:
  // 100 kg batch contains 2 kg GLDA (2000g * 137 = 274,000 mg = 274g) + 3 kg Citrate (3000g * 150 = 450,000 mg = 450g) = 724 g CaCO3
  assertNear('Batch Scaling Totals', '100 kg Batch Total Capacity (g CaCO3)', tol100kg.batchSequestrationGrams, 724.0);
  assertNear('Batch Scaling Totals', '10 kg Batch Total Capacity (g CaCO3)', tol10kg.batchSequestrationGrams, 72.4);
  assertNear('Batch Scaling Totals', '1 kg Batch Total Capacity (g CaCO3)', tol1kg.batchSequestrationGrams, 7.24);

  // ---------------------------------------------------------------------------
  // 7. FORMULATION-LEVEL HARDNESS PROTECTION STATUS (PASS, WARNING, INSUFFICIENT, NOT_APPLICABLE)
  // ---------------------------------------------------------------------------
  // High builder formula for 100 ppm @ 10L (load = 1000 mg, target @ 25% = 1250 mg)
  const passFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 50.0 } // 10g in 20g dose = 1500 mg capacity
  ];
  const passRes = calculateWaterHardnessTolerance(passFormula, 100, 10, 20, 100, 'LAUNDRY_LIQUID');
  assert(passRes.status === 'PASS', 'Protection Status', 'Formula with capacity >= required target is PASS');
  assert(passRes.sufficiency === 'sufficient', 'Protection Status', 'Sufficiency is sufficient');
  assertNear('Protection Status', 'Pass Deficit is 0', passRes.capacityDeficitMg, 0);

  // Borderline / Warning formula: capacity meets 1000 mg load but < 1250 mg safety margin
  const warningFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 38.0 } // 7.6g in 20g dose = 1140 mg capacity
  ];
  const warnRes = calculateWaterHardnessTolerance(warningFormula, 100, 10, 20, 100, 'LAUNDRY_LIQUID');
  assert(warnRes.status === 'WARNING', 'Protection Status', 'Formula meeting baseline load without safety margin is WARNING');
  assert(warnRes.sufficiency === 'borderline', 'Protection Status', 'Sufficiency is borderline');

  // Insufficient formula: capacity < 1000 mg load
  const insuffFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 10.0 } // 2g in 20g dose = 300 mg capacity
  ];
  const insuffRes = calculateWaterHardnessTolerance(insuffFormula, 100, 10, 20, 100, 'LAUNDRY_LIQUID');
  assert(insuffRes.status === 'INSUFFICIENT', 'Protection Status', 'Formula below baseline load is INSUFFICIENT');
  assert(insuffRes.sufficiency === 'insufficient', 'Protection Status', 'Sufficiency is insufficient');

  // ---------------------------------------------------------------------------
  // 8. PRODUCT-SPECIFIC POLICY ROUTING
  // ---------------------------------------------------------------------------
  // Glass cleaner: not applicable
  const glassRes = calculateWaterHardnessTolerance(testFormula, 150, 1, 5, 100, 'GLASS_CLEANER');
  assert(glassRes.status === 'NOT_APPLICABLE', 'Product Policy', 'Glass cleaner status is NOT_APPLICABLE');
  assert(glassRes.isApplicable === false, 'Product Policy', 'Glass cleaner isApplicable is false');

  // Toilet cleaner: not applicable
  const toiletRes = calculateWaterHardnessTolerance(testFormula, 150, 1, 50, 100, 'TOILET_CLEANER');
  assert(toiletRes.status === 'NOT_APPLICABLE', 'Product Policy', 'Toilet cleaner status is NOT_APPLICABLE');

  // Fabric softener: not applicable
  const softenerRes = calculateWaterHardnessTolerance(testFormula, 150, 10, 25, 100, 'FABRIC_SOFTENER');
  assert(softenerRes.status === 'NOT_APPLICABLE', 'Product Policy', 'Fabric softener status is NOT_APPLICABLE');

  // Dishwash Automatic: applicable with high safety margin
  const autoDishPolicy = getProductHardnessPolicy('DISHWASH_AUTOMATIC');
  assert(autoDishPolicy.requiresHardnessControl === true, 'Product Policy', 'Auto Dish requires hardness control');
  assert(autoDishPolicy.defaultSafetyMarginPct === 30, 'Product Policy', 'Auto Dish default safety margin is 30%');

  // ---------------------------------------------------------------------------
  // 9. EDGE CASES & SCIENTIFIC INTEGRITY
  // ---------------------------------------------------------------------------
  // Zero Hardness (0 ppm)
  const zeroHardnessRes = calculateWaterHardnessTolerance(testFormula, 0, 10, 20, 100, 'LAUNDRY_LIQUID');
  assertNear('Edge Cases', '0 ppm Hardness Load', zeroHardnessRes.hardnessLoadMg, 0);
  assert(zeroHardnessRes.status === 'NOT_EVALUATED' || zeroHardnessRes.status === 'PASS', 'Edge Cases', '0 ppm with chelators is NOT_EVALUATED or PASS');

  // Zero Chelator Formula
  const zeroChelatorFormula: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70%', percentage: 12.0 },
    { id: '2', name: 'Water', percentage: 88.0 }
  ];
  const zeroChelatorRes = calculateWaterHardnessTolerance(zeroChelatorFormula, 300, 10, 20, 100, 'LAUNDRY_LIQUID');
  assert(zeroChelatorRes.status === 'INSUFFICIENT', 'Edge Cases', 'Zero chelator in 300 ppm hard water is INSUFFICIENT');
  assertNear('Edge Cases', 'Zero Chelator Capacity', zeroChelatorRes.totalSequestrationMg, 0);

  // Unneutralized Citric Acid vs Sodium Citrate
  const citricAcidCap = getChelatorBindingCapacity('Citric Acid Monohydrate');
  const sodiumCitrateCap = getChelatorBindingCapacity('Sodium Citrate Dihydrate');
  assertNear('Edge Cases', 'Unneutralized Citric Acid has 0 binding capacity', citricAcidCap, 0);
  assertNear('Edge Cases', 'Sodium Citrate has 150 mg/g binding capacity', sodiumCitrateCap, 150);

  // Extreme Hardness (1000 ppm)
  const extremeHardnessRes = calculateWaterHardnessTolerance(testFormula, 1000, 10, 20, 100, 'LAUNDRY_LIQUID');
  assertNear('Edge Cases', '1000 ppm @ 10L Load', extremeHardnessRes.hardnessLoadMg, 10000);
  assert(extremeHardnessRes.status === 'INSUFFICIENT', 'Edge Cases', '1000 ppm with 2% GLDA is INSUFFICIENT');

  // Dynamic Requirement Calculation
  const dynReq = calculateDynamicChelatorRequirement(testFormula, 300, 10, 20, 25);
  // Load = 3000 mg, Target @ 25% = 3750 mg, Existing = 144.8 mg -> Deficit = 3605.2 mg
  assertNear('Dynamic Requirement', 'Deficit for 300 ppm', dynReq.capacityDeficitMg, 3605.2, 0.5);
  assert(dynReq.isSufficient === false, 'Dynamic Requirement', 'Deficit flags isSufficient = false');
  // GLDA 47% needed in 20g dose: 3605.2 / 137 = 26.315 g -> (26.315 / 20) * 100 = 131.58%
  assertNear('Dynamic Requirement', 'Additional GLDA 47% %', dynReq.additionalGLDA47RequiredPct, 131.58, 0.5);

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P3 WATER HARDNESS TESTS : ${results.length}`);
  console.log(`PASSED                        : ${results.filter(r => r.passed).length}`);
  console.log(`FAILED                        : ${results.filter(r => !r.passed).length}`);
  console.log("--------------------------------------------------------------------------------");

  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results
  };
}

if (process.argv[1] && process.argv[1].includes('p3WaterHardnessChelation.test')) {
  runP3WaterHardnessTestSuite();
}

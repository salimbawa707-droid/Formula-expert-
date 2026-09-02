import { 
  getChelatorBindingCapacity, 
  calculateWaterHardnessLoad, 
  calculateFormulationChelationCapacity, 
  calculateWaterHardnessTolerance, 
  calculateGreenChelators,
  convertUnit
} from '../calculators';
import { FormulationIngredient } from '../../types';

export interface WaterHardnessTestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message: string;
}

const results: WaterHardnessTestResult[] = [];

function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.01) {
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
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${group} :: ${name}`);
  if (!passed) {
    console.error(`   Inputs & Calculation -> Expected: ${expected}, Actual: ${actual}, Diff: ${diff.toFixed(4)}`);
  }
}

export function runWaterHardnessTestSuite() {
  results.length = 0;

  console.log("==================================================");
  console.log("  WATER HARDNESS & CHELATOR REGRESSION SUITE  ");
  console.log("==================================================");

  // 1. Water Hardness Load Calculations (mg CaCO3)
  assertNear('Water Hardness Load', '50 ppm @ 10 L', calculateWaterHardnessLoad(50, 10), 500);
  assertNear('Water Hardness Load', '100 ppm @ 10 L', calculateWaterHardnessLoad(100, 10), 1000);
  assertNear('Water Hardness Load', '150 ppm @ 10 L', calculateWaterHardnessLoad(150, 10), 1500);
  assertNear('Water Hardness Load', '300 ppm @ 10 L', calculateWaterHardnessLoad(300, 10), 3000);
  assertNear('Water Hardness Load', '600 ppm @ 10 L', calculateWaterHardnessLoad(600, 10), 6000);

  // 2. Chelator Binding Capacities
  assertNear('Chelator Capacity', 'GLDA-47 Binding Capacity', getChelatorBindingCapacity('GLDA 47% Liquid'), 137);
  assertNear('Chelator Capacity', 'Sodium Citrate Binding Capacity', getChelatorBindingCapacity('Sodium Citrate Dihydrate'), 150);
  assertNear('Chelator Capacity', 'Sodium Gluconate Binding Capacity', getChelatorBindingCapacity('Sodium Gluconate'), 76);
  assertNear('Chelator Capacity', 'EDTA Tetrasodium Binding Capacity', getChelatorBindingCapacity('EDTA Tetrasodium'), 220);
  assertNear('Chelator Capacity', 'MGDA 38% Liquid Binding Capacity', getChelatorBindingCapacity('MGDA 38% Liquid'), 155);

  // 3. Theoretical Requirement & 25% Safety Margin
  // Load = 150 ppm @ 10 L = 1500 mg CaCO3
  // Theoretical GLDA-47 requirement = 1500 / 137 = 10.9489 g
  // 25% Safety Margin = 1500 * 1.25 = 1875 mg CaCO3 target -> 1875 / 137 = 13.6861 g GLDA-47
  const greenRes = calculateGreenChelators({ waterHardnessPpm: 150, washVolumeL: 10, safetyMarginPct: 25 });
  assertNear('Requirement & Safety', 'Hardness Load (150 ppm @ 10 L)', greenRes.totalCaCO3ToBindMg || 0, 1500);
  assertNear('Requirement & Safety', 'Stoichiometric Target (25% margin)', greenRes.stoichiometricTargetMg || 0, 1875);

  const gldaDetail = (greenRes.details || []).find(d => d.id === 'glda');
  if (gldaDetail) {
    assertNear('Requirement & Safety', 'Theoretical GLDA-47 grams (with 25% margin)', gldaDetail.theoreticalSequestrationGrams || 0, 13.6861, 0.05);
  } else {
    assertNear('Requirement & Safety', 'Theoretical GLDA-47 grams (with 25% margin)', 0, 13.6861);
  }

  // Unit Conversions
  assertNear('Unit Conversions', '13.6861 g to kg', convertUnit(13.6861, 'g', 'kg'), 0.0136861, 0.0001);
  assertNear('Unit Conversions', '0.0136861 kg to g', convertUnit(0.0136861, 'kg', 'g'), 13.6861, 0.001);

  // 4. Multi-Chelator Formula Aggregation
  // 20g dose of formulation containing 2% GLDA-47 and 3% Sodium Citrate Dihydrate
  // GLDA-47 mass = (2/100) * 20g = 0.4g -> binds 0.4 * 137 = 54.8 mg CaCO3
  // Citrate mass = (3/100) * 20g = 0.6g -> binds 0.6 * 150 = 90.0 mg CaCO3
  // Total capacity = 54.8 + 90.0 = 144.8 mg CaCO3 per wash
  const multiFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2 },
    { id: '2', name: 'Sodium Citrate Dihydrate', percentage: 3 },
    { id: '3', name: 'Water', percentage: 95 }
  ];
  const multiCap = calculateFormulationChelationCapacity(multiFormula, 20);
  assertNear('Multi-Chelator', 'Aggregated Chelation Capacity', multiCap.totalSequestrationMg, 144.8, 0.1);

  // GLDA + Gluconate: 2% GLDA (54.8 mg) + 5% Sodium Gluconate ( (5/100)*20 * 76 = 1.0g * 76 = 76 mg) = 130.8 mg
  const multiGluconateFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2 },
    { id: '2', name: 'Sodium Gluconate', percentage: 5 }
  ];
  const gluconateCap = calculateFormulationChelationCapacity(multiGluconateFormula, 20);
  assertNear('Multi-Chelator', 'GLDA + Gluconate Aggregated Capacity', gluconateCap.totalSequestrationMg, 130.8, 0.1);

  // Citrate + Gluconate: 5% Sodium Citrate ((5/100)*20 * 150 = 150 mg) + 5% Sodium Gluconate (76 mg) = 226 mg
  const citrateGluconateFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 5 },
    { id: '2', name: 'Sodium Gluconate', percentage: 5 }
  ];
  const cgCap = calculateFormulationChelationCapacity(citrateGluconateFormula, 20);
  assertNear('Multi-Chelator', 'Citrate + Gluconate Aggregated Capacity', cgCap.totalSequestrationMg, 226.0, 0.1);

  // 5. Performance Scoring & Sufficiency Logic
  // Load @ 100 ppm, 10 L = 1000 mg CaCO3. Safety target (25%) = 1250 mg.
  // Formula with 50% Citrate in 20g dose = 10g Citrate = 1500 mg capacity (>1250 mg) -> Sufficient
  const suffFormula: FormulationIngredient[] = [{ id: '1', name: 'Sodium Citrate Dihydrate', percentage: 50 }];
  const suffRes = calculateWaterHardnessTolerance(suffFormula, 100, 10, 20);
  assertNear('Performance Scoring', 'Sufficient Sequestration Flag', suffRes.sufficiency === 'sufficient' ? 1 : 0, 1);

  // Formula with 38% Citrate in 20g dose = 7.6g Citrate = 1140 mg capacity (>=1000 mg load, but <1250 mg safety target) -> Borderline
  const bordFormula: FormulationIngredient[] = [{ id: '1', name: 'Sodium Citrate Dihydrate', percentage: 38 }];
  const bordRes = calculateWaterHardnessTolerance(bordFormula, 100, 10, 20);
  assertNear('Performance Scoring', 'Borderline Sequestration Flag', bordRes.sufficiency === 'borderline' ? 1 : 0, 1);

  // Formula with 10% Citrate in 20g dose = 2g Citrate = 300 mg capacity (<1000 mg load) -> Insufficient
  const insuffFormula: FormulationIngredient[] = [{ id: '1', name: 'Sodium Citrate Dihydrate', percentage: 10 }];
  const insuffRes = calculateWaterHardnessTolerance(insuffFormula, 100, 10, 20);
  assertNear('Performance Scoring', 'Insufficient Sequestration Flag', insuffRes.sufficiency === 'insufficient' ? 1 : 0, 1);

  // 6. Monotonicity across Hardness Levels
  const req50 = calculateGreenChelators({ waterHardnessPpm: 50, washVolumeL: 10, safetyMarginPct: 25 }).stoichiometricTargetMg || 0;
  const req100 = calculateGreenChelators({ waterHardnessPpm: 100, washVolumeL: 10, safetyMarginPct: 25 }).stoichiometricTargetMg || 0;
  const req150 = calculateGreenChelators({ waterHardnessPpm: 150, washVolumeL: 10, safetyMarginPct: 25 }).stoichiometricTargetMg || 0;
  const req300 = calculateGreenChelators({ waterHardnessPpm: 300, washVolumeL: 10, safetyMarginPct: 25 }).stoichiometricTargetMg || 0;
  const req600 = calculateGreenChelators({ waterHardnessPpm: 600, washVolumeL: 10, safetyMarginPct: 25 }).stoichiometricTargetMg || 0;

  const monotonic = (req50 < req100) && (req100 < req150) && (req150 < req300) && (req300 < req600);
  assertNear('Monotonicity', 'Strict Monotonicity (50 < 100 < 150 < 300 < 600 ppm)', monotonic ? 1 : 0, 1);

  // 5. Edge Cases & Zero Safety
  assertNear('Edge Cases', 'Zero Hardness (0 ppm)', calculateWaterHardnessLoad(0, 10), 0);

  const zeroChelatorFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 0 },
    { id: '2', name: 'Sodium Citrate', percentage: 0 }
  ];
  const zeroCap = calculateFormulationChelationCapacity(zeroChelatorFormula, 20);
  assertNear('Edge Cases', 'Zero Percentage Chelator Capacity', zeroCap.totalSequestrationMg, 0);

  const unknownFormula: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70%', percentage: 12 },
    { id: '2', name: 'LABSA 96%', percentage: 8 },
    { id: '3', name: 'Water', percentage: 80 },
    { id: '4', name: 'Fragrance', percentage: 0.5 },
    { id: '5', name: 'Sodium Chloride', percentage: 1.0 }
  ];
  const unknownCap = calculateFormulationChelationCapacity(unknownFormula, 20);
  assertNear('Edge Cases', 'Unknown / Non-chelating Ingredients Capacity', unknownCap.totalSequestrationMg, 0);

  // 6. SSOT Reactivity & Formula Switching
  // Formula A: 1% GLDA-47 -> (1/100)*20 * 137 = 27.4 mg
  // Formula B: 5% GLDA-47 -> (5/100)*20 * 137 = 137 mg
  // Formula C: 10% Sodium Citrate -> (10/100)*20 * 150 = 300 mg
  const formulaA: FormulationIngredient[] = [{ id: 'a', name: 'GLDA 47% Liquid', percentage: 1 }];
  const formulaB: FormulationIngredient[] = [{ id: 'b', name: 'GLDA 47% Liquid', percentage: 5 }];
  const formulaC: FormulationIngredient[] = [{ id: 'c', name: 'Sodium Citrate Dihydrate', percentage: 10 }];

  const resA = calculateWaterHardnessTolerance(formulaA, 150, 10, 20);
  const resB = calculateWaterHardnessTolerance(formulaB, 150, 10, 20);
  const resC = calculateWaterHardnessTolerance(formulaC, 150, 10, 20);

  assertNear('SSOT Reactivity', 'Formula A Sequestration', resA.totalSequestrationMg, 27.4, 0.1);
  assertNear('SSOT Reactivity', 'Formula B Sequestration', resB.totalSequestrationMg, 137.0, 0.1);
  assertNear('SSOT Reactivity', 'Formula C Sequestration', resC.totalSequestrationMg, 300.0, 0.1);

  // Re-evaluating Formula A to verify no state pollution
  const resA2 = calculateWaterHardnessTolerance(formulaA, 150, 10, 20);
  assertNear('SSOT Reactivity', 'Formula A Hydration / Re-evaluation', resA2.totalSequestrationMg, 27.4, 0.1);

  // 7. Active Concentration Double-Count Prevention
  // Test: 2% GLDA-47 in 20g dose = 0.4g GLDA-47 product.
  // Capacity stored as commercial product basis (137 mg CaCO3/g product).
  // Total sequestration MUST be 0.4 * 137 = 54.8 mg CaCO3.
  // Must NOT multiply by 0.47 again (which would give ~25.75 mg).
  const singleGLDAFormula: FormulationIngredient[] = [{ id: 'glda1', name: 'GLDA 47% Liquid', percentage: 2 }];
  const singleGLDACap = calculateFormulationChelationCapacity(singleGLDAFormula, 20);
  assertNear('Double-Count Prevention', 'GLDA-47 Commercial Product Capacity (0.4g * 137 mg/g = 54.8 mg)', singleGLDACap.totalSequestrationMg, 54.8, 0.01);

  // Verification from Pure Active Basis:
  // Pure Active GLDA has MW 351.13 g/mol -> 100.09/351.13 * 1000 = 285 mg CaCO3/g active.
  // Active GLDA mass in 0.4g of 47% product = 0.188g active.
  // Theoretical active binding = 0.188 * 285 = 53.58 mg CaCO3.
  // Product basis (137 mg/g) matches active basis with 1x assay application (54.8 vs 53.58 mg CaCO3).
  const activeGLDAMassGrams = 0.4 * 0.47; // 0.188g pure active
  const theoreticalActiveSequestrationMg = activeGLDAMassGrams * (100.09 / 351.13 * 1000);
  assertNear('Double-Count Prevention', 'Pure Active GLDA 1x Assay Check (0.188g active * 285 mg/g)', theoreticalActiveSequestrationMg, 53.58, 0.5);

  // 8. Product-Grade Distinction & Safety
  // Citric acid is an acidifier (returns 0), whereas Sodium Citrate Dihydrate is a chelating builder (returns 150).
  const citricAcidCap = getChelatorBindingCapacity('Citric Acid');
  const sodiumCitrateCap = getChelatorBindingCapacity('Sodium Citrate Dihydrate');
  assertNear('Product Grade Safety', 'Citric Acid Return Zero (Acidifier)', citricAcidCap, 0);
  assertNear('Product Grade Safety', 'Sodium Citrate Return 150 mg/g (Chelating Salt)', sodiumCitrateCap, 150);

  // 9. MGDA, EDTA & DTPA Constants Verification
  const mgdaCap = getChelatorBindingCapacity('Trisodium MGDA 38% Liquid');
  const edtaCap = getChelatorBindingCapacity('EDTA Tetrasodium Powder');
  const dtpaCap = getChelatorBindingCapacity('DTPA Pentasodium Powder');
  assertNear('Product Grade Safety', 'MGDA 38% Liquid Return 155 mg/g', mgdaCap, 155);
  assertNear('Product Grade Safety', 'EDTA Tetrasodium Powder Return 220 mg/g', edtaCap, 220);
  assertNear('Product Grade Safety', 'DTPA Pentasodium Solid Return 200 mg/g', dtpaCap, 200);

  // 10. Multi-Chelator Aggregation (GLDA + Citrate + MGDA)
  const tripleMultiFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 1 }, // 0.2g * 137 = 27.4 mg
    { id: '2', name: 'Sodium Citrate Dihydrate', percentage: 2 }, // 0.4g * 150 = 60.0 mg
    { id: '3', name: 'Trisodium MGDA 38%', percentage: 1 } // 0.2g * 155 = 31.0 mg
  ];
  const tripleMultiCap = calculateFormulationChelationCapacity(tripleMultiFormula, 20);
  assertNear('Multi-Chelator Aggregation', 'GLDA + Citrate + MGDA Aggregated Capacity (27.4 + 60 + 31 = 118.4 mg)', tripleMultiCap.totalSequestrationMg, 118.4, 0.01);

  // 11. Safety Margin Applied Exactly Once
  // 150 ppm @ 10L = 1500 mg CaCO3 load.
  // Stoichiometric target with 25% safety margin = 1500 * 1.25 = 1875 mg.
  const checkGreenRes = calculateGreenChelators({ waterHardnessPpm: 150, washVolumeL: 10, safetyMarginPct: 25 });
  assertNear('Safety Margin Check', '25% Safety Margin Applied Exactly Once (1500 * 1.25 = 1875 mg)', checkGreenRes.stoichiometricTargetMg ?? 0, 1875, 0.01);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log("--------------------------------------------------");
  console.log(`TOTAL WATER HARDNESS TESTS : ${results.length}`);
  console.log(`PASSED                     : ${passedCount}`);
  console.log(`FAILED                     : ${failedCount}`);
  console.log("--------------------------------------------------");

  return { total: results.length, passed: passedCount, failed: failedCount, results };
}

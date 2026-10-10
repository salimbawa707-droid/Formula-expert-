/**
 * ============================================================================
 * P1 PHASE 2 — CHELATION, HARD-WATER & SCIENTIFIC DATABASE VALIDATION TEST SUITE
 * ============================================================================
 * 
 * Master forensic verification covering:
 * 1. Molecular Weight Verification from Atomic Masses
 * 2. Hydration State & Active Assay Validation
 * 3. Theoretical Stoichiometric vs Effective Commercial Capacity
 * 4. Hard-Water Load across 50, 100, 150, 200, 300, 500 ppm & 10L, 20L
 * 5. Deterministic Worked 300 ppm Scenarios
 * 6. Dynamic Chelator Requirement (Deficit Calculation & 0 Requirement when Sufficient)
 * 7. Mixed Chelator Systems & Multi-Builder Aggregation
 * 8. Scientific Status & Provenance Hierarchy
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { 
  AUTHORITATIVE_CHELATOR_DATABASE,
  MW_CACO3,
  calculateWaterHardnessLoad,
  calculateFormulationChelationCapacity,
  calculateWaterHardnessTolerance,
  calculateDynamicChelatorRequirement
} from '../chelatorEngine';

export interface P1Phase2TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message: string;
}

const results: P1Phase2TestResult[] = [];

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

export function runP1Phase2ChelationTestSuite() {
  results.length = 0;

  console.log("================================================================================");
  console.log("  P1 PHASE 2 — CHELATION & SCIENTIFIC DATABASE VALIDATION MASTER TEST SUITE     ");
  console.log("================================================================================");

  // =========================================================================
  // 1. MOLECULAR WEIGHT & ATOMIC COMPOSITION VALIDATION
  // =========================================================================
  // Standard Atomic Masses: H=1.008, C=12.011, N=14.007, O=16.000, Na=22.990, P=30.974
  // CaCO3 = 40.078 + 12.011 + 3*16.000 = 100.0869 g/mol
  assertNear('Molecular Weights', 'CaCO3 Molecular Weight', MW_CACO3, 100.0869, 0.001);

  // GLDA-Na4: C9H9NO8Na4 = 9*12.011 + 9*1.008 + 14.007 + 8*16.000 + 4*22.990 = 351.13 g/mol
  const glda = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'glda-47');
  assert(glda !== undefined, 'Molecular Weights', 'GLDA entry exists');
  if (glda) {
    assertNear('Molecular Weights', 'GLDA-Na4 Active Salt MW', glda.molecularWeight, 351.13, 0.1);
    assert(glda.chemicalFormula === 'C9H9NO8Na4', 'Molecular Weights', 'GLDA Formula Correct');
    assert(glda.stoichiometricRatio === 1.0, 'Molecular Weights', 'GLDA 1:1 Stoichiometry');
    assertNear('Molecular Weights', 'GLDA Theoretical Active Capacity', glda.theoreticalActiveCapacityMgPerG, 285.04, 0.1);
  }

  // MGDA-Na3: C5H6NO6Na3 = 5*12.011 + 6*1.008 + 14.007 + 6*16.000 + 3*22.990 = 271.09 g/mol
  const mgda = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'mgda-38');
  assert(mgda !== undefined, 'Molecular Weights', 'MGDA entry exists');
  if (mgda) {
    assertNear('Molecular Weights', 'MGDA-Na3 Active Salt MW', mgda.molecularWeight, 271.09, 0.1);
    assert(mgda.chemicalFormula === 'C5H6NO6Na3', 'Molecular Weights', 'MGDA Formula Correct');
    assert(mgda.stoichiometricRatio === 1.0, 'Molecular Weights', 'MGDA 1:1 Stoichiometry');
    assertNear('Molecular Weights', 'MGDA Theoretical Active Capacity', mgda.theoreticalActiveCapacityMgPerG, 369.20, 0.1);
  }

  // Sodium Citrate Dihydrate: Na3C6H5O7·2H2O = 258.07 + 2*18.015 = 294.10 g/mol
  const citrate = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'citrate-dihydrate');
  assert(citrate !== undefined, 'Molecular Weights', 'Sodium Citrate Dihydrate entry exists');
  if (citrate) {
    assertNear('Molecular Weights', 'Sodium Citrate Dihydrate MW', citrate.molecularWeight, 294.10, 0.1);
    assert(citrate.hydrationState === 'Dihydrate', 'Molecular Weights', 'Citrate Hydration is Dihydrate');
    assertNear('Molecular Weights', 'Citrate Dihydrate Stoichiometric Capacity', citrate.theoreticalActiveCapacityMgPerG, 340.32, 0.1);
    assertNear('Molecular Weights', 'Citrate Effective Commercial Capacity', citrate.effectiveCommercialCapacityMgPerG, 150, 0.1);
    assert(citrate.scientificStatus === 'EMPIRICAL', 'Molecular Weights', 'Citrate Effective Status is EMPIRICAL');
  }

  // Sodium Gluconate: NaC6H11O7 = 22.990 + 6*12.011 + 11*1.008 + 7*16.000 = 218.14 g/mol
  const gluconate = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'gluconate');
  assert(gluconate !== undefined, 'Molecular Weights', 'Sodium Gluconate entry exists');
  if (gluconate) {
    assertNear('Molecular Weights', 'Sodium Gluconate MW', gluconate.molecularWeight, 218.14, 0.1);
    assertNear('Molecular Weights', 'Sodium Gluconate Effective Commercial Capacity', gluconate.effectiveCommercialCapacityMgPerG, 76, 0.1);
  }

  // EDTA-Na4: C10H12N2O8Na4 = 380.17 g/mol (anhydrous active salt basis)
  const edtaPowder = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'edta-powder');
  assert(edtaPowder !== undefined, 'Molecular Weights', 'EDTA Powder entry exists');
  if (edtaPowder) {
    assertNear('Molecular Weights', 'EDTA-Na4 Anhydrous Salt MW', edtaPowder.molecularWeight, 380.17, 0.1);
    assertNear('Molecular Weights', 'EDTA Theoretical Active Capacity', edtaPowder.theoreticalActiveCapacityMgPerG, 263.27, 0.1);
    assertNear('Molecular Weights', 'EDTA Powder Benchmark Capacity', edtaPowder.effectiveCommercialCapacityMgPerG, 220, 0.1);
  }

  // STPP: Na5P3O10 = 5*22.990 + 3*30.974 + 10*16.000 = 367.86 g/mol
  const stpp = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'stpp');
  assert(stpp !== undefined, 'Molecular Weights', 'STPP entry exists');
  if (stpp) {
    assertNear('Molecular Weights', 'STPP Anhydrous Salt MW', stpp.molecularWeight, 367.86, 0.1);
    assertNear('Molecular Weights', 'STPP Theoretical Active Capacity', stpp.theoreticalActiveCapacityMgPerG, 272.08, 0.1);
    assertNear('Molecular Weights', 'STPP Practical Wash Sequestration', stpp.effectiveCommercialCapacityMgPerG, 180, 0.1);
  }

  // HEDP: C2H8O7P2 = 206.03 g/mol (acid active basis)
  const hedp = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'hedp');
  assert(hedp !== undefined, 'Molecular Weights', 'HEDP entry exists');
  if (hedp) {
    assertNear('Molecular Weights', 'HEDP Active Acid MW', hedp.molecularWeight, 206.03, 0.1);
    assertNear('Molecular Weights', 'HEDP Effective Threshold Capacity', hedp.effectiveCommercialCapacityMgPerG, 250, 0.1);
  }

  // =========================================================================
  // 2. HARD-WATER LOAD CONVERSIONS (50 - 500 PPM & 10L, 20L)
  // =========================================================================
  assertNear('Hardness Load', '50 ppm in 10 L', calculateWaterHardnessLoad(50, 10), 500);
  assertNear('Hardness Load', '100 ppm in 10 L', calculateWaterHardnessLoad(100, 10), 1000);
  assertNear('Hardness Load', '150 ppm in 10 L', calculateWaterHardnessLoad(150, 10), 1500);
  assertNear('Hardness Load', '200 ppm in 10 L', calculateWaterHardnessLoad(200, 10), 2000);
  assertNear('Hardness Load', '300 ppm in 10 L', calculateWaterHardnessLoad(300, 10), 3000);
  assertNear('Hardness Load', '500 ppm in 10 L', calculateWaterHardnessLoad(500, 10), 5000);

  // 20 L wash liquor scenarios
  assertNear('Hardness Load', '150 ppm in 20 L', calculateWaterHardnessLoad(150, 20), 3000);
  assertNear('Hardness Load', '300 ppm in 20 L', calculateWaterHardnessLoad(300, 20), 6000);
  assertNear('Hardness Load', '500 ppm in 20 L', calculateWaterHardnessLoad(500, 20), 10000);

  // =========================================================================
  // 3. DETERMINISTIC WORKED REFERENCE CASES
  // =========================================================================
  // Case 1: 300 ppm Hardness, 10 L Water, 20 g Dose
  // Load = 300 * 10 = 3000 mg CaCO3. Safety Target (25%) = 3750 mg CaCO3.
  const case1Req = calculateDynamicChelatorRequirement([], 300, 10, 20, 25);
  assertNear('Reference Cases', 'Case 1: 300 ppm @ 10L Load', case1Req.hardnessLoadMg, 3000);
  assertNear('Reference Cases', 'Case 1: 300 ppm @ 10L Target', case1Req.requiredSequestrationMg, 3750);
  assertNear('Reference Cases', 'Case 1: Deficit for Unchelated', case1Req.capacityDeficitMg, 3750);
  // GLDA 47% required in 20g dose: 3750 / 137 = 27.372 g -> (27.372 / 20)*100 = 136.86%
  assertNear('Reference Cases', 'Case 1: Additional GLDA 47% %', case1Req.additionalGLDA47RequiredPct, 136.86, 0.1);

  // Case 2: 300 ppm Hardness, 20 L Water, 20 g Dose
  // Load = 300 * 20 = 6000 mg CaCO3. Safety Target (25%) = 7500 mg CaCO3.
  const case2Req = calculateDynamicChelatorRequirement([], 300, 20, 20, 25);
  assertNear('Reference Cases', 'Case 2: 300 ppm @ 20L Load', case2Req.hardnessLoadMg, 6000);
  assertNear('Reference Cases', 'Case 2: 300 ppm @ 20L Target', case2Req.requiredSequestrationMg, 7500);

  // Case 3: 100 ppm Hardness, 10 L Water, 20 g Dose
  // Load = 1000 mg. Target = 1250 mg.
  const case3Req = calculateDynamicChelatorRequirement([], 100, 10, 20, 25);
  assertNear('Reference Cases', 'Case 3: 100 ppm @ 10L Load', case3Req.hardnessLoadMg, 1000);
  assertNear('Reference Cases', 'Case 3: 100 ppm @ 10L Target', case3Req.requiredSequestrationMg, 1250);

  // Case 4: 500 ppm Hardness, 10 L Water, 20 g Dose
  // Load = 5000 mg. Target = 6250 mg.
  const case4Req = calculateDynamicChelatorRequirement([], 500, 10, 20, 25);
  assertNear('Reference Cases', 'Case 4: 500 ppm @ 10L Load', case4Req.hardnessLoadMg, 5000);
  assertNear('Reference Cases', 'Case 4: 500 ppm @ 10L Target', case4Req.requiredSequestrationMg, 6250);

  // Case 5: GLDA 47% Liquid (2.0% in 20g dose)
  // Raw mass = 0.40 g -> bound CaCO3 = 0.40 * 137 = 54.8 mg
  const case5Formula: FormulationIngredient[] = [{ id: '1', name: 'GLDA 47% Liquid', percentage: 2.0 }];
  const case5Cap = calculateFormulationChelationCapacity(case5Formula, 20);
  assertNear('Reference Cases', 'Case 5: 2% GLDA 47% Capacity', case5Cap.totalSequestrationMg, 54.8);

  // Case 6: GLDA 99% Powder (2.0% in 20g dose)
  // Raw mass = 0.40 g -> bound CaCO3 = 0.40 * 282.2 = 112.88 mg
  const case6Formula: FormulationIngredient[] = [{ id: '1', name: 'GLDA 99% Powder', percentage: 2.0, activeMatterPct: 99 }];
  const case6Cap = calculateFormulationChelationCapacity(case6Formula, 20);
  assertNear('Reference Cases', 'Case 6: 2% GLDA 99% Powder Capacity', case6Cap.totalSequestrationMg, 112.88, 0.1);

  // Case 7: Sodium Citrate Dihydrate (3.0% in 20g dose)
  // Raw mass = 0.60 g -> bound CaCO3 = 0.60 * 150 = 90.0 mg
  const case7Formula: FormulationIngredient[] = [{ id: '1', name: 'Sodium Citrate Dihydrate', percentage: 3.0 }];
  const case7Cap = calculateFormulationChelationCapacity(case7Formula, 20);
  assertNear('Reference Cases', 'Case 7: 3% Sodium Citrate Dihydrate Capacity', case7Cap.totalSequestrationMg, 90.0);

  // Case 8: Mixed GLDA 47% (2%) + Sodium Citrate (3%)
  // Combined capacity = 54.8 + 90.0 = 144.8 mg CaCO3
  const case8Formula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2.0 },
    { id: '2', name: 'Sodium Citrate Dihydrate', percentage: 3.0 }
  ];
  const case8Cap = calculateFormulationChelationCapacity(case8Formula, 20);
  assertNear('Reference Cases', 'Case 8: Mixed GLDA + Citrate Capacity', case8Cap.totalSequestrationMg, 144.8);

  // =========================================================================
  // 4. MIXED CHELATOR COMBINATIONS & MULTI-BUILDER SCENARIOS
  // =========================================================================
  // GLDA (2% = 54.8 mg) + MGDA 38% (2% = 62.0 mg) = 116.8 mg
  const gldaMgdaFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2.0 },
    { id: '2', name: 'MGDA 38% Liquid', percentage: 2.0 }
  ];
  const gldaMgdaCap = calculateFormulationChelationCapacity(gldaMgdaFormula, 20);
  assertNear('Mixed Chelators', 'GLDA + MGDA Capacity', gldaMgdaCap.totalSequestrationMg, 116.8);

  // MGDA 38% (2% = 62.0 mg) + Sodium Citrate (3% = 90.0 mg) = 152.0 mg
  const mgdaCitrateFormula: FormulationIngredient[] = [
    { id: '1', name: 'MGDA 38% Liquid', percentage: 2.0 },
    { id: '2', name: 'Sodium Citrate Dihydrate', percentage: 3.0 }
  ];
  const mgdaCitrateCap = calculateFormulationChelationCapacity(mgdaCitrateFormula, 20);
  assertNear('Mixed Chelators', 'MGDA + Citrate Capacity', mgdaCitrateCap.totalSequestrationMg, 152.0);

  // EDTA Tetrasodium (1% = 0.2g * 220 = 44.0 mg) + GLDA 47% (2% = 54.8 mg) = 98.8 mg
  const edtaGldaFormula: FormulationIngredient[] = [
    { id: '1', name: 'EDTA Tetrasodium', percentage: 1.0 },
    { id: '2', name: 'GLDA 47% Liquid', percentage: 2.0 }
  ];
  const edtaGldaCap = calculateFormulationChelationCapacity(edtaGldaFormula, 20);
  assertNear('Mixed Chelators', 'EDTA + GLDA Capacity', edtaGldaCap.totalSequestrationMg, 98.8);

  // STPP 94% (5% = 1.0g * 180 = 180.0 mg) + GLDA 47% (2% = 54.8 mg) = 234.8 mg
  const stppGldaFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Tripolyphosphate (STPP 94%)', percentage: 5.0 },
    { id: '2', name: 'GLDA 47% Liquid', percentage: 2.0 }
  ];
  const stppGldaCap = calculateFormulationChelationCapacity(stppGldaFormula, 20);
  assertNear('Mixed Chelators', 'STPP + GLDA Capacity', stppGldaCap.totalSequestrationMg, 234.8);

  // =========================================================================
  // 5. SAFETY MARGIN & DYNAMIC ZERO-DEFICIT VERIFICATION
  // =========================================================================
  // Formula providing 3000 mg CaCO3 capacity for 100 ppm @ 10L (load = 1000 mg, target @ 25% = 1250 mg)
  const highCapacityFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 100 } // In 20g dose = 20g * 150 = 3000 mg
  ];
  const tolHigh = calculateWaterHardnessTolerance(highCapacityFormula, 100, 10, 20);
  assert(tolHigh.sufficiency === 'sufficient', 'Sufficiency Logic', 'High Capacity Formula is SUFFICIENT');
  assertNear('Sufficiency Logic', 'Zero Deficit for High Capacity Formula', tolHigh.capacityDeficitMg, 0);
  assertNear('Sufficiency Logic', 'Zero Additional GLDA Required', tolHigh.additionalGLDA47RequiredPct, 0);
  assertNear('Sufficiency Logic', 'Zero Additional Citrate Required', tolHigh.additionalCitrateRequiredPct, 0);
  assertNear('Sufficiency Logic', 'Zero Additional MGDA Required', tolHigh.additionalMGDA38RequiredPct, 0);

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P1 PHASE 2 TESTS : ${results.length}`);
  console.log(`PASSED                 : ${results.filter(r => r.passed).length}`);
  console.log(`FAILED                 : ${results.filter(r => !r.passed).length}`);
  console.log("--------------------------------------------------------------------------------");

  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results
  };
}

if (process.argv[1] && process.argv[1].includes('p1Phase2Chelation.regression.test')) {
  runP1Phase2ChelationTestSuite();
}

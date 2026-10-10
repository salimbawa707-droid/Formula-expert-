/**
 * ============================================================================
 * P0 PHASE 3 - REAL SCIENTIFIC pH ENGINE v2 INDEPENDENT REFERENCE TESTS
 * ============================================================================
 * Independent scientific benchmark suite verifying chemical equilibrium,
 * mass balance, electroneutrality charge balance, polyprotic speciation,
 * numerical convergence, and error diagnostics across 15+ benchmark cases.
 * ============================================================================
 */

import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import { NumericalEquilibriumSolver } from '../../domain/ph/numericalSolver';
import { normalizeFormulationComposition } from '../../domain/ph/compositionNormalizer';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';

export interface TestResult {
  name: string;
  group: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runPHEngineV2TestSuite(): { passed: number; failed: number; total: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any, message?: string) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
    });
  }

  function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number) {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    assert(
      group,
      name,
      passed,
      actual,
      `${expected} ± ${tolerance}`,
      passed ? `PASS (diff: ${diff.toFixed(4)})` : `FAIL: got ${actual}, expected ${expected} ± ${tolerance} (diff: ${diff.toFixed(4)})`
    );
  }

  // =========================================================================
  // TEST 1: Pure Water Near Neutral pH
  // =========================================================================
  const t1Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Water', percentage: 100 }]),
    100,
    { temperatureC: 25.0 }
  );
  assertNear('Phase 3 Reference Tests', 'Test 1: Pure water near neutral pH (pH = 7.00)', t1Res.pH, 7.00, 0.02);
  assert('Phase 3 Reference Tests', 'Test 1: Solver converged', t1Res.converged === true, t1Res.converged, true);

  // =========================================================================
  // TEST 2: Strong Acid Solution (0.01 M HCl)
  // =========================================================================
  const t2Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Hydrochloric Acid', percentage: 0.03646, activeMatterPct: 100 }]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 2: Strong acid solution (0.01M HCl -> pH = 2.00)', t2Res.pH, 2.00, 0.02);

  // =========================================================================
  // TEST 3: Strong Base Solution (0.01 M NaOH)
  // =========================================================================
  const t3Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Hydroxide', percentage: 0.040, activeMatterPct: 100 }]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 3: Strong base solution (0.01M NaOH -> pH = 12.00)', t3Res.pH, 12.00, 0.02);

  // =========================================================================
  // TEST 4: Strong Acid + Strong Base Neutralization (0.01M HCl + 0.01M NaOH)
  // =========================================================================
  const t4Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Hydrochloric Acid', percentage: 0.03646, activeMatterPct: 100 },
      { name: 'Sodium Hydroxide', percentage: 0.040, activeMatterPct: 100 }
    ]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 4: Equimolar HCl + NaOH neutralization (pH = 7.00)', t4Res.pH, 7.00, 0.02);

  // =========================================================================
  // TEST 5: Carbonate / Bicarbonate System
  // =========================================================================
  const t5Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Bicarbonate', percentage: 2.0 }]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 5: Amphiprotic Sodium Bicarbonate (pH = 8.34)', t5Res.pH, 8.34, 0.05);

  // =========================================================================
  // TEST 6: Citrate System Polyprotic Speciation
  // =========================================================================
  const t6Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Citric Acid', percentage: 2.0 },
      { name: 'Sodium Citrate', percentage: 2.0 }
    ]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 6: Citric Acid + Sodium Citrate buffer (pH = 4.35)', t6Res.pH, 4.35, 0.10);
  assert('Phase 3 Reference Tests', 'Test 6: Exposes citrate speciation breakdown', (t6Res.details.speciation?.length ?? 0) > 0, true, true);

  // =========================================================================
  // TEST 7: Phosphate System (Trisodium Phosphate TSP)
  // =========================================================================
  const t7Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'TSP Anhydrous', percentage: 1.0 }]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 7: Alkaline TSP Phosphate Hydrolysis (pH ~ 12.20)', t7Res.pH, 12.20, 0.50);

  // =========================================================================
  // TEST 8: Amine / Acid System (TEA Neutralization)
  // =========================================================================
  const t8Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Triethanolamine (TEA 99%)', percentage: 1.0, activeMatterPct: 100 }
    ]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 8: Triethanolamine Weak Base Hydrolysis (pH = 10.50)', t8Res.pH, 10.50, 0.10);

  // =========================================================================
  // TEST 9: LABSA Neutralization (LABSA + NaOH 1:1 Stoichiometric Equivalence)
  // =========================================================================
  const t9Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'LABSA', percentage: 3.2649, activeMatterPct: 100 },
      { name: 'NaOH', percentage: 0.400, activeMatterPct: 100 }
    ]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 9: LABSA + NaOH Stoichiometric Equivalence (pH = 7.00)', t9Res.pH, 7.00, 0.02);

  // =========================================================================
  // TEST 10: Sodium Metasilicate / Silicate System
  // =========================================================================
  const t10Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Metasilicate Pentahydrate', percentage: 1.0 }]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 10: Heavy duty Metasilicate builder hydrolysis (pH ~ 12.20)', t10Res.pH, 12.20, 0.30);

  // =========================================================================
  // TEST 11: Mixed Detergent-Style Formulation
  // =========================================================================
  const t11Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'LABSA', percentage: 8.0, activeMatterPct: 96 },
      { name: 'NaOH 100%', percentage: 1.0, activeMatterPct: 100 },
      { name: 'Soda Ash', percentage: 2.0 },
      { name: 'Sodium Citrate', percentage: 1.0 },
      { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
      { name: 'Water', percentage: 78.0 }
    ]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 11: Mixed detergent-style formulation (pH ~ 12.20)', t11Res.pH, 12.20, 0.40);
  assert('Phase 3 Reference Tests', 'Test 11: High confidence score (>80%)', t11Res.confidence > 80, t11Res.confidence, '> 80');

  // =========================================================================
  // TEST 12: Invalid / Missing-Data Formulation Handling
  // =========================================================================
  const t12Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Custom Secret Polymer XYZ', percentage: 5.0 }]),
    100
  );
  assertNear('Phase 3 Reference Tests', 'Test 12: Unmapped ingredient defaults safely to neutral water pH = 7.00', t12Res.pH, 7.00, 0.01);
  assert('Phase 3 Reference Tests', 'Test 12: Reports warning for unmapped ingredient', t12Res.warnings.length > 0, true, true);

  // =========================================================================
  // TEST 13: Numerical Solver Non-Convergent Safety Case
  // =========================================================================
  const t13Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Hydrochloric Acid', percentage: 1.0, activeMatterPct: 100 }]),
    100,
    { maxIterations: 0 }
  );
  assert('Phase 3 Reference Tests', 'Test 13: Zero-iteration limit handles NON_CONVERGED safely', t13Res.status === 'NON_CONVERGED' || t13Res.converged === false, t13Res.status, 'NON_CONVERGED');

  // =========================================================================
  // TEST 14: High Ionic Strength Limitation Case
  // =========================================================================
  const t14Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Sodium Chloride', percentage: 15.0 },
      { name: 'Sodium Hydroxide', percentage: 1.0 }
    ]),
    100
  );
  assert('Phase 3 Reference Tests', 'Test 14: Detects high ionic strength limitation regime', t14Res.modelValidity === 'LOW' || t14Res.modelValidity === 'OUT_OF_RANGE', t14Res.modelValidity, 'LOW or OUT_OF_RANGE');
  assert('Phase 3 Reference Tests', 'Test 14: Includes activity model warning', t14Res.warnings.some(w => w.includes('ionic strength') || w.includes('electrolyte')), true, true);

  // =========================================================================
  // TEST 15: Laundry Powder Slurry / Dilution Basis
  // =========================================================================
  const t15Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Soda Ash', percentage: 30.0 },
      { name: 'Sodium Sulfate', percentage: 50.0 },
      { name: 'LABSA', percentage: 10.0, activeMatterPct: 96 },
      { name: 'STPP', percentage: 10.0 }
    ]),
    100,
    { productCategory: 'LAUNDRY_POWDER', assumeSlurryBasisIfPowder: true, slurryConcentrationPct: 1.0 }
  );
  assertNear('Phase 3 Reference Tests', 'Test 15: Laundry Powder evaluated on 1% aqueous slurry basis (pH ~11.00)', t15Res.pH, 11.00, 0.40);
  assert('Phase 3 Reference Tests', 'Test 15: Explicitly notes 1% slurry basis assumption', t15Res.assumptions.some(a => a.includes('1% aqueous slurry')), true, true);

  // =========================================================================
  // TEST 16: Solver Algorithm Identity & Metadata Integrity
  // =========================================================================
  assert(
    'Phase 3 Reference Tests',
    'Test 16: PHEngineV2 exposes authentic solver metadata string',
    t2Res.method === 'Safeguarded Newton-Raphson with Bracketed Bisection Fallback',
    t2Res.method,
    'Safeguarded Newton-Raphson with Bracketed Bisection Fallback'
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 16: PHEngineV2 modelType contains authentic solver algorithm name',
    t2Res.details.modelType.includes('Safeguarded Newton-Raphson with Bracketed Bisection Fallback'),
    t2Res.details.modelType,
    'Rigorous Chemical Equilibrium (Safeguarded Newton-Raphson with Bracketed Bisection Fallback)'
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 16: PHEngineV2 does NOT report nonexistent Brent method',
    !t2Res.method.toLowerCase().includes('brent'),
    t2Res.method,
    'No Brent claims'
  );

  // =========================================================================
  // TEST 17: Executable Control Flow Verification (Newton vs Bisection Steps)
  // =========================================================================
  const t17Comp = normalizeFormulationComposition(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Citric Acid', percentage: 2.0 }, { name: 'Water', percentage: 98.0 }]),
    100
  );
  const t17Res = NumericalEquilibriumSolver.solve(t17Comp, 25.0);
  assert(
    'Phase 3 Reference Tests',
    'Test 17: Solver converges and returns exact canonical method',
    t17Res.converged && t17Res.method === 'Safeguarded Newton-Raphson with Bracketed Bisection Fallback',
    t17Res.method,
    'Safeguarded Newton-Raphson with Bracketed Bisection Fallback'
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 17: Solver executes actual Newton steps in smooth well-conditioned domain',
    (t17Res.log ?? []).some(step => step.method === 'newton'),
    true,
    true
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 17: Solver log records zero Brent steps',
    (t17Res.log ?? []).every(step => step.method === 'newton' || step.method === 'bisection'),
    true,
    true
  );

  // =========================================================================
  // TEST 18: Bisection Fallback Execution Under Forced Overshoot
  // =========================================================================
  const t18Comp = normalizeFormulationComposition(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Hydroxide', percentage: 2.0 }]),
    100
  );
  const t18Res = NumericalEquilibriumSolver.solve(t18Comp, 25.0, { initialGuess: 0.0 });
  assert(
    'Phase 3 Reference Tests',
    'Test 18: Solver converges under extreme initial guess',
    t18Res.converged,
    t18Res.converged,
    true
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 18: Solver triggers bisection fallback when candidate exceeds bracket',
    (t18Res.log ?? []).some(step => step.method === 'bisection'),
    true,
    true
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return { passed, failed, total: results.length, results };
}

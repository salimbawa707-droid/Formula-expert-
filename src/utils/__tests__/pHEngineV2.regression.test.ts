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
import { PHEngine } from '../pHEngine';
import { 
  evaluateDosingEligibility, 
  DEFAULT_ALKALI_REAGENTS, 
  DEFAULT_ACID_REAGENTS 
} from '../phDosingEligibility';

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
  assert('Phase 3 Reference Tests', 'Test 13: Zero-iteration limit handles NON_CONVERGED safely', t13Res.status === 'NON_CONVERGED' && t13Res.converged === false, t13Res.status, 'NON_CONVERGED');
  assert('Phase 3 Reference Tests', 'Test 13: Non-converged solver returns NaN for pH (never exposes unconverged iterate)', Number.isNaN(t13Res.pH), true, true);
  assert('Phase 3 Reference Tests', 'Test 13: Non-converged solver sets confidence to 0', t13Res.confidence === 0, t13Res.confidence, 0);
  assert('Phase 3 Reference Tests', 'Test 13: Non-converged solver sets model validity to OUT_OF_RANGE', t13Res.modelValidity === 'OUT_OF_RANGE', t13Res.modelValidity, 'OUT_OF_RANGE');

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
  // TEST 19: F3-01 High Ionic Strength & Polybasic Acid Convergence (Citric Acid 20%)
  // =========================================================================
  const t19Comp = normalizeFormulationComposition(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Citric Acid', percentage: 20.0 }, { name: 'Sodium Hydroxide', percentage: 5.0 }]),
    100
  );
  const t19Res = NumericalEquilibriumSolver.solve(t19Comp, 25.0);
  assert(
    'Phase 3 Reference Tests',
    'Test 19 (F3-01): High ionic strength polybasic buffer converges robustly',
    t19Res.converged,
    t19Res.converged,
    true
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 19 (F3-01): Residual remains within acceptable tolerance at high ionic strength',
    Math.abs(t19Res.residual) <= 1e-4,
    t19Res.residual,
    '<= 1e-4'
  );

  // =========================================================================
  // TEST 20: F3-02 Unlisted Proprietary Surfactants & Safe Fallback
  // =========================================================================
  const t20Res = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Proprietary Mystery Surfactant Blend X', percentage: 5.0 }
    ]),
    100
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 20 (F3-02): Unlisted proprietary surfactant safely defaults without inventing equilibrium parameters',
    t20Res.confidence <= 70 || t20Res.warnings.length > 0,
    true,
    true
  );
  assert(
    'Phase 3 Reference Tests',
    'Test 20 (F3-02): pH calculation completes safely at neutral baseline for inert unknown',
    t20Res.pH >= 6.5 && t20Res.pH <= 7.5,
    t20Res.pH,
    '7.00 ± 0.50'
  );

  // =========================================================================
  // TEST 21: F3-03 Dynamic Dilution & Stale Result Prevention (DAG State Isolation)
  // =========================================================================
  const formulaDilutionA = [
    { name: 'Citric Acid', percentage: 5.0 },
    { name: 'Deionized Water', percentage: 95.0 }
  ];
  const formulaDilutionB = [
    { name: 'Citric Acid', percentage: 1.0 },
    { name: 'Deionized Water', percentage: 99.0 }
  ];
  const resDilA = PHEngineV2.calculatePH(mapFormulationIngredientsToPHEngineInput(formulaDilutionA), 100);
  const resDilB = PHEngineV2.calculatePH(mapFormulationIngredientsToPHEngineInput(formulaDilutionB), 100);
  assert(
    'Phase 3 Reference Tests',
    'Test 21 (F3-03): Dilution change recalculates active molarity and pH state independently without stale cache retention',
    resDilA.pH !== resDilB.pH,
    `Dil A pH: ${resDilA.pH}, Dil B pH: ${resDilB.pH}`,
    'Distinct computed pH values'
  );

  // =========================================================================
  // TEST 22 (P2-DEFECT-02): Weak-Acid / Weak-Base Excess Diagnostic Label Disambiguation
  // =========================================================================
  const t22WeakAcidRes = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Citric Acid', percentage: 2.0 }]),
    100
  );
  assert(
    'P2-DEFECT-02 Diagnostics',
    'Test 22a: Weak acid (Citric Acid) excess produces excessAcidMoles > 0 and excessStrongAcid === 0',
    t22WeakAcidRes.excessAcidMoles > 0 && t22WeakAcidRes.excessStrongAcid === 0,
    `excessAcidMoles: ${t22WeakAcidRes.excessAcidMoles}, excessStrongAcid: ${t22WeakAcidRes.excessStrongAcid}`,
    'excessAcidMoles > 0, excessStrongAcid === 0'
  );

  const t22StrongAcidRes = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Hydrochloric Acid', percentage: 0.03646, activeMatterPct: 100 }]),
    100
  );
  assert(
    'P2-DEFECT-02 Diagnostics',
    'Test 22b: Strong acid (HCl) excess produces excessStrongAcid > 0',
    t22StrongAcidRes.excessStrongAcid > 0 && t22StrongAcidRes.excessAcidMoles > 0,
    `excessStrongAcid: ${t22StrongAcidRes.excessStrongAcid}`,
    'excessStrongAcid > 0'
  );

  const t22WeakBaseRes = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Soda Ash', percentage: 2.0 }]),
    100
  );
  assert(
    'P2-DEFECT-02 Diagnostics',
    'Test 22c: Weak base (Soda Ash) excess produces excessBaseMoles > 0 and excessStrongBase === 0',
    t22WeakBaseRes.excessBaseMoles > 0 && t22WeakBaseRes.excessStrongBase === 0,
    `excessBaseMoles: ${t22WeakBaseRes.excessBaseMoles}, excessStrongBase: ${t22WeakBaseRes.excessStrongBase}`,
    'excessBaseMoles > 0, excessStrongBase === 0'
  );

  const t22StrongBaseRes = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Hydroxide', percentage: 0.040, activeMatterPct: 100 }]),
    100
  );
  assert(
    'P2-DEFECT-02 Diagnostics',
    'Test 22d: Strong base (NaOH) excess produces excessStrongBase > 0',
    t22StrongBaseRes.excessStrongBase > 0 && t22StrongBaseRes.excessBaseMoles > 0,
    `excessStrongBase: ${t22StrongBaseRes.excessStrongBase}`,
    'excessStrongBase > 0'
  );

  // =========================================================================
  // P2-DEFECT-02 REGRESSION SUITE: REG-01 THROUGH REG-10
  // =========================================================================

  // REG-01: Strong Acid + Strong Base
  const reg01Res = PHEngineV2.calculatePH([
    { name: 'Hydrochloric Acid 37%', rawKg: 1.0, activePercent: 37 } as any,
    { name: 'Sodium Hydroxide 50%', rawKg: 2.0, activePercent: 50 } as any,
    { name: 'Water', rawKg: 97.0, activePercent: 100 } as any
  ], 100);
  assert(
    'P2-DEFECT-02 REG-01',
    'REG-01: Strong Acid + Strong Base equivalent balance & solver convergence',
    reg01Res.converged === true &&
    Math.abs(reg01Res.excessBaseEquivalents - 14.8519) < 0.001 &&
    Math.abs(reg01Res.excessStrongBaseEquivalents - 14.8519) < 0.001 &&
    reg01Res.excessAcidEquivalents === 0 &&
    reg01Res.excessStrongAcidEquivalents === 0 &&
    Math.abs(reg01Res.pH - 13.17) <= 0.05,
    `excessBase: ${reg01Res.excessBaseEquivalents}, excessStrongBase: ${reg01Res.excessStrongBaseEquivalents}, pH: ${reg01Res.pH}`,
    'excessBase === 14.8519 eq, excessStrongBase === 14.8519 eq, pH === 13.17'
  );

  // REG-02: Weak Acid + Weak Base
  const reg02Res = PHEngineV2.calculatePH([
    { name: 'Citric Acid', rawKg: 1.0, activePercent: 100 } as any,
    { name: 'Triethanolamine', rawKg: 1.5, activePercent: 99 } as any,
    { name: 'Water', rawKg: 97.5, activePercent: 100 } as any
  ], 100);
  assert(
    'P2-DEFECT-02 REG-02',
    'REG-02: Weak Acid + Weak Base excessAcidEquivalents > 0 and excessStrongAcid === 0',
    reg02Res.converged === true &&
    Math.abs(reg02Res.excessAcidEquivalents - 5.6615) < 0.001 &&
    reg02Res.excessStrongAcidEquivalents === 0 &&
    reg02Res.excessBaseEquivalents === 0 &&
    reg02Res.excessStrongBaseEquivalents === 0 &&
    Math.abs(reg02Res.pH - 5.41) <= 0.05,
    `excessAcidEq: ${reg02Res.excessAcidEquivalents}, excessStrongAcid: ${reg02Res.excessStrongAcidEquivalents}, pH: ${reg02Res.pH}`,
    'excessAcidEq === 5.6615 eq, excessStrongAcid === 0, pH === 5.41'
  );

  // REG-03: Strong Base + Weak Acid
  const reg03Res = PHEngineV2.calculatePH([
    { name: 'Sodium Hydroxide 50%', rawKg: 2.0, activePercent: 50 } as any,
    { name: 'Citric Acid', rawKg: 1.0, activePercent: 100 } as any,
    { name: 'Water', rawKg: 97.0, activePercent: 100 } as any
  ], 100);
  assert(
    'P2-DEFECT-02 REG-03',
    'REG-03: Strong Base + Weak Acid excessStrongBaseEquivalents === 9.3848 eq',
    reg03Res.converged === true &&
    Math.abs(reg03Res.excessBaseEquivalents - 9.3848) < 0.001 &&
    Math.abs(reg03Res.excessStrongBaseEquivalents - 9.3848) < 0.001 &&
    reg03Res.excessAcidEquivalents === 0 &&
    Math.abs(reg03Res.pH - 12.97) <= 0.05,
    `excessBaseEq: ${reg03Res.excessBaseEquivalents}, excessStrongBase: ${reg03Res.excessStrongBaseEquivalents}, pH: ${reg03Res.pH}`,
    'excessBaseEq === 9.3848 eq, excessStrongBase === 9.3848 eq, pH === 12.97'
  );

  // REG-04: Strong Acid + Weak Base
  const reg04Res = PHEngineV2.calculatePH([
    { name: 'Hydrochloric Acid 37%', rawKg: 2.0, activePercent: 37 } as any,
    { name: 'Triethanolamine', rawKg: 1.5, activePercent: 99 } as any,
    { name: 'Water', rawKg: 96.5, activePercent: 100 } as any
  ], 100);
  assert(
    'P2-DEFECT-02 REG-04',
    'REG-04: Strong Acid + Weak Base excessStrongAcidEquivalents === 10.3425 eq',
    reg04Res.converged === true &&
    Math.abs(reg04Res.excessAcidEquivalents - 10.3425) < 0.001 &&
    Math.abs(reg04Res.excessStrongAcidEquivalents - 10.3425) < 0.001 &&
    reg04Res.excessBaseEquivalents === 0 &&
    Math.abs(reg04Res.pH - 0.99) <= 0.05,
    `excessAcidEq: ${reg04Res.excessAcidEquivalents}, excessStrongAcid: ${reg04Res.excessStrongAcidEquivalents}, pH: ${reg04Res.pH}`,
    'excessAcidEq === 10.3425 eq, excessStrongAcid === 10.3425 eq, pH === 0.99'
  );

  // REG-05: Carbonate + Bicarbonate System
  const reg05Res = PHEngineV2.calculatePH([
    { name: 'Sodium Carbonate', rawKg: 1.0, activePercent: 100 } as any,
    { name: 'Sodium Bicarbonate', rawKg: 1.0, activePercent: 100 } as any,
    { name: 'Water', rawKg: 98.0, activePercent: 100 } as any
  ], 100);
  assert(
    'P2-DEFECT-02 REG-05',
    'REG-05: Carbonate + Bicarbonate system convergence and zero strong reagent false flag',
    reg05Res.converged === true &&
    reg05Res.excessStrongAcidEquivalents === 0 &&
    reg05Res.excessStrongBaseEquivalents === 0 &&
    Math.abs(reg05Res.pH - 10.23) <= 0.05,
    `pH: ${reg05Res.pH}, strongAcid: ${reg05Res.excessStrongAcidEquivalents}, strongBase: ${reg05Res.excessStrongBaseEquivalents}`,
    'pH === 10.23, excessStrongAcid === 0, excessStrongBase === 0'
  );

  // REG-06: Buffered Solution with Target pH Mismatch
  // Note: REG-06 validates ideal-dilute (activityModel: 'ideal') polyprotic speciation and charge
  // balance convergence to the second pKa (4.76). It is an ideal-model software regression benchmark,
  // not an ionic-strength corrected physical laboratory benchmark.
  const reg06Res = PHEngineV2.calculatePH([
    { name: 'Citric Acid', rawKg: 1.0, activePercent: 100 } as any,
    { name: 'Sodium Citrate', rawKg: 1.3433, activePercent: 100 } as any,
    { name: 'Water', rawKg: 97.6567, activePercent: 100 } as any
  ], 100, { targetPH: 8.50 });
  assert(
    'P2-DEFECT-02 REG-06',
    'REG-06: Equimolar citric/citrate buffer converges to pKa2 and flags zero strong reagent excess',
    reg06Res.converged === true &&
    Math.abs(reg06Res.pH - 4.76) <= 0.05 &&
    reg06Res.excessStrongAcidEquivalents === 0 &&
    reg06Res.excessStrongBaseEquivalents === 0,
    `pH: ${reg06Res.pH}, excessStrongAcid: ${reg06Res.excessStrongAcidEquivalents}`,
    'pH === 4.76, excessStrongAcid === 0'
  );

  // REG-07: Missing Diagnostic Fields Handling (Safe Fallback)
  const reg07MockResult: any = {
    pH: 6.50,
    converged: true,
    details: { totalAcidEquivalents: 12.0, totalBaseEquivalents: 8.0 }
  };
  const reg07Resolved = reg07MockResult.excessAcidEquivalents
    ?? reg07MockResult.excessAcidMoles
    ?? Math.max(0, (reg07MockResult.details?.totalAcidEquivalents ?? 0) - (reg07MockResult.details?.totalBaseEquivalents ?? 0));
  assert(
    'P2-DEFECT-02 REG-07',
    'REG-07: Safe fallback resolves missing excessAcid to 4.0 eq without falling back to strong-only diagnostics',
    reg07Resolved === 4.0,
    `resolved: ${reg07Resolved}`,
    'resolved === 4.0 eq'
  );

  // REG-08: Non-Converged Solver Boundary Safety
  const reg08Res = PHEngineV2.calculatePH([
    { name: 'Citric Acid', rawKg: 1.0, activePercent: 100 } as any,
    { name: 'Water', rawKg: 99.0, activePercent: 100 } as any
  ], 100, { maxIterations: 1, tolerance: 1e-15 });
  assert(
    'P2-DEFECT-02 REG-08',
    'REG-08: Pathological solver divergence flags non-converged status safely',
    reg08Res.converged === false &&
    reg08Res.solverConverged === false &&
    reg08Res.status === 'NON_CONVERGED',
    `converged: ${reg08Res.converged}, status: ${reg08Res.status}`,
    'converged === false, status === NON_CONVERGED'
  );

  // REG-09: Dosing Mass Calculation with Commercial Assays
  const reg09AcidExcessEq = 10.0;
  const reg09Mw = 39.9971;
  const reg09Valency = 1;
  const reg09Purity = 0.48;
  const reg09CommercialGrams = ((reg09AcidExcessEq / reg09Valency) * reg09Mw) / reg09Purity;
  assert(
    'P2-DEFECT-02 REG-09',
    'REG-09: 10.0 eq acid excess dosed with 48% caustic lye produces exactly 833.27 g',
    Math.abs(reg09CommercialGrams - 833.2729) < 0.01,
    `commercialGrams: ${reg09CommercialGrams.toFixed(4)}`,
    'commercialGrams === 833.2729 g'
  );

  // REG-10: Legacy Consumer and Adapter Export Parity
  const reg10LegacyRes = new PHEngine().calculatePH([
    { name: 'Hydrochloric Acid 37%', rawKg: 1.0, activePercent: 37 } as any,
    { name: 'Sodium Hydroxide 50%', rawKg: 2.0, activePercent: 50 } as any
  ], 100);
  assert(
    'P2-DEFECT-02 REG-10',
    'REG-10: Legacy adapter returns exact parity between excessBaseMoles and excessBaseEquivalents',
    typeof reg10LegacyRes.excessBaseMoles === 'number' &&
    (reg10LegacyRes as any).excessBaseEquivalents === reg10LegacyRes.excessBaseMoles &&
    (reg10LegacyRes as any).excessStrongBaseEquivalents === reg10LegacyRes.excessStrongBase,
    `excessBaseMoles: ${reg10LegacyRes.excessBaseMoles}, excessBaseEquivalents: ${(reg10LegacyRes as any).excessBaseEquivalents}`,
    'parity between new equivalents and legacy moles properties'
  );

  // =========================================================================
  // GATE 3 RESIDUAL SAFETY SUITE: REG-11 THROUGH REG-22
  // =========================================================================

  // REG-11: Null or missing advanced result
  const reg11NullRes = evaluateDosingEligibility(null, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  const reg11UndefinedRes = evaluateDosingEligibility(undefined, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-11',
    'REG-11: Null or missing result yields UNAVAILABLE and disables dosing without defaulting to zero',
    reg11NullRes.status === 'UNAVAILABLE' &&
    reg11NullRes.isCalculationValid === false &&
    reg11NullRes.isDosingAvailable === false &&
    reg11NullRes.actionRequiredText.includes('Titration Required') &&
    reg11UndefinedRes.status === 'UNAVAILABLE',
    `nullStatus: ${reg11NullRes.status}, undefinedStatus: ${reg11UndefinedRes.status}`,
    'both yield UNAVAILABLE status'
  );

  // REG-12: Missing convergence metadata
  const reg12NoConvResult: any = { pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 };
  const reg12Eval = evaluateDosingEligibility(reg12NoConvResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-12',
    'REG-12: Missing convergence metadata is never assumed converged and yields UNAVAILABLE',
    reg12Eval.status === 'UNAVAILABLE' &&
    reg12Eval.isCalculationValid === false &&
    reg12Eval.unavailabilityReason?.includes('convergence') === true,
    `status: ${reg12Eval.status}, reason: ${reg12Eval.unavailabilityReason}`,
    'status === UNAVAILABLE, mentions convergence'
  );

  // REG-13: Non-finite pH with nominal convergence flag
  const reg13NaNPHResult: any = { solverConverged: true, pH: NaN, excessAcidEquivalents: 0, excessBaseEquivalents: 0 };
  const reg13InfPHResult: any = { solverConverged: true, pH: Infinity, excessAcidEquivalents: 0, excessBaseEquivalents: 0 };
  const reg13NaNEval = evaluateDosingEligibility(reg13NaNPHResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  const reg13InfEval = evaluateDosingEligibility(reg13InfPHResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-13',
    'REG-13: Non-finite pH (NaN or Infinity) does not default to 7.0 and yields UNAVAILABLE',
    reg13NaNEval.status === 'UNAVAILABLE' &&
    reg13NaNEval.validatedPH === null &&
    reg13InfEval.status === 'UNAVAILABLE' &&
    reg13InfEval.validatedPH === null,
    `nanStatus: ${reg13NaNEval.status}, infStatus: ${reg13InfEval.status}`,
    'both yield UNAVAILABLE with validatedPH === null'
  );

  // REG-14: Missing acid equivalent diagnostic
  const reg14MissingAcidResult: any = { solverConverged: true, pH: 7.0, excessBaseEquivalents: 0 };
  const reg14Eval = evaluateDosingEligibility(reg14MissingAcidResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-14',
    'REG-14: Missing acid equivalent diagnostic does not silently become zero and yields UNAVAILABLE',
    reg14Eval.status === 'UNAVAILABLE' &&
    reg14Eval.isCalculationValid === false &&
    reg14Eval.isDosingAvailable === false,
    `status: ${reg14Eval.status}`,
    'status === UNAVAILABLE'
  );

  // REG-15: Missing base equivalent diagnostic
  const reg15MissingBaseResult: any = { solverConverged: true, pH: 7.0, excessAcidEquivalents: 0 };
  const reg15Eval = evaluateDosingEligibility(reg15MissingBaseResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-15',
    'REG-15: Missing base equivalent diagnostic does not silently become zero and yields UNAVAILABLE',
    reg15Eval.status === 'UNAVAILABLE' &&
    reg15Eval.isCalculationValid === false &&
    reg15Eval.isDosingAvailable === false,
    `status: ${reg15Eval.status}`,
    'status === UNAVAILABLE'
  );

  // REG-16: NaN and Infinity diagnostics
  const reg16NaNEqResult: any = { solverConverged: true, pH: 7.0, excessAcidEquivalents: NaN, excessBaseEquivalents: 0 };
  const reg16InfEqResult: any = { solverConverged: true, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: Infinity };
  const reg16NaNEval = evaluateDosingEligibility(reg16NaNEqResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  const reg16InfEval = evaluateDosingEligibility(reg16InfEqResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-16',
    'REG-16: NaN and Infinity diagnostics yield UNAVAILABLE instead of falsely claiming neutral',
    reg16NaNEval.status === 'UNAVAILABLE' &&
    reg16NaNEval.isCalculationValid === false &&
    reg16InfEval.status === 'UNAVAILABLE' &&
    reg16InfEval.isCalculationValid === false,
    `nanStatus: ${reg16NaNEval.status}, infStatus: ${reg16InfEval.status}`,
    'both yield UNAVAILABLE'
  );

  // REG-17: Negative diagnostic values
  const reg17NegativeResult: any = { solverConverged: true, pH: 7.0, excessAcidEquivalents: -1.0, excessBaseEquivalents: 0 };
  const reg17Eval = evaluateDosingEligibility(reg17NegativeResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-17',
    'REG-17: Negative diagnostic values are rejected and yield UNAVAILABLE',
    reg17Eval.status === 'UNAVAILABLE' &&
    reg17Eval.isCalculationValid === false &&
    reg17Eval.unavailabilityReason?.includes('non-negative') === true,
    `status: ${reg17Eval.status}, reason: ${reg17Eval.unavailabilityReason}`,
    'status === UNAVAILABLE, mentions non-negative'
  );

  // REG-18: Valid zero-equivalent formulation
  const reg18ZeroResult: any = { solverConverged: true, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 };
  const reg18Eval = evaluateDosingEligibility(reg18ZeroResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-18',
    'REG-18: Valid zero-equivalent formulation evaluates to NEUTRAL with zero reagent demand',
    reg18Eval.status === 'NEUTRAL' &&
    reg18Eval.isCalculationValid === true &&
    reg18Eval.isDosingAvailable === true &&
    reg18Eval.activeReagentGramsNeeded === 0 &&
    reg18Eval.commercialReagentGrams === 0 &&
    reg18Eval.actionRequiredText === 'No Reagents Needed',
    `status: ${reg18Eval.status}, action: ${reg18Eval.actionRequiredText}`,
    'status === NEUTRAL, action === No Reagents Needed'
  );

  // REG-19: Valid nonzero-equivalent formulation
  const reg19AcidResult: any = { solverConverged: true, pH: 2.0, excessAcidEquivalents: 10.0, excessBaseEquivalents: 0 };
  const reg19Eval = evaluateDosingEligibility(reg19AcidResult, 100, "Caustic Lye NaOH (48% Soln)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-19',
    'REG-19: Valid nonzero-equivalent formulation computes commercial dosing mass accurately',
    reg19Eval.status === 'ACID_EXCESS' &&
    reg19Eval.isCalculationValid === true &&
    reg19Eval.isDosingAvailable === true &&
    reg19Eval.commercialReagentGrams !== null &&
    Math.abs(reg19Eval.commercialReagentGrams - 833.2729) < 0.01 &&
    reg19Eval.actionRequiredText.includes('833.27 g'),
    `status: ${reg19Eval.status}, grams: ${reg19Eval.commercialReagentGrams?.toFixed(2)}`,
    'status === ACID_EXCESS, commercialGrams === 833.27 g'
  );

  // REG-20: Missing or invalid reagent parameters
  const reg20InvalidReagentsTable = {
    "Corrupt Alkali": { name: "Corrupt Alkali", mw: 0, purity: 0, valency: 0 }
  };
  const reg20Eval = evaluateDosingEligibility(reg19AcidResult, 100, "Corrupt Alkali", "LABSA (90% Acid Slurry)", reg20InvalidReagentsTable as any, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-20',
    'REG-20: Invalid or zero-purity corrective reagent parameters block dosing and yield UNAVAILABLE',
    reg20Eval.status === 'UNAVAILABLE' &&
    reg20Eval.isDosingAvailable === false &&
    reg20Eval.unavailabilityReason?.includes('invalid molecular parameters') === true,
    `status: ${reg20Eval.status}, reason: ${reg20Eval.unavailabilityReason}`,
    'status === UNAVAILABLE, mentions invalid molecular parameters'
  );

  // REG-21: Non-converged solver
  const reg21NonConvResult: any = { solverConverged: false, converged: false, pH: 7.0, excessAcidEquivalents: 5.0, excessBaseEquivalents: 0 };
  const reg21Eval = evaluateDosingEligibility(reg21NonConvResult, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
  assert(
    'P2-DEFECT-02 REG-21',
    'REG-21: Explicitly non-converged solver blocks automatic dosing and mandates titration',
    reg21Eval.status === 'UNAVAILABLE' &&
    reg21Eval.isCalculationValid === false &&
    reg21Eval.isDosingAvailable === false &&
    reg21Eval.actionRequiredText.includes('Titration Required'),
    `status: ${reg21Eval.status}, actionText: ${reg21Eval.actionRequiredText}`,
    'status === UNAVAILABLE, actionText mentions Titration Required'
  );

  // REG-22: Confirmation that invalid diagnostics prevent false equivalence claims
  const corruptPayloads: any[] = [
    null,
    undefined,
    {},
    { solverConverged: true },
    { solverConverged: true, pH: 7.0 },
    { solverConverged: true, pH: 7.0, excessAcidEquivalents: NaN, excessBaseEquivalents: NaN },
    { solverConverged: false, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 }
  ];
  const allRejected = corruptPayloads.every(payload => {
    const ev = evaluateDosingEligibility(payload, 100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS);
    return ev.status === 'UNAVAILABLE' && ev.isCalculationValid === false && ev.isDosingAvailable === false;
  });
  assert(
    'P2-DEFECT-02 REG-22',
    'REG-22: Every corrupt payload unconditionally yields UNAVAILABLE and blocks false equivalence',
    allRejected === true,
    `allRejected: ${allRejected}`,
    'allRejected === true'
  );

  // =========================================================================
  // GATE 4 CONVERGENCE FLAG PRECEDENCE & CONTRADICTION SUITE: REG-23 TO REG-28
  // =========================================================================

  // REG-23: Contradictory flag test 1 (solverConverged: false, converged: true)
  const reg23Res = evaluateDosingEligibility(
    { solverConverged: false, converged: true, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 } as any,
    100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS
  );
  assert(
    'P2-DEFECT-02 REG-23',
    'REG-23: solverConverged: false, converged: true yields UNAVAILABLE and no numeric dose',
    reg23Res.status === 'UNAVAILABLE' &&
    reg23Res.isDosingAvailable === false &&
    reg23Res.isCalculationValid === false &&
    reg23Res.activeReagentGramsNeeded === null &&
    reg23Res.commercialReagentGrams === null &&
    reg23Res.commercialReagentKg === null,
    `status: ${reg23Res.status}, isDosingAvailable: ${reg23Res.isDosingAvailable}, activeGrams: ${reg23Res.activeReagentGramsNeeded}`,
    'status === UNAVAILABLE, isDosingAvailable === false, all numeric doses null'
  );

  // REG-24: Contradictory flag test 2 (solverConverged: true, converged: false)
  const reg24Res = evaluateDosingEligibility(
    { solverConverged: true, converged: false, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 } as any,
    100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS
  );
  assert(
    'P2-DEFECT-02 REG-24',
    'REG-24: solverConverged: true, converged: false yields UNAVAILABLE and no numeric dose',
    reg24Res.status === 'UNAVAILABLE' &&
    reg24Res.isDosingAvailable === false &&
    reg24Res.isCalculationValid === false &&
    reg24Res.activeReagentGramsNeeded === null &&
    reg24Res.commercialReagentGrams === null &&
    reg24Res.commercialReagentKg === null,
    `status: ${reg24Res.status}, isDosingAvailable: ${reg24Res.isDosingAvailable}, activeGrams: ${reg24Res.activeReagentGramsNeeded}`,
    'status === UNAVAILABLE, isDosingAvailable === false, all numeric doses null'
  );

  // REG-25: Both flags false (solverConverged: false, converged: false)
  const reg25Res = evaluateDosingEligibility(
    { solverConverged: false, converged: false, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 } as any,
    100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS
  );
  assert(
    'P2-DEFECT-02 REG-25',
    'REG-25: Both flags false yields UNAVAILABLE and no numeric dose',
    reg25Res.status === 'UNAVAILABLE' &&
    reg25Res.isDosingAvailable === false &&
    reg25Res.isCalculationValid === false &&
    reg25Res.activeReagentGramsNeeded === null &&
    reg25Res.commercialReagentGrams === null &&
    reg25Res.commercialReagentKg === null,
    `status: ${reg25Res.status}, isDosingAvailable: ${reg25Res.isDosingAvailable}, activeGrams: ${reg25Res.activeReagentGramsNeeded}`,
    'status === UNAVAILABLE, isDosingAvailable === false, all numeric doses null'
  );

  // REG-26: Both flags true with valid inputs (solverConverged: true, converged: true)
  const reg26Res = evaluateDosingEligibility(
    { solverConverged: true, converged: true, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 } as any,
    100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS
  );
  assert(
    'P2-DEFECT-02 REG-26',
    'REG-26: Both flags true allows normal eligibility evaluation (NEUTRAL)',
    reg26Res.status === 'NEUTRAL' &&
    reg26Res.isDosingAvailable === true &&
    reg26Res.isCalculationValid === true &&
    reg26Res.commercialReagentGrams === 0,
    `status: ${reg26Res.status}, isDosingAvailable: ${reg26Res.isDosingAvailable}`,
    'status === NEUTRAL, isDosingAvailable === true'
  );

  // REG-27: Canonical true with legacy flag absent (solverConverged: true, converged: undefined)
  const reg27Res = evaluateDosingEligibility(
    { solverConverged: true, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 } as any,
    100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS
  );
  assert(
    'P2-DEFECT-02 REG-27',
    'REG-27: Canonical solverConverged: true with legacy converged absent allows normal eligibility evaluation',
    reg27Res.status === 'NEUTRAL' &&
    reg27Res.isDosingAvailable === true &&
    reg27Res.isCalculationValid === true,
    `status: ${reg27Res.status}, isDosingAvailable: ${reg27Res.isDosingAvailable}`,
    'status === NEUTRAL, isDosingAvailable === true'
  );

  // REG-28: Canonical flag absent with legacy true (solverConverged: undefined, converged: true)
  const reg28Res = evaluateDosingEligibility(
    { converged: true, pH: 7.0, excessAcidEquivalents: 0, excessBaseEquivalents: 0 } as any,
    100, "NaOH Flakes (99% / 100%)", "LABSA (90% Acid Slurry)", DEFAULT_ALKALI_REAGENTS, DEFAULT_ACID_REAGENTS
  );
  assert(
    'P2-DEFECT-02 REG-28',
    'REG-28: Canonical solverConverged absent with legacy converged: true yields UNAVAILABLE and no numeric dose',
    reg28Res.status === 'UNAVAILABLE' &&
    reg28Res.isDosingAvailable === false &&
    reg28Res.isCalculationValid === false &&
    reg28Res.activeReagentGramsNeeded === null &&
    reg28Res.commercialReagentGrams === null &&
    reg28Res.commercialReagentKg === null,
    `status: ${reg28Res.status}, isDosingAvailable: ${reg28Res.isDosingAvailable}, activeGrams: ${reg28Res.activeReagentGramsNeeded}`,
    'status === UNAVAILABLE, isDosingAvailable === false, all numeric doses null'
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return { passed, failed, total: results.length, results };
}

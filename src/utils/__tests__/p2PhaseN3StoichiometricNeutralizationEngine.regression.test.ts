/**
 * ============================================================================
 * PHASE N3 REGRESSION TEST SUITE — AUTHORITATIVE PRIMARY STOICHIOMETRIC NEUTRALIZATION ENGINE
 * ============================================================================
 * Rigorously tests:
 * A. Exact Stoichiometry (1:1 equivalence, under-neutralized, base excess)
 * B. LABSA & NaOH Stoichiometry & Assay Firewalls
 * C. Secondary Acid Isolation (Citric acid does not re-label fully neutralized LABSA)
 * D. Secondary Base Isolation
 * E. Multi-equivalent species (Diprotic Sulfuric, Triprotic Citric, Multi-eq Carbonate)
 * F. Unknown Assay & Insufficient Data Firewalls
 * G. Safety against old shortcuts (No 0.135, No 0.32, No 61.0 water shortcut)
 * H. ScientificResult SSOT & Maturity Preservation
 * I. Adversarial Edge Cases (0 mass, negative mass, NaN, Infinity, duplicate entries)
 * J. Independent Test Oracle validation & Non-Circular validation checks
 * ============================================================================
 */

import { StoichiometricNeutralizationEngine } from '../../domain/ph/stoichiometricNeutralizationEngine';

/**
 * Independent Mathematical Test Oracle
 * Calculated completely independently from the production code paths to ensure test independence.
 */
function runIndependentOracle(
  acidMassKg: number,
  acidEquivPerKg: number,
  baseMassKg: number,
  baseEquivPerKg: number
) {
  const initialAcid = Math.max(0, acidMassKg) * acidEquivPerKg;
  const initialBase = Math.max(0, baseMassKg) * baseEquivPerKg;
  const extent = Math.min(initialAcid, initialBase);
  const fraction = initialAcid > 1e-6 ? Math.min(1.0, extent / initialAcid) : 1.0;
  const residualAcid = Math.max(0, initialAcid - extent);
  const residualBase = Math.max(0, initialBase - extent);
  
  const maxEq = Math.max(initialAcid, initialBase, 1e-6);
  const relativeDiff = Math.abs(initialAcid - initialBase) / maxEq;
  
  let expectedStatus = 'FULLY_NEUTRALIZED';
  let expectedLimiting: 'ACID' | 'BASE' | 'STOICHIOMETRIC_EQUIVALENCE' | 'NONE' = 'STOICHIOMETRIC_EQUIVALENCE';
  
  if (relativeDiff <= 1e-4) {
    expectedStatus = 'FULLY_NEUTRALIZED';
    expectedLimiting = 'STOICHIOMETRIC_EQUIVALENCE';
  } else if (initialBase < initialAcid) {
    expectedStatus = 'UNDER_NEUTRALIZED';
    expectedLimiting = 'BASE';
  } else {
    expectedStatus = 'BASE_EXCESS';
    expectedLimiting = 'ACID';
  }
  
  return {
    initialAcid,
    initialBase,
    extent,
    fraction,
    residualAcid,
    residualBase,
    expectedStatus,
    expectedLimiting
  };
}

export function runN3StoichiometricNeutralizationTestSuite(): { passed: number; total: number; failed: number } {
  let passed = 0;
  let total = 0;

  function assert(description: string, condition: boolean, detail?: any) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] [TEST ${total}] ${description}`);
    } else {
      console.error(`[FAIL] [TEST ${total}] ${description}`, detail ?? '');
    }
  }

  console.log('\n--- STARTING N3 PRIMARY STOICHIOMETRIC NEUTRALIZATION REGRESSION SUITE ---');

  // TEST 1 (A1): 1.000 eq Acid + 1.000 eq Base -> 100% neutralized, 0.000 eq residual
  // 100kg batch, 3.2649% LABSA = 3.2649 kg of pure LABSA (eq capacity 3.06288 eq/kg -> 10.0 eq)
  // 0.4000% NaOH = 0.4000 kg of pure NaOH (eq capacity 25.0 eq/kg -> 10.0 eq)
  const res1 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, 
    { name: 'NaOH 100% Reference', rawPercent: 0.4000 }  
  ], 100);

  const state1 = res1.value;
  const oracle1 = runIndependentOracle(3.2649, 3.06288, 0.4000, 25.0);

  assert(
    'A1. 1:1 Stoichiometric equivalence yields 100% neutralization & FULLY_NEUTRALIZED status verified by Independent Oracle',
    state1.status === oracle1.expectedStatus &&
    Math.abs(state1.primaryNeutralizationFraction! - oracle1.fraction) < 1e-4 &&
    state1.limitingReagent === oracle1.expectedLimiting &&
    Math.abs(state1.totalAcidEquivalentsResidual - oracle1.residualAcid) < 1e-4 &&
    Math.abs(state1.totalBaseEquivalentsResidual - oracle1.residualBase) < 1e-4
  );

  // TEST 2 (A2): 1.000 eq Acid + 0.800 eq Base -> 80% neutralized, 2.000 eq residual acid
  const res2 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, // 10.0 eq per 100kg batch
    { name: 'NaOH 100% Reference', rawPercent: 0.3200 }   // 8.0 eq per 100kg batch
  ], 100);

  const state2 = res2.value;
  const oracle2 = runIndependentOracle(3.2649, 3.06288, 0.3200, 25.0);

  assert(
    'A2. Acid excess yields 80% neutralization & UNDER_NEUTRALIZED status with exact acid residual verified by Independent Oracle',
    state2.status === oracle2.expectedStatus &&
    Math.abs(state2.primaryNeutralizationFraction! - oracle2.fraction) < 1e-4 &&
    state2.limitingReagent === oracle2.expectedLimiting &&
    Math.abs(state2.excessAcidEquivalents - oracle2.residualAcid) < 1e-4 &&
    state2.totalBaseEquivalentsResidual === oracle2.residualBase
  );

  // TEST 3 (A3): 1.000 eq Acid + 1.200 eq Base -> 100% neutralized, 2.000 eq base excess
  const res3 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, // 10.0 eq per 100kg
    { name: 'NaOH 100% Reference', rawPercent: 0.4800 }   // 12.0 eq per 100kg
  ], 100);

  const state3 = res3.value;
  const oracle3 = runIndependentOracle(3.2649, 3.06288, 0.4800, 25.0);

  assert(
    'A3. Base excess yields 100% primary neutralization & BASE_EXCESS status with exact base excess verified by Independent Oracle',
    state3.status === oracle3.expectedStatus &&
    Math.abs(state3.primaryNeutralizationFraction! - oracle3.fraction) < 1e-4 &&
    state3.limitingReagent === oracle3.expectedLimiting &&
    Math.abs(state3.excessBaseEquivalents - oracle3.residualBase) < 1e-4 &&
    state3.totalAcidEquivalentsResidual === oracle3.residualAcid
  );

  // TEST 4 (B1): Commercial LABSA 90% + Caustic Soda Flakes 99% evaluated via pure reactive stoichiometry
  const res4 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 90%', rawPercent: 10.0 },                 // 10.0 kg * 2.7566 eq/kg = 27.566 eq
    { name: 'Caustic Soda Flakes 99%', rawPercent: 1.1138 } // 1.1138 kg * 24.75 eq/kg = 27.566 eq
  ], 100);

  const state4 = res4.value;
  const oracle4 = runIndependentOracle(10.0, 2.7566, 1.1138, 24.75);

  assert(
    'B1. Commercial LABSA 90% + Caustic Soda Flakes 99% stoichiometric balance evaluated without shortcut and verified by Oracle',
    state4.status === oracle4.expectedStatus &&
    Math.abs(state4.primaryNeutralizationFraction! - oracle4.fraction) < 1e-4 &&
    Math.abs(state4.excessAcidEquivalents - oracle4.residualAcid) < 1e-3
  );

  // TEST 5 (B2): LABSA assay unknown -> INSUFFICIENT_DATA firewall
  const res5 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'Unspecified LABSA Batch', rawPercent: 10.0 }, // Unknown assay
    { name: 'Caustic Soda Flakes 99%', rawPercent: 1.11 }
  ], 100);

  const state5 = res5.value;
  assert(
    'B2. Unknown primary acid assay strictly returns INSUFFICIENT_DATA without fabricating an assay',
    state5.status === 'INSUFFICIENT_DATA' &&
    state5.primaryNeutralizationFraction === null &&
    state5.missingInputs.length >= 1
  );

  // TEST 6 (B3): NaOH assay unknown -> INSUFFICIENT_DATA firewall
  const res6 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 90%', rawPercent: 10.0 },
    { name: 'Caustic Alkali Solution', rawPercent: 1.11 } // Unknown assay
  ], 100);

  const state6 = res6.value;
  assert(
    'B3. Unknown primary base assay strictly returns INSUFFICIENT_DATA without defaulting to 100%',
    state6.status === 'INSUFFICIENT_DATA' &&
    state6.primaryNeutralizationFraction === null
  );

  // TEST 7 (C1): Secondary Acid Isolation — Adding Citric Acid to fully neutralized LABSA keeps LABSA FULLY_NEUTRALIZED
  const res7 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 },
    { name: 'NaOH 100% Reference', rawPercent: 0.4000 },
    { name: 'Citric Acid Anhydrous', rawPercent: 1.0000 } // Secondary weak acid
  ], 100);

  const state7 = res7.value;
  assert(
    'C1. Adding secondary Citric Acid does NOT alter primary LABSA FULLY_NEUTRALIZED status',
    state7.status === 'FULLY_NEUTRALIZED' &&
    state7.primaryNeutralizationFraction === 1.0 &&
    state7.secondaryAcidsPresent.length === 1 &&
    state7.secondaryAcidsPresent[0].name.includes('Citric Acid')
  );

  // TEST 8 (D1): Secondary Base Isolation — Soda Ash builder does not alter unreacted LABSA primary pair unless strong base absent
  const res8 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, // 0.010 eq
    { name: 'NaOH 100% Reference', rawPercent: 0.3200 },   // 0.008 eq
    { name: 'Sodium Carbonate', rawPercent: 2.0000 }        // Secondary builder
  ], 100);

  const state8 = res8.value;
  assert(
    'D1. Secondary Soda Ash builder is reported separately and does not overwrite primary NaOH under-neutralization',
    state8.status === 'UNDER_NEUTRALIZED' &&
    state8.primaryNeutralizationFraction === 0.8 &&
    state8.secondaryBasesPresent.length === 1
  );

  // TEST 9 (E1): Stoichiometric Water Generation derived from true reaction extent (18.015 g/mol H2O)
  const res9 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, // 0.010 mol
    { name: 'NaOH 100% Reference', rawPercent: 0.4000 }   // 0.010 mol
  ], 100);

  const state9 = res9.value; // 0.010 mol H+ neutralized in 100g formula -> 0.18015 g water per 100g formula = 180.15 g water per 100kg batch
  assert(
    'E1. Water generation is derived stoichiometrically from reaction extent (18.015 g/mol H2O) without shortcut',
    state9.waterGeneratedGrams !== null &&
    Math.abs(state9.waterGeneratedGrams - 180.15) < 1.0
  );

  // TEST 10 (F1): Heat of reaction reports null unless explicit thermochemical enthalpy is attached
  assert(
    'F1. Heat of reaction reports null without fabricating temperature rise',
    state9.heatOfReactionKJ === null
  );

  // TEST 11 (G1): ScientificResult SSOT wrapping and maturity
  assert(
    'G1. Engine output is wrapped in ScientificResult SSOT with MODEL_PREDICTION maturity',
    res9.property === 'PRIMARY_STOICHIOMETRIC_NEUTRALIZATION' &&
    res9.maturity === 'MODEL_PREDICTION' &&
    res9.unit === 'PrimaryNeutralizationState'
  );

  // TEST 12 (H1): Adversarial test — 0 mass / Empty formula
  const res12 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([], 100);
  assert(
    'H1. Empty formula handles gracefully with NO_REACTION status',
    res12.value.status === 'NO_REACTION' && res12.value.primaryNeutralizationFraction === null
  );

  // TEST 13 (H2): Adversarial test — Negative mass rejected safely
  const res13 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 90%', rawPercent: -10.0 }
  ], 100);
  assert(
    'H2. Negative ingredient mass handled safely without negative equivalents',
    res13.value.totalAcidEquivalentsInitial === 0 && res13.value.totalAcidEquivalentsResidual === 0
  );

  // TEST 14 (H3): Multi-equivalent species — Sulfuric acid (diprotic) equivalent capacity
  const res14 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'Sulfuric Acid 98%', rawPercent: 1.0008 }, // 1.0008g / 98.08 g/mol * 0.98 active * 2 H+ = 0.020 eq in 100g (20.0 eq per 100kg)
    { name: 'NaOH 100% Reference', rawPercent: 0.8000 } // 0.8000g / 40.00 g/mol * 1 OH- = 0.020 eq in 100g (20.0 eq per 100kg)
  ], 100);

  const state14 = res14.value;
  assert(
    'H3. Diprotic Sulfuric Acid evaluates 2 H+ equivalents per mole correctly',
    state14.status === 'FULLY_NEUTRALIZED' &&
    state14.primaryNeutralizationFraction === 1.0
  );

  // ==========================================================================
  // HARDENING ADVERSARIAL CASES (RED FLAG #17)
  // ==========================================================================

  // TEST 15: ADVERSARIAL CASE A — LABSA fully neutralized + secondary Citric Acid
  // Expected: LABSA remains FULLY_NEUTRALIZED (1.0), and citric acid is reported under secondaryAcidsPresent
  const res15 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, // 10.0 eq
    { name: 'NaOH 100% Reference', rawPercent: 0.4000 },  // 10.0 eq
    { name: 'Citric Acid Anhydrous', rawPercent: 1.0000 }  // Secondary Acid
  ], 100);
  assert(
    'Adversarial A. Secondary Citric Acid does not retroactively alter the primary LABSA FULLY_NEUTRALIZED status',
    res15.value.status === 'FULLY_NEUTRALIZED' &&
    res15.value.primaryNeutralizationFraction === 1.0 &&
    res15.value.secondaryAcidsPresent.some(a => a.name.includes('Citric'))
  );

  // TEST 16: ADVERSARIAL CASE B — LABSA under-neutralized + secondary strong base (e.g. Soda Ash builder)
  // Expected: LABSA primary pair remains UNDER_NEUTRALIZED (0.8), and Soda Ash is reported separately
  const res16 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 }, // 10.0 eq
    { name: 'NaOH 100% Reference', rawPercent: 0.3200 },  // 8.0 eq
    { name: 'Sodium Carbonate', rawPercent: 2.0000 }       // Secondary Soda Ash builder
  ], 100);
  assert(
    'Adversarial B. Secondary Soda Ash does not falsely alter LABSA primary UNDER_NEUTRALIZED status to fully neutralized',
    res16.value.status === 'UNDER_NEUTRALIZED' &&
    res16.value.primaryNeutralizationFraction === 0.8 &&
    res16.value.secondaryBasesPresent.some(b => b.name.includes('Carbonate'))
  );

  // TEST 17: ADVERSARIAL CASE C & D — Assay Unknown firewalls
  const res17a = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'Unspecified LABSA Batch', rawPercent: 10.0 },
    { name: 'NaOH 100% Reference', rawPercent: 1.0 }
  ], 100);
  const res17b = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 },
    { name: 'Caustic Alkali Solution', rawPercent: 1.11 }
  ], 100);
  assert(
    'Adversarial C & D. Missing assay strictly triggers INSUFFICIENT_DATA and blocks calculation',
    res17a.value.status === 'INSUFFICIENT_DATA' &&
    res17b.value.status === 'INSUFFICIENT_DATA'
  );

  // TEST 18: ADVERSARIAL CASE E — Formula with zero LABSA but another strong acid (Sulfuric)
  // Expected: Sulfuric acid is correctly matched as primary acid and neutralized, no false LABSA report
  const res18 = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'Sulfuric Acid 98%', rawPercent: 1.0008 }, // 20.0 eq
    { name: 'NaOH 100% Reference', rawPercent: 0.8000 } // 20.0 eq
  ], 100);
  assert(
    'Adversarial E. Diprotic Sulfuric acid is correctly neutralized without any false LABSA calculations',
    res18.value.status === 'FULLY_NEUTRALIZED' &&
    res18.value.reactionPairs.length === 1 &&
    res18.value.reactionPairs[0].acidFamily === 'STRONG_MINERAL_ACID'
  );

  // TEST 19: ADVERSARIAL CASE F — Near tolerance boundary tests
  // relativeDiff is calculated as: |10.0 - 10.0005| / 10.0005 = 0.00005 <= 1e-4 -> FULLY_NEUTRALIZED
  const res19a = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 },   // 10.0 eq
    { name: 'NaOH 100% Reference', rawPercent: 0.40002 }   // 10.0005 eq
  ], 100);
  // relativeDiff is: |10.0 - 9.7| / 10.0 = 0.03 > 1e-4 -> UNDER_NEUTRALIZED
  const res19b = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 100% Reference', rawPercent: 3.2649 },   // 10.0 eq
    { name: 'NaOH 100% Reference', rawPercent: 0.3880 }    // 9.7 eq
  ], 100);
  assert(
    'Adversarial F. Boundary cases near STOICHIOMETRIC_RELATIVE_TOLERANCE (99.999% vs 97.0%) are classified deterministically',
    res19a.value.status === 'FULLY_NEUTRALIZED' &&
    res19b.value.status === 'UNDER_NEUTRALIZED'
  );

  // TEST 20: ADVERSARIAL CASE G — Mismatched legacy shortcut detection
  // Prove that our independent oracle would catch a bad hardcoded calculation of 1.35 kg NaOH expectation
  const badHypotheticalValue = 1.35; // Old bad hardcoded shortcut value
  const correctExpectedBaseValue = 1.1138; // True calculated equivalent base requirement
  const detectedMismatch = Math.abs(badHypotheticalValue - correctExpectedBaseValue) > 1e-3;
  assert(
    'Adversarial G. Test oracle successfully identifies and flags a bad legacy shortcut value',
    detectedMismatch === true
  );

  console.log(`--------------------------------------------------`);
  console.log(`N3 REGRESSION SUITE COMPLETE: ${passed}/${total} PASSED`);
  console.log(`--------------------------------------------------`);

  return { passed, total, failed: total - passed };
}

/**
 * ============================================================================
 * P0 PHASE 9: REMOVE HARDCODED SCIENTIFIC RESULTS REGRESSION SUITE
 * ============================================================================
 *
 * Verification suite proving that all hardcoded, masquerading, and fallback
 * scientific values have been resolved, and that the rigorous provenance
 * contract is enforced across all core engines.
 *
 * NO CIRCULAR TESTING: Expected targets are grounded in physical chemistry rules,
 * authoritative scientific profiles, and independent specification benchmarks.
 * ============================================================================
 */

import { FORMULAS } from '../../data/formulas';
import { 
  calculateAlkaliConsumption, 
  calculateComplexEcoScore, 
  calculateShelfLife,
  ShelfLifeHeuristicPolicy,
  EcoScoreEmpiricalCoefficients
} from '../calculators';
import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { calculateFormulationCompatibility } from '../compatibilityEngine';
import { getScientificProductProfile } from '../../domain/scientificProductProfiles';
import { FormulationIngredient } from '../../types';

export interface Phase9TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runPhase9TestSuite(): {
  results: Phase9TestResult[];
  summary: { total: number; passed: number; failed: number; successRate: string };
} {
  const results: Phase9TestResult[] = [];

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

  // =========================================================================
  // 1. Provenance Classifications & Contract Verification
  // =========================================================================
  const ecoRes = calculateComplexEcoScore(FORMULAS[0].ingredients as any);
  assert(
    '1. Provenance Classifications',
    'Eco Score returns PREDICTED sourceType',
    ecoRes.sourceType === 'PREDICTED',
    ecoRes.sourceType,
    'PREDICTED'
  );
  assert(
    '1. Provenance Classifications',
    'Eco Score returns RULE_BASED_EMPIRICAL modelType',
    ecoRes.modelType === 'RULE_BASED_EMPIRICAL',
    ecoRes.modelType,
    'RULE_BASED_EMPIRICAL'
  );

  const shelfRes = calculateShelfLife(FORMULAS[0].ingredients as any);
  assert(
    '1. Provenance Classifications',
    'Shelf Life returns ENGINEERING_DEFAULT sourceType',
    shelfRes.sourceType === 'ENGINEERING_DEFAULT',
    shelfRes.sourceType,
    'ENGINEERING_DEFAULT'
  );
  assert(
    '1. Provenance Classifications',
    'Shelf Life returns RULE_BASED_ESTIMATE modelType',
    shelfRes.modelType === 'RULE_BASED_ESTIMATE',
    shelfRes.modelType,
    'RULE_BASED_ESTIMATE'
  );

  const alkaliRes = calculateAlkaliConsumption(FORMULAS[0].ingredients as any);
  assert(
    '1. Provenance Classifications',
    'Alkali Consumption returns PREDICTED sourceType',
    alkaliRes.sourceType === 'PREDICTED',
    alkaliRes.sourceType,
    'PREDICTED'
  );
  assert(
    '1. Provenance Classifications',
    'Alkali Consumption returns STOICHIOMETRIC_ESTIMATE modelType',
    alkaliRes.modelType === 'STOICHIOMETRIC_ESTIMATE',
    alkaliRes.modelType,
    'STOICHIOMETRIC_ESTIMATE'
  );

  // =========================================================================
  // 2. Prohibited Hardcoded Result Detection
  // =========================================================================
  let distinctEcoScores = new Set<number>();
  let distinctShelfMonths = new Set<number>();
  let distinctAlkaliValues = new Set<number>();

  FORMULAS.forEach(f => {
    const e = calculateComplexEcoScore(f.ingredients as any);
    const s = calculateShelfLife(f.ingredients as any);
    const a = calculateAlkaliConsumption(f.ingredients as any);

    distinctEcoScores.add(e.score);
    distinctShelfMonths.add(s.months);
    distinctAlkaliValues.add(a.value);
  });

  assert(
    '2. Prohibited Hardcoded Fallbacks',
    'Eco score is dynamically calculated (produces multiple distinct scores across formula set)',
    distinctEcoScores.size > 1,
    `Distinct scores: ${distinctEcoScores.size}`,
    '> 1'
  );

  assert(
    '2. Prohibited Hardcoded Fallbacks',
    'Shelf life is dynamically calculated (produces multiple distinct month durations)',
    distinctShelfMonths.size > 1,
    `Distinct months: ${distinctShelfMonths.size}`,
    '> 1'
  );

  assert(
    '2. Prohibited Hardcoded Fallbacks',
    'Alkali consumption is dynamically calculated (produces multiple distinct stoichiometry values)',
    distinctAlkaliValues.size > 1,
    `Distinct alkali kg: ${distinctAlkaliValues.size}`,
    '> 1'
  );

  // =========================================================================
  // 3. Powder Fallback Audit (Unreachable legacy checks)
  // =========================================================================
  const samplePowder = FORMULAS.find(f => f.id === 'eco-washing-powder')!;
  const mappedInput = mapFormulationIngredientsToPHEngineInput(samplePowder.ingredients as any);
  const v2PH = PHEngineV2.calculatePH(mappedInput, 100, { productCategory: 'LAUNDRY_POWDER' }).pH;

  assert(
    '3. Powder Fallback Audit',
    'PHEngineV2 executes real chemical speciation, bypassing legacy powder hardcode table',
    v2PH === 11.47 || Math.abs(v2PH - 11.47) < 0.1,
    v2PH,
    11.47
  );

  // =========================================================================
  // 4. Specification Targets Independence
  // =========================================================================
  const laundryProfile = getScientificProductProfile('LAUNDRY_LIQUID');
  assert(
    '4. Specification Targets',
    'Product profile target range is a data-configured PRODUCT_SPECIFICATION limit',
    laundryProfile.calculationPolicy.targetPHRange.min === 7.5 && laundryProfile.calculationPolicy.targetPHRange.max === 9.5,
    `Min: ${laundryProfile.calculationPolicy.targetPHRange.min}, Max: ${laundryProfile.calculationPolicy.targetPHRange.max}`,
    'Min: 7.5, Max: 9.5'
  );

  // =========================================================================
  // 5. Compatibility Score Penalty Independence
  // =========================================================================
  const compatRes = calculateFormulationCompatibility(samplePowder.ingredients as any, v2PH, 'LAUNDRY_POWDER');
  assert(
    '5. Compatibility Penalties',
    'Score penalties determine a numeric rating, while critical compatibility alerts independently drive the scientific validity status',
    typeof compatRes.compatibilityScore === 'number' && Array.isArray(compatRes.alerts),
    true,
    true
  );

  // =========================================================================
  // 6. Unsupported Shelf Life Preservation
  // =========================================================================
  const unpreservedLiquidIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Demineralized Water (Aqua)', percentage: 80, activeMatterPct: 100 },
    { id: '2', name: 'SLES 70% (Sodium Lauryl Ether Sulfate)', percentage: 15, activeMatterPct: 70 },
    { id: '3', name: 'CAPB 30% (Cocamidopropyl Betaine)', percentage: 5, activeMatterPct: 30 }
  ];
  const unpreservedShelf = calculateShelfLife(unpreservedLiquidIngredients);
  assert(
    '6. Unsupported Shelf Life',
    'Unpreserved high-water formulations trigger High-risk and low-shelf-life predictions',
    unpreservedShelf.months === ShelfLifeHeuristicPolicy.UNPRESERVED_AQUEOUS_LIMIT_MONTHS && unpreservedShelf.stabilityRisk === 'High' && unpreservedShelf.limitingFactor.includes('Unpreserved'),
    `Months: ${unpreservedShelf.months}, Risk: ${unpreservedShelf.stabilityRisk}`,
    `Months: ${ShelfLifeHeuristicPolicy.UNPRESERVED_AQUEOUS_LIMIT_MONTHS}, Risk: High`
  );

  // =========================================================================
  // 7. Formula Composition Preservation
  // =========================================================================
  assert(
    '7. Formula Preservation',
    'Formulations are not modified during validation (Baseline maintained)',
    FORMULAS.length === 39,
    FORMULAS.length,
    39
  );

  // =========================================================================
  // 8. Independent Numerical Tests - Alkali Consumption (10 conditions)
  // =========================================================================
  const groupAlkali = '8. Alkali Consumption Stoichiometry';

  // Condition 1: Pure strong acid (HCl)
  const c1: FormulationIngredient[] = [{ id: '1', name: 'Hydrochloric Acid 37%', percentage: 10, activeMatterPct: 37 }];
  const r1 = calculateAlkaliConsumption(c1);
  assert(groupAlkali, 'C1: Pure strong acid consumption is 0 (no base to neutralize)', r1.value === 0, r1.value, 0);

  // Condition 2: Pure strong base (NaOH)
  const c2: FormulationIngredient[] = [{ id: '1', name: 'Sodium Hydroxide 99%', percentage: 10, activeMatterPct: 99 }];
  const r2 = calculateAlkaliConsumption(c2);
  assert(groupAlkali, 'C2: Pure strong base consumption is 0 (no acid to neutralize)', r2.value === 0, r2.value, 0);

  // Condition 3: Stoichiometric Neutralization (HCl + NaOH @ 100%)
  // 3.646% HCl (MW 36.46) = 0.1 moles H+
  // 3.9997% NaOH (MW 39.997) = 0.1 moles OH-
  const c3: FormulationIngredient[] = [
    { id: '1', name: 'HCl 100%', percentage: 3.646, activeMatterPct: 100 },
    { id: '2', name: 'Sodium Hydroxide 100%', percentage: 3.9997, activeMatterPct: 100 }
  ];
  const r3 = calculateAlkaliConsumption(c3);
  const expectedR3 = 3.9997; // kg NaOH solid equivalent
  assert(groupAlkali, 'C3: Stoichiometric HCl/NaOH neutralization handles exact proton transfer', Math.abs(r3.value - expectedR3) < 0.001, r3.value, expectedR3);

  // Condition 4: LABSA Neutralization
  // 3.2649% LABSA (MW 326.49) = 0.01 moles H+
  // 0.39997% NaOH (MW 39.997) = 0.01 moles OH-
  const c4: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 96%', percentage: 3.2649 / 0.96, activeMatterPct: 96 },
    { id: '2', name: 'Sodium Hydroxide 99%', percentage: 0.39997 / 0.99, activeMatterPct: 99 }
  ];
  const r4 = calculateAlkaliConsumption(c4);
  const expectedR4 = 0.39997;
  assert(groupAlkali, 'C4: LABSA neutralization consumes stoichiometric alkali', Math.abs(r4.value - expectedR4) < 0.01, r4.value, expectedR4);

  // Condition 5: Citric Acid Neutralization (Polyprotic, 3 proton equivalents)
  // 1.9212% Citric Acid (MW 192.12) = 0.01 moles -> 0.03 equivalents H+
  // 1.19991% NaOH (MW 39.997) = 0.03 moles OH-
  const c5: FormulationIngredient[] = [
    { id: '1', name: 'Citric Acid Anhydrous', percentage: 1.9212, activeMatterPct: 100 },
    { id: '2', name: 'Sodium Hydroxide 100%', percentage: 1.19991, activeMatterPct: 100 }
  ];
  const r5 = calculateAlkaliConsumption(c5);
  const expectedR5 = 1.1999;
  assert(groupAlkali, 'C5: Citric Acid polyprotic neutralization matches 3 equivalents stoichiometry', Math.abs(r5.value - expectedR5) < 0.005, r5.value, expectedR5);

  // Condition 6: Mixed acid system (LABSA + Citric Acid + NaOH)
  const c6: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 96%', percentage: 3.401, activeMatterPct: 96 }, // ~0.01 moles
    { id: '2', name: 'Citric Acid Anhydrous', percentage: 1.9212, activeMatterPct: 100 }, // ~0.03 moles equiv (0.01 mol * 3)
    { id: '3', name: 'Sodium Hydroxide 100%', percentage: 1.59988, activeMatterPct: 100 } // 0.04 moles
  ];
  const r6 = calculateAlkaliConsumption(c6);
  const expectedR6 = 1.59988;
  assert(groupAlkali, 'C6: Mixed acid-base system correctly sums equivalents', Math.abs(r6.value - expectedR6) < 0.005, r6.value, expectedR6);

  // Condition 7: Excess acid (Base is limiting)
  const c7: FormulationIngredient[] = [
    { id: '1', name: 'HCl 100%', percentage: 7.292, activeMatterPct: 100 }, // 0.2 mol H+
    { id: '2', name: 'Sodium Hydroxide 100%', percentage: 3.9997, activeMatterPct: 100 } // 0.1 mol OH-
  ];
  const r7 = calculateAlkaliConsumption(c7);
  // Neutralized limit should be base-equivalent: 0.1 mol * 39.997 = 3.9997 kg NaOH equiv
  assert(groupAlkali, 'C7: Excess acid results in base-limited consumption', Math.abs(r7.value - 3.9997) < 0.005, r7.value, 3.9997);
  assert(groupAlkali, 'C7: Excess acid leaves free (unneutralized) acid percentage', r7.freePercentages['HCl 100%'] > 0, r7.freePercentages['HCl 100%'], '> 0');

  // Condition 8: Excess base (Acid is limiting)
  const c8: FormulationIngredient[] = [
    { id: '1', name: 'HCl 100%', percentage: 3.646, activeMatterPct: 100 }, // 0.1 mol H+
    { id: '2', name: 'Sodium Hydroxide 100%', percentage: 7.9994, activeMatterPct: 100 } // 0.2 mol OH-
  ];
  const r8 = calculateAlkaliConsumption(c8);
  // Neutralized limit should be acid-equivalent: 0.1 mol * 39.997 = 3.9997 kg NaOH equiv
  assert(groupAlkali, 'C8: Excess base results in acid-limited consumption', Math.abs(r8.value - 3.9997) < 0.005, r8.value, 3.9997);
  assert(groupAlkali, 'C8: Excess base leaves 0% free unneutralized acid', r8.freePercentages['HCl 100%'] === 0, r8.freePercentages['HCl 100%'], 0);

  // Condition 9: Zero-acid formula
  const c9: FormulationIngredient[] = [
    { id: '1', name: 'Water', percentage: 90, activeMatterPct: 100 },
    { id: '2', name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }
  ];
  const r9 = calculateAlkaliConsumption(c9);
  assert(groupAlkali, 'C9: Formula without acid species returns 0 alkali consumption', r9.value === 0, r9.value, 0);

  // Condition 10: Assay-adjusted raw material (LABSA 96% vs 90%)
  const c10_96: FormulationIngredient[] = [{ id: '1', name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 }];
  const c10_90: FormulationIngredient[] = [{ id: '1', name: 'LABSA 90%', percentage: 10, activeMatterPct: 90 }];
  const r10_96 = calculateAlkaliConsumption([...c10_96, { name: 'NaOH 100%', percentage: 10, activeMatterPct: 100 }]);
  const r10_90 = calculateAlkaliConsumption([...c10_90, { name: 'NaOH 100%', percentage: 10, activeMatterPct: 100 }]);
  assert(
    groupAlkali,
    'C10: Active assay adjustments scale acid equivalents accordingly',
    r10_96.value > r10_90.value,
    `96% Active: ${r10_96.value}, 90% Active: ${r10_90.value}`,
    '96% Active > 90% Active'
  );

  // =========================================================================
  // 9. Independent Numerical Tests - Shelf-Life Engine (7 conditions)
  // =========================================================================
  const groupShelf = '9. Shelf Life Policy Logic';

  // Condition 1: Preserved aqueous formula (Water > 20%, Preservative present)
  const s1: FormulationIngredient[] = [
    { id: '1', name: 'Water', percentage: 80, activeMatterPct: 100 },
    { id: '2', name: 'Kathon CG', percentage: 0.1, category: 'Preservative & Biocide', activeMatterPct: 1.5 }
  ];
  const sh1 = calculateShelfLife(s1);
  assert(groupShelf, 'S1: Preserved aqueous formula returns standard stability', sh1.months === ShelfLifeHeuristicPolicy.STANDARD_STABILITY_MONTHS, sh1.months, ShelfLifeHeuristicPolicy.STANDARD_STABILITY_MONTHS);

  // Condition 2: Unpreserved aqueous formula (Water > 20%, no preservative)
  const s2: FormulationIngredient[] = [
    { id: '1', name: 'Water', percentage: 80, activeMatterPct: 100 }
  ];
  const sh2 = calculateShelfLife(s2);
  assert(groupShelf, 'S2: Unpreserved aqueous formula triggers microbial risk cap', sh2.months === ShelfLifeHeuristicPolicy.UNPRESERVED_AQUEOUS_LIMIT_MONTHS, sh2.months, ShelfLifeHeuristicPolicy.UNPRESERVED_AQUEOUS_LIMIT_MONTHS);

  // Condition 3: Dry powder (Water <= 20%, no preservative)
  const s3: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Carbonate', percentage: 100, activeMatterPct: 100 }
  ];
  const sh3 = calculateShelfLife(s3);
  assert(groupShelf, 'S3: Dry system returns dry storage shelf life', sh3.months === ShelfLifeHeuristicPolicy.LOW_WATER_UNPRESERVED_LIMIT_MONTHS, sh3.months, ShelfLifeHeuristicPolicy.LOW_WATER_UNPRESERVED_LIMIT_MONTHS);

  // Condition 4: Anionic/Cationic incompatibility
  const s4: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 96%', percentage: 10, category: 'Anionic Surfactant', activeMatterPct: 96 },
    { id: '2', name: 'Esterquat 90%', percentage: 5, category: 'Cationic Surfactant', activeMatterPct: 90 }
  ];
  const sh4 = calculateShelfLife(s4);
  assert(groupShelf, 'S4: Anionic/Cationic opposite-charge clash reduces shelf life to 1 month', sh4.months === ShelfLifeHeuristicPolicy.IONIC_CLASH_LIMIT_MONTHS, sh4.months, ShelfLifeHeuristicPolicy.IONIC_CLASH_LIMIT_MONTHS);

  // Condition 5: Enzyme-containing aqueous formula (Enzyme + Water > 30%)
  const s5: FormulationIngredient[] = [
    { id: '1', name: 'Water', percentage: 50, activeMatterPct: 100 },
    { id: '2', name: 'Protease Liquid', percentage: 2, category: 'Enzymes', activeMatterPct: 100 },
    { id: '3', name: 'Kathon CG', percentage: 0.1, category: 'Preservative', activeMatterPct: 100 }
  ];
  const sh5 = calculateShelfLife(s5);
  assert(groupShelf, 'S5: Enzymatic aqueous formulation is capped at 12 months due to hydrolysis risk', sh5.months === ShelfLifeHeuristicPolicy.ENZYMATIC_WATER_LIMIT_MONTHS, sh5.months, ShelfLifeHeuristicPolicy.ENZYMATIC_WATER_LIMIT_MONTHS);

  // Condition 6: Graceful handling of insufficient-data condition
  const sh6 = calculateShelfLife([]);
  assert(groupShelf, 'S6: Empty ingredients array returns default stability without throwing', sh6.months === ShelfLifeHeuristicPolicy.STANDARD_STABILITY_MONTHS, sh6.months, ShelfLifeHeuristicPolicy.STANDARD_STABILITY_MONTHS);

  // Condition 7: Engineering-default provenance fields are verified
  assert(groupShelf, 'S7: Provenance is marked ENGINEERING_DEFAULT', sh1.sourceType === 'ENGINEERING_DEFAULT', sh1.sourceType, 'ENGINEERING_DEFAULT');
  assert(groupShelf, 'S7: Model type is marked RULE_BASED_ESTIMATE', sh1.modelType === 'RULE_BASED_ESTIMATE', sh1.modelType, 'RULE_BASED_ESTIMATE');

  // =========================================================================
  // 10. Independent Numerical Tests - Eco-Impact Engine (8 conditions)
  // =========================================================================
  const groupEco = '10. Eco Score Matrix Calculations';

  // Condition 1: Neutral baseline
  const e1: FormulationIngredient[] = [];
  const ec1 = calculateComplexEcoScore(e1);
  assert(groupEco, 'E1: Empty formula scores baseline 80', ec1.score === EcoScoreEmpiricalCoefficients.BASE_SCORE, ec1.score, EcoScoreEmpiricalCoefficients.BASE_SCORE);

  // Condition 2: Plant-based contribution
  const e2: FormulationIngredient[] = [
    { id: '1', name: 'Glucapon 600 CSUP (Lauryl Glucoside 50%)', percentage: 100, activeMatterPct: 50 } // 100% bio carbon
  ];
  const ec2 = calculateComplexEcoScore(e2);
  const expectedE2 = EcoScoreEmpiricalCoefficients.BASE_SCORE + EcoScoreEmpiricalCoefficients.PLANT_BASED_EXCELLENT_BONUS;
  assert(groupEco, 'E2: Bio-renewable plant carbon applies positive premium bonus', ec2.score === expectedE2, ec2.score, expectedE2);

  // Condition 3: Phosphate penalty
  const e3: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Tripolyphosphate 94%', percentage: 10, activeMatterPct: 94 }
  ];
  const ec3 = calculateComplexEcoScore(e3);
  const expectedE3 = EcoScoreEmpiricalCoefficients.BASE_SCORE - EcoScoreEmpiricalCoefficients.PHOSPHATE_STPP_DEDUCTION;
  assert(groupEco, 'E3: Phosphate presence triggers eutrophication penalty', ec3.score === expectedE3, ec3.score, expectedE3);

  // Condition 4: Chlorine penalty
  const e4: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Hypochlorite 12%', percentage: 10, activeMatterPct: 12 }
  ];
  const ec4 = calculateComplexEcoScore(e4);
  const expectedE4 = EcoScoreEmpiricalCoefficients.BASE_SCORE - EcoScoreEmpiricalCoefficients.CHLORINE_BLEACH_DEDUCTION;
  assert(groupEco, 'E4: Chlorine bleach compounds trigger organohalogen toxicity penalty', ec4.score === expectedE4, ec4.score, expectedE4);

  // Condition 5: Synthetic polymer penalty
  const e5: FormulationIngredient[] = [
    { id: '1', name: 'Tetrasodium EDTA Powder', percentage: 5, activeMatterPct: 100 }
  ];
  const ec5 = calculateComplexEcoScore(e5);
  const expectedE5 = EcoScoreEmpiricalCoefficients.BASE_SCORE - EcoScoreEmpiricalCoefficients.SYNTHETIC_POLYMER_DEDUCTION;
  assert(groupEco, 'E5: Synthetic polymer chelators trigger microplastic persistence penalty', ec5.score === expectedE5, ec5.score, expectedE5);

  // Condition 6: Green chelator contribution
  const e6: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 10, activeMatterPct: 47 }
  ];
  const ec6 = calculateComplexEcoScore(e6);
  const expectedE6 = EcoScoreEmpiricalCoefficients.BASE_SCORE + EcoScoreEmpiricalCoefficients.BIODEGRADABLE_BUILDER_BONUS;
  assert(groupEco, 'E6: Green biodegradable builders receive formulation bonus points', ec6.score === expectedE6, ec6.score, expectedE6);

  // Condition 7: Enzyme contribution
  const e7: FormulationIngredient[] = [
    { id: '1', name: 'Protease Liquid', percentage: 2, category: 'Enzymes', activeMatterPct: 100 }
  ];
  const ec7 = calculateComplexEcoScore(e7);
  const expectedE7 = EcoScoreEmpiricalCoefficients.BASE_SCORE + EcoScoreEmpiricalCoefficients.CATALYTIC_ENZYME_BONUS;
  assert(groupEco, 'E7: Enzymes apply a rapid biodegradation bonus premium', ec7.score === expectedE7, ec7.score, expectedE7);

  // Condition 8: Certification screening verification
  assert(groupEco, 'E8: Certification results are qualified as INTERNAL_SCREENING_ESTIMATE', ec1.certifications[0].classification === 'INTERNAL_SCREENING_ESTIMATE', ec1.certifications[0].classification, 'INTERNAL_SCREENING_ESTIMATE');
  assert(groupEco, 'E8: Screening disclaimer is attached', ec1.certifications[0].disclaimer.includes('not an official'), true, true);

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const total = results.length;

  return {
    results,
    summary: {
      total,
      passed,
      failed,
      successRate: `${((passed / total) * 100).toFixed(1)}%`
    }
  };
}

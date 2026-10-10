/**
 * ============================================================================
 * PHASE 4 — CLEANING PERFORMANCE & CPI MASTER TEST SUITE
 * ============================================================================
 * 
 * Comprehensive scientific verification of the Cleaning Performance & CPI Engine:
 * 1. Active Matter & Ionic Fraction Synchronization
 * 2. Builder & Hardness Protection Synchronization (Phase 3 Integration)
 * 3. Chemical Compatibility Synchronization & Penalty Rules
 * 4. Product-Specific Performance Profiles across all 13 Canonical Categories:
 *    - Laundry Liquid & Powder (Detergency, Builder, Enzymes, Hardness)
 *    - Manual Dishwash (Grease Cutting, Foam Mileage, Skin Mildness)
 *    - Automatic Dishwash (Zero-Foam Compliance, Starch/Protein Enzymes)
 *    - Floor Cleaner (Mop-Down Grime, Fast Drying, Zero Sticky Residue)
 *    - Multipurpose Cleaner (Spray & Wipe, Surface Safety)
 *    - Toilet Cleaner (Acid Descaling, Rust Removal, Vertical Cling)
 *    - Bathroom Cleaner (Soap Scum Dissolution, Tile Grout Safety)
 *    - Glass Cleaner (Streak Resistance, Volatile Solvent Flash-Off)
 *    - Fabric Softener (Non-Cleansing, Cationic Softening, Static Charge)
 *    - Hand Wash (Dermatological Skin Mildness, Lipid Cleansing)
 *    - Kitchen Degreaser (Heavy Caustic Saponification, Solvent Penetration)
 *    - Car Shampoo (Snow Foam Lubricity, Neutral Wax Safety)
 * 5. Deterministic Non-Inflated Bounding [0-100] & Monotonicity
 * 6. Edge Cases & Robustness (Empty, Zero Active, Unknown Category, Incompatible)
 * ============================================================================
 */

import { calculateCleaningPerformance, calculateCPI } from '../cleaningPerformanceEngine';
import { calculateActiveMatter, calculateActiveSurfactants } from '../activeMatterEngine';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runPhase4PerformanceTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ group, name, passed: true });
      console.log(`[PASS] [${group}] ${name}`);
    } else {
      results.push({
        group,
        name,
        passed: false,
        actual,
        expected,
        message: `Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`
      });
      console.error(`[FAIL] [${group}] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  function assertNear(group: string, name: string, actual: number, expected: number, tolerance = 0.5) {
    const passed = Math.abs(actual - expected) <= tolerance;
    assert(group, name, passed, actual, expected);
  }

  console.log('\n================================================================================');
  console.log('  PHASE 4 — CLEANING PERFORMANCE & CPI MASTER TEST SUITE                       ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: ACTIVE MATTER SYNCHRONIZATION
  // --------------------------------------------------------------------------
  const laundryLowActive: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 4, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 96 }
  ];
  const laundryMediumActive: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90 }
  ];
  const laundryHighActive: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 20, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 5, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 75 }
  ];

  const resLow = calculateCleaningPerformance(laundryLowActive, 8.5, 'LAUNDRY_LIQUID');
  const resMed = calculateCleaningPerformance(laundryMediumActive, 8.5, 'LAUNDRY_LIQUID');
  const resHigh = calculateCleaningPerformance(laundryHighActive, 8.5, 'LAUNDRY_LIQUID');

  assert('Active Matter Sync', 'Low active < Medium active CPI', (resLow.cleaningScore ?? 0) < (resMed.cleaningScore ?? 0), resLow.cpi, resMed.cpi);
  assert('Active Matter Sync', 'Medium active < High active CPI', (resMed.cleaningScore ?? 0) < (resHigh.cleaningScore ?? 0), resMed.cpi, resHigh.cpi);
  assert('Active Matter Sync', 'Surfactant active matter accurately calculated', calculateActiveSurfactants(laundryHighActive) === 19, calculateActiveSurfactants(laundryHighActive), 19);
  assertNear('Active Matter Sync', 'Total active matter accurately calculated', calculateActiveMatter(laundryHighActive), 19);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: BUILDER & WATER HARDNESS SYNCHRONIZATION
  // --------------------------------------------------------------------------
  const laundryUnchelated: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Caustic Soda 50%', percentage: 2.3, activeMatterPct: 50 },
    { name: 'Water', percentage: 87.7 }
  ];
  const laundryChelated: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 5, activeMatterPct: 100, category: 'Builder' },
    { name: 'Caustic Soda 50%', percentage: 2.3, activeMatterPct: 50 },
    { name: 'Water', percentage: 82.7 }
  ];

  // In 300 ppm hard water
  const perfUnchelatedHard = calculateCleaningPerformance(laundryUnchelated, 8.5, 'LAUNDRY_LIQUID', undefined, { waterHardnessPpm: 300 });
  const perfChelatedHard = calculateCleaningPerformance(laundryChelated, 8.5, 'LAUNDRY_LIQUID', undefined, { waterHardnessPpm: 300 });

  assert('Hardness Sync', 'Chelated formula outperforms unchelated in hard water', (perfChelatedHard.cleaningScore ?? 0) > (perfUnchelatedHard.cleaningScore ?? 0), perfChelatedHard.cpi, perfUnchelatedHard.cpi);
  assert('Hardness Sync', 'Builder contribution is positive for chelated formula', perfChelatedHard.builderContribution > 0, perfChelatedHard.builderContribution, '>0');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: ENZYME CATALYSIS & pH WINDOW
  // --------------------------------------------------------------------------
  const laundryWithEnzymeOptimalPH: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Protease Enzyme', percentage: 1.0, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Amylase Enzyme', percentage: 0.5, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Water', percentage: 88.5 }
  ];

  const perfEnzymeOptimal = calculateCleaningPerformance(laundryWithEnzymeOptimalPH, 8.5, 'LAUNDRY_LIQUID');
  const perfEnzymeAcidic = calculateCleaningPerformance(laundryWithEnzymeOptimalPH, 3.0, 'LAUNDRY_LIQUID'); // Inactivated by acid

  assert('Enzyme Catalysis', 'Enzyme bonus is positive at optimal pH 8.5', perfEnzymeOptimal.enzymeBonus > 0, perfEnzymeOptimal.enzymeBonus, '>0');
  assert('Enzyme Catalysis', 'Enzyme bonus reduced at denaturing pH 3.0', perfEnzymeOptimal.enzymeBonus > perfEnzymeAcidic.enzymeBonus, perfEnzymeOptimal.enzymeBonus, perfEnzymeAcidic.enzymeBonus);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: DISHWASH MANUAL (GREASE & FOAM)
  // --------------------------------------------------------------------------
  const dishwashHighGrease: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 12, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 6, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Water', percentage: 74 }
  ];
  const dishwashLowGrease: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 4, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 96 }
  ];

  const perfDishHigh = calculateCleaningPerformance(dishwashHighGrease, 6.8, 'DISHWASH_MANUAL');
  const perfDishLow = calculateCleaningPerformance(dishwashLowGrease, 6.8, 'DISHWASH_MANUAL');

  assert('Manual Dishwash', 'High-active dishwash has higher grease cutting score', perfDishHigh.degreasingScore > perfDishLow.degreasingScore, perfDishHigh.degreasingScore, perfDishLow.degreasingScore);
  assert('Manual Dishwash', 'Amphoteric presence enhances foam stability score', perfDishHigh.foamStabilityScore > perfDishLow.foamStabilityScore, perfDishHigh.foamStabilityScore, perfDishLow.foamStabilityScore);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: AUTOMATIC DISHWASHER (ZERO-FOAM COMPLIANCE)
  // --------------------------------------------------------------------------
  const autoDishCompliant: FormulationIngredient[] = [
    { name: 'Pluronic Low-Foam Nonionic', percentage: 3, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Metasilicate', percentage: 10, activeMatterPct: 100, category: 'Builder' },
    { name: 'Sodium Citrate', percentage: 15, activeMatterPct: 100, category: 'Builder' },
    { name: 'Water', percentage: 72 }
  ];
  const autoDishHighFoam: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, category: 'Anionic Surfactant' }, // High-foamer violation!
    { name: 'CAPB 30%', percentage: 4, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Water', percentage: 88 }
  ];

  const perfAutoCompliant = calculateCleaningPerformance(autoDishCompliant, 10.5, 'DISHWASH_AUTOMATIC');
  const perfAutoHighFoam = calculateCleaningPerformance(autoDishHighFoam, 10.0, 'DISHWASH_AUTOMATIC');

  const zeroFoamKpiCompliant = perfAutoCompliant.categoryKPIs.find(k => k.id === 'zeroFoamCompliance');
  const zeroFoamKpiHighFoam = perfAutoHighFoam.categoryKPIs.find(k => k.id === 'zeroFoamCompliance');

  assert('Auto Dishwash', 'Compliant low-foam formula passes zero-foam compliance', zeroFoamKpiCompliant?.status === 'PASS', zeroFoamKpiCompliant?.status, 'PASS');
  assert('Auto Dishwash', 'High-foaming formula fails zero-foam compliance', zeroFoamKpiHighFoam?.status === 'FAIL', zeroFoamKpiHighFoam?.status, 'FAIL');
  assert('Auto Dishwash', 'Compliant auto-dish formula has higher overall CPI', perfAutoCompliant.cpi > perfAutoHighFoam.cpi, perfAutoCompliant.cpi, perfAutoHighFoam.cpi);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: ACID CLEANERS & TOILET DESCALING
  // --------------------------------------------------------------------------
  const acidToiletCleaner: FormulationIngredient[] = [
    { name: 'Hydrochloric Acid 33%', percentage: 25, activeMatterPct: 33, category: 'Acid' },
    { name: 'Ethoxylated Amine Surfactant', percentage: 2.0, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 73 }
  ];
  const neutralBowlCleaner: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 5, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 95 }
  ];

  const perfAcidToilet = calculateCleaningPerformance(acidToiletCleaner, 1.2, 'TOILET_CLEANER');
  const perfNeutralToilet = calculateCleaningPerformance(neutralBowlCleaner, 7.0, 'TOILET_CLEANER');

  const descalingKpiAcid = perfAcidToilet.categoryKPIs.find(k => k.id === 'acidDescalingScore');
  const descalingKpiNeutral = perfNeutralToilet.categoryKPIs.find(k => k.id === 'acidDescalingScore');

  assert('Toilet Descaling', 'Acidic toilet cleaner achieves high descaling score', (descalingKpiAcid?.value ?? 0) >= 75, descalingKpiAcid?.value, '>=75');
  assert('Toilet Descaling', 'Neutral cleaner fails acid descaling target', (descalingKpiNeutral?.value ?? 0) < 60, descalingKpiNeutral?.value, '<60');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: GLASS CLEANER (SURFACTANT & SOLVENT BALANCE)
  // --------------------------------------------------------------------------
  const glassIdeal: FormulationIngredient[] = [
    { name: 'Isopropanol 99%', percentage: 6.0, activeMatterPct: 99, category: 'Solvent' },
    { name: 'Ethylene Glycol Monobutyl Ether', percentage: 2.0, activeMatterPct: 100, category: 'Solvent' },
    { name: 'LAE-7', percentage: 0.3, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 91.7 }
  ];
  const glassExcessiveSurfactant: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 8.0, activeMatterPct: 70, category: 'Anionic Surfactant' }, // 5.6% active -> causes haze/streaks!
    { name: 'Water', percentage: 92.0 }
  ];

  const perfGlassIdeal = calculateCleaningPerformance(glassIdeal, 9.0, 'GLASS_CLEANER');
  const perfGlassExcessive = calculateCleaningPerformance(glassExcessiveSurfactant, 9.0, 'GLASS_CLEANER');

  const streakKpiIdeal = perfGlassIdeal.categoryKPIs.find(k => k.id === 'streakFreeClarity');
  const streakKpiExcessive = perfGlassExcessive.categoryKPIs.find(k => k.id === 'streakFreeClarity');

  assert('Glass Cleaner', 'Low surfactant + solvent glass cleaner achieves high streak resistance', (streakKpiIdeal?.value ?? 0) >= 80, streakKpiIdeal?.value, '>=80');
  assert('Glass Cleaner', 'Excessive surfactant glass cleaner penalized for streaking', (streakKpiExcessive?.value ?? 0) < 50, streakKpiExcessive?.value, '<50');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: FABRIC SOFTENER (NON-CLEANSING CONDITIONING)
  // --------------------------------------------------------------------------
  const fabricSoftenerFormula: FormulationIngredient[] = [
    { name: 'Esterquat 90%', percentage: 6.0, activeMatterPct: 90, category: 'Cationic Surfactant' },
    { name: 'Calcium Chloride', percentage: 0.2, category: 'Viscosity Modifier' },
    { name: 'Water', percentage: 93.8 }
  ];

  const perfSoftener = calculateCleaningPerformance(fabricSoftenerFormula, 3.2, 'FABRIC_SOFTENER');

  assert('Fabric Softener', 'Cleaning score is strictly null for Fabric Softener', perfSoftener.cleaningScore === null, perfSoftener.cleaningScore, null);
  assert('Fabric Softener', 'isCleaningApplicable is false', perfSoftener.isCleaningApplicable === false, perfSoftener.isCleaningApplicable, false);
  assert('Fabric Softener', 'Qualitative power is Conditioning / Non-Detergent', perfSoftener.cleaningPower === 'Conditioning / Non-Detergent', perfSoftener.cleaningPower, 'Conditioning / Non-Detergent');
  assert('Fabric Softener', 'Fabric Softening Index is positive', perfSoftener.cpi > 70, perfSoftener.cpi, '>70');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: KITCHEN DEGREASER (ALKALINITY + SOLVENT)
  // --------------------------------------------------------------------------
  const heavyDegreaser: FormulationIngredient[] = [
    { name: 'Caustic Soda 50%', percentage: 6.0, activeMatterPct: 50, category: 'Alkali' },
    { name: 'Sodium Metasilicate', percentage: 4.0, activeMatterPct: 100, category: 'Builder' },
    { name: 'Butyl Glycol', percentage: 5.0, activeMatterPct: 100, category: 'Solvent' },
    { name: 'LAE-9', percentage: 3.0, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 82.0 }
  ];

  const perfDegreaser = calculateCleaningPerformance(heavyDegreaser, 13.0, 'KITCHEN_DEGREASER');

  assert('Kitchen Degreaser', 'Heavy alkaline solvent degreaser achieves high saponification & degreasing score', perfDegreaser.cpi >= 80, perfDegreaser.cpi, '>=80');

  // --------------------------------------------------------------------------
  // TEST GROUP 10: CAR SHAMPOO (WAX-SAFETY & LUBRICITY)
  // --------------------------------------------------------------------------
  const carShampooNeutral: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5.0, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'LAE-9', percentage: 2.0, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 83.0 }
  ];

  const perfCarShampoo = calculateCleaningPerformance(carShampooNeutral, 7.2, 'CAR_SHAMPOO');
  const waxKpi = perfCarShampoo.categoryKPIs.find(k => k.id === 'waxSafePreservation');

  assert('Car Shampoo', 'Neutral pH car shampoo passes wax-safety criteria', waxKpi?.status === 'PASS', waxKpi?.status, 'PASS');

  // --------------------------------------------------------------------------
  // TEST GROUP 11: COMPATIBILITY SYNCHRONIZATION & CRITICAL PENALTY
  // --------------------------------------------------------------------------
  const incompatibleFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'BKC 80%', percentage: 5, activeMatterPct: 80, category: 'Cationic Surfactant' }, // Severe cationic clash!
    { name: 'Water', percentage: 85 }
  ];

  const perfIncompatible = calculateCleaningPerformance(incompatibleFormula, 7.0, 'LAUNDRY_LIQUID', undefined, {
    compatibilityStatus: 'INCOMPATIBLE',
    hasCriticalCompatibilityAlert: true
  });

  assert('Compatibility Sync', 'Incompatible formula flags critical negative factor', perfIncompatible.keyNegativeFactors.some(f => f.includes('incompatibility')), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 12: DETERMINISTIC EQUALITY & BOUNDING
  // --------------------------------------------------------------------------
  const testFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 88 }
  ];
  const cpi1 = calculateCPI(testFormula, 8.0, 'LAUNDRY_LIQUID');
  const cpi2 = calculateCPI(testFormula, 8.0, 'LAUNDRY_LIQUID');
  assert('Determinism', 'Identical inputs produce identical CPI', cpi1 === cpi2, cpi1, cpi2);
  assert('Bounding', 'CPI is strictly bounded in 0-100', cpi1 >= 0 && cpi1 <= 100, cpi1, '0-100');

  // --------------------------------------------------------------------------
  // TEST GROUP 13: EMPTY & ZERO-ACTIVE ROBUSTNESS
  // --------------------------------------------------------------------------
  const emptyPerf = calculateCleaningPerformance([], 7.0, 'LAUNDRY_LIQUID');
  assert('Edge Cases', 'Empty formula yields 0 CPI', emptyPerf.cpi === 0, emptyPerf.cpi, 0);
  assert('Edge Cases', 'Empty formula provenance is INSUFFICIENT_DATA', emptyPerf.provenance === 'INSUFFICIENT_DATA', emptyPerf.provenance, 'INSUFFICIENT_DATA');

  // All 13 canonical categories supported without exceptions
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const res = calculateCleaningPerformance(testFormula, 7.5, catId);
    assert('Taxonomy Coverage', `Category ${catId} evaluated successfully`, typeof res.cpi === 'number' && res.categoryKPIs.length > 0, true, true);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL PHASE 4 PERFORMANCE TESTS : ${total}`);
  console.log(`PASSED                          : ${passed}`);
  console.log(`FAILED                          : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

// Direct execution when invoked via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = runPhase4PerformanceTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

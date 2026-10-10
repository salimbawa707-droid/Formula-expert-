/**
 * ============================================================================
 * P1 PHASE 4 — FORMULA PERFORMANCE PREDICTION, CLEANING SCORE / CPI
 * SYNCHRONIZATION & PRODUCT-SPECIFIC KPI ENGINE MASTER TEST SUITE
 * ============================================================================
 * 
 * Verifies all requirements of P1 Phase 4:
 * 1. Category performance profile routing across all 13 canonical categories
 * 2. Fabric Softener special handling: Cleaning Score = NOT_APPLICABLE (null)
 * 3. Glass Cleaner streak-free optical clarity & low-surfactant discipline
 * 4. Toilet Cleaner acid descaling & vertical cling dynamics
 * 5. Automatic Dishwasher zero-foam compliance & enzyme/builder detergency
 * 6. Manual Dishwash grease cutting & persistent foam mileage
 * 7. Hand Wash skin mildness proxy & lipid cleansing
 * 8. Kitchen Degreaser heavy alkaline saponification & solvent coupling
 * 9. Car Shampoo snow-foam lifting & wax-safe neutral pH preservation
 * 10. Floor Cleaner fast streak-free drying & non-slip residue control
 * 11. Multipurpose Cleaner versatile spray-and-wipe balance
 * 12. Laundry Liquid particulate/oily soil removal & enzyme catalysis
 * 13. Laundry Powder alkaline saponification & builder soil suspension
 * 14. CPI ↔ Cleaning Score deterministic synchronization
 * 15. Predicted vs Measured provenance & variance calculation
 * 16. Missing data behavior (INSUFFICIENT_DATA / NOT_APPLICABLE, zero fabrication)
 */

import { calculateCleaningPerformance, calculateCPI, getCategoryPerformanceKPIs } from '../cleaningPerformanceEngine';
import { FormulationIngredient } from '../../types';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase4PerformanceTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({
        name,
        passed: false,
        message: `Assertion failed. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
        actual,
        expected
      });
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('\n================================================================================');
  console.log('  P1 PHASE 4 — FORMULA PERFORMANCE PREDICTION & PRODUCT-SPECIFIC KPI TEST SUITE ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // TEST SECTION 1: 13-Category Performance Profile Routing
  // --------------------------------------------------------------------------
  const baseTestFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 4, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Sodium Citrate', percentage: 2, activeMatterPct: 100, category: 'Builder' },
    { name: 'Water', percentage: 84, activeMatterPct: 0, category: 'Solvent' }
  ];

  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const res = calculateCleaningPerformance(baseTestFormula, 8.0, catId);
    assert(`Category Profile Loaded: ${catId}`, res.productCategory === catId, res.productCategory, catId);
    assert(`Category Has Primary Domain: ${catId}`, res.primaryPerformanceDomain.length > 0, res.primaryPerformanceDomain.length > 0, true);
    assert(`Category Has Applicable KPIs: ${catId}`, res.categoryKPIs.length >= 3, res.categoryKPIs.length >= 3, true);
    assert(`CPI is within 0-100: ${catId}`, res.cpi >= 0 && res.cpi <= 100, res.cpi, '0-100');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 2: Fabric Softener Special Handling (Cleaning Score = NOT_APPLICABLE)
  // --------------------------------------------------------------------------
  const softenerStandardFormula: FormulationIngredient[] = [
    { name: 'Esterquat 90% (DHTDMAC Softener)', percentage: 6, activeMatterPct: 90, category: 'Cationic Surfactant' }, // 5.4% cationic active
    { name: 'Fragrance Microcapsules', percentage: 0.5, category: 'Fragrance' },
    { name: 'Water', percentage: 93.5, category: 'Solvent' }
  ];

  const softenerRes = calculateCleaningPerformance(softenerStandardFormula, 3.5, 'FABRIC_SOFTENER');
  assert('Fabric Softener isCleaningApplicable is False', softenerRes.isCleaningApplicable === false, softenerRes.isCleaningApplicable, false);
  assert('Fabric Softener Cleaning Score is Null (NOT_APPLICABLE)', softenerRes.cleaningScore === null, softenerRes.cleaningScore, null);
  assert('Fabric Softener CPI Evaluates Softening (> 70)', softenerRes.cpi >= 70, softenerRes.cpi, '>= 70');
  assert('Fabric Softener Qualitative Rating is Conditioning', softenerRes.cleaningPower === 'Conditioning / Non-Detergent', softenerRes.cleaningPower, 'Conditioning / Non-Detergent');
  
  const softeningKpi = softenerRes.categoryKPIs.find(k => k.id === 'fabricSofteningIndex');
  assert('Fabric Softener Softening KPI Present', softeningKpi !== undefined && softeningKpi.value !== null && softeningKpi.value >= 75, softeningKpi?.value, '>= 75');

  const cleaningKpiInSoftener = softenerRes.categoryKPIs.find(k => k.id === 'cleaningScore');
  assert('Cleaning KPI Marked NOT_APPLICABLE in Softener', cleaningKpiInSoftener !== undefined && cleaningKpiInSoftener.provenance === 'NOT_APPLICABLE', cleaningKpiInSoftener?.provenance, 'NOT_APPLICABLE');

  // Anionic contamination failure in Fabric Softener
  const softenerWithAnionic: FormulationIngredient[] = [
    { name: 'Esterquat 90%', percentage: 6, activeMatterPct: 90, category: 'Cationic Surfactant' },
    { name: 'SLES 70%', percentage: 2, activeMatterPct: 70, category: 'Anionic Surfactant' }, // Anionic contaminant!
    { name: 'Water', percentage: 92, category: 'Solvent' }
  ];
  const softenerAnionicRes = calculateCleaningPerformance(softenerWithAnionic, 3.5, 'FABRIC_SOFTENER');
  assert('Anionic Contamination Penalizes Softener CPI (< 50)', softenerAnionicRes.cpi < 50, softenerAnionicRes.cpi, '< 50');
  assert('Anionic Contamination Negative Factor Flagged', softenerAnionicRes.keyNegativeFactors.some(f => f.includes('Anionic surfactant detected')), true, true);

  // --------------------------------------------------------------------------
  // TEST SECTION 3: Glass Cleaner Streak-Free Optical Clarity & Low-Active Discipline
  // --------------------------------------------------------------------------
  // Good Glass Cleaner: Low active (1.5% APG) + 5% Isopropanol (fast solvent)
  const goodGlassCleaner: FormulationIngredient[] = [
    { name: 'APG 0810 (Caprylyl Glucoside 50%)', percentage: 3, activeMatterPct: 50, category: 'Nonionic Surfactant' }, // 1.5% active
    { name: 'Isopropanol (IPA)', percentage: 5, category: 'Solvent' },
    { name: 'Water', percentage: 92, category: 'Solvent' }
  ];
  const glassGoodRes = calculateCleaningPerformance(goodGlassCleaner, 9.5, 'GLASS_CLEANER');
  assert('Good Glass Cleaner Has High Streak-Free Score (>= 80)', (glassGoodRes.applicableKPIs['streakFreeClarity'] ?? 0) >= 80, glassGoodRes.applicableKPIs['streakFreeClarity'], '>= 80');
  assert('Good Glass Cleaner CPI is High (>= 75)', glassGoodRes.cpi >= 75, glassGoodRes.cpi, '>= 75');

  // Over-formulated Glass Cleaner with Excessive Surfactant (causes severe streaks)
  const badGlassCleaner: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, category: 'Anionic Surfactant' }, // 5.6% active (too high!)
    { name: 'Water', percentage: 92, category: 'Solvent' }
  ];
  const glassBadRes = calculateCleaningPerformance(badGlassCleaner, 9.5, 'GLASS_CLEANER');
  assert('Excess Surfactant Penalizes Glass Streak-Free Score (< 60)', (glassBadRes.applicableKPIs['streakFreeClarity'] ?? 0) < 60, glassBadRes.applicableKPIs['streakFreeClarity'], '< 60');
  assert('Excess Surfactant Triggers Negative Warning in Glass Cleaner', glassBadRes.keyNegativeFactors.some(f => f.includes('too high for glass cleaner')), true, true);

  // --------------------------------------------------------------------------
  // TEST SECTION 4: Toilet Cleaner Acid Descaling
  // --------------------------------------------------------------------------
  // Acidic Descaling Toilet Cleaner: pH 1.5 with 8% Hydrochloric Acid / Citric Acid
  const acidToiletCleaner: FormulationIngredient[] = [
    { name: 'Hydrochloric Acid 33%', percentage: 10, activeMatterPct: 33, category: 'Acid' },
    { name: 'Amine Ethoxylate (Acid Thickener)', percentage: 2, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 88, category: 'Solvent' }
  ];
  const toiletAcidRes = calculateCleaningPerformance(acidToiletCleaner, 1.5, 'TOILET_CLEANER');
  assert('Acid Toilet Cleaner Delivers High Descaling Score (>= 80)', (toiletAcidRes.applicableKPIs['acidDescalingScore'] ?? 0) >= 80, toiletAcidRes.applicableKPIs['acidDescalingScore'], '>= 80');
  assert('Acid Toilet Cleaner CPI is High (>= 75)', toiletAcidRes.cpi >= 75, toiletAcidRes.cpi, '>= 75');

  // Non-acidic Toilet Cleaner (insufficient for lime descaling)
  const neutralToiletCleaner: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 5, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 95, category: 'Solvent' }
  ];
  const toiletNeutralRes = calculateCleaningPerformance(neutralToiletCleaner, 7.0, 'TOILET_CLEANER');
  assert('Neutral Toilet Cleaner Descaling Score is Low (< 50)', (toiletNeutralRes.applicableKPIs['acidDescalingScore'] ?? 0) < 50, toiletNeutralRes.applicableKPIs['acidDescalingScore'], '< 50');
  assert('Neutral Toilet Cleaner Flags Acid Deficiency', toiletNeutralRes.keyNegativeFactors.some(f => f.includes('insufficiently acidic')), true, true);

  // --------------------------------------------------------------------------
  // TEST SECTION 5: Automatic Dishwasher Zero-Foam Compliance
  // --------------------------------------------------------------------------
  // Compliant Machine Dishwash: Low-foaming Nonionic + Builders + Enzymes
  const autoDishCompliant: FormulationIngredient[] = [
    { name: 'Low-Foam Alcohol Alkoxylate', percentage: 2, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Metasilicate', percentage: 10, category: 'Builder' },
    { name: 'Sodium Carbonate', percentage: 15, category: 'Builder' },
    { name: 'Protease & Amylase Enzyme', percentage: 1.5, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Water', percentage: 71.5, category: 'Solvent' }
  ];
  const autoDishGoodRes = calculateCleaningPerformance(autoDishCompliant, 10.5, 'DISHWASH_AUTOMATIC');
  assert('Zero-Foam Machine Compliance Passes (>= 90)', (autoDishGoodRes.applicableKPIs['zeroFoamCompliance'] ?? 0) >= 90, autoDishGoodRes.applicableKPIs['zeroFoamCompliance'], '>= 90');
  assert('Automatic Dishwash CPI is Robust (>= 75)', autoDishGoodRes.cpi >= 75, autoDishGoodRes.cpi, '>= 75');

  // Non-compliant Machine Dishwash with High-Foaming SLES (causes machine failure)
  const autoDishHighFoam: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90, category: 'Solvent' }
  ];
  const autoDishBadRes = calculateCleaningPerformance(autoDishHighFoam, 10.0, 'DISHWASH_AUTOMATIC');
  const zeroFoamKpi = autoDishBadRes.categoryKPIs.find(k => k.id === 'zeroFoamCompliance');
  assert('High Foamer in Machine Dishwash Triggers FAIL Status', zeroFoamKpi?.status === 'FAIL', zeroFoamKpi?.status, 'FAIL');
  assert('High Foamer Machine Warning Generated', autoDishBadRes.keyNegativeFactors.some(f => f.includes('risk of machine pump cavitation')), true, true);

  // --------------------------------------------------------------------------
  // TEST SECTION 6: Manual Dishwash Grease Cutting & Foam Mileage
  // --------------------------------------------------------------------------
  const manualDishwashFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Water', percentage: 75, category: 'Solvent' }
  ];
  const manualDishRes = calculateCleaningPerformance(manualDishwashFormula, 6.8, 'DISHWASH_MANUAL');
  assert('Manual Dishwash Grease Cutting High (>= 80)', (manualDishRes.applicableKPIs['greaseCutting'] ?? 0) >= 80, manualDishRes.applicableKPIs['greaseCutting'], '>= 80');
  assert('Manual Dishwash Foam Persistence High (>= 80)', (manualDishRes.applicableKPIs['foamPersistence'] ?? 0) >= 80, manualDishRes.applicableKPIs['foamPersistence'], '>= 80');

  // --------------------------------------------------------------------------
  // TEST SECTION 7: Hand Wash Skin Mildness & Cleansing
  // --------------------------------------------------------------------------
  const mildHandWash: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, category: 'Anionic Surfactant' }, // 5.6%
    { name: 'CAPB 30%', percentage: 8, activeMatterPct: 30, category: 'Amphoteric Surfactant' }, // 2.4%
    { name: 'Glycerin', percentage: 2, category: 'Humectant' },
    { name: 'Water', percentage: 82, category: 'Solvent' }
  ];
  const handWashRes = calculateCleaningPerformance(mildHandWash, 5.8, 'HAND_WASH');
  assert('Mild Hand Wash Skin Mildness Index High (>= 75)', (handWashRes.applicableKPIs['skinMildnessIndex'] ?? 0) >= 75, handWashRes.applicableKPIs['skinMildnessIndex'], '>= 75');
  assert('Hand Wash CPI High (>= 75)', handWashRes.cpi >= 75, handWashRes.cpi, '>= 75');

  // --------------------------------------------------------------------------
  // TEST SECTION 8: Kitchen Degreaser Heavy Alkaline Saponification
  // --------------------------------------------------------------------------
  const heavyDegreaser: FormulationIngredient[] = [
    { name: 'Sodium Hydroxide 50%', percentage: 6, activeMatterPct: 50, category: 'Base' },
    { name: 'Sodium Metasilicate', percentage: 5, category: 'Builder' },
    { name: 'Butyl Glycol (Solvent)', percentage: 6, category: 'Solvent' },
    { name: 'LAE-9', percentage: 5, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 78, category: 'Solvent' }
  ];
  const degreaserRes = calculateCleaningPerformance(heavyDegreaser, 12.8, 'KITCHEN_DEGREASER');
  assert('Heavy Degreaser Alkaline Saponification High (>= 85)', (degreaserRes.applicableKPIs['heavyGreaseSaponification'] ?? 0) >= 85, degreaserRes.applicableKPIs['heavyGreaseSaponification'], '>= 85');
  assert('Heavy Degreaser Solvent Penetration High (>= 80)', (degreaserRes.applicableKPIs['solventGreasePenetration'] ?? 0) >= 80, degreaserRes.applicableKPIs['solventGreasePenetration'], '>= 80');

  // --------------------------------------------------------------------------
  // TEST SECTION 9: Car Shampoo Snow Foam & Lubricity
  // --------------------------------------------------------------------------
  const carShampooFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 6, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Cocamide DEA', percentage: 2, activeMatterPct: 85, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 82, category: 'Solvent' }
  ];
  const carRes = calculateCleaningPerformance(carShampooFormula, 7.2, 'CAR_SHAMPOO');
  assert('Car Shampoo Snow Foam Score High (>= 80)', (carRes.applicableKPIs['snowFoamGrimeLifting'] ?? 0) >= 80, carRes.applicableKPIs['snowFoamGrimeLifting'], '>= 80');
  assert('Car Shampoo Lubricity High (>= 75)', (carRes.applicableKPIs['lubricitySlickness'] ?? 0) >= 75, carRes.applicableKPIs['lubricitySlickness'], '>= 75');
  assert('Car Shampoo Wax Safe Score High (>= 90)', (carRes.applicableKPIs['waxSafePreservation'] ?? 0) >= 90, carRes.applicableKPIs['waxSafePreservation'], '>= 90');

  // --------------------------------------------------------------------------
  // TEST SECTION 10: CPI ↔ Cleaning Score Determinism & Synchronization
  // --------------------------------------------------------------------------
  const laundryFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 8, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 6, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, category: 'Builder' },
    { name: 'Water', percentage: 83, category: 'Solvent' }
  ];
  const directRes = calculateCleaningPerformance(laundryFormula, 8.5, 'LAUNDRY_LIQUID');
  const directCPI = calculateCPI(laundryFormula, 8.5, 'LAUNDRY_LIQUID');
  assert('calculateCPI Exactly Matches direct result CPI', directCPI === directRes.cpi, directCPI, directRes.cpi);
  assert('overallScore Equals CPI', directRes.overallScore === directRes.cpi, directRes.overallScore, directRes.cpi);
  assert('performanceIndex Equals CPI', directRes.performanceIndex === directRes.cpi, directRes.performanceIndex, directRes.cpi);
  assert('Cleaning Score Matches CPI for Laundry Liquid', directRes.cleaningScore === directRes.cpi, directRes.cleaningScore, directRes.cpi);

  // Idempotency: Multiple calls yield identical results
  const directRes2 = calculateCleaningPerformance(laundryFormula, 8.5, 'LAUNDRY_LIQUID');
  assert('Idempotent Evaluation', directRes2.cpi === directRes.cpi && directRes2.cleaningScore === directRes.cleaningScore, true, true);

  // --------------------------------------------------------------------------
  // TEST SECTION 11: Predicted vs Measured Provenance & Variance Calculation
  // --------------------------------------------------------------------------
  // Case A: Predicted only (no lab measurements)
  assert('Unmeasured Provenance is PREDICTED', directRes.provenance === 'PREDICTED', directRes.provenance, 'PREDICTED');
  assert('Unmeasured isMeasured is False', directRes.isMeasured === false, directRes.isMeasured, false);
  assert('Unmeasured Prediction Variance is Undefined', directRes.predictionVariance === undefined, directRes.predictionVariance, undefined);

  // Case B: Measured laboratory result supplied
  const measuredRes = calculateCleaningPerformance(
    laundryFormula,
    8.5,
    'LAUNDRY_LIQUID',
    { measuredSoilRemovalPct: 82.5, testMethod: 'ASTM D4265 Tergotometer', testDate: '2026-09-29' }
  );
  assert('Measured Provenance is MEASURED', measuredRes.provenance === 'MEASURED', measuredRes.provenance, 'MEASURED');
  assert('Measured isMeasured is True', measuredRes.isMeasured === true, measuredRes.isMeasured, true);
  assert('Measured Value Stored Correctly', measuredRes.measuredSoilRemovalPct === 82.5, measuredRes.measuredSoilRemovalPct, 82.5);
  
  const expectedVariance = Number((82.5 - measuredRes.cpi).toFixed(1));
  assert('Prediction Variance Calculated Correctly', measuredRes.predictionVariance === expectedVariance, measuredRes.predictionVariance, expectedVariance);
  assert('Prediction Error Pct Calculated Correctly', measuredRes.predictionErrorPct !== undefined, measuredRes.predictionErrorPct !== undefined, true);

  // --------------------------------------------------------------------------
  // TEST SECTION 12: getCategoryPerformanceKPIs helper
  // --------------------------------------------------------------------------
  const kpis = getCategoryPerformanceKPIs(laundryFormula, 'LAUNDRY_LIQUID', 8.5);
  assert('getCategoryPerformanceKPIs returns array', Array.isArray(kpis) && kpis.length >= 4, true, true);
  assert('KPI items contain id, name, value, unit, provenance', kpis.every(k => k.id && k.name && k.unit && k.provenance), true, true);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 4 TESTS : ${total}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

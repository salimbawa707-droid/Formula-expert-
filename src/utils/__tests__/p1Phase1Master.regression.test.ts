/**
 * ============================================================================
 * P1 PHASE 1 — SCIENTIFIC CALCULATION & FORMULA ANALYSIS MASTER TEST SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. Active Matter vs Solids / Carrier Water Balance (Raw vs Active distinction)
 * 2. 8% vs 10% Target Architectural Integrity (Category SSOT)
 * 3. Surfactant Total: Raw vs Active Breakdown
 * 4. HLB Engine: Active Weighting, Griffin vs Davies, Category Applicability
 * 5. Mixed CMC Engine: Clint Ideal Model, Active Fraction Basis, Predicted Provenance
 * 6. Chelation & Hard Water: Full Stoichiometry, 300 ppm load, Dynamic Requirement
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { 
  ActiveMatterEngine
} from '../activeMatterEngine';
import { 
  HLBEngine
} from '../hlbEngine';
import { 
  calculateMixedCMC 
} from '../calculators';
import { 
  getChelatorBindingCapacity,
  calculateWaterHardnessLoad,
  calculateFormulationChelationCapacity,
  calculateWaterHardnessTolerance,
  calculateDynamicChelatorRequirement,
  AUTHORITATIVE_CHELATOR_DATABASE,
  MW_CACO3
} from '../chelatorEngine';
import { 
  getProductCategory,
  CANONICAL_PRODUCT_CATEGORY_IDS 
} from '../../domain/productTaxonomy';
import { 
  SCIENTIFIC_PRODUCT_PROFILES 
} from '../../domain/scientificProductProfiles';

export interface P1TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message: string;
}

const results: P1TestResult[] = [];

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

export function runP1Phase1MasterTestSuite() {
  results.length = 0;

  console.log("================================================================================");
  console.log("  P1 PHASE 1 — SCIENTIFIC CALCULATION & FORMULA ANALYSIS MASTER TEST SUITE      ");
  console.log("================================================================================");

  // =========================================================================
  // SECTION 1: ACTIVE MATTER VS SOLIDS / CARRIER WATER BALANCE
  // =========================================================================
  // Diluted Surfactant: SLES 28% Liquid @ 10% formula dosage -> 2.80% active surfactant, 7.20% carried water
  const diluteSLES: FormulationIngredient[] = [
    { id: '1', name: 'SLES 28% Liquid', percentage: 10, activeMatterPct: 28 },
    { id: '2', name: 'Deionized Water', percentage: 90, activeMatterPct: 0 }
  ];
  const diluteReport = ActiveMatterEngine.calculateActiveMatterReport(diluteSLES, 100);
  assertNear('Active Matter', 'Dilute Surfactant Active % (10% of SLES 28%)', diluteReport.surfactants.totalActiveSurfactants, 2.80);
  assertNear('Active Matter', 'Dilute Surfactant Raw % (10% of SLES 28%)', diluteReport.surfactants.totalRawSurfactants, 10.00);
  assertNear('Active Matter', 'Dilute Surfactant Carried Water %', diluteReport.waterBalance.carriedWaterPct, 7.20);
  assertNear('Active Matter', 'Dilute Surfactant Total Water % (90% free + 7.2% carried)', diluteReport.waterBalance.totalWaterPct, 97.20);

  // Concentrated Surfactant: SLES 70% Paste @ 10% formula dosage -> 7.00% active surfactant, 3.00% carried water
  const concSLES: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70% Paste', percentage: 10, activeMatterPct: 70 },
    { id: '2', name: 'Deionized Water', percentage: 90, activeMatterPct: 0 }
  ];
  const concReport = ActiveMatterEngine.calculateActiveMatterReport(concSLES, 100);
  assertNear('Active Matter', 'Concentrated Surfactant Active % (10% of SLES 70%)', concReport.surfactants.totalActiveSurfactants, 7.00);
  assertNear('Active Matter', 'Concentrated Surfactant Carried Water %', concReport.waterBalance.carriedWaterPct, 3.00);

  // Mixed Surfactant System:
  // - LABSA 96% @ 8% -> 7.68% active anionic
  // - SLES 70% @ 10% -> 7.00% active anionic
  // - CAPB 30% @ 5% -> 1.50% active amphoteric
  // - LAE-9 100% @ 2% -> 2.00% active nonionic
  // - Sodium Citrate @ 2% (100% active builder, 0% surfactant)
  // - Free Water @ 73%
  const mixedFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 96% (Acid Slurry)', percentage: 8, activeMatterPct: 96 },
    { id: '2', name: 'SLES 70%', percentage: 10, activeMatterPct: 70 },
    { id: '3', name: 'CAPB 30%', percentage: 5, activeMatterPct: 30 },
    { id: '4', name: 'Linear Alcohol Ethoxylate 9EO (LAE-9 100%)', percentage: 2, activeMatterPct: 100 },
    { id: '5', name: 'Sodium Citrate Dihydrate', percentage: 2, activeMatterPct: 100 },
    { id: '6', name: 'Deionized Water', percentage: 73, activeMatterPct: 0 }
  ];
  const mixedReport = ActiveMatterEngine.calculateActiveMatterReport(mixedFormula, 100);
  assertNear('Active Matter', 'Mixed Total Raw Surfactant % (8+10+5+2)', mixedReport.surfactants.totalRawSurfactants, 25.00);
  assertNear('Active Matter', 'Mixed Total Active Surfactant % (7.68+7.00+1.50+2.00)', mixedReport.surfactants.totalActiveSurfactants, 18.18);
  assertNear('Active Matter', 'Mixed Anionic Active % (7.68+7.00)', mixedReport.surfactants.anionicActivePct, 14.68);
  assertNear('Active Matter', 'Mixed Amphoteric Active %', mixedReport.surfactants.amphotericActivePct, 1.50);
  assertNear('Active Matter', 'Mixed Nonionic Active %', mixedReport.surfactants.nonionicActivePct, 2.00);
  assertNear('Active Matter', 'Mixed Total Active Matter % (includes 2% builder)', mixedReport.totalActiveMatter, 20.18);
  assertNear('Active Matter', 'Mixed Carried Water % ((8-7.68) + (10-7) + (5-1.5))', mixedReport.waterBalance.carriedWaterPct, 6.82);
  assertNear('Active Matter', 'Mixed Total Water % (73% free + 6.82% carried)', mixedReport.waterBalance.totalWaterPct, 79.82);

  // =========================================================================
  // SECTION 2: 8% vs 10% TARGET ARCHITECTURAL INTEGRITY (Category SSOT)
  // =========================================================================
  // Verify all 13 canonical categories resolve specific active matter targets cleanly
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const catDef = getProductCategory(catId);
    const profile = SCIENTIFIC_PRODUCT_PROFILES[catId];
    assert(catDef !== undefined && catDef !== null, 'Target Integrity', `${catId} Category Definition Exists`);
    assert(profile !== undefined && profile !== null, 'Target Integrity', `${catId} Scientific Profile Exists`);
    if (catDef) {
      assert(catDef.activeMatterMinPct > 0, 'Target Integrity', `${catId} Min Active Defined`, `Min: ${catDef.activeMatterMinPct}%`);
      assert(catDef.activeMatterTargetPct >= catDef.activeMatterMinPct, 'Target Integrity', `${catId} Target >= Min`, `Target: ${catDef.activeMatterTargetPct}%`);
    }
  }

  // Verify specific category targets
  const laundryLiq = getProductCategory('LAUNDRY_LIQUID');
  assertNear('Target Integrity', 'Laundry Liquid Min Active Matter', laundryLiq?.activeMatterMinPct ?? 0, 10);
  assertNear('Target Integrity', 'Laundry Liquid Target Active Matter', laundryLiq?.activeMatterTargetPct ?? 0, 16);

  const autoDish = getProductCategory('DISHWASH_AUTOMATIC');
  assertNear('Target Integrity', 'Auto Dishwash Min Active Matter', autoDish?.activeMatterMinPct ?? 0, 4);
  assertNear('Target Integrity', 'Auto Dishwash Target Active Matter', autoDish?.activeMatterTargetPct ?? 0, 8);

  const glassClean = getProductCategory('GLASS_CLEANER');
  assertNear('Target Integrity', 'Glass Cleaner Min Active Matter', glassClean?.activeMatterMinPct ?? 0, 1);

  // =========================================================================
  // SECTION 3: HLB ENGINE (ACTIVE WEIGHTING & CATEGORY APPLICABILITY)
  // =========================================================================
  // Blend of nonionics: 60% LAE-7 (HLB 12.1, 100% active) + 40% Span 80 (HLB 4.3, 100% active)
  // Blended HLB = (0.6 * 12.1) + (0.4 * 4.3) = 7.26 + 1.72 = 8.98
  const hlbFormula: FormulationIngredient[] = [
    { id: '1', name: 'LAE-7 (Alcohol Ethoxylate 7EO)', percentage: 6, activeMatterPct: 100 },
    { id: '2', name: 'Span 80 (Sorbitan Monooleate)', percentage: 4, activeMatterPct: 100 },
    { id: '3', name: 'Water', percentage: 90, activeMatterPct: 0 }
  ];
  const hlbRes = HLBEngine.calculateBlendedHLB(hlbFormula);
  assertNear('HLB Engine', 'Nonionic Blended HLB Calculation', hlbRes.blendedHLB, 8.98, 0.05);
  assert(hlbRes.emulsionRegion === 'Oil-in-Water (O/W) Emulsifier', 'HLB Engine', 'O/W Emulsion Region Identified', hlbRes.emulsionRegion);

  // Extended ionic surfactant on Davies scale (SLES 70% with Davies HLB 40.0)
  const ionicHLBFormula: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70%', percentage: 10, activeMatterPct: 70 },
    { id: '2', name: 'Water', percentage: 90, activeMatterPct: 0 }
  ];
  const ionicHLBRes = HLBEngine.calculateBlendedHLB(ionicHLBFormula);
  assertNear('HLB Engine', 'Ionic Davies HLB', ionicHLBRes.blendedHLB, 40.0);
  assert(ionicHLBRes.hasIonicSurfactants === true, 'HLB Engine', 'Ionic Surfactant Flagged');

  // Category applicability
  assert(laundryLiq?.categoryApplicability.hlb === true, 'HLB Engine', 'HLB Applicable for Laundry Liquid');
  const laundryPowder = getProductCategory('LAUNDRY_POWDER');
  assert(laundryPowder?.categoryApplicability.hlb === false, 'HLB Engine', 'HLB NOT Applicable for Laundry Powder');
  const toiletClean = getProductCategory('TOILET_CLEANER');
  assert(toiletClean?.categoryApplicability.hlb === false, 'HLB Engine', 'HLB NOT Applicable for Toilet Cleaner');

  // =========================================================================
  // SECTION 4: MIXED CMC ENGINE (CLINT IDEAL MODEL & ACTIVE FRACTION)
  // =========================================================================
  // SLES (CMC = 0.3 mM, MW = 380) + CAPB (CMC = 0.09 mM, MW = 342)
  // Formula: 10% SLES 70% (7.0% active) + 5% CAPB 30% (1.5% active)
  // Total active = 8.5%
  // alpha_SLES = 7.0 / 8.5 = 0.8235
  // alpha_CAPB = 1.5 / 8.5 = 0.1765
  // 1/CMC_mix = (0.8235 / 0.3) + (0.1765 / 0.09) = 2.745 + 1.961 = 4.706
  // CMC_mix = 1 / 4.706 = 0.2125 mM
  const cmcFormula: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70%', percentage: 10, activeMatterPct: 70 },
    { id: '2', name: 'CAPB 30%', percentage: 5, activeMatterPct: 30 },
    { id: '3', name: 'Water', percentage: 85, activeMatterPct: 0 }
  ];
  const cmcRes = calculateMixedCMC(cmcFormula);
  assert(cmcRes !== null, 'Mixed CMC', 'CMC Result Generated');
  if (cmcRes) {
    assertNear('Mixed CMC', 'Ideal Mixed CMC Molar (mM)', cmcRes.molar, 0.212, 0.05);
    assert(cmcRes.modelType.includes('Clint'), 'Mixed CMC', 'Model Identified as Clint Ideal Mixed Pseudophase');
    assert(cmcRes.hasSynergyPair === true, 'Mixed CMC', 'Anionic-Amphoteric Synergy Flagged');
  }

  // =========================================================================
  // SECTION 5: CHELATION & HARD WATER STOICHIOMETRY & 300 PPM LOAD
  // =========================================================================
  // Chemical Database Constants
  assertNear('Chelation Stoichiometry', 'MW of CaCO3 Constant', MW_CACO3, 100.0869, 0.001);
  assert(AUTHORITATIVE_CHELATOR_DATABASE.length >= 8, 'Chelation Stoichiometry', 'Authoritative Database Populated');

  // Specific Binding Capacities
  assertNear('Chelation Stoichiometry', 'GLDA 47% Liquid Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('GLDA 47% Liquid'), 137);
  assertNear('Chelation Stoichiometry', 'MGDA 38% Liquid Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('MGDA 38% Liquid'), 155);
  assertNear('Chelation Stoichiometry', 'Sodium Citrate Dihydrate Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('Sodium Citrate Dihydrate'), 150);
  assertNear('Chelation Stoichiometry', 'Sodium Gluconate Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('Sodium Gluconate'), 76);
  assertNear('Chelation Stoichiometry', 'EDTA Tetrasodium Powder Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('EDTA Tetrasodium'), 220);
  assertNear('Chelation Stoichiometry', 'EDTA 39% Liquid Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('Tetrasodium EDTA 39% Liquid'), 103);
  assertNear('Chelation Stoichiometry', 'STPP 94% Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('Sodium Tripolyphosphate (STPP 94%)'), 180);
  assertNear('Chelation Stoichiometry', 'HEDP Phosphonate Binding Capacity (mg CaCO3 / g)', getChelatorBindingCapacity('HEDP / Etidronate'), 250);

  // 300 PPM Hardness Load:
  // 300 mg CaCO3/L * 10 L wash liquor = 3,000 mg CaCO3 load
  // With 25% safety margin = 3,000 * 1.25 = 3,750 mg CaCO3 demand
  const load300 = calculateWaterHardnessLoad(300, 10);
  assertNear('Hardness Load', '300 ppm in 10 L Wash Liquor (mg CaCO3)', load300, 3000);

  // Formula with 2% GLDA 47% in 20g dose:
  // GLDA mass = (2 / 100) * 20g = 0.40 g
  // CaCO3 bound = 0.40 g * 137 mg/g = 54.80 mg CaCO3
  const singleChelFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2 }
  ];
  const cap2PctGLDA = calculateFormulationChelationCapacity(singleChelFormula, 20);
  assertNear('Formulation Chelation', '2% GLDA 47% Sequestration in 20g Dose (mg CaCO3)', cap2PctGLDA.totalSequestrationMg, 54.80);
  assert(cap2PctGLDA.details[0].molecularWeight === 351.13, 'Formulation Chelation', 'GLDA Molecular Weight Resolved (351.13 g/mol)');

  // Multi-Chelator Formula: 2% GLDA 47% (54.8 mg) + 3% Sodium Citrate (0.6g * 150 = 90.0 mg) + 1% MGDA 38% (0.2g * 155 = 31.0 mg)
  // Total = 54.8 + 90.0 + 31.0 = 175.8 mg CaCO3 in 20g dose
  const multiChelFormula: FormulationIngredient[] = [
    { id: '1', name: 'GLDA 47% Liquid', percentage: 2 },
    { id: '2', name: 'Sodium Citrate Dihydrate', percentage: 3 },
    { id: '3', name: 'MGDA 38% Liquid', percentage: 1 },
    { id: '4', name: 'Water', percentage: 94 }
  ];
  const multiCapRes = calculateFormulationChelationCapacity(multiChelFormula, 20);
  assertNear('Formulation Chelation', 'Multi-Chelator Aggregated Capacity (mg CaCO3)', multiCapRes.totalSequestrationMg, 175.80);

  // =========================================================================
  // SECTION 6: DYNAMIC CHELATOR REQUIREMENT
  // =========================================================================
  // At 150 ppm in 10L: Load = 1500 mg, Required (25% margin) = 1875 mg
  // Unchelated formula (0 mg capacity): Deficit = 1875 mg
  // Additional GLDA 47% required in 20g dose:
  // GLDA grams needed = 1875 / 137 = 13.686 g
  // Formula % = (13.686 / 20) * 100 = 68.43%
  const unchelatedFormula: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70%', percentage: 10 },
    { id: '2', name: 'Water', percentage: 90 }
  ];
  const dynUnchelated = calculateDynamicChelatorRequirement(unchelatedFormula, 150, 10, 20, 25);
  assert(dynUnchelated.isSufficient === false, 'Dynamic Requirement', 'Unchelated Formula Flags Deficit');
  assertNear('Dynamic Requirement', 'Hardness Load (150 ppm, 10L)', dynUnchelated.hardnessLoadMg, 1500);
  assertNear('Dynamic Requirement', 'Required Target (25% safety margin)', dynUnchelated.requiredSequestrationMg, 1875);
  assertNear('Dynamic Requirement', 'Capacity Deficit (mg CaCO3)', dynUnchelated.capacityDeficitMg, 1875);
  assertNear('Dynamic Requirement', 'Additional GLDA 47% Required %', dynUnchelated.additionalGLDA47RequiredPct, 68.43, 0.1);

  // Sufficient Formula: Formula providing 2000 mg capacity (> 1875 mg requirement)
  // Additional required = 0
  const sufficientFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 70 }, // In 20g dose = 14g * 150 = 2100 mg
    { id: '2', name: 'Water', percentage: 30 }
  ];
  const dynSufficient = calculateDynamicChelatorRequirement(sufficientFormula, 150, 10, 20, 25);
  assert(dynSufficient.isSufficient === true, 'Dynamic Requirement', 'Sufficient Formula Flags Zero Deficit');
  assertNear('Dynamic Requirement', 'Deficit for Sufficient Formula', dynSufficient.capacityDeficitMg, 0);
  assertNear('Dynamic Requirement', 'Additional GLDA for Sufficient Formula', dynSufficient.additionalGLDA47RequiredPct, 0);
  assertNear('Dynamic Requirement', 'Additional Citrate for Sufficient Formula', dynSufficient.additionalCitrateRequiredPct, 0);

  // Water Hardness Tolerance Result Object Integrity
  const tolRes = calculateWaterHardnessTolerance(mixedFormula, 150, 10, 20, 100);
  assert(tolRes.provenance === 'CALCULATED', 'Water Hardness Tolerance', 'Provenance is CALCULATED');
  assert(typeof tolRes.toString() === 'string', 'Water Hardness Tolerance', 'toString method works');
  assert(typeof tolRes.valueOf() === 'string', 'Water Hardness Tolerance', 'valueOf method works');

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P1 PHASE 1 TESTS : ${results.length}`);
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

if (process.argv[1] && process.argv[1].includes('p1Phase1Master.regression.test')) {
  runP1Phase1MasterTestSuite();
}

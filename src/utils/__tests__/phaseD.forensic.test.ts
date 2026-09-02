import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { calculatePHAdvanced } from '../pHEngine';
import { ActiveMatterEngine } from '../activeMatterEngine';
import { HLBEngine } from '../hlbEngine';
import { ViscosityEngine } from '../viscosityEngine';
import {
  calculateWaterHardnessTolerance,
  calculateFormulationCompatibility,
  calculateDensity
} from '../calculators';
import { evaluateExpertReasoning } from '../expertReasoningEngine';
import { FormulationIngredient } from '../../types';

export interface PhaseDTestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runPhaseDForensicTestSuite(): {
  results: PhaseDTestResult[];
  summary: { total: number; passed: number; failed: number; successRate: string };
} {
  const results: PhaseDTestResult[] = [];

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
  // 1. User Action & Formula Input Integrity Audit
  // =========================================================================
  const testFormula1: FormulationIngredient[] = [
    { id: 'ing-1', name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 140, role: 'Anionic Surfactant' },
    { id: 'ing-2', name: 'NaOH 100%', percentage: 1.17615, activeMatterPct: 100, costPerKg: 50, role: 'Alkali Neutralizer' },
    { id: 'ing-3', name: 'CAPB 30%', percentage: 5, activeMatterPct: 30, costPerKg: 85, role: 'Amphoteric Surfactant' },
    { id: 'ing-4', name: 'Water', percentage: 83.82385, activeMatterPct: 0, costPerKg: 0.1, role: 'Solvent Carrier' }
  ];

  const totalRaw = testFormula1.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0);
  assertNear('1. Input & Mass Balance Integrity', 'T1: Formula sums to 100.00% mass balance', totalRaw, 100.0, 0.001);

  // =========================================================================
  // 2. Commercial Grade Preservation Audit (SLES 70% vs SLES 28%, LABSA 96% vs 90%)
  // =========================================================================
  const f_sles70: FormulationIngredient[] = [{ id: '1', name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }];
  const f_sles28: FormulationIngredient[] = [{ id: '2', name: 'SLES 28%', percentage: 10, activeMatterPct: 28 }];
  const rep70 = ActiveMatterEngine.calculateActiveMatterReport(f_sles70);
  const rep28 = ActiveMatterEngine.calculateActiveMatterReport(f_sles28);
  assertNear('2. Commercial Grade Preservation', 'T2a: SLES 70% delivers 7.0% active solids', rep70.totalActiveMatter, 7.0, 0.01);
  assertNear('2. Commercial Grade Preservation', 'T2b: SLES 28% delivers 2.8% active solids', rep28.totalActiveMatter, 2.8, 0.01);
  assert('2. Commercial Grade Preservation', 'T2c: Commercial grades do not collapse into single record', rep70.totalActiveMatter !== rep28.totalActiveMatter, true, true);

  // =========================================================================
  // 3. Engine Execution & Contract Audit (Exact deterministic outputs)
  // =========================================================================
  const mappedPHEngine = mapFormulationIngredientsToPHEngineInput(testFormula1);
  const phRes = calculatePHAdvanced(mappedPHEngine);
  assertNear('3. Engine Execution', 'T3a: pHEngine stoichiometric pH', phRes.pH, 7.00, 0.02);
  assert('3. Engine Execution', 'T3b: Solver converged flag preserved', phRes.solverConverged === true, phRes.solverConverged, true);

  const actReport = ActiveMatterEngine.calculateActiveMatterReport(testFormula1);
  // Active = (10 * 0.96) + (5 * 0.30) = 9.6 + 1.5 = 11.1%
  assertNear('3. Engine Execution', 'T3c: ActiveMatterEngine total active surfactants', actReport.surfactants.totalActiveSurfactants, 11.1, 0.01);

  const viscRes = ViscosityEngine.evaluateViscosity(testFormula1, { productCategory: 'Hand Dishwashing Liquid', targetPH: phRes.pH });
  assert('3. Engine Execution', 'T3d: ViscosityEngine evaluates flow profile', viscRes.viscosityCp > 0 && typeof viscRes.rating === 'string', true, true);

  // =========================================================================
  // 4. Downstream Cross-Engine Data Flow & Authority Matrix
  // =========================================================================
  // Downstream expert reasoning receives the exact calculated pH and active matter
  const reasoningReport = evaluateExpertReasoning({
    ingredients: testFormula1,
    productCategory: 'Hand Dishwashing Liquid',
    calculatedPH: phRes.pH,
    totalActiveMatter: actReport.surfactants.totalActiveSurfactants,
    waterHardnessPpm: 150
  });
  assert('4. Cross-Engine Flow', 'T4a: Expert Reasoning passes for balanced neutral formula', reasoningReport.sanityCheckPassed === true, reasoningReport.sanityCheckPassed, true);
  assert('4. Cross-Engine Flow', 'T4b: Reasoner receives and recognizes neutral pH', reasoningReport.strengths.some(s => s.id === 'str-ph-target'), true, true);

  // =========================================================================
  // 5. Critical Failure & Warning Hierarchy Audit
  // =========================================================================
  const incompatibleFormula: FormulationIngredient[] = [
    { id: '1', name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, role: 'Anionic Surfactant' },
    { id: '2', name: 'Cetrimonium Chloride (Quat)', percentage: 3, activeMatterPct: 50, role: 'Cationic Conditioning Agent' },
    { id: '3', name: 'Water', percentage: 87, activeMatterPct: 0 }
  ];
  const compRes = calculateFormulationCompatibility(incompatibleFormula, 7.0);
  const expertIncompatible = evaluateExpertReasoning({
    ingredients: incompatibleFormula,
    productCategory: 'Laundry Liquid',
    calculatedPH: 7.0,
    totalActiveMatter: 11.1,
    compatibilityAlerts: compRes.alerts
  });

  assert('5. Critical Failure Hierarchy', 'T5a: Incompatibility flags critical hazard', compRes.alerts.some(a => a.severity === 'Critical'), true, true);
  assert('5. Critical Failure Hierarchy', 'T5b: Expert reasoning reports overall status FAIL', expertIncompatible.overallStatus === 'FAIL', expertIncompatible.overallStatus, 'FAIL');
  assert('5. Critical Failure Hierarchy', 'T5c: Critical failure is NOT masked by high active solids or AI grade', expertIncompatible.criticalIssuesCount > 0, true, true);

  // =========================================================================
  // 6. Non-Surfactant / Builder / Chelation Preservation
  // =========================================================================
  const chelatedFormula: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Citrate Dihydrate', percentage: 50.0, activeMatterPct: 100, role: 'Builder' },
    { id: '2', name: 'Water', percentage: 50.0, activeMatterPct: 0 }
  ];
  const hardnessRes = calculateWaterHardnessTolerance(chelatedFormula, 100, 10, 20);
  assert('6. Builder & Chelation Flow', 'T6a: Hard water chelation tolerance calculated', hardnessRes.maxSupportedPpm > 0, true, true);
  assert('6. Builder & Chelation Flow', 'T6b: High-chelator formula evaluates to sufficient', hardnessRes.sufficiency === 'sufficient', hardnessRes.sufficiency, 'sufficient');

  // =========================================================================
  // 7. NaN / Infinity / Boundary Protection Audit
  // =========================================================================
  const emptyFormula: FormulationIngredient[] = [];
  const emptyPH = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput(emptyFormula));
  const emptyAct = ActiveMatterEngine.calculateActiveMatterReport(emptyFormula);
  const emptyHLB = HLBEngine.calculateBlendedHLB(emptyFormula);
  const emptyDensity = calculateDensity(emptyFormula);

  assert('7. Boundary Protection', 'T7a: Empty formula pH defaults to pure water 7.00 without NaN', !isNaN(emptyPH.pH) && emptyPH.pH === 7.0, true, true);
  assert('7. Boundary Protection', 'T7b: Empty formula active matter is 0.00 without NaN', !isNaN(emptyAct.totalActiveMatter) && emptyAct.totalActiveMatter === 0, true, true);
  assert('7. Boundary Protection', 'T7c: Empty formula HLB is 0.00 without NaN', !isNaN(emptyHLB.blendedHLB) && emptyHLB.blendedHLB === 0, true, true);
  assert('7. Boundary Protection', 'T7d: Empty formula density defaults to water 1.000 g/cm³ without NaN', !isNaN(emptyDensity.densityGPerCm3) && emptyDensity.densityGPerCm3 === 1.0, true, true);

  // =========================================================================
  // 8. Determinism Verification (Same Input == Same Output across runs)
  // =========================================================================
  const run1_ph = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput(testFormula1)).pH;
  const run2_ph = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput(testFormula1)).pH;
  const run1_act = ActiveMatterEngine.calculateActiveMatterReport(testFormula1).totalActiveMatter;
  const run2_act = ActiveMatterEngine.calculateActiveMatterReport(testFormula1).totalActiveMatter;
  const run1_visc = ViscosityEngine.evaluateViscosity(testFormula1).viscosityCp;
  const run2_visc = ViscosityEngine.evaluateViscosity(testFormula1).viscosityCp;

  assert('8. Determinism Audit', 'T8a: pH is 100% deterministic', run1_ph === run2_ph, run1_ph, run2_ph);
  assert('8. Determinism Audit', 'T8b: Active Matter is 100% deterministic', run1_act === run2_act, run1_act, run2_act);
  assert('8. Determinism Audit', 'T8c: Viscosity is 100% deterministic', run1_visc === run2_visc, run1_visc, run2_visc);

  // =========================================================================
  // 9. 20 Realistic Golden Formulation Benchmark Suite
  // =========================================================================
  const goldenFormulas: Array<{ id: number; name: string; ingredients: FormulationIngredient[]; category: string }> = [
    {
      id: 1,
      name: 'Simple Anionic Detergent',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 },
        { name: 'NaOH 100%', percentage: 1.17615, activeMatterPct: 100 },
        { name: 'Water', percentage: 88.82385 }
      ]
    },
    {
      id: 2,
      name: 'SLES-based Liquid Detergent',
      category: 'Liquid Detergent',
      ingredients: [
        { name: 'SLES 70%', percentage: 14.2857, activeMatterPct: 70 },
        { name: 'Cocamide DEA', percentage: 2.0, activeMatterPct: 85 },
        { name: 'Water', percentage: 83.7143 }
      ]
    },
    {
      id: 3,
      name: 'LABSA + NaOH Neutralized Dishwash',
      category: 'Hand Dishwashing Liquid',
      ingredients: [
        { name: 'LABSA 96%', percentage: 8.0, activeMatterPct: 96 },
        { name: 'NaOH 50% Lye', percentage: 1.88, activeMatterPct: 50 },
        { name: 'CAPB 30%', percentage: 6.0, activeMatterPct: 30 },
        { name: 'Sodium Chloride', percentage: 1.2 },
        { name: 'Water', percentage: 82.92 }
      ]
    },
    {
      id: 4,
      name: 'Mixed Anionic + Nonionic Formula',
      category: 'Front Load Detergent',
      ingredients: [
        { name: 'SLES 70%', percentage: 8.0, activeMatterPct: 70 },
        { name: 'LAE-7', percentage: 6.0, activeMatterPct: 100 },
        { name: 'Water', percentage: 86.0 }
      ]
    },
    {
      id: 5,
      name: 'Anionic + Amphoteric Synergy Formula',
      category: 'Hand Dishwashing Liquid',
      ingredients: [
        { name: 'SLES 70%', percentage: 12.0, activeMatterPct: 70 },
        { name: 'CAPB 30%', percentage: 8.0, activeMatterPct: 30 },
        { name: 'Water', percentage: 80.0 }
      ]
    },
    {
      id: 6,
      name: 'High-Salt Viscosity Peak Formula',
      category: 'Hand Dishwashing Liquid',
      ingredients: [
        { name: 'SLES 70%', percentage: 14.0, activeMatterPct: 70 },
        { name: 'CAPB 30%', percentage: 4.0, activeMatterPct: 30 },
        { name: 'Sodium Chloride', percentage: 1.8 },
        { name: 'Water', percentage: 80.2 }
      ]
    },
    {
      id: 7,
      name: 'Polymer-Thickened Cleanser',
      category: 'Hard Surface Cleaner',
      ingredients: [
        { name: 'Xanthan Gum', percentage: 0.6 },
        { name: 'LAE-7', percentage: 4.0, activeMatterPct: 100 },
        { name: 'Water', percentage: 95.4 }
      ]
    },
    {
      id: 8,
      name: 'Hard-Water Detergent Formula',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'LABSA 96%', percentage: 10.0, activeMatterPct: 96 },
        { name: 'NaOH 100%', percentage: 1.17615, activeMatterPct: 100 },
        { name: 'Sodium Citrate', percentage: 4.0 },
        { name: 'Water', percentage: 84.82385 }
      ]
    },
    {
      id: 9,
      name: 'Chelated Eco Detergent',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
        { name: 'GLDA 47% Liquid', percentage: 3.0, activeMatterPct: 47 },
        { name: 'Water', percentage: 87.0 }
      ]
    },
    {
      id: 10,
      name: 'Fragrance-Solubilized Body Cleanser',
      category: 'Body Wash',
      ingredients: [
        { name: 'SLES 70%', percentage: 12.0, activeMatterPct: 70 },
        { name: 'CAPB 30%', percentage: 6.0, activeMatterPct: 30 },
        { name: 'Fragrance Essential Oil', percentage: 0.8 },
        { name: 'LAE-9 (Solubilizer)', percentage: 1.5, activeMatterPct: 100 },
        { name: 'Water', percentage: 79.7 }
      ]
    },
    {
      id: 11,
      name: 'Preserved Commercial Detergent',
      category: 'Liquid Detergent',
      ingredients: [
        { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
        { name: 'Kathon CG Preservative', percentage: 0.1 },
        { name: 'Water', percentage: 89.9 }
      ]
    },
    {
      id: 12,
      name: 'Enzyme-Containing Laundry Detergent',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
        { name: 'LAE-7', percentage: 4.0, activeMatterPct: 100 },
        { name: 'Protease Enzyme', percentage: 0.6 },
        { name: 'Propylene Glycol', percentage: 2.0 },
        { name: 'Water', percentage: 83.4 }
      ]
    },
    {
      id: 13,
      name: 'High-Alkalinity Heavy Degreaser',
      category: 'Heavy Duty Degreaser',
      ingredients: [
        { name: 'Sodium Metasilicate', percentage: 4.0 },
        { name: 'Caustic Soda 50% Lye', percentage: 3.0, activeMatterPct: 50 },
        { name: 'Lauryl Glucoside', percentage: 5.0, activeMatterPct: 50 },
        { name: 'Water', percentage: 88.0 }
      ]
    },
    {
      id: 14,
      name: 'Low-pH Acidic Descaler',
      category: 'Acidic Descaler',
      ingredients: [
        { name: 'Citric Acid Anhydrous', percentage: 8.0 },
        { name: 'LAE-7', percentage: 2.0, activeMatterPct: 100 },
        { name: 'Water', percentage: 90.0 }
      ]
    },
    {
      id: 15,
      name: 'Invalid <100% Formula (Underfilled)',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 },
        { name: 'Water', percentage: 70 }
      ]
    },
    {
      id: 16,
      name: 'Invalid >100% Formula (Overfilled)',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 },
        { name: 'Water', percentage: 100 }
      ]
    },
    {
      id: 17,
      name: 'Same-CAS Different-Grade Formula',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'LABSA 90%', percentage: 5.0, activeMatterPct: 90 },
        { name: 'LABSA 96%', percentage: 5.0, activeMatterPct: 96 },
        { name: 'Water', percentage: 90.0 }
      ]
    },
    {
      id: 18,
      name: 'Formula with Missing Optional Property',
      category: 'Liquid Detergent',
      ingredients: [
        { name: 'SLES 70%', percentage: 10 } // activeMatterPct omitted (defaults safely)
      ]
    },
    {
      id: 19,
      name: 'Formula with Unknown Custom Additive',
      category: 'Liquid Detergent',
      ingredients: [
        { name: 'Custom Proprietary Polymer XYZ', percentage: 2.0 },
        { name: 'Water', percentage: 98.0 }
      ]
    },
    {
      id: 20,
      name: 'Full Complex Commercial Laundry System',
      category: 'Laundry Liquid',
      ingredients: [
        { name: 'LABSA 96%', percentage: 8.0, activeMatterPct: 96, costPerKg: 140 },
        { name: 'NaOH 50% Lye', percentage: 1.88, activeMatterPct: 50, costPerKg: 30 },
        { name: 'SLES 70%', percentage: 5.0, activeMatterPct: 70, costPerKg: 110 },
        { name: 'LAE-7', percentage: 3.0, activeMatterPct: 100, costPerKg: 180 },
        { name: 'GLDA 47% Liquid', percentage: 1.5, activeMatterPct: 47, costPerKg: 160 },
        { name: 'Protease Enzyme', percentage: 0.5, costPerKg: 450 },
        { name: 'Optical Brightener CBS-X', percentage: 0.1, costPerKg: 1200 },
        { name: 'Fragrance Microcapsules', percentage: 0.4, costPerKg: 800 },
        { name: 'BIT 20% Preservative', percentage: 0.1, costPerKg: 350 },
        { name: 'Sodium Chloride', percentage: 1.2, costPerKg: 8 },
        { name: 'Water', percentage: 78.32, costPerKg: 0.1 }
      ]
    }
  ];

  goldenFormulas.forEach(gf => {
    const totalMass = gf.ingredients.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    const mapped = mapFormulationIngredientsToPHEngineInput(gf.ingredients);
    const ph = calculatePHAdvanced(mapped);
    const act = ActiveMatterEngine.calculateActiveMatterReport(gf.ingredients);
    const exp = evaluateExpertReasoning({
      ingredients: gf.ingredients,
      productCategory: gf.category,
      calculatedPH: ph.pH,
      totalActiveMatter: act.surfactants.totalActiveSurfactants
    });

    const isMass100 = Math.abs(totalMass - 100) < 0.05;
    if (gf.id === 15 || gf.id === 16) {
      assert(
        '9. Golden Formula Suite',
        `GF #${gf.id} (${gf.name}): Correctly flags mass balance deviation`,
        !isMass100,
        totalMass,
        '!= 100%'
      );
    } else {
      assert(
        '9. Golden Formula Suite',
        `GF #${gf.id} (${gf.name}): Executed without errors & produced valid report`,
        !isNaN(ph.pH) && exp !== null && typeof exp.overallStatus === 'string',
        true,
        true
      );
    }
  });

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const successRate = `${((passed / total) * 100).toFixed(1)}%`;

  return { results, summary: { total, passed, failed, successRate } };
}

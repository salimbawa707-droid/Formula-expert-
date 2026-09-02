import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { calculatePHAdvanced } from '../pHEngine';
import { ActiveMatterEngine } from '../activeMatterEngine';
import { HLBEngine } from '../hlbEngine';
import { ViscosityEngine } from '../viscosityEngine';
import {
  calculateMixedCMC,
  calculateWaterHardnessTolerance,
  calculateFormulationChelationCapacity,
  calculateFormulationCompatibility,
  calculateCleaningPerformance,
  calculateDensity
} from '../calculators';
import { evaluateExpertReasoning } from '../expertReasoningEngine';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runScientificPhaseCTests(): { results: TestResult[]; summary: { total: number; passed: number; failed: number; successRate: string } } {
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
  // 1. Strong Acid + Strong Base (HCl + NaOH, LABSA + NaOH)
  // =========================================================================
  const t1Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'LABSA (96%)', percentage: 10, activeMatterPct: 96 },
    { name: 'NaOH (100%)', percentage: 1.17615, activeMatterPct: 100 }
  ]);
  const t1Res = calculatePHAdvanced(t1Input);
  assertNear('1. Strong Acid/Base Stoichiometry', 'T1: LABSA 10% @ 96% + Exact Stoichiometric NaOH (1.17615%)', t1Res.pH, 7.00, 0.02);
  assert('1. Strong Acid/Base Stoichiometry', 'T1: Newton-Raphson Solver Converged', t1Res.solverConverged === true, t1Res.solverConverged, true);

  // =========================================================================
  // 2. Weak Acid pH (Citric Acid alone)
  // =========================================================================
  const t2Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'Citric Acid Anhydrous', percentage: 1.0, activeMatterPct: 100 }
  ]);
  const t2Res = calculatePHAdvanced(t2Input);
  assertNear('2. Weak Acid pH', 'T2: Citric Acid 1.0% in water', t2Res.pH, 2.22, 0.05);

  // =========================================================================
  // 3. Polyprotic Speciation (Citric Acid 3 pKa stages)
  // =========================================================================
  const t3Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'Citric Acid', percentage: 2.0, activeMatterPct: 100 },
    { name: 'NaOH 50% Lye', percentage: 0.5, activeMatterPct: 50 }
  ]);
  const t3Res = calculatePHAdvanced(t3Input);
  assertNear('3. Polyprotic Speciation', 'T3: Partial Neutralization Citric Acid (H2Cit- dominant)', t3Res.pH, 3.31, 0.05);

  // =========================================================================
  // 4. Buffer Capacity (Citric Acid + Sodium Citrate buffer)
  // =========================================================================
  const t4Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'Citric Acid', percentage: 2.0, activeMatterPct: 100 },
    { name: 'Sodium Citrate', percentage: 2.0, activeMatterPct: 100 }
  ]);
  const t4Res = calculatePHAdvanced(t4Input);
  assertNear('4. Buffer Capacity', 'T4: Citrate Buffer pH', t4Res.pH, 4.35, 0.05);
  assert('4. Buffer Capacity', 'T4: Significant Buffer Capacity', t4Res.bufferCapacity > 0, t4Res.bufferCapacity > 0, true);

  // =========================================================================
  // 5. LABSA Neutralization Stoichiometry (LABSA 96% vs 90%)
  // =========================================================================
  const t5_96 = ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 });
  const t5_90 = ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA 90%', percentage: 10, activeMatterPct: 90 });
  assertNear('5. LABSA Active Resolution', 'T5: LABSA 96% active mass', (10 * t5_96.activeMatterPct) / 100, 9.60, 0.01);
  assertNear('5. LABSA Active Resolution', 'T5: LABSA 90% active mass', (10 * t5_90.activeMatterPct) / 100, 9.00, 0.01);

  // =========================================================================
  // 6. Citric Acid Neutralization Stoichiometry (Triprotic: 3 moles base per mole acid)
  // =========================================================================
  // Citric acid MW = 192.124 g/mol. Triprotic -> 3 * 40.00 = 120.00 g NaOH per 192.124 g Citric Acid (Ratio = 0.62458)
  const t6Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'Citric Acid Anhydrous', percentage: 1.92124, activeMatterPct: 100 },
    { name: 'NaOH (100%)', percentage: 1.2000, activeMatterPct: 100 }
  ]);
  const t6Res = calculatePHAdvanced(t6Input);
  assertNear('6. Triprotic Neutralization', 'T6: Citric Acid Full Neutralization to Trisodium Citrate pH', t6Res.pH, 8.45, 0.35);

  // =========================================================================
  // 7. NaOH Neutralization (1:1 Monoprotic with LABSA)
  // =========================================================================
  const t7Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'LABSA', percentage: 3.2649, activeMatterPct: 100 }, // 0.01 mol
    { name: 'NaOH 100%', percentage: 0.4000, activeMatterPct: 100 } // 0.01 mol
  ]);
  const t7Res = calculatePHAdvanced(t7Input);
  assertNear('7. NaOH Neutralization', 'T7: 1:1 Monoprotic Equivalence pH', t7Res.pH, 7.00, 0.02);

  // =========================================================================
  // 8. KOH Neutralization (56.11 g/mol)
  // =========================================================================
  const t8Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'LABSA', percentage: 3.2649, activeMatterPct: 100 }, // 0.01 mol
    { name: 'KOH 100%', percentage: 0.5611, activeMatterPct: 100 } // 0.01 mol
  ]);
  const t8Res = calculatePHAdvanced(t8Input);
  assertNear('8. KOH Neutralization', 'T8: LABSA + KOH Equivalence pH', t8Res.pH, 7.00, 0.02);

  // =========================================================================
  // 9. TEA Neutralization (Triethanolamine MW = 149.19 g/mol)
  // =========================================================================
  const t9Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'Triethanolamine (TEA 99%)', percentage: 1.0, activeMatterPct: 100 }
  ]);
  const t9Res = calculatePHAdvanced(t9Input);
  assertNear('9. TEA Weak Base Hydrolysis', 'T9: TEA 1% pH', t9Res.pH, 10.50, 0.05);

  // =========================================================================
  // 10. Mixed Surfactants Active Matter Balance
  // =========================================================================
  const t10Report = ActiveMatterEngine.calculateActiveMatterReport([
    { name: 'SLES 70%', percentage: 14.2857, activeMatterPct: 70 }, // 10.0% active
    { name: 'CAPB 30%', percentage: 6.6667, activeMatterPct: 30 },   // 2.0% active
    { name: 'Cocamide DEA (CDEA 85%)', percentage: 2.3529, activeMatterPct: 85 } // 2.0% active
  ]);
  assertNear('10. Active Matter Balance', 'T10: Total Active Surfactant Mass %', t10Report.surfactants.totalActiveSurfactants, 14.0, 0.05);

  // =========================================================================
  // 11. SLES 70% vs SLES 28% Commercial Form Resolution
  // =========================================================================
  const t11_70 = ActiveMatterEngine.resolveIngredientActive({ name: 'SLES 70% Paste', percentage: 10, activeMatterPct: 70 });
  const t11_28 = ActiveMatterEngine.resolveIngredientActive({ name: 'SLES 28% Liquid', percentage: 10, activeMatterPct: 28 });
  assertNear('11. SLES Form Resolution', 'T11: SLES 70% active contribution', (10 * t11_70.activeMatterPct) / 100, 7.0, 0.01);
  assertNear('11. SLES Form Resolution', 'T11: SLES 28% active contribution', (10 * t11_28.activeMatterPct) / 100, 2.8, 0.01);

  // =========================================================================
  // 12. HLB Blend Calculation (Active-Surfactant Weighted Griffin/Davies)
  // =========================================================================
  const t12Res = HLBEngine.calculateBlendedHLB([
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, hlb: 40.0 }, // 7.0g active @ HLB 40
    { name: 'Lauryl Alcohol Ethoxylate (LAE-7)', percentage: 3, activeMatterPct: 100, hlb: 12.1 } // 3.0g active @ HLB 12.1
  ]);
  // Weighted HLB = (7.0 * 40.0 + 3.0 * 12.1) / 10.0 = (280 + 36.3) / 10 = 31.63
  assertNear('12. HLB Blending', 'T12: SLES/LAE-7 Active Mass Weighted HLB', t12Res.blendedHLB, 31.63, 0.1);
  assert('12. HLB Blending', 'T12: Correct Emulsification Region (Extended Ionic Surfactant / Hydrotropic)', t12Res.emulsionRegion.length > 0, true, true);

  // =========================================================================
  // 13. Mixed CMC Calculation (Clint Ideal Pseudophase 1/CMC_mix = Σ α_i/CMC_i)
  // =========================================================================
  const t13Res = calculateMixedCMC([
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }, // CMC ≈ 0.30 g/L (70% weight fraction of surfactant)
    { name: 'LAE-7', percentage: 3, activeMatterPct: 100 }      // CMC ≈ 0.05 g/L (30% weight fraction of surfactant)
  ]);
  assert('13. Clint Mixed CMC', 'T13: Clint mixed CMC resolved successfully', t13Res !== null && t13Res.ppm > 0, true, true);
  assertNear('13. Clint Mixed CMC', 'T13: Ideal mixed CMC ppm', t13Res ? t13Res.ppm : 0, 120, 80);

  // =========================================================================
  // 14. Viscosity Salt Curve (Micellar growth, plateau, salting-out collapse)
  // =========================================================================
  // A. Sub-critical
  const vSub = ViscosityEngine.evaluateViscosity([
    { name: 'SLES 70%', percentage: 14.0, activeMatterPct: 70 },
    { name: 'CAPB 30%', percentage: 5.0, activeMatterPct: 30 },
    { name: 'Sodium Chloride (NaCl)', percentage: 0.3 }
  ], { productCategory: 'Hand Dishwashing Liquid' });
  assert('14. Viscosity Salt Curve', 'T14a: Sub-critical salt region', vSub.saltCurve.curveRegion === 'sub_critical', vSub.saltCurve.curveRegion, 'sub_critical');

  // B. Optimal Peak Plateau
  const vPeak = ViscosityEngine.evaluateViscosity([
    { name: 'SLES 70%', percentage: 14.0, activeMatterPct: 70 },
    { name: 'CAPB 30%', percentage: 5.0, activeMatterPct: 30 },
    { name: 'Sodium Chloride (NaCl)', percentage: 1.5 }
  ], { productCategory: 'Hand Dishwashing Liquid' });
  assert('14. Viscosity Salt Curve', 'T14b: Optimal Peak Plateau viscosity', vPeak.viscosityCp >= 1500 && vPeak.viscosityCp <= 4500, vPeak.viscosityCp, '1500 - 4500 cPs');

  // C. Over-salted / Salting-Out Collapse
  const vOver = ViscosityEngine.evaluateViscosity([
    { name: 'SLES 70%', percentage: 14.0, activeMatterPct: 70 },
    { name: 'CAPB 30%', percentage: 5.0, activeMatterPct: 30 },
    { name: 'Sodium Chloride (NaCl)', percentage: 4.5 }
  ], { productCategory: 'Hand Dishwashing Liquid' });
  assert('14. Viscosity Salt Curve', 'T14c: Over-salted detection & Salting-Out Risk', vOver.saltCurve.saltingOutRisk === true, vOver.saltCurve.saltingOutRisk, true);

  // =========================================================================
  // 15. Polymer Thickening (Xanthan Yield Stress, Carbomer pH Dependence)
  // =========================================================================
  const vXanthan = ViscosityEngine.evaluateViscosity([
    { name: 'Water', percentage: 99.5 },
    { name: 'Xanthan Gum', percentage: 0.5 }
  ], { productCategory: 'Liquid Detergent' });
  assert('15. Polymer Rheology', 'T15a: Xanthan Gum imparts yield stress (>0.5 Pa)', vXanthan.shearProfile.yieldStressPa > 0.5, vXanthan.shearProfile.yieldStressPa, '>0.5 Pa');

  const vCarbomerAcid = ViscosityEngine.evaluateViscosity([
    { name: 'Water', percentage: 99.5 },
    { name: 'Carbomer 940', percentage: 0.5 }
  ], { targetPH: 3.5 });
  const vCarbomerNeutral = ViscosityEngine.evaluateViscosity([
    { name: 'Water', percentage: 99.5 },
    { name: 'Carbomer 940', percentage: 0.5 }
  ], { targetPH: 7.0 });
  assert('15. Polymer Rheology', 'T15b: Carbomer uncoils and builds massive viscosity at pH 7 vs pH 3.5', vCarbomerNeutral.viscosityCp > vCarbomerAcid.viscosityCp * 5, true, true);

  // =========================================================================
  // 16. Hard Water & Chelant Binding Capacity (GLDA, EDTA, Citrate)
  // =========================================================================
  const chelantRes = calculateFormulationChelationCapacity([
    { name: 'GLDA (Tetrasodium GLDA 47%)', percentage: 2.0 } // 20g dose -> 0.40g raw = 0.188g pure GLDA -> binds ~50.8 mg CaCO3
  ], 20, 100);
  assertNear('16. Chelation Stoichiometry', 'T16: GLDA 47% Chelation Capacity in 20g dose (mg CaCO3)', chelantRes.totalSequestrationMg, 50.8, 5.0);

  const toleranceRes = calculateWaterHardnessTolerance([
    { name: 'GLDA (47%)', percentage: 2.0 }
  ], 150, 10, 20);
  assert('16. Chelation Stoichiometry', 'T16: Hardness Tolerance Sufficiency evaluated', ['sufficient', 'borderline', 'insufficient'].includes(toleranceRes.sufficiency), true, true);

  // =========================================================================
  // 17. Builder & Alkalinity (Soda Ash Hydrolysis)
  // =========================================================================
  const t17Input = mapFormulationIngredientsToPHEngineInput([
    { name: 'Sodium Carbonate (Soda Ash)', percentage: 1.0, activeMatterPct: 100 }
  ]);
  const t17Res = calculatePHAdvanced(t17Input);
  assertNear('17. Builder Hydrolysis', 'T17: 1% Soda Ash Alkaline Hydrolysis pH', t17Res.pH, 11.25, 0.40);

  // =========================================================================
  // 18. Preservative System & Microbial Risk
  // =========================================================================
  const t18CompatNoPreservative = calculateFormulationCompatibility([
    { name: 'Water', percentage: 85.0 },
    { name: 'SLES 70%', percentage: 15.0 }
  ], 7.0);
  assert('18. Preservative System', 'T18: Unpreserved high-water formula triggers microbial alert', t18CompatNoPreservative.alerts.some(a => a.id === 'missing-preservative'), true, true);

  // =========================================================================
  // 19. Anionic + Cationic Incompatibility Detection
  // =========================================================================
  const t19Compat = calculateFormulationCompatibility([
    { name: 'LABSA 96%', percentage: 10.0 },
    { name: 'Cetrimonium Chloride (Quat)', percentage: 3.0 }
  ], 7.0);
  assert('19. Incompatibility Matrix', 'T19: Opposite charge coacervation / precipitation hazard detected', t19Compat.alerts.some(a => a.id === 'anionic-cationic-incompatibility'), true, true);

  // =========================================================================
  // 20. Temperature Stability (Viscosity 4°C vs 40°C Arrhenius scaling)
  // =========================================================================
  const vTemp = ViscosityEngine.evaluateViscosity([
    { name: 'SLES 70%', percentage: 14.0, activeMatterPct: 70 },
    { name: 'CAPB 30%', percentage: 5.0, activeMatterPct: 30 },
    { name: 'Sodium Chloride (NaCl)', percentage: 1.5 }
  ]);
  assert('20. Arrhenius Temperature Scaling', 'T20: Viscosity at 4°C higher than 25°C, and 40°C lower than 25°C', vTemp.temperatureProfile.temp4C_Cp > vTemp.viscosityCp && vTemp.temperatureProfile.temp40C_Cp < vTemp.viscosityCp, true, true);

  // =========================================================================
  // 21. Enzyme Stability & pH Window
  // =========================================================================
  const t21Compat = calculateFormulationCompatibility([
    { name: 'Water', percentage: 80.0 },
    { name: 'Protease Enzyme', percentage: 1.0 }
  ], 12.5); // Highly alkaline pH denatures enzymes
  assert('21. Enzyme Stability', 'T21: Extreme alkaline pH denatures enzyme warning', t21Compat.alerts.some(a => a.id === 'enzyme-ph-denaturation'), true, true);

  // =========================================================================
  // 22. Cleaning Performance Index (Multi-Factor Detergency)
  // =========================================================================
  const t22CPI = calculateCleaningPerformance([
    { name: 'LABSA 96%', percentage: 10.0, activeMatterPct: 96 },
    { name: 'LAE-7', percentage: 4.0, activeMatterPct: 100 },
    { name: 'Sodium Citrate', percentage: 3.0 },
    { name: 'Protease Enzyme', percentage: 0.5 }
  ]);
  assert('22. Cleaning Performance Index', 'T22: High-performance detergent score >= 80', t22CPI.overallScore >= 80, t22CPI.overallScore, '>= 80');

  // =========================================================================
  // 23. Formulation Mixture Density Calculation (Harmonic Volume Additivity)
  // =========================================================================
  const t23Density = calculateDensity([
    { name: 'Water', percentage: 80.0 },
    { name: 'LABSA 96%', percentage: 10.0 }, // density = 1.06
    { name: 'Caustic Soda Lye (48%)', percentage: 3.0 }, // density = 1.51
    { name: 'Glycerin', percentage: 7.0 } // density = 1.26
  ]);
  // 100 / (80/1.0 + 10/1.06 + 3/1.51 + 7/1.26) = 100 / (80 + 9.434 + 1.987 + 5.556) = 100 / 96.977 = 1.031 g/cm³
  assertNear('23. Mixture Density', 'T23: Ideal volume additivity mixture density (g/cm³)', t23Density.densityGPerCm3, 1.031, 0.015);
  assertNear('23. Mixture Density', 'T23: Specific gravity relative to water at 20°C', t23Density.specificGravity, 1.033, 0.015);

  // =========================================================================
  // 24. Expert Reasoning Engine Integration
  // =========================================================================
  const t24Reasoning = evaluateExpertReasoning({
    ingredients: [
      { name: 'LABSA 96%', percentage: 10.0, activeMatterPct: 96 },
      { name: 'NaOH 100%', percentage: 1.17615, activeMatterPct: 100 },
      { name: 'Water', percentage: 88.82385 }
    ],
    productCategory: 'Laundry Liquid',
    calculatedPH: 7.0,
    totalActiveMatter: 9.6
  });
  assert('24. Expert Reasoning Report', 'T24: Expert reasoning produces structured report with strengths and sanity check', t24Reasoning.sanityCheckPassed === true && t24Reasoning.strengths.length > 0, true, true);

  // =========================================================================
  // 25. Mass Balance Integrity Check (100% Mass Conserved)
  // =========================================================================
  const t25Report = ActiveMatterEngine.calculateActiveMatterReport([
    { name: 'LABSA 96%', percentage: 10.0, activeMatterPct: 96 },
    { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
    { name: 'Water', percentage: 80.0 }
  ]);
  assertNear('25. 100% Mass Balance', 'T25: Total Raw Percentage equals 100.0%', t25Report.totalRawPercentage, 100.0, 0.001);
  assertNear('25. 100% Mass Balance', 'T25: Active Mass + Carrier Water Balance = 100%', t25Report.totalActiveMatter + t25Report.totalCarrierPercentage, 100.0, 0.001);

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const successRate = `${((passed / total) * 100).toFixed(1)}%`;

  return { results, summary: { total, passed, failed, successRate } };
}

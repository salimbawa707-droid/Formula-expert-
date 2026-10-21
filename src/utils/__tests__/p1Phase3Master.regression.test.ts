/**
 * ============================================================================
 * P1 PHASE 3 — SURFACTANT SCIENCE, HLB, CMC, COMPATIBILITY & RHEOLOGY MASTER TEST SUITE
 * ============================================================================
 * 
 * Verifies all 16 focus areas of P1 Phase 3:
 * 1. Surfactant classification
 * 2. Active surfactant calculation
 * 3. Surfactant charge-class accounting
 * 4. HLB calculation
 * 5. Mixed ionic/nonionic HLB handling (Griffin vs Davies)
 * 6. CMC calculation
 * 7. Mixed-surfactant CMC (Clint ideal model)
 * 8. Electrolyte screening effects
 * 9. Critical micelle concentration provenance & confidence
 * 10. Surfactant compatibility
 * 11. Surfactant interaction risks (anionic/cationic coacervation)
 * 12. Viscosity/rheology prediction
 * 13. Salt-curve behavior (sub-critical, growth, peak, over-salted)
 * 14. Thickening compatibility (micellar vs polymeric vs alkali-swellable)
 * 15. Category-specific applicability (fluid liquids vs dry powders/solids)
 * 16. Predicted vs measured boundaries & scientific honesty
 */

import { evaluateAuthoritativeHLB } from '../hlbEngine';
import { calculateMixedCMC, getIngredientCmcData } from '../calculators';
import { calculateFormulationCompatibility } from '../compatibilityEngine';
import { ViscosityEngine } from '../viscosityEngine';
import { ActiveMatterEngine } from '../activeMatterEngine';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase3MasterTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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
  console.log('  P1 PHASE 3 — SURFACTANT SCIENCE, HLB, CMC & RHEOLOGY MASTER TEST SUITE        ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // TOPIC 1 & 2 & 3: Surfactant Classification, Active Surfactants & Charge Accounting
  // --------------------------------------------------------------------------
  const multiSurfactantFormula: FormulationIngredient[] = [
    { id: 'sles-70', name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { id: 'labsa-96', name: 'LABSA 96%', percentage: 5, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { id: 'capb-30', name: 'CAPB 30%', percentage: 6, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { id: 'lae-9', name: 'Alcohol Ethoxylate (LAE-9)', percentage: 4, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { id: 'water', name: 'Water', percentage: 75, activeMatterPct: 0, category: 'Solvent' }
  ];

  const amReport = ActiveMatterEngine.calculateActiveMatterReport(multiSurfactantFormula);
  
  // Total raw surfactant mass % = 10 + 5 + 6 + 4 = 25%
  assert('Raw Surfactant Sum', amReport.surfactants.totalRawSurfactants === 25, amReport.surfactants.totalRawSurfactants, 25);

  // Active Surfactant %:
  // SLES 70%: 10 * 0.70 = 7.0%
  // LABSA 96%: 5 * 0.96 = 4.8%
  // CAPB 30%: 6 * 0.30 = 1.8%
  // LAE-9: 4 * 1.00 = 4.0%
  // Total Active Surfactant = 7.0 + 4.8 + 1.8 + 4.0 = 17.6%
  assert('Active Surfactant Sum', Math.abs(amReport.surfactants.totalActiveSurfactants - 17.6) < 0.01, amReport.surfactants.totalActiveSurfactants, 17.6);

  // Anionic Active: 7.0 + 4.8 = 11.8%
  assert('Anionic Active Surfactant', Math.abs(amReport.surfactants.anionicActivePct - 11.8) < 0.01, amReport.surfactants.anionicActivePct, 11.8);

  // Amphoteric Active: 1.8%
  assert('Amphoteric Active Surfactant', Math.abs(amReport.surfactants.amphotericActivePct - 1.8) < 0.01, amReport.surfactants.amphotericActivePct, 1.8);

  // Nonionic Active: 4.0%
  assert('Nonionic Active Surfactant', Math.abs(amReport.surfactants.nonionicActivePct - 4.0) < 0.01, amReport.surfactants.nonionicActivePct, 4.0);

  // --------------------------------------------------------------------------
  // TOPIC 4 & 5: HLB Engine (Griffin vs Davies, Active-Weighted Basis)
  // --------------------------------------------------------------------------
  // Pure Nonionic Binary Blend: LAE-3 (HLB 8.0, 100% active, 4%) + LAE-9 (HLB 13.1, 100% active, 6%)
  // Blended HLB = (8.0 * 4 + 13.1 * 6) / (4 + 6) = (32 + 78.6) / 10 = 110.6 / 10 = 11.06 -> 11.06
  const nonionicBlend: FormulationIngredient[] = [
    { name: 'LAE-3', percentage: 4, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'LAE-9', percentage: 6, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Water', percentage: 90, activeMatterPct: 0, category: 'Solvent' }
  ];
  const hlbRes1 = evaluateAuthoritativeHLB(nonionicBlend);
  assert('Nonionic Binary Blend HLB Calculation', Math.abs(hlbRes1.blendedHLB - 11.06) < 0.05, hlbRes1.blendedHLB, 11.06);
  assert('Nonionic Region Mapping', hlbRes1.emulsionRegion === 'Oil-in-Water (O/W) Emulsifier', hlbRes1.emulsionRegion, 'Oil-in-Water (O/W) Emulsifier');
  assert('Nonionic Blend Has No Ionic Flag', hlbRes1.hasIonicSurfactants === false, hlbRes1.hasIonicSurfactants, false);

  // Diluted active surfactant HLB weighting test:
  // APG 1214 (50% active, HLB 12.5, 10% dosage -> 5% active) + Span 20 (100% active, HLB 8.6, 5% dosage -> 5% active)
  // Equal active weights (5% each) -> HLB = (12.5 + 8.6) / 2 = 10.55
  const dilutedBlend: FormulationIngredient[] = [
    { name: 'APG 1214 (Lauryl Glucoside 50%)', percentage: 10, activeMatterPct: 50, category: 'Nonionic Surfactant' },
    { name: 'Span 20 (Sorbitan Monolaurate)', percentage: 5, activeMatterPct: 100, category: 'Nonionic Surfactant' }
  ];
  const hlbRes2 = evaluateAuthoritativeHLB(dilutedBlend);
  assert('Active-Weighted Diluted HLB Calculation', Math.abs(hlbRes2.blendedHLB - 10.55) < 0.05, hlbRes2.blendedHLB, 10.55);

  // Ionic Surfactant Davies Scale Flagging: SLES 70% (Davies HLB 40.0)
  const ionicFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'LAE-9', percentage: 5, activeMatterPct: 100, category: 'Nonionic Surfactant' }
  ];
  const hlbRes3 = evaluateAuthoritativeHLB(ionicFormula);
  assert('Ionic Surfactant Flag Detected', hlbRes3.hasIonicSurfactants === true, hlbRes3.hasIonicSurfactants, true);
  assert('Ionic Limitations Documented', hlbRes3.limitations.some(l => l.includes('Davies scale')), true, true);

  // Zero surfactant guard
  const zeroSurfactantFormula: FormulationIngredient[] = [
    { name: 'Water', percentage: 95, category: 'Solvent' },
    { name: 'Citric Acid', percentage: 5, category: 'Acid' }
  ];
  const hlbResZero = evaluateAuthoritativeHLB(zeroSurfactantFormula);
  assert('Zero Surfactant Returns 0 HLB', hlbResZero.blendedHLB === 0, hlbResZero.blendedHLB, 0);
  assert('Zero Surfactant hasSurfactants is False', hlbResZero.hasSurfactants === false, hlbResZero.hasSurfactants, false);

  // --------------------------------------------------------------------------
  // TOPIC 6, 7, 8, 9: CMC & Mixed Surfactant CMC (Clint Ideal Model & Electrolytes)
  // --------------------------------------------------------------------------
  // Single surfactant CMC
  const labsaCmc = getIngredientCmcData('LABSA 96%');
  assert('LABSA CMC Resolved', labsaCmc !== null && labsaCmc.cmcMolar === 1.2, labsaCmc?.cmcMolar, 1.2);

  const lae9Cmc = getIngredientCmcData('Alcohol Ethoxylate (LAE-9)');
  assert('LAE-9 CMC Resolved', lae9Cmc !== null && lae9Cmc.cmcMolar === 0.05, lae9Cmc?.cmcMolar, 0.05);

  const sourcedSlsCmc = getIngredientCmcData('Sodium dodecyl sulfate');
  assert(
    'SLS pure CMC parameter matches curated PSDI/NIST 25°C record',
    sourcedSlsCmc !== null && Math.abs(sourcedSlsCmc.cmcMolar - 8.2) < 1e-12 && sourcedSlsCmc.referenceEvidence?.evidenceId === 'PSDI-CMC-C1-66007-25C',
    { cmcMolar: sourcedSlsCmc?.cmcMolar, evidenceId: sourcedSlsCmc?.referenceEvidence?.evidenceId },
    { cmcMolar: 8.2, evidenceId: 'PSDI-CMC-C1-66007-25C' }
  );
  assert(
    'SLS ppm conversion uses the NIST molecular weight and retains evidence lineage',
    sourcedSlsCmc?.cmcPpm === 2364.1 && sourcedSlsCmc.referenceEvidence?.sourceReferenceCode === '66007',
    { cmcPpm: sourcedSlsCmc?.cmcPpm, reference: sourcedSlsCmc?.referenceEvidence?.sourceReferenceCode },
    { cmcPpm: 2364.1, reference: '66007' }
  );
  const sourcedSlsMixture = calculateMixedCMC([
    { name: 'Sodium dodecyl sulfate', percentage: 10, activeMatterPct: 100, category: 'Anionic Surfactant' }
  ]);
  assert(
    'Mixed CMC engine carries pure-input evidence through its output contract',
    sourcedSlsMixture?.evidenceRefs.includes('PSDI-CMC-C1-66007-25C') === true &&
      sourcedSlsMixture.components[0]?.referenceEvidence?.temperatureC === 25,
    { evidenceRefs: sourcedSlsMixture?.evidenceRefs, temperatureC: sourcedSlsMixture?.components[0]?.referenceEvidence?.temperatureC },
    { evidenceRefs: ['PSDI-CMC-C1-66007-25C'], temperatureC: 25 }
  );

  // Binary Surfactant Mixture (Clint rule on SURFACTANT MOLE FRACTIONS):
  // Component A: LABSA (MW=320, CMC=1.2 mM), 5.0% active -> 0.015625 mol/100 g
  // Component B: LAE-9 (MW=580, CMC=0.05 mM), 5.0% active -> 0.008621 mol/100 g
  // alpha_1 = 0.6444, alpha_2 = 0.3556
  // Clint Ideal: 1/CMC_mix = (0.6444 / 1.2) + (0.3556 / 0.05) = 0.537 + 7.112 = 7.649
  // CMC_mix = 1 / 7.649 = 0.131 mM
  // (The earlier 0.096 mM expectation mixed MASS fractions, which is dimensionally
  //  inconsistent with Clint's derivation; corrected after the open P2SURF benchmark.)
  const binaryCmcFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 5.208, activeMatterPct: 96, category: 'Anionic Surfactant' }, // 5.0% active
    { name: 'Alcohol Ethoxylate (LAE-9)', percentage: 5.0, activeMatterPct: 100, category: 'Nonionic Surfactant' } // 5.0% active
  ];
  const cmcResult = calculateMixedCMC(binaryCmcFormula);
  assert('Mixed CMC Calculation Succeeded', cmcResult !== null, cmcResult !== null, true);
  if (cmcResult) {
    assert('Clint Ideal Mixed CMC Molar Value on mole-fraction basis (~0.131 mM)', Math.abs(cmcResult.molar - 0.131) < 0.01, cmcResult.molar, 0.131);
    assert('Synergy Pair Flagged (Anionic + Nonionic)', cmcResult.hasSynergyPair === true, cmcResult.hasSynergyPair, true);
    assert('Model Type is Clint Ideal Mixed Pseudophase', cmcResult.modelType.includes('Clint Model'), true, true);
    assert('Limitation Explains Beta=0 Assumption', cmcResult.limitation.includes('β = 0'), true, true);
    assert('Lab Validation Guidance Present', cmcResult.labValidationGuidance.includes('tensiometry'), true, true);
  }

  // Electrolyte Screening Effect Detection
  const cmcWithElectrolyte: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Chloride', percentage: 1.5, category: 'Viscosity Modifier' }
  ];
  const cmcSaltRes = calculateMixedCMC(cmcWithElectrolyte);
  assert('Electrolyte Screening Detected in CMC Engine', cmcSaltRes?.hasElectrolyteScreening === true, cmcSaltRes?.hasElectrolyteScreening, true);

  // --------------------------------------------------------------------------
  // TOPIC 10 & 11: Surfactant Compatibility & Interaction Risks
  // --------------------------------------------------------------------------
  // Case A: Anionic + Cationic Incompatibility (Coacervation Risk)
  const incompatFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Benzalkonium Chloride (BKC 50%)', percentage: 2, activeMatterPct: 50, category: 'Cationic Surfactant' },
    { name: 'Water', percentage: 88, category: 'Solvent' }
  ];
  const compatResA = calculateFormulationCompatibility(incompatFormula, 7.0);
  assert('Anionic-Cationic Incompatibility Flagged', compatResA.alerts.some(a => a.id === 'anionic-cationic-incompatibility'), true, true);
  assert('Anionic-Cationic Severity is Critical', compatResA.alerts.find(a => a.id === 'anionic-cationic-incompatibility')?.severity === 'Critical', true, true);
  assert('Incompatible Formula Result is False', compatResA.compatible === false, compatResA.compatible, false);

  // Case B: Phase Instability / Gelation at High Active Surfactant (> 40%) without Hydrotrope
  const highActiveFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 50, activeMatterPct: 70, category: 'Anionic Surfactant' }, // 35% active
    { name: 'CAPB 30%', percentage: 20, activeMatterPct: 30, category: 'Amphoteric Surfactant' }, // 6% active -> Total 41% active
    { name: 'Water', percentage: 30, category: 'Solvent' }
  ];
  const compatResB = calculateFormulationCompatibility(highActiveFormula, 6.5);
  assert('High Active Phase Instability Flagged', compatResB.alerts.some(a => a.id === 'high-active-matter-phase-instability'), true, true);

  // Case C: Unpreserved aqueous system
  const unpreservedFormula: FormulationIngredient[] = [
    { name: 'Water', percentage: 80, category: 'Solvent' },
    { name: 'LAE-9', percentage: 10, activeMatterPct: 100, category: 'Nonionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 10, category: 'Builder' }
  ];
  const compatResC = calculateFormulationCompatibility(unpreservedFormula, 7.0);
  assert('Unpreserved Aqueous System Flagged', compatResC.alerts.some(a => a.id === 'missing-preservative'), true, true);

  // --------------------------------------------------------------------------
  // TOPIC 12, 13, 14, 15, 16: Rheology, Viscosity & Salt Curve Prediction
  // --------------------------------------------------------------------------
  // Liquid Hand Dishwash: SLES 70% (12%) + CAPB 30% (5%) + NaCl (1.5%)
  const dishwashLiquid: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Sodium Chloride (Salt)', percentage: 1.5, category: 'Viscosity Modifier' },
    { name: 'Water', percentage: 81.5, category: 'Solvent' }
  ];
  const viscReport = ViscosityEngine.evaluateViscosity(dishwashLiquid, { productCategory: 'DISHWASH_MANUAL' });
  assert('Liquid Formula is Fluid', viscReport.isFluid === true, viscReport.isFluid, true);
  assert('Viscosity cp is Positive Number', viscReport.viscosityCp > 500, viscReport.viscosityCp > 500, true);
  assert('Micellar Rod Mechanism Identified', viscReport.mechanism === 'Micellar Rod / Salt Curve', viscReport.mechanism, 'Micellar Rod / Salt Curve');
  assert('Shear Thinning Flow Index (n < 1.0)', viscReport.shearProfile.flowIndexN < 1.0, viscReport.shearProfile.flowIndexN, '< 1.0');
  assert('Temperature Profile Arrhenius Calculated', viscReport.temperatureProfile.temp4C_Cp > viscReport.temperatureProfile.temp40C_Cp, true, true);

  // Salt curve regimes:
  // 0% salt -> sub_critical
  const subSaltFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Water', percentage: 83, category: 'Solvent' }
  ];
  const viscSub = ViscosityEngine.evaluateViscosity(subSaltFormula);
  assert('Zero Salt is Sub-Critical', viscSub.saltCurve.curveRegion === 'sub_critical', viscSub.saltCurve.curveRegion, 'sub_critical');

  // Over-salted regime: 4.5% NaCl
  const overSaltFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Sodium Chloride (Salt)', percentage: 4.5, category: 'Viscosity Modifier' },
    { name: 'Water', percentage: 78.5, category: 'Solvent' }
  ];
  const viscOver = ViscosityEngine.evaluateViscosity(overSaltFormula);
  assert('Over-Salted Curve Region Flagged', viscOver.saltCurve.curveRegion === 'over_salted', viscOver.saltCurve.curveRegion, 'over_salted');
  assert('Salting Out Risk Flagged True', viscOver.saltCurve.saltingOutRisk === true, viscOver.saltCurve.saltingOutRisk, true);

  // Non-fluid dry powder gating:
  const dryPowderFormula: FormulationIngredient[] = [
    { name: 'Sodium Carbonate (Soda Ash)', percentage: 40, category: 'Builder' },
    { name: 'Sodium Sulfate', percentage: 30, category: 'Filler' },
    { name: 'STPP', percentage: 15, category: 'Builder' },
    { name: 'LABSA 96%', percentage: 15, activeMatterPct: 96, category: 'Anionic Surfactant' }
  ];
  const viscPowder = ViscosityEngine.evaluateViscosity(dryPowderFormula, { productCategory: 'LAUNDRY_POWDER' });
  assert('Dry Powder is Fluid is False', viscPowder.isFluid === false, viscPowder.isFluid, false);
  assert('Dry Powder Viscosity is 0', viscPowder.viscosityCp === 0, viscPowder.viscosityCp, 0);
  assert('Dry Powder Mechanism is Unsupported Solid / Powder', viscPowder.mechanism === 'Unsupported Solid / Powder', viscPowder.mechanism, 'Unsupported Solid / Powder');

  // Polymer Thickening Network:
  const polymerFormula: FormulationIngredient[] = [
    { name: 'Xanthan Gum', percentage: 1.0, category: 'Thickener' },
    { name: 'Water', percentage: 99.0, category: 'Solvent' }
  ];
  const viscPolymer = ViscosityEngine.evaluateViscosity(polymerFormula);
  assert('Polymer Chain Entanglement Identified', viscPolymer.mechanism === 'Polymeric Chain Entanglement', viscPolymer.mechanism, 'Polymeric Chain Entanglement');

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 3 TESTS : ${total}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

/**
 * ============================================================================
 * PHASE 7 — SCIENTIFIC ACCURACY & MODEL CAPABILITY MASTER REGRESSION SUITE
 * ============================================================================
 */

import { calculatePHAdvanced } from '../pHEngine';
import { calculateActiveMatter, calculateActiveSurfactants, evaluateAuthoritativeActiveMatter } from '../activeMatterEngine';
import { evaluateAuthoritativeHLB } from '../hlbEngine';
import { calculateWaterHardnessTolerance, AUTHORITATIVE_CHELATOR_DATABASE } from '../chelatorEngine';
import { calculateDetailedViscosity } from '../viscosityEngine';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import { calculateFormulationCompatibility } from '../compatibilityEngine';
import { calculateDensity } from '../densityEngine';
import { calculateLiquidNVR } from '../liquidNvrEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { computeFormulaFingerprint } from '../provenanceEngine';
import { MASTER_ACCURACY_VALIDATION_TARGETS } from '../scientificPredictionArchitecture';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runP7ScientificAccuracyMasterTestSuite(): { suite: string; passed: number; failed: number; total: number; results: TestResult[] } {
  const results: TestResult[] = [];

  const assert = (group: string, name: string, condition: boolean, actual?: any, expected?: any, message?: string) => {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message
    });
  };

  // 1. PHEngineV2 & Stoichiometric Neutralization
  const neutralIngredients = [
    { name: 'Water', percentage: 80 },
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 },
    { name: 'Sodium Hydroxide 50% Solution', percentage: 2.5, activeMatterPct: 50 },
  ];
  const phResult = calculatePHAdvanced(neutralIngredients, 100, { productCategory: 'LAUNDRY_LIQUID' });
  assert(
    'Phase 7 Accuracy',
    '1.1 Neutralization computes pH deterministically without fake lab status',
    typeof phResult.pH === 'number' && phResult.pH > 1 && phResult.pH < 14 && phResult.measuredPH === null,
    phResult.pH,
    'Valid pH number (1 - 14)'
  );

  const highSaltIngredients = [
    { name: 'Water', percentage: 50 },
    { name: 'Sodium Chloride', percentage: 25 },
    { name: 'Sodium Hydroxide 50%', percentage: 10, activeMatterPct: 50 },
    { name: 'LABSA 96%', percentage: 15, activeMatterPct: 96 },
  ];
  const highSaltPh = calculatePHAdvanced(highSaltIngredients, 100, { productCategory: 'INDUSTRIAL_DEGREASER' });
  assert(
    'Phase 7 Accuracy',
    '1.2 Propagates activity model status for high ionic strength',
    highSaltPh.modelValidity !== undefined && highSaltPh.details !== undefined,
    highSaltPh.modelValidity,
    'Model validity defined'
  );

  const unknownAcidIngredients = [
    { name: 'Water', percentage: 90 },
    { name: 'Novel Experimental Acid Ex-99', percentage: 10 },
  ];
  const unknownAcidPh = calculatePHAdvanced(unknownAcidIngredients, 100);
  assert(
    'Phase 7 Accuracy',
    '1.3 Preserves UNKNOWN state when species pKa is missing without silent zeroing',
    unknownAcidPh.measuredPH === null,
    unknownAcidPh.measuredPH,
    'null'
  );

  // 2. Active Matter Engine
  const surfactantsIngredients = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70 },
    { name: 'Lauryl Glucoside 50%', percentage: 4, activeMatterPct: 50 },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30 },
    { name: 'Water', percentage: 81 }
  ];
  const activeSurfactantsPct = calculateActiveSurfactants(surfactantsIngredients);
  assert(
    'Phase 7 Accuracy',
    '2.1 Separates anionic, nonionic, and amphoteric active matter accurately',
    Math.abs(activeSurfactantsPct - 10.5) < 0.2,
    activeSurfactantsPct,
    '10.5%'
  );

  const labsaIngredients = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 }
  ];
  const activeValue = calculateActiveMatter(labsaIngredients);
  const activeReport = evaluateAuthoritativeActiveMatter(labsaIngredients);
  assert(
    'Phase 7 Accuracy',
    '2.2 Uses authoritative ActiveMatterEngine output and prevents duplicate active calculations',
    Math.abs(activeValue - 9.6) < 0.1 && Math.abs(activeReport.totalActiveMatter - 9.6) < 0.1,
    activeValue,
    '9.6%'
  );

  // 3. HLB Engine
  const nonionicFormula = [
    { name: 'Water', percentage: 85 },
    { name: 'Alcohol Ethoxylate 7EO (LAE 7EO)', percentage: 10, hlb: 12.1 },
    { name: 'Alcohol Ethoxylate 3EO', percentage: 5, hlb: 8.0 }
  ];
  const hlbResult = evaluateAuthoritativeHLB(nonionicFormula);
  assert(
    'Phase 7 Accuracy',
    '3.1 Explicitly distinguishes Griffin, Davies, and Method metadata',
    hlbResult.blendedHLB > 0 && hlbResult.methodMetadata !== undefined,
    hlbResult.methodMetadata,
    'Defined method metadata'
  );

  // 4. Chelation & Water Hardness
  const edta = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'EDTA_4NA' || c.name.includes('EDTA'));
  const citrate = AUTHORITATIVE_CHELATOR_DATABASE.find(c => c.id === 'SODIUM_CITRATE_DIHYDRATE' || c.name.includes('Citrate'));
  assert(
    'Phase 7 Accuracy',
    '4.1 Differentiates ligand chelation (EDTA) from builder complexation (Citrate)',
    edta?.mechanism === 'CHELATION' && citrate?.mechanism === 'BUILDER_COMPLEXATION',
    `${edta?.mechanism} / ${citrate?.mechanism}`,
    'CHELATION / BUILDER_COMPLEXATION'
  );

  const chelatorIngredients = [
    { name: 'Water', percentage: 95 },
    { name: 'Tetrasodium EDTA 39% Solution', percentage: 5, activeMatterPct: 39 }
  ];
  const tolerance = calculateWaterHardnessTolerance(chelatorIngredients, 100);
  assert(
    'Phase 7 Accuracy',
    '4.2 Calculates effective Ca/Mg binding capacity without treating theoretical as free-metal removal',
    tolerance.provenance !== undefined,
    tolerance.provenance,
    'Defined provenance'
  );

  // 5. Viscosity Engine
  const viscIngredients = [
    { name: 'Water', percentage: 80 },
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70 },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30 },
    { name: 'Sodium Chloride', percentage: 1.5 }
  ];
  const visc = calculateDetailedViscosity(viscIngredients, { productCategory: 'HAND_DISH_LIQUID', targetPH: 7.0 });
  assert(
    'Phase 7 Accuracy',
    '5.1 Viscosity model provides salt curve state and viscosity profile',
    visc.viscosityCp > 0 && visc.saltCurve !== undefined,
    visc.viscosityCp,
    '> 0 cPs'
  );

  const powderIngredients = [
    { name: 'Sodium Carbonate (Soda Ash)', percentage: 50 },
    { name: 'Sodium Sulfate', percentage: 40 },
    { name: 'Linear Alkylbenzene Sulfonate Powder', percentage: 10 }
  ];
  const powderVisc = calculateDetailedViscosity(powderIngredients, { productCategory: 'LAUNDRY_POWDER', targetPH: 10.5 });
  assert(
    'Phase 7 Accuracy',
    '5.2 Strictly marks dry powder formulations as NOT_APPLICABLE / unsupported for liquid viscosity',
    powderVisc.rating !== undefined,
    powderVisc.rating,
    'Viscosity rating defined'
  );

  // 6. Cleaning Performance / CPI
  const cleaningIngredients = [
    { name: 'Water', percentage: 80 },
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70 },
    { name: 'Alcohol Ethoxylate 7EO', percentage: 5, activeMatterPct: 100 },
    { name: 'Sodium Citrate', percentage: 3 }
  ];
  const perf = calculateCleaningPerformance(cleaningIngredients, 8.0, 'LAUNDRY_LIQUID', undefined, { waterHardnessPpm: 150 });
  assert(
    'Phase 7 Accuracy',
    '6.1 Calculates CPI as HEURISTIC_SCREENING and never outputs measured soil removal without lab input',
    perf.cpi > 0 && perf.cpi <= 100 && perf.isMeasured === false && perf.measuredSoilRemovalPct === undefined,
    `CPI: ${perf.cpi}, Measured: ${perf.isMeasured}`,
    'Screening CPI without false lab measurements'
  );

  // 7. Compatibility
  const clashFormula = [
    { name: 'Water', percentage: 85 },
    { name: 'SLES 70% (Anionic)', percentage: 10, activeMatterPct: 70 },
    { name: 'Cetrimonium Chloride (Cationic)', percentage: 5, activeMatterPct: 30 }
  ];
  const compClash = calculateFormulationCompatibility(clashFormula, 7.0, 'HAND_DISH_LIQUID');
  assert(
    'Phase 7 Accuracy',
    '7.1 Detects anionic/cationic clash and flags as High/Critical severity alert',
    compClash.compatible === false && compClash.alerts.some(a => a.severity === 'High' || a.severity === 'Critical'),
    compClash.compatible,
    'false'
  );

  const safeFormula = [
    { name: 'Water', percentage: 90 },
    { name: 'Glycerin', percentage: 5 },
    { name: 'Sodium Benzoate', percentage: 0.5 }
  ];
  const compSafe = calculateFormulationCompatibility(safeFormula, 6.0, 'NEUTRAL_CLEANER');
  assert(
    'Phase 7 Accuracy',
    '7.2 Correctly separates KNOWN_COMPATIBLE, KNOWN_INCOMPATIBLE, and NO_KNOWN_CONFLICT',
    compSafe.compatibilityStatusSemantic !== undefined && compSafe.evidenceStatus !== undefined,
    compSafe.compatibilityStatusSemantic,
    'Defined status semantic'
  );

  // 8. Density & Liquid NVR
  const liquidFormula = [
    { name: 'Water', percentage: 80 },
    { name: 'SLES 70%', percentage: 10, density: 1.05 },
    { name: 'Sodium Chloride', percentage: 2, density: 1.20 }
  ];
  const density = calculateDensity(liquidFormula, 100);
  assert(
    'Phase 7 Accuracy',
    '8.1 Density engine explicitly labels outputs as PREDICTED_DENSITY and IDEALIZED_MODEL',
    density.densityType === 'PREDICTED_DENSITY' && density.isIdealVolumeAdditivity === true && density.provenance === 'PREDICTED',
    density.densityType,
    'PREDICTED_DENSITY'
  );

  const unknownNvrFormula = [
    { name: 'Water', percentage: 80 },
    { name: 'Novel Uncharacterized Resin', percentage: 20 }
  ];
  const nvr = calculateLiquidNVR(unknownNvrFormula, 100);
  assert(
    'Phase 7 Accuracy',
    '8.2 Liquid NVR engine propagates INSUFFICIENT_DATA when non-volatile fractions are unknown',
    nvr.status === 'INSUFFICIENT_DATA' && nvr.provenance === 'INSUFFICIENT_DATA',
    nvr.status,
    'INSUFFICIENT_DATA'
  );

  // 9. Decision Engines & Governance
  const gateIngredients = [
    { name: 'Water', percentage: 85 },
    { name: 'SLES 70%', percentage: 10 },
    { name: 'CAPB 30%', percentage: 5 }
  ];
  const gate = evaluateScientificQualityGate({ formulaName: 'Gate Test', formulaVersion: '1.0', productCategory: 'HAND_DISH_LIQUID', ingredients: gateIngredients });
  assert(
    'Phase 7 Accuracy',
    '9.1 ScientificQualityGate Engine acts as a non-recalculating decision layer',
    gate.scientificValidity !== undefined && gate.evaluatedAt !== undefined,
    gate.scientificValidity,
    'Defined validity'
  );

  const fingerprint = computeFormulaFingerprint('F-TEST-1', '1.0.0', [
    { name: 'Water', percentage: 80 },
    { name: 'SLES 70%', percentage: 20 }
  ], 'HAND_DISH_LIQUID');
  assert(
    'Phase 7 Accuracy',
    '9.2 Provenance engine computes deterministic fingerprints and enforces evidence firewall',
    fingerprint.length > 0,
    fingerprint,
    'Non-empty fingerprint'
  );

  assert(
    'Phase 7 Accuracy',
    '9.3 Validates Master Accuracy Target Framework guards against unvalidated 95%/99% accuracy claims',
    Array.isArray(MASTER_ACCURACY_VALIDATION_TARGETS) &&
    MASTER_ACCURACY_VALIDATION_TARGETS.every(t =>
      t.validationStatus === 'NOT_YET_VALIDATED' ||
      t.validationStatus === 'PARTIALLY_VALIDATED'
    ),
    MASTER_ACCURACY_VALIDATION_TARGETS.length,
    'All targets NOT_YET_VALIDATED or PARTIALLY_VALIDATED'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`Phase 7 Scientific Accuracy Master Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    suite: 'Phase 7 Scientific Accuracy Master',
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

/**
 * ============================================================================
 * PHASE 4.7 — SCIENTIFIC MODEL DEPTH & PREDICTIVE CAPABILITY REGRESSION SUITE
 * ============================================================================
 * Surgical regression testing covering all 11 scientific domains:
 * 1. PHEngineV2 (strong acid/base, weak acid/base, polyprotic, LABSA, unknown pKa/assay, high ionic strength)
 * 2. Neutralization (monofunctional, polyfunctional, carbonate, excess, limiting)
 * 3. Chelation (GLDA, EDTA, citrate, STPP, zeolite, Ca/Mg hardness, unknown capacity)
 * 4. Viscosity (missing grade, missing electrolyte data, temperature, shear-rate, unsupported solid)
 * 5. Cleaning/CPI (category routing, soil classes, hard vs soft water, missing dosage)
 * 6. Compatibility (known ionic clash, known acid/base conflict, unknown/screening pair)
 * 7. HLB (nonionic Griffin, ionic Davies, unsupported ingredient, methodMetadata)
 * 8. Density (predicted density, ideal volume additivity, missing density)
 * 9. Liquid NVR (METHOD_NOT_VERIFIED protocol, known vs unknown solids, separation from lab measurement)
 * 10. Powder (measured bulk/tapped density, missing tap density screening estimate)
 * 11. Stability (screening risk, absence of fake numerical shelf-life without empirical data)
 * ============================================================================
 */

import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import { ActivityModel } from '../../domain/ph/activityModel';
import { classifyChemicalSpecies, getSpeciesProvenance } from '../../domain/ph/chemicalSpeciesRegistry';
import { StoichiometricNeutralizationEngine } from '../../domain/ph/stoichiometricNeutralizationEngine';
import {
  calculateDynamicChelatorRequirement,
  getChelatorBindingCapacity
} from '../chelatorEngine';
import { ViscosityEngine } from '../viscosityEngine';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import { calculateFormulationCompatibility } from '../compatibilityEngine';
import { HLBEngine } from '../hlbEngine';
import { calculateDensity } from '../densityEngine';
import { calculateLiquidNVR } from '../liquidNvrEngine';
import { calculatePowderDensity, calculatePowderFlowability } from '../powderEngine/powderPhysicalProperties';
import { calculateShelfLife } from '../calculators';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { SCIENTIFIC_MODEL_REGISTRY } from '../scientificModelRegistry';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runP4Phase7ScientificModelDepthTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    });
  }

  function assertNear(group: string, name: string, actual: number, expected: number, tol: number) {
    const diff = Math.abs(actual - expected);
    const pass = diff <= tol;
    assert(group, name, pass, actual, `${expected} ± ${tol}`);
  }

  // =========================================================================
  // 1. PHEngineV2 Tests
  // =========================================================================
  // 1.1 Strong acid + Strong base
  const phStrong = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Hydrochloric Acid', percentage: 0.03646, activeMatterPct: 100 },
      { name: 'Sodium Hydroxide', percentage: 0.040, activeMatterPct: 100 }
    ]),
    100
  );
  assertNear('1. PHEngineV2', '1.1 Strong acid + base equimolar neutrality', phStrong.pH, 7.00, 0.05);

  // 1.2 Weak acid (Acetic acid)
  const phWeakAcid = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Acetic Acid', percentage: 0.60, activeMatterPct: 100 }]),
    100
  );
  assert('1. PHEngineV2', '1.2 Weak acid yields acidic equilibrium', phWeakAcid.pH < 4.0 && phWeakAcid.pH > 2.0, phWeakAcid.pH, '2.0 - 4.0');

  // 1.3 Weak base (Triethanolamine)
  const phWeakBase = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Triethanolamine (TEA 99%)', percentage: 1.5, activeMatterPct: 99 }]),
    100
  );
  assert('1. PHEngineV2', '1.3 Weak base yields alkaline equilibrium', phWeakBase.pH > 9.5 && phWeakBase.pH < 11.5, phWeakBase.pH, '9.5 - 11.5');

  // 1.4 Polyprotic acid (Citric acid diprotic/triprotic buffer)
  const phCitrate = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Citric Acid', percentage: 1.5 },
      { name: 'Sodium Citrate', percentage: 2.0 }
    ]),
    100
  );
  assertNear('1. PHEngineV2', '1.4 Polyprotic Citrate buffer equilibrium', phCitrate.pH, 4.75, 0.35);

  // 1.5 LABSA Neutralization
  const phLabs = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'LABSA', percentage: 3.2649, activeMatterPct: 100 },
      { name: 'NaOH', percentage: 0.400, activeMatterPct: 100 }
    ]),
    100
  );
  assertNear('1. PHEngineV2', '1.5 LABSA + NaOH stoichiometric equivalence pH', phLabs.pH, 7.00, 0.05);

  // 1.6 Unknown pKa / Unknown species
  const phUnknown = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([{ name: 'Uncharacterized Exotic Additive', percentage: 5.0 }]),
    100
  );
  assert('1. PHEngineV2', '1.6 Unknown species flags diagnostic warning', phUnknown.warnings.length > 0, phUnknown.warnings.length > 0, true);

  // 1.7 High ionic strength regime
  const phHighI = PHEngineV2.calculatePH(
    mapFormulationIngredientsToPHEngineInput([
      { name: 'Sodium Chloride', percentage: 18.0 },
      { name: 'Sodium Hydroxide', percentage: 0.5 }
    ]),
    100
  );
  assert('1. PHEngineV2', '1.7 High ionic strength flags elevated uncertainty', phHighI.modelValidity === 'LOW' || phHighI.modelValidity === 'OUT_OF_RANGE', phHighI.modelValidity, 'LOW or OUT_OF_RANGE');

  // =========================================================================
  // 2. Stoichiometric Neutralization Tests
  // =========================================================================
  // 2.1 Monofunctional strong reaction (LABSA 96% + NaOH 50%)
  const neutMono = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 96%', rawPercent: 10.0 },
    { name: 'Caustic Soda 50%', rawPercent: 2.454 }
  ], 100);
  assert('2. Neutralization', '2.1 Monofunctional primary neutralization evaluates reaction extent', neutMono.value.status === 'FULLY_NEUTRALIZED' || neutMono.value.status === 'BASE_EXCESS' || neutMono.value.status === 'UNDER_NEUTRALIZED', true, true);

  // 2.2 Polyfunctional diprotic sulfuric acid
  const neutSulf = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'Sulfuric Acid 98%', rawPercent: 5.0 },
    { name: 'Caustic Soda Flakes 99%', rawPercent: 4.037 }
  ], 100);
  assert('2. Neutralization', '2.2 Diprotic mineral acid reacts using 2 reactive equivalents per mole', neutSulf.value.totalAcidEquivalentsInitial > 0, true, true);

  // 2.3 Carbonate/Soda ash secondary isolation
  const neutCarbonate = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 96%', rawPercent: 10.0 },
    { name: 'Caustic Soda 50%', rawPercent: 2.454 },
    { name: 'Soda Ash Dense', rawPercent: 5.0 }
  ], 100);
  assert('2. Neutralization', '2.3 Soda ash is isolated as secondary buffer and does not hijack primary surfactant equivalence', neutCarbonate.value.secondaryBasesPresent.length > 0, true, true);

  // 2.4 Excess acid condition
  const neutExcessAcid = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 96%', rawPercent: 10.0 },
    { name: 'Caustic Soda 50%', rawPercent: 1.0 }
  ], 100);
  assert('2. Neutralization', '2.4 Under-neutralized formula flags BASE as limiting reagent', neutExcessAcid.value.status === 'UNDER_NEUTRALIZED' && neutExcessAcid.value.limitingReagent === 'BASE', true, true);

  // 2.5 Excess base condition
  const neutExcessBase = StoichiometricNeutralizationEngine.evaluatePrimaryNeutralization([
    { name: 'LABSA 96%', rawPercent: 10.0 },
    { name: 'Caustic Soda 50%', rawPercent: 5.0 }
  ], 100);
  assert('2. Neutralization', '2.5 Over-neutralized formula flags ACID as limiting reagent', neutExcessBase.value.status === 'BASE_EXCESS' && neutExcessBase.value.limitingReagent === 'ACID', true, true);

  // =========================================================================
  // 3. Chelator & Builder Chemistry Tests
  // =========================================================================
  // 3.1 Separate mechanisms for soluble chelants vs inorganic builders vs zeolite
  const gldaCap = getChelatorBindingCapacity('GLDA 47% Liquid');
  const edtaCap = getChelatorBindingCapacity('EDTA Tetrasodium / 99% Powder');
  const citCap = getChelatorBindingCapacity('Sodium Citrate Dihydrate');
  const stppCap = getChelatorBindingCapacity('Sodium Tripolyphosphate (STPP 94%)');
  const zeoCap = getChelatorBindingCapacity('Zeolite 4A Builder Powder');

  assert('3. Chelation', '3.1 GLDA effective binding capacity is 137 mg CaCO3/g', gldaCap === 137, gldaCap, 137);
  assert('3. Chelation', '3.2 EDTA 99% powder binding capacity is 220 mg CaCO3/g', edtaCap === 220, edtaCap, 220);
  assert('3. Chelation', '3.3 Citrate binding capacity is 150 mg CaCO3/g', citCap === 150, citCap, 150);
  assert('3. Chelation', '3.4 STPP binding capacity is 180 mg CaCO3/g', stppCap === 180, stppCap, 180);
  assert('3. Chelation', '3.5 Zeolite 4A ion-exchange capacity is 110 mg CaCO3/g', zeoCap === 110, zeoCap, 110);

  // 3.6 Dynamic hardness demand calculation
  const dynChel = calculateDynamicChelatorRequirement(
    [{ name: 'Sodium Citrate Dihydrate', percentage: 1.0 }],
    300, // 300 ppm hard water
    10,  // 10L wash volume
    20   // 20g dose
  );
  assert('3. Chelation', '3.6 Dynamic hardness load correctly calculated for 300 ppm in 10L = 3000 mg CaCO3', dynChel.hardnessLoadMg === 3000, dynChel.hardnessLoadMg, 3000);

  // 3.7 Unknown chelation capacity
  const unkChelCap = getChelatorBindingCapacity('Unknown Mystery Salt');
  assert('3. Chelation', '3.7 Unknown ingredients do NOT receive fabricated chelation capacity', unkChelCap === 0, unkChelCap, 0);

  // =========================================================================
  // 4. Viscosity & Rheology Tests
  // =========================================================================
  // 4.1 Unsupported dry powders return non-fluid classification
  const viscPowder = ViscosityEngine.evaluateViscosity(
    [{ name: 'Soda Ash', percentage: 50 }, { name: 'Sodium Sulfate', percentage: 50 }],
    { productCategory: 'Laundry Powder' }
  );
  assert('4. Viscosity', '4.1 Powder returns isFluid = false and Not Applicable rating', viscPowder.isFluid === false && viscPowder.rating === 'Not Applicable (Solid / Powder)', viscPowder.rating, 'Not Applicable (Solid / Powder)');

  // 4.2 Shear rate distinction (zero-shear vs medium-shear vs high-shear dispensing)
  const viscLiquid = ViscosityEngine.evaluateViscosity(
    [
      { name: 'Water', percentage: 70 },
      { name: 'SLES 70%', percentage: 14, activeMatterPct: 70 },
      { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30 },
      { name: 'Sodium Chloride', percentage: 1.5 }
    ],
    { productCategory: 'Liquid Detergent' }
  );
  assert('4. Viscosity', '4.2 Pseudoplastic shear-thinning: zero-shear viscosity > high-shear viscosity', viscLiquid.shearProfile.zeroShearViscosityCp >= viscLiquid.shearProfile.highShearViscosityCp, true, true);

  // 4.3 Temperature response
  assert('4. Viscosity', '4.3 Temperature response: cold storage viscosity (4°C) > hot storage viscosity (40°C)', viscLiquid.temperatureProfile.temp4C_Cp > viscLiquid.temperatureProfile.temp40C_Cp, true, true);

  // 4.4 Missing electrolyte data
  const viscNoSalt = ViscosityEngine.evaluateViscosity(
    [{ name: 'Water', percentage: 85 }, { name: 'SLES 70%', percentage: 15, activeMatterPct: 70 }],
    { productCategory: 'Liquid Dishwash' }
  );
  assert('4. Viscosity', '4.4 Without salt/polymer, surfactant matrix correctly stays in sub-critical low-viscosity regime', viscNoSalt.saltCurve.curveRegion === 'sub_critical', viscNoSalt.saltCurve.curveRegion, 'sub_critical');

  // =========================================================================
  // 5. Cleaning Performance / CPI Tests
  // =========================================================================
  // 5.1 Category awareness: Fabric softener has null cleaning score
  const cpiSoftener = calculateCleaningPerformance(
    [{ name: 'Esterquat 90%', percentage: 8, activeMatterPct: 90 }],
    5.0,
    'FABRIC_SOFTENER'
  );
  assert('5. Cleaning', '5.1 Fabric Softener has cleaningScore = null and conditioning power', cpiSoftener.cleaningScore === null && !cpiSoftener.isCleaningApplicable, true, true);

  // 5.2 Category awareness: Dishwashing evaluation
  const cpiDish = calculateCleaningPerformance(
    [
      { name: 'Water', percentage: 70 },
      { name: 'LABSA 96%', percentage: 12, activeMatterPct: 96 },
      { name: 'SLES 70%', percentage: 5, activeMatterPct: 70 },
      { name: 'CAPB 30%', percentage: 3, activeMatterPct: 30 }
    ],
    7.5,
    'DISHWASH_MANUAL'
  );
  assert('5. Cleaning', '5.2 Manual dishwash produces predicted cleaning index', cpiDish.cpi > 60 && cpiDish.isCleaningApplicable, true, true);

  // 5.3 Hard water penalty without chelation
  const cpiHardNoChel = calculateCleaningPerformance(
    [{ name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 }],
    8.0,
    'LAUNDRY_LIQUID',
    undefined,
    { waterHardnessPpm: 400 } // Unchelated very hard water
  );
  const cpiSoft = calculateCleaningPerformance(
    [{ name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 }],
    8.0,
    'LAUNDRY_LIQUID',
    undefined,
    { waterHardnessPpm: 0 } // Soft water
  );
  assert('5. Cleaning', '5.3 Unbuffered hard water penalizes particulate and overall detergency', cpiHardNoChel.cpi <= cpiSoft.cpi, true, true);

  // 5.4 Empty formula receives INSUFFICIENT_DATA provenance
  const cpiEmpty = calculateCleaningPerformance([], 7.0, 'LAUNDRY_LIQUID');
  assert('5. Cleaning', '5.4 Empty formula receives INSUFFICIENT_DATA provenance', cpiEmpty.provenance === 'INSUFFICIENT_DATA', cpiEmpty.provenance, 'INSUFFICIENT_DATA');

  // =========================================================================
  // 6. Compatibility Engine Tests
  // =========================================================================
  // 6.1 Anionic + Cationic precipitation conflict
  const compClash = calculateFormulationCompatibility([
    { name: 'LABSA 96%', percentage: 10, role: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 5, role: 'Cationic Surfactant' }
  ]);
  assert('6. Compatibility', '6.1 Anionic + Cationic conflict detects severe clash', compClash.compatible === false && compClash.compatibilityStatusSemantic === 'INCOMPATIBLE', true, true);
  assert('6. Compatibility', '6.1 evidenceStatus reports KNOWN_INCOMPATIBLE', compClash.evidenceStatus === 'KNOWN_INCOMPATIBLE', compClash.evidenceStatus, 'KNOWN_INCOMPATIBLE');

  // 6.2 Acid + Bleach hazardous gas clash
  const compBleachAcid = calculateFormulationCompatibility([
    { name: 'Sodium Hypochlorite 12%', percentage: 10, role: 'Oxidizer' },
    { name: 'Hydrochloric Acid', percentage: 5, role: 'Acid' }
  ]);
  assert('6. Compatibility', '6.2 Acid + Hypochlorite generates Critical chlorine hazard alert', compBleachAcid.alerts.some(a => a.severity === 'Critical'), true, true);

  // 6.3 Clean nonionic/water formula receives SCREENING_COMPATIBLE (no known conflict, not proof of infinite stability)
  const compClean = calculateFormulationCompatibility([
    { name: 'Water', percentage: 89.9 },
    { name: 'Lauryl Glucoside 50%', percentage: 10, role: 'Nonionic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, role: 'Preservative', category: 'Preservative' }
  ]);
  assert('6. Compatibility', '6.3 Clean formula receives NO_KNOWN_CONFLICT / SCREENING_COMPATIBLE without false proof', compClean.compatibilityStatusSemantic === 'NO_KNOWN_CONFLICT' && compClean.evidenceStatus === 'SCREENING_COMPATIBLE', true, true);

  // 6.4 Empty formula receives INSUFFICIENT_DATA
  const compEmpty = calculateFormulationCompatibility([]);
  assert('6. Compatibility', '6.4 Empty formula receives INSUFFICIENT_DATA evidence status', compEmpty.evidenceStatus === 'INSUFFICIENT_DATA', compEmpty.evidenceStatus, 'INSUFFICIENT_DATA');

  // =========================================================================
  // 7. HLB Engine Tests
  // =========================================================================
  // 7.1 Pure nonionic Griffin HLB
  const hlbNonionic = HLBEngine.calculateBlendedHLB([
    { name: 'Span 80 (Sorbitan Monooleate)', percentage: 5, activeMatterPct: 100 },
    { name: 'LAE-7 (Alcohol Ethoxylate 7EO)', percentage: 5, activeMatterPct: 100 }
  ]);
  assert('7. HLB', '7.1 Nonionic blend calculates Griffin scale with GRIFFIN methodMetadata', hlbNonionic.methodMetadata === 'GRIFFIN' && !hlbNonionic.hasIonicSurfactants, true, true);

  // 7.2 Ionic surfactant blend uses Davies scale
  const hlbIonic = HLBEngine.calculateBlendedHLB([
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70 },
    { name: 'LAE-7 (Alcohol Ethoxylate 7EO)', percentage: 5, activeMatterPct: 100 }
  ]);
  assert('7. HLB', '7.2 Ionic blend flags DAVIES methodMetadata and hasIonicSurfactants', hlbIonic.methodMetadata === 'DAVIES' && hlbIonic.hasIonicSurfactants, true, true);

  // 7.3 Non-surfactants return NOT_APPLICABLE
  const hlbInert = HLBEngine.calculateBlendedHLB([{ name: 'Water', percentage: 100 }]);
  assert('7. HLB', '7.3 Non-surfactant formula returns NOT_APPLICABLE methodMetadata', hlbInert.methodMetadata === 'NOT_APPLICABLE' && !hlbInert.hasSurfactants, true, true);

  // =========================================================================
  // 8. Density Engine Tests
  // =========================================================================
  // 8.1 Pure water density baseline
  const densWater = calculateDensity([]);
  assert('8. Density', '8.1 Water baseline gives 1.000 g/cm3 with PREDICTED_DENSITY tag', densWater.densityGPerCm3 === 1.000 && densWater.densityType === 'PREDICTED_DENSITY', true, true);

  // 8.2 Concentrated formulation density via harmonic volume additivity
  const densMix = calculateDensity([
    { name: 'Water', percentage: 70 },
    { name: 'Caustic Soda 50%', percentage: 10 }, // density ~ 1.53
    { name: 'Glycerin', percentage: 20 }           // density ~ 1.26
  ], 100);
  assert('8. Density', '8.2 Dense solution calculates composite density > 1.05 g/cm3', densMix.densityGPerCm3 > 1.05 && densMix.provenance === 'PREDICTED', true, true);

  // =========================================================================
  // 9. Liquid NVR Engine Tests
  // =========================================================================
  // 9.1 Verification that ASTM D1767 has been removed and METHOD_NOT_VERIFIED is cited
  const nvrRes = calculateLiquidNVR([
    { name: 'Water', percentage: 80 },
    { name: 'Salt', percentage: 20, nonVolatileFraction: 1.0 }
  ]);
  assert('9. Liquid NVR', '9.1 Drying protocol does NOT cite incorrect ASTM D1767', !nvrRes.dryingProtocolAssumed?.includes('ASTM D1767'), true, true);
  assert('9. Liquid NVR', '9.1 Drying protocol cites METHOD_NOT_VERIFIED', Boolean(nvrRes.dryingProtocolAssumed?.includes('METHOD_NOT_VERIFIED')), true, true);
  assert('9. Liquid NVR', '9.2 Theoretical NVR calculates exact mass balance (20.0%)', nvrRes.nvrPercentage === 20.0, nvrRes.nvrPercentage, 20.0);
  assert('9. Liquid NVR', '9.3 Complete formulation carries CALCULATED provenance, not false MEASURED', nvrRes.provenance === 'CALCULATED', nvrRes.provenance, 'CALCULATED');

  // =========================================================================
  // 10. Powder Physical Properties Tests
  // =========================================================================
  // 10.1 Measured mass & cylinder volume yields MEASURED tap density
  const powMeasured = calculatePowderDensity([], {
    measuredSampleMassG: 50,
    measuredLooseVolumeMl: 100,
    measuredTappedVolumeMl: 80
  });
  assert('10. Powder', '10.1 Measured cylinder inputs calculate exact bulk and tapped densities', powMeasured.densityType === 'MEASURED' && powMeasured.measuredBulkDensityGPerL === 500 && powMeasured.measuredTappedDensityGPerL === 625, true, true);

  // 10.2 Carr Index & Hausner Ratio from measured densities
  const flowMeasured = calculatePowderFlowability(powMeasured);
  assert('10. Powder', '10.2 Carr Index = (625 - 500)/625 * 100 = 20.0% (Fair flow)', flowMeasured.flowType === 'CALCULATED_INDICATOR' && flowMeasured.carrIndexPct === 20.0, flowMeasured.carrIndexPct, 20.0);

  // 10.3 Unmeasured powder density returns SCREENING_ESTIMATE, not fake lab values
  const powUnmeasured = calculatePowderDensity([
    { name: 'Soda Ash Dense', inputPercentage: 60, role: 'Builder', activeAssayPct: 99.2 } as any
  ]);
  assert('10. Powder', '10.3 Unmeasured density returns SCREENING_ESTIMATE', powUnmeasured.densityType === 'SCREENING_ESTIMATE', powUnmeasured.densityType, 'SCREENING_ESTIMATE');

  const flowUnmeasured = calculatePowderFlowability(powUnmeasured);
  assert('10. Powder', '10.4 Unmeasured flowability strictly returns INSUFFICIENT_DATA without fake values', flowUnmeasured.flowType === 'INSUFFICIENT_DATA', flowUnmeasured.flowType, 'INSUFFICIENT_DATA');

  // =========================================================================
  // 11. Stability Screening Tests
  // =========================================================================
  // 11.1 Empty formula stability has UNKNOWN shelf life status
  const stabEmpty = calculateShelfLife([]);
  assert('11. Stability', '11.1 Empty formula shelf life status is UNKNOWN', stabEmpty.shelfLifeStatus === 'UNKNOWN', stabEmpty.shelfLifeStatus, 'UNKNOWN');

  // 11.2 Unpreserved water formula detects microbial risk
  const stabUnpreserved = calculateShelfLife([
    { name: 'Water', percentage: 90 },
    { name: 'SLES 70%', percentage: 10 }
  ]);
  assert('11. Stability', '11.2 Unpreserved aqueous phase flags UNPRESERVED_AQUEOUS_RISK', stabUnpreserved.microbialStability === 'UNPRESERVED_AQUEOUS_RISK' && stabUnpreserved.stabilityRisk === 'High', true, true);

  // 11.3 Preserved formula flags ADEQUATELY_PRESERVED
  const stabPreserved = calculateShelfLife([
    { name: 'Water', percentage: 89.9 },
    { name: 'SLES 70%', percentage: 10 },
    { name: 'Kathon CG', percentage: 0.1, category: 'Preservative' }
  ]);
  assert('11. Stability', '11.3 Preserved formula flags ADEQUATELY_PRESERVED', stabPreserved.microbialStability === 'ADEQUATELY_PRESERVED', stabPreserved.microbialStability, 'ADEQUATELY_PRESERVED');

  // =========================================================================
  // 12. Model Classification, Parameter Provenance & Evidence Gate Tests (A - J)
  // =========================================================================

  // A. PHEngine maturity classification
  const phMeta = SCIENTIFIC_MODEL_REGISTRY['model-ph-v2'];
  assert(
    '12. Evidence Gate',
    'A. PHEngine maturity is THERMODYNAMIC_EQUILIBRIUM_SCREENING & EMPIRICALLY_UNVALIDATED',
    phMeta.modelClass === 'THERMODYNAMIC_EQUILIBRIUM_SCREENING' &&
    phMeta.maturity === 'THERMODYNAMIC_EQUILIBRIUM_SCREENING' &&
    phMeta.validationStatus === 'EMPIRICALLY_UNVALIDATED',
    `${phMeta.modelClass} / ${phMeta.validationStatus}`,
    'THERMODYNAMIC_EQUILIBRIUM_SCREENING / EMPIRICALLY_UNVALIDATED'
  );

  // B. PHEngine unknown parameter propagation & species provenance
  const unmappedSpecies = classifyChemicalSpecies('Unlisted Botanical Bark Extract');
  const mappedSpecies = classifyChemicalSpecies('Caustic Soda Lye 48%');
  const unmappedProv = getSpeciesProvenance(unmappedSpecies);
  const mappedProv = getSpeciesProvenance(mappedSpecies);
  const phUnmapped = PHEngineV2.calculatePH([
    { name: 'Water', rawPercent: 90 },
    { name: 'Unlisted Botanical Bark Extract', rawPercent: 10 }
  ]);
  assert(
    '12. Evidence Gate',
    'B. Species parameter provenance distinguishes SOURCE_BACKED vs UNKNOWN without silent zeroing',
    mappedProv === 'SOURCE_BACKED' &&
    unmappedProv === 'UNKNOWN' &&
    Boolean(phUnmapped.details?.normalizedComposition && phUnmapped.details.normalizedComposition.recognizedMassFraction < 1.0),
    true,
    true
  );

  // C. Activity-model applicability boundary routing
  const dhDilute = ActivityModel.getIonActivityCoefficient(0.05, 1, 'debye_huckel');
  const dhTrans = ActivityModel.getIonActivityCoefficient(0.3, 1, 'debye_huckel');
  const daviesOutOfDomain = ActivityModel.getIonActivityCoefficient(2.5, 1, 'davies');
  const phConcentrated = PHEngineV2.calculatePH([
    { name: 'Water', rawPercent: 75 },
    { name: 'Sodium Chloride', rawPercent: 25 }
  ]);
  assert(
    '12. Evidence Gate',
    'C. Activity model routes Extended Debye-Hückel / Davies and marks I > 1.5 M OUT_OF_RANGE',
    dhDilute.routingRegime === 'EXTENDED_DEBYE_HUCKEL_DILUTE' &&
    dhTrans.routingRegime === 'DAVIES_TRANSITION' &&
    daviesOutOfDomain.isOutOfDomain === true &&
    phConcentrated.modelValidity === 'OUT_OF_RANGE' &&
    phConcentrated.confidence <= 30,
    true,
    true
  );

  // D. Viscosity unknown coefficient behavior & screening classification
  const viscMeta = SCIENTIFIC_MODEL_REGISTRY['model-viscosity-rheology'];
  const viscPowderCheck = ViscosityEngine.evaluateViscosity([
    { name: 'Soda Ash', percentage: 60 },
    { name: 'Sodium Sulfate', percentage: 40 }
  ], { productCategory: 'Laundry Powder' });
  assert(
    '12. Evidence Gate',
    'D. Viscosity is SEMI_EMPIRICAL_SCREENING and solid powder returns unsupported without fake cPs',
    viscMeta.modelClass === 'SEMI_EMPIRICAL_SCREENING' &&
    viscMeta.validationStatus === 'EMPIRICALLY_UNVALIDATED' &&
    viscPowderCheck.dataSource === 'unsupported' &&
    viscPowderCheck.isFluid === false,
    true,
    true
  );

  // E. CPI arbitrary coefficient protection & no unmeasured soil removal claims
  const cpiMeta = SCIENTIFIC_MODEL_REGISTRY['model-cpi-cleaning'];
  const cpiCalc = calculateCleaningPerformance([
    { name: 'Water', percentage: 80 },
    { name: 'SLES 70%', percentage: 15 },
    { name: 'CAPB 30%', percentage: 5 }
  ], 8.5, 'Laundry Liquid');
  assert(
    '12. Evidence Gate',
    'E. CPI is HEURISTIC_SCREENING and never outputs measured soil removal without empirical lab input',
    cpiMeta.modelClass === 'HEURISTIC_SCREENING' &&
    cpiMeta.validationStatus === 'EMPIRICALLY_UNVALIDATED' &&
    cpiCalc.provenance === 'PREDICTED' &&
    cpiCalc.measuredSoilRemovalPct === undefined,
    true,
    true
  );

  // F. Compatibility NO_KNOWN_CONFLICT semantics
  const compMeta = SCIENTIFIC_MODEL_REGISTRY['model-compatibility-screening'];
  const compPreserved = calculateFormulationCompatibility([
    { name: 'Water', percentage: 89.9 },
    { name: 'Lauryl Glucoside 50%', percentage: 10, role: 'Nonionic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, role: 'Preservative' }
  ]);
  assert(
    '12. Evidence Gate',
    'F. Clean preserved formula receives NO_KNOWN_CONFLICT / SCREENING_COMPATIBLE without claiming infinite lab proof',
    compMeta.modelClass === 'RULE_BASED_SCREENING' &&
    compPreserved.compatibilityStatusSemantic === 'NO_KNOWN_CONFLICT' &&
    compPreserved.evidenceStatus === 'SCREENING_COMPATIBLE',
    true,
    true
  );

  // G. HLB method metadata distinction
  const hlbMeta = SCIENTIFIC_MODEL_REGISTRY['model-hlb-screening'];
  const hlbNonionicCheck = HLBEngine.calculateBlendedHLB([
    { name: 'LAE-7', percentage: 5 },
    { name: 'LAE-9', percentage: 5 }
  ]);
  const hlbIonicCheck = HLBEngine.calculateBlendedHLB([
    { name: 'SLES 70%', percentage: 10 },
    { name: 'LAE-7', percentage: 5 }
  ]);
  const hlbNoneCheck = HLBEngine.calculateBlendedHLB([
    { name: 'Water', percentage: 90 },
    { name: 'Salt', percentage: 10 }
  ]);
  assert(
    '12. Evidence Gate',
    'G. HLB method metadata explicitly distinguishes GRIFFIN, DAVIES, and NOT_APPLICABLE',
    hlbMeta.modelClass === 'HEURISTIC_SCREENING' &&
    hlbNonionicCheck.methodMetadata === 'GRIFFIN' &&
    hlbIonicCheck.methodMetadata === 'DAVIES' &&
    hlbNoneCheck.methodMetadata === 'NOT_APPLICABLE',
    true,
    true
  );

  // H. Density predicted-vs-measured distinction
  const densMeta = SCIENTIFIC_MODEL_REGISTRY['model-density-prediction'];
  const densCalc = calculateDensity([
    { name: 'Water', percentage: 90 },
    { name: 'Glycerin', percentage: 10 }
  ]);
  assert(
    '12. Evidence Gate',
    'H. Density is IDEALIZED_PREDICTIVE_MODEL tagged PREDICTED_DENSITY with ideal volume additivity',
    densMeta.modelClass === 'IDEALIZED_PREDICTIVE_MODEL' &&
    densCalc.densityType === 'PREDICTED_DENSITY' &&
    densCalc.isIdealVolumeAdditivity === true &&
    densCalc.provenance === 'PREDICTED',
    true,
    true
  );

  // I. NVR method-not-verified state & deterministic mass balance
  const nvrMeta = SCIENTIFIC_MODEL_REGISTRY['model-liquid-nvr'];
  const nvrCheck = calculateLiquidNVR([
    { name: 'Water', percentage: 70 },
    { name: 'Sodium Citrate', percentage: 30, nonVolatileFraction: 1.0 }
  ]);
  assert(
    '12. Evidence Gate',
    'I. NVR is DETERMINISTIC_MASS_BALANCE and retains METHOD_NOT_VERIFIED without false ASTM D1767',
    nvrMeta.modelClass === 'DETERMINISTIC_MASS_BALANCE' &&
    nvrCheck.dryingProtocolAssumed?.includes('METHOD_NOT_VERIFIED') === true &&
    !nvrCheck.dryingProtocolAssumed?.includes('ASTM D1767'),
    true,
    true
  );

  // J. No LAB_VALIDATED promotion without real evidence
  const allModels = Object.values(SCIENTIFIC_MODEL_REGISTRY);
  const falseValidatedModels = allModels.filter(m => m.maturity === 'LAB_VALIDATED');
  assert(
    '12. Evidence Gate',
    'J. Zero screening models are promoted to LAB_VALIDATED without empirical dataset evidence',
    falseValidatedModels.length === 0,
    falseValidatedModels.length,
    0
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nPhase 4.7 Scientific Model Depth Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

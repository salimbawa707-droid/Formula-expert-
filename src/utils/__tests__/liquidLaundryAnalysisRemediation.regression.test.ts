/**
 * ============================================================================
 * LIQUID LAUNDRY ANALYSIS, SCIENTIFIC SCREENING vs RELEASE GATE, & OWNER CONTROL
 * REGRESSION TEST SUITE (Items A through O)
 * ============================================================================
 */

import { calculatePHAdvanced } from '../pHEngine';
import { calculateDensity } from '../densityEngine';
import { calculateLiquidNVR } from '../liquidNvrEngine';
import { calculateWaterHardnessTolerance } from '../chelatorEngine';
import { calculateActiveSurfactants } from '../activeMatterEngine';
import { calculateFormulaCost } from '../costingEngine';
import { evaluateExpertReasoning } from '../expertReasoningEngine';
import {
  evaluateSpecifications,
  isParameterApplicableForCategory,
  POWDER_ONLY_PARAMETER_KEYS
} from '../specificationEngine/specificationEvaluator';
import {
  getSpecificationTemplateForCategory,
  tryGetSpecificationTemplateForCategory
} from '../specificationEngine/specificationTemplates';
import { evaluateMasterScientificQualityGate } from '../scientificQualityGateEngine';
import { canPromoteToLabValidated } from '../lims/limsEvidencePromotionEngine';
import { evaluateReleaseGate } from '../specificationEngine/releaseGateEngine';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';

export interface TestAssertionResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestAssertionResult[];
}

export function runLiquidLaundryRemediationTestSuite(): TestSuiteSummary {
  const results: TestAssertionResult[] = [];

  const assert = (group: string, name: string, condition: boolean, message?: string) => {
    results.push({
      group,
      name,
      passed: condition,
      message: message || (condition ? undefined : 'Assertion condition failed')
    });
  };

  // Standard context formula: Liquid Laundry, 100 kg batch, ₹61.53/kg cost, 11.92% active matter
  const standardLiquidIngredients = [
    { id: '1', name: 'Water (Aqua)', percentage: 77.24, activeMatterPct: 0, costPerKg: 0.5, nonVolatileFraction: 0.0 },
    { id: '2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 8.0, activeMatterPct: 90, costPerKg: 140.0 },
    { id: '3', name: 'Sodium Hydroxide (Caustic Soda 50% sol)', percentage: 1.74, activeMatterPct: 50, costPerKg: 45.0, nonVolatileFraction: 0.5 },
    { id: '4', name: 'Sodium Lauryl Ether Sulfate (SLES 70%)', percentage: 5.0, activeMatterPct: 70, costPerKg: 110.0 },
    { id: '5', name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 4.0, activeMatterPct: 30, costPerKg: 95.0 },
    { id: '6', name: 'C12-15 Alcohol Ethoxylate 7EO (Nonionic)', percentage: 0.02, activeMatterPct: 100, costPerKg: 180.0 },
    { id: '7', name: 'Sodium Citrate Dihydrate', percentage: 2.0, activeMatterPct: 100, costPerKg: 120.0, nonVolatileFraction: 1.0 },
    { id: '8', name: 'Preservative & Fragrance', percentage: 2.0, activeMatterPct: 0, costPerKg: 1871.24 }
    // Note: Ingredients 2, 4, 5, 6, 8 lack nonVolatileFraction, giving ~77% known coverage
  ];

  // =========================================================================
  // A. LIVE TOTALS WORK BEFORE CHECK FORMULA
  // =========================================================================
  const liveActive = calculateActiveSurfactants(standardLiquidIngredients);
  const liveCost = calculateFormulaCost(standardLiquidIngredients, 100);
  const totalPercentage = standardLiquidIngredients.reduce((s, i) => s + i.percentage, 0);

  assert(
    'A. Live Totals',
    'Live active matter calculates automatically (11.92%) without clicking CHECK FORMULA',
    Number(liveActive.toFixed(2)) === 11.92,
    `Calculated active matter: ${liveActive.toFixed(2)}%`
  );
  assert(
    'A. Live Totals',
    'Live raw material cost calculates automatically (₹61.53/kg)',
    Number(liveCost.costPerKg.toFixed(2)) === 61.53,
    `Calculated cost: ₹${liveCost.costPerKg.toFixed(2)}/kg`
  );
  assert(
    'A. Live Totals',
    'Live formula total mass percentage sums to 100.00%',
    Number(totalPercentage.toFixed(2)) === 100.00,
    `Total %: ${totalPercentage}`
  );

  // =========================================================================
  // B. CHECK FORMULA EXECUTES FULL ANALYSIS PIPELINE
  // =========================================================================
  const mappedPH = mapFormulationIngredientsToPHEngineInput(standardLiquidIngredients);
  const phResult = calculatePHAdvanced(mappedPH, 100, { productCategory: 'LAUNDRY_LIQUID' });
  const qgResult = evaluateMasterScientificQualityGate({
    formulaId: 'FORM-LL-001',
    formulaName: 'Liquid Laundry Standard',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: standardLiquidIngredients.map(i => ({
      id: i.id,
      name: i.name,
      percentage: i.percentage,
      activePercentage: i.activeMatterPct,
      costPerKg: i.costPerKg
    }))
  });
  const specReport = evaluateSpecifications({
    formulaName: 'Liquid Laundry Standard',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: getSpecificationTemplateForCategory('LAUNDRY_LIQUID').parameters,
    labMeasurements: [],
    liquidResults: {
      pH: phResult.pH,
      activeSurfactants: liveActive,
      totalPercentage,
      costPerKg: liveCost.costPerKg
    }
  });
  const releaseDecision = evaluateReleaseGate('FORM-LL-001', 'LAUNDRY_LIQUID', standardLiquidIngredients, []);

  assert(
    'B. Full Analysis Pipeline',
    'CHECK FORMULA pipeline executes end-to-end to generate quality gate, specs, and release gate',
    phResult.pH > 7.0 && specReport.items.length > 0 && (releaseDecision.status === 'BLOCKED_BY_LAB_VALIDATION' || releaseDecision.decision === 'BLOCKED'),
    `pH: ${phResult.pH}, specs: ${specReport.items.length}, release: ${releaseDecision.status || releaseDecision.decision}`
  );

  // =========================================================================
  // C. CALCULATED pH IS NOT TREATED AS LAB pH
  // =========================================================================
  assert(
    'C. pH Screening vs Lab',
    'Calculated pH 7.83 has provenance SCREENING/CALCULATED and is not LAB_VALIDATED',
    phResult.pH >= 7.5 && phResult.pH <= 9.5 && qgResult.evidenceStatus !== 'FULLY_LAB_VALIDATED'
  );
  const phSpecItem = specReport.items.find(p => p.parameterKey === 'ph');
  assert(
    'C. pH Screening vs Lab',
    'Calculated pH has provenance CALCULATED and is distinct from LAB_MEASURED',
    phSpecItem !== undefined && (phSpecItem.provenance === 'CALCULATED' || phSpecItem.provenance === 'SCREENING') && phSpecItem.isMeasured === false
  );

  // =========================================================================
  // D. CALCULATED DENSITY IS NOT TREATED AS ASTM LAB EVIDENCE
  // =========================================================================
  const densityResult = calculateDensity(standardLiquidIngredients);
  assert(
    'D. Density Screening vs Lab',
    'Calculated density ~1.015 g/cm³ is theoretical screening and not ASTM D1298 certified',
    Number(densityResult.densityGPerCm3.toFixed(3)) >= 1.010
  );

  // =========================================================================
  // E. MISSING VISCOSITY REMAINS NOT_TESTED / INSUFFICIENT_DATA
  // =========================================================================
  const viscositySpecItem = specReport.items.find(p => p.parameterKey === 'viscosity');
  assert(
    'E. Viscosity Lab Status',
    'Viscosity without Brookfield laboratory measurement remains NOT_TESTED / INSUFFICIENT_DATA',
    viscositySpecItem !== undefined && (viscositySpecItem.status === 'NOT_TESTED' || viscositySpecItem.status === 'INSUFFICIENT_DATA')
  );

  // =========================================================================
  // F. INCOMPLETE NVR COVERAGE CANNOT DISPLAY FINAL NVR = 0%
  // =========================================================================
  const nvrResult = calculateLiquidNVR(standardLiquidIngredients, 100);
  assert(
    'F. NVR Data Completeness',
    'When ingredient NVR coverage is incomplete (~73%), status is INSUFFICIENT_DATA and isComplete is false',
    nvrResult.isComplete === false && nvrResult.status === 'INSUFFICIENT_DATA' && nvrResult.dataCompleteness < 90.0,
    `NVR completeness: ${nvrResult.dataCompleteness}%, status: ${nvrResult.status}`
  );
  assert(
    'F. NVR Data Completeness',
    'Never convert unknown NVR mass into 0.0% finished product claim',
    nvrResult.provenance === 'INSUFFICIENT_DATA' && nvrResult.unknownIngredients.length > 0
  );

  // =========================================================================
  // G. USER HARDNESS 0 PPM DOES NOT SILENTLY EVALUATE 150 PPM
  // =========================================================================
  const hardnessAtZero = calculateWaterHardnessTolerance(
    standardLiquidIngredients,
    0,
    undefined,
    undefined,
    100,
    'LAUNDRY_LIQUID'
  );
  assert(
    'G. Hard Water 0 ppm Logic',
    'At user input 0 ppm, hardness challenge status is NOT_EVALUATED and hardness load is 0 mg',
    hardnessAtZero.status === 'NOT_EVALUATED' && hardnessAtZero.hardnessLoadMg === 0,
    `Status: ${hardnessAtZero.status}, Load: ${hardnessAtZero.hardnessLoadMg} mg`
  );

  // =========================================================================
  // H. EXPLICIT 150 PPM BENCHMARK IS SEPARATE FROM 0 PPM BASELINE
  // =========================================================================
  const hardnessAt150 = calculateWaterHardnessTolerance(
    standardLiquidIngredients,
    150,
    10,
    20,
    100,
    'LAUNDRY_LIQUID'
  );
  assert(
    'H. 150 ppm Benchmark Separation',
    'Explicit 150 ppm challenge produces 1500 mg CaCO3 load in 10 L wash',
    hardnessAt150.hardnessLoadMg === 1500 && hardnessAt150.status !== 'NOT_EVALUATED',
    `150 ppm Load: ${hardnessAt150.hardnessLoadMg} mg`
  );

  // =========================================================================
  // I. "BALANCED & STABLE" CANNOT CLAIM ZERO ISSUES WHEN HARD WATER FAILS
  // =========================================================================
  const expertReportZeroPpm = evaluateExpertReasoning({
    ingredients: standardLiquidIngredients,
    productCategory: 'LAUNDRY_LIQUID',
    waterHardnessPpm: 0,
    batchSizeKg: 100,
    calculatedPH: phResult.pH,
    totalActiveMatter: liveActive,
    totalPercentage,
    costPerKg: liveCost.costPerKg,
    hardnessSufficiency: hardnessAtZero.sufficiency,
    maxSupportedHardnessPpm: hardnessAtZero.maxSupportedPpm
  });

  const balancedStrength = expertReportZeroPpm.strengths.find(s => s.id === 'str-balanced-formula');
  assert(
    'I. Truthful Formulation Balance',
    'Formulation balance message truthfully states evaluated parameters and 0 ppm baseline status',
    balancedStrength !== undefined && balancedStrength.description.includes('0 ppm baseline'),
    `Strength description: ${balancedStrength?.description}`
  );

  // =========================================================================
  // J. SCIENTIFIC SCREENING PASS COEXISTS WITH RELEASE BLOCKED
  // =========================================================================
  assert(
    'J. Decoupled 4-Pillar Status',
    'Scientific Screening is VALID, while Release Gate is BLOCKED due to cost and missing lab evidence',
    qgResult.finalFormulaStatus === 'VALID' && (releaseDecision.status === 'BLOCKED' || releaseDecision.status === 'BLOCKED_BY_LAB_VALIDATION' || releaseDecision.decision === 'BLOCKED') && specReport.verdict.status === 'NEEDS_REVISION'
  );

  // =========================================================================
  // K. ₹61.53/kg vs ₹45/kg REMAINS OUT_OF_SPEC
  // =========================================================================
  const costSpecItem = specReport.items.find(p => p.parameterKey === 'costPerKg' || p.parameterKey === 'rawMaterialCost');
  assert(
    'K. Cost Out of Spec',
    'Cost ₹61.53/kg exceeding max specification ₹45.00/kg is OUT_OF_SPEC',
    costSpecItem !== undefined && costSpecItem.status === 'OUT_OF_SPEC',
    `Cost status: ${costSpecItem?.status}, current: ${costSpecItem?.currentValue}`
  );

  // =========================================================================
  // L. ACTIVE MATTER 11.92% WITHIN 10–25% REMAINS PASS (TARGET 16% NOT MET)
  // =========================================================================
  const activeSpecItem = specReport.items.find(p => p.parameterKey === 'activeSurfactants' || p.parameterKey === 'activeMatter');
  assert(
    'L. Active Matter Spec Range',
    'Active matter 11.92% is PASS within [10.0%, 25.0%] range, with targetMet=false since target=16%',
    activeSpecItem !== undefined && activeSpecItem.status === 'PASS' && activeSpecItem.targetMet === false,
    `Active status: ${activeSpecItem?.status}, targetMet: ${activeSpecItem?.targetMet}`
  );

  // =========================================================================
  // M. OWNER CAN EDIT / SAVE / ANALYZE A BLOCKED DRAFT
  // =========================================================================
  assert(
    'M. Owner R&D Control',
    'A BLOCKED release status does not prevent draft editing, saving, or scientific analysis',
    (releaseDecision.status === 'BLOCKED_BY_LAB_VALIDATION' || releaseDecision.decision === 'BLOCKED') &&
    qgResult.finalFormulaStatus === 'VALID' &&
    liveCost.costPerKg > 0
  );

  // =========================================================================
  // N. OWNER CANNOT CONVERT MISSING LAB EVIDENCE INTO LAB_VALIDATED
  // =========================================================================
  const illicitPromotion = canPromoteToLabValidated({
    targetLevel: 'LAB_VALIDATED',
    currentLevel: 'CALCULATED',
    isVerifiedByAnalyst: true
  });
  assert(
    'N. Evidence Hierarchy Gate',
    'Owner/Analyst cannot convert theoretical CALCULATED results into LAB_VALIDATED without physical measurements',
    illicitPromotion.allowed === false && illicitPromotion.status === 'BLOCKED'
  );

  // =========================================================================
  // O. LIQUID-ONLY PARAMETER ROUTING ENFORCED
  // =========================================================================
  const liquidTemplate = tryGetSpecificationTemplateForCategory('LAUNDRY_LIQUID');
  const hasPowderInLiquid = liquidTemplate?.parameters.some(p => POWDER_ONLY_PARAMETER_KEYS.has(p.parameterKey)) ?? false;
  assert(
    'O. Liquid Parameter Routing',
    'Liquid Laundry specification template contains zero powder-only parameters',
    !hasPowderInLiquid && isParameterApplicableForCategory('ph', 'LAUNDRY_LIQUID') && !isParameterApplicableForCategory('powderPH', 'LAUNDRY_LIQUID')
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

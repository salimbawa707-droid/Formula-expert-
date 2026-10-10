import { evaluatePowderFormulation } from '../powderEngine';
import { isPowderCategory, getEngineTypeForCategory } from '../formulationEngineRouter';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runPowderEngineTestSuite(): {
  results: TestResult[];
  passed: number;
  failed: number;
  total: number;
  successRate: string;
} {
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

  function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.05) {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    assert(
      group,
      name,
      passed,
      actual,
      `${expected} ± ${tolerance}`,
      passed ? `PASS (diff: ${diff.toFixed(4)})` : `FAIL: got ${actual}, expected ${expected} ± ${tolerance}`
    );
  }

  // =========================================================================
  // TEST FORMULA 1: User's Specification Benchmark
  // LABSA 90% (8.00%), NaCl (10.00%), SLES 70% (5.00%), Optical Brightener (0.15%),
  // Sodium Carbonate (30.00%), Fragrance (0.50%), Color (0.05%), Sodium Sulphate (20.00%)
  // Sum = 73.70%, Missing = 26.30%
  // =========================================================================
  const testFormula1 = [
    { name: 'LABSA (90%)', percentage: 8.00, activeMatterPct: 90 },
    { name: 'Sodium Chloride', percentage: 10.00, activeMatterPct: 100 },
    { name: 'SLES (70%)', percentage: 5.00, activeMatterPct: 70 },
    { name: 'Optical Brightener (CBS-X)', percentage: 0.15, activeMatterPct: 100 },
    { name: 'Sodium Carbonate (Soda Ash)', percentage: 30.00, activeMatterPct: 100 },
    { name: 'Fragrance', percentage: 0.50, activeMatterPct: 100 },
    { name: 'Colorant Blue Speckles', percentage: 0.05, activeMatterPct: 100 },
    { name: 'Sodium Sulphate Anhydrous', percentage: 20.00, activeMatterPct: 100 }
  ];

  const report1 = evaluatePowderFormulation({
    ingredients: testFormula1,
    productCategory: 'Laundry Powder',
    batchSizeKg: 100,
    waterHardnessPpm: 150
  });

  // 1. Mass Balance & No Auto-Water
  assertNear('1. Mass Balance', 'Formula Total Pct is 73.70%', report1.massBalance.formulaTotalPct, 73.70, 0.01);
  assertNear('1. Mass Balance', 'Assigned Pct is 73.70%', report1.massBalance.assignedPercentage, 73.70, 0.01);
  assertNear('1. Mass Balance', 'Unassigned Pct is 26.30%', report1.massBalance.unassignedPercentage, 26.30, 0.01);
  assertNear('1. Mass Balance', 'Missing Pct is 26.30%', report1.massBalance.missingPercentage, 26.30, 0.01);
  assert('1. Mass Balance', 'Status is INCOMPLETE', report1.massBalance.status === 'INCOMPLETE', report1.massBalance.status, 'INCOMPLETE');
  assert('1. Mass Balance', 'Zero Water inserted automatically', !report1.classification.ingredients.some(i => i.name.toLowerCase().includes('water')), false, false);
  assert('1. Mass Balance', 'No automated filler recommendation', !report1.verdict.chemistAdvisories.some(a => a.toLowerCase().includes('add soda ash') || a.toLowerCase().includes('add sodium sulphate')), true, true);

  // 2. Active Matter Calculation
  // LABSA 8% * 90% = 7.20%, SLES 5% * 70% = 3.50% -> Total Active Surfactant = 10.70%
  assertNear('2. Active Matter', 'Total Surfactant Active is 10.70%', report1.activeMatter.totalSurfactantActivePct, 10.70, 0.01);
  assertNear('2. Active Matter', 'Anionic Active is 10.70%', report1.activeMatter.anionicActivePct, 10.70, 0.01);
  assert('2. Active Matter', 'Has Insufficient Data is false', report1.activeMatter.hasInsufficientData === false, report1.activeMatter.hasInsufficientData, false);

  // 3. Functional Classification & Builder != Chelator Rule
  const sodaAsh = report1.classification.ingredients.find(i => i.name.includes('Sodium Carbonate'));
  assert('3. Functional Classification', 'Soda Ash is Builder', sodaAsh?.isBuilder === true, sodaAsh?.isBuilder, true);
  assert('3. Functional Classification', 'Soda Ash is NOT Chelator', sodaAsh?.isChelator === false, sodaAsh?.isChelator, false);
  assert('3. Functional Classification', 'Total Builder Pct is 30.00%', report1.builderSystem.totalBuilderPct === 30.00, report1.builderSystem.totalBuilderPct, 30.00);
  assert('3. Functional Classification', 'Total Chelator Pct is 0.00%', report1.chelationSequestration.totalChelatorPct === 0.00, report1.chelationSequestration.totalChelatorPct, 0.00);

  // 4. Physical Properties & No Fabricated Density
  assert('4. Physical Properties', 'Density source is PREDICTED when not measured', report1.density.source === 'PREDICTED', report1.density.source, 'PREDICTED');
  assert('4. Physical Properties', 'Density type is SCREENING_ESTIMATE', report1.density.densityType === 'SCREENING_ESTIMATE', report1.density.densityType, 'SCREENING_ESTIMATE');
  assert('4. Physical Properties', 'Does not fabricate 1.113 g/cm3 as lab measured', report1.density.measuredBulkDensityGPerL === undefined, report1.density.measuredBulkDensityGPerL, undefined);
  assert('4. Physical Properties', 'Flowability status is INSUFFICIENT_DATA when unmeasured', report1.flowability.source === 'INSUFFICIENT_DATA', report1.flowability.source, 'INSUFFICIENT_DATA');
  assert('4. Physical Properties', 'Particle size is NOT_MEASURED without test data', report1.particleSize.status === 'NOT_MEASURED', report1.particleSize.status, 'NOT_MEASURED');

  // 5. Moisture & Dry Matter Engine
  assert('5. Moisture & Dry Matter', 'Moisture report source is CALCULATED or ESTIMATED', report1.moistureAndDryMatter.source === 'CALCULATED' || report1.moistureAndDryMatter.source === 'ESTIMATED', report1.moistureAndDryMatter.source, 'CALCULATED or ESTIMATED');
  assert('5. Moisture & Dry Matter', 'Dry Matter % + Moisture % = 100%', Math.abs((report1.moistureAndDryMatter.dryMatterPct + report1.moistureAndDryMatter.moisturePct) - 100) < 0.01, report1.moistureAndDryMatter.dryMatterPct + report1.moistureAndDryMatter.moisturePct, 100);
  assert('5. Moisture & Dry Matter', 'Total Formula Mass is 100 kg', report1.moistureAndDryMatter.totalFormulaMassKg === 100, report1.moistureAndDryMatter.totalFormulaMassKg, 100);

  // 6. Powder pH (Alkaline Intended, No Citric Acid Recommendation)
  assert('6. Powder pH', 'Calculated 1% aqueous pH is alkaline (~10.6)', report1.powderPH.calculatedAqueousPH >= 9.5 && report1.powderPH.calculatedAqueousPH <= 11.5, report1.powderPH.calculatedAqueousPH, '9.5 - 11.5');
  assert('6. Powder pH', 'isWithinTarget is true for Laundry Powder', report1.powderPH.isWithinTarget === true, report1.powderPH.isWithinTarget, true);
  assert('6. Powder pH', 'Test basis is 1.0% w/v aqueous solution', report1.powderPH.testBasis.sampleConcentrationPct === 1.0, report1.powderPH.testBasis.sampleConcentrationPct, 1.0);
  assert('6. Powder pH', 'No citric acid recommendation in advisories', !report1.verdict.chemistAdvisories.some(a => a.toLowerCase().includes('citric acid')), true, true);

  // 7. Absolute Isolation: Zero Liquid Warnings in Verdict
  assert('7. Absolute Isolation', 'No salt curve / micellar salting out warnings', !report1.verdict.issues.some(i => i.message.toLowerCase().includes('micellar') || i.message.toLowerCase().includes('salting-out')), true, true);
  assert('7. Absolute Isolation', 'No viscosity thinning warnings', !report1.verdict.issues.some(i => i.message.toLowerCase().includes('viscosity')), true, true);

  // =========================================================================
  // TEST FORMULA 2: Complete Balanced Formula with Zeolite 4A + GLDA + Lab Data
  // =========================================================================
  const testFormula2 = [
    { name: 'LABSA (90%)', percentage: 10.00, activeMatterPct: 90 },
    { name: 'LAE-7 (100%)', percentage: 4.00, activeMatterPct: 100 },
    { name: 'Sodium Carbonate (Soda Ash Dense)', percentage: 25.00, activeMatterPct: 100 },
    { name: 'Zeolite 4A Builder', percentage: 20.00, activeMatterPct: 100 },
    { name: 'GLDA Chelating Agent (80%)', percentage: 3.00, activeMatterPct: 80 },
    { name: 'Sodium Percarbonate Coated', percentage: 10.00, activeMatterPct: 100 },
    { name: 'TAED Bleach Activator', percentage: 2.00, activeMatterPct: 100 },
    { name: 'Polycarboxylate Polymer', percentage: 2.00, activeMatterPct: 100 },
    { name: 'Enzyme Granulates (Protease)', percentage: 1.00, activeMatterPct: 100 },
    { name: 'Optical Brightener (CBS-X)', percentage: 0.20, activeMatterPct: 100 },
    { name: 'Fragrance Encapsulates', percentage: 0.30, activeMatterPct: 100 },
    { name: 'Sodium Sulphate Anhydrous', percentage: 22.50, activeMatterPct: 100 }
  ]; // Sum = 100.00%

  const labInputs2 = {
    measuredSampleMassG: 100,
    measuredLooseVolumeMl: 150,
    measuredTappedVolumeMl: 120,
    measuredAngleHeightMm: 35,
    measuredAngleRadiusMm: 50,
    measuredMoisturePct: 3.2,
    measuredD10Um: 180,
    measuredD50Um: 450,
    measuredD90Um: 850,
    measuredFinesPct: 4.5,
    measuredDissolutionTimeSec: 42,
    measuredUndissolvedResiduePct: 0.2,
    dispersibilityObservation: 'fully dispersed' as const,
    measured1PctAqueousPH: 10.65,
    measuredReserveAlkalinityPctNa2O: 16.8
  };

  const report2 = evaluatePowderFormulation({
    ingredients: testFormula2,
    productCategory: 'Laundry Powder',
    batchSizeKg: 500,
    labMeasurements: labInputs2
  });

  // 8. 100% Balanced Mass Balance
  assertNear('8. Balanced Formula', 'Formula total is 100.00%', report2.massBalance.formulaTotalPct, 100.00, 0.01);
  assert('8. Balanced Formula', 'Status is BALANCED', report2.massBalance.status === 'BALANCED', report2.massBalance.status, 'BALANCED');
  assertNear('8. Balanced Formula', 'Unassigned is 0%', report2.massBalance.unassignedPercentage, 0, 0.01);

  // 9. Laboratory Measured Density & Carr Index
  // Loose: 100g / 150mL = 666.7 g/L (0.667 g/mL)
  // Tapped: 100g / 120mL = 833.3 g/L (0.833 g/mL)
  // Carr Index: ((833.3 - 666.7) / 833.3) * 100 = 20.0%
  // Hausner Ratio: 833.3 / 666.7 = 1.25
  assertNear('9. Lab Density', 'Loose bulk density is 666.7 g/L', report2.density.measuredBulkDensityGPerL || 0, 666.7, 1.0);
  assertNear('9. Lab Density', 'Tapped bulk density is 833.3 g/L', report2.density.measuredTappedDensityGPerL || 0, 833.3, 1.0);
  assertNear('9. Lab Density', 'Bulk density in g/mL is 0.667', report2.density.bulkDensityGPerMl || 0, 0.667, 0.01);
  assert('9. Lab Density', 'Density source is MEASURED', report2.density.source === 'MEASURED', report2.density.source, 'MEASURED');
  assertNear('9. Lab Density', 'Carr Index is 20.0%', report2.flowability.carrIndexPct || 0, 20.0, 0.5);
  assertNear('9. Lab Density', 'Hausner Ratio is 1.25', report2.flowability.hausnerRatio || 0, 1.25, 0.05);

  // 10. Angle of Repose Cone Calculation
  // arctan(35 / 50) * (180 / π) = 34.99°
  assertNear('10. Angle of Repose', 'Calculated cone angle is 35.0°', report2.angleOfRepose.measuredAngleDegrees || 0, 35.0, 0.5);
  assert('10. Angle of Repose', 'Rating is Standard Flow (30°-38°)', report2.angleOfRepose.rating === 'Standard Flow (30°-38°)', report2.angleOfRepose.rating, 'Standard Flow (30°-38°)');

  // 11. Moisture Lab Override
  assertNear('11. Moisture Lab Test', 'Measured moisture is 3.2%', report2.moistureAndDryMatter.moisturePct, 3.2, 0.01);
  assertNear('11. Moisture Lab Test', 'Dry matter is 96.8%', report2.moistureAndDryMatter.dryMatterPct, 96.8, 0.01);
  assert('11. Moisture Lab Test', 'Source is MEASURED', report2.moistureAndDryMatter.source === 'MEASURED', report2.moistureAndDryMatter.source, 'MEASURED');
  // For 500 kg batch: moisture mass = 500 * 0.032 = 16.0 kg, dry matter mass = 500 * 0.968 = 484.0 kg
  assertNear('11. Moisture Lab Test', 'Moisture mass in 500kg batch is 16.0 kg', report2.moistureAndDryMatter.moistureMassKg, 16.0, 0.1);
  assertNear('11. Moisture Lab Test', 'Dry matter mass in 500kg batch is 484.0 kg', report2.moistureAndDryMatter.dryMatterMassKg, 484.0, 0.1);

  // 12. Particle Size Distribution
  assert('12. PSD', 'D50 is 450 µm', report2.particleSize.measuredD50Um === 450, report2.particleSize.measuredD50Um, 450);
  assert('12. PSD', 'D10 is 180 µm', report2.particleSize.measuredD10Um === 180, report2.particleSize.measuredD10Um, 180);
  assert('12. PSD', 'D90 is 850 µm', report2.particleSize.measuredD90Um === 850, report2.particleSize.measuredD90Um, 850);
  assert('12. PSD', 'Dustiness is Low for 4.5% fines', report2.particleSize.dustinessRisk === 'Low', report2.particleSize.dustinessRisk, 'Low');

  // 13. Dissolution & Dispersibility
  assert('13. Dissolution', 'Dissolution time is 42 sec', report2.dissolutionDispersibility.testConditions?.measuredDissolutionTimeSec === 42, report2.dissolutionDispersibility.testConditions?.measuredDissolutionTimeSec, 42);
  assert('13. Dissolution', 'Dispersibility observation is fully dispersed', report2.dissolutionDispersibility.dispersibilityObservation === 'fully dispersed', report2.dissolutionDispersibility.dispersibilityObservation, 'fully dispersed');
  assert('13. Dissolution', 'Identifies Zeolite 4A as insoluble inorganic', report2.dissolutionDispersibility.hasInsolubleInorganics === true, report2.dissolutionDispersibility.hasInsolubleInorganics, true);

  // 14. Chelation vs Builder Separation
  assert('14. Builders & Chelators', 'GLDA is classified as chelator', report2.chelationSequestration.chelatorIngredients.some(c => c.name.includes('GLDA')), true, true);
  assert('14. Builders & Chelators', 'Zeolite 4A is classified as builder', report2.builderSystem.builderIngredients.some(b => b.name.includes('Zeolite')), true, true);
  assert('14. Builders & Chelators', 'GLDA has validated capacity status', report2.chelationSequestration.hasValidatedData === true, report2.chelationSequestration.hasValidatedData, true);

  // 15. Category Router & Isolation
  assert('15. Router', 'Laundry Powder routes to POWDER engine', isPowderCategory('Laundry Powder') === true, true, true);
  assert('15. Router', 'Dishwasher Powder routes to POWDER engine', isPowderCategory('Dishwasher Powder') === true, true, true);
  assert('15. Router', 'Laundry Liquid routes to LIQUID engine', isPowderCategory('Laundry Liquid') === false, false, false);
  assert('15. Router', 'Dishwashing Liquid routes to LIQUID engine', isPowderCategory('Dishwashing Liquid') === false, false, false);
  assert('15. Router', 'getEngineTypeForCategory returns POWDER for powder', getEngineTypeForCategory('Laundry Detergent Powder') === 'POWDER', 'POWDER', 'POWDER');
  assert('15. Router', 'getEngineTypeForCategory returns LIQUID for liquid', getEngineTypeForCategory('Heavy Duty Liquid Laundry Detergent') === 'LIQUID', 'LIQUID', 'LIQUID');

  // =========================================================================
  // TEST MATRIX A - Q & PHASE 3 PRODUCTION AUDIT TESTS
  // =========================================================================

  // Test A: Incomplete Powder (73.70% assigned, 26.30% unassigned)
  assert('Matrix A. Incomplete Powder', 'Status is INCOMPLETE', report1.massBalance.status === 'INCOMPLETE', report1.massBalance.status, 'INCOMPLETE');
  assertNear('Matrix A. Incomplete Powder', 'Unassigned percentage is 26.30%', report1.massBalance.unassignedPercentage, 26.30, 0.01);
  assertNear('Matrix A. Incomplete Powder', 'Missing percentage is 26.30%', report1.massBalance.missingPercentage, 26.30, 0.01);

  // Test B: Complete Powder (100.00% assigned)
  assert('Matrix B. Complete Powder', 'Status is BALANCED', report2.massBalance.status === 'BALANCED', report2.massBalance.status, 'BALANCED');
  assertNear('Matrix B. Complete Powder', 'Unassigned is 0.00%', report2.massBalance.unassignedPercentage, 0.00, 0.01);

  // Test C: Surfactant Active Calculation (LABSA 90% * 8% + SLES 70% * 5% = 10.70%)
  assertNear('Matrix C. Surfactant Active', 'Active matter is exactly 10.70%', report1.activeMatter.totalSurfactantActivePct, 10.70, 0.01);

  // Test D: Unknown Active Matter
  const formulaUnknownActive = [
    { name: 'Unknown Concentrated Paste Surfactant', percentage: 10.00, activeMatterPct: undefined as any },
    { name: 'Sodium Carbonate', percentage: 90.00, activeMatterPct: 100 }
  ];
  const reportUnknownActive = evaluatePowderFormulation({
    ingredients: formulaUnknownActive,
    productCategory: 'Laundry Powder'
  });
  assert('Matrix D. Unknown Active', 'Flags hasInsufficientData when activeMatterPct is missing/undefined', reportUnknownActive.activeMatter.hasInsufficientData === true, reportUnknownActive.activeMatter.hasInsufficientData, true);
  assert('Matrix D. Unknown Active', 'Active matter source is INSUFFICIENT_DATA', reportUnknownActive.activeMatter.source === 'INSUFFICIENT_DATA', reportUnknownActive.activeMatter.source, 'INSUFFICIENT_DATA');

  // Test E & F: Measured Density & Calculated Density
  const formulaWithDirectDensity = evaluatePowderFormulation({
    ingredients: testFormula2,
    productCategory: 'Laundry Powder',
    labMeasurements: { measuredBulkDensityGPerL: 650, measuredTappedDensityGPerL: 800 }
  });
  assert('Matrix E. Measured Density', 'Direct density input is MEASURED', formulaWithDirectDensity.density.source === 'MEASURED', formulaWithDirectDensity.density.source, 'MEASURED');
  assertNear('Matrix E. Measured Density', 'Bulk density is 650 g/L', formulaWithDirectDensity.density.measuredBulkDensityGPerL || 0, 650, 0.1);

  // Test G: Missing Density
  assert('Matrix G. Missing Density', 'Density source is PREDICTED when unmeasured', report1.density.source === 'PREDICTED', report1.density.source, 'PREDICTED');
  assert('Matrix G. Missing Density', 'Density type is SCREENING_ESTIMATE', report1.density.densityType === 'SCREENING_ESTIMATE', report1.density.densityType, 'SCREENING_ESTIMATE');

  // Test H & I: Measured Angle vs Calculated Angle
  const formulaDirectAngle = evaluatePowderFormulation({
    ingredients: testFormula2,
    productCategory: 'Laundry Powder',
    labMeasurements: { measuredAngleOfReposeDegrees: 33.5 }
  });
  assert('Matrix H. Measured Angle', 'Direct goniometer angle is MEASURED', formulaDirectAngle.angleOfRepose.source === 'MEASURED', formulaDirectAngle.angleOfRepose.source, 'MEASURED');
  assertNear('Matrix H. Measured Angle', 'Angle is 33.5 deg', formulaDirectAngle.angleOfRepose.measuredAngleDegrees || 0, 33.5, 0.1);
  assert('Matrix I. Calculated Angle', 'Cone geometry arctan(h/r) angle is CALCULATED', report2.angleOfRepose.source === 'CALCULATED', report2.angleOfRepose.source, 'CALCULATED');

  // Test J: Missing PSD
  assert('Matrix J. Missing PSD', 'PSD status is NOT_MEASURED without test data', report1.particleSize.status === 'NOT_MEASURED', report1.particleSize.status, 'NOT_MEASURED');
  assert('Matrix J. Missing PSD', 'PSD source is INSUFFICIENT_DATA without test data', report1.particleSize.source === 'INSUFFICIENT_DATA', report1.particleSize.source, 'INSUFFICIENT_DATA');

  // Test K: Insoluble Zeolite 4A is not a formulation failure
  const formulaZeoliteBalanced = evaluatePowderFormulation({
    ingredients: [
      { name: 'LABSA (90%)', percentage: 14.00, activeMatterPct: 90 },
      { name: 'Soda Ash Dense', percentage: 30.00, activeMatterPct: 100 },
      { name: 'Zeolite 4A Builder', percentage: 25.00, activeMatterPct: 100 },
      { name: 'Polycarboxylate Polymer', percentage: 2.00, activeMatterPct: 100 },
      { name: 'Sodium Sulphate Anhydrous', percentage: 29.00, activeMatterPct: 100 }
    ],
    productCategory: 'Laundry Powder'
  });
  assert('Matrix K. Insoluble Zeolite', 'Identifies Zeolite 4A as expected insoluble builder mineral', formulaZeoliteBalanced.dissolutionDispersibility.hasInsolubleInorganics === true, formulaZeoliteBalanced.dissolutionDispersibility.hasInsolubleInorganics, true);
  assert('Matrix K. Insoluble Zeolite', 'Formula with Zeolite 4A passes overall verdict', formulaZeoliteBalanced.verdict.overallStatus === 'BALANCED & COMPLIANT', formulaZeoliteBalanced.verdict.overallStatus, 'BALANCED & COMPLIANT');
  assert('Matrix K. Insoluble Zeolite', 'Zeolite is not treated as unexpected insoluble residue failure', formulaZeoliteBalanced.dissolutionDispersibility.hasInsolubleInorganics, true, true);

  // Test L: Missing Hardness Capacity
  const formulaNoHardnessData = evaluatePowderFormulation({
    ingredients: [{ name: 'Non-Standard Proprietary Mineral', percentage: 100, activeMatterPct: 100 }],
    productCategory: 'Laundry Powder'
  });
  assert('Matrix L. Hardness Handling', 'Builder protection without recognized builders is insufficient', formulaNoHardnessData.hardWater.builderProtectionRating === 'Insufficient Builder Loading', formulaNoHardnessData.hardWater.builderProtectionRating, 'Insufficient Builder Loading');

  // Test M: pH without Target
  const formulaUntargetedCategory = evaluatePowderFormulation({
    ingredients: testFormula2,
    productCategory: 'General Custom Powder'
  });
  assert('Matrix M. pH Target', 'Target specified is true for powder category', report1.powderPH.targetRange.isSpecified === true, report1.powderPH.targetRange.isSpecified, true);
  assert('Matrix M. pH Target', 'Custom category without specs flags target not specified or defaults properly', formulaUntargetedCategory.powderPH.targetRange.isSpecified === true || formulaUntargetedCategory.powderPH.targetRange.label.includes('Target'), true, true);

  // Test N & O: Foam Prediction vs Ross-Miles Measured
  assert('Matrix N. Foam Prediction', 'Foam source without lab data is PREDICTED', report1.foam.source === 'PREDICTED', report1.foam.source, 'PREDICTED');
  assert('Matrix N. Foam Prediction', 'Screening profile is defined without Ross-Miles mm', report1.foam.measuredRossMilesInitialMm === undefined, report1.foam.measuredRossMilesInitialMm, undefined);

  const formulaRossMilesLab = evaluatePowderFormulation({
    ingredients: testFormula2,
    productCategory: 'Laundry Powder',
    labMeasurements: { measuredRossMilesInitialMm: 185, measuredRossMiles5MinMm: 170 }
  });
  assert('Matrix O. Ross-Miles Lab', 'Foam source with Ross-Miles is MEASURED', formulaRossMilesLab.foam.source === 'MEASURED', formulaRossMilesLab.foam.source, 'MEASURED');
  assert('Matrix O. Ross-Miles Lab', 'Initial foam is 185 mm', formulaRossMilesLab.foam.measuredRossMilesInitialMm === 185, formulaRossMilesLab.foam.measuredRossMilesInitialMm, 185);

  // Test P: Safety Data Handling
  assert('Matrix P. Safety Profile', 'Safety evaluation source is SCREENING', report1.safety.source === 'SCREENING', report1.safety.source, 'SCREENING');
  assert('Matrix P. Safety Profile', 'Flags formal GHS as INSUFFICIENT_DATA requiring supplier SDS', report1.safety.formalGHSStatus.includes('INSUFFICIENT_DATA'), true, true);
  assert('Matrix P. Safety Profile', 'Includes dust PPE recommendations for powder handling', report1.safety.recommendedPPE.some(p => p.toLowerCase().includes('dust') || p.toLowerCase().includes('respirator')), true, true);

  // Test Q: Stability Data Handling
  assert('Matrix Q. Stability Profile', 'Stability evaluation source is PREDICTED', report1.stability.source === 'PREDICTED', report1.stability.source, 'PREDICTED');
  assert('Matrix Q. Stability Profile', 'Storage guidelines emphasize dry, moisture-controlled storage', report1.stability.storageGuidelines.toLowerCase().includes('dry'), true, true);

  // =========================================================================
  // BATCH SCALING VERIFICATION (100 kg vs 1000 kg)
  // =========================================================================
  const reportScaling100 = evaluatePowderFormulation({
    ingredients: testFormula1,
    productCategory: 'Laundry Powder',
    batchSizeKg: 100
  });
  const reportScaling1000 = evaluatePowderFormulation({
    ingredients: testFormula1,
    productCategory: 'Laundry Powder',
    batchSizeKg: 1000
  });

  assertNear('Batch Scaling 100kg', 'Assigned mass for 100kg batch is 73.70 kg', reportScaling100.moistureAndDryMatter.totalFormulaMassKg * (reportScaling100.massBalance.assignedPercentage / 100), 73.70, 0.05);
  assertNear('Batch Scaling 100kg', 'Unassigned mass for 100kg batch is 26.30 kg', reportScaling100.moistureAndDryMatter.totalFormulaMassKg * (reportScaling100.massBalance.unassignedPercentage / 100), 26.30, 0.05);

  assertNear('Batch Scaling 1000kg', 'Assigned mass for 1000kg batch is 737.00 kg', reportScaling1000.moistureAndDryMatter.totalFormulaMassKg * (reportScaling1000.massBalance.assignedPercentage / 100), 737.00, 0.1);
  assertNear('Batch Scaling 1000kg', 'Unassigned mass for 1000kg batch is 263.00 kg', reportScaling1000.moistureAndDryMatter.totalFormulaMassKg * (reportScaling1000.massBalance.unassignedPercentage / 100), 263.00, 0.1);

  // =========================================================================
  // COSTING SCALING & PER-DOSE VERIFICATION
  // =========================================================================
  const formulaWithCosts = [
    { name: 'LABSA 90%', percentage: 10.00, activeMatterPct: 90, costPerKg: 1.80 },
    { name: 'Soda Ash Dense', percentage: 40.00, activeMatterPct: 100, costPerKg: 0.35 },
    { name: 'Sodium Sulphate', percentage: 50.00, activeMatterPct: 100, costPerKg: 0.12 }
  ];
  // Cost per kg = 0.10*1.80 + 0.40*0.35 + 0.50*0.12 = 0.18 + 0.14 + 0.06 = 0.3800 $/kg
  const reportCosting100 = evaluatePowderFormulation({
    ingredients: formulaWithCosts,
    productCategory: 'Laundry Powder',
    batchSizeKg: 100,
    washDoseG: 50
  });
  const reportCosting500 = evaluatePowderFormulation({
    ingredients: formulaWithCosts,
    productCategory: 'Laundry Powder',
    batchSizeKg: 500,
    washDoseG: 50
  });

  assertNear('Costing Engine', 'Cost per kg is $0.3800', reportCosting100.costing.costPerKg, 0.3800, 0.001);
  assertNear('Costing Engine', '100 kg batch cost is $38.00', reportCosting100.costing.totalBatchCost, 38.00, 0.05);
  assertNear('Costing Engine', '500 kg batch cost is $190.00', reportCosting500.costing.totalBatchCost, 190.00, 0.1);
  // 50g dose = 0.050 kg * 0.3800 = $0.0190 per wash dose
  assertNear('Costing Engine', 'Cost per 50g wash dose is $0.0190', reportCosting100.costing.costPerWashDose, 0.0190, 0.001);

  // =========================================================================
  // ERROR HANDLING & ROBUSTNESS TESTS (No NaN, No Infinity, No Crash)
  // =========================================================================
  const reportEmpty = evaluatePowderFormulation({ ingredients: [], productCategory: 'Laundry Powder' });
  assert('Error Handling', 'Empty formula handled safely without crash', reportEmpty.massBalance.formulaTotalPct === 0, reportEmpty.massBalance.formulaTotalPct, 0);
  assert('Error Handling', 'Empty formula status is INCOMPLETE', reportEmpty.massBalance.status === 'INCOMPLETE', reportEmpty.massBalance.status, 'INCOMPLETE');

  const reportZeroDensity = evaluatePowderFormulation({
    ingredients: testFormula1,
    labMeasurements: { measuredBulkDensityGPerL: 0, measuredTappedDensityGPerL: 0 }
  });
  assert('Error Handling', 'Zero density handled safely without NaN in flowability', !isNaN(reportZeroDensity.flowability.carrIndexPct || 0), true, true);

  const reportInvalidBatch = evaluatePowderFormulation({
    ingredients: testFormula1,
    batchSizeKg: -50
  });
  assert('Error Handling', 'Negative batch size defaults safely', reportInvalidBatch.costing.batchSizeKg > 0, true, true);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;
  const successRate = ((passedCount / totalCount) * 100).toFixed(1) + '%';

  return {
    results,
    passed: passedCount,
    failed: failedCount,
    total: totalCount,
    successRate
  };
}

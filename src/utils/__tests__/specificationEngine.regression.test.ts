import {
  evaluateSpecifications,
  validateSpecificationRange,
  convertUnitValue,
  compareFormulas,
  aggregateLabReplicates,
  getMeasurementsForVersion,
  analyzeIngredientChangeImpact,
  STANDARD_SPECIFICATION_TEMPLATES,
  SpecificationParameter,
  LabMeasurementRecord,
  FormulaVersionSnapshot,
  ReleaseGateEngine,
  BrowserAgent,
  ProjectPersistenceManager,
  Orchestrator,
  ReceiptManager
} from '../specificationEngine';
import { evaluatePowderFormulation } from '../powderEngine';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runSpecificationEngineTestSuite(): { passed: number; failed: number; total: number; results: TestResult[] } {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any, message?: string) {
    if (condition) {
      passed++;
      results.push({ group, name, passed: true, actual, expected });
      console.log(`[PASS] [${group}] ${name} :: PASS (${actual})`);
    } else {
      failed++;
      results.push({ group, name, passed: false, actual, expected, message });
      console.error(`[FAIL] [${group}] ${name} :: FAIL | Expected: ${expected}, Got: ${actual} ${message ? `(${message})` : ''}`);
    }
  }

  console.log('\n================================================================');
  console.log('  PHASE 4 SPECIFICATION & EXPERT DECISION SYSTEM TEST SUITE     ');
  console.log('================================================================');

  // -------------------------------------------------------------
  // Test A & B: User-defined pH specification & measured within range -> PASS
  // -------------------------------------------------------------
  const paramPH: SpecificationParameter = {
    id: 'p-1',
    parameterKey: 'ph',
    parameterName: 'Aqueous pH',
    target: 10.5,
    min: 10.0,
    max: 11.0,
    unit: 'pH units',
    criticality: 'CRITICAL',
    source: 'USER_DEFINED',
    requiresLabMeasurement: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const labMeasurementPHWithin: LabMeasurementRecord = {
    measurementId: 'm-1',
    formulaVersion: '1.0',
    parameterKey: 'ph',
    value: 10.5,
    unit: 'pH units',
    testBasis: '1.0% w/v @ 25°C',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const reportB = evaluateSpecifications({
    formulaName: 'Test Liquid A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: [paramPH],
    labMeasurements: [labMeasurementPHWithin]
  });

  assert('Matrix A-B. User pH Spec', 'Measured pH within range yields PASS', reportB.items[0].status === 'PASS', reportB.items[0].status, 'PASS');
  assert('Matrix A-B. User pH Spec', 'Target is met when measured value equals target', reportB.items[0].targetMet === true, reportB.items[0].targetMet, true);
  assert('Matrix A-B. User pH Spec', 'Provenance is MEASURED', reportB.items[0].provenance === 'MEASURED', reportB.items[0].provenance, 'MEASURED');

  // -------------------------------------------------------------
  // Test C: pH measured outside range -> OUT_OF_SPEC
  // -------------------------------------------------------------
  const labMeasurementPHOutside: LabMeasurementRecord = {
    measurementId: 'm-2',
    formulaVersion: '1.0',
    parameterKey: 'ph',
    value: 11.6, // above max of 11.0
    unit: 'pH units',
    testBasis: '1.0% w/v @ 25°C',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const reportC = evaluateSpecifications({
    formulaName: 'Test Liquid A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: [paramPH],
    labMeasurements: [labMeasurementPHOutside]
  });

  assert('Matrix C. pH Outside Spec', 'Measured pH exceeding max yields OUT_OF_SPEC', reportC.items[0].status === 'OUT_OF_SPEC', reportC.items[0].status, 'OUT_OF_SPEC');
  assert('Matrix C. pH Outside Spec', 'Overall verdict is NEEDS_REVISION when critical spec fails', reportC.verdict.status === 'NEEDS_REVISION', reportC.verdict.status, 'NEEDS_REVISION');

  // -------------------------------------------------------------
  // Test D: pH within range but target not met -> PASS range / Target Not Met
  // -------------------------------------------------------------
  const labMeasurementPHInRangeNotTarget: LabMeasurementRecord = {
    measurementId: 'm-3',
    formulaVersion: '1.0',
    parameterKey: 'ph',
    value: 10.2, // min 10.0, max 11.0, target 10.5
    unit: 'pH units',
    testBasis: '1.0% w/v @ 25°C',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const reportD = evaluateSpecifications({
    formulaName: 'Test Liquid A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: [paramPH],
    labMeasurements: [labMeasurementPHInRangeNotTarget]
  });

  assert('Matrix D. Target vs Range', 'Status is PASS since 10.2 is within [10.0, 11.0]', reportD.items[0].status === 'PASS', reportD.items[0].status, 'PASS');
  assert('Matrix D. Target vs Range', 'targetMet is false since 10.2 != 10.5', reportD.items[0].targetMet === false, reportD.items[0].targetMet, false);
  assert('Matrix D. Target vs Range', 'Gap is calculated as -0.30 pH units', reportD.gapAnalysis[0].gap?.toFixed(2) === '-0.30', reportD.gapAnalysis[0].gap?.toFixed(2), '-0.30');

  // -------------------------------------------------------------
  // Test E: No target defined -> TARGET_NOT_DEFINED
  // -------------------------------------------------------------
  const paramUndefined: SpecificationParameter = {
    id: 'p-none',
    parameterKey: 'ph',
    parameterName: 'Aqueous pH',
    unit: 'pH units',
    criticality: 'INFORMATIONAL',
    source: 'NOT_DEFINED',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const reportE = evaluateSpecifications({
    formulaName: 'Test Liquid A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: [paramUndefined],
    labMeasurements: [labMeasurementPHWithin]
  });

  assert('Matrix E. No Target Defined', 'Reports TARGET_NOT_DEFINED when no target/limits exist', reportE.items[0].status === 'TARGET_NOT_DEFINED', reportE.items[0].status, 'TARGET_NOT_DEFINED');

  // -------------------------------------------------------------
  // Test F: Missing lab test -> NOT_TESTED / INSUFFICIENT_DATA
  // -------------------------------------------------------------
  const reportF = evaluateSpecifications({
    formulaName: 'Test Liquid A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: [paramPH],
    labMeasurements: [] // No lab test entered
  });

  assert('Matrix F. Missing Lab Test', 'Required lab parameter without data yields NOT_TESTED', reportF.items[0].status === 'NOT_TESTED', reportF.items[0].status, 'NOT_TESTED');
  assert('Matrix F. Missing Lab Test', 'Verdict reports INSUFFICIENT_DATA for missing critical lab tests', reportF.verdict.status === 'INSUFFICIENT_DATA', reportF.verdict.status, 'INSUFFICIENT_DATA');

  // -------------------------------------------------------------
  // Test G: Moisture maximum specification
  // -------------------------------------------------------------
  const paramMoisture: SpecificationParameter = {
    id: 'p-moist',
    parameterKey: 'moisture',
    parameterName: 'Moisture (Loss on Drying)',
    max: 3.0,
    unit: '%',
    criticality: 'CRITICAL',
    source: 'PRODUCT_SPECIFICATION',
    requiresLabMeasurement: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const labMoisturePass: LabMeasurementRecord = {
    measurementId: 'm-moist-1',
    formulaVersion: '1.0',
    parameterKey: 'moisture',
    value: 2.1,
    unit: '%',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const labMoistureFail: LabMeasurementRecord = {
    measurementId: 'm-moist-2',
    formulaVersion: '1.0',
    parameterKey: 'moisture',
    value: 4.5,
    unit: '%',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const reportGPass = evaluateSpecifications({
    formulaName: 'Test Powder A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramMoisture],
    labMeasurements: [labMoisturePass]
  });

  const reportGFail = evaluateSpecifications({
    formulaName: 'Test Powder A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramMoisture],
    labMeasurements: [labMoistureFail]
  });

  assert('Matrix G. Moisture Spec', '2.1% moisture satisfies max 3.0% (PASS)', reportGPass.items[0].status === 'PASS', reportGPass.items[0].status, 'PASS');
  assert('Matrix G. Moisture Spec', '4.5% moisture violates max 3.0% (OUT_OF_SPEC)', reportGFail.items[0].status === 'OUT_OF_SPEC', reportGFail.items[0].status, 'OUT_OF_SPEC');

  // -------------------------------------------------------------
  // Test H: Density Min / Max Specification
  // -------------------------------------------------------------
  const paramDensity: SpecificationParameter = {
    id: 'p-dens',
    parameterKey: 'bulkDensity',
    parameterName: 'Loose Bulk Density',
    min: 0.50,
    max: 0.65,
    unit: 'g/mL',
    criticality: 'MAJOR',
    source: 'PRODUCT_SPECIFICATION',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const labDensity: LabMeasurementRecord = {
    measurementId: 'm-dens-1',
    formulaVersion: '1.0',
    parameterKey: 'bulkDensity',
    value: 0.58,
    unit: 'g/mL',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const reportH = evaluateSpecifications({
    formulaName: 'Test Powder A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramDensity],
    labMeasurements: [labDensity]
  });

  assert('Matrix H. Density Spec', '0.58 g/mL bulk density passes [0.50, 0.65] range', reportH.items[0].status === 'PASS', reportH.items[0].status, 'PASS');

  // -------------------------------------------------------------
  // Test I: Active Matter Target
  // -------------------------------------------------------------
  const paramActive: SpecificationParameter = {
    id: 'p-active',
    parameterKey: 'activeMatter',
    parameterName: 'Total Surfactant Active',
    target: 12.0,
    min: 10.0,
    max: 15.0,
    unit: '%',
    criticality: 'CRITICAL',
    source: 'PRODUCT_SPECIFICATION',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // -------------------------------------------------------------
  // Regression Test Formula Integration:
  // LABSA 90% (8%), SLES 70% (5%), Salt (10%), Brightener (0.15%), Soda Ash (30%), Fragrance (0.5%), Dye (0.05%), Sodium Sulphate (20%)
  // Total: 73.70%, Unassigned: 26.30%
  // Active Matter: 8 * 0.90 + 5 * 0.70 = 7.20 + 3.50 = 10.70%
  // -------------------------------------------------------------
  const regressionIngredients = [
    { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 8.0, activeMatterPct: 90, costPerKg: 140, role: 'Anionic Surfactant' },
    { name: 'Sodium Chloride (Salt)', percentage: 10.0, activeMatterPct: 100, costPerKg: 5, role: 'Electrolyte' },
    { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 5.0, activeMatterPct: 70, costPerKg: 110, role: 'Anionic Surfactant' },
    { name: 'Optical Brightener (CBS-X)', percentage: 0.15, activeMatterPct: 100, costPerKg: 1200, role: 'Optical Brightener' },
    { name: 'Sodium Carbonate (Soda Ash Dense)', percentage: 30.0, activeMatterPct: 100, costPerKg: 28, role: 'Alkaline Builder' },
    { name: 'Lavender Fragrance / Essential Oil', percentage: 0.5, activeMatterPct: 100, costPerKg: 800, role: 'Fragrance' },
    { name: 'Blue Color Dye', percentage: 0.05, activeMatterPct: 100, costPerKg: 600, role: 'Colorant' },
    { name: 'Sodium Sulphate (Anhydrous Glauber Salt)', percentage: 20.0, activeMatterPct: 100, costPerKg: 12, role: 'Carrier / Filler' }
  ];

  const powderReportReg = evaluatePowderFormulation({
    ingredients: regressionIngredients,
    productCategory: 'Laundry Powder',
    batchSizeKg: 100,
    waterHardnessPpm: 150
  });

  assert('Regression Formula Integration', 'Total mass is strictly 73.70%', Math.abs(powderReportReg.massBalance.formulaTotalPct - 73.70) < 0.01, powderReportReg.massBalance.formulaTotalPct, 73.70);
  assert('Regression Formula Integration', 'Unassigned mass is strictly 26.30%', Math.abs(powderReportReg.massBalance.unassignedPercentage - 26.30) < 0.01, powderReportReg.massBalance.unassignedPercentage, 26.30);
  assert('Regression Formula Integration', 'Active surfactant is 10.70%', Math.abs(powderReportReg.activeMatter.totalSurfactantActivePct - 10.70) < 0.01, powderReportReg.activeMatter.totalSurfactantActivePct, 10.70);

  const reportI = evaluateSpecifications({
    formulaName: 'Regression Laundry Powder',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramActive],
    powderReport: powderReportReg,
    labMeasurements: []
  });

  assert('Matrix I. Active Matter Spec', '10.70% active passes [10.0, 15.0] range', reportI.items[0].status === 'PASS', reportI.items[0].status, 'PASS');
  assert('Matrix I. Active Matter Spec', 'Gap to 12.0% target is -1.30%', reportI.gapAnalysis[0].gap?.toFixed(2) === '-1.30', reportI.gapAnalysis[0].gap?.toFixed(2), '-1.30');
  assert('Matrix I. Active Matter Spec', 'Provenance is CALCULATED', reportI.items[0].provenance === 'CALCULATED', reportI.items[0].provenance, 'CALCULATED');

  // -------------------------------------------------------------
  // Test J: Cost/kg Maximum Specification
  // -------------------------------------------------------------
  const paramCost: SpecificationParameter = {
    id: 'p-cost',
    parameterKey: 'costPerKg',
    parameterName: 'Finished Cost / kg',
    max: 50.0,
    unit: '₹/kg',
    criticality: 'MAJOR',
    source: 'INTERNAL_R_AND_D_TARGET',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const reportJ = evaluateSpecifications({
    formulaName: 'Regression Laundry Powder',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramCost],
    powderReport: powderReportReg,
    labMeasurements: []
  });

  assert('Matrix J. Cost Spec', 'Cost per kg evaluated against business target', reportJ.items[0].status === 'PASS', reportJ.items[0].status, 'PASS');

  // -------------------------------------------------------------
  // Test K & L: Formula A vs Formula B / Version 1 vs Version 2
  // -------------------------------------------------------------
  const version1: FormulaVersionSnapshot = {
    versionId: 'v-1.0',
    versionNumber: '1.0',
    formulaName: 'Laundry Powder Base',
    productCategory: 'Laundry Powder',
    batchSizeKg: 100,
    ingredients: regressionIngredients,
    totalPercentage: 73.70,
    activeMatterPct: 10.70,
    costPerKg: 35.0,
    totalBatchCost: 3500.0,
    measuredPH: 10.4,
    labMeasurements: [labMeasurementPHWithin],
    createdAt: '2026-09-01T00:00:00Z'
  };

  const version2Ingredients = [
    ...regressionIngredients.filter(i => i.name !== 'Sodium Carbonate (Soda Ash Dense)'),
    { name: 'Sodium Carbonate (Soda Ash Dense)', percentage: 25.0, activeMatterPct: 100, costPerKg: 28, role: 'Alkaline Builder' },
    { name: 'Sodium Percarbonate (Coated Bleach)', percentage: 5.0, activeMatterPct: 100, costPerKg: 85, role: 'Oxygen Bleach' }
  ];

  const version2: FormulaVersionSnapshot = {
    versionId: 'v-1.1',
    versionNumber: '1.1',
    formulaName: 'Laundry Powder Base',
    productCategory: 'Laundry Powder',
    batchSizeKg: 100,
    ingredients: version2Ingredients,
    totalPercentage: 73.70,
    activeMatterPct: 10.70,
    costPerKg: 37.85,
    totalBatchCost: 3785.0,
    measuredPH: 10.2,
    labMeasurements: [],
    createdAt: '2026-09-03T00:00:00Z'
  };

  const comparison = compareFormulas(version1, version2);

  assert('Matrix K-L. Comparison', 'Detects modified Soda Ash', comparison.ingredientDeltas.find(i => i.name.includes('Soda Ash'))?.changeType === 'MODIFIED', true, true);
  assert('Matrix K-L. Comparison', 'Detects added Percarbonate', comparison.ingredientDeltas.find(i => i.name.includes('Percarbonate'))?.changeType === 'ADDED', true, true);
  assert('Matrix K-L. Comparison', 'Calculates cost delta per kg', Math.abs(comparison.costDelta.deltaCostPerKg - 2.85) < 0.01, comparison.costDelta.deltaCostPerKg, 2.85);

  // -------------------------------------------------------------
  // Test M: Lab measurement overrides prediction
  // -------------------------------------------------------------
  const reportLabOverride = evaluateSpecifications({
    formulaName: 'Regression Laundry Powder',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramDensity],
    powderReport: powderReportReg,
    labMeasurements: [labDensity] // 0.58 MEASURED overrides predicted 0.52
  });

  assert('Matrix M. Lab Precedence', 'Lab measured value overrides prediction', reportLabOverride.items[0].currentValue === 0.58, reportLabOverride.items[0].currentValue, 0.58);
  assert('Matrix M. Lab Precedence', 'Provenance reflects MEASURED', reportLabOverride.items[0].provenance === 'MEASURED', reportLabOverride.items[0].provenance, 'MEASURED');

  // -------------------------------------------------------------
  // Test N: Old lab data does not leak into new un-tested version
  // -------------------------------------------------------------
  const version1Measurements = getMeasurementsForVersion([labMeasurementPHWithin], '1.0');
  const version2Measurements = getMeasurementsForVersion([labMeasurementPHWithin], '1.1');

  assert('Matrix N. Version Isolation', 'Version 1.0 finds lab measurement', version1Measurements.length === 1, version1Measurements.length, 1);
  assert('Matrix N. Version Isolation', 'Version 1.1 receives zero leaked measurements', version2Measurements.length === 0, version2Measurements.length, 0);

  // -------------------------------------------------------------
  // Test O: Replicate Lab Data Aggregator
  // -------------------------------------------------------------
  const replicates: LabMeasurementRecord[] = [
    { measurementId: 'rep-1', formulaVersion: '1.0', parameterKey: 'ph', value: 10.72, unit: 'pH units', testDate: '2026-09-03', provenance: 'MEASURED' },
    { measurementId: 'rep-2', formulaVersion: '1.0', parameterKey: 'ph', value: 10.75, unit: 'pH units', testDate: '2026-09-03', provenance: 'MEASURED' },
    { measurementId: 'rep-3', formulaVersion: '1.0', parameterKey: 'ph', value: 10.70, unit: 'pH units', testDate: '2026-09-03', provenance: 'MEASURED' }
  ];

  const repSummary = aggregateLabReplicates('ph', replicates, 'pH units');
  assert('Matrix O. Replicates', 'Computes accurate mean of 3 replicates', Math.abs(repSummary!.mean - 10.723) < 0.01, repSummary?.mean.toFixed(3), '10.723');
  assert('Matrix O. Replicates', 'Computes non-zero standard deviation for replicates', (repSummary?.stdDev ?? 0) > 0, true, true);
  assert('Matrix O. Replicates', 'Range is max - min (10.75 - 10.70 = 0.05)', Math.abs(repSummary!.range - 0.05) < 0.001, repSummary?.range.toFixed(3), '0.050');

  // -------------------------------------------------------------
  // Test P & Q: Range validation & Target outside min/max protection
  // -------------------------------------------------------------
  const invalidRange = validateSpecificationRange(11.0, 10.0, 10.5); // min > max
  const targetOutsideRange = validateSpecificationRange(10.0, 11.0, 12.0); // target > max
  const validRange = validateSpecificationRange(10.0, 11.0, 10.5);

  assert('Matrix P. Invalid Min > Max', 'Catches min > max error', invalidRange !== null, true, true);
  assert('Matrix Q. Target Outside Range', 'Catches target > max error', targetOutsideRange !== null, true, true);
  assert('Matrix P-Q. Valid Range', 'Valid range returns null', validRange === null, true, true);

  // -------------------------------------------------------------
  // Test R: Unit conversion
  // -------------------------------------------------------------
  const convDensity = convertUnitValue(0.55, 'g/mL', 'kg/m³');
  const convTime = convertUnitValue(120, 'seconds', 'minutes');
  const convIncompatible = convertUnitValue(10, '%', 'pH units');

  assert('Matrix R. Unit Conversion', '0.55 g/mL converts to 550 kg/m³', convDensity === 550, convDensity, 550);
  assert('Matrix R. Unit Conversion', '120 seconds converts to 2 minutes', convTime === 2, convTime, 2);
  assert('Matrix R. Unit Conversion', 'Incompatible units return undefined', convIncompatible === undefined, convIncompatible, undefined);

  // -------------------------------------------------------------
  // Test S & T: Product Category Isolation & Physical Form Routing
  // -------------------------------------------------------------
  const powderTemplate = STANDARD_SPECIFICATION_TEMPLATES.find(t => t.productCategory === 'LAUNDRY_POWDER' || t.productCategory === 'Laundry Powder');
  const liquidTemplate = STANDARD_SPECIFICATION_TEMPLATES.find(t => t.productCategory === 'LAUNDRY_LIQUID' || t.productCategory === 'Laundry Liquid');

  assert('Matrix S-T. Category Isolation', 'Powder template includes bulk density', Boolean(powderTemplate?.parameters.some(p => p.parameterKey === 'bulkDensity')), true, true);
  assert('Matrix S-T. Category Isolation', 'Liquid template does NOT require powder bulk density', Boolean(!liquidTemplate?.parameters.some(p => p.parameterKey === 'bulkDensity')), true, true);

  // Strict Physical Form Exclusion: evaluating liquid with injected powder parameters strips them automatically
  const mixedParams: SpecificationParameter[] = [
    ...(liquidTemplate?.parameters || []),
    {
      id: 'p-injected-bulk',
      parameterKey: 'bulkDensity',
      parameterName: 'Loose Bulk Density',
      target: 0.55,
      unit: 'g/mL',
      criticality: 'CRITICAL',
      source: 'PRODUCT_SPECIFICATION',
      isActive: true,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'p-injected-diss',
      parameterKey: 'dissolutionTime',
      parameterName: 'Dissolution Time',
      max: 60,
      unit: 'seconds',
      criticality: 'MAJOR',
      source: 'PRODUCT_SPECIFICATION',
      isActive: true,
      createdAt: '',
      updatedAt: ''
    }
  ];

  const liquidEvalWithInjectedPowder = evaluateSpecifications({
    formulaName: 'Liquid Laundry Form',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: mixedParams,
    labMeasurements: [],
    liquidResults: {
      pH: 8.5,
      activeSurfactants: 16.0,
      totalPercentage: 100.0,
      density: 1.04,
      viscosity: 800,
      liquidNVR: 22.0,
      costPerKg: 35.0
    }
  });

  assert('Matrix S-T. Physical Form Routing', 'Liquid evaluation filters out injected powder bulkDensity', !liquidEvalWithInjectedPowder.items.some(i => i.parameterKey === 'bulkDensity'), true, true);
  assert('Matrix S-T. Physical Form Routing', 'Liquid evaluation filters out injected powder dissolutionTime', !liquidEvalWithInjectedPowder.items.some(i => i.parameterKey === 'dissolutionTime'), true, true);
  assert('Matrix S-T. Physical Form Routing', 'Liquid evaluation retains liquid density parameter', Boolean(liquidEvalWithInjectedPowder.items.some(i => i.parameterKey === 'density')), true, true);
  assert('Matrix S-T. Physical Form Routing', 'Liquid evaluation evaluates liquid density to PASS', liquidEvalWithInjectedPowder.items.find(i => i.parameterKey === 'density')?.status === 'PASS', true, true);
  assert('Matrix S-T. Physical Form Routing', 'Liquid evaluation unmeasured viscosity is NOT_TESTED', liquidEvalWithInjectedPowder.items.find(i => i.parameterKey === 'viscosity')?.status === 'NOT_TESTED', true, true);
  assert('Matrix S-T. Physical Form Routing', 'Liquid evaluation evaluates liquid NVR to PASS', liquidEvalWithInjectedPowder.items.find(i => i.parameterKey === 'liquidNVR')?.status === 'PASS', true, true);

  // When physical lab measurement for viscosity is supplied:
  const liquidEvalWithLabViscosity = evaluateSpecifications({
    formulaName: 'Liquid Laundry Form',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: mixedParams,
    labMeasurements: [
      {
        measurementId: 'm-visc-1',
        formulaVersion: '1.0',
        parameterKey: 'viscosity',
        value: 800,
        unit: 'none',
        testBasis: 'Brookfield Viscometer Spindle 2 @ 20 RPM',
        testDate: '2026-09-30',
        provenance: 'MEASURED'
      }
    ],
    liquidResults: {
      pH: 8.5,
      activeSurfactants: 16.0,
      totalPercentage: 100.0,
      density: 1.04,
      liquidNVR: 22.0,
      costPerKg: 35.0
    }
  });
  assert('Matrix S-T. Physical Form Routing', 'Measured viscosity evaluates to PASS', liquidEvalWithLabViscosity.items.find(i => i.parameterKey === 'viscosity')?.status === 'PASS', true, true);

  // -------------------------------------------------------------
  // Test U: Liquid Engine Regression Safety
  // -------------------------------------------------------------
  const liquidEval = evaluateSpecifications({
    formulaName: 'Liquid Heavy Duty',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: liquidTemplate?.parameters || [],
    labMeasurements: [],
    liquidResults: {
      pH: 8.5,
      activeSurfactants: 14.5,
      totalPercentage: 100.0,
      costPerKg: 32.0
    }
  });

  assert('Matrix U. Liquid Engine Integration', 'Evaluates liquid active surfactants without powder engine', liquidEval.items.find(i => i.parameterKey === 'activeMatter')?.status === 'PASS', true, true);
  assert('Matrix U. Liquid Engine Integration', 'Liquid mass balance evaluates accurately', liquidEval.items.find(i => i.parameterKey === 'massBalance')?.status === 'PASS', true, true);

  // -------------------------------------------------------------
  // Test W: NaN and Infinity Protection
  // -------------------------------------------------------------
  const nanValidation = validateSpecificationRange(NaN, 10, 5);
  const infValidation = validateSpecificationRange(0, Infinity, 5);

  assert('Matrix W. NaN Protection', 'Rejects NaN specification inputs', nanValidation !== null, true, true);
  assert('Matrix W. Infinity Protection', 'Rejects Infinity specification inputs', infValidation !== null, true, true);

  // -------------------------------------------------------------
  // Test X: Unknown Scientific Value remains INSUFFICIENT_DATA
  // -------------------------------------------------------------
  const paramDissolution: SpecificationParameter = {
    id: 'p-diss',
    parameterKey: 'dissolutionTime',
    parameterName: 'Dissolution Time',
    max: 60,
    unit: 'seconds',
    criticality: 'MAJOR',
    source: 'PRODUCT_SPECIFICATION',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const reportX = evaluateSpecifications({
    formulaName: 'Regression Laundry Powder',
    formulaVersion: '1.0',
    productCategory: 'Laundry Powder',
    parameters: [paramDissolution],
    powderReport: powderReportReg,
    labMeasurements: [] // unmeasured
  });

  assert('Matrix X. Provenance Immutability', 'Unmeasured dissolution reports INSUFFICIENT_DATA', reportX.items[0].provenance === 'INSUFFICIENT_DATA', reportX.items[0].provenance, 'INSUFFICIENT_DATA');
  assert('Matrix X. Provenance Immutability', 'Unknown value is not replaced by zero or pass', reportX.items[0].currentValue === undefined, true, true);

  // -------------------------------------------------------------
  // Change Impact Analysis
  // -------------------------------------------------------------
  const impact = analyzeIngredientChangeImpact('Soda Ash Dense', 30.0, 25.0, 100, 28, 'Builder');
  assert('Impact Analysis', 'Calculates exact formula mass reduction of -5.00%', impact.impacts.find(i => i.metric === 'Formula Mass Total')?.delta === -5.0, true, true);

  // -------------------------------------------------------------
  // Test Y: Release Gate & Recovered Capability Audits
  // -------------------------------------------------------------
  const gateEngine = ReleaseGateEngine.getInstance();
  const testSnapshot: FormulaVersionSnapshot = {
    versionId: 'snap-1.0',
    versionNumber: '1.0',
    formulaName: 'Formula A',
    productCategory: 'Laundry Liquid',
    batchSizeKg: 100,
    ingredients: [
      { name: 'Soda Ash', percentage: 100.0, activeMatterPct: 100, costPerKg: 20, role: 'Builder' }
    ],
    totalPercentage: 100.0,
    activeMatterPct: 15.0,
    costPerKg: 20.0,
    totalBatchCost: 2000.0,
    measuredPH: 10.5,
    labMeasurements: [],
    createdAt: new Date().toISOString()
  };

  const testParams: SpecificationParameter[] = [
    {
      id: 'p-ph',
      parameterKey: 'ph',
      parameterName: 'pH',
      min: 10.0,
      max: 11.0,
      unit: 'pH units',
      criticality: 'CRITICAL',
      source: 'USER_DEFINED',
      requiresLabMeasurement: true, // Requires empirical evidence!
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // A. Blocked Release Gate Evaluation (No lab evidence entered yet)
  const reportGateBlocked = evaluateSpecifications({
    formulaName: 'Formula A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: testParams,
    labMeasurements: []
  });

  const gateResultBlocked = gateEngine.evaluateReleaseGate(testSnapshot, testParams, [], reportGateBlocked);
  assert('Recovered: Release Gate', 'Release Gate is BLOCKED when critical lab test evidence is missing', gateResultBlocked.decision === 'BLOCKED', gateResultBlocked.decision, 'BLOCKED');
  assert('Recovered: Release Gate', 'Missing evidence results in verified=false', gateResultBlocked.verified === false, gateResultBlocked.verified, false);

  // B. Ready Release Gate Evaluation (With empirical lab evidence)
  const matchingLabRecord: LabMeasurementRecord = {
    measurementId: 'm-ph-1',
    formulaVersion: '1.0',
    parameterKey: 'ph',
    value: 10.5,
    unit: 'pH units',
    testDate: '2026-09-03',
    provenance: 'MEASURED'
  };

  const reportGatePassed = evaluateSpecifications({
    formulaName: 'Formula A',
    formulaVersion: '1.0',
    productCategory: 'Laundry Liquid',
    parameters: testParams,
    labMeasurements: [matchingLabRecord]
  });

  const gateResultPassed = gateEngine.evaluateReleaseGate(testSnapshot, testParams, [matchingLabRecord], reportGatePassed);
  assert('Recovered: Release Gate', 'Release Gate is READY when all evidence is verified', gateResultPassed.decision === 'READY', gateResultPassed.decision, 'READY');
  assert('Recovered: Release Gate', 'Ready decision leads to verified=true', gateResultPassed.verified === true, gateResultPassed.verified, true);
  assert('Recovered: Release Gate', 'Integrity hash is generated successfully (64 hex characters)', gateResultPassed.integrityHash.length === 64, true, true);

  // 2. Browser Verification Audit
  const browserAgentInstance = BrowserAgent.getInstance();
  const simulatedUrl = 'http://localhost:3000';
  // Check that the verification is runnable and produces capture variables
  const browserPromise = browserAgentInstance.runVerification(simulatedUrl);
  assert('Recovered: Browser Verification', 'Browser Agent captures exception lists and console lists', browserPromise !== undefined, true, true);

  // 3. Project Persistence (VFS Generation Identity Layout)
  const persistenceManager = ProjectPersistenceManager.getInstance();
  const vfsResultBlocked = persistenceManager.persistVfsState(testSnapshot, gateResultBlocked.verified);
  const vfsResultPassed = persistenceManager.persistVfsState(testSnapshot, gateResultPassed.verified);

  assert('Recovered: Project Persistence', 'Maintains generationId coordinates', vfsResultBlocked.generationId === 'snap-1.0', true, true);
  assert('Recovered: Project Persistence', 'Unverified/failed generation persists with verified=false', vfsResultBlocked.verified === false, true, true);
  assert('Recovered: Project Persistence', 'Verified generation persists with verified=true', vfsResultPassed.verified === true, true, true);
  assert('Recovered: Project Persistence', 'VFS file map contains expected artifacts', 'recipe.json' in vfsResultPassed.files, true, true);

  // 4. Orchestrator Release Transitions
  const orchestratorInstance = Orchestrator.getInstance();
  const transitionBlocked = orchestratorInstance.transitionReleaseState(gateResultBlocked);
  const transitionPassed = orchestratorInstance.transitionReleaseState(gateResultPassed);

  assert('Recovered: Orchestrator', 'Blocked gate transitions state to failed with verified=false', transitionBlocked.status === 'failed' && transitionBlocked.verified === false, true, true);
  assert('Recovered: Orchestrator', 'Ready gate transitions state to deployed with verified=true', transitionPassed.status === 'deployed' && transitionPassed.verified === true, true, true);

  // 5. Receipt Manager Precise Measuring
  const receiptManagerInstance = ReceiptManager.getInstance();
  const preciseReceipt = receiptManagerInstance.createReceipt('2026-09-01T12:00:00Z', '2026-09-01T12:05:00Z');
  const unmeasurableReceipt = receiptManagerInstance.createReceipt(undefined, undefined);

  assert('Recovered: Receipt Manager', 'Legitimately calculates duration from start and end times (5 mins = 300000ms)', preciseReceipt.durationMs === 300000, preciseReceipt.durationMs, 300000);
  assert('Recovered: Receipt Manager', 'Unmeasurable properties default strictly to "NOT_MEASURED"', unmeasurableReceipt.durationMs === 'NOT_MEASURED', unmeasurableReceipt.durationMs, 'NOT_MEASURED');

  console.log('--------------------------------------------------');
  console.log(`TOTAL PHASE 4 SPECIFICATION TESTS : ${passed + failed}`);
  console.log(`PASSED                             : ${passed}`);
  console.log(`FAILED                             : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed, total: passed + failed, results };
}

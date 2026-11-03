/**
 * ============================================================================
 * P2-13 — REAL EMPIRICAL SCIENTIFIC VALIDATION & CALIBRATION TEST SUITE
 * ============================================================================
 * Forensic test suite verifying all 33 requirements of Phase P2-13:
 * Laboratory observations, Measurement method registry, Quality gate, Origin firewall,
 * Deterministic formula fingerprinting, Grouped dataset splitting, Leakage audit,
 * Empirical calibration, Independent validation, Sample sufficiency, LAB_VALIDATED gate,
 * Model version freezing, CSV data importer, and Report generator.
 * ============================================================================
 */

import {
  CompleteLaboratoryObservation,
  MeasurementMethodRegistry,
  validateLaboratoryObservation,
  computeDeterministicFormulaFingerprint
} from '../empiricalLabObservationModel';
import {
  DataSplittingEngine,
  SampleSufficiencyEngine,
  EmpiricalCalibrationEngine,
  ModelValidationStatusGate
} from '../empiricalCalibrationEngine';
import { EmpiricalDataImporter } from '../empiricalDataImporter';
import { HardenedEmpiricalAccuracyEngine } from '../empiricalAccuracyFramework';
import { EmpiricalValidationEvaluationEngine } from '../empiricalValidationEvaluationEngine';
import { getCategoryEmpiricalCoverage } from '../empiricalValidationEvaluationEngine';
import { EmpiricalLabPersistenceService } from '../empiricalLabPersistenceService';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export async function runP2Phase13EmpiricalValidationTestSuite(): Promise<{ total: number; passed: number; failed: number; results: TestResult[] }> {
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

  HardenedEmpiricalAccuracyEngine.resetHardenedFramework();
  ModelValidationStatusGate.resetGate();

  // 1. Measurement Method Registry
  const astmD3050 = MeasurementMethodRegistry.getMethod('ASTM-D3050');
  assert(
    'Measurement Method Registry properly pre-populates standardized methods (ASTM D3050)',
    Boolean(astmD3050 && astmD3050.standardOrganization === 'ASTM'),
    astmD3050?.standardOrganization,
    'ASTM'
  );

  // 2. Deterministic Formula Fingerprint
  const fp1 = computeDeterministicFormulaFingerprint({
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { ingredientId: 'LABSA', percentage: 15, activeMatterPct: 96 },
      { ingredientId: 'SLES', percentage: 10, activeMatterPct: 70 }
    ],
    formulaVersion: '1.0.0',
    targetPH: 8.5,
    waterHardnessPpm: 150
  });
  const fp2 = computeDeterministicFormulaFingerprint({
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { ingredientId: 'SLES', percentage: 10, activeMatterPct: 70 },
      { ingredientId: 'LABSA', percentage: 15, activeMatterPct: 96 }
    ],
    formulaVersion: '1.0.0',
    targetPH: 8.5,
    waterHardnessPpm: 150
  });
  assert(
    'Deterministic formula fingerprinting produces consistent identical hashes regardless of ingredient order',
    fp1 === fp2 && fp1.startsWith('FP-LAUN-'),
    fp1,
    fp2
  );

  // 3. Real Data Only Firewall (Negative Test)
  const syntheticObs: Partial<CompleteLaboratoryObservation> = {
    observationId: 'obs-syn-test',
    datasetId: 'ds-test',
    formulaFingerprint: fp1,
    batchId: 'B-101',
    productCategory: 'LAUNDRY_LIQUID',
    laboratoryName: 'Test-Lab',
    operator: 'Tester',
    testDate: '2026-10-05',
    testMethodId: 'ASTM-D3050',
    replicateNumber: 1,
    measuredProperty: 'Cleaning Score / CPI',
    measuredValue: 88,
    measurementUnit: 'Score',
    waterProfile: { hardnessPpm: 150 },
    temperatureC: 25,
    dosageGramsPerL: 5,
    contactTimeMin: 15,
    dataOrigin: 'SYNTHETIC_TEST_DATA'
  };
  const synQuality = validateLaboratoryObservation(syntheticObs);
  assert(
    'Real Data Only Firewall strictly REJECTS observations with origin SYNTHETIC_TEST_DATA',
    synQuality.status === 'REJECTED' && synQuality.errors.some(e => e.includes('FIREWALL REJECTION')),
    synQuality.status,
    'REJECTED'
  );

  // 4. Quality Gate for Real Laboratory Observation
  const realObs: CompleteLaboratoryObservation = {
    observationId: 'obs-real-101',
    datasetId: 'ds-cert-2027',
    formulaFingerprint: fp1,
    formulaVersionId: '1.0.0',
    batchId: 'B-CERT-101',
    productCategory: 'LAUNDRY_LIQUID',
    commercialMaterials: [{ ingredientId: 'LABSA', gradeId: 'G-96', percentage: 15, activeMatterPct: 96 }],
    waterProfile: { hardnessPpm: 150, calciumPpm: 100, magnesiumPpm: 50 },
    pH: 8.4,
    temperatureC: 25,
    dosageGramsPerL: 5,
    contactTimeMin: 15,
    testMethodId: 'ASTM-D3050',
    replicateNumber: 1,
    measuredProperty: 'Cleaning Score / CPI',
    measuredValue: 88.5,
    measurementUnit: 'Score Index',
    laboratoryName: 'Certified Intertek Lab',
    operator: 'Dr. Jane Doe',
    testDate: '2026-10-05',
    rawEvidenceRef: 'controlled-record://EV-CERT-101',
    evidenceIds: ['EV-CERT-101'],
    provenanceStatus: 'VERIFIED_PRIMARY_MEASUREMENT',
    dataQualityStatus: 'APPROVED_FOR_VALIDATION',
    dataOrigin: 'REAL_LAB_MEASUREMENT',
    auditTrail: ['Imported via Certified Portal']
  };
  const realQuality = validateLaboratoryObservation(realObs);
  assert(
    'Quality Gate successfully APPROVES valid real laboratory observations with complete provenance',
    realQuality.status === 'APPROVED_FOR_VALIDATION' && realQuality.errors.length === 0,
    realQuality.status,
    'APPROVED_FOR_VALIDATION'
  );
  const mismatchedMethod = validateLaboratoryObservation({ ...realObs, measuredProperty: 'Density' });
  assert(
    'Quality Gate rejects a known test method when its measured property does not match the record',
    mismatchedMethod.status === 'REJECTED' && mismatchedMethod.errors.some(e => e.includes('Method/property mismatch')),
    mismatchedMethod.status,
    'REJECTED'
  );
  const categoryCoverage = getCategoryEmpiricalCoverage([]);
  assert(
    'Empirical scorecard exposes all 13 categories as pending when no approved evidence exists',
    categoryCoverage.length === 13 && categoryCoverage.every(c => c.evidenceAvailableCount === 0 && c.targetStatus.every(t => t.status === 'DATA_PENDING')),
    categoryCoverage.length,
    13
  );
  const powderBulkDensity = categoryCoverage.find(c => c.category === 'LAUNDRY_POWDER')?.targetStatus.find(t => t.property === 'Bulk Density');
  const liquidLaundryPh = categoryCoverage.find(c => c.category === 'LAUNDRY_LIQUID')?.targetStatus.find(t => t.property === 'pH Prediction');
  const manualDishDensity = categoryCoverage.find(c => c.category === 'DISHWASH_MANUAL')?.targetStatus.find(t => t.property === 'Density');
  assert(
    'Category coverage distinguishes unsupported model/method gaps from targets that are technically ready for evidence',
    powderBulkDensity?.readiness === 'METHOD_AND_PREDICTION_REQUIRED' &&
      liquidLaundryPh?.readiness === 'READY' && liquidLaundryPh.protocolMethodId === 'ASTM-D1172' &&
      manualDishDensity?.readiness === 'READY',
    { powderBulkDensity: powderBulkDensity?.readiness, liquidLaundryPh: liquidLaundryPh?.readiness, method: liquidLaundryPh?.protocolMethodId, manualDishDensity: manualDishDensity?.readiness },
    { powderBulkDensity: 'METHOD_AND_PREDICTION_REQUIRED', liquidLaundryPh: 'READY', method: 'ASTM-D1172', manualDishDensity: 'READY' }
  );

  // 5. Grouped Dataset Splitting & Leakage Audit
  const obsList: CompleteLaboratoryObservation[] = [
    { ...realObs, observationId: 'obs-1', formulaFingerprint: 'FP-A', batchId: 'B-A' },
    { ...realObs, observationId: 'obs-2', formulaFingerprint: 'FP-A', batchId: 'B-A' },
    { ...realObs, observationId: 'obs-3', formulaFingerprint: 'FP-B', batchId: 'B-B' },
    { ...realObs, observationId: 'obs-4', formulaFingerprint: 'FP-C', batchId: 'B-C' }
  ];
  const splitRes = DataSplittingEngine.splitDatasetGrouped(obsList, 0.5);
  assert(
    'Grouped dataset splitting isolates formula fingerprints and passes automated leakage audit',
    splitRes.audit.passed === true && splitRes.audit.overlappingFingerprints.length === 0,
    splitRes.audit.passed,
    true
  );

  // 6. Empirical Calibration Engine Parameter Fitting
  const calRes = EmpiricalCalibrationEngine.calibrateModel('model-cleaning-cpi', [80, 85, 90], [82, 86, 91].map(v => ({ ...realObs, measuredValue: v })));
  assert(
    'Empirical Calibration Engine successfully fits slope, intercept, and definition hash from real data',
    calRes.fittedParameters.slope > 0 && Boolean(calRes.definitionHash.startsWith('HASH-')),
    calRes.fittedParameters.slope,
    '> 0'
  );

  // 7. Sample Sufficiency Engine
  const suffRes = SampleSufficiencyEngine.evaluateSufficiency([realObs], 'REGRESSION', 'LAUNDRY_LIQUID');
  assert(
    'Sample Sufficiency Engine correctly detects insufficient samples when formula/batch thresholds are not met',
    suffRes.isSufficient === false,
    suffRes.isSufficient,
    false
  );

  // 8. Model Validation Status Gate (Strict 13-condition enforcement)
  const gateResFail = ModelValidationStatusGate.evaluateLabValidatedStatusGate({
    engineImplementationAvailable: true,
    realLabDataAvailable: false, // missing real data
    completeProvenance: true,
    validMeasurementMethod: true,
    sampleSufficiencyPassed: true,
    leakageAuditPassed: true,
    calibrationCompleted: true,
    independentValidationCompleted: true,
    requiredMetricsPassed: true,
    uncertaintyEvaluated: true,
    categoryScopeDefined: true,
    limitationsDocumented: true,
    modelVersionFrozen: true,
    evidenceRecordsRetained: true
  });
  assert(
    'LAB_VALIDATED Status Gate strictly blocks LAB_VALIDATED promotion when real lab data is missing',
    gateResFail.status !== 'LAB_VALIDATED',
    gateResFail.status,
    'VALIDATION_PENDING or VALIDATED_WITH_LIMITATIONS'
  );

  // 9. CSV Laboratory Data Importer Wizard
  const csvData = `observationId,productCategory,formulaId,formulaVersion,datasetVersion,batchId,measuredProperty,measuredValue,measurementUnit,testMethodId,waterHardnessPpm,temperatureC,dosageGramsPerL,contactTimeMin,replicateNumber,testDate,ingredients,rawEvidenceRef
OBS-CSV-101,LAUNDRY_LIQUID,F-101,v1.0.0,DS-CSV-2027-v1,BATCH-101,Cleaning Score / CPI,88.5,Score Index,ASTM-D3050,150,25,5,15,1,2026-10-05,labsa:10|sles:8|water:82,controlled-record://CSV-101
OBS-CSV-102,LAUNDRY_LIQUID,F-101,v1.0.0,DS-CSV-2027-v1,BATCH-101,Cleaning Score / CPI,89.0,Score Index,ASTM-D3050,150,25,5,15,2,2026-10-05,labsa:10|sles:8|water:82,controlled-record://CSV-102`;
  const importRes = EmpiricalDataImporter.parseCsvLaboratoryData(csvData, {
    datasetId: 'DS-CSV-2027',
    datasetVersion: 'DS-CSV-2027-v1',
    formulaVersion: 'v1.0.0',
    laboratoryName: 'Certified Eurofins Lab',
    operator: 'Dr. Alan Turing',
    dataOrigin: 'REAL_LAB_MEASUREMENT',
    ingredients: [{ ingredientId: 'labsa', percentage: 10 }, { ingredientId: 'sles', percentage: 8 }, { ingredientId: 'water', percentage: 82 }]
  });
  assert(
    'CSV Laboratory Data Importer correctly parses, validates, and registers certified observations',
    importRes.approvedCount === 2 && importRes.totalParsed === 2,
    importRes.approvedCount,
    2
  );

  // 10. Validation Report Generator
  const report = ModelValidationStatusGate.generateValidationReport({
    modelId: 'model-cpi-cleaning',
    modelVersion: 'v20261005.1',
    datasetId: 'DS-CSV-2027',
    datasetVersion: '1.0.0',
    categories: ['LAUNDRY_LIQUID'],
    totalObservations: 2,
    uniqueFormulas: 1,
    uniqueBatches: 1,
    realDataAvailable: true,
    calibrationMae: 1.2,
    validationMae: 1.5,
    validationStatus: 'VALIDATED_WITH_LIMITATIONS'
  });
  assert(
    'Validation Report Generator creates structured official scientific report',
    report.includes('OFFICIAL SCIENTIFIC MODEL VALIDATION REPORT') && report.includes('VALIDATED_WITH_LIMITATIONS'),
    true,
    true
  );

  // 11. JSON Laboratory Data Importer & Duplicate / Quarantine Isolation
  const jsonPayload = JSON.stringify([
    {
      observationId: "OBS-JSON-101",
      formulaId: "FORMULA-JSON-101",
      batchId: "BATCH-301",
      productCategory: "LAUNDRY_LIQUID",
      measuredProperty: "pH Prediction",
      measuredValue: 8.45,
      measurementUnit: "pH units",
      testMethodId: "ASTM-D1172",
      waterHardnessPpm: 150,
      temperatureC: 25.0,
      dosageGramsPerL: 2.0,
      contactTimeMin: 15.0,
      replicateNumber: 1,
      testDate: "2026-10-11",
      formulaVersion: "1.0.0",
      formulaFingerprint: "FP-LAUN-JSON1"
      ,rawEvidenceRef: "controlled-record://JSON-101"
    },
    {
      observationId: "OBS-JSON-101", // Duplicate ID should be quarantined
      formulaId: "FORMULA-JSON-101",
      batchId: "BATCH-301",
      productCategory: "LAUNDRY_LIQUID",
      measuredProperty: "pH Prediction",
      measuredValue: 8.46,
      measurementUnit: "pH units",
      testMethodId: "ASTM-D1172",
      waterHardnessPpm: 150,
      temperatureC: 25.0,
      dosageGramsPerL: 2.0,
      contactTimeMin: 15.0,
      replicateNumber: 2,
      testDate: "2026-10-11",
      formulaVersion: "1.0.0",
      formulaFingerprint: "FP-LAUN-JSON1"
      ,rawEvidenceRef: "controlled-record://JSON-102"
    }
  ]);
  const jsonImportRes = EmpiricalDataImporter.parseJsonLaboratoryData(jsonPayload, {
    datasetId: 'DS-JSON-2027',
    datasetVersion: 'DS-JSON-2027-v1',
    laboratoryName: 'Eurofins Analytics',
    operator: 'QA Lead',
    dataOrigin: 'REAL_LAB_MEASUREMENT',
    formulaVersion: '1.0.0'
  });
  assert(
    'JSON Laboratory Data Importer correctly detects duplicate observation IDs and quarantines them',
    jsonImportRes.approvedCount === 1 && jsonImportRes.quarantinedRecords.length === 1,
    jsonImportRes.quarantinedRecords.length,
    1
  );

  const missingFormulaIdJson = JSON.stringify([{
    observationId: 'OBS-JSON-MISSING-FORMULA',
    batchId: 'BATCH-JSON-MISSING-FORMULA',
    productCategory: 'LAUNDRY_LIQUID',
    measuredProperty: 'pH',
    measuredValue: 8.2,
    measurementUnit: 'pH units',
    testMethodId: 'ASTM-D1172',
    waterHardnessPpm: 150,
    temperatureC: 25,
    dosageGramsPerL: 2,
    contactTimeMin: 15,
    replicateNumber: 1,
    testDate: '2026-10-27',
    formulaVersion: '1.0.0',
    formulaFingerprint: 'FP-MISSING-FORMULA-ID'
  }]);
  const missingFormulaIdImport = EmpiricalDataImporter.parseJsonLaboratoryData(missingFormulaIdJson, {
    datasetId: 'DS-JSON-MISSING-FORMULA',
    datasetVersion: 'DS-JSON-MISSING-FORMULA-v1',
    laboratoryName: 'Test Lab',
    operator: 'QA Reviewer',
    dataOrigin: 'REAL_LAB_MEASUREMENT',
    formulaVersion: '1.0.0'
  });
  assert(
    'JSON importer rejects a lab observation when formulaId is missing instead of fabricating FORMULA-JSON',
    missingFormulaIdImport.approvedCount === 0 &&
      missingFormulaIdImport.rejectedCount === 1 &&
      missingFormulaIdImport.quarantinedRecords[0]?.quarantineReason.includes('formulaId'),
    missingFormulaIdImport.quarantinedRecords[0]?.quarantineReason,
    'formulaId required'
  );

  // 12. Empty Dataset State Handling in Evaluation Engine
  const emptyEval = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'pH Prediction',
    predictionsMap: new Map(),
    observations: [],
    datasetVersion: 'EMPTY-v1'
  });
  assert(
    'Evaluation engine returns explicit empty state with WAITING_FOR_REAL_LAB_DATA semantics when zero observations exist',
    emptyEval.totalObservationCount === 0 && emptyEval.validationGateVerdict === 'DATA_PENDING' &&
    emptyEval.mae === null && emptyEval.rmse === null && !emptyEval.leakageAudit.passed,
    emptyEval.validationGateVerdict,
    'DATA_PENDING'
  );
  const densityWithoutProtocol = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'Density', predictionsMap: new Map(), observations: [], category: 'LAUNDRY_LIQUID'
  });
  assert(
    'Density target is registered for liquids while real lab data is still pending',
    densityWithoutProtocol.hasRegisteredTarget && densityWithoutProtocol.validationGateVerdict === 'DATA_PENDING',
    { hasRegisteredTarget: densityWithoutProtocol.hasRegisteredTarget, verdict: densityWithoutProtocol.validationGateVerdict },
    { hasRegisteredTarget: true, verdict: 'DATA_PENDING' }
  );
  const categoryScopedCleaningTarget = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'Cleaning Score / CPI', predictionsMap: new Map(), observations: []
  });
  assert(
    'Laundry-only D3050 protocol cannot validate an unscoped mixed-category cleaning target',
    !categoryScopedCleaningTarget.hasRegisteredTarget,
    categoryScopedCleaningTarget.hasRegisteredTarget,
    false
  );

  const noPredictionEval = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'Cleaning Score / CPI',
    predictionsMap: new Map(),
    observations: [realObs],
    datasetVersion: 'NO-PREDICTION-v1'
  });
  assert(
    'Missing prediction inputs yield no fabricated observation pairs or validation metrics',
    noPredictionEval.comparisons.length === 0 && noPredictionEval.mae === null && noPredictionEval.rmse === null && !noPredictionEval.leakageAudit.passed,
    { mae: noPredictionEval.mae, rmse: noPredictionEval.rmse, leakageAuditPassed: noPredictionEval.leakageAudit.passed },
    { mae: null, rmse: null, leakageAuditPassed: false }
  );

  // 13. Prediction vs Actual Evaluation Engine with Metrics & Confidence Intervals
  const sampleObs: CompleteLaboratoryObservation[] = [
    {
      observationId: "OBS-EVAL-1",
      datasetId: "DS-EVAL",
      datasetVersion: "v1",
      formulaFingerprint: "FP-TEST-1",
      formulaVersionId: "1.0.0",
      formulaId: "F1",
      batchId: "B-1",
      productCategory: "LAUNDRY_LIQUID",
      commercialMaterials: [],
      waterProfile: { hardnessPpm: 150 },
      temperatureC: 25,
      dosageGramsPerL: 2.0,
      contactTimeMin: 15,
      testMethodId: "ASTM-D1172",
      replicateNumber: 1,
      measuredProperty: "pH Prediction",
      measuredValue: 8.50,
      measurementUnit: "pH units",
      operator: "Op1",
      laboratoryName: "Lab1",
      testDate: "2026-10-11",
      evidenceIds: ["EV-1"],
      rawEvidenceRef: "controlled-record://OBS-EVAL-1",
      provenanceStatus: "REAL_LAB_MEASUREMENT",
      dataQualityStatus: "APPROVED_FOR_VALIDATION",
      dataOrigin: "REAL_LAB_MEASUREMENT",
      auditTrail: ["test"]
    },
    {
      observationId: "OBS-EVAL-2",
      datasetId: "DS-EVAL",
      datasetVersion: "v1",
      formulaFingerprint: "FP-TEST-2",
      formulaVersionId: "1.0.0",
      formulaId: "F2",
      batchId: "B-2",
      productCategory: "LAUNDRY_LIQUID",
      commercialMaterials: [],
      waterProfile: { hardnessPpm: 150 },
      temperatureC: 25,
      dosageGramsPerL: 2.0,
      contactTimeMin: 15,
      testMethodId: "ASTM-D1172",
      replicateNumber: 1,
      measuredProperty: "pH Prediction",
      measuredValue: 8.60,
      measurementUnit: "pH units",
      operator: "Op1",
      laboratoryName: "Lab1",
      testDate: "2026-10-11",
      evidenceIds: ["EV-2"],
      rawEvidenceRef: "controlled-record://OBS-EVAL-2",
      provenanceStatus: "REAL_LAB_MEASUREMENT",
      dataQualityStatus: "APPROVED_FOR_VALIDATION",
      dataOrigin: "REAL_LAB_MEASUREMENT",
      auditTrail: ["test"]
    }
  ];
  const predMap = new Map<string, number>();
  predMap.set("FP-TEST-1", 8.45);
  predMap.set("FP-TEST-2", 8.55);

  const evalRes = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'pH Prediction',
    predictionsMap: predMap,
    observations: sampleObs,
    datasetVersion: 'DS-EVAL-v1'
  });
  assert(
    'EmpiricalValidationEvaluationEngine calculates metrics only on the independent formula holdout',
    evalRes.acceptedRecordCount === 1 && typeof evalRes.mae === 'number' && evalRes.leakageAudit.passed,
    evalRes.acceptedRecordCount,
    1
  );
  assert(
    'A single held-out formula cannot satisfy commercial formula-diversity sufficiency',
    evalRes.uniqueFormulaCount === 1 && evalRes.eligibleFormulaCount === 2 &&
      !evalRes.isFormulaSufficiencyMet && evalRes.validationGateVerdict === 'DATA_INSUFFICIENT',
    { heldOutFormulas: evalRes.uniqueFormulaCount, eligibleFormulas: evalRes.eligibleFormulaCount, formulaSufficiency: evalRes.isFormulaSufficiencyMet, verdict: evalRes.validationGateVerdict },
    { heldOutFormulas: 1, eligibleFormulas: 2, formulaSufficiency: false, verdict: 'DATA_INSUFFICIENT' }
  );
  const zeroTemperatureEval = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'pH Prediction',
    predictionsMap: predMap,
    observations: sampleObs.map((observation, index) => index === 1 ? { ...observation, temperatureC: 0 } : observation),
    datasetVersion: 'ZERO-TEMPERATURE-v1'
  });
  assert(
    'A zero-degree lab observation is retained but correctly counted outside the supported domain',
    zeroTemperatureEval.outOfDomainRecordCount === 1 && zeroTemperatureEval.comparisons[0]?.isInDomain === false,
    { outOfDomainCount: zeroTemperatureEval.outOfDomainRecordCount, comparisonIsInDomain: zeroTemperatureEval.comparisons[0]?.isInDomain },
    { outOfDomainCount: 1, comparisonIsInDomain: false }
  );

  const sufficientHoldoutObs = Array.from({ length: 10 }, (_, formulaIndex) =>
    Array.from({ length: 10 }, (_, batchIndex) => ({
      ...sampleObs[0],
      observationId: `OBS-COMM-${formulaIndex}-${batchIndex}`,
      formulaFingerprint: `FP-COMM-${String(formulaIndex).padStart(2, '0')}`,
      batchId: `B-COMM-${formulaIndex}-${batchIndex}`,
      replicateNumber: batchIndex + 1,
      measuredValue: 8.5,
      evidenceIds: [`EV-COMM-${formulaIndex}-${batchIndex}`],
      rawEvidenceRef: `controlled-record://COMM-${formulaIndex}-${batchIndex}`
    }))
  ).flat();
  const sufficientPredictions = new Map<string, number>(
    Array.from({ length: 10 }, (_, formulaIndex) => [`FP-COMM-${String(formulaIndex).padStart(2, '0')}`, 8.5])
  );
  const sufficientEval = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
    property: 'pH Prediction',
    predictionsMap: sufficientPredictions,
    observations: sufficientHoldoutObs,
    category: 'LAUNDRY_LIQUID',
    datasetVersion: 'COMMERCIAL-GATE-v1'
  });
  assert(
    'LAB_VALIDATED requires 10 eligible formula groups and at least 3 formula groups in the independent holdout',
    sufficientEval.validationGateVerdict === 'LAB_VALIDATED' && sufficientEval.eligibleFormulaCount === 10 &&
      sufficientEval.uniqueFormulaCount === 3 && sufficientEval.acceptedRecordCount === 30 &&
      sufficientEval.isFormulaSufficiencyMet && sufficientEval.isBatchSufficiencyMet,
    { verdict: sufficientEval.validationGateVerdict, eligibleFormulas: sufficientEval.eligibleFormulaCount, holdoutFormulas: sufficientEval.uniqueFormulaCount, holdoutObservations: sufficientEval.acceptedRecordCount },
    { verdict: 'LAB_VALIDATED', eligibleFormulas: 10, holdoutFormulas: 3, holdoutObservations: 30 }
  );

  // 14. Empirical Lab Persistence Service
  await EmpiricalLabPersistenceService.saveDataset({
    datasetId: 'DS-PERSIST-TEST',
    version: 'v1',
    categories: ['LAUNDRY_LIQUID'],
    property: 'pH Prediction',
    sourceType: 'REAL_LAB_MEASUREMENT',
    provenanceIds: ['PROV-1'],
    observationCount: 1,
    formulaCount: 1,
    batchCount: 1,
    status: 'APPROVED_FOR_VALIDATION',
    createdAt: new Date().toISOString()
  });
  const retrievedDs = await EmpiricalLabPersistenceService.getDatasetById('DS-PERSIST-TEST');
  assert(
    'EmpiricalLabPersistenceService durably saves and retrieves empirical datasets',
    Boolean(retrievedDs && retrievedDs.datasetId === 'DS-PERSIST-TEST'),
    retrievedDs?.datasetId,
    'DS-PERSIST-TEST'
  );

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL P2-13 EMPIRICAL VALIDATION TESTS : ${results.length}`);
  console.log(`PASSED                                 : ${results.filter(r => r.passed).length}`);
  console.log(`FAILED                                 : ${results.filter(r => !r.passed).length}`);
  console.log("--------------------------------------------------------------------------------");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (process.argv[1] && process.argv[1].includes('p2Phase13EmpiricalValidation.regression.test')) {
  runP2Phase13EmpiricalValidationTestSuite();
}

/**
 * ============================================================================
 * PHASE P2-13 FINAL 3 DEFECTS SURGICAL CLOSURE REGRESSION TEST SUITE
 * ============================================================================
 * 1. Missing contactTime is rejected.
 * 2. Missing required lab metadata is rejected.
 * 3. No artificial formulaVersion is generated.
 * 4. No artificial datasetVersion is generated.
 * 5. Real formula composition creates deterministic fingerprint.
 * 6. Formula changes change fingerprint.
 * 7. Ingredient ordering does not change fingerprint.
 * 8. Outside-domain prediction cannot become LAB_VALIDATED.
 * 9. Unknown domain returns APPLICABILITY_UNKNOWN.
 * 10. Dataset mutation creates a new dataset version.
 * 11. Historical dataset version remains immutable.
 * 12. Validation result retains datasetVersion + modelVersion + fingerprint.
 * ============================================================================
 */

import {
  computeDeterministicFormulaFingerprint
} from '../empiricalLabObservationModel';
import {
  EmpiricalDataImporter
} from '../empiricalDataImporter';
import {
  HardenedEmpiricalAccuracyEngine,
  computeDeterministicDatasetVersion,
  EmpiricalApplicabilityDomain
} from '../empiricalAccuracyFramework';
import {
  ModelValidationStatusGate,
  FrozenModelVersion
} from '../empiricalCalibrationEngine';

export function runP2Phase13FinalIntegrityTestSuite(): void {
  console.log('--- STARTING P2-13 FINAL 3 DEFECTS SURGICAL CLOSURE SUITE ---');

  let passed = 0;
  let failed = 0;

  function assert(testId: string, description: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      passed++;
      console.log(`[PASS] [${testId}] ${description}`);
    } else {
      failed++;
      console.error(`[FAIL] [${testId}] ${description} -> Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
    }
  }

  // --------------------------------------------------------------------------
  // DEFECT 1: EMPIRICAL DATA IMPORTER & NO FABRICATED DEFAULTS
  // --------------------------------------------------------------------------

  // TEST 1: Missing contactTime is rejected
  const missingContactTimeCsv = `observationId,productCategory,formulaId,formulaVersion,datasetVersion,batchId,measuredProperty,measuredValue,measurementUnit,testMethodId,waterHardnessPpm,temperatureC,dosageGramsPerL,replicateNumber,testDate,formulafingerprint
OBS-CT-1,LAUNDRY_LIQUID,F-1,v1.0,DS-1,BATCH-1,Cleaning Score,85.0,Score Index,ASTM-D3050,150,25,5,1,2026-10-06,FP-LAUN-12345678`;

  const importMissingCT = EmpiricalDataImporter.parseCsvLaboratoryData(missingContactTimeCsv, {
    datasetId: 'DS-1',
    laboratoryName: 'Eurofins',
    operator: 'Chemist A',
    dataOrigin: 'REAL_LAB_MEASUREMENT'
  });

  assert(
    'TEST 1',
    'Missing contactTime is strictly rejected with MISSING_REQUIRED_FIELD (no fallback to 15 min)',
    importMissingCT.rejectedCount === 1 && importMissingCT.approvedCount === 0 && importMissingCT.rejectedReasons[0].includes('contactTimeMin'),
    importMissingCT.rejectedReasons[0],
    'Rejection citing contactTimeMin'
  );

  // TEST 2: Missing required lab metadata is rejected
  const missingMetaCsv = `observationId,productCategory,formulaId
OBS-MISS-1,LAUNDRY_LIQUID,F-1`;

  const importMissingMeta = EmpiricalDataImporter.parseCsvLaboratoryData(missingMetaCsv, {
    datasetId: 'DS-1',
    laboratoryName: 'Eurofins',
    operator: 'Chemist A',
    dataOrigin: 'REAL_LAB_MEASUREMENT'
  });

  assert(
    'TEST 2',
    'Missing required lab metadata fields are rejected with full error trail',
    importMissingMeta.rejectedCount === 1 && importMissingMeta.approvedCount === 0,
    importMissingMeta.rejectedCount,
    1
  );

  // TEST 3: No artificial formulaVersion is generated
  const missingFormulaVerCsv = `observationId,productCategory,formulaId,datasetVersion,batchId,measuredProperty,measuredValue,measurementUnit,testMethodId,waterHardnessPpm,temperatureC,dosageGramsPerL,contactTimeMin,replicateNumber,testDate,formulafingerprint
OBS-VER-1,LAUNDRY_LIQUID,F-1,DS-1,BATCH-1,Cleaning Score,85.0,Score Index,ASTM-D3050,150,25,5,15,1,2026-10-06,FP-LAUN-12345678`;

  const importMissingFormVer = EmpiricalDataImporter.parseCsvLaboratoryData(missingFormulaVerCsv, {
    datasetId: 'DS-1',
    laboratoryName: 'Eurofins',
    operator: 'Chemist A',
    dataOrigin: 'REAL_LAB_MEASUREMENT'
  });

  assert(
    'TEST 3',
    'No artificial formulaVersion (e.g. 1.0.0) is generated when missing from row and metadata',
    importMissingFormVer.rejectedCount === 1 && importMissingFormVer.rejectedReasons[0].includes('formulaVersion'),
    importMissingFormVer.rejectedReasons[0],
    'Rejection citing formulaVersion'
  );

  // TEST 4: No artificial datasetVersion is generated
  const missingDatasetVerCsv = `observationId,productCategory,formulaId,formulaVersion,batchId,measuredProperty,measuredValue,measurementUnit,testMethodId,waterHardnessPpm,temperatureC,dosageGramsPerL,contactTimeMin,replicateNumber,testDate,formulafingerprint
OBS-DSVER-1,LAUNDRY_LIQUID,F-1,v2.1,BATCH-1,Cleaning Score,85.0,Score Index,ASTM-D3050,150,25,5,15,1,2026-10-06,FP-LAUN-12345678`;

  const importMissingDSVer = EmpiricalDataImporter.parseCsvLaboratoryData(missingDatasetVerCsv, {
    datasetId: 'DS-1',
    laboratoryName: 'Eurofins',
    operator: 'Chemist A',
    dataOrigin: 'REAL_LAB_MEASUREMENT'
  });

  assert(
    'TEST 4',
    'No artificial datasetVersion is generated when missing from row and metadata',
    importMissingDSVer.rejectedCount === 1 && importMissingDSVer.rejectedReasons[0].includes('datasetVersion'),
    importMissingDSVer.rejectedReasons[0],
    'Rejection citing datasetVersion'
  );

  // --------------------------------------------------------------------------
  // DEFECT 2: REAL FORMULA FINGERPRINT DETERMINISM & INTEGRITY
  // --------------------------------------------------------------------------

  // Base formulation
  const formulaA = {
    productCategory: 'LAUNDRY_LIQUID',
    physicalForm: 'LIQUID',
    formulaVersion: 'v2.0',
    targetPH: 8.5,
    waterHardnessPpm: 150,
    ingredients: [
      { ingredientId: 'labsa', gradeId: '90PCT', percentage: 10, activeMatterPct: 90 },
      { ingredientId: 'sles', gradeId: '70PCT', percentage: 8, activeMatterPct: 70 },
      { ingredientId: 'water', gradeId: 'DM', percentage: 82, activeMatterPct: 0 }
    ]
  };

  const fpA1 = computeDeterministicFormulaFingerprint(formulaA);
  const fpA2 = computeDeterministicFormulaFingerprint(formulaA);

  // TEST 5: Same formula -> same fingerprint
  assert(
    'TEST 5',
    'Identical formulation inputs deterministically produce the exact same fingerprint',
    fpA1 === fpA2 && fpA1.startsWith('FP-LAUN-'),
    fpA1,
    fpA2
  );

  // TEST 6: Formula changes produce different fingerprints
  const formulaPctChange = {
    ...formulaA,
    ingredients: [
      { ingredientId: 'labsa', gradeId: '90PCT', percentage: 12, activeMatterPct: 90 },
      { ingredientId: 'sles', gradeId: '70PCT', percentage: 6, activeMatterPct: 70 },
      { ingredientId: 'water', gradeId: 'DM', percentage: 82, activeMatterPct: 0 }
    ]
  };
  const fpPct = computeDeterministicFormulaFingerprint(formulaPctChange);

  const formulaSubstituted = {
    ...formulaA,
    ingredients: [
      { ingredientId: 'aos', gradeId: '38PCT', percentage: 10, activeMatterPct: 38 },
      { ingredientId: 'sles', gradeId: '70PCT', percentage: 8, activeMatterPct: 70 },
      { ingredientId: 'water', gradeId: 'DM', percentage: 82, activeMatterPct: 0 }
    ]
  };
  const fpSub = computeDeterministicFormulaFingerprint(formulaSubstituted);

  const formulaCatChange = {
    ...formulaA,
    productCategory: 'DISHWASH_MANUAL'
  };
  const fpCat = computeDeterministicFormulaFingerprint(formulaCatChange);

  const formulaVerChange = {
    ...formulaA,
    formulaVersion: 'v2.1'
  };
  const fpVer = computeDeterministicFormulaFingerprint(formulaVerChange);

  assert(
    'TEST 6',
    'Ingredient percentage, substitution, category, or version changes produce distinct fingerprints',
    fpA1 !== fpPct && fpA1 !== fpSub && fpA1 !== fpCat && fpA1 !== fpVer,
    { fpA1, fpPct, fpSub, fpCat, fpVer },
    'All distinct'
  );

  // TEST 7: Ingredient ordering change produces identical fingerprint
  const formulaReordered = {
    ...formulaA,
    ingredients: [
      { ingredientId: 'water', gradeId: 'DM', percentage: 82, activeMatterPct: 0 },
      { ingredientId: 'sles', gradeId: '70PCT', percentage: 8, activeMatterPct: 70 },
      { ingredientId: 'labsa', gradeId: '90PCT', percentage: 10, activeMatterPct: 90 }
    ]
  };
  const fpReordered = computeDeterministicFormulaFingerprint(formulaReordered);

  assert(
    'TEST 7',
    'Ingredient ordering changes do not alter deterministic fingerprint',
    fpA1 === fpReordered,
    fpReordered,
    fpA1
  );

  // --------------------------------------------------------------------------
  // DEFECT 3: APPLICABILITY DOMAIN & DATASET VERSION INTEGRITY
  // --------------------------------------------------------------------------

  const validDomain: EmpiricalApplicabilityDomain = {
    domainId: 'DOMAIN-LAUN-1',
    datasetId: 'DS-REAL-2026',
    datasetVersion: 'DS-REAL-2026-vA1B2C3',
    property: 'Cleaning Score / CPI',
    productCategories: ['LAUNDRY_LIQUID'],
    phRange: { min: 7.0, max: 9.5 },
    activeMatterRange: { min: 8.0, max: 25.0 },
    waterHardnessRange: { min: 50, max: 300 },
    temperatureRange: { min: 15, max: 40 },
    dosageRange: { min: 2, max: 10 },
    contactTimeRange: { min: 10, max: 30 },
    sampleSize: 45
  };

  // Test within domain
  const evalWithin = HardenedEmpiricalAccuracyEngine.evaluateApplicabilityDomain(validDomain, {
    productCategory: 'LAUNDRY_LIQUID',
    pH: 8.2,
    activeMatterPct: 15.0,
    waterHardnessPpm: 150,
    temperatureC: 25,
    dosageGramsPerL: 5,
    contactTimeMin: 15
  });

  // Test outside category
  const evalOutCategory = HardenedEmpiricalAccuracyEngine.evaluateApplicabilityDomain(validDomain, {
    productCategory: 'TOILET_CLEANER',
    pH: 2.0
  });

  // Test outside pH range
  const evalOutPh = HardenedEmpiricalAccuracyEngine.evaluateApplicabilityDomain(validDomain, {
    productCategory: 'LAUNDRY_LIQUID',
    pH: 12.0 // exceeds 9.5
  });

  // TEST 8: Outside-domain prediction cannot become LAB_VALIDATED
  const gateOutsideDomain = ModelValidationStatusGate.evaluateLabValidatedStatusGate({
    realLabDataAvailable: true,
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
    evidenceRecordsRetained: true,
    applicabilityStatus: evalOutPh.status // OUTSIDE_APPLICABILITY_DOMAIN
  });

  assert(
    'TEST 8',
    'Outside-domain prediction cannot become LAB_VALIDATED and is downgraded with explanation',
    evalOutCategory.status === 'OUTSIDE_APPLICABILITY_DOMAIN' &&
    evalOutPh.status === 'OUTSIDE_APPLICABILITY_DOMAIN' &&
    evalWithin.status === 'WITHIN_APPLICABILITY_DOMAIN' &&
    gateOutsideDomain.status !== 'LAB_VALIDATED' &&
    gateOutsideDomain.reasons.some(r => r.includes('applicability domain')),
    gateOutsideDomain.status,
    'VALIDATED_WITH_LIMITATIONS or VALIDATION_PENDING'
  );

  // TEST 9: Unknown domain returns APPLICABILITY_UNKNOWN
  const evalUnknown = HardenedEmpiricalAccuracyEngine.evaluateApplicabilityDomain(null, {
    productCategory: 'LAUNDRY_LIQUID'
  });

  const gateUnknownDomain = ModelValidationStatusGate.evaluateLabValidatedStatusGate({
    realLabDataAvailable: true,
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
    evidenceRecordsRetained: true,
    applicabilityStatus: evalUnknown.status // APPLICABILITY_UNKNOWN
  });

  assert(
    'TEST 9',
    'Unknown domain returns APPLICABILITY_UNKNOWN and blocks LAB_VALIDATED status',
    evalUnknown.status === 'APPLICABILITY_UNKNOWN' &&
    evalUnknown.canClaimLabValidated === false &&
    gateUnknownDomain.status !== 'LAB_VALIDATED',
    evalUnknown.status,
    'APPLICABILITY_UNKNOWN'
  );

  // TEST 10: Dataset mutation creates a new dataset version
  const obsSet1 = [
    { observationId: 'OBS-1', measuredResult: 85.0, testDate: '2026-10-01' },
    { observationId: 'OBS-2', measuredResult: 86.0, testDate: '2026-10-01' }
  ];
  const ver1 = computeDeterministicDatasetVersion('DS-TEST', obsSet1);

  const obsSet2 = [
    ...obsSet1,
    { observationId: 'OBS-3', measuredResult: 87.5, testDate: '2026-10-02' }
  ];
  const ver2 = computeDeterministicDatasetVersion('DS-TEST', obsSet2);

  assert(
    'TEST 10',
    'Adding/modifying observations creates a deterministic new dataset version hash',
    ver1 !== ver2 && ver1.startsWith('DS-TEST-v') && ver2.startsWith('DS-TEST-v'),
    { ver1, ver2 },
    'Distinct versions'
  );

  // TEST 11: Historical dataset version remains immutable
  const snapshot1 = HardenedEmpiricalAccuracyEngine.createDatasetSnapshot('DS-TEST', [
    {
      observationId: 'OBS-1',
      datasetId: 'DS-TEST',
      datasetVersion: ver1,
      formulaId: 'F-1',
      formulaVersion: 'v1.0',
      formulaFingerprint: fpA1,
      productCategory: 'LAUNDRY_LIQUID',
      batchId: 'B-1',
      waterProfile: { hardnessPpm: 150 },
      temperatureC: 25,
      dosageGramsPerL: 5,
      contactTimeMin: 15,
      testMethod: 'ASTM-D3050',
      replicateId: 1,
      measuredResult: 85.0,
      unit: 'Score Index',
      laboratoryName: 'Eurofins',
      operator: 'Chemist A',
      testDate: '2026-10-01',
      evidenceId: 'EV-1',
      datasetStatus: 'APPROVED_FOR_VALIDATION'
    }
  ]);

  const retrievedSnapshot = HardenedEmpiricalAccuracyEngine.getDatasetSnapshot('DS-TEST', snapshot1.datasetVersion);

  assert(
    'TEST 11',
    'Historical dataset version snapshot is immutable and retains its exact observation state',
    retrievedSnapshot !== undefined &&
    retrievedSnapshot.datasetVersion === snapshot1.datasetVersion &&
    retrievedSnapshot.isLocked === true &&
    retrievedSnapshot.observations.length === 1,
    retrievedSnapshot?.datasetVersion,
    snapshot1.datasetVersion
  );

  // TEST 12: Validation result retains datasetVersion + modelVersion + fingerprint
  const frozenModel: FrozenModelVersion = {
    modelId: 'model-cpi-v2',
    modelVersion: 'v20261006.1',
    formulaFingerprint: fpA1,
    definitionHash: 'HASH-DEF-12345',
    calibrationDatasetId: 'DS-CAL-1',
    validationDatasetId: 'DS-VAL-1',
    fittedParameters: { slope: 1.02, intercept: -0.5, biasCorrection: 0.1 },
    metrics: { mae: 0.12, rmse: 0.18, bias: 0.05, r2: 0.96 },
    applicableCategories: ['LAUNDRY_LIQUID'],
    applicabilityDomain: validDomain,
    validationStatus: 'VALIDATED_WITH_LIMITATIONS',
    frozenAt: new Date().toISOString(),
    evidenceIds: ['EV-TEST-101']
  };

  ModelValidationStatusGate.freezeModelVersion(frozenModel);
  const retrievedModel = ModelValidationStatusGate.getFrozenModel('model-cpi-v2', 'v20261006.1');

  const reportText = ModelValidationStatusGate.generateValidationReport({
    modelId: frozenModel.modelId,
    modelVersion: frozenModel.modelVersion,
    datasetId: 'DS-VAL-1',
    datasetVersion: ver1,
    formulaFingerprint: fpA1,
    applicabilityStatus: 'WITHIN_APPLICABILITY_DOMAIN',
    categories: ['LAUNDRY_LIQUID'],
    totalObservations: 45,
    uniqueFormulas: 15,
    uniqueBatches: 20,
    realDataAvailable: true,
    calibrationMae: 0.11,
    validationMae: 0.12,
    validationStatus: 'LAB_VALIDATED'
  });

  assert(
    'TEST 12',
    'Validation result and report retain datasetVersion, modelVersion, formulaFingerprint, and applicability domain',
    retrievedModel !== undefined &&
    retrievedModel.formulaFingerprint === fpA1 &&
    reportText.includes(ver1) &&
    reportText.includes(frozenModel.modelVersion) &&
    reportText.includes(fpA1) &&
    reportText.includes('WITHIN_APPLICABILITY_DOMAIN'),
    true,
    true
  );

  console.log('--------------------------------------------------');
  console.log(`TOTAL P2-13 FINAL CLOSURE TESTS : ${passed + failed}`);
  console.log(`PASSED                          : ${passed}`);
  console.log(`FAILED                          : ${failed}`);
  console.log('--------------------------------------------------');

  if (failed > 0) {
    throw new Error(`P2-13 Final Closure Test Suite failed with ${failed} failure(s).`);
  }
}

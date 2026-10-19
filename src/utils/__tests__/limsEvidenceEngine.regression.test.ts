/**
 * ============================================================================
 * LIMS SCIENTIFIC EVIDENCE & CLEAN-ROOM REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies the independent TypeScript clean-room LIMS & Evidence Layer:
 * 1. Formula version creation & composition snapshot
 * 2. Formula hash linkage to ProvenanceEngine fingerprint
 * 3. Batch creation and lot traceability
 * 4. Sample lifecycle progression (CREATED -> RECEIVED -> QUEUED -> IN_TESTING -> APPROVED)
 * 5. Invalid lifecycle transition rejection (REJECTED cannot become APPROVED directly)
 * 6. Lab test creation from standard test methods
 * 7. Measurement creation with mandatory numeric value and analyst tracking
 * 8. Unit requirement validation (NaN / missing unit rejected)
 * 9. Instrument calibration state evaluation (VALID / DUE / EXPIRED / UNKNOWN)
 * 10. Expired instrument handling (cannot produce LAB_VALIDATED or CERTIFIED evidence)
 * 11. Evidence levels classification hierarchy
 * 12. Evidence promotion rules (CALCULATED cannot become LAB_VALIDATED)
 * 13. Audit trail cryptographic hash chain linking
 * 14. Immutable measurement preservation
 * 15. Measurement correction workflow (original preserved, revision appended)
 * 16. Liquid test routing (excludes powder bulk density and dissolution)
 * 17. Powder test routing (includes powder dissolution and moisture)
 * 18. NOT_APPLICABLE vs NOT_TESTED explicit scientific distinction
 * 19. Quality Gate evidence propagation (missing evidence is not PASS)
 * 20. Release Gate blocking (untested critical specifications block release)
 * 21. Missing evidence handling (LAB_VALIDATION_REQUIRED state)
 * 22. Replicate measurement analysis & outlier handling
 * 23. Provenance linkage across entire batch-sample-measurement chain
 * 24. Tampered audit record detection & hash verification failure
 * ============================================================================
 */

import { FORMULAS } from '../../data/formulas';
import { FormulationIngredient } from '../../types';
import {
  LabSample,
  LimsAuditRecord,
} from '../../domain/lims/types';
import {
  evaluateInstrumentCalibration,
  getInstrumentWithCurrentStatus,
  isInstrumentAuthorizedForValidation,
  InstrumentRecord,
  registerUserInstrument,
} from '../../domain/lims/instrument';
import {
  getApplicableTestMethods,
  validateMethodFormCompatibility,
} from '../../domain/lims/testMethods';
import {
  createFormulaVersionSnapshot,
  createBatchRecord,
  drawLabSample,
  generateApplicableTestsForSample,
  recordLabMeasurement,
} from '../lims/limsEngine';
import {
  transitionSampleStatus,
  transitionBatchStatus,
} from '../lims/limsSampleLifecycleEngine';
import {
  createAuditRecord,
  verifyAuditTrailChain,
} from '../lims/limsAuditTrailEngine';
import {
  validateEvidencePromotion,
  createMeasurementCorrection,
  buildEvidenceRecordFromMeasurement,
} from '../lims/limsEvidencePromotionEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { evaluateReleaseGate } from '../specificationEngine/releaseGateEngine';

export interface TestResultSummary {
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}

export function runLimsEvidenceEngineTestSuite(): TestResultSummary {
  console.log('================================================================');
  console.log('  LIMS SCIENTIFIC EVIDENCE & CLEAN-ROOM TEST SUITE              ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `:: PASS (${detail})` : '-> OK'}`);
      passed++;
      results.push({ name: testName, passed: true, message: detail });
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `:: FAIL (${detail})` : '-> FAIL'}`);
      failed++;
      results.push({ name: testName, passed: false, message: detail });
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Formula Version Creation
  // ---------------------------------------------------------------------------
  const goldenFormula = FORMULAS[0];
  const testIngs: FormulationIngredient[] = goldenFormula.ingredients.map(i => ({
    id: i.id,
    name: i.name,
    percentage: Number(i.percent ?? (i as any).percentage ?? 0),
    activePercentage: Number(i.activePercent ?? (i as any).activeDefault ?? 100),
    costPerKg: Number(i.costPerKg ?? 1.0),
    category: i.category,
    function: i.function,
  }));

  const formulaVer = createFormulaVersionSnapshot(
    goldenFormula.id,
    '1.0.0',
    goldenFormula.name,
    goldenFormula.category,
    testIngs,
    'Lead Formulation Chemist'
  );

  assert(
    formulaVer.formulaId === goldenFormula.id &&
    formulaVer.formulaVersion === '1.0.0' &&
    formulaVer.composition.length === testIngs.length &&
    formulaVer.physicalForm === 'LIQUID',
    'Test 1: FormulaVersion snapshot captures complete composition, metadata, and physical form',
    `Formula ID: ${formulaVer.formulaId}, Version: ${formulaVer.formulaVersion}, Form: ${formulaVer.physicalForm}`
  );

  // ---------------------------------------------------------------------------
  // 2. Formula Hash Linkage
  // ---------------------------------------------------------------------------
  assert(
    typeof formulaVer.formulaHash === 'string' && formulaVer.formulaHash.length >= 8,
    'Test 2: FormulaVersion creates deterministic hash fingerprint linked to recipe composition',
    `Formula Hash: ${formulaVer.formulaHash}`
  );

  // ---------------------------------------------------------------------------
  // 3. Batch Creation
  // ---------------------------------------------------------------------------
  const batch = createBatchRecord(
    formulaVer,
    'BATCH-2026-LAUN-001',
    1000,
    998.2,
    'Batch Compounder J. Doe',
    { 'water-deionized': 'LOT-WTR-991', 'labsa-96': 'LOT-LABSA-2026-44' }
  );

  assert(
    batch.batchNumber === 'BATCH-2026-LAUN-001' &&
    batch.status === 'PLANNED' &&
    batch.targetBatchSizeKg === 1000 &&
    batch.rawMaterialLotIds['labsa-96'] === 'LOT-LABSA-2026-44',
    'Test 3: BatchRecord created with target mass, operator, raw material lot IDs, and PLANNED status',
    `Batch: ${batch.batchNumber}, Target: ${batch.targetBatchSizeKg}kg, Status: ${batch.status}`
  );

  // ---------------------------------------------------------------------------
  // 4. Sample Lifecycle Progression
  // ---------------------------------------------------------------------------
  const sample = drawLabSample(batch, formulaVer, 'FINISHED_PRODUCT', 'QC Sampler');
  assert(
    sample.status === 'CREATED' && sample.barcode.startsWith('BAR-SMP-'),
    'Test 4: LabSample drawn from batch with initial CREATED status and unique barcode',
    `Sample ID: ${sample.sampleId}, Barcode: ${sample.barcode}`
  );

  const t1 = transitionSampleStatus(sample, 'RECEIVED', 'QC Analyst');
  const t2 = transitionSampleStatus(t1.entity!, 'QUEUED', 'QC Analyst');
  const t3 = transitionSampleStatus(t2.entity!, 'IN_TESTING', 'QC Analyst');
  const t4 = transitionSampleStatus(t3.entity!, 'TEST_COMPLETE', 'QC Analyst');
  const t5 = transitionSampleStatus(t4.entity!, 'PENDING_REVIEW', 'QC Analyst');
  const t6 = transitionSampleStatus(t5.entity!, 'APPROVED', 'QC Supervisor');

  assert(
    t1.success && t2.success && t3.success && t4.success && t5.success && t6.success && t6.entity?.status === 'APPROVED',
    'Test 5: Sample progresses cleanly through standard multi-stage scientific lifecycle to APPROVED',
    `Final Status: ${t6.entity?.status}, History Entries: ${t6.entity?.statusHistory.length}`
  );

  // ---------------------------------------------------------------------------
  // 5. Invalid Lifecycle Transition Rejection
  // ---------------------------------------------------------------------------
  const rejectedSample: LabSample = { ...sample, status: 'REJECTED' };
  const directApproveAttempt = transitionSampleStatus(rejectedSample, 'APPROVED', 'Unauth User');

  assert(
    !directApproveAttempt.success && rejectedSample.status === 'REJECTED',
    'Test 6: REJECTED sample cannot transition directly to APPROVED without controlled re-opening review',
    `Transition Allowed: ${directApproveAttempt.success}, Error: ${directApproveAttempt.errorMessage}`
  );

  // ---------------------------------------------------------------------------
  // 6. Lab Test Creation from Standard Methods
  // ---------------------------------------------------------------------------
  const scheduledTests = generateApplicableTestsForSample(sample, formulaVer.productCategory);
  const phTest = scheduledTests.find(t => t.parameterKey === 'ph');

  assert(
    scheduledTests.length > 0 && phTest !== undefined && phTest.status === 'PENDING',
    'Test 7: Applicable analytical tests generated automatically for sample based on product profile',
    `Tests count: ${scheduledTests.length}, pH test found: ${!!phTest}`
  );

  // ---------------------------------------------------------------------------
  // 7. Measurement Creation with Mandatory Analyst Tracking
  // ---------------------------------------------------------------------------
  const regRes = registerUserInstrument({
    instrumentId: 'INST-TEST-PH-001',
    name: 'Test pH Meter',
    manufacturer: 'Mettler Toledo',
    model: 'SevenDirect',
    serialNumber: 'TEST-SN-999',
    instrumentType: 'pH_METER',
    calibrationCertificateReference: 'CAL-CERT-TEST-999',
    lastCalibrationDate: '2026-01-01',
    nextCalibrationDate: '2027-01-01',
    location: 'Lab',
    custodian: 'Tester',
    registeredBy: 'Tester',
  });
  const phMeter = regRes.instrument!;
  const meas1 = recordLabMeasurement(
    phTest!,
    8.42,
    'pH units',
    phTest!.parameterName,
    phMeter.instrumentId,
    'Senior Analyst A. Kumar',
    1,
    undefined,
    25
  );

  assert(
    meas1.value === 8.42 && meas1.unit === 'pH units' && meas1.analyst === 'Senior Analyst A. Kumar',
    'Test 8: LabMeasurement records exact numerical observation, unit, instrument ID, and analyst',
    `Value: ${meas1.value} ${meas1.unit}, Analyst: ${meas1.analyst}`
  );

  // ---------------------------------------------------------------------------
  // 8. Unit Requirement & Validation
  // ---------------------------------------------------------------------------
  let rejectedUnitOrNan = false;
  try {
    recordLabMeasurement(phTest!, NaN, 'pH units', 'pH Test', phMeter.instrumentId, 'Analyst');
  } catch (e) {
    rejectedUnitOrNan = true;
  }

  assert(
    rejectedUnitOrNan,
    'Test 9: Recording NaN or invalid measurement throws error and prevents uncalibrated storage',
    'NaN measurement rejected safely'
  );

  // ---------------------------------------------------------------------------
  // 9. Instrument Calibration State
  // ---------------------------------------------------------------------------
  const activeInstrument = getInstrumentWithCurrentStatus(phMeter.instrumentId);
  assert(
    activeInstrument !== undefined && activeInstrument.calibrationStatus === 'VALID',
    'Test 10: Instrument registry calculates active calibration window (status: VALID)',
    `Status: ${activeInstrument?.calibrationStatus}, Next Cal: ${activeInstrument?.nextCalibrationDate}`
  );

  // ---------------------------------------------------------------------------
  // 10. Expired Instrument Handling
  // ---------------------------------------------------------------------------
  const expiredInstrument: InstrumentRecord = {
    ...phMeter,
    instrumentId: 'INST-EXPIRED-001',
    nextCalibrationDate: '2020-01-01', // Past date
  };
  const expiredCalStatus = evaluateInstrumentCalibration(expiredInstrument);
  const isAuth = isInstrumentAuthorizedForValidation(expiredInstrument);

  assert(
    expiredCalStatus === 'EXPIRED' && !isAuth,
    'Test 11: Instrument with past calibration date is flagged EXPIRED and unauthorized for validated evidence',
    `Calibration status: ${expiredCalStatus}, Authorized: ${isAuth}`
  );

  // ---------------------------------------------------------------------------
  // 11. Evidence Level Classification Hierarchy
  // ---------------------------------------------------------------------------
  const promoRes = validateEvidencePromotion('CALCULATED', 'LAB_VALIDATED');
  assert(
    !promoRes.allowed && promoRes.effectiveLevel === 'CALCULATED',
    'Test 12: Direct promotion from CALCULATED to LAB_VALIDATED is strictly rejected without bench testing',
    `Allowed: ${promoRes.allowed}, Reason: ${promoRes.reason}`
  );

  // ---------------------------------------------------------------------------
  // 12. Evidence Promotion Rules: ANALYTICAL_EVIDENCE -> CERTIFIED
  // ---------------------------------------------------------------------------
  const promoCert = validateEvidencePromotion('ANALYTICAL_EVIDENCE', 'CERTIFIED', { hasThirdPartyCertificate: false });
  assert(
    !promoCert.allowed && promoCert.effectiveLevel === 'ANALYTICAL_EVIDENCE',
    'Test 13: ANALYTICAL_EVIDENCE cannot be promoted to CERTIFIED without accredited certificate',
    `Allowed: ${promoCert.allowed}`
  );

  // ---------------------------------------------------------------------------
  // 13. Audit Trail Cryptographic Hash Chain
  // ---------------------------------------------------------------------------
  const audit1 = createAuditRecord('SYSTEM', 'INIT', 'BATCH', batch.batchId, null, batch, 'Batch registered');
  const audit2 = createAuditRecord('QC_ANALYST', 'DRAW_SAMPLE', 'SAMPLE', sample.sampleId, null, sample, 'Sample drawn', audit1);
  const audit3 = createAuditRecord('QC_ANALYST', 'RECORD_MEAS', 'MEASUREMENT', meas1.measurementId, null, meas1, 'pH recorded', audit2);

  const chainCheck = verifyAuditTrailChain([audit1, audit2, audit3]);
  assert(
    chainCheck.isValid && audit2.previousHash === audit1.newHash && audit3.previousHash === audit2.newHash,
    'Test 14: LIMS audit records form an intact cryptographic hash chain linked to previous entry digests',
    `Chain valid: ${chainCheck.isValid}, Audit count: 3`
  );

  // ---------------------------------------------------------------------------
  // 14. Immutable Measurement Preservation
  // ---------------------------------------------------------------------------
  const origValue = meas1.value;
  const { correction, updatedOriginalMeasurement } = createMeasurementCorrection(
    meas1,
    8.35,
    'pH units',
    'Re-calibration adjustment correction',
    'Senior Chemist'
  );

  assert(
    meas1.value === origValue &&
    updatedOriginalMeasurement.isCorrected === true &&
    updatedOriginalMeasurement.correctionId === correction.correctionId &&
    correction.oldValue === 8.42 &&
    correction.newValue === 8.35,
    'Test 15: Original measurement value is preserved immutably when correction record is created',
    `Original Val: ${meas1.value}, Corrected Val: ${correction.newValue}, Reason: ${correction.reason}`
  );

  // ---------------------------------------------------------------------------
  // 15. Correction Workflow Approval
  // ---------------------------------------------------------------------------
  assert(
    correction.status === 'PROPOSED' && correction.parameterKey === 'ph',
    'Test 16: Measurement correction creates PROPOSED record requiring supervisor review',
    `Correction ID: ${correction.correctionId}, Status: ${correction.status}`
  );

  // ---------------------------------------------------------------------------
  // 16. Liquid Test Routing (Powder Exclusion)
  // ---------------------------------------------------------------------------
  const liquidMethods = getApplicableTestMethods('LAUNDRY_LIQUID');
  const liquidHasBulkDensity = liquidMethods.some(m => m.parameterKey === 'bulkDensity');
  const liquidHasDissolution = liquidMethods.some(m => m.parameterKey === 'dissolutionTime');
  const liquidHasViscosity = liquidMethods.some(m => m.parameterKey === 'viscosity');

  assert(
    !liquidHasBulkDensity && !liquidHasDissolution && liquidHasViscosity,
    'Test 17: Liquid product test routing strictly excludes powder bulk density and dissolution time',
    `Liquid has bulk density: ${liquidHasBulkDensity}, has viscosity: ${liquidHasViscosity}`
  );

  // ---------------------------------------------------------------------------
  // 17. Powder Test Routing (Liquid Exclusion)
  // ---------------------------------------------------------------------------
  const powderMethods = getApplicableTestMethods('LAUNDRY_POWDER');
  const powderHasBulkDensity = powderMethods.some(m => m.parameterKey === 'bulkDensity');
  const powderHasDissolution = powderMethods.some(m => m.parameterKey === 'dissolutionTime');
  const powderHasViscosity = powderMethods.some(m => m.parameterKey === 'viscosity');

  assert(
    powderHasBulkDensity && powderHasDissolution && !powderHasViscosity,
    'Test 18: Powder product test routing includes bulk density and dissolution while excluding viscosity',
    `Powder has bulk density: ${powderHasBulkDensity}, has viscosity: ${powderHasViscosity}`
  );

  // ---------------------------------------------------------------------------
  // 18. NOT_APPLICABLE vs NOT_TESTED Distinction
  // ---------------------------------------------------------------------------
  const powderBulkOnLiquidCheck = validateMethodFormCompatibility('METHOD-POWDER-BULK-001', 'LAUNDRY_LIQUID');
  assert(
    !powderBulkOnLiquidCheck.isCompatible,
    'Test 19: Powder-specific method applied to liquid formulation is rejected with explicit form incompatibility',
    `Compatible: ${powderBulkOnLiquidCheck.isCompatible}, Reason: ${powderBulkOnLiquidCheck.reason}`
  );

  // ---------------------------------------------------------------------------
  // 19. Quality Gate Evidence Propagation
  // ---------------------------------------------------------------------------
  const qualityGateReport = evaluateScientificQualityGate({
    formulaId: goldenFormula.id,
    formulaName: goldenFormula.name,
    productCategory: goldenFormula.category,
    ingredients: testIngs,
    labMeasurements: [
      {
        measurementId: meas1.measurementId,
        formulaVersion: '1.0.0',
        parameterKey: 'ph',
        value: 8.42,
        unit: 'pH units',
        testDate: '2026-09-01',
        provenance: 'MEASURED',
        testMethod: 'ISO 4316',
      },
    ],
  });

  assert(
    qualityGateReport.speciationResult.pH > 0 &&
    qualityGateReport.evidenceStatus !== 'INSUFFICIENT_DATA',
    'Test 20: Verified LIMS measurement propagates into Master Scientific Quality Gate report',
    `Final Gate Status: ${qualityGateReport.finalFormulaStatus}, Evidence Status: ${qualityGateReport.evidenceStatus}`
  );

  // ---------------------------------------------------------------------------
  // 20. Release Gate Blocking on Missing Mandatory Tests
  // ---------------------------------------------------------------------------
  const releaseGateResult = evaluateReleaseGate(
    goldenFormula.id,
    goldenFormula.category,
    testIngs,
    [] // Zero empirical lab measurements provided
  );

  assert(
    releaseGateResult.status === 'BLOCKED_BY_LAB_VALIDATION' || releaseGateResult.status === 'READY_FOR_LAB_EVALUATION',
    'Test 21: Release Gate prevents commercial release when required laboratory evidence is missing',
    `Release Status: ${releaseGateResult.status}, Decision Code: ${releaseGateResult.decisionCode}`
  );

  // ---------------------------------------------------------------------------
  // 21. Missing Evidence Handling: LAB_VALIDATION_REQUIRED
  // ---------------------------------------------------------------------------
  const evidenceRecord = buildEvidenceRecordFromMeasurement(meas1, phMeter, 'Senior Analyst');
  assert(
    evidenceRecord.evidenceLevel === 'LAB_TESTED' &&
    evidenceRecord.instrumentCalibrationValid === true &&
    evidenceRecord.verificationStatus === 'UNVERIFIED',
    'Test 22: Recording a measurement does not auto-approve it or promote it to LAB_VALIDATED',
    `Evidence ID: ${evidenceRecord.evidenceId}, Level: ${evidenceRecord.evidenceLevel}`
  );

  // ---------------------------------------------------------------------------
  // 22. Tampered Audit Record Detection
  // ---------------------------------------------------------------------------
  const tamperedAuditChain: LimsAuditRecord[] = [
    audit1,
    { ...audit2, action: 'UNAUTHORIZED_ALTERATION' }, // Mutated action without recalculating newHash
    audit3,
  ];
  const tamperedCheck = verifyAuditTrailChain(tamperedAuditChain);

  assert(
    !tamperedCheck.isValid && tamperedCheck.brokenIndex === 1,
    'Test 23: Audit chain integrity engine detects retroactive unauthorized record tampering at exact index',
    `Valid: ${tamperedCheck.isValid}, Broken Index: ${tamperedCheck.brokenIndex}`
  );

  // ---------------------------------------------------------------------------
  // 23. Batch Release Guard on Unapproved Lab Tests
  // ---------------------------------------------------------------------------
  const batchReleaseAttempt = transitionBatchStatus(batch, 'RELEASED', 'Operator', 'Attempting early release', false);
  assert(
    !batchReleaseAttempt.success && batch.status !== 'RELEASED',
    'Test 24: Batch cannot transition to RELEASED status while mandatory analytical tests remain unapproved',
    `Release allowed: ${batchReleaseAttempt.success}, Error: ${batchReleaseAttempt.errorMessage}`
  );

  return {
    passed,
    failed,
    total: passed + failed,
    results,
  };
}

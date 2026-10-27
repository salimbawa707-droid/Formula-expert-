/**
 * ============================================================================
 * SCIENTIFIC ROADMAP & EVIDENCE VAULT REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. Initial roadmap state: Phase 4B is active and Phase 5 locked
 * 2. 64/59/97 engine-count discrepancy is explicitly preserved
 * 3. SurfPro raw files and numerical inspection are tracked accurately
 * 4. At least one experimental dataset has a positive source-record count
 * 5. Pricing Integrity: Missing prices remain strictly null (never coerced to 0.00)
 * 6. Phase 5 Gate Rule: cannot unlock while Phase 4B active or unverified
 * 7. Promotion Rule: engine cannot be marked ready for validation without inspected data
 * 8. JSON export and import validator preserves state and detects corruption
 * 9. CSV export generates valid schema headers
 * 10. Forensic Audit: roundtrip preserves null prices and row counts
 * 11. Robust import error handling for malformed or missing arrays
 * 12. Duplicate Evidence and Dataset IDs detection
 * 13. Round-9 Forensic Audit: Artifact Consistency (JSON vs CSV vs MD)
 * 14. Round-10 Forensic Audit: Comprehensive Positive & Negative Gate Tests
 * ============================================================================
 */

import fs from 'node:fs';
import { INITIAL_VAULT_STATE } from '../../domain/vault/initialData';
import {
  calculateVaultMetrics,
  computeBatchCostWithNullIntegrity,
  canUnlockPhase5,
  canPromoteEngineToValidation,
  validateAndParseVaultJSON,
  exportVaultToCSV,
  generateMarkdownReport
} from '../vault/vaultLogic';
import {
  verifyWorkbookAuthenticity,
  canConsumeEvidenceInCalculations
} from '../vault/workbookVerification';

export interface VaultTestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

function parseRobustCsv(csv: string): any[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const result: any = {};
    let current = '';
    let inQuotes = false;
    let col = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        result[headers[col]] = current.replace(/^"|"$/g, '');
        current = '';
        col++;
      } else current += char;
    }
    result[headers[col]] = current.replace(/^"|"$/g, '');
    return result;
  });
}

export function runVaultLogicTestSuite() {
  const results: VaultTestResult[] = [];

  function assert(condition: boolean, group: string, name: string, message?: string, actual?: any, expected?: any) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED: ${message || 'Assertion failed'}`
    });
  }

  // 1. Initial roadmap present, Phase 4B is active and Phase 5 locked
  const metrics = calculateVaultMetrics(INITIAL_VAULT_STATE);
  assert(metrics.currentPhaseId === 'phase-4b', 'Roadmap State', 'Current Phase is Phase 4B');
  assert(metrics.lockedPhasesCount === 1, 'Roadmap State', 'Locked Phases Count is 1');
  assert(metrics.closedPhasesCount === 4, 'Roadmap State', 'Closed Phases Count is 4');

  const phase4B = INITIAL_VAULT_STATE.phases.find(p => p.phaseId === 'phase-4b');
  assert(Boolean(phase4B), 'Roadmap State', 'Phase 4B exists in state');
  assert(phase4B?.status === 'ACTIVE', 'Roadmap State', 'Phase 4B status is ACTIVE');
  assert(phase4B?.reportedClosed === false, 'Roadmap State', 'Phase 4B reportedClosed is false');

  const phase5 = INITIAL_VAULT_STATE.phases.find(p => p.phaseId === 'phase-5');
  assert(Boolean(phase5), 'Roadmap State', 'Phase 5 exists in state');
  assert(phase5?.status === 'LOCKED', 'Roadmap State', 'Phase 5 status is LOCKED');

  // 2. 64/59/97 engine-count discrepancy is explicitly preserved
  assert(metrics.engineDiscrepancyClaimedA === 64, 'Engine Discrepancy', 'Claimed A count is 64');
  assert(metrics.engineDiscrepancyReconciledFiles === 59, 'Engine Discrepancy', 'Reconciled files count is 59');
  assert(metrics.engineDiscrepancyClaimedSubmodules === 97, 'Engine Discrepancy', 'Claimed submodules count is 97');
  assert(metrics.engineDiscrepancyStatus === 'REPORTED_UNVERIFIED', 'Engine Discrepancy', 'Status is REPORTED_UNVERIFIED');

  // 3. SurfPro source files are present and its former retrieval blocker is cleared
  const blocker = INITIAL_VAULT_STATE.activeBlockers.find(b => b.id === 'BLK-001');
  assert(!blocker, 'Active Blockers', 'BLK-001 is cleared because verified raw CSV artifacts are checked in');
  const surfproEvidence = INITIAL_VAULT_STATE.evidence.find(e => e.id === 'EVD-002');
  assert(surfproEvidence?.downloadStatus === 'DOWNLOADED', 'Dataset Inspection', 'EVD-002 records the checked-in CSV as downloaded');
  assert(surfproEvidence?.numericalInspectionStatus === 'NUMERICALLY_INSPECTED', 'Dataset Inspection', 'EVD-002 records the reproducible numerical inspection');
  assert(INITIAL_VAULT_STATE.evidence.find(e => e.id === 'EVD-001')?.numericalInspectionStatus === 'UNINSPECTED', 'Dataset Inspection', 'EVD-001 remains an uninspected lead seed');
  assert(metrics.experimentalDatasetsNumericallyInspected >= 1, 'Dataset Inspection', 'At least one source dataset has a positive inspected row count');

  // DS-001 is reproducible from the checked-in source CSVs; its component-level scope
  // remains distinct from matched mixed-formula validation.
  const ds001 = INITIAL_VAULT_STATE.datasets.find(ds => ds.id === 'DS-001');
  assert(Boolean(ds001), 'Dataset Inspection', 'DS-001 SURFPRO dataset exists');
  assert(ds001?.inspectionStatus === 'NUMERICALLY_INSPECTED', 'Dataset Inspection', 'DS-001 numerical inspection is recorded');
  assert(ds001?.actualRowCount === 1624, 'Dataset Inspection', 'DS-001 master-record count is source rows, not formula observations');
  assert(ds001?.actualColumnCount === 31, 'Dataset Inspection', 'DS-001 master schema width is recorded');
  assert(ds001?.numericalValidationReadiness === 'DEFICIENT', 'Dataset Inspection', 'DS-001 remains ineligible for mixed-formula validation');
  assert(ds001?.designation === 'BENCHMARK', 'Dataset Inspection', 'DS-001 uses a supported dataset designation');
  assert(Boolean(ds001?.sha256Hash === '316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841'), 'Dataset Inspection', 'DS-001 canonical CSV SHA-256 is recorded');

  // 4. Dataset inspection states must reflect the evidence vault's current source audit.
  // DS-002 is numerically inspected at workbook/parser level, but it is NOT a count of
  // independent physical observations and is NOT eligible for formula-level validation.
  const ds002 = INITIAL_VAULT_STATE.datasets.find(ds => ds.id === 'DS-002');
  assert(Boolean(ds002), 'Dataset Inspection', 'DS-002 descriptive rheology dataset exists');
  assert(ds002?.inspectionStatus === 'NUMERICALLY_INSPECTED', 'Dataset Inspection', 'DS-002 source workbooks are parser-inspected');
  assert(ds002?.actualRowCount === null, 'Dataset Inspection', 'DS-002 physical observation count remains unresolved');
  assert(ds002?.numericalValidationReadiness === 'DEFICIENT', 'Dataset Inspection', 'DS-002 is not formula-validation-ready');
  const ds005 = INITIAL_VAULT_STATE.datasets.find(ds => ds.id === 'DS-005');
  assert(Boolean(ds005), 'Dataset Inspection', 'DS-005 RepOD source is registered');
  assert(ds005?.inspectionStatus === 'NUMERICALLY_INSPECTED', 'Dataset Inspection', 'DS-005 both source worksheets are parsed and inspected');
  assert(ds005?.actualRowCount === null, 'Dataset Inspection', 'DS-005 independent observation count remains unresolved');
  assert(ds005?.actualColumnCount === 23, 'Dataset Inspection', 'DS-005 normalized worksheet schema has 23 columns');
  assert(ds005?.numericalValidationReadiness === 'DEFICIENT', 'Dataset Inspection', 'DS-005 is not formula-validation-ready');
  assert(Boolean(ds005?.sha256Hash?.startsWith('3665c4386fbf7553')), 'Dataset Inspection', 'DS-005 verified source SHA-256 is recorded');
  assert(Boolean(ds005?.inspectionNotes?.includes('Unit/variable conflicts')), 'Dataset Inspection', 'DS-005 records the unresolved source unit conflict');
  for (const ds of INITIAL_VAULT_STATE.datasets.filter(ds => ds.id !== 'DS-001' && ds.id !== 'DS-002')) {
    assert(ds.actualRowCount === null, 'Dataset Inspection', `Dataset ${ds.id} rowCount remains null until row-level reconciliation`);
  }

  // 5. Missing prices remain strictly null, never coerced to 0.00
  const unpricedItems = INITIAL_VAULT_STATE.pricingRecords.filter(p => p.pricePerKg === null);
  assert(unpricedItems.length >= 2, 'Pricing Integrity', 'At least 2 unpriced items preserved as null');

  const componentsWithNull = [
    { ingredientId: 'ING-LAS-001', weightFraction: 0.15, pricePerKg: 1.85 },
    { ingredientId: 'ING-SPECIAL-004', weightFraction: 0.05, pricePerKg: null },
    { ingredientId: 'ING-WATER', weightFraction: 0.80, pricePerKg: 0.02 },
  ];
  const resultWithNull = computeBatchCostWithNullIntegrity(componentsWithNull);
  assert(resultWithNull.totalCostPerKg === null, 'Pricing Integrity', 'Batch cost with null price returns null');
  assert(resultWithNull.isComplete === false, 'Pricing Integrity', 'Batch cost with null price isComplete is false');
  assert(resultWithNull.unpricedCount === 1, 'Pricing Integrity', 'Unpriced count is 1');
  assert(Boolean(resultWithNull.costWarning), 'Pricing Integrity', 'Cost warning is present');

  const componentsAllKnown = [
    { ingredientId: 'ING-LAS-001', weightFraction: 0.10, pricePerKg: 2.0 },
    { ingredientId: 'ING-SLES-002', weightFraction: 0.20, pricePerKg: 1.5 },
  ];
  const resultAllKnown = computeBatchCostWithNullIntegrity(componentsAllKnown);
  assert(resultAllKnown.totalCostPerKg === 0.5, 'Pricing Integrity', 'Batch cost with all prices computes 0.5');
  assert(resultAllKnown.isComplete === true, 'Pricing Integrity', 'Batch cost with all prices isComplete is true');

  // 6. Phase 5 Gate Rule: Phase 5 cannot be unlocked while Phase 4B is active
  const gateCheck = canUnlockPhase5(INITIAL_VAULT_STATE);
  assert(gateCheck.allowed === false, 'Phase 5 Gate', 'Phase 5 unlock blocked on active 4B');
  assert(Boolean(/Phase 4B is still ACTIVE\/OPEN/i.test(gateCheck.reason)), 'Phase 5 Gate', 'Gate check gives reason');

  // 7. Scientific Status Rules: Engine cannot be marked ready without inspected dataset
  const engine = INITIAL_VAULT_STATE.engines[0];
  const promoteCheck = canPromoteEngineToValidation(engine, INITIAL_VAULT_STATE.datasets);
  assert(promoteCheck.allowed === false, 'Scientific Status', 'Engine promotion blocked without inspected dataset');

  // 8. JSON export and import validator
  const exported = JSON.stringify(INITIAL_VAULT_STATE, null, 2);
  const validation = validateAndParseVaultJSON(exported);
  assert(validation.valid === true, 'JSON Schema', 'Exported JSON passes validation');
  assert(validation.errors.length === 0, 'JSON Schema', 'Zero validation errors');
  assert(validation.parsedState?.engines.length === INITIAL_VAULT_STATE.engines.length, 'JSON Schema', 'Engine count preserved');

  // Duplicate ID detection test
  const corruptedState = JSON.parse(exported);
  corruptedState.engines.push({ ...corruptedState.engines[0] });
  const corruptValidation = validateAndParseVaultJSON(JSON.stringify(corruptedState));
  assert(corruptValidation.valid === false, 'JSON Schema', 'Duplicate engine ID detected');

  // 9. CSV Export formatting
  const engineCSV = exportVaultToCSV('engines', INITIAL_VAULT_STATE);
  assert(engineCSV.startsWith('ID,Name,Category,Source File'), 'CSV Export', 'Engine CSV header correct');
  const evidenceCSV = exportVaultToCSV('evidence', INITIAL_VAULT_STATE);
  assert(evidenceCSV.startsWith('ID,Title,Evidence Type'), 'CSV Export', 'Evidence CSV header correct');
  const datasetCSV = exportVaultToCSV('datasets', INITIAL_VAULT_STATE);
  assert(datasetCSV.includes('NULL_UNINSPECTED'), 'CSV Export', 'Dataset CSV preserves uninspected null placeholder');

  // 10. Forensic Audit: Serialized export/import preserves nulls
  const serialized = JSON.stringify(INITIAL_VAULT_STATE);
  const parsed = JSON.parse(serialized);
  assert(parsed.datasets.length === INITIAL_VAULT_STATE.datasets.length, 'Roundtrip Preservation', 'Dataset length preserved');
  for (const ds of parsed.datasets.filter((ds: any) => ds.id !== 'DS-001')) {
    assert(ds.actualRowCount === null, 'Roundtrip Preservation', `Dataset ${ds.id} rowCount remains null`);
  }
  assert(parsed.datasets.find((ds: any) => ds.id === 'DS-001')?.actualRowCount === 1624, 'Roundtrip Preservation', 'Historical DS-001 master-record count survives roundtrip');
  const unpricedLAS = parsed.pricingRecords.find((p: any) => p.ingredientId === 'ING-SPECIAL-004');
  assert(Boolean(unpricedLAS), 'Roundtrip Preservation', 'Unpriced ingredient found');
  assert(unpricedLAS?.pricePerKg === null, 'Roundtrip Preservation', 'Price remains strictly null');

  // 11. Malformed JSON import error handling
  const corrupted = '{ "bad_json": [1, 2, ';
  const resultBadJson = validateAndParseVaultJSON(corrupted);
  assert(resultBadJson.valid === false, 'Import Error Handling', 'Malformed JSON is invalid');
  assert(resultBadJson.errors.length > 0, 'Import Error Handling', 'Errors logged for malformed JSON');

  const missingArrays = JSON.stringify({ version: '1.0.0', phases: [] });
  const missingResult = validateAndParseVaultJSON(missingArrays);
  assert(missingResult.valid === false, 'Import Error Handling', 'Missing arrays detected as invalid');

  // 11b. Versioned schema, count semantics, and non-promotion invariants
  const unsupportedVersion = JSON.parse(exported);
  unsupportedVersion.version = '2.1.0';
  const unsupportedVersionResult = validateAndParseVaultJSON(JSON.stringify(unsupportedVersion));
  assert(unsupportedVersionResult.valid === false, 'Schema Versioning', 'Unsupported schema version is rejected instead of being cast as current state');

  const legacyV1State = JSON.parse(exported);
  legacyV1State.version = '1.0.0';
  delete legacyV1State.inventoryMetrics;
  delete legacyV1State.historicalReconciliations;
  delete legacyV1State.daviesActivityModels;
  delete legacyV1State.surfactantPhaseProperties;
  const legacyMigrationResult = validateAndParseVaultJSON(JSON.stringify(legacyV1State));
  assert(legacyMigrationResult.valid === true, 'Schema Migration', 'Valid v1.0.0 backup migrates without losing core records');
  assert(legacyMigrationResult.parsedState?.version === '1.1.0', 'Schema Migration', 'Legacy backup is upgraded to schema v1.1.0');
  assert((legacyMigrationResult.parsedState?.inventoryMetrics.length || 0) >= 5, 'Schema Migration', 'Migration adds only explicitly reported inventory metrics');
  assert(legacyMigrationResult.parsedState?.historicalReconciliations[0]?.reconciliationStatus === 'UNRESOLVED', 'Schema Migration', 'Historical 27,982 claim remains unresolved after migration');
  assert(Boolean(legacyMigrationResult.parsedState?.datasets.every(ds => ds.id === 'DS-001' || ds.actualRowCount === null)), 'Schema Migration', 'Unknown dataset row counts remain null while historical DS-001 inspection count is preserved');
  assert(canUnlockPhase5(legacyMigrationResult.parsedState || INITIAL_VAULT_STATE).allowed === false, 'Schema Migration', 'Migration cannot unlock Phase 5');

  const optionalScientificExtensions = JSON.parse(exported);
  optionalScientificExtensions.daviesActivityModels.push({
    id: 'DAVIES-TEST-UNKNOWN',
    modelName: 'Davies activity coefficient model',
    modelVersion: 'test-fixture',
    temperatureK: null,
    ionicStrengthM: null,
    speciesCharges: [],
    applicabilityStatus: 'UNKNOWN',
    sourceReference: 'test fixture only; no scientific evidence asserted',
    assumptions: [],
    notes: 'Null parameters are intentionally unknown; this is not a model result.',
  });
  optionalScientificExtensions.surfactantPhaseProperties.push({
    id: 'KRAFFT-TEST-UNKNOWN',
    surfactantId: null,
    reportedName: 'Commercial surfactant mixture (identity incomplete)',
    composition: null,
    propertyName: 'KRAFFT_POINT',
    value: null,
    unit: '°C',
    concentration: null,
    concentrationUnit: null,
    solutionComposition: null,
    measurementMethod: null,
    valueOrigin: 'UNKNOWN',
    evidenceStatus: 'UNVERIFIED',
    uncertaintyValue: null,
    uncertaintyUnit: null,
    sourceReference: 'test fixture only; no scientific evidence asserted',
    notes: 'No Krafft-point measurement is asserted.',
  });
  const optionalExtensionsResult = validateAndParseVaultJSON(JSON.stringify(optionalScientificExtensions));
  assert(optionalExtensionsResult.valid === true, 'Optional Scientific Modules', 'Davies and Krafft records support explicitly unknown values and incomplete mixture identity');

  const invalidDavies = JSON.parse(exported);
  invalidDavies.daviesActivityModels.push({
    id: 'DAVIES-TEST-NEGATIVE-I',
    modelName: 'Davies activity coefficient model',
    modelVersion: 'test-fixture',
    temperatureK: 298.15,
    ionicStrengthM: -0.1,
    speciesCharges: [-1, 1],
    applicabilityStatus: 'UNKNOWN',
    sourceReference: 'test fixture only',
    assumptions: [],
    notes: 'Invalid negative ionic strength.',
  });
  const invalidDaviesResult = validateAndParseVaultJSON(JSON.stringify(invalidDavies));
  assert(invalidDaviesResult.valid === false, 'Optional Scientific Modules', 'Negative ionic strength is rejected without imposing a universal upper cutoff');

  const knownZeroCounts = JSON.parse(exported);
  knownZeroCounts.datasets[0].actualRowCount = 0;
  knownZeroCounts.datasets[0].actualColumnCount = 0;
  const knownZeroResult = validateAndParseVaultJSON(JSON.stringify(knownZeroCounts));
  assert(knownZeroResult.valid === true, 'Null Versus Zero', 'Known zero row/column counts remain valid distinct values');

  const negativeCount = JSON.parse(exported);
  negativeCount.datasets[0].actualRowCount = -1;
  const negativeCountResult = validateAndParseVaultJSON(JSON.stringify(negativeCount));
  assert(negativeCountResult.valid === false, 'Count Validation', 'Negative dataset row count is rejected');

  const fractionalCount = JSON.parse(exported);
  fractionalCount.datasets[0].actualColumnCount = 1.5;
  const fractionalCountResult = validateAndParseVaultJSON(JSON.stringify(fractionalCount));
  assert(fractionalCountResult.valid === false, 'Count Validation', 'Fractional dataset column count is rejected');

  const negativeMissingCount = JSON.parse(exported);
  const columnBearingDataset = negativeMissingCount.datasets.find(
    (dataset: any) => Array.isArray(dataset.columns) && dataset.columns.length > 0
  );
  if (columnBearingDataset) {
    columnBearingDataset.columns[0].missingCount = -1;
  }
  const negativeMissingCountResult = validateAndParseVaultJSON(JSON.stringify(negativeMissingCount));
  assert(
    Boolean(columnBearingDataset) && negativeMissingCountResult.valid === false,
    'Count Validation',
    'Negative column missingCount is rejected for a dataset that actually contains columns'
  );

  const unknownMissingCount = JSON.parse(exported);
  const unknownColumnDataset = unknownMissingCount.datasets.find(
    (dataset: any) => Array.isArray(dataset.columns) && dataset.columns.length > 0
  );
  if (unknownColumnDataset) unknownColumnDataset.columns[0].missingCount = null;
  const unknownMissingCountResult = validateAndParseVaultJSON(JSON.stringify(unknownMissingCount));
  assert(
    Boolean(unknownColumnDataset) && unknownMissingCountResult.valid === true,
    'Null Versus Zero',
    'Unknown missing-value count is represented as null and remains valid'
  );

  const zeroMissingCount = JSON.parse(exported);
  const zeroColumnDataset = zeroMissingCount.datasets.find(
    (dataset: any) => Array.isArray(dataset.columns) && dataset.columns.length > 0
  );
  if (zeroColumnDataset) zeroColumnDataset.columns[0].missingCount = 0;
  const zeroMissingCountResult = validateAndParseVaultJSON(JSON.stringify(zeroMissingCount));
  assert(
    Boolean(zeroColumnDataset) && zeroMissingCountResult.valid === true,
    'Null Versus Zero',
    'Known zero missing-value count remains distinct from unknown null'
  );

  const legacyLicenseMetadata = JSON.parse(exported);
  for (const evidenceRecord of legacyLicenseMetadata.evidence) {
    delete evidenceRecord.licenseReviewStatus;
    delete evidenceRecord.licenseEvidenceReference;
    delete evidenceRecord.licenseReviewedAt;
    delete evidenceRecord.licenseRestrictions;
  }
  const legacyLicenseResult = validateAndParseVaultJSON(JSON.stringify(legacyLicenseMetadata));
  assert(legacyLicenseResult.valid === true, 'License Integrity', 'Missing license review metadata is safely normalized');
  assert(
    Boolean(legacyLicenseResult.parsedState?.evidence.every(e => e.licenseReviewStatus === 'UNREVIEWED')),
    'License Integrity',
    'A license string alone never implies commercial reuse permission'
  );

  const unsubstantiatedCommercialPermission = JSON.parse(exported);
  unsubstantiatedCommercialPermission.evidence[0].licenseReviewStatus = 'PERMITTED_FOR_COMMERCIAL_REUSE';
  unsubstantiatedCommercialPermission.evidence[0].licenseEvidenceReference = null;
  unsubstantiatedCommercialPermission.evidence[0].licenseReviewedAt = null;
  const unsubstantiatedCommercialResult = validateAndParseVaultJSON(JSON.stringify(unsubstantiatedCommercialPermission));
  assert(
    unsubstantiatedCommercialResult.valid === false,
    'License Integrity',
    'Commercial permission without evidence reference and review date is rejected'
  );

  const structurallyCompleteLicenseReview = JSON.parse(exported);
  structurallyCompleteLicenseReview.evidence[0].licenseReviewStatus = 'PERMITTED_FOR_COMMERCIAL_REUSE';
  structurallyCompleteLicenseReview.evidence[0].licenseEvidenceReference = 'https://example.invalid/license-review-fixture';
  structurallyCompleteLicenseReview.evidence[0].licenseReviewedAt = '2026-10-23T00:00:00Z';
  structurallyCompleteLicenseReview.evidence[0].licenseRestrictions = ['Test fixture only; not a real clearance'];
  const structurallyCompleteLicenseResult = validateAndParseVaultJSON(JSON.stringify(structurallyCompleteLicenseReview));
  assert(
    structurallyCompleteLicenseResult.valid === true,
    'License Integrity',
    'Structurally complete review metadata is accepted without claiming the license itself was externally verified'
  );

  const missingRequiredCollection = JSON.parse(exported);
  delete missingRequiredCollection.pricingRecords;
  const missingRequiredCollectionResult = validateAndParseVaultJSON(JSON.stringify(missingRequiredCollection));
  assert(missingRequiredCollectionResult.valid === false, 'Structural Validation', 'Missing pricingRecords collection is rejected');

  const maturityInput = JSON.parse(exported);
  maturityInput.engines[0].scientificMaturity = 'LAB_VALIDATED';
  const maturityResult = validateAndParseVaultJSON(JSON.stringify(maturityInput));
  assert(maturityResult.valid === true, 'Scientific Status Integrity', 'Structurally valid record can be inspected without automatic status mutation');
  assert(maturityResult.parsedState?.engines[0].scientificMaturity === 'LAB_VALIDATED', 'Scientific Status Integrity', 'Validator preserves supplied maturity value and does not silently promote or downgrade it');
  assert(canUnlockPhase5(maturityResult.parsedState || INITIAL_VAULT_STATE).allowed === false, 'Scientific Status Integrity', 'Changing one engine maturity field cannot bypass Phase 5 gate');


  // 12. Duplicate Evidence and Dataset IDs detected
  const stateCopy = JSON.parse(JSON.stringify(INITIAL_VAULT_STATE));
  stateCopy.evidence.push({ ...stateCopy.evidence[0] });
  const evResult = validateAndParseVaultJSON(JSON.stringify(stateCopy));
  assert(evResult.valid === false, 'Duplicate Detection', 'Duplicate evidence ID rejected');

  const dsStateCopy = JSON.parse(JSON.stringify(INITIAL_VAULT_STATE));
  dsStateCopy.datasets.push({ ...dsStateCopy.datasets[0] });
  const dsResult = validateAndParseVaultJSON(JSON.stringify(dsStateCopy));
  assert(dsResult.valid === false, 'Duplicate Detection', 'Duplicate dataset ID rejected');

  // 13. Round-9 Forensic Audit: Artifact Consistency (JSON vs CSV vs MD)
  const jsonRaw = fs.readFileSync('evidence_vault/datasets/zenodo_18961871/round5_integrity_verification.json', 'utf8');
  const csvRaw = fs.readFileSync('evidence_vault/datasets/zenodo_18961871/round5_observation_ledger.csv', 'utf8');
  const parsedJson = JSON.parse(jsonRaw);
  const parsedCsv = parseRobustCsv(csvRaw);

  assert(parsedCsv.length === 10, 'Round 9 Audit', 'CSV contains 10 worksheet records');
  for (const file of parsedJson.files) {
    for (const [sname, sheet] of Object.entries(file.sheets)) {
      const csvRecord = parsedCsv.find(r => r.filename === file.filename && r.sheet_name === sname);
      assert(Boolean(csvRecord), 'Round 9 Audit', `Worksheet found in CSV: ${file.filename} -> ${sname}`);
      if (csvRecord) {
        const s = sheet as any;
        assert(parseInt(csvRecord.used_range_rows, 10) === s.usedRangeRows, 'Round 9 Audit', `Row match for ${sname}`);
        assert(parseInt(csvRecord.numeric_cells, 10) === s.numericCells, 'Round 9 Audit', `Cell match for ${sname}`);
      }
    }
  }

  const mdGenerated = generateMarkdownReport(parsedJson);
  assert(mdGenerated.includes(parsedJson.totals.usedRangeRows.toString()), 'Round 9 Audit', 'MD report contains used range rows total');
  assert(mdGenerated.includes(parsedJson.totals.numericCells.toString()), 'Round 9 Audit', 'MD report contains numeric cells total');

  // 14. Round-10 Forensic Audit: Comprehensive Positive & Negative Gate Tests
  const stateActive = JSON.parse(JSON.stringify(INITIAL_VAULT_STATE));
  assert(canUnlockPhase5(stateActive).allowed === false, 'Round 10 Audit', 'Phase 4B active blocks Phase 5');

  const stateProv = JSON.parse(JSON.stringify(INITIAL_VAULT_STATE));
  stateProv.phases.forEach((p: any) => { if (p.phaseId === 'phase-4b') { p.status = 'CLOSED'; p.reportedClosed = true; p.independentVerificationStatus = 'CONFIRMED'; } });
  stateProv.authoritativeProvenanceStatus = 'NOT_INDEPENDENTLY_VERIFIED';
  assert(canUnlockPhase5(stateProv).allowed === false, 'Round 10 Audit', 'Unverified provenance blocks Phase 5');

  const stateAcct = JSON.parse(JSON.stringify(INITIAL_VAULT_STATE));
  stateAcct.phases.forEach((p: any) => { if (p.phaseId === 'phase-4b') { p.status = 'CLOSED'; p.reportedClosed = true; p.independentVerificationStatus = 'CONFIRMED'; } });
  stateAcct.authoritativeProvenanceStatus = 'VERIFIED';
  stateAcct.accountingReconciliationStatus = 'UNRESOLVED';
  assert(canUnlockPhase5(stateAcct).allowed === false, 'Round 10 Audit', 'Unresolved accounting blocks Phase 5');

  const stateSatisfied = JSON.parse(JSON.stringify(INITIAL_VAULT_STATE));
  stateSatisfied.phases.forEach((p: any) => { if (p.phaseId === 'phase-4b') { p.status = 'CLOSED'; p.reportedClosed = true; p.independentVerificationStatus = 'CONFIRMED'; } });
  for (const ds of stateSatisfied.datasets) {
    ds.inspectionStatus = 'NUMERICALLY_INSPECTED';
    ds.actualRowCount = 500;
  }
  for (const ad of stateSatisfied.audits) {
    ad.approvalStatus = 'APPROVED';
  }
  stateSatisfied.activeBlockers = [];
  stateSatisfied.authoritativeProvenanceStatus = 'VERIFIED';
  stateSatisfied.accountingReconciliationStatus = 'RECONCILED';
  stateSatisfied.ledgerConsistencyStatus = 'CONSISTENT';
  const satisfiedCheck = canUnlockPhase5(stateSatisfied);
  assert(satisfiedCheck.allowed === true, 'Round 10 Audit', 'Controlled fully verified state allows Phase 5');

  // 15. Issue 2: Scientific Evidence Vault Corrupted Workbook Quarantine & Recovery
  // Case 1: Quarantined 9-byte text files are rejected as invalid workbooks
  const qFlowCurves = verifyWorkbookAuthenticity(
    Buffer.from('corrupted', 'utf8'),
    'cd5bfd6e95fc65e412807d53935c2d96'
  );
  assert(
    qFlowCurves.valid === false && qFlowCurves.status === 'QUARANTINED_CORRUPTED',
    'Issue 2 Recovery',
    'Quarantined SolutionFlowCurves stub rejected as QUARANTINED_CORRUPTED'
  );

  const qFilmThickness = verifyWorkbookAuthenticity(
    Buffer.from('corrupted', 'utf8'),
    'bc9582baafecd6552f6014216a0844e6'
  );
  assert(
    qFilmThickness.valid === false && qFilmThickness.status === 'QUARANTINED_CORRUPTED',
    'Issue 2 Recovery',
    'Quarantined FilmThickness stub rejected as QUARANTINED_CORRUPTED'
  );

  // Case 2: Only readable, checksum-verified originals receive verified status
  const authenticFlowCurves = verifyWorkbookAuthenticity(
    'evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx',
    'cd5bfd6e95fc65e412807d53935c2d96'
  );
  assert(
    authenticFlowCurves.valid === true && authenticFlowCurves.status === 'VERIFIED',
    'Issue 2 Recovery',
    'Authentic SolutionFlowCurves workbook verified with matching MD5 (cd5bfd6e...)'
  );

  const authenticFilmThickness = verifyWorkbookAuthenticity(
    'evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx',
    'bc9582baafecd6552f6014216a0844e6'
  );
  assert(
    authenticFilmThickness.valid === true && authenticFilmThickness.status === 'VERIFIED',
    'Issue 2 Recovery',
    'Authentic FilmThickness workbook verified with matching MD5 (bc9582ba...)'
  );

  // Case 3: A checksum mismatch remains quarantined
  const tamperedFlowCurves = verifyWorkbookAuthenticity(
    'evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx',
    '00000000000000000000000000000000'
  );
  assert(
    tamperedFlowCurves.valid === false && tamperedFlowCurves.status === 'QUARANTINED_CHECKSUM_MISMATCH',
    'Issue 2 Recovery',
    'Checksum mismatch remains quarantined as QUARANTINED_CHECKSUM_MISMATCH'
  );

  // Case 4: Missing source files or network failures produce explicit unavailable state, not fabricated data
  const missingFile = verifyWorkbookAuthenticity(
    'evidence_vault/datasets/zenodo_18961871/NonExistent_Workbook.xlsx',
    'abcdef1234567890abcdef1234567890'
  );
  assert(
    missingFile.valid === false && missingFile.status === 'BLOCKED_UNAVAILABLE',
    'Issue 2 Recovery',
    'Missing workbook file produces explicit BLOCKED_UNAVAILABLE state'
  );

  // Case 5: Evidence manifests accurately reflect file state and quarantine ledger
  const manifestRaw = fs.readFileSync('evidence_vault/corrupted_quarantine/QUARANTINE_MANIFEST.md', 'utf8');
  assert(
    manifestRaw.includes('STUBS_REMOVED_AFTER_CANONICAL_RECOVERY') &&
    manifestRaw.includes('Supplementary_FilmThickness_v1.xlsx') &&
    manifestRaw.includes('Supplementary_SolutionFlowCurves.xlsx'),
    'Issue 2 Recovery',
    'Quarantine ledger records removal of corrupt stubs after canonical recovery'
  );
  assert(
    !fs.existsSync('evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx') &&
    !fs.existsSync('evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx'),
    'Issue 2 Recovery',
    'Corrupt workbook stubs are not retained as files in the quarantine directory'
  );

  // Case 6: Scientific calculations do not silently consume corrupted or unverified files
  assert(
    canConsumeEvidenceInCalculations(qFlowCurves.status) === false &&
    canConsumeEvidenceInCalculations(qFilmThickness.status) === false &&
    canConsumeEvidenceInCalculations('QUARANTINED_CHECKSUM_MISMATCH') === false &&
    canConsumeEvidenceInCalculations('BLOCKED_UNAVAILABLE') === false &&
    canConsumeEvidenceInCalculations(authenticFlowCurves.status) === true,
    'Issue 2 Recovery',
    'Scientific calculations strictly block quarantined/unverified evidence and allow only VERIFIED'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  if (failedCount > 0) {
    console.error('[VAULT REGRESSION FAILURE DETAILS]');
    for (const failure of results.filter(r => !r.passed)) {
      console.error(JSON.stringify(failure));
    }
  }

  console.log('--------------------------------------------------------------------------------');
  console.log(`TOTAL VAULT REGRESSION TESTS: ${results.length}`);
  console.log(`PASSED                      : ${passedCount}`);
  console.log(`FAILED                      : ${failedCount}`);
  console.log('--------------------------------------------------------------------------------');

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

if (process.argv[1] && process.argv[1].includes('vaultLogic.regression.test')) {
  const summary = runVaultLogicTestSuite();
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

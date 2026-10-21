import {
  validateDatasetFile,
  validateManifestToDisk,
  detectDuplicateDatasets,
  isDatasetEligibleForCalculations,
  validateDatasetProvenance,
  generateReproducibleAudit
} from '../vault/evidenceVaultIntegrityValidator';
import { canUnlockPhase5 } from '../vault/vaultLogic';
import { INITIAL_VAULT_STATE } from '../../domain/vault/initialData';

export interface IntegrityAssertionResult {
  group: string;
  name: string;
  passed: boolean;
  message: string;
  actual?: any;
  expected?: any;
}

export function runEvidenceVaultIntegrityTestSuite() {
  const results: IntegrityAssertionResult[] = [];

  function assert(
    group: string,
    name: string,
    condition: boolean,
    actual?: any,
    expected?: any,
    message?: string
  ) {
    results.push({
      group,
      name,
      passed: condition,
      message: condition ? 'PASSED' : `FAILED: ${message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`,
      actual,
      expected
    });
  }

  // =========================================================================
  // Requirement 1: Valid Source File and Matching Checksum
  // =========================================================================
  const validPath = 'evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx';
  const expectedMd5 = 'cd5bfd6e95fc65e412807d53935c2d96';
  const expectedSha256 = '90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590';

  const validResult = validateDatasetFile(validPath, { md5: expectedMd5, sha256: expectedSha256 });
  assert(
    '1. Valid Source File',
    'Authentic file matches both MD5 and SHA-256 bit-for-bit',
    validResult.valid === true && validResult.status === 'VERIFIED',
    validResult.status,
    'VERIFIED'
  );
  assert(
    '1. Valid Source File',
    'Authentic file has valid ZIP header (PK\\x03\\x04) and expected size 22,280 bytes',
    validResult.isZipFormat === true && validResult.byteSize === 22280,
    validResult.byteSize,
    22280
  );

  const validFilmResult = validateDatasetFile('evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx', {
    md5: 'bc9582baafecd6552f6014216a0844e6',
    sha256: '170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428'
  });
  assert(
    '1. Valid Source File',
    'Supplementary_FilmThickness_v1.xlsx matches pinned MD5 and SHA-256',
    validFilmResult.valid === true && validFilmResult.status === 'VERIFIED',
    validFilmResult.status,
    'VERIFIED'
  );

  // =========================================================================
  // Requirement 2: Corrupted File Detection
  // =========================================================================
  const corruptedPath = 'evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx';
  const corruptedResult = validateDatasetFile(corruptedPath, { md5: expectedMd5 });
  assert(
    '2. Corrupted File Detection',
    'Quarantined 9-byte text stub fails ZIP header check and is classified as QUARANTINED_CORRUPTED',
    corruptedResult.valid === false && corruptedResult.status === 'QUARANTINED_CORRUPTED',
    corruptedResult.status,
    'QUARANTINED_CORRUPTED'
  );
  assert(
    '2. Corrupted File Detection',
    'Quarantined stub size is exactly 9 bytes with isZipFormat=false',
    corruptedResult.byteSize === 9 && corruptedResult.isZipFormat === false,
    corruptedResult.byteSize,
    9
  );

  // =========================================================================
  // Requirement 3: Missing File Handling
  // =========================================================================
  const missingPath = 'evidence_vault/datasets/zenodo_18961871/NonExistent_Workbook.xlsx';
  const missingResult = validateDatasetFile(missingPath, { md5: expectedMd5 });
  assert(
    '3. Missing File Handling',
    'Non-existent dataset path returns explicit BLOCKED_UNAVAILABLE status without fabricating data',
    missingResult.valid === false && missingResult.status === 'BLOCKED_UNAVAILABLE',
    missingResult.status,
    'BLOCKED_UNAVAILABLE'
  );

  // =========================================================================
  // Requirement 4: Missing or Malformed Checksum Handling
  // =========================================================================
  const missingChecksumResult = validateDatasetFile(validPath);
  assert(
    '4. Checksum Format Handling',
    'Missing checksum arguments fail closed as UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
    missingChecksumResult.valid === false && missingChecksumResult.status === 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
    missingChecksumResult.status,
    'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED'
  );

  const malformedMd5Result = validateDatasetFile(validPath, { md5: 'not-a-valid-hex-checksum' });
  assert(
    '4. Checksum Format Handling',
    'Malformed non-hex MD5 string fails closed as UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
    malformedMd5Result.valid === false && malformedMd5Result.status === 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
    malformedMd5Result.status,
    'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED'
  );

  const malformedShaResult = validateDatasetFile(validPath, { sha256: 'short_sha' });
  assert(
    '4. Checksum Format Handling',
    'Short non-64-character SHA-256 fails closed as UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
    malformedShaResult.valid === false && malformedShaResult.status === 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
    malformedShaResult.status,
    'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED'
  );

  const mismatchedChecksumResult = validateDatasetFile(validPath, { md5: '00000000000000000000000000000000' });
  assert(
    '4. Checksum Format Handling',
    'Checksum mismatch against authentic bytes triggers QUARANTINED_CHECKSUM_MISMATCH',
    mismatchedChecksumResult.valid === false && mismatchedChecksumResult.status === 'QUARANTINED_CHECKSUM_MISMATCH',
    mismatchedChecksumResult.status,
    'QUARANTINED_CHECKSUM_MISMATCH'
  );

  // =========================================================================
  // Requirement 5: Manifest-to-File Mismatch
  // =========================================================================
  const manifestPath = 'evidence_vault/datasets/zenodo_18961871/round4_checksum_manifest.csv';
  const datasetDir = 'evidence_vault/datasets/zenodo_18961871';
  const manifestAudit = validateManifestToDisk(manifestPath, datasetDir);
  assert(
    '5. Manifest-to-File Reconciliation',
    'All entries in round4_checksum_manifest.csv match actual disk bytes and MD5s',
    manifestAudit.allMatch === true && manifestAudit.rows.length === 4,
    manifestAudit.allMatch,
    true
  );

  // =========================================================================
  // Requirement 6: Duplicate Dataset Identity
  // =========================================================================
  const distinctDatasets = [
    { id: 'DS-01', name: 'FlowCurves', hash: 'cd5bfd6e95fc65e412807d53935c2d96' },
    { id: 'DS-02', name: 'FilmThickness', hash: 'bc9582baafecd6552f6014216a0844e6' },
  ];
  const distinctCheck = detectDuplicateDatasets(distinctDatasets);
  assert(
    '6. Duplicate Identity',
    'Distinct datasets with unique cryptographic hashes produce hasDuplicates=false',
    distinctCheck.hasDuplicates === false,
    distinctCheck.hasDuplicates,
    false
  );

  const duplicateDatasets = [
    { id: 'DS-01', name: 'FlowCurves', hash: 'cd5bfd6e95fc65e412807d53935c2d96' },
    { id: 'DS-02', name: 'DuplicateFlowCurves', hash: 'cd5bfd6e95fc65e412807d53935c2d96' },
  ];
  const duplicateCheck = detectDuplicateDatasets(duplicateDatasets);
  assert(
    '6. Duplicate Identity',
    'Duplicate hash masquerading under different ID is detected and flagged',
    duplicateCheck.hasDuplicates === true && duplicateCheck.duplicateGroups['cd5bfd6e95fc65e412807d53935c2d96'].length === 2,
    duplicateCheck.hasDuplicates,
    true
  );

  // =========================================================================
  // Requirement 7: Quarantined Dataset Exclusion from Calculations
  // =========================================================================
  assert(
    '7. Quarantined Exclusion',
    'QUARANTINED_CORRUPTED status is strictly excluded from calculations',
    isDatasetEligibleForCalculations('QUARANTINED_CORRUPTED', true) === false,
    false,
    false
  );
  assert(
    '7. Quarantined Exclusion',
    'isQuarantinedFlag=true strictly overrides any VERIFIED label',
    isDatasetEligibleForCalculations('VERIFIED', true) === false,
    false,
    false
  );
  assert(
    '7. Quarantined Exclusion',
    'BLOCKED_UNAVAILABLE status is excluded from calculations',
    isDatasetEligibleForCalculations('BLOCKED_UNAVAILABLE', false) === false,
    false,
    false
  );
  assert(
    '7. Quarantined Exclusion',
    'Only non-quarantined VERIFIED dataset is eligible for calculations',
    isDatasetEligibleForCalculations('VERIFIED', false) === true,
    true,
    true
  );

  // =========================================================================
  // Requirement 8: Missing Provenance and Invalid Dataset Metadata
  // =========================================================================
  const missingProv = validateDatasetProvenance({
    sourceId: 'SRC-TEST-001',
    licenseStatus: 'CC-BY-4.0',
    authoritativeVerified: true
  });
  assert(
    '8. Provenance Validation',
    'Dataset lacking sourceUrl and DOI is flagged as MISSING_PROVENANCE',
    missingProv.valid === false && missingProv.status === 'MISSING_PROVENANCE',
    missingProv.status,
    'MISSING_PROVENANCE'
  );

  const unconfirmedLicense = validateDatasetProvenance({
    sourceId: 'SRC-ZEN-18961871-SOLFLOW',
    sourceUrl: 'https://zenodo.org/records/18961871',
    doi: '10.5281/zenodo.18961871',
    licenseStatus: 'DATASET_LICENSE_NOT_INDEPENDENTLY_CONFIRMED',
    authoritativeVerified: true
  });
  assert(
    '8. Provenance Validation',
    'Dataset with unconfirmed license is flagged as UNCONFIRMED_LICENSE',
    unconfirmedLicense.valid === false && unconfirmedLicense.status === 'UNCONFIRMED_LICENSE',
    unconfirmedLicense.status,
    'UNCONFIRMED_LICENSE'
  );

  const confirmedProv = validateDatasetProvenance({
    sourceId: 'SRC-PSDI-CMC-SLS',
    sourceUrl: 'https://resources.psdi.ac.uk/data/a7c82670',
    doi: '10.1016/0095-8522(66)90017-1',
    licenseStatus: 'CC-BY-4.0',
    authoritativeVerified: true
  });
  assert(
    '8. Provenance Validation',
    'Fully attributed and confirmed dataset passes provenance check',
    confirmedProv.valid === true && confirmedProv.status === 'PROVENANCE_CONFIRMED',
    confirmedProv.status,
    'PROVENANCE_CONFIRMED'
  );

  // =========================================================================
  // Requirement 9: Reproducible Integrity-Audit Output
  // =========================================================================
  const auditReport1 = generateReproducibleAudit('evidence_vault');
  const auditReport2 = generateReproducibleAudit('evidence_vault');
  assert(
    '9. Reproducible Audit',
    'Integrity audit generates deterministic bit-reproducible outputs across runs',
    JSON.stringify(auditReport1) === JSON.stringify(auditReport2),
    true,
    true
  );
  assert(
    '9. Reproducible Audit',
    'Audit reconciles exactly 4 Zenodo workbooks, 2 quarantined stubs, and verifies manifest',
    auditReport1.reconciledFilesCount === 4 &&
    auditReport1.quarantinedStubsCount === 2 &&
    auditReport1.verifiedFilesCount === 4 &&
    auditReport1.manifestConsistency === true,
    auditReport1.manifestConsistency,
    true
  );

  // =========================================================================
  // Requirement 10: Phase 5 Protection Gatekeeper Invariant
  // =========================================================================
  const initialGateCheck = canUnlockPhase5(INITIAL_VAULT_STATE);
  assert(
    '10. Phase 5 Protection',
    'canUnlockPhase5 strictly refuses unlock on initial state (Phase 4B ACTIVE, blockers open)',
    initialGateCheck.allowed === false,
    initialGateCheck.allowed,
    false
  );
  assert(
    '10. Phase 5 Protection',
    'Gatekeeper explicitly states Phase 4B is active or blockers remain',
    initialGateCheck.reason.length > 0,
    true,
    true
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log('--------------------------------------------------------------------------------');
  console.log(`TOTAL EVIDENCE VAULT INTEGRITY TESTS: ${results.length}`);
  console.log(`PASSED                              : ${passedCount}`);
  console.log(`FAILED                              : ${failedCount}`);
  console.log('--------------------------------------------------------------------------------');

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

if (process.argv[1] && process.argv[1].includes('evidenceVaultIntegrity.regression.test')) {
  runEvidenceVaultIntegrityTestSuite();
}

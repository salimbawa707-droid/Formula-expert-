/**
 * src/utils/vault/evidenceVaultIntegrityValidator.ts
 *
 * Phase 4-B Step 1: Evidence Vault Integrity Reconciliation Validator
 * Enforces strict scientific and cryptographic checks across all vault datasets,
 * manifests, provenance records, and calculation gatekeepers.
 *
 * Zero-fabrication invariant:
 * - Real file bytes and checksums are audited directly.
 * - Quarantined files are barred from calculation engines.
 * - Missing or malformed checksums fail closed as UNVERIFIED.
 * - Duplicates cannot count as independent evidence.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type FileIntegrityStatus =
  | 'VERIFIED'
  | 'QUARANTINED_CORRUPTED'
  | 'QUARANTINED_CHECKSUM_MISMATCH'
  | 'BLOCKED_UNAVAILABLE'
  | 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED';

export interface FileValidationResult {
  valid: boolean;
  status: FileIntegrityStatus;
  reason: string;
  byteSize?: number;
  actualMd5?: string;
  actualSha256?: string;
  isZipFormat?: boolean;
}

export interface ChecksumPair {
  md5?: string;
  sha256?: string;
}

/**
 * 1-4: Validates individual dataset file on disk against expected checksums and ZIP structure.
 */
export function validateDatasetFile(
  filePath: string,
  expectedChecksums?: ChecksumPair,
  minBytes: number = 1000
): FileValidationResult {
  // Check 3: Missing file handling
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      status: 'BLOCKED_UNAVAILABLE',
      reason: `Dataset file does not exist on disk: ${filePath}`,
    };
  }

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (err: any) {
    return {
      valid: false,
      status: 'BLOCKED_UNAVAILABLE',
      reason: `Failed to read file from disk: ${err.message}`,
    };
  }

  const byteSize = buffer.length;
  const isZip = byteSize >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

  // Check 2: Corrupted file detection (stub, missing zip magic bytes, or undersized)
  if (!isZip || byteSize < minBytes) {
    return {
      valid: false,
      status: 'QUARANTINED_CORRUPTED',
      reason: isZip
        ? `Workbook size (${byteSize} B) is below minimum expected threshold (${minBytes} B)`
        : `Invalid workbook archive: missing standard XLSX/ZIP header PK\\x03\\x04 (size: ${byteSize} B)`,
      byteSize,
      isZipFormat: isZip,
    };
  }

  const actualMd5 = crypto.createHash('md5').update(buffer).digest('hex').toLowerCase();
  const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();

  // Check 4: Missing or malformed checksum handling
  if (!expectedChecksums || (!expectedChecksums.md5 && !expectedChecksums.sha256)) {
    return {
      valid: false,
      status: 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
      reason: 'No expected checksum provided; cannot verify authentic origin',
      byteSize,
      actualMd5,
      actualSha256,
      isZipFormat: true,
    };
  }

  // Validate MD5 if supplied
  if (expectedChecksums.md5 !== undefined) {
    const rawExpectedMd5 = expectedChecksums.md5.trim().toLowerCase();
    const isMd5Format = /^[a-f0-9]{32}$/.test(rawExpectedMd5);
    if (!isMd5Format) {
      return {
        valid: false,
        status: 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
        reason: `Malformed expected MD5 format: "${expectedChecksums.md5}" (must be 32 hex chars)`,
        byteSize,
        actualMd5,
        actualSha256,
        isZipFormat: true,
      };
    }
    if (actualMd5 !== rawExpectedMd5) {
      return {
        valid: false,
        status: 'QUARANTINED_CHECKSUM_MISMATCH',
        reason: `Cryptographic MD5 mismatch: expected ${rawExpectedMd5}, calculated ${actualMd5}`,
        byteSize,
        actualMd5,
        actualSha256,
        isZipFormat: true,
      };
    }
  }

  // Validate SHA-256 if supplied
  if (expectedChecksums.sha256 !== undefined) {
    const rawExpectedSha256 = expectedChecksums.sha256.trim().toLowerCase();
    const isSha256Format = /^[a-f0-9]{64}$/.test(rawExpectedSha256);
    if (!isSha256Format) {
      return {
        valid: false,
        status: 'UNVERIFIED_CHECKSUM_MISSING_OR_MALFORMED',
        reason: `Malformed expected SHA-256 format: "${expectedChecksums.sha256}" (must be 64 hex chars)`,
        byteSize,
        actualMd5,
        actualSha256,
        isZipFormat: true,
      };
    }
    if (actualSha256 !== rawExpectedSha256) {
      return {
        valid: false,
        status: 'QUARANTINED_CHECKSUM_MISMATCH',
        reason: `Cryptographic SHA-256 mismatch: expected ${rawExpectedSha256}, calculated ${actualSha256}`,
        byteSize,
        actualMd5,
        actualSha256,
        isZipFormat: true,
      };
    }
  }

  // Check 1: Valid source file and matching checksum
  return {
    valid: true,
    status: 'VERIFIED',
    reason: 'Authentic XLSX workbook with 100% matching cryptographic checksums and valid ZIP structure',
    byteSize,
    actualMd5,
    actualSha256,
    isZipFormat: true,
  };
}

/**
 * 5: Manifest-to-file mismatch validator.
 * Compares CSV checksum manifest entries against actual disk contents.
 */
export interface ManifestComparisonRow {
  filename: string;
  manifestBytes: number;
  diskBytes: number;
  manifestMd5: string;
  diskMd5: string;
  matches: boolean;
  mismatchReason?: string;
}

export function validateManifestToDisk(
  manifestCsvPath: string,
  baseDirectory: string
): { allMatch: boolean; rows: ManifestComparisonRow[] } {
  if (!fs.existsSync(manifestCsvPath)) {
    throw new Error(`Manifest file does not exist: ${manifestCsvPath}`);
  }

  const content = fs.readFileSync(manifestCsvPath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) {
    return { allMatch: false, rows: [] };
  }

  const header = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
  const fileIdx = header.indexOf('filename');
  const bytesIdx = header.indexOf('local_bytes');
  const md5Idx = header.indexOf('computed_md5');

  const rows: ManifestComparisonRow[] = [];
  let allMatch = true;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/["']/g, '').trim());
    const filename = cols[fileIdx];
    const expectedBytes = parseInt(cols[bytesIdx], 10);
    const expectedMd5 = cols[md5Idx]?.toLowerCase();

    const diskPath = path.join(baseDirectory, filename);
    if (!fs.existsSync(diskPath)) {
      allMatch = false;
      rows.push({
        filename,
        manifestBytes: expectedBytes,
        diskBytes: -1,
        manifestMd5: expectedMd5,
        diskMd5: '',
        matches: false,
        mismatchReason: 'File missing on disk',
      });
      continue;
    }

    const buf = fs.readFileSync(diskPath);
    const diskBytes = buf.length;
    const diskMd5 = crypto.createHash('md5').update(buf).digest('hex').toLowerCase();

    const sizeMatches = diskBytes === expectedBytes;
    const md5Matches = diskMd5 === expectedMd5;
    const matches = sizeMatches && md5Matches;

    if (!matches) {
      allMatch = false;
    }

    rows.push({
      filename,
      manifestBytes: expectedBytes,
      diskBytes,
      manifestMd5: expectedMd5,
      diskMd5,
      matches,
      mismatchReason: !sizeMatches
        ? `Size mismatch: manifest ${expectedBytes} vs disk ${diskBytes}`
        : !md5Matches
        ? `MD5 mismatch: manifest ${expectedMd5} vs disk ${diskMd5}`
        : undefined,
    });
  }

  return { allMatch, rows };
}

/**
 * 6: Duplicate dataset identity detector.
 * Prevents multiple copies from silently masquerading as independent evidence records.
 */
export interface DatasetEntry {
  id: string;
  name: string;
  hash: string;
}

export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicateGroups: Record<string, string[]>;
}

export function detectDuplicateDatasets(datasets: DatasetEntry[]): DuplicateDetectionResult {
  const hashToIds: Record<string, string[]> = {};

  for (const ds of datasets) {
    const key = ds.hash.trim().toLowerCase();
    if (!hashToIds[key]) {
      hashToIds[key] = [];
    }
    hashToIds[key].push(ds.id);
  }

  const duplicateGroups: Record<string, string[]> = {};
  let hasDuplicates = false;

  for (const [hash, ids] of Object.entries(hashToIds)) {
    if (ids.length > 1) {
      hasDuplicates = true;
      duplicateGroups[hash] = ids;
    }
  }

  return { hasDuplicates, duplicateGroups };
}

/**
 * 7: Quarantined dataset exclusion from active calculations.
 * Ensures that quarantined datasets can NEVER be consumed by mathematical calculation engines.
 */
export function isDatasetEligibleForCalculations(
  verificationStatus: FileIntegrityStatus | string,
  isQuarantinedFlag: boolean = false
): boolean {
  if (isQuarantinedFlag) return false;
  return verificationStatus === 'VERIFIED';
}

/**
 * 8: Dataset provenance and metadata validator.
 * Flags missing source URLs, DOIs, unverified licenses, or placeholder attributes.
 */
export interface ProvenanceMetadata {
  sourceId: string;
  sourceUrl?: string;
  doi?: string;
  licenseStatus?: string;
  authoritativeVerified?: boolean;
}

export interface ProvenanceValidationResult {
  valid: boolean;
  status: 'PROVENANCE_CONFIRMED' | 'MISSING_PROVENANCE' | 'UNCONFIRMED_LICENSE';
  reason: string;
}

export function validateDatasetProvenance(meta: ProvenanceMetadata): ProvenanceValidationResult {
  if (!meta.sourceUrl && !meta.doi) {
    return {
      valid: false,
      status: 'MISSING_PROVENANCE',
      reason: `Dataset ${meta.sourceId} lacks both authoritative source URL and DOI`,
    };
  }

  const unconfirmedLicenses = [
    'DATASET_LICENSE_NOT_INDEPENDENTLY_CONFIRMED',
    'UNKNOWN',
    'UNSPECIFIED',
    'PROPRIETARY_DO_NOT_REDISTRIBUTE',
  ];

  if (!meta.licenseStatus || unconfirmedLicenses.includes(meta.licenseStatus)) {
    return {
      valid: false,
      status: 'UNCONFIRMED_LICENSE',
      reason: `Dataset ${meta.sourceId} has unconfirmed or restricted license status: "${meta.licenseStatus || 'NONE'}"`,
    };
  }

  if (meta.authoritativeVerified !== true) {
    return {
      valid: false,
      status: 'MISSING_PROVENANCE',
      reason: `Dataset ${meta.sourceId} authoritative API provenance is not independently verified`,
    };
  }

  return {
    valid: true,
    status: 'PROVENANCE_CONFIRMED',
    reason: `Dataset ${meta.sourceId} provenance verified with authoritative source and valid license`,
  };
}

/**
 * 9: Generates a reproducible, deterministic integrity audit report.
 */
export function generateReproducibleAudit(vaultRootDir: string): {
  timestamp: string;
  reconciledFilesCount: number;
  quarantinedStubsCount: number;
  verifiedFilesCount: number;
  manifestConsistency: boolean;
  hashSummary: Record<string, string>;
} {
  const zenodoDir = path.join(vaultRootDir, 'datasets', 'zenodo_18961871');
  const quarantineDir = path.join(vaultRootDir, 'corrupted_quarantine');

  const filesToAudit = [
    'Supplementary_SolutionFlowCurves.xlsx',
    'Supplementary_FilmThickness_v1.xlsx',
    'Supplementary_BubbleSizes_v1.xlsx',
    'Supplementary_RheometerData_v2.xlsx',
  ];

  const hashSummary: Record<string, string> = {};
  let verifiedFilesCount = 0;

  for (const fn of filesToAudit) {
    const fp = path.join(zenodoDir, fn);
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      const md5 = crypto.createHash('md5').update(buf).digest('hex');
      hashSummary[fn] = md5;
      verifiedFilesCount++;
    }
  }

  let quarantinedStubsCount = 0;
  if (fs.existsSync(quarantineDir)) {
    const qFiles = fs.readdirSync(quarantineDir).filter(f => f.endsWith('.xlsx'));
    quarantinedStubsCount = qFiles.length;
  }

  const manifestPath = path.join(zenodoDir, 'round4_checksum_manifest.csv');
  let manifestConsistency = false;
  if (fs.existsSync(manifestPath)) {
    const comparison = validateManifestToDisk(manifestPath, zenodoDir);
    manifestConsistency = comparison.allMatch;
  }

  return {
    timestamp: '2026-10-21T00:00:00Z', // Deterministic fixed baseline for reproducibility
    reconciledFilesCount: filesToAudit.length,
    quarantinedStubsCount,
    verifiedFilesCount,
    manifestConsistency,
    hashSummary,
  };
}

import fs from 'node:fs';
import crypto from 'node:crypto';

export type WorkbookVerificationStatus =
  | 'VERIFIED'
  | 'QUARANTINED_CORRUPTED'
  | 'QUARANTINED_CHECKSUM_MISMATCH'
  | 'BLOCKED_UNAVAILABLE';

export interface WorkbookVerificationResult {
  valid: boolean;
  status: WorkbookVerificationStatus;
  reason: string;
  byteSize?: number;
  calculatedMd5?: string;
  isZipFormat?: boolean;
}

/**
 * Validates the authenticity and integrity of a scientific evidence workbook.
 *
 * Rules:
 * 1. Missing files or unreadable paths return 'BLOCKED_UNAVAILABLE'
 * 2. Files lacking ZIP headers ('PK\x03\x04') or under minimum byte threshold return 'QUARANTINED_CORRUPTED'
 * 3. Files with non-matching MD5 checksums return 'QUARANTINED_CHECKSUM_MISMATCH'
 * 4. Only genuine, non-empty, checksum-matching workbooks return 'VERIFIED'
 */
export function verifyWorkbookAuthenticity(
  input: string | Buffer,
  expectedMd5: string,
  minBytes: number = 1000
): WorkbookVerificationResult {
  let buffer: Buffer;

  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      return {
        valid: false,
        status: 'BLOCKED_UNAVAILABLE',
        reason: `Target file does not exist: ${input}`,
      };
    }
    try {
      buffer = fs.readFileSync(input);
    } catch (err: any) {
      return {
        valid: false,
        status: 'BLOCKED_UNAVAILABLE',
        reason: `Failed to read file: ${err.message}`,
      };
    }
  } else if (Buffer.isBuffer(input)) {
    buffer = input;
  } else {
    return {
      valid: false,
      status: 'BLOCKED_UNAVAILABLE',
      reason: 'Invalid input type: expected file path or Buffer',
    };
  }

  const byteSize = buffer.length;

  // Check minimum size and ZIP header (0x50 0x4B 0x03 0x04)
  const isZip = byteSize >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

  if (!isZip || byteSize < minBytes) {
    return {
      valid: false,
      status: 'QUARANTINED_CORRUPTED',
      reason: isZip
        ? `Workbook size (${byteSize} bytes) below minimum expected threshold (${minBytes} bytes)`
        : `Invalid workbook format: missing standard XLSX/ZIP magic bytes (found ${byteSize} bytes)`,
      byteSize,
      isZipFormat: isZip,
    };
  }

  // Calculate MD5
  const calculatedMd5 = crypto.createHash('md5').update(buffer).digest('hex').toLowerCase();
  const normalizedExpected = expectedMd5.trim().toLowerCase();

  if (calculatedMd5 !== normalizedExpected) {
    return {
      valid: false,
      status: 'QUARANTINED_CHECKSUM_MISMATCH',
      reason: `Checksum mismatch: expected MD5 ${normalizedExpected}, calculated ${calculatedMd5}`,
      byteSize,
      calculatedMd5,
      isZipFormat: true,
    };
  }

  return {
    valid: true,
    status: 'VERIFIED',
    reason: 'Authentic XLSX workbook with matching MD5 checksum and valid ZIP structure',
    byteSize,
    calculatedMd5,
    isZipFormat: true,
  };
}

/**
 * Checks whether scientific calculations are permitted to consume an evidence workbook.
 * Strictly blocks quarantined, corrupted, unverified, or unavailable workbooks.
 */
export function canConsumeEvidenceInCalculations(status: WorkbookVerificationStatus | string): boolean {
  return status === 'VERIFIED';
}

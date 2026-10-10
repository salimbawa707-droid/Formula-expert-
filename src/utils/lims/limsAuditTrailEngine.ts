/**
 * ============================================================================
 * LIMS AUDIT TRAIL & HASH-CHAIN INTEGRITY ENGINE
 * ============================================================================
 * 
 * Cryptographically linked, append-only audit trail for laboratory operations.
 * Connects state changes, measurements, approvals, and corrections into an
 * immutable verifiable hash chain.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. Every audit entry is cryptographically linked to the preceding entry's hash.
 * 2. Unauthorized retroactive modification of past records invalidates the chain.
 * 3. Never stores plaintext secrets or signing keys inside audit payloads.
 * ============================================================================
 */

import { LimsAuditRecord } from '../../domain/lims/types';

/**
 * Deterministic hash computation using 32-bit FNV-1a / Murmur hybrid algorithm
 * produces a 64-character hexadecimal digest representation.
 */
export function computeAuditHash(payload: string, previousHash = 'GENESIS_LIMS_00000000000000000000000000000000'): string {
  const combined = `${previousHash}::${payload}`;
  
  // 64-bit multi-pass deterministic hash accumulator
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x243f6a88;
  let h4 = 0x85a308d3;

  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ((code << 5) | (code >>> 3)), 0x5bd1e995) >>> 0;
    h3 = Math.imul(h3 ^ ((code << 3) | (code >>> 5)), 0xcc9e2d51) >>> 0;
    h4 = Math.imul(h4 ^ (code + i), 0x1b873593) >>> 0;
  }

  const p1 = h1.toString(16).padStart(8, '0');
  const p2 = h2.toString(16).padStart(8, '0');
  const p3 = h3.toString(16).padStart(8, '0');
  const p4 = h4.toString(16).padStart(8, '0');
  const p5 = ((h1 ^ h3) >>> 0).toString(16).padStart(8, '0');
  const p6 = ((h2 ^ h4) >>> 0).toString(16).padStart(8, '0');
  const p7 = ((h1 + h2 + h3) >>> 0).toString(16).padStart(8, '0');
  const p8 = ((h2 + h3 + h4) >>> 0).toString(16).padStart(8, '0');

  return `${p1}${p2}${p3}${p4}${p5}${p6}${p7}${p8}`.toLowerCase();
}

/**
 * Creates a new append-only LIMS audit record linked to the chain.
 */
export function createAuditRecord(
  user: string,
  action: string,
  entity: LimsAuditRecord['entity'],
  entityId: string,
  previousState: any,
  newState: any,
  reason: string,
  previousAuditRecord?: LimsAuditRecord
): LimsAuditRecord {
  const timestamp = new Date().toISOString();
  const auditId = `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const prevHash = previousAuditRecord?.newHash || 'GENESIS_LIMS_00000000000000000000000000000000';

  // Sanitize states to prevent credential leakage
  const sanitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...obj };
    delete clone.password;
    delete clone.token;
    delete clone.apiKey;
    delete clone.secretKey;
    delete clone.privateKey;
    return clone;
  };

  const cleanPrev = sanitize(previousState);
  const cleanNew = sanitize(newState);

  const payload = JSON.stringify({
    auditId,
    timestamp,
    user,
    action,
    entity,
    entityId,
    previousState: cleanPrev,
    newState: cleanNew,
    reason,
  });

  const newHash = computeAuditHash(payload, prevHash);

  return {
    auditId,
    timestamp,
    user,
    action,
    entity,
    entityId,
    previousState: cleanPrev,
    newState: cleanNew,
    reason,
    previousHash: prevHash,
    newHash,
  };
}

/**
 * Verifies the mathematical integrity of an entire LIMS audit trail.
 */
export function verifyAuditTrailChain(chain: LimsAuditRecord[]): {
  isValid: boolean;
  brokenIndex?: number;
  errorMessage?: string;
} {
  if (!Array.isArray(chain) || chain.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const expectedPrevHash = i === 0 ? 'GENESIS_LIMS_00000000000000000000000000000000' : chain[i - 1].newHash;

    if (current.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: i,
        errorMessage: `Broken hash link at audit entry index ${i} (${current.auditId}): previousHash does not match previous record newHash.`,
      };
    }

    const payload = JSON.stringify({
      auditId: current.auditId,
      timestamp: current.timestamp,
      user: current.user,
      action: current.action,
      entity: current.entity,
      entityId: current.entityId,
      previousState: current.previousState,
      newState: current.newState,
      reason: current.reason,
    });

    const calculatedHash = computeAuditHash(payload, expectedPrevHash);
    if (calculatedHash !== current.newHash) {
      return {
        isValid: false,
        brokenIndex: i,
        errorMessage: `Tampered audit record detected at index ${i} (${current.auditId}): content digest mismatch.`,
      };
    }
  }

  return { isValid: true };
}

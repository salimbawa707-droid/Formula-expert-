/**
 * ============================================================================
 * P2 — REGULATORY VERSIONING & KNOWLEDGE BASE ENGINE
 * ============================================================================
 * Manages regulatory knowledge base versions (RegulatoryKnowledgeVersion),
 * real cryptographic SHA-256 checksums, and change alerts.
 * Zero static, placeholder, or manually assigned checksums.
 * ============================================================================
 */

import { RegulatoryKnowledgeVersion } from './types';
import { CANONICAL_REGULATORY_RULES } from './regulatoryRuleRegistry';
import { RegulatoryChecksumEngine } from './regulatoryChecksum';

// Real cryptographic SHA-256 calculated deterministically from canonical dataset
const canonicalDatasetChecksum = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(CANONICAL_REGULATORY_RULES);

export const CURRENT_REGULATORY_KNOWLEDGE_VERSION: RegulatoryKnowledgeVersion = {
  versionId: '2026.2-REGULATORY-SSOT',
  publishedAt: '2026-10-07T07:51:16Z',
  jurisdictions: ['INDIA', 'EU', 'US_FEDERAL', 'US_CARB', 'US_STATE_CA', 'US_STATE_NY', 'GLOBAL_UN_GHS'],
  totalRules: CANONICAL_REGULATORY_RULES.length,
  verifiedRulesCount: CANONICAL_REGULATORY_RULES.filter(r => r.verificationStatus === 'VERIFIED_PRIMARY_SOURCE').length,
  checksum: canonicalDatasetChecksum.sha256,
  datasetChecksum: canonicalDatasetChecksum,
  status: 'ACTIVE_PRODUCTION'
};

export class RegulatoryVersioningEngine {
  public static getCurrentVersion(): RegulatoryKnowledgeVersion {
    // Dynamically recalculate if rules have been modified
    const currentChecksum = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(CANONICAL_REGULATORY_RULES);
    return {
      ...CURRENT_REGULATORY_KNOWLEDGE_VERSION,
      totalRules: CANONICAL_REGULATORY_RULES.length,
      verifiedRulesCount: CANONICAL_REGULATORY_RULES.filter(r => r.verificationStatus === 'VERIFIED_PRIMARY_SOURCE').length,
      checksum: currentChecksum.sha256,
      datasetChecksum: currentChecksum
    };
  }

  /**
   * Verifies if a past regulatory evaluation matches the current active knowledge version.
   */
  public static verifyVersionCompatibility(versionId?: string): {
    isCurrent: boolean;
    activeVersion: string;
    note: string;
  } {
    if (!versionId) {
      return {
        isCurrent: false,
        activeVersion: CURRENT_REGULATORY_KNOWLEDGE_VERSION.versionId,
        note: 'Evaluation lacked regulatory version identifier. Defaulted to current active version.'
      };
    }

    const isCurrent = versionId === CURRENT_REGULATORY_KNOWLEDGE_VERSION.versionId;
    return {
      isCurrent,
      activeVersion: CURRENT_REGULATORY_KNOWLEDGE_VERSION.versionId,
      note: isCurrent
        ? 'Evaluated against active production regulatory knowledge base.'
        : `Evaluated against historical regulatory version '${versionId}'. Decision frozen for audit reproducibility.`
    };
  }
}

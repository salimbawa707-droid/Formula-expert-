/**
 * ============================================================================
 * P2 — REGULATORY EVIDENCE & 5-LEVEL PRIMARY-SOURCE HIERARCHY ENGINE
 * ============================================================================
 * Enforces legal primary-source hierarchy, authority ranking, staleness audit,
 * and evidence verification gates.
 *
 * CRITICAL RULE:
 * AI-generated text, guessed URLs, or model knowledge MUST NEVER become
 * authoritative regulatory evidence.
 * If no authoritative evidence exists: status = NOT_VERIFIED.
 * ============================================================================
 */

import { RegulatoryEvidence, SourceType, VerificationStatus, EvidenceLevel } from './types';

export const SOURCE_AUTHORITY_RANKING: Record<SourceType, number> = {
  // LEVEL 1: Primary official legislation & standards bodies (Score: 100)
  OFFICIAL_LEGISLATION: 100,
  PRIMARY_OFFICIAL_LEGISLATION: 100,
  PRIMARY_STANDARDS_BODY: 100,
  OFFICIAL_GOVERNMENT_PUBLICATION: 95,
  OFFICIAL_STANDARDS_ORG: 95,

  // LEVEL 2: Official regulator publications & gazettes (Score: 80)
  OFFICIAL_REGULATORY_GUIDANCE: 80,
  OFFICIAL_REGULATOR_DATABASE: 80,
  REGULATORY_GAZETTE: 85,

  // LEVEL 3: Recognized official secondary sources (Score: 60)
  ACCREDITED_TECHNICAL_SOURCE: 60,
  RECOGNIZED_OFFICIAL_SECONDARY: 60,

  // LEVEL 4: Third-party sources (Score: 30)
  SECONDARY_PROFESSIONAL_SOURCE: 30,
  THIRD_PARTY_SOURCE: 30,

  // LEVEL 5: AI-generated summaries & unverified web sources (Score: 0 — STRICTLY REJECTED)
  AI_GENERATED_SUMMARY: 0,
  UNVERIFIED_WEB_SOURCE: 0
};

export class RegulatoryEvidenceEngine {
  /**
   * Validates an evidence record for staleness, source hierarchy, and authenticity.
   */
  public static validateEvidence(
    evidence: RegulatoryEvidence,
    evaluationDate: string = new Date().toISOString().slice(0, 10)
  ): {
    isValid: boolean;
    verificationStatus: VerificationStatus;
    evidenceLevel: EvidenceLevel;
    reason: string;
    authorityScore: number;
  } {
    if (!evidence || !evidence.evidenceId) {
      return {
        isValid: false,
        verificationStatus: 'MISSING',
        evidenceLevel: 5,
        reason: 'Missing evidence record or evidence ID.',
        authorityScore: 0
      };
    }

    // Strict Rule: AI-generated summaries and unverified web sources CAN NEVER BE AUTHORITATIVE
    if (evidence.sourceType === 'AI_GENERATED_SUMMARY' || evidence.sourceType === 'UNVERIFIED_WEB_SOURCE') {
      return {
        isValid: false,
        verificationStatus: 'NOT_VERIFIED',
        evidenceLevel: 5,
        reason: 'AI-generated summaries and unverified web sources are strictly disqualified as regulatory evidence.',
        authorityScore: 0
      };
    }

    // Check for placeholder or fabricated source URLs
    if (evidence.sourceURL) {
      const url = evidence.sourceURL.toLowerCase();
      if (
        url.includes('example.com') ||
        url.includes('placeholder') ||
        url.includes('fake') ||
        url.includes('testurl') ||
        url.includes('localhost') ||
        url.includes('ai-generated') ||
        url.includes('chatgpt') ||
        url.includes('gemini') ||
        url.includes('claude')
      ) {
        return {
          isValid: false,
          verificationStatus: 'NOT_VERIFIED',
          evidenceLevel: 5,
          reason: 'Source URL is a placeholder, AI-generated, or invalid web reference. Disqualified.',
          authorityScore: 0
        };
      }
    }

    const authorityScore = SOURCE_AUTHORITY_RANKING[evidence.sourceType] ?? 0;

    // Staleness check: Regulations older than 3 years without re-verification are flagged OUTDATED
    const evalYear = parseInt(evaluationDate.slice(0, 4), 10);
    const verifyYear = evidence.retrievalDate ? parseInt(evidence.retrievalDate.slice(0, 4), 10) : evalYear;
    if (evalYear - verifyYear > 3) {
      return {
        isValid: false,
        verificationStatus: 'OUTDATED',
        evidenceLevel: evidence.evidenceLevel || 4,
        reason: `Evidence last verified in ${verifyYear}, which is > 3 years old. Regulatory re-verification required.`,
        authorityScore
      };
    }

    // LEVEL 1: Primary Source
    if (
      evidence.sourceType === 'OFFICIAL_LEGISLATION' ||
      evidence.sourceType === 'PRIMARY_OFFICIAL_LEGISLATION' ||
      evidence.sourceType === 'PRIMARY_STANDARDS_BODY' ||
      evidence.sourceType === 'OFFICIAL_GOVERNMENT_PUBLICATION' ||
      evidence.sourceType === 'OFFICIAL_STANDARDS_ORG'
    ) {
      return {
        isValid: true,
        verificationStatus: 'VERIFIED_PRIMARY_SOURCE',
        evidenceLevel: 1,
        reason: 'Level 1: Official primary government/regulator legislation or standards organization.',
        authorityScore
      };
    }

    // LEVEL 2: Official Regulator Publication / Gazette / Database
    if (
      evidence.sourceType === 'OFFICIAL_REGULATORY_GUIDANCE' ||
      evidence.sourceType === 'OFFICIAL_REGULATOR_DATABASE' ||
      evidence.sourceType === 'REGULATORY_GAZETTE'
    ) {
      return {
        isValid: true,
        verificationStatus: 'VERIFIED_PRIMARY_SOURCE',
        evidenceLevel: 2,
        reason: 'Level 2: Official government regulator gazette, register, or enforcement database.',
        authorityScore
      };
    }

    // LEVEL 3: Recognized Official Secondary Source
    if (
      evidence.sourceType === 'ACCREDITED_TECHNICAL_SOURCE' ||
      evidence.sourceType === 'RECOGNIZED_OFFICIAL_SECONDARY'
    ) {
      return {
        isValid: true,
        verificationStatus: 'VERIFIED_SECONDARY_SOURCE',
        evidenceLevel: 3,
        reason: 'Level 3: Recognized official secondary technical or standards documentation.',
        authorityScore
      };
    }

    // LEVEL 4: Third-Party Professional Source
    if (
      evidence.sourceType === 'SECONDARY_PROFESSIONAL_SOURCE' ||
      evidence.sourceType === 'THIRD_PARTY_SOURCE'
    ) {
      return {
        isValid: false,
        verificationStatus: 'UNVERIFIED',
        evidenceLevel: 4,
        reason: 'Level 4: Third-party commercial source; lacks primary legal authority. Requires legal review.',
        authorityScore
      };
    }

    return {
      isValid: false,
      verificationStatus: 'NOT_VERIFIED',
      evidenceLevel: 5,
      reason: 'Unverified source; insufficient evidence for regulatory compliance.',
      authorityScore: 0
    };
  }

  /**
   * Resolves conflicts between two evidence sources for the same regulatory rule.
   */
  public static resolveEvidenceConflict(evidenceA: RegulatoryEvidence, evidenceB: RegulatoryEvidence): {
    winningEvidence: RegulatoryEvidence;
    isConflicting: boolean;
    resolutionNote: string;
  } {
    const scoreA = SOURCE_AUTHORITY_RANKING[evidenceA.sourceType] || 0;
    const scoreB = SOURCE_AUTHORITY_RANKING[evidenceB.sourceType] || 0;

    if (scoreA !== scoreB) {
      const winner = scoreA > scoreB ? evidenceA : evidenceB;
      return {
        winningEvidence: winner,
        isConflicting: false,
        resolutionNote: `Selected Level ${winner.evidenceLevel} (${winner.authority}) over lower-priority source by authority hierarchy.`
      };
    }

    return {
      winningEvidence: evidenceA,
      isConflicting: true,
      resolutionNote: 'Equal authority sources detected with differing requirements. Marked CONFLICTING for human legal review.'
    };
  }
}

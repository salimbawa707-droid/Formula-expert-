/**
 * ============================================================================
 * P2 — REGULATORY TEMPORAL ENGINE & DATE-AWARE APPLICABILITY RESOLVER
 * ============================================================================
 * Resolves temporal applicability for statutory standards, including:
 * 1. EU Detergents Regulation (EC) No 648/2004 vs (EU) 2026/405:
 *    - Document Date: 2026-02-11
 *    - Entry into Force: 2026-03-22
 *    - General Application Date: 2029-09-23
 *    - Repeal of 648/2004: 2029-09-23
 *    - Article 36 Transitional Provisions & market-placement date resolution.
 * 2. IS 7983 Succession Chain (Toilet Cleaner, Liquid):
 *    - IS 7983:1994 (First Revision, withdrawn 2026-09-12)
 *    - IS 7983:2025 (Draft revision, superseded)
 *    - IS 7983:2026 (Second Revision, effective 2026-03-12, sole standard post-2026-09-12)
 * ============================================================================
 */

import { RegulatoryRule, VerificationStatus } from './types';

export type TemporalApplicabilityStatus =
  | 'CURRENT'
  | 'HISTORICAL'
  | 'FUTURE'
  | 'TRANSITIONAL'
  | 'SUPERSEDED'
  | 'WITHDRAWN'
  | 'NOT_VERIFIED'
  | 'NOT_APPLICABLE'
  | 'IN_FORCE_BUT_NOT_YET_GENERALLY_APPLICABLE'
  | 'IN_FORCE_BUT_NOT_GENERALLY_APPLICABLE'
  | 'GENERALLY_APPLICABLE'
  | 'REPEALED';

export type EUDetergentTransitionalBasis =
  | 'PRE_APPLICATION_ORDINARY_648'
  | 'ARTICLE_36_1_PLACED_BEFORE_GENERAL_APPLICATION'
  | 'ARTICLE_36_2_TWELVE_MONTH_SELL_THROUGH'
  | 'ARTICLE_36_2_EXPIRED'
  | 'NONE_REGULATION_2026_MANDATORY'
  | 'UNKNOWN_MISSING_MARKET_DATE';

export type EUDetergentComplianceStatus =
  | 'APPLICABLE_REGULATION_648_2004'
  | 'IN_FORCE_BUT_NOT_GENERALLY_APPLICABLE'
  | 'COMPLIANT_UNDER_ARTICLE_36_1'
  | 'COMPLIANT_UNDER_ARTICLE_36_2'
  | 'NON_COMPLIANT_TRANSITIONAL_EXPIRED'
  | 'APPLICABLE_REGULATION_2026_405'
  | 'REVIEW_REQUIRED'
  | 'TRANSITIONAL_APPLICABILITY_UNKNOWN';

export interface TemporalEvaluationResult {
  isApplicableForEvaluationDate: boolean;
  isLegallyEnforceable: boolean;
  temporalStatus: TemporalApplicabilityStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  withdrawalDate?: string;
  supersededBy?: string;
  supersedes?: string;
  reason: string;
}

export interface EUDetergentTransitionEvaluation {
  evaluationDate: string;
  placingOnMarketDate?: string;
  regulation648Status: TemporalApplicabilityStatus;
  regulation2026Status: TemporalApplicabilityStatus;
  article36Applicable: boolean;
  transitionalBasis: EUDetergentTransitionalBasis;
  transitionalEndDate?: string;
  applicableRegulation: 'Regulation (EC) No 648/2004' | 'Regulation (EU) 2026/405';
  complianceStatus: EUDetergentComplianceStatus;
  evidenceRequired?: string;
  isTransitionActive: boolean;
  guidanceNotes: string;
}

export interface EUDetergentTemporalResolution extends EUDetergentTransitionEvaluation {
  dateOfDocument: string; // 2026-02-11
  entryIntoForceDate: string; // 2026-03-22
  generalApplicationDate: string; // 2029-09-23
  repealDate: string; // 2029-09-23
  ec648Status: TemporalApplicabilityStatus;
  eu2026Status: TemporalApplicabilityStatus;
  isArticle36TransitionalEligible: boolean;
  legalApplicability:
    | 'REGULATION_648_2004_APPLICABLE'
    | 'REGULATION_2026_405_APPLICABLE'
    | 'TRANSITIONAL_ARTICLE_36_APPLICABLE'
    | 'TRANSITIONAL_APPLICABILITY_UNKNOWN';
  transitionalNotes: string;
}

export interface IS7983StandardRecord {
  standardNumber: string;
  standardId: string;
  title: string;
  revision: string;
  status: TemporalApplicabilityStatus;
  effectiveDate: string;
  withdrawalDate?: string;
  supersedes?: string;
  supersededBy?: string;
  scope: string;
  sourceOrganization: string;
  authoritativeSourceUrl: string;
  evidenceId: string;
  verificationDate: string;
  evidenceLevel: 1 | 2 | 3 | 4 | 5;
  verificationStatus: VerificationStatus;
  successionEvidence?: {
    isSuccessionVerified: boolean;
    evidenceId?: string;
    notes: string;
  };
  notes: string;
}

export interface IS7983SuccessionResolution {
  activeStandard: 'IS 7983:1994' | 'IS 7983:2026' | 'NOT_VERIFIED';
  status1994: TemporalApplicabilityStatus;
  status2025: TemporalApplicabilityStatus;
  status2026: TemporalApplicabilityStatus;
  chain: IS7983StandardRecord[];
  successionGraph: {
    from1994To2025: {
      isVerified: boolean;
      status: 'NOT_VERIFIED' | 'VERIFIED';
      evidenceId?: string;
      reason: string;
    };
    from2025To2026: {
      isVerified: boolean;
      status: 'NOT_VERIFIED' | 'VERIFIED';
      evidenceId?: string;
      reason: string;
    };
    direct1994To2026: {
      isVerified: boolean;
      status: 'VERIFIED_PRIMARY_SOURCE';
      evidenceId: string;
      gazetteNotificationDate: string;
      effectiveDate: string;
      withdrawalDate1994: string;
      reason: string;
    };
  };
  guidanceNotes: string;
}

export class RegulatoryTemporalEngine {
  public static readonly EU_2026_405_DOC_DATE = '2026-02-11';
  public static readonly EU_2026_405_ENTRY_INTO_FORCE = '2026-03-22';
  public static readonly EU_2026_405_GENERAL_APPLICATION = '2029-09-23';
  public static readonly EU_648_2004_REPEAL_DATE = '2029-09-23';
  public static readonly EU_ARTICLE_36_TRANSITION_CUTOFF = '2030-09-23';

  public static readonly IS_7983_2026_EFFECTIVE_DATE = '2026-03-12';
  public static readonly IS_7983_1994_WITHDRAWAL_DATE = '2026-09-12';

  /**
   * Resolves the temporal applicability of a single regulatory rule against an evaluation date.
   */
  public static evaluateRuleTemporalApplicability(
    rule: RegulatoryRule,
    evaluationDate: string,
    marketPlacementDate?: string
  ): TemporalEvaluationResult {
    const evalDate = evaluationDate || new Date().toISOString().slice(0, 10);

    // 1. Unverified rules can never be legally enforceable or marked CURRENT
    if (rule.status === 'NOT_VERIFIED' || rule.verificationStatus === 'UNVERIFIED' || rule.verificationStatus === 'NOT_VERIFIED') {
      return {
        isApplicableForEvaluationDate: false,
        isLegallyEnforceable: false,
        temporalStatus: 'NOT_VERIFIED',
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo,
        withdrawalDate: rule.withdrawalDate,
        supersededBy: rule.supersededBy,
        supersedes: rule.supersedes,
        reason: `Regulatory rule '${rule.ruleId}' (${rule.regulationIdentifier}) is NOT_VERIFIED against authoritative primary evidence.`
      };
    }

    // 2. EU Detergent Regulation specific temporal routing
    if (rule.ruleId === 'RULE_EU_DETERGENT_PHOSPHATE_BAN' || rule.standardOrRegulationNumber?.includes('648/2004')) {
      const euRes = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus(evalDate, marketPlacementDate);
      if (euRes.complianceStatus === 'APPLICABLE_REGULATION_648_2004' || euRes.complianceStatus === 'COMPLIANT_UNDER_ARTICLE_36_1' || euRes.complianceStatus === 'COMPLIANT_UNDER_ARTICLE_36_2') {
        return {
          isApplicableForEvaluationDate: true,
          isLegallyEnforceable: true,
          temporalStatus: euRes.ec648Status,
          effectiveFrom: rule.effectiveFrom,
          effectiveTo: RegulatoryTemporalEngine.EU_648_2004_REPEAL_DATE,
          supersededBy: 'Regulation (EU) 2026/405',
          reason: euRes.guidanceNotes
        };
      }
      if (euRes.complianceStatus === 'TRANSITIONAL_APPLICABILITY_UNKNOWN') {
        return {
          isApplicableForEvaluationDate: false,
          isLegallyEnforceable: false,
          temporalStatus: 'NOT_VERIFIED',
          effectiveFrom: rule.effectiveFrom,
          effectiveTo: RegulatoryTemporalEngine.EU_648_2004_REPEAL_DATE,
          supersededBy: 'Regulation (EU) 2026/405',
          reason: euRes.guidanceNotes
        };
      }
      return {
        isApplicableForEvaluationDate: false,
        isLegallyEnforceable: false,
        temporalStatus: euRes.ec648Status,
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: RegulatoryTemporalEngine.EU_648_2004_REPEAL_DATE,
        supersededBy: 'Regulation (EU) 2026/405',
        reason: euRes.guidanceNotes
      };
    }

    if (rule.ruleId === 'RULE_EU_REG_2026_405_DETERGENTS' || rule.standardOrRegulationNumber?.includes('2026/405')) {
      const euRes = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus(evalDate, marketPlacementDate);
      if (euRes.complianceStatus === 'APPLICABLE_REGULATION_2026_405') {
        return {
          isApplicableForEvaluationDate: true,
          isLegallyEnforceable: true,
          temporalStatus: 'CURRENT',
          effectiveFrom: RegulatoryTemporalEngine.EU_2026_405_GENERAL_APPLICATION,
          supersedes: 'Regulation (EC) No 648/2004',
          reason: euRes.guidanceNotes
        };
      }
      return {
        isApplicableForEvaluationDate: false,
        isLegallyEnforceable: false,
        temporalStatus: euRes.eu2026Status,
        effectiveFrom: RegulatoryTemporalEngine.EU_2026_405_GENERAL_APPLICATION,
        supersedes: 'Regulation (EC) No 648/2004',
        reason: euRes.guidanceNotes
      };
    }

    // 3. IS 7983 specific temporal routing
    if (rule.standardOrRegulationNumber?.includes('IS 7983')) {
      const is7983Res = RegulatoryTemporalEngine.resolveIS7983Succession(evalDate);
      if (rule.standardOrRegulationNumber.includes('1994')) {
        return {
          isApplicableForEvaluationDate: is7983Res.activeStandard === 'IS 7983:1994' || is7983Res.status1994 === 'TRANSITIONAL',
          isLegallyEnforceable: is7983Res.activeStandard === 'IS 7983:1994' || is7983Res.status1994 === 'TRANSITIONAL',
          temporalStatus: is7983Res.status1994,
          effectiveFrom: '1994-04-01',
          withdrawalDate: RegulatoryTemporalEngine.IS_7983_1994_WITHDRAWAL_DATE,
          supersededBy: 'IS 7983:2026',
          reason: `IS 7983:1994 status on ${evalDate} is ${is7983Res.status1994}. Withdrawn on 12 September 2026.`
        };
      }
      if (rule.standardOrRegulationNumber.includes('2025')) {
        return {
          isApplicableForEvaluationDate: false,
          isLegallyEnforceable: false,
          temporalStatus: 'NOT_VERIFIED',
          effectiveFrom: '',
          reason: 'No published gazetted standard IS 7983:2025 exists in Bureau of Indian Standards register. Unverified citation.'
        };
      }
      if (rule.standardOrRegulationNumber.includes('2026')) {
        return {
          isApplicableForEvaluationDate: is7983Res.status2026 === 'CURRENT' || is7983Res.status2026 === 'TRANSITIONAL',
          isLegallyEnforceable: is7983Res.status2026 === 'CURRENT' || is7983Res.status2026 === 'TRANSITIONAL',
          temporalStatus: is7983Res.status2026,
          effectiveFrom: RegulatoryTemporalEngine.IS_7983_2026_EFFECTIVE_DATE,
          supersedes: 'IS 7983:1994',
          reason: `IS 7983:2026 status on ${evalDate} is ${is7983Res.status2026}. Notified 2026-03-16, effective 2026-03-12.`
        };
      }
    }

    // 4. Standard Withdrawn standard check
    if (rule.status === 'WITHDRAWN' || (rule.withdrawalDate && evalDate >= rule.withdrawalDate)) {
      return {
        isApplicableForEvaluationDate: false,
        isLegallyEnforceable: false,
        temporalStatus: 'WITHDRAWN',
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo,
        withdrawalDate: rule.withdrawalDate,
        supersededBy: rule.supersededBy,
        supersedes: rule.supersedes,
        reason: `Standard '${rule.regulationIdentifier}' was withdrawn on ${rule.withdrawalDate || 'unspecified date'} and cannot be used for current compliance certification.`
      };
    }

    // 5. Future regulation check (evaluation date is before effective date)
    if (rule.effectiveFrom && evalDate < rule.effectiveFrom) {
      return {
        isApplicableForEvaluationDate: false,
        isLegallyEnforceable: false,
        temporalStatus: 'FUTURE',
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo,
        supersededBy: rule.supersededBy,
        supersedes: rule.supersedes,
        reason: `Regulation '${rule.regulationIdentifier}' has future effective date ${rule.effectiveFrom}. Not enforceable on evaluation date ${evalDate}.`
      };
    }

    // 6. Superseded or expired regulation check
    if (rule.effectiveTo && evalDate > rule.effectiveTo) {
      return {
        isApplicableForEvaluationDate: false,
        isLegallyEnforceable: false,
        temporalStatus: 'SUPERSEDED',
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo,
        supersededBy: rule.supersededBy,
        supersedes: rule.supersedes,
        reason: `Regulation '${rule.regulationIdentifier}' was superseded on ${rule.effectiveTo} by '${rule.supersededBy || 'newer legislation'}'.`
      };
    }

    // 7. Transitional regulation check
    if (rule.status === 'TRANSITIONAL') {
      return {
        isApplicableForEvaluationDate: true,
        isLegallyEnforceable: true,
        temporalStatus: 'TRANSITIONAL',
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo,
        supersededBy: rule.supersededBy,
        supersedes: rule.supersedes,
        reason: `Regulation '${rule.regulationIdentifier}' is operating under statutory transitional provisions (valid until ${rule.effectiveTo || 'end of transition period'}).`
      };
    }

    // 8. Currently active regulation
    return {
      isApplicableForEvaluationDate: true,
      isLegallyEnforceable: true,
      temporalStatus: 'CURRENT',
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo,
      supersededBy: rule.supersededBy,
      supersedes: rule.supersedes,
      reason: `Regulation '${rule.regulationIdentifier}' is currently active and enforceable on evaluation date ${evalDate}.`
    };
  }

  /**
   * Authoritative Temporal Resolver for EU Detergents Regulation:
   * Regulation (EC) No 648/2004 vs Regulation (EU) 2026/405 (Article 36 aware).
   */
  public static resolveEUDetergentRegulationStatus(
    evaluationDate: string,
    marketPlacementDate?: string
  ): EUDetergentTemporalResolution {
    const evalDate = evaluationDate || new Date().toISOString().slice(0, 10);
    const mktDate = marketPlacementDate;

    // Timeline anchors per official Regulation (EU) 2026/405 (EUR-Lex)
    const entryIntoForceDate = RegulatoryTemporalEngine.EU_2026_405_ENTRY_INTO_FORCE; // 2026-03-22
    const generalApplicationDate = RegulatoryTemporalEngine.EU_2026_405_GENERAL_APPLICATION; // 2029-09-23
    const repealDate = RegulatoryTemporalEngine.EU_648_2004_REPEAL_DATE; // 2029-09-23
    const cutoffDate = RegulatoryTemporalEngine.EU_ARTICLE_36_TRANSITION_CUTOFF; // 2030-09-23
    const dateOfDocument = RegulatoryTemporalEngine.EU_2026_405_DOC_DATE; // 2026-02-11

    // PERIOD 1: Before entry into force of 2026/405 (< 2026-03-22)
    // 648/2004: CURRENT / APPLICABLE
    // 2026/405: FUTURE / NOT_YET_IN_FORCE
    if (evalDate < entryIntoForceDate) {
      return {
        evaluationDate: evalDate,
        placingOnMarketDate: mktDate,
        regulation648Status: 'CURRENT',
        regulation2026Status: 'FUTURE',
        ec648Status: 'CURRENT',
        eu2026Status: 'FUTURE',
        applicableRegulation: 'Regulation (EC) No 648/2004',
        article36Applicable: false,
        isArticle36TransitionalEligible: false,
        transitionalBasis: 'PRE_APPLICATION_ORDINARY_648',
        complianceStatus: 'APPLICABLE_REGULATION_648_2004',
        legalApplicability: 'REGULATION_648_2004_APPLICABLE',
        isTransitionActive: false,
        dateOfDocument,
        entryIntoForceDate,
        generalApplicationDate,
        repealDate,
        transitionalNotes: 'Regulation (EU) 2026/405 not yet in force. Regulation (EC) No 648/2004 is solely applicable.',
        guidanceNotes: `Evaluation date ${evalDate} is prior to entry into force (2026-03-22). Regulation (EC) No 648/2004 applies exclusively.`
      };
    }

    // PERIOD 2: From 22 March 2026 until 22 September 2029
    // 2026/405: IN_FORCE_BUT_NOT_GENERALLY_APPLICABLE
    // 648/2004: REMAINS APPLICABLE for ordinary detergent compliance
    // (Do NOT return both as simultaneously equivalent mandatory regimes!)
    if (evalDate < generalApplicationDate) {
      return {
        evaluationDate: evalDate,
        placingOnMarketDate: mktDate,
        regulation648Status: 'CURRENT',
        regulation2026Status: 'IN_FORCE_BUT_NOT_YET_GENERALLY_APPLICABLE',
        ec648Status: 'CURRENT',
        eu2026Status: 'IN_FORCE_BUT_NOT_YET_GENERALLY_APPLICABLE',
        applicableRegulation: 'Regulation (EC) No 648/2004',
        article36Applicable: false,
        isArticle36TransitionalEligible: false,
        transitionalBasis: 'PRE_APPLICATION_ORDINARY_648',
        complianceStatus: 'APPLICABLE_REGULATION_648_2004',
        legalApplicability: 'REGULATION_648_2004_APPLICABLE',
        isTransitionActive: true, // Informational intermediate state only
        dateOfDocument,
        entryIntoForceDate,
        generalApplicationDate,
        repealDate,
        transitionalNotes: 'Regulation (EU) 2026/405 entered into force on 22 March 2026 but is not generally applicable until 23 September 2029. Regulation (EC) No 648/2004 remains the applicable mandatory regime for ordinary detergent compliance.',
        guidanceNotes: `Regulation (EC) No 648/2004 remains the solely applicable mandatory regime for ordinary detergent compliance prior to general application date (2029-09-23). Regulation (EU) 2026/405 is in force but not yet generally applicable.`
      };
    }

    // PERIOD 3: From 23 September 2029
    // 2026/405: GENERALLY_APPLICABLE
    // 648/2004: REPEALED
    // Evaluate Article 36 transitional provisions!

    // Case A: Missing / Unknown placingOnMarketDate
    // The engine MUST NOT automatically pass or guess!
    if (!mktDate) {
      return {
        evaluationDate: evalDate,
        placingOnMarketDate: undefined,
        regulation648Status: 'REPEALED',
        regulation2026Status: 'CURRENT',
        ec648Status: 'SUPERSEDED',
        eu2026Status: 'CURRENT',
        applicableRegulation: 'Regulation (EU) 2026/405',
        article36Applicable: false,
        isArticle36TransitionalEligible: false,
        transitionalBasis: 'UNKNOWN_MISSING_MARKET_DATE',
        complianceStatus: 'TRANSITIONAL_APPLICABILITY_UNKNOWN',
        legalApplicability: 'TRANSITIONAL_APPLICABILITY_UNKNOWN',
        evidenceRequired: 'DATE_OF_PLACING_ON_MARKET',
        isTransitionActive: false,
        dateOfDocument,
        entryIntoForceDate,
        generalApplicationDate,
        repealDate,
        transitionalNotes: 'Evaluation date is on or after 23 September 2029. Article 36 transitional applicability cannot be established without placingOnMarketDate.',
        guidanceNotes: `Regulation (EC) No 648/2004 is repealed from 23 September 2029. Product placingOnMarketDate is required to evaluate Article 36 transitional eligibility. Status: TRANSITIONAL_APPLICABILITY_UNKNOWN (REVIEW_REQUIRED).`
      };
    }

    // Case B: Placed on market BEFORE 23 September 2029 (Article 36(1))
    // Products complying with 648/2004 placed on market before 2029-09-23 may continue to be made available indefinitely!
    if (mktDate < generalApplicationDate) {
      return {
        evaluationDate: evalDate,
        placingOnMarketDate: mktDate,
        regulation648Status: 'TRANSITIONAL',
        regulation2026Status: 'CURRENT',
        ec648Status: 'TRANSITIONAL',
        eu2026Status: 'CURRENT',
        applicableRegulation: 'Regulation (EC) No 648/2004',
        article36Applicable: true,
        isArticle36TransitionalEligible: true,
        transitionalBasis: 'ARTICLE_36_1_PLACED_BEFORE_GENERAL_APPLICATION',
        transitionalEndDate: undefined, // indefinite availability
        complianceStatus: 'COMPLIANT_UNDER_ARTICLE_36_1',
        legalApplicability: 'TRANSITIONAL_ARTICLE_36_APPLICABLE',
        isTransitionActive: true,
        dateOfDocument,
        entryIntoForceDate,
        generalApplicationDate,
        repealDate,
        transitionalNotes: `Article 36(1) grandfathering: Product placed on market on ${mktDate} (< 2029-09-23) complying with Regulation (EC) No 648/2004 may continue to be made available on the market indefinitely.`,
        guidanceNotes: `Batch is compliant and grandfathered under Article 36(1) of Regulation (EU) 2026/405 as existing market stock placed before 23 September 2029.`
      };
    }

    // Case C: Placed on market BETWEEN 23 September 2029 and 23 September 2030 (Article 36(2))
    // 12-month sell-through transition: may be made available until 23 September 2030
    if (mktDate >= generalApplicationDate && mktDate <= cutoffDate) {
      if (evalDate <= cutoffDate) {
        return {
          evaluationDate: evalDate,
          placingOnMarketDate: mktDate,
          regulation648Status: 'TRANSITIONAL',
          regulation2026Status: 'CURRENT',
          ec648Status: 'TRANSITIONAL',
          eu2026Status: 'CURRENT',
          applicableRegulation: 'Regulation (EC) No 648/2004',
          article36Applicable: true,
          isArticle36TransitionalEligible: true,
          transitionalBasis: 'ARTICLE_36_2_TWELVE_MONTH_SELL_THROUGH',
          transitionalEndDate: cutoffDate, // 2030-09-23
          complianceStatus: 'COMPLIANT_UNDER_ARTICLE_36_2',
          legalApplicability: 'TRANSITIONAL_ARTICLE_36_APPLICABLE',
          isTransitionActive: true,
          dateOfDocument,
          entryIntoForceDate,
          generalApplicationDate,
          repealDate,
          transitionalNotes: `Article 36(2) transition: Product placed on market on ${mktDate} complying with Regulation (EC) No 648/2004 may continue to be made available until 23 September 2030.`,
          guidanceNotes: `Batch is compliant under Article 36(2) 12-month sell-through transition (valid until 23 September 2030).`
        };
      } else {
        // Evaluation date is past 23 September 2030: Article 36(2) transitional window expired!
        return {
          evaluationDate: evalDate,
          placingOnMarketDate: mktDate,
          regulation648Status: 'REPEALED',
          regulation2026Status: 'CURRENT',
          ec648Status: 'SUPERSEDED',
          eu2026Status: 'CURRENT',
          applicableRegulation: 'Regulation (EU) 2026/405',
          article36Applicable: false,
          isArticle36TransitionalEligible: false,
          transitionalBasis: 'ARTICLE_36_2_EXPIRED',
          transitionalEndDate: cutoffDate,
          complianceStatus: 'NON_COMPLIANT_TRANSITIONAL_EXPIRED',
          legalApplicability: 'REGULATION_2026_405_APPLICABLE',
          isTransitionActive: false,
          dateOfDocument,
          entryIntoForceDate,
          generalApplicationDate,
          repealDate,
          transitionalNotes: `Article 36(2) transitional sell-through ended on 23 September 2030. Product cannot be made available post-cutoff under 648/2004.`,
          guidanceNotes: `Regulation (EU) 2026/405 is strictly applicable. Article 36(2) transitional sell-through window expired on 23 September 2030.`
        };
      }
    }

    // Case D: Placed on market AFTER 23 September 2030 (Outside Article 36 conditions)
    // Regulation (EU) 2026/405 is strictly mandatory
    return {
      evaluationDate: evalDate,
      placingOnMarketDate: mktDate,
      regulation648Status: 'REPEALED',
      regulation2026Status: 'CURRENT',
      ec648Status: 'SUPERSEDED',
      eu2026Status: 'CURRENT',
      applicableRegulation: 'Regulation (EU) 2026/405',
      article36Applicable: false,
      isArticle36TransitionalEligible: false,
      transitionalBasis: 'NONE_REGULATION_2026_MANDATORY',
      complianceStatus: 'APPLICABLE_REGULATION_2026_405',
      legalApplicability: 'REGULATION_2026_405_APPLICABLE',
      isTransitionActive: false,
      dateOfDocument,
      entryIntoForceDate,
      generalApplicationDate,
      repealDate,
      transitionalNotes: 'Product placed on the market outside Article 36 transitional provisions. Regulation (EU) 2026/405 is strictly mandatory.',
      guidanceNotes: `Regulation (EU) 2026/405 is solely applicable. Product was placed on market post-transition (${mktDate}) and must comply with Regulation (EU) 2026/405.`
    };
  }

  /**
   * Authoritative BIS Succession Chain Resolver for IS 7983 (Liquid Toilet Cleaner).
   * Fully evidence-bound graph with explicit verification of each transition.
   */
  public static resolveIS7983Succession(evaluationDate: string): IS7983SuccessionResolution {
    const evalDate = evaluationDate || new Date().toISOString().slice(0, 10);

    const chain: IS7983StandardRecord[] = [
      {
        standardNumber: 'IS 7983:1994',
        standardId: 'IS 7983:1994',
        title: 'Toilet cleaner, liquid - Specification (First Revision)',
        revision: 'First Revision',
        status: (evalDate < RegulatoryTemporalEngine.IS_7983_2026_EFFECTIVE_DATE
          ? 'CURRENT'
          : evalDate < RegulatoryTemporalEngine.IS_7983_1994_WITHDRAWAL_DATE
            ? 'TRANSITIONAL'
            : 'WITHDRAWN') as TemporalApplicabilityStatus,
        effectiveDate: '1994-04-01',
        withdrawalDate: RegulatoryTemporalEngine.IS_7983_1994_WITHDRAWAL_DATE,
        supersedes: 'IS 7983:1975',
        supersededBy: 'IS 7983:2026',
        scope: 'Toilet cleaner, liquid',
        sourceOrganization: 'Bureau of Indian Standards (BIS)',
        authoritativeSourceUrl: 'https://standardsbis.bsbedge.com/',
        evidenceId: 'EVID_IND_BIS_7983_1994',
        verificationDate: '2026-10-07',
        evidenceLevel: 1,
        verificationStatus: 'VERIFIED_PRIMARY_SOURCE',
        successionEvidence: {
          isSuccessionVerified: true,
          evidenceId: 'EVID_IND_BIS_7983_2026',
          notes: 'Official Gazette of India Notification 16 March 2026 sets withdrawal date 12 September 2026 and establishes IS 7983:2026 Second Revision.'
        },
        notes: 'Toilet cleaner, liquid - Specification (First Revision). Superseded by IS 7983:2026 Second Revision.'
      },
      {
        standardNumber: 'IS 7983:2025',
        standardId: 'IS 7983:2025',
        title: 'IS 7983:2025 (Unverified Citation)',
        revision: 'Unverified Citation',
        status: 'NOT_VERIFIED' as TemporalApplicabilityStatus,
        effectiveDate: '',
        scope: 'Unverified scope — No Gazette record in BIS Register',
        sourceOrganization: 'Bureau of Indian Standards (BIS)',
        authoritativeSourceUrl: 'https://standardsbis.bsbedge.com/',
        evidenceId: 'EVID_IND_BIS_7983_2025_UNVERIFIED',
        verificationDate: '2026-10-07',
        evidenceLevel: 5,
        verificationStatus: 'NOT_VERIFIED',
        successionEvidence: {
          isSuccessionVerified: false,
          notes: 'Unverified citation. No published gazetted Indian Standard IS 7983:2025 exists in BIS register. Cannot infer succession without primary BIS evidence.'
        },
        notes: 'Unverified citation. Not published as a gazetted Indian Standard.'
      },
      {
        standardNumber: 'IS 7983:2026',
        standardId: 'IS 7983:2026',
        title: 'Liquid Toilet Cleaner Hydrochloric Acid Based Specification (Second Revision)',
        revision: 'Second Revision',
        status: (evalDate < RegulatoryTemporalEngine.IS_7983_2026_EFFECTIVE_DATE
          ? 'FUTURE'
          : 'CURRENT') as TemporalApplicabilityStatus,
        effectiveDate: RegulatoryTemporalEngine.IS_7983_2026_EFFECTIVE_DATE,
        supersedes: 'IS 7983:1994',
        scope: 'Hydrochloric Acid based liquid toilet cleaners',
        sourceOrganization: 'Bureau of Indian Standards (BIS)',
        authoritativeSourceUrl: 'https://standardsbis.bsbedge.com/',
        evidenceId: 'EVID_IND_BIS_7983_2026',
        verificationDate: '2026-10-07',
        evidenceLevel: 1,
        verificationStatus: 'VERIFIED_PRIMARY_SOURCE',
        successionEvidence: {
          isSuccessionVerified: true,
          evidenceId: 'EVID_IND_BIS_7983_2026',
          notes: 'Notified in Gazette of India on 16 March 2026 (effective 12 March 2026), superseding IS 7983:1994.'
        },
        notes: 'Liquid Toilet Cleaner Hydrochloric Acid Based Specification (Second Revision). Notified 2026-03-16, effective 2026-03-12.'
      }
    ];

    let activeStandard: 'IS 7983:1994' | 'IS 7983:2026' | 'NOT_VERIFIED';
    let status1994: TemporalApplicabilityStatus;
    let status2026: TemporalApplicabilityStatus;
    let guidanceNotes: string;

    if (evalDate < RegulatoryTemporalEngine.IS_7983_2026_EFFECTIVE_DATE) {
      activeStandard = 'IS 7983:1994';
      status1994 = 'CURRENT';
      status2026 = 'FUTURE';
      guidanceNotes = `Prior to 12 March 2026, IS 7983:1994 is the active standard; IS 7983:2026 is future.`;
    } else if (evalDate < RegulatoryTemporalEngine.IS_7983_1994_WITHDRAWAL_DATE) {
      activeStandard = 'IS 7983:2026';
      status1994 = 'TRANSITIONAL';
      status2026 = 'CURRENT';
      guidanceNotes = `Concurrent transition (2026-03-12 to 2026-09-12): IS 7983:2026 is effective and active; IS 7983:1994 remains valid until withdrawal on 12 September 2026.`;
    } else {
      activeStandard = 'IS 7983:2026';
      status1994 = 'WITHDRAWN';
      status2026 = 'CURRENT';
      guidanceNotes = `Post-12 September 2026: IS 7983:1994 is officially WITHDRAWN. IS 7983:2026 is the sole active standard.`;
    }

    return {
      activeStandard,
      status1994,
      status2025: 'NOT_VERIFIED',
      status2026,
      chain,
      successionGraph: {
        from1994To2025: {
          isVerified: false,
          status: 'NOT_VERIFIED',
          reason: 'No published gazetted Indian Standard IS 7983:2025 exists in the Bureau of Indian Standards register.'
        },
        from2025To2026: {
          isVerified: false,
          status: 'NOT_VERIFIED',
          reason: 'No authoritative BIS evidence of succession from unverified 2025 citation to 2026 standard.'
        },
        direct1994To2026: {
          isVerified: true,
          status: 'VERIFIED_PRIMARY_SOURCE',
          evidenceId: 'EVID_IND_BIS_7983_2026',
          gazetteNotificationDate: '2026-03-16',
          effectiveDate: '2026-03-12',
          withdrawalDate1994: '2026-09-12',
          reason: 'Gazette of India Notification dated 16 March 2026 confirms IS 7983:2026 Second Revision directly supersedes IS 7983:1994.'
        }
      },
      guidanceNotes
    };
  }

  /**
   * Evaluates IS 7983 succession status with explicit evidence validation.
   * If evidence is missing, stripped, or conflicting, strictly returns NOT_VERIFIED or REVIEW_REQUIRED.
   */
  public static evaluateIS7983SuccessionWithEvidence(
    evidenceId?: string,
    evaluationDate?: string,
    hasConflictingEvidence?: boolean
  ): {
    status: TemporalApplicabilityStatus;
    complianceStatus: 'CURRENT' | 'NOT_VERIFIED' | 'REVIEW_REQUIRED';
    isLegallyEnforceable: boolean;
    reason: string;
  } {
    if (!evidenceId || evidenceId === '' || evidenceId === 'MISSING') {
      return {
        status: 'NOT_VERIFIED',
        complianceStatus: 'NOT_VERIFIED',
        isLegallyEnforceable: false,
        reason: 'Succession evidence is missing or stripped. Cannot establish current standard without primary evidence.'
      };
    }

    if (hasConflictingEvidence) {
      return {
        status: 'NOT_VERIFIED',
        complianceStatus: 'REVIEW_REQUIRED',
        isLegallyEnforceable: false,
        reason: 'Conflicting BIS evidence detected. Legal review required before establishing compliance.'
      };
    }

    const evalDate = evaluationDate || new Date().toISOString().slice(0, 10);
    const res = RegulatoryTemporalEngine.resolveIS7983Succession(evalDate);
    return {
      status: res.status2026,
      complianceStatus: res.status2026 === 'CURRENT' ? 'CURRENT' : 'REVIEW_REQUIRED',
      isLegallyEnforceable: res.status2026 === 'CURRENT',
      reason: res.guidanceNotes
    };
  }
}

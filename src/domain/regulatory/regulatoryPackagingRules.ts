/**
 * ============================================================================
 * P2 — PACKAGING COMPLIANCE ENGINE
 * ============================================================================
 * Evaluates child-resistant closures, tactile warnings of danger (EU CLP),
 * and Legal Metrology container formatting.
 * ============================================================================
 */

import { PackagingComplianceReport, RegulatoryJurisdictionId } from './types';

export class PackagingComplianceEngine {
  public static evaluatePackaging(
    jurisdiction: RegulatoryJurisdictionId,
    signalWord: 'DANGER' | 'WARNING' | 'NONE',
    calculatedPH?: number
  ): PackagingComplianceReport {
    const findings: string[] = [];
    const isExtremePh = calculatedPH !== undefined && Number.isFinite(calculatedPH) && (calculatedPH <= 2.0 || calculatedPH >= 11.5);

    // pH and an unverified signal word are not enough to decide legal package requirements.
    // These booleans are nullable so UNKNOWN is not confused with NOT REQUIRED.
    const childResistantClosureRequired: boolean | null = null;
    const tactileWarningRequired: boolean | null = jurisdiction === 'EU' ? null : false;
    findings.push('Child-resistant closure requirement is NOT DETERMINED: verified mixture hazard category and applicable jurisdictional packaging rule are required.');
    if (jurisdiction === 'EU') {
      findings.push('EU tactile-warning requirement is NOT DETERMINED: verified CLP hazard category and consumer-package applicability are required.');
    }
    if (isExtremePh) {
      findings.push('Extreme pH is a hazard-screening trigger, not a standalone legal determination of corrosivity or child-resistant packaging requirements.');
    }

    return {
      overallPackagingStatus: 'REVIEW_REQUIRED',
      childResistantClosureRequired,
      childResistantClosureVerified: false, // Requires physical package audit
      tactileWarningRequired,
      tactileWarningVerified: false,
      recyclabilityInfoAvailable: false,
      legalMetrologyUnitFormatted: false,
      findings: [...findings, 'Physical packaging evidence was not supplied; closure, tactile warning, recyclability and legal-metrology declarations require package-level verification.']
    };
  }
}

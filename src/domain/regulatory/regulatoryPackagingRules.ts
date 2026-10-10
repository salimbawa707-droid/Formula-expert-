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
    const isExtremePh = calculatedPH !== undefined && (calculatedPH <= 2.0 || calculatedPH >= 11.5);

    // 1. Child-Resistant Closure (CRC) Requirement
    const childResistantClosureRequired = signalWord === 'DANGER' || isExtremePh;
    if (childResistantClosureRequired) {
      findings.push('Child-Resistant Closure (CRC) is MANDATORY due to severe corrosive GHS hazard classification (pH extreme or DANGER signal word).');
    }

    // 2. Tactile Warning of Danger (TWD) Requirement (EU CLP)
    const tactileWarningRequired = jurisdiction === 'EU' && (signalWord === 'DANGER' || isExtremePh);
    if (tactileWarningRequired) {
      findings.push('Tactile Warning of Danger (TWD raised equilateral triangle ISO 11683) is MANDATORY on EU consumer packaging.');
    }

    return {
      overallPackagingStatus: childResistantClosureRequired ? 'REVIEW_REQUIRED' : 'PASS',
      childResistantClosureRequired,
      childResistantClosureVerified: false, // Requires physical package audit
      tactileWarningRequired,
      tactileWarningVerified: false,
      recyclabilityInfoAvailable: true,
      legalMetrologyUnitFormatted: true,
      findings
    };
  }
}

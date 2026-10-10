/**
 * ============================================================================
 * P2 — REGULATORY AUDIT TRAIL ENGINE
 * ============================================================================
 * Records and logs complete, reproducible regulatory decisions for compliance
 * reporting, quality gates, and regulatory inspections.
 * ============================================================================
 */

import { RegulatoryDecision } from './types';

export interface RegulatoryAuditRecord {
  auditId: string;
  timestamp: string;
  formulaId?: string;
  formulaTitle?: string;
  productCategory: string;
  jurisdiction: string;
  regulatoryKnowledgeVersion: string;
  overallStatus: string;
  totalPassedRules: number;
  totalFailedRules: number;
  totalReviewRequiredRules: number;
  engineVersion: string;
}

export class RegulatoryAuditEngine {
  private static auditLogs: RegulatoryAuditRecord[] = [];

  public static recordAudit(decision: RegulatoryDecision, formulaId?: string, formulaTitle?: string): RegulatoryAuditRecord {
    const auditRecord: RegulatoryAuditRecord = {
      auditId: `AUD_REG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: decision.decisionTimestamp,
      formulaId,
      formulaTitle,
      productCategory: decision.scopedIdentity.productCategory,
      jurisdiction: decision.scopedIdentity.jurisdiction,
      regulatoryKnowledgeVersion: decision.scopedIdentity.regulatoryKnowledgeVersion,
      overallStatus: decision.overallStatus,
      totalPassedRules: decision.passedRules.length,
      totalFailedRules: decision.failedRules.length,
      totalReviewRequiredRules: decision.reviewRequired.length,
      engineVersion: decision.engineVersion
    };

    RegulatoryAuditEngine.auditLogs.push(auditRecord);
    return auditRecord;
  }

  public static getAuditLogs(): RegulatoryAuditRecord[] {
    return [...RegulatoryAuditEngine.auditLogs];
  }
}

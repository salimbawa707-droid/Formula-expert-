/**
 * Closed-Loop Audit Service
 * 
 * Cryptographically logs closed-loop events into an immutable SHA-256 audit chain.
 * Records result ingestion, prediction comparison, deviation identification,
 * feedback generation, human review, and reformulation candidate approval/rejection.
 */

import { computeSha256 } from '../labAutomation/protocolHashService';

export interface ClosedLoopAuditEvent {
  eventId: string;
  eventType:
    | 'RESULT_INGESTED'
    | 'EVALUATION_PERFORMED'
    | 'DEVIATION_IDENTIFIED'
    | 'FEEDBACK_GENERATED'
    | 'REFORMULATION_CANDIDATE_CREATED'
    | 'HUMAN_REVIEW_APPROVED'
    | 'HUMAN_REVIEW_REJECTED'
    | 'NEW_FORMULA_VERSION_EMITTED';
  formulaId: string;
  formulaVersionId: string;
  batchId?: string;
  sampleId?: string;
  operator: string;
  details: string;
  timestamp: string;
  eventHash: string;
  previousEventHash: string;
}

export class ClosedLoopAuditService {
  private static auditLog: ClosedLoopAuditEvent[] = [];
  private static latestHash = 'GENESIS_CLOSED_LOOP_AUDIT_BLOCK';

  public static recordEvent(
    eventType: ClosedLoopAuditEvent['eventType'],
    formulaId: string,
    formulaVersionId: string,
    operator: string,
    details: string,
    batchId?: string,
    sampleId?: string
  ): ClosedLoopAuditEvent {
    const eventId = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const previousEventHash = this.latestHash;
    const eventHash = computeSha256(
      JSON.stringify({
        eventId,
        eventType,
        formulaId,
        formulaVersionId,
        batchId: batchId || '',
        sampleId: sampleId || '',
        operator,
        details,
        timestamp,
        previousEventHash,
      })
    );

    const event: ClosedLoopAuditEvent = {
      eventId,
      eventType,
      formulaId,
      formulaVersionId,
      batchId,
      sampleId,
      operator,
      details,
      timestamp,
      eventHash,
      previousEventHash,
    };

    this.auditLog.push(event);
    this.latestHash = eventHash;
    return event;
  }

  public static getAuditLogForFormula(formulaId: string): ClosedLoopAuditEvent[] {
    return this.auditLog.filter(e => e.formulaId === formulaId);
  }

  public static verifyAuditChainIntegrity(): boolean {
    let currentPrev = 'GENESIS_CLOSED_LOOP_AUDIT_BLOCK';
    for (const event of this.auditLog) {
      if (event.previousEventHash !== currentPrev) {
        return false;
      }
      const recalculated = computeSha256(
        JSON.stringify({
          eventId: event.eventId,
          eventType: event.eventType,
          formulaId: event.formulaId,
          formulaVersionId: event.formulaVersionId,
          batchId: event.batchId || '',
          sampleId: event.sampleId || '',
          operator: event.operator,
          details: event.details,
          timestamp: event.timestamp,
          previousEventHash: event.previousEventHash,
        })
      );
      if (recalculated !== event.eventHash) {
        return false;
      }
      currentPrev = event.eventHash;
    }
    return true;
  }
}

/**
 * Experiment Lineage Service
 * 
 * Provides complete queryable provenance tracing across the entire closed-loop R&D chain:
 * FormulaVersion -> BatchRecord -> LabSample -> ProtocolVersion -> ProtocolHash ->
 * LabMeasurement -> EvidenceRecord -> PredictionVsMeasurement -> Feedback ->
 * ReformulationCandidate -> New FormulaVersion.
 */

import {
  ClosedLoopIterationRecord,
} from './types';
import { computeSha256 } from '../labAutomation/protocolHashService';

export interface LineageTraceQuery {
  formulaId?: string;
  formulaVersionId?: string;
  batchId?: string;
  sampleId?: string;
  protocolId?: string;
  protocolHash?: string;
  evidenceRecordId?: string;
}

export interface LineageTraceNode {
  iterationCycle: number;
  formulaId: string;
  inputFormulaVersionId: string;
  batchId: string;
  sampleId: string;
  protocolId?: string;
  protocolHash?: string;
  evidenceRecordIds: string[];
  resultsCount: number;
  outputFormulaVersionId?: string;
  isClosedLoopComplete: boolean;
}

export class ExperimentLineageService {
  private static records: ClosedLoopIterationRecord[] = [];

  public static registerIteration(record: ClosedLoopIterationRecord): void {
    this.records.push(record);
  }

  public static getIterationHistory(formulaId: string): ClosedLoopIterationRecord[] {
    return this.records.filter(r => r.formulaId === formulaId);
  }

  public static traceLineage(query: LineageTraceQuery): ClosedLoopIterationRecord[] {
    return this.records.filter(r => {
      if (query.formulaId && r.formulaId !== query.formulaId) return false;
      if (query.formulaVersionId && r.inputFormulaVersionId !== query.formulaVersionId && r.outputFormulaVersionId !== query.formulaVersionId) return false;
      if (query.batchId && r.batchId !== query.batchId) return false;
      if (query.sampleId && r.sampleId !== query.sampleId) return false;
      if (query.protocolId && r.protocolId !== query.protocolId) return false;
      if (query.protocolHash && r.protocolHash !== query.protocolHash) return false;
      if (query.evidenceRecordId && !r.evidenceRecordIds.includes(query.evidenceRecordId)) return false;
      return true;
    });
  }

  public static buildCanonicalIterationHash(
    cycle: number,
    inputVersion: string,
    batchId: string,
    evidenceIds: string[],
    actionCategory: string,
    previousHash?: string
  ): string {
    const canonicalString = JSON.stringify({
      cycle,
      inputVersion,
      batchId,
      evidenceIds: [...evidenceIds].sort(),
      actionCategory,
      previousHash: previousHash || 'GENESIS',
    });
    return computeSha256(canonicalString);
  }
}

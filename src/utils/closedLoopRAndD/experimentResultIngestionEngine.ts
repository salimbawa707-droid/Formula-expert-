/**
 * Experiment Result Ingestion Engine
 * 
 * Ingests empirical lab results from Clean-Room LIMS, Opentrons executions,
 * OpenSpecy spectral conformities, instrument CSV exports, or bench measurements.
 * 
 * Validates identity, formula lineage, unit integrity, and detects duplicates or conflicts.
 */

import {
  ExperimentResult,
  DataQualityStatus,
  IngestionSourceType,
} from './types';
import { StandardUnit } from '../specificationEngine/types';
import { ScientificEvidenceLevel, EvidenceVerificationStatus } from '../../domain/lims/types';

export interface IngestResultInput {
  experimentId: string;
  formulaId: string;
  formulaVersionId: string;
  batchId: string;
  sampleId: string;
  protocolId?: string;
  protocolVersion?: string;
  protocolHash?: string;
  externalRunId?: string;
  testId: string;
  measurementId: string;
  evidenceRecordId: string;
  parameterKey: string;
  parameterName: string;
  measuredValue: number;
  measuredUnit: StandardUnit;
  measurementTimestamp: string;
  instrumentId: string;
  methodId: string;
  evidenceLevel: ScientificEvidenceLevel;
  verificationStatus: EvidenceVerificationStatus;
  ingestionSource: IngestionSourceType;
  ingestedBy: string;
}

export interface IngestionBatchResult {
  results: ExperimentResult[];
  validCount: number;
  invalidCount: number;
  conflictCount: number;
  duplicateCount: number;
  reviewCount: number;
  issues: string[];
}

/**
 * Ingests and validates a single laboratory result record
 */
export function ingestExperimentResult(
  input: IngestResultInput,
  existingResults: ExperimentResult[] = []
): ExperimentResult {
  const resultId = `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  let quality: DataQualityStatus = 'VALID';

  const requiredIdentityFields: Array<keyof IngestResultInput> = [
    'experimentId', 'formulaId', 'formulaVersionId', 'batchId', 'sampleId',
    'testId', 'measurementId', 'evidenceRecordId', 'parameterKey',
    'parameterName', 'measuredUnit', 'measurementTimestamp', 'instrumentId',
    'methodId', 'ingestionSource', 'ingestedBy',
  ];
  const missingFields = requiredIdentityFields.filter(key => {
    const value = input[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  // Validate the complete lineage before duplicate/conflict checks. Invalid
  // records must never be relabelled as duplicates or valid by later branches.
  if (missingFields.length > 0) {
    quality = 'INCOMPLETE';
  } else if (
    typeof input.measuredValue !== 'number' ||
    !Number.isFinite(input.measuredValue) ||
    !Number.isFinite(Date.parse(input.measurementTimestamp))
  ) {
    quality = 'INVALID';
  } else if (
    input.verificationStatus === 'REJECTED' ||
    input.evidenceLevel === 'INSUFFICIENT_DATA' ||
    input.evidenceLevel === 'NOT_TESTED'
  ) {
    quality = 'REQUIRES_REVIEW';
  }

  if (quality === 'VALID') {
    const sameMeasurement = existingResults.find(
      result => result.sampleId === input.sampleId && result.measurementId === input.measurementId
    );

    if (sameMeasurement) {
      const exactDuplicate =
        sameMeasurement.formulaId === input.formulaId &&
        sameMeasurement.formulaVersionId === input.formulaVersionId &&
        sameMeasurement.batchId === input.batchId &&
        sameMeasurement.parameterKey === input.parameterKey &&
        sameMeasurement.measuredValue === input.measuredValue &&
        sameMeasurement.measuredUnit === input.measuredUnit &&
        sameMeasurement.evidenceRecordId === input.evidenceRecordId;
      quality = exactDuplicate ? 'DUPLICATE' : 'CONFLICT_REQUIRES_REVIEW';
    } else {
      const lineageConflict = existingResults.find(
        result =>
          result.sampleId === input.sampleId &&
          (result.formulaId !== input.formulaId || result.formulaVersionId !== input.formulaVersionId)
      );
      if (lineageConflict) quality = 'CONFLICT_REQUIRES_REVIEW';
    }
  }

  return {
    resultId,
    experimentId: input.experimentId,
    formulaId: input.formulaId,
    formulaVersionId: input.formulaVersionId,
    batchId: input.batchId,
    sampleId: input.sampleId,
    protocolId: input.protocolId,
    protocolVersion: input.protocolVersion,
    protocolHash: input.protocolHash,
    externalRunId: input.externalRunId,
    testId: input.testId,
    measurementId: input.measurementId,
    evidenceRecordId: input.evidenceRecordId,
    parameterKey: input.parameterKey,
    parameterName: input.parameterName,
    measuredValue: input.measuredValue,
    measuredUnit: input.measuredUnit,
    measurementTimestamp: input.measurementTimestamp,
    instrumentId: input.instrumentId,
    methodId: input.methodId,
    evidenceLevel: input.evidenceLevel,
    verificationStatus: input.verificationStatus,
    dataQuality: quality,
    ingestionSource: input.ingestionSource,
    ingestedAt: new Date().toISOString(),
    ingestedBy: input.ingestedBy,
  };
}

/**
 * Batch ingests multiple laboratory results
 */
export function ingestExperimentResultBatch(
  inputs: IngestResultInput[],
  existingResults: ExperimentResult[] = []
): IngestionBatchResult {
  const ingested: ExperimentResult[] = [];
  const issues: string[] = [];
  const currentPool = [...existingResults];

  let validCount = 0;
  let invalidCount = 0;
  let conflictCount = 0;
  let duplicateCount = 0;
  let reviewCount = 0;

  for (const input of inputs) {
    const res = ingestExperimentResult(input, currentPool);
    ingested.push(res);
    currentPool.push(res);

    if (res.dataQuality === 'VALID') validCount++;
    else if (res.dataQuality === 'INVALID' || res.dataQuality === 'INCOMPLETE') {
      invalidCount++;
      issues.push(`Result for sample '${input.sampleId}' parameter '${input.parameterKey}' is ${res.dataQuality}.`);
    } else if (res.dataQuality === 'CONFLICT_REQUIRES_REVIEW') {
      conflictCount++;
      issues.push(`Result conflict detected for sample '${input.sampleId}' parameter '${input.parameterKey}'.`);
    } else if (res.dataQuality === 'DUPLICATE') {
      duplicateCount++;
      issues.push(`Duplicate measurement '${input.measurementId}' ignored.`);
    } else if (res.dataQuality === 'REQUIRES_REVIEW') {
      reviewCount++;
      issues.push(`Result for sample '${input.sampleId}' parameter '${input.parameterKey}' requires evidence review.`);
    }
  }

  return {
    results: ingested,
    validCount,
    invalidCount,
    conflictCount,
    duplicateCount,
    reviewCount,
    issues,
  };
}

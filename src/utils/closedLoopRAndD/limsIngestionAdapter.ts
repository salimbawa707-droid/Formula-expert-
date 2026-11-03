import type { EvidenceRecord, LabMeasurement, LabTest } from '../../domain/lims/types';
import type { IngestResultInput } from './experimentResultIngestionEngine';

/**
 * Converts an already-recorded authoritative LIMS measurement into the
 * closed-loop ingestion contract. All lineage identifiers are copied from
 * the LIMS records; formulaVersionId is a stable composite key because the
 * LIMS FormulaVersion contract uses formulaId + formulaVersion, not a UUID.
 */
export function buildLimsIngestionInput(
  test: LabTest,
  measurement: LabMeasurement,
  evidence: EvidenceRecord,
  protocolVersion?: string
): IngestResultInput {
  const lineageMatches =
    test.testId === measurement.testId &&
    test.sampleId === measurement.sampleId &&
    test.batchId === measurement.batchId &&
    test.formulaId === measurement.formulaId &&
    test.formulaVersion === measurement.formulaVersion &&
    test.parameterKey === measurement.parameterKey &&
    test.standardUnit === measurement.unit &&
    evidence.measurementId === measurement.measurementId &&
    evidence.testId === test.testId &&
    evidence.sampleId === measurement.sampleId &&
    evidence.batchId === measurement.batchId &&
    evidence.formulaId === measurement.formulaId &&
    evidence.formulaVersion === measurement.formulaVersion &&
    evidence.parameterKey === measurement.parameterKey &&
    evidence.unit === measurement.unit &&
    evidence.instrumentId === measurement.instrumentId;

  if (!lineageMatches) {
    throw new Error('LIMS ingestion blocked: test, measurement, and evidence lineage do not match exactly.');
  }
  if (!Number.isFinite(measurement.value) || !Number.isFinite(Date.parse(measurement.measuredAt))) {
    throw new Error('LIMS ingestion blocked: measurement value or timestamp is invalid.');
  }

  return {
    experimentId: test.testId,
    formulaId: measurement.formulaId,
    formulaVersionId: `${measurement.formulaId}@${measurement.formulaVersion}`,
    batchId: measurement.batchId,
    sampleId: measurement.sampleId,
    protocolId: test.testMethodId,
    protocolVersion,
    testId: test.testId,
    measurementId: measurement.measurementId,
    evidenceRecordId: evidence.evidenceId,
    parameterKey: measurement.parameterKey,
    parameterName: measurement.parameterName,
    measuredValue: measurement.value,
    measuredUnit: measurement.unit,
    measurementTimestamp: measurement.measuredAt,
    instrumentId: measurement.instrumentId,
    methodId: test.testMethodId,
    evidenceLevel: evidence.evidenceLevel,
    verificationStatus: evidence.verificationStatus,
    ingestionSource: 'LIMS_RECORD',
    ingestedBy: measurement.analyst,
  };
}

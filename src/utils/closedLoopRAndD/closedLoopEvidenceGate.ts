import type { ObservedMeasurement } from './types';

export interface ClosedLoopEvidenceGateResult {
  eligible: boolean;
  reasons: string[];
}

/** Fail-closed gate: displayed or simulated values are not empirical evidence. */
export function evaluateClosedLoopEvidenceGate(
  measurements: ObservedMeasurement[]
): ClosedLoopEvidenceGateResult {
  const reasons: string[] = [];
  if (measurements.length === 0) reasons.push('No laboratory measurements are attached to this iteration.');

  measurements.forEach((measurement, index) => {
    const label = measurement.parameterName || measurement.parameterKey || `Measurement ${index + 1}`;
    if (measurement.evidenceLevel !== 'LAB_VALIDATED' && measurement.evidenceLevel !== 'CERTIFIED') reasons.push(`${label}: evidence level is not LAB_VALIDATED or CERTIFIED.`);
    if (measurement.verificationStatus !== 'VERIFIED') reasons.push(`${label}: evidence has not been independently verified.`);
    if (measurement.instrumentCalibrationValid !== true) reasons.push(`${label}: instrument calibration is not confirmed valid.`);
    if (!measurement.instrumentId.trim() || measurement.instrumentId === 'SIMULATED') reasons.push(`${label}: a registered physical instrument is required.`);
    if (!measurement.measurementId.trim() || !measurement.evidenceRecordId.trim()) reasons.push(`${label}: measurement/evidence identity is missing.`);
    if (!measurement.analyst.trim()) reasons.push(`${label}: analyst identity is missing.`);
    if (!Number.isFinite(Date.parse(measurement.measurementTimestamp))) reasons.push(`${label}: measurement timestamp is invalid.`);
    if (!Number.isFinite(measurement.value)) reasons.push(`${label}: measured value is not finite.`);
  });

  return { eligible: reasons.length === 0, reasons };
}

import { LabMeasurementRecord, LabReplicateSummary, StandardUnit } from './types';
import { isValidNumber } from './unitConversions';

/**
 * Aggregates multiple replicate measurements for the same parameter into mean, standard deviation, and range.
 * If single measurement, returns single value without fabricated standard deviation.
 */
export function aggregateLabReplicates(
  parameterKey: string,
  records: LabMeasurementRecord[],
  unit: StandardUnit
): LabReplicateSummary | null {
  const filtered = records.filter(r => r.parameterKey === parameterKey && isValidNumber(r.value));
  if (filtered.length === 0) return null;

  const values = filtered.map(r => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;

  let stdDev: number | undefined = undefined;
  if (values.length > 1) {
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
    stdDev = Math.sqrt(variance);
  }

  const latestTestBasis = filtered[filtered.length - 1]?.testBasis;

  return {
    parameterKey,
    replicatesCount: values.length,
    values,
    mean,
    stdDev,
    min,
    max,
    range,
    unit,
    testBasis: latestTestBasis,
    hasReplicates: values.length > 1
  };
}

/**
 * Filter lab measurements strictly for a specific formula version.
 * Ensures historical measurements do not leak into newer un-tested versions.
 */
export function getMeasurementsForVersion(
  records: LabMeasurementRecord[],
  formulaVersion: string,
  formulaId?: string
): LabMeasurementRecord[] {
  return records.filter(r => {
    const versionMatch = r.formulaVersion === formulaVersion;
    if (formulaId && r.formulaId) {
      return versionMatch && r.formulaId === formulaId;
    }
    return versionMatch;
  });
}

/**
 * Resolves the authoritative laboratory measured value for a parameter.
 * Uses replicate mean if multiple measurements exist, or the single measurement.
 */
export function getAuthoritativeLabValue(
  parameterKey: string,
  records: LabMeasurementRecord[]
): { value: number; count: number; testBasis?: string; record: LabMeasurementRecord } | null {
  const relevant = records.filter(r => r.parameterKey === parameterKey && isValidNumber(r.value));
  if (relevant.length === 0) return null;

  const latest = relevant[relevant.length - 1];
  if (relevant.length === 1) {
    return {
      value: latest.value,
      count: 1,
      testBasis: latest.testBasis,
      record: latest
    };
  }

  const values = relevant.map(r => r.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    value: mean,
    count: values.length,
    testBasis: latest.testBasis,
    record: latest
  };
}

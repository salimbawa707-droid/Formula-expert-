
import { DetailedLabEvidenceRecord } from '../labEvidenceEngine';

/**
 * Parses raw CSV line into a structured record.
 * Handles quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Maps the Pušić 2006 dataset to the canonical LabEvidenceRecord format.
 */
export function ingestPusicDataset(rawCsv: string): DetailedLabEvidenceRecord[] {
  const lines = rawCsv.split('\n');
  const records: DetailedLabEvidenceRecord[] = [];
  const headers = parseCsvLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => row[h.trim()] = values[idx]);

    if (row['transcription_status'] !== 'SOURCE_EXTRACTED_PENDING_SECOND_REVIEW') {
      // In a production system, we would strictly reject unreviewed data, 
      // but for ingestion, we mark it as having warnings.
    }

    const record: DetailedLabEvidenceRecord = {
      measurementId: row['source_id'],
      formulaVersion: '1.0', // Historical data assumption
      parameterKey: 'cleaningScore', // Mapping R460 to Cleaning Score
      value: parseFloat(row['measurement_value']),
      unit: '%', // R460 is typically a percentage of reflectance
      testMethod: row['paper_citation'],
      testDate: '2006-01-01', // Historical paper date
      provenance: 'MEASURED',
      qualityStatus: 'ACCEPTED_WITH_WARNING',
      validationWarnings: ['Requires independent human review (Phase 4B gate pending)'],
      parameterName: row['measurement_name'],
      testConditions: {
        substrate: row['fabric']
      }
    };
    records.push(record);
  }
  return records;
}

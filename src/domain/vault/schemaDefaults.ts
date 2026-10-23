import type { HistoricalReconciliationRecord, InventoryMetricRecord } from './types.ts';

/**
 * These are explicitly reported, not source-level revalidated, figures.
 * They must not be used as a universal record count or to close a phase gate.
 */
export const INITIAL_INVENTORY_METRICS: InventoryMetricRecord[] = [
  {
    id: 'METRIC-PH4B-FLOW-ROUND20',
    category: 'FLOW',
    metricKey: 'numeric_point_rows',
    value: 210,
    unit: 'rows',
    countingUnit: 'numeric measurement-point rows',
    verificationStatus: 'REPORTED_UNVERIFIED',
    sourceReference: 'evidence_vault/scripts/round20_source_record_reconciliation.py',
    notes: 'Reported Round-20 figure. Requires review of the generated source-level reconciliation artifact. Not a count of independent physical samples.',
  },
  {
    id: 'METRIC-PH4B-FILM-ROUND20',
    category: 'FILM',
    metricKey: 'extracted_features',
    value: 7522,
    unit: 'features',
    countingUnit: 'extracted film-thickness features',
    verificationStatus: 'REPORTED_UNVERIFIED',
    sourceReference: 'evidence_vault/scripts/round20_source_record_reconciliation.py',
    notes: 'Reported Round-20 figure. Feature count is not interchangeable with observation rows or independent samples.',
  },
  {
    id: 'METRIC-PH4B-BUBBLE-ROUND20',
    category: 'BUBBLE',
    metricKey: 'raw_area_cells',
    value: 19509,
    unit: 'cells',
    countingUnit: 'raw bubble-area measurement cells; derived radius cells are separate',
    verificationStatus: 'REPORTED_UNVERIFIED',
    sourceReference: 'evidence_vault/scripts/round20_source_record_reconciliation.py',
    notes: 'Reported Round-20 figure. Do not merge with derived formula cells or interpret as independent experiments.',
  },
  {
    id: 'METRIC-PH4B-RHEOMETER-ROUND20',
    category: 'RHEOMETER',
    metricKey: 'numeric_point_rows',
    value: 2233,
    unit: 'rows',
    countingUnit: 'numeric rheometer point rows',
    verificationStatus: 'REPORTED_UNVERIFIED',
    sourceReference: 'evidence_vault/scripts/round20_source_record_reconciliation.py',
    notes: 'Reported Round-20 figure across 62 test groups. Requires source-level artifact review; not a count of independent physical samples.',
  },
  {
    id: 'METRIC-PH4B-RHEOMETER-GROUPS-ROUND20',
    category: 'RHEOMETER',
    metricKey: 'experimental_test_groups',
    value: 62,
    unit: 'groups',
    countingUnit: 'rheometer experimental test groups',
    verificationStatus: 'REPORTED_UNVERIFIED',
    sourceReference: 'evidence_vault/scripts/round20_source_record_reconciliation.py',
    notes: 'Reported Round-20 grouping count; retain separately from numeric point-row counts.',
  },
  {
    id: 'METRIC-PH4B-MIXED-AGGREGATE-ROUND20',
    category: 'MIXED',
    metricKey: 'heterogeneous_arithmetic_sum',
    value: 29474,
    unit: 'mixed units; no single physical unit',
    countingUnit: 'arithmetic sum of Flow rows + Film features + Bubble area cells + Rheometer point rows',
    verificationStatus: 'UNRESOLVED',
    sourceReference: 'evidence_vault/scripts/round20_source_record_reconciliation.py',
    notes: 'Arithmetic only: 210 + 7,522 + 19,509 + 2,233 = 29,474. Categories have incompatible counting units; this is not a universal record count and cannot reconcile the historical 27,982 claim.',
  },
];

export const INITIAL_HISTORICAL_RECONCILIATIONS: HistoricalReconciliationRecord[] = [
  {
    id: 'HIST-PH4B-ROUND5-27982',
    claimValue: 27982,
    claimUnit: 'historical entries; exact counting unit unresolved',
    reconciliationStatus: 'UNRESOLVED',
    sourceReference: 'evidence_vault/forensic_reports/PHASE4B_ROUND18_HISTORICAL_AGGREGATE_RECONCILIATION.md',
    relatedMetricIds: [
      'METRIC-PH4B-FLOW-ROUND20',
      'METRIC-PH4B-FILM-ROUND20',
      'METRIC-PH4B-BUBBLE-ROUND20',
      'METRIC-PH4B-RHEOMETER-ROUND20',
      'METRIC-PH4B-RHEOMETER-GROUPS-ROUND20',
      'METRIC-PH4B-MIXED-AGGREGATE-ROUND20',
    ],
    comparisonAggregateValue: 29474,
    notes: 'Preserve 27,982 as an unverified historical documentation claim. No reproducible original calculation was located. The 29,474 value is only a heterogeneous arithmetic sum. The unsupported 951 adjustment is rejected and must not be reused.',
  },
];

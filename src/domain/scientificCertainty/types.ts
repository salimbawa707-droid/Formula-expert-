/**
 * ============================================================================
 * P2 — SCIENTIFIC CERTAINTY DOMAIN TYPES & SSOT CONTRACTS
 * ============================================================================
 */

export type ScientificMaturity =
  | 'MEASURED'
  | 'LAB_VALIDATED'
  | 'EMPIRICALLY_CALIBRATED'
  | 'SOURCE_BACKED'
  | 'MODEL_PREDICTION'
  | 'ESTIMATED'
  | 'HEURISTIC_SCREENING'
  | 'UNKNOWN';

export interface ScientificUncertainty {
  type: 'MEASUREMENT' | 'PARAMETER' | 'MODEL' | 'PREDICTION' | 'DATA' | 'INPUT' | 'UNCERTAINTY_NOT_QUANTIFIED';
  value?: number;
  lowerBound?: number;
  upperBound?: number;
  description?: string;
}

export interface ScientificResult<T> {
  value: T;
  unit?: string;
  property: string;
  maturity: ScientificMaturity;
  validationStatus:
    | 'UNVALIDATED'
    | 'DATA_PENDING'
    | 'DATA_INSUFFICIENT'
    | 'CALIBRATING'
    | 'VALIDATION_PENDING'
    | 'VALIDATED_WITH_LIMITATIONS'
    | 'LAB_VALIDATED'
    | 'VALIDATION_EXPIRED'
    | 'SUPERSEDED';
  uncertainty?: ScientificUncertainty[];
  applicabilityScope?: string[];
  modelVersion?: string;
  evidenceIds?: string[];
  limitations?: string[];
  assumptions?: string[];
  timestamp: string;
}

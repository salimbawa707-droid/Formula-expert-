/**
 * ============================================================================
 * P2 — SCIENTIFIC CERTAINTY SERVICE (SSOT)
 * ============================================================================
 * Provides authoritative metadata, labels, and explanations for scientific results.
 * ============================================================================
 */

import { ScientificMaturity } from './types';

export const MATURITY_METADATA: Record<ScientificMaturity, { label: string; explanation: string }> = {
  MEASURED: { label: 'Measured', explanation: 'Actual laboratory measurement.' },
  LAB_VALIDATED: { label: 'Lab Validated', explanation: 'Prediction model has passed independent laboratory validation gate.' },
  EMPIRICALLY_CALIBRATED: { label: 'Empirically Calibrated', explanation: 'Parameters fitted using real laboratory data; validation pending.' },
  SOURCE_BACKED: { label: 'Source Backed', explanation: 'Verified evidence/source, not a prediction.' },
  MODEL_PREDICTION: { label: 'Model Prediction', explanation: 'Model-based prediction; validation incomplete.' },
  ESTIMATED: { label: 'Estimated', explanation: 'Approximate estimate based on model/assumption.' },
  HEURISTIC_SCREENING: { label: 'Heuristic Screening', explanation: 'Useful screening score; not experimentally established physical performance.' },
  UNKNOWN: { label: 'Unknown', explanation: 'Insufficient information.' }
};

export class ScientificCertaintyService {
  public static getMaturityLabel(maturity: ScientificMaturity): string {
    return MATURITY_METADATA[maturity].label;
  }

  public static getMaturityExplanation(maturity: ScientificMaturity): string {
    return MATURITY_METADATA[maturity].explanation;
  }
}

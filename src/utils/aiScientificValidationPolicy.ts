/**
 * Phase 4B AI scientific validation policy enforcement.
 * Evidence route labels describe provenance; they never convert estimates into measurements.
 */
export type IngredientEvidenceRoute =
  | 'SUPPLIER_LOT_COA'
  | 'INTERNATIONAL_REFERENCE_SPECIFICATION'
  | 'SECONDARY_LITERATURE_REFERENCE'
  | 'AI_ESTIMATED_OR_ASSUMED'
  | 'MISSING';

export type AiValidationDisposition =
  | 'BENCHMARKED_AI_ESTIMATE'
  | 'REFERENCE_BASED_AI_SCREENING'
  | 'AI_SCREENING_ONLY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CALCULATION_FAILED';

export interface AiValidationEvidence {
  evidenceRoute: IngredientEvidenceRoute;
  exactIdentityAndGrade: boolean;
  matchedBenchmarkAvailable: boolean;
  heldOutEvaluation: boolean;
  sampleCount: number;
  mae?: number;
  rmse?: number;
  confidenceIntervalAvailable: boolean;
  calibrationDemonstrated: boolean;
  modelVersion: string;
  evaluationDate: string;
  massBalancePassed: boolean;
  chargeBalancePassed: boolean;
  unitsResolved: boolean;
  outOfDomain: boolean;
  unresolvedCriticalGap: boolean;
}

export interface AiValidationAssessment {
  disposition: AiValidationDisposition;
  maximumScore: number | null;
  score: number | null;
  labProximityEligible: boolean;
  userLabel: string;
  reasons: string[];
  requiredDisclosure: string;
}

const DISCLOSURE =
  'AI-based scientific validation; not a laboratory test or supplier lot certificate. Confirm critical properties on the actual raw-material lot and finished formula.';

/**
 * Applies conservative, non-compensatory evidence caps.
 * A numeric score is only returned when the caller supplies a finite raw screening score.
 * 90–95 is never a probability and requires a genuinely held-out, calibrated benchmark.
 */
export function assessAiScientificValidation(
  evidence: AiValidationEvidence,
  rawScore: number
): AiValidationAssessment {
  const reasons: string[] = [];
  if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > 100) {
    return {
      disposition: 'CALCULATION_FAILED',
      maximumScore: null,
      score: null,
      labProximityEligible: false,
      userLabel: 'Calculation failed',
      reasons: ['Raw score must be a finite value from 0 to 100.'],
      requiredDisclosure: DISCLOSURE
    };
  }

  if (!evidence.massBalancePassed || !evidence.chargeBalancePassed ||
      !evidence.unitsResolved || evidence.outOfDomain) {
    if (!evidence.massBalancePassed) reasons.push('Mass balance failed.');
    if (!evidence.chargeBalancePassed) reasons.push('Charge balance failed.');
    if (!evidence.unitsResolved) reasons.push('One or more units remain unresolved.');
    if (evidence.outOfDomain) reasons.push('Model input is outside its declared applicability domain.');
    return {
      disposition: 'CALCULATION_FAILED',
      maximumScore: null,
      score: null,
      labProximityEligible: false,
      userLabel: 'Calculation failed — scientific gate blocked',
      reasons,
      requiredDisclosure: DISCLOSURE
    };
  }

  if (evidence.unresolvedCriticalGap) {
    return {
      disposition: 'INSUFFICIENT_EVIDENCE',
      maximumScore: null,
      score: null,
      labProximityEligible: false,
      userLabel: 'Insufficient evidence',
      reasons: ['An unresolved critical evidence gap blocks a composite score.'],
      requiredDisclosure: DISCLOSURE
    };
  }

  let cap = 100;
  if (!evidence.exactIdentityAndGrade) {
    cap = Math.min(cap, 60);
    reasons.push('Exact chemical identity and commercial grade are not established; score capped at 60.');
  }

  const supplierLotVerified = evidence.evidenceRoute === 'SUPPLIER_LOT_COA';
  const benchmarkQualified = evidence.matchedBenchmarkAvailable &&
    evidence.heldOutEvaluation && evidence.sampleCount > 0 &&
    Number.isFinite(evidence.mae) && Number.isFinite(evidence.rmse) &&
    evidence.confidenceIntervalAvailable && evidence.calibrationDemonstrated &&
    Boolean(evidence.modelVersion.trim()) && Boolean(evidence.evaluationDate.trim());

  if (!evidence.matchedBenchmarkAvailable || !benchmarkQualified) {
    cap = Math.min(cap, 70);
    reasons.push('No complete matched, held-out and calibrated endpoint benchmark; no lab-proximity score above 70.');
  }

  if (!supplierLotVerified) {
    reasons.push('Evidence is not an exact supplier lot COA; no supplier-lot verification is claimed.');
  }
  if (evidence.evidenceRoute === 'INTERNATIONAL_REFERENCE_SPECIFICATION' ||
      evidence.evidenceRoute === 'SECONDARY_LITERATURE_REFERENCE') {
    reasons.push('Reference/literature evidence supports screening criteria, not actual lot assay.');
  }
  if (evidence.evidenceRoute === 'AI_ESTIMATED_OR_ASSUMED' ||
      evidence.evidenceRoute === 'MISSING') {
    reasons.push('At least one material input is estimated, assumed, or unsupported.');
  }

  const score = Math.min(rawScore, cap);
  const labProximityEligible = benchmarkQualified && evidence.exactIdentityAndGrade && supplierLotVerified;
  const disposition: AiValidationDisposition = labProximityEligible
    ? 'BENCHMARKED_AI_ESTIMATE'
    : evidence.evidenceRoute === 'INTERNATIONAL_REFERENCE_SPECIFICATION' ||
      evidence.evidenceRoute === 'SECONDARY_LITERATURE_REFERENCE'
      ? 'REFERENCE_BASED_AI_SCREENING'
      : 'AI_SCREENING_ONLY';

  return {
    disposition,
    maximumScore: cap,
    score,
    labProximityEligible,
    userLabel: labProximityEligible ? 'Benchmarked AI estimate' :
      disposition === 'REFERENCE_BASED_AI_SCREENING' ? 'Reference-based AI screening' : 'AI screening only',
    reasons,
    requiredDisclosure: DISCLOSURE
  };
}

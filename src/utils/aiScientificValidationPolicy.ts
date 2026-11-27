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
  /** Endpoint/domain-specific acceptance contract; never use a universal sample threshold. */
  benchmarkEndpointId: string;
  benchmarkDomainId: string;
  minimumSampleCount: number;
  maximumMae: number;
  maximumRmse: number;
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
  /** Required provenance fields before a supplier-lot COA can be treated as attached evidence. */
  supplierName?: string;
  manufacturerName?: string;
  supplierProductName?: string;
  supplierGrade?: string;
  supplierLotNumber?: string;
  coaEvidenceId?: string;
  coaSha256?: string;
  coaIssuedAt?: string;
  coaTestMethods?: string[];
  coaMeasuredProperties?: string[];
}

export interface AiValidationAssessment {
  disposition: AiValidationDisposition;
  maximumScore: number | null;
  score: number | null;
  /** Matched endpoint benchmark eligibility; independent of supplier-lot paperwork. */
  endpointBenchmarkQualified: boolean;
  /** True only when the evidence route is an exact supplier-lot COA. */
  supplierLotVerified: boolean;
  labProximityEligible: boolean;
  scoreSemantics: 'EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY';
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
      endpointBenchmarkQualified: false,
      supplierLotVerified: false,
      labProximityEligible: false,
      scoreSemantics: 'EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY',
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
      endpointBenchmarkQualified: false,
      supplierLotVerified: false,
      labProximityEligible: false,
      scoreSemantics: 'EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY',
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
      endpointBenchmarkQualified: false,
      supplierLotVerified: false,
      labProximityEligible: false,
      scoreSemantics: 'EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY',
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

  const coaProvenanceComplete =
    evidence.evidenceRoute === 'SUPPLIER_LOT_COA' &&
    Boolean(evidence.supplierName?.trim()) &&
    Boolean(evidence.manufacturerName?.trim()) &&
    Boolean(evidence.supplierProductName?.trim()) &&
    Boolean(evidence.supplierGrade?.trim()) &&
    Boolean(evidence.supplierLotNumber?.trim()) &&
    Boolean(evidence.coaEvidenceId?.trim()) &&
    /^[a-f0-9]{64}$/i.test(evidence.coaSha256 || '') &&
    Boolean(evidence.coaIssuedAt?.trim()) &&
    Array.isArray(evidence.coaTestMethods) && evidence.coaTestMethods.length > 0 &&
    Array.isArray(evidence.coaMeasuredProperties) && evidence.coaMeasuredProperties.length > 0;
  const supplierLotVerified = coaProvenanceComplete;
  const benchmarkQualified = evidence.matchedBenchmarkAvailable &&
    evidence.heldOutEvaluation &&
    Number.isInteger(evidence.sampleCount) && Number.isInteger(evidence.minimumSampleCount) &&
    evidence.minimumSampleCount > 0 && evidence.sampleCount >= evidence.minimumSampleCount &&
    Boolean(evidence.benchmarkEndpointId.trim()) && Boolean(evidence.benchmarkDomainId.trim()) &&
    Number.isFinite(evidence.mae) && Number.isFinite(evidence.rmse) &&
    Number.isFinite(evidence.maximumMae) && Number.isFinite(evidence.maximumRmse) &&
    evidence.maximumMae >= 0 && evidence.maximumRmse >= 0 &&
    (evidence.mae as number) <= evidence.maximumMae && (evidence.rmse as number) <= evidence.maximumRmse &&
    evidence.confidenceIntervalAvailable && evidence.calibrationDemonstrated &&
    Boolean(evidence.modelVersion.trim()) && Boolean(evidence.evaluationDate.trim());

  if (!evidence.matchedBenchmarkAvailable || !benchmarkQualified) {
    cap = Math.min(cap, 70);
    reasons.push('No complete matched, held-out and calibrated endpoint benchmark; no lab-proximity score above 70.');
  }

  if (!supplierLotVerified) {
    reasons.push(evidence.evidenceRoute === 'SUPPLIER_LOT_COA'
      ? 'Supplier COA route is incomplete: supplier, manufacturer, product, grade, lot, evidence ID, SHA-256, issue date, test methods and measured properties are all required before lot verification.'
      : 'Evidence is not an exact supplier lot COA; no supplier-lot verification is claimed.');
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
  // Model performance validation and supplier-lot verification are separate claims.
  // A valid held-out endpoint benchmark can qualify the model even when input criteria
  // come from standards/literature; that never verifies the current supplier lot.
  const endpointBenchmarkQualified = benchmarkQualified && evidence.exactIdentityAndGrade;
  const labProximityEligible = endpointBenchmarkQualified;
  const disposition: AiValidationDisposition = endpointBenchmarkQualified
    ? 'BENCHMARKED_AI_ESTIMATE'
    : evidence.evidenceRoute === 'INTERNATIONAL_REFERENCE_SPECIFICATION' ||
      evidence.evidenceRoute === 'SECONDARY_LITERATURE_REFERENCE'
      ? 'REFERENCE_BASED_AI_SCREENING'
      : 'AI_SCREENING_ONLY';

  return {
    disposition,
    maximumScore: cap,
    score,
    endpointBenchmarkQualified,
    supplierLotVerified,
    labProximityEligible,
    scoreSemantics: 'EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY',
    userLabel: labProximityEligible ? 'Benchmarked AI estimate' :
      disposition === 'REFERENCE_BASED_AI_SCREENING' ? 'Reference-based AI screening' : 'AI screening only',
    reasons,
    requiredDisclosure: DISCLOSURE
  };
}

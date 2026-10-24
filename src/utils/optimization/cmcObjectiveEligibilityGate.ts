/**
 * CMC objective eligibility gate.
 *
 * This is a fail-closed policy evaluator only. It is NOT wired into Pareto scoring
 * and does not make CMC eligible by itself; callers must supply verified evidence.
 * Until an independently reviewed benchmark/model exists, objective use remains off.
 */

export type CmcTargetKind =
  | 'PURE_COMPONENT'
  | 'BINARY_MIXTURE'
  | 'MULTICOMPONENT_MIXTURE'
  | 'FINISHED_FORMULA';

export interface CmcObjectiveEligibilityEvidence {
  targetKind?: CmcTargetKind;
  unit?: 'mM' | 'M' | 'mg/L';
  temperatureC?: number;
  methodId?: string;
  canonicalIdentityResolved?: boolean;
  activeMatterInputsSourceBacked?: boolean;
  applicabilityDomainPassed?: boolean;
  sourceProvenanceAndLicenseVerified?: boolean;
  independentSourceReviewPassed?: boolean;
  heldOutStudyCount?: number;
  studyLevelLeakageProtectionPassed?: boolean;
  baselineComparisonPassed?: boolean;
  predeclaredAcceptanceThresholdsPassed?: boolean;
  mae?: number;
  rmse?: number;
  signedBias?: number;
  uncertaintyCalibrated?: boolean;
  modelArtifactVerified?: boolean;
  datasetVersionCurrent?: boolean;
  explicitOptIn?: boolean;
}

export interface CmcObjectiveEligibilityDecision {
  eligible: boolean;
  status: 'ELIGIBLE_FOR_REVIEW' | 'BLOCKED';
  reasons: string[];
}

/**
 * All fields are required to pass; missing evidence is a blocker.
 * "ELIGIBLE_FOR_REVIEW" is intentionally not a lab-validation status.
 */
export function evaluateCmcObjectiveEligibility(
  evidence: CmcObjectiveEligibilityEvidence | null | undefined
): CmcObjectiveEligibilityDecision {
  const reasons: string[] = [];
  if (!evidence) {
    return {
      eligible: false,
      status: 'BLOCKED',
      reasons: ['CMC eligibility evidence manifest is missing.'],
    };
  }

  if (!evidence.targetKind) reasons.push('Target type is not defined.');
  if (!evidence.unit) reasons.push('Target unit is not defined.');
  if (!Number.isFinite(evidence.temperatureC)) reasons.push('Measurement temperature is missing or non-finite.');
  if (!evidence.methodId?.trim()) reasons.push('Measurement method/protocol identifier is missing.');
  if (evidence.canonicalIdentityResolved !== true) reasons.push('Canonical component identity is not verified.');
  if (evidence.activeMatterInputsSourceBacked !== true) reasons.push('Active-matter inputs are not source-backed.');
  if (evidence.applicabilityDomainPassed !== true) reasons.push('Model applicability-domain gate has not passed.');
  if (evidence.sourceProvenanceAndLicenseVerified !== true) reasons.push('Source provenance or reuse license is not verified.');
  if (evidence.independentSourceReviewPassed !== true) reasons.push('Independent source transcription/review has not passed.');
  if (!Number.isInteger(evidence.heldOutStudyCount) || (evidence.heldOutStudyCount ?? 0) < 1) {
    reasons.push('No independent held-out study is recorded.');
  }
  if (evidence.studyLevelLeakageProtectionPassed !== true) reasons.push('Study-level leakage protection has not passed.');
  if (evidence.baselineComparisonPassed !== true) reasons.push('Comparison against declared baselines has not passed.');
  if (evidence.predeclaredAcceptanceThresholdsPassed !== true) reasons.push('Predeclared acceptance thresholds have not passed.');
  if (!Number.isFinite(evidence.mae) || (evidence.mae ?? -1) < 0) reasons.push('MAE is missing or invalid.');
  if (!Number.isFinite(evidence.rmse) || (evidence.rmse ?? -1) < 0) reasons.push('RMSE is missing or invalid.');
  if (!Number.isFinite(evidence.signedBias)) reasons.push('Signed bias is missing or invalid.');
  if (evidence.uncertaintyCalibrated !== true) reasons.push('Prediction uncertainty is not calibrated.');
  if (evidence.modelArtifactVerified !== true) reasons.push('Exact model artifact/version is not verified.');
  if (evidence.datasetVersionCurrent !== true) reasons.push('Dataset version is stale or unverified.');
  if (evidence.explicitOptIn !== true) reasons.push('CMC objective has not been explicitly enabled.');

  return reasons.length === 0
    ? { eligible: true, status: 'ELIGIBLE_FOR_REVIEW', reasons: [] }
    : { eligible: false, status: 'BLOCKED', reasons };
}

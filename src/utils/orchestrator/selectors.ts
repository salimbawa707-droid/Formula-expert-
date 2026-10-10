/**
 * ============================================================================
 * READ-ONLY VIEW-MODEL SELECTORS OVER AUTHORITATIVE EVALUATION RESULT
 * ============================================================================
 *
 * Enforces requirement 6: UI components must not independently decide or call
 * individual scientific engines for final decision-making. They may ONLY
 * consume read-only view-model selectors over the authoritative orchestrator result.
 * ============================================================================
 */

import { CanonicalFormulaEvaluationResult } from './types';

export function selectFormulaOverview(result: CanonicalFormulaEvaluationResult) {
  return {
    identity: result.formulaIdentity,
    scientificValidity: result.scientificValidity,
    finalScientificStatus: result.finalScientificStatus,
    finalReleaseStatus: result.finalReleaseStatus,
    specificationStatus: result.specificationStatus,
    evidenceLevel: result.evidenceLevel,
    confidence: result.confidence,
    fingerprint: result.formulaIdentity.fingerprint,
    isBalanced: result.massBalance.isBalanced,
    totalPercentage: result.massBalance.totalPercentage
  };
}

export function selectVerdictMatrix(result: CanonicalFormulaEvaluationResult) {
  return result.verdictMatrix;
}

export function selectPhysicalProperties(result: CanonicalFormulaEvaluationResult) {
  return {
    pH: result.pHResult.ph,
    phProvenance: result.pHResult.provenance,
    isPHMeasured: result.pHResult.isMeasured,
    phConfidence: result.pHResult.confidence,
    slurryBasis: result.pHResult.slurryBasis,
    bufferCapacity: result.pHResult.bufferCapacity,
    ionicStrength: result.pHResult.ionicStrength,
    activeSurfactants: result.activeMatterResult.totalSurfactantActivePct,
    totalActiveMatter: result.activeMatterResult.totalActiveMatterPct,
    surfactantBreakdown: result.activeMatterResult.surfactantBreakdown,
    hlb: result.hlbResult?.blendedHLB,
    hlbStatus: result.hlbResult?.status,
    viscosity: result.viscosityResult.description,
    viscosityCp: result.viscosityResult.predictedViscosityCp,
    viscosityRating: result.viscosityResult.rating,
    isFluid: result.viscosityResult.isFluid,
    densityGPerCm3: result.densityResult.densityGPerCm3,
    nvrPercentage: result.densityResult.nvrPercentage,
    isNvrComplete: result.densityResult.isNvrComplete,
    totalSolidsPct: result.densityResult.totalSolidsPct,
    waterPercentage: result.massBalance.waterPercentage
  };
}

export function selectCostAnalysis(result: CanonicalFormulaEvaluationResult) {
  return {
    costPerKg: result.costResult.costPerKg,
    totalBatchCost: result.costResult.totalBatchCost,
    isWithinTarget: result.costResult.isWithinTarget,
    targetCostPerKg: result.costResult.targetCostPerKg,
    costBreakdown: result.costResult.costBreakdown,
    marginChain: result.costResult.marginChain
  };
}

export function selectHardnessAndBuilder(result: CanonicalFormulaEvaluationResult) {
  return {
    waterHardnessPpm: result.hardnessResult.waterHardnessPpm,
    hardnessStatus: result.hardnessResult.status,
    maxSupportedPpm: result.hardnessResult.maxSupportedPpm,
    chelatorActivePct: result.chelationResult.chelatorActivePct,
    chelatorNames: result.chelationResult.chelatorNames,
    isChelationSufficient: result.chelationResult.isSufficient,
    sufficiency: result.hardnessResult.sufficiency
  };
}

export function selectPerformanceProfile(result: CanonicalFormulaEvaluationResult) {
  return {
    cpi: result.cleaningResult.cpi,
    cleaningScore: result.cleaningResult.cleaningScore,
    qualitativePower: result.cleaningResult.qualitativePower,
    domainScores: result.cleaningResult.domainScores,
    provenance: result.cleaningResult.provenance,
    isMeasured: result.cleaningResult.isMeasured
  };
}

export function selectComplianceReport(result: CanonicalFormulaEvaluationResult) {
  return {
    regulatory: result.regulatoryResult,
    compatibility: result.compatibilityResult,
    stability: result.stabilityResult,
    labEvidence: result.labEvidenceResult
  };
}

export function selectDiagnostics(result: CanonicalFormulaEvaluationResult) {
  return {
    stageDiagnostics: result.stageDiagnostics,
    blockingIssues: result.blockingIssues,
    warnings: result.warnings,
    errors: result.errors,
    assumptions: result.assumptions,
    unknownParameters: result.unknownParameters,
    uncertainty: result.uncertainty
  };
}

export function selectHLBProfile(result: CanonicalFormulaEvaluationResult) {
  return result.hlbResult;
}


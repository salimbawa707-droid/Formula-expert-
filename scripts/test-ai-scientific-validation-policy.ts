import { assessAiScientificValidation, AiValidationEvidence } from '../src/utils/aiScientificValidationPolicy';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const base: AiValidationEvidence = {
  evidenceRoute: 'SUPPLIER_LOT_COA',
  exactIdentityAndGrade: true,
  matchedBenchmarkAvailable: true,
  heldOutEvaluation: true,
  sampleCount: 120,
  benchmarkEndpointId: 'finished-formula-pH',
  benchmarkDomainId: 'laundry-liquid-commercial-grade',
  minimumSampleCount: 100,
  maximumMae: 0.20,
  maximumRmse: 0.30,
  mae: 0.12,
  rmse: 0.18,
  confidenceIntervalAvailable: true,
  calibrationDemonstrated: true,
  modelVersion: 'pH-model-2.1.0',
  evaluationDate: '2026-11-28',
  massBalancePassed: true,
  chargeBalancePassed: true,
  unitsResolved: true,
  outOfDomain: false,
  unresolvedCriticalGap: false
};

const qualified = assessAiScientificValidation(base, 94);
assert(qualified.score === 94 && qualified.endpointBenchmarkQualified && qualified.supplierLotVerified, 'Qualified held-out benchmark and supplier lot evidence should remain distinct and retain the composite score.');
assert(qualified.scoreSemantics === 'EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY', 'Composite screening score must never be presented as model accuracy.');

const noBenchmark = assessAiScientificValidation({ ...base, matchedBenchmarkAvailable: false }, 96);
assert(noBenchmark.score === 70 && !noBenchmark.labProximityEligible, 'Missing matched benchmark must cap score at 70.');

const noIdentity = assessAiScientificValidation({ ...base, exactIdentityAndGrade: false }, 96);
assert(noIdentity.score === 60, 'Missing exact identity/grade must cap score at 60.');

const referenceOnly = assessAiScientificValidation({ ...base, evidenceRoute: 'INTERNATIONAL_REFERENCE_SPECIFICATION' }, 95);
assert(referenceOnly.disposition === 'BENCHMARKED_AI_ESTIMATE' && referenceOnly.endpointBenchmarkQualified && !referenceOnly.supplierLotVerified, 'A valid held-out model benchmark may qualify independently, while reference specifications never verify the supplier lot.');

const belowMinimumN = assessAiScientificValidation({ ...base, sampleCount: 99 }, 96);
assert(belowMinimumN.score === 70 && !belowMinimumN.endpointBenchmarkQualified, 'Endpoint benchmark below its configured minimum sample count must not qualify.');

const excessiveError = assessAiScientificValidation({ ...base, mae: 0.21 }, 96);
assert(excessiveError.score === 70 && !excessiveError.endpointBenchmarkQualified, 'Endpoint benchmark exceeding its configured MAE threshold must not qualify.');

const failedBalance = assessAiScientificValidation({ ...base, chargeBalancePassed: false }, 99);
assert(failedBalance.disposition === 'CALCULATION_FAILED' && failedBalance.score === null, 'Failed charge balance must block score.');

const criticalGap = assessAiScientificValidation({ ...base, unresolvedCriticalGap: true }, 99);
assert(criticalGap.disposition === 'INSUFFICIENT_EVIDENCE' && criticalGap.score === null, 'Critical evidence gap must block composite score.');

const noSupplierOrBenchmarkEvidence = assessAiScientificValidation({
  ...base,
  evidenceRoute: 'MISSING',
  exactIdentityAndGrade: false,
  matchedBenchmarkAvailable: false,
  heldOutEvaluation: false,
  sampleCount: 0,
  benchmarkEndpointId: '',
  benchmarkDomainId: '',
  confidenceIntervalAvailable: false,
  calibrationDemonstrated: false
}, 94);
assert(noSupplierOrBenchmarkEvidence.score === 60 && !noSupplierOrBenchmarkEvidence.supplierLotVerified && !noSupplierOrBenchmarkEvidence.endpointBenchmarkQualified, 'Production-like missing evidence must cap the composite score and never claim lot or benchmark verification.');

const unresolvedUnits = assessAiScientificValidation({ ...base, unitsResolved: false }, 94);
assert(unresolvedUnits.score === null && unresolvedUnits.disposition === 'CALCULATION_FAILED', 'Unresolved units must block the scientific assessment.');

const invalidScore = assessAiScientificValidation(base, Number.NaN);
assert(invalidScore.disposition === 'CALCULATION_FAILED', 'Non-finite score must fail closed.');

console.log('AI scientific validation policy: 12/12 assertions passed.');

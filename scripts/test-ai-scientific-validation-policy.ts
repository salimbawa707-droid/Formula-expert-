import { assessAiScientificValidation, AiValidationEvidence } from '../utils/aiScientificValidationPolicy';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const base: AiValidationEvidence = {
  evidenceRoute: 'SUPPLIER_LOT_COA',
  exactIdentityAndGrade: true,
  matchedBenchmarkAvailable: true,
  heldOutEvaluation: true,
  sampleCount: 120,
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
assert(qualified.score === 94 && qualified.labProximityEligible, 'Qualified held-out lot/benchmark route should retain its benchmarked score.');

const noBenchmark = assessAiScientificValidation({ ...base, matchedBenchmarkAvailable: false }, 96);
assert(noBenchmark.score === 70 && !noBenchmark.labProximityEligible, 'Missing matched benchmark must cap score at 70.');

const noIdentity = assessAiScientificValidation({ ...base, exactIdentityAndGrade: false }, 96);
assert(noIdentity.score === 60, 'Missing exact identity/grade must cap score at 60.');

const referenceOnly = assessAiScientificValidation({ ...base, evidenceRoute: 'INTERNATIONAL_REFERENCE_SPECIFICATION' }, 95);
assert(referenceOnly.disposition === 'REFERENCE_BASED_AI_SCREENING' && !referenceOnly.labProximityEligible, 'Reference specification must not imply supplier lot verification.');

const failedBalance = assessAiScientificValidation({ ...base, chargeBalancePassed: false }, 99);
assert(failedBalance.disposition === 'CALCULATION_FAILED' && failedBalance.score === null, 'Failed charge balance must block score.');

const criticalGap = assessAiScientificValidation({ ...base, unresolvedCriticalGap: true }, 99);
assert(criticalGap.disposition === 'INSUFFICIENT_EVIDENCE' && criticalGap.score === null, 'Critical evidence gap must block composite score.');

const invalidScore = assessAiScientificValidation(base, Number.NaN);
assert(invalidScore.disposition === 'CALCULATION_FAILED', 'Non-finite score must fail closed.');

console.log('AI scientific validation policy: 7/7 assertions passed.');

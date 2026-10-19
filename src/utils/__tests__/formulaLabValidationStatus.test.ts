import { resolveFormulaLabValidationStatus } from '../lims/formulaValidationStatus';

const base = {
  calculationState: 'VALID' as const,
  validationRequested: true,
  requiredTestCount: 3,
  completedTestCount: 3,
  failedTestCount: 0,
  evidenceComplete: true,
  acceptanceCriteriaReviewed: true,
  reviewerApproved: true,
};

const cases = [
  { input: { ...base, validationRequested: false }, expected: 'CALCULATION_VALID' },
  { input: { ...base, completedTestCount: 1 }, expected: 'LAB_TEST_IN_PROGRESS' },
  { input: { ...base, failedTestCount: 1 }, expected: 'LAB_FAILED' },
  { input: { ...base, acceptanceCriteriaReviewed: false }, expected: 'INSUFFICIENT_EVIDENCE' },
  { input: { ...base, reviewerApproved: false }, expected: 'INSUFFICIENT_EVIDENCE' },
  { input: base, expected: 'LAB_VALIDATED' },
] as const;

for (const scenario of cases) {
  const result = resolveFormulaLabValidationStatus(scenario.input);
  if (result.status !== scenario.expected) {
    throw new Error(`Expected ${scenario.expected}, received ${result.status}: ${result.reason}`);
  }
}

console.log(`Formula lab validation status tests passed (${cases.length} cases).`);

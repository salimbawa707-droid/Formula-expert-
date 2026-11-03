import { FormulaLabValidationStatus } from '../../domain/lims/types';

export interface FormulaValidationStatusInput {
  calculationState: 'VALID' | 'INVALID' | 'UNKNOWN';
  validationRequested: boolean;
  requiredTestCount: number;
  completedTestCount: number;
  failedTestCount: number;
  evidenceComplete: boolean;
  acceptanceCriteriaReviewed: boolean;
  reviewerApproved: boolean;
}

export interface FormulaValidationStatusResult {
  status: FormulaLabValidationStatus;
  reason: string;
}

/** Resolves formula status fail-closed; computed results alone never imply lab validation. */
export function resolveFormulaLabValidationStatus(input: FormulaValidationStatusInput): FormulaValidationStatusResult {
  if (input.failedTestCount > 0) {
    return { status: 'LAB_FAILED', reason: `${input.failedTestCount} laboratory test(s) failed; a passing overall score cannot override a failed test.` };
  }
  if (input.calculationState !== 'VALID') {
    return { status: 'INSUFFICIENT_EVIDENCE', reason: `Calculation state is ${input.calculationState}; resolve calculation errors or missing inputs first.` };
  }
  if (!input.validationRequested) {
    return { status: 'CALCULATION_VALID', reason: 'Calculation checks passed. No laboratory validation has been requested or established.' };
  }
  if (input.requiredTestCount <= 0) {
    return { status: 'LAB_VALIDATION_REQUIRED', reason: 'No product-specific laboratory test plan is defined.' };
  }
  if (input.completedTestCount < input.requiredTestCount) {
    return { status: 'LAB_TEST_IN_PROGRESS', reason: `${Math.max(0, input.requiredTestCount - input.completedTestCount)} required test(s) remain incomplete.` };
  }
  if (!input.evidenceComplete || !input.acceptanceCriteriaReviewed) {
    return { status: 'INSUFFICIENT_EVIDENCE', reason: 'Required source evidence or reviewed acceptance criteria are missing.' };
  }
  if (!input.reviewerApproved) {
    return { status: 'INSUFFICIENT_EVIDENCE', reason: 'Authorized human review and approval are required.' };
  }
  return { status: 'LAB_VALIDATED', reason: 'All required tests, evidence, reviewed criteria and authorized approval are present.' };
}

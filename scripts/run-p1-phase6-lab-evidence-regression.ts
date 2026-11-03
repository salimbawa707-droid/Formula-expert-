import { runP1Phase6LabEvidenceValidationTestSuite } from '../src/utils/__tests__/p1Phase6LabEvidenceValidation.regression.test';

const summary = runP1Phase6LabEvidenceValidationTestSuite();

console.log('\nP1 Phase 6 regression result:');
console.log(`TOTAL=${summary.total} PASSED=${summary.passed} FAILED=${summary.failed}`);

if (summary.total === 0 || summary.failed > 0 || summary.passed !== summary.total) {
  console.error('P1 Phase 6 regression suite failed or reported an invalid summary.');
  process.exitCode = 1;
} else {
  console.log('P1 Phase 6 regression suite passed.');
}

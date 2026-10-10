import { runFormulaTemplateRevalidationTestSuite } from '../src/utils/__tests__/formulaTemplateRevalidation.test';
import { runPhase9TestSuite } from '../src/utils/__tests__/phase9.regression.test';

const p4 = runFormulaTemplateRevalidationTestSuite();
console.log('P4 total:', p4.total, 'passed:', p4.passed, 'failed:', p4.failed);
if (p4.failed > 0) {
  p4.results.filter(r => !r.passed).forEach(r => console.log('  [P4 FAIL]', r.group, '->', r.name, ':', r.message));
}

const p9 = runPhase9TestSuite();
console.log('P9 total:', p9.summary.total, 'passed:', p9.summary.passed, 'failed:', p9.summary.failed);
if (p9.summary.failed > 0) {
  p9.results.filter(r => !r.passed).forEach(r => console.log('  [P9 FAIL]', r.group, '->', r.name, ':', r.message));
}

import { runP0Phase4TemplateRevalidationTestSuite } from '../src/utils/__tests__/p0Phase4TemplateRevalidation.test';
import { runP0Phase9HardcodeEliminationTestSuite } from '../src/utils/__tests__/p0Phase9HardcodeElimination.test';

const p4 = runP0Phase4TemplateRevalidationTestSuite();
console.log('P4 total:', p4.total, 'passed:', p4.passed, 'failed:', p4.failed);
if (p4.failed > 0) {
  p4.results.filter(r => !r.passed).forEach(r => console.log('  [P4 FAIL]', r.group, '->', r.name, ':', r.message));
}

const p9 = runP0Phase9HardcodeEliminationTestSuite();
console.log('P9 total:', p9.summary.total, 'passed:', p9.summary.passed, 'failed:', p9.summary.failed);
if (p9.summary.failed > 0) {
  p9.results.filter(r => !r.passed).forEach(r => console.log('  [P9 FAIL]', r.group, '->', r.name, ':', r.message));
}

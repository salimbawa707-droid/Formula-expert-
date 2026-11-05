
import { runCompatibilityTestSuite } from './src/utils/__tests__/compatibility.regression.test.ts';
import { runLabHealthTestSuite } from './src/utils/__tests__/labHealth.regression.test.ts';
import { runFormulaDataContractTestSuite } from './src/utils/__tests__/formulaDataContract.regression.test.ts';

function check(name, fn) {
  console.log('--- ' + name + ' ---');
  const res = fn();
  for (const r of res.results) {
    if (!r.passed) {
      console.log('FAIL:', r.suite, '|', r.name, '| Error:', r.error, '| Actual:', JSON.stringify(r.actual), '| Expected:', JSON.stringify(r.expected));
    }
  }
}

check('COMPATIBILITY', runCompatibilityTestSuite);
check('LAB HEALTH', runLabHealthTestSuite);
check('FORMULA DATA CONTRACT', runFormulaDataContractTestSuite);

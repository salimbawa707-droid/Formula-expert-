
import { runCompatibilityTestSuite } from './src/utils/__tests__/compatibility.regression.test.ts';
import { runLabHealthTestSuite } from './src/utils/__tests__/labHealth.regression.test.ts';
import { runFormulaDataContractTestSuite } from './src/utils/__tests__/formulaDataContract.regression.test.ts';

let out = '';
const c = runCompatibilityTestSuite();
out += '=== COMPATIBILITY FAILS ===
';
for (const r of c.results) {
  if (!r.passed) out += `Suite: ${r.suite} | Test: ${r.name} | Error: ${r.error} | Actual: ${r.actual} | Expected: ${r.expected}
`;
}

const l = runLabHealthTestSuite();
out += '=== LAB HEALTH FAILS ===
';
for (const r of l.results) {
  if (!r.passed) out += `Suite: ${r.suite} | Test: ${r.name} | Error: ${r.error} | Actual: ${r.actual} | Expected: ${r.expected}
`;
}

const f = runFormulaDataContractTestSuite();
out += '=== FDC FAILS ===
';
for (const r of f.results) {
  if (!r.passed) out += `Suite: ${r.suite} | Test: ${r.name} | Error: ${r.error} | Actual: ${r.actual} | Expected: ${r.expected}
`;
}

console.log(out);

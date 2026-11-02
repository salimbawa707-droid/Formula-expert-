import { runPHEngineV2TestSuite } from '../src/utils/__tests__/pHEngineV2.regression.test';
const summary = runPHEngineV2TestSuite();
console.log(`TOTAL=${summary.total} PASSED=${summary.passed} FAILED=${summary.failed}`);
if (summary.failed > 0) process.exit(1);

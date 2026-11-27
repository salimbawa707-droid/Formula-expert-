import { runFormulaScientificOrchestratorTestSuite } from '../src/utils/__tests__/formulaScientificOrchestrator.regression.test';

const result = runFormulaScientificOrchestratorTestSuite();
if (result.failed > 0) {
  console.error(`Formula Scientific Orchestrator regression failed: ${result.failed}/${result.total}`);
  process.exit(1);
}
console.log(`Formula Scientific Orchestrator regression passed: ${result.passed}/${result.total}`);

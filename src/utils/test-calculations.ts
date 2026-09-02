import { runRegressionTestSuite } from './__tests__/pHEngine.regression.test';
import { runHLBRegressionTestSuite } from './__tests__/hlbEngine.regression.test';
import { runActiveMatterRegressionTestSuite } from './__tests__/activeMatterEngine.regression.test';
import { runMarginChainTestSuite } from './__tests__/marginChain.regression.test';
import { runWaterHardnessTestSuite } from './__tests__/waterHardness.regression.test';
import { runCleaningPerformanceTestSuite } from './__tests__/cleaningPerformance.regression.test';
import { runCompatibilityTestSuite } from './__tests__/compatibility.regression.test';
import { runLabHealthTestSuite } from './__tests__/labHealth.regression.test';
import { runAIGradeTestSuite } from './__tests__/aiGrade.regression.test';
import { runCrossEngineIntegrationTestSuite } from './__tests__/crossEngine.integration.test';
import { runFormulaWorkflowTestSuite } from './__tests__/formulaWorkflow.integration.test';
import { runFormulaDataContractTestSuite } from './__tests__/formulaDataContract.regression.test';
import { runInventoryTestSuite } from './__tests__/inventory.regression.test';
import { runIngredientMasterTestSuite } from './__tests__/ingredientMaster.regression.test';
import { runExpertReasoningTestSuite } from './__tests__/expertReasoning.regression.test';
import { runViscosityEngineTestSuite } from './__tests__/viscosityEngine.regression.test';
import { runCostingEngineTestSuite } from './__tests__/costingEngine.regression.test';
import { runFormulaLibraryVerificationTestSuite } from './__tests__/formulaLibrary.regression.test';
import { runScientificPhaseCTests } from './__tests__/scientificPhaseC.regression.test';
import { runPhaseDForensicTestSuite } from './__tests__/phaseD.forensic.test';
import { runDilutionRegressionTestSuite } from './__tests__/dilutionEngine.regression.test';

const phSummary = runRegressionTestSuite();
const hlbSummary = runHLBRegressionTestSuite();
const activeMatterSummary = runActiveMatterRegressionTestSuite();
const viscositySummary = runViscosityEngineTestSuite();
const dilutionSummary = runDilutionRegressionTestSuite();
const marginSummary = runMarginChainTestSuite();
const costingSummary = runCostingEngineTestSuite();
const librarySummary = runFormulaLibraryVerificationTestSuite();
const hardnessSummary = runWaterHardnessTestSuite();
const cleaningSummary = runCleaningPerformanceTestSuite();
const compatibilitySummary = runCompatibilityTestSuite();
const labHealthSummary = runLabHealthTestSuite();
const aiGradeSummary = runAIGradeTestSuite();
const crossEngineSummary = runCrossEngineIntegrationTestSuite();
const workflowSummary = runFormulaWorkflowTestSuite();
const dataContractSummary = runFormulaDataContractTestSuite();
const inventorySummary = runInventoryTestSuite();
const ingredientMasterSummary = runIngredientMasterTestSuite();
const expertReasoningSummary = runExpertReasoningTestSuite();
const scientificPhaseCResult = runScientificPhaseCTests();
const scientificPhaseCSummary = scientificPhaseCResult.summary;
const phaseDResult = runPhaseDForensicTestSuite();
const phaseDSummary = phaseDResult.summary;

if (scientificPhaseCSummary.failed > 0) {
  console.log('Failed Phase C tests:');
  scientificPhaseCResult.results.filter(r => !r.passed).forEach(r => {
    console.log(`  [FAIL] ${r.group} -> ${r.name}: ${r.message}`);
  });
}

if (phaseDSummary.failed > 0) {
  console.log('Failed Phase D tests:');
  phaseDResult.results.filter(r => !r.passed).forEach(r => {
    console.log(`  [FAIL] ${r.group} -> ${r.name}: ${r.message}`);
  });
}

console.log(`Phase 2.0 pHEngine: ${phSummary.passed}/${phSummary.passed + phSummary.failed} PASS`);
console.log(`Phase 2.0 HLB Engine: ${hlbSummary.passed}/${hlbSummary.passed + hlbSummary.failed} PASS`);
console.log(`Phase 4.0 Active Matter Engine: ${activeMatterSummary.passed}/${activeMatterSummary.passed + activeMatterSummary.failed} PASS`);
console.log(`Phase 5.0 Viscosity Engine: ${viscositySummary.passed}/${viscositySummary.passed + viscositySummary.failed} PASS`);
console.log(`Phase 6.0 Dilution Engine: ${dilutionSummary.passed}/${dilutionSummary.passed + dilutionSummary.failed} PASS`);
dilutionSummary.results.filter(r => !r.passed).forEach(r => console.error('DILUTION FAIL:', r));
console.log(`Phase 2.1 Margin Chain: ${marginSummary.passed}/${marginSummary.passed + marginSummary.failed} PASS`);
console.log(`Phase 2.1 Costing Engine & User Pricing: ${costingSummary.passed}/${costingSummary.passed + costingSummary.failed} PASS`);
console.log(`Phase 2.1 Formula Library & Custom Titles: ${librarySummary.passed}/${librarySummary.passed + librarySummary.failed} PASS`);
console.log(`Phase 2.2 Water Hardness: ${hardnessSummary.passed}/${hardnessSummary.passed + hardnessSummary.failed} PASS`);
console.log(`Phase 2.3 Cleaning Performance: ${cleaningSummary.passed}/${cleaningSummary.passed + cleaningSummary.failed} PASS`);
console.log(`Phase 2.4 Compatibility: ${compatibilitySummary.passed}/${compatibilitySummary.passed + compatibilitySummary.failed} PASS`);
console.log(`Phase 2.5 Lab Health: ${labHealthSummary.passed}/${labHealthSummary.passed + labHealthSummary.failed} PASS`);
console.log(`Phase 2.6 AI Grade: ${aiGradeSummary.passed}/${aiGradeSummary.passed + aiGradeSummary.failed} PASS`);
console.log(`Phase 2.7 Cross-Engine Integration: ${crossEngineSummary.passed}/${crossEngineSummary.passed + crossEngineSummary.failed} PASS`);
console.log(`Phase 2.8 Formula Workflow Audit: ${workflowSummary.passed}/${workflowSummary.passed + workflowSummary.failed} PASS`);
console.log(`Phase 2.9 Formula Data Contract: ${dataContractSummary.passed}/${dataContractSummary.passed + dataContractSummary.failed} PASS`);
console.log(`Phase 3.0 Inventory Foundation: ${inventorySummary.passed}/${inventorySummary.passed + inventorySummary.failed} PASS`);
console.log(`Phase 3.0 Ingredient Master Architecture: ${ingredientMasterSummary.passed}/${ingredientMasterSummary.passed + ingredientMasterSummary.failed} PASS`);
console.log(`Phase 3.1 Expert Formulation Reasoning: ${expertReasoningSummary.passed}/${expertReasoningSummary.passed + expertReasoningSummary.failed} PASS`);
console.log(`Phase C.0 Master Scientific Validation: ${scientificPhaseCSummary.passed}/${scientificPhaseCSummary.total} PASS`);
console.log(`Phase D.0 Forensic Result Integrity Audit: ${phaseDSummary.passed}/${phaseDSummary.total} PASS`);

if (
  phSummary.failed > 0 ||
  hlbSummary.failed > 0 ||
  activeMatterSummary.failed > 0 ||
  viscositySummary.failed > 0 ||
  dilutionSummary.failed > 0 ||
  marginSummary.failed > 0 ||
  costingSummary.failed > 0 ||
  librarySummary.failed > 0 ||
  hardnessSummary.failed > 0 ||
  cleaningSummary.failed > 0 ||
  compatibilitySummary.failed > 0 ||
  labHealthSummary.failed > 0 ||
  aiGradeSummary.failed > 0 ||
  crossEngineSummary.failed > 0 ||
  workflowSummary.failed > 0 ||
  dataContractSummary.failed > 0 ||
  inventorySummary.failed > 0 ||
  ingredientMasterSummary.failed > 0 ||
  expertReasoningSummary.failed > 0 ||
  scientificPhaseCSummary.failed > 0 ||
  phaseDSummary.failed > 0
) {
  process.exit(1);
}








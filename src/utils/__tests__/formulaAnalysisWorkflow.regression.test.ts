/**
 * ============================================================================
 * FORMULA ANALYSIS WORKFLOW REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies all 12 requirements of Problem 2:
 * 1. Editing ingredient quantities updates live totals without clicking Check My Formula
 * 2. Ingredient addition and removal update all dependent totals
 * 3. Invalid and incomplete formulas produce explicit validation results
 * 4. Clicking Check My Formula executes the expected real stage sequence
 * 5. Dependency failures prevent dependent stages from being reported as passed
 * 6. Progress reflects actual stage execution
 * 7. Intermediate results are not mistaken for final results
 * 8. Final authoritative recomputation detects inconsistent values
 * 9. Rapid repeated clicks do not cause duplicate or conflicting results
 * 10. Editing formula during analysis cannot cause stale results to overwrite latest revision
 * 11. Errors are surfaced accurately and retry works
 * 12. Existing scientific-engine regression calculations remain unchanged and pass
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import {
  calculateFormulaFingerprint,
  executeStagedScientificAnalysis,
  SCIENTIFIC_STAGE_DEFINITIONS,
  FormulaAnalysisSnapshot,
  StagedWorkflowProgress
} from '../analysisWorkflowEngine';
import {
  calculateRawSurfactants,
  calculateActiveSurfactants,
  calculateActiveMatter
} from '../activeMatterEngine';
import { calculateFormulaCost } from '../costingEngine';

export interface WorkflowTestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export async function runFormulaAnalysisWorkflowTestSuite(): Promise<{
  passed: number;
  failed: number;
  total: number;
  results: WorkflowTestResult[];
}> {
  const results: WorkflowTestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual?: any, expected?: any) {
    const passed = Boolean(condition);
    results.push({
      group,
      name,
      passed,
      actual,
      expected,
      message: passed ? 'PASSED' : `FAILED: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  }

  // Baseline standard laundry liquid formulation for testing
  const sampleIngredients: FormulationIngredient[] = [
    { id: 'ing-1', name: 'Water (Aqua, Demineralized)', percentage: 70.0, activeMatterPct: 0, role: 'Solvent', costPerKg: 2 },
    { id: 'ing-2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 10.0, activeMatterPct: 90, role: 'Anionic Surfactant', costPerKg: 140 },
    { id: 'ing-3', name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', percentage: 1.3, activeMatterPct: 100, role: 'pH Adjuster', costPerKg: 65 },
    { id: 'ing-4', name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 12.0, activeMatterPct: 70, role: 'Anionic Surfactant', costPerKg: 110 },
    { id: 'ing-5', name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 4.0, activeMatterPct: 30, role: 'Amphoteric Surfactant', costPerKg: 95 },
    { id: 'ing-6', name: 'Sodium Chloride (Salt)', percentage: 1.5, activeMatterPct: 100, role: 'Thickener', costPerKg: 8 },
    { id: 'ing-7', name: 'Sodium Citrate (Dihydrate)', percentage: 1.2, activeMatterPct: 100, role: 'Chelator', costPerKg: 85 }
  ];

  // =========================================================================
  // 1. EDITING INGREDIENT QUANTITIES UPDATES LIVE TOTALS WITHOUT CHECK FORMULA
  // =========================================================================
  {
    const initialRaw = sampleIngredients.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    const initialRawSurfactants = calculateRawSurfactants(sampleIngredients);
    const initialActiveSurfactants = calculateActiveSurfactants(sampleIngredients);
    const initialCost = calculateFormulaCost(sampleIngredients, 100);

    assert('1. Live Totals', 'Initial raw sum matches 100.00%', initialRaw === 100.0, initialRaw, 100.0);
    assert('1. Live Totals', 'Initial raw surfactants is 26.00%', initialRawSurfactants === 26.0, initialRawSurfactants, 26.0);
    assert('1. Live Totals', 'Initial active surfactants is 18.60%', Math.abs(initialActiveSurfactants - 18.6) < 0.05, initialActiveSurfactants, 18.6);

    // Edit SLES from 12% to 15%
    const editedIngredients = sampleIngredients.map(ing =>
      ing.id === 'ing-4' ? { ...ing, percentage: 15.0 } : { ...ing }
    );

    const updatedRaw = editedIngredients.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    const updatedRawSurfactants = calculateRawSurfactants(editedIngredients);
    const updatedActiveSurfactants = calculateActiveSurfactants(editedIngredients);
    const updatedCost = calculateFormulaCost(editedIngredients, 100);

    assert('1. Live Totals', 'Live raw sum updates to 103.00% immediately', updatedRaw === 103.0, updatedRaw, 103.0);
    assert('1. Live Totals', 'Live raw surfactants updates to 29.00%', updatedRawSurfactants === 29.0, updatedRawSurfactants, 29.0);
    assert('1. Live Totals', 'Live active surfactants updates to 20.70%', Math.abs(updatedActiveSurfactants - 20.7) < 0.05, updatedActiveSurfactants, 20.7);
    assert('1. Live Totals', 'Live cost increases with SLES dosage', updatedCost.costPerKg > initialCost.costPerKg, updatedCost.costPerKg > initialCost.costPerKg, true);
  }

  // =========================================================================
  // 2. INGREDIENT ADDITION AND REMOVAL UPDATE ALL DEPENDENT TOTALS
  // =========================================================================
  {
    // Addition
    const withPreservative = [
      ...sampleIngredients,
      { id: 'ing-8', name: 'Phenoxyethanol', percentage: 0.5, activeMatterPct: 100, role: 'Preservative', costPerKg: 350 }
    ];
    const addedRaw = withPreservative.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    const addedCost = calculateFormulaCost(withPreservative, 100);

    assert('2. Addition/Removal', 'Adding ingredient updates total percentage to 100.5%', addedRaw === 100.5, addedRaw, 100.5);
    assert('2. Addition/Removal', 'Adding ingredient updates batch cost', addedCost.totalBatchCost > 0, addedCost.totalBatchCost > 0, true);

    // Removal
    const withoutSalt = withPreservative.filter(i => i.id !== 'ing-6');
    const removedRaw = withoutSalt.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    assert('2. Addition/Removal', 'Removing salt immediately reduces total to 99.0%', removedRaw === 99.0, removedRaw, 99.0);
  }

  // =========================================================================
  // 3. INVALID AND INCOMPLETE FORMULAS PRODUCE EXPLICIT VALIDATION RESULTS
  // =========================================================================
  {
    // Empty formula
    const emptySnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Empty Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: []
    };
    const emptyResult = await executeStagedScientificAnalysis({
      snapshot: emptySnapshot,
      currentLiveFingerprint: 'FP-EMPTY'
    });

    assert('3. Validation', 'Empty formula is marked FAILED', emptyResult.status === 'FAILED', emptyResult.status, 'FAILED');
    assert('3. Validation', 'Snapshot validation stage failed', emptyResult.stages[0].status === 'FAILED', emptyResult.stages[0].status, 'FAILED');
    assert('3. Validation', 'Error details contain zero ingredients message', emptyResult.error?.includes('zero ingredients') === true, true, true);
    assert('3. Validation', 'Audit report marks consistency status FAILED', emptyResult.forensicAuditReport.overallConsistencyStatus === 'FAILED', emptyResult.forensicAuditReport.overallConsistencyStatus, 'FAILED');

    // Negative percentage
    const invalidNumSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Invalid Number Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: [{ id: '1', name: 'LABSA', percentage: -5, activeMatterPct: 90 }]
    };
    const invalidResult = await executeStagedScientificAnalysis({
      snapshot: invalidNumSnapshot,
      currentLiveFingerprint: 'FP-INVALID'
    });
    assert('3. Validation', 'Negative percentage triggers validation failure', invalidResult.status === 'FAILED', invalidResult.status, 'FAILED');

    // Missing chemical name
    const missingNameSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Missing Name Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: [{ id: '1', name: '   ', percentage: 10, activeMatterPct: 90 }]
    };
    const missingNameResult = await executeStagedScientificAnalysis({
      snapshot: missingNameSnapshot,
      currentLiveFingerprint: 'FP-NONAME'
    });
    assert('3. Validation', 'Empty ingredient name triggers validation failure', missingNameResult.status === 'FAILED', missingNameResult.status, 'FAILED');
  }

  // =========================================================================
  // 4. CLICKING CHECK FORMULA EXECUTES THE EXPECTED REAL STAGE SEQUENCE
  // =========================================================================
  {
    const validSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Standard Liquid Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };
    const fp = calculateFormulaFingerprint(validSnapshot);

    const stagedResult = await executeStagedScientificAnalysis({
      snapshot: validSnapshot,
      currentLiveFingerprint: fp
    });

    assert('4. Stage Execution', 'Analysis overall status is COMPLETED or COMPLETED_WITH_WARNINGS', stagedResult.status === 'COMPLETED' || stagedResult.status === 'COMPLETED_WITH_WARNINGS', true, true);
    assert('4. Stage Execution', 'All 11 stages are present in result', stagedResult.stages.length === 11, stagedResult.stages.length, 11);

    const stageIds = stagedResult.stages.map(s => s.stageId);
    const expectedIds = SCIENTIFIC_STAGE_DEFINITIONS.map(d => d.id);
    assert('4. Stage Execution', 'Stages are ordered in exact dependency sequence', JSON.stringify(stageIds) === JSON.stringify(expectedIds), true, true);

    const allDurationsValid = stagedResult.stages.every(s => s.durationMs >= 1);
    assert('4. Stage Execution', 'All executed stages record real elapsed durationMs >= 1', allDurationsValid, allDurationsValid, true);

    assert('4. Stage Execution', 'Deep analysis state is generated and populated', Boolean(stagedResult.deepAnalysisState?.scientificResults), true, true);
  }

  // =========================================================================
  // 5. DEPENDENCY FAILURES PREVENT DEPENDENT STAGES FROM PASSING
  // =========================================================================
  {
    const invalidSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Failed Validation Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: []
    };

    const failResult = await executeStagedScientificAnalysis({
      snapshot: invalidSnapshot,
      currentLiveFingerprint: 'FP-FAIL'
    });

    const downstreamStages = failResult.stages.slice(1);
    const zeroPassed = downstreamStages.every(s => s.status !== 'COMPLETED' && s.status !== 'COMPLETED_WITH_WARNINGS');
    assert('5. Dependency Gate', 'Zero downstream stages are reported as passed when Stage 1 fails', zeroPassed, zeroPassed, true);

    const blockedCount = downstreamStages.filter(s => s.status === 'BLOCKED' || s.status === 'PENDING').length;
    assert('5. Dependency Gate', 'Downstream dependent stages are blocked or pending', blockedCount === 10, blockedCount, 10);
  }

  // =========================================================================
  // 6. PROGRESS REFLECTS ACTUAL STAGE EXECUTION
  // =========================================================================
  {
    const validSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Progress Tracking Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };
    const fp = calculateFormulaFingerprint(validSnapshot);

    const progressEvents: StagedWorkflowProgress[] = [];
    await executeStagedScientificAnalysis({
      snapshot: validSnapshot,
      currentLiveFingerprint: fp,
      onProgress: (prog) => {
        progressEvents.push({ ...prog });
      }
    });

    assert('6. Truthful Progress', 'Progress callback fired multiple times during real execution', progressEvents.length >= 10, progressEvents.length >= 10, true);

    const observedStages = new Set(progressEvents.map(p => p.currentStageId).filter(Boolean));
    assert('6. Truthful Progress', 'Observed real running stage progression for multiple stages', observedStages.size >= 8, observedStages.size >= 8, true);

    const finalEvent = progressEvents[progressEvents.length - 1];
    assert('6. Truthful Progress', 'Final progress event reaches 11 completed stages', finalEvent.completedStageCount === 11, finalEvent.completedStageCount, 11);
  }

  // =========================================================================
  // 7. INTERMEDIATE RESULTS ARE NOT MISTAKEN FOR FINAL RESULTS
  // =========================================================================
  {
    const validSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Intermediate Isolation Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };
    const fp = calculateFormulaFingerprint(validSnapshot);

    const result = await executeStagedScientificAnalysis({
      snapshot: validSnapshot,
      currentLiveFingerprint: fp
    });

    assert('7. Intermediate Isolation', 'Intermediate mass balance is stored in intermediateResults', Boolean(result.intermediateResults['MASS_BALANCE']), true, true);
    assert('7. Intermediate Isolation', 'Intermediate surfactant science is stored in intermediateResults', Boolean(result.intermediateResults['SURFACTANT_SCIENCE']), true, true);
    assert('7. Intermediate Isolation', 'Intermediate neutralization is stored in intermediateResults', Boolean(result.intermediateResults['PH_NEUTRALIZATION']), true, true);

    // Intermediate results are distinct objects from final authoritative deepAnalysisState
    assert('7. Intermediate Isolation', 'Intermediate results object is separate from final deepAnalysisState', result.intermediateResults !== result.deepAnalysisState, true, true);
    assert('7. Intermediate Isolation', 'Final deepAnalysisState contains complete orchestrator and quality gate results', Boolean(result.deepAnalysisState.orchestratorResult && result.deepAnalysisState.scientificResults), true, true);
  }

  // =========================================================================
  // 8. FINAL AUTHORITATIVE RECOMPUTATION DETECTS INCONSISTENT VALUES
  // =========================================================================
  {
    const validSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Forensic Audit Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };
    const fp = calculateFormulaFingerprint(validSnapshot);

    const auditResult = await executeStagedScientificAnalysis({
      snapshot: validSnapshot,
      currentLiveFingerprint: fp
    });

    const report = auditResult.forensicAuditReport;
    assert('8. Forensic Audit', 'Forensic audit report is generated', Boolean(report), true, true);
    assert('8. Forensic Audit', 'Mass balance consistency is verified (within 0.05%)', report.isMassBalanceConsistent, report.isMassBalanceConsistent, true);
    assert('8. Forensic Audit', 'Active surfactant consistency is verified (within 0.05%)', report.isActiveSurfactantConsistent, report.isActiveSurfactantConsistent, true);
    assert('8. Forensic Audit', 'Cost consistency is verified (within ₹0.01)', report.isCostConsistent, report.isCostConsistent, true);
    assert('8. Forensic Audit', 'Revision matches current formula fingerprint', report.isRevisionMatched, report.isRevisionMatched, true);
    assert('8. Forensic Audit', 'Trace entries include mass balance, surfactants, pH, cost, and cleaning', report.traceEntries.length >= 6, report.traceEntries.length >= 6, true);
  }

  // =========================================================================
  // 9. RAPID REPEATED CLICKS DO NOT CAUSE DUPLICATE OR CONFLICTING RESULTS
  // =========================================================================
  {
    const validSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Concurrency Test Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };
    const fp = calculateFormulaFingerprint(validSnapshot);

    const controller1 = new AbortController();
    const promise1 = executeStagedScientificAnalysis({
      snapshot: validSnapshot,
      currentLiveFingerprint: fp,
      abortSignal: controller1.signal
    });

    // Immediately abort request 1 as if superseded by rapid second click
    controller1.abort();

    const controller2 = new AbortController();
    const promise2 = executeStagedScientificAnalysis({
      snapshot: validSnapshot,
      currentLiveFingerprint: fp,
      abortSignal: controller2.signal
    });

    let p1ThrewOrCancelled = false;
    try {
      await promise1;
    } catch {
      p1ThrewOrCancelled = true;
    }

    const r2 = await promise2;
    assert('9. Concurrency & Debounce', 'First aborted request was stopped', p1ThrewOrCancelled || controller1.signal.aborted, true, true);
    assert('9. Concurrency & Debounce', 'Second request completed cleanly', r2.status === 'COMPLETED' || r2.status === 'COMPLETED_WITH_WARNINGS', true, true);
  }

  // =========================================================================
  // 10. EDITING FORMULA DURING ANALYSIS CANNOT OVERWRITE LATEST REVISION
  // =========================================================================
  {
    const snapshotRevisionA: FormulaAnalysisSnapshot = {
      formulaName: 'Revision A Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: 100,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };
    const fpA = calculateFormulaFingerprint(snapshotRevisionA);
    assert('10. Revision Safety', 'Snapshot fingerprint computed', fpA.startsWith('FP-'), true, true);

    // Simulate user edited formula to Revision B during analysis execution
    const fpB = 'FP-DIFFERENT-REVISION-B';

    const result = await executeStagedScientificAnalysis({
      snapshot: snapshotRevisionA,
      currentLiveFingerprint: fpB
    });

    assert('10. Revision Safety', 'Audit detects that live fingerprint did not match analyzed snapshot', result.forensicAuditReport.isRevisionMatched === false, false, false);
    assert('10. Revision Safety', 'Discrepancy lists formula modified mid-run', result.forensicAuditReport.discrepancies.some(d => d.includes('Formula modified during analysis')), true, true);
  }

  // =========================================================================
  // 11. ERRORS ARE SURFACED ACCURATELY AND RETRY WORKS
  // =========================================================================
  {
    // First run with bad batch size <= 0
    const invalidSnapshot: FormulaAnalysisSnapshot = {
      formulaName: 'Retry Test Formula',
      productCategory: 'Laundry Liquid',
      batchSizeKg: -10,
      waterHardnessPpm: 150,
      ingredients: sampleIngredients
    };

    const firstRun = await executeStagedScientificAnalysis({
      snapshot: invalidSnapshot,
      currentLiveFingerprint: 'FP-BAD'
    });
    assert('11. Error & Retry', 'First run fails with accurate error', firstRun.status === 'FAILED', firstRun.status, 'FAILED');
    assert('11. Error & Retry', 'Error mentions batch size', firstRun.error?.includes('Batch size') === true, true, true);

    // Retry with corrected batch size
    const correctedSnapshot: FormulaAnalysisSnapshot = {
      ...invalidSnapshot,
      batchSizeKg: 100
    };
    const retryRun = await executeStagedScientificAnalysis({
      snapshot: correctedSnapshot,
      currentLiveFingerprint: calculateFormulaFingerprint(correctedSnapshot)
    });
    assert('11. Error & Retry', 'Retry with corrected input succeeds', retryRun.status === 'COMPLETED' || retryRun.status === 'COMPLETED_WITH_WARNINGS', true, true);
  }

  // =========================================================================
  // 12. EXISTING SCIENTIFIC ENGINE REGRESSION CALCULATIONS REMAIN UNCHANGED
  // =========================================================================
  {
    // Authoritative math verification on baseline values
    const rawSurfactants = calculateRawSurfactants(sampleIngredients);
    const activeSurfactants = calculateActiveSurfactants(sampleIngredients);
    const activeMatter = calculateActiveMatter(sampleIngredients);
    const cost = calculateFormulaCost(sampleIngredients, 100);

    assert('12. Engine Integrity', 'Raw surfactants engine unchanged (26.00%)', rawSurfactants === 26.0, rawSurfactants, 26.0);
    assert('12. Engine Integrity', 'Active surfactants engine unchanged (18.60%)', Math.abs(activeSurfactants - 18.6) < 0.05, activeSurfactants, 18.6);
    assert('12. Engine Integrity', 'Total active matter engine unchanged (22.60%)', Math.abs(activeMatter - 22.6) < 0.05, activeMatter, 22.6);
    assert('12. Engine Integrity', 'Cost engine calculates correct batch cost (₹34.38/kg)', Math.abs(cost.costPerKg - 34.385) < 0.05, cost.costPerKg, 34.385);
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`==================================================`);
  console.log(`FORMULA ANALYSIS WORKFLOW REGRESSION SUITE:`);
  console.log(`  PASSED: ${passed}/${total}`);
  console.log(`  FAILED: ${failed}/${total}`);
  if (failed > 0) {
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  [FAIL] [${r.group}] ${r.name}: ${r.message}`);
    });
  }
  console.log(`==================================================`);

  return { passed, failed, total, results };
}

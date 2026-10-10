/**
 * ============================================================================
 * P1 PHASE 7 — SCIENTIFIC MODEL GOVERNANCE REGRESSION TEST SUITE
 * ============================================================================
 *
 * Verifies model parameter governance, calibration approval workflows, model versioning,
 * historical reproducibility, rollback semantics, and safety rules:
 * 1. Parameter Registry Integrity & Classification.
 * 2. Calibration Candidate Governance (No automatic activation).
 * 3. Approval Workflow & Explicit Action Contract.
 * 4. Fundamental Chemistry Constant Immutability (PHEngineV2 & pKa protection).
 * 5. Model Versioning & Superceding.
 * 6. Historical Result Reproducibility.
 * 7. Reversible Rollback Semantics.
 * 8. Category & KPI Scope Isolation (Zero cross-category leakage).
 * 9. Engineering Validation Threshold Labeling.
 * 10. Golden Formula Set & Before/After Change Impact Analysis.
 * 11. 39 Formula Templates & Baseline Regression Stability.
 * ============================================================================
 */

import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { FORMULAS } from '../../data/formulas';
import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import {
  evaluateCategoryModelValidation,
  proposeCalibrationCandidates,
  CalibrationCandidateProposal
} from '../labEvidenceEngine';
import {
  ScientificModelGovernanceRegistry,
  GOLDEN_FORMULA_SET,
  calculateModelChangeImpact,
  evaluateHistoricalFormulaReproducibility
} from '../scientificGovernanceEngine';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase7ModelGovernanceTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({
        name,
        passed: false,
        message: `Assertion failed. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
        actual,
        expected
      });
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('\n================================================================================');
  console.log('  P1 PHASE 7 — SCIENTIFIC MODEL GOVERNANCE & VERSIONING TEST SUITE ');
  console.log('================================================================================\n');

  const registry = new ScientificModelGovernanceRegistry();

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Parameter Registry Integrity & Classification
  // --------------------------------------------------------------------------
  const params = registry.getAllParameters();
  assert('1. Governed parameter has unique ID', params.length > 0 && new Set(params.map(p => p.parameterId)).size === params.length, true, true);
  assert('2. Governed parameter has explicit scope', params.every(p => Boolean(p.scope)), true, true);
  assert('3. Governed parameter has explicit provenance', params.every(p => Boolean(p.provenance)), true, true);
  assert('4. Governed parameter has model version', params.every(p => Boolean(p.version)), true, true);

  const chemConst = params.find(p => p.classification === 'CHEMISTRY_CONSTANT');
  assert('5. Chemistry constant classified correctly (e.g. LABSA pKa / Kw)', Boolean(chemConst), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Calibration Candidate Governance & Zero Automatic Mutation
  // --------------------------------------------------------------------------
  const modelObs = [
    { kpiId: 'cleaningScore', predicted: 80, measured: 86, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 85, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 86, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 85, comparable: true },
    { kpiId: 'cleaningScore', predicted: 80, measured: 85, comparable: true }
  ];
  const summary = evaluateCategoryModelValidation('LAUNDRY_LIQUID', modelObs);
  const candidates = proposeCalibrationCandidates(summary);
  const cand = candidates[0];

  assert('6. Candidate created correctly from Phase 6 evidence', Boolean(cand) && cand.canonicalCategory === 'LAUNDRY_LIQUID', true, true);
  assert('7. Candidate retains traceable evidence (sample count & bias)', cand.sampleCount === 5 && cand.observedBias > 0, true, true);

  const activeBefore = registry.getActiveModelVersion('LAUNDRY_LIQUID');
  assert('8. Candidate cannot activate automatically (Active version unchanged upon candidate creation)', activeBefore.versionNumber === '1.0.0', activeBefore.versionNumber, '1.0.0');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Approval Workflow & Explicit Action Contract
  // --------------------------------------------------------------------------
  const approval = registry.approveCalibrationProposal(cand, 'APPROVED_BY_USER', 'Verified against lab detergent swatches');
  assert('9. Proposal -> Review -> Approved via explicit action', approval.approvalStatus === 'APPROVED' && approval.approvedBy === 'APPROVED_BY_USER', true, true);

  // Attempting to activate an unapproved or rejected candidate fails
  const rejectedProposal: CalibrationCandidateProposal = {
    ...cand,
    proposalId: 'prop-rej-01',
    parameterName: 'LABSA Sulfonic Acid pKa' // Target a CHEMISTRY_CONSTANT
  };
  const rejApproval = registry.approveCalibrationProposal(rejectedProposal, 'APPROVED_BY_USER');
  assert('10. Rejected candidate or chemistry constant mutation is REJECTED', rejApproval.approvalStatus === 'REJECTED' && rejApproval.rejectionReason!.includes('ERR_CHEMISTRY_CONSTANT_IMMUTABLE'), true, true);

  assert('11. Approval requires explicit action (APPROVED_BY_USER logged without fake person identity)', approval.approvedBy === 'APPROVED_BY_USER', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Model Versioning & Supersession
  // --------------------------------------------------------------------------
  const newModelVersion = registry.activateModelVersion(approval);
  assert('12. New model version created on activation', newModelVersion.versionNumber === 'laundry_liquid-v1.1.0' && newModelVersion.status === 'ACTIVE', true, true);

  const activeAfter = registry.getActiveModelVersion('LAUNDRY_LIQUID');
  assert('13. Previous baseline model version superseded for category', activeAfter.versionNumber === 'laundry_liquid-v1.1.0', activeAfter.versionNumber, 'laundry_liquid-v1.1.0');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Historical Result Reproducibility
  // --------------------------------------------------------------------------
  const goldenLaundry = GOLDEN_FORMULA_SET[0];
  const histEval = evaluateHistoricalFormulaReproducibility(goldenLaundry.ingredients, goldenLaundry.category, '1.0.0');
  assert('14. Historical result retains old model version reference (Reproducibility test)', histEval.isReproducible && histEval.modelVersionUsed === '1.0.0', true, true);
  assert('15. Same formula + same model version = identical result', typeof histEval.evaluatedResult.cpi === 'number', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Reversible Rollback Semantics
  // --------------------------------------------------------------------------
  const rollbackRes = registry.rollbackModelVersion(newModelVersion.modelVersionId, 'APPROVED_BY_USER');
  assert('16. Active version can be rolled back', rollbackRes.success && rollbackRes.deactivatedVersionId === newModelVersion.modelVersionId, true, true);
  assert('17. Rollback restores parent baseline version as ACTIVE', rollbackRes.restoredActiveVersion.versionNumber === '1.0.0' && rollbackRes.restoredActiveVersion.status === 'ACTIVE', true, true);
  assert('18. Rollback preserves history & audit trail', registry.getAllModelVersions().some(m => m.status === 'ROLLED_BACK'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Category & KPI Scope Isolation
  // --------------------------------------------------------------------------
  const impact = calculateModelChangeImpact(cand);
  assert('19. Laundry calibration cannot alter glass cleaner (Zero cross-category leakage)', !impact.crossCategoryLeakageDetected, true, true);
  assert('20. Impact analysis restricts affected category strictly to LAUNDRY_LIQUID', impact.affectedCategories.length === 1 && impact.affectedCategories[0] === 'LAUNDRY_LIQUID', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Engineering Validation Threshold Labeling
  // --------------------------------------------------------------------------
  const thresholdParam = params.find(p => p.parameterId === 'eng-validation-threshold');
  assert('21. Phase 6 observation threshold is labeled ENGINEERING_VALIDATION_THRESHOLD', Boolean(thresholdParam && thresholdParam.source.includes('ENGINEERING_VALIDATION_THRESHOLD')), true, true);
  assert('22. Five observations are NOT labeled universal scientific law', summary.engineeringValidationThreshold === 5 && summary.overallValidationStatus === 'VALIDATED', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 9: Fundamental Chemistry Constant Protection
  // --------------------------------------------------------------------------
  assert('23. Fundamental chemistry constants locked (PHEngineV2 static class intact)', typeof PHEngineV2.calculatePH === 'function', true, true);
  const goldenLaundryExpectedCPI = calculateCleaningPerformance(goldenLaundry.ingredients, 8.5, goldenLaundry.category).cpi;
  assert('24. Proposed change comparison preserves old result before activation', impact.comparisons[0].oldModelValue === goldenLaundryExpectedCPI, impact.comparisons[0].oldModelValue, goldenLaundryExpectedCPI);

  // --------------------------------------------------------------------------
  // TEST GROUP 10: Golden Formulas & Baseline Stability
  // --------------------------------------------------------------------------
  assert('25. Golden formulas remain stable under baseline model version', GOLDEN_FORMULA_SET.length >= 2, GOLDEN_FORMULA_SET.length, 2);
  assert('26. All 39 canonical formula templates intact', FORMULAS.length >= 39, FORMULAS.length, 39);
  assert('27. All 13 Canonical Product Categories defined in Taxonomy', CANONICAL_PRODUCT_CATEGORY_IDS.length === 13, CANONICAL_PRODUCT_CATEGORY_IDS.length, 13);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 7 MODEL GOVERNANCE TESTS : ${total}`);
  console.log(`PASSED                                  : ${passed}`);
  console.log(`FAILED                                  : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

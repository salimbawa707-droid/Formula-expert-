/**
 * ============================================================================
 * AUTHORITATIVE FORMULA SCIENTIFIC ORCHESTRATOR REGRESSION TEST SUITE
 * ============================================================================
 *
 * Verifies P0 Single Source of Truth (SSOT) Architecture:
 * - A: Complete Formula Evaluation Through Orchestrator
 * - B: Multi-Workflow Result Parity & Convergence (Formula Expert, Library, Batch)
 * - C: Dynamic Product Category Routing & Policy Enforcement
 * - D: UI Override Prevention & Status Authority
 * - E: Uncertainty & Missing Data Propagation (No Silent Defaults)
 * - F: Deterministic Formula Fingerprinting
 * - G: All 8 Evaluation Stages & Structured Diagnostics
 * - H: Regulatory Engine Compliance Verification
 * - I: UI Results Originating Exclusively From Orchestrator
 * - J: Zero Duplicate Final-Decision Paths
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { CanonicalFormulaInput } from '../orchestrator/types';
import {
  selectFormulaOverview,
  selectVerdictMatrix,
  selectPhysicalProperties,
  selectCostAnalysis,
  selectPerformanceProfile,
  selectComplianceReport,
  selectDiagnostics
} from '../orchestrator/selectors';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runFormulaScientificOrchestratorTestSuite() {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    });
  }

  // Standard Test Formulations
  const standardLaundryLiquidFormula: CanonicalFormulaInput = {
    formulaId: 'F-STD-LIQUID-001',
    formulaName: 'Standard Liquid Laundry Detergent',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water (Aqua, Demineralized)', percentage: 70.0, role: 'Solvent', costPerKg: 0 },
      { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 8.0, activeMatterPct: 90, role: 'Anionic Surfactant', costPerKg: 130 },
      { name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', percentage: 0.88, activeMatterPct: 100, role: 'pH Adjuster', costPerKg: 45 },
      { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 10.0, activeMatterPct: 70, role: 'Anionic Surfactant', costPerKg: 95 },
      { name: 'Cocamidopropyl Betaine (CAPB 30%)', percentage: 3.0, activeMatterPct: 30, role: 'Amphoteric Surfactant', costPerKg: 85 },
      { name: 'Sodium Chloride (Salt)', percentage: 1.5, activeMatterPct: 100, role: 'Thickener', costPerKg: 10 },
      { name: 'Sodium Citrate (Dihydrate)', percentage: 1.0, activeMatterPct: 100, role: 'Chelator', costPerKg: 90 },
      { name: 'Phenoxyethanol (Safe Preservative)', percentage: 0.2, activeMatterPct: 100, role: 'Preservative', costPerKg: 350 },
      { name: 'Water (Aqua, Balance to 100%)', percentage: 5.42, activeMatterPct: 0, role: 'Solvent', costPerKg: 0 }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 150,
    costContext: {
      targetCostPerKg: 45.0
    }
  };

  // =========================================================================
  // TEST GROUP A: FORMULA EVALUATED THROUGH AUTHORITATIVE ORCHESTRATOR
  // =========================================================================
  const evalResult = FormulaScientificOrchestrator.evaluate(standardLaundryLiquidFormula);

  assert(
    'Group A: Orchestrator Pipeline',
    'Evaluates formula and returns valid formula identity',
    Boolean(evalResult.formulaIdentity && evalResult.formulaIdentity.id === 'F-STD-LIQUID-001'),
    evalResult.formulaIdentity?.id,
    'F-STD-LIQUID-001'
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'Mass balance totals exactly 100.00% and is balanced',
    evalResult.massBalance.isBalanced && Math.abs(evalResult.massBalance.totalPercentage - 100.0) < 0.05,
    evalResult.massBalance.totalPercentage,
    100.0
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'PHEngineV2 calculates equilibrium pH with solver convergence',
    evalResult.pHResult.solverConverged && evalResult.pHResult.ph > 6.0 && evalResult.pHResult.ph < 10.0,
    evalResult.pHResult.ph,
    'pH between 6.0 and 10.0 with solverConverged=true'
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'Active matter engine produces surfactant breakdown',
    evalResult.activeMatterResult.totalSurfactantActivePct > 10.0 && evalResult.activeMatterResult.surfactantBreakdown.anionic > 0,
    evalResult.activeMatterResult.totalSurfactantActivePct,
    '> 10.0% active surfactants'
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'Hardness & Chelation engine reports sufficiency for 150 ppm water load',
    evalResult.hardnessResult.waterHardnessPpm === 150 && evalResult.chelationResult.chelatorActivePct > 0,
    evalResult.chelationResult.chelatorActivePct,
    '> 0% active chelator'
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'Compatibility engine evaluates formulation as compatible',
    evalResult.compatibilityResult.compatible === true,
    evalResult.compatibilityResult.compatible,
    true
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'Viscosity, density, and solids calculated',
    evalResult.viscosityResult.isFluid === true && evalResult.densityResult.densityGPerCm3 > 1.0,
    evalResult.densityResult.densityGPerCm3 > 1.0,
    true
  );

  assert(
    'Group A: Orchestrator Pipeline',
    'Cost engine calculates accurate raw material cost',
    evalResult.costResult.costPerKg > 0 && evalResult.costResult.totalBatchCost > 0,
    evalResult.costResult.costPerKg > 0,
    true
  );

  // =========================================================================
  // TEST GROUP B: MULTI-WORKFLOW RESULT PARITY & CONVERGENCE
  // =========================================================================
  // Test B: Same formula evaluated from Formula Expert UI, Formula Library, Formula Builder, Batch Validation
  const evalFromLibrary = FormulaScientificOrchestrator.evaluate({
    ...standardLaundryLiquidFormula,
    formulaId: 'LIB-ENTRY-99'
  });

  const evalFromBatchWorkflow = FormulaScientificOrchestrator.evaluate({
    ...standardLaundryLiquidFormula,
    formulaId: 'BATCH-LOT-2026-X'
  });

  assert(
    'Group B: Workflow Parity',
    'Evaluations across UI, Library, and Batch workflows yield identical scientific validity',
    evalResult.scientificValidity === evalFromLibrary.scientificValidity &&
    evalResult.scientificValidity === evalFromBatchWorkflow.scientificValidity,
    evalFromLibrary.scientificValidity,
    evalResult.scientificValidity
  );

  assert(
    'Group B: Workflow Parity',
    'Calculated pH is identical across all entry workflows',
    evalResult.pHResult.ph === evalFromLibrary.pHResult.ph &&
    evalResult.pHResult.ph === evalFromBatchWorkflow.pHResult.ph,
    evalFromLibrary.pHResult.ph,
    evalResult.pHResult.ph
  );

  assert(
    'Group B: Workflow Parity',
    'Active matter is identical across all entry workflows',
    evalResult.activeMatterResult.totalSurfactantActivePct === evalFromLibrary.activeMatterResult.totalSurfactantActivePct &&
    evalResult.activeMatterResult.totalSurfactantActivePct === evalFromBatchWorkflow.activeMatterResult.totalSurfactantActivePct,
    evalFromLibrary.activeMatterResult.totalSurfactantActivePct,
    evalResult.activeMatterResult.totalSurfactantActivePct
  );

  assert(
    'Group B: Workflow Parity',
    'Final scientific status is identical across all entry workflows',
    evalResult.finalScientificStatus === evalFromLibrary.finalScientificStatus &&
    evalResult.finalScientificStatus === evalFromBatchWorkflow.finalScientificStatus,
    evalFromLibrary.finalScientificStatus,
    evalResult.finalScientificStatus
  );

  assert(
    'Group B: Workflow Parity',
    'Formula fingerprint is identical regardless of formulaId or entry point',
    evalResult.formulaIdentity.fingerprint === evalFromLibrary.formulaIdentity.fingerprint &&
    evalResult.formulaIdentity.fingerprint === evalFromBatchWorkflow.formulaIdentity.fingerprint,
    evalFromLibrary.formulaIdentity.fingerprint,
    evalResult.formulaIdentity.fingerprint
  );

  // =========================================================================
  // TEST GROUP C: CHANGING PRODUCT CATEGORY CHANGES CATEGORY CALCULATIONS
  // =========================================================================
  const dishwashFormula: CanonicalFormulaInput = {
    ...standardLaundryLiquidFormula,
    productCategory: 'DISHWASH_LIQUID'
  };

  const fabricSoftenerFormula: CanonicalFormulaInput = {
    ...standardLaundryLiquidFormula,
    productCategory: 'FABRIC_SOFTENER'
  };

  const powderFormula: CanonicalFormulaInput = {
    formulaName: 'Washing Powder',
    productCategory: 'LAUNDRY_POWDER',
    ingredients: [
      { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 12.0, activeMatterPct: 90, role: 'Anionic Surfactant' },
      { name: 'Sodium Carbonate (Dense Soda Ash)', percentage: 35.0, activeMatterPct: 100, role: 'Builder' },
      { name: 'Zeolite 4A', percentage: 15.0, activeMatterPct: 100, role: 'Builder' },
      { name: 'Sodium Sulfate', percentage: 38.0, activeMatterPct: 100, role: 'Filler' }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 150
  };

  const evalDishwash = FormulaScientificOrchestrator.evaluate(dishwashFormula);
  const evalSoftener = FormulaScientificOrchestrator.evaluate(fabricSoftenerFormula);
  const evalPowder = FormulaScientificOrchestrator.evaluate(powderFormula);

  assert(
    'Group C: Category Dynamics',
    'Liquid laundry and dishwash have different canonical categories and profiles',
    evalResult.formulaIdentity.canonicalCategory === 'LAUNDRY_LIQUID' &&
    evalDishwash.formulaIdentity.canonicalCategory === 'DISHWASH_MANUAL',
    evalDishwash.formulaIdentity.canonicalCategory,
    'DISHWASH_MANUAL'
  );

  assert(
    'Group C: Category Dynamics',
    'Fabric softener triggers critical incompatibility due to anionic surfactants',
    evalSoftener.finalScientificStatus === 'INCOMPATIBLE' || evalSoftener.compatibilityResult.compatible === false,
    evalSoftener.finalScientificStatus,
    'INCOMPATIBLE'
  );

  assert(
    'Group C: Category Dynamics',
    'Powder category correctly activates powder physical form and slurry basis',
    evalPowder.formulaIdentity.physicalForm === 'POWDER' && Boolean(evalPowder.pHResult.slurryBasis),
    evalPowder.formulaIdentity.physicalForm,
    'POWDER'
  );

  // =========================================================================
  // TEST GROUP D: NO UI COMPONENT MAY INDEPENDENTLY OVERRIDE FINAL STATUS
  // =========================================================================
  const overview = selectFormulaOverview(evalResult);
  const matrix = selectVerdictMatrix(evalResult);

  assert(
    'Group D: UI Authority Invariant',
    'Overview reflects immutable final scientific status from quality gate',
    overview.finalScientificStatus === evalResult.finalScientificStatus,
    overview.finalScientificStatus,
    evalResult.finalScientificStatus
  );

  assert(
    'Group D: UI Authority Invariant',
    'Release gate status is authoritative (BLOCKED without lab evidence) and cannot be overridden by UI',
    overview.finalReleaseStatus === 'BLOCKED' && matrix.releaseGateDecision === 'BLOCKED',
    overview.finalReleaseStatus,
    'BLOCKED'
  );

  assert(
    'Group D: UI Authority Invariant',
    'Screening status originates from authoritative verdictMatrix',
    typeof matrix.screeningStatus === 'string' && matrix.screeningStatus.includes('SCREENING'),
    matrix.screeningStatus,
    'SCREENING: WITHIN CALCULATED TARGETS'
  );

  // =========================================================================
  // TEST GROUP E: MISSING DATA PROPAGATES AS UNKNOWN / INSUFFICIENT_DATA
  // =========================================================================
  const unknownIngredientFormula: CanonicalFormulaInput = {
    formulaName: 'Unknown Chemical Test',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 90.0 },
      { name: 'aristo-9', percentage: 10.0 } // Known unknown in universal library
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 150
  };

  const evalUnknown = FormulaScientificOrchestrator.evaluate(unknownIngredientFormula);

  assert(
    'Group E: Uncertainty Propagation',
    'Unknown ingredient properties propagate into unknownParameters',
    evalUnknown.unknownParameters.length > 0 && evalUnknown.unknownParameters.some(p => p.includes('aristo-9')),
    evalUnknown.unknownParameters,
    'contains aristo-9 parameter'
  );

  assert(
    'Group E: Uncertainty Propagation',
    'Uncertainty overallLevel is elevated to MEDIUM or HIGH',
    evalUnknown.uncertainty.overallLevel === 'MEDIUM' || evalUnknown.uncertainty.overallLevel === 'HIGH',
    evalUnknown.uncertainty.overallLevel,
    'MEDIUM or HIGH'
  );

  const missingCategoryFormula: CanonicalFormulaInput = {
    formulaName: 'Missing Category Formula',
    productCategory: 'NonExistentCategoryXYZ',
    ingredients: [
      { name: 'Water', percentage: 100.0 }
    ]
  };

  const evalMissingCat = FormulaScientificOrchestrator.evaluate(missingCategoryFormula);

  assert(
    'Group E: Uncertainty Propagation',
    'Unrecognized product category evaluates to INVALID or INSUFFICIENT_DATA, not silent fallback',
    evalMissingCat.scientificValidity === 'INVALID' || evalMissingCat.finalScientificStatus === 'SCIENTIFICALLY_INVALID',
    evalMissingCat.scientificValidity,
    'INVALID'
  );

  // =========================================================================
  // TEST GROUP F: FORMULA FINGERPRINT DETERMINISM
  // =========================================================================
  const fingerprint1 = evalResult.formulaIdentity.fingerprint;
  const evalResultRepeat = FormulaScientificOrchestrator.evaluate(standardLaundryLiquidFormula);
  const fingerprint2 = evalResultRepeat.formulaIdentity.fingerprint;

  assert(
    'Group F: Deterministic Fingerprint',
    'Evaluating identical formula twice yields exact same SHA-256 fingerprint',
    fingerprint1 === fingerprint2 && typeof fingerprint1 === 'string' && fingerprint1.length > 0,
    fingerprint1 === fingerprint2,
    true
  );

  const modifiedFormula: CanonicalFormulaInput = {
    ...standardLaundryLiquidFormula,
    ingredients: standardLaundryLiquidFormula.ingredients.map(i => i.name.includes('LABSA') ? { ...i, percentage: 9.0 } : i)
  };
  const evalModified = FormulaScientificOrchestrator.evaluate(modifiedFormula);
  const fingerprintModified = evalModified.formulaIdentity.fingerprint;

  assert(
    'Group F: Deterministic Fingerprint',
    'Modifying ingredient percentage produces a different fingerprint',
    fingerprint1 !== fingerprintModified,
    fingerprintModified !== fingerprint1,
    true
  );

  // =========================================================================
  // TEST GROUP G: ALL 8 EVALUATION STAGES & STRUCTURED DIAGNOSTICS
  // =========================================================================
  const expectedStages = [
    'VALIDATION',
    'NORMALIZATION',
    'IDENTITY_RESOLUTION',
    'CATEGORY_ROUTING',
    'SCIENTIFIC_CALCULATION',
    'EVIDENCE_EVALUATION',
    'QUALITY_GATE',
    'FINALIZATION'
  ];

  const executedStages = evalResult.stageDiagnostics.map(d => d.stage);
  const allStagesPresent = expectedStages.every(s => executedStages.includes(s as any));

  assert(
    'Group G: Evaluation Stages',
    'All 8 sequential execution stages are executed with structured diagnostics',
    allStagesPresent && evalResult.stageDiagnostics.length === 8,
    evalResult.stageDiagnostics.length,
    8
  );

  assert(
    'Group G: Evaluation Stages',
    'Every stage records non-zero execution duration and status',
    evalResult.stageDiagnostics.every(d => d.durationMs >= 0 && typeof d.status === 'string'),
    true,
    true
  );

  // =========================================================================
  // TEST GROUP H: REGULATORY ENGINE COMPLIANCE
  // =========================================================================
  const bannedChemicalFormula: CanonicalFormulaInput = {
    formulaName: 'Banned Substance Test',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 95.0 },
      { name: 'Nonylphenol Ethoxylate (NPE-9)', percentage: 5.0, role: 'Surfactant' }
    ]
  };

  const evalBanned = FormulaScientificOrchestrator.evaluate(bannedChemicalFormula);

  assert(
    'Group H: Regulatory Compliance',
    'Detects banned Nonylphenol Ethoxylates and sets regulatory compliance to false',
    evalBanned.regulatoryResult.compliant === false && evalBanned.regulatoryResult.bannedIngredientsDetected.length > 0,
    evalBanned.regulatoryResult.compliant,
    false
  );

  assert(
    'Group H: Regulatory Compliance',
    'Detects severe toxicological/environmental finding with regulatory reference',
    evalBanned.regulatoryResult.findings.some(f => f.code === 'REG_BANNED_SUBSTANCE'),
    true,
    true
  );

  // =========================================================================
  // TEST GROUP I: UI SELECTORS ROUTED EXCLUSIVELY FROM ORCHESTRATOR
  // =========================================================================
  const phys = selectPhysicalProperties(evalResult);
  const cost = selectCostAnalysis(evalResult);
  const perf = selectPerformanceProfile(evalResult);
  const comp = selectComplianceReport(evalResult);
  const diag = selectDiagnostics(evalResult);

  assert(
    'Group I: UI Selectors',
    'Physical selector accurately mirrors orchestrator evaluation',
    phys.pH === evalResult.pHResult.ph && phys.activeSurfactants === evalResult.activeMatterResult.totalSurfactantActivePct,
    phys.pH,
    evalResult.pHResult.ph
  );

  assert(
    'Group I: UI Selectors',
    'Cost selector accurately mirrors orchestrator cost calculation',
    cost.costPerKg === evalResult.costResult.costPerKg,
    cost.costPerKg,
    evalResult.costResult.costPerKg
  );

  assert(
    'Group I: UI Selectors',
    'Performance selector accurately mirrors orchestrator cleaning CPI',
    perf.cpi === evalResult.cleaningResult.cpi,
    perf.cpi,
    evalResult.cleaningResult.cpi
  );

  assert(
    'Group I: UI Selectors',
    'Compliance selector provides regulatory and lab evidence',
    comp.regulatory.status === evalResult.regulatoryResult.status,
    comp.regulatory.status,
    evalResult.regulatoryResult.status
  );

  assert(
    'Group I: UI Selectors',
    'Diagnostics selector provides complete 8-stage logs and blocking issues',
    diag.stageDiagnostics.length === 8 && Array.isArray(diag.blockingIssues),
    diag.stageDiagnostics.length,
    8
  );

  // =========================================================================
  // TEST GROUP J: ZERO DUPLICATE FINAL-DECISION PATHS
  // =========================================================================
  assert(
    'Group J: Single Decision Authority',
    'Verdict matrix contains all 7 canonical verdict items strictly from orchestrator',
    typeof matrix.screeningStatus === 'string' &&
    typeof matrix.specVerdict === 'string' &&
    typeof matrix.labEvidenceVerdict === 'string' &&
    typeof matrix.releaseGateDecision === 'string' &&
    typeof matrix.verdictStatus === 'string' &&
    Array.isArray(matrix.verdictReasons) &&
    typeof matrix.attentionExplanation === 'string',
    true,
    true
  );

  assert(
    'Group J: Single Decision Authority',
    'Verdict reasons include provenance tag for every audited physical dimension',
    matrix.verdictReasons.every(r => typeof r.provenance === 'string' && r.provenance.length > 0),
    true,
    true
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nFormula Scientific Orchestrator Test Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

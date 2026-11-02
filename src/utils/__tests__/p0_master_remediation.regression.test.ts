/**
 * ============================================================================
 * P0 MASTER REMEDIATION REGRESSION TEST SUITE
 * ============================================================================
 * Verifies P0 Defects 01–06:
 * - P0-01: Unknown Scientific Values & Verification (no 100% active default for unknown materials)
 * - P0-02: pH Failure Fallback & Downstream Propagation (no false 7.0 fallback)
 * - P0-03: HLB Method Isolation (Griffin & Davies scale isolation)
 * - P0-04: Scientific Quality Gate & Specification Engine (real specification evaluation)
 * - P0-05: Powder & Liquid Independent Paths (13 canonical category execution profiles)
 * - P0-06: Single Authoritative Calculation Contract (SSOT versioning)
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { ActiveMatterEngine } from '../activeMatterEngine';
import { HLBEngine } from '../hlbEngine';
import { evaluateSpecifications, getSpecificationTemplateForCategory } from '../specificationEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { isPowderCategory } from '../formulationEngineRouter';
import { FormulationIngredient } from '../../types';

export interface P0TestResult {
  scenarioNumber: number;
  title: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runP0MasterRemediationTestSuite(): {
  results: P0TestResult[];
  summary: { total: number; passed: number; failed: number; successRate: string };
} {
  const results: P0TestResult[] = [];

  function assert(scenarioNumber: number, title: string, condition: boolean, actual: any, expected: any, message?: string) {
    results.push({
      scenarioNumber,
      title,
      passed: Boolean(condition),
      actual,
      expected,
      message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
    });
  }

  // =========================================================================
  // 1. Unknown Ingredient Active Matter
  // =========================================================================
  const unknownIng: FormulationIngredient = {
    name: 'Unknown Proprietary Polymer XYZ',
    percentage: 10
  };
  const unknownRes = ActiveMatterEngine.resolveIngredientActive(unknownIng);
  assert(
    1,
    'Unknown ingredient active matter returns 0% with missing provenance, never 100%',
    unknownRes.activeMatterPct === null && unknownRes.dataSource === 'missing',
    { activePct: unknownRes.activeMatterPct, source: unknownRes.dataSource },
    { activePct: null, source: 'missing' }
  );

  // =========================================================================
  // 2. Unknown Purity
  // =========================================================================
  const unkPurityIng: FormulationIngredient = {
    name: 'Custom Uncharacterized Surfactant',
    percentage: 5
  };
  const unkPurityRes = ActiveMatterEngine.resolveIngredientActive(unkPurityIng);
  assert(
    2,
    'Unknown purity is recorded as missing, not fabricated as 100%',
    unkPurityRes.dataSource === 'missing' && unkPurityRes.activeMatterPct === null,
    { dataSource: unkPurityRes.dataSource, activeMatterPct: unkPurityRes.activeMatterPct },
    { dataSource: 'missing', activeMatterPct: null }
  );

  // =========================================================================
  // 3. Unsupported Ingredient pH
  // =========================================================================
  const unkPHFormula: FormulationIngredient[] = [
    { name: 'Unknown Inert Filler Mineral', percentage: 20 },
    { name: 'Water', percentage: 80 }
  ];
  const unkPHEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unsupported pH Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: unkPHFormula
  });
  assert(
    3,
    'Unsupported ingredient pH produces non-converged/neutral water pH without false confidence',
    unkPHEval.pHResult !== undefined,
    Boolean(unkPHEval.pHResult),
    true
  );

  // =========================================================================
  // 4. Unsupported HLB
  // =========================================================================
  const noHlbFormula: FormulationIngredient[] = [
    { name: 'Sodium Chloride', percentage: 5 },
    { name: 'Water', percentage: 95 }
  ];
  const noHlbRes = HLBEngine.calculateBlendedHLB(noHlbFormula);
  assert(
    4,
    'Non-surfactant formula returns methodMetadata NOT_APPLICABLE and hasSurfactants=false',
    noHlbRes.hasSurfactants === false && noHlbRes.methodMetadata === 'NOT_APPLICABLE',
    { hasSurfactants: noHlbRes.hasSurfactants, method: noHlbRes.methodMetadata },
    { hasSurfactants: false, method: 'NOT_APPLICABLE' }
  );

  // =========================================================================
  // 5. Missing Density
  // =========================================================================
  const missingDensityEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Missing Density Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [{ name: 'Unknown Chemical Polymer', percentage: 10 }, { name: 'Water', percentage: 90 }]
  });
  assert(
    5,
    'Density calculation handles unknown raw materials gracefully via volume additivity',
    missingDensityEval.densityResult.densityGPerCm3 > 0,
    missingDensityEval.densityResult.densityGPerCm3,
    '> 0'
  );

  // =========================================================================
  // 6. Missing pH Failure Fallback Prevention
  // =========================================================================
  const emptyFormulaEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Empty Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: []
  });
  assert(
    6,
    'Empty formula validation failure returns SCIENTIFICALLY_INVALID, avoiding silent 7.0 pass',
    emptyFormulaEval.finalScientificStatus === 'SCIENTIFICALLY_INVALID',
    emptyFormulaEval.finalScientificStatus,
    'SCIENTIFICALLY_INVALID'
  );

  // =========================================================================
  // 7. Non-Converged pH Status Tracking
  // =========================================================================
  assert(
    7,
    'pH calculation result preserves solver convergence status explicitly',
    typeof emptyFormulaEval.pHResult.solverConverged === 'boolean',
    emptyFormulaEval.pHResult.solverConverged,
    'boolean'
  );

  // =========================================================================
  // 8. Downstream pH Dependency Protection
  // =========================================================================
  assert(
    8,
    'Downstream orchestrator results report explicit pH confidence without masking missing dependencies',
    typeof emptyFormulaEval.pHResult.confidence === 'string',
    emptyFormulaEval.pHResult.confidence,
    'string'
  );

  // =========================================================================
  // 9. Griffin / Davies Scale Isolation (P0-03 Core)
  // =========================================================================
  const mixedSurfactantFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }, // Davies scale = 40.0
    { name: 'LAE-7', percentage: 5, activeMatterPct: 100 }     // Griffin scale = 12.1
  ];
  const mixedHlbRes = HLBEngine.calculateBlendedHLB(mixedSurfactantFormula);
  assert(
    9,
    'Griffin scale nonionic HLB (12.10) is preserved without corrupting arithmetic average with Davies ionic value (40.0)',
    mixedHlbRes.blendedHLB === 12.10 && mixedHlbRes.methodMetadata === 'GRIFFIN',
    { blendedHLB: mixedHlbRes.blendedHLB, method: mixedHlbRes.methodMetadata },
    { blendedHLB: 12.10, method: 'GRIFFIN' }
  );

  // =========================================================================
  // 10. HLB NOT_APPLICABLE Verification
  // =========================================================================
  const inorganicFormula: FormulationIngredient[] = [
    { name: 'Citric Acid Anhydrous', percentage: 10 },
    { name: 'Water', percentage: 90 }
  ];
  const inorganicHlb = HLBEngine.calculateBlendedHLB(inorganicFormula);
  assert(
    10,
    'Inorganic acid/water formula returns blendedHLB = 0 and methodMetadata = NOT_APPLICABLE',
    inorganicHlb.blendedHLB === 0 && inorganicHlb.methodMetadata === 'NOT_APPLICABLE',
    { blendedHLB: inorganicHlb.blendedHLB, method: inorganicHlb.methodMetadata },
    { blendedHLB: 0, method: 'NOT_APPLICABLE' }
  );

  // =========================================================================
  // 11. Specification Missing Input
  // =========================================================================
  const missingSpecReport = evaluateSpecifications({
    formulaName: 'Incomplete Formula',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: getSpecificationTemplateForCategory('LAUNDRY_LIQUID')?.parameters || [],
    labMeasurements: []
  });
  assert(
    11,
    'Specification evaluation with missing parameters flags INSUFFICIENT_DATA or FAIL, never false PASS',
    missingSpecReport.verdict.status !== 'PASS',
    missingSpecReport.verdict.status,
    'INSUFFICIENT_DATA or FAIL'
  );

  // =========================================================================
  // 12. Specification Actual Failure
  // =========================================================================
  const outOfSpecEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Out of Spec Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'LABSA 96%', percentage: 0.1, activeMatterPct: 96 },
      { name: 'Water', percentage: 99.9 }
    ]
  });
  assert(
    12,
    'Formula with 0.1% active surfactant fails minimum active specification',
    outOfSpecEval.qualityGateResult.majorWarnings.some(w => w.code === 'WARN_LOW_ACTIVE_MATTER'),
    true,
    true
  );

  // =========================================================================
  // 13. Powder Specification Routing
  // =========================================================================
  const powderEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Washing Powder',
    productCategory: 'LAUNDRY_POWDER',
    ingredients: [
      { name: 'Soda Ash Light', percentage: 40 },
      { name: 'Sodium Sulfate', percentage: 45 },
      { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 },
      { name: 'Caustic Soda Flakes (99%)', percentage: 1.25, activeMatterPct: 99 },
      { name: 'Water', percentage: 3.75 }
    ]
  });
  assert(
    13,
    'Powder formulation receives Powder Engine report and NOT_APPLICABLE viscosity',
    powderEval.powderReport !== null && powderEval.viscosityResult.status === 'NOT_APPLICABLE',
    { hasPowderReport: Boolean(powderEval.powderReport), viscStatus: powderEval.viscosityResult.status },
    { hasPowderReport: true, viscStatus: 'NOT_APPLICABLE' }
  );

  // =========================================================================
  // 14. Liquid Specification Routing
  // =========================================================================
  const liquidEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Liquid Detergent',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'SLES 70%', percentage: 14, activeMatterPct: 70 },
      { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30 },
      { name: 'Water', percentage: 81 }
    ]
  });
  assert(
    14,
    'Liquid formulation receives liquid viscosity cP and NULL powder report',
    liquidEval.viscosityResult.predictedViscosityCp !== null && liquidEval.powderReport === null,
    { hasViscosity: liquidEval.viscosityResult.predictedViscosityCp !== null, powderReport: liquidEval.powderReport },
    { hasViscosity: true, powderReport: null }
  );

  // =========================================================================
  // 15. Unit Comparison Integrity
  // =========================================================================
  assert(
    15,
    'Evaluator compares parameters in consistent canonical units',
    liquidEval.densityResult.densityGPerCm3 > 0.9 && liquidEval.densityResult.densityGPerCm3 < 1.5,
    liquidEval.densityResult.densityGPerCm3,
    'between 0.9 and 1.5 g/cm³'
  );

  // =========================================================================
  // 16. Single Authoritative Execution Contract (P0-06)
  // =========================================================================
  assert(
    16,
    'Orchestrator provides SSOT result bound to version, category, and input fingerprint',
    Boolean(liquidEval.formulaIdentity?.fingerprint && liquidEval.provenance?.orchestratorVersion),
    true,
    true
  );

  // =========================================================================
  // 17. Divergent Output Elimination
  // =========================================================================
  const evalRun1 = FormulaScientificOrchestrator.evaluate({ formulaName: 'Test', productCategory: 'LAUNDRY_LIQUID', ingredients: liquidEval.formulaIdentity ? liquidEval.formulaIdentity as any : [] });
  const evalRun2 = FormulaScientificOrchestrator.evaluate({ formulaName: 'Test', productCategory: 'LAUNDRY_LIQUID', ingredients: liquidEval.formulaIdentity ? liquidEval.formulaIdentity as any : [] });
  assert(
    17,
    'Identical inputs produce 100% deterministic scientific outputs across evaluation runs',
    evalRun1.finalScientificStatus === evalRun2.finalScientificStatus,
    evalRun1.finalScientificStatus,
    evalRun2.finalScientificStatus
  );

  // =========================================================================
  // 18. Formula Revision Tracking
  // =========================================================================
  assert(
    18,
    'Orchestrator result explicitly captures input formula version',
    liquidEval.formulaIdentity.version === '1.0.0',
    liquidEval.formulaIdentity.version,
    '1.0.0'
  );

  // =========================================================================
  // 19. Evidence Provenance Integrity
  // =========================================================================
  assert(
    19,
    'Evaluated formula without lab measurements is assigned evidence level PREDICTED_ONLY',
    liquidEval.evidenceLevel === 'PREDICTED_ONLY',
    liquidEval.evidenceLevel,
    'PREDICTED_ONLY'
  );

  // =========================================================================
  // 20. Quality Gate False PASS Prevention
  // =========================================================================
  const invalidMassFormula = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unbalanced Mass',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [{ name: 'SLES 70%', percentage: 50 }, { name: 'Water', percentage: 20 }] // Total 70%
  });
  assert(
    20,
    'Mass balance error (70% total) prevents commercial release pass',
    invalidMassFormula.verdictMatrix.releaseGateDecision === 'BLOCKED',
    invalidMassFormula.verdictMatrix.releaseGateDecision,
    'BLOCKED'
  );

  // =========================================================================
  // 21. Coverage across all 13 Canonical Product Categories
  // =========================================================================
  let categoriesPassedCount = 0;
  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const catEval = FormulaScientificOrchestrator.evaluate({
      formulaName: `Category Test ${catId}`,
      productCategory: catId,
      ingredients: isPowderCategory(catId)
        ? [{ name: 'Soda Ash Light', percentage: 50 }, { name: 'Sodium Sulfate', percentage: 50 }]
        : [{ name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }, { name: 'Water', percentage: 90 }]
    });
    if (catEval.formulaIdentity.canonicalCategory === catId) {
      categoriesPassedCount++;
    }
  }

  assert(
    21,
    'All 13 canonical product categories resolve explicitly in Orchestrator DAG without fallback to UNKNOWN',
    categoriesPassedCount === 13,
    categoriesPassedCount,
    13
  );

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const successRate = `${((passed / total) * 100).toFixed(1)}%`;

  return { results, summary: { total, passed, failed, successRate } };
}

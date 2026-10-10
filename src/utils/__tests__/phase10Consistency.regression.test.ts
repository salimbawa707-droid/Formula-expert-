/**
 * ============================================================================
 * PHASE 10: CROSS-ENGINE CONSISTENCY & SCIENTIFIC INTEGRITY REGRESSION SUITE
 * ============================================================================
 *
 * Verifies surgical defect closures for Phase 10:
 * 1. Defect 1: Canonical HLB result is present on CanonicalFormulaEvaluationResult,
 *    matches the DAG state, handles NOT_APPLICABLE / INSUFFICIENT_DATA correctly,
 *    and is consumed in AIFormulator without redundant duplicate fallbacks.
 * 2. Defect 2: SmartFormulaAnalyzerPro routes hardness and cleaning through
 *    authoritative FormulaScientificOrchestrator without direct duplicate
 *    calls to calculateWaterHardnessTolerance or calculateCleaningPerformance.
 * 3. Defect 3: TraceExportUtility exportScientificReportHtml uses a safe download
 *    anchor pattern with URL revocation instead of window.open().
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { CanonicalFormulaInput, CanonicalFormulaEvaluationResult } from '../orchestrator/types';
import { selectPhysicalProperties, selectHLBProfile } from '../orchestrator/selectors';
import { HLBEngine } from '../hlbEngine';

export interface Phase10TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runPhase10ConsistencyTestSuite(): {
  results: Phase10TestResult[];
  passed: number;
  failed: number;
  total: number;
  summary: { total: number; passed: number; failed: number; successRate: string };
} {
  const results: Phase10TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any, message?: string) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
    });
  }

  // =========================================================================
  // 1. Defect 1 — Canonical HLB Result Presence & DAG Equivalence
  // =========================================================================
  const surfactantFormula: CanonicalFormulaInput = {
    formulaId: 'TEST-HLB-SURF',
    formulaName: 'Liquid Detergent With Standard Surfactants',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 70, activeMatterPct: 0 },
      { name: 'Linear Alkylbenzene Sulfonic Acid', percentage: 10, activeMatterPct: 96 },
      { name: 'Sodium Laureth Sulfate', percentage: 12, activeMatterPct: 70 },
      { name: 'Alcohol Ethoxylate (7EO)', percentage: 6, activeMatterPct: 100 },
      { name: 'Sodium Hydroxide', percentage: 2, activeMatterPct: 50 }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 150
  };

  const surfResult: CanonicalFormulaEvaluationResult = FormulaScientificOrchestrator.evaluate(surfactantFormula);

  assert(
    'Defect 1: Canonical HLB Presence',
    'hlbResult is defined on CanonicalFormulaEvaluationResult',
    surfResult.hlbResult !== undefined && surfResult.hlbResult !== null,
    Boolean(surfResult.hlbResult),
    true
  );

  assert(
    'Defect 1: Canonical HLB Presence',
    'hlbResult has VALID status for surfactant formulation',
    surfResult.hlbResult.status === 'VALID',
    surfResult.hlbResult.status,
    'VALID'
  );

  assert(
    'Defect 1: Canonical HLB Presence',
    'hlbResult.blendedHLB is a valid positive number',
    typeof surfResult.hlbResult.blendedHLB === 'number' && surfResult.hlbResult.blendedHLB > 0,
    surfResult.hlbResult.blendedHLB,
    '> 0'
  );

  assert(
    'Defect 1: Canonical HLB Presence',
    'hlbResult.hasSurfactants is true',
    surfResult.hlbResult.hasSurfactants === true,
    surfResult.hlbResult.hasSurfactants,
    true
  );

  assert(
    'Defect 1: Canonical HLB Presence',
    'hlbResult contributions array contains resolved surfactant items',
    Array.isArray(surfResult.hlbResult.contributions) && surfResult.hlbResult.contributions.length > 0,
    surfResult.hlbResult.contributions.length,
    '> 0'
  );

  // Compare against direct HLBEngine invocation to verify exact mathematical parity
  const directHlb = HLBEngine.calculateBlendedHLB(surfactantFormula.ingredients as any);
  assert(
    'Defect 1: DAG Equivalence',
    'Canonical blendedHLB matches authoritative HLBEngine blendedHLB calculation',
    surfResult.hlbResult.blendedHLB === directHlb.blendedHLB,
    surfResult.hlbResult.blendedHLB,
    directHlb.blendedHLB
  );

  // =========================================================================
  // 2. Defect 1 — HLB Non-Surfactant & Missing Data Truthfulness
  // =========================================================================
  const nonSurfactantFormula: CanonicalFormulaInput = {
    formulaId: 'TEST-HLB-NON-SURF',
    formulaName: 'Water and Citric Acid Solution',
    formulaVersion: '1.0.0',
    productCategory: 'ALL_PURPOSE_CLEANER',
    ingredients: [
      { name: 'Water', percentage: 95, activeMatterPct: 0 },
      { name: 'Citric Acid', percentage: 5, activeMatterPct: 100 }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 100
  };

  const nonSurfResult = FormulaScientificOrchestrator.evaluate(nonSurfactantFormula);

  assert(
    'Defect 1: HLB Not Applicable',
    'Non-surfactant formula returns NOT_APPLICABLE status',
    nonSurfResult.hlbResult.status === 'NOT_APPLICABLE',
    nonSurfResult.hlbResult.status,
    'NOT_APPLICABLE'
  );

  assert(
    'Defect 1: HLB Not Applicable',
    'Non-surfactant formula returns null blendedHLB without fabricating arbitrary value',
    nonSurfResult.hlbResult.blendedHLB === null,
    nonSurfResult.hlbResult.blendedHLB,
    null
  );

  assert(
    'Defect 1: HLB Not Applicable',
    'Non-surfactant formula sets hasSurfactants to false',
    nonSurfResult.hlbResult.hasSurfactants === false,
    nonSurfResult.hlbResult.hasSurfactants,
    false
  );

  // Missing HLB data formula
  const unknownSurfactantFormula: CanonicalFormulaInput = {
    formulaId: 'TEST-HLB-UNKNOWN',
    formulaName: 'Formulation with Unknown Surfactant lacking HLB',
    formulaVersion: '1.0.0',
    productCategory: 'INDUSTRIAL_DEGREASER',
    ingredients: [
      { name: 'Water', percentage: 90, activeMatterPct: 0 },
      { name: 'Custom Novel Surfactant XYZ', percentage: 10, role: 'surfactant', isUnknown: true }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 120
  };

  const unknownSurfResult = FormulaScientificOrchestrator.evaluate(unknownSurfactantFormula);

  assert(
    'Defect 1: HLB Insufficient Data',
    'Unknown surfactant with no HLB data returns INSUFFICIENT_DATA or NOT_APPLICABLE',
    unknownSurfResult.hlbResult.status === 'INSUFFICIENT_DATA' || unknownSurfResult.hlbResult.status === 'NOT_APPLICABLE',
    unknownSurfResult.hlbResult.status,
    'INSUFFICIENT_DATA or NOT_APPLICABLE'
  );

  assert(
    'Defect 1: HLB Insufficient Data',
    'Unknown surfactant does not fabricate non-zero HLB',
    unknownSurfResult.hlbResult.blendedHLB === null,
    unknownSurfResult.hlbResult.blendedHLB,
    null
  );

  // =========================================================================
  // 3. Defect 1 — Selectors over Canonical HLB Result
  // =========================================================================
  const physProps = selectPhysicalProperties(surfResult);
  assert(
    'Defect 1: Selectors',
    'selectPhysicalProperties exposes hlb matching canonical result',
    physProps.hlb === surfResult.hlbResult.blendedHLB,
    physProps.hlb,
    surfResult.hlbResult.blendedHLB
  );

  const hlbProfile = selectHLBProfile(surfResult);
  assert(
    'Defect 1: Selectors',
    'selectHLBProfile returns canonical hlbResult object',
    hlbProfile === surfResult.hlbResult,
    Boolean(hlbProfile),
    true
  );

  // =========================================================================
  // 4. Defect 1 — AIFormulator Code Inspection: No Duplicate HLB Calculator Call
  // =========================================================================
  const aiFormulatorPath = path.resolve(process.cwd(), 'src/components/AIFormulator.tsx');
  const aiFormulatorSource = fs.readFileSync(aiFormulatorPath, 'utf8');

  assert(
    'Defect 1: AIFormulator Source Check',
    'AIFormulator does not import evaluateAuthoritativeHLB',
    !aiFormulatorSource.includes('evaluateAuthoritativeHLB'),
    aiFormulatorSource.includes('evaluateAuthoritativeHLB'),
    false
  );

  assert(
    'Defect 1: AIFormulator Source Check',
    'AIFormulator consumes canonical hlbResult from orchestrator output',
    aiFormulatorSource.includes('hlbResult: o.hlbResult'),
    aiFormulatorSource.includes('hlbResult: o.hlbResult'),
    true
  );

  // =========================================================================
  // 5. Defect 2 — SmartFormulaAnalyzerPro: Elimination of Duplicate Calls
  // =========================================================================
  const analyzerPath = path.resolve(process.cwd(), 'src/components/SmartFormulaAnalyzerPro.tsx');
  const analyzerSource = fs.readFileSync(analyzerPath, 'utf8');

  assert(
    'Defect 2: Analyzer Source Check',
    'SmartFormulaAnalyzerPro does not import calculateWaterHardnessTolerance',
    !analyzerSource.includes('calculateWaterHardnessTolerance'),
    analyzerSource.includes('calculateWaterHardnessTolerance'),
    false
  );

  assert(
    'Defect 2: Analyzer Source Check',
    'SmartFormulaAnalyzerPro does not import calculateCleaningPerformance',
    !analyzerSource.includes('calculateCleaningPerformance'),
    analyzerSource.includes('calculateCleaningPerformance'),
    false
  );

  assert(
    'Defect 2: Analyzer Source Check',
    'SmartFormulaAnalyzerPro routes hardnessResult from orchestratorReport',
    analyzerSource.includes('const hardnessCalc = orchestratorReport.hardnessResult'),
    analyzerSource.includes('const hardnessCalc = orchestratorReport.hardnessResult'),
    true
  );

  assert(
    'Defect 2: Analyzer Source Check',
    'SmartFormulaAnalyzerPro routes cleaningResult from orchestratorReport',
    analyzerSource.includes('orchestratorReport.cleaningResult'),
    analyzerSource.includes('orchestratorReport.cleaningResult'),
    true
  );

  assert(
    'Defect 2: Analyzer Source Check',
    'SmartFormulaAnalyzerPro passes waterProfile context to orchestrator',
    analyzerSource.includes('waterProfile: {') && analyzerSource.includes('hardnessPpm: waterHardnessPpm'),
    analyzerSource.includes('waterProfile: {') && analyzerSource.includes('hardnessPpm: waterHardnessPpm'),
    true
  );

  // =========================================================================
  // 6. Defect 2 — Category & Water-Profile Routing Integrity
  // =========================================================================
  const hardWaterFormula: CanonicalFormulaInput = {
    formulaId: 'TEST-HARD-WATER',
    formulaName: 'High Water Hardness Tolerance Test',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 70, activeMatterPct: 0 },
      { name: 'Sodium Laureth Sulfate', percentage: 15, activeMatterPct: 70 },
      { name: 'Tetrasodium GLDA', percentage: 5, activeMatterPct: 47, role: 'chelator' },
      { name: 'Alcohol Ethoxylate (7EO)', percentage: 10, activeMatterPct: 100 }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 350,
    waterProfile: {
      hardnessPpm: 350
    }
  };

  const hardWaterResult = FormulaScientificOrchestrator.evaluate(hardWaterFormula);

  assert(
    'Defect 2: Routing Integrity',
    'Authoritative orchestrator preserves waterHardnessPpm input',
    hardWaterResult.hardnessResult.waterHardnessPpm === 350,
    hardWaterResult.hardnessResult.waterHardnessPpm,
    350
  );

  assert(
    'Defect 2: Routing Integrity',
    'Authoritative orchestrator evaluates chelator sequestration correctly',
    hardWaterResult.chelationResult.chelatorActivePct > 0,
    hardWaterResult.chelationResult.chelatorActivePct,
    '> 0'
  );

  assert(
    'Defect 2: Routing Integrity',
    'Cleaning performance is evaluated for canonical productCategory',
    hardWaterResult.cleaningResult.productCategory === 'LAUNDRY_LIQUID',
    hardWaterResult.cleaningResult.productCategory,
    'LAUNDRY_LIQUID'
  );

  assert(
    'Defect 2: Routing Integrity',
    'Cleaning result CPI is calculated deterministically',
    hardWaterResult.cleaningResult.cpi > 0,
    hardWaterResult.cleaningResult.cpi,
    '> 0'
  );

  // =========================================================================
  // 7. Defect 3 — TraceExportUtility: Safe File Download & No window.open()
  // =========================================================================
  const traceExportPath = path.resolve(process.cwd(), 'src/components/scientific/TraceExportUtility.ts');
  const traceExportSource = fs.readFileSync(traceExportPath, 'utf8');

  assert(
    'Defect 3: Safe Export Pattern',
    'TraceExportUtility does not call window.open()',
    !traceExportSource.includes('window.open('),
    traceExportSource.includes('window.open('),
    false
  );

  assert(
    'Defect 3: Safe Export Pattern',
    'TraceExportUtility uses document.createElement anchor tag for download',
    traceExportSource.includes("document.createElement('a')"),
    traceExportSource.includes("document.createElement('a')"),
    true
  );

  assert(
    'Defect 3: Safe Export Pattern',
    'TraceExportUtility sets download attribute on anchor',
    traceExportSource.includes("downloadAnchor.setAttribute('download'"),
    traceExportSource.includes("downloadAnchor.setAttribute('download'"),
    true
  );

  assert(
    'Defect 3: Safe Export Pattern',
    'TraceExportUtility revokes temporary object URL',
    traceExportSource.includes('URL.revokeObjectURL(url)'),
    traceExportSource.includes('URL.revokeObjectURL(url)'),
    true
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const successRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0%';

  return {
    results,
    passed,
    failed,
    total,
    summary: { total, passed, failed, successRate }
  };
}

// Self-executing runner when called directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('phase10Consistency.regression.test')) {
  const result = runPhase10ConsistencyTestSuite();
  console.log(`\n================================================================`);
  console.log(`PHASE 10 CROSS-ENGINE CONSISTENCY REGRESSION TEST REPORT`);
  console.log(`Total: ${result.total} | Passed: ${result.passed} | Failed: ${result.failed} (${result.summary.successRate})`);
  console.log(`================================================================`);
  result.results.forEach((r, idx) => {
    const mark = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${idx + 1}. [${r.group}] ${r.name}`);
    if (!r.passed) {
      console.log(`       Message: ${r.message}`);
      console.log(`       Actual: ${JSON.stringify(r.actual)}`);
      console.log(`       Expected: ${JSON.stringify(r.expected)}`);
    }
  });
  if (result.failed > 0) {
    process.exit(1);
  }
}

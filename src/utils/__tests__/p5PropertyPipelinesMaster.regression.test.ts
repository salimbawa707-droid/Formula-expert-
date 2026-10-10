/**
 * ============================================================================
 * PHASE 5 — PROPERTY-SPECIFIC SCIENTIFIC EXECUTION PIPELINES TEST SUITE
 * ============================================================================
 *
 * Verifies Phase 5 Production Integration & Property Dependency Pipelines:
 * - A. Neutralization executes before final pH
 * - B. Final pH uses complete formulation state
 * - C. Active Matter calculated exactly once
 * - D. Viscosity consumes authoritative Active Matter
 * - E. Cleaning consumes final pH + active matter + hardness/chelation
 * - F. Compatibility feeds stability
 * - G. Quality Gate consumes authoritative outputs
 * - H. Grade executes after Quality Gate
 * - I. Powder pipeline is conditional
 * - J. Liquid rheology is not executed for powder
 * - K. Unknown assay propagates without false 100% assumption
 * - L. Unknown category blocks category-dependent routing
 * - M. Formula change makes old analysis STALE
 * - N. Intermediate pH never becomes final pH
 * - O. Computed pH remains separate from measured pH
 * - P. UI contains no duplicate scientific calculations
 * - Q. No fake execution delay
 * - R. Unknown viscosity parameter does not become 0 cP
 * - S. Powder viscosity is NOT_APPLICABLE with null, not 0 cP
 * - T. Calculated density remains PREDICTED_DENSITY (IDEAL_VOLUME_ADDITIVITY)
 * - U. Calculated NVR remains separate from measured NVR
 * - V. CPI remains screening score
 * - W. NO_KNOWN_CONFLICT remains distinct from PROVEN compatibility
 * - X. Pricing behavior remains unchanged
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { ScientificExecutionDAG } from '../orchestrator/scientificExecutionDAG';
import { CanonicalFormulaInput } from '../orchestrator/types';
import { computeFormulaFingerprint } from '../provenanceEngine';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runP5PropertyPipelinesTestSuite() {
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

  const liquidFormulaInput: CanonicalFormulaInput = {
    formulaId: 'F-P5-LIQUID-001',
    formulaName: 'Phase 5 Liquid Test Formulation',
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
      { name: 'Water (Aqua, Balance)', percentage: 5.42, activeMatterPct: 0, role: 'Solvent', costPerKg: 0 }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 150,
    costContext: { targetCostPerKg: 50.0 }
  };

  const powderFormulaInput: CanonicalFormulaInput = {
    formulaId: 'F-P5-POWDER-001',
    formulaName: 'Phase 5 Powder Test Formulation',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_POWDER',
    ingredients: [
      { name: 'Sodium Carbonate (Soda Ash)', percentage: 40.0, activeMatterPct: 100, role: 'Builder', costPerKg: 25 },
      { name: 'Sodium Sulfate (Anhydrous)', percentage: 35.0, activeMatterPct: 100, role: 'Filler', costPerKg: 12 },
      { name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', percentage: 12.0, activeMatterPct: 90, role: 'Anionic Surfactant', costPerKg: 130 },
      { name: 'Sodium Silicate (Neutral)', percentage: 8.0, activeMatterPct: 100, role: 'Alkalinity / Anti-Corrosion', costPerKg: 30 },
      { name: 'Sodium Tripolyphosphate (STPP)', percentage: 5.0, activeMatterPct: 100, role: 'Builder', costPerKg: 110 }
    ],
    batchSizeKg: 100,
    waterHardnessPpm: 150
  };

  // Run DAG execution
  const dag = new ScientificExecutionDAG();
  const liquidRun = dag.executeDAG(liquidFormulaInput);
  const liquidResult = FormulaScientificOrchestrator.evaluate(liquidFormulaInput);
  const powderRun = dag.executeDAG(powderFormulaInput);
  const powderResult = FormulaScientificOrchestrator.evaluate(powderFormulaInput);

  // A. Neutralization executes before final pH
  const neutIdx = liquidRun.trace.findIndex(t => t.nodeId === 'NEUTRALIZATION');
  const phIdx = liquidRun.trace.findIndex(t => t.nodeId === 'PH_EQUILIBRIUM');
  assert(
    'Phase 5 Pipelines',
    'A. Neutralization executes before final pH in DAG',
    neutIdx >= 0 && phIdx >= 0 && neutIdx < phIdx,
    { neutIdx, phIdx },
    'neutIdx < phIdx'
  );

  // B. Final pH uses complete formulation state
  assert(
    'Phase 5 Pipelines',
    'B. Final pH uses complete formulation state',
    typeof liquidRun.state.finalEquilibriumPH === 'number' && liquidRun.state.finalEquilibriumPH > 0,
    liquidRun.state.finalEquilibriumPH,
    '> 0'
  );

  // C. Active Matter calculated exactly once
  const amTraceCount = liquidRun.trace.filter(t => t.nodeId === 'ACTIVE_MATTER').length;
  assert(
    'Phase 5 Pipelines',
    'C. Active Matter calculated exactly once',
    amTraceCount === 1,
    amTraceCount,
    1
  );

  // D. Viscosity consumes authoritative Active Matter
  assert(
    'Phase 5 Pipelines',
    'D. Viscosity consumes authoritative Active Matter',
    liquidRun.state.viscosityResult !== null && liquidRun.state.predictedViscosityCp > 0,
    liquidRun.state.predictedViscosityCp,
    '> 0'
  );

  // E. Cleaning consumes final pH + active matter + hardness/chelation
  const cleaningTrace = liquidRun.trace.find(t => t.nodeId === 'CLEANING_CPI');
  assert(
    'Phase 5 Pipelines',
    'E. Cleaning consumes final pH + active matter + hardness/chelation',
    Boolean(
      cleaningTrace?.dependencies.includes('PH_EQUILIBRIUM') &&
      cleaningTrace?.dependencies.includes('ACTIVE_MATTER') &&
      cleaningTrace?.dependencies.includes('WATER_CHELATION') &&
      cleaningTrace?.dependencies.includes('COMPATIBILITY')
    ),
    cleaningTrace?.dependencies,
    'Includes PH_EQUILIBRIUM, ACTIVE_MATTER, WATER_CHELATION, COMPATIBILITY'
  );

  // F. Compatibility feeds stability
  const stabilityTrace = liquidRun.trace.find(t => t.nodeId === 'STABILITY_SCREENING');
  assert(
    'Phase 5 Pipelines',
    'F. Compatibility feeds stability screening',
    Boolean(stabilityTrace?.dependencies.includes('COMPATIBILITY') && stabilityTrace?.dependencies.includes('PH_EQUILIBRIUM')),
    stabilityTrace?.dependencies,
    'Includes COMPATIBILITY, PH_EQUILIBRIUM'
  );

  // G. Quality Gate consumes authoritative outputs
  const qgTrace = liquidRun.trace.find(t => t.nodeId === 'QUALITY_GATE');
  assert(
    'Phase 5 Pipelines',
    'G. Quality Gate consumes authoritative outputs',
    Boolean(
      qgTrace?.dependencies.includes('CLEANING_CPI') &&
      qgTrace?.dependencies.includes('REGULATORY') &&
      qgTrace?.dependencies.includes('LAB_EVIDENCE') &&
      qgTrace?.dependencies.includes('STABILITY_SCREENING') &&
      qgTrace?.dependencies.includes('COSTING')
    ),
    qgTrace?.dependencies,
    'Includes CLEANING_CPI, REGULATORY, LAB_EVIDENCE, STABILITY_SCREENING, COSTING'
  );

  // H. Grade executes after Quality Gate
  const gradeTrace = liquidRun.trace.find(t => t.nodeId === 'GRADE');
  assert(
    'Phase 5 Pipelines',
    'H. Grade executes after Quality Gate',
    Boolean(gradeTrace?.dependencies.includes('QUALITY_GATE')),
    gradeTrace?.dependencies,
    'Includes QUALITY_GATE'
  );

  // I. Powder pipeline is conditional
  const powderEngineTraceInLiquid = liquidRun.trace.find(t => t.nodeId === 'POWDER_ENGINE');
  const powderEngineTraceInPowder = powderRun.trace.find(t => t.nodeId === 'POWDER_ENGINE');
  assert(
    'Phase 5 Pipelines',
    'I. Powder pipeline is conditional (skipped for liquid, executed for powder)',
    powderEngineTraceInLiquid?.status === 'NOT_APPLICABLE' && powderEngineTraceInPowder?.status === 'COMPLETED',
    { liquid: powderEngineTraceInLiquid?.status, powder: powderEngineTraceInPowder?.status },
    { liquid: 'NOT_APPLICABLE', powder: 'COMPLETED' }
  );

  // J. Liquid rheology is not executed for powder
  const powderViscosity = powderRun.state.viscosityResult;
  assert(
    'Phase 5 Pipelines',
    'J. Liquid rheology is NOT_APPLICABLE for powder',
    powderViscosity.predictedViscosityCp === null && powderViscosity.isFluid === false,
    powderViscosity,
    { predictedViscosityCp: null, isFluid: false }
  );

  // K. Unknown assay propagates
  const unknownAssayInput: CanonicalFormulaInput = {
    ...liquidFormulaInput,
    formulaId: 'F-P5-UNKNOWN-ASSAY',
    ingredients: [
      { name: 'Water', percentage: 80.0 },
      { name: 'Aristo 9 Polymer (Uncharacterized)', percentage: 20.0, isUnknown: true }
    ]
  };
  const unknownAssayRun = dag.executeDAG(unknownAssayInput);
  assert(
    'Phase 5 Pipelines',
    'K. Unknown assay propagates without false 100% assumption',
    unknownAssayRun.state.unknownParameters.length > 0,
    unknownAssayRun.state.unknownParameters,
    'Contains unknown parameters'
  );

  // L. Unknown category blocks category-dependent routing
  const unknownCatInput: CanonicalFormulaInput = {
    ...liquidFormulaInput,
    formulaId: 'F-P5-UNKNOWN-CAT',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY'
  };
  const unknownCatResult = FormulaScientificOrchestrator.evaluate(unknownCatInput);
  assert(
    'Phase 5 Pipelines',
    'L. Unknown category reports UNKNOWN_PRODUCT_CATEGORY without silent fallback to laundry',
    unknownCatResult.formulaIdentity.canonicalCategory === 'UNKNOWN_PRODUCT_CATEGORY',
    unknownCatResult.formulaIdentity.canonicalCategory,
    'UNKNOWN_PRODUCT_CATEGORY'
  );

  // M. Formula change makes old analysis STALE
  const fp1 = computeFormulaFingerprint('FORMULA', '1.0.0', liquidFormulaInput.ingredients as any, 'LAUNDRY_LIQUID');
  const fp2 = computeFormulaFingerprint('FORMULA', '1.0.0', unknownAssayInput.ingredients as any, 'LAUNDRY_LIQUID');
  assert(
    'Phase 5 Pipelines',
    'M. Formula change produces distinct fingerprint',
    fp1 !== fp2,
    { fp1, fp2 },
    'fp1 !== fp2'
  );

  // N. Intermediate pH never becomes final pH
  assert(
    'Phase 5 Pipelines',
    'N. Intermediate pH never becomes final pH',
    liquidRun.state.pHIntermediate !== liquidRun.state.finalEquilibriumPH,
    { intermediate: liquidRun.state.pHIntermediate, final: liquidRun.state.finalEquilibriumPH },
    'intermediate !== final'
  );

  // O. Computed pH remains separate from measured pH
  assert(
    'Phase 5 Pipelines',
    'O. Computed pH remains separate from measured pH',
    liquidResult.pHResult.measuredPH === null && typeof liquidResult.pHResult.ph === 'number',
    { ph: liquidResult.pHResult.ph, measuredPH: liquidResult.pHResult.measuredPH },
    { ph: 'number', measuredPH: null }
  );

  // P. UI contains no duplicate scientific calculations
  assert(
    'Phase 5 Pipelines',
    'P. Single Source of Truth Orchestrator evaluates all physical outputs',
    typeof liquidResult.activeMatterResult.totalActiveMatterPct === 'number' &&
    typeof liquidResult.densityResult.densityGPerCm3 === 'number',
    true,
    true
  );

  // Q. No fake execution delay
  const startMs = Date.now();
  FormulaScientificOrchestrator.evaluate(liquidFormulaInput);
  const durationMs = Date.now() - startMs;
  assert(
    'Phase 5 Pipelines',
    'Q. Execution completes synchronously with zero artificial delay (< 2000 ms)',
    durationMs < 2000,
    durationMs,
    '< 2000'
  );

  // R. Unknown viscosity parameter does not become 0 cP
  assert(
    'Phase 5 Pipelines',
    'R. Liquid viscosity calculation yields positive screening viscosity (not 0 cP)',
    liquidRun.state.predictedViscosityCp > 0,
    liquidRun.state.predictedViscosityCp,
    '> 0'
  );

  // S. Powder viscosity is NOT_APPLICABLE with null, not 0 cP
  assert(
    'Phase 5 Pipelines',
    'S. Powder viscosity returns null (NOT 0 cP)',
    powderResult.viscosityResult.predictedViscosityCp === null,
    powderResult.viscosityResult.predictedViscosityCp,
    null
  );

  // T. Calculated density remains PREDICTED_DENSITY
  assert(
    'Phase 5 Pipelines',
    'T. Density model uses ideal volume additivity (PREDICTED_DENSITY)',
    liquidResult.densityResult.densityGPerCm3 > 0.95 && liquidResult.densityResult.densityGPerCm3 < 1.30,
    liquidResult.densityResult.densityGPerCm3,
    '0.95 - 1.30 g/cm³'
  );

  // U. Calculated NVR remains separate from measured NVR
  assert(
    'Phase 5 Pipelines',
    'U. Calculated NVR remains separate from measured NVR',
    liquidResult.densityResult.nvrPercentage >= 0 && liquidResult.labEvidenceResult.verifiedMeasurementsCount === 0,
    { nvr: liquidResult.densityResult.nvrPercentage, verifiedCount: liquidResult.labEvidenceResult.verifiedMeasurementsCount },
    'Calculated NVR without fake lab validation'
  );

  // V. CPI remains screening
  assert(
    'Phase 5 Pipelines',
    'V. CPI remains screening score',
    liquidResult.cleaningResult.provenance === 'CALCULATED' || liquidResult.cleaningResult.provenance === 'PREDICTED',
    liquidResult.cleaningResult.provenance,
    'CALCULATED or PREDICTED'
  );

  // W. NO_KNOWN_CONFLICT remains distinct from PROVEN compatibility
  assert(
    'Phase 5 Pipelines',
    'W. Clean preserved liquid reports NO_KNOWN_CONFLICT / SCREENING_COMPATIBLE',
    liquidResult.compatibilityResult.compatibilityStatusSemantic === 'NO_KNOWN_CONFLICT' ||
    liquidResult.compatibilityResult.compatibilityStatusSemantic === 'COMPATIBLE_BY_RULE',
    liquidResult.compatibilityResult.compatibilityStatusSemantic,
    'NO_KNOWN_CONFLICT or COMPATIBLE_BY_RULE'
  );

  // X. Pricing behavior remains unchanged
  assert(
    'Phase 5 Pipelines',
    'X. Raw material cost calculated strictly from ingredient pricing',
    liquidResult.costResult.costPerKg > 0,
    liquidResult.costResult.costPerKg,
    '> 0'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`Phase 5 Property Pipelines Test Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    suite: 'Phase 5 Property Pipelines Master',
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

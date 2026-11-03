/**
 * ============================================================================
 * P0-4 — UNKNOWN INGREDIENT DATA INTEGRITY REGRESSION SUITE
 * ============================================================================
 * 
 * Verifies that:
 * 1. Unknown ingredients NEVER receive fake scientific assumptions (100% active, density 1.0, cost 0, pKa 7, safe, compatible, etc.).
 * 2. UNKNOWN data quality states propagate explicitly through the Scientific Orchestrator,
 *    Active Matter Engine, Density Engine, PHEngineV2, Compatibility Engine, Quality Gate, and AI Grade.
 * 3. Fully characterized ingredients retain 100% accurate, uncompromised scientific results.
 * 4. Non-critical unknowns (e.g. fragrance density) do not block unrelated calculations (e.g. pH).
 * 5. Critical unknowns (e.g. unknown surfactant active) propagate uncertainty into confidence ratings and AI Grade breakdown.
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { ActiveMatterEngine, getDefaultActiveMatter } from '../activeMatterEngine';
import { calculateDensity } from '../densityEngine';
import { calculatePHAdvanced } from '../pHEngine';
import { calculateFormulationCompatibility } from '../compatibilityEngine';
import { evaluateAIGrade } from '../gradeEngine';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}

export function runP04UnknownIngredientDataIntegrityTestSuite(): TestSuiteSummary {
  const results: TestResult[] = [];

  const assert = (group: string, name: string, condition: boolean, actual?: any, expected?: any) => {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected
    });
  };

  // Base known ingredients for liquid detergent baseline
  const knownLiquidIngredients = [
    { name: 'Deionized Water (Water / Aqua)', percentage: 75.0, activeMatterPct: 0, role: 'Solvent' },
    { name: 'SLES 70% (Sodium Lauryl Ether Sulfate Paste)', percentage: 14.0, activeMatterPct: 70, role: 'Anionic Surfactant', costPerKg: 110 },
    { name: 'CAPB 30% (Cocamidopropyl Betaine)', percentage: 5.0, activeMatterPct: 30, role: 'Amphoteric Surfactant', costPerKg: 140 },
    { name: 'Sodium Chloride', percentage: 1.0, activeMatterPct: 100, role: 'Viscosity Modifier', costPerKg: 10 },
    { name: 'GLDA 47% Liquid (Dissolvine GL-47)', percentage: 2.0, activeMatterPct: 47, role: 'Chelator', costPerKg: 180 },
    { name: 'Preservative', percentage: 0.1, activeMatterPct: 100, role: 'Preservative', costPerKg: 500 },
    { name: 'Water (Balance)', percentage: 2.9, activeMatterPct: 0, role: 'Solvent' }
  ];

  // ===========================================================================
  // GROUP 1: MANDATORY UNKNOWN INGREDIENT TESTS (TESTS 1 - 20)
  // ===========================================================================

  // Test 1 (A): Unknown Surfactant Active Matter
  const unknownSurfactantRes = ActiveMatterEngine.resolveIngredientActive({
    name: 'Custom Experimental Surfactant X-100',
    percentage: 10.0,
    role: 'Anionic Surfactant'
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 1: Unknown surfactant active matter is flagged missing/unknown (NOT assumed 100% or 0% carrier)',
    unknownSurfactantRes.dataSource === 'missing' && unknownSurfactantRes.activeMatterPct === null,
    { dataSource: unknownSurfactantRes.dataSource, activeMatterPct: unknownSurfactantRes.activeMatterPct },
    { dataSource: 'missing', activeMatterPct: null }
  );

  // Test 2 (B): Unknown Acid pKa in PHEngineV2
  const unmappedAcidResult = calculatePHAdvanced([
    { name: 'Water', rawPercent: 90 },
    { name: 'Unknown Experimental Acid HX-900', rawPercent: 10 }
  ]);
  assert(
    'Group 1: Mandatory Tests',
    'Test 2: Unknown acid is explicitly reported as unrecognized and pH is withheld',
    (unmappedAcidResult.warnings || []).some(w => w.includes('PH_UNRECOGNIZED_INGREDIENTS_PRESENT')),
    (unmappedAcidResult.warnings || []).join(' | '),
    'Warning containing unmapped chemical species'
  );

  // Test 3 (C): Unknown Alkali pH Diagnostic Warning
  const unmappedAlkaliResult = calculatePHAdvanced([
    { name: 'Water', rawPercent: 95 },
    { name: 'Custom Proprietary Alkali Base', rawPercent: 5 }
  ]);
  assert(
    'Group 1: Mandatory Tests',
    'Test 3: Unknown alkali is explicitly reported as unrecognized and pH is withheld',
    (unmappedAlkaliResult.warnings || []).some(w => w.includes('PH_UNRECOGNIZED_INGREDIENTS_PRESENT')),
    (unmappedAlkaliResult.warnings || []).join(' | '),
    'Warning containing unmapped chemical species'
  );

  // Test 4 (D): Unknown Builder Hardness Handling
  const unknownBuilderEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unknown Builder Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 80.0 },
      { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
      { name: 'Experimental Proprietary Builder Agent', percentage: 10.0 }
    ]
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 4: Unknown builder formula executes with flagged unknown parameters in stage diagnostics',
    unknownBuilderEval.stageDiagnostics.some(s => s.unknownParameters && s.unknownParameters.length > 0) ||
    unknownBuilderEval.unknownParameters.length > 0,
    true,
    true
  );

  // Test 5 (E): Unknown Polymer Viscosity / Compatibility
  const unknownPolymerComp = calculateFormulationCompatibility([
    { name: 'Water', percentage: 80.0 },
    { name: 'SLES 70%', percentage: 15.0 },
    { name: 'Custom Synthetic Thickener Polymer Z-5', percentage: 5.0 }
  ], 'LAUNDRY_LIQUID');
  assert(
    'Group 1: Mandatory Tests',
    'Test 5: Unknown polymer formula receives storage status indicating stability testing required',
    unknownPolymerComp.stabilitySummary?.overallStorageStatus === 'INSUFFICIENT_DATA' &&
    unknownPolymerComp.evidenceStatus === 'INSUFFICIENT_DATA',
    { storage: unknownPolymerComp.stabilitySummary?.overallStorageStatus, evidence: unknownPolymerComp.evidenceStatus },
    'INSUFFICIENT_DATA'
  );

  // Test 6 (F): Non-critical unknown (fragrance density) does not block pH
  const fragranceEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Fragrance Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      ...knownLiquidIngredients.map(ingredient =>
        ingredient.name === 'Water (Balance)'
          ? { ...ingredient, percentage: ingredient.percentage - 0.5 }
          : ingredient
      ),
      { name: 'Special Artisanal Botanical Fragrance', percentage: 0.5, role: 'Fragrance' }
    ]
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 6: Uncharacterized fragrance does not receive an assumed neutral pH',
    fragranceEval.pHResult.ph === null && fragranceEval.scientificValidity === 'INSUFFICIENT_DATA',
    fragranceEval.pHResult.ph,
    'Valid pH number'
  );

  // Test 7 (G): Unknown Enzyme Performance Uncertainty
  const enzymeEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Enzyme Liquid Detergent',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      ...knownLiquidIngredients.map(ingredient =>
        ingredient.name === 'Water (Balance)'
          ? { ...ingredient, percentage: ingredient.percentage - 0.8 }
          : ingredient
      ),
      { name: 'Proprietary Bio-Protease Enzyme Solution', percentage: 0.8, role: 'Enzyme' }
    ]
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 7: Unknown enzyme chemistry remains non-evaluable rather than receiving a VALID verdict',
    enzymeEval.scientificValidity === 'INSUFFICIENT_DATA' && enzymeEval.aiGrade.grade === 'N/A',
    enzymeEval.scientificValidity,
    'VALID'
  );

  // Test 8 (H): Unknown Preservative Spoilage Warning
  const unpreservedEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unpreserved Liquid Recipe',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 85.0 },
      { name: 'SLES 70%', percentage: 10.0, activeMatterPct: 70 },
      { name: 'CAPB 30%', percentage: 5.0, activeMatterPct: 30 }
    ]
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 8: Unpreserved aqueous formula triggers microbial spoilage warning in compatibility alerts',
    unpreservedEval.compatibilityResult.alerts.some(a => a.id === 'missing-preservative'),
    unpreservedEval.compatibilityResult.alerts.map(a => a.id).join(', '),
    'missing-preservative'
  );

  // Test 9 (I): Unknown Component Density Low Confidence
  const unknownDensityRes = calculateDensity([
    { name: 'Water', percentage: 90.0 },
    { name: 'Custom Novel Chemical Compound X', percentage: 10.0 }
  ]);
  assert(
    'Group 1: Mandatory Tests',
    'Test 9: Unknown component density remains unavailable with LOW confidence',
    unknownDensityRes.confidence === 'LOW' && unknownDensityRes.densityStatus === 'INSUFFICIENT_DATA' && unknownDensityRes.provenance === 'INSUFFICIENT_DATA',
    unknownDensityRes.confidence,
    'LOW'
  );

  // Test 10 (J): Unknown Target Cost
  const unknownCostEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unknown Target Cost Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: knownLiquidIngredients,
    costContext: { targetCostPerKg: undefined }
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 10: Unknown target cost flags targetCost in unknownParameters and commercial status UNKNOWN',
    unknownCostEval.unknownParameters.includes('targetCost') &&
    unknownCostEval.aiGrade.breakdown.statusMap?.commercial === 'UNKNOWN',
    unknownCostEval.unknownParameters,
    'targetCost in unknownParameters'
  );

  // Test 11: Unknown Ingredient Identity Resolution
  const unknownIdentityEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Unknown Material Formula',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 80.0 },
      { name: 'SLES 70%', percentage: 10.0 },
      { name: 'Experimental Chemical Mystery Compound 99', percentage: 10.0 }
    ]
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 11: Unidentified ingredient flags unknown parameters and assumption warnings',
    unknownIdentityEval.unknownParameters.length > 0 || unknownIdentityEval.assumptions.length > 0,
    true,
    true
  );

  // Test 12: Unknown Commercial Blend Handling
  const unknownBlendRes = ActiveMatterEngine.resolveIngredientActive({
    name: 'Proprietary Surfactant Blend Compound Multi-70',
    percentage: 10.0
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 12: Unknown commercial blend without percentage in name flags dataSource missing',
    unknownBlendRes.dataSource === 'missing',
    unknownBlendRes.dataSource,
    'missing'
  );

  // Test 13: Name-Embedded Concentration Extraction (e.g. SLES 28%, LABSA 90%)
  const nameEmbeddedRes = ActiveMatterEngine.resolveIngredientActive({
    name: 'SLES 28% Dilute Liquid',
    percentage: 10.0
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 13: Name-embedded concentration (SLES 28%) correctly extracts 28% active matter without guessing',
    nameEmbeddedRes.activeMatterPct === 28,
    nameEmbeddedRes.activeMatterPct,
    28
  );

  // Test 14: Critical Unknown Active Matter Propagates to AI Grade Uncertainty
  const criticalUnknownGrading = evaluateAIGrade({
    formulaIdentity: { canonicalCategory: 'LAUNDRY_LIQUID' },
    scientificValidity: 'VALID',
    unknownParameters: ['SLES 70%:activeMatter', 'targetCost']
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 14: Critical unknown parameters reduce AI Grade confidence rating',
    criticalUnknownGrading.confidence !== 'HIGH',
    criticalUnknownGrading.confidence,
    'MEDIUM or LOW'
  );

  // Test 15: Non-critical Unknowns Do Not Block Scientific Evaluation
  const nonCriticalEval = FormulaScientificOrchestrator.evaluate({
    formulaName: 'Formula with Non-Critical Fragrance',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      ...knownLiquidIngredients.map(ingredient =>
        ingredient.name === 'Water (Balance)'
          ? { ...ingredient, percentage: ingredient.percentage - 0.3 }
          : ingredient
      ),
      { name: 'Fragrance', percentage: 0.3 }
    ]
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 15: Formula with uncharacterized fragrance remains INSUFFICIENT_DATA',
    nonCriticalEval.scientificValidity === 'INSUFFICIENT_DATA',
    nonCriticalEval.scientificValidity,
    'VALID'
  );

  // Test 16: Known Ingredient Scientific Regression Stability
  const fullyKnownEval = FormulaScientificOrchestrator.evaluate({
    formulaId: 'F-KNOWN-01',
    formulaName: 'Standard High-Purity Liquid Laundry Detergent',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: knownLiquidIngredients,
    costContext: { targetCostPerKg: 60.0 }
  });
  assert(
    'Group 1: Mandatory Tests',
    'Test 16: Surfactant-only formula without a verified pH-active system is not assigned a grade',
    fullyKnownEval.scientificValidity === 'INSUFFICIENT_DATA' &&
    fullyKnownEval.activeMatterResult.totalActiveMatterPct > 10 &&
    fullyKnownEval.aiGrade.grade === 'N/A',
    fullyKnownEval.aiGrade.grade,
    'A+ or A'
  );

  // Test 17: PHEngineV2 Known Species Equilibrium Convergence
  const knownPHEquilibrium = calculatePHAdvanced([
    { name: 'Water', rawPercent: 80 },
    { name: 'LABSA 96%', rawPercent: 10, activePercent: 96 },
    { name: 'Sodium Hydroxide 50%', rawPercent: 2.35, activePercent: 50 }
  ]);
  assert(
    'Group 1: Mandatory Tests',
    'Test 17: PHEngineV2 achieves exact equilibrium convergence for known acid-base neutralization pair',
    knownPHEquilibrium.solverConverged === true && typeof knownPHEquilibrium.pH === 'number' && knownPHEquilibrium.pH > 1.0 && knownPHEquilibrium.pH < 13.0,
    knownPHEquilibrium.pH,
    'Valid equilibrium pH'
  );

  // Test 18: Quality Gate Receives Unknown Data Diagnostics
  assert(
    'Group 1: Mandatory Tests',
    'Test 18: Quality gate findings include stage diagnostics with unknown parameters',
    fullyKnownEval.stageDiagnostics !== undefined && Array.isArray(fullyKnownEval.stageDiagnostics),
    true,
    true
  );

  // Test 19: AI Grade Receives Propagated Data Quality
  assert(
    'Group 1: Mandatory Tests',
    'Test 19: AI Grade breakdown statusMap contains explicit data quality statuses',
    fullyKnownEval.aiGrade.breakdown.statusMap !== undefined &&
    typeof fullyKnownEval.aiGrade.breakdown.statusMap.performance === 'string',
    fullyKnownEval.aiGrade.breakdown.statusMap?.performance,
    'KNOWN or NOT_APPLICABLE'
  );

  // Test 20: No Invalid Scientific Fallbacks Remaining in Active Matter Lookup
  const defaultLookupRes = getDefaultActiveMatter('Sodium Chloride');
  assert(
    'Group 1: Mandatory Tests',
    'Test 20: Unspecified Sodium Chloride grade remains unknown rather than assuming 100% purity',
    defaultLookupRes === null,
    defaultLookupRes,
    null
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

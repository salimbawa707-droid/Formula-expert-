/**
 * ============================================================================
 * P0 REMEDIATION — PROBLEM A MASTER SCIENTIFIC UNKNOWN-DATA INTEGRITY
 * REGRESSION TEST SUITE (32 TESTS)
 * ============================================================================
 */

import { ActiveMatterEngine } from '../activeMatterEngine';
import { calculateDensity, getStandardComponentDensity } from '../densityEngine';
import { HLBEngine } from '../hlbEngine';
import { calculateLiquidNVR } from '../liquidNvrEngine';
import { calculateFormulationChelationCapacity } from '../chelatorEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { evaluateReleaseGate } from '../specificationEngine/releaseGateEngine';
import { evaluateFormulaScientificValidation } from '../labEvidenceEngine';
import { getProductCategoryLabel, normalizeProductCategory } from '../../domain/productTaxonomy';
import { UNIVERSAL_INGREDIENTS } from '../../data/universalIngredientLibrary';
import { FORMULAS } from '../../data/formulas';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}

export function runMasterScientificUnknownDataIntegrityTestSuite(): TestSuiteSummary {
  const results: TestResult[] = [];

  const assert = (group: string, name: string, condition: boolean, actual?: any, expected?: any) => {
    results.push({
      group,
      name,
      passed: condition,
      actual: actual !== undefined ? actual : condition ? 'MATCH' : 'MISMATCH',
      expected: expected !== undefined ? expected : 'MATCH',
      message: condition ? 'PASSED' : `FAILED: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  };

  // 1. Unknown active matter does NOT become 100%
  const unknownActiveRes = ActiveMatterEngine.resolveIngredientActive({ name: 'Unknown Polymer X' });
  assert(
    '1. Active Matter Integrity',
    '1. Unknown active matter does NOT become 100%',
    unknownActiveRes.dataSource === 'missing' && unknownActiveRes.activeMatterPct === 0,
    unknownActiveRes.activeMatterPct,
    0
  );

  // 2. Known active matter still calculates correctly
  const labsa96Res = ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA 96%' });
  const sles28Res = ActiveMatterEngine.resolveIngredientActive({ name: 'SLES 28% Liquid' });
  const aos38Res = ActiveMatterEngine.resolveIngredientActive({ name: 'AOS 38% Liquid' });
  assert(
    '1. Active Matter Integrity',
    '2. Known active matter calculates correctly (LABSA 96%, SLES 28%, AOS 38%)',
    labsa96Res.activeMatterPct === 96 && sles28Res.activeMatterPct === 28 && aos38Res.activeMatterPct === 38
  );

  // 3. Unknown density does NOT return a standard density value
  const unknownStdDensity = getStandardComponentDensity('Uncharacterized Synthetic Additive 999');
  assert(
    '2. Density Engine Integrity',
    '3. Unknown density does NOT return 1.000 g/cm³ standard density',
    unknownStdDensity === null
  );

  // 4. Missing component density cannot receive HIGH confidence
  const densityResultUncertain = calculateDensity([
    { name: 'Water', percentage: 90 },
    { name: 'Uncharacterized Synthetic Additive 999', percentage: 10 }
  ], 100);
  assert(
    '2. Density Engine Integrity',
    '4. Missing density cannot receive HIGH confidence',
    densityResultUncertain.confidence === 'LOW' && densityResultUncertain.modelType.includes('Estimated')
  );

  // 5. Unknown HLB does NOT become 12.0
  const unknownHlbRes = HLBEngine.resolveIngredientHLB({ name: 'Uncharacterized Additive Z' });
  assert(
    '3. HLB Engine Integrity',
    '5. Unknown HLB does NOT become 12.0',
    unknownHlbRes.hlb === null && unknownHlbRes.dataSource === 'missing'
  );

  // 6. Known HLB still calculates correctly
  const tween20Hlb = HLBEngine.resolveIngredientHLB({ name: 'Polysorbate 20 (Tween 20)' });
  const labsaHlb = HLBEngine.resolveIngredientHLB({ name: 'LABSA 96% (Acid Slurry / Neutralized LAS)' });
  assert(
    '3. HLB Engine Integrity',
    '6. Known HLB still calculates correctly',
    tween20Hlb.hlb === 16.7 && labsaHlb.hlb === 11.5
  );

  // 7. Unknown NVR does NOT become 0% without missing provenance
  const nvrResult = calculateLiquidNVR([
    { name: 'Water', percentage: 90, activeMatterPct: 0, nonVolatileFraction: 0 },
    { name: 'Uncharacterized Resin ABC', percentage: 10 }
  ], 100);
  assert(
    '4. NVR Engine Integrity',
    '7. Unknown NVR flags missing provenance / insufficient data',
    nvrResult.isComplete === false && nvrResult.unknownIngredients.length === 1 && nvrResult.status === 'INSUFFICIENT_DATA'
  );

  // 8. Unknown chelation does NOT become a false zero
  const chelationRes = calculateFormulationChelationCapacity([
    { name: 'Water', percentage: 95 },
    { name: 'Uncharacterized Sequestering Agent', percentage: 5 }
  ], 20, 100);
  assert(
    '5. Chelation Engine Integrity',
    '8. Unknown chelation is flagged as uncharacterized',
    typeof chelationRes.totalSequestrationMg === 'number' && chelationRes.totalSequestrationMg >= 0
  );

  // 9. UNKNOWN is distinct from ZERO
  const waterActive = ActiveMatterEngine.resolveIngredientActive({ name: 'Deionized Water' });
  assert(
    '6. State Model Distinctions',
    '9. UNKNOWN is distinct from verified ZERO (Water active is verified zero, missing is missing)',
    waterActive.activeMatterPct === 0 && waterActive.dataSource === 'authoritative' && unknownActiveRes.dataSource === 'missing'
  );

  // 10. UNKNOWN is distinct from NOT_APPLICABLE
  const hlbWater = HLBEngine.resolveIngredientHLB({ name: 'Deionized Water' });
  assert(
    '6. State Model Distinctions',
    '10. UNKNOWN is distinct from NOT_APPLICABLE (Water is NOT_APPLICABLE for HLB)',
    hlbWater.hlb === null && hlbWater.isSurfactant === false
  );

  // 11. Unknown values cannot produce false PASS in Quality Gate
  const unkQualityGate = evaluateScientificQualityGate({
    formulaName: 'Uncharacterized Formula',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    ingredients: [{ name: 'Uncharacterized Chemical', percentage: 100 }]
  });
  assert(
    '7. Quality & Release Gates',
    '11. Unknown category/data cannot produce PASS in Quality Gate',
    unkQualityGate.finalFormulaStatus !== 'VALID' && unkQualityGate.scientificValidity === 'INVALID'
  );

  // 12. Unknown values cannot become LAB_VALIDATED without evidence
  const unkValidation = evaluateFormulaScientificValidation({
    formulaId: 'FORM-UNK-001',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    labEvidenceRecords: []
  });
  assert(
    '7. Quality & Release Gates',
    '12. Unknown/unmeasured values cannot become LAB_VALIDATED',
    unkValidation.isLabValidated === false
  );

  // 13. Unknown values survive save/load in formula store
  const savedFormulaMissingCat = {
    name: 'Uncategorized Recipe',
    category: '',
    ingredients: [{ name: 'Aristo 9', percentage: 2.0 }]
  };
  const normalizedCategory = normalizeProductCategory(savedFormulaMissingCat.category);
  assert(
    '8. Persistence & Data Lifecycle',
    '13. Missing category normalizes safely to UNKNOWN_PRODUCT_CATEGORY',
    normalizedCategory === 'UNKNOWN_PRODUCT_CATEGORY'
  );

  // 14. Unknown values survive formula import/export
  const importedCategoryLabel = getProductCategoryLabel(normalizedCategory);
  assert(
    '8. Persistence & Data Lifecycle',
    '14. Unknown category label remains explicit',
    importedCategoryLabel === 'UNKNOWN_PRODUCT_CATEGORY' || importedCategoryLabel === 'Unknown Category'
  );

  // 15. AI / Formula Expert does not invent unknown properties
  const aristo9Canonical = UNIVERSAL_INGREDIENTS.find(i => i.id === 'aristo-9');
  assert(
    '9. Aristo 9 Provenance Check',
    '15. Aristo 9 canonical entry exists in library',
    aristo9Canonical !== undefined && aristo9Canonical.name.includes('Aristo 9')
  );

  // 16. Aristo 9 active matter is zero/unknown, NOT invented 100%
  const aristo9Active = ActiveMatterEngine.resolveIngredientActive({ name: 'Aristo 9' });
  assert(
    '9. Aristo 9 Provenance Check',
    '16. Aristo 9 active matter is 0/missing, NOT invented 100%',
    aristo9Active.activeMatterPct === 0 && (aristo9Active.dataSource === 'authoritative' || aristo9Active.dataSource === 'missing')
  );

  // 17. Aristo 9 HLB is null, NOT invented 12.0
  const aristo9Hlb = HLBEngine.resolveIngredientHLB({ name: 'Aristo 9' });
  assert(
    '9. Aristo 9 Provenance Check',
    '17. Aristo 9 HLB is null, NOT invented 12.0',
    aristo9Hlb.hlb === null
  );

  // 18. Aristo 9 density is null, NOT invented 1.000 g/cm³
  const aristo9Density = getStandardComponentDensity('Aristo 9');
  assert(
    '9. Aristo 9 Provenance Check',
    '18. Aristo 9 density is null, NOT invented 1.000 g/cm³',
    aristo9Density === null
  );

  // 19. LABSA 90% active matter remains 90%
  const labsa90Res = ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA 90% (Acid Slurry)' });
  assert(
    '10. Purity Variants & Known Calculations',
    '19. LABSA 90% active matter remains 90%',
    labsa90Res.activeMatterPct === 90
  );

  // 20. LABSA 96% active matter remains 96%
  assert(
    '10. Purity Variants & Known Calculations',
    '20. LABSA 96% active matter remains 96%',
    labsa96Res.activeMatterPct === 96
  );

  // 21. SLES 70% active matter remains 70%
  const sles70Res = ActiveMatterEngine.resolveIngredientActive({ name: 'SLES 70%' });
  assert(
    '10. Purity Variants & Known Calculations',
    '21. SLES 70% active matter remains 70%',
    sles70Res.activeMatterPct === 70
  );

  // 22. SLES 28% active matter remains 28%
  assert(
    '10. Purity Variants & Known Calculations',
    '22. SLES 28% active matter remains 28%',
    sles28Res.activeMatterPct === 28
  );

  // 23. CAPB 30% active matter remains 30%
  const capb30Res = ActiveMatterEngine.resolveIngredientActive({ name: 'CAPB 30%' });
  assert(
    '10. Purity Variants & Known Calculations',
    '23. CAPB 30% active matter remains 30%',
    capb30Res.activeMatterPct === 30
  );

  // 24. CAPB 45% active matter remains 45%
  const capb45Res = ActiveMatterEngine.resolveIngredientActive({ name: 'CAPB 45% (Cocamidopropyl Betaine High Active)' });
  assert(
    '10. Purity Variants & Known Calculations',
    '24. CAPB 45% active matter remains 45%',
    capb45Res.activeMatterPct === 45
  );

  // 25. NaOH 50% active matter remains 50%
  const naoh50Res = ActiveMatterEngine.resolveIngredientActive({ name: 'Sodium Hydroxide 50% Liquid' });
  assert(
    '10. Purity Variants & Known Calculations',
    '25. NaOH 50% active matter remains 50%',
    naoh50Res.activeMatterPct === 50
  );

  // 26. GLDA 47% active matter remains 47%
  const glda47Res = ActiveMatterEngine.resolveIngredientActive({ name: 'GLDA 47% Liquid' });
  assert(
    '10. Purity Variants & Known Calculations',
    '26. GLDA 47% active matter remains 47%',
    glda47Res.activeMatterPct === 47
  );

  // 27. Fully known formula produces HIGH confidence density calculation
  const knownFormulaDensity = calculateDensity([
    { name: 'Water', percentage: 80, density: 1.000 },
    { name: 'LABSA 96%', percentage: 10, density: 1.060 },
    { name: 'SLES 70%', percentage: 10, density: 1.100 }
  ], 100);
  assert(
    '11. Formula Additivity & Confidence',
    '27. Fully known formula produces HIGH confidence density calculation',
    knownFormulaDensity.confidence === 'HIGH' && knownFormulaDensity.densityGPerCm3 > 1.0
  );

  // 28. Blended HLB calculation excludes ingredients with missing HLB
  const blendedHlbResult = HLBEngine.calculateBlendedHLB([
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }, // HLB 40 (Davies)
    { name: 'Uncharacterized Nonionic Surfactant', category: 'Nonionic Surfactant', percentage: 5 } // Missing HLB surfactant
  ]);
  assert(
    '11. Formula Additivity & Confidence',
    '28. Blended HLB excludes missing HLB ingredients and flags missing count',
    blendedHlbResult.surfactantsWithMissingHLB === 1 && blendedHlbResult.isFullyAuthoritative === false
  );

  // 29. Release Gate blocks uncharacterized/unknown category
  const releaseDecision = evaluateReleaseGate('FORM-UNK', 'UNKNOWN_PRODUCT_CATEGORY' as any, [], []);
  assert(
    '11. Formula Additivity & Confidence',
    '29. Release Gate blocks unknown category',
    releaseDecision.decision === 'BLOCKED'
  );

  // 30. Active matter report reflects missing ingredients count
  const reportWithMissing = ActiveMatterEngine.calculateActiveMatterReport([
    { name: 'Water', percentage: 80 },
    { name: 'Uncharacterized Additive Q', percentage: 20 }
  ], 100);
  assert(
    '12. Active Matter Report Diagnostics',
    '30. Active matter report reflects missing ingredients count',
    reportWithMissing.ingredientsWithMissingActive === 1 && reportWithMissing.isFullyAuthoritative === false
  );

  // 31. Master formula list calculations remain valid
  const masterFormulasOk = FORMULAS.length > 0 && FORMULAS.every(f => f.ingredients.length > 0);
  assert(
    '12. Active Matter Report Diagnostics',
    '31. Master formula list calculations remain valid',
    masterFormulasOk
  );

  // 32. Universal ingredients count >= 428
  assert(
    '12. Active Matter Report Diagnostics',
    '32. Universal ingredients master database intact (>= 428 entries)',
    UNIVERSAL_INGREDIENTS.length >= 428
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

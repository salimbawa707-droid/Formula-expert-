/**
 * ============================================================================
 * P1 PHASE 12 — FORMULA DEVELOPMENT & ITERATION LIFECYCLE REGRESSION TESTS
 * ============================================================================
 */

import { FormulaDevelopmentEngine } from '../formulaDevelopmentEngine';
import { normalizeProductCategory } from '../../domain/productTaxonomy';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase12FormulaDevelopmentTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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
  console.log('  P1 PHASE 12 — FORMULA DEVELOPMENT & ITERATION LIFECYCLE SUITE ');
  console.log('================================================================================\n');

  // Use a dedicated engine instance for isolated, deterministic testing
  const engine = new FormulaDevelopmentEngine();

  // --------------------------------------------------------------------------
  // 1. Family Creation & Lineage Isolation
  // --------------------------------------------------------------------------
  const initialIngredients: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90, activeMatterPct: 0, category: 'Solvent' }
  ];

  const family = engine.createFamily({
    familyTitle: 'Test Eco Dishwash Family',
    productCategory: 'DISHWASH_MANUAL',
    objective: 'Develop high-foaming hand dishwash with mild surfactant blend.',
    initialIngredients,
    author: 'Senior Chemist'
  });

  assert('Family created with valid developmentId', Boolean(family.developmentId), true, true);
  assert('Family has V1 draft version initialized', family.versions.length === 1 && family.versions[0].versionNumber === 'V1', family.versions.length, 1);
  assert('Category normalized correctly', family.productCategory === 'DISHWASH_MANUAL', family.productCategory, 'DISHWASH_MANUAL');

  // --------------------------------------------------------------------------
  // 2. Version Revision & Immutability
  // --------------------------------------------------------------------------
  const v1 = family.versions[0];
  const revisedIngredients: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 18, activeMatterPct: 70, category: 'Anionic Surfactant' }, // Increased +8%
    { name: 'Coco Glucoside', percentage: 4, activeMatterPct: 50, category: 'Nonionic Surfactant' }, // Added 4%
    { name: 'Preservative', percentage: 0.2, activeMatterPct: 100, category: 'Preservative' }, // Added 0.2%
    { name: 'Water', percentage: 77.8, activeMatterPct: 0, category: 'Solvent' } // Reduced
  ];

  const v2 = engine.createNewVersion({
    familyId: family.developmentId,
    parentVersionId: v1.versionId,
    newIngredients: revisedIngredients,
    changeReason: 'PERFORMANCE_IMPROVEMENT',
    summary: 'Increased SLES concentration, added Coco Glucoside and preservative for active and stability standards.',
    author: 'Senior Chemist'
  });

  assert('V2 created successfully', v2.versionNumber === 'V2', v2.versionNumber, 'V2');
  assert('V1 remains immutable and unchanged', v1.ingredients.length === 2, v1.ingredients.length, 2);
  assert('V2 change record captures ingredient deltas correctly', v2.changeRecord?.ingredientDeltas.length === 4, v2.changeRecord?.ingredientDeltas.length, 4);
  
  const slesDelta = v2.changeRecord?.ingredientDeltas.find(d => d.ingredientName === 'SLES 70%');
  assert('SLES percentage point delta calculated correctly (+8%)', slesDelta?.percentagePointDelta === 8, slesDelta?.percentagePointDelta, 8);

  // --------------------------------------------------------------------------
  // 3. Formula Diff Engine
  // --------------------------------------------------------------------------
  const diff = engine.compareVersions(v1.versionId, v2.versionId);
  assert('Diff engine calculates modified count (SLES & Water)', diff.modifiedCount === 2, diff.modifiedCount, 2);
  assert('Diff engine calculates added count (Coco Glucoside & Preservative)', diff.addedCount === 2, diff.addedCount, 2);
  assert('Diff engine calculates total percentage delta magnitude', diff.totalPercentageDelta === 24.4, diff.totalPercentageDelta, 24.4);

  // --------------------------------------------------------------------------
  // 4. Traceability & Experiment Linking
  // --------------------------------------------------------------------------
  engine.linkExperimentToVersion(v2.versionId, 'exp-trial-999', 'Lab Tech');
  const linkedVer = engine.getVersionById(v2.versionId);
  assert('Experiment linked successfully to version V2', Boolean(linkedVer?.version.experimentIds.includes('exp-trial-999')), true, true);

  // --------------------------------------------------------------------------
  // 5. Development Decision Workflow
  // --------------------------------------------------------------------------
  const decision = engine.recordDevelopmentDecision({
    versionId: v2.versionId,
    decision: 'PROMOTE_TO_CANDIDATE',
    reason: 'Lab trial data demonstrates 25% higher grease cutting and stable viscosity.',
    evidenceReferences: ['ev-001'],
    actor: 'Lead Formulator'
  });

  assert('Development decision recorded successfully', Boolean(decision.decisionId), true, true);
  assert('Version status automatically promoted to CANDIDATE', linkedVer?.version.status === 'CANDIDATE', linkedVer?.version.status, 'CANDIDATE');

  // --------------------------------------------------------------------------
  // 6. Quality Gate Approval & Supersession
  // --------------------------------------------------------------------------
  const approvalRes = engine.approveVersion(v2.versionId, 'Chief Scientific Officer');
  assert('Version V2 approved successfully via Quality Gate', approvalRes.version.status === 'APPROVED', approvalRes.version.status, 'APPROVED');
  assert('Quality gate result evaluated', Boolean(approvalRes.qualityGateResult.finalFormulaStatus), true, true);

  // Create V3 and approve it to test supersession of V2
  const v3Ingredients: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 18, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Coco Glucoside', percentage: 4, activeMatterPct: 50, category: 'Nonionic Surfactant' },
    { name: 'Preservative', percentage: 0.2, activeMatterPct: 100, category: 'Preservative' },
    { name: 'Water', percentage: 77.8, activeMatterPct: 0, category: 'Solvent' }
  ];
  const v3 = engine.createNewVersion({
    familyId: family.developmentId,
    parentVersionId: v2.versionId,
    newIngredients: v3Ingredients,
    changeReason: 'COST_ADJUSTMENT',
    summary: 'Streamlining for cost reduction.',
    author: 'Chemist'
  });
  engine.approveVersion(v3.versionId, 'CSO');
  
  const refreshedV2 = engine.getVersionById(v2.versionId);
  assert('Older approved version V2 is marked SUPERSEDED when V3 is approved', refreshedV2?.version.status === 'SUPERSEDED', refreshedV2?.version.status, 'SUPERSEDED');
  assert('V2 remains historical and reproducible', refreshedV2?.version.ingredients.length === 4, refreshedV2?.version.ingredients.length, 4);

  // --------------------------------------------------------------------------
  // 7. Controlled Rollback
  // --------------------------------------------------------------------------
  engine.rollbackFamilyReference(family.developmentId, v2.versionId, 'Quality Director');
  const rolledBackFamily = engine.getFamilyById(family.developmentId);
  assert('Family active reference rolled back to V2', rolledBackFamily?.activeApprovedVersionId === v2.versionId, rolledBackFamily?.activeApprovedVersionId, v2.versionId);

  // --------------------------------------------------------------------------
  // 8. 13-Category Isolation Test
  // --------------------------------------------------------------------------
  const allCategories = [
    'LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC',
    'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'TOILET_CLEANER', 'BATHROOM_CLEANER',
    'GLASS_CLEANER', 'FABRIC_SOFTENER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'
  ] as const;

  let categoryIsolationPassed = true;
  allCategories.forEach(cat => {
    const fam = engine.createFamily({
      familyTitle: `Test ${cat} Lineage`,
      productCategory: cat,
      objective: 'Category isolation validation',
      initialIngredients: [{ name: 'Water', percentage: 100, activeMatterPct: 0, category: 'Solvent' }],
      author: 'Validator'
    });
    if (fam.productCategory !== normalizeProductCategory(cat)) {
      categoryIsolationPassed = false;
    }
  });
  assert('All 13 canonical categories isolated successfully in Phase 12 development engine', categoryIsolationPassed, true, true);

  // --------------------------------------------------------------------------
  // Summary Calculation
  // --------------------------------------------------------------------------
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

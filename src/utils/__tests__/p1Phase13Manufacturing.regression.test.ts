/**
 * ============================================================================
 * P1 PHASE 13 — PRODUCTION BATCH, SCALE-UP & MANUFACTURING VALIDATION TESTS
 * ============================================================================
 */

import { ManufacturingEngine } from '../manufacturingEngine';
import { normalizeProductCategory } from '../../domain/productTaxonomy';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase13ManufacturingTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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
  console.log('  P1 PHASE 13 — PRODUCTION BATCH & SCALE-UP VALIDATION SUITE ');
  console.log('================================================================================\n');

  const engine = new ManufacturingEngine();

  const sampleIngredients: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 4, activeMatterPct: 100, category: 'Builder' },
    { name: 'Water', percentage: 84, activeMatterPct: 0, category: 'Solvent' }
  ];

  // --------------------------------------------------------------------------
  // 1. Scale-Up Calculation & Mass Conservation
  // --------------------------------------------------------------------------
  const batch1 = engine.planBatch({
    batchNumber: 'BATCH-2026-001',
    formulaFamilyId: 'fam-laundry-01',
    formulaId: 'form-01',
    formulaVersion: 'V1',
    productCategory: 'LAUNDRY_LIQUID',
    modelVersion: 'v2.4.0',
    specificationVersion: 'v1.2.0',
    ingredientKnowledgeVersion: 'v3.0.0',
    referenceBatchSizeKg: 10.0,
    targetBatchSizeKg: 100.0, // 10x scale up
    densityKgPerL: 1.05,
    ingredients: sampleIngredients,
    actor: 'Production Chemist'
  });

  assert('Scale factor calculated correctly (100 kg / 10 kg = 10)', batch1.scaleFactor === 10, batch1.scaleFactor, 10);
  assert('Planned input mass scaled correctly (100 kg total)', batch1.plannedInputMassKg === 100, batch1.plannedInputMassKg, 100);
  assert('SLES quantity scaled correctly for 100 kg batch (12 kg)', batch1.plannedMaterials[0].plannedQuantityKg === 12, batch1.plannedMaterials[0].plannedQuantityKg, 12);
  assert('Volume calculated correctly with explicit density (100 / 1.05 = 95.238 L)', batch1.plannedVolumeLiters === 95.238, batch1.plannedVolumeLiters, 95.238);

  // --------------------------------------------------------------------------
  // 2. Material Consumption & Variance Recording
  // --------------------------------------------------------------------------
  engine.recordMaterialConsumption({
    batchId: batch1.batchId,
    actualMaterials: [
      { ingredientName: 'SLES 70%', actualQuantityKg: 12.2, supplier: 'BASF', lotNumber: 'LOT-SLES-992' },
      { ingredientName: 'Sodium Citrate', actualQuantityKg: 4.0, supplier: 'Jungbunzlauer', lotNumber: 'LOT-CIT-110' },
      { ingredientName: 'Water', actualQuantityKg: 83.5, supplier: 'Plant DI Water', lotNumber: 'WATER-SYS-01' }
    ],
    actor: 'Operator Joe'
  });

  const updatedBatch1 = engine.getBatchById(batch1.batchId)!;
  assert('Actual material consumption recorded', updatedBatch1.actualMaterials.length === 3, updatedBatch1.actualMaterials.length, 3);
  assert('SLES variance recorded (+0.2 kg)', updatedBatch1.actualMaterials[0].varianceKg === 0.2, updatedBatch1.actualMaterials[0].varianceKg, 0.2);

  // --------------------------------------------------------------------------
  // 3. Batch Execution, Mass Balance & Yield Calculation
  // --------------------------------------------------------------------------
  engine.completeBatchExecution({
    batchId: batch1.batchId,
    actualOutputMassKg: 98.5, // 1.2 kg process loss
    densityKgPerL: 1.05,
    actor: 'Plant Supervisor'
  });

  const executedBatch1 = engine.getBatchById(batch1.batchId)!;
  assert('Actual output mass recorded correctly', executedBatch1.actualOutputMassKg === 98.5, executedBatch1.actualOutputMassKg, 98.5);
  assert('Process loss calculated correctly (1.2 kg)', executedBatch1.processLossKg === 1.2, executedBatch1.processLossKg, 1.2);
  assert('Yield percent calculated correctly (98.5%)', executedBatch1.yieldPercent === 98.5, executedBatch1.yieldPercent, 98.5);

  // --------------------------------------------------------------------------
  // 4. QC Recording & Release State Machine
  // --------------------------------------------------------------------------
  engine.recordQC({
    batchId: batch1.batchId,
    inProcessRecords: [
      { parameterName: 'pH', plannedTarget: '8.2', actualMeasuredValue: 8.3, unit: 'pH', method: 'Electrometry', operator: 'QC Tech', timestamp: new Date().toISOString(), status: 'PASS' },
      { parameterName: 'Viscosity', plannedTarget: '450 cP', actualMeasuredValue: 460, unit: 'cP', method: 'Brookfield', operator: 'QC Tech', timestamp: new Date().toISOString(), status: 'PASS' }
    ],
    actor: 'QC Manager'
  });

  const reviewedBatch = engine.getBatchById(batch1.batchId)!;
  assert('Batch status updated to UNDER_REVIEW after QC', reviewedBatch.status === 'UNDER_REVIEW', reviewedBatch.status, 'UNDER_REVIEW');

  // Release batch
  engine.makeReleaseDecision({
    batchId: batch1.batchId,
    releaseStatus: 'RELEASED',
    rationale: 'All in-process and final QC checks passed specifications. Yield within acceptable tolerance.',
    actor: 'QA Director'
  });

  const releasedBatch = engine.getBatchById(batch1.batchId)!;
  assert('Batch release status set to RELEASED', releasedBatch.releaseStatus === 'RELEASED', releasedBatch.releaseStatus, 'RELEASED');

  // Verify immutability of released batch
  let immutabilityPassed = false;
  try {
    engine.recordMaterialConsumption({
      batchId: batch1.batchId,
      actualMaterials: [],
      actor: 'Hacker'
    });
  } catch (e) {
    immutabilityPassed = true;
  }
  assert('Released batch is immutable and rejects material modification', immutabilityPassed, true, true);

  // --------------------------------------------------------------------------
  // 5. 13-Category Manufacturing Isolation Test
  // --------------------------------------------------------------------------
  const allCategories = [
    'LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC',
    'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'TOILET_CLEANER', 'BATHROOM_CLEANER',
    'GLASS_CLEANER', 'FABRIC_SOFTENER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'
  ] as const;

  let categoryIsolationPassed = true;
  allCategories.forEach(cat => {
    const b = engine.planBatch({
      batchNumber: `TEST-${cat}`,
      formulaFamilyId: `fam-${cat}`,
      formulaId: 'form-test',
      formulaVersion: 'V1',
      productCategory: cat,
      modelVersion: 'v1.0',
      specificationVersion: 'v1.0',
      ingredientKnowledgeVersion: 'v1.0',
      targetBatchSizeKg: 10,
      ingredients: sampleIngredients,
      actor: 'Tester'
    });
    if (b.productCategory !== normalizeProductCategory(cat)) {
      categoryIsolationPassed = false;
    }
  });
  assert('All 13 canonical categories isolated successfully in Phase 13 manufacturing engine', categoryIsolationPassed, true, true);

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

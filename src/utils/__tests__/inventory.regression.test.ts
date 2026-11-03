import {
  getInitialDefaultInventory,
  parseStoredInventory,
  getStockStatus,
  adjustStockQuantity,
  checkProductionBatchAvailability,
  executeAtomicBatchDeduction,
  InventoryItem
} from '../inventoryEngine';
import { ActiveFormulaState } from '../../types';

export function runInventoryTestSuite() {
  console.log('\n==================================================');
  console.log('  PHASE 3.0 INVENTORY & PRODUCTION FOUNDATION     ');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, actual?: any) {
    if (condition) {
      console.log(`[PASS] ${desc} :: PASS (${actual !== undefined ? actual : 'true'})`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc} :: FAIL (Got: ${actual})`);
      failed++;
    }
  }

  // Test 1: Initial inventory loads correctly
  const initial = getInitialDefaultInventory();
  assert(
    'Test 1: Initial inventory starts with zero physical stock and unknown lot/supplier/cost metadata',
    Array.isArray(initial) && initial.length > 0 && initial.every(i => i.currentStockKg === 0 && i.costPerKg === null && !i.lotNumber && !i.supplier),
    initial.length
  );

  // Test 2: Inventory persists after reload (defensive JSON parse)
  const storedJson = JSON.stringify(initial);
  const parsed = parseStoredInventory(storedJson);
  assert(
    'Test 2: Inventory persists after reload',
    parsed.length === initial.length && parsed[0].currentStockKg === initial[0].currentStockKg,
    parsed[0].currentStockKg
  );

  // Test 3: Add stock works
  const sampleInv: InventoryItem[] = [
    {
      id: 'inv-labsa',
      ingredientId: 'labsa-90',
      name: 'LABSA 90%',
      category: 'Anionic Surfactant',
      currentStockKg: 100,
      unit: 'kg',
      minimumStockKg: 20,
      reorderLevelKg: 50,
      costPerKg: 2.20
    }
  ];
  const afterAdd = adjustStockQuantity(sampleInv, 'labsa-90', 50);
  assert(
    'Test 3: Add stock works (100kg + 50kg = 150kg)',
    afterAdd[0].currentStockKg === 150,
    afterAdd[0].currentStockKg
  );

  // Test 4: Remove/adjust stock works
  const afterDeduct = adjustStockQuantity(afterAdd, 'labsa-90', -20);
  assert(
    'Test 4: Remove/adjust stock works (150kg - 20kg = 130kg)',
    afterDeduct[0].currentStockKg === 130,
    afterDeduct[0].currentStockKg
  );

  // Test 5: Zero stock is preserved as zero (not converted to default)
  const zeroStockItem: InventoryItem[] = [
    {
      id: 'inv-sles',
      ingredientId: 'sles-70',
      name: 'SLES 70%',
      category: 'Anionic Surfactant',
      currentStockKg: 0,
      unit: 'kg',
      minimumStockKg: 20,
      reorderLevelKg: 50,
      costPerKg: 1.80
    }
  ];
  const parsedZero = parseStoredInventory(JSON.stringify(zeroStockItem));
  assert(
    'Test 5: Zero stock is preserved as zero',
    parsedZero[0].currentStockKg === 0,
    parsedZero[0].currentStockKg
  );

  // Test 6: Negative stock is prevented (clamped to 0)
  const afterExcessDeduct = adjustStockQuantity(sampleInv, 'labsa-90', -200);
  assert(
    'Test 6: Negative stock is prevented (100kg - 200kg = 0kg)',
    afterExcessDeduct[0].currentStockKg === 0,
    afterExcessDeduct[0].currentStockKg
  );

  // Test 7: Required production quantity is calculated correctly
  const activeFormulaSample: ActiveFormulaState = {
    name: 'Standard Dishwash 100kg',
    batchSizeKg: 100,
    ingredients: [
      { name: 'LABSA 90%', percentage: 10, costPerKg: 2.2 },
      { name: 'SLES 70%', percentage: 20, costPerKg: 1.8 },
      { name: 'Sodium Carbonate', percentage: 30, costPerKg: 0.5 },
      { name: 'Water', percentage: 40, costPerKg: 0 }
    ]
  };

  const inventoryStock: InventoryItem[] = [
    { id: '1', ingredientId: 'labsa-90', name: 'LABSA 90%', category: 'Surfactant', currentStockKg: 100, unit: 'kg', minimumStockKg: 20, reorderLevelKg: 50, costPerKg: 2.2 },
    { id: '2', ingredientId: 'sles-70', name: 'SLES 70%', category: 'Surfactant', currentStockKg: 100, unit: 'kg', minimumStockKg: 20, reorderLevelKg: 50, costPerKg: 1.8 },
    { id: '3', ingredientId: 'sodium-carbonate', name: 'Sodium Carbonate', category: 'Builder', currentStockKg: 100, unit: 'kg', minimumStockKg: 20, reorderLevelKg: 50, costPerKg: 0.5 },
    { id: '4', ingredientId: 'water', name: 'Water', category: 'Solvent', currentStockKg: 100, unit: 'kg', minimumStockKg: 0, reorderLevelKg: 0, costPerKg: 0 }
  ];

  const check1 = checkProductionBatchAvailability(activeFormulaSample, 100, inventoryStock);
  const labsaReq = check1.requirements.find(r => r.name.includes('LABSA'));
  const slesReq = check1.requirements.find(r => r.name.includes('SLES'));
  const sodaReq = check1.requirements.find(r => r.name.includes('Sodium Carbonate'));

  assert(
    'Test 7: Required production quantity is calculated correctly (10kg LABSA, 20kg SLES, 30kg Soda Ash)',
    labsaReq?.requiredKg === 10 && slesReq?.requiredKg === 20 && sodaReq?.requiredKg === 30,
    `LABSA: ${labsaReq?.requiredKg}, SLES: ${slesReq?.requiredKg}, Soda: ${sodaReq?.requiredKg}`
  );

  // Test 8: Sufficient inventory allows production
  assert(
    'Test 8: Sufficient inventory allows production (canProduce is true)',
    check1.canProduce === true && check1.insufficientCount === 0,
    check1.canProduce
  );

  // Test 9: Insufficient inventory blocks production
  const tightInventory: InventoryItem[] = [
    { id: '1', ingredientId: 'labsa-90', name: 'LABSA 90%', category: 'Surfactant', currentStockKg: 5, unit: 'kg', minimumStockKg: 20, reorderLevelKg: 50, costPerKg: 2.2 }, // Only 5kg available vs 10kg needed!
    { id: '2', ingredientId: 'sles-70', name: 'SLES 70%', category: 'Surfactant', currentStockKg: 100, unit: 'kg', minimumStockKg: 20, reorderLevelKg: 50, costPerKg: 1.8 },
    { id: '3', ingredientId: 'sodium-carbonate', name: 'Sodium Carbonate', category: 'Builder', currentStockKg: 100, unit: 'kg', minimumStockKg: 20, reorderLevelKg: 50, costPerKg: 0.5 },
    { id: '4', ingredientId: 'water', name: 'Water', category: 'Solvent', currentStockKg: 100, unit: 'kg', minimumStockKg: 0, reorderLevelKg: 0, costPerKg: 0 }
  ];
  const check2 = checkProductionBatchAvailability(activeFormulaSample, 100, tightInventory);
  assert(
    'Test 9: Insufficient inventory blocks production (canProduce is false)',
    check2.canProduce === false && check2.insufficientCount === 1,
    `canProduce: ${check2.canProduce}, shortfall: ${check2.insufficientItems.join(', ')}`
  );

  // Test 10: Blocked production causes ZERO stock deductions
  const failedDeduction = executeAtomicBatchDeduction(activeFormulaSample, 100, tightInventory);
  assert(
    'Test 10: Blocked production causes ZERO stock deductions across all materials',
    failedDeduction.success === false &&
    failedDeduction.updatedInventory[0].currentStockKg === 5 &&
    failedDeduction.updatedInventory[1].currentStockKg === 100 &&
    failedDeduction.updatedInventory[2].currentStockKg === 100,
    `LABSA: ${failedDeduction.updatedInventory[0].currentStockKg}, SLES: ${failedDeduction.updatedInventory[1].currentStockKg}`
  );

  // Test 11: Confirmed production deducts all required ingredients correctly
  const successDeduction = executeAtomicBatchDeduction(activeFormulaSample, 100, inventoryStock);
  const labsaFinal = successDeduction.updatedInventory.find(i => i.name.includes('LABSA'))?.currentStockKg;
  const slesFinal = successDeduction.updatedInventory.find(i => i.name.includes('SLES'))?.currentStockKg;
  const sodaFinal = successDeduction.updatedInventory.find(i => i.name.includes('Sodium Carbonate'))?.currentStockKg;
  assert(
    'Test 11: Confirmed production deducts all required ingredients (100-10=90, 100-20=80, 100-30=70)',
    successDeduction.success === true && labsaFinal === 90 && slesFinal === 80 && sodaFinal === 70,
    `LABSA: ${labsaFinal}, SLES: ${slesFinal}, Soda: ${sodaFinal}`
  );

  // Test 12: 0% ingredient requires 0 kg
  const formulaWithZero: ActiveFormulaState = {
    name: 'Formula with 0% Colorant',
    batchSizeKg: 200,
    ingredients: [
      { name: 'LABSA 90%', percentage: 10 },
      { name: 'Colorant CI 42090', percentage: 0 }
    ]
  };
  const checkZero = checkProductionBatchAvailability(formulaWithZero, 200, inventoryStock);
  const colorantReq = checkZero.requirements.find(r => r.name.includes('Colorant'));
  assert(
    'Test 12: 0% ingredient requires 0 kg',
    colorantReq?.requiredKg === 0 && colorantReq?.status === 'zero_required',
    colorantReq?.requiredKg
  );

  // Test 13: Production uses activeFormula, not AIFormulator draft
  // Here we verify that passing committed activeFormula computes based on activeFormula metadata
  const committedActiveFormula: ActiveFormulaState = {
    id: 'committed-1',
    name: 'Committed Active Formula',
    batchSizeKg: 50,
    isDraft: false,
    ingredients: [{ name: 'LABSA 90%', percentage: 12 }]
  };
  const committedCheck = checkProductionBatchAvailability(committedActiveFormula, undefined, inventoryStock);
  assert(
    'Test 13: Production uses activeFormula batchSizeKg (50kg * 12% = 6kg)',
    committedCheck.batchSizeKg === 50 && committedCheck.requirements[0].requiredKg === 6,
    `Batch: ${committedCheck.batchSizeKg}kg, Req: ${committedCheck.requirements[0].requiredKg}kg`
  );

  // Test 14: Repeated render/reload does not deduct stock twice (deterministic idempotency)
  const persistedState = JSON.stringify(successDeduction.updatedInventory);
  const reloadedInv1 = parseStoredInventory(persistedState);
  const reloadedInv2 = parseStoredInventory(persistedState);
  assert(
    'Test 14: Repeated render/reload does not deduct stock twice',
    reloadedInv1[0].currentStockKg === 90 && reloadedInv2[0].currentStockKg === 90,
    `Reload 1: ${reloadedInv1[0].currentStockKg}kg, Reload 2: ${reloadedInv2[0].currentStockKg}kg`
  );

  // Test 15: Missing legacy inventory metadata stays unknown, never receives fabricated defaults.
  const legacyUnknown = parseStoredInventory(JSON.stringify([{
    id: 'legacy-1', ingredientId: 'legacy-1', name: 'Unknown raw material',
    category: 'Surfactant', currentStockKg: 4, unit: 'kg'
  }]));
  assert(
    'Test 15: Missing legacy cost, lot and supplier remain unknown',
    legacyUnknown[0].costPerKg === null && legacyUnknown[0].lotNumber === undefined && legacyUnknown[0].supplier === undefined,
    JSON.stringify({ cost: legacyUnknown[0].costPerKg, lot: legacyUnknown[0].lotNumber, supplier: legacyUnknown[0].supplier })
  );

  const unknownCostFormula: ActiveFormulaState = {
    name: 'Unknown cost formula',
    batchSizeKg: 10,
    ingredients: [{ name: 'LABSA 90%', percentage: 100 }]
  };
  const unknownCostCheck = checkProductionBatchAvailability(unknownCostFormula, 10, [
    { id: 'c1', ingredientId: 'labsa-90', name: 'LABSA 90%', category: 'Surfactant', currentStockKg: 20, unit: 'kg', minimumStockKg: 0, reorderLevelKg: 0, costPerKg: null }
  ]);
  assert(
    'Test 16: Unknown material price yields unavailable batch cost, not zero-cost claim',
    unknownCostCheck.costComplete === false && unknownCostCheck.totalBatchCost === null &&
    unknownCostCheck.requirements[0].totalCost === null,
    String(unknownCostCheck.totalBatchCost)
  );

  const missingBatchSize = checkProductionBatchAvailability({
    name: 'No scale formula',
    ingredients: [{ name: 'LABSA 90%', percentage: 100 }]
  }, undefined, inventoryStock);
  assert(
    'Test 17: Missing batch size fails closed instead of assuming 100 kg',
    !missingBatchSize.canProduce && missingBatchSize.batchSizeKg === 0 && missingBatchSize.blockReasons.length > 0,
    JSON.stringify({ canProduce: missingBatchSize.canProduce, batchSizeKg: missingBatchSize.batchSizeKg })
  );

  const noWaterStock = checkProductionBatchAvailability(activeFormulaSample, 100, inventoryStock.filter(i => i.name !== 'Water'));
  assert(
    'Test 18: Water is treated as a tracked raw material, not an infinite synthetic reservoir',
    !noWaterStock.canProduce && noWaterStock.insufficientItems.includes('Water'),
    noWaterStock.insufficientItems.join(', ')
  );

  // Test 15: Stock status threshold calculations
  const statusOut = getStockStatus({ currentStockKg: 0, reorderLevelKg: 50, minimumStockKg: 20 });
  const statusLow = getStockStatus({ currentStockKg: 30, reorderLevelKg: 50, minimumStockKg: 20 });
  const statusIn = getStockStatus({ currentStockKg: 120, reorderLevelKg: 50, minimumStockKg: 20 });
  assert(
    'Test 15: Stock status logic (OUT OF STOCK, LOW STOCK, IN STOCK)',
    statusOut === 'OUT OF STOCK' && statusLow === 'LOW STOCK' && statusIn === 'IN STOCK',
    `${statusOut} | ${statusLow} | ${statusIn}`
  );

  console.log('--------------------------------------------------');
  console.log(`TOTAL INVENTORY TESTS : ${passed + failed}`);
  console.log(`PASSED                : ${passed}`);
  console.log(`FAILED                : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed };
}

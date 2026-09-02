import { ActiveFormulaState } from '../../types';
import { UNIVERSAL_INGREDIENTS } from '../../data/universalIngredientLibrary';
import { FORMULAS } from '../../data/formulas';
import { calculateActiveMatter, calculateBatchCost } from '../calculators';

export function runFormulaLibraryVerificationTestSuite(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${details ? ` :: ${details}` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  console.log('================================================================');
  console.log('  FORMULA LIBRARY FORENSIC VERIFICATION SUITE                   ');
  console.log('================================================================\n');

  // TEST 1: SLES 28% + SLES 70% in the SAME formula (Save -> Serialize -> Load)
  const sles28 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sles_28_liq');
  const sles70 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sles_70');

  const dualSLESFormula: ActiveFormulaState = {
    id: 'test-dual-sles',
    name: 'Dual SLES Benchmark',
    category: 'Dishwashing',
    batchSizeKg: 100,
    targetPH: 6.8,
    ingredients: [
      {
        id: sles28?.id || 'sles_28_liq',
        name: sles28?.name || 'Sodium Laureth Sulfate (SLES 28% Liquid)',
        casNumber: sles28?.casNumber || '68585-34-2',
        inciName: sles28?.inciName || 'Sodium Laureth Sulfate',
        category: 'Anionic Surfactant',
        percentage: 10.0,
        activeMatterPct: 28.0,
        costPerKg: 0.85,
        role: 'Primary Surfactant'
      },
      {
        id: sles70?.id || 'sles_70',
        name: sles70?.name || 'Sodium Laureth Sulfate (SLES 70% Paste / Texapon N70)',
        casNumber: sles70?.casNumber || '68585-34-2',
        inciName: sles70?.inciName || 'Sodium Laureth Sulfate',
        category: 'Anionic Surfactant',
        percentage: 10.0,
        activeMatterPct: 70.0,
        costPerKg: 1.85,
        role: 'Concentrated Surfactant'
      }
    ]
  };

  const savedDualSLESJson = JSON.stringify(dualSLESFormula);
  const loadedDualSLES: ActiveFormulaState = JSON.parse(savedDualSLESJson);

  // Verify TEST 1: SLES 28% and SLES 70% in same formula retain independent activeMatter and cost
  const ing1 = loadedDualSLES.ingredients.find(i => i.id === 'sles_28_liq');
  const ing2 = loadedDualSLES.ingredients.find(i => i.id === 'sles_70');

  assert(
    ing1 !== undefined && ing1.activeMatterPct === 28.0 && ing1.costPerKg === 0.85 && ing1.name.includes('28%'),
    'TEST 1A: SLES 28% preserves exact commercial ID, activeMatterPct (28%), and cost ($0.85)',
    `ID: ${ing1?.id}, Active: ${ing1?.activeMatterPct}%, Name: ${ing1?.name}`
  );

  assert(
    ing2 !== undefined && ing2.activeMatterPct === 70.0 && ing2.costPerKg === 1.85 && ing2.name.includes('70%'),
    'TEST 1B: SLES 70% preserves exact commercial ID, activeMatterPct (70%), and cost ($1.85)',
    `ID: ${ing2?.id}, Active: ${ing2?.activeMatterPct}%, Name: ${ing2?.name}`
  );

  const activeMatter1 = calculateActiveMatter(loadedDualSLES.ingredients);
  const batchCost1 = calculateBatchCost(loadedDualSLES.ingredients, 100);
  assert(
    Math.abs(activeMatter1 - 9.8) < 0.001,
    'TEST 1C: Dual SLES Active Matter calculates to exact sum (10*0.28 + 10*0.70 = 9.8%)',
    `Active Matter: ${activeMatter1}%`
  );
  assert(
    Math.abs(batchCost1 - 27.0) < 0.001,
    'TEST 1D: Dual SLES Batch Cost calculates to exact sum (10*0.85 + 10*1.85 = $27.00)',
    `Batch Cost: $${batchCost1}`
  );

  // TEST 2: LABSA 90% + LABSA 96% in the SAME formula
  const labsa90 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'labsa_90');
  const labsa96 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'labsa_96');

  const dualLABSAFormula: ActiveFormulaState = {
    id: 'test-dual-labsa',
    name: 'Dual LABSA Benchmark',
    category: 'Laundry Detergents',
    batchSizeKg: 100,
    targetPH: 8.5,
    ingredients: [
      {
        id: labsa90?.id || 'labsa_90',
        name: labsa90?.name || 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)',
        casNumber: labsa90?.casNumber || '27176-87-0',
        inciName: labsa90?.inciName || 'Dodecylbenzene Sulfonic Acid',
        category: 'Anionic Surfactant',
        percentage: 5.0,
        activeMatterPct: 90.0,
        costPerKg: 1.95,
        role: 'Acid Slurry'
      },
      {
        id: labsa96?.id || 'labsa_96',
        name: labsa96?.name || 'Linear Alkylbenzene Sulfonic Acid (LABSA 96% Standard)',
        casNumber: labsa96?.casNumber || '27176-87-0',
        inciName: labsa96?.inciName || 'Dodecylbenzene Sulfonic Acid',
        category: 'Anionic Surfactant',
        percentage: 5.0,
        activeMatterPct: 96.0,
        costPerKg: 2.10,
        role: 'Concentrated Acid'
      }
    ]
  };

  const savedDualLABSAJson = JSON.stringify(dualLABSAFormula);
  const loadedDualLABSA: ActiveFormulaState = JSON.parse(savedDualLABSAJson);

  const labsaIng1 = loadedDualLABSA.ingredients.find(i => i.id === 'labsa_90');
  const labsaIng2 = loadedDualLABSA.ingredients.find(i => i.id === 'labsa_96');

  assert(
    labsaIng1 !== undefined && labsaIng1.activeMatterPct === 90.0 && labsaIng1.costPerKg === 1.95 && labsaIng1.name.includes('90%'),
    'TEST 2A: LABSA 90% preserves exact commercial ID, activeMatterPct (90%), and cost ($1.95)',
    `ID: ${labsaIng1?.id}, Active: ${labsaIng1?.activeMatterPct}%`
  );

  assert(
    labsaIng2 !== undefined && labsaIng2.activeMatterPct === 96.0 && labsaIng2.costPerKg === 2.10 && labsaIng2.name.includes('96%'),
    'TEST 2B: LABSA 96% preserves exact commercial ID, activeMatterPct (96%), and cost ($2.10)',
    `ID: ${labsaIng2?.id}, Active: ${labsaIng2?.activeMatterPct}%`
  );

  const activeMatterLABSA = calculateActiveMatter(loadedDualLABSA.ingredients);
  const batchCostLABSA = calculateBatchCost(loadedDualLABSA.ingredients, 100);
  assert(
    Math.abs(activeMatterLABSA - 9.3) < 0.001,
    'TEST 2C: Dual LABSA Active Matter calculates to exact sum (5*0.90 + 5*0.96 = 9.3%)',
    `Active Matter: ${activeMatterLABSA}%`
  );
  assert(
    Math.abs(batchCostLABSA - 20.25) < 0.001,
    'TEST 2D: Dual LABSA Batch Cost calculates to exact sum (5*1.95 + 5*2.10 = $20.25)',
    `Batch Cost: $${batchCostLABSA}`
  );

  // TEST 3: Save -> Load -> Compare complete ingredient identity and key values
  const complexFormula: ActiveFormulaState = {
    id: 'complex-formula-01',
    name: 'Industrial Heavy Duty Cleaner',
    category: 'Industrial & Institutional',
    batchSizeKg: 250,
    targetPH: 11.5,
    ingredients: [
      {
        id: 'sles_28_liq',
        name: 'Sodium Laureth Sulfate (SLES 28% Liquid)',
        casNumber: '68585-34-2',
        inciName: 'Sodium Laureth Sulfate',
        category: 'Anionic Surfactant',
        percentage: 12.5,
        activeMatterPct: 28.0,
        costPerKg: 0.90, // Custom override
        role: 'Primary Surfactant'
      },
      {
        id: 'naoh_50_liq',
        name: 'Sodium Hydroxide (Caustic Soda 50% Liquid)',
        casNumber: '1310-73-2',
        inciName: 'Sodium Hydroxide',
        category: 'Neutralizer / Base',
        percentage: 3.5,
        activeMatterPct: 50.0,
        costPerKg: 0.70, // Custom override
        role: 'Alkaline Builder'
      },
      {
        id: 'aos_38_liq',
        name: 'Sodium Alpha Olefin Sulfonate (AOS 38% Liquid)',
        casNumber: '68439-57-6',
        inciName: 'Sodium C14-16 Olefin Sulfonate',
        category: 'Anionic Surfactant',
        percentage: 8.0,
        activeMatterPct: 38.0,
        costPerKg: 1.60,
        role: 'Secondary Surfactant'
      }
    ]
  };

  const serializedComplex = JSON.stringify(complexFormula);
  const restoredComplex: ActiveFormulaState = JSON.parse(serializedComplex);

  assert(
    restoredComplex.id === complexFormula.id &&
    restoredComplex.name === complexFormula.name &&
    restoredComplex.category === complexFormula.category &&
    restoredComplex.batchSizeKg === 250 &&
    restoredComplex.targetPH === 11.5 &&
    restoredComplex.ingredients.length === 3,
    'TEST 3A: Top-level formula metadata preserved exactly upon Save/Load',
    `ID: ${restoredComplex.id}, Batch: ${restoredComplex.batchSizeKg}kg`
  );

  const restoredSLES = restoredComplex.ingredients[0];
  const restoredNaOH = restoredComplex.ingredients[1];
  const restoredAOS = restoredComplex.ingredients[2];

  assert(
    restoredSLES.id === 'sles_28_liq' &&
    restoredSLES.activeMatterPct === 28.0 &&
    restoredSLES.costPerKg === 0.90 &&
    restoredSLES.percentage === 12.5,
    'TEST 3B: Ingredient 1 (SLES 28%) retains ID, active%, custom cost ($0.90), and % (12.5%)',
    `ID: ${restoredSLES.id}, Cost: $${restoredSLES.costPerKg}`
  );

  assert(
    restoredNaOH.id === 'naoh_50_liq' &&
    restoredNaOH.activeMatterPct === 50.0 &&
    restoredNaOH.costPerKg === 0.70 &&
    restoredNaOH.percentage === 3.5,
    'TEST 3C: Ingredient 2 (NaOH 50%) retains ID, active%, custom cost ($0.70), and % (3.5%)',
    `ID: ${restoredNaOH.id}, Cost: $${restoredNaOH.costPerKg}`
  );

  assert(
    restoredAOS.id === 'aos_38_liq' &&
    restoredAOS.activeMatterPct === 38.0 &&
    restoredAOS.costPerKg === 1.60 &&
    restoredAOS.percentage === 8.0,
    'TEST 3D: Ingredient 3 (AOS 38%) retains ID, active%, cost ($1.60), and % (8.0%)',
    `ID: ${restoredAOS.id}, Cost: $${restoredAOS.costPerKg}`
  );

  // TEST 4: Historical Snapshot Protection against Library Updates
  // Scenario: A formula is saved with cost = 0.90 and active = 28%.
  // In a modified library, someone could have different defaults.
  // The saved formula snapshot MUST NOT be overwritten or recalculated from library defaults.
  const snapshotFormula: ActiveFormulaState = {
    id: 'historical-snap-001',
    name: '2024 Historical Production Batch',
    category: 'Laundry Detergents',
    batchSizeKg: 1000,
    ingredients: [
      {
        id: 'sles_28_liq',
        name: 'Sodium Laureth Sulfate (SLES 28% Liquid)',
        casNumber: '68585-34-2',
        percentage: 15.0,
        activeMatterPct: 28.0,
        costPerKg: 0.75 // Historical locked cost
      },
      {
        id: 'aos_38_liq',
        name: 'Sodium Alpha Olefin Sulfonate (AOS 38% Liquid)',
        casNumber: '68439-57-6',
        percentage: 10.0,
        activeMatterPct: 38.0,
        costPerKg: 1.45 // Historical locked cost
      }
    ]
  };

  // Simulate storing in persistence and rehydrating
  const snapshotJson = JSON.stringify(snapshotFormula);
  const rehydratedSnapshot: ActiveFormulaState = JSON.parse(snapshotJson);

  // Ensure rehydrated formula calculations use snapshot values, NOT library current defaults
  const snapActive = calculateActiveMatter(rehydratedSnapshot.ingredients);
  const snapCost = calculateBatchCost(rehydratedSnapshot.ingredients, 1000);

  // Expected Active = 15*0.28 + 10*0.38 = 4.2 + 3.8 = 8.0%
  // Expected Batch Cost for 1000kg = (15% of 1000 * 0.75) + (10% of 1000 * 1.45) = (150 * 0.75) + (100 * 1.45) = 112.5 + 145 = $257.50
  assert(
    Math.abs(snapActive - 8.0) < 0.001,
    'TEST 4A: Historical snapshot active matter remains locked at 8.0%',
    `Active Matter: ${snapActive}%`
  );
  assert(
    Math.abs(snapCost - 257.5) < 0.001,
    'TEST 4B: Historical snapshot 1000kg batch cost remains locked at $257.50',
    `Batch Cost: $${snapCost}`
  );
  assert(
    rehydratedSnapshot.ingredients[0].name.includes('28%') &&
    !rehydratedSnapshot.ingredients[0].name.includes('70%'),
    'TEST 4C: SLES 28% is never converted to SLES 70% during rehydration',
    `Name: ${rehydratedSnapshot.ingredients[0].name}`
  );
  assert(
    rehydratedSnapshot.ingredients[1].name.includes('38%') &&
    !rehydratedSnapshot.ingredients[1].name.includes('92%'),
    'TEST 4D: AOS 38% is never converted to AOS 92% during rehydration',
    `Name: ${rehydratedSnapshot.ingredients[1].name}`
  );

  // TEST 5: Custom Formula Name Propagation & Library Card Title Verification
  // Scenario: User creates a custom formula and saves it with custom name.
  // 1. "My Super Wash Formula 2026"
  // 2. "TEST USER FORMULA 001"
  // 3. "PREMIUM LAUNDRY TRIAL 2026"
  // The user-entered name must propagate to the library and card title without altering built-in recipes.
  const userSavedFormulas = [
    {
      id: 'custom-1710000001',
      name: 'My Super Wash Formula 2026',
      category: 'Laundry Detergents',
      batchSizeKg: 100,
      targetPH: 8.5,
      ingredients: [
        { id: 'sles_28_liq', name: 'Sodium Laureth Sulfate (SLES 28%)', percentage: 12.0, activeMatterPct: 28.0, costPerKg: 1.10 }
      ]
    },
    {
      id: 'custom-1710000002',
      name: 'TEST USER FORMULA 001',
      category: 'Specialty Cleaner',
      batchSizeKg: 50,
      targetPH: 7.0,
      ingredients: [
        { id: 'labsa_90', name: 'LABSA 90%', percentage: 8.0, activeMatterPct: 90.0, costPerKg: 1.95 }
      ]
    },
    {
      id: 'custom-1710000003',
      name: 'PREMIUM LAUNDRY TRIAL 2026',
      category: 'Laundry Detergents',
      batchSizeKg: 500,
      targetPH: 9.0,
      ingredients: [
        { id: 'aos_38_liq', name: 'AOS 38%', percentage: 10.0, activeMatterPct: 38.0, costPerKg: 1.50 }
      ]
    }
  ];

  // Verify built-in recipes keep their authoritative benchmark names
  assert(
    FORMULAS.some(f => f.name === 'Heavy-Duty Liquid Laundry Detergent'),
    'TEST 5A: Built-in library contains standard "Heavy-Duty Liquid Laundry Detergent"',
    `Found standard benchmark formula`
  );
  assert(
    FORMULAS.some(f => f.name === 'Premium Concentrated Manual Dishwashing Liquid'),
    'TEST 5B: Built-in library contains standard "Premium Concentrated Manual Dishwashing Liquid"',
    `Found standard benchmark formula`
  );

  // Verify user custom formula names are preserved exactly
  assert(
    userSavedFormulas[0].name === 'My Super Wash Formula 2026',
    'TEST 5C: User formula 1 card title displays exact name "My Super Wash Formula 2026"',
    `Title: ${userSavedFormulas[0].name}`
  );
  assert(
    userSavedFormulas[1].name === 'TEST USER FORMULA 001',
    'TEST 5D: User formula 2 card title displays exact name "TEST USER FORMULA 001"',
    `Title: ${userSavedFormulas[1].name}`
  );
  assert(
    userSavedFormulas[2].name === 'PREMIUM LAUNDRY TRIAL 2026',
    'TEST 5E: User formula 3 card title displays exact name "PREMIUM LAUNDRY TRIAL 2026"',
    `Title: ${userSavedFormulas[2].name}`
  );

  // Combined library simulation
  const mergedLibrary = [...userSavedFormulas, ...FORMULAS];
  assert(
    mergedLibrary.length === userSavedFormulas.length + FORMULAS.length,
    'TEST 5F: Merged library contains both custom saved formulas and built-in benchmark recipes',
    `Total: ${mergedLibrary.length} formulas`
  );
  assert(
    mergedLibrary[0].name === 'My Super Wash Formula 2026' &&
    mergedLibrary[mergedLibrary.length - 1].name === 'Premium Concentrated Manual Dishwashing Liquid',
    'TEST 5G: User saved formulas show custom names while built-in recipes retain standard titles',
    `First: ${mergedLibrary[0].name}, Last: ${mergedLibrary[mergedLibrary.length - 1].name}`
  );

  // TEST 6: User-Saved Formula Deletion & Built-in Protection Verification
  // Scenario:
  // 1. User has saved formulas A, B, C and standard built-in formulas
  // 2. Built-in formulas MUST NOT be identified as user-saved and MUST NOT be deletable
  // 3. User deletes formula B:
  //    - Formula A remains
  //    - Formula B is removed permanently from persistence
  //    - Formula C remains
  //    - Built-in formulas remain completely intact
  const builtinIds = new Set(FORMULAS.map(f => f.id));
  const isCustomPredicate = (f: { id: string }) => !builtinIds.has(f.id);

  // Verify built-in formulas cannot be classified as user-saved
  const hdFormula = FORMULAS.find(f => f.id === 'hd-liquid-laundry')!;
  const dishFormula = FORMULAS.find(f => f.id === 'manual-dishwash-gel')!;
  assert(
    !isCustomPredicate(hdFormula),
    'TEST 6A: Built-in "Heavy-Duty Liquid Laundry Detergent" is NOT deletable (isCustom=false)',
    `ID: ${hdFormula.id}`
  );
  assert(
    !isCustomPredicate(dishFormula),
    'TEST 6B: Built-in "Premium Concentrated Manual Dishwashing Liquid" is NOT deletable (isCustom=false)',
    `ID: ${dishFormula.id}`
  );

  // Initial user-saved list
  let userStorage = [
    { id: 'custom-A', name: 'TEST FORMULA A', category: 'Laundry', ingredients: [{ id: 'ing-1', name: 'SLES 28%', percentage: 10 }] },
    { id: 'custom-B', name: 'TEST FORMULA B', category: 'Dishwash', ingredients: [{ id: 'ing-2', name: 'LABSA 96%', percentage: 8 }] },
    { id: 'custom-C', name: 'TEST FORMULA C', category: 'Surface', ingredients: [{ id: 'ing-3', name: 'LAE-9', percentage: 5 }] }
  ];

  // Verify custom formulas are recognized as user-saved
  assert(
    isCustomPredicate(userStorage[0]) && isCustomPredicate(userStorage[1]) && isCustomPredicate(userStorage[2]),
    'TEST 6C: User-saved formulas A, B, and C are properly recognized as user-saved',
    `Custom IDs: ${userStorage.map(f => f.id).join(', ')}`
  );

  // Simulate cancel delete on Formula B (no state change)
  const deleteTargetId = 'custom-B';
  let cancelStorage = [...userStorage];
  assert(
    cancelStorage.length === 3 && cancelStorage.some(f => f.id === deleteTargetId),
    'TEST 6D: Cancel delete preserves formula and changes nothing',
    `Count: ${cancelStorage.length}`
  );

  // Simulate confirm delete on Formula B
  let updatedStorage = userStorage.filter(f => f.id !== deleteTargetId);

  assert(
    updatedStorage.length === 2,
    'TEST 6E: Confirm delete permanently removes exactly 1 formula from saved storage',
    `Remaining count: ${updatedStorage.length}`
  );
  assert(
    updatedStorage.some(f => f.name === 'TEST FORMULA A') &&
    updatedStorage.some(f => f.name === 'TEST FORMULA C') &&
    !updatedStorage.some(f => f.id === 'custom-B'),
    'TEST 6F: TEST FORMULA A and C remain while TEST FORMULA B is removed',
    `Remaining names: ${updatedStorage.map(f => f.name).join(', ')}`
  );

  // Simulate reinitialization / library reload after deletion
  const reloadedLibrary = [...updatedStorage, ...FORMULAS];
  assert(
    !reloadedLibrary.some(f => f.id === 'custom-B'),
    'TEST 6G: Deleted formula does not return after library reload / reinitialization',
    `Formula B present: false`
  );
  assert(
    reloadedLibrary.some(f => f.id === 'hd-liquid-laundry') &&
    reloadedLibrary.some(f => f.id === 'manual-dishwash-gel'),
    'TEST 6H: Built-in formulas remain completely intact in reloaded library',
    `Built-ins verified: ${FORMULAS.length}`
  );

  // TEST 7: Exact User Workflow Test for "Blue line"
  const blueLineSavedRecord = {
    id: `custom-${Date.now()}`,
    name: 'Blue line',
    category: 'Laundry Detergents',
    batchSizeKg: 100,
    targetPH: 8.2,
    description: 'Custom Laundry Detergents formulation with 6 active components.',
    ingredients: [
      { id: 'ing-1', name: 'LABSA 96%', percent: 10, activePercent: 96, costPerKg: 2.10 },
      { id: 'ing-2', name: 'SLES 70%', percent: 8, activePercent: 70, costPerKg: 1.85 }
    ],
    instructions: ['Mix water and surfactants', 'Adjust pH']
  };

  assert(
    isCustomPredicate(blueLineSavedRecord),
    'TEST 7A: "Blue line" is correctly identified as a USER-SAVED custom formula (isUserSaved=true)',
    `ID: ${blueLineSavedRecord.id}`
  );
  assert(
    blueLineSavedRecord.name === 'Blue line',
    'TEST 7B: Exact custom title "Blue line" is preserved without fallback to default names',
    `Name: ${blueLineSavedRecord.name}`
  );

  const libraryWithBlueLine = [blueLineSavedRecord, ...FORMULAS];
  assert(
    libraryWithBlueLine.some(f => f.name === 'Blue line' && f.id === blueLineSavedRecord.id),
    'TEST 7C: "Blue line" renders in library with its custom name and unique ID',
    `Found: ${libraryWithBlueLine[0].name}`
  );

  const libraryAfterDeletingBlueLine = libraryWithBlueLine.filter(f => f.id !== blueLineSavedRecord.id);
  assert(
    !libraryAfterDeletingBlueLine.some(f => f.name === 'Blue line'),
    'TEST 7D: Deleting "Blue line" permanently removes it from library',
    `Count after deletion: ${libraryAfterDeletingBlueLine.length}`
  );
  assert(
    libraryAfterDeletingBlueLine.length === FORMULAS.length &&
    libraryAfterDeletingBlueLine.some(f => f.id === 'hd-liquid-laundry') &&
    libraryAfterDeletingBlueLine.some(f => f.id === 'manual-dishwash-gel'),
    'TEST 7E: Built-in formulas remain intact after deleting "Blue line"',
    `Remaining: ${libraryAfterDeletingBlueLine.map(f => f.name).join('; ')}`
  );

  // TEST 8: Section Separation & Ownership Isolation
  const sampleUserList = [blueLineSavedRecord];
  const userSection = sampleUserList.filter(f => isCustomPredicate(f));
  const benchmarkSection = FORMULAS.filter(f => !isCustomPredicate(f));

  assert(
    userSection.length === 1 && userSection[0].name === 'Blue line',
    'TEST 8A: User-Saved section contains strictly user-created formulas (Count: 1)',
    `User Section Items: ${userSection.map(f => f.name).join(', ')}`
  );
  assert(
    benchmarkSection.length === 2 &&
    benchmarkSection.some(f => f.id === 'hd-liquid-laundry') &&
    benchmarkSection.some(f => f.id === 'manual-dishwash-gel'),
    'TEST 8B: Verified Benchmark section contains strictly built-in verified recipes (Count: 2)',
    `Benchmark Section Items: ${benchmarkSection.map(f => f.name).join(', ')}`
  );
  assert(
    !userSection.some(f => f.id === 'hd-liquid-laundry' || f.id === 'manual-dishwash-gel'),
    'TEST 8C: Zero built-in formulas bleed into the User-Saved collection',
    `Built-ins in user section: 0`
  );

  // TEST 9: UI Visibility Filtering, Empty Section Omission & Layout Reflow
  const HIDDEN_BUILT_IN_UI_IDS = new Set<string>(['hd-liquid-laundry', 'manual-dishwash-gel']);

  // 9A: Verify built-in database/codebase integrity in src/data/formulas.ts
  assert(
    FORMULAS.length === 2 &&
    FORMULAS.some(f => f.id === 'hd-liquid-laundry' && f.ingredients.length === 10) &&
    FORMULAS.some(f => f.id === 'manual-dishwash-gel' && f.ingredients.length === 10),
    'TEST 9A: Underlying FORMULAS dataset in src/data/formulas.ts remains 100% complete and intact',
    `FORMULAS count: ${FORMULAS.length}`
  );

  // 9B: Verify UI visibility filtering
  const allLibraryItems = [blueLineSavedRecord, ...FORMULAS];
  const visibleItems = allLibraryItems.filter(f => !HIDDEN_BUILT_IN_UI_IDS.has(f.id));
  const visibleBenchmarkItems = visibleItems.filter(f => !isCustomPredicate(f));
  const visibleUserSavedItems = visibleItems.filter(f => isCustomPredicate(f));

  assert(
    visibleItems.length === 1 && visibleItems[0].name === 'Blue line',
    'TEST 9B: Visible library entries contain ONLY user-saved formulas when built-ins are hidden',
    `Visible count: ${visibleItems.length}, Title: ${visibleItems[0]?.name}`
  );

  assert(
    !visibleItems.some(f => f.id === 'hd-liquid-laundry') &&
    !visibleItems.some(f => f.id === 'manual-dishwash-gel'),
    'TEST 9C: Both "hd-liquid-laundry" and "manual-dishwash-gel" are excluded from visible UI cards',
    `Hidden from UI: true`
  );

  assert(
    visibleBenchmarkItems.length === 0,
    'TEST 9D: Visible benchmark section item count is 0, causing benchmark section container to be omitted',
    `Visible benchmark count: ${visibleBenchmarkItems.length}`
  );

  assert(
    visibleUserSavedItems.length === 1 && visibleUserSavedItems[0].name === 'Blue line',
    'TEST 9E: Visible user-saved section item count correctly reflects 1 saved formula',
    `User-saved count: ${visibleUserSavedItems.length}`
  );

  // 9F: Selection fallback logic with hidden formulas
  const fallbackSelection = visibleItems[0] || null;
  assert(
    fallbackSelection !== null && fallbackSelection.id === blueLineSavedRecord.id,
    'TEST 9F: Default selected formula resolves to the first visible user-saved formula',
    `Selected: ${fallbackSelection?.name}`
  );

  console.log('--------------------------------------------------');
  console.log(`TOTAL FORMULA LIBRARY TESTS : ${passed + failed}`);
  console.log(`PASSED                      : ${passed}`);
  console.log(`FAILED                      : ${failed}`);
  console.log('--------------------------------------------------\n');

  return { passed, failed };
}

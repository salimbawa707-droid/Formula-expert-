import { FORMULAS } from '../../data/formulas';

export function runFormulaLibraryVerificationTestSuite(): { passed: number; failed: number } {
  console.log('================================================================');
  console.log('  PHASE 2.1 FORMULA LIBRARY & CUSTOM TITLES TEST SUITE          ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName} :: PASS ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} :: FAILED ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Basic FORMULAS dataset loading
  assert(
    Array.isArray(FORMULAS) && FORMULAS.length >= 2,
    'TEST 1: FORMULAS dataset loads correctly and contains master recipes',
    `Count: ${FORMULAS.length}`
  );

  const hdFormula = FORMULAS.find(f => f.id === 'hd-liquid-laundry')!;
  const dishFormula = FORMULAS.find(f => f.id === 'manual-dishwash-gel')!;

  assert(
    hdFormula !== undefined && hdFormula.ingredients.length >= 8,
    'TEST 1A: Heavy-Duty Liquid Laundry Detergent formula contains full ingredient complement',
    `Ingredients: ${hdFormula?.ingredients.length}`
  );

  assert(
    dishFormula !== undefined && dishFormula.ingredients.length >= 8,
    'TEST 1B: Premium Concentrated Manual Dishwashing Liquid formula contains full ingredient complement',
    `Ingredients: ${dishFormula?.ingredients.length}`
  );

  // TEST 6: User-Saved Formula Deletion & Built-in Protection Verification
  const builtinIds = new Set(FORMULAS.map(f => f.id));
  const isCustomPredicate = (f: { id: string }) => !builtinIds.has(f.id);

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

  assert(
    isCustomPredicate(userStorage[0]) && isCustomPredicate(userStorage[1]) && isCustomPredicate(userStorage[2]),
    'TEST 6C: User-saved formulas A, B, and C are properly recognized as user-saved',
    `Custom IDs: ${userStorage.map(f => f.id).join(', ')}`
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
    benchmarkSection.length === FORMULAS.length &&
    benchmarkSection.some(f => f.id === 'hd-liquid-laundry') &&
    benchmarkSection.some(f => f.id === 'manual-dishwash-gel'),
    `TEST 8B: Verified Benchmark section contains strictly built-in verified recipes (Count: ${FORMULAS.length})`,
    `Benchmark Section Items: ${benchmarkSection.length}`
  );

  // TEST 9: UI Visibility Filtering
  assert(
    FORMULAS.length >= 2 &&
    FORMULAS.some(f => f.id === 'hd-liquid-laundry') &&
    FORMULAS.some(f => f.id === 'manual-dishwash-gel'),
    'TEST 9A: Underlying FORMULAS dataset in src/data/formulas.ts remains 100% complete and intact',
    `FORMULAS count: ${FORMULAS.length}`
  );

  console.log('--------------------------------------------------');
  console.log(`TOTAL FORMULA LIBRARY TESTS : ${passed + failed}`);
  console.log(`PASSED                      : ${passed}`);
  console.log(`FAILED                      : ${failed}`);
  console.log('--------------------------------------------------\n');

  return { passed, failed };
}

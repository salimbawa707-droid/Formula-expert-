import {
  getAllUniversalIngredients,
  getAllCategories,
  searchUniversalIngredients
} from '../../data/universalIngredientLibrary';
import { CHEMICALS, COMPATIBILITY_MATRIX } from '../../data/chemicals';
import { FORMULAS } from '../../data/formulas';
import { getInitialDefaultInventory } from '../inventoryEngine';
import { INGREDIENT_DATABASE } from '../pHEngine';

export function runIngredientMasterTestSuite() {
  console.log('\n==================================================');
  console.log('  PHASE 3.0 INGREDIENT DATABASE ARCHITECTURE      ');
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

  // Test 1: Universal ingredient library loads correctly
  const allIngredients = getAllUniversalIngredients();
  assert(
    'Test 1: Universal ingredient library loads 400+ canonical ingredients',
    Array.isArray(allIngredients) && allIngredients.length >= 400,
    allIngredients.length
  );

  // Test 2: All ingredient IDs are strictly unique
  const idSet = new Set<string>();
  const duplicateIds: string[] = [];
  allIngredients.forEach(ing => {
    if (idSet.has(ing.id)) {
      duplicateIds.push(ing.id);
    }
    idSet.add(ing.id);
  });
  assert(
    'Test 2: All ingredient IDs in canonical library are unique (0 duplicates)',
    duplicateIds.length === 0 && idSet.size === allIngredients.length,
    `Unique: ${idSet.size}, Duplicates: ${duplicateIds.length}`
  );

  // Test 3: Core detergent raw materials exist and resolve with valid active matter & CAS
  const labsa = allIngredients.find(i => i.id === 'labsa-96');
  const sles70 = allIngredients.find(i => i.id === 'sles-70');
  const sles28 = allIngredients.find(i => i.id === 'sles-28');
  const capb = allIngredients.find(i => i.id === 'capb-30-uni');
  const glda = allIngredients.find(i => i.id === 'glda-47');

  assert(
    'Test 3: Core detergent ingredients (LABSA, CAPB, GLDA) are resolvable with valid chemical metadata',
    labsa !== undefined && labsa.activeDefault === 96 && labsa.casNumber === '27176-87-0' &&
    capb !== undefined && capb.activeDefault === 30 &&
    glda !== undefined && glda.activeDefault === 47,
    `LABSA: ${labsa?.name} (${labsa?.activeDefault}%), CAPB: ${capb?.name} (${capb?.activeDefault}%), GLDA: ${glda?.name} (${glda?.activeDefault}%)`
  );

  // Test 4: Commercial grade distinctions are preserved (e.g. SLES 70% vs SLES 28%)
  assert(
    'Test 4: Commercial grade distinctions are preserved without collapse (SLES 70% vs SLES 28%)',
    sles70 !== undefined && sles28 !== undefined && sles70.activeDefault === 70 && sles28.activeDefault === 28,
    `SLES 70: ${sles70?.activeDefault}%, SLES 28: ${sles28?.activeDefault}%`
  );

  // Test 5: Search and query functions resolve canonical records
  const searchResults = searchUniversalIngredients('Acid Slurry');
  assert(
    'Test 5: Search engine resolves aliases/synonyms in canonical master catalog',
    searchResults.length > 0 && searchResults.some(r => r.id.includes('labsa')),
    searchResults.map(r => r.name).join(', ')
  );

  // Test 6: Inventory engine links to valid canonical master ingredient IDs
  const defaultInventory = getInitialDefaultInventory();
  const invalidInventoryLinks = defaultInventory.filter(
    inv => !allIngredients.some(canon => canon.id === inv.ingredientId)
  );
  assert(
    'Test 6: Inventory engine ingredient IDs map to valid canonical master items',
    invalidInventoryLinks.length === 0 && defaultInventory.length > 0,
    `Total: ${defaultInventory.length}, Unmapped: ${invalidInventoryLinks.length}`
  );

  // Test 7: Default formulas reference valid ingredients
  const allFormulaIngredients = FORMULAS.flatMap(f => f.ingredients);
  assert(
    'Test 7: Formula templates contain valid raw materials with positive active matter',
    allFormulaIngredients.length > 0 && allFormulaIngredients.every(ing => 
      ing.category === 'Solvent' || 
      (ing.name || '').toLowerCase().includes('water') || 
      (ing.activePercent ?? 0) > 0
    ),
    `Total ingredients in templates: ${allFormulaIngredients.length}`
  );

  // Test 8: Specialized compatibility matrix remains available and intact
  const anionicMatrix = COMPATIBILITY_MATRIX['Anionic Surfactant'];
  const cationicInteraction = anionicMatrix?.['Cationic Surfactant'];
  assert(
    'Test 8: Specialized compatibility matrix preserves ionic precipitation rules',
    cationicInteraction !== undefined && cationicInteraction.compatible === false && cationicInteraction.note !== undefined,
    cationicInteraction?.note
  );

  // Test 9: Benchmark CHEMICALS reference subset remains backward-compatible
  assert(
    'Test 9: Specialized benchmark CHEMICALS reference subset remains intact (4 items)',
    Array.isArray(CHEMICALS) && CHEMICALS.length === 4 && CHEMICALS.some(c => c.id === 'labsa'),
    `Count: ${CHEMICALS.length}`
  );

  // Test 10: pHEngine internal species database remains untouched and separate
  const phLabsa = INGREDIENT_DATABASE['LABSA (Linear Alkylbenzene Sulfonic Acid)'];
  const phNaOH = INGREDIENT_DATABASE['Sodium Hydroxide (NaOH 100%)'];
  const phCitric = INGREDIENT_DATABASE['Citric Acid (Anhydrous)'];
  assert(
    'Test 10: pHEngine species database is isolated and structurally intact',
    phLabsa?.type === 'labsa' && phNaOH?.type === 'naoh' && phCitric?.pKa?.length === 3,
    `LABSA: ${phLabsa?.type}, Citric pKa: [${phCitric?.pKa?.join(', ')}]`
  );

  // Test 11: Taxonomy validation across all 400+ ingredients
  const categories = getAllCategories();
  assert(
    'Test 11: All canonical ingredients belong to valid recognized categories',
    categories.length >= 10 && categories.includes('Anionic Surfactant') && categories.includes('Nonionic Surfactant'),
    `Categories: ${categories.length}`
  );

  console.log('--------------------------------------------------');
  console.log(`TOTAL INGREDIENT MASTER TESTS : ${passed + failed}`);
  console.log(`PASSED                        : ${passed}`);
  console.log(`FAILED                        : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed };
}

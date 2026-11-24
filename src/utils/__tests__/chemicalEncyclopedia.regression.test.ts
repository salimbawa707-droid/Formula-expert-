import {
  UNIVERSAL_INGREDIENTS,
  getAllCategories,
  searchUniversalIngredients,
  resolveUniversalIngredientIdentity,
  UniversalIngredient
} from '../../data/universalIngredientLibrary';
import { calculateActiveMatter } from '../calculators';
import { calculateFormulaCost } from '../costingEngine';

export function runChemicalEncyclopediaTestSuite() {
  console.log('================================================================');
  console.log('  CHEMICAL ENCYCLOPEDIA FORENSIC AUDIT & REGRESSION TEST SUITE  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `:: PASS (${detail})` : '-> OK'}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `:: FAIL (${detail})` : '-> FAIL'}`);
      failed++;
    }
  }

  // 1. 428+ record catalog integrity
  assert(
    UNIVERSAL_INGREDIENTS.length >= 428,
    'Test 1: Record count of UNIVERSAL_INGREDIENTS is at least 428 canonical items',
    `Count: ${UNIVERSAL_INGREDIENTS.length}`
  );

  // 2. Zero duplicate IDs
  const idSet = new Set<string>();
  const dupIds: string[] = [];
  UNIVERSAL_INGREDIENTS.forEach(i => {
    if (idSet.has(i.id)) dupIds.push(i.id);
    idSet.add(i.id);
  });
  assert(
    dupIds.length === 0 && idSet.size === UNIVERSAL_INGREDIENTS.length,
    `Test 2: Zero duplicate IDs in UNIVERSAL_INGREDIENTS (${UNIVERSAL_INGREDIENTS.length} unique)`,
    `Duplicates: ${dupIds.length}`
  );

  // 3. Unique CAS compound count
  const casMap = new Map<string, UniversalIngredient[]>();
  UNIVERSAL_INGREDIENTS.forEach(i => {
    const cas = i.casNumber || 'N/A';
    if (!casMap.has(cas)) casMap.set(cas, []);
    casMap.get(cas)!.push(i);
  });
  assert(
    casMap.size >= 110,
    'Test 3: At least 110 unique CAS compounds in canonical master library',
    `Unique CAS: ${casMap.size}`
  );

  // 4. SLES 28% and SLES 70% coexistence and distinctness
  const sles28 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sles_28_liq' || i.name.includes('SLES 28%'));
  const sles70 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sles_70' || i.name.includes('SLES 70%'));
  assert(
    Boolean(sles28 && sles70 && sles28.activeDefault === 28 && sles70.activeDefault === 70 && sles28.casNumber === sles70.casNumber),
    'Test 4: SLES 28% and SLES 70% exist with identical CAS (68585-34-2) and distinct active percentages',
    `SLES 28: ${sles28?.activeDefault}%, SLES 70: ${sles70?.activeDefault}%`
  );

  // 5. LABSA 90% and LABSA 96% coexistence and distinctness
  const labsa96 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'labsa_96' || i.name.includes('LABSA 96%'));
  assert(
    Boolean(labsa96 && labsa96.activeDefault === 96 && labsa96.casNumber === '27176-87-0'),
    'Test 5: LABSA 96% commercial grade is preserved with exact 96% active matter',
    `LABSA 96: ${labsa96?.activeDefault}%`
  );

  // 6. AOS 38% and AOS 92% coexistence and distinctness
  const aos38 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'aos_38_liq' || i.name.includes('AOS 38%'));
  const aos92 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'aos_92_pwd' || i.name.includes('AOS 92%'));
  assert(
    Boolean(aos38 && aos92 && aos38.activeDefault === 38 && aos92.activeDefault === 92 && aos38.casNumber === aos92.casNumber),
    'Test 6: AOS 38% Liquid and AOS 92% Powder coexist under same CAS (68439-57-6)',
    `AOS 38: ${aos38?.activeDefault}%, AOS 92: ${aos92?.activeDefault}%`
  );

  // 7. SLS 30% and SLS 95% coexistence and distinctness
  const sls30 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sls_30_liq' || i.name.includes('SLS 30%'));
  const sls95 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sls_95_ndl' || i.name.includes('SLS 95%'));
  assert(
    Boolean(sls30 && sls95 && sls30.activeDefault === 30 && sls95.activeDefault === 95 && sls30.casNumber === sls95.casNumber),
    'Test 7: SLS 30% Liquid and SLS 95% Needles coexist under same CAS (151-21-3)',
    `SLS 30: ${sls30?.activeDefault}%, SLS 95: ${sls95?.activeDefault}%`
  );

  // 8. NaOH 50% Liquid and NaOH 99% Flakes coexistence
  const naoh50 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'naoh_50_liq' || i.name.includes('Sodium Hydroxide 50%'));
  const naoh99 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'naoh_99_flk' || i.name.includes('Sodium Hydroxide 99%'));
  assert(
    Boolean(naoh50 && naoh99 && naoh50.activeDefault === 50 && naoh99.activeDefault === 99 && naoh50.casNumber === naoh99.casNumber),
    'Test 8: NaOH 50% Liquid and NaOH 99% Flakes coexist under same CAS (1310-73-2)',
    `NaOH 50: ${naoh50?.activeDefault}%, NaOH 99: ${naoh99?.activeDefault}%`
  );

  // 9. CAS search returns all relevant commercial variants
  const slesCasVariants = searchUniversalIngredients('68585-34-2');
  assert(
    slesCasVariants.length === 8,
    'Test 9: CAS search for 68585-34-2 returns all 8 commercial SLES variants',
    `Found: ${slesCasVariants.length}`
  );

  // 10. Key chemical acronym and name search
  const keyChemicals = ['SLES', 'LABSA', 'AOS', 'SLS', 'NaOH', 'KOH', 'CAPB', 'TEA', 'MEA', 'STPP', 'GLDA', 'EDTA'];
  let allKeySearchesPassed = true;
  keyChemicals.forEach(chem => {
    const res = searchUniversalIngredients(chem);
    if (res.length === 0) allKeySearchesPassed = false;
  });
  assert(
    allKeySearchesPassed,
    'Test 10: Unified search resolves all industry standard chemical abbreviations (SLES, LABSA, NaOH, etc.)',
    `Tested: ${keyChemicals.join(', ')}`
  );

  // 11. Concentration / Purity multi-term queries
  const sles28Results = searchUniversalIngredients('SLES 28');
  const sles70Results = searchUniversalIngredients('SLES 70');
  const naoh50Results = searchUniversalIngredients('NaOH 50');
  const naoh99Results = searchUniversalIngredients('NaOH 99');
  assert(
    sles28Results.length >= 4 && sles70Results.length >= 4 && naoh50Results.length >= 4 && naoh99Results.length >= 4,
    'Test 11: Multi-term concentration queries (SLES 28, SLES 70, NaOH 50, NaOH 99) return targeted grades',
    `SLES 28: ${sles28Results.length}, SLES 70: ${sles70Results.length}, NaOH 50: ${naoh50Results.length}, NaOH 99: ${naoh99Results.length}`
  );

  // 12. Category filter integrity across all 15 categories
  const categories = getAllCategories();
  assert(
    categories.length === 15,
    'Test 12: Master catalog contains exactly 15 standard chemical categories',
    `Categories: ${categories.length}`
  );
  let totalAcrossCategories = 0;
  categories.forEach(cat => {
    const items = searchUniversalIngredients('', cat);
    totalAcrossCategories += items.length;
  });
  assert(
    totalAcrossCategories === UNIVERSAL_INGREDIENTS.length,
    `Test 13: Sum of items across all categories equals exactly ${UNIVERSAL_INGREDIENTS.length} master records`,
    `Total: ${totalAcrossCategories}`
  );

  // 13. Same-CAS Coexistence in Formula Calculations
  const testFormula = [
    {
      id: 'sles_28_liq',
      name: 'SLES 28% Liquid',
      category: 'Anionic Surfactant',
      percentage: 10,
      activeMatterPct: 28,
      costPerKg: 0.85,
      casNumber: '68585-34-2'
    },
    {
      id: 'sles_70',
      name: 'SLES 70% (Sodium Lauryl Ether Sulfate)',
      category: 'Anionic Surfactant',
      percentage: 10,
      activeMatterPct: 70,
      costPerKg: 1.85,
      casNumber: '68585-34-2'
    }
  ];
  const totalActiveMatter = calculateActiveMatter(testFormula as any);
  const costReport = calculateFormulaCost(testFormula as any, 100);
  const batchCost = costReport.totalBatchCost;
  // Expected active matter: 10 * 0.28 + 10 * 0.70 = 2.8 + 7.0 = 9.8%
  // Expected batch RM cost: (10% of 100kg * $0.85) + (10% of 100kg * $1.85) = 10 * 0.85 + 10 * 1.85 = 8.5 + 18.5 = $27.00
  assert(
    Math.abs(totalActiveMatter - 9.8) < 0.01,
    'Test 14: SLES 28% and SLES 70% coexist in formula calculation with accurate independent active matter (9.8%)',
    `Active Matter: ${totalActiveMatter}%`
  );
  assert(
    Math.abs(batchCost - 27.0) < 0.01,
    'Test 15: SLES 28% and SLES 70% maintain independent costPerKg and batch cost ($27.00)',
    `Batch Cost: $${batchCost}`
  );

  // 16. Formula-entry aliases resolve to canonical identities without unsafe fuzzy matching
  const identityCases: Array<[string, string]> = [
    ['Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', 'labsa-90'],
    ['Sodium Laureth Sulfate (SLES 70%)', 'sles-70'],
    ['Cocamidopropyl Betaine (CAPB 30%)', 'capb-30-uni'],
    ['Sodium Citrate (Dihydrate)', 'sodium-citrate-uni'],
    ['Optical Brightener (CBS-X)', 'cbs-x'],
    ['Sodium Chloride (Salt)', 'sodium-chloride-uni']
  ];
  const identityCasesPassed = identityCases.every(([query, expectedId]) =>
    resolveUniversalIngredientIdentity(query)?.ingredient.id === expectedId
  );
  assert(
    identityCasesPassed,
    'Test 17: Common formula-entered commercial names resolve to their canonical catalog identities',
    identityCases.map(([query, expectedId]) => query + ' -> ' + expectedId).join('; ')
  );

  const caustic100Resolution = resolveUniversalIngredientIdentity('Sodium Hydroxide (Caustic Soda Lye 100%)');
  assert(
    caustic100Resolution?.ingredient.id === 'naoh-flakes-99' && caustic100Resolution.gradeCompatible === false,
    'Test 18: 100% caustic soda is recognized as NaOH identity but flagged for commercial-grade mismatch against 99% flakes',
    `Resolved: ${caustic100Resolution?.ingredient.name || 'NONE'}; gradeCompatible: ${caustic100Resolution?.gradeCompatible}`
  );

  assert(
    resolveUniversalIngredientIdentity('Unobtainium Super Cleaner 999%') === null,
    'Test 19: Unknown chemical names are not falsely matched by fuzzy substring logic'
  );

  assert(
    resolveUniversalIngredientIdentity('Salt') === null,
    'Test 20: Ambiguous generic salt is not silently identified as sodium chloride'
  );

  // 20A. Water and its common names are known catalog identities, not unlisted chemicals.
  const waterQueries = [
    'Water', 'Aqua', 'H2O', 'DI Water', 'Deionized Water',
    'Deionised Water', 'Demineralized Water', 'Distilled Water',
    'Purified Water', 'RO Water'
  ];
  const waterAliasesPassed = waterQueries.every(query =>
    resolveUniversalIngredientIdentity(query)?.ingredient.id === 'dm-water'
  );
  assert(
    waterAliasesPassed,
    'Test 20A: Common water names resolve to the catalog water identity',
    waterQueries.join(', ')
  );

  // 20B. Every canonical database record must resolve by its own display name.
  const unresolvedCatalogNames = UNIVERSAL_INGREDIENTS
    .filter(item => !resolveUniversalIngredientIdentity(item.name))
    .map(item => item.id);
  assert(
    unresolvedCatalogNames.length === 0,
    'Test 20B: Every ingredient in the complete master database resolves by its display name',
    `Unresolved records: ${unresolvedCatalogNames.length}`
  );

  // 20C. Common base-identity shorthand should be recognized without choosing a grade.
  const sodiumCarbonateResolution = resolveUniversalIngredientIdentity('Sodium Carbonate');
  assert(
    Boolean(sodiumCarbonateResolution?.ingredient) && sodiumCarbonateResolution?.gradeCompatible === false,
    'Test 20C: Shared base chemical names resolve to a known identity while requiring grade review'
  );

  // 20D. The curated industry abbreviation aliases are used by identity resolution,
  // not just by the encyclopedia search box.
  const industryAliases = ['LABSA', 'SLES', 'AOS', 'SLS', 'NaOH', 'KOH', 'CAPB', 'TEA', 'MEA', 'STPP', 'GLDA', 'EDTA'];
  const unresolvedIndustryAliases = industryAliases.filter(query => !resolveUniversalIngredientIdentity(query));
  assert(
    unresolvedIndustryAliases.length === 0,
    'Test 20D: Common detergent raw-material abbreviations resolve to known catalog identities',
    `Unresolved: ${unresolvedIndustryAliases.join(', ') || 'none'}`
  );
  const teaResolution = resolveUniversalIngredientIdentity('TEA');
  assert(
    teaResolution?.ingredient.id === 'tea-99',
    'Test 20E: TEA abbreviation resolves to triethanolamine, not protease records sharing a substring'
  );
  const meaResolution = resolveUniversalIngredientIdentity('MEA');
  assert(
    meaResolution?.ingredient.id === 'mea-99',
    'Test 20F: MEA abbreviation resolves to monoethanolamine, not Cocamide MEA records'
  );

  // 21. Immutability of Master Dataset
  const beforeLen = UNIVERSAL_INGREDIENTS.length;
  searchUniversalIngredients('SLES', 'Anionic Surfactant');
  assert(
    UNIVERSAL_INGREDIENTS.length === beforeLen,
    'Test 21: Search and filter operations do not mutate or truncate UNIVERSAL_INGREDIENTS',
    `Length: ${UNIVERSAL_INGREDIENTS.length}`
  );

  console.log('\n--------------------------------------------------');
  console.log(`TOTAL CHEMICAL ENCYCLOPEDIA TESTS : ${passed + failed}`);
  console.log(`PASSED                            : ${passed}`);
  console.log(`FAILED                            : ${failed}`);
  console.log('--------------------------------------------------\n');

  return { total: passed + failed, passed, failed };
}

if (process.argv[1]?.includes('chemicalEncyclopedia.regression.test')) {
  runChemicalEncyclopediaTestSuite();
}

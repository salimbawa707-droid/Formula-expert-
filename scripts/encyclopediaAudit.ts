import {
  UNIVERSAL_INGREDIENTS,
  getAllCategories,
  searchUniversalIngredients,
  UniversalIngredient
} from '../src/data/universalIngredientLibrary';

export function performForensicAudit() {
  console.log('================================================================');
  console.log('  CHEMICAL ENCYCLOPEDIA & MASTER DATASET FORENSIC AUDIT REPORT  ');
  console.log('================================================================\n');

  const total = UNIVERSAL_INGREDIENTS.length;
  console.log(`TOTAL RECORDS IN UNIVERSAL_INGREDIENTS: ${total}`);

  // 1. Unique IDs
  const idSet = new Set<string>();
  const dupIds: string[] = [];
  UNIVERSAL_INGREDIENTS.forEach(item => {
    if (idSet.has(item.id)) dupIds.push(item.id);
    idSet.add(item.id);
  });
  console.log(`UNIQUE IDs: ${idSet.size}`);
  console.log(`DUPLICATE IDs: ${dupIds.length} ${dupIds.length > 0 ? JSON.stringify(dupIds) : ''}`);

  // 2. CAS analysis
  const casMap = new Map<string, UniversalIngredient[]>();
  UNIVERSAL_INGREDIENTS.forEach(item => {
    const cas = item.casNumber || 'NO_CAS';
    if (!casMap.has(cas)) casMap.set(cas, []);
    casMap.get(cas)!.push(item);
  });
  console.log(`UNIQUE CAS NUMBERS: ${casMap.size}`);

  // 3. INCI analysis
  const inciMap = new Map<string, UniversalIngredient[]>();
  UNIVERSAL_INGREDIENTS.forEach(item => {
    const inci = item.inciName || 'NO_INCI';
    if (!inciMap.has(inci)) inciMap.set(inci, []);
    inciMap.get(inci)!.push(item);
  });
  console.log(`UNIQUE INCI NAMES: ${inciMap.size}`);

  // 4. Categories breakdown
  const catMap = new Map<string, number>();
  UNIVERSAL_INGREDIENTS.forEach(item => {
    catMap.set(item.category, (catMap.get(item.category) || 0) + 1);
  });
  console.log('\nCATEGORY BREAKDOWN:');
  for (const [cat, count] of catMap.entries()) {
    console.log(`  - ${cat}: ${count} commercial variants`);
  }

  // 5. True Duplicates check
  const trueDuplicates: { a: string; b: string; name: string }[] = [];
  for (let i = 0; i < UNIVERSAL_INGREDIENTS.length; i++) {
    for (let j = i + 1; j < UNIVERSAL_INGREDIENTS.length; j++) {
      const a = UNIVERSAL_INGREDIENTS[i];
      const b = UNIVERSAL_INGREDIENTS[j];
      if (
        a.id === b.id ||
        (a.name === b.name &&
          a.activeDefault === b.activeDefault &&
          a.costPerKg === b.costPerKg &&
          a.casNumber === b.casNumber &&
          a.description === b.description)
      ) {
        trueDuplicates.push({ a: a.id, b: b.id, name: a.name });
      }
    }
  }
  console.log(`\nTRUE DUPLICATES: ${trueDuplicates.length}`);

  // 6. Test specific key chemical search queries
  const testQueries = ['SLES', 'LABSA', 'AOS', 'SLS', 'NaOH', 'KOH', 'CAPB', 'TEA', 'MEA', 'STPP', 'GLDA', 'EDTA'];
  console.log('\nSEARCH TEST FOR KEY CHEMICALS:');
  for (const q of testQueries) {
    const results = searchUniversalIngredients(q);
    console.log(`  - Search "${q}": found ${results.length} commercial variant records`);
  }

  // 7. Test concentration queries
  const concQueries = ['SLES 28', 'SLES 70', 'LABSA 96', 'AOS 38', 'AOS 92', 'SLS 30', 'SLS 95', 'NaOH 50', 'NaOH 99'];
  console.log('\nCONCENTRATION / PURITY SEARCH TEST:');
  for (const q of concQueries) {
    const results = searchUniversalIngredients(q);
    console.log(`  - Search "${q}": found ${results.length} records -> ${results.map(r => `${r.name} (${r.activeDefault}%)`).join(', ')}`);
  }

  // 8. CAS search test
  const casTests = ['68585-34-2', '27176-87-0', '68439-57-6', '151-21-3', '1310-73-2'];
  console.log('\nCAS SEARCH TEST:');
  for (const cas of casTests) {
    const results = searchUniversalIngredients(cas);
    console.log(`  - CAS "${cas}": found ${results.length} commercial variants`);
  }

  return {
    total,
    uniqueIds: idSet.size,
    uniqueCas: casMap.size,
    uniqueInci: inciMap.size,
    trueDuplicates: trueDuplicates.length,
    categories: Object.fromEntries(catMap)
  };
}

if (process.argv[1]?.includes('encyclopediaAudit')) {
  performForensicAudit();
}

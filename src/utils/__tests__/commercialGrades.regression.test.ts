/**
 * ============================================================================
 * COMMERCIAL INGREDIENT GRADES AUDIT & VERIFICATION TEST SUITE
 * ============================================================================
 */

import {
  UNIVERSAL_INGREDIENTS,
  getAllUniversalIngredients,
  searchUniversalIngredients,
  UniversalIngredient
} from '../../data/universalIngredientLibrary';
import { calculateActiveMatter, calculateBatchCost } from '../calculators';

export interface CommercialGradeTestResult {
  testNumber: number;
  description: string;
  passed: boolean;
  actual: any;
  expected: any;
  details?: string;
}

export function runCommercialGradesTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: CommercialGradeTestResult[];
} {
  const results: CommercialGradeTestResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  function assert(
    testNumber: number,
    description: string,
    condition: boolean,
    actual: any,
    expected: any,
    details?: string
  ) {
    const passed = Boolean(condition);
    if (passed) passedCount++;
    else failedCount++;

    results.push({
      testNumber,
      description,
      passed,
      actual,
      expected,
      details
    });

    const statusTag = passed ? '[PASS]' : '[FAIL]';
    console.log(`${statusTag} Test ${testNumber}: ${description} -> ${passed ? 'OK' : 'FAILED'}`);
    if (!passed) {
      console.error(`       Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  console.log('\n================================================================');
  console.log('  COMMERCIAL INGREDIENT GRADES AUDIT & VERIFICATION TEST SUITE  ');
  console.log('================================================================');

  // TEST 1: Exact record count of UNIVERSAL_INGREDIENTS is at least 428
  const allIngredients = getAllUniversalIngredients();
  assert(
    1,
    'Record count of UNIVERSAL_INGREDIENTS is at least 428',
    UNIVERSAL_INGREDIENTS.length >= 428 && allIngredients.length === UNIVERSAL_INGREDIENTS.length,
    allIngredients.length,
    `>= 428 (Current: ${UNIVERSAL_INGREDIENTS.length})`
  );

  // TEST 2: Exact unique ID count matches total records (0 duplicate IDs)
  const idSet = new Set<string>();
  const duplicateIds: string[] = [];
  for (const item of UNIVERSAL_INGREDIENTS) {
    if (idSet.has(item.id)) duplicateIds.push(item.id);
    idSet.add(item.id);
  }
  assert(
    2,
    `Exact unique ID count is ${UNIVERSAL_INGREDIENTS.length} (0 duplicate IDs)`,
    idSet.size === UNIVERSAL_INGREDIENTS.length && duplicateIds.length === 0,
    `Unique: ${idSet.size}, Duplicates: ${duplicateIds.length}`,
    `Unique: ${UNIVERSAL_INGREDIENTS.length}, Duplicates: 0`
  );

  // TEST 3: Unique CAS count vs shared CAS variant records
  const casMap = new Map<string, UniversalIngredient[]>();
  for (const item of UNIVERSAL_INGREDIENTS) {
    if (!item.casNumber) continue;
    if (!casMap.has(item.casNumber)) casMap.set(item.casNumber, []);
    casMap.get(item.casNumber)!.push(item);
  }
  const slesGrades = casMap.get('68585-34-2') || [];
  assert(
    3,
    'Unique CAS compounds is >= 112 and SLES CAS (68585-34-2) contains 8 commercial variants',
    casMap.size >= 112 && slesGrades.length === 8,
    `CAS count: ${casMap.size}, SLES variants: ${slesGrades.length}`,
    'CAS count: >= 112, SLES variants: 8'
  );

  // TEST 4: Search "SLES" returns both SLES 28% and SLES 70% commercial variants
  const slesResults = searchUniversalIngredients('sles');
  const slesNames = slesResults.map(r => r.name);
  assert(
    4,
    'Search "SLES" returns both SLES 28% and SLES 70% commercial variants (8 grades)',
    slesNames.some(n => n.includes('SLES 70%')) && slesNames.some(n => n.includes('SLES 28%')) && slesResults.length >= 8,
    slesResults.length,
    '>= 8'
  );

  // TEST 5: Search "LABSA" returns all LABSA commercial grades
  const labsaResults = searchUniversalIngredients('labsa');
  const labsaNames = labsaResults.map(r => r.name);
  assert(
    5,
    'Search "LABSA" returns all LABSA commercial grades (4 grades)',
    labsaNames.some(n => n.includes('LABSA 96%')) && labsaResults.length >= 4,
    labsaResults.length,
    '>= 4'
  );

  // TEST 6: Search "AOS" returns AOS 38% and AOS 92% commercial grades
  const aosResults = searchUniversalIngredients('aos');
  const aosNames = aosResults.map(r => r.name);
  assert(
    6,
    'Search "AOS" returns AOS 38% and AOS 92% commercial grades (8 grades)',
    aosNames.some(n => n.includes('AOS 38%')) && aosNames.some(n => n.includes('AOS 92%')) && aosResults.length >= 8,
    aosResults.length,
    '>= 8'
  );

  // TEST 7: Search "SLS" returns SLS 30% and SLS 95% commercial grades
  const slsResults = searchUniversalIngredients('sls');
  const slsNames = slsResults.map(r => r.name);
  assert(
    7,
    'Search "SLS" returns SLS 30% and SLS 95% commercial grades (8 grades)',
    slsNames.some(n => n.includes('SLS 30%')) && slsNames.some(n => n.includes('SLS 95%')) && slsResults.length >= 8,
    slsResults.length,
    '>= 8'
  );

  // TEST 8: Search "NaOH" returns Sodium Hydroxide 50% and 99% Flakes grades
  const naohResults = searchUniversalIngredients('naoh');
  const naohNames = naohResults.map(r => r.name);
  assert(
    8,
    'Search "NaOH" returns Sodium Hydroxide 50% and 99% Flakes grades (8 grades)',
    naohNames.some(n => n.includes('50%')) && naohNames.some(n => n.includes('99%') || n.includes('Flakes')) && naohResults.length >= 8,
    naohResults.length,
    '>= 8'
  );

  // TEST 9: Selecting SLES 28% vs SLES 70% preserves distinct active percentages
  const sles28 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sles-28')!;
  const sles70 = UNIVERSAL_INGREDIENTS.find(i => i.id === 'sles-70')!;
  assert(
    9,
    'Selecting SLES 28% vs SLES 70% preserves distinct active percentages',
    sles28 && sles70 && sles28.activeDefault === 28 && sles70.activeDefault === 70,
    `SLES 28%: ${sles28?.activeDefault}%, SLES 70%: ${sles70?.activeDefault}%`,
    'SLES 28%: 28%, SLES 70%: 70%'
  );

  // TEST 10: Selecting LABSA 96% vs Technical Grade preserves distinct metadata
  const labsaStd = UNIVERSAL_INGREDIENTS.find(i => i.id === 'labsa-96')!;
  const labsaTech = UNIVERSAL_INGREDIENTS.find(i => i.id === 'labsa-96-tech')!;
  assert(
    10,
    'Selecting LABSA 96% vs Technical Grade preserves distinct metadata',
    labsaStd && labsaTech && labsaStd.activeDefault === 96 && labsaTech.activeDefault === 96 && labsaStd.id !== labsaTech.id,
    `LABSA Std ID: ${labsaStd?.id}, Tech ID: ${labsaTech?.id}`,
    'Distinct IDs'
  );

  // TEST 11: Two ingredients sharing same CAS can coexist in formula with independent calculations
  const formulaIngredients = [
    {
      id: 'ing-1',
      name: sles28.name,
      percentage: 10,
      activeMatterPct: sles28.activeDefault,
      costPerKg: 1.20,
      role: sles28.category
    },
    {
      id: 'ing-2',
      name: sles70.name,
      percentage: 10,
      activeMatterPct: sles70.activeDefault,
      costPerKg: 1.50,
      role: sles70.category
    }
  ];

  const totalActive = calculateActiveMatter(formulaIngredients as any);
  const totalCost = calculateBatchCost(formulaIngredients as any, 100);
  assert(
    11,
    'Two ingredients sharing same CAS coexist in formula with independent calculations',
    Math.abs(totalActive - 9.8) < 0.01 && Math.abs(totalCost - 27.0) < 0.01,
    `Active: ${totalActive}%, Batch Cost (100kg): $${totalCost}`,
    'Active: 9.8%, Batch Cost (100kg): $27.0'
  );

  // TEST 12: Searching by CAS number returns all commercial variant records sharing that CAS
  const slesCas = '68585-34-2';
  const matchesSles = searchUniversalIngredients(slesCas);
  const labsaCas = '27176-87-0';
  const matchesLabsa = searchUniversalIngredients(labsaCas);
  assert(
    12,
    'Searching by CAS number returns all commercial variant records sharing that CAS',
    matchesSles.length === 8 && matchesLabsa.length >= 4,
    `SLES CAS matches: ${matchesSles.length}, LABSA CAS matches: ${matchesLabsa.length}`,
    'SLES CAS matches: 8, LABSA CAS matches: >= 4'
  );

  console.log(`\n================================================================`);
  console.log(`  SUMMARY: ${passedCount}/${results.length} TESTS PASSED (${failedCount} failed)`);
  console.log('================================================================\n');

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

if (process.argv[1]?.includes('commercialGrades.regression.test')) {
  const result = runCommercialGradesTestSuite();
  if (result.failed > 0) process.exit(1);
}

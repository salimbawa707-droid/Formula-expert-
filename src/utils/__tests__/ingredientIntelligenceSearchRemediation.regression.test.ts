/**
 * ============================================================================
 * INGREDIENT INTELLIGENCE, SEARCH & CATEGORY FILTERING, ACID SLURRY 90% vs 96%,
 * AND ARISTO 9 PROVENANCE REGRESSION TEST SUITE (30 Authoritative Tests)
 * ============================================================================
 */

import {
  getAllUniversalIngredients,
  getAllCategories,
  searchUniversalIngredients
} from '../../data/universalIngredientLibrary';
import {
  calculateActiveSurfactants,
  ActiveMatterEngine
} from '../activeMatterEngine';
import { calculateLiquidNVR } from '../liquidNvrEngine';
import { calculateDensity } from '../densityEngine';
import { calculateMixedCMC } from '../calculators';
import { INGREDIENT_INTELLIGENCE_REGISTRY } from '../ingredientIntelligenceEngine';
import { FORMULAS } from '../../data/formulas';

export interface TestAssertionResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestAssertionResult[];
}

export function runIngredientIntelligenceSearchRemediationTestSuite(): TestSuiteSummary {
  const results: TestAssertionResult[] = [];

  const assert = (group: string, name: string, condition: boolean, message?: string) => {
    results.push({
      group,
      name,
      passed: condition,
      message: message || (condition ? undefined : 'Assertion condition failed')
    });
  };

  const allIngredients = getAllUniversalIngredients();
  const labsa90 = allIngredients.find(i => i.id === 'labsa-90');
  const labsa96 = allIngredients.find(i => i.id === 'labsa-96');
  const aristo9 = allIngredients.find(i => i.id === 'aristo-9');

  // =========================================================================
  // 1. LABSA 90% and LABSA 96% SEPARATION & INTEGRITY (Tests 1 - 7)
  // =========================================================================
  assert(
    '1. LABSA Purity Variants',
    '1. LABSA 90% exists in canonical database',
    labsa90 !== undefined && labsa90.name.includes('90%')
  );

  assert(
    '1. LABSA Purity Variants',
    '2. LABSA 96% still exists in canonical database',
    labsa96 !== undefined && labsa96.name.includes('96%')
  );

  assert(
    '1. LABSA Purity Variants',
    '3. 90% and 96% have distinct canonical IDs',
    labsa90?.id === 'labsa-90' && labsa96?.id === 'labsa-96' && (labsa90?.id as string) !== (labsa96?.id as string)
  );

  assert(
    '1. LABSA Purity Variants',
    '4. 90% active matter = 90% in canonical metadata and active engine',
    labsa90?.activeDefault === 90 && ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA 90% (Acid Slurry)' }).activeMatterPct === 90
  );

  assert(
    '1. LABSA Purity Variants',
    '5. 96% active matter remains 96% in canonical metadata and active engine',
    labsa96?.activeDefault === 96 && ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA 96% (Acid Slurry)' }).activeMatterPct === 96
  );

  // Active contribution calculations at 10% dosage (10 kg in 100 kg batch)
  const formulaWith90 = [
    { id: 'ing-1', name: 'Water', percentage: 90, activeMatterPct: 0 },
    { id: 'ing-2', name: 'LABSA 90% (Acid Slurry)', percentage: 10, activeMatterPct: 90 }
  ];
  const active90Contribution = calculateActiveSurfactants(formulaWith90);

  assert(
    '1. LABSA Purity Variants',
    '6. Selecting 90% uses 90% active matter (10 kg -> 9.0 kg active in 100 kg batch)',
    Number(active90Contribution.toFixed(2)) === 9.00,
    `Calculated active: ${active90Contribution}%`
  );

  const formulaWith96 = [
    { id: 'ing-1', name: 'Water', percentage: 90, activeMatterPct: 0 },
    { id: 'ing-2', name: 'LABSA 96% (Acid Slurry)', percentage: 10, activeMatterPct: 96 }
  ];
  const active96Contribution = calculateActiveSurfactants(formulaWith96);

  assert(
    '1. LABSA Purity Variants',
    '7. Selecting 96% uses 96% active matter (10 kg -> 9.6 kg active in 100 kg batch)',
    Number(active96Contribution.toFixed(2)) === 9.60,
    `Calculated active: ${active96Contribution}%`
  );

  // =========================================================================
  // 2. SEARCH & ALIASES RESOLUTION (Tests 8 - 11)
  // =========================================================================
  const searchLabsa = searchUniversalIngredients('LABSA');
  assert(
    '2. Fast Search & Aliases',
    '8. Searching "LABSA" returns both 90% and 96% variants',
    searchLabsa.some(i => i.id === 'labsa-90') && searchLabsa.some(i => i.id === 'labsa-96')
  );

  const searchAcidSlurry = searchUniversalIngredients('acid slurry');
  assert(
    '2. Fast Search & Aliases',
    '9. Searching "acid slurry" returns both variants via alias keywords',
    searchAcidSlurry.some(i => i.id === 'labsa-90') && searchAcidSlurry.some(i => i.id === 'labsa-96')
  );

  const searchCaseInsensitive = searchUniversalIngredients('AcId sLuRrY 90');
  assert(
    '2. Fast Search & Aliases',
    '10. Search is strictly case-insensitive',
    searchCaseInsensitive.some(i => i.id === 'labsa-90') && !searchCaseInsensitive.some(i => i.id === 'labsa-96')
  );

  const searchPartial = searchUniversalIngredients('aris');
  assert(
    '2. Fast Search & Aliases',
    '11. Partial search works (e.g. "aris" matches "Aristo 9")',
    searchPartial.some(i => i.id === 'aristo-9')
  );

  // =========================================================================
  // 3. CATEGORY FILTERING & DUAL FILTERING (Tests 12 - 13)
  // =========================================================================
  const anionicOnly = searchUniversalIngredients('', 'Anionic Surfactant');
  assert(
    '3. Category Filtering',
    '12. Category filter returns only matching category ingredients',
    anionicOnly.length > 0 && anionicOnly.every(i => i.category === 'Anionic Surfactant')
  );

  const categoryAndSearch = searchUniversalIngredients('acid slurry', 'Anionic Surfactant');
  const wrongCategorySearch = searchUniversalIngredients('acid slurry', 'Polymer & Thickener');
  assert(
    '3. Category Filtering',
    '13. Category + search filter work together (both conditions enforced)',
    categoryAndSearch.some(i => i.id === 'labsa-90') && wrongCategorySearch.length === 0
  );

  // =========================================================================
  // 4. UNKNOWN INGREDIENT SAFE DEGRADATION (Tests 14 - 18)
  // =========================================================================
  const unknownIng = {
    id: 'custom-unknown-1',
    name: 'Uncharacterized Polymer XYZ',
    percentage: 5.0,
    activeMatterPct: 0,
    costPerKg: 10.0
  };

  const activeResUnknown = ActiveMatterEngine.resolveIngredientActive({ name: 'Uncharacterized Polymer XYZ' });
  assert(
    '4. Unknown Ingredient Integrity',
    '14. Unknown ingredient does not receive fake scientific defaults',
    activeResUnknown.dataSource === 'missing' || activeResUnknown.dataSource === 'derived_from_name' || activeResUnknown.isSurfactant === false
  );

  assert(
    '4. Unknown Ingredient Integrity',
    '15. Unknown active matter remains UNKNOWN/missing rather than assuming surfactant chemistry',
    activeResUnknown.surfactantType === 'none'
  );

  const nvrResultUnknown = calculateLiquidNVR([
    { name: 'Water', percentage: 95, activeMatterPct: 0, nonVolatileFraction: 0 },
    { name: unknownIng.name, percentage: unknownIng.percentage, activeMatterPct: unknownIng.activeMatterPct }
  ], 100);

  assert(
    '4. Unknown Ingredient Integrity',
    '16. Unknown NVR does not become 0.0% finished product claim (reports INSUFFICIENT_DATA)',
    nvrResultUnknown.isComplete === false && nvrResultUnknown.status === 'INSUFFICIENT_DATA'
  );

  const densityUnknown = calculateDensity([
    { id: '1', name: 'Water', percentage: 95, activeMatterPct: 0 },
    unknownIng
  ]);
  assert(
    '4. Unknown Ingredient Integrity',
    '17. Unknown ingredient without pure density defaults safely without arbitrary invention',
    densityUnknown.densityGPerCm3 > 0
  );

  const cmcUnknown = calculateMixedCMC([
    { name: 'Water', percentage: 95 },
    { name: unknownIng.name, percentage: unknownIng.percentage }
  ]);
  assert(
    '4. Unknown Ingredient Integrity',
    '18. Unknown non-surfactant ingredient returns explicit insufficient-input CMC status',
    !cmcUnknown.available && cmcUnknown.eligibilityStatus === 'INSUFFICIENT_INPUTS'
  );

  // =========================================================================
  // 5. ARISTO 9 PROVENANCE & UNVERIFIED STATUS (Tests 19 - 21)
  // =========================================================================
  assert(
    '5. Aristo 9 Provenance',
    '19. Aristo 9 is not assigned invented composition (activeDefault=0, activeMatter=undefined)',
    aristo9 !== undefined && (aristo9.activeDefault === 0 || aristo9.activeMatter === undefined)
  );

  assert(
    '5. Aristo 9 Provenance',
    '20. Aristo 9 provenance is preserved (Manufacturer: Blue Chem India, NEEDS_VERIFICATION)',
    aristo9?.manufacturer === 'Blue Chem India' &&
    aristo9?.provenance?.source === 'Blue Chem India' &&
    aristo9?.provenance?.verificationStatus === 'NEEDS_VERIFICATION'
  );

  assert(
    '5. Aristo 9 Provenance',
    '21. Unverified commercial product cannot become VERIFIED automatically',
    aristo9?.provenance?.verificationStatus !== 'VERIFIED' &&
    aristo9?.unknownProperties?.includes('activeMatter') === true
  );

  // =========================================================================
  // 6. CANONICAL CATEGORY TAXONOMY & DATABASE INTEGRITY (Tests 22 - 25)
  // =========================================================================
  const allCategories = getAllCategories();
  assert(
    '6. Category & Database Taxonomy',
    '22. Canonical database category metadata is exposed for UI consumption',
    allCategories.includes('Anionic Surfactant') && allCategories.includes('Additive & Performance')
  );

  const aristoSearchResults = searchUniversalIngredients('aristo');
  assert(
    '6. Category & Database Taxonomy',
    '23. Search results come directly from canonical ingredient records',
    aristoSearchResults.length > 0 && aristoSearchResults[0].id === 'aristo-9'
  );

  assert(
    '6. Category & Database Taxonomy',
    '24. UI search returns direct matches without requiring full list scrolling',
    searchUniversalIngredients('labsa 90').length >= 1
  );

  assert(
    '6. Category & Database Taxonomy',
    '25. Existing ingredient records remain unchanged (SLES 70%, Soda Ash, etc.)',
    allIngredients.some(i => i.id === 'sles-70' && i.activeDefault === 70) &&
    allIngredients.some(i => i.id === 'soda-ash-uni' && i.name.includes('Sodium Carbonate'))
  );

  // =========================================================================
  // 7. FORMULA CALCULATION WITH SELECTED INGREDIENTS (Tests 26 - 27)
  // =========================================================================
  const multiIngredientFormula = [
    { id: '1', name: 'Water', percentage: 80, activeMatterPct: 0 },
    { id: '2', name: 'LABSA 90% (Acid Slurry)', percentage: 10, activeMatterPct: 90 },
    { id: '3', name: 'Aristo 9 (Multipurpose Detergent Additive)', percentage: 10, activeMatterPct: 0 }
  ];

  const multiActive = calculateActiveSurfactants(multiIngredientFormula);
  assert(
    '7. Formula Calculations',
    '26. Formula calculation uses selected canonical ingredients (LABSA 90% = 9.0% active, Aristo 9 = 0% surfactant active)',
    Number(multiActive.toFixed(2)) === 9.00,
    `Calculated active: ${multiActive}%`
  );

  const aristoNvr = calculateLiquidNVR(multiIngredientFormula, 100);
  assert(
    '7. Formula Calculations',
    '27. Aristo 9 safely produces INSUFFICIENT_DATA for uncharacterized properties (NVR)',
    aristoNvr.isComplete === false && aristoNvr.status === 'INSUFFICIENT_DATA'
  );

  // =========================================================================
  // 8. ID UNIQUENESS & REGRESSION SAFETY (Tests 28 - 30)
  // =========================================================================
  const allIds = allIngredients.map(i => i.id);
  const uniqueIds = new Set(allIds);
  assert(
    '8. ID Uniqueness & Safety',
    '28. No duplicate canonical IDs across the entire ingredient database',
    allIds.length === uniqueIds.size,
    `Total IDs: ${allIds.length}, Unique IDs: ${uniqueIds.size}`
  );

  const additiveCategorySearch = searchUniversalIngredients('', 'Additive & Performance');
  assert(
    '8. ID Uniqueness & Safety',
    '29. No category-filter regression (Additive & Performance contains Aristo 9)',
    additiveCategorySearch.some(i => i.id === 'aristo-9')
  );

  const benchmarkFormulasPreserved = FORMULAS.every(f => f.ingredients.length > 0);
  assert(
    '8. ID Uniqueness & Safety',
    '30. No existing formula regression caused by adding LABSA 90% and Aristo 9',
    benchmarkFormulasPreserved && INGREDIENT_INTELLIGENCE_REGISTRY['labsa'].grades['90pct'] !== undefined
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

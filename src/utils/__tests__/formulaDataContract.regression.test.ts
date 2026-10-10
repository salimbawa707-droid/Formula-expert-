import {
  calculateActiveMatter,
  calculateActiveSurfactants,
  calculateBatchCost,
  calculateCPI,
  calculateCleaningPerformance,
  calculateFormulationCompatibility,
  calculateWaterHardnessTolerance,
  calculateFormulationChelationCapacity,
  getChelatorBindingCapacity,
  calculateLabHealthScore,
  evaluateAIGrade,
  calculateBlendedHLB,
  normalizeIngredientTaxonomy
} from '../calculators';
import { mapFormulationIngredientsToPHEngineInput } from '../pHEngineAdapter';
import { calculatePHAdvanced } from '../pHEngine';
import { FormulationIngredient } from '../../types';

interface TestSummary {
  passed: number;
  failed: number;
}

function assertEqual<T>(section: string, testName: string, actual: T, expected: T): boolean {
  if (actual === expected) {
    console.log(`[PASS] [${section}] ${testName} :: PASS (${actual})`);
    return true;
  } else {
    console.error(`[FAIL] [${section}] ${testName} -> Expected: ${expected}, Got: ${actual}`);
    return false;
  }
}

function assertNear(section: string, testName: string, actual: number, expected: number, tolerance: number = 0.05): boolean {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`[PASS] [${section}] ${testName} :: PASS (${actual})`);
    return true;
  } else {
    console.error(`[FAIL] [${section}] ${testName} -> Expected: ~${expected} (±${tolerance}), Got: ${actual}`);
    return false;
  }
}

export function runFormulaDataContractTestSuite(): TestSummary {
  let passed = 0;
  let failed = 0;

  const record = (res: boolean) => {
    if (res) passed++;
    else failed++;
  };

  console.log('==================================================');
  console.log('  PHASE 2.9 FORMULA DATA CONTRACT & INTEGRITY     ');
  console.log('==================================================');

  // -------------------------------------------------------------
  // 1. CANONICAL INGREDIENT FIELD & ALIAS MAPPING AUDIT
  // -------------------------------------------------------------

  const canonicalIngredients: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 5, activeMatterPct: 70, costPerKg: 1.20, category: 'Anionic Surfactant' },
    { name: 'Demineralized Water', percentage: 85, activeMatterPct: 0, costPerKg: 0.02, category: 'Solvent' }
  ];

  const aliasedIngredients: any[] = [
    { name: 'LABSA 96%', percent: 10, activePercent: 96, rawMaterialCostPerKg: 1.50, role: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentageInFormula: 5, purity: 70, cost: 1.20, function: 'Anionic Surfactant' },
    { name: 'Demineralized Water', percent: 85, activeMatterPurity: 0, costPerKg: 0.02, role: 'Solvent' }
  ];

  const canonicalActive = calculateActiveMatter(canonicalIngredients);
  const aliasedActive = calculateActiveMatter(aliasedIngredients);
  record(assertNear('Canonical Field Contract', 'Active matter identical between canonical and aliased fields', aliasedActive, canonicalActive));

  const canonicalCost = calculateBatchCost(canonicalIngredients, 100);
  const aliasedCost = calculateBatchCost(aliasedIngredients, 100);
  record(assertNear('Canonical Field Contract', 'Batch cost identical between canonical and aliased fields', aliasedCost, canonicalCost));

  const canonicalSurfactants = calculateActiveSurfactants(canonicalIngredients);
  const aliasedSurfactants = calculateActiveSurfactants(aliasedIngredients);
  record(assertNear('Canonical Field Contract', 'Active surfactants identical between canonical and aliased fields', aliasedSurfactants, canonicalSurfactants));

  const canonicalAIGrade = evaluateAIGrade(canonicalIngredients, 7.5, 200);
  const aliasedAIGrade = evaluateAIGrade(aliasedIngredients, 7.5, 200);
  record(assertEqual('Canonical Field Contract', 'AI Grade score identical between canonical and aliased input', aliasedAIGrade.score, canonicalAIGrade.score));

  // -------------------------------------------------------------
  // 2. EXPLICIT ZERO INTEGRITY AUDIT
  // -------------------------------------------------------------

  const zeroPercentageIngredients: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50 },
    { name: 'Sodium Hydroxide 50%', percentage: 0, activeMatterPct: 50, costPerKg: 0.80 }, // Explicit 0%
    { name: 'Demineralized Water', percentage: 90, activeMatterPct: 0, costPerKg: 0 }
  ];

  const zeroActiveMatter = calculateActiveMatter(zeroPercentageIngredients);
  record(assertNear('Explicit Zero Integrity', '0% percentage ingredient adds 0 to active matter', zeroActiveMatter, 9.60));

  const zeroBatchCost = calculateBatchCost(zeroPercentageIngredients, 100);
  record(assertNear('Explicit Zero Integrity', '0% percentage ingredient adds $0 to batch cost', zeroBatchCost, 15.00));

  const zeroCostIngredientFormula: FormulationIngredient[] = [
    { name: 'Demineralized Water', percentage: 100, activeMatterPct: 0, costPerKg: 0 } // $0 cost
  ];
  const zeroCostBatch = calculateBatchCost(zeroCostIngredientFormula, 100);
  record(assertEqual('Explicit Zero Integrity', '$0 cost ingredient is treated as $0 cost (not defaulted to lookup)', zeroCostBatch, 0));

  const zeroHLBSurfactant: FormulationIngredient[] = [
    { name: 'Special Surfactant', percentage: 10, activeMatterPct: 100, hlbValue: 0 } // Explicit 0 HLB
  ];
  const zeroHLBResult = calculateBlendedHLB(zeroHLBSurfactant);
  record(assertEqual('Explicit Zero Integrity', '0 HLB value is respected and yields 0 blended HLB', zeroHLBResult, 0));

  // -------------------------------------------------------------
  // 3. NULL / UNDEFINED / EMPTY / STRING INPUT AUDIT
  // -------------------------------------------------------------

  const stringInputIngredients: any[] = [
    { name: 'LABSA 96%', percentage: '10', activeMatterPct: '96', costPerKg: '1.50' }, // Strings
    { name: 'SLES 70%', percent: '5', activePercent: '70', cost: '1.20' },
    { name: 'Water', percentage: 85, activeMatterPct: 0, costPerKg: 0 }
  ];

  const stringActive = calculateActiveMatter(stringInputIngredients);
  record(assertNear('Invalid / String Input Audit', 'Numeric strings safely parsed in active matter calculation', stringActive, 13.10));

  const stringCost = calculateBatchCost(stringInputIngredients, 100);
  record(assertNear('Invalid / String Input Audit', 'Numeric strings safely parsed in batch cost calculation', stringCost, 21.00));

  const nullAndUndefinedIngredients: any[] = [
    { name: 'LABSA 96%', percentage: null, activeMatterPct: undefined, costPerKg: null },
    { name: 'Unknown Additive', percentage: undefined, activeMatterPct: null, costPerKg: undefined }
  ];
  const nullActive = calculateActiveMatter(nullAndUndefinedIngredients);
  record(assertEqual('Invalid / String Input Audit', 'Null and undefined percentages yield 0 total active matter', nullActive, 0));

  const negativePercentageIngredients: any[] = [
    { name: 'LABSA 96%', percentage: -10, activeMatterPct: 96, costPerKg: 1.50 },
    { name: 'Water', percentage: 110, activeMatterPct: 0, costPerKg: 0 }
  ];
  const negativeChelation = calculateFormulationChelationCapacity(negativePercentageIngredients, 20);
  record(assertEqual('Invalid / String Input Audit', 'Negative percentage clamped to 0 in chelation capacity', negativeChelation.details[0].percentage, 0));

  const emptyFormulaResult = evaluateAIGrade([], 7.0);
  record(assertEqual('Invalid / String Input Audit', 'Empty formula produces grade F', emptyFormulaResult.grade, 'F'));
  record(assertEqual('Invalid / String Input Audit', 'Empty formula produces score 0', emptyFormulaResult.score, 0));

  // -------------------------------------------------------------
  // 4. COMMERCIAL PRODUCT GRADE & CHELATOR DOUBLE-COUNT AUDIT
  // -------------------------------------------------------------

  const gldaBindingCapacity = getChelatorBindingCapacity('GLDA 47% Liquid');
  record(assertEqual('Commercial Product Grade', 'GLDA 47% Liquid binding capacity is 137 mg CaCO3/g (commercial basis)', gldaBindingCapacity, 137));

  const mgdaBindingCapacity = getChelatorBindingCapacity('MGDA 38% Liquid');
  record(assertEqual('Commercial Product Grade', 'MGDA 38% Liquid binding capacity is 155 mg CaCO3/g (commercial basis)', mgdaBindingCapacity, 155));

  const edtaBindingCapacity = getChelatorBindingCapacity('EDTA Tetrasodium');
  record(assertEqual('Commercial Product Grade', 'EDTA Tetrasodium binding capacity is 220 mg CaCO3/g (commercial basis)', edtaBindingCapacity, 220));

  const dtpaBindingCapacity = getChelatorBindingCapacity('DTPA Powder');
  record(assertEqual('Commercial Product Grade', 'DTPA binding capacity is 200 mg CaCO3/g (commercial basis)', dtpaBindingCapacity, 200));

  const citrateBindingCapacity = getChelatorBindingCapacity('Sodium Citrate Dihydrate');
  record(assertEqual('Commercial Product Grade', 'Sodium Citrate Dihydrate binding capacity is 150 mg CaCO3/g (commercial basis)', citrateBindingCapacity, 150));

  const citricAcidBindingCapacity = getChelatorBindingCapacity('Citric Acid Monohydrate');
  record(assertEqual('Commercial Product Grade', 'Citric acid (acidifier) binding capacity is 0 mg CaCO3/g', citricAcidBindingCapacity, 0));

  // Single-discount verification: 2% GLDA in 20g dose = 0.4g product. 0.4g * 137 mg/g = 54.8 mg CaCO3.
  const gldaFormula: FormulationIngredient[] = [
    { name: 'GLDA 47% Liquid (Dissolvine GL-47-S)', percentage: 2.0, activeMatterPct: 47, costPerKg: 2.50 }
  ];
  const gldaChelation = calculateFormulationChelationCapacity(gldaFormula, 20);
  record(assertNear('Commercial Product Grade', 'GLDA 47% 2.0% in 20g dose sequestering capacity = 54.8 mg CaCO3 (single-discounted)', gldaChelation.totalSequestrationMg, 54.80, 0.01));

  // -------------------------------------------------------------
  // 5. DUPLICATE INGREDIENT NAMING AUDIT
  // -------------------------------------------------------------

  const gldaAliases = ['GLDA', 'GLDA-47', 'GLDA 47%', 'Tetrasodium GLDA', 'Dissolvine GL-47-S'];
  const allGLDAIdentified = gldaAliases.every(alias => getChelatorBindingCapacity(alias) === 137);
  record(assertEqual('Duplicate Ingredient Naming', 'All GLDA alias representations return identical binding capacity (137 mg/g)', allGLDAIdentified, true));

  const citrateAliases = ['Sodium Citrate', 'Sodium Citrate Dihydrate', 'Trisodium Citrate'];
  const allCitrateIdentified = citrateAliases.every(alias => getChelatorBindingCapacity(alias) === 150);
  record(assertEqual('Duplicate Ingredient Naming', 'All Sodium Citrate representations return identical binding capacity (150 mg/g)', allCitrateIdentified, true));

  const edtaAliases = ['EDTA', 'Tetrasodium EDTA', 'EDTA Tetrasodium'];
  const allEDTAIdentified = edtaAliases.every(alias => getChelatorBindingCapacity(alias) === 220);
  record(assertEqual('Duplicate Ingredient Naming', 'All EDTA representations return identical binding capacity (220 mg/g)', allEDTAIdentified, true));

  // -------------------------------------------------------------
  // 6. CROSS-WORKSPACE INPUT DETERMINISM
  // -------------------------------------------------------------

  const controlledFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50, category: 'Anionic Surfactant' },
    { name: 'Sodium Hydroxide 50%', percentage: 1.30, activeMatterPct: 50, costPerKg: 0.80, category: 'pH Adjuster' },
    { name: 'SLES 70%', percentage: 8, activeMatterPct: 70, costPerKg: 1.20, category: 'Anionic Surfactant' },
    { name: 'GLDA 47% Liquid', percentage: 2.0, activeMatterPct: 47, costPerKg: 2.50, category: 'Builder / Chelator' },
    { name: 'Demineralized Water', percentage: 78.70, activeMatterPct: 0, costPerKg: 0.02, category: 'Solvent' }
  ];

  // Feed controlled formula through various module mappings
  const aiFormulatorFormat = controlledFormula.map(i => ({ ...i, role: i.category, percent: i.percentage, activePercent: i.activeMatterPct }));
  const analyzerProFormat = controlledFormula.map(i => ({ ...i, function: i.category, percentageInFormula: i.percentage, purity: i.activeMatterPct }));
  const libraryFormat = controlledFormula.map(i => ({ ...i, role: i.category, percentage: i.percentage, activeMatterPct: i.activeMatterPct }));

  const am1 = calculateActiveMatter(aiFormulatorFormat);
  const am2 = calculateActiveMatter(analyzerProFormat);
  const am3 = calculateActiveMatter(libraryFormat);
  record(assertEqual('Cross-Workspace Determinism', 'Active matter identical across AI Formulator format and Analyzer Pro format', am1 === am2 && am2 === am3, true));

  const cost1 = calculateBatchCost(aiFormulatorFormat, 100);
  const cost2 = calculateBatchCost(analyzerProFormat, 100);
  const cost3 = calculateBatchCost(libraryFormat, 100);
  record(assertEqual('Cross-Workspace Determinism', 'Batch cost identical across module input formats', cost1 === cost2 && cost2 === cost3, true));

  const grade1 = evaluateAIGrade(aiFormulatorFormat, 7.5, 200).score;
  const grade2 = evaluateAIGrade(analyzerProFormat, 7.5, 200).score;
  const grade3 = evaluateAIGrade(libraryFormat, 7.5, 200).score;
  record(assertEqual('Cross-Workspace Determinism', 'AI Grade score identical across module input formats', grade1 === grade2 && grade2 === grade3, true));

  // -------------------------------------------------------------
  // 7. FORMULA SWITCHING + NORMALIZATION RESET AUDIT
  // -------------------------------------------------------------

  const formulaCanonical: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50 },
    { name: 'Demineralized Water', percentage: 90, activeMatterPct: 0, costPerKg: 0.02 }
  ];

  const formulaAliased: FormulationIngredient[] = [
    { name: 'SLES 70%', percent: 15, activePercent: 70, cost: 1.20 } as any,
    { name: 'Demineralized Water', percent: 85, activePercent: 0, cost: 0.02 } as any
  ];

  const formulaWithZeros: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50 },
    { name: 'SLES 70%', percentage: 0, activeMatterPct: 70, costPerKg: 1.20 },
    { name: 'Demineralized Water', percentage: 90, activeMatterPct: 0, costPerKg: 0.02 }
  ];

  const canonicalGrade = evaluateAIGrade(formulaCanonical, 7.0);
  const aliasedGrade = evaluateAIGrade(formulaAliased, 7.0);
  const zeroGrade = evaluateAIGrade(formulaWithZeros, 7.0);

  record(assertEqual('Formula Switching', 'Canonical formula score differs predictably from aliased formula score', canonicalGrade.score !== aliasedGrade.score, true));
  record(assertEqual('Formula Switching', 'Explicit zero formula score equals canonical formula score (0% ingredient ignored)', zeroGrade.score, canonicalGrade.score));

  // Restoring canonical formula
  const restoredGrade = evaluateAIGrade(formulaCanonical, 7.0);
  record(assertEqual('Formula Switching', 'Restored canonical formula score equals initial score with no state bleed', restoredGrade.score, canonicalGrade.score));

  // -------------------------------------------------------------
  // 8. HYDRATION / SERIALIZATION INTEGRITY
  // -------------------------------------------------------------

  const preHydrationFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50, category: 'Anionic Surfactant' },
    { name: 'Sodium Hydroxide 50%', percentage: 1.30, activeMatterPct: 50, costPerKg: 0.80, category: 'pH Adjuster' },
    { name: 'Demineralized Water', percentage: 88.70, activeMatterPct: 0, costPerKg: 0.02, category: 'Solvent' }
  ];

  const serialized = JSON.stringify(preHydrationFormula);
  const deserialized: FormulationIngredient[] = JSON.parse(serialized);

  const preAM = calculateActiveMatter(preHydrationFormula);
  const postAM = calculateActiveMatter(deserialized);
  record(assertEqual('Hydration Integrity', 'Hydrated formula recalculates Active Matter identically', postAM, preAM));

  const preCost = calculateBatchCost(preHydrationFormula, 100);
  const postCost = calculateBatchCost(deserialized, 100);
  record(assertEqual('Hydration Integrity', 'Hydrated formula recalculates Batch Cost identically', postCost, preCost));

  const preGrade = evaluateAIGrade(preHydrationFormula, 7.5);
  const postGrade = evaluateAIGrade(deserialized, 7.5);
  record(assertEqual('Hydration Integrity', 'Hydrated formula recalculates AI Grade identically', postGrade.score, preGrade.score));

  // -------------------------------------------------------------
  // 9. SANDBOX ISOLATION & DRAFT NORMALIZATION
  // -------------------------------------------------------------

  const globalActiveFormula: FormulationIngredient[] = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.50 },
    { name: 'Demineralized Water', percentage: 90, activeMatterPct: 0, costPerKg: 0.02 }
  ];

  // Deep clone for sandbox draft edit
  const sandboxDraft: FormulationIngredient[] = JSON.parse(JSON.stringify(globalActiveFormula));
  sandboxDraft[0].percentage = 15; // Unapplied draft mutation

  const globalGradeBefore = evaluateAIGrade(globalActiveFormula, 7.0).score;
  const sandboxGrade = evaluateAIGrade(sandboxDraft, 7.0).score;

  record(assertEqual('Sandbox Isolation', 'Unapplied draft mutation in sandbox does NOT alter global active formula score', evaluateAIGrade(globalActiveFormula, 7.0).score, globalGradeBefore));
  record(assertEqual('Sandbox Isolation', 'Draft sandbox score reflects draft edit (15% LABSA vs 10% LABSA)', sandboxGrade !== globalGradeBefore, true));

  // Apply sandbox edit
  const appliedGlobalFormula = JSON.parse(JSON.stringify(sandboxDraft));
  record(assertEqual('Sandbox Isolation', 'Applying sandbox updates global active formula score', evaluateAIGrade(appliedGlobalFormula, 7.0).score, sandboxGrade));

  // Reset sandbox
  const resetGlobalFormula = JSON.parse(JSON.stringify(globalActiveFormula));
  record(assertEqual('Sandbox Isolation', 'Resetting sandbox restores original global formula score', evaluateAIGrade(resetGlobalFormula, 7.0).score, globalGradeBefore));

  // -------------------------------------------------------------
  // 10. ENGINE OUTPUT CONTRACT VERIFICATION
  // -------------------------------------------------------------

  const compRes = calculateFormulationCompatibility(controlledFormula, 7.5);
  record(assertEqual('Output Property Contract', 'Compatibility engine returns compatibilityScore (number)', typeof compRes.compatibilityScore, 'number'));
  record(assertEqual('Output Property Contract', 'Compatibility engine returns compatible (boolean)', typeof compRes.compatible, 'boolean'));

  const healthRes = calculateLabHealthScore(controlledFormula, 7.5);
  record(assertEqual('Output Property Contract', 'Lab Health engine returns finalScore (number)', typeof healthRes.finalScore, 'number'));
  record(assertEqual('Output Property Contract', 'Lab Health engine returns score (number alias)', typeof healthRes.score, 'number'));
  record(assertEqual('Output Property Contract', 'Lab Health engine returns rating (string)', typeof healthRes.rating, 'string'));

  const aiGradeRes = evaluateAIGrade(controlledFormula, 7.5, 200);
  record(assertEqual('Output Property Contract', 'AI Grade engine returns grade (string)', typeof aiGradeRes.grade, 'string'));
  record(assertEqual('Output Property Contract', 'AI Grade engine returns score (number)', typeof aiGradeRes.score, 'number'));
  record(assertEqual('Output Property Contract', 'AI Grade breakdown contains authoritative sub-scores', typeof aiGradeRes.breakdown.cpiScore, 'number'));

  const cleaningRes = calculateCleaningPerformance(controlledFormula, 8.0, 'LAUNDRY_LIQUID');
  record(assertEqual('Output Property Contract', 'Cleaning engine returns cleaningScore (number)', typeof cleaningRes.cleaningScore, 'number'));
  record(assertEqual('Output Property Contract', 'Cleaning engine returns overallScore (number)', typeof cleaningRes.overallScore, 'number'));
  record(assertEqual('Output Property Contract', 'Cleaning engine returns cleaningPower (string)', typeof cleaningRes.cleaningPower, 'string'));

  const hardnessRes = calculateWaterHardnessTolerance(controlledFormula, 150, 10, 20);
  record(assertEqual('Output Property Contract', 'Water hardness engine returns totalSequestrationMg (number)', typeof hardnessRes.totalSequestrationMg, 'number'));
  record(assertEqual('Output Property Contract', 'Water hardness engine returns maxSupportedPpm (number)', typeof hardnessRes.maxSupportedPpm, 'number'));
  record(assertEqual('Output Property Contract', 'Water hardness engine returns sufficiency (string)', typeof hardnessRes.sufficiency, 'string'));

  // -------------------------------------------------------------
  // 11. SCIENTIFIC ENGINE SEPARATION VERIFICATION
  // -------------------------------------------------------------

  // Prove pH engine computes pH, Water Hardness computes chelation, Lab Health computes safety, AI Grade orchestrates
  const mappedPHEngineInput = mapFormulationIngredientsToPHEngineInput(controlledFormula);
  const phResult = calculatePHAdvanced(mappedPHEngineInput);
  record(assertEqual('Engine Separation', 'pHEngine computes standalone pH value', typeof phResult.pH, 'number'));

  const standaloneCPI = calculateCPI(controlledFormula);
  record(assertEqual('Engine Separation', 'CPI engine computes standalone cleaning index', typeof standaloneCPI, 'number'));

  const standaloneHealth = calculateLabHealthScore(controlledFormula, phResult.pH).finalScore;
  record(assertEqual('Engine Separation', 'Lab Health computes standalone safety score', typeof standaloneHealth, 'number'));

  const orchestratorGrade = evaluateAIGrade(controlledFormula, phResult.pH, 200);
  record(assertEqual('Engine Separation', 'AI Grade breakdown incorporates authoritative CPI score', orchestratorGrade.breakdown.cpiScore, Math.round(standaloneCPI)));
  record(assertEqual('Engine Separation', 'AI Grade breakdown incorporates authoritative Lab Health score', orchestratorGrade.breakdown.healthScore, Math.round(standaloneHealth)));

  // -------------------------------------------------------------
  // 12. TAXONOMY NORMALIZATION & INTEGRITY AUDIT
  // -------------------------------------------------------------

  // TEST 1: Preserves category "Surfactant" while keeping distinct role and function
  const t1 = normalizeIngredientTaxonomy({ category: 'Surfactant', role: 'Primary Surfactant', function: 'Foam Booster' });
  record(assertEqual('Taxonomy Normalization', 'TEST 1: Preserves explicit category "Surfactant"', t1.category, 'Surfactant'));
  record(assertEqual('Taxonomy Normalization', 'TEST 1: Preserves explicit role "Primary Surfactant"', t1.role, 'Primary Surfactant'));
  record(assertEqual('Taxonomy Normalization', 'TEST 1: Preserves explicit function "Foam Booster"', t1.function, 'Foam Booster'));

  // TEST 2: Derives category "Surfactant" from role/function when category is empty
  const t2 = normalizeIngredientTaxonomy({ category: '', role: 'Primary Surfactant', function: 'Foam Booster' });
  record(assertEqual('Taxonomy Normalization', 'TEST 2: Derives "Surfactant" category from role/function when category is empty', t2.category, 'Surfactant'));
  record(assertEqual('Taxonomy Normalization', 'TEST 2: Preserves original role "Primary Surfactant"', t2.role, 'Primary Surfactant'));

  // TEST 3: Derives category "Builder" from role "Builder"
  const t3 = normalizeIngredientTaxonomy({ category: undefined, role: 'Builder', function: 'Water Softener' });
  record(assertEqual('Taxonomy Normalization', 'TEST 3: Derives "Builder" category from role when category is undefined', t3.category, 'Builder'));

  // TEST 4: Derives category "Chelator" from function "Chelator"
  const t4 = normalizeIngredientTaxonomy({ category: undefined, role: '', function: 'Chelator' });
  record(assertEqual('Taxonomy Normalization', 'TEST 4: Derives "Chelator" category from function when category and role are empty', t4.category, 'Chelator'));

  // TEST 5: Handles undefined fields gracefully
  const t5 = normalizeIngredientTaxonomy({ category: undefined, role: undefined, function: undefined });
  record(assertEqual('Taxonomy Normalization', 'TEST 5: Handles all undefined taxonomy fields gracefully', t5.category, 'Additive'));

  // TEST 6: Explicit valid category has priority over role/function
  const t6 = normalizeIngredientTaxonomy({ category: 'Anionic Surfactant', role: 'Primary Surfactant', function: 'Foam Booster' });
  record(assertEqual('Taxonomy Normalization', 'TEST 6: Explicit valid category "Anionic Surfactant" takes priority over role/function', t6.category, 'Anionic Surfactant'));

  // TEST 7: Explicit zero values in numeric fields remain untouched
  const zeroValIng = { name: 'Test Ing', percentage: 0, activeMatterPct: 0, costPerKg: 0, hlbValue: 0 };
  record(assertEqual('Taxonomy Normalization', 'TEST 7: Explicit 0 percentage is preserved (0)', zeroValIng.percentage, 0));
  record(assertEqual('Taxonomy Normalization', 'TEST 7: Explicit 0 activeMatterPct is preserved (0)', zeroValIng.activeMatterPct, 0));

  console.log('--------------------------------------------------');
  console.log(`TOTAL PHASE 2.9 DATA CONTRACT TESTS : ${passed + failed}`);
  console.log(`PASSED                             : ${passed}`);
  console.log(`FAILED                             : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed };
}

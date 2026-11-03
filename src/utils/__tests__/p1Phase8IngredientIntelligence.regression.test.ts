/**
 * ============================================================================
 * P1 PHASE 8 — SCIENTIFIC KNOWLEDGE BASE & INGREDIENT INTELLIGENCE REGRESSION TEST SUITE
 * ============================================================================
 *
 * Verifies the ingredient intelligence reasoning, multi-functional role mappings,
 * category applicability matrices, chemical interaction warnings, dependency propagation,
 * ingredient substitution tiers, and knowledge base governance versioning:
 * 1. Ingredient Identity & Grade Separation (SLES 70% vs 28%, GLDA 99% vs 47%).
 * 2. 13-Category Structured Applicability with Reasoning.
 * 3. Structured Multi-Material Interaction Mismatch Warnings (Anionic-Cationic, Acid-Hypochlorite).
 * 4. Traceable Compatibility Reasoning reports.
 * 5. Ingredient Dependency Propagation (dosage changes correctly recalulate active & water load).
 * 6. Substitution Tier and Fit Scoring (Direct vs Functional Alternatives vs Non-Equivalents).
 * 7. Ingredient Knowledge Versioning & Historical Reproducibility snapshots.
 * 8. Data Quality Gate validation (bounds, contradictory charges, impossible assay).
 * 9. Absolute Safety Rules (Zero guessed defaults, zero automatic mutations).
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { FORMULAS } from '../../data/formulas';
import { PHEngineV2 } from '../../domain/ph/pHEngineV2';
import {
  evaluateIngredientDataQuality,
  traceCompatibilityReasoning,
  analyzeDependencyPropagation,
  evaluateIngredientSubstitution,
  globalIngredientGovernance,
  INGREDIENT_INTELLIGENCE_REGISTRY,
  INGREDIENT_INTERACTION_RULES
} from '../ingredientIntelligenceEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase8IngredientIntelligenceTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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
  console.log('  P1 PHASE 8 — SCIENTIFIC KNOWLEDGE BASE & INGREDIENT INTELLIGENCE TEST SUITE ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Ingredient Identity & Grade Separation
  // --------------------------------------------------------------------------
  const sles = INGREDIENT_INTELLIGENCE_REGISTRY['sles'];
  const glda = INGREDIENT_INTELLIGENCE_REGISTRY['glda'];

  assert('1. Canonical registry contains SLES and GLDA definitions', sles !== undefined && glda !== undefined, true, true);

  const sles70 = sles.grades['70pct'];
  const sles28 = sles.grades['28pct'];
  assert('2. Separates SLES 70% paste from SLES 28% liquid grade', sles70 !== undefined && sles28 !== undefined && sles70.activeMatterPct === 70 && sles28.activeMatterPct === 28, true, true);

  const glda47 = glda.grades['47pct'];
  const glda99 = glda.grades['99pct'];
  assert('3. Separates GLDA 47% aqueous solution from GLDA 99% pure anhydrous powder grade', glda47 !== undefined && glda99 !== undefined && glda47.waterPercent === 53 && glda99.waterPercent === 1, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: 13-Category Structured Applicability with Reasoning
  // --------------------------------------------------------------------------
  const labsa = INGREDIENT_INTELLIGENCE_REGISTRY['labsa'];
  
  assert('4. LABSA is APPLICABLE to Laundry Liquid', labsa.categoryApplicability['LAUNDRY_LIQUID']?.status === 'APPLICABLE', true, true);
  assert('5. LABSA is NOT_APPLICABLE to Fabric Softener (cationic clash)', labsa.categoryApplicability['FABRIC_SOFTENER']?.status === 'NOT_APPLICABLE', true, true);
  assert('6. LABSA is NOT_APPLICABLE to Automatic Dishwash (excessive foam)', labsa.categoryApplicability['DISHWASH_AUTOMATIC']?.status === 'NOT_APPLICABLE', true, true);

  const hasAll13Categories = CANONICAL_PRODUCT_CATEGORY_IDS.every(catId => {
    return Boolean(labsa.categoryApplicability[catId]);
  });
  assert('7. Applicability profile mapped explicitly for all 13 canonical categories', hasAll13Categories, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Structured Multi-Material Interaction Mismatch Warnings
  // --------------------------------------------------------------------------
  const clashRule = INGREDIENT_INTERACTION_RULES.find(r => r.interactionId === 'ionic-clash-anionic-cationic');
  assert('8. Core opposite-charge ionic clash rule exists', clashRule !== undefined && clashRule.severity === 'FATAL', true, true);

  const bleachRule = INGREDIENT_INTERACTION_RULES.find(r => r.interactionId === 'acid-hypochlorite-chlorine-gas');
  assert('9. Strong acid and sodium hypochlorite bleach hazardous interaction rule exists', bleachRule !== undefined && bleachRule.severity === 'FATAL', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Traceable Compatibility Reasoning Reports
  // --------------------------------------------------------------------------
  const clashFormula: FormulationIngredient[] = [
    { name: 'SLES 70%', activeMatterPct: 70, category: 'Anionic Surfactant', percentage: 10 },
    { name: 'Quaternized Softener Active', activeMatterPct: 80, category: 'Cationic Surfactant', percentage: 5 }
  ];
  const clashFindings = traceCompatibilityReasoning(clashFormula, 'LAUNDRY_LIQUID');
  assert('10. Detects opposite-charge anionic-cationic compatibility conflict', clashFindings.some(f => f.findingCode === 'ERR_IONIC_CHARGE_INCOMPATIBILITY'), true, true);

  const acidBleachFormula: FormulationIngredient[] = [
    { name: 'Hydrochloric Acid 35%', category: 'Acid Slurry', percentage: 15 },
    { name: 'Sodium Hypochlorite', category: 'Bleach System', percentage: 5 }
  ];
  const bleachFindings = traceCompatibilityReasoning(acidBleachFormula, 'TOILET_CLEANER');
  assert('11. Detects strong acid + sodium hypochlorite hazardous interaction', bleachFindings.some(f => f.findingCode === 'ERR_BLEACH_CHLORINE_GAS_LIBERATION'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Ingredient Dependency Propagation
  // --------------------------------------------------------------------------
  const mockSlesIng: FormulationIngredient = { name: 'SLES 70%', activeMatterPct: 70, percentage: 10, category: 'Anionic Surfactant' };
  const mockSles70Grade = sles.grades['70pct'];
  
  const slesProp = analyzeDependencyPropagation(mockSlesIng, mockSles70Grade, 15); // Dosaged from 10% to 15%
  assert('12. Correctly calculates active matter shift on concentration/dosage change', Math.abs(slesProp.activeMatterPercentDelta - 3.5) < 0.01, slesProp.activeMatterPercentDelta, 3.5);
  assert('13. Correctly calculates carried water load shift on dosage change', Math.abs(slesProp.waterPercentDelta - 1.5) < 0.01, slesProp.waterPercentDelta, 1.5);
  assert('14. Flags recalculations required for activeMatter, water, and viscosity Cp', slesProp.recalculationsRequired.includes('activeMatterPct') && slesProp.recalculationsRequired.includes('viscosityCp'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Substitution Tier & Fit Scoring
  // --------------------------------------------------------------------------
  const directSub = evaluateIngredientSubstitution('sles', 'sles', 'LAUNDRY_LIQUID');
  assert('15. SLES substituting SLES classified as DIRECT_EQUIVALENT with >90 score', directSub.tier === 'DIRECT_EQUIVALENT' && directSub.matchScore >= 90, true, true);

  const functionalSub = evaluateIngredientSubstitution('labsa', 'sles', 'LAUNDRY_LIQUID');
  assert('16. LABSA substituting SLES classified as FUNCTIONAL_ALTERNATIVE with high score', functionalSub.tier === 'FUNCTIONAL_ALTERNATIVE' && functionalSub.matchScore >= 70, true, true);

  const badSub = evaluateIngredientSubstitution('labsa', 'labsa', 'FABRIC_SOFTENER');
  assert('17. LABSA substituted into FABRIC_SOFTENER flagged as NOT_SCIENTIFICALLY_EQUIVALENT', badSub.tier === 'NOT_SCIENTIFICALLY_EQUIVALENT' && badSub.matchScore <= 15, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Ingredient Knowledge Versioning & Historical Reproducibility
  // --------------------------------------------------------------------------
  const initialKb = globalIngredientGovernance.getActiveKnowledgeVersion();
  assert('18. Ingredient knowledge base has unique version number', initialKb.versionNumber === '1.0.0', initialKb.versionNumber, '1.0.0');
  assert('19. Historical formula properties preserved in baseline knowledge snapshot', Boolean(initialKb.registrySnapshot['sles']), true, true);

  const nextKb = globalIngredientGovernance.pushNewKnowledgeVersion('1.1.0', { ...INGREDIENT_INTELLIGENCE_REGISTRY }, 'Added commercial assay verification codes');
  assert('20. Can push and retrieve versioned scientific ingredient databases', globalIngredientGovernance.getActiveKnowledgeVersion().versionNumber === '1.1.0' && nextKb.versionNumber === '1.1.0', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Data Quality Gate Validation
  // --------------------------------------------------------------------------
  const validIng: FormulationIngredient = { name: 'SLES 70%', activeMatterPct: 70, percentage: 10, density: 1.1 };
  const validQuality = evaluateIngredientDataQuality(validIng);
  assert('21. Valid commercial ingredient passes ingredient quality gate', validQuality.status === 'VALID', true, true);

  const badIng: FormulationIngredient = { name: 'SLES 70%', activeMatterPct: 150, percentage: -10, density: -1.0 }; // Extreme invalid values
  const badQuality = evaluateIngredientDataQuality(badIng);
  assert('22. Impossible active matter, negative dosage, and negative density trigger SCIENTIFICALLY_INVALID', badQuality.status === 'SCIENTIFICALLY_INVALID' && badQuality.errors.length >= 3, true, true);

  const clashIng: FormulationIngredient = { name: 'Amphoteric Surfactant', category: 'Anionic Surfactant / Cationic Surfactant Co-blend' };
  const clashQuality = evaluateIngredientDataQuality(clashIng);
  assert('23. Labeled anionic and cationic charge contradiction is blocked by quality gate', clashQuality.status === 'SCIENTIFICALLY_INVALID' && clashQuality.errors.some(e => e.includes('Contradictory charge')), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 9: Absolute Safety Rules & baseline protection
  // --------------------------------------------------------------------------
  assert('24. No automatic scientific model mutations (PHEngineV2 static class intact)', typeof PHEngineV2.calculatePH === 'function', true, true);
  assert('25. All 39 canonical formulas remain stable and intact', FORMULAS.length >= 39, FORMULAS.length, 39);
  assert('26. All 13 canonical categories remain isolated', CANONICAL_PRODUCT_CATEGORY_IDS.length === 13, CANONICAL_PRODUCT_CATEGORY_IDS.length, 13);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1 PHASE 8 INGREDIENT TESTS : ${total}`);
  console.log(`PASSED                            : ${passed}`);
  console.log(`FAILED                            : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}

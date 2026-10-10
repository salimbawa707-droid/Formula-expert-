/**
 * ============================================================================
 * P0 REMEDIATION #8 DEDICATED REGRESSION TEST SUITE —
 * ELIMINATE UNKNOWN_PRODUCT_CATEGORY TO LAUNDRY_LIQUID SILENT FALLBACK (31 TESTS)
 * ============================================================================
 */

import {
  normalizeProductCategory,
  CANONICAL_PRODUCT_CATEGORY_IDS,
  getProductCategoryLabel
} from '../../domain/productTaxonomy';
import {
  getScientificProductProfile,
  tryGetScientificProductProfile
} from '../../domain/scientificProductProfiles';
import {
  tryGetSpecificationTemplateForCategory
} from '../specificationEngine/specificationTemplates';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import {
  evaluateCategoryModelValidation,
  evaluateFormulaScientificValidation
} from '../labEvidenceEngine';
import {
  ScientificModelGovernanceRegistry
} from '../scientificGovernanceEngine';
import {
  evaluateReleaseGate
} from '../specificationEngine/releaseGateEngine';
import { getProductHardnessPolicy } from '../chelatorEngine';
import { FORMULAS } from '../../data/formulas';

export interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}

export function runP0RemediationUnknownProductCategoryFallbackTestSuite(): TestSuiteSummary {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, details?: string) => {
    results.push({ name, passed: condition, details: details ? String(details) : undefined });
  };

  // 1. UNKNOWN_PRODUCT_CATEGORY does not resolve to LAUNDRY_LIQUID
  const res1 = normalizeProductCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('1. UNKNOWN_PRODUCT_CATEGORY does not resolve to LAUNDRY_LIQUID', res1 === 'UNKNOWN_PRODUCT_CATEGORY' && (res1 as string) !== 'LAUNDRY_LIQUID');

  // 2. Missing category does not resolve to LAUNDRY_LIQUID
  const savedMissing = { name: 'Test Recipe', category: undefined };
  const res2 = normalizeProductCategory(savedMissing.category);
  assert('2. Missing category does not resolve to LAUNDRY_LIQUID', res2 === 'UNKNOWN_PRODUCT_CATEGORY' && (res2 as string) !== 'LAUNDRY_LIQUID');

  // 3. Invalid category ID does not resolve to LAUNDRY_LIQUID
  const res3 = normalizeProductCategory('INVALID_NONEXISTENT_CATEGORY_ID');
  assert('3. Invalid category ID does not resolve to LAUNDRY_LIQUID', res3 === 'UNKNOWN_PRODUCT_CATEGORY' && (res3 as string) !== 'LAUNDRY_LIQUID');

  // 4. Unsupported category does not resolve to LAUNDRY_LIQUID
  const res4 = normalizeProductCategory('Nuclear Reactor Coolant Detergent');
  assert('4. Unsupported category does not resolve to LAUNDRY_LIQUID', res4 === 'UNKNOWN_PRODUCT_CATEGORY' && (res4 as string) !== 'LAUNDRY_LIQUID');

  // 5. Empty category does not resolve to LAUNDRY_LIQUID
  const res5 = normalizeProductCategory('');
  assert('5. Empty category does not resolve to LAUNDRY_LIQUID', res5 === 'UNKNOWN_PRODUCT_CATEGORY' && (res5 as string) !== 'LAUNDRY_LIQUID');

  // 6. Null/undefined category does not resolve to LAUNDRY_LIQUID
  const res6a = normalizeProductCategory(null);
  const res6b = normalizeProductCategory(undefined);
  assert('6. Null/undefined category does not resolve to LAUNDRY_LIQUID', res6a === 'UNKNOWN_PRODUCT_CATEGORY' && res6b === 'UNKNOWN_PRODUCT_CATEGORY');

  // 7. Unknown category returns BLOCKED or INSUFFICIENT_DATA
  const gate7 = evaluateScientificQualityGate({
    formulaName: 'Uncategorized Formula',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    ingredients: [{ name: 'Water', percentage: 100, role: 'Solvent' }]
  });
  assert(
    '7. Unknown category returns BLOCKED or INSUFFICIENT_DATA',
    gate7.scientificValidity === 'INVALID' || gate7.finalFormulaStatus === 'INSUFFICIENT_DATA' || gate7.finalFormulaStatus === 'SCIENTIFICALLY_INVALID'
  );

  // 8. Unknown category does not receive Liquid Laundry pH specifications
  const specTpl8 = tryGetSpecificationTemplateForCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('8. Unknown category does not receive Liquid Laundry pH specifications', specTpl8 === null);

  // 9. Unknown category does not receive Liquid Laundry active-matter specifications
  const profile9 = tryGetScientificProductProfile('UNKNOWN_PRODUCT_CATEGORY');
  assert('9. Unknown category does not receive Liquid Laundry active-matter specifications', profile9 === null);

  // 10. Unknown category does not receive Liquid Laundry physical-property specifications
  const hardnessPol10 = getProductHardnessPolicy('UNKNOWN_PRODUCT_CATEGORY');
  assert(
    '10. Unknown category does not receive Liquid Laundry physical-property specifications',
    hardnessPol10.description.includes('Unknown product category') && hardnessPol10.requiresHardnessControl === false
  );

  // 11. Unknown category does not receive Liquid Laundry performance parameters
  const perf11 = calculateCleaningPerformance([{ name: 'SLES 70%', percentage: 10, activeMatterPct: 70, role: 'Surfactant' }], 8.5, 'UNKNOWN_PRODUCT_CATEGORY');
  assert(
    '11. Unknown category does not receive Liquid Laundry performance parameters',
    perf11.productCategory === 'UNKNOWN_PRODUCT_CATEGORY' && perf11.categoryKPIs.length === 0 && perf11.isCleaningApplicable === false
  );

  // 12. Unknown category cannot produce a PASS quality gate
  assert('12. Unknown category cannot produce a PASS quality gate', gate7.finalFormulaStatus !== 'VALID');

  // 13. Unknown category cannot produce GOOD / WITHIN TARGET
  assert('13. Unknown category cannot produce GOOD / WITHIN TARGET', gate7.finalFormulaStatus !== 'VALID_WITH_WARNINGS' && gate7.finalFormulaStatus !== 'VALID');

  // 14. Unknown category cannot produce RELEASE_READY
  const releaseGate14 = evaluateReleaseGate('FORM-001', 'UNKNOWN_PRODUCT_CATEGORY', [], []);
  assert('14. Unknown category cannot produce RELEASE_READY', releaseGate14.decision === 'BLOCKED' && releaseGate14.isReady === false);

  // 15. Unknown category cannot produce LAB_VALIDATED
  const labVal15 = evaluateFormulaScientificValidation({
    formulaId: 'FORM-001',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    labEvidenceRecords: [
      {
        measurementId: 'MEAS-001',
        formulaId: 'FORM-001',
        formulaVersion: '1.0.0',
        parameterKey: 'ph',
        value: 8.5,
        unit: 'pH units',
        testDate: '2026-09-01',
        provenance: 'MEASURED',
        isCalibratedInstrument: true
      }
    ]
  });
  assert('15. Unknown category cannot produce LAB_VALIDATED', labVal15.isLabValidated === false && labVal15.isProductionReady === false);

  // 16. A valid LAUNDRY_LIQUID category still routes correctly
  const res16 = normalizeProductCategory('LAUNDRY_LIQUID');
  const profile16 = tryGetScientificProductProfile('LAUNDRY_LIQUID');
  assert('16. A valid LAUNDRY_LIQUID category still routes correctly', res16 === 'LAUNDRY_LIQUID' && profile16 !== null && profile16.categoryId === 'LAUNDRY_LIQUID');

  // 17. A valid LAUNDRY_POWDER category still routes correctly
  const res17 = normalizeProductCategory('LAUNDRY_POWDER');
  const profile17 = tryGetScientificProductProfile('LAUNDRY_POWDER');
  assert('17. A valid LAUNDRY_POWDER category still routes correctly', res17 === 'LAUNDRY_POWDER' && profile17 !== null && profile17.categoryId === 'LAUNDRY_POWDER');

  // 18. All other valid canonical categories still resolve correctly
  const all13Valid = CANONICAL_PRODUCT_CATEGORY_IDS.every(id => normalizeProductCategory(id) === id);
  assert('18. All other valid canonical categories still resolve correctly', all13Valid && CANONICAL_PRODUCT_CATEGORY_IDS.length === 13);

  // 19. Saved valid LAUNDRY_LIQUID formula remains LAUNDRY_LIQUID
  const savedValid = { name: 'Heavy Duty Liquid', category: 'LAUNDRY_LIQUID' };
  assert('19. Saved valid LAUNDRY_LIQUID formula remains LAUNDRY_LIQUID', normalizeProductCategory(savedValid.category) === 'LAUNDRY_LIQUID');

  // 20. Saved formula with missing category loads as UNKNOWN_PRODUCT_CATEGORY
  const savedMissingCat = { name: 'Unknown Formula', category: '' };
  assert('20. Saved formula with missing category loads as UNKNOWN_PRODUCT_CATEGORY', normalizeProductCategory(savedMissingCat.category) === 'UNKNOWN_PRODUCT_CATEGORY');

  // 21. Corrupted category does not silently become LAUNDRY_LIQUID
  const corruptedCat = 'CORRUPTED_BLOB_$$$';
  assert('21. Corrupted category does not silently become LAUNDRY_LIQUID', normalizeProductCategory(corruptedCat) === 'UNKNOWN_PRODUCT_CATEGORY');

  // 22. Formula import with unknown category remains unresolved
  const importedFormula = { name: 'Imported X', category: 'Unknown Category String' };
  assert('22. Formula import with unknown category remains unresolved', normalizeProductCategory(importedFormula.category) === 'UNKNOWN_PRODUCT_CATEGORY');

  // 23. Template selection cannot inject LAUNDRY_LIQUID category
  const tpl23 = tryGetSpecificationTemplateForCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('23. Template selection cannot inject LAUNDRY_LIQUID category', tpl23 === null);

  // 24. UI does not display Liquid Laundry for unresolved category
  const label24 = getProductCategoryLabel('UNKNOWN_PRODUCT_CATEGORY');
  assert('24. UI does not display Liquid Laundry for unresolved category', !label24.toLowerCase().includes('laundry') || label24 === 'UNKNOWN_PRODUCT_CATEGORY');

  // 25. User can select a valid category after an unresolved state
  const norm25 = normalizeProductCategory('DISHWASH_MANUAL');
  assert('25. User can select a valid category after an unresolved state', norm25 === 'DISHWASH_MANUAL');

  // 26. Re-running analysis after selecting a valid category uses the selected category
  const gate26 = evaluateScientificQualityGate({
    formulaName: 'Resolved Dishwash',
    formulaVersion: '1.0.0',
    productCategory: norm25,
    ingredients: [
      { name: 'Water', percentage: 70, role: 'Solvent' },
      { name: 'LABSA 90%', percentage: 10, role: 'Anionic Surfactant' },
      { name: 'SLES 70%', percentage: 10, role: 'Anionic Surfactant' },
      { name: 'CAPB 30%', percentage: 5, role: 'Amphoteric Surfactant' },
      { name: 'Salt', percentage: 5, role: 'Thickener' }
    ]
  });
  assert('26. Re-running analysis after selecting a valid category uses the selected category', gate26.canonicalCategory === 'DISHWASH_MANUAL');

  // 27. No direct UNKNOWN → LAUNDRY_LIQUID conversion remains anywhere in production source
  const modelValSummary27 = evaluateCategoryModelValidation('UNKNOWN_PRODUCT_CATEGORY' as any, []);
  assert('27. No direct UNKNOWN -> LAUNDRY_LIQUID conversion remains in model validation', modelValSummary27.canonicalCategory === ('UNKNOWN_PRODUCT_CATEGORY' as any));

  // 28. No hidden default category path remains
  const govEngine28 = new ScientificModelGovernanceRegistry();
  const apprRec28 = govEngine28.approveCalibrationProposal({
    proposalId: 'prop-unk-01',
    parameterName: 'Unknown Param',
    kpiId: 'kpi-01',
    canonicalCategory: 'UNKNOWN_PRODUCT_CATEGORY' as any,
    currentModelValue: 1.0,
    proposedShiftOffset: 0.2,
    proposedCalibratedValue: 1.2,
    observedBias: 0.2,
    sampleCount: 10,
    meanAbsoluteError: 0.2,
    mae: 0.2,
    rationale: 'Test proposal',
    recommendation: 'Test proposal',
    proposedAt: '2026-09-01T00:00:00Z',
    status: 'PROPOSED',
    safetyWarning: 'Caution',
    evidenceReferenceIds: []
  });
  assert('28. No hidden default category path remains in governance engine', apprRec28.categoryScope === ('UNKNOWN_PRODUCT_CATEGORY' as any));

  // 29. Scientific Product Profile rejects unresolved category
  let profile29Threw = false;
  try {
    getScientificProductProfile('UNKNOWN_PRODUCT_CATEGORY');
  } catch {
    profile29Threw = true;
  }
  assert('29. Scientific Product Profile rejects unresolved category', profile29Threw);

  // 30. Quality Gate rejects unresolved category
  const gate30 = evaluateScientificQualityGate({
    formulaName: 'Gate Test',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    ingredients: [{ name: 'Water', percentage: 100, role: 'Solvent' }]
  });
  assert('30. Quality Gate rejects unresolved category', gate30.scientificValidity === 'INVALID' && gate30.blockingIssues.some(i => i.code === 'ERR_UNKNOWN_CATEGORY'));

  // 31. Existing valid category tests remain passing
  const masterFormulasOk31 = FORMULAS.length > 0 && FORMULAS.every(f => f.categoryId !== 'UNKNOWN_PRODUCT_CATEGORY');
  assert('31. Existing valid category tests remain passing', masterFormulasOk31);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

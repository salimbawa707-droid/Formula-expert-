/**
 * ============================================================================
 * P0 REMEDIATION #8 REGRESSION TEST SUITE — ELIMINATE UNKNOWN_PRODUCT_CATEGORY SILENT FALLBACK
 * ============================================================================
 */

import {
  normalizeProductCategory,
  validateProductCategory,
  CANONICAL_PRODUCT_CATEGORY_IDS
} from '../../domain/productTaxonomy';
import {
  getScientificProductProfile,
  tryGetScientificProductProfile
} from '../../domain/scientificProductProfiles';
import {
  getSpecificationTemplateForCategory,
  tryGetSpecificationTemplateForCategory
} from '../specificationEngine/specificationTemplates';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { calculateCleaningPerformance } from '../cleaningPerformanceEngine';
import {
  evaluateCategoryModelValidation,
  evaluateFormulaScientificValidation,
  checkMeasurementComparability,
  getCategoryRequiredLabBattery
} from '../labEvidenceEngine';
import {
  ScientificModelGovernanceRegistry,
  calculateModelChangeImpact
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

export function runP0RemediationUnknownProductCategoryTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, details?: string) => {
    results.push({ name, passed: condition, details: details ? String(details) : undefined });
  };

  // TEST 1: UNKNOWN_PRODUCT_CATEGORY does not resolve to LAUNDRY_LIQUID
  const res1 = normalizeProductCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 1: UNKNOWN_PRODUCT_CATEGORY does not resolve to LAUNDRY_LIQUID', res1 === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 2: Empty category does not resolve to LAUNDRY_LIQUID
  const res2 = normalizeProductCategory('');
  assert('TEST 2: Empty category does not resolve to LAUNDRY_LIQUID', res2 === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 3: Undefined category does not resolve to LAUNDRY_LIQUID
  const res3 = normalizeProductCategory(undefined);
  assert('TEST 3: Undefined category does not resolve to LAUNDRY_LIQUID', res3 === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 4: Null category does not resolve to LAUNDRY_LIQUID
  const res4 = normalizeProductCategory(null);
  assert('TEST 4: Null category does not resolve to LAUNDRY_LIQUID', res4 === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 5: Invalid category ID does not resolve to LAUNDRY_LIQUID
  const res5 = normalizeProductCategory('INVALID_NONEXISTENT_XYZ');
  assert('TEST 5: Invalid category ID does not resolve to LAUNDRY_LIQUID', res5 === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 6: Whitespace category does not resolve to LAUNDRY_LIQUID
  const res6 = normalizeProductCategory('    ');
  assert('TEST 6: Whitespace category does not resolve to LAUNDRY_LIQUID', res6 === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 7: Unknown category returns safe validation status in validateProductCategory
  const valRes = validateProductCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 7: Unknown category returns safe invalid status in validateProductCategory', valRes.valid === false && !!valRes.error);

  // TEST 8: Unknown category does not load Liquid Laundry profile
  let profileThrew = false;
  try {
    getScientificProductProfile('UNKNOWN_PRODUCT_CATEGORY');
  } catch {
    profileThrew = true;
  }
  const tryProfile = tryGetScientificProductProfile('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 8: Unknown category does not load Liquid Laundry profile', profileThrew && tryProfile === null);

  // TEST 9: Unknown category does not enter category-specific specification evaluation
  let specThrew = false;
  try {
    getSpecificationTemplateForCategory('UNKNOWN_PRODUCT_CATEGORY');
  } catch {
    specThrew = true;
  }
  const trySpec = tryGetSpecificationTemplateForCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 9: Unknown category does not load specification template', specThrew && trySpec === null);

  // TEST 10: Unknown category does not produce a normal category-specific PASS/VALID verdict in Quality Gate
  const gateUnknown = evaluateScientificQualityGate({
    formulaName: 'Test Unknown Formula',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    ingredients: [
      { name: 'Water', percentage: 80, role: 'Solvent' },
      { name: 'SLES 70%', percentage: 20, role: 'Surfactant' }
    ]
  });
  assert('TEST 10: Unknown category produces SCIENTIFICALLY_INVALID or blocked in Quality Gate', gateUnknown.scientificValidity === 'INVALID' && gateUnknown.blockingIssues.some(b => b.code === 'ERR_UNKNOWN_CATEGORY'));

  // TEST 11: Unknown category cannot qualify evidence for LAB_TESTED/LAB_VALIDATED
  const labValUnknown = evaluateFormulaScientificValidation({
    formulaId: 'F-TEST-001',
    formulaVersion: '1.0.0',
    productCategory: 'UNKNOWN_PRODUCT_CATEGORY',
    labEvidenceRecords: [
      {
        measurementId: 'MEAS-001',
        formulaId: 'F-TEST-001',
        formulaVersion: '1.0.0',
        parameterKey: 'pH',
        value: 7.5,
        unit: 'pH units',
        testDate: '2026-09-01',
        provenance: 'MEASURED',
        isCalibratedInstrument: true
      }
    ]
  });
  assert('TEST 11: Unknown category cannot qualify evidence for LAB_VALIDATED', labValUnknown.isLabValidated === false && labValUnknown.isProductionReady === false);

  // TEST 12: Saved formula with missing category remains unknown
  const savedMissingCat = { name: 'Legacy Formula', category: '' };
  assert('TEST 12: Saved formula with missing category remains unknown', normalizeProductCategory(savedMissingCat.category) === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 13: Saved formula with invalid category remains unknown
  const savedInvalidCat = { name: 'Legacy Formula 2', category: 'Space Rocket Cleaner' };
  assert('TEST 13: Saved formula with invalid category remains unknown', normalizeProductCategory(savedInvalidCat.category) === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 14: All 13 canonical categories resolve correctly
  const all13Pass = CANONICAL_PRODUCT_CATEGORY_IDS.every(catId => {
    const resolved = normalizeProductCategory(catId);
    return resolved === catId;
  });
  assert('TEST 14: All 13 canonical categories resolve correctly', all13Pass);

  // TEST 15: Category resolver is deterministic
  const det1 = normalizeProductCategory('hand wash');
  const det2 = normalizeProductCategory('hand wash');
  assert('TEST 15: Category resolver is deterministic', det1 === 'HAND_WASH' && det2 === 'HAND_WASH');

  // TEST 16: No category alias unexpectedly maps to LAUNDRY_LIQUID unless explicitly a laundry liquid alias
  const toiletAlias = normalizeProductCategory('toilet bowl cleaner');
  const carAlias = normalizeProductCategory('car wash shampoo');
  const glassAlias = normalizeProductCategory('window glass spray');
  assert('TEST 16: Aliases resolve to their exact canonical categories and never default to LAUNDRY_LIQUID', toiletAlias === 'TOILET_CLEANER' && carAlias === 'CAR_SHAMPOO' && glassAlias === 'GLASS_CLEANER');

  // TEST 17: Unknown category cannot bypass Scientific Quality Gate
  const gateMissing = evaluateScientificQualityGate({
    formulaName: 'Missing Cat Formula',
    formulaVersion: '1.0.0',
    productCategory: '',
    ingredients: [{ name: 'Water', percentage: 100, role: 'Solvent' }]
  });
  assert('TEST 17: Unknown category cannot bypass Scientific Quality Gate', gateMissing.finalFormulaStatus !== 'VALID');

  // TEST 18: Unknown category cannot bypass Release Gate
  const releaseGateQuick = evaluateReleaseGate('FORM-001', 'UNKNOWN_PRODUCT_CATEGORY', [], []);
  assert('TEST 18: Unknown category cannot bypass Release Gate', releaseGateQuick.decision === 'BLOCKED' && releaseGateQuick.status === 'BLOCKED_BY_UNKNOWN_CATEGORY');

  // TEST 19: Unknown category returns empty lab battery
  const reqBattery = getCategoryRequiredLabBattery('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 19: Unknown category returns empty lab battery', reqBattery.length === 0);

  // TEST 20: Unknown category remains unknown across serialization/deserialization
  const serialized = JSON.stringify({ category: normalizeProductCategory('UNKNOWN_PRODUCT_CATEGORY') });
  const parsed = JSON.parse(serialized);
  assert('TEST 20: Unknown category remains unknown across serialization/deserialization', parsed.category === 'UNKNOWN_PRODUCT_CATEGORY');

  // TEST 21: Cleaning performance engine handles UNKNOWN_PRODUCT_CATEGORY safely without loading LAUNDRY_LIQUID KPIs
  const perfUnknown = calculateCleaningPerformance([{ name: 'SLES 70%', percentage: 10, activeMatterPct: 70, role: 'Surfactant' }], 7.0, 'UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 21: Cleaning performance engine does not load LAUNDRY_LIQUID KPIs for UNKNOWN_PRODUCT_CATEGORY', perfUnknown.productCategory === 'UNKNOWN_PRODUCT_CATEGORY' && perfUnknown.categoryKPIs.length === 0 && !perfUnknown.primaryPerformanceDomain.includes('Fabric Detergency'));

  // TEST 22: Chelator hardness policy returns UNKNOWN_PRODUCT_CATEGORY policy without defaulting to LAUNDRY_LIQUID
  const hardnessPol = getProductHardnessPolicy('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 22: Chelator hardness policy returns UNKNOWN_PRODUCT_CATEGORY without defaulting to LAUNDRY_LIQUID', hardnessPol.description.includes('Unknown product category'));

  // TEST 23: Scientific governance engine rejects calibration proposal with UNKNOWN_PRODUCT_CATEGORY
  const govEngine = new ScientificModelGovernanceRegistry();
  const apprRec = govEngine.approveCalibrationProposal({
    proposalId: 'prop-test-01',
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
    rationale: 'Test recommendation',
    recommendation: 'Test recommendation',
    proposedAt: '2026-09-01T00:00:00Z',
    status: 'PROPOSED',
    safetyWarning: 'Caution',
    evidenceReferenceIds: []
  });
  assert('TEST 23: Scientific governance engine rejects calibration proposal with UNKNOWN_PRODUCT_CATEGORY', apprRec.approvalStatus === 'REJECTED');

  // TEST 24: Model change impact rejects UNKNOWN_PRODUCT_CATEGORY proposal safely
  const impactRes = calculateModelChangeImpact({
    proposalId: 'prop-test-02',
    parameterName: 'Unknown Param',
    kpiId: 'kpi-02',
    canonicalCategory: 'UNKNOWN_PRODUCT_CATEGORY' as any,
    currentModelValue: 1.0,
    proposedShiftOffset: 0.2,
    proposedCalibratedValue: 1.2,
    observedBias: 0.2,
    sampleCount: 10,
    meanAbsoluteError: 0.2,
    mae: 0.2,
    rationale: 'Test recommendation',
    recommendation: 'Test recommendation',
    proposedAt: '2026-09-01T00:00:00Z',
    status: 'PROPOSED',
    safetyWarning: 'Caution',
    evidenceReferenceIds: []
  });
  assert('TEST 24: Model change impact blocks analysis for UNKNOWN_PRODUCT_CATEGORY proposal', impactRes.affectedCategories.length === 0);

  // TEST 25: Measurement comparability fails when category is UNKNOWN_PRODUCT_CATEGORY
  const compCheck = checkMeasurementComparability({
    targetFormulaId: 'FORM-001',
    targetFormulaVersion: '1.0.0',
    targetCategory: 'UNKNOWN_PRODUCT_CATEGORY' as any,
    targetKPIId: 'pH',
    targetUnit: 'pH units',
    measurement: {
      measurementId: 'MEAS-001',
      formulaId: 'FORM-001',
      formulaVersion: '1.0.0',
      categoryId: 'UNKNOWN_PRODUCT_CATEGORY' as any,
      parameterKey: 'pH',
      value: 7.0,
      unit: 'pH units',
      testDate: '2026-09-01',
      provenance: 'MEASURED',
      isCalibratedInstrument: true
    }
  });
  assert('TEST 25: Measurement comparability fails when category is UNKNOWN_PRODUCT_CATEGORY', compCheck.isComparable === false);

  // TEST 26: Master benchmark formulas in data/formulas.ts continue to resolve validly
  const allMasterFormulasValid = FORMULAS.length > 0 && FORMULAS.every(f => f.categoryId !== 'UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 26: Master benchmark formulas in data/formulas.ts continue to resolve validly', allMasterFormulasValid);

  // TEST 27: Category Model Validation Summary returns empty/blocked summary for UNKNOWN_PRODUCT_CATEGORY
  const catModelSummary = evaluateCategoryModelValidation('UNKNOWN_PRODUCT_CATEGORY' as any, []);
  assert('TEST 27: Category Model Validation Summary returns INSUFFICIENT_VALIDATION_DATA for UNKNOWN_PRODUCT_CATEGORY', catModelSummary.overallValidationStatus === 'INSUFFICIENT_VALIDATION_DATA');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

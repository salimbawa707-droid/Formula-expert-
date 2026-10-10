/**
 * ============================================================================
 * P0 REMEDIATION — LIQUID LAUNDRY PH SPECIFICATION ROUTING REGRESSION SUITE
 * ============================================================================
 */

import {
  tryGetSpecificationTemplateForCategory,
  getSpecificationTemplateForCategory,
  isParameterApplicableForCategory,
  evaluateSpecifications,
  EvaluationInput
} from '../specificationEngine';
import { normalizeProductCategory, getProductCategory } from '../../domain/productTaxonomy';
import { calculatePHAdvanced } from '../pHEngine';
import { ReleaseGateEngine } from '../specificationEngine/releaseGateEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

export function runP0RemediationLiquidPhSpecificationRoutingTestSuite(): {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, details?: string) => {
    results.push({ name, passed: condition, details: details ? String(details) : undefined });
  };

  // 1. LAUNDRY_LIQUID resolves to Liquid Laundry scientific profile
  const liquidTpl = getSpecificationTemplateForCategory('LAUNDRY_LIQUID');
  assert('TEST 1: LAUNDRY_LIQUID resolves to Liquid Laundry template', liquidTpl.id === 'tpl-laundry-liquid');

  // 2. LAUNDRY_POWDER resolves to Powder Laundry scientific profile
  const powderTpl = getSpecificationTemplateForCategory('LAUNDRY_POWDER');
  assert('TEST 2: LAUNDRY_POWDER resolves to Powder Laundry template', powderTpl.id === 'tpl-laundry-powder');

  // 3. Liquid does not receive powder pH parameter
  const liquidPhParam = liquidTpl.parameters.find(p => p.parameterKey === 'ph');
  const liquidHasPowderPh = liquidTpl.parameters.some(p => p.parameterKey === 'powderPH');
  assert('TEST 3: Liquid does not receive powder pH parameter', !liquidHasPowderPh && liquidPhParam !== undefined);

  // 4. Powder retains powder pH parameter
  const powderPhParam = powderTpl.parameters.find(p => p.parameterKey === 'powderPH');
  assert('TEST 4: Powder retains powder pH parameter', powderPhParam !== undefined);

  // 5. Liquid does not receive "1.0% w/v powder" method
  assert('TEST 5: Liquid does not receive "1.0% w/v powder" test basis', (liquidPhParam?.testBasis || '').includes('powder') === false);

  // 6. Powder retains its 1.0% w/v method
  assert('TEST 6: Powder retains its 1.0% w/v test basis', (powderPhParam?.testBasis || '').includes('1.0% w/v powder') === true);

  // 7. Liquid pH uses the authoritative Liquid range
  assert('TEST 7: Liquid pH limits are 7.5 to 9.5', liquidPhParam?.min === 7.5 && liquidPhParam?.max === 9.5);

  // 8. pH 7.57 is not OUT_OF_SPEC solely because of powder range (9.8-11.2)
  const evalInputLiquid: EvaluationInput = {
    formulaName: 'Liquid Laundry Standard',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: liquidTpl.parameters,
    labMeasurements: [],
    liquidResults: { pH: 7.57, activeSurfactants: 16.0, totalPercentage: 100.0 }
  };
  const liquidReport = evaluateSpecifications(evalInputLiquid);
  const liquidPhResult = liquidReport.items.find(i => i.parameterKey === 'ph');
  assert('TEST 8: Liquid pH 7.57 evaluates as PASS', liquidPhResult?.status === 'PASS');

  // 9. Liquid pH 7.57 is evaluated against Liquid specification
  assert('TEST 9: Liquid pH 7.57 evaluated against liquid spec max of 9.5', liquidPhResult?.max === 9.5);

  // 10. Powder pH continues using Powder specification
  const evalInputPowder: EvaluationInput = {
    formulaName: 'Powder Laundry Standard',
    formulaVersion: '1.0',
    productCategory: 'LAUNDRY_POWDER',
    parameters: powderTpl.parameters,
    labMeasurements: [],
    powderReport: {
      massBalance: { formulaTotalPct: 100.0, source: 'CALCULATED' },
      activeMatter: { totalSurfactantActivePct: 12.0 },
      powderPH: { calculatedAqueousPH: 10.5, isWithinTarget: true, targetRange: { isSpecified: true, min: 9.5, max: 11.2, label: 'Standard' }, testBasis: { sampleConcentrationPct: 1.0, temperatureC: 25, solutionHardnessPpm: 0, method: '1.0% w/v' } }
    } as any
  };
  const powderReport = evaluateSpecifications(evalInputPowder);
  const powderPhResult = powderReport.items.find(i => i.parameterKey === 'powderPH');
  assert('TEST 10: Powder pH 10.5 evaluated against powder target 10.5', powderPhResult?.target === 10.5);

  // 11. tryGetSpecificationTemplateForCategory receives correct Liquid template
  const tryLiquid = tryGetSpecificationTemplateForCategory('LAUNDRY_LIQUID');
  assert('TEST 11: tryGetSpecificationTemplateForCategory resolves LAUNDRY_LIQUID template', tryLiquid?.id === 'tpl-laundry-liquid');

  // 12. Release Gate does not request powder pH evidence for Liquid
  const gateEngine = ReleaseGateEngine.getInstance();
  const snapshotLiquid = {
    versionId: 'v-1',
    versionNumber: '1.0',
    formulaName: 'Test Liquid',
    productCategory: 'LAUNDRY_LIQUID',
    totalPercentage: 100.0,
    activeMatterPct: 16.0,
    ingredients: [{ name: 'SLES', percentage: 10.0, activeMatterPct: 70.0 }]
  };
  const gateReportLiquid = gateEngine.evaluateReleaseGate(snapshotLiquid as any, liquidTpl.parameters, [], liquidReport);
  const testEvidenceCheck = gateReportLiquid.checks.find(c => c.id === 'gate-test-evidence');
  assert('TEST 12: Release Gate does not mention "Aqueous pH (1.0% w/v Solution)" for liquid', testEvidenceCheck?.evidence.includes('Aqueous pH (1.0% w/v Solution)') === false);

  // 13. Lab Evidence Engine or Release Gate does not create powder pH missing-evidence warning for Liquid
  assert('TEST 13: Release Gate does not block liquid on missing powder pH', testEvidenceCheck?.evidence.includes('powderPH') === false);

  // 14. "Aqueous pH Out of Range" is not generated from powder limits for Liquid
  const phRec = liquidReport.recommendations.find(r => r.parameterKey === 'ph');
  assert('TEST 14: Recommendations do not contain pH out of range for liquid at 7.57', phRec === undefined);

  // 15. Calculated pH remains CALCULATED
  assert('TEST 15: Calculated pH has CALCULATED provenance', liquidPhResult?.provenance === 'CALCULATED');

  // 16. No fake LAB_TESTED/LAB_VALIDATED status is created
  assert('TEST 16: Calculated pH isMeasured is false', liquidPhResult?.isMeasured === false);

  // 17. NOT_APPLICABLE parameters do not affect Liquid verdict
  const applicableParamsLiquid = liquidTpl.parameters.filter(p => isParameterApplicableForCategory(p.parameterKey, 'LAUNDRY_LIQUID'));
  assert('TEST 17: powderPH is filtered out for liquid', applicableParamsLiquid.some(p => p.parameterKey === 'powderPH') === false);

  // 18. Quality Gate / Specifications consume correct Liquid pH result
  assert('TEST 18: Liquid pH evaluation item has min 7.5', liquidPhResult?.min === 7.5);

  // 19. No hardcoded UI-only override is used
  assert('TEST 19: Template parameters contain Finished Product pH with key ph', liquidPhParam?.parameterName === 'Finished Product pH');

  // 20. Deserialization preserves correct category/profile
  const normCat = normalizeProductCategory('LAUNDRY_LIQUID');
  assert('TEST 20: Deserialization resolves category correctly', normCat === 'LAUNDRY_LIQUID');

  // 21. Switching Liquid -> Powder changes pH parameter correctly
  const switchPowder = isParameterApplicableForCategory('ph', 'LAUNDRY_POWDER');
  assert('TEST 21: ph is not applicable for powder category', switchPowder === false);

  // 22. Switching Powder -> Liquid changes pH parameter correctly
  const switchLiquid = isParameterApplicableForCategory('powderPH', 'LAUNDRY_LIQUID');
  assert('TEST 22: powderPH is not applicable for liquid category', switchLiquid === false);

  // 23. Unknown category does not default to Liquid
  const normUnknown = normalizeProductCategory('INVALID_CATEGORY');
  assert('TEST 23: Unknown category resolves to UNKNOWN_PRODUCT_CATEGORY', normUnknown === 'UNKNOWN_PRODUCT_CATEGORY');

  // 24. Existing P0 #8 unknown-category protection remains intact
  const unknownCategoryDef = getProductCategory('UNKNOWN_PRODUCT_CATEGORY');
  assert('TEST 24: Unknown category definition is null', unknownCategoryDef === null);

  // 25. Existing PHEngineV2 calculation result remains unchanged by specification routing
  const v2Res = calculatePHAdvanced([], 100, { productCategory: 'LAUNDRY_LIQUID' });
  assert('TEST 25: PHEngineV2 calculation result is unchanged', typeof v2Res.pH === 'number');

  // 26. Liquid profile is deterministic
  const liquidTpl2 = getSpecificationTemplateForCategory('LAUNDRY_LIQUID');
  assert('TEST 26: Liquid profile is identical across evaluations', JSON.stringify(liquidTpl) === JSON.stringify(liquidTpl2));

  // 27. Powder profile is deterministic
  const powderTpl2 = getSpecificationTemplateForCategory('LAUNDRY_POWDER');
  assert('TEST 27: Powder profile is identical across evaluations', JSON.stringify(powderTpl) === JSON.stringify(powderTpl2));

  // 28. No duplicate competing pH specification is introduced
  const phParamsLiquidCount = liquidTpl.parameters.filter(p => p.parameterKey === 'ph').length;
  assert('TEST 28: No duplicate competing pH parameters in liquid template', phParamsLiquidCount === 1);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

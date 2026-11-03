import {
  CANONICAL_PRODUCT_CATEGORY_IDS,
} from '../../domain/productTaxonomy';
import {
  SCIENTIFIC_PRODUCT_PROFILES,
  getScientificProductProfile,
  getApplicableEnginesForCategory,
  isEngineApplicable,
  getCalculationPolicy,
} from '../../domain/scientificProductProfiles';
import {
  routeScientificExecution,
  isPowderCategory,
  shouldEnforceLowFoam,
  shouldAllowCationicSurfactants,
  shouldAllowAnionicSurfactants,
} from '../scientificRouter';

export interface TestResult {
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  details?: string;
}

export function runScientificRouterTestSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual: any, expected: any, details?: string) {
    results.push({
      name,
      passed: Boolean(condition),
      actual,
      expected,
      details
    });
  }

  // 1. Authoritative registry covers all 13 canonical categories
  assert(
    'Authoritative registry has exactly 13 canonical categories',
    CANONICAL_PRODUCT_CATEGORY_IDS.length === 13,
    CANONICAL_PRODUCT_CATEGORY_IDS.length,
    13
  );

  for (const catId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const profile = SCIENTIFIC_PRODUCT_PROFILES[catId];
    assert(
      `Registry profile for ${catId} is valid and complete`,
      Boolean(
        profile &&
        profile.categoryId === catId &&
        profile.label.length > 0 &&
        profile.applicableEngines.length > 0 &&
        profile.primaryPerformanceDomains.length > 0 &&
        profile.validationDomains.length > 0 &&
        profile.specificationProfileId === `SPEC_${catId}` &&
        profile.compatibilityProfileId === `COMPAT_${catId}`
      ),
      Boolean(profile),
      true
    );
  }

  // 2. Separates Product Category identity from Physical Form
  const laundryLiquid = getScientificProductProfile('LAUNDRY_LIQUID');
  const fabricSoftener = getScientificProductProfile('FABRIC_SOFTENER');
  const carShampoo = getScientificProductProfile('CAR_SHAMPOO');

  assert(
    'Physical forms for liquid family are LIQUID',
    laundryLiquid.physicalForm === 'LIQUID' &&
    fabricSoftener.physicalForm === 'LIQUID' &&
    carShampoo.physicalForm === 'LIQUID',
    [laundryLiquid.physicalForm, fabricSoftener.physicalForm, carShampoo.physicalForm],
    ['LIQUID', 'LIQUID', 'LIQUID']
  );

  assert(
    'Surfactant preference differentiates chemically distinct liquids',
    laundryLiquid.calculationPolicy.surfactantPreference === 'ANIONIC_DOMINANT' &&
    fabricSoftener.calculationPolicy.surfactantPreference === 'CATIONIC_DOMINANT' &&
    carShampoo.calculationPolicy.surfactantPreference === 'ANIONIC_DOMINANT',
    [
      laundryLiquid.calculationPolicy.surfactantPreference,
      fabricSoftener.calculationPolicy.surfactantPreference,
      carShampoo.calculationPolicy.surfactantPreference
    ],
    ['ANIONIC_DOMINANT', 'CATIONIC_DOMINANT', 'ANIONIC_DOMINANT']
  );

  assert(
    'Fabric softener policy strictly allows cationic and disallows anionic',
    fabricSoftener.calculationPolicy.allowCationicSurfactants === true &&
    fabricSoftener.calculationPolicy.allowAnionicSurfactants === false,
    { cationic: fabricSoftener.calculationPolicy.allowCationicSurfactants, anionic: fabricSoftener.calculationPolicy.allowAnionicSurfactants },
    { cationic: true, anionic: false }
  );

  // 3. LAUNDRY_POWDER correctly routes to Powder Engine and disables liquid salt curve
  const powderRoute = routeScientificExecution('LAUNDRY_POWDER');
  assert(
    'Laundry Powder routes to POWDER physical form and engine',
    powderRoute.isPowder === true &&
    powderRoute.physicalForm === 'POWDER' &&
    powderRoute.applicableEngines.includes('POWDER_ENGINE') &&
    !powderRoute.applicableEngines.includes('VISCOSITY_ENGINE') &&
    powderRoute.engineRoutingMap.POWDER_ENGINE.applicable === true &&
    powderRoute.calculationPolicy.requiresPowderCalculations === true &&
    powderRoute.calculationPolicy.requiresViscositySaltCurve === false,
    powderRoute.applicableEngines,
    'Includes POWDER_ENGINE and excludes VISCOSITY_ENGINE'
  );

  assert('isPowderCategory detects LAUNDRY_POWDER', isPowderCategory('LAUNDRY_POWDER') === true, true, true);
  assert('isPowderCategory detects Powder Laundry', isPowderCategory('Powder Laundry') === true, true, true);
  assert('isPowderCategory rejects LAUNDRY_LIQUID', isPowderCategory('LAUNDRY_LIQUID') === false, false, false);

  // 4. DISHWASH_AUTOMATIC vs DISHWASH_MANUAL scientific isolation
  const autoRoute = routeScientificExecution('DISHWASH_AUTOMATIC');
  const manualRoute = routeScientificExecution('DISHWASH_MANUAL');

  assert(
    'Automatic Dishwasher enforces low foam and defoaming nonionic policy',
    autoRoute.calculationPolicy.requiresLowFoamDeaeration === true &&
    autoRoute.calculationPolicy.surfactantPreference === 'NONIONIC_LOW_FOAM' &&
    autoRoute.validationDomains.includes('low_foam_enforcement') &&
    shouldEnforceLowFoam('DISHWASH_AUTOMATIC') === true,
    autoRoute.calculationPolicy.surfactantPreference,
    'NONIONIC_LOW_FOAM'
  );

  assert(
    'Manual Dishwasher enforces high foam, skin safety, and anionic dominance',
    manualRoute.calculationPolicy.requiresLowFoamDeaeration === false &&
    manualRoute.calculationPolicy.requiresSkinSafetyMetrics === true &&
    manualRoute.calculationPolicy.surfactantPreference === 'ANIONIC_DOMINANT' &&
    shouldEnforceLowFoam('DISHWASH_MANUAL') === false,
    manualRoute.calculationPolicy.surfactantPreference,
    'ANIONIC_DOMINANT'
  );

  // 5. FABRIC_SOFTENER enforces cationic chemistry and acidic pH
  const softPolicy = getCalculationPolicy('FABRIC_SOFTENER');
  assert(
    'Fabric Softener requires fabric softening metrics and acidic pH target',
    softPolicy.requiresFabricSofteningMetrics === true &&
    softPolicy.allowCationicSurfactants === true &&
    softPolicy.allowAnionicSurfactants === false &&
    softPolicy.targetPHRange.max <= 4.5 &&
    shouldAllowCationicSurfactants('FABRIC_SOFTENER') === true &&
    shouldAllowAnionicSurfactants('FABRIC_SOFTENER') === false,
    softPolicy.targetPHRange,
    'max <= 4.5'
  );

  // 6. GLASS_CLEANER enforces low active matter and streak-free metrics
  const glassPolicy = getCalculationPolicy('GLASS_CLEANER');
  assert(
    'Glass Cleaner enforces low surfactant active and streak-free metrics',
    glassPolicy.requiresStreakResidueMetrics === true &&
    glassPolicy.surfactantPreference === 'LOW_SURFACTANT' &&
    (glassPolicy.maxTotalActiveSurfactantPct ?? 0) <= 3.0 &&
    glassPolicy.targetPHRange.min >= 8.5,
    glassPolicy.maxTotalActiveSurfactantPct,
    '<= 3.0%'
  );

  // 7. TOILET_CLEANER enforces descaling cling and acidic regime
  const toiletRoute = routeScientificExecution('TOILET_CLEANER');
  assert(
    'Toilet cleaner routes to descaling, vertical cling, and pH <= 2.5',
    toiletRoute.calculationPolicy.requiresClingRheology === true &&
    toiletRoute.primaryPerformanceDomains.includes('scale_removal') &&
    toiletRoute.primaryPerformanceDomains.includes('viscosity_cling') &&
    toiletRoute.calculationPolicy.targetPHRange.max <= 2.5,
    toiletRoute.calculationPolicy.targetPHRange,
    'max <= 2.5'
  );

  // 8. KITCHEN_DEGREASER enforces alkaline saponification and high pH
  const degreaserRoute = routeScientificExecution('KITCHEN_DEGREASER');
  assert(
    'Kitchen degreaser routes to alkaline saponification and caustic hazard validation',
    degreaserRoute.primaryPerformanceDomains.includes('alkalinity_saponification') &&
    degreaserRoute.primaryPerformanceDomains.includes('grease_cutting') &&
    degreaserRoute.validationDomains.includes('caustic_hazard') &&
    degreaserRoute.calculationPolicy.targetPHRange.min >= 11.0,
    degreaserRoute.calculationPolicy.targetPHRange.min,
    '>= 11.0'
  );

  // 9. HAND_WASH enforces skin mildness and physiological pH
  const handWashRoute = routeScientificExecution('HAND_WASH');
  assert(
    'Hand wash routes to skin safety metrics and physiological pH 5.0 - 6.8',
    handWashRoute.calculationPolicy.requiresSkinSafetyMetrics === true &&
    handWashRoute.primaryPerformanceDomains.includes('skin_mildness') &&
    handWashRoute.validationDomains.includes('skin_irritation') &&
    handWashRoute.calculationPolicy.targetPHRange.min === 5.0 &&
    handWashRoute.calculationPolicy.targetPHRange.max === 6.8,
    handWashRoute.calculationPolicy.targetPHRange,
    '{ min: 5.0, max: 6.8 }'
  );

  // 10. CAR_SHAMPOO enforces paint lubricity and neutral pH
  const carRoute = routeScientificExecution('CAR_SHAMPOO');
  assert(
    'Car shampoo routes to paint lubricity and neutral pH ~7.2',
    carRoute.primaryPerformanceDomains.includes('surface_lubricity') &&
    carRoute.primaryPerformanceDomains.includes('spotting_prevention') &&
    carRoute.calculationPolicy.targetPHRange.optimal === 7.2,
    carRoute.calculationPolicy.targetPHRange.optimal,
    7.2
  );

  // 11. Deterministic resolution of alias strings and explicit rejection of unknown/undefined categories
  assert('Resolves "Liquid Laundry" alias', getScientificProductProfile('Liquid Laundry').categoryId === 'LAUNDRY_LIQUID', 'LAUNDRY_LIQUID', 'LAUNDRY_LIQUID');
  assert('Resolves "Automatic Dishwasher" alias', getScientificProductProfile('Automatic Dishwasher').categoryId === 'DISHWASH_AUTOMATIC', 'DISHWASH_AUTOMATIC', 'DISHWASH_AUTOMATIC');
  assert('Resolves "Hand Dishwash" alias', getScientificProductProfile('Hand Dishwash').categoryId === 'DISHWASH_MANUAL', 'DISHWASH_MANUAL', 'DISHWASH_MANUAL');

  let undefinedFailed = false;
  try {
    getScientificProductProfile(undefined);
  } catch (err: any) {
    undefinedFailed = err.message.includes('Unrecognized, missing, or invalid product category');
  }
  assert('Undefined category fails safely and explicitly without fallback to LAUNDRY_LIQUID', undefinedFailed, true, true);

  let unknownFailed = false;
  try {
    getScientificProductProfile('Alien Rocket Cleaner');
  } catch (err: any) {
    unknownFailed = err.message.includes('Unrecognized, missing, or invalid product category');
  }
  assert('Unknown category string fails safely and explicitly without fallback to LAUNDRY_LIQUID', unknownFailed, true, true);

  // 12. Engine applicability helpers return expected boolean flags
  assert('Powder engine is applicable to LAUNDRY_POWDER', isEngineApplicable('LAUNDRY_POWDER', 'POWDER_ENGINE') === true, true, true);
  assert('Viscosity engine is NOT applicable to LAUNDRY_POWDER', isEngineApplicable('LAUNDRY_POWDER', 'VISCOSITY_ENGINE') === false, false, false);
  assert('Viscosity engine is applicable to LAUNDRY_LIQUID', isEngineApplicable('LAUNDRY_LIQUID', 'VISCOSITY_ENGINE') === true, true, true);
  assert('Powder engine is NOT applicable to LAUNDRY_LIQUID', isEngineApplicable('LAUNDRY_LIQUID', 'POWDER_ENGINE') === false, false, false);

  const softEngines = getApplicableEnginesForCategory('FABRIC_SOFTENER');
  assert('Fabric softener includes pH and active matter engines', softEngines.includes('PH_ENGINE') && softEngines.includes('ACTIVE_MATTER_ENGINE'), true, true);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    passed: passedCount,
    failed: failedCount,
    results
  };
}

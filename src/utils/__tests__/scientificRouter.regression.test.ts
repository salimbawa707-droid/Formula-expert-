import {
  CANONICAL_PRODUCT_CATEGORY_IDS,
  getProductCategory,
} from '../../domain/productTaxonomy';
import type { ProductCategoryId } from '../../domain/productTaxonomy';
import { isMetricApplicable } from '../../components/aiformulator/constants';
import {
  SCIENTIFIC_PRODUCT_PROFILES,
  getScientificProductProfile,
  getApplicableEnginesForCategory,
  isEngineApplicable,
  getCalculationPolicy,
} from '../../domain/scientificProductProfiles';
import type { ScientificEngineId } from '../../domain/scientificProductProfiles';
import {
  routeScientificExecution,
  isPowderCategory,
  shouldEnforceLowFoam,
  shouldAllowCationicSurfactants,
  shouldAllowAnionicSurfactants,
  getCategoryExpectedSurfactantType,
  getCategoryPHLimits,
  getCategoryActiveSurfactantLimits,
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
  // Full 15-engine x 13-category applicability contract (195 independent matrix assertions).
  const allCategories: readonly ProductCategoryId[] = CANONICAL_PRODUCT_CATEGORY_IDS;
  const expectedEngineCategories: Record<ScientificEngineId, readonly ProductCategoryId[]> = {
    PH_ENGINE: allCategories,
    HLB_ENGINE: ['LAUNDRY_LIQUID', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC', 'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'BATHROOM_CLEANER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'],
    ACTIVE_MATTER_ENGINE: allCategories,
    VISCOSITY_ENGINE: ['LAUNDRY_LIQUID', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC', 'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'TOILET_CLEANER', 'BATHROOM_CLEANER', 'GLASS_CLEANER', 'FABRIC_SOFTENER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'],
    POWDER_ENGINE: ['LAUNDRY_POWDER'],
    CLEANING_PERFORMANCE_ENGINE: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC', 'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'TOILET_CLEANER', 'BATHROOM_CLEANER', 'GLASS_CLEANER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'],
    COMPATIBILITY_ENGINE: allCategories,
    CHELATOR_ENGINE: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC', 'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'BATHROOM_CLEANER', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'],
    DENSITY_ENGINE: allCategories,
    DILUTION_ENGINE: ['LAUNDRY_LIQUID', 'DISHWASH_MANUAL', 'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'BATHROOM_CLEANER', 'GLASS_CLEANER', 'FABRIC_SOFTENER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'],
    LAB_HEALTH_ENGINE: allCategories,
    GRADE_ENGINE: allCategories,
    SPECIFICATION_ENGINE: allCategories,
    EXPERT_REASONING_ENGINE: allCategories,
    COSTING_ENGINE: allCategories
  };
  for (const [engineId, applicableCategories] of Object.entries(expectedEngineCategories) as [ScientificEngineId, readonly ProductCategoryId[]][]) {
    for (const categoryId of allCategories) {
      const expected = applicableCategories.includes(categoryId);
      const actual = isEngineApplicable(categoryId, engineId);
      assert(
        `Full engine matrix: ${engineId} / ${categoryId}`,
        actual === expected,
        actual,
        expected
      );
    }
  }
  for (const engineId of Object.keys(expectedEngineCategories) as ScientificEngineId[]) {
    assert(
      `Unknown category cannot route ${engineId}`,
      isEngineApplicable('Alien Rocket Cleaner', engineId) === false,
      false,
      false
    );
  }

  // 12A. Category applicability is a single contract across taxonomy, profile, policy and UI metric gates.
  for (const categoryId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const definition = getProductCategory(categoryId);
    const profile = getScientificProductProfile(categoryId);
    const mappings = [
      ['hlb', 'HLB_ENGINE', definition?.categoryApplicability.hlb],
      ['viscosity', 'VISCOSITY_ENGINE', definition?.categoryApplicability.viscosity],
      ['cleaningScore', 'CLEANING_PERFORMANCE_ENGINE', definition?.categoryApplicability.cleaningScore],
      ['builder', 'CHELATOR_ENGINE', definition?.categoryApplicability.builder]
    ] as const;
    for (const [metric, engineId, taxonomyFlag] of mappings) {
      const engineFlag = profile.applicableEngines.includes(engineId);
      assert(
        `13-category isolation: ${categoryId} ${metric} taxonomy/profile/UI agree`,
        taxonomyFlag === engineFlag && isMetricApplicable(categoryId, metric) === taxonomyFlag,
        { taxonomy: taxonomyFlag, engine: engineFlag, ui: isMetricApplicable(categoryId, metric) },
        { taxonomy: engineFlag, engine: engineFlag, ui: engineFlag }
      );
    }
    assert(
      `13-category isolation: ${categoryId} pH target agrees with taxonomy`,
      definition?.targetPHMin === profile.calculationPolicy.targetPHRange.min &&
      definition?.targetPHMax === profile.calculationPolicy.targetPHRange.max &&
      definition?.defaultPH === profile.calculationPolicy.targetPHRange.optimal,
      { taxonomy: [definition?.targetPHMin, definition?.targetPHMax, definition?.defaultPH], profile: profile.calculationPolicy.targetPHRange },
      'identical min/max/optimal pH'
    );
    const profileActiveRange = profile.calculationPolicy.activeSurfactantRange;
    assert(
      `13-category isolation: ${categoryId} taxonomy/profile active-matter minimum and target agree`,
      definition!.activeMatterMinPct === profileActiveRange.min &&
      definition!.activeMatterTargetPct === profileActiveRange.optimal,
      { taxonomyMin: definition!.activeMatterMinPct, taxonomyTarget: definition!.activeMatterTargetPct, profile: profileActiveRange },
      'taxonomy min/target exactly match profile min/optimal'
    );
    assert(
      `13-category isolation: ${categoryId} powder engine matches physical form`,
      profile.applicableEngines.includes('POWDER_ENGINE') === (profile.physicalForm === 'POWDER') &&
      profile.calculationPolicy.requiresPowderCalculations === (profile.physicalForm === 'POWDER'),
      { physicalForm: profile.physicalForm, engine: profile.applicableEngines.includes('POWDER_ENGINE'), required: profile.calculationPolicy.requiresPowderCalculations },
      'POWDER_ENGINE and powder calculations only for POWDER'
    );
  }

  // Exhaustive category × engine matrix: every registered engine is checked for every canonical category.
  const allEngineIds: ScientificEngineId[] = [
    'PH_ENGINE', 'HLB_ENGINE', 'ACTIVE_MATTER_ENGINE', 'VISCOSITY_ENGINE',
    'POWDER_ENGINE', 'CLEANING_PERFORMANCE_ENGINE', 'COMPATIBILITY_ENGINE',
    'CHELATOR_ENGINE', 'DENSITY_ENGINE', 'DILUTION_ENGINE', 'LAB_HEALTH_ENGINE',
    'GRADE_ENGINE', 'SPECIFICATION_ENGINE', 'EXPERT_REASONING_ENGINE', 'COSTING_ENGINE'
  ];
  for (const categoryId of CANONICAL_PRODUCT_CATEGORY_IDS) {
    const registered = getApplicableEnginesForCategory(categoryId);
    for (const engineId of allEngineIds) {
      const expected = SCIENTIFIC_PRODUCT_PROFILES[categoryId].applicableEngines.includes(engineId);
      assert(
        `15x13 engine matrix: ${categoryId} / ${engineId}`,
        isEngineApplicable(categoryId, engineId) === expected && registered.includes(engineId) === expected,
        { direct: isEngineApplicable(categoryId, engineId), listed: registered.includes(engineId), expected },
        { direct: expected, listed: expected, expected }
      );
    }
  }
  for (const engineId of allEngineIds) {
    const applicable = isEngineApplicable('ALIEN_ROCKET_CLEANER', engineId);
    assert(
      `Unknown category rejects engine: ${engineId}`,
      applicable === false,
      applicable,
      false
    );
  }
  let unknownEngineListThrows = false;
  try {
    getApplicableEnginesForCategory('ALIEN_ROCKET_CLEANER');
  } catch {
    unknownEngineListThrows = true;
  }
  assert(
    'Unknown category engine-list lookup throws explicit category error',
    unknownEngineListThrows,
    unknownEngineListThrows,
    true
  );

  // Automatic dishwasher already declares HLB as applicable and required; the engine registry must agree.
  const automaticDishwash = getScientificProductProfile('DISHWASH_AUTOMATIC');
  assert(
    'Automatic dishwash HLB requirement is wired to the HLB engine',
    automaticDishwash.calculationPolicy.requiresHLBAnalysis === true &&
    automaticDishwash.applicableEngines.includes('HLB_ENGINE') &&
    getProductCategory('DISHWASH_AUTOMATIC')?.categoryApplicability.hlb === true,
    { required: automaticDishwash.calculationPolicy.requiresHLBAnalysis, engine: automaticDishwash.applicableEngines.includes('HLB_ENGINE'), taxonomy: getProductCategory('DISHWASH_AUTOMATIC')?.categoryApplicability.hlb },
    { required: true, engine: true, taxonomy: true }
  );

  // Unknown categories fail closed: no metrics, ionic permission, pH range, or active range.
  for (const metric of ['hlb', 'cmc', 'viscosity', 'cleaningScore', 'foam', 'builder'] as const) {
    assert(`Unknown category denies ${metric} metric`, isMetricApplicable('Alien Rocket Cleaner', metric) === false, false, false);
  }
  assert('Unknown category denies anionic surfactant permission', shouldAllowAnionicSurfactants('Alien Rocket Cleaner') === false, false, false);
  assert('Unknown category denies cationic surfactant permission', shouldAllowCationicSurfactants('Alien Rocket Cleaner') === false, false, false);
  assert('Unknown category has no surfactant preference default', getCategoryExpectedSurfactantType('Alien Rocket Cleaner') === null, null, null);
  assert('Unknown category has no pH target default', getCategoryPHLimits('Alien Rocket Cleaner') === null, null, null);
  assert('Unknown category has no active-surfactant range default', getCategoryActiveSurfactantLimits('Alien Rocket Cleaner') === null, null, null);


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

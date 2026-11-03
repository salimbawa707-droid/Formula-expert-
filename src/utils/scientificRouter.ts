/**
 * ============================================================================
 * PRODUCT-SPECIFIC SCIENTIFIC ROUTER (Phase 2 Master Architecture)
 * ============================================================================
 *
 * Deterministic routing layer that inspects the canonical ProductCategoryId and
 * constructs the appropriate scientific execution route, feature permissions,
 * applicable engines, and policy constraints.
 * ============================================================================
 */

import {
  ProductCategoryId,
  PhysicalForm,
  normalizeProductCategory,
  getProductCategory
} from '../domain/productTaxonomy';
import {
  ScientificProductProfile,
  ScientificEngineId,
  CalculationPolicy,
  PerformanceDomain,
  ValidationDomain,
  SurfactantTypePreference,
  getScientificProductProfile,
  tryGetScientificProductProfile
} from '../domain/scientificProductProfiles';
import { evaluatePowderFormulation, PowderEngineInput, PowderFormulationReport } from './powderEngine';

export interface EngineRoutingDecision {
  applicable: boolean;
  reason: string;
}

export interface ScientificExecutionRoute {
  categoryId: ProductCategoryId;
  categoryLabel: string;
  physicalForm: PhysicalForm;
  profile: ScientificProductProfile;
  applicableEngines: ScientificEngineId[];
  calculationPolicy: CalculationPolicy;
  engineRoutingMap: Record<ScientificEngineId, EngineRoutingDecision>;
  primaryPerformanceDomains: PerformanceDomain[];
  validationDomains: ValidationDomain[];
  isPowder: boolean;
}

/**
 * Evaluates whether a given category string represents a powder formulation.
 * Deterministic check based on taxonomy and keyword signals.
 */
export function isPowderCategory(category?: string, productType?: string): boolean {
  const raw = (category || productType || '').toLowerCase();
  if (
    raw.includes('powder') ||
    raw.includes('dry blend') ||
    raw.includes('granule') ||
    raw.includes('washing powder') ||
    raw.includes('laundry powder')
  ) {
    return true;
  }

  const norm = normalizeProductCategory(category || productType);
  if (norm !== 'UNKNOWN_PRODUCT_CATEGORY') {
    const profile = getScientificProductProfile(norm);
    return profile.physicalForm === 'POWDER';
  }

  return false;
}

/**
 * Builds the complete deterministic execution route for a product category.
 */
export function routeScientificExecution(categoryInput?: string, productType?: string): ScientificExecutionRoute {
  const normalized = normalizeProductCategory(categoryInput || productType);
  if (normalized === 'UNKNOWN_PRODUCT_CATEGORY') {
    throw new Error(
      `Cannot route scientific execution: Unrecognized or undefined product category "${categoryInput || productType || 'undefined'}". ` +
      `Scientific execution requires a valid canonical category ID or recognized alias.`
    );
  }
  const profile = getScientificProductProfile(normalized);
  const def = getProductCategory(normalized);
  if (!def) {
    throw new Error(
      `Cannot route scientific execution: Taxonomy definition missing for canonical category "${normalized}".`
    );
  }
  const applicableEngines = profile.applicableEngines;

  const allEngines: ScientificEngineId[] = [
    'PH_ENGINE',
    'HLB_ENGINE',
    'ACTIVE_MATTER_ENGINE',
    'VISCOSITY_ENGINE',
    'POWDER_ENGINE',
    'CLEANING_PERFORMANCE_ENGINE',
    'COMPATIBILITY_ENGINE',
    'CHELATOR_ENGINE',
    'DENSITY_ENGINE',
    'DILUTION_ENGINE',
    'LAB_HEALTH_ENGINE',
    'GRADE_ENGINE',
    'SPECIFICATION_ENGINE',
    'EXPERT_REASONING_ENGINE',
    'COSTING_ENGINE'
  ];

  const engineRoutingMap = {} as Record<ScientificEngineId, EngineRoutingDecision>;

  for (const eng of allEngines) {
    const isApp = applicableEngines.includes(eng);
    let reason = isApp ? `Applicable to ${profile.label}` : `Bypassed: not applicable to ${profile.label} physical form / chemistry`;

    if (eng === 'POWDER_ENGINE') {
      reason = profile.physicalForm === 'POWDER'
        ? 'Powder bulk density, flow, caking, and builder balance activated'
        : 'Bypassed: formulation physical form is liquid';
    } else if (eng === 'VISCOSITY_ENGINE' && !profile.calculationPolicy.requiresViscositySaltCurve) {
      reason = isApp
        ? 'Base rheology activated (salt curve response bypassed per category policy)'
        : 'Viscosity engine bypassed';
    } else if (eng === 'HLB_ENGINE' && !profile.calculationPolicy.requiresHLBAnalysis) {
      reason = 'Bypassed: HLB emulsification matching is not primary domain for this product category';
    }

    engineRoutingMap[eng] = { applicable: isApp, reason };
  }

  return {
    categoryId: profile.categoryId,
    categoryLabel: def.label,
    physicalForm: profile.physicalForm,
    profile,
    applicableEngines,
    calculationPolicy: profile.calculationPolicy,
    engineRoutingMap,
    primaryPerformanceDomains: profile.primaryPerformanceDomains,
    validationDomains: profile.validationDomains,
    isPowder: profile.physicalForm === 'POWDER'
  };
}

/**
 * Checks if salt-curve viscosity response applies to the given category.
 */
export function shouldCalculateViscositySaltCurve(category?: string): boolean {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.requiresViscositySaltCurve : false;
}

/**
 * Checks if HLB analysis is applicable to the given category.
 */
export function shouldCalculateHLB(category?: string): boolean {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.requiresHLBAnalysis : false;
}

/**
 * Checks if hard-water chelation capacity calculation is required.
 */
export function shouldCalculateHardnessChelation(category?: string): boolean {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.requiresChelationHardness : false;
}

/**
 * Checks if low-foam restriction is strictly enforced (e.g. Automatic Dishwashing).
 */
export function shouldEnforceLowFoam(category?: string): boolean {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.requiresLowFoamDeaeration : false;
}

/**
 * Checks if cationic surfactants are expected/allowed.
 */
export function shouldAllowCationicSurfactants(category?: string): boolean {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.allowCationicSurfactants : true;
}

/**
 * Checks if anionic surfactants are expected/allowed.
 */
export function shouldAllowAnionicSurfactants(category?: string): boolean {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.allowAnionicSurfactants : true;
}

/**
 * Gets surfactant type preference for the category.
 */
export function getCategoryExpectedSurfactantType(category?: string): SurfactantTypePreference {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.surfactantPreference : 'ANIONIC_DOMINANT';
}

/**
 * Gets the pH limits configured for the category.
 */
export function getCategoryPHLimits(category?: string): { min: number; max: number; optimal: number } {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.targetPHRange : { min: 6.0, max: 10.0, optimal: 8.0 };
}

/**
 * Gets active surfactant range configured for the category.
 */
export function getCategoryActiveSurfactantLimits(category?: string): { min: number; max: number; optimal: number } {
  const profile = tryGetScientificProductProfile(category);
  return profile ? profile.calculationPolicy.activeSurfactantRange : { min: 5.0, max: 25.0, optimal: 15.0 };
}

/**
 * Powder Engine delegation wrapper
 */
export function routePowderAnalysis(input: PowderEngineInput): PowderFormulationReport {
  return evaluatePowderFormulation(input);
}

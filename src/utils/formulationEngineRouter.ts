/**
 * ============================================================================
 * FORMULATION ENGINE ROUTER (DELEGATING TO SCIENTIFIC ROUTER)
 * ============================================================================
 */

import { PowderEngineInput, PowderFormulationReport } from './powderEngine';
import {
  isPowderCategory as isPowderCategoryScientific,
  routeScientificExecution,
  routePowderAnalysis as routePowderAnalysisScientific,
  shouldCalculateViscositySaltCurve,
  shouldCalculateHLB,
  shouldCalculateHardnessChelation,
  shouldEnforceLowFoam,
  shouldAllowCationicSurfactants,
  shouldAllowAnionicSurfactants,
  getCategoryExpectedSurfactantType,
  getCategoryPHLimits,
  getCategoryActiveSurfactantLimits,
  ScientificExecutionRoute
} from './scientificRouter';

export type FormulationEngineType = 'LIQUID' | 'POWDER';

export function isPowderCategory(category?: string, productType?: string): boolean {
  return isPowderCategoryScientific(category, productType);
}

export function getEngineTypeForCategory(category?: string, productType?: string): FormulationEngineType {
  return isPowderCategory(category, productType) ? 'POWDER' : 'LIQUID';
}

export function routePowderAnalysis(input: PowderEngineInput): PowderFormulationReport {
  return routePowderAnalysisScientific(input);
}

export {
  routeScientificExecution,
  shouldCalculateViscositySaltCurve,
  shouldCalculateHLB,
  shouldCalculateHardnessChelation,
  shouldEnforceLowFoam,
  shouldAllowCationicSurfactants,
  shouldAllowAnionicSurfactants,
  getCategoryExpectedSurfactantType,
  getCategoryPHLimits,
  getCategoryActiveSurfactantLimits
};
export type { ScientificExecutionRoute };

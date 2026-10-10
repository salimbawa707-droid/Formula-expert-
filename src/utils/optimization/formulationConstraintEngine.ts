/**
 * ============================================================================
 * FORMULATION CONSTRAINT ENGINE
 * ============================================================================
 * 
 * Inspired by Cheme-Nova/IntelliForm constraint architecture.
 * Converts user requirements and Scientific Product Profiles into hard and soft
 * formulation constraints evaluated against authoritative scientific outputs.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. Physical Form Routing: Liquid candidates NEVER evaluate powder metrics
 *    (loose bulk density, tapped density, Carr index, dissolution time).
 * 2. Hard Constraints vs Soft Objectives: Total mass = 100%, fatal incompatibilities,
 *    and mandatory specification bounds are HARD constraints. Cost ceilings and
 *    target performance thresholds can be configured as HARD or SOFT.
 * 3. Authoritative Origin: Constraints are derived directly from the
 *    ScientificProductProfile and ProductTaxonomy.
 * ============================================================================
 */

import { PhysicalForm, normalizeProductCategory } from '../../domain/productTaxonomy';
import { getScientificProductProfile, ScientificProductProfile } from '../../domain/scientificProductProfiles';
import { isPowderCategory } from '../formulationEngineRouter';

export type ConstraintType =
  | 'TOTAL_MASS_100'
  | 'ACTIVE_MATTER_RANGE'
  | 'PH_RANGE'
  | 'VISCOSITY_RANGE'
  | 'DENSITY_RANGE'
  | 'LIQUID_NVR_RANGE'
  | 'POWDER_BULK_DENSITY'
  | 'POWDER_DISSOLUTION_TIME'
  | 'COST_CEILING'
  | 'CPI_MINIMUM'
  | 'CHELATION_HARDNESS_MINIMUM'
  | 'ZERO_FATAL_INCOMPATIBILITY'
  | 'INGREDIENT_PERCENT_BOUNDS'
  | 'EXCLUDED_INGREDIENT'
  | 'REQUIRED_INGREDIENT';

export type ConstraintCriticality = 'HARD' | 'SOFT';

export interface FormulationConstraint {
  id: string;
  type: ConstraintType;
  name: string;
  criticality: ConstraintCriticality;
  targetMin?: number;
  targetMax?: number;
  targetValue?: number;
  targetIngredientId?: string;
  penaltyWeight: number; // multiplier for soft violation scoring
  isApplicable: boolean;
  physicalForm: PhysicalForm | 'ALL';
  scientificBasis: string;
}

export interface CandidateScientificMetrics {
  totalMassPercentage: number;
  pH: number;
  activeSurfactantPercentage: number;
  viscosityCp?: number;
  densityGPerCm3?: number;
  liquidNvrPercentage?: number;
  powderBulkDensityGPerL?: number;
  powderDissolutionSeconds?: number;
  costPerKg?: number;
  hasIncompleteCost?: boolean;
  costStatus?: 'KNOWN' | 'INCOMPLETE' | 'UNKNOWN';
  cpi: number;
  waterHardnessCapacityPpm: number;
  hasFatalIncompatibility: boolean;
  hasCriticalSpecificationFailure: boolean;
  ingredients: Array<{ id: string; percentage: number }>;
}

export interface ConstraintEvaluationItem {
  constraintId: string;
  name: string;
  type: ConstraintType;
  criticality: ConstraintCriticality;
  isSatisfied: boolean;
  isApplicable: boolean;
  currentValue?: number | string;
  targetRangeDisplay: string;
  deviation: number;
  penalty: number;
  message: string;
}

export interface ConstraintEvaluationSummary {
  isHardFeasible: boolean;
  hardViolationCount: number;
  softViolationCount: number;
  totalPenalty: number;
  results: ConstraintEvaluationItem[];
  applicableCount: number;
}

/**
 * Builds standard constraints dynamically from the Scientific Product Profile
 * and category specifications.
 */
export function buildProductConstraints(
  categoryInput: string,
  subCategory?: string,
  customOverrides?: Partial<FormulationConstraint>[]
): FormulationConstraint[] {
  const categoryId = normalizeProductCategory(categoryInput);
  const isPowder = isPowderCategory(categoryId);
  const profile: ScientificProductProfile = getScientificProductProfile(categoryId, subCategory);

  const constraints: FormulationConstraint[] = [];

  // 1. Total Mass = 100% (Absolute Hard Constraint)
  constraints.push({
    id: 'HARD_TOTAL_MASS_100',
    type: 'TOTAL_MASS_100',
    name: 'Formula Mass Balance Sum = 100%',
    criticality: 'HARD',
    targetMin: 99.95,
    targetMax: 100.05,
    targetValue: 100.0,
    penaltyWeight: 1000.0,
    isApplicable: true,
    physicalForm: 'ALL',
    scientificBasis: 'Conservation of mass; commercial batching requires exact 100% formulation mass balance.',
  });

  // 2. Fatal Incompatibility (Absolute Hard Constraint)
  constraints.push({
    id: 'HARD_ZERO_FATAL_INCOMPATIBILITY',
    type: 'ZERO_FATAL_INCOMPATIBILITY',
    name: 'Zero Fatal Incompatibilities',
    criticality: 'HARD',
    penaltyWeight: 500.0,
    isApplicable: true,
    physicalForm: 'ALL',
    scientificBasis: 'Prevents phase inversion, explosive gas generation, or hazardous precipitation.',
  });

  // 3. pH Range from Profile / Spec
  const phPolicy = profile.calculationPolicy.targetPHRange;
  constraints.push({
    id: 'SPEC_PH_RANGE',
    type: 'PH_RANGE',
    name: `${profile.label} Target Formulation pH`,
    criticality: 'HARD',
    targetMin: phPolicy.min,
    targetMax: phPolicy.max,
    targetValue: phPolicy.optimal,
    penaltyWeight: 50.0,
    isApplicable: true,
    physicalForm: 'ALL',
    scientificBasis: `Target pH range (${phPolicy.min} - ${phPolicy.max}) defined by scientific product profile.`,
  });

  // 4. Active Surfactant Range
  const activePolicy = profile.calculationPolicy.activeSurfactantRange;
  constraints.push({
    id: 'SPEC_ACTIVE_SURFACTANT_RANGE',
    type: 'ACTIVE_MATTER_RANGE',
    name: 'Active Surfactant Matter %',
    criticality: 'HARD',
    targetMin: activePolicy.min,
    targetMax: activePolicy.max,
    targetValue: activePolicy.optimal,
    penaltyWeight: 40.0,
    isApplicable: true,
    physicalForm: 'ALL',
    scientificBasis: `Surfactant concentration (${activePolicy.min}% - ${activePolicy.max}%) required for detergence regime.`,
  });

  // 5. Viscosity (Liquid only)
  if (!isPowder && profile.calculationPolicy.targetViscosityCP) {
    const visc = profile.calculationPolicy.targetViscosityCP;
    constraints.push({
      id: 'SPEC_VISCOSITY_RANGE',
      type: 'VISCOSITY_RANGE',
      name: 'Dynamic Rheology Viscosity (cP)',
      criticality: 'SOFT',
      targetMin: visc.min,
      targetMax: visc.max,
      targetValue: visc.optimal,
      penaltyWeight: 15.0,
      isApplicable: true,
      physicalForm: 'LIQUID',
      scientificBasis: `Viscosity range (${visc.min} - ${visc.max} cP) for liquid dispensing and clinging behavior.`,
    });
  }

  // 6. Liquid NVR / Non-Volatile Residue (Liquid only)
  if (!isPowder) {
    constraints.push({
      id: 'SPEC_LIQUID_NVR_RANGE',
      type: 'LIQUID_NVR_RANGE',
      name: 'Liquid NVR / Total Solids Residue (%)',
      criticality: 'SOFT',
      targetMin: Math.max(5.0, activePolicy.min),
      targetMax: 65.0,
      penaltyWeight: 10.0,
      isApplicable: true,
      physicalForm: 'LIQUID',
      scientificBasis: 'Non-volatile matter solids balance at 105°C for liquid commercial specification.',
    });
  }

  // 7. Powder-Specific Parameters (POWDER ONLY — Strictly excluded for Liquids)
  if (isPowder) {
    constraints.push({
      id: 'SPEC_POWDER_BULK_DENSITY',
      type: 'POWDER_BULK_DENSITY',
      name: 'Loose Powder Bulk Density (g/L)',
      criticality: 'SOFT',
      targetMin: 400.0,
      targetMax: 900.0,
      targetValue: 650.0,
      penaltyWeight: 20.0,
      isApplicable: true,
      physicalForm: 'POWDER',
      scientificBasis: 'Volumetric carton packaging fill density for laundry powder.',
    });

    constraints.push({
      id: 'SPEC_POWDER_DISSOLUTION_TIME',
      type: 'POWDER_DISSOLUTION_TIME',
      name: 'Aqueous Dissolution Time (seconds)',
      criticality: 'SOFT',
      targetMax: 90.0,
      penaltyWeight: 15.0,
      isApplicable: true,
      physicalForm: 'POWDER',
      scientificBasis: 'Aqueous powder dissolution speed to avoid undissolved fabric residue.',
    });
  }

  // 8. Chelation / Hard Water Capacity
  if (profile.calculationPolicy.requiresChelationHardness) {
    constraints.push({
      id: 'SPEC_CHELATION_HARDNESS_MINIMUM',
      type: 'CHELATION_HARDNESS_MINIMUM',
      name: 'Water Hardness Chelation Capacity (ppm CaCO3)',
      criticality: 'SOFT',
      targetMin: 150.0, // Standard water hardness benchmark
      penaltyWeight: 35.0,
      isApplicable: true,
      physicalForm: 'ALL',
      scientificBasis: 'Sequestration threshold to prevent Ca/Mg surfactant precipitation under hard water.',
    });
  }

  // 9. Cleaning Performance Minimum (CPI)
  constraints.push({
    id: 'OBJECTIVE_CPI_MINIMUM',
    type: 'CPI_MINIMUM',
    name: 'Cleaning Performance Index Minimum (CPI)',
    criticality: 'SOFT',
    targetMin: 65.0,
    penaltyWeight: 30.0,
    isApplicable: true,
    physicalForm: 'ALL',
    scientificBasis: 'Standard formulation benchmark for detergency and particulate/grease removal.',
  });

  // 10. Cost Ceiling
  constraints.push({
    id: 'OBJECTIVE_COST_CEILING',
    type: 'COST_CEILING',
    name: 'Batch Raw Material Cost Ceiling ($/kg)',
    criticality: 'SOFT',
    targetMax: 3.50,
    penaltyWeight: 25.0,
    isApplicable: true,
    physicalForm: 'ALL',
    scientificBasis: 'Commercial economic boundary per kilogram of finished formulated product.',
  });

  // Apply user custom overrides if supplied
  if (customOverrides && customOverrides.length > 0) {
    for (const ov of customOverrides) {
      if (!ov.id) continue;
      const idx = constraints.findIndex(c => c.id === ov.id);
      if (idx >= 0) {
        constraints[idx] = { ...constraints[idx], ...ov };
      } else if (ov.type && ov.name) {
        constraints.push({
          id: ov.id,
          type: ov.type,
          name: ov.name,
          criticality: ov.criticality || 'SOFT',
          targetMin: ov.targetMin,
          targetMax: ov.targetMax,
          targetValue: ov.targetValue,
          targetIngredientId: ov.targetIngredientId,
          penaltyWeight: ov.penaltyWeight ?? 20.0,
          isApplicable: ov.isApplicable ?? true,
          physicalForm: ov.physicalForm || 'ALL',
          scientificBasis: ov.scientificBasis || 'User-defined formulation constraint.',
        });
      }
    }
  }

  return constraints;
}

/**
 * Evaluates candidate metrics against the active constraint set.
 */
export function evaluateFormulationConstraints(
  constraints: FormulationConstraint[],
  metrics: CandidateScientificMetrics
): ConstraintEvaluationSummary {
  let isHardFeasible = true;
  let hardViolationCount = 0;
  let softViolationCount = 0;
  let totalPenalty = 0;
  let applicableCount = 0;

  const results: ConstraintEvaluationItem[] = [];

  for (const c of constraints) {
    if (!c.isApplicable) {
      results.push({
        constraintId: c.id,
        name: c.name,
        type: c.type,
        criticality: c.criticality,
        isSatisfied: true,
        isApplicable: false,
        currentValue: 'NOT_APPLICABLE',
        targetRangeDisplay: 'N/A (Excluded for physical form)',
        deviation: 0,
        penalty: 0,
        message: 'Parameter not applicable to this physical form.',
      });
      continue;
    }

    applicableCount++;
    let isSatisfied = true;
    let deviation = 0;
    let val: number | string | undefined;
    let rangeDisplay = '';
    let msg = 'Compliant';

    switch (c.type) {
      case 'TOTAL_MASS_100': {
        val = metrics.totalMassPercentage;
        rangeDisplay = '100.00% ± 0.05%';
        const diff = Math.abs(metrics.totalMassPercentage - 100.0);
        if (diff > 0.05) {
          isSatisfied = false;
          deviation = diff;
          msg = `Mass balance sum is ${metrics.totalMassPercentage.toFixed(2)}% (must equal 100.00%).`;
        }
        break;
      }

      case 'ZERO_FATAL_INCOMPATIBILITY': {
        val = metrics.hasFatalIncompatibility ? 'FATAL_INCOMPATIBILITY' : 'COMPATIBLE';
        rangeDisplay = 'Zero Fatal Incompatibilities';
        if (metrics.hasFatalIncompatibility) {
          isSatisfied = false;
          deviation = 1.0;
          msg = 'Formula triggers a fatal chemical or physical incompatibility.';
        }
        break;
      }

      case 'PH_RANGE': {
        val = metrics.pH;
        rangeDisplay = `${c.targetMin ?? '-'} - ${c.targetMax ?? '-'}`;
        if (c.targetMin !== undefined && metrics.pH < c.targetMin) {
          isSatisfied = false;
          deviation = (c.targetMin - metrics.pH) / Math.max(1.0, c.targetMin);
          msg = `pH ${metrics.pH.toFixed(2)} is below minimum (${c.targetMin}).`;
        } else if (c.targetMax !== undefined && metrics.pH > c.targetMax) {
          isSatisfied = false;
          deviation = (metrics.pH - c.targetMax) / Math.max(1.0, c.targetMax);
          msg = `pH ${metrics.pH.toFixed(2)} is above maximum (${c.targetMax}).`;
        }
        break;
      }

      case 'ACTIVE_MATTER_RANGE': {
        val = metrics.activeSurfactantPercentage;
        rangeDisplay = `${c.targetMin ?? '-'}% - ${c.targetMax ?? '-'}%`;
        if (c.targetMin !== undefined && metrics.activeSurfactantPercentage < c.targetMin) {
          isSatisfied = false;
          deviation = (c.targetMin - metrics.activeSurfactantPercentage) / Math.max(1.0, c.targetMin);
          msg = `Active surfactant ${metrics.activeSurfactantPercentage.toFixed(1)}% is below minimum (${c.targetMin}%).`;
        } else if (c.targetMax !== undefined && metrics.activeSurfactantPercentage > c.targetMax) {
          isSatisfied = false;
          deviation = (metrics.activeSurfactantPercentage - c.targetMax) / Math.max(1.0, c.targetMax);
          msg = `Active surfactant ${metrics.activeSurfactantPercentage.toFixed(1)}% exceeds maximum (${c.targetMax}%).`;
        }
        break;
      }

      case 'VISCOSITY_RANGE': {
        val = metrics.viscosityCp;
        rangeDisplay = `${c.targetMin ?? '-'} - ${c.targetMax ?? '-'} cP`;
        if (metrics.viscosityCp !== undefined) {
          if (c.targetMin !== undefined && metrics.viscosityCp < c.targetMin) {
            isSatisfied = false;
            deviation = (c.targetMin - metrics.viscosityCp) / Math.max(10.0, c.targetMin);
            msg = `Viscosity ${metrics.viscosityCp.toFixed(0)} cP is below minimum (${c.targetMin} cP).`;
          } else if (c.targetMax !== undefined && metrics.viscosityCp > c.targetMax) {
            isSatisfied = false;
            deviation = (metrics.viscosityCp - c.targetMax) / Math.max(10.0, c.targetMax);
            msg = `Viscosity ${metrics.viscosityCp.toFixed(0)} cP exceeds maximum (${c.targetMax} cP).`;
          }
        }
        break;
      }

      case 'LIQUID_NVR_RANGE': {
        val = metrics.liquidNvrPercentage;
        rangeDisplay = `${c.targetMin ?? '-'}% - ${c.targetMax ?? '-'}%`;
        if (metrics.liquidNvrPercentage !== undefined) {
          if (c.targetMin !== undefined && metrics.liquidNvrPercentage < c.targetMin) {
            isSatisfied = false;
            deviation = (c.targetMin - metrics.liquidNvrPercentage) / Math.max(1.0, c.targetMin);
            msg = `Liquid NVR ${metrics.liquidNvrPercentage.toFixed(1)}% is below target minimum (${c.targetMin}%).`;
          } else if (c.targetMax !== undefined && metrics.liquidNvrPercentage > c.targetMax) {
            isSatisfied = false;
            deviation = (metrics.liquidNvrPercentage - c.targetMax) / Math.max(1.0, c.targetMax);
            msg = `Liquid NVR ${metrics.liquidNvrPercentage.toFixed(1)}% exceeds target maximum (${c.targetMax}%).`;
          }
        }
        break;
      }

      case 'POWDER_BULK_DENSITY': {
        val = metrics.powderBulkDensityGPerL;
        rangeDisplay = `${c.targetMin ?? '-'} - ${c.targetMax ?? '-'} g/L`;
        if (metrics.powderBulkDensityGPerL !== undefined) {
          if (c.targetMin !== undefined && metrics.powderBulkDensityGPerL < c.targetMin) {
            isSatisfied = false;
            deviation = (c.targetMin - metrics.powderBulkDensityGPerL) / Math.max(50.0, c.targetMin);
            msg = `Powder bulk density ${metrics.powderBulkDensityGPerL.toFixed(0)} g/L is below minimum.`;
          } else if (c.targetMax !== undefined && metrics.powderBulkDensityGPerL > c.targetMax) {
            isSatisfied = false;
            deviation = (metrics.powderBulkDensityGPerL - c.targetMax) / Math.max(50.0, c.targetMax);
            msg = `Powder bulk density ${metrics.powderBulkDensityGPerL.toFixed(0)} g/L exceeds maximum.`;
          }
        }
        break;
      }

      case 'POWDER_DISSOLUTION_TIME': {
        val = metrics.powderDissolutionSeconds;
        rangeDisplay = `<= ${c.targetMax ?? '-'} s`;
        if (metrics.powderDissolutionSeconds !== undefined && c.targetMax !== undefined && metrics.powderDissolutionSeconds > c.targetMax) {
          isSatisfied = false;
          deviation = (metrics.powderDissolutionSeconds - c.targetMax) / Math.max(10.0, c.targetMax);
          msg = `Dissolution time ${metrics.powderDissolutionSeconds.toFixed(1)}s exceeds limit (${c.targetMax}s).`;
        }
        break;
      }

      case 'CHELATION_HARDNESS_MINIMUM': {
        val = metrics.waterHardnessCapacityPpm;
        rangeDisplay = `>= ${c.targetMin ?? '-'} ppm CaCO3`;
        if (c.targetMin !== undefined && metrics.waterHardnessCapacityPpm < c.targetMin) {
          isSatisfied = false;
          deviation = (c.targetMin - metrics.waterHardnessCapacityPpm) / Math.max(10.0, c.targetMin);
          msg = `Water hardness tolerance ${metrics.waterHardnessCapacityPpm.toFixed(0)} ppm is insufficient for hard water (target >= ${c.targetMin} ppm).`;
        }
        break;
      }

      case 'CPI_MINIMUM': {
        val = metrics.cpi;
        rangeDisplay = `>= ${c.targetMin ?? '-'}`;
        if (c.targetMin !== undefined && metrics.cpi < c.targetMin) {
          isSatisfied = false;
          deviation = (c.targetMin - metrics.cpi) / Math.max(10.0, c.targetMin);
          msg = `Cleaning performance index ${metrics.cpi.toFixed(1)} is below benchmark (${c.targetMin}).`;
        }
        break;
      }

      case 'COST_CEILING': {
        val = metrics.costPerKg;
        rangeDisplay = `<= $${c.targetMax?.toFixed(2) ?? '-'}/kg`;
        if (metrics.hasIncompleteCost) {
          val = 'COST_DATA_INCOMPLETE';
          isSatisfied = false;
          deviation = 0.5;
          msg = 'Cost data is incomplete for one or more ingredients in candidate.';
        } else if (metrics.costPerKg !== undefined && c.targetMax !== undefined && metrics.costPerKg > c.targetMax) {
          isSatisfied = false;
          deviation = (metrics.costPerKg - c.targetMax) / Math.max(0.5, c.targetMax);
          msg = `Raw material cost $${metrics.costPerKg.toFixed(2)}/kg exceeds ceiling ($${c.targetMax.toFixed(2)}/kg).`;
        }
        break;
      }

      case 'EXCLUDED_INGREDIENT': {
        if (c.targetIngredientId) {
          const present = metrics.ingredients.find(i => i.id === c.targetIngredientId && i.percentage > 0);
          val = present ? `${present.percentage}% present` : 'Absent';
          rangeDisplay = `Excluded (${c.targetIngredientId})`;
          if (present) {
            isSatisfied = false;
            deviation = present.percentage / 10.0;
            msg = `Excluded ingredient ${c.targetIngredientId} is present at ${present.percentage}%.`;
          }
        }
        break;
      }

      case 'REQUIRED_INGREDIENT': {
        if (c.targetIngredientId) {
          const present = metrics.ingredients.find(i => (i.id === c.targetIngredientId || (i as any).name === c.targetIngredientId) && i.percentage > 0);
          val = present ? `${present.percentage}%` : '0%';
          rangeDisplay = `>= ${c.targetMin ?? 0.1}%`;
          if (!present || (c.targetMin !== undefined && present.percentage < c.targetMin)) {
            isSatisfied = false;
            deviation = 1.0;
            msg = `Required ingredient ${c.targetIngredientId} is missing or below minimum (${c.targetMin ?? 0.1}%).`;
          }
        }
        break;
      }

      case 'INGREDIENT_PERCENT_BOUNDS': {
        if (c.targetIngredientId) {
          const item = metrics.ingredients.find(i => i.id === c.targetIngredientId || (i as any).name === c.targetIngredientId);
          const currentPct = item ? item.percentage : 0;
          val = `${currentPct.toFixed(2)}%`;
          rangeDisplay = `${c.targetMin ?? 0}% - ${c.targetMax ?? 100}%`;
          if (c.targetMin !== undefined && currentPct < c.targetMin) {
            isSatisfied = false;
            deviation = (c.targetMin - currentPct) / Math.max(0.1, c.targetMin);
            msg = `Ingredient ${c.targetIngredientId} is ${currentPct.toFixed(2)}%, below minimum ${c.targetMin}%.`;
          } else if (c.targetMax !== undefined && currentPct > c.targetMax) {
            isSatisfied = false;
            deviation = (currentPct - c.targetMax) / Math.max(0.1, c.targetMax);
            msg = `Ingredient ${c.targetIngredientId} is ${currentPct.toFixed(2)}%, above maximum ${c.targetMax}%.`;
          }
        }
        break;
      }

      default:
        break;
    }

    const penalty = isSatisfied ? 0 : Math.max(1.0, deviation) * c.penaltyWeight;

    if (!isSatisfied) {
      if (c.criticality === 'HARD') {
        isHardFeasible = false;
        hardViolationCount++;
      } else {
        softViolationCount++;
      }
      totalPenalty += penalty;
    }

    results.push({
      constraintId: c.id,
      name: c.name,
      type: c.type,
      criticality: c.criticality,
      isSatisfied,
      isApplicable: true,
      currentValue: val,
      targetRangeDisplay: rangeDisplay,
      deviation: Number(deviation.toFixed(3)),
      penalty: Number(penalty.toFixed(2)),
      message: msg,
    });
  }

  return {
    isHardFeasible,
    hardViolationCount,
    softViolationCount,
    totalPenalty: Number(totalPenalty.toFixed(2)),
    results,
    applicableCount,
  };
}

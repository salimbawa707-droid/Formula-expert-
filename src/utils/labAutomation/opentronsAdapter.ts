/**
 * Opentrons Adapter Layer
 * 
 * Clean adapter layer that interfaces between Detergent Formula Expert domain objects
 * (Formulas, Optimization Candidates) and Opentrons experiment representations.
 * 
 * ABSOLUTE SAFETY CONSTRAINT:
 * This module does NOT implement direct robot connection, hardware discovery, or movement drivers.
 */

import { FormulationIngredient } from '../../types';
import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';
import { ExperimentDesign, ExperimentIngredient, ExperimentType } from './types';
import { generateExperimentProtocol, ProtocolGenerationOptions } from './experimentProtocolGenerator';
import { ProtocolDefinition } from './types';

export interface CreateExperimentFromFormulaOptions {
  formulaId: string;
  formulaName: string;
  formulaVersionId?: string;
  productCategory: ProductCategoryId;
  physicalForm: PhysicalForm;
  ingredients: FormulationIngredient[];
  targetScaleUl?: number; // default e.g. 200 µL for 96-well screening
  replicates?: number; // default 3
  objective?: string;
  experimentType?: ExperimentType;
  temperatureCelsius?: number;
  mixingRequired?: boolean;
  createdBy?: string;
}

/**
 * Creates an ExperimentDesign from a formula snapshot
 */
export function createExperimentDesignFromFormula(
  options: CreateExperimentFromFormulaOptions
): ExperimentDesign {
  const experimentId = `EXP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const expIngredients: ExperimentIngredient[] = options.ingredients.map((ing, idx) => {
    // Determine viscosity class from ingredient category / name
    let vClass: ExperimentIngredient['viscosityClass'] = 'LOW_AQUEOUS';
    const nameLower = (ing.name || '').toLowerCase();
    const catLower = (ing.category || ing.function || ing.role || '').toLowerCase();

    if (nameLower.includes('labsa') || nameLower.includes('sles') || nameLower.includes('paste') || nameLower.includes('viscous')) {
      vClass = 'HIGH_VISCOUS';
    } else if (catLower.includes('surfactant') || nameLower.includes('coco') || nameLower.includes('glucoside')) {
      vClass = 'MEDIUM_SURFACTANT';
    } else if (nameLower.includes('ethanol') || nameLower.includes('alcohol') || nameLower.includes('solvent')) {
      vClass = 'VOLATILE_SOLVENT';
    }

    const pct = ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;
    const stockConc = ing.activePercent ?? ing.activeMatterPct ?? ing.activeMatterPurity ?? 100;
    const targetScale = options.targetScaleUl || 200;
    const reqVol = Number(((pct / Math.max(1, stockConc)) * targetScale).toFixed(1));

    return {
      canonicalIngredientId: ing.id || `ING-${idx + 1}-${ing.name.replace(/\s+/g, '_')}`,
      tradeName: ing.name,
      inciName: ing.inciName || ing.name,
      concentrationInStockPercent: stockConc,
      targetFormulaPercent: pct,
      requiredVolumeUl: reqVol,
      viscosityClass: vClass,
    };
  });

  const totalPct = options.ingredients.reduce((s, i) => s + (i.percentage ?? i.percent ?? i.percentageInFormula ?? 0), 0);

  return {
    id: experimentId,
    name: `Automated Dispense: ${options.formulaName}`,
    objective: options.objective || `Automated liquid handling & screening for formula ${options.formulaName}`,
    experimentType: options.experimentType || 'FORMULATION_DISPENSE',
    formulaId: options.formulaId,
    formulaVersionId: options.formulaVersionId,
    formulaName: options.formulaName,
    productCategory: options.productCategory,
    physicalForm: options.physicalForm,
    targetScaleUl: options.targetScaleUl || 200,
    replicates: options.replicates || 3,
    ingredients: expIngredients,
    constraints: [
      `Target scale: ${options.targetScaleUl || 200} µL per well`,
      `Replicates: ${options.replicates || 3}`,
      `Total formulation percentage: ${totalPct.toFixed(2)}%`,
    ],
    processParameters: {
      mixingRequired: options.mixingRequired ?? true,
      mixVolumeUl: Math.round((options.targetScaleUl || 200) * 0.5),
      mixCycles: 5,
      temperatureCelsius: options.temperatureCelsius,
      humanInputRequiredWarnings: options.temperatureCelsius === undefined
        ? ['Process temperature unspecified: confirm ambient temperature conditioning (20-25°C).']
        : [],
    },
    status: 'DESIGNED',
    createdAt: new Date().toISOString(),
    createdBy: options.createdBy || 'Detergent Formula Expert',
  };
}

/**
 * Creates and validates an Opentrons protocol directly from formula options
 */
export function buildProtocolFromFormula(
  formulaOptions: CreateExperimentFromFormulaOptions,
  protocolOptions: ProtocolGenerationOptions = {}
): { experiment: ExperimentDesign; protocol: ProtocolDefinition } {
  const experiment = createExperimentDesignFromFormula(formulaOptions);
  const protocol = generateExperimentProtocol(experiment, protocolOptions);
  return { experiment, protocol };
}

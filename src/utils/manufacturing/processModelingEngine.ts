/**
 * ============================================================================
 * MANUFACTURING PROCESS MODELING ENGINE
 * ============================================================================
 * 
 * Inspired by Cheme-Nova/IntelliForm process and manufacturing reasoning.
 * Models industrial batching sequence, raw material addition order, shear rate
 * regimes, and temperature controls based on detergent physical chemistry.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. Addition Sequence: Water charge -> Builders/Chelates -> Neutralizers ->
 *    Acid Slurry -> Primary Surfactants -> Electrolytes -> Cooling -> Actives.
 * 2. Temperature Safeguards: Preservatives, enzymes, and fragrances must only
 *    be added at <= 35°C to prevent thermal denaturation / volatility loss.
 * 3. Provenance: Labeled as 'MODELLED_PROCESS' until validated by physical batch logs.
 * ============================================================================
 */

import { FormulationIngredient } from '../../types';
import { ProductCategoryId, PhysicalForm, normalizeProductCategory } from '../../domain/productTaxonomy';
import { isPowderCategory } from '../formulationEngineRouter';

export interface ProcessStepInstruction {
  stepNumber: number;
  phaseName: string;
  targetIngredients: string[];
  additionMethod: 'BULK_CHARGE' | 'SLOW_METERED_ADDITION' | 'INCREMENTAL_SALT_TITRATION' | 'PRE_DISSOLVED_SLURRY';
  targetTemperatureC: { min: number; max: number };
  recommendedAgitation: 'LOW_SHEAR_PADDLE' | 'MEDIUM_SHEAR_TURBINE' | 'HIGH_SHEAR_HOMOGENIZER';
  mixingDurationMinutes: number;
  criticalQualityControls: string[];
  safetyPrecautions?: string[];
}

export interface ModeledManufacturingProcess {
  processId: string;
  categoryId: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  physicalForm: PhysicalForm;
  batchSizeKg: number;
  totalEstimatedBatchTimeMinutes: number;
  status: 'MODELLED_PROCESS';
  processSteps: ProcessStepInstruction[];
  thermalWarnings: string[];
  shearWarnings: string[];
  provenanceNote: string;
}

/**
 * Classifies an ingredient into its physical-chemical addition phase
 */
function classifyIngredientAdditionPhase(ing: FormulationIngredient): number {
  const id = (ing.id || '').toLowerCase();
  const name = (ing.name || '').toLowerCase();
  const cat = (ing.category || '').toLowerCase();

  // Phase 1: Water charge
  if (/water|deionized|solvent/i.test(id) || /water|deionized/i.test(name)) return 1;

  // Phase 2: Chelators & Mineral Builders
  if (/chelator|builder|edta|glda|citrate|phosphonate|soda-ash|carbonate|metasilicate/i.test(id) ||
      /chelator|builder|sequestrant/i.test(cat)) return 2;

  // Phase 3: Strong Bases & Neutralizers
  if (/caustic|hydroxide|soda-pearls|potash|neutralizer|tea|triethanolamine/i.test(id) ||
      /hydroxide|neutralizer/i.test(name)) return 3;

  // Phase 4: Acid Surfactant Slurry (Exothermic Neutralization)
  if (/labsa|sulfonic-acid|acid-slurry|stearic-acid/i.test(id) ||
      /sulfonic acid|acid slurry/i.test(name)) return 4;

  // Phase 5: Primary & Secondary Surfactants (High Foam, Low Shear)
  if (/sles|sls|capb|betaine|aos|apg|glucoside|lauryl-ether|amine-oxide/i.test(id) ||
      /anionic surfactant|amphoteric surfactant|nonionic surfactant/i.test(cat)) return 5;

  // Phase 6: Rheology Modifiers & Electrolytes (Viscosity Adjustment)
  if (/sodium-chloride|salt|electrolyte|viscosity-builder|polymer|thickener/i.test(id) ||
      /thickener|rheology/i.test(cat)) return 6;

  // Phase 7: Heat-Sensitive Actives (Enzymes, Preservatives, Fragrance, Dyes)
  if (/enzyme|protease|amylase|cellulase|preservative|isothiazolinone|dmdm|phenoxy|fragrance|perfume|dye|color/i.test(id) ||
      /preservative|enzyme|fragrance/i.test(cat)) return 7;

  return 5; // default surfactant / active phase
}

/**
 * Generates an authoritative manufacturing process sequence for liquid or powder detergents.
 */
export function modelManufacturingProcess(
  ingredients: FormulationIngredient[],
  categoryInput: string,
  batchSizeKg = 1000
): ModeledManufacturingProcess {
  const categoryId = normalizeProductCategory(categoryInput);
  const isPowder = isPowderCategory(categoryId);
  const steps: ProcessStepInstruction[] = [];
  const thermalWarnings: string[] = [];
  const shearWarnings: string[] = [];

  if (isPowder) {
    // Powder Manufacturing Process (Dry ribbon / Nauta blending / agglomeration)
    steps.push({
      stepNumber: 1,
      phaseName: 'Bulk Builder & Neutral Salt Dry Charge',
      targetIngredients: ingredients.filter(i => /carbonate|sulfate|soda-ash|builder|filler/i.test(i.name)).map(i => i.name),
      additionMethod: 'BULK_CHARGE',
      targetTemperatureC: { min: 20, max: 35 },
      recommendedAgitation: 'LOW_SHEAR_PADDLE',
      mixingDurationMinutes: 10,
      criticalQualityControls: ['Verify dry powder moisture < 2.0%', 'Check zero caking / lumps'],
      safetyPrecautions: ['Use dust-extraction hoods', 'Wear particulate PPE mask'],
    });

    steps.push({
      stepNumber: 2,
      phaseName: 'Surfactant Paste Atomization / Spray-On',
      targetIngredients: ingredients.filter(i => /labsa|paste|slurry|surfactant/i.test(i.name)).map(i => i.name),
      additionMethod: 'SLOW_METERED_ADDITION',
      targetTemperatureC: { min: 45, max: 65 },
      recommendedAgitation: 'MEDIUM_SHEAR_TURBINE',
      mixingDurationMinutes: 15,
      criticalQualityControls: ['Ensure uniform droplet atomization', 'Prevent localized agglomerate balling'],
    });

    steps.push({
      stepNumber: 3,
      phaseName: 'Bleach & Post-Add Actives Dry Blending',
      targetIngredients: ingredients.filter(i => /percarbonate|enzyme|speckle|fragrance|optical/i.test(i.name)).map(i => i.name),
      additionMethod: 'BULK_CHARGE',
      targetTemperatureC: { min: 20, max: 30 },
      recommendedAgitation: 'LOW_SHEAR_PADDLE',
      mixingDurationMinutes: 8,
      criticalQualityControls: ['Enzyme prill integrity check', 'Bulk density confirmation (500 - 800 g/L)'],
    });
  } else {
    // Liquid Detergent Manufacturing Process
    const hasAcidSlurry = ingredients.some(i => /labsa|sulfonic/i.test(i.id || '') || /labsa|sulfonic/i.test(i.name || ''));
    const hasCaustic = ingredients.some(i => /caustic|hydroxide/i.test(i.id || '') || /caustic|hydroxide/i.test(i.name || ''));

    // Phase 1: Main Water Charge & Chelation
    steps.push({
      stepNumber: 1,
      phaseName: 'Initial Water Charge & Sequestrant Dissolution',
      targetIngredients: ingredients.filter(i => classifyIngredientAdditionPhase(i) === 1 || classifyIngredientAdditionPhase(i) === 2).map(i => i.name),
      additionMethod: 'BULK_CHARGE',
      targetTemperatureC: { min: 20, max: 40 },
      recommendedAgitation: 'MEDIUM_SHEAR_TURBINE',
      mixingDurationMinutes: 10,
      criticalQualityControls: ['Verify complete clarity and dissolution before adding surfactants'],
    });

    // Phase 2: In-situ Neutralization (if LABSA present)
    if (hasAcidSlurry && hasCaustic) {
      steps.push({
        stepNumber: 2,
        phaseName: 'Controlled In-Situ Neutralization (Acid Slurry + Caustic)',
        targetIngredients: ingredients.filter(i => classifyIngredientAdditionPhase(i) === 3 || classifyIngredientAdditionPhase(i) === 4).map(i => i.name),
        additionMethod: 'SLOW_METERED_ADDITION',
        targetTemperatureC: { min: 35, max: 55 },
        recommendedAgitation: 'MEDIUM_SHEAR_TURBINE',
        mixingDurationMinutes: 25,
        criticalQualityControls: ['Monitor exotherm: maintain vessel <= 55°C', 'In-process pH titration check (target pH 7.5 - 8.5)'],
        safetyPrecautions: ['Exothermic reaction: maintain jacketed cooling', 'Wear chemical face shield and neoprene gloves'],
      });
      thermalWarnings.push('Exothermic neutralization generates reaction heat; jacketed cooling recommended.');
    }

    // Phase 3: Surfactants Dissolution
    steps.push({
      stepNumber: steps.length + 1,
      phaseName: 'Primary & Secondary Surfactants Dissolution',
      targetIngredients: ingredients.filter(i => classifyIngredientAdditionPhase(i) === 5).map(i => i.name),
      additionMethod: 'SLOW_METERED_ADDITION',
      targetTemperatureC: { min: 25, max: 45 },
      recommendedAgitation: 'LOW_SHEAR_PADDLE',
      mixingDurationMinutes: 20,
      criticalQualityControls: ['Maintain subsurface impeller depth to eliminate air vortex entrapment', 'Confirm complete solubilization'],
    });
    shearWarnings.push('High-shear mixing will generate excessive macro-foam; keep agitation submerged.');

    // Phase 4: Electrolyte Viscosity Adjustment
    const saltIngs = ingredients.filter(i => classifyIngredientAdditionPhase(i) === 6);
    if (saltIngs.length > 0) {
      steps.push({
        stepNumber: steps.length + 1,
        phaseName: 'Viscosity Trimming via Electrolyte Titration',
        targetIngredients: saltIngs.map(i => i.name),
        additionMethod: 'INCREMENTAL_SALT_TITRATION',
        targetTemperatureC: { min: 25, max: 35 },
        recommendedAgitation: 'MEDIUM_SHEAR_TURBINE',
        mixingDurationMinutes: 15,
        criticalQualityControls: ['Dose electrolyte incrementally in 0.25% steps', 'In-process Brookfield viscosity check'],
      });
    }

    // Phase 5: Cooling & Post-Addition of Thermally-Sensitive Actives
    const heatSensitives = ingredients.filter(i => classifyIngredientAdditionPhase(i) === 7);
    if (heatSensitives.length > 0) {
      steps.push({
        stepNumber: steps.length + 1,
        phaseName: 'Cool-Down & Thermally-Sensitive Actives Post-Addition',
        targetIngredients: heatSensitives.map(i => i.name),
        additionMethod: 'SLOW_METERED_ADDITION',
        targetTemperatureC: { min: 20, max: 35 },
        recommendedAgitation: 'LOW_SHEAR_PADDLE',
        mixingDurationMinutes: 10,
        criticalQualityControls: ['Strict vessel temperature check: MUST be <= 35°C before enzyme or preservative addition', 'Final batch pH and appearance verification'],
        safetyPrecautions: ['Do not add enzymes to hot solution (irreversible thermal inactivation occurs at > 40°C)'],
      });
    }
  }

  const totalTime = steps.reduce((sum, s) => sum + s.mixingDurationMinutes, 0);

  return {
    processId: `PROC-${categoryId}-${Date.now()}`,
    categoryId,
    physicalForm: isPowder ? 'POWDER' : 'LIQUID',
    batchSizeKg,
    totalEstimatedBatchTimeMinutes: totalTime,
    status: 'MODELLED_PROCESS',
    processSteps: steps,
    thermalWarnings,
    shearWarnings,
    provenanceNote: 'Modelled process based on physical-chemical addition rules. Not experimentally certified until physical plant scale-up run is recorded.',
  };
}

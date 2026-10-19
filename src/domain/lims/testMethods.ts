/**
 * ============================================================================
 * LIMS TEST METHOD REGISTRY & PHYSICAL FORM ROUTING
 * ============================================================================
 * 
 * Standard analytical test method catalog for liquid and powder detergents.
 * Governs parameter units, standard procedures, and physical-form constraints.
 * 
 * MANDATORY ROUTING CONSTRAINTS:
 * 1. LIQUID products must NEVER be assigned powder-only methods:
 *    - Loose Bulk Density
 *    - Tapped Density / Carr Index / Hausner Ratio
 *    - Aqueous Powder Dissolution Speed
 * 2. POWDER products must NEVER be assigned liquid-only methods:
 *    - Rotational Brookfield Viscosity (cPs)
 *    - Liquid NVR Solids Oven Gravimetry
 * 3. Parameters unapplicable to a physical form must return 'NOT_APPLICABLE',
 *    which must remain strictly distinct from 'NOT_TESTED'.
 * ============================================================================
 */

import { TestMethod } from './types';
import { PhysicalForm, ProductCategoryId, normalizeProductCategory } from '../productTaxonomy';
import { isPowderCategory } from '../../utils/formulationEngineRouter';

export type { TestMethod };

export const CANONICAL_TEST_METHODS: TestMethod[] = [
  // ---------------------------------------------------------------------------
  // UNIVERSAL / BOTH FORMS (pH, Active Surfactants, Chelation, CPI)
  // ---------------------------------------------------------------------------
  {
    methodId: 'METHOD-PH-001',
    name: 'Aqueous pH Measurement at 25°C (1% or Direct Solution)',
    parameterKey: 'ph',
    parameterName: 'Formulation pH',
    standardUnit: 'pH units',
    procedureReference: 'ISO 4316 / ASTM D1172 Standard Test Method for pH of Aqueous Solutions of Soaps and Detergents',
    sourceRegistryId: 'SRC-ASTM-D1172',
    applicableProductForms: 'ALL',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'A formula-specific authorized product specification is required; no universal limit is set here.',
    samplePreparation: 'Record the actual concentration/dilution and preparation protocol from the authorized method.',
    controls: 'Record buffer calibration/checks and applicable control sample from the method.',
    requiredInstrumentType: 'pH_METER',
    version: '2.0.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-ACTIVE-001',
    name: 'Anionic Active Matter by Direct Two-Phase Titration',
    parameterKey: 'activeMatter',
    parameterName: 'Anionic Active Matter',
    standardUnit: '%',
    procedureReference: 'ISO 2271 / ASTM D1681 Synthetic Anionic Active Ingredient by Cationic Titration',
    sourceRegistryId: 'SRC-ISO-2271',
    applicableProductForms: 'ALL',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Choose a validated method appropriate to the surfactant class and authorized formula specification.',
    samplePreparation: 'Document sample mass, dilution, solvent/reagent lots and method-specific preparation.',
    controls: 'Document blank, standard/check material and replicate requirements from the controlled method.',
    version: '1.4.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-CHEL-001',
    name: 'Water Hardness Sequestration Capacity (mg CaCO₃ / g Formulation)',
    parameterKey: 'chelationCapacity',
    parameterName: 'Calcium Carbonate Chelation Capacity',
    standardUnit: 'ppm',
    procedureReference: 'Method selection required. ASTM D2024 is a cloud-point test, not a calcium-chelation method.',
    sourceRegistryId: 'SRC-ASTM-D2024',
    applicableProductForms: 'ALL',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'No universal detergent formula limit established; requires product and method review.',
    requiredInstrumentType: 'AUTOMATED_TITRATOR',
    version: '1.2.0',
    status: 'DRAFT',
  },
  {
    methodId: 'METHOD-CPI-001',
    name: 'Multi-Cycle Fabric / Hard Surface Soil Removal Detergency Performance (CPI)',
    parameterKey: 'cpi',
    parameterName: 'Category Performance Index (CPI)',
    standardUnit: '%',
    procedureReference: 'ASTM D4265-25 Standard Guide for Evaluating Stain Removal Performance in Home Laundering',
    sourceRegistryId: 'SRC-ASTM-D4265',
    applicableProductForms: 'ALL',
    applicableProductCategories: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER'],
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Define comparator, soils, substrates, conditions and decision rule in a reviewed protocol; no universal score limit.',
    samplePreparation: 'Use the current authorized performance method and document soils, substrates, wash conditions and replicates.',
    controls: 'Include reference product and blank/control wash as required by the approved protocol.',
    requiredInstrumentType: 'TERGOTOMETER',
    version: '1.5.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-FTIR-001',
    name: 'Attenuated Total Reflectance (ATR-FTIR) Raw Material Fingerprint ID',
    parameterKey: 'ftirMatch',
    parameterName: 'FTIR Spectral Match Score',
    standardUnit: '%',
    procedureReference: 'ASTM E1252 Standard Practice for General Techniques for Obtaining Infrared Spectra',
    applicableProductForms: 'ALL',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Any fingerprint match threshold must be validated for the material, instrument and preprocessing method.',
    requiredInstrumentType: 'SPECTROMETER_FTIR',
    version: '1.0.0',
    status: 'ACTIVE',
  },

  // ---------------------------------------------------------------------------
  // LIQUID ONLY METHODS (Viscosity, Liquid NVR, Density)
  // ---------------------------------------------------------------------------
  {
    methodId: 'METHOD-VISC-001',
    name: 'Dynamic Rheology Brookfield Viscosity at 25°C (Spindle RVT @ 20 RPM)',
    parameterKey: 'viscosity',
    parameterName: 'Brookfield Dynamic Viscosity',
    standardUnit: 'mPa·s',
    procedureReference: 'ASTM D2196 Standard Test Methods for Rheological Properties of Non-Newtonian Materials',
    applicableProductForms: 'LIQUID',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Use the approved formula specification and controlled shear/temperature protocol.',
    samplePreparation: 'Record equilibration, temperature, spindle/geometry, speed/shear rate and reading time.',
    controls: 'Use instrument check fluids or other controls required by the approved procedure.',
    requiredInstrumentType: 'VISCOMETER',
    version: '2.1.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-DENS-001',
    name: 'Specific Gravity and Density at 20°C via Oscillating U-Tube',
    parameterKey: 'density',
    parameterName: 'Liquid Density at 20°C',
    standardUnit: 'g/mL',
    procedureReference: 'ISO 2811-2 / ASTM D4052 Standard Test Method for Density using Digital Density Meter',
    applicableProductForms: 'LIQUID',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Use the approved formula specification; no generic detergent density limit is set here.',
    requiredInstrumentType: 'DENSITOMETER',
    version: '1.3.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-NVR-001',
    name: 'Liquid Non-Volatile Residue (NVR) Oven Evaporation at 105°C',
    parameterKey: 'liquidNvr',
    parameterName: 'Liquid Non-Volatile Residue / Total Solids',
    standardUnit: '%',
    procedureReference: 'Method selection and current standard applicability require expert review; reference not verified for this detergent use.',
    applicableProductForms: 'LIQUID',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Confirm method applicability and limits against an authorized current method and product specification.',
    requiredInstrumentType: 'MOISTURE_ANALYZER',
    version: '1.1.0',
    status: 'DRAFT',
  },

  // ---------------------------------------------------------------------------
  // POWDER ONLY METHODS (Bulk Density, Dissolution, Moisture)
  // ---------------------------------------------------------------------------
  {
    methodId: 'METHOD-POWDER-BULK-001',
    name: 'Loose and Tapped Bulk Density of Granular Laundry Powder',
    parameterKey: 'bulkDensity',
    parameterName: 'Powder Apparent Bulk Density',
    standardUnit: 'g/L',
    procedureReference: 'ISO 697 / ISO 3944 Surface active agents — Determination of apparent density of washing powders',
    applicableProductForms: 'POWDER',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Use the approved powder product specification; no universal bulk-density limit is set here.',
    requiredInstrumentType: 'BULK_DENSITY_TESTER',
    version: '1.2.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-POWDER-DISS-001',
    name: 'Aqueous Powder Dissolution Rate and Residue at 20°C',
    parameterKey: 'dissolutionTime',
    parameterName: 'Powder Water Dissolution Time',
    standardUnit: 'seconds',
    procedureReference: 'CIPAC MT 179 / ISO 4325 Washing Powders Determination of Dissolution Time',
    applicableProductForms: 'POWDER',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Use an authorized applicable method and product specification; no general time limit is set here.',
    version: '1.1.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-POWDER-MOIST-001',
    name: 'Free and Bound Moisture via Halogen Drying Loss at 105°C',
    parameterKey: 'moisture',
    parameterName: 'Powder Total Moisture Content',
    standardUnit: '%',
    procedureReference: 'Method selection and current standard applicability require expert review; reference not verified for powder moisture.',
    applicableProductForms: 'POWDER',
    acceptanceCriteriaStatus: 'NEEDS_EXPERT_REVIEW',
    acceptanceCriteriaSource: 'Use the approved formula specification and authorized current method; no universal moisture range is set here.',
    requiredInstrumentType: 'MOISTURE_ANALYZER',
    version: '1.0.0',
    status: 'DRAFT',
  },
];

/**
 * Filters the active test methods applicable to a product category and physical form.
 */
export function getApplicableTestMethods(
  categoryOrId: ProductCategoryId | string,
  customMethods: TestMethod[] = CANONICAL_TEST_METHODS
): TestMethod[] {
  const isPowder = isPowderCategory(categoryOrId);
  const targetForm: PhysicalForm = isPowder ? 'POWDER' : 'LIQUID';
  const targetCategory = normalizeProductCategory(categoryOrId);

  return customMethods.filter(method => {
    if (method.status !== 'ACTIVE') return false;
    if (method.applicableProductCategories && !method.applicableProductCategories.includes(targetCategory as ProductCategoryId)) return false;
    if (method.applicableProductForms === 'ALL') return true;
    return method.applicableProductForms === targetForm;
  });
}

/**
 * Validates whether a specific test method is physically allowed for a product category.
 */
export function validateMethodFormCompatibility(
  methodId: string,
  categoryOrId: ProductCategoryId | string,
  customMethods: TestMethod[] = CANONICAL_TEST_METHODS
): {
  isCompatible: boolean;
  reason?: string;
} {
  const method = customMethods.find(m => m.methodId === methodId);
  if (!method) {
    return { isCompatible: false, reason: `Unknown test method ${methodId}.` };
  }

  const isPowder = isPowderCategory(categoryOrId);
  const currentForm: PhysicalForm = isPowder ? 'POWDER' : 'LIQUID';

  if (method.applicableProductForms !== 'ALL' && method.applicableProductForms !== currentForm) {
    return {
      isCompatible: false,
      reason: `Method "${method.name}" is designated for ${method.applicableProductForms} products and cannot be executed on a ${currentForm} formulation.`,
    };
  }

  return { isCompatible: true };
}

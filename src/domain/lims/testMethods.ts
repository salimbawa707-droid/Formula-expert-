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
import { PhysicalForm, ProductCategoryId } from '../productTaxonomy';
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
    applicableProductForms: 'ALL',
    acceptanceCriteria: { min: 1.0, max: 13.5 },
    requiredInstrumentType: 'pH_METER',
    version: '2.0.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-ACTIVE-001',
    name: 'Total Active Surfactant Matter via Two-Phase Potentiometric Titration',
    parameterKey: 'activeMatter',
    parameterName: 'Total Active Surfactant Matter',
    standardUnit: '%',
    procedureReference: 'ISO 2271 / ASTM D1681 Synthetic Anionic Active Ingredient by Cationic Titration',
    applicableProductForms: 'ALL',
    acceptanceCriteria: { min: 2.0, max: 80.0 },
    requiredInstrumentType: 'AUTOMATED_TITRATOR',
    version: '1.4.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-CHEL-001',
    name: 'Water Hardness Sequestration Capacity (mg CaCO₃ / g Formulation)',
    parameterKey: 'chelationCapacity',
    parameterName: 'Calcium Carbonate Chelation Capacity',
    standardUnit: 'ppm',
    procedureReference: 'ASTM D2024 / CIPAC MT 75.3 Determination of Calcium Carbonate Complexation',
    applicableProductForms: 'ALL',
    acceptanceCriteria: { min: 50.0 },
    requiredInstrumentType: 'AUTOMATED_TITRATOR',
    version: '1.2.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-CPI-001',
    name: 'Multi-Cycle Fabric / Hard Surface Soil Removal Detergency Performance (CPI)',
    parameterKey: 'cpi',
    parameterName: 'Category Performance Index (CPI)',
    standardUnit: '%',
    procedureReference: 'ASTM D4265 Standard Guide for Evaluating Stain Removal / ASTM D5343 Hard Surface Cleaning',
    applicableProductForms: 'ALL',
    acceptanceCriteria: { min: 50.0, max: 100.0 },
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
    acceptanceCriteria: { min: 80.0, max: 100.0 },
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
    standardUnit: 'g/mL', // representation / cP mapped
    procedureReference: 'ASTM D2196 Standard Test Methods for Rheological Properties of Non-Newtonian Materials',
    applicableProductForms: 'LIQUID',
    acceptanceCriteria: { min: 50.0, max: 15000.0 },
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
    acceptanceCriteria: { min: 0.95, max: 1.35 },
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
    procedureReference: 'ISO 3727 / ASTM D2834 Standard Test Method for Nonvolatile Matter in Detergents',
    applicableProductForms: 'LIQUID',
    acceptanceCriteria: { min: 5.0, max: 70.0 },
    requiredInstrumentType: 'MOISTURE_ANALYZER',
    version: '1.1.0',
    status: 'ACTIVE',
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
    acceptanceCriteria: { min: 350.0, max: 950.0 },
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
    acceptanceCriteria: { max: 120.0 },
    version: '1.1.0',
    status: 'ACTIVE',
  },
  {
    methodId: 'METHOD-POWDER-MOIST-001',
    name: 'Free and Bound Moisture via Halogen Drying Loss at 105°C',
    parameterKey: 'moisture',
    parameterName: 'Powder Total Moisture Content',
    standardUnit: '%',
    procedureReference: 'ISO 4317 / ASTM D1568 Sampling and Chemical Analysis of Alkylbenzene Sulfonates and Detergent Powders',
    applicableProductForms: 'POWDER',
    acceptanceCriteria: { min: 1.0, max: 15.0 },
    requiredInstrumentType: 'MOISTURE_ANALYZER',
    version: '1.0.0',
    status: 'ACTIVE',
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

  return customMethods.filter(method => {
    if (method.status !== 'ACTIVE') return false;
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

import { SpecificationTemplate, SpecificationParameter } from './types';
import { normalizeProductCategory, resolveProductSubclass } from '../../domain/productTaxonomy';

const dateStr = '2026-09-01T00:00:00.000Z';

function createParam(
  id: string,
  key: string,
  name: string,
  target: number | undefined,
  min: number | undefined,
  max: number | undefined,
  unit: SpecificationParameter['unit'],
  criticality: SpecificationParameter['criticality'],
  source: SpecificationParameter['source'],
  requiresLabMeasurement: boolean,
  testBasis: string
): SpecificationParameter {
  return {
    id,
    parameterKey: key,
    parameterName: name,
    target,
    min,
    max,
    unit,
    criticality,
    source,
    requiresLabMeasurement,
    testBasis,
    isActive: true,
    createdAt: dateStr,
    updatedAt: dateStr
  };
}

export const CATEGORY_SPECIFICATION_TEMPLATES: Record<string, SpecificationTemplate> = {
  LAUNDRY_LIQUID: {
    id: 'tpl-laundry-liquid',
    name: 'Heavy-Duty Liquid Laundry Detergent Specification',
    description: 'Commercial liquid laundry specification for active surfactant, pH 7.5-9.5, density, viscosity, liquid NVR, and cost target.',
    productCategory: 'LAUNDRY_LIQUID',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-ll-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Stoichiometric Mass Sum'),
      createParam('p-ll-2', 'activeMatter', 'Total Active Surfactant', 16.0, 10.0, 25.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-ll-3', 'ph', 'Finished Product pH', 8.5, 7.5, 9.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C'),
      createParam('p-ll-4', 'density', 'Liquid Density / Specific Gravity @ 20°C', 1.04, 1.01, 1.08, 'g/mL', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Product-appropriate hydrometer, pycnometer or digital density method at a declared temperature; use a validated product SOP.'),
      createParam('p-ll-5', 'viscosity', 'Product Viscosity @ 25°C', 800, 500, 1500, 'none', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Brookfield Viscometer Spindle 2 @ 20 RPM'),
      createParam('p-ll-6', 'liquidNVR', 'Liquid Non-Volatile Residue (NVR)', 22.0, 15.0, 35.0, '%', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Oven Evaporation @ 105°C (calculateLiquidNVR)'),
      createParam('p-ll-7', 'costPerKg', 'Finished Raw Material Cost / kg', 35.0, undefined, 45.0, '₹/kg', 'MAJOR', 'INTERNAL_R_AND_D_TARGET', false, 'Ingredient Cost Sum')
    ]
  },
  LAUNDRY_POWDER: {
    id: 'tpl-laundry-powder',
    name: 'Commercial Laundry Powder Specification',
    description: 'Washing powder specification covering active surfactant, alkaline pH, moisture, and bulk density limits.',
    productCategory: 'LAUNDRY_POWDER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-lp-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-lp-2', 'activeMatter', 'Total Surfactant Active Matter', 12.0, 10.0, 15.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Stoichiometric Loading'),
      createParam('p-lp-3', 'powderPH', 'Aqueous pH (1.0% w/v Solution)', 10.5, 9.5, 11.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, '1.0% w/v powder in demineralized water @ 25°C'),
      createParam('p-lp-4', 'moisture', 'Moisture Content (Loss on Drying)', 2.5, undefined, 5.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Loss on Drying @ 105°C to Constant Mass'),
      createParam('p-lp-5', 'bulkDensity', 'Loose Bulk Density', 0.55, 0.45, 0.85, 'g/mL', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Graduated Cylinder Method (Loose Pour)'),
      createParam('p-lp-6', 'dissolutionTime', 'Aqueous Dissolution Time', 30.0, undefined, 60.0, 'seconds', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Conductivity Dissolution Test @ 20°C')
    ]
  },
  DISHWASH_MANUAL: {
    id: 'tpl-dishwash-manual',
    name: 'Manual Dishwashing Liquid Specification',
    description: 'Hand dishwashing specification for grease emulsification, neutral skin pH 6.0-8.0, and high lather.',
    productCategory: 'DISHWASH_MANUAL',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-dm-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-dm-2', 'activeMatter', 'Total Active Surfactant', 18.0, 12.0, 25.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-dm-3', 'ph', 'Dermatological Safe pH', 6.8, 6.0, 8.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Direct Potentiometric Measurement @ 25°C'),
      createParam('p-dm-4', 'viscosity', 'Gel Viscosity @ 25°C', 2000, 1500, 2500, 'none', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Brookfield Viscometer Spindle 3 @ 12 RPM')
    ]
  },
  DISHWASH_AUTOMATIC: {
    id: 'tpl-dishwash-automatic',
    name: 'Automatic Dishwasher Liquid Specification',
    description: 'Low-foaming machine warewash specification for zero-foam compliance and alkaline builder drenching.',
    productCategory: 'DISHWASH_AUTOMATIC',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-da-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-da-2', 'activeMatter', 'Total Low-Foam Active Surfactant', 6.0, 4.0, 10.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Low-Foam Active Surfactant Sum'),
      createParam('p-da-3', 'ph', 'Machine Wash Alkaline pH', 10.0, 8.5, 11.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, '1.0% w/v solution potentiometric pH'),
      createParam('p-da-4', 'zeroFoamCompliance', 'Zero-Foam Machine Compliance', 95, 80, 100, 'none', 'CRITICAL', 'VALIDATED_REFERENCE', false, 'Low-Foam Hydrodynamic Screening')
    ]
  },
  FLOOR_CLEANER: {
    id: 'tpl-floor-cleaner',
    name: 'Hard Surface Floor Cleaner Specification',
    description: 'Mop-down cleaner specification for low active solids, neutral pH 6.5-9.5, and zero residue.',
    productCategory: 'FLOOR_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-fc-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-fc-2', 'activeMatter', 'Total Active Surfactant', 5.0, 3.0, 8.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-fc-3', 'ph', 'Neutral Substrate Safe pH', 7.5, 6.5, 9.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Direct Potentiometric Measurement @ 25°C')
    ]
  },
  MULTIPURPOSE_CLEANER: {
    id: 'tpl-multipurpose-cleaner',
    name: 'Multipurpose Spray Cleaner Specification',
    description: 'All-purpose spray cleaner specification for countertop grease cut and neutral-alkaline pH.',
    productCategory: 'MULTIPURPOSE_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-mp-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-mp-2', 'activeMatter', 'Total Active Surfactant', 6.0, 4.0, 10.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-mp-3', 'ph', 'Multi-Surface Safe pH', 8.5, 7.0, 10.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Direct Potentiometric Measurement @ 25°C')
    ]
  },
  TOILET_CLEANER: {
    id: 'tpl-toilet-cleaner',
    name: 'Acidic Thickened Toilet Cleaner Specification',
    description: 'Porcelain descaling specification for acidic pH 1.0-2.5 and high vertical surface cling time.',
    productCategory: 'TOILET_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-tc-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-tc-2', 'activeMatter', 'Total Acid-Stable Surfactant', 4.0, 2.0, 6.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Acid-Stable Surfactant Sum'),
      createParam('p-tc-3', 'ph', 'Acidic Descaling pH', 1.5, 1.0, 2.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Acid-Resistant Glass Electrode Measurement @ 25°C'),
      createParam('p-tc-4', 'viscosity', 'Vertical Cling Viscosity @ 25°C', 1000, 800, 1500, 'none', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Brookfield Viscometer Spindle 2 @ 20 RPM')
    ]
  },
  BATHROOM_CLEANER: {
    id: 'tpl-bathroom-cleaner',
    name: 'Bathroom Tile & Soap Scum Cleaner Specification',
    description: 'Tile and grout descaling specification for organic acid pH 2.0-4.0 and calcium soap scum removal.',
    productCategory: 'BATHROOM_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-bc-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-bc-2', 'activeMatter', 'Total Active Surfactant', 5.0, 3.0, 8.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-bc-3', 'ph', 'Organic Acid Descaling pH', 3.0, 2.0, 4.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },
  GLASS_CLEANER: {
    id: 'tpl-glass-cleaner',
    name: 'Streak-Free Glass & Mirror Cleaner Specification',
    description: 'Fast-evaporating glass cleaner specification with low active matter strictly <3.0% to prevent optical streaks.',
    productCategory: 'GLASS_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-gc-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-gc-2', 'activeMatter', 'Total Active Solids (Low Streak)', 1.5, 0.5, 3.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Solids Stoichiometric Sum'),
      createParam('p-gc-3', 'ph', 'Volatile Alkaline pH', 9.5, 8.5, 10.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },
  FABRIC_SOFTENER: {
    id: 'tpl-fabric-softener',
    name: 'Cationic Rinse Fabric Softener Specification',
    description: 'Cationic rinse aid specification for esterquat active matter, acidic pH 2.5-4.5, and zero anionic contamination.',
    productCategory: 'FABRIC_SOFTENER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-fs-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-fs-2', 'activeMatter', 'Total Cationic Active Matter', 8.0, 4.0, 12.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Cationic Esterquat Active Matter Sum'),
      createParam('p-fs-3', 'ph', 'Esterquat Emulsion pH', 3.5, 2.5, 4.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },
  HAND_WASH: {
    id: 'tpl-hand-wash',
    name: 'Dermatological Mild Hand Wash Specification',
    description: 'Skin cleansing liquid soap specification for mildness, natural skin pH 5.0-6.8, and thick foam build.',
    productCategory: 'HAND_WASH',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-hw-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-hw-2', 'activeMatter', 'Total Mild Active Surfactant', 11.0, 8.0, 15.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-hw-3', 'ph', 'Skin Acid Mantle Compatible pH', 6.0, 5.0, 6.8, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C'),
      createParam('p-hw-4', 'viscosity', 'Dispensing Viscosity @ 25°C', 2200, 1800, 3000, 'none', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Brookfield Viscometer Spindle 3 @ 12 RPM')
    ]
  },
  KITCHEN_DEGREASER: {
    id: 'tpl-kitchen-degreaser',
    name: 'Heavy-Duty Kitchen Degreaser Specification',
    description: 'Heavy alkaline degreaser specification for oven and hood grease saponification at caustic pH 11.0-13.8.',
    productCategory: 'KITCHEN_DEGREASER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-kd-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-kd-2', 'activeMatter', 'Total Active Surfactant & Solvent', 12.0, 8.0, 18.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant and Coupling Agent Sum'),
      createParam('p-kd-3', 'ph', 'Caustic Saponification pH', 12.5, 11.0, 13.8, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Alkali-Resistant Glass Electrode Measurement @ 25°C')
    ]
  },
  CAR_SHAMPOO: {
    id: 'tpl-car-shampoo',
    name: 'pH-Neutral Snow Foam Car Shampoo Specification',
    description: 'Vehicle wash specification for snow-foam lubricity and neutral clearcoat-safe pH 6.5-8.0.',
    productCategory: 'CAR_SHAMPOO',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-cs-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-cs-2', 'activeMatter', 'Total Active Surfactant', 12.0, 8.0, 16.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-cs-3', 'ph', 'Wax-Safe Neutral pH', 7.2, 6.5, 8.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },

  // Phase 2 Specialized Sub-Profiles
  DISHWASH_AUTO_RINSE_AID: {
    id: 'tpl-rinse-aid',
    name: 'Automatic Dishwasher Rinse Aid Specification',
    description: 'Commercial rinse aid and sheeting agent specification for acidic pH 2.0-4.0 and low-foam active matter.',
    productCategory: 'DISHWASH_AUTOMATIC',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-ra-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-ra-2', 'activeMatter', 'Total Low-Foam Active Surfactant', 15.0, 8.0, 20.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Low-Foam Active Surfactant Sum'),
      createParam('p-ra-3', 'ph', 'Acidic Rinse Aid pH', 2.8, 2.0, 4.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },

  TOILET_CLEANER_MINERAL_ACID: {
    id: 'tpl-toilet-mineral',
    name: 'Mineral Acid Heavy Descaling Toilet Cleaner Specification',
    description: 'Concentrated mineral acid (8-10% HCl) specification for vertical cling and high-acid pH 0.0-1.5.',
    productCategory: 'TOILET_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-tcm-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-tcm-2', 'activeMatter', 'Total Acid-Stable Surfactant', 2.0, 1.0, 4.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Acid-Stable Surfactant Sum'),
      createParam('p-tcm-3', 'ph', 'Mineral Acid Descaling pH', 0.5, 0.0, 1.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Acid-Resistant Glass Electrode Measurement @ 25°C'),
      createParam('p-tcm-4', 'viscosity', 'Vertical Cling Viscosity @ 25°C', 400, 200, 800, 'none', 'MAJOR', 'PRODUCT_SPECIFICATION', true, 'Brookfield Viscometer Spindle 2 @ 20 RPM')
    ]
  },

  TOILET_CLEANER_ORGANIC_ACID: {
    id: 'tpl-toilet-organic',
    name: 'Eco Organic Acid Toilet Bowl Cleaner Specification',
    description: 'Organic acid toilet cleaner specification for biodegradable citric/formic acid descaling at pH 1.5-3.0.',
    productCategory: 'TOILET_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-tco-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-tco-2', 'activeMatter', 'Total Organic Acid Surfactant', 3.5, 2.0, 6.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-tco-3', 'ph', 'Organic Acid Descaling pH', 2.0, 1.5, 3.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },

  BATHROOM_CLEANER_ACID_FREE_DISINFECTANT: {
    id: 'tpl-bathroom-acid-free',
    name: 'Acid-Free Disinfectant Bathroom Spray Specification',
    description: 'Alkaline/neutral bathroom disinfectant spray specification safe for natural marble and sanitary surfaces.',
    productCategory: 'BATHROOM_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-bca-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-bca-2', 'activeMatter', 'Total Active Surfactant & Biocide', 3.5, 2.0, 6.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-bca-3', 'ph', 'Acid-Free Disinfectant pH', 9.5, 8.0, 11.0, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },

  FLOOR_CLEANER_ALKALINE: {
    id: 'tpl-floor-alkaline',
    name: 'Heavy-Duty Alkaline Industrial Floor Cleaner Specification',
    description: 'Industrial alkaline floor scrub specification for oil/grease saponification at pH 10.5-12.5.',
    productCategory: 'FLOOR_CLEANER',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-fca-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-fca-2', 'activeMatter', 'Total Active Surfactant', 6.0, 3.0, 10.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-fca-3', 'ph', 'Industrial Alkaline pH', 11.5, 10.5, 12.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  },

  CAR_SHAMPOO_TOUCHLESS_ALKALINE: {
    id: 'tpl-car-touchless',
    name: 'Touchless Alkaline Snow Foam Pre-Wash Specification',
    description: 'Vehicle pre-wash specification for touchless alkaline film removal at pH 9.5-11.5.',
    productCategory: 'CAR_SHAMPOO',
    sourceType: 'SYSTEM_PROVIDED',
    createdAt: dateStr,
    updatedAt: dateStr,
    parameters: [
      createParam('p-cst-1', 'massBalance', 'Formula Mass Total', 100.0, 100.0, 100.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Calculated Mass Balance Sum'),
      createParam('p-cst-2', 'activeMatter', 'Total Active Surfactant', 14.0, 8.0, 18.0, '%', 'CRITICAL', 'PRODUCT_SPECIFICATION', false, 'Active Surfactant Matter Sum'),
      createParam('p-cst-3', 'ph', 'Touchless Alkaline pH', 10.5, 9.5, 11.5, 'pH units', 'CRITICAL', 'PRODUCT_SPECIFICATION', true, 'Potentiometric Measurement @ 25°C')
    ]
  }
};

export const STANDARD_SPECIFICATION_TEMPLATES: SpecificationTemplate[] = Object.values(CATEGORY_SPECIFICATION_TEMPLATES);

export function tryGetSpecificationTemplateForCategory(
  categoryOrId?: string | null,
  subProfileOrFormulaName?: string | null
): SpecificationTemplate | null {
  // 1. Direct match in sub-profile keys
  if (subProfileOrFormulaName && CATEGORY_SPECIFICATION_TEMPLATES[subProfileOrFormulaName]) {
    return CATEGORY_SPECIFICATION_TEMPLATES[subProfileOrFormulaName];
  }

  // 2. Subclass resolution from combined descriptor
  const resolvedSub = resolveProductSubclass(categoryOrId || undefined, subProfileOrFormulaName || undefined);
  if (resolvedSub && CATEGORY_SPECIFICATION_TEMPLATES[resolvedSub]) {
    return CATEGORY_SPECIFICATION_TEMPLATES[resolvedSub];
  }

  // 3. Direct match in category keys
  if (categoryOrId && CATEGORY_SPECIFICATION_TEMPLATES[categoryOrId]) {
    return CATEGORY_SPECIFICATION_TEMPLATES[categoryOrId];
  }

  // 4. Match to canonical category
  const normId = normalizeProductCategory(categoryOrId);
  if (normId !== 'UNKNOWN_PRODUCT_CATEGORY' && CATEGORY_SPECIFICATION_TEMPLATES[normId]) {
    return CATEGORY_SPECIFICATION_TEMPLATES[normId];
  }

  return null;
}

export function getSpecificationTemplateForCategory(
  categoryOrId?: string | null,
  subProfileOrFormulaName?: string | null
): SpecificationTemplate {
  const template = tryGetSpecificationTemplateForCategory(categoryOrId, subProfileOrFormulaName);
  if (!template) {
    throw new Error(
      `Cannot resolve SpecificationTemplate: Unrecognized, missing, or invalid product category "${categoryOrId ?? 'undefined'}". ` +
      `Product category must resolve to one of the 13 canonical ProductCategoryId values.`
    );
  }
  return template;
}

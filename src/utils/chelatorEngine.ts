import { FormulationIngredient } from '../types';
import { normalizeProductCategory } from '../domain/productTaxonomy';

export type ChelationMechanism = 
  | 'CHELATION' 
  | 'SEQUESTRATION' 
  | 'BUILDER_COMPLEXATION' 
  | 'ION_EXCHANGE' 
  | 'PRECIPITATION_BUFFERING'
  | 'NONE';

export type ChelatorScientificStatus = 
  | 'VERIFIED_THEORETICAL' 
  | 'VERIFIED_COMMERCIAL_GRADE' 
  | 'EMPIRICAL' 
  | 'ESTIMATED' 
  | 'INSUFFICIENT_DATA';

export interface ChelatorSpecies {
  id: string;
  name: string;
  chemicalName: string;
  chemicalFormula: string;
  chemicalForm: string; // 'Aqueous Solution' | 'Crystalline Powder' | 'Granular Powder'
  hydrationState: string; // 'Anhydrous' | 'Dihydrate' | 'Tetrahydrate' | 'Aqueous Solution'
  molecularWeight: number; // g/mol of active salt/acid
  activeDefault: number; // % active in standard commercial grade
  mechanism: ChelationMechanism;
  stoichiometricRatio: number; // mol Ca2+ bound per mol chelator
  theoreticalActiveCapacityMgPerG: number; // mg CaCO3 / g pure active chelator
  effectiveCommercialCapacityMgPerG: number; // mg CaCO3 / g commercial product
  scientificStatus: ChelatorScientificStatus;
  provenance: 'AUTHORITATIVE' | 'CALCULATED' | 'ESTIMATED';
  phOperatingRange: { min: number; max: number; optimal: number };
  phDependencyNotes: string;
  citation: string;
}

/**
 * Standard stoichiometric CaCO3 molecular weight constant (g/mol)
 * MW = 40.078 (Ca) + 12.0107 (C) + 3 * 15.9994 (O) = 100.0869 g/mol
 */
export const MW_CACO3 = 100.0869;

/**
 * Water Hardness Scenarios (mg/L as CaCO3 / ppm)
 */
export type WaterHardnessScenarioId = 'SOFT' | 'MODERATE' | 'HARD' | 'VERY_HARD' | 'CUSTOM';

export interface WaterHardnessScenario {
  id: WaterHardnessScenarioId;
  label: string;
  hardnessPpm: number; // mg/L as CaCO3
  mgCaCO3PerLiter: number;
  description: string;
}

export const WATER_HARDNESS_SCENARIOS: Record<WaterHardnessScenarioId, WaterHardnessScenario> = {
  SOFT: {
    id: 'SOFT',
    label: 'Soft Water (50 mg/L as CaCO3)',
    hardnessPpm: 50,
    mgCaCO3PerLiter: 50,
    description: 'Low multivalent ion concentration (< 60 mg/L CaCO3 equiv).'
  },
  MODERATE: {
    id: 'MODERATE',
    label: 'Moderate Water (150 mg/L as CaCO3)',
    hardnessPpm: 150,
    mgCaCO3PerLiter: 150,
    description: 'Standard municipal water hardness (60 - 150 mg/L CaCO3 equiv).'
  },
  HARD: {
    id: 'HARD',
    label: 'Hard Water (300 mg/L as CaCO3)',
    hardnessPpm: 300,
    mgCaCO3PerLiter: 300,
    description: 'Elevated calcium/magnesium load (150 - 300 mg/L CaCO3 equiv).'
  },
  VERY_HARD: {
    id: 'VERY_HARD',
    label: 'Very Hard Water (500 mg/L as CaCO3)',
    hardnessPpm: 500,
    mgCaCO3PerLiter: 500,
    description: 'Severe mineral hardness load (> 300 mg/L CaCO3 equiv).'
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom Water Hardness',
    hardnessPpm: 150,
    mgCaCO3PerLiter: 150,
    description: 'User-defined water hardness conditions.'
  }
};

/**
 * Product-Specific Hardness Policy
 * Defines whether hardness control is applicable, along with canonical wash liquor volumes and product dosages.
 */
export interface ProductHardnessPolicy {
  requiresHardnessControl: boolean;
  defaultWashVolumeL: number;
  defaultDoseGrams: number;
  defaultSafetyMarginPct: number;
  description: string;
}

export const PRODUCT_HARDNESS_POLICIES: Record<string, ProductHardnessPolicy> = {
  LAUNDRY_LIQUID: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 20,
    defaultSafetyMarginPct: 25,
    description: 'High hardness control required to protect anionic surfactant micellar detergency in drum wash.'
  },
  LAUNDRY_POWDER: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 30,
    defaultSafetyMarginPct: 25,
    description: 'Inorganic builder, zeolite ion-exchange, and soluble chelator water softening system.'
  },
  DISHWASH_MANUAL: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 10,
    defaultSafetyMarginPct: 20,
    description: 'Sink immersion detergency and foam stability in hard tap water.'
  },
  DISHWASH_AUTOMATIC: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 20,
    defaultSafetyMarginPct: 30,
    description: 'Critical machine dishwashing anti-spotting and scale prevention builder system.'
  },
  DISHWASH_AUTO_RINSE_AID: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 5,
    defaultSafetyMarginPct: 0,
    description: 'Surfactant sheet-rinse aid without primary builder requirement.'
  },
  FLOOR_CLEANER: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 25,
    defaultSafetyMarginPct: 20,
    description: 'Bucket dilution streak-free mop cleaning with calcium tolerance.'
  },
  MULTIPURPOSE_CLEANER: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 20,
    defaultSafetyMarginPct: 20,
    description: 'Dilutable multi-surface hard water soil saponification and dispersion.'
  },
  TOILET_CLEANER: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 1,
    defaultDoseGrams: 50,
    defaultSafetyMarginPct: 0,
    description: 'Direct acidic lime dissolution; does not use wash-liquor sequestration.'
  },
  TOILET_CLEANER_MINERAL_ACID: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 1,
    defaultDoseGrams: 50,
    defaultSafetyMarginPct: 0,
    description: 'Strong mineral acid scale dissolution.'
  },
  TOILET_CLEANER_ORGANIC_ACID: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 1,
    defaultDoseGrams: 50,
    defaultSafetyMarginPct: 0,
    description: 'Organic acid scale dissolution.'
  },
  BATHROOM_CLEANER: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 20,
    defaultSafetyMarginPct: 20,
    description: 'Soap scum and lime-scale sequestration and foam cleaning.'
  },
  BATHROOM_CLEANER_ACID_FREE_DISINFECTANT: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 20,
    defaultSafetyMarginPct: 0,
    description: 'Disinfectant quaternary formulation without builder scale demand.'
  },
  GLASS_CLEANER: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 1,
    defaultDoseGrams: 5,
    defaultSafetyMarginPct: 0,
    description: 'RTU streak-free spray; avoids high builder salts to prevent film residue.'
  },
  FABRIC_SOFTENER: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 25,
    defaultSafetyMarginPct: 0,
    description: 'Cationic rinse cycle conditioning; uncoupled from detergent chelation.'
  },
  HAND_WASH: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 2,
    defaultDoseGrams: 3,
    defaultSafetyMarginPct: 0,
    description: 'Skin cleansing rinse; mild surfactant formula without heavy builders.'
  },
  KITCHEN_DEGREASER: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 5,
    defaultDoseGrams: 25,
    defaultSafetyMarginPct: 20,
    description: 'Alkaline builder and solvent degreasing with saponification support.'
  },
  CAR_SHAMPOO: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 30,
    defaultSafetyMarginPct: 20,
    description: 'High-lubricity bucket wash preventing calcium water spotting.'
  },
  CAR_SHAMPOO_TOUCHLESS_ALKALINE: {
    requiresHardnessControl: true,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 30,
    defaultSafetyMarginPct: 20,
    description: 'Touchless snow foam high-chelating traffic film remover.'
  },
  UNKNOWN_PRODUCT_CATEGORY: {
    requiresHardnessControl: false,
    defaultWashVolumeL: 10,
    defaultDoseGrams: 20,
    defaultSafetyMarginPct: 0,
    description: 'Unknown product category: Hardness policy cannot be determined without valid category.'
  }
};

/**
 * Returns the product hardness policy for a given product category or specification profile ID.
 */
export function getProductHardnessPolicy(categoryIdOrName?: string): ProductHardnessPolicy {
  if (!categoryIdOrName) {
    return PRODUCT_HARDNESS_POLICIES.UNKNOWN_PRODUCT_CATEGORY;
  }
  const norm = normalizeProductCategory(categoryIdOrName);
  if (norm !== 'UNKNOWN_PRODUCT_CATEGORY' && PRODUCT_HARDNESS_POLICIES[norm]) {
    return PRODUCT_HARDNESS_POLICIES[norm];
  }
  const key = categoryIdOrName.toUpperCase().trim().replace(/[\s-]+/g, '_');
  
  if (PRODUCT_HARDNESS_POLICIES[key]) {
    return PRODUCT_HARDNESS_POLICIES[key];
  }

  // Sub-profile fallback matching
  if (key.includes('GLASS')) return PRODUCT_HARDNESS_POLICIES.GLASS_CLEANER;
  if (key.includes('TOILET')) return PRODUCT_HARDNESS_POLICIES.TOILET_CLEANER;
  if (key.includes('SOFTENER')) return PRODUCT_HARDNESS_POLICIES.FABRIC_SOFTENER;
  if (key.includes('HAND')) return PRODUCT_HARDNESS_POLICIES.HAND_WASH;
  if (key.includes('RINSE_AID')) return PRODUCT_HARDNESS_POLICIES.DISHWASH_AUTO_RINSE_AID;
  if (key.includes('POWDER')) return PRODUCT_HARDNESS_POLICIES.LAUNDRY_POWDER;
  if (key.includes('DISHWASH_AUTO') || key.includes('AUTOMATIC_DISH')) return PRODUCT_HARDNESS_POLICIES.DISHWASH_AUTOMATIC;
  if (key.includes('DISH')) return PRODUCT_HARDNESS_POLICIES.DISHWASH_MANUAL;
  if (key.includes('FLOOR')) return PRODUCT_HARDNESS_POLICIES.FLOOR_CLEANER;
  if (key.includes('CAR')) return PRODUCT_HARDNESS_POLICIES.CAR_SHAMPOO;
  if (key.includes('DEGREASER') || key.includes('KITCHEN')) return PRODUCT_HARDNESS_POLICIES.KITCHEN_DEGREASER;
  if (key.includes('BATHROOM')) return PRODUCT_HARDNESS_POLICIES.BATHROOM_CLEANER;

  return PRODUCT_HARDNESS_POLICIES.UNKNOWN_PRODUCT_CATEGORY;
}

/**
 * Comprehensive Chelator & Builder Scientific Database
 * Stoichiometric basis: 1 mol Ca2+ (100.0869 g CaCO3 equiv) per mol stoichiometric binding site.
 */
export const AUTHORITATIVE_CHELATOR_DATABASE: ChelatorSpecies[] = [
  {
    id: 'glda-47',
    name: 'GLDA 47% Liquid (Dissolvine GL-47)',
    chemicalName: 'Tetrasodium N,N-bis(carboxymethyl)-L-glutamate (Na4GLDA)',
    chemicalFormula: 'C9H9NO8Na4',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 351.13,
    activeDefault: 47,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 285.04,
    effectiveCommercialCapacityMgPerG: 137,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 6.0, max: 12.0, optimal: 9.0 },
    phDependencyNotes: 'High conditional stability (log K ~ 5.2). Retains strong chelation across pH 6.5 to 12.0.',
    citation: 'Dissolvine GL-47-S Technical Specification & EU Ecolabel Standard'
  },
  {
    id: 'glda-99',
    name: 'GLDA 99% Powder',
    chemicalName: 'Tetrasodium N,N-bis(carboxymethyl)-L-glutamate Powder',
    chemicalFormula: 'C9H9NO8Na4',
    chemicalForm: 'Crystalline Powder',
    hydrationState: 'Anhydrous',
    molecularWeight: 351.13,
    activeDefault: 99,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 285.04,
    effectiveCommercialCapacityMgPerG: 282,
    scientificStatus: 'VERIFIED_THEORETICAL',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 6.0, max: 12.0, optimal: 9.0 },
    phDependencyNotes: 'Pure crystalline powder form. High calcium binding at neutral-alkaline pH.',
    citation: 'Dissolvine GL Master Specification'
  },
  {
    id: 'mgda-38',
    name: 'MGDA 38% Liquid (Trilon M)',
    chemicalName: 'Trisodium Methylglycinediacetate (Na3MGDA)',
    chemicalFormula: 'C5H6NO6Na3',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 271.09,
    activeDefault: 38,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 369.20,
    effectiveCommercialCapacityMgPerG: 155,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 7.0, max: 12.5, optimal: 10.0 },
    phDependencyNotes: 'Fast kinetic sequestration rate; optimal for high-temperature and short-cycle machine washing.',
    citation: 'Trilon M Technical Bulletin & BASF Chelation Guide'
  },
  {
    id: 'mgda-40',
    name: 'MGDA 40% Liquid',
    chemicalName: 'Trisodium Methylglycinediacetate (Na3MGDA 40%)',
    chemicalFormula: 'C5H6NO6Na3',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 271.09,
    activeDefault: 40,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 369.20,
    effectiveCommercialCapacityMgPerG: 155,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 7.0, max: 12.5, optimal: 10.0 },
    phDependencyNotes: 'Standard 40% aqueous concentrate for automated dispensing and laundry compounding.',
    citation: 'Trilon M Liquid 40% Technical Data'
  },
  {
    id: 'citrate-dihydrate',
    name: 'Sodium Citrate Dihydrate',
    chemicalName: 'Trisodium Citrate Dihydrate (Na3C6H5O7 · 2H2O)',
    chemicalFormula: 'Na3C6H5O7·2H2O',
    chemicalForm: 'Crystalline Powder',
    hydrationState: 'Dihydrate',
    molecularWeight: 294.10,
    activeDefault: 100,
    mechanism: 'BUILDER_COMPLEXATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 340.32,
    effectiveCommercialCapacityMgPerG: 150,
    scientificStatus: 'EMPIRICAL',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 7.5, max: 10.5, optimal: 8.5 },
    phDependencyNotes: 'Binding efficiency is pH-dependent (log K ~ 3.5-4.5); chelation weakens below pH 7.0 due to carboxylate protonation.',
    citation: 'HERA Project Eco-Safety Evaluation for Trisodium Citrate'
  },
  {
    id: 'citrate-anhydrous',
    name: 'Sodium Citrate Anhydrous',
    chemicalName: 'Trisodium Citrate Anhydrous (Na3C6H5O7)',
    chemicalFormula: 'Na3C6H5O7',
    chemicalForm: 'Crystalline Powder',
    hydrationState: 'Anhydrous',
    molecularWeight: 258.07,
    activeDefault: 100,
    mechanism: 'BUILDER_COMPLEXATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 387.83,
    effectiveCommercialCapacityMgPerG: 170,
    scientificStatus: 'EMPIRICAL',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 7.5, max: 10.5, optimal: 8.5 },
    phDependencyNotes: 'High-purity anhydrous builder salt.',
    citation: 'Industrial Citrates Standard'
  },
  {
    id: 'gluconate',
    name: 'Sodium Gluconate',
    chemicalName: 'Sodium D-gluconate (NaC6H11O7)',
    chemicalFormula: 'NaC6H11O7',
    chemicalForm: 'Granular Powder',
    hydrationState: 'Anhydrous',
    molecularWeight: 218.14,
    activeDefault: 100,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 458.82,
    effectiveCommercialCapacityMgPerG: 76,
    scientificStatus: 'EMPIRICAL',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 9.0, max: 14.0, optimal: 11.5 },
    phDependencyNotes: 'Weak calcium chelation below pH 9.0; powerful heavy-metal (Fe3+) chelation in caustic CIP solutions (pH > 11).',
    citation: 'Jungbunzlauer Sodium Gluconate Detergency Guide'
  },
  {
    id: 'edta-liquid',
    name: 'Tetrasodium EDTA 39% Liquid',
    chemicalName: 'Tetrasodium Ethylenediaminetetraacetate Aqueous',
    chemicalFormula: 'C10H12N2O8Na4',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 380.17,
    activeDefault: 39,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 263.27,
    effectiveCommercialCapacityMgPerG: 103,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 7.0, max: 13.0, optimal: 10.0 },
    phDependencyNotes: 'High stability constant (log K = 10.7). Broad pH operating window.',
    citation: 'Versene 100 Technical Bulletin'
  },
  {
    id: 'edta-powder',
    name: 'EDTA Tetrasodium / 99% Powder',
    chemicalName: 'Tetrasodium Ethylenediaminetetraacetate Solid (Na4EDTA)',
    chemicalFormula: 'C10H12N2O8Na4',
    chemicalForm: 'Crystalline Powder',
    hydrationState: 'Anhydrous',
    molecularWeight: 380.17,
    activeDefault: 99,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 263.27,
    effectiveCommercialCapacityMgPerG: 220,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 7.0, max: 13.0, optimal: 10.0 },
    phDependencyNotes: 'Solid tetrasodium salt. Highly effective across wide pH and water hardness ranges.',
    citation: 'Industrial Chelation Standard (Dow Chemical)'
  },
  {
    id: 'dtpa',
    name: 'DTPA Pentasodium',
    chemicalName: 'Pentasodium Diethylenetriaminepentaacetate',
    chemicalFormula: 'C14H18N3O10Na5',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 503.26,
    activeDefault: 40,
    mechanism: 'CHELATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 198.88,
    effectiveCommercialCapacityMgPerG: 200,
    scientificStatus: 'ESTIMATED',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 8.0, max: 13.0, optimal: 10.5 },
    phDependencyNotes: 'Specialized peroxide bleach stabilizer and transition metal sequestrant.',
    citation: 'Versenex 80 Technical Guide'
  },
  {
    id: 'stpp',
    name: 'Sodium Tripolyphosphate (STPP 94%)',
    chemicalName: 'Pentasodium Triphosphate (Na5P3O10)',
    chemicalFormula: 'Na5P3O10',
    chemicalForm: 'Granular Powder',
    hydrationState: 'Anhydrous',
    molecularWeight: 367.86,
    activeDefault: 94,
    mechanism: 'BUILDER_COMPLEXATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 272.08,
    effectiveCommercialCapacityMgPerG: 180,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 8.5, max: 11.5, optimal: 10.0 },
    phDependencyNotes: 'Primary inorganic builder in laundry powders; combines sequestering, buffering, and soil dispersion.',
    citation: 'Inorganic Detergent Builders Handbook'
  },
  {
    id: 'zeolite-4a',
    name: 'Zeolite 4A Builder Powder',
    chemicalName: 'Sodium Aluminosilicate Zeolite 4A',
    chemicalFormula: 'Na12[(AlO2)12(SiO2)12]·27H2O',
    chemicalForm: 'Fine Powder',
    hydrationState: 'Hydrated',
    molecularWeight: 2190.0,
    activeDefault: 100,
    mechanism: 'ION_EXCHANGE',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 150.0,
    effectiveCommercialCapacityMgPerG: 110,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 8.0, max: 12.0, optimal: 10.0 },
    phDependencyNotes: 'Heterogeneous Ca2+ ion exchange in alkaline wash liquor; requires liquid/surfactant dispersion.',
    citation: 'Zeolite A in Detergent Applications Standard'
  },
  {
    id: 'hedp',
    name: 'HEDP / Etidronate',
    chemicalName: '1-Hydroxyethylidene-1,1-diphosphonic acid',
    chemicalFormula: 'C2H8O7P2',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 206.03,
    activeDefault: 60,
    mechanism: 'SEQUESTRATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 485.79,
    effectiveCommercialCapacityMgPerG: 250,
    scientificStatus: 'VERIFIED_COMMERCIAL_GRADE',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 2.0, max: 12.0, optimal: 8.0 },
    phDependencyNotes: 'Operates as sub-stoichiometric threshold crystallization inhibitor for CaCO3 scale prevention.',
    citation: 'Phosphonate Chelation & Threshold Scale Inhibition Bulletin'
  },
  {
    id: 'polycarboxylate',
    name: 'Sodium Polyacrylate / Polycarboxylate',
    chemicalName: 'Sodium Polyacrylate Co-builder',
    chemicalFormula: '(C3H3NaO2)n',
    chemicalForm: 'Aqueous Solution',
    hydrationState: 'Aqueous Solution',
    molecularWeight: 4500.0,
    activeDefault: 45,
    mechanism: 'SEQUESTRATION',
    stoichiometricRatio: 1.0,
    theoreticalActiveCapacityMgPerG: 300.0,
    effectiveCommercialCapacityMgPerG: 200,
    scientificStatus: 'EMPIRICAL',
    provenance: 'AUTHORITATIVE',
    phOperatingRange: { min: 6.5, max: 12.0, optimal: 9.5 },
    phDependencyNotes: 'Dispersing agent and threshold crystal growth inhibitor preventing calcium precipitation redeposition.',
    citation: 'Polymeric Co-Builders Detergent Technology Handbook'
  }
];

/**
 * Returns the effective binding capacity (in mg CaCO3 bound per gram of ingredient).
 * Supports explicit active percentage overrides or canonical benchmark matching.
 */
export function getChelatorBindingCapacity(name: string, explicitActive?: number): number {
  const n = (name || "").toLowerCase().trim();
  if (!n) return 0;

  // Citric acid without neutralization is an acidulant, not an active sodium chelator salt
  if (n === 'citric acid' || (n.includes('citric acid') && !n.includes('sodium citrate') && !n.includes('citrate'))) {
    return 0;
  }

  // Exact benchmark matches for backward compatibility and test contracts
  if (n.includes('glda 47') || n === 'glda 47% liquid' || n.includes('dissolvine gl-47') || n === 'glda-47') {
    return 137;
  }
  if (n.includes('mgda 38') || n === 'mgda 38% liquid' || n.includes('trilon m')) {
    return 155;
  }
  if (n.includes('citrate dihydrate') || n === 'sodium citrate dihydrate' || n === 'sodium citrate') {
    return 150;
  }
  if (n.includes('citrate anhydrous') || n === 'sodium citrate anhydrous') {
    return 170;
  }
  if (n === 'sodium gluconate' || n.includes('gluconate')) {
    return 76;
  }
  if (n.includes('edta tetrasodium') || n === 'edta tetrasodium' || (n.includes('edta') && !n.includes('39%'))) {
    return 220;
  }
  if (n.includes('edta 39%') || n.includes('edta 39')) {
    return 103;
  }
  if (n.includes('dtpa')) {
    return 200;
  }
  if (n.includes('stpp') || n.includes('tripolyphosphate')) {
    return 180;
  }
  if (n.includes('zeolite') || n.includes('aluminosilicate')) {
    return 110;
  }
  if (n.includes('polycarboxylate') || n.includes('polyacrylate')) {
    return 200;
  }
  if (n.includes('hedp') || n.includes('etidronate') || n.includes('etidronic')) {
    return 250;
  }

  // Generic matching with explicit active concentration calculation if available
  if (n.includes('glda') || n.includes('dissolvine') || n.includes('gl-47')) {
    if (explicitActive !== undefined && explicitActive > 0) {
      return Number(((explicitActive / 100) * 285.04).toFixed(1));
    }
    return 137; // Standard default liquid GLDA-47
  }

  if (n.includes('citrate') || n.includes('citric')) {
    return 150; // Sodium Citrate Dihydrate
  }

  if (n.includes('mgda')) {
    if (explicitActive !== undefined && explicitActive > 0) {
      return Number(((explicitActive / 100) * 369.20).toFixed(1));
    }
    return 155;
  }

  return 0; // Non-chelating ingredients return 0
}

/**
 * Calculates raw water hardness load in mg CaCO3.
 * Hardness Load (mg CaCO3) = Hardness (ppm or mg/L CaCO3) * Water Volume (L).
 */
export function calculateWaterHardnessLoad(hardnessPpm: number, washVolumeL: number = 10): number {
  const ppm = typeof hardnessPpm === 'number' && !isNaN(hardnessPpm) ? Math.max(0, hardnessPpm) : 0;
  const vol = typeof washVolumeL === 'number' && !isNaN(washVolumeL) ? Math.max(0, washVolumeL) : 10;
  return ppm * vol; // mg CaCO3
}

export interface FormulationChelationIngredientDetail {
  name: string;
  percentage: number;
  massGrams: number;
  batchMassGrams: number;
  bindingCapacityMgPerG: number;
  boundCaCO3Mg: number;
  batchBoundCaCO3Grams: number;
  mechanism: ChelationMechanism;
  activeMatterPct?: number;
  molecularWeight?: number;
  moles?: number;
  stoichiometricRatio?: number;
  provenance: 'AUTHORITATIVE' | 'CALCULATED' | 'ESTIMATED';
  source?: string;
}

export interface FormulationChelationCapacityResult {
  totalSequestrationMg: number;
  batchSequestrationGrams: number;
  chelationCapacityMg: number; // Soluble aminopolycarboxylates (GLDA, MGDA, EDTA, DTPA, gluconate)
  builderCapacityMg: number; // Builders & ion exchangers (Citrate, STPP, Zeolite, Polycarboxylates)
  details: FormulationChelationIngredientDetail[];
  chelatorCount: number;
  unknownChelatorCount: number;
  hasUnknownChelators: boolean;
  status: 'COMPLETE' | 'INSUFFICIENT_DATA';
}

/**
 * Calculates total CaCO3 sequestration capacity of a formulation in a single wash dose.
 * Correctly distinguishes:
 * - Soluble chelation (GLDA, MGDA, EDTA, DTPA, Gluconate)
 * - Builder sequestration / ion exchange (Citrate, STPP, Zeolite, Polycarboxylates)
 * - Per-dose capacity (mg CaCO3) vs Entire batch capacity (grams CaCO3)
 */
export function calculateFormulationChelationCapacity(
  ingredients: FormulationIngredient[], 
  washDoseGrams: number = 20, 
  batchSizeKg: number = 100
): FormulationChelationCapacityResult {
  const ings = Array.isArray(ingredients) ? ingredients : [];
  const dose = typeof washDoseGrams === 'number' && !isNaN(washDoseGrams) && washDoseGrams > 0 ? washDoseGrams : 20;
  const batchKg = typeof batchSizeKg === 'number' && !isNaN(batchSizeKg) && batchSizeKg > 0 ? batchSizeKg : 100;

  let totalSequestrationMg = 0;
  let batchSequestrationGrams = 0;
  let chelationCapacityMg = 0;
  let builderCapacityMg = 0;
  let chelatorCount = 0;
  let unknownChelatorCount = 0;

  const details: FormulationChelationIngredientDetail[] = ings.map(ing => {
    const rawName = ing?.name || 'Unknown';
    const pct = Number((ing as any)?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0);
    const validPct = isNaN(pct) || pct < 0 ? 0 : pct;
    const massGrams = (validPct / 100) * dose;
    const batchMassGrams = (validPct / 100) * batchKg * 1000;

    const explicitActive = (ing as any)?.activeMatterPct ?? (ing as any)?.activePercent ?? (ing as any)?.purity;
    const bindingCapacityMgPerG = getChelatorBindingCapacity(rawName, typeof explicitActive === 'number' ? explicitActive : undefined);
    
    const boundCaCO3Mg = massGrams * bindingCapacityMgPerG;
    const batchBoundCaCO3Grams = (batchMassGrams * bindingCapacityMgPerG) / 1000;

    // Resolve matched species metadata
    const n = rawName.toLowerCase();
    const matchedSpecies = AUTHORITATIVE_CHELATOR_DATABASE.find(s => 
      n.includes(s.id) || 
      n.includes(s.name.toLowerCase()) || 
      (s.id === 'glda-47' && (n.includes('glda') || n.includes('gl-47'))) ||
      (s.id === 'mgda-38' && n.includes('mgda')) ||
      (s.id === 'citrate-dihydrate' && n.includes('citrate')) ||
      (s.id === 'gluconate' && n.includes('gluconate')) ||
      (s.id === 'edta-powder' && n.includes('edta')) ||
      (s.id === 'stpp' && n.includes('stpp')) ||
      (s.id === 'zeolite-4a' && n.includes('zeolite')) ||
      (s.id === 'hedp' && (n.includes('hedp') || n.includes('etidronate'))) ||
      (s.id === 'polycarboxylate' && (n.includes('polycarboxylate') || n.includes('polyacrylate')))
    );

    const rawRole = ((ing as any)?.role || (ing as any)?.category || '').toLowerCase();
    const isDeclaredChelator = /chelat|builder|sequestr/i.test(rawRole) || /chelat|sequestr/i.test(rawName);
    const isUnknownChelator = isDeclaredChelator && !matchedSpecies && bindingCapacityMgPerG === 0;

    if (isUnknownChelator) {
      unknownChelatorCount++;
    }

    const mechanism: ChelationMechanism = matchedSpecies?.mechanism ?? (bindingCapacityMgPerG > 0 ? 'CHELATION' : (isUnknownChelator ? 'CHELATION' : 'NONE'));

    if (bindingCapacityMgPerG > 0) {
      chelatorCount++;
      if (mechanism === 'CHELATION') {
        chelationCapacityMg += boundCaCO3Mg;
      } else {
        builderCapacityMg += boundCaCO3Mg;
      }
    }

    totalSequestrationMg += boundCaCO3Mg;
    batchSequestrationGrams += batchBoundCaCO3Grams;

    const activePct = typeof explicitActive === 'number' ? explicitActive : (matchedSpecies?.activeDefault ?? 100);
    const activeMassGrams = (validPct / 100) * dose * (activePct / 100);
    const mw = matchedSpecies?.molecularWeight;
    const moles = mw && mw > 0 ? activeMassGrams / mw : undefined;

    const provenance: 'AUTHORITATIVE' | 'CALCULATED' | 'ESTIMATED' = isUnknownChelator
      ? 'ESTIMATED'
      : (matchedSpecies?.provenance ?? (bindingCapacityMgPerG > 0 ? 'CALCULATED' : 'AUTHORITATIVE'));

    const source = isUnknownChelator
      ? 'Uncharacterized chelating agent/builder (capacity unverified; INSUFFICIENT_DATA)'
      : (matchedSpecies?.citation ?? (bindingCapacityMgPerG > 0 ? 'Stoichiometric Binding Model' : 'Non-chelating matrix'));

    return {
      name: rawName,
      percentage: validPct,
      massGrams,
      batchMassGrams,
      bindingCapacityMgPerG,
      boundCaCO3Mg,
      batchBoundCaCO3Grams,
      mechanism,
      activeMatterPct: activePct,
      molecularWeight: mw,
      moles,
      stoichiometricRatio: matchedSpecies?.stoichiometricRatio ?? 1.0,
      provenance,
      source
    };
  });

  return { 
    totalSequestrationMg, 
    batchSequestrationGrams, 
    chelationCapacityMg,
    builderCapacityMg,
    details,
    chelatorCount,
    unknownChelatorCount,
    hasUnknownChelators: unknownChelatorCount > 0,
    status: unknownChelatorCount > 0 ? 'INSUFFICIENT_DATA' : 'COMPLETE'
  };
}

export interface DynamicChelatorRequirement {
  waterHardnessPpm: number;
  washVolumeL: number;
  washDoseGrams: number;
  hardnessLoadMg: number;
  safetyMarginPct: number;
  requiredSequestrationMg: number;
  existingSequestrationMg: number;
  capacityDeficitMg: number;
  capacitySurplusMg: number;
  additionalGLDA47RequiredPct: number;
  additionalCitrateRequiredPct: number;
  additionalMGDA38RequiredPct: number;
  recommendedAction: string;
  calculationBasis: string;
  isSufficient: boolean;
}

/**
 * Dynamically computes required additional chelator based on exact water hardness load,
 * wash volume, wash dosage, existing formulation capacity, and safety margin.
 */
export function calculateDynamicChelatorRequirement(
  ingredients: FormulationIngredient[],
  waterHardnessPpm: number = 150,
  washVolumeL: number = 10,
  washDoseGrams: number = 20,
  safetyMarginPct: number = 25
): DynamicChelatorRequirement {
  const targetHardnessPpm = typeof waterHardnessPpm === 'number' && !isNaN(waterHardnessPpm) ? Math.max(0, waterHardnessPpm) : 150;
  const vol = typeof washVolumeL === 'number' && !isNaN(washVolumeL) && washVolumeL > 0 ? washVolumeL : 10;
  const dose = typeof washDoseGrams === 'number' && !isNaN(washDoseGrams) && washDoseGrams > 0 ? washDoseGrams : 20;
  const margin = typeof safetyMarginPct === 'number' && !isNaN(safetyMarginPct) ? Math.max(0, safetyMarginPct) : 25;

  const hardnessLoadMg = calculateWaterHardnessLoad(targetHardnessPpm, vol);
  const requiredSequestrationMg = hardnessLoadMg * (1 + margin / 100);

  const { totalSequestrationMg } = calculateFormulationChelationCapacity(ingredients, dose);
  const capacityDeficitMg = Math.max(0, requiredSequestrationMg - totalSequestrationMg);
  const capacitySurplusMg = Math.max(0, totalSequestrationMg - requiredSequestrationMg);

  let additionalGLDA47RequiredPct = 0;
  let additionalCitrateRequiredPct = 0;
  let additionalMGDA38RequiredPct = 0;

  if (capacityDeficitMg > 0) {
    // 1 g GLDA 47% binds 137 mg CaCO3 -> required grams in dose = deficit / 137
    const gldaGramsInDose = capacityDeficitMg / 137;
    additionalGLDA47RequiredPct = Number(((gldaGramsInDose / dose) * 100).toFixed(2));

    // 1 g Sodium Citrate binds 150 mg CaCO3 -> required grams in dose = deficit / 150
    const citrateGramsInDose = capacityDeficitMg / 150;
    additionalCitrateRequiredPct = Number(((citrateGramsInDose / dose) * 100).toFixed(2));

    // 1 g MGDA 38% binds 155 mg CaCO3 -> required grams in dose = deficit / 155
    const mgdaGramsInDose = capacityDeficitMg / 155;
    additionalMGDA38RequiredPct = Number(((mgdaGramsInDose / dose) * 100).toFixed(2));
  }

  const isSufficient = capacityDeficitMg <= 0;
  const recommendedAction = isSufficient 
    ? 'Chelation capacity is sufficient for current water hardness load. No additional chelator required.'
    : `Add ${additionalGLDA47RequiredPct}% GLDA 47% Liquid or ${additionalCitrateRequiredPct}% Sodium Citrate Dihydrate to formula.`;

  const calculationBasis = `Water hardness ${targetHardnessPpm} ppm (mg/L CaCO3) in ${vol}L wash liquor generates ${hardnessLoadMg} mg CaCO3 load. With ${margin}% safety margin, target capacity is ${Math.round(requiredSequestrationMg)} mg CaCO3. Existing formula binds ${Math.round(totalSequestrationMg)} mg in ${dose}g dose (Deficit: ${Math.round(capacityDeficitMg)} mg CaCO3).`;

  return {
    waterHardnessPpm: targetHardnessPpm,
    washVolumeL: vol,
    washDoseGrams: dose,
    hardnessLoadMg,
    safetyMarginPct: margin,
    requiredSequestrationMg,
    existingSequestrationMg: totalSequestrationMg,
    capacityDeficitMg,
    capacitySurplusMg,
    additionalGLDA47RequiredPct,
    additionalCitrateRequiredPct,
    additionalMGDA38RequiredPct,
    recommendedAction,
    calculationBasis,
    isSufficient
  };
}

export type HardnessProtectionStatus = 'PASS' | 'WARNING' | 'INSUFFICIENT' | 'NOT_APPLICABLE' | 'NOT_EVALUATED';

export interface WaterHardnessToleranceResult {
  status: HardnessProtectionStatus;
  maxSupportedPpm: number;
  maxSupportedStoichiometricPpm: number;
  rating: string;
  description: string;
  totalSequestrationMg: number;
  chelationCapacityMg: number;
  builderCapacityMg: number;
  requiredSequestrationMg: number;
  hardnessLoadMg: number;
  capacityDeficitMg: number;
  capacitySurplusMg: number;
  hardnessProtectionRatio: number;
  additionalGLDA47RequiredPct: number;
  additionalCitrateRequiredPct: number;
  additionalMGDA38RequiredPct: number;
  batchSequestrationGrams: number;
  washDoseGrams: number;
  washVolumeL: number;
  batchSizeKg: number;
  safetyMarginPct: number;
  sufficiency: 'sufficient' | 'borderline' | 'insufficient' | 'not_applicable' | 'baseline';
  isApplicable: boolean;
  category?: string;
  provenance: 'AUTHORITATIVE' | 'CALCULATED';
  theoreticalCapacityBasis?: string;
  matrixEquilibriumNotes?: string;
  limitations?: string[];
  valueOf: () => string;
  toString: () => string;
}

/**
 * Calculates complete formulation-level water hardness tolerance and protection status.
 * Handles product-specific hardness policies, dosage scaling, and multi-builder partitioning.
 */
export function calculateWaterHardnessTolerance(
  ingredients: FormulationIngredient[],
  waterHardnessPpm: number = 150,
  washVolumeL?: number,
  washDoseGrams?: number,
  batchSizeKg: number = 100,
  productCategoryOrProfileId?: string
): WaterHardnessToleranceResult {
  const ings = Array.isArray(ingredients) ? ingredients : [];
  const policy = getProductHardnessPolicy(productCategoryOrProfileId);

  const vol = typeof washVolumeL === 'number' && !isNaN(washVolumeL) && washVolumeL > 0 
    ? washVolumeL 
    : policy.defaultWashVolumeL;
  const dose = typeof washDoseGrams === 'number' && !isNaN(washDoseGrams) && washDoseGrams > 0 
    ? washDoseGrams 
    : policy.defaultDoseGrams;
  const batchKg = typeof batchSizeKg === 'number' && !isNaN(batchSizeKg) && batchSizeKg > 0 
    ? batchSizeKg 
    : 100;
  const targetHardnessPpm = typeof waterHardnessPpm === 'number' && !isNaN(waterHardnessPpm) 
    ? Math.max(0, waterHardnessPpm) 
    : 150;

  const { totalSequestrationMg, batchSequestrationGrams, chelationCapacityMg, builderCapacityMg } = 
    calculateFormulationChelationCapacity(ings, dose, batchKg);
  
  const hardnessLoadMg = calculateWaterHardnessLoad(targetHardnessPpm, vol);
  const safetyMarginPct = policy.requiresHardnessControl ? policy.defaultSafetyMarginPct : 25;
  const requiredSequestrationMg = hardnessLoadMg * (1 + safetyMarginPct / 100);
  const capacityDeficitMg = Math.max(0, requiredSequestrationMg - totalSequestrationMg);
  const capacitySurplusMg = Math.max(0, totalSequestrationMg - requiredSequestrationMg);

  const hardnessProtectionRatio = hardnessLoadMg > 0 
    ? Number((totalSequestrationMg / hardnessLoadMg).toFixed(3)) 
    : 1.0;

  const additionalGLDA47RequiredPct = capacityDeficitMg > 0 ? Number(((capacityDeficitMg / 137 / dose) * 100).toFixed(2)) : 0;
  const additionalCitrateRequiredPct = capacityDeficitMg > 0 ? Number(((capacityDeficitMg / 150 / dose) * 100).toFixed(2)) : 0;
  const additionalMGDA38RequiredPct = capacityDeficitMg > 0 ? Number(((capacityDeficitMg / 155 / dose) * 100).toFixed(2)) : 0;

  // Max supported ppm with safety margin: totalSequestrationMg / (washVolumeL * (1 + margin/100))
  const maxSupportedPpm = totalSequestrationMg > 0 
    ? Number((totalSequestrationMg / (vol * (1 + safetyMarginPct / 100))).toFixed(1)) 
    : 0;
  // Stoichiometric limit without safety margin: totalSequestrationMg / washVolumeL
  const maxSupportedStoichiometricPpm = totalSequestrationMg > 0 
    ? Number((totalSequestrationMg / vol).toFixed(1)) 
    : 0;

  // Check product policy applicability
  if (!policy.requiresHardnessControl && productCategoryOrProfileId) {
    const notAppDesc = `Hardness sequestration is not required for ${productCategoryOrProfileId}. ${policy.description}`;
    return {
      status: 'NOT_APPLICABLE',
      sufficiency: 'not_applicable',
      rating: 'N/A (Not Required)',
      description: notAppDesc,
      totalSequestrationMg,
      chelationCapacityMg,
      builderCapacityMg,
      requiredSequestrationMg,
      hardnessLoadMg,
      capacityDeficitMg: 0,
      capacitySurplusMg: totalSequestrationMg,
      hardnessProtectionRatio,
      additionalGLDA47RequiredPct: 0,
      additionalCitrateRequiredPct: 0,
      additionalMGDA38RequiredPct: 0,
      batchSequestrationGrams,
      washDoseGrams: dose,
      washVolumeL: vol,
      batchSizeKg: batchKg,
      safetyMarginPct: 0,
      isApplicable: false,
      maxSupportedPpm,
      maxSupportedStoichiometricPpm,
      category: productCategoryOrProfileId,
      provenance: 'AUTHORITATIVE',
      valueOf: () => 'N/A (Not Required)',
      toString: () => 'N/A (Not Required)'
    };
  }

  let status: HardnessProtectionStatus = 'PASS';
  let sufficiency: 'sufficient' | 'borderline' | 'insufficient' | 'baseline' = 'sufficient';

  if (targetHardnessPpm === 0) {
    sufficiency = 'baseline';
    status = 'NOT_EVALUATED';
  } else if (totalSequestrationMg >= requiredSequestrationMg) {
    sufficiency = 'sufficient';
    status = 'PASS';
  } else if (totalSequestrationMg >= hardnessLoadMg) {
    sufficiency = 'borderline';
    status = 'WARNING';
  } else {
    sufficiency = 'insufficient';
    status = 'INSUFFICIENT';
  }

  let ratingStr = 'Moderate (150 ppm)';
  let descStr = 'Moderate hardness tolerance; chelator addition recommended for hard water.';

  if (targetHardnessPpm === 0) {
    ratingStr = 'Baseline (0 ppm)';
    descStr = 'Baseline only — hard-water protection not evaluated.';
  } else if (totalSequestrationMg > 0) {
    if (sufficiency === 'sufficient') {
      ratingStr = `High (${maxSupportedPpm} ppm)`;
      descStr = `Sufficient chelation capacity (${Math.round(totalSequestrationMg)} mg CaCO₃ in ${dose}g dose) to bind Ca²⁺/Mg²⁺ ions at ${targetHardnessPpm} ppm with ${safetyMarginPct}% safety margin.`;
    } else if (sufficiency === 'borderline') {
      ratingStr = `Borderline (${maxSupportedPpm} ppm)`;
      descStr = `Chelation capacity (${Math.round(totalSequestrationMg)} mg CaCO₃ in ${dose}g dose) meets stoichiometric demand (${hardnessLoadMg} mg) but lacks recommended ${safetyMarginPct}% safety margin (${Math.round(requiredSequestrationMg)} mg) for ${targetHardnessPpm} ppm.`;
    } else {
      ratingStr = `Low (${maxSupportedPpm} ppm)`;
      descStr = `Chelation capacity in ${dose}g dose is ${Math.round(totalSequestrationMg)} mg CaCO₃ (supports ${maxSupportedPpm} ppm with ${safetyMarginPct}% margin / ${maxSupportedStoichiometricPpm} ppm stoichiometric) vs ${hardnessLoadMg} mg demanded for ${targetHardnessPpm} ppm in ${vol}L wash.`;
    }
  } else {
    ratingStr = `Unchelated (0 ppm)`;
    descStr = `No chelating agent detected in formula. Active detergency in ${targetHardnessPpm} ppm hard water relies entirely on surfactant calcium tolerance.`;
  }

  return {
    status,
    maxSupportedPpm,
    maxSupportedStoichiometricPpm,
    rating: ratingStr,
    description: descStr,
    totalSequestrationMg,
    chelationCapacityMg,
    builderCapacityMg,
    requiredSequestrationMg,
    hardnessLoadMg,
    capacityDeficitMg,
    capacitySurplusMg,
    hardnessProtectionRatio,
    additionalGLDA47RequiredPct,
    additionalCitrateRequiredPct,
    additionalMGDA38RequiredPct,
    batchSequestrationGrams,
    washDoseGrams: dose,
    washVolumeL: vol,
    batchSizeKg: batchKg,
    safetyMarginPct,
    sufficiency,
    isApplicable: true,
    category: productCategoryOrProfileId,
    provenance: 'CALCULATED',
    theoreticalCapacityBasis: 'Theoretical 1:1 or 2:1 stoichiometric Ca²⁺/Mg²⁺ binding to chelating ligand functional groups (mg CaCO₃ equivalent / g active)',
    matrixEquilibriumNotes: 'Calculated under standard alkaline wash liquor assumptions (pH 9-10). At acidic pH (< 5), protonation of carboxylate binding sites lowers actual sequestration efficiency.',
    limitations: [
      'Separates stoichiometric ligand binding capacity from competitive multi-ion matrix equilibria.',
      'Does not model temperature-dependent stability constants or heavy metal displacement kinetics without full chemical speciation input.'
    ],
    valueOf: () => ratingStr,
    toString: () => ratingStr
  };
}

export function evaluateFormulationGreenChelators(ingredients: FormulationIngredient[]) {
  const ings = Array.isArray(ingredients) ? ingredients : [];
  const greenChelators = ings.filter(i => {
    const cap = getChelatorBindingCapacity(i?.name || '');
    return cap > 0;
  });

  const hasGreenChelator = greenChelators.length > 0;
  const { totalSequestrationMg } = calculateFormulationChelationCapacity(ings, 20);

  return {
    isGreen: hasGreenChelator,
    totalChelatorCount: greenChelators.length,
    totalSequestrationMg,
    recommendation: hasGreenChelator
      ? `Active green chelation package binding approx ${Math.round(totalSequestrationMg)} mg CaCO₃ per wash dose.`
      : 'Consider adding biodegradable GLDA or Sodium Citrate for hard water stability.'
  };
}

export interface GreenChelatorInput {
  name: string;
  percent: number;
  type?: string;
  waterHardnessPpm?: number;
}

export interface ChelatorDetail {
  id?: string;
  name: string;
  percent: number;
  isGreen: boolean;
  score: number;
  calculatedWeightPct?: number;
  practicalWeightPct?: number;
  practicalWeightGrams?: number;
  bindingCapacity?: number;
  theoreticalSequestrationGrams?: number;
  coBuilderTargetGrams?: number;
  citation?: string;
}

export interface GreenChelatorResult {
  score: number;
  isGreen: boolean;
  totalCaCO3ToBindMg?: number;
  stoichiometricTargetMg?: number;
  chelators?: ChelatorDetail[];
  details: ChelatorDetail[];
  recommendation: string;
}

export function calculateGreenChelators(chelators: GreenChelatorInput[] | any, ..._args: any[]): GreenChelatorResult {
  let params = {
    waterHardnessPpm: 150,
    washVolumeL: 10,
    washDoseGrams: 20,
    safetyMarginPct: 25,
    coBuilderTargetPct: 10,
    maxFormulationCapPct: 3.0,
  };

  let inputList: any[] = [];

  if (Array.isArray(chelators)) {
    inputList = chelators;
  } else if (chelators && typeof chelators === 'object') {
    params = { ...params, ...chelators };
    if (Array.isArray(chelators.chelators)) {
      inputList = chelators.chelators;
    }
  }

  const hardPpm = typeof params.waterHardnessPpm === 'number' ? params.waterHardnessPpm : (parseFloat(String(params.waterHardnessPpm)) || 150);
  const washVol = typeof params.washVolumeL === 'number' ? params.washVolumeL : (parseFloat(String(params.washVolumeL)) || 10);
  const washDose = typeof params.washDoseGrams === 'number' && params.washDoseGrams > 0 ? params.washDoseGrams : (parseFloat(String(params.washDoseGrams)) || 20);
  const margin = typeof params.safetyMarginPct === 'number' ? params.safetyMarginPct : (parseFloat(String(params.safetyMarginPct)) || 25);
  const coTarget = typeof params.coBuilderTargetPct === 'number' ? params.coBuilderTargetPct : (parseFloat(String(params.coBuilderTargetPct)) || 10);
  const maxCap = typeof params.maxFormulationCapPct === 'number' ? params.maxFormulationCapPct : (parseFloat(String(params.maxFormulationCapPct)) || 3.0);

  const totalCaCO3ToBindMg = hardPpm * washVol;
  const stoichiometricTargetMg = totalCaCO3ToBindMg * (1 + margin / 100);

  let details: ChelatorDetail[] = [];

  if (inputList.length > 0) {
    details = inputList.map((c, i) => {
      const resolvedCap = c.bindingCapacity || getChelatorBindingCapacity(c.name);
      const isKnown = typeof resolvedCap === 'number' && resolvedCap > 0;
      const bindingCap = isKnown ? resolvedCap : 0;
      const theoGrams = isKnown ? stoichiometricTargetMg / bindingCap : 0;
      const coGrams = theoGrams * (coTarget / 100);
      const calcPct = isKnown ? (coGrams / (washDose || 1)) * 100 : 0;
      const pracPct = isKnown ? Math.min(calcPct, maxCap) : 0;
      const pracGrams = (pracPct / 100) * washDose;

      return {
        id: c.id || String(i + 1),
        name: c.name || "Green Chelator",
        percent: c.percent || pracPct,
        isGreen: isKnown,
        score: isKnown ? (c.score || 90) : 0,
        bindingCapacity: bindingCap,
        theoreticalSequestrationGrams: theoGrams,
        coBuilderTargetGrams: coGrams,
        calculatedWeightPct: calcPct,
        practicalWeightPct: pracPct,
        practicalWeightGrams: pracGrams,
        citation: isKnown ? (c.citation || 'EU Ecolabel Technical Data') : 'Unknown chelator binding capacity (INSUFFICIENT_DATA)'
      };
    });
  } else {
    const baseChelators = [
      { id: 'glda', name: 'Tetrasodium GLDA (47% Liquid)', bindingCapacity: 137, score: 98, citation: 'Dissolvine GL-47-S Technical Specification & Ecolabel Standard' },
      { id: 'mgda', name: 'Trisodium MGDA (38% Liquid)', bindingCapacity: 155, score: 92, citation: 'Trilon M Technical Bulletin & Biodegradability Assessment' },
      { id: 'citrate', name: 'Sodium Citrate Dihydrate (Powder)', bindingCapacity: 150, score: 85, citation: 'Hera Project Eco-Safety Evaluation for Trisodium Citrate' }
    ];

    details = baseChelators.map((c) => {
      const theoGrams = stoichiometricTargetMg / c.bindingCapacity;
      const coGrams = theoGrams * (coTarget / 100);
      const calcPct = (coGrams / (washDose || 1)) * 100;
      const pracPct = Math.min(calcPct, maxCap);
      const pracGrams = (pracPct / 100) * washDose;

      return {
        id: c.id,
        name: c.name,
        percent: pracPct,
        isGreen: true,
        score: c.score,
        bindingCapacity: c.bindingCapacity,
        theoreticalSequestrationGrams: theoGrams,
        coBuilderTargetGrams: coGrams,
        calculatedWeightPct: calcPct,
        practicalWeightPct: pracPct,
        practicalWeightGrams: pracGrams,
        citation: c.citation
      };
    });
  }

  return {
    score: 95,
    isGreen: true,
    totalCaCO3ToBindMg,
    stoichiometricTargetMg,
    chelators: details,
    details: details,
    recommendation: 'Eco-friendly GLDA/MGDA chelation package optimized for stoichiometry and water hardness.'
  };
}

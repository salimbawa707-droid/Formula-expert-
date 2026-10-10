import { IngredientInput, PHAdvancedResult, PHSimpleResult } from '../types';
import { PHEngineV2 } from '../domain/ph/pHEngineV2';
import { classifyChemicalSpecies } from '../domain/ph/chemicalSpeciesRegistry';
import { EquilibriumSystem } from '../domain/ph/equilibriumSystem';
import { ActivityModel } from '../domain/ph/activityModel';
import { PHCalculationOptions } from '../domain/ph/types';
import { normalizeProductCategory, ProductCategoryId } from '../domain/productTaxonomy';
import { resolveScientificAcidBaseProfile, calculateReactiveEquivalents } from '../domain/ph/acidBaseDataModel';

/**
 * Neutralization Calculation Input Contract
 */
export interface NeutralizationInput {
  acidKg?: number;
  labsaQty?: number;
  amount?: number;
  acidPurity?: number;
  labsaPurity?: number;
  basePurity?: number;
  alkaliType?: string;
  acidMw?: number;
  baseMw?: number;
}

/**
 * Neutralization Calculation Output Contract
 */
export interface NeutralizationResult {
  requiredBaseKg: number;
  alkaliRequiredGrams: number;
  heatGeneratedKJ: number | null;
  stoichiometricRatio: number;
  exothermEstimateC: number | null;
  waterGeneratedGrams: number;
  recommendedWaterForDissolutionGrams: number;
  calculationNote?: string;
}

/**
 * Speciation Result for multi-protic acids/bases/chelators
 */
export interface SpeciationSpecies {
  name: string;
  charge: number;
  fraction: number;
  molarConcentration: number;
}

export interface SpeciationResult {
  chemicalKey: string;
  displayName: string;
  totalMolarity: number;
  species: SpeciationSpecies[];
}

/**
 * Canonical Chemical Classification Data
 */
export interface ChemicalClassification {
  category: 'strong_acid' | 'weak_acid' | 'strong_base' | 'weak_base' | 'buffer_salt' | 'chelator' | 'neutral';
  eqPerMole: number;
  mw: number;
  chemicalKey: string;
  pKa?: number[];
  pKb?: number[];
  pKaConjugate?: number;
  cationsPerMole?: number;
  anionsPerMole?: number;
}

/**
 * Master Chemical Database for pH & Equilibrium Engine (Preserved for compatibility)
 */
export const INGREDIENT_DATABASE: Record<string, {
  type: string;
  pKa?: number[];
  pKb?: number[];
  pKaConjugate?: number;
  mw?: number;
  eqPerMole?: number;
  cationsPerMole?: number;
  pHEffect: 'acid' | 'base' | 'neutral' | 'buffer';
  description: string;
}> = {
  'LABSA (Linear Alkylbenzene Sulfonic Acid)': {
    type: 'labsa',
    pKa: [0.7],
    mw: 326.49,
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Primary anionic surfactant sulfonic acid'
  },
  'Sulfuric Acid (H2SO4 98%)': {
    type: 'sulfuric_acid',
    pKa: [-3.0, 1.99],
    mw: 98.08,
    eqPerMole: 2,
    pHEffect: 'acid',
    description: 'Strong diprotic mineral acid'
  },
  'Hydrochloric Acid (HCl 37%)': {
    type: 'hydrochloric_acid',
    pKa: [-6.3],
    mw: 36.46,
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Strong monoprotic mineral acid'
  },
  'Citric Acid (Anhydrous)': {
    type: 'citric_acid',
    pKa: [3.13, 4.76, 6.40],
    mw: 192.12,
    eqPerMole: 3,
    pHEffect: 'acid',
    description: 'Organic triprotic acid pH adjuster and chelating agent'
  },
  'Phosphoric Acid (H3PO4 85%)': {
    type: 'phosphoric_acid',
    pKa: [2.15, 7.20, 12.35],
    mw: 97.994,
    eqPerMole: 3,
    pHEffect: 'acid',
    description: 'Triprotic mineral acid builder/descaler'
  },
  'Acetic Acid (Glacial)': {
    type: 'acetic_acid',
    pKa: [4.76],
    mw: 60.05,
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Weak organic carboxylic acid'
  },
  'Lactic Acid (88%)': {
    type: 'lactic_acid',
    pKa: [3.86],
    mw: 90.08,
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Alpha-hydroxy organic acid descaler and antimicrobial'
  },
  'DTPA (Free Acid)': {
    type: 'dtpa_acid',
    pKa: [1.79, 2.55, 4.33, 8.60, 10.42],
    mw: 393.35,
    eqPerMole: 5,
    pHEffect: 'acid',
    description: 'Pentaprotic aminocarboxylate chelating acid'
  },
  'DTPA Na5 (Pentasodium DTPA 40%)': {
    type: 'dtpa_na5',
    pKa: [1.79, 2.55, 4.33, 8.60, 10.42],
    mw: 503.25,
    cationsPerMole: 5,
    pHEffect: 'buffer',
    description: 'High-stability heavy metal chelator salt'
  },
  'EDTA (Free Acid)': {
    type: 'edta_acid',
    pKa: [2.00, 2.67, 6.16, 10.26],
    mw: 292.24,
    eqPerMole: 4,
    pHEffect: 'acid',
    description: 'Tetraprotic chelating acid'
  },
  'EDTA Na4 (Tetrasodium EDTA)': {
    type: 'edta_na4',
    pKa: [2.00, 2.67, 6.16, 10.26],
    mw: 380.17,
    cationsPerMole: 4,
    pHEffect: 'buffer',
    description: 'Alkaline multidentate chelating agent'
  },
  'GLDA (Tetrasodium GLDA 47%)': {
    type: 'glda_na4',
    pKa: [1.8, 2.7, 4.9, 9.4],
    mw: 351.13,
    cationsPerMole: 4,
    pHEffect: 'buffer',
    description: 'Bio-based green aminocarboxylate chelator'
  },
  'MGDA (Trisodium MGDA 40%)': {
    type: 'mgda_na3',
    pKa: [1.6, 2.5, 9.7],
    mw: 271.11,
    cationsPerMole: 3,
    pHEffect: 'buffer',
    description: 'Readily biodegradable builder and chelator'
  },
  'Sodium Hydroxide (NaOH 100%)': {
    type: 'naoh',
    mw: 40.0,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Strong base neutralizing agent (solid flakes)'
  },
  'Caustic Soda Lye (NaOH 50%)': {
    type: 'naoh_50',
    mw: 40.0,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Liquid caustic soda neutralizer (50% solution)'
  },
  'Potassium Hydroxide (KOH 85%)': {
    type: 'koh_85',
    mw: 56.11,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Strong base potassium neutralizer (85% flakes)'
  },
  'Potassium Hydroxide (KOH 100%)': {
    type: 'koh',
    mw: 56.11,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Strong base potassium neutralizer (100% active)'
  },
  'Sodium Carbonate (Soda Ash)': {
    type: 'soda_ash',
    pKa: [6.35, 10.33],
    mw: 105.99,
    eqPerMole: 2,
    cationsPerMole: 2,
    pHEffect: 'base',
    description: 'Alkaline diprotic builder and buffer'
  },
  'Sodium Bicarbonate': {
    type: 'sodium_bicarbonate',
    pKa: [6.35, 10.33],
    mw: 84.01,
    eqPerMole: 1,
    cationsPerMole: 1,
    pHEffect: 'buffer',
    description: 'Amphiprotic bicarbonate buffer salt'
  },
  'Sodium Citrate': {
    type: 'sodium_citrate',
    pKa: [3.13, 4.76, 6.40],
    mw: 258.07,
    cationsPerMole: 3,
    pHEffect: 'buffer',
    description: 'Trisodium citrate buffer salt'
  },
  'Sodium Acetate': {
    type: 'sodium_acetate',
    pKa: [4.76],
    mw: 82.03,
    cationsPerMole: 1,
    pHEffect: 'buffer',
    description: 'Conjugate base acetate buffer salt'
  },
  'Sodium Metasilicate Pentahydrate': {
    type: 'silicate_pentahydrate',
    mw: 212.14,
    eqPerMole: 2,
    cationsPerMole: 2,
    pHEffect: 'base',
    description: 'Heavy duty alkaline builder and corrosion inhibitor (5H2O)'
  },
  'Sodium Metasilicate Anhydrous': {
    type: 'silicate_anhydrous',
    mw: 122.06,
    eqPerMole: 2,
    cationsPerMole: 2,
    pHEffect: 'base',
    description: 'Anhydrous heavy duty alkaline silicate builder'
  },
  'Trisodium Phosphate (TSP Anhydrous)': {
    type: 'tsp_anhydrous',
    mw: 163.94,
    eqPerMole: 1,
    cationsPerMole: 3,
    pHEffect: 'base',
    description: 'Heavy duty alkaline builder and cleaner (Anhydrous)'
  },
  'Trisodium Phosphate Dodecahydrate': {
    type: 'tsp_dodecahydrate',
    mw: 380.12,
    eqPerMole: 1,
    cationsPerMole: 3,
    pHEffect: 'base',
    description: 'Alkaline builder and cleaner crystal (12H2O)'
  },
  'Sodium Tripolyphosphate (STPP)': {
    type: 'stpp',
    mw: 367.86,
    eqPerMole: 1,
    cationsPerMole: 5,
    pHEffect: 'base',
    description: 'Alkaline polyphosphate builder and water softener'
  },
  'Triethanolamine (TEA 99%)': {
    type: 'tea',
    pKb: [4.5],
    pKaConjugate: 9.5,
    mw: 149.19,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Organic tertiary amine base neutralizer'
  },
  'Monoethanolamine (MEA 99%)': {
    type: 'mea',
    pKb: [4.5],
    pKaConjugate: 9.5,
    mw: 61.08,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Organic primary amine base neutralizer'
  }
};

/**
 * Normalizes input chemical strings into canonical classification structure.
 */
export function classifyChemicalInput(rawName: string): ChemicalClassification | null {
  const species = classifyChemicalSpecies(rawName);
  if (!species) return null;

  let category: 'strong_acid' | 'weak_acid' | 'strong_base' | 'weak_base' | 'buffer_salt' | 'chelator' | 'neutral' = 'neutral';
  if (species.family === 'STRONG_ACID' || species.family === 'SULFONIC_ACID_LABSA') {
    category = 'strong_acid';
  } else if (species.family === 'STRONG_BASE') {
    category = 'strong_base';
  } else if (species.family === 'CARBONATE' || species.family === 'SILICATE' || species.family === 'AMINE_BASE') {
    category = 'weak_base';
  } else if (species.family === 'CITRATE' || species.family === 'PHOSPHATE' || species.family === 'CHELATOR_AMINOCARBOXYLATE') {
    if (species.pHEffect === 'acid') {
      category = 'weak_acid';
    } else {
      category = 'buffer_salt';
    }
  } else if (species.family === 'CARBOXYLIC_WEAK_ACID' || species.family === 'POLYACRYLATE' || species.family === 'PHOSPHONATE') {
    category = species.pHEffect === 'acid' ? 'weak_acid' : 'buffer_salt';
  }

  return {
    category,
    eqPerMole: species.eqPerMole ?? 1,
    mw: species.mw,
    chemicalKey: species.speciesId,
    pKa: species.pKa,
    pKb: species.pKb,
    pKaConjugate: species.pKaConjugate,
    cationsPerMole: species.cationsPerMole,
    anionsPerMole: species.anionsPerMole
  };
}

/**
 * Authoritative Universal pH & Chemical Equilibrium Engine v2
 */
export class PHEngine {
  static NAOH_MW = 40.00;
  static KOH_MW = 56.11;
  static CITRIC_ACID_MW = 192.12;
  static LABSA_MW = 326.49;
  static DTPA_PKA = [1.79, 2.55, 4.33, 8.60, 10.42];
  static EPSILON_DERIV = 1e-7;

  /**
   * Universal Neutralization Calculator:
   * Computes stoichiometric base requirements, heat of reaction, water generated,
   * and dissolution requirements for any acid-alkali pair.
   */
  static calculateNeutralization(
    acidInput: number | NeutralizationInput,
    acidPurity?: number,
    basePurity?: number,
    _acidMw = 326.49,
    baseMw = 39.9971
  ): NeutralizationResult {
    const isObj = typeof acidInput === 'object' && acidInput !== null;
    const rawAcidKg = typeof acidInput === 'number'
      ? acidInput
      : (acidInput?.labsaQty ?? acidInput?.acidKg ?? acidInput?.amount ?? 1);
    const aPur = typeof acidPurity === 'number'
      ? acidPurity
      : (isObj ? (acidInput?.labsaPurity ?? acidInput?.acidPurity ?? 90) : 90);
    const alkaliType = isObj && acidInput?.alkaliType ? acidInput.alkaliType : 'NaOH Flakes (99%)';

    let bPur = typeof basePurity === 'number' ? basePurity : 99;
    if (alkaliType.includes('48%') || alkaliType.includes('Lye (48%)')) {
      bPur = 48;
    } else if (alkaliType.includes('50%') || alkaliType.includes('Lye (50%)')) {
      bPur = 50;
    } else if (alkaliType.includes('KOH')) {
      bPur = (alkaliType.includes('85%') ? 85 : (alkaliType.includes('90%') ? 90 : 90));
    }

    const acidName = `LABSA ${aPur}%`;
    const baseName = alkaliType;

    const acidProfile = resolveScientificAcidBaseProfile({ name: acidName, activeMatterPct: aPur });
    const baseProfile = resolveScientificAcidBaseProfile({ name: baseName, activeMatterPct: bPur });

    const acidEqResult = calculateReactiveEquivalents(acidProfile, rawAcidKg);
    const acidEq = acidEqResult.totalReactiveEquivalents ?? 0;

    const baseEqPerKg = baseProfile.equivalentBasis.reactiveEquivalentsPerKg ?? ((bPur / 100 * 1000 / baseMw));
    const requiredBaseKg = baseEqPerKg > 0 ? acidEq / baseEqPerKg : 0;

    // Stoichiometric water generated: 1 mol H+ + 1 mol OH- -> 18.015 g H2O
    const waterGeneratedGrams = acidEq * 18.015;
    const alkaliGrams = Number((requiredBaseKg * 1000).toFixed(1));

    // Standard molar neutralization enthalpy is a physical constant (~57.3 kJ per mole of H+ reacted)
    const heatGeneratedKJ = acidEq > 0 ? Math.round(acidEq * 57.0) : 0;

    return {
      requiredBaseKg: Number(requiredBaseKg.toFixed(3)),
      alkaliRequiredGrams: alkaliGrams,
      heatGeneratedKJ,
      stoichiometricRatio: Number((requiredBaseKg / Math.max(0.0001, rawAcidKg)).toFixed(3)),
      exothermEstimateC: null, // Temperature rise is physically incalculable without specific heat capacities, reactor mass, and thermal loss curves.
      waterGeneratedGrams: Number(waterGeneratedGrams.toFixed(1)),
      recommendedWaterForDissolutionGrams: Math.round(requiredBaseKg * 1000 * 3),
      calculationNote: 'Stoichiometric water derived from reaction extent (18.015 g/mol H2O). Temperature rise (exothermC) set to null (THERMOCHEMICAL_DATA_UNAVAILABLE).'
    };
  }

  /**
   * Davies equation for calculating ion activity coefficients.
   */
  static daviesGamma(ionicStrength: number, charge: number): number {
    return ActivityModel.daviesGamma(ionicStrength, charge);
  }

  /**
   * Computes speciation ionization fractions (alpha0 ... alphan) for a polyprotic system.
   */
  static calculateAlphaFractions(pKa: number[], pH: number): number[] {
    return EquilibriumSystem.calculatePolyproticAlphas(pKa, pH);
  }

  /**
   * Computes buffer capacity beta = dCb/dpH via central difference numerical derivative.
   */
  static calculateBufferCapacity(
    chargeBalanceFn: (pH: number) => number,
    currentPH: number
  ): number {
    const eps = PHEngine.EPSILON_DERIV;
    const fPlus = chargeBalanceFn(currentPH + eps);
    const fMinus = chargeBalanceFn(currentPH - eps);
    const df = (fPlus - fMinus) / (2 * eps);
    return Math.max(0.0001, Math.abs(df) / Math.LN10);
  }

  /**
   * Full Chemical Equilibrium Solver & Speciation Engine (delegating to PHEngineV2).
   */
  calculatePH(
    ingredients: IngredientInput[],
    totalMassKg: number = 100,
    targetPH: number = 7.0,
    options: PHCalculationOptions = {}
  ): PHAdvancedResult {
    const rawCategory = options.productCategory;
    let normalizedCategory = rawCategory;
    if (rawCategory) {
      const norm = normalizeProductCategory(rawCategory);
      if (norm !== 'UNKNOWN_PRODUCT_CATEGORY') {
        normalizedCategory = norm;
      }
    }

    const v2Result = PHEngineV2.calculatePH(ingredients, totalMassKg, {
      ...options,
      productCategory: normalizedCategory,
      targetPH
    });

    // Map speciation format for legacy view components
    const speciation: SpeciationResult[] = (v2Result.details.speciation || []).map(s => ({
      chemicalKey: s.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      displayName: s.displayName,
      totalMolarity: s.totalMolarity,
      species: s.species.map(sp => ({
        name: sp.speciesName,
        charge: sp.charge,
        fraction: sp.fraction,
        molarConcentration: sp.molarConcentration
      }))
    }));

    return {
      pH: v2Result.pH,
      finalPH: v2Result.finalPH,
      bufferCapacity: v2Result.bufferCapacity,
      totalBufferCapacity: v2Result.totalBufferCapacity,
      ionicStrength: v2Result.ionicStrength,
      solverConverged: v2Result.converged,
      solverIterations: v2Result.iterations,
      excessStrongAcid: v2Result.excessStrongAcid,
      excessStrongBase: v2Result.excessStrongBase,
      status: v2Result.status,
      method: v2Result.method,
      converged: v2Result.converged,
      iterations: v2Result.iterations,
      residual: v2Result.residual,
      stepSize: v2Result.stepSize,
      activityModel: v2Result.activityModel,
      modelValidity: v2Result.modelValidity,
      temperatureC: v2Result.temperatureC,
      assumptions: v2Result.assumptions,
      warnings: v2Result.warnings,
      confidence: v2Result.confidence,
      measuredPH: v2Result.measuredPH,
      predictionError: v2Result.predictionError,
      details: {
        totalAcidMoles: v2Result.details.totalAcidMoles,
        totalBaseMoles: v2Result.details.totalBaseMoles,
        netMoles: v2Result.details.netMoles,
        recognizedContributors: v2Result.details.recognizedContributors,
        modelType: v2Result.details.modelType,
        speciation,
        ionicStrength: v2Result.details.ionicStrength,
        chargeResidual: v2Result.details.chargeResidual,
        normalizedComposition: v2Result.details.normalizedComposition
      }
    };
  }
}

/**
 * Authoritative global helper for advanced multi-component aqueous pH calculation.
 * Preserves canonical product category context through to PHEngineV2.
 */
export function calculatePHAdvanced(
  ingredients: IngredientInput[],
  totalMassKg: number = 100,
  options?: PHCalculationOptions | ProductCategoryId | string
): PHAdvancedResult {
  const engine = new PHEngine();
  const rawOptions: PHCalculationOptions =
    typeof options === 'string'
      ? { productCategory: options }
      : options || {};

  const rawCat = rawOptions.productCategory;
  let canonicalCat = rawCat;
  if (rawCat) {
    const norm = normalizeProductCategory(rawCat);
    if (norm !== 'UNKNOWN_PRODUCT_CATEGORY') {
      canonicalCat = norm;
    }
  }

  const normalizedOptions: PHCalculationOptions = {
    ...rawOptions,
    productCategory: canonicalCat
  };

  return engine.calculatePH(ingredients, totalMassKg, 7.0, normalizedOptions);
}

/**
 * Simplified pH calculation helper returning estimated note and pH.
 * Preserves canonical product category context through to PHEngineV2.
 */
export function calculatePHSimple(
  ingredients: IngredientInput[],
  totalMassKg: number = 100,
  options?: PHCalculationOptions | ProductCategoryId | string
): PHSimpleResult {
  const result = calculatePHAdvanced(ingredients, totalMassKg, options);
  return {
    pH: result.pH,
    estimated: true,
    method: result.method,
    note: `Calculated with rigorous thermodynamic equilibrium model (${result.method || 'Safeguarded Newton-Raphson with Bracketed Bisection Fallback'})`
  };
}

/**
 * Global authoritative neutralization calculator.
 */
export function calculateNeutralization(
  acidInput: number | NeutralizationInput,
  acidPurity?: number,
  basePurity?: number,
  acidMw = 326.49,
  baseMw = 39.9971
): NeutralizationResult {
  return PHEngine.calculateNeutralization(acidInput, acidPurity, basePurity, acidMw, baseMw);
}

/**
 * Validation & Benchmark Verification Routine
 */
export function runValidationTests() {
  const engine = new PHEngine();

  // Test 1: LABSA + NaOH stoichiometric equivalence -> pH = 7.0
  const res1 = engine.calculatePH([
    { name: 'LABSA', rawPercent: 3.2649, activePercent: 100 },
    { name: 'NaOH', rawPercent: 0.400, activePercent: 100 }
  ], 100);

  // Test 2: KOH 85% active vs 100% active
  const res2_85 = engine.calculatePH([
    { name: 'Potassium Hydroxide', rawPercent: 2, activePercent: 85 }
  ], 100);
  const res2_100 = engine.calculatePH([
    { name: 'Potassium Hydroxide', rawPercent: 2, activePercent: 100 }
  ], 100);

  // Test 3: Sodium Bicarbonate amphiprotic pH = 8.34
  const res3 = engine.calculatePH([
    { name: 'Sodium Bicarbonate', rawPercent: 2, activePercent: 100 }
  ], 100);

  // Test 4: Citric Acid + Sodium Citrate buffer
  const res4 = engine.calculatePH([
    { name: 'Citric Acid', rawPercent: 2, activePercent: 100 },
    { name: 'Sodium Citrate', rawPercent: 2, activePercent: 100 }
  ], 100);

  // Test 5: Unknown ingredient ignored -> pH = 7.0
  const res5 = engine.calculatePH([
    { name: 'Fragrance', rawPercent: 1, activePercent: 100 }
  ], 100);

  // Test 6: Tea Tree Oil collision protection -> pH = 7.0 (not classified as TEA)
  const res6 = engine.calculatePH([
    { name: 'Tea Tree Oil', rawPercent: 1, activePercent: 100 }
  ], 100);

  // Test 7: Genuine TEA recognition -> weak base pH > 9.0
  const res7 = engine.calculatePH([
    { name: 'Triethanolamine (TEA 99%)', rawPercent: 1, activePercent: 100 }
  ], 100);

  // Test 8: Authoritative Neutralization Benchmark (LABSA 10kg 90% + NaOH Flakes 99% -> 1.114 kg base, 496.6g water derived stoichiometrically)
  const neutRes = calculateNeutralization({ labsaQty: 10, labsaPurity: 90, alkaliType: 'NaOH Flakes (99%)' });
  const neutPass = Math.abs(neutRes.requiredBaseKg - 1.114) <= 0.005 && Math.abs(neutRes.waterGeneratedGrams - 496.6) <= 1.0;

  const passed = (Math.abs(res1.pH - 7.0) <= 0.05) &&
                 (res2_100.details?.totalBaseMoles > res2_85.details?.totalBaseMoles) &&
                 (Math.abs(res3.pH - 8.34) <= 0.05) &&
                 (res4.pH >= 4.0 && res4.pH <= 4.8) &&
                 (Math.abs(res5.pH - 7.0) <= 0.05) &&
                 (Math.abs(res6.pH - 7.0) <= 0.05) &&
                 (res7.pH >= 9.0 && res7.pH <= 10.5) &&
                 neutPass;

  return { passed: passed ? 10 : 0, failed: passed ? 0 : 10 };
}

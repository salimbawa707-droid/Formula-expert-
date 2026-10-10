/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - TYPE DEFINITIONS
 * ============================================================================
 * Strong typing for chemical equilibrium speciation, activity models,
 * composition normalization, numerical solver contracts, and result diagnostics.
 * ============================================================================
 */

import { ProductCategoryId } from '../productTaxonomy';

export type PHResultStatus =
  | 'CONVERGED'
  | 'NON_CONVERGED'
  | 'INSUFFICIENT_DATA'
  | 'MODEL_OUT_OF_RANGE'
  | 'INVALID_FORMULA';

export type ActivityModelType = 'ideal' | 'davies' | 'debye_huckel';

export type ModelValidityLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'OUT_OF_RANGE';

export type ChemicalFamilyType =
  | 'STRONG_ACID'
  | 'STRONG_BASE'
  | 'CARBONATE'
  | 'CITRATE'
  | 'PHOSPHATE'
  | 'SILICATE'
  | 'CARBOXYLIC_WEAK_ACID'
  | 'POLYACRYLATE'
  | 'CHELATOR_AMINOCARBOXYLATE'
  | 'PHOSPHONATE'
  | 'AMINE_BASE'
  | 'SULFONIC_ACID_LABSA'
  | 'NEUTRAL_SALT'
  | 'INERT_OR_SURFACTANT';

export interface SpeciesDefinition {
  speciesId: string;
  displayName: string;
  formula: string;
  mw: number;
  family: ChemicalFamilyType;
  pKa?: number[];
  pKb?: number[];
  pKaConjugate?: number;
  cationsPerMole?: number;
  anionsPerMole?: number;
  cationValency?: number;
  anionValency?: number;
  eqPerMole?: number;
  pHEffect: 'acid' | 'base' | 'neutral' | 'buffer';
  description: string;
  source?: string;
  parameterProvenance?: 'SOURCE_BACKED' | 'DATABASE_DERIVED' | 'USER_PROVIDED' | 'ESTIMATED' | 'UNKNOWN' | 'SOURCE_NOT_VERIFIED';
  isSolventWater?: boolean;
}

export interface NormalizedIngredient {
  inputName: string;
  resolvedSpecies: SpeciesDefinition | null;
  rawMassKg: number;
  activeFraction: number;
  activeMassKg: number;
  moles: number;
  molarity: number; // mol/L in solution
  density?: number;
  waterFraction: number;
  waterMassKg: number;
  isRecognized: boolean;
  notes?: string[];
  acidBaseProfile?: any;
}

export interface NormalizedComposition {
  totalMassKg: number;
  totalVolumeL: number;
  apparentDensity: number;
  explicitWaterKg: number;
  rawMaterialWaterKg: number;
  totalWaterKg: number;
  waterMassFraction: number;
  temperatureC: number;
  productCategory?: ProductCategoryId;
  ingredients: NormalizedIngredient[];
  recognizedMassFraction: number;
  unrecognizedCount: number;
  isPowder: boolean;
  slurryDilutionFactor?: number;
}

export interface SpeciationFraction {
  speciesName: string;
  charge: number;
  fraction: number;
  molarConcentration: number;
}

export interface ChemicalFamilySpeciation {
  familyType: ChemicalFamilyType;
  displayName: string;
  totalMolarity: number;
  species: SpeciationFraction[];
  netChargeContribution: number;
}

export interface SolverStepLog {
  iteration: number;
  currentPH: number;
  residual: number;
  stepSize: number;
  method: 'newton' | 'bisection';
}

export interface NumericalSolverResult {
  pH: number;
  status: PHResultStatus;
  converged: boolean;
  iterations: number;
  residual: number;
  stepSize: number;
  method: string;
  log?: SolverStepLog[];
}

export interface PHCalculationOptions {
  temperatureC?: number;
  targetPH?: number;
  activityModel?: ActivityModelType;
  productCategory?: ProductCategoryId | string;
  assumeSlurryBasisIfPowder?: boolean;
  slurryConcentrationPct?: number; // e.g. 1% for standard powder test liquor
  maxIterations?: number;
  tolerance?: number;
}

export interface DetailedPHResult {
  pH: number;
  finalPH: number;
  status: PHResultStatus;
  method: string;
  converged: boolean;
  iterations: number;
  residual: number;
  stepSize: number;
  ionicStrength: number;
  activityModel: ActivityModelType;
  modelValidity: ModelValidityLevel;
  temperatureC: number;
  assumptions: string[];
  warnings: string[];
  confidence: number;
  measuredPH: number | null;
  predictionError: number | null;
  excessStrongAcid: number;
  excessStrongBase: number;
  bufferCapacity: number;
  totalBufferCapacity: number;
  solverConverged: boolean;
  solverIterations: number;
  details: {
    totalAcidMoles: number;
    totalBaseMoles: number;
    netMoles: number;
    recognizedContributors: string[];
    modelType: string;
    speciation: ChemicalFamilySpeciation[];
    ionicStrength: number;
    activityCoefficients?: Record<string, number>;
    chargeResidual: number;
    normalizedComposition?: {
      totalMassKg: number;
      totalVolumeL: number;
      totalWaterKg: number;
      recognizedMassFraction: number;
      productCategory?: ProductCategoryId;
      isPowder?: boolean;
    };
  };
}

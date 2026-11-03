/**
 * ============================================================================
 * PHASE P2-11 CLOSURE — SCIENTIFIC PREDICTIVE VALIDATION & CALIBRATION ARCHITECTURE
 * ============================================================================
 * Establishes the authoritative mechanistic prediction foundation, category-aware
 * condition modeling, uncertainty propagation, laboratory validation test data
 * structures, prediction vs. actual error calibration, and accuracy target framework.
 * ============================================================================
 */

import { ProductCategoryId } from '../domain/productTaxonomy';
import { ScientificModelMaturity, ValidationStatus } from './scientificModelRegistry';

export interface ScientificPredictionRecord<T> {
  property: string;
  value: T;
  unit?: string;
  modelId: string;
  modelVersion: string;
  maturity: ScientificModelMaturity;
  validationStatus: ValidationStatus;
  confidenceBasis: string;
  uncertainty?: {
    lower?: number;
    upper?: number;
    unit?: string;
  };
  conditions?: {
    temperatureC?: number;
    waterHardnessPpm?: number;
    dosageGramsPerL?: number;
    soilType?: string;
  };
  limitations: string[];
}

export interface LabValidationTestRecord {
  testId: string;
  formulaId: string;
  formulaVersion: string;
  formulaFingerprint: string;
  productCategory: ProductCategoryId;
  machineType?: string;
  temperatureC?: number;
  waterHardnessPpm?: number;
  dosageGramsPerL?: number;
  soilType?: string;
  testMethod: string; // e.g., 'ASTM D3050', 'ISO 4319'
  replicateNumber: number;
  measuredResult: number;
  unit: string;
  meanResult?: number;
  standardDeviation?: number;
  laboratoryName: string;
  testDate: string;
  operator: string;
}

export interface PredictionVsActualComparison {
  property: string;
  predictedValue: number;
  measuredValue: number;
  absoluteError: number;
  relativeErrorPct: number;
  isWithinTolerance: boolean;
  tolerancePct: number;
}

export interface ModelCalibrationRecord {
  modelId: string;
  modelVersionTarget: string;
  sampleCount: number;
  mae: number;
  rmse: number;
  bias: number;
  r2?: number;
  calibrationDate: string;
  status: 'CALIBRATED' | 'PENDING_VALIDATION' | 'UNRELIABLE';
}

export interface AccuracyValidationTarget {
  property: string;
  metric: string;
  acceptanceThreshold: string;
  datasetRequirement: string;
  currentMeasuredAccuracy: string;
  validationStatus: 'NOT_YET_VALIDATED' | 'PARTIALLY_VALIDATED' | 'VALIDATED';
}

export const MASTER_ACCURACY_VALIDATION_TARGETS: AccuracyValidationTarget[] = [
  { property: 'pH Prediction', metric: 'Absolute Error (MAE)', acceptanceThreshold: 'MAE <= 0.15 pH units', datasetRequirement: 'n >= 50 across 5 categories', currentMeasuredAccuracy: 'Not yet established (Empirical screening)', validationStatus: 'NOT_YET_VALIDATED' },
  { property: 'Density Prediction', metric: 'Relative Error', acceptanceThreshold: 'Error <= 1.0%', datasetRequirement: 'n >= 30 liquid formulas', currentMeasuredAccuracy: 'Not yet established (Volume-weighted estimate)', validationStatus: 'NOT_YET_VALIDATED' },
  { property: 'Active Matter', metric: 'Compositional Assay Error', acceptanceThreshold: 'Error <= 2.0%', datasetRequirement: 'n >= 100 surfactant assays', currentMeasuredAccuracy: 'Source-backed assay verified', validationStatus: 'PARTIALLY_VALIDATED' },
  { property: 'Viscosity Prediction', metric: 'Logarithmic Error', acceptanceThreshold: 'Error <= 15%', datasetRequirement: 'n >= 40 shear-rate profiles', currentMeasuredAccuracy: 'Not yet established (Heuristic rheology)', validationStatus: 'NOT_YET_VALIDATED' },
  { property: 'Cleaning Score / CPI', metric: 'Score MAE', acceptanceThreshold: 'MAE <= 5.0 points on 100-pt scale', datasetRequirement: 'n >= 120 ASTM soil panels', currentMeasuredAccuracy: 'Not yet established (Screening index)', validationStatus: 'NOT_YET_VALIDATED' }
];

export const COMPREHENSIVE_SCIENTIFIC_MODEL_INVENTORY = [
  { modelId: 'model-active-matter', name: 'Active Surfactant Matter Calculator', property: 'Active Matter', maturity: 'SOURCE_BACKED_MODEL' },
  { modelId: 'model-chelation-hardness', name: 'Chelator & Hard-Water Engine', property: 'Chelation Capacity', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-cleaning-cpi', name: 'Cleaning Performance Index (CPI)', property: 'Cleaning Score', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-climate-water', name: 'Climate & Hard Water Analysis Engine', property: 'Water Hardness Impact', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-compatibility', name: 'Chemical Compatibility Rule Engine', property: 'Compatibility', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-cost-margin', name: 'Costing & Margin Chain Engine', property: 'Commercial Margin', maturity: 'SOURCE_BACKED_MODEL' },
  { modelId: 'model-density-solids', name: 'Density & Total Solids / NVR Engine', property: 'Density & NVR', maturity: 'ESTIMATED' },
  { modelId: 'model-dilution', name: 'Dilution & Dosing Engine', property: 'Working Concentration', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-expert-reasoning', name: 'Expert Formulation Reasoning Engine', property: 'Formulation Expert Insights', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-ai-grade', name: 'Multi-Factor AI Formulation Grade', property: 'AI Grade', maturity: 'ESTIMATED' },
  { modelId: 'model-hlb-surfactant', name: 'HLB & Surfactant Balance Engine', property: 'HLB', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-ingredient-intelligence', name: 'Ingredient Intelligence Engine', property: 'Ingredient Properties', maturity: 'SOURCE_BACKED_MODEL' },
  { modelId: 'model-inventory', name: 'Inventory Valuation Engine', property: 'Stock Valuation', maturity: 'SOURCE_BACKED_MODEL' },
  { modelId: 'model-lab-evidence', name: 'Lab Evidence & Predicted vs. Measured Engine', property: 'Lab Verification', maturity: 'BENCHMARK_CALIBRATED' },
  { modelId: 'model-lab-health', name: 'Formulation Lab Health Index', property: 'Lab Health Score', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-manufacturing', name: 'Manufacturing & Scale-Up Engine', property: 'Process Instructions', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-ph-titration', name: 'pH Equilibrium & Titration Engine', property: 'pH & Titratable Alkalinity', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-powder-slurry', name: 'Powder Formulation & Slurry Engine', property: 'Slurry Moisture & Spray Drying', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-provenance', name: 'Provenance & Fingerprinting Engine', property: 'Formula Traceability', maturity: 'SOURCE_BACKED_MODEL' },
  { modelId: 'model-regulatory-compliance', name: 'Regulatory & Environmental Compliance Engine', property: 'GHS & REACH Compliance', maturity: 'SOURCE_BACKED_MODEL' },
  { modelId: 'model-quality-gate', name: 'Master Scientific Quality Gate Engine', property: 'Quality Verdict', maturity: 'EMPIRICAL_MODEL' },
  { modelId: 'model-substitution', name: 'Ingredient Substitution Engine', property: 'Alternative Surfactants', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-viscosity-rheology', name: 'Viscosity & Rheology Engine', property: 'Brookfield Viscosity', maturity: 'HEURISTIC_SCREENING' },
  { modelId: 'model-learning-loop', name: 'R&D Learning & Optimization Loop Engine', property: 'Optimization Score', maturity: 'HEURISTIC_SCREENING' }
];

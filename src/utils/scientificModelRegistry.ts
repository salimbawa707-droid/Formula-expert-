/**
 * ============================================================================
 * PHASE P2-11 — SCIENTIFIC MODEL MATURITY & HEURISTIC LABELING REGISTRY
 * ============================================================================
 * Defines the authoritative Model Maturity States, Metadata, and Registry
 * for all predictive, heuristic, empirical, and lab-validated models in
 * the Detergent Formula Expert system.
 * ============================================================================
 */

export type ScientificModelMaturity =
  | "LAB_VALIDATED"
  | "SOURCE_BACKED_MODEL"
  | "EMPIRICAL_MODEL"
  | "SEMI_EMPIRICAL_SCREENING"
  | "HEURISTIC_SCREENING"
  | "RULE_BASED_SCREENING"
  | "THERMODYNAMIC_EQUILIBRIUM_SCREENING"
  | "ESTIMATED"
  | "UNKNOWN_NOT_VALIDATED";

export type ScientificModelClass =
  | "DETERMINISTIC_SCIENTIFIC"
  | "DETERMINISTIC_MASS_BALANCE"
  | "STOICHIOMETRIC"
  | "THERMODYNAMIC_EQUILIBRIUM"
  | "THERMODYNAMIC_EQUILIBRIUM_SCREENING"
  | "IDEALIZED_PREDICTIVE_MODEL"
  | "SOURCE_BACKED"
  | "EMPIRICAL_MODEL"
  | "SEMI_EMPIRICAL_SCREENING"
  | "HEURISTIC_SCREENING"
  | "RULE_BASED"
  | "RULE_BASED_SCREENING"
  | "MATHEMATICAL_TRANSFORMATION"
  | "UNKNOWN";

export type ValidationStatus =
  | "VALIDATED"
  | "PARTIALLY_VALIDATED"
  | "NOT_VALIDATED"
  | "EMPIRICALLY_UNVALIDATED"
  | "UNKNOWN";

export interface ScientificModelMetadata {
  modelId: string;
  modelName: string;
  property: string;
  modelClass?: ScientificModelClass;
  maturity: ScientificModelMaturity;
  validationStatus: ValidationStatus;
  scientificBasis?: string;
  evidenceProvenance?: string;
  applicabilityDomain?: string;
  inputDataRequirements?: string[];
  knownLimitations?: string[];
  unknownBehavior?: string;
  empiricalValidationStatus?: string;
  evidenceIds?: string[];
  validationDatasetId?: string;
  sampleCount?: number;
  validationMetrics?: {
    mae?: number;
    rmse?: number;
    r2?: number;
    bias?: number;
  };
  applicableCategories?: string[];
  limitations: string[];
  version: string;
}

export interface ScientificResult<T> {
  value?: T;
  status:
    | "KNOWN"
    | "ESTIMATED"
    | "HEURISTIC"
    | "LAB_VALIDATED"
    | "SOURCE_BACKED"
    | "UNKNOWN";
  maturity: ScientificModelMaturity;
  confidence?: number;
  confidenceBasis?: string;
  uncertainty?: {
    lower?: number;
    upper?: number;
    unit?: string;
  };
  limitations: string[];
  modelId?: string;
  modelVersion?: string;
}

export const SCIENTIFIC_MODEL_REGISTRY: Record<string, ScientificModelMetadata> = {
  'model-cpi-cleaning': {
    modelId: 'model-cpi-cleaning',
    modelName: 'Cleaning Performance Index (CPI) Screening Engine',
    property: 'Cleaning Score / CPI',
    modelClass: 'HEURISTIC_SCREENING',
    maturity: 'HEURISTIC_SCREENING',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Additive surfactant detergency index weighted by builder and soil factors.',
    limitations: [
      'Formulation screening estimate only.',
      'Not a laboratory detergency test result.',
      'Does not replace ASTM/ISO soil removal physical testing.'
    ],
    applicableCategories: ['Laundry Liquid', 'Laundry Powder', 'Manual Dishwash', 'Automatic Dishwasher', 'Floor Cleaner'],
    version: '1.0.0'
  },
  'model-density-prediction': {
    modelId: 'model-density-prediction',
    modelName: 'Compositional Density Estimator',
    property: 'Density',
    modelClass: 'IDEALIZED_PREDICTIVE_MODEL',
    maturity: 'EMPIRICAL_MODEL',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Volume-weighted average density of raw ingredient inputs under ideal volume additivity.',
    limitations: [
      'Predicted density based on ideal mixing assumptions [rho_mix = sum(m_i) / sum(m_i / rho_i)].',
      'Does not account for non-linear excess volume of mixing or high salt hydration expansion.'
    ],
    applicableCategories: ['All Categories'],
    version: '1.0.0'
  },
  'model-hlb-screening': {
    modelId: 'model-hlb-screening',
    modelName: 'Griffin / Davies HLB Surfactant Balance Estimator',
    property: 'HLB & Emulsion Stability',
    modelClass: 'HEURISTIC_SCREENING',
    maturity: 'HEURISTIC_SCREENING',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Linear surfactant blend HLB calculation based on active surfactant mass fractions.',
    limitations: [
      'Simplified hydrophilic-lipophilic balance arithmetic.',
      'Does not substitute for phase inversion temperature (PIT) or mixed-micelle phase diagrams.'
    ],
    applicableCategories: ['All Categories'],
    version: '1.0.0'
  },
  'model-compatibility-screening': {
    modelId: 'model-compatibility-screening',
    modelName: 'Chemical Compatibility Rule Screening Engine',
    property: 'Chemical Compatibility',
    modelClass: 'RULE_BASED_SCREENING',
    maturity: 'RULE_BASED_SCREENING',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Functional group and ionic charge interaction matrix.',
    limitations: [
      'Rule-based functional group screening.',
      'Does not guarantee physical-chemical storage stability without accelerated aging data.'
    ],
    applicableCategories: ['All Categories'],
    version: '1.0.0'
  },
  'model-stability-screening': {
    modelId: 'model-stability-screening',
    modelName: 'Shelf-Life & Stability Screening Model',
    property: 'Shelf Life & Accelerated Stability',
    modelClass: 'HEURISTIC_SCREENING',
    maturity: 'ESTIMATED',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Conservatively estimated shelf-life based on preservative and surfactant class rules.',
    limitations: [
      'Not a guaranteed shelf-life duration.',
      'Requires real-time and accelerated (25°C/40°C/45°C) physical stability and microbial challenge testing.'
    ],
    applicableCategories: ['All Categories'],
    version: '1.0.0'
  },
  'model-foam-prediction': {
    modelId: 'model-foam-prediction',
    modelName: 'Surfactant Foam Volume Screening Model',
    property: 'Foam Profile',
    modelClass: 'HEURISTIC_SCREENING',
    maturity: 'HEURISTIC_SCREENING',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Surfactant class foaming index adjusted for builder and hardness.',
    limitations: [
      'Foam height is not directly equivalent to detergency or cleaning performance.',
      'Actual foam behavior depends heavily on mechanical agitation and soil load.'
    ],
    applicableCategories: ['Laundry Liquid', 'Laundry Powder', 'Manual Dishwash'],
    version: '1.0.0'
  },
  'model-active-matter': {
    modelId: 'model-active-matter',
    modelName: 'Active Surfactant Matter Calculator',
    property: 'Active Matter Percentage',
    modelClass: 'DETERMINISTIC_SCIENTIFIC',
    maturity: 'SOURCE_BACKED_MODEL',
    validationStatus: 'VALIDATED',
    empiricalValidationStatus: 'SOURCE_BACKED_ASSAY',
    scientificBasis: 'Percentage weighted by verified commercial grade active assay.',
    evidenceProvenance: 'COA_OR_TDS_ASSAY',
    applicabilityDomain: 'All liquid and powder surfactant formulations',
    inputDataRequirements: ['Ingredient percentage', 'Verified active assay fraction'],
    knownLimitations: ['Dependent on CoA accuracy; unknown assays propagate uncertainty.'],
    unknownBehavior: 'Propagates UNKNOWN / INSUFFICIENT_DATA status downstream',
    limitations: [
      'Depends on accuracy of commercial grade assay certificates.',
      'Defaults to 100% active only if raw assay is explicitly verified; unknown assays propagate uncertainty.'
    ],
    applicableCategories: ['All Categories'],
    version: '1.0.0'
  },
  'model-ph-v2': {
    modelId: 'model-ph-v2',
    modelName: 'Newton-Raphson Speciation & Charge Balance pH Engine V2',
    property: 'Equilibrium pH & Buffer Capacity',
    modelClass: 'THERMODYNAMIC_EQUILIBRIUM_SCREENING',
    maturity: 'THERMODYNAMIC_EQUILIBRIUM_SCREENING',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Full chemical equilibrium charge balance F(pH)=0 with Davies / Extended Debye-Hückel activity coefficients.',
    evidenceProvenance: 'PROTOLYTIC_THERMODYNAMICS',
    applicabilityDomain: 'Aqueous solutions, pH 1 to 14, ionic strength <= 1.5 M',
    inputDataRequirements: ['Chemical speciation mapping', 'Acid/base pKa/pKb', 'Equivalent weight', 'Temperature'],
    knownLimitations: [
      'Davies activity coefficient model validity regime is I <= 0.5 M; at I > 1.5 M system flags MODEL_OUT_OF_RANGE.',
      'Numerical convergence tolerance (1e-7) is a solver residual, not physical measurement uncertainty.'
    ],
    unknownBehavior: 'Propagates UNKNOWN / OUT_OF_DOMAIN when chemical species cannot be resolved',
    limitations: [
      'Concentrated electrolyte matrices (I > 1.5 M) exhibit ion-pairing outside standard Debye-Hückel range.',
      'Aqueous pH definition requires solvent water fraction > 10%.'
    ],
    applicableCategories: ['All Categories'],
    version: '2.0.0'
  },
  'model-stoichiometric-neutralization': {
    modelId: 'model-stoichiometric-neutralization',
    modelName: 'Primary Acid-Base Stoichiometric Neutralization Engine',
    property: 'Stoichiometric Equivalents & Reaction Extent',
    modelClass: 'STOICHIOMETRIC',
    maturity: 'SOURCE_BACKED_MODEL',
    validationStatus: 'VALIDATED',
    empiricalValidationStatus: 'STOICHIOMETRICALLY_EXACT',
    scientificBasis: 'Direct reactive equivalent mass/molar stoichiometry based on proton exchange.',
    evidenceProvenance: 'STOICHIOMETRIC_EQUIVALENCE',
    applicabilityDomain: 'Acid-base neutralization pre-mixes and saponification systems',
    inputDataRequirements: ['Equivalent weight', 'Molecular weight', 'Verified active assay', 'Mass dosage'],
    knownLimitations: ['Assumes complete reaction extent before weak acid equilibrium dissociation.'],
    unknownBehavior: 'Missing assay strictly triggers INSUFFICIENT_DATA status',
    limitations: [
      'Mathematical stoichiometric certainty requires verified raw-material assay.',
      'Heat of reaction is reported as null unless explicit enthalpy data is attached.'
    ],
    applicableCategories: ['All Categories'],
    version: '2.0.0'
  },
  'model-chelation-capacity': {
    modelId: 'model-chelation-capacity',
    modelName: 'Multi-Builder Chelation & Sequestration Engine',
    property: 'Water Hardness Sequestration & CaCO3 Binding',
    modelClass: 'STOICHIOMETRIC',
    maturity: 'EMPIRICAL_MODEL',
    validationStatus: 'PARTIALLY_VALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED_MATRIX',
    scientificBasis: 'Ligand metal binding stoichiometry partition between soluble chelants and insoluble builders.',
    evidenceProvenance: 'STOICHIOMETRIC_AND_EQUILIBRIUM_SEQUESTRATION',
    applicabilityDomain: 'Water hardness ranges 0 to 500 ppm CaCO3 equiv across liquid and powder wash liquors',
    inputDataRequirements: ['Chelator active assay', 'Binding capacity constant (mg CaCO3/g)', 'Wash liquor volume', 'Product dosage'],
    knownLimitations: [
      'Separates theoretical stoichiometric capacity from competitive multi-ion matrix sequestration.',
      'Temperature and extreme pH shifts alter thermodynamic stability constants (log K).'
    ],
    unknownBehavior: 'Returns SCREENING status with unverified matrix assumptions',
    limitations: [
      'CaCO3 binding values from literature represent standard alkaline conditions (pH 10-11).',
      'At acidic pH (< 5), aminopolycarboxylate chelation capacity is significantly suppressed by proton competition.'
    ],
    applicableCategories: ['Laundry Liquid', 'Laundry Powder', 'Manual Dishwash', 'Automatic Dishwasher', 'Surface Cleaners'],
    version: '2.0.0'
  },
  'model-viscosity-rheology': {
    modelId: 'model-viscosity-rheology',
    modelName: 'Micellar & Polymeric Rheology Viscosity Engine',
    property: 'Dynamic Viscosity & Rheological Flow Profile',
    modelClass: 'SEMI_EMPIRICAL_SCREENING',
    maturity: 'SEMI_EMPIRICAL_SCREENING',
    validationStatus: 'EMPIRICALLY_UNVALIDATED',
    empiricalValidationStatus: 'EMPIRICALLY_UNVALIDATED',
    scientificBasis: 'Micellar packing parameter (sphere-to-rod growth) with electrolyte salt curve and polymer network mechanics.',
    evidenceProvenance: 'RHEOLOGICAL_MICELLAR_MODEL',
    applicabilityDomain: 'Aqueous fluid surfactant formulations at 4°C to 40°C; standard test shear rate ~20 s^-1',
    inputDataRequirements: ['Active surfactant matter', 'Cosurfactant ratio', 'Electrolyte percentage', 'Thickener presence', 'Temperature'],
    knownLimitations: [
      'Single scalar viscosity assumes standard Brookfield RVT @ 20 RPM (~20 s^-1) shear rate condition.',
      'Exact peak salt plateau requires surfactant grade-specific salt curve calibration.'
    ],
    unknownBehavior: 'Returns ESTIMATED rating with default shear assumptions',
    limitations: [
      'Non-Newtonian pseudoplastic fluids exhibit shear-thinning; viscosity varies with dispensing shear rate.',
      'Powder and solid formulations return NOT_APPLICABLE.'
    ],
    applicableCategories: ['Liquid Detergent', 'Liquid Dishwash', 'Surface Cleaner', 'Fabric Softener'],
    version: '2.0.0'
  },
  'model-liquid-nvr': {
    modelId: 'model-liquid-nvr',
    modelName: 'Liquid Non-Volatile Residue (NVR) Engine',
    property: 'Non-Volatile Solids Fraction',
    modelClass: 'DETERMINISTIC_MASS_BALANCE',
    maturity: 'SOURCE_BACKED_MODEL',
    validationStatus: 'VALIDATED',
    empiricalValidationStatus: 'THEORETICAL_MASS_BALANCE',
    scientificBasis: 'Ingredient solid fraction mass balance under 105°C oven drying assumptions.',
    evidenceProvenance: 'GRAVIMETRIC_MASS_BALANCE',
    applicabilityDomain: 'Liquid detergent and aqueous chemical products',
    inputDataRequirements: ['Non-volatile fraction per raw material', 'Formula mass percentages'],
    knownLimitations: ['Theoretical NVR is distinct from physical oven-dried gravimetric recovery.'],
    unknownBehavior: 'Unknown raw materials strictly trigger INSUFFICIENT_DATA and do NOT default to 100% NVR',
    limitations: ['Volatile co-solvents (ethanol, IPA) are treated as 0% NVR under 105°C drying protocols.'],
    applicableCategories: ['Liquid Detergents', 'Liquid Cleaners'],
    version: '1.0.0'
  },
  'model-powder-formulation': {
    modelId: 'model-powder-formulation',
    modelName: 'Powder Formulation Physical & Performance Engine',
    property: 'Powder Bulk Density, Flowability, and Dissolution',
    modelClass: 'EMPIRICAL_MODEL',
    maturity: 'ESTIMATED',
    validationStatus: 'PARTIALLY_VALIDATED',
    empiricalValidationStatus: 'MEASURED_OR_SCREENING_ESTIMATE',
    scientificBasis: 'Inorganic builder mass balance, hygroscopicity matrix, and Carr/Hausner compressibility indices.',
    evidenceProvenance: 'POWDER_PHYSICAL_MECHANICS',
    applicabilityDomain: 'Granular and dry-blend powder detergent products',
    inputDataRequirements: ['Inorganic builder percentages', 'Moisture level', 'Optional laboratory tap density inputs'],
    knownLimitations: [
      'Bulk density is a screening estimate unless laboratory graduated cylinder mass/volume measurements are provided.',
      'Carr Index and Hausner ratio require both loose and tapped measured densities.'
    ],
    unknownBehavior: 'Exposes SCREENING_ESTIMATE without claiming physical tap density measurement',
    limitations: ['Particle size distribution (PSD) and angle of repose require empirical funnel/sieve data.'],
    applicableCategories: ['Laundry Powder', 'Dishwash Powder'],
    version: '2.0.0'
  }
};

export function getModelMetadata(modelId: string): ScientificModelMetadata {
  return SCIENTIFIC_MODEL_REGISTRY[modelId] || {
    modelId,
    modelName: 'General Scientific Prediction Model',
    property: 'Unknown Property',
    maturity: 'UNKNOWN_NOT_VALIDATED',
    validationStatus: 'NOT_VALIDATED',
    scientificBasis: 'Unclassified model or heuristic.',
    limitations: ['Quantitative uncertainty not established.', 'Laboratory validation required.'],
    version: '1.0.0'
  };
}

export interface Chemical {
  id: string;
  name?: string;
  commonName: string;
  chemicalName: string;
  iupacName: string;
  casNumber: string;
  molecularFormula: string;
  molecularWeight: string;
  inciName: string;
  tradeNames: string[];
  synonyms: string[];
  category: string;
  subCategory?: string;
  function?: string;
  keywords?: string[];
  defaultUnit?: string;
  aliases?: string[];
  searchTerms?: string[];
  suppliers: string[];
  marketNames: {
    indian: string;
    international: string;
    hindi?: string;
  };
  physicalProperties: {
    appearance: string;
    color: string;
    odor: string;
    activeMatter: string;
    pH: string;
    density: string;
    viscosity: string;
    solubility: string;
    boilingPoint?: string;
    meltingPoint?: string;
    shelfLife: string;
    storageConditions: string;
  };
  functionalInfo: {
    whatIsIt: string;
    whyUsed: string;
    advantages: string[];
    limitations: string[];
    alternatives: string[];
    ecoFriendliness: string;
  };
  dosage: {
    minimum: string;
    recommended: string;
    premium: string;
    maximum: string;
    household: string;
    industrial: string;
  };
  performance: {
    cleaning: number; // 1-10
    foam: number;     // 1-10
    oilRemoval: number; // 1-10
    greaseCutting: number; // 1-10
    skinMildness: number;  // 1-10
    hardWater: number;    // 1-10
  };
  sustainability: {
    biodegradability: string;
    plantBasedPct: number;
    petroleumBasedPct: number;
    vocStatus: string;
    microplasticStatus: string;
    aquaticToxicity: string;
    greenRating: "A+" | "A" | "B" | "C" | "D";
  };
  safety: {
    ppe: string[];
    ghsClassification: string[];
    hazardStatements: string[];
    precautionaryStatements: string[];
    firstAid: string;
    msdsSummary: string;
  };
  hlb?: string;
  chargeType?: "Anionic" | "Nonionic" | "Amphoteric" | "Cationic" | "Non-Ionic" | "Zwitterionic" | "Neutral" | "N/A";
  approxPrice?: string;
  manufacturers?: string[];
  reachStatus?: string;
  epaStatus?: string;
  patentReferences?: string;
  researchPapers?: string;
  sdsSummary?: string;
  tdsSummary?: string;
  applications?: string[];
  countryOfOrigin?: string;
  // Extended Chemical & Surfactant R&D Properties
  pKa?: number;
  pKb?: number;
  pI?: number;
  acidValue?: number;
  saponificationValue?: number;
  iodineValue?: number;
  neutralizationEquivalent?: number;
  equivalentWeight?: number;
  cmcMolar?: number;
  cmcPpm?: number;
  krafftPoint?: string;
  cloudPoint?: string;
  surfaceTension?: string;
  wettingPower?: string;
  foamStability?: string;
  detergencyIndex?: number;
  emulsificationPower?: string;
  solubility25C?: string;
  solubility60C?: string;
  bufferCapacity?: string;
  flashPoint?: string;
  autoIgnitionTemp?: string;
  physicalState?: string;
  bulkDensity?: string;
  specificGravity?: string;
  purityPct?: number;
  grade?: string;
  minimumDosage?: string;
  additionStage?: string;
  recommendedMixingTemp?: string;
  processingNotes?: string;
  oxidationStability?: string;
  acidBaseType?: "Strong Acid" | "Weak Acid" | "Strong Base" | "Weak Base" | "Neutral" | "Amphoteric";
  phosphateFree?: boolean;
}

export type UniversalIngredientCategory =
  | "Anionic Surfactants"
  | "Nonionic Surfactants"
  | "Amphoteric Surfactants"
  | "Cationic Surfactants"
  | "Builders"
  | "Chelators"
  | "Acids"
  | "Alkalis"
  | "Enzymes"
  | "Solvents"
  | "Polymers"
  | "Preservatives"
  | "Fragrances"
  | "Colours"
  | "Optical Brighteners"
  | "Fillers"
  | "Processing Aids"
  | "Specialty Additives"
  | (string & {});

export interface UniversalIngredient extends Chemical {
  id: string;
  name: string;
  category: UniversalIngredientCategory;
  subCategory: string;
  function: string;
  synonyms: string[];
  keywords: string[];
  activeMatter: string | number;
  density: string | number;
  defaultUnit: string;
  aliases: string[];
  searchTerms: string[];
  costPerKg?: number;
}

export interface FormulationIngredient {
  name: string;
  percentage: number;
  role: string;
  costPerKg: number;
  activeMatterPct: number;
  hlbValue?: number | null;
  biodegradabilityPct?: number;
  plantBasedPct?: number;
}

export interface FormulationStep {
  order: number;
  action: string;
  mixingTime: string;
  mixingSpeed: string;
  temperature: string;
  safetyNote?: string;
}

export interface Formulation {
  id: string;
  name: string;
  productType: string;
  grade: "Economy" | "Standard" | "Premium";
  targetCost: number; // currency units per kg (e.g., INR or USD, say /kg)
  actualCost: number;
  activeMatter: number; // total active matter %
  biodegradability?: number; // total product biodegradability %
  plantBasedPct?: number; // total product plant-based %
  properties: {
    pH: string;
    viscosity: string;
    foamHeight: string;
    cleaningRating: number; // 1-100
    ecoRating: number;      // 1-100
    compatibilityScore: number; // 1-100
  };
  ingredients: FormulationIngredient[];
  manufacturingMethod: FormulationStep[];
  commonMistakes: string[];
  troubleshootingNotes: string[];
  packagingCompatibility: string;
}

export interface ActiveFormulaState {
  name: string;
  ingredients: FormulationIngredient[];
  batchSize?: number;
  productType?: string;
  grade?: "Economy" | "Standard" | "Premium";
  targetCost?: number;
  activeMatter?: number;
  isDraft?: boolean;
  status?: "Draft" | "Saved";
  properties?: {
    pH?: string;
    viscosity?: string;
    density?: string;
    [key: string]: any;
  };
}

export interface CompatibilityPair {
  chemicalA: string;
  chemicalB: string;
  status: "Compatible" | "Partially Compatible" | "Incompatible";
  reason: string;
  recommendedMixingMethod: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockLevel: number; // in kg
  unit: string;
  unitCost: number; // per kg
  supplier: string;
  minAlertLevel: number;
}

export interface ProductionRecord {
  id: string;
  formulaName: string;
  date: string;
  batchSize: number; // in kg
  totalCost: number;
  status: "Planned" | "In Progress" | "Completed" | "Failed";
  operator: string;
  notes?: string;
}

export interface QCProcedure {
  parameter: string;
  apparatus: string;
  procedure: string[];
  acceptanceCriteria: string;
  referenceStandard: string;
}

// ============================================
// TYPES & INTERFACES — Detergent pH Engine
// ============================================

export interface IngredientInput {
  id: string;
  name: string;
  rawPercent: number; // e.g. 5.0000 = 5%
}

export interface IngredientDBEntry {
  mw: number;              // Molecular weight (g/mol)
  purity: number;          // Purity as decimal (0.88 = 88%)
  protons: number;         // Replaceable H+ for neutralization
  pKa: number[];           // All pKa values (ordered)
  sodiumCount: number;     // Na atoms per molecule
  potassiumCount: number;  // K atoms per molecule
  strongAnionCount: number;// Strong acid anions per molecule
  isStrongAcid: boolean;
  isStrongBase: boolean;
  forms: AcidForm[];       // Protonation states
  familyId?: string;       // Equilibrium family ID (e.g. 'citrate', 'acetate')
  nativeFormIndex?: number;// Native protonation form index
}

export interface AcidForm {
  index: number;   // 0 = fully protonated, increasing = more deprotonated
  charge: number;  // Ionic charge
  label: string;   // Chemical label
}

export interface BufferPairDef {
  name: string;
  acidIngredient: string;
  acidFormIndex: number;
  baseIngredient: string;
  baseFormIndex: number;
  pKa: number;
  familyId?: string;       // Equilibrium family ID

  // Added fields (optional for backward compatibility)
  bufferRangeLow?: number;
  bufferRangeHigh?: number;
}

export interface ReactionLogEntry {
  step: number;
  description: string;
  reactants: Record<string, number>;
  products: Record<string, number>;
  remainingOH?: number;
  remainingH?: number;
}

export interface PostNeutralState {
  speciesMoles: Record<string, number>; // key: "IngredientName#formIndex"
  excessStrongBase: number; // mol OH- remaining
  excessStrongAcid: number; // mol H+ remaining (from LABSA etc.)
  totalNa: number;
  totalK: number;
  totalStrongAnion: number;
  reactionLog: ReactionLogEntry[];
}

export interface ActiveBuffer {
  name: string;
  pKa: number;
  haMoles: number;      // Acid form moles
  aMoles: number;       // Base form moles
  ratio: number;        // A-/HA
  cTotal: number;       // Total concentration (mol/L)
  beta: number;         // Buffer capacity at final pH
  effectiveRange: [number, number];

  // Added fields (optional for backward compatibility)
  acidIngredient?: string;
  baseIngredient?: string;
  contributionPH?: number;
  isActive?: boolean;
}

export interface PHAdvancedResult {
  finalPH: number;
  totalBufferCapacity: number;
  activeBuffers: ActiveBuffer[];
  neutralizationSummary: string[];
  reactionLog: ReactionLogEntry[];
  enzymeWarning: boolean;
  enzymeWarningMsg: string;
  excessStrongBase: number;
  excessStrongAcid: number;
  speciesMoles: Record<string, number>;

  // Added field (optional for backward compatibility)
  bufferReport?: string[];
}

export interface PHSimpleResult {
  ph: number;
  method: string;
}


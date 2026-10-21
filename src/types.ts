import { ProductCategoryId } from './domain/productTaxonomy';

export type { ProductCategoryId };

export interface IngredientInput {
  id?: string;
  name: string;
  type?: string;
  rawKg?: number;
  rawPercent?: number;
  weightKg?: number;
  activePercent?: number;
  acidValue?: number;
  costPerKg?: number | null;
  category?: string;
  function?: string;
  hlb?: number;
  density?: number;
  pHEffect?: 'acid' | 'base' | 'neutral' | 'buffer';
  pKa?: number;
  purity?: number;
}

export interface FormulationIngredient {
  id?: string;
  name: string;
  category?: string;
  percent?: number;
  percentage?: number;
  percentageInFormula?: number;
  activePercent?: number;
  activeMatterPct?: number;
  activeMatterPurity?: number;
  /** Classification for activeMatterPct; catalog defaults and unverified entries are never treated as assay evidence. */
  activeMatterInputSource?: 'SOURCE_BACKED' | 'CATALOG_DEFAULT' | 'USER_ENTERED' | 'UNKNOWN';
  /** Identifier for a linked lot-specific assay/CoA when activeMatterInputSource is SOURCE_BACKED. */
  activeMatterEvidenceId?: string;
  /** URL or repository-relative source location; presence is gated, content is reviewed separately. */
  activeMatterEvidenceUrl?: string;
  costPerKg?: number | null;
  hlb?: number;
  hlbValue?: number;
  function?: string;
  role?: string;
  casNumber?: string | null;
  canonicalIngredientId?: string;
  identityType?: 'SINGLE_SUBSTANCE' | 'MULTI_COMPONENT_MIXTURE' | 'PROPRIETARY_BLEND' | 'COMMERCIAL_UVCB';
  casStatus?: 'ASSIGNED' | 'NOT_APPLICABLE_MIXTURE' | 'PROPRIETARY' | 'UNKNOWN';
  inciName?: string;
  notes?: string;
  phMin?: number;
  phMax?: number;
  density?: number;
  nonVolatileFraction?: number;
}

export interface ActiveFormulaState {
  id?: string;
  name: string;
  category?: string;
  categoryId?: ProductCategoryId;
  targetPH?: number | null;
  batchSizeKg?: number;
  batchSize?: number;
  productType?: string;
  grade?: string;
  targetCost?: number | null;
  description?: string;
  isDraft?: boolean;
  ingredients: FormulationIngredient[];
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PHAdvancedResult {
  pH: number;
  finalPH?: number;
  status?: string;
  method?: string;
  converged?: boolean;
  iterations?: number;
  residual?: number;
  stepSize?: number;
  bufferCapacity: number;
  totalBufferCapacity?: number;
  ionicStrength: number;
  activityModel?: string;
  modelValidity?: string;
  temperatureC?: number;
  assumptions?: string[];
  warnings?: string[];
  confidence?: number;
  measuredPH?: number | null;
  predictionError?: number | null;
  solverConverged: boolean;
  solverIterations: number;
  excessStrongAcid?: number;
  excessStrongBase?: number;
  activeBuffers?: any;
  enzymeWarning?: boolean;
  enzymeWarningMsg?: string;
  neutralizationSummary?: any;
  details?: Record<string, any>;
}

export interface PHSimpleResult {
  pH: number;
  estimated: boolean;
  method?: string;
  note?: string;
}

export interface ChemicalItem {
  id: string;
  name: string;
  commonName?: string;
  chemicalName?: string;
  tradeNames?: string[];
  category: string;
  subCategory?: string;
  costPerKg?: number | null;
  activeMatter?: number;
  casNumber: string | null;
  identityType?: string;
  casStatus?: string;
  inciName: string;
  function: string;
  description: string;
  phRange: string;
  activeMatterDefault: number;
  costRange?: string;
  hlb?: number;
  sdsUrl?: string;
  safetyRating: string;
  molecularWeight?: number;
  physicalProperties?: {
    density?: number;
    appearance?: string;
    solubility?: string;
    viscosity?: string;
    activeMatter?: number;
    pH?: number;
  };
  sustainability?: {
    biodegradability?: number;
    renewableCarbon?: number;
  };
  suppliers?: string[];
}

export type Chemical = ChemicalItem;
export type Formulation = ActiveFormulaState;
export type UniversalIngredient = ChemicalItem & {
  subCategory?: string;
  activeMatter?: number;
  functionalInfo?: any;
  keywords?: string[];
  sustainability?: any;
};

export interface FormulaItem {
  id: string;
  name: string;
  category: string;
  categoryId?: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  targetPH: number;
  batchSizeKg: number;
  description: string;
  ingredients: FormulationIngredient[];
  instructions: string[];
  notes?: string;
  version?: string;
  status?: string;
}

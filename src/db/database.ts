import Dexie, { Table } from 'dexie';
import { FormulationIngredient } from '../types';

export interface FormulaRecord {
  id: string;
  name: string;
  category: string;
  productType?: string;
  targetPH: number;
  batchSizeKg: number;
  waterHardnessPpm?: number;
  waterHardnessSource?: 'USER_ENTERED' | 'MEASURED' | 'UNKNOWN';
  description?: string;
  ingredients: FormulationIngredient[];
  instructions?: string[];
  notes?: string;
  version?: number;
  isFavorite?: boolean;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  id: string;
  name: string;
  category: string;
  stockKg: number;
  minStockKg: number;
  costPerKg: number | null;
  supplier?: string;
  casNumber?: string;
  activeConcentration?: number;
  notes?: string;
  updatedAt: string;
}

export interface ProductionRunRecord {
  id: string;
  batchNumber: string;
  formulaId?: string;
  formulaName: string;
  batchSizeKg: number;
  date: string;
  operator?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  qcPassed?: boolean;
  density?: number;
  viscosity?: number;
  ph?: number;
  notes?: string;
  createdAt: string;
}

export interface LabNoteRecord {
  id: string;
  title: string;
  text: string;
  date: string;
  tags?: string[];
  formulaId?: string;
  batchNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormulaVersionRecord {
  id: string;
  formulaId: string;
  formulaName: string;
  versionNumber: number;
  timestamp: string;
  ingredients: FormulationIngredient[];
  targetPH: number;
  activeMatter?: number;
  hlb?: number;
  healthScore?: number;
  costPerKg?: number;
  notes?: string;
}

export interface SpecRecord {
  category: string;
  parameters: any;
  labRecords: any[];
  updatedAt: string;
}

export interface UserSettingRecord {
  key: string;
  value: any;
  updatedAt: string;
}

/** Local-only document register. REVIEWED_BY_USER is an attestation, not proof of authenticity or regulatory compliance. */
export type RndDocumentType = 'SDS' | 'COA' | 'TDS' | 'SOP' | 'REGULATION' | 'CLAIM_EVIDENCE' | 'TEST_REPORT' | 'OTHER';
export type RndDocumentReviewStatus = 'UNREVIEWED' | 'REVIEWED_BY_USER' | 'REJECTED';

export interface RndDocumentRecord {
  id: string;
  title: string;
  documentType: RndDocumentType;
  issuer?: string;
  referenceNumber?: string;
  revision?: string;
  jurisdiction?: string;
  ingredientOrFormula?: string;
  sourceUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewStatus: RndDocumentReviewStatus;
  reviewNotes?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  attachment?: Blob;
  createdAt: string;
  updatedAt: string;
}

/**
 * A researched ingredient profile created when an ingredient is not already
 * available in the local ingredient library. Values are only persisted when
 * the research result carries source/provenance information.
 */
export interface ResearchedIngredientRecord {
  id: string;
  queryName: string;
  canonicalName: string;
  grade?: string;
  parameters: Record<string, any>;
  provenance: Record<string, any>;
  sourceIds: string[];
  sourceUrls: string[];
  status: 'SOURCE_BACKED' | 'NEEDS_VERIFICATION' | 'CONFLICTING_EVIDENCE';
  requiresUserApproval: boolean;
  researchedAt: string;
  updatedAt: string;
}

export class DetergentDatabase extends Dexie {
  formulas!: Table<FormulaRecord, string>;
  inventory!: Table<InventoryRecord, string>;
  productionRuns!: Table<ProductionRunRecord, string>;
  labNotes!: Table<LabNoteRecord, string>;
  formulaVersions!: Table<FormulaVersionRecord, string>;
  specRecords!: Table<SpecRecord, string>;
  userSettings!: Table<UserSettingRecord, string>;
  researchedIngredients!: Table<ResearchedIngredientRecord, string>;
  documents!: Table<RndDocumentRecord, string>;

  constructor() {
    super('DetergentFormulaExpertDB');

    this.version(1).stores({
      formulas: 'id, name, category, productType, isFavorite, updatedAt',
      inventory: 'id, name, category, stockKg, updatedAt',
      productionRuns: 'id, batchNumber, formulaId, date, status, createdAt',
      labNotes: 'id, title, date, formulaId, createdAt',
      formulaVersions: 'id, formulaId, versionNumber, timestamp',
      specRecords: 'category, updatedAt',
      userSettings: 'key, updatedAt'
    });

    // v2 adds persistent researched-ingredient profiles without changing
    // existing tables or records.
    this.version(2).stores({
      formulas: 'id, name, category, productType, isFavorite, updatedAt',
      inventory: 'id, name, category, stockKg, updatedAt',
      productionRuns: 'id, batchNumber, formulaId, date, status, createdAt',
      labNotes: 'id, title, date, formulaId, createdAt',
      formulaVersions: 'id, formulaId, versionNumber, timestamp',
      specRecords: 'category, updatedAt',
      userSettings: 'key, updatedAt',
      researchedIngredients: 'id, queryName, canonicalName, grade, status, updatedAt'
    });

    // v3 adds an offline-first document register. Attachments remain in the
    // user's local IndexedDB; they are not uploaded or shared with a server.
    this.version(3).stores({
      formulas: 'id, name, category, productType, isFavorite, updatedAt',
      inventory: 'id, name, category, stockKg, updatedAt',
      productionRuns: 'id, batchNumber, formulaId, date, status, createdAt',
      labNotes: 'id, title, date, formulaId, createdAt',
      formulaVersions: 'id, formulaId, versionNumber, timestamp',
      specRecords: 'category, updatedAt',
      userSettings: 'key, updatedAt',
      researchedIngredients: 'id, queryName, canonicalName, grade, status, updatedAt',
      documents: 'id, title, documentType, reviewStatus, jurisdiction, expiryDate, updatedAt'
    });
  }
}

export const db = new DetergentDatabase();

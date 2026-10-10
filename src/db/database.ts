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

export class DetergentDatabase extends Dexie {
  formulas!: Table<FormulaRecord, string>;
  inventory!: Table<InventoryRecord, string>;
  productionRuns!: Table<ProductionRunRecord, string>;
  labNotes!: Table<LabNoteRecord, string>;
  formulaVersions!: Table<FormulaVersionRecord, string>;
  specRecords!: Table<SpecRecord, string>;
  userSettings!: Table<UserSettingRecord, string>;

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
  }
}

export const db = new DetergentDatabase();

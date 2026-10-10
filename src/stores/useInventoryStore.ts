import { create } from 'zustand';
import { db, InventoryRecord, ProductionRunRecord } from '../db/database';

interface InventoryStore {
  inventory: InventoryRecord[];
  productionRuns: ProductionRunRecord[];
  isLoading: boolean;

  loadInventory: () => Promise<void>;
  loadProductionRuns: () => Promise<void>;
  saveInventoryItem: (item: Partial<InventoryRecord>) => Promise<InventoryRecord>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addProductionRun: (run: Partial<ProductionRunRecord>) => Promise<ProductionRunRecord>;
  deleteProductionRun: (id: string) => Promise<void>;
  deductStockForProduction: (formulaIngredients: any[], batchSizeKg: number) => Promise<{ success: boolean; shortfall?: any }>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  inventory: [],
  productionRuns: [],
  isLoading: false,

  loadInventory: async () => {
    set({ isLoading: true });
    try {
      const items = await db.inventory.orderBy('name').toArray();
      set({ inventory: items, isLoading: false });
    } catch (err) {
      console.error('Failed to load inventory from DB:', err);
      set({ isLoading: false });
    }
  },

  loadProductionRuns: async () => {
    try {
      const runs = await db.productionRuns.orderBy('createdAt').reverse().toArray();
      set({ productionRuns: runs });
    } catch (err) {
      console.error('Failed to load production runs from DB:', err);
    }
  },

  saveInventoryItem: async (itemData) => {
    const now = new Date().toISOString();
    const id = itemData.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const record: InventoryRecord = {
      id,
      name: itemData.name || 'Unnamed Material',
      category: itemData.category || 'Surfactant',
      stockKg: Number(itemData.stockKg) || 0,
      minStockKg: Number(itemData.minStockKg) || 50,
      costPerKg: Number(itemData.costPerKg) || 0,
      supplier: itemData.supplier || '',
      casNumber: itemData.casNumber || '',
      activeConcentration: Number(itemData.activeConcentration) || 100,
      notes: itemData.notes || '',
      updatedAt: now
    };

    await db.inventory.put(record);
    await get().loadInventory();
    return record;
  },

  deleteInventoryItem: async (id: string) => {
    await db.inventory.delete(id);
    await get().loadInventory();
  },

  addProductionRun: async (runData) => {
    const now = new Date().toISOString();
    const id = runData.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const record: ProductionRunRecord = {
      id,
      batchNumber: runData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
      formulaId: runData.formulaId || '',
      formulaName: runData.formulaName || 'Custom Formula',
      batchSizeKg: Number(runData.batchSizeKg) || 100,
      date: runData.date || now.split('T')[0],
      operator: runData.operator || 'Default Operator',
      status: runData.status || 'COMPLETED',
      qcPassed: runData.qcPassed !== false,
      density: runData.density,
      viscosity: runData.viscosity,
      ph: runData.ph,
      notes: runData.notes || '',
      createdAt: now
    };

    await db.productionRuns.put(record);
    await get().loadProductionRuns();
    return record;
  },

  deleteProductionRun: async (id: string) => {
    await db.productionRuns.delete(id);
    await get().loadProductionRuns();
  },

  deductStockForProduction: async (ingredients, batchSizeKg) => {
    const inventory = get().inventory;
    const requiredList = ingredients.map((ing: any) => {
      const pct = Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0);
      const reqKg = (pct / 100) * batchSizeKg;
      return { name: ing.name, reqKg };
    }).filter(i => i.reqKg > 0);

    for (const req of requiredList) {
      const invItem = inventory.find(i => i.name.toLowerCase() === req.name.toLowerCase());
      if (!invItem || invItem.stockKg < req.reqKg) {
        return {
          success: false,
          shortfall: {
            name: req.name,
            requiredKg: req.reqKg,
            availableKg: invItem ? invItem.stockKg : 0
          }
        };
      }
    }

    for (const req of requiredList) {
      const invItem = inventory.find(i => i.name.toLowerCase() === req.name.toLowerCase());
      if (invItem) {
        const newStock = Math.max(0, invItem.stockKg - req.reqKg);
        await db.inventory.update(invItem.id, {
          stockKg: Number(newStock.toFixed(3)),
          updatedAt: new Date().toISOString()
        });
      }
    }

    await get().loadInventory();
    return { success: true };
  }
}));

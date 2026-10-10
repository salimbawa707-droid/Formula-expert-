import { db, FormulaRecord, InventoryRecord, ProductionRunRecord } from './database';

const MIGRATION_KEY = 'detergent_dexie_migration_v1_complete';

export async function runLocalStorageMigration(): Promise<boolean> {
  try {
    const isAlreadyMigrated = localStorage.getItem(MIGRATION_KEY);
    if (isAlreadyMigrated === 'true') {
      return false;
    }

    console.info('Starting seamless migration from localStorage to Dexie IndexedDB...');

    // 1. Migrate Saved Formulas
    const savedFormulasRaw = localStorage.getItem('user_saved_formulas');
    if (savedFormulasRaw) {
      try {
        const parsedFormulas = JSON.parse(savedFormulasRaw);
        if (Array.isArray(parsedFormulas) && parsedFormulas.length > 0) {
          const records: FormulaRecord[] = parsedFormulas.map((f: any, idx: number) => ({
            id: f.id || `f_migrated_${Date.now()}_${idx}`,
            name: f.name || `Saved Formula #${idx + 1}`,
            category: f.category || f.productType || 'UNKNOWN_PRODUCT_CATEGORY',
            productType: f.productType || f.category || 'UNKNOWN_PRODUCT_CATEGORY',
            targetPH: Number(f.targetPH) || 8.5,
            batchSizeKg: Number(f.batchSizeKg) || 100,
            waterHardnessPpm: Number(f.waterHardnessPpm) || 150,
            description: f.description || '',
            ingredients: Array.isArray(f.ingredients) ? f.ingredients : [],
            instructions: Array.isArray(f.instructions) ? f.instructions : [],
            notes: f.notes || '',
            isFavorite: false,
            isSystem: false,
            createdAt: f.createdAt || new Date().toISOString(),
            updatedAt: f.updatedAt || new Date().toISOString()
          }));

          await db.formulas.bulkPut(records);
        }
      } catch (e) {
        console.warn('Error migrating user_saved_formulas:', e);
      }
    }

    // 2. Migrate Inventory
    const inventoryRaw = localStorage.getItem('detergent_inventory_v1');
    if (inventoryRaw) {
      try {
        const parsedInventory = JSON.parse(inventoryRaw);
        if (Array.isArray(parsedInventory) && parsedInventory.length > 0) {
          const records: InventoryRecord[] = parsedInventory.map((item: any) => ({
            id: item.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: item.name || 'Unnamed Material',
            category: item.category || 'Surfactant',
            stockKg: Number(item.stockKg) || 0,
            minStockKg: Number(item.minStockKg) || 50,
            costPerKg: (item.costPerKg !== undefined && item.costPerKg !== null && !isNaN(Number(item.costPerKg)))
              ? Number(item.costPerKg)
              : null,
            supplier: item.supplier || '',
            casNumber: item.casNumber || '',
            activeConcentration: Number(item.activeConcentration) || 100,
            notes: item.notes || '',
            updatedAt: item.updatedAt || new Date().toISOString()
          }));

          await db.inventory.bulkPut(records);
        }
      } catch (e) {
        console.warn('Error migrating inventory:', e);
      }
    }

    // 3. Migrate Production Runs
    const prodRunsRaw = localStorage.getItem('detergent_prod_runs_v1');
    if (prodRunsRaw) {
      try {
        const parsedRuns = JSON.parse(prodRunsRaw);
        if (Array.isArray(parsedRuns) && parsedRuns.length > 0) {
          const records: ProductionRunRecord[] = parsedRuns.map((r: any) => ({
            id: r.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            batchNumber: r.batchNumber || `BATCH-${Date.now()}`,
            formulaId: r.formulaId || '',
            formulaName: r.formulaName || 'Custom Formula',
            batchSizeKg: Number(r.batchSizeKg) || 100,
            date: r.date || new Date().toISOString().split('T')[0],
            operator: r.operator || 'Default Operator',
            status: r.status || 'COMPLETED',
            qcPassed: r.qcPassed !== false,
            density: r.density,
            viscosity: r.viscosity,
            ph: r.ph,
            notes: r.notes || '',
            createdAt: r.createdAt || new Date().toISOString()
          }));

          await db.productionRuns.bulkPut(records);
        }
      } catch (e) {
        console.warn('Error migrating production runs:', e);
      }
    }

    // 4. Safe clean-up of legacy default lab note seed if present
    try {
      const existingNote = await db.labNotes.get('1');
      if (existingNote && (
        existingNote.title === 'Batch #2026-08A LABSA Neutralization' ||
        existingNote.text.includes('Final pH 8.42') ||
        existingNote.text.includes('Exotherm reached 42°C')
      )) {
        await db.labNotes.delete('1');
        console.info('Legacy default lab note seed (Batch #2026-08A) removed cleanly.');
      }
    } catch (e) {
      console.warn('Error removing legacy default lab note seed:', e);
    }

    // Mark migration complete
    localStorage.setItem(MIGRATION_KEY, 'true');
    return true;
  } catch (err) {
    console.error('Failed to run IndexedDB migration:', err);
    return false;
  }
}

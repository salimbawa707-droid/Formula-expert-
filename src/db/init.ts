import { runLocalStorageMigration } from './migration';
import { useFormulaStore } from '../stores/useFormulaStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useLabNotebookStore } from '../stores/useLabNotebookStore';
import { useSettingsStore } from '../stores/useSettingsStore';

let isInitialized = false;

export async function initializeDatabaseAndStores() {
  if (isInitialized) return;
  try {
    await runLocalStorageMigration();

    await Promise.all([
      useFormulaStore.getState().loadFormulas(),
      useInventoryStore.getState().loadInventory(),
      useInventoryStore.getState().loadProductionRuns(),
      useLabNotebookStore.getState().loadNotes(),
      useSettingsStore.getState().loadSettings()
    ]);

    // Sync dynamic researched ingredients into in-memory array on startup
    try {
      const { db } = await import('./database');
      const { UNIVERSAL_INGREDIENTS } = await import('../data/universalIngredientLibrary');
      const dynamicSetting = await db.userSettings.get('dynamic_ingredients');
      if (dynamicSetting && Array.isArray(dynamicSetting.value)) {
        for (const dyn of dynamicSetting.value) {
          const idx = UNIVERSAL_INGREDIENTS.findIndex(i => i.id === dyn.id);
          if (idx !== -1) {
            UNIVERSAL_INGREDIENTS[idx] = dyn;
          }
        }
      }
    } catch (e) {
      console.error('Failed to apply dynamic researched ingredients on startup:', e);
    }

    isInitialized = true;
    console.info('Database and Zustand stores successfully initialized.');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

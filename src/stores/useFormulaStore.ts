import { create } from 'zustand';
import { db, FormulaRecord } from '../db/database';
import { ActiveFormulaState, FormulationIngredient } from '../types';
import { auth as firebaseAuth, saveUserFormula, deleteUserFormula } from '../services/firebaseClient';

interface FormulaStore {
  activeFormula: ActiveFormulaState | null;
  savedFormulas: FormulaRecord[];
  isLoading: boolean;
  
  loadFormulas: () => Promise<void>;
  setActiveFormula: (formula: ActiveFormulaState | null) => Promise<void>;
  updateActiveIngredients: (ingredients: FormulationIngredient[]) => Promise<void>;
  updateActiveIngredient: (index: number, updated: Partial<FormulationIngredient>) => Promise<void>;
  addActiveIngredient: (ingredient: FormulationIngredient) => Promise<void>;
  removeActiveIngredient: (index: number) => Promise<void>;
  saveFormula: (formula: Partial<FormulaRecord>) => Promise<FormulaRecord>;
  deleteFormula: (id: string) => Promise<void>;
}

export const useFormulaStore = create<FormulaStore>((set, get) => ({
  activeFormula: null,
  savedFormulas: [],
  isLoading: false,

  loadFormulas: async () => {
    set({ isLoading: true });
    try {
      const formulas = await db.formulas.orderBy('updatedAt').reverse().toArray();
      const activeSetting = await db.userSettings.get('active_formula');
      
      set({
        savedFormulas: formulas,
        activeFormula: activeSetting?.value || null,
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to load formulas from DB:', err);
      set({ isLoading: false });
    }
  },

  setActiveFormula: async (formula) => {
    set({ activeFormula: formula });
    try {
      if (formula) {
        await db.userSettings.put({
          key: 'active_formula',
          value: formula,
          updatedAt: new Date().toISOString()
        });
      } else {
        await db.userSettings.delete('active_formula');
      }
    } catch (err) {
      console.error('Failed to persist active formula:', err);
    }
  },

  updateActiveIngredients: async (ingredients) => {
    const current = get().activeFormula;
    if (!current) return;
    const updated = { ...current, ingredients, updatedAt: new Date().toISOString() };
    await get().setActiveFormula(updated);
  },

  updateActiveIngredient: async (index, updatedField) => {
    const current = get().activeFormula;
    if (!current || !current.ingredients) return;
    const newIngredients = [...current.ingredients];
    if (index >= 0 && index < newIngredients.length) {
      newIngredients[index] = { ...newIngredients[index], ...updatedField };
      await get().updateActiveIngredients(newIngredients);
    }
  },

  addActiveIngredient: async (ingredient) => {
    const current = get().activeFormula;
    if (!current) return;
    const ingredients = [...(current.ingredients || []), ingredient];
    await get().updateActiveIngredients(ingredients);
  },

  removeActiveIngredient: async (index) => {
    const current = get().activeFormula;
    if (!current || !current.ingredients) return;
    const ingredients = current.ingredients.filter((_, i) => i !== index);
    await get().updateActiveIngredients(ingredients);
  },

  saveFormula: async (formulaData) => {
    const now = new Date().toISOString();
    const id = formulaData.id || `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const record: FormulaRecord = {
      id,
      name: formulaData.name || 'Custom Formulation',
      category: formulaData.category || 'UNKNOWN_PRODUCT_CATEGORY',
      productType: formulaData.productType || formulaData.category || 'UNKNOWN_PRODUCT_CATEGORY',
      targetPH: formulaData.targetPH ?? 8.5,
      batchSizeKg: formulaData.batchSizeKg ?? 100,
      waterHardnessPpm: formulaData.waterHardnessPpm ?? 150,
      description: formulaData.description || '',
      ingredients: formulaData.ingredients || [],
      instructions: formulaData.instructions || [],
      notes: formulaData.notes || '',
      isFavorite: formulaData.isFavorite ?? false,
      isSystem: false,
      createdAt: formulaData.createdAt || now,
      updatedAt: now
    };

    await db.formulas.put(record);
    
    // Sync to Firestore if authenticated with Firebase
    if (firebaseAuth.currentUser) {
      try {
        await saveUserFormula(firebaseAuth.currentUser.uid, record);
      } catch (err) {
        console.warn('Failed to persist formula to Firestore:', err);
      }
    }

    await get().loadFormulas();
    return record;
  },

  deleteFormula: async (id: string) => {
    await db.formulas.delete(id);

    // Sync deletion to Firestore if authenticated with Firebase
    if (firebaseAuth.currentUser) {
      try {
        await deleteUserFormula(firebaseAuth.currentUser.uid, id);
      } catch (err) {
        console.warn('Failed to delete formula from Firestore:', err);
      }
    }

    await get().loadFormulas();
  }
}));

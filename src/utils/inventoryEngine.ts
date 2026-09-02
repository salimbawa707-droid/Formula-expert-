import { FormulationIngredient, ActiveFormulaState } from '../types';
import { UNIVERSAL_INGREDIENTS } from '../data/universalIngredientLibrary';

export interface InventoryItem {
  id: string;
  ingredientId: string;
  name: string;
  casNumber?: string;
  category: string;
  currentStockKg: number;
  unit: string;
  minimumStockKg: number;
  reorderLevelKg: number;
  costPerKg: number;
  lotNumber?: string;
  supplier?: string;
  lastUpdated?: string;
}

export interface ProductionRequirementItem {
  ingredientId: string;
  name: string;
  percentage: number;
  requiredKg: number;
  availableStockKg: number;
  remainingStockKg: number;
  status: 'sufficient' | 'insufficient' | 'zero_required';
  shortfallKg: number;
  costPerKg: number;
  totalCost: number;
}

export interface ProductionBatchCheckResult {
  canProduce: boolean;
  batchSizeKg: number;
  totalRequiredKg: number;
  totalBatchCost: number;
  requirements: ProductionRequirementItem[];
  insufficientCount: number;
  insufficientItems: string[];
}

export interface ProductionBatchRun {
  id: string;
  formulaId?: string;
  formulaName: string;
  batchSizeKg: number;
  timestamp: string;
  consumedIngredients: {
    name: string;
    consumedKg: number;
    costPerKg: number;
  }[];
  totalCost: number;
  status: 'Completed' | 'Failed';
  operatorNotes?: string;
}

export const INVENTORY_STORAGE_KEY = 'detergent_rd_inventory_v1';
export const PRODUCTION_RUNS_STORAGE_KEY = 'detergent_rd_production_runs_v1';

/**
 * Generates initial baseline laboratory inventory using canonical items from universalIngredientLibrary
 */
export function getInitialDefaultInventory(): InventoryItem[] {
  // Select core detergent raw materials and seed realistic baseline lab stock
  const seedStocks: Record<string, { stock: number; min: number; reorder: number; lot: string }> = {
    'labsa-90': { stock: 500, min: 100, reorder: 200, lot: 'LOT-2026-LABSA-01' },
    'labsa-96': { stock: 350, min: 50, reorder: 100, lot: 'LOT-2026-LABSA-02' },
    'sles-70': { stock: 600, min: 100, reorder: 250, lot: 'LOT-2026-SLES-01' },
    'capb-30': { stock: 250, min: 50, reorder: 100, lot: 'LOT-2026-CAPB-01' },
    'caustic-soda-lye-48': { stock: 300, min: 50, reorder: 100, lot: 'LOT-2026-NAOH-01' },
    'caustic-soda-pearls': { stock: 150, min: 25, reorder: 50, lot: 'LOT-2026-NAOH-02' },
    'sodium-carbonate-dense': { stock: 800, min: 150, reorder: 300, lot: 'LOT-2026-SODA-01' },
    'sodium-sulfate-anhydrous': { stock: 1000, min: 200, reorder: 400, lot: 'LOT-2026-SULF-01' },
    'sodium-citrate-dihydrate': { stock: 200, min: 40, reorder: 80, lot: 'LOT-2026-CITR-01' },
    'citric-acid-anhydrous': { stock: 180, min: 30, reorder: 60, lot: 'LOT-2026-CIT-02' },
    'glda-47-liquid': { stock: 220, min: 40, reorder: 80, lot: 'LOT-2026-GLDA-01' },
    'lae-9': { stock: 300, min: 50, reorder: 100, lot: 'LOT-2026-LAE9-01' },
    'lae-7': { stock: 250, min: 50, reorder: 100, lot: 'LOT-2026-LAE7-01' },
    'protease-liquid': { stock: 45, min: 10, reorder: 20, lot: 'LOT-2026-ENZ-01' },
    'amylase-liquid': { stock: 35, min: 10, reorder: 15, lot: 'LOT-2026-ENZ-02' },
    'cellulase-liquid': { stock: 30, min: 10, reorder: 15, lot: 'LOT-2026-ENZ-03' },
    'sodium-chloride-vacuum': { stock: 500, min: 100, reorder: 200, lot: 'LOT-2026-NACL-01' },
    'edta-na4-powder': { stock: 120, min: 20, reorder: 40, lot: 'LOT-2026-EDTA-01' },
    'triethanolamine-99': { stock: 140, min: 25, reorder: 50, lot: 'LOT-2026-TEA-01' },
    'c12-c14-alkyl-polyglycoside-50': { stock: 180, min: 30, reorder: 60, lot: 'LOT-2026-APG-01' },
    'fragrance-lavender-fresh': { stock: 25, min: 5, reorder: 10, lot: 'LOT-2026-FRAG-01' },
    'benzisothiazolinone-20': { stock: 20, min: 5, reorder: 10, lot: 'LOT-2026-BIT-01' },
  };

  return UNIVERSAL_INGREDIENTS.map((item, idx) => {
    const seed = seedStocks[item.id] || {
      stock: 100,
      min: 20,
      reorder: 50,
      lot: `LOT-2026-${String(idx + 1).padStart(3, '0')}`
    };

    return {
      id: `inv-${item.id}`,
      ingredientId: item.id,
      name: item.name,
      casNumber: item.casNumber,
      category: item.category,
      currentStockKg: seed.stock,
      unit: 'kg',
      minimumStockKg: seed.min,
      reorderLevelKg: seed.reorder,
      costPerKg: typeof item.costPerKg === 'number' && item.costPerKg > 0 ? item.costPerKg : 2.50,
      lotNumber: seed.lot,
      supplier: (item as any).suppliers?.[0] || 'Standard Lab Supply',
      lastUpdated: new Date().toISOString()
    };
  });
}

/**
 * Safely parse persisted inventory array with defensive zero-safe handling
 */
export function parseStoredInventory(jsonString: string | null): InventoryItem[] {
  if (!jsonString) return getInitialDefaultInventory();
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getInitialDefaultInventory();
    }
    return parsed.map((item: any, idx: number): InventoryItem => {
      const stock = typeof item.currentStockKg === 'number' && !isNaN(item.currentStockKg)
        ? Math.max(0, item.currentStockKg)
        : 0;
      const minStock = typeof item.minimumStockKg === 'number' && !isNaN(item.minimumStockKg)
        ? Math.max(0, item.minimumStockKg)
        : 20;
      const reorder = typeof item.reorderLevelKg === 'number' && !isNaN(item.reorderLevelKg)
        ? Math.max(0, item.reorderLevelKg)
        : 50;
      const cost = typeof item.costPerKg === 'number' && !isNaN(item.costPerKg) && item.costPerKg >= 0
        ? item.costPerKg
        : 2.50;

      return {
        id: String(item.id || `inv-item-${idx}`),
        ingredientId: String(item.ingredientId || item.id || `item-${idx}`),
        name: String(item.name || 'Unknown Chemical'),
        casNumber: item.casNumber ? String(item.casNumber) : undefined,
        category: String(item.category || 'General'),
        currentStockKg: stock,
        unit: 'kg',
        minimumStockKg: minStock,
        reorderLevelKg: reorder,
        costPerKg: cost,
        lotNumber: item.lotNumber ? String(item.lotNumber) : `LOT-${idx + 1}`,
        supplier: item.supplier ? String(item.supplier) : 'Standard Chemical Supply',
        lastUpdated: item.lastUpdated || new Date().toISOString()
      };
    });
  } catch (e) {
    return getInitialDefaultInventory();
  }
}

/**
 * Compute stock status rating
 */
export function getStockStatus(item: { currentStockKg: number; reorderLevelKg: number; minimumStockKg: number }): 'OUT OF STOCK' | 'LOW STOCK' | 'IN STOCK' {
  if (item.currentStockKg <= 0) return 'OUT OF STOCK';
  if (item.currentStockKg <= item.reorderLevelKg) return 'LOW STOCK';
  return 'IN STOCK';
}

/**
 * Adjust stock safely by adding or deducting a specified quantity.
 * Prevents negative stock.
 */
export function adjustStockQuantity(
  inventory: InventoryItem[],
  targetId: string,
  deltaKg: number,
  lotNumber?: string
): InventoryItem[] {
  return inventory.map(item => {
    if (item.id === targetId || item.ingredientId === targetId || item.name.toLowerCase() === targetId.toLowerCase()) {
      const newStock = Math.max(0, Number((item.currentStockKg + deltaKg).toFixed(3)));
      return {
        ...item,
        currentStockKg: newStock,
        lotNumber: lotNumber || item.lotNumber,
        lastUpdated: new Date().toISOString()
      };
    }
    return item;
  });
}

/**
 * Finds matching inventory item for a formula ingredient using ID or canonical name matching
 */
export function findMatchingInventoryItem(
  ingredient: FormulationIngredient,
  inventory: InventoryItem[]
): InventoryItem | undefined {
  if (!ingredient) return undefined;
  
  // 1. Direct ID match
  if (ingredient.id) {
    const matchById = inventory.find(inv => inv.ingredientId === ingredient.id || inv.id === ingredient.id);
    if (matchById) return matchById;
  }

  // 2. Direct Name match
  const rawName = (ingredient.name || '').trim().toLowerCase();
  if (!rawName) return undefined;

  const exactNameMatch = inventory.find(inv => inv.name.trim().toLowerCase() === rawName);
  if (exactNameMatch) return exactNameMatch;

  // 3. Normalized / Substring match (e.g. "LABSA", "SLES 70%", "Caustic Soda")
  const partialMatch = inventory.find(inv => {
    const invName = inv.name.toLowerCase();
    return invName.includes(rawName) || rawName.includes(invName);
  });
  if (partialMatch) return partialMatch;

  // 4. CAS match if available
  if (ingredient.casNumber) {
    const casMatch = inventory.find(inv => inv.casNumber === ingredient.casNumber);
    if (casMatch) return casMatch;
  }

  return undefined;
}

/**
 * Calculates raw material requirements for a specific batch run against current inventory
 */
export function checkProductionBatchAvailability(
  formula: ActiveFormulaState | null | undefined,
  batchSizeOverrideKg: number | undefined,
  inventory: InventoryItem[]
): ProductionBatchCheckResult {
  if (!formula || !Array.isArray(formula.ingredients) || formula.ingredients.length === 0) {
    return {
      canProduce: false,
      batchSizeKg: 0,
      totalRequiredKg: 0,
      totalBatchCost: 0,
      requirements: [],
      insufficientCount: 0,
      insufficientItems: []
    };
  }

  const batchSizeKg = typeof batchSizeOverrideKg === 'number' && batchSizeOverrideKg > 0
    ? batchSizeOverrideKg
    : typeof formula.batchSizeKg === 'number' && formula.batchSizeKg > 0
      ? formula.batchSizeKg
      : typeof formula.batchSize === 'number' && formula.batchSize > 0
        ? formula.batchSize
        : 100;

  let totalRequiredKg = 0;
  let totalBatchCost = 0;
  const insufficientItems: string[] = [];

  const requirements: ProductionRequirementItem[] = formula.ingredients.map(ing => {
    // Zero-safe percentage normalization
    const rawPct = ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;
    const percentage = typeof rawPct === 'number' && !isNaN(rawPct) && rawPct >= 0 ? rawPct : 0;
    
    // Ignore water from physical stock deduction if flagged or standard aqua
    const isWater = (ing.name || '').toLowerCase().includes('water') ||
                    (ing.name || '').toLowerCase().includes('aqua') ||
                    (ing.category || '').toLowerCase().includes('solvent') && (ing.name || '').toLowerCase().includes('deionized');

    const requiredKg = Number(((batchSizeKg * percentage) / 100).toFixed(3));
    totalRequiredKg += requiredKg;

    const matchedInventory = findMatchingInventoryItem(ing, inventory);
    const availableStockKg = isWater ? 999999 : (matchedInventory?.currentStockKg ?? 0);
    const costPerKg = typeof ing.costPerKg === 'number' && ing.costPerKg >= 0
      ? ing.costPerKg
      : (matchedInventory?.costPerKg ?? 2.00);

    const lineCost = Number((requiredKg * costPerKg).toFixed(2));
    totalBatchCost += lineCost;

    if (percentage === 0 || requiredKg === 0) {
      return {
        ingredientId: matchedInventory?.ingredientId || ing.id || 'zero-ing',
        name: ing.name || 'Unknown',
        percentage: 0,
        requiredKg: 0,
        availableStockKg,
        remainingStockKg: availableStockKg,
        status: 'zero_required',
        shortfallKg: 0,
        costPerKg,
        totalCost: 0
      };
    }

    const isSufficient = availableStockKg >= requiredKg;
    const remainingStockKg = isSufficient
      ? Number((availableStockKg - requiredKg).toFixed(3))
      : availableStockKg;
    const shortfallKg = isSufficient ? 0 : Number((requiredKg - availableStockKg).toFixed(3));

    if (!isSufficient && !isWater) {
      insufficientItems.push(ing.name);
    }

    return {
      ingredientId: matchedInventory?.ingredientId || ing.id || ing.name,
      name: ing.name || 'Unknown',
      percentage,
      requiredKg,
      availableStockKg,
      remainingStockKg,
      status: isSufficient ? 'sufficient' : 'insufficient',
      shortfallKg,
      costPerKg,
      totalCost: lineCost
    };
  });

  const canProduce = insufficientItems.length === 0;

  return {
    canProduce,
    batchSizeKg,
    totalRequiredKg: Number(totalRequiredKg.toFixed(3)),
    totalBatchCost: Number(totalBatchCost.toFixed(2)),
    requirements,
    insufficientCount: insufficientItems.length,
    insufficientItems
  };
}

/**
 * Execute atomic inventory deduction for a production batch.
 * If ANY ingredient is insufficient, the transaction fails completely and returns unmodified inventory.
 */
export function executeAtomicBatchDeduction(
  formula: ActiveFormulaState,
  batchSizeKg: number,
  currentInventory: InventoryItem[],
  operatorNotes?: string
): {
  success: boolean;
  updatedInventory: InventoryItem[];
  batchRun?: ProductionBatchRun;
  errorMessage?: string;
} {
  const check = checkProductionBatchAvailability(formula, batchSizeKg, currentInventory);
  
  if (!check.canProduce) {
    return {
      success: false,
      updatedInventory: currentInventory,
      errorMessage: `Production blocked: Insufficient stock for ${check.insufficientItems.join(', ')}.`
    };
  }

  // Create mutable working copy
  let updatedInventory = JSON.parse(JSON.stringify(currentInventory)) as InventoryItem[];
  const consumedIngredients: { name: string; consumedKg: number; costPerKg: number }[] = [];

  for (const req of check.requirements) {
    if (req.requiredKg <= 0 || req.status === 'zero_required') continue;
    
    // Skip water infinite reservoir
    const isWater = req.name.toLowerCase().includes('water') || req.name.toLowerCase().includes('aqua');
    if (isWater) {
      consumedIngredients.push({
        name: req.name,
        consumedKg: req.requiredKg,
        costPerKg: 0
      });
      continue;
    }

    const itemIdx = updatedInventory.findIndex(inv => 
      inv.ingredientId === req.ingredientId || 
      inv.name.toLowerCase() === req.name.toLowerCase() ||
      (inv.id && inv.id === req.ingredientId)
    );

    if (itemIdx !== -1) {
      const currentStock = updatedInventory[itemIdx].currentStockKg;
      const newStock = Math.max(0, Number((currentStock - req.requiredKg).toFixed(3)));
      updatedInventory[itemIdx].currentStockKg = newStock;
      updatedInventory[itemIdx].lastUpdated = new Date().toISOString();

      consumedIngredients.push({
        name: req.name,
        consumedKg: req.requiredKg,
        costPerKg: req.costPerKg
      });
    }
  }

  const batchRun: ProductionBatchRun = {
    id: `BATCH-${Date.now()}`,
    formulaId: formula.id,
    formulaName: formula.name || 'Standard Detergent Batch',
    batchSizeKg,
    timestamp: new Date().toISOString(),
    consumedIngredients,
    totalCost: check.totalBatchCost,
    status: 'Completed',
    operatorNotes: operatorNotes || 'Standard compounding batch executed successfully'
  };

  return {
    success: true,
    updatedInventory,
    batchRun
  };
}

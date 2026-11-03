import { FormulationIngredient, ActiveFormulaState } from '../types';
import { UNIVERSAL_INGREDIENTS } from '../data/universalIngredientLibrary';

export interface InventoryItem {
  id: string;
  ingredientId: string;
  name: string;
  casNumber?: string | null;
  category: string;
  currentStockKg: number;
  unit: string;
  minimumStockKg: number;
  reorderLevelKg: number;
  costPerKg: number | null;
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
  costPerKg: number | null;
  totalCost: number | null;
}

export interface ProductionBatchCheckResult {
  canProduce: boolean;
  batchSizeKg: number;
  totalRequiredKg: number;
  totalBatchCost: number | null;
  costComplete: boolean;
  blockReasons: string[];
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
    costPerKg: number | null;
  }[];
  totalCost: number | null;
  status: 'Completed' | 'Failed';
  operatorNotes?: string;
  manufacturingBatchId?: string;
}

export const INVENTORY_STORAGE_KEY = 'detergent_rd_inventory_v1';
export const PRODUCTION_RUNS_STORAGE_KEY = 'detergent_rd_production_runs_v1';

/**
 * Creates an empty stock ledger from canonical ingredient identities. No physical
 * quantities, lots, suppliers, or purchase prices are inferred from the master library.
 */
export function getInitialDefaultInventory(): InventoryItem[] {
  // Ingredient master data defines identity only. It is not proof of physical stock,
  // lot identity, supplier, or purchase price. New inventory starts at zero/unknown.
  return UNIVERSAL_INGREDIENTS.map(item => ({
    id: `inv-${item.id}`,
    ingredientId: item.id,
    name: item.name,
    casNumber: item.casNumber,
    category: item.category,
    currentStockKg: 0,
    unit: 'kg',
    minimumStockKg: 0,
    reorderLevelKg: 0,
    costPerKg: null,
  }));
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
        : 0;
      const reorder = typeof item.reorderLevelKg === 'number' && !isNaN(item.reorderLevelKg)
        ? Math.max(0, item.reorderLevelKg)
        : 0;
      const cost = typeof item.costPerKg === 'number' && !isNaN(item.costPerKg) && item.costPerKg >= 0
        ? item.costPerKg
        : null;

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
        lotNumber: item.lotNumber ? String(item.lotNumber) : undefined,
        supplier: item.supplier ? String(item.supplier) : undefined,
        lastUpdated: typeof item.lastUpdated === 'string' && Number.isFinite(Date.parse(item.lastUpdated)) ? item.lastUpdated : undefined
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

  // 3. CAS match is a precise identity key; do not use substring matching.
  // Grade-sensitive names such as LABSA 90% and LABSA 96% must never cross-match.
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
      totalBatchCost: null,
      costComplete: false,
      blockReasons: ['A committed formula with ingredients is required.'],
      requirements: [],
      insufficientCount: 0,
      insufficientItems: []
    };
  }

  const batchSizeKg = typeof batchSizeOverrideKg === 'number' && Number.isFinite(batchSizeOverrideKg) && batchSizeOverrideKg > 0
    ? batchSizeOverrideKg
    : typeof formula.batchSizeKg === 'number' && Number.isFinite(formula.batchSizeKg) && formula.batchSizeKg > 0
      ? formula.batchSizeKg
      : typeof formula.batchSize === 'number' && Number.isFinite(formula.batchSize) && formula.batchSize > 0
        ? formula.batchSize
        : 0;

  if (batchSizeKg <= 0) {
    return {
      canProduce: false,
      batchSizeKg: 0,
      totalRequiredKg: 0,
      totalBatchCost: null,
      costComplete: false,
      blockReasons: ['A finite, positive batch size must be specified; no default batch size is assumed.'],
      requirements: [],
      insufficientCount: 0,
      insufficientItems: [],
    };
  }

  let totalRequiredKg = 0;
  let totalBatchCost = 0;
  let costComplete = true;
  const insufficientItems: string[] = [];
  const blockReasons: string[] = [];
  let totalFormulaPercentage = 0;

  const requirements: ProductionRequirementItem[] = formula.ingredients.map((ing, index) => {
    const rawPct = ing.percentage ?? ing.percent ?? ing.percentageInFormula;
    const validPercentage = typeof rawPct === 'number' && Number.isFinite(rawPct) && rawPct >= 0 && rawPct <= 100;
    if (!validPercentage) {
      blockReasons.push(`${ing.name || `Ingredient ${index + 1}`}: percentage is missing or outside the valid 0–100% range.`);
    }
    const percentage = validPercentage ? Number(rawPct) : 0;
    totalFormulaPercentage += percentage;
    
    const requiredKg = Number(((batchSizeKg * percentage) / 100).toFixed(3));
    totalRequiredKg += requiredKg;

    const matchedInventory = findMatchingInventoryItem(ing, inventory);
    const availableStockKg = matchedInventory?.currentStockKg ?? 0;
    const costPerKg = typeof ing.costPerKg === 'number' && ing.costPerKg >= 0
      ? ing.costPerKg
      : (matchedInventory?.costPerKg ?? null);

    const lineCost = costPerKg !== null ? Number((requiredKg * costPerKg).toFixed(2)) : null;
    if (lineCost === null && requiredKg > 0) costComplete = false;
    if (lineCost !== null) totalBatchCost += lineCost;

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

    if (!isSufficient) {
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

  if (Math.abs(totalFormulaPercentage - 100) > 0.05) {
    blockReasons.push(`Formula mass balance is ${totalFormulaPercentage.toFixed(3)}%; exactly 100.00% (±0.05 percentage points) is required.`);
  }
  const canProduce = insufficientItems.length === 0 && blockReasons.length === 0;

  return {
    canProduce,
    batchSizeKg,
    totalRequiredKg: Number(totalRequiredKg.toFixed(3)),
    totalBatchCost: costComplete ? Number(totalBatchCost.toFixed(2)) : null,
    costComplete,
    blockReasons,
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
      errorMessage: check.blockReasons.length > 0
        ? `Production blocked: ${check.blockReasons.join(' ')}`
        : `Production blocked: Insufficient stock for ${check.insufficientItems.join(', ')}.`
    };
  }

  // Create mutable working copy
  let updatedInventory = JSON.parse(JSON.stringify(currentInventory)) as InventoryItem[];
  const consumedIngredients: { name: string; consumedKg: number; costPerKg: number | null }[] = [];

  for (const req of check.requirements) {
    if (req.requiredKg <= 0 || req.status === 'zero_required') continue;
    
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

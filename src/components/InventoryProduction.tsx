import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Factory,
  History,
  DollarSign,
  Boxes,
  Scale
} from 'lucide-react';
import { ActiveFormulaState } from '../types';
import {
  InventoryItem,
  ProductionBatchRun,
  INVENTORY_STORAGE_KEY,
  PRODUCTION_RUNS_STORAGE_KEY,
  parseStoredInventory,
  getInitialDefaultInventory,
  getStockStatus,
  adjustStockQuantity,
  checkProductionBatchAvailability,
  executeAtomicBatchDeduction
} from '../utils/inventoryEngine';

interface InventoryProductionProps {
  lang?: string;
  translations?: any;
  selectedBatchId?: string | null;
  onSelectBatch?: (id: string) => void;
  activeFormula?: ActiveFormulaState | null;
}

export default function InventoryProduction({
  activeFormula,
}: InventoryProductionProps) {
  // 1. Authoritative Inventory State with Defensive LocalStorage Persistence
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
      return parseStoredInventory(stored);
    } catch {
      return getInitialDefaultInventory();
    }
  });

  // 2. Production Runs History
  const [productionRuns, setProductionRuns] = useState<ProductionBatchRun[]>(() => {
    try {
      const stored = localStorage.getItem(PRODUCTION_RUNS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
      console.error('Failed to persist inventory:', e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTION_RUNS_STORAGE_KEY, JSON.stringify(productionRuns));
    } catch (e) {
      console.error('Failed to persist production runs:', e);
    }
  }, [productionRuns]);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'production' | 'ledger' | 'history'>('production');

  // Search & Filter State for Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK'>('ALL');

  // Batch production parameters
  const [batchSizeOverride, setBatchSizeOverride] = useState<number>(() => {
    return activeFormula?.batchSizeKg || activeFormula?.batchSize || 100;
  });

  // Synchronize batchSizeOverride when activeFormula changes
  useEffect(() => {
    if (activeFormula?.batchSizeKg || activeFormula?.batchSize) {
      setBatchSizeOverride(activeFormula.batchSizeKg || activeFormula.batchSize || 100);
    }
  }, [activeFormula?.batchSizeKg, activeFormula?.batchSize]);

  // Modals state
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustLot, setAdjustLot] = useState<string>('');
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove'>('add');

  const [showConfirmBatchModal, setShowConfirmBatchModal] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Fallback demo formula if no active formula is present
  const effectiveFormula: ActiveFormulaState = useMemo(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      return activeFormula;
    }
    return {
      id: 'demo-dishwash-formula',
      name: 'Heavy-Duty Commercial Dishwash (Reference)',
      batchSizeKg: 100,
      grade: 'Standard',
      targetPH: 8.0,
      ingredients: [
        { name: 'LABSA 96% (Acid Slurry)', percentage: 12.0, costPerKg: 0 },
        { name: 'SLES 70% (Sodium Laureth Sulfate)', percentage: 8.0, costPerKg: 0 },
        { name: 'CAPB 30% (Cocoamidopropyl Betaine)', percentage: 3.5, costPerKg: 0 },
        { name: 'Caustic Soda Lye 48%', percentage: 1.6, costPerKg: 0 },
        { name: 'Sodium Carbonate Dense', percentage: 2.0, costPerKg: 0 },
        { name: 'Sodium Chloride (Vacuum Salt)', percentage: 1.5, costPerKg: 0 },
        { name: 'GLDA 47% Liquid', percentage: 0.8, costPerKg: 0 },
        { name: 'Water (Deionized/Softened)', percentage: 70.6, costPerKg: 0 }
      ]
    };
  }, [activeFormula]);

  // Production Availability Calculation
  const batchCheck = useMemo(() => {
    return checkProductionBatchAvailability(effectiveFormula, batchSizeOverride, inventory);
  }, [effectiveFormula, batchSizeOverride, inventory]);

  // Inventory Ledger Calculations
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.casNumber && item.casNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const status = getStockStatus(item);
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchQuery, categoryFilter, statusFilter]);

  // Metric summaries
  const inventoryMetrics = useMemo(() => {
    let totalValue = 0;
    let totalKg = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    inventory.forEach(item => {
      if (typeof item.costPerKg === 'number') {
        totalValue += item.currentStockKg * item.costPerKg;
      }
      totalKg += item.currentStockKg;
      const status = getStockStatus(item);
      if (status === 'OUT OF STOCK') outOfStockCount++;
      else if (status === 'LOW STOCK') lowStockCount++;
      else inStockCount++;
    });

    return {
      totalItems: inventory.length,
      totalKg: Number(totalKg.toFixed(1)),
      totalValue: Number(totalValue.toFixed(2)),
      lowStockCount,
      outOfStockCount,
      inStockCount
    };
  }, [inventory]);

  // Handlers
  const handleOpenAdjustModal = (item: InventoryItem, mode: 'add' | 'remove') => {
    setAdjustModalItem(item);
    setAdjustMode(mode);
    setAdjustAmount(mode === 'add' ? 50 : 10);
    setAdjustLot(item.lotNumber || `LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleApplyAdjustment = () => {
    if (!adjustModalItem) return;
    const delta = adjustMode === 'add' ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
    const updated = adjustStockQuantity(inventory, adjustModalItem.id, delta, adjustLot);
    setInventory(updated);
    setAdjustModalItem(null);
  };

  const handleExecuteProduction = () => {
    const result = executeAtomicBatchDeduction(
      effectiveFormula,
      batchSizeOverride,
      inventory,
      operatorNotes
    );

    if (result.success && result.batchRun) {
      setInventory(result.updatedInventory);
      setProductionRuns(prev => [result.batchRun!, ...prev]);
      setShowConfirmBatchModal(false);
      setOperatorNotes('');
      setBatchSuccessMessage(
        `Batch ${result.batchRun.id} successfully compounded! ${result.batchRun.consumedIngredients.length} raw materials deducted (${batchSizeOverride} kg total batch mass).`
      );
      setTimeout(() => setBatchSuccessMessage(null), 8000);
    } else {
      alert(result.errorMessage || 'Failed to execute production batch.');
    }
  };

  const handleResetToDefaultStock = () => {
    if (window.confirm('Reset all laboratory inventory to standard baseline stock quantities?')) {
      const defaults = getInitialDefaultInventory();
      setInventory(defaults);
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(defaults));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Raw Material Inventory & Production Batching
              </h1>
              <p className="text-sm text-slate-500">
                Dynamic chemical inventory, physical stock ledger, and formula batch allocation
              </p>
            </div>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            id="tab-production-batch"
            onClick={() => setActiveTab('production')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition flex items-center gap-2 ${
              activeTab === 'production'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Factory className="w-4 h-4" /> Production Batching
          </button>
          <button
            id="tab-inventory-ledger"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" /> Chemical Stock Ledger
            {inventoryMetrics.lowStockCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                {inventoryMetrics.lowStockCount}
              </span>
            )}
          </button>
          <button
            id="tab-production-history"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" /> Batch History ({productionRuns.length})
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {batchSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold">Production Execution Complete</p>
            <p>{batchSuccessMessage}</p>
          </div>
          <button
            onClick={() => setBatchSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-emerald-600" /> Tracked Chemicals
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {inventoryMetrics.totalItems}
          </div>
          <div className="text-xs text-slate-400 mt-1">Universal catalog items</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-600" /> Physical Stock Mass
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {inventoryMetrics.totalKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {inventoryMetrics.inStockCount} items in stock
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Inventory Valuation
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ${inventoryMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Standard cost basis</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {inventoryMetrics.lowStockCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Below reorder threshold</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-500" /> Out of Stock
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {inventoryMetrics.outOfStockCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Critical replenishment</div>
        </div>
      </div>

      {/* TAB 1: PRODUCTION BATCHING & ALLOCATION */}
      {activeTab === 'production' && (
        <div className="space-y-6">
          {/* Active Formula Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {activeFormula ? 'ACTIVE COMMITTED FORMULA' : 'REFERENCE FORMULA PREVIEW'}
                  </span>
                  {effectiveFormula.grade && (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                      {effectiveFormula.grade} Grade
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {effectiveFormula.name || 'Standard Detergent Formulation'}
                </h2>
                <p className="text-xs text-slate-500">
                  Target pH: <span className="font-semibold text-slate-700">{effectiveFormula.targetPH || '7.5 - 8.5'}</span> | 
                  Raw Material Ingredients: <span className="font-semibold text-slate-700">{effectiveFormula.ingredients.length}</span>
                </p>
              </div>

              {/* Batch Size Input Control */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label htmlFor="batch-size-input" className="block text-xs font-bold text-slate-700">
                    Production Run Batch Size:
                  </label>
                  <span className="text-[11px] text-slate-500">Target compounding volume</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id="batch-size-input"
                    type="number"
                    min="1"
                    step="1"
                    value={batchSizeOverride}
                    onChange={e => setBatchSizeOverride(Math.max(1, Number(e.target.value) || 1))}
                    className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-900 text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="font-bold text-slate-700 text-sm">kg</span>
                </div>
              </div>
            </div>

            {/* Availability Status Notification */}
            {batchCheck.canProduce ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      All Raw Materials Available in Physical Stock
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Sufficient raw material inventory exists to compound the full {batchSizeOverride} kg production batch.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-confirm-batch"
                  onClick={() => setShowConfirmBatchModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 shrink-0"
                >
                  <Factory className="w-4 h-4" /> Execute Batch & Deduct Stock
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">
                      Production Blocked: Shortfall on {batchCheck.insufficientCount} Raw Material(s)
                    </h4>
                    <p className="text-xs text-rose-700">
                      Cannot compound batch. Insufficient stock for: <span className="font-bold">{batchCheck.insufficientItems.join(', ')}</span>.
                    </p>
                  </div>
                </div>

                <button
                  disabled
                  className="px-5 py-2.5 bg-slate-300 text-slate-500 text-sm font-bold rounded-lg cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                  <XCircle className="w-4 h-4" /> Insufficient Stock
                </button>
              </div>
            )}

            {/* Ingredient Allocation Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Raw Material Ingredient</th>
                    <th className="py-3 px-3 text-right">Formula %</th>
                    <th className="py-3 px-3 text-right">Required (kg)</th>
                    <th className="py-3 px-3 text-right">In Stock (kg)</th>
                    <th className="py-3 px-3 text-right">Remaining (kg)</th>
                    <th className="py-3 px-3 text-right">Cost ($/kg)</th>
                    <th className="py-3 px-3 text-right">Line Total ($)</th>
                    <th className="py-3 px-4 text-center">Batch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batchCheck.requirements.map((req, idx) => {
                    return (
                      <tr
                        key={idx}
                        className={
                          req.status === 'insufficient'
                            ? 'bg-rose-50/70 hover:bg-rose-50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {req.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {req.percentage.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {req.requiredKg.toFixed(2)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {req.availableStockKg >= 99999 ? '∞ (Water)' : `${req.availableStockKg.toFixed(1)} kg`}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {req.availableStockKg >= 99999 ? '∞' : `${req.remainingStockKg.toFixed(1)} kg`}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 text-xs">
                          {req.costPerKg !== null ? `$${req.costPerKg.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          ${req.totalCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'zero_required' ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              0% Inactive
                            </span>
                          ) : req.status === 'sufficient' ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                              <CheckCircle className="w-3 h-3" /> Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                              <XCircle className="w-3 h-3" /> Short by {req.shortfallKg.toFixed(1)} kg
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td className="py-3 px-4 text-slate-800">Total Batch Formulation</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {batchCheck.requirements.reduce((acc, r) => acc + r.percentage, 0).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 text-base">
                      {batchCheck.totalRequiredKg.toFixed(2)} kg
                    </td>
                    <td colSpan={3} className="py-3 px-3 text-right text-xs text-slate-500 uppercase">
                      Total Batch Raw Material Cost:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 text-base">
                      ${batchCheck.totalBatchCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500">
                      (${(batchCheck.totalBatchCost / (batchSizeOverride || 1)).toFixed(2)}/kg)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHEMICAL STOCK LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-inventory-search"
                  type="text"
                  placeholder="Search chemicals by name, CAS, or lot #..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Category selector */}
              <select
                id="select-category-filter"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filters & Reset button */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  All ({inventory.length})
                </button>
                <button
                  onClick={() => setStatusFilter('IN STOCK')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    statusFilter === 'IN STOCK' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  In Stock ({inventoryMetrics.inStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('LOW STOCK')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    statusFilter === 'LOW STOCK' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Low ({inventoryMetrics.lowStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('OUT OF STOCK')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    statusFilter === 'OUT OF STOCK' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Out ({inventoryMetrics.outOfStockCount})
                </button>
              </div>

              <button
                id="btn-reset-inventory"
                onClick={handleResetToDefaultStock}
                title="Reset to baseline laboratory inventory"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Chemical Raw Material</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3">Lot Number</th>
                    <th className="py-3.5 px-3 text-right">In Stock</th>
                    <th className="py-3.5 px-3 text-right">Reorder Point</th>
                    <th className="py-3.5 px-3 text-right">Cost ($/kg)</th>
                    <th className="py-3.5 px-3 text-right">Total Value</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Stock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No raw material chemicals match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                      const status = getStockStatus(item);
                      const totalVal = typeof item.costPerKg === 'number' ? item.currentStockKg * item.costPerKg : null;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.casNumber && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                CAS: {item.casNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-600 font-medium">
                            {item.category}
                          </td>
                          <td className="py-3 px-3 text-xs font-mono text-slate-500">
                            {item.lotNumber || '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {item.currentStockKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-xs text-slate-500">
                            {item.reorderLevelKg} kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {item.costPerKg !== null ? `$${item.costPerKg.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                            {totalVal !== null ? `$${totalVal.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {status === 'IN STOCK' && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                <CheckCircle className="w-3 h-3" /> In Stock
                              </span>
                            )}
                            {status === 'LOW STOCK' && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            )}
                            {status === 'OUT OF STOCK' && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                                <XCircle className="w-3 h-3" /> Out of Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenAdjustModal(item, 'add')}
                                title="Add physical stock to inventory"
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded border border-emerald-200 transition flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                              <button
                                onClick={() => handleOpenAdjustModal(item, 'remove')}
                                title="Adjust / Deduct physical stock"
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded border border-slate-200 transition flex items-center gap-1"
                              >
                                <Minus className="w-3 h-3" /> Deduct
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH PRODUCTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Compounding Production Run Ledger</h3>
                <p className="text-xs text-slate-500">
                  Immutable audit trail of executed batches and consumed chemical quantities
                </p>
              </div>

              {productionRuns.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear production batch history log?')) {
                      setProductionRuns([]);
                      localStorage.removeItem(PRODUCTION_RUNS_STORAGE_KEY);
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition"
                >
                  Clear History
                </button>
              )}
            </div>

            {productionRuns.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium text-slate-600">No production batches executed yet.</p>
                <p className="text-xs text-slate-400">
                  Go to the Production Batching tab and confirm a formula run to generate audit logs.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productionRuns.map(run => (
                  <div
                    key={run.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                          {run.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{run.formulaName}</h4>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {new Date(run.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Batch Mass:</span>
                        <span className="font-bold font-mono text-slate-900">{run.batchSizeKg} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Batch Cost:</span>
                        <span className="font-bold font-mono text-emerald-700">${run.totalCost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Materials Consumed:</span>
                        <span className="font-bold font-mono text-slate-900">{run.consumedIngredients.length} items</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Status:</span>
                        <span className="font-bold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      </div>
                    </div>

                    {/* Consumed breakdown chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {run.consumedIngredients.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-700"
                        >
                          {item.name}: <strong className="text-slate-900">{item.consumedKg.toFixed(2)} kg</strong>
                        </span>
                      ))}
                    </div>

                    {run.operatorNotes && (
                      <div className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        Note: {run.operatorNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {adjustMode === 'add' ? (
                  <Plus className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Minus className="w-5 h-5 text-rose-600" />
                )}
                {adjustMode === 'add' ? 'Receive Chemical Stock' : 'Adjust / Deduct Chemical Stock'}
              </h3>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Chemical Item:</label>
                <div className="font-bold text-slate-900 text-sm">{adjustModalItem.name}</div>
                <div className="text-xs text-slate-500">
                  Current Stock: <strong className="font-mono">{adjustModalItem.currentStockKg} kg</strong>
                </div>
              </div>

              <div>
                <label htmlFor="adjust-amount-input" className="block text-xs font-bold text-slate-700 mb-1">
                  {adjustMode === 'add' ? 'Quantity to Add (kg):' : 'Quantity to Deduct (kg):'}
                </label>
                <input
                  id="adjust-amount-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Math.max(0.1, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="adjust-lot-input" className="block text-xs font-bold text-slate-700 mb-1">
                  Lot / Batch Number:
                </label>
                <input
                  id="adjust-lot-input"
                  type="text"
                  value={adjustLot}
                  onChange={e => setAdjustLot(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">New Resulting Stock:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {adjustMode === 'add'
                      ? (adjustModalItem.currentStockKg + adjustAmount).toFixed(1)
                      : Math.max(0, adjustModalItem.currentStockKg - adjustAmount).toFixed(1)}{' '}
                    kg
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setAdjustModalItem(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-adjust"
                onClick={handleApplyAdjustment}
                className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PRODUCTION BATCH DEDUCTION MODAL */}
      {showConfirmBatchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-600" />
                Confirm Production Compounding Execution
              </h3>
              <button
                onClick={() => setShowConfirmBatchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-600 text-xs">
                You are about to execute a compounding run for{' '}
                <strong className="text-slate-900">{effectiveFormula.name}</strong>. This will atomically
                deduct raw materials from the active laboratory inventory ledger.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Run Size:</span>
                  <span className="font-bold text-slate-900">{batchSizeOverride} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Materials Consumed:</span>
                  <span className="font-bold text-slate-900">
                    {batchCheck.requirements.filter(r => r.requiredKg > 0).length} ingredients
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Batch Material Cost:</span>
                  <span className="font-bold text-emerald-700">${batchCheck.totalBatchCost.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label htmlFor="operator-notes-input" className="block text-xs font-bold text-slate-700 mb-1">
                  Compounding / Operator Notes (Optional):
                </label>
                <textarea
                  id="operator-notes-input"
                  rows={2}
                  value={operatorNotes}
                  onChange={e => setOperatorNotes(e.target.value)}
                  placeholder="e.g., Tank 2, 45 RPM agitation, lot QA passed"
                  className="w-full p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowConfirmBatchModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                id="btn-execute-confirmed-batch"
                onClick={handleExecuteProduction}
                className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Confirm & Deduct Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { UNIVERSAL_INGREDIENTS } from '../data/universalIngredientLibrary';
import { ActiveMatterEngine } from '../utils/activeMatterEngine';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  TestTube, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Play, 
  Info,
  RefreshCw,
  Scale,
  Activity,
  Gauge,
  FlaskConical
} from 'lucide-react';
import { IngredientInput, PHAdvancedResult, PHSimpleResult, ActiveFormulaState } from '../types';
import { INGREDIENT_DATABASE, calculatePHAdvanced, calculatePHSimple } from '../utils/pHEngineAdapter';
import { normalizeProductCategory } from '../domain/productTaxonomy';
import { PHCalculationOptions } from '../domain/ph/types';
import { 
  evaluateDosingEligibility, 
  DEFAULT_ALKALI_REAGENTS, 
  DEFAULT_ACID_REAGENTS 
} from '../utils/phDosingEligibility';

const AVAILABLE_INGREDIENTS = Object.keys(INGREDIENT_DATABASE).sort();

interface PHEngineViewProps {
  activeFormula?: ActiveFormulaState | null;
}

export default function PHEngineView({ activeFormula }: PHEngineViewProps) {
  const findMatchingPHEngineIngredient = useCallback((name: string): string => {
    if (INGREDIENT_DATABASE[name]) return name;
    const lower = (name || "").toLowerCase();
    
    const exactMatch = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase() === lower);
    if (exactMatch) return exactMatch;
    
    if (lower.includes('labsa') || lower.includes('sulfonic')) {
      if (lower.includes('96')) {
        const m96 = AVAILABLE_INGREDIENTS.find(k => k.includes('96%'));
        if (m96) return m96;
      }
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('labsa'));
      if (match) return match;
    }
    if (lower.includes('sles') || lower.includes('laureth sulfate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('sles'));
      if (match) return match;
    }
    if (lower.includes('caustic') || lower.includes('sodium hydroxide') || lower.includes('naoh')) {
      if (lower.includes('50') || (lower.includes('lye') && !lower.includes('100') && !lower.includes('99') && !lower.includes('flake') && !lower.includes('solid'))) {
        const m50 = AVAILABLE_INGREDIENTS.find(k => k.includes('50%'));
        if (m50) return m50;
      }
      if (lower.includes('100') || lower.includes('99') || lower.includes('flake') || lower.includes('solid')) {
        const m100 = AVAILABLE_INGREDIENTS.find(k => k.includes('100%'));
        if (m100) return m100;
      }
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('sodium hydroxide') || (k || "").toLowerCase().includes('caustic') || (k || "").toLowerCase().includes('naoh'));
      if (match) return match;
    }
    if (lower.includes('citric acid')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('citric acid'));
      if (match) return match;
    }
    if (lower.includes('sodium citrate') || lower.includes('citrate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('sodium citrate'));
      if (match) return match;
    }
    if (lower.includes('soda ash') || lower.includes('sodium carbonate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('soda ash') || (k || "").toLowerCase().includes('carbonate'));
      if (match) return match;
    }
    if (lower.includes('bicarbonate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('bicarbonate'));
      if (match) return match;
    }
    if (lower.includes('metasilicate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('metasilicate'));
      if (match) return match;
    }
    if (lower.includes('triethanolamine') || (lower.includes('tea') && !lower.includes('tree'))) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('triethanolamine') || (k || "").toLowerCase().includes('tea'));
      if (match) return match;
    }
    
    const partialMatch = AVAILABLE_INGREDIENTS.find(k => 
      lower.includes((k || "").toLowerCase()) || (k || "").toLowerCase().includes(lower)
    );
    if (partialMatch) return partialMatch;
    
    return name || 'Unknown Ingredient';
  }, []);

  const mapFormulaIngToPHEngine = useCallback((ing: any, idx: number): IngredientInput => {
    const rawName = ing.name || '';
    const mappedName = findMatchingPHEngineIngredient(rawName);
    const resolvedActive = ActiveMatterEngine.resolveIngredientActive(ing);
    
    let activePercent = 100;
    if (ing.activeMatterPct !== undefined && ing.activeMatterPct !== null) {
      activePercent = Number(ing.activeMatterPct);
    } else if (ing.activePercent !== undefined && ing.activePercent !== null) {
      activePercent = Number(ing.activePercent);
    } else if (ing.activeMatterPurity !== undefined && ing.activeMatterPurity !== null) {
      activePercent = Number(ing.activeMatterPurity);
    } else {
      activePercent = resolvedActive.activeMatterPct;
    }

    if (ActiveMatterEngine.isWaterIngredient(rawName, ing.category || '', ing.role || '')) {
      activePercent = 0;
    }

    return {
      id: ing.id || `active-${Date.now()}-${idx}`,
      name: mappedName,
      rawPercent: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
      activePercent,
      category: ing.category || resolvedActive.category,
      function: ing.role || ing.function,
      costPerKg: ing.costPerKg
    };
  }, [findMatchingPHEngineIngredient]);

  const [ingredients, setIngredients] = useState<IngredientInput[]>(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      return activeFormula.ingredients.map(mapFormulaIngToPHEngine);
    }
    return [
      { id: '1', name: 'Sodium Hydroxide (NaOH 100%)', rawPercent: 0.44, activePercent: 100 },
      { id: '2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', rawPercent: 4.0, activePercent: 90 },
    ];
  });
  const [batchSize, setBatchSize] = useState<number>(() => {
    if (activeFormula?.batchSize && activeFormula.batchSize > 0) return activeFormula.batchSize;
    if ((activeFormula as any)?.batchSizeKg && (activeFormula as any).batchSizeKg > 0) return (activeFormula as any).batchSizeKg;
    return 100;
  });
  const [targetPH, _setTargetPH] = useState<number>(7.00);
  const [simpleResult, setSimpleResult] = useState<PHSimpleResult | null>(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      const initialIngs = activeFormula.ingredients.map((ing, idx) => ({
        id: `active-init-${idx}`,
        name: findMatchingPHEngineIngredient(ing.name),
        rawPercent: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity ?? (UNIVERSAL_INGREDIENTS.find(u => u.name.toLowerCase() === ing.name.toLowerCase() || u.id === (ing as any).id)?.activeDefault ?? (ing.name.toLowerCase().includes('water') || ing.name.toLowerCase().includes('aqua') ? 0 : 0)),
      }));
      const bSize = activeFormula.batchSize || (activeFormula as any).batchSizeKg || 0;
      const catRaw = (activeFormula as any)?.canonicalProductCategoryId || (activeFormula as any)?.categoryId || activeFormula?.category || activeFormula?.productType;
      const normCat = catRaw ? normalizeProductCategory(catRaw) : undefined;
      const phOptions: PHCalculationOptions | undefined = (normCat && normCat !== 'UNKNOWN_PRODUCT_CATEGORY') ? { productCategory: normCat } : undefined;
      try {
        return calculatePHSimple(initialIngs, bSize, phOptions);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [advancedResult, setAdvancedResult] = useState<PHAdvancedResult | null>(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      const initialIngs = activeFormula.ingredients.map(mapFormulaIngToPHEngine);
      const bSize = activeFormula.batchSize || (activeFormula as any).batchSizeKg || 0;
      const catRaw = (activeFormula as any)?.canonicalProductCategoryId || (activeFormula as any)?.categoryId || activeFormula?.category || activeFormula?.productType;
      const normCat = catRaw ? normalizeProductCategory(catRaw) : undefined;
      const phOptions: PHCalculationOptions | undefined = (normCat && normCat !== 'UNKNOWN_PRODUCT_CATEGORY') ? { productCategory: normCat } : undefined;
      try {
        return calculatePHAdvanced(initialIngs, bSize, phOptions);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveSync, setLiveSync] = useState<boolean>(true);

  const lastSyncedRef = useRef<string>("");

  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const handleLoadActiveFormula = useCallback(() => {
    let targetFormula = activeFormula;
    if (!targetFormula || !targetFormula.ingredients || targetFormula.ingredients.length === 0) {
      try {
        const saved = localStorage.getItem("aiformulator_formulationResult");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.ingredients && parsed.ingredients.length > 0) {
            targetFormula = parsed;
          }
        }
      } catch (e) {
        console.error("Failed to load formula from localStorage:", e);
      }
    }

    if (!targetFormula || !targetFormula.ingredients || targetFormula.ingredients.length === 0) {
      setErrorMessage("No active formula found in workspace or storage. Please create or save a formula in Formula Expert first.");
      return;
    }

    const bSize = (targetFormula.batchSize && targetFormula.batchSize > 0)
      ? targetFormula.batchSize
      : ((targetFormula as any)?.batchSizeKg && (targetFormula as any).batchSizeKg > 0)
        ? (targetFormula as any).batchSizeKg
        : 100;

    const importedIngredients: IngredientInput[] = targetFormula.ingredients.map(mapFormulaIngToPHEngine);

    setIngredients(importedIngredients);
    setBatchSize(bSize);
    setErrorMessage(null);

    const catRaw = (targetFormula as any)?.canonicalProductCategoryId || (targetFormula as any)?.categoryId || targetFormula?.category || targetFormula?.productType;
    const normCat = catRaw ? normalizeProductCategory(catRaw) : undefined;
    const phOptions: PHCalculationOptions | undefined = (normCat && normCat !== 'UNKNOWN_PRODUCT_CATEGORY') ? { productCategory: normCat } : undefined;

    try {
      const simple = calculatePHSimple(importedIngredients, bSize, phOptions);
      const advanced = calculatePHAdvanced(importedIngredients, bSize, phOptions);
      setSimpleResult(simple);
      setAdvancedResult(advanced);
      setSyncNotification(`Successfully re-synced "${targetFormula.name || 'Active Formula'}" into pH Engine!`);
      setTimeout(() => setSyncNotification(null), 4000);
    } catch (err: any) {
      console.error('pH Engine Error on active formula sync:', err);
      setSimpleResult(null);
      setAdvancedResult(null);
      setErrorMessage('Failed to compute pH for re-synced formula. Check ingredient percentages and purity.');
    }
  }, [activeFormula, mapFormulaIngToPHEngine]);

  const handleManualReSync = useCallback(() => {
    lastSyncedRef.current = "";
    handleLoadActiveFormula();
  }, [handleLoadActiveFormula]);

  // Synchronize PHEngineView with activeFormula automatically when present
  useEffect(() => {
    if (liveSync && activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      const formulaKey = `${activeFormula.id || ''}_${activeFormula.name || ''}_${JSON.stringify(activeFormula.ingredients)}_${activeFormula.batchSize || ''}`;
      if (lastSyncedRef.current !== formulaKey) {
        lastSyncedRef.current = formulaKey;
        handleLoadActiveFormula();
      }
    }
  }, [liveSync, activeFormula, handleLoadActiveFormula]);

  const addIngredient = useCallback(() => {
    const defaultName = AVAILABLE_INGREDIENTS[0] || 'Sodium Hydroxide (NaOH 100%)';
    const defaultActive = ActiveMatterEngine.getDefaultActiveMatter(defaultName);
    setIngredients(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        name: defaultName, 
        rawPercent: 0,
        activePercent: defaultActive > 0 ? defaultActive : 100
      },
    ]);
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateIngredient = useCallback((id: string, field: keyof IngredientInput, value: any) => {
    setIngredients(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        if (field === 'name') {
          const defaultActive = ActiveMatterEngine.getDefaultActiveMatter(value);
          if (defaultActive > 0) {
            updated.activePercent = defaultActive;
          }
        }
        return updated;
      })
    );
  }, []);

  const handleCheckFormula = useCallback(() => {
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      const catRaw = (activeFormula as any)?.canonicalProductCategoryId || (activeFormula as any)?.categoryId || activeFormula?.category || activeFormula?.productType;
      const normCat = catRaw ? normalizeProductCategory(catRaw) : undefined;
      const phOptions: PHCalculationOptions | undefined = (normCat && normCat !== 'UNKNOWN_PRODUCT_CATEGORY') ? { productCategory: normCat } : undefined;

      try {
        const simple = calculatePHSimple(ingredients, batchSize, phOptions);
        const advanced = calculatePHAdvanced(ingredients, batchSize, phOptions);
        setSimpleResult(simple);
        setAdvancedResult(advanced);
      } catch (err: any) {
        console.error('pH Engine Error:', err);
        setErrorMessage(
          'An unexpected error occurred while calculating pH. Please check your formulation and try again.'
        );
        setSimpleResult(null);
        setAdvancedResult(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [ingredients, batchSize]);

  const totalPercent = ingredients.reduce((sum, i) => sum + (i.rawPercent ?? 0), 0);

  // Corrective Reagents Configuration
  const [selectedAlkaliReagent, setSelectedAlkaliReagent] = useState<string>("NaOH Flakes (99% / 100%)");
  const [selectedAcidReagent, setSelectedAcidReagent] = useState<string>("LABSA (90% Acid Slurry)");

  const ALKALI_REAGENTS = DEFAULT_ALKALI_REAGENTS;
  const ACID_REAGENTS = DEFAULT_ACID_REAGENTS;

  // Strict Evaluation State Machine
  const evaluation = evaluateDosingEligibility(
    advancedResult,
    batchSize,
    selectedAlkaliReagent,
    selectedAcidReagent,
    ALKALI_REAGENTS,
    ACID_REAGENTS
  );

  const isAcidExcess = evaluation.status === 'ACID_EXCESS';
  const isAlkaliExcess = evaluation.status === 'ALKALI_EXCESS';
  const isNeutral = evaluation.status === 'NEUTRAL';
  const isUnavailable = evaluation.status === 'UNAVAILABLE';

  const currentpH = evaluation.validatedPH;
  const excessAcid = evaluation.validatedAcidEquivalents ?? 0;
  const excessBase = evaluation.validatedBaseEquivalents ?? 0;
  const activeBaseGramsNeeded = evaluation.activeReagentGramsNeeded ?? 0;
  const commercialAlkaliGrams = evaluation.commercialReagentGrams ?? 0;
  const commercialAlkaliKg = evaluation.commercialReagentKg ?? 0;
  const activeAcidGramsNeeded = evaluation.activeReagentGramsNeeded ?? 0;
  const commercialAcidGrams = evaluation.commercialReagentGrams ?? 0;
  const commercialAcidKg = evaluation.commercialReagentKg ?? 0;

  const isHighSensitivity = evaluation.isCalculationValid && (
    (currentpH !== null && Math.abs(currentpH - targetPH) < 3.5) ||
    excessAcid < 0.05 ||
    excessBase < 0.05
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left" id="ph-engine-root">
      
      {/* 1. Header Hero Banner */}
      <div id="ph-engine-header" className="bg-gradient-to-r from-[#1c1a2e] via-[#1a233a] to-[#122035] rounded-3xl border border-amber-500/40 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <TestTube size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  pH Engine & Equilibrium Solver
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">
                  Newton-Raphson
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Batch Stoichiometry • Acid-Base Equilibrium • Buffer Index (β) • Operator Neutralization SOP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Formula Import Toolbar / Active Workspace Formula Detected */}
      {(() => {
        let displayFormula = activeFormula;
        if (!displayFormula || !displayFormula.ingredients || displayFormula.ingredients.length === 0) {
          try {
            const saved = localStorage.getItem("aiformulator_formulationResult");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.ingredients && parsed.ingredients.length > 0) {
                displayFormula = parsed;
              }
            }
          } catch (e) {}
        }

        return displayFormula && displayFormula.ingredients && displayFormula.ingredients.length > 0 ? (
          <div id="ph-active-formula-detected" className="bg-[#0e1629] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">Active Workspace Formula Detected</div>
                <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                  {displayFormula.name || "Untitled Formula"}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 font-semibold">
                    {displayFormula.ingredients.length} ingredients
                  </span>
                </div>
                {syncNotification && (
                  <div className="text-[11px] font-bold text-emerald-400 mt-1 animate-pulse">
                    {syncNotification}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer bg-[#131d35] hover:bg-[#182442] px-3.5 py-2 rounded-xl border border-slate-700 select-none transition-colors">
                <input
                  type="checkbox"
                  checked={liveSync}
                  onChange={(e) => setLiveSync(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer bg-slate-900 border-slate-700"
                />
                <span>Live Auto-Sync</span>
                {liveSync && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40">
                    ON
                  </span>
                )}
              </label>
              <button
                onClick={handleManualReSync}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-900/40 transition-all cursor-pointer border border-amber-400/40 shrink-0"
              >
                <RefreshCw size={14} />
                Re-Sync ({displayFormula.name || "Active Formula"})
              </button>
            </div>
          </div>
        ) : (
          <div id="ph-no-active-formula" className="bg-[#0e1629] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-slate-500 shrink-0" />
              <span>No active formula loaded in workspace. Select or create a formulation in Formula Expert or Formula Library.</span>
            </div>
            <button
              onClick={handleManualReSync}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Load from Storage
            </button>
          </div>
        );
      })()}

      {/* 3. Formula Form - Batch Ingredients & Stoichiometry */}
      <div id="ph-batch-ingredients-stoichiometry" className="bg-[#0e1629] rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FlaskConical size={18} className="text-amber-400" />
              Batch Ingredients & Stoichiometry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Specify chemical percentages or high-precision batch weights</p>
          </div>
          <div className="flex items-center gap-2 bg-[#131d35] px-3.5 py-2 rounded-xl border border-slate-700/80">
            <label className="text-xs font-extrabold text-slate-300 whitespace-nowrap">Batch Size:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={batchSize}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setBatchSize(isNaN(val) || val <= 0 ? 100 : val);
                }}
                className="w-20 px-2 py-1 border border-slate-600 rounded-lg text-xs font-mono font-bold text-white bg-[#0a0f1d] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="text-xs font-bold text-slate-300">kg</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold whitespace-nowrap">
                ({(batchSize * 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} g)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing) => {
            const purity = (ing.activePercent !== undefined ? ing.activePercent / 100 : (INGREDIENT_DATABASE[ing.name] as any)?.purity ?? 0);
            const activePct = (purity * 100).toFixed(0);
            const rawPctVal = ing.rawPercent ?? 0;
            const ingId = ing.id ?? '';
            const weightKgNum = (rawPctVal * batchSize) / 100;
            const weightKgStr = weightKgNum.toFixed(6);
            const weightGramsStr = (weightKgNum * 1000).toFixed(3);

            return (
              <div key={ingId} className="bg-[#131d35] p-3.5 sm:p-4 rounded-xl border border-slate-700/70 space-y-3 hover:border-amber-500/50 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Chemical Raw Material
                    </label>
                    <select
                      value={ing.name}
                      onChange={e => updateIngredient(ingId, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg text-xs font-bold bg-[#0e1629] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white outline-none cursor-pointer"
                    >
                      {!AVAILABLE_INGREDIENTS.includes(ing.name) && (
                        <option key={ing.name} value={ing.name} className="bg-[#0e1629] text-amber-300">
                          {ing.name} (Neutral / Inert)
                        </option>
                      )}
                      {AVAILABLE_INGREDIENTS.map(name => (
                        <option key={name} value={name} className="bg-[#0e1629] text-white">{name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingId)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition self-end cursor-pointer"
                    title="Remove chemical"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Raw %">
                      Formula %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        max="100"
                        value={rawPctVal}
                        onChange={e => updateIngredient(ingId, 'rawPercent', parseFloat(e.target.value) || 0)}
                        className="w-full pl-3 pr-7 py-1.5 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white bg-[#0e1629] focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Active Purity %">
                      Active Purity %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={ing.activePercent !== undefined ? ing.activePercent : (ActiveMatterEngine.getDefaultActiveMatter(ing.name) || 0)}
                        onChange={e => updateIngredient(ingId, 'activePercent', Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        className="w-full pl-3 pr-7 py-1.5 border border-slate-700 bg-[#0e1629] rounded-lg text-xs font-mono font-bold text-slate-200 text-center focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Batch Weight">
                      Batch Weight
                    </label>
                    <div className="space-y-0.5">
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        value={weightKgStr}
                        onChange={e => {
                          const w = parseFloat(e.target.value) || 0;
                          const newPct = batchSize > 0 ? (w / batchSize) * 100 : 0;
                          updateIngredient(ingId, 'rawPercent', newPct);
                        }}
                        className="w-full px-3 py-1 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white bg-[#0e1629] text-center focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <div className="text-center text-[10px] font-mono font-bold text-amber-400">
                        ({weightGramsStr} g)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white bg-[#131d35] hover:bg-amber-950/60 border border-amber-500/40 px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Add Chemical
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className={`text-xs font-extrabold ${Math.abs(totalPercent - 100) < 0.1 ? 'text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40' : 'text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/40'}`}>
              Total: {totalPercent.toFixed(2)}% {Math.abs(totalPercent - 100) >= 0.1 && '(Water balance implicit)'}
            </span>

            <button
              type="button"
              onClick={handleCheckFormula}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-950/60 transition cursor-pointer disabled:opacity-50 border border-amber-400/40"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
              Calculate pH & Equilibrium
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-semibold">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {simpleResult && advancedResult && (
        <div id="ph-engine-results" className="space-y-6 flex flex-col w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* 4. Simple Result Card - Basic Stoichiometric Summary */}
            <div id="ph-basic-stoichiometric-summary" className="bg-[#0e1629] rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Basic Stoichiometric Summary
                  </h3>
                  <p className="text-[11px] text-slate-400">Molar ratio neutralizer evaluation</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Fast Stoichiometry
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-1">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-400">Evaluation Method:</span>
                  <span className="font-bold text-white">{simpleResult.method ?? "Simple Weighted Average"}</span>
                </div>
                {(simpleResult as any).requiredNaOH100 !== undefined && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Equivalence NaOH (100%):</span>
                    <span className="font-mono font-bold text-amber-300">
                      {((simpleResult as any).requiredNaOH100 ?? 0).toFixed(4)} kg ({(((simpleResult as any).requiredNaOH100 ?? 0) * 1000).toFixed(2)} g)
                    </span>
                  </div>
                )}
                {(simpleResult as any).actualNaOH100 !== undefined && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Actual Formula NaOH:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {((simpleResult as any).actualNaOH100 ?? 0).toFixed(4)} kg ({(((simpleResult as any).actualNaOH100 ?? 0) * 1000).toFixed(2)} g)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Scientific pH Analysis Card - Equilibrium pH Result */}
            <div id="ph-equilibrium-result" className="bg-[#0e1629] rounded-2xl shadow-lg border border-amber-500/40 p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    Equilibrium pH Result
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Debye-Hückel & Newton-Raphson Solver
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {(advancedResult as any).solverUsed ?? "Newton-Raphson"}
                </span>
              </div>

              {/* Large Metric Gauge */}
              <div className="flex items-center justify-between bg-[#131d35] p-4 rounded-xl border border-slate-700">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-0.5">Calculated pH</span>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {currentpH !== null
                      ? currentpH < 6.8 ? 'Acidic Formulation' : currentpH > 8.5 ? 'Alkaline Formulation' : 'Neutral Formulation'
                      : 'pH Unavailable'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Buffer Index (β): {(() => {
                      const beta = advancedResult.totalBufferCapacity ?? (advancedResult as any).bufferCapacity;
                      return beta !== null && beta !== undefined ? beta.toFixed(4) : 'N/A';
                    })()}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-4xl font-black font-mono ${
                    currentpH === null
                      ? 'text-amber-400'
                      : currentpH >= 6.5 && currentpH <= 8.5 
                        ? 'text-emerald-400' 
                        : currentpH < 5.0 || currentpH > 11.0 
                          ? 'text-rose-400' 
                          : 'text-amber-400'
                  }`}>
                    {currentpH !== null ? currentpH.toFixed(2) : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Solver State:</span>
                  <span className={evaluation.isCalculationValid ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {evaluation.isCalculationValid ? "✓ Converged (Residual ≈ 0)" : "Non-Converged / Unavailable"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Net Stoichiometric Acid Excess (eq):</span>
                  <span className="font-mono text-rose-300 font-bold">
                    {evaluation.validatedAcidEquivalents !== null ? `${evaluation.validatedAcidEquivalents.toFixed(6)} eq` : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Net Stoichiometric Base Excess (eq):</span>
                  <span className="font-mono text-purple-300 font-bold">
                    {evaluation.validatedBaseEquivalents !== null ? `${evaluation.validatedBaseEquivalents.toFixed(6)} eq` : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Active Buffer Species:</span>
                  <span className="font-bold text-amber-400">{advancedResult.activeBuffers?.length ?? 0}</span>
                </div>
              </div>

              {advancedResult.enzymeWarning && advancedResult.enzymeWarningMsg && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-medium">
                  {advancedResult.enzymeWarningMsg}
                </div>
              )}
            </div>

          </div>

          {/* 6. HIGH NEUTRALIZATION SENSITIVITY WARNING */}
          {isHighSensitivity && (
            <div id="ph-high-sensitivity-warning" className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-2xl flex items-start gap-3 text-amber-200 shadow-md">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  ⚠ High Neutralization Sensitivity
                </h4>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  Near equivalence (pH 5.0 – 9.0), slight reagent additions produce steep logarithmic pH shifts. Add adjustments incrementally under mechanical agitation, allow temperature to stabilize, and verify with a calibrated benchtop pH meter.
                </p>
              </div>
            </div>
          )}

          {/* 7. SMART NEUTRALIZATION ASSISTANT CARD */}
          <div id="ph-neutralization-assistant" className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Activity size={18} className="text-amber-400" />
                  Neutralization Operator Assistant & Stoichiometric Dosing
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated stoichiometric reagent demand to achieve net charge neutrality (pH 7.00 equivalence)
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#131d35] px-3.5 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xs font-bold text-slate-400">Target pH:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{targetPH.toFixed(2)}</span>
              </div>
            </div>

            {/* Scientific Distinction Banner */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-700/70 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">Scientific Paradigm:</span>
                <span>Thermodynamic Equilibrium (<strong className="text-amber-300">pHEngine</strong>) vs. Theoretical Stoichiometric Dosing Demand</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Batch Size: <strong className="text-white">{batchSize} kg</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Equilibrium pH Analysis */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Equilibrium pH</span>
                <div className="text-2xl font-black text-white font-mono">
                  {currentpH !== null ? currentpH.toFixed(2) : '—'}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {currentpH !== null ? `Delta: ${Math.abs(currentpH - targetPH).toFixed(2)} pH units` : 'Delta: —'}
                </span>
              </div>

              {/* 2. Stoichiometric State */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Stoichiometric State</span>
                <div>
                  {isAcidExcess && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs font-extrabold">
                      Acid Excess
                    </span>
                  )}
                  {isAlkaliExcess && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-500/50 text-xs font-extrabold">
                      Alkali Excess
                    </span>
                  )}
                  {isNeutral && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs font-extrabold">
                      Stoichiometric Equivalence
                    </span>
                  )}
                  {isUnavailable && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs font-extrabold">
                      Diagnostics Unavailable
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {isUnavailable
                    ? (evaluation.unavailabilityReason ?? 'Titration required')
                    : isAcidExcess
                      ? `${excessAcid.toFixed(4)} eq titratable acidity`
                      : isAlkaliExcess
                        ? `${excessBase.toFixed(4)} eq titratable alkalinity`
                        : 'Net Charge Zero'}
                </span>
              </div>

              {/* 3. Pure Active Equivalent Demand */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pure Active Demand (100%)</span>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {isAcidExcess && `${activeBaseGramsNeeded.toFixed(2)} g Pure Base`}
                  {isAlkaliExcess && `${activeAcidGramsNeeded.toFixed(2)} g Pure Acid`}
                  {isNeutral && '0.00 g (Equivalence)'}
                  {isUnavailable && '— (Titration Required)'}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {isAcidExcess
                    ? `Base Eq: ${(excessAcid).toFixed(6)} eq`
                    : isAlkaliExcess
                      ? `Acid Eq: ${(excessBase).toFixed(6)} eq`
                      : isNeutral
                        ? '0.00 eq'
                        : 'Unavailable'}
                </span>
              </div>

              {/* 4. Commercial Reagent Dosing */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Commercial Dosing Mass</span>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {isAcidExcess && `${commercialAlkaliGrams.toFixed(2)} g (${commercialAlkaliKg.toFixed(4)} kg)`}
                  {isAlkaliExcess && `${commercialAcidGrams.toFixed(2)} g (${commercialAcidKg.toFixed(4)} kg)`}
                  {isNeutral && '0.00 g (No Reagents)'}
                  {isUnavailable && '— (Titration Required)'}
                </div>
                <span className="text-[11px] text-slate-400 block truncate">
                  {isAcidExcess
                    ? selectedAlkaliReagent
                    : isAlkaliExcess
                      ? selectedAcidReagent
                      : isNeutral
                        ? 'Standard Met'
                        : 'Titration Required'}
                </span>
              </div>
            </div>

            {/* Reagent Selector & Corrective Instructions */}
            <div className="bg-[#131d35] p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={16} className="text-amber-400" />
                  Select Corrective Reagent Inventory
                </span>
                
                {isAcidExcess && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Alkali Stock:</span>
                    <select
                      value={selectedAlkaliReagent}
                      onChange={(e) => setSelectedAlkaliReagent(e.target.value)}
                      className="bg-[#0e1629] text-amber-300 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      {Object.keys(ALKALI_REAGENTS).map(k => (
                        <option key={k} value={k} className="bg-[#0e1629] text-white">{k}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isAlkaliExcess && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Acid Stock:</span>
                    <select
                      value={selectedAcidReagent}
                      onChange={(e) => setSelectedAcidReagent(e.target.value)}
                      className="bg-[#0e1629] text-amber-300 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      {Object.keys(ACID_REAGENTS).map(k => (
                        <option key={k} value={k} className="bg-[#0e1629] text-white">{k}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isNeutral && (
                  <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/50">
                    ✓ Stoichiometric Equivalence Achieved
                  </span>
                )}

                {isUnavailable && (
                  <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-lg border border-amber-500/50">
                    ⚠ Laboratory Titration Required
                  </span>
                )}
              </div>

              {/* Standard Operating Procedure */}
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
                  Plant Operator Standard Operating Procedure (SOP):
                </span>
                {isAcidExcess && (
                  <div className="space-y-1">
                    <p>
                      1. Weigh exactly <strong className="text-amber-300 font-mono">{commercialAlkaliGrams.toFixed(2)} g</strong> ({commercialAlkaliKg.toFixed(4)} kg) of commercial <strong className="text-white">{selectedAlkaliReagent}</strong> (equivalent to {activeBaseGramsNeeded.toFixed(2)} g 100% active base).
                    </p>
                    <p>
                      2. Add slowly into the mixing tank under continuous mechanical shear agitation.
                    </p>
                    <p>
                      3. Allow 10–15 minutes for complete exothermic neutralization and temperature equilibration.
                    </p>
                    <p>
                      4. Confirm final pH with a calibrated benchtop pH electrode before introducing heat-sensitive actives or viscosity modifiers.
                    </p>
                  </div>
                )}
                {isAlkaliExcess && (
                  <div className="space-y-1">
                    <p>
                      1. Weigh exactly <strong className="text-amber-300 font-mono">{commercialAcidGrams.toFixed(2)} g</strong> ({commercialAcidKg.toFixed(4)} kg) of commercial <strong className="text-white">{selectedAcidReagent}</strong> (equivalent to {activeAcidGramsNeeded.toFixed(2)} g 100% active acid).
                    </p>
                    <p>
                      2. Introduce slowly into the mixing vortex under high-efficiency mechanical agitation.
                    </p>
                    <p>
                      3. Agitate thoroughly to ensure complete acid-base reaction.
                    </p>
                    <p>
                      4. Re-measure batch pH with calibrated benchtop meter.
                    </p>
                  </div>
                )}
                {isNeutral && (
                  <p className="text-emerald-300">
                    Formulation is at stoichiometric equivalence. Batch is ready for secondary additions (preservatives, bio-enzymes, fragrance, optical brighteners, and salt thickening).
                  </p>
                )}
                {isUnavailable && (
                  <div className="p-3 bg-amber-950/50 border border-amber-500/50 rounded-xl text-amber-200 space-y-1">
                    <p className="font-bold text-amber-300">
                      Diagnostics unavailable — automated dosing disabled.
                    </p>
                    <p className="text-xs text-amber-200/90">
                      {evaluation.unavailabilityReason ?? 'Calculated pH or stoichiometric diagnostics are invalid.'} Perform a manual laboratory benchtop titration to determine corrective reagent demand before batch adjustments.
                    </p>
                  </div>
                )}
              </div>

              {/* Safety & Real Matrix Notice */}
              <div className="p-3 bg-[#0b1020] border border-amber-500/20 rounded-lg text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-amber-300">Scientific Matrix Notice: </strong>
                Stoichiometric Neutralization Demand represents theoretical charge balance. Real detergent batches contain builder hydrolysis, complexing agents, micellar ionic activity variations, and buffer systems. Dosing should always be validated incrementally with benchtop pH measurements.
              </div>
            </div>
          </div>

          {/* 8. PRODUCTION WORKFLOW PANEL - Batch Execution Pipeline */}
          <div id="ph-batch-execution-pipeline" className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={16} className="text-amber-400" />
              Batch Execution Pipeline
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Step 1 • Current Status
                </div>
                <div className="text-sm font-extrabold text-white mt-1">
                  {isAcidExcess && `Acidic (pH ${currentpH !== null ? currentpH.toFixed(2) : '—'})`}
                  {isAlkaliExcess && `Alkaline (pH ${currentpH !== null ? currentpH.toFixed(2) : '—'})`}
                  {isNeutral && `Neutral (pH ${currentpH !== null ? currentpH.toFixed(2) : '—'})`}
                  {isUnavailable && 'Calculation Unavailable'}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {isUnavailable
                    ? (evaluation.unavailabilityReason ?? 'Diagnostics unavailable')
                    : isAcidExcess
                      ? `${excessAcid.toFixed(4)} eq titratable acidity excess`
                      : isAlkaliExcess
                        ? `${excessBase.toFixed(4)} eq titratable alkalinity excess`
                        : 'Equilibrium reached'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-amber-500/40 space-y-1">
                <div className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">
                  Step 2 • Action Required
                </div>
                <div className="text-sm font-extrabold text-amber-300 mt-1">
                  {evaluation.actionRequiredText}
                </div>
                <p className="text-xs text-amber-200/80 font-mono mt-1">
                  {evaluation.actionDetailText}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-emerald-500/40 space-y-1">
                <div className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                  Step 3 • Target Endpoint
                </div>
                <div className="text-sm font-extrabold text-emerald-300 mt-1">
                  Target pH ≈ 7.00
                </div>
                <p className="text-xs text-emerald-400/80 mt-1">
                  Equilibrium & Stability Spec
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

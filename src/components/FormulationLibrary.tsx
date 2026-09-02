import { useState, useEffect } from 'react';
import { FORMULAS } from '../data/formulas';
import { Library, Play, FileText, CheckCircle, Scale, Trash2, AlertTriangle, X } from 'lucide-react';
import { FormulaItem, ActiveFormulaState } from '../types';

interface FormulationLibraryProps {
  onLoadFormula?: (formula: ActiveFormulaState) => void;
  onSelectActiveFormula?: (formula: ActiveFormulaState) => void;
  onSelectFormula?: (id: string) => void;
  selectedFormulaId?: string;
  activeFormula?: ActiveFormulaState | null;
  lang?: string;
  translations?: any;
}

// Built-in formula IDs from data/formulas.ts that are strictly protected
const BUILT_IN_FORMULA_IDS = new Set<string>(FORMULAS.map(f => f.id));

// Built-in benchmark IDs hidden from Standard Formula Library UI view
const HIDDEN_BUILT_IN_UI_IDS = new Set<string>(['hd-liquid-laundry', 'manual-dishwash-gel']);

export const isUserSavedFormula = (formula: FormulaItem | { id: string }): boolean => {
  if (!formula || !formula.id) return false;
  return !BUILT_IN_FORMULA_IDS.has(formula.id);
};

const getStoredFormulas = (): FormulaItem[] => {
  let saved: FormulaItem[] = [];
  try {
    const stored = localStorage.getItem("user_saved_formulas");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        saved = parsed
          .filter((item: any) => item && typeof item === 'object' && item.id && isUserSavedFormula(item))
          .map((item: any, idx: number) => ({
            id: item.id || `custom-${idx}`,
            name: item.name || item.formulaName || "Custom Formula",
            category: item.category || "Custom Formulation",
            targetPH: item.targetPH !== undefined ? Number(item.targetPH) : 7.5,
            batchSizeKg: item.batchSizeKg !== undefined ? Number(item.batchSizeKg) : (item.batchSize ? Number(item.batchSize) : 100),
            description: item.description || `Custom ${item.category || 'detergent'} formulation saved by formulator.`,
            ingredients: (item.ingredients || []).map((ing: any, iIdx: number) => ({
              id: ing.id || `ing-${iIdx}`,
              name: ing.name || `Ingredient ${iIdx + 1}`,
              category: ing.category || ing.role || 'Component',
              role: ing.role || ing.category || 'Component',
              percent: Number(ing.percent ?? ing.percentage ?? 0),
              percentage: Number(ing.percentage ?? ing.percent ?? 0),
              activePercent: Number(ing.activePercent ?? ing.activeMatterPct ?? 100),
              activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? 100),
              costPerKg: Number(ing.costPerKg ?? 0),
              function: ing.function || ing.role || ing.category || 'Component'
            })),
            instructions: Array.isArray(item.instructions) && item.instructions.length > 0
              ? item.instructions
              : [
                  'Charge 80% of water and solvent into main mixing vessel and begin medium agitation.',
                  'Slowly add primary and secondary surfactants in sequence until fully dispersed.',
                  'Neutralize slowly while monitoring batch temperature (< 45°C) and target pH.',
                  'Add builders, chelating agents, and viscosity modifiers incrementally.',
                  'Slurry salt if required to reach target viscosity, then add preservatives and fragrance below 35°C.'
                ]
          }));
      }
    }
  } catch (e) {
    console.error("Failed to load user_saved_formulas in FormulationLibrary:", e);
  }
  return [...saved, ...FORMULAS];
};

export default function FormulationLibrary({
  onLoadFormula,
  onSelectActiveFormula,
  onSelectFormula,
  selectedFormulaId,
  activeFormula
}: FormulationLibraryProps) {
  const [allFormulas, setAllFormulas] = useState<FormulaItem[]>(() => getStoredFormulas());
  const [formulaToDelete, setFormulaToDelete] = useState<FormulaItem | null>(null);

  // Filter visible formulas strictly excluding hidden benchmark IDs from UI display
  const visibleFormulas = allFormulas.filter(f => !HIDDEN_BUILT_IN_UI_IDS.has(f.id));
  const userSavedFormulas = visibleFormulas.filter(f => isUserSavedFormula(f));
  const benchmarkFormulas = visibleFormulas.filter(f => !isUserSavedFormula(f));

  const [selectedFormula, setSelectedFormula] = useState<FormulaItem | null>(() => {
    const formulas = getStoredFormulas();
    const visible = formulas.filter(f => !HIDDEN_BUILT_IN_UI_IDS.has(f.id));
    if (selectedFormulaId) {
      const found = visible.find(f => f.id === selectedFormulaId);
      if (found) return found;
    }
    if (activeFormula?.id) {
      const found = visible.find(f => f.id === activeFormula.id || f.name === activeFormula.name);
      if (found) return found;
    }
    return visible[0] || null;
  });

  // Re-sync with localStorage when component mounts or activeFormula updates
  useEffect(() => {
    const refreshed = getStoredFormulas();
    setAllFormulas(refreshed);
    const visible = refreshed.filter(f => !HIDDEN_BUILT_IN_UI_IDS.has(f.id));
    if (selectedFormulaId) {
      const found = visible.find(f => f.id === selectedFormulaId);
      if (found) {
        setSelectedFormula(found);
        return;
      }
    }
    if (activeFormula?.id || activeFormula?.name) {
      const found = visible.find(f => f.id === activeFormula.id || f.name === activeFormula.name);
      if (found) {
        setSelectedFormula(found);
        return;
      }
    }
    setSelectedFormula(prev => (prev && visible.some(f => f.id === prev.id) ? prev : (visible[0] || null)));
  }, [selectedFormulaId, activeFormula]);

  const handleSelectCard = (formula: FormulaItem) => {
    setSelectedFormula(formula);
    if (onSelectFormula) {
      onSelectFormula(formula.id);
    }
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, formula: FormulaItem) => {
    e.stopPropagation();
    // Safety check: ensure formula is not built-in
    if (!isUserSavedFormula(formula)) {
      return;
    }
    setFormulaToDelete(formula);
  };

  const handleCancelDelete = () => {
    setFormulaToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!formulaToDelete) return;
    const targetId = formulaToDelete.id;

    // Safety rule: strictly verify that this is a user-saved formula
    if (!isUserSavedFormula(formulaToDelete)) {
      setFormulaToDelete(null);
      return;
    }

    try {
      const stored = localStorage.getItem("user_saved_formulas");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((item: any) => item && item.id !== targetId);
          localStorage.setItem("user_saved_formulas", JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error("Failed to delete user formula from storage:", e);
    }

    // Refresh state
    const refreshed = getStoredFormulas();
    setAllFormulas(refreshed);
    const visible = refreshed.filter(f => !HIDDEN_BUILT_IN_UI_IDS.has(f.id));

    // If currently selected formula was the deleted one, select another available formula
    if (selectedFormula && selectedFormula.id === targetId) {
      const nextSelection = visible[0] || null;
      setSelectedFormula(nextSelection);
      if (nextSelection && onSelectFormula) {
        onSelectFormula(nextSelection.id);
      }
    }

    setFormulaToDelete(null);
  };

  const handleActivateFormula = () => {
    if (!currentFormula) return;

    const mappedIngredients = (currentFormula.ingredients || []).map((ing: any, idx: number) => {
      const pct = ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;
      const activePct = ing.activeMatterPct ?? ing.activePercent ?? ing.purity ?? ing.activeMatterPurity ?? 100;
      const hlbVal = ing.hlbValue ?? ing.hlb;
      return {
        ...ing,
        id: ing.id || `ing-${idx}`,
        percentage: Number(pct),
        percent: Number(pct),
        activeMatterPct: Number(activePct),
        activePercent: Number(activePct),
        hlbValue: hlbVal !== undefined && hlbVal !== null ? Number(hlbVal) : undefined,
        hlb: hlbVal !== undefined && hlbVal !== null ? Number(hlbVal) : undefined,
        costPerKg: ing.costPerKg !== undefined ? Number(ing.costPerKg) : 0,
        role: ing.role || ing.function || ing.category || 'Component',
      };
    });

    const activeFormulaObj: ActiveFormulaState = {
      id: currentFormula.id,
      name: currentFormula.name,
      category: currentFormula.category,
      productType: currentFormula.category || "Liquid Laundry Detergent",
      targetPH: currentFormula.targetPH,
      batchSizeKg: currentFormula.batchSizeKg ?? 100,
      batchSize: currentFormula.batchSizeKg ?? 100,
      description: currentFormula.description,
      grade: "Standard",
      ingredients: mappedIngredients,
    };

    if (onSelectActiveFormula) {
      onSelectActiveFormula(activeFormulaObj);
    }
    if (onLoadFormula) {
      onLoadFormula(activeFormulaObj);
    }
  };

  const isCurrentActive = (formula: FormulaItem) => {
    if (!activeFormula) return false;
    return (
      (activeFormula.id && activeFormula.id === formula.id) ||
      (activeFormula.name && activeFormula.name === formula.name)
    );
  };

  const currentFormula = selectedFormula || visibleFormulas[0] || null;
  const instructionsList = (currentFormula?.instructions && currentFormula.instructions.length > 0)
    ? currentFormula.instructions
    : [
        'Charge 80% of water and solvent into main mixing vessel and begin medium agitation.',
        'Slowly add primary and secondary surfactants in sequence until fully dispersed.',
        'Neutralize slowly while monitoring batch temperature (< 45°C) and target pH.',
        'Add builders, chelating agents, and viscosity modifiers incrementally.',
        'Slurry salt if required to reach target viscosity, then add preservatives and fragrance below 35°C.'
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="formulation-library-root">
      <div className="flex justify-between items-center bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
              <Library className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Standard Formula Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {userSavedFormulas.length > 0
              ? `${userSavedFormulas.length} custom saved formulation${userSavedFormulas.length === 1 ? '' : 's'} available`
              : 'Save formulations from Formula Expert to manage your custom catalog'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          {/* User-Saved Formulations Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                User-Saved Formulations
              </h2>
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                {userSavedFormulas.length} saved
              </span>
            </div>

            {userSavedFormulas.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-[#0a0f1d] text-center space-y-1.5">
                <Library className="w-7 h-7 text-slate-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-300">No custom formulations saved yet.</p>
                <p className="text-[11px] text-slate-500">Tap "Save Formula" in Formula Expert to save custom recipes here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userSavedFormulas.map(formula => {
                  const isActive = isCurrentActive(formula);
                  const isSelected = currentFormula?.id === formula.id;
                  return (
                    <div
                      key={formula.id}
                      onClick={() => handleSelectCard(formula)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition relative group ${
                        isSelected
                          ? 'border-amber-500 bg-amber-950/20 shadow-lg ring-1 ring-amber-500/40'
                          : 'border-slate-800 bg-[#0e1629] hover:border-slate-700 hover:bg-[#131d35] shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          {formula.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isActive && (
                            <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" /> ACTIVE
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteConfirm(e, formula)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500/20 cursor-pointer"
                            title="Delete saved formula"
                            aria-label={`Delete ${formula.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <h3 className="font-extrabold text-white text-sm">{formula.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{formula.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Verified Benchmark Recipes Section - Only rendered if benchmark recipes exist */}
          {benchmarkFormulas.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-purple-300/90 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  Verified Benchmark Recipes
                </h2>
                <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {benchmarkFormulas.length} verified
                </span>
              </div>

              <div className="space-y-2">
                {benchmarkFormulas.map(formula => {
                  const isActive = isCurrentActive(formula);
                  const isSelected = currentFormula?.id === formula.id;
                  return (
                    <div
                      key={formula.id}
                      onClick={() => handleSelectCard(formula)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition relative group ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/30 shadow-lg ring-1 ring-purple-500/40'
                          : 'border-slate-800 bg-[#0e1629] hover:border-slate-700 hover:bg-[#131d35] shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          {formula.category}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <h3 className="font-extrabold text-white text-sm">{formula.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{formula.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {currentFormula ? (
          <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-full">
                    {currentFormula.category}
                  </span>
                  {isCurrentActive(currentFormula) && (
                    <span className="text-xs font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> ACTIVE FORMULA
                    </span>
                  )}
                  {isUserSavedFormula(currentFormula) ? (
                    <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full">
                      USER SAVED
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-sky-300 bg-sky-950/60 border border-sky-500/40 px-2.5 py-1 rounded-full">
                      VERIFIED BENCHMARK
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-2.5">{currentFormula.name}</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentFormula.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isUserSavedFormula(currentFormula) && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenDeleteConfirm(e, currentFormula)}
                    className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Delete this saved formula"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" /> Delete
                  </button>
                )}
                {(onSelectActiveFormula || onLoadFormula) && (
                  <button
                    onClick={handleActivateFormula}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/30 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" /> Load in Formula Expert
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" /> Batch Ingredients ({currentFormula.batchSizeKg} kg batch)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b1020]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#131d35] text-slate-300 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Ingredient</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5 text-right">Percent</th>
                      <th className="py-2.5 px-3.5 text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentFormula.ingredients.map((ing, idx) => (
                      <tr key={ing.id || idx} className="hover:bg-[#131d35]/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-white">{ing.name}</td>
                        <td className="py-2.5 px-3.5 text-slate-400 text-xs font-medium">{ing.category}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-200">{ing.percent ?? ing.percentage ?? 0}%</td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-purple-300 font-extrabold">
                          {((((ing.percent ?? ing.percentage ?? 0)) / 100) * (currentFormula.batchSizeKg || 100)).toFixed(2)} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" /> Manufacturing Procedure (SOP)
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#131d35] p-4 rounded-xl border border-slate-700">
                {instructionsList.map((step, idx) => (
                  <li key={idx} className="pl-1">{step}</li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-8 sm:p-12 shadow-xl text-center flex flex-col items-center justify-center min-h-[360px] space-y-3">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
              <Library className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-extrabold text-white">No Formula Selected</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Create and save your custom detergent formulations in Formula Expert to inspect specifications, batch weights, and manufacturing procedures here.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {formulaToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-[#0e1629] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="delete-dialog-title" className="text-base sm:text-lg font-extrabold text-white">
                    Delete saved formula?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action is permanent and cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-1.5 text-xs text-slate-300">
              <p>Are you sure you want to permanently delete this user-created formula?</p>
              <div className="font-extrabold text-white text-sm bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
                "{formulaToDelete.name}"
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Category: <span className="text-purple-300 font-semibold">{formulaToDelete.category}</span> &bull; {formulaToDelete.ingredients?.length || 0} ingredients
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Formula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

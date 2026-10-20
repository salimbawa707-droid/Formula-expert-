import { useState, useEffect, useMemo } from 'react';
import { FORMULAS } from '../data/formulas';
import { Library, Play, FileText, Scale, Search, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import { FormulaItem, ActiveFormulaState } from '../types';
import { PRODUCT_CATEGORIES, normalizeProductCategory } from './aiformulator/constants';
import { useFormulaStore } from '../stores/useFormulaStore';
import { revalidateFormulaTemplate } from '../utils/templateRevalidationEngine';
import { evaluateScientificQualityGate } from '../utils/calculators';
import { FormulaScientificOrchestrator } from '../utils/orchestrator/formulaScientificOrchestrator';

interface FormulationLibraryProps {
  onLoadFormula?: (formula: ActiveFormulaState) => void;
  onSelectActiveFormula?: (formula: ActiveFormulaState) => void;
  onSelectFormula?: (id: string) => void;
  selectedFormulaId?: string;
  activeFormula?: ActiveFormulaState | null;
  lang?: string;
  translations?: any;
}

const BUILT_IN_FORMULA_IDS = new Set<string>(FORMULAS.map(f => f.id));

export const isUserSavedFormula = (formula: FormulaItem | { id: string }): boolean => {
  if (!formula || !formula.id) return false;
  return !BUILT_IN_FORMULA_IDS.has(formula.id);
};

export default function FormulationLibrary({
  onLoadFormula,
  onSelectActiveFormula,
  onSelectFormula,
  selectedFormulaId,
}: FormulationLibraryProps) {
  const { savedFormulas, setActiveFormula } = useFormulaStore();
  const [selectedFormula, setSelectedFormula] = useState<FormulaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Combined formulas: saved user formulas from Zustand store + built-in FORMULAS
  const combinedFormulas = useMemo(() => {
    const userRecords: FormulaItem[] = savedFormulas.map(sf => ({
      id: sf.id,
      name: sf.name,
      category: sf.category,
      targetPH: sf.targetPH,
      batchSizeKg: sf.batchSizeKg,
      description: sf.description || `User saved ${sf.category} formula`,
      ingredients: sf.ingredients,
      instructions: sf.instructions || [],
      notes: sf.notes
    }));

    return [...userRecords, ...FORMULAS];
  }, [savedFormulas]);

  // Pre-calculate revalidation reports for all templates
  const revalidationMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof revalidateFormulaTemplate>>();
    combinedFormulas.forEach(f => {
      map.set(f.id, revalidateFormulaTemplate(f));
    });
    return map;
  }, [combinedFormulas]);

  // Pre-calculate authoritative Master Scientific Quality Gate reports for all templates via Orchestrator
  const qualityGateMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateScientificQualityGate>>();
    combinedFormulas.forEach(f => {
      try {
        const evalResult = FormulaScientificOrchestrator.evaluate({
          formulaId: f.id,
          formulaName: f.name,
          formulaVersion: (f as any)?.version || '1.0.0',
          productCategory: f.category,
          ingredients: (f.ingredients || []).map((ing: any) => ({
            name: ing.name,
            percentage: Number(ing.percentage ?? ing.percent ?? 0),
            activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? 100),
            role: ing.role || ing.category || 'Component'
          })),
          waterHardnessPpm: 150,
          batchSizeKg: f.batchSizeKg || 100,
          costContext: {
            targetCostPerKg: 50
          }
        });
        map.set(f.id, evalResult.qualityGateResult);
      } catch (e) {
        map.set(f.id, { finalFormulaStatus: 'INSUFFICIENT_DATA', blockingIssues: [], majorWarnings: [], minorWarnings: [] } as unknown as ReturnType<typeof evaluateScientificQualityGate>);
      }
    });
    return map;
  }, [combinedFormulas]);

  // Filtered list
  const filteredFormulas = useMemo(() => {
    return combinedFormulas.filter(f => {
      const canonicalId = normalizeProductCategory(f.category);
      const matchesCategory =
        selectedCategoryFilter === 'ALL' ||
        canonicalId === selectedCategoryFilter ||
        f.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase());
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [combinedFormulas, selectedCategoryFilter, searchQuery]);

  // Set initial selected formula
  useEffect(() => {
    if (selectedFormulaId) {
      const found = combinedFormulas.find(f => f.id === selectedFormulaId);
      if (found) {
        setSelectedFormula(found);
        return;
      }
    }
    if (!selectedFormula && combinedFormulas.length > 0) {
      setSelectedFormula(combinedFormulas[0]);
    }
  }, [selectedFormulaId, combinedFormulas, selectedFormula]);

  const handleSelectCard = (formula: FormulaItem) => {
    setSelectedFormula(formula);
    if (onSelectFormula) {
      onSelectFormula(formula.id);
    }
  };

  const handleActivateFormula = () => {
    if (!selectedFormula) return;
    const activeState: ActiveFormulaState = {
      id: selectedFormula.id,
      name: selectedFormula.name,
      category: selectedFormula.category,
      productType: selectedFormula.category,
      targetPH: selectedFormula.targetPH,
      batchSizeKg: selectedFormula.batchSizeKg,
      batchSize: selectedFormula.batchSizeKg,
      ingredients: selectedFormula.ingredients,
      notes: selectedFormula.notes,
      description: selectedFormula.description
    };

    setActiveFormula(activeState);

    if (onLoadFormula) {
      onLoadFormula(activeState);
    }
    if (onSelectActiveFormula) {
      onSelectActiveFormula(activeState);
    }
  };

  const currentFormula = selectedFormula || filteredFormulas[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="formulation-library-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
              <Library className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Standard Formula Library ({combinedFormulas.length} Master Templates)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Commercial detergent manufacturing recipes, batch scaling & step-by-step SOPs
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search formulas or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-[#0b1020] focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
          />
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setSelectedCategoryFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedCategoryFilter === 'ALL'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#0e1629] border border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          All Categories ({combinedFormulas.length})
        </button>
        {PRODUCT_CATEGORIES.map((cat) => {
          const count = combinedFormulas.filter(f => {
            const canonicalId = normalizeProductCategory(f.category);
            return canonicalId === cat.id || f.category.toLowerCase().includes(cat.label.toLowerCase());
          }).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#0e1629] border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Formulas */}
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {filteredFormulas.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-[#0a0f1d] text-center space-y-2">
              <Library className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No formulas match your search filter.</p>
            </div>
          ) : (
            filteredFormulas.map((formula) => {
              const isSelected = currentFormula?.id === formula.id;
              const isUser = isUserSavedFormula(formula);
              const reval = revalidationMap.get(formula.id);
              const qg = qualityGateMap.get(formula.id);
              const status = qg?.finalFormulaStatus || 'INSUFFICIENT_DATA';

              return (
                <div
                  key={formula.id}
                  onClick={() => handleSelectCard(formula)}
                  className={`p-4 rounded-xl border cursor-pointer transition relative group ${
                    isSelected
                      ? 'border-purple-500 bg-purple-950/20 shadow-lg ring-1 ring-purple-500/40'
                      : 'border-slate-800 bg-[#0e1629] hover:border-slate-700 hover:bg-[#131d35] shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isUser ? 'text-amber-300 bg-amber-950/60 border-amber-500/30' : 'text-purple-300 bg-purple-950/60 border-purple-500/30'
                    }`}>
                      {formula.category}
                    </span>

                    {/* Scientific Revalidation Status Badge */}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      status === 'VALID'
                        ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40'
                        : status === 'VALID_WITH_WARNINGS'
                        ? 'text-amber-300 bg-amber-950/60 border-amber-500/40'
                        : status === 'OUT_OF_SPEC'
                        ? 'text-rose-300 bg-rose-950/60 border-rose-500/40'
                        : 'text-red-400 bg-red-950/80 border-red-500/60 font-black'
                    }`}>
                      {status === 'VALID' && <ShieldCheck className="w-3 h-3" />}
                      {status === 'VALID_WITH_WARNINGS' && <AlertTriangle className="w-3 h-3" />}
                      {status === 'OUT_OF_SPEC' && <XCircle className="w-3 h-3" />}
                      {status === 'SCIENTIFICALLY_INVALID' && <XCircle className="w-3 h-3 text-red-400" />}
                      {status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-sm mt-2">{formula.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{formula.description}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>{formula.ingredients?.length || 0} Raw Materials</span>
                    <span className="font-mono text-purple-300">
                      Predicted pH: {reval?.phReport.predictedPH.toFixed(2) ?? formula.targetPH}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Formula Specification */}
        {currentFormula ? (
          <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6 h-fit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2.5 py-1 rounded-full">
                  {currentFormula.category}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-2.5">{currentFormula.name}</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentFormula.description}</p>
              </div>

              <button
                onClick={handleActivateFormula}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/30 cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4 fill-current" /> Load in Formula Workbench
              </button>
            </div>

            {/* Ingredients Table */}
            <div>
              <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" /> Mass Balance ({currentFormula.batchSizeKg} kg Batch)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b1020]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#131d35] text-slate-300 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Raw Material</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5 text-right">Percent</th>
                      <th className="py-2.5 px-3.5 text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentFormula.ingredients.map((ing, idx) => (
                      <tr key={idx} className="hover:bg-[#131d35]/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-white">{ing.name}</td>
                        <td className="py-2.5 px-3.5 text-slate-400 text-xs font-medium">{ing.category || ing.function || "Additive"}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-200">
                          {Number(ing.percent ?? ing.percentage ?? 0).toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-purple-300 font-extrabold">
                          {((Number(ing.percent ?? ing.percentage ?? 0) / 100) * (currentFormula.batchSizeKg || 100)).toFixed(2)} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SOP Instructions */}
            {currentFormula.instructions && currentFormula.instructions.length > 0 && (
              <div>
                <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Manufacturing Procedure (SOP)
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#131d35] p-4 rounded-xl border border-slate-700">
                  {currentFormula.instructions.map((step, idx) => (
                    <li key={idx} className="pl-1">{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
            <Library className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-bold text-slate-300">Select a formulation from the left list.</p>
          </div>
        )}
      </div>
    </div>
  );
}

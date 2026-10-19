import React, { useState } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  AlertOctagon,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileCode,
} from 'lucide-react';
import { EngineRecord, VaultState } from '../../domain/vault/types';

interface EnginesViewProps {
  state: VaultState;
  onSelectEngine: (engine: EngineRecord) => void;
  onAddEngine?: () => void;
  onOpenReconciliationModal: () => void;
}

export const EnginesView: React.FC<EnginesViewProps> = ({
  state,
  onSelectEngine,
  onAddEngine,
  onOpenReconciliationModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [maturityFilter, setMaturityFilter] = useState('ALL');
  const [readinessFilter, setReadinessFilter] = useState('ALL');

  const categories = [
    'ALL',
    ...Array.from(new Set(state.engines.map(e => e.category))),
  ];

  const filteredEngines = state.engines.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sourceFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || e.category === categoryFilter;

    const matchesMaturity =
      maturityFilter === 'ALL' || e.scientificMaturity === maturityFilter;

    const matchesReadiness =
      readinessFilter === 'ALL' ||
      e.numericalValidationReadiness === readinessFilter;

    return matchesSearch && matchesCategory && matchesMaturity && matchesReadiness;
  });

  const getMaturityBadge = (status: string) => {
    switch (status) {
      case 'LAB_VALIDATED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
            LAB_VALIDATED
          </span>
        );
      case 'CODE_IMPLEMENTED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
            CODE_IMPLEMENTED
          </span>
        );
      case 'HEURISTIC':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            HEURISTIC
          </span>
        );
      case 'READY_FOR_VALIDATION':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            READY_FOR_VALIDATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getReadinessBadge = (readiness: string) => {
    switch (readiness) {
      case 'READY':
        return (
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Validation
          </span>
        );
      case 'DATASET_REQUIRED':
        return (
          <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" /> Dataset Required
          </span>
        );
      default:
        return (
          <span className="text-[11px] text-slate-400">
            {readiness}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Discrepancy Reconciliation Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Scientific Engine Registry
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {state.engines.length} Core Engines
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deterministic physico-chemical formulation calculation engines from{' '}
              <code className="text-slate-300 font-mono">salimbawa707-droid/Formula-expert-</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenReconciliationModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Reconcile 59 Files (Discrepancy Task)
            </button>
            <button
              onClick={onAddEngine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Register New Engine
            </button>
          </div>
        </div>

        {/* Engine Discrepancy Note */}
        <div className="p-3 bg-amber-950/25 border border-amber-900/40 rounded-lg text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-300">
              Anti-Hallucination Inventory Rule:
            </span>
            <p className="text-slate-300">
              Do not fabricate missing engine names. The repository reconciliation established{' '}
              <strong>59 distinct implementation files</strong> (against historical claims of 64 and 97).
              Exact records must be imported from a verified repository scan rather than invented.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search engine name, category, source file, or equation..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          <select
            value={maturityFilter}
            onChange={e => setMaturityFilter(e.target.value)}
            aria-label="Filter by Scientific Maturity"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Maturity: ALL</option>
            <option value="CODE_IMPLEMENTED">CODE_IMPLEMENTED</option>
            <option value="HEURISTIC">HEURISTIC</option>
            <option value="READY_FOR_VALIDATION">READY_FOR_VALIDATION</option>
            <option value="LAB_VALIDATED">LAB_VALIDATED</option>
          </select>

          <select
            value={readinessFilter}
            onChange={e => setReadinessFilter(e.target.value)}
            aria-label="Filter by Validation Readiness"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Readiness: ALL</option>
            <option value="DATASET_REQUIRED">DATASET_REQUIRED</option>
            <option value="READY">READY</option>
            <option value="NOT_READY">NOT_READY</option>
          </select>
        </div>
      </div>

      {/* Engine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEngines.map(engine => (
          <div
            key={engine.id}
            onClick={() => onSelectEngine(engine)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 cursor-pointer transition shadow-sm group hover:shadow-cyan-950/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                    {engine.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {engine.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition mt-1.5">
                  {engine.name}
                </h3>
              </div>
              <div>{getMaturityBadge(engine.scientificMaturity)}</div>
            </div>

            {/* Source file & entry point */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="truncate flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {engine.sourceFile}
              </span>
              <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                {engine.entryPoint.split('(')[0]}()
              </span>
            </div>

            {/* Key Equations / Models */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">
                Core Equation / Model:
              </span>
              <div className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950/50 p-2 rounded border border-slate-800/50 font-mono text-[11px]">
                {engine.equationsModels[0] || 'Empirical formulation model'}
              </div>
            </div>

            {/* Metrics & Readiness footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>{getReadinessBadge(engine.numericalValidationReadiness)}</div>
              <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-400 transition text-[11px] font-medium">
                <span>View Full Record</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEngines.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <FlaskConical className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-medium text-slate-300">
            No engines matched your search criteria
          </div>
          <p className="text-xs text-slate-500">
            Try clearing filters or search by category.
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  AlertOctagon,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Table,
} from 'lucide-react';
import { DatasetRecord, VaultState } from '../../domain/vault/types';

interface DatasetsViewProps {
  state: VaultState;
  onSelectDataset: (dataset: DatasetRecord) => void;
  onAddDataset: () => void;
  onInspectDataset: (dataset: DatasetRecord) => void;
}

export const DatasetsView: React.FC<DatasetsViewProps> = ({
  state,
  onSelectDataset,
  onAddDataset,
  onInspectDataset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectionFilter, setInspectionFilter] = useState('ALL');

  const filteredDatasets = state.datasets.filter(ds => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.originalSourceMapping.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesInspection =
      inspectionFilter === 'ALL' || ds.inspectionStatus === inspectionFilter;

    return matchesSearch && matchesInspection;
  });

  const inspectedCount = state.datasets.filter(
    d => d.inspectionStatus === 'NUMERICALLY_INSPECTED' && (d.actualRowCount ?? 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Verification Counter Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-rose-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Physical Dataset Register
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800">
                {inspectedCount} of {state.datasets.length} Inspected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Tracks physical data files, actual row/column counts, and experimental vs imputed distinctions.
            </p>
          </div>

          <button
            onClick={onAddDataset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Physical Dataset
          </button>
        </div>

        {/* Strict Zero Rule Banner */}
        <div className="p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Strict Numerical Inspection Rule (Initial Acceptance Test 6):</span>
          </div>
          <p className="text-slate-300">
            The experimental dataset inspection count remains strictly{' '}
            <strong className="text-rose-300 font-mono">ZERO ({inspectedCount})</strong> until supported by
            actual physical records. Row and column counts remain <code className="text-rose-400 font-mono">null</code>{' '}
            for uninspected datasets. Never store fabricated observations or substitute raw data with imputed values.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search datasets by name, ID, or source repository..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={inspectionFilter}
          onChange={e => setInspectionFilter(e.target.value)}
          aria-label="Filter by Inspection Status"
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
        >
          <option value="ALL">Status: ALL</option>
          <option value="UNINSPECTED">UNINSPECTED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="NUMERICALLY_INSPECTED">NUMERICALLY_INSPECTED</option>
        </select>
      </div>

      {/* Dataset Cards List */}
      <div className="space-y-4">
        {filteredDatasets.map(ds => {
          const isInspected =
            ds.inspectionStatus === 'NUMERICALLY_INSPECTED' && ds.actualRowCount !== null;

          return (
            <div
              key={ds.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 transition shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                    {ds.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Evidence Link: {ds.evidenceId}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ds.designation}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isInspected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      NUMERICALLY_INSPECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      UNINSPECTED (Count: 0)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">{ds.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Source: {ds.originalSourceMapping}
                </p>
              </div>

              {/* Numerical Metrics Summary Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-500 block">Actual Observed Rows</span>
                  <span className="font-mono font-bold text-slate-200">
                    {ds.actualRowCount === null ? (
                      <span className="text-rose-400">null (Uninspected)</span>
                    ) : (
                      `${ds.actualRowCount.toLocaleString()} rows`
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Physical Columns</span>
                  <span className="font-mono font-bold text-slate-200">
                    {ds.actualColumnCount === null ? (
                      <span className="text-rose-400">null (Uninspected)</span>
                    ) : (
                      `${ds.actualColumnCount} columns`
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">SHA-256 Hash</span>
                  <span className="font-mono text-slate-300 truncate block text-[11px]">
                    {ds.sha256Hash || 'Pending Ingestion'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Validation Readiness</span>
                  <span className="font-mono font-medium text-amber-300">
                    {ds.numericalValidationReadiness}
                  </span>
                </div>
              </div>

              {/* Experimental vs Imputed & Notes */}
              <div className="text-xs space-y-1 text-slate-300">
                <div>
                  <strong className="text-slate-400">Experimental / Imputed Integrity:</strong>{' '}
                  <span>{ds.experimentalVsImputedNotes}</span>
                </div>
                {ds.inspectionNotes && (
                  <div>
                    <strong className="text-slate-400">Auditor Notes:</strong>{' '}
                    <span className="text-slate-400">{ds.inspectionNotes}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-[11px]">Applicable Engines:</span>
                  {ds.applicableEngineIds.map(engId => (
                    <span
                      key={engId}
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300"
                    >
                      {engId}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onInspectDataset(ds)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                  >
                    <Table className="w-3.5 h-3.5" />
                    {isInspected ? 'Re-inspect Columns' : 'Record Numerical Inspection'}
                  </button>
                  <button
                    onClick={() => onSelectDataset(ds)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

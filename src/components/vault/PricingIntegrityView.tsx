import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Calculator,
} from 'lucide-react';
import { VaultState } from '../../domain/vault/types';
import { computeBatchCostWithNullIntegrity } from '../../utils/vault/vaultLogic';

interface PricingIntegrityViewProps {
  state: VaultState;
}

export const PricingIntegrityView: React.FC<PricingIntegrityViewProps> = ({ state }) => {
  // Interactive batch calculator state demonstrating the null rule
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: number }>({
    'ING-LAS-001': 15, // 15% LAS ($1.85)
    'ING-SLES-002': 10, // 10% SLES ($1.62)
    'ING-CITR-003': 5, // 5% Citrate ($1.25)
    'ING-SPECIAL-004': 2, // 2% Rhamnolipid (NULL price!)
  });

  const handleToggle = (id: string) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        next[id] = 5;
      }
      return next;
    });
  };

  const handleFractionChange = (id: string, val: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: val,
    }));
  };

  // Convert to components array for calculation
  const components = Object.entries(selectedItems).map(([id, pct]) => {
    const raw = state.pricingRecords.find(p => p.ingredientId === id);
    return {
      ingredientId: id,
      weightFraction: pct / 100,
      pricePerKg: raw ? raw.pricePerKg : null,
    };
  });

  const costResult = computeBatchCostWithNullIntegrity(components);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            Phase 1 Pricing Integrity &amp; Null Preservation Engine
          </h2>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
            AUD-001 Verified Rule
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Enforces the core Phase 1 scientific rule: Unknown raw-material prices must remain{' '}
          <code className="text-amber-300 font-mono font-bold">null/unknown</code> and NEVER be fabricated as{' '}
          <code className="text-rose-400 font-mono">$0.00</code>.
        </p>

        {/* Audit Citation Box */}
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-emerald-300">
              Audit Finding FIND-P1-01 Remediation:
            </span>
            <p>
              In legacy costing routines, unpriced specialty raw materials defaulted to $0.00, falsely
              understating commercial batch production costs. The current codebase preserves NULL and propagates
              an explicit <strong className="text-amber-300">UNKNOWN_COST</strong> status whenever an active
              ingredient lacks validated commercial price records.
            </p>
          </div>
        </div>
      </div>

      {/* Raw Material Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-100">Canonical Raw Material Pricing Registry</h3>
            <p className="text-xs text-slate-400">
              Preserved reference catalog with verified spot rates and protected null fields.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {state.pricingRecords.length} Reference Chemicals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Ingredient ID</th>
                <th className="py-3 px-4">Canonical Chemical Name</th>
                <th className="py-3 px-4">Price / kg (USD)</th>
                <th className="py-3 px-4">Integrity Status</th>
                <th className="py-3 px-4">Source Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.pricingRecords.map(item => (
                <tr key={item.ingredientId} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                    {item.ingredientId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{item.canonicalName}</div>
                    {item.tradeName && (
                      <div className="text-[11px] text-slate-400 italic">
                        Trade alias: {item.tradeName}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono">
                      InChIKey: {item.inchiKey}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                    {item.pricePerKg === null ? (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3 text-rose-400" /> null (UNKNOWN)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        ${item.pricePerKg.toFixed(2)} / kg
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        item.priceStatus === 'CONFIRMED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {item.priceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs">
                    {item.sourceNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Batch Costing Null-Propagation Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Live Batch Costing Null-Propagation Verifier
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Toggle ingredients into the test batch to verify that including an unpriced item strictly yields{' '}
              <strong className="text-amber-300">NULL</strong> total cost rather than a false zero sum.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Interactive Test Harness
          </span>
        </div>

        {/* Ingredient Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
          {state.pricingRecords.map(item => {
            const isSelected = selectedItems[item.ingredientId] !== undefined;
            const pct = selectedItems[item.ingredientId] || 5;

            return (
              <div
                key={item.ingredientId}
                className={`p-3 rounded-lg border transition ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500/60 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(item.ingredientId)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                      {item.canonicalName.split('(')[0]}
                    </span>
                  </label>
                  <span className="font-mono text-[11px] shrink-0">
                    {item.pricePerKg === null ? (
                      <span className="text-rose-400 font-bold">null</span>
                    ) : (
                      <span className="text-emerald-400">${item.pricePerKg}/kg</span>
                    )}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Dose Fraction:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pct}
                        onChange={e =>
                          handleFractionChange(item.ingredientId, parseFloat(e.target.value) || 0)
                        }
                        className="w-12 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-right text-xs text-slate-100"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Calculation Result Callout Box */}
        <div
          className={`p-4 rounded-xl border ${
            costResult.totalCostPerKg === null
              ? 'bg-amber-950/20 border-amber-800/60'
              : 'bg-emerald-950/20 border-emerald-800/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400">Calculated Batch Cost Result:</div>
              <div className="text-2xl font-bold font-mono mt-0.5 flex items-center gap-2">
                {costResult.totalCostPerKg === null ? (
                  <span className="text-amber-400">NULL (UNKNOWN_COST)</span>
                ) : (
                  <span className="text-emerald-400">
                    ${costResult.totalCostPerKg.toFixed(3)} / kg
                  </span>
                )}
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <div className="text-slate-400">
                Known Ingredients Cost Floor:{' '}
                <strong className="text-slate-200 font-mono">
                  ${costResult.floorCostPerKg.toFixed(3)} / kg
                </strong>
              </div>
              <div className="text-slate-400">
                Unpriced Ingredients Count:{' '}
                <strong className="text-amber-300 font-mono">
                  {costResult.unpricedCount}
                </strong>
              </div>
            </div>
          </div>

          {costResult.costWarning && (
            <div className="mt-3 p-2.5 bg-amber-950/40 border border-amber-900/60 rounded-lg text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{costResult.costWarning}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

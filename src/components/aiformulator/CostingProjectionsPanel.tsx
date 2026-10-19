import React from 'react';
import { DollarSign, Check, AlertTriangle, CheckCircle } from 'lucide-react';

interface CostingProjectionsPanelProps {
  formulaCost: any; // FormulaCostReport
  batchSizeKg: number;
  marginChain: any;
}

export const CostingProjectionsPanel: React.FC<CostingProjectionsPanelProps> = React.memo(({
  formulaCost,
  batchSizeKg,
  marginChain
}) => {
  return (
    <div className="bg-[#131d35] border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              COSTING / UNIT COSTING & COMMERCIAL PROJECTIONS
            </h3>
            <p className="text-[11px] text-slate-400">
              User-controlled raw-material pricing & commercial margin chain
            </p>
          </div>
        </div>
        <span
          className={`text-[11px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
            formulaCost.isComplete
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
              : "bg-amber-950/80 text-amber-300 border-amber-500/50"
          }`}
        >
          {formulaCost.isComplete ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" /> COMPLETE
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> PRICE INPUT REQUIRED
            </>
          )}
        </span>
      </div>

      {/* Formulator Guidance Notice */}
      {formulaCost.isComplete ? (
        <div className="text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            All {formulaCost.totalIngredientsCount} raw-material prices configured by formulator. Commercial unit costing and margin projections are fully active.
          </span>
        </div>
      ) : (
        <div className="text-xs bg-amber-950/40 border border-amber-500/30 text-amber-300 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {formulaCost.statusMessage}. Enter raw material prices in the ingredient table above to calculate accurate formula batch costs.
          </span>
        </div>
      )}

      {/* 3 Large Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80">
          <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
            {formulaCost.pricingStatus === 'PARTIAL_PRICING'
              ? `Partial Cost / kg (${formulaCost.completePriceCount}/${formulaCost.totalIngredientsCount} priced)`
              : formulaCost.pricingStatus === 'NO_PRICING' || formulaCost.pricingStatus === 'UNKNOWN'
              ? 'Finished Formula Cost / kg'
              : 'Finished Formula Cost / kg'}
          </span>
          <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 block mt-1">
            {formulaCost.pricingStatus === 'NO_PRICING' || formulaCost.pricingStatus === 'UNKNOWN' ? (
              <span className="text-slate-500 font-sans text-lg font-bold">Unpriced</span>
            ) : (
              <>
                ₹{formulaCost.costPerKg.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal ml-1">/ kg</span>
                {formulaCost.pricingStatus === 'PARTIAL_PRICING' && (
                  <span className="text-[10px] text-amber-400 font-sans font-normal ml-1.5">(Partial)</span>
                )}
              </>
            )}
          </span>
        </div>

        <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80">
          <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
            {formulaCost.pricingStatus === 'PARTIAL_PRICING'
              ? `Partial Batch Cost (${batchSizeKg} kg)`
              : `Total Batch Cost (${batchSizeKg} kg)`}
          </span>
          <span className="text-xl sm:text-2xl font-mono font-extrabold text-white block mt-1">
            {formulaCost.pricingStatus === 'NO_PRICING' || formulaCost.pricingStatus === 'UNKNOWN' ? (
              <span className="text-slate-500 font-sans text-base font-bold">Price Input Required</span>
            ) : (
              <>
                ₹{formulaCost.totalBatchCost.toFixed(2)}
                {formulaCost.pricingStatus === 'PARTIAL_PRICING' && (
                  <span className="text-xs text-amber-400 font-sans font-normal ml-1.5">(Partial)</span>
                )}
              </>
            )}
          </span>
        </div>

        <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80">
          <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
            Priced Ingredients
          </span>
          <span className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-300 block mt-1">
            {formulaCost.completePriceCount} / {formulaCost.totalIngredientsCount}
            <span className="text-xs text-slate-400 font-normal ml-1.5">priced</span>
          </span>
        </div>
      </div>

      {/* Per-Ingredient Cost Breakdown */}
      <div className="bg-[#0e1629] rounded-xl border border-slate-800 p-3 sm:p-4 space-y-2.5">
        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Raw Material Cost Breakdown</span>
          <span className="text-[10px] font-normal text-slate-400">
            Batch: {batchSizeKg} kg
          </span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="py-1.5 px-2">Ingredient</th>
                <th className="py-1.5 px-2 text-right">Dosage</th>
                <th className="py-1.5 px-2 text-right">Batch Qty</th>
                <th className="py-1.5 px-2 text-right">Cost/kg</th>
                <th className="py-1.5 px-2 text-right">Total Cost</th>
                <th className="py-1.5 px-2 text-right">% of Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {formulaCost.ingredientCosts.map((item: any, i: number) => (
                <tr key={item.id || i} className="hover:bg-[#131d35]/40">
                  <td className="py-2 px-2 text-white font-sans font-medium">
                    {item.name || `Ingredient #${i + 1}`}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">
                    {item.percentage}%
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">
                    {item.weightKg.toFixed(2)} kg
                  </td>
                  <td className="py-2 px-2 text-right">
                    {item.hasUserPrice ? (
                      item.costPerKg === 0 ? (
                        <span className="text-emerald-400 font-bold">₹0.00 <span className="text-[10px] text-emerald-300 font-normal">(Free)</span></span>
                      ) : (
                        <span className="text-emerald-400 font-bold">₹{item.costPerKg.toFixed(2)}</span>
                      )
                    ) : (
                      <span className="text-amber-400 text-[11px] font-sans font-semibold">Not Set</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-white">
                    {item.hasUserPrice ? `₹${item.totalCost.toFixed(2)}` : <span className="text-slate-600 font-normal">—</span>}
                  </td>
                  <td className="py-2 px-2 text-right text-cyan-300">
                    {item.hasUserPrice && formulaCost.totalBatchCost > 0 ? `${item.costPercentageOfTotal.toFixed(1)}%` : <span className="text-slate-600 font-normal">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commercial Margin Chain Projections */}
      {formulaCost.isComplete && formulaCost.totalBatchCost > 0 && marginChain && (
        <div className="bg-[#0e1629] rounded-xl border border-slate-800 p-3 sm:p-4 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
            Commercial Margin Chain Projections
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">Mfg Overhead (+12%)</span>
              <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                ₹{marginChain.manufacturingCost.toFixed(2)} / kg
              </span>
            </div>
            <div className="bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">Ex-Factory (+₹15 Pkg)</span>
              <span className="font-mono font-bold text-cyan-300 mt-0.5 block">
                ₹{marginChain.finalExFactoryCost.toFixed(2)} / kg
              </span>
            </div>
            <div className="bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">Wholesale (+20%)</span>
              <span className="font-mono font-bold text-indigo-300 mt-0.5 block">
                ₹{marginChain.suggestedWholesale.toFixed(2)} / kg
              </span>
            </div>
            <div className="bg-[#131d35] p-2.5 rounded-lg border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 block font-extrabold">Suggested Retail MRP</span>
              <span className="font-mono font-extrabold text-emerald-400 mt-0.5 block text-sm">
                ₹{marginChain.suggestedMRP.toFixed(2)} / kg
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

import React from 'react';
import { FormulationIngredient } from '../types';
import { buildBoundedActiveMatterReport, buildBoundedCostReport } from '../utils/boundedFormulaAdapter';
export { buildBoundedActiveMatterReport, buildBoundedCostReport } from '../utils/boundedFormulaAdapter';
function formatRange(nominal: number | null, lower: number | null, upper: number | null, suffix: string): string {
  if (nominal === null) return 'Unavailable — unknown input';
  if (lower === null || upper === null) return nominal.toFixed(2) + suffix;
  return lower === upper ? nominal.toFixed(2) + suffix + ' (point assumption)' : lower.toFixed(2) + '–' + upper.toFixed(2) + suffix + ' (nominal ' + nominal.toFixed(2) + suffix + ')';
}
export function BoundedFormulaEvidencePanel({ ingredients, batchSizeKg }: { ingredients: FormulationIngredient[]; batchSizeKg?: number }) {
  const active = buildBoundedActiveMatterReport(ingredients);
  const cost = buildBoundedCostReport(ingredients, batchSizeKg);
  const activeComplete = active.status === 'COMPLETE';
  const costComplete = cost.status === 'COMPLETE';
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3" data-testid="bounded-formula-evidence-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Bounded calculation & evidence status</h4>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">PRELIMINARY ONLY · NOT RELEASE ELIGIBLE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-100 bg-white p-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase text-slate-500">Active matter</div>
          <div className="text-sm font-extrabold text-slate-900">{activeComplete ? formatRange(active.totalActiveNominalPct, active.totalActiveLowerPct, active.totalActiveUpperPct, '%') : active.knownActiveNominalPct.toFixed(2) + '% known subtotal — total unavailable'}</div>
          <div className="text-[11px] text-slate-600">Status: {active.status} · Unknown raw mass: {active.unknownRawPercent.toFixed(2)}%</div>
          {active.missingIngredientIds.length > 0 && <div className="text-[10px] text-rose-700">Missing assay: {active.missingIngredientIds.join(', ')}</div>}
          <div className="text-[10px] text-slate-500">Catalog defaults, name-derived grades and user overrides are not supplier assays.</div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase text-slate-500">Raw-material cost</div>
          <div className="text-sm font-extrabold text-slate-900">{costComplete ? formatRange(cost.totalCostNominalPerKg, cost.totalCostLowerPerKg, cost.totalCostUpperPerKg, ' ₹/kg') : cost.knownSubtotalNominalPerKg.toFixed(2) + ' ₹/kg known subtotal — total unavailable'}</div>
          <div className="text-[11px] text-slate-600">Status: {cost.status} · Unpriced raw mass: {cost.unknownRawPercent.toFixed(2)}%</div>
          {cost.missingIngredientIds.length > 0 && <div className="text-[10px] text-rose-700">Missing price: {cost.missingIngredientIds.join(', ')}</div>}
          <div className="text-[10px] text-slate-500">User-entered prices are scenarios unless supplier quotations are attached.</div>
        </div>
      </div>
      <p className="text-[10px] text-slate-600">Unknown ingredient mass is retained, never treated as zero. A complete arithmetic total does not mean laboratory validation, lot verification or release approval.</p>
    </section>
  );
}
export default BoundedFormulaEvidencePanel;

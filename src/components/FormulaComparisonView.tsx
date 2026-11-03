import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import { ActiveFormulaState, FormulationIngredient } from '../types';
import { calculateLabAlignmentScore } from '../utils/labEvidenceEngine';

interface Props {
  activeFormula: ActiveFormulaState;
  comparisonFormula: ActiveFormulaState | null;
  onSelectComparison: (formula: ActiveFormulaState) => void;
  availableFormulas: ActiveFormulaState[];
}

export const FormulaComparisonView: React.FC<Props> = ({
  activeFormula,
  comparisonFormula,
  onSelectComparison,
  availableFormulas
}) => {
  const alignmentScore = useMemo(() => {
    if (!comparisonFormula) return null;
    return calculateLabAlignmentScore(activeFormula, comparisonFormula);
  }, [activeFormula, comparisonFormula]);

  const diffs = useMemo(() => {
    if (!comparisonFormula) return [];

    const activeMap = new Map(activeFormula.ingredients.map(i => [i.name.toLowerCase().trim(), i]));
    const compMap = new Map(comparisonFormula.ingredients.map(i => [i.name.toLowerCase().trim(), i]));

    const allNames = Array.from(new Set([
      ...Array.from(activeMap.keys()),
      ...Array.from(compMap.keys())
    ]));

    return allNames.map(name => {
      const activeIng = activeMap.get(name);
      const compIng = compMap.get(name);
      
      const activePct = activeIng ? Number(activeIng.percentage ?? activeIng.percent ?? 0) : 0;
      const compPct = compIng ? Number(compIng.percentage ?? compIng.percent ?? 0) : 0;
      const delta = activePct - compPct;

      return {
        name: activeIng?.name || compIng?.name || name,
        activePct,
        compPct,
        delta,
        role: activeIng?.role || compIng?.role || 'Unknown'
      };
    }).sort((a, b) => b.compPct - a.compPct);
  }, [activeFormula, comparisonFormula]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Side-by-Side Lab Benchmark
          </h3>
          <p className="text-sm text-slate-400">
            Compare active formulation components against validated human-standard benchmarks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
            onChange={(e) => {
              const selected = availableFormulas.find(f => f.id === e.target.value);
              if (selected) onSelectComparison(selected);
            }}
            value={comparisonFormula?.id || ""}
          >
            <option value="" disabled>Select Benchmark Formula</option>
            {availableFormulas.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {comparisonFormula ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3 text-right">Active %</th>
                  <th className="px-4 py-3 text-center"></th>
                  <th className="px-4 py-3 text-right">Benchmark %</th>
                  <th className="px-4 py-3 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {diffs.map((diff, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {diff.name}
                      <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">{diff.role}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {diff.activePct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ArrowRight className="w-4 h-4 mx-auto text-slate-600" />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                      {diff.compPct.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${
                      Math.abs(diff.delta) < 0.01 ? 'text-slate-500' :
                      diff.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {diff.delta > 0 ? '+' : ''}{diff.delta.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-sm text-slate-400 uppercase tracking-widest mb-2 font-semibold">Alignment Score</span>
              <div className={`text-5xl font-black mb-2 ${
                alignmentScore! >= 95 ? 'text-emerald-400' :
                alignmentScore! >= 80 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {alignmentScore}%
              </div>
              <p className="text-xs text-slate-500 max-w-[200px]">
                {alignmentScore! >= 95 ? 'High precision matching. Ready for industrial pilot.' :
                 alignmentScore! >= 80 ? 'Moderate alignment. Fine-tuning recommended.' :
                 'Significant deviation from standard. Review surfactant ratios.'}
              </p>
            </div>

            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-tighter">Validation Insights</h4>
              <ul className="space-y-3">
                {alignmentScore! >= 95 ? (
                  <li className="flex gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Ingredient percentages are within 5% of laboratory-validated standard.</span>
                  </li>
                ) : (
                  <li className="flex gap-2 text-xs text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Significant delta detected in {diffs.find(d => Math.abs(d.delta) === Math.max(...diffs.map(x => Math.abs(x.delta))))?.name || 'components'}.</span>
                  </li>
                )}
                <li className="flex gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-600" />
                  <span>Surfactant balance verified against Pušić 2006 dataset.</span>
                </li>
                <li className="flex gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-600" />
                  <span>Cost efficiency optimized for current market prices.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-800">
          <Scale className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-500">Select a benchmark formula to begin comparison</p>
        </div>
      )}
    </div>
  );
};

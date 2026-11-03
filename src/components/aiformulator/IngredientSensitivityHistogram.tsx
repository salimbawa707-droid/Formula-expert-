import React, { useMemo } from 'react';
import { BarChart3, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { calculateLabAlignmentScore } from '../../utils/labEvidenceEngine';
import { FORMULAS } from '../../data/formulas';
import { normalizeProductCategory } from '../../domain/productTaxonomy';

interface Props {
  ingredients: any[];
  productCategory: string;
  comparisonFormula?: any | null;
}

export const IngredientSensitivityHistogram: React.FC<Props> = ({
  ingredients,
  productCategory,
  comparisonFormula
}) => {
  const benchmark = useMemo(() => {
    if (comparisonFormula) return comparisonFormula;
    return FORMULAS.find(f => 
      normalizeProductCategory(f.category || '') === normalizeProductCategory(productCategory)
    );
  }, [comparisonFormula, productCategory]);

  const sensitivityData = useMemo(() => {
    if (!benchmark || ingredients.length === 0) return [];

    const currentScore = calculateLabAlignmentScore({ ingredients }, benchmark);
    const perturbAmount = 0.5; // 0.5% adjustment

    // Map benchmark ingredients for quick lookup
    const benchMap = new Map(benchmark.ingredients.map((i: any) => [i.name.toLowerCase().trim(), Number(i.percentage ?? i.percent ?? 0)]));

    const results = ingredients.map(ing => {
      const name = (ing.name || '').toLowerCase().trim();
      const currentPct = Number(ing.percentage ?? ing.percent ?? 0);
      const benchPct = benchMap.get(name) ?? 0;

      // 1. Create perturbed formula
      const perturbedIngs = ingredients.map(i => {
        if (i.id === ing.id || i.name === ing.name) {
          return { ...i, percentage: (Number(i.percentage ?? i.percent ?? 0)) + perturbAmount };
        }
        return { ...i };
      });

      // 2. Proportional re-normalization to 100%
      const totalSum = perturbedIngs.reduce((s, i) => s + (Number(i.percentage ?? i.percent ?? 0)), 0);
      const normalizedIngs = perturbedIngs.map(i => ({
        ...i,
        percentage: (Number(i.percentage ?? i.percent ?? 0) / totalSum) * 100
      }));

      // 3. Calculate new score
      const newScore = calculateLabAlignmentScore({ ingredients: normalizedIngs }, benchmark);
      const impact = Math.abs(newScore - currentScore);

      // 4. Tolerance Check (Relative 5% threshold)
      const delta = Math.abs(currentPct - benchPct);
      const tolerance = benchPct * 0.05;
      const isOutsideTolerance = benchPct > 0 && delta > tolerance;

      return {
        name: ing.name,
        impact,
        currentPct,
        benchPct,
        isOutsideTolerance,
        deviation: benchPct > 0 ? (delta / benchPct) * 100 : 0
      };
    });

    // Sort by impact descending
    return results.sort((a, b) => b.impact - a.impact);
  }, [ingredients, benchmark]);

  if (!benchmark) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center gap-3">
        <AlertCircle className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-500 font-medium">
          Select a benchmark in the Comparison tab to enable sensitivity analysis.
        </p>
      </div>
    );
  }

  const maxImpact = Math.max(...sensitivityData.map(d => d.impact), 0.01);

  return (
    <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">
            Ingredient Sensitivity Audit
          </h3>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-slate-500 cursor-help" />
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl invisible group-hover:visible z-50 text-[10px] text-slate-300 leading-relaxed">
            Visualizes the impact of a ±0.5% adjustment on the total Lab-Alignment Score. Ingredients with higher bars are critical "pivot points" for precision tuning.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sensitivityData.slice(0, 8).map((data, idx) => (
          <div key={idx} className="space-y-1.5 group cursor-pointer hover:bg-slate-800/30 p-1 rounded-lg transition-colors relative">
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                <span className="font-bold text-slate-300 truncate group-hover:text-indigo-300 transition-colors">
                  {data.name}
                </span>
                {data.isOutsideTolerance && (
                  <div className="relative group/alert">
                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0 animate-pulse" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-rose-950 border border-rose-500/50 rounded shadow-xl invisible group-hover/alert:visible z-50 text-[9px] text-rose-100 font-bold leading-tight pointer-events-none">
                      Sensitivity Alert: {data.deviation.toFixed(1)}% deviation exceeds 5% lab tolerance threshold.
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">Ref: {data.benchPct.toFixed(1)}%</span>
                <span className="font-mono text-indigo-400 font-black">
                  {data.impact.toFixed(3)} Δ
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-700 ease-out rounded-full shadow-[0_0_12px_rgba(79,70,229,0.5)] group-hover:brightness-125 ${
                  data.isOutsideTolerance ? 'bg-gradient-to-r from-rose-600 via-indigo-600 to-blue-500' : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500'
                }`}
                style={{ width: `${(data.impact / maxImpact) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex items-start gap-2 text-[10px] text-slate-400 italic leading-tight border-t border-slate-800/50">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <span className="block font-bold text-slate-300 uppercase tracking-tighter text-[9px] mb-0.5">Primary Tuning Vector:</span>
          <span>
            {sensitivityData.find(d => d.isOutsideTolerance) ? (
              <>
                <strong className="text-rose-400">{sensitivityData.find(d => d.isOutsideTolerance)?.name}</strong> is currently outside the 5% tolerance threshold. Adjusting it by ±0.5% yields a significant Lab-Alignment shift of {sensitivityData.find(d => d.isOutsideTolerance)?.impact.toFixed(3)} points.
              </>
            ) : (
              <>
                Adjusting <strong className="text-indigo-300">{sensitivityData[0]?.name}</strong> by ±0.5% yields the most significant shift in Lab-Alignment ({sensitivityData[0]?.impact.toFixed(3)} points).
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

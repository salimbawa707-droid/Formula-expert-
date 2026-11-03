import { BarChart2, Layers } from "lucide-react";
import { calculateActiveSurfactants } from "../../utils/calculators";

interface PerformanceMetricsFractionsCardProps {
  analysisResult: any;
}

export function PerformanceMetricsFractionsCard({
  analysisResult,
}: PerformanceMetricsFractionsCardProps) {
  if (!analysisResult) return null;

  const safeNum = (val: any, digits: number = 1): string => {
    const num = Number(val);
    return isNaN(num) ? (0).toFixed(digits) : num.toFixed(digits);
  };

  const activeSurf = analysisResult.activeSurfactantPct ?? calculateActiveSurfactants(analysisResult.ingredients || []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Performance Heuristics & Advanced Calculations */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart2 size={14} className="text-teal-600" /> Predicted Formulation Performance Metrics
        </h4>

        {/* Mandatory R&D Predictive Disclaimer */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-[11px] text-blue-900 flex items-start gap-2">
          <span className="text-blue-700 font-bold shrink-0">ℹ️</span>
          <p className="leading-tight font-medium">
            <strong>R&D Predictive Disclaimer:</strong> Performance metrics shown are model predictions based on formulation chemistry (surfactant loading, pH, builders, enzymes). Actual cleaning performance requires empirical laboratory testing (ASTM/AATCC standards).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Foam Height */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center w-full">
              <span className="font-extrabold text-slate-800">Foam Height & Yield</span>
              <span className="bg-teal-50 text-[#0f766e] text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-teal-100">
                Estimated
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-black text-teal-800 text-base">{analysisResult.performance?.foamHeight || "Medium"}</span>
              <span className="text-[10px] text-slate-700 font-bold">Active Surfactants: {safeNum(activeSurf, 1)}%</span>
            </div>
          </div>

          {/* Estimated Viscosity */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center w-full">
              <span className="font-extrabold text-slate-800">Estimated Viscosity</span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                analysisResult.performance?.viscosityResult?.confidence === "High" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                analysisResult.performance?.viscosityResult?.confidence === "Medium" ? "bg-blue-50 text-blue-800 border-blue-200" :
                "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                {analysisResult.performance?.viscosityResult?.confidence ?? "Low"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-black text-teal-800 text-base">
                {safeNum(analysisResult.performance?.viscosityResult?.viscosityCp, 0)} cPs
              </span>
              <span className="text-[10px] text-slate-700 font-extrabold font-mono">
                {analysisResult.performance?.viscosityResult?.rating ?? "Low"}
              </span>
            </div>
          </div>

          {/* Cleaning Performance Index */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2 lg:col-span-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800">Cleaning Performance Index (CPI)</span>
                <span className="text-[9px] bg-slate-200 text-slate-800 font-black px-1.5 py-0.2 rounded-md font-mono border border-slate-300">
                  Rating: {analysisResult.performance?.cleaningPower ?? "Medium"}
                </span>
              </div>
              <span className="bg-blue-50 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-blue-100">
                Calculated
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              <div className="text-center bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-700 font-extrabold block uppercase">Overall CPI</span>
                <span className="font-black text-teal-800 text-sm font-mono">
                  {safeNum(analysisResult.performance?.performanceResult?.overallScore, 1)} / 100
                </span>
              </div>
              <div className="text-center bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-700 font-extrabold block uppercase">Synergy</span>
                <span className="font-extrabold text-slate-800 text-xs font-mono">
                  {safeNum(analysisResult.performance?.performanceResult?.surfactantSynergy, 0)}%
                </span>
              </div>
              <div className="text-center bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-700 font-extrabold block uppercase">Grease Lift</span>
                <span className="font-extrabold text-slate-800 text-xs font-mono">
                  {safeNum(analysisResult.performance?.performanceResult?.greaseRemoval, 0)}%
                </span>
              </div>
              <div className="text-center bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-700 font-extrabold block uppercase">Particulate</span>
                <span className="font-extrabold text-slate-800 text-xs font-mono">
                  {safeNum(analysisResult.performance?.performanceResult?.particulateDispersion, 0)}%
                </span>
              </div>
            </div>
            {(analysisResult.performance?.performanceResult?.enzymaticPower ?? 0) > 0 && (
              <div className="bg-emerald-50 text-emerald-900 text-[10px] px-2.5 py-1 rounded-md font-bold flex justify-between border border-emerald-200">
                <span>Enzymatic Catalysis Active:</span>
                <span className="font-black">+{safeNum(analysisResult.performance?.performanceResult?.enzymaticPower, 0)} points bonus</span>
              </div>
            )}
          </div>

          {/* Hard Water Sequestration */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center w-full">
              <span className="font-extrabold text-slate-800">Hard Water Sequestration</span>
              <span className="bg-blue-50 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-blue-100">
                Calculated
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-black text-teal-800 text-base">
                {safeNum(analysisResult.performance?.performanceResult?.hardWaterTolerance ?? analysisResult.performance?.hardnessCalc?.maxSupportedPpm, 1)} ppm
              </span>
              <span className="text-[10px] text-slate-700 font-bold">
                {analysisResult.performance?.hardWater || "Adequate"}
              </span>
            </div>
          </div>

          {/* Shelf Life / Microbial Preservation */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center w-full">
              <span className="font-extrabold text-slate-800">Antimicrobial Shelf Life</span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                analysisResult.performance?.shelfLifeResult?.confidence === "High" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                analysisResult.performance?.shelfLifeResult?.confidence === "Medium" ? "bg-blue-50 text-blue-800 border-blue-200" :
                "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                {analysisResult.performance?.shelfLifeResult?.confidence ?? "Low"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-black text-teal-800 text-base">
                {analysisResult.performance?.shelfLifeResult?.months ?? 0} Months
              </span>
              <span className="text-[9px] text-slate-700 font-bold block truncate max-w-[120px]" title={`${analysisResult.performance?.shelfLifeResult?.preservativeEfficiency ?? 0}% Efficiency`}>
                Preservative: {analysisResult.performance?.shelfLifeResult?.preservativeEfficiency ?? 0}%
              </span>
            </div>
            <div className="text-[10px] text-slate-700 font-medium space-y-1">
              <div>
                Limiting: <span className="font-extrabold text-slate-800">{analysisResult.performance?.shelfLifeResult?.limitingFactor ?? "N/A"}</span>
              </div>
              <div className="text-[9px] text-slate-600">
                Source: <span className="font-extrabold text-slate-800">{analysisResult.performance?.shelfLifeResult?.sourceType || "N/A"}</span> (<span className="italic">{analysisResult.performance?.shelfLifeResult?.modelType || "N/A"}</span>)
              </div>
              {(!analysisResult.ingredients || analysisResult.ingredients.length === 0) && (
                <div className="text-[9px] text-amber-900 bg-amber-50 p-2 rounded leading-tight font-extrabold border border-amber-200 mt-1 uppercase">
                  ⚠️ 24 months is an engineering default used only when formulation data is absent. It is NOT a predicted or laboratory-validated shelf life.
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-700 font-black italic text-center uppercase tracking-wider">
          ⚠️ Scientific Diagnostics Model Forecasts — Confidences derived from raw chemical purity data & empirical correlations.
        </p>
      </div>

      {/* Formulation fractions chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} className="text-teal-600" /> Formulation Category Fractions
        </h4>
        <div className="space-y-3.5 text-xs">
          {analysisResult.surfactantPct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Surfactants</span>
                <span>{safeNum(analysisResult.surfactantPct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-blue-600 h-full" style={{ width: `${analysisResult.surfactantPct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.builderPct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Builders & Chelators</span>
                <span>{safeNum(analysisResult.builderPct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-amber-600 h-full" style={{ width: `${analysisResult.builderPct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.polymerPct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Polymers & Thickeners</span>
                <span>{safeNum(analysisResult.polymerPct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-teal-600 h-full" style={{ width: `${analysisResult.polymerPct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.electrolytePct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Electrolytes & Viscosity Modifiers</span>
                <span>{safeNum(analysisResult.electrolytePct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-purple-600 h-full" style={{ width: `${analysisResult.electrolytePct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.phAdjusterPct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>pH Adjusters</span>
                <span>{safeNum(analysisResult.phAdjusterPct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-orange-600 h-full" style={{ width: `${analysisResult.phAdjusterPct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.enzymePct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Enzymes</span>
                <span>{safeNum(analysisResult.enzymePct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-emerald-600 h-full" style={{ width: `${analysisResult.enzymePct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.waterPct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Solvents & Water Carriers</span>
                <span>{safeNum(analysisResult.waterPct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-indigo-600 h-full" style={{ width: `${analysisResult.waterPct}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.additivePct > 0 && (
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 mb-1">
                <span>Preservatives & Additives</span>
                <span>{safeNum(analysisResult.additivePct, 1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-rose-600 h-full" style={{ width: `${analysisResult.additivePct}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

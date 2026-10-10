import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CompatibilityRiskCardProps {
  analysisResult: any;
}

export function CompatibilityRiskCard({ analysisResult }: CompatibilityRiskCardProps) {
  if (!analysisResult) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pairwise alerts */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-500" /> Surfactant Compatibility Alerts (Phase 1H)
        </h4>
        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
          {(!analysisResult.compatibilityAlerts || analysisResult.compatibilityAlerts.length === 0) ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Highly Compatible - All pairwise checks passed successfully.
            </div>
          ) : (
            analysisResult.compatibilityAlerts.map((alert: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-xl border text-xs space-y-1 ${
                alert.severity === "Critical" ? "bg-red-50 border-red-200 text-red-900" :
                alert.severity === "High" ? "bg-red-50/50 border-red-100 text-red-800" :
                "bg-amber-50/50 border-amber-200 text-amber-800"
              }`}>
                <span className="font-extrabold uppercase text-[9px] tracking-wider block bg-white/60 px-1.5 py-0.5 rounded w-fit">
                  [{alert.severity}] {alert.type}
                </span>
                <p className="font-bold">{alert.description}</p>
                <p className="text-[10px] opacity-80">{alert.reason}</p>
                {alert.recommendation && (
                  <p className="text-[10px] font-bold mt-1 bg-white/30 p-1.5 rounded border border-black/5">
                    💡 Mixing recommendation: {alert.recommendation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Risk Analysis Alerts */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-500" /> Scientific Formulation Risk Warnings (Phase 1G)
        </h4>
        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
          {(!analysisResult.riskAnalysisWarnings || analysisResult.riskAnalysisWarnings.length === 0) ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Formulation within safe threshold balances.
            </div>
          ) : (
            analysisResult.riskAnalysisWarnings.map((warning: string, idx: number) => (
              <div key={idx} className="p-3 bg-amber-50/50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span className="font-semibold">{warning}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

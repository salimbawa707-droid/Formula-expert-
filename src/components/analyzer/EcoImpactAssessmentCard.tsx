import { Leaf } from "lucide-react";

interface EcoImpactAssessmentCardProps {
  analysisResult: any;
}

export function EcoImpactAssessmentCard({ analysisResult }: EcoImpactAssessmentCardProps) {
  if (!analysisResult || !analysisResult.complexEcoResult) return null;

  const eco = analysisResult.complexEcoResult;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Leaf size={14} className="text-emerald-600" /> Explainable Eco Impact Assessment (Credits & Deductions)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100/40">
          <span className="font-extrabold text-emerald-800 block mb-2 uppercase tracking-wide text-[10px]">
            ✓ Environmental Credits (Active Bonuses)
          </span>
          {(!eco.bonuses || eco.bonuses.length === 0) ? (
            <p className="text-gray-400 italic text-[11px] py-1">
              No active eco bonuses detected. Add plant-based active matter, biosurfactants, or enzymatic packages to gain points.
            </p>
          ) : (
            <div className="space-y-3.5 text-[11px] text-emerald-900">
              {eco.bonuses.map((b: any, idx: number) => (
                <div key={idx} className="border-b border-emerald-100/50 pb-2 last:border-0 last:pb-0 font-medium">
                  <div className="flex justify-between">
                    <span>
                      {b.name} <span className="text-gray-400 font-semibold text-[9px]">({b.type})</span>
                    </span>
                    <span className="font-black text-emerald-700">+{b.value} pts</span>
                  </div>
                  {b.publishedReference && (
                    <div className="text-[9px] text-emerald-600/90 font-semibold mt-0.5 pl-2 leading-snug">
                      Ref: {b.publishedReference}
                    </div>
                  )}
                  {b.calibrationBasis && (
                    <div className="text-[8px] text-gray-400 font-medium mt-0.5 pl-2 leading-snug">
                      Basis: {b.calibrationBasis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-rose-50/20 p-3.5 rounded-xl border border-rose-100/30">
          <span className="font-extrabold text-rose-800 block mb-2 uppercase tracking-wide text-[10px]">
            ✗ Ecotoxicity & Structural Penalties (Deductions)
          </span>
          {(!eco.deductions || eco.deductions.length === 0) ? (
            <p className="text-emerald-700 font-bold text-[11px] py-1">
              ✓ Excellent! No environmental toxicity or structural deductions active.
            </p>
          ) : (
            <div className="space-y-3.5 text-[11px] text-rose-900">
              {eco.deductions.map((d: any, idx: number) => (
                <div key={idx} className="border-b border-rose-100/40 pb-2 last:border-0 last:pb-0 font-medium">
                  <div className="flex justify-between">
                    <span>
                      {d.name} <span className="text-gray-400 font-semibold text-[9px]">({d.type})</span>
                    </span>
                    <span className="font-black text-rose-700">-{d.value} pts</span>
                  </div>
                  {d.publishedReference && (
                    <div className="text-[9px] text-rose-600/90 font-semibold mt-0.5 pl-2 leading-snug">
                      Ref: {d.publishedReference}
                    </div>
                  )}
                  {d.calibrationBasis && (
                    <div className="text-[8px] text-gray-400 font-medium mt-0.5 pl-2 leading-snug">
                      Basis: {d.calibrationBasis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {eco.certifications && eco.certifications.length > 0 ? (
        <div className="pt-3 border-t border-gray-100 space-y-2 text-[10px]">
          <span className="font-extrabold text-gray-500 uppercase tracking-wider block">
            Eco-Label Certification Assessment:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {eco.certifications.map((cert: any, idx: number) => {
              const isEligible = cert.status === "Eligible";
              const isReview = cert.status === "Requires Review";
              const badgeStyle = isEligible
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isReview
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200";
              const icon = isEligible ? "✓" : isReview ? "⚠️" : "✗";

              return (
                <div key={idx} className={`p-2.5 rounded-xl border ${badgeStyle} space-y-1`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[11px]">{cert.name}</span>
                    <span className="font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide bg-white/90 border border-current shadow-xs">
                      {icon} {cert.status}
                    </span>
                  </div>
                  {cert.reasons && cert.reasons.length > 0 ? (
                    <p className="text-[9px] opacity-90 leading-tight">
                      {cert.reasons.join("; ")}
                    </p>
                  ) : (
                    <p className="text-[9px] opacity-90 leading-tight">
                      Meets environmental & biodegradability criteria.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : eco.ecoLabelEligibility && eco.ecoLabelEligibility.length > 0 && (
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="font-extrabold text-gray-500 uppercase">Eco-Label Potential:</span>
          {eco.ecoLabelEligibility.map((lbl: string, idx: number) => (
            <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
              ✓ Eligible for {lbl}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import { Sparkles, Info, ArrowUpRight } from "lucide-react";

interface ActiveFingerprintCardProps {
  analysisResult: any;
  formulationResult: any;
  onExplainClick: (field: string) => void;
}

export function ActiveFingerprintCard({
  analysisResult,
  formulationResult,
  onExplainClick,
}: ActiveFingerprintCardProps) {
  if (!analysisResult) return null;

  const score = analysisResult.healthScoreBreakdown?.finalScore ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Gauge health score */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
        <div className="absolute top-2 right-2 bg-teal-50 text-[#0f766e] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
          Health Check
        </div>
        <span className="text-xs text-slate-600 font-extrabold uppercase tracking-wide">Lab Health Score</span>
        
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-teal-600"
              strokeWidth="3.5"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-slate-900">{score}</span>
            <span className="text-[9px] text-slate-600 font-bold uppercase">Points</span>
          </div>
        </div>

        <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full ${
          score >= 85 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
          score >= 70 ? "bg-teal-50 text-teal-800 border border-teal-200" :
          score >= 50 ? "bg-amber-50 text-amber-800 border border-amber-200" :
          "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {score >= 85 ? "Excellent" :
           score >= 70 ? "Good" :
           score >= 50 ? "Average" : "Poor"}
        </span>
      </div>

      {/* Commercial Fingerprint Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-3 flex flex-col justify-between space-y-3">
        <div 
          onClick={() => onExplainClick("classification")}
          className="flex justify-between items-start cursor-pointer group hover:bg-gray-50/70 p-2 -m-2 rounded-xl transition-all border border-transparent hover:border-gray-100"
          title="Click to view full Formula Classification details"
        >
          <div>
            <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
              Automatic Classification <ArrowUpRight size={10} className="text-slate-500 group-hover:text-teal-600 transition-colors" />
            </span>
            {(() => {
              const classification = 
                formulationResult?.grade === "Premium" ? "Premium Tier" : 
                formulationResult?.grade === "Standard" ? "Standard Tier" : 
                "Budget Tier";
              return (
                <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1.5 font-display group-hover:text-teal-700 transition-colors">
                  <Sparkles size={16} className="text-teal-600 group-hover:scale-110 transition-transform" />
                  {classification} - {analysisResult.fingerprint?.formulaType || "Unknown Type"}
                </h3>
              );
            })()}
          </div>
          <span className="bg-teal-50 text-[#0f766e] text-[10px] font-black px-2.5 py-1 rounded-full border border-teal-200 font-mono flex items-center gap-1 transition-all group-hover:bg-teal-100/60">
            Fingerprint Active <Sparkles size={10} className="animate-pulse" />
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Surfactant Base Tag */}
          <div 
            onClick={() => onExplainClick("fingerprintSurfactant")}
            className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all flex flex-col justify-between"
            title="Click for Surfactant Base Diagnostics"
          >
            <span className="text-[9px] text-slate-600 font-bold block uppercase flex items-center justify-between">
              Surfactant base
              <Info size={10} className="text-slate-500" />
            </span>
            <span className="font-extrabold text-slate-800 mt-1 block truncate">{analysisResult.fingerprint?.surfactantSystem || "None"}</span>
          </div>

          {/* Builder Setup Tag */}
          <div 
            onClick={() => onExplainClick("fingerprintBuilder")}
            className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all flex flex-col justify-between"
            title="Click for Builder Setup Diagnostics"
          >
            <span className="text-[9px] text-slate-600 font-bold block uppercase flex items-center justify-between">
              Builder setup
              <Info size={10} className="text-slate-500" />
            </span>
            <span className="font-extrabold text-slate-800 mt-1 block truncate">{analysisResult.fingerprint?.builderSystem || "None"}</span>
          </div>

          {/* Regulatory Eco Tag */}
          <div 
            onClick={() => onExplainClick("fingerprintEco")}
            className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all flex flex-col justify-between"
            title="Click for Regulatory Eco Diagnostics"
          >
            <span className="text-[9px] text-slate-600 font-bold block uppercase flex items-center justify-between">
              Regulatory eco
              <Info size={10} className="text-slate-500" />
            </span>
            <span className="font-extrabold text-slate-800 mt-1 block truncate">{analysisResult.fingerprint?.ecoLevel || "None"}</span>
          </div>

          {/* Carbon Profile Tag */}
          <div 
            onClick={() => onExplainClick("fingerprintCarbon")}
            className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all flex flex-col justify-between"
            title="Click for Carbon Profile Diagnostics"
          >
            <span className="text-[9px] text-slate-600 font-bold block uppercase flex items-center justify-between">
              Carbon Profile
              <Info size={10} className="text-slate-500" />
            </span>
            <span className={`font-extrabold mt-1 block truncate ${analysisResult.carbonFootprint === "Low" ? "text-emerald-800" : "text-amber-800"}`}>
              🌱 {analysisResult.carbonFootprint || "Unknown"} Footprint
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

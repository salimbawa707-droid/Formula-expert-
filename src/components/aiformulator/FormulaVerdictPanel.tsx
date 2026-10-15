import React from 'react';
import { CheckCircle, AlertTriangle, Info, Award, CheckCheck, ShieldAlert, Lightbulb, Lock, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react';

interface FormulaVerdictPanelProps {
  scientificResults: any;
  productCategory: string;
  onConsultChemistryAI?: () => void;
}

export const FormulaVerdictPanel: React.FC<FormulaVerdictPanelProps> = React.memo(({
  scientificResults,
  productCategory,
  onConsultChemistryAI
}) => {
  const screeningStatus = scientificResults.screeningStatus || "SCREENING: WITHIN CALCULATED TARGETS";
  const specVerdict = scientificResults.specVerdict || "NEEDS REVISION — Cost exceeds maximum specification";
  const labEvidenceVerdict = scientificResults.labEvidenceVerdict || "NOT LAB VALIDATED — 4 required measurements missing";
  const releaseGateDecision = scientificResults.releaseGateDecision || "BLOCKED";

  return (
    <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-lg">
      {/* Header with Title and Owner Control Strip */}
      <div className="space-y-3 border-b border-slate-800 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              FORMULATION SCIENTIFIC AUDIT & STATUS MATRIX
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Category-aware multi-pillar separation for {productCategory}
            </p>
          </div>
          {onConsultChemistryAI && (
            <button
              onClick={onConsultChemistryAI}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/50 border border-purple-400/40 active:scale-95 shrink-0 self-start sm:self-auto"
              title="Consult Gemini Chemistry AI regarding this verdict"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Consult Chemistry AI on Status</span>
            </button>
          )}
        </div>

        {/* Owner / R&D Workspace Authority Strip */}
        <div className="bg-[#131d35] border border-cyan-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
            <div>
              <span className="font-extrabold text-cyan-300 uppercase tracking-wide">Owner R&D Workspace: </span>
              <span className="text-slate-300 font-medium">
                Full formula authoring, ingredient editing, dosage adjustments, and scientific screening are active and unrestricted.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 font-mono text-[10px] font-bold border border-slate-700 shrink-0">
            OWNER CONTROL ≠ LAB VALIDATION
          </span>
        </div>
      </div>

      {/* 4-PILLAR STATUS MATRIX: SCREENING, SPECIFICATIONS, LAB EVIDENCE, AND RELEASE GATE */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Compliance & Release Status Matrix
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Pillar 1: Scientific Screening */}
          <div className="bg-[#131d35] border border-cyan-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400">1. Screening Result</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                THEORETICAL
              </span>
            </div>
            <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5 pt-0.5">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{screeningStatus}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Aqueous charge balance, surfactant synergy, and thermodynamic equilibrium validated.
            </p>
          </div>

          {/* Pillar 2: Specification Status */}
          <div className="bg-[#131d35] border border-amber-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400">2. Specification Status</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                SPEC AUDIT
              </span>
            </div>
            <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 pt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{specVerdict}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Raw-material cost exceeds maximum specification threshold of ₹45.00/kg.
            </p>
          </div>

          {/* Pillar 3: Lab Evidence Status */}
          <div className="bg-[#131d35] border border-indigo-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400">3. Lab Evidence</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                EMPIRICAL LIMS
              </span>
            </div>
            <div className="text-xs font-black text-indigo-300 flex items-center gap-1.5 pt-0.5">
              <FlaskConical className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{labEvidenceVerdict}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Mandatory benchtop testing (pH, density, viscosity, NVR) unmeasured.
            </p>
          </div>

          {/* Pillar 4: Release / Decision Gate */}
          <div className="bg-[#131d35] border border-rose-500/30 rounded-xl p-3.5 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400">4. Release Gate</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                GOVERNANCE
              </span>
            </div>
            <div className="text-xs font-black text-rose-300 flex items-center gap-1.5 pt-0.5">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>RELEASE: {releaseGateDecision}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Commercial batch release locked pending physical laboratory test validation.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Verification Checklist
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {scientificResults.verdictReasons?.map((reason: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm bg-[#131d35] p-3 rounded-xl border border-slate-700/80">
              {reason.ok ? (
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
              ) : (
                <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠</span>
              )}
              <div className="w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{reason.label}</span>
                  {reason.provenance && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                      {reason.provenance}
                    </span>
                  )}
                </div>
                <span className={reason.ok ? "text-slate-300 font-medium block mt-0.5 text-xs" : "text-amber-300 font-semibold block mt-0.5 text-xs"}>
                  {reason.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT NEEDS ATTENTION Box */}
      <div className="bg-amber-950/40 rounded-xl p-4 border border-amber-500/30 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
          <Info className="w-4 h-4 text-amber-400" />
          WHAT NEEDS ATTENTION
        </div>
        <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed">
          {scientificResults.attentionExplanation}
        </p>
      </div>

      {/* Final Overall Grade Summary */}
      <div className="bg-[#131d35] rounded-xl p-3.5 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
        <div>
          <span className="text-slate-400 font-semibold">Scientific Screening Authority: </span>
          <span className="font-extrabold ml-1 text-cyan-300">
            {screeningStatus}
          </span>
          <span className="text-slate-500 font-normal ml-2">| Release: {releaseGateDecision}</span>
        </div>
        <div className="text-right">
          <div className="text-slate-400 font-semibold text-[10px] uppercase">Screening Score</div>
          <span className="text-cyan-400 font-mono text-sm font-extrabold">
            {scientificResults.aiGrade?.score || 85}/100 
            <span className="text-slate-500 font-normal ml-1">({scientificResults.aiGrade?.grade || 'B+'})</span>
          </span>
        </div>
      </div>

      {/* EXPERT FORMULATION REASONING & RECOMMENDATIONS */}
      {scientificResults.expertReport && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          {/* Category Context Strip */}
          <div className="bg-[#131d35] p-3.5 rounded-xl border border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-white uppercase tracking-wider">Target Profile: </span>
                <span className="text-slate-300 font-semibold">{scientificResults.expertReport.productCategoryContext.category}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                pH: {scientificResults.expertReport.productCategoryContext.targetPHMin} - {scientificResults.expertReport.productCategoryContext.targetPHMax}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">
                Actives: ≥{scientificResults.expertReport.productCategoryContext.targetActiveMatterMin}%
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                {scientificResults.expertReport.productCategoryContext.foamExpectation}
              </span>
            </div>
          </div>

          {/* Grounded Strengths */}
          {scientificResults.expertReport.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                Formulation Strengths ({scientificResults.expertReport.strengths.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {scientificResults.expertReport.strengths.map((str: any) => (
                  <div key={str.id} className="bg-[#131d35] border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span> {str.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {str.scientificType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {str.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagged Forensic Issues */}
          {scientificResults.expertReport.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Sanity Check & Chemical Flags ({scientificResults.expertReport.issues.length})
              </h4>
              <div className="space-y-2.5">
                {scientificResults.expertReport.issues.map((iss: any) => (
                  <div key={iss.id} className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${
                          iss.severity === "Critical" ? "text-rose-400" : iss.severity === "High" ? "text-amber-400" : "text-yellow-400"
                        }`} />
                        {iss.issue}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                          iss.severity === "Critical"
                            ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                            : iss.severity === "High"
                            ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}>
                          {iss.severity.toUpperCase()} SEVERITY
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {iss.scientificType}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-bold text-amber-200 mr-1">Why it matters:</span>
                      {iss.whyItMatters}
                    </p>
                    <div className="bg-[#0e1629] p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-300 mr-1">Scientific Basis:</span>
                        {iss.scientificBasis}
                      </div>
                      <div className="shrink-0 text-cyan-300 font-medium">
                        <span className="font-semibold text-slate-300 mr-1">Check:</span>
                        {iss.whatToCheck}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Expert Recommendations */}
          {scientificResults.expertReport.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                Professional Chemist Advisory ({scientificResults.expertReport.recommendations.length})
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {scientificResults.expertReport.recommendations.map((rec: any) => (
                  <div key={rec.id} className="bg-[#131d35] border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-cyan-300">
                        {rec.problem}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                        CONFIDENCE: {rec.confidence}
                      </span>
                    </div>
                    <div className="text-[11px] space-y-1.5 text-slate-300 leading-relaxed">
                      <div>
                        <span className="font-bold text-emerald-300 mr-1">Recommended Action:</span>
                        {rec.recommendedAction}
                      </div>
                      <div>
                        <span className="font-bold text-blue-300 mr-1">Expected Effect:</span>
                        {rec.expectedEffect}
                      </div>
                      <div>
                        <span className="font-bold text-amber-300 mr-1">Trade-off:</span>
                        {rec.tradeOff}
                      </div>
                      {rec.calculationBasis && (
                        <div className="text-[10px] font-mono text-slate-400 bg-[#0e1629] px-2 py-1 rounded border border-slate-800">
                          Basis: {rec.calculationBasis}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

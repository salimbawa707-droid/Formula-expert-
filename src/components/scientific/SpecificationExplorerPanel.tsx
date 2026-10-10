import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { CanonicalFormulaEvaluationResult } from '../../utils/orchestrator/types';

interface SpecificationExplorerPanelProps {
  evaluationResult: CanonicalFormulaEvaluationResult;
}

export const SpecificationExplorerPanel: React.FC<SpecificationExplorerPanelProps> = ({ evaluationResult }) => {
  const {
    pHResult,
    activeMatterResult,
    viscosityResult,
    densityResult,
    specificationStatus,
    blockingIssues,
    errors,
    warnings,
    aiGrade
  } = evaluationResult;

  const specs = [
    {
      parameter: 'Equilibrium pH',
      calculated: pHResult.ph.toFixed(2),
      unit: '',
      status: pHResult.ph >= 4 && pHResult.ph <= 11.5 ? 'PASS' : 'WARN',
      provenance: 'PHEngineV2'
    },
    {
      parameter: 'Total Active Surfactants',
      calculated: `${activeMatterResult.totalSurfactantActivePct.toFixed(2)}%`,
      unit: '%',
      status: activeMatterResult.meetsCategoryMin ? 'PASS' : 'FAIL',
      provenance: 'ActiveMatterEngine'
    },
    {
      parameter: 'Viscosity Rating',
      calculated: viscosityResult.rating || 'N/A',
      unit: 'cP',
      status: viscosityResult.rating !== 'UNSTABLE' ? 'PASS' : 'WARN',
      provenance: 'viscosityEngine'
    },
    {
      parameter: 'Density / Specific Gravity',
      calculated: `${densityResult.densityGPerCm3} g/cm³`,
      unit: 'g/cm³',
      status: densityResult.densityGPerCm3 >= 0.8 && densityResult.densityGPerCm3 <= 1.5 ? 'PASS' : 'WARN',
      provenance: 'densityEngine'
    }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-[#0e1629] border border-cyan-500/30 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                SPECIFICATION & QUALITY GATE EXPLORER
              </h3>
              <p className="text-xs text-slate-400">
                Authoritative breakdown of specification compliance, quality gate findings, and grade impact.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className={`px-3 py-1 rounded-full font-extrabold border ${
                specificationStatus === 'PASS'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950 text-amber-300 border-amber-500/50'
              }`}
            >
              Gate Status: {specificationStatus}
            </span>
            <span className="px-3 py-1 rounded-full font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
              Grade: {aiGrade.grade}
            </span>
          </div>
        </div>

        {/* SPECIFICATION COMPARISON TABLE */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
            Target vs Calculated Specification Analysis
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b1324] text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                  <th className="p-2.5">Parameter</th>
                  <th className="p-2.5">Calculated Value</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Authoritative Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {specs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 font-mono">
                    <td className="p-2.5 font-sans font-bold text-white">{s.parameter}</td>
                    <td className="p-2.5 text-cyan-300 font-bold">{s.calculated}</td>
                    <td className="p-2.5">
                      {s.status === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      ) : s.status === 'WARN' ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> WARN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-400 text-[11px]">{s.provenance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRIGGERED QUALITY GATE FINDINGS */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
            Quality Gate Findings & Rules
          </span>

          {blockingIssues.length === 0 && errors.length === 0 && warnings.length === 0 ? (
            <div className="bg-[#0b1324] border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero critical findings. Formula meets all quality gate parameters cleanly.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {blockingIssues.map((issue, idx) => (
                <div key={idx} className="bg-red-950/40 border border-red-500/40 rounded-lg p-3 text-xs text-red-200 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-red-300">
                    <AlertOctagon className="w-4 h-4 text-red-400" /> [BLOCKING] {issue.title || issue.code}
                  </div>
                  <p className="text-[11px] text-red-200/90">{issue.message}</p>
                </div>
              ))}

              {warnings.map((warn, idx) => (
                <div key={idx} className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> [WARNING] {warn.title || warn.code}
                  </div>
                  <p className="text-[11px] text-amber-200/90">{warn.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

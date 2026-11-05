import React from 'react';
import type { ScientificDecisionReport } from '../../utils/scientificDecisionEngine';

interface ScientificDecisionPanelProps {
  report: ScientificDecisionReport;
}

const STATUS_LABELS: Record<ScientificDecisionReport['formulaStatus'], string> = {
  NO_BLOCKING_RULE_FINDINGS: 'No blocking rule findings',
  SCREENING_CONCERNS: 'Screening concerns',
  CRITICAL_ISSUES: 'Critical rule findings',
  INFORMATION_REQUIRED: 'More information required',
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return 'Unavailable';
  if (typeof value === 'number') return Number.isFinite(value) ? String(Number(value.toFixed(4))) : 'Unavailable';
  if (typeof value === 'string' || typeof value === 'boolean') return String(value);
  return 'Structured value';
}

export const ScientificDecisionPanel: React.FC<ScientificDecisionPanelProps> = ({ report }) => {
  if (!report) {
    return null;
  }

  const properties = Object.entries(report?.propertyDecisions || {});
  const problems = report?.problems || [];
  const recommendations = report?.recommendations || [];
  const hasFindings = problems.length > 0 || recommendations.length > 0;

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 md:p-5 space-y-4" aria-label="Rule-based scientific decision support">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-wide">Rule-Based Decision Support</h3>
          <p className="text-xs text-slate-400 mt-1">Screening guidance derived from the current authoritative formula evaluation.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-[11px] font-bold text-cyan-200">
          {report?.formulaStatus ? (STATUS_LABELS[report.formulaStatus] || report.formulaStatus) : 'Decision Support'}
        </span>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
        This panel is rule-based decision support, not a scientific or laboratory certification. Predicted and calculated values remain distinct from verified measurements and supplier COAs.
      </div>

      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {properties.map(([key, item]) => (
            <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{item.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-base font-extrabold text-white mt-1 break-words">{displayValue(item.value)}</div>
              <div className="text-[10px] text-cyan-300 mt-1">Evidence: {item.provenance.replace(/_/g, ' ')}</div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{item.notes}</p>
            </div>
          ))}
        </div>
      )}

      {problems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-200">Problems requiring attention ({problems.length})</h4>
          {problems.map(problem => (
            <article key={problem.id} className="rounded-lg border border-rose-500/25 bg-rose-950/15 p-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">{problem.property}</span>
                <span className="text-[9px] font-bold text-rose-200 border border-rose-500/30 rounded px-2 py-0.5">{problem.severity}</span>
                <span className="text-[9px] text-slate-400">Evidence: {problem.evidence}</span>
              </div>
              <p className="text-xs text-slate-200">{problem.problem}</p>
              <p className="text-[11px] text-slate-400">Possible root cause: {problem.rootCause}</p>
              <p className="text-[11px] text-cyan-200">Next review: {problem.recommendedAction}</p>
            </article>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-200">Screening recommendations ({recommendations.length})</h4>
          {recommendations.map(item => (
            <article key={item.id} className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">{item.recommendedChange}</span>
                <span className="text-[9px] text-cyan-200 border border-cyan-500/30 rounded px-2 py-0.5">{item.category.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-[11px] text-slate-300">{item.reason}</p>
              <p className="text-[11px] text-slate-400">Expected impact: {item.expectedImpact}</p>
              <p className="text-[10px] text-slate-500">Maturity: {item.modelMaturity} · Uncertainty: {item.uncertainty}</p>
              {(item.limitations?.length ?? 0) > 0 && <p className="text-[10px] text-amber-200">Limitations: {(item.limitations || []).join(' ')}</p>}
            </article>
          ))}
        </div>
      )}

      {!hasFindings && (
        <p className="text-xs text-slate-400">No rule-based problem or recommendation was emitted for this evaluation. This does not establish physical performance, stability, safety, or regulatory compliance.</p>
      )}

      <div className="border-t border-slate-800 pt-2 flex flex-wrap justify-between gap-2 text-[9px] text-slate-500 font-mono">
        <span>Formula fingerprint: {report.formulaFingerprint || 'PENDING'}</span>
        <span>Evaluated: {report.evaluatedAt ? new Date(report.evaluatedAt).toLocaleString() : 'N/A'}</span>
      </div>
    </section>
  );
};

export default ScientificDecisionPanel;

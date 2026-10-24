import React, { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VaultState, ProjectPhase } from '../../domain/vault/types';
import { canUnlockPhase5 } from '../../utils/vault/vaultLogic';

interface RoadmapViewProps {
  state: VaultState;
  onSelectPhase?: (phaseId: string) => void;
  onAddPhase?: (newPhase: ProjectPhase) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  state,
}) => {
  const [expandedPhaseId, setExpandedPhaseId] = useState<string>('phase-4b');

  const phase5Check = canUnlockPhase5(state);

  const getStatusBadge = (phase: ProjectPhase) => {
    switch (phase.status) {
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Reported Closed
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            ACTIVE / OPEN (Phase 4B)
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            LOCKED (Gate Enforced)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            Pending
          </span>
        );
    }
  };

  const getVerificationBadge = (verificationStatus: string) => {
    switch (verificationStatus) {
      case 'CONFIRMED':
        return (
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            VERIFIED: Independent Confirmed
          </span>
        );
      case 'UNESTABLISHED':
        return (
          <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
            UNVERIFIED: Independent Check Unestablished
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-[11px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
            AUDIT DECISION: Rejected / Incomplete
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Discrepancy Alert */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              <span>Scientific Remediation Phase Roadmap</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Structured sequence of scientific remediation phases, gate requirements, and audit verification states.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              Phase 4B: OPEN &bull; Phase 5: LOCKED
            </span>
          </div>
        </div>

        {/* Phase 5 Gate Enforcement Warning */}
        <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-200 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-300">Phase 5 Mandatory Gate Condition:</span>
            <p className="text-slate-300">
              Phase 5 (Numerical Validation &amp; Calibration) is strictly LOCKED. It cannot begin until
              Phase 4B has been independently reviewed and explicitly approved. Current Gate Status:{' '}
              <span className="font-mono text-red-300 font-semibold">{phase5Check.reason}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Timeline of Phases */}
      <div className="space-y-4">
        {state.phases.map((phase, idx) => {
          const isExpanded = expandedPhaseId === phase.phaseId;
          const isPhase4B = phase.phaseId === 'phase-4b';
          const isPhase5 = phase.phaseId === 'phase-5';

          return (
            <div
              key={phase.phaseId}
              className={`border rounded-xl transition overflow-hidden ${
                isPhase4B
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                  : isPhase5
                  ? 'bg-slate-900/60 border-red-900/40 opacity-90'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Collapsible Header */}
              <div
                onClick={() => setExpandedPhaseId(isExpanded ? '' : phase.phaseId)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      phase.status === 'CLOSED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isPhase4B
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-100">{phase.name}</h3>
                      {getStatusBadge(phase)}
                    </div>
                    <p className="text-xs text-slate-400">{phase.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {getVerificationBadge(phase.independentVerificationStatus)}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Phase Content */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-xs">
                  {/* Phase Description */}
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-300 leading-relaxed">
                    <p>{phase.description}</p>
                  </div>

                  {/* Special Phase 4B Reconciled Notice */}
                  {isPhase4B && (
                    <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Engine Inventory Reconciliation &amp; Blocker Tracking</span>
                      </div>
                      <p className="text-slate-300">
                        The source audit separates four non-equivalent counts: 59 unique paths in the legacy list, 62 Engine-named source files outside UI components (65 including UI components), 94 broad source candidates, and six top-level vault registry records. The historical 64 and 97 claims remain unverified because their original source artifacts were not found. See ENGINE_COUNT_RECONCILIATION_2026-10-25.md.
                      </p>
                      <p className="text-rose-300 font-medium">
                        Latest reported blocker: The SurfPro ZIP is not available in the Google AI Studio runtime
                        workspace. No experimental dataset has been numerically inspected according to the latest report.
                      </p>
                    </div>
                  )}

                  {/* Phase 1 Pricing Integrity Notice */}
                  {phase.phaseId === 'phase-1' && (
                    <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-lg space-y-1 text-slate-300">
                      <span className="font-semibold text-cyan-300">Pricing Integrity Verification:</span>
                      <p>
                        Preserve unknown raw-material prices as null/unknown, not fabricated zero ($0.00). Formulations
                        with missing prices are flagged with an explicit warning and do not return an artificially low cost.
                      </p>
                    </div>
                  )}

                  {/* Phase 3 Remediation Notice */}
                  {phase.phaseId === 'phase-3' && (
                    <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-lg space-y-1 text-slate-300">
                      <span className="font-semibold text-purple-300">Phase 3 Remediation Verification Notice:</span>
                      <p>
                        Fixes F3-01 (Davies activity coefficient), F3-02 (Rubingh RST mixed micelle), and F3-03
                        (Conditional chelation stability) are reported complete in code, but independent laboratory
                        validation remains <strong>UNESTABLISHED</strong>. Internal tests alone do not constitute
                        experimental proof.
                      </p>
                    </div>
                  )}

                  {/* Blockers */}
                  {phase.blockers.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-semibold text-red-300 flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                        Known Blockers:
                      </span>
                      <ul className="space-y-1 pl-4 list-disc text-slate-300">
                        {phase.blockers.map((blocker, bIdx) => (
                          <li key={bIdx} className="text-red-200">
                            {blocker}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Deliverables & Verification Checklist */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-200">Deliverables &amp; Audit Trail:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {phase.keyDeliverables.map((del, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-2.5 bg-slate-950/70 border border-slate-800/70 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-start gap-2">
                            {del.status === 'DONE' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : del.status === 'BLOCKED' ? (
                              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-medium text-slate-200">{del.title}</div>
                              {del.notes && <div className="text-[11px] text-slate-400 mt-0.5">{del.notes}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                del.status === 'DONE'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : del.status === 'BLOCKED'
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              }`}
                            >
                              {del.status}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                del.verified
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {del.verified ? 'Verified' : 'Unverified Claim'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Closure & Metadata Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span>
                      Closure Report:{' '}
                      <strong className="text-slate-300">
                        {phase.closureReportDate || 'Phase Open (In Progress)'}
                      </strong>
                    </span>
                    <span>
                      Independent Reviewer Status:{' '}
                      <strong className="text-slate-300">{phase.independentVerificationStatus}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

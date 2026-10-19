import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldAlert,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  GitCommit,
  AlertOctagon,
} from 'lucide-react';
import { AuditRecord, VaultState } from '../../domain/vault/types';

interface AuditsViewProps {
  state: VaultState;
  onSelectAudit?: (audit: AuditRecord) => void;
  onAddAudit: () => void;
}

export const AuditsView: React.FC<AuditsViewProps> = ({
  state,
  onAddAudit,
  onSelectAudit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAudits = state.audits.filter(audit => {
    const matchesSearch =
      audit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.repoCommitOrZipHash.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> PENDING REVIEW
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {severity}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Forensic Scientific Audit Log
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800">
                {state.audits.length} Audits Filed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Immutable audit records, code inspections, environment limitations, and independent reviewer decisions.
            </p>
          </div>

          <button
            onClick={onAddAudit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Forensic Audit
          </button>
        </div>

        {/* Fact vs AI Claim Distinction Notice */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-purple-300">
              Audit Standard: Distinguishing AI Claims from Verified Facts
            </span>
            <p>
              Findings are categorized strictly: <strong className="text-emerald-400">Verified Fact</strong> requires
              reproducible test output or confirmed git diff. Findings marked{' '}
              <strong className="text-amber-400">AI Claim Only</strong> have not been verified independently.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audits by ID, phase, scope, or commit hash..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Audits List */}
      <div className="space-y-4">
        {filteredAudits.map(audit => (
          <div
            key={audit.id}
            onClick={() => onSelectAudit?.(audit)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 transition cursor-pointer shadow-sm"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-800">
                  {audit.id}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {audit.phase}
                </span>
                <span className="text-[11px] text-slate-400">
                  Date: {audit.date}
                </span>
              </div>

              <div>{getApprovalBadge(audit.approvalStatus)}</div>
            </div>

            {/* Scope & Commit */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">{audit.scope}</h3>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Commit / Hash:</span>
                <span className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {audit.repoCommitOrZipHash}
                </span>
              </div>
            </div>

            {/* Findings list */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Audit Findings ({audit.findings.length}):
              </span>
              <div className="space-y-1.5">
                {audit.findings.map(finding => (
                  <div
                    key={finding.id}
                    className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(finding.severity)}
                        <span className="font-mono text-[10px] text-slate-400">
                          {finding.id}
                        </span>
                        {finding.verifiedFact && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            &bull; Verified Fact
                          </span>
                        )}
                        {finding.aiClaimOnly && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            &bull; AI Claim (Unverified)
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 mt-1">{finding.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tool / Environment Limitations Callout */}
            {audit.toolEnvironmentLimitations && (
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs text-slate-400 flex items-start gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-300">Tool / Environment Limitation:</strong>{' '}
                  <span>{audit.toolEnvironmentLimitations}</span>
                </div>
              </div>
            )}

            {/* Reproducible Evidence & Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
              <div className="truncate max-w-md">
                <strong>Evidence:</strong> {audit.reproducibleEvidence}
              </div>
              <div className="text-cyan-400 font-medium">
                Reviewer Decision: {audit.independentReviewerDecision} &rarr;
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

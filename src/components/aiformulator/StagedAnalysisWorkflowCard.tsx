import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Check,
  Copy,
  Sparkles
} from 'lucide-react';
import {
  StageExecutionRecord,
  OverallWorkflowStatus,
  ForensicAuditReport,
  StagedWorkflowProgress
} from '../../utils/analysisWorkflowEngine';

interface StagedAnalysisWorkflowCardProps {
  isAnalyzing: boolean;
  workflowProgress: StagedWorkflowProgress | null;
  forensicReport: ForensicAuditReport | null;
  currentLiveFingerprint: string;
  onCancelAnalysis?: () => void;
  onRetryAnalysis: () => void;
  onConsultChemistryAI?: () => void;
}

export const StagedAnalysisWorkflowCard: React.FC<StagedAnalysisWorkflowCardProps> = ({
  isAnalyzing,
  workflowProgress,
  forensicReport,
  currentLiveFingerprint,
  onCancelAnalysis,
  onRetryAnalysis,
  onConsultChemistryAI
}) => {
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [showFullForensicTrace, setShowFullForensicTrace] = useState<boolean>(false);
  const [copiedFp, setCopiedFp] = useState(false);

  if (!workflowProgress && !forensicReport) {
    return null;
  }

  const status = isAnalyzing
    ? 'RUNNING'
    : (workflowProgress?.status || (forensicReport?.overallConsistencyStatus === 'FAILED' ? 'FAILED' : 'COMPLETED'));
  const stages = workflowProgress?.stages || [];
  const currentStageId = workflowProgress?.currentStageId;
  const completedCount = workflowProgress?.completedStageCount ?? stages.filter(s => s.status === 'COMPLETED' || s.status === 'COMPLETED_WITH_WARNINGS').length;
  const totalCount = stages.length || 11;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const analyzedFp = forensicReport?.analyzedFingerprint || workflowProgress?.intermediateResults?.['SNAPSHOT_VALIDATION']?.fingerprint || 'FP-PENDING';
  const isRevisionMatched = analyzedFp === currentLiveFingerprint;

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(analyzedFp);
    setCopiedFp(true);
    setTimeout(() => setCopiedFp(false), 2000);
  };

  const getStatusBadge = (s: OverallWorkflowStatus) => {
    switch (s) {
      case 'RUNNING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Analyzing Formulation
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Analysis Completed
          </span>
        );
      case 'COMPLETED_WITH_WARNINGS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-950/90 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Completed with Warnings
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-950/90 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Analysis Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 shadow-sm">
            <RotateCcw className="w-3.5 h-3.5" />
            Analysis Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getStageIcon = (stageStatus: StageExecutionRecord['status']) => {
    switch (stageStatus) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'COMPLETED_WITH_WARNINGS':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'RUNNING':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
        );
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'BLOCKED':
        return <AlertTriangle className="w-4 h-4 text-rose-300/60 shrink-0" />;
      case 'SKIPPED':
        return <Clock className="w-4 h-4 text-slate-500 shrink-0" />;
      case 'PENDING':
      default:
        return <Clock className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  return (
    <div className="bg-[#0b1324] border border-cyan-500/40 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            status === 'RUNNING'
              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 animate-pulse'
              : status === 'FAILED'
              ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              : status === 'COMPLETED_WITH_WARNINGS'
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                SCIENTIFIC FORMULA ANALYSIS WORKFLOW
              </h3>
              {getStatusBadge(status)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dependency-ordered multi-engine calculation with live intermediate capture and forensic audit
            </p>
          </div>
        </div>

        {/* Action Controls: Cancel or Retry */}
        <div className="flex items-center gap-2 shrink-0">
          {status === 'RUNNING' && onCancelAnalysis && (
            <button
              onClick={onCancelAnalysis}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold text-slate-300 transition cursor-pointer active:scale-95"
            >
              Cancel Analysis
            </button>
          )}

          {(status === 'FAILED' || status === 'CANCELLED' || status === 'COMPLETED_WITH_WARNINGS') && (
            <button
              onClick={onRetryAnalysis}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-950/40 border border-cyan-400/40 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          )}

          {onConsultChemistryAI && (
            <button
              onClick={onConsultChemistryAI}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/50 border border-purple-400/40 active:scale-95"
              title="Consult Gemini Chemistry AI about this formula analysis"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Consult Chemistry AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Visible during running or staged progression) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono font-bold">
            Execution Progress: <span className="text-cyan-300">{completedCount} of {totalCount} stages completed</span>
          </span>
          <span className="font-mono font-bold text-white">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-[#131d35] h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ease-out rounded-full ${
              status === 'FAILED'
                ? 'bg-rose-500'
                : status === 'COMPLETED_WITH_WARNINGS'
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Revision & Fingerprint Verification Banner */}
      <div className="bg-[#101a33] border border-slate-700/80 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-token-muted font-bold uppercase tracking-wider text-[11px]">
            Analyzed Revision:
          </span>
          <button
            onClick={handleCopyFingerprint}
            className="font-mono font-extrabold text-cyan-300 bg-[#0b1324] px-2.5 py-1 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            title="Click to copy analyzed fingerprint"
          >
            <span>{analyzedFp}</span>
            {copiedFp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
          </button>
          {isRevisionMatched ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              ✓ Revision Synced
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Formula Modified Mid-Run
            </span>
          )}
        </div>

        {forensicReport && (
          <div className="text-token-muted font-mono text-[11px] sm:text-right">
            Total calculation runtime: <span className="text-white font-bold">{forensicReport.durationTotalMs} ms</span>
          </div>
        )}
      </div>

      {/* Staged Execution Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-token-muted font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">
          <span>Scientific Execution Dependency Sequence</span>
          <span>Status & Latency</span>
        </div>

        <div className="space-y-2">
          {stages.map((stage) => {
            const isExpanded = expandedStageId === stage.stageId;
            const isCurrent = currentStageId === stage.stageId;

            return (
              <div
                key={stage.stageId}
                className={`rounded-xl border transition-all text-xs overflow-hidden ${
                  isCurrent
                    ? 'bg-[#142345] border-cyan-400/60 shadow-lg shadow-cyan-950/40'
                    : stage.status === 'COMPLETED'
                    ? 'bg-[#0e172e]/80 border-slate-800 hover:border-slate-700'
                    : stage.status === 'COMPLETED_WITH_WARNINGS'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : stage.status === 'FAILED'
                    ? 'bg-rose-950/40 border-rose-500/50'
                    : stage.status === 'BLOCKED'
                    ? 'bg-slate-900/60 border-slate-800/60 opacity-60'
                    : 'bg-[#0e1629]/40 border-slate-800/40 opacity-70'
                }`}
              >
                <div
                  onClick={() => setExpandedStageId(isExpanded ? null : stage.stageId)}
                  className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5 shrink-0">
                      #{stage.order}
                    </span>
                    {getStageIcon(stage.status)}
                    <div className="min-w-0">
                      <div className="font-extrabold text-white truncate flex items-center gap-2">
                        <span>{stage.label}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                            Executing...
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        Engine: <span className="text-slate-300">{stage.engineName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 font-mono text-[11px]">
                    {stage.durationMs > 0 && (
                      <span className="text-slate-400 bg-[#0b1324] px-2 py-0.5 rounded border border-slate-800">
                        {stage.durationMs} ms
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[10px] ${
                      stage.status === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : stage.status === 'COMPLETED_WITH_WARNINGS'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : stage.status === 'RUNNING'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : stage.status === 'FAILED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : stage.status === 'BLOCKED'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {stage.status.replace('_', ' ')}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 border-t border-slate-800/80 bg-[#0a1120] space-y-2 text-xs">
                    {stage.details && (
                      <div className="text-slate-300">
                        <span className="font-semibold text-slate-400">Execution Summary: </span>
                        {stage.details}
                      </div>
                    )}

                    {stage.warnings && stage.warnings.length > 0 && (
                      <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 space-y-1">
                        <span className="font-bold block text-[11px] uppercase tracking-wider">
                          Stage Warnings ({stage.warnings.length}):
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {stage.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {stage.error && (
                      <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 space-y-1">
                        <span className="font-bold block text-[11px] uppercase tracking-wider">
                          Stage Error:
                        </span>
                        <p className="text-[11px]">{stage.error}</p>
                      </div>
                    )}

                    {stage.intermediateData && (
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                          Captured Intermediate Results:
                        </span>
                        <pre className="bg-[#060b17] border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-40">
                          {JSON.stringify(stage.intermediateData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Forensic Consistency & Trace Audit Panel */}
      {forensicReport && (
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                FORENSIC RECOMPUTATION & CONSISTENCY AUDIT
              </h4>
            </div>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
              forensicReport.overallConsistencyStatus === 'PASSED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                : forensicReport.overallConsistencyStatus === 'WARNINGS'
                ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                : 'bg-rose-950 text-rose-300 border-rose-500/50'
            }`}>
              {forensicReport.overallConsistencyStatus === 'PASSED'
                ? '✓ All Authoritative Checks Consistent'
                : forensicReport.overallConsistencyStatus}
            </span>
          </div>

          {/* 4-Metric Consistency Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* 1. Mass Balance */}
            <div className="bg-[#131d35] p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Mass Balance Consistency
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-white">
                  {forensicReport.recomputedMassBalancePct.toFixed(2)}%
                </span>
                {forensicReport.isMassBalanceConsistent ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    MATCH
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                    MISMATCH
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Live: {forensicReport.liveMassBalancePct.toFixed(2)}%
              </span>
            </div>

            {/* 2. Active Surfactants */}
            <div className="bg-[#131d35] p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Active Surfactant Match
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-cyan-400">
                  {forensicReport.recomputedActiveSurfactantPct.toFixed(2)}%
                </span>
                {forensicReport.isActiveSurfactantConsistent ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    MATCH
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                    MISMATCH
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Live: {forensicReport.liveActiveSurfactantPct.toFixed(2)}%
              </span>
            </div>

            {/* 3. Finished Formula Cost */}
            <div className="bg-[#131d35] p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Cost Integrity Match
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-emerald-400">
                  ₹{forensicReport.recomputedCostPerKg.toFixed(2)}/kg
                </span>
                {forensicReport.isCostConsistent ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    MATCH
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                    MISMATCH
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Live: ₹{forensicReport.liveCostPerKg.toFixed(2)}/kg
              </span>
            </div>

            {/* 4. Equilibrium pH */}
            <div className="bg-[#131d35] p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Product Equilibrium pH
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-indigo-400">
                  {forensicReport.recomputedPH !== null ? `pH ${forensicReport.recomputedPH.toFixed(2)}` : 'N/A'}
                </span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  CONVERGED
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Speciation equilibrium
              </span>
            </div>
          </div>

          {/* Toggle Full Trace Button */}
          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={() => setShowFullForensicTrace(!showFullForensicTrace)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>{showFullForensicTrace ? 'Hide Complete Forensic Trace' : 'View Complete Forensic Trace Matrix'}</span>
              {showFullForensicTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              {forensicReport.traceEntries.length} scientific dimensions certified
            </span>
          </div>

          {/* Detailed Trace Matrix Table */}
          {showFullForensicTrace && (
            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                <thead>
                  <tr className="bg-[#11192e] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">Scientific Dimension</th>
                    <th className="py-2.5 px-3">Engine / Authority</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Certainty Level</th>
                    <th className="py-2.5 px-3">Consistency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#0e1629]/60 font-mono">
                  {forensicReport.traceEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2 px-3 font-sans font-bold text-white">
                        {entry.dimension}
                      </td>
                      <td className="py-2 px-3 text-slate-300 text-[11px]">
                        {entry.engineOrFunction}
                      </td>
                      <td className="py-2 px-3 font-bold text-cyan-300">
                        {entry.valueDisplay}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.status === 'CALCULATED'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                            : entry.status === 'LAB_VALIDATED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {entry.consistencyStatus === 'CONSISTENT' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <Check className="w-3 h-3" /> Consistent
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                            <XCircle className="w-3 h-3" /> Discrepancy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

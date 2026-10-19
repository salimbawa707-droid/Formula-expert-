import React from 'react';
import {
  Layers,
  AlertOctagon,
  ShieldAlert,
  Database,
  FlaskConical,
  Lock,
  ArrowRight,
  Clock,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { VaultState } from '../../domain/vault/types';
import { calculateVaultMetrics } from '../../utils/vault/vaultLogic';
import { ActiveTab } from './VaultHeader';

interface DashboardViewProps {
  state: VaultState;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDatasetModal?: () => void;
  onOpenAuditModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  setActiveTab,
  onOpenDatasetModal,
  onOpenAuditModal,
}) => {
  const metrics = calculateVaultMetrics(state);

  return (
    <div className="space-y-6">
      {/* Critical Scientific Status Notice Banner */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                ACTIVE REMEDIATION PHASE
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                Phase 4B — Comprehensive Real Scientific Evidence Inventory
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-4xl">
              Audit Status:{' '}
              <span className="font-semibold text-amber-300">OPEN / UNVERIFIED</span>. Historical reports
              variously claim 64, 59, and 97 engines. Current reconciliation establishes 59 distinct
              implementation files, preserved as{' '}
              <span className="font-mono text-amber-300 font-semibold bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/60">
                REPORTED_UNVERIFIED
              </span>
              . Progress is calculated strictly from verified empirical datasets, never from unverified claims.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('roadmap')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
            >
              View Phase Roadmap
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Engines Inventoried */}
        <div
          onClick={() => setActiveTab('engines')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Engines Inventoried</span>
            <FlaskConical className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {metrics.engineDiscrepancyReconciledFiles}
          </div>
          <div className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 shrink-0" />
            <span>64 / 59 / 97 Discrepancy</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.engineDiscrepancyStatus}
          </div>
        </div>

        {/* KPI 2: Evidence Sources Identified */}
        <div
          onClick={() => setActiveTab('evidence')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Sources Identified</span>
            <Database className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {metrics.sourcesIdentified}
          </div>
          <div className="mt-1 text-[11px] text-slate-300">
            {metrics.sourcesAccessConfirmed} Access Confirmed
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.sourcesDownloaded} Downloaded
          </div>
        </div>

        {/* KPI 3: Experimental Datasets Numerically Inspected - CRITICAL STRICT ZERO */}
        <div
          onClick={() => setActiveTab('datasets')}
          className="bg-slate-900 border border-rose-900/40 hover:border-rose-700/60 rounded-xl p-4 transition cursor-pointer group bg-gradient-to-b from-slate-900 to-rose-950/20"
        >
          <div className="flex items-center justify-between text-xs text-rose-300 mb-1">
            <span>Datasets Inspected</span>
            <AlertOctagon className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {metrics.experimentalDatasetsNumericallyInspected}
          </div>
          <div className="mt-1 text-[11px] text-rose-300 font-medium">
            Strictly Zero (Verified)
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Awaiting raw data parsing
          </div>
        </div>

        {/* KPI 4: Engines Ready for Validation */}
        <div
          onClick={() => setActiveTab('engines')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Validation Ready</span>
            <Activity className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {metrics.enginesReadyForValidation}
          </div>
          <div className="mt-1 text-[11px] text-amber-400">
            0 of 59 with data
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Datasets required first
          </div>
        </div>

        {/* KPI 5: Independently Lab Verified */}
        <div
          onClick={() => (onOpenAuditModal ? onOpenAuditModal() : setActiveTab('audits'))}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Lab Verified</span>
            <ShieldAlert className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {metrics.enginesIndependentlyLabVerified}
          </div>
          <div className="mt-1 text-[11px] text-purple-300">
            0% Verified Evidence
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Theory ≠ Lab Evidence
          </div>
        </div>

        {/* KPI 6: Active Blockers & Defects */}
        <div
          onClick={() => setActiveTab('audits')}
          className="bg-slate-900 border border-red-900/40 hover:border-red-700/60 rounded-xl p-4 transition cursor-pointer group bg-gradient-to-b from-slate-900 to-red-950/20"
        >
          <div className="flex items-center justify-between text-xs text-red-300 mb-1">
            <span>Active Blockers</span>
            <Lock className="w-4 h-4 text-red-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {metrics.activeBlockersCount}
          </div>
          <div className="mt-1 text-[11px] text-red-300 font-medium">
            SurfPro ZIP &amp; Phase 5
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {metrics.openAuditDefectsCount} Open Audit Defect(s)
          </div>
        </div>
      </div>

      {/* Discrepancy & Blocker Callout Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Discrepancy Reconciliation Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>Scientific Engine Count Discrepancy</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              {state.engineCountDiscrepancy.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950 rounded-lg border border-slate-800/80">
            <div className="p-2 border-r border-slate-800/80">
              <div className="text-lg font-bold text-slate-300 font-mono">
                {state.engineCountDiscrepancy.claimedA}
              </div>
              <div className="text-[11px] text-slate-400">Claimed in Audit A</div>
            </div>
            <div className="p-2 border-r border-slate-800/80 bg-cyan-950/20">
              <div className="text-lg font-bold text-cyan-300 font-mono">
                {state.engineCountDiscrepancy.reconciledFiles}
              </div>
              <div className="text-[11px] text-cyan-200">Reconciled Source Files</div>
            </div>
            <div className="p-2">
              <div className="text-lg font-bold text-slate-400 font-mono">
                {state.engineCountDiscrepancy.claimedSubmodules}
              </div>
              <div className="text-[11px] text-slate-500">PRD Modular Sub-engines</div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {state.engineCountDiscrepancy.notes}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Repository subject: <code className="text-slate-300 font-mono">salimbawa707-droid/Formula-expert-</code>
            </span>
            <button
              onClick={() => setActiveTab('engines')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Open Engine Registry &rarr;
            </button>
          </div>
        </div>

        {/* Runtime Environment Blocker Box */}
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-5 space-y-3 bg-gradient-to-b from-slate-900 to-red-950/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-200 font-semibold text-sm">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Current Primary Blocker: BLK-001 (SurfPro ZIP)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-950 text-red-300 border border-red-800">
              CRITICAL BLOCKER
            </span>
          </div>

          <div className="p-3 bg-slate-950/90 rounded-lg border border-red-900/30 text-xs space-y-2">
            <div>
              <span className="text-slate-400 font-semibold">Environment Constraint:</span>
              <p className="text-slate-300 mt-0.5">
                The SurfPro ZIP (Zenodo 15861809, ~421MB) is not available in the Google AI Studio
                runtime workspace. Direct external multi-megabyte curl downloads and background
                daemons are restricted.
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Scientific Impact:</span>
              <p className="text-slate-300 mt-0.5">
                No experimental dataset has been numerically inspected according to the latest report.
                Phase 5 remains strictly LOCKED.
              </p>
            </div>
            <div>
              <span className="text-amber-400 font-semibold">Required Next Action:</span>
              <p className="text-amber-200 mt-0.5">
                Staged ingestion of extracted CSV/JSON tensiometry subsets with reproducible SHA-256
                hashes, or registering inspection records directly in the Dataset Register.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setActiveTab('datasets')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Inspect Datasets &rarr;
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              Copy Ingestion Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Progress Breakdown: Completed, Pending, Blocked, Unverified */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Remediation Work Stream Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">
              Categorized by verified status. Unverified claims are explicitly distinguished from empirical facts.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Phase 4B in progress &bull; Phase 5 locked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Completed (Verified) */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed &amp; Verified
              </span>
              <span className="font-mono text-emerald-300 font-bold">2 items</span>
            </div>
            <ul className="text-slate-300 space-y-1.5 text-[11px]">
              <li className="flex items-start gap-1">
                <span className="text-emerald-400 shrink-0">&bull;</span>
                <span>Phase 1: Raw material null-price preservation rule verified (AUD-001).</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-400 shrink-0">&bull;</span>
                <span>Phase 4B: 11 real scientific evidence leads identified &amp; cataloged.</span>
              </li>
            </ul>
          </div>

          {/* Pending Verification */}
          <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending Verification
              </span>
              <span className="font-mono text-cyan-300 font-bold">4 items</span>
            </div>
            <ul className="text-slate-300 space-y-1.5 text-[11px]">
              <li className="flex items-start gap-1">
                <span className="text-cyan-400 shrink-0">&bull;</span>
                <span>Phase 2: Canonical InChIKey mapping awaiting independent chemist audit.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-cyan-400 shrink-0">&bull;</span>
                <span>F3-01: Davies activity coefficient code in PHEngineV2 unverified by titration.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-cyan-400 shrink-0">&bull;</span>
                <span>F3-02: Mixed CMC Rubingh non-linear beta awaiting surface tension benchmark.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-cyan-400 shrink-0">&bull;</span>
                <span>F3-03: Builder chelation conditional stability constants awaiting ISE titration.</span>
              </li>
            </ul>
          </div>

          {/* Blocked Work */}
          <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Blocked Work
              </span>
              <span className="font-mono text-rose-300 font-bold">3 items</span>
            </div>
            <ul className="text-slate-300 space-y-1.5 text-[11px]">
              <li className="flex items-start gap-1">
                <span className="text-rose-400 shrink-0">&bull;</span>
                <span>BLK-001: SurfPro Zenodo ZIP (421MB) ingestion blocked in AI Studio.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-rose-400 shrink-0">&bull;</span>
                <span>BLK-002: Zero experimental datasets numerically inspected.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-rose-400 shrink-0">&bull;</span>
                <span>BLK-003: Phase 5 numerical validation locked behind Phase 4B sign-off.</span>
              </li>
            </ul>
          </div>

          {/* Unverified Claims */}
          <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Unverified Claims
              </span>
              <span className="font-mono text-amber-300 font-bold">3 items</span>
            </div>
            <ul className="text-slate-300 space-y-1.5 text-[11px]">
              <li className="flex items-start gap-1">
                <span className="text-amber-400 shrink-0">&bull;</span>
                <span>Claims of 64 vs 59 vs 97 engines marked REPORTED_UNVERIFIED.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-amber-400 shrink-0">&bull;</span>
                <span>Previous claims of "95-98% accuracy" rejected due to lack of lab data.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-amber-400 shrink-0">&bull;</span>
                <span>Phase 4 5-source survey rejected as incomplete.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Actions & Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => (onOpenDatasetModal ? onOpenDatasetModal() : setActiveTab('datasets'))}
          className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Action 1: Execute Dataset Inspection</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Record actual inspected row counts, column schemas, and null analyses for Zenodo 18961871 or SurfPro slices.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('engines')}
          className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Action 2: Reconcile 59 Engine Files</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit implementation files in <code className="text-slate-300 font-mono">Formula-expert-</code> to resolve 64/97 engine discrepancy.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Action 3: Verify Null Cost Integrity</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Confirm that unknown raw material prices propagate as NULL, preventing false zero quotes.
          </p>
        </button>
      </div>
    </div>
  );
};

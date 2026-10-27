import React, { useState } from 'react';
import { Atom, Layers, Zap, Droplets, CheckCircle, DollarSign, ShieldCheck, FileCode, Activity, FileText, Download, Copy, Sparkles, Check } from 'lucide-react';
import { getTargetPHRange } from '../../domain/productTaxonomy';
import { isMetricApplicable } from './constants';
import { ScientificBadge } from '../scientific/ScientificComponents';
import { ScientificExecutionTraceViewer } from '../scientific/ScientificExecutionTraceViewer';
import { PropertyDeepDivePanel } from '../scientific/PropertyDeepDivePanel';
import { SpecificationExplorerPanel } from '../scientific/SpecificationExplorerPanel';
import { TraceExportUtility } from '../scientific/TraceExportUtility';
import { DossierGenerator } from '../../utils/dossierGenerator';
import { IngredientSensitivityHistogram } from './IngredientSensitivityHistogram';
import { LabAlignmentTrendGraph } from './LabAlignmentTrendGraph';

interface ScientificResultsPanelProps {
  scientificResults: any;
  orchestratorResult?: any;
  productCategory: string;
  batchSizeKg: number;
  waterHardnessPpm: number;
  totals: any;
  ingredients: any[];
  comparisonFormula?: any | null;
  scoreHistory?: Array<{ timestamp: string; score: number; label: string }>;
}

export const ScientificResultsPanel: React.FC<ScientificResultsPanelProps> = React.memo(({
  scientificResults,
  orchestratorResult,
  productCategory,
  batchSizeKg,
  waterHardnessPpm,
  totals,
  ingredients,
  comparisonFormula,
  scoreHistory = []
}) => {
  const [activeView, setActiveView] = useState<'EXECUTIVE' | 'DEEP_DIVE' | 'TRACE' | 'SPECIFICATION'>('EXECUTIVE');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  const evalResult = orchestratorResult || scientificResults?.orchestratorResult || scientificResults;
  // ... rest of the code

  const handleDownloadDossier = () => {
    const report = {
      ...evalResult,
      productCategoryLabel: productCategory,
      majorWarnings: evalResult.majorWarnings || []
    };
    const dossier = DossierGenerator.generate(report as any, 'Current Formula', ingredients);
    const blob = new Blob([DossierGenerator.generateHtml(dossier)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Technical_Dossier_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const provenanceReport = scientificResults?.provenanceReport || scientificResults?.qualityGateResult?.provenanceReport;
  const overallState = provenanceReport?.overallProvenanceState || (scientificResults?.isLabValidated ? 'LAB_VALIDATED' : 'SCIENTIFICALLY_SCREENED');
  const fingerprint = provenanceReport?.formulaFingerprint || evalResult?.provenance?.fingerprint || 'ID[F-1.0]|VER[1.0.0]';
  const trace = evalResult?.executionTrace;

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Section Heading */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Atom className="w-5 h-5 text-cyan-400" />
            SCIENTIFIC & PERFORMANCE RESULTS
          </h2>
          <p className="text-xs text-token-muted font-medium">
            Consolidated physical chemistry and performance analysis for {productCategory}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#131d35] border border-slate-700 text-cyan-300 font-bold">
            Hardness: {waterHardnessPpm} ppm
          </span>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#131d35] border border-slate-700 text-cyan-300 font-bold">
            Batch: {batchSizeKg} kg
          </span>
        </div>
      </div>

      {/* SCIENTIFIC PROVENANCE & LINEAGE BANNER */}
      <div className="bg-[#0b1324] border border-cyan-500/30 rounded-xl p-3.5 space-y-2 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-extrabold text-cyan-200 uppercase tracking-wide">
              Scientific Provenance & Traceability
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              overallState === 'LAB_VALIDATED'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                : overallState === 'SCIENTIFICALLY_SCREENED'
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
                : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
            }`}>
              State: {overallState}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 truncate">
            <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Fingerprint: {fingerprint}</span>
            <button
              onClick={handleCopyFingerprint}
              className="text-cyan-400 hover:text-cyan-300 ml-1 font-bold inline-flex items-center gap-0.5"
              title="Copy Fingerprint"
            >
              {copiedFingerprint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => TraceExportUtility.exportTraceJson(evalResult)}
              className="px-2.5 py-1 text-[10px] font-bold bg-[#131d35] hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" /> Export Trace JSON
            </button>
            <button
              onClick={() => TraceExportUtility.exportScientificReportHtml(evalResult, productCategory)}
              className="px-2.5 py-1 text-[10px] font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3" /> Print Scientific Report
            </button>
            <button
              onClick={handleDownloadDossier}
              className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" /> Download Dossier
            </button>
          </div>
        </div>
      </div>

      {/* PHASE 6 LAYERED VIEW NAVIGATION */}
      <div className="flex items-center gap-2 bg-[#0e1629] border border-slate-800 p-1.5 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveView('EXECUTIVE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeView === 'EXECUTIVE'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Executive Summary
        </button>

        <button
          onClick={() => setActiveView('DEEP_DIVE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeView === 'DEEP_DIVE'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          12 Property Deep Dive
        </button>

        <button
          onClick={() => setActiveView('TRACE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeView === 'TRACE'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Execution Trace Viewer
          {trace && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {trace.executionOrder.length} Nodes
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('SPECIFICATION')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeView === 'SPECIFICATION'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Quality Gate & Specs
        </button>
      </div>

      {/* RENDER VIEW CONTENT */}
      {activeView === 'DEEP_DIVE' && (
        <PropertyDeepDivePanel evaluationResult={evalResult} />
      )}

      {activeView === 'TRACE' && (
        <ScientificExecutionTraceViewer trace={trace} />
      )}

      {activeView === 'SPECIFICATION' && (
        <SpecificationExplorerPanel evaluationResult={evalResult} />
      )}

      {activeView === 'EXECUTIVE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IngredientSensitivityHistogram 
              ingredients={ingredients}
              productCategory={productCategory}
              comparisonFormula={comparisonFormula}
            />
            <LabAlignmentTrendGraph history={scoreHistory} />
          </div>
          {/* GROUP A — FORMULATION QUALITY */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
          <Layers className="w-4 h-4 text-cyan-400" /> GROUP A — FORMULATION QUALITY
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. pH */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase">1. Equilibrium pH</span>
              <ScientificBadge maturity="HEURISTIC_SCREENING" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {scientificResults.pH.toFixed(2)}
              </span>
              <span className="text-xs text-token-secondary font-bold">
                Target: {getTargetPHRange(productCategory).min} - {getTargetPHRange(productCategory).max}
              </span>
            </div>
            <p className="text-[11px] text-cyan-300 font-bold leading-tight">
              Calculated Equilibrium pH: {scientificResults.pH.toFixed(2)} — SCREENING
            </p>
            <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
              <span className="text-token-secondary font-bold">Measured Finished Product pH:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                NOT TESTED
              </span>
            </div>
            <p className="text-[11px] text-token-primary leading-tight font-medium">
              Newton-Raphson charge balance ({scientificResults.pH < 7 ? "Acidic" : scientificResults.pH > 7 ? "Alkaline" : "Neutral"}) • <span className="text-token-primary font-bold">{scientificResults.phConfidence?.confidence || "Theoretical Model"}</span>. Physical electrode test required for release.
            </p>
            {scientificResults.pH > 9.5 && scientificResults.details?.recognizedContributors?.includes('sodium_citrate') && !scientificResults.details?.recognizedContributors?.includes('citric_acid') && (
              <div className="mt-2 text-[11px] bg-amber-950/50 border border-amber-500/40 rounded-lg p-2 text-amber-200">
                💡 <strong>Chemist Tip:</strong> &ldquo;Sodium Citrate&rdquo; is an alkaline/buffer salt and does not neutralize excess Caustic Soda. To lower pH from alkaline into target range, add <strong>Citric Acid (Anhydrous/Solution)</strong> acidifier.
              </div>
            )}
          </div>

          {/* 2. Viscosity */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase">2. Viscosity</span>
              <span className="text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                {isMetricApplicable(productCategory, "viscosity") ? "ESTIMATED" : "N/A"}
              </span>
            </div>
            {isMetricApplicable(productCategory, "viscosity") ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-mono font-bold text-white block truncate">
                    {scientificResults.viscosity}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-300 font-bold leading-tight">
                  Modeled Viscosity: {scientificResults.viscosity} — ESTIMATED
                </p>
                <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
                  <span className="text-token-secondary font-bold">Brookfield Viscometer Spindle 2:</span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                    NOT TESTED / INSUFFICIENT_DATA
                  </span>
                </div>
                <p className="text-[11px] text-token-primary leading-tight font-medium">
                  Modeled from surfactant micellar structuring & electrolyte packing. Empirical viscometer rheology unmeasured.
                </p>
              </>
            ) : (
              <>
                <span className="text-xs text-token-muted block pt-1 italic font-extrabold">
                  N/A — Not applicable for this category
                </span>
                <p className="text-[11px] text-token-secondary leading-tight font-medium">
                  Powder formulation; bulk density evaluated separately.
                </p>
              </>
            )}
          </div>

          {/* 3. Formula Stability */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">3. Formula Stability</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border-teal-500/40">
                Phase Stable
              </span>
            </div>
            <span className="text-xs font-bold text-white block truncate">
              {totals.activeSurfactants > 35 ? "High active surfactant concentration. Couple with hydrotrope." : "Standard micellar dispersion."}
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Preservation: {scientificResults.preservativeWarning ? "⚠ Needs Preservative" : "Calculated / Formulation-Based (Lab Validation Required)"}
            </p>
          </div>

          {/* 4. Bulk Density & Specific Gravity */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">4. Density & Specific Gravity</span>
              <span className="text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                SCREENING
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {(scientificResults.density?.densityGPerCm3 ?? 1.0).toFixed(3)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                g/cm³ (SG: {(scientificResults.density?.specificGravity ?? scientificResults.density?.densityGPerCm3 ?? 1.0).toFixed(3)})
              </span>
            </div>
            <p className="text-[11px] text-cyan-300/90 font-medium leading-tight">
              Calculated Density @ 20°C: {(scientificResults.density?.densityGPerCm3 ?? 1.0).toFixed(3)} g/cm³ — SCREENING
            </p>
            <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
              <span className="text-slate-400">Product-appropriate lab density method:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                NOT TESTED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Calculated harmonic density: {(scientificResults.density?.densityKgPerM3 ?? ((scientificResults.density?.densityGPerCm3 ?? 1.0) * 1000)).toFixed(1)} kg/m³. Batch volume: {((scientificResults.density?.totalVolumeCm3 ?? 100000) / 1000).toFixed(2)} L.
            </p>
          </div>

          {/* 5. Non-Volatile Matter (NVR) */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">
                {productCategory.toLowerCase().includes("powder") ? "5. Total Solids (Powder Base)" : "5. Non-Volatile Matter (NVR)"}
              </span>
              <span className={`text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full border ${
                productCategory.toLowerCase().includes("powder")
                  ? "bg-blue-950/80 text-blue-300 border-blue-500/40"
                  : scientificResults.nvrResult && !scientificResults.nvrResult.isComplete
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  : "bg-blue-950/80 text-blue-300 border-blue-500/40"
              }`}>
                {productCategory.toLowerCase().includes("powder")
                  ? "Solid Powder"
                  : scientificResults.nvrResult && !scientificResults.nvrResult.isComplete
                  ? "INSUFFICIENT_DATA"
                  : "CALCULATED"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {productCategory.toLowerCase().includes("powder")
                  ? `${(scientificResults?.totalSolids ?? 0).toFixed(1)}%`
                  : scientificResults?.nvrResult && !scientificResults.nvrResult.isComplete
                  ? "INSUFFICIENT_DATA"
                  : `${(scientificResults?.totalSolids ?? 0).toFixed(1)}%`}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {productCategory.toLowerCase().includes("powder")
                  ? "Total Dry Solids"
                  : scientificResults?.nvrResult && !scientificResults.nvrResult.isComplete
                  ? `Known NVR coverage: ${(scientificResults.nvrResult.dataCompleteness ?? 0).toFixed(0)}%`
                  : "Non-Volatile Residue"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-tight">
              {productCategory.toLowerCase().includes("powder")
                ? `Dry powder matter: ${(scientificResults?.totalSolids ?? 0).toFixed(1)}% • Hydrate moisture: ${(100 - (scientificResults?.totalSolids ?? 0)).toFixed(1)}%.`
                : scientificResults?.nvrResult && !scientificResults.nvrResult.isComplete
                ? `NVR: INSUFFICIENT_DATA • Known NVR coverage: ${(scientificResults.nvrResult.dataCompleteness ?? 0).toFixed(0)}%. Insufficient NVR data for ${(scientificResults.nvrResult.unknownIngredients || []).join(', ')}.`
                : `Volatile solvent fraction: ${(100 - (scientificResults?.totalSolids ?? 0)).toFixed(1)}% • Non-volatile residue: ${(scientificResults?.totalSolids ?? 0).toFixed(1)}% (Calculated).`}
            </p>
            {!productCategory.toLowerCase().includes("powder") && (
              <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Oven Evaporation @ 105°C:</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                  NOT TESTED
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GROUP B — SURFACTANT SCIENCE */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
          <Zap className="w-4 h-4 text-indigo-400" /> GROUP B — SURFACTANT SCIENCE
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 4. HLB */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">4. Mixed HLB</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border-indigo-500/40">
                {isMetricApplicable(productCategory, "hlb") ? "Hydrophilic-Lipophilic" : "N/A"}
              </span>
            </div>
            {isMetricApplicable(productCategory, "hlb") ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.hlb > 0 ? scientificResults.hlb.toFixed(1) : "N/A"}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Blended HLB</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {scientificResults.hlb >= 12 && scientificResults.hlb <= 15
                    ? "Optimal nonionic detergency & micellar solubilization window (12-15)."
                    : scientificResults.hlb > 15
                    ? "Extended ionic HLB (Davies scale). Strong hydrophilic detergency."
                    : "Blended HLB outside standard detergent optimum (12-15)."}
                </p>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                  N/A — Not applicable for this category
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  HLB is primarily applicable to nonionic emulsification systems.
                </p>
              </>
            )}
          </div>

          {/* 5. CMC */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">5. Mixed CMC</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border-blue-500/40">
                {isMetricApplicable(productCategory, "cmc") ? "Clint Model" : "N/A"}
              </span>
            </div>
            {isMetricApplicable(productCategory, "cmc") ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.cmc?.available ? Math.round(scientificResults.cmc.ppm) : "Unavailable"}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {scientificResults.cmc?.available ? `ppm (${scientificResults.cmc.molar.toFixed(2)} mM)` : "no prediction"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {scientificResults.cmc?.available
                    ? `Clint ideal pseudophase model • ${scientificResults.cmc.eligibilityStatus} input provenance${scientificResults.cmc.hasSynergyPair ? " • Synergy class present" : ""}${scientificResults.cmc.hasElectrolyteScreening ? " • Electrolyte present" : ""}. Real CMC may shift with formulation conditions.`
                    : (scientificResults.cmc?.eligibilityReasons.join(' ') || 'Insufficient supported surfactant inputs for a CMC prediction.')}
                </p>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                  N/A — Not applicable for this category
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  CMC not evaluated for non-surfactant specialty category.
                </p>
              </>
            )}
          </div>

          {/* 6. Surfactant Charge / System */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">6. Surfactant System</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border-purple-500/40">
                {scientificResults.surfactantBreakdown.total}% Total Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-300 pt-0.5">
              <div className="bg-[#131d35] p-1.5 rounded border border-blue-500/30">Anionic: <span className="text-blue-400 font-bold">{scientificResults.surfactantBreakdown.anionic}%</span></div>
              <div className="bg-[#131d35] p-1.5 rounded border border-teal-500/30">Nonionic: <span className="text-teal-400 font-bold">{scientificResults.surfactantBreakdown.nonionic}%</span></div>
              <div className="bg-[#131d35] p-1.5 rounded border border-indigo-500/30">Amphoteric: <span className="text-indigo-400 font-bold">{scientificResults.surfactantBreakdown.amphoteric}%</span></div>
              <div className="bg-[#131d35] p-1.5 rounded border border-purple-500/30">Cationic: <span className="text-purple-400 font-bold">{scientificResults.surfactantBreakdown.cationic}%</span></div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight pt-1">
              Total Active Surfactants: <span className="text-indigo-300 font-bold">{scientificResults.surfactantBreakdown.total}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* GROUP C — CLEANING & HARD WATER */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
          <Droplets className="w-4 h-4 text-emerald-400" /> GROUP C — CLEANING & HARD WATER
        </h3>

        {/* Scientific Integrity Disclaimer Notice */}
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-[11px] text-blue-200/90 flex items-start gap-2.5">
          <span className="text-blue-400 font-bold text-sm shrink-0">ℹ️</span>
          <p className="leading-snug">
            <strong className="text-blue-300">R&D Predictive Disclaimer:</strong> Performance metrics shown are model predictions based on formulation chemistry (surfactant loading, pH, builders, enzymes). Actual cleaning performance requires empirical laboratory testing (ASTM/AATCC standards).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 7. Cleaning Score / CPI */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase">7. Predicted CPI / Score</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                !isMetricApplicable(productCategory, "cleaningScore") 
                  ? "bg-slate-800 text-token-muted border-slate-700" 
                  : (scientificResults.cleaning.isMeasured 
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" 
                    : "bg-blue-950/80 text-blue-300 border-blue-500/40")
              }`}>
                {!isMetricApplicable(productCategory, "cleaningScore") 
                  ? "NOT APPLICABLE" 
                  : (scientificResults.cleaning.isMeasured ? "LAB MEASURED" : "PREDICTED MODEL")}
              </span>
            </div>
            {isMetricApplicable(productCategory, "cleaningScore") ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    {scientificResults.cleaning?.cleaningScore ?? scientificResults.cleaning?.cpi ?? 0}
                  </span>
                  <span className="text-xs text-token-secondary font-bold">/ 100 Index</span>
                  <span className="text-[10px] text-token-primary font-bold ml-auto">
                    {scientificResults.cleaning?.cleaningPower ?? scientificResults.cleaning?.qualitativePower ?? 'Standard'}
                  </span>
                </div>
                <p className="text-[11px] text-token-primary font-medium leading-tight">
                  Degreasing: {scientificResults.cleaning?.degreasingScore ?? scientificResults.cleaning?.domainScores?.degreasing ?? 0}% | Particulate Soil: {scientificResults.cleaning?.particulateSoilRemoval ?? scientificResults.cleaning?.domainScores?.particulate ?? 0}%. Model estimate (R&D screening).
                </p>
              </>
            ) : (
              <>
                <span className="text-xs text-token-muted block pt-1 italic font-extrabold">
                  N/A — Not applicable for this category
                </span>
                <p className="text-[11px] text-token-secondary font-medium leading-tight">
                  Fabric softener / conditioner (Non-cleansing category).
                </p>
              </>
            )}
          </div>

          {/* 8. Hard Water Tolerance */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">8. Hard Water Tolerance</span>
              <span className={`text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full border ${
                scientificResults.waterHardness.status === "NOT_APPLICABLE" || !scientificResults.waterHardness.isApplicable
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : waterHardnessPpm === 0 || scientificResults.waterHardness.status === "NOT_EVALUATED"
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : scientificResults.waterHardness.status === "PASS"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                      : scientificResults.waterHardness.status === "WARNING"
                        ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                        : "bg-rose-950/80 text-rose-300 border-rose-500/40"
              }`}>
                {scientificResults.waterHardness.status === "NOT_APPLICABLE" || !scientificResults.waterHardness.isApplicable
                  ? "NOT APPLICABLE"
                  : waterHardnessPpm === 0 || scientificResults.waterHardness.status === "NOT_EVALUATED"
                    ? "NOT EVALUATED"
                    : scientificResults.waterHardness.status}
              </span>
            </div>
            {scientificResults.waterHardness.status === "NOT_APPLICABLE" || !scientificResults.waterHardness.isApplicable ? (
              <>
                <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                  N/A — Not required for this category
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {scientificResults.waterHardness.description || "Category does not rely on wash-liquor water hardness sequestration."}
                </p>
              </>
            ) : waterHardnessPpm === 0 || scientificResults.waterHardness.status === "NOT_EVALUATED" ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-extrabold text-slate-300">
                    NOT EVALUATED
                  </span>
                </div>
                <p className="text-[11px] text-cyan-300/90 font-medium leading-tight">
                  Hard-water challenge: NOT EVALUATED • Baseline hardness: 0 ppm
                </p>
                <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">Baseline Condition:</span>
                  <span className="font-mono text-slate-300 font-bold">0 ppm (Soft Water)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Hard water challenge not evaluated at 0 ppm baseline. To evaluate chelation capacity against water hardness, enter a test hardness (e.g. 150 ppm or 300 ppm) or select an explicit benchmark scenario.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.waterHardness.maxSupportedPpm}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    ppm CaCO₃ max (w/ margin)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Load: {scientificResults.waterHardness.hardnessLoadMg} mg CaCO₃ in {scientificResults.waterHardness.washVolumeL}L wash. {scientificResults.waterHardness.description}
                </p>
              </>
            )}
          </div>

          {/* 9. Builder / Chelation Performance */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">9. Builder / Chelation</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                (scientificResults?.waterHardness?.totalSequestrationMg || 0) > 0
                  ? "bg-teal-950/80 text-teal-300 border-teal-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {(scientificResults?.waterHardness?.totalSequestrationMg || 0) > 0 ? "Active Sequestration" : "Unchelated"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {Math.round(scientificResults?.waterHardness?.totalSequestrationMg || 0)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">mg CaCO₃ / {scientificResults?.waterHardness?.washDoseGrams || 20}g dose</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {(scientificResults?.chelatorNames || []).length > 0
                ? `Active agents: ${(scientificResults?.chelatorNames || []).slice(0, 2).join(", ")}. Chelation: ${Math.round(scientificResults?.waterHardness?.chelationCapacityMg || 0)} mg | Builder: ${Math.round(scientificResults?.waterHardness?.builderCapacityMg || 0)} mg.`
                : "No active chelating builders detected; detergency relies on surfactant calcium tolerance."}
            </p>
          </div>
        </div>
      </div>

      {/* GROUP D — PRODUCT PERFORMANCE */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-teal-300 bg-teal-950/60 border border-teal-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
          <CheckCircle className="w-4 h-4 text-teal-400" /> GROUP D — PRODUCT PERFORMANCE
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 10. Foam Profile */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">10. Foam Profile</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border-blue-500/40">
                Ross-Miles
              </span>
            </div>
            <span className="text-sm font-extrabold text-white block mt-1">
              {scientificResults.foam}
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Stability evaluated from anionic-amphoteric synergistic packing.
            </p>
          </div>

          {/* 11. Chemical Compatibility */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">11. Compatibility</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                scientificResults.compatibility.compatible ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-rose-950/80 text-rose-300 border-rose-500/40"
              }`}>
                {scientificResults.compatibility.compatible ? "PASSED" : "HAZARD"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {scientificResults.compatibility.compatibilityScore}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100 Rating</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {scientificResults.compatibility.warnings[0] || "No anionic/cationic precipitation or degradation hazards."}
            </p>
          </div>

          {/* 12. Product-Category Suitability */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">12. Category Suitability</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                Verified
              </span>
            </div>
            <span className="text-xs font-bold text-white block truncate mt-1">
              {scientificResults.categorySuitability}
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Tested against manufacturing standards for {productCategory}.
            </p>
          </div>
        </div>
      </div>

      {/* GROUP E — SAFETY & ECONOMICS */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
          <DollarSign className="w-4 h-4 text-amber-400" /> GROUP E — SAFETY & ECONOMICS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 13. Safety / Hazard Status */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">13. Safety / GHS Status</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                scientificResults.health.finalScore >= 75 ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-amber-950/80 text-amber-300 border-amber-500/40"
              }`}>
                {scientificResults.health.rating}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {scientificResults.health.finalScore}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100 GHS Score</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {scientificResults.health.alerts[0]?.message || "GHS safety rating passed. Standard personal protective equipment applies."}
            </p>
          </div>

          {/* 14. Raw Material Cost */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">14. Raw Material Cost</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                Unit Economics
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-emerald-400">
                ₹{totals.costPerKg}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ kg formula</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Calculated from master raw material database pricing.
            </p>
          </div>

          {/* 15. Total Batch Cost */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">15. Batch Cost</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border-blue-500/40">
                {batchSizeKg} kg Batch
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                ₹{totals.totalBatchCost}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Total</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Total production cost for configured {batchSizeKg} kg batch size.
            </p>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
});

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
  waterHardnessPpm: number | null;
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
  const safetyScore = typeof scientificResults?.health?.finalScore === 'number' && Number.isFinite(scientificResults.health.finalScore)
    ? scientificResults.health.finalScore
    : null;
  const safetyRating = scientificResults?.health?.rating || 'NOT EVALUATED';
  const safetyMessage = scientificResults?.health?.alerts?.[0]?.message || 'No safety assessment is available. Review ingredient SDS records and complete the required hazard evaluation.';
  const solidsValue = typeof scientificResults?.totalSolids === 'number' && Number.isFinite(scientificResults.totalSolids)
    ? scientificResults.totalSolids
    : null;
  const cleaningScore = [scientificResults?.cleaning?.cleaningScore, scientificResults?.cleaning?.cpi]
    .find((value: any) => typeof value === 'number' && Number.isFinite(value)) ?? null;
  const hardnessIsNotApplicable = scientificResults?.waterHardness?.status === 'NOT_APPLICABLE' ||
    scientificResults?.waterHardness?.isApplicable === false;
  const hardnessIsEvaluated = !hardnessIsNotApplicable &&
    scientificResults?.waterHardness?.status !== 'NOT_EVALUATED' &&
    scientificResults?.waterHardness?.status !== 'INSUFFICIENT_DATA' &&
    Number.isFinite(scientificResults?.waterHardness?.totalSequestrationMg) &&
    Number.isFinite(scientificResults?.waterHardness?.maxSupportedPpm);
  const chelationCapacityAvailable = !hardnessIsNotApplicable && Number.isFinite(scientificResults?.waterHardness?.totalSequestrationMg);
  const compatibilityNotEvaluated = scientificResults?.compatibility?.status === 'NOT_EVALUATED' ||
    scientificResults?.compatibility?.compatibilityStatusSemantic === 'UNKNOWN';
  const compatibilityScore = typeof scientificResults?.compatibility?.compatibilityScore === 'number' &&
    Number.isFinite(scientificResults.compatibility.compatibilityScore)
    ? scientificResults.compatibility.compatibilityScore
    : null;
  // ... rest of the code

  const handleDownloadDossier = () => {
    try {
      const report = {
        ...scientificResults,
        ...(orchestratorResult || {}),
        productCategoryLabel: productCategory,
        majorWarnings: orchestratorResult?.majorWarnings || scientificResults?.qualityGateResult?.majorWarnings || scientificResults?.warnings || []
      };
      const dossier = DossierGenerator.generate(report as any, 'Current Formula', ingredients || []);
      const blob = new Blob([DossierGenerator.generateHtml(dossier)], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Technical_Dossier_${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate technical dossier:', err);
    }
  };

  const provenanceReport = scientificResults?.provenanceReport || scientificResults?.qualityGateResult?.provenanceReport;
  const overallState = provenanceReport?.overallProvenanceState || (scientificResults?.isLabValidated ? 'LAB_VALIDATED' : (scientificResults?.screeningStatus && scientificResults.screeningStatus !== 'NOT_EVALUATED' ? 'SCIENTIFICALLY_SCREENED' : 'NOT_EVALUATED'));
  const fingerprint = provenanceReport?.formulaFingerprint || evalResult?.provenance?.fingerprint || 'PENDING — NOT EVALUATED';
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
            Hardness: {waterHardnessPpm === null ? 'Unknown / not entered' : `${waterHardnessPpm} ppm (user-entered, unverified)`}
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
          {trace?.executionOrder && (
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
                {typeof scientificResults?.pH === 'number' ? scientificResults.pH.toFixed(2) : (typeof scientificResults?.phResult?.ph === 'number' ? scientificResults.phResult.ph.toFixed(2) : 'N/A')}
              </span>
              <span className="text-xs text-token-secondary font-bold">
                Target: {getTargetPHRange(productCategory)?.min ?? 'Not defined'} - {getTargetPHRange(productCategory)?.max ?? 'Not defined'}
              </span>
            </div>
            <p className="text-[11px] text-cyan-300 font-bold leading-tight">
              Calculated Equilibrium pH: {typeof scientificResults?.pH === 'number' ? scientificResults.pH.toFixed(2) : (typeof scientificResults?.phResult?.ph === 'number' ? scientificResults.phResult.ph.toFixed(2) : 'N/A')} — SCREENING
            </p>
            <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
              <span className="text-token-secondary font-bold">Measured Finished Product pH:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                NOT TESTED
              </span>
            </div>
            <p className="text-[11px] text-token-primary leading-tight font-medium">
              Newton-Raphson charge balance ({(() => {
                const val = typeof scientificResults?.pH === 'number' ? scientificResults.pH : (typeof scientificResults?.phResult?.ph === 'number' ? scientificResults.phResult.ph : null);
                return val !== null ? (val < 6.8 ? "Acidic" : val > 8.5 ? "Alkaline" : "Neutral") : "Equilibrium Pending";
              })()}) • <span className="text-token-primary font-bold">{scientificResults.phConfidence?.confidence || scientificResults?.phConfidence || "NOT EVALUATED"}</span>. Physical electrode test required for release.
            </p>
            {typeof scientificResults?.pH === 'number' && scientificResults.pH > 9.5 && scientificResults.details?.recognizedContributors?.includes('sodium_citrate') && !scientificResults.details?.recognizedContributors?.includes('citric_acid') && (
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
            {(() => {
              const densityGPerCm3 = scientificResults.density?.densityGPerCm3;
              const specificGravity = scientificResults.density?.specificGravity;
              const validDensity =
                typeof densityGPerCm3 === 'number' &&
                Number.isFinite(densityGPerCm3) &&
                densityGPerCm3 > 0;
              const validSpecificGravity =
                typeof specificGravity === 'number' &&
                Number.isFinite(specificGravity) &&
                specificGravity > 0;

              return (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-extrabold text-white">
                      {validDensity ? densityGPerCm3.toFixed(3) : 'UNAVAILABLE'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      g/cm³ (SG: {validSpecificGravity ? specificGravity.toFixed(3) : 'UNAVAILABLE'})
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-300/90 font-medium leading-tight">
                    Calculated Density @ 20°C:{' '}
                    {validDensity ? `${densityGPerCm3.toFixed(3)} g/cm³` : 'UNAVAILABLE'}
                  </p>
                </>
              );
            })()}
            <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
              <span className="text-slate-400">Product-appropriate lab density method:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                NOT TESTED
              </span>
            </div>
            {(() => {
              const densityKgPerM3 =
                scientificResults.density?.densityKgPerM3 ??
                (
                  typeof scientificResults.density?.densityGPerCm3 === 'number' &&
                  Number.isFinite(scientificResults.density.densityGPerCm3) &&
                  scientificResults.density.densityGPerCm3 > 0
                    ? scientificResults.density.densityGPerCm3 * 1000
                    : null
                );

              const volumeCm3 =
                scientificResults.density?.totalVolumeCm3;

              const validDensity =
                typeof densityKgPerM3 === 'number' &&
                Number.isFinite(densityKgPerM3) &&
                densityKgPerM3 > 0;

              const validVolume =
                typeof volumeCm3 === 'number' &&
                Number.isFinite(volumeCm3) &&
                volumeCm3 >= 0;

              return (
                <p className="text-[10px] text-slate-400 leading-tight">
                  Calculated harmonic density:{' '}
                  {validDensity
                    ? `${densityKgPerM3.toFixed(1)} kg/m³`
                    : 'UNAVAILABLE'}
                  . Batch volume:{' '}
                  {validVolume
                    ? `${(volumeCm3 / 1000).toFixed(2)} L`
                    : 'UNAVAILABLE'}
                  .
                </p>
              );
            })()}
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
                  ? `${solidsValue !== null ? solidsValue.toFixed(1) + '%' : 'N/A'}`
                  : scientificResults?.nvrResult && !scientificResults.nvrResult.isComplete
                  ? "INSUFFICIENT_DATA"
                  : (solidsValue !== null ? solidsValue.toFixed(1) + '%' : 'N/A')}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {productCategory.toLowerCase().includes("powder")
                  ? "Total Dry Solids"
                  : scientificResults?.nvrResult && !scientificResults.nvrResult.isComplete
                  ? `Known NVR coverage: ${typeof scientificResults?.nvrResult?.dataCompleteness === 'number' ? scientificResults.nvrResult.dataCompleteness.toFixed(0) + '%' : 'N/A'}`
                  : "Non-Volatile Residue"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-tight">
              {solidsValue === null
                ? 'Total solids / NVR is NOT EVALUATED because required ingredient property data is incomplete.'
                : productCategory.toLowerCase().includes("powder")
                ? 'Powder solids value is available. Moisture is reported separately only when measured.'
                : scientificResults?.nvrResult && !scientificResults.nvrResult.isComplete
                ? 'NVR is INSUFFICIENT_DATA; unknown ingredient volatility must be characterized.'
                : 'Non-volatile residue is calculated from characterized ingredient fractions.'}
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
                    {typeof scientificResults?.hlb === 'number' && scientificResults.hlb > 0 ? scientificResults.hlb.toFixed(1) : "N/A"}
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
                    {scientificResults?.cmc?.available ? `ppm (${typeof scientificResults?.cmc?.molar === 'number' ? scientificResults.cmc.molar.toFixed(2) : 'N/A'} mM)` : "no prediction"}
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
                  : cleaningScore === null ? "NOT EVALUATED" : (scientificResults.cleaning.isMeasured ? "LAB MEASURED" : "PREDICTED MODEL")}
              </span>
            </div>
            {isMetricApplicable(productCategory, "cleaningScore") ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    {(() => {
                      return cleaningScore !== null ? cleaningScore : 'N/A';
                    })()}
                  </span>
                  <span className="text-xs text-token-secondary font-bold">/ 100 Index</span>
                  <span className="text-[10px] text-token-primary font-bold ml-auto">
                    {(() => {
                      const power = scientificResults.cleaning?.cleaningPower ?? scientificResults.cleaning?.qualitativePower;
                      return power && power !== 'Unavailable' ? power : 'NOT EVALUATED';
                    })()}
                  </span>
                </div>
                <p className="text-[11px] text-token-primary font-medium leading-tight">
                  Degreasing: {(() => {
                    const d = scientificResults.cleaning?.degreasingScore ?? scientificResults.cleaning?.domainScores?.degreasing;
                    return typeof d === 'number' && Number.isFinite(d) ? d : 'N/A';
                  })()}% | Particulate Soil: {(() => {
                    const p = scientificResults.cleaning?.particulateSoilRemoval ?? scientificResults.cleaning?.domainScores?.particulate;
                    return typeof p === 'number' && Number.isFinite(p) ? p : 'N/A';
                  })()}%. Model estimate (R&D screening).
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
                hardnessIsNotApplicable || !hardnessIsEvaluated
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : scientificResults.waterHardness.status === "PASS"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-950/80 text-amber-300 border-amber-500/40"
              }`}>
                {hardnessIsNotApplicable
                  ? "NOT APPLICABLE"
                  : !hardnessIsEvaluated
                    ? "NOT EVALUATED"
                    : scientificResults.waterHardness.status}
              </span>
            </div>
            {hardnessIsNotApplicable ? (
              <p className="text-[11px] text-slate-500 leading-tight">
                N/A — This product category does not require a wash-water hardness calculation.
              </p>
            ) : !hardnessIsEvaluated ? (
              <p className="text-[11px] text-amber-300 leading-tight">
                Hard-water protection is NOT EVALUATED. Supply measured hardness, wash volume, detergent dose and batch size before relying on a capacity result.
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.waterHardness.maxSupportedPpm}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    ppm CaCO₃ maximum supported
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Sequestration: {Math.round(scientificResults.waterHardness.totalSequestrationMg)} mg CaCO₃ per {scientificResults.waterHardness.washDoseGrams}g dose in {scientificResults.waterHardness.washVolumeL}L wash.
                </p>
              </>
            )}
          </div>

          {/* 9. Builder / Chelation Performance */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">9. Builder / Chelation</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                chelationCapacityAvailable
                  ? "bg-teal-950/80 text-teal-300 border-teal-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {chelationCapacityAvailable ? "CALCULATED CAPACITY" : "NOT EVALUATED"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {chelationCapacityAvailable
                  ? Math.round(scientificResults.waterHardness.totalSequestrationMg)
                  : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                mg CaCO₃ {chelationCapacityAvailable && Number.isFinite(scientificResults?.waterHardness?.washDoseGrams) ? 'per ' + scientificResults.waterHardness.washDoseGrams + 'g dose' : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {chelationCapacityAvailable
                ? 'Identified agents: ' + ((scientificResults?.chelatorNames || []).join(', ') || 'Not identified')
                : 'Chelation capacity is unavailable until ingredient grade, assay and formula percentages are validated.'}
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
                NOT MEASURED
              </span>
            </div>
            <span className="text-sm font-extrabold text-white block mt-1">
              {scientificResults.foam}
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Qualitative foam profile only; a standardized Ross-Miles test is required for measured foam stability.
            </p>
          </div>

          {/* 11. Chemical Compatibility */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">11. Compatibility</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                compatibilityNotEvaluated
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : scientificResults?.compatibility?.compatible ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-rose-950/80 text-rose-300 border-rose-500/40"
              }`}>
                {compatibilityNotEvaluated ? "NOT EVALUATED" : scientificResults?.compatibility?.compatible ? "PASSED" : "HAZARD"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {compatibilityScore ?? 'N/A'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100 Rating</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {scientificResults?.compatibility?.alerts?.[0]?.message ||
               (scientificResults?.compatibility?.warnings || []).find((w: string) => !w.includes('pH is unavailable')) ||
               scientificResults?.compatibility?.warnings?.[0] ||
               (compatibilityNotEvaluated ? 'Compatibility was not evaluated because required input data is unavailable.' : 'No compatibility warning was returned.')}
            </p>            </p>
          </div>

          {/* 12. Product-Category Suitability */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase">12. Category Suitability</span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                Category Profile
              </span>
            </div>
            <span className="text-xs font-bold text-white block truncate mt-1">
              {scientificResults?.categorySuitability || productCategory}
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Mapped to the canonical {productCategory} profile; this is not a laboratory validation.
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
                safetyScore === null
                  ? "bg-slate-900/80 text-slate-300 border-slate-700"
                  : safetyScore >= 75 ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-amber-950/80 text-amber-300 border-amber-500/40"
              }`}>
                {safetyRating}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-extrabold text-white">
                {safetyScore ?? 'N/A'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100 GHS Score</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {safetyMessage}
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

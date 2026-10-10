import React, { useState } from 'react';
import {
  PowderFormulationReport,
  PowderLabMeasurementInputs,
  ResultSource
} from '../utils/powderEngine/types';
import {
  Scale,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Layers,
  Activity,
  CheckCircle2,
  DollarSign,
  Beaker,
  X
} from 'lucide-react';

interface Props {
  report: PowderFormulationReport;
  labInputs: PowderLabMeasurementInputs;
  onUpdateLabInputs: (inputs: PowderLabMeasurementInputs) => void;
  batchSizeKg?: number;
}

export const PowderEngineDashboard: React.FC<Props> = ({
  report,
  labInputs,
  onUpdateLabInputs
}) => {
  const [showLabInputsModal, setShowLabInputsModal] = useState(false);
  const [localLabInputs, setLocalLabInputs] = useState<PowderLabMeasurementInputs>(labInputs);

  const handleSaveLabInputs = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLabInputs(localLabInputs);
    setShowLabInputsModal(false);
  };

  const renderSourceBadge = (source: ResultSource) => {
    switch (source) {
      case 'MEASURED':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Lab Measured
          </span>
        );
      case 'CALCULATED':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40">
            Calculated
          </span>
        );
      case 'PREDICTED':
      case 'SCREENING':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
            Predicted / Screening
          </span>
        );
      case 'ESTIMATED':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
            Estimated
          </span>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
            Insufficient Data
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Not Measured
          </span>
        );
    }
  };

  const {
    massBalance,
    activeMatter,
    builderSystem,
    chelationSequestration,
    alkalinity,
    density,
    flowability,
    angleOfRepose,
    particleSize,
    cakingHygroscopicity,
    hygroscopicity,
    powderPH,
    hardWater,
    dissolutionDispersibility,
    foam,
    cleaningPerformance,
    stability,
    safety,
    costing,
    verdict,
    moistureAndDryMatter
  } = report;

  return (
    <div id="powder-engine-dashboard" className="space-y-6">
      {/* Top Banner / Verdict */}
      <div
        id="powder-verdict-banner"
        className={`p-5 rounded-xl border ${
          verdict.overallStatus === 'BALANCED & COMPLIANT'
            ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/50'
            : verdict.overallStatus === 'INCOMPLETE FORMULA'
            ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-amber-500/50'
            : 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border-rose-500/50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-lg ${
                verdict.overallStatus === 'BALANCED & COMPLIANT'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : verdict.overallStatus === 'INCOMPLETE FORMULA'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  Powder Formulation Engine Phase 2 • Laboratory Physics
                </span>
                {renderSourceBadge(verdict.source)}
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                {verdict.overallStatus}
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {verdict.summary}
              </p>
            </div>
          </div>
          <button
            id="open-powder-lab-inputs-btn"
            onClick={() => {
              setLocalLabInputs(labInputs);
              setShowLabInputsModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-colors shadow-lg shadow-cyan-900/30"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Enter Lab Test Data</span>
          </button>
        </div>

        {/* Chemist Advisories */}
        {verdict.chemistAdvisories.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
            {verdict.chemistAdvisories.map((adv, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{adv}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. SECTION: FORMULA BALANCE */}
      {/* ======================================================== */}
      <div id="section-formula-balance" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1. Formula Balance</h3>
              <p className="text-xs text-slate-400">Strict dry-formulation mass balance (Zero automatic water addition)</p>
            </div>
          </div>
          {renderSourceBadge(massBalance.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Assigned Formulation</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              {massBalance.assignedPercentage.toFixed(2)}%
            </div>
            <span className="text-[11px] text-slate-500">Total dry raw materials</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Unassigned Formulation</span>
            <div className={`text-2xl font-bold mt-1 ${massBalance.unassignedPercentage > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {massBalance.unassignedPercentage.toFixed(2)}%
            </div>
            <span className="text-[11px] text-slate-500">Unassigned percentage points</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Formula Total</span>
            <div className={`text-2xl font-bold mt-1 ${massBalance.status === 'BALANCED' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {massBalance.formulaTotalPct.toFixed(2)}%
            </div>
            <span className="text-[11px] text-slate-500">Batch Target: 100.00%</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Balance Status</span>
            <div className={`text-sm font-bold mt-2 uppercase tracking-wider ${massBalance.status === 'BALANCED' ? 'text-emerald-400' : massBalance.status === 'INCOMPLETE' ? 'text-amber-400' : 'text-rose-400'}`}>
              {massBalance.status}
            </div>
            <span className="text-[11px] text-slate-500">
              {massBalance.status === 'INCOMPLETE' ? `Missing ${massBalance.missingPercentage.toFixed(2)}%` : 'Stoichiometrically complete'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
          {massBalance.statusMessage}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 2. SECTION: CHEMISTRY */}
      {/* ======================================================== */}
      <div id="section-chemistry" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">2. Chemistry & Active Matter</h3>
              <p className="text-xs text-slate-400">Surfactant actives, inorganic builders, chelation, alkalinity & aqueous pH</p>
            </div>
          </div>
          {renderSourceBadge(activeMatter.source)}
        </div>

        {/* 4 Cards: Actives, Builders, Chelators, Alkalinity & pH */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Surfactants */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Active Surfactants</span>
              {renderSourceBadge(activeMatter.source)}
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {activeMatter.totalSurfactantActivePct.toFixed(2)}%
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Anionic:</span>
                <span className="font-mono text-white">{activeMatter.anionicActivePct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Nonionic:</span>
                <span className="font-mono text-white">{activeMatter.nonionicActivePct.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Builder System */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Builder System</span>
              {renderSourceBadge(builderSystem.source)}
            </div>
            <div className="text-2xl font-bold text-indigo-400">
              {builderSystem.totalBuilderPct.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              {builderSystem.builderIngredients.length > 0
                ? builderSystem.builderIngredients.map(b => `${b.name} (${b.percentage}%)`).join(', ')
                : 'No primary inorganic builders'}
            </p>
          </div>

          {/* Chelation / Sequestration */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Chelation / Sequestrant</span>
              {renderSourceBadge(chelationSequestration.source)}
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {chelationSequestration.totalChelatorPct.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              {chelationSequestration.capacityStatus}
            </p>
          </div>

          {/* Alkalinity & 1% Aqueous pH */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Aqueous pH (1% w/v)</span>
              {renderSourceBadge(powderPH.source)}
            </div>
            <div className="text-2xl font-bold text-amber-400 flex items-baseline gap-2">
              <span>{powderPH.measuredPH !== undefined ? powderPH.measuredPH.toFixed(2) : powderPH.calculatedAqueousPH.toFixed(2)}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                {powderPH.targetRange.isSpecified ? `(Target: ${powderPH.targetRange.min}–${powderPH.targetRange.max})` : 'Alkaline matrix'}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Reserve: <span className="text-slate-200 font-mono font-medium">{alkalinity.estimatedNa2OEquivalentPct}% Na₂O eq</span>
            </div>
          </div>
        </div>

        {/* Detailed Aqueous pH & Hard Water Test Basis Notice */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between text-slate-300 font-medium">
            <span>Test Basis: {powderPH.testBasis.method}</span>
            <span>Temp: {powderPH.testBasis.temperatureC}°C | Hardness: {powderPH.testBasis.solutionHardnessPpm} ppm</span>
          </div>
          <p>{powderPH.statusMessage}</p>
          <div className="pt-1.5 border-t border-slate-800/60 text-slate-400">
            <strong className="text-slate-300">Hard Water Protection ({hardWater.waterHardnessDemandPpm} ppm demand): </strong>
            <span className="text-emerald-400 font-medium">{hardWater.builderProtectionRating}</span> — {hardWater.details}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SECTION: PHYSICAL PROPERTIES */}
      {/* ======================================================== */}
      <div id="section-physical-properties" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Physical Properties (Density)</h3>
              <p className="text-xs text-slate-400">Loose bulk density, tapped bulk density, cylinder volume and unit conversions</p>
            </div>
          </div>
          {renderSourceBadge(density.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Loose Bulk Density */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Loose Bulk Density</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              {density.measuredBulkDensityGPerL !== undefined ? `${density.measuredBulkDensityGPerL} g/L` : 'Not Measured'}
            </div>
            <div className="text-xs text-slate-400 space-y-0.5">
              <div>g/mL (kg/L): <span className="text-slate-200 font-mono">{density.bulkDensityGPerMl !== undefined ? density.bulkDensityGPerMl : '—'}</span></div>
              <div>kg/m³: <span className="text-slate-200 font-mono">{density.bulkDensityKgPerM3 !== undefined ? density.bulkDensityKgPerM3 : '—'}</span></div>
            </div>
          </div>

          {/* Tapped Bulk Density */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Tapped Bulk Density</span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">
              {density.measuredTappedDensityGPerL !== undefined ? `${density.measuredTappedDensityGPerL} g/L` : 'Not Measured'}
            </div>
            <div className="text-xs text-slate-400 space-y-0.5">
              <div>g/mL (kg/L): <span className="text-slate-200 font-mono">{density.tappedDensityGPerMl !== undefined ? density.tappedDensityGPerMl : '—'}</span></div>
              <div>kg/m³: <span className="text-slate-200 font-mono">{density.tappedDensityKgPerM3 !== undefined ? density.tappedDensityKgPerM3 : '—'}</span></div>
            </div>
          </div>

          {/* Screening & Matrix Notes */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Formulation Matrix Profile</span>
            <div className="text-sm font-semibold text-slate-200 mt-1">
              {density.displayRange}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {density.notes}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SECTION: FLOWABILITY */}
      {/* ======================================================== */}
      <div id="section-flowability" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">4. Flowability, Carr Index & Angle of Repose</h3>
              <p className="text-xs text-slate-400">Compressibility ratio, Hausner ratio, and cone flow angle</p>
            </div>
          </div>
          {renderSourceBadge(flowability.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Carr Index */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Carr Compressibility Index</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {flowability.carrIndexPct !== undefined ? `${flowability.carrIndexPct}%` : 'Not Measured'}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Rating: <span className="text-slate-200">{flowability.flowRating}</span>
            </span>
          </div>

          {/* Hausner Ratio */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Hausner Ratio</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              {flowability.hausnerRatio !== undefined ? flowability.hausnerRatio : 'Not Measured'}
            </div>
            <span className="text-xs text-slate-400">
              {flowability.hausnerRatio !== undefined ? (flowability.hausnerRatio < 1.25 ? 'Free-flowing powder' : 'Cohesive tendency') : 'Requires loose & tapped density'}
            </span>
          </div>

          {/* Angle of Repose */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Angle of Repose</span>
              {renderSourceBadge(angleOfRepose.source)}
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {angleOfRepose.measuredAngleDegrees !== undefined ? `${angleOfRepose.measuredAngleDegrees}°` : 'Not Measured'}
            </div>
            <span className="text-xs text-slate-400">
              {angleOfRepose.rating}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
          {flowability.description}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 5. SECTION: MOISTURE & DRY MATTER */}
      {/* ======================================================== */}
      <div id="section-moisture-dry-matter" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">5. Moisture & Dry Matter</h3>
              <p className="text-xs text-slate-400">Total formula mass, moisture mass (kg), dry matter mass (kg) and moisture %</p>
            </div>
          </div>
          {renderSourceBadge(moistureAndDryMatter.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Total Formula Mass</span>
            <div className="text-xl font-bold text-white mt-1">
              {moistureAndDryMatter.totalFormulaMassKg} kg
            </div>
            <span className="text-[11px] text-slate-500">Batch recipe loading</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Moisture Mass</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {moistureAndDryMatter.moistureMassKg} kg
            </div>
            <span className="text-[11px] text-slate-500">Hydration & free water</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Dry Matter Mass</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {moistureAndDryMatter.dryMatterMassKg} kg
            </div>
            <span className="text-[11px] text-slate-500">100% dry active solids</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Moisture %</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {moistureAndDryMatter.moisturePct}%
            </div>
            <span className="text-[11px] text-slate-500">{moistureAndDryMatter.moistureStatus}</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Dry Matter %</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {moistureAndDryMatter.dryMatterPct}%
            </div>
            <span className="text-[11px] text-slate-500">100 - Moisture %</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
          {moistureAndDryMatter.basisExplanation}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 6. SECTION: PARTICLE SIZE DISTRIBUTION (PSD) */}
      {/* ======================================================== */}
      <div id="section-particle-size" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">6. Particle Size Distribution (PSD) & Dustiness</h3>
              <p className="text-xs text-slate-400">D10, D50, D90 median diameter and sieve fraction analysis</p>
            </div>
          </div>
          {renderSourceBadge(particleSize.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">D10 Fraction (Fine)</span>
            <div className="text-xl font-bold text-purple-400 mt-1">
              {particleSize.measuredD10Um !== undefined ? `${particleSize.measuredD10Um} µm` : 'Not Measured'}
            </div>
            <span className="text-[11px] text-slate-500">10% smaller than</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">D50 Median Granule</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {particleSize.measuredD50Um !== undefined ? `${particleSize.measuredD50Um} µm` : 'Not Measured'}
            </div>
            <span className="text-[11px] text-slate-500">50% median granule size</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">D90 Fraction (Coarse)</span>
            <div className="text-xl font-bold text-indigo-400 mt-1">
              {particleSize.measuredD90Um !== undefined ? `${particleSize.measuredD90Um} µm` : 'Not Measured'}
            </div>
            <span className="text-[11px] text-slate-500">90% smaller than</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Dustiness Risk</span>
            <div className={`text-sm font-bold mt-2 uppercase tracking-wider ${particleSize.dustinessRisk === 'High' ? 'text-rose-400' : particleSize.dustinessRisk === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {particleSize.dustinessRisk}
            </div>
            <span className="text-[11px] text-slate-500">
              {particleSize.finesFractionUnder150UmPct !== undefined ? `${particleSize.finesFractionUnder150UmPct}% <150µm fines` : 'Sieve data unmeasured'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. SECTION: CAKING RISK & HYGROSCOPICITY */}
      {/* ======================================================== */}
      <div id="section-caking-hygroscopicity" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">7. Caking Risk & Hygroscopicity Screening</h3>
              <p className="text-xs text-slate-400">Liquid surfactant loading, hygroscopic salts, and packaging barrier recommendations</p>
            </div>
          </div>
          {renderSourceBadge(cakingHygroscopicity.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Caking Tendency</span>
            <div className={`text-xl font-bold mt-1 ${cakingHygroscopicity.cakingRisk === 'High Caking Risk' ? 'text-rose-400' : cakingHygroscopicity.cakingRisk === 'Moderate Risk' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {cakingHygroscopicity.cakingRisk}
            </div>
            <span className="text-[11px] text-slate-500">Liquid Loading: {cakingHygroscopicity.liquidLoadingPct}%</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Hygroscopicity Rating</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {hygroscopicity.hygroscopicityRating}
            </div>
            <span className="text-[11px] text-slate-500">Hygroscopic Salts: {cakingHygroscopicity.hygroscopicSaltPct}%</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Flow Aid Status</span>
            <div className={`text-sm font-bold mt-2 ${cakingHygroscopicity.antiCakingAgentPresent ? 'text-emerald-400' : 'text-slate-400'}`}>
              {cakingHygroscopicity.antiCakingAgentPresent ? '✓ Anti-Caking Agent Present' : 'No Flow Aid Detected'}
            </div>
            <span className="text-[11px] text-slate-500">Silica / Zeolite anti-caking</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
          <strong className="text-slate-300">Packaging Barrier Recommendation: </strong>
          {cakingHygroscopicity.packagingRecommendation}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 8. SECTION: DISSOLUTION & DISPERSIBILITY */}
      {/* ======================================================== */}
      <div id="section-dissolution-dispersibility" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">8. Dissolution & Dispersibility</h3>
              <p className="text-xs text-slate-400">Cold water solubility, dissolution rate (sec), undissolved residue (%) and visual observations</p>
            </div>
          </div>
          {renderSourceBadge(dissolutionDispersibility.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Dissolution Time</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {dissolutionDispersibility.testConditions?.measuredDissolutionTimeSec !== undefined ? `${dissolutionDispersibility.testConditions.measuredDissolutionTimeSec} sec` : 'Not Measured'}
            </div>
            <span className="text-[11px] text-slate-500">
              {dissolutionDispersibility.predictedColdWaterSolubility}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Undissolved Residue</span>
            <div className="text-xl font-bold text-teal-400 mt-1">
              {dissolutionDispersibility.testConditions?.measuredUndissolvedResiduePct !== undefined ? `${dissolutionDispersibility.testConditions.measuredUndissolvedResiduePct}%` : 'Not Measured'}
            </div>
            <span className="text-[11px] text-slate-500">
              {dissolutionDispersibility.hasInsolubleInorganics ? `Contains insoluble: ${dissolutionDispersibility.insolubleInorganicNames.join(', ')}` : 'Fully soluble formula'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Dispersibility Observation</span>
            <div className="text-sm font-semibold text-slate-200 mt-1 capitalize">
              {dissolutionDispersibility.dispersibilityObservation || 'Not Observed'}
            </div>
            <span className="text-[11px] text-slate-500">
              {dissolutionDispersibility.dispersibilityNotes || 'Laboratory dispersion test'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. SECTION: PERFORMANCE (WASH & FOAM) */}
      {/* ======================================================== */}
      <div id="section-performance" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">9. Performance & Wash Spectrum</h3>
              <p className="text-xs text-slate-400">Multifactorial detergency screening, soil categories, and foam profile</p>
            </div>
          </div>
          {renderSourceBadge(cleaningPerformance.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Screening Detergency</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {cleaningPerformance.screeningDetergencyScore} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {cleaningPerformance.measuredSoilRemovalPct !== undefined ? `Lab Measured: ${cleaningPerformance.measuredSoilRemovalPct}%` : 'Screening model'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Particulate Soil</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">
              {cleaningPerformance.particulateRemovalScore}%
            </div>
            <span className="text-[11px] text-slate-500">Clay, mud & carbon dispersion</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Oily & Grease Soil</span>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {cleaningPerformance.oilyGreaseScore}%
            </div>
            <span className="text-[11px] text-slate-500">Sebum & grease saponification</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Foam Profile</span>
            <div className="text-sm font-semibold text-slate-200 mt-1">
              {foam.screeningFoamProfile}
            </div>
            <span className="text-[11px] text-slate-500">
              {foam.measuredRossMilesInitialMm !== undefined ? `Ross-Miles: ${foam.measuredRossMilesInitialMm} mm` : 'Screening profile'}
            </span>
          </div>
        </div>

        {/* Matrix Stability & Bleach/Enzyme Compatibility */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong className="text-slate-300">Enzyme/Bleach Compatibility: </strong>
            <span className="text-emerald-400">{stability.enzymeBleachCompatibility}</span>
          </div>
          <div>
            <strong className="text-slate-300">Fragrance Stability: </strong>
            <span className="text-slate-200">{stability.fragranceStabilityRating}</span>
          </div>
          <div>
            <strong className="text-slate-300">Moisture Sensitivity: </strong>
            <span className="text-slate-200">{stability.moistureAbsorptionSensitivity}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 10. SECTION: SAFETY & GHS CLASSIFICATION */}
      {/* ======================================================== */}
      <div id="section-safety" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">10. Safety & Formulation Screening</h3>
              <p className="text-xs text-slate-400">Formal regulatory GHS classification status vs. occupational safety & handling PPE screening</p>
            </div>
          </div>
          {renderSourceBadge(safety.source)}
        </div>

        {/* Formal GHS Status Banner */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Formal GHS Mixture Classification:</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                {safety.formalGHSStatus}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {safety.formalGHSClassification}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Screening Signal Word</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${safety.screeningSignalWord === 'DANGER' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : safety.screeningSignalWord === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
                {safety.screeningSignalWord}
              </span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1">
              {safety.screeningHazardAdvisories.map((h, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-mono uppercase text-slate-400">Occupational Manufacturing PPE</span>
            <ul className="text-xs text-slate-300 space-y-1">
              {safety.recommendedPPE.map((p, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 11. SECTION: COST & DOSAGE */}
      {/* ======================================================== */}
      <div id="section-costing" className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">11. Costing & Commercial Dosing</h3>
              <p className="text-xs text-slate-400">Dry raw material unit economics, batch production cost, and cost per wash</p>
            </div>
          </div>
          {renderSourceBadge(costing.source)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Raw Material Cost / kg</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              ${costing.costPerKg.toFixed(3)} <span className="text-xs text-slate-400 font-normal">/ kg</span>
            </div>
            <span className="text-[11px] text-slate-500">100% dry recipe basis</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Total Batch Cost ({costing.batchSizeKg} kg)</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              ${costing.totalBatchCost.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">Batch scale economics</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Cost / Wash Dose (50g)</span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">
              ${costing.costPerWashDose.toFixed(3)}
            </div>
            <span className="text-[11px] text-slate-500">Consumer unit dose economics</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* LABORATORY MEASUREMENTS MODAL */}
      {/* ======================================================== */}
      {showLabInputsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Laboratory Powder Physics & Test Entry</h3>
              </div>
              <button
                onClick={() => setShowLabInputsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLabInputs} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Density & Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Bulk & Tapped Density (Graduated Cylinder Test)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Sample Mass (g)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 100"
                      value={localLabInputs.measuredSampleMassG ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredSampleMassG: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Loose Volume (mL)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 150"
                      value={localLabInputs.measuredLooseVolumeMl ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredLooseVolumeMl: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Tapped Volume (mL)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 125"
                      value={localLabInputs.measuredTappedVolumeMl ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredTappedVolumeMl: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Angle of Repose */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Angle of Repose Cone Test
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Cone Height h (mm)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 35"
                      value={localLabInputs.measuredAngleHeightMm ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredAngleHeightMm: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Cone Radius r (mm)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 50"
                      value={localLabInputs.measuredAngleRadiusMm ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredAngleRadiusMm: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Or Direct Angle (°)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 35.0"
                      value={localLabInputs.measuredAngleOfReposeDegrees ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredAngleOfReposeDegrees: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Moisture & Dry Matter */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> Finished Powder Moisture Test (LOD @ 105°C / Karl Fischer)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Measured Moisture (%)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 3.5"
                      value={localLabInputs.measuredMoisturePct ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredMoisturePct: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Test Method</label>
                    <input
                      type="text"
                      placeholder="e.g. Loss on Drying 105°C"
                      value={localLabInputs.moistureTestMethod ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, moistureTestMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Sample Mass (g)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 10.0"
                      value={localLabInputs.moistureSampleMassG ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, moistureSampleMassG: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Particle Size Distribution (PSD) */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Particle Size Distribution (Laser / Sieve Analysis)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">D10 (µm)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 180"
                      value={localLabInputs.measuredD10Um ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredD10Um: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">D50 (µm)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 450"
                      value={localLabInputs.measuredD50Um ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredD50Um: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">D90 (µm)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 850"
                      value={localLabInputs.measuredD90Um ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredD90Um: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Fines &lt;150µm (%)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 4.5"
                      value={localLabInputs.measuredFinesPct ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredFinesPct: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Aqueous pH & Dissolution */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-widest text-teal-400 flex items-center gap-2">
                  <Beaker className="w-4 h-4" /> 1% Aqueous Solution pH & Dissolution Testing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Measured 1% Aqueous pH</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 10.65"
                      value={localLabInputs.measured1PctAqueousPH ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measured1PctAqueousPH: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Dissolution Time (sec)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 45"
                      value={localLabInputs.measuredDissolutionTimeSec ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredDissolutionTimeSec: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Undissolved Residue (%)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 0.2"
                      value={localLabInputs.measuredUndissolvedResiduePct ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredUndissolvedResiduePct: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Visual Dispersibility</label>
                    <select
                      value={localLabInputs.dispersibilityObservation ?? 'not observed'}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, dispersibilityObservation: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
                    >
                      <option value="not observed">Not Observed</option>
                      <option value="fully dispersed">Fully Dispersed</option>
                      <option value="partially dispersed">Partially Dispersed</option>
                      <option value="floating">Floating Agglomerates</option>
                      <option value="sediment">Sedimentation / Insoluble Solids</option>
                      <option value="agglomeration">Sticky Agglomeration</option>
                      <option value="residue">Undissolved Surface Residue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Reserve Alkalinity (% Na₂O eq)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 18.5"
                      value={localLabInputs.measuredReserveAlkalinityPctNa2O ?? ''}
                      onChange={(e) => setLocalLabInputs({ ...localLabInputs, measuredReserveAlkalinityPctNa2O: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLabInputsModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-colors shadow-lg shadow-cyan-900/30"
                >
                  Apply Lab Measurements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

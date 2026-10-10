import React from 'react';
import { Layers, Activity, Zap, Scale, DollarSign, CheckCircle, ShieldAlert } from 'lucide-react';

interface AnalyticalMetricsPanelProps {
  hlbVal: number;
  cmcRes: any;
  viscosityVal: number;
  densityRes: any;
  compatibilityRes: any;
  marginChain: any;
}

export const AnalyticalMetricsPanel: React.FC<AnalyticalMetricsPanelProps> = ({
  hlbVal,
  cmcRes,
  viscosityVal,
  densityRes,
  compatibilityRes,
  marginChain
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* HLB Card */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" /> Blended Surfactant HLB
          </span>
          <span className="text-base font-black text-indigo-400">{hlbVal.toFixed(1)}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {hlbVal > 12 ? 'O/W Emulsification & Detergency range (>12).' : (hlbVal > 8 ? 'W/O Emulsion or wetting agent range.' : 'Low hydrophilic character.')}
        </p>
      </div>

      {/* Mixed CMC Card */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" /> Mixed CMC (Micellization)
          </span>
          <span className="text-base font-black text-cyan-400">
            {cmcRes ? `${cmcRes.mixedCmcPpm} ppm` : 'N/A'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {cmcRes ? `Estimated critical micelle concentration: ${cmcRes.mixedCmcMolar} M (${cmcRes.mixedCmcPpm} mg/L).` : 'Insufficient surfactant CMC parameters.'}
        </p>
      </div>

      {/* Viscosity Card */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" /> Predicted Viscosity
          </span>
          <span className="text-base font-black text-amber-400">{viscosityVal} cP</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Estimated Brookfield shear viscosity (Spindle 3 @ 20 RPM, 25°C).
        </p>
      </div>

      {/* Mixture Density Card */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-400" /> Specific Gravity & Density
          </span>
          <span className="text-base font-black text-emerald-400">
            {densityRes?.densityGPerCm3?.toFixed(3) || '1.000'} g/cm³
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {densityRes?.specificGravity ? `Specific gravity: ${densityRes.specificGravity.toFixed(3)} (20°C).` : 'Water baseline density.'}
        </p>
      </div>

      {/* Compatibility Card */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {compatibilityRes?.isCompatible ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            )}
            Ionic Compatibility
          </span>
          <span className={`text-base font-black ${compatibilityRes?.isCompatible ? 'text-emerald-400' : 'text-red-400'}`}>
            {compatibilityRes?.score || 100}%
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {compatibilityRes?.hazard || 'No ionic charge precipitation conflicts detected.'}
        </p>
      </div>

      {/* Commercial Pricing Card */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-400" /> Suggested MRP / L
          </span>
          <span className="text-base font-black text-amber-400">
            ${marginChain?.suggestedMRP?.toFixed(2) || '0.00'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ex-factory: ${marginChain?.finalExFactoryCost?.toFixed(2)} | Retailer: ${marginChain?.suggestedRetail?.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

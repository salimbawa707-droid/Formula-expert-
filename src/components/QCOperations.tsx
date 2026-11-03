import { ClipboardCheck } from 'lucide-react';

export default function QCOperations(_props?: any) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="qc-operations-root">
      <div className="flex justify-between items-center bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Quality Control & Laboratory SOPs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Standardized testing protocols and quality assurance logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 hover:border-emerald-500/40 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
            01
          </div>
          <h3 className="font-extrabold text-white text-base">Active Anionic Matter Titration</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Epton two-phase titration using Hyamine 1622 against Acid Yellow / Methylene Blue indicator.</p>
        </div>

        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 hover:border-emerald-500/40 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
            02
          </div>
          <h3 className="font-extrabold text-white text-base">Viscosity & Rheology Check</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Brookfield RVT rotational viscometer at 25°C, Spindle #3 at 20 RPM.</p>
        </div>

        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 hover:border-emerald-500/40 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
            03
          </div>
          <h3 className="font-extrabold text-white text-base">Freeze-Thaw Stability Test</h3>
          <p className="text-xs text-slate-400 leading-relaxed">3 cycles of -10°C (16 hrs) to +40°C (8 hrs) to verify phase homogeneity.</p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Activity, Droplets, Atom, DollarSign, Award, FlaskConical } from 'lucide-react';

interface FormulatorHeaderProps {
  activeSurfactants: number;
  activeMatterPct: number;
  totalSolidsPct: number;
  calculatedPH: number;
  costPerKg: number;
  aiGrade: string;
}

export const FormulatorHeader: React.FC<FormulatorHeaderProps> = React.memo(({
  activeSurfactants,
  activeMatterPct,
  totalSolidsPct,
  calculatedPH,
  costPerKg,
  aiGrade
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-4 shadow-xl">
      <div className="bg-[#131d35] p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Droplets className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Surfactants</div>
          <div className="text-sm sm:text-base font-black text-white">{activeSurfactants.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-[#131d35] p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Matter</div>
          <div className="text-sm sm:text-base font-black text-white">{activeMatterPct.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-[#131d35] p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Atom className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Solids</div>
          <div className="text-sm sm:text-base font-black text-white">{totalSolidsPct.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-[#131d35] p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Est. Equilibrium pH</div>
          <div className="text-sm sm:text-base font-black text-amber-300">{calculatedPH.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-[#131d35] p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <DollarSign className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Batch Cost / kg</div>
          <div className="text-sm sm:text-base font-black text-emerald-400">₹{costPerKg.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-[#131d35] p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Scientific Grade</div>
          <div className="text-sm sm:text-base font-black text-amber-400">{aiGrade}</div>
        </div>
      </div>
    </div>
  );
});

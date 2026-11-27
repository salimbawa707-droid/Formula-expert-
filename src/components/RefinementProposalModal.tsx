import React from 'react';
import { RefinementProposal } from '../utils/refinementEngine';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposals: RefinementProposal[];
}

export const RefinementProposalModal: React.FC<Props> = ({ isOpen, onClose, proposals }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0e1629] border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Sparkles className="text-cyan-400" /> Refinement Evidence Review
        </h2>
        {proposals.length === 0 ? (
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Insufficient eligible ingredient-composition evidence</span>
            </div>
            <p className="text-slate-400">
              No proposal is generated unless the saved lab records contain category-matched,
              accepted, measured ingredient-percentage observations from at least three distinct formula IDs.
            </p>
            <p className="text-slate-500 text-xs">
              pH, viscosity, cleaning-score and other KPI measurements do not reveal recipe ingredient percentages.
              They cannot be converted into ingredient adjustments. No formula change has been made.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map(p => (
              <div key={p.id} className="bg-[#131d35] p-4 rounded-xl border border-slate-600 space-y-2">
                <p className="text-sm font-bold text-cyan-300">{p.originalIngredient}</p>
                <p className="text-xs text-slate-300">{p.rationale}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">
                    Current {p.originalPercentage}% · Evidence mean {p.proposedPercentage}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-amber-300 font-bold">
                    Review only
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              These are descriptive evidence summaries, not optimized recommendations. Validate through a controlled experiment before changing a formula.
            </p>
          </div>
        )}
        <button onClick={onClose} className="w-full text-slate-400 text-sm mt-4">Close</button>
      </div>
    </div>
  );
};

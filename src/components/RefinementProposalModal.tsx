
import React from 'react';
import { RefinementProposal } from '../utils/refinementEngine';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposals: RefinementProposal[];
  onApply: (p: RefinementProposal) => void;
}

export const RefinementProposalModal: React.FC<Props> = ({ isOpen, onClose, proposals, onApply }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0e1629] border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Sparkles className="text-cyan-400" /> Refinement Proposals
        </h2>
        {proposals.length === 0 ? <p className="text-slate-400">No refinement proposals available at this time.</p> : (
          <div className="space-y-3">
            {proposals.map(p => (
              <div key={p.id} className="bg-[#131d35] p-4 rounded-xl border border-slate-600 space-y-2">
                <p className="text-sm font-bold text-cyan-300">{p.originalIngredient}</p>
                <p className="text-xs text-slate-300">{p.rationale}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">
                    {p.originalPercentage}% → <span className="font-bold text-white">{p.proposedPercentage}%</span>
                  </span>
                  <button onClick={() => onApply(p)} className="bg-cyan-600 text-white px-3 py-1 rounded text-xs font-bold">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="w-full text-slate-400 text-sm mt-4">Close</button>
      </div>
    </div>
  );
};

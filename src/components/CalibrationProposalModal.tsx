
import React, { useEffect, useState } from 'react';
import { CalibrationCandidateProposal } from '../utils/labEvidenceEngine';
import { getUserCalibrationProposals } from '../services/calibrationService';
import { auth } from '../services/firebaseClient';
import { Check, X, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (proposal: CalibrationCandidateProposal) => void;
}

export const CalibrationProposalModal: React.FC<Props> = ({ isOpen, onClose, onApply }) => {
  const [proposals, setProposals] = useState<CalibrationCandidateProposal[]>([]);

  useEffect(() => {
    async function loadProposals() {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const data = await getUserCalibrationProposals(userId);
        setProposals(data);
      }
    }
    if (isOpen) loadProposals();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0e1629] border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4">
        <h2 className="text-lg font-extrabold text-white">Calibration Proposals</h2>
        {proposals.length === 0 ? <p className="text-slate-400">No proposals available.</p> : (
          <div className="space-y-3">
            {proposals.map(p => (
              <div key={p.proposalId} className="bg-[#131d35] p-4 rounded-xl border border-slate-600 space-y-2">
                <p className="text-sm font-bold text-cyan-300">{p.parameterName}</p>
                <p className="text-xs text-slate-300">{p.rationale}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> {p.safetyWarning}
                  </span>
                  <button onClick={() => onApply(p)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold">
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

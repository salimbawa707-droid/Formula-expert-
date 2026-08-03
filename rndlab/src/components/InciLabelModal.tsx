import React, { useState } from "react";
import { Dna, X, CheckCircle } from "lucide-react";
import { getInciName } from "../utils/calculators";

interface InciLabelModalProps {
  isOpen: boolean;
  formulationResult: any;
  onClose: () => void;
}

export const InciLabelModal: React.FC<InciLabelModalProps> = React.memo(({
  isOpen,
  formulationResult,
  onClose
}) => {
  const [copiedInci, setCopiedInci] = useState(false);

  if (!isOpen || !formulationResult) return null;

  const sortedIngredients = [...(formulationResult?.ingredients || [])]
    .filter((ing: any) => (ing.percentage || 0) > 0)
    .map((ing: any) => ({
      originalName: ing.name,
      percentage: ing.percentage,
      inciName: getInciName(ing.name)
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const commaSeparatedList = sortedIngredients
    .map((ing) => ing.inciName)
    .join(", ");

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(commaSeparatedList);
    setCopiedInci(true);
    setTimeout(() => setCopiedInci(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-xs animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Dna size={16} className="text-[#0f766e]" />
            INCI / Label-Ready Ingredient List
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-gray-500 leading-relaxed">
            Generated in compliance with international labeling guidelines (FDA/EU Cosmetic & Detergent regulations). Ingredients are sorted strictly in descending order of concentration.
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 relative">
              <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">
                Formatted INCI List
              </label>
              <textarea
                readOnly
                value={commaSeparatedList}
                className="w-full h-24 bg-white border border-gray-200 rounded px-2.5 py-2 font-mono text-[11px] leading-relaxed focus:outline-none resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    copiedInci
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0f766e] text-white hover:bg-[#0d645c] shadow-xs"
                  }`}
                >
                  {copiedInci ? (
                    <>
                      <CheckCircle size={12} /> Copied!
                    </>
                  ) : (
                    <>
                      📋 Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Detailed translation table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-2.5 py-1.5 font-bold text-gray-600 text-[10px] uppercase border-b border-gray-100">
                Ingredient Mapping Details
              </div>
              <div className="max-h-[160px] overflow-y-auto divide-y divide-gray-100 bg-white">
                {sortedIngredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-1.5 text-[11px]">
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-gray-800 block truncate">{ing.originalName}</span>
                      <span className="text-[9px] text-gray-400 font-mono">INCI: {ing.inciName}</span>
                    </div>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50/50 px-1.5 py-0.5 rounded border border-teal-100/30">
                      {ing.percentage.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

export default InciLabelModal;

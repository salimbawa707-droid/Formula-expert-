import React from "react";
import { Bookmark, X, CheckCircle } from "lucide-react";

interface SaveFormulaModalProps {
  isOpen: boolean;
  lang: string;
  saveFormulaName: string;
  setSaveFormulaName: (name: string) => void;
  saveFormulaGrade: "Economy" | "Standard" | "Premium";
  setSaveFormulaGrade: (grade: "Economy" | "Standard" | "Premium") => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const SaveFormulaModal: React.FC<SaveFormulaModalProps> = React.memo(({
  isOpen,
  lang,
  saveFormulaName,
  setSaveFormulaName,
  saveFormulaGrade,
  setSaveFormulaGrade,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-xs animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Bookmark size={16} className="text-emerald-600" />
            {lang === "hi"
              ? "फॉर्मूलेशन लाइब्रेरी में सहेजें"
              : lang === "mr"
              ? "फॉर्म्युलेशन लायब्ररीमध्ये जतन करा"
              : "Save Formulation to Library"}
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
            {lang === "hi"
              ? "क्या आप इस फॉर्मूले को अपनी मुख्य लाइब्रेरी में सहेजना चाहते हैं? आप इसका नाम और गुणवत्ता (Grade) कस्टमाइज़ कर सकते हैं।"
              : lang === "mr"
              ? "तुम्ही हा फॉर्म्युला तुमच्या मुख्य लायब्ररीमध्ये जतन करू इच्छिता? तुम्ही त्याचे नाव आणि गुणवत्ता सानुकूल करू शकता."
              : "Do you want to save this customized formulation into your Formulation Library? You can customize the name and quality grade below."}
          </p>

          <div className="space-y-1">
            <label className="block font-bold text-gray-700">
              {lang === "hi" ? "फॉर्मूला नाम" : lang === "mr" ? "फॉर्म्युलाचे नाव" : "Formulation Name"}
            </label>
            <input
              type="text"
              value={saveFormulaName}
              onChange={(e) => setSaveFormulaName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all text-xs"
              placeholder="Enter formula name"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-gray-700">
              {lang === "hi" ? "ग्रेड (गुणवत्ता)" : lang === "mr" ? "ग्रेड (गुणवत्ता)" : "Grade (Quality Class)"}
            </label>
            <select
              value={saveFormulaGrade}
              onChange={(e) => setSaveFormulaGrade(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all text-xs"
            >
              <option value="Economy">Economy</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all cursor-pointer"
          >
            {lang === "hi" ? "रद्द करें" : lang === "mr" ? "रद्द करा" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle size={14} />
            {lang === "hi" ? "हाँ, सहेजें" : lang === "mr" ? "होय, जतन करा" : "Yes, Save Formula"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default SaveFormulaModal;

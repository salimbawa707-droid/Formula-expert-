import { FormulationIngredient } from '../types';
import { getInciName } from '../utils/calculators';

export interface InciLabelModalProps {
  isOpen?: boolean;
  formulationResult?: any;
  ingredients?: FormulationIngredient[];
  formulaName?: string;
  onClose: () => void;
}

export default function InciLabelModal({
  isOpen = true,
  formulationResult,
  ingredients = [],
  formulaName = 'Detergent Product',
  onClose
}: InciLabelModalProps) {
  if (isOpen === false) return null;
  const activeIngs = formulationResult?.ingredients || ingredients;
  // Sort by weight descending
  const sorted = [...activeIngs].sort((a: any, b: any) => (b.percent || b.percentage || 0) - (a.percent || a.percentage || 0));
  const inciString = sorted.map((i: any) => i.inciName || getInciName(i.name)).join(', ');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-semibold text-gray-900">Regulatory INCI Ingredient List</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
        </div>
        <p className="text-xs text-gray-500">Ingredients listed in descending order of concentration per GHS/EU regulatory compliance.</p>
        <div className="p-4 bg-gray-50 border rounded-lg font-mono text-sm text-gray-800 leading-relaxed select-all">
          <strong className="block text-gray-900 mb-1 font-sans">INCI Ingredients ({formulaName}):</strong>
          {inciString}.
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

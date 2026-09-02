import { useState, useEffect } from 'react';
import { FormulationIngredient } from '../types';

export interface SaveFormulaModalProps {
  isOpen?: boolean;
  ingredients?: FormulationIngredient[];
  batchSizeKg?: number;
  targetPH?: number;
  lang?: string;
  saveFormulaName?: string;
  setSaveFormulaName?: (val: string) => void;
  saveFormulaGrade?: string;
  setSaveFormulaGrade?: (val: any) => void;
  onSave?: (formulaName: string, category: string) => void;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function SaveFormulaModal({
  isOpen = true,
  ingredients: _ingredients = [],
  batchSizeKg: _batchSizeKg = 100,
  targetPH: _targetPH = 7,
  saveFormulaName,
  setSaveFormulaName,
  onSave,
  onClose,
  onConfirm
}: SaveFormulaModalProps) {
  const [name, setName] = useState(saveFormulaName || '');
  const [category, setCategory] = useState('Laundry Detergents');

  useEffect(() => {
    if (saveFormulaName !== undefined) {
      setName(saveFormulaName);
    }
  }, [saveFormulaName, isOpen]);

  if (isOpen === false) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || saveFormulaName?.trim() || '';
    if (!finalName) return;
    if (setSaveFormulaName) setSaveFormulaName(finalName);
    if (onSave) onSave(finalName, category);
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Formula to Library</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="save-formula-name-input" className="block text-sm font-medium text-gray-700 mb-1">
              Formula Name
            </label>
            <input
              id="save-formula-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (setSaveFormulaName) setSaveFormulaName(e.target.value);
              }}
              placeholder="e.g. Ultra Clean Heavy Duty Gel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none caret-gray-900 font-medium text-sm"
              style={{ color: '#111827', backgroundColor: '#ffffff', WebkitTextFillColor: '#111827' }}
            />
          </div>
          <div>
            <label htmlFor="save-formula-category-select" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="save-formula-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-sm"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            >
              <option value="Laundry Detergents">Laundry Detergents</option>
              <option value="Dishwashing">Dishwashing</option>
              <option value="Hard Surface Cleaner">Hard Surface Cleaner</option>
              <option value="Car Wash">Car Wash</option>
              <option value="Industrial & Institutional">Industrial & Institutional</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
            >
              Save Formula
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { FormulationIngredient } from '../types';
import { PRODUCT_CATEGORIES } from './aiformulator/constants';
import { useFormulaStore } from '../stores/useFormulaStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { canSaveFormula } from '../utils/featureGating';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';

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
  onConfirm,
}: SaveFormulaModalProps) {
  const { savedFormulas } = useFormulaStore();
  const { profile } = useSettingsStore();

  const [name, setName] = useState(saveFormulaName || '');
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]?.id || 'LAUNDRY_LIQUID');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (saveFormulaName !== undefined) {
      setName(saveFormulaName);
    }
  }, [saveFormulaName, isOpen]);

  if (isOpen === false) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check plan limits
    if (!canSaveFormula(savedFormulas.length, profile.plan)) {
      setShowPaywall(true);
      return;
    }

    const finalName = name.trim() || saveFormulaName?.trim() || '';
    if (!finalName) return;
    if (setSaveFormulaName) setSaveFormulaName(finalName);
    if (onSave) onSave(finalName, category);
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
          <h3 className="text-lg font-bold text-white mb-4">Save Formula to Library</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="save-formula-name-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Formula Name *
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
                placeholder="e.g. Premium High-Foam Hand Dishwash"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label htmlFor="save-formula-category-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Product Category *
              </label>
              <select
                id="save-formula-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] text-slate-400 flex justify-between items-center">
              <span>Plan Usage:</span>
              <span className="font-mono font-bold text-white">
                {savedFormulas.length} / {profile.plan === 'free' ? '7 Saved' : 'Unlimited'}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/20"
              >
                Save Formula
              </button>
            </div>
          </form>
        </div>
      </div>

      <SubscriptionPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightedFeature="Saved Formula Limit (7 Max on Free Plan)"
      />
    </>
  );
}

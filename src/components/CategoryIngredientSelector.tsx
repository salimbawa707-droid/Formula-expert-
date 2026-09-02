import { useState } from 'react';
import { Search, X, BookOpen, ChevronDown, Check, Filter } from 'lucide-react';
import { getAllUniversalIngredients, searchUniversalIngredients, UniversalIngredient } from '../data/universalIngredientLibrary';

export function getCategorySpecificIngredients(category: string): UniversalIngredient[] {
  const all = getAllUniversalIngredients();
  if (!category || category === 'All' || category.includes('Uncategorized')) return all;

  const catLower = (category || '').toLowerCase();
  
  const filtered = all.filter(i => {
    const itemCat = (i?.category || '').toLowerCase();
    const itemSub = (i?.subCategory || '').toLowerCase();
    const itemFn = (i?.function || '').toLowerCase();
    
    return itemCat.includes(catLower) || 
           catLower.includes(itemCat) || 
           itemSub.includes(catLower) || 
           itemFn.includes(catLower);
  });

  return filtered.length > 0 ? filtered : all;
}

interface CategoryIngredientSelectorProps {
  category?: string;
  catName?: string;
  name?: string;
  onSelect?: (ingredient: UniversalIngredient) => void;
  onSelectChange?: (val: any) => void;
  onClose?: () => void;
}

export default function CategoryIngredientSelector({
  category,
  catName,
  name = '',
  onSelect,
  onSelectChange,
  onClose
}: CategoryIngredientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'recommended'>('all');

  const activeCategory = category || catName || 'All';
  const categoryIngredients = getCategorySpecificIngredients(activeCategory);
  const allIngredients = getAllUniversalIngredients();

  console.log(`[CategoryIngredientSelector] Total ingredients loaded in UI: ${allIngredients.length}`);

  const searchLower = (search || '').toLowerCase().trim();

  const baseList = (filterMode === 'recommended' && activeCategory !== 'All')
    ? categoryIngredients
    : allIngredients;

  const filteredModalIngredients = searchLower
    ? searchUniversalIngredients(searchLower, filterMode === 'recommended' && activeCategory !== 'All' ? activeCategory : undefined)
    : baseList;

  const handleChoose = (ing: UniversalIngredient | string) => {
    const ingObj = typeof ing === 'string'
      ? (allIngredients.find(i => i.id === ing || i.name === ing) || {
          id: ing,
          name: ing,
          category: activeCategory !== 'All' ? activeCategory : 'General',
          casNumber: '',
          inciName: ing,
          function: '',
          activeDefault: 100,
          costPerKg: 0,
          description: ''
        })
      : ing;

    const selectedName = typeof ing === 'string' ? ingObj.name : ing.name;

    if (onSelect) {
      onSelect(ingObj);
    }
    if (onSelectChange) {
      onSelectChange(selectedName);
    }
    if (onClose) {
      onClose();
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="w-full relative">
      {/* Inline Selection Row */}
      <div className="flex items-center gap-1 w-full">
        <div className="relative flex-1 min-w-0">
          <select
            value={name}
            onChange={(e) => {
              if (e.target.value === '__BROWSE_MORE__') {
                setIsOpen(true);
              } else {
                handleChoose(e.target.value);
              }
            }}
            className="w-full bg-white text-gray-900 caret-[#0f766e] border border-[#e5e7eb] rounded-lg px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-[#0f766e] focus:outline-none appearance-none pr-6 truncate cursor-pointer shadow-2xs hover:border-teal-400 transition"
          >
            <option value="" disabled className="text-gray-400">
              -- Select Ingredient --
            </option>
            {name && !allIngredients.some(i => i.name === name) && (
              <option value={name}>{name}</option>
            )}
            <optgroup label={`All Database Ingredients (${allIngredients.length})`}>
              {allIngredients.map((ing) => (
                <option key={ing.id} value={ing.name}>
                  {ing.name} ({ing.activeDefault}% Active) - {ing.category}
                </option>
              ))}
            </optgroup>
            <option value="__BROWSE_MORE__" className="font-bold text-teal-700">
              🔍 Browse Full Chemical Database...
            </option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer shrink-0"
          title="Browse Ingredient Library"
        >
          <BookOpen size={13} />
        </button>
      </div>

      {/* Modal View */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-teal-400" />
                  <h3 className="text-base md:text-lg font-bold text-white">
                    Select Ingredient {activeCategory && activeCategory !== 'All' ? `for ${activeCategory}` : ''}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Loaded: {allIngredients.length} total ingredients in R&D database ({categoryIngredients.length} recommended for category)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Pills & Search Bar */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0 space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 shrink-0 ${
                    filterMode === 'all'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Filter size={11} /> All Ingredients ({allIngredients.length})
                </button>
                {activeCategory && activeCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('recommended')}
                    className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 shrink-0 ${
                      filterMode === 'recommended'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Recommended for {activeCategory} ({categoryIngredients.length})
                  </button>
                )}
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ingredient name, INCI, CAS, or function..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-3 space-y-2 flex-1">
              {filteredModalIngredients.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No matching ingredients found for "{search}".
                </div>
              ) : (
                filteredModalIngredients.map((ing: UniversalIngredient) => {
                  const isSelected = ing.name === name;
                  return (
                    <div
                      key={ing.id}
                      onClick={() => handleChoose(ing)}
                      className={`p-3 border rounded-xl cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500/30'
                          : 'border-gray-200 hover:border-teal-400 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900 truncate">{ing.name}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {ing.activeDefault}% Active
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
                          <span>{ing.function || ing.category}</span>
                          {ing.casNumber && <span>• CAS: {ing.casNumber}</span>}
                          {ing.inciName && <span>• INCI: {ing.inciName}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-teal-700">${(ing.costPerKg || 0).toFixed(2)}/kg</div>
                        {isSelected && (
                          <div className="text-[10px] text-teal-600 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                            <Check size={12} /> Selected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-gray-500">
                Showing {filteredModalIngredients.length} of {allIngredients.length} total ingredients
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

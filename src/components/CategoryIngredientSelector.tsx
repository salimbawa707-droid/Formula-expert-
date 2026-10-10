import { useState, useMemo } from 'react';
import { Search, X, BookOpen, ChevronDown, Check, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { 
  getAllUniversalIngredients, 
  getAllCategories, 
  searchUniversalIngredients, 
  UniversalIngredient 
} from '../data/universalIngredientLibrary';

export function getCategorySpecificIngredients(category: string): UniversalIngredient[] {
  const all = getAllUniversalIngredients();
  if (!category || category === 'All' || category === 'All Categories' || category.includes('Uncategorized')) return all;

  const catLower = (category || '').toLowerCase();
  
  const filtered = all.filter(i => {
    const itemCat = (i?.category || '').toLowerCase();
    const itemSub = (i?.subCategory || '').toLowerCase();
    const itemFn = (i?.function || '').toLowerCase();
    
    return itemCat === catLower || 
           itemCat.includes(catLower) || 
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
  category: _category,
  catName: _catName,
  name = '',
  onSelect,
  onSelectChange,
  onClose
}: CategoryIngredientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const allIngredients = useMemo(() => getAllUniversalIngredients(), []);
  const availableCategories = useMemo(() => ['All', ...getAllCategories()], []);

  // Filtered ingredients matching BOTH search tokens and category filter
  const filteredModalIngredients = useMemo(() => {
    return searchUniversalIngredients(search, selectedCategory === 'All' ? undefined : selectedCategory);
  }, [search, selectedCategory]);

  const handleChoose = (ing: UniversalIngredient | string) => {
    let ingObj: UniversalIngredient;

    if (typeof ing === 'string') {
      const found = allIngredients.find(i => i.id === ing || i.name.toLowerCase() === ing.toLowerCase());
      if (found) {
        ingObj = found;
      } else {
        // Unknown custom ingredient: Safe degradation, zero fake data
        ingObj = {
          id: `custom-${Date.now()}`,
          name: ing,
          category: selectedCategory !== 'All' ? selectedCategory : 'Additive',
          casNumber: '',
          inciName: ing,
          function: 'Custom / Unverified Raw Material',
          activeDefault: 0,
          activeMatter: undefined,
          costPerKg: 0,
          hlb: null,
          description: 'Custom ingredient entered by formulator. Scientific constants uncharacterized (NEEDS_VERIFICATION).',
          provenance: {
            sourceType: 'USER_ENTERED',
            source: 'Manual Formulator Entry',
            verificationStatus: 'NEEDS_VERIFICATION',
            notes: 'Requires analytical characterization before quantitative release.'
          },
          unknownProperties: ['activeMatter', 'hlb', 'cmc', 'density', 'nvr', 'pKa']
        };
      }
    } else {
      ingObj = ing;
    }

    const selectedName = ingObj.name;

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
      {/* Inline Quick Selector */}
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
            className="w-full bg-white text-gray-900 caret-[#0f766e] border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-[#0f766e] focus:outline-none appearance-none pr-6 truncate cursor-pointer shadow-2xs hover:border-teal-400 transition"
          >
            <option value="" disabled className="text-gray-400">
              -- Select Ingredient --
            </option>
            {name && !allIngredients.some(i => i.name === name) && (
              <option value={name}>{name}</option>
            )}
            <optgroup label={`Standard Chemical Database (${allIngredients.length})`}>
              {allIngredients.map((ing) => {
                const activeLabel = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || ing.activeDefault === 0
                  ? 'Unknown Active'
                  : `${ing.activeDefault}% Active`;
                return (
                  <option key={ing.id} value={ing.name}>
                    {ing.name} ({activeLabel}) — {ing.category}
                  </option>
                );
              })}
            </optgroup>
            <option value="__BROWSE_MORE__" className="font-bold text-teal-700">
              🔍 Open Fast Search & Category Filter...
            </option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold"
          title="Browse Chemical Database"
        >
          <BookOpen size={13} />
          <span className="hidden sm:inline">Browse</span>
        </button>
      </div>

      {/* Fast Add Ingredient Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-teal-400" />
                  <h3 className="text-base md:text-lg font-black text-white tracking-wide">
                    ADD INGREDIENT
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Authoritative R&D Chemical Library • {allIngredients.length} verified raw materials
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

            {/* TOP CONTROLS: SEARCH + CATEGORY FILTER */}
            <div className="p-3.5 bg-slate-50 border-b border-gray-200 shrink-0 space-y-2.5">
              {/* Top Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="🔎 Search ingredients by name, alias (e.g. LABSA, Acid Slurry, Aristo, SLES, CAPB)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs placeholder-gray-400"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Category Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600 shrink-0">Category:</span>
                <div className="relative flex-1">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none appearance-none pr-8 cursor-pointer shadow-2xs"
                  >
                    <option value="All">All Categories ({allIngredients.length})</option>
                    {availableCategories.filter(c => c !== 'All').map(cat => {
                      const count = allIngredients.filter(i => i.category === cat).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
              </div>
            </div>

            {/* RESULTS LIST */}
            <div className="overflow-y-auto p-3 space-y-2 flex-1 divide-y divide-gray-100">
              {filteredModalIngredients.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="inline-flex p-3 bg-amber-50 rounded-full text-amber-600">
                    <AlertCircle size={24} />
                  </div>
                  <div className="text-xs text-gray-500">
                    No canonical ingredients matching <span className="font-bold text-gray-800">"{search}"</span> in category <span className="font-bold text-gray-800">{selectedCategory}</span>.
                  </div>
                  {search.trim().length > 1 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleChoose(search.trim())}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        <span>Add "{search.trim()}" as Custom / Unknown Ingredient</span>
                      </button>
                      <p className="text-[11px] text-gray-400 mt-1.5 max-w-md mx-auto">
                        Scientific properties will safely degrade to <span className="font-mono font-bold text-amber-700">INSUFFICIENT_DATA</span> without fabricated constants.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                filteredModalIngredients.map((ing: UniversalIngredient) => {
                  const isSelected = ing.name === name || ing.id === name;
                  const isUnknownActive = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || (ing.activeDefault === 0 && ing.category !== 'Solvent & Hydrotrope' && ing.category !== 'Solvent');
                  const isNeedsVerification = ing.provenance?.verificationStatus === 'NEEDS_VERIFICATION';

                  return (
                    <div
                      key={ing.id}
                      onClick={() => handleChoose(ing)}
                      className={`p-3 rounded-xl cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-2 border-teal-500 bg-teal-50/70 ring-1 ring-teal-500/30'
                          : 'border border-gray-200 hover:border-teal-400 hover:bg-slate-50/90'
                      }`}
                    >
                      {/* Left: Name, Category, Active, Manufacturer */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                            {ing.name}
                          </span>
                          
                          {/* Active Matter Badge */}
                          {isUnknownActive ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-0.5">
                              <HelpCircle size={10} /> Active: UNKNOWN
                            </span>
                          ) : (
                            <span className="text-[10px] bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                              Active: {ing.activeDefault}%
                            </span>
                          )}

                          {/* Verification Badge */}
                          {isNeedsVerification && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-0.5">
                              <ShieldAlert size={10} /> NEEDS_VERIFICATION
                            </span>
                          )}
                        </div>

                        {/* Category & Manufacturer Details */}
                        <div className="text-[11px] text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-slate-700">Category: {ing.category}</span>
                          {ing.manufacturer && (
                            <span className="text-slate-500">• Mfr: <strong className="text-slate-700 font-semibold">{ing.manufacturer}</strong></span>
                          )}
                          {ing.casNumber && ing.casNumber !== 'PROPRIETARY-BLEND' && (
                            <span className="text-slate-400 font-mono">• CAS: {ing.casNumber}</span>
                          )}
                          {ing.inciName && (
                            <span className="text-slate-400 truncate max-w-[200px]">• INCI: {ing.inciName}</span>
                          )}
                        </div>

                        {/* Description / Scientific Notice */}
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {ing.description}
                        </p>
                      </div>

                      {/* Right: Pricing & Selection */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div className="text-xs font-bold text-teal-800">
                          {typeof ing.costPerKg === 'number' && ing.costPerKg > 0 ? `₹${ing.costPerKg.toFixed(2)}/kg` : 'Price unconfigured'}
                        </div>
                        {isSelected ? (
                          <div className="text-[10px] text-teal-700 font-bold flex items-center gap-0.5 mt-0.5">
                            <Check size={12} /> Selected
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 group-hover:text-teal-600 mt-0.5">
                            Click to select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-gray-500 font-medium">
                Showing {filteredModalIngredients.length} of {allIngredients.length} total raw materials
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

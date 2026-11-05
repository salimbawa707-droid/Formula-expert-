import { useState, useMemo } from 'react';
import { Search, X, BookOpen, ChevronDown, Check, AlertCircle, HelpCircle, ShieldAlert, Loader2, Globe2, ArrowLeft, Layers } from 'lucide-react';
import { getAllUniversalIngredients, getAllCategories, searchUniversalIngredients, UniversalIngredient } from '../data/universalIngredientLibrary';
import { researchIngredientForFormula } from '../services/ingredientResearchController';

export function getCategorySpecificIngredients(category: string): UniversalIngredient[] {
  const all = getAllUniversalIngredients();
  if (!category || category === 'All' || category === 'All Categories' || category.includes('Uncategorized')) return all;
  const catLower = category.toLowerCase();
  const filtered = all.filter(i => {
    const itemCat = (i?.category || '').toLowerCase();
    const itemSub = (i?.subCategory || '').toLowerCase();
    const itemFn = (i?.function || '').toLowerCase();
    return itemCat === catLower || itemCat.includes(catLower) || catLower.includes(itemCat) || itemSub.includes(catLower) || itemFn.includes(catLower);
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
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = Category Grid View (Step 1), string = Selected Category View (Step 2)
  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  const allIngredients = useMemo(() => getAllUniversalIngredients(), []);

  // Compute category counts dynamically, hiding categories with 0 ingredients
  const categoryCards = useMemo(() => {
    const rawCategories = (getAllCategories() || []).filter(Boolean);
    const countsMap = new Map<string, number>();

    (allIngredients || []).forEach(ing => {
      if (!ing) return;
      const cat = ing.category || 'Other Ingredients';
      countsMap.set(cat, (countsMap.get(cat) || 0) + 1);
    });

    const cards = rawCategories.map(cat => ({
      name: cat,
      count: countsMap.get(cat) || 0
    })).filter(c => c.count > 0);

    // Sort by count descending
    cards.sort((a, b) => b.count - a.count);
    return cards;
  }, [allIngredients]);

  // Filtered ingredients for selected category or global search
  const displayedIngredients = useMemo(() => {
    if (selectedCategory) {
      const list = (allIngredients || []).filter(i => (i?.category || 'Other Ingredients').toLowerCase() === selectedCategory.toLowerCase());
      if (!search.trim()) return list;
      const q = search.toLowerCase();
      return list.filter(i => 
        (i?.name || '').toLowerCase().includes(q) || 
        (i?.casNumber && i.casNumber.toLowerCase().includes(q)) ||
        (i?.inciName && i.inciName.toLowerCase().includes(q)) ||
        (i?.function && i.function.toLowerCase().includes(q))
      );
    }
    // If global search across all categories
    return search.trim() ? (searchUniversalIngredients(search) || []) : [];
  }, [allIngredients, selectedCategory, search]);

  const handleChoose = (ing: UniversalIngredient | string) => {
    let ingObj: UniversalIngredient;
    if (typeof ing === 'string') {
      const found = allIngredients.find(i => i.id === ing || i.name.toLowerCase() === ing.toLowerCase());
      ingObj = found || {
        id: `custom-${Date.now()}`,
        name: ing,
        category: selectedCategory || 'Additive',
        casNumber: '',
        inciName: ing,
        function: 'Custom / Unverified Raw Material',
        activeDefault: 0,
        activeMatter: undefined,
        costPerKg: null,
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
    } else {
      ingObj = ing;
    }
    onSelect?.(ingObj);
    onSelectChange?.(ingObj.name);
    onClose?.();
    setIsOpen(false);
    setSearch('');
    setSelectedCategory(null);
    setResearchError(null);
  };

  const handleResearchIngredient = async () => {
    const ingredientName = search.trim();
    if (ingredientName.length < 2 || isResearching) return;
    setIsResearching(true);
    setResearchError(null);
    try {
      const result = await researchIngredientForFormula(ingredientName);
      handleChoose(result.ingredient);
      if (result.requiresReview) {
        console.info(`[Formula Expert] ${ingredientName} requires verification: ${result.reason}`);
      }
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : 'Ingredient research failed. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 w-full">
      {/* Quick Select Dropdown */}
      <div className="relative flex-1 min-w-0">
        <select
          value={name}
          onChange={e => e.target.value === '__BROWSE_MORE__' ? setIsOpen(true) : handleChoose(e.target.value)}
          className="w-full bg-[#131d35] text-slate-100 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none appearance-none pr-7 truncate cursor-pointer shadow-xs hover:border-cyan-500/60 transition"
          title="Pick from chemical library"
        >
          <option value="" disabled className="bg-[#0e1629] text-slate-400">
            Select Chemical...
          </option>
          {name && !allIngredients.some(i => i.name === name) && (
            <option value={name} className="bg-[#0e1629] text-white">
              {name} (Current)
            </option>
          )}
          <optgroup label={`Chemical Database (${allIngredients.length})`} className="bg-[#0e1629] text-cyan-300 font-bold">
            {allIngredients.map(ing => {
              const activeLabel = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || ing.activeDefault === 0 
                ? 'Unknown Active' 
                : `${ing.activeDefault}% Active`;
              return (
                <option key={ing.id} value={ing.name} className="bg-[#0e1629] text-slate-200 font-normal">
                  {ing.name} ({activeLabel}) — {ing.category}
                </option>
              );
            })}
          </optgroup>
          <option value="__BROWSE_MORE__" className="bg-[#152342] text-cyan-300 font-bold">
            🔍 Open Category-First Chemical Library...
          </option>
        </select>
        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
      </div>

      {/* Dedicated Browse Library Button */}
      <button
        type="button"
        onClick={() => {
          setSelectedCategory(null);
          setSearch('');
          setIsOpen(true);
        }}
        className="px-2.5 py-1.5 text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
        title="Open Category-First Add Ingredients Library"
      >
        <BookOpen size={13} className="text-cyan-400" />
        <span className="hidden sm:inline">Add Ingredients</span>
      </button>

      {/* Category-First Chemical Library Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e1629] border border-slate-700/90 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#121c38] to-[#0c1426] border-b border-slate-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                    ADD INGREDIENTS — CATEGORY LIBRARY
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedCategory ? `Category: ${selectedCategory}` : 'Select a raw material category to browse verified ingredients'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedCategory(null);
                  onClose?.();
                }}
                className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step 1 & Step 2 Toolbar / Navigation */}
            <div className="p-4 bg-[#11192e] border-b border-slate-800 space-y-3 shrink-0">
              {selectedCategory ? (
                /* Step 2 Toolbar: Back button & Search within Category */
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearch('');
                    }}
                    className="px-3 py-2 bg-[#16274a] hover:bg-[#1e3362] text-cyan-300 border border-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <ArrowLeft size={14} /> Back to Categories
                  </button>
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search ingredients in ${selectedCategory}...`}
                      value={search}
                      onChange={e => {
                        setSearch(e.target.value);
                        setResearchError(null);
                      }}
                      className="w-full pl-10 pr-9 py-2 bg-[#0a1020] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 1 Toolbar: Global Search across categories */
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search all chemical names, CAS numbers, or trade names..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setResearchError(null);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 bg-[#0a1020] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Error Notification */}
            {researchError && (
              <div className="mx-4 mt-3 rounded-xl border border-rose-500/50 bg-rose-950/80 px-3.5 py-2 text-xs text-rose-200">
                {researchError}
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto p-4 flex-1 space-y-3">
              {search.trim() ? (
                /* Global or Category Search Results View */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Search Results ({selectedCategory ? `in ${selectedCategory}` : 'All Categories'})
                    </span>
                    {selectedCategory && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        View all categories
                      </button>
                    )}
                  </div>
                  {(displayedIngredients?.length ?? 0) === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="inline-flex p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
                        <AlertCircle size={26} />
                      </div>
                      <div className="text-xs text-slate-400">
                        No verified raw material matching <span className="font-bold text-white">"{search}"</span>.
                      </div>
                      {(search?.trim()?.length ?? 0) > 1 && (
                        <div className="pt-2 space-y-2.5">
                          <button
                            type="button"
                            onClick={handleResearchIngredient}
                            disabled={isResearching}
                            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto shadow-lg shadow-teal-950/60 cursor-pointer active:scale-95"
                          >
                            {isResearching ? <Loader2 size={15} className="animate-spin" /> : <Globe2 size={15} />}
                            {isResearching ? 'Researching with Gemini + PubChem...' : `Research "${search.trim()}" with Gemini AI`}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChoose(search.trim())}
                            disabled={isResearching}
                            className="text-xs text-slate-400 hover:text-white underline cursor-pointer block mx-auto"
                          >
                            Add manually as unverified raw material
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {displayedIngredients.map((ing: UniversalIngredient) => {
                        const isSelected = ing.name === name || ing.id === name;
                        const isUnknownActive = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || (ing.activeDefault === 0 && ing.category !== 'Solvent & Hydrotrope' && ing.category !== 'Solvent');
                        return (
                          <div
                            key={ing.id}
                            onClick={() => handleChoose(ing)}
                            className="p-3.5 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 bg-[#0b1324] hover:border-slate-700 hover:bg-[#111b33]"
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                                  {ing.name}
                                </span>
                                {isUnknownActive ? (
                                  <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                    <HelpCircle size={10} /> Active: UNKNOWN
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                                    Active: {ing.activeDefault}%
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
                                <span className="font-semibold text-slate-300">Category: {ing.category}</span>
                                {ing.casNumber && <span className="font-mono text-cyan-300">• CAS: {ing.casNumber}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {typeof ing.costPerKg === 'number' && ing.costPerKg >= 0 ? `₹${ing.costPerKg.toFixed(2)}/kg` : 'Price unconfigured'}
                              </span>
                              <span className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow">
                                Select +
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : selectedCategory ? (
                /* Step 2: Category Ingredients List View */
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                      <Layers size={14} className="text-cyan-400" /> {selectedCategory} ({(displayedIngredients?.length ?? 0)} ingredients)
                    </h4>
                    <span className="text-[11px] text-slate-400">Click any ingredient to add to formula</span>
                  </div>

                  {displayedIngredients.map((ing: UniversalIngredient) => {
                    const isSelected = ing.name === name || ing.id === name;
                    const isUnknownActive = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || (ing.activeDefault === 0 && ing.category !== 'Solvent & Hydrotrope' && ing.category !== 'Solvent');
                    const isNeedsVerification = ing.provenance?.verificationStatus === 'NEEDS_VERIFICATION' || (ing.provenance?.verificationStatus as string | undefined) === 'EVIDENCE_CONFLICT';

                    return (
                      <div
                        key={ing.id}
                        onClick={() => handleChoose(ing)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-2 border-cyan-500 bg-[#16274a] shadow-lg shadow-cyan-950/50'
                            : 'border border-slate-800 bg-[#0b1324] hover:border-slate-700 hover:bg-[#111b33]'
                        }`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                              {ing.name}
                            </span>
                            {isUnknownActive ? (
                              <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <HelpCircle size={10} /> Active: UNKNOWN
                              </span>
                            ) : (
                              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                                Active: {ing.activeDefault}%
                              </span>
                            )}
                            {isNeedsVerification && (
                              <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <ShieldAlert size={10} /> {ing.provenance?.verificationStatus}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
                            {ing.manufacturer && <span>Mfr: {ing.manufacturer}</span>}
                            {ing.casNumber && <span className="font-mono text-cyan-300">• CAS: {ing.casNumber}</span>}
                            {ing.inciName && <span>• INCI: {ing.inciName}</span>}
                          </div>
                          {ing.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {ing.description}
                            </p>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 gap-2">
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {typeof ing.costPerKg === 'number' && ing.costPerKg >= 0 
                              ? (ing.costPerKg === 0 ? '₹0.00/kg (Free)' : `₹${ing.costPerKg.toFixed(2)}/kg`) 
                              : 'Price unconfigured'}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChoose(ing);
                            }}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                          >
                            Select +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Step 1: Category Cards Grid View */
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-1">
                    <Layers size={14} className="text-cyan-400" /> Raw Material Categories ({(categoryCards?.length ?? 0)} Categories available)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryCards.map(cat => (
                      <div
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className="p-4 rounded-xl border border-slate-800 bg-[#0b1324] hover:border-cyan-500/60 hover:bg-[#121c38] transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <h5 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition truncate">
                            {cat.name}
                          </h5>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {cat.count} verified raw material{cat.count === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition">
                          <ChevronDown size={16} className="-rotate-90" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#11192e] border-t border-slate-800 flex justify-between items-center text-xs shrink-0">
              <span className="text-slate-400 text-[11px]">
                {selectedCategory ? `Showing ${(displayedIngredients?.length ?? 0)} ingredients in ${selectedCategory}` : `Total ${(allIngredients?.length ?? 0)} raw materials across ${(categoryCards?.length ?? 0)} categories`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedCategory(null);
                  onClose?.();
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
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

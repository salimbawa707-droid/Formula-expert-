import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  BookOpen,
  ChevronDown,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Globe2,
  ArrowLeft,
  Layers,
  Zap,
  Droplets,
  Building,
  Shield,
  Activity,
  ShieldCheck,
  Compass,
  Scale,
  Sparkles,
  Plus,
  Filter
} from 'lucide-react';
import {
  getAllUniversalIngredients,
  searchUniversalIngredients,
  UniversalIngredient
} from '../data/universalIngredientLibrary';
import {
  RAW_MATERIAL_CATEGORIES,
  RawMaterialCategoryDef,
  getIngredientsByMajorCategory,
  getGroupedIngredientsForSelect,
  getCategoryDefinition
} from '../data/rawMaterialCategories';
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

export interface CategoryIngredientSelectorProps {
  category?: string;
  catName?: string;
  name?: string;
  onSelect?: (ingredient: UniversalIngredient) => void;
  onSelectChange?: (val: any) => void;
  onClose?: () => void;
  // Controlled modal props (e.g. for "+ ADD INGREDIENT" button)
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'dropdown-and-button' | 'button-only' | 'modal-only';
  buttonLabel?: string;
  title?: string;
  allowMultiAdd?: boolean;
  onAddMultiple?: (ingredient: UniversalIngredient) => void;
}

// Icon mapper for category cards
function getCategoryIcon(iconName: string, size = 16) {
  switch (iconName) {
    case 'Zap':
      return <Zap size={size} />;
    case 'Droplets':
      return <Droplets size={size} />;
    case 'Building':
      return <Building size={size} />;
    case 'Shield':
      return <Shield size={size} />;
    case 'Layers':
      return <Layers size={size} />;
    case 'Activity':
      return <Activity size={size} />;
    case 'ShieldCheck':
      return <ShieldCheck size={size} />;
    case 'Compass':
      return <Compass size={size} />;
    case 'Scale':
      return <Scale size={size} />;
    case 'Sparkles':
      return <Sparkles size={size} />;
    default:
      return <Layers size={size} />;
  }
}

export default function CategoryIngredientSelector({
  category: _category,
  catName: _catName,
  name = '',
  onSelect,
  onSelectChange,
  onClose,
  isOpen: externalIsOpen,
  onOpenChange,
  mode = 'dropdown-and-button',
  buttonLabel = 'Add Ingredients',
  title = 'ADD INGREDIENTS — CATEGORY LIBRARY',
  allowMultiAdd = false,
  onAddMultiple
}: CategoryIngredientSelectorProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof externalIsOpen === 'boolean';
  const modalOpen = isControlled ? externalIsOpen : internalIsOpen;

  const setModalOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setInternalIsOpen(open);
    }
    if (!open) {
      onClose?.();
    }
  };

  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null); // null = Category Grid View (Step 1), string = Selected Category View (Step 2)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  const allIngredients = useMemo(() => getAllUniversalIngredients(), []);
  const groupedIngredients = useMemo(() => getGroupedIngredientsForSelect(), []);

  // Compute live count for each category
  const categoriesWithCounts = useMemo(() => {
    return RAW_MATERIAL_CATEGORIES.map(cat => {
      const ings = allIngredients.filter(i => cat.matches(i));
      return {
        ...cat,
        count: ings.length
      };
    });
  }, [allIngredients]);

  // Selected category definition
  const currentCategoryDef = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === 'all') return null;
    return getCategoryDefinition(selectedCategoryId);
  }, [selectedCategoryId]);

  // Reset subcategory when switching category
  useEffect(() => {
    setSelectedSubcategory('all');
  }, [selectedCategoryId]);

  // Filtered ingredients to display
  const displayedIngredients = useMemo(() => {
    let list: UniversalIngredient[] = [];

    if (selectedCategoryId === 'all') {
      list = allIngredients;
    } else if (selectedCategoryId) {
      list = getIngredientsByMajorCategory(selectedCategoryId, selectedSubcategory);
    } else if (search.trim()) {
      // Global search across all categories
      list = searchUniversalIngredients(search) || [];
    }

    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter(i =>
      (i?.name || '').toLowerCase().includes(q) ||
      (i?.casNumber && i.casNumber.toLowerCase().includes(q)) ||
      (i?.inciName && i.inciName.toLowerCase().includes(q)) ||
      (i?.function && i.function.toLowerCase().includes(q)) ||
      (i?.description && i.description.toLowerCase().includes(q))
    );
  }, [allIngredients, selectedCategoryId, selectedSubcategory, search]);

  const handleChoose = (ing: UniversalIngredient | string, keepOpen = false) => {
    let ingObj: UniversalIngredient;
    if (typeof ing === 'string') {
      const found = allIngredients.find(i => i.id === ing || i.name.toLowerCase() === ing.toLowerCase());
      ingObj = found || {
        id: `custom-${Date.now()}`,
        name: ing,
        category: currentCategoryDef?.name || 'Additive',
        casNumber: '',
        inciName: ing,
        function: 'Custom Raw Material',
        activeDefault: 100,
        activeMatter: undefined,
        costPerKg: null,
        hlb: null,
        description: 'Formulator entered ingredient. Scientific constants uncharacterized.',
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

    // Mark as recently added for visual confirmation
    setRecentlyAddedIds(prev => new Set(prev).add(ingObj.id));
    setTimeout(() => {
      setRecentlyAddedIds(prev => {
        const next = new Set(prev);
        next.delete(ingObj.id);
        return next;
      });
    }, 2500);

    if (allowMultiAdd && onAddMultiple) {
      onAddMultiple(ingObj);
    } else {
      onSelect?.(ingObj);
      onSelectChange?.(ingObj.name);
    }

    if (!keepOpen && !allowMultiAdd) {
      setModalOpen(false);
      setSearch('');
      setSelectedCategoryId(null);
      setResearchError(null);
    }
  };

  const handleResearchIngredient = async () => {
    const ingredientName = search.trim();
    if (ingredientName.length < 2 || isResearching) return;
    setIsResearching(true);
    setResearchError(null);
    try {
      const result = await researchIngredientForFormula(ingredientName);
      handleChoose(result.ingredient, allowMultiAdd);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : 'Ingredient research failed. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 w-full">
      {/* 1. Quick Select Dropdown (Grouped by Category via optgroup) */}
      {mode !== 'button-only' && mode !== 'modal-only' && (
        <div className="relative flex-1 min-w-0">
          <select
            value={name}
            onChange={e => {
              if (e.target.value === '__BROWSE_MORE__') {
                setSelectedCategoryId(null);
                setSearch('');
                setModalOpen(true);
              } else {
                handleChoose(e.target.value);
              }
            }}
            className="w-full bg-[#131d35] text-slate-100 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none appearance-none pr-7 truncate cursor-pointer shadow-xs hover:border-cyan-500/60 transition"
            title="Pick from categorized chemical library"
          >
            <option value="" disabled className="bg-[#0e1629] text-slate-400">
              Select Chemical (Categorized)...
            </option>
            {name && !allIngredients.some(i => i.name === name) && (
              <option value={name} className="bg-[#0e1629] text-white">
                {name} (Custom Entered)
              </option>
            )}
            {/* Structured optgroups by Category */}
            {Object.entries(groupedIngredients).map(([catName, ings]) => (
              <optgroup key={catName} label={`▼ ${catName} (${ings.length})`} className="bg-[#0b1324] text-cyan-300 font-extrabold text-[11px]">
                {ings.map(ing => {
                  const activeLabel = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || ing.activeDefault === 0
                    ? 'Unknown Active'
                    : `${ing.activeDefault}% Active`;
                  return (
                    <option key={ing.id} value={ing.name} className="bg-[#0e1629] text-slate-200 font-normal text-xs">
                      {ing.name} ({activeLabel})
                    </option>
                  );
                })}
              </optgroup>
            ))}
            <option value="__BROWSE_MORE__" className="bg-[#152342] text-cyan-300 font-bold">
              🔍 Open Category-First Chemical Library...
            </option>
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
      )}

      {/* 2. Dedicated Browse by Category Button */}
      {mode !== 'modal-only' && (
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryId(null);
            setSearch('');
            setModalOpen(true);
          }}
          className="px-2.5 py-1.5 text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
          title="Open Category-First Raw Material Library"
        >
          <BookOpen size={13} className="text-cyan-400" />
          <span className="hidden sm:inline">{buttonLabel}</span>
        </button>
      )}

      {/* 3. Category-First Raw Material Library Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0c1222] border border-slate-700/90 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#111a33] via-[#0d152a] to-[#0a1020] border-b border-slate-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-white flex items-center gap-2">
                    {title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    {selectedCategoryId && currentCategoryDef
                      ? `${currentCategoryDef.name} — ${currentCategoryDef.hindiHint}`
                      : 'Browse raw materials by chemical category (Ionic, Nonionic, Builders, Chelators, Thickeners, etc.)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedCategoryId(null);
                  setSearch('');
                  onClose?.();
                }}
                className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-xl transition cursor-pointer"
                title="Close Library"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Category Navigation Tabs Bar */}
            <div className="bg-[#0f172a] border-b border-slate-800 px-3 py-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedCategoryId === null && !search.trim()
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <Layers size={13} />
                  <span>Category Overview</span>
                </button>

                {categoriesWithCounts.map(cat => {
                  const isCatSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSearch('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                        isCatSelected
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-extrabold'
                          : 'bg-[#131d35] hover:bg-[#1a2747] text-slate-300 border-slate-700/80'
                      }`}
                      title={cat.name}
                    >
                      <span className={isCatSelected ? 'text-white' : 'text-cyan-400'}>
                        {getCategoryIcon(cat.iconName, 13)}
                      </span>
                      <span>{cat.shortName}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isCatSelected ? 'bg-cyan-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                    selectedCategoryId === 'all'
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-extrabold'
                      : 'bg-[#131d35] hover:bg-[#1a2747] text-slate-300 border-slate-700/80'
                  }`}
                >
                  <Filter size={13} />
                  <span>All ({allIngredients.length})</span>
                </button>
              </div>
            </div>

            {/* Search and Filter Ribbon */}
            <div className="p-3 sm:p-4 bg-[#11192e] border-b border-slate-800 space-y-2.5 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                {selectedCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setSearch('');
                    }}
                    className="px-2.5 sm:px-3 py-2 bg-[#16274a] hover:bg-[#1e3362] text-cyan-300 border border-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">All Categories</span>
                  </button>
                )}

                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      selectedCategoryId && currentCategoryDef
                        ? `Search ${currentCategoryDef.shortName} (e.g. name, CAS, trade name)...`
                        : "Search all chemicals, CAS numbers, or trade names (e.g. SLES, Citrate, LABSA)..."
                    }
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setResearchError(null);
                    }}
                    className="w-full pl-10 pr-9 py-2 bg-[#0a1020] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategory Pills (e.g. for Ionic: All / Anionic / Amphoteric / Cationic) */}
              {currentCategoryDef?.subcategories && !search.trim() && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-thin">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1 shrink-0">
                    Filter Charge:
                  </span>
                  {currentCategoryDef.subcategories.map(sub => {
                    const isSubSelected = selectedSubcategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                          isSubSelected
                            ? 'bg-cyan-500 text-white shadow-xs font-black'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
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
            <div className="overflow-y-auto p-3 sm:p-4 md:p-5 flex-1 space-y-3">
              {/* VIEW 1: SEARCH RESULTS (When user typed a search query) */}
              {search.trim() ? (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Search Results ({displayedIngredients.length} found)
                    </span>
                    {selectedCategoryId && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId('all')}
                        className="text-xs text-cyan-400 hover:underline cursor-pointer"
                      >
                        Search across all categories
                      </button>
                    )}
                  </div>

                  {displayedIngredients.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-[#0a1020]/60 rounded-2xl border border-slate-800 p-6">
                      <div className="inline-flex p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
                        <AlertCircle size={28} />
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300">
                        No verified raw material matching <span className="font-bold text-white">"{search}"</span>.
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        You can research this chemical with Gemini AI to auto-populate scientific properties, or add it manually.
                      </p>
                      {search.trim().length > 1 && (
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleResearchIngredient}
                            disabled={isResearching}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-950/60 cursor-pointer active:scale-95"
                          >
                            {isResearching ? <Loader2 size={15} className="animate-spin" /> : <Globe2 size={15} />}
                            {isResearching ? 'Researching with Gemini + PubChem...' : `Research "${search.trim()}" with Gemini AI`}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChoose(search.trim(), allowMultiAdd)}
                            disabled={isResearching}
                            className="px-3.5 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer transition border border-slate-700"
                          >
                            + Add Manually as Unverified
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {displayedIngredients.map(ing => renderIngredientCard(ing))}
                    </div>
                  )}
                </div>
              ) : selectedCategoryId ? (
                /* VIEW 2: CATEGORY INGREDIENTS LIST (When a specific category tab is active) */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-1 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                        {currentCategoryDef ? getCategoryIcon(currentCategoryDef.iconName, 15) : <Filter size={15} />}
                        <span>{currentCategoryDef?.name || 'All Ingredients'}</span>
                        <span className="text-slate-400 font-mono font-normal">({displayedIngredients.length} ingredients)</span>
                      </h4>
                      {currentCategoryDef && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {currentCategoryDef.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      Click <strong className="text-cyan-300">+ Add to Formula</strong> to incorporate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {displayedIngredients.map(ing => renderIngredientCard(ing))}
                  </div>
                </div>
              ) : (
                /* VIEW 3: CATEGORY GRID OVERVIEW (Initial state: user selects Ionic, Nonionic, Builders, Chelators, etc.) */
                <div className="space-y-4">
                  <div className="bg-[#11192e] border border-cyan-500/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                        <Layers size={15} className="text-cyan-400" />
                        SELECT A CHEMICAL CATEGORY
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Choose a category below to explore verified raw materials, or search directly at the top.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 hidden sm:inline">
                      {allIngredients.length} Total Ingredients
                    </span>
                  </div>

                  {/* 10 Major Category Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoriesWithCounts.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setSearch('');
                        }}
                        className={`p-4 rounded-xl border bg-gradient-to-br ${cat.accentBg} hover:border-cyan-500/70 hover:bg-[#14203d] transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-cyan-950/40`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-xs sm:text-sm text-white group-hover:text-cyan-300 transition flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-black/40 text-cyan-400 border border-slate-700/60">
                                {getCategoryIcon(cat.iconName, 15)}
                              </span>
                              <span>{cat.name}</span>
                            </span>
                            <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shrink-0">
                              {cat.count} items
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                            {cat.hindiHint}
                          </p>

                          <p className="text-[11px] text-slate-300 line-clamp-1">
                            {cat.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                            Examples: <strong className="text-slate-300">{cat.examples.split(',').slice(0, 3).join(', ')}...</strong>
                          </span>
                          <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
                            View Category &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#0d152a] border-t border-slate-800 flex justify-between items-center text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                {selectedCategoryId && currentCategoryDef ? (
                  <span>
                    Viewing: <strong className="text-white">{currentCategoryDef.name}</strong> ({displayedIngredients.length} ingredients)
                  </span>
                ) : (
                  <span>
                    Select any category card or tab to view ingredients.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setSearch('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
                  >
                    All Categories
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedCategoryId(null);
                    setSearch('');
                    onClose?.();
                  }}
                  className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for individual ingredient item
  function renderIngredientCard(ing: UniversalIngredient) {
    const isRecentlyAdded = recentlyAddedIds.has(ing.id);
    const isSelected = ing.name === name || ing.id === name;
    const isUnknownActive = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') ||
      (ing.activeDefault === 0 && ing.category !== 'Solvent & Hydrotrope' && ing.category !== 'Solvent');
    const isNeedsVerification = ing.provenance?.verificationStatus === 'NEEDS_VERIFICATION' ||
      (ing.provenance?.verificationStatus as string | undefined) === 'EVIDENCE_CONFLICT';

    return (
      <div
        key={ing.id}
        onClick={() => handleChoose(ing, allowMultiAdd)}
        className={`p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isRecentlyAdded
            ? 'border-2 border-emerald-500 bg-[#0f2422] shadow-lg shadow-emerald-950/40 animate-pulse'
            : isSelected
            ? 'border-2 border-cyan-500 bg-[#16274a] shadow-lg shadow-cyan-950/50'
            : 'border border-slate-800 bg-[#0b1324] hover:border-slate-700 hover:bg-[#111b33]'
        }`}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-white truncate">
              {ing.name}
            </span>

            {/* Active % Pill */}
            {isUnknownActive ? (
              <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <HelpCircle size={10} /> Active: UNKNOWN
              </span>
            ) : (
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                Active: {ing.activeDefault}%
              </span>
            )}

            {/* Category Tag */}
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-medium">
              {ing.category}
            </span>

            {isNeedsVerification && (
              <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <ShieldAlert size={10} /> Needs Verification
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
            {ing.casNumber && <span className="font-mono text-cyan-300">CAS: {ing.casNumber}</span>}
            {ing.inciName && <span>• INCI: {ing.inciName}</span>}
            {ing.function && <span className="text-slate-300 font-medium">• {ing.function}</span>}
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
              handleChoose(ing, allowMultiAdd);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer ${
              isRecentlyAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95'
            }`}
          >
            {isRecentlyAdded ? (
              <>
                <Check size={13} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus size={13} />
                <span>Add to Formula</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
}

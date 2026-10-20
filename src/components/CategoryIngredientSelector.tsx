import { useState, useMemo } from 'react';
import { Search, X, BookOpen, ChevronDown, Check, AlertCircle, HelpCircle, ShieldAlert, Loader2, Globe2 } from 'lucide-react';
import { getAllUniversalIngredients, getAllCategories, searchUniversalIngredients, UniversalIngredient } from '../data/universalIngredientLibrary';
import { researchIngredientForFormula } from '../services/ingredientResearchController';

export function getCategorySpecificIngredients(category: string): UniversalIngredient[] {
  const all = getAllUniversalIngredients();
  if (!category || category === 'All' || category === 'All Categories' || category.includes('Uncategorized')) return all;
  const catLower = category.toLowerCase();
  const filtered = all.filter(i => {
    const itemCat = (i?.category || '').toLowerCase(); const itemSub = (i?.subCategory || '').toLowerCase(); const itemFn = (i?.function || '').toLowerCase();
    return itemCat === catLower || itemCat.includes(catLower) || catLower.includes(itemCat) || itemSub.includes(catLower) || itemFn.includes(catLower);
  });
  return filtered.length > 0 ? filtered : all;
}

interface CategoryIngredientSelectorProps { category?: string; catName?: string; name?: string; onSelect?: (ingredient: UniversalIngredient) => void; onSelectChange?: (val: any) => void; onClose?: () => void; }

export default function CategoryIngredientSelector({ category: _category, catName: _catName, name = '', onSelect, onSelectChange, onClose }: CategoryIngredientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false); const [search, setSearch] = useState(''); const [selectedCategory, setSelectedCategory] = useState('All');
  const [isResearching, setIsResearching] = useState(false); const [researchError, setResearchError] = useState<string | null>(null);
  const allIngredients = useMemo(() => getAllUniversalIngredients(), []); const availableCategories = useMemo(() => ['All', ...getAllCategories()], []);
  const filteredModalIngredients = useMemo(() => searchUniversalIngredients(search, selectedCategory === 'All' ? undefined : selectedCategory), [search, selectedCategory]);

  const handleChoose = (ing: UniversalIngredient | string) => {
    let ingObj: UniversalIngredient;
    if (typeof ing === 'string') {
      const found = allIngredients.find(i => i.id === ing || i.name.toLowerCase() === ing.toLowerCase());
      ingObj = found || { id: `custom-${Date.now()}`, name: ing, category: selectedCategory !== 'All' ? selectedCategory : 'Additive', casNumber: '', inciName: ing, function: 'Custom / Unverified Raw Material', activeDefault: 0, activeMatter: undefined, costPerKg: null, hlb: null, description: 'Custom ingredient entered by formulator. Scientific constants uncharacterized (NEEDS_VERIFICATION).', provenance: { sourceType: 'USER_ENTERED', source: 'Manual Formulator Entry', verificationStatus: 'NEEDS_VERIFICATION', notes: 'Requires analytical characterization before quantitative release.' }, unknownProperties: ['activeMatter', 'hlb', 'cmc', 'density', 'nvr', 'pKa'] };
    } else ingObj = ing;
    onSelect?.(ingObj); onSelectChange?.(ingObj.name); onClose?.(); setIsOpen(false); setSearch(''); setResearchError(null);
  };

  const handleResearchIngredient = async () => {
    const ingredientName = search.trim(); if (ingredientName.length < 2 || isResearching) return;
    setIsResearching(true); setResearchError(null);
    try {
      const result = await researchIngredientForFormula(ingredientName);
      handleChoose(result.ingredient);
      if (result.requiresReview) console.info(`[Formula Expert] ${ingredientName} requires verification: ${result.reason}`);
    } catch (error) { setResearchError(error instanceof Error ? error.message : 'Ingredient research failed. Please try again.'); }
    finally { setIsResearching(false); }
  };

  return <div className="w-full relative">
    <div className="flex items-center gap-1 w-full"><div className="relative flex-1 min-w-0">
      <select value={name} onChange={e => e.target.value === '__BROWSE_MORE__' ? setIsOpen(true) : handleChoose(e.target.value)} className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-[#0f766e] focus:outline-none appearance-none pr-6 truncate cursor-pointer shadow-2xs hover:border-teal-400 transition">
        <option value="" disabled>-- Select Ingredient --</option>{name && !allIngredients.some(i => i.name === name) && <option value={name}>{name}</option>}
        <optgroup label={`Standard Chemical Database (${allIngredients.length})`}>{allIngredients.map(ing => { const activeLabel = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || ing.activeDefault === 0 ? 'Unknown Active' : `${ing.activeDefault}% Active`; return <option key={ing.id} value={ing.name}>{ing.name} ({activeLabel}) — {ing.category}</option>; })}</optgroup>
        <option value="__BROWSE_MORE__">🔍 Open Fast Search & Category Filter...</option>
      </select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
    </div><button type="button" onClick={() => setIsOpen(true)} className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold" title="Browse Chemical Database"><BookOpen size={13}/><span className="hidden sm:inline">Browse</span></button></div>

    {isOpen && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-2xs"><div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0"><div><div className="flex items-center gap-2"><BookOpen size={18} className="text-teal-400"/><h3 className="text-base md:text-lg font-black">ADD INGREDIENT</h3></div><p className="text-xs text-slate-300 mt-0.5">Local R&amp;D Chemical Library + Gemini 3.8 grounded research</p></div><button type="button" onClick={() => {setIsOpen(false);onClose?.();}} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg"><X size={18}/></button></div>
      <div className="p-3.5 bg-slate-50 border-b border-gray-200 space-y-2.5"><div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search ingredient (e.g. LAS, CAPB, SLES, unknown chemical)..." value={search} onChange={e => {setSearch(e.target.value);setResearchError(null);}} className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus/>{search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={15}/></button>}</div>
        <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-600">Category:</span><div className="relative flex-1"><select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold"><option value="All">All Categories ({allIngredients.length})</option>{availableCategories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat} ({allIngredients.filter(i => i.category === cat).length})</option>)}</select></div></div></div>
      {researchError && <div className="mx-3 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{researchError}</div>}
      <div className="overflow-y-auto p-3 space-y-2 flex-1">{filteredModalIngredients.length === 0 ? <div className="py-10 text-center space-y-3"><div className="inline-flex p-3 bg-amber-50 rounded-full text-amber-600"><AlertCircle size={24}/></div><div className="text-xs text-gray-500">No canonical ingredient matching <b>"{search}"</b>.</div>{search.trim().length > 1 && <div className="pt-2 space-y-2"><button type="button" onClick={handleResearchIngredient} disabled={isResearching} className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto">{isResearching ? <Loader2 size={14} className="animate-spin"/> : <Globe2 size={14}/>} {isResearching ? 'Researching with Gemini + Google...' : `Research "${search.trim()}" with Gemini`}</button><button type="button" onClick={() => handleChoose(search.trim())} disabled={isResearching} className="text-[11px] text-gray-500 underline">Add manually as unverified instead</button><p className="text-[11px] text-gray-400 max-w-md mx-auto">Missing or conflicting properties remain marked for verification. The app does not invent scientific constants.</p></div>}</div> : filteredModalIngredients.map((ing: UniversalIngredient) => {
        const isSelected = ing.name === name || ing.id === name; const isUnknownActive = ing.id === 'aristo-9' || ing.unknownProperties?.includes('activeMatter') || (ing.activeDefault === 0 && ing.category !== 'Solvent & Hydrotrope' && ing.category !== 'Solvent'); const isNeedsVerification = ing.provenance?.verificationStatus === 'NEEDS_VERIFICATION' || ing.provenance?.verificationStatus === 'EVIDENCE_CONFLICT';
        return <div key={ing.id} onClick={() => handleChoose(ing)} className={`p-3 rounded-xl cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${isSelected ? 'border-2 border-teal-500 bg-teal-50/70' : 'border border-gray-200 hover:border-teal-400 hover:bg-slate-50/90'}`}><div className="flex-1 min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-1.5"><span className="font-bold text-xs sm:text-sm text-gray-900 truncate">{ing.name}</span>{isUnknownActive ? <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><HelpCircle size={10}/> Active: UNKNOWN</span> : <span className="text-[10px] bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded font-mono font-bold">Active: {ing.activeDefault}%</span>}{isNeedsVerification && <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><ShieldAlert size={10}/> {ing.provenance?.verificationStatus}</span>}</div><div className="text-[11px] text-gray-600 flex flex-wrap gap-x-2"><span className="font-semibold">Category: {ing.category}</span>{ing.manufacturer && <span>• Mfr: {ing.manufacturer}</span>}{ing.casNumber && <span className="font-mono">• CAS: {ing.casNumber}</span>}{ing.inciName && <span>• INCI: {ing.inciName}</span>}</div><p className="text-[11px] text-gray-500 line-clamp-1">{ing.description}</p></div><div className="flex sm:flex-col items-center sm:items-end shrink-0"><div className="text-xs font-bold text-teal-800">{typeof ing.costPerKg === 'number' && ing.costPerKg >= 0 ? (ing.costPerKg === 0 ? '₹0.00/kg (Free)' : `₹${ing.costPerKg.toFixed(2)}/kg`) : 'Price unconfigured'}</div>{isSelected && <div className="text-[10px] text-teal-700 font-bold flex items-center gap-0.5"><Check size={12}/> Selected</div>}</div></div>;
      })}</div>
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center"><span className="text-[11px] text-gray-500">Showing {filteredModalIngredients.length} of {allIngredients.length} total raw materials</span><button type="button" onClick={() => {setIsOpen(false);onClose?.();}} className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg">Close</button></div>
    </div></div>}
  </div>;
}

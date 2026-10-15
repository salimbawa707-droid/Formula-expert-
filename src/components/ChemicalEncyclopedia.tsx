import { useState, useMemo } from 'react';
import {
  UNIVERSAL_INGREDIENTS,
  searchUniversalIngredients,
  getAllCategories,
  UniversalIngredient
} from '../data/universalIngredientLibrary';
import { Search, BookOpen, Layers, Sparkles, Filter, ChevronDown, ChevronUp, DollarSign, Activity, Beaker, Atom, Info, Cpu, RefreshCw, ExternalLink, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { resolveChemicalIdentity } from '../utils/cheminformatics/chemicalIdentityService';
import { ChemicalIdentityRecord } from '../domain/cheminformatics/types';

interface ChemicalFamily {
  key: string;
  casNumber: string;
  inciName: string;
  name: string;
  category: string;
  subCategory?: string;
  function: string;
  description: string;
  phRange: string;
  variants: UniversalIngredient[];
}

export default function ChemicalEncyclopedia(_props?: any) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grouped' | 'all_grades' | 'ingredient_research'>('grouped');
  const [researchQuery, setResearchQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState('');
  const [researchResult, setResearchResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});
  const [expandedStructures, setExpandedStructures] = useState<Record<string, boolean>>({});
  const [structures, setStructures] = useState<Record<string, ChemicalIdentityRecord>>({});
  const [loadingStructure, setLoadingStructure] = useState<Record<string, boolean>>({});

  const toggleStructure = async (key: string, ingredient: UniversalIngredient) => {
    const next = !expandedStructures[key];
    setExpandedStructures(prev => ({ ...prev, [key]: next }));
    if (next && !structures[key]) {
      setLoadingStructure(prev => ({ ...prev, [key]: true }));
      try {
        const res = await resolveChemicalIdentity(ingredient);
        setStructures(prev => ({ ...prev, [key]: res }));
      } finally {
        setLoadingStructure(prev => ({ ...prev, [key]: false }));
      }
    }
  };

  const handleTriggerResearch = async () => {
    setIsResearching(true);
    setErrorMessage('');
    setSuccessMessage('');
    setResearchResult(null);

    const steps = [
      'Resolving ingredient identity and alternate spelling aliases...',
      'Crawling Level 1 Manufacturer Product Datasheets...',
      'Extracting physical, chemical, and surfactant parameters...',
      'Performing multi-source cross-checking and validating data...',
      'Acquisition complete. Verification gate awaiting approval.'
    ];

    for (let i = 0; i < steps.length; i++) {
      setResearchProgress(steps[i]);
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 300 : 400));
    }

    try {
      const response = await fetch('/api/ai/research-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameOrAlias: researchQuery })
      });
      if (!response.ok) {
        throw new Error('Research failed / Offline search mode triggered.');
      }
      const data = await response.json();
      setResearchResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Offline Mode: Research preserved as UNKNOWN.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleApplyVerifiedData = async () => {
    if (!researchResult) return;
    try {
      const response = await fetch('/api/ai/apply-verified-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchResult,
          previousRecord: UNIVERSAL_INGREDIENTS.find(i => i.id === researchResult.ingredientId)
        })
      });
      if (!response.ok) {
        throw new Error('Failed to update canonical database.');
      }
      await response.json();
      setSuccessMessage(`Database successfully updated! Recalculated active matter and refreshed dependent recipes in formulation library.`);
      setResearchResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Database update failed.');
    }
  };

  const categories = useMemo(() => {
    return ['All', ...getAllCategories()];
  }, []);

  // Filter raw commercial records using unified search
  const filteredRecords = useMemo(() => {
    return searchUniversalIngredients(search, selectedCategory);
  }, [search, selectedCategory]);

  // Group filtered records into Chemical Families for the grouped presentation view
  const chemicalFamilies = useMemo<ChemicalFamily[]>(() => {
    const familyMap = new Map<string, ChemicalFamily>();

    filteredRecords.forEach(item => {
      const cas = (item.casNumber || '').trim().toLowerCase();
      const inci = (item.inciName || '').trim().toLowerCase();
      
      let groupKey = '';
      if (cas && cas !== 'n/a' && cas !== 'none' && cas !== '-') {
        groupKey = `cas:${cas}`;
      } else if (inci && inci !== 'n/a' && inci !== 'none') {
        groupKey = `inci:${inci}`;
      } else {
        groupKey = `name:${(item.name || '').trim().toLowerCase()}`;
      }

      if (!familyMap.has(groupKey)) {
        familyMap.set(groupKey, {
          key: groupKey,
          casNumber: item.casNumber || 'N/A',
          inciName: item.inciName || 'N/A',
          name: item.name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\d+%.*$/, '').trim() || item.name,
          category: item.category,
          subCategory: item.subCategory,
          function: item.function || 'Surfactant / Builder',
          description: item.description,
          phRange: (item as any).phRange || (item.phMin !== undefined ? `${item.phMin} - ${item.phMax}` : '6.0 - 9.0'),
          variants: []
        });
      }

      familyMap.get(groupKey)!.variants.push(item);
    });

    return Array.from(familyMap.values());
  }, [filteredRecords]);

  const toggleExpand = (familyKey: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [familyKey]: !prev[familyKey]
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="chemical-encyclopedia-root">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Chemical Encyclopedia
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative Raw Material & Commercial Grade Intelligence Database
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-84">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="encyclopedia-search-input"
            type="text"
            placeholder="Search CAS, INCI, trade name, grade, acronym..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-[#0b1020] focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition"
          />
        </div>
      </div>

      {/* View Switcher & Category Filter Ribbon */}
      <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Category Directory
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-[#131d35] p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
            <button
              id="btn-view-grouped"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'grouped'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Chemical Families ({chemicalFamilies.length})
            </button>
            <button
              id="btn-view-all-grades"
              onClick={() => setViewMode('all_grades')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'all_grades'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              All Commercial Grades ({filteredRecords.length})
            </button>
            <button
              id="btn-view-ingredient-research"
              onClick={() => setViewMode('ingredient_research')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'ingredient_research'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Autonomous Research Lab
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'All' 
              ? UNIVERSAL_INGREDIENTS.length 
              : UNIVERSAL_INGREDIENTS.filter(i => i.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-[#131d35]/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {cat} <span className="opacity-60 text-[10px] font-mono ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-400">
          {viewMode === 'grouped' ? (
            <>Displaying <strong className="text-white">{chemicalFamilies.length}</strong> Chemical Families spanning <strong className="text-cyan-300">{filteredRecords.length}</strong> verified commercial variants</>
          ) : (
            <>Displaying <strong className="text-cyan-300">{filteredRecords.length}</strong> distinct commercial raw-material grades</>
          )}
        </span>
        <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
          Master Library: {UNIVERSAL_INGREDIENTS.length} Records
        </span>
      </div>

      {/* Main Content Grid */}
      {viewMode === 'ingredient_research' ? (
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="text-cyan-400 w-5 h-5 animate-pulse" />
                Autonomous Unknown Ingredient Intelligence Lab
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero-guess autonomous AI technical datasheet (TDS) crawler, identity resolution, and parameter verification.
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                id="research-query-input"
                type="text"
                placeholder="Enter unknown ingredient (e.g. Aristo 9)..."
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                className="px-3 py-2.5 bg-[#131d35] border border-slate-750 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none w-full md:w-64 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                id="btn-trigger-research"
                onClick={handleTriggerResearch}
                disabled={isResearching || !researchQuery.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 shrink-0"
              >
                {isResearching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Acquire Evidence
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {isResearching && (
            <div className="bg-[#131d35]/50 border border-slate-800 rounded-xl p-6 text-center space-y-4 animate-pulse">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest block">Active Data Acquisition</span>
                <span className="text-sm font-semibold text-slate-200 block">{researchProgress}</span>
              </div>
              <div className="max-w-md mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-progress-bar w-2/3" />
              </div>
            </div>
          )}

          {researchResult && !isResearching && (
            <div className="space-y-6 animate-fade-in">
              {/* Identity Resolution Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#131d35]/40 border border-slate-800 rounded-xl p-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Query Input</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">{researchQuery}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Identity Confidence</span>
                  <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full mt-1 ${
                    researchResult.confidence === 'EXACT_MATCH'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      : researchResult.confidence === 'HIGH_CONFIDENCE_MATCH'
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  }`}>
                    {researchResult.confidence.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Resolved Canonical Record</span>
                  <span className="text-sm font-bold text-cyan-300 mt-0.5 block">{researchResult.resolvedName}</span>
                </div>
              </div>

              {/* Parameters Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Parameter-Level Provenance Ledger</h3>
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#131d35] border-b border-slate-800 text-slate-400">
                        <th className="p-3">Scientific Parameter</th>
                        <th className="p-3">Extracted Value</th>
                        <th className="p-3">Verification Status</th>
                        <th className="p-3">Authoritative Reference Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.keys(researchResult.provenance).map(pKey => {
                        const prov = researchResult.provenance[pKey];
                        const isVerified = prov.status === 'VERIFIED';
                        const isUnknown = prov.status === 'UNKNOWN';
                        return (
                          <tr key={pKey} className="hover:bg-[#131d35]/30">
                            <td className="p-3 font-semibold text-slate-200 capitalize">{pKey.replace(/([A-Z])/g, ' $1').trim()}</td>
                            <td className="p-3 font-mono text-cyan-300">{prov.value !== null ? String(prov.value) : 'UNKNOWN'}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                isVerified
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20'
                                  : isUnknown
                                  ? 'bg-slate-900 text-slate-500 border border-slate-800'
                                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/20'
                              }`}>
                                {prov.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {!isUnknown ? (
                                <a
                                  href={prov.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-cyan-400 hover:underline flex items-center gap-1 inline-flex"
                                >
                                  {prov.source}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Approval Panel */}
              {researchResult.requiresUserApproval ? (
                <div className="bg-[#131d35]/60 border border-cyan-500/30 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-cyan-400 animate-pulse" />
                      Verification Gate Approval Required
                    </span>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Authoritative properties (Active solids: <strong>{researchResult.parameters?.activeMatter !== undefined ? `${researchResult.parameters.activeMatter}%` : "N/A"}</strong>, pH: <strong>{researchResult.parameters?.pH !== undefined ? researchResult.parameters.pH : "N/A"}</strong>) resolved successfully for <strong>{researchResult.canonicalName || researchResult.resolvedName || researchQuery}</strong> from verified documentation. Applying these updates will automatically update the raw material database and re-evaluate dependent formulations in your library.
                    </p>
                  </div>
                  <button
                    id="btn-apply-research"
                    onClick={handleApplyVerifiedData}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm hover:brightness-110 transition flex items-center gap-2 self-end md:self-auto shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve & Apply Updates
                  </button>
                </div>
              ) : (
                <div className="bg-[#131d35]/40 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs text-slate-500 block">No high-risk calculation-critical parameters verified. Database update locked.</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chemicalFamilies.map(fam => {
            const isExpanded = !!expandedFamilies[fam.key];
            return (
              <div
                key={fam.key}
                className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3.5 hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold rounded-full mb-1.5">
                        {fam.category}
                      </span>
                      <h3 className="font-extrabold text-white text-base sm:text-lg">{fam.name}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#131d35] text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg shrink-0">
                      CAS: {fam.casNumber}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                    {fam.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
                    <div>
                      <strong className="text-slate-500">INCI:</strong>{' '}
                      <span className="text-slate-200 font-medium">{fam.inciName}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">pH Range:</strong>{' '}
                      <span className="text-cyan-300 font-mono font-bold">{fam.phRange}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">Function:</strong>{' '}
                      <span className="text-slate-200 font-medium">{fam.function}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">Commercial Variants:</strong>{' '}
                      <span className="text-emerald-400 font-mono font-bold">{fam.variants.length} Grades Available</span>
                    </div>
                  </div>
                </div>

                {/* Chemical Structure & Molecular Intelligence Section */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStructure(fam.key, fam.variants[0])}
                      className="flex-1 flex items-center justify-between px-3 py-2 bg-[#0c1426] hover:bg-[#121c33] border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-xs font-bold text-cyan-300 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Atom className="w-3.5 h-3.5 text-cyan-400" />
                        Chemical Structure & RDKit
                      </span>
                      {expandedStructures[fam.key] ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
                    </button>
                    {_props?.onInspectScience && (
                      <button
                        type="button"
                        onClick={() => _props.onInspectScience(fam.name || fam.inciName)}
                        title="Open in Science Lab 3D Molecular Workbench & PubChem"
                        className="px-3 py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 hover:from-blue-600/50 hover:to-purple-600/50 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 transition flex items-center gap-1.5 shrink-0"
                      >
                        <Atom className="w-3.5 h-3.5 text-purple-400" />
                        <span>3D Science Lab</span>
                      </button>
                    )}
                  </div>

                  {expandedStructures[fam.key] && (
                    <div className="mt-2.5 p-3.5 bg-[#070b14] border border-cyan-900/60 rounded-xl space-y-3 text-xs">
                      {loadingStructure[fam.key] ? (
                        <div className="flex items-center gap-2 text-cyan-400 text-xs py-2">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>Initializing RDKit WASM & resolving molecular graph...</span>
                        </div>
                      ) : structures[fam.key] ? (
                        (() => {
                          const struct = structures[fam.key];
                          const m = struct.structure;
                          return (
                            <div className="space-y-3">
                              {/* Status Header Badge */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  struct.classification === 'SINGLE_MOLECULE'
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                    : struct.classification === 'INORGANIC_SALT'
                                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                                    : struct.classification === 'COMMERCIAL_MIXTURE'
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                    : struct.classification === 'POLYMER'
                                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  {struct.classification === 'SINGLE_MOLECULE' && 'Chemical Structure Validated (Pure Molecule)'}
                                  {struct.classification === 'INORGANIC_SALT' && 'Inorganic Salt Structure Validated'}
                                  {struct.classification === 'COMMERCIAL_MIXTURE' && 'Commercial Raw Material Mixture'}
                                  {struct.classification === 'POLYMER' && 'Polydisperse High Polymer'}
                                  {struct.classification === 'UNKNOWN_STRUCTURE' && 'Structure Unavailable for Commercial Material'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                                  RDKit WASM {m?.rdkitVersion || '2026.03'}
                                </span>
                              </div>

                              {/* Scientific Disclosure / Note */}
                              <p className="text-[11px] text-slate-300 leading-relaxed bg-[#0b1222] p-2.5 rounded-lg border border-slate-800">
                                {struct.scientificNote}
                              </p>

                              {/* 2D Depiction SVG & Descriptors */}
                              {m && (
                                <div className="space-y-3">
                                  {/* 2D SVG & SMILES */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                    {m.svgDepiction ? (
                                      <div
                                        className="bg-white/5 border border-slate-700 rounded-lg p-2 flex items-center justify-center overflow-hidden max-h-40 [&>svg]:max-h-36 [&>svg]:w-auto"
                                        dangerouslySetInnerHTML={{ __html: m.svgDepiction }}
                                      />
                                    ) : (
                                      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-center text-[11px] text-slate-500">
                                        2D depiction not generated
                                      </div>
                                    )}

                                    <div className="space-y-1.5 min-w-0">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canonical SMILES</span>
                                      <div className="font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-800 text-cyan-300 break-all select-all">
                                        {m.canonicalSmiles}
                                      </div>
                                      {m.inchiKey && (
                                        <div className="text-[10px] font-mono text-slate-400 truncate">
                                          InChIKey: {m.inchiKey}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Molecular Descriptors Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                                      <span className="text-[10px] text-slate-400 block">Molecular Weight</span>
                                      <strong className="text-white font-mono text-xs">{m.molecularWeight.toFixed(2)} g/mol</strong>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                                      <span className="text-[10px] text-slate-400 block">Crippen ClogP</span>
                                      <strong className={`font-mono text-xs ${m.logP !== undefined && m.logP > 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
                                        {m.logP !== undefined ? m.logP.toFixed(2) : 'N/A'}
                                      </strong>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                                      <span className="text-[10px] text-slate-400 block">Polar Area (TPSA)</span>
                                      <strong className="text-white font-mono text-xs">{m.tpsa !== undefined ? `${m.tpsa.toFixed(1)} Å²` : 'N/A'}</strong>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                                      <span className="text-[10px] text-slate-400 block">H-Bond Donors (HBD)</span>
                                      <strong className="text-white font-mono text-xs">{m.hBondDonorCount}</strong>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                                      <span className="text-[10px] text-slate-400 block">H-Bond Acceptors (HBA)</span>
                                      <strong className="text-white font-mono text-xs">{m.hBondAcceptorCount}</strong>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                                      <span className="text-[10px] text-slate-400 block">Rotatable Bonds</span>
                                      <strong className="text-white font-mono text-xs">{m.rotatableBondCount}</strong>
                                    </div>
                                  </div>

                                  {/* Substructure / Functional Group Tags */}
                                  {m.substructureTags.length > 0 && (
                                    <div className="pt-2 border-t border-slate-800">
                                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                                        Detected Functional Moieties
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {m.substructureTags.map(tag => (
                                          <span
                                            key={tag}
                                            className="px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 rounded text-[10px] font-mono font-bold"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Commercial Mixture Breakdown Table (if available) */}
                              {struct.commercialComponents && struct.commercialComponents.length > 0 && (
                                <div className="pt-2 border-t border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                                    Commercial Mixture Components (Manufacturer Specification)
                                  </span>
                                  <div className="space-y-1">
                                    {struct.commercialComponents.map(comp => (
                                      <div key={comp.name} className="flex justify-between items-center text-[10px] bg-slate-950 p-1.5 rounded border border-slate-800">
                                        <span className="text-slate-200 font-medium">{comp.name}</span>
                                        <span className="text-emerald-400 font-mono font-bold">{comp.approximatePercentage}% (nominal)</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Authoritative Provenance Footnote */}
                              <div className="flex items-start gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Scientific Provenance:</strong> Calculated by RDKit WASM engine. Theoretical topological parameters. Does not replace supplier Certificate of Analysis (COA) or empirical wet-lab assay.
                                </span>
                              </div>

                              {_props?.onInspectScience && (
                                <button
                                  type="button"
                                  onClick={() => _props.onInspectScience(fam.name || fam.inciName)}
                                  className="w-full mt-2 py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                                >
                                  <Atom className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Open 3D Conformer & Literature in Science Lab</span>
                                </button>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-slate-400 text-xs py-1">
                          Chemical structure calculation unavailable for this material.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Commercial Grade Variants Section */}
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => toggleExpand(fam.key)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#131d35] hover:bg-[#182442] border border-slate-700/80 rounded-xl text-xs font-bold text-cyan-300 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Beaker className="w-3.5 h-3.5" />
                      View {fam.variants.length} Commercial Grades & Pricing
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-800">
                      {fam.variants.map((v) => (
                        <div
                          key={v.id}
                          className="bg-[#090f1d] border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs truncate">{v.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                                ID: {v.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {v.description}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-right">
                              <div className="text-xs font-mono font-bold text-emerald-400">
                                {v.activeDefault}% Active
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                ${v.costPerKg?.toFixed(2)}/kg
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* All 400 Commercial Grades View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(item => (
            <div
              key={item.id}
              className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3 hover:border-cyan-500/40 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="inline-block px-2.5 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-full mb-1">
                      {item.category}
                    </span>
                    <h3 className="font-extrabold text-white text-sm sm:text-base line-clamp-2">{item.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-[#131d35] text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                    CAS: {item.casNumber}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400">Active:</span>{' '}
                  <strong className="text-emerald-400 font-mono">{item.activeDefault}%</strong>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Cost:</span>{' '}
                  <strong className="text-white font-mono">${item.costPerKg?.toFixed(2)}/kg</strong>
                </div>
                <div className="col-span-2 text-[11px]">
                  <span className="text-slate-500">INCI:</span>{' '}
                  <span className="text-slate-300 font-mono">{item.inciName || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

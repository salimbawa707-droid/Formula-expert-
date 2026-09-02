import { useState, useMemo } from 'react';
import {
  UNIVERSAL_INGREDIENTS,
  searchUniversalIngredients,
  getAllCategories,
  UniversalIngredient
} from '../data/universalIngredientLibrary';
import { Search, BookOpen, Layers, Sparkles, Filter, ChevronDown, ChevronUp, DollarSign, Activity, Beaker } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'grouped' | 'all_grades'>('grouped');
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

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
      {viewMode === 'grouped' ? (
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

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Layers, 
  Database, 
  Tag, 
  Sparkles,
  Beaker,
  Check
} from 'lucide-react';
import { UniversalIngredient } from '../types';
import { 
  searchUniversalIngredients, 
  getAllCategories, 
  getAllUniversalIngredients 
} from '../data/universalIngredientLibrary';

export interface UniversalIngredientLibraryUIProps {
  onSelectIngredient?: (ingredient: UniversalIngredient) => void;
  initialCategory?: string;
  initialSearchQuery?: string;
  compactMode?: boolean;
  showCategories?: boolean;
  className?: string;
  maxHeight?: string;
}

export default function UniversalIngredientLibraryUI({
  onSelectIngredient,
  initialCategory = 'All',
  initialSearchQuery = '',
  compactMode = false,
  showCategories = true,
  className = '',
  maxHeight
}: UniversalIngredientLibraryUIProps) {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get all unique categories dynamically from backend
  const categories = useMemo(() => {
    const cats = getAllCategories();
    return ['All', ...cats];
  }, []);

  // Simulate smooth loading transition on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Real-time search using existing backend Smart Search engine
  const filteredIngredients = useMemo(() => {
    const categoryFilter = selectedCategory === 'All' ? undefined : selectedCategory;
    return searchUniversalIngredients(searchQuery, {
      category: categoryFilter
    });
  }, [searchQuery, selectedCategory]);

  const totalIngredientsCount = useMemo(() => {
    return getAllUniversalIngredients().length;
  }, []);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className={`w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 space-y-6 ${className}`}>
      
      {/* HEADER SECTION */}
      {!compactMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Database size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Universal Ingredient Library
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totalIngredientsCount} Raw Materials
                </span>
              </h2>
            </div>
            <p className="text-sm text-slate-400 pl-0.5">
              Search and browse all available formulation ingredients.
            </p>
          </div>
        </div>
      )}

      {/* SEARCH BAR & ACTIVE FILTER SUMMARY */}
      <div className="space-y-3">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredients by name, alias, CAS number, chemical role, or category..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results Counter & Active Category indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span>
              Showing <strong className="text-slate-200 font-semibold">{filteredIngredients.length}</strong> {filteredIngredients.length === 1 ? 'ingredient' : 'ingredients'}
              {selectedCategory !== 'All' && (
                <span> in <strong className="text-indigo-300">{selectedCategory}</strong></span>
              )}
            </span>
          </div>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY CHIPS SECTION */}
      {showCategories && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Filter size={13} className="text-indigo-400" /> Categories
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat}
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* INGREDIENT LIST SECTION */}
      <div 
        className={`space-y-3 ${maxHeight ? `overflow-y-auto ${maxHeight} pr-1` : ''}`}
      >
        {isLoading ? (
          /* Loading State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-800/80 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-4 bg-slate-800/60 rounded w-1/3" />
                  <div className="h-4 bg-slate-800/40 rounded w-1/4" />
                </div>
                <div className="h-10 bg-slate-800/40 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredIngredients.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl space-y-3">
            <div className="p-3.5 rounded-full bg-slate-800/60 text-slate-400 border border-slate-700/50">
              <Beaker size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">No ingredients found.</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No matching materials found for "{searchQuery || selectedCategory}". Try adjusting your keywords or clearing selected category filters.
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          /* Ingredient Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredIngredients.map((ing) => (
              <div
                key={ing.id}
                onClick={() => onSelectIngredient && onSelectIngredient(ing)}
                className={`bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3 transition duration-150 shadow-sm ${
                  onSelectIngredient 
                    ? 'hover:border-indigo-500/80 hover:bg-slate-800/70 cursor-pointer hover:shadow-indigo-500/10' 
                    : 'hover:border-slate-700/80 hover:bg-slate-900/90'
                }`}
              >
                <div className="space-y-2">
                  {/* Ingredient Name */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-100 leading-snug tracking-wide">
                      {ing.name}
                    </h4>
                  </div>

                  {/* Category & Subcategory */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                      {ing.category}
                    </span>
                    {ing.subCategory && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
                        {ing.subCategory}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Function ONLY */}
                <div className="pt-2 border-t border-slate-800/60 space-y-1">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                    Primary Function
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal line-clamp-2">
                    {ing.function || 'Formulation functional raw material.'}
                  </p>
                </div>

                {/* Optional Select Button if integrated as picker */}
                {onSelectIngredient && (
                  <div className="pt-1 flex justify-end">
                    <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                      Select Ingredient &rarr;
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

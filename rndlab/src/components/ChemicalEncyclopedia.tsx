import React, { useState } from "react";
import { Chemical } from "../types";
import { CHEMICALS, COMPATIBILITY_MATRIX } from "../data/chemicals";
import { getAllUniversalIngredients, searchUniversalIngredients, getAllCategories } from "../data/universalIngredientLibrary";
import { Search, Eye, ArrowLeftRight, Check, AlertTriangle, Shield, Leaf, Info, HelpCircle, Plus, X } from "lucide-react";

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  selectedChemicalId?: string | null;
  onSelectChemical?: (id: string | null) => void;
}

export default function ChemicalEncyclopedia({ lang, translations, selectedChemicalId, onSelectChemical }: Props) {
  const [chemicalsList, setChemicalsList] = useState<Chemical[]>(() => {
    const universalBase = getAllUniversalIngredients() as Chemical[];
    const saved = localStorage.getItem("detergent_rd_custom_chemicals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mergedMap = new Map<string, Chemical>();
          universalBase.forEach(c => mergedMap.set(c.id, c));
          parsed.forEach((c: Chemical) => mergedMap.set(c.id, c));
          return Array.from(mergedMap.values());
        }
      } catch (e) {
        console.error("Error loading custom chemicals:", e);
      }
    }
    return universalBase;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedChemical, setSelectedChemical] = useState<Chemical>(() => {
    const universalBase = getAllUniversalIngredients() as Chemical[];
    const saved = localStorage.getItem("detergent_rd_custom_chemicals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0] || universalBase[0];
        }
      } catch (e) {}
    }
    return universalBase[0];
  });
  const [activeTab, setActiveTab] = useState<"overview" | "physical" | "dosage" | "safety" | "compatibility" | "provenance">("overview");

  React.useEffect(() => {
    if (selectedChemicalId) {
      const found = chemicalsList.find(c => c.id === selectedChemicalId);
      if (found) {
        setSelectedChemical(found);
        setSelectedCategory("All");
        setSearchQuery("");
        onSelectChemical?.(null);
      }
    }
  }, [selectedChemicalId, chemicalsList, onSelectChemical]);
  
  // Search input ref
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Compatibility dropdown state
  const [comparePartnerId, setComparePartnerId] = useState<string>("");
  
  // Chemical Comparison state
  const [compareList, setCompareList] = useState<Chemical[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Add chemical modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChemCommonName, setNewChemCommonName] = useState("");
  const [newChemChemicalName, setNewChemChemicalName] = useState("");
  const [newChemCategory, setNewChemCategory] = useState("Nonionic Surfactants");
  const [newChemCas, setNewChemCas] = useState("");
  const [newChemInci, setNewChemInci] = useState("");
  const [newChemWhyUsed, setNewChemWhyUsed] = useState("");
  const [newChemWhatIsIt, setNewChemWhatIsIt] = useState("");
  const [newChemActiveMatter, setNewChemActiveMatter] = useState("");
  const [newChemPH, setNewChemPH] = useState("6.5 - 7.5");
  const [newChemAppearance, setNewChemAppearance] = useState("Liquid");

  const handleAddChemicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChemCommonName || !newChemChemicalName || !newChemCas) {
      alert("Please fill in Common Name, Chemical Name, and CAS Number.");
      return;
    }

    const newId = "custom-" + newChemCommonName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newChemical: Chemical = {
      id: newId,
      commonName: newChemCommonName,
      chemicalName: newChemChemicalName,
      iupacName: newChemCommonName + " (IUPAC)",
      casNumber: newChemCas,
      molecularFormula: "N/A",
      molecularWeight: "N/A",
      inciName: newChemInci || newChemCommonName,
      tradeNames: [newChemCommonName],
      synonyms: [],
      category: newChemCategory,
      suppliers: ["Local R&D Lab Stock"],
      marketNames: {
        indian: newChemCommonName,
        international: newChemCommonName,
        hindi: ""
      },
      physicalProperties: {
        appearance: newChemAppearance || "Liquid",
        color: "Water-white or Amber",
        odor: "Characteristic",
        activeMatter: newChemActiveMatter || "100%",
        pH: newChemPH || "7.0",
        density: "1.02 g/cm³",
        viscosity: "200 cPs",
        solubility: "Soluble in water",
        shelfLife: "24 Months",
        storageConditions: "Store in cool, dry R&D cabinet."
      },
      functionalInfo: {
        whatIsIt: newChemWhatIsIt || "Added via custom formulation ingredients console.",
        whyUsed: newChemWhyUsed || "Primary active or co-surfactant booster.",
        advantages: ["Custom added", "Readily available in lab"],
        limitations: ["Specific R&D validation required"],
        alternatives: [],
        ecoFriendliness: "Standard synthetic or plant-derived."
      },
      dosage: {
        minimum: "0.5%",
        recommended: "3.0%",
        premium: "6.0%",
        maximum: "15.0%",
        household: "1% - 5%",
        industrial: "1% - 5%"
      },
      performance: {
        cleaning: 7,
        foam: 6,
        oilRemoval: 7,
        greaseCutting: 7,
        skinMildness: 8,
        hardWater: 8
      },
      sustainability: {
        biodegradability: "Readily Biodegradable",
        plantBasedPct: 50,
        petroleumBasedPct: 50,
        vocStatus: "Zero VOC",
        microplasticStatus: "Non-microplastic",
        aquaticToxicity: "Low",
        greenRating: "B"
      },
      safety: {
        ppe: ["Safety Glasses", "Protective Gloves"],
        ghsClassification: ["Mild Irritation"],
        hazardStatements: ["H315: Causes skin irritation"],
        precautionaryStatements: ["P280: Wear protective gloves."],
        firstAid: "Flush with water.",
        msdsSummary: "Refer to custom lab material sheet."
      }
    };

    const updated = [...chemicalsList, newChemical];
    setChemicalsList(updated);
    setSelectedChemical(newChemical);

    // Save custom ones specifically
    const universalBase = getAllUniversalIngredients();
    const customOnly = updated.filter(c => !universalBase.some(orig => orig.id === c.id));
    localStorage.setItem("detergent_rd_custom_chemicals", JSON.stringify(customOnly));

    // Reset Form
    setNewChemCommonName("");
    setNewChemChemicalName("");
    setNewChemCas("");
    setNewChemInci("");
    setNewChemWhyUsed("");
    setNewChemWhatIsIt("");
    setNewChemActiveMatter("");
    setNewChemPH("6.5 - 7.5");
    setNewChemAppearance("Liquid");

    setIsAddModalOpen(false);
  };

  // Dynamic Categories list from Universal Ingredient Library
  const categories = [
    "All",
    ...getAllCategories()
  ];

  // Filter chemicals using Universal Smart Search engine
  const filteredChemicals = React.useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    let list = chemicalsList;

    if (s) {
      const searchResults = searchUniversalIngredients(searchQuery) as Chemical[];
      const searchIds = new Set(searchResults.map(r => r.id));
      list = list.filter(c => 
        searchIds.has(c.id) ||
        (c.commonName || "").toLowerCase().includes(s) ||
        (c.chemicalName || "").toLowerCase().includes(s) ||
        (c.casNumber || "").toLowerCase().includes(s) ||
        (c.inciName || "").toLowerCase().includes(s) ||
        (c.iupacName || "").toLowerCase().includes(s) ||
        (c.category || "").toLowerCase().includes(s) ||
        (c.subCategory || "").toLowerCase().includes(s) ||
        (Array.isArray(c.synonyms) && c.synonyms.some(syn => syn && syn.toLowerCase().includes(s))) ||
        (Array.isArray(c.tradeNames) && c.tradeNames.some(t => t && t.toLowerCase().includes(s)))
      );
    }

    if (selectedCategory !== "All") {
      list = list.filter(chem => 
        chem.category === selectedCategory ||
        (chem.category && selectedCategory && (
          chem.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(chem.category.toLowerCase())
        )) ||
        (chem.subCategory && selectedCategory && (
          chem.subCategory.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(chem.subCategory.toLowerCase())
        ))
      );
    }

    return list;
  }, [chemicalsList, searchQuery, selectedCategory]);

  // Automatically update selected chemical when filtered results change and current selection is not in list
  React.useEffect(() => {
    if (filteredChemicals.length > 0) {
      const exists = filteredChemicals.some(c => c.id === selectedChemical?.id);
      if (!exists) {
        setSelectedChemical(filteredChemicals[0]);
      }
    }
  }, [searchQuery, selectedCategory, filteredChemicals, selectedChemical]);

  // Get compatibility details
  const getCompatibility = (idA: string, idB: string) => {
    const pair = COMPATIBILITY_MATRIX.find(
      (p) =>
        (p.chemicalA.toLowerCase().includes(idA) && p.chemicalB.toLowerCase().includes(idB)) ||
        (p.chemicalA.toLowerCase().includes(idB) && p.chemicalB.toLowerCase().includes(idA))
    );
    if (pair) return pair;
    
    // Default fallback calculation if not explicitly mapped
    const chemA = chemicalsList.find(c => c.id === idA);
    const chemB = chemicalsList.find(c => c.id === idB);
    if (!chemA || !chemB) return null;

    if (chemA.category === "Alkalis" && chemB.category === "Acids") {
      return {
        status: "Partially Compatible" as const,
        reason: "Strong acid-base neutralization will occur instantly, releasing high exothermic reaction heat. Requires slow controlled blending under dilution.",
        recommendedMixingMethod: "Always dissolve both components fully in separate water portions, then neutralize slowly while monitoring temperature."
      };
    }
    
    return {
      status: "Compatible" as const,
      reason: "No hostile chemical reaction predicted under normal temperatures. Standard surfactant blending rules apply.",
      recommendedMixingMethod: "Blend sequentially into the water carrier with moderate agitation."
    };
  };

  const handleAddToCompare = (chem: Chemical) => {
    if (compareList.some(c => c.id === chem.id)) {
      setCompareList(compareList.filter(c => c.id !== chem.id));
    } else {
      if (compareList.length >= 3) {
        alert("You can compare up to 3 chemicals side-by-side.");
        return;
      }
      setCompareList([...compareList, chem]);
    }
  };

  const currentCompResult = comparePartnerId ? getCompatibility(selectedChemical.id, comparePartnerId) : null;
  const partnerChemical = chemicalsList.find(c => c.id === comparePartnerId);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden w-full" id="chemical-encyclopedia-root">
      {/* Title & Stats */}
      <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
        <div>
          <h2 className="text-lg font-bold text-[#0f766e] flex items-center gap-2">
            🧪 {translations[lang].encyclopedia}
          </h2>
          <p className="text-xs text-gray-500">
            {translations[lang].chemDbStats || "Interactive Knowledge base of essential detergent raw materials"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0f766e] text-white hover:bg-[#0d645c] flex items-center gap-1 transition-all shadow-sm"
          >
            <Plus size={14} />
            Add Ingredient
          </button>
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              isComparing
                ? "bg-[#0f766e] text-white"
                : "bg-[#f3f4f6] text-gray-700 hover:bg-[#e5e7eb]"
            }`}
          >
            <ArrowLeftRight size={14} />
            {isComparing ? "Back to Details" : `Compare (${compareList.length})`}
          </button>
          <span className="text-xs bg-[#ccfbf1] text-[#0f766e] px-2.5 py-1 rounded-full font-bold">
            {chemicalsList.length} Chemicals Loaded
          </span>
        </div>
      </div>

      {isComparing ? (
        /* CHEMICAL COMPARISON PANEL */
        <div className="flex-1 p-6 overflow-y-auto bg-[#f9fafb]">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-[#0f766e]" />
              Chemical Side-by-Side Comparison Grid
            </h3>
            {compareList.length === 0 ? (
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center text-gray-500">
                <HelpCircle size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold">No chemicals selected for comparison.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Go back to the chemical details view and click "Add to Compare" for up to 3 chemicals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Attributes Column */}
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 text-xs font-semibold text-gray-500 flex flex-col justify-between hidden md:flex">
                  <div className="border-b pb-2 mb-2 font-bold text-gray-700">Attribute</div>
                  <div className="py-2.5 border-b">Category</div>
                  <div className="py-2.5 border-b">CAS Number</div>
                  <div className="py-2.5 border-b">Molecular Formula</div>
                  <div className="py-2.5 border-b">pH (1% soln)</div>
                  <div className="py-2.5 border-b">Typical Appearance</div>
                  <div className="py-2.5 border-b">Primary Function</div>
                  <div className="py-2.5 border-b">Active Matter Purity</div>
                  <div className="py-2.5 border-b">Cleaning Rating (1-10)</div>
                  <div className="py-2.5 border-b">Foam Rating (1-10)</div>
                  <div className="py-2.5 border-b">Plant-Based %</div>
                  <div className="py-2.5 border-b">Green Rating</div>
                  <div className="py-2.5">Actions</div>
                </div>

                {/* Chemical Columns */}
                {compareList.map((chem) => (
                  <div key={chem.id} className="bg-white rounded-xl border-2 border-[#e5e7eb] p-4 flex flex-col shadow-sm">
                    <div className="border-b pb-2 mb-2">
                      <span className="text-[10px] font-bold uppercase bg-teal-50 text-[#0f766e] px-1.5 py-0.5 rounded">
                        {chem.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-1">{chem.commonName}</h4>
                      <p className="text-[11px] text-gray-500 italic truncate">{chem.chemicalName}</p>
                    </div>

                    <div className="text-xs space-y-1 text-gray-800 flex-1">
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Category: </span>
                        <span>{chem.category}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">CAS: </span>
                        <span className="font-mono">{chem.casNumber}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Formula: </span>
                        <span className="font-mono">{chem.molecularFormula}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">pH (1% soln): </span>
                        <span>{chem.physicalProperties.pH}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Appearance: </span>
                        <span>{chem.physicalProperties.appearance}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Why Used: </span>
                        <span className="line-clamp-2">{chem.functionalInfo.whyUsed}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Active Matter: </span>
                        <span>{chem.physicalProperties.activeMatter}</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Cleaning: </span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-gray-200 h-2 rounded overflow-hidden">
                            <div className="bg-teal-600 h-full" style={{ width: `${chem.performance.cleaning * 10}%` }}></div>
                          </div>
                          <span>{chem.performance.cleaning}/10</span>
                        </div>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Foam: </span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-gray-200 h-2 rounded overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${chem.performance.foam * 10}%` }}></div>
                          </div>
                          <span>{chem.performance.foam}/10</span>
                        </div>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Plant-Based: </span>
                        <span>{chem.sustainability.plantBasedPct}%</span>
                      </div>
                      <div className="py-2 border-b md:border-none flex justify-between md:block">
                        <span className="md:hidden font-bold text-gray-400">Green Rating: </span>
                        <span className="font-bold text-[#0f766e]">{chem.sustainability.greenRating}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCompare(chem)}
                      className="mt-4 w-full bg-red-50 text-red-600 hover:bg-red-100 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STANDARD DUAL PANE LAYOUT */
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* Left chemical index sidebar */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#e5e7eb] flex flex-col bg-white shrink-0">
            {/* Search Input */}
            <div className="p-3 border-b border-[#e5e7eb] space-y-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-3 text-gray-400 cursor-pointer hover:text-[#0f766e] transition-colors"
                  onClick={() => searchInputRef.current?.focus()}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search ingredients by name, CAS number, or synonym..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-7 py-2 bg-[#f3f4f6] text-gray-900 placeholder:text-gray-400 caret-[#0f766e] rounded-full border-none focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Dropdown Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs bg-white border border-[#e5e7eb] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#e5e7eb] max-h-[320px] md:max-h-none">
              {filteredChemicals.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching chemicals found.
                </div>
              ) : (
                filteredChemicals.map((chem) => (
                  <div
                    key={chem.id}
                    onClick={() => {
                      setSelectedChemical(chem);
                      setComparePartnerId("");
                    }}
                    className={`p-3 text-left cursor-pointer transition-all ${
                      selectedChemical.id === chem.id
                        ? "border-l-4 border-[#0f766e] bg-[#f0fdfa]"
                        : "hover:bg-[#f3f4f6]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1 pr-1">
                        <span className="font-semibold text-xs text-gray-900 break-words sm:truncate block">
                          {chem.commonName}
                        </span>
                        <div className="text-[10px] text-gray-500 break-words sm:truncate mt-0.5">
                          {chem.chemicalName}
                        </div>
                      </div>
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono shrink-0 whitespace-nowrap self-start">
                        {chem.casNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1.5 min-w-0">
                      <span className="text-[9px] text-[#0f766e] font-semibold shrink-0">
                        {chem.category}
                      </span>
                      {chem.marketNames?.hindi && (
                        <span className="text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded shrink-0 whitespace-nowrap">
                          {chem.marketNames.hindi}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right detail view pane */}
          <div className="flex-1 flex flex-col bg-[#f9fafb] overflow-y-auto p-2.5 sm:p-4 md:p-6">
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-3.5 sm:p-5 shadow-sm space-y-4">
              {/* Header Title & Compare Toggle */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 border-b pb-3 border-gray-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0f766e] px-2.5 py-0.5 rounded">
                      {selectedChemical.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded">
                      CAS: {selectedChemical.casNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded">
                      Charge: {selectedChemical.chargeType || "Anionic"}
                    </span>
                    {selectedChemical.hlb && selectedChemical.hlb !== "N/A" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded">
                        HLB: {selectedChemical.hlb}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-1 break-words">
                    {selectedChemical.commonName}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono italic">
                    IUPAC: {selectedChemical.iupacName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToCompare(selectedChemical)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      compareList.some(c => c.id === selectedChemical.id)
                        ? "bg-[#0f766e] text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {compareList.some(c => c.id === selectedChemical.id) ? (
                      <>
                        <Check size={12} /> Compare Listed
                      </>
                    ) : (
                      <>
                        <PlusSquareIcon size={12} /> Add to Compare
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-tabs for detailed navigation */}
              <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
                {[
                  { id: "overview", label: "Overview & Function" },
                  { id: "physical", label: "Physical Properties" },
                  { id: "dosage", label: "Dosage & Performance" },
                  { id: "safety", label: "Eco & Safety (GHS)" },
                  { id: "compatibility", label: "Compatibility Matrix" },
                  { id: "provenance", label: "Provenance & Regulatory" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`text-xs font-semibold pb-2 px-1 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === t.id
                        ? "border-[#0f766e] text-[#0f766e]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === "overview" && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Description & Chemistry
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selectedChemical.functionalInfo.whatIsIt}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Primary Application Reason
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed bg-teal-50/50 p-3 rounded-lg border border-teal-100/50">
                      {selectedChemical.functionalInfo.whyUsed}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
                      <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                        <Check size={14} /> Key Advantages
                      </h5>
                      <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                        {selectedChemical.functionalInfo.advantages.map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50/30 p-3 rounded-lg border border-red-100">
                      <h5 className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle size={14} /> Limitations
                      </h5>
                      <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                        {selectedChemical.functionalInfo.limitations.map((lim, idx) => (
                          <li key={idx}>{lim}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-gray-500 mb-1">Recommended Alternatives</h4>
                      <p className="text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono">
                        {selectedChemical.functionalInfo.alternatives.join(" | ")}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-500 mb-1">Major Suppliers</h4>
                      <p className="text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        {selectedChemical.suppliers.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "physical" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
                  {[
                    { label: "Appearance", val: selectedChemical.physicalProperties.appearance },
                    { label: "Color Index", val: selectedChemical.physicalProperties.color },
                    { label: "Odor Description", val: selectedChemical.physicalProperties.odor },
                    { label: "Active Matter Concentration", val: selectedChemical.physicalProperties.activeMatter },
                    { label: "pH Range (1% Soln)", val: selectedChemical.physicalProperties.pH },
                    { label: "Relative Density", val: selectedChemical.physicalProperties.density },
                    { label: "Typical Viscosity", val: selectedChemical.physicalProperties.viscosity },
                    { label: "Water Solubility", val: selectedChemical.physicalProperties.solubility },
                    { label: "Storage Shelf Life", val: selectedChemical.physicalProperties.shelfLife }
                  ].map((prop, idx) => (
                    <div key={idx} className="bg-[#f3f4f6] p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{prop.label}</span>
                      <p className="font-semibold text-xs text-gray-900 mt-1">{prop.val || "N/A"}</p>
                    </div>
                  ))}
                  <div className="md:col-span-3 bg-teal-50/20 p-3 rounded-lg border border-teal-100 text-xs">
                    <span className="font-bold text-[#0f766e] block mb-1">Optimal Storage & Stability Conditions:</span>
                    <p className="text-gray-700">{selectedChemical.physicalProperties.storageConditions}</p>
                  </div>
                </div>
              )}

              {activeTab === "dosage" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-[#f3f4f6] p-4 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      R&D Dosage Guidelines
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Minimum</span>
                        <span className="font-bold text-[#0f766e] text-sm">{selectedChemical.dosage.minimum}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Standard Rec.</span>
                        <span className="font-bold text-blue-600 text-sm">{selectedChemical.dosage.recommended}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Premium Target</span>
                        <span className="font-bold text-purple-600 text-sm">{selectedChemical.dosage.premium}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Maximum Limit</span>
                        <span className="font-bold text-red-600 text-sm">{selectedChemical.dosage.maximum}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs text-gray-700">
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="font-bold text-gray-500">Household Application:</span> {selectedChemical.dosage.household}
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="font-bold text-gray-500">Industrial Application:</span> {selectedChemical.dosage.industrial}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Technical Performance Ratings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: "Cleaning & Detergency", rating: selectedChemical.performance.cleaning, color: "bg-[#0f766e]" },
                        { label: "Foam Volume & Richness", rating: selectedChemical.performance.foam, color: "bg-blue-500" },
                        { label: "Oil Emulsification", rating: selectedChemical.performance.oilRemoval, color: "bg-indigo-500" },
                        { label: "Grease Cutting Speed", rating: selectedChemical.performance.greaseCutting, color: "bg-orange-500" },
                        { label: "Skin & Eye Mildness", rating: selectedChemical.performance.skinMildness, color: "bg-emerald-500" },
                        { label: "Hard Water / Ion Stability", rating: selectedChemical.performance.hardWater, color: "bg-purple-500" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-100 flex items-center justify-between text-xs gap-4">
                          <span className="font-medium text-gray-700">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className={`${item.color} h-full`} style={{ width: `${item.rating * 10}%` }}></div>
                            </div>
                            <span className="font-bold text-gray-900 w-6 text-right">{item.rating}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "safety" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Eco profile */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Leaf size={12} /> Ready Biodegradability
                      </span>
                      <p className="text-xs text-gray-700">{selectedChemical.sustainability.biodegradability}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                        Bio-sourced Composition %
                      </span>
                      <p className="text-xs text-gray-700">
                        {selectedChemical.sustainability.plantBasedPct}% Bio / {selectedChemical.sustainability.petroleumBasedPct}% Petro
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                        Ecotox / Green score
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-emerald-800">{selectedChemical.sustainability.greenRating}</span>
                        <span className="text-[10px] text-gray-500">({selectedChemical.sustainability.vocStatus})</span>
                      </div>
                    </div>
                  </div>

                  {/* GHS Safety Alerts */}
                  <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 space-y-3">
                    <div className="flex items-start gap-2">
                      <Shield className="text-red-600 shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                          GHS Chemical Safety Hazards
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {selectedChemical.safety.ghsClassification.map((cl, idx) => (
                            <span key={idx} className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              {cl}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="font-bold text-gray-700 block">PPE Safety Kit Required:</span>
                      <p className="text-gray-600 font-medium">{selectedChemical.safety.ppe.join(", ")}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-red-900">Hazard Statements (H-Codes):</span>
                        <ul className="list-disc pl-4 text-red-800 space-y-0.5 mt-1">
                          {selectedChemical.safety.hazardStatements.map((h, idx) => (
                            <li key={idx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Precautionary Codes (P-Codes):</span>
                        <ul className="list-disc pl-4 text-gray-600 space-y-0.5 mt-1">
                          {selectedChemical.safety.precautionaryStatements.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded border border-red-100 text-[11px]">
                      <span className="font-bold text-red-900">Immediate First Aid Action:</span>
                      <p className="text-gray-700 mt-0.5">{selectedChemical.safety.firstAid}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "provenance" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-teal-50/40 p-4 rounded-xl border border-teal-100 flex items-start gap-3">
                    <Info className="text-teal-700 shrink-0 mt-0.5" size={16} />
                    <div className="text-xs text-teal-900">
                      <span className="font-bold block">Smart Formula Analyzer Pro - R&D Provenance</span>
                      This tab houses Tier C variable data, industrial registries, supplier prices, and manufacturer logs. Any field marked as <span className="font-bold text-amber-700 font-mono">"Requires Manual Verification"</span> represents unverified industrial estimates.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Regulatory Details Card */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3.5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                        <Shield size={14} className="text-[#0f766e]" /> Regulatory & Registries
                      </h4>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">CAS Registry Number</span>
                          {selectedChemical.casNumber && selectedChemical.casNumber !== "Evidence Not Available — Requires Manual Verification" ? (
                            <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-bold">
                              <Check size={12} className="text-emerald-600" /> {selectedChemical.casNumber} (Verified)
                            </span>
                          ) : (
                            <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Requires Manual Verification
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">REACH Status (EU)</span>
                          {selectedChemical.reachStatus && selectedChemical.reachStatus !== "Evidence Not Available — Requires Manual Verification" ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-medium">
                              <Check size={12} className="text-emerald-600" /> {selectedChemical.reachStatus}
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Evidence Not Available — Requires Manual Verification
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">EPA Inventory Status (US)</span>
                          {selectedChemical.epaStatus && selectedChemical.epaStatus !== "Evidence Not Available — Requires Manual Verification" ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-medium">
                              <Check size={12} className="text-emerald-600" /> {selectedChemical.epaStatus}
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Evidence Not Available — Requires Manual Verification
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">Charge Classification</span>
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-bold">
                            {selectedChemical.chargeType || "Anionic"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Commercial & Manufacturer Card */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3.5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                        <Leaf size={14} className="text-[#0f766e]" /> Commercial & Manufacturing
                      </h4>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">Approximate Market Price</span>
                          {selectedChemical.approxPrice && selectedChemical.approxPrice !== "Evidence Not Available — Requires Manual Verification" ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-bold">
                              <Check size={12} className="text-emerald-600" /> {selectedChemical.approxPrice}
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Evidence Not Available — Requires Manual Verification
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">Primary Manufacturers</span>
                          {selectedChemical.manufacturers && selectedChemical.manufacturers.length > 0 && !selectedChemical.manufacturers.every(m => m.includes("Evidence Not Available")) ? (
                            <p className="text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium">
                              {selectedChemical.manufacturers.filter(m => m !== "Evidence Not Available — Requires Manual Verification").join(", ")}
                            </p>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Evidence Not Available — Requires Manual Verification
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">Indian / Global Suppliers</span>
                          {selectedChemical.suppliers && selectedChemical.suppliers.length > 0 && !selectedChemical.suppliers.every(s => s.includes("Evidence Not Available")) ? (
                            <p className="text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium">
                              {selectedChemical.suppliers.filter(s => s !== "Evidence Not Available — Requires Manual Verification").join(", ")}
                            </p>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Evidence Not Available — Requires Manual Verification
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block mb-0.5">Country of Origin</span>
                          {selectedChemical.countryOfOrigin && selectedChemical.countryOfOrigin !== "Evidence Not Available — Requires Manual Verification" ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-medium">
                              {selectedChemical.countryOfOrigin}
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600" /> Evidence Not Available — Requires Manual Verification
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic & Intellectual Property Card */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3.5 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <Info size={14} className="text-blue-700" /> Intellectual Property, Patents & Publications
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Patent References</span>
                        {selectedChemical.patentReferences && selectedChemical.patentReferences !== "Evidence Not Available — Requires Manual Verification" ? (
                          <p className="text-gray-800 bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100 font-mono">
                            {selectedChemical.patentReferences}
                          </p>
                        ) : (
                          <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            <span>Evidence Not Available — Requires Manual Verification</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Peer-Reviewed Research Papers</span>
                        {selectedChemical.researchPapers && selectedChemical.researchPapers !== "Evidence Not Available — Requires Manual Verification" ? (
                          <p className="text-gray-800 bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100 font-mono">
                            {selectedChemical.researchPapers}
                          </p>
                        ) : (
                          <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            <span>Evidence Not Available — Requires Manual Verification</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SDS / TDS Summary Card */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3.5 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <Info size={14} className="text-purple-700" /> SDS & TDS Technical Sheets
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Safety Data Sheet (SDS) Summary</span>
                        {selectedChemical.sdsSummary && selectedChemical.sdsSummary !== "Evidence Not Available — Requires Manual Verification" ? (
                          <p className="text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            {selectedChemical.sdsSummary}
                          </p>
                        ) : selectedChemical.safety.msdsSummary ? (
                          <p className="text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            {selectedChemical.safety.msdsSummary}
                          </p>
                        ) : (
                          <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            <span>Evidence Not Available — Requires Manual Verification</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Technical Data Sheet (TDS) Summary</span>
                        {selectedChemical.tdsSummary && selectedChemical.tdsSummary !== "Evidence Not Available — Requires Manual Verification" ? (
                          <p className="text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            {selectedChemical.tdsSummary}
                          </p>
                        ) : (
                          <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            <span>Evidence Not Available — Requires Manual Verification</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "compatibility" && (
                <div className="space-y-4 animate-fade-in" id="compatibility-panel">
                  <div className="bg-[#f3f4f6] p-4 rounded-xl border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Interactive Chemical Compatibility Tester
                    </h4>
                    <p className="text-xs text-gray-500">
                      Select another raw material from the laboratory stock to predict ionic compatibility, viscosity effects, and thermal stability when blended with **{selectedChemical.commonName}**.
                    </p>

                    <div className="flex gap-2">
                      <select
                        value={comparePartnerId}
                        onChange={(e) => setComparePartnerId(e.target.value)}
                        className="flex-1 text-xs bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      >
                        <option value="">-- Choose Partner Chemical --</option>
                        {chemicalsList.filter(c => c.id !== selectedChemical.id).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.commonName} ({c.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {currentCompResult && partnerChemical && (
                    <div className={`p-4 rounded-xl border animate-fade-in ${
                      currentCompResult.status === "Compatible"
                        ? "bg-emerald-50 border-emerald-200"
                        : currentCompResult.status === "Partially Compatible"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-3 h-3 rounded-full ${
                          currentCompResult.status === "Compatible"
                            ? "bg-[#22c55e]"
                            : currentCompResult.status === "Partially Compatible"
                            ? "bg-[#f59e0b]"
                            : "bg-red-500"
                        }`}></span>
                        <h5 className={`text-xs font-bold ${
                          currentCompResult.status === "Compatible"
                            ? "text-emerald-800"
                            : currentCompResult.status === "Partially Compatible"
                            ? "text-amber-800"
                            : "text-red-800"
                        }`}>
                          Result: {currentCompResult.status}
                        </h5>
                      </div>

                      <div className="text-xs text-gray-700 space-y-2">
                        <div>
                          <span className="font-bold block">Scientific Chemical Reason:</span>
                          <p className="mt-0.5">{currentCompResult.reason}</p>
                        </div>
                        <div className="border-t pt-2 mt-2 border-dashed">
                          <span className="font-bold block text-gray-800">Recommended Industrial Mixing Procedure:</span>
                          <p className="mt-0.5 italic">{currentCompResult.recommendedMixingMethod}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CHEMICAL MODAL OVERLAY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4 shrink-0">
              <h3 className="text-sm font-bold text-[#0f766e] flex items-center gap-1.5 uppercase tracking-wider">
                🧪 Add Custom Chemical Ingredient
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleAddChemicalSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Common Name */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Common Name / IUPAC Short <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lauryl Alcohol Ethoxylate (9 Mole)"
                    value={newChemCommonName}
                    onChange={(e) => setNewChemCommonName(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>

                {/* Chemical Name */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Chemical Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Polyethylene glycol dodecyl ether"
                    value={newChemChemicalName}
                    onChange={(e) => setNewChemChemicalName(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Ingredient Category <span className="text-red-500">*</span></label>
                  <select
                    value={newChemCategory}
                    onChange={(e) => setNewChemCategory(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  >
                    <option value="Anionic Surfactants">Anionic Surfactants</option>
                    <option value="Nonionic Surfactants">Nonionic Surfactants</option>
                    <option value="Amphoteric Surfactants">Amphoteric Surfactants</option>
                    <option value="Cationic Surfactants">Cationic Surfactants</option>
                    <option value="Hydrotropes & Coupling Agents">Hydrotropes & Coupling Agents</option>
                    <option value="Builders">Builders</option>
                    <option value="Chelating Agents">Chelating Agents</option>
                    <option value="Polymers & Thickeners">Polymers & Thickeners</option>
                    <option value="Enzymes">Enzymes</option>
                    <option value="Solvents">Solvents</option>
                    <option value="Preservatives">Preservatives</option>
                    <option value="Acids">Acids</option>
                    <option value="Alkalis">Alkalis</option>
                    <option value="Bleaching Agents">Bleaching Agents</option>
                    <option value="Additives">Additives</option>
                    <option value="Antiseptics & Disinfectants">Antiseptics & Disinfectants</option>
                    <option value="Others (Industrial & Natural)">Others (Industrial & Natural)</option>
                  </select>
                </div>

                {/* CAS Number */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">CAS Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9002-92-0"
                    value={newChemCas}
                    onChange={(e) => setNewChemCas(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>

                {/* INCI Name */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">INCI Name (Cosmetic/Label ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. Laureth-9"
                    value={newChemInci}
                    onChange={(e) => setNewChemInci(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>

                {/* Active Matter Concentration */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Active Matter Concentration</label>
                  <input
                    type="text"
                    placeholder="e.g. 90% or 100%"
                    value={newChemActiveMatter}
                    onChange={(e) => setNewChemActiveMatter(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>

                {/* Typical pH */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Typical pH (1% Aqueous Soln)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5.5 - 7.5"
                    value={newChemPH}
                    onChange={(e) => setNewChemPH(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>

                {/* Appearance */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Appearance & Physical State</label>
                  <input
                    type="text"
                    placeholder="e.g. Clear viscous liquid or White waxy solid"
                    value={newChemAppearance}
                    onChange={(e) => setNewChemAppearance(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                  />
                </div>
              </div>

              {/* R&D Usage Description */}
              <div className="space-y-1 col-span-2">
                <label className="block font-semibold text-gray-700">Why is it used? (Primary R&D Function)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Nonionic surfactant providing exceptional soil release, grease emulsification, and wetting on polyester fabric."
                  value={newChemWhyUsed}
                  onChange={(e) => setNewChemWhyUsed(e.target.value)}
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                />
              </div>

              {/* Detailed scientific explanation */}
              <div className="space-y-1 col-span-2">
                <label className="block font-semibold text-gray-700">Description & Chemistry (What is it?)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Synthesized by the reaction of lauryl alcohol with ethylene oxide. Consists of a hydrophilic polyethylene oxide head and hydrophobic dodecyl tail."
                  value={newChemWhatIsIt}
                  onChange={(e) => setNewChemWhatIsIt(e.target.value)}
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-semibold transition-all shadow-sm"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple custom component icon placeholder
function PlusSquareIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-square">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

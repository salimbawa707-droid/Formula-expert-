import React, { useState } from "react";
import { FORMULAS } from "../data/formulas";
import { Formulation, FormulationIngredient, ActiveFormulaState } from "../types";
import { Search, Sliders, Play, CheckCircle2, RotateCcw, AlertTriangle, Printer, Layers, Info, ArrowLeftRight, Leaf, Star, Sparkles, TrendingDown, Scale, Check, Trash2, ArrowUpRight, X } from "lucide-react";
import { calculateFormulationEcoMetrics, getIngredientEcoMetrics } from "../utils/calculators";
import { getUniversalIngredientByName } from "../data/universalIngredientLibrary";

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  selectedFormulaId?: string | null;
  onSelectFormula?: (id: string | null) => void;
  onSelectActiveFormula?: (formula: ActiveFormulaState) => void;
  activeFormula?: ActiveFormulaState | null;
}

export default function FormulationLibrary({ lang, translations, selectedFormulaId, onSelectFormula, onSelectActiveFormula, activeFormula }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");

  // Unsaved Draft Protection State
  const [showUnsavedDraftModal, setShowUnsavedDraftModal] = useState<boolean>(false);
  const [pendingFormulaToLoad, setPendingFormulaToLoad] = useState<Formulation | null>(null);

  const [formulasList, setFormulasList] = useState<Formulation[]>(() => {
    const saved = localStorage.getItem("detergent_rd_saved_formulas_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Set default in localStorage
    localStorage.setItem("detergent_rd_saved_formulas_v2", JSON.stringify(FORMULAS));
    return [...FORMULAS];
  });

  const [selectedFormula, setSelectedFormula] = useState<Formulation>(() => {
    const saved = localStorage.getItem("detergent_rd_saved_formulas_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return FORMULAS[0];
  });

  // Load and sync latest saved formulations from localStorage whenever the tab is active or mounted
  React.useEffect(() => {
    const saved = localStorage.getItem("detergent_rd_saved_formulas_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFormulasList(parsed);
          
          // Keep the current selection if valid, or select first available
          setSelectedFormula(current => {
            const found = parsed.find(f => f.id === (selectedFormulaId || current?.id));
            return found || parsed[0];
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedFormulaId]);

  // Ensure selected formula gets synchronized when selectedFormulaId changes (e.g. from AI Formulator)
  React.useEffect(() => {
    if (selectedFormulaId) {
      const found = formulasList.find(f => f.id === selectedFormulaId);
      if (found) {
        setSelectedFormula(found);
        setSelectedType("All");
        setSelectedGrade("All");
        setSearchQuery("");
        onSelectFormula?.(null);
        if (onSelectActiveFormula) {
          onSelectActiveFormula({
            name: found.name,
            ingredients: found.ingredients || [],
            productType: found.productType,
            grade: found.grade,
            targetCost: found.targetCost,
            isDraft: false,
            status: "Saved"
          });
        }
      }
    }
  }, [selectedFormulaId, onSelectFormula, formulasList, onSelectActiveFormula]);

  const executeLoadFormula = (f: Formulation) => {
    setSelectedFormula(f);
    resetProduction();
    if (onSelectActiveFormula) {
      onSelectActiveFormula({
        name: f.name,
        ingredients: f.ingredients || [],
        productType: f.productType,
        grade: f.grade,
        targetCost: f.targetCost,
        isDraft: false,
        status: "Saved"
      });
    }
  };

  const handleFormulaSelectAttempt = (f: Formulation) => {
    if (selectedFormula?.id === f.id && activeFormula?.name === f.name && (!activeFormula?.isDraft || activeFormula?.status === "Saved")) {
      executeLoadFormula(f);
      return;
    }
    const isDraft = activeFormula && (activeFormula.isDraft === true || activeFormula.status === "Draft");
    if (isDraft) {
      setPendingFormulaToLoad(f);
      setShowUnsavedDraftModal(true);
    } else {
      executeLoadFormula(f);
    }
  };

  // Batch Scaling State
  const [batchSize, setBatchSize] = useState<number>(100); // default 100 kg batch
  
  // Custom Raw Material Costs (for user override simulation)
  const [customCosts, setCustomCosts] = useState<{ [key: string]: number }>({});

  // Production Guide Checklist State
  const [productionMode, setProductionMode] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Compare Formulas State
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareAId, setCompareAId] = useState<string>(formulasList[0]?.id || FORMULAS[0]?.id || "");
  const [compareBId, setCompareBId] = useState<string>(formulasList[1]?.id || formulasList[0]?.id || FORMULAS[0]?.id || "");

  React.useEffect(() => {
    if (compareIds.length > 0) {
      setCompareAId(compareIds[0]);
    }
    if (compareIds.length > 1) {
      setCompareBId(compareIds[1]);
    }
  }, [compareIds]);

  // Custom Confirmation Modal States & Toast State
  const [deletingFormula, setDeletingFormula] = useState<{ id: string; name: string } | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const confirmDeleteFormula = () => {
    if (!deletingFormula) return;
    const { id, name } = deletingFormula;
    const isHindi = lang === "hi";
    const isMarathi = lang === "mr";
    
    const updatedList = formulasList.filter(f => f.id !== id);
    setFormulasList(updatedList);
    localStorage.setItem("detergent_rd_saved_formulas_v2", JSON.stringify(updatedList));
    
    // If the currently selected formula was deleted, select the first available one
    if (selectedFormula && selectedFormula.id === id) {
      if (updatedList.length > 0) {
        setSelectedFormula(updatedList[0]);
      } else {
        setSelectedFormula(null as any);
      }
    }
    
    // Also remove from compare list if it was there
    setCompareIds(prev => prev.filter(cid => cid !== id));
    
    const successMessage = isHindi
      ? `फॉर्मूला "${name}" सफलतापूर्वक हटा दिया गया है!`
      : isMarathi
      ? `फॉर्म्युला "${name}" यशस्वीरित्या हटवला गेला आहे!`
      : `Formulation "${name}" successfully deleted!`;
      
    showToast(successMessage);
    setDeletingFormula(null);
  };

  const confirmRestoreDefaults = () => {
    const isHindi = lang === "hi";
    const isMarathi = lang === "mr";
    
    const saved = localStorage.getItem("detergent_rd_saved_formulas_v2");
    let currentList: Formulation[] = [];
    if (saved) {
      try {
        currentList = JSON.parse(saved);
      } catch (e) {}
    }
    
    const standardIds = FORMULAS.map(f => f.id);
    const customOnly = currentList.filter(f => !standardIds.includes(f.id));
    
    const restoredList = [...FORMULAS, ...customOnly];
    setFormulasList(restoredList);
    localStorage.setItem("detergent_rd_saved_formulas_v2", JSON.stringify(restoredList));
    
    if (restoredList.length > 0) {
      setSelectedFormula(restoredList[0]);
    }
    
    const successMsg = isHindi 
      ? "डिफ़ॉल्ट फ़ार्मुलों को सफलतापूर्वक पुनर्स्थापित किया गया!" 
      : isMarathi 
      ? "डिफॉल्ट फॉर्म्युला यशस्वीरित्या रिस्टोर केले गेले!" 
      : "Default formulations successfully restored!";
      
    showToast(successMsg);
    setShowRestoreConfirm(false);
  };

  // Filters
  const productTypes = ["All", "Laundry Liquid", "Laundry Powder", "Dishwash Liquid", "Toilet Cleaner", "Floor Cleaner"];
  const grades = ["All", "Economy", "Standard", "Premium"];

  const filteredFormulas = formulasList.filter((f) => {
    const matchesType = selectedType === "All" || f.productType === selectedType;
    const matchesGrade = selectedGrade === "All" || f.grade === selectedGrade;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.productType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesGrade && matchesSearch;
  });

  const handleCostChange = (ingName: string, value: number) => {
    setCustomCosts({ ...customCosts, [ingName]: value });
  };

  const getIngredientCost = (ing: FormulationIngredient) => {
    if (customCosts[ing.name] !== undefined) return customCosts[ing.name];
    if (ing.costPerKg && ing.costPerKg > 0) return ing.costPerKg;
    const match = getUniversalIngredientByName(ing.name);
    return match?.costPerKg || ing.costPerKg || 0;
  };

  // Calculate scaled weight & cost
  const calculatedIngredients = selectedFormula?.ingredients?.map((ing) => {
    const costPerKg = getIngredientCost(ing);
    const weight = (ing.percentage / 100) * batchSize;
    const itemCost = weight * costPerKg;
    return {
      ...ing,
      costPerKg,
      weight,
      itemCost
    };
  }) || [];

  const totalBatchCost = calculatedIngredients.reduce((sum, ing) => sum + ing.itemCost, 0);
  const formulaCostPerKg = calculatedIngredients.reduce((sum, ing) => sum + (ing.percentage / 100) * ing.costPerKg, 0);

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((cid) => cid !== id));
    } else {
      if (compareIds.length >= 2) {
        alert("You can compare up to 2 formulations.");
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const comparedFormulas = formulasList.filter(f => compareIds.includes(f.id));

  const swapFormulas = () => {
    const temp = compareAId;
    setCompareAId(compareBId);
    setCompareBId(temp);
  };

  // Production Step Controls
  const startProduction = () => {
    setProductionMode(true);
    setCurrentStepIdx(0);
    setCompletedSteps([]);
  };

  const completeStep = (idx: number) => {
    if (completedSteps.includes(idx)) {
      setCompletedSteps(completedSteps.filter(s => s !== idx));
    } else {
      setCompletedSteps([...completedSteps, idx]);
    }
  };

  const resetProduction = () => {
    setProductionMode(false);
    setCurrentStepIdx(0);
    setCompletedSteps([]);
  };

  if (formulasList.length === 0 || !selectedFormula) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f9fafb] h-full" id="empty-library-fallback">
        <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm max-w-sm space-y-4">
          <span className="p-3 bg-red-50 text-red-600 rounded-full inline-block">
            <Trash2 size={24} />
          </span>
          <h3 className="text-sm font-bold text-gray-900">Formulation Library is Empty</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            {lang === "hi"
              ? "आपने अपनी लाइब्रेरी से सभी फॉर्मूले हटा दिए हैं। मानक फैक्ट्री फ़ार्मुलों को पुनर्स्थापित करने के लिए नीचे दिए गए बटन पर क्लिक करें।"
              : lang === "mr"
              ? "तुम्ही तुमच्या लायब्ररीमधून सर्व फॉर्म्युले हटवले आहेत. मानक फॅक्टरी फॉर्म्युला पुनर्संचयित करण्यासाठी खालील बटणावर क्लिक करा."
              : "You have deleted all formulations from your library. Click the button below to restore the verified standard factory recipes."}
          </p>
          <button
            onClick={() => setShowRestoreConfirm(true)}
            className="w-full bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            {lang === "hi" ? "डिफ़ॉल्ट पुनर्स्थापित करें" : lang === "mr" ? "डिफॉल्ट पुनर्संचयित करा" : "Restore Default Formulas"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" id="formulation-library-root">
      {/* Title block */}
      <div className="p-4 border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#0f766e] flex items-center gap-2">
            ⚗️ {translations[lang].formulaLib}
          </h2>
          <p className="text-xs text-gray-500">
            {translations[lang].formulaLibDesc || "Verified standard manufacturing recipes & batch scaling"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRestoreConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5 transition-all"
            title="Reset to Default Formulas"
          >
            <RotateCcw size={14} />
            {lang === "hi" ? "डिफ़ॉल्ट पुनर्स्थापित करें" : lang === "mr" ? "डिफॉल्ट पुनर्संचयित करा" : "Restore Defaults"}
          </button>
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isComparing ? "bg-[#0f766e] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Layers size={14} />
            {isComparing ? "Back to Library" : `Compare Formulas (${compareIds.length})`}
          </button>
        </div>
      </div>

      {isComparing ? (() => {
        const formulaA = formulasList.find(f => f.id === compareAId) || formulasList[0] || FORMULAS[0];
        const formulaB = formulasList.find(f => f.id === compareBId) || formulasList[1] || formulasList[0] || FORMULAS[0];
        
        const ecoA = calculateFormulationEcoMetrics(formulaA.ingredients);
        const ecoB = calculateFormulationEcoMetrics(formulaB.ingredients);

        const costA = formulaA.ingredients.reduce((sum, ing) => sum + (ing.percentage / 100) * (customCosts[ing.name] !== undefined ? customCosts[ing.name] : ing.costPerKg), 0);
        const costB = formulaB.ingredients.reduce((sum, ing) => sum + (ing.percentage / 100) * (customCosts[ing.name] !== undefined ? customCosts[ing.name] : ing.costPerKg), 0);
        return (
          /* FORMULATION COMPARISON MODULE */
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#f9fafb]" id="formula-comparison-module">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Header / Intro */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-teal-50 rounded-lg text-[#0f766e]">
                    <ArrowLeftRight size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Side-by-Side Formulation Analyzer</h3>
                    <p className="text-[11px] text-gray-500">
                      Directly compare stoichiometric configurations, surfactant potency, and manufacturing costs.
                    </p>
                  </div>
                </div>

                {/* Selector Bar */}
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 pt-3 border-t border-gray-100">
                  {/* Formula A Selector */}
                  <div className="md:col-span-5 flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Formula A (Left Pane)</label>
                    <select
                      value={compareAId}
                      onChange={(e) => setCompareAId(e.target.value)}
                      className="w-full text-xs font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] transition-all"
                    >
                      {formulasList.map((f) => (
                        <option key={f.id} value={f.id}>
                          [{f.grade}] {f.name} (AM: {f.activeMatter}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Swap Control */}
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={swapFormulas}
                      title="Swap Formulas"
                      className="p-2.5 rounded-full bg-teal-50 text-[#0f766e] hover:bg-teal-100 transition-all border border-teal-100 shadow-xs"
                    >
                      <ArrowLeftRight size={15} />
                    </button>
                  </div>

                  {/* Formula B Selector */}
                  <div className="md:col-span-5 flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Formula B (Right Pane)</label>
                    <select
                      value={compareBId}
                      onChange={(e) => setCompareBId(e.target.value)}
                      className="w-full text-xs font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] transition-all"
                    >
                      {formulasList.map((f) => (
                        <option key={f.id} value={f.id}>
                          [{f.grade}] {f.name} (AM: {f.activeMatter}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Recommendation Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                  <span className="text-gray-400 font-bold uppercase">Quick Presets:</span>
                  <button
                    onClick={() => {
                      setCompareAId("laundry-liquid-premium");
                      setCompareBId("dishwash-liquid-standard");
                    }}
                    className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-semibold"
                  >
                    Premium Laundry vs Standard Dishwash
                  </button>
                  <button
                    onClick={() => {
                      setCompareAId("floor-cleaner-eco");
                      setCompareBId("toilet-cleaner-acidic");
                    }}
                    className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-semibold"
                  >
                    Eco Floor vs Acidic Toilet
                  </button>
                  <button
                    onClick={() => {
                      setCompareAId("laundry-powder-standard");
                      setCompareBId("laundry-liquid-premium");
                    }}
                    className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-semibold"
                  >
                    Laundry Powder vs Premium Liquid
                  </button>
                </div>
              </div>

              {/* Side-by-Side Panel Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formula A Details */}
                <div className="bg-white rounded-2xl border-2 border-teal-600/10 p-5 shadow-xs space-y-5" id="compare-pane-a">
                  <div className="border-b pb-3 flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-teal-800 uppercase bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                        Formula A • {formulaA.grade}
                      </span>
                      <h4 className="text-md font-extrabold text-gray-900 mt-1.5">{formulaA.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formulaA.productType}</p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 font-bold">Slot A</span>
                  </div>

                  {/* Key Visual Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* AM */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 p-2.5 rounded-xl border border-teal-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-teal-800 uppercase tracking-wider">Active Matter</span>
                      <span className="text-lg font-mono font-black text-teal-950 mt-1">{formulaA.activeMatter}%</span>
                      <div className="w-full bg-teal-200/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#0f766e] h-full rounded-full" style={{ width: `${Math.min(100, (formulaA.activeMatter/25)*100)}%` }}></div>
                      </div>
                      {formulaA.activeMatter > formulaB.activeMatter && (
                        <span className="absolute top-1 right-1 text-[10px] animate-bounce">🏆</span>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-2.5 rounded-xl border border-amber-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-amber-800 uppercase tracking-wider">Estimated Cost</span>
                      <span className="text-lg font-mono font-black text-amber-950 mt-1">₹{costA.toFixed(2)}</span>
                      <span className="text-[8px] text-gray-400 block mt-1">Per kg formulated</span>
                      {costA < costB && (
                        <span className="absolute top-1 right-1 text-[10px]" title="More Cost Effective">💰</span>
                      )}
                    </div>

                    {/* Biodegradability */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 p-2.5 rounded-xl border border-emerald-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider">Biodegradability</span>
                      <span className="text-lg font-mono font-black text-emerald-950 mt-1">{ecoA.biodegradabilityPct.toFixed(1)}%</span>
                      <div className="w-full bg-emerald-200/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${ecoA.biodegradabilityPct}%` }}></div>
                      </div>
                      {ecoA.biodegradabilityPct > ecoB.biodegradabilityPct && (
                        <span className="absolute top-1 right-1 text-[10px]" title="High Biodegradability">🌱</span>
                      )}
                    </div>

                    {/* Plant-Derived */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-2.5 rounded-xl border border-indigo-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-indigo-800 uppercase tracking-wider">Plant-Based</span>
                      <span className="text-lg font-mono font-black text-indigo-950 mt-1">{ecoA.plantBasedPct.toFixed(1)}%</span>
                      <div className="w-full bg-indigo-200/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${ecoA.plantBasedPct}%` }}></div>
                      </div>
                      {ecoA.plantBasedPct > ecoB.plantBasedPct && (
                        <span className="absolute top-1 right-1 text-[10px]" title="High Plant-Based fraction">🌿</span>
                      )}
                    </div>
                  </div>

                  {/* High Contrast Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formulaA.activeMatter > formulaB.activeMatter && (
                      <span className="text-[8px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles size={10} /> Higher Active Surfactants (+{(formulaA.activeMatter - formulaB.activeMatter).toFixed(1)}%)
                      </span>
                    )}
                    {costA < costB && (
                      <span className="text-[8px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <TrendingDown size={10} /> More Cost Effective (-₹{(costB - costA).toFixed(1)}/kg)
                      </span>
                    )}
                    {ecoA.biodegradabilityPct > ecoB.biodegradabilityPct && (
                      <span className="text-[8px] font-bold text-green-900 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Leaf size={10} /> Superior Biodegradability (+{(ecoA.biodegradabilityPct - ecoB.biodegradabilityPct).toFixed(1)}%)
                      </span>
                    )}
                    {ecoA.plantBasedPct > ecoB.plantBasedPct && (
                      <span className="text-[8px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles size={10} /> Sourced From Plants (+{(ecoA.plantBasedPct - ecoB.plantBasedPct).toFixed(1)}%)
                      </span>
                    )}
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Technical Specifications</h5>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 text-xs space-y-2.5">
                      <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold">Stoichiometric pH</span>
                        <span className="font-mono font-bold text-gray-800">{formulaA.properties.pH}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold">Standard Viscosity</span>
                        <span className="font-mono font-bold text-gray-800">{formulaA.properties.viscosity}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold shrink-0">Foaming Height</span>
                        <span className="font-semibold text-gray-800 text-right max-w-[160px] leading-tight">{formulaA.properties.foamHeight}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold">Cleaning Efficiency</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-gray-800">{formulaA.properties.cleaningRating}/100</span>
                          <div className="w-12 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${formulaA.properties.cleaningRating}%` }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-0.5">
                        <span className="text-gray-400 font-bold">Quality Compliance</span>
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                          {formulaA.properties.compatibilityScore}% Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients side-by-side list */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stoichiometric Composition</h5>
                    <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                      {formulaA.ingredients.map((ing, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 hover:bg-gray-50/50">
                          <div>
                            <p className="font-bold text-gray-800">{ing.name}</p>
                            <p className="text-[9px] text-gray-400">{ing.role}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-[#0f766e]">{ing.percentage}%</span>
                            {ing.activeMatterPct > 0 && (
                              <span className="text-[8px] text-gray-400 block">AM: {ing.activeMatterPct}%</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Troubleshooting & Safety notes */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manufacturing Safety & Risks</h5>
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 text-xs space-y-1.5 text-red-950">
                      <p className="font-bold text-red-900 flex items-center gap-1">⚠️ Critical Pitfalls</p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                        {formulaA.commonMistakes.slice(0, 2).map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Formula B Details */}
                <div className="bg-white rounded-2xl border-2 border-teal-600/10 p-5 shadow-xs space-y-5" id="compare-pane-b">
                  <div className="border-b pb-3 flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-teal-800 uppercase bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                        Formula B • {formulaB.grade}
                      </span>
                      <h4 className="text-md font-extrabold text-gray-900 mt-1.5">{formulaB.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formulaB.productType}</p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 font-bold">Slot B</span>
                  </div>

                  {/* Key Visual Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* AM */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 p-2.5 rounded-xl border border-teal-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-teal-800 uppercase tracking-wider">Active Matter</span>
                      <span className="text-lg font-mono font-black text-teal-950 mt-1">{formulaB.activeMatter}%</span>
                      <div className="w-full bg-teal-200/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#0f766e] h-full rounded-full" style={{ width: `${Math.min(100, (formulaB.activeMatter/25)*100)}%` }}></div>
                      </div>
                      {formulaB.activeMatter > formulaA.activeMatter && (
                        <span className="absolute top-1 right-1 text-[10px] animate-bounce">🏆</span>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-2.5 rounded-xl border border-amber-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-amber-800 uppercase tracking-wider">Estimated Cost</span>
                      <span className="text-lg font-mono font-black text-amber-950 mt-1">₹{costB.toFixed(2)}</span>
                      <span className="text-[8px] text-gray-400 block mt-1">Per kg formulated</span>
                      {costB < costA && (
                        <span className="absolute top-1 right-1 text-[10px]" title="More Cost Effective">💰</span>
                      )}
                    </div>

                    {/* Biodegradability */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 p-2.5 rounded-xl border border-emerald-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider">Biodegradability</span>
                      <span className="text-lg font-mono font-black text-emerald-950 mt-1">{ecoB.biodegradabilityPct.toFixed(1)}%</span>
                      <div className="w-full bg-emerald-200/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${ecoB.biodegradabilityPct}%` }}></div>
                      </div>
                      {ecoB.biodegradabilityPct > ecoA.biodegradabilityPct && (
                        <span className="absolute top-1 right-1 text-[10px]" title="High Biodegradability">🌱</span>
                      )}
                    </div>

                    {/* Plant-Derived */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-2.5 rounded-xl border border-indigo-100/60 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                      <span className="text-[8px] font-black text-indigo-800 uppercase tracking-wider">Plant-Based</span>
                      <span className="text-lg font-mono font-black text-indigo-950 mt-1">{ecoB.plantBasedPct.toFixed(1)}%</span>
                      <div className="w-full bg-indigo-200/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${ecoB.plantBasedPct}%` }}></div>
                      </div>
                      {ecoB.plantBasedPct > ecoA.plantBasedPct && (
                        <span className="absolute top-1 right-1 text-[10px]" title="High Plant-Based fraction">🌿</span>
                      )}
                    </div>
                  </div>

                  {/* High Contrast Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formulaB.activeMatter > formulaA.activeMatter && (
                      <span className="text-[8px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles size={10} /> Higher Active Surfactants (+{(formulaB.activeMatter - formulaA.activeMatter).toFixed(1)}%)
                      </span>
                    )}
                    {costB < costA && (
                      <span className="text-[8px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <TrendingDown size={10} /> More Cost Effective (-₹{(costA - costB).toFixed(1)}/kg)
                      </span>
                    )}
                    {ecoB.biodegradabilityPct > ecoA.biodegradabilityPct && (
                      <span className="text-[8px] font-bold text-green-900 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Leaf size={10} /> Superior Biodegradability (+{(ecoB.biodegradabilityPct - ecoA.biodegradabilityPct).toFixed(1)}%)
                      </span>
                    )}
                    {ecoB.plantBasedPct > ecoA.plantBasedPct && (
                      <span className="text-[8px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles size={10} /> Sourced From Plants (+{(ecoB.plantBasedPct - ecoA.plantBasedPct).toFixed(1)}%)
                      </span>
                    )}
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Technical Specifications</h5>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 text-xs space-y-2.5">
                      <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold">Stoichiometric pH</span>
                        <span className="font-mono font-bold text-gray-800">{formulaB.properties.pH}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold">Standard Viscosity</span>
                        <span className="font-mono font-bold text-gray-800">{formulaB.properties.viscosity}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold shrink-0">Foaming Height</span>
                        <span className="font-semibold text-gray-800 text-right max-w-[160px] leading-tight">{formulaB.properties.foamHeight}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                        <span className="text-gray-400 font-bold">Cleaning Efficiency</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-gray-800">{formulaB.properties.cleaningRating}/100</span>
                          <div className="w-12 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${formulaB.properties.cleaningRating}%` }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-0.5">
                        <span className="text-gray-400 font-bold">Quality Compliance</span>
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                          {formulaB.properties.compatibilityScore}% Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients side-by-side list */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stoichiometric Composition</h5>
                    <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                      {formulaB.ingredients.map((ing, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 hover:bg-gray-50/50">
                          <div>
                            <p className="font-bold text-gray-800">{ing.name}</p>
                            <p className="text-[9px] text-gray-400">{ing.role}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-[#0f766e]">{ing.percentage}%</span>
                            {ing.activeMatterPct > 0 && (
                              <span className="text-[8px] text-gray-400 block">AM: {ing.activeMatterPct}%</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Troubleshooting & Safety notes */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manufacturing Safety & Risks</h5>
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 text-xs space-y-1.5 text-red-950">
                      <p className="font-bold text-red-900 flex items-center gap-1">⚠️ Critical Pitfalls</p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                        {formulaB.commonMistakes.slice(0, 2).map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packaging and General Notes */}
              <div className="bg-teal-50/30 border border-teal-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-teal-950">
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1 text-teal-900">
                    <Scale size={14} /> Packaging Compatibility Analyzer
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="font-bold text-[10px] uppercase text-gray-400 block">Formula A Packaging</span>
                      <p className="text-[11px] text-gray-700 mt-0.5">{formulaA.packagingCompatibility}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[10px] uppercase text-gray-400 block">Formula B Packaging</span>
                      <p className="text-[11px] text-gray-700 mt-0.5">{formulaB.packagingCompatibility}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })() : (
        /* DUAL PANE RECIPE VIEW */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left formula index */}
          <div className="w-full md:w-72 border-r border-[#e5e7eb] flex flex-col bg-white shrink-0">
            {/* Index Filters */}
            <div className="p-3 border-b border-[#e5e7eb] space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-[#f3f4f6] text-gray-900 placeholder:text-gray-400 caret-[#0f766e] rounded-full border-none focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-xs bg-white border border-[#e5e7eb] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                >
                  {productTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === "All" ? "All Types" : t}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="text-xs bg-white border border-[#e5e7eb] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g === "All" ? "All Grades" : g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipe List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredFormulas.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleFormulaSelectAttempt(f)}
                  className={`p-3 text-left cursor-pointer transition-all ${
                    selectedFormula.id === f.id
                      ? "border-l-4 border-[#0f766e] bg-[#f0fdfa]"
                      : "hover:bg-[#f3f4f6]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-xs text-gray-900 truncate">{f.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      f.grade === "Premium" ? "bg-purple-100 text-purple-700" : f.grade === "Standard" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {f.grade}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate mt-0.5">{f.productType}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-[#0f766e] font-semibold">
                      AM: {f.activeMatter}% • ₹{f.targetCost}/kg
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(f.id);
                        }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          compareIds.includes(f.id) ? "bg-[#0f766e] text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        Compare
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFormula({ id: f.id, name: f.name });
                        }}
                        className="text-[9px] font-bold p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center justify-center cursor-pointer"
                        title="Delete Formulation"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right main Recipe details / step guide */}
          <div className="flex-1 bg-[#f9fafb] p-4 md:p-6 overflow-y-auto space-y-6">
            {productionMode ? (
              /* INDUSTRIAL BATCH STEP CHECKLIST GUIDE */
              <div className="bg-white rounded-xl border border-teal-100 p-5 shadow-sm space-y-5 animate-fade-in">
                <div className="border-b pb-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded">
                      Live Manufacturing Guide
                    </span>
                    <h3 className="text-md font-bold text-gray-900 mt-1">{selectedFormula.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">Scaling Batch Size: {batchSize} kg</p>
                  </div>
                  <button
                    onClick={resetProduction}
                    className="text-xs text-gray-500 hover:text-red-500 font-bold flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <RotateCcw size={12} /> Exit Production Mode
                  </button>
                </div>

                {/* Checklist steps */}
                <div className="space-y-4">
                  {selectedFormula.manufacturingMethod.map((step, idx) => {
                    const isCompleted = completedSteps.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? "bg-gray-50/50 border-gray-200 opacity-60"
                            : "bg-white border-teal-100 hover:border-[#0f766e]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => completeStep(idx)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-all ${
                              isCompleted
                                ? "bg-emerald-500 text-white"
                                : "border-2 border-[#0f766e] text-[#0f766e] hover:bg-teal-50"
                            }`}
                          >
                            {isCompleted ? "✓" : step.order}
                          </button>

                          <div className="flex-1 space-y-1.5">
                            <p className={`text-xs leading-relaxed ${isCompleted ? "line-through text-gray-400 font-normal" : "text-gray-800 font-semibold"}`}>
                              {step.action}
                            </p>
                            
                            {/* Scaled chemical weights helper for current step */}
                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-mono font-bold">
                              <span>⏱️ Mixing Time: {step.mixingTime}</span>
                              <span>🌀 Speed: {step.mixingSpeed}</span>
                              <span>🌡️ Temperature: {step.temperature}</span>
                              {step.safetyNote && (
                                <span className="text-red-500 uppercase font-semibold">⚠️ Alert: {step.safetyNote}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {completedSteps.length === selectedFormula.manufacturingMethod.length && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2 text-xs">
                    <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
                    <h5 className="font-bold text-emerald-800">Batch Completed Successfully!</h5>
                    <p className="text-gray-700 max-w-md mx-auto">
                      All addition orders have been performed, pH is balanced, and viscosity is structured. Perform final QC check now to store batch results!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* STANDARD COMPREHENSIVE RECIPE VIEWER */
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 border-b pb-3 border-gray-100">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-[#0f766e] px-2.5 py-0.5 rounded">
                      Verified Laboratory Standard Formulation
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedFormula.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{selectedFormula.productType} • Grade: {selectedFormula.grade}</p>
                  </div>

                  <button
                    onClick={startProduction}
                    className="bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Play size={12} /> Start Production Guide
                  </button>
                </div>

                {/* Batch size scale controls */}
                <div className="bg-[#f3f4f6] p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Batch Scaling Calculator
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Enter target capacity weight to automatically scale all raw material additions instantly.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value)))}
                      className="w-24 bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                    />
                    <span className="text-xs font-bold text-gray-700">kg batch</span>
                  </div>
                </div>

                {/* Recipe active parameters */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center text-xs">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Est. Cost/kg</span>
                    <span className="font-bold text-[#0f766e]">₹{formulaCostPerKg.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center text-xs">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Total Batch Cost</span>
                    <span className="font-bold text-gray-900">₹{totalBatchCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center text-xs">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Active Surfactant %</span>
                    <span className="font-bold text-gray-900">{selectedFormula.activeMatter}%</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-center text-xs">
                    <span className="text-[9px] text-emerald-800 font-extrabold block uppercase flex items-center justify-center gap-0.5">🌱 Biodeg. %</span>
                    <span className="font-black text-emerald-700">{calculateFormulationEcoMetrics(selectedFormula.ingredients).biodegradabilityPct.toFixed(1)}%</span>
                  </div>
                  <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-200 text-center text-xs">
                    <span className="text-[9px] text-teal-800 font-extrabold block uppercase flex items-center justify-center gap-0.5">🌿 Plant-Based</span>
                    <span className="font-black text-teal-700">{calculateFormulationEcoMetrics(selectedFormula.ingredients).plantBasedPct.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center text-xs">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Properties pH</span>
                    <span className="font-bold text-gray-900">{selectedFormula.properties.pH}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center text-xs">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Properties Viscosity</span>
                    <span className="font-bold text-gray-900 text-[10px] truncate block mt-0.5">{selectedFormula.properties.viscosity}</span>
                  </div>
                </div>

                {/* Scaled Ingredients Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Scaled Ingredient Additions Table
                    </h4>
                    <span className="text-[10px] text-gray-400 italic">Modify unit cost to simulate batch price fluctuations</span>
                  </div>
                  <div className="border border-[#e5e7eb] rounded-xl overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-[#f3f4f6] text-gray-700 font-bold border-b border-[#e5e7eb]">
                          <th className="p-2.5">Raw Material Name</th>
                          <th className="p-2.5 text-center">Form %</th>
                          <th className="p-2.5 text-center">Batch Weight ({batchSize}kg)</th>
                          <th className="p-2.5 text-right">Cost (₹/kg)</th>
                          <th className="p-2.5 text-right">Item Cost (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                        {calculatedIngredients.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2.5 font-semibold text-[#0f766e]">
                              {ing.name}
                            </td>
                            <td className="p-2.5 text-center font-bold font-mono">
                              {ing.percentage}%
                            </td>
                            <td className="p-2.5 text-center font-bold text-blue-600 bg-blue-50/20 font-mono">
                              {ing.weight >= 1 ? `${ing.weight.toFixed(3)} kg` : `${(ing.weight * 1000).toFixed(0)} g`}
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                value={ing.costPerKg}
                                onChange={(e) => handleCostChange(ing.name, Number(e.target.value))}
                                className="w-16 text-right bg-transparent text-gray-900 caret-[#0f766e] border-b border-transparent hover:border-gray-300 focus:border-[#0f766e] focus:outline-none font-semibold"
                              />
                            </td>
                            <td className="p-2.5 text-right font-mono">
                              ₹{ing.itemCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manufacturing Guide Overview */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Standard Order of Addition Preview
                  </h4>
                  <div className="space-y-2 text-xs">
                    {selectedFormula.manufacturingMethod.slice(0, 3).map((step, idx) => (
                      <div key={idx} className="bg-gray-50 p-2.5 rounded border border-gray-200 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          {step.order}
                        </span>
                        <p className="text-gray-700 truncate">{step.action}</p>
                      </div>
                    ))}
                    <button
                      onClick={startProduction}
                      className="text-xs font-bold text-[#0f766e] hover:underline"
                    >
                      Show all {selectedFormula.manufacturingMethod.length} detailed mixing instructions →
                    </button>
                  </div>
                </div>

                {/* Errors and Warnings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                    <h5 className="font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Critical Mistakes to Avoid
                    </h5>
                    <ul className="list-disc pl-4 text-amber-900 space-y-1">
                      {selectedFormula.commonMistakes.map((mis, idx) => (
                        <li key={idx}>{mis}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs space-y-2">
                    <h5 className="font-bold text-teal-800 flex items-center gap-1.5">
                      <Info size={14} /> Stability Troubleshooting Guide
                    </h5>
                    <ul className="list-disc pl-4 text-teal-900 space-y-1">
                      {selectedFormula.troubleshootingNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirmation Modals & Toast */}
      {deletingFormula && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-100 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
                <Trash2 size={24} />
              </span>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-gray-900">
                  {lang === "hi" ? "फॉर्मूला हटाएं?" : lang === "mr" ? "फॉर्म्युला हटवायचा?" : "Delete Formulation?"}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {lang === "hi"
                    ? `क्या आप वाकई "${deletingFormula.name}" फॉर्मूला को अपनी लाइब्रेरी से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`
                    : lang === "mr"
                    ? `तुम्ही खरोखर "${deletingFormula.name}" फॉर्म्युला तुमच्या लायब्ररीमधून हटवू इच्छिता? ही क्रिया पूर्ववत केली जाऊ शकत नाही.`
                    : `Are you sure you want to delete the formulation "${deletingFormula.name}" from your library? This action cannot be undone.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingFormula(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
              >
                {lang === "hi" ? "रद्द करें" : lang === "mr" ? "रद्द करा" : "Cancel"}
              </button>
              <button
                onClick={confirmDeleteFormula}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-red-100"
              >
                <Trash2 size={14} />
                {lang === "hi" ? "हटाएं" : lang === "mr" ? "हटवा" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-teal-100 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-3 bg-teal-50 text-teal-600 rounded-full shrink-0">
                <RotateCcw size={24} />
              </span>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-gray-900">
                  {lang === "hi" ? "डिफ़ॉल्ट फ़ार्मुलों को पुनर्स्थापित करें?" : lang === "mr" ? "डिफॉल्ट फॉर्म्युला पुनर्संचयित करायचे?" : "Restore Default Formulations?"}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {lang === "hi"
                    ? "क्या आप सभी हटाए गए और मानक फ़ार्मुलों को डिफ़ॉल्ट पर पुनर्स्थापित करना चाहते हैं? (आपके द्वारा सहेजे गए कस्टम फ़ार्मुलों को छोड़कर बाक़ी सब रीसेट हो जाएँगे)"
                    : lang === "mr"
                    ? "तुम्ही सर्व हटवलेले आणि मानक फॉर्म्युला रिस्टोर करू इच्छिता?"
                    : "Are you sure you want to restore default formulations? This will reset the library to the original verified list while keeping any unique custom saved ones."}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
              >
                {lang === "hi" ? "रद्द करें" : lang === "mr" ? "रद्द करा" : "Cancel"}
              </button>
              <button
                onClick={confirmRestoreDefaults}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0f766e] hover:bg-[#0d645c] text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-teal-100"
              >
                <RotateCcw size={14} />
                {lang === "hi" ? "डिफ़ॉल्ट पुनर्स्थापित करें" : lang === "mr" ? "डिफॉल्ट पुनर्संचयित करा" : "Restore Defaults"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 text-xs font-semibold border border-gray-800 animate-slide-up max-w-sm">
          <Check className="text-emerald-400 shrink-0" size={16} />
          <span className="flex-1">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* UNSAVED FORMULA DRAFT CONFIRMATION DIALOG */}
      {showUnsavedDraftModal && pendingFormulaToLoad && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Unsaved Formula</h3>
                <p className="text-xs text-slate-500 font-medium">Unsaved Working Draft Detected</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-2">
              <p className="font-medium leading-relaxed">
                You have unsaved changes. Loading another formula will discard the current draft.
              </p>
              {activeFormula?.name && (
                <p className="text-[11px] text-amber-800 font-mono">
                  Active Draft: <span className="font-bold">"{activeFormula.name}"</span>
                </p>
              )}
              <p className="text-[11px] text-amber-800 font-mono">
                Target Formula: <span className="font-bold">"{pendingFormulaToLoad.name}"</span>
              </p>
              <p className="font-semibold text-amber-900 pt-1">
                Do you want to continue?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedDraftModal(false);
                  setPendingFormulaToLoad(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingFormulaToLoad) {
                    executeLoadFormula(pendingFormulaToLoad);
                  }
                  setShowUnsavedDraftModal(false);
                  setPendingFormulaToLoad(null);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                Load Formula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

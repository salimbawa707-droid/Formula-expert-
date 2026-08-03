import React, { useState, useEffect } from "react";
import { getAllUniversalIngredients } from "../data/universalIngredientLibrary";
import {
  calculateNeutralization,
  calculateHLB,
  calculateActiveMatter,
  calculateDilution,
  convertUnit,
  HLBSurfactant,
  ActiveMatterIngredient,
  calculateGreenChelators,
  GreenChelatorInput,
  ChelatorDetail,
  GreenChelatorResult,
  getDefaultActiveMatter
} from "../utils/calculators";
import { Calculator, ArrowRight, ShieldAlert, Thermometer, RefreshCw, AlertCircle, HelpCircle, Info, Beaker, Sparkles } from "lucide-react";
import MathTestSuite from "./MathTestSuite";
import { ActiveFormulaState } from "../types";

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  activeFormula?: ActiveFormulaState | null;
}

export default function RCCalculators({ lang, translations, activeFormula }: Props) {
  const [activeCalcTab, setActiveCalcTab] = useState<"neutralization" | "hlb" | "active" | "dilution" | "units" | "test_suite" | "cmc" | "glda_calculator">("neutralization");
  const [importedNotification, setImportedNotification] = useState<string | null>(null);
  const [liveSync, setLiveSync] = useState<boolean>(false);

  // Standalone CMC Surfactant Options
  const STANDALONE_CMC_OPTIONS = [
    { name: "SLES (Sodium Lauryl Ether Sulfate)", cmcMolar: 0.30, cmcPpm: 114 },
    { name: "LABSA (Acid Slurry / Dodecylbenzene Sulfonate)", cmcMolar: 1.20, cmcPpm: 384 },
    { name: "CAPB (Cocamidopropyl Betaine)", cmcMolar: 0.09, cmcPpm: 31 },
    { name: "LAE-9 (Linear Alcohol Ethoxylate)", cmcMolar: 0.05, cmcPpm: 35 },
    { name: "Tween 20 (Polysorbate 20)", cmcMolar: 0.06, cmcPpm: 24 },
    { name: "Cocamide DEA", cmcMolar: 0.08, cmcPpm: 24 },
    { name: "Coco Glucoside", cmcMolar: 0.04, cmcPpm: 18 },
    { name: "AOS (Alpha Olefin Sulfonate)", cmcMolar: 0.60, cmcPpm: 182 },
  ];

  // 6. CMC State
  const [cmcList, setCmcList] = useState<any[]>([
    { name: "SLES (Sodium Lauryl Ether Sulfate)", cmcMolar: 0.30, cmcPpm: 114, ratio: 70 },
    { name: "CAPB (Cocamidopropyl Betaine)", cmcMolar: 0.09, cmcPpm: 31, ratio: 30 }
  ]);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number>(0);
  const [cmcCustomName, setCmcCustomName] = useState("");
  const [cmcCustomMolar, setCmcCustomMolar] = useState<number | string>(0.10);
  const [cmcCustomPpm, setCmcCustomPpm] = useState<number | string>(30);
  const [cmcCustomRatio, setCmcCustomRatio] = useState<number | string>(10);

  // 1. LABSA Neutralization State
  const [labsaQty, setLabsaQty] = useState<number | string>(10);
  const [labsaPurity, setLabsaPurity] = useState<90 | 96>(90);
  const [alkaliType, setAlkaliType] = useState<any>("NaOH Flakes (99%)");

  const neutResult = calculateNeutralization({
    labsaQty: typeof labsaQty === 'number' ? labsaQty : (parseFloat(String(labsaQty)) || 0),
    labsaPurity,
    alkaliType
  });

  // Standard HLB Surfactant Database
  const STANDARD_HLB_OPTIONS = [
    { name: "SLES (Sodium Lauryl Ether Sulfate)", hlb: 11.0 },
    { name: "LABSA (Acid Slurry / Dodecylbenzene Sulfonate)", hlb: 11.5 },
    { name: "CAPB (Cocamidopropyl Betaine)", hlb: 12.0 },
    { name: "APG / Coco Glucoside", hlb: 13.5 },
    { name: "Tween 80 (Polysorbate 80)", hlb: 15.0 },
    { name: "Tween 20 (Polysorbate 20)", hlb: 16.7 },
    { name: "Span 80 (Sorbitan Oleate)", hlb: 4.3 },
    { name: "Span 20 (Sorbitan Laurate)", hlb: 8.6 },
    { name: "Glyceryl Monostearate (GMS)", hlb: 3.8 },
    { name: "Cocamide DEA (CDE)", hlb: 13.5 },
    { name: "Nonylphenol Ethoxylate (NP-9)", hlb: 13.0 },
  ];

  // Standard Active Matter Surfactant Database
  const STANDARD_ACTIVE_OPTIONS = [
    { name: "LABSA (Acid Slurry 90%)", purity: 90 },
    { name: "LABSA (High Active 96%)", purity: 96 },
    { name: "SLES (70% Paste)", purity: 70 },
    { name: "SLES (28% Liquid)", purity: 28 },
    { name: "CAPB (30% Liquid)", purity: 30 },
    { name: "Cocamide DEA (100% Active)", purity: 100 },
    { name: "Coco Glucoside (50% Active)", purity: 50 },
    { name: "AOS (38% Liquid)", purity: 38 },
    { name: "LAE-9 (100% Active)", purity: 100 },
  ];

  // 2. HLB Calculator State
  const [hlbList, setHlbList] = useState<HLBSurfactant[]>([
    { name: "SLES (Sodium Lauryl Ether Sulfate)", hlb: 11.0, proportion: 8 },
    { name: "APG / Coco Glucoside", hlb: 13.5, proportion: 4 },
    { name: "Span 80 (Sorbitan Oleate)", hlb: 4.3, proportion: 2 }
  ]);
  const [selectedHlbOptionIdx, setSelectedHlbOptionIdx] = useState<number>(0);
  const [newHlbName, setNewHlbName] = useState(STANDARD_HLB_OPTIONS[0].name);
  const [newHlbVal, setNewHlbVal] = useState<number | string>(STANDARD_HLB_OPTIONS[0].hlb);
  const [newHlbProp, setNewHlbProp] = useState<number | string>(10);

  const calculatedHLB = calculateHLB(hlbList);

  const addHlbRow = () => {
    let name = newHlbName;
    let hlb = typeof newHlbVal === 'number' ? newHlbVal : parseFloat(String(newHlbVal));
    
    if (selectedHlbOptionIdx !== 999) {
      const opt = STANDARD_HLB_OPTIONS[selectedHlbOptionIdx];
      name = opt.name;
      hlb = opt.hlb;
    }
    
    if (!name.trim()) {
      name = "Custom Surfactant";
    }

    const sanitizedHlb = isNaN(hlb) ? 0 : Math.min(20, Math.max(0, hlb));
    const propNum = typeof newHlbProp === 'number' ? newHlbProp : parseFloat(String(newHlbProp));
    const sanitizedProp = isNaN(propNum) || propNum <= 0 ? 1 : propNum;

    setHlbList([...hlbList, { name, hlb: sanitizedHlb, proportion: sanitizedProp }]);
  };

  const removeHlbRow = (idx: number) => {
    setHlbList(hlbList.filter((_, i) => i !== idx));
  };

  // 3. Active Matter State
  const [activeList, setActiveList] = useState<ActiveMatterIngredient[]>([
    { name: "LABSA (Acid Slurry 90%)", percentageInFormula: 10, activeMatterPurity: 90 },
    { name: "SLES (70% Paste)", percentageInFormula: 8, activeMatterPurity: 70 },
    { name: "CAPB (30% Liquid)", percentageInFormula: 4, activeMatterPurity: 30 }
  ]);
  const [selectedActiveOptionIdx, setSelectedActiveOptionIdx] = useState<number>(0);
  const [newActiveName, setNewActiveName] = useState(STANDARD_ACTIVE_OPTIONS[0].name);
  const [newActivePercent, setNewActivePercent] = useState<number | string>(10);
  const [newActivePurity, setNewActivePurity] = useState<number | string>(STANDARD_ACTIVE_OPTIONS[0].purity);

  const totalActiveMatter = calculateActiveMatter(activeList);

  const addActiveRow = () => {
    let name = newActiveName;
    let purity = newActivePurity;

    if (selectedActiveOptionIdx !== 999) {
      const opt = STANDARD_ACTIVE_OPTIONS[selectedActiveOptionIdx];
      name = opt.name;
      purity = opt.purity;
    }

    if (!name.trim()) {
      name = "Custom Ingredient";
    }

    const percentNum = typeof newActivePercent === 'number' ? newActivePercent : parseFloat(String(newActivePercent));
    const purityNum = typeof purity === 'number' ? purity : parseFloat(String(purity));

    const sanitizedPercent = isNaN(percentNum) || percentNum <= 0 ? 1 : percentNum;
    const sanitizedPurity = isNaN(purityNum) ? 0 : Math.min(100, Math.max(0, purityNum));

    setActiveList([...activeList, { name, percentageInFormula: sanitizedPercent, activeMatterPurity: sanitizedPurity }]);
  };

  const removeActiveRow = (idx: number) => {
    setActiveList(activeList.filter((_, i) => i !== idx));
  };

  // 4. Dilution State
  const [diluteC1, setDiluteC1] = useState<number | string>(70);
  const [diluteC2, setDiluteC2] = useState<number | string>(15);
  const [diluteV2, setDiluteV2] = useState<number | string>(100);

  const c1Num = typeof diluteC1 === 'number' ? diluteC1 : (parseFloat(String(diluteC1)) || 0);
  const c2Num = typeof diluteC2 === 'number' ? diluteC2 : (parseFloat(String(diluteC2)) || 0);
  const v2Num = typeof diluteV2 === 'number' ? diluteV2 : (parseFloat(String(diluteV2)) || 0);

  const dilutionResult = calculateDilution(c1Num, c2Num, v2Num);

  // 5. Unit Converter State
  const [convVal, setConvVal] = useState<number | string>(1);
  const [convFrom, setConvFrom] = useState("kg");
  const [convTo, setConvTo] = useState("g");

  const valNum = typeof convVal === 'number' ? convVal : (parseFloat(String(convVal)) || 0);
  const convertedValue = convertUnit(valNum, convFrom, convTo);

  // 7. Green Chelator & Co-Builder Stoichiometry State
  const [waterHardnessPpm, setWaterHardnessPpm] = useState<number | string>(150);
  const [washVolumeL, setWashVolumeL] = useState<number | string>(10);
  const [washDoseGrams, setWashDoseGrams] = useState<number | string>(20);
  const [safetyMarginPct, setSafetyMarginPct] = useState<number | string>(20);
  const [coBuilderTargetPct, setCoBuilderTargetPct] = useState<number | string>(10);
  const [maxFormulationCapPct, setMaxFormulationCapPct] = useState<number | string>(3.0);

  const greenChelatorResult = calculateGreenChelators({
    waterHardnessPpm: typeof waterHardnessPpm === 'number' ? waterHardnessPpm : (parseFloat(String(waterHardnessPpm)) || 0),
    washVolumeL: typeof washVolumeL === 'number' ? washVolumeL : (parseFloat(String(washVolumeL)) || 0),
    washDoseGrams: typeof washDoseGrams === 'number' ? washDoseGrams : (parseFloat(String(washDoseGrams)) || 0),
    safetyMarginPct: typeof safetyMarginPct === 'number' ? safetyMarginPct : (parseFloat(String(safetyMarginPct)) || 0),
    coBuilderTargetPct: typeof coBuilderTargetPct === 'number' ? coBuilderTargetPct : (parseFloat(String(coBuilderTargetPct)) || 0),
    maxFormulationCapPct: typeof maxFormulationCapPct === 'number' ? maxFormulationCapPct : (parseFloat(String(maxFormulationCapPct)) || 0)
  });

  const handleLoadActiveFormulaIntoCalculators = () => {
    if (!activeFormula || !activeFormula.ingredients || activeFormula.ingredients.length === 0) return;

    // 1. Populate Active Matter List
    const newActiveList: ActiveMatterIngredient[] = activeFormula.ingredients.map((ing) => {
      const activePct = (ing as any).activeMatterPct !== undefined 
        ? Number((ing as any).activeMatterPct) 
        : getDefaultActiveMatter(ing.name);
      return {
        name: ing.name,
        percentageInFormula: Number(ing.percentage) || 0,
        activeMatterPurity: isNaN(activePct) ? 100 : activePct,
      };
    });
    if (newActiveList.length > 0) {
      setActiveList(newActiveList);
    }

    // 2. Populate HLB List (for non-water ingredients with percentage > 0)
    const newHlbList: HLBSurfactant[] = activeFormula.ingredients
      .filter(ing => (Number(ing.percentage) || 0) > 0 && !ing.name.toLowerCase().includes('water') && !ing.name.toLowerCase().includes('aqua'))
      .map((ing) => {
        const lower = ing.name.toLowerCase();
        let hlb = 11.5;
        const matchOpt = STANDARD_HLB_OPTIONS.find(opt => lower.includes(opt.name.toLowerCase().split(' ')[0]));
        if (matchOpt) {
          hlb = matchOpt.hlb;
        } else if (lower.includes('sles')) hlb = 11.0;
        else if (lower.includes('labsa')) hlb = 11.5;
        else if (lower.includes('capb')) hlb = 12.0;
        else if (lower.includes('apg') || lower.includes('glucoside')) hlb = 13.5;
        else if (lower.includes('tween 80')) hlb = 15.0;
        else if (lower.includes('span 80')) hlb = 4.3;

        return {
          name: ing.name,
          hlb,
          proportion: Number(ing.percentage) || 0,
        };
      });
    if (newHlbList.length > 0) {
      setHlbList(newHlbList);
    }

    // 3. Populate Neutralization (if LABSA / Acid Slurry present)
    const labsaIng = activeFormula.ingredients.find(ing => 
      ing.name.toLowerCase().includes('labsa') || ing.name.toLowerCase().includes('acid slurry') || ing.name.toLowerCase().includes('sulfonic')
    );
    if (labsaIng) {
      const pct = Number(labsaIng.percentage) || 0;
      const batchKg = activeFormula.batchSize && activeFormula.batchSize > 0 ? activeFormula.batchSize : 100;
      const labsaKg = (pct / 100) * batchKg;
      setLabsaQty(Number(labsaKg.toFixed(2)));
      
      const activePurity = getDefaultActiveMatter(labsaIng.name);
      if (activePurity >= 94) {
        setLabsaPurity(96);
      } else {
        setLabsaPurity(90);
      }
    }

    setImportedNotification(`Successfully loaded active formula "${activeFormula.name || 'Active Formula'}" into R&D Calculators workspace!`);
    setTimeout(() => setImportedNotification(null), 4000);
  };

  // Optional Live Sync Effect
  useEffect(() => {
    if (liveSync && activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      handleLoadActiveFormulaIntoCalculators();
    }
  }, [liveSync, activeFormula]);

  return (
    <div className="h-full flex flex-col" id="calculators-root">
      {/* Title */}
      <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#0f766e] flex items-center gap-2">
            <Calculator size={18} /> {translations[lang].calculators}
          </h2>
          <p className="text-xs text-gray-500">
            {translations[lang].calculatorsDesc || "Detergent chemistry, stoichiometry, and physical calculators"}
          </p>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="bg-[#f3f4f6] p-2 flex gap-1.5 overflow-x-auto shrink-0 border-b border-[#e5e7eb]">
        {[
          { id: "neutralization", label: "LABSA Neutralization" },
          { id: "hlb", label: "HLB Mixture" },
          { id: "active", label: "Active Matter" },
          { id: "cmc", label: "🌀 Critical Micelle (CMC)" },
          { id: "glda_calculator", label: "🌿 Green Chelator & Builder" },
          { id: "dilution", label: "Dilution Formula" },
          { id: "units", label: "Unit Converter" },
          { id: "test_suite", label: "🧮 Math Verification Suite" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCalcTab(tab.id as any)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeCalcTab === tab.id ? "bg-white text-[#0f766e] shadow-sm" : "text-gray-600 hover:text-gray-950"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Body */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#f9fafb]">
        {/* Active Formula Context Banner */}
        <div className="max-w-3xl mx-auto mb-4">
          {activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0 ? (
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Active Workspace Formula Context</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {activeFormula.name || "Untitled Formula"}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                      {activeFormula.productType || "Liquid Detergent"} ({activeFormula.grade || "Standard"})
                    </span>
                    {activeFormula.batchSize && activeFormula.batchSize > 0 && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Batch: {activeFormula.batchSize} kg
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={liveSync}
                    onChange={(e) => setLiveSync(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Live Sync Active Formula</span>
                  {liveSync && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                      LIVE
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleLoadActiveFormulaIntoCalculators}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer border border-amber-400/30 shrink-0"
                >
                  <RefreshCw size={14} />
                  Load Active Formula Into Calculators
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-slate-300 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                  <Info size={16} />
                </div>
                <div>
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider block">NO ACTIVE FORMULA SELECTED</span>
                  <span className="text-slate-400 text-[11px]">Select or generate a formula in AI Formula Expert or Formula Library to load it here into R&D Calculators.</span>
                </div>
              </div>
            </div>
          )}

          {importedNotification && (
            <div className="mt-2.5 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Sparkles size={14} />
              {importedNotification}
            </div>
          )}
        </div>
        {activeCalcTab === "test_suite" && (
          <div className="max-w-5xl mx-auto">
            <MathTestSuite />
          </div>
        )}

        {activeCalcTab !== "test_suite" && (
          <div className="max-w-3xl mx-auto bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm space-y-6">
            {activeCalcTab === "neutralization" && (
            <div className="space-y-4 animate-fade-in" id="neutralization-calculator">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900">LABSA - Acid Neutralization Calculator</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculate stoichiometric alkali required to neutralize linear alkylbenzene sulfonic acid (acid slurry).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">LABSA Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={labsaQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setLabsaQty("");
                      } else {
                        setLabsaQty(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">LABSA Active Purity</label>
                  <select
                    value={labsaPurity}
                    onChange={(e) => setLabsaPurity(Number(e.target.value) as any)}
                    className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-left sm:text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  >
                    <option value={90} className="text-gray-900 bg-white font-semibold">90% (Standard Acid Slurry)</option>
                    <option value={96} className="text-gray-900 bg-white font-semibold">96% (Premium High-Active)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Neutralizing Alkali Agent</label>
                  <select
                    value={alkaliType}
                    onChange={(e) => setAlkaliType(e.target.value as any)}
                    className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-left sm:text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  >
                    <option value="NaOH Flakes (99%)" className="text-gray-900 bg-white font-semibold">Caustic Flakes NaOH (99%)</option>
                    <option value="NaOH Lye (48%)" className="text-gray-900 bg-white font-semibold">Caustic Lye NaOH (48% Soln)</option>
                    <option value="KOH Flakes (90%)" className="text-gray-900 bg-white font-semibold">Potassium Hydroxide KOH (90%)</option>
                    <option value="TEA (99%)" className="text-gray-900 bg-white font-semibold">Triethanolamine TEA (99%)</option>
                    <option value="Soda Ash (Light)" className="text-gray-900 bg-white font-semibold">Soda Ash Light Na2CO3</option>
                  </select>
                </div>
              </div>

              {/* Chemical Neutralization Results */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-[#0f766e] uppercase tracking-wider text-[10px]">Calculated Stoichiometry</h4>
                  
                  <div>
                    <span className="text-gray-500">Alkali Required weight:</span>
                    <p className="text-lg font-bold text-[#0f766e] mt-0.5">
                      {neutResult.alkaliRequiredGrams >= 1000
                        ? `${(neutResult.alkaliRequiredGrams / 1000).toFixed(3)} kg`
                        : `${neutResult.alkaliRequiredGrams.toFixed(1)} grams`}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Stoichiometric Mixing Ratio:</span>
                    <p className="font-semibold text-gray-800 font-mono mt-0.5">
                      1 kg LABSA : {neutResult.stoichiometricRatio.toFixed(3)} kg of {alkaliType}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 border-teal-200 border-dashed">
                  <h4 className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">Reaction Thermodynamics</h4>

                  <div className="flex items-center gap-2">
                    <Thermometer className="text-red-500 shrink-0" size={16} />
                    <div>
                      <span className="text-gray-500 block">Exothermic Heat Release:</span>
                      <span className="font-bold text-gray-900 font-mono">~ {neutResult.heatGeneratedKJ.toFixed(0)} kJ</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">Water Generated by reaction:</span>
                    <span className="font-bold text-gray-900 block font-mono">
                      + {neutResult.waterGeneratedGrams.toFixed(1)} g water
                    </span>
                  </div>

                  {neutResult.recommendedWaterForDissolutionGrams > 0 && (
                    <div className="bg-white p-2.5 rounded border border-teal-100 text-[10px] text-gray-600 font-medium">
                      💡 <span className="font-bold text-gray-800">Dilution Warning:</span> Dissolve the dry flakes in approx {" "}
                      <span className="font-bold font-mono text-[#0f766e]">{neutResult.recommendedWaterForDissolutionGrams.toFixed(0)}g</span> {" "}
                      of cool DM water first to prevent localized superheating and boiling!
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs">
                <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={16} />
                <div className="text-red-950">
                  <span className="font-bold block">PPE Laboratory safety rule:</span>
                  Always add acid (LABSA) slowly into water-alkali mixture. Never add dry alkali directly to concentrated acid slurry, as rapid local hydration can trigger violent splatter of acidic lye.
                </div>
              </div>
            </div>
          )}

          {activeCalcTab === "hlb" && (
            <div className="space-y-4 animate-fade-in" id="hlb-calculator">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900">Hydrophilic-Lipophilic Balance (HLB) Calculator</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculate weighted average HLB index for surfactant mixtures. Standard values: Emulsifiers (4-6), Wetting Agents (7-9), Detergents (10-15), Solubilizers (15-18).
                </p>
              </div>

              {/* Add row */}
              <div className="flex flex-wrap items-end gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                <div className="flex-1 min-w-[180px]">
                  <label className="block font-semibold text-gray-700 mb-1">Select Surfactant Database</label>
                  <select
                    value={selectedHlbOptionIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedHlbOptionIdx(idx);
                      if (idx !== 999) {
                        const opt = STANDARD_HLB_OPTIONS[idx];
                        setNewHlbName(opt.name);
                        setNewHlbVal(opt.hlb);
                      } else {
                        setNewHlbName("");
                        setNewHlbVal(10.0);
                      }
                    }}
                    className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] font-semibold"
                  >
                    {STANDARD_HLB_OPTIONS.map((opt, oIdx) => (
                      <option key={oIdx} value={oIdx} className="text-gray-900 bg-white font-semibold">
                        {opt.name} (HLB: {opt.hlb})
                      </option>
                    ))}
                    <option value={999} className="text-gray-900 bg-white font-semibold">
                      [Custom / Manual Input]
                    </option>
                  </select>
                </div>

                <div className="w-24">
                  <label className="block font-semibold text-gray-700 mb-1">Ratio / Weight (g)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={newHlbProp}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setNewHlbProp("");
                      } else {
                        setNewHlbProp(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-2 py-1.5 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addHlbRow}
                  className="bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold px-4 py-1.5 rounded cursor-pointer transition-all"
                >
                  + Add Ingredient
                </button>
              </div>

              {selectedHlbOptionIdx === 999 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-teal-50/30 p-2.5 rounded border border-teal-100 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">Custom Surfactant Name</label>
                    <input
                      type="text"
                      value={newHlbName}
                      onChange={(e) => setNewHlbName(e.target.value)}
                      placeholder="e.g. Nonylphenol NP-9"
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">HLB Value (1-20)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="20"
                      placeholder="e.g. 10.0"
                      value={newHlbVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setNewHlbVal("");
                        } else {
                          setNewHlbVal(Number(val));
                        }
                      }}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* List */}
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Surfactants in Mixture (मिक्सचर के इंग्रीडिएंट्स)</span>
                {hlbList.length > 0 && (
                  <button
                    onClick={() => setHlbList([])}
                    className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition-all bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg text-[10px]"
                    title="Clear entire mixture list"
                  >
                    🗑️ Clear All (सब साफ करें)
                  </button>
                )}
              </div>

              <div className="border border-[#e5e7eb] rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left min-w-full">
                  <thead className="bg-gray-100 font-bold border-b text-gray-700">
                    <tr>
                      <th className="p-2 sm:p-2.5 text-left">Surfactant</th>
                      <th className="p-2 sm:p-2.5 text-center">HLB Value</th>
                      <th className="p-2 sm:p-2.5 text-center">Weight Proportion</th>
                      <th className="p-2 sm:p-2.5 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-800 font-medium">
                    {hlbList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 sm:p-8 text-center text-gray-400 italic">
                          No ingredients in this mixture. Select database or custom option above and click "+ Add Ingredient" to start.
                          <br />
                          <span className="text-[10px] text-gray-400 mt-1 block">(कोई इंग्रीडिएंट नहीं है। नया मिक्स बनाने के लिए ऊपर से जोड़ें।)</span>
                        </td>
                      </tr>
                    ) : (
                      hlbList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-2 sm:p-2.5 font-bold text-gray-700 break-words">{item.name}</td>
                          <td className="p-2 sm:p-2.5 text-center font-mono text-teal-700 font-bold whitespace-nowrap">{item.hlb.toFixed(1)}</td>
                          <td className="p-2 sm:p-2.5 text-center font-mono whitespace-nowrap">{item.proportion}g</td>
                          <td className="p-2 sm:p-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => removeHlbRow(idx)}
                              className="text-red-500 font-bold hover:text-red-700 cursor-pointer bg-red-50 hover:bg-red-100/60 px-2 py-1 rounded text-[10px] whitespace-nowrap"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Average HLB Display */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
                <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider block">Mixed Surfactant System HLB</span>
                <span className="text-3xl font-extrabold text-[#0f766e] font-mono mt-1 block">{calculatedHLB}</span>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  {calculatedHLB >= 12
                    ? "Target system is highly hydrophilic. Excellent for solubilizing grease, oils, and forming stable, rinseable oil-in-water laundry emulsions."
                    : calculatedHLB >= 8
                    ? "Target system has moderate wetting characteristics. Excellent as wet-suspension detergents, multi-surface sprayers, or agricultural wetters."
                    : "Target system is highly lipophilic. Ideal for forming water-in-oil cosmetic creams or water-repellent protective industrial coatings."}
                </p>
              </div>
            </div>
          )}

          {activeCalcTab === "active" && (
            <div className="space-y-4 animate-fade-in" id="active-matter-calculator">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900">Total Active Surfactant Matter Calculator</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculate final active substance % of the formulation by summing raw surfactant inputs multiplied by active purities.
                </p>
              </div>

              {/* Add row */}
              <div className="flex flex-wrap items-end gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                <div className="flex-1 min-w-[180px]">
                  <label className="block font-semibold text-gray-700 mb-1">Select Surfactant Database</label>
                  <select
                    value={selectedActiveOptionIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedActiveOptionIdx(idx);
                      if (idx !== 999) {
                        const opt = STANDARD_ACTIVE_OPTIONS[idx];
                        setNewActiveName(opt.name);
                        setNewActivePurity(opt.purity);
                      } else {
                        setNewActiveName("");
                        setNewActivePurity(70);
                      }
                    }}
                    className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] font-semibold"
                  >
                    {STANDARD_ACTIVE_OPTIONS.map((opt, oIdx) => (
                      <option key={oIdx} value={oIdx} className="text-gray-900 bg-white font-semibold">
                        {opt.name} (Purity: {opt.purity}%)
                      </option>
                    ))}
                    <option value={999} className="text-gray-900 bg-white font-semibold">
                      [Custom / Manual Input]
                    </option>
                  </select>
                </div>

                <div className="w-24">
                  <label className="block font-semibold text-gray-700 mb-1">Formula Weight %</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 10"
                    value={newActivePercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setNewActivePercent("");
                      } else {
                        setNewActivePercent(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-2 py-1.5 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addActiveRow}
                  className="bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold px-4 py-1.5 rounded cursor-pointer transition-all"
                >
                  + Add Surfactant
                </button>
              </div>

              {selectedActiveOptionIdx === 999 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-teal-50/30 p-2.5 rounded border border-teal-100 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">Custom Surfactant Name</label>
                    <input
                      type="text"
                      value={newActiveName}
                      onChange={(e) => setNewActiveName(e.target.value)}
                      placeholder="e.g. SLES (70%)"
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">Active Purity %</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      placeholder="e.g. 70"
                      value={newActivePurity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setNewActivePurity("");
                        } else {
                          setNewActivePurity(Number(val));
                        }
                      }}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* List */}
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Formulation Components (इंग्रीडिएंट्स की सूची)</span>
                {activeList.length > 0 && (
                  <button
                    onClick={() => setActiveList([])}
                    className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition-all bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg text-[10px]"
                    title="Clear entire active matter ingredients list"
                  >
                    🗑️ Clear All (सब साफ करें)
                  </button>
                )}
              </div>

              <div className="border border-[#e5e7eb] rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left min-w-full">
                  <thead className="bg-gray-100 font-bold border-b text-gray-700">
                    <tr>
                      <th className="p-2 sm:p-2.5 text-left">Surfactant</th>
                      <th className="p-2 sm:p-2.5 text-center">Formula Weight %</th>
                      <th className="p-2 sm:p-2.5 text-center">Active Purity</th>
                      <th className="p-2 sm:p-2.5 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-800 font-medium">
                    {activeList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 sm:p-8 text-center text-gray-400 italic">
                          No ingredients in this mixture. Select database or custom option above and click "+ Add Surfactant" to start.
                          <br />
                          <span className="text-[10px] text-gray-400 mt-1 block">(कोई इंग्रीडिएंट नहीं है। नया मिक्स बनाने के लिए ऊपर से जोड़ें।)</span>
                        </td>
                      </tr>
                    ) : (
                      activeList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-2 sm:p-2.5 font-bold text-[#0f766e] break-words">{item.name}</td>
                          <td className="p-2 sm:p-2.5 text-center font-mono text-gray-900 font-bold whitespace-nowrap">{item.percentageInFormula}%</td>
                          <td className="p-2 sm:p-2.5 text-center font-mono text-teal-700 whitespace-nowrap">{item.activeMatterPurity}%</td>
                          <td className="p-2 sm:p-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => removeActiveRow(idx)}
                              className="text-red-500 font-bold hover:text-red-700 cursor-pointer bg-red-50 hover:bg-red-100/60 px-2 py-1 rounded text-[10px] whitespace-nowrap"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Active Matter Display */}
              <div className="bg-[#ccfbf1]/40 border border-[#0f766e]/20 rounded-xl p-4 text-center">
                <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider block">Resulting Product Active Surfactant Matter</span>
                <span className="text-3xl font-extrabold text-[#0f766e] font-mono mt-1 block">{totalActiveMatter}%</span>
                <p className="text-xs text-gray-500 mt-1">
                  {totalActiveMatter >= 15
                    ? "Premium Industrial/Household Grade. Superb cleaning performance, heavy degreasing power, high foaming."
                    : totalActiveMatter >= 10
                    ? "Standard Consumer Grade. Good balance of performance, thick viscosity structure, and material cost control."
                    : "Economy Grade. Budget-friendly, lower surfactant level, highly reliant on secondary builders for cleaning."}
                </p>
              </div>
            </div>
          )}

          {activeCalcTab === "dilution" && (
            <div className="space-y-4 animate-fade-in" id="dilution-calculator">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900">Surfactant Dilution Formula (C1 • V1 = C2 • V2)</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculate concentrated surfactant volume needed to synthesize lower-strength dilution batches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Concentration C1 (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 70"
                    value={diluteC1}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setDiluteC1("");
                      } else {
                        setDiluteC1(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Strength C2 (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={diluteC2}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setDiluteC2("");
                      } else {
                        setDiluteC2(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Volume V2 (Liters)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={diluteV2}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setDiluteV2("");
                      } else {
                        setDiluteV2(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>
              </div>

              {c1Num > 0 && c2Num > c1Num ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Invalid Dilution Parameters</span>
                  </div>
                  <p className="text-amber-800">
                    Target concentration cannot exceed source concentration. Dilution cannot increase concentration.
                  </p>
                </div>
              ) : (
                <div className="bg-[#eff6ff] border border-blue-200 rounded-xl p-4 text-xs space-y-2">
                  <h4 className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">Dilution Recipe Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                    <div>
                      <span className="text-gray-500">Volume of concentrate (V1) needed:</span>
                      <p className="text-lg font-bold text-blue-600 font-mono">{dilutionResult.v1} Liters</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Volume of Water carrier needed:</span>
                      <p className="text-lg font-bold text-gray-800 font-mono">{dilutionResult.waterNeeded} Liters</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-500 font-semibold italic border-t pt-2 mt-2 border-blue-200">
                    Mixing Rule: Slowly charge {dilutionResult.v1} L of {diluteC1 || 0}% surfactant into {dilutionResult.waterNeeded} L of pure demineralized water under low-speed stirring to prevent air entrapment and foaming.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeCalcTab === "units" && (
            <div className="space-y-4 animate-fade-in" id="unit-converter">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900">Industrial Chemistry Unit Converter</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Convert mass and volumetric measurements standard in detergent warehouses and laboratories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={convVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setConvVal("");
                      } else {
                        setConvVal(Number(val));
                      }
                    }}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">From Unit</label>
                  <select
                    value={convFrom}
                    onChange={(e) => setConvFrom(e.target.value)}
                    className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2 py-2 text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] cursor-pointer"
                  >
                    <option value="kg" className="text-gray-900 bg-white font-semibold">Kilograms (kg)</option>
                    <option value="g" className="text-gray-900 bg-white font-semibold">Grams (g)</option>
                    <option value="lb" className="text-gray-900 bg-white font-semibold">Pounds (lb)</option>
                    <option value="oz" className="text-gray-900 bg-white font-semibold">Ounces (oz)</option>
                    <option value="l" className="text-gray-900 bg-white font-semibold">Liters (L)</option>
                    <option value="ml" className="text-gray-900 bg-white font-semibold">Milliliters (ml)</option>
                    <option value="gal" className="text-gray-900 bg-white font-semibold">US Gallons (gal)</option>
                  </select>
                </div>
                <div className="flex items-center justify-center py-2 text-[#0f766e]">
                  <ArrowRight size={18} />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">To Unit</label>
                  <select
                    value={convTo}
                    onChange={(e) => setConvTo(e.target.value)}
                    className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2 py-2 text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e] cursor-pointer"
                  >
                    <option value="kg" className="text-gray-900 bg-white font-semibold">Kilograms (kg)</option>
                    <option value="g" className="text-gray-900 bg-white font-semibold">Grams (g)</option>
                    <option value="lb" className="text-gray-900 bg-white font-semibold">Pounds (lb)</option>
                    <option value="oz" className="text-gray-900 bg-white font-semibold">Ounces (oz)</option>
                    <option value="l" className="text-gray-900 bg-white font-semibold">Liters (L)</option>
                    <option value="ml" className="text-gray-900 bg-white font-semibold">Milliliters (ml)</option>
                    <option value="gal" className="text-gray-900 bg-white font-semibold">US Gallons (gal)</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#f3f4f6] border border-gray-200 rounded-xl p-4 text-center">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Converted Measurement</span>
                <span className="text-2xl font-extrabold text-gray-900 font-mono mt-1 block">
                  {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 4 })} {convTo}
                </span>
              </div>
            </div>
          )}

          {activeCalcTab === "cmc" && (
            <div className="space-y-4 animate-fade-in text-left" id="cmc-calculator">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  🌀 Clint's Mixed Critical Micelle Concentration (CMC) Lab
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculate Clint's thermodynamic mixed critical micelle concentration of surfactant blends. Below this value, surfactants exist as single molecules; above it, they organize into soap micelles.
                </p>
              </div>

              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 text-xs text-purple-950 leading-relaxed">
                💡 <strong>Cleansing Science:</strong> For high-efficiency detergent formulas, the working active surfactant level must reside significantly above the mixed CMC. Formulating a synergistic blend lowers the overall CMC, reducing raw material costs while increasing cleansing speed!
              </div>

              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">Surfactants in Mixture</span>
                
                <div className="border border-[#e5e7eb] rounded-xl overflow-x-auto text-xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f3f4f6] text-gray-700 font-bold border-b border-[#e5e7eb]">
                        <th className="p-2.5">Surfactant Agent</th>
                        <th className="p-2.5 text-center">CMC (mM)</th>
                        <th className="p-2.5 text-center">CMC (ppm)</th>
                        <th className="p-2.5 text-center w-36">Proportion / Ratio</th>
                        <th className="p-2.5 text-center">Fraction (%)</th>
                        <th className="p-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {cmcList.map((item, idx) => {
                        const totalProportion = cmcList.reduce((sum, c) => sum + (Number(c.ratio) || 0), 0);
                        const pct = totalProportion > 0 ? ((Number(item.ratio) / totalProportion) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={idx} className="hover:bg-purple-50/10">
                            <td className="p-2.5 font-semibold text-[#0f766e]">{item.name}</td>
                            <td className="p-2.5 text-center font-mono text-purple-700 font-bold">{item.cmcMolar.toFixed(3)} mM</td>
                            <td className="p-2.5 text-center font-mono text-purple-900 font-bold">{item.cmcPpm.toFixed(0)} ppm</td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.ratio}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                                  const updated = [...cmcList];
                                  updated[idx].ratio = val;
                                  setCmcList(updated);
                                }}
                                className="w-20 bg-white text-gray-900 caret-[#0f766e] border border-gray-200 rounded px-1.5 py-1 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                              />
                            </td>
                            <td className="p-2.5 text-center font-bold font-mono text-teal-600">{pct}%</td>
                            <td className="p-2.5 text-center text-rose-500">
                              <button
                                disabled={cmcList.length <= 1}
                                onClick={() => setCmcList(cmcList.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer text-sm font-bold"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add Surfactant Row */}
                <div className="flex flex-wrap items-end gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block font-semibold text-gray-700 mb-1">Select Surfactant Database</label>
                    <select
                      value={selectedOptionIdx}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setSelectedOptionIdx(idx);
                        if (idx !== 999) {
                          const opt = STANDALONE_CMC_OPTIONS[idx];
                          setCmcCustomName(opt.name);
                          setCmcCustomMolar(opt.cmcMolar);
                          setCmcCustomPpm(opt.cmcPpm);
                        }
                      }}
                      className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 font-semibold"
                    >
                      {STANDALONE_CMC_OPTIONS.map((opt, oIdx) => (
                        <option key={oIdx} value={oIdx} className="text-gray-900 bg-white font-semibold">
                          {opt.name}
                        </option>
                      ))}
                      <option value={999} className="text-gray-900 bg-white font-semibold">
                        [Custom / Manual Input]
                      </option>
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block font-semibold text-gray-700 mb-1">Ratio / Pct</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={cmcCustomRatio}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setCmcCustomRatio("");
                        } else {
                          setCmcCustomRatio(Number(val));
                        }
                      }}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-2 py-1.5 text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      let name = cmcCustomName;
                      let molar = cmcCustomMolar;
                      let ppm = cmcCustomPpm;
                      if (selectedOptionIdx !== 999) {
                        const opt = STANDALONE_CMC_OPTIONS[selectedOptionIdx];
                        name = opt.name;
                        molar = opt.cmcMolar;
                        ppm = opt.cmcPpm;
                      } else if (!name.trim()) {
                        name = "Custom Surfactant Agent";
                      }

                      const ratioNum = typeof cmcCustomRatio === 'number' ? cmcCustomRatio : parseFloat(String(cmcCustomRatio));
                      const sanitizedRatio = isNaN(ratioNum) || ratioNum <= 0 ? 1 : ratioNum;

                      const molarNum = typeof molar === 'number' ? molar : parseFloat(String(molar));
                      const sanitizedMolar = isNaN(molarNum) || molarNum <= 0 ? 0.1 : molarNum;

                      const ppmNum = typeof ppm === 'number' ? ppm : parseFloat(String(ppm));
                      const sanitizedPpm = isNaN(ppmNum) || ppmNum <= 0 ? sanitizedMolar * 320 : ppmNum;

                      // Add to list
                      setCmcList([...cmcList, { name, cmcMolar: sanitizedMolar, cmcPpm: sanitizedPpm, ratio: sanitizedRatio }]);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded cursor-pointer transition-colors"
                  >
                    + Add to Mix
                  </button>
                </div>

                {selectedOptionIdx === 999 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-purple-50/30 p-2.5 rounded border border-purple-100 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-0.5">Custom Name</label>
                      <input
                        type="text"
                        value={cmcCustomName}
                        onChange={(e) => setCmcCustomName(e.target.value)}
                        placeholder="e.g. Sodium Decyl Sulfate"
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-0.5">CMC Molar (mM)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="e.g. 0.10"
                        value={cmcCustomMolar}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setCmcCustomMolar("");
                            setCmcCustomPpm("");
                          } else {
                            const m = Math.max(0.001, Number(val));
                            setCmcCustomMolar(m);
                            setCmcCustomPpm(m * 320);
                          }
                        }}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-0.5">CMC (ppm)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 30"
                        value={cmcCustomPpm}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setCmcCustomPpm("");
                          } else {
                            setCmcCustomPpm(Math.max(1, Number(val)));
                          }
                        }}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calculations Output */}
                {(() => {
                  const totalRatio = cmcList.reduce((sum, c) => sum + (Number(c.ratio) || 0), 0);
                  if (totalRatio === 0) return null;

                  let inverseSum = 0;
                  cmcList.forEach(item => {
                    const fraction = (Number(item.ratio) || 0) / totalRatio;
                    inverseSum += fraction / item.cmcMolar;
                  });

                  const mixedCmcMolar = 1 / inverseSum;
                  const mixedCmcPpm = mixedCmcMolar * 320; // approximate average MW

                  return (
                    <div className="bg-purple-950 text-white rounded-xl p-4 mt-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-purple-800 pb-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-purple-200">
                          Thermodynamic Ideal Mixed CMC Result
                        </span>
                        <span className="bg-purple-800 text-purple-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          Clint's Model
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                        <div className="bg-purple-900/40 p-3 rounded-lg border border-purple-800/40">
                          <span className="text-[9px] text-purple-300 block uppercase font-bold">Mixed CMC (Molar)</span>
                          <span className="text-2xl font-black text-white font-mono block mt-1">
                            {mixedCmcMolar.toFixed(4)} <span className="text-sm font-normal">mM</span>
                          </span>
                        </div>
                        <div className="bg-purple-900/40 p-3 rounded-lg border border-purple-800/40">
                          <span className="text-[9px] text-purple-300 block uppercase font-bold">Mixed CMC (Parts Per Million)</span>
                          <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
                            {mixedCmcPpm.toFixed(1)} <span className="text-sm font-normal text-white">ppm</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-purple-200 leading-normal bg-purple-900/30 p-2.5 rounded border border-purple-800/40 font-mono text-center">
                        Formula: 1 / CMC_mix = Σ ( α_i / CMC_i )
                        <span className="block text-[9px] text-purple-300 mt-1 max-w-[500px] mx-auto truncate animate-pulse" title={
                          cmcList.map(c => `(${((c.ratio/totalRatio)).toFixed(2)}/${c.cmcMolar.toFixed(2)})`).join(" + ")
                        }>
                          1 / Mixed_CMC = {cmcList.map(c => `(${((c.ratio/totalRatio)).toFixed(2)}/${c.cmcMolar})`).join(" + ")}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeCalcTab === "glda_calculator" && (
            <div className="space-y-6 animate-fade-in text-left" id="glda-calculator">
              <div className="border-b pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  🌿 Green Chelator & Co-Builder Stoichiometry
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Calculate precise stoichiometric water hardness sequestration demands and formulate co-builder percentages for sustainable detergent systems (optimized for Indian bucket/hand-wash usage).
                </p>
              </div>

              {/* Informative Disclaimer Callout */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-xs text-emerald-950 leading-relaxed shadow-sm">
                <Beaker className="text-emerald-700 shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="font-bold block text-emerald-900 mb-0.5">Threshold Co-Builder Science</span>
                  In modern detergent formulations, eco-chelators like GLDA, Sodium Citrate, and Gluconate are rarely used as sole builders for 100% stoichiometric water softening due to cost and stability caps. Instead, they act as <strong className="text-emerald-800">threshold crystallisation inhibitors</strong> (co-builders) at lower dosages (typically 10% of full stoichiometry), complementing primary alkaline builders like Soda Ash or Zeolites.
                </div>
              </div>

              {/* Interactive Inputs Grid */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Wash Water & Dosage Parameters</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Water Hardness */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                      <span>Water Hardness</span>
                      <span className="font-mono text-emerald-700 font-bold">{waterHardnessPpm} ppm (CaCO₃)</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="5"
                      value={waterHardnessPpm}
                      onChange={(e) => setWaterHardnessPpm(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>10 ppm (Soft)</span>
                      <span>250 ppm (Hard)</span>
                      <span>500 ppm (V. Hard)</span>
                    </div>
                  </div>

                  {/* Wash Volume */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                      <span>Wash Water Volume</span>
                      <span className="font-mono text-emerald-700 font-bold">{washVolumeL} Liters</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      step="1"
                      value={washVolumeL}
                      onChange={(e) => setWashVolumeL(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>2L (Lab beaker)</span>
                      <span className="text-emerald-800 font-medium">10L (Bucket wash)</span>
                      <span>30L (Machine)</span>
                    </div>
                  </div>

                  {/* Wash Dose */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                      <span>Detergent Dose per Wash</span>
                      <span className="font-mono text-emerald-700 font-bold">{washDoseGrams || 0} grams</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g. 20"
                      value={washDoseGrams}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setWashDoseGrams("");
                        } else {
                          setWashDoseGrams(Number(val));
                        }
                      }}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#0f766e] focus:border-[#0f766e]"
                    />
                    <div className="text-[10px] text-gray-400 mt-1 leading-normal text-center">
                      💡 Standard Indian bucket hand-wash scoop is ~20g.
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-2 pt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Safety Margin */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                      <span>Safety Margin</span>
                      <span className="font-mono text-emerald-700 font-bold">{safetyMarginPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={safetyMarginPct}
                      onChange={(e) => setSafetyMarginPct(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>0% (Theoretical)</span>
                      <span>20% (Standard)</span>
                      <span>50% (High Margin)</span>
                    </div>
                  </div>

                  {/* Co-Builder Target */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                      <span>Co-Builder Threshold Target</span>
                      <span className="font-mono text-emerald-700 font-bold">{coBuilderTargetPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={coBuilderTargetPct}
                      onChange={(e) => setCoBuilderTargetPct(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>5% (Catalytic)</span>
                      <span className="text-emerald-800 font-medium">10% (Optimum)</span>
                      <span>100% (Full Sequest.)</span>
                    </div>
                  </div>

                  {/* Max Formulation Cap */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                      <span>Formulation Capping Limit</span>
                      <span className="font-mono text-emerald-700 font-bold">{maxFormulationCapPct.toFixed(1)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.5"
                      value={maxFormulationCapPct}
                      onChange={(e) => setMaxFormulationCapPct(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>0.5%</span>
                      <span className="text-emerald-800 font-medium">3.0% (Approved Cap)</span>
                      <span>10.0%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculations Output Dashboard */}
              <div className="bg-[#0f2e24] text-white rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-300">
                    Stoichiometric Water Load Calculations
                  </span>
                  <span className="bg-emerald-800 text-emerald-100 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                    Stoichiometric Model
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold tracking-tight">Total CaCO₃ to Bind</span>
                    <span className="text-2xl font-black text-white font-mono block mt-1">
                      {greenChelatorResult.totalCaCO3ToBindMg.toLocaleString()} <span className="text-sm font-normal">mg</span>
                    </span>
                    <span className="text-[9px] text-emerald-400 block mt-0.5 font-mono">
                      ({waterHardnessPpm} ppm &times; {washVolumeL} Liters)
                    </span>
                  </div>
                  <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold tracking-tight">Stoichiometric Target <span className="text-emerald-400">(+{safetyMarginPct}% Margin)</span></span>
                    <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
                      {greenChelatorResult.stoichiometricTargetMg.toLocaleString()} <span className="text-sm font-normal text-white">mg</span>
                    </span>
                    <span className="text-[9px] text-emerald-400 block mt-0.5 font-mono">
                      (Target Load &times; {1 + safetyMarginPct/100})
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Chelators comparison list */}
              <div className="space-y-3">
                <span className="text-xs uppercase font-extrabold tracking-wider text-gray-500 block">
                  Green Chelator Comparison Table & Formulation Outputs
                </span>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {greenChelatorResult.chelators.map((c) => {
                    const isCapped = c.calculatedWeightPct > c.practicalWeightPct;
                    return (
                      <div
                        key={c.id}
                        className={`border rounded-xl p-4 flex flex-col justify-between transition-all bg-white shadow-sm hover:shadow-md ${
                          c.id === "glda" ? "border-emerald-200 bg-emerald-50/5" : "border-gray-200"
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Title with Verification Tag */}
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-gray-900 leading-tight block">{c.name}</span>
                            <span
                              className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                c.id === "glda"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {c.id === "glda" ? "Verified" : "Estimated"}
                            </span>
                          </div>

                          {/* Binding Capacity */}
                          <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-100">
                            <span className="text-gray-500">CaCO₃ Binding Capacity</span>
                            <span className="font-mono font-bold text-gray-900">
                              {c.bindingCapacity} mg CaCO₃/g
                            </span>
                          </div>

                          {/* 100% stoichiometric grams required */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Stoichiometric Grams (100%)</span>
                            <span className="font-mono text-gray-800">
                              {c.theoreticalSequestrationGrams.toFixed(3)} g
                            </span>
                          </div>

                          {/* Co-Builder Threshold Target Grams */}
                          <div className="flex justify-between items-center text-xs font-semibold bg-gray-50 p-1 rounded">
                            <span className="text-gray-600">Co-Builder Target ({coBuilderTargetPct}%)</span>
                            <span className="font-mono text-emerald-800 font-bold">
                              {c.coBuilderTargetGrams.toFixed(3)} g
                            </span>
                          </div>

                          {/* Calculated Formulation Weight % */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Calculated Weight %</span>
                            <span className="font-mono text-gray-800">
                              {c.calculatedWeightPct.toFixed(2)}%
                            </span>
                          </div>

                          {/* Practical Capped Weight % */}
                          <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-dashed border-gray-200">
                            <span className="text-gray-900">Practical Formula Weight %</span>
                            <span className={`font-mono text-sm ${isCapped ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}`}>
                              {c.practicalWeightPct.toFixed(2)}%
                              {isCapped && <span className="text-[9px] font-medium block text-right text-amber-500">(Capped at {maxFormulationCapPct}%)</span>}
                            </span>
                          </div>

                          {/* Practical Grams in standard dose */}
                          <div className="flex justify-between items-center text-xs font-bold bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                            <span className="text-emerald-950">Active Mass in Dose ({washDoseGrams}g)</span>
                            <span className="font-mono text-emerald-800 font-bold">
                              {c.practicalWeightGrams.toFixed(3)} g
                            </span>
                          </div>
                        </div>

                        {/* Citation & Specific Warnings/Tooltips */}
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                          <span className="text-[10px] text-gray-400 block leading-tight font-mono">
                            {c.citation}
                          </span>

                          {c.id !== "glda" ? (
                            <div className="bg-amber-50 border border-amber-100 rounded p-2 text-[9px] text-amber-900 flex items-start gap-1 leading-normal">
                              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={12} />
                              <div>
                                <strong className="font-bold">Persistent UI Disclaimer:</strong> Binding capacity is an estimate only and requires rigorous lab titration validation before production use. Do not assume GLDA-level precision.
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded p-2 text-[9px] text-emerald-900 flex items-start gap-1 leading-normal">
                              <Beaker className="text-emerald-600 shrink-0 mt-0.5" size={12} />
                              <div>
                                <strong className="font-bold">Verified confidence:</strong> Built-in safety margin accounts for competitive divalent metal complexation constants.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step-by-Step Mathematical Calculation Example (Plain Text Style table) */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1">
                    🧮 Stoichiometric Calculation Sequence Verification
                  </h4>
                  <span className="text-[10px] bg-gray-200 text-gray-600 font-mono px-2 py-0.5 rounded font-bold">
                    Audit Log
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-normal">
                  The mathematical equation chain below shows exactly how theoretical stoichiometric parameters are mapped directly into practical, capped co-builder formulation percentages.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono border-collapse text-left bg-white rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <th className="p-2 border-r">Step ID</th>
                        <th className="p-2 border-r">Calculation Parameters</th>
                        <th className="p-2 border-r">Formula Applied</th>
                        <th className="p-2 text-right">Result (GLDA-47)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800 font-medium">
                      <tr>
                        <td className="p-2 border-r bg-gray-50 text-gray-500 text-center font-bold">1</td>
                        <td className="p-2 border-r">Total Hardness to Bind</td>
                        <td className="p-2 border-r">Hardness &times; Wash Volume</td>
                        <td className="p-2 text-right text-emerald-700 font-bold">
                          {waterHardnessPpm} ppm &times; {washVolumeL} L = {greenChelatorResult.totalCaCO3ToBindMg.toLocaleString()} mg CaCO₃
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r bg-gray-50 text-gray-500 text-center font-bold">2</td>
                        <td className="p-2 border-r">Safety / Sequestering Target</td>
                        <td className="p-2 border-r">Total Hardness &times; (1 + Margin)</td>
                        <td className="p-2 text-right text-emerald-700 font-bold">
                          {greenChelatorResult.totalCaCO3ToBindMg.toLocaleString()} mg &times; {1 + safetyMarginPct/100} = {greenChelatorResult.stoichiometricTargetMg.toLocaleString()} mg CaCO₃
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r bg-gray-50 text-gray-500 text-center font-bold">3</td>
                        <td className="p-2 border-r">Theoretical Grams (100%)</td>
                        <td className="p-2 border-r">Target Load / Binding Capacity</td>
                        <td className="p-2 text-right text-emerald-700 font-bold">
                          {greenChelatorResult.stoichiometricTargetMg.toLocaleString()} mg / 137 mg/g = {(greenChelatorResult.stoichiometricTargetMg / 137).toFixed(3)} g GLDA-47
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r bg-gray-50 text-gray-500 text-center font-bold">4</td>
                        <td className="p-2 border-r">Co-Builder Target Demand</td>
                        <td className="p-2 border-r">Theoretical Grams &times; {coBuilderTargetPct}%</td>
                        <td className="p-2 text-right text-emerald-700 font-bold">
                          {(greenChelatorResult.stoichiometricTargetMg / 137).toFixed(3)} g &times; {coBuilderTargetPct/100} = {((greenChelatorResult.stoichiometricTargetMg / 137) * (coBuilderTargetPct/100)).toFixed(3)} g
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r bg-gray-50 text-gray-500 text-center font-bold">5</td>
                        <td className="p-2 border-r">Calculated Weight %</td>
                        <td className="p-2 border-r">(Target Demand / Wash Dose) &times; 100</td>
                        <td className="p-2 text-right text-emerald-700 font-bold">
                          {(() => {
                            const safeDose = washDoseGrams > 0 ? washDoseGrams : 1;
                            const calcPct = (((greenChelatorResult.stoichiometricTargetMg / 137) * (coBuilderTargetPct/100)) / safeDose) * 100;
                            const safePct = isFinite(calcPct) ? calcPct : 0;
                            return `(${((greenChelatorResult.stoichiometricTargetMg / 137) * (coBuilderTargetPct/100)).toFixed(3)}g / ${washDoseGrams || 0}g) × 100 = ${safePct.toFixed(2)}%`;
                          })()}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/20">
                        <td className="p-2 border-r bg-emerald-50 text-emerald-900 text-center font-bold">6</td>
                        <td className="p-2 border-r font-bold">Practical Formulation Weight %</td>
                        <td className="p-2 border-r font-bold">Min(Calculated %, Cap of {maxFormulationCapPct}%)</td>
                        <td className="p-2 text-right text-emerald-800 font-extrabold">
                          {(() => {
                            const safeDose = washDoseGrams > 0 ? washDoseGrams : 1;
                            const calcPct = (((greenChelatorResult.stoichiometricTargetMg / 137) * (coBuilderTargetPct/100)) / safeDose) * 100;
                            const safePct = isFinite(calcPct) ? calcPct : 0;
                            const practical = Math.min(safePct, maxFormulationCapPct);
                            return `Min(${safePct.toFixed(2)}%, ${maxFormulationCapPct.toFixed(1)}%) = ${practical.toFixed(2)}%`;
                          })()}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r bg-gray-50 text-gray-500 text-center font-bold">7</td>
                        <td className="p-2 border-r">Practical Active Weight in Dose</td>
                        <td className="p-2 border-r">Practical Weight % &times; Wash Dose</td>
                        <td className="p-2 text-right text-emerald-700 font-bold">
                          {(() => {
                            const safeDose = washDoseGrams > 0 ? washDoseGrams : 1;
                            const calcPct = (((greenChelatorResult.stoichiometricTargetMg / 137) * (coBuilderTargetPct/100)) / safeDose) * 100;
                            const safePct = isFinite(calcPct) ? calcPct : 0;
                            const practical = Math.min(safePct, maxFormulationCapPct);
                            const practicalGrams = (practical / 100) * (washDoseGrams || 0);
                            return `${practical.toFixed(2)}% of ${washDoseGrams || 0}g = ${practicalGrams.toFixed(3)}g`;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

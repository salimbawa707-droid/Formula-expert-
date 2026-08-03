import React, { useState, useEffect, Component } from "react";
import { MessageSquare, Cpu, AlertTriangle, Play, RefreshCw, Send, CheckCircle, HelpCircle, Sliders, Dna, ArrowRight, Plus, Trash2, Sparkles, Undo, BookOpen, Bookmark, X, RotateCcw, Code, FileText, Database, FlaskConical, Layers, Info, Globe, CloudSun, Droplets, Thermometer, ShieldAlert, WashingMachine, Wrench } from "lucide-react";
import { getIngredientEcoMetrics, calculateFormulationEcoMetrics, calculateCorrectedEcoRating, calculateBlendedHLB, calculateEstimatedPH, getPreservativeWarning, getTargetPHRange, getAuditedIngredientCategory, getDefaultActiveMatter, calculateWaterHardnessTolerance, getInciName, calculateActiveMatter, calculateRawSurfactants, calculateActiveSurfactants, calculateFormulationCompatibility, generateDynamicMixingInstructions, calculateCleaningPerformance, calculateBatchCost, calculateCPI, evaluateFormulationGreenChelators, calculateLabHealthScore, evaluateAIGrade, generateFormulationWarnings } from "../utils/calculators";
import { PHEngine } from "../utils/pHEngine";
import SmartFormulaAnalyzerPro from "./SmartFormulaAnalyzerPro";
import CategoryIngredientSelector, { getCategorySpecificIngredients } from "./CategoryIngredientSelector";
import HLBGlossary from "./HLBGlossary";
import SaveFormulaModal from "./SaveFormulaModal";
import InciLabelModal from "./InciLabelModal";
import { FORMULAS } from "../data/formulas";
import { COMPATIBILITY_MATRIX, CHEMICALS } from "../data/chemicals";
import { searchUniversalIngredients, getAllUniversalIngredients } from "../data/universalIngredientLibrary";
import { ActiveFormulaState } from "../types";
import { findSubstitutionsForFormula, REGIONAL_MARKET_LABELS, RegionalMarket, SubstitutionObjective, IngredientSubstitutionRule } from "../utils/substitutionEngine";
import { CLIMATE_PRESETS, WATER_HARDNESS_PRESETS, analyzeClimateAndHardWater, ClimatePreset, WaterHardnessPreset, ClimateRecommendation } from "../utils/climateEngine";
import { MACHINE_PROFILES, MachineProfile, analyzeMachineProfile, MachineRecommendation } from "../utils/machineEngine";
import { PROBLEM_DEFINITIONS, ProblemCategory, runRootCauseTroubleshooter, DiagnosticAction } from "../utils/troubleshooterEngine";

export const getIngredientCmc = (name: string): { cmcMolar: number; cmcPpm: number } | null => {
  const n = name.toLowerCase();
  if (n.includes("labsa") || n.includes("acid slurry")) {
    return { cmcMolar: 1.2, cmcPpm: 384 };
  }
  if (n.includes("sles") || n.includes("lauryl ether sulfate") || n.includes("sodium lauryl ether")) {
    return { cmcMolar: 0.3, cmcPpm: 114 };
  }
  if (n.includes("capb") || n.includes("betaine") || n.includes("cocamidopropyl")) {
    return { cmcMolar: 0.09, cmcPpm: 31 };
  }
  if (n.includes("lae-9") || n.includes("alcohol ethoxylate") || n.includes("lae") || n.includes("ethoxylated alcohol") || n.includes("linear alcohol ethoxylate")) {
    return { cmcMolar: 0.05, cmcPpm: 35 };
  }
  if (n.includes("esterquat") || n.includes("dhtdmac")) {
    return { cmcMolar: 0.01, cmcPpm: 6 };
  }
  if (n.includes("aos") || n.includes("olefin sulfonate")) {
    return { cmcMolar: 0.6, cmcPpm: 182 };
  }
  if (n.includes("span 80") || n.includes("sorbitan oleate")) {
    return { cmcMolar: 0.03, cmcPpm: 13 };
  }
  if (n.includes("cde") || n.includes("cocamide dea") || n.includes("cocamide diethanolamine")) {
    return { cmcMolar: 0.08, cmcPpm: 24 };
  }
  if (n.includes("tween 20") || n.includes("polysorbate 20")) {
    return { cmcMolar: 0.06, cmcPpm: 24 };
  }
  if (n.includes("tween 80") || n.includes("polysorbate 80")) {
    return { cmcMolar: 0.05, cmcPpm: 22 };
  }
  if (n.includes("coco glucoside")) {
    return { cmcMolar: 0.04, cmcPpm: 18 };
  }
  if (n.includes("lauryl glucoside")) {
    return { cmcMolar: 0.03, cmcPpm: 15 };
  }
  if (n.includes("decyl glucoside")) {
    return { cmcMolar: 0.05, cmcPpm: 21 };
  }
  if (n.includes("methyl cocoyl taurate")) {
    return { cmcMolar: 0.15, cmcPpm: 64 };
  }
  return null;
};

const CATEGORY_ORDER = [
  "Surfactants (Anionic)",
  "Surfactants (Nonionic)",
  "Surfactants (Amphoteric)",
  "Surfactants (Cationic)",
  "Builders & Chelators",
  "Electrolytes & Viscosity Modifiers",
  "Polymers & Thickeners",
  "Enzymes",
  "pH Adjusters",
  "Preservatives",
  "Colorants & Fragrance",
  "Solvents & Water Carriers"
];

export const calculateMixedCmc = (ingredients: any[]) => {
  let totalSurfactantPct = 0;
  let inverseCmcSum = 0;
  
  ingredients.forEach(ing => {
    const cmcInfo = getIngredientCmc(ing.name);
    if (cmcInfo && ing.percentage > 0) {
      totalSurfactantPct += ing.percentage;
    }
  });

  if (totalSurfactantPct === 0) return null;

  ingredients.forEach(ing => {
    const cmcInfo = getIngredientCmc(ing.name);
    if (cmcInfo && ing.percentage > 0) {
      const fraction = ing.percentage / totalSurfactantPct;
      inverseCmcSum += fraction / cmcInfo.cmcMolar;
    }
  });

  if (inverseCmcSum === 0) return null;
  const mixedCmcMolar = 1 / inverseCmcSum;
  const mixedCmcPpm = mixedCmcMolar * 320; // approximate average molar mass of typical detergent surfactants
  return {
    molar: mixedCmcMolar,
    ppm: mixedCmcPpm
  };
};

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  onFormulaGenerated?: (formula: ActiveFormulaState) => void;
}

const ECO_LABELS = {
  en: {
    standardEco: "Standard Eco",
    ecoFriendly: "Eco-Friendly Only",
    petroleumFree: "Petroleum Free",
    synthetic: "Synthetic",
    eco: "Eco",
    semiSynthetic: "Semi-Synthetic"
  },
  hi: {
    standardEco: "मानक इको (Standard Eco)",
    ecoFriendly: "केवल पर्यावरण-अनुकूल (Eco-Friendly Only)",
    petroleumFree: "पेट्रोलियम मुक्त (Petroleum Free)",
    synthetic: "सिंथेटिक (Synthetic)",
    eco: "इको (Eco)",
    semiSynthetic: "सेमी-सिंथेटिक (Semi-Synthetic)"
  },
  mr: {
    standardEco: "मानक इको (Standard Eco)",
    ecoFriendly: "फक्त पर्यावरण-अनुकूल (Eco-Friendly Only)",
    petroleumFree: "पेट्रोलियम मुक्त (Petroleum Free)",
    synthetic: "सिंथेटिक (Synthetic)",
    eco: "इको (Eco)",
    semiSynthetic: "सेमी-सिंथेटिक (Semi-Synthetic)"
  }
};

export const FORMULATION_TYPES = {
  antifoam: {
    name: "Anti-foaming Agent",
    rangeText: "1.0 - 3.0",
    min: 1.0,
    max: 3.0,
    description: "Highly lipophilic defoamer that is insoluble in the continuous aqueous phase, migrating to the air-water interface to break down foam bubble structures.",
    applications: "Silicone-based defoamers, oil-soluble agricultural spray additives, paper-processing foam controllers, high-temperature industrial washing liquids.",
    stabilityEffect: "Breaks foam by displacing stabilizing surfactants. Optimal defoaming occurs at extremely low HLB (1-3). If the HLB is too high, the surfactant solubilizes in the water and fails to suppress foam."
  },
  wo: {
    name: "Water-in-Oil (W/O) Emulsion",
    rangeText: "3.0 - 6.0",
    min: 3.0,
    max: 6.0,
    description: "Water droplets dispersed inside a continuous oil medium. Requires highly lipophilic surfactants to stabilize the high oil content.",
    applications: "Barrier creams, heavy industrial greases, skin ointments, protective lotions, water-in-oil cold creams, anti-foaming lubricants.",
    stabilityEffect: "Stable when HLB is low (3-6). If HLB is too high, water droplets will quickly coalesce and separate, causing the cream to leak water or break into two phase layers."
  },
  wetting: {
    name: "Wetting & Spreading Agent",
    rangeText: "7.0 - 9.0",
    min: 7.0,
    max: 9.0,
    description: "Reduces surface tension at solid-liquid interfaces. Enables droplets to spread completely flat instead of beading up.",
    applications: "Glass cleaners, hard surface sanitizers, pesticide sprays, pigment dispersion carriers, wetting agents for paper/textiles.",
    stabilityEffect: "Optimal wetting occurs at HLB 7-9. If the HLB is too low, the surfactant is insoluble in the water spray. If it is too high, the surfactant partitions too much into the bulk water phase, raising surface tension."
  },
  ow: {
    name: "Oil-in-Water (O/W) Emulsion",
    rangeText: "8.0 - 16.0",
    min: 8.0,
    max: 16.0,
    description: "Oil/fragrance droplets dispersed inside a continuous water carrier. Requires hydrophilic surfactants to coat and stabilize the oil droplets.",
    applications: "Moisturizing lotions, cosmetic milks, car polish waxes, standard liquid soap emulsions, hair conditioners.",
    stabilityEffect: "Stable when HLB is high (8-16, typically 10-13 for most cosmetic oils). If the HLB is too low (lipophilic), oil droplets will aggregate, float to the top ('creaming'), and separate."
  },
  softener: {
    name: "Fabric Softener & Conditioner",
    rangeText: "9.0 - 12.0",
    min: 9.0,
    max: 12.0,
    description: "Typically composed of cationic surfactants that carry a positive charge, allowing them to bind statically to negatively-charged textile fibers and leave a lubricating lipid layer.",
    applications: "Household fabric softeners, hair conditioners, anti-static carpet sprays, commercial laundry fabric finishes.",
    stabilityEffect: "Cationic surfactants are stabilized at HLB 9-12. If the HLB is mismatched, the softener may form thick gels, separate into layers, or fail to adsorb evenly onto fiber surfaces."
  },
  detergent: {
    name: "Detergent & Solubilizing Cleaner",
    rangeText: "12.0 - 15.0",
    min: 12.0,
    max: 15.0,
    description: "Surfactants form robust spherical micelles in water that trap particulate soil and oily sebum, dispersing them for easy rinsing.",
    applications: "Laundry liquids, hand washes, car shampoos, heavy-duty floor degreasers.",
    stabilityEffect: "Detergency peaks between HLB 12 and 15. If the HLB is too low (e.g. 4-6), the product acts as an anti-foamer and fails to clean. If too high (16-18), it becomes too water-soluble to partition onto dirt."
  },
  dishwash: {
    name: "Dishwash Liquid Cleaner",
    rangeText: "13.0 - 15.0",
    min: 13.0,
    max: 15.0,
    description: "Formulated specifically for manual and automatic dishwashing, requiring exceptional flash foam stability, intensive grease emulsification, and skin-friendly mildness.",
    applications: "Manual dishwash liquids, hyper-foaming grease cutters, high-dilution plates cleaner concentrates.",
    stabilityEffect: "Grease cutting and bubble stability are optimal at HLB 13.0 - 15.0. If the HLB is lower, cold oil grease removal drops drastically; if higher, foam-boost is diminished."
  },
  degreaser: {
    name: "Heavy-Duty Degreaser",
    rangeText: "12.5 - 14.5",
    min: 12.5,
    max: 14.5,
    description: "High-performance surfactant systems optimized for emulsifying heavy industrial oils, polymerized motor greases, and heavy lipids in high alkaline solutions.",
    applications: "Engine degreasers, commercial kitchen grill cleaners, metal-surface dip tanks, industrial workshop floor cleaners.",
    stabilityEffect: "Maximum oil dispersion occurs at HLB 12.5-14.5. Formulations need precise balancing with builders (like sodium metasilicate) to keep surfactants stable under extreme pH levels."
  },
  solubilizer: {
    name: "Solubilizer & Hydrotrope",
    rangeText: "16.0 - 18.0",
    min: 16.0,
    max: 18.0,
    description: "Extremely hydrophilic surfactants that can dissolve lipophilic substances (fragrances, oils) directly into clear micellar solutions.",
    applications: "Clear body washes, essential oil solubilizers, transparent sanitizers, coupling agents for highly alkaline builders.",
    stabilityEffect: "Perfect clarity is achieved at HLB 16-18. If the HLB is lower, the dissolved oil droplets grow too large, causing the formulation to turn hazy, cloudy, or separate into layers."
  }
};





function calculateDetailedMetrics(ingredients: any[], productType: string) {
  const activeIngs = ingredients || [];
  const phRes = calculateEstimatedPH(productType || "Laundry Liquid", "Formulation", activeIngs);
  const numPH = phRes.estpH;
  const hr = calculateWaterHardnessTolerance(activeIngs);
  const cleaningRes = calculateCleaningPerformance(activeIngs, numPH, hr);
  const compRes = calculateFormulationCompatibility(activeIngs, numPH);

  return {
    cleaningRating: cleaningRes.cleaningScore,
    compatibilityScore: compRes.compatibilityScore
  };
}

function isSurfactant(name: string): boolean {
  if (!name) return false;
  return getAuditedIngredientCategory(name).startsWith("Surfactants");
}

class AIFormulatorErrorBoundary extends (Component as any) {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error inside AIFormulator:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl max-w-xl mx-auto my-8 text-xs text-amber-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="text-amber-600" size={20} />
            <span>AI Formulation Expert Panel Recovered</span>
          </div>
          <p className="text-amber-700">
            A temporary component state anomaly occurred:
            <br />
            <span className="font-mono bg-amber-100 px-2 py-1 rounded text-[11px] block mt-1">
              {this.state.error?.message || "Render exception"}
            </span>
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-[#0f766e] hover:bg-[#0d645c] text-white px-4 py-1.5 rounded-lg font-bold shadow-xs transition-all"
          >
            Reset Panel State
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AIFormulator(props: Props) {
  return (
    <AIFormulatorErrorBoundary>
      <AIFormulatorInner {...props} />
    </AIFormulatorErrorBoundary>
  );
}

function AIFormulatorInner({ lang, translations, onFormulaGenerated }: Props) {
  // Navigation inside AI Panel: "formulation" | "troubleshoot" | "chat"
  const [activeMainTab, setActiveMainTab] = useState<"formulation" | "troubleshoot" | "chat">("formulation");

  // Formulation Sub-Tabs: "design" | "check"
  const [activeSubTab, setActiveSubTab] = useState<"design" | "check">(() => {
    const saved = localStorage.getItem("aiformulator_activeSubTab");
    return (saved as "design" | "check") || "design";
  });

  // Manual Checker Ingredients
  const [checkIngredients, setCheckIngredients] = useState<Array<{ name: string; percentage: number; activeMatterPct: number }>>(() => {
    const saved = localStorage.getItem("aiformulator_checkIngredients");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const detectCheckDuplicates = (): Array<{ name: string; casNumber?: string }> => {
    const seenMap = new Map<string, string>(); // normalizedKey -> original name
    const duplicates: Array<{ name: string; casNumber?: string }> = [];

    checkIngredients.forEach((ing) => {
      const rawName = ing.name.trim();
      if (!rawName) return;

      const chem = CHEMICALS.find(
        (c) => c.commonName.toLowerCase() === rawName.toLowerCase()
      );
      const cas = chem?.casNumber && chem.casNumber !== "N/A" ? chem.casNumber.trim() : undefined;

      // Key for duplicate check: compare normalized name preserving percentages (e.g. 50% vs 33%)
      const normalizedName = rawName
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9%]/g, "");

      if (!normalizedName) return;

      if (seenMap.has(normalizedName)) {
        const existingName = seenMap.get(normalizedName)!;
        const displayName = existingName.toLowerCase() === rawName.toLowerCase()
          ? rawName
          : `${existingName} / ${rawName}`;

        if (!duplicates.some(d => d.name === displayName || d.name === rawName)) {
          duplicates.push({ name: displayName, casNumber: cas });
        }
      } else {
        seenMap.set(normalizedName, rawName);
      }
    });

    return duplicates;
  };

  // Formulation Inputs
  const [productType, setProductType] = useState(() => {
    return localStorage.getItem("aiformulator_productType") || "Laundry Liquid";
  });
  const [targetCost, setTargetCost] = useState(() => {
    const saved = localStorage.getItem("aiformulator_targetCost");
    return saved !== null ? Number(saved) : 60;
  });
  const [targetpH, setTargetpH] = useState(() => {
    return localStorage.getItem("aiformulator_targetpH") || "7.5 - 8.5";
  });
  const [targetFoam, setTargetFoam] = useState(() => {
    return localStorage.getItem("aiformulator_targetFoam") || "Medium Foam";
  });
  const [targetViscosity, setTargetViscosity] = useState(() => {
    return localStorage.getItem("aiformulator_targetViscosity") || "1500 - 2500 cPs";
  });
  const [ecoRequirement, setEcoRequirement] = useState(() => {
    return localStorage.getItem("aiformulator_ecoRequirement") || "Standard Eco";
  });
  const [grade, setGrade] = useState<"Economy" | "Standard" | "Premium">((() => {
    return (localStorage.getItem("aiformulator_grade") as any) || "Standard";
  })());
  const [targetActiveMatter, setTargetActiveMatter] = useState<number>(() => {
    const saved = localStorage.getItem("aiformulator_targetActiveMatter");
    return saved !== null ? Number(saved) : 15;
  });
  const [targetHlb, setTargetHlb] = useState(() => {
    return localStorage.getItem("aiformulator_targetHlb") || "12.0 - 14.0";
  });
  const [waterHardnessPpm, setWaterHardnessPpm] = useState<number>(() => {
    const saved = localStorage.getItem("aiformulator_waterHardnessPpm");
    return saved !== null ? Number(saved) : 150;
  });
  const [availableIngredients, setAvailableIngredients] = useState(() => {
    // BUG J: Underlying state defaults to an empty string ''
    const saved = localStorage.getItem("aiformulator_availableIngredients");
    return saved !== null ? saved : "";
  });

  const [batchSize, setBatchSize] = useState<number>(() => {
    const saved = localStorage.getItem("aiformulator_batchSize");
    return saved !== null ? Number(saved) : 100;
  });

  const [isFormulating, setIsFormulating] = useState(false);
  const [formulationResult, setFormulationResult] = useState<any>(() => {
    const saved = localStorage.getItem("aiformulator_formulationResult");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const isInitialMount = React.useRef(true);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("aiformulator_activeSubTab", activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    localStorage.setItem("aiformulator_checkIngredients", JSON.stringify(checkIngredients));
  }, [checkIngredients]);

  useEffect(() => {
    localStorage.setItem("aiformulator_productType", productType);
  }, [productType]);

  useEffect(() => {
    localStorage.setItem("aiformulator_targetCost", String(targetCost));
  }, [targetCost]);

  useEffect(() => {
    localStorage.setItem("aiformulator_targetpH", targetpH);
  }, [targetpH]);

  useEffect(() => {
    localStorage.setItem("aiformulator_targetFoam", targetFoam);
  }, [targetFoam]);

  useEffect(() => {
    localStorage.setItem("aiformulator_targetViscosity", targetViscosity);
  }, [targetViscosity]);

  useEffect(() => {
    localStorage.setItem("aiformulator_ecoRequirement", ecoRequirement);
  }, [ecoRequirement]);

  useEffect(() => {
    localStorage.setItem("aiformulator_grade", grade);
  }, [grade]);

  useEffect(() => {
    localStorage.setItem("aiformulator_targetActiveMatter", String(targetActiveMatter));
  }, [targetActiveMatter]);

  useEffect(() => {
    localStorage.setItem("aiformulator_targetHlb", targetHlb);
  }, [targetHlb]);

  useEffect(() => {
    localStorage.setItem("aiformulator_waterHardnessPpm", String(waterHardnessPpm));
  }, [waterHardnessPpm]);

  useEffect(() => {
    localStorage.setItem("aiformulator_availableIngredients", availableIngredients);
  }, [availableIngredients]);

  useEffect(() => {
    localStorage.setItem("aiformulator_batchSize", String(batchSize));
  }, [batchSize]);

  useEffect(() => {
    if (formulationResult) {
      localStorage.setItem("aiformulator_formulationResult", JSON.stringify(formulationResult));
    } else {
      localStorage.removeItem("aiformulator_formulationResult");
    }
  }, [formulationResult]);

  const handleResetLab = () => {
    if (window.confirm("Are you sure you want to reset all Formulation parameters and ingredients to default?")) {
      setActiveSubTab("design");
      setCheckIngredients([]);
      setProductType("Laundry Liquid");
      setTargetCost(60);
      setTargetpH("7.5 - 8.5");
      setTargetFoam("Medium Foam");
      setTargetViscosity("1500 - 2500 cPs");
      setEcoRequirement("Standard Eco");
      setGrade("Standard");
      setTargetActiveMatter(15);
      setTargetHlb("12.0 - 14.0");
      setWaterHardnessPpm(150);
      setAvailableIngredients("");
      setBatchSize(100);
      setFormulationResult(null);
      setAiBaselineFormula(null);
      
      // Clear localStorage keys
      localStorage.removeItem("aiformulator_activeSubTab");
      localStorage.removeItem("aiformulator_checkIngredients");
      localStorage.removeItem("aiformulator_productType");
      localStorage.removeItem("aiformulator_targetCost");
      localStorage.removeItem("aiformulator_targetpH");
      localStorage.removeItem("aiformulator_targetFoam");
      localStorage.removeItem("aiformulator_targetViscosity");
      localStorage.removeItem("aiformulator_ecoRequirement");
      localStorage.removeItem("aiformulator_grade");
      localStorage.removeItem("aiformulator_targetActiveMatter");
      localStorage.removeItem("aiformulator_targetHlb");
      localStorage.removeItem("aiformulator_waterHardnessPpm");
      localStorage.removeItem("aiformulator_availableIngredients");
      localStorage.removeItem("aiformulator_batchSize");
      localStorage.removeItem("aiformulator_formulationResult");
      localStorage.removeItem("aiformulator_aiBaselineFormula");
    }
  };

  // Save Formulation Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormulaName, setSaveFormulaName] = useState("");
  const [saveFormulaGrade, setSaveFormulaGrade] = useState<"Economy" | "Standard" | "Premium">("Standard");

  // INCI Export States
  const [showInciModal, setShowInciModal] = useState(false);
  const [copiedInci, setCopiedInci] = useState(false);

  // HLB Sandbox & Redesign States
  const [sandboxIngredients, setSandboxIngredients] = useState<any[]>([]);
  const [aiBaselineFormula, setAiBaselineFormula] = useState<any>(() => {
    const saved = localStorage.getItem("aiformulator_aiBaselineFormula");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    const savedResult = localStorage.getItem("aiformulator_formulationResult");
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    if (aiBaselineFormula) {
      localStorage.setItem("aiformulator_aiBaselineFormula", JSON.stringify(aiBaselineFormula));
    } else {
      localStorage.removeItem("aiformulator_aiBaselineFormula");
    }
  }, [aiBaselineFormula]);

  const [selectedTargetType, setSelectedTargetType] = useState<string>("detergent");
  const [autoBalanceWater, setAutoBalanceWater] = useState<boolean>(true);
  const [sandboxTab, setSandboxTab] = useState<string>("redesign");
  const [surfSubTab, setSurfSubTab] = useState<string>("hlb");
  const [refSubTab, setRefSubTab] = useState<string>("guide");
  const [analysisSubTab, setAnalysisSubTab] = useState<string>("analyzer");
  const [devSubTab, setDevSubTab] = useState<string>("json");

  // Substitution Engine States
  const [selectedRegion, setSelectedRegion] = useState<RegionalMarket>("global");
  const [selectedSubstitutionObjective, setSelectedSubstitutionObjective] = useState<SubstitutionObjective>("all");
  const [appliedSubstitutionNotice, setAppliedSubstitutionNotice] = useState<string | null>(null);

  // Climate & Hard Water Intelligence States
  const [selectedClimatePreset, setSelectedClimatePreset] = useState<ClimatePreset>("normal");
  const [selectedHardnessPreset, setSelectedHardnessPreset] = useState<WaterHardnessPreset>("150_300");
  const [appliedClimateRecommendationNotice, setAppliedClimateRecommendationNotice] = useState<string | null>(null);

  // Machine Profile Intelligence States (Phase 15C)
  const [selectedMachineProfile, setSelectedMachineProfile] = useState<MachineProfile>("front_load");
  const [appliedMachineRecommendationNotice, setAppliedMachineRecommendationNotice] = useState<string | null>(null);

  const handleApplyMachineRecommendation = (rec: MachineRecommendation) => {
    const list = JSON.parse(JSON.stringify(sandboxIngredients));

    if (rec.suggestedAction === "add") {
      list.push({
        id: `ing-machine-${Date.now()}`,
        name: rec.suggestedIngredientName,
        percentage: rec.suggestedPct,
        role: rec.category,
        function: rec.reason,
        activeMatterPct: 100
      });
    } else if (rec.suggestedAction === "increase" || rec.suggestedAction === "decrease") {
      const idx = list.findIndex(
        (ing: any) => (ing.name || "").toLowerCase().includes(rec.targetIngredientName.toLowerCase()) ||
                      (ing.name || "").toLowerCase().includes(rec.suggestedIngredientName.toLowerCase())
      );
      if (idx !== -1) {
        list[idx].percentage = rec.suggestedPct;
      } else {
        list.push({
          id: `ing-machine-${Date.now()}`,
          name: rec.suggestedIngredientName,
          percentage: rec.suggestedPct,
          role: rec.category,
          function: rec.reason,
          activeMatterPct: 100
        });
      }
    } else if (rec.suggestedAction === "swap") {
      const idx = list.findIndex(
        (ing: any) => (ing.name || "").toLowerCase().includes(rec.targetIngredientName.toLowerCase())
      );
      if (idx !== -1) {
        const oldIng = list[idx];
        list[idx] = {
          ...oldIng,
          name: rec.suggestedIngredientName,
          percentage: rec.suggestedPct,
          role: rec.category,
          function: rec.reason
        };
      } else {
        list.push({
          id: `ing-machine-${Date.now()}`,
          name: rec.suggestedIngredientName,
          percentage: rec.suggestedPct,
          role: rec.category,
          function: rec.reason,
          activeMatterPct: 100
        });
      }
    }

    if (autoBalanceWater) {
      const waterIdx = list.findIndex((ing: any) => 
        (ing.name || "").toLowerCase().includes("water") || 
        (ing.name || "").toLowerCase().includes("aqua") || 
        (ing.role && ing.role.toLowerCase().includes("solvent"))
      );
      if (waterIdx !== -1) {
        let nonWaterSum = 0;
        list.forEach((ing: any, iIdx: number) => {
          if (iIdx !== waterIdx) {
            nonWaterSum += Number(ing.percentage) || 0;
          }
        });
        list[waterIdx].percentage = Number(Math.max(0, 100 - nonWaterSum).toFixed(2));
      }
    }

    setSandboxIngredients(list);

    if (formulationResult) {
      const updatedResult = JSON.parse(JSON.stringify(formulationResult));
      updatedResult.ingredients = list;
      setFormulationResult(updatedResult);
    }

    const msg = `Applied Machine Optimization: "${rec.title}". Formula updated and water auto-balanced.`;
    setAppliedMachineRecommendationNotice(msg);
    setTimeout(() => setAppliedMachineRecommendationNotice(null), 8000);
  };

  // Root Cause Troubleshooter States (Phase 15D)
  const [selectedProblemCategory, setSelectedProblemCategory] = useState<ProblemCategory>("cleaning_issues");
  const [appliedTroubleshooterNotice, setAppliedTroubleshooterNotice] = useState<string | null>(null);

  const handleApplyTroubleshooterAction = (action: DiagnosticAction) => {
    const list = JSON.parse(JSON.stringify(sandboxIngredients));

    if (action.suggestedAction === "add") {
      list.push({
        id: `ing-diag-${Date.now()}`,
        name: action.suggestedIngredientName,
        percentage: action.suggestedPct,
        role: action.category,
        function: action.rootCause,
        activeMatterPct: 100
      });
    } else if (action.suggestedAction === "increase" || action.suggestedAction === "decrease") {
      const idx = list.findIndex(
        (ing: any) => (ing.name || "").toLowerCase().includes(action.targetIngredientName.toLowerCase()) ||
                      (ing.name || "").toLowerCase().includes(action.suggestedIngredientName.toLowerCase())
      );
      if (idx !== -1) {
        list[idx].percentage = action.suggestedPct;
      } else {
        list.push({
          id: `ing-diag-${Date.now()}`,
          name: action.suggestedIngredientName,
          percentage: action.suggestedPct,
          role: action.category,
          function: action.rootCause,
          activeMatterPct: 100
        });
      }
    } else if (action.suggestedAction === "swap") {
      const idx = list.findIndex(
        (ing: any) => (ing.name || "").toLowerCase().includes(action.targetIngredientName.toLowerCase())
      );
      if (idx !== -1) {
        const oldIng = list[idx];
        list[idx] = {
          ...oldIng,
          name: action.suggestedIngredientName,
          percentage: action.suggestedPct,
          role: action.category,
          function: action.rootCause
        };
      } else {
        list.push({
          id: `ing-diag-${Date.now()}`,
          name: action.suggestedIngredientName,
          percentage: action.suggestedPct,
          role: action.category,
          function: action.rootCause,
          activeMatterPct: 100
        });
      }
    }

    if (autoBalanceWater) {
      const waterIdx = list.findIndex((ing: any) => 
        (ing.name || "").toLowerCase().includes("water") || 
        (ing.name || "").toLowerCase().includes("aqua") || 
        (ing.role && ing.role.toLowerCase().includes("solvent"))
      );
      if (waterIdx !== -1) {
        let nonWaterSum = 0;
        list.forEach((ing: any, iIdx: number) => {
          if (iIdx !== waterIdx) {
            nonWaterSum += Number(ing.percentage) || 0;
          }
        });
        list[waterIdx].percentage = Number(Math.max(0, 100 - nonWaterSum).toFixed(2));
      }
    }

    setSandboxIngredients(list);

    if (formulationResult) {
      const updatedResult = JSON.parse(JSON.stringify(formulationResult));
      updatedResult.ingredients = list;
      setFormulationResult(updatedResult);
    }

    const msg = `Applied Corrective Action: "${action.title}". Formula updated and water auto-balanced.`;
    setAppliedTroubleshooterNotice(msg);
    setTimeout(() => setAppliedTroubleshooterNotice(null), 8000);
  };

  const handleApplyClimateRecommendation = (rec: ClimateRecommendation) => {
    const list = JSON.parse(JSON.stringify(sandboxIngredients));

    if (rec.suggestedAction === "add") {
      list.push({
        id: `ing-climate-${Date.now()}`,
        name: rec.suggestedIngredientName,
        percentage: rec.suggestedPct,
        role: rec.category,
        function: rec.reason,
        activeMatterPct: 100
      });
    } else if (rec.suggestedAction === "increase" || rec.suggestedAction === "decrease") {
      const idx = list.findIndex(
        (ing: any) => (ing.name || "").toLowerCase().includes(rec.targetIngredientName.toLowerCase()) ||
                      (ing.name || "").toLowerCase().includes(rec.suggestedIngredientName.toLowerCase())
      );
      if (idx !== -1) {
        list[idx].percentage = rec.suggestedPct;
      } else {
        list.push({
          id: `ing-climate-${Date.now()}`,
          name: rec.suggestedIngredientName,
          percentage: rec.suggestedPct,
          role: rec.category,
          function: rec.reason,
          activeMatterPct: 100
        });
      }
    } else if (rec.suggestedAction === "swap") {
      const idx = list.findIndex(
        (ing: any) => (ing.name || "").toLowerCase().includes(rec.targetIngredientName.toLowerCase())
      );
      if (idx !== -1) {
        const oldIng = list[idx];
        list[idx] = {
          ...oldIng,
          name: rec.suggestedIngredientName,
          percentage: rec.suggestedPct,
          role: rec.category,
          function: rec.reason
        };
      } else {
        list.push({
          id: `ing-climate-${Date.now()}`,
          name: rec.suggestedIngredientName,
          percentage: rec.suggestedPct,
          role: rec.category,
          function: rec.reason,
          activeMatterPct: 100
        });
      }
    }

    if (autoBalanceWater) {
      const waterIdx = list.findIndex((ing: any) => 
        (ing.name || "").toLowerCase().includes("water") || 
        (ing.name || "").toLowerCase().includes("aqua") || 
        (ing.role && ing.role.toLowerCase().includes("solvent"))
      );
      if (waterIdx !== -1) {
        let nonWaterSum = 0;
        list.forEach((ing: any, iIdx: number) => {
          if (iIdx !== waterIdx) {
            nonWaterSum += Number(ing.percentage) || 0;
          }
        });
        list[waterIdx].percentage = Number(Math.max(0, 100 - nonWaterSum).toFixed(2));
      }
    }

    setSandboxIngredients(list);

    if (formulationResult) {
      const updatedResult = JSON.parse(JSON.stringify(formulationResult));
      updatedResult.ingredients = list;
      setFormulationResult(updatedResult);
    }

    const msg = `Applied Recommendation: "${rec.title}". Formula updated and water auto-balanced.`;
    setAppliedClimateRecommendationNotice(msg);
    setTimeout(() => setAppliedClimateRecommendationNotice(null), 8000);
  };

  const handleApplySubstitutionRule = (rule: IngredientSubstitutionRule, targetIngredientName: string) => {
    const list = JSON.parse(JSON.stringify(sandboxIngredients));
    const targetIdx = list.findIndex(
      (ing: any) => ing.name.toLowerCase() === targetIngredientName.toLowerCase() ||
                    ing.name.toLowerCase().includes(rule.targetIngredientPattern.toLowerCase())
    );

    if (targetIdx === -1) {
      alert(`Target ingredient "${targetIngredientName}" not found in sandbox formula.`);
      return;
    }

    const oldIng = list[targetIdx];
    const oldPct = Number(oldIng.percentage) || 0;
    const newPct = Number((oldPct * rule.replacementRatio).toFixed(2));
    const oldCost = Number(oldIng.costPerKg) || 0;
    const newCost = Number((oldCost * (1 + rule.costDeltaPct / 100)).toFixed(2));

    list[targetIdx] = {
      ...oldIng,
      name: rule.substituteName,
      percentage: newPct,
      costPerKg: newCost,
      role: rule.targetCategory || oldIng.role,
      function: rule.reason
    };

    // Auto-balance water mass
    const waterIdx = list.findIndex((ing: any) => 
      ing.name.toLowerCase().includes("water") || 
      ing.name.toLowerCase().includes("aqua") || 
      (ing.role && ing.role.toLowerCase().includes("solvent"))
    );

    if (waterIdx !== -1 && autoBalanceWater) {
      let nonWaterSum = 0;
      list.forEach((ing: any, idx: number) => {
        if (idx !== waterIdx) {
          nonWaterSum += Number(ing.percentage);
        }
      });
      list[waterIdx].percentage = Number(Math.max(0, 100 - nonWaterSum).toFixed(2));
    }

    setSandboxIngredients(list);

    if (formulationResult) {
      const updatedResult = JSON.parse(JSON.stringify(formulationResult));
      updatedResult.ingredients = list;
      setFormulationResult(updatedResult);
    }

    const msg = `Successfully substituted "${oldIng.name}" with "${rule.substituteName}" (${rule.substitutionType}). Formula re-calculated and water auto-balanced.`;
    setAppliedSubstitutionNotice(msg);
    setTimeout(() => setAppliedSubstitutionNotice(null), 8000);
  };

  // Blender States
  const [blenderSurfactants, setBlenderSurfactants] = useState<any[]>([
    { name: "LABSA (90%)", hlbValue: 11.5, proportion: 10.0, activeMatterPct: 90, role: "Anionic Surfactant" },
    { name: "SLES (70%)", hlbValue: 13.0, proportion: 8.0, activeMatterPct: 70, role: "Anionic Surfactant" },
    { name: "CAPB (30%)", hlbValue: 12.0, proportion: 4.0, activeMatterPct: 30, role: "Amphoteric Surfactant" },
    { name: "Tween 20 (Polysorbate)", hlbValue: 16.7, proportion: 2.0, activeMatterPct: 100, role: "Non-ionic Emulsifier" },
    { name: "Span 80 (Sorbitan Oleate)", hlbValue: 4.3, proportion: 1.0, activeMatterPct: 100, role: "Lipophilic Emulsifier" },
    { name: "Cocamide DEA (CDE)", hlbValue: 13.5, proportion: 3.0, activeMatterPct: 100, role: "Non-ionic Foam Booster" },
    { name: "Decyl Glucoside (50%)", hlbValue: 13.0, proportion: 2.0, activeMatterPct: 50, role: "Plant-based Non-ionic Surfactant" }
  ]);

  
  const universalSurfactantsList = React.useMemo(() => {
    return getAllUniversalIngredients().filter(ing => 
      ing.category.toLowerCase().includes("surfactant") || 
      ing.subCategory?.toLowerCase().includes("surfactant")
    );
  }, []);

  const universalEcoSurfactantsList = React.useMemo(() => {
    return universalSurfactantsList.filter(ing =>
      (ing.sustainability && ing.sustainability.plantBasedPct > 0) ||
      (ing.functionalInfo && ing.functionalInfo.ecoFriendliness !== "Standard") ||
      (ing.keywords && ing.keywords.some(k => ["eco", "plant", "natural", "green", "bio", "glucoside", "betaine"].includes(k.toLowerCase())))
    );
  }, [universalSurfactantsList]);

  const universalEcoBuildersList = React.useMemo(() => {
    return getAllUniversalIngredients().filter(ing => 
      ing.category.toLowerCase().includes("builder") || 
      ing.category.toLowerCase().includes("chelator")
    );
  }, []);

  const universalEcoAdditivesList = React.useMemo(() => {
    return getAllUniversalIngredients().filter(ing => 
      ing.category.toLowerCase().includes("polymer") || 
      ing.category.toLowerCase().includes("processing") || 
      ing.category.toLowerCase().includes("filler") ||
      ing.category.toLowerCase().includes("preservative") ||
      ing.category.toLowerCase().includes("fragrance") ||
      ing.category.toLowerCase().includes("colour") ||
      ing.category.toLowerCase().includes("additive")
    );
  }, []);

    const handleUpdateBlenderSurfactant = (index: number, key: string, value: any) => {
    setBlenderSurfactants(prev => {
      const list = [...prev];
      if (key === "select_standard" || key === "select_universal") {
        const selectedName = value;
        const match = getAllUniversalIngredients().find(i => i.name === selectedName);
        if (match) {
          list[index] = {
            ...list[index],
            name: match.name,
            hlbValue: match.hlb ? parseFloat(String(match.hlb)) || 10 : 10,
            activeMatterPct: match.activeMatter || 100,
            role: match.subCategory || match.category || "Surfactant"
          };
        }
      } else if (key === "hlbValue" || key === "proportion" || key === "activeMatterPct") {
        list[index] = {
          ...list[index],
          [key]: value === "" ? 0 : Number(value)
        };
      } else {
        list[index] = {
          ...list[index],
          [key]: value
        };
      }
      return list;
    });
  };

  const handleAddBlenderRow = () => {
    setBlenderSurfactants(prev => [
      ...prev,
      { name: "Custom Surfactant", hlbValue: 10.0, proportion: 2.0, activeMatterPct: 100, role: "Surfactant" }
    ]);
  };

  const handleRemoveBlenderRow = (index: number) => {
    setBlenderSurfactants(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetBlender = () => {
    setBlenderSurfactants([
      { name: "LABSA (90%)", hlbValue: 11.5, proportion: 10.0, activeMatterPct: 90, role: "Anionic Surfactant" },
      { name: "SLES (70%)", hlbValue: 13.0, proportion: 8.0, activeMatterPct: 70, role: "Anionic Surfactant" },
      { name: "CAPB (30%)", hlbValue: 12.0, proportion: 4.0, activeMatterPct: 30, role: "Amphoteric Surfactant" },
      { name: "Tween 20 (Polysorbate)", hlbValue: 16.7, proportion: 2.0, activeMatterPct: 100, role: "Non-ionic Emulsifier" },
      { name: "Span 80 (Sorbitan Oleate)", hlbValue: 4.3, proportion: 1.0, activeMatterPct: 100, role: "Lipophilic Emulsifier" },
      { name: "Cocamide DEA (CDE)", hlbValue: 13.5, proportion: 3.0, activeMatterPct: 100, role: "Non-ionic Foam Booster" },
      { name: "Decyl Glucoside (50%)", hlbValue: 13.0, proportion: 2.0, activeMatterPct: 50, role: "Plant-based Non-ionic Surfactant" }
    ]);
  };

  // Synchronize sandbox ingredients whenever a formula is generated/loaded
  useEffect(() => {
    if (formulationResult && formulationResult.ingredients) {
      const list = JSON.parse(JSON.stringify(formulationResult.ingredients));
      
      // Strict water-backfill to ensure exactly 100% mass balance
      const waterIdx = list.findIndex((ing: any) => 
        ing.name.toLowerCase().includes("water") || 
        ing.name.toLowerCase().includes("aqua") || 
        ing.role.toLowerCase().includes("solvent")
      );
      if (waterIdx !== -1) {
        let nonWaterSum = 0;
        list.forEach((ing: any, idx: number) => {
          if (idx !== waterIdx) {
            nonWaterSum += Number(ing.percentage);
          }
        });
        list[waterIdx].percentage = Number(Math.max(0, 100 - nonWaterSum).toFixed(2));
      }
      
      setSandboxIngredients(list);

      // Also pre-load the Multi-Surfactant HLB Blender Lab with actual surfactants from this formula if present
      const surfs = list.filter((ing: any) => {
        const role = (ing.role || "").toLowerCase();
        return role.includes("surfactant") || 
               role.includes("detergent") || 
               role.includes("emulsifier") || 
               role.includes("foam booster") || 
               (ing.hlbValue !== undefined && ing.hlbValue !== null);
      });
      if (surfs.length > 0) {
        setBlenderSurfactants(surfs.map((s: any) => ({
          name: s.name,
          hlbValue: s.hlbValue ?? 12.0,
          proportion: s.percentage,
          activeMatterPct: s.activeMatterPct ?? 100,
          role: s.role || "Surfactant"
        })));
      }
      
      const type = (formulationResult.productType || "").toLowerCase();
      if (type.includes("anti-foam") || type.includes("antifoam") || type.includes("defoamer")) {
        setSelectedTargetType("antifoam");
      } else if (type.includes("softener") || type.includes("conditioner")) {
        setSelectedTargetType("softener");
      } else if (type.includes("degreaser")) {
        setSelectedTargetType("degreaser");
      } else if (type.includes("cream") || type.includes("lotion") || type.includes("emulsion")) {
        setSelectedTargetType("ow");
      } else if (type.includes("wetting") || type.includes("glass")) {
        setSelectedTargetType("wetting");
      } else {
        setSelectedTargetType("detergent");
      }
    }
  }, [formulationResult]);

  // Synchronize target HLB when product category changes
  useEffect(() => {
    const type = productType.toLowerCase();
    if (type.includes("dishwash")) {
      setTargetHlb("13.0 - 15.0");
    } else if (type.includes("floor")) {
      setTargetHlb("11.0 - 13.0");
    } else if (type.includes("toilet")) {
      setTargetHlb("11.5 - 13.0");
    } else if (type.includes("glass")) {
      setTargetHlb("7.0 - 9.0");
    } else if (type.includes("car")) {
      setTargetHlb("12.5 - 14.0");
    } else if (type.includes("handwash")) {
      setTargetHlb("11.0 - 13.0");
    } else if (type.includes("anti-foam") || type.includes("antifoam")) {
      setTargetHlb("1.0 - 3.0");
    } else if (type.includes("softener") || type.includes("conditioner")) {
      setTargetHlb("9.0 - 12.0");
    } else if (type.includes("degreaser")) {
      setTargetHlb("12.5 - 14.5");
    } else {
      setTargetHlb("12.0 - 14.0"); // default for laundry
    }
  }, [productType]);

  // Calculation Helpers for Sandbox (Memoized for Phase 3B)
  const sandboxHlb = React.useMemo(() => {
    return calculateBlendedHLB(sandboxIngredients) || 0;
  }, [sandboxIngredients]);

  const sandboxCost = React.useMemo(() => {
    return calculateBatchCost(sandboxIngredients);
  }, [sandboxIngredients]);

  const sandboxActiveMatter = React.useMemo(() => {
    return calculateActiveMatter(sandboxIngredients);
  }, [sandboxIngredients]);

  const formulaActiveSurfactantPct = React.useMemo(() => {
    if (!formulationResult || !formulationResult.ingredients) return 15.0;
    const activeSurfsSum = calculateActiveMatter(formulationResult.ingredients);
    return activeSurfsSum > 0 ? Number(activeSurfsSum.toFixed(2)) : 15.0;
  }, [formulationResult]);

  const sandboxEcoMetrics = React.useMemo(() => {
    return calculateFormulationEcoMetrics(sandboxIngredients);
  }, [sandboxIngredients]);

  const formulationMixedCmc = React.useMemo(() => {
    return calculateMixedCmc(formulationResult?.ingredients || []);
  }, [formulationResult?.ingredients]);

  const formulationMixedHlb = React.useMemo(() => {
    return calculateBlendedHLB(formulationResult?.ingredients || []) || 0;
  }, [formulationResult?.ingredients]);

  const formulationActiveMatter = React.useMemo(() => {
    if (!formulationResult || !formulationResult.ingredients || formulationResult.ingredients.length === 0) return 0;
    return calculateActiveMatter(formulationResult.ingredients);
  }, [formulationResult?.ingredients]);

  const sandboxCompatibility = React.useMemo(() => {
    const numPH = parseFloat(formulationResult?.properties?.pH) || 7.5;
    return calculateFormulationCompatibility(sandboxIngredients, numPH).compatibilityScore;
  }, [sandboxIngredients, formulationResult?.properties?.pH]);

  const calculateSandboxHlb = React.useCallback(() => sandboxHlb, [sandboxHlb]);
  const calculateSandboxCost = React.useCallback(() => sandboxCost, [sandboxCost]);
  const calculateSandboxActiveMatter = React.useCallback(() => sandboxActiveMatter, [sandboxActiveMatter]);
  const getFormulaActiveSurfactantPct = React.useCallback(() => formulaActiveSurfactantPct, [formulaActiveSurfactantPct]);
  const calculateSandboxEcoMetrics = React.useCallback(() => sandboxEcoMetrics, [sandboxEcoMetrics]);

  const handleUpdatePercentage = (index: number, newPct: number) => {
    setSandboxIngredients(prev => {
      const list = JSON.parse(JSON.stringify(prev));
      const oldPct = list[index].percentage;
      const diff = newPct - oldPct;
      list[index].percentage = Number(Math.max(0, Math.min(100, newPct)).toFixed(2));

      if (autoBalanceWater) {
        const waterIdx = list.findIndex((ing: any) => 
          ing.name.toLowerCase().includes("water") || 
          ing.name.toLowerCase().includes("aqua") || 
          ing.role.toLowerCase().includes("solvent")
        );
        
        if (waterIdx !== -1 && waterIdx !== index) {
          const currentWaterPct = list[waterIdx].percentage;
          const targetWaterPct = Number((currentWaterPct - diff).toFixed(2));
          if (targetWaterPct >= 0) {
            list[waterIdx].percentage = targetWaterPct;
          } else {
            const maxAllowedNewPct = oldPct + currentWaterPct;
            list[index].percentage = Number(maxAllowedNewPct.toFixed(2));
            list[waterIdx].percentage = 0;
          }
        }
      }
      return list;
    });
  };

  const handleUpdateHlb = (index: number, newHlbStr: string) => {
    const parsed = newHlbStr === "" ? null : parseFloat(newHlbStr);
    setSandboxIngredients(prev => {
      const list = JSON.parse(JSON.stringify(prev));
      list[index].hlbValue = isNaN(parsed as any) || parsed === null ? null : Math.max(0, Math.min(20, parsed));
      return list;
    });
  };

  const handleAddSurfactant = (surfactant: any) => {
    setSandboxIngredients(prev => {
      if (prev.some(ing => ing.name.toLowerCase() === surfactant.name.toLowerCase())) {
        alert("This surfactant is already present in the formulation. You can adjust its percentage directly.");
        return prev;
      }
      const newIng = {
        name: surfactant.name,
        percentage: 0,
        role: surfactant.role + " / Custom Blend",
        costPerKg: surfactant.costPerKg,
        activeMatterPct: surfactant.activeMatterPct,
        hlbValue: surfactant.hlbValue
      };
      return [...prev, newIng];
    });
  };

  const handleDeleteIngredient = (index: number) => {
    setSandboxIngredients(prev => {
      const list = JSON.parse(JSON.stringify(prev));
      const removedPct = list[index].percentage;
      list.splice(index, 1);
      
      if (autoBalanceWater) {
        const waterIdx = list.findIndex((ing: any) => 
          ing.name.toLowerCase().includes("water") || 
          ing.name.toLowerCase().includes("aqua") || 
          ing.role.toLowerCase().includes("solvent")
        );
        if (waterIdx !== -1) {
          list[waterIdx].percentage = Number((list[waterIdx].percentage + removedPct).toFixed(2));
        }
      }
      return list;
    });
  };

  const handleApplyRedesign = () => {
    if (!formulationResult) return;
    const totalPct = sandboxIngredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);

    console.log("Applying custom redesign with total percentage:", totalPct.toFixed(2));

    const calculatedActiveMatter = calculateSandboxActiveMatter();
    const actualCost = calculateSandboxCost();

    // 1. pH Recalculation
    const phResult = calculateEstimatedPH(
      formulationResult.productType || "Laundry Liquid",
      formulationResult.name || "Custom Formulation",
      sandboxIngredients
    );
    const pH = phResult.estpH.toFixed(1);

    // 2. Cleaning Rating directly derived from authoritative calculateCleaningPerformance
    const numPH = parseFloat(pH) || 7.5;
    const cleaningRes = calculateCleaningPerformance(sandboxIngredients, numPH);
    const cleaningRating = cleaningRes.cleaningScore;

    // 3. Eco Rating based on OECD 301 and capped if there is any persistent pollutant or non-biodegradable surfactant
    const ecoRating = calculateCorrectedEcoRating(sandboxIngredients);

    // 4. Compatibility Score & Manufacturing Method directly derived from active formula
    const compRes = calculateFormulationCompatibility(sandboxIngredients, numPH);
    const compatibilityScore = compRes.compatibilityScore;
    const manufacturingMethod = generateDynamicMixingInstructions(
      sandboxIngredients,
      formulationResult?.productType || productType
    );

    const userTargetPH = formulationResult.targetedPH || (typeof targetpH !== 'undefined' && String(targetpH).trim() !== "" ? String(targetpH) : "6.0");

    const redesignedFormula = {
      ...formulationResult,
      ingredients: JSON.parse(JSON.stringify(sandboxIngredients)),
      calculatedHlb: calculateSandboxHlb().toString(),
      actualCost,
      activeMatter: calculatedActiveMatter,
      manufacturingMethod,
      targetedPH: userTargetPH,
      estimatedPH: pH,
      properties: {
        ...(formulationResult.properties || {}),
        pH,
        cleaningRating,
        ecoRating,
        compatibilityScore
      }
    };
    
    // Update the main formula state that controls the entire display
    setFormulationResult(redesignedFormula);
    if (onFormulaGenerated) {
      onFormulaGenerated({
        name: redesignedFormula.name || redesignedFormula.formulaName || "AI Generated Formula",
        ingredients: redesignedFormula.ingredients || [],
        batchSize: batchSize,
        productType: redesignedFormula.productType || productType,
        grade: redesignedFormula.grade || grade,
        targetCost: redesignedFormula.targetCost || targetCost,
        isDraft: true,
        status: "Draft"
      });
    }
  };

  const handleApplySandbox = handleApplyRedesign;

  const handleResetSandbox = () => {
    if (aiBaselineFormula && aiBaselineFormula.ingredients) {
      // 1. Replace all edited values with saved baseline values (fresh copies to trigger React reactivity)
      const baselineIngredientsCloned = JSON.parse(JSON.stringify(aiBaselineFormula.ingredients));
      const baselineFormulaCloned = JSON.parse(JSON.stringify(aiBaselineFormula));
      
      setSandboxIngredients(baselineIngredientsCloned);
      setFormulationResult(baselineFormulaCloned);
      
      // 2. Clear any temporary edited states or cached redesign data
      setAutoBalanceWater(true);
      
      // 3. Force UI to re-render immediately by refreshing blenderSurfactants to match baseline
      const surfs = baselineIngredientsCloned.filter((ing: any) => {
        const role = (ing.role || "").toLowerCase();
        return role.includes("surfactant") || 
               role.includes("detergent") || 
               role.includes("emulsifier") || 
               role.includes("foam booster") || 
               (ing.hlbValue !== undefined && ing.hlbValue !== null);
      });
      if (surfs.length > 0) {
        setBlenderSurfactants(surfs.map((s: any) => ({
          name: s.name,
          hlbValue: s.hlbValue ?? 12.0,
          proportion: s.percentage,
          activeMatterPct: s.activeMatterPct ?? 100,
          role: s.role || "Surfactant"
        })));
      }
      
      // 4. Alert user about successful reset (supports language settings)
      const isHindi = lang === "hi";
      const isMarathi = lang === "mr";
      alert(
        isHindi
          ? "सफलतापूर्वक मूल AI बेसलाइन फॉर्मूला पर रीसेट कर दिया गया है!"
          : isMarathi
          ? "मूळ AI बेसलाइन फॉर्म्युला यशस्वीरित्या रीसेट केला गेला आहे!"
          : "Formulation has been successfully reset to the original AI baseline!"
      );
    } else {
      // 5. Clear redesign data but inform the user that no baseline exists
      const isHindi = lang === "hi";
      const isMarathi = lang === "mr";
      alert(
        isHindi
          ? "कोई AI बेसलाइन फॉर्मूला उपलब्ध नहीं है। कृपया पहले फॉर्मूला जनरेट या विश्लेषण करें।"
          : isMarathi
          ? "कोणताही AI बेसलाइन फॉर्म्युला उपलब्ध नाही. कृपया आधी फॉर्म्युला जनरेट किंवा विश्लेषित करा."
          : "No AI baseline formulation exists to reset to. Please analyze or generate a formula first."
      );
    }
  };

  const handleSaveFormulaToLibrary = () => {
    if (!formulationResult) return;
    setSaveFormulaName(formulationResult.name || "");
    setSaveFormulaGrade(formulationResult.grade || "Standard");
    setShowSaveModal(true);
  };

  const handleConfirmSaveFormula = () => {
    if (!formulationResult) return;
    
    const id = `custom-formula-${Date.now()}`;
    const savedMetrics = calculateDetailedMetrics(formulationResult?.ingredients || [], formulationResult?.productType || productType);
    const newFormula = {
      id,
      name: saveFormulaName.trim() || formulationResult.name,
      productType: formulationResult.productType || productType,
      grade: saveFormulaGrade,
      targetCost: formulationResult.targetCost || targetCost,
      actualCost: formulationResult.actualCost,
      activeMatter: formulationResult.activeMatter,
      properties: {
        pH: formulationResult.properties?.pH || "7.5 - 8.5",
        viscosity: formulationResult.properties?.viscosity || "1500 - 2500 cPs",
        foamHeight: formulationResult.properties?.foamHeight || "Medium Foam",
        cleaningRating: savedMetrics.cleaningRating,
        ecoRating: formulationResult.properties?.ecoRating || 80,
        compatibilityScore: savedMetrics.compatibilityScore
      },
      ingredients: JSON.parse(JSON.stringify(formulationResult?.ingredients || [])),
      manufacturingMethod: formulationResult.manufacturingMethod || [
        { order: 1, action: "Charge water into clean mixer. Start agitation.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Wear PPE." },
        { order: 2, action: "Slowly add ingredients in the designated order under continuous stirring.", mixingTime: "20 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Handle raw chemicals with care." }
      ],
      commonMistakes: formulationResult.commonMistakes || [
        "Incorrect order of addition can lead to physical instability or phase separation."
      ],
      troubleshootingNotes: formulationResult.troubleshootingNotes || [
        "Adjust pH if formulation separates. Build viscosity with salt/electrolyte slowly."
      ],
      packagingCompatibility: formulationResult.packagingCompatibility || "HDPE / PET container"
    };

    // Read current saved list
    const saved = localStorage.getItem("detergent_rd_saved_formulas_v2");
    let currentList: any[] = [];
    if (saved) {
      try {
        currentList = JSON.parse(saved);
      } catch (e) {
        currentList = [...FORMULAS];
      }
    } else {
      currentList = [...FORMULAS];
    }

    const savedList = [newFormula, ...currentList];
    localStorage.setItem("detergent_rd_saved_formulas_v2", JSON.stringify(savedList));
    
    if (onFormulaGenerated) {
      onFormulaGenerated({
        name: newFormula.name,
        ingredients: newFormula.ingredients || [],
        batchSize: batchSize,
        productType: newFormula.productType,
        grade: newFormula.grade,
        targetCost: newFormula.targetCost,
        isDraft: false,
        status: "Saved"
      });
    }
    
    setShowSaveModal(false);
    
    const isHindi = lang === "hi";
    const isMarathi = lang === "mr";
    
    alert(
      isHindi 
        ? `फॉर्मूला "${newFormula.name}" को सफलतापूर्वक लाइब्रेरी में सहेज लिया गया है!` 
        : isMarathi 
        ? `फॉर्म्युला "${newFormula.name}" लायब्ररीमध्ये यशस्वीरित्या जतन केला गेला आहे!` 
        : `Formulation "${newFormula.name}" has been successfully saved to your Formulation Library!`
    );
  };

  // Troubleshooting state
  const [troubleQuery, setTroubleQuery] = useState("");
  const [isTroubleshooting, setIsTroubleshooting] = useState(false);
  const [troubleResult, setTroubleResult] = useState<any>(null);

  // Chatbot state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; content: string }>>([
    {
      role: "ai",
      content: "Hello! I am your AI Detergent R&D Assistant. Ask me anything about chemical formulations, surfactant HLB values, batch neutralization calculations, or GHS safety rules."
    }
  ]);
  const [isChatting, setIsChatting] = useState(false);

  const handleClearAllCheck = () => {
    setCheckIngredients([]);
  };

  // Run AI Formulation Generator
  const handleGenerateFormula = async () => {
    setIsFormulating(true);
    try {
      const response = await fetch("/api/ai/formulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: activeSubTab,
          ingredients: activeSubTab === "check" ? checkIngredients : undefined,
          batchSize: activeSubTab === "check" ? batchSize : undefined,
          productType,
          productCategory: productType,
          targetCost,
          targetpH,
          targetPH: targetpH,
          targetFoam,
          foamingProfile: targetFoam,
          targetViscosity,
          ecoRequirement,
          ecoRatingRule: ecoRequirement,
          grade,
          qualityGrade: grade,
          availableIngredients,
          targetActiveMatter,
          activeMatter: targetActiveMatter,
          targetHlb,
          waterHardnessPpm,
          waterHardness: waterHardnessPpm
        })
      });
      const data = await response.json();
      if (data.success && data.formula) {
        // Rule #8: strip any AI-supplied ingredient prices before use.
        // Only user-entered prices are permitted; AI must not invent, guess, or overwrite prices.
        if (Array.isArray(data.formula.ingredients)) {
          data.formula.ingredients = data.formula.ingredients.map((ing: any) => {
            if (ing && typeof ing === "object") {
              const { costPerKg: _stripped, ...rest } = ing;
              return rest;
            }
            return ing;
          });
        }
        let totalCost = 0;
        if (data.formula.ingredients) {
          data.formula.ingredients.forEach((ing: any) => {
            totalCost += (ing.percentage / 100) * (ing.costPerKg || 0);
          });
        }
        data.formula.actualCost = Number(totalCost.toFixed(2));
        const ecoRating = calculateCorrectedEcoRating(data.formula.ingredients || []);
        data.formula.ecoRating = ecoRating;
        const userTargetPHStr = (typeof targetpH !== 'undefined' && targetpH !== null && String(targetpH).trim() !== "")
          ? String(targetpH)
          : "6";
        const estimatedVal = String(data.formula.estimatedPH || data.formula.pH || data.formula.properties?.pH || userTargetPHStr);

        const updatedFormula = {
          ...data.formula,
          // Explicit pH overrides for UI display & validation consistency
          targetedPH: userTargetPHStr,
          targetpH: userTargetPHStr,
          estimatedPH: estimatedVal,
          pH: estimatedVal,
          calculatedPH: estimatedVal,
          validationPH: estimatedVal,
          properties: {
            ...data.formula.properties,
            pH: estimatedVal
          }
        };
        setFormulationResult(updatedFormula);
        setAiBaselineFormula(JSON.parse(JSON.stringify(updatedFormula)));
        if (onFormulaGenerated) {
          onFormulaGenerated({
            name: updatedFormula.name || updatedFormula.formulaName || "AI Generated Formula",
            ingredients: updatedFormula.ingredients || [],
            batchSize: batchSize,
            productType: updatedFormula.productType || productType,
            grade: updatedFormula.grade || grade,
            targetCost: updatedFormula.targetCost || targetCost,
            isDraft: true,
            status: "Draft"
          });
        }
      } else {
        alert("Failed to generate or audit formula.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting the AI formulation server.");
    } finally {
      setIsFormulating(false);
    }
  };

  // Run AI Troubleshooter
  const handleTroubleshoot = async () => {
    if (!troubleQuery.trim()) return;
    setIsTroubleshooting(true);
    try {
      const response = await fetch("/api/ai/troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: troubleQuery,
          productContext: { productType, grade }
        })
      });
      const data = await response.json();
      if (data.success) {
        setTroubleResult(data.troubleshoot);
      } else {
        alert("Troubleshooting failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting the troubleshooting server.");
    } finally {
      setIsTroubleshooting(false);
    }
  };

  // Run AI Chat
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user" as const, content: userMsg }];
    setChatHistory(newHistory);
    setIsChatting(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: newHistory.map(h => ({ role: h.role, content: h.content }))
        })
      });
      const data = await response.json();
      setChatHistory([...newHistory, { role: "ai" as const, content: data.reply }]);
    } catch (e) {
      console.error(e);
      setChatHistory([...newHistory, { role: "ai" as const, content: "Error: Could not reach the AI server." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const loadPreTroubleshoot = (q: string) => {
    setTroubleQuery(q);
  };

  return (
    <div className="h-full flex flex-col" id="ai-formulator-root">
      {/* Top Header */}
      <div className="p-4 border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#0f766e] flex items-center gap-2">
            🤖 {translations[lang].aiFormulator}
          </h2>
          <p className="text-xs text-gray-500">
            {translations[lang].aiFormulatorDesc || "Gemini-powered detergent expert laboratory"}
          </p>
        </div>
        
        {/* Navigation within AI expert tool */}
        <div className="flex flex-wrap bg-[#f3f4f6] p-1 rounded-lg self-start max-w-full gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveMainTab("formulation");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeMainTab === "formulation" ? "bg-white text-[#0f766e] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Formulation Lab
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveMainTab("troubleshoot");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeMainTab === "troubleshoot" ? "bg-white text-[#0f766e] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            AI Troubleshooter
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveMainTab("chat");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeMainTab === "chat" ? "bg-white text-[#0f766e] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            R&D Chatbot
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f9fafb]">
        {activeMainTab === "formulation" && (
          <>
            {/* SECTION 1: AI FORMULA INPUT PANEL */}
            <div className="w-full md:w-80 border-r border-[#e5e7eb] bg-white p-4 overflow-y-auto space-y-4 shrink-0">
              <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-3 py-2 text-center">
                <span className="text-[11px] font-extrabold tracking-wider block uppercase">
                  ⚙️ SECTION 1: AI FORMULA INPUT PANEL
                </span>
              </div>
              {/* Formulation Mode Sub-Tabs */}
              <div className="flex bg-[#f3f4f6] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("design")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    activeSubTab === "design"
                      ? "bg-white text-[#0f766e] shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span>🤖</span> AI Designer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("check")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    activeSubTab === "check"
                      ? "bg-white text-[#0f766e] shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span>🔍</span> Check Formula
                </button>
              </div>

              {activeSubTab === "design" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Formulation Parameters
                    </h3>
                    <button
                      type="button"
                      onClick={handleResetLab}
                      title="Reset all settings to default"
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Product Category</label>
                      <select
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                      >
                        <option value="Laundry Liquid">Laundry Liquid</option>
                        <option value="Laundry Powder">Laundry Powder</option>
                        <option value="Dishwash Liquid">Dishwash Liquid</option>
                        <option value="Floor Cleaner">Floor Cleaner</option>
                        <option value="Toilet Cleaner">Toilet Cleaner</option>
                        <option value="Glass Cleaner">Glass Cleaner</option>
                        <option value="Car Shampoo">Car Shampoo</option>
                        <option value="Liquid Handwash">Liquid Handwash</option>
                        <option value="Anti-foaming Agent">Anti-foaming Agent</option>
                        <option value="Fabric Softener & Conditioner">Fabric Softener & Conditioner</option>
                        <option value="Heavy-Duty Degreaser">Heavy-Duty Degreaser</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Target Quality Grade</label>
                        <select
                          value={grade}
                          onChange={(e) => setGrade(e.target.value as any)}
                          className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        >
                          <option value="Economy">Economy</option>
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Target Cost (INR/kg)</label>
                        <input
                          type="number"
                          value={targetCost}
                          onChange={(e) => setTargetCost(Number(e.target.value))}
                          className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Target pH</label>
                        <input
                          type="text"
                          value={targetpH}
                          onChange={(e) => setTargetpH(e.target.value)}
                          placeholder="e.g. 7.0 - 8.0"
                          className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Target Viscosity</label>
                        <input
                          type="text"
                          value={targetViscosity}
                          onChange={(e) => setTargetViscosity(e.target.value)}
                          placeholder="e.g. 1500 cPs"
                          className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Foaming Profile</label>
                        <select
                          value={targetFoam}
                          onChange={(e) => setTargetFoam(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        >
                          <option value="High Foam">High Foam</option>
                          <option value="Medium Foam">Medium Foam</option>
                          <option value="Low Foam">Low Foam</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Eco Rating Rule</label>
                        <select
                          value={ecoRequirement}
                          onChange={(e) => setEcoRequirement(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        >
                          <option value="Standard Eco">{ECO_LABELS[lang].standardEco}</option>
                          <option value="Eco-Friendly Only">{ECO_LABELS[lang].ecoFriendly}</option>
                          <option value="Petroleum Free">{ECO_LABELS[lang].petroleumFree}</option>
                          <option value="Synthetic">{ECO_LABELS[lang].synthetic}</option>
                          <option value="Eco">{ECO_LABELS[lang].eco}</option>
                          <option value="Semi-Synthetic">{ECO_LABELS[lang].semiSynthetic}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        {lang === "hi" ? "लक्षित एक्टिव मैटर % (Target Active Matter %)" : lang === "mr" ? "लक्षित ॲक्टिव्ह मॅटर % (Target Active Matter %)" : "Target Active Matter (%)"}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={60}
                          step={0.5}
                          value={targetActiveMatter}
                          onChange={(e) => setTargetActiveMatter(Number(e.target.value))}
                          className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none font-mono font-semibold"
                        />
                        <span className="text-gray-500 font-medium font-mono text-xs">%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {lang === "hi" ? "अपनी पसंद का सक्रिय सर्फेक्टेंट प्रतिशत निर्धारित करें (उदा: 5% - 35%)" : lang === "mr" ? "तुमच्या आवडीचे सक्रिय सर्फेक्टेंट टक्केवारी सेट करा (उदा: 5% - 35%)" : "Set your desired active surfactant percentage (e.g. 5% - 35%)"}
                      </p>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        {lang === "hi" 
                          ? "लक्षित HLB मान (Target HLB Range/Value)" 
                          : lang === "mr" 
                          ? "लक्षित HLB मूल्य (Target HLB Range/Value)" 
                          : "Target HLB Range / Value"}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={targetHlb}
                          onChange={(e) => setTargetHlb(e.target.value)}
                          placeholder="e.g. 12.0 - 14.0"
                          className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none font-semibold font-mono"
                        />
                        <select
                          onChange={(e) => {
                            if (e.target.value) setTargetHlb(e.target.value);
                          }}
                          className="bg-gray-50 border border-[#e5e7eb] rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none text-[11px] font-semibold text-gray-900 cursor-pointer"
                          value=""
                        >
                          <option value="" disabled>Presets</option>
                          <option value="12.0 - 14.0">12 - 14 (Laundry)</option>
                          <option value="13.0 - 15.0">13 - 15 (Dishwash)</option>
                          <option value="11.0 - 13.0">11 - 13 (Floor)</option>
                          <option value="12.5 - 14.5">12.5 - 14.5 (Degreaser)</option>
                          <option value="9.0 - 12.0">9 - 12 (Softener)</option>
                          <option value="7.0 - 9.0">7 - 9 (Glass Cleaner)</option>
                          <option value="1.0 - 3.0">1 - 3 (Anti-Foam)</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {lang === "hi" 
                          ? "चयनित उत्पाद के लिए उपयुक्त HLB निर्धारित करें (उदा: 12.0 - 14.0)" 
                          : lang === "mr" 
                          ? "निवडलेल्या उत्पादनासाठी योग्य HLB निश्चित करा (उदा: 12.0 - 14.0)" 
                          : "Specify target surfactant HLB or select from standard presets."}
                      </p>
                    </div>

                    <div id="ai-water-hardness-control" className="space-y-1.5 border border-emerald-100 bg-emerald-50/10 p-3 rounded-lg">
                      <label className="block font-medium text-gray-700 flex justify-between items-center">
                        <span>
                          {lang === "hi" 
                            ? "पानी की कठोरता (Water Hardness)" 
                            : lang === "mr" 
                            ? "पाण्याची कठीणता (Water Hardness)" 
                            : "Water Hardness (CaCO₃ equivalent)"}
                        </span>
                        <span className="font-mono text-emerald-700 font-bold text-xs">{waterHardnessPpm} ppm</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={10}
                          max={500}
                          step={10}
                          value={waterHardnessPpm}
                          onChange={(e) => setWaterHardnessPpm(Number(e.target.value))}
                          className="w-full accent-[#0f766e]"
                        />
                      </div>
                      {/* Quick selection buttons */}
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {[
                          { val: 50, label: "Soft", labelHi: "हल्का", labelMr: "सौम्य" },
                          { val: 150, label: "Medium", labelHi: "मध्यम", labelMr: "मध्यम" },
                          { val: 250, label: "Hard", labelHi: "कड़ा", labelMr: "कठीण" },
                          { val: 400, label: "V.Hard", labelHi: "भारी", labelMr: "अति कठीण" }
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            type="button"
                            onClick={() => setWaterHardnessPpm(btn.val)}
                            className={`py-1 px-0.5 rounded text-[10px] font-bold border transition-all ${
                              waterHardnessPpm === btn.val
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {btn.val} ({lang === "hi" ? btn.labelHi : lang === "mr" ? btn.labelMr : btn.label})
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-400 leading-normal">
                        {lang === "hi" 
                          ? "💡 उच्च कठोरता (ppm) के लिए AI ग्रीन चेलेटर और बिल्डर (जैसे GLDA/सोडियम ग्लुकोनेट) का प्रतिशत स्वचालित रूप से बढ़ा देगा।" 
                          : lang === "mr" 
                          ? "💡 उच्च कठीणतेसाठी (ppm) AI ग्रीन चेलेटर आणि बिल्डरचे (उदा: GLDA/सोडियम ग्लुकोनेट) प्रमाण स्वयंचलितपणे वाढवेल।" 
                          : "💡 AI automatically scales eco-chelator & builder (GLDA/Gluconate) to neutralize high divalent mineral loads."}
                      </p>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        {lang === "hi" 
                          ? "लैब में उपलब्ध कच्चे माल (सामग्री)" 
                          : lang === "mr" 
                          ? "लॅबमध्ये उपलब्ध कच्चा माल (साहित्य)" 
                          : "Available Lab Raw Materials"}
                      </label>
                      <textarea
                        rows={3}
                        value={availableIngredients}
                        onChange={(e) => setAvailableIngredients(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg p-2.5 focus:ring-1 focus:ring-[#0f766e] focus:outline-none text-sm"
                        placeholder={
                          lang === "hi"
                            ? "जैसे: LABSA, SLES, CAPB, Salt, Soda, Citric Acid..."
                            : lang === "mr"
                            ? "उदा: LABSA, SLES, CAPB, Salt, Soda, Citric Acid..."
                            : "e.g., LABSA, SLES, CAPB, Salt, Soda, Citric Acid..."
                        }
                      />
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        {lang === "hi" 
                          ? "💡 AI केवल आपके लिखे हुए माल से फार्मूला बनाएगा। खाली छोड़ने पर पूरे रासायनिक डेटाबेस से सबसे बेहतरीन फार्मूला बनेगा। पानी, pH न्यूट्रलाइज़र और प्रिजर्वेटिव (सड़ने से बचाने के लिए) हमेशा सुरक्षा के लिए अपने आप जोड़े जाएंगे।" 
                          : lang === "mr" 
                          ? "💡 AI फक्त तुम्ही लिहिलेल्या साहित्यातून फॉर्म्युला बनवेल. रिकामे ठेवल्यास संपूर्ण डेटाबेसमधून सर्वोत्तम फॉर्म्युला बनेल. पाणी, pH न्यूट्रलायझर आणि प्रिजर्व्हेटिव्ह (खराब होण्यापासून वाचवण्यासाठी) नेहमी सुरक्षिततेसाठी स्वयंचलितपणे जोडले जातील।" 
                          : "💡 AI restricts formulation to listed materials. Leave empty to let AI design using the full industry chemical database. Water, pH adjusters, and preservative are always automatically added for safety and stability."}
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateFormula}
                      disabled={isFormulating}
                      className="w-full bg-[#0f766e] text-white hover:bg-[#0d645c] py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50"
                    >
                      {isFormulating ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Synthesizing with AI...
                        </>
                      ) : (
                        <>
                          <Cpu size={14} /> Calculate & Formulate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-2 border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Check My Formula Parameters
                      </h3>
                      <button
                        type="button"
                        onClick={handleResetLab}
                        title="Reset all settings to default"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block font-medium text-gray-700 mb-0.5">Product Category</label>
                        <select
                          value={productType}
                          onChange={(e) => setProductType(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                        >
                          <option value="Laundry Liquid">Laundry Liquid</option>
                          <option value="Laundry Powder">Laundry Powder</option>
                          <option value="Dishwash Liquid">Dishwash Liquid</option>
                          <option value="Floor Cleaner">Floor Cleaner</option>
                          <option value="Toilet Cleaner">Toilet Cleaner</option>
                          <option value="Glass Cleaner">Glass Cleaner</option>
                          <option value="Car Shampoo">Car Shampoo</option>
                          <option value="Liquid Handwash">Liquid Handwash</option>
                          <option value="Anti-foaming Agent">Anti-foaming Agent</option>
                          <option value="Fabric Softener & Conditioner">Fabric Softener & Conditioner</option>
                          <option value="Heavy-Duty Degreaser">Heavy-Duty Degreaser</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-0.5">Batch Size (kg)</label>
                        <input
                          type="number"
                          value={batchSize}
                          onChange={(e) => setBatchSize(Number(e.target.value) || 100)}
                          className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#0f766e] focus:outline-none font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ingredient list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Ingredients list</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckIngredients([
                            ...checkIngredients,
                            { name: "", percentage: 0, activeMatterPct: 100 }
                          ]);
                        }}
                        className="flex items-center gap-1 bg-[#0f766e] text-white hover:bg-[#0d645c] px-2 py-1 rounded text-[10px] font-bold shadow-xs transition-all animate-pulse"
                      >
                        <Plus size={10} /> Add Ingredient
                      </button>
                    </div>

                    {checkIngredients.length === 0 ? (
                      <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 text-[11px]">
                        No ingredients added yet. Click "+ Add Ingredient" to begin.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {CATEGORY_ORDER.map((catName) => {
                          const itemsWithIndex = checkIngredients
                            .map((ing, idx) => ({ ...ing, originalIndex: idx }))
                            .filter(ing => getAuditedIngredientCategory(ing.name) === catName);

                          if (itemsWithIndex.length === 0) return null;

                          return (
                            <div key={catName} className="space-y-1.5 border border-dashed border-gray-150 p-2 rounded-lg bg-gray-50/30">
                              <div className="text-[9px] font-extrabold text-teal-850 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                                {catName}
                              </div>
                              <div className="space-y-2">
                                {itemsWithIndex.map(({ name, percentage, activeMatterPct, originalIndex }) => {
                                  const isSurf = isSurfactant(name) || name.toLowerCase().includes("naoh") || name.toLowerCase().includes("caustic") || name.toLowerCase().includes("hydroxide") || name.toLowerCase().includes("labsa") || name.toLowerCase().includes("lye") || name.toLowerCase().includes("acid") || activeMatterPct !== undefined;
                                  return (
                                    <div key={originalIndex} className="p-2 border border-[#e5e7eb] rounded-lg bg-white space-y-1.5 relative shadow-xs">
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex-1 min-w-0">
                                           <CategoryIngredientSelector
                                             catName={catName}
                                             name={name}
                                             onSelectChange={(val) => {
                                               const list = [...checkIngredients];
                                               list[originalIndex].name = val;
                                               list[originalIndex].activeMatterPct = getDefaultActiveMatter(val);
                                               setCheckIngredients(list);
                                             }}
                                           />
                                         </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCheckIngredients(prev => prev.filter((_, i) => i !== originalIndex));
                                          }}
                                          className="text-gray-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                                        <div className="min-w-0">
                                          <label className="block text-gray-500 font-medium mb-0.5 truncate" title="Raw %">Raw %</label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={percentage}
                                            onChange={(e) => {
                                              const list = [...checkIngredients];
                                              list[originalIndex].percentage = Number(e.target.value) || 0;
                                              setCheckIngredients(list);
                                            }}
                                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-0.5 py-0.5 text-center font-mono font-bold focus:outline-none min-w-0 text-[10px]"
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <label className="block text-gray-500 font-medium mb-0.5 truncate" title="Active %">Active %</label>
                                          {isSurf ? (
                                            <div className="relative">
                                              <input
                                                type="number"
                                                step="1"
                                                min="1"
                                                max="100"
                                                value={activeMatterPct === undefined || activeMatterPct === null || isNaN(activeMatterPct) ? "" : activeMatterPct}
                                                placeholder={String(getDefaultActiveMatter(name))}
                                                onChange={(e) => {
                                                  const list = [...checkIngredients];
                                                  const valStr = e.target.value;
                                                  list[originalIndex].activeMatterPct = valStr === "" ? undefined : Number(valStr);
                                                  setCheckIngredients(list);
                                                }}
                                                className={`w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border ${
                                                  activeMatterPct === undefined || activeMatterPct === null || isNaN(activeMatterPct) || activeMatterPct === 0 ? "border-red-500 ring-1 ring-red-500" : "border-[#e5e7eb]"
                                                } rounded px-1 py-0.5 text-center font-mono focus:outline-none`}
                                              />
                                              {(activeMatterPct === undefined || activeMatterPct === null || isNaN(activeMatterPct) || activeMatterPct === 0) && (
                                                <div className="text-[8px] text-red-600 font-bold mt-0.5 text-center leading-none animate-pulse">
                                                  Active % required
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="w-full bg-gray-100 border border-gray-200 rounded py-0.5 text-center text-gray-400 font-mono select-none">
                                              N/A
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <label className="block text-gray-500 font-medium mb-0.5 truncate" title="Weight (kg)">Weight (kg)</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={(() => {
                                              const p = Number(percentage) || 0;
                                              const b = Number(batchSize) || 0;
                                              const w = (p * b) / 100;
                                              return isNaN(w) ? "0.00" : Number(w.toFixed(2));
                                            })()}
                                            onChange={(e) => {
                                              const list = [...checkIngredients];
                                              const weightVal = Number(e.target.value);
                                              const bSize = Number(batchSize) || 1;
                                              const calcPct = isNaN(weightVal) ? 0 : Number(((weightVal / bSize) * 100).toFixed(2)) || 0;
                                              list[originalIndex].percentage = isNaN(calcPct) ? 0 : calcPct;
                                              setCheckIngredients(list);
                                            }}
                                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-0.5 py-0.5 text-center font-mono focus:outline-none min-w-0 text-[10px]"
                                          />
                                        </div>
                                      </div>

                                      {(() => {
                                        const category = getAuditedIngredientCategory(name);
                                        const isElectrolyte = category === "Electrolytes & Viscosity Modifiers" || name.toLowerCase().includes("salt") || name.toLowerCase().includes("sodium chloride") || name.toLowerCase().includes("electrolyte");
                                        if (!isElectrolyte) return null;

                                        const percentageVal = Number(percentage) || 0;
                                        const threshold = 2.5;
                                        const headroomPct = Math.min(100, (percentageVal / threshold) * 100);
                                        
                                        let barColor = "bg-emerald-500";
                                        let textColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                                        if (percentageVal >= threshold) {
                                          barColor = "bg-red-500";
                                          textColor = "text-red-700 bg-red-50 border-red-200";
                                        } else if (percentageVal > 2.0) {
                                          barColor = "bg-amber-500";
                                          textColor = "text-amber-700 bg-amber-50 border-amber-200";
                                        }

                                        return (
                                          <div className="mt-2 p-1.5 rounded border border-gray-150 text-[10px] space-y-1 bg-gray-50/50">
                                            <div className="flex justify-between items-center font-semibold">
                                              <span className="text-gray-500">Salt-Curve Headroom:</span>
                                              <span className={`px-1.5 py-0.2 rounded border font-mono font-bold ${textColor}`}>
                                                {headroomPct.toFixed(0)}%
                                              </span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                                              <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${headroomPct}%` }}></div>
                                            </div>
                                            {percentageVal >= threshold && (
                                              <div className="text-[9px] text-red-600 font-bold">
                                                ⚠️ Salt threshold breached (2.5%). Viscosity may collapse!
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Uncategorized Fallback */}
                        {(() => {
                          const otherItemsWithIndex = checkIngredients
                            .map((ing, idx) => ({ ...ing, originalIndex: idx }))
                            .filter(ing => !CATEGORY_ORDER.includes(getAuditedIngredientCategory(ing.name)));

                          if (otherItemsWithIndex.length === 0) return null;

                          return (
                            <div className="space-y-1.5 border border-dashed border-gray-150 p-2 rounded-lg bg-gray-50/30">
                              <div className="text-[9px] font-extrabold text-teal-850 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                                Uncategorized / Additives
                              </div>
                              <div className="space-y-2">
                                {otherItemsWithIndex.map(({ name, percentage, activeMatterPct, originalIndex }) => {
                                  const isSurf = isSurfactant(name) || name.toLowerCase().includes("naoh") || name.toLowerCase().includes("caustic") || name.toLowerCase().includes("hydroxide") || name.toLowerCase().includes("labsa") || name.toLowerCase().includes("lye") || name.toLowerCase().includes("acid") || activeMatterPct !== undefined;
                                  return (
                                    <div key={originalIndex} className="p-2 border border-[#e5e7eb] rounded-lg bg-white space-y-1.5 relative shadow-xs">
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex-1 min-w-0">
                                           <CategoryIngredientSelector
                                             catName="Uncategorized / Additives"
                                             name={name}
                                             onSelectChange={(val) => {
                                               const list = [...checkIngredients];
                                               list[originalIndex].name = val;
                                               list[originalIndex].activeMatterPct = getDefaultActiveMatter(val);
                                               setCheckIngredients(list);
                                             }}
                                           />
                                         </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCheckIngredients(prev => prev.filter((_, i) => i !== originalIndex));
                                          }}
                                          className="text-gray-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                                        <div className="min-w-0">
                                          <label className="block text-gray-500 font-medium mb-0.5 truncate" title="Raw %">Raw %</label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={percentage}
                                            onChange={(e) => {
                                              const list = [...checkIngredients];
                                              list[originalIndex].percentage = Number(e.target.value) || 0;
                                              setCheckIngredients(list);
                                            }}
                                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-0.5 py-0.5 text-center font-mono font-bold focus:outline-none min-w-0 text-[10px]"
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <label className="block text-gray-500 font-medium mb-0.5 truncate" title="Active %">Active %</label>
                                          {isSurf ? (
                                            <div className="relative">
                                              <input
                                                type="number"
                                                step="1"
                                                min="1"
                                                max="100"
                                                value={activeMatterPct === undefined || activeMatterPct === null || isNaN(activeMatterPct) ? "" : activeMatterPct}
                                                placeholder={String(getDefaultActiveMatter(name))}
                                                onChange={(e) => {
                                                  const list = [...checkIngredients];
                                                  const valStr = e.target.value;
                                                  list[originalIndex].activeMatterPct = valStr === "" ? undefined : Number(valStr);
                                                  setCheckIngredients(list);
                                                }}
                                                className={`w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border ${
                                                  activeMatterPct === undefined || activeMatterPct === null || isNaN(activeMatterPct) || activeMatterPct === 0 ? "border-red-500 ring-1 ring-red-500" : "border-[#e5e7eb]"
                                                } rounded px-1 py-0.5 text-center font-mono focus:outline-none`}
                                              />
                                              {(activeMatterPct === undefined || activeMatterPct === null || isNaN(activeMatterPct) || activeMatterPct === 0) && (
                                                <div className="text-[8px] text-red-600 font-bold mt-0.5 text-center leading-none animate-pulse">
                                                  Active % required
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="w-full bg-gray-100 border border-gray-200 rounded py-0.5 text-center text-gray-400 font-mono select-none">
                                              N/A
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <label className="block text-gray-500 font-medium mb-0.5 truncate" title="Weight (kg)">Weight (kg)</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={(() => {
                                              const p = Number(percentage) || 0;
                                              const b = Number(batchSize) || 0;
                                              const w = (p * b) / 100;
                                              return isNaN(w) ? "0.00" : Number(w.toFixed(2));
                                            })()}
                                            onChange={(e) => {
                                              const list = [...checkIngredients];
                                              const weightVal = Number(e.target.value);
                                              const bSize = Number(batchSize) || 1;
                                              const calcPct = isNaN(weightVal) ? 0 : Number(((weightVal / bSize) * 100).toFixed(2)) || 0;
                                              list[originalIndex].percentage = isNaN(calcPct) ? 0 : calcPct;
                                              setCheckIngredients(list);
                                            }}
                                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-0.5 py-0.5 text-center font-mono focus:outline-none min-w-0 text-[10px]"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Calculations & Totals Panel */}
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Total Raw %:</span>
                      <span className={`font-mono font-bold ${
                        Number(checkIngredients.reduce((sum, ing) => sum + ing.percentage, 0).toFixed(2)) === 100
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}>
                        {checkIngredients.reduce((sum, ing) => sum + ing.percentage, 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Raw Surfactants:</span>
                      <span className="font-mono font-bold text-gray-700">
                        {calculateRawSurfactants(checkIngredients).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Active Surfactants:</span>
                      <span className="font-mono font-bold text-[#0f766e]">
                        {calculateActiveSurfactants(checkIngredients).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Total Active Matter:</span>
                      <span className="font-mono font-bold text-teal-800">
                        {calculateActiveMatter(checkIngredients).toFixed(2)}%
                      </span>
                    </div>

                    {Number(checkIngredients.reduce((sum, ing) => sum + ing.percentage, 0).toFixed(2)) !== 100 && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100 font-medium mt-1 leading-normal">
                        💡 Water / carrier backfill will automatically balance this to 100% when analyzed!
                      </div>
                    )}

                    {(() => {
                      const checkDuplicates = detectCheckDuplicates();
                      const hasDuplicates = checkDuplicates.length > 0;
                      if (!hasDuplicates) return null;
                      return (
                        <div className="text-[10px] text-red-700 bg-red-50 p-2 rounded border border-red-100 font-semibold mt-1.5 leading-normal flex items-start gap-1">
                          <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <strong>Duplicate ingredient:</strong> {checkDuplicates.map(d => `${d.name}${d.casNumber ? ` (CAS: ${d.casNumber})` : ""}`).join(", ")} has been added multiple times. Merge these rows to avoid faulty calculation results.
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Analyze Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAllCheck}
                      className="flex-1 bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-200 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                    >
                      <Trash2 size={14} /> Clear All Ingredients
                    </button>

                    {(() => {
                      const hasDuplicates = detectCheckDuplicates().length > 0;
                      return (
                        <button
                          type="button"
                          onClick={handleGenerateFormula}
                          disabled={isFormulating || checkIngredients.length === 0 || hasDuplicates}
                          className="flex-1 bg-[#0f766e] text-white hover:bg-[#0d645c] py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50"
                        >
                          {isFormulating ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" /> Auditing Recipe...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} /> Analyze My Formula
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Formulation Output Panel */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
              {formulationResult && Array.isArray(formulationResult.ingredients) && formulationResult.ingredients.length > 0 ? (
                <div className="space-y-6">
                  {/* SECTION 2: FORMULA SUMMARY DASHBOARD */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-sm transition-all space-y-4">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        📊 SECTION 2: FORMULA SUMMARY DASHBOARD
                      </span>
                      <span className="text-[10px] font-mono text-teal-200 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-600/40 font-semibold">
                        Status: Active / Ready
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 border-gray-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0f766e] px-2.5 py-0.5 rounded border border-teal-200">
                            AI Verified Formula (Grade: {formulationResult.grade})
                          </span>
                          <button
                            onClick={handleSaveFormulaToLibrary}
                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                            id="save-to-library-badge"
                          >
                            <Bookmark size={10} />
                            {lang === "hi" ? "लाइब्रेरी में सहेजें (Save)" : lang === "mr" ? "लायब्ररीमध्ये जतन करा (Save)" : "Save to Library"}
                          </button>
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mt-1">{formulationResult.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-mono mt-1">
                          <span>Category: <strong>{formulationResult.productType}</strong></span>
                          <span>Total Ingredients: <strong>{formulationResult.ingredients.length}</strong></span>
                          <span>Version: <strong>v1.0 (AI Synthesized)</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">Batch Size</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              value={batchSize}
                              onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value)))}
                              className="w-16 bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-bold font-mono text-center focus:ring-1 focus:ring-[#0f766e] focus:outline-none"
                            />
                            <span className="text-xs font-bold text-gray-700 font-mono">kg</span>
                          </div>
                        </div>
                        <div className="border-l border-gray-200 pl-3 text-right">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">Batch Material Cost</span>
                          <span className="text-xl font-extrabold text-[#0f766e] font-mono">
                            ₹{(() => {
                              let totalCost = 0;
                              sandboxIngredients.forEach((ing: any) => {
                                totalCost += (ing.percentage / 100) * (ing.costPerKg || 0);
                              });
                              return totalCost.toFixed(2);
                            })()} / kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: QUICK ACTION BAR */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-sm transition-all space-y-3">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-2.5 flex justify-between items-center">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        ⚡ SECTION 4: QUICK ACTION BAR
                      </span>
                      <span className="text-[10px] text-teal-200 font-mono bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-600/40 font-semibold">One-click R&D Workflows</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleGenerateFormula}
                        disabled={isFormulating}
                        className="text-xs bg-[#0f766e] hover:bg-[#0d645c] text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                      >
                        <Sparkles size={13} /> Re-Calculate Formula
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFormulaToLibrary}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Bookmark size={13} /> Save to Library
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCopiedInci(false);
                          setShowInciModal(true);
                        }}
                        className="text-xs bg-teal-50 border border-[#0f766e] text-[#0f766e] hover:bg-teal-100 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Dna size={13} /> Generate INCI / Label List
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyRedesign}
                        className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <CheckCircle size={13} /> Apply Custom Redesign
                      </button>
                      <button
                        type="button"
                        onClick={handleResetSandbox}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl font-bold border border-gray-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <RotateCcw size={13} /> Reset to AI Baseline
                      </button>
                      <button
                        type="button"
                        onClick={() => setSandboxTab("analyzer")}
                        className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Cpu size={13} /> Smart Analyzer Pro
                      </button>
                      <button
                        type="button"
                        onClick={() => setSandboxTab("substitution")}
                        className="text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <RefreshCw size={13} className="text-amber-600" /> Regional Raw Material Substitutions
                      </button>
                      <button
                        type="button"
                        onClick={() => setSandboxTab("climate")}
                        className="text-xs bg-cyan-50 text-cyan-900 hover:bg-cyan-100 border border-cyan-300 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <CloudSun size={13} className="text-cyan-700" /> Climate & Hard Water Engine
                      </button>
                      <button
                        type="button"
                        onClick={() => setSandboxTab("machine")}
                        className="text-xs bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-300 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <WashingMachine size={13} className="text-indigo-700" /> Machine Profile Intelligence
                      </button>
                      <button
                        type="button"
                        onClick={() => setSandboxTab("troubleshooter")}
                        className="text-xs bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-300 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Wrench size={13} className="text-rose-700" /> Root Cause Troubleshooter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy = `Formula: ${formulationResult.name}\nGrade: ${formulationResult.grade}\nCategory: ${formulationResult.productType}\nCost: ₹${(() => {
                            let totalCost = 0;
                            sandboxIngredients.forEach((ing: any) => {
                              totalCost += (ing.percentage / 100) * (ing.costPerKg || 0);
                            });
                            return totalCost.toFixed(2);
                          })()}/kg\nIngredients:\n${(formulationResult.ingredients || []).map((i: any) => `- ${i.name}: ${i.percentage}% (${i.role})`).join("\n")}`;
                          navigator.clipboard.writeText(textToCopy);
                          alert("Formula summary copied to clipboard!");
                        }}
                        className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3.5 py-2 rounded-xl font-bold border border-gray-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        📋 Copy Summary
                      </button>
                    </div>
                  </div>

                  {/* SECTION 5: SCIENTIFIC DASHBOARD */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-sm transition-all space-y-4 text-left">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        🔬 SECTION 5: SCIENTIFIC DASHBOARD (LABORATORY ANALYSIS SUITE)
                      </span>
                      <span className="text-[10px] font-mono text-teal-200 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-600/40 font-semibold">
                        Physical Chemistry, Thermodynamics & Equilibrium
                      </span>
                    </div>

                    {/* Laboratory Metrics Dashboard */}
                    {(() => {
                      const currentIngredients = formulationResult?.ingredients || [];
                      const currentProdType = formulationResult?.productType || productType;

                      // 1. pH & Active Matter Calculations
                      const estPHStr = formulationResult?.estimatedPH || formulationResult?.properties?.pH || "6.0";
                      const estPHNum = Number(estPHStr) || 6.0;
                      const targetPHStr = formulationResult?.targetedPH || (typeof targetpH !== 'undefined' && String(targetpH).trim() !== "" ? String(targetpH) : getTargetPHRange(currentProdType, formulationResult?.name).label);
                      const targetPHNum = Number(targetPHStr) || 6.0;
                      const phDiff = Math.abs(estPHNum - targetPHNum);
                      const phStatus = phDiff <= 0.3 ? "In Spec ✅" : phDiff <= 0.8 ? "Acceptable ⚠️" : "Out of Spec ❌";

                      const activeMatterVal = (currentIngredients && Array.isArray(currentIngredients) && currentIngredients.length > 0)
                        ? calculateActiveMatter(currentIngredients)
                        : (isNaN(Number(formulationResult?.activeMatter)) ? 0 : Number(formulationResult?.activeMatter));

                      // Breakdown of active surfactant classes
                      let anionicActive = 0;
                      let nonionicActive = 0;
                      let amphotericActive = 0;
                      let cationicActive = 0;

                      currentIngredients.forEach((ing: any) => {
                        const cat = getAuditedIngredientCategory(ing.name, ing.role);
                        const activePct = (ing.activePercent !== undefined ? ing.activePercent : ing.activeMatterPct !== undefined ? ing.activeMatterPct : ing.activeMatterPurity) || getDefaultActiveMatter(ing.name);
                        const activeVal = (ing.percentage || 0) * (activePct / 100);
                        if (cat.includes("Anionic")) anionicActive += activeVal;
                        else if (cat.includes("Nonionic")) nonionicActive += activeVal;
                        else if (cat.includes("Amphoteric")) amphotericActive += activeVal;
                        else if (cat.includes("Cationic")) cationicActive += activeVal;
                      });

                      // 2. Performance & Cleaning
                      const cleaningRes = calculateCleaningPerformance(currentIngredients, estPHNum);
                      const cleaningScore = isNaN(Number(cleaningRes.cleaningScore)) ? 0 : cleaningRes.cleaningScore;
                      const cpiVal = calculateCPI(currentIngredients, estPHNum);
                      const foamProfile = formulationResult?.properties?.foamHeight || targetFoam || "Medium High";

                      // 3. Surfactant Science & Thermodynamics
                      const mixedHlb = calculateBlendedHLB(currentIngredients) || 0;
                      const mixedCmc = calculateMixedCmc(currentIngredients);
                      const compRes = calculateFormulationCompatibility(currentIngredients, estPHNum);
                      const compatibilityScore = isNaN(Number(compRes.compatibilityScore)) ? 0 : compRes.compatibilityScore;

                      // 4. Hard Water, Chelation & Health
                      const hardnessResult = calculateWaterHardnessTolerance(currentIngredients);
                      const labHealth = calculateLabHealthScore({ ph: estPHNum, analyzedIngs: currentIngredients });

                      // 5. Sustainability & Carbon Metrics
                      const ecoRating = isNaN(Number(calculateCorrectedEcoRating(currentIngredients))) ? 0 : calculateCorrectedEcoRating(currentIngredients);
                      const ecoMetrics = calculateFormulationEcoMetrics(currentIngredients);

                      // Validation warning checks
                      let presWarning: string | null = null;
                      for (const ing of currentIngredients) {
                        const warningObj = getPreservativeWarning(ing.name, estPHNum);
                        if (warningObj) {
                          presWarning = `Preservative mismatch: ${ing.name} is ${warningObj.message}`;
                          break;
                        }
                      }

                      return (
                        <div className="space-y-4">
                          {/* Validation Alert Box */}
                          {(phDiff > 0.3 || presWarning) && (
                            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-left shadow-xs">
                              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                <span className="uppercase tracking-wider">Scientific Validation & Safety Alerts</span>
                              </div>
                              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1 font-medium">
                                {phDiff > 0.3 && (
                                  <li>⚠️ pH Spec Divergence: Estimated pH ({estPHStr}) diverges from Target pH ({targetPHStr}) by {phDiff.toFixed(1)} units. Check neutralization.</li>
                                )}
                                {presWarning && <li>⚠️ {presWarning}</li>}
                              </ul>
                            </div>
                          )}

                          {/* 4 Group Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* GROUP A: FORMULATION QUALITY */}
                            <div className="bg-gradient-to-b from-teal-50/30 to-white rounded-xl border border-teal-200/80 p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all">
                              <div className="flex items-center justify-between border-b border-teal-100/80 pb-2">
                                <div className="flex items-center gap-1.5 text-[#0f766e] font-extrabold text-xs uppercase tracking-wider">
                                  <span>⚗️</span> GROUP A: FORMULATION QUALITY
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-teal-100/70 text-teal-900 px-2 py-0.5 rounded-full border border-teal-200/50">
                                  Physicochemical Spec
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {/* Target vs Estimated pH Comparison Display */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">pH EQUILIBRIUM</span>
                                  <div className="flex items-baseline justify-between">
                                    <div>
                                      <span className="text-[10px] text-slate-500 block font-mono">Target: {targetPHStr}</span>
                                      <span className="text-sm font-extrabold text-slate-900 font-mono">Est: {estPHStr}</span>
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${phDiff <= 0.3 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {phStatus}
                                    </span>
                                  </div>
                                </div>

                                {/* Active Matter */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">ACTIVE MATTER</span>
                                  <span className="text-base font-extrabold text-teal-700 font-mono block">{activeMatterVal.toFixed(1)}%</span>
                                  <span className="text-[9px] text-slate-400 block truncate">Total active surfactants</span>
                                </div>

                                {/* Cleaning Score */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">CLEANING SCORE</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-base font-extrabold text-emerald-700 font-mono">{cleaningScore}/100</span>
                                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded">{cleaningRes.rating}</span>
                                  </div>
                                </div>

                                {/* Foam & Viscosity Profile */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5 col-span-2 sm:col-span-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">FOAM & VISCOSITY PROFILE</span>
                                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono">{foamProfile}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* GROUP B: SURFACTANT SCIENCE */}
                            <div className="bg-gradient-to-b from-purple-50/30 to-white rounded-xl border border-purple-200/80 p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all">
                              <div className="flex items-center justify-between border-b border-purple-100/80 pb-2">
                                <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs uppercase tracking-wider">
                                  <span>🧬</span> GROUP B: SURFACTANT SCIENCE
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-purple-100/70 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200/50">
                                  Micellar Thermodynamics
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                {/* Blend HLB */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">BLEND HLB VALUE</span>
                                  <span className="text-base font-extrabold text-orange-600 font-mono block">{mixedHlb.toFixed(1)}</span>
                                  <span className="text-[9px] text-slate-500 block truncate">
                                    {mixedHlb >= 12 && mixedHlb <= 15 ? "Detergency Range" : "Emulsification Range"}
                                  </span>
                                </div>

                                {/* Mixed Micelle CMC */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">MIXED MICELLE CMC</span>
                                  <span className="text-base font-extrabold text-purple-700 font-mono block">
                                    {mixedCmc ? `${mixedCmc.ppm.toFixed(1)} ppm` : "N/A"}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block truncate">
                                    {mixedCmc ? `~${mixedCmc.molar.toFixed(3)} mM` : "No active surfactants"}
                                  </span>
                                </div>

                                {/* Surfactant Classification Ratios */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1.5 col-span-2">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                                    <span>SURFACTANT CLASSIFICATION</span>
                                    <span>Active: {activeMatterVal.toFixed(1)}%</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                                    <div className="bg-blue-50/80 p-1 rounded border border-blue-100">
                                      <span className="text-[8px] text-blue-600 block">Anionic</span>
                                      <span className="font-bold text-blue-900">{anionicActive.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-teal-50/80 p-1 rounded border border-teal-100">
                                      <span className="text-[8px] text-teal-600 block">Nonionic</span>
                                      <span className="font-bold text-teal-900">{nonionicActive.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-amber-50/80 p-1 rounded border border-amber-100">
                                      <span className="text-[8px] text-amber-600 block">Amphoteric</span>
                                      <span className="font-bold text-amber-900">{amphotericActive.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-purple-50/80 p-1 rounded border border-purple-100">
                                      <span className="text-[8px] text-purple-600 block">Cationic</span>
                                      <span className="font-bold text-purple-900">{cationicActive.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Compatibility Score */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5 col-span-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">FORMULATION COMPATIBILITY</span>
                                    <span className="text-xs font-extrabold text-purple-800 font-mono">{compatibilityScore}%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 font-medium truncate">
                                    {compRes.alerts && compRes.alerts.length > 0 ? compRes.alerts[0].description || compRes.alerts[0].reason : "All ingredients chemically compatible and stable."}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* GROUP C: PERFORMANCE */}
                            <div className="bg-gradient-to-b from-blue-50/30 to-white rounded-xl border border-blue-200/80 p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all">
                              <div className="flex items-center justify-between border-b border-blue-100/80 pb-2">
                                <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                                  <span>💧</span> GROUP C: PERFORMANCE & HARD WATER
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-blue-100/70 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200/50">
                                  Chelation & Sequestration
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                {/* Water Hardness Sequestration Limit */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">WATER HARDNESS LIMIT</span>
                                  <span className="text-base font-extrabold text-blue-800 font-mono block">
                                    {hardnessResult.maxSupportedPpm.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">ppm CaCO₃</span>
                                  </span>
                                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded inline-block">{hardnessResult.rating}</span>
                                </div>

                                {/* CPI Cleaning Index */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">CLEANING INDEX (CPI)</span>
                                  <span className="text-base font-extrabold text-teal-800 font-mono block">{cpiVal.toFixed(1)} / 100</span>
                                  <span className="text-[9px] text-slate-500 block truncate">Detergency index</span>
                                </div>

                                {/* Builders & Chelators Audit */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1 col-span-2">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">CHELATION CAPACITY & BUILDERS</span>
                                  <p className="text-[10px] text-slate-700 leading-snug font-medium line-clamp-2">{hardnessResult.description}</p>
                                </div>
                              </div>
                            </div>

                            {/* GROUP D: SUSTAINABILITY */}
                            <div className="bg-gradient-to-b from-emerald-50/30 to-white rounded-xl border border-emerald-200/80 p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all">
                              <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2">
                                <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
                                  <span>🌿</span> GROUP D: SUSTAINABILITY & ECO
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                  OECD 301 & Eco Audit
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                {/* Eco Score */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">OECD 301 ECO RATING</span>
                                  <span className="text-base font-extrabold text-emerald-700 font-mono block">{ecoRating}/100</span>
                                  <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-1 rounded inline-block">
                                    {ecoMetrics.biodegradabilityPct >= 80 ? "Readily Biodegradable" : "Inherently Biodegradable"}
                                  </span>
                                </div>

                                {/* Lab Health & Safety */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">LAB HEALTH SCORE</span>
                                  <span className="text-base font-extrabold text-teal-800 font-mono block">{labHealth.finalScore}/100</span>
                                  <span className="text-[9px] text-teal-800 font-bold bg-teal-50 px-1 rounded inline-block">{labHealth.rating}</span>
                                </div>

                                {/* Carbon & Bio-based Profile */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1 col-span-2">
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                                    <span>BIO-BASED CONTENT</span>
                                    <span>BIODEGRADABILITY INDEX</span>
                                  </div>
                                  <div className="flex justify-between items-baseline font-mono">
                                    <span className="text-xs font-bold text-emerald-800">{ecoMetrics.plantBasedPct}% Bio-Sourced</span>
                                    <span className="text-xs font-bold text-slate-800">{ecoMetrics.biodegradabilityPct}% Organic Bio-index</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION 3: INGREDIENT COMPOSITION TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-sm transition-all space-y-4 text-left">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        🧪 SECTION 3: INGREDIENT COMPOSITION TABLE
                      </span>
                      <span className="text-[10px] font-mono text-teal-200 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-600/40 font-semibold">
                        Grouped by R&D Functional Category
                      </span>
                    </div>

                    {/* AI Expert Chemist Formula Ingredients Sheet */}
                    <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2">
                      <div>
                        <h4 className="font-extrabold text-[#0f766e] text-xs uppercase tracking-wider flex items-center gap-1.5">
                          🧪 {lang === "hi" ? "विशेषज्ञ द्वारा निर्मित फॉर्मूला सामग्री सूची" : lang === "mr" ? "तज्ज्ञ रासायनिक फॉर्म्युला घटक सूची" : "AI EXPERT CHEMIST FORMULA INGREDIENTS SHEET"}
                        </h4>
                        <p className="text-[10px] text-gray-500">
                          {lang === "hi" ? "सक्रिय एजेंटों, योजकों और सॉल्वैंट्स का सटीक अनुपात" : lang === "mr" ? "सक्रिय घटक आणि सॉल्व्हेंट्सचे अचूक प्रमाण" : "Precise ratios of active surfactants, secondary additives, and water carrier"}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCopiedInci(false);
                            setShowInciModal(true);
                          }}
                          className="flex items-center gap-1.5 bg-white border border-[#0f766e] text-[#0f766e] hover:bg-teal-50 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                        >
                          📋 Generate INCI / Label List
                        </button>
                        <div className="flex items-center gap-1.5 bg-teal-50 px-2 py-1 rounded-lg text-[11px] font-bold text-[#0f766e]">
                          <span>⚖️ {lang === "hi" ? "बैच आकार:" : lang === "mr" ? "बॅच आकार:" : "Batch Size:"}</span>
                          <span className="font-mono">{batchSize} kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <th className="p-2">{lang === "hi" ? "कच्चा माल (Raw Material)" : lang === "mr" ? "कच्चा माल" : "Raw Material"}</th>
                            <th className="p-2 text-center">{lang === "hi" ? "प्रतिशत (%)" : lang === "mr" ? "टक्केवारी" : "Percentage"}</th>
                            <th className="p-2 text-center">{lang === "hi" ? "मात्रा (Weight)" : lang === "mr" ? "वजन" : "Weight"}</th>
                            <th className="p-2 text-center">HLB</th>
                            <th className="p-2 text-center">CMC (ppm)</th>
                            <th className="p-2">{lang === "hi" ? "कार्य / भूमिका" : lang === "mr" ? "कार्य / भूमिका" : "R&D Function / Role"}</th>
                            <th className="p-2 text-right">{lang === "hi" ? "लागत (Cost)" : lang === "mr" ? "किंमत" : "Cost Contribution"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {CATEGORY_ORDER.map((catName) => {
                            const catIngredients = (formulationResult?.ingredients || []).filter(
                              (ing: any) => getAuditedIngredientCategory(ing.name, ing.role) === catName
                            );
                            if (catIngredients.length === 0) return null;
                            
                            return (
                              <React.Fragment key={catName}>
                                {/* Category Subheader Row */}
                                <tr className="bg-teal-50/20 border-y border-teal-100/50">
                                  <td colSpan={7} className="p-1.5 font-black text-teal-850 text-[10px] uppercase tracking-wider pl-3 bg-teal-50/30">
                                    {catName}
                                  </td>
                                </tr>
                                {catIngredients.map((ing: any, idx: number) => {
                                  const ingWeight = (ing.percentage / 100) * batchSize;
                                  const ingCost = ingWeight * (ing.costPerKg || 0);
                                  const cmcInfo = getIngredientCmc(ing.name);
                                  return (
                                    <tr key={idx} className="hover:bg-teal-50/10 transition-colors">
                                      <td className="p-2 font-semibold text-gray-900 pl-4">{ing.name}</td>
                                      <td className="p-2 text-center font-bold text-[#0f766e] font-mono bg-[#0f766e]/5">{ing.percentage}%</td>
                                      <td className="p-2 text-center font-bold text-blue-600 bg-blue-50/20 font-mono">
                                        {ingWeight >= 1 ? `${ingWeight.toFixed(2)} kg` : `${(ingWeight * 1000).toFixed(0)} g`}
                                      </td>
                                      <td className="p-2 text-center font-bold font-mono">
                                        {ing.hlbValue !== undefined && ing.hlbValue !== null ? (
                                          <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 font-semibold text-[10px]">
                                            {ing.hlbValue.toFixed(1)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-center font-bold font-mono text-purple-700">
                                        {cmcInfo ? (
                                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-semibold text-[10px]" title={`${cmcInfo.cmcMolar} mM`}>
                                            {cmcInfo.cmcPpm} ppm
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-gray-500 italic max-w-[140px] truncate" title={ing.role}>{ing.role}</td>
                                      <td className="p-2 text-right font-mono text-gray-900">
                                        ₹{ingCost.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}

                          {/* Uncategorized Fallback */}
                          {(() => {
                            const otherIngredients = (formulationResult?.ingredients || []).filter(
                              (ing: any) => !CATEGORY_ORDER.includes(getAuditedIngredientCategory(ing.name, ing.role))
                            );
                            if (otherIngredients.length === 0) return null;
                            return (
                              <React.Fragment>
                                <tr className="bg-teal-50/20 border-y border-teal-100/50">
                                  <td colSpan={7} className="p-1.5 font-black text-teal-850 text-[10px] uppercase tracking-wider pl-3 bg-teal-50/30">
                                    Other / Additives
                                  </td>
                                </tr>
                                {otherIngredients.map((ing: any, idx: number) => {
                                  const ingWeight = (ing.percentage / 100) * batchSize;
                                  const ingCost = ingWeight * (ing.costPerKg || 0);
                                  const cmcInfo = getIngredientCmc(ing.name);
                                  return (
                                    <tr key={idx} className="hover:bg-teal-50/10 transition-colors">
                                      <td className="p-2 font-semibold text-gray-900 pl-4">{ing.name}</td>
                                      <td className="p-2 text-center font-bold text-[#0f766e] font-mono bg-[#0f766e]/5">{ing.percentage}%</td>
                                      <td className="p-2 text-center font-bold text-blue-600 bg-blue-50/20 font-mono">
                                        {ingWeight >= 1 ? `${ingWeight.toFixed(2)} kg` : `${(ingWeight * 1000).toFixed(0)} g`}
                                      </td>
                                      <td className="p-2 text-center font-bold font-mono">
                                        {ing.hlbValue !== undefined && ing.hlbValue !== null ? (
                                          <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 font-semibold text-[10px]">
                                            {ing.hlbValue.toFixed(1)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-center font-bold font-mono text-purple-700">
                                        {cmcInfo ? (
                                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-semibold text-[10px]" title={`${cmcInfo.cmcMolar} mM`}>
                                            {cmcInfo.cmcPpm} ppm
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-gray-500 italic max-w-[140px] truncate" title={ing.role}>{ing.role}</td>
                                      <td className="p-2 text-right font-mono text-gray-900">
                                        ₹{ingCost.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Thermodynamic HLB & CMC Summary */}
                    {(() => {
                      const mixedCmc = formulationMixedCmc;
                      const mixedHlb = formulationMixedHlb;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gradient-to-r from-teal-50/50 to-[#0f766e]/5 p-3 rounded-xl border border-[#0f766e]/10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                                🔗 {lang === "hi" ? "मिश्रित हाइड्रोफिलिक-लिपॉफिलिक बैलेंस (Mixed HLB)" : lang === "mr" ? "मिश्रित HLB प्रमाण" : "MIXED HLB BALANCE"}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-extrabold text-[#0f766e] font-mono">{mixedHlb.toFixed(1)}</span>
                              <span className="text-[10px] text-gray-500 font-medium">
                                ({mixedHlb >= 12 && mixedHlb <= 15 ? (lang === "hi" ? "सफाई के लिए सर्वोत्तम" : lang === "mr" ? "उत्कृष्ट स्वच्छता" : "Solubilizing & Detergency Range") : (lang === "hi" ? "इमल्शन अनुकूल" : lang === "mr" ? "इमल्शन अनुकूल" : "Emulsification Range")})
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 leading-normal">
                              {lang === "hi" 
                                ? "मिश्रित सर्फेक्टेंट सिस्टम का औसत HLB मान। सफाई क्षमता और इमल्शन स्थिरता सुनिश्चित करता है।" 
                                : lang === "mr" 
                                ? "एकत्रित सर्फेक्टंट सिस्टमचे सरासरी HLB मूल्य. उत्तम स्वच्छता आणि स्थिरता राखते." 
                                : "The composite HLB value of all surfactants. Determines detergency performance and micro-emulsion shelf stability."}
                            </p>
                          </div>

                          <div className="space-y-1 border-t md:border-t-0 md:border-l border-gray-200/60 pt-2 md:pt-0 md:pl-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                                🌀 {lang === "hi" ? "महत्वपूर्ण मिसेल एकाग्रता (Critical Micelle Concentration - CMC)" : lang === "mr" ? "क्रांतिक मिसेल सांद्रता (Mixed CMC)" : "MIXED MICELLE CMC"}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-extrabold text-purple-700 font-mono">
                                {mixedCmc ? `${mixedCmc.ppm.toFixed(1)} ppm` : "N/A"}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                ({mixedCmc ? `~${(mixedCmc.molar).toFixed(3)} mM` : "No active surfactants"})
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 leading-normal">
                              {lang === "hi" 
                                ? "क्लिंट के समीकरण द्वारा परिकलित। इस एकाग्रता से ऊपर मिसेल्स बनते हैं जो ग्रीस और मैल को घेरते हैं।" 
                                : lang === "mr" 
                                ? "क्लिंट समीकरणाद्वारे मोजले गेले. या सांद्रतेच्या वर मिसेल्स तयार होतात जे घाण स्वच्छ करतात." 
                                : "Calculated via Clint's ideal mixed micellation theory. Above this concentration, active cleansing micelles assemble."}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  </div>

                  {/* SECTION 6: COMMERCIAL DASHBOARD */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-sm transition-all space-y-4 text-left">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        💼 SECTION 6: COMMERCIAL DASHBOARD
                      </span>
                      <span className="text-[10px] font-mono text-teal-200 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-600/40 font-semibold">
                        Costing, Packaging & Commercial Economics
                      </span>
                    </div>

                    {(() => {
                      const costPerKg = sandboxCost;
                      const totalBatchCost = costPerKg * batchSize;
                      const pkgCarrier = formulationResult?.packagingCompatibility || "HDPE / PET Container";
                      const estOverhead = Math.max(1.5, costPerKg * 0.08);
                      const totalMfgCost = costPerKg + estOverhead;
                      const suggestedMrp = (totalMfgCost * 2.2).toFixed(2);
                      const distPrice = (totalMfgCost * 1.35).toFixed(2);
                      const marginPct = (((Number(suggestedMrp) - totalMfgCost) / Number(suggestedMrp)) * 100).toFixed(1);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left space-y-1">
                            <span className="text-[9px] text-gray-400 font-bold block uppercase">RAW MATERIAL COST</span>
                            <span className="text-xl font-extrabold text-[#0f766e] font-mono">₹{costPerKg.toFixed(2)}</span>
                            <span className="text-[10px] text-gray-500 font-mono block">per kg formulation</span>
                            <div className="pt-1.5 border-t border-gray-200/60 mt-1 flex justify-between text-[10px] font-mono">
                              <span className="text-gray-500">Batch ({batchSize} kg):</span>
                              <span className="font-bold text-gray-800">₹{totalBatchCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left space-y-1">
                            <span className="text-[9px] text-gray-400 font-bold block uppercase">PACKAGING CARRIER</span>
                            <span className="text-xs font-bold text-gray-900 block truncate" title={pkgCarrier}>{pkgCarrier}</span>
                            <span className="text-[10px] text-gray-500 font-mono block">Est. Pkg Cost: ₹{formulationResult.productType.toLowerCase().includes("powder") ? "3.50" : "8.00"} / unit</span>
                            <div className="pt-1.5 border-t border-gray-200/60 mt-1 flex justify-between text-[10px]">
                              <span className="text-gray-500">Compatibility:</span>
                              <span className="font-bold text-emerald-600">Optimal ✅</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left space-y-1">
                            <span className="text-[9px] text-gray-400 font-bold block uppercase">MFG OVERHEAD ESTIMATE</span>
                            <span className="text-xl font-extrabold text-gray-800 font-mono">₹{estOverhead.toFixed(2)}</span>
                            <span className="text-[10px] text-gray-500 font-mono block">Mixing, power & labor/kg</span>
                            <div className="pt-1.5 border-t border-gray-200/60 mt-1 flex justify-between text-[10px] font-mono">
                              <span className="text-gray-500">Total Mfg Base:</span>
                              <span className="font-bold text-gray-800">₹{totalMfgCost.toFixed(2)} / kg</span>
                            </div>
                          </div>

                          <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200 text-left space-y-1">
                            <span className="text-[9px] text-teal-800 font-bold block uppercase">RETAIL PRICING & MARGIN</span>
                            <div className="flex justify-between items-baseline">
                              <span className="text-[10px] text-gray-500">Suggested MRP:</span>
                              <span className="text-lg font-extrabold text-teal-850 font-mono">₹{suggestedMrp}</span>
                            </div>
                            <div className="space-y-0.5 text-[10px] font-mono pt-1 border-t border-teal-200/50">
                              <div className="flex justify-between text-gray-600">
                                <span>Distributor Price:</span>
                                <span>₹{distPrice}</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-700">
                                <span>Projected Margin:</span>
                                <span>~{marginPct}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION 7: ADVANCED R&D LABORATORY WORKSPACE */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-sm transition-all space-y-5 text-left">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="text-teal-300" size={18} />
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider block">
                            🧬 SECTION 7: ADVANCED R&D LABORATORY WORKSPACE
                          </span>
                          <span className="text-[10px] text-teal-200">
                            Integrated Physical Chemistry, HLB Analysis & Formulation Engineering Suite
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-teal-200 bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-600/40 font-semibold hidden md:inline-block">
                        6 Specialized Lab Workspace Tabs
                      </span>
                    </div>

                    {/* 6 Laboratory Workspace Tabs Navigation */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSandboxTab("redesign")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "redesign"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <Sliders size={14} />
                        <span>1. Formula Redesign Lab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("surfactant")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "surfactant" || sandboxTab === "compare" || sandboxTab === "blender"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <Dna size={14} />
                        <span>2. Surfactant Science Lab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("reference")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "reference" || sandboxTab === "guide" || sandboxTab === "glossary"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <BookOpen size={14} />
                        <span>3. Chemistry Reference</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("analysis")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "analysis" || sandboxTab === "analyzer"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <Cpu size={14} />
                        <span>4. Advanced Analysis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("substitution")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "substitution"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <RefreshCw size={14} />
                        <span>5. Alternate Raw Materials</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("climate")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "climate"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <CloudSun size={14} />
                        <span>6. Climate & Hard Water</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("machine")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "machine"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <WashingMachine size={14} />
                        <span>7. Machine Profile Engine</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("troubleshooter")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          sandboxTab === "troubleshooter"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <Wrench size={14} />
                        <span>8. Root Cause Troubleshooter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSandboxTab("developer")}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
                          sandboxTab === "developer"
                            ? "bg-[#0f766e] text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <Code size={14} />
                        <span>9. Developer / Research</span>
                      </button>
                    </div>

                    {/* Tab content 0: Smart Formula Analyzer Pro */}
                    {sandboxTab === "analyzer" && (
                      <div className="space-y-4 animate-fade-in">
                        <SmartFormulaAnalyzerPro
                          lang={lang}
                          translations={translations}
                          ingredients={sandboxIngredients}
                          formulaName={formulationResult?.name || "Custom Formulation"}
                          productType={formulationResult?.productType || productType}
                          grade={formulationResult?.grade || grade}
                          targetCost={formulationResult?.targetCost || targetCost}
                          onApplyIngredients={(updated) => setSandboxIngredients(updated)}
                          waterHardnessPpm={waterHardnessPpm}
                          compatibilityScore={sandboxCompatibility}
                          formulationResult={formulationResult}
                        />
                      </div>
                    )}

                    {/* Tab content 1: Redesigner */}
                    {sandboxTab === "redesign" && (
                      <div className="space-y-4 animate-fade-in">
                        {/* 🔁 Formula Redesign Action Controls */}
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-orange-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2.5 rounded-xl text-orange-700 shadow-xs">
                              <RefreshCw size={18} />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                                🔁 Formula Redesign Action Controls
                              </h4>
                              <p className="text-[11px] text-gray-600">
                                Apply Sandbox overrides to the global recipe, or discard changes and revert to baseline.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
                            <button
                              type="button"
                              onClick={handleResetSandbox}
                              className="flex-1 md:flex-none text-xs flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-bold border border-gray-300 shadow-xs transition-all cursor-pointer"
                              title="Reset sandbox back to original AI recipe"
                            >
                              <Undo size={14} /> Reset to AI Baseline
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyRedesign}
                              className="flex-1 md:flex-none text-xs flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                              title="Apply this custom formulation to the main recipe batch and order of addition"
                            >
                              <CheckCircle size={14} /> Apply Custom Redesign
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Sliders for surfactants */}
                          <div className="lg:col-span-2 space-y-3 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                🛠️ Surfactant Adjustments & Sliders
                              </span>
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0f766e] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={autoBalanceWater}
                                  onChange={(e) => setAutoBalanceWater(e.target.checked)}
                                  className="rounded text-[#0f766e] focus:ring-[#0f766e] h-3.5 w-3.5"
                                />
                                Auto-balance Water Solvent
                              </label>
                            </div>
                            
                            <div className="space-y-3 divide-y divide-gray-200/60 max-h-[300px] overflow-y-auto pr-2">
                              {sandboxIngredients.map((ing: any, index: number) => {
                                const isWater = ing.name.toLowerCase().includes("water") || ing.name.toLowerCase().includes("aqua") || ing.role.toLowerCase().includes("solvent");
                                const isSurfactant = ing.hlbValue !== null && ing.hlbValue !== undefined;
                                const ecoMetrics = getIngredientEcoMetrics(ing.name);
                                
                                return (
                                  <div key={index} className={`pt-2.5 first:pt-0 ${isWater ? "bg-blue-50/10 px-2 py-1.5 rounded-lg border border-blue-100/20" : ""}`}>
                                    <div className="flex justify-between items-start text-xs mb-1">
                                      <div>
                                        <span className="font-semibold text-gray-800">{ing.name}</span>
                                        <span className="text-[10px] text-gray-400 block italic">{ing.role}</span>
                                        <div className="flex gap-1.5 mt-0.5">
                                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 font-medium flex items-center gap-0.5" title="Biodegradability rating of raw material">
                                            🌱 {ecoMetrics.biodegradabilityPct}% Bio
                                          </span>
                                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/70 font-medium flex items-center gap-0.5" title="Plant-based percentage of raw material">
                                            🌿 {ecoMetrics.plantBasedPct}% Plant
                                          </span>
                                          {ecoMetrics.isMineralOrWater && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100/70 font-medium">
                                              Mineral/Aqua
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isSurfactant && (
                                          <span className="text-[10px] font-mono font-bold text-[#0f766e] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                                            HLB: {ing.hlbValue.toFixed(1)}
                                          </span>
                                        )}
                                        <div className="flex items-center">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={ing.percentage}
                                            onChange={(e) => handleUpdatePercentage(index, parseFloat(e.target.value) || 0)}
                                            disabled={isWater && autoBalanceWater}
                                            className="w-16 font-bold text-center border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-[#0f766e]"
                                          />
                                          <span className="font-bold text-gray-500 ml-1">%</span>
                                        </div>
                                        
                                        <button
                                          onClick={() => handleDeleteIngredient(index)}
                                          className="text-gray-400 hover:text-red-500 p-1 transition-all"
                                          title="Remove ingredient from recipe"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {!isWater || !autoBalanceWater ? (
                                      <input
                                        type="range"
                                        min="0"
                                        max={isWater ? "100" : "50"}
                                        step="0.05"
                                        value={ing.percentage}
                                        onChange={(e) => handleUpdatePercentage(index, parseFloat(e.target.value))}
                                        className="w-full accent-[#0f766e] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                      />
                                    ) : (
                                      <div className="text-[10px] text-blue-500 font-medium">
                                        🔒 Adjusted dynamically to maintain batch balance at exactly 100.0%.
                                      </div>
                                    )}
                                    
                                    {isSurfactant && (
                                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                                        <span className="text-gray-400">Override HLB:</span>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="20"
                                          value={ing.hlbValue ?? ""}
                                          placeholder="null"
                                          onChange={(e) => handleUpdateHlb(index, e.target.value)}
                                          className="w-12 text-center border border-gray-200 rounded px-1 text-[10px] py-0.2"
                                        />
                                        <span className="text-gray-400">Active Matter %:</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={ing.activeMatterPct ?? 0}
                                          onChange={(e) => {
                                            const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                            setSandboxIngredients(prev => {
                                              const list = [...prev];
                                              list[index].activeMatterPct = val;
                                              return list;
                                            });
                                          }}
                                          className="w-10 text-center border border-gray-200 rounded px-1 text-[10px] py-0.2 font-mono"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Sidebar metrics & add tool */}
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-sm text-xs">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center justify-between">
                                <span>📊 Diagnostic Dashboard</span>
                                <span className="text-emerald-600 font-bold animate-pulse text-[10px] flex items-center gap-0.5">
                                  ● ECO LIVE
                                </span>
                              </span>
                              
                              {(() => {
                                const totalPct = Number(sandboxIngredients.reduce((sum, ing) => sum + ing.percentage, 0).toFixed(2));
                                const isBalanced = Math.abs(totalPct - 100) < 0.15;
                                return (
                                  <div className={`p-2 rounded text-[11px] font-bold flex items-center justify-between border ${isBalanced ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-rose-50 text-rose-800 border-rose-100 animate-pulse"}`}>
                                    <span>Total Sum:</span>
                                    <span>{totalPct}% {isBalanced ? "✅ Balanced" : "⚠️ Unbalanced"}</span>
                                  </div>
                                );
                              })()}

                              {(() => {
                                const eco = calculateSandboxEcoMetrics();
                                if (eco.biodegradabilityPct >= 95 && eco.plantBasedPct >= 90) {
                                  return (
                                    <div className="p-2.5 rounded bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold flex flex-col gap-0.5 shadow-sm">
                                      <span className="flex items-center gap-1 text-[11px]">🎉 100% TRUE ECO-FRIENDLY</span>
                                      <span className="text-emerald-600 font-medium">Fully plant-derived & biodegradable recipe!</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              
                              <div className="space-y-2.5">
                                <div className="flex justify-between items-center border-b pb-1">
                                  <span className="text-gray-500 font-medium">Calculated HLB</span>
                                  <span className="font-extrabold text-[#0f766e] text-sm">
                                    {calculateSandboxHlb().toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-1">
                                  <span className="text-gray-500 font-medium">Active Matter</span>
                                  <div className="text-right">
                                    <span className="font-bold text-gray-800">
                                      {calculateSandboxActiveMatter().toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] text-gray-400 block">
                                      (Baseline: {(!formulationResult || !formulationResult.ingredients || formulationResult.ingredients.length === 0) ? (isNaN(Number(formulationResult?.activeMatter)) ? 0 : formulationResult?.activeMatter) : formulationActiveMatter.toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center border-b pb-1">
                                  <span className="text-gray-500 font-medium">Material Cost</span>
                                  <div className="text-right">
                                    <span className="font-bold text-[#0f766e]">
                                      ₹{calculateSandboxCost().toFixed(2)}/kg
                                    </span>
                                    <span className="text-[10px] text-gray-400 block">
                                      (Baseline: ₹{(!formulationResult || isNaN(Number(formulationResult.actualCost))) ? 0 : formulationResult.actualCost}/kg)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center border-b pb-1 bg-emerald-50/20 px-1 rounded">
                                  <span className="text-emerald-800 font-semibold flex items-center gap-1 text-[11px]">
                                    🌱 Biodegradability
                                  </span>
                                  <div className="text-right">
                                    <span className="font-extrabold text-emerald-700 text-xs">
                                      {calculateSandboxEcoMetrics().biodegradabilityPct.toFixed(1)}%
                                    </span>
                                    <span className="text-[9px] text-emerald-500 block">
                                      (Final Product)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center border-b pb-1 bg-teal-50/20 px-1 rounded">
                                  <span className="text-teal-800 font-semibold flex items-center gap-1 text-[11px]">
                                    🌿 Plant-Based Carbon
                                  </span>
                                  <div className="text-right">
                                    <span className="font-extrabold text-teal-700 text-xs">
                                      {calculateSandboxEcoMetrics().plantBasedPct.toFixed(1)}%
                                    </span>
                                    <span className="text-[9px] text-teal-500 block">
                                      (Renewable Sourced)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-[#f0fdfa] p-4 rounded-xl border border-teal-100 space-y-2 text-xs">
                              <span className="text-xs font-bold text-teal-800 block flex items-center gap-1">
                                <Plus size={12} /> Introduce Lab Surfactant
                              </span>
                              <p className="text-[10px] text-teal-600">
                                Select a surfactant to introduce into the formula at 0% and slide to adjust:
                              </p>
                              <select
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const ing = universalSurfactantsList.find(i => i.name === val);
                                  if (ing) {
                                    handleAddSurfactant({
                                      name: ing.name,
                                      role: (ing.subCategory || ing.category) + " / Custom Blend",
                                      costPerKg: ing.costPerKg,
                                      activeMatterPct: ing.activeMatter || 100,
                                      hlbValue: ing.hlb ? parseFloat(String(ing.hlb)) || 10 : 10
                                    });
                                    e.target.value = "";
                                  }
                                }}
                                defaultValue=""
                                className="w-full bg-white border border-teal-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                              >
                                <option value="" disabled>-- Select Emulsifier (Universal Library) --</option>
                                {universalSurfactantsList.map((surf) => (
                                  <option key={surf.id} value={surf.name}>
                                    {surf.name} {surf.hlb ? `(HLB: ${surf.hlb})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 space-y-3 text-xs">
                              <span className="text-xs font-bold text-emerald-800 block flex items-center gap-1.5">
                                <Sparkles size={12} className="text-emerald-600 animate-pulse" /> 🌱 100% True Eco Formulation Lab
                              </span>
                              <p className="text-[10px] text-emerald-700">
                                Introduce plant-based green surfactants, natural mineral builders, or botanical additives from Universal Ingredient Library:
                              </p>
                              
                              <div className="space-y-2.5">
                                <div>
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">
                                    1. Plant-Based Surfactants
                                  </span>
                                  <select
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const ing = universalEcoSurfactantsList.find(i => i.name === val);
                                      if (ing) {
                                        handleAddSurfactant({
                                          name: ing.name,
                                          role: (ing.subCategory || ing.category) + " / Green Blend",
                                          costPerKg: ing.costPerKg,
                                          activeMatterPct: ing.activeMatter || 100,
                                          hlbValue: ing.hlb ? parseFloat(String(ing.hlb)) || 10 : 10
                                        });
                                        e.target.value = "";
                                      }
                                    }}
                                    defaultValue=""
                                    className="w-full bg-white border border-emerald-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                  >
                                    <option value="" disabled>-- Select Eco Surfactant (Universal Library) --</option>
                                    {universalEcoSurfactantsList.map((item) => (
                                      <option key={item.id} value={item.name}>
                                        {item.name} {item.hlb ? `(HLB: ${item.hlb})` : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">
                                    2. Natural Eco-Builders & Chelators
                                  </span>
                                  <select
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const ing = universalEcoBuildersList.find(i => i.name === val);
                                      if (ing) {
                                        handleAddSurfactant({
                                          name: ing.name,
                                          role: (ing.subCategory || ing.category) + " / Eco Builder",
                                          costPerKg: ing.costPerKg,
                                          activeMatterPct: ing.activeMatter || 100,
                                          hlbValue: ing.hlb ? parseFloat(String(ing.hlb)) || 10 : 10
                                        });
                                        e.target.value = "";
                                      }
                                    }}
                                    defaultValue=""
                                    className="w-full bg-white border border-emerald-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                  >
                                    <option value="" disabled>-- Select Eco Builder (Universal Library) --</option>
                                    {universalEcoBuildersList.map((item) => (
                                      <option key={item.id} value={item.name}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">
                                    3. Botanical Additives & Viscosity
                                  </span>
                                  <select
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const ing = universalEcoAdditivesList.find(i => i.name === val);
                                      if (ing) {
                                        handleAddSurfactant({
                                          name: ing.name,
                                          role: (ing.subCategory || ing.category) + " / Eco Additive",
                                          costPerKg: ing.costPerKg,
                                          activeMatterPct: ing.activeMatter || 100,
                                          hlbValue: ing.hlb ? parseFloat(String(ing.hlb)) || 10 : 10
                                        });
                                        e.target.value = "";
                                      }
                                    }}
                                    defaultValue=""
                                    className="w-full bg-white border border-emerald-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                  >
                                    <option value="" disabled>-- Select Eco Additive (Universal Library) --</option>
                                    {universalEcoAdditivesList.map((item) => (
                                      <option key={item.id} value={item.name}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab content 2: Surfactant Science Lab */}
                    {(sandboxTab === "surfactant" || sandboxTab === "compare" || sandboxTab === "blender") && (
                      <div className="space-y-4 animate-fade-in text-xs">
                        {/* Subtabs for Surfactant Science Lab */}
                        <div className="flex flex-wrap bg-teal-50/80 p-1 rounded-xl border border-teal-100 gap-1">
                          <button
                            type="button"
                            onClick={() => setSurfSubTab("compare")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              surfSubTab === "compare" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <Dna size={13} /> 1. HLB Target Range Matcher
                          </button>
                          <button
                            type="button"
                            onClick={() => setSurfSubTab("blender")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              surfSubTab === "blender" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <RefreshCw size={13} /> 2. Surfactant Multi-Blender Lab
                          </button>
                        </div>

                        {surfSubTab === "compare" && (
                          <div className="space-y-4">
                            <div>
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                Select Formulation / Emulsification Type for Matching:
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {Object.entries(FORMULATION_TYPES).map(([key, value]) => (
                                  <button
                                    key={key}
                                    onClick={() => setSelectedTargetType(key)}
                                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                      selectedTargetType === key
                                        ? "bg-[#0f766e] text-white border-[#0f766e] shadow-sm"
                                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    <span className="font-bold block text-[11px] leading-tight">{value.name}</span>
                                    <span className={`text-[10px] font-mono font-bold mt-1.5 ${selectedTargetType === key ? "text-teal-100" : "text-[#0f766e]"}`}>
                                      Ideal HLB: {value.rangeText}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {(() => {
                              const curTypeInfo = FORMULATION_TYPES[selectedTargetType as keyof typeof FORMULATION_TYPES] || FORMULATION_TYPES.detergent;
                              const curHlb = calculateSandboxHlb();
                              const minVal = curTypeInfo.min;
                              const maxVal = curTypeInfo.max;
                              
                              let matchStatus: "perfect" | "marginal" | "poor" = "poor";
                              let matchColorClass = "bg-rose-50 text-rose-800 border-rose-200";
                              let matchLabel = "Imbalanced / Unstable Emulsion ❌";
                              
                              if (curHlb >= minVal && curHlb <= maxVal) {
                                matchStatus = "perfect";
                                matchColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                matchLabel = "Optimal HLB Compatibility Match ✅";
                              } else if (Math.abs(curHlb - minVal) <= 1.0 || Math.abs(curHlb - maxVal) <= 1.0) {
                                matchStatus = "marginal";
                                matchColorClass = "bg-amber-50 text-amber-800 border-amber-200";
                                matchLabel = "Sub-optimal / Marginal Stability ⚠️";
                              }
                              
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                      <span className="font-bold text-gray-700 uppercase tracking-wider block">
                                        HLB Target Range Matcher Gauge
                                      </span>
                                      <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${matchColorClass}`}>
                                        {matchLabel}
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-100">
                                      <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                        <span>Lipophilic (Oil-Soluble)</span>
                                        <span>Hydrophilic (Water-Soluble)</span>
                                      </div>
                                      
                                      <div className="relative h-4 bg-gradient-to-r from-amber-200 via-emerald-100 via-teal-200 to-blue-300 rounded-full">
                                        {/* Target highlighted zone */}
                                        {(() => {
                                          const lPercent = (minVal / 18) * 100;
                                          const rPercent = (maxVal / 18) * 100;
                                          const widthPercent = rPercent - lPercent;
                                          return (
                                            <div
                                              className="absolute h-full bg-teal-600/25 border-x-2 border-teal-600/45 flex items-center justify-center"
                                              style={{ left: `${lPercent}%`, width: `${widthPercent}%` }}
                                            >
                                              <span className="text-[8px] font-bold text-teal-900 tracking-wide">IDEAL TARGET ZONE</span>
                                            </div>
                                          );
                                        })()}
                                        
                                        {/* Current value pointer */}
                                        {(() => {
                                          const percent = Math.min(100, Math.max(0, (curHlb / 18) * 100));
                                          return (
                                            <div
                                              className="absolute -top-1 w-6 h-6 bg-[#0f766e] border-2 border-white rounded-full shadow-lg flex items-center justify-center transform -translate-x-1/2 z-10 animate-pulse"
                                              style={{ left: `${percent}%` }}
                                            >
                                              <span className="text-[9px] font-extrabold text-white font-mono">{curHlb}</span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                      
                                      <div className="flex justify-between text-[8px] text-gray-400 font-semibold font-mono pt-1">
                                        <span>1-3 (Anti-foam)</span>
                                        <span>3-6 (W/O Emul)</span>
                                        <span>7-9 (Wetting)</span>
                                        <span>8-16 (O/W Emul)</span>
                                        <span>13-15 (Detergents)</span>
                                        <span>16-18 (Solubilizers)</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <span className="text-xs font-bold text-gray-700 block">
                                        ⚙️ Physics of HLB & Emulsification Performance:
                                      </span>
                                      <p className="text-gray-600 leading-relaxed font-normal bg-white p-3 rounded-lg border border-gray-100">
                                        {matchStatus === "perfect" && (
                                          <>
                                            <strong>Thermodynamically optimized system!</strong> Your calculated HLB value of <strong>{curHlb}</strong> sits perfectly inside the required range for a <strong>{curTypeInfo.name}</strong> ({minVal} - {maxVal}). 
                                            The hydrophilic surfactant heads extend into water creating a protective steric barrier while hydrophobic tails anchor strongly in oil. This matches interfacial curvature, preventing droplet coalescence, sedimentation, and cream separation.
                                          </>
                                        )}
                                        {matchStatus === "marginal" && (
                                          <>
                                            <strong>Sub-optimal stability / slow breakdown risk.</strong> Your calculated HLB of <strong>{curHlb}</strong> is slightly offset from the ideal range ({minVal} - {maxVal}). 
                                            The emulsion will form, but droplets will slowly aggregate over time, leading to turbidity, haze, or potential separation in heat-stability tests. Consider adjusting LABSA/SLES ratios slightly to align closer to center of target.
                                          </>
                                        )}
                                        {matchStatus === "poor" && (
                                          <>
                                            <strong>Unstable formulation warning!</strong> Your calculated HLB of <strong>{curHlb}</strong> is incompatible with a <strong>{curTypeInfo.name}</strong> ({minVal} - {maxVal}). 
                                            {curHlb < minVal ? (
                                              <span>
                                                The surfactant blend is too <strong>lipophilic (hydrophobic)</strong>. Surfactant will dissolve into oils instead of stabilizing water droplets. Droplets will coalesce instantly, breaking the emulsion and producing separate liquid layers.
                                              </span>
                                            ) : (
                                              <span>
                                                The surfactant blend is too <strong>hydrophilic (water-soluble)</strong>. Surfactants partition completely into bulk water rather than binding to the oil droplet boundary, resulting in poor soil-suspension and emulsion separation.
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 flex flex-col justify-between space-y-3">
                                    <div>
                                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1">
                                        🔬 Chemist's R&D Strategy
                                      </span>
                                      <div className="space-y-2 mt-2 leading-relaxed text-gray-600">
                                        <p><strong>System Category:</strong> {curTypeInfo.name}</p>
                                        <p><strong>Primary Applications:</strong> {curTypeInfo.applications}</p>
                                        <p><strong>Stability Effect:</strong> {curTypeInfo.stabilityEffect}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-lg border border-teal-200 text-[#0f766e]">
                                      <span className="font-bold block mb-1">🔧 Redesign Strategy:</span>
                                      <ul className="list-disc pl-4 space-y-1 font-medium text-[11px] text-gray-700">
                                        <li><strong>Raise HLB:</strong> Blend high HLB surfactants (SLES, CAPB, Tween 20).</li>
                                        <li><strong>Lower HLB:</strong> Blend lipophilic agents (LABSA, Span 80, GMS).</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {surfSubTab === "blender" && (
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center flex-wrap gap-3">
                              <div>
                                <h5 className="font-bold text-blue-950 text-sm flex items-center gap-1.5 mb-1">
                                  🔬 Multi-Surfactant HLB Blender Lab
                                </h5>
                                <p className="text-gray-600 text-[11px]">
                                  Calculate, simulate, and count the HLB ratio of up to 10 surfactants simultaneously. Pre-loaded with <strong>7 standard surfactants</strong> for complex, active detergent and dishwash balancing.
                                </p>
                              </div>
                              <button
                                onClick={handleResetBlender}
                                className="bg-white hover:bg-gray-50 text-blue-800 border border-blue-200 hover:border-blue-300 font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw size={11} className="animate-spin-slow" /> Reset to 7 Standard Surfactants
                              </button>
                            </div>

                            {/* Standard Multi-Blender code continues... */}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab content 3: Multi-Surfactant Blender */}
                    {sandboxTab === "blender" && (
                      <div className="space-y-4 animate-fade-in text-xs">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center flex-wrap gap-3">
                          <div>
                            <h5 className="font-bold text-blue-950 text-sm flex items-center gap-1.5 mb-1">
                              🔬 Multi-Surfactant HLB Blender Lab
                            </h5>
                            <p className="text-gray-600 text-[11px]">
                              Calculate, simulate, and count the HLB ratio of up to 10 surfactants simultaneously. Pre-loaded with <strong>7 standard surfactants</strong> for complex, active detergent and dishwash balancing.
                            </p>
                          </div>
                          <button
                            onClick={handleResetBlender}
                            className="bg-white hover:bg-gray-50 text-blue-800 border border-blue-200 hover:border-blue-300 font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition-all flex items-center gap-1"
                          >
                            <RefreshCw size={11} className="animate-spin-slow" /> Reset to 7 Standard Surfactants
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Left Column: Surfactant Inputs List */}
                          <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm text-left">
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                                🧪 Active Surfactant System Components
                              </span>
                              <span className="text-[10px] text-gray-500 font-medium">
                                Active rows: {blenderSurfactants.length} / 10
                              </span>
                            </div>

                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                              {blenderSurfactants.map((s, idx) => {
                                const isUniversal = universalSurfactantsList.some(std => std.name === s.name);
                                return (
                                  <div key={idx} className="p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between transition-colors">
                                    {/* Component Label & Dropdown */}
                                    <div className="w-full md:w-2/5 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                          #{idx + 1}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                                          Select Chemical Type
                                        </span>
                                      </div>
                                      <select
                                        value={isUniversal ? s.name : "custom"}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === "custom") {
                                            handleUpdateBlenderSurfactant(idx, "name", "Custom Surfactant");
                                            handleUpdateBlenderSurfactant(idx, "hlbValue", 10.0);
                                            handleUpdateBlenderSurfactant(idx, "activeMatterPct", 100);
                                            handleUpdateBlenderSurfactant(idx, "role", "Surfactant");
                                          } else {
                                            handleUpdateBlenderSurfactant(idx, "select_universal", val);
                                          }
                                        }}
                                        className="w-full border rounded-lg px-2 py-1.5 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                                      >
                                        {universalSurfactantsList.map((std) => (
                                          <option key={std.id} value={std.name}>
                                            {std.name} {std.hlb ? `(HLB: ${std.hlb})` : ""}
                                          </option>
                                        ))}
                                        <option value="custom">✍️ Custom Surfactant...</option>
                                      </select>
                                      
                                      {!isUniversal && (
                                        <input
                                          type="text"
                                          value={s.name}
                                          placeholder="Enter custom surfactant name"
                                          onChange={(e) => handleUpdateBlenderSurfactant(idx, "name", e.target.value)}
                                          className="w-full mt-1 border rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-semibold text-blue-900 bg-white"
                                        />
                                      )}
                                    </div>

                                    {/* HLB Value */}
                                    <div className="w-20 space-y-1">
                                      <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 block">
                                        HLB Val
                                      </span>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="20"
                                        value={s.hlbValue}
                                        onChange={(e) => handleUpdateBlenderSurfactant(idx, "hlbValue", e.target.value)}
                                        className="w-full border rounded-lg px-2 py-1.5 text-center font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                                      />
                                    </div>

                                    {/* Proportion */}
                                    <div className="space-y-1">
                                      <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 block">
                                        Proportion / Ratio
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="0"
                                          max="50"
                                          step="0.5"
                                          value={s.proportion || 0}
                                          onChange={(e) => handleUpdateBlenderSurfactant(idx, "proportion", e.target.value)}
                                          className="w-20 md:w-24 accent-[#0f766e] h-1.5 cursor-pointer"
                                        />
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          value={s.proportion}
                                          onChange={(e) => handleUpdateBlenderSurfactant(idx, "proportion", e.target.value)}
                                          className="w-12 border rounded-lg px-1.5 py-1 text-center font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                                        />
                                      </div>
                                    </div>

                                    {/* Delete Button */}
                                    <div className="pt-4 md:pt-0">
                                      <button
                                        disabled={blenderSurfactants.length <= 1}
                                        onClick={() => handleRemoveBlenderRow(idx)}
                                        className="p-1.5 hover:text-rose-600 hover:bg-rose-50 text-gray-400 rounded-lg transition-colors disabled:opacity-30"
                                        title="Remove Surfactant"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              onClick={handleAddBlenderRow}
                              disabled={blenderSurfactants.length >= 10}
                              className="w-full border border-dashed border-gray-300 hover:border-[#0f766e] text-gray-600 hover:text-[#0f766e] py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] disabled:opacity-40"
                            >
                              <Plus size={13} /> Add Another Surfactant Row (Max 10)
                            </button>
                          </div>
                          
                          {/* Right Column: Calculations & Injector */}
                          <div className="lg:col-span-5 bg-[#f0fdfa] p-4 rounded-xl border border-teal-100 flex flex-col justify-between space-y-4">
                            {(() => {
                              const totalProportion = blenderSurfactants.reduce((sum, s) => sum + (Number(s.proportion) || 0), 0);
                              const totalHlbPoints = blenderSurfactants.reduce((sum, s) => sum + ((Number(s.proportion) || 0) * (Number(s.hlbValue) || 0)), 0);
                              const blendedHlb = totalProportion > 0 ? Number((totalHlbPoints / totalProportion).toFixed(2)) : 0;
                              
                              return (
                                <div className="space-y-4">
                                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                                    📊 Real-time Blend Analysis
                                  </span>
                                  
                                  <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm space-y-3">
                                    <div className="grid grid-cols-2 gap-3 divide-x divide-gray-100">
                                      <div className="space-y-1">
                                        <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
                                          Compound HLB
                                        </span>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                          <span className="text-2xl font-black text-[#0f766e] font-mono tracking-tight">
                                            {blendedHlb.toFixed(1)}
                                          </span>
                                        </div>
                                        <span className="text-gray-400 text-[9px] font-mono block leading-none">
                                          Weighted Average
                                        </span>
                                      </div>

                                      <div className="space-y-1 pl-3">
                                        <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
                                          Mixed Micelle CMC
                                        </span>
                                        {(() => {
                                          let activeSurfactantProportions = 0;
                                          let inverseCmcSum = 0;

                                          blenderSurfactants.forEach(s => {
                                            const cmcInfo = getIngredientCmc(s.name);
                                            if (cmcInfo && Number(s.proportion) > 0) {
                                              activeSurfactantProportions += Number(s.proportion);
                                            }
                                          });

                                          if (activeSurfactantProportions === 0) {
                                            return (
                                              <span className="text-xs font-bold text-gray-400 block mt-1">
                                                N/A
                                              </span>
                                            );
                                          }

                                          blenderSurfactants.forEach(s => {
                                            const cmcInfo = getIngredientCmc(s.name);
                                            if (cmcInfo && Number(s.proportion) > 0) {
                                              const fraction = Number(s.proportion) / activeSurfactantProportions;
                                              inverseCmcSum += fraction / cmcInfo.cmcMolar;
                                            }
                                          });

                                          if (inverseCmcSum === 0) return <span className="text-xs font-bold text-gray-400 block mt-1">N/A</span>;
                                          const mixedCmcMolar = 1 / inverseCmcSum;
                                          const mixedCmcPpm = mixedCmcMolar * 320;
                                          return (
                                            <>
                                              <div className="flex items-baseline gap-1 mt-0.5">
                                                <span className="text-2xl font-black text-purple-700 font-mono tracking-tight">
                                                  {mixedCmcPpm.toFixed(0)}
                                                </span>
                                                <span className="text-[10px] text-purple-600 font-bold font-mono">ppm</span>
                                              </div>
                                              <span className="text-gray-400 text-[9px] font-mono block leading-none">
                                                ~{mixedCmcMolar.toFixed(3)} mM
                                              </span>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>

                                    {/* Compatibility Statuses */}
                                    <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">Laundry Detergents (12.0 - 15.0)</span>
                                        {blendedHlb >= 12.0 && blendedHlb <= 15.0 ? (
                                          <span className="text-emerald-600 font-bold">Optimal Compatibility ✅</span>
                                        ) : (
                                          <span className="text-gray-400">Not in Range</span>
                                        )}
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">Dishwash Liquids (13.0 - 15.0)</span>
                                        {blendedHlb >= 13.0 && blendedHlb <= 15.0 ? (
                                          <span className="text-emerald-600 font-bold">Optimal Compatibility ✅</span>
                                        ) : (
                                          <span className="text-gray-400">Not in Range</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Composition Breakdown */}
                                  <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-2">
                                    <span className="text-[10px] font-bold text-gray-700 block uppercase">
                                      Surfactant Ratio Breakdown:
                                    </span>
                                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                      {blenderSurfactants.map((s, sidx) => {
                                        const pct = totalProportion > 0 ? (Number(s.proportion) / totalProportion) * 100 : 0;
                                        if (pct <= 0) return null;
                                        return (
                                          <div key={sidx} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-mono">
                                              <span className="font-medium text-gray-700 truncate max-w-[150px]">{s.name}</span>
                                              <span className="font-extrabold text-[#0f766e]">{pct.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                              <div className="bg-[#0f766e] h-full" style={{ width: `${pct}%` }} />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-400 pt-1 border-t border-gray-50 font-mono">
                                      <span>Total Proportions</span>
                                      <span>{totalProportion.toFixed(1)} units</span>
                                    </div>
                                  </div>

                                  <div className="bg-[#eefcf7] p-3 rounded-lg border border-teal-100 text-center font-mono">
                                    <p className="font-bold text-[10px] text-gray-700">HLB_mix = Σ (Ratio_i × HLB_i) / Σ Ratio_i</p>
                                    <p className="text-[9px] text-gray-500 mt-1 max-w-[280px] mx-auto truncate" title={
                                      blenderSurfactants.filter(s => Number(s.proportion) > 0).map(s => `(${s.proportion}×${s.hlbValue})`).join(" + ")
                                    }>
                                      ({blenderSurfactants.filter(s => Number(s.proportion) > 0).map(s => `(${s.proportion}×${s.hlbValue})`).join("+")}) / {totalProportion.toFixed(1)} = {blendedHlb.toFixed(2)}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2 pt-2">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[10px] uppercase font-bold text-gray-600 block">
                                        Formula Active Concentration:
                                      </label>
                                      <span className="font-bold text-[#0f766e]">
                                        {getFormulaActiveSurfactantPct().toFixed(1)}% Active Surfactants
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-gray-400 block italic leading-none">
                                      {formulationResult 
                                        ? `(Linked to current formula's ${getFormulaActiveSurfactantPct().toFixed(1)}% active surfactant system)` 
                                        : "(Generic standard blend)"}
                                    </span>
                                    
                                    <button
                                      onClick={() => {
                                        if (totalProportion <= 0) {
                                          alert("Please configure positive proportions first!");
                                          return;
                                        }
                                        
                                        setSandboxIngredients(prev => {
                                          let list = JSON.parse(JSON.stringify(prev));
                                          
                                          // Filter out existing surfactants
                                          const nonSurfactants = list.filter((ing: any) => {
                                            const nameLower = ing.name.toLowerCase();
                                            const roleLower = (ing.role || "").toLowerCase();
                                            return !nameLower.includes("labsa") &&
                                                   !nameLower.includes("sles") &&
                                                   !nameLower.includes("capb") &&
                                                   !nameLower.includes("tween") &&
                                                   !nameLower.includes("span") &&
                                                   !nameLower.includes("cocamide") &&
                                                   !nameLower.includes("glucoside") &&
                                                   !nameLower.includes("aos") &&
                                                   !nameLower.includes("lae") &&
                                                   !roleLower.includes("surfactant") &&
                                                   !roleLower.includes("emulsifier") &&
                                                   !roleLower.includes("foam booster");
                                          });
                                          
                                          // Calculate TotalActiveUnits from blender proportions
                                          let totalActiveUnits = 0;
                                          blenderSurfactants.forEach(s => {
                                            const propVal = Number(s.proportion) || 0;
                                            if (propVal > 0) {
                                              const activePct = Number(s.activeMatterPct) || 100;
                                              totalActiveUnits += propVal * (activePct / 100);
                                            }
                                          });

                                          const targetActivePct = getFormulaActiveSurfactantPct();
                                          const k = totalActiveUnits > 0 ? (targetActivePct / totalActiveUnits) : 1;

                                          blenderSurfactants.forEach(s => {
                                            const propVal = Number(s.proportion) || 0;
                                            if (propVal > 0) {
                                              const percentage = Number((k * propVal).toFixed(2));
                                              nonSurfactants.push({
                                                name: s.name,
                                                percentage: percentage,
                                                hlbValue: s.hlbValue !== undefined && s.hlbValue !== null ? Number(s.hlbValue) : 12.0,
                                                activeMatterPct: Number(s.activeMatterPct) || 100,
                                                role: s.role || "Surfactant / Blender Lab",
                                                costPerKg: s.costPerKg
                                              });
                                            }
                                          });
                                          
                                          // Re-balance with water
                                          const totalOthers = nonSurfactants.reduce((sum: number, ing: any) => {
                                            const isWater = ing.name.toLowerCase().includes("water") || ing.name.toLowerCase().includes("aqua") || ing.role.toLowerCase().includes("solvent");
                                            return isWater ? sum : sum + ing.percentage;
                                          }, 0);
                                          
                                          const waterIdx = nonSurfactants.findIndex((ing: any) => 
                                            ing.name.toLowerCase().includes("water") || 
                                            ing.name.toLowerCase().includes("aqua") || 
                                            ing.role.toLowerCase().includes("solvent")
                                          );
                                          if (waterIdx !== -1) {
                                            nonSurfactants[waterIdx].percentage = Math.max(0, Number((100 - totalOthers).toFixed(2)));
                                          } else {
                                            nonSurfactants.push({
                                              name: "Water (Aqua)",
                                              percentage: Math.max(0, Number((100 - totalOthers).toFixed(2))),
                                              hlbValue: null,
                                              activeMatterPct: 0,
                                              role: "Solvent"
                                            });
                                          }
                                          
                                          return nonSurfactants;
                                        });
                                        
                                        alert(`Successfully injected your balanced ${blenderSurfactants.filter(s => (Number(s.proportion) || 0) > 0).length}-Surfactant blend into the Live Sandbox!`);
                                      }}
                                      className="w-full bg-[#0f766e] hover:bg-[#0d645c] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow text-xs transition-all"
                                    >
                                      <Sparkles size={12} /> Inject Multi-Blend into Live Sandbox
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab content 3: Chemistry Reference */}
                    {(sandboxTab === "reference" || sandboxTab === "guide" || sandboxTab === "glossary") && (
                      <div className="space-y-4 animate-fade-in text-xs">
                        {/* Subtabs for Chemistry Reference */}
                        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                          <button
                            type="button"
                            onClick={() => setRefSubTab("guide")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              refSubTab === "guide" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <BookOpen size={13} /> 1. Griffin's Chemistry Guide
                          </button>
                          <button
                            type="button"
                            onClick={() => setRefSubTab("glossary")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              refSubTab === "glossary" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <FileText size={13} /> 2. Glossary of HLB
                          </button>
                        </div>

                        {refSubTab === "guide" && (
                          <div className="space-y-4 text-xs text-gray-700 leading-relaxed max-h-[350px] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                                <span className="font-bold text-[#0f766e] text-xs uppercase block">
                                  📐 Griffin's HLB Calculation Theory
                                </span>
                                <p>
                                  Introduced by William C. Griffin in 1949, the <strong>Hydrophilic-Lipophilic Balance (HLB)</strong> is an empirical scale from 0 to 20 used to classify surfactant molecules by their molecular structure.
                                </p>
                                <p>
                                  For non-ionic ethoxylated surfactants, the HLB is calculated as:
                                </p>
                                <p className="font-mono bg-white p-2 rounded text-center border font-bold text-gray-800">
                                  HLB = 20 × M_h / M
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Where <strong>M_h</strong> is the molecular mass of the hydrophilic portion (usually ethylene oxide chains), and <strong>M</strong> is the total molecular mass of the surfactant.
                                </p>
                                <p>
                                  For a blend of surfactants, the HLB is the weighted arithmetic mean of individual surfactant HLB values based on their weight ratio in the surfactant portion of the recipe:
                                </p>
                                <p className="font-mono bg-white p-2 rounded text-center border font-bold text-gray-800">
                                  HLB_blend = (Σ W_i × HLB_i) / Σ W_i
                                </p>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                                <span className="font-bold text-red-800 text-xs uppercase block">
                                  ⚠️ Emulsion Breakdown Mechanisms
                                </span>
                                <p>
                                  An emulsion is thermodynamically unstable. Surfactants prevent droplet aggregation by forming a mechanical protective film at the droplet interface. A mismatch in HLB leads to rapid breakdown:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                  <li>
                                    <strong>Flocculation:</strong> Droplets clump together but retain separate interfacial films. It is the precursor to coalescence.
                                  </li>
                                  <li>
                                    <strong>Coalescence:</strong> Droplets merge to form larger droplets. If the surfactant film strength is weak (caused by suboptimal HLB), droplets break through the barrier and coalesce immediately.
                                  </li>
                                  <li>
                                    <strong>Creaming / Sedimentation:</strong> Separation of phases driven by density differences. In O/W emulsions, oil cream rises to the top if not properly stabilized.
                                  </li>
                                  <li>
                                    <strong>Phase Inversion (PIT):</strong> The system flips from O/W to W/O or vice-versa due to temperature shifts or composition changes that alter the effective HLB.
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {refSubTab === "glossary" && (
                          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                            <HLBGlossary collapsible={false} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab content 4: Advanced Analysis */}
                    {(sandboxTab === "analysis" || sandboxTab === "analyzer") && (
                      <div className="space-y-4 animate-fade-in text-xs">
                        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                          <button
                            type="button"
                            onClick={() => setAnalysisSubTab("analyzer")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              analysisSubTab === "analyzer" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <Cpu size={13} /> 1. Smart Formula Analyzer Pro
                          </button>
                        </div>

                        {analysisSubTab === "analyzer" && (
                          <SmartFormulaAnalyzerPro
                            lang={lang}
                            translations={translations}
                            ingredients={sandboxIngredients}
                            formulaName={formulationResult?.name || "Custom Formulation"}
                            productType={formulationResult?.productType || productType}
                            grade={formulationResult?.grade || grade}
                            targetCost={formulationResult?.targetCost || targetCost}
                            onApplyIngredients={(updated) => setSandboxIngredients(updated)}
                            waterHardnessPpm={waterHardnessPpm}
                            compatibilityScore={calculateFormulationCompatibility(
                              sandboxIngredients,
                              parseFloat(formulationResult?.properties?.pH) || 7.5
                            ).compatibilityScore}
                            formulationResult={formulationResult}
                          />
                        )}
                      </div>
                    )}

                    {/* Tab content 5: Alternate Raw Material & Regional Cost Substitution Engine */}
                    {sandboxTab === "substitution" && (
                      <div className="space-y-4 animate-fade-in text-xs text-left">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white p-4 md:p-5 rounded-2xl shadow-xs border border-amber-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm md:text-base flex items-center gap-2">
                              <RefreshCw size={18} className="text-amber-300" />
                              Alternate Raw Material & Regional Cost Substitution Engine
                            </h4>
                            <p className="text-amber-100/90 text-xs max-w-2xl">
                              Industrial AI intelligence that recommends cost-saving, eco-upgraded, and regionally available chemical swaps without compromising formula performance or stability.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-600/50">
                            <Globe size={14} className="text-amber-300" />
                            <span className="text-[11px] font-bold text-amber-200">
                              Selected Region: {REGIONAL_MARKET_LABELS[selectedRegion].flag} {REGIONAL_MARKET_LABELS[selectedRegion].name}
                            </span>
                          </div>
                        </div>

                        {/* Applied Substitution Notice */}
                        {appliedSubstitutionNotice && (
                          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2 font-semibold">
                              <CheckCircle size={16} className="text-emerald-600" />
                              <span>{appliedSubstitutionNotice}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAppliedSubstitutionNotice(null)}
                              className="text-emerald-500 hover:text-emerald-800 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Controls: Region Selector & Objectives */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                              <Globe size={13} className="text-[#0f766e]" /> 1. Select Target Regional Market Supply Chain:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {(Object.keys(REGIONAL_MARKET_LABELS) as RegionalMarket[]).map((regKey) => {
                                const reg = REGIONAL_MARKET_LABELS[regKey];
                                const isSelected = selectedRegion === regKey;
                                return (
                                  <button
                                    key={regKey}
                                    type="button"
                                    onClick={() => setSelectedRegion(regKey)}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-[#0f766e] text-white shadow-xs border border-[#0f766e]"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                    }`}
                                    title={reg.description}
                                  >
                                    <span>{reg.flag}</span>
                                    <span>{reg.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 italic">
                              {REGIONAL_MARKET_LABELS[selectedRegion].description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                              <Sparkles size={13} className="text-amber-600" /> 2. Filter Substitution Objective:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { id: "all", label: "All Recommendations", icon: "🔍" },
                                { id: "cost_reduction", label: "Cost Optimization (-10% to -25%)", icon: "💰" },
                                { id: "eco_upgrade", label: "Eco / Biodegradable Upgrade", icon: "🌱" },
                                { id: "regulatory_compliance", label: "Regulatory Compliance (STPP/Formalin Free)", icon: "🏛️" },
                                { id: "hard_water_boost", label: "Hard Water Performance Boost", icon: "💧" }
                              ].map((obj) => {
                                const isSelected = selectedSubstitutionObjective === obj.id;
                                return (
                                  <button
                                    key={obj.id}
                                    type="button"
                                    onClick={() => setSelectedSubstitutionObjective(obj.id as SubstitutionObjective)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-amber-600 text-white font-bold shadow-xs"
                                        : "bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200"
                                    }`}
                                  >
                                    <span>{obj.icon}</span>
                                    <span>{obj.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Analysis Execution */}
                        {(() => {
                          const result = findSubstitutionsForFormula(sandboxIngredients, selectedRegion, selectedSubstitutionObjective);
                          const { recommendations, potentialSavingsPct, overallEcoScoreGain } = result;

                          if (recommendations.length === 0) {
                            return (
                              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                                <CheckCircle size={32} className="text-emerald-600 mx-auto" />
                                <h5 className="font-extrabold text-emerald-900 text-sm">
                                  No Active Raw Material Substitutions Required
                                </h5>
                                <p className="text-emerald-700 text-xs max-w-lg mx-auto">
                                  The current formula ingredients in your sandbox are already fully optimized for the selected regional market (<strong>{REGIONAL_MARKET_LABELS[selectedRegion].name}</strong>) and target objective.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              {/* Summary KPI Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Substitutions Identified
                                  </span>
                                  <div className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                                    <RefreshCw size={18} className="text-[#0f766e]" />
                                    <span>{recommendations.length} Ingredients</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Targeting {selectedSubstitutionObjective.replace('_', ' ')}
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Avg Raw Material Cost Delta
                                  </span>
                                  <div className="text-lg font-black text-emerald-600 flex items-center gap-1.5">
                                    <span>{potentialSavingsPct <= 0 ? `${potentialSavingsPct}%` : `+${potentialSavingsPct}%`}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Estimated batch cost impact
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Eco Index Improvement
                                  </span>
                                  <div className="text-lg font-black text-teal-700 flex items-center gap-1.5">
                                    <span>+{overallEcoScoreGain} Rating Points</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Biodegradability & bio-based content
                                  </span>
                                </div>
                              </div>

                              {/* Recommendations List */}
                              <div className="space-y-3">
                                {recommendations.map((item, idx) => {
                                  const { rule, originalIngredient, recommendedQtyPct, regionalInfo } = item;
                                  return (
                                    <div
                                      key={`${rule.id}-${idx}`}
                                      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                                    >
                                      {/* Recommendation Top Bar */}
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                            {rule.substitutionType}
                                          </span>
                                          <span className="text-xs font-bold text-slate-800">
                                            {rule.targetCategory}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                          <span className="text-slate-500">Confidence:</span>
                                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            {rule.confidenceScore}% High
                                          </span>
                                        </div>
                                      </div>

                                      {/* Swap Overview Row */}
                                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                                        <div className="md:col-span-5 space-y-0.5">
                                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Current Ingredient:</span>
                                          <div className="font-extrabold text-slate-800 text-sm">
                                            {originalIngredient.name} <span className="text-teal-700 text-xs">({originalIngredient.percentage}%)</span>
                                          </div>
                                          <span className="text-[10px] text-gray-500 block">{originalIngredient.role}</span>
                                        </div>

                                        <div className="md:col-span-2 text-center flex flex-col items-center justify-center">
                                          <ArrowRight size={20} className="text-amber-600 hidden md:block" />
                                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                            Swap Ratio {rule.replacementRatio}x
                                          </span>
                                        </div>

                                        <div className="md:col-span-5 space-y-0.5">
                                          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Recommended Alternate:</span>
                                          <div className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5">
                                            <span>{rule.substituteName}</span>
                                            <span className="text-emerald-700 text-xs">({recommendedQtyPct}%)</span>
                                          </div>
                                          {rule.substituteInci && (
                                            <span className="text-[10px] text-gray-500 block italic">INCI: {rule.substituteInci}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Warning callout if present */}
                                      {rule.warning && (
                                        <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-xs flex items-start gap-2">
                                          <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold">Regulatory Alert: </span>
                                            <span>{rule.warning}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Reason & Regional Suitability */}
                                      <div className="space-y-1.5">
                                        <p className="text-slate-700 font-medium text-xs">
                                          💡 <strong>Scientific Justification:</strong> {rule.reason}
                                        </p>
                                        <div className="bg-teal-50/60 p-2.5 rounded-xl border border-teal-200/80 text-[11px] text-teal-900 flex items-center gap-2">
                                          <span className="text-base">{REGIONAL_MARKET_LABELS[selectedRegion].flag}</span>
                                          <div>
                                            <strong className="font-bold text-teal-950">
                                              {REGIONAL_MARKET_LABELS[selectedRegion].name} Regional Intelligence:
                                            </strong>{" "}
                                            {regionalInfo.note} (Suitability Score: {regionalInfo.suitabilityScore}/100)
                                          </div>
                                        </div>
                                      </div>

                                      {/* Detailed Scientific Impact Matrix */}
                                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                                          🔬 Scientific Property Trade-Off Matrix:
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[10px]">
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧪 pH Impact</span>
                                            <p className="text-gray-600">{rule.phImpact}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🫧 Foam Height & Stability</span>
                                            <p className="text-gray-600">{rule.foamImpact}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧽 Soil Detergency</span>
                                            <p className="text-gray-600">{rule.cleaningImpact}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">💧 Viscosity & Rheology</span>
                                            <p className="text-gray-600">{rule.viscosityImpact}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧊 Storage Stability</span>
                                            <p className="text-gray-600">{rule.stabilityImpact}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🌱 Eco & Biodegradability</span>
                                            <p className="text-gray-600">{rule.ecoImpact}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Advantages & Disadvantages lists */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                                            <CheckCircle size={12} className="text-emerald-600" /> Key Formulation Advantages:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                                            {rule.advantages.map((adv, aIdx) => (
                                              <li key={aIdx}>{adv}</li>
                                            ))}
                                          </ul>
                                        </div>

                                        <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                                          <span className="font-bold text-amber-800 flex items-center gap-1">
                                            <Info size={12} className="text-amber-600" /> Formulation Trade-offs / Considerations:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                                            {rule.disadvantages.map((dis, dIdx) => (
                                              <li key={dIdx}>{dis}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {/* Apply Substitution Action Button */}
                                      <div className="pt-2 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => handleApplySubstitutionRule(rule, originalIngredient.name)}
                                          className="bg-[#0f766e] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                                        >
                                          <RefreshCw size={14} />
                                          <span>Apply Substitution into Formula</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab content 6: Climate & Hard Water Intelligence Engine */}
                    {sandboxTab === "climate" && (
                      <div className="space-y-4 animate-fade-in text-xs text-left">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-cyan-900 via-teal-800 to-cyan-950 text-white p-4 md:p-5 rounded-2xl shadow-xs border border-cyan-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm md:text-base flex items-center gap-2">
                              <CloudSun size={18} className="text-cyan-300" />
                              Climate & Hard Water Intelligence Engine
                            </h4>
                            <p className="text-cyan-100/90 text-xs max-w-2xl">
                              Industrial environmental simulation that audits surfactant Krafft points, chelator binding capacity, thermal cloud points, and preservative breakdown under extreme global climate stress.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <div className="bg-cyan-950/80 px-3 py-1.5 rounded-xl border border-cyan-600/50 flex items-center gap-1.5">
                              <Thermometer size={14} className="text-cyan-300" />
                              <span className="text-[11px] font-bold text-cyan-200">
                                {CLIMATE_PRESETS[selectedClimatePreset].icon} {CLIMATE_PRESETS[selectedClimatePreset].name} ({CLIMATE_PRESETS[selectedClimatePreset].tempRange})
                              </span>
                            </div>
                            <div className="bg-cyan-950/80 px-3 py-1.5 rounded-xl border border-cyan-600/50 flex items-center gap-1.5">
                              <Droplets size={14} className="text-cyan-300" />
                              <span className="text-[11px] font-bold text-cyan-200">
                                {WATER_HARDNESS_PRESETS[selectedHardnessPreset].ppmRange}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Applied Recommendation Notice */}
                        {appliedClimateRecommendationNotice && (
                          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2 font-semibold">
                              <CheckCircle size={16} className="text-emerald-600" />
                              <span>{appliedClimateRecommendationNotice}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAppliedClimateRecommendationNotice(null)}
                              className="text-emerald-500 hover:text-emerald-800 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Presets Selection Panel */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                          {/* 1. Climate Preset Selector */}
                          <div>
                            <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                              <CloudSun size={14} className="text-[#0f766e]" /> 1. Select Target Climate & Storage Environment:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {(Object.keys(CLIMATE_PRESETS) as ClimatePreset[]).map((cKey) => {
                                const preset = CLIMATE_PRESETS[cKey];
                                const isSelected = selectedClimatePreset === cKey;
                                return (
                                  <button
                                    key={cKey}
                                    type="button"
                                    onClick={() => setSelectedClimatePreset(cKey)}
                                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                                      isSelected
                                        ? "bg-teal-50 border-[#0f766e] ring-2 ring-[#0f766e]/20 shadow-xs"
                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-base">{preset.icon}</span>
                                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                        isSelected ? "bg-[#0f766e] text-white" : "bg-slate-200 text-slate-700"
                                      }`}>
                                        {preset.tempRange}
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-slate-800 text-xs mt-1">
                                      {preset.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                      {preset.humidityRange}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Water Hardness Selector */}
                          <div className="pt-3 border-t border-slate-100">
                            <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                              <Droplets size={14} className="text-cyan-700" /> 2. Select Wash Water Hardness Level:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {(Object.keys(WATER_HARDNESS_PRESETS) as WaterHardnessPreset[]).map((hKey) => {
                                const hPreset = WATER_HARDNESS_PRESETS[hKey];
                                const isSelected = selectedHardnessPreset === hKey;
                                return (
                                  <button
                                    key={hKey}
                                    type="button"
                                    onClick={() => setSelectedHardnessPreset(hKey)}
                                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                                      isSelected
                                        ? "bg-cyan-50 border-cyan-600 ring-2 ring-cyan-600/20 shadow-xs"
                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                                    }`}
                                  >
                                    <div className="font-black text-cyan-950 text-xs">
                                      {hPreset.ppmRange}
                                    </div>
                                    <div className="font-extrabold text-slate-800 text-[11px] truncate mt-0.5">
                                      {hPreset.name}
                                    </div>
                                    <div className="text-[9px] text-gray-500 truncate mt-0.5">
                                      {hPreset.ionicLoad}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Climate Analysis Execution */}
                        {(() => {
                          const analysis = analyzeClimateAndHardWater(
                            sandboxIngredients,
                            selectedClimatePreset,
                            selectedHardnessPreset,
                            autoBalanceWater
                          );

                          const {
                            climateInfo,
                            hardnessInfo,
                            calculatedHardnessTolerance,
                            isHardnessExceeded,
                            expectedStabilityScore,
                            thermalRisks,
                            recommendations,
                            industrialNotes,
                            recommendedWaterPct,
                            saltStrategyNote
                          } = analysis;

                          return (
                            <div className="space-y-4">
                              {/* Summary KPI Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Expected Stability Index
                                  </span>
                                  <div className={`text-lg font-black flex items-center gap-1.5 ${
                                    expectedStabilityScore >= 85 ? "text-emerald-600" : expectedStabilityScore >= 70 ? "text-amber-600" : "text-red-600"
                                  }`}>
                                    <ShieldAlert size={18} />
                                    <span>{expectedStabilityScore} / 100</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    {expectedStabilityScore >= 85 ? "Stable Formulation" : expectedStabilityScore >= 70 ? "At Thermal Risk" : "Critical Phase Stress"}
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Hardness Binding Capacity
                                  </span>
                                  <div className={`text-lg font-black flex items-center gap-1.5 ${
                                    isHardnessExceeded ? "text-red-600" : "text-emerald-600"
                                  }`}>
                                    <Droplets size={18} />
                                    <span>{calculatedHardnessTolerance.maxSupportedPpm} ppm CaCO3</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Target Wash Water: {hardnessInfo.targetPpm} ppm
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Storage Temp Spec
                                  </span>
                                  <div className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                                    <Thermometer size={18} className="text-cyan-700" />
                                    <span>{climateInfo.storageTemp}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Ambient: {climateInfo.tempRange}
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    AI Recommendations
                                  </span>
                                  <div className="text-lg font-black text-[#0f766e] flex items-center gap-1.5">
                                    <Sparkles size={18} />
                                    <span>{recommendations.length} Actions</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Advisory optimization swaps
                                  </span>
                                </div>
                              </div>

                              {/* Formulator Recommended Specs Matrix Table */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                                <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <Sliders size={14} className="text-[#0f766e]" /> Recommended Formulator Specifications for {climateInfo.name}:
                                </h5>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">🛡️ Recommended Chelator</span>
                                    <p className="text-gray-600 font-medium">{hardnessInfo.recommendedChelators}</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">🧱 Recommended Builder</span>
                                    <p className="text-gray-600 font-medium">{hardnessInfo.recommendedBuilders}</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">🧪 Recommended Buffer</span>
                                    <p className="text-gray-600 font-medium">{hardnessInfo.recommendedBuffers}</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">💧 Auto-Balanced Water Target</span>
                                    <p className="text-[#0f766e] font-black">{recommendedWaterPct}% Water / Solvent balance</p>
                                  </div>
                                </div>

                                <div className="bg-cyan-50/60 p-2.5 rounded-xl border border-cyan-200/80 text-cyan-900 text-[11px] font-medium flex items-center gap-2">
                                  <Info size={14} className="text-cyan-700 shrink-0" />
                                  <div>
                                    <strong>Salt & Viscosity Dosing Strategy:</strong> {saltStrategyNote}
                                  </div>
                                </div>
                              </div>

                              {/* Active Thermal & Hard Water Warnings */}
                              {thermalRisks.length > 0 && (
                                <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl space-y-2">
                                  <h5 className="font-extrabold text-red-900 text-xs flex items-center gap-1.5">
                                    <AlertTriangle size={15} className="text-red-600" />
                                    Active Climate & Hard Water Stability Risk Warnings ({thermalRisks.length}):
                                  </h5>
                                  <ul className="list-disc pl-5 space-y-1 text-red-800 text-[11px]">
                                    {thermalRisks.map((risk, rIdx) => (
                                      <li key={rIdx}>{risk}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Recommendations List */}
                              {recommendations.length > 0 ? (
                                <div className="space-y-3">
                                  <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-600" /> Advisory Climate Optimization Swaps:
                                  </h5>

                                  {recommendations.map((rec) => (
                                    <div
                                      key={rec.id}
                                      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                                    >
                                      {/* Top Bar */}
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300">
                                            {rec.category}
                                          </span>
                                          <span className="text-xs font-bold text-slate-800">
                                            {rec.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                          <span className="text-slate-500">AI Scientific Confidence:</span>
                                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            {rec.confidenceScore}% High
                                          </span>
                                        </div>
                                      </div>

                                      {/* Reason & Scientific Explanation */}
                                      <div className="space-y-2 text-[11px]">
                                        <p className="text-slate-800 font-semibold">
                                          💡 <strong>Formulation Reason:</strong> {rec.reason}
                                        </p>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                                          <span className="font-extrabold text-slate-900 block text-[10px] uppercase tracking-wider">
                                            🔬 Chemical Mechanism & Scientific Rationale:
                                          </span>
                                          <p className="leading-relaxed">{rec.scientificExplanation}</p>
                                        </div>
                                      </div>

                                      {/* Expected Impact Matrix */}
                                      <div className="space-y-1.5">
                                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">
                                          📊 Expected Multi-Dimensional Performance Impact:
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[10px]">
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧽 Cleaning</span>
                                            <p className="text-gray-600">{rec.expectedImpact.cleaning}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🫧 Foam Profile</span>
                                            <p className="text-gray-600">{rec.expectedImpact.foam}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧊 Thermal Stability</span>
                                            <p className="text-gray-600">{rec.expectedImpact.stability}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">💰 Cost Impact</span>
                                            <p className="text-gray-600">{rec.expectedImpact.cost}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🌱 Eco & Bio Rating</span>
                                            <p className="text-gray-600">{rec.expectedImpact.eco}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Advantages & Disadvantages */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                                            <CheckCircle size={12} className="text-emerald-600" /> Formulation Advantages:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                                            {rec.advantages.map((adv, aIdx) => (
                                              <li key={aIdx}>{adv}</li>
                                            ))}
                                          </ul>
                                        </div>

                                        <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                                          <span className="font-bold text-amber-800 flex items-center gap-1">
                                            <Info size={12} className="text-amber-600" /> Formulation Trade-offs:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                                            {rec.disadvantages.map((dis, dIdx) => (
                                              <li key={dIdx}>{dis}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {/* Action Button */}
                                      <div className="pt-2 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => handleApplyClimateRecommendation(rec)}
                                          className="bg-[#0f766e] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                                        >
                                          <CheckCircle size={14} />
                                          <span>Accept & Apply Recommendation into Formula</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                                  <CheckCircle size={32} className="text-emerald-600 mx-auto" />
                                  <h5 className="font-extrabold text-emerald-900 text-sm">
                                    Formula Fully Optimized for {climateInfo.name} & {hardnessInfo.name}
                                  </h5>
                                  <p className="text-emerald-700 text-xs max-w-lg mx-auto">
                                    The active ingredients in your sandbox are fully capable of maintaining physical stability, phase clarity, and active cleaning power under the selected environmental parameters.
                                  </p>
                                </div>
                              )}

                              {/* Industrial Notes Footer */}
                              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-700">
                                <span className="font-bold block text-[#0f766e]">🏭 Industrial R&D Quality Control Notes:</span>
                                {industrialNotes.map((note, nIdx) => (
                                  <p key={nIdx}>• {note}</p>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab content 7: Machine Profile Intelligence Engine (Phase 15C) */}
                    {sandboxTab === "machine" && (
                      <div className="space-y-4 animate-fade-in text-xs text-left">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white p-4 md:p-5 rounded-2xl shadow-xs border border-indigo-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm md:text-base flex items-center gap-2">
                              <WashingMachine size={18} className="text-indigo-300" />
                              Machine Profile Intelligence Engine (Phase 15C)
                            </h4>
                            <p className="text-indigo-100/90 text-xs max-w-2xl">
                              Audit washing machine profile compatibility, mechanical shear forces, drum suds-lock risks, defoamer requirement, and rinse efficiency using existing scientific engines.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <div className="bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-600/50 flex items-center gap-1.5">
                              <span className="text-base">{MACHINE_PROFILES[selectedMachineProfile].icon}</span>
                              <span className="text-[11px] font-bold text-indigo-200">
                                {MACHINE_PROFILES[selectedMachineProfile].name}
                              </span>
                            </div>
                            <div className="bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-600/50 flex items-center gap-1.5">
                              <Sliders size={14} className="text-indigo-300" />
                              <span className="text-[11px] font-bold text-indigo-200">
                                Target: {MACHINE_PROFILES[selectedMachineProfile].targetFoamMm}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Applied Recommendation Notice */}
                        {appliedMachineRecommendationNotice && (
                          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2 font-semibold">
                              <CheckCircle size={16} className="text-emerald-600" />
                              <span>{appliedMachineRecommendationNotice}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAppliedMachineRecommendationNotice(null)}
                              className="text-emerald-500 hover:text-emerald-800 p-1 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Machine Profile Selector Grid */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                          <label className="font-bold text-slate-700 block flex items-center gap-1.5 text-xs">
                            <WashingMachine size={15} className="text-indigo-700" /> Select Target Washing Machine / Application Profile:
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {(Object.keys(MACHINE_PROFILES) as MachineProfile[]).map((mKey) => {
                              const profile = MACHINE_PROFILES[mKey];
                              const isSelected = selectedMachineProfile === mKey;
                              return (
                                <button
                                  key={mKey}
                                  type="button"
                                  onClick={() => setSelectedMachineProfile(mKey)}
                                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                                    isSelected
                                      ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-base">{profile.icon}</span>
                                    <span className={`text-[9px] font-extrabold px-1 rounded ${
                                      isSelected ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-700"
                                    }`}>
                                      {profile.targetFoamCategory.split(" ")[0]}
                                    </span>
                                  </div>
                                  <div className="font-extrabold text-slate-800 text-[11px] mt-1.5 truncate">
                                    {profile.name}
                                  </div>
                                  <div className="text-[9px] text-gray-500 truncate mt-0.5">
                                    {profile.targetFoamMm}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Machine Analysis Execution */}
                        {(() => {
                          const analysis = analyzeMachineProfile(
                            sandboxIngredients,
                            selectedMachineProfile,
                            autoBalanceWater
                          );

                          const {
                            machineInfo,
                            estimatedFoamHeightMm,
                            foamCategoryMatch,
                            cleaningPerformance,
                            activeSurfactantPct,
                            rawSurfactantPct,
                            isHighAnionicRisk,
                            isDefoamerPresent,
                            recommendations,
                            industrialNotes
                          } = analysis;

                          return (
                            <div className="space-y-4">
                              {/* Summary KPI Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Expected Foam Height
                                  </span>
                                  <div className={`text-lg font-black flex items-center gap-1.5 ${
                                    foamCategoryMatch ? "text-emerald-600" : "text-amber-600"
                                  }`}>
                                    <WashingMachine size={18} />
                                    <span>{estimatedFoamHeightMm} mm</span>
                                  </div>
                                  <span className={`text-[10px] font-bold block ${
                                    foamCategoryMatch ? "text-emerald-700" : "text-amber-700"
                                  }`}>
                                    Target Spec: {machineInfo.targetFoamMm} ({foamCategoryMatch ? "Match" : "Risk"})
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Cleaning Detergency Score
                                  </span>
                                  <div className="text-lg font-black text-indigo-700 flex items-center gap-1.5">
                                    <Sparkles size={18} />
                                    <span>{cleaningPerformance.cleaningScore} / 100</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Active Cleaning Rating
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Active Surfactants
                                  </span>
                                  <div className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                                    <Dna size={18} className="text-indigo-600" />
                                    <span>{activeSurfactantPct.toFixed(1)}% Active</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Raw Surfactants: {rawSurfactantPct.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Defoamer & Safety Status
                                  </span>
                                  <div className={`text-lg font-black flex items-center gap-1.5 ${
                                    isDefoamerPresent ? "text-emerald-600" : isHighAnionicRisk ? "text-red-600" : "text-slate-700"
                                  }`}>
                                    <ShieldAlert size={18} />
                                    <span>{isDefoamerPresent ? "Protected" : isHighAnionicRisk ? "Suds-Lock Risk" : "Standard"}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    {isDefoamerPresent ? "Silicone Antifoam Present" : "No Defoamer Detected"}
                                  </span>
                                </div>
                              </div>

                              {/* Formulator Recommended Specs Matrix Table */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                                <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <Sliders size={14} className="text-indigo-700" /> Washing Machine Operational Specifications for {machineInfo.name}:
                                </h5>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">🌀 Mechanical Agitation Type</span>
                                    <p className="text-gray-600 font-medium">{machineInfo.agitationType}</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">💧 Water Liquor Ratio</span>
                                    <p className="text-gray-600 font-medium">{machineInfo.waterUsagePerKg}</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">⚡ Mechanical Drop Force</span>
                                    <p className="text-gray-600 font-medium">{machineInfo.mechanicalAction}</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700 block">⚠️ Primary Application Risk</span>
                                    <p className="text-amber-700 font-medium">{machineInfo.primaryRisk}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Foam Profile & Mechanical Suitability Matrix */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                                <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <FlaskConical size={14} className="text-indigo-700" /> Expected Foam Profile & Rinse Behavior Matrix:
                                </h5>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px]">
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                    <span className="font-bold text-slate-700 block">🧼 Foam Height</span>
                                    <p className="text-indigo-800 font-black text-xs">{estimatedFoamHeightMm} mm</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                    <span className="font-bold text-slate-700 block">⏱️ Foam Stability</span>
                                    <p className="text-gray-700 font-bold">{isDefoamerPresent ? "Low (Fast Collapse)" : "Moderate-High"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                    <span className="font-bold text-slate-700 block">⚡ Flash Foam</span>
                                    <p className="text-gray-700 font-bold">{estimatedFoamHeightMm > 100 ? "High" : estimatedFoamHeightMm > 50 ? "Moderate" : "Controlled"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                    <span className="font-bold text-slate-700 block">🚿 Rinse Efficiency</span>
                                    <p className="text-gray-700 font-bold">{isDefoamerPresent ? "Ultra-Fast (1-2 cycles)" : "Standard (2-3 cycles)"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                    <span className="font-bold text-slate-700 block">🧼 Residual Foam</span>
                                    <p className="text-gray-700 font-bold">{estimatedFoamHeightMm < 50 ? "Zero Residual" : "Trace Residual"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                    <span className="font-bold text-slate-700 block">⚙️ Machine Suitability</span>
                                    <p className={`font-black ${foamCategoryMatch ? "text-emerald-700" : "text-amber-700"}`}>
                                      {foamCategoryMatch ? "100% Compatible" : "Requires Optimization"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Active Warnings */}
                              {isHighAnionicRisk && (
                                <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl space-y-2">
                                  <h5 className="font-extrabold text-red-900 text-xs flex items-center gap-1.5">
                                    <AlertTriangle size={15} className="text-red-600" />
                                    Active Machine Oversuds Risk Warning:
                                  </h5>
                                  <p className="text-red-800 text-[11px]">
                                    High anionic surfactant level creates excess foam height ({estimatedFoamHeightMm} mm) for {machineInfo.name}. High risk of drum suds-lock, incomplete rinsing, and water sensor fault aborts.
                                  </p>
                                </div>
                              )}

                              {/* Recommendations List */}
                              {recommendations.length > 0 ? (
                                <div className="space-y-3">
                                  <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-indigo-600" /> Advisory Machine Optimization Recommendations ({recommendations.length}):
                                  </h5>

                                  {recommendations.map((rec) => (
                                    <div
                                      key={rec.id}
                                      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                                    >
                                      {/* Top Bar */}
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-300">
                                            {rec.category}
                                          </span>
                                          <span className="text-xs font-bold text-slate-800">
                                            {rec.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                          <span className="text-slate-500">AI Scientific Confidence:</span>
                                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            {rec.confidenceScore}% High
                                          </span>
                                        </div>
                                      </div>

                                      {/* Reason & Scientific Explanation */}
                                      <div className="space-y-2 text-[11px]">
                                        <p className="text-slate-800 font-semibold">
                                          💡 <strong>Formulation Reason:</strong> {rec.reason}
                                        </p>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                                          <span className="font-extrabold text-slate-900 block text-[10px] uppercase tracking-wider">
                                            🔬 Chemical Mechanism & Scientific Rationale:
                                          </span>
                                          <p className="leading-relaxed">{rec.scientificExplanation}</p>
                                        </div>
                                      </div>

                                      {/* Expected Impact Matrix */}
                                      <div className="space-y-1.5">
                                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">
                                          📊 Expected Performance Impact:
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[10px]">
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧼 Foam Profile</span>
                                            <p className="text-gray-600">{rec.expectedImpact.foamMm}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🧽 Detergency</span>
                                            <p className="text-gray-600">{rec.expectedImpact.cleaningScore}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🚿 Rinse Efficiency</span>
                                            <p className="text-gray-600">{rec.expectedImpact.rinseCycles}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">🛡️ Machine Safety</span>
                                            <p className="text-gray-600">{rec.expectedImpact.machineSafety}</p>
                                          </div>
                                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                            <span className="font-bold text-slate-700 block">💰 Cost Impact</span>
                                            <p className="text-gray-600">{rec.expectedImpact.costImpact}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Advantages & Disadvantages */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                                            <CheckCircle size={12} className="text-emerald-600" /> Formulation Advantages:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                                            {rec.advantages.map((adv, aIdx) => (
                                              <li key={aIdx}>{adv}</li>
                                            ))}
                                          </ul>
                                        </div>

                                        <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                                          <span className="font-bold text-amber-800 flex items-center gap-1">
                                            <Info size={12} className="text-amber-600" /> Formulation Trade-offs:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                                            {rec.disadvantages.map((dis, dIdx) => (
                                              <li key={dIdx}>{dis}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {/* Action Button */}
                                      <div className="pt-2 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => handleApplyMachineRecommendation(rec)}
                                          className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                                        >
                                          <CheckCircle size={14} />
                                          <span>Accept & Apply Recommendation into Formula</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                                  <CheckCircle size={32} className="text-emerald-600 mx-auto" />
                                  <h5 className="font-extrabold text-emerald-900 text-sm">
                                    Formula Fully Compatible with {machineInfo.name}
                                  </h5>
                                  <p className="text-emerald-700 text-xs max-w-lg mx-auto">
                                    The foam profile, surfactant system, and detergency balance are fully optimized for the selected washing machine mechanical agitation profile.
                                  </p>
                                </div>
                              )}

                              {/* Industrial Notes Footer */}
                              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-700">
                                <span className="font-bold block text-indigo-900">🏭 Industrial Machine R&D Quality Control Notes:</span>
                                {industrialNotes.map((note, nIdx) => (
                                  <p key={nIdx}>• {note}</p>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab content 8: Interactive Root Cause Troubleshooter (Phase 15D) */}
                    {sandboxTab === "troubleshooter" && (
                      <div className="space-y-4 animate-fade-in text-xs text-left">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 text-white p-4 md:p-5 rounded-2xl shadow-xs border border-rose-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm md:text-base flex items-center gap-2">
                              <Wrench size={18} className="text-rose-300" />
                              Interactive Root Cause Troubleshooter (Phase 15D)
                            </h4>
                            <p className="text-rose-100/90 text-xs max-w-2xl">
                              Diagnose physical & chemical formulation failures, micellar destabilization, salt-curve collapse, and hard water interference using existing scientific engines.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <div className="bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-600/50 flex items-center gap-1.5">
                              <span className="text-base">{PROBLEM_DEFINITIONS[selectedProblemCategory].icon}</span>
                              <span className="text-[11px] font-bold text-rose-200">
                                {PROBLEM_DEFINITIONS[selectedProblemCategory].name.split("(")[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Applied Action Notice */}
                        {appliedTroubleshooterNotice && (
                          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2 font-semibold">
                              <CheckCircle size={16} className="text-emerald-600" />
                              <span>{appliedTroubleshooterNotice}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAppliedTroubleshooterNotice(null)}
                              className="text-emerald-500 hover:text-emerald-800 p-1 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Problem Category Selector Grid */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                          <label className="font-bold text-slate-700 block flex items-center gap-1.5 text-xs">
                            <Wrench size={15} className="text-rose-700" /> Select Observed Physical or Performance Defect:
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {(Object.keys(PROBLEM_DEFINITIONS) as ProblemCategory[]).map((pKey) => {
                              const problem = PROBLEM_DEFINITIONS[pKey];
                              const isSelected = selectedProblemCategory === pKey;
                              return (
                                <button
                                  key={pKey}
                                  type="button"
                                  onClick={() => setSelectedProblemCategory(pKey)}
                                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                                    isSelected
                                      ? "bg-rose-50 border-rose-600 ring-2 ring-rose-600/20 shadow-xs"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-base">{problem.icon}</span>
                                  </div>
                                  <div className="font-extrabold text-slate-800 text-[11px] mt-1.5 truncate">
                                    {problem.name.split(" ")[0]}
                                  </div>
                                  <div className="text-[9px] text-gray-500 truncate mt-0.5">
                                    {problem.symptoms[0]}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Troubleshooter Engine Execution */}
                        {(() => {
                          const diagnosis = runRootCauseTroubleshooter(
                            sandboxIngredients,
                            selectedProblemCategory,
                            autoBalanceWater
                          );

                          const {
                            selectedProblem,
                            detectedWarnings,
                            cleaningPerformance,
                            estimatedPH,
                            activeSurfactants,
                            actions,
                            industrialNotes
                          } = diagnosis;

                          return (
                            <div className="space-y-4">
                              {/* Diagnostic Summary Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Target Symptom
                                  </span>
                                  <div className="text-sm font-black text-rose-800 truncate flex items-center gap-1.5">
                                    <span>{selectedProblem.icon}</span>
                                    <span className="truncate">{selectedProblem.name.split("(")[0]}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block truncate">
                                    {selectedProblem.symptoms[0]}
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    System Detected Warnings
                                  </span>
                                  <div className={`text-lg font-black flex items-center gap-1.5 ${
                                    detectedWarnings.length > 0 ? "text-amber-600" : "text-emerald-600"
                                  }`}>
                                    <AlertTriangle size={18} />
                                    <span>{detectedWarnings.length} Issues</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    {detectedWarnings.length > 0 ? "Potential Formula Risk" : "No Critical Faults"}
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Cleaning Performance Score
                                  </span>
                                  <div className="text-lg font-black text-indigo-700 flex items-center gap-1.5">
                                    <Sparkles size={18} />
                                    <span>{cleaningPerformance.cleaningScore} / 100</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Active Cleaning Rating
                                  </span>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                                    Estimated pH & Active Matter
                                  </span>
                                  <div className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                                    <FlaskConical size={18} className="text-indigo-600" />
                                    <span>pH {estimatedPH.toFixed(2)}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 block">
                                    Active Surfactant: {activeSurfactants.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              {/* Detected System Warnings Box if any */}
                              {detectedWarnings.length > 0 && (
                                <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-xl space-y-2">
                                  <h5 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                                    <AlertTriangle size={15} className="text-amber-600" />
                                    System-Wide Audit Warnings Detected in Current Formula ({detectedWarnings.length}):
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                    {detectedWarnings.map((warn, wIdx) => (
                                      <div key={wIdx} className="bg-white/80 p-2 rounded border border-amber-200 text-amber-900 font-medium">
                                        • {warn}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Diagnostic Actions List */}
                              <div className="space-y-3">
                                <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <Wrench size={14} className="text-rose-700" /> Scientific Root Cause Analysis & Corrective Actions ({actions.length}):
                                </h5>

                                {actions.map((act) => (
                                  <div
                                    key={act.id}
                                    className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
                                  >
                                    {/* Top Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                          act.severity === "Critical"
                                            ? "bg-red-100 text-red-800 border-red-300"
                                            : act.severity === "Warning"
                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                            : "bg-blue-100 text-blue-800 border-blue-300"
                                        }`}>
                                          {act.severity}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800">
                                          {act.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                        <span className="text-slate-500">Diagnostic Confidence:</span>
                                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                          {act.confidenceScore}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Root Cause & Mechanism */}
                                    <div className="space-y-2 text-[11px]">
                                      <p className="text-rose-900 font-semibold bg-rose-50/60 p-2.5 rounded-xl border border-rose-200">
                                        ❓ <strong>Identified Root Cause:</strong> {act.rootCause}
                                      </p>
                                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                                        <span className="font-extrabold text-slate-900 block text-[10px] uppercase tracking-wider">
                                          🔬 Chemical Mechanism & Solution Rationale:
                                        </span>
                                        <p className="leading-relaxed">{act.scientificExplanation}</p>
                                      </div>
                                    </div>

                                    {/* Expected Impact Matrix */}
                                    <div className="space-y-1.5">
                                      <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">
                                        📊 Projected Performance Restoration Impact:
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[10px]">
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                          <span className="font-bold text-slate-700 block">🧽 Detergency</span>
                                          <p className="text-gray-600">{act.expectedImpact.cleaning}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                          <span className="font-bold text-slate-700 block">🧼 Foam Profile</span>
                                          <p className="text-gray-600">{act.expectedImpact.foam}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                          <span className="font-bold text-slate-700 block">⚗️ Physical Stability</span>
                                          <p className="text-gray-600">{act.expectedImpact.stability}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                          <span className="font-bold text-slate-700 block">⚖️ pH Shift</span>
                                          <p className="text-gray-600">{act.expectedImpact.pH}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                          <span className="font-bold text-slate-700 block">💰 Batch Cost</span>
                                          <p className="text-gray-600">{act.expectedImpact.cost}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Advantages & Disadvantages */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                                          <CheckCircle size={12} className="text-emerald-600" /> Corrective Action Advantages:
                                        </span>
                                        <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                                          {act.advantages.map((adv, aIdx) => (
                                            <li key={aIdx}>{adv}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                                        <span className="font-bold text-amber-800 flex items-center gap-1">
                                          <Info size={12} className="text-amber-600" /> Operational Considerations:
                                        </span>
                                        <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                                          {act.disadvantages.map((dis, dIdx) => (
                                            <li key={dIdx}>{dis}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleApplyTroubleshooterAction(act)}
                                        className="bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                                      >
                                        <CheckCircle size={14} />
                                        <span>Accept & Apply Corrective Action into Formula</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Industrial QC Notes Footer */}
                              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-700">
                                <span className="font-bold block text-rose-900">🏭 Industrial Laboratory QC Diagnostic Notes:</span>
                                {industrialNotes.map((note, nIdx) => (
                                  <p key={nIdx}>• {note}</p>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab content 9: Developer / Research */}
                    {sandboxTab === "developer" && (
                      <div className="space-y-4 animate-fade-in text-xs">
                        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                          <button
                            type="button"
                            onClick={() => setDevSubTab("json")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              devSubTab === "json" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <Code size={13} /> 1. Raw JSON Inspector
                          </button>
                          <button
                            type="button"
                            onClick={() => setDevSubTab("cache")}
                            className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              devSubTab === "cache" ? "bg-white text-[#0f766e] shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <Database size={13} /> 2. Cache & Storage Inspector
                          </button>
                        </div>

                        {devSubTab === "json" && (
                          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2 text-left">
                            <span className="text-teal-400 font-bold block">// Active Live Sandbox State JSON:</span>
                            <pre className="text-slate-300">{JSON.stringify(sandboxIngredients, null, 2)}</pre>
                          </div>
                        )}

                        {devSubTab === "cache" && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-left">
                            <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <Database size={14} className="text-[#0f766e]" /> LocalStorage Session Cache Inspector
                            </h5>
                            <p className="text-gray-600 text-[11px]">
                              Inspect active local session cache parameters and persistent formulation state.
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-700">
                              Active Water Hardness: {waterHardnessPpm} ppm | Active Ingredients: {sandboxIngredients.length} items
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Batch size scale controls */}
                  <div className="bg-[#f3f4f6] p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="space-y-0.5">
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
                        className="w-24 bg-white border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                      <span className="text-xs font-bold text-gray-700">kg batch</span>
                    </div>
                  </div>

                  {/* Ingredients Table */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Scaled Ingredient Additions Table (Scaled for {batchSize} kg batch)
                    </h4>
                    <div className="border border-[#e5e7eb] rounded-xl overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-[#f3f4f6] text-gray-700 font-bold border-b border-[#e5e7eb]">
                            <th className="p-2.5">Raw Material</th>
                            <th className="p-2.5 text-center">Percentage</th>
                            <th className="p-2.5 text-center">Batch Weight ({batchSize} kg)</th>
                            <th className="p-2.5">R&D Role</th>
                            <th className="p-2.5 text-center">HLB Value</th>
                            <th className="p-2.5 text-center">CMC (ppm)</th>
                            <th className="p-2.5 text-right">Cost (INR/kg)</th>
                            <th className="p-2.5 text-right">Item Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                          {(formulationResult?.ingredients || []).map((ing: any, idx: number) => {
                            const ingWeight = (ing.percentage / 100) * batchSize;
                            const ingCost = ingWeight * (ing.costPerKg || 0);
                            const cmcInfo = getIngredientCmc(ing.name);
                            return (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="p-2.5 font-semibold text-[#0f766e]">{ing.name}</td>
                                <td className="p-2.5 text-center font-bold font-mono">{ing.percentage}%</td>
                                <td className="p-2.5 text-center font-bold text-blue-600 bg-blue-50/20 font-mono">
                                  {ingWeight >= 1 ? `${ingWeight.toFixed(3)} kg` : `${(ingWeight * 1000).toFixed(0)} g`}
                                </td>
                                <td className="p-2.5 text-gray-500 italic">{ing.role}</td>
                                <td className="p-2.5 text-center font-bold font-mono">
                                  {ing.hlbValue !== undefined && ing.hlbValue !== null ? (
                                    <span className="bg-[#f0fdfa] text-[#0f766e] px-2 py-0.5 rounded border border-teal-200 font-semibold font-mono text-[10px]">
                                      {ing.hlbValue.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-bold font-mono text-purple-700">
                                  {cmcInfo ? (
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold text-[10px]">
                                      {cmcInfo.cmcPpm} ppm
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right font-mono">{ing.costPerKg ? `₹${ing.costPerKg}` : "—"}</td>
                                <td className="p-2.5 text-right font-mono">
                                  ₹{ingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 8: REPORTS & DIAGNOSTICS */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-sm transition-all space-y-4 text-left">
                    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs border border-teal-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        📑 SECTION 8: REPORTS & DIAGNOSTICS
                      </span>
                      <span className="text-[10px] font-mono text-teal-200 bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-600/40 font-semibold">
                        SOP, Order of Addition & R&D Troubleshooting Desk
                      </span>
                    </div>

                    {/* Manufacturing order of addition */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Order of Addition & Mixing Steps
                    </h4>
                    <div className="space-y-3 text-xs">
                      {(formulationResult?.manufacturingMethod || []).map((step: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {step.order}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-gray-800 font-medium">{step.action}</p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-semibold font-mono">
                              <span>⏱️ Time: {step.mixingTime}</span>
                              <span>🌀 Speed: {step.mixingSpeed}</span>
                              <span>🌡️ Temp: {step.temperature}</span>
                              {step.safetyNote && <span className="text-red-500">⚠️ {step.safetyNote}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Cautions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                    <h4 className="font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Critical Mixing Pitfalls & Safety Alerts
                    </h4>
                    <ul className="list-disc pl-4 text-amber-900 space-y-1 leading-relaxed">
                      {(formulationResult?.commonMistakes || []).map((mis: string, idx: number) => (
                        <li key={idx}>{mis}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Packaging Guide */}
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs">
                    <h4 className="font-bold text-[#0f766e] mb-1">Recommended Packaging Carrier:</h4>
                    <p className="text-gray-700 leading-relaxed">{formulationResult?.packagingCompatibility || "HDPE / PET Container"}</p>
                  </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-12 text-center text-gray-500">
                  <Cpu size={48} className="mx-auto text-gray-300 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-gray-700">Detergent Formulation Engine Ready</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    Define your target cost, surfactant properties, and local ingredients on the left panel, and click "Calculate & Formulate" to summon the AI expert chemist!
                  </p>
                </div>
              )}
              
              {/* Standalone Collapsible Glossary of HLB */}
              <div className="mt-6">
                <HLBGlossary collapsible={true} />
              </div>
            </div>
          </>
        )}

        {activeMainTab === "troubleshoot" && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm space-y-4 max-w-3xl mx-auto">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-[#f59e0b]" size={18} />
                AI R&D Troubleshooting Desk
              </h3>
              <p className="text-xs text-gray-500">
                Facing a quality failure or batch instability? Type your issue below (e.g. "viscosity drops suddenly", "fragrance disappears in acid", "detergent separators into layers"), and our AI troubleshooter will diagnose the physical chemistry cause.
              </p>

              {/* Pre-written quick issues */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Why did surfactant viscosity drop after adding salt?",
                  "Why is blue color fading in toilet cleaner?",
                  "Why is active matter separating into layers?",
                  "Why did enzymes lose activity in laundry powder?"
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreTroubleshoot(q)}
                    className="text-[10px] bg-gray-100 hover:bg-[#e5e7eb] text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask why viscosity dropped, foam reduced, color changed..."
                  value={troubleQuery}
                  onChange={(e) => setTroubleQuery(e.target.value)}
                  className="flex-1 text-xs bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
                <button
                  onClick={handleTroubleshoot}
                  disabled={isTroubleshooting || !troubleQuery}
                  className="bg-[#0f766e] hover:bg-[#0d645c] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isTroubleshooting ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    "Diagnose Issue"
                  )}
                </button>
              </div>

              {troubleResult && (
                <div className="border border-[#e5e7eb] rounded-xl p-4 bg-teal-50/10 space-y-3 mt-4 animate-fade-in">
                  <div className="border-b pb-2">
                    <span className="text-[10px] font-bold text-red-600 block uppercase">Reported Phenomenon</span>
                    <h4 className="text-xs font-bold text-gray-900 mt-0.5">"{troubleResult.issue || troubleQuery}"</h4>
                  </div>

                  {Array.isArray(troubleResult.causes) && troubleResult.causes.length > 0 ? (
                    <div className="space-y-3">
                      {troubleResult.causes.map((c: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-gray-900">Cause #{idx + 1}: {c.cause}</span>
                            {c.confidence && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                                {c.confidence} Confidence
                              </span>
                            )}
                          </div>
                          {c.chemistryPrinciple && (
                            <p className="text-[11px] text-gray-600 italic">
                              <strong>Chemistry Principle:</strong> {c.chemistryPrinciple}
                            </p>
                          )}
                          {c.relationToUserData && (
                            <p className="text-[11px] text-[#0f766e]">
                              <strong>Batch Context:</strong> {c.relationToUserData}
                            </p>
                          )}
                          {Array.isArray(c.correctiveActions) && c.correctiveActions.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Corrective Actions:</span>
                              <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1 mt-0.5">
                                {c.correctiveActions.map((act: string, aIdx: number) => (
                                  <li key={aIdx}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : troubleResult.scientificReason ? (
                    <div>
                      <span className="text-[10px] font-bold text-[#0f766e] block uppercase">Scientific Root Cause</span>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-100">
                        {troubleResult.scientificReason}
                      </p>
                    </div>
                  ) : null}

                  {Array.isArray(troubleResult.solutions) && troubleResult.solutions.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 block uppercase">Step-by-Step R&D Solutions</span>
                      <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1.5 mt-1.5">
                        {troubleResult.solutions.map((sol: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">{sol}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {((Array.isArray(troubleResult.preventativeMeasures) && troubleResult.preventativeMeasures.length > 0) || troubleResult.prevention) && (
                    <div className="border-t pt-2 mt-2 border-dashed">
                      <span className="text-[10px] font-bold text-amber-800 block uppercase">Prevention Checklist</span>
                      <div className="text-xs text-amber-950 italic mt-0.5 font-semibold bg-amber-50 p-2.5 rounded border border-amber-100">
                        {Array.isArray(troubleResult.preventativeMeasures) ? (
                          <ul className="list-disc pl-4 space-y-1 not-italic">
                            {troubleResult.preventativeMeasures.map((pm: string, pIdx: number) => (
                              <li key={pIdx}>🛡️ {pm}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>🛡️ {troubleResult.prevention}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === "chat" && (
          <div className="flex-1 flex flex-col h-full bg-white max-w-4xl mx-auto border-x border-[#e5e7eb]" id="chat-container">
            {/* Chat message logs */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl border ${
                      chat.role === "user"
                        ? "bg-[#0f766e] text-white border-[#0f766e] rounded-tr-none"
                        : "bg-[#f3f4f6] text-gray-800 border-[#e5e7eb] rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{chat.content}</p>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-[#f3f4f6] text-gray-500 border border-[#e5e7eb] p-3 rounded-xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    <span className="text-[10px] font-medium ml-1">AI Expert thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat footer input */}
            <div className="p-3 border-t border-[#e5e7eb] bg-gray-50 flex gap-2">
              <input
                type="text"
                placeholder="Ask your R&D chemical query..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                className="flex-1 text-xs bg-white border border-[#e5e7eb] rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
              <button
                onClick={handleSendChat}
                disabled={isChatting || !chatInput.trim()}
                className="bg-[#0f766e] text-white hover:bg-[#0d645c] p-2 rounded-full transition-all disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        <SaveFormulaModal
          isOpen={showSaveModal}
          lang={lang}
          saveFormulaName={saveFormulaName}
          setSaveFormulaName={setSaveFormulaName}
          saveFormulaGrade={saveFormulaGrade}
          setSaveFormulaGrade={setSaveFormulaGrade}
          onClose={() => setShowSaveModal(false)}
          onConfirm={handleConfirmSaveFormula}
        />

        <InciLabelModal
          isOpen={showInciModal}
          formulationResult={formulationResult}
          onClose={() => setShowInciModal(false)}
        />
      </div>
    </div>
  );
}

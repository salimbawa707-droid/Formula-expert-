import { useState, useEffect, useMemo } from "react";
import {
  FlaskConical,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Scale,
  Sparkles,
  RefreshCw,
  Bookmark,
  FileText,
  Activity,
  Check,
  ChevronDown,
  Sliders,
  Atom,
  Droplets,
  Layers,
  Zap,
  Info,
  DollarSign,
  ShieldAlert,
  Award,
  Lightbulb,
  CheckCheck
} from "lucide-react";
import {
  calculateRawSurfactants,
  calculateActiveSurfactants,
  evaluateAuthoritativeHLB,
  calculateWaterHardnessTolerance,
  calculateFormulationCompatibility,
  calculateCleaningPerformance,
  calculateLabHealthScore,
  calculateCommercialMarginChain,
  getAuditedIngredientCategory,
  getDefaultActiveMatter,
  getPreservativeWarning,
  getTargetPHRange,
  evaluateAIGrade,
  calculateMixedCMC,
  getPHConfidenceAndAssumptions,
  getIngredientCmcData,
  ViscosityEngine,
  calculateDensity,
  calculateTotalSolids
} from "../utils/calculators";
import { calculateFormulaCost, FormulaCostReport } from "../utils/costingEngine";
import { evaluateExpertReasoning, ExpertReasoningReport } from "../utils/expertReasoningEngine";
import { calculatePHAdvanced } from "../utils/pHEngine";
import { mapFormulationIngredientsToPHEngineInput } from "../utils/pHEngineAdapter";
import CategoryIngredientSelector from "./CategoryIngredientSelector";
import SaveFormulaModal from "./SaveFormulaModal";
import InciLabelModal from "./InciLabelModal";
import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from "../data/universalIngredientLibrary";
import { ActiveFormulaState, FormulationIngredient } from "../types";

// Critical Micelle Concentration estimation helper (backwards-compatible alias)
export const getIngredientCmc = (name: string): { cmcMolar: number; cmcPpm: number } | null => {
  const data = getIngredientCmcData(name);
  return data ? { cmcMolar: data.cmcMolar, cmcPpm: data.cmcPpm } : null;
};

export const calculateMixedCmc = (ingredients: any[]) => {
  return calculateMixedCMC(ingredients);
};

export const PRODUCT_CATEGORIES = [
  "Laundry Liquid",
  "Laundry Powder",
  "Dishwash Liquid",
  "Floor Cleaner",
  "Toilet Cleaner",
  "Glass Cleaner",
  "Fabric Softener",
  "Car Shampoo",
  "Liquid Handwash",
  "Anti-foaming Agent",
  "Heavy-Duty Degreaser",
  "Multi-Purpose Cleaner"
];

// Helper to determine scientific metric applicability based on product category
export const isMetricApplicable = (category: string, metric: "hlb" | "cmc" | "viscosity" | "cleaningScore" | "foam" | "builder"): boolean => {
  const c = (category || "").toLowerCase();
  
  if (metric === "hlb") {
    // HLB applies to emulsions and multi-surfactant emulsification systems
    return !c.includes("powder") && !c.includes("toilet") && !c.includes("softener") && !c.includes("glass");
  }
  if (metric === "cmc") {
    // CMC applies when surfactant micellization is primary cleaning mechanism
    return !c.includes("toilet") && !c.includes("glass") && !c.includes("softener");
  }
  if (metric === "viscosity") {
    // Viscosity is not applicable to dry powders
    return !c.includes("powder");
  }
  if (metric === "cleaningScore") {
    // Fabric softeners condition fibers; defoamers suppress foam; not standard detergency
    return !c.includes("softener") && !c.includes("anti-foam");
  }
  if (metric === "foam") {
    return true;
  }
  if (metric === "builder") {
    return true;
  }
  return true;
};

const DEFAULT_FORMULAS: Record<string, Array<{ name: string; percentage: number; activeMatterPct: number; role?: string; costPerKg?: number }>> = {
  "Laundry Liquid": [
    { name: "Water (Aqua, Demineralized)", percentage: 70.0, activeMatterPct: 0, role: "Solvent", costPerKg: 0 },
    { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 8.0, activeMatterPct: 90, role: "Anionic Surfactant", costPerKg: 0 },
    { name: "Sodium Hydroxide (Caustic Soda Lye 100%)", percentage: 1.05, activeMatterPct: 100, role: "pH Adjuster", costPerKg: 0 },
    { name: "Sodium Laureth Sulfate (SLES 70%)", percentage: 10.0, activeMatterPct: 70, role: "Anionic Surfactant", costPerKg: 0 },
    { name: "Cocamidopropyl Betaine (CAPB 30%)", percentage: 3.0, activeMatterPct: 30, role: "Amphoteric Surfactant", costPerKg: 0 },
    { name: "Sodium Chloride (Salt)", percentage: 1.5, activeMatterPct: 100, role: "Thickener", costPerKg: 0 },
    { name: "Sodium Citrate (Dihydrate)", percentage: 1.0, activeMatterPct: 100, role: "Chelator", costPerKg: 0 },
    { name: "Optical Brightener (CBS-X)", percentage: 0.15, activeMatterPct: 100, role: "Additive", costPerKg: 0 },
    { name: "Phenoxyethanol (Safe Preservative)", percentage: 0.2, activeMatterPct: 100, role: "Preservative", costPerKg: 0 },
    { name: "Fragrance (Floral / Ocean Fresh)", percentage: 0.3, activeMatterPct: 100, role: "Fragrance", costPerKg: 0 },
    { name: "Blue / Violet Color Dye", percentage: 0.005, activeMatterPct: 100, role: "Colorant", costPerKg: 0 },
    { name: "Water (Aqua, Balance to 100%)", percentage: 4.795, activeMatterPct: 0, role: "Solvent", costPerKg: 0 }
  ],
  "Dishwash Liquid": [
    { name: "Water (Aqua, Demineralized)", percentage: 65.0, activeMatterPct: 0, role: "Solvent", costPerKg: 0 },
    { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 12.0, activeMatterPct: 90, role: "Anionic Surfactant", costPerKg: 0 },
    { name: "Sodium Hydroxide (Caustic Soda Lye 100%)", percentage: 1.55, activeMatterPct: 100, role: "pH Adjuster", costPerKg: 0 },
    { name: "Sodium Laureth Sulfate (SLES 70%)", percentage: 8.0, activeMatterPct: 70, role: "Anionic Surfactant", costPerKg: 0 },
    { name: "Cocamidopropyl Betaine (CAPB 30%)", percentage: 4.0, activeMatterPct: 30, role: "Amphoteric Surfactant", costPerKg: 0 },
    { name: "Sodium Chloride (Salt)", percentage: 2.0, activeMatterPct: 100, role: "Thickener", costPerKg: 0 },
    { name: "Magnesium Sulfate (Epsom Salt)", percentage: 1.0, activeMatterPct: 100, role: "Electrolyte", costPerKg: 0 },
    { name: "Sodium Benzoate (Safe Eco Preservative)", percentage: 0.2, activeMatterPct: 100, role: "Preservative", costPerKg: 0 },
    { name: "Lemon Fragrance / Essential Oil", percentage: 0.25, activeMatterPct: 100, role: "Fragrance", costPerKg: 0 },
    { name: "Yellow Food Grade Dye", percentage: 0.005, activeMatterPct: 100, role: "Colorant", costPerKg: 0 },
    { name: "Water (Aqua, Balance to 100%)", percentage: 5.995, activeMatterPct: 0, role: "Solvent", costPerKg: 0 }
  ],
  "Floor Cleaner": [
    { name: "Water (Aqua, Demineralized)", percentage: 90.0, activeMatterPct: 0, role: "Solvent", costPerKg: 0 },
    { name: "Linear Alcohol Ethoxylate (LAE-9)", percentage: 3.5, activeMatterPct: 100, role: "Nonionic Surfactant", costPerKg: 0 },
    { name: "Benzalkonium Chloride (BKC 50%)", percentage: 2.0, activeMatterPct: 50, role: "Cationic Disinfectant", costPerKg: 0 },
    { name: "Isopropyl Alcohol (IPA)", percentage: 1.5, activeMatterPct: 100, role: "Solvent", costPerKg: 0 },
    { name: "Pine / Citrus Fragrance", percentage: 0.5, activeMatterPct: 100, role: "Fragrance", costPerKg: 0 },
    { name: "Green Color Dye", percentage: 0.005, activeMatterPct: 100, role: "Colorant", costPerKg: 0 },
    { name: "Water (Aqua, Balance to 100%)", percentage: 2.495, activeMatterPct: 0, role: "Solvent", costPerKg: 0 }
  ]
};

interface Props {
  lang?: "en" | "hi" | "mr" | "es" | "fr" | "ar" | "zh";
  translations?: any;
  onFormulaGenerated?: (formula: ActiveFormulaState) => void;
  activeFormula?: ActiveFormulaState | null;
}

export default function FormulaExpert({
  lang: _lang = "en",
  translations: _translations,
  onFormulaGenerated,
  activeFormula
}: Props) {
  // 1. Primary Formulation Configuration
  const [productCategory, setProductCategory] = useState<string>(() => {
    return activeFormula?.category || activeFormula?.productType || localStorage.getItem("formula_expert_category") || "Laundry Liquid";
  });

  const [batchSizeKg, setBatchSizeKg] = useState<number>(() => {
    const saved = localStorage.getItem("formula_expert_batchSize");
    if (activeFormula?.batchSizeKg && activeFormula.batchSizeKg > 0) return activeFormula.batchSizeKg;
    if (activeFormula?.batchSize && activeFormula.batchSize > 0) return activeFormula.batchSize;
    return saved ? Number(saved) : 100;
  });

  const [formulaName, setFormulaName] = useState<string>(() => {
    return activeFormula?.name || "New Formula";
  });

  const [waterHardnessPpm, setWaterHardnessPpm] = useState<number>(() => {
    const saved = localStorage.getItem("formula_expert_waterHardness");
    return saved ? Number(saved) : 150;
  });

  // 2. Ingredients List State (All raw-material pricing strictly user-controlled)
  const [ingredients, setIngredients] = useState<FormulationIngredient[]>(() => {
    if (activeFormula?.ingredients && activeFormula.ingredients.length > 0) {
      return activeFormula.ingredients.map((ing, idx) => ({
        ...ing,
        id: ing.id || `ing-${Date.now()}-${idx}`,
        percentage: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? getDefaultActiveMatter(ing.name || "")),
        costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null ? Number(ing.costPerKg) : 0,
        role: ing.role || ing.function || getAuditedIngredientCategory(ing.name || "")
      }));
    }
    const cat = localStorage.getItem("formula_expert_category") || "Laundry Liquid";
    const defaults = DEFAULT_FORMULAS[cat] || DEFAULT_FORMULAS["Laundry Liquid"];
    return defaults.map((item, idx) => ({
      id: `ing-${Date.now()}-${idx}`,
      name: item.name,
      percentage: item.percentage,
      activeMatterPct: item.activeMatterPct,
      role: item.role || getAuditedIngredientCategory(item.name),
      costPerKg: 0
    }));
  });

  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(true);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showInciModal, setShowInciModal] = useState<boolean>(false);

  // Sync when activeFormula prop updates from Formula Library or external load
  useEffect(() => {
    if (activeFormula?.ingredients && activeFormula.ingredients.length > 0) {
      if (activeFormula.category || activeFormula.productType) {
        setProductCategory(activeFormula.category || activeFormula.productType || "Laundry Liquid");
      }
      if (activeFormula.batchSizeKg || activeFormula.batchSize) {
        setBatchSizeKg(activeFormula.batchSizeKg || activeFormula.batchSize || 100);
      }
      if (activeFormula.name) {
        setFormulaName(activeFormula.name);
      }
      setIngredients(
        activeFormula.ingredients.map((ing, idx) => ({
          ...ing,
          id: ing.id || `ing-${Date.now()}-${idx}`,
          percentage: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
          activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? getDefaultActiveMatter(ing.name || "")),
          costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null ? Number(ing.costPerKg) : 0,
          role: ing.role || ing.function || getAuditedIngredientCategory(ing.name || "")
        }))
      );
      setHasAnalyzed(true);
    }
  }, [activeFormula]);

  // Persist simple state to localStorage
  useEffect(() => {
    localStorage.setItem("formula_expert_category", productCategory);
    localStorage.setItem("formula_expert_batchSize", String(batchSizeKg));
    localStorage.setItem("formula_expert_waterHardness", String(waterHardnessPpm));
  }, [productCategory, batchSizeKg, waterHardnessPpm]);

  // Handle Category Change (Loads default template with costPerKg = 0)
  const handleCategoryChange = (newCat: string) => {
    setProductCategory(newCat);
    if (DEFAULT_FORMULAS[newCat]) {
      const defaults = DEFAULT_FORMULAS[newCat];
      setIngredients(
        defaults.map((item, idx) => ({
          id: `ing-${Date.now()}-${idx}`,
          name: item.name,
          percentage: item.percentage,
          activeMatterPct: item.activeMatterPct,
          role: item.role || getAuditedIngredientCategory(item.name),
          costPerKg: 0
        }))
      );
    }
  };

  // Add New Ingredient Row (Initializes with costPerKg: 0)
  const handleAddIngredient = () => {
    const newIng: FormulationIngredient = {
      id: `ing-${Date.now()}-${ingredients.length}`,
      name: "",
      percentage: 0,
      activeMatterPct: 100,
      role: "Additive",
      costPerKg: 0
    };
    setIngredients((prev) => [...prev, newIng]);
  };

  // Remove Ingredient Row
  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  // Select Commercial Ingredient from Master Universal Library (Preserves user's entered costPerKg)
  const handleSelectUniversalIngredient = (id: string, selected: UniversalIngredient) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        return {
          ...ing,
          name: selected.name,
          category: selected.category,
          role: selected.category || selected.function || getAuditedIngredientCategory(selected.name),
          function: selected.function,
          activeMatterPct: selected.activeDefault ?? selected.activeMatter ?? 100,
          costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null ? Number(ing.costPerKg) : 0,
          hlb: selected.hlb !== null && selected.hlb !== undefined ? selected.hlb : undefined,
          hlbValue: selected.hlb !== null && selected.hlb !== undefined ? selected.hlb : undefined,
          casNumber: selected.casNumber,
          inciName: selected.inciName,
          phMin: selected.phMin,
          phMax: selected.phMax
        };
      })
    );
  };

  // Update Ingredient Property (Preserves formulator price control strictly)
  const handleUpdateIngredient = (id: string, field: keyof FormulationIngredient, val: any) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        const updated = { ...ing, [field]: field === "costPerKg" ? Math.max(0, Number(val) || 0) : val };
        if (field === "name") {
          const matched = UNIVERSAL_INGREDIENTS.find(
            (u) => u.name.toLowerCase() === String(val).toLowerCase() || u.id.toLowerCase() === String(val).toLowerCase()
          );
          if (matched) {
            updated.name = matched.name;
            updated.activeMatterPct = matched.activeDefault ?? 100;
            updated.category = matched.category;
            updated.role = matched.category || matched.function || getAuditedIngredientCategory(matched.name);
            updated.function = matched.function;
            // Retain user's entered price without overwriting from library
            updated.costPerKg = ing.costPerKg !== undefined && ing.costPerKg !== null ? Number(ing.costPerKg) : 0;
            if (matched.hlb !== null && matched.hlb !== undefined) {
              updated.hlb = matched.hlb;
              updated.hlbValue = matched.hlb;
            }
            updated.casNumber = matched.casNumber;
            updated.inciName = matched.inciName;
            updated.phMin = matched.phMin;
            updated.phMax = matched.phMax;
          } else {
            const autoActive = getDefaultActiveMatter(val);
            const autoCat = getAuditedIngredientCategory(val);
            updated.activeMatterPct = autoActive;
            updated.role = autoCat;
            // Retain user price
            updated.costPerKg = ing.costPerKg !== undefined && ing.costPerKg !== null ? Number(ing.costPerKg) : 0;
          }
        }
        return updated;
      })
    );
  };

  // Auto-Balance Water to exactly 100%
  const handleAutoBalanceWater = () => {
    const list = [...ingredients];
    const waterIdx = list.findIndex(
      (ing) =>
        (ing.name || "").toLowerCase().includes("water") ||
        (ing.name || "").toLowerCase().includes("aqua") ||
        (ing.role && ing.role.toLowerCase().includes("solvent"))
    );

    let nonWaterSum = 0;
    list.forEach((ing, idx) => {
      if (idx !== waterIdx) {
        nonWaterSum += Number(ing.percentage) || 0;
      }
    });

    const balancedWaterPct = Math.max(0, Number((100 - nonWaterSum).toFixed(3)));

    if (waterIdx !== -1) {
      list[waterIdx].percentage = balancedWaterPct;
    } else {
      list.push({
        id: `ing-water-${Date.now()}`,
        name: "Water (Aqua, Demineralized)",
        percentage: balancedWaterPct,
        activeMatterPct: 0,
        role: "Solvent",
        costPerKg: 0
      });
    }

    setIngredients(list);
  };

  // Authoritative Cost Calculation Report (User-Controlled Pricing)
  const formulaCost: FormulaCostReport = useMemo(() => {
    return calculateFormulaCost(ingredients, batchSizeKg);
  }, [ingredients, batchSizeKg]);

  // Commercial Margin Projections (Driven strictly by user raw-material cost)
  const marginChain = useMemo(() => {
    return calculateCommercialMarginChain(ingredients, batchSizeKg, 12, 15);
  }, [ingredients, batchSizeKg]);

  // Live Totals Calculations (Decoupled, strictly reflecting user inputs)
  const totals = useMemo(() => {
    const totalRaw = ingredients.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0);
    const rawSurfactants = calculateRawSurfactants(ingredients);
    const activeSurfactants = calculateActiveSurfactants(ingredients);

    // Water % calculation
    const waterIng = ingredients.find(
      (i) => (i.name || "").toLowerCase().includes("water") || (i.name || "").toLowerCase().includes("aqua")
    );
    const waterPct = waterIng ? Number(waterIng.percentage) || 0 : Math.max(0, 100 - totalRaw);

    return {
      totalRaw: Number(totalRaw.toFixed(2)),
      rawSurfactants: Number(rawSurfactants.toFixed(2)),
      activeSurfactants: Number(activeSurfactants.toFixed(2)),
      waterPct: Number(waterPct.toFixed(2)),
      costPerKg: formulaCost.costPerKg,
      totalBatchCost: formulaCost.totalBatchCost,
      isBalanced: Math.abs(totalRaw - 100) < 0.05
    };
  }, [ingredients, formulaCost]);

  // Scientific Results (Computed via existing scientific engines)
  const scientificResults = useMemo(() => {
    const mapped = mapFormulationIngredientsToPHEngineInput(ingredients);
    const advPH = calculatePHAdvanced(mapped, batchSizeKg);
    const phConfidence = getPHConfidenceAndAssumptions(ingredients, advPH.pH);
    const hlbRes = evaluateAuthoritativeHLB(ingredients);
    const hlbVal = hlbRes.blendedHLB;
    const cmcVal = calculateMixedCMC(ingredients);
    const hardnessRes = calculateWaterHardnessTolerance(ingredients, waterHardnessPpm);
    const cleaningRes = calculateCleaningPerformance(ingredients);
    const compRes = calculateFormulationCompatibility(ingredients, advPH.pH);
    const healthRes = calculateLabHealthScore(ingredients, advPH.pH);
    const presWarning = getPreservativeWarning(ingredients, advPH.pH);
    const targetRange = getTargetPHRange(productCategory);
    const aiGrade = evaluateAIGrade(ingredients, advPH.pH, totals.costPerKg);
    const densityRes = calculateDensity(ingredients, batchSizeKg * 1000);
    const totalSolidsPct = calculateTotalSolids(ingredients);

    // Surfactant classification breakdown
    let anionicPct = 0;
    let nonionicPct = 0;
    let amphotericPct = 0;
    let cationicPct = 0;

    // Builder / Chelator detection
    let chelatorActivePct = 0;
    let chelatorNames: string[] = [];

    ingredients.forEach((ing) => {
      const name = (ing.name || "").toLowerCase();
      const role = (ing.role || getAuditedIngredientCategory(ing.name || "")).toLowerCase();
      const pct = Number(ing.percentage) || 0;
      const active = Number(ing.activeMatterPct ?? 100) / 100;
      const activePct = pct * active;

      if (role.includes("anionic") || name.includes("labsa") || name.includes("sles") || name.includes("sls") || name.includes("aos")) {
        anionicPct += activePct;
      } else if (role.includes("nonionic") || name.includes("ethoxylate") || name.includes("lae") || name.includes("apg") || name.includes("glucoside")) {
        nonionicPct += activePct;
      } else if (role.includes("amphoteric") || name.includes("betaine") || name.includes("capb") || name.includes("amine oxide")) {
        amphotericPct += activePct;
      } else if (role.includes("cationic") || name.includes("quat") || name.includes("bkc") || name.includes("esterquat")) {
        cationicPct += activePct;
      }

      if (role.includes("chelator") || role.includes("builder") || name.includes("citrate") || name.includes("edta") || name.includes("glda") || name.includes("stpp") || name.includes("phosphonate")) {
        chelatorActivePct += activePct;
        chelatorNames.push(ing.name);
      }
    });

    // Viscosity estimation via Authoritative ViscosityEngine
    const viscosityReport = ViscosityEngine.evaluateViscosity(ingredients, {
      productCategory,
      targetPH: advPH.pH,
      temperatureC: 25
    });
    const estimatedViscosity = viscosityReport.isFluid
      ? `${viscosityReport.viscosityCp} cPs (${viscosityReport.rating})`
      : "N/A (Solid / Powder)";

    // Foaming profile
    let foamProfile = "Moderate / Balanced Foam";
    if (anionicPct > 8 || (amphotericPct > 2 && anionicPct > 5)) {
      foamProfile = "High Dense Flash Foam (Score: 92/100)";
    } else if (anionicPct > 4) {
      foamProfile = "Good Standard Cleaning Foam (Score: 78/100)";
    } else if (nonionicPct > 3 && anionicPct === 0) {
      foamProfile = "Low-Foam / Controlled Rinse (Score: 45/100)";
    } else if (productCategory === "Anti-foaming Agent") {
      foamProfile = "Anti-Foam Defoamer (Score: 10/100)";
    }

    // Core evaluation status flags
    const isCompOk = compRes.compatible;
    const isHealthOk = healthRes.finalScore >= 65;
    const isActiveOk = totals.activeSurfactants >= (productCategory.includes("Glass") ? 1.5 : productCategory.includes("Floor") ? 4 : 8);

    // Category suitability
    let categorySuitability = "High (Optimal Formulation Profile)";
    let isCategorySuitable = true;
    if (productCategory.includes("Softener") && cationicPct === 0) {
      categorySuitability = "Poor: Lacks cationic conditioning active (e.g. Esterquat).";
      isCategorySuitable = false;
    } else if (productCategory.includes("Glass") && totals.activeSurfactants > 5) {
      categorySuitability = "Sub-optimal: High actives may cause streaking/residue on glass.";
    } else if (!isActiveOk) {
      categorySuitability = `Moderate: Active surfactant loading (${totals.activeSurfactants}%) is below standard benchmark for ${productCategory}.`;
    } else if (hardnessRes.maxSupportedPpm === 0 && !productCategory.includes("Glass") && isMetricApplicable(productCategory, "cleaningScore")) {
      categorySuitability = "Needs Builder: Formula lacks chelating builder system for hard water protection.";
    }

    // Verdict derivation based STRICTLY on applicable results
    let verdictStatus: "GOOD / WITHIN TARGET" | "NEEDS ADJUSTMENT" | "OUT OF SPEC" = "GOOD / WITHIN TARGET";
    const verdictReasons: Array<{ label: string; ok: boolean; message: string }> = [];
    const attentionItems: string[] = [];

    // 1. pH check
    if (advPH.pH < targetRange.min) {
      verdictReasons.push({ label: "pH Level", ok: false, message: `pH ${advPH.pH.toFixed(2)} is below target range (${targetRange.min} - ${targetRange.max}). Add neutralizing alkali (e.g. NaOH/TEA).` });
      attentionItems.push(`pH is ${advPH.pH.toFixed(2)} (target: ${targetRange.min} - ${targetRange.max}). Adjust with neutralizing alkali.`);
      verdictStatus = "NEEDS ADJUSTMENT";
    } else if (advPH.pH > targetRange.max) {
      verdictReasons.push({ label: "pH Level", ok: false, message: `pH ${advPH.pH.toFixed(2)} is above target range (${targetRange.min} - ${targetRange.max}). Add acid buffer (e.g. Citric Acid).` });
      attentionItems.push(`pH is ${advPH.pH.toFixed(2)} (target: ${targetRange.min} - ${targetRange.max}). Adjust with citric acid buffer.`);
      verdictStatus = "NEEDS ADJUSTMENT";
    } else {
      verdictReasons.push({ label: "pH Level", ok: true, message: `pH ${advPH.pH.toFixed(2)} is within target standard (${targetRange.min} - ${targetRange.max}).` });
    }

    // 2. Water hardness check
    if (hardnessRes.sufficiency === "sufficient" && hardnessRes.maxSupportedPpm > 0) {
      verdictReasons.push({ label: "Hard-Water Tolerance", ok: true, message: `High hardness tolerance (${hardnessRes.maxSupportedPpm} ppm CaCO₃) with adequate sequestration.` });
    } else if (hardnessRes.sufficiency === "borderline" && hardnessRes.maxSupportedPpm > 0) {
      verdictReasons.push({ label: "Hard-Water Tolerance", ok: true, message: `Moderate tolerance (${hardnessRes.maxSupportedPpm} ppm CaCO₃). Meets baseline demand.` });
    } else {
      verdictReasons.push({ label: "Hard-Water Tolerance", ok: false, message: `Low/Unchelated capacity (${hardnessRes.maxSupportedPpm} ppm CaCO₃ vs ${waterHardnessPpm} ppm demand). Add builder/chelator (e.g. GLDA or Sodium Citrate).` });
      attentionItems.push(`Hard water protection capacity is ${hardnessRes.maxSupportedPpm} ppm (demand: ${waterHardnessPpm} ppm). Add builder/chelator.`);
      if (verdictStatus === "GOOD / WITHIN TARGET") verdictStatus = "NEEDS ADJUSTMENT";
    }

    // 3. Active Surfactants & Cleaning (Category Aware)
    if (isMetricApplicable(productCategory, "cleaningScore")) {
      if (!isActiveOk) {
        verdictReasons.push({ label: "Active Surfactants", ok: false, message: `Total active surfactants (${totals.activeSurfactants}%) is low for ${productCategory}.` });
        attentionItems.push(`Total active surfactants (${totals.activeSurfactants}%) is below category recommendation.`);
        verdictStatus = "NEEDS ADJUSTMENT";
      } else {
        verdictReasons.push({ label: "Cleaning Performance", ok: true, message: `Cleaning score ${cleaningRes.cleaningScore}/100 with ${totals.activeSurfactants}% active surfactants.` });
      }
    } else {
      verdictReasons.push({ label: "Active Surfactants", ok: true, message: `Total active surfactants is ${totals.activeSurfactants}%. Appropriate for specialty formulation.` });
    }

    // 4. HLB Alignment (Detergency Window 12-15)
    if (hlbRes.blendedHLB > 0 && hlbRes.blendedHLB < 12 && isMetricApplicable(productCategory, "cleaningScore")) {
      verdictReasons.push({ label: "Mixed HLB", ok: false, message: `Mixed HLB (${hlbRes.blendedHLB.toFixed(1)}) is below detergent optimum (12–15). Increase hydrophilicity or nonionic ratio.` });
      attentionItems.push(`Mixed HLB (${hlbRes.blendedHLB.toFixed(1)}) is below optimal detergency window (12–15).`);
      if (verdictStatus === "GOOD / WITHIN TARGET") verdictStatus = "NEEDS ADJUSTMENT";
    } else if (hlbRes.blendedHLB >= 12 && hlbRes.blendedHLB <= 15) {
      verdictReasons.push({ label: "Mixed HLB", ok: true, message: `Mixed HLB (${hlbRes.blendedHLB.toFixed(1)}) is within optimal detergency range (12–15).` });
    }

    // 5. Viscosity (Category Aware)
    if (isMetricApplicable(productCategory, "viscosity")) {
      if (estimatedViscosity.includes("Over-salted")) {
        verdictReasons.push({ label: "Viscosity", ok: false, message: "Electrolyte content exceeds salting-out limit. Phase separation risk." });
        attentionItems.push("Electrolyte (salt) content exceeds micellar peak; reduce salt to prevent salting-out.");
        if (verdictStatus === "GOOD / WITHIN TARGET") verdictStatus = "NEEDS ADJUSTMENT";
      } else {
        verdictReasons.push({ label: "Viscosity", ok: true, message: `Viscosity modeled at ${estimatedViscosity}.` });
      }
    }

    // 5. Chemical Compatibility
    if (!isCompOk) {
      verdictReasons.push({ label: "Formula Compatibility", ok: false, message: compRes.warnings[0] || "Chemical incompatibility detected between active components." });
      attentionItems.push(compRes.warnings[0] || "Surfactant charge conflict or chemical incompatibility detected.");
      verdictStatus = "OUT OF SPEC";
    } else {
      verdictReasons.push({ label: "Formula Compatibility", ok: true, message: "No adverse surfactant charge conflict or phase destabilization detected." });
    }

    // 6. Stability & Preservation
    if (presWarning) {
      verdictReasons.push({ label: "Stability & Preservation", ok: false, message: "No preservative identified. High water formulation susceptible to microbial growth." });
      attentionItems.push("Preservative missing in water-based formulation. Add 0.1-0.2% broad-spectrum preservative.");
      if (verdictStatus === "GOOD / WITHIN TARGET") verdictStatus = "NEEDS ADJUSTMENT";
    } else {
      verdictReasons.push({ label: "Stability & Preservation", ok: true, message: "Preservative system verified with stable micellar dispersion." });
    }

    // 7. Safety / Lab Health
    if (!isHealthOk) {
      verdictReasons.push({ label: "Lab Safety", ok: false, message: healthRes.alerts[0]?.message || "Safety hazard flagged due to extreme chemistry." });
      attentionItems.push(healthRes.alerts[0]?.message || "Safety precautions required due to concentration or extreme pH.");
      if (verdictStatus !== "OUT OF SPEC") verdictStatus = "NEEDS ADJUSTMENT";
    } else {
      verdictReasons.push({ label: "Lab Safety", ok: true, message: `Safety score ${healthRes.finalScore}/100. Standard personal protective equipment applies.` });
    }

    // Critical Overrides
    if (compRes.alerts.some((a) => a.severity === "Critical") || advPH.pH < 1.0 || advPH.pH > 13.5 || !isCategorySuitable) {
      verdictStatus = "OUT OF SPEC";
    }

    const attentionExplanation = attentionItems.length > 0
      ? attentionItems.join(" ")
      : "Formula complies with physical-chemistry standards, surfactant synergy targets, and pH equilibrium specifications.";

    // Expert Formulation Reasoning & Sanity Check Engine (Single Formula State)
    const expertReport: ExpertReasoningReport = evaluateExpertReasoning({
      ingredients,
      productCategory,
      waterHardnessPpm,
      batchSizeKg,
      calculatedPH: advPH.pH,
      totalActiveMatter: totals.activeSurfactants,
      totalPercentage: totals.totalRaw,
      costPerKg: totals.costPerKg,
      cleaningScore: cleaningRes.cleaningScore,
      hardnessSufficiency: hardnessRes.sufficiency,
      maxSupportedHardnessPpm: hardnessRes.maxSupportedPpm,
      compatibilityScore: compRes.compatibilityScore,
      compatibilityAlerts: compRes.alerts,
      viscosityEstimate: estimatedViscosity
    });

    return {
      pH: advPH.pH,
      phResult: advPH,
      phConfidence,
      viscosity: estimatedViscosity,
      waterHardness: hardnessRes,
      hlb: hlbVal,
      hlbResult: hlbRes,
      cmc: cmcVal,
      activeMatter: totals.activeSurfactants,
      density: densityRes,
      totalSolids: totalSolidsPct,
      surfactantBreakdown: {
        anionic: Number(anionicPct.toFixed(2)),
        nonionic: Number(nonionicPct.toFixed(2)),
        amphoteric: Number(amphotericPct.toFixed(2)),
        cationic: Number(cationicPct.toFixed(2)),
        total: Number((anionicPct + nonionicPct + amphotericPct + cationicPct).toFixed(2))
      },
      chelatorActivePct: Number(chelatorActivePct.toFixed(2)),
      chelatorNames,
      cleaning: cleaningRes,
      foam: foamProfile,
      categorySuitability,
      compatibility: compRes,
      health: healthRes,
      preservativeWarning: presWarning,
      aiGrade,
      verdictStatus,
      verdictReasons,
      attentionExplanation,
      expertReport
    };
  }, [ingredients, batchSizeKg, productCategory, waterHardnessPpm, totals]);

  // Execute Check Formula Action
  const handleCheckFormula = () => {
    setHasAnalyzed(true);

    // Sync to active formula state
    if (onFormulaGenerated) {
      const activeObj: ActiveFormulaState = {
        id: `formula-${Date.now()}`,
        name: formulaName || `${productCategory} Formulation`,
        productType: productCategory,
        category: productCategory,
        batchSizeKg,
        batchSize: batchSizeKg,
        targetPH: scientificResults.pH,
        ingredients: ingredients.map((ing, idx) => ({
          ...ing,
          id: ing.id || `ing-${idx}`,
          percentage: Number(ing.percentage) || 0,
          percent: Number(ing.percentage) || 0,
          activeMatterPct: Number(ing.activeMatterPct) || 100,
          costPerKg: Number(ing.costPerKg) || 0
        }))
      };
      onFormulaGenerated(activeObj);
    }
  };

  // Save to Library Handler
  const handleSaveToLibrary = (name: string, category: string) => {
    const savedName = name.trim() || formulaName.trim() || `${category} Formulation`;
    const newFormulaItem = {
      id: `custom-${Date.now()}`,
      name: savedName,
      category,
      batchSizeKg,
      targetPH: scientificResults.pH,
      description: `Custom ${category} formulation with ${ingredients.length} active components.`,
      instructions: [
        'Charge 80% of water and solvent into main mixing vessel and begin medium agitation.',
        'Slowly add primary and secondary surfactants in sequence until fully dispersed.',
        'Neutralize slowly while monitoring batch temperature (< 45°C) and target pH.',
        'Add builders, chelating agents, and viscosity modifiers incrementally.',
        'Slurry salt if required to reach target viscosity, then add preservatives and fragrance below 35°C.'
      ],
      ingredients: ingredients.map((ing, idx) => ({
        id: ing.id || `ing-${idx}`,
        name: ing.name,
        category: ing.category || ing.role || 'Component',
        role: ing.role || ing.category || 'Component',
        percent: Number(ing.percentage ?? ing.percent ?? 0),
        percentage: Number(ing.percentage ?? ing.percent ?? 0),
        activePercent: Number(ing.activeMatterPct ?? ing.activePercent ?? 100),
        activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? 100),
        costPerKg: Number(ing.costPerKg ?? 0),
        function: ing.role || ing.category || 'Component'
      }))
    };
    try {
      const existing = JSON.parse(localStorage.getItem("user_saved_formulas") || "[]");
      const existingIdx = Array.isArray(existing) ? existing.findIndex((f: any) => f.id === newFormulaItem.id || (f.name === newFormulaItem.name && String(f.id).startsWith('custom-'))) : -1;
      if (existingIdx >= 0) {
        existing[existingIdx] = newFormulaItem;
      } else {
        existing.unshift(newFormulaItem);
      }
      localStorage.setItem("user_saved_formulas", JSON.stringify(existing));
    } catch (e) {
      console.error("Save error:", e);
    }
    setFormulaName(savedName);
    if (onFormulaGenerated) {
      const activeObj: ActiveFormulaState = {
        id: newFormulaItem.id,
        name: savedName,
        productType: category,
        category: category,
        batchSizeKg,
        batchSize: batchSizeKg,
        targetPH: scientificResults.pH,
        description: newFormulaItem.description,
        ingredients: ingredients.map((ing, idx) => ({
          ...ing,
          id: ing.id || `ing-${idx}`,
          percentage: Number(ing.percentage) || 0,
          percent: Number(ing.percentage) || 0,
          activeMatterPct: Number(ing.activeMatterPct) || 100,
          costPerKg: Number(ing.costPerKg) || 0
        }))
      };
      onFormulaGenerated(activeObj);
    }
    setShowSaveModal(false);
  };

  // Helper to style chemical role badges in soft dark tones
  const getRoleBadgeStyle = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("anionic")) return "bg-blue-950/80 text-blue-300 border-blue-500/40";
    if (r.includes("nonionic")) return "bg-teal-950/80 text-teal-300 border-teal-500/40";
    if (r.includes("amphoteric") || r.includes("zwitterionic")) return "bg-indigo-950/80 text-indigo-300 border-indigo-500/40";
    if (r.includes("cationic")) return "bg-purple-950/80 text-purple-300 border-purple-500/40";
    if (r.includes("builder") || r.includes("sequestrant") || r.includes("chelator")) return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
    if (r.includes("alkali") || r.includes("base") || r.includes("acid") || r.includes("neutraliz")) return "bg-amber-950/80 text-amber-300 border-amber-500/40";
    if (r.includes("preservative") || r.includes("biocide")) return "bg-rose-950/80 text-rose-300 border-rose-500/40";
    if (r.includes("thickener") || r.includes("polymer") || r.includes("viscosity")) return "bg-cyan-950/80 text-cyan-300 border-cyan-500/40";
    if (r.includes("solvent") || r.includes("hydrotrope") || r.includes("water")) return "bg-sky-950/80 text-sky-300 border-sky-500/40";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12 text-slate-100 min-w-0">
      
      {/* 1. HERO CARD & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121c38] via-[#10182e] to-[#0c1324] border border-cyan-500/40 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Formula Expert
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  Universal Analysis
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Formulation analysis, ingredient balancing & scientific verification
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <button
            onClick={() => setShowInciModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#131d35] border border-slate-700 text-xs font-bold text-slate-200 hover:text-white hover:bg-[#192648] hover:border-cyan-500/50 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="View regulatory INCI ingredient breakdown"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>INCI Label</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/60 active:scale-95 border border-cyan-400/40"
            title="Save current formulation to library"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Formula</span>
          </button>
        </div>
      </div>

      {/* SECTION 1 — CHECK FORMULA */}
      <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-lg">
        
        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/40">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              CHECK FORMULA
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-[#131d35] text-cyan-300 px-3 py-1 rounded-full border border-slate-700">
            {ingredients.length} raw materials configured
          </span>
        </div>

        {/* Input Parameters: Product Category, Batch Size, Water Hardness */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* A. Product Category */}
          <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3 space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Product Category
            </label>
            <div className="relative">
              <select
                value={productCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-[#0e1629] border border-slate-600 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none transition cursor-pointer appearance-none pr-8"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0e1629] text-white">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* B. Batch Size (kg) */}
          <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3 space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Batch Size (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="any"
                value={batchSizeKg}
                onChange={(e) => setBatchSizeKg(Math.max(0.1, Number(e.target.value) || 1))}
                className="w-full bg-[#0e1629] border border-slate-600 rounded-lg pl-3 pr-9 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-extrabold">
                kg
              </span>
            </div>
          </div>

          {/* C. Water Hardness (ppm) */}
          <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3 space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Water Hardness (ppm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={waterHardnessPpm}
                onChange={(e) => setWaterHardnessPpm(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-[#0e1629] border border-slate-600 rounded-lg pl-3 pr-11 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-extrabold">
                ppm
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2 — INGREDIENTS */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-cyan-400" />
              INGREDIENTS
            </h3>
            <button
              onClick={handleAutoBalanceWater}
              className="text-xs text-cyan-300 hover:text-white font-extrabold bg-[#131d35] hover:bg-cyan-950/80 border border-cyan-500/40 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Automatically adjust water to reach exactly 100.00%"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Balance Water (100%)
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-800 bg-[#0e1629] shadow-md">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#131d35] border-b border-slate-800 text-slate-300 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4 w-10">#</th>
                  <th className="py-3 px-3 sm:px-4 min-w-[200px]">Ingredient Name</th>
                  <th className="py-3 px-3 sm:px-4 min-w-[120px]">Role / Function</th>
                  <th className="py-3 px-3 sm:px-4 text-right min-w-[90px]">Raw %</th>
                  <th className="py-3 px-3 sm:px-4 text-right min-w-[80px]">Active %</th>
                  <th className="py-3 px-3 sm:px-4 text-right min-w-[100px]">Weight (kg)</th>
                  <th className="py-3 px-3 sm:px-4 text-right min-w-[110px]">Cost / kg (₹)</th>
                  <th className="py-3 px-3 sm:px-4 text-right min-w-[100px]">Cost (₹)</th>
                  <th className="py-3 px-3 sm:px-4 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ingredients.map((ing, idx) => {
                  const rawPct = Number(ing.percentage) || 0;
                  const calculatedWeight = ((rawPct / 100) * batchSizeKg).toFixed(3);
                  const ingId = ing.id || `ing-${idx}`;
                  const roleStr = ing.role || getAuditedIngredientCategory(ing.name || "");
                  const costNum = Number(ing.costPerKg) || 0;
                  const itemCost = ((rawPct / 100) * batchSizeKg * costNum).toFixed(2);

                  return (
                    <tr key={ingId} className="hover:bg-[#131d35]/60 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-mono text-slate-500 font-bold text-xs">
                        {idx + 1}
                      </td>

                      {/* Name with searchable selector */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={ing.name || ""}
                            onChange={(e) => handleUpdateIngredient(ingId, "name", e.target.value)}
                            placeholder="Type chemical name or search..."
                            className="w-full bg-[#131d35] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none font-medium"
                          />
                          <CategoryIngredientSelector
                            category={productCategory}
                            onSelect={(selected) => {
                              handleSelectUniversalIngredient(ingId, selected);
                            }}
                          />
                        </div>
                      </td>

                      {/* Role / Function */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block truncate max-w-[130px] ${getRoleBadgeStyle(roleStr)}`}>
                          {roleStr}
                        </span>
                      </td>

                      {/* Raw Material % */}
                      <td className="py-2.5 px-3 sm:px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={ing.percentage ?? 0}
                            onChange={(e) => handleUpdateIngredient(ingId, "percentage", Number(e.target.value) || 0)}
                            className="w-20 bg-[#131d35] border border-slate-700 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-mono text-right text-cyan-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none font-bold"
                          />
                          <span className="text-slate-500 text-xs font-semibold">%</span>
                        </div>
                      </td>

                      {/* Active % */}
                      <td className="py-2.5 px-3 sm:px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={ing.activeMatterPct ?? 100}
                            onChange={(e) => handleUpdateIngredient(ingId, "activeMatterPct", Number(e.target.value) || 0)}
                            className="w-16 bg-[#131d35] border border-slate-700 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-mono text-right text-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none font-semibold"
                          />
                          <span className="text-slate-500 text-xs font-semibold">%</span>
                        </div>
                      </td>

                      {/* Batch Weight (kg) */}
                      <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-white text-xs sm:text-sm">
                        {calculatedWeight} kg
                      </td>

                      {/* Editable Cost / kg (₹) */}
                      <td className="py-2.5 px-3 sm:px-4 text-right min-w-[115px]">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span className="text-slate-500 text-xs font-semibold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={ing.costPerKg !== undefined && ing.costPerKg !== null && Number(ing.costPerKg) > 0 ? ing.costPerKg : ""}
                            placeholder="0.00"
                            onChange={(e) => handleUpdateIngredient(ingId, "costPerKg", e.target.value === "" ? 0 : Number(e.target.value))}
                            className="w-20 bg-[#131d35] border border-slate-700 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-mono text-right text-emerald-400 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none font-bold"
                            title="User-controlled raw material cost per kg"
                          />
                        </div>
                      </td>

                      {/* Calculated Ingredient Cost (₹) */}
                      <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-xs sm:text-sm min-w-[100px]">
                        {costNum > 0 ? (
                          <span className="text-emerald-400">₹{itemCost}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Action / Remove Button */}
                      <td className="py-2.5 px-3 sm:px-4 text-center">
                        <button
                          onClick={() => handleRemoveIngredient(ingId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          title="Remove ingredient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View (< 640px) */}
          <div className="block sm:hidden space-y-2.5">
            {ingredients.map((ing, idx) => {
              const rawPct = Number(ing.percentage) || 0;
              const calculatedWeight = ((rawPct / 100) * batchSizeKg).toFixed(3);
              const ingId = ing.id || `ing-${idx}`;
              const roleStr = ing.role || getAuditedIngredientCategory(ing.name || "");
              const costNum = Number(ing.costPerKg) || 0;
              const itemCost = ((rawPct / 100) * batchSizeKg * costNum).toFixed(2);

              return (
                <div key={ingId} className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(roleStr)}`}>
                        {roleStr}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(ingId)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Name Input + Selector */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={ing.name || ""}
                      onChange={(e) => handleUpdateIngredient(ingId, "name", e.target.value)}
                      placeholder="Type chemical name..."
                      className="w-full bg-[#0e1629] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                    />
                    <CategoryIngredientSelector
                      category={productCategory}
                      onSelect={(selected) => {
                        handleSelectUniversalIngredient(ingId, selected);
                      }}
                    />
                  </div>

                  {/* 4-Field Grid: Raw %, Active %, Weight, Cost/kg */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Raw %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={ing.percentage ?? 0}
                        onChange={(e) => handleUpdateIngredient(ingId, "percentage", Number(e.target.value) || 0)}
                        className="w-full bg-[#0e1629] border border-slate-700 rounded px-1.5 py-1 font-mono font-bold text-cyan-300 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Active %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={ing.activeMatterPct ?? 100}
                        onChange={(e) => handleUpdateIngredient(ingId, "activeMatterPct", Number(e.target.value) || 0)}
                        className="w-full bg-[#0e1629] border border-slate-700 rounded px-1.5 py-1 font-mono text-slate-300 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Weight:</span>
                      <div className="font-mono font-bold text-white text-xs mt-1">
                        {calculatedWeight} kg
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Cost / kg (₹):</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ing.costPerKg !== undefined && ing.costPerKg !== null && Number(ing.costPerKg) > 0 ? ing.costPerKg : ""}
                        placeholder="0.00"
                        onChange={(e) => handleUpdateIngredient(ingId, "costPerKg", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full bg-[#0e1629] border border-slate-700 rounded px-1.5 py-1 font-mono font-bold text-emerald-400 text-xs mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Mobile Row Cost Summary */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-400">
                    <span className="text-[10px]">Ingredient Cost:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {costNum > 0 ? `₹${itemCost}` : "₹0.00 (Price unconfigured)"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Ingredient Button & Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleAddIngredient}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-950/40 active:scale-95 border border-cyan-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD INGREDIENT</span>
            </button>

            <span className="text-xs text-slate-400 font-mono font-bold">
              Total items: {ingredients.length}
            </span>
          </div>
        </div>

        {/* SECTION 3 — LIVE FORMULA TOTALS */}
        <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              LIVE FORMULA TOTALS
            </h3>
            <div className="flex items-center gap-2">
              {totals.isBalanced ? (
                <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Check className="w-3.5 h-3.5" /> Balanced 100%
                </span>
              ) : (
                <span className="text-[11px] font-extrabold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <AlertTriangle className="w-3.5 h-3.5" /> Total: {totals.totalRaw}% (Imbalance: {(100 - totals.totalRaw).toFixed(2)}%)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* 1. Total Raw Material % */}
            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Total Raw Material
              </span>
              <span className={`text-base sm:text-lg font-mono font-extrabold block mt-0.5 ${totals.isBalanced ? "text-white" : "text-amber-400"}`}>
                {totals.totalRaw} %
              </span>
            </div>

            {/* 2. Total Surfactant % */}
            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Total Surfactant %
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-cyan-400 block mt-0.5">
                {totals.rawSurfactants} %
              </span>
            </div>

            {/* 3. Active Surfactants % */}
            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Active Surfactants %
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-indigo-400 block mt-0.5">
                {totals.activeSurfactants} %
              </span>
            </div>

            {/* 4. Water % */}
            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Water %
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-teal-400 block mt-0.5">
                {totals.waterPct} %
              </span>
            </div>

            {/* 5. Total Batch Weight */}
            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Total Batch Weight
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-white block mt-0.5">
                {batchSizeKg} kg
              </span>
            </div>
          </div>

          {/* Compact Live Cost Summary Row */}
          <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 bg-[#0e1629]/70 rounded-xl p-3 border border-slate-800">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 text-xs font-semibold">Total Raw Material Cost:</span>
                <span className="font-mono font-extrabold text-white ml-1.5 text-sm sm:text-base">
                  ₹{formulaCost.totalBatchCost.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs font-semibold">Finished Formula Cost:</span>
                <span className="font-mono font-extrabold text-emerald-400 ml-1.5 text-sm sm:text-base">
                  ₹{formulaCost.costPerKg.toFixed(2)} / kg
                </span>
              </div>
            </div>
            <div>
              {formulaCost.isComplete ? (
                <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  COMPLETE PRICING
                </span>
              ) : (
                <span className="text-[11px] font-extrabold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  PRICE INPUT REQUIRED ({formulaCost.missingPriceCount} unpriced)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3.5 — DEDICATED COSTING / UNIT COSTING & COMMERCIAL PROJECTIONS */}
        <div className="bg-[#131d35] border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                  COSTING / UNIT COSTING & COMMERCIAL PROJECTIONS
                </h3>
                <p className="text-[11px] text-slate-400">
                  User-controlled raw-material pricing & commercial margin chain
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                formulaCost.isComplete
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                  : "bg-amber-950/80 text-amber-300 border-amber-500/50"
              }`}
            >
              {formulaCost.isComplete ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> COMPLETE
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> PRICE INPUT REQUIRED
                </>
              )}
            </span>
          </div>

          {/* Formulator Guidance Notice */}
          {formulaCost.isComplete ? (
            <div className="text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All {formulaCost.totalIngredientsCount} raw-material prices configured by formulator. Commercial unit costing and margin projections are fully active.
              </span>
            </div>
          ) : (
            <div className="text-xs bg-amber-950/40 border border-amber-500/30 text-amber-300 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {formulaCost.statusMessage}. Enter raw material prices in the ingredient table above to calculate accurate formula batch costs.
              </span>
            </div>
          )}

          {/* 3 Large Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Finished Formula Cost / kg
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 block mt-1">
                ₹{formulaCost.costPerKg.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal ml-1">/ kg</span>
              </span>
            </div>

            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Total Batch Cost ({batchSizeKg} kg)
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-white block mt-1">
                ₹{formulaCost.totalBatchCost.toFixed(2)}
              </span>
            </div>

            <div className="bg-[#0e1629] p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                Priced Ingredients
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-300 block mt-1">
                {formulaCost.completePriceCount} / {formulaCost.totalIngredientsCount}
                <span className="text-xs text-slate-400 font-normal ml-1.5">priced</span>
              </span>
            </div>
          </div>

          {/* Per-Ingredient Cost Breakdown */}
          <div className="bg-[#0e1629] rounded-xl border border-slate-800 p-3 sm:p-4 space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Raw Material Cost Breakdown</span>
              <span className="text-[10px] font-normal text-slate-400">
                Batch: {batchSizeKg} kg
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-1.5 px-2">Ingredient</th>
                    <th className="py-1.5 px-2 text-right">Dosage</th>
                    <th className="py-1.5 px-2 text-right">Batch Qty</th>
                    <th className="py-1.5 px-2 text-right">Cost/kg</th>
                    <th className="py-1.5 px-2 text-right">Total Cost</th>
                    <th className="py-1.5 px-2 text-right">% of Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {formulaCost.ingredientCosts.map((item, i) => (
                    <tr key={item.id || i} className="hover:bg-[#131d35]/40">
                      <td className="py-2 px-2 text-white font-sans font-medium">
                        {item.name || `Ingredient #${i + 1}`}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {item.percentage}%
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {item.weightKg.toFixed(2)} kg
                      </td>
                      <td className="py-2 px-2 text-right">
                        {item.hasUserPrice ? (
                          <span className="text-emerald-400 font-bold">₹{item.costPerKg.toFixed(2)}</span>
                        ) : (
                          <span className="text-amber-400 text-[11px] font-sans font-semibold">Not Set</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-white">
                        ₹{item.totalCost.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-cyan-300">
                        {item.costPercentageOfTotal.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commercial Margin Chain Projections */}
          {formulaCost.totalBatchCost > 0 && (
            <div className="bg-[#0e1629] rounded-xl border border-slate-800 p-3 sm:p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Commercial Margin Chain Projections
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">Mfg Overhead (+12%)</span>
                  <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                    ₹{marginChain.manufacturingCost.toFixed(2)} / kg
                  </span>
                </div>
                <div className="bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">Ex-Factory (+₹15 Pkg)</span>
                  <span className="font-mono font-bold text-cyan-300 mt-0.5 block">
                    ₹{marginChain.finalExFactoryCost.toFixed(2)} / kg
                  </span>
                </div>
                <div className="bg-[#131d35] p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">Wholesale (+20%)</span>
                  <span className="font-mono font-bold text-indigo-300 mt-0.5 block">
                    ₹{marginChain.suggestedWholesale.toFixed(2)} / kg
                  </span>
                </div>
                <div className="bg-[#131d35] p-2.5 rounded-lg border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block font-extrabold">Suggested Retail MRP</span>
                  <span className="font-mono font-extrabold text-emerald-400 mt-0.5 block text-sm">
                    ₹{marginChain.suggestedMRP.toFixed(2)} / kg
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY ACTION: CHECK FORMULA */}
        <div className="pt-1">
          <button
            onClick={handleCheckFormula}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:bg-blue-800 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-cyan-950/60 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/30"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span>CHECK FORMULA / ANALYZE FORMULATION</span>
          </button>
        </div>
      </div>

      {/* SECTION 4 — SCIENTIFIC & PERFORMANCE RESULTS */}
      {hasAnalyzed && (
        <div className="space-y-6">
          
          {/* Section Heading */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Atom className="w-5 h-5 text-cyan-400" />
                SCIENTIFIC & PERFORMANCE RESULTS
              </h2>
              <p className="text-xs text-slate-400">
                Consolidated physical chemistry and performance analysis for {productCategory}
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#131d35] border border-slate-700 text-cyan-300 font-bold">
              Batch: {batchSizeKg} kg
            </span>
          </div>

          {/* GROUP A — FORMULATION QUALITY */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
              <Layers className="w-4 h-4 text-cyan-400" /> GROUP A — FORMULATION QUALITY
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* 1. pH */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">1. Equilibrium pH</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    scientificResults.pH >= getTargetPHRange(productCategory).min && scientificResults.pH <= getTargetPHRange(productCategory).max
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  }`}>
                    {scientificResults.pH >= getTargetPHRange(productCategory).min && scientificResults.pH <= getTargetPHRange(productCategory).max
                      ? "✓ In Target Range"
                      : "⚠ Out of Target"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.pH.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Target: {getTargetPHRange(productCategory).min} - {getTargetPHRange(productCategory).max}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Newton-Raphson charge balance ({scientificResults.pH < 7 ? "Acidic" : scientificResults.pH > 7 ? "Alkaline" : "Neutral"}) • <span className="text-slate-300 font-medium">{scientificResults.phConfidence?.confidence || "Theoretical Model"}</span>. Benchtop electrode testing recommended.
                </p>
              </div>

              {/* 2. Viscosity */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">2. Viscosity</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                    {isMetricApplicable(productCategory, "viscosity") ? "Estimated" : "N/A"}
                  </span>
                </div>
                {isMetricApplicable(productCategory, "viscosity") ? (
                  <>
                    <span className="text-sm font-mono font-bold text-white block truncate">
                      {scientificResults.viscosity}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Modeled from surfactant micellar structuring & electrolyte packing.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                      N/A — Not applicable for this category
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Powder formulation; bulk density evaluated separately.
                    </p>
                  </>
                )}
              </div>

              {/* 3. Formula Stability */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">3. Formula Stability</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/40">
                    Phase Stable
                  </span>
                </div>
                <span className="text-xs font-bold text-white block truncate">
                  {totals.activeSurfactants > 35 ? "High active surfactant concentration. Couple with hydrotrope." : "Standard micellar dispersion."}
                </span>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Preservation: {scientificResults.preservativeWarning ? "⚠ Needs Preservative" : "✓ Verified"}
                </p>
              </div>

              {/* 4. Bulk Density & Specific Gravity */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">4. Density & Specific Gravity</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    Harmonic Model
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.density.densityGPerCm3.toFixed(3)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    g/cm³ (SG: {scientificResults.density.specificGravity.toFixed(3)})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Calculated bulk density: {scientificResults.density.densityKgPerM3.toFixed(1)} kg/m³. Batch volume: {(scientificResults.density.totalVolumeCm3 / 1000).toFixed(2)} L.
                </p>
              </div>

              {/* 5. Total Solids (NVR) */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">5. Total Solids (NVR)</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40">
                    Non-Volatile
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.totalSolids.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Solids / Residue
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Water & volatile carrier content: {(100 - scientificResults.totalSolids).toFixed(1)}%.
                </p>
              </div>
            </div>
          </div>

          {/* GROUP B — SURFACTANT SCIENCE */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
              <Zap className="w-4 h-4 text-indigo-400" /> GROUP B — SURFACTANT SCIENCE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* 4. HLB */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">4. Mixed HLB</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                    {isMetricApplicable(productCategory, "hlb") ? "Hydrophilic-Lipophilic" : "N/A"}
                  </span>
                </div>
                {isMetricApplicable(productCategory, "hlb") ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-extrabold text-white">
                        {scientificResults.hlb > 0 ? scientificResults.hlb.toFixed(1) : "N/A"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">Blended HLB</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {scientificResults.hlb >= 12 && scientificResults.hlb <= 15
                        ? "Optimal nonionic detergency & micellar solubilization window (12-15)."
                        : scientificResults.hlb > 15
                        ? "Extended ionic HLB (Davies scale). Strong hydrophilic detergency."
                        : "Blended HLB outside standard detergent optimum (12-15)."}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                      N/A — Not applicable for this category
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      HLB is primarily applicable to nonionic emulsification systems.
                    </p>
                  </>
                )}
              </div>

              {/* 5. CMC */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">5. Mixed CMC</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40">
                    {isMetricApplicable(productCategory, "cmc") ? "Clint Model" : "N/A"}
                  </span>
                </div>
                {isMetricApplicable(productCategory, "cmc") ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-extrabold text-white">
                        {scientificResults.cmc ? Math.round(scientificResults.cmc.ppm) : "N/A"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        ppm ({scientificResults.cmc ? scientificResults.cmc.molar.toFixed(2) : "--"} mM)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Clint ideal pseudophase model{scientificResults.cmc?.hasSynergyPair ? " • Synergy detected" : ""}{scientificResults.cmc?.hasElectrolyteScreening ? " • Electrolyte present" : ""}. Real CMC may shift with electrolytes.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                      N/A — Not applicable for this category
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      CMC not evaluated for non-surfactant specialty category.
                    </p>
                  </>
                )}
              </div>

              {/* 6. Surfactant Charge / System */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">6. Surfactant System</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40">
                    {scientificResults.surfactantBreakdown.total}% Total Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-300 pt-0.5">
                  <div className="bg-[#131d35] p-1.5 rounded border border-blue-500/30">Anionic: <span className="text-blue-400 font-bold">{scientificResults.surfactantBreakdown.anionic}%</span></div>
                  <div className="bg-[#131d35] p-1.5 rounded border border-teal-500/30">Nonionic: <span className="text-teal-400 font-bold">{scientificResults.surfactantBreakdown.nonionic}%</span></div>
                  <div className="bg-[#131d35] p-1.5 rounded border border-indigo-500/30">Amphoteric: <span className="text-indigo-400 font-bold">{scientificResults.surfactantBreakdown.amphoteric}%</span></div>
                  <div className="bg-[#131d35] p-1.5 rounded border border-purple-500/30">Cationic: <span className="text-purple-400 font-bold">{scientificResults.surfactantBreakdown.cationic}%</span></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight pt-1">
                  Total Active Surfactants: <span className="text-indigo-300 font-bold">{scientificResults.surfactantBreakdown.total}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* GROUP C — CLEANING & HARD WATER */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
              <Droplets className="w-4 h-4 text-emerald-400" /> GROUP C — CLEANING & HARD WATER
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* 7. Cleaning Score / CPI */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">7. Cleaning Score (CPI)</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    {isMetricApplicable(productCategory, "cleaningScore") ? scientificResults.cleaning.cleaningPower : "N/A"}
                  </span>
                </div>
                {isMetricApplicable(productCategory, "cleaningScore") ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-extrabold text-emerald-400">
                        {scientificResults.cleaning.cleaningScore}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">/ 100 Index</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Degreasing: {scientificResults.cleaning.degreasingScore}% | Particulate Soil: {scientificResults.cleaning.particulateSoilRemoval}%. Empirical R&D screening metric.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-500 block pt-1 italic font-semibold">
                      N/A — Not applicable for this category
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Fabric softener / conditioner (Non-cleansing category).
                    </p>
                  </>
                )}
              </div>

              {/* 8. Hard Water Tolerance */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">8. Hard Water Tolerance</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    scientificResults.waterHardness.sufficiency === "sufficient"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  }`}>
                    {scientificResults.waterHardness.sufficiency.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.waterHardness.maxSupportedPpm}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">ppm CaCO₃ max (w/ margin)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Simulated at {waterHardnessPpm} ppm demand. {scientificResults.waterHardness.description}
                </p>
              </div>

              {/* 9. Builder / Chelation Performance */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">9. Builder / Chelation</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    scientificResults.chelatorActivePct > 0 ? "bg-teal-950/80 text-teal-300 border-teal-500/40" : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  }`}>
                    {scientificResults.chelatorActivePct > 0 ? "Active Sequestration" : "Unchelated"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.chelatorActivePct}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Chelator Actives</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {scientificResults.chelatorNames.length > 0
                    ? `Active agents: ${scientificResults.chelatorNames.slice(0, 2).join(", ")}. Capacity: ${scientificResults.waterHardness.totalSequestrationMg} mg CaCO₃ / 20g dose.`
                    : "No organic builder detected; hard water tolerance supported by surfactants."}
                </p>
              </div>
            </div>
          </div>

          {/* GROUP D — PRODUCT PERFORMANCE */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-teal-300 bg-teal-950/60 border border-teal-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
              <CheckCircle className="w-4 h-4 text-teal-400" /> GROUP D — PRODUCT PERFORMANCE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* 10. Foam Profile */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">10. Foam Profile</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40">
                    Ross-Miles
                  </span>
                </div>
                <span className="text-sm font-extrabold text-white block mt-1">
                  {scientificResults.foam}
                </span>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Stability evaluated from anionic-amphoteric synergistic packing.
                </p>
              </div>

              {/* 11. Chemical Compatibility */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">11. Compatibility</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    scientificResults.compatibility.compatible ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                  }`}>
                    {scientificResults.compatibility.compatible ? "PASSED" : "HAZARD"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.compatibility.compatibilityScore}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 100 Rating</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {scientificResults.compatibility.warnings[0] || "No anionic/cationic precipitation or degradation hazards."}
                </p>
              </div>

              {/* 12. Product-Category Suitability */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">12. Category Suitability</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    Verified
                  </span>
                </div>
                <span className="text-xs font-bold text-white block truncate mt-1">
                  {scientificResults.categorySuitability}
                </span>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Tested against manufacturing standards for {productCategory}.
                </p>
              </div>
            </div>
          </div>

          {/* GROUP E — SAFETY & ECONOMICS */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-2 w-fit">
              <DollarSign className="w-4 h-4 text-amber-400" /> GROUP E — SAFETY & ECONOMICS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* 13. Safety / Hazard Status */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">13. Safety / GHS Status</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    scientificResults.health.finalScore >= 75 ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  }`}>
                    {scientificResults.health.rating}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {scientificResults.health.finalScore}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 100 GHS Score</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {scientificResults.health.alerts[0]?.message || "GHS safety rating passed. Standard personal protective equipment applies."}
                </p>
              </div>

              {/* 14. Raw Material Cost */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">14. Raw Material Cost</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    Unit Economics
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    ₹{totals.costPerKg}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ kg formula</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Calculated from master raw material database pricing.
                </p>
              </div>

              {/* 15. Total Batch Cost */}
              <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 uppercase">15. Batch Cost</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40">
                    {batchSizeKg} kg Batch
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    ₹{totals.totalBatchCost}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Total</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Total production cost for configured {batchSizeKg} kg batch size.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5 — FORMULA VERDICT */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  FORMULA VERDICT
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category-aware scientific compliance verdict for {productCategory}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {scientificResults.verdictStatus === "GOOD / WITHIN TARGET" && (
                  <span className="px-4 py-2 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs">
                    <Check className="w-4 h-4" /> ✓ GOOD / WITHIN TARGET
                  </span>
                )}
                {scientificResults.verdictStatus === "NEEDS ADJUSTMENT" && (
                  <span className="px-4 py-2 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="w-4 h-4" /> ⚠ NEEDS ADJUSTMENT
                  </span>
                )}
                {scientificResults.verdictStatus === "OUT OF SPEC" && (
                  <span className="px-4 py-2 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs">
                    <XCircle className="w-4 h-4" /> ✕ OUT OF SPEC
                  </span>
                )}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Verification Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {scientificResults.verdictReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm bg-[#131d35] p-3 rounded-xl border border-slate-700/80">
                    {reason.ok ? (
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    ) : (
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠</span>
                    )}
                    <div>
                      <span className="font-bold text-white mr-1.5">{reason.label}:</span>
                      <span className={reason.ok ? "text-slate-300 font-medium" : "text-amber-300 font-semibold"}>
                        {reason.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT NEEDS ATTENTION Box */}
            <div className="bg-amber-950/40 rounded-xl p-4 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                <Info className="w-4 h-4 text-amber-400" />
                WHAT NEEDS ATTENTION
              </div>
              <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed">
                {scientificResults.attentionExplanation}
              </p>
            </div>

            {/* Final Overall Grade Summary */}
            <div className="bg-[#131d35] rounded-xl p-3.5 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold">Overall Assessment: </span>
                <span className="font-extrabold text-white ml-1">{scientificResults.verdictStatus}</span>
              </div>
              <span className="text-cyan-400 font-mono text-xs font-extrabold">
                Grade {scientificResults.aiGrade.grade} ({scientificResults.aiGrade.score}/100)
              </span>
            </div>

            {/* EXPERT FORMULATION REASONING & RECOMMENDATIONS */}
            {scientificResults.expertReport && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                {/* Category Context Strip */}
                <div className="bg-[#131d35] p-3.5 rounded-xl border border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white uppercase tracking-wider">Target Profile: </span>
                      <span className="text-slate-300 font-semibold">{scientificResults.expertReport.productCategoryContext.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                      pH: {scientificResults.expertReport.productCategoryContext.targetPHMin} - {scientificResults.expertReport.productCategoryContext.targetPHMax}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">
                      Actives: ≥{scientificResults.expertReport.productCategoryContext.targetActiveMatterMin}%
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                      {scientificResults.expertReport.productCategoryContext.foamExpectation}
                    </span>
                  </div>
                </div>

                {/* Grounded Strengths */}
                {scientificResults.expertReport.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      Formulation Strengths ({scientificResults.expertReport.strengths.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {scientificResults.expertReport.strengths.map((str) => (
                        <div key={str.id} className="bg-[#131d35] border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <span className="text-emerald-400">✓</span> {str.title}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {str.scientificType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {str.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flagged Forensic Issues */}
                {scientificResults.expertReport.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Sanity Check & Chemical Flags ({scientificResults.expertReport.issues.length})
                    </h4>
                    <div className="space-y-2.5">
                      {scientificResults.expertReport.issues.map((iss) => (
                        <div key={iss.id} className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <AlertTriangle className={`w-3.5 h-3.5 ${
                                iss.severity === "Critical" ? "text-rose-400" : iss.severity === "High" ? "text-amber-400" : "text-yellow-400"
                              }`} />
                              {iss.issue}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                                iss.severity === "Critical"
                                  ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                                  : iss.severity === "High"
                                  ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}>
                                {iss.severity.toUpperCase()} SEVERITY
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {iss.scientificType}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            <span className="font-bold text-amber-200 mr-1">Why it matters:</span>
                            {iss.whyItMatters}
                          </p>
                          <div className="bg-[#0e1629] p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
                            <div>
                              <span className="font-semibold text-slate-300 mr-1">Scientific Basis:</span>
                              {iss.scientificBasis}
                            </div>
                            <div className="shrink-0 text-cyan-300 font-medium">
                              <span className="font-semibold text-slate-300 mr-1">Check:</span>
                              {iss.whatToCheck}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical Expert Recommendations */}
                {scientificResults.expertReport.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-cyan-400" />
                      Professional Chemist Advisory ({scientificResults.expertReport.recommendations.length})
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {scientificResults.expertReport.recommendations.map((rec) => (
                        <div key={rec.id} className="bg-[#131d35] border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-cyan-300">
                              {rec.problem}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                              CONFIDENCE: {rec.confidence}
                            </span>
                          </div>
                          <div className="text-[11px] space-y-1.5 text-slate-300 leading-relaxed">
                            <div>
                              <span className="font-bold text-emerald-300 mr-1">Recommended Action:</span>
                              {rec.recommendedAction}
                            </div>
                            <div>
                              <span className="font-bold text-blue-300 mr-1">Expected Effect:</span>
                              {rec.expectedEffect}
                            </div>
                            <div>
                              <span className="font-bold text-amber-300 mr-1">Trade-off:</span>
                              {rec.tradeOff}
                            </div>
                            {rec.calculationBasis && (
                              <div className="text-[10px] font-mono text-slate-400 bg-[#0e1629] px-2 py-1 rounded border border-slate-800">
                                Basis: {rec.calculationBasis}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVE MODAL */}
      <SaveFormulaModal
        isOpen={showSaveModal}
        ingredients={ingredients}
        batchSizeKg={batchSizeKg}
        targetPH={scientificResults.pH}
        saveFormulaName={formulaName}
        setSaveFormulaName={setFormulaName}
        onSave={handleSaveToLibrary}
        onClose={() => setShowSaveModal(false)}
      />

      {/* INCI MODAL */}
      <InciLabelModal
        isOpen={showInciModal}
        ingredients={ingredients}
        formulaName={formulaName || productCategory}
        onClose={() => setShowInciModal(false)}
      />
    </div>
  );
}

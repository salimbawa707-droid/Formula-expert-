import { useState, useEffect, useMemo, useRef } from "react";
import {
  FlaskConical,
  Plus,
  Trash2,
  AlertTriangle,
  Sliders,
  Activity,
  Check,
  ChevronDown,
  Sparkles,
  FileText,
  Bookmark
} from "lucide-react";
import {
  calculateRawSurfactants,
  calculateActiveSurfactants,
  calculateCommercialMarginChain,
  getAuditedIngredientCategory,
  getDefaultActiveMatter,
  calculateMixedCMC,
  getIngredientCmcData
} from "../utils/calculators";
import { FormulaScientificOrchestrator } from "../utils/orchestrator/formulaScientificOrchestrator";
import { calculateFormulaCost, FormulaCostReport } from "../utils/costingEngine";
import { normalizeProductCategory } from "../domain/productTaxonomy";
import CategoryIngredientSelector from "./CategoryIngredientSelector";
import SaveFormulaModal from "./SaveFormulaModal";
import InciLabelModal from "./InciLabelModal";
import { PowderEngineDashboard } from "./PowderEngineDashboard";
import { SpecificationDashboard } from "./SpecificationDashboard";
import { isPowderCategory } from "../utils/formulationEngineRouter";
import { evaluatePowderFormulation, PowderLabMeasurementInputs } from "../utils/powderEngine";
import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from "../data/universalIngredientLibrary";
import { ActiveFormulaState, FormulationIngredient } from "../types";
import { PRODUCT_CATEGORIES } from "./aiformulator/constants";
import {
  executeStagedScientificAnalysis,
  StagedWorkflowProgress,
  ForensicAuditReport,
  FormulaAnalysisSnapshot
} from "../utils/analysisWorkflowEngine";

// Modularized Panels
import { CostingProjectionsPanel } from "./aiformulator/CostingProjectionsPanel";
import { ScientificResultsPanel } from "./aiformulator/ScientificResultsPanel";
import { FormulaVerdictPanel } from "./aiformulator/FormulaVerdictPanel";
import { FormulationOptimizationPanel } from "./aiformulator/FormulationOptimizationPanel";
import { StagedAnalysisWorkflowCard } from "./aiformulator/StagedAnalysisWorkflowCard";
import { GeminiChemistryChatModal, FormulaChatContext } from "./GeminiChemistryChatModal";
import { Bot } from "lucide-react";

// Critical Micelle Concentration estimation helper (backwards-compatible alias)
export const getIngredientCmc = (name: string): { cmcMolar: number; cmcPpm: number } | null => {
  const data = getIngredientCmcData(name);
  return data ? { cmcMolar: data.cmcMolar, cmcPpm: data.cmcPpm } : null;
};

export const calculateMixedCmc = (ingredients: any[]) => {
  return calculateMixedCMC(ingredients);
};

// Formula Fingerprint Computation (Deterministic hash of formulation state)
export function computeFormulaFingerprint(inputs: {
  formulaName: string;
  productCategory: string;
  batchSizeKg: number;
  waterHardnessPpm: number;
  ingredients: Array<{ id?: string; name: string; percentage?: number; activeMatterPct?: number; role?: string; costPerKg?: number | null }>;
  powderLabInputs?: PowderLabMeasurementInputs;
}): string {
  const cleanCat = (inputs.productCategory || '').trim().toLowerCase();
  const cleanName = (inputs.formulaName || '').trim().toLowerCase();
  const cleanHardness = Number(inputs.waterHardnessPpm) || 0;

  const sortedIngs = (inputs.ingredients || [])
    .map((ing) => {
      const name = (ing.name || '').trim().toLowerCase();
      const pct = (Number(ing.percentage) || 0).toFixed(4);
      const act = (Number(ing.activeMatterPct) || 0).toFixed(2);
      const cost = ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg).toFixed(2) : 'null';
      return `${name}:${pct}:${act}:${cost}`;
    })
    .sort()
    .join('|');

  const powderStr = inputs.powderLabInputs ? JSON.stringify(inputs.powderLabInputs) : '';
  // Intensive chemical composition fingerprint (excludes batchSizeKg scaling)
  const raw = `CAT:${cleanCat}|NAME:${cleanName}|HARD:${cleanHardness}|INGS:${sortedIngs}|POWDER:${powderStr}`;

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `FP-${hexHash}`;
}

export interface DeepAnalysisState {
  fingerprint: string;
  timestamp: number;
  formulaSnapshot: {
    formulaName: string;
    productCategory: string;
    batchSizeKg: number;
    waterHardnessPpm: number;
    ingredients: FormulationIngredient[];
    powderLabInputs: PowderLabMeasurementInputs;
  };
  orchestratorResult: any;
  powderReport: any;
  scientificResults: any;
}

export function runDeepScientificAnalysis(snapshot: {
  formulaName: string;
  productCategory: string;
  batchSizeKg: number;
  waterHardnessPpm: number;
  ingredients: FormulationIngredient[];
  powderLabInputs: PowderLabMeasurementInputs;
  activeFormulaVersion?: string;
}): DeepAnalysisState {
  const fingerprint = computeFormulaFingerprint(snapshot);
  const isPowderForm = isPowderCategory(snapshot.productCategory);

  const powderRep = isPowderForm
    ? evaluatePowderFormulation({
        ingredients: snapshot.ingredients,
        productCategory: snapshot.productCategory,
        batchSizeKg: snapshot.batchSizeKg,
        waterHardnessPpm: snapshot.waterHardnessPpm,
        labMeasurements: snapshot.powderLabInputs
      })
    : null;

  const orchResult = FormulaScientificOrchestrator.evaluate({
    formulaName: snapshot.formulaName,
    formulaVersion: snapshot.activeFormulaVersion || '1.0.0',
    productCategory: snapshot.productCategory,
    ingredients: snapshot.ingredients.map((ing, idx) => ({
      ...ing,
      ingredientId: ing.id || `ing-${idx}`,
      percentage: Number(ing.percentage ?? (ing as any).percent ?? 0),
      costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null
    })),
    batchSizeKg: snapshot.batchSizeKg,
    waterHardnessPpm: snapshot.waterHardnessPpm,
    costContext: {
      targetCostPerKg: 45.0
    }
  });

  const o = orchResult;
  const v = o.verdictMatrix;
  const c = o.cleaningResult;
  const p = o.pHResult;
  const a = o.activeMatterResult;
  const h = o.hardnessResult;
  const ch = o.chelationResult;
  const visc = o.viscosityResult;
  const den = o.densityResult;
  const comp = o.compatibilityResult;
  const stab = o.stabilityResult;
  const qg = o.qualityGateResult;
  const prov = o.provenanceReport;
  const expert = o.expertReport;

  const sciResults = {
    qualityGateResult: qg,
    provenanceReport: prov,
    pH: p.ph,
    phResult: p,
    phConfidence: p.confidence,
    viscosity: visc.description,
    waterHardness: h,
    hlb: (o.hlbResult && o.hlbResult.status === 'VALID' && o.hlbResult.blendedHLB !== null) ? o.hlbResult.blendedHLB : 0,
    hlbResult: o.hlbResult,
    cmc: calculateMixedCMC(snapshot.ingredients),
    activeMatter: a.totalSurfactantActivePct,
    density: den,
    nvrResult: {
      nvrPercentage: den.nvrPercentage,
      isComplete: den.isNvrComplete,
      dataCompleteness: den.dataCompleteness,
      unknownIngredients: den.unknownIngredients || []
    },
    totalSolids: den.totalSolidsPct,
    surfactantBreakdown: a.surfactantBreakdown,
    chelatorActivePct: ch.chelatorActivePct,
    chelatorNames: ch.chelatorNames,
    cleaning: c,
    foam: c.foamProfile || "Moderate / Balanced Foam (Qualitative Foam Assessment)",
    categorySuitability: c.categorySuitability || "High (Optimal Formulation Profile)",
    compatibility: comp,
    health: o.labHealthResult,
    preservativeWarning: stab.preservativeWarning,
    aiGrade: orchResult.aiGrade,
    verdictStatus: v.verdictStatus,
    screeningStatus: v.screeningStatus,
    specVerdict: v.specVerdict,
    labEvidenceVerdict: v.labEvidenceVerdict,
    releaseGateDecision: v.releaseGateDecision,
    verdictReasons: v.verdictReasons,
    attentionExplanation: v.attentionExplanation,
    expertReport: expert
  };

  return {
    fingerprint,
    timestamp: Date.now(),
    formulaSnapshot: snapshot,
    orchestratorResult: orchResult,
    powderReport: powderRep,
    scientificResults: sciResults
  };
}

const DEFAULT_FORMULAS: Record<string, Array<{ name: string; percentage: number; activeMatterPct: number; role?: string; costPerKg?: number | null }>> = {
  "Laundry Powder": [
    { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 12.0, activeMatterPct: 90, role: "Anionic Surfactant", costPerKg: null },
    { name: "Sodium Carbonate (Dense Soda Ash)", percentage: 32.0, activeMatterPct: 100, role: "Builder (Precipitation)", costPerKg: null },
    { name: "Zeolite 4A (Detergent Builder)", percentage: 15.0, activeMatterPct: 100, role: "Builder (Ion-Exchange)", costPerKg: null },
    { name: "Sodium Percarbonate (Coated Oxygen Bleach)", percentage: 10.0, activeMatterPct: 100, role: "Bleaching Agent", costPerKg: null },
    { name: "Tetraacetylethylenediamine (TAED)", percentage: 2.0, activeMatterPct: 100, role: "Bleach Activator", costPerKg: null },
    { name: "Acrylic-Maleic Copolymer (Anti-Redeposition)", percentage: 2.0, activeMatterPct: 100, role: "Anti-redeposition Polymer", costPerKg: null },
    { name: "Sodium Silicate Powder (Processing Aid)", percentage: 4.0, activeMatterPct: 100, role: "Processing Aid", costPerKg: null },
    { name: "Optical Brightener (CBS-X)", percentage: 0.15, activeMatterPct: 100, role: "Optical Brightener", costPerKg: null },
    { name: "Protease Enzyme Granules", percentage: 0.80, activeMatterPct: 100, role: "Enzyme", costPerKg: null },
    { name: "Fragrance Encapsulates", percentage: 0.35, activeMatterPct: 100, role: "Fragrance", costPerKg: null },
    { name: "Blue / Red Speckles", percentage: 0.70, activeMatterPct: 100, role: "Colorant", costPerKg: null },
    { name: "Sodium Sulphate Anhydrous (Filler / Bulking)", percentage: 21.0, activeMatterPct: 100, role: "Filler / Bulking Agent", costPerKg: null }
  ],
  "Laundry Liquid": [
    { name: "Water (Aqua, Demineralized)", percentage: 70.0, activeMatterPct: 0, role: "Solvent", costPerKg: null },
    { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 8.0, activeMatterPct: 90, role: "Anionic Surfactant", costPerKg: null },
    { name: "Sodium Hydroxide (Caustic Soda Lye 100%)", percentage: 1.05, activeMatterPct: 100, role: "pH Adjuster", costPerKg: null },
    { name: "Sodium Laureth Sulfate (SLES 70%)", percentage: 10.0, activeMatterPct: 70, role: "Anionic Surfactant", costPerKg: null },
    { name: "Cocamidopropyl Betaine (CAPB 30%)", percentage: 3.0, activeMatterPct: 30, role: "Amphoteric Surfactant", costPerKg: null },
    { name: "Sodium Chloride (Salt)", percentage: 1.5, activeMatterPct: 100, role: "Thickener", costPerKg: null },
    { name: "Sodium Citrate (Dihydrate)", percentage: 1.0, activeMatterPct: 100, role: "Chelator", costPerKg: null },
    { name: "Optical Brightener (CBS-X)", percentage: 0.15, activeMatterPct: 100, role: "Additive", costPerKg: null },
    { name: "Phenoxyethanol (Safe Preservative)", percentage: 0.2, activeMatterPct: 100, role: "Preservative", costPerKg: null },
    { name: "Fragrance (Floral / Ocean Fresh)", percentage: 0.3, activeMatterPct: 100, role: "Fragrance", costPerKg: null },
    { name: "Blue / Violet Color Dye", percentage: 0.005, activeMatterPct: 100, role: "Colorant", costPerKg: null },
    { name: "Water (Aqua, Balance to 100%)", percentage: 4.795, activeMatterPct: 0, role: "Solvent", costPerKg: null }
  ],
  "Dishwash Liquid": [
    { name: "Water (Aqua, Demineralized)", percentage: 65.0, activeMatterPct: 0, role: "Solvent", costPerKg: null },
    { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 12.0, activeMatterPct: 90, role: "Anionic Surfactant", costPerKg: null },
    { name: "Sodium Hydroxide (Caustic Soda Lye 100%)", percentage: 1.55, activeMatterPct: 100, role: "pH Adjuster", costPerKg: null },
    { name: "Sodium Laureth Sulfate (SLES 70%)", percentage: 8.0, activeMatterPct: 70, role: "Anionic Surfactant", costPerKg: null },
    { name: "Cocamidopropyl Betaine (CAPB 30%)", percentage: 4.0, activeMatterPct: 30, role: "Amphoteric Surfactant", costPerKg: null },
    { name: "Sodium Chloride (Salt)", percentage: 2.0, activeMatterPct: 100, role: "Thickener", costPerKg: null },
    { name: "Magnesium Sulfate (Epsom Salt)", percentage: 1.0, activeMatterPct: 100, role: "Electrolyte", costPerKg: null },
    { name: "Sodium Benzoate (Safe Eco Preservative)", percentage: 0.2, activeMatterPct: 100, role: "Preservative", costPerKg: null },
    { name: "Lemon Fragrance / Essential Oil", percentage: 0.25, activeMatterPct: 100, role: "Fragrance", costPerKg: null },
    { name: "Yellow Food Grade Dye", percentage: 0.005, activeMatterPct: 100, role: "Colorant", costPerKg: null },
    { name: "Water (Aqua, Balance to 100%)", percentage: 5.995, activeMatterPct: 0, role: "Solvent", costPerKg: null }
  ],
  "Floor Cleaner": [
    { name: "Water (Aqua, Demineralized)", percentage: 90.0, activeMatterPct: 0, role: "Solvent", costPerKg: null },
    { name: "Linear Alcohol Ethoxylate (LAE-9)", percentage: 3.5, activeMatterPct: 100, role: "Nonionic Surfactant", costPerKg: null },
    { name: "Benzalkonium Chloride (BKC 50%)", percentage: 2.0, activeMatterPct: 50, role: "Cationic Disinfectant", costPerKg: null },
    { name: "Isopropyl Alcohol (IPA)", percentage: 1.5, activeMatterPct: 100, role: "Solvent", costPerKg: null },
    { name: "Pine / Citrus Fragrance", percentage: 0.5, activeMatterPct: 100, role: "Fragrance", costPerKg: null },
    { name: "Green Color Dye", percentage: 0.005, activeMatterPct: 100, role: "Colorant", costPerKg: null },
    { name: "Water (Aqua, Balance to 100%)", percentage: 2.495, activeMatterPct: 0, role: "Solvent", costPerKg: null }
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
    const raw = activeFormula?.category || activeFormula?.productType || localStorage.getItem("formula_expert_category");
    if (!raw) return "UNKNOWN_PRODUCT_CATEGORY";
    return normalizeProductCategory(raw);
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

  // 2. Ingredients List State
  const [ingredients, setIngredients] = useState<FormulationIngredient[]>(() => {
    if (activeFormula?.ingredients && activeFormula.ingredients.length > 0) {
      return activeFormula.ingredients.map((ing, idx) => ({
        ...ing,
        id: ing.id || `ing-${Date.now()}-${idx}`,
        percentage: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? getDefaultActiveMatter(ing.name || "")),
        costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null,
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
      costPerKg: item.costPerKg ?? null
    }));
  });

  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(true);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showInciModal, setShowInciModal] = useState<boolean>(false);
  const [powderLabInputs, setPowderLabInputs] = useState<PowderLabMeasurementInputs>({});
  const [powderBalanceToast, setPowderBalanceToast] = useState<string | null>(null);

  // Workflow State for Staged Scientific Analysis
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [workflowProgress, setWorkflowProgress] = useState<StagedWorkflowProgress | null>(null);
  const [forensicAuditReport, setForensicAuditReport] = useState<ForensicAuditReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeAnalysisIdRef = useRef<string | null>(null);

  // Gemini Chemistry Chatbot Modal State
  const [showChemistryChat, setShowChemistryChat] = useState<boolean>(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  const handleOpenChemistryChat = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setShowChemistryChat(true);
  };

  // Determine formulation engine type (Powder vs Liquid)
  const isPowder = isPowderCategory(productCategory);

  // Decoupled Deep Scientific Analysis State (Frozen snapshot of analyzed formula state)
  const [deepAnalysisState, setDeepAnalysisState] = useState<DeepAnalysisState>(() => {
    const initCat = activeFormula?.category || activeFormula?.productType
      ? normalizeProductCategory(activeFormula.category || activeFormula.productType!)
      : normalizeProductCategory(localStorage.getItem("formula_expert_category") || "Laundry Liquid");
    const initBatch = (activeFormula?.batchSizeKg && activeFormula.batchSizeKg > 0)
      ? activeFormula.batchSizeKg
      : ((activeFormula?.batchSize && activeFormula.batchSize > 0) ? activeFormula.batchSize : (localStorage.getItem("formula_expert_batchSize") ? Number(localStorage.getItem("formula_expert_batchSize")) : 100));
    const initHardness = localStorage.getItem("formula_expert_waterHardness") ? Number(localStorage.getItem("formula_expert_waterHardness")) : 150;
    const initName = activeFormula?.name || "New Formula";
    let initIngs: FormulationIngredient[] = [];
    if (activeFormula?.ingredients && activeFormula.ingredients.length > 0) {
      initIngs = activeFormula.ingredients.map((ing, idx) => ({
        ...ing,
        id: ing.id || `ing-${Date.now()}-${idx}`,
        percentage: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? getDefaultActiveMatter(ing.name || "")),
        costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null,
        role: ing.role || ing.function || getAuditedIngredientCategory(ing.name || "")
      }));
    } else {
      const catKey = localStorage.getItem("formula_expert_category") || "Laundry Liquid";
      const defaults = DEFAULT_FORMULAS[catKey] || DEFAULT_FORMULAS["Laundry Liquid"];
      initIngs = defaults.map((item, idx) => ({
        id: `ing-${Date.now()}-${idx}`,
        name: item.name,
        percentage: item.percentage,
        activeMatterPct: item.activeMatterPct,
        role: item.role || getAuditedIngredientCategory(item.name),
        costPerKg: item.costPerKg ?? null
      }));
    }

    return runDeepScientificAnalysis({
      formulaName: initName,
      productCategory: initCat,
      batchSizeKg: initBatch,
      waterHardnessPpm: initHardness,
      ingredients: initIngs,
      powderLabInputs: {},
      activeFormulaVersion: (activeFormula as any)?.version || '1.0.0'
    });
  });

  // Current live formula fingerprint (updated immediately on every edit)
  const currentFingerprint = useMemo(() => {
    return computeFormulaFingerprint({
      formulaName,
      productCategory,
      batchSizeKg,
      waterHardnessPpm,
      ingredients,
      powderLabInputs
    });
  }, [formulaName, productCategory, batchSizeKg, waterHardnessPpm, ingredients, powderLabInputs]);

  // Stale analysis indicator flag
  const isStale = useMemo(() => {
    if (!deepAnalysisState) return false;
    return currentFingerprint !== deepAnalysisState.fingerprint;
  }, [currentFingerprint, deepAnalysisState]);

  // Deep scientific analysis view-model selectors
  const scientificResults = deepAnalysisState.scientificResults;
  const powderReport = deepAnalysisState.powderReport;

  // Sync when activeFormula prop updates from Formula Library or external load
  useEffect(() => {
    if (activeFormula?.ingredients && activeFormula.ingredients.length > 0) {
      const rawCat = activeFormula.category || activeFormula.productType;
      const cat = rawCat ? normalizeProductCategory(rawCat) : "UNKNOWN_PRODUCT_CATEGORY";
      const batch = activeFormula.batchSizeKg || activeFormula.batchSize || 100;
      const name = activeFormula.name || "New Formula";
      const ings = activeFormula.ingredients.map((ing, idx) => ({
        ...ing,
        id: ing.id || `ing-${Date.now()}-${idx}`,
        percentage: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activeMatterPct: Number(ing.activeMatterPct ?? ing.activePercent ?? getDefaultActiveMatter(ing.name || "")),
        costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null,
        role: ing.role || ing.function || getAuditedIngredientCategory(ing.name || "")
      }));

      setProductCategory(cat);
      setBatchSizeKg(batch);
      setFormulaName(name);
      setIngredients(ings);

      const snapshot = {
        formulaName: name,
        productCategory: cat,
        batchSizeKg: batch,
        waterHardnessPpm,
        ingredients: ings,
        powderLabInputs,
        activeFormulaVersion: (activeFormula as any)?.version || '1.0.0'
      };
      setDeepAnalysisState(runDeepScientificAnalysis(snapshot));
      setHasAnalyzed(true);
    }
  }, [activeFormula]);

  // Persist simple state to localStorage
  useEffect(() => {
    localStorage.setItem("formula_expert_category", productCategory);
    localStorage.setItem("formula_expert_batchSize", String(batchSizeKg));
    localStorage.setItem("formula_expert_waterHardness", String(waterHardnessPpm));
  }, [productCategory, batchSizeKg, waterHardnessPpm]);

  // Handle Category Change (Loads default template, preserving user-entered prices for matching raw materials)
  const handleCategoryChange = (newCat: string) => {
    setProductCategory(newCat);
    if (DEFAULT_FORMULAS[newCat]) {
      const defaults = DEFAULT_FORMULAS[newCat];
      setIngredients((prev) =>
        defaults.map((item, idx) => {
          const match = prev.find(
            (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          const hasPreserved = match && typeof match.costPerKg === 'number' && !isNaN(match.costPerKg) && match.costPerKg >= 0;
          const preservedPrice = hasPreserved
            ? match.costPerKg
            : (item.costPerKg ?? null);
          return {
            id: `ing-${Date.now()}-${idx}`,
            name: item.name,
            percentage: item.percentage,
            activeMatterPct: item.activeMatterPct,
            role: item.role || getAuditedIngredientCategory(item.name),
            costPerKg: preservedPrice
          };
        })
      );
    }
  };

  // Add New Ingredient Row (Initializes with unconfigured costPerKg: null)
  const handleAddIngredient = () => {
    const newIng: FormulationIngredient = {
      id: `ing-${Date.now()}-${ingredients.length}`,
      name: "",
      percentage: 0,
      activeMatterPct: 100,
      role: "Additive",
      costPerKg: null
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
        const isUnknownActive = selected.id === 'aristo-9' || selected.unknownProperties?.includes('activeMatter');
        return {
          ...ing,
          name: selected.name,
          category: selected.category,
          role: selected.category || selected.function || getAuditedIngredientCategory(selected.name),
          function: selected.function,
          activeMatterPct: isUnknownActive ? undefined : (selected.activeDefault ?? selected.activeMatter),
          activeMatterInputSource: isUnknownActive ? 'UNKNOWN' : (selected.activeDefault ?? selected.activeMatter) !== undefined ? 'CATALOG_DEFAULT' : 'UNKNOWN',
          activeMatterEvidenceId: undefined,
          activeMatterEvidenceUrl: undefined,
          canonicalIngredientId: selected.id,
          identityType: selected.identityType,
          costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null,
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
        const updated = {
          ...ing,
          [field]: field === "costPerKg"
            ? (val === "" || val === null || val === undefined || isNaN(Number(val)) ? null : Math.max(0, Number(val)))
            : val
        };
        if (field === "name") {
          const matched = UNIVERSAL_INGREDIENTS.find(
            (u) => u.name.toLowerCase() === String(val).toLowerCase() || u.id.toLowerCase() === String(val).toLowerCase()
          );
          if (matched) {
            const isUnknownActive = matched.id === 'aristo-9' || matched.unknownProperties?.includes('activeMatter');
            updated.name = matched.name;
            const preserveUserActiveMatter = ing.activeMatterInputSource === 'USER_ENTERED';
            updated.activeMatterPct = preserveUserActiveMatter ? ing.activeMatterPct : isUnknownActive ? undefined : matched.activeDefault;
            updated.activeMatterInputSource = preserveUserActiveMatter ? 'USER_ENTERED' : isUnknownActive ? 'UNKNOWN' : matched.activeDefault !== undefined ? 'CATALOG_DEFAULT' : 'UNKNOWN';
            updated.activeMatterEvidenceId = undefined;
            updated.activeMatterEvidenceUrl = undefined;
            updated.canonicalIngredientId = matched.id;
            updated.identityType = matched.identityType;
            updated.category = matched.category;
            updated.role = matched.category || matched.function || getAuditedIngredientCategory(matched.name);
            updated.function = matched.function;
            // Retain user's entered price without overwriting from library
            updated.costPerKg = ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null;
            if (matched.hlb !== null && matched.hlb !== undefined) {
              updated.hlb = matched.hlb;
              updated.hlbValue = matched.hlb;
            }
            updated.casNumber = matched.casNumber;
            updated.inciName = matched.inciName;
            updated.phMin = matched.phMin;
            updated.phMax = matched.phMax;
          } else {
            const autoCat = getAuditedIngredientCategory(val);
            const hasUserEnteredActiveMatter = ing.activeMatterInputSource === 'USER_ENTERED';
            updated.canonicalIngredientId = undefined;
            updated.identityType = undefined;
            updated.casNumber = undefined;
            updated.inciName = undefined;
            updated.activeMatterPct = hasUserEnteredActiveMatter ? ing.activeMatterPct : undefined;
            updated.activeMatterInputSource = hasUserEnteredActiveMatter ? 'USER_ENTERED' : 'UNKNOWN';
            updated.activeMatterEvidenceId = undefined;
            updated.activeMatterEvidenceUrl = undefined;
            updated.role = autoCat;
            // Retain user-entered price
            updated.costPerKg = ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null;
          }
        }
        if (field === 'activeMatterPct' || field === 'activePercent' || field === 'activeMatterPurity') {
          updated.activeMatterInputSource = 'USER_ENTERED';
          updated.activeMatterEvidenceId = undefined;
          updated.activeMatterEvidenceUrl = undefined;
        }
        return updated;
      })
    );
  };

  // Auto-Balance Water to exactly 100% (For Liquid Formulations ONLY)
  const handleAutoBalanceWater = () => {
    if (isPowder) {
      handleVerifyPowderBalance();
      return;
    }

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
        costPerKg: null
      });
    }

    setIngredients(list);
  };

  // Verify Powder Mass Balance (Strictly NO auto-water addition)
  const handleVerifyPowderBalance = () => {
    const sum = ingredients.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    if (Math.abs(sum - 100) < 0.01) {
      setPowderBalanceToast("✓ 100.00% Stoichiometric Mass Balance: All solid builders, surfactants, and fillers sum to exact 100.00% batch.");
    } else if (sum < 100) {
      const missing = (100 - sum).toFixed(2);
      setPowderBalanceToast(`⚠️ Incomplete Powder Formula: Current sum is ${sum.toFixed(2)}% (Missing ${missing} percentage points). Balance with inorganic builders (Soda Ash, Zeolite 4A) or functional bulking salts (Sodium Sulfate) — do NOT add water.`);
    } else {
      const excess = (sum - 100).toFixed(2);
      setPowderBalanceToast(`⚠️ Excess Powder Formula: Current sum is ${sum.toFixed(2)}% (Exceeds 100% by ${excess}%). Re-scale solid ingredients.`);
    }
    setTimeout(() => setPowderBalanceToast(null), 8000);
  };

  // Authoritative Cost Calculation Report (User-Controlled Pricing) - Immediate Live Reaction
  const formulaCost: FormulaCostReport = useMemo(() => {
    return calculateFormulaCost(ingredients, batchSizeKg);
  }, [ingredients, batchSizeKg]);

  // Commercial Margin Projections (Driven strictly by user raw-material cost) - Immediate Live Reaction
  const marginChain = useMemo(() => {
    return calculateCommercialMarginChain(ingredients, batchSizeKg, 12, 15);
  }, [ingredients, batchSizeKg]);

  // Live Totals Calculations (Decoupled, strictly reflecting immediate live editing inputs)
  const totals = useMemo(() => {
    const totalRaw = ingredients.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0);
    const rawSurfactants = calculateRawSurfactants(ingredients);
    const activeSurfactants = calculateActiveSurfactants(ingredients);

    // Water % calculation: strictly 0 for powder unless user explicitly added water
    const waterIng = ingredients.find(
      (i) => (i.name || "").toLowerCase().includes("water") || (i.name || "").toLowerCase().includes("aqua")
    );
    const waterPct = isPowder
      ? (waterIng ? Number(waterIng.percentage) || 0 : 0)
      : (waterIng ? Number(waterIng.percentage) || 0 : Math.max(0, 100 - totalRaw));

    return {
      totalRaw: Number(totalRaw.toFixed(2)),
      rawSurfactants: Number(rawSurfactants.toFixed(2)),
      activeSurfactants: Number(activeSurfactants.toFixed(2)),
      waterPct: Number(waterPct.toFixed(2)),
      missingPct: Math.max(0, Number((100 - totalRaw).toFixed(2))),
      costPerKg: formulaCost.costPerKg,
      totalBatchCost: formulaCost.totalBatchCost,
      isBalanced: Math.abs(totalRaw - 100) < 0.05
    };
  }, [ingredients, formulaCost, isPowder]);

  // Context payload prepared for Gemini Chemistry Assistant
  const formulaChatContext: FormulaChatContext = useMemo(() => {
    const warningsList: string[] = [];
    if (forensicAuditReport?.discrepancies) {
      warningsList.push(...forensicAuditReport.discrepancies);
    }
    if (scientificResults?.verdictReasons) {
      warningsList.push(...scientificResults.verdictReasons);
    }

    return {
      formulaName,
      productCategory,
      productType: productCategory,
      batchSizeKg,
      waterHardnessPpm,
      ingredients: ingredients.map((i) => ({
        name: i.name,
        percentage: Number(i.percentage) || 0,
        activeMatterPct: i.activeMatterPct,
        role: i.role,
        costPerKg: i.costPerKg
      })),
      properties: {
        pH: scientificResults?.pH,
        viscosity: scientificResults?.viscosity,
        activeMatter: scientificResults?.activeSurfactants,
        calculatedHlb: scientificResults?.hlb
      },
      warnings: warningsList,
      verdictReasons: scientificResults?.verdictReasons,
      specVerdict: scientificResults?.specVerdict,
      screeningStatus: scientificResults?.screeningStatus,
      fingerprint: currentFingerprint
    };
  }, [
    formulaName,
    productCategory,
    batchSizeKg,
    waterHardnessPpm,
    ingredients,
    scientificResults,
    forensicAuditReport,
    currentFingerprint
  ]);

  // Execute Check Formula Action (Explicitly triggers genuine staged scientific execution pipeline)
  const handleCheckFormula = async () => {
    if (isAnalyzing) return; // Prevent duplicate concurrent submissions

    // Cancel any previous in-flight workflow
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const analysisToken = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    activeAnalysisIdRef.current = analysisToken;

    setIsAnalyzing(true);
    setAnalysisError(null);

    const snapshot: FormulaAnalysisSnapshot = {
      formulaName,
      productCategory,
      batchSizeKg,
      waterHardnessPpm,
      ingredients: ingredients.map((ing) => ({ ...ing })),
      powderLabInputs: { ...powderLabInputs },
      activeFormulaVersion: (activeFormula as any)?.version || '1.0.0'
    };

    try {
      const result = await executeStagedScientificAnalysis({
        snapshot,
        currentLiveFingerprint: currentFingerprint,
        onProgress: (prog) => {
          if (activeAnalysisIdRef.current === analysisToken && !controller.signal.aborted) {
            setWorkflowProgress(prog);
          }
        },
        abortSignal: controller.signal
      });

      // Ignore if superseded by a newer run or aborted
      if (activeAnalysisIdRef.current !== analysisToken || controller.signal.aborted) {
        return;
      }

      setWorkflowProgress({
        analysisId: result.analysisId,
        status: result.status,
        currentStageId: null,
        completedStageCount: result.stages.filter(s => s.status === 'COMPLETED' || s.status === 'COMPLETED_WITH_WARNINGS').length,
        totalStageCount: result.stages.length,
        stages: result.stages,
        intermediateResults: result.intermediateResults,
        forensicAuditReport: result.forensicAuditReport,
        error: result.error
      });

      setForensicAuditReport(result.forensicAuditReport);

      if (result.status === 'FAILED') {
        setAnalysisError(result.error || 'Scientific analysis validation failure.');
      } else if (result.deepAnalysisState) {
        setDeepAnalysisState(result.deepAnalysisState);
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
            targetPH: result.deepAnalysisState.scientificResults.pH,
            ingredients: ingredients.map((ing, idx) => ({
              ...ing,
              id: ing.id || `ing-${idx}`,
              percentage: Number(ing.percentage) || 0,
              percent: Number(ing.percentage) || 0,
              activeMatterPct: Number(ing.activeMatterPct) || 100,
              costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null
            }))
          };
          onFormulaGenerated(activeObj);
        }
      }
    } catch (err: any) {
      if (activeAnalysisIdRef.current === analysisToken && !controller.signal.aborted) {
        setAnalysisError(err?.message || 'Unexpected analysis execution error.');
      }
    } finally {
      if (activeAnalysisIdRef.current === analysisToken) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    if (workflowProgress) {
      setWorkflowProgress({
        ...workflowProgress,
        status: 'CANCELLED',
        currentStageId: null
      });
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
        costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null,
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
          costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null
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
                {normalizeProductCategory(productCategory) === 'UNKNOWN_PRODUCT_CATEGORY' && (
                  <option value="UNKNOWN_PRODUCT_CATEGORY" className="bg-[#0e1629] text-amber-400 font-bold">
                    UNKNOWN — SELECT A PRODUCT CATEGORY
                  </option>
                )}
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0e1629] text-white">
                    {cat.label}
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
            <input
              type="number"
              min="1"
              value={batchSizeKg}
              onChange={(e) => setBatchSizeKg(Math.max(1, Number(e.target.value) || 100))}
              className="w-full bg-[#0e1629] border border-slate-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white font-mono font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>

          {/* C. Water Hardness (ppm) */}
          <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3 space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Water Hardness (ppm)
            </label>
            <input
              type="number"
              min="0"
              value={waterHardnessPpm}
              onChange={(e) => setWaterHardnessPpm(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-[#0e1629] border border-slate-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white font-mono font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 2 — CONFIGURE INGREDIENTS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Configure Ingredients & Dosage
            </h3>
            {!isPowder && (
              <button
                onClick={handleAutoBalanceWater}
                className="px-3 py-1 text-[11px] font-extrabold text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition active:scale-95 cursor-pointer shadow-xs"
                title="Automatically calculate remaining solvent percentage to reach 100.00% exact balance."
              >
                Auto-Balance Water (100%)
              </button>
            )}
            {isPowder && (
              <button
                onClick={handleVerifyPowderBalance}
                className="px-3 py-1 text-[11px] font-extrabold text-amber-400 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-lg transition active:scale-95 cursor-pointer shadow-xs"
                title="Strict stoichiometry verification for solid formulations (Should sum to exact 100.00%)"
              >
                Verify 100% Mass Balance
              </button>
            )}
          </div>

          {powderBalanceToast && (
            <div className={`p-3 rounded-xl border text-xs font-medium animate-pulse ${
              powderBalanceToast.includes("✓") 
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-amber-950/80 border-amber-500/50 text-amber-300"
            }`}>
              {powderBalanceToast}
            </div>
          )}

          {/* Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#11192e] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                  <th className="py-3 px-3 sm:px-4">#</th>
                  <th className="py-3 px-3 sm:px-4">Ingredient Name / Select from Database</th>
                  <th className="py-3 px-3 sm:px-4">Category / Function</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Raw Formula %</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Active %</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Batch Qty</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Cost / kg (₹)</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Cost</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-[#0e1629]/50">
                {ingredients.map((ing, idx) => {
                  const rawPct = Number(ing.percentage) || 0;
                  const calculatedWeight = ((rawPct / 100) * batchSizeKg).toFixed(3);
                  const ingId = ing.id || `ing-${idx}`;
                  const roleStr = ing.role || getAuditedIngredientCategory(ing.name || "");
                  const hasCost = typeof ing.costPerKg === 'number' && !isNaN(ing.costPerKg) && ing.costPerKg >= 0;
                  const costNum = hasCost ? Number(ing.costPerKg) : null;
                  const itemCost = hasCost ? ((rawPct / 100) * batchSizeKg * (costNum as number)).toFixed(2) : null;

                  return (
                    <tr key={ingId} className="hover:bg-[#11192e]/40 transition-colors">
                      {/* # Index */}
                      <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-slate-500 text-xs">
                        {idx + 1}
                      </td>

                      {/* Chemical Name & Picker */}
                      <td className="py-2.5 px-3 sm:px-4 min-w-[200px]">
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={ing.name || ""}
                            onChange={(e) => handleUpdateIngredient(ingId, "name", e.target.value)}
                            placeholder="Select or enter chemical name..."
                            className="w-full bg-[#131d35] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white font-bold placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition"
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
                            value={ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? ing.costPerKg : ""}
                            placeholder="Unset"
                            onChange={(e) => handleUpdateIngredient(ingId, "costPerKg", e.target.value === "" ? null : Number(e.target.value))}
                            className="w-20 bg-[#131d35] border border-slate-700 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-mono text-right text-emerald-400 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none font-bold"
                            title="User-controlled raw material cost per kg"
                          />
                        </div>
                      </td>

                      {/* Calculated Ingredient Cost (₹) */}
                      <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-xs sm:text-sm min-w-[100px]">
                        {hasCost ? (
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
              const hasCost = typeof ing.costPerKg === 'number' && !isNaN(ing.costPerKg) && ing.costPerKg >= 0;
              const costNum = hasCost ? Number(ing.costPerKg) : null;
              const itemCost = hasCost ? ((rawPct / 100) * batchSizeKg * (costNum as number)).toFixed(2) : null;

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
                        value={ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? ing.costPerKg : ""}
                        placeholder="Unset"
                        onChange={(e) => handleUpdateIngredient(ingId, "costPerKg", e.target.value === "" ? null : Number(e.target.value))}
                        className="w-full bg-[#0e1629] border border-slate-700 rounded px-1.5 py-1 font-mono font-bold text-emerald-400 text-xs mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Mobile Row Cost Summary */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-400">
                    <span className="text-[10px]">Ingredient Cost:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {hasCost ? `₹${itemCost}` : "Price unconfigured"}
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
        <CostingProjectionsPanel
          formulaCost={formulaCost}
          batchSizeKg={batchSizeKg}
          marginChain={marginChain}
        />

        {/* ERROR DISPLAY */}
        {analysisError && (
          <div className="bg-rose-950/80 border border-rose-500/60 rounded-xl p-3.5 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{analysisError}</span>
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STAGED ANALYSIS WORKFLOW CARD */}
        {(isAnalyzing || workflowProgress || forensicAuditReport) && (
          <StagedAnalysisWorkflowCard
            isAnalyzing={isAnalyzing}
            workflowProgress={workflowProgress}
            forensicReport={forensicAuditReport}
            currentLiveFingerprint={currentFingerprint}
            onCancelAnalysis={handleCancelAnalysis}
            onRetryAnalysis={handleCheckFormula}
            onConsultChemistryAI={() => handleOpenChemistryChat("Formula workflow audit me warnings ya check status aayi hai. Kripya is formula ke surfactant ratio, pH balance, aur viscosity ko analyze karke scientific solution batayein.")}
          />
        )}

        {/* PRIMARY ACTIONS: CHECK FORMULA & CONSULT CHEMISTRY AI */}
        <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleCheckFormula}
            disabled={isAnalyzing}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 border ${
              isAnalyzing
                ? 'bg-[#152445] text-cyan-300 border-cyan-500/40 cursor-not-allowed shadow-cyan-950/40'
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:bg-blue-800 text-white cursor-pointer border-cyan-400/30 shadow-cyan-950/60 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span>SCIENTIFIC ANALYSIS IN PROGRESS...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>CHECK FORMULA / ANALYZE</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenChemistryChat()}
            className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 border bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 hover:from-purple-600 hover:to-indigo-500 text-white cursor-pointer border-purple-400/40 shadow-purple-950/60 active:scale-[0.99]"
            title="Ask Gemini Chemistry Bot regarding formula problems, neutralization, viscosity, or cloudiness"
          >
            <Bot className="w-4 h-4 text-purple-200" />
            <span>CONSULT GEMINI CHEMISTRY BOT</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-purple-950 rounded border border-purple-400/40 text-purple-200">
              AI 3.8
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 4 — SCIENTIFIC & PERFORMANCE RESULTS */}
      {hasAnalyzed && (
        <div className="space-y-6">
          {isStale && (
            <div className="bg-amber-950/80 border border-amber-500/60 rounded-2xl p-4 sm:p-5 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs sm:text-sm text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <span>Formulation Inputs Modified — Scientific Results Stale</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-500/40">
                      STALE
                    </span>
                  </div>
                  <div className="text-xs text-amber-200/80 mt-1">
                    Live totals update immediately. Displayed scientific models reflect snapshot <span className="font-mono font-bold text-amber-300">{deepAnalysisState.fingerprint}</span>. Re-run Check Formula to update analysis for current inputs (<span className="font-mono font-bold text-amber-300">{currentFingerprint}</span>).
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckFormula}
                disabled={isAnalyzing}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition shadow-lg shrink-0 border flex items-center justify-center gap-1.5 ${
                  isAnalyzing
                    ? 'bg-amber-900/50 text-amber-300/50 border-amber-500/20 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/50 cursor-pointer border-amber-300/40 active:scale-95'
                }`}
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Re-run Check Formula</span>
              </button>
            </div>
          )}

          {isPowderCategory(deepAnalysisState.formulaSnapshot.productCategory) && powderReport ? (
            <PowderEngineDashboard
              report={powderReport}
              labInputs={powderLabInputs}
              onUpdateLabInputs={setPowderLabInputs}
              batchSizeKg={batchSizeKg}
            />
          ) : (
            <div className="space-y-6">
              <ScientificResultsPanel
                scientificResults={scientificResults}
                orchestratorResult={deepAnalysisState.orchestratorResult}
                productCategory={deepAnalysisState.formulaSnapshot.productCategory}
                batchSizeKg={deepAnalysisState.formulaSnapshot.batchSizeKg}
                waterHardnessPpm={deepAnalysisState.formulaSnapshot.waterHardnessPpm}
                totals={totals}
              />
              <FormulaVerdictPanel
                scientificResults={scientificResults}
                productCategory={deepAnalysisState.formulaSnapshot.productCategory}
                onConsultChemistryAI={() => handleOpenChemistryChat("Formula verdict status matrix me warnings / revision flags hain. Kripya is formula ke specific screening aur specification issues ko fix karne ke chemical adjustments batayein.")}
              />
            </div>
          )}
        </div>
      )}

      {/* PHASE 4: FORMULATION SPECIFICATION & EXPERT DECISION SYSTEM */}
      {hasAnalyzed && (
        <SpecificationDashboard
          formulaName={deepAnalysisState.formulaSnapshot.formulaName}
          formulaVersion="1.0"
          productCategory={deepAnalysisState.formulaSnapshot.productCategory}
          batchSizeKg={deepAnalysisState.formulaSnapshot.batchSizeKg}
          ingredients={deepAnalysisState.formulaSnapshot.ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            percentage: Number(ing.percentage) || 0,
            activeMatterPct: ing.activeMatterPct !== undefined ? Number(ing.activeMatterPct) : 100,
            costPerKg: ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)) ? Number(ing.costPerKg) : null,
            role: ing.role
          }))}
          powderReport={isPowderCategory(deepAnalysisState.formulaSnapshot.productCategory) ? powderReport : null}
          costReport={calculateFormulaCost(deepAnalysisState.formulaSnapshot.ingredients, deepAnalysisState.formulaSnapshot.batchSizeKg)}
          liquidResults={!isPowderCategory(deepAnalysisState.formulaSnapshot.productCategory) ? {
            pH: scientificResults.pH,
            activeSurfactants: calculateActiveSurfactants(deepAnalysisState.formulaSnapshot.ingredients),
            totalPercentage: deepAnalysisState.formulaSnapshot.ingredients.reduce((s, i) => s + (Number(i.percentage) || 0), 0),
            viscosity: scientificResults.viscosity,
            density: scientificResults.density?.densityGPerCm3,
            liquidNVR: scientificResults.nvrResult?.isComplete ? scientificResults.nvrResult?.nvrPercentage : undefined,
            liquidNVRComplete: scientificResults.nvrResult?.isComplete,
            nvrCoveragePct: scientificResults.nvrResult?.dataCompleteness,
            costPerKg: calculateFormulaCost(deepAnalysisState.formulaSnapshot.ingredients, deepAnalysisState.formulaSnapshot.batchSizeKg).costPerKg
          } : null}
        />
      )}

      {/* PHASE 9: CONSTRAINED FORMULATION OPTIMIZATION & ALTERNATIVE GENERATION */}
      {hasAnalyzed && (
        <FormulationOptimizationPanel
          currentIngredients={ingredients}
          productCategory={productCategory}
          batchSizeKg={batchSizeKg}
          waterHardnessPpm={waterHardnessPpm}
          currentCostPerKg={formulaCost.costPerKg}
          currentCpi={scientificResults.cleaning?.cpi}
          currentPH={scientificResults.pH}
          onApplyCandidateFormula={(newIngs, candName) => {
            setIngredients(newIngs.map((i, idx) => ({
              ...i,
              id: i.id || `opt-${idx}`,
              percentage: Number(i.percentage) || 0,
              costPerKg: i.costPerKg !== undefined && i.costPerKg !== null && !isNaN(Number(i.costPerKg)) ? Number(i.costPerKg) : undefined
            })));
            if (candName) {
              setFormulaName(candName);
            }
          }}
        />
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

      {/* GEMINI CLEANING CHEMISTRY CHATBOT MODAL */}
      <GeminiChemistryChatModal
        isOpen={showChemistryChat}
        onClose={() => setShowChemistryChat(false)}
        formulaContext={formulaChatContext}
        initialPrompt={chatInitialPrompt}
        lang={_lang}
      />
    </div>
  );
}

import React, { useState, useEffect, Component } from "react";
import {
  Sliders,
  AlertTriangle,
  Printer,
  Layers,
  Info,
  Sparkles,
  Trash2,
  Save,
  History,
  ShieldAlert,
  FileText,
  Download,
  Cpu
} from "lucide-react";
import { ScientificBadge } from "./scientific/ScientificComponents";
import { Chemical, Formulation, FormulationIngredient } from "../types";
import { CHEMICALS } from "../data/chemicals";
import { getAllUniversalIngredients } from "../data/universalIngredientLibrary";
import { normalizeProductCategory, ProductCategoryId } from "../domain/productTaxonomy";
import { apiFetch } from "../services/apiBase";
import {
  calculateFormulationEcoMetrics,
  calculateBlendedHLB,
  getIngredientEcoMetrics,
  getPreservativeWarning,
  getTargetPHRange,
  getAuditedIngredientCategory,
  calculateAlkaliConsumption,
  calculateComplexEcoScore,
  calculateShelfLife,
  calculateDetailedViscosity,
  calculateRawSurfactants,
  calculateActiveSurfactants,
  calculateBatchCost,
  calculateFormulationCompatibility,
  generateDynamicMixingInstructions,
  calculateCPI,
  evaluateFormulationGreenChelators,
  calculateLabHealthScore,
  generateFormulationWarnings,
  ActiveMatterEngine,
  FormulaScientificOrchestrator
} from "../utils/calculators";
import { HardnessResultOutput, CleaningResultOutput } from "../utils/orchestrator/types";
import { jsPDF } from "jspdf";
import { useSettingsStore } from "../stores/useSettingsStore";
import { isFeatureAllowed } from "../utils/featureGating";
import SubscriptionPaywallModal from "./SubscriptionPaywallModal";

// Modular sub-components
import { ActiveFingerprintCard } from "./analyzer/ActiveFingerprintCard";
import { EcoImpactAssessmentCard } from "./analyzer/EcoImpactAssessmentCard";
import { PerformanceMetricsFractionsCard } from "./analyzer/PerformanceMetricsFractionsCard";
import { CostingMarginsCard } from "./analyzer/CostingMarginsCard";
import { CompatibilityRiskCard } from "./analyzer/CompatibilityRiskCard";

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  ingredients: FormulationIngredient[];
  formulaName: string;
  productType: string;
  canonicalProductCategoryId?: ProductCategoryId | string;
  categoryId?: ProductCategoryId | string;
  grade: "Economy" | "Standard" | "Premium";
  targetCost: number;
  onApplyIngredients?: (updatedIngredients: FormulationIngredient[]) => void;
  waterHardnessPpm?: number;
  compatibilityScore?: number;
  formulationResult?: any;
}

interface SavedVersion {
  version: string;
  timestamp: string;
  ingredients: FormulationIngredient[];
  cost: number;
  activeMatter: number;
  hlb: number;
  healthScore: number;
  ecoScore: number;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error inside SmartFormulaAnalyzerPro:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl space-y-4 max-w-2xl mx-auto my-8 text-xs">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="text-red-500 animate-bounce" size={24} />
            <h3 className="text-base font-bold">Smart Diagnostics Engine Suspended</h3>
          </div>
          <p className="text-red-600 font-semibold leading-relaxed">
            An unexpected mathematical or rendering exception occurred in this diagnostic panel:
            <br />
            <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-[11px] block mt-2 text-red-800 border border-red-200">
              {this.state.error?.message || "Unknown error"}
            </span>
          </p>
          <div className="pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Reset & Retry Diagnostics
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const safeNumHelper = (val: any, digits: number = 1): string => {
  const num = Number(val);
  return isNaN(num) ? (0).toFixed(digits) : num.toFixed(digits);
};

// Exported helper functions
export const parsePHString = (phStr: string): number | null => {
  try {
    const cleaned = phStr.replace(/[^\d.\-]/g, "");
    if (cleaned.includes("-")) {
      const parts = cleaned.split("-");
      const low = parseFloat(parts[0]);
      const high = parseFloat(parts[1]);
      if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
    }
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
  } catch (e) {
    return null;
  }
};

export const runCompatibilityEngine = (analyzedIngs: any[], estpH: number) => {
  const res = calculateFormulationCompatibility(analyzedIngs, String(estpH));
  return res.alerts;
};

export const calculateFormulaHealthScore = (ph: number, analyzedIngs: any[], rawCost: number, target: number, biodegPct: number, compatibilityAlerts: any[]) => {
  let phScore = 20;
  if (ph < 6 || ph > 9.5) phScore = 10;
  if (ph < 4 || ph > 12) phScore = 0;

  let balScore = 20;
  const totalSurfactant = analyzedIngs.filter(i => i.role?.toLowerCase().includes("surfactant")).reduce((s, i) => s + i.percentage, 0);
  if (totalSurfactant > 30) balScore = 12;
  if (totalSurfactant < 3) balScore = 8;

  let costScore = 15;
  if (target > 0) {
    if (rawCost <= target) costScore = 15;
    else {
      const excessRatio = (rawCost - target) / target;
      costScore = Math.max(0, Math.round(15 * (1 - excessRatio)));
    }
  }

  let ecoScore = Math.round(20 * (biodegPct / 100));
  const hasPersistentPollutant = analyzedIngs.some(ing => {
    if (ing.percentage <= 0) return false;
    const metrics = getIngredientEcoMetrics(ing?.name || "");
    return metrics.biodegradabilityPct < 60 && !metrics.isMineralOrWater;
  });
  if (hasPersistentPollutant) {
    ecoScore = Math.min(ecoScore, 10);
  }

  let compScore = 15;
  const highSeverityAlerts = compatibilityAlerts.filter(a => a.severity === "High" || a.severity === "Critical").length;
  if (highSeverityAlerts > 0) compScore = 0;
  else if (compatibilityAlerts.length > 0) compScore = 7;

  let completenessScore = 10;
  let totalFields = 0;
  let missingFieldsSum = 0;
  analyzedIngs.forEach(ing => {
    if (ing.percentage > 0) {
      totalFields += 7;
      missingFieldsSum += ing.missingFields.length;
    }
  });
  if (totalFields > 0) {
    completenessScore = Math.round(10 * (1 - missingFieldsSum / totalFields));
  }

  const finalScore = phScore + balScore + costScore + ecoScore + compScore + completenessScore;

  return {
    finalScore,
    breakdown: {
      phScore,
      balScore,
      costScore,
      ecoScore,
      compScore,
      completenessScore
    }
  };
};

export const runRiskAnalysis = (ph: number, surfactantPct: number, analyzedIngs: any[], rawCost: number, target: number, preservativePct: number, productType?: string, formulaName?: string) => {
  const warnings: string[] = [];
  
  const targetRange = getTargetPHRange(productType || 'Dishwash Liquid', formulaName);
  const isDivergent = ph < targetRange.min - 0.3 || ph > targetRange.max + 0.3;
  if (isDivergent) {
    warnings.push(`Validation Warning: Estimated pH (${ph}) diverges from Target pH range (${targetRange.label}) by >0.3 units. Check neutralization ratios.`);
  }

  let preservativeWarning: string | null = null;
  for (const ing of analyzedIngs) {
    const warningObj = getPreservativeWarning(ing.name, ph);
    if (warningObj) {
      const msg = typeof warningObj === 'string' ? warningObj : warningObj.message;
      preservativeWarning = `Preservative mismatch: ${ing.name} is ${msg}`;
      break;
    }
  }
  if (preservativeWarning) {
    warnings.push(preservativeWarning);
  }

  if (ph < 6 || ph > 9) {
    warnings.push(`pH Level Alert (${ph}): Product pH is outside the ideal mild 6.0–9.0 household spectrum, causing potential skin irritation or material corrosion unless formatted for specific industrial purposes.`);
  }
  if (surfactantPct > 30) {
    warnings.push(`Extreme Surfactant Concentration (${safeNumHelper(surfactantPct, 1)}%): Exceeding 30% active surfactant raises severe skin dermatological irritation risks and formulation gelling dangers.`);
  }
  if (rawCost > target && target > 0) {
    warnings.push(`Cost Ceiling Overflow: Current formulation costs (₹${safeNumHelper(rawCost, 2)}/kg) exceed your target of ₹${safeNumHelper(target, 2)}/kg by ₹${safeNumHelper(rawCost - target, 2)}/kg. Swap high-cost elements.`);
  }
  const hasAdequateMitBit = analyzedIngs.some(ing => {
    const n = (ing?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (n.includes("mit") || n.includes("bit") || n.includes("phenoxyethanol") || n.includes("dmdm") || n.includes("isothiazolinone")) && ing.percentage >= 0.05;
  });

  if (preservativePct < 0.1 && !hasAdequateMitBit) {
    warnings.push(`Sub-optimal Preservative Level (${safeNumHelper(preservativePct, 2)}%): Having less than 0.1% preservative in water-rich formulations risks severe microbial/fungal contamination in storage.`);
  }
  const hasLabsa = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("labsa") && ing.percentage > 5);
  const hasEcoLabel = (formulaName || "").toLowerCase().includes("eco") || (productType || "").toLowerCase().includes("eco");
  if (hasLabsa && hasEcoLabel) {
    warnings.push(`Eco/Green Conflict: Sourcing LABSA (Linear Alkylbenzene Sulfonic Acid) in an 'Eco-friendly' branded formulation is a marketing/regulatory risk, as LABSA is fully petroleum-derived.`);
  }
  const hasSalt = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("salt") || (ing?.name || "").toLowerCase().includes("sodium chloride") && ing.percentage > 2.5);
  if (hasSalt) {
    warnings.push(`Viscosity Over-Salting Danger: Adding salt above 2.5% can cross the salt curve threshold, collapsing micellar networks and instantly thinning the detergent liquid.`);
  }
  return warnings;
};

export const calculateCosineSimilarity = (ingredients: FormulationIngredient[], otherFormula: Formulation, analysisResult: any, productType?: string) => {
  if (!analysisResult) return 0;
  
  const currentList = Array.isArray(ingredients) ? ingredients : [];
  const otherList = Array.isArray(otherFormula?.ingredients) ? otherFormula.ingredients : [];

  const currentNames = new Set(currentList.map(i => (i?.name || "").toLowerCase()));
  const otherNames = new Set(otherList.map(i => (i?.name || "").toLowerCase()));
  const intersection = new Set([...currentNames].filter(x => otherNames.has(x)));
  const union = new Set([...currentNames, ...otherNames]);
  const idSimilarity = union.size > 0 ? (intersection.size / union.size) : 0;

  let compDiff = 0;
  union.forEach(name => {
    const curPct = currentList.find(i => (i?.name || "").toLowerCase() === name)?.percentage || 0;
    const othPct = otherList.find(i => (i?.name || "").toLowerCase() === name)?.percentage || 0;
    compDiff += Math.abs(curPct - othPct);
  });
  const compositionSimilarity = Math.max(0, 1 - (compDiff / 200));

  const categorySimilarity = otherFormula.productType === productType ? 1 : 0.4;

  const finalSim = (idSimilarity * 0.33) + (compositionSimilarity * 0.33) + (categorySimilarity * 0.34);
  return Math.round(finalSim * 100);
};

export default function SmartFormulaAnalyzerPro(props: Props) {
  return (
    <ErrorBoundary>
      <SmartFormulaAnalyzerProInner {...props} />
    </ErrorBoundary>
  );
}

function SmartFormulaAnalyzerProInner({
  lang: _lang,
  translations: _translations,
  ingredients,
  formulaName,
  productType,
  canonicalProductCategoryId,
  categoryId,
  grade,
  targetCost,
  onApplyIngredients: _onApplyIngredients,
  waterHardnessPpm = 150,
  formulationResult: formulationResultProp
}: Props) {
  const formulationResult = formulationResultProp || { grade };
  const { profile } = useSettingsStore();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const safeNum = (val: any, digits: number = 1): string => {
    const num = Number(val);
    return isNaN(num) ? (0).toFixed(digits) : num.toFixed(digits);
  };

  // UI states
  const [overheadPct, setOverheadPct] = useState<number>(15);
  const [packagingCost, setPackagingCost] = useState<number>(5);
  const [explainModal, setExplainModal] = useState<{ isOpen: boolean; title: string; content: string; formulaUsed?: string; parameters?: string } | null>(null);
  
  // Phase 1J: AI Recommendation states
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Phase 2: Version Control states
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>(() => {
    const cached = localStorage.getItem(`analyzer_versions_${formulaName || "custom"}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [compareVersionA, setCompareVersionA] = useState<string>("current");
  const [compareVersionB, setCompareVersionB] = useState<string>("");
  const [showCompareSection, setShowCompareSection] = useState<boolean>(false);

  // Trigger auto-analysis live updates
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Synchronize and auto-run analysis live on ingredients/parameters change
  useEffect(() => {
    runScientificAnalysis();
  }, [ingredients, formulaName, productType, grade, targetCost, overheadPct, packagingCost]);

  // Persistent storage for versions
  useEffect(() => {
    localStorage.setItem(`analyzer_versions_${formulaName || "custom"}`, JSON.stringify(savedVersions));
  }, [savedVersions, formulaName]);

  // Core chemical matching using Universal Ingredient Library
  const findChemicalInDb = (ingName: string): Chemical | undefined => {
    if (!ingName) return undefined;
    const cleanName = (ingName || "").toLowerCase();
    const universal = getAllUniversalIngredients() as unknown as Chemical[];
    const univMatch = universal.find(c => 
      (c.commonName && (c.commonName || "").toLowerCase() === cleanName) ||
      (c.chemicalName && (c.chemicalName || "").toLowerCase() === cleanName) ||
      (c.inciName && (c.inciName || "").toLowerCase() === cleanName) ||
      (c.commonName && (c.commonName || "").toLowerCase().includes(cleanName)) ||
      (c.commonName && cleanName.includes((c.commonName || "").toLowerCase())) ||
      (c.tradeNames && c.tradeNames.some(t => t && ((t || "").toLowerCase() === cleanName || cleanName.includes((t || "").toLowerCase()))))
    );
    if (univMatch) return univMatch;

    return CHEMICALS.find(c => 
      (c.commonName && (c.commonName || "").toLowerCase() === cleanName) ||
      (c.chemicalName && (c.chemicalName || "").toLowerCase() === cleanName) ||
      (c.inciName && (c.inciName || "").toLowerCase() === cleanName) ||
      (c.commonName && (c.commonName || "").toLowerCase().includes(cleanName)) ||
      (c.commonName && cleanName.includes((c.commonName || "").toLowerCase())) ||
      (c.tradeNames && c.tradeNames.some(t => t && ((t || "").toLowerCase() === cleanName || cleanName.includes((t || "").toLowerCase()))))
    );
  };

  // Run scientific analysis (Phase 1)
  const runScientificAnalysis = () => {
    if (!ingredients || ingredients.length === 0) return;

    try {
      // 1. Map ingredients to physical encyclopedia data & find missing fields
      const analyzedIngredients = ingredients.map(ing => {
        if (!ing || !ing.name) {
          return {
            ...ing,
            name: ing?.name || "Unknown Component",
            dbMatched: false,
            casNumber: undefined,
            molecularWeight: undefined,
            density: undefined,
            pHContribution: undefined,
            biodegradabilityDesc: undefined,
            chargeType: "Neutral / Auxiliary",
            chemicalFamily: "Auxiliary Component",
            supplier: undefined,
            missingFields: ["Name"]
          };
        }
        const dbChem = findChemicalInDb(ing.name);
      
        const activeRes = ActiveMatterEngine.resolveIngredientActive(ing);
        const finalActiveMatterPct = activeRes.activeMatterPct;

        const missingFields: string[] = [];
        if (!ing.hlbValue && (!dbChem || !dbChem.physicalProperties?.viscosity)) {
          if (ing.role?.toLowerCase().includes("surfactant") && ing.hlbValue === undefined) {
            missingFields.push("HLB");
          }
        }
        if (!dbChem || !dbChem.physicalProperties?.density) missingFields.push("Density");
        if (finalActiveMatterPct === undefined || finalActiveMatterPct === null) missingFields.push("Active Matter");
        if (!dbChem || !dbChem.sustainability?.biodegradability) missingFields.push("OECD Biodegradability");
        if (!dbChem || !dbChem.suppliers || dbChem.suppliers.length === 0) missingFields.push("Supplier");
        if (!dbChem || !dbChem.casNumber) missingFields.push("CAS Number");
        if (!dbChem || !dbChem.molecularWeight) missingFields.push("Molecular Weight");

        const chargeType = dbChem 
          ? dbChem.category.toLowerCase().includes("anionic") ? "Anionic"
            : dbChem.category.toLowerCase().includes("cationic") ? "Cationic"
            : dbChem.category.toLowerCase().includes("amphoteric") || dbChem.category.toLowerCase().includes("betaine") ? "Amphoteric"
            : dbChem.category.toLowerCase().includes("non-ionic") || dbChem.category.toLowerCase().includes("nonionic") ? "Nonionic"
            : "Neutral / Auxiliary"
          : "Neutral / Auxiliary";

        const chemicalFamily = dbChem
          ? dbChem.category
          : ing.role || "Auxiliary Component";

        const fallbackHlb = dbChem?.hlb ? parseFloat(String(dbChem.hlb)) : undefined;
        const finalHlbValue = (ing.hlbValue !== undefined && ing.hlbValue !== null) ? ing.hlbValue : fallbackHlb;

        return {
          ...ing,
          dbMatched: !!dbChem,
          hlbValue: finalHlbValue,
          activeMatterPct: finalActiveMatterPct,
          casNumber: dbChem?.casNumber || undefined,
          molecularWeight: dbChem?.molecularWeight || undefined,
          density: dbChem?.physicalProperties?.density || undefined,
          pHContribution: dbChem?.physicalProperties?.pH || undefined,
          biodegradabilityDesc: dbChem?.sustainability?.biodegradability || undefined,
          chargeType,
          chemicalFamily,
          supplier: dbChem?.suppliers?.[0] || undefined,
          missingFields
        };
      });

      // Resolve authoritative category context
      const rawCategory =
        canonicalProductCategoryId ||
        categoryId ||
        (formulationResult as any)?.canonicalProductCategoryId ||
        (formulationResult as any)?.categoryId ||
        productType;
      const canonicalCategory = normalizeProductCategory(rawCategory);

      // Single Source of Truth: Authoritative Orchestrator Evaluation
      const orchestratorReport = FormulaScientificOrchestrator.evaluate({
        formulaName,
        formulaVersion: '1.0.0',
        productCategory: canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? canonicalCategory : rawCategory,
        ingredients: analyzedIngredients as any,
        batchSizeKg: 100,
        waterHardnessPpm,
        waterProfile: {
          hardnessPpm: waterHardnessPpm
        },
        costContext: {
          targetCostPerKg: targetCost
        }
      });

      const totalActiveMatter = orchestratorReport.activeMatterResult.totalActiveMatterPct;
      const estpH = orchestratorReport.pHResult.ph;
      const phPartialFlag = !orchestratorReport.pHResult.solverConverged;

      // HLB Blend
      const estHlb = calculateBlendedHLB(analyzedIngredients as any);

      // Category fractions
      let surfactantPct = 0;
      let builderPct = 0;
      let polymerPct = 0;
      let electrolytePct = 0;
      let phAdjusterPct = 0;
      let enzymePct = 0;
      let waterPct = 0;
      let additivePct = 0;
      
      let solventPct = 0;
      let preservativePct = 0;
      let fragrancePct = 0;

      const freePercentagesRes: any = calculateAlkaliConsumption(analyzedIngredients as any);
      const freePercentages = freePercentagesRes?.freePercentages || freePercentagesRes || {};

      analyzedIngredients.forEach(ing => {
        const name = (ing?.name || "").toLowerCase();
        const cleanName = name.replace(/[^a-z0-9]/g, '');
        const role = (ing.role || "").toLowerCase();
        
        if (name.includes("water") || name.includes("aqua") || name === "dm water" || role.includes("solvent carrier")) {
          // water
        } else if (role.includes("solvent") || name.includes("glycol") || name.includes("alcohol")) {
          solventPct += (ing.percentage ?? 0);
        } else if (
          role.includes("preservative") ||
          name.includes("formalin") ||
          name.includes("kathon") ||
          cleanName.includes("mit") ||
          cleanName.includes("bit") ||
          cleanName.includes("phenoxyethanol") ||
          cleanName.includes("dmdm")
        ) {
          preservativePct += ing.percentage || 0;
        } else if (role.includes("fragrance") || name.includes("perfume") || name.includes("essential oil")) {
          fragrancePct += (ing.percentage ?? 0);
        }

        const cat = getAuditedIngredientCategory(ing.name);
        const freePct = freePercentages[ing.name] !== undefined ? freePercentages[ing.name] : (ing.percentage ?? 0);

        if (cat.startsWith("Surfactants")) {
          surfactantPct += (ing.percentage ?? 0);
        } else if (cat === "Builders & Chelators") {
          if (freePercentages[ing.name] !== undefined) {
            builderPct += freePct;
            waterPct += ((ing.percentage ?? 0) - freePct);
          } else {
            builderPct += (ing.percentage ?? 0);
          }
        } else if (cat === "Polymers & Thickeners") {
          polymerPct += (ing.percentage ?? 0);
        } else if (cat === "Electrolytes & Viscosity Modifiers") {
          electrolytePct += (ing.percentage ?? 0);
        } else if (cat === "pH Adjusters") {
          phAdjusterPct += (ing.percentage ?? 0);
        } else if (cat === "Enzymes") {
          enzymePct += (ing.percentage ?? 0);
        } else if (cat === "Preservatives" || cat === "Colorants & Fragrance") {
          additivePct += (ing.percentage ?? 0);
        } else {
          waterPct += (ing.percentage ?? 0);
        }
      });

      if (preservativePct === 0) {
        analyzedIngredients.forEach(ing => {
          const name = (ing?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const role = (ing?.role || "").toLowerCase();
          if (
            role.includes("preservative") ||
            name.includes("mit") ||
            name.includes("bit") ||
            name.includes("phenoxyethanol") ||
            name.includes("dmdm") ||
            name.includes("formalin") ||
            name.includes("kathon") ||
            name.includes("benzoate")
          ) {
            preservativePct += ing.percentage || 0;
          }
        });
      }

      const rawSurfactantPct = calculateRawSurfactants(analyzedIngredients as any);
      const activeSurfactantPct = calculateActiveSurfactants(analyzedIngredients as any);

      const hardnessCalc = orchestratorReport.hardnessResult;
      const performanceResult = {
        ...orchestratorReport.cleaningResult,
        particulateDispersion: orchestratorReport.cleaningResult.particulateSoilRemoval,
        enzymaticPower: orchestratorReport.cleaningResult.enzymeBonus,
        hardWaterTolerance: orchestratorReport.hardnessResult.maxSupportedPpm
      };

      const { foamHeight, viscosity, cleaningPower, oilRemoval, hardWater, rinseability, safetyRating, shelfLife } = predictPerformanceHeuristics(
        analyzedIngredients,
        activeSurfactantPct,
        estpH,
        waterHardnessPpm,
        hardnessCalc,
        orchestratorReport.cleaningResult
      );

      const complexEcoResult = calculateComplexEcoScore(analyzedIngredients as any);
      const viscosityResult = calculateDetailedViscosity(analyzedIngredients as any, {
        productCategory: (productType || '').trim(),
        targetPH: estpH,
        temperatureC: 25
      });
      const shelfLifeResult = calculateShelfLife(analyzedIngredients as any);

      const ecoMetrics = calculateFormulationEcoMetrics(ingredients);
      const hasNonBiodegradableSurfactant = analyzedIngredients.some(ing => {
        const isSurfactant = ing.role?.toLowerCase().includes("surfactant") || 
                             ing.role?.toLowerCase().includes("detergent") || 
                             ing.hlbValue !== null;
        const metrics = getIngredientEcoMetrics(ing?.name || "");
        return isSurfactant && (ing.percentage ?? 0) > 0 && metrics.biodegradabilityPct < 60;
      });

      if (hasNonBiodegradableSurfactant) {
        ecoMetrics.biodegradabilityPct = Math.min(ecoMetrics.biodegradabilityPct, 40.0);
      }

      const hasMissingBiodeg = analyzedIngredients.some(ing => (ing.percentage ?? 0) > 0 && !ing.biodegradabilityDesc);
      const ecoScoreStatus = hasMissingBiodeg ? "Incomplete Data — Partial Estimate" : "Calculated";

      const plantPct = ecoMetrics.plantBasedPct;
      let carbonFootprint: "Low" | "Medium" | "High" = "Medium";
      if (plantPct > 70) carbonFootprint = "Low";
      else if (plantPct < 30) carbonFootprint = "High";

      const rawMaterialCost = calculateBatchCost(ingredients, 1);
      const manufacturingCost = rawMaterialCost * (1 + overheadPct / 100);
      const finalExFactoryCost = manufacturingCost + packagingCost;

      const suggestedDistributor = finalExFactoryCost * 1.15;
      const suggestedWholesale = finalExFactoryCost * 1.20;
      const suggestedRetail = finalExFactoryCost * 1.25;
      const suggestedMRP = suggestedRetail * 1.18;

      const compResult = calculateFormulationCompatibility(analyzedIngredients, String(estpH));
      const compatibilityAlerts = compResult.alerts;
      const mixingInstructions = generateDynamicMixingInstructions(analyzedIngredients);

      const cpiScore = calculateCPI(analyzedIngredients);
      const greenChelatorAnalysis = evaluateFormulationGreenChelators(analyzedIngredients);

      const healthScoreBreakdown = calculateLabHealthScore(analyzedIngredients as any);
      const aiGradeResult = orchestratorReport.aiGrade;
      const riskAnalysisWarnings = generateFormulationWarnings(analyzedIngredients as any);

      const fingerprint = generateFormulaFingerprint(productType, activeSurfactantPct, builderPct, ecoMetrics, finalExFactoryCost);

      setAnalysisResult({
        ingredients: analyzedIngredients,
        totalActiveMatter,
        estpH,
        phPartialFlag,
        estHlb,
        surfactantPct: rawSurfactantPct,
        rawSurfactantPct,
        activeSurfactantPct,
        builderPct,
        polymerPct,
        electrolytePct,
        phAdjusterPct,
        enzymePct,
        additivePct,
        solventPct,
        preservativePct,
        fragrancePct,
        waterPct,
        cpiScore,
        greenChelatorAnalysis,
        aiGradeResult,
        performance: { 
          foamHeight, 
          viscosity, 
          cleaningPower, 
          oilRemoval, 
          hardWater, 
          rinseability, 
          safetyRating, 
          shelfLife,
          viscosityResult,
          shelfLifeResult,
          performanceResult,
          hardnessCalc
        },
        ecoMetrics,
        complexEcoResult,
        ecoScoreStatus,
        carbonFootprint,
        costing: {
          rawMaterialCost,
          manufacturingCost,
          finalExFactoryCost,
          suggestedDistributor,
          suggestedWholesale,
          suggestedRetail,
          suggestedMRP
        },
        compatibilityScore: compResult.compatibilityScore,
        compatibilityAlerts,
        mixingInstructions,
        healthScoreBreakdown,
        riskAnalysisWarnings,
        fingerprint,
        orchestratorReport
      });
    } catch (error) {
      console.error("Critical error inside runScientificAnalysis:", error);
    }
  };

  // Heuristic rule-based predictions consuming canonical orchestrator outputs
  const predictPerformanceHeuristics = (
    analyzedIngs: any[],
    activeSurfactantPct: number,
    ph: number,
    _curHardnessPpm: number,
    canonicalHardness?: HardnessResultOutput,
    canonicalCleaning?: CleaningResultOutput
  ) => {
    let foamHeight: "High" | "Medium" | "Low" | "Zero" = "Medium";
    let viscosity: "High" | "Medium" | "Low" = "Medium";
    let cleaningPower: "Outstanding" | "High" | "Medium" | "Low" | "N/A" = "Medium";
    let oilRemoval: "Outstanding" | "High" | "Medium" | "Low" = "Medium";
    let hardWater: "Excellent" | "Good" | "Adequate" | "Poor" | "INSUFFICIENT_DATA" | string = "Adequate";
    let rinseability: "Excellent" | "Good" | "Medium" | "Difficult" = "Good";
    let safetyRating: "Excellent (Skin-Mild)" | "Standard (Wear Gloves)" | "Industrial Corrosive" = "Standard (Wear Gloves)";
    let shelfLife = "24 Months";

    const hasSles = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("sles") && ing.percentage > 2);
    const hasLabsa = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("labsa") && ing.percentage > 2);
    const hasDefoamer = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("silicone") || (ing?.name || "").toLowerCase().includes("antifoam") || (ing?.name || "").toLowerCase().includes("defoamer"));
    const hasNonionic = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("ethoxylate") || (ing?.name || "").toLowerCase().includes("lae") || (ing?.name || "").toLowerCase().includes("glucoside"));
    const hasPreservative = analyzedIngs.some(ing => (ing?.name || "").toLowerCase().includes("formalin") || (ing?.name || "").toLowerCase().includes("kathon") || (ing?.name || "").toLowerCase().includes("preservative"));

    if (hasDefoamer) foamHeight = "Zero";
    else if ((hasSles || hasLabsa) && activeSurfactantPct > 10) foamHeight = "High";
    else if (activeSurfactantPct < 4) foamHeight = "Low";

    const vReport = calculateDetailedViscosity(analyzedIngs, { targetPH: ph, temperatureC: 25 });
    if (vReport.rating === "Rich Gel" || vReport.rating === "High Viscosity Paste" || vReport.rating === "Standard Liquid Detergent") {
      viscosity = "High";
    } else if (vReport.rating === "Medium") {
      viscosity = "Medium";
    } else {
      viscosity = "Low";
    }

    // Authoritative Hard Water Tolerance from Canonical Orchestrator Result
    const hardness = canonicalHardness;
    hardWater = (typeof hardness === 'object' && hardness !== null)
      ? (hardness.sufficiency ? String(hardness.sufficiency).toUpperCase() : (hardness.status ? String(hardness.status) : (hardness.maxSupportedPpm !== undefined ? `${hardness.maxSupportedPpm} ppm` : "INSUFFICIENT_DATA")))
      : "INSUFFICIENT_DATA";

    // Authoritative Cleaning Performance from Canonical Orchestrator Result
    const perf = canonicalCleaning;
    if (!perf || perf.cleaningScore === null || !perf.isCleaningApplicable) {
      cleaningPower = perf?.cleaningPower && perf.cleaningPower !== 'Conditioning / Non-Detergent' ? (perf.cleaningPower as any) : "N/A";
    } else {
      const perfScore = perf.cleaningScore ?? perf.overallScore;
      if (perfScore >= 90) cleaningPower = "Outstanding";
      else if (perfScore >= 75) cleaningPower = "High";
      else if (perfScore >= 60) cleaningPower = "Medium";
      else cleaningPower = "Low";
    }

    if (hasNonionic && !hasSles) rinseability = "Excellent";
    else if (hasSles && activeSurfactantPct > 15 && !hasDefoamer) rinseability = "Difficult";

    if (ph >= 6.5 && ph <= 8.5 && activeSurfactantPct < 15 && !hasLabsa) {
      safetyRating = "Excellent (Skin-Mild)";
    } else if (ph > 11 || ph < 4) {
      safetyRating = "Industrial Corrosive";
    }

    if (!hasPreservative) shelfLife = "3 Months (Risk of bacterial spoilage)";

    return { foamHeight, viscosity, cleaningPower, oilRemoval, hardWater, rinseability, safetyRating, shelfLife };
  };

  const generateFormulaFingerprint = (type: string, surfPct: number, _builderPct: number, eco: any, cost: number) => {
    let formulaType = "Surfactant-Rich Cleanser";
    if (surfPct < 3) formulaType = "Mineral / Builder Blend";
    else if (surfPct > 20) formulaType = "High-Active Concentrate Emulsion";

    const safeIngs = Array.isArray(ingredients) ? ingredients : [];

    let surfactantSystem = "Anionic Base";
    const hasAmphoteric = surfPct > 0 && safeIngs.some(i => (i?.name || "").toLowerCase().includes("capb"));
    const hasNonionic = surfPct > 0 && safeIngs.some(i => (i?.name || "").toLowerCase().includes("glucoside") || (i?.name || "").toLowerCase().includes("ethoxylate"));
    if (hasAmphoteric && hasNonionic) surfactantSystem = "Triple Synergy (Anionic + Amphoteric + Nonionic)";
    else if (hasAmphoteric) surfactantSystem = "Mild Blend (Anionic + Amphoteric)";

    let builderSystem = "Mineral Builders";
    const hasOrganicChelator = safeIngs.some(i => (i?.name || "").toLowerCase().includes("gluconate") || (i?.name || "").toLowerCase().includes("citrate") || (i?.name || "").toLowerCase().includes("glda"));
    if (hasOrganicChelator) builderSystem = "Eco Organic Chelation";

    let ecoLevel = "Standard Chemical";
    const hasNonBiodegradableSurfactant = safeIngs.some(ing => {
      const isSurfactant = (ing?.role || "").toLowerCase().includes("surfactant") || 
                           (ing?.role || "").toLowerCase().includes("detergent") || 
                           (ing?.hlbValue !== undefined && ing?.hlbValue !== null);
      const metrics = getIngredientEcoMetrics(ing?.name || "");
      return isSurfactant && (ing?.percentage || 0) > 0 && metrics.biodegradabilityPct < 60;
    });

    const activeSurfactants = safeIngs.filter(ing => {
      const isSurfactant = (ing?.role || "").toLowerCase().includes("surfactant") || 
                           (ing?.role || "").toLowerCase().includes("detergent") || 
                           (ing?.hlbValue !== undefined && ing?.hlbValue !== null);
      return isSurfactant && (ing?.percentage || 0) > 0;
    });

    const allSurfactantsPlantBasedAndBiodegradable = activeSurfactants.length > 0 && activeSurfactants.every(ing => {
      const metrics = getIngredientEcoMetrics(ing?.name || "");
      return metrics.plantBasedPct >= 80 && metrics.biodegradabilityPct >= 90;
    });

    const hasPersistentPollutant = safeIngs.some(ing => {
      if ((ing?.percentage || 0) <= 0) return false;
      const metrics = getIngredientEcoMetrics(ing?.name || "");
      return metrics.biodegradabilityPct < 60 && !metrics.isMineralOrWater;
    });

    if (hasPersistentPollutant) {
      ecoLevel = "Restricted / High Concern";
    } else if (hasNonBiodegradableSurfactant) {
      ecoLevel = "Restricted / High Concern";
    } else if (allSurfactantsPlantBasedAndBiodegradable) {
      ecoLevel = "Eco-Premium / Safe";
    } else if (eco.biodegradabilityPct > 90 && eco.plantBasedPct > 60) {
      ecoLevel = "Eco-Premium / Bio-Based";
    } else if (eco.biodegradabilityPct > 80) {
      ecoLevel = "Readily Biodegradable";
    }

    let commercialTier: "Budget" | "Mid-Tier" | "Premium" | "Industrial / Export" = "Mid-Tier";
    if (cost < 50) commercialTier = "Budget";
    else if (cost > 100 && eco.biodegradabilityPct > 85) commercialTier = "Premium";
    else if (type.toLowerCase().includes("industrial") || type.toLowerCase().includes("heavy")) commercialTier = "Industrial / Export";

    return { formulaType, surfactantSystem, builderSystem, ecoLevel, commercialTier };
  };

  const handleExplainClick = (field: string) => {
    try {
      let title = "";
      let content = "";
      let formulaUsed = "";
      let parameters = "";

      if (field === "activeMatter") {
        title = "Total Active Matter Calculation";
        content = "Active Matter measures the active cleansing concentration of surfactants in your formula. High concentrations provide heavy cleansing power, while lower values are typical of economy/budget formulations.";
        formulaUsed = "Total Active Matter = Σ (Ingredient % × Purity %)";
        parameters = ingredients
          .filter(i => (i.activeMatterPct || 0) > 0)
          .map(i => `• ${i.name || "Unknown component"}: ${i.percentage}% × ${i.activeMatterPct}% Purity = ${safeNum(((i.percentage || 0) * (i.activeMatterPct || 0)) / 100, 2)}% active matter`)
          .join("\n");
      } else if (field === "pH") {
        title = "Calculated pH (Advanced pHEngine)";
        content = "Calculates formulation pH using charge balance equilibrium, stoichiometry, and activity coefficients for strong acids/bases, citrate buffers, carbonates, silicates, and weak organic bases.";
        formulaUsed = "Newton-Raphson Charge Balance & Stoichiometric Neutralization Equilibrium Solver";
        parameters = ingredients
          .map(i => {
            const dbChem = findChemicalInDb(i.name);
            return { name: i.name || "Unknown component", pct: i.percentage, ph: dbChem?.physicalProperties?.pH || "Not Available" };
          })
          .filter(x => x.ph !== "Not Available")
          .map(x => `• ${x.name}: ${x.pct}% with physical pH ${x.ph}`)
          .join("\n");
      } else if (field === "hlb") {
        title = "Griffin HLB Blend Method";
        content = "Griffin's Method calculates the Hydrophilic-Lipophilic Balance of blended surfactants. Values 12-14 are optimal for O/W laundry detergents, 13-15 for dishwash, and <3 for antifoams.";
        formulaUsed = "HLB_blend = Σ (Surfactant % × Surfactant HLB) / Σ (Surfactant %)";
        parameters = ingredients
          .filter(i => i.hlbValue !== undefined && i.hlbValue !== null)
          .map(i => `• ${i.name || "Unknown component"}: ${i.percentage}% with HLB ${i.hlbValue}`)
          .join("\n");
      } else if (field === "eco") {
        title = "OECD 301 Biodegradability Estimations";
        content = "Measures the rate of biological decomposition of surfactants under organic aerobic conditions. Cites chemical databases with standard green ratings.";
        formulaUsed = "Eco Score = Σ (Ingredient % × OECD 301 Biodegradability %)";
        parameters = "Weighted average based on existing plant-based carbon proportions.";
      } else if (field === "classification") {
        title = "Formula Classification Diagnostics";
        content = "Classifies your formulation into a specific commercial category and formula type based on the ex-factory cost and the active surfactant system.";
        formulaUsed = `Commercial Tiers:\n• Budget: Cost < ₹50/kg\n• Mid-Tier: Cost between ₹50 and ₹100/kg\n• Premium: Cost > ₹100/kg with overall biodegradability > 85%\n• Industrial / Export: Product type includes "industrial" or "heavy"\n\nFormula Types:\n• Mineral / Builder Blend: Surfactants < 3%\n• Surfactant-Rich Cleanser: Surfactants 3% to 20%\n• High-Active Concentrate Emulsion: Surfactants > 20%`;
        if (analysisResult) {
          parameters = `• Ex-Factory Cost: ₹${safeNum(analysisResult?.costing?.finalExFactoryCost, 2)}/kg\n• Active Surfactants: ${safeNum(analysisResult?.surfactantPct, 1)}%\n• Overall Biodegradability: ${safeNum(analysisResult?.ecoMetrics?.biodegradabilityPct, 1)}%\n• Product Type Specified: ${productType}\n\nAssigned Fingerprint: ${analysisResult?.fingerprint?.commercialTier || "Unknown"} Tier - ${analysisResult?.fingerprint?.formulaType || "Unknown"}`;
        } else {
          parameters = "Please add ingredients to view active diagnostics.";
        }
      } else if (field === "fingerprintSurfactant") {
        title = "Surfactant Base & Synergy Diagnostics";
        content = "Analyzes the combined classes of surfactants used in the formulation. Synergistic blending of different charge groups reduces skin irritation, improves cleansing capability, and stabilizes micro-emulsions.";
        formulaUsed = "Classification Logic:\n• Triple Synergy: Contains Anionic + Amphoteric + Nonionic surfactants.\n• Mild Blend: Contains Anionic + Amphoteric surfactants.\n• Anionic Base: Only Anionic surfactants detected.";
        if (analysisResult) {
          const hasAmphoteric = analysisResult.surfactantPct > 0 && analysisResult.ingredients.some((i: any) => (i?.name || "").toLowerCase().includes("capb"));
          const hasNonionic = analysisResult.surfactantPct > 0 && analysisResult.ingredients.some((i: any) => (i?.name || "").toLowerCase().includes("glucoside") || (i?.name || "").toLowerCase().includes("ethoxylate"));
          
          const list: string[] = [];
          analysisResult.ingredients.forEach((i: any) => {
            const role = i.role || "";
            const isSurfactant = role.toLowerCase().includes("surfactant") || role.toLowerCase().includes("detergent") || (i.hlbValue !== undefined && i.hlbValue !== null);
            if (isSurfactant && (i.percentage || 0) > 0) {
              const charge = (i as any).chargeType || "Non-ionic/Unknown";
              list.push(`• ${i.name || "Unknown Component"} (${i.percentage}%): ${charge}`);
            }
          });

          parameters = `Detected Surfactants:\n${list.length > 0 ? list.join("\n") : "None detected"}\n\nAmphoteric presence: ${hasAmphoteric ? "Yes" : "No"}\nNonionic presence: ${hasNonionic ? "Yes" : "No"}\n\nAssigned Fingerprint: ${analysisResult.fingerprint?.surfactantSystem || "Unknown"}`;
        } else {
          parameters = "No analysis result available.";
        }
      } else if (field === "fingerprintBuilder") {
        title = "Builder Setup & Chelation Diagnostics";
        content = "Evaluates the chemical class and nature of the water-softening/sequestering builders present in your formulation.";
        formulaUsed = "Classification Logic:\n• Eco Organic Chelation: Triggered if biodegradable organic builders (e.g., Citrate/Citric Acid, Gluconate, GLDA, MGDA) are present in the formula.\n• Mineral Builders: Default classification for formulations using inorganic minerals (e.g., Soda Ash, Carbonate, Silicates, STPP, Zeolites).";
        if (analysisResult) {
          const buildersList: string[] = [];
          analysisResult.ingredients.forEach((i: any) => {
            const name = (i.name || "").toLowerCase();
            if ((i.percentage || 0) <= 0) return;
            const isOrganic = name.includes("gluconate") || name.includes("citrate") || name.includes("citric") || name.includes("glda") || name.includes("mgda") || name.includes("edta") || name.includes("nta");
            const isMineral = name.includes("soda ash") || name.includes("carbonate") || name.includes("silicate") || name.includes("stpp") || name.includes("zeolite");
            
            if (isOrganic) {
              const safetyType = (name.includes("edta") || name.includes("nta")) ? "Synthetic (Non-biodegradable / Persistent Pollutant)" : "Eco-friendly (Highly Biodegradable Organic)";
              buildersList.push(`• ${i.name || "Unknown component"} (${i.percentage}%): Organic — ${safetyType}`);
            } else if (isMineral) {
              buildersList.push(`• ${i.name || "Unknown component"} (${i.percentage}%): Inorganic / Mineral Builder`);
            }
          });
          
          parameters = `Builders & Chelators Detected:\n${buildersList.length > 0 ? buildersList.join("\n") : "None detected"}\n\nAssigned Fingerprint: ${analysisResult.fingerprint?.builderSystem || "Unknown"}`;
        } else {
          parameters = "No analysis result available.";
        }
      } else if (field === "fingerprintEco") {
        title = "Regulatory Eco-Label Diagnostics";
        content = "Audits the ingredients against strict environmental safety standards. Persistent organic pollutants or poorly biodegradable surfactants prevent formulas from qualifying for modern green-label or eco-premium certifications.";
        formulaUsed = "Classification Hierarchy:\n1. Restricted / High Concern: Triggered by any persistent pollutant (e.g. EDTA) or non-biodegradable surfactant (OECD 301 < 60%).\n2. Eco-Premium / Safe: All surfactants are plant-based (>= 80%) & readily biodegradable (>= 90%).\n3. Eco-Premium / Bio-Based: Overall biodegradability > 90% & plant-based carbon > 60%.\n4. Readily Biodegradable: Overall biodegradability > 80%.\n5. Standard Chemical: Fallback.";
        if (analysisResult) {
          const details: string[] = [];
          
          analysisResult.ingredients.forEach((ing: any) => {
            if ((ing.percentage || 0) <= 0) return;
            const metrics = getIngredientEcoMetrics(ing.name || "");
            const isSurfactant = ing.role?.toLowerCase().includes("surfactant") || 
                                 ing.role?.toLowerCase().includes("detergent") || 
                                 (ing.hlbValue !== undefined && ing.hlbValue !== null);
            
            if (metrics.biodegradabilityPct < 60 && !metrics.isMineralOrWater) {
              if (isSurfactant) {
                details.push(`• [RESTRICTION TRIGGER] ${ing.name || "Unknown component"} (${ing.percentage}%): Non-biodegradable surfactant (${metrics.biodegradabilityPct}% OECD 301 status).`);
              } else {
                details.push(`• [RESTRICTION TRIGGER] ${ing.name || "Unknown component"} (${ing.percentage}%): Persistent organic pollutant (${metrics.biodegradabilityPct}% biodegradability).`);
              }
            } else {
              details.push(`• ${ing.name || "Unknown component"} (${ing.percentage}%): Biodegradability: ${metrics.biodegradabilityPct}%, Plant-based: ${metrics.plantBasedPct}%`);
            }
          });

          parameters = `Ingredient Environmental Profiles:\n${details.length > 0 ? details.join("\n") : "No organic ingredients detected"}\n\nAssigned Fingerprint Eco Level: ${analysisResult.fingerprint?.ecoLevel || "Unknown"}`;
        } else {
          parameters = "No analysis result available.";
        }
      } else if (field === "fingerprintCarbon") {
        title = "Carbon Profile Diagnostics";
        content = "Estimates the carbon resource dependency based on the ratio of plant-based organic carbon vs. petroleum/fossil-derived active carbon.";
        formulaUsed = "Classification Limits:\n• Low Footprint: Overall Plant-Based Organic Carbon > 70%\n• Medium Footprint: Overall Plant-Based Organic Carbon 30% to 70%\n• High Footprint: Overall Plant-Based Organic Carbon < 30%";
        if (analysisResult) {
          const list: string[] = [];
          analysisResult.ingredients.forEach((i: any) => {
            if ((i.percentage || 0) <= 0) return;
            const metrics = getIngredientEcoMetrics(i.name || "");
            if (!metrics.isMineralOrWater) {
              list.push(`• ${i.name || "Unknown component"} (${i.percentage}%): ${metrics.plantBasedPct}% Plant-based / ${100 - metrics.plantBasedPct}% Fossil-derived`);
            }
          });
          parameters = `Active Resource Profiles:\n${list.length > 0 ? list.join("\n") : "No organic carbon ingredients present."}\n\nOverall Plant-Based Carbon: ${safeNum(analysisResult?.ecoMetrics?.plantBasedPct, 1)}%\nOverall Fossil/Petroleum Carbon: ${safeNum(100 - (analysisResult?.ecoMetrics?.plantBasedPct || 0), 1)}%\n\nAssigned Carbon Profile: ${analysisResult?.carbonFootprint || "Unknown"} Footprint`;
        } else {
          parameters = "No analysis result available.";
        }
      }

      setExplainModal({ isOpen: true, title, content, formulaUsed, parameters });
    } catch (e) {
      console.error("Exception in handleExplainClick fallback:", e);
      setExplainModal({
        isOpen: true,
        title: "Explanation & Diagnostics Error Boundary",
        content: "Detailed physical and chemical parameters for this tag are currently being computed. Please try again as more ingredients are formulated.",
        formulaUsed: "Automatic System Fallback",
        parameters: `Diagnostic details temporary locked. Error: ${e instanceof Error ? e.message : String(e)}`
      });
    }
  };

  const fetchAIRecommendations = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const response = await apiFetch("/api/ai/analyze-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formulaName,
          productType,
          grade,
          ingredients
        })
      });
      const data = await response.json();
      if (data.success && data.recommendations) {
        setAiRecommendations(data.recommendations);
      } else {
        throw new Error("Could not parse AI analysis payload.");
      }
    } catch (e: any) {
      setAiError("API error occurred. Simulated recommendations displayed below.");
      setAiRecommendations([
        {
          type: "Cost Reduction",
          recommendation: "Reduce SLES 70% from current percentage by 1.5% and substitute with CAPB (30%) to maintain luxurious foaming while dropping the ingredient raw materials cost by approx ₹1.85/kg.",
          trigger: "Raw material cost is above historical average with SLES contributing the highest expense.",
          suggestedIngredient: "CAPB (30%)"
        },
        {
          type: "Eco Optimization",
          recommendation: "Replace petroleum-based synthetic brighteners or hard-water mineral builders with readily biodegradable Sodium Gluconate to achieve an Eco-friendly label certification.",
          trigger: "Formulation contains non-biodegradable synthetic additives.",
          suggestedIngredient: "Sodium Gluconate"
        }
      ]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const saveCurrentVersion = () => {
    if (!analysisResult) return;
    const nextVer = `Version ${safeNum(savedVersions.length + 1, 1)}`;
    const newVer: SavedVersion = {
      version: nextVer,
      timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
      ingredients: JSON.parse(JSON.stringify(ingredients)),
      cost: analysisResult.costing.rawMaterialCost,
      activeMatter: analysisResult.totalActiveMatter,
      hlb: analysisResult.estHlb || 0,
      healthScore: analysisResult.healthScoreBreakdown.finalScore,
      ecoScore: analysisResult.ecoMetrics.biodegradabilityPct
    };
    const updated = [newVer, ...savedVersions];
    setSavedVersions(updated);
    alert(`Successfully backed up ${nextVer} in local lab history.`);
  };

  const triggerPdfExport = () => {
    if (!analysisResult) return;

    if (!isFeatureAllowed('hasPdfReports', profile.plan)) {
      setShowPaywall(true);
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, 220, 45, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SMART FORMULA ANALYZER PRO", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Chemical Laboratory Diagnostic R&D Report`, 14, 28);
      doc.text(`Formula Name: ${formulaName || "Custom Sandbox"} | Product: ${productType} | Grade: ${grade}`, 14, 35);
      
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()} | Lab Operator: salimbawa707@gmail.com`, 14, 41);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Formulation Diagnostics & Commercial Fingerprint", 14, 55);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Formula Screening Score: ${analysisResult.healthScoreBreakdown.finalScore}/100 (Calculated - Not Lab Validated)`, 14, 63);
      doc.text(`• Commercial Tier: ${analysisResult.fingerprint.commercialTier}`, 14, 69);
      doc.text(`• Surfactant System: ${analysisResult.fingerprint.surfactantSystem}`, 14, 75);
      doc.text(`• Builder System: ${analysisResult.fingerprint.builderSystem}`, 14, 81);
      doc.text(`• Eco/Carbon Level: ${analysisResult.fingerprint.ecoLevel} (Carbon: ${analysisResult.carbonFootprint})`, 14, 87);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("2. Scientific Calculations Summary", 14, 98);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Total Active Surfactant Matter: ${analysisResult.totalActiveMatter}%`, 14, 106);
      doc.text(`• Estimated pH: ${analysisResult.estpH} (Advanced pHEngine Solver)`, 14, 112);
      doc.text(`• Hydrophilic-Lipophilic Balance (Griffin HLB): ${analysisResult.estHlb !== null ? analysisResult.estHlb : "N/A"}`, 14, 118);
      doc.text(`• Biodegradability Score (OECD 301): ${analysisResult.ecoMetrics.biodegradabilityPct}%`, 14, 124);
      doc.text(`• Bio-Based Plant-Sourced Carbon: ${analysisResult.ecoMetrics.plantBasedPct}%`, 14, 130);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("3. Financial Analysis & Pricing Matrix", 14, 142);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Raw Material Cost/kg: INR ${safeNum(analysisResult?.costing?.rawMaterialCost, 2)}`, 14, 150);
      doc.text(`• Factory Overhead Cost/kg (${overheadPct}%): INR ${safeNum(analysisResult?.costing?.manufacturingCost, 2)}`, 14, 156);
      doc.text(`• Suggest Wholesale Price: INR ${safeNum(analysisResult?.costing?.suggestedWholesale, 2)}`, 14, 162);
      doc.text(`• Suggest Distributor Price: INR ${safeNum(analysisResult?.costing?.suggestedDistributor, 2)}`, 14, 168);
      doc.text(`• Suggest Retail Price: INR ${safeNum(analysisResult?.costing?.suggestedRetail, 2)}`, 14, 174);
      doc.text(`• Suggest MRP (incl. 18% GST): INR ${safeNum(analysisResult?.costing?.suggestedMRP, 2)}`, 14, 180);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("4. Formulation Pairwise Compatibility Alerts", 14, 192);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (analysisResult.compatibilityAlerts.length === 0) {
        doc.text("✓ Complete chemical compatibility verified. No warning flags raised.", 14, 200);
      } else {
        let y = 200;
        analysisResult.compatibilityAlerts.slice(0, 3).forEach((alert: any) => {
          doc.text(`[${alert.severity}] ${alert.description} - Reason: ${alert.reason.slice(0, 60)}...`, 14, y);
          y += 6;
        });
      }

      doc.setFillColor(243, 244, 246);
      doc.rect(0, 260, 220, 40, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("VALIDATED SCIENTIFIC LITERATURE REFERENCES:", 14, 268);
      doc.setFont("helvetica", "normal");
      doc.text("• Surfactant HLB Blend: Griffin W.C. Calculation Method (1949/1954). Journal of the Society of Cosmetic Chemists.", 14, 274);
      doc.text("• Biodegradability: OECD 301 Protocols for Aerobic Aqueous Chemical Decomposition Standard.", 14, 280);
      doc.text("Disclaimer: Reference pricing based on cost margins. Verify against local commercial regulations and competitor indexes.", 14, 286);

      doc.save(`LabReport_SmartAnalyzer_${formulaName || "Custom"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Fallback to raw data printed.");
    }
  };

  const triggerCsvExport = () => {
    if (!analysisResult) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ingredient,Percentage,Role,Active Purity,HLB,Cost per Kg,CAS Number\n";
    analysisResult.ingredients.forEach((ing: any) => {
      const pct = ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;
      csvContent += `"${ing.name}",${pct},"${ing.role}",${ing.activeMatterPct},${ing.hlbValue || "N/A"},${ing.costPerKg ?? ""},"${ing.casNumber || "N/A"}"\n`;
    });
    csvContent += `\nTotal Active Matter,${analysisResult.totalActiveMatter}%\n`;
    csvContent += `Est. pH,${analysisResult.estpH}\n`;
    csvContent += `Eco Score,${analysisResult.ecoMetrics.biodegradabilityPct}%\n`;
    csvContent += `Raw Material Cost,₹${safeNum(analysisResult?.costing?.rawMaterialCost, 2)}/kg\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Formula_Export_${formulaName || "Custom"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerJsonExport = () => {
    if (!analysisResult) return;
    const jsonStr = JSON.stringify({
      formulaName,
      productType,
      grade,
      ingredients,
      analysis: {
        totalActiveMatter: analysisResult.totalActiveMatter,
        estpH: analysisResult.estpH,
        estHlb: analysisResult.estHlb,
        fractions: {
          surfactants: analysisResult.surfactantPct,
          builders: analysisResult.builderPct,
          polymers: analysisResult.polymerPct,
          solvents: analysisResult.solventPct,
          preservatives: analysisResult.preservativePct,
          water: analysisResult.waterPct
        },
        eco: analysisResult.ecoMetrics,
        performance: analysisResult.performance,
        costs: analysisResult.costing,
        fingerprint: analysisResult.fingerprint
      }
    }, null, 2);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Formula_Analyzer_${formulaName || "Custom"}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl my-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <Sliders size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-100">NO FORMULA SELECTED</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
          Smart Formula Analyzer Pro requires an active formulation with ingredients to perform scientific diagnostics, cost auditing, HLB mapping, and compatibility checks.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-medium">
            0 Ingredients Selected
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-indigo-400 border border-slate-800 font-medium">
            Scientific Diagnostics Standby
          </span>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border">
        <Sparkles size={36} className="text-teal-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Loading Smart Analysis Engine...</p>
        <p className="text-xs text-gray-400 mt-1">Sourcing properties from chemical encyclopedia</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="smart-formula-analyzer-root">
      {/* HEADER COMMERCIAL FINGERPRINT & HEALTH BAR */}
      <ActiveFingerprintCard
        analysisResult={analysisResult}
        formulationResult={formulationResult}
        onExplainClick={handleExplainClick}
      />

      {/* KEY CALCULATED METRICS WITH SOURCE BADGES & CONFIDENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Surfactants */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Active Surfactants %</span>
            <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase">
              🔵 Calculated
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono">
              {safeNum(analysisResult?.activeSurfactantPct ?? calculateActiveSurfactants(analysisResult?.ingredients), 1)}%
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[9px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-md">
                Raw Surfactants: {safeNum(analysisResult?.rawSurfactantPct ?? calculateRawSurfactants(analysisResult?.ingredients), 1)}%
              </span>
              <button onClick={() => handleExplainClick("activeMatter")} className="text-teal-600 hover:text-teal-800">
                <Info size={12} />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            Total Active Matter: <span className="text-teal-700 font-bold">{safeNum(analysisResult?.totalActiveMatter, 1)}%</span>
          </div>
        </div>

        {/* pH */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">pH</span>
            <ScientificBadge maturity={analysisResult.phPartialFlag ? "ESTIMATED" : "MODEL_PREDICTION"} />
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono">
              {analysisResult.estpH}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[9px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-md">
                ✓ Weighted Neutralization
              </span>
              <button onClick={() => handleExplainClick("pH")} className="text-teal-600 hover:text-teal-800">
                <Info size={12} />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-medium truncate">
            {analysisResult.phPartialFlag ? "Partial pH data available" : "Full stoichiometry values."}
          </div>
        </div>

        {/* HLB */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Blend HLB (Griffin)</span>
            <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">
              🟡 Estimated
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono">
              {analysisResult.estHlb !== null ? analysisResult.estHlb : "N/A"}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[9px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-md">
                ✓ Griffin HLB Method
              </span>
              <button onClick={() => handleExplainClick("hlb")} className="text-teal-600 hover:text-teal-800">
                <Info size={12} />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            Confidence: <span className="text-amber-600 font-bold">Medium</span> — empirical surfactant ratio.
          </div>
        </div>

        {/* Eco Score */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Eco Score (Biodegradability)</span>
            <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">
              🟡 Estimated
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono">
              {safeNum(analysisResult?.complexEcoResult?.score, 1)} / 100
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md">
                🌱 OECD 301 Standards
              </span>
              <button onClick={() => handleExplainClick("eco")} className="text-teal-600 hover:text-teal-800">
                <Info size={12} />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            Confidence: <span className="text-amber-600 font-bold">Medium</span> — environmental model predictions.
          </div>
        </div>
      </div>

      {/* ECO IMPACT ASSESSMENT BREAKDOWN PANEL */}
      <EcoImpactAssessmentCard analysisResult={analysisResult} />

      {/* HEALTH SCORE BREAKDOWN */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} className="text-teal-600" /> Formula Screening Score Rubric (Calculated Result)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-gray-50 p-3 rounded-xl border text-center">
            <span className="text-[9px] text-gray-400 font-extrabold block uppercase">pH Stability (20)</span>
            <span className="text-base font-black text-gray-800 mt-1 block">{analysisResult.healthScoreBreakdown?.breakdown?.phScore}/20</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border text-center">
            <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Category Bal. (20)</span>
            <span className="text-base font-black text-gray-800 mt-1 block">{analysisResult.healthScoreBreakdown?.breakdown?.balScore}/20</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border text-center">
            <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Cost Eff. (15)</span>
            <span className="text-base font-black text-gray-800 mt-1 block">{analysisResult.healthScoreBreakdown?.breakdown?.costScore}/15</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border text-center">
            <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Eco Score (20)</span>
            <span className="text-base font-black text-gray-800 mt-1 block">{analysisResult.healthScoreBreakdown?.breakdown?.ecoScore}/20</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border text-center">
            <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Compatability (15)</span>
            <span className="text-base font-black text-gray-800 mt-1 block">{analysisResult.healthScoreBreakdown?.breakdown?.compScore}/15</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border text-center">
            <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Completeness (10)</span>
            <span className="text-base font-black text-gray-800 mt-1 block">{analysisResult.healthScoreBreakdown?.breakdown?.completenessScore}/10</span>
          </div>
        </div>
      </div>

      {/* MISSING DATA DETECTOR */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-amber-500" /> Ingredient Database Completeness & Missing Fields
        </h4>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase font-bold">
                <th className="pb-2">Ingredient</th>
                <th className="pb-2">CAS Number</th>
                <th className="pb-2">Density</th>
                <th className="pb-2">Active %</th>
                <th className="pb-2">HLB</th>
                <th className="pb-2">OECD 301 Status</th>
                <th className="pb-2">Molecular Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {analysisResult.ingredients.map((ing: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-bold text-gray-800">{ing.name}</td>
                  <td className="py-2.5 font-mono">{ing.casNumber || <span className="text-red-500 text-[10px] font-bold">Evidence Not Available</span>}</td>
                  <td className="py-2.5">{ing.density || <span className="text-red-500 text-[10px] font-bold">Evidence Not Available</span>}</td>
                  <td className="py-2.5">{ing.activeMatterPct !== undefined ? `${ing.activeMatterPct}%` : <span className="text-red-500 text-[10px] font-bold">Evidence Not Available</span>}</td>
                  <td className="py-2.5 font-mono">{ing.hlbValue !== null && ing.hlbValue !== undefined ? ing.hlbValue : "N/A"}</td>
                  <td className="py-2.5">{ing.biodegradabilityDesc || <span className="text-red-500 text-[10px] font-bold">Evidence Not Available</span>}</td>
                  <td className="py-2.5 font-mono">{ing.molecularWeight || <span className="text-red-500 text-[10px] font-bold">Evidence Not Available</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RULE-BASED PERFORMANCE PREDICTIONS & FRACTIONS */}
      <PerformanceMetricsFractionsCard analysisResult={analysisResult} />

      {/* COSTING & PRICING SHEET */}
      <CostingMarginsCard
        analysisResult={analysisResult}
        overheadPct={overheadPct}
        setOverheadPct={setOverheadPct}
        packagingCost={packagingCost}
        setPackagingCost={setPackagingCost}
      />

      {/* COMPATIBILITY ALERTS & RISK ANALYSIS */}
      <CompatibilityRiskCard analysisResult={analysisResult} />

      {/* DYNAMIC MANUFACTURING & MIXING SEQUENCE */}
      {analysisResult.mixingInstructions && analysisResult.mixingInstructions.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-[#0f766e]" /> Dynamic Manufacturing & Mixing Sequence (Ingredient-Aware Order)
          </h4>
          <div className="space-y-3">
            {analysisResult.mixingInstructions.map((step: any, idx: number) => (
              <div key={idx} className="p-3.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:bg-white hover:border-teal-200 hover:shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="bg-[#0f766e] text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {step.order}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-snug">{step.action}</p>
                    {step.safetyNote && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} className="shrink-0" /> {step.safetyNote}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600 shrink-0 font-medium bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 self-start md:self-auto">
                  <span className="bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded border border-teal-100">Time: {step.mixingTime}</span>
                  <span className="bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-100">Speed: {step.mixingSpeed}</span>
                  <span className="bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-100">Temp: {step.temperature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI RECOMMENDATION ENGINE */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-teal-600" /> Smart AI Formulation Optimizer (Online Assistant)
            </h4>
            <p className="text-[10px] text-gray-400 font-medium">Auto-scours molecular databases to suggest active swaps & cost reductions.</p>
          </div>
          <button
            onClick={fetchAIRecommendations}
            disabled={isLoadingAi}
            className="bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoadingAi ? (
              <>
                <Sparkles size={12} className="animate-spin" /> Analyzing Formula...
              </>
            ) : (
              <>
                <Cpu size={12} /> AI Recommendation (Online)
              </>
            )}
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 font-bold">
            {aiError}
          </p>
        )}

        {aiRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiRecommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-teal-50/40 p-4 rounded-xl border border-teal-100 space-y-2 text-xs relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-teal-100 text-teal-800 font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded">
                  {rec.type || "AI Swap"}
                </div>
                <span className="text-[10px] text-teal-600 font-bold block uppercase tracking-wider">Suggested: {rec.suggestedIngredient || "Active Switch"}</span>
                <p className="font-bold text-gray-900">{rec.recommendation}</p>
                <p className="text-[10px] text-gray-500 italic">Trigger: {rec.trigger}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-xs">
            No recommendations generated yet. Click "AI Recommendation (Online)" to analyze your ingredients profile.
          </div>
        )}
      </div>

      {/* VERSION CONTROL & BENCHMARK ENGINE */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} className="text-teal-600" /> Laboratory Formulation Version Control
            </h4>
            <p className="text-[10px] text-gray-400 font-medium">Backup chemistry formulations to compare cost, active matter, and eco scores.</p>
          </div>
          <button
            onClick={saveCurrentVersion}
            className="bg-teal-50 hover:bg-teal-100 text-[#0f766e] font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all border border-teal-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={12} /> Backup Version History
          </button>
        </div>

        {savedVersions.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
              {savedVersions.map((v, idx) => (
                <div key={idx} className="bg-gray-50 border p-2.5 rounded-xl text-left space-y-1 shrink-0 w-[160px]">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-800">{v.version}</span>
                    <span className="text-[8px] bg-gray-200 text-gray-600 font-bold px-1 rounded">{v.timestamp.split(" ")[0]}</span>
                  </div>
                  <p className="font-semibold text-[10px] text-gray-500">Cost: ₹{safeNum(v?.cost, 1)}/kg</p>
                  <p className="font-semibold text-[10px] text-gray-500">Active: {v.activeMatter}%</p>
                  <p className="font-semibold text-[10px] text-gray-500">Health: {v.healthScore}/100</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Compare Formulations Difference</span>
              <div className="flex items-center gap-3 text-xs">
                <select
                  value={compareVersionA}
                  onChange={(e) => setCompareVersionA(e.target.value)}
                  className="bg-white border rounded px-2 py-1"
                >
                  <option value="current">Current Active Draft</option>
                  {savedVersions.map(v => (
                    <option key={v.version} value={v.version}>{v.version}</option>
                  ))}
                </select>
                <span className="font-bold text-gray-400 uppercase text-[9px]">Vs</span>
                <select
                  value={compareVersionB}
                  onChange={(e) => setCompareVersionB(e.target.value)}
                  className="bg-white border rounded px-2 py-1"
                >
                  <option value="">-- Choose Version --</option>
                  {savedVersions.map(v => (
                    <option key={v.version} value={v.version}>{v.version}</option>
                  ))}
                </select>
                {compareVersionB && (
                  <button
                    onClick={() => setShowCompareSection(true)}
                    className="bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs px-3 py-1 rounded font-bold transition-all cursor-pointer"
                  >
                    Compare Live Diff
                  </button>
                )}
              </div>

              {showCompareSection && compareVersionB && (() => {
                const getVerData = (key: string) => {
                  if (key === "current") {
                    return {
                      name: "Current Active Draft",
                      cost: analysisResult?.costing?.rawMaterialCost ?? 0,
                      active: analysisResult?.totalActiveMatter ?? 0,
                      hlb: analysisResult?.estHlb || 0,
                      health: analysisResult?.healthScoreBreakdown?.finalScore ?? 0,
                      eco: analysisResult?.ecoMetrics?.biodegradabilityPct ?? 0
                    };
                  }
                  const found = savedVersions.find(v => v.version === key);
                  return found ? {
                    name: found.version,
                    cost: found.cost ?? 0,
                    active: found.activeMatter ?? 0,
                    hlb: found.hlb ?? 0,
                    health: found.healthScore ?? 0,
                    eco: found.ecoScore ?? 0
                  } : null;
                };

                const dataA = getVerData(compareVersionA);
                const dataB = getVerData(compareVersionB);

                if (!dataA || !dataB) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs bg-white p-3.5 rounded-xl border border-gray-100 text-center font-bold">
                    <div className="border-r last:border-0 pr-1 text-left">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">Cost per Kg Difference</span>
                      <span className="text-gray-900 block">{dataA.name}: ₹{safeNum(dataA.cost, 1)}</span>
                      <span className="text-gray-500 block">{dataB.name}: ₹{safeNum(dataB.cost, 1)}</span>
                      <span className={`block mt-1 ${dataA.cost <= dataB.cost ? "text-emerald-600" : "text-red-500"}`}>
                        Diff: {safeNum(dataA.cost - dataB.cost, 2)}
                      </span>
                    </div>
                    <div className="border-r last:border-0 pr-1 text-left">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">Active Matter Diff</span>
                      <span className="text-gray-900 block">{dataA.name}: {dataA.active}%</span>
                      <span className="text-gray-500 block">{dataB.name}: {dataB.active}%</span>
                      <span className={`block mt-1 ${dataA.active >= dataB.active ? "text-emerald-600" : "text-red-500"}`}>
                        Diff: {safeNum(dataA.active - dataB.active, 1)}%
                      </span>
                    </div>
                    <div className="border-r last:border-0 pr-1 text-left">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">HLB Balance Diff</span>
                      <span className="text-gray-900 block">{dataA.name}: {dataA.hlb}</span>
                      <span className="text-gray-500 block">{dataB.name}: {dataB.hlb}</span>
                      <span className="block text-gray-600 mt-1">Diff: {safeNum(dataA.hlb - dataB.hlb, 1)}</span>
                    </div>
                    <div className="border-r last:border-0 pr-1 text-left">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">Health Score Diff</span>
                      <span className="text-gray-900 block">{dataA.name}: {dataA.health}</span>
                      <span className="text-gray-500 block">{dataB.name}: {dataB.health}</span>
                      <span className={`block mt-1 ${dataA.health >= dataB.health ? "text-emerald-600" : "text-red-500"}`}>
                        Diff: {dataA.health - dataB.health}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">Biodegradability Diff</span>
                      <span className="text-gray-900 block">{dataA.name}: {dataA.eco}%</span>
                      <span className="text-gray-500 block">{dataB.name}: {dataB.eco}%</span>
                      <span className={`block mt-1 ${dataA.eco >= dataB.eco ? "text-emerald-600" : "text-red-500"}`}>
                        Diff: {safeNum(dataA.eco - dataB.eco, 1)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* EXPORT CENTER & BIBLIOGRAPHY */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} className="text-teal-600" /> Professional Laboratory Export Center & References
        </h4>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={triggerPdfExport}
            className="bg-[#0f766e] hover:bg-[#0d645c] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} /> Export Laboratory PDF Report
          </button>
          <button
            onClick={triggerCsvExport}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border"
          >
            <Download size={13} /> Download Excel / CSV Spreadsheet
          </button>
          <button
            onClick={triggerJsonExport}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border"
          >
            <Download size={13} /> Export Raw JSON Formula
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border"
          >
            <Printer size={13} /> Print Sheet
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-[11px] text-gray-500 font-medium">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Scientific Standards & Literature Bibliography</span>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li>
              <strong>Griffin HLB Method:</strong> Griffin, W. C. (1949). "Classification of Surface-Active Agents by 'HLB'". Journal of the Society of Cosmetic Chemists. 1 (5): 311–26.
            </li>
            <li>
              <strong>Davies HLB Estimation:</strong> Davies, J. T. (1957). "A quantitative kinetic theory of emulsion type, I. Physical chemistry of the emulsifying agent". Proceedings of the International Congress of Surface Activity.
            </li>
            <li>
              <strong>OECD 301 Standards:</strong> Organization for Economic Co-operation and Development (OECD). "Guideline for Testing of Chemicals - Test 301: Ready Biodegradability in Aqueous Systems."
            </li>
            <li>
              <strong>ASTM Standards:</strong> ASTM D4008 - Standard Test Method for Measuring Anti-Redeposition Properties of Surfactants and Thickener Polymers.
            </li>
          </ul>
        </div>
      </div>

      {/* EXPLAIN MODAL PANEL */}
      {explainModal && explainModal.isOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                <Info size={16} className="text-teal-600" /> {explainModal.title}
              </span>
              <button onClick={() => setExplainModal(null)} className="text-gray-400 hover:text-gray-700">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600 leading-relaxed font-semibold">{explainModal.content}</p>
              {explainModal.formulaUsed && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-700">
                  <span className="font-bold text-gray-400 uppercase text-[8px] block mb-1">Calculation Formula Applied</span>
                  {explainModal.formulaUsed}
                </div>
              )}
              {explainModal.parameters && (
                <div className="space-y-1.5">
                  <span className="font-bold text-gray-400 uppercase text-[8px] block">Downstream Active Parameters</span>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] text-gray-800 bg-gray-50 p-2.5 rounded border border-gray-100 leading-relaxed">
                    {explainModal.parameters}
                  </pre>
                </div>
              )}
            </div>
            <button
              onClick={() => setExplainModal(null)}
              className="w-full bg-[#0f766e] hover:bg-[#0d645c] text-white py-2 rounded-xl font-bold transition-all text-xs"
            >
              Understand & Dismiss Diagnostics
            </button>
          </div>
        </div>
      )}

      <SubscriptionPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightedFeature="PDF Professional R&D Report Export"
      />
    </div>
  );
}

// Detergent R&D Calculators utility
import { CHEMICALS, COMPATIBILITY_MATRIX } from "../data/chemicals";
import { getAllUniversalIngredients } from "../data/universalIngredientLibrary";
import { Chemical } from "../types";
import { PHEngine } from "./pHEngine";

const sharedPHEngine = new PHEngine();

export function getChemicalData(name: string): Chemical | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  const universal = getAllUniversalIngredients() as Chemical[];
  const univMatch = universal.find(c => {
    const cCommon = (c.commonName || "").toLowerCase();
    const cChem = (c.chemicalName || "").toLowerCase();
    const cInci = (c.inciName || "").toLowerCase();
    if (cCommon === lower || cChem === lower || cInci === lower) return true;
    if (lower.includes(cCommon) || cCommon.includes(lower)) return true;
    if (c.synonyms && c.synonyms.some(s => s.toLowerCase() === lower || lower.includes(s.toLowerCase()))) return true;
    if (c.tradeNames && c.tradeNames.some(t => t.toLowerCase() === lower || lower.includes(t.toLowerCase()))) return true;
    return false;
  });
  if (univMatch) return univMatch;

  return CHEMICALS.find(c => {
    const cCommon = (c.commonName || "").toLowerCase();
    const cChem = (c.chemicalName || "").toLowerCase();
    const cInci = (c.inciName || "").toLowerCase();
    if (cCommon === lower || cChem === lower || cInci === lower) return true;
    if (lower.includes(cCommon) || cCommon.includes(lower)) return true;
    if (c.synonyms && c.synonyms.some(s => s.toLowerCase() === lower || lower.includes(s.toLowerCase()))) return true;
    if (c.tradeNames && c.tradeNames.some(t => t.toLowerCase() === lower || lower.includes(t.toLowerCase()))) return true;
    return false;
  });
}

// 1. LABSA Neutralization
// Math:
// LABSA (MW ~326 g/mol) + NaOH (MW ~40 g/mol) -> Sodium LAS + H2O
// 1 mole of LABSA requires 1 mole of NaOH.
// Thus, 1 kg of pure LABSA requires: (40 / 326.49) = 0.1225 kg of pure NaOH.
// Since commercial LABSA is typically 90% active: 1kg of LABSA 90% contains 0.9kg of acid, requiring 0.9 * 0.1225 = 0.1102 kg of pure NaOH.
// However, LABSA contains ~5-7% sulfuric acid as a byproduct of sulfonation (MW 98.08 g/mol, diprotic - requires 2 moles of NaOH).
// 1 mole of H2SO4 requires 2 moles of NaOH (80 / 98.08 = 0.815 kg NaOH per kg H2SO4).
// A typical 90% LABSA contains around 5% H2SO4.
// So 1kg of LABSA 90% requires: (0.90 * 0.1225) + (0.05 * 0.815) = 0.11025 + 0.04075 = 0.151 kg of pure NaOH.
// In actual industrial practice:
// - To neutralize 1 kg of commercial LABSA 90%, it requires ~13.5% (135g) to 14.5% (145g) of NaOH flakes (99% purity) depending on actual acid value.
// - Or ~280g of Caustic Lye (48% concentration).
// - Or ~190g of KOH flakes (90% purity).
// - Or ~450g of Triethanolamine (TEA 99% purity, MW 149.19 g/mol).

export interface NeutralizationInput {
  labsaQty: number; // in kg
  labsaPurity: 90 | 96; // 90% active or 96% active
  alkaliType: "NaOH Flakes (99%)" | "NaOH Lye (48%)" | "KOH Flakes (90%)" | "TEA (99%)" | "Soda Ash (Light)";
}

export interface NeutralizationResult {
  alkaliRequiredGrams: number;
  waterGeneratedGrams: number;
  heatGeneratedKJ: number;
  stoichiometricRatio: number; // alkali to LABSA ratio
  recommendedWaterForDissolutionGrams: number;
}

export function calculateNeutralization(input: NeutralizationInput): NeutralizationResult {
  const { labsaQty, labsaPurity, alkaliType } = input;
  
  // Base ratio of alkali in grams per 1000g of commercial LABSA
  let ratio = 0;
  let waterFactor = 0;
  let heatFactor = 0; // KJ/kg LABSA neutralized
  let dissolutionWaterFactor = 0; // water needed to dissolve dry alkali safely

  if (labsaPurity === 90) {
    switch (alkaliType) {
      case "NaOH Flakes (99%)":
        ratio = 135; // 135g per kg
        waterFactor = 61;
        heatFactor = 180;
        dissolutionWaterFactor = 400; // dissolve 135g in ~400g water (makes ~25% solution)
        break;
      case "NaOH Lye (48%)":
        ratio = 281; // 281g per kg
        waterFactor = 61;
        heatFactor = 110; // lower because already dissolved
        dissolutionWaterFactor = 0; // already liquid
        break;
      case "KOH Flakes (90%)":
        ratio = 195;
        waterFactor = 61;
        heatFactor = 210;
        dissolutionWaterFactor = 500;
        break;
      case "TEA (99%)":
        ratio = 450;
        waterFactor = 0; // organic salt, minimal water generated
        heatFactor = 75; // mild exotherm
        dissolutionWaterFactor = 0; // used as is or diluted
        break;
      case "Soda Ash (Light)":
        ratio = 180; // requires more due to weaker base and CO2 generation
        waterFactor = 30;
        heatFactor = 45; // very low heat, but dangerous CO2 gas release
        dissolutionWaterFactor = 600; // needs lots of water to dissolve Soda Ash Light
        break;
    }
  } else {
    // 96% pure LABSA (contains less free sulfuric acid but more sulfonic acid)
    switch (alkaliType) {
      case "NaOH Flakes (99%)":
        ratio = 144;
        waterFactor = 65;
        heatFactor = 190;
        dissolutionWaterFactor = 430;
        break;
      case "NaOH Lye (48%)":
        ratio = 300;
        waterFactor = 65;
        heatFactor = 120;
        dissolutionWaterFactor = 0;
        break;
      case "KOH Flakes (90%)":
        ratio = 208;
        waterFactor = 65;
        heatFactor = 220;
        dissolutionWaterFactor = 530;
        break;
      case "TEA (99%)":
        ratio = 480;
        waterFactor = 0;
        heatFactor = 80;
        dissolutionWaterFactor = 0;
        break;
      case "Soda Ash (Light)":
        ratio = 192;
        waterFactor = 32;
        heatFactor = 50;
        dissolutionWaterFactor = 650;
        break;
    }
  }

  const alkaliRequiredGrams = ratio * labsaQty;
  const waterGeneratedGrams = waterFactor * labsaQty;
  const heatGeneratedKJ = heatFactor * labsaQty;
  const recommendedWaterForDissolutionGrams = dissolutionWaterFactor * labsaQty;

  return {
    alkaliRequiredGrams,
    waterGeneratedGrams,
    heatGeneratedKJ,
    stoichiometricRatio: ratio / 1000,
    recommendedWaterForDissolutionGrams
  };
}

// 2. HLB Calculator (Hydrophilic-Lipophilic Balance)
// Standard HLB values:
// SLES = 11.0, CAPB = 12.0, LABSA (neutralized) = 11.5, APG = 13.5, Lauryl Alcohol Ethoxylate 7EO = 12.1, Tween 80 = 15.0, Span 80 = 4.3, Lecithin = 4.0
export interface HLBSurfactant {
  name: string;
  hlb: number;
  proportion: number; // weight or percentage
}

export function calculateHLB(surfactants: HLBSurfactant[]): number {
  if (!Array.isArray(surfactants) || surfactants.length === 0) return 0;
  const totalWeight = surfactants.reduce((acc, curr) => acc + (Number(curr?.proportion) || 0), 0);
  if (totalWeight === 0 || isNaN(totalWeight)) return 0;
  
  const weightedSum = surfactants.reduce((acc, curr) => acc + ((Number(curr?.hlb) || 0) * (Number(curr?.proportion) || 0)), 0);
  if (isNaN(weightedSum)) return 0;
  const res = Math.round((weightedSum / totalWeight) * 100) / 100;
  return isNaN(res) ? 0 : res;
}

export function getAuditedIngredientCategory(name: string, role?: string): string {
  const n = (name || "").toLowerCase();
  const r = (role || "").toLowerCase();

  // 0. Explicit Scientific Overrides
  if (n.includes("sodium citrate") || n.includes("trisodium citrate") || n.includes("potassium citrate")) {
    return "Builders & Chelators";
  }

  // 0.1 Enzymes & Biological Catalysts (Checked early to prevent false MEA/acid matches)
  if (
    n.includes("enzyme") || n.includes("protease") || n.includes("lipase") || n.includes("amylase") || n.includes("cellulase") || n.includes("mannanase") || n.includes("pectin lyase") ||
    r.includes("enzyme") || r.includes("biocatalyst")
  ) {
    return "Enzymes";
  }

  // 0.2 Polymers & Thickeners (Checked early to prevent anti-redeposition matching "red")
  if (
    n.includes("cellulose") || n.includes("cmc") || n.includes("hpmc") || n.includes("hec") ||
    n.includes("carbomer") || n.includes("polyacrylate") || n.includes("copolymer") ||
    n.includes("pvp") || n.includes("polyquaternium") || n.includes("guar hydroxypropyl") ||
    n.includes("xanthan") || n.includes("guar gum") || n.includes("peg-150 distearate") || n.includes("acrylate") ||
    r.includes("polymer") || r.includes("thickener") || r.includes("rheology modifier") || r.includes("anti-redeposition")
  ) {
    return "Polymers & Thickeners";
  }

  // 1. Colorants & Fragrance (Checked first to prevent dyes like Acid Blue 9 from being matched under 'pH Adjusters' due to 'acid' or 'alkali' in name)
  if (
    n.includes("dye") || n.includes("color") || n.includes("pigment") || n.includes("speckle") ||
    n.includes("perfume") || n.includes("fragrance") || n.includes("essential oil") ||
    n.includes("patent blue") || n.includes("tartrazine") || n.includes("brightener") ||
    n.includes("ranipal") || n.includes("fluorescein") || n.includes("violet") ||
    n.includes("direct dye") || n.includes("acid dye") || n.includes("basic dye") ||
    r.includes("perfume") || r.includes("fragrance") || r.includes("color") || r.includes("dye") ||
    r.includes("pigment") || r.includes("optical brightener") || r.includes("colorant")
  ) {
    // Exclude special non-colorant cases like Turkish Red Oil or Green Surfactants
    const isTurkishRedOil = n.includes("turkish red oil") || n.includes("sulfated castor oil");
    const isGreenSurfactant = n.includes("green surfactant") || n.includes("green soap") || n.includes("green chelator");
    if (!isTurkishRedOil && !isGreenSurfactant) {
      return "Colorants & Fragrance";
    }
  }

  // 2. Surfactants:
  // Anionic:
  if (
    n.includes("labsa") || n.includes("sulfonic acid") ||
    n.includes("sles") || n.includes("ether sulfate") ||
    n.includes("sls") || n.includes("lauryl sulfate") ||
    n.includes("aos") || n.includes("olefin sulfonate") ||
    n.includes("dodecylbenzene sulfonate") || n.includes("sdbs") ||
    n.includes("isethionate") || n.includes("sci") ||
    n.includes("taurate") || n.includes("sarcosinate") || n.includes("sarkosyl") ||
    n.includes("sulfosuccinate") || n.includes("dls") ||
    n.includes("sulfoacetate") || n.includes("slsa") ||
    n.includes("alkane sulfonate") || n.includes("sas") ||
    n.includes("methyl ester sulfonate") || n.includes("mes") ||
    n.includes("soap noodles") || n.includes("cocoate") || n.includes("potassium soap") || n.includes("sodium soap") ||
    r.includes("anionic surfactant")
  ) {
    return "Surfactants (Anionic)";
  }

  // Amine Oxide Foam Boosters:
  if (
    n.includes("amine oxide") || n.includes("ldao") || n.includes("cocamine oxide") || n.includes("lauramine oxide") ||
    r.includes("amine oxide")
  ) {
    return "Amine Oxide Foam Boosters";
  }

  // Amphoteric:
  if (
    n.includes("betaine") || n.includes("capb") ||
    n.includes("amphoacetate") || n.includes("amphodiacetate") ||
    n.includes("sultaine") ||
    r.includes("amphoteric surfactant") || r.includes("zwitterionic surfactant")
  ) {
    return "Surfactants (Amphoteric)";
  }

  // Cationic:
  if (
    n.includes("cetrimonium") || n.includes("ctac") ||
    n.includes("behentrimonium") || n.includes("btac") ||
    n.includes("benzalkonium") || n.includes("bkc") ||
    n.includes("didecyldimethyl") || n.includes("ddac") ||
    n.includes("esterquat") || n.includes("dhtdmac") ||
    r.includes("cationic surfactant")
  ) {
    return "Surfactants (Cationic)";
  }

  // Nonionic:
  if (
    n.includes("glucoside") || n.includes("apg") ||
    n.includes("ethoxylate") || n.includes("lae") || n.includes("fae") ||
    n.includes("np-9") || n.includes("np-6") || n.includes("np-10") || n.includes("alfox") ||
    n.includes("polysorbate") || n.includes("tween") || n.includes("span") || n.includes("sorbitan") ||
    n.includes("ceteareth") || n.includes("glyceryl stearate") || n.includes("gms") ||
    n.includes("cocamide dea") || n.includes("cocamide mea") || n.includes("cde") || n.includes("cme") || n.includes("cmea") ||
    n.includes("sucrose cocoate") || n.includes("sucrose stearate") || n.includes("soapnut") || n.includes("saponin") ||
    r.includes("nonionic surfactant") || r.includes("non-ionic surfactant") ||
    r.includes("surfactant") // default general surfactant
  ) {
    return "Surfactants (Nonionic)";
  }

  // 3. Builders & Chelators
  if (
    (
      n.includes("soda ash") || n.includes("sodium carbonate") ||
      n.includes("tripolyphosphate") || n.includes("stpp") ||
      n.includes("zeolite") || n.includes("silicate") ||
      n.includes("borax") || n.includes("suhaga") ||
      n.includes("bicarbonate") || n.includes("baking soda") ||
      n.includes("sesquicarbonate") || n.includes("pearl ash") ||
      n.includes("edta") || n.includes("nta") ||
      n.includes("gluconate") || n.includes("glda") || n.includes("mgda") ||
      n.includes("dissolvine") || n.includes("trilon") ||
      n.includes("hedp") || n.includes("atmp") || n.includes("dtpmp") ||
      n.includes("phosphonate") || n.includes("sequestrant") ||
      n.includes("citrate") || n.includes("trisodium citrate") || n.includes("sodium citrate") ||
      r.includes("builder") || r.includes("chelator") || r.includes("chelating agent") || r.includes("sequestrant")
    ) &&
    !n.includes("caustic") && !n.includes("sodium hydroxide") && !n.includes("potassium hydroxide") &&
    !n.includes("monoethanolamine") && !n.includes("diethanolamine") && !n.includes("triethanolamine")
  ) {
    return "Builders & Chelators";
  }

  // 4. Electrolytes & Viscosity Modifiers
  if (
    n.includes("salt") || n.includes("sodium chloride") || n.includes("chloride") ||
    n.includes("sulfate") ||
    r.includes("electrolyte") || r.includes("salt") || r.includes("viscosity builder") || r.includes("viscosity modifier") ||
    (r.includes("rheology modifier") && (n.includes("salt") || n.includes("chloride") || n.includes("sodium")))
  ) {
    return "Electrolytes & Viscosity Modifiers";
  }

  // 6. pH Adjusters
  if (
    n.includes("caustic") || n.includes("sodium hydroxide") || n.includes("potassium hydroxide") ||
    n.includes("neutralizer") ||
    r.includes("ph adjuster") || r.includes("neutralizer") ||
    n.includes("monoethanolamine") || n.includes("diethanolamine") || n.includes("triethanolamine") ||
    /\bmea\b/.test(n) || /\bdea\b/.test(n) || /\btea\b/.test(n) ||
    (n.includes("acid") && !n.includes("sulfonic acid") && !n.includes("amino acid") && !n.includes("citric acid"))
  ) {
    return "pH Adjusters";
  }

  // 7. Preservatives
  if (
    n.includes("dmdm") || n.includes("phenoxyethanol") ||
    n.includes("isothiazolinone") || n.includes("bit 20") || n.includes("mit 10") ||
    n.includes("benzoate") || n.includes("sorbate") || n.includes("paraben") || n.includes("formalin") ||
    n.includes("kathon") || n.includes("isothiazolinone") || n.includes("methylisothiazolinone") || n.includes("methylchloroisothiazolinone") || n.includes("bronopol") ||
    r.includes("preservative")
  ) {
    return "Preservatives";
  }

  // 7.5. Hydrotropes & Coupling Agents
  if (
    n.includes("sxs") || n.includes("xylene sulfonate") ||
    n.includes("scs") || n.includes("cumene sulfonate") ||
    n.includes("hydrotrope") ||
    r.includes("hydrotrope") || r.includes("coupling agent")
  ) {
    return "Hydrotropes & Coupling Agents";
  }

  // 8. Solvents & Water Carriers
  if (
    n.includes("water") || n.includes("aqua") || n === "dm water" ||
    n.includes("ethanol") || n.includes("ipa") || n.includes("isopropyl alcohol") ||
    n.includes("glycol") || n.includes("meg") || n.includes("mpg") || n.includes("dpg") ||
    n.includes("cellosolve") || n.includes("carbitol") || n.includes("terpene") ||
    n.includes("limonene") || n.includes("pine oil") || n.includes("glycerin") || n.includes("sorbitol") ||
    r.includes("solvent") || r.includes("carrier") || r.includes("solvent carrier")
  ) {
    return "Solvents & Water Carriers";
  }

  return "Unknown";
}

export function getIngredientCost(ing: { name?: string; costPerKg?: number }): number {
  // Rule #8: only user-entered prices are valid. Never invent from name or defaults.
  if (ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(ing.costPerKg) && ing.costPerKg > 0) {
    return ing.costPerKg;
  }
  return 0;
}

export function calculateBatchCost(
  ingredients: Array<{ name?: string; percentage?: number; costPerKg?: number }>
): number {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return 0;
  const totalCost = ingredients.reduce((sum, ing) => {
    if (!ing) return sum;
    const pct = Number(ing.percentage) || 0;
    const cost = getIngredientCost(ing);
    return sum + (pct / 100) * cost;
  }, 0);
  return Number(totalCost.toFixed(2));
}

export function getDefaultActiveMatter(name: string): number {
  if (!name) return 100;
  const chem = getChemicalData(name);
  if (chem?.physicalProperties?.activeMatter) {
    const match = chem.physicalProperties.activeMatter.match(/(\d+(?:\.\d+)?)\s*%/);
    if (match) return parseFloat(match[1]);
  }
  const n = name.toLowerCase();
  
  // Auto extract percentage from name like "HEDP Acid (60%)" or "Sodium Hydroxide Lye (33%)"
  const pctMatch = n.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    return parseFloat(pctMatch[1]);
  }
  
  if (n.includes("naoh") || n.includes("caustic") || n.includes("sodium hydroxide")) {
    if (n.includes("33")) return 33;
    if (n.includes("50")) return 50;
    if (n.includes("98") || n.includes("flake") || n.includes("solid") || n.includes("dry")) return 98;
    if (n.includes("lye") || n.includes("solution") || n.includes("liquid")) return 50;
    return 98;
  }

  if (n.includes("hedp")) return 60;
  if (n.includes("labsa")) return 90;
  if (n.includes("sles")) return 70;
  if (n.includes("capb")) return 30;
  if (n.includes("glucoside")) return 50;
  if (n.includes("lae") || n.includes("alcohol ethoxylate")) return 100;
  if (n.includes("aos") || n.includes("alpha olefin")) return 38;
  if (n.includes("sarcosinate")) return 30;
  if (n.includes("water") || n.includes("aqua") || n === "dm water") return 0;
  return 100;
}

// 3. Active Matter Calculator
export interface ActiveMatterIngredient {
  name: string;
  percentageInFormula?: number;
  percentage?: number;
  pct?: number;
  activeMatterPurity?: number;
  activeMatterPct?: number;
  active?: number;
}

export function calculateActiveMatter(ingredients: any[]): number {
  if (!ingredients || !Array.isArray(ingredients)) return 0;
  const totalActive = ingredients
    .filter(ing => {
      if (!ing || typeof ing !== "object") return false;
      const cat = (ing.category || ing.type || ing.role || "").toLowerCase();
      const name = (ing.name || "").toLowerCase();
      const auditedCat = getAuditedIngredientCategory(name, ing.role || "").toLowerCase();
      return (
        cat.includes("surfactant") || cat.includes("anionic") || cat.includes("nonionic") || cat.includes("amphoteric") ||
        auditedCat.includes("surfactant") || auditedCat.includes("amine oxide") ||
        name.includes("sles") || name.includes("labsa") || name.includes("capb") || name.includes("aos") || name.includes("sls") ||
        name.includes("surfactant") || name.includes("lauryl") || name.includes("coco")
      );
    })
    .reduce((sum, ing) => {
      const activeFraction = ((ing.activePercent !== undefined ? ing.activePercent : ing.activeMatterPct !== undefined ? ing.activeMatterPct : ing.activeMatterPurity) || 0) / 100;
      const weightPercent = ing.percentage !== undefined ? ing.percentage : ing.percentageInFormula !== undefined ? ing.percentageInFormula : ing.pct || 0;
      return sum + activeFraction * weightPercent;
    }, 0);
  if (isNaN(totalActive) || !isFinite(totalActive)) return 0;
  return Number(totalActive.toFixed(2));
}

// 3b. Surfactant-only Raw and Active calculators
export function calculateRawSurfactants(ingredients: any[]): number {
  if (!ingredients || !Array.isArray(ingredients)) return 0;
  const total = ingredients.reduce((acc, curr) => {
    if (!curr || typeof curr !== "object") return acc;
    const name = curr.name || "";
    const role = curr.role || "";
    const cat = getAuditedIngredientCategory(name, role);
    const isSurfactant = cat.startsWith("Surfactants") || cat === "Amine Oxide Foam Boosters" || (role && role.toLowerCase().includes("surfactant"));
    if (!isSurfactant) return acc;

    const pctRaw = curr.percentage !== undefined ? curr.percentage :
                curr.percentageInFormula !== undefined ? curr.percentageInFormula :
                curr.pct !== undefined ? curr.pct : 0;
    const pct = Number(pctRaw) || 0;
    return acc + pct;
  }, 0);
  return isNaN(total) ? 0 : Number(total.toFixed(2));
}

export function calculateActiveSurfactants(ingredients: any[]): number {
  return calculateActiveMatter(ingredients);
}

export function calculateCPI(
  ingredients: any[],
  pH?: number,
  hardnessResult?: WaterHardnessToleranceResult,
  compatibilityResult?: any,
  ecoResult?: any
): number {
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return 0;

  const currentpH = pH !== undefined ? pH : calculateEstimatedPH("General", "Formula", ingredients).estpH;
  const hr = hardnessResult || calculateWaterHardnessTolerance(ingredients);
  const cleanPerf = calculateCleaningPerformance(ingredients, currentpH, hr);
  const comp = compatibilityResult || calculateFormulationCompatibility(ingredients, currentpH);
  const eco = ecoResult || calculateComplexEcoScore(ingredients);

  let baseScore = cleanPerf.overallScore;

  let compScore = comp.overallScore !== undefined ? comp.overallScore : (comp.compatibilityScore !== undefined ? comp.compatibilityScore : 100);
  let compFactor = 1.0;
  if (compScore < 50) compFactor = 0.80;
  else if (compScore < 70) compFactor = 0.90;
  else if (compScore < 85) compFactor = 0.95;

  let ecoScoreVal = eco.score !== undefined ? eco.score : (typeof eco === "number" ? eco : 80);
  let ecoAdj = 0;
  if (ecoScoreVal >= 80) ecoAdj = 3;
  else if (ecoScoreVal < 40) ecoAdj = -3;

  const cpi = Math.max(0, Math.min(100, Math.round(baseScore * compFactor + ecoAdj)));
  return cpi;
}

// 4. Batch Scaling
export interface ScaleResultItem {
  name: string;
  originalPercent: number;
  scaledWeight: number; // in kg
  costContribution: number;
}

export function scaleFormula(
  ingredients: { name: string; percentage: number; costPerKg: number }[],
  targetBatchSizeKg: number
): ScaleResultItem[] {
  const batch = Number(targetBatchSizeKg) || 0;
  return (ingredients || []).map(ing => {
    const pct = Number(ing?.percentage) || 0;
    const cost = Number(ing?.costPerKg) || 0;
    const scaledWeight = (pct / 100) * batch;
    const costContribution = scaledWeight * cost;
    return {
      name: ing?.name || "",
      originalPercent: pct,
      scaledWeight: isNaN(scaledWeight) ? 0 : Math.round(scaledWeight * 1000) / 1000,
      costContribution: isNaN(costContribution) ? 0 : Math.round(costContribution * 100) / 100
    };
  });
}

export interface BatchVolumeResult {
  totalWeightKg: number;
  estimatedDensityGml: number;
  estimatedVolumeLiters: number;
  estimatedVolumeGallons: number;
  bulkDensityPowderGfL?: number;
}

export function calculateBatchVolume(
  ingredients: Array<{ name: string; percentage: number; activeMatterPct?: number }>,
  batchWeightKg: number = 100
): BatchVolumeResult {
  let weightedDensitySum = 0;
  let totalPct = 0;
  let powderBulkSum = 0;
  let powderPct = 0;

  (ingredients || []).forEach(ing => {
    if (!ing || !ing.name) return;
    const pct = Number(ing.percentage) || 0;
    if (pct <= 0) return;
    totalPct += pct;

    const chem = getChemicalData(ing.name);
    let spGrav = 1.0;
    if (chem?.physicalProperties?.density) {
      const num = parseFloat(chem.physicalProperties.density);
      if (!isNaN(num) && num > 0) spGrav = num;
    } else if (chem?.specificGravity) {
      const num = parseFloat(chem.specificGravity);
      if (!isNaN(num) && num > 0) spGrav = num;
    } else {
      const n = ing.name.toLowerCase();
      if (n.includes("water") || n.includes("aqua")) spGrav = 1.0;
      else if (n.includes("labsa")) spGrav = 1.06;
      else if (n.includes("sles") || n.includes("sls")) spGrav = 1.05;
      else if (n.includes("glycerin")) spGrav = 1.26;
      else if (n.includes("caustic")) spGrav = 1.52;
      else spGrav = 1.1;
    }

    weightedDensitySum += (pct / 100) * spGrav;

    if (chem?.bulkDensity) {
      const num = parseFloat(chem.bulkDensity);
      if (!isNaN(num) && num > 0) {
        powderBulkSum += (pct / 100) * num;
        powderPct += pct;
      }
    }
  });

  const estimatedDensityGml = totalPct > 0 ? Number((weightedDensitySum / (totalPct / 100)).toFixed(3)) : 1.0;
  const estimatedVolumeLiters = Number((batchWeightKg / estimatedDensityGml).toFixed(2));
  const estimatedVolumeGallons = Number((estimatedVolumeLiters * 0.264172).toFixed(2));

  return {
    totalWeightKg: batchWeightKg,
    estimatedDensityGml,
    estimatedVolumeLiters,
    estimatedVolumeGallons,
    bulkDensityPowderGfL: powderPct > 0 ? Number(powderBulkSum.toFixed(1)) : undefined
  };
}

// 5. Dilution Calculator
// C1 * V1 = C2 * V2
// e.g. How much 70% SLES (C1) is needed to make 50 Liters (V2) of 15% active SLES (C2)?
export function calculateDilution(c1: number, c2: number, v2: number): { v1: number; waterNeeded: number } {
  const numC1 = Number(c1) || 0;
  const numC2 = Number(c2) || 0;
  const numV2 = Number(v2) || 0;
  if (numC1 <= 0 || numC2 > numC1 || isNaN(numC1) || isNaN(numC2) || isNaN(numV2)) {
    return { v1: 0, waterNeeded: isNaN(numV2) ? 0 : numV2 };
  }
  const v1 = (numC2 * numV2) / numC1;
  const waterNeeded = numV2 - v1;
  return {
    v1: isNaN(v1) ? 0 : Math.round(v1 * 100) / 100,
    waterNeeded: isNaN(waterNeeded) ? 0 : Math.round(waterNeeded * 100) / 100
  };
}

// 6. Unit Converter
export function convertUnit(val: number, from: string, to: string): number {
  // standard conversions
  let valInGrams = 0;
  
  switch (from) {
    case "kg": valInGrams = val * 1000; break;
    case "g": valInGrams = val; break;
    case "lb": valInGrams = val * 453.592; break;
    case "oz": valInGrams = val * 28.3495; break;
    case "l": valInGrams = val * 1000; break; // assume density = 1.0 for simple volume-mass proxy
    case "ml": valInGrams = val; break;
    case "gal": valInGrams = val * 3785.41; break;
    default: valInGrams = val;
  }

  switch (to) {
    case "kg": return Math.round((valInGrams / 1000) * 1000) / 1000;
    case "g": return Math.round(valInGrams * 100) / 100;
    case "lb": return Math.round((valInGrams / 453.592) * 1000) / 1000;
    case "oz": return Math.round((valInGrams / 28.3495) * 100) / 100;
    case "l": return Math.round((valInGrams / 1000) * 1000) / 1000;
    case "ml": return Math.round(valInGrams * 100) / 100;
    case "gal": return Math.round((valInGrams / 3785.41) * 1000) / 1000;
    default: return val;
  }
}

// 7. Eco & Biodegradability Calculators
export interface EcoMetrics {
  biodegradabilityPct: number;
  plantBasedPct: number;
  isMineralOrWater: boolean;
}

export function getIngredientEcoMetrics(name: string): EcoMetrics {
  const chem = getChemicalData(name);
  if (chem?.sustainability) {
    let bioPct = 80;
    if (typeof chem.sustainability.biodegradability === "string") {
      const match = chem.sustainability.biodegradability.match(/(\d+)%/);
      if (match) bioPct = parseFloat(match[1]);
      else if (chem.sustainability.biodegradability.toLowerCase().includes("readily")) bioPct = 95;
      else if (chem.sustainability.biodegradability.toLowerCase().includes("not readily")) bioPct = 30;
    }
    const plantPct = chem.sustainability.plantBasedPct !== undefined ? chem.sustainability.plantBasedPct : 50;
    const isMineral = name.toLowerCase().includes("water") || name.toLowerCase().includes("salt") || name.toLowerCase().includes("carbonate") || name.toLowerCase().includes("zeolite");
    return {
      biodegradabilityPct: bioPct,
      plantBasedPct: plantPct,
      isMineralOrWater: isMineral
    };
  }

  const n = name.toLowerCase();
  
  // 1. Water
  if (n.includes("water") || n.includes("dm water") || n.includes("aqua") || n.includes("carrier") || n.includes("solvent carrier") || n === "water") {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: true };
  }
  
  // 2. Botanical / Plant extract Surfactants
  if (n.includes("soapnut") || n.includes("reetha") || n.includes("saponin") || n.includes("soap bark") || n.includes("shikakai") || n.includes("plantacare")) {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: false };
  }
  
  // 3. Glucosides (APGs - 100% Plant Surfactants)
  if (n.includes("glucoside") || n.includes("apg") || n.includes("alkyl polyglucoside") || n.includes("caprylyl")) {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: false };
  }
  
  // 4. Amino Acid Surfactants
  if (n.includes("taurate") || n.includes("glutamate") || n.includes("glycinate") || n.includes("sarcosinate")) {
    return { biodegradabilityPct: 98, plantBasedPct: 95, isMineralOrWater: false };
  }
  
  // 5. Methyl Ester Sulfonates & SLSA
  if (n.includes("methyl ester") || n.includes("mes") || n.includes("sulfoacetate") || n.includes("slsa")) {
    return { biodegradabilityPct: 98, plantBasedPct: 100, isMineralOrWater: false };
  }

  // 6. Cationic Esterquats
  if (n.includes("esterquat") || n.includes("dhtdmac") || n.includes("softening active") || n.includes("conditioning active")) {
    return { biodegradabilityPct: 90, plantBasedPct: 80, isMineralOrWater: false };
  }
  
  // 7. Betaines & Amphoterics
  if (n.includes("betaine") || n.includes("capb")) {
    return { biodegradabilityPct: 95, plantBasedPct: 80, isMineralOrWater: false };
  }

  // 8. Natural Eco Builders & Chelators
  if (n.includes("gluconate") || n.includes("citric") || n.includes("citrate")) {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: false };
  }
  if (n.includes("glda") || n.includes("mgda") || n.includes("glutamic") || n.includes("dissolvine")) {
    return { biodegradabilityPct: 98, plantBasedPct: 85, isMineralOrWater: false };
  }
  
  // 9. Inorganic Minerals & Alkalis
  if (n.includes("carbonate") || n.includes("soda ash") || n.includes("sodium chloride") || n.includes("salt") || n.includes("metasilicate") || n.includes("triphosphate") || n.includes("stpp") || n.includes("zeolite") || n.includes("bicarbonate") || n.includes("silica") || n.includes("sulfate") || n.includes("hydroxide") || n.includes("caustic") || n.includes("naoh") || n.includes("koh") || n.includes("calcium chloride")) {
    return { biodegradabilityPct: 100, plantBasedPct: 0, isMineralOrWater: true };
  }
  
  // 10. Natural Solvents & Essential Oils
  if (n.includes("essential oil") || n.includes("lemongrass") || n.includes("citronella") || n.includes("pine oil") || n.includes("limonene") || n.includes("terpene") || n.includes("glycerin") || n.includes("glycerol")) {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: false };
  }
  
  // 11. Fatty acid soaps
  if (n.includes("soap") || n.includes("cocoate") || n.includes("palmate")) {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: false };
  }
  
  // 12. Synthetic Anionic Surfactants
  if (n.includes("labsa") || n.includes("linear alkylbenzene") || n.includes("acid slurry") || n.includes("las")) {
    return { biodegradabilityPct: 90, plantBasedPct: 0, isMineralOrWater: false };
  }
  if (n.includes("sles") || n.includes("lauryl ether sulfate") || n.includes("sodium lauryl sulfate") || n.includes("sls")) {
    return { biodegradabilityPct: 85, plantBasedPct: 70, isMineralOrWater: false };
  }
  
  // 13. Synthetic Non-ionic Ethoxylates
  if (n.includes("nonylphenol") || n.includes("np-9") || n.includes("np-6") || n.includes("np-10") || n.includes("alfox")) {
    return { biodegradabilityPct: 10, plantBasedPct: 0, isMineralOrWater: false };
  }
  if (n.includes("ethoxylate") || n.includes("lae") || n.includes("cde") || n.includes("cocamide dea") || n.includes("polysorbate") || n.includes("tween")) {
    return { biodegradabilityPct: 90, plantBasedPct: 70, isMineralOrWater: false };
  }
  
  // 14. Celluloses (HEC, CMC)
  if (n.includes("cellulose") || n.includes("cmc") || n.includes("hec")) {
    return { biodegradabilityPct: 85, plantBasedPct: 90, isMineralOrWater: false };
  }
  
  // 15. Enzymes
  if (n.includes("enzyme") || n.includes("protease") || n.includes("lipase") || n.includes("amylase") || n.includes("cellulase")) {
    return { biodegradabilityPct: 100, plantBasedPct: 100, isMineralOrWater: false };
  }
  
  // 16. Highly Persistent Synthetics
  if (n.includes("edta") || n.includes("dtpa") || n.includes("diethylenetriamine") || n.includes("ethylenediaminetetraacetic")) {
    return { biodegradabilityPct: 15, plantBasedPct: 0, isMineralOrWater: false };
  }
  if (n.includes("brightener") || n.includes("cbs") || n.includes("tinopal") || n.includes("fluorescent") || n.includes("stilbene") || n.includes("polyacrylate") || n.includes("acrylic") || n.includes("carbomer") || n.includes("pvp") || n.includes("polyquaternium")) {
    return { biodegradabilityPct: 15, plantBasedPct: 0, isMineralOrWater: false };
  }
  if (n.includes("kathon") || n.includes("isothiazolinone") || n.includes("cmit") || n.includes("mit") || n.includes("formalin") || n.includes("formaldehyde") || n.includes("bronopol") || n.includes("dmdm")) {
    return { biodegradabilityPct: 15, plantBasedPct: 0, isMineralOrWater: false };
  }
  if (n.includes("dye") || n.includes("color") || n.includes("yellow") || n.includes("blue") || n.includes("speckle") || n.includes("perfume") || n.includes("fragrance")) {
    return { biodegradabilityPct: 25, plantBasedPct: 10, isMineralOrWater: false };
  }
  
  // Fallback for unknown ingredients
  return { biodegradabilityPct: 80, plantBasedPct: 50, isMineralOrWater: false };
}

export function calculateFormulationEcoMetrics(ingredients: { name: string; percentage: number }[]): { biodegradabilityPct: number; plantBasedPct: number } {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return { biodegradabilityPct: 100, plantBasedPct: 100 };
  const totalPercent = ingredients.reduce((sum, ing) => sum + (Number(ing?.percentage) || 0), 0);
  if (totalPercent === 0 || isNaN(totalPercent)) return { biodegradabilityPct: 100, plantBasedPct: 100 };
  
  let totalBiodegWeight = 0;
  let totalPlantWeight = 0;
  
  for (const ing of ingredients) {
    if (!ing) continue;
    const pct = Number(ing.percentage) || 0;
    const metrics = getIngredientEcoMetrics(ing.name);
    const bio = Number(metrics.biodegradabilityPct) || 0;
    const plant = Number(metrics.plantBasedPct) || 0;
    totalBiodegWeight += (pct * bio);
    totalPlantWeight += (pct * plant);
  }
  
  const bioRes = Math.round((totalBiodegWeight / totalPercent) * 10) / 10;
  const plantRes = Math.round((totalPlantWeight / totalPercent) * 10) / 10;

  return {
    biodegradabilityPct: isNaN(bioRes) ? 100 : bioRes,
    plantBasedPct: isNaN(plantRes) ? 100 : plantRes
  };
}

export interface EcoBreakdownItem {
  type: "deduction" | "bonus" | "neutral";
  points: number;
  label: string;
  reason: string;
}

export interface EcoBonus {
  name: string;
  type: string;
  value: number;
}

export interface EcoDeduction {
  name: string;
  type: string;
  value: number;
}

export interface EcoCertificationResult {
  name: "EU Ecolabel" | "US EPA Safer Choice" | "EcoLogo";
  status: "Eligible" | "Not Eligible" | "Requires Review";
  reasons: string[];
}

export interface ComplexEcoScoreResult {
  score: number; // 0-100
  biodegradabilityPct: number;
  plantBasedPct: number;
  breakdown: EcoBreakdownItem[];
  rating: "Poor" | "Moderate" | "Good" | "Excellent" | "Outstanding";
  description: string;
  bonuses: EcoBonus[];
  deductions: EcoDeduction[];
  ecoLabelEligibility: string[];
  certifications?: EcoCertificationResult[];
}

export function calculateComplexEcoScore(
  ingredients: Array<{ name: string; percentage: number; role?: string; hlbValue?: number | null }>
): ComplexEcoScoreResult {
  const totalPercent = ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);
  if (totalPercent === 0) {
    return {
      score: 100,
      biodegradabilityPct: 100,
      plantBasedPct: 100,
      breakdown: [],
      rating: "Outstanding",
      description: "Empty formulation has zero ecological footprint.",
      bonuses: [],
      deductions: [],
      ecoLabelEligibility: [],
      certifications: []
    };
  }

  const eco = calculateFormulationEcoMetrics(ingredients);
  let baseScore = eco.biodegradabilityPct;
  const breakdown: EcoBreakdownItem[] = [];
  const bonuses: EcoBonus[] = [];
  const deductions: EcoDeduction[] = [];

  let totalDeductions = 0;
  let totalBonuses = 0;

  ingredients.forEach(ing => {
    const pct = ing.percentage || 0;
    if (pct <= 0) return;

    const name = ing.name.toLowerCase();

    // 1. Penalty for EDTA & DTPA (highly persistent chelators)
    if (name.includes("edta") || name.includes("dtpa") || name.includes("diethylenetriamine") || name.includes("ethylenediaminetetraacetic")) {
      const deduction = Math.max(12, Math.round(15 * Math.max(1, pct)));
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name} Loading (${pct}%)`,
        reason: "Contains EDTA/DTPA, highly persistent non-biodegradable synthetic aminopolycarboxylate chelants that mobilize heavy metals in waterways."
      });
      deductions.push({
        name: `${ing.name} Loading (${pct}%)`,
        type: "Persistent Chelant",
        value: deduction
      });
    }

    // 2. Penalty for Phosphonates (e.g. HEDP, ATMP)
    if (name.includes("hedp") || name.includes("phosphonate") || name.includes("atmp") || name.includes("dtpmp")) {
      const deduction = Math.max(8, Math.round(10 * Math.max(1, pct)));
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name} Loading (${pct}%)`,
        reason: "Contains organophosphonates which contribute to phosphorus loading, eutrophication, and exhibit poor organic biodegradability."
      });
      deductions.push({
        name: `${ing.name} Loading (${pct}%)`,
        type: "Eutrophication Risk",
        value: deduction
      });
    }

    // 3. Penalty for NPE / APE surfactants
    if (name.includes("nonylphenol") || name.includes("np-9") || name.includes("np-6") || name.includes("np-10") || name.includes("alfox") || name.includes("apeo") || name.includes("npeo")) {
      const deduction = Math.max(25, Math.round(30 * Math.max(1, pct)));
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name} Loading (${pct}%)`,
        reason: "Contains alkylphenol ethoxylates (APEO/NPEO), which are endocrine disruptors, bioaccumulative, and highly toxic to aquatic life."
      });
      deductions.push({
        name: `${ing.name} Loading (${pct}%)`,
        type: "Ecotoxicity Hazard",
        value: deduction
      });
    }

    // 4. Penalty for non-biodegradable synthetic polymers / microplastics (Carbomer, Polyacrylate, Acrylic, PVP, Polyquaternium, Copolymer, PEG-150)
    if (name.includes("carbomer") || name.includes("polyacrylate") || name.includes("acrylic") || name.includes("pvp") || name.includes("polyquaternium") || name.includes("copolymer") || name.includes("peg-150")) {
      const deduction = Math.max(10, Math.round(12 * Math.max(1, pct)));
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name} Loading (${pct}%)`,
        reason: "Contains synthetic microplastic polymers which are non-biodegradable and persist permanently in wastewater sewage sludge."
      });
      deductions.push({
        name: `${ing.name} Loading (${pct}%)`,
        type: "Microplastics Persistence",
        value: deduction
      });
    }

    // 5. Penalty for Formaldehyde / Kathon / Isothiazolinone / Bio-toxic preservatives
    if (name.includes("formalin") || name.includes("formaldehyde") || name.includes("kathon") || name.includes("isothiazolinone") || name.includes("cmit") || name.includes("mit") || name.includes("bronopol") || name.includes("dmdm")) {
      const deduction = 15;
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name} Preservative`,
        reason: "Uses bio-toxic, sensitizing, or persistent organochlorine/isothiazolinone/formaldehyde preservatives regulated as acute aquatic hazards."
      });
      deductions.push({
        name: `${ing.name} Preservative`,
        type: "Bio-toxic Hazard",
        value: deduction
      });
    }

    // 6. Penalty for Optical Brighteners (CBS-X, Stilbenes, Fluorescent Whitening Agents)
    if (name.includes("brightener") || name.includes("cbs") || name.includes("tinopal") || name.includes("fluorescent") || name.includes("stilbene")) {
      const deduction = 15;
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name}`,
        reason: "Contains optical brightener (CBS-X/stilbene) which is a persistent, non-biodegradable fluorescent agent prone to aquatic accumulation."
      });
      deductions.push({
        name: `${ing.name}`,
        type: "Persistent Stilbene Phototoxin",
        value: deduction
      });
    }

    // 7. Penalty for Synthetic Dyes & Fragrance
    if ((name.includes("dye") || name.includes("color") || name.includes("perfume") || name.includes("fragrance")) && !name.includes("essential oil")) {
      const deduction = 5;
      totalDeductions += deduction;
      breakdown.push({
        type: "deduction",
        points: -deduction,
        label: `${ing.name}`,
        reason: "Contains synthetic dye or fragrance containing non-biodegradable aromatic compounds or VOCs."
      });
      deductions.push({
        name: `${ing.name}`,
        type: "Synthetic Dye/Fragrance",
        value: deduction
      });
    }

    // 8. Bonus for 100% Plant-Based Bio-surfactants (APGs, glucosides, soapnut)
    if (name.includes("glucoside") || name.includes("apg") || name.includes("soapnut") || name.includes("reetha") || name.includes("saponin")) {
      const bonus = Math.min(8, Math.round(4 * pct));
      if (bonus > 0) {
        totalBonuses += bonus;
        breakdown.push({
          type: "bonus",
          points: bonus,
          label: `${ing.name} Bio-surfactant`,
          reason: "Incorporates 100% plant-derived renewable carbon surfactants with outstanding, rapid biodegradability profile (OECD 301B: 100%)."
        });
        bonuses.push({
          name: `${ing.name} Bio-surfactant`,
          type: "100% Plant-Sourced",
          value: bonus
        });
      }
    }

    // 9. Bonus for green bio-builders (GLDA, MGDA, Gluconate)
    if (name.includes("glda") || name.includes("mgda") || name.includes("gluconate")) {
      const bonus = Math.min(6, Math.round(3 * pct));
      if (bonus > 0) {
        totalBonuses += bonus;
        breakdown.push({
          type: "bonus",
          points: bonus,
          label: `${ing.name} Green Chelator`,
          reason: "Uses highly biodegradable amino acid-based green builders, reducing environmental persistence compared to traditional EDTA."
        });
        bonuses.push({
          name: `${ing.name} Green Chelator`,
          type: "Rapidly Biodegradable",
          value: bonus
        });
      }
    }

    // 10. Bonus for enzymes
    if (name.includes("enzyme") || name.includes("protease") || name.includes("lipase") || name.includes("amylase") || name.includes("cellulase")) {
      totalBonuses += 5;
      breakdown.push({
        type: "bonus",
        points: 5,
        label: `${ing.name} Enzyme Active`,
        reason: "Uses natural protein biocatalysts which enhance cleaning performance at lower wash temperatures and fully degrade."
      });
      bonuses.push({
        name: `${ing.name} Enzyme Active`,
        type: "Biocatalyst",
        value: 5
      });
    }
  });

  let score = baseScore - totalDeductions + totalBonuses;
  score = Math.max(0, Math.min(100, score));

  const hasSevereViolation = ingredients.some(ing => {
    if (ing.percentage <= 0) return false;
    const metrics = getIngredientEcoMetrics(ing.name);
    const role = (ing.role || "").toLowerCase();
    const isSurfactant = role.includes("surfactant") || role.includes("detergent") || (ing.hlbValue !== undefined && ing.hlbValue !== null);
    return isSurfactant && metrics.biodegradabilityPct < 60;
  });

  if (hasSevereViolation) {
    const oldScore = score;
    score = Math.min(score, 45);
    const penaltyValue = oldScore - score;
    breakdown.push({
      type: "deduction",
      points: -penaltyValue,
      label: "Critical Ecotoxicity Penalty",
      reason: "Formula contains synthetic surfactants with a biodegradability index <60% (fails OECD 301 criteria for ready biodegradability)."
    });
    deductions.push({
      name: "Critical Ecotoxicity Penalty",
      type: "OECD 301 Violation",
      value: penaltyValue
    });
  }

  score = Math.round(score);

  let rating: "Poor" | "Moderate" | "Good" | "Excellent" | "Outstanding" = "Good";
  let description = "";

  if (score < 40) {
    rating = "Poor";
    description = "Eco-profile is heavily degraded by persistent or toxic synthetic ingredients. Regulated as hazardous to aquatic life with long-lasting effects.";
  } else if (score < 60) {
    rating = "Moderate";
    description = "Contains some green ingredients, but synthetic persistent chelating networks or toxic surfactants reduce its overall environmental performance.";
  } else if (score < 80) {
    rating = "Good";
    description = "Good ecological standard. Uses readily biodegradable materials, although some petro-chemically derived or non-renewable components are present.";
  } else if (score < 93) {
    rating = "Excellent";
    description = "Excellent environmental safety. Based on highly biodegradable plant extracts, green chelants, and low-impact active ingredients.";
  } else {
    rating = "Outstanding";
    description = "Outstanding bio-formulation! Formulated purely with sustainable, bio-sourced carbon and non-persistent minerals. Maximum environmental compatibility.";
  }

  // Comprehensive Eco-Label & Certification Eligibility Evaluation
  const certifications: EcoCertificationResult[] = [];

  // Identify restricted/prohibited ingredients across formulation
  const edtaOrDtpa = ingredients.filter(i => i.percentage > 0 && (i.name.toLowerCase().includes("edta") || i.name.toLowerCase().includes("dtpa") || i.name.toLowerCase().includes("diethylenetriamine") || i.name.toLowerCase().includes("ethylenediaminetetraacetic")));
  const npe = ingredients.filter(i => i.percentage > 0 && (i.name.toLowerCase().includes("nonylphenol") || i.name.toLowerCase().includes("np-9") || i.name.toLowerCase().includes("np-6") || i.name.toLowerCase().includes("np-10") || i.name.toLowerCase().includes("alfox") || i.name.toLowerCase().includes("apeo") || i.name.toLowerCase().includes("npeo")));
  const toxicPreservatives = ingredients.filter(i => i.percentage > 0 && (i.name.toLowerCase().includes("formalin") || i.name.toLowerCase().includes("formaldehyde") || i.name.toLowerCase().includes("kathon") || i.name.toLowerCase().includes("isothiazolinone") || i.name.toLowerCase().includes("cmit") || i.name.toLowerCase().includes("mit") || i.name.toLowerCase().includes("bronopol") || i.name.toLowerCase().includes("dmdm")));
  const opticalBrighteners = ingredients.filter(i => i.percentage > 0 && (i.name.toLowerCase().includes("brightener") || i.name.toLowerCase().includes("cbs") || i.name.toLowerCase().includes("tinopal") || i.name.toLowerCase().includes("fluorescent") || i.name.toLowerCase().includes("stilbene")));
  const nonBioPolymers = ingredients.filter(i => i.percentage > 0 && (i.name.toLowerCase().includes("polyacrylate") || i.name.toLowerCase().includes("carbomer") || i.name.toLowerCase().includes("pvp") || i.name.toLowerCase().includes("polyquaternium") || i.name.toLowerCase().includes("copolymer") || i.name.toLowerCase().includes("peg-150")));

  // 1. EU Ecolabel Evaluation
  const euReasons: string[] = [];
  if (opticalBrighteners.length > 0) euReasons.push(`Prohibited optical brighteners (${opticalBrighteners.map(i => i.name).join(", ")})`);
  if (edtaOrDtpa.length > 0) euReasons.push(`Prohibited chelants (${edtaOrDtpa.map(i => i.name).join(", ")})`);
  if (npe.length > 0) euReasons.push(`Prohibited APEO/NPEO surfactants (${npe.map(i => i.name).join(", ")})`);
  if (toxicPreservatives.length > 0) euReasons.push(`Restricted toxic preservatives (${toxicPreservatives.map(i => i.name).join(", ")})`);
  if (nonBioPolymers.length > 0) euReasons.push(`Restricted non-biodegradable polymers (${nonBioPolymers.map(i => i.name).join(", ")})`);
  if (score < 80) euReasons.push(`Overall Eco Score (${score}) below EU threshold (80)`);

  let euStatus: "Eligible" | "Not Eligible" | "Requires Review" = "Eligible";
  if (euReasons.length > 0) {
    euStatus = (opticalBrighteners.length > 0 || edtaOrDtpa.length > 0 || npe.length > 0 || toxicPreservatives.length > 0 || nonBioPolymers.length > 0 || score < 65)
      ? "Not Eligible"
      : "Requires Review";
  }

  certifications.push({
    name: "EU Ecolabel",
    status: euStatus,
    reasons: euReasons
  });

  // 2. US EPA Safer Choice Evaluation
  const epaReasons: string[] = [];
  if (opticalBrighteners.length > 0) epaReasons.push(`Non-SCIL optical brighteners (${opticalBrighteners.map(i => i.name).join(", ")})`);
  if (edtaOrDtpa.length > 0) epaReasons.push(`Unapproved persistent chelants (${edtaOrDtpa.map(i => i.name).join(", ")})`);
  if (npe.length > 0) epaReasons.push(`Prohibited APEO/NPEO (${npe.map(i => i.name).join(", ")})`);
  if (toxicPreservatives.length > 0) epaReasons.push(`Restricted sensitizing preservatives (${toxicPreservatives.map(i => i.name).join(", ")})`);
  if (nonBioPolymers.length > 0) epaReasons.push(`Non-SCIL microplastic polymers (${nonBioPolymers.map(i => i.name).join(", ")})`);
  if (score < 75) epaReasons.push(`Eco Score (${score}) below Safer Choice threshold (75)`);

  let epaStatus: "Eligible" | "Not Eligible" | "Requires Review" = "Eligible";
  if (epaReasons.length > 0) {
    epaStatus = (opticalBrighteners.length > 0 || edtaOrDtpa.length > 0 || npe.length > 0 || toxicPreservatives.length > 0 || nonBioPolymers.length > 0 || score < 60)
      ? "Not Eligible"
      : "Requires Review";
  }

  certifications.push({
    name: "US EPA Safer Choice",
    status: epaStatus,
    reasons: epaReasons
  });

  // 3. EcoLogo Evaluation
  const ecoLogoReasons: string[] = [];
  if (npe.length > 0) ecoLogoReasons.push(`Prohibited APEO/NPEO (${npe.map(i => i.name).join(", ")})`);
  if (edtaOrDtpa.length > 0) ecoLogoReasons.push(`Prohibited EDTA/DTPA (${edtaOrDtpa.map(i => i.name).join(", ")})`);
  if (opticalBrighteners.length > 0) ecoLogoReasons.push(`Prohibited optical brighteners (${opticalBrighteners.map(i => i.name).join(", ")})`);
  if (toxicPreservatives.length > 0) ecoLogoReasons.push(`Restricted toxic preservatives (${toxicPreservatives.map(i => i.name).join(", ")})`);
  if (nonBioPolymers.length > 0) ecoLogoReasons.push(`Restricted synthetic polymers (${nonBioPolymers.map(i => i.name).join(", ")})`);
  if (score < 70) ecoLogoReasons.push(`Eco Score (${score}) below threshold (70)`);

  let ecoLogoStatus: "Eligible" | "Not Eligible" | "Requires Review" = "Eligible";
  if (ecoLogoReasons.length > 0) {
    ecoLogoStatus = (npe.length > 0 || edtaOrDtpa.length > 0 || opticalBrighteners.length > 0 || toxicPreservatives.length > 0 || nonBioPolymers.length > 0 || score < 55)
      ? "Not Eligible"
      : "Requires Review";
  }

  certifications.push({
    name: "EcoLogo",
    status: ecoLogoStatus,
    reasons: ecoLogoReasons
  });

  const ecoLabelEligibility = certifications.filter(c => c.status === "Eligible").map(c => c.name);

  return {
    score,
    biodegradabilityPct: eco.biodegradabilityPct,
    plantBasedPct: eco.plantBasedPct,
    breakdown,
    rating,
    description,
    bonuses,
    deductions,
    ecoLabelEligibility,
    certifications
  };
}

export function calculateCorrectedEcoRating(ingredients: { name: string; percentage: number; role?: string; hlbValue?: number | null }[]): number {
  if (!ingredients || ingredients.length === 0) return 100;
  return calculateComplexEcoScore(ingredients).score;
}

// 8. Green Chelator & Co-Builder Stoichiometry Calculator
export interface GreenChelatorInput {
  waterHardnessPpm: number; // ppm as CaCO3
  washVolumeL: number; // in Liters
  washDoseGrams: number; // standard wash dose in grams
  safetyMarginPct: number; // safety sequestering margin %
  coBuilderTargetPct: number; // threshold target % of stoichiometric requirement (e.g. 10%)
  maxFormulationCapPct: number; // maximum formulation cap (e.g. 3.0%)
}

export interface ChelatorDetail {
  id: string;
  name: string;
  bindingCapacity: number; // mg CaCO3/g
  isEstimated: boolean;
  citation: string;
  verificationLevel: "Verified Standard" | "Estimated (Lab Validation Required)";
  theoreticalSequestrationGrams: number; // Grams required for 100% sequestration
  coBuilderTargetGrams: number; // Grams required for threshold (e.g. 10%)
  calculatedWeightPct: number; // Weight % in formula to hit co-builder target
  practicalWeightPct: number; // Weight % after formulation cap is applied
  practicalWeightGrams: number; // Weight in dose (g) based on capped %
}

export interface GreenChelatorResult {
  totalCaCO3ToBindMg: number;
  stoichiometricTargetMg: number;
  chelators: ChelatorDetail[];
}

export function calculateGreenChelators(input: GreenChelatorInput): GreenChelatorResult {
  const {
    waterHardnessPpm,
    washVolumeL,
    washDoseGrams,
    safetyMarginPct,
    coBuilderTargetPct,
    maxFormulationCapPct
  } = input;

  const totalCaCO3ToBindMg = waterHardnessPpm * washVolumeL;
  const stoichiometricTargetMg = totalCaCO3ToBindMg * (1 + safetyMarginPct / 100);

  const chelatorsData = [
    {
      id: "glda",
      name: "GLDA-47 (Dissolvine GL-47)",
      bindingCapacity: 137,
      isEstimated: false,
      citation: "Standard industrial specification for Tetrasodium Glutamate Diacetate 47% liquid at typical neutral/alkaline laundry formulation pH values (8.0 - 10.0).",
      verificationLevel: "Verified Standard" as const
    },
    {
      id: "mgda",
      name: "MGDA-Na3 (Trilon M 40%)",
      bindingCapacity: 148,
      isEstimated: false,
      citation: "Industrial specification for Trisodium Methylglycinediacetate 40% liquid solution. High Ca2+/Mg2+ binding capacity and rapid biodegradability.",
      verificationLevel: "Verified Standard" as const
    },
    {
      id: "edta",
      name: "Tetrasodium EDTA (40% Liquid)",
      bindingCapacity: 105,
      isEstimated: false,
      citation: "Standard industrial specification for EDTA-4Na liquid solution (40% active). Strong hexadentate Ca2+ chelant.",
      verificationLevel: "Verified Standard" as const
    },
    {
      id: "citrate",
      name: "Sodium Citrate Dihydrate",
      bindingCapacity: 150,
      isEstimated: true,
      citation: "Approximate technical estimate. Complexation constants of citrate are highly sensitive to solution pH, temperature, and ionic strength.",
      verificationLevel: "Estimated (Lab Validation Required)" as const
    },
    {
      id: "gluconate",
      name: "Sodium Gluconate",
      bindingCapacity: 76,
      isEstimated: true,
      citation: "Approximate technical estimate. Binding efficiency of gluconate peaks in strongly alkaline systems and is significantly lower at laundry wash pH.",
      verificationLevel: "Estimated (Lab Validation Required)" as const
    },
    {
      id: "stpp",
      name: "STPP (Sodium Tripolyphosphate)",
      bindingCapacity: 300,
      isEstimated: false,
      citation: "Inorganic builder with high calcium sequestration (300 mg CaCO3/g) and dirt dispersing capability.",
      verificationLevel: "Verified Standard" as const
    }
  ];

  const chelators: ChelatorDetail[] = chelatorsData.map(c => {
    // 1. Theoretical Chelator Grams required for 100% stoichiometric sequestration
    const theoreticalSequestrationGrams = stoichiometricTargetMg / c.bindingCapacity;

    // 2. Co-Builder Target Demand (threshold target, e.g. 10%)
    const coBuilderTargetGrams = theoreticalSequestrationGrams * (coBuilderTargetPct / 100);

    // 3. Calculated formulation weight % to meet that target in standard wash dose
    const calculatedWeightPct = washDoseGrams > 0 ? (coBuilderTargetGrams / washDoseGrams) * 100 : 0;

    // 4. Practical weight % after applying the max formulation cap (e.g. 3.0%)
    const practicalWeightPct = Math.min(calculatedWeightPct, maxFormulationCapPct);

    // 5. Capped weight in grams
    const practicalWeightGrams = (practicalWeightPct / 100) * washDoseGrams;

    return {
      id: c.id,
      name: c.name,
      bindingCapacity: c.bindingCapacity,
      isEstimated: c.isEstimated,
      citation: c.citation,
      verificationLevel: c.verificationLevel,
      theoreticalSequestrationGrams: Math.round(theoreticalSequestrationGrams * 1000) / 1000,
      coBuilderTargetGrams: Math.round(coBuilderTargetGrams * 1000) / 1000,
      calculatedWeightPct: Math.round(calculatedWeightPct * 100) / 100,
      practicalWeightPct: Math.round(practicalWeightPct * 100) / 100,
      practicalWeightGrams: Math.round(practicalWeightGrams * 1000) / 1000
    };
  });

  return {
    totalCaCO3ToBindMg,
    stoichiometricTargetMg,
    chelators
  };
}

export interface BlendedHLBInput {
  name: string;
  percentage: number;
  hlbValue?: number | null;
  activeMatterPct?: number | null;
  role?: string;
}

export function calculateBlendedHLB(ingredients: BlendedHLBInput[]): number | null {
  let weightedSum = 0;
  let totalActiveSurfactantPct = 0;
  
  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const name = ing.name.toLowerCase();
    const chem = getChemicalData(ing.name);
    let hlbVal = ing.hlbValue;
    if ((hlbVal === null || hlbVal === undefined) && chem?.hlb) {
      const parsed = parseFloat(chem.hlb);
      if (!isNaN(parsed) && parsed > 0) hlbVal = parsed;
    }
    const isSurfactant = ing.role?.toLowerCase().includes("surfactant") || 
                         name.includes("glucoside") || 
                         name.includes("ethoxylate") || 
                         name.includes("sles") || 
                         name.includes("labsa") || 
                         name.includes("capb") || 
                         name.includes("tween") || 
                         name.includes("span") || 
                         name.includes("aos") || 
                         name.includes("bkc") || 
                         name.includes("oxide") || 
                         name.includes("sulfosuccinate") || 
                         name.includes("sarcosinate") || 
                         name.includes("isethionate") || 
                         (hlbVal !== null && hlbVal !== undefined);

    if (isSurfactant && hlbVal !== null && hlbVal !== undefined && hlbVal > 0 && ing.percentage > 0) {
      const activePurity = ing.activeMatterPct !== undefined && ing.activeMatterPct !== null ? ing.activeMatterPct : 100;
      // active_weight = percentage * activePurity
      const activeWeight = ing.percentage * activePurity;
      weightedSum += activeWeight * hlbVal;
      totalActiveSurfactantPct += activeWeight;
    }
  });

  if (totalActiveSurfactantPct === 0) return null;
  return Number((weightedSum / totalActiveSurfactantPct).toFixed(1));
}

export function getPreservativeWarning(ingName: string, pH: number): { type: "error" | "warning"; message: string } | null {
  if (!ingName) return null;
  const name = ingName.toLowerCase();
  
  const isPreservative = name.includes("benzoate") || 
                         name.includes("sorbate") || 
                         name.includes("formalin") || 
                         name.includes("formaldehyde") || 
                         name.includes("kathon") || 
                         name.includes("phenoxyethanol") || 
                         name.includes("benzyl alcohol") ||
                         name.includes("preservative");
                         
  if (!isPreservative) return null;

  if (name.includes("benzoate") || name.includes("sorbate")) {
    if (pH > 5.5) {
      return {
        type: "error",
        message: `Inactive above pH 5.5 (Current pH: ${pH}). Warning: Under-preserved formula`
      };
    }
  }

  if (name.includes("formalin") || name.includes("formaldehyde")) {
    return {
      type: "warning",
      message: `Formaldehyde release risk. Carcinogenic hazard. Recommendation: Replace with safe eco-friendly alternatives (such as Sodium Benzoate at pH <5.5 or Benzyl Alcohol).`
    };
  }

  if (name.includes("benzyl alcohol")) {
    if (pH > 8.0) {
      return {
        type: "error",
        message: `Inactive above pH 8.0 (Current pH: ${pH}).`
      };
    }
  }

  if (name.includes("kathon")) {
    if (pH > 9.0) {
      return {
        type: "error",
        message: `Inactive above pH 9.0 (Current pH: ${pH}).`
      };
    }
  }

  return null;
}

export function getTargetPHRange(productType: string, formulaName: string): { min: number; max: number; label: string } {
  const type = (productType || "").toLowerCase();
  const name = (formulaName || "").toLowerCase();
  
  if (type.includes("dish") || name.includes("dish")) {
    return { min: 6.5, max: 7.5, label: "6.5 - 7.5" };
  } else if (type.includes("degreaser") || name.includes("degreaser")) {
    return { min: 10.5, max: 11.5, label: "10.5 - 11.5" };
  } else if (type.includes("softener") || type.includes("conditioner") || name.includes("softener")) {
    return { min: 3.0, max: 5.0, label: "3.0 - 5.0" };
  } else if (type.includes("anti-foam") || type.includes("antifoam") || type.includes("defoamer") || name.includes("defoam")) {
    return { min: 6.5, max: 7.5, label: "6.5 - 7.5" };
  } else {
    // default laundry
    return { min: 7.5, max: 8.5, label: "7.5 - 8.5" };
  }
}

export function getAlkaliPurity(name: string, activeMatterPct: number | undefined | null): number {
  if (!name) return 100;

  // 1. If activeMatterPct is explicitly provided and valid, prioritize it
  if (activeMatterPct !== undefined && activeMatterPct !== null && !isNaN(activeMatterPct) && activeMatterPct > 0) {
    return activeMatterPct;
  }

  const chem = getChemicalData(name);
  if (chem?.purityPct && chem.purityPct > 0) {
    return chem.purityPct;
  }

  const nameLower = name.toLowerCase();

  // 2. If there is a pattern like "@ X% purity" or "at X% purity" or "@ X%"
  const atPurityRegex = /@\s*(\d+(?:\.\d+)?)\s*%/;
  const atPurityMatch = nameLower.match(atPurityRegex);
  if (atPurityMatch) {
    return parseFloat(atPurityMatch[1]);
  }

  // 3. If there is "purity X%" or "concentration X%" or "active X%"
  const purityRegex = /(?:purity|concentration|active|active\s+matter)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*%/;
  const purityMatch = nameLower.match(purityRegex);
  if (purityMatch) {
    return parseFloat(purityMatch[1]);
  }

  // 4. Look for a percentage in the name associated with alkali or acid keywords
  const naohPctRegex = /(?:naoh|caustic|sodium hydroxide|koh|potassium hydroxide|soda ash|carbonate|triethanolamine|tea|labsa|sulfonic acid|acid slurry)\s*(?:lye|flakes|solution|paste|active)?\s*\(?(\d+(?:\.\d+)?)\s*%/i;
  const naohPctMatch = name.match(naohPctRegex);
  if (naohPctMatch) {
    return parseFloat(naohPctMatch[1]);
  }

  // 5. Look for general percentage in parentheses, e.g. "(48%)" or "(50%)" or "(90%)"
  const parenPctRegex = /\((\d+(?:\.\d+)?)\s*%\)/;
  const parenPctMatch = nameLower.match(parenPctRegex);
  if (parenPctMatch) {
    return parseFloat(parenPctMatch[1]);
  }

  // 6. Look for any general percentage matches
  const generalPctRegex = /(\d+(?:\.\d+)?)\s*%/g;
  const matches = [...nameLower.matchAll(generalPctRegex)];
  if (matches.length > 0) {
    for (let i = matches.length - 1; i >= 0; i--) {
      const val = parseFloat(matches[i][1]);
      if (val > 10) {
        return val;
      }
    }
    return parseFloat(matches[0][1]);
  }

  // 7. Standard defaults based on names
  if (nameLower.includes("naoh") || nameLower.includes("caustic") || nameLower.includes("sodium hydroxide")) {
    if (nameLower.includes("33")) return 33.0;
    if (nameLower.includes("50")) return 50.0;
    if (nameLower.includes("98") || nameLower.includes("flake") || nameLower.includes("solid") || nameLower.includes("dry")) {
      return 98.0;
    }
    if (nameLower.includes("lye") || nameLower.includes("solution") || nameLower.includes("liquid")) {
      return 50.0;
    }
    return 98.0;
  }

  if (nameLower.includes("koh") || nameLower.includes("potassium hydroxide")) {
    if (nameLower.includes("flake") || nameLower.includes("solid")) {
      return 90.0;
    }
    return 50.0;
  }

  if (nameLower.includes("labsa") || nameLower.includes("sulfonic acid") || nameLower.includes("acid slurry")) {
    return 90.0;
  }

  if (nameLower.includes("soda ash") || nameLower.includes("carbonate")) {
    return 99.0;
  }

  if (nameLower.includes("tea") || nameLower.includes("triethanolamine")) {
    return 99.0;
  }

  return 100.0;
}

export function calculateNeutralizationState(ingredients: { name: string; percentage: number; activeMatterPct: number }[]) {
  let molesLABSA = 0;
  let molesNaOH = 0;
  let molesKOH = 0;
  let molesTEA = 0;
  let molesSodaAsh = 0;
  let hasAcidBase = false;

  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const name = ing.name.toLowerCase();
    const pct = ing.percentage;
    const active = getAlkaliPurity(ing.name, ing.activeMatterPct);

    if (name.includes("labsa") || name.includes("sulfonic acid") || name.includes("acid slurry")) {
      hasAcidBase = true;
      molesLABSA += (pct * (active / 100)) / 326.49;
    } else if (name.includes("naoh") || name.includes("caustic") || name.includes("sodium hydroxide")) {
      hasAcidBase = true;
      molesNaOH += (pct * (active / 100)) / 40.0;
    } else if (name.includes("koh") || name.includes("potassium hydroxide")) {
      hasAcidBase = true;
      molesKOH += (pct * (active / 100)) / 56.11;
    } else if (name.includes("tea") || name.includes("triethanolamine")) {
      hasAcidBase = true;
      molesTEA += (pct * (active / 100)) / 149.19;
    } else if (name.includes("soda ash") || name.includes("carbonate") || name.includes("sodium carbonate")) {
      hasAcidBase = true;
      molesSodaAsh += (pct * (active / 100)) / 105.99;
    }
  });

  const totalAcidEquivs = molesLABSA;
  const totalAlkaliEquivs = molesNaOH + molesKOH + molesTEA + molesSodaAsh * 2;

  return {
    totalLABSA90Equiv: totalAcidEquivs * 326.49 * (100 / 90),
    totalAlkaliCapacity: totalAlkaliEquivs * 40.0 * 7.48,
    hasAcidBase
  };
}

export interface PHResult {
  estpH: number;
  isDivergent: boolean;
  targetPHLabel: string;
  warning?: string;
  confidence: "High" | "Medium" | "Low";
  confidenceReason: string;
  bufferCapacity: number;
  equivalentsAcid: number;
  equivalentsBase: number;
}

export function calculateEstimatedPH(
  productType: string,
  formulaName: string,
  ingredients: { name: string; percentage: number; activeMatterPct?: number }[]
): PHResult {
  const targetRange = getTargetPHRange(productType, formulaName);
  const targetCenter = (targetRange.min + targetRange.max) / 2;

  // Map ingredients for PHEngine
  const mappedIngredients = (ingredients || []).map(ing => ({
    name: ing.name,
    rawPercent: ing.percentage || 0,
    activePercent: getAlkaliPurity(ing.name, ing.activeMatterPct)
  }));

  // Run authoritative PHEngine equilibrium calculation
  const engineResult = sharedPHEngine.calculatePH(mappedIngredients, 100, targetCenter);

  // Compute stoichiometric equivalents for metadata & backward compatibility
  let molesStrongAcid = 0;
  let molesWeakAcid = 0;
  let molesStrongBase = 0;
  let molesWeakBase = 0;
  let molesSodaAsh = 0;
  let molesBicarbonate = 0;
  let molesSilicate = 0;
  let molesMEA = 0;
  let molesTEA = 0;
  let molesCitric = 0;

  let pctSodiumCitrate = 0;
  let pctSodiumGluconate = 0;
  let pctAmphoterics = 0;
  let hasAcidBase = false;

  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const name = ing.name.toLowerCase();
    const pct = ing.percentage || 0;
    if (pct <= 0) return;

    const active = getAlkaliPurity(ing.name, ing.activeMatterPct);
    const weightInFormula = pct * (active / 100);

    // Strong Acids
    if (name.includes("hcl") || name.includes("hydrochloric")) {
      hasAcidBase = true;
      molesStrongAcid += weightInFormula / 36.46;
    } else if (name.includes("sulfuric acid")) {
      hasAcidBase = true;
      molesStrongAcid += (weightInFormula / 98.08) * 2;
    } else if (name.includes("labsa") || name.includes("sulfonic acid") || name.includes("acid slurry")) {
      hasAcidBase = true;
      molesStrongAcid += weightInFormula / 326.49;
    } else if (name.includes("methanesulfonic") || name.includes("msa")) {
      hasAcidBase = true;
      molesStrongAcid += weightInFormula / 96.10;
    }
    // Weak Acids
    else if (name.includes("phosphoric")) {
      hasAcidBase = true;
      molesWeakAcid += (weightInFormula / 98.00) * 2;
    } else if (name.includes("sulfamic")) {
      hasAcidBase = true;
      molesWeakAcid += weightInFormula / 97.09;
    } else if (name.includes("citric acid")) {
      hasAcidBase = true;
      molesCitric += weightInFormula / 192.12;
      molesWeakAcid += (weightInFormula / 192.12) * 3;
    } else if (name.includes("oxalic")) {
      hasAcidBase = true;
      molesWeakAcid += (weightInFormula / 90.03) * 2;
    } else if (name.includes("hedp") || name.includes("etidronic")) {
      hasAcidBase = true;
      molesWeakAcid += (weightInFormula / 206.02) * 3;
    } else if (name.includes("lactic") || name.includes("acetic") || name.includes("glycolic") || name.includes("formic")) {
      hasAcidBase = true;
      molesWeakAcid += weightInFormula / 90.0;
    }
    // Strong Bases
    else if (name.includes("naoh") || name.includes("caustic soda") || name.includes("sodium hydroxide")) {
      hasAcidBase = true;
      molesStrongBase += weightInFormula / 40.0;
    } else if (name.includes("koh") || name.includes("caustic potash") || name.includes("potassium hydroxide")) {
      hasAcidBase = true;
      molesStrongBase += weightInFormula / 56.11;
    }
    // Weak Bases
    else if (name.includes("soda ash") || name.includes("sodium carbonate") || (name.includes("carbonate") && !name.includes("bicarbonate") && !name.includes("percarbonate") && !name.includes("speckle"))) {
      hasAcidBase = true;
      molesSodaAsh += weightInFormula / 105.99;
      molesWeakBase += (weightInFormula / 105.99) * 2;
    } else if (name.includes("bicarbonate") || name.includes("baking soda")) {
      hasAcidBase = true;
      molesBicarbonate += weightInFormula / 84.01;
      molesWeakBase += weightInFormula / 84.01;
    } else if (name.includes("silicate") || name.includes("metasilicate")) {
      hasAcidBase = true;
      molesSilicate += weightInFormula / 122.06;
      molesWeakBase += (weightInFormula / 122.06) * 2;
    } else if (name.includes("mea") || name.includes("monoethanolamine")) {
      hasAcidBase = true;
      molesMEA += weightInFormula / 61.08;
      molesWeakBase += weightInFormula / 61.08;
    } else if (name.includes("tea") || name.includes("triethanolamine")) {
      hasAcidBase = true;
      molesTEA += weightInFormula / 149.19;
      molesWeakBase += weightInFormula / 149.19;
    } else if (name.includes("sodium citrate") || name.includes("potassium citrate") || name.includes("trisodium citrate")) {
      pctSodiumCitrate += pct;
    } else if (name.includes("gluconate")) {
      pctSodiumGluconate += pct;
    } else if (
      name.includes("betaine") || name.includes("capb") ||
      name.includes("amphoacetate") || name.includes("amphodiacetate") ||
      name.includes("oxide") || name.includes("ldao") || name.includes("sultaine")
    ) {
      pctAmphoterics += pct;
    }
  });

  const totalAcidEquivs = molesStrongAcid + molesWeakAcid;
  const totalBaseEquivs = molesStrongBase + molesWeakBase;

  // Authoritative pH from PHEngine if acid/base neutralizers exist or PHEngine computed valid pH
  let estpH = engineResult && !isNaN(engineResult.pH) && isFinite(engineResult.pH) ? engineResult.pH : targetCenter;

  // Non-neutralizing systems fallback heuristics
  if (!hasAcidBase && (!engineResult || engineResult.solverUsed === 'stoichiometric_fallback')) {
    const activeNames = ingredients.filter(i => (i.percentage || 0) > 0).map(i => i.name.toLowerCase());
    const hasAcidThickener = activeNames.some(n => n.includes("acid thickener"));
    const hasCitricAcid = activeNames.some(n => n.includes("citric acid"));
    const hasSoftenerQuat = activeNames.some(n => n.includes("esterquat") || n.includes("conditioning active") || n.includes("softening active"));

    if (hasAcidThickener) {
      estpH = 1.0;
    } else if (hasCitricAcid) {
      estpH = 3.5;
    } else if (hasSoftenerQuat) {
      estpH = 4.0;
    } else {
      estpH = targetCenter || 7.0;
    }
  }

  // Round to 1 decimal place
  if (isNaN(estpH) || !isFinite(estpH)) {
    estpH = targetCenter || 7.0;
  }
  estpH = Math.round(estpH * 10) / 10;

  // Divergence check (> 0.3 pH units from target range)
  const isDivergent = estpH < targetRange.min - 0.3 || estpH > targetRange.max + 0.3;

  let warning: string | undefined;
  if (isDivergent) {
    warning = `Estimated pH (${estpH}) diverges from Target pH range (${targetRange.label}) by >0.3 units. Check neutralization ratios.`;
  }

  const confidence = engineResult.solverConverged ? "High" : (hasAcidBase ? "Medium" : "Low");
  const confidenceReason = engineResult.solverConverged
    ? `Calculated using PHEngine production equilibrium solver (${engineResult.solverUsed}).`
    : "Estimated from ingredient role heuristics alone (no active neutralizers found).";

  const rawBufferCapacity = (engineResult.bufferCapacity || 0) + (pctSodiumCitrate * 0.15 + pctSodiumGluconate * 0.10 + pctAmphoterics * 0.08 + molesBicarbonate * 85 + molesSodaAsh * 50 + molesSilicate * 60);
  const bufferCapacity = isNaN(rawBufferCapacity) ? 0 : Number(rawBufferCapacity.toFixed(3));
  const equivalentsAcid = isNaN(totalAcidEquivs) ? 0 : Number(totalAcidEquivs.toFixed(5));
  const equivalentsBase = isNaN(totalBaseEquivs) ? 0 : Number(totalBaseEquivs.toFixed(5));

  return {
    estpH,
    isDivergent,
    targetPHLabel: targetRange.label,
    warning,
    confidence,
    confidenceReason,
    bufferCapacity,
    equivalentsAcid,
    equivalentsBase
  };
}

export interface BuilderCapacityDetail {
  name: string;
  percentage: number;
  capacityPerGram: number; // mg CaCO3 / g pure active
  activeMatterPct: number;
  contributionPpm: number; // mg/L in wash
  mmolCaBound: number;
  boundCaMg: number; // mg CaCO3 bound in dose
}

export interface WaterHardnessToleranceResult {
  builders: BuilderCapacityDetail[];
  totalTolerancePpm: number;
  maxSupportedPpm: number;
  totalMmolCaBound: number;
  rating: "Poor" | "Adequate" | "Good" | "Excellent";
  description: string;
  germanHardnessDh: number;
  frenchHardnessFh: number;
  washDoseGrams: number;
  washVolumeLiters: number;
}

export function calculateWaterHardnessTolerance(
  ingredients: Array<{ name: string; percentage: number; role?: string; activeMatterPct?: number }>
): WaterHardnessToleranceResult {
  const builders: BuilderCapacityDetail[] = [];
  let totalTolerancePpm = 0;
  let totalMmolCaBound = 0;

  const washDoseGrams = 100; // 100g product per wash
  const washVolumeLiters = 10; // 10L wash water

  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const name = ing.name.toLowerCase();
    const pct = ing.percentage || 0;
    if (pct <= 0) return;

    let capacityPerGramActive = 0; // mg CaCO3 / g of active material

    if (name.includes("dtpa") || name.includes("diethylenetriamine") || name.includes("pentetate")) {
      capacityPerGramActive = 199; // mg CaCO3 / g pure active DTPA-5Na
    } else if (name.includes("glda") || name.includes("glutamate diacetate") || name.includes("dissolvine")) {
      capacityPerGramActive = 291; // mg CaCO3 / g pure active GLDA-Na4
    } else if (name.includes("mgda") || name.includes("methylglycinediacetic") || name.includes("trilon m")) {
      capacityPerGramActive = 370; // mg CaCO3 / g pure active MGDA-Na3
    } else if (name.includes("edta") || name.includes("ethylenediaminetetra")) {
      if (name.includes("disodium") || name.includes("2na")) {
        capacityPerGramActive = 298; // mg CaCO3 / g pure active Disodium EDTA
      } else if (name.includes("acid") || name.includes("h4edta")) {
        capacityPerGramActive = 342; // mg CaCO3 / g pure active EDTA Acid
      } else {
        capacityPerGramActive = 263; // mg CaCO3 / g pure active Tetrasodium EDTA
      }
    } else if (name.includes("citric acid")) {
      capacityPerGramActive = 220; // mg CaCO3 / g citric acid
    } else if (name.includes("citrate")) {
      capacityPerGramActive = 150; // mg CaCO3 / g sodium citrate
    } else if (name.includes("gluconate")) {
      capacityPerGramActive = 76; // mg CaCO3 / g sodium gluconate
    } else if (name.includes("hedp") || name.includes("atmp") || name.includes("dtpmp") || name.includes("phosphonate") || name.includes("alltime")) {
      capacityPerGramActive = 417; // mg CaCO3 / g active phosphonate / Alltime DF
    } else if (name.includes("shmp") || name.includes("hexametaphosphate")) {
      capacityPerGramActive = 420; // mg CaCO3 / g SHMP
    } else if (name.includes("nta") || name.includes("nitrilotriacet")) {
      capacityPerGramActive = 389; // mg CaCO3 / g pure active NTA
    } else if (name.includes("stpp") || name.includes("tripolyphosphate")) {
      capacityPerGramActive = 300; // mg CaCO3 / g STPP
    } else if (name.includes("zeolite")) {
      capacityPerGramActive = 120; // mg CaCO3 / g Zeolite
    } else if (name.includes("soda ash") || name.includes("carbonate")) {
      capacityPerGramActive = 38; // mg CaCO3 / g sodium carbonate
    } else if (name.includes("metasilicate") || name.includes("silicate")) {
      capacityPerGramActive = 19; // mg CaCO3 / g silicate
    } else if (name.includes("borax") || name.includes("suhaga")) {
      capacityPerGramActive = 45; // mg CaCO3 / g borax
    } else if (name.includes("bicarbonate") || name.includes("baking soda")) {
      capacityPerGramActive = 15; // mg CaCO3 / g sodium bicarbonate
    } else {
      const role = ing.role || (ing as any).rdRole || (ing as any).function || "";
      const category = getAuditedIngredientCategory(ing.name, role);
      if (category === "Builders & Chelators" || category === "Chelating Agents") {
        capacityPerGramActive = 80;
      }
    }

    if (capacityPerGramActive > 0) {
      let activeMatter = getDefaultActiveMatter(ing.name);
      if (ing.activeMatterPct !== undefined && ing.activeMatterPct !== null && !isNaN(Number(ing.activeMatterPct)) && Number(ing.activeMatterPct) > 0) {
        activeMatter = Number(ing.activeMatterPct);
      } else if ((ing as any).active !== undefined && (ing as any).active !== null && !isNaN(Number((ing as any).active)) && Number((ing as any).active) > 0) {
        activeMatter = Number((ing as any).active);
      }

      const gramsRaw = (pct / 100) * washDoseGrams;
      const gramsActive = gramsRaw * (activeMatter / 100);
      const boundCaMg = gramsActive * capacityPerGramActive;
      const contributionPpm = boundCaMg / washVolumeLiters;
      const mmolCa = boundCaMg / 100.09;

      builders.push({
        name: ing.name,
        percentage: pct,
        capacityPerGram: capacityPerGramActive,
        activeMatterPct: activeMatter,
        contributionPpm: Number(contributionPpm.toFixed(3)),
        mmolCaBound: Number(mmolCa.toFixed(3)),
        boundCaMg: Number(boundCaMg.toFixed(2))
      });

      totalTolerancePpm += contributionPpm;
      totalMmolCaBound += mmolCa;
    }
  });

  builders.forEach(b => {
    const builderKgInWash = (b.percentage / 100) * (washDoseGrams / 1000);
    const capacityMgPerGram = b.capacityPerGram || 0;
    const contributionPpm = (capacityMgPerGram * builderKgInWash * 1000) / washVolumeLiters;
    b.contributionPpm = contributionPpm;
  });

  totalTolerancePpm = builders.reduce((sum, b) => sum + b.contributionPpm, 0);

  const maxSupportedPpm = Number(totalTolerancePpm.toFixed(1));
  const totalMmolCaBoundRounded = Number(totalMmolCaBound.toFixed(2));

  // 1 ppm = 0.056 dH (German degrees) = 0.1 fH (French degrees)
  const germanHardnessDh = Number((maxSupportedPpm * 0.056).toFixed(2));
  const frenchHardnessFh = Number((maxSupportedPpm * 0.1).toFixed(2));

  let rating: "Poor" | "Adequate" | "Good" | "Excellent" = "Poor";
  let description = "";

  if (maxSupportedPpm <= 3.0) {
    rating = "Poor";
    description = `No or minimal chelators/builders detected (${maxSupportedPpm} ppm CaCO₃ / ${germanHardnessDh}°dH; binds only ${totalMmolCaBoundRounded} mmol Ca²⁺ per standard wash dose). Highly vulnerable to mineral precipitation and soap scum in hard water.`;
  } else if (maxSupportedPpm <= 15.0) {
    rating = "Adequate";
    description = `Adequate builder/chelator capacity (${maxSupportedPpm} ppm CaCO₃ / ${germanHardnessDh}°dH; binds ${totalMmolCaBoundRounded} mmol Ca²⁺ per standard wash dose). Suitable for slightly to moderately hard water, but may suffer performance loss in very hard water.`;
  } else if (maxSupportedPpm <= 30.0) {
    rating = "Good";
    description = `Good builder/chelator capacity (${maxSupportedPpm} ppm CaCO₃ / ${germanHardnessDh}°dH; binds ${totalMmolCaBoundRounded} mmol Ca²⁺ per standard wash dose). Efficiently prevents mineral scale and maintains surfactant performance in standard hard water.`;
  } else {
    rating = "Excellent";
    description = `Excellent builder/chelator capacity (${maxSupportedPpm} ppm CaCO₃ / ${germanHardnessDh}°dH; binds ${totalMmolCaBoundRounded} mmol Ca²⁺ per standard wash dose). Robust protection against mineral scaling and performance drops in extremely hard water.`;
  }

  return {
    builders,
    totalTolerancePpm: maxSupportedPpm,
    maxSupportedPpm,
    totalMmolCaBound: totalMmolCaBoundRounded,
    rating,
    description,
    germanHardnessDh,
    frenchHardnessFh,
    washDoseGrams,
    washVolumeLiters
  };
}

export function getInciName(name: string): string {
  if (!name) return "";
  
  const normalized = name.trim().toLowerCase();
  
  // Hand-crafted standard mappings for common detergent ingredients in the database
  if (normalized.includes("water") || normalized.includes("aqua") || normalized.includes("carrier")) {
    return "Aqua";
  }
  if (normalized.includes("sles") || normalized.includes("sodium laureth sulfate")) {
    return "Sodium Laureth Sulfate";
  }
  if (normalized.includes("labsa") || normalized.includes("acid slurry") || normalized.includes("sulfonic acid")) {
    return "Linear Alkylbenzene Sulfonic Acid";
  }
  if (normalized.includes("capb") || normalized.includes("cocamidopropyl betaine")) {
    return "Cocamidopropyl Betaine";
  }
  if (normalized.includes("soda ash") || normalized.includes("sodium carbonate")) {
    return "Sodium Carbonate";
  }
  if (normalized.includes("caustic soda") || normalized.includes("sodium hydroxide")) {
    return "Sodium Hydroxide";
  }
  if (normalized.includes("caustic potash") || normalized.includes("potassium hydroxide")) {
    return "Potassium Hydroxide";
  }
  if (normalized.includes("citric acid")) {
    return "Citric Acid";
  }
  if (normalized.includes("sodium citrate")) {
    return "Sodium Citrate";
  }
  if (normalized.includes("sodium chloride") || normalized === "salt") {
    return "Sodium Chloride";
  }
  if (normalized.includes("acid blue 9") || normalized.includes("patent blue") || normalized.includes("blue dye")) {
    return "CI 42090";
  }
  if (normalized.includes("fluorescein") || normalized.includes("acid yellow 73")) {
    return "CI 45350";
  }
  if (normalized.includes("perfume") || normalized.includes("fragrance") || normalized === "scent") {
    return "Parfum";
  }
  if (normalized.includes("methyl paraben") || normalized.includes("methylparaben")) {
    return "Methylparaben";
  }
  if (normalized.includes("propyl paraben") || normalized.includes("propylparaben")) {
    return "Propylparaben";
  }
  if (normalized.includes("phenoxyethanol")) {
    return "Phenoxyethanol";
  }
  if (normalized.includes("dmdm")) {
    return "DMDM Hydantoin";
  }
  if (normalized.includes("cde") || normalized.includes("cocamide dea")) {
    return "Cocamide DEA";
  }
  if (normalized.includes("apg") || normalized.includes("decyl glucoside")) {
    return "Decyl Glucoside";
  }
  if (normalized.includes("lauryl glucoside")) {
    return "Lauryl Glucoside";
  }
  if (normalized.includes("coco glucoside") || normalized.includes("coco-glucoside")) {
    return "Coco-Glucoside";
  }
  if (normalized.includes("stpp")) {
    return "Pentasodium Triphosphate";
  }
  if (normalized.includes("glda")) {
    return "Tetrasodium Glutamate Diacetate";
  }
  if (normalized.includes("mgda")) {
    return "Trisodium Dicarboxymethyl Alaninate";
  }
  if (normalized.includes("edta")) {
    return "Tetrasodium EDTA";
  }
  if (normalized.includes("hec") || normalized.includes("hydroxyethyl")) {
    return "Hydroxyethylcellulose";
  }
  if (normalized.includes("cmc") || normalized.includes("carboxymethyl")) {
    return "Sodium Carboxymethyl Cellulose";
  }
  if (normalized.includes("xanthan")) {
    return "Xanthan Gum";
  }
  if (normalized.includes("carbomer")) {
    return "Carbomer";
  }
  
  // Otherwise clean up standard loading suffixes e.g., "SLES (70%)" -> "SLES"
  return name.replace(/\s*\(\d+%\)\s*/g, "").trim();
}

export interface AlkaliConsumptionResult {
  consumedPercentages: { [ingredientName: string]: number };
  freePercentages: { [ingredientName: string]: number };
}

export function calculateAlkaliConsumption(ingredients: { name: string; percentage: number; activeMatterPct?: number }[]): AlkaliConsumptionResult {
  let totalAcidEquivalents = 0;
  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const name = ing.name.toLowerCase();
    const pct = ing.percentage || 0;
    const active = getAlkaliPurity(ing.name, ing.activeMatterPct);
    
    if (name.includes("labsa") || name.includes("sulfonic acid") || name.includes("acid slurry")) {
      const factor = 0.00334 * (active / 90);
      totalAcidEquivalents += pct * factor;
    } else if (name.includes("citric acid")) {
      const factor = 3 * (active / 100) / 192.12;
      totalAcidEquivalents += pct * factor;
    } else if (name.includes("acid") && !name.includes("amino") && !name.includes("fatty") && !name.includes("versene") && !name.includes("edta")) {
      const factor = 1 * (active / 100) / 150;
      totalAcidEquivalents += pct * factor;
    }
  });

  interface AlkaliItem {
    name: string;
    originalPct: number;
    eqPerGram: number;
    baseEquivalents: number;
  }

  const alkalis: AlkaliItem[] = [];

  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const name = ing.name.toLowerCase();
    const pct = ing.percentage || 0;
    if (pct <= 0) return;
    const active = getAlkaliPurity(ing.name, ing.activeMatterPct);

    let eqPerGram = 0;
    if (name.includes("naoh") || name.includes("caustic soda") || name.includes("sodium hydroxide")) {
      eqPerGram = (active / 100) / 40.0;
    } else if (name.includes("koh") || name.includes("potassium hydroxide")) {
      eqPerGram = (active / 100) / 56.11;
    } else if (name.includes("tea") || name.includes("triethanolamine")) {
      eqPerGram = (active / 100) / 149.19;
    } else if (name.includes("mea") || name.includes("monoethanolamine")) {
      eqPerGram = (active / 100) / 61.08;
    } else if (name.includes("dea") || name.includes("diethanolamine")) {
      eqPerGram = (active / 100) / 105.14;
    } else if (name.includes("soda ash") || name.includes("sodium carbonate") || (name.includes("carbonate") && !name.includes("bicarbonate"))) {
      eqPerGram = 2 * (active / 100) / 105.99;
    } else if (name.includes("bicarbonate") || name.includes("sodium bicarbonate")) {
      eqPerGram = 1 * (active / 100) / 84.01;
    }

    if (eqPerGram > 0) {
      alkalis.push({
        name: ing.name,
        originalPct: pct,
        eqPerGram,
        baseEquivalents: pct * eqPerGram
      });
    }
  });

  const getAlkaliPriority = (name: string): number => {
    const n = name.toLowerCase();
    if (n.includes("naoh") || n.includes("caustic") || n.includes("sodium hydroxide") || n.includes("koh") || n.includes("potassium hydroxide")) {
      return 1;
    }
    if (n.includes("soda ash") || n.includes("carbonate")) {
      return 2;
    }
    if (n.includes("mea") || n.includes("monoethanolamine") || n.includes("tea") || n.includes("triethanolamine") || n.includes("dea") || n.includes("diethanolamine")) {
      return 3;
    }
    return 4;
  };

  alkalis.sort((a, b) => getAlkaliPriority(a.name) - getAlkaliPriority(b.name));

  let remainingAcidEquivalents = totalAcidEquivalents;
  const consumedPercentages: { [name: string]: number } = {};
  const freePercentages: { [name: string]: number } = {};

  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const isAlkali = alkalis.some(a => a.name === ing.name);
    if (isAlkali) {
      consumedPercentages[ing.name] = 0;
      freePercentages[ing.name] = ing.percentage;
    }
  });

  alkalis.forEach(alkali => {
    if (remainingAcidEquivalents <= 0) {
      consumedPercentages[alkali.name] = 0;
      freePercentages[alkali.name] = alkali.originalPct;
      return;
    }

    if (alkali.baseEquivalents <= remainingAcidEquivalents) {
      consumedPercentages[alkali.name] = alkali.originalPct;
      freePercentages[alkali.name] = 0;
      remainingAcidEquivalents -= alkali.baseEquivalents;
    } else {
      const fractionConsumed = remainingAcidEquivalents / alkali.baseEquivalents;
      const consumedPct = alkali.originalPct * fractionConsumed;
      consumedPercentages[alkali.name] = consumedPct;
      freePercentages[alkali.name] = alkali.originalPct - consumedPct;
      remainingAcidEquivalents = 0;
    }
  });

  return { consumedPercentages, freePercentages };
}

export interface ShelfLifeResult {
  months: number;
  confidence: "High" | "Medium" | "Low";
  rating: "Poor" | "Adequate" | "Good" | "Excellent";
  description: string;
  limitingFactor: string;
  preservativeEfficiency: number; // 0-100%
  waterActivityEst: number; // 0.0 - 1.0
  reasons: string[];
}

export function calculateShelfLife(
  ingredients: Array<{ name: string; percentage: number; role?: string; activeMatterPct?: number }>,
  pH: number,
  isEmulsion: boolean = false
): ShelfLifeResult {
  let months = 24; // standard default
  const reasons: string[] = [];
  let limitingFactor = "Standard chemical stability limit for industrial detergent formulations.";

  // 1. Water Activity Estimation
  let waterPct = 100;
  let totalActiveSolids = 0;
  let electrolytePct = 0;

  ingredients.forEach(ing => {
    const pct = ing.percentage || 0;
    const name = ing.name.toLowerCase();
    if (name.includes("water") || name.includes("aqua") || name.includes("carrier")) {
      waterPct = pct;
    } else {
      const active = ing.activeMatterPct !== undefined ? ing.activeMatterPct : getDefaultActiveMatter(ing.name);
      totalActiveSolids += pct * (active / 100);
    }
    if (name.includes("salt") || name.includes("sodium chloride") || name.includes("electrolyte") || name.includes("sulfate") || name.includes("carbonate")) {
      electrolytePct += pct;
    }
  });

  // Raoult's-like estimation of water activity
  const totalWaterGrams = waterPct > 0 ? waterPct : 100 - totalActiveSolids;
  const ionicSolutesFactor = (electrolytePct / 58.44) * 2; // NaCl equivs
  const nonIonicSolutesFactor = ((totalActiveSolids - electrolytePct) / 350); // organic equivs
  const molesWater = totalWaterGrams / 18.015;
  const totalMoles = molesWater + ionicSolutesFactor + nonIonicSolutesFactor;
  let waterActivityEst = totalMoles > 0 ? molesWater / totalMoles : 1.0;
  waterActivityEst = Math.max(0.70, Math.min(1.0, waterActivityEst));

  // 2. Preservative System Evaluation
  let hasIsothiazolinone = false; // BIT/MIT
  let bitMitLoading = 0;
  let hasFormalin = false;
  let hasBenzoate = false;
  let benzoateLoading = 0;
  let hasPhenoxyethanol = false;
  let phenoxyethanolLoading = 0;
  let hasParabens = false;
  let hasChelator = false;

  ingredients.forEach(ing => {
    const name = ing.name.toLowerCase();
    const pct = ing.percentage || 0;
    if (pct <= 0) return;

    if (name.includes("isothiazolinone") || name.includes("bit 20") || name.includes("mit 10") || name.includes("kathon") || name.includes("mit/bit") || name.includes("methylisothiazolinone")) {
      hasIsothiazolinone = true;
      bitMitLoading += pct;
    } else if (name.includes("formalin") || name.includes("formaldehyde")) {
      hasFormalin = true;
    } else if (name.includes("benzoate") || name.includes("sodium benzoate")) {
      hasBenzoate = true;
      benzoateLoading += pct;
    } else if (name.includes("phenoxyethanol")) {
      hasPhenoxyethanol = true;
      phenoxyethanolLoading += pct;
    } else if (name.includes("paraben")) {
      hasParabens = true;
    }

    if (name.includes("edta") || name.includes("glda") || name.includes("mgda") || name.includes("citrate")) {
      hasChelator = true;
    }
  });

  // Preservative efficiency calculation
  let preservativeEfficiency = 0;

  if (hasFormalin) {
    preservativeEfficiency = 100; // formalin is broad-spectrum, aggressive, and stable in a wide pH range
    reasons.push("Formaldehyde-releasing system provides complete broad-spectrum biocidal protection.");
  } else if (hasIsothiazolinone) {
    if (pH <= 8.5) {
      preservativeEfficiency = 95;
      reasons.push("MIT/BIT system provides robust protection in stable pH range (pH <= 8.5).");
    } else {
      preservativeEfficiency = 30; // decomposes at high pH
      reasons.push("MIT/BIT efficiency is severely degraded due to high pH (> 8.5) alkaline hydrolysis.");
    }
  } else if (hasBenzoate) {
    if (pH <= 5.0) {
      preservativeEfficiency = 90;
      reasons.push("Sodium Benzoate is highly effective as undissociated benzoic acid at pH < 5.0.");
    } else if (pH <= 5.5) {
      preservativeEfficiency = 65;
      reasons.push("Sodium Benzoate efficiency is moderately reduced at pH 5.0 - 5.5.");
    } else {
      preservativeEfficiency = 5; // completely inactive as benzoate ion
      reasons.push("Sodium Benzoate is completely inactive due to alkaline pH (> 5.5) dissociation.");
    }
  } else if (hasPhenoxyethanol) {
    preservativeEfficiency = 75;
    reasons.push("Phenoxyethanol provides stable anti-microbial coverage but is weak against fungi without a co-preservative.");
  }

  // Synergistic bonus for chelators (chelators disrupt bacterial cell walls)
  if (hasChelator && preservativeEfficiency > 0) {
    preservativeEfficiency = Math.min(100, preservativeEfficiency + 10);
    reasons.push("Chelating agents synergistically disrupt microbial cell membranes, boosting preservative efficacy.");
  }

  // Adjust shelf life based on findings
  if (waterActivityEst < 0.85) {
    months = 36;
    limitingFactor = "Extremely low water activity (highly concentrated / high salt system) inhibits microbial proliferation natively.";
    reasons.push("Concentrated salt/electrolyte content provides native osmotic microbial stabilization.");
  } else if (preservativeEfficiency === 0) {
    months = 3;
    limitingFactor = "Absence of active, pH-compatible preservatives in high water-activity medium.";
    reasons.push("High risk of rapid Gram-negative bacterial, yeast, and mold spoilage within 90 days.");
  } else if (preservativeEfficiency < 40) {
    months = 6;
    limitingFactor = "Preservative system is chemically inactive or degraded under the formulation's pH conditions.";
    reasons.push("Sub-optimal preservation limits commercial shelf life to 6 months.");
  } else if (preservativeEfficiency < 75) {
    months = 12;
    limitingFactor = "Mild preservative coverage with potential vulnerability over time.";
    reasons.push("Adequate short-term protection, but vulnerable to open-container secondary contamination.");
  } else {
    months = 24;
    limitingFactor = "Preservative system is robust, stable, and completely active.";
  }

  // Chemical decomposition of active ingredients (pH extremes)
  if (pH > 11.5 || pH < 2.0) {
    months = Math.min(months, 12);
    limitingFactor = "Extreme pH promotes slow chemical hydrolysis of active surfactants (e.g., ester quats, alkyl ether sulfates) over time.";
    reasons.push("Aqueous hydrolysis of ether sulfates or esters occurs at extreme pH values.");
  }

  // Emulsion physical stability (HLB unbalance)
  if (isEmulsion) {
    months = Math.min(months, 12);
    limitingFactor = "Thermodynamic separation risk inherent to macroemulsions.";
    reasons.push("Emulsion physical stability requires continuous rheology monitoring.");
  }

  // Database chemical parameter physical/thermal audits
  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const chem = getChemicalData(ing.name);
    if (!chem) return;

    if (chem.krafftPoint) {
      reasons.push(`Krafft Temperature check (${chem.commonName}): Krafft point is ${chem.krafftPoint}. Ensure storage stays above Krafft boundary to avoid surfactant crystallization.`);
    }

    if (chem.cloudPoint) {
      reasons.push(`Cloud Point check (${chem.commonName}): Cloud point is ${chem.cloudPoint}. Operating above cloud point causes nonionic surfactant phase separation.`);
    }

    if (chem.oxidationStability && chem.oxidationStability.toLowerCase().includes("low")) {
      months = Math.min(months, 12);
      reasons.push(`Oxidation risk (${chem.commonName}): Low oxidation stability. Antioxidant addition recommended for long-term storage.`);
    }

    if (chem.bufferCapacity && chem.bufferCapacity.toLowerCase().includes("high")) {
      reasons.push(`Buffer stability (${chem.commonName}): High buffer capacity stabilizes pH against atmospheric drift.`);
    }
  });

  let rating: "Poor" | "Adequate" | "Good" | "Excellent" = "Poor";
  if (months <= 6) rating = "Poor";
  else if (months <= 12) rating = "Adequate";
  else if (months <= 18) rating = "Good";
  else rating = "Excellent";

  return {
    months,
    confidence: preservativeEfficiency > 80 ? "High" : preservativeEfficiency > 40 ? "Medium" : "Low",
    rating,
    description: `Predicted Shelf Life: ${months} Months. ${limitingFactor}`,
    limitingFactor,
    preservativeEfficiency,
    waterActivityEst: Number(waterActivityEst.toFixed(3)),
    reasons
  };
}

export interface ViscosityResult {
  viscosityCp: number; // estimated viscosity in cP
  minViscosityCp: number;
  maxViscosityCp: number;
  confidence: "High" | "Medium" | "Low";
  rating: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  description: string;
  reasons: string[];
}

export function calculateDetailedViscosity(
  ingredients: Array<{ name: string; percentage: number; role?: string; activeMatterPct?: number }>
): ViscosityResult {
  const reasons: string[] = [];
  
  let activeAnionic = 0;
  let activeAmphoteric = 0;
  let activeNonionic = 0;

  let saltNaCl = 0;
  let otherElectrolytes = 0;

  let polyGelling = 0;     // Carbomer, Xanthan, Guar
  let polyAssociative = 0; // HEC, HPMC, CMC, PEG-150, PEG-120, Cocamide DEA/CMEA
  let polyLow = 0;         // Polyacrylate, Polyquaternium, PVP

  let solventsAndHydrotropes = 0; // PG, Glycerin, Ethanol, SXS, SCS, Urea
  let waterPct = 0;
  let totalExplicitPct = 0;

  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    const pct = ing.percentage || 0;
    if (pct <= 0) return;

    totalExplicitPct += pct;
    const name = ing.name.toLowerCase();
    const active = ing.activeMatterPct !== undefined && ing.activeMatterPct !== null && ing.activeMatterPct > 0 
      ? ing.activeMatterPct 
      : getDefaultActiveMatter(ing.name);
    const activePct = pct * (active / 100);

    // Water continuous phase
    if (name.includes("water") || name.includes("aqua") || name.includes("demineralized")) {
      waterPct += pct;
      return;
    }

    // Surfactants
    if (name.includes("sles") || name.includes("laureth sulfate") || name.includes("sls") || name.includes("labsa") || name.includes("sulfonic acid") || name.includes("aos") || name.includes("olefin sulfonate")) {
      activeAnionic += activePct;
    } else if (name.includes("capb") || name.includes("betaine") || name.includes("oxide") || name.includes("amphoacetate") || name.includes("sultaine")) {
      activeAmphoteric += activePct;
    } else if (name.includes("glucoside") || name.includes("apg") || name.includes("ethoxylate") || name.includes("pareth") || name.includes("nonylphenol") || name.includes("np-9") || name.includes("polysorbate")) {
      activeNonionic += activePct;
    } else if (name.includes("cocamide dea") || name.includes("cmea") || name.includes("diethanolamide") || name.includes("monoethanolamide")) {
      activeNonionic += activePct;
      polyAssociative += pct;
    }

    // Electrolytes
    if (name.includes("salt") || name.includes("sodium chloride") || name.includes("nacl")) {
      saltNaCl += pct;
    } else if (name.includes("sulfate") && !name.includes("laureth") && !name.includes("lauryl")) {
      otherElectrolytes += pct * 0.8;
    } else if (name.includes("citrate")) {
      otherElectrolytes += pct * 0.5;
    } else if (name.includes("carbonate") || name.includes("soda ash")) {
      otherElectrolytes += pct * 0.5;
    } else if (name.includes("formate") || name.includes("acetate")) {
      otherElectrolytes += pct * 0.6;
    }

    // Thickeners & Polymers
    if (name.includes("carbomer") || name.includes("xanthan") || name.includes("guar") || name.includes("acrylates crosspolymer")) {
      polyGelling += pct;
    } else if (name.includes("hec") || name.includes("hpmc") || name.includes("cmc") || name.includes("cellulose") || name.includes("peg-150") || name.includes("peg-120") || name.includes("acid thickener")) {
      polyAssociative += pct;
    } else if (name.includes("polyacrylate") || name.includes("acrylic") || name.includes("polyquaternium") || name.includes("pvp")) {
      polyLow += pct;
    }

    // Solvents & Hydrotropes
    if (name.includes("propylene glycol") || name.includes("glycerin") || name.includes("glycerine") || name.includes("ethanol") || name.includes("isopropanol") || name.includes("ipa") || name.includes("dipropylene glycol") || name.includes("hexylene glycol") || name.includes("glycol ether") || name.includes("butyl glycol")) {
      solventsAndHydrotropes += pct;
    } else if (name.includes("xylene sulfonate") || name.includes("sxs") || name.includes("cumene sulfonate") || name.includes("urea")) {
      solventsAndHydrotropes += pct * 1.5;
    }
  });

  if (waterPct === 0) {
    waterPct = Math.max(10, 100 - (totalExplicitPct - waterPct));
  }

  const totalActiveSurfactant = activeAnionic + activeAmphoteric + activeNonionic;

  // 1. Micellar Base Viscosity
  let vMicelle = 1.0;
  if (totalActiveSurfactant > 0) {
    if (totalActiveSurfactant <= 5) {
      vMicelle = 1.0 + totalActiveSurfactant * 2.0;
    } else if (totalActiveSurfactant <= 25) {
      vMicelle = 15.0 + Math.pow(totalActiveSurfactant - 5, 1.5) * 8.0;
    } else {
      vMicelle = 150.0 + Math.pow(totalActiveSurfactant - 25, 1.8) * 25.0;
    }
    reasons.push(`Base micellar crowding from ${totalActiveSurfactant.toFixed(1)}% active surfactants.`);
  }

  // 2. Electrolyte (Salt) Screening Effect
  const totalElectrolyte = saltNaCl + otherElectrolytes;
  let vSaltBoost = 0;

  if (activeAnionic > 0 && totalElectrolyte > 0) {
    const eOpt = Math.max(0.8, 2.0 - 0.25 * Math.min(4, activeAmphoteric));
    const peakBoost = (activeAnionic * 60) * (1 + 0.4 * Math.min(3, activeAmphoteric));

    if (totalElectrolyte <= eOpt + 0.8) {
      const normalizedDist = (totalElectrolyte - eOpt) / eOpt;
      const factor = Math.exp(-2.5 * normalizedDist * normalizedDist);
      vSaltBoost = peakBoost * factor;
      reasons.push(`Electrolyte micellar screening (${totalElectrolyte.toFixed(1)}% effective salts) boosts viscosity by ~${Math.round(vSaltBoost)} cP.`);
    } else {
      // Over-salted collapse
      const overSalt = totalElectrolyte - (eOpt + 0.8);
      vSaltBoost = peakBoost * 0.1 * Math.exp(-overSalt);
      reasons.push(`Salt-out / over-salted region reached (${totalElectrolyte.toFixed(1)}% total salts), suppressing rod micelle alignment.`);
    }
  }

  // 3. Polymers & Thickeners
  let vPolymer = 0;
  if (polyGelling > 0) {
    const add = Math.pow(polyGelling, 1.8) * 4000;
    vPolymer += add;
    reasons.push(`High-efficiency gel polymer network (${polyGelling.toFixed(1)}%) adding ~${Math.round(add)} cP.`);
  }
  if (polyAssociative > 0) {
    const add = Math.pow(polyAssociative, 1.6) * 1500;
    vPolymer += add;
    reasons.push(`Associative polymer / cellulosic thickening (${polyAssociative.toFixed(1)}%) adding ~${Math.round(add)} cP.`);
  }
  if (polyLow > 0) {
    const add = Math.pow(polyLow, 1.3) * 220;
    vPolymer += add;
    reasons.push(`Functional polymer contribution (${polyLow.toFixed(1)}%) adding ~${Math.round(add)} cP.`);
  }

  // 4. Solvent Thinning
  const fSolvent = 1.0 / (1.0 + 0.10 * solventsAndHydrotropes + 0.02 * Math.pow(solventsAndHydrotropes, 2));
  if (solventsAndHydrotropes > 0) {
    reasons.push(`Solvents / hydrotropes (${solventsAndHydrotropes.toFixed(1)}%) reduce micellar entanglements (thinning factor: ${fSolvent.toFixed(2)}).`);
  }

  // 5. Water Content / Concentrated System Effect
  let fWater = 1.0;
  if (waterPct < 55) {
    fWater = Math.pow(70 / Math.max(20, waterPct), 1.3);
    reasons.push(`Concentrated system low water content (${waterPct.toFixed(1)}%) increases packing density.`);
  } else if (waterPct > 90) {
    fWater = Math.max(0.3, waterPct / 90);
  }

  const rawViscosity = (vMicelle + vSaltBoost + vPolymer) * fSolvent * fWater;
  const viscosityCp = Math.max(1, Math.round(rawViscosity));
  const minViscosityCp = Math.max(1, Math.round(viscosityCp * 0.75));
  const maxViscosityCp = Math.round(viscosityCp * 1.25);

  let rating: "Very Low" | "Low" | "Medium" | "High" | "Very High" = "Low";
  if (viscosityCp < 50) rating = "Very Low";
  else if (viscosityCp < 250) rating = "Low";
  else if (viscosityCp < 1200) rating = "Medium";
  else if (viscosityCp < 4000) rating = "High";
  else rating = "Very High";

  let confidence: "High" | "Medium" | "Low" = "Medium";
  let description = "";

  if (polyGelling > 0 || polyAssociative > 0) {
    confidence = "High";
    description = `Estimated Viscosity: ~${viscosityCp} cP (Range: ${minViscosityCp}-${maxViscosityCp} cP). Confidently predicted by polymer network entanglement model.`;
  } else if (activeAnionic > 0 && totalElectrolyte > 0) {
    confidence = "Medium";
    description = `Estimated Viscosity: ~${viscosityCp} cP (Range: ${minViscosityCp}-${maxViscosityCp} cP). Predicted via surfactant-salt micellar screening curve.`;
  } else {
    confidence = "Low";
    description = `Estimated Viscosity: ~${viscosityCp} cP (Range: ${minViscosityCp}-${maxViscosityCp} cP). Low confidence prediction from simple micellar crowding limits.`;
  }

  return {
    viscosityCp,
    minViscosityCp,
    maxViscosityCp,
    confidence,
    rating,
    description,
    reasons
  };
}

export interface PerformanceBreakdown {
  category: string;
  score: number; // 0-100
  rating: string;
  details: string;
}

export interface CleaningPerformanceResult {
  cleaningScore: number; // 0-100 (Detergency performance in soft/distilled water)
  overallScore: number; // 0-100 (Overall CPI performance under 150 ppm hard water)
  rating: "Poor" | "Fair" | "Good" | "Very Good" | "Outstanding";
  surfactantSynergyScore: number;
  greaseRemovalScore: number;
  particulateRemovalScore: number;
  soilAntiRedepositionScore: number;
  surfactantSynergy: number;
  greaseRemoval: number;
  particulateDispersion: number;
  enzymaticPower: number;
  hardWaterTolerance: number;
  breakdown: PerformanceBreakdown[];
  description: string;
}

export function calculateCleaningPerformance(
  ingredients: Array<{ name: string; percentage: number; role?: string; activeMatterPct?: number }>,
  pH: number = 7.5,
  hardnessResult?: WaterHardnessToleranceResult
): CleaningPerformanceResult {
  const hr = hardnessResult || calculateWaterHardnessTolerance(ingredients);
  let anionicActive = 0;
  let nonionicActive = 0;
  let amphotericActive = 0;
  let foamBoostersActive = 0;
  let enzymesPct = 0;
  let polymersPct = 0;
  let solventPct = 0;
  let totalActiveSurfactants = 0;

  ingredients.forEach(ing => {
    const pct = ing.percentage || 0;
    if (pct <= 0) return;
    const name = ing.name.toLowerCase();
    const active = ing.activeMatterPct !== undefined ? ing.activeMatterPct : getDefaultActiveMatter(ing.name);
    const activePct = pct * (active / 100);

    const category = getAuditedIngredientCategory(ing.name);

    if (category === "Surfactants (Anionic)") {
      anionicActive += activePct;
      totalActiveSurfactants += activePct;
    } else if (category === "Surfactants (Nonionic)") {
      nonionicActive += activePct;
      totalActiveSurfactants += activePct;
    } else if (category === "Surfactants (Amphoteric)") {
      amphotericActive += activePct;
      totalActiveSurfactants += activePct;
    } else if (category === "Amine Oxide Foam Boosters") {
      foamBoostersActive += activePct;
      totalActiveSurfactants += activePct;
    } else if (category === "Enzymes") {
      enzymesPct += pct;
    } else if (category === "Polymers & Thickeners" || name.includes("cmc")) {
      polymersPct += pct;
    } else if (name.includes("limonene") || name.includes("pine oil") || name.includes("solvent")) {
      solventPct += pct;
    }
  });

  // 1. Surfactant Synergy Score (Anionic-Nonionic ratio is crucial)
  let surfactantSynergyScore = 0;
  if (totalActiveSurfactants > 0) {
    const totalRatioVal = anionicActive + nonionicActive;
    if (totalRatioVal > 0) {
      const ratioAnionic = anionicActive / totalRatioVal; // 0.0 to 1.0
      const devFromPeak = Math.abs(ratioAnionic - 0.625);
      const ratioScore = Math.max(0, 100 - (devFromPeak * 120));
      surfactantSynergyScore = ratioScore;
    } else {
      surfactantSynergyScore = 40;
    }
    if (amphotericActive > 0 || foamBoostersActive > 0) {
      surfactantSynergyScore = Math.min(100, surfactantSynergyScore + 15);
    }
  }

  // 2. Grease Removal (highly promoted by pH and Nonionic surfactants)
  let greaseRemovalScore = 0;
  if (totalActiveSurfactants > 0) {
    const nonionicFraction = nonionicActive / (totalActiveSurfactants + 0.001);
    const nonionicBase = nonionicFraction * 60 + (nonionicActive > 0 ? 25 : 0);
    const phBase = pH > 9.5 ? 40 : pH > 8.0 ? 25 : pH >= 6.5 ? 15 : 5;
    const solventBase = Math.min(20, solventPct * 15);
    greaseRemovalScore = Math.min(100, nonionicBase + phBase + solventBase);
  }

  // 3. Particulate/Clay Removal (Anionics and Builders are key)
  let particulateRemovalScore = 0;
  if (totalActiveSurfactants > 0) {
    const anionicBase = (anionicActive / (totalActiveSurfactants + 0.001)) * 50 + (anionicActive > 0 ? 20 : 0);
    const chelatorBase = Math.min(30, (hr.maxSupportedPpm / 35) * 30);
    particulateRemovalScore = Math.min(100, anionicBase + chelatorBase);
  }

  // 4. Soil Anti-Redeposition (Polymers HEC/CMC prevent soil redeposition on fabrics)
  let soilAntiRedepositionScore = 10; // baseline
  if (polymersPct > 0) {
    soilAntiRedepositionScore = Math.min(100, 15 + polymersPct * 45);
  } else if (totalActiveSurfactants > 0) {
    soilAntiRedepositionScore = 30; // some native surfactant suspension
  }

  // 5. Enzyme Boosters
  let enzymeBoost = Math.min(25, enzymesPct * 15);

  // Hard water discount
  const hardWaterPpm = 150;
  let hardWaterPenalty = 0;
  if (hr.maxSupportedPpm < hardWaterPpm) {
    const deficit = hardWaterPpm - hr.maxSupportedPpm;
    hardWaterPenalty = Math.min(40, (deficit / hardWaterPpm) * 40);
  }

  let totalActiveFactor = Math.min(1.0, totalActiveSurfactants / 15.0); // full scaling at 15% active surfactants
  let rawScore = (
    surfactantSynergyScore * 0.30 +
    greaseRemovalScore * 0.35 +
    particulateRemovalScore * 0.25 +
    soilAntiRedepositionScore * 0.10
  );

  const cleaningScore = Math.max(1, Math.min(100, Math.round(rawScore * totalActiveFactor + enzymeBoost)));
  let overallScore = rawScore * totalActiveFactor + enzymeBoost - hardWaterPenalty;
  overallScore = Math.max(1, Math.min(100, Math.round(overallScore)));

  const breakdown: PerformanceBreakdown[] = [
    {
      category: "Surfactant Synergy",
      score: Math.round(surfactantSynergyScore),
      rating: surfactantSynergyScore > 85 ? "Outstanding" : surfactantSynergyScore > 70 ? "Good" : "Sub-optimal",
      details: `Calculated from Anionic (${anionicActive.toFixed(1)}% active) vs Nonionic (${nonionicActive.toFixed(1)}% active) molar headgroup balance. CAPB/AO stabilization included.`
    },
    {
      category: "Grease & Oil Emulsification",
      score: Math.round(greaseRemovalScore),
      rating: greaseRemovalScore > 80 ? "Excellent" : greaseRemovalScore > 60 ? "Moderate" : "Weak",
      details: `Governed by nonionic emulsifiers, alkali saponification (pH: ${pH}), and solvent grease-cutters.`
    },
    {
      category: "Particulate Dispersion",
      score: Math.round(particulateRemovalScore),
      rating: particulateRemovalScore > 80 ? "Excellent" : particulateRemovalScore > 60 ? "Moderate" : "Weak",
      details: `Binds inorganic soils and carbon black. Dependent on anionic surfactants and builder CaCO₃ chelation strength.`
    },
    {
      category: "Soil Anti-Redeposition",
      score: Math.round(soilAntiRedepositionScore),
      rating: soilAntiRedepositionScore > 75 ? "Excellent" : soilAntiRedepositionScore > 40 ? "Moderate" : "Weak",
      details: `Prevents soil redeposition. Cellulose polymer (CMC/HEC) network adsorption prevents graying.`
    }
  ];

  if (enzymesPct > 0) {
    breakdown.push({
      category: "Enzymatic Proteolysis",
      score: Math.round(Math.min(100, enzymeBoost * 4)),
      rating: "Active Boost",
      details: `Protein, starch, and lipid stain hydrolysis from ${enzymesPct.toFixed(2)}% active multi-enzyme complex.`
    });
  }

  if (hardWaterPenalty > 0) {
    breakdown.push({
      category: "Divalent Cation Interference",
      score: Math.round(hardWaterPenalty),
      rating: "Penalty Applied",
      details: `Loss of ${hardWaterPenalty.toFixed(1)} points due to surfactant precipitation/calcium soap scum under 150 ppm water hardness.`
    });
  }

  let rating: "Poor" | "Fair" | "Good" | "Very Good" | "Outstanding" = "Good";
  let description = "";

  if (overallScore < 30) {
    rating = "Poor";
    description = "Extremely weak detergent action. Very low surfactant concentration, un-neutralized active acids, or total lack of builders in hard water.";
  } else if (overallScore < 55) {
    rating = "Fair";
    description = "Light-duty performance. Suitable for delicate hand-wash but lacks grease-cutting or particulate dispersion power for heavily soiled fabrics.";
  } else if (overallScore < 75) {
    rating = "Good";
    description = "Good standard formulation. Provides reliable everyday soil removal under normal wash cycles, but may struggle with deep clay or aged oil stains.";
  } else if (overallScore < 90) {
    rating = "Very Good";
    description = "Highly competitive professional formulation. Balanced anionic/nonionic systems with solid builder networks and anti-redeposition polymers.";
  } else {
    rating = "Outstanding";
    description = "Outstanding industrial grade performance! Fully synergized surfactant blend, robust chelation, active soil dispersing polymers, and enzyme complexes.";
  }

  return {
    cleaningScore,
    overallScore,
    rating,
    surfactantSynergyScore: Math.round(surfactantSynergyScore),
    greaseRemovalScore: Math.round(greaseRemovalScore),
    particulateRemovalScore: Math.round(particulateRemovalScore),
    soilAntiRedepositionScore: Math.round(soilAntiRedepositionScore),
    surfactantSynergy: Math.round(surfactantSynergyScore),
    greaseRemoval: Math.round(greaseRemovalScore),
    particulateDispersion: Math.round(particulateRemovalScore),
    enzymaticPower: Math.round(enzymeBoost),
    hardWaterTolerance: hr.maxSupportedPpm,
    breakdown,
    description
  };
}

// ============================================================================
// 12. Dynamic Compatibility Engine & Manufacturing Instructions Generator
// ============================================================================

export interface CompatibilityAlert {
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  reason: string;
  recommendation?: string;
}

export function calculateFormulationCompatibility(
  ingredients: any[],
  estpH?: number
): { compatibilityScore: number; alerts: CompatibilityAlert[] } {
  const alerts: CompatibilityAlert[] = [];
  let score = 100;

  const activeIngs = (ingredients || []).filter((ing) => (Number(ing.percentage) || 0) > 0);
  if (activeIngs.length === 0) {
    return { compatibilityScore: 100, alerts: [] };
  }

  const ph = estpH !== undefined && estpH !== null ? estpH : 7.5;

  const hasAnionic = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return r.includes("anionic") || n.includes("sles") || n.includes("labsa") || n.includes("sls") || n.includes("aos") || n.includes("sulfate") || n.includes("sulfonate");
  });

  const hasCationic = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return r.includes("cationic") || n.includes("esterquat") || n.includes("dhtdmac") || n.includes("bkc") || n.includes("acid thickener") || n.includes("cetrimonium") || n.includes("quaternium");
  });

  const hasNonionic = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return r.includes("nonionic") || r.includes("non-ionic") || n.includes("ethoxylate") || n.includes("lae") || n.includes("glucoside") || n.includes("cdea") || n.includes("polysorbate") || n.includes("np-9");
  });

  const hasAmphoteric = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return r.includes("amphoteric") || n.includes("capb") || n.includes("betaine") || n.includes("amine oxide");
  });

  const hasAcid = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    return (n.includes("acid") && !n.includes("amino acid") && !n.includes("citric")) || n.includes("labsa") || n.includes("hydrochloric") || n.includes("hcl");
  });

  const hasBleach = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    return n.includes("bleach") || n.includes("hypochlorite") || n.includes("hydrogen peroxide");
  });

  const hasUnneutralizedLabsa = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    return n.includes("labsa");
  });

  const hasSles = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    return n.includes("sles") || n.includes("ether sulfate");
  });

  const hasNeutralizer = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    return n.includes("caustic") || n.includes("hydroxide") || n.includes("soda ash") || n.includes("carbonate") || n.includes("triethanolamine") || n.includes("tea");
  });

  const hasEnzyme = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return n.includes("enzyme") || n.includes("protease") || n.includes("lipase") || n.includes("amylase") || r.includes("enzyme");
  });

  const hasPolymer = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return n.includes("cmc") || n.includes("hec") || n.includes("polyacrylate") || n.includes("xanthan") || n.includes("carbomer") || r.includes("polymer") || r.includes("anti-redeposition");
  });

  const hasHighElectrolyte = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const pct = Number(ing.percentage) || 0;
    return (n.includes("salt") || n.includes("sodium chloride") || n.includes("magnesium sulfate")) && pct > 2.0;
  });

  const hasPreservative = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return n.includes("kathon") || n.includes("preservative") || n.includes("isothiazolinone") || n.includes("phenoxyethanol") || n.includes("formalin") || n.includes("benzoate") || r.includes("preservative");
  });

  const hasFragrance = activeIngs.some((ing) => {
    const n = (ing.name || "").toLowerCase();
    const r = (ing.role || "").toLowerCase();
    return n.includes("fragrance") || n.includes("perfume") || n.includes("essential oil") || r.includes("fragrance");
  });

  // --- Rule 1: Anionic + Cationic Surfactant Incompatibility ---
  if (hasAnionic && hasCationic) {
    score -= 40;
    alerts.push({
      type: "Incompatible Surfactant Pair",
      severity: "Critical",
      description: "Anionic and Cationic surfactants detected in same formulation.",
      reason: "Oppositely charged headgroups strongly attract, co-precipitating as an insoluble sticky wax complex that cancels all cleaning and foaming properties.",
      recommendation: "Separate into individual product steps or substitute Cationic surfactant with nonionic/amphoteric conditioning agents."
    });
  }

  // --- Rule 2: Acid / Unneutralized LABSA + Bleach / Hypochlorite Hazard ---
  if (hasAcid && hasBleach) {
    score -= 50;
    alerts.push({
      type: "Hazardous Chemical Reaction",
      severity: "Critical",
      description: "Mixing Acid/LABSA and Bleach (Sodium Hypochlorite) releases toxic gas!",
      reason: "Acidic conditions decompose hypochlorite rapidly, releasing hazardous Chlorine gas (Cl₂).",
      recommendation: "Ensure pH is adjusted above 11 before introducing hypochlorite bleach, or separate acidic and bleach processing lines."
    });
  }

  // --- Rule 3: LABSA + SLES without Neutralizer ---
  if (hasUnneutralizedLabsa && hasSles && !hasNeutralizer) {
    score -= 30;
    alerts.push({
      type: "Acid Hydrolysis Risk",
      severity: "High",
      description: "LABSA acid slurry mixed directly with SLES without alkali neutralizer.",
      reason: "Unneutralized LABSA (pH < 2) causes rapid acid hydrolysis of the ether sulfate linkage in SLES, degrading it into lauryl alcohol and destroying foam/viscosity.",
      recommendation: "Pre-neutralize LABSA with Caustic Soda or Soda Ash before incorporating SLES paste."
    });
  }

  // --- Rule 4: Enzyme pH Instability ---
  if (hasEnzyme && (ph < 6.0 || ph > 9.5)) {
    score -= 25;
    alerts.push({
      type: "Enzyme Inactivation Warning",
      severity: "High",
      description: `Enzyme activity compromised at current pH (${ph.toFixed(1)}).`,
      reason: "Enzymes (Protease, Amylase, Lipase) undergo irreversible tertiary protein denaturation outside pH 6.0–9.5. Target 7.5–8.5 for maximum stability.",
      recommendation: "Adjust formulation pH to 7.5–8.5 using Citric Acid or Mild Alkali, or add polyol enzyme stabilizers (Propylene Glycol / Borax)."
    });
  }

  // --- Rule 5: Polymer + High Electrolyte Salt Out ---
  if (hasPolymer && hasHighElectrolyte) {
    score -= 15;
    alerts.push({
      type: "Polymer Salt-Out Risk",
      severity: "Medium",
      description: "High salt/electrolyte concentration (>2%) with water-soluble polymer.",
      reason: "High ionic strength screens carboxylate/polar charges on polymer chains (e.g. CMC, Polyacrylate), causing chain coiling, loss of water binding, and phase separation or haziness.",
      recommendation: "Reduce salt loading or switch to salt-tolerant polymers (e.g., Xanthan Gum or Acrylates Copolymer)."
    });
  }

  // --- Rule 6: Preservative pH Mismatch ---
  if (hasPreservative) {
    activeIngs.forEach((ing) => {
      const n = (ing.name || "").toLowerCase();
      if ((n.includes("kathon") || n.includes("isothiazolinone") || n.includes("mit") || n.includes("bit")) && ph > 8.5) {
        score -= 20;
        alerts.push({
          type: "Preservative Degradation",
          severity: "High",
          description: `Isothiazolinone preservative (${ing.name}) degraded at alkaline pH (${ph.toFixed(1)}).`,
          reason: "Kathon CG / MIT degrades rapidly above pH 8.5–9.0 through nucleophilic ring opening, resulting in loss of antimicrobial protection.",
          recommendation: "Buffer batch pH below 8.2 or switch to alkaline-stable preservative (e.g., Phenoxyethanol / DMDM Hydantoin)."
        });
      } else if (n.includes("benzoate") && ph > 5.5) {
        score -= 15;
        alerts.push({
          type: "Preservative Inactivation",
          severity: "Medium",
          description: "Sodium Benzoate inactive above pH 5.5.",
          reason: "Sodium Benzoate relies on undissociated Benzoic Acid for antimicrobial action, which is absent at neutral/alkaline pH.",
          recommendation: "Adjust pH below 5.0 for Benzoate systems, or use broad-spectrum neutral preservatives."
        });
      }
    });
  }

  // --- Rule 7: Fragrance Oils without Solubilizer / Surfactants in Water-Heavy Systems ---
  if (hasFragrance && !hasNonionic && !hasAmphoteric && !hasAnionic) {
    score -= 15;
    alerts.push({
      type: "Fragrance Emulsification Failure",
      severity: "Medium",
      description: "Fragrance/essential oil added without surfactant or solubilizer.",
      reason: "Hydrophobic fragrance oils cannot dissolve in water alone, causing oil droplets to rise and form an unsightly surface layer or separation ring.",
      recommendation: "Premix fragrance oil with a nonionic solubilizer (e.g., Polysorbate 20 or PEG-40 Hydrogenated Castor Oil) before adding to water."
    });
  }

  // --- Rule 8: Matrix Check from COMPATIBILITY_MATRIX ---
  const activeNames = activeIngs.map((i) => (i.name || "").toLowerCase());
  COMPATIBILITY_MATRIX.forEach((rule) => {
    const matchA = activeNames.some((n) => n.includes(rule.chemicalA.toLowerCase()) || rule.chemicalA.toLowerCase().includes(n));
    const matchB = activeNames.some((n) => n.includes(rule.chemicalB.toLowerCase()) || rule.chemicalB.toLowerCase().includes(n));
    if (matchA && matchB && rule.status !== "Compatible") {
      const severity = rule.status === "Incompatible" ? "High" : "Medium";
      const penalty = rule.status === "Incompatible" ? 25 : 10;
      score -= penalty;
      alerts.push({
        type: rule.status === "Incompatible" ? "Incompatible Matrix Pair" : "Compatibility Caution",
        severity,
        description: `${rule.chemicalA} + ${rule.chemicalB} combination detected.`,
        reason: rule.reason,
        recommendation: rule.recommendedMixingMethod
      });
    }
  });

  const compatibilityScore = Math.max(0, Math.min(100, Math.round(score)));
  return { compatibilityScore, alerts };
}

export interface MixingStep {
  order: number;
  action: string;
  mixingTime: string;
  mixingSpeed: string;
  temperature: string;
  safetyNote?: string;
}

export function generateDynamicMixingInstructions(
  ingredients: any[],
  productType?: string
): MixingStep[] {
  const activeIngs = (ingredients || []).filter((ing) => (Number(ing.percentage) || 0) > 0);
  if (activeIngs.length === 0) {
    return [
      { order: 1, action: "Charge water into vessel and begin agitation.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Standard PPE required." }
    ];
  }

  const steps: MixingStep[] = [];
  let stepOrder = 1;

  const formatChemNotes = (items: any[]): { notes: string; temp?: string; safety?: string } => {
    const notesArr: string[] = [];
    let tempVal: string | undefined;
    let safetyVal: string | undefined;

    items.forEach(i => {
      if (!i || !i.name) return;
      const chem = getChemicalData(i.name);
      if (!chem) return;

      if (chem.processingNotes) {
        notesArr.push(`${chem.commonName}: ${chem.processingNotes}`);
      }
      if (chem.additionStage) {
        notesArr.push(`${chem.commonName} stage: ${chem.additionStage}`);
      }
      if (chem.physicalState) {
        notesArr.push(`${chem.commonName} state: ${chem.physicalState}`);
      }
      if (chem.purityPct) {
        notesArr.push(`${chem.commonName} purity: ${chem.purityPct}%`);
      }
      if (chem.minimumDosage) {
        notesArr.push(`${chem.commonName} min dose: ${chem.minimumDosage}`);
      }
      if (chem.recommendedMixingTemp && !tempVal) {
        tempVal = chem.recommendedMixingTemp;
      }
      if (chem.flashPoint || chem.autoIgnitionTemp) {
        safetyVal = `Thermal safety for ${chem.commonName}: Flash point ${chem.flashPoint || chem.autoIgnitionTemp}. Keep away from open ignition sources.`;
      }
    });

    return {
      notes: notesArr.length > 0 ? ` Processing Notes: ${notesArr.join(" | ")}` : "",
      temp: tempVal,
      safety: safetyVal
    };
  };

  // Helper matching functions
  const isWater = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("water") || n.includes("aqua") || r.includes("solvent") || r.includes("carrier");
  };

  const isPolymer = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("cmc") || n.includes("hec") || n.includes("hpmc") || n.includes("mhec") || n.includes("polyacrylate") || n.includes("xanthan") || n.includes("carbomer") || n.includes("cellulose") || r.includes("polymer") || r.includes("anti-redeposition");
  };

  const isBuilderChelator = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return (
      (n.includes("gluconate") || n.includes("edta") || n.includes("glda") || n.includes("citrate") || n.includes("stpp") || n.includes("zeolite") || n.includes("silicate") || r.includes("chelator") || r.includes("builder")) &&
      !n.includes("caustic") && !n.includes("labsa")
    );
  };

  const isLabsa = (i: any) => (i.name || "").toLowerCase().includes("labsa");

  const isNeutralizer = (i: any) => {
    const n = (i.name || "").toLowerCase();
    return (n.includes("caustic") || n.includes("hydroxide") || n.includes("naoh") || n.includes("koh") || n.includes("soda ash") || n.includes("carbonate") || n.includes("triethanolamine")) && !n.includes("labsa");
  };

  const isAnionicSurfactant = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return (n.includes("sles") || n.includes("sls") || n.includes("aos") || n.includes("ether sulfate") || n.includes("lauryl sulfate") || n.includes("sulfonate") || r.includes("anionic surfactant")) && !n.includes("labsa");
  };

  const isAmphotericSurfactant = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("capb") || n.includes("betaine") || n.includes("amine oxide") || r.includes("amphoteric");
  };

  const isNonionicSurfactant = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("glucoside") || n.includes("apg") || n.includes("cdea") || n.includes("ethoxylate") || n.includes("lae") || n.includes("polysorbate") || n.includes("np-9") || r.includes("non-ionic") || r.includes("bio-surfactant");
  };

  const isSalt = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return (n.includes("salt") || n.includes("sodium chloride") || n.includes("magnesium sulfate")) || r.includes("electrolyte");
  };

  const isEnzyme = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("enzyme") || n.includes("protease") || n.includes("lipase") || n.includes("amylase") || r.includes("enzyme");
  };

  const isPreservative = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("kathon") || n.includes("preservative") || n.includes("isothiazolinone") || n.includes("phenoxyethanol") || n.includes("formalin") || n.includes("benzoate") || r.includes("preservative");
  };

  const isFragrance = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return (n.includes("fragrance") || n.includes("perfume") || n.includes("essential oil") || r.includes("fragrance") || r.includes("aroma")) && !n.includes("dye") && !n.includes("color");
  };

  const isDye = (i: any) => {
    const n = (i.name || "").toLowerCase();
    const r = (i.role || "").toLowerCase();
    return n.includes("dye") || n.includes("color") || n.includes("ci ") || r.includes("esthetic") || r.includes("colorant");
  };

  // Groupings
  const waterIng = activeIngs.find(isWater);
  const polymers = activeIngs.filter(isPolymer);
  const builders = activeIngs.filter(isBuilderChelator);
  const labsa = activeIngs.find(isLabsa);
  const neutralizer = activeIngs.find(isNeutralizer);
  const anionics = activeIngs.filter(isAnionicSurfactant);
  const amphoterics = activeIngs.filter(isAmphotericSurfactant);
  const nonionics = activeIngs.filter(isNonionicSurfactant);
  const salts = activeIngs.filter(isSalt);
  const enzymes = activeIngs.filter(isEnzyme);
  const preservatives = activeIngs.filter(isPreservative);
  const fragrances = activeIngs.filter(isFragrance);
  const dyes = activeIngs.filter(isDye);

  // 1. Water Charging Stage
  if (waterIng) {
    steps.push({
      order: stepOrder++,
      action: `Stage 1 - Water Charge: Charge main water batch (${waterIng.name}, ${waterIng.percentage}%) into stainless steel mixing vessel. Start agitation at 60–80 RPM.`,
      mixingTime: "5 mins",
      mixingSpeed: "Slow (60-80 RPM)",
      temperature: "Ambient (25°C)",
      safetyNote: "Verify vessel cleanliness and electrical grounding before operation."
    });
  } else {
    steps.push({
      order: stepOrder++,
      action: "Stage 1 - Liquid Carrier Charge: Charge primary liquid base into mixing vessel and start slow agitation.",
      mixingTime: "5 mins",
      mixingSpeed: "Slow",
      temperature: "Ambient",
      safetyNote: "Wear appropriate personal protective equipment (PPE)."
    });
  }

  // 2. Polymer Hydration Stage (HEC, HPMC, MHEC, Xanthan, CMC, Polyacrylate, etc.)
  if (polymers.length > 0) {
    const polymerNames = polymers.map((p) => `${p.name} (${p.percentage}%)`).join(", ");
    const info = formatChemNotes(polymers);
    steps.push({
      order: stepOrder++,
      action: `Stage 2 - Polymer Hydration: Disperse water-soluble polymer(s) [${polymerNames}] slowly into water phase under moderate agitation. Allow complete swelling and hydration to prevent lump/fisheye formation before electrolyte or surfactant loading.${info.notes}`,
      mixingTime: "20 mins",
      mixingSpeed: "Medium (100-120 RPM)",
      temperature: info.temp || "Ambient (25-30°C)",
      safetyNote: info.safety || "Sift powders slowly through a mesh screen to prevent agglomeration."
    });
  }

  // 3. Builder / Chelator Dissolution
  if (builders.length > 0) {
    const builderNames = builders.map((b) => `${b.name} (${b.percentage}%)`).join(", ");
    const info = formatChemNotes(builders);
    steps.push({
      order: stepOrder++,
      action: `Stage 3 - Builder & Chelator Dissolution: Dissolve sequestering agents and builders [${builderNames}] into aqueous base. Stir until completely dissolved to bind divalent metals (Ca²⁺/Mg²⁺).${info.notes}`,
      mixingTime: "10 mins",
      mixingSpeed: "Medium",
      temperature: info.temp || "Ambient",
      safetyNote: info.safety || "Avoid inhaling powder dust when adding chelating solids."
    });
  }

  // 4. LABSA Addition & Controlled Neutralization Stage
  if (labsa) {
    const infoAcid = formatChemNotes([labsa]);
    steps.push({
      order: stepOrder++,
      action: `Stage 4A - Acid Slurry Addition: Charge LABSA (${labsa.name}, ${labsa.percentage}%) into aqueous phase. Mix thoroughly to produce a smooth, dark-viscous acidic blend without unmixed streaks.${infoAcid.notes}`,
      mixingTime: "15 mins",
      mixingSpeed: "Medium (100 RPM)",
      temperature: infoAcid.temp || "Ambient",
      safetyNote: infoAcid.safety || "DANGER: Concentrated LABSA acid (pH ~1.5) causes severe chemical skin burns. Wear rubber gloves and face shield."
    });

    if (neutralizer) {
      const infoNeut = formatChemNotes([neutralizer]);
      steps.push({
        order: stepOrder++,
        action: `Stage 4B - Controlled Neutralization: Gradually feed pre-dissolved alkali neutralizer [${neutralizer.name}, ${neutralizer.percentage}%] into acidic LABSA slurry while monitoring pH continuously until pH stabilizes between 7.5 and 8.5.${infoNeut.notes}`,
        mixingTime: "20 mins",
        mixingSpeed: "Medium",
        temperature: infoNeut.temp || "Cooling active (<40°C)",
        safetyNote: infoNeut.safety || "Exothermic reaction generates intense heat. Hot alkali splashing can cause severe chemical burns."
      });
    }
  }

  // 5. Addition of Anionic Surfactants (SLES, SLS, AOS)
  if (anionics.length > 0) {
    const anionicNames = anionics.map((a) => `${a.name} (${a.percentage}%)`).join(", ");
    const info = formatChemNotes(anionics);
    steps.push({
      order: stepOrder++,
      action: `Stage 5 - Primary Anionic Surfactants: Incorporate anionic surfactants [${anionicNames}] slowly into the batch. Stir until all gel lumps are completely solubilized and solution is clear.${info.notes}`,
      mixingTime: "25 mins",
      mixingSpeed: "Medium",
      temperature: info.temp || "30-35°C (Warm water aids fast dissolution)",
      safetyNote: info.safety || "Keep stirrer speed controlled to prevent excessive foam building."
    });
  }

  // 6. Addition of Amphoteric Surfactants (CAPB, Betaine)
  if (amphoterics.length > 0) {
    const amphoNames = amphoterics.map((a) => `${a.name} (${a.percentage}%)`).join(", ");
    const info = formatChemNotes(amphoterics);
    steps.push({
      order: stepOrder++,
      action: `Stage 6 - Amphoteric Surfactants: Blend amphoteric surfactants [${amphoNames}] into the primary surfactant phase. Stir at low speed to build mixed micellar structures and enhance mildness.${info.notes}`,
      mixingTime: "10 mins",
      mixingSpeed: "Slow (60-80 RPM)",
      temperature: info.temp || "Ambient (<35°C)",
      safetyNote: info.safety || "Agitate gently to prevent whipping micro-air bubbles into liquid."
    });
  }

  // 7. Addition of Nonionic Surfactants (APGs, Coco Glucoside, Lauryl Glucoside, CDEA)
  if (nonionics.length > 0) {
    const nonionicNames = nonionics.map((n) => `${n.name} (${n.percentage}%)`).join(", ");
    const info = formatChemNotes(nonionics);
    steps.push({
      order: stepOrder++,
      action: `Stage 7 - Nonionic & Bio-Surfactants (APGs): Add nonionic co-surfactants [${nonionicNames}] into the formed anionic/amphoteric micellar system. Mix until homogeneous to boost grease emulsification.${info.notes}`,
      mixingTime: "12 mins",
      mixingSpeed: "Slow",
      temperature: info.temp || "Ambient",
      safetyNote: info.safety || "Nonionic APGs increase viscosity; ensure uniform blending."
    });
  }

  // 8. Salt Addition (Only after surfactant system has formed)
  if (salts.length > 0) {
    const saltNames = salts.map((s) => `${s.name} (${s.percentage}%)`).join(", ");
    const info = formatChemNotes(salts);
    steps.push({
      order: stepOrder++,
      action: `Stage 8 - Electrolyte Viscosity Dosing: Prepare a 15-20% aqueous solution of electrolyte [${saltNames}]. Slowly dose in small increments into the fully formed surfactant matrix. Stop dosing as target viscosity is achieved.${info.notes}`,
      mixingTime: "15 mins",
      mixingSpeed: "Slow",
      temperature: info.temp || "Ambient",
      safetyNote: info.safety || "DO NOT dump dry salt directly or over-dose; excessive electrolyte will crash micellar viscosity."
    });
  }

  // 9. Enzyme Addition (Below recommended temperature <35°C)
  if (enzymes.length > 0) {
    const enzymeNames = enzymes.map((e) => `${e.name} (${e.percentage}%)`).join(", ");
    const info = formatChemNotes(enzymes);
    steps.push({
      order: stepOrder++,
      action: `Stage 9 - Biological Enzymes Addition: Verify batch temperature is STRICTLY below 35°C and pH is neutral (7.0-8.2). Slowly mix in bio-enzymes [${enzymeNames}].${info.notes}`,
      mixingTime: "10 mins",
      mixingSpeed: "Slow",
      temperature: info.temp || "<35°C (Cool Batch)",
      safetyNote: info.safety || "CRITICAL: Adding enzymes above 40°C causes thermal denaturation, permanently destroying cleaning activity."
    });
  }

  // 10. Preservative Addition (Near final cooling stage)
  if (preservatives.length > 0) {
    const presNames = preservatives.map((p) => `${p.name} (${p.percentage}%)`).join(", ");
    const info = formatChemNotes(preservatives);
    steps.push({
      order: stepOrder++,
      action: `Stage 10 - Preservative Protection: Blend broad-spectrum preservatives [${presNames}] into cooled batch (<35°C). Ensure thorough dispersion throughout batch volume.${info.notes}`,
      mixingTime: "10 mins",
      mixingSpeed: "Slow",
      temperature: info.temp || "<35°C",
      safetyNote: info.safety || "Handling concentrated biocide stock requires safety goggles and nitrile gloves."
    });
  }

  // 11. Fragrance Addition (Near final cooling stage)
  if (fragrances.length > 0) {
    const fragNames = fragrances.map((f) => `${f.name} (${f.percentage}%)`).join(", ");
    const info = formatChemNotes(fragrances);
    steps.push({
      order: stepOrder++,
      action: `Stage 11 - Fragrance Oil Addition: Slowly pour fragrance / perfume oil [${fragNames}] into cooled liquid batch (<35°C). Stir gently until solubilized and clear without oil surface sheen.${info.notes}`,
      mixingTime: "10 mins",
      mixingSpeed: "Slow",
      temperature: info.temp || "<35°C",
      safetyNote: info.safety || "Adding fragrance to hot batch (>40°C) causes volatile aroma degradation and top-note loss."
    });
  }

  // 12. Dye Addition (At final adjustment stage)
  if (dyes.length > 0) {
    const dyeNames = dyes.map((d) => `${d.name} (${d.percentage}%)`).join(", ");
    const info = formatChemNotes(dyes);
    steps.push({
      order: stepOrder++,
      action: `Stage 12 - Esthetic Dye Addition: Pre-dissolve water-soluble colorants/dyes [${dyeNames}] in 10x water dilution. Dose into main vessel and blend until uniform batch shade is achieved.${info.notes}`,
      mixingTime: "10 mins",
      mixingSpeed: "Slow",
      temperature: info.temp || "Ambient",
      safetyNote: info.safety || "Pre-dissolve dyes thoroughly to prevent localized color specks in liquid."
    });
  }

  // 13. Final pH Adjustment Stage
  steps.push({
    order: stepOrder++,
    action: "Stage 13 - Final pH Trimming: Sample batch and measure pH using calibrated pH meter. Adjust with minor dosing of 10% Citric Acid (to lower pH) or 10% NaOH (to raise pH) until target product pH range is met.",
    mixingTime: "10 mins",
    mixingSpeed: "Slow",
    temperature: "Ambient (25°C)",
    safetyNote: "Dose pH adjusters slowly in small fractions to avoid over-shooting."
  });

  // 14. Final Viscosity Adjustment Stage
  steps.push({
    order: stepOrder++,
    action: "Stage 14 - Final Viscosity Fine-Tuning: Test batch viscosity with rotational viscometer (e.g. Brookfield Spindle #3 @ 20 RPM). Fine-tune with micro-dosing of electrolyte salt solution if required.",
    mixingTime: "10 mins",
    mixingSpeed: "Slow",
    temperature: "25°C",
    safetyNote: "Ensure test sample temperature is exactly 25°C for accurate viscosity reading."
  });

  // 15. Final Quality-Control Checks Before Filling
  steps.push({
    order: stepOrder++,
    action: "Stage 15 - Final Quality Control & De-aeration: Allow finished batch to rest in holding tank for 2–4 hours to release trapped air bubbles. Conduct final lab audit for pH, active matter %, density, viscosity, and microbial spec before filling into final containers.",
    mixingTime: "120-240 mins (Rest)",
    mixingSpeed: "Off (Resting phase)",
    temperature: "Ambient",
    safetyNote: "Obtain Quality Assurance (QA) release certificate prior to packaging and commercial dispatch."
  });

  return steps;
}

// ==========================================
// ADVANCED SCIENTIFIC ENGINE INTEGRATION (PHASE 4)
// ==========================================

export interface FormulationGreenChelatorAnalysis {
  hasGreenChelator: boolean;
  greenChelatorNames: string[];
  totalGreenChelatorPct: number;
  stoichiometricCaCO3BoundMg: number;
  sequestrationEfficiencyPct: number;
  greenChelatorResult: GreenChelatorResult;
}

export function evaluateFormulationGreenChelators(
  ingredients: Array<{ name: string; percentage: number; activeMatterPct?: number; role?: string }>,
  waterHardnessPpm: number = 150,
  washVolumeL: number = 10,
  washDoseGrams: number = 20
): FormulationGreenChelatorAnalysis {
  const defaultGreenCalc = calculateGreenChelators({
    waterHardnessPpm,
    washVolumeL,
    washDoseGrams,
    safetyMarginPct: 10,
    coBuilderTargetPct: 10,
    maxFormulationCapPct: 3.0
  });

  if (!ingredients || !Array.isArray(ingredients)) {
    return {
      hasGreenChelator: false,
      greenChelatorNames: [],
      totalGreenChelatorPct: 0,
      stoichiometricCaCO3BoundMg: 0,
      sequestrationEfficiencyPct: 0,
      greenChelatorResult: defaultGreenCalc
    };
  }

  const greenNames: string[] = [];
  let totalPct = 0;
  let totalCaBoundMg = 0;

  ingredients.forEach(ing => {
    if (!ing || !ing.name || (ing.percentage || 0) <= 0) return;
    const name = ing.name.toLowerCase();
    const pct = Number(ing.percentage) || 0;
    const chem = getChemicalData(ing.name);

    let isGreen = false;
    let bindingCapMgG = 0; // mg CaCO3 / g active chelator

    if (name.includes("glda") || name.includes("glutamate diacetate") || name.includes("dissolvine")) {
      isGreen = true;
      bindingCapMgG = 137;
    } else if (name.includes("citrate") || name.includes("citric acid")) {
      isGreen = true;
      bindingCapMgG = 150;
    } else if (name.includes("gluconate")) {
      isGreen = true;
      bindingCapMgG = 76;
    } else if (name.includes("mgda") || name.includes("methylglycinediacetic") || name.includes("trilon m")) {
      isGreen = true;
      bindingCapMgG = 180;
    } else if (name.includes("edds")) {
      isGreen = true;
      bindingCapMgG = 160;
    } else if (chem && (chem.phosphateFree || (chem.reachStatus && chem.reachStatus.includes("Bio")))) {
      const cat = getAuditedIngredientCategory(ing.name, ing.role);
      if (cat === "Builders & Chelators" || cat === "Chelating Agents") {
        isGreen = true;
        bindingCapMgG = 100;
      }
    }

    if (isGreen) {
      if (!greenNames.includes(ing.name)) greenNames.push(ing.name);
      totalPct += pct;
      const activePct = ing.activeMatterPct !== undefined ? ing.activeMatterPct : getDefaultActiveMatter(ing.name);
      const activeGramsInWash = (washDoseGrams * (pct / 100)) * (activePct / 100);
      totalCaBoundMg += activeGramsInWash * bindingCapMgG;
    }
  });

  const targetMg = defaultGreenCalc.stoichiometricTargetMg;
  const sequestrationEfficiencyPct = targetMg > 0 ? Math.min(100, Math.round((totalCaBoundMg / targetMg) * 100)) : 0;

  return {
    hasGreenChelator: greenNames.length > 0,
    greenChelatorNames: greenNames,
    totalGreenChelatorPct: Math.round(totalPct * 100) / 100,
    stoichiometricCaCO3BoundMg: Math.round(totalCaBoundMg * 10) / 10,
    sequestrationEfficiencyPct,
    greenChelatorResult: defaultGreenCalc
  };
}

export interface LabHealthInput {
  ph: number;
  analyzedIngs: any[];
  cleaningPerf?: CleaningPerformanceResult;
  cpiScore?: number;
  compatibilityResult?: any;
  shelfLifeResult?: ShelfLifeResult;
  ecoResult?: any;
  rawCost?: number;
  targetCost?: number;
  warnings?: string[];
}

export interface LabHealthResult {
  finalScore: number;
  rating: "Poor" | "Fair" | "Good" | "Excellent";
  breakdown: {
    phScore: number;
    cleaningScore: number;
    cpiScore: number;
    shelfLifeScore: number;
    ecoScore: number;
    compatibilityScore: number;
    rawMaterialQualityScore: number;
  };
}

export function calculateLabHealthScore(input: LabHealthInput): LabHealthResult {
  const {
    ph,
    analyzedIngs = []
  } = input;

  const currentpH = ph !== undefined ? ph : calculateEstimatedPH("General", "Formula", analyzedIngs).estpH;
  const cleanPerf = input.cleaningPerf || calculateCleaningPerformance(analyzedIngs, currentpH);
  const comp = input.compatibilityResult || calculateFormulationCompatibility(analyzedIngs, currentpH);
  const shelf = input.shelfLifeResult || calculateShelfLife(analyzedIngs, currentpH);
  const eco = input.ecoResult || calculateComplexEcoScore(analyzedIngs);
  const cpi = input.cpiScore !== undefined ? input.cpiScore : calculateCPI(analyzedIngs, currentpH, undefined, comp, eco);

  let phScore = 15;
  if (currentpH < 5.5 || currentpH > 10.0) phScore = 10;
  if (currentpH < 3.0 || currentpH > 12.0) phScore = 5;

  let cleaningScore = Math.round(20 * (cleanPerf.cleaningScore / 100));
  let cpiScore = Math.round(15 * (cpi / 100));
  let shelfLifeScore = Math.round(10 * Math.min(1.0, shelf.months / 24));
  let ecoScoreVal = eco.score !== undefined ? eco.score : (typeof eco === "number" ? eco : 80);
  let ecoScore = Math.round(15 * (ecoScoreVal / 100));
  let compScoreVal = comp.overallScore !== undefined ? comp.overallScore : (comp.compatibilityScore !== undefined ? comp.compatibilityScore : 100);
  let compatibilityScore = Math.round(15 * (compScoreVal / 100));

  let rawMaterialQualityScore = 10;
  let totalFields = 0;
  let missingSum = 0;
  analyzedIngs.forEach(ing => {
    if ((ing.percentage || 0) > 0) {
      totalFields += 6;
      if (ing.missingFields && Array.isArray(ing.missingFields)) {
        missingSum += ing.missingFields.length;
      }
    }
  });
  if (totalFields > 0) {
    rawMaterialQualityScore = Math.max(0, Math.round(10 * (1 - missingSum / totalFields)));
  }

  const finalScore = phScore + cleaningScore + cpiScore + shelfLifeScore + ecoScore + compatibilityScore + rawMaterialQualityScore;

  let rating: "Poor" | "Fair" | "Good" | "Excellent" = "Good";
  if (finalScore >= 85) rating = "Excellent";
  else if (finalScore >= 70) rating = "Good";
  else if (finalScore >= 50) rating = "Fair";
  else rating = "Poor";

  return {
    finalScore,
    rating,
    breakdown: {
      phScore,
      cleaningScore,
      cpiScore,
      shelfLifeScore,
      ecoScore,
      compatibilityScore,
      rawMaterialQualityScore
    }
  };
}

export interface AIGradeInput {
  ingredients: any[];
  pH?: number;
  cleaningPerf?: CleaningPerformanceResult;
  costResult?: { rawMaterialCost: number; targetCost?: number };
  targetCost?: number;
  compatibilityResult?: any;
  ecoResult?: any;
  shelfLifeResult?: ShelfLifeResult;
  labHealthResult?: LabHealthResult;
  cpiScore?: number;
  waterHardnessResult?: WaterHardnessToleranceResult;
}

export interface AIGradeResult {
  grade: "Economy" | "Standard" | "Premium";
  numericScore: number;
  reasons: string[];
}

export function evaluateAIGrade(input: AIGradeInput): AIGradeResult {
  const ingredients = input.ingredients || [];
  const currentpH = input.pH !== undefined ? input.pH : calculateEstimatedPH("General", "Formula", ingredients).estpH;
  const hr = input.waterHardnessResult || calculateWaterHardnessTolerance(ingredients);
  const cleanPerf = input.cleaningPerf || calculateCleaningPerformance(ingredients, currentpH, hr);
  const comp = input.compatibilityResult || calculateFormulationCompatibility(ingredients, currentpH);
  const eco = input.ecoResult || calculateComplexEcoScore(ingredients);
  const shelf = input.shelfLifeResult || calculateShelfLife(ingredients, currentpH);
  const cpi = input.cpiScore !== undefined ? input.cpiScore : calculateCPI(ingredients, currentpH, hr, comp, eco);
  const health = input.labHealthResult || calculateLabHealthScore({
    ph: currentpH,
    analyzedIngs: ingredients,
    cleaningPerf: cleanPerf,
    cpiScore: cpi,
    compatibilityResult: comp,
    shelfLifeResult: shelf,
    ecoResult: eco,
    rawCost: input.costResult?.rawMaterialCost || 0,
    targetCost: input.targetCost || 0
  });

  const activeMatter = calculateActiveMatter(ingredients);
  const hardnessScore = Math.min(100, (hr.maxSupportedPpm / 200) * 100);
  const shelfScore = Math.min(100, (shelf.months / 24) * 100);
  const ecoScoreVal = eco.score !== undefined ? eco.score : (typeof eco === "number" ? eco : 80);
  const compScoreVal = comp.overallScore !== undefined ? comp.overallScore : (comp.compatibilityScore !== undefined ? comp.compatibilityScore : 100);

  const totalWeighted = (
    cpi * 0.25 +
    cleanPerf.cleaningScore * 0.20 +
    ((compScoreVal + shelfScore) / 2) * 0.20 +
    ((health.finalScore + ecoScoreVal) / 2) * 0.20 +
    hardnessScore * 0.15
  );

  const numericScore = Math.round(totalWeighted);

  let grade: "Economy" | "Standard" | "Premium" = "Standard";
  if (numericScore >= 78 || activeMatter >= 18) {
    grade = "Premium";
  } else if (numericScore >= 52 || activeMatter >= 8) {
    grade = "Standard";
  } else {
    grade = "Economy";
  }

  const reasons = [
    `CPI Rating: ${cpi}/100`,
    `Active Surfactant Matter: ${activeMatter.toFixed(1)}%`,
    `Cleaning Performance: ${cleanPerf.cleaningScore}/100`,
    `Lab Health Score: ${health.finalScore}/100`,
    `Eco Rating: ${ecoScoreVal}/100`,
    `Water Hardness Binding: ${hr.maxSupportedPpm} ppm CaCO3`,
    `Shelf Life: ${shelf.months} months`
  ];

  return {
    grade,
    numericScore,
    reasons
  };
}

export interface FormulationWarningInput {
  ingredients: any[];
  pH?: number;
  productType?: string;
  formulaName?: string;
  rawCost?: number;
  targetCost?: number;
  preservativePct?: number;
  compatibilityResult?: any;
  shelfLifeResult?: ShelfLifeResult;
}

export function generateFormulationWarnings(input: FormulationWarningInput): string[] {
  const ingredients = input.ingredients || [];
  const currentpH = input.pH !== undefined ? input.pH : calculateEstimatedPH(input.productType || "General", input.formulaName || "Formula", ingredients).estpH;
  const comp = input.compatibilityResult || calculateFormulationCompatibility(ingredients, currentpH);
  const shelf = input.shelfLifeResult || calculateShelfLife(ingredients, currentpH);

  const warnings: string[] = [];

  if (input.productType) {
    const targetRange = getTargetPHRange(input.productType, input.formulaName);
    if (currentpH < targetRange.min - 0.3 || currentpH > targetRange.max + 0.3) {
      warnings.push(`Validation Warning: Estimated pH (${currentpH.toFixed(1)}) diverges from Target pH range (${targetRange.label}) by >0.3 units. Check neutralization ratios.`);
    }
  }

  if (currentpH < 3.5 || currentpH > 11.5) {
    warnings.push(`Extreme pH Level Alert (${currentpH.toFixed(1)}): Highly corrosive pH. Requires chemical resistance equipment and hazard labeling.`);
  }

  if (comp.alerts && Array.isArray(comp.alerts)) {
    comp.alerts.forEach((alert: any) => {
      const title = alert.title || alert.description || "Compatibility Alert";
      const details = alert.details || alert.reason || "";
      warnings.push(`Compatibility Alert: ${title} - ${details}`);
    });
  }

  ingredients.forEach(ing => {
    if (!ing || !ing.name || (ing.percentage || 0) <= 0) return;
    const warningObj = getPreservativeWarning(ing.name, currentpH);
    if (warningObj && warningObj.message) {
      warnings.push(warningObj.message);
    }
  });

  if (shelf.months <= 6) {
    warnings.push(`Shelf Life Warning: Restricted commercial shelf life (${shelf.months} months). ${shelf.limitingFactor}`);
  }

  ingredients.forEach(ing => {
    if (!ing || !ing.name || (ing.percentage || 0) <= 0) return;
    const chem = getChemicalData(ing.name);
    if (!chem) return;

    if (chem.cloudPoint) {
      const numCloud = parseFloat(chem.cloudPoint);
      if (!isNaN(numCloud) && numCloud < 40) {
        warnings.push(`Thermal Cloud Point Alert for ${chem.commonName}: Cloud point is ${chem.cloudPoint}. Formula may become hazy/opaque above this temperature.`);
      }
    }

    if (chem.krafftPoint) {
      const numKrafft = parseFloat(chem.krafftPoint);
      if (!isNaN(numKrafft) && numKrafft > 15) {
        warnings.push(`Krafft Point Precipitation Risk for ${chem.commonName}: Krafft point is ${chem.krafftPoint}. Storage below this temperature causes surfactant crystallization.`);
      }
    }

    if (chem.oxidationStability && chem.oxidationStability.toLowerCase().includes("poor")) {
      const hasAntioxidant = ingredients.some(i => (i.name || "").toLowerCase().includes("tocopherol") || (i.name || "").toLowerCase().includes("bht"));
      if (!hasAntioxidant) {
        warnings.push(`Oxidation Stability Alert: ${chem.commonName} has poor oxidation stability. Consider adding an antioxidant stabilizer.`);
      }
    }

    if (chem.flashPoint || chem.autoIgnitionTemp) {
      warnings.push(`Thermal/Flashpoint Notice: ${chem.commonName} flash point is ${chem.flashPoint || chem.autoIgnitionTemp}. Keep away from open flame or ignition sources.`);
    }
  });

  if (input.targetCost && input.targetCost > 0 && input.rawCost && input.rawCost > input.targetCost) {
    warnings.push(`Cost Ceiling Overflow: Current raw material cost (₹${input.rawCost.toFixed(2)}/kg) exceeds target cost ceiling (₹${input.targetCost.toFixed(2)}/kg).`);
  }

  return warnings;
}







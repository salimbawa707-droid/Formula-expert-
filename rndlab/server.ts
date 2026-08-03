import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Helper to sanitize and parse JSON response cleanly
function cleanAndParseJson(text: string): any {
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/i, "");
    clean = clean.replace(/\n?```$/, "");
  }
  return JSON.parse(clean.trim());
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.error("Failed to initialize Google Gen AI client:", e);
      }
    }
  }
  return aiClient;
}

// 1. AI Chat/Query API
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, context } = req.body;
  const client = getAIClient();

  if (!client) {
    // Elegant expert fallback when API key is not configured
    return res.json({
      reply: `[Demo Mode / Offline Fallback]\n\nThank you for asking about "${message}". To unlock full real-time AI formulation and debugging, please add your **GEMINI_API_KEY** in the Secrets settings. \n\n**Expert Answer:**\nFor detergent R&D, always ensure active matter levels align with performance goals. For example, if you are working on a standard Laundry Liquid, aim for 12-15% total active surfactant matter (LABSA neutralized with NaOH to pH 7.5-8.5, paired with SLES and CAPB). If you are troubleshooting viscosity, adding sodium chloride (salt) will build viscosity up to a point, after which it will "salt out" and separate. Let me know if you would like me to simulate a specific formula layout!`
    });
  }

  try {
    const systemPrompt = `You are a world-class AI Detergent R&D Expert and formulation chemist.
Your goal is to assist beginners, students, chemists, and factory professionals with formulations, physical properties, compatibility, GHS safety, and eco-sustainability of home care cleaning products.
Provide precise, scientifically accurate answers with CAS numbers, chemical ratios, mixing methods, and safety warnings (GHS/PPE) where applicable.
Use professional, objective, yet encouraging scientific terminology.
Context available: ${JSON.stringify(context || {})}`;

    // Format history for Gemini API
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to communicate with AI model: " + error.message });
  }
});

// Hard constraint check: enforce preservative safety and pH compatibility BEFORE ingredients list is finalized
function enforcePreservativeConstraints(formula: any) {
  if (!formula || !formula.ingredients || formula.ingredients.length === 0) return formula;

  // 1. Detect or estimate pH of the formulation
  let pH = 7.5; // default laundry liquid pH
  const propPH = formula.properties?.pH;
  if (propPH) {
    const cleanPH = String(propPH).replace(/[^\d.-]/g, "");
    if (cleanPH.includes("-")) {
      const parts = cleanPH.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        pH = (parts[0] + parts[1]) / 2;
      }
    } else {
      const val = Number(cleanPH);
      if (!isNaN(val)) pH = val;
    }
  } else {
    // Estimate pH from product type
    const typeLower = (formula.productType || "").toLowerCase();
    if (typeLower.includes("softener") || typeLower.includes("conditioner")) {
      pH = 4.0;
    } else if (typeLower.includes("degreaser")) {
      pH = 11.0;
    } else if (typeLower.includes("dish")) {
      pH = 7.0;
    }
  }

  // Define our safety-restricted, pH-compatible preservative alternatives
  let safePreservative = {
    name: "Kathon CG (Safe Preservative)",
    percentage: 0.1,
    role: "Safe Preservative / pH compatible",
    costPerKg: 180,
    activeMatterPct: 0,
    hlbValue: null
  };

  if (pH <= 5.5) {
    safePreservative = {
      name: "Sodium Benzoate (Safe Eco Preservative)",
      percentage: 0.2,
      role: "Safe Eco Preservative / pH compatible",
      costPerKg: 140,
      activeMatterPct: 0,
      hlbValue: null
    };
  } else if (pH > 9.0) {
    safePreservative = {
      name: "Phenoxyethanol (Safe Preservative)",
      percentage: 0.15,
      role: "High-pH Stable Safe Preservative",
      costPerKg: 180,
      activeMatterPct: 0,
      hlbValue: null
    };
  } else {
    // 5.5 < pH <= 9.0
    safePreservative = {
      name: "Kathon CG (Safe Preservative)",
      percentage: 0.1,
      role: "Safe Preservative / pH compatible",
      costPerKg: 180,
      activeMatterPct: 0,
      hlbValue: null
    };
  }

  // 2. Scan the ingredients list for existing preservative ingredients
  let hasPreservative = false;
  let preservativeIdx = -1;

  formula.ingredients.forEach((ing: any, idx: number) => {
    const nameLower = ing.name.toLowerCase();
    const roleLower = (ing.role || "").toLowerCase();
    const isPres = nameLower.includes("preservative") || roleLower.includes("preservative") ||
                 nameLower.includes("formalin") || nameLower.includes("formaldehyde") ||
                 nameLower.includes("kathon") || nameLower.includes("benzoate") ||
                 nameLower.includes("sorbate") || nameLower.includes("phenoxy") ||
                 nameLower.includes("benzyl alcohol") || nameLower.includes("dmdm");

    if (isPres) {
      hasPreservative = true;
      preservativeIdx = idx;
    }
  });

  // Apply constraint checks and automatic substitutions
  if (hasPreservative && preservativeIdx !== -1) {
    const currentIng = formula.ingredients[preservativeIdx];
    const nameLower = currentIng.name.toLowerCase();
    let needsSubstitution = false;

    // RULE 1: Formaldehyde-releasing formalins are carcinogenic risk; strictly replace them
    if (nameLower.includes("formalin") || nameLower.includes("formaldehyde")) {
      needsSubstitution = true;
    }

    // RULE 2: Organic acid salts like benzoate and sorbate are inactive at neutral or alkaline pH (> 5.5)
    if (nameLower.includes("benzoate") || nameLower.includes("sorbate")) {
      if (pH > 5.5) needsSubstitution = true;
    }

    // RULE 3: Benzyl alcohol degrades at highly alkaline pH (> 8.0)
    if (nameLower.includes("benzyl alcohol")) {
      if (pH > 8.0) needsSubstitution = true;
    }

    // RULE 4: Kathon is unstable above pH 9.0
    if (nameLower.includes("kathon")) {
      if (pH > 9.0) needsSubstitution = true;
    }

    if (needsSubstitution) {
      // Substitute with the nearest safe, pH-compatible preservative alternative, preserving existing percentage
      formula.ingredients[preservativeIdx] = {
        ...safePreservative,
        percentage: currentIng.percentage > 0 ? currentIng.percentage : safePreservative.percentage
      };
    }
  } else {
    // If no preservative is found in the recipe, auto-include a safe, compatible preservative
    formula.ingredients.push(safePreservative);
  }

  return formula;
}

function getHlbValueByName(name: string): number | null {
  const n = (name || "").toLowerCase();
  if (n.includes("labsa") || n.includes("sulfonic acid")) return 11.5;
  if (n.includes("sles") || n.includes("ether sulfate")) return 13.0;
  if (n.includes("capb") || n.includes("cocamidopropyl betaine")) return 12.0;
  if (n.includes("aos") || n.includes("olefin sulfonate")) return 12.0;
  if (n.includes("sls needle") || n.includes("sls liquid") || n.includes("sodium lauryl sulfate")) return 40.0;
  if (n.includes("tween 20")) return 16.7;
  if (n.includes("tween 80")) return 15.0;
  if (n.includes("span 80")) return 4.3;
  if (n.includes("span 20")) return 8.6;
  if (n.includes("gms") || n.includes("glyceryl monostearate")) return 3.8;
  if (n.includes("cde") || n.includes("cocamide dea")) return 13.5;
  if (n.includes("cme") || n.includes("cocamide mea")) return 11.5;
  if (n.includes("np-9") || n.includes("nonylphenol ethoxylate (np-9)") || n.includes("alfox 200")) return 13.0;
  if (n.includes("np-6")) return 10.9;
  if (n.includes("np-10")) return 13.3;
  if (n.includes("lae-9") || n.includes("linear alcohol ethoxylate (lae-9)")) return 13.3;
  if (n.includes("lae-7")) return 12.1;
  if (n.includes("lae-3")) return 8.0;
  if (n.includes("bkc") || n.includes("benzalkonium chloride")) return 15.0;
  if (n.includes("ctac") || n.includes("cetrimonium chloride")) return 15.8;
  if (n.includes("btac") || n.includes("behentrimonium chloride")) return 14.5;
  if (n.includes("ldao") || n.includes("lauryl amine oxide")) return 14.2;
  if (n.includes("coco amine oxide")) return 13.8;
  if (n.includes("dls 40") || n.includes("disodium laureth sulfosuccinate")) return 12.6;
  if (n.includes("sarkosyl") || n.includes("sarcosinate")) return 13.5;
  if (n.includes("slmi") || n.includes("lauroyl methyl isethionate")) return 12.0;
  if (n.includes("peg-40")) return 15.0;
  if (n.includes("ceteareth-20")) return 15.2;
  if (n.includes("ceteareth-25")) return 16.2;
  if (n.includes("cetyl alcohol")) return 1.0;
  if (n.includes("stearyl alcohol")) return 1.0;
  if (n.includes("span 60")) return 4.7;
  if (n.includes("esterquat") || n.includes("dhtdmac")) return 10.0;
  if (n.includes("peg-150")) return 18.5;
  
  if (n.includes("coco glucoside")) return 12.5;
  if (n.includes("lauryl glucoside")) return 12.0;
  if (n.includes("decyl glucoside")) return 13.0;
  if (n.includes("caprylyl/capryl glucoside")) return 13.5;
  if (n.includes("taurate")) return 14.5;
  if (n.includes("isethionate") || n.includes("sci")) return 11.0;
  if (n.includes("glutamate")) return 14.0;
  if (n.includes("oat amino acids")) return 13.8;
  if (n.includes("mes 70%") || n.includes("methyl ester sulfonate")) return 12.8;
  if (n.includes("saponin") || n.includes("soapnut")) return 13.5;
  if (n.includes("slsa") || n.includes("sulfoacetate")) return 11.8;

  return null;
}

function calculateActiveMatterServer(ingredients: any[]): number {
  if (!ingredients || !Array.isArray(ingredients)) return 0;
  let totalActive = 0;
  ingredients.forEach(ing => {
    const name = (ing.name || "").toLowerCase();
    
    // Check if ingredient is a surfactant or active alkali/acid
    const isSurfactant = 
      name.includes("labsa") || name.includes("sulfonic acid") ||
      name.includes("sles") || name.includes("ether sulfate") ||
      name.includes("sls") || name.includes("lauryl sulfate") ||
      name.includes("aos") || name.includes("olefin sulfonate") ||
      name.includes("dodecylbenzene sulfonate") || name.includes("sdbs") ||
      name.includes("isethionate") || name.includes("sci") ||
      name.includes("taurate") || name.includes("sarcosinate") || name.includes("sarkosyl") ||
      name.includes("sulfosuccinate") || name.includes("dls") ||
      name.includes("sulfoacetate") || name.includes("slsa") ||
      name.includes("alkane sulfonate") || name.includes("sas") ||
      name.includes("methyl ester sulfonate") || name.includes("mes") ||
      name.includes("soap noodles") || name.includes("cocoate") || name.includes("potassium soap") || name.includes("sodium soap") ||
      name.includes("betaine") || name.includes("capb") ||
      name.includes("amphoacetate") || name.includes("amphodiacetate") ||
      name.includes("amine oxide") || name.includes("ldao") || name.includes("cocamine oxide") || name.includes("sultaine") ||
      name.includes("cetrimonium") || name.includes("ctac") ||
      name.includes("behentrimonium") || name.includes("btac") ||
      name.includes("benzalkonium") || name.includes("bkc") ||
      name.includes("didecyldimethyl") || name.includes("ddac") ||
      name.includes("esterquat") || name.includes("dhtdmac") ||
      name.includes("glucoside") || name.includes("apg") ||
      name.includes("ethoxylate") || name.includes("lae") || name.includes("fae") ||
      name.includes("np-9") || name.includes("np-6") || name.includes("np-10") || name.includes("alfox") ||
      name.includes("polysorbate") || name.includes("tween") || name.includes("span") || name.includes("sorbitan") ||
      name.includes("ceteareth") || name.includes("glyceryl stearate") || name.includes("gms") ||
      name.includes("cocamide") || name.includes("cde") || name.includes("cme") || name.includes("cmea") ||
      name.includes("sucrose cocoate") || name.includes("sucrose stearate") || name.includes("soapnut") || name.includes("saponin") ||
      name.includes("surfactant") || name.includes("naoh") || name.includes("caustic") || name.includes("sodium hydroxide") || name.includes("lye");
      
    if (isSurfactant) {
      let activePct = ing.activeMatterPct !== undefined && ing.activeMatterPct !== null ? ing.activeMatterPct : (ing.activeMatterPurity !== undefined ? ing.activeMatterPurity : (ing.active !== undefined ? ing.active : 0));
      if (!activePct || activePct === 0) {
        if (name.includes("33")) activePct = 33;
        else if (name.includes("50")) activePct = 50;
        else if (name.includes("98") || name.includes("flake")) activePct = 98;
        else activePct = 100;
      }
      totalActive += (Number(ing.percentage || 0) * Number(activePct || 0)) / 100;
    }
  });
  return Number(totalActive.toFixed(2));
}

// Utility function to enforce exactly 100.00% mass balance and update actualCost
function enforceFormulaMassBalance(formula: any) {
  if (!formula || !formula.ingredients || formula.ingredients.length === 0) return formula;
  
  // First, enforce the hard preservative safety and compatibility constraints
  formula = enforcePreservativeConstraints(formula);
  
  // Clean up any potential percentage values to be numeric, and override HLBs using our database
  let weightedHlbSum = 0;
  let surfactantPctSum = 0;

  formula.ingredients.forEach((ing: any) => {
    ing.percentage = Number(Number(ing.percentage).toFixed(2));
    
    // Override/populate HLB scientifically
    const correctHlb = getHlbValueByName(ing.name);
    if (correctHlb !== null) {
      ing.hlbValue = correctHlb;
    } else if (serverIsSurfactant(ing.name)) {
      if (ing.hlbValue === undefined || ing.hlbValue === null || ing.hlbValue > 20 || ing.hlbValue < 0) {
        ing.hlbValue = null;
      }
    } else {
      ing.hlbValue = null;
    }

    if (ing.hlbValue !== null && ing.hlbValue !== undefined && ing.hlbValue > 0) {
      weightedHlbSum += ing.percentage * ing.hlbValue;
      surfactantPctSum += ing.percentage;
    }
  });

  // Calculate blended HLB based on corrected HLB values
  if (surfactantPctSum > 0) {
    formula.calculatedHlb = (weightedHlbSum / surfactantPctSum).toFixed(1);
  } else {
    formula.calculatedHlb = "Not Applicable";
  }

  // Calculate and align activeMatter using exactly the unified surfactant-only formula
  formula.activeMatter = calculateActiveMatterServer(formula.ingredients);

  let waterIdx = formula.ingredients.findIndex((ing: any) => {
    const nameLower = ing.name.toLowerCase();
    const roleLower = (ing.role || "").toLowerCase();
    return nameLower.includes("water") || nameLower.includes("aqua") || nameLower.includes("carrier") || roleLower.includes("carrier") || roleLower.includes("solvent");
  });

  if (waterIdx === -1) {
    // If no water ingredient exists, append one!
    let currentSum = 0;
    formula.ingredients.forEach((ing: any) => {
      currentSum += ing.percentage;
    });
    const remPct = Number((currentSum < 100 ? 100 - currentSum : 0).toFixed(2));
    formula.ingredients.push({
      name: "Demineralized Water (DM Water)",
      percentage: remPct,
      role: "Solvent Carrier",
      costPerKg: 2,
      activeMatterPct: 0,
      hlbValue: null
    });
    waterIdx = formula.ingredients.length - 1;
  }

  // Recalculate water percentage
  let nonWaterSum = 0;
  formula.ingredients.forEach((ing: any, idx: number) => {
    if (idx !== waterIdx) {
      nonWaterSum += ing.percentage;
    }
  });

  if (nonWaterSum > 100) {
    // If ingredients without water exceed 100%, scale them down so water is 5% minimum
    const maxAllowedNonWater = 95.0;
    const correctionFactor = maxAllowedNonWater / nonWaterSum;
    let newNonWaterSum = 0;
    formula.ingredients.forEach((ing: any, idx: number) => {
      if (idx !== waterIdx) {
        ing.percentage = Number((ing.percentage * correctionFactor).toFixed(2));
        newNonWaterSum += ing.percentage;
      }
    });
    formula.ingredients[waterIdx].percentage = Number((100 - newNonWaterSum).toFixed(2));
  } else {
    formula.ingredients[waterIdx].percentage = Number((100 - nonWaterSum).toFixed(2));
  }

  // Double check that everything sums to exactly 100.00%
  let finalSum = 0;
  formula.ingredients.forEach((ing: any) => {
    finalSum += ing.percentage;
  });
  
  // Adjust water for any tiny floating-point/rounding residual error (e.g. 100.01%)
  if (finalSum !== 100) {
    const residual = Number((100 - finalSum).toFixed(2));
    formula.ingredients[waterIdx].percentage = Number((formula.ingredients[waterIdx].percentage + residual).toFixed(2));
  }

  // Recalculate actualCost
  let totalCost = 0;
  formula.ingredients.forEach((ing: any) => {
    totalCost += (ing.percentage / 100) * (ing.costPerKg || 0);
  });
  formula.actualCost = Number(totalCost.toFixed(2));

  return formula;
}

// Server-side helper to check if an ingredient name represents a surfactant
function serverIsSurfactant(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("labsa") || n.includes("sles") || n.includes("capb") || n.includes("glucoside") || n.includes("lae") || n.includes("aos") || n.includes("sulfonate") || n.includes("sarcosinate") || n.includes("betaine") || n.includes("amine oxide") || n.includes("esterquat") || n.includes("dhtdmac") || n.includes("soapnut") || n.includes("active surfactant") || n.includes("surfactant")) {
    return true;
  }
  return false;
}

// Fallback logic to audit a user-provided formula in demo/offline mode
function analyzeUserFormulaFallback(ingredients: any[], productType: string, grade: string, targetCost: number) {
  const list = JSON.parse(JSON.stringify(ingredients));

  // Find or insert water/carrier for 100% mass balance
  let waterIdx = list.findIndex((ing: any) => {
    const nameLower = (ing.name || "").toLowerCase();
    const roleLower = (ing.role || "").toLowerCase();
    return nameLower.includes("water") || nameLower.includes("aqua") || nameLower.includes("carrier") || roleLower.includes("carrier") || roleLower.includes("solvent");
  });

  if (waterIdx === -1) {
    let currentSum = 0;
    list.forEach((ing: any) => {
      currentSum += Number(ing.percentage || 0);
    });
    const remPct = Number((currentSum < 100 ? 100 - currentSum : 0).toFixed(2));
    list.push({
      name: "Demineralized Water (DM Water)",
      percentage: remPct,
      role: "Solvent Carrier",
      costPerKg: 2,
      activeMatterPct: 0,
      hlbValue: null
    });
    waterIdx = list.length - 1;
  }

  let nonWaterSum = 0;
  list.forEach((ing: any, idx: number) => {
    if (idx !== waterIdx) {
      nonWaterSum += Number(ing.percentage || 0);
    }
  });

  if (nonWaterSum > 100) {
    const maxAllowedNonWater = 95.0;
    const correctionFactor = maxAllowedNonWater / nonWaterSum;
    let newNonWaterSum = 0;
    list.forEach((ing: any, idx: number) => {
      if (idx !== waterIdx) {
        ing.percentage = Number((Number(ing.percentage) * correctionFactor).toFixed(2));
        newNonWaterSum += ing.percentage;
      }
    });
    list[waterIdx].percentage = Number((100 - newNonWaterSum).toFixed(2));
  } else {
    list[waterIdx].percentage = Number((100 - nonWaterSum).toFixed(2));
  }

  // Populate costs, roles, HLBs if they are missing
  list.forEach((ing: any) => {
    const n = (ing.name || "").toLowerCase();
    if (!ing.costPerKg) {
      if (n.includes("labsa")) ing.costPerKg = 135;
      else if (n.includes("sles")) ing.costPerKg = 110;
      else if (n.includes("capb")) ing.costPerKg = 95;
      else if (n.includes("water") || n.includes("aqua")) ing.costPerKg = 2;
      else if (n.includes("salt")) ing.costPerKg = 15;
      else if (n.includes("soda ash")) ing.costPerKg = 35;
      else if (n.includes("citric")) ing.costPerKg = 90;
      else if (n.includes("fragrance")) ing.costPerKg = 1500;
      else if (n.includes("preservative") || n.includes("kathon") || n.includes("phenoxy")) ing.costPerKg = 180;
      else ing.costPerKg = 80;
    }
    if (!ing.role) {
      if (n.includes("labsa")) ing.role = "Anionic Surfactant / Primary Degreaser";
      else if (n.includes("sles")) ing.role = "Anionic Surfactant / High Foam Generator";
      else if (n.includes("capb")) ing.role = "Amphoteric Surfactant / Foam Booster";
      else if (n.includes("water") || n.includes("aqua")) ing.role = "Solvent Carrier";
      else if (n.includes("salt")) ing.role = "Viscosity Control / Thickener";
      else if (n.includes("soda ash")) ing.role = "Alkaline Builder / pH Buffer";
      else if (n.includes("citric")) ing.role = "pH Neutralization Agent";
      else if (n.includes("fragrance")) ing.role = "Aesthetic Perfume";
      else ing.role = "Formulation Additive";
    }
    const correctHlb = getHlbValueByName(ing.name || "");
    if (correctHlb !== null) {
      ing.hlbValue = correctHlb;
    } else if (serverIsSurfactant(ing.name || "")) {
      if (ing.hlbValue === undefined || ing.hlbValue === null || ing.hlbValue > 20) {
        ing.hlbValue = null;
      }
    } else {
      ing.hlbValue = null;
    }
    ing.percentage = Number(Number(ing.percentage || 0).toFixed(2));
  });

  let actualCost = 0;
  list.forEach((ing: any) => {
    actualCost += (ing.percentage / 100) * (ing.costPerKg || 0);
  });
  actualCost = Number(actualCost.toFixed(2));

  const activeMatterSum = calculateActiveMatterServer(list);

  let weightedHlbSum = 0;
  let surfactantPctSum = 0;
  list.forEach((ing: any) => {
    if (ing.hlbValue !== null && ing.hlbValue !== undefined && ing.hlbValue > 0) {
      weightedHlbSum += ing.percentage * ing.hlbValue;
      surfactantPctSum += ing.percentage;
    }
  });
  const calculatedHlb = surfactantPctSum > 0 ? (weightedHlbSum / surfactantPctSum).toFixed(1) : "Not Applicable";

  return {
    name: "Audited Custom Formulation",
    productType,
    grade,
    targetCost,
    actualCost,
    activeMatter: activeMatterSum,
    calculatedHlb,
    idealHlb: "12.0 - 14.0 (for Laundry Liquid)",
    hlbImportance: "Surfactant HLB determines optimal detergency of the product.",
    properties: {
      pH: "7.5 - 8.5",
      viscosity: "1500 - 2000 cPs",
      foamHeight: "Medium-High Foam",
      cleaningRating: 8.5,
      ecoRating: 7.5,
      compatibilityScore: 98
    },
    ingredients: list,
    manufacturingMethod: [
      { order: 1, action: "Measure Demineralized Water and begin slow stirring.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Ensure equipment grounding." },
      { order: 2, action: "Sequentially add ingredients, checking pH buffers and adjusting if required.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Wear chemical splash goggles." }
    ],
    commonMistakes: ["Excessive rapid stirring resulting in foaming", "Adding salt too quickly bypassing viscosity peak"],
    troubleshootingNotes: ["If separation occurs, check for balance or add hydrotropes"],
    packagingCompatibility: "PE, PP, or PET plastic containers"
  };
}

// 2. AI Formulation Generator API
app.post("/api/ai/formulate", async (req, res) => {
  const {
    mode,
    ingredients: inputIngredients,
    productType: rawProductType,
    productCategory,
    targetCost,
    targetpH: rawTargetpH,
    targetPH,
    targetFoam: rawTargetFoam,
    foamingProfile,
    targetViscosity,
    ecoRequirement: rawEcoRequirement,
    ecoRatingRule,
    grade: rawGrade,
    qualityGrade,
    availableIngredients,
    targetActiveMatter: rawTargetActiveMatter,
    activeMatter: rawActiveMatter,
    targetHlb,
    waterHardnessPpm: rawWaterHardnessPpm,
    waterHardness: rawWaterHardness
  } = req.body;

  const productType = rawProductType || productCategory;
  const targetpH = rawTargetpH || targetPH;
  const targetFoam = rawTargetFoam || foamingProfile;
  const ecoRequirement = rawEcoRequirement || ecoRatingRule;
  const grade = rawGrade || qualityGrade;
  const targetActiveMatter = rawTargetActiveMatter !== undefined ? rawTargetActiveMatter : rawActiveMatter;
  const waterHardnessPpm = rawWaterHardnessPpm !== undefined ? rawWaterHardnessPpm : rawWaterHardness;

  const client = getAIClient();

  const typeLower = (productType || "").toLowerCase();
  let activeMatter = targetActiveMatter !== undefined && targetActiveMatter !== null && !isNaN(Number(targetActiveMatter))
    ? Number(targetActiveMatter)
    : (typeLower.includes("anti-foam") || typeLower.includes("antifoam") || typeLower.includes("defoamer")
        ? (grade === "Premium" ? 22.0 : grade === "Standard" ? 15.0 : 9.0)
        : typeLower.includes("softener") || typeLower.includes("conditioner")
        ? (grade === "Premium" ? 15.0 : grade === "Standard" ? 10.0 : 6.0)
        : typeLower.includes("degreaser")
        ? (grade === "Premium" ? 20.0 : grade === "Standard" ? 14.0 : 8.0)
        : (grade === "Premium" ? 18.5 : grade === "Standard" ? 12.0 : 7.5));

  const hardness = Number(waterHardnessPpm) || 150;
  const waterHardness = hardness;
  let builderPercentage = 0.5;
  let builderName = "Sodium Gluconate";
  let builderRole = "Eco Chelating Agent / Water Softener";
  let builderCost = 120;

  if (hardness < 100) {
    builderPercentage = 0.4;
    builderName = "Sodium Gluconate";
    builderRole = "Eco Chelating Agent (Balanced for Soft water: " + hardness + " ppm)";
    builderCost = 120;
  } else if (hardness >= 100 && hardness < 250) {
    builderPercentage = 1.2;
    builderName = "GLDA (Dissolvine GL 47%)";
    builderRole = "Green Biodegradable Chelator / Water Softener (Adjusted for Medium hardness: " + hardness + " ppm)";
    builderCost = 195;
  } else if (hardness >= 250 && hardness < 400) {
    builderPercentage = 2.2;
    builderName = "GLDA (Dissolvine GL 47%)";
    builderRole = "Green Biodegradable Chelator / Water Softener (Adjusted for Hard water: " + hardness + " ppm)";
    builderCost = 195;
  } else {
    builderPercentage = 3.0; // capped at practical formulation limit
    builderName = "GLDA (Dissolvine GL 47%)";
    builderRole = "Green Biodegradable Chelator / Water Softener (Adjusted for Very Hard water: " + hardness + " ppm)";
    builderCost = 195;
  }

  let calculatedHlb = "12.8";
  let idealHlb = "12.0 - 14.0 (for Laundry Liquid Detergency)";
  let hlbImportance = "HLB (Hydrophilic-Lipophilic Balance) measures the relative size and strength of hydrophilic (water-loving) and lipophilic (oil-loving) groups in a surfactant molecule. For laundry detergent liquids, an HLB value of 12 to 14 is the industry standard for optimum cleaning because it allows surfactants to bridge the gap between oil-based soils and the water carrier, effectively emulsifying and lifting grease. If the HLB is too low (e.g. 4-6), the product will act as an anti-foaming agent or water-in-oil emulsifier and fail to clean. If it's too high (e.g. 16-18), it acts as a solubilizer or hydrotrope, becoming too soluble in water to adequately partition onto soil surfaces.";
  
  let ingredients: any[] = [];
  let manufacturingMethod: any[] = [];
  let commonMistakes: string[] = [];
  let troubleshootingNotes: string[] = [];
  let packagingCompatibility = "";

  const isDishwash = typeLower.includes("dish") || typeLower.includes("vessel") || typeLower.includes("utensil") || typeLower.includes("plate");
  const isPureEco = ecoRequirement === "Eco-Friendly Only" || ecoRequirement === "Eco" || ecoRequirement === "Pure Plant-Based" || ecoRequirement === "Pure Plant";

  if (isDishwash) {
    calculatedHlb = isPureEco ? "13.0" : "13.2";
    idealHlb = "13.0 - 15.0 (for Dishwash Detergency)";
    hlbImportance = "For dishwash liquids, an HLB value of 13 to 15 is standard to efficiently emulsify and suspend fatty food greases and butter oils from plates and utensils. Crucially, dishwash formulations must NEVER contain optical brighteners (CBS-X) or CMC (Carboxymethyl Cellulose) as they are meant for cotton fabrics and leave a toxic chemical or cloudy white film residue on plates.";
    
    if (isPureEco) {
      ingredients = [
        { name: "Coco Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 14.0 : grade === "Standard" ? 9.0 : 5.0, role: "Non-ionic Plant Surfactant / Primary Degreaser", costPerKg: 160, activeMatterPct: 50, hlbValue: 13.6 },
        { name: "Lauryl Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 10.0 : grade === "Standard" ? 6.0 : 3.0, role: "Non-ionic Plant Surfactant / Foam Stabilizer", costPerKg: 175, activeMatterPct: 50, hlbValue: 12.0 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 8.0 : grade === "Standard" ? 5.0 : 2.5, role: "Amphoteric Surfactant / Gentle Hand Mildness", costPerKg: 95, activeMatterPct: 30, hlbValue: 12.0 },
        { name: "Sodium Gluconate", percentage: 1.0, role: "Eco Chelator / Water Softener", costPerKg: 120, activeMatterPct: 0, hlbValue: null },
        { name: "Xanthan Gum (Natural Polymer)", percentage: 0.8, role: "Eco-friendly Thickener & Stabilizer", costPerKg: 350, activeMatterPct: 0, hlbValue: null },
        { name: "Citric Acid (for skin-friendly pH adjustment)", percentage: 0.25, role: "pH Adjuster (Buffers pH to 7.2 - 7.5)", costPerKg: 90, activeMatterPct: 0, hlbValue: null },
        { name: "Sodium Benzoate (Eco Preservative)", percentage: 0.2, role: "Eco Preservative / Prevents yeast & mold growth", costPerKg: 140, activeMatterPct: 0, hlbValue: null },
        { name: "Lemon Essential Oil (Natural Fragrance)", percentage: 0.25, role: "Natural Citrus Scent", costPerKg: 1800, activeMatterPct: 0, hlbValue: null },
        { name: "Natural Curcumin (Yellow Dye)", percentage: 0.01, role: "Natural Aesthetic Dye", costPerKg: 600, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Aqueous Solvent Carrier", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
      ];

      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing tank. Start stirrer at slow speed (40-50 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly disperse Xanthan Gum into water. Mix vigorously using a high-shear mixer or high speed to prevent lump formation until fully hydrated.", mixingTime: "20 mins", mixingSpeed: "High (1200 RPM)", temperature: "Ambient" },
        { order: 3, action: "Add Coco Glucoside and Lauryl Glucoside. Stir very gently to avoid generating foam. Keep speed below 60 RPM.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 4, action: "Slowly pour in CAPB and Sodium Gluconate. Stir until the mixture is fully transparent and homogeneous.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 5, action: "Add Sodium Benzoate and pre-dissolved Citric Acid. Check the pH carefully. Adjust with Citric Acid to fall strictly in the skin-safe range of 7.2 - 7.5.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 6, action: "Incorporate Lemon Essential Oil and Curcumin dye. Blend for 10 minutes until uniform and clear.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];

      commonMistakes = [
        "Adding Xanthan Gum too fast without high-speed mixing, creating solid 'fish-eye' lumps that never dissolve.",
        "Stirring too rapidly after adding Glucosides, leading to excessive foaming that takes 24 hours to clear."
      ];

      troubleshootingNotes = [
        "If viscosity is too low: check Xanthan Gum hydration. You can add 0.1% increments of Xanthan Gum or Guar Gum.",
        "If product is hazy: Ensure the pH is correct (7.2 - 7.5). If hazy, check that all Glucosides are fully solubilized."
      ];
    } else {
      ingredients = [
        { name: "LABSA (90%)", percentage: grade === "Premium" ? 9.0 : grade === "Standard" ? 6.0 : 3.5, role: "Anionic Surfactant / Primary Degreaser", costPerKg: 135, activeMatterPct: 90, hlbValue: 11.5 },
        { name: "Sodium Hydroxide (NaOH, Caustic Soda) - for neutralization", percentage: grade === "Premium" ? 1.22 : grade === "Standard" ? 0.81 : 0.47, role: "Neutralizing Agent", costPerKg: 45, activeMatterPct: 0, hlbValue: null },
        { name: "SLES (70%)", percentage: grade === "Premium" ? 10.0 : grade === "Standard" ? 6.5 : 3.0, role: "Anionic Surfactant / High Foam Generator", costPerKg: 110, activeMatterPct: 70, hlbValue: 13.0 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 4.0 : grade === "Standard" ? 2.5 : 1.5, role: "Amphoteric Surfactant / Foam Booster & Hand Mildness", costPerKg: 95, activeMatterPct: 30, hlbValue: 12.0 },
        { name: builderName, percentage: builderPercentage, role: builderRole, costPerKg: builderCost, activeMatterPct: 0, hlbValue: null },
        { name: "Sodium Chloride (Salt)", percentage: 1.5, role: "Viscosity Thickener", costPerKg: 15, activeMatterPct: 0, hlbValue: null },
        { name: "Preservative (Formalin or Kathon CG)", percentage: 0.1, role: "Preservative / Prevents spoilage & rotting", costPerKg: 180, activeMatterPct: 0, hlbValue: null },
        { name: "Fragrance (Lemon / Citrus)", percentage: 0.2, role: "Fresh Deodorizing Fragrance", costPerKg: 1500, activeMatterPct: 0, hlbValue: null },
        { name: "Colorant (Acid Green or Lemon Yellow Dye)", percentage: 0.01, role: "Esthetics", costPerKg: 500, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Solvent Carrier", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
      ];

      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing tank. Start stirrer at moderate speed (50-60 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly disperse acid slurry (LABSA) into water until uniform and fully hydrated.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 3, action: "Neutralize to pH 7.2 - 7.8 with Caustic Soda solution. Check pH carefully to ensure skin-safe mildness.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 4, action: "Add SLES and mix gently to avoid air bubbles and foaming. Stir until crystal clear.", mixingTime: "25 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 5, action: `Add CAPB, ${builderName || "Sodium Gluconate"}, and Fragrance/Colorant. Stir until uniform.`, mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 6, action: "Slowly add pre-dissolved Sodium Chloride (salt) in small increments to build high viscosity. Monitor thickness curve.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 7, action: "Incorporate Preservative and perform final QC checks for viscosity, pH, and active content.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];

      commonMistakes = [
        "Using CMC or Optical Brightener (this causes cloudy glasses and chemical buildup on plates).",
        "Adding salt too fast (passes viscosity peak, resulting in permanent water-like thinning).",
        "Stirring vigorously (causes air entrapment, making the liquid cloudy or opaque with foam)."
      ];

      troubleshootingNotes = [
        "If the dishwash is cloudy: Check the pH. Ensure it is neutral (6.5 - 7.5). If pH is correct, add a hydrotrope like SXS or a small amount of non-ionic active to clear.",
        "If too thin: Slowly adjust salt level. If salt curve is exceeded, add SLES or a non-ionic active to restore viscosity."
      ];
    }

    packagingCompatibility = "Squeezable PET or HDPE bottles with flip-top caps or push-pull dispensers.";
  } else if (typeLower.includes("anti-foam") || typeLower.includes("antifoam") || typeLower.includes("defoamer")) {
    calculatedHlb = "2.5";
    idealHlb = "1.0 - 3.0 (for Anti-foaming Agents)";
    activeMatter = grade === "Premium" ? 22.0 : grade === "Standard" ? 15.0 : 9.0;
    hlbImportance = "For anti-foaming agents, a low HLB (1.0 - 3.0) is essential so the surfactant is completely insoluble in the continuous water phase. This allows it to migrate to the air-water interface, spreading as a thin film that destabilizes and collapses the liquid lamellae of the foam bubbles. If the HLB is too high, the defoamer would solubilize and boost foam rather than suppress it.";
    ingredients = [
      { name: "Polydimethylsiloxane (Silicone Fluid)", percentage: grade === "Premium" ? 12.0 : grade === "Standard" ? 8.0 : 5.0, role: "De-foaming Active Component", costPerKg: 350, activeMatterPct: 100, hlbValue: 1.0 },
      { name: "Sorbitan Oleate (Span 80)", percentage: grade === "Premium" ? 10.0 : grade === "Standard" ? 7.0 : 4.0, role: "Lipophilic Co-Emulsifier", costPerKg: 210, activeMatterPct: 100, hlbValue: 4.3 },
      { name: "Light Mineral Oil (Carrier)", percentage: 20.0, role: "Hydrophobic Liquid Carrier", costPerKg: 140, activeMatterPct: 0, hlbValue: null },
      { name: "Sodium Carboxymethyl Cellulose", percentage: 1.0, role: "Emulsion Stabilizer & Thickener", costPerKg: 280, activeMatterPct: 0, hlbValue: null },
      { name: "Preservative (Kathon CG)", percentage: 0.1, role: "Preservative", costPerKg: 180, activeMatterPct: 0, hlbValue: null },
      { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Continuous Solvent Phase", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
    ];
    manufacturingMethod = [
      { order: 1, action: "Blend Polydimethylsiloxane (Silicone Fluid) and Sorbitan Oleate (Span 80) together in Light Mineral Oil in a separate vessel until fully uniform.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 2, action: "Charge the main vessel with DM Water. Dissolve Sodium Carboxymethyl Cellulose slowly under high shear to ensure complete hydration without lumps.", mixingTime: "25 mins", mixingSpeed: "High Shear (1800 RPM)", temperature: "45°C" },
      { order: 3, action: "Under high-speed agitation, slowly pour the oil/silicone blend into the water/polymer phase to form a stable milky emulsion.", mixingTime: "20 mins", mixingSpeed: "High Speed (800 RPM)", temperature: "Ambient" },
      { order: 4, action: "Add preservative and stir gently to cool down and de-aerate the emulsion.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
    ];
    commonMistakes = [
      "Inadequate shearing when combining oil and water phases (causes oil droplets to pool and separate).",
      "Using high-HLB surfactants (causes the silicone oil to solubilize, neutralizing its anti-foaming capability)."
    ];
    troubleshootingNotes = [
      "If separation occurs: Increase high-shear mixing time or add 0.2% Xanthan gum to increase the continuous phase viscosity to lock droplets."
    ];
    packagingCompatibility = "Fluorinated HDPE or thick PET containers to prevent oil permeation.";
  } else if (typeLower.includes("softener") || typeLower.includes("conditioner")) {
    calculatedHlb = "10.2";
    idealHlb = "9.0 - 12.0 (for Fabric Softener Conditioning)";
    activeMatter = grade === "Premium" ? 15.0 : grade === "Standard" ? 10.0 : 6.0;
    hlbImportance = "Fabric softeners utilize cationic surfactants at HLB 9.0 - 12.0. These positively charged molecules are drawn to the negatively charged textile fibers, adsorbing as a lubricant monolayer that reduces fiber-to-fiber friction, static build-up, and fabric stiffness. Mismatched HLB can lead to unstable separation or gelation in storage.";
    ingredients = [
      { name: "DHTDMAC (Esterquat / Cationic Surfactant)", percentage: grade === "Premium" ? 12.0 : grade === "Standard" ? 8.0 : 5.0, role: "Cationic Softening Agent", costPerKg: 180, activeMatterPct: 80, hlbValue: 10.0 },
      { name: "Linear Alcohol Ethoxylate (LAE-9)", percentage: 2.0, role: "Non-ionic Emulsifier & Re-wetting Agent", costPerKg: 185, activeMatterPct: 100, hlbValue: 13.3 },
      { name: "Calcium Chloride (CaCl2 10% solution)", percentage: 0.5, role: "Viscosity Control / Electrolyte", costPerKg: 40, activeMatterPct: 0, hlbValue: null },
      { name: "Preservative (Formalin)", percentage: 0.1, role: "Preservative", costPerKg: 180, activeMatterPct: 0, hlbValue: null },
      { name: "Fragrance (Lavender Encapsulated)", percentage: 0.4, role: "Long-lasting Fragrance", costPerKg: 2200, activeMatterPct: 0, hlbValue: null },
      { name: "Colorant (Blue Dye)", percentage: 0.01, role: "Esthetics", costPerKg: 500, activeMatterPct: 0, hlbValue: null },
      { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Aqueous Carrier", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
    ];
    manufacturingMethod = [
      { order: 1, action: "Heat DM Water in the main vessel to 55°C - 60°C. Cationic esterquats must be dispersed above their melting point.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "60°C" },
      { order: 2, action: "Slowly add melted Esterquat active matter into the hot water under steady agitation. Avoid high shear to prevent air bubble locking.", mixingTime: "20 mins", mixingSpeed: "Medium (150 RPM)", temperature: "55°C" },
      { order: 3, action: "Add the LAE-9 surfactant to stabilize the cationic dispersion and assist in future wetting during fabric washes.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "50°C" },
      { order: 4, action: "Gradually add Calcium Chloride solution to adjust viscosity. Observe the mix thinning from a thick gel into a smooth pourable liquid.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "45°C" },
      { order: 5, action: "Cool down to below 35°C under slow stirring, then add Fragrance, Dye, and Preservative.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "30°C" }
    ];
    commonMistakes = [
      "Adding Esterquat to cold water (results in thick, un-dispersed lumps that block filters).",
      "Mixing with anionic surfactants (causes mutual neutralization, producing an inactive sticky precipitate)."
    ];
    troubleshootingNotes = [
      "If the mixture is too thick: Add small doses of CaCl2 electrolyte to thin the liquid. Do not add anionic thickeners like CMC."
    ];
    packagingCompatibility = "Standard PET or HDPE bottles. Cationic softeners do not corrode plastics.";
  } else if (typeLower.includes("degreaser")) {
    calculatedHlb = "13.6";
    idealHlb = "12.5 - 14.5 (for Heavy-Duty Degreasing)";
    activeMatter = grade === "Premium" ? 20.0 : grade === "Standard" ? 14.0 : 8.0;
    hlbImportance = "Heavy-duty degreasers require an HLB range of 12.5 - 14.5 to efficiently penetrate, break up, and emulsify dense polymerized greases, lubricating oils, and motor carbon. Often coupled with strong alkaline builders like Sodium Metasilicate, these high-HLB non-ionic surfactants remain stable in electrolyte-dense environments and prevent soil re-deposition.";
    ingredients = [
      { name: "Linear Alcohol Ethoxylate (LAE-9)", percentage: grade === "Premium" ? 14.0 : grade === "Standard" ? 10.0 : 6.0, role: "Non-ionic Emulsifier & Primary Detergent", costPerKg: 185, activeMatterPct: 100, hlbValue: 13.3 },
      { name: "CAPB (30%)", percentage: grade === "Premium" ? 6.0 : grade === "Standard" ? 4.0 : 2.0, role: "Amphoteric Co-surfactant / Alkaline Coupling", costPerKg: 95, activeMatterPct: 30, hlbValue: 12.0 },
      { name: "Potassium Hydroxide (KOH, 45% Sol)", percentage: 5.0, role: "Alkaline Saponification Agent", costPerKg: 85, activeMatterPct: 0, hlbValue: null },
      { name: "Sodium Metasilicate Pentahydrate", percentage: 4.0, role: "Inorganic Builder & Corrosion Inhibitor", costPerKg: 75, activeMatterPct: 0, hlbValue: null },
      { name: "Sodium Xylene Sulfonate (SXS 40%)", percentage: 5.0, role: "Hydrotrope / Coupling Agent", costPerKg: 90, activeMatterPct: 0, hlbValue: null },
      { name: "Solvent (Butyl Carbitol)", percentage: 5.0, role: "Organic Co-Solvent / Grease Cutter", costPerKg: 160, activeMatterPct: 0, hlbValue: null },
      { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Carrier Solvent", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
    ];
    manufacturingMethod = [
      { order: 1, action: "Charge full water quantity. Dissolve Sodium Metasilicate Pentahydrate completely under moderate agitation.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 2, action: "Cautiously add Potassium Hydroxide solution. Note that this reaction is slightly exothermic.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 3, action: "Add Sodium Xylene Sulfonate (SXS) hydrotrope and Butyl Carbitol grease solvent. Stir to obtain a completely clear phase.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 4, action: "Incorporate Linear Alcohol Ethoxylate (LAE-9) and CAPB. Agitate slowly to prevent foam generation inside the vessel.", mixingTime: "20 mins", mixingSpeed: "Medium", temperature: "Ambient" }
    ];
    commonMistakes = [
      "Failing to use a hydrotrope (high levels of builders and electrolytes can salt out non-ionic surfactants, causing the mixture to turn cloudy and separate into layers).",
      "Using ammonium-based salts with KOH (releases hazardous ammonia gas)."
    ];
    troubleshootingNotes = [
      "If formula is cloudy: Add small increments of SXS (Sodium Xylene Sulfonate) hydrotrope to clear and couple the surfactants."
    ];
    packagingCompatibility = "High-Density Polyethylene (HDPE) only. Glass or metals are subject to corrosion by highly alkaline degreasers.";
  } else {
    // Default to Laundry Liquid Detergent
    if (isPureEco) {
      ingredients = [
        { name: "Coco Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 15.0 : grade === "Standard" ? 10.0 : 6.0, role: "Non-ionic Bio-surfactant / Greasy Soil Emulsifier", costPerKg: 160, activeMatterPct: 50, hlbValue: 13.6 },
        { name: "Lauryl Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 8.0 : grade === "Standard" ? 5.0 : 3.0, role: "Non-ionic Bio-surfactant / Soil Suspender", costPerKg: 175, activeMatterPct: 50, hlbValue: 12.0 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 6.0 : grade === "Standard" ? 4.0 : 2.0, role: "Amphoteric Surfactant / Foam Stabilization & Mildness", costPerKg: 95, activeMatterPct: 30, hlbValue: 12.0 },
        { name: "Sodium Gluconate", percentage: 1.5, role: "Eco-friendly Chelator / Heavy Metal Sequestering", costPerKg: 120, activeMatterPct: 0, hlbValue: null },
        { name: "HEC (Hydroxyethyl Cellulose)", percentage: 0.8, role: "Natural Cellulosic Thickener & Anti-redeposition", costPerKg: 320, activeMatterPct: 0, hlbValue: null },
        { name: "Sodium Benzoate (Eco Preservative)", percentage: 0.2, role: "Eco Preservative / Prevents yeast & mold growth", costPerKg: 140, activeMatterPct: 0, hlbValue: null },
        { name: "Fragrance (Aqua Floral Natural Essential Blend)", percentage: 0.3, role: "Natural Therapeutic Scent", costPerKg: 1800, activeMatterPct: 0, hlbValue: null },
        { name: "Natural Curcumin (D&C Dye equivalent)", percentage: 0.01, role: "Esthetics", costPerKg: 500, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Solvent Carrier", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
      ];

      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing vessel. Start agitator at slow speed (60-80 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly sift HEC (thickener) into the water under rapid stirring to ensure complete dispersion without lumps. Add a tiny pinch of citric acid to trigger hydration if needed.", mixingTime: "20 mins", mixingSpeed: "High (800 RPM)", temperature: "Ambient" },
        { order: 3, action: "Add Coco Glucoside and Lauryl Glucoside. Stir very gently to avoid generating foam.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 4, action: "Add CAPB, Sodium Gluconate, and Sodium Benzoate. Stir until completely crystal clear and uniform.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 5, action: "Cool down and add Fragrance and natural colorant. Perform final QC check for skin-safe pH (7.2 - 7.6) and viscosity.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];

      commonMistakes = [
        "Adding HEC too fast, which creates solid lumps (gellies) that do not dissolve in water.",
        "Stirring too fast, trapping micro-foam that makes the liquid look white and cloudy."
      ];

      troubleshootingNotes = [
        "If viscosity is too low: check HEC hydration. You can add 0.1% increments of pre-hydrated HEC to build viscosity safely.",
        "If separation occurs: ensure the Glucosides were added in the correct order and stirred until clear."
      ];
    } else {
      ingredients = [
        { name: "LABSA (90%)", percentage: grade === "Premium" ? 10.0 : grade === "Standard" ? 7.0 : 4.0, role: "Anionic Surfactant / Primary Cleaning", costPerKg: 135, activeMatterPct: 90, hlbValue: 11.5 },
        { name: "Sodium Hydroxide (NaOH, Caustic Soda) - for neutralization", percentage: grade === "Premium" ? 1.35 : grade === "Standard" ? 0.95 : 0.54, role: "Neutralizing Agent", costPerKg: 45, activeMatterPct: 0, hlbValue: null },
        { name: "SLES (70%)", percentage: grade === "Premium" ? 8.0 : grade === "Standard" ? 5.0 : 2.5, role: "Anionic Surfactant / Foam Booster", costPerKg: 110, activeMatterPct: 70, hlbValue: 13.0 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 3.0 : grade === "Standard" ? 2.0 : 1.0, role: "Amphoteric Surfactant / Mildness", costPerKg: 95, activeMatterPct: 30, hlbValue: 12.0 },
        { name: builderName, percentage: builderPercentage, role: builderRole, costPerKg: builderCost, activeMatterPct: 0, hlbValue: null },
        { name: "CMC (Carboxymethyl Cellulose) / HEC", percentage: 0.6, role: "Thickener & Anti-redeposition", costPerKg: 280, activeMatterPct: 0, hlbValue: null },
        { name: "Optical Brightener (CBS-X)", percentage: 0.1, role: "Optical Brightener", costPerKg: 1200, activeMatterPct: 0, hlbValue: null },
        { name: "Preservative (Formalin or Kathon)", percentage: 0.1, role: "Preservative", costPerKg: 180, activeMatterPct: 0, hlbValue: null },
        { name: "Fragrance (Aqua Floral / Lemon)", percentage: 0.25, role: "Fragrance", costPerKg: 1800, activeMatterPct: 0, hlbValue: null },
        { name: "Colorant (D&C Dye)", percentage: 0.01, role: "Esthetics", costPerKg: 500, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Solvent Carrier", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
      ];

      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing vessel. Start agitator at low speed (60-80 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly add LABSA (Acid Slurry) into water under continuous stirring. Stir until fully dissolved and uniform (no brown streaks).", mixingTime: "15 mins", mixingSpeed: "Medium (120 RPM)", temperature: "Ambient (LABSA hydration is exothermic)" },
        { order: 3, action: "Gradually add Caustic Soda solution (or dissolved NaOH flakes) to neutralize LABSA. Monitor pH continuously until it reaches 7.5 - 8.2.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient (keep temp < 45°C)" },
        { order: 4, action: "Incorporate SLES slowly to prevent air entrapment and foaming. Stir until SLES is completely dissolved and clear.", mixingTime: "25 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 5, action: `Add CAPB, ${builderName}, and dissolved Optical Brightener. Stir until completely homogeneous.`, mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 6, action: "Add thickener (e.g., pre-hydrated CMC or HEC) slowly to adjust the viscosity to target. Add salt (NaCl) in small increments if further viscosity build is desired.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 7, action: "Cool down if needed, then add Fragrance, Colorant, and Preservative. Perform final QC check for pH, Active Matter, and Viscosity.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];

      commonMistakes = [
        "Adding water directly to concentrated LABSA (causes localized gelation and lumps).",
        "Stirring too fast (creates micro-foam that takes 24-48 hours to settle, causing cloudy/hazy product).",
        "Inadequate pH control (if pH falls below 7.0, SLES/LABSA can slowly hydrolyze and lose active strength; if pH > 9.0, skin mildness is reduced)."
      ];

      troubleshootingNotes = [
        "If viscosity drops suddenly: you may have passed the salt-curve peak. Add a small amount of non-ionic surfactant (e.g., CDE or Cocamide MEA) or polymer (HEC) to restore thickness.",
        "If product separates into layers: check electrolyte balance or increase hydrotrope (e.g., SXS - Sodium Xylene Sulfonate) to couple the formula."
      ];
    }

    packagingCompatibility = "High-Density Polyethylene (HDPE) or PET bottles are highly recommended. Avoid metal containers as neutralized surfactants can still cause micro-corrosion over time.";
  }

  // Strictly filter mock ingredients based on user's custom "Available Raw Materials" column if provided
  const userHasAvailable = availableIngredients && availableIngredients.trim().length > 0;
  if (userHasAvailable) {
    const rawTokens = availableIngredients.split(",").map((x: string) => x.trim().toLowerCase()).filter(Boolean);
    // Allow solvent/water, basic neutralizers, pH adjusters, and preservatives as default safety fallbacks so they are NEVER filtered out
    const allowedWords = [
      ...rawTokens,
      "water", "aqua", "carrier", "solvent", "dm water", "demineralized water",
      "preservative", "formalin", "kathon", "benzoate", "sorbate", "dmdm", "hydantoin", "kathon cg", "methylisothiazolinone",
      "citric", "acid", "adjuster", "naoh", "caustic", "sodium hydroxide", "neutraliz", "koh", "potassium hydroxide"
    ];

    ingredients = ingredients.filter(ing => {
      const nameL = ing.name.toLowerCase();
      return allowedWords.some((token: string) => {
        if (token.length <= 4) {
          const regex = new RegExp(`\\b${token}\\b|${token}`, "i");
          return regex.test(nameL);
        }
        return nameL.includes(token);
      });
    });

    // If too restrictive (e.g. 0 or 1 item left), populate a safe base with what they listed
    if (ingredients.length <= 1) {
      ingredients = [
        { name: "SLES (70%)", percentage: grade === "Premium" ? 15.0 : grade === "Standard" ? 10.0 : 6.0, role: "Primary Surfactant", costPerKg: 110, activeMatterPct: 70, hlbValue: 13.0 },
        { name: "Sodium Chloride (Salt)", percentage: 1.5, role: "Viscosity Builder", costPerKg: 15, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0.0, role: "Solvent Carrier", costPerKg: 2, activeMatterPct: 0, hlbValue: null }
      ];
    }
  }

  // Set DM water percentage dynamically
  let initialNonWaterSum = 0;
  let initialWaterIdx = -1;
  ingredients.forEach((ing, idx) => {
    if (ing.name.includes("Water") || ing.name.includes("Carrier") || ing.name.includes("Solvent")) {
      initialWaterIdx = idx;
    } else {
      initialNonWaterSum += ing.percentage;
    }
  });
  if (initialWaterIdx !== -1) {
    const calculatedWater = 100 - initialNonWaterSum;
    ingredients[initialWaterIdx].percentage = Number((calculatedWater > 0 ? calculatedWater : 5.0).toFixed(2));
  }

  // Adjust offline mock ingredients based on the target active surfactant matter if provided
  if (targetActiveMatter !== undefined && targetActiveMatter !== null && !isNaN(Number(targetActiveMatter))) {
    const desiredActive = Number(targetActiveMatter);
    // Calculate current active matter of default recipe
    let defaultActive = 0;
    ingredients.forEach(ing => {
      if (ing.activeMatterPct > 0) {
        defaultActive += (ing.percentage * ing.activeMatterPct) / 100;
      }
    });

    if (defaultActive > 0) {
      const scaleFactor = desiredActive / defaultActive;
      
      // Scale surfactants
      ingredients = ingredients.map(ing => {
        if (ing.activeMatterPct > 0) {
          return {
            ...ing,
            percentage: Number((ing.percentage * scaleFactor).toFixed(2))
          };
        }
        return ing;
      });

      // Scale neutralizers (NaOH or KOH) proportionally if there is LABSA
      const labsa = ingredients.find(i => i.name.includes("LABSA"));
      if (labsa) {
        ingredients = ingredients.map(ing => {
          if (ing.name.includes("NaOH") || ing.name.includes("Sodium Hydroxide") || ing.name.includes("Caustic Soda")) {
            return {
              ...ing,
              percentage: Number((labsa.percentage * 0.135).toFixed(2))
            };
          }
          return ing;
        });
      }

      // Now recalculate water/solvent percentage so total is exactly 100%
      let nonWaterSum = 0;
      let waterIdx = -1;
      ingredients.forEach((ing, idx) => {
        const nameLower = ing.name.toLowerCase();
        if (nameLower.includes("water") || nameLower.includes("aqua") || nameLower.includes("carrier") || nameLower.includes("solvent")) {
          waterIdx = idx;
        } else {
          nonWaterSum += ing.percentage;
        }
      });

      if (waterIdx !== -1) {
        let waterPct = 100 - nonWaterSum;
        if (waterPct < 5) {
          // Surfactants are too high, clamp water to 5% and scale everything down
          const clampWaterPct = 5.0;
          const correctionFactor = (100 - clampWaterPct) / nonWaterSum;
          ingredients = ingredients.map((ing, idx) => {
            if (idx !== waterIdx) {
              return {
                ...ing,
                percentage: Number((ing.percentage * correctionFactor).toFixed(2))
              };
            }
            return ing;
          });
          ingredients[waterIdx].percentage = clampWaterPct;
        } else {
          ingredients[waterIdx].percentage = Number(waterPct.toFixed(2));
        }
      }
    }
  }

  const mockFormula = {
    name: `Custom AI ${grade} ${productType}`,
    productType,
    grade,
    targetCost,
    actualCost: Math.round((targetCost * 0.9) * 10) / 10,
    activeMatter,
    calculatedHlb: targetHlb ? String(targetHlb).split("-")[0].trim() : calculatedHlb,
    idealHlb: targetHlb ? `${targetHlb} (User Configured)` : idealHlb,
    hlbImportance: targetHlb 
      ? `This formula has been balanced to match your custom Target HLB of ${targetHlb}. In cleaning chemistry, adjusting the HLB value allows precision targeting of specific soil and surface types.`
      : hlbImportance,
    targetedPH: targetpH ? String(targetpH) : "6.0",
    estimatedPH: targetpH ? String(targetpH) : "6.0",
    properties: {
      pH: targetpH ? String(targetpH) : (typeLower.includes("degreaser") ? "12.0" : typeLower.includes("softener") ? "4.0" : "6.0"),
      viscosity: targetViscosity || "1500 - 2500 cPs",
      foamHeight: typeLower.includes("anti-foam") ? "Zero Foam (< 5mm)" : targetFoam === "Low Foam" ? "Low (< 50mm)" : targetFoam === "Medium Foam" ? "Medium (100-150mm)" : "High (> 220mm)",
      cleaningRating: grade === "Premium" ? 92 : grade === "Standard" ? 78 : 60,
      ecoRating: ecoRequirement === "Eco-Friendly Only" || ecoRequirement === "Eco" ? 95 : ecoRequirement === "Semi-Synthetic" ? 60 : ecoRequirement === "Synthetic" ? 25 : 75,
      compatibilityScore: 98,
    },
    ingredients,
    manufacturingMethod,
    commonMistakes,
    troubleshootingNotes,
    packagingCompatibility
  };

  if (mode === "check") {
    const checkedFallback = analyzeUserFormulaFallback(inputIngredients || [], productType, grade, targetCost);
    return res.json({
      success: true,
      mode: "Audited Custom Formulation",
      formula: checkedFallback
    });
  }

  if (!client) {
    const balancedMock = enforceFormulaMassBalance(mockFormula);
    return res.json({
      success: true,
      mode: "Demo/Offline Mode",
      formula: balancedMock
    });
  }

  try {
    let prompt = "";
    if (mode === "check") {
      const userIngredientsStr = JSON.stringify(inputIngredients || [], null, 2);
      prompt = `You are an expert detergent chemist. The user has provided their own custom detergent ingredient recipe and wants you to audit and analyze it. 
STRICT REQUIREMENT: You MUST NOT invent, add, or replace any ingredients in the user's recipe (except you can adjust the solvent water/carrier percentage to ensure the total sums up exactly to 100.0% if it doesn't already, or add/fill Demineralized Water (DM Water) to reach 100% mass balance if a solvent carrier is missing/implied).
Do not redesign the formula. Analyze/audit ONLY.

User's Input Ingredient List:
${userIngredientsStr}

Product Type: ${productType}
Grade: ${grade} (Economy, Standard, or Premium)
Target Cost/kg (INR/kg): ${targetCost}

For this specific recipe, you MUST:
1. Keep the exact user ingredients and their relative ratios. If the sum is not 100%, adjust the water/carrier percentage so that it sums up to exactly 100.0%. If there is no water/solvent, append "Demineralized Water (DM Water)" to balance it to 100%.
2. Calculate the exact chemical properties of this specific mixture:
   - "properties.pH": Estimate the pH of this mixture (e.g. "7.5 - 8.2" or "8.0"). Be scientifically accurate based on the acid-alkali ratios (e.g. neutralization of LABSA with NaOH, KOH, or buffering with Soda Ash/Citric Acid).
   - "properties.viscosity": Estimate the viscosity (e.g. "1200 - 1800 cPs" or "2000 cPs").
   - "properties.foamHeight": Estimate the foaming height/profile (e.g. "High Foam", "Low Foam", etc.).
   - "properties.cleaningRating": Estimate cleaning rating (1-10) based on surfactant concentration and builder power.
   - "properties.ecoRating": Estimate eco rating (1-10) based on biodegradability and plant-based content of the entered ingredients.
   - "properties.compatibilityScore": Estimate compatibility score (1-100) based on surfactant interaction (e.g., anionic-cationic compatibility, pH stability).
   - "calculatedHlb": Calculate the weighted HLB value of all surfactant ingredients in this recipe using the formula: Σ(surfactant_percentage * hlbValue) / Σ(surfactant_percentages). If no surfactants are present, return "Not Applicable". Use the activeMatterPct and hlbValue of each surfactant.
   - "idealHlb": Specify the ideal industry HLB range for this product category (e.g. "12.0 - 14.0 (for Laundry Liquid Detergency)").
   - "hlbImportance": Write an educational explanation of what HLB is, why the calculated HLB of their recipe is or is not aligned with the target, and how they can adjust their surfactant ratios to hit the ideal HLB.
3. Keep the exact user's active% (activeMatterPct) as entered for each ingredient. Do not change them.
4. Fill in standard cost per kg (INR/kg) for each ingredient if not provided or keep user's cost (or use industry standard rates, e.g., LABSA = 135 INR, SLES = 110 INR, CAPB = 95 INR, Water = 2 INR, Salt = 15 INR, etc.) and calculate total actualCost based on the raw percentages.
5. Provide a custom "manufacturingMethod" (step-by-step instructions to blend the user's specific ingredients).
6. Provide "commonMistakes" specific to the user's ingredient choices (e.g. warnings about adding salt too fast, neutralization temperature, order of addition).
7. Provide custom "troubleshootingNotes" and "packagingCompatibility" specific to this formulation.

Return ONLY a strictly valid JSON response that matches the schema exactly.`;
    } else {
      prompt = `Generate a scientifically accurate and optimized formulation recipe for a detergent.
Parameters:
- Product Type: ${productType}
- Grade: ${grade} (Premium, Standard, or Economy)
- Target Cost/kg: ${targetCost}
- Target pH: EXACTLY ${targetpH || "6.0"}. You MUST calculate the exact amount of NaOH to neutralize all anionic surfactants and then adjust with citric acid to hit the target pH precisely. Do not return a pH range.
- Target Viscosity: ${targetViscosity}
- Target Foam: ${targetFoam}
- Eco Friendly: ${ecoRequirement}
- Target HLB Range/Value: ${targetHlb || "Default standard range for this product category"} (IMPORTANT: Make sure the weighted HLB of surfactants in the formulation aligns with this target range.)
- Target Active Surfactant Matter: ${activeMatter}% (IMPORTANT: You must design the recipe to have a total active surfactant matter of approximately ${activeMatter}%. Sum of (surfactant percentage * activeMatterPct / 100) must equal ${activeMatter}%.)
- Wash Water Hardness: ${hardness} ppm (as CaCO3) (IMPORTANT: You must dynamically scale or introduce green builders & chelators like GLDA (Dissolvine GL 47%), Sodium Gluconate, Sodium Citrate, or Soda Ash based on this water hardness value. If water hardness is soft (< 100 ppm), use a low amount e.g. 0.3-0.5% Sodium Gluconate or GLDA. If water hardness is medium to hard (100-300 ppm), add a robust co-builder level of 1.0-1.8%. If water hardness is very hard (>= 300 ppm), scale the chelators up to 2.0-3.0% and note this water hardness adaptation in the ingredient role or formula explanation.)

CRITICAL HARD WATER CHELATOR RULE:
You MUST scale chelators/builders so that the total sequestration capacity is at least 1.2 times the user's water hardness of ${waterHardness} ppm CaCO₃. Target minimum capacity = ${waterHardness * 1.2} ppm CaCO₃.

Available chelators and their exact binding capacities per gram (mg CaCO₃ per gram of raw material):
- Soda Ash (Sodium Carbonate): 38 mg/g
- Sodium Gluconate: 76 mg/g
- Tetrasodium EDTA: 263 mg/g
- Dissolvine GL-47 (GLDA): 291 mg/g

To calculate the required amount of any chelator:
1. Decide how much of the total target capacity this chelator will provide (e.g., 200 ppm out of ${waterHardness * 1.2} ppm).
2. Required mass in grams = (desired capacity in mg) / (binding capacity per gram).
3. Percentage in formula = (mass in grams / 1000) — for a 100 kg batch, percentage = mass/1000.

You may combine multiple chelators. Prefer eco-friendly ones first (Sodium Gluconate, then GLDA) and fill the remaining capacity with others if needed. You MUST include the calculated chelator(s) with exact percentages in the final formula ingredients list. DO NOT skip chelators or use less than the target capacity.
- Available Ingredients in Lab: ${availableIngredients ? `STRICT MANDATORY CONSTRAINT: You MUST select formulation ingredients ONLY from this list: "${availableIngredients}". Do NOT include any ingredient that is not in this list, EXCEPT for the following critical chemical stability & safety compounds which you are ALWAYS allowed and required to add:
  1. Demineralized Water (DM Water) as solvent carrier.
  2. NaOH (Caustic Soda), KOH (Potassium Hydroxide), or Citric Acid for acid-base neutralization & strict pH adjustment.
  3. A safe preservative (such as Kathon CG (Preservative), Phenoxyethanol, DMDM Hydantoin, or Sodium Benzoate) at 0.1% to 0.2% concentration to prevent microbial spoilage (since water-based detergents will rot/mold without this).
  If this available list is empty, you are free to design with standard industry raw materials.` : "No constraint (empty list). You are free to design the recipe with standard industry raw materials of your choice."}

CRITICAL CHEMISTRY COMPLIANCE RULES:
1. Product Category Restrictions:
   - For Dishwash Liquid (Dish wash, Vessel wash, Utensil cleaner, Plate washing, etc.), you are STRICTLY FORBIDDEN from adding laundry-specific ingredients like Optical Brighteners (CBS-X, Tinopal) or CMC (Carboxymethyl Cellulose). These leave a dangerous, toxic chemical residue or cloudy white polymer haze on eating plates, glasses, and utensils. If the user wrote these in their available ingredients, explain in the role why they are being omitted, but DO NOT put them in the final ingredients list. Instead, use appropriate thickeners like Salt (NaCl) or Cocamide DEA (CDE), or polymers like HEC/Xanthan Gum, and safe builders like GLDA or Sodium Gluconate.
   - For Laundry Liquid Detergent, you are allowed to use Optical Brighteners, CMC, and clay-based redeposition inhibitors.
   - For Degreasers, use heavy-duty builders (Sodium Metasilicate, Soda Ash, KOH) and high-HLB non-ionic surfactants, with zero optical brighteners.

2. TARGET pH STALKING RULE (CRITICAL):
   - Target pH: EXACTLY ${targetpH || "6.0"}. You MUST calculate the exact amount of NaOH to neutralize all anionic surfactants and then adjust with citric acid to hit the target pH precisely. Do not return a pH range.
   - You MUST ensure the final pH returned in "properties.pH", "targetedPH", and "estimatedPH" matches the specified "Target pH" parameter (${targetpH || "6.0"}) exactly as a single numerical value string (e.g. "${targetpH || "6.0"}").
   - Balance your ingredients accordingly: if anionic acidic surfactants like LABSA (90%), SLES, or AOS are present, calculate the required Caustic Soda (NaOH) or KOH to neutralize them, and use Citric Acid if needed to fine-tune to hit ${targetpH || "6.0"} precisely.

3. PRESERVATIVE SELECTION RULE (CRITICAL):
   - You MUST ALWAYS include a suitable preservative at 0.1% - 0.2% in any water-based formula to prevent micro-biological spoilage.
   - You MUST match the preservative's chemical stability to the formulation's target pH:
     a) For neutral or alkaline formulation target pH (pH >= 6.0), you are STRICTLY FORBIDDEN from using Sodium Benzoate or Potassium Sorbate alone, as organic acids are inactive above pH 5.5 and will fail preservative testing. For these, you MUST use Kathon CG (Preservative), Phenoxyethanol, or DMDM Hydantoin.
     b) For acidic formulation target pH (pH < 5.5), you should prefer Sodium Benzoate or Potassium Sorbate as safe eco-friendly preservatives.
     c) You are STRICTLY FORBIDDEN from using Formalin (Formaldehyde solution) by default due to carcinogenic hazard, unless the user has explicitly typed 'Formalin' in their available list. Always prefer safe, non-formaldehyde-releasing alternatives like Kathon CG (Preservative) or Phenoxyethanol.

4. ECO AND SYNTHETIC COMPLIANCE RULES (CRITICAL):
   - Under the "Eco Friendly" parameter (set to "${ecoRequirement}"), you must choose surfactants, builders, and additives as follows, UNLESS restricted by the Available Ingredients list:
     a) If Eco Friendly is "Eco-Friendly Only", "Eco", "Petroleum Free", or "Pure Plant-Based":
        - You MUST formulate using strictly eco-friendly, biodegradable, and plant-derived raw materials.
        - For surfactants: select from Coco Glucoside, Lauryl Glucoside, Decyl Glucoside, Caprylyl/Capryl Glucoside, Sodium Cocoyl Isethionate (SCI), Sodium Methyl Cocoyl Taurate, Sodium Cocoyl Glutamate, Disodium Cocoyl Glutamate, Methyl Ester Sulfonate (MES), Soapnut Extract (Saponin), or Sodium Lauryl Sulfoacetate (SLSA).
        - For builders and chelators: select from GLDA, MGDA, Sodium Citrate, Sodium Gluconate, Potassium Citrate, Lactic Acid, or Citric Acid.
        - For thickeners & additives: select from Xanthan Gum, Guar Gum, Cationic Guar, Vegetable Glycerin, Sorbitol, and natural essential oils (Lemongrass, Peppermint, Sweet Orange, Eucalyptus).
        - For preservatives: use eco-friendly preservatives like Sodium Benzoate, Potassium Sorbate, or Benzyl Alcohol.
        - STRICTLY FORBIDDEN: Do NOT include any synthetic petroleum-based raw materials like LABSA, SLES, Nonylphenol Ethoxylates (NP-9/NP-6), and environmental hazards like STPP (phosphates) or EDTA.
     b) If Eco Friendly is "Synthetic":
        - You MUST formulate using high-efficiency synthetic surfactants, builders, and additives.
        - For surfactants: use LABSA (Linear Alkyl Benzene Sulfonic Acid), SLES (Sodium Lauryl Ether Sulfate), CAPB (Cocamidopropyl Betaine), AOS (Alpha Olefin Sulfonate), SLS (Sodium Lauryl Sulfate), Cocamide DEA (CDE), Cocamide MEA (CME), Nonylphenol Ethoxylates (NP-9 / NP-10 / Alfox 200), or Linear Alcohol Ethoxylates (LAE-9 / LAE-7).
        - For builders: use Soda Ash (Sodium Carbonate), Sodium Metasilicate, Sodium Silicate, STPP (Sodium Tripolyphosphate), Tetrasodium EDTA, or NTA.
        - For thickeners & polymers: use CMC, HEC, Carbomer, Acrylate Copolymer, PEG-150 Distearate, or Salt (NaCl).
        - For additives: use Optical Brighteners (CBS-X, Tinopal DMS), synthetically derived fragrances (Lemon, Lavender, Rose), and safe preservatives (Kathon CG (Preservative), Phenoxyethanol, DMDM Hydantoin). Do NOT use Formalin due to safety risk alerts.
     c) If Eco Friendly is "Standard Eco" or "Semi-Synthetic":
        - You can blend high-performance synthetic surfactants with eco-friendly additives and green builders (e.g. SLES + CAPB neutralized with Soda Ash, utilizing Sodium Gluconate or Citric Acid). Opt for safe, non-formaldehyde preservatives like Kathon CG or Phenoxyethanol.
     d) MANDATORY PRECEDENCE RULE (STRICT):
        - If the "Available Ingredients in Lab" parameter is NOT empty, then this list of available raw materials takes absolute precedence over all other guidelines! You MUST ONLY select raw materials from the listed "Available Ingredients in Lab", regardless of whether they are synthetic or eco. You are ONLY allowed to add Demineralized Water, Caustic Soda/Caustic Potash/Citric Acid (for pH neutralization), and safe preservatives (to protect the formula from spoiling), as fallback safety compounds.

Return ONLY a strictly valid JSON response that exactly matches this TypeScript schema:
{
  "name": string,
  "productType": string,
  "grade": "Economy" | "Standard" | "Premium",
  "targetCost": number,
  "actualCost": number,
  "activeMatter": number,
  "calculatedHlb": string, // Weighted HLB value of all surfactants in the formula, e.g. "12.8" or "Not Applicable" if no surfactants are used
  "idealHlb": string, // Ideal industry standard HLB range for this product category, e.g. "12.0 - 14.0 (for Laundry Liquid Detergency)" or "13.0 - 15.0 (for Dishwash detergency)" or "11.0 - 13.0 (for Handwash)"
  "hlbImportance": string, // Comprehensive educational explanation of what HLB is, why this calculated HLB is ideal (or needs adjustment) for this product type, how HLB aids emulsification and grease-lifting, and how the chemist can redesign the formula if they need to adjust the HLB.
  "properties": {
    "pH": string,
    "viscosity": string,
    "foamHeight": string,
    "cleaningRating": number,
    "ecoRating": number,
    "compatibilityScore": number
  },
  "ingredients": Array<{
    "name": string,
    "percentage": number,
    "role": string,
    "costPerKg": number,
    "activeMatterPct": number,
    "hlbValue": number | null // HLB value of this ingredient if it is a surfactant (e.g. SLES=13.0, LABSA=11.5, CAPB=12.0, Cocamide DEA=13.0, Tween 20=16.7, etc.). Set to null for non-surfactant raw materials.
  }>,
  "manufacturingMethod": Array<{
    "order": number,
    "action": string,
    "mixingTime": string,
    "mixingSpeed": string,
    "temperature": string,
    "safetyNote": string
  }>,
  "commonMistakes": string[],
  "troubleshootingNotes": string[],
  "packagingCompatibility": string
}

Ensure the ingredient percentages sum up exactly to 100.0%. Provide actual raw material cost per kg matching current market rates (e.g. LABSA 130-150 INR, SLES 100-120 INR, etc.) and calculate total actual cost based on percentages.
Output ONLY raw JSON. No markdown formatting, no backticks, no wrap. Just the JSON text.`;
    }

    const formulateSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the custom formula" },
        productType: { type: Type.STRING, description: "The category/type of the product" },
        grade: { type: Type.STRING, enum: ["Economy", "Standard", "Premium"], description: "The product grade" },
        targetCost: { type: Type.NUMBER, description: "Target cost per kg in INR" },
        actualCost: { type: Type.NUMBER, description: "Calculated actual raw material cost per kg in INR based on percentages" },
        activeMatter: { type: Type.NUMBER, description: "Total active surfactant matter percentage" },
        calculatedHlb: { type: Type.STRING, description: "Weighted HLB value of all surfactants, e.g., '12.8'" },
        idealHlb: { type: Type.STRING, description: "Ideal standard HLB range, e.g., '12.0 - 14.0 (for Laundry Liquid Detergency)'" },
        hlbImportance: { type: Type.STRING, description: "Comprehensive educational explanation of HLB, how it relates to this product type, and how to adjust it." },
        properties: {
          type: Type.OBJECT,
          properties: {
            pH: { type: Type.STRING },
            viscosity: { type: Type.STRING },
            foamHeight: { type: Type.STRING },
            cleaningRating: { type: Type.NUMBER },
            ecoRating: { type: Type.NUMBER },
            compatibilityScore: { type: Type.NUMBER }
          },
          required: ["pH", "viscosity", "foamHeight", "cleaningRating", "ecoRating", "compatibilityScore"]
        },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              percentage: { type: Type.NUMBER },
              role: { type: Type.STRING },
              costPerKg: { type: Type.NUMBER },
              activeMatterPct: { type: Type.NUMBER },
              hlbValue: { type: Type.NUMBER, description: "HLB value if surfactant, otherwise omit or set to 0." }
            },
            required: ["name", "percentage", "role", "costPerKg", "activeMatterPct"]
          }
        },
        manufacturingMethod: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              order: { type: Type.INTEGER },
              action: { type: Type.STRING },
              mixingTime: { type: Type.STRING },
              mixingSpeed: { type: Type.STRING },
              temperature: { type: Type.STRING },
              safetyNote: { type: Type.STRING }
            },
            required: ["order", "action", "mixingTime", "mixingSpeed", "temperature", "safetyNote"]
          }
        },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        troubleshootingNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        packagingCompatibility: { type: Type.STRING }
      },
      required: [
        "name", "productType", "grade", "targetCost", "actualCost", "activeMatter",
        "calculatedHlb", "idealHlb", "hlbImportance", "properties", "ingredients",
        "manufacturingMethod", "commonMistakes", "troubleshootingNotes", "packagingCompatibility"
      ]
    };

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: formulateSchema,
        temperature: 0.1,
      }
    });

    const parsed = cleanAndParseJson(response.text);
    const balanced = enforceFormulaMassBalance(parsed);
    res.json({ success: true, formula: balanced });
  } catch (error: any) {
    console.error("Gemini Formulation Generation error:", error);
    // fallback gracefully rather than failing
    if (mode === "check") {
      const checkedFallback = analyzeUserFormulaFallback(inputIngredients || [], productType, grade, targetCost);
      res.json({
        success: true,
        mode: "Fallback (JSON Parse Error - Audited)",
        formula: checkedFallback
      });
    } else {
      const balancedFallback = enforceFormulaMassBalance(mockFormula);
      res.json({ success: true, mode: "Fallback (JSON Parse Error)", formula: balancedFallback });
    }
  }
});

// 3. AI Troubleshooting Assistant API
app.post("/api/ai/troubleshoot", async (req, res) => {
  const { query, productContext } = req.body;
  const client = getAIClient();

  const fallbackTrouble = {
    issue: query || "Viscosity dropping / formulation thinning",
    causes: [
      {
        cause: "Electrolyte overload triggering micelle structure collapse",
        confidence: "High",
        chemistryPrinciple: "salt curve — excess electrolyte can collapse micelle structure at high surfactant concentration by screening ionic charges",
        relationToUserData: productContext?.logs?.some((l: any) => l.viscosity < 1600)
          ? `Correlates with your logged low viscosity in batch ${productContext.logs.find((l: any) => l.viscosity < 1600).batchNo || "B-2607-03"}`
          : "No specific overlapping viscosity drop found in logged sessions, but common in salt-thickened formulas.",
        correctiveActions: [
          "Dilute the batch slightly with demineralized water and add a small, proportional amount of SLES 70% to restore surfactant-to-electrolyte balance.",
          "Slowly blend in Cocamide DEA (CDE) or Cocamidopropyl Betaine (CAPB) in 0.5% increments to stabilize the micellar network."
        ]
      },
      {
        cause: "Surfactant hydrolysis due to unneutralized LABSA acidity",
        confidence: "Medium",
        chemistryPrinciple: "hydrolysis — SLES ether-sulfate bonds undergo rapid acid-catalyzed cleavage at pH values below 5.0",
        relationToUserData: productContext?.logs?.some((l: any) => l.pH < 7.0)
          ? `Correlates with low pH (${productContext.logs.find((l: any) => l.pH < 7.0).pH}) logged in history.`
          : "Matches typical patterns when raw LABSA acid is added too quickly without complete caustic neutralization.",
        correctiveActions: [
          "Add Caustic Soda (Sodium Hydroxide) solution slowly to bring pH strictly to 7.5 - 8.5.",
          "Incorporate a stable non-ionic thickener like HEC (Hydroxyethyl Cellulose) to build structure independent of pH."
        ]
      }
    ],
    preventativeMeasures: [
      "Set strict upper limit cut-offs of 1.5% for Sodium Chloride (salt) additions.",
      "Conduct in-line temperature checks to ensure the batch remains below 40°C during neutralization phases to protect enzymes and prevent SLES degradation."
    ]
  };

  if (!client) {
    return res.json({
      success: true,
      mode: "Demo/Offline Mode",
      troubleshoot: fallbackTrouble
    });
  }

  try {
    const prompt = `You are a scientific Detergent R&D Troubleshooter and formulation chemist.
A researcher is facing a problem: "${query}".

Analyze this issue and return possible causes and corrective/preventative actions.
Here is the available user laboratory data context (containing experiments, batch logs, or QC logs):
${JSON.stringify(productContext || {})}

IMPORTANT SCIENTIFIC CONSTRAINTS:
1. List possible causes ranked by likelihood, each with a Confidence Score (High/Medium/Low).
2. Cite the specific chemistry principle behind each cause (e.g., "salt curve — excess electrolyte can collapse micelle structure at high surfactant concentration").
3. Check the provided productContext data. If any logged experiment, QC log, or stability log has metrics (pH, viscosity, temperature, active matter, etc.) that explain or correlate with this issue, cite that SPECIFIC batch ID, date, or log value in 'relationToUserData'. If no relevant user data exists, write "No overlapping logged parameters found in database".
4. Suggest corrective actions using ONLY ingredients/techniques from the typical detergent R&D encyclopedia: LABSA, SLES, CAPB, Caustic Soda, Soda Ash, Sodium Chloride, Cocamide DEA (CDE), CMC, HEC, Sodium Gluconate, Monopropylene Glycol, Citric Acid, AOS (Alpha Olefin Sulfonate), Optical Brighteners.
5. All troubleshooting must be labeled as "AI Recommendation — Verify With Physical Retest."

Return ONLY a strictly valid JSON response matching this schema:
{
  "issue": string,
  "causes": Array<{
    "cause": string,
    "confidence": "High" | "Medium" | "Low",
    "chemistryPrinciple": string,
    "relationToUserData": string,
    "correctiveActions": string[]
  }>,
  "preventativeMeasures": string[]
}

Do not include markdown code block formatting or backticks. Return raw JSON text only.`;

    const troubleshootSchema = {
      type: Type.OBJECT,
      properties: {
        issue: { type: Type.STRING },
        causes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cause: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              chemistryPrinciple: { type: Type.STRING },
              relationToUserData: { type: Type.STRING },
              correctiveActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["cause", "confidence", "chemistryPrinciple", "relationToUserData", "correctiveActions"]
          }
        },
        preventativeMeasures: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["issue", "causes", "preventativeMeasures"]
    };

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: troubleshootSchema,
        temperature: 0.1,
      }
    });

    const parsed = cleanAndParseJson(response.text);
    res.json({ success: true, troubleshoot: parsed });
  } catch (error: any) {
    console.error("Gemini Troubleshooting error:", error);
    res.json({ success: true, mode: "Fallback", troubleshoot: fallbackTrouble });
  }
});

// Vite Server middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Detergent R&D Expert server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

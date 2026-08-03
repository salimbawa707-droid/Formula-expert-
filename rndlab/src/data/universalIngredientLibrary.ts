// ============================================================
// FILE: src/data/universalIngredientLibrary.ts
// DESCRIPTION: Centralized Universal Ingredient Library
// ARCHITECTURE: Shared Backend Ingredient Database & Search Engine
// ============================================================

import { Chemical, UniversalIngredient, UniversalIngredientCategory } from "../types";
import { CHEMICALS } from "./chemicals";
import { ANIONIC_SURFACTANTS } from "./chem_surfactants_anionic";
import { NONIONIC_AMPHOTERIC_CATIONIC_SURFACTANTS } from "./chem_surfactants_nonionic_amphoteric_cationic";
import { BUILDERS_CHELATORS } from "./chem_builders_chelators";
import { SOLVENTS_PRESERVATIVES_ACIDS_ALKALIS } from "./chem_solvents_preservatives_acids_alkalis";
import { POLYMERS_THICKENERS_ENZYMES } from "./chem_polymers_thickeners_enzymes";
import { OTHERS_INDUSTRIAL_NATURAL } from "./chem_others_industrial_natural";
import { STANDARD_SURFACTANTS, ECO_PLANT_INGREDIENTS, FormulatorIngredient } from "./formulator_ingredients";

// Standard Category Taxonomy List
export const UNIVERSAL_CATEGORIES: UniversalIngredientCategory[] = [
  "Anionic Surfactants",
  "Nonionic Surfactants",
  "Amphoteric Surfactants",
  "Cationic Surfactants",
  "Builders",
  "Chelators",
  "Acids",
  "Alkalis",
  "Enzymes",
  "Solvents",
  "Polymers",
  "Preservatives",
  "Fragrances",
  "Colours",
  "Optical Brighteners",
  "Fillers",
  "Processing Aids",
  "Specialty Additives",
];

/**
 * Normalizes raw category strings into canonical UniversalIngredientCategory
 */
export function normalizeCategory(
  catStr: string = "",
  name: string = "",
  description: string = ""
): UniversalIngredientCategory {
  if (!catStr) return "Specialty Additives";
  const c = catStr.trim().toLowerCase();
  const n = name.toLowerCase();
  const d = description.toLowerCase();

  if (c.includes("anionic")) return "Anionic Surfactants";
  if (c.includes("nonionic") || c.includes("non-ionic")) return "Nonionic Surfactants";
  if (c.includes("amphoteric") || c.includes("zwitterionic")) return "Amphoteric Surfactants";
  if (c.includes("cationic")) return "Cationic Surfactants";

  if (c.includes("builder")) return "Builders";
  if (c.includes("chelat")) return "Chelators";

  if (c.includes("acid") && !c.includes("amino acid")) return "Acids";
  if (c.includes("alkali") || c.includes("base") || c.includes("caustic") || c.includes("lye") || c.includes("hydroxide")) return "Alkalis";
  if (c.includes("ph adjuster")) {
    if (n.includes("acid") || d.includes("acid")) return "Acids";
    if (n.includes("hydroxide") || n.includes("carbonate") || n.includes("ash") || n.includes("lye") || d.includes("alkali")) return "Alkalis";
    return "Builders";
  }

  if (c.includes("enzyme") || c.includes("bio-enzyme")) return "Enzymes";
  if (c.includes("solvent") || c.includes("coupling")) return "Solvents";
  if (c.includes("polymer") || c.includes("thickener") || c.includes("rheology")) return "Polymers";
  if (c.includes("preservative") || c.includes("biocide") || c.includes("antimicrobial")) return "Preservatives";
  if (c.includes("fragrance") || c.includes("essential oil") || c.includes("aroma") || c.includes("perfume")) return "Fragrances";
  if (c.includes("color") || c.includes("colour") || c.includes("dye") || c.includes("pigment")) return "Colours";
  if (c.includes("optical") || c.includes("brightener") || c.includes("whitening")) return "Optical Brighteners";
  if (c.includes("filler") || c.includes("bulking")) return "Fillers";
  if (c.includes("foam control") || c.includes("hydrotrope") || c.includes("processing")) return "Processing Aids";

  if (c.includes("surfactant")) {
    if (n.includes("sles") || n.includes("labsa") || n.includes("sls") || n.includes("aos") || n.includes("sulfate") || n.includes("sulfonate") || n.includes("soap")) return "Anionic Surfactants";
    if (n.includes("apg") || n.includes("glucoside") || n.includes("ethoxylate") || n.includes("tween") || n.includes("span") || n.includes("cde") || n.includes("mea")) return "Nonionic Surfactants";
    if (n.includes("capb") || n.includes("betaine") || n.includes("amine oxide")) return "Amphoteric Surfactants";
    if (n.includes("bkc") || n.includes("chloride") || n.includes("quatern")) return "Cationic Surfactants";
    return "Anionic Surfactants";
  }

  return catStr as UniversalIngredientCategory;
}

/**
 * Extracts auto-generated search keywords and terms for Smart Search indexing
 */
function generateSearchMetadata(
  name: string,
  chem: Partial<Chemical>,
  category: string,
  subCategory: string,
  synonyms: string[],
  aliases: string[]
): { keywords: string[]; searchTerms: string[] } {
  const termSet = new Set<string>();
  const kwSet = new Set<string>();

  const addTerm = (t?: string) => {
    if (!t) return;
    const clean = t.trim();
    if (clean.length > 0) {
      termSet.add(clean.toLowerCase());
      const words = clean.toLowerCase().split(/[\s,()\/_\-]+/);
      words.forEach(w => {
        if (w.length >= 2) kwSet.add(w);
      });
    }
  };

  addTerm(name);
  addTerm(chem.commonName);
  addTerm(chem.chemicalName);
  addTerm(chem.iupacName);
  addTerm(chem.inciName);
  addTerm(chem.casNumber);
  addTerm(category);
  addTerm(subCategory);
  if (chem.function) addTerm(chem.function);
  if (chem.functionalInfo?.whyUsed) addTerm(chem.functionalInfo.whyUsed);

  if (chem.tradeNames) chem.tradeNames.forEach(addTerm);
  synonyms.forEach(addTerm);
  aliases.forEach(addTerm);
  if (chem.marketNames) {
    addTerm(chem.marketNames.indian);
    addTerm(chem.marketNames.international);
    addTerm(chem.marketNames.hindi);
  }

  return {
    keywords: Array.from(kwSet),
    searchTerms: Array.from(termSet),
  };
}

/**
 * Generates aliases for common chemical names
 */
function extractAliases(name: string, chemName?: string, tradeNames: string[] = []): string[] {
  const aliasesSet = new Set<string>();

  if (tradeNames && Array.isArray(tradeNames)) {
    tradeNames.forEach(t => t && aliasesSet.add(t.trim()));
  }

  // Extract acronyms in parentheses e.g. "LABSA", "SLES", "AOS"
  const matchParen = name.match(/\(([^)]+)\)/);
  if (matchParen && matchParen[1]) {
    aliasesSet.add(matchParen[1].trim());
  }

  // Common acronym heuristics
  const nUpper = name.toUpperCase();
  if (nUpper.includes("LABSA")) aliasesSet.add("LABSA");
  if (nUpper.includes("SLES")) aliasesSet.add("SLES");
  if (nUpper.includes("SLS")) aliasesSet.add("SLS");
  if (nUpper.includes("AOS")) aliasesSet.add("AOS");
  if (nUpper.includes("CAPB")) aliasesSet.add("CAPB");
  if (nUpper.includes("EDTA")) aliasesSet.add("EDTA");
  if (nUpper.includes("STPP")) aliasesSet.add("STPP");
  if (nUpper.includes("GLDA")) aliasesSet.add("GLDA");
  if (nUpper.includes("MGDA")) aliasesSet.add("MGDA");
  if (nUpper.includes("BKC")) aliasesSet.add("BKC");
  if (nUpper.includes("CTAC")) aliasesSet.add("CTAC");
  if (nUpper.includes("NP-9")) aliasesSet.add("NP-9");
  if (nUpper.includes("LAE-9")) aliasesSet.add("LAE-9");
  if (nUpper.includes("SCI")) aliasesSet.add("SCI");
  if (nUpper.includes("SLSA")) aliasesSet.add("SLSA");

  return Array.from(aliasesSet);
}

/**
 * Normalizes a raw Chemical or FormulatorIngredient into a full UniversalIngredient
 */
function normalizeToUniversalIngredient(
  raw: Partial<Chemical> & Partial<FormulatorIngredient> & { id?: string | number },
  fallbackId?: string
): UniversalIngredient {
  const commonName = raw.commonName || raw.name || "Unknown Ingredient";
  const idStr = String(raw.id || fallbackId || commonName.toLowerCase().replace(/[^a-z0-9]/g, "_"));
  const cat = normalizeCategory(raw.category, commonName, raw.functionalInfo?.whatIsIt || raw.role);
  const subCat = raw.subCategory || raw.type || raw.category || "General Additive";
  const funcRole = raw.function || raw.role || raw.functionalInfo?.whyUsed || raw.functionalInfo?.whatIsIt || "Detergent Raw Material";

  const synonymsList = Array.from(
    new Set([
      ...(raw.synonyms || []),
      ...(raw.tradeNames || []),
      ...(raw.marketNames?.indian ? [raw.marketNames.indian] : []),
      ...(raw.marketNames?.international ? [raw.marketNames.international] : []),
    ].filter(Boolean))
  );

  const aliasesList = extractAliases(commonName, raw.chemicalName, raw.tradeNames);

  const rawRecord = raw as Record<string, any>;

  const active =
    rawRecord.activeMatter !== undefined
      ? rawRecord.activeMatter
      : raw.activeMatterPct !== undefined
      ? raw.activeMatterPct
      : raw.physicalProperties?.activeMatter || "100%";

  const dens =
    rawRecord.density !== undefined
      ? rawRecord.density
      : raw.physicalProperties?.density || "1.00 g/cm³";

  const { keywords, searchTerms } = generateSearchMetadata(
    commonName,
    raw,
    cat,
    subCat,
    synonymsList,
    aliasesList
  );

  const normalizedChem: Chemical = {
    id: idStr,
    commonName,
    chemicalName: raw.chemicalName || commonName,
    iupacName: raw.iupacName || commonName,
    casNumber: raw.casNumber || "N/A",
    molecularFormula: raw.molecularFormula || "N/A",
    molecularWeight: typeof raw.molecularWeight === "number" ? `${raw.molecularWeight} g/mol` : raw.molecularWeight || "N/A",
    inciName: raw.inciName || commonName,
    tradeNames: raw.tradeNames || [],
    synonyms: synonymsList,
    category: cat,
    subCategory: subCat,
    function: funcRole,
    keywords,
    defaultUnit: raw.defaultUnit || "kg",
    aliases: aliasesList,
    searchTerms,
    suppliers: raw.suppliers || ["Standard Detergent Chemical Mfrs"],
    marketNames: raw.marketNames || {
      indian: commonName,
      international: commonName,
    },
    physicalProperties: raw.physicalProperties || {
      appearance: "Liquid / Powder / Solid",
      color: "Standard",
      odor: "Characteristic",
      activeMatter: String(active),
      pH: "6.0 - 8.0",
      density: String(dens),
      viscosity: "Standard",
      solubility: "Soluble in water",
      shelfLife: "24 Months",
      storageConditions: "Store in cool, dry location away from heat",
    },
    functionalInfo: raw.functionalInfo || {
      whatIsIt: funcRole,
      whyUsed: funcRole,
      advantages: ["Versatile performance", "Reliable quality"],
      limitations: ["Use as directed"],
      alternatives: [],
      ecoFriendliness: "Standard",
    },
    dosage: raw.dosage || {
      minimum: "0.5%",
      recommended: "1.0% - 10.0%",
      premium: "15.0%",
      maximum: "30.0%",
      household: "Standard household laundry and dishwash formulations",
      industrial: "Industrial degreasers and hard surface cleaners",
    },
    performance: raw.performance || {
      cleaning: 8,
      foam: 7,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 7,
      hardWater: 8,
    },
    sustainability: raw.sustainability || {
      biodegradability: "Readily Biodegradable",
      plantBasedPct: 50,
      petroleumBasedPct: 50,
      vocStatus: "Low VOC",
      microplasticStatus: "Microplastic Free",
      aquaticToxicity: "Low",
      greenRating: "A",
    },
    safety: raw.safety || {
      ppe: ["Gloves", "Safety Glasses"],
      ghsClassification: ["Standard Chemical Handling"],
      hazardStatements: ["Causes skin and eye irritation"],
      precautionaryStatements: ["Wash thoroughly after handling"],
      firstAid: "Rinse with plenty of water",
      msdsSummary: "Standard industrial handling procedures apply",
    },
    hlb: raw.hlb !== undefined && raw.hlb !== null ? String(raw.hlb) : raw.hlbValue !== undefined && raw.hlbValue !== null ? String(raw.hlbValue) : undefined,
    approxPrice: raw.costPerKg ? `₹${raw.costPerKg}/kg` : raw.approxPrice || "₹150/kg",
    pKa: raw.pKa !== undefined ? raw.pKa : undefined,
  };

  return {
    ...normalizedChem,
    id: idStr,
    name: commonName,
    category: cat,
    subCategory: subCat,
    function: funcRole,
    synonyms: synonymsList,
    keywords,
    activeMatter: active,
    density: dens,
    defaultUnit: "kg",
    aliases: aliasesList,
    searchTerms,
    costPerKg: raw.costPerKg || (raw.approxPrice ? Number(raw.approxPrice.replace(/[^0-9.]/g, "")) || 150 : 150),
  };
}

// Master Ingredients Registry (Centralized Map & Array)
const ingredientRegistry = new Map<string, UniversalIngredient>();

// 1. Process Master CHEMICALS
CHEMICALS.forEach(chem => {
  const item = normalizeToUniversalIngredient(chem);
  ingredientRegistry.set(item.id.toLowerCase(), item);
  ingredientRegistry.set(item.name.toLowerCase(), item);
});

// 2. Process Extended Domain Datasets
const domainDatasets: Chemical[][] = [
  ANIONIC_SURFACTANTS,
  NONIONIC_AMPHOTERIC_CATIONIC_SURFACTANTS,
  BUILDERS_CHELATORS,
  SOLVENTS_PRESERVATIVES_ACIDS_ALKALIS,
  POLYMERS_THICKENERS_ENZYMES,
  OTHERS_INDUSTRIAL_NATURAL,
];

domainDatasets.forEach(dataset => {
  dataset.forEach(chem => {
    const key = String(chem.id || chem.commonName).toLowerCase();
    const existing = ingredientRegistry.get(key);
    if (!existing) {
      const item = normalizeToUniversalIngredient(chem);
      ingredientRegistry.set(item.id.toLowerCase(), item);
      ingredientRegistry.set(item.name.toLowerCase(), item);
    }
  });
});

// 3. Process Formulator Ingredients (STANDARD_SURFACTANTS & ECO_PLANT_INGREDIENTS)
[...STANDARD_SURFACTANTS, ...ECO_PLANT_INGREDIENTS].forEach((formIngredient, idx) => {
  const key = formIngredient.name.toLowerCase();
  const existing = ingredientRegistry.get(key);
  if (!existing) {
    const item = normalizeToUniversalIngredient(formIngredient, `form_ing_${idx + 1}`);
    ingredientRegistry.set(item.id.toLowerCase(), item);
    ingredientRegistry.set(item.name.toLowerCase(), item);
  } else {
    // Enrich costPerKg if available
    if (formIngredient.costPerKg && !existing.costPerKg) {
      existing.costPerKg = formIngredient.costPerKg;
    }
  }
});

// Consolidated list of all unique Universal Ingredients
export const UNIVERSAL_INGREDIENT_LIBRARY: UniversalIngredient[] = Array.from(
  new Set(ingredientRegistry.values())
);

// ============================================================
// SEARCH & RETRIEVAL BACKEND API (For future Smart Search)
// ============================================================

export interface SearchOptions {
  category?: UniversalIngredientCategory | string;
  subCategory?: string;
  limit?: number;
}

/**
 * Returns all ingredients in the Universal Ingredient Library
 */
export function getAllUniversalIngredients(): UniversalIngredient[] {
  return UNIVERSAL_INGREDIENT_LIBRARY;
}

/**
 * Retrieves an ingredient by unique ID
 */
export function getUniversalIngredientById(id: string | number): UniversalIngredient | undefined {
  if (!id) return undefined;
  const idStr = String(id).toLowerCase();
  return UNIVERSAL_INGREDIENT_LIBRARY.find(ing => ing.id.toLowerCase() === idStr);
}

/**
 * Retrieves an ingredient by exact Name or Common Name
 */
export function getUniversalIngredientByName(name: string): UniversalIngredient | undefined {
  if (!name) return undefined;
  const nStr = name.trim().toLowerCase();
  return UNIVERSAL_INGREDIENT_LIBRARY.find(
    ing =>
      ing.name.toLowerCase() === nStr ||
      ing.commonName.toLowerCase() === nStr ||
      ing.chemicalName.toLowerCase() === nStr ||
      ing.aliases.some(a => a.toLowerCase() === nStr)
  );
}

/**
 * Filters ingredients by Category
 */
export function getUniversalIngredientsByCategory(category: string): UniversalIngredient[] {
  if (!category) return UNIVERSAL_INGREDIENT_LIBRARY;
  const targetCat = normalizeCategory(category).toLowerCase();
  return UNIVERSAL_INGREDIENT_LIBRARY.filter(
    ing => ing.category.toLowerCase() === targetCat || ing.category.toLowerCase().includes(category.toLowerCase())
  );
}

/**
 * Filters ingredients by SubCategory
 */
export function getUniversalIngredientsBySubCategory(subCategory: string): UniversalIngredient[] {
  if (!subCategory) return UNIVERSAL_INGREDIENT_LIBRARY;
  const sub = subCategory.trim().toLowerCase();
  return UNIVERSAL_INGREDIENT_LIBRARY.filter(ing => ing.subCategory.toLowerCase().includes(sub));
}

/**
 * Universal Smart Search Engine (Backend API)
 * Multi-tiered priority scoring engine:
 * 1. Exact Name / CAS match (1000 pts)
 * 2. Partial Name match (Prefix: 850 pts, Word Boundary: 750 pts, Substring: 600 pts)
 * 3. Alias match (Exact: 550 pts, Prefix/Word Boundary: 500 pts, Substring: 450 pts)
 * 4. Synonym match (Exact: 400 pts, Prefix/Word Boundary: 350 pts, Substring: 300 pts)
 * 5. Category match (Exact/Base: 300 pts, Prefix/Word Boundary: 280 pts, Substring: 250 pts)
 * 6. SubCategory match (Exact: 220 pts, Prefix/Word Boundary: 200 pts, Substring: 180 pts)
 * 7. Keywords match (Exact: 150 pts, Prefix/Word Boundary: 120 pts)
 * 8. Search Terms / Function Role match (Exact: 80 pts, Word Boundary: 60 pts, Substring: 40 pts)
 */
export function searchUniversalIngredients(query: string, options?: SearchOptions): UniversalIngredient[] {
  let list = UNIVERSAL_INGREDIENT_LIBRARY;

  if (options?.category) {
    const cat = options.category.toLowerCase();
    list = list.filter(ing => ing.category.toLowerCase().includes(cat));
  }

  if (options?.subCategory) {
    const sub = options.subCategory.toLowerCase();
    list = list.filter(ing => ing.subCategory.toLowerCase().includes(sub));
  }

  if (!query || query.trim() === "") {
    if (options?.limit && options.limit > 0) {
      return list.slice(0, options.limit);
    }
    return list;
  }

  const q = query.trim().toLowerCase();
  const qLen = q.length;
  const isShortQuery = qLen <= 3;

  const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundaryRegex = new RegExp(`\\b${escapedQ}`, "i");

  // Score each item based on multi-tiered relevance
  const scored = list
    .map(ing => {
      let score = 0;

      const nameLower = ing.name.toLowerCase();
      const chemNameLower = ing.chemicalName.toLowerCase();
      const casLower = ing.casNumber.toLowerCase();
      const catLower = ing.category.toLowerCase();
      const subCatLower = ing.subCategory.toLowerCase();

      // Priority 1: Exact Name / CAS Match (1000 pts)
      if (nameLower === q || chemNameLower === q || casLower === q) {
        score += 1000;
      }
      // Priority 2: Partial Name Match
      else if (nameLower.startsWith(q) || chemNameLower.startsWith(q)) {
        score += 850;
      }
      else if (wordBoundaryRegex.test(nameLower) || wordBoundaryRegex.test(chemNameLower)) {
        score += 750;
      }
      else if (!isShortQuery && (nameLower.includes(q) || chemNameLower.includes(q))) {
        score += 600;
      }

      // Priority 3: Alias Match
      if (ing.aliases && ing.aliases.length > 0) {
        for (const alias of ing.aliases) {
          const aLower = alias.toLowerCase();
          if (aLower === q) {
            score += 550;
            break;
          } else if (aLower.startsWith(q) || wordBoundaryRegex.test(aLower)) {
            score += 500;
            break;
          } else if (!isShortQuery && aLower.includes(q)) {
            score += 450;
            break;
          }
        }
      }

      // Priority 4: Synonym Match
      if (ing.synonyms && ing.synonyms.length > 0) {
        for (const syn of ing.synonyms) {
          const sLower = syn.toLowerCase();
          if (sLower === q) {
            score += 400;
            break;
          } else if (sLower.startsWith(q) || wordBoundaryRegex.test(sLower)) {
            score += 350;
            break;
          } else if (!isShortQuery && sLower.includes(q)) {
            score += 300;
            break;
          }
        }
      }

      // Priority 5: Category Match
      const catBase = catLower.replace(/\s+surfactants?$/i, "");
      if (catLower === q || catBase === q) {
        score += 300;
      } else if (catLower.startsWith(q) || catBase.startsWith(q) || wordBoundaryRegex.test(catLower)) {
        score += 280;
      } else if (!isShortQuery && catLower.includes(q)) {
        score += 250;
      }

      // Priority 6: SubCategory Match
      if (subCatLower === q) {
        score += 220;
      } else if (subCatLower.startsWith(q) || wordBoundaryRegex.test(subCatLower)) {
        score += 200;
      } else if (!isShortQuery && subCatLower.includes(q)) {
        score += 180;
      }

      // Priority 7: Keywords Match
      if (ing.keywords && ing.keywords.length > 0) {
        for (const kw of ing.keywords) {
          const kwLower = kw.toLowerCase();
          if (kwLower === q) {
            score += 150;
            break;
          } else if (kwLower.startsWith(q) || wordBoundaryRegex.test(kwLower)) {
            score += 120;
            break;
          }
        }
      }

      // Priority 8: Search Terms / Functional Role Match
      if (ing.searchTerms && ing.searchTerms.length > 0) {
        for (const st of ing.searchTerms) {
          const stLower = st.toLowerCase();
          if (stLower === q) {
            score += 80;
            break;
          } else if (wordBoundaryRegex.test(stLower)) {
            score += 60;
            break;
          } else if (!isShortQuery && stLower.includes(q)) {
            score += 40;
            break;
          }
        }
      }

      return { ingredient: ing, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.ingredient.name.localeCompare(b.ingredient.name);
    })
    .map(item => item.ingredient);

  if (options?.limit && options.limit > 0) {
    return scored.slice(0, options.limit);
  }

  return scored;
}

/**
 * Returns list of all unique categories in the Universal Ingredient Library
 */
export function getAllCategories(): string[] {
  const set = new Set<string>();
  UNIVERSAL_CATEGORIES.forEach(c => set.add(c));
  UNIVERSAL_INGREDIENT_LIBRARY.forEach(ing => set.add(ing.category));
  return Array.from(set);
}

/**
 * Returns list of all unique sub-categories, optionally filtered by Category
 */
export function getAllSubCategories(category?: string): string[] {
  const set = new Set<string>();
  const list = category ? getUniversalIngredientsByCategory(category) : UNIVERSAL_INGREDIENT_LIBRARY;
  list.forEach(ing => {
    if (ing.subCategory) set.add(ing.subCategory);
  });
  return Array.from(set);
}

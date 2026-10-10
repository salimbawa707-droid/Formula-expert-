import { FormulationIngredient } from '../types';
import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from '../data/universalIngredientLibrary';

/**
 * ============================================================================
 * AUTHORITATIVE ACTIVE MATTER & MASS BALANCE ENGINE (Phase 4 Consolidation)
 * ============================================================================
 * 
 * SCIENTIFIC FOUNDATION & ARCHITECTURAL CONTRACT:
 * 
 * 1. Authoritative Active Matter Resolution:
 *    - Resolves raw materials against canonical ingredient library (id, name, aliases)
 *    - Preserves commercial raw-material grades/variants distinctively even when CAS numbers match
 *      (e.g., SLES 70% vs SLES 28% have the same CAS 68585-34-2; active matter is 70% vs 28%)
 *      (e.g., NaOH 50% Liquid vs NaOH 99% Flakes have same CAS 1310-73-2; active matter is 50% vs 99%)
 *      (e.g., CAPB 30% vs CAPB 45% have same CAS 61789-40-0; active matter is 30% vs 45%)
 *      (e.g., GLDA 47% Liquid vs GLDA 99% Powder; active matter is 47% vs 99%)
 *    - Respects explicit formula override inputs (e.g., user-specified `activeMatterPct`, `activePercent`, `activeMatterPurity`, `purity`)
 *    - Data Provenance Status:
 *      * 'authoritative': Verified commercial assay specification from canonical ingredient library
 *      * 'explicit_override': User-provided custom active concentration
 *      * 'derived_from_name': Rigorously extracted commercial concentration from standardized chemical title (e.g., "SLES 28%")
 *      * 'missing': No active matter data available (never silently assume 100% unless chemically pure/authoritative)
 * 
 * 2. Active Mass vs. Product/Raw-Material Mass:
 *    - Formula Raw Mass %: W_raw_i = dosage percentage in formula (% w/w)
 *    - Formula Active Mass %: W_active_i = (W_raw_i * ActiveMatterPct_i) / 100
 *    - Carrier/Solvent Mass %: W_carrier_i = W_raw_i - W_active_i
 *    - Batch Active Mass (kg): M_active_i = (W_active_i / 100) * BatchSize_kg
 * 
 * 3. Water Balance & Carrier Accounting:
 *    - Free Added Water: Explicit water components (DI Water, Tap Water, Demineralized Water)
 *    - Carried Water: Water introduced into formula by aqueous solutions (e.g. 10% of SLES 70% brings 3.0% water!)
 *    - Total Water = Free Added Water + Σ Carried Water
 * 
 * 4. Surfactant Active Matter Breakdown:
 *    - Anionic Surfactant Active %
 *    - Nonionic Surfactant Active %
 *    - Amphoteric Surfactant Active %
 *    - Cationic Surfactant Active %
 *    - Total Active Surfactants %
 *    - Total Raw Surfactants %
 * 
 * 5. Scope & Scientific Safety:
 *    - Never duplicates HLB, CMC, pH, Viscosity, or Density calculations
 *    - Provides single source of truth across AI Formulator, Smart Formula Analyzer Pro, RC Calculators, and Formula Check
 * ============================================================================
 */

export type ActiveMatterProvenance = 'authoritative' | 'explicit_override' | 'derived_from_name' | 'missing';

export type SurfactantChargeClass = 'anionic' | 'nonionic' | 'amphoteric' | 'cationic' | 'none';

export interface IngredientActiveResolution {
  activeMatterPct: number;
  dataSource: ActiveMatterProvenance;
  category: string;
  isSurfactant: boolean;
  surfactantType: SurfactantChargeClass;
  isWater: boolean;
  isSolvent: boolean;
  canonicalMatch?: UniversalIngredient;
}

export interface IngredientActiveContribution {
  id?: string;
  name: string;
  category: string;
  role?: string;
  rawPercentage: number;
  activeMatterPct: number;
  activePercentage: number; // (rawPercentage * activeMatterPct) / 100
  carrierPercentage: number; // rawPercentage - activePercentage
  rawMassKg: number;
  activeMassKg: number;
  carrierMassKg: number;
  isSurfactant: boolean;
  surfactantType: SurfactantChargeClass;
  isWater: boolean;
  isSolvent: boolean;
  dataSource: ActiveMatterProvenance;
  notes?: string;
}

export interface SurfactantActiveBreakdown {
  anionicActivePct: number;
  nonionicActivePct: number;
  amphotericActivePct: number;
  cationicActivePct: number;
  totalActiveSurfactants: number;
  totalRawSurfactants: number;
  anionicRatio: number;
  nonionicRatio: number;
  amphotericRatio: number;
  cationicRatio: number;
}

export interface WaterBalanceBreakdown {
  freeAddedWaterPct: number;
  carriedWaterPct: number;
  totalWaterPct: number;
  freeAddedWaterKg: number;
  carriedWaterKg: number;
  totalWaterKg: number;
}

export interface ActiveMatterReport {
  totalActiveMatter: number; // Total dry active solids / non-carrier matter (%)
  totalRawMatter: number; // Sum of raw ingredients (%)
  totalRawPercentage: number; // Alias for totalRawMatter
  totalCarrierPercentage: number; // Sum of carried water + free water or non-active (%)
  totalActiveKg: number; // Alias for totalBatchActiveKg
  totalCarriedWaterPct: number;
  totalFreeWaterPct: number;
  totalWaterPct: number;
  totalBatchActiveKg: number;
  totalBatchWaterKg: number;
  surfactants: SurfactantActiveBreakdown;
  waterBalance: WaterBalanceBreakdown;
  contributions: IngredientActiveContribution[];
  isFullyAuthoritative: boolean;
  activeMatterStatus: 'COMPLETE' | 'INSUFFICIENT_DATA';
  ingredientsCount: number;
  ingredientsWithMissingActive: number;
  diagnostics: string[];
  warnings: string[];
}

export interface StandardActiveReference {
  name: string;
  activeDefault: number;
  category: string;
  surfactantType: SurfactantChargeClass;
  description: string;
}

/**
 * Standard Active Matter Benchmarks for common industrial detergent raw materials
 */
export const AUTHORITATIVE_ACTIVE_BENCHMARKS: StandardActiveReference[] = [
  { name: "LABSA 96% (Acid Slurry)", activeDefault: 96, category: "Anionic Surfactant", surfactantType: "anionic", description: "Standard high-purity linear alkylbenzene sulfonic acid." },
  { name: "LABSA 90% (Acid Slurry)", activeDefault: 90, category: "Anionic Surfactant", surfactantType: "anionic", description: "Standard commercial 90% active linear alkylbenzene sulfonic acid." },
  { name: "LABSA 90% (Commercial Grade)", activeDefault: 90, category: "Anionic Surfactant", surfactantType: "anionic", description: "Commercial alkylbenzene sulfonic acid grade." },
  { name: "SLES 70% (Sodium Lauryl Ether Sulfate Paste)", activeDefault: 70, category: "Anionic Surfactant", surfactantType: "anionic", description: "Concentrated 2EO sulfate paste." },
  { name: "SLES 28% (Sodium Lauryl Ether Sulfate Liquid)", activeDefault: 28, category: "Anionic Surfactant", surfactantType: "anionic", description: "Ready-to-pump dilute 2EO sulfate liquid." },
  { name: "SLS 95% Needles (Sodium Lauryl Sulfate)", activeDefault: 95, category: "Anionic Surfactant", surfactantType: "anionic", description: "High-foaming solid sodium lauryl sulfate needles." },
  { name: "SLS 30% Liquid (Sodium Lauryl Sulfate)", activeDefault: 30, category: "Anionic Surfactant", surfactantType: "anionic", description: "Dilute liquid sodium lauryl sulfate solution." },
  { name: "AOS 92% Powder (Alpha Olefin Sulfonate)", activeDefault: 92, category: "Anionic Surfactant", surfactantType: "anionic", description: "High active dry powder alpha olefin sulfonate." },
  { name: "AOS 38% Liquid (Alpha Olefin Sulfonate)", activeDefault: 38, category: "Anionic Surfactant", surfactantType: "anionic", description: "Liquid alpha olefin sulfonate solution." },
  { name: "CAPB 30% (Cocamidopropyl Betaine)", activeDefault: 30, category: "Amphoteric Surfactant", surfactantType: "amphoteric", description: "Standard amphoteric secondary surfactant." },
  { name: "CAPB 45% (Cocamidopropyl Betaine High Active)", activeDefault: 45, category: "Amphoteric Surfactant", surfactantType: "amphoteric", description: "High-concentration amphoteric betaine concentrate." },
  { name: "Cocamide DEA 85% (CDEA)", activeDefault: 85, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "Alkanolamide foam stabilizer and viscosity builder." },
  { name: "Cocamide MEA 90% (CMEA Flakes)", activeDefault: 90, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "Solid flake monoethanolamide foam booster." },
  { name: "Lauryl Amine Oxide 30% (LDAO)", activeDefault: 30, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "Amine oxide foam booster and bleach-stable surfactant." },
  { name: "APG 0810 (Caprylyl/Capryl Glucoside 50%)", activeDefault: 50, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "50% aqueous alkyl polyglucoside nonionic hydrotrope." },
  { name: "APG 1214 (Lauryl Glucoside 50%)", activeDefault: 50, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "50% aqueous plant-derived lauryl glucoside." },
  { name: "Linear Alcohol Ethoxylate 9EO (LAE-9 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active nonionic detergency surfactant." },
  { name: "Linear Alcohol Ethoxylate 7EO (LAE-7 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active nonionic emulsifier." },
  { name: "Polysorbate 20 (Tween 20 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active hydrophilic fragrance solubilizer." },
  { name: "Polysorbate 80 (Tween 80 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active O/W emulsifier." },
  { name: "PEG-40 Hydrogenated Castor Oil (100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active fragrance solubilizer." },
  { name: "Benzalkonium Chloride 50% (BKC-50)", activeDefault: 50, category: "Cationic Surfactant", surfactantType: "cationic", description: "50% aqueous quaternary ammonium disinfectant." },
  { name: "Benzalkonium Chloride 80% (BKC-80)", activeDefault: 80, category: "Cationic Surfactant", surfactantType: "cationic", description: "80% concentrated quaternary ammonium biocide." },
  { name: "Cetrimonium Chloride 30% (CTAC)", activeDefault: 30, category: "Cationic Surfactant", surfactantType: "cationic", description: "30% aqueous cationic hair & fabric conditioner." },
  { name: "Sodium Hydroxide 50% Liquid (Caustic Lye)", activeDefault: 50, category: "Neutralizer / Base", surfactantType: "none", description: "50% aqueous sodium hydroxide lye." },
  { name: "Sodium Hydroxide 99% Flakes", activeDefault: 99, category: "Neutralizer / Base", surfactantType: "none", description: "99% solid caustic soda flakes." },
  { name: "Potassium Hydroxide 45% Liquid (Caustic Potash)", activeDefault: 45, category: "Neutralizer / Base", surfactantType: "none", description: "45% aqueous potassium hydroxide solution." },
  { name: "Potassium Hydroxide 90% Flakes", activeDefault: 90, category: "Neutralizer / Base", surfactantType: "none", description: "90% solid potassium hydroxide flakes." },
  { name: "Triethanolamine 99% (TEA)", activeDefault: 99, category: "Neutralizer / Buffer", surfactantType: "none", description: "99% pure organic tertiary amine base." },
  { name: "Triethanolamine 85% (TEA 85)", activeDefault: 85, category: "Neutralizer / Buffer", surfactantType: "none", description: "85% commercial grade triethanolamine (with diethanolamine)." },
  { name: "Monoethanolamine 99% (MEA)", activeDefault: 99, category: "Neutralizer / Base", surfactantType: "none", description: "99% pure primary ethanolamine." },
  { name: "GLDA 47% Liquid (Dissolvine GL-47)", activeDefault: 47, category: "Builder / Chelator", surfactantType: "none", description: "47% aqueous tetrasodium glutamate diacetate solution." },
  { name: "MGDA 40% Liquid (Trilon M)", activeDefault: 40, category: "Builder / Chelator", surfactantType: "none", description: "40% aqueous methylglycinediacetic acid solution." },
  { name: "Tetrasodium EDTA 39% Liquid", activeDefault: 39, category: "Builder / Chelator", surfactantType: "none", description: "39% aqueous tetrasodium ethylenediaminetetraacetate solution." },
  { name: "Tetrasodium EDTA 99% Powder", activeDefault: 99, category: "Builder / Chelator", surfactantType: "none", description: "99% solid tetrasodium EDTA crystalline powder." },
  { name: "Sodium Citrate Dihydrate (100%)", activeDefault: 100, category: "Builder / Chelator", surfactantType: "none", description: "100% crystalline sodium citrate dihydrate builder." },
  { name: "Sodium Carbonate (Soda Ash 99%)", activeDefault: 99, category: "Builder / Alkali", surfactantType: "none", description: "99% dense/light soda ash powder." },
  { name: "Sodium Tripolyphosphate (STPP 94%)", activeDefault: 94, category: "Builder / Sequestering", surfactantType: "none", description: "94% technical grade sodium tripolyphosphate." },
  { name: "Sodium Metasilicate Pentahydrate", activeDefault: 100, category: "Builder / Corrosion Inhibitor", surfactantType: "none", description: "100% crystalline sodium metasilicate pentahydrate." },
  { name: "Sodium Hypochlorite 12% Liquid (Bleach)", activeDefault: 12, category: "Bleach / Oxidizer", surfactantType: "none", description: "12% available chlorine industrial sodium hypochlorite." },
  { name: "Hydrogen Peroxide 50% Liquid", activeDefault: 50, category: "Bleach / Oxidizer", surfactantType: "none", description: "50% technical hydrogen peroxide solution." },
  { name: "Sodium Xylene Sulfonate 40% (SXS-40)", activeDefault: 40, category: "Hydrotrope / Coupling", surfactantType: "none", description: "40% aqueous sodium xylene sulfonate hydrotrope." },
  { name: "Deionized Water (Water / Aqua)", activeDefault: 0, category: "Solvent / Carrier", surfactantType: "none", description: "0% active solids, 100% carrier solvent." },
  { name: "Demineralized Water (DM Water)", activeDefault: 0, category: "Solvent / Carrier", surfactantType: "none", description: "0% active solids, 100% carrier solvent." },
  { name: "Tap Water", activeDefault: 0, category: "Solvent / Carrier", surfactantType: "none", description: "0% active solids, 100% carrier solvent." }
];

export class ActiveMatterEngine {
  /**
   * Helper: classify surfactant charge type based on category, role, and name keywords
   */
  public static classifySurfactantCharge(category: string, role: string, name: string): { isSurfactant: boolean; surfactantType: SurfactantChargeClass } {
    const cat = (category || '').toLowerCase();
    const r = (role || '').toLowerCase();
    const n = (name || '').toLowerCase();
    const combined = `${cat} ${r} ${n}`;

    // Non-surfactants: inorganic salts, fillers, builders, solvents, preservatives
    const isExplicitNonSurfactant = 
      cat.includes('filler') || 
      cat.includes('builder') || 
      cat.includes('chelator') || 
      cat.includes('preservative') || 
      cat.includes('neutralizer') || 
      cat.includes('solvent') || 
      cat.includes('dye') || 
      cat.includes('colorant') || 
      cat.includes('fragrance') || 
      cat.includes('perfume') || 
      cat.includes('enzyme') ||
      n === 'sodium sulfate' || 
      n === 'magnesium sulfate' || 
      n === 'calcium sulfate' || 
      n === 'potassium sulfate' ||
      n === 'sodium chloride' ||
      n.includes('glauber');

    if (isExplicitNonSurfactant && !cat.includes('surfactant')) {
      return { isSurfactant: false, surfactantType: 'none' };
    }

    if (
      cat.includes('anionic') || 
      r.includes('anionic') || 
      n.includes('labsa') || 
      n.includes('sles') || 
      n.includes('sls') || 
      n.includes('als') || 
      n.includes('ales') || 
      n.includes('lauryl sulfate') || 
      n.includes('laureth sulfate') || 
      n.includes('alkyl sulfate') || 
      n.includes('dodecyl sulfate') || 
      n.includes('aos') || 
      n.includes('sulfonate') || 
      n.includes('alkylbenzene') || 
      n.includes('soap') || 
      n.includes('oleate')
    ) {
      return { isSurfactant: true, surfactantType: 'anionic' };
    }

    if (
      cat.includes('amphoteric') || 
      cat.includes('zwitterionic') || 
      r.includes('amphoteric') || 
      n.includes('betaine') || 
      n.includes('capb') || 
      n.includes('sultaine') || 
      n.includes('amphoacetate')
    ) {
      return { isSurfactant: true, surfactantType: 'amphoteric' };
    }

    if (
      cat.includes('cationic') || 
      r.includes('cationic') || 
      n.includes('bkc') || 
      n.includes('quaternary') || 
      n.includes('chloride') && (n.includes('cetrimonium') || n.includes('benzalkonium') || n.includes('distearyl')) || 
      n.includes('esterquat')
    ) {
      return { isSurfactant: true, surfactantType: 'cationic' };
    }

    if (
      cat.includes('nonionic') || 
      r.includes('nonionic') || 
      n.includes('ethoxylate') || 
      n.includes('lae') || 
      n.includes('apg') || 
      n.includes('glucoside') || 
      n.includes('tween') || 
      n.includes('span') || 
      n.includes('polysorbate') || 
      n.includes('cdea') || 
      n.includes('cmea') || 
      n.includes('cocamide') || 
      n.includes('amine oxide') || 
      n.includes('ldao') || 
      n.includes('peg-40') || 
      n.includes('np-9') || 
      n.includes('np-6')
    ) {
      return { isSurfactant: true, surfactantType: 'nonionic' };
    }

    if (cat.includes('surfactant') || r.includes('surfactant') || combined.includes('foamer') || combined.includes('emulsifier') || combined.includes('solubilizer')) {
      return { isSurfactant: true, surfactantType: 'nonionic' };
    }

    return { isSurfactant: false, surfactantType: 'none' };
  }

  /**
   * Helper: Check if an ingredient is water or pure carrier
   */
  public static isWaterIngredient(name: string, category: string, role: string): boolean {
    const n = (name || '').toLowerCase().trim();
    const c = (category || '').toLowerCase();
    const r = (role || '').toLowerCase();
    
    if (n === 'water' || n === 'aqua' || n === 'di water' || n === 'ro water' || n === 'dm water' || n === 'tap water' || n === 'deionized water' || n === 'demineralized water' || n.includes('purified water')) {
      return true;
    }
    if ((n.includes('water') || n.includes('aqua')) && (c.includes('solvent') || c.includes('carrier') || r.includes('solvent') || r.includes('carrier') || !c)) {
      return true;
    }
    return false;
  }

  /**
   * Helper: Check if an ingredient is a solvent (excluding water)
   */
  public static isSolventIngredient(name: string, category: string, role: string): boolean {
    const n = (name || '').toLowerCase().trim();
    const c = (category || '').toLowerCase();
    const r = (role || '').toLowerCase();

    if (this.isWaterIngredient(name, category, role)) {
      return false;
    }

    if (c.includes('solvent') || r.includes('solvent') || n.includes('ethanol') || n.includes('isopropanol') || n.includes('ipa') || n.includes('propylene glycol') || n.includes('glycerin') || n.includes('butyl glycol') || n.includes('dpm') || n.includes('dipropylene glycol')) {
      return true;
    }
    return false;
  }

  /**
   * Helper: Extract percentage number embedded in ingredient name
   * Examples: "SLES 28%", "LABSA 96%", "NaOH 50% Liquid", "GLDA 47%"
   */
  public static extractPercentageFromName(name: string): number | null {
    if (!name) return null;
    const match = name.match(/(\d+(?:\.\d+)?)\s*(?:%|pct|percent)/i);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return val;
      }
    }
    return null;
  }

  /**
   * Authoritative resolution of ingredient active matter percentage and metadata.
   */
  public static resolveIngredientActive(ing: FormulationIngredient): IngredientActiveResolution {
    const rawName = (ing?.name || '').trim();
    const lowerName = rawName.toLowerCase();
    const rawCategory = (ing?.category || (ing as any)?.role || (ing as any)?.function || '').trim();
    const rawRole = (ing?.role || (ing as any)?.function || '').trim();

    const isWater = this.isWaterIngredient(rawName, rawCategory, rawRole);
    const isSolvent = this.isSolventIngredient(rawName, rawCategory, rawRole);

    // 1. Check explicit formula override inputs
    const explicitActive = ing?.activeMatterPct ?? (ing as any)?.activePercent ?? (ing as any)?.activeMatterPurity ?? (ing as any)?.activePct ?? (ing as any)?.purity;
    
    // Canonical master lookup by ID or Name
    let canonicalMatch: UniversalIngredient | undefined;
    if (ing?.id) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => u.id === ing.id);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => u.name.toLowerCase() === lowerName);
    }

    const resolvedCategory = canonicalMatch?.category || rawCategory || (isWater ? 'Solvent / Carrier' : isSolvent ? 'Solvent' : 'Additive');
    const { isSurfactant, surfactantType } = this.classifySurfactantCharge(resolvedCategory, rawRole, rawName);

    // Water is strictly 0% active solids
    if (isWater) {
      return {
        activeMatterPct: 0,
        dataSource: explicitActive !== undefined && explicitActive !== null ? 'explicit_override' : 'authoritative',
        category: resolvedCategory,
        isSurfactant: false,
        surfactantType: 'none',
        isWater: true,
        isSolvent: false,
        canonicalMatch
      };
    }

    // Explicit override provided
    if (explicitActive !== undefined && explicitActive !== null && !isNaN(Number(explicitActive))) {
      const activeNum = Math.max(0, Math.min(100, Number(explicitActive)));
      return {
        activeMatterPct: activeNum,
        dataSource: 'explicit_override',
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }

    // Name-embedded concentration derivation (e.g., "SLES 28%", "LABSA 90%", "GLDA 47%", "NaOH 50%")
    const namePct = this.extractPercentageFromName(rawName);
    if (namePct !== null) {
      // Find benchmark that matches both category/name AND this percentage
      const matchedBench = AUTHORITATIVE_ACTIVE_BENCHMARKS.find(b => {
        const bLower = b.name.toLowerCase();
        return b.activeDefault === namePct && (
          (lowerName.includes('labsa') && bLower.includes('labsa')) ||
          (lowerName.includes('sles') && bLower.includes('sles')) ||
          (lowerName.includes('sls') && bLower.includes('sls')) ||
          (lowerName.includes('aos') && bLower.includes('aos')) ||
          (lowerName.includes('capb') && bLower.includes('capb')) ||
          ((lowerName.includes('naoh') || lowerName.includes('hydroxide')) && (bLower.includes('naoh') || bLower.includes('hydroxide'))) ||
          (lowerName.includes('glda') && bLower.includes('glda')) ||
          (lowerName.includes('edta') && bLower.includes('edta')) ||
          (lowerName.includes('bkc') && bLower.includes('bkc'))
        );
      });

      return {
        activeMatterPct: namePct,
        dataSource: matchedBench ? 'authoritative' : 'derived_from_name',
        category: resolvedCategory || matchedBench?.category || 'Surfactant',
        isSurfactant: isSurfactant || (matchedBench ? matchedBench.surfactantType !== 'none' : false),
        surfactantType: surfactantType !== 'none' ? surfactantType : (matchedBench?.surfactantType || 'none'),
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }

    // Exact Canonical library direct match
    if (canonicalMatch && canonicalMatch.activeDefault !== undefined && !isNaN(Number(canonicalMatch.activeDefault))) {
      return {
        activeMatterPct: Number(canonicalMatch.activeDefault),
        dataSource: 'authoritative',
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }

    // Benchmark standard database lookup
    const benchMatch = AUTHORITATIVE_ACTIVE_BENCHMARKS.find(b => {
      const bLower = b.name.toLowerCase();
      const bFirst = bLower.split(' ')[0];
      const bParen = bLower.split('(')[0].trim();
      const hasParenthesesMatch = bLower.includes(`(${lowerName} `) || bLower.includes(` ${lowerName} `) || bLower.includes(`(${lowerName})`) || bLower.includes(` ${lowerName})`) || bLower.includes(`(${lowerName}%)`) || bLower.includes(`(${lowerName} 100%)`);
      return lowerName === bFirst || lowerName === bParen || bLower.startsWith(lowerName) || hasParenthesesMatch;
    });

    if (benchMatch) {
      return {
        activeMatterPct: benchMatch.activeDefault,
        dataSource: 'authoritative',
        category: resolvedCategory || benchMatch.category,
        isSurfactant: isSurfactant || benchMatch.surfactantType !== 'none',
        surfactantType: surfactantType !== 'none' ? surfactantType : benchMatch.surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }

    // Solvents like pure Glycerin, IPA, Ethanol are 100% active liquid
    if (isSolvent) {
      return {
        activeMatterPct: 100,
        dataSource: 'authoritative',
        category: resolvedCategory,
        isSurfactant: false,
        surfactantType: 'none',
        isWater: false,
        isSolvent: true,
        canonicalMatch
      };
    }

    // Solid chemicals / salts (e.g. Sodium Chloride, Citric Acid, STPP, Soda Ash) are standard 100%
    const isSolidChemical = lowerName.includes('chloride') || 
                            lowerName.includes('sulfate') && !isSurfactant || 
                            lowerName.includes('carbonate') || 
                            lowerName.includes('bicarbonate') || 
                            lowerName.includes('citric acid') || 
                            lowerName.includes('silicate') ||
                            lowerName.includes('powder') ||
                            lowerName.includes('flakes') ||
                            lowerName.includes('granules') ||
                            lowerName.includes('enzyme') ||
                            lowerName.includes('preservative') ||
                            lowerName.includes('dye') ||
                            lowerName.includes('fragrance');

    if (isSolidChemical) {
      return {
        activeMatterPct: 100,
        dataSource: 'authoritative',
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent: false,
        canonicalMatch
      };
    }

    // Missing / Unknown Active Specification (Never assume 100% for unknown active specification)
    return {
      activeMatterPct: 0,
      dataSource: 'missing',
      category: resolvedCategory,
      isSurfactant,
      surfactantType,
      isWater: false,
      isSolvent: false,
      canonicalMatch
    };
  }

  /**
   * Evaluates complete Active Matter and Mass Balance Report for a formulation.
   */
  public static calculateActiveMatterReport(
    ingredients: FormulationIngredient[], 
    batchSizeKg: number = 100
  ): ActiveMatterReport {
    const safeIngs = Array.isArray(ingredients) ? ingredients : [];
    const validBatchSize = typeof batchSizeKg === 'number' && batchSizeKg > 0 ? batchSizeKg : 100;

    const contributions: IngredientActiveContribution[] = [];
    const diagnostics: string[] = [];
    const warnings: string[] = [];

    let totalRawMatter = 0;
    let totalActiveMatter = 0;
    let totalCarriedWaterPct = 0;
    let totalFreeWaterPct = 0;

    let anionicActivePct = 0;
    let nonionicActivePct = 0;
    let amphotericActivePct = 0;
    let cationicActivePct = 0;
    let totalActiveSurfactants = 0;
    let totalRawSurfactants = 0;

    let ingredientsWithMissingActive = 0;

    for (const ing of safeIngs) {
      const rawPct = Number(ing?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0);
      if (isNaN(rawPct) || rawPct < 0) {
        continue;
      }

      totalRawMatter += rawPct;

      const resolution = this.resolveIngredientActive(ing);
      const activePct = (rawPct * resolution.activeMatterPct) / 100;
      const carrierPct = Math.max(0, rawPct - activePct);

      const rawMassKg = (rawPct / 100) * validBatchSize;
      const activeMassKg = (activePct / 100) * validBatchSize;
      const carrierMassKg = (carrierPct / 100) * validBatchSize;

      if (resolution.dataSource === 'missing') {
        ingredientsWithMissingActive++;
        diagnostics.push(`Ingredient "${ing.name || 'Unknown'}" lacks authoritative active assay data (unresolved active specification; INSUFFICIENT_DATA).`);
        warnings.push(`Ingredient "${ing.name || 'Unknown'}" lacks authoritative active assay specification (INSUFFICIENT_DATA).`);
      }

      if (resolution.isWater) {
        totalFreeWaterPct += rawPct;
      } else {
        totalActiveMatter += activePct;
        totalCarriedWaterPct += carrierPct;
      }

      if (resolution.isSurfactant) {
        totalRawSurfactants += rawPct;
        totalActiveSurfactants += activePct;

        switch (resolution.surfactantType) {
          case 'anionic':
            anionicActivePct += activePct;
            break;
          case 'nonionic':
            nonionicActivePct += activePct;
            break;
          case 'amphoteric':
            amphotericActivePct += activePct;
            break;
          case 'cationic':
            cationicActivePct += activePct;
            break;
        }
      }

      contributions.push({
        id: ing.id,
        name: ing.name || 'Unnamed Ingredient',
        category: resolution.category,
        role: ing.role || (ing as any).function,
        rawPercentage: Number(rawPct.toFixed(3)),
        activeMatterPct: resolution.activeMatterPct,
        activePercentage: Number(activePct.toFixed(3)),
        carrierPercentage: Number(carrierPct.toFixed(3)),
        rawMassKg: Number(rawMassKg.toFixed(4)),
        activeMassKg: Number(activeMassKg.toFixed(4)),
        carrierMassKg: Number(carrierMassKg.toFixed(4)),
        isSurfactant: resolution.isSurfactant,
        surfactantType: resolution.surfactantType,
        isWater: resolution.isWater,
        isSolvent: resolution.isSolvent,
        dataSource: resolution.dataSource,
        notes: resolution.isWater 
          ? 'Carrier water' 
          : `${resolution.activeMatterPct}% active (${resolution.dataSource})`
      });
    }

    const totalWaterPct = totalFreeWaterPct + totalCarriedWaterPct;
    const totalBatchActiveKg = (totalActiveMatter / 100) * validBatchSize;
    const totalBatchWaterKg = (totalWaterPct / 100) * validBatchSize;

    // Relative ratios in surfactant system
    const anionicRatio = totalActiveSurfactants > 0 ? (anionicActivePct / totalActiveSurfactants) * 100 : 0;
    const nonionicRatio = totalActiveSurfactants > 0 ? (nonionicActivePct / totalActiveSurfactants) * 100 : 0;
    const amphotericRatio = totalActiveSurfactants > 0 ? (amphotericActivePct / totalActiveSurfactants) * 100 : 0;
    const cationicRatio = totalActiveSurfactants > 0 ? (cationicActivePct / totalActiveSurfactants) * 100 : 0;

    // Integrity warnings
    if (Math.abs(totalRawMatter - 100) > 0.5 && safeIngs.length > 0) {
      warnings.push(`Formula total raw percentage is ${totalRawMatter.toFixed(2)}% (target: 100.0%).`);
    }

    return {
      totalActiveMatter: Number(totalActiveMatter.toFixed(2)),
      totalRawMatter: Number(totalRawMatter.toFixed(2)),
      totalRawPercentage: Number(totalRawMatter.toFixed(2)),
      totalCarrierPercentage: Number(Math.max(0, totalRawMatter - totalActiveMatter).toFixed(2)),
      totalActiveKg: Number(totalBatchActiveKg.toFixed(3)),
      totalCarriedWaterPct: Number(totalCarriedWaterPct.toFixed(2)),
      totalFreeWaterPct: Number(totalFreeWaterPct.toFixed(2)),
      totalWaterPct: Number(totalWaterPct.toFixed(2)),
      totalBatchActiveKg: Number(totalBatchActiveKg.toFixed(3)),
      totalBatchWaterKg: Number(totalBatchWaterKg.toFixed(3)),
      surfactants: {
        anionicActivePct: Number(anionicActivePct.toFixed(2)),
        nonionicActivePct: Number(nonionicActivePct.toFixed(2)),
        amphotericActivePct: Number(amphotericActivePct.toFixed(2)),
        cationicActivePct: Number(cationicActivePct.toFixed(2)),
        totalActiveSurfactants: Number(totalActiveSurfactants.toFixed(2)),
        totalRawSurfactants: Number(totalRawSurfactants.toFixed(2)),
        anionicRatio: Number(anionicRatio.toFixed(1)),
        nonionicRatio: Number(nonionicRatio.toFixed(1)),
        amphotericRatio: Number(amphotericRatio.toFixed(1)),
        cationicRatio: Number(cationicRatio.toFixed(1))
      },
      waterBalance: {
        freeAddedWaterPct: Number(totalFreeWaterPct.toFixed(2)),
        carriedWaterPct: Number(totalCarriedWaterPct.toFixed(2)),
        totalWaterPct: Number(totalWaterPct.toFixed(2)),
        freeAddedWaterKg: Number(((totalFreeWaterPct / 100) * validBatchSize).toFixed(3)),
        carriedWaterKg: Number(((totalCarriedWaterPct / 100) * validBatchSize).toFixed(3)),
        totalWaterKg: Number(totalBatchWaterKg.toFixed(3))
      },
      contributions,
      isFullyAuthoritative: ingredientsWithMissingActive === 0,
      activeMatterStatus: ingredientsWithMissingActive === 0 ? 'COMPLETE' : 'INSUFFICIENT_DATA',
      ingredientsCount: contributions.length,
      ingredientsWithMissingActive,
      diagnostics,
      warnings
    };
  }

  /**
   * Fast calculation helper: Total Active Solids % (w/w)
   */
  public static calculateTotalActiveMatter(ingredients: FormulationIngredient[]): number {
    return this.calculateActiveMatterReport(ingredients).totalActiveMatter;
  }

  /**
   * Fast calculation helper: Total Active Surfactants % (w/w)
   */
  public static calculateActiveSurfactants(ingredients: FormulationIngredient[]): number {
    return this.calculateActiveMatterReport(ingredients).surfactants.totalActiveSurfactants;
  }

  /**
   * Fast calculation helper: Total Raw Surfactants % (w/w)
   */
  public static calculateRawSurfactants(ingredients: FormulationIngredient[]): number {
    return this.calculateActiveMatterReport(ingredients).surfactants.totalRawSurfactants;
  }

  /**
   * Single-ingredient active matter lookup helper
   */
  public static getDefaultActiveMatter(nameOrIng: string | FormulationIngredient): number {
    if (typeof nameOrIng === 'string') {
      return this.resolveIngredientActive({ name: nameOrIng }).activeMatterPct;
    }
    return this.resolveIngredientActive(nameOrIng).activeMatterPct;
  }
}

// Top-level exported functions for seamless integration
export function evaluateAuthoritativeActiveMatter(
  ingredients: FormulationIngredient[], 
  batchSizeKg?: number
): ActiveMatterReport {
  return ActiveMatterEngine.calculateActiveMatterReport(ingredients, batchSizeKg);
}

export function calculateActiveMatter(ingredients: FormulationIngredient[]): number {
  return ActiveMatterEngine.calculateTotalActiveMatter(ingredients);
}

export function calculateActiveSurfactants(ingredients: FormulationIngredient[]): number {
  return ActiveMatterEngine.calculateActiveSurfactants(ingredients);
}

export function calculateRawSurfactants(ingredients: FormulationIngredient[]): number {
  return ActiveMatterEngine.calculateRawSurfactants(ingredients);
}

export function getDefaultActiveMatter(nameOrIng: string | FormulationIngredient): number {
  return ActiveMatterEngine.getDefaultActiveMatter(nameOrIng);
}

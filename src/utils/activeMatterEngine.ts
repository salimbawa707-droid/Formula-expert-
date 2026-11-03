import { FormulationIngredient } from '../types';
import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from '../data/universalIngredientLibrary';
import { validateActiveMatterInput } from './activeMatterInputGuard';
import { ActiveMatterResultObject } from './activeMatterValidation';

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
 *    - Respects explicit formula override inputs (e.g., user-specified `activeMatterPct`, `activePercent`, `activeMatterPurity`, `purity`)
 *    - Data Provenance Status:
 *      * 'authoritative': Only a canonical grade record with attached source/provenance
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

function normalizeActiveMatterInputValue(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value.trim());
  }
  return value;
}

export type ActiveMatterProvenance = 'authoritative' | 'canonical_library_default' | 'reference_default' | 'explicit_override' | 'derived_from_name' | 'missing';

export type SurfactantChargeClass = 'anionic' | 'nonionic' | 'amphoteric' | 'cationic' | 'none';

export interface IngredientActiveResolution {
  activeMatterPct: number | null;
  dataSource: ActiveMatterProvenance;
  category: string;
  isSurfactant: boolean;
  surfactantType: SurfactantChargeClass;
  isWater: boolean;
  isSolvent: boolean;
  canonicalMatch?: UniversalIngredient;
  conflict?: { message: string };
}

export interface IngredientActiveContribution {
  id?: string;
  name: string;
  category: string;
  role?: string;
  rawPercentage: number;
  activeMatterPct: number | null;
  activePercentage: number | null; // (rawPercentage * activeMatterPct) / 100
  carrierPercentage: number | null; // rawPercentage - activePercentage
  rawMassKg: number;
  activeMassKg: number | null;
  carrierMassKg: number | null;
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
  totalCarrierPercentage: number; // Known free/carried water or carrier fraction only (%)
  totalUnclassifiedPercentage: number; // Raw fraction with unknown/invalid active assay (%)
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
  invalidPercentageCount: number;
  nonAuthoritativeCount: number;
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
 * Unsourced standard reference values for common commercial grade labels. These are screening defaults, not verified supplier assays.
 */
export const STANDARD_ACTIVE_MATTER_REFERENCE_VALUES: StandardActiveReference[] = [
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

    const conflict = this.detectGradeActiveConflict(ing);
    const conflictRes = conflict.hasConflict ? { message: conflict.message } : undefined;

    const isWater = this.isWaterIngredient(rawName, rawCategory, rawRole);
    const isSolvent = this.isSolventIngredient(rawName, rawCategory, rawRole);

    // 1. Check explicit formula override inputs
    const explicitActiveRaw = ing?.activeMatterPct ?? (ing as any)?.activePercent ?? (ing as any)?.activeMatterPurity ?? (ing as any)?.activePct ?? (ing as any)?.purity;
    const explicitActive = normalizeActiveMatterInputValue(explicitActiveRaw);
    
    // Canonical master lookup by canonical ID, ID, Name, or deterministic alias
    let canonicalMatch: UniversalIngredient | undefined;
    if (ing?.canonicalIngredientId) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => u.id === ing.canonicalIngredientId);
    }
    if (!canonicalMatch && ing?.id) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => u.id === ing.id);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u =>
        u.name.toLowerCase() === lowerName ||
        ((lowerName === 'sodium bicarbonate' || lowerName === 'baking soda') && u.id === 'sodium-bicarbonate')
      );
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
        canonicalMatch,
        conflict: conflictRes
      };
    }

    // Explicit override provided
    if (explicitActive !== undefined && explicitActive !== null) {
      const validation = validateActiveMatterInput(explicitActive);
      return {
        activeMatterPct: validation.value,
        dataSource: validation.status === 'VALID' ? 'explicit_override' : 'missing',
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch,
        conflict: conflictRes
      };
    }

    // Benchmark standard database lookup
    const benchMatch = STANDARD_ACTIVE_MATTER_REFERENCE_VALUES.find(b => {
      const bLower = b.name.toLowerCase();
      const bParen = bLower.split('(')[0].trim();
      // Do not resolve a generic family name (e.g. "LABSA") to an arbitrary first grade.
      return lowerName === bLower || lowerName === bParen;
    });

    if (benchMatch) {
      return {
        activeMatterPct: benchMatch.activeDefault,
        dataSource: 'reference_default',
        category: resolvedCategory || benchMatch.category,
        isSurfactant: isSurfactant || benchMatch.surfactantType !== 'none',
        surfactantType: surfactantType !== 'none' ? surfactantType : benchMatch.surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch,
        conflict: conflictRes
      };
    }

    // Name-embedded concentration derivation (e.g., "SLES 28%", "LABSA 90%", "GLDA 47%", "NaOH 50%")
    const namePct = this.extractPercentageFromName(rawName);
    if (namePct !== null) {
      // Find benchmark that matches both category/name AND this percentage
      const matchedBench = STANDARD_ACTIVE_MATTER_REFERENCE_VALUES.find(b => {
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
        dataSource: 'derived_from_name',
        category: resolvedCategory || matchedBench?.category || 'Surfactant',
        isSurfactant: isSurfactant || (matchedBench ? matchedBench.surfactantType !== 'none' : false),
        surfactantType: surfactantType !== 'none' ? surfactantType : (matchedBench?.surfactantType || 'none'),
        isWater: false,
        isSolvent,
        canonicalMatch,
        conflict: conflictRes
      };
    }

    // Exact Canonical library direct match
    if (
      canonicalMatch &&
      canonicalMatch.activeDefault !== undefined &&
      canonicalMatch.activeDefault !== null &&
      !canonicalMatch.unknownProperties?.includes('activeMatter')
    ) {
      return {
        activeMatterPct: canonicalMatch.activeDefault,
        dataSource: 'canonical_library_default',
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch,
        conflict: conflictRes
      };
    }



    // Missing / Unknown Active Specification
    return {
      activeMatterPct: null,
      dataSource: 'missing',
      category: resolvedCategory,
      isSurfactant,
      surfactantType,
      isWater: false,
      isSolvent: false,
      canonicalMatch,
      conflict: conflictRes
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
    const hasNonEmptyFormula = safeIngs.length > 0;
    const hasValidBatchSize = typeof batchSizeKg === 'number' && Number.isFinite(batchSizeKg) && batchSizeKg > 0;
    const validBatchSize = hasValidBatchSize ? batchSizeKg : Number.NaN;

    const contributions: IngredientActiveContribution[] = [];
    const diagnostics: string[] = [];
    const warnings: string[] = [];

    let totalRawMatter = 0;
    let totalActiveMatter = 0;
    let totalCarriedWaterPct = 0;
    let totalFreeWaterPct = 0;
    let totalUnclassifiedPct = 0;

    let anionicActivePct = 0;
    let nonionicActivePct = 0;
    let amphotericActivePct = 0;
    let cationicActivePct = 0;
    let totalActiveSurfactants = 0;
    let totalRawSurfactants = 0;

    let ingredientsWithMissingActive = 0;
    let invalidPercentageCount = 0;
    let nonAuthoritativeCount = 0;

    if (!hasNonEmptyFormula) {
      diagnostics.push('Formula contains no ingredients; active-matter evaluation is unavailable.');
      warnings.push('EMPTY_FORMULA: No ingredient composition was supplied.');
    }
    if (!hasValidBatchSize) {
      diagnostics.push('Batch size is missing or invalid; batch-mass outputs are unavailable.');
      warnings.push('INVALID_BATCH_SIZE: Supply a finite batch size greater than zero.');
    }

    for (const ing of safeIngs) {
      const rawPctValue = ing?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula;
      const rawPct = rawPctValue === undefined || rawPctValue === null || (typeof rawPctValue === 'string' && rawPctValue.trim() === '')
        ? Number.NaN
        : Number(rawPctValue);
      if (!Number.isFinite(rawPct) || rawPct < 0 || rawPct > 100) {
        invalidPercentageCount++;
        diagnostics.push(`Ingredient "${ing?.name || 'Unknown'}" has a missing or invalid percentage; its mass contribution cannot be calculated.`);
        warnings.push(`INVALID_INGREDIENT_PERCENTAGE: ${ing?.name || 'Unknown'}.`);
        continue;
      }

      totalRawMatter += rawPct;

      const resolution = this.resolveIngredientActive(ing);
      const canonicalSourceVerified = Boolean(
        resolution.canonicalMatch?.provenance?.verificationStatus === 'VERIFIED' &&
        resolution.canonicalMatch?.provenance?.source?.trim()
      );
      const hasNonAuthoritativeResolution =
        resolution.dataSource === 'reference_default' ||
        resolution.dataSource === 'derived_from_name' ||
        resolution.dataSource === 'explicit_override' ||
        (resolution.dataSource === 'canonical_library_default' && !canonicalSourceVerified);
      if (hasNonAuthoritativeResolution) {
        nonAuthoritativeCount++;
        warnings.push(`NON_AUTHORITATIVE_ACTIVE_MATTER: ${ing?.name || 'Unknown'} uses ${resolution.dataSource}; treat as screening input until supplier/source evidence is reviewed.`);
      }

      const rawAmValue = ing.activeMatterPct ?? (ing as any).activePercent ?? (ing as any).activeMatterPurity ?? (ing as any).activePct ?? (ing as any).purity;
      const amValue = normalizeActiveMatterInputValue(rawAmValue);
      const isInvalidActive =
        rawAmValue !== undefined &&
        rawAmValue !== null &&
        validateActiveMatterInput(amValue).status !== 'VALID';

      const isMissingOrInvalid = resolution.activeMatterPct === null || resolution.dataSource === 'missing' || isInvalidActive;

      if (isMissingOrInvalid) {
        totalUnclassifiedPct += rawPct;
        ingredientsWithMissingActive++;
        diagnostics.push(`Ingredient "${ing.name || 'Unknown'}" active matter value "${amValue}" is invalid or missing (INSUFFICIENT_DATA).`);
        warnings.push(`Ingredient "${ing.name || 'Unknown'}" lacks authoritative active assay specification (INSUFFICIENT_DATA).`);
      }

      const activeMatterPctVal = resolution.activeMatterPct;
      const activePct = activeMatterPctVal !== null ? (rawPct * activeMatterPctVal) / 100 : null;
      const carrierPct = activePct !== null ? Math.max(0, rawPct - activePct) : null;

      const rawMassKg = (rawPct / 100) * validBatchSize;
      const activeMassKg = activePct !== null ? (activePct / 100) * validBatchSize : null;
      const carrierMassKg = carrierPct !== null ? (carrierPct / 100) * validBatchSize : null;

      if (resolution.isWater) {
        totalFreeWaterPct += rawPct;
      } else {
        if (activePct !== null) totalActiveMatter += activePct;
        if (carrierPct !== null) totalCarriedWaterPct += carrierPct;
      }

      if (resolution.isSurfactant) {
        totalRawSurfactants += rawPct;
        if (activePct !== null) {
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
      }

      contributions.push({
        id: ing.id,
        name: ing.name || 'Unnamed Ingredient',
        category: resolution.category,
        role: ing.role || (ing as any).function,
        rawPercentage: Number(rawPct.toFixed(3)),
        activeMatterPct: activeMatterPctVal,
        activePercentage: activePct !== null ? Number(activePct.toFixed(3)) : null,
        carrierPercentage: carrierPct !== null ? Number(carrierPct.toFixed(3)) : null,
        rawMassKg: Number(rawMassKg.toFixed(4)),
        activeMassKg: activeMassKg !== null ? Number(activeMassKg.toFixed(4)) : null,
        carrierMassKg: carrierMassKg !== null ? Number(carrierMassKg.toFixed(4)) : null,
        isSurfactant: resolution.isSurfactant,
        surfactantType: resolution.surfactantType,
        isWater: resolution.isWater,
        isSolvent: resolution.isSolvent,
        dataSource: resolution.dataSource,
        notes: resolution.isWater 
          ? 'Carrier water' 
          : activeMatterPctVal !== null 
            ? `${activeMatterPctVal}% active (${resolution.dataSource})`
            : 'UNAVAILABLE'
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
      totalCarrierPercentage: Number(totalWaterPct.toFixed(2)),
      totalUnclassifiedPercentage: Number(totalUnclassifiedPct.toFixed(2)),
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
      isFullyAuthoritative: hasNonEmptyFormula && ingredientsWithMissingActive === 0 && invalidPercentageCount === 0 && nonAuthoritativeCount === 0 && hasValidBatchSize,
      activeMatterStatus: hasNonEmptyFormula && ingredientsWithMissingActive === 0 && invalidPercentageCount === 0 && hasValidBatchSize ? 'COMPLETE' : 'INSUFFICIENT_DATA',
      ingredientsCount: contributions.length,
      ingredientsWithMissingActive,
      invalidPercentageCount,
      nonAuthoritativeCount,
      diagnostics,
      warnings
    };
  }

  /**
   * Fast calculation helper: Total Active Solids % (w/w)
   */
  public static calculateTotalActiveMatter(ingredients: FormulationIngredient[]): number {
    const report = this.calculateActiveMatterReport(ingredients);
    return report.activeMatterStatus === 'COMPLETE' ? report.totalActiveMatter : Number.NaN;
  }

  /**
   * Fast calculation helper: Total Active Surfactants % (w/w)
   */
  public static calculateActiveSurfactants(ingredients: FormulationIngredient[]): number {
    if (!Array.isArray(ingredients) || ingredients.length === 0) return Number.NaN;
    const report = this.calculateActiveMatterReport(ingredients);
    const hasMissingSurfactantAssay = report.contributions.some(item => item.isSurfactant && item.activeMatterPct === null);
    return hasMissingSurfactantAssay || report.invalidPercentageCount > 0
      ? Number.NaN
      : report.surfactants.totalActiveSurfactants;
  }

  /**
   * Fast calculation helper: Total Raw Surfactants % (w/w)
   */
  public static calculateRawSurfactants(ingredients: FormulationIngredient[]): number {
    return this.calculateActiveMatterReport(ingredients).surfactants.totalRawSurfactants;
  }

  /**
   * Detects conflict between a canonical commercial grade name (e.g. "Sodium Hydroxide 50% Liquid")
   * and the active percentage set in the formula (e.g. 99%), unless explicitly confirmed by user override.
   */
  public static detectGradeActiveConflict(ing: FormulationIngredient): {
    hasConflict: boolean;
    expectedActivePct: number | null;
    actualActivePct: number;
    message: string;
  } {
    const name = (ing.name || '').trim();
    const actualActivePct = ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity ?? (ing as any).activePct ?? (ing as any).purity ?? null;

    // "Balance to 100%" is a formulation instruction, not a commercial-grade assay.
    if (/\b(balance|q\.?s\.?|quantity\s+sufficient|make[\s-]?up)\b/i.test(name)) {
      return { hasConflict: false, expectedActivePct: null, actualActivePct, message: '' };
    }

    const match = name.match(/(\d+(?:\.\d+)?)%/);
    if (!match) {
      return { hasConflict: false, expectedActivePct: null, actualActivePct, message: '' };
    }

    const expectedActivePct = parseFloat(match[1]);
    const hasConflict = (actualActivePct === null || Math.abs(expectedActivePct - (actualActivePct as number)) > 1.0) && !(ing as any).confirmedGradeActiveOverride;

    if (hasConflict) {
      return {
        hasConflict: true,
        expectedActivePct,
        actualActivePct,
        message: `Grade Conflict: Ingredient name specifies "${expectedActivePct}% active" but formula active percentage is set to "${actualActivePct}%". Confirm grade or correct active percentage.`
      };
    }

    return { hasConflict: false, expectedActivePct, actualActivePct, message: '' };
  }

  /**
   * Single-ingredient active matter lookup helper
   */
  public static getDefaultActiveMatter(nameOrIng: string | FormulationIngredient): number | null {
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
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  if (safeIngs.length === 0) return Number.NaN;
  const report = ActiveMatterEngine.calculateActiveMatterReport(safeIngs);
  return report.activeMatterStatus === 'COMPLETE' ? report.totalActiveMatter : Number.NaN;
}

export function calculateActiveMatterResult(ingredients: FormulationIngredient[]): ActiveMatterResultObject {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  if (safeIngs.length === 0) {
    return new ActiveMatterResultObject({
      value: null,
      status: 'INSUFFICIENT_DATA',
      verified: false,
      provenance: 'UNKNOWN',
      missingIngredientIds: [],
      blockingReasons: ['FORMULATION_CONTAINS_NO_INGREDIENTS']
    });
  }

  const report = ActiveMatterEngine.calculateActiveMatterReport(safeIngs);
  const missingIds: string[] = [];
  const blockingReasons: string[] = [];

  for (const contrib of report.contributions) {
    if (contrib.activeMatterPct === null || contrib.dataSource === 'missing') {
      missingIds.push(contrib.id || contrib.name);
      blockingReasons.push(`MISSING_ACTIVE_MATTER_FOR_INGREDIENT: ${contrib.name}`);
    }
  }

  if (report.activeMatterStatus !== 'COMPLETE' || missingIds.length > 0) {
    return new ActiveMatterResultObject({
      value: null,
      status: 'INSUFFICIENT_DATA',
      verified: false,
      provenance: 'UNKNOWN',
      missingIngredientIds: missingIds,
      blockingReasons
    });
  }

  return new ActiveMatterResultObject({
    value: report.totalActiveMatter,
    status: 'VALID',
    verified: report.isFullyAuthoritative,
    provenance: 'DERIVED',
    missingIngredientIds: [],
    blockingReasons: []
  });
}

export function calculateActiveSurfactants(ingredients: FormulationIngredient[]): number {
  return ActiveMatterEngine.calculateActiveSurfactants(ingredients);
}

export function calculateRawSurfactants(ingredients: FormulationIngredient[]): number {
  return ActiveMatterEngine.calculateRawSurfactants(ingredients);
}

export function getDefaultActiveMatter(nameOrIng: string | FormulationIngredient): number | null {
  return ActiveMatterEngine.getDefaultActiveMatter(nameOrIng);
}

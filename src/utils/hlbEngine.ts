import { FormulationIngredient } from '../types';
import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from '../data/universalIngredientLibrary';

/**
 * ============================================================================
 * AUTHORITATIVE HLB & EMULSIFICATION ENGINE (Phase 2 Consolidation)
 * ============================================================================
 * 
 * SCIENTIFIC FOUNDATION & ARCHITECTURAL CONTRACT:
 * 
 * 1. Authoritative HLB Data Resolution:
 *    - Resolves raw materials against canonical ingredient library (id, name, aliases)
 *    - Preserves commercial raw-material grades/variants distinctively even when CAS numbers match
 *      (e.g., SLES 70% vs SLES 28% have the same CAS 68585-34-2; both have Davies HLB 40.0, but active matter is 70% vs 28%)
 *    - Respects explicit formula override inputs (e.g. user-specified `hlbValue` or `hlb`)
 *    - Data Provenance Status:
 *      * 'authoritative': Verified nonionic Griffin value or standardized Davies value from master library / database
 *      * 'estimated': Empirical estimation or derived reference value
 *      * 'missing': No HLB data available for this raw material (never hallucinate / fabricate)
 * 
 * 2. Blended HLB Calculation:
 *    - Basis: Active Surfactant Mass Fraction (Weighted by active matter % * dosage %)
 *      HLB_blend = Σ(HLB_i * W_active_i) / Σ(W_active_i)
 *      where W_active_i = (percentage_i * activeMatter_i) / 100
 *    - Fallback: If active matter is unavailable, weights by gross dosage percentage W_i
 *    - Division-by-Zero / Empty Guard: Returns 0 with hasSurfactants=false and clean diagnostic metadata
 * 
 * 3. Scope & Physical Emulsification Region Mapping:
 *    - 1 to 3.5:   Antifoaming / Defoaming agent
 *    - 3.5 to 6.0:  Water-in-Oil (W/O) Emulsifier
 *    - 6.0 to 8.0:  Wetting & Spreading Agent
 *    - 8.0 to 13.0: Oil-in-Water (O/W) Emulsifier
 *    - 13.0 to 15.0: Detergent / Solubilizer
 *    - 15.0 to 18.0: High-Efficiency Hydrophilic Solubilizer
 *    - > 18.0:      Extended Ionic Surfactant (Davies Scale)
 * 
 * 4. Formula Check & Scientific Safety Guidelines:
 *    - NEVER claim physical formulation stability from HLB alone
 *    - Clearly distinguishes nonionic Griffin scale (0-20) from extended ionic/Davies scale
 *    - Exposes comprehensive diagnostic report for Formula Check & Smart Formula Analyzer Pro
 * ============================================================================
 */

export type HLBDataSource = 'authoritative' | 'explicit_override' | 'estimated' | 'missing';

export type EmulsionSystemType = 
  | 'Antifoaming Agent'
  | 'Water-in-Oil (W/O) Emulsifier'
  | 'Wetting & Spreading Agent'
  | 'Oil-in-Water (O/W) Emulsifier'
  | 'Detergent & Micellar Cleanser'
  | 'Hydrophilic Solubilizer'
  | 'Extended Ionic Surfactant (Davies Scale)'
  | 'Non-Surfactant / Not Applicable';

export interface SurfactantHLBContribution {
  id?: string;
  name: string;
  category?: string;
  percentage: number;
  activeMatterPct: number;
  activeWeight: number; // in formula percentage units (percentage * active / 100)
  hlb: number | null;
  dataSource: HLBDataSource;
  isIonicSurfactant: boolean;
  notes?: string;
}

export interface HLBCalculationResult {
  blendedHLB: number;
  hasSurfactants: boolean;
  totalSurfactantRawWeight: number;
  totalSurfactantActiveWeight: number;
  surfactantsCount: number;
  surfactantsWithAuthoritativeHLB: number;
  surfactantsWithMissingHLB: number;
  isFullyAuthoritative: boolean;
  hasIonicSurfactants: boolean;
  emulsionRegion: EmulsionSystemType;
  interpretation: string;
  scientificNotes: string;
  contributions: SurfactantHLBContribution[];
  limitations: string[];
}

export interface StandardHLBReference {
  name: string;
  hlb: number;
  category: string;
  activeDefault: number;
  scaleType: 'Griffin' | 'Davies';
  description: string;
}

/**
 * Standard HLB Database for nonionic, amphoteric, and anionic benchmarks
 */
export const AUTHORITATIVE_HLB_BENCHMARKS: StandardHLBReference[] = [
  { name: "Span 80 (Sorbitan Monooleate)", hlb: 4.3, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "W/O emulsifier, lipophilic oil-soluble surfactant." },
  { name: "Span 20 (Sorbitan Monolaurate)", hlb: 8.6, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "W/O and O/W co-emulsifier." },
  { name: "Glyceryl Monostearate (GMS)", hlb: 3.8, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Low HLB lipophilic consistency builder." },
  { name: "LAE-3 (Alcohol Ethoxylate 3EO)", hlb: 8.0, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Low HLB nonionic for oily soil penetration." },
  { name: "Nonylphenol Ethoxylate 6EO (NP-6)", hlb: 10.9, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Degreaser and oil wetting nonionic." },
  { name: "LAE-7 (Alcohol Ethoxylate 7EO)", hlb: 12.1, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Standard O/W detergent nonionic surfactant." },
  { name: "Nonylphenol Ethoxylate 9EO (NP-9)", hlb: 13.0, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Workhorse industrial hard surface detergency nonionic." },
  { name: "LAE-9 (Alcohol Ethoxylate 9EO)", hlb: 13.1, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "High-performance laundry and degreasing nonionic." },
  { name: "APG 1214 (Lauryl Glucoside 50%)", hlb: 12.5, category: "Nonionic Surfactant", activeDefault: 50, scaleType: "Griffin", description: "Eco-certified plant glucoside surfactant." },
  { name: "APG 0810 (Caprylyl/Capryl Glucoside 50%)", hlb: 13.0, category: "Nonionic Surfactant", activeDefault: 50, scaleType: "Griffin", description: "High-solubility nonionic hydrotrope." },
  { name: "Cocamide DEA 85% (CDEA)", hlb: 13.5, category: "Nonionic Surfactant", activeDefault: 85, scaleType: "Griffin", description: "Alkanolamide foam stabilizer and viscosity builder." },
  { name: "Cocamide MEA 90% (CMEA)", hlb: 11.5, category: "Nonionic Surfactant", activeDefault: 90, scaleType: "Griffin", description: "Solid flake alkanolamide foam booster." },
  { name: "Lauryl Amine Oxide 30% (LDAO)", hlb: 14.2, category: "Nonionic Surfactant", activeDefault: 30, scaleType: "Griffin", description: "Amine oxide foam booster and hypochlorite-stable nonionic." },
  { name: "LAE-12 (Alcohol Ethoxylate 12EO)", hlb: 14.5, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "High cloud point hydrophilic nonionic detergent." },
  { name: "Polysorbate 80 (Tween 80)", hlb: 15.0, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Hydrophilic O/W emulsifier and essential oil solubilizer." },
  { name: "PEG-40 Hydrogenated Castor Oil", hlb: 15.0, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "High-efficiency fragrance and lipophilic solubilizer." },
  { name: "Polysorbate 20 (Tween 20)", hlb: 16.7, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Hydrophilic fragrance solubilizer." },
  { name: "CAPB 30% (Cocamidopropyl Betaine)", hlb: 12.0, category: "Amphoteric Surfactant", activeDefault: 30, scaleType: "Griffin", description: "Zwitterionic secondary surfactant." },
  { name: "LABSA 96% (Acid Slurry / Neutralized LAS)", hlb: 11.5, category: "Anionic Surfactant", activeDefault: 96, scaleType: "Griffin", description: "Primary linear alkylbenzene sulfonate detergency benchmark." },
  { name: "SLES 70% (Sodium Lauryl Ether Sulfate)", hlb: 40.0, category: "Anionic Surfactant", activeDefault: 70, scaleType: "Davies", description: "Extended ionic sulfate surfactant on Davies scale." },
  { name: "SLES 28% Liquid", hlb: 40.0, category: "Anionic Surfactant", activeDefault: 28, scaleType: "Davies", description: "Extended ionic sulfate surfactant on Davies scale." },
  { name: "SLS 95% Needles (Sodium Lauryl Sulfate)", hlb: 40.0, category: "Anionic Surfactant", activeDefault: 95, scaleType: "Davies", description: "Extended ionic sulfate surfactant on Davies scale." }
];

/**
 * Singleton / Utility class: HLBENGINE
 */
export class HLBEngine {
  /**
   * Resolves raw-material grade and HLB data from canonical library or explicit overrides.
   */
  public static resolveIngredientHLB(ing: FormulationIngredient): {
    hlb: number | null;
    dataSource: HLBDataSource;
    activeMatterPct: number;
    category: string;
    isSurfactant: boolean;
    isIonic: boolean;
  } {
    const rawName = (ing?.name || '').trim();
    const lowerName = rawName.toLowerCase();
    const explicitActive = ing?.activeMatterPct ?? (ing as any)?.activePercent ?? (ing as any)?.activeMatterPurity ?? (ing as any)?.activeMatter;
    const explicitHlb = ing?.hlbValue ?? ing?.hlb;

    // Check if ingredient is explicitly not a surfactant (water, solvent, builder, salt, acid, etc.)
    const isWater = lowerName.includes('water') || lowerName.includes('aqua') || lowerName === 'di water' || lowerName === 'ro water';
    
    // 1. Direct Canonical Library Lookup by ID or Name
    let canonicalMatch: UniversalIngredient | undefined;
    if (ing?.id) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => u.id === ing.id);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => u.name.toLowerCase() === lowerName);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(u => 
        lowerName.includes(u.name.toLowerCase()) || 
        u.name.toLowerCase().includes(lowerName) ||
        (u.inciName && lowerName.includes(u.inciName.toLowerCase()))
      );
    }

    const resolvedCategory = canonicalMatch?.category || ing?.category || '';
    const catLower = resolvedCategory.toLowerCase();
    const isSurfactantCategory = catLower.includes('surfactant') || 
                                 catLower.includes('betaine') || 
                                 catLower.includes('foamer') || 
                                 catLower.includes('emulsifier') || 
                                 catLower.includes('solubilizer');

    const isSurfactant = !isWater && (isSurfactantCategory || (explicitHlb !== undefined && explicitHlb !== null && explicitHlb > 0));

    const isIonic = catLower.includes('anionic') || catLower.includes('cationic') || catLower.includes('amphoteric');

    // 2. Active matter resolution
    let activeMatterPct = 100;
    if (explicitActive !== undefined && explicitActive !== null && !isNaN(Number(explicitActive))) {
      activeMatterPct = Number(explicitActive);
    } else if (canonicalMatch?.activeDefault !== undefined) {
      activeMatterPct = canonicalMatch.activeDefault;
    } else if (isWater) {
      activeMatterPct = 0;
    }

    // 3. HLB Resolution
    // Case A: Explicit user override supplied in formula item
    if (explicitHlb !== undefined && explicitHlb !== null && !isNaN(Number(explicitHlb))) {
      return {
        hlb: Number(explicitHlb),
        dataSource: 'explicit_override',
        activeMatterPct,
        category: resolvedCategory,
        isSurfactant,
        isIonic
      };
    }

    // Case B: Canonical library entry has authoritative HLB
    if (canonicalMatch && canonicalMatch.hlb !== undefined && canonicalMatch.hlb !== null && !isNaN(Number(canonicalMatch.hlb))) {
      return {
        hlb: Number(canonicalMatch.hlb),
        dataSource: 'authoritative',
        activeMatterPct,
        category: resolvedCategory,
        isSurfactant: true,
        isIonic
      };
    }

    // Case C: Benchmark reference lookup
    const benchMatch = AUTHORITATIVE_HLB_BENCHMARKS.find(b => {
      const bLower = b.name.toLowerCase();
      const bFirst = bLower.split(' ')[0];
      const bParen = bLower.split('(')[0].trim();
      const bInParen = bLower.includes('(') ? bLower.split('(')[1].replace(')', '').trim() : '';
      return lowerName.includes(bFirst) || 
             lowerName.includes(bParen) || 
             (bInParen && lowerName.includes(bInParen)) ||
             bLower.includes(lowerName);
    });

    if (benchMatch && (isSurfactant || isSurfactantCategory || benchMatch.category.toLowerCase().includes('surfactant'))) {
      return {
        hlb: benchMatch.hlb,
        dataSource: 'authoritative',
        activeMatterPct: explicitActive !== undefined ? Number(explicitActive) : benchMatch.activeDefault,
        category: resolvedCategory || benchMatch.category,
        isSurfactant: true,
        isIonic: benchMatch.scaleType === 'Davies' || isIonic
      };
    }

    // Case D: Missing / Not Applicable (Never fabricate an arbitrary HLB value)
    return {
      hlb: null,
      dataSource: 'missing',
      activeMatterPct,
      category: resolvedCategory,
      isSurfactant,
      isIonic
    };
  }

  /**
   * Determine Emulsification Region according to standard Griffin & Davies mapping
   */
  public static mapEmulsionRegion(hlb: number): { region: EmulsionSystemType; interpretation: string } {
    if (hlb <= 0) {
      return {
        region: 'Non-Surfactant / Not Applicable',
        interpretation: 'No active surfactant HLB contribution detected.'
      };
    }
    if (hlb >= 1 && hlb < 3.5) {
      return {
        region: 'Antifoaming Agent',
        interpretation: 'Lipophilic defoaming agent; suppresses foam formation in liquid shear.'
      };
    }
    if (hlb >= 3.5 && hlb < 6.0) {
      return {
        region: 'Water-in-Oil (W/O) Emulsifier',
        interpretation: 'Lipophilic emulsifier ideal for inverted water-in-oil creams, polishes, and grease pastes.'
      };
    }
    if (hlb >= 6.0 && hlb < 8.0) {
      return {
        region: 'Wetting & Spreading Agent',
        interpretation: 'Intermediate HLB providing rapid substrate wetting, spreading, and penetration.'
      };
    }
    if (hlb >= 8.0 && hlb < 13.0) {
      return {
        region: 'Oil-in-Water (O/W) Emulsifier',
        interpretation: 'Standard oil-in-water emulsifier suitable for milky lotions, vehicle washes, and general degreasers.'
      };
    }
    if (hlb >= 13.0 && hlb <= 15.0) {
      return {
        region: 'Detergent & Micellar Cleanser',
        interpretation: 'Optimal nonionic detergency & micellar solubilization window (HLB 12-15) for laundry and dishwashing.'
      };
    }
    if (hlb > 15.0 && hlb <= 18.0) {
      return {
        region: 'Hydrophilic Solubilizer',
        interpretation: 'High hydrophilic strength for clear micro-emulsification of essential oils, perfumes, and active actives.'
      };
    }
    return {
      region: 'Extended Ionic Surfactant (Davies Scale)',
      interpretation: 'Extended ionic HLB (Davies scale). High charge-density hydrophilic detergency and foaming.'
    };
  }

  /**
   * Computes the blended HLB across all surfactants in the formulation.
   * 
   * Mathematical Model:
   *   HLB_blend = Σ(HLB_i * W_active_i) / Σ(W_active_i)
   * 
   * where W_active_i = (percentage_i * activeMatter_i) / 100
   * 
   * Returns authoritative HLBCalculationResult.
   */
  public static calculateBlendedHLB(ingredients: FormulationIngredient[]): HLBCalculationResult {
    const safeIngs = Array.isArray(ingredients) ? ingredients : [];
    const contributions: SurfactantHLBContribution[] = [];
    const limitations: string[] = [];

    let totalSurfactantRawWeight = 0;
    let totalSurfactantActiveWeight = 0;
    let weightedHLB = 0;
    let surfactantsWithAuthoritativeHLB = 0;
    let surfactantsWithMissingHLB = 0;
    let hasIonicSurfactants = false;

    for (const ing of safeIngs) {
      const pct = Number(ing?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0);
      if (isNaN(pct) || pct <= 0) {
        continue;
      }

      const resolution = this.resolveIngredientHLB(ing);

      if (resolution.isSurfactant || (resolution.hlb !== null && resolution.hlb > 0)) {
        const activeWeight = (pct * resolution.activeMatterPct) / 100;
        totalSurfactantRawWeight += pct;
        totalSurfactantActiveWeight += activeWeight;

        if (resolution.isIonic) {
          hasIonicSurfactants = true;
        }

        if (resolution.hlb !== null && resolution.hlb >= 0) {
          if (resolution.dataSource === 'authoritative' || resolution.dataSource === 'explicit_override') {
            surfactantsWithAuthoritativeHLB++;
          }
          weightedHLB += resolution.hlb * activeWeight;
        } else {
          surfactantsWithMissingHLB++;
          limitations.push(`Surfactant "${ing.name || 'Unknown'}" lacks authoritative HLB data.`);
        }

        contributions.push({
          id: ing.id,
          name: ing.name || 'Unnamed Surfactant',
          category: resolution.category,
          percentage: pct,
          activeMatterPct: resolution.activeMatterPct,
          activeWeight: Number(activeWeight.toFixed(3)),
          hlb: resolution.hlb,
          dataSource: resolution.dataSource,
          isIonicSurfactant: resolution.isIonic,
          notes: resolution.dataSource === 'missing' 
            ? 'Missing HLB in master database' 
            : `${resolution.dataSource} (${resolution.isIonic ? 'Davies / Ionic' : 'Griffin Scale'})`
        });
      }
    }

    const hasSurfactants = totalSurfactantActiveWeight > 0 && contributions.length > 0;
    const finalBlendedHLB = totalSurfactantActiveWeight > 0 
      ? Number((weightedHLB / totalSurfactantActiveWeight).toFixed(2))
      : 0;

    const { region, interpretation } = this.mapEmulsionRegion(finalBlendedHLB);

    if (hasIonicSurfactants) {
      limitations.push('Mixture contains ionic surfactants: Griffin HLB is strictly defined for nonionic surfactants. Extended values reflect the Davies scale.');
    }

    const isFullyAuthoritative = hasSurfactants && surfactantsWithMissingHLB === 0;

    return {
      blendedHLB: finalBlendedHLB,
      hasSurfactants,
      totalSurfactantRawWeight: Number(totalSurfactantRawWeight.toFixed(2)),
      totalSurfactantActiveWeight: Number(totalSurfactantActiveWeight.toFixed(2)),
      surfactantsCount: contributions.length,
      surfactantsWithAuthoritativeHLB,
      surfactantsWithMissingHLB,
      isFullyAuthoritative,
      hasIonicSurfactants,
      emulsionRegion: region,
      interpretation,
      scientificNotes: hasSurfactants
        ? `Blended HLB ${finalBlendedHLB.toFixed(2)} calculated from ${contributions.length} surfactant(s) based on active-matter mass fractions.`
        : 'No surfactant components with valid HLB detected in formulation.',
      contributions,
      limitations
    };
  }

  /**
   * Fast helper for single-number output backwards compatibility.
   */
  public static calculateBlendedHLBNumber(ingredients: FormulationIngredient[]): number {
    return this.calculateBlendedHLB(ingredients).blendedHLB;
  }

  /**
   * Legacy tuple calculator compatibility: takes array of { name, hlb, proportion / weight }
   */
  public static calculateHLBFromList(surfactants: Array<{ name: string; hlb: number; proportion?: number; weight?: number }>): number {
    let totalWeight = 0;
    let weightedHLB = 0;
    for (const s of surfactants || []) {
      const w = s.proportion !== undefined ? s.proportion : (s.weight || 0);
      const hlb = s.hlb || 0;
      if (w > 0 && !isNaN(w) && !isNaN(hlb)) {
        totalWeight += w;
        weightedHLB += hlb * w;
      }
    }
    return totalWeight > 0 ? Number((weightedHLB / totalWeight).toFixed(2)) : 0;
  }
}

// Top-level exported functions for direct integration
export function calculateBlendedHLB(ingredients: FormulationIngredient[]): number {
  return HLBEngine.calculateBlendedHLBNumber(ingredients);
}

export function evaluateAuthoritativeHLB(ingredients: FormulationIngredient[]): HLBCalculationResult {
  return HLBEngine.calculateBlendedHLB(ingredients);
}

export function calculateHLB(surfactants: Array<{ name: string; hlb: number; proportion?: number; weight?: number }>): number {
  return HLBEngine.calculateHLBFromList(surfactants);
}

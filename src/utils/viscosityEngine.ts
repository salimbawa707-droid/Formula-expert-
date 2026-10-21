import { FormulationIngredient } from '../types';
import { ActiveMatterEngine } from './activeMatterEngine';
import { calculatePHAdvanced } from './pHEngine';
import { normalizeProductCategory } from '../domain/productTaxonomy';
import { PHCalculationOptions } from '../domain/ph/types';

/**
 * ============================================================================
 * AUTHORITATIVE VISCOSITY & RHEOLOGY ENGINE (Phase 5 Consolidation)
 * ============================================================================
 * 
 * SCIENTIFIC FOUNDATION & ARCHITECTURAL CONTRACT:
 * 
 * 1. Single Authoritative Source of Truth for Viscosity:
 *    - Replaces ad-hoc string and mock heuristics across the application.
 *    - Distinguishes explicitly between:
 *      * 'reference_baseline': Named benchmark references, not measurements of the evaluated formula
 *      * 'model_derived': Semi-empirical formula screening estimates; they are not lab-validated by this engine
 *      * 'unsupported': Dry powders, solid bars, anhydrous tablets, or incomplete non-fluid inputs
 * 
 * 2. Rheological Mechanisms Evaluated:
 *    - Surfactant Micellar Rod Growth & Salt Curve:
 *      * Packing parameter P = v / (a0 * lc)
 *      * Anionic ether sulfate base + cosurfactant synergy (CAPB, CDEA, CMEA, LDAO)
 *      * Electrolyte screening (NaCl, Na2SO4, NH4Cl) with sub-critical, build, peak plateau, and salting-out regimes
 *    - Polymeric Rheology Networks:
 *      * Polysaccharide / Cellulosic thickeners (Xanthan Gum, CMC, HPMC)
 *      * Synthetic Alkali-Swellable Polyacrylates (Carbomer 940, Acrylates Copolymer ASE/HASE) with pH neutralization dependency
 *    - Hydrotropic / Solvent Viscosity Depression:
 *      * SXS, SCS, Glycols, Alcohols disrupting wormlike micelle entanglement
 *    - Temperature Dependence:
 *      * Arrhenius viscous flow activation energy (4°C cold storage, 25°C reference, 40°C tropical storage)
 *    - Non-Newtonian Shear Behavior:
 *      * Power-law flow behavior index n (Newtonian vs Pseudoplastic / Shear-Thinning)
 *      * Zero-shear viscosity (rest/suspension), standard measurement (Brookfield RVT @ 20 RPM), and high-shear dispensing
 *      * Bingham / Herschel-Bulkley yield stress (Pa)
 * 
 * 3. Scope Boundaries:
 *    - Never duplicates standalone pKa/pH calculations (delegates to pHEngine)
 *    - Never duplicates raw active solids accounting (delegates to ActiveMatterEngine)
 *    - Never duplicates thermodynamic phase equilibrium or cloud point engines
 * ============================================================================
 */

export type ViscosityDataSource = 'reference_baseline' | 'model_derived' | 'unsupported';
export type ViscosityConfidence = 'High' | 'Medium' | 'Low' | 'Unsupported';

export type RheologyBehavior = 
  | 'Newtonian' 
  | 'Pseudoplastic (Shear-Thinning)' 
  | 'Thixotropic' 
  | 'Yield Stress Fluid' 
  | 'Viscoelastic Wormlike Gel' 
  | 'Unsupported (Dry Powder / Solid)';

export type ViscosityMechanism = 
  | 'Micellar Rod / Salt Curve' 
  | 'Polymeric Chain Entanglement' 
  | 'Alkali-Swellable Polymer Gel' 
  | 'Mixed Micellar-Polymer Matrix' 
  | 'Solvent / Dilute Aqueous' 
  | 'Unsupported Solid / Powder';

export type ViscosityRating = 
  | 'Water-Thin' 
  | 'Low' 
  | 'Medium' 
  | 'Standard Liquid Detergent' 
  | 'Rich Gel' 
  | 'High Viscosity Paste' 
  | 'Over-Salted / Phase Separation Risk' 
  | 'Not Applicable (Solid / Powder)';

export interface ShearRateProfile {
  zeroShearViscosityCp: number;      // Rest / suspension capability
  mediumShearViscosityCp: number;    // Standard measurement (~20 s^-1 / Brookfield RVT @ 20 RPM)
  highShearViscosityCp: number;      // Dispensing / pouring (~100 s^-1)
  flowIndexN: number;                // Ostwald-de Waele power law index (<1.0 is pseudoplastic)
  yieldStressPa: number;             // Yield point required to initiate flow
  recommendedSpindle: string;        // ASTM / ISO standard spindle recommendation
}

export interface TemperatureViscosityProfile {
  temp4C_Cp: number;                 // Winter storage / refrigeration
  temp25C_Cp: number;                // Reference standard lab temperature
  temp40C_Cp: number;                // Summer / tropical / stability chamber
  activationEnergyKjMol: number;     // Viscous flow activation energy (kJ/mol)
  coldGelRisk: boolean;              // Risk of unpourable gelation at cold temps
  hotThinningRisk: boolean;          // Risk of water-thin loss of suspension at 40°C
}

export interface SaltCurveState {
  electrolytePct: number;
  peakSaltPct: number;
  curveRegion: 'sub_critical' | 'growth' | 'peak_plateau' | 'over_salted';
  saltingOutRisk: boolean;
  recommendedSaltAdjustment: string;
}

export interface AuthoritativeBenchmarkMatch {
  benchmarkId: string;
  benchmarkName: string;
  referenceViscosityMinCp: number;
  referenceViscosityMaxCp: number;
  referenceViscosityTypicalCp: number;
  referenceTemperatureC: number;
  spindleRpm: string;
  notes: string;
}

export interface ViscosityContributingFactor {
  component: string;
  role: string;
  contributionType: 'primary_thickener' | 'micellar_builder' | 'surfactant_base' | 'electrolyte_screen' | 'viscosity_depressant' | 'neutralizer';
  effectDescription: string;
}

export interface ViscosityReport {
  viscosityCp: number;               // Primary reference viscosity at 25°C in cPs (mPa.s)
  estViscosityCps?: number;          // Compatibility alias for existing UI hooks
  viscosityRange: string;            // Text representation, e.g. "1800 - 2400 cPs"
  rating: ViscosityRating;           // Qualitative grade
  confidence: ViscosityConfidence;   // Confidence tier
  dataSource: ViscosityDataSource;   // Authoritative vs Model vs Unsupported
  behavior: RheologyBehavior;        // Rheological classification
  mechanism: ViscosityMechanism;     // Primary physical structuring mechanism
  isFluid: boolean;                  // False for powders, bars, tablets
  shearProfile: ShearRateProfile;
  temperatureProfile: TemperatureViscosityProfile;
  saltCurve: SaltCurveState;
  authoritativeMatch?: AuthoritativeBenchmarkMatch;
  contributingFactors: ViscosityContributingFactor[];
  diagnostics: string[];
  warnings: string[];
  recommendations: string[];
  assumedShearRate?: string;
  modelMaturity?: 'REFERENCE_BASELINE' | 'SEMI_EMPIRICAL_SCREENING';
  applicabilityDomain?: string;
  limitations?: string[];
  uncertainty?: {
    level: 'Low' | 'Medium' | 'High';
    factors: string[];
  };
}

/**
 * Validated Industrial Authoritative Formulation Benchmarks
 */
export const AUTHORITATIVE_VISCOSITY_BENCHMARKS: Array<{
  id: string;
  name: string;
  category: string;
  signature: {
    minActiveAnionic: number;
    maxActiveAnionic: number;
    minActiveAmphoteric: number;
    maxActiveAmphoteric: number;
    minSaltPct: number;
    maxSaltPct: number;
    requiresPolymer?: string;
  };
  viscosityRangeCp: [number, number];
  typicalCp: number;
  behavior: RheologyBehavior;
  spindle: string;
  notes: string;
}> = [
  {
    id: 'std-hand-dishwash-14',
    name: 'Standard Commercial Hand Dishwash (14% Active Surfactant)',
    category: 'Hand Dishwashing Liquid',
    signature: {
      minActiveAnionic: 8.0,
      maxActiveAnionic: 14.0,
      minActiveAmphoteric: 0.8,
      maxActiveAmphoteric: 3.0,
      minSaltPct: 1.2,
      maxSaltPct: 2.2
    },
    viscosityRangeCp: [2000, 3200],
    typicalCp: 2600,
    behavior: 'Pseudoplastic (Shear-Thinning)',
    spindle: 'Brookfield RVT Spindle #3 @ 20 RPM (25°C)',
    notes: 'Classic SLES/LABSA/CAPB wormlike micellar network structured with NaCl.'
  },
  {
    id: 'prem-hand-dishwash-22',
    name: 'Premium High-Active Hand Dishwash (22% Active Surfactant)',
    category: 'Hand Dishwashing Liquid',
    signature: {
      minActiveAnionic: 14.1,
      maxActiveAnionic: 22.0,
      minActiveAmphoteric: 1.5,
      maxActiveAmphoteric: 4.5,
      minSaltPct: 1.0,
      maxSaltPct: 2.0
    },
    viscosityRangeCp: [3000, 4500],
    typicalCp: 3800,
    behavior: 'Pseudoplastic (Shear-Thinning)',
    spindle: 'Brookfield RVT Spindle #3 @ 20 RPM (25°C)',
    notes: 'Dense entangled wormlike micelle network with alkanolamide packing.'
  },
  {
    id: 'std-liquid-hand-soap-10',
    name: 'Standard Liquid Hand Soap / Hand Wash (10% Active)',
    category: 'Liquid Hand Soap',
    signature: {
      minActiveAnionic: 5.5,
      maxActiveAnionic: 10.0,
      minActiveAmphoteric: 1.0,
      maxActiveAmphoteric: 3.0,
      minSaltPct: 1.2,
      maxSaltPct: 2.2
    },
    viscosityRangeCp: [2000, 3000],
    typicalCp: 2400,
    behavior: 'Pseudoplastic (Shear-Thinning)',
    spindle: 'Brookfield RVT Spindle #3 @ 20 RPM (25°C)',
    notes: 'Mild skin-cleansing micellar fluid balanced for standard bottle dispensing pumps.'
  },
  {
    id: 'economy-liquid-cleaner-8',
    name: 'Economy Low-Active Liquid Detergent (8% Active)',
    category: 'Laundry Liquid',
    signature: {
      minActiveAnionic: 4.0,
      maxActiveAnionic: 8.0,
      minActiveAmphoteric: 0.0,
      maxActiveAmphoteric: 1.5,
      minSaltPct: 1.5,
      maxSaltPct: 2.5
    },
    viscosityRangeCp: [800, 1500],
    typicalCp: 1100,
    behavior: 'Pseudoplastic (Shear-Thinning)',
    spindle: 'Brookfield RVT Spindle #2 @ 20 RPM (25°C)',
    notes: 'Moderate self-structuring at low active solids using maximum salt curve build.'
  },
  {
    id: 'hd-liquid-laundry-18',
    name: 'Heavy-Duty Liquid Laundry (HDL) Nonionic/Anionic Rapid-Dispersing',
    category: 'Laundry Liquid',
    signature: {
      minActiveAnionic: 4.0,
      maxActiveAnionic: 12.0,
      minActiveAmphoteric: 0.0,
      maxActiveAmphoteric: 1.0,
      minSaltPct: 0.0,
      maxSaltPct: 0.8
    },
    viscosityRangeCp: [300, 650],
    typicalCp: 450,
    behavior: 'Newtonian',
    spindle: 'Brookfield RVT Spindle #2 @ 20 RPM (25°C)',
    notes: 'Engineered low viscosity for rapid cap dosing and dissolution in washing machine drawers.'
  },
  {
    id: 'water-thin-glass-cleaner',
    name: 'Water-Thin Glass & Multi-Surface Cleaner',
    category: 'Glass Cleaner',
    signature: {
      minActiveAnionic: 0.0,
      maxActiveAnionic: 1.0,
      minActiveAmphoteric: 0.0,
      maxActiveAmphoteric: 0.5,
      minSaltPct: 0.0,
      maxSaltPct: 0.2
    },
    viscosityRangeCp: [1, 10],
    typicalCp: 2,
    behavior: 'Newtonian',
    spindle: 'Brookfield LV Spindle #1 @ 60 RPM (25°C) / Ostwald Capillary',
    notes: 'Water-thin liquid for trigger spray aerosolization without nozzle clogging.'
  }
];

export class ViscosityEngine {
  /**
   * Evaluates comprehensive viscosity, rheological profile, temperature response,
   * and salt curve diagnostics for any formulation.
   */
  public static evaluateViscosity(
    ingredients: FormulationIngredient[] = [],
    options: {
      productCategory?: string;
      targetPH?: number;
      temperatureC?: number;
      activeMatterReport?: any;
    } = {}
  ): ViscosityReport {
    const list = Array.isArray(ingredients) ? ingredients : [];
    const productCategory = (options.productCategory || '').trim();

    // Step 1: Detect Unsupported / Non-Fluid States (Powders, Bars, Tablets)
    const isSolidCategory = 
      /powder|bar|soap bar|tablet|block|dry blend|granule|pellet/i.test(productCategory);
    
    const activeMatterReport = options.activeMatterReport || ActiveMatterEngine.calculateActiveMatterReport(list, 1.0);
    const totalWaterPct = activeMatterReport.totalWaterPct;
    const totalRawPct = activeMatterReport.totalRawPercentage;

    const isAnhydrousOrSolidFormula = 
      isSolidCategory || (totalWaterPct < 5.0 && totalRawPct > 70 && !list.some(i => (i.name || '').toLowerCase().includes('water')));

    if (isAnhydrousOrSolidFormula) {
      return this.createUnsupportedSolidReport(productCategory);
    }

    if (list.length === 0) {
      return this.createWaterBaselineReport();
    }

    // Step 2: Extract Surfactant, Polymer, Electrolyte, and Hydrotrope Contributions
    const factors: ViscosityContributingFactor[] = [];
    const diagnostics: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Evaluate pH for pH-sensitive thickeners (e.g. Carbomers, ASE polyacrylates)
    const normCategory = productCategory ? normalizeProductCategory(productCategory) : undefined;
    const phOpts: PHCalculationOptions | undefined = (normCategory && normCategory !== 'UNKNOWN_PRODUCT_CATEGORY') ? { productCategory: normCategory } : undefined;
    const estimatedPH = options.targetPH ?? (calculatePHAdvanced ? calculatePHAdvanced(list, 100, phOpts).pH : 7.0);

    // Active Surfactant Breakdown
    let activeAnionicPct = 0;
    let activeSlesPct = 0;
    let activeLabsaPct = 0;
    let activeAmphotericPct = 0;
    let activeNonionicPct = 0;
    let activeCationicPct = 0;
    let alkanolamideActivePct = 0;

    // Electrolytes
    let naclPct = 0;
    let totalElectrolytePct = 0;

    // Polymers & Thickeners
    let xanthanPct = 0;
    let hpmcPct = 0;
    let cmcPct = 0;
    let carbomerPct = 0;
    let asePolymerPct = 0;
    let otherPolymerPct = 0;

    // Hydrotropes & Solvents
    let hydrotropePct = 0; // SXS, SCS
    let organicSolventPct = 0; // Ethanol, IPA, Propylene Glycol, Glycerin

    list.forEach(ing => {
      const name = (ing.name || '').toLowerCase();
      const role = (ing.role || '').toLowerCase();
      const cat = (ing.category || '').toLowerCase();
      const rawPct = Number(ing.percentage) || 0;
      if (rawPct <= 0) return;

      const resolution = ActiveMatterEngine.resolveIngredientActive(ing);
      const activePct = (rawPct * resolution.activeMatterPct) / 100;

      // Classify Surfactants
      if (resolution.isSurfactant) {
        if (resolution.surfactantType === 'anionic') {
          activeAnionicPct += activePct;
          if (name.includes('sles') || name.includes('laureth sulfate')) {
            activeSlesPct += activePct;
          } else if (name.includes('labsa') || name.includes('sulfonic') || name.includes('dodecylbenzene')) {
            activeLabsaPct += activePct;
          }
        } else if (resolution.surfactantType === 'amphoteric') {
          activeAmphotericPct += activePct;
        } else if (resolution.surfactantType === 'nonionic') {
          activeNonionicPct += activePct;
          if (name.includes('cdea') || name.includes('cmea') || name.includes('cocamide') || name.includes('alkanolamide')) {
            alkanolamideActivePct += activePct;
          }
        } else if (resolution.surfactantType === 'cationic') {
          activeCationicPct += activePct;
        }
      }

      // Classify Electrolytes
      if (name.includes('chloride') || name.includes('sodium chloride') || name.includes('salt') || name.includes('vacuum salt')) {
        naclPct += rawPct;
        totalElectrolytePct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Inorganic Electrolyte',
          contributionType: 'electrolyte_screen',
          effectDescription: 'Screens anionic headgroup charges, driving spherical-to-wormlike micellar growth.'
        });
      } else if (name.includes('sulfate') && !resolution.isSurfactant && !name.includes('sles') && !name.includes('sls')) {
        totalElectrolytePct += rawPct * 0.8; // Na2SO4 effective ionic strength contribution
        factors.push({
          component: ing.name,
          role: 'Secondary Electrolyte',
          contributionType: 'electrolyte_screen',
          effectDescription: 'Increases ionic strength and promotes counter-ion packing.'
        });
      }

      // Classify Polymers & Thickeners
      if (name.includes('xanthan') || role.includes('xanthan')) {
        xanthanPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Polysaccharide Rheology Modifier',
          contributionType: 'primary_thickener',
          effectDescription: 'Rigid rod entanglement creating high yield stress and strong shear-thinning (pseudoplasticity).'
        });
      } else if (name.includes('hpmc') || name.includes('hydroxypropyl methylcellulose') || name.includes('methocel')) {
        hpmcPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Cellulosic Non-ionic Thickener',
          contributionType: 'primary_thickener',
          effectDescription: 'High-viscosity polymer entanglement, broad salt and pH compatibility.'
        });
      } else if (name.includes('cmc') || name.includes('carboxymethyl cellulose') || name.includes('cellulose gum')) {
        cmcPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Anionic Cellulosic Thickener',
          contributionType: 'primary_thickener',
          effectDescription: 'Polymer hydration network providing anti-redeposition and medium viscosity.'
        });
      } else if (name.includes('carbomer') || name.includes('carbopol') || name.includes('polyacrylate') && !name.includes('copolymer')) {
        carbomerPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Crosslinked Polyacrylate Gel Thickener',
          contributionType: 'primary_thickener',
          effectDescription: 'Electrostatic uncoiling upon alkali neutralization (>pH 6) forming rigid transparent gels.'
        });
      } else if (name.includes('ase') || name.includes('acrysol') || name.includes('acrylates copolymer')) {
        asePolymerPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Alkali-Swellable Emulsion (ASE/HASE)',
          contributionType: 'primary_thickener',
          effectDescription: 'Alkali-activated associative hydrophobic thickening.'
        });
      } else if (cat.includes('thickener') || cat.includes('polymer') || role.includes('thickener')) {
        otherPolymerPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Polymeric Rheology Modifier',
          contributionType: 'primary_thickener',
          effectDescription: 'Polymer macromolecular hydrodynamic volume build.'
        });
      }

      // Classify Hydrotropes & Solvents (Viscosity Thinning)
      if (name.includes('xylene sulfonate') || name.includes('sxs') || name.includes('cumenesulfonate') || name.includes('hydrotrope')) {
        hydrotropePct += activePct;
        factors.push({
          component: ing.name,
          role: 'Hydrotrope / De-Gelling Agent',
          contributionType: 'viscosity_depressant',
          effectDescription: 'Disrupts wormlike micellar entanglement, suppresses liquid crystal gel phases, lowers viscosity.'
        });
      } else if (name.includes('ethanol') || name.includes('isopropanol') || name.includes('ipa') || name.includes('propylene glycol') || name.includes('glycerin') || name.includes('hexylene glycol')) {
        organicSolventPct += rawPct;
        factors.push({
          component: ing.name,
          role: 'Polar Organic Solvent',
          contributionType: 'viscosity_depressant',
          effectDescription: 'Increases medium dielectric constant and depresses micellar clustering.'
        });
      }
    });

    // Step 3: Check for Authoritative / Measured Benchmark Match
    const totalPolymerPct = xanthanPct + hpmcPct + cmcPct + carbomerPct + asePolymerPct + otherPolymerPct;
    const totalDepressantPct = hydrotropePct + 0.6 * organicSolventPct;

    const benchmarkMatch = this.findAuthoritativeBenchmark({
      activeAnionicPct,
      activeAmphotericPct,
      saltPct: totalElectrolytePct,
      hasPolymer: totalPolymerPct > 0,
      hasHydrotrope: hydrotropePct > 0,
      category: productCategory
    });

    let computedViscosityCp = 1.0; // Water baseline at 25°C is 0.89 - 1.0 cPs
    let primaryMechanism: ViscosityMechanism = 'Solvent / Dilute Aqueous';
    let behavior: RheologyBehavior = 'Newtonian';
    let dataSource: ViscosityDataSource = 'model_derived';
    let confidence: ViscosityConfidence = activeMatterReport.ingredientsWithMissingActive > 0 ? 'Low' : 'Medium';

    // Step 4: Mechanistic Model Computation
    const totalActiveSurfactants = activeAnionicPct + activeAmphotericPct + activeNonionicPct + activeCationicPct;

    // A. Polymer Contribution
    let polymerViscosityCp = 0;
    let yieldStressPa = 0;
    let polymerFlowN = 1.0;

    if (totalPolymerPct > 0) {
      if (xanthanPct > 0) {
        // Xanthan Gum: ~2500 cPs at 0.5%, strong pseudoplasticity (n ≈ 0.25), high yield stress
        const xgCp = 2500 * Math.pow(xanthanPct / 0.5, 2.5);
        polymerViscosityCp += xgCp;
        yieldStressPa += Math.min(25, 1.8 * Math.pow(xanthanPct / 0.5, 1.8));
        polymerFlowN = Math.min(polymerFlowN, 0.25);
        diagnostics.push(`Xanthan Gum (${xanthanPct.toFixed(2)}%) imparts ~${Math.round(xgCp)} cPs with high yield stress (${yieldStressPa.toFixed(2)} Pa).`);
      }

      if (hpmcPct > 0) {
        // HPMC 100k cps: ~3400 cPs at 0.5%, n ≈ 0.45
        const hpmcCp = 3400 * Math.pow(hpmcPct / 0.5, 2.3);
        polymerViscosityCp += hpmcCp;
        yieldStressPa += 0.4 * (hpmcPct / 0.5);
        polymerFlowN = Math.min(polymerFlowN, 0.45);
        diagnostics.push(`HPMC 100k (${hpmcPct.toFixed(2)}%) builds ~${Math.round(hpmcCp)} cPs cellulosic viscosity.`);
      }

      if (cmcPct > 0) {
        // CMC Technical: ~1500 cPs at 1.0%, n ≈ 0.55
        const cmcCp = 1500 * Math.pow(cmcPct / 1.0, 2.1);
        polymerViscosityCp += cmcCp;
        yieldStressPa += 0.2 * (cmcPct / 1.0);
        polymerFlowN = Math.min(polymerFlowN, 0.55);
        diagnostics.push(`CMC (${cmcPct.toFixed(2)}%) builds ~${Math.round(cmcCp)} cPs.`);
      }

      if (carbomerPct > 0) {
        // Carbomer 940: Requires pH neutralization (pH 6.0 - 9.0)
        let neutralizationFactor = 0.05; // unneutralized acid coils
        if (estimatedPH >= 6.0 && estimatedPH <= 10.0) {
          neutralizationFactor = 1.0;
        } else if (estimatedPH >= 5.0 && estimatedPH < 6.0) {
          neutralizationFactor = (estimatedPH - 5.0) / 1.0;
        } else if (estimatedPH > 10.0) {
          neutralizationFactor = Math.max(0.2, 1.0 - (estimatedPH - 10.0) * 0.3); // alkali chain degradation
        }

        // Salt sensitivity of Carbomer: excess electrolyte screens carboxylate repulsion
        const saltSuppression = Math.max(0.1, Math.exp(-1.5 * totalElectrolytePct));
        const carbCp = 16000 * Math.pow(carbomerPct / 0.35, 2.2) * neutralizationFactor * saltSuppression;
        polymerViscosityCp += carbCp;
        yieldStressPa += 18.0 * (carbomerPct / 0.35) * neutralizationFactor * saltSuppression;
        polymerFlowN = Math.min(polymerFlowN, 0.20);

        if (neutralizationFactor < 0.5) {
          warnings.push(`Carbomer Inefficient Swelling: Product pH (${estimatedPH.toFixed(1)}) is below the neutralization threshold (pH 6.0 - 8.0). Carbomer coils remain collapsed, producing watery viscosity.`);
          recommendations.push(`Neutralize Carbomer with TEA (Triethanolamine) or NaOH to pH 6.5 - 7.5 to unlock full gel viscosity.`);
        }
        if (totalElectrolytePct > 0.6) {
          warnings.push(`Carbomer Salt Incompatibility: Electrolyte content (${totalElectrolytePct.toFixed(1)}%) screens polyacrylate electrostatic repulsions, collapsing the carbomer gel network.`);
        }
      }

      if (asePolymerPct > 0) {
        const aseNeutralization = estimatedPH >= 6.5 ? 1.0 : Math.max(0.05, (estimatedPH - 4.5) / 2.0);
        const aseCp = 4000 * Math.pow(asePolymerPct / 2.5, 2.0) * aseNeutralization;
        polymerViscosityCp += aseCp;
        polymerFlowN = Math.min(polymerFlowN, 0.35);
      }

      if (otherPolymerPct > 0) {
        const otherCp = 2000 * Math.pow(otherPolymerPct / 1.0, 1.8);
        polymerViscosityCp += otherCp;
      }
    }

    // B. Surfactant-Electrolyte Micellar Rod Model (Salt Curve)
    let micellarViscosityCp = 0;
    let micellarFlowN = 1.0;
    const saltCurveState: SaltCurveState = {
      electrolytePct: Number(totalElectrolytePct.toFixed(2)),
      peakSaltPct: 1.8,
      curveRegion: 'sub_critical',
      saltingOutRisk: false,
      recommendedSaltAdjustment: 'Salt within standard response window.'
    };

    // Heuristic weighting based on engineering assumption of micellar-rod forming capability:
    // - SLES (ethoxylated) is a strong builder (1.0).
    // - LABSA (sulfonic) is a moderate builder (0.6).
    // - Other anionics are 0.4.
    const buildableSurfactantActive = activeSlesPct + 0.6 * activeLabsaPct + 0.4 * (activeAnionicPct - activeSlesPct - activeLabsaPct);
    
    // Heuristic weighting:
    // - Amphoterics (CAPB) are 0.8 (synergy builder).
    // - Alkanolamides (CDEA/CMEA) are 1.5 (synergy builder for rod growth).
    const cosurfactantPackingActive = 0.8 * activeAmphotericPct + 1.5 * alkanolamideActivePct;

    if (buildableSurfactantActive >= 3.0) {
      // Calculate dynamic peak salt threshold based on cosurfactant ratio
      const cosurfRatio = cosurfactantPackingActive / (buildableSurfactantActive + 0.1);
      // High cosurfactant (CAPB/CDEA) shifts salt peak leftwards (e.g. from 2.0% down to 1.4%)
      const peakSalt = Math.max(1.0, Number((2.0 - 0.9 * Math.min(1.0, cosurfRatio)).toFixed(2)));
      saltCurveState.peakSaltPct = peakSalt;

      // Base peak viscosity capacity of the surfactant micellar matrix
      const maxPeakCp = Math.min(6000, 1800 * Math.pow(buildableSurfactantActive / 7.0, 1.8) * (1 + 0.8 * Math.min(1.0, cosurfRatio)));

      const x = totalElectrolytePct / peakSalt;

      if (x < 0.35) {
        // Sub-critical phase
        saltCurveState.curveRegion = 'sub_critical';
        const growthFactor = Math.pow(x / 0.35, 1.5) * 0.12;
        micellarViscosityCp = 15 + (maxPeakCp - 15) * growthFactor;
        micellarFlowN = 1.0 - 0.2 * growthFactor;
        saltCurveState.recommendedSaltAdjustment = `Sub-peak electrolyte (${totalElectrolytePct.toFixed(1)}%). Add NaCl up to ${peakSalt.toFixed(1)}% to increase viscosity.`;
      } else if (x < 0.70) {
        // Growth phase: exponential transition from spherical to wormlike micelles
        saltCurveState.curveRegion = 'growth';
        const growthFactor = 0.12 + 0.68 * Math.pow((x - 0.35) / 0.35, 1.8);
        micellarViscosityCp = 15 + (maxPeakCp - 15) * growthFactor;
        micellarFlowN = 0.85 - 0.35 * ((x - 0.35) / 0.35);
        saltCurveState.recommendedSaltAdjustment = `Active micellar growth phase (${totalElectrolytePct.toFixed(1)}%). Reaching desired peak plateau near ${peakSalt.toFixed(1)}%.`;
      } else if (x <= 1.35) {
        // Peak Plateau region: dense entangled wormlike micelle network
        saltCurveState.curveRegion = 'peak_plateau';
        const plateauFactor = 1.0 - 0.10 * Math.abs(x - 1.0) / 0.35;
        micellarViscosityCp = maxPeakCp * plateauFactor;
        micellarFlowN = 0.45;
        saltCurveState.recommendedSaltAdjustment = `Formulation is sitting in optimal micellar viscosity plateau (${totalElectrolytePct.toFixed(1)}% salt).`;
      } else {
        // Over-salted / Salting-Out / Micellar Branching Collapse region
        saltCurveState.curveRegion = 'over_salted';
        saltCurveState.saltingOutRisk = true;
        const decayExponent = 2.5 * (x - 1.35);
        const collapseFactor = Math.exp(-decayExponent);
        micellarViscosityCp = Math.max(80, maxPeakCp * 0.85 * collapseFactor);
        micellarFlowN = 0.75; // sheared unentangled structures
        saltCurveState.recommendedSaltAdjustment = `Over-salted (${totalElectrolytePct.toFixed(1)}% salt vs peak ${peakSalt.toFixed(1)}%). Reduce salt by ${(totalElectrolytePct - peakSalt).toFixed(1)}% to restore viscosity.`;

        warnings.push(`Viscosity Over-Salting & Salting-Out Hazard: Electrolyte content (${totalElectrolytePct.toFixed(1)}%) exceeds the micellar peak threshold (${peakSalt.toFixed(1)}%). Over-screening causes surfactant dehydration, sudden viscosity collapse, and two-phase stratification.`);
        recommendations.push(`Reduce Sodium Chloride / Sulfate addition to ${peakSalt.toFixed(1)}% and perform a benchtop salt titration curve.`);
      }

      diagnostics.push(`Surfactant micellar system (${buildableSurfactantActive.toFixed(1)}% active buildable, ${cosurfactantPackingActive.toFixed(1)}% cosurfactant) modeled at ${Math.round(micellarViscosityCp)} cPs (Peak salt: ${peakSalt.toFixed(1)}%, Current: ${totalElectrolytePct.toFixed(1)}%).`);
    } else if (totalActiveSurfactants > 0 && totalActiveSurfactants < 3.0) {
      micellarViscosityCp = 5 + totalActiveSurfactants * 3;
      saltCurveState.curveRegion = 'sub_critical';
      saltCurveState.recommendedSaltAdjustment = 'Active surfactant solids too low (<3%) for effective salt-thickening. Use a polymeric thickener (Xanthan, HPMC).';
    }

    // C. Hydrotropic & Solvent Viscosity Suppression
    let solventDampingFactor = 1.0;
    if (totalDepressantPct > 0) {
      solventDampingFactor = Math.max(0.05, Math.exp(-0.45 * hydrotropePct - 0.12 * organicSolventPct));
      diagnostics.push(`Solvents / Hydrotropes (${totalDepressantPct.toFixed(1)}%) apply a ${((1 - solventDampingFactor) * 100).toFixed(0)}% viscosity reduction factor.`);
    }

    // High Surfactant Gel Risk Check (Concentrates > 35% without hydrotropes)
    if (totalActiveSurfactants > 35 && totalDepressantPct < 2.0 && totalWaterPct > 15) {
      warnings.push(`High Surfactant Gelation / Hexagonal Phase Risk: High surfactant solids (${totalActiveSurfactants.toFixed(1)}%) without adequate hydrotropic coupling may form rigid non-pourable liquid crystal gel.`);
      recommendations.push(`Incorporate 2.0% - 4.0% Sodium Xylene Sulfonate (SXS 40%) or Propylene Glycol to maintain isotropic free-flowing liquid state.`);
    }

    // D. Combine Structuring Mechanisms
    if (benchmarkMatch) {
      computedViscosityCp = benchmarkMatch.typicalCp;
      behavior = benchmarkMatch.behavior;
      dataSource = 'reference_baseline';
      confidence = 'High';
      primaryMechanism = benchmarkMatch.hasPolymer ? 'Polymeric Chain Entanglement' : 'Micellar Rod / Salt Curve';
      diagnostics.push(`Matched authoritative benchmark: "${benchmarkMatch.benchmarkName}" (Reference: ${benchmarkMatch.typicalCp} cPs).`);
    } else {
      // Mechanistic synthesis
      if (totalPolymerPct > 0 && micellarViscosityCp > 100) {
        primaryMechanism = 'Mixed Micellar-Polymer Matrix';
        computedViscosityCp = 1.0 + (polymerViscosityCp + micellarViscosityCp * 0.8) * solventDampingFactor;
        behavior = 'Yield Stress Fluid';
        confidence = 'High';
      } else if (totalPolymerPct > 0) {
        primaryMechanism = carbomerPct > 0 ? 'Alkali-Swellable Polymer Gel' : 'Polymeric Chain Entanglement';
        computedViscosityCp = 1.0 + polymerViscosityCp * solventDampingFactor;
        behavior = yieldStressPa > 0.5 ? 'Yield Stress Fluid' : 'Pseudoplastic (Shear-Thinning)';
        confidence = 'High';
      } else if (micellarViscosityCp > 50) {
        primaryMechanism = 'Micellar Rod / Salt Curve';
        computedViscosityCp = 1.0 + micellarViscosityCp * solventDampingFactor;
        behavior = 'Pseudoplastic (Shear-Thinning)';
        confidence = 'High';
      } else {
        primaryMechanism = 'Solvent / Dilute Aqueous';
        computedViscosityCp = Math.max(1.0, 1.0 + (totalActiveSurfactants * 3.5 + organicSolventPct * 1.5) * solventDampingFactor);
        behavior = 'Newtonian';
        confidence = 'Medium';
      }
    }

    // Bound calculated viscosity to physically realistic limits
    computedViscosityCp = Math.max(1.0, Math.min(100000, Number(computedViscosityCp.toFixed(1))));

    // Step 5: Temperature Scaling (Arrhenius Equation)
    // eta(T) = eta_25 * exp( (Ea / R) * (1/T - 1/298.15) )
    const Ea_J_mol = totalPolymerPct > 0 ? 18000 : 25000; // Activation energy in J/mol
    const R = 8.314; // J/(mol.K)
    const T_ref = 298.15; // 25°C in Kelvin
    const T_4C = 277.15;  // 4°C
    const T_40C = 313.15; // 40°C

    const temp4C_Cp = Math.round(computedViscosityCp * Math.exp((Ea_J_mol / R) * (1 / T_4C - 1 / T_ref)));
    const temp40C_Cp = Math.round(computedViscosityCp * Math.exp((Ea_J_mol / R) * (1 / T_40C - 1 / T_ref)));

    const coldGelRisk = temp4C_Cp > 8000 && computedViscosityCp < 3500;
    const hotThinningRisk = temp40C_Cp < 500 && computedViscosityCp >= 1200;

    if (hotThinningRisk) {
      warnings.push(`Thermal Viscosity Thinning: Viscosity drops to ~${temp40C_Cp} cPs at 40°C. In hot climates, consumer perceived quality and suspension may be compromised.`);
    }

    const temperatureProfile: TemperatureViscosityProfile = {
      temp4C_Cp,
      temp25C_Cp: Math.round(computedViscosityCp),
      temp40C_Cp,
      activationEnergyKjMol: Number((Ea_J_mol / 1000).toFixed(1)),
      coldGelRisk,
      hotThinningRisk
    };

    // Step 6: Shear Rate Profile
    const overallFlowN = Math.min(polymerFlowN, micellarFlowN);
    const zeroShearCp = Math.round(computedViscosityCp * (1 + (1.0 - overallFlowN) * 2.5) + yieldStressPa * 100);
    const highShearCp = Math.round(computedViscosityCp * Math.pow(100 / 20, overallFlowN - 1.0));

    let recommendedSpindle = 'Brookfield RVT Spindle #1 @ 20 RPM';
    if (computedViscosityCp > 20000) recommendedSpindle = 'Brookfield RVT Spindle #7 @ 10 RPM';
    else if (computedViscosityCp > 8000) recommendedSpindle = 'Brookfield RVT Spindle #5 @ 20 RPM';
    else if (computedViscosityCp > 3500) recommendedSpindle = 'Brookfield RVT Spindle #4 @ 20 RPM';
    else if (computedViscosityCp > 1500) recommendedSpindle = 'Brookfield RVT Spindle #3 @ 20 RPM';
    else if (computedViscosityCp > 400) recommendedSpindle = 'Brookfield RVT Spindle #2 @ 20 RPM';
    else recommendedSpindle = 'Brookfield LV Spindle #1 @ 60 RPM';

    const shearProfile: ShearRateProfile = {
      zeroShearViscosityCp: zeroShearCp,
      mediumShearViscosityCp: Math.round(computedViscosityCp),
      highShearViscosityCp: highShearCp,
      flowIndexN: Number(overallFlowN.toFixed(2)),
      yieldStressPa: Number(yieldStressPa.toFixed(2)),
      recommendedSpindle
    };

    // Step 7: Derive Qualitative Rating & Ranges
    let rating: ViscosityRating = 'Medium';
    let rangeMin = Math.round(computedViscosityCp * 0.85);
    let rangeMax = Math.round(computedViscosityCp * 1.15);

    if (saltCurveState.saltingOutRisk) {
      rating = 'Over-Salted / Phase Separation Risk';
    } else if (computedViscosityCp < 50) {
      rating = 'Water-Thin';
      rangeMin = 1;
      rangeMax = Math.max(10, Math.round(computedViscosityCp * 1.3));
    } else if (computedViscosityCp < 600) {
      rating = 'Low';
    } else if (computedViscosityCp < 1800) {
      rating = 'Medium';
    } else if (computedViscosityCp <= 4500) {
      rating = 'Standard Liquid Detergent';
    } else if (computedViscosityCp <= 15000) {
      rating = 'Rich Gel';
    } else {
      rating = 'High Viscosity Paste';
    }

    const viscosityRange = `${rangeMin} - ${rangeMax} cPs`;

    return {
      viscosityCp: Math.round(computedViscosityCp),
      estViscosityCps: Math.round(computedViscosityCp),
      viscosityRange,
      rating,
      confidence,
      dataSource,
      behavior,
      mechanism: primaryMechanism,
      isFluid: true,
      shearProfile,
      temperatureProfile,
      saltCurve: saltCurveState,
      authoritativeMatch: benchmarkMatch ? {
        benchmarkId: benchmarkMatch.id,
        benchmarkName: benchmarkMatch.benchmarkName,
        referenceViscosityMinCp: benchmarkMatch.viscosityRangeCp[0],
        referenceViscosityMaxCp: benchmarkMatch.viscosityRangeCp[1],
        referenceViscosityTypicalCp: benchmarkMatch.typicalCp,
        referenceTemperatureC: 25,
        spindleRpm: benchmarkMatch.spindle,
        notes: benchmarkMatch.notes
      } : undefined,
      contributingFactors: factors,
      diagnostics,
      warnings,
      recommendations,
      assumedShearRate: '~20 s^-1 (Standard Brookfield RVT @ 20 RPM)',
      modelMaturity: benchmarkMatch ? 'REFERENCE_BASELINE' : 'SEMI_EMPIRICAL_SCREENING',
      applicabilityDomain: 'Aqueous fluid surfactant formulations at 4°C to 40°C',
      limitations: [
        'Single scalar viscosity assumes standard test shear rate condition (~20 s^-1 / Brookfield RVT @ 20 RPM at 25°C).',
        'Pseudoplastic fluids thin under high pouring/dispensing shear (~100 s^-1); see shearProfile for power-law response.',
        'Accurate peak salt curve prediction requires surfactant-grade-specific electrolyte calibration.'
      ],
      uncertainty: {
        level: confidence === 'High' ? 'Low' : confidence === 'Medium' ? 'Medium' : 'High',
        factors: [
          ...diagnostics.filter(d => d.includes('cPs')),
          ...warnings
        ]
      }
    };
  }

  /**
   * Helper to match authoritative calibrated formulation benchmarks.
   */
  private static findAuthoritativeBenchmark(params: {
    activeAnionicPct: number;
    activeAmphotericPct: number;
    saltPct: number;
    hasPolymer: boolean;
    hasHydrotrope: boolean;
    category: string;
  }) {
    if (params.hasPolymer || params.hasHydrotrope) return null; // Polymers and hydrotropes use mechanistic continuum
    if (!params.category) return null; // Require category context for benchmark binding

    for (const b of AUTHORITATIVE_VISCOSITY_BENCHMARKS) {
      const catMatch = 
        b.category.toLowerCase() === params.category.toLowerCase() ||
        params.category.toLowerCase().includes(b.category.toLowerCase()) ||
        b.category.toLowerCase().includes(params.category.toLowerCase());

      const anionicMatch = params.activeAnionicPct >= b.signature.minActiveAnionic && 
                           params.activeAnionicPct <= b.signature.maxActiveAnionic;
      const amphoMatch = params.activeAmphotericPct >= b.signature.minActiveAmphoteric && 
                         params.activeAmphotericPct <= b.signature.maxActiveAmphoteric;
      const saltMatch = params.saltPct >= b.signature.minSaltPct && 
                        params.saltPct <= b.signature.maxSaltPct;

      if (catMatch && anionicMatch && amphoMatch && saltMatch) {
        return {
          id: b.id,
          benchmarkName: b.name,
          typicalCp: b.typicalCp,
          viscosityRangeCp: b.viscosityRangeCp,
          behavior: b.behavior,
          spindle: b.spindle,
          notes: b.notes,
          hasPolymer: false
        };
      }
    }
    return null;
  }

  /**
   * Generates a baseline report for pure water.
   */
  private static createWaterBaselineReport(): ViscosityReport {
    return {
      viscosityCp: 1,
      estViscosityCps: 1,
      viscosityRange: '1 - 5 cPs',
      rating: 'Water-Thin',
      confidence: 'High',
      dataSource: 'reference_baseline',
      modelMaturity: 'REFERENCE_BASELINE',
      behavior: 'Newtonian',
      mechanism: 'Solvent / Dilute Aqueous',
      isFluid: true,
      shearProfile: {
        zeroShearViscosityCp: 1,
        mediumShearViscosityCp: 1,
        highShearViscosityCp: 1,
        flowIndexN: 1.0,
        yieldStressPa: 0.0,
        recommendedSpindle: 'Brookfield LV Spindle #1 @ 60 RPM'
      },
      temperatureProfile: {
        temp4C_Cp: 2,
        temp25C_Cp: 1,
        temp40C_Cp: 1,
        activationEnergyKjMol: 16.0,
        coldGelRisk: false,
        hotThinningRisk: false
      },
      saltCurve: {
        electrolytePct: 0,
        peakSaltPct: 1.8,
        curveRegion: 'sub_critical',
        saltingOutRisk: false,
        recommendedSaltAdjustment: 'Pure aqueous baseline.'
      },
      contributingFactors: [],
      diagnostics: ['Baseline pure water solvent evaluated at 25°C (1.0 cPs).'],
      warnings: [],
      recommendations: []
    };
  }

  /**
   * Generates an unsupported report for solid/powder/non-fluid formulations.
   */
  private static createUnsupportedSolidReport(category: string): ViscosityReport {
    return {
      viscosityCp: 0,
      estViscosityCps: 0,
      viscosityRange: 'N/A (Solid / Powder)',
      rating: 'Not Applicable (Solid / Powder)',
      confidence: 'Unsupported',
      dataSource: 'unsupported',
      behavior: 'Unsupported (Dry Powder / Solid)',
      mechanism: 'Unsupported Solid / Powder',
      isFluid: false,
      shearProfile: {
        zeroShearViscosityCp: 0,
        mediumShearViscosityCp: 0,
        highShearViscosityCp: 0,
        flowIndexN: 1.0,
        yieldStressPa: 0.0,
        recommendedSpindle: 'N/A (Solid state; evaluate Bulk Density / Flowability instead)'
      },
      temperatureProfile: {
        temp4C_Cp: 0,
        temp25C_Cp: 0,
        temp40C_Cp: 0,
        activationEnergyKjMol: 0,
        coldGelRisk: false,
        hotThinningRisk: false
      },
      saltCurve: {
        electrolytePct: 0,
        peakSaltPct: 0,
        curveRegion: 'sub_critical',
        saltingOutRisk: false,
        recommendedSaltAdjustment: 'Not applicable to powder/solid matrices.'
      },
      contributingFactors: [],
      diagnostics: [`Viscosity is not applicable to solid/powder formulation state (${category || 'Powder'}).`],
      warnings: [],
      recommendations: []
    };
  }
}

/**
 * Functional export alias for calculators & component consumers.
 */
export function calculateDetailedViscosity(
  ingredients: FormulationIngredient[] = [],
  options: { productCategory?: string; targetPH?: number; temperatureC?: number } = {}
): ViscosityReport {
  return ViscosityEngine.evaluateViscosity(ingredients, options);
}

export interface SaltCurvePoint {
  saltPct: number;
  viscosityCp: number;
  region: 'sub_critical' | 'growth' | 'peak_plateau' | 'over_salted';
}

export interface SaltCurveAnalysis {
  points: SaltCurvePoint[];
  peakSaltPct: number;
  maxViscosityCp: number;
  currentSaltPct: number;
  currentViscosityCp: number;
  state: SaltCurveState;
}

/**
 * Authoritative Salt-Curve Rheology Calculator.
 * Generates an electrolyte titration response curve (0% to 4.0% NaCl)
 * using the validated micellar entanglement physics model.
 */
export function calculateSaltCurve(
  ingredients: FormulationIngredient[] = [],
  options: { minSalt?: number; maxSalt?: number; steps?: number; targetPH?: number } = {}
): SaltCurveAnalysis {
  const minSalt = options.minSalt ?? 0.0;
  const maxSalt = options.maxSalt ?? 4.0;
  const steps = options.steps ?? 20;
  const targetPH = options.targetPH ?? 7.0;

  const baseIngredients = ingredients.filter(i => {
    const n = (i?.name || '').toLowerCase();
    return !n.includes('sodium chloride') && !n.includes('salt') && !n.includes('nacl');
  });

  const baseReport = ViscosityEngine.evaluateViscosity(ingredients, { targetPH });
  const peakSaltPct = baseReport.saltCurve.peakSaltPct;
  const currentSaltPct = baseReport.saltCurve.electrolytePct;
  const currentViscosityCp = baseReport.viscosityCp;

  const points: SaltCurvePoint[] = [];
  let maxViscosityCp = 0;

  for (let i = 0; i <= steps; i++) {
    const saltPct = Number((minSalt + (i / steps) * (maxSalt - minSalt)).toFixed(2));
    const testIngredients: FormulationIngredient[] = [
      ...baseIngredients,
      { name: 'Sodium Chloride (Salt)', percentage: saltPct, role: 'Electrolyte Thickener' } as any
    ];
    const report = ViscosityEngine.evaluateViscosity(testIngredients, { targetPH });
    if (report.viscosityCp > maxViscosityCp) {
      maxViscosityCp = report.viscosityCp;
    }
    points.push({
      saltPct,
      viscosityCp: report.viscosityCp,
      region: report.saltCurve.curveRegion
    });
  }

  return {
    points,
    peakSaltPct,
    maxViscosityCp,
    currentSaltPct,
    currentViscosityCp,
    state: baseReport.saltCurve
  };
}


/**
 * ============================================================================
 * PRODUCT-SPECIFIC SCIENTIFIC PROFILE REGISTRY (Phase 2 Master Architecture)
 * ============================================================================
 *
 * Deterministic mapping of the 13 canonical Product Categories to their
 * specialized scientific profiles, applicable calculation engines, validation
 * domains, performance metrics, and formulation policies.
 *
 * Distinct chemical regimes and product functions are separated from physical form.
 * ============================================================================
 */

import { ProductCategoryId, PhysicalForm, normalizeProductCategory, resolveProductSubclass } from './productTaxonomy';

export type ScientificEngineId =
  | 'PH_ENGINE'
  | 'HLB_ENGINE'
  | 'ACTIVE_MATTER_ENGINE'
  | 'VISCOSITY_ENGINE'
  | 'POWDER_ENGINE'
  | 'CLEANING_PERFORMANCE_ENGINE'
  | 'COMPATIBILITY_ENGINE'
  | 'CHELATOR_ENGINE'
  | 'DENSITY_ENGINE'
  | 'DILUTION_ENGINE'
  | 'LAB_HEALTH_ENGINE'
  | 'GRADE_ENGINE'
  | 'SPECIFICATION_ENGINE'
  | 'EXPERT_REASONING_ENGINE'
  | 'COSTING_ENGINE';

export type PerformanceDomain =
  | 'detergency'
  | 'grease_cutting'
  | 'soil_suspension'
  | 'foam_generation'
  | 'foam_retention'
  | 'low_foam_sheeting'
  | 'spotting_prevention'
  | 'viscosity_cling'
  | 'surface_lubricity'
  | 'streak_free_drying'
  | 'skin_mildness'
  | 'scale_removal'
  | 'disinfection'
  | 'antistatic_softening'
  | 'hard_water_tolerance'
  | 'alkalinity_saponification'
  | 'enzyme_stability'
  | 'powder_flow_density'
  | 'rinseability';

export type ValidationDomain =
  | 'ph_stability'
  | 'ionic_compatibility'
  | 'preservative_efficacy'
  | 'viscosity_stability'
  | 'water_hardness'
  | 'caustic_hazard'
  | 'skin_irritation'
  | 'phase_separation'
  | 'powder_caking'
  | 'oxidizer_enzyme_clash'
  | 'film_residue'
  | 'surface_corrosion'
  | 'low_foam_enforcement';

export type SurfactantTypePreference =
  | 'ANIONIC_DOMINANT'
  | 'NONIONIC_DOMINANT'
  | 'CATIONIC_DOMINANT'
  | 'AMPHOTERIC_BALANCED'
  | 'LOW_SURFACTANT'
  | 'NONIONIC_LOW_FOAM';

export interface CalculationPolicy {
  requiresPowderCalculations: boolean;
  requiresViscositySaltCurve: boolean;
  requiresHLBAnalysis: boolean;
  requiresChelationHardness: boolean;
  requiresSkinSafetyMetrics: boolean;
  requiresStreakResidueMetrics: boolean;
  requiresClingRheology: boolean;
  requiresFabricSofteningMetrics: boolean;
  requiresLowFoamDeaeration: boolean;
  surfactantPreference: SurfactantTypePreference;
  targetPHRange: { min: number; max: number; optimal: number };
  activeSurfactantRange: { min: number; max: number; optimal: number };
  targetViscosityCP?: { min: number; max: number; optimal: number };
  maxTotalActiveSurfactantPct?: number;
  minTotalActiveSurfactantPct?: number;
  allowAnionicSurfactants: boolean;
  allowCationicSurfactants: boolean;
}

export interface ScientificProductProfile {
  categoryId: ProductCategoryId;
  subProfileId?: string;
  label: string;
  physicalForm: PhysicalForm;
  applicableEngines: ScientificEngineId[];
  primaryPerformanceDomains: PerformanceDomain[];
  validationDomains: ValidationDomain[];
  specificationProfileId: string;
  compatibilityProfileId: string;
  calculationPolicy: CalculationPolicy;
  scientificNotes: string;
}

/**
 * Authoritative Registry of all 13 Canonical Product Scientific Profiles
 */
export const SCIENTIFIC_PRODUCT_PROFILES: Record<ProductCategoryId, ScientificProductProfile> = {
  LAUNDRY_LIQUID: {
    categoryId: 'LAUNDRY_LIQUID',
    label: 'Liquid Laundry',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'detergency',
      'soil_suspension',
      'grease_cutting',
      'foam_generation',
      'hard_water_tolerance',
      'enzyme_stability',
      'rinseability'
    ],
    validationDomains: [
      'ph_stability',
      'ionic_compatibility',
      'preservative_efficacy',
      'viscosity_stability',
      'water_hardness',
      'oxidizer_enzyme_clash',
      'phase_separation'
    ],
    specificationProfileId: 'SPEC_LAUNDRY_LIQUID',
    compatibilityProfileId: 'COMPAT_LAUNDRY_LIQUID',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: true,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'ANIONIC_DOMINANT',
      targetPHRange: { min: 7.5, max: 9.5, optimal: 8.5 },
      activeSurfactantRange: { min: 10, max: 25, optimal: 16 },
      targetViscosityCP: { min: 500, max: 1500, optimal: 900 },
      minTotalActiveSurfactantPct: 8,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Liquid laundry detergent system balancing anionic-nonionic detergency, soil suspension polymers, builder chelation, and enzyme stability.'
  },

  LAUNDRY_POWDER: {
    categoryId: 'LAUNDRY_POWDER',
    label: 'Powder Laundry',
    physicalForm: 'POWDER',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'POWDER_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'detergency',
      'alkalinity_saponification',
      'hard_water_tolerance',
      'soil_suspension',
      'powder_flow_density',
      'foam_generation'
    ],
    validationDomains: [
      'powder_caking',
      'caustic_hazard',
      'water_hardness',
      'ionic_compatibility',
      'surface_corrosion'
    ],
    specificationProfileId: 'SPEC_LAUNDRY_POWDER',
    compatibilityProfileId: 'COMPAT_LAUNDRY_POWDER',
    calculationPolicy: {
      requiresPowderCalculations: true,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: false,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'ANIONIC_DOMINANT',
      targetPHRange: { min: 9.5, max: 11.5, optimal: 10.5 },
      activeSurfactantRange: { min: 10, max: 22, optimal: 15 },
      minTotalActiveSurfactantPct: 8,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Granular powder detergent utilizing alkaline builder reserve (Soda Ash / STPP / Zeolite), active surfactant adsorption, and moisture control to prevent caking.'
  },

  DISHWASH_MANUAL: {
    categoryId: 'DISHWASH_MANUAL',
    label: 'Manual Dishwash',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'grease_cutting',
      'foam_generation',
      'foam_retention',
      'skin_mildness',
      'rinseability'
    ],
    validationDomains: [
      'ph_stability',
      'skin_irritation',
      'viscosity_stability',
      'ionic_compatibility',
      'preservative_efficacy'
    ],
    specificationProfileId: 'SPEC_DISHWASH_MANUAL',
    compatibilityProfileId: 'COMPAT_DISHWASH_MANUAL',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: true,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: true,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'ANIONIC_DOMINANT',
      targetPHRange: { min: 6.0, max: 8.0, optimal: 6.8 },
      activeSurfactantRange: { min: 12, max: 28, optimal: 20 },
      targetViscosityCP: { min: 1200, max: 3000, optimal: 2000 },
      minTotalActiveSurfactantPct: 10,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'High-active surfactant system (LABSA/SLES + CAPB/Amine Oxide) engineered for dense foam longevity, triglyceride emulsification, and hand skin barrier preservation.'
  },

  DISHWASH_AUTOMATIC: {
    categoryId: 'DISHWASH_AUTOMATIC',
    label: 'Automatic Dishwasher',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'grease_cutting',
      'low_foam_sheeting',
      'spotting_prevention',
      'alkalinity_saponification',
      'enzyme_stability',
      'hard_water_tolerance'
    ],
    validationDomains: [
      'low_foam_enforcement',
      'surface_corrosion',
      'water_hardness',
      'oxidizer_enzyme_clash',
      'ph_stability'
    ],
    specificationProfileId: 'SPEC_DISHWASH_AUTOMATIC',
    compatibilityProfileId: 'COMPAT_DISHWASH_AUTOMATIC',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: true,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: true,
      surfactantPreference: 'NONIONIC_LOW_FOAM',
      targetPHRange: { min: 8.5, max: 11.5, optimal: 10.0 },
      activeSurfactantRange: { min: 2, max: 10, optimal: 6 },
      minTotalActiveSurfactantPct: 2,
      maxTotalActiveSurfactantPct: 12,
      allowAnionicSurfactants: false,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Mechanical wash formulation requiring strict low-foam/defoaming nonionics (EO/PO block copolymers), high builder reserve, and glass corrosion inhibitors. High-foaming anionics strictly prohibited.'
  },

  FLOOR_CLEANER: {
    categoryId: 'FLOOR_CLEANER',
    label: 'Floor Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'detergency',
      'streak_free_drying',
      'soil_suspension',
      'rinseability'
    ],
    validationDomains: [
      'film_residue',
      'ph_stability',
      'preservative_efficacy',
      'ionic_compatibility'
    ],
    specificationProfileId: 'SPEC_FLOOR_CLEANER',
    compatibilityProfileId: 'COMPAT_FLOOR_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: true,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 6.5, max: 9.5, optimal: 7.5 },
      activeSurfactantRange: { min: 3, max: 8, optimal: 5 },
      targetViscosityCP: { min: 10, max: 200, optimal: 50 },
      minTotalActiveSurfactantPct: 2,
      maxTotalActiveSurfactantPct: 10,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Hard surface mop detergent formulated for fast flash-off drying with zero tacky polymer residue and surface safety across tile, sealed wood, and stone.'
  },

  MULTIPURPOSE_CLEANER: {
    categoryId: 'MULTIPURPOSE_CLEANER',
    label: 'Multipurpose Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'detergency',
      'grease_cutting',
      'streak_free_drying',
      'rinseability'
    ],
    validationDomains: [
      'ph_stability',
      'film_residue',
      'preservative_efficacy',
      'ionic_compatibility'
    ],
    specificationProfileId: 'SPEC_MULTIPURPOSE_CLEANER',
    compatibilityProfileId: 'COMPAT_MULTIPURPOSE_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: true,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 7.0, max: 10.0, optimal: 8.5 },
      activeSurfactantRange: { min: 4, max: 10, optimal: 6 },
      targetViscosityCP: { min: 10, max: 150, optimal: 30 },
      minTotalActiveSurfactantPct: 3,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Spray-and-wipe surface formulation coupling nonionic ethoxylates/glucosides with mild solvent couplers for all-around grease and grime cutting.'
  },

  TOILET_CLEANER: {
    categoryId: 'TOILET_CLEANER',
    label: 'Toilet Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'DENSITY_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'scale_removal',
      'viscosity_cling',
      'disinfection',
      'rinseability'
    ],
    validationDomains: [
      'ph_stability',
      'surface_corrosion',
      'viscosity_stability',
      'caustic_hazard'
    ],
    specificationProfileId: 'SPEC_TOILET_CLEANER',
    compatibilityProfileId: 'COMPAT_TOILET_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: false,
      requiresChelationHardness: false,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: true,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'AMPHOTERIC_BALANCED',
      targetPHRange: { min: 1.0, max: 2.5, optimal: 1.5 },
      activeSurfactantRange: { min: 2, max: 6, optimal: 3.5 },
      targetViscosityCP: { min: 600, max: 1800, optimal: 1100 },
      minTotalActiveSurfactantPct: 1.5,
      allowAnionicSurfactants: false,
      allowCationicSurfactants: true
    },
    scientificNotes:
      'High-acid descaling formulation (HCl or organic sulfamic/citric acid) thickened with amine ethoxylates / polymers for vertical surface dwell time and uric salt dissolution.'
  },

  BATHROOM_CLEANER: {
    categoryId: 'BATHROOM_CLEANER',
    label: 'Bathroom Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'scale_removal',
      'viscosity_cling',
      'soil_suspension',
      'rinseability'
    ],
    validationDomains: [
      'ph_stability',
      'viscosity_stability',
      'ionic_compatibility',
      'preservative_efficacy'
    ],
    specificationProfileId: 'SPEC_BATHROOM_CLEANER',
    compatibilityProfileId: 'COMPAT_BATHROOM_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: true,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 2.0, max: 4.0, optimal: 3.0 },
      activeSurfactantRange: { min: 3, max: 8, optimal: 5 },
      targetViscosityCP: { min: 100, max: 600, optimal: 300 },
      minTotalActiveSurfactantPct: 2.5,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Targeted acidic cleaner for dissolving insoluble calcium soap scum (calcium stearate) and water scale on sanitary porcelain, ceramic tiles, and chrome fixtures.'
  },

  GLASS_CLEANER: {
    categoryId: 'GLASS_CLEANER',
    label: 'Glass / Window Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'streak_free_drying',
      'grease_cutting',
      'rinseability'
    ],
    validationDomains: [
      'film_residue',
      'ph_stability',
      'preservative_efficacy'
    ],
    specificationProfileId: 'SPEC_GLASS_CLEANER',
    compatibilityProfileId: 'COMPAT_GLASS_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: false,
      requiresChelationHardness: false,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: true,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'LOW_SURFACTANT',
      targetPHRange: { min: 8.5, max: 10.5, optimal: 9.5 },
      activeSurfactantRange: { min: 0.5, max: 2.5, optimal: 1.2 },
      targetViscosityCP: { min: 1, max: 25, optimal: 5 },
      maxTotalActiveSurfactantPct: 3.0,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Fast-drying volatile solvent coupling formula strictly limiting non-volatile surfactant solids under 2.5% to ensure 100% streak-free glass clarity.'
  },

  FABRIC_SOFTENER: {
    categoryId: 'FABRIC_SOFTENER',
    label: 'Fabric Softener',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'COMPATIBILITY_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'antistatic_softening',
      'viscosity_cling',
      'rinseability'
    ],
    validationDomains: [
      'ionic_compatibility',
      'ph_stability',
      'viscosity_stability',
      'preservative_efficacy',
      'phase_separation'
    ],
    specificationProfileId: 'SPEC_FABRIC_SOFTENER',
    compatibilityProfileId: 'COMPAT_FABRIC_SOFTENER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: false,
      requiresChelationHardness: false,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: true,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'CATIONIC_DOMINANT',
      targetPHRange: { min: 2.5, max: 4.5, optimal: 3.5 },
      activeSurfactantRange: { min: 4, max: 15, optimal: 8 },
      targetViscosityCP: { min: 50, max: 400, optimal: 150 },
      minTotalActiveSurfactantPct: 4,
      allowAnionicSurfactants: false,
      allowCationicSurfactants: true
    },
    scientificNotes:
      'Cationic esterquat quaternary ammonium vesicle dispersion maintained in an acidic matrix (pH 3.0-4.0) for fiber lubrication and static dissipation. Strictly incompatible with anionic surfactants.'
  },

  HAND_WASH: {
    categoryId: 'HAND_WASH',
    label: 'Hand Wash',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'skin_mildness',
      'foam_generation',
      'foam_retention',
      'detergency',
      'rinseability'
    ],
    validationDomains: [
      'skin_irritation',
      'ph_stability',
      'viscosity_stability',
      'preservative_efficacy',
      'ionic_compatibility'
    ],
    specificationProfileId: 'SPEC_HAND_WASH',
    compatibilityProfileId: 'COMPAT_HAND_WASH',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: true,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: true,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'AMPHOTERIC_BALANCED',
      targetPHRange: { min: 5.0, max: 6.8, optimal: 6.0 },
      activeSurfactantRange: { min: 8, max: 16, optimal: 12 },
      targetViscosityCP: { min: 1500, max: 3500, optimal: 2400 },
      minTotalActiveSurfactantPct: 7,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Dermatological cleansing liquid matching skin acid mantle (pH 5.5-6.5) with rich creamy foam and emollient humectants (Glycerin/Betaine) for barrier protection.'
  },

  KITCHEN_DEGREASER: {
    categoryId: 'KITCHEN_DEGREASER',
    label: 'Kitchen Degreaser',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'alkalinity_saponification',
      'grease_cutting',
      'detergency',
      'hard_water_tolerance',
      'rinseability'
    ],
    validationDomains: [
      'caustic_hazard',
      'ph_stability',
      'surface_corrosion',
      'ionic_compatibility'
    ],
    specificationProfileId: 'SPEC_KITCHEN_DEGREASER',
    compatibilityProfileId: 'COMPAT_KITCHEN_DEGREASER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 11.0, max: 13.8, optimal: 12.5 },
      activeSurfactantRange: { min: 8, max: 18, optimal: 14 },
      targetViscosityCP: { min: 20, max: 300, optimal: 80 },
      minTotalActiveSurfactantPct: 6,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'High-alkaline saponifying degreaser combining caustic alkali/silicates with penetrating glycol ethers for polymerized oil and grease breakdown.'
  },

  CAR_SHAMPOO: {
    categoryId: 'CAR_SHAMPOO',
    label: 'Car Shampoo',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'LAB_HEALTH_ENGINE',
      'GRADE_ENGINE',
      'SPECIFICATION_ENGINE',
      'EXPERT_REASONING_ENGINE',
      'COSTING_ENGINE'
    ],
    primaryPerformanceDomains: [
      'surface_lubricity',
      'foam_generation',
      'foam_retention',
      'detergency',
      'spotting_prevention',
      'rinseability'
    ],
    validationDomains: [
      'ph_stability',
      'film_residue',
      'viscosity_stability',
      'ionic_compatibility',
      'preservative_efficacy'
    ],
    specificationProfileId: 'SPEC_CAR_SHAMPOO',
    compatibilityProfileId: 'COMPAT_CAR_SHAMPOO',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: true,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: true,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'ANIONIC_DOMINANT',
      targetPHRange: { min: 6.5, max: 8.0, optimal: 7.2 },
      activeSurfactantRange: { min: 8, max: 18, optimal: 14 },
      targetViscosityCP: { min: 800, max: 2200, optimal: 1400 },
      minTotalActiveSurfactantPct: 6,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'High-lubricity pH-neutral foam vehicle wash delivering high slickness to encapsulate road grit without stripping protective carnauba wax or ceramic sealants.'
  }
};

/**
 * Phase 2 Specialized Scientific Sub-Profiles
 * Authoritative scientific profiles for distinct product chemical regimes within canonical categories.
 */
export const SCIENTIFIC_SUB_PROFILES: Record<string, ScientificProductProfile> = {
  DISHWASH_AUTO_RINSE_AID: {
    categoryId: 'DISHWASH_AUTOMATIC',
    subProfileId: 'DISHWASH_AUTO_RINSE_AID',
    label: 'Automatic Dishwasher Rinse Aid & Sheeting Agent',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'CHELATOR_ENGINE',
      'DENSITY_ENGINE',
      'DILUTION_ENGINE',
      'SPECIFICATION_ENGINE'
    ],
    primaryPerformanceDomains: [
      'low_foam_sheeting',
      'spotting_prevention',
      'scale_removal',
      'rinseability'
    ],
    validationDomains: [
      'low_foam_enforcement',
      'ph_stability',
      'film_residue'
    ],
    specificationProfileId: 'SPEC_DISHWASH_AUTO_RINSE_AID',
    compatibilityProfileId: 'COMPAT_DISHWASH_AUTOMATIC',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: true,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: true,
      surfactantPreference: 'NONIONIC_LOW_FOAM',
      targetPHRange: { min: 2.0, max: 4.0, optimal: 2.8 },
      activeSurfactantRange: { min: 8, max: 20, optimal: 15 },
      targetViscosityCP: { min: 5, max: 50, optimal: 15 },
      minTotalActiveSurfactantPct: 8,
      maxTotalActiveSurfactantPct: 22,
      allowAnionicSurfactants: false,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Acidic non-foaming rinse aid and sheeting agent utilizing low-foaming EO/PO block copolymer nonionics with organic acid builders (citric acid) to prevent water-spotting and scale deposition.'
  },

  TOILET_CLEANER_MINERAL_ACID: {
    categoryId: 'TOILET_CLEANER',
    subProfileId: 'TOILET_CLEANER_MINERAL_ACID',
    label: 'Mineral Acid Heavy Descaling Toilet Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'SPECIFICATION_ENGINE'
    ],
    primaryPerformanceDomains: ['scale_removal', 'viscosity_cling', 'disinfection'],
    validationDomains: ['surface_corrosion', 'viscosity_stability', 'caustic_hazard'],
    specificationProfileId: 'SPEC_TOILET_CLEANER_MINERAL_ACID',
    compatibilityProfileId: 'COMPAT_TOILET_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: false,
      requiresChelationHardness: false,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: true,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'AMPHOTERIC_BALANCED',
      targetPHRange: { min: 0.0, max: 1.5, optimal: 0.5 },
      activeSurfactantRange: { min: 1.0, max: 4.0, optimal: 2.0 },
      targetViscosityCP: { min: 200, max: 800, optimal: 400 },
      minTotalActiveSurfactantPct: 1.0,
      allowAnionicSurfactants: false,
      allowCationicSurfactants: true
    },
    scientificNotes:
      'Heavy mineral acid (8-10% HCl) descaler thickened with acid-stable tallow amine ethoxylates / amine oxides for rapid dissolution of stubborn uric and calcium scale with corrosion inhibition.'
  },

  TOILET_CLEANER_ORGANIC_ACID: {
    categoryId: 'TOILET_CLEANER',
    subProfileId: 'TOILET_CLEANER_ORGANIC_ACID',
    label: 'Eco Organic Acid Toilet Bowl Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'SPECIFICATION_ENGINE'
    ],
    primaryPerformanceDomains: ['scale_removal', 'viscosity_cling', 'disinfection'],
    validationDomains: ['ph_stability', 'viscosity_stability'],
    specificationProfileId: 'SPEC_TOILET_CLEANER_ORGANIC_ACID',
    compatibilityProfileId: 'COMPAT_TOILET_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: false,
      requiresChelationHardness: false,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: true,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 1.5, max: 3.0, optimal: 2.0 },
      activeSurfactantRange: { min: 2.0, max: 6.0, optimal: 3.5 },
      targetViscosityCP: { min: 200, max: 600, optimal: 300 },
      minTotalActiveSurfactantPct: 1.5,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Biodegradable organic acid toilet cleaner (citric, lactic, sulfamic) thickened with natural gums (xanthan) for septic-safe limescale removal.'
  },

  BATHROOM_CLEANER_ACID_FREE_DISINFECTANT: {
    categoryId: 'BATHROOM_CLEANER',
    subProfileId: 'BATHROOM_CLEANER_ACID_FREE_DISINFECTANT',
    label: 'Acid-Free Disinfectant Bathroom Spray',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'SPECIFICATION_ENGINE'
    ],
    primaryPerformanceDomains: ['disinfection', 'detergency', 'rinseability'],
    validationDomains: ['ionic_compatibility', 'ph_stability', 'preservative_efficacy'],
    specificationProfileId: 'SPEC_BATHROOM_CLEANER_ACID_FREE_DISINFECTANT',
    compatibilityProfileId: 'COMPAT_BATHROOM_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 8.0, max: 11.0, optimal: 9.5 },
      activeSurfactantRange: { min: 2.0, max: 6.0, optimal: 3.5 },
      targetViscosityCP: { min: 1, max: 100, optimal: 15 },
      minTotalActiveSurfactantPct: 1.5,
      allowAnionicSurfactants: false,
      allowCationicSurfactants: true
    },
    scientificNotes:
      'Alkaline acid-free sanitary spray safe for natural stone and polished marble. Uses quaternary ammonium biocides coupled strictly with compatible nonionic/amphoteric surfactants.'
  },

  FLOOR_CLEANER_ALKALINE: {
    categoryId: 'FLOOR_CLEANER',
    subProfileId: 'FLOOR_CLEANER_ALKALINE',
    label: 'Heavy-Duty Alkaline Industrial Floor Cleaner',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'SPECIFICATION_ENGINE'
    ],
    primaryPerformanceDomains: ['grease_cutting', 'detergency', 'rinseability'],
    validationDomains: ['ph_stability', 'caustic_hazard'],
    specificationProfileId: 'SPEC_FLOOR_CLEANER_ALKALINE',
    compatibilityProfileId: 'COMPAT_FLOOR_CLEANER',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: false,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'NONIONIC_DOMINANT',
      targetPHRange: { min: 10.5, max: 12.5, optimal: 11.5 },
      activeSurfactantRange: { min: 3.0, max: 10.0, optimal: 6.0 },
      targetViscosityCP: { min: 1, max: 100, optimal: 20 },
      minTotalActiveSurfactantPct: 3.0,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'Heavy-duty alkaline floor scrub for industrial workshops and garages requiring saponification of petroleum oils and greasy tire marks.'
  },

  CAR_SHAMPOO_TOUCHLESS_ALKALINE: {
    categoryId: 'CAR_SHAMPOO',
    subProfileId: 'CAR_SHAMPOO_TOUCHLESS_ALKALINE',
    label: 'Touchless Alkaline Snow Foam Pre-Wash',
    physicalForm: 'LIQUID',
    applicableEngines: [
      'PH_ENGINE',
      'HLB_ENGINE',
      'ACTIVE_MATTER_ENGINE',
      'VISCOSITY_ENGINE',
      'CLEANING_PERFORMANCE_ENGINE',
      'COMPATIBILITY_ENGINE',
      'SPECIFICATION_ENGINE'
    ],
    primaryPerformanceDomains: ['foam_generation', 'grease_cutting', 'rinseability'],
    validationDomains: ['ph_stability', 'surface_corrosion'],
    specificationProfileId: 'SPEC_CAR_SHAMPOO_TOUCHLESS_ALKALINE',
    compatibilityProfileId: 'COMPAT_CAR_SHAMPOO',
    calculationPolicy: {
      requiresPowderCalculations: false,
      requiresViscositySaltCurve: true,
      requiresHLBAnalysis: true,
      requiresChelationHardness: true,
      requiresSkinSafetyMetrics: false,
      requiresStreakResidueMetrics: false,
      requiresClingRheology: false,
      requiresFabricSofteningMetrics: false,
      requiresLowFoamDeaeration: false,
      surfactantPreference: 'ANIONIC_DOMINANT',
      targetPHRange: { min: 9.5, max: 11.5, optimal: 10.5 },
      activeSurfactantRange: { min: 8.0, max: 18.0, optimal: 14.0 },
      targetViscosityCP: { min: 200, max: 1500, optimal: 600 },
      minTotalActiveSurfactantPct: 8.0,
      allowAnionicSurfactants: true,
      allowCationicSurfactants: false
    },
    scientificNotes:
      'High-alkaline snow foam pre-wash for non-contact breakdown of road traffic film and bug splatter prior to mechanical contact wash.'
  }
};

/**
 * Resolves the authoritative Scientific Product Profile for any category or subclass input.
 * Deterministic and strict: unknown, undefined, or invalid categories fail safely and explicitly.
 * Never silently defaults to LAUNDRY_LIQUID or any other product category.
 */
export function getScientificProductProfile(categoryOrId?: string, subProfileOrFormulaName?: string): ScientificProductProfile {
  // 1. Direct match in SCIENTIFIC_SUB_PROFILES
  if (subProfileOrFormulaName && SCIENTIFIC_SUB_PROFILES[subProfileOrFormulaName]) {
    return SCIENTIFIC_SUB_PROFILES[subProfileOrFormulaName];
  }
  if (categoryOrId && SCIENTIFIC_SUB_PROFILES[categoryOrId]) {
    return SCIENTIFIC_SUB_PROFILES[categoryOrId];
  }

  // 2. Subclass resolution from combined descriptor
  const resolvedSub = resolveProductSubclass(categoryOrId, subProfileOrFormulaName);
  if (resolvedSub && SCIENTIFIC_SUB_PROFILES[resolvedSub]) {
    return SCIENTIFIC_SUB_PROFILES[resolvedSub];
  }

  // 3. Fallback to canonical category
  const norm = normalizeProductCategory(categoryOrId);
  if (norm === 'UNKNOWN_PRODUCT_CATEGORY' || !SCIENTIFIC_PRODUCT_PROFILES[norm]) {
    throw new Error(
      `Cannot resolve ScientificProductProfile: Unrecognized, missing, or invalid product category "${categoryOrId ?? 'undefined'}". ` +
      `Product category must resolve to one of the 13 canonical ProductCategoryId values.`
    );
  }
  return SCIENTIFIC_PRODUCT_PROFILES[norm];
}

/**
 * Safely attempts to resolve a ScientificProductProfile, returning null if unknown or invalid.
 */
export function tryGetScientificProductProfile(categoryOrId?: string, subProfileOrFormulaName?: string): ScientificProductProfile | null {
  try {
    return getScientificProductProfile(categoryOrId, subProfileOrFormulaName);
  } catch {
    return null;
  }
}

/**
 * Returns the list of applicable engines for a specific product category.
 */
export function getApplicableEnginesForCategory(categoryOrId?: string, subProfileOrFormulaName?: string): ScientificEngineId[] {
  return getScientificProductProfile(categoryOrId, subProfileOrFormulaName).applicableEngines;
}

/**
 * Checks whether a specific engine is applicable to the target product category.
 * If category is unknown or undefined, safely returns false.
 */
export function isEngineApplicable(categoryOrId: string | undefined, engineId: ScientificEngineId, subProfileOrFormulaName?: string): boolean {
  const profile = tryGetScientificProductProfile(categoryOrId, subProfileOrFormulaName);
  if (!profile) return false;
  return profile.applicableEngines.includes(engineId);
}

/**
 * Returns the calculation policy for a product category.
 */
export function getCalculationPolicy(categoryOrId?: string, subProfileOrFormulaName?: string): CalculationPolicy {
  return getScientificProductProfile(categoryOrId, subProfileOrFormulaName).calculationPolicy;
}

/**
 * Returns performance domains for a product category.
 */
export function getCategoryPerformanceDomains(categoryOrId?: string, subProfileOrFormulaName?: string): PerformanceDomain[] {
  return getScientificProductProfile(categoryOrId, subProfileOrFormulaName).primaryPerformanceDomains;
}

/**
 * Returns validation domains for a product category.
 */
export function getCategoryValidationDomains(categoryOrId?: string, subProfileOrFormulaName?: string): ValidationDomain[] {
  return getScientificProductProfile(categoryOrId, subProfileOrFormulaName).validationDomains;
}

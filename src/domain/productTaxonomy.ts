/**
 * ============================================================================
 * UNIFIED PRODUCT TAXONOMY & CATEGORY ARCHITECTURE (Phase 1 Master Domain)
 * ============================================================================
 *
 * Single authoritative source of truth for all 13 canonical finished product
 * categories across the application (UI, Formulator, Library, Storage, Validation,
 * Expert Reasoning, Reporting, and Testing).
 *
 * CANONICAL CATEGORY IDs (Strictly uppercase underscore formatted):
 * 1.  LAUNDRY_LIQUID
 * 2.  LAUNDRY_POWDER
 * 3.  DISHWASH_MANUAL
 * 4.  DISHWASH_AUTOMATIC
 * 5.  FLOOR_CLEANER
 * 6.  MULTIPURPOSE_CLEANER
 * 7.  TOILET_CLEANER
 * 8.  BATHROOM_CLEANER
 * 9.  GLASS_CLEANER
 * 10. FABRIC_SOFTENER
 * 11. HAND_WASH
 * 12. KITCHEN_DEGREASER
 * 13. CAR_SHAMPOO
 *
 * Unknown categories NEVER silently fallback to LIQUID or another category.
 * They return UNKNOWN_PRODUCT_CATEGORY with explicit validation diagnostics.
 * ============================================================================
 */

export const CANONICAL_PRODUCT_CATEGORY_IDS = [
  'LAUNDRY_LIQUID',
  'LAUNDRY_POWDER',
  'DISHWASH_MANUAL',
  'DISHWASH_AUTOMATIC',
  'FLOOR_CLEANER',
  'MULTIPURPOSE_CLEANER',
  'TOILET_CLEANER',
  'BATHROOM_CLEANER',
  'GLASS_CLEANER',
  'FABRIC_SOFTENER',
  'HAND_WASH',
  'KITCHEN_DEGREASER',
  'CAR_SHAMPOO'
] as const;

export type ProductCategoryId = typeof CANONICAL_PRODUCT_CATEGORY_IDS[number];

/**
 * Phase 2 Specialized Scientific Sub-Classes
 * Differentiates products with divergent chemical regimes under broad parent categories
 * (e.g. Acidic Rinse Aid vs Alkaline Auto Dish; Mineral HCl vs Organic Acid Toilet Cleaners)
 */
export const PRODUCT_SUBCLASS_IDS = [
  'DISHWASH_AUTO_DETERGENT',
  'DISHWASH_AUTO_RINSE_AID',
  'TOILET_CLEANER_MINERAL_ACID',
  'TOILET_CLEANER_ORGANIC_ACID',
  'BATHROOM_CLEANER_ACIDIC_DESCALER',
  'BATHROOM_CLEANER_NEUTRAL',
  'BATHROOM_CLEANER_ACID_FREE_DISINFECTANT',
  'FLOOR_CLEANER_NEUTRAL',
  'FLOOR_CLEANER_ALKALINE',
  'CAR_SHAMPOO_NEUTRAL',
  'CAR_SHAMPOO_TOUCHLESS_ALKALINE',
  'KITCHEN_DEGREASER_HEAVY_CAUSTIC',
  'KITCHEN_DEGREASER_SOLVENT'
] as const;

export type ProductSubclassId = typeof PRODUCT_SUBCLASS_IDS[number];

export type PhysicalForm = 'LIQUID' | 'POWDER' | 'GEL' | 'EMULSION';

export type ProductFamily =
  | 'LAUNDRY_CARE'
  | 'DISH_CARE'
  | 'SURFACE_CARE'
  | 'PERSONAL_CARE'
  | 'VEHICLE_CARE';

export interface CategoryMetricApplicability {
  hlb: boolean;
  cmc: boolean;
  viscosity: boolean;
  cleaningScore: boolean;
  foam: boolean;
  builder: boolean;
}

export interface ProductCategoryDefinition {
  id: ProductCategoryId;
  label: string;
  description: string;
  physicalForm: PhysicalForm;
  family: ProductFamily;
  targetPHMin: number;
  targetPHMax: number;
  defaultPH: number;
  activeMatterMinPct: number;
  activeMatterTargetPct: number;
  foamExpectation: string;
  primaryFunction: string;
  keyConstraints: string[];
  defaultFormulaId?: string;
  defaultFormulaStatus: 'AVAILABLE' | 'NOT_AVAILABLE';
  categoryApplicability: CategoryMetricApplicability;
}

export const PRODUCT_TAXONOMY_MAP: Record<ProductCategoryId, ProductCategoryDefinition> = {
  LAUNDRY_LIQUID: {
    id: 'LAUNDRY_LIQUID',
    label: 'Liquid Laundry',
    description: 'Liquid detergent formulated for fabric cleaning in top-load and front-load washing machines.',
    physicalForm: 'LIQUID',
    family: 'LAUNDRY_CARE',
    targetPHMin: 7.5,
    targetPHMax: 9.5,
    defaultPH: 8.5,
    activeMatterMinPct: 10,
    activeMatterTargetPct: 16,
    foamExpectation: 'Medium / Controlled',
    primaryFunction: 'Removal of particulate soil, sebum, and greasy stains from fabrics',
    keyConstraints: [
      'Prevent enzyme denaturation above pH 9.5',
      'Keep viscosity between 600-1200 cP',
      'Maintain hard water chelation'
    ],
    defaultFormulaId: 'hd-liquid-laundry',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  LAUNDRY_POWDER: {
    id: 'LAUNDRY_POWDER',
    label: 'Powder Laundry',
    description: 'Granular heavy-duty laundry washing powder with alkaline builder and soil-suspending systems.',
    physicalForm: 'POWDER',
    family: 'LAUNDRY_CARE',
    targetPHMin: 9.5,
    targetPHMax: 11.5,
    defaultPH: 10.5,
    activeMatterMinPct: 10,
    activeMatterTargetPct: 15,
    foamExpectation: 'High / Controlled',
    primaryFunction: 'Alkaline saponification, builder water-softening, and soil suspension in powder washing',
    keyConstraints: [
      'Moisture content must be < 5%',
      'Prevent caking with anticaking silicates',
      'Keep bulk density between 0.45-0.85 g/cm³'
    ],
    defaultFormulaId: 'high-foam-laundry-powder',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: false,
      cmc: true,
      viscosity: false,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  DISHWASH_MANUAL: {
    id: 'DISHWASH_MANUAL',
    label: 'Manual Dishwash',
    description: 'Hand dishwashing liquid formulated for grease emulsification, skin mildness, and high foam build.',
    physicalForm: 'LIQUID',
    family: 'DISH_CARE',
    targetPHMin: 6.0,
    targetPHMax: 8.0,
    defaultPH: 6.8,
    activeMatterMinPct: 12,
    activeMatterTargetPct: 20,
    foamExpectation: 'High / Dense',
    primaryFunction: 'Hand-safe grease emulsification and persistent high foam build',
    keyConstraints: [
      'Skin compatibility pH range 6.0-7.5',
      'Require amphoteric CAPB for mildness',
      'High viscosity (1500-2500 cP)'
    ],
    defaultFormulaId: 'dishwash-manual-premium',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  DISHWASH_AUTOMATIC: {
    id: 'DISHWASH_AUTOMATIC',
    label: 'Automatic Dishwasher',
    description: 'Machine dishwashing detergent engineered for zero foam, soil enzyme breakdown, and glass sheeting.',
    physicalForm: 'LIQUID',
    family: 'DISH_CARE',
    targetPHMin: 8.5,
    targetPHMax: 11.5,
    defaultPH: 10.0,
    activeMatterMinPct: 4,
    activeMatterTargetPct: 8,
    foamExpectation: 'Low / Zero Suds',
    primaryFunction: 'Low-foaming mechanical dishwashing, glass sheeting, and protein enzyme breakdown',
    keyConstraints: [
      'STRICT ZERO FOAM to prevent pump cavitation',
      'Prevent etching on glassware with silicates',
      'Enzyme stability'
    ],
    defaultFormulaId: 'dishwash-auto-standard',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  FLOOR_CLEANER: {
    id: 'FLOOR_CLEANER',
    label: 'Floor Cleaner',
    description: 'Hard surface mop-down cleaner designed for fast streak-free drying without slippery or sticky residue.',
    physicalForm: 'LIQUID',
    family: 'SURFACE_CARE',
    targetPHMin: 6.5,
    targetPHMax: 9.5,
    defaultPH: 7.5,
    activeMatterMinPct: 3,
    activeMatterTargetPct: 6,
    foamExpectation: 'Low / Controlled',
    primaryFunction: 'Mop-down surface dirt removal without leaving sticky residue or slippery film',
    keyConstraints: [
      'Zero sticky polymer residue',
      'Fast drying time',
      'Neutral pH range 7.0-8.0 for marble/granite safety'
    ],
    defaultFormulaId: 'floor-cleaner-economy-pine',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  MULTIPURPOSE_CLEANER: {
    id: 'MULTIPURPOSE_CLEANER',
    label: 'Multipurpose Cleaner',
    description: 'Versatile spray-and-wipe cleaner safe for countertops, tiles, kitchen fixtures, and painted surfaces.',
    physicalForm: 'LIQUID',
    family: 'SURFACE_CARE',
    targetPHMin: 7.0,
    targetPHMax: 10.0,
    defaultPH: 8.5,
    activeMatterMinPct: 4,
    activeMatterTargetPct: 8,
    foamExpectation: 'Medium / Moderate',
    primaryFunction: 'Versatile spray-and-wipe cleaning across countertops, appliances, and fixtures',
    keyConstraints: [
      'Compatible with trigger spray bottles',
      'Mild degreasing with APG or LAE nonionics',
      'No harsh fumes'
    ],
    defaultFormulaId: 'multi-surface-citrus-spray',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  TOILET_CLEANER: {
    id: 'TOILET_CLEANER',
    label: 'Toilet Cleaner',
    description: 'Acidic thickened descaling cleaner for rapid dissolution of uric scale, lime deposits, and rust stains.',
    physicalForm: 'LIQUID',
    family: 'SURFACE_CARE',
    targetPHMin: 1.0,
    targetPHMax: 2.5,
    defaultPH: 1.5,
    activeMatterMinPct: 2,
    activeMatterTargetPct: 5,
    foamExpectation: 'Clinging Foam',
    primaryFunction: 'Dissolution of uric scale, lime scale, and rust stains under porcelain bowl rims',
    keyConstraints: [
      'High vertical surface cling (viscosity 800-1500 cP)',
      'Corrosion inhibition required for metal pipes',
      'Acidic stability with amine ethoxylate / HCl or organic acid'
    ],
    defaultFormulaId: 'toilet-cleaner-acid-standard',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: false,
      cmc: false,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: false
    }
  },
  BATHROOM_CLEANER: {
    id: 'BATHROOM_CLEANER',
    label: 'Bathroom Cleaner',
    description: 'Targeted tile, grout, and sanitary ware descaler for dissolving soap scum and calcium water deposits.',
    physicalForm: 'LIQUID',
    family: 'SURFACE_CARE',
    targetPHMin: 2.0,
    targetPHMax: 4.0,
    defaultPH: 3.0,
    activeMatterMinPct: 3,
    activeMatterTargetPct: 7,
    foamExpectation: 'Clinging Foam',
    primaryFunction: 'Removal of calcium soap scum, hard water mineral deposits, and mildew on ceramic tiles',
    keyConstraints: [
      'Organic acid chelating system (Citric/Sulfamic/Glycolic)',
      'Tile grout protection',
      'Effective cling time'
    ],
    defaultFormulaId: 'bathroom-cleaner-spray',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  GLASS_CLEANER: {
    id: 'GLASS_CLEANER',
    label: 'Glass / Window Cleaner',
    description: 'Ultra-fast drying, streak-free cleaner for windows, automotive windshields, and mirrored glass.',
    physicalForm: 'LIQUID',
    family: 'SURFACE_CARE',
    targetPHMin: 8.5,
    targetPHMax: 10.5,
    defaultPH: 9.5,
    activeMatterMinPct: 1,
    activeMatterTargetPct: 3,
    foamExpectation: 'Streak-Free Zero Suds',
    primaryFunction: 'Fast-evaporating streak-free removal of fingerprints and smudges from glass & mirrors',
    keyConstraints: [
      'Active matter strictly under 3% to prevent streaks',
      'Hydrotrope solvent coupling (IPA or Glycol Ether)',
      'Instant flash drying'
    ],
    defaultFormulaId: 'glass-cleaner-standard',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: false,
      cmc: false,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: false
    }
  },
  FABRIC_SOFTENER: {
    id: 'FABRIC_SOFTENER',
    label: 'Fabric Softener',
    description: 'Cationic conditioning rinse aid for fabric softening, static reduction, and fragrance longevity.',
    physicalForm: 'LIQUID',
    family: 'LAUNDRY_CARE',
    targetPHMin: 2.5,
    targetPHMax: 4.5,
    defaultPH: 3.5,
    activeMatterMinPct: 4,
    activeMatterTargetPct: 12,
    foamExpectation: 'Non-Foaming Cationic',
    primaryFunction: 'Cationic fiber lubrication, anti-static charge neutralization, and long-lasting scent burst',
    keyConstraints: [
      'STRICT CATIONIC MEDIUM — zero anionic surfactants',
      'pH controlled to 3.0-4.0 for esterquat emulsion stability',
      'Anti-microbial preservation'
    ],
    defaultFormulaId: 'fabric-softener-standard',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: false,
      cmc: false,
      viscosity: true,
      cleaningScore: false,
      foam: false,
      builder: false
    }
  },
  HAND_WASH: {
    id: 'HAND_WASH',
    label: 'Hand Wash',
    description: 'Dermatologically safe skin-cleansing liquid soap with moisturizers and mild lathering agents.',
    physicalForm: 'LIQUID',
    family: 'PERSONAL_CARE',
    targetPHMin: 5.0,
    targetPHMax: 6.8,
    defaultPH: 6.0,
    activeMatterMinPct: 8,
    activeMatterTargetPct: 14,
    foamExpectation: 'High / Dense',
    primaryFunction: 'Dermatologically mild skin cleansing, pathogen removal, and lipid moisture replenishment',
    keyConstraints: [
      'Skin natural pH balance (5.5-6.5)',
      'Skin-soothing CAPB/Glycerin combo',
      'Smooth dispensing viscosity (1800-3000 cP)'
    ],
    defaultFormulaId: 'hand-soap-standard',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: false
    }
  },
  KITCHEN_DEGREASER: {
    id: 'KITCHEN_DEGREASER',
    label: 'Kitchen Degreaser',
    description: 'Heavy-duty alkaline and solvent degreaser for baked-on grease, carbonized oil, and exhaust hood soils.',
    physicalForm: 'LIQUID',
    family: 'SURFACE_CARE',
    targetPHMin: 11.0,
    targetPHMax: 13.8,
    defaultPH: 12.5,
    activeMatterMinPct: 8,
    activeMatterTargetPct: 16,
    foamExpectation: 'Low / Solvent Cling',
    primaryFunction: 'Alkaline saponification of baked-on grease, carbonized oil, and heavy food soils on ovens & hoods',
    keyConstraints: [
      'Heavy caustic or metasilicate reserve',
      'Glycol ether or terpene grease penetration',
      'Personal protective equipment recommended'
    ],
    defaultFormulaId: 'kitchen-degreaser-heavy-duty',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  CAR_SHAMPOO: {
    id: 'CAR_SHAMPOO',
    label: 'Car Shampoo',
    description: 'High-lubricity pH-neutral vehicle wash designed for snow-foam application without stripping protective wax.',
    physicalForm: 'LIQUID',
    family: 'VEHICLE_CARE',
    targetPHMin: 6.5,
    targetPHMax: 8.0,
    defaultPH: 7.2,
    activeMatterMinPct: 8,
    activeMatterTargetPct: 15,
    foamExpectation: 'High Suds / Snow Foam',
    primaryFunction: 'High-lubricity foam lifting of road grime without stripping automotive wax or ceramic coatings',
    keyConstraints: [
      'Strict pH-neutral 6.8-7.5 for clearcoat and wax safety',
      'High slickness/lubricity to prevent swirl marks',
      'Free rinsing without water spotting'
    ],
    defaultFormulaId: 'car-shampoo-snow-foam',
    defaultFormulaStatus: 'AVAILABLE',
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  }
};

export const PRODUCT_CATEGORIES: ProductCategoryDefinition[] = CANONICAL_PRODUCT_CATEGORY_IDS.map(
  (id) => PRODUCT_TAXONOMY_MAP[id]
);

/**
 * Deterministic legacy alias mapping table.
 * All known historical variations are mapped strictly to canonical IDs.
 */
const LEGACY_CATEGORY_ALIAS_MAP: Record<string, ProductCategoryId> = {
  // 1. LAUNDRY_LIQUID
  'laundry_liquid': 'LAUNDRY_LIQUID',
  'laundry liquid': 'LAUNDRY_LIQUID',
  'liquid laundry': 'LAUNDRY_LIQUID',
  'liquid-laundry': 'LAUNDRY_LIQUID',
  'liquid_laundry': 'LAUNDRY_LIQUID',
  'liquid laundry detergent': 'LAUNDRY_LIQUID',
  'liquid laundry detergent (commercial standard)': 'LAUNDRY_LIQUID',
  'economy commercial laundry liquid': 'LAUNDRY_LIQUID',
  'concentrated eco liquid laundry detergent': 'LAUNDRY_LIQUID',

  // 2. LAUNDRY_POWDER
  'laundry_powder': 'LAUNDRY_POWDER',
  'laundry powder': 'LAUNDRY_POWDER',
  'powder laundry': 'LAUNDRY_POWDER',
  'powder-laundry': 'LAUNDRY_POWDER',
  'powder_laundry': 'LAUNDRY_POWDER',
  'washing powder': 'LAUNDRY_POWDER',
  'detergent powder': 'LAUNDRY_POWDER',
  'high-foam performance laundry detergent powder': 'LAUNDRY_POWDER',
  'economy phosphate-free laundry powder': 'LAUNDRY_POWDER',
  'premium industrial oxygen-bleach laundry powder': 'LAUNDRY_POWDER',

  // 3. DISHWASH_MANUAL
  'dishwash_manual': 'DISHWASH_MANUAL',
  'dishwash manual': 'DISHWASH_MANUAL',
  'manual dishwash': 'DISHWASH_MANUAL',
  'manual-dishwash': 'DISHWASH_MANUAL',
  'manual_dishwash': 'DISHWASH_MANUAL',
  'dishwash liquid': 'DISHWASH_MANUAL',
  'dishwash-liquid': 'DISHWASH_MANUAL',
  'dishwash_liquid': 'DISHWASH_MANUAL',
  'dishwashing liquid': 'DISHWASH_MANUAL',
  'dishwash': 'DISHWASH_MANUAL',
  'premium concentrated manual dishwashing liquid': 'DISHWASH_MANUAL',
  'economy commercial dishwashing liquid': 'DISHWASH_MANUAL',
  'ultra-mild eco aloe dishwash gel': 'DISHWASH_MANUAL',

  // 4. DISHWASH_AUTOMATIC
  'dishwash_automatic': 'DISHWASH_AUTOMATIC',
  'dishwash automatic': 'DISHWASH_AUTOMATIC',
  'auto / machine dishwash': 'DISHWASH_AUTOMATIC',
  'auto/machine dishwash': 'DISHWASH_AUTOMATIC',
  'automatic dishwasher': 'DISHWASH_AUTOMATIC',
  'automatic dishwash': 'DISHWASH_AUTOMATIC',
  'auto dishwash': 'DISHWASH_AUTOMATIC',
  'machine dishwash': 'DISHWASH_AUTOMATIC',
  'standard low-foam automatic dishwasher liquid': 'DISHWASH_AUTOMATIC',
  'premium automatic dishwasher gel with enzymes': 'DISHWASH_AUTOMATIC',
  'commercial machine warewash alkaline liquid': 'DISHWASH_AUTOMATIC',

  // 5. FLOOR_CLEANER
  'floor_cleaner': 'FLOOR_CLEANER',
  'floor cleaner': 'FLOOR_CLEANER',
  'hard surface / floor cleaner': 'FLOOR_CLEANER',
  'hard surface/floor cleaner': 'FLOOR_CLEANER',
  'hard surface cleaner': 'FLOOR_CLEANER',
  'economy pine disinfectant floor cleaner': 'FLOOR_CLEANER',
  'heavy-duty industrial citrus floor degreaser': 'FLOOR_CLEANER',
  'standard multi-surface floor cleaner (lavender)': 'FLOOR_CLEANER',

  // 6. MULTIPURPOSE_CLEANER
  'multipurpose_cleaner': 'MULTIPURPOSE_CLEANER',
  'multipurpose cleaner': 'MULTIPURPOSE_CLEANER',
  'all purpose cleaner': 'MULTIPURPOSE_CLEANER',
  'all-purpose cleaner': 'MULTIPURPOSE_CLEANER',
  'multipurpose': 'MULTIPURPOSE_CLEANER',
  'surface cleaner': 'MULTIPURPOSE_CLEANER',
  'standard all-purpose citrus spray cleaner': 'MULTIPURPOSE_CLEANER',
  'heavy-duty alkaline multi-surface degreaser': 'MULTIPURPOSE_CLEANER',
  'eco neutral multi-surface cleaner': 'MULTIPURPOSE_CLEANER',

  // 7. TOILET_CLEANER
  'toilet_cleaner': 'TOILET_CLEANER',
  'toilet cleaner': 'TOILET_CLEANER',
  'toilet cleaner (acidic)': 'TOILET_CLEANER',
  'toilet cleaner acidic': 'TOILET_CLEANER',
  'acidic toilet cleaner': 'TOILET_CLEANER',
  'standard 10% hcl high-thick toilet cleaner': 'TOILET_CLEANER',
  'premium eco organic acid toilet cleaner': 'TOILET_CLEANER',
  'heavy-duty industrial descaling toilet cleaner': 'TOILET_CLEANER',

  // 8. BATHROOM_CLEANER
  'bathroom_cleaner': 'BATHROOM_CLEANER',
  'bathroom cleaner': 'BATHROOM_CLEANER',
  'standard organic acid bathroom & tile descaler': 'BATHROOM_CLEANER',
  'chlorine-bleach mold & mildew bathroom cleaner': 'BATHROOM_CLEANER',
  'eco citric acid soap scum remover': 'BATHROOM_CLEANER',

  // 9. GLASS_CLEANER
  'glass_cleaner': 'GLASS_CLEANER',
  'glass cleaner': 'GLASS_CLEANER',
  'glass / window cleaner': 'GLASS_CLEANER',
  'glass/window cleaner': 'GLASS_CLEANER',
  'window cleaner': 'GLASS_CLEANER',
  'standard anti-fog streak-free glass cleaner': 'GLASS_CLEANER',
  'premium ammonia-free eco glass & mirror cleaner': 'GLASS_CLEANER',
  'industrial alcohol-based heavy glass cleaner': 'GLASS_CLEANER',

  // 10. FABRIC_SOFTENER
  'fabric_softener': 'FABRIC_SOFTENER',
  'fabric softener': 'FABRIC_SOFTENER',
  'fabric conditioner': 'FABRIC_SOFTENER',
  'standard encapsulated fragrance fabric softener': 'FABRIC_SOFTENER',
  'ultra-concentrated esterquat fabric softener': 'FABRIC_SOFTENER',
  'eco botanical sensitive skin fabric softener': 'FABRIC_SOFTENER',

  // 11. HAND_WASH
  'hand_wash': 'HAND_WASH',
  'hand wash': 'HAND_WASH',
  'hand wash liquid soap': 'HAND_WASH',
  'liquid hand soap': 'HAND_WASH',
  'hand soap': 'HAND_WASH',
  'standard anti-bacterial hand wash soap': 'HAND_WASH',
  'premium pearlescent moisturizing hand wash': 'HAND_WASH',
  'eco sulfate-free botanical hand wash': 'HAND_WASH',

  // 12. KITCHEN_DEGREASER
  'kitchen_degreaser': 'KITCHEN_DEGREASER',
  'kitchen degreaser': 'KITCHEN_DEGREASER',
  'standard heavy-duty alkaline kitchen degreaser': 'KITCHEN_DEGREASER',
  'fast-acting solvent grill & oven cleaner': 'KITCHEN_DEGREASER',
  'eco d-limonene food-safe kitchen degreaser': 'KITCHEN_DEGREASER',

  // 13. CAR_SHAMPOO
  'car_shampoo': 'CAR_SHAMPOO',
  'car shampoo': 'CAR_SHAMPOO',
  'car wash / car shampoo': 'CAR_SHAMPOO',
  'car wash/car shampoo': 'CAR_SHAMPOO',
  'car wash': 'CAR_SHAMPOO',
  'car wash shampoo': 'CAR_SHAMPOO',
  'premium touchless ph-neutral snow foam car shampoo': 'CAR_SHAMPOO',
  'wash & wax gloss-enhancing car shampoo': 'CAR_SHAMPOO',
  'heavy-duty commercial truck & fleet wash': 'CAR_SHAMPOO'
};

/**
 * Check if an unknown value is a valid canonical ProductCategoryId.
 */
export function isValidProductCategory(value: unknown): value is ProductCategoryId {
  return typeof value === 'string' && (CANONICAL_PRODUCT_CATEGORY_IDS as readonly string[]).includes(value);
}

/**
 * Normalizes any category string or legacy alias into a canonical ProductCategoryId.
 * If unknown, returns 'UNKNOWN_PRODUCT_CATEGORY' (Never silently converts to LIQUID).
 */
export function normalizeProductCategory(
  input: string | null | undefined
): ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY' {
  if (!input || typeof input !== 'string') {
    return 'UNKNOWN_PRODUCT_CATEGORY';
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return 'UNKNOWN_PRODUCT_CATEGORY';
  }

  // 1. Direct match on canonical IDs
  if (isValidProductCategory(trimmed)) {
    return trimmed;
  }

  // 2. Direct match in legacy alias map
  const lower = trimmed.toLowerCase();
  if (LEGACY_CATEGORY_ALIAS_MAP[lower]) {
    return LEGACY_CATEGORY_ALIAS_MAP[lower];
  }

  // 3. Normalized punctuation check
  const cleaned = lower.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  if (LEGACY_CATEGORY_ALIAS_MAP[cleaned]) {
    return LEGACY_CATEGORY_ALIAS_MAP[cleaned];
  }

  // 4. Keyword fuzzy resolution for known unique keywords
  if (cleaned.includes('toilet') || cleaned.includes('acid bowl') || cleaned.includes('urinal')) {
    return 'TOILET_CLEANER';
  }
  if (cleaned.includes('fabric softener') || cleaned.includes('softener') || cleaned.includes('esterquat')) {
    return 'FABRIC_SOFTENER';
  }
  if (cleaned.includes('car shampoo') || cleaned.includes('car wash') || cleaned.includes('auto wash') || cleaned.includes('snow foam')) {
    return 'CAR_SHAMPOO';
  }
  if (cleaned.includes('hand wash') || cleaned.includes('hand soap') || cleaned.includes('liquid soap')) {
    return 'HAND_WASH';
  }
  if (cleaned.includes('degreaser') || cleaned.includes('oven cleaner') || cleaned.includes('grill cleaner')) {
    return 'KITCHEN_DEGREASER';
  }
  if (cleaned.includes('glass') || cleaned.includes('window') || cleaned.includes('mirror')) {
    return 'GLASS_CLEANER';
  }
  if (cleaned.includes('bathroom') || cleaned.includes('tile descaler') || cleaned.includes('soap scum')) {
    return 'BATHROOM_CLEANER';
  }
  if (cleaned.includes('floor') || cleaned.includes('hard surface')) {
    return 'FLOOR_CLEANER';
  }
  if (cleaned.includes('multi') && (cleaned.includes('purpose') || cleaned.includes('surface'))) {
    return 'MULTIPURPOSE_CLEANER';
  }
  if (cleaned.includes('auto') && cleaned.includes('dish')) {
    return 'DISHWASH_AUTOMATIC';
  }
  if (cleaned.includes('dish')) {
    return 'DISHWASH_MANUAL';
  }
  if (cleaned.includes('powder') && cleaned.includes('laundry')) {
    return 'LAUNDRY_POWDER';
  }
  if (cleaned.includes('laundry')) {
    return 'LAUNDRY_LIQUID';
  }

  return 'UNKNOWN_PRODUCT_CATEGORY';
}

/**
 * Returns the full ProductCategoryDefinition for a given category ID or legacy name.
 * If not found, returns null.
 */
export function getProductCategory(
  idOrLegacy: string | null | undefined
): ProductCategoryDefinition | null {
  const normId = normalizeProductCategory(idOrLegacy);
  if (normId === 'UNKNOWN_PRODUCT_CATEGORY') {
    return null;
  }
  return PRODUCT_TAXONOMY_MAP[normId] || null;
}

/**
 * Returns the human-readable display label for a given category ID or legacy name.
 */
export function getProductCategoryLabel(idOrLegacy: string | null | undefined): string {
  const def = getProductCategory(idOrLegacy);
  return def ? def.label : (idOrLegacy || 'Unknown Category');
}

/**
 * Returns the target pH range for a category directly from taxonomy SSOT.
 */
export function getTargetPHRange(category: string, _role?: string): { min: number; max: number; label: string } {
  const def = getProductCategory(category);
  if (def) {
    return {
      min: def.targetPHMin,
      max: def.targetPHMax,
      label: `${def.label} Target (${def.targetPHMin} - ${def.targetPHMax})`
    };
  }
  return { min: 6.0, max: 9.0, label: 'General Detergent Range (6.0 - 9.0)' };
}

/**
 * Validation result for product categories.
 */
export interface CategoryValidationResult {
  valid: boolean;
  categoryId?: ProductCategoryId;
  error?: string;
}

/**
 * Centralized validator for product category strings.
 */
export function validateProductCategory(input: unknown): CategoryValidationResult {
  if (typeof input !== 'string' || !input.trim()) {
    return {
      valid: false,
      error: 'Product category is missing or not a valid string.'
    };
  }

  const normalized = normalizeProductCategory(input);
  if (normalized === 'UNKNOWN_PRODUCT_CATEGORY') {
    return {
      valid: false,
      error: `Unknown or unmapped product category: "${input}". Must resolve to one of the 13 canonical categories.`
    };
  }

  return {
    valid: true,
    categoryId: normalized
  };
}

/**
 * Resolves a specialized ProductSubclassId when the formula or product name indicates
 * a distinct chemical subclass within the canonical category.
 */
export function resolveProductSubclass(
  categoryOrSubclass?: string | null,
  formulaNameOrId?: string | null
): ProductSubclassId | null {
  const combined = `${categoryOrSubclass || ''} ${formulaNameOrId || ''}`.toLowerCase();

  // Automatic Dishwasher
  if (combined.includes('rinse aid') || combined.includes('rinse-aid') || combined.includes('sheeting')) {
    return 'DISHWASH_AUTO_RINSE_AID';
  }
  if (combined.includes('auto') && combined.includes('dish')) {
    return 'DISHWASH_AUTO_DETERGENT';
  }

  // Toilet Cleaner
  if (combined.includes('hcl') || combined.includes('mineral acid') || combined.includes('bowl')) {
    return 'TOILET_CLEANER_MINERAL_ACID';
  }
  if (combined.includes('organic acid') || combined.includes('eco-organic') || combined.includes('citric acid toilet')) {
    return 'TOILET_CLEANER_ORGANIC_ACID';
  }

  // Bathroom Cleaner
  if (combined.includes('acid-free') || combined.includes('acid free') || combined.includes('disinfectant bathroom')) {
    return 'BATHROOM_CLEANER_ACID_FREE_DISINFECTANT';
  }
  if (combined.includes('scale remover') || combined.includes('descaler') || combined.includes('soap scum')) {
    return 'BATHROOM_CLEANER_ACIDIC_DESCALER';
  }

  // Floor Cleaner
  if (combined.includes('industrial citrus floor') || combined.includes('alkaline floor') || combined.includes('heavy-duty floor')) {
    return 'FLOOR_CLEANER_ALKALINE';
  }
  if (combined.includes('neutral floor') || combined.includes('floor restorer')) {
    return 'FLOOR_CLEANER_NEUTRAL';
  }

  // Car Shampoo
  if (combined.includes('touchless') || combined.includes('snow foam')) {
    return 'CAR_SHAMPOO_TOUCHLESS_ALKALINE';
  }
  if (combined.includes('wash and wax') || combined.includes('wash & wax') || combined.includes('auto wash')) {
    return 'CAR_SHAMPOO_NEUTRAL';
  }

  // Kitchen Degreaser
  if (combined.includes('caustic oven') || combined.includes('caustic degreaser')) {
    return 'KITCHEN_DEGREASER_HEAVY_CAUSTIC';
  }
  if (combined.includes('solvent kitchen') || combined.includes('solvent grill')) {
    return 'KITCHEN_DEGREASER_SOLVENT';
  }

  return null;
}

/**
 * Validates category compatibility when switching categories.
 * Prevents silent mutation of incompatible formula chemistry.
 */
export function validateCategoryCompatibility(
  fromCategory: string | null | undefined,
  toCategory: string | null | undefined,
  ingredients: Array<{ name?: string; role?: string; percentage?: number }> = []
): { compatible: boolean; requiresReset: boolean; reason?: string } {
  const fromNorm = normalizeProductCategory(fromCategory);
  const toNorm = normalizeProductCategory(toCategory);

  if (fromNorm === 'UNKNOWN_PRODUCT_CATEGORY' || toNorm === 'UNKNOWN_PRODUCT_CATEGORY') {
    return {
      compatible: false,
      requiresReset: true,
      reason: 'Unknown category transition detected.'
    };
  }

  if (fromNorm === toNorm) {
    return { compatible: true, requiresReset: false };
  }

  const fromDef = PRODUCT_TAXONOMY_MAP[fromNorm];
  const toDef = PRODUCT_TAXONOMY_MAP[toNorm];

  // 1. Powder vs Liquid physical form mismatch
  if (fromDef.physicalForm !== toDef.physicalForm) {
    return {
      compatible: false,
      requiresReset: true,
      reason: `Physical form mismatch: Cannot convert ${fromDef.physicalForm} formula (${fromDef.label}) to ${toDef.physicalForm} formula (${toDef.label}).`
    };
  }

  // 2. Cationic Fabric Softener vs Anionic Detergent
  if (fromNorm === 'FABRIC_SOFTENER' || toNorm === 'FABRIC_SOFTENER') {
    const hasAnionic = ingredients.some(
      (i) => (i.name || '').toLowerCase().includes('labsa') || (i.name || '').toLowerCase().includes('sles')
    );
    if (hasAnionic && toNorm === 'FABRIC_SOFTENER') {
      return {
        compatible: false,
        requiresReset: true,
        reason: 'Ionic conflict: Anionic detergent surfactants are strictly incompatible with Cationic Fabric Softener matrix.'
      };
    }
  }

  // 3. Extreme Acidic Toilet Cleaner vs High Alkaline Kitchen Degreaser
  if (
    (fromNorm === 'TOILET_CLEANER' && toNorm === 'KITCHEN_DEGREASER') ||
    (fromNorm === 'KITCHEN_DEGREASER' && toNorm === 'TOILET_CLEANER')
  ) {
    return {
      compatible: false,
      requiresReset: true,
      reason: `Extreme chemical regime mismatch: ${fromDef.label} (pH ~${fromDef.defaultPH}) and ${toDef.label} (pH ~${toDef.defaultPH}) require distinct raw materials.`
    };
  }

  // Cross-category change warning
  return {
    compatible: false,
    requiresReset: true,
    reason: `Formulation belongs to ${fromDef.label}. Resetting to standard ${toDef.label} baseline.`
  };
}

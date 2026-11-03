/**
 * ============================================================================
 * P2 — REGULATORY PRODUCT SCOPE & TAXONOMY ROUTING ENGINE
 * ============================================================================
 * Scopes regulatory evaluation across all 13 canonical detergent categories.
 * Strict rule: Never default silently to LAUNDRY_LIQUID when category is unknown.
 * ============================================================================
 */

import { ProductCategoryId } from '../productTaxonomy';

export interface RegulatoryScopeMapping {
  categoryId: ProductCategoryId;
  indiaBisStandard?: string;
  indiaBisStandardId?: string;
  indiaBisStatus?: 'VERIFIED_CURRENT' | 'NOT_VERIFIED' | 'WITHDRAWN' | 'SUPERSEDED' | 'NOT_APPLICABLE';
  euScopeName: string;
  euRegulationFramework?: string;
  carbCategoryName: string;
  isConsumerProduct: boolean;
  isWashOffProduct: boolean;
  requiresAllergenDisclosure: boolean;
  requiresUfiNotification: boolean;
  requiresLegalMetrologyMRP: boolean;
  provenanceNote?: string;
}

export const CANONICAL_REGULATORY_SCOPES: Record<ProductCategoryId, RegulatoryScopeMapping> = {
  LAUNDRY_LIQUID: {
    categoryId: 'LAUNDRY_LIQUID',
    indiaBisStandard: 'IS 13080:2021 (Liquid Detergents for Household Laundry Use)',
    indiaBisStandardId: 'IS 13080:2021',
    indiaBisStatus: 'VERIFIED_CURRENT',
    euScopeName: 'Laundry Detergent (Liquid) (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Laundry Detergent (Liquid)',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'IS 13080:2021 verified Bureau of Indian Standards specification for household liquid laundry detergents.'
  },
  LAUNDRY_POWDER: {
    categoryId: 'LAUNDRY_POWDER',
    indiaBisStandard: 'IS 4955:2020 (Household Laundry Detergent Powders)',
    indiaBisStandardId: 'IS 4955:2020',
    indiaBisStatus: 'VERIFIED_CURRENT',
    euScopeName: 'Laundry Detergent (Powder) (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Laundry Detergent (Powder)',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'IS 4955:2020 (Fifth Revision, incorporating Amendment 1:2024) verified Bureau of Indian Standards specification for household laundry detergent powders.'
  },
  DISHWASH_MANUAL: {
    categoryId: 'DISHWASH_MANUAL',
    indiaBisStandard: undefined, // IS 14632 specifically covers dishwashing paste/cake, not general liquids
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Hand Dishwashing Detergent (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Dishwashing Detergent (Hand)',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'No dedicated BIS standard verified for liquid manual dishwashing formulations; status unverified.'
  },
  DISHWASH_AUTOMATIC: {
    categoryId: 'DISHWASH_AUTOMATIC',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Automatic Dishwasher Detergent (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Dishwashing Detergent (Automatic)',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: false,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'No dedicated BIS standard verified for automatic dishwasher detergents.'
  },
  FLOOR_CLEANER: {
    categoryId: 'FLOOR_CLEANER',
    // FORENSIC FIX: IS 869:2020 is Ethylene Dichloride, NOT disinfectant fluids or floor cleaners. Removed false mapping.
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'All-Purpose Hard Surface Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Floor Cleaner / Polish',
    isConsumerProduct: true,
    isWashOffProduct: false,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'IS 869 false mapping removed (IS 869:2020 specifies Ethylene Dichloride). No active BIS standard verified for general floor cleaners.'
  },
  MULTIPURPOSE_CLEANER: {
    categoryId: 'MULTIPURPOSE_CLEANER',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'General Purpose Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'General Purpose Cleaner',
    isConsumerProduct: true,
    isWashOffProduct: false,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'General surface cleaner guidance only; no mandatory BIS standard established.'
  },
  TOILET_CLEANER: {
    categoryId: 'TOILET_CLEANER',
    // AUTHORITATIVE BIS SUCCESSOR: IS 7983:1994 (withdrawn 2026-09-12) -> IS 7983:2026 Second Revision (effective 2026-03-12). Note: Citation IS 7983:2025 is NOT_VERIFIED in BIS registers.
    indiaBisStandard: 'IS 7983:2026 (Liquid Toilet Cleaner Hydrochloric Acid Based Specification, Second Revision)',
    indiaBisStandardId: 'IS 7983:2026',
    indiaBisStatus: 'VERIFIED_CURRENT',
    euScopeName: 'Sanitary / Toilet Bowl Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Bathroom / Tile / Toilet Cleaner',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: false,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'IS 7983:2026 Second Revision verified active standard (effective 2026-03-12, notified 2026-03-16), directly superseding IS 7983:1994 (withdrawn 2026-09-12). Citation IS 7983:2025 has no published gazetted record and is NOT_VERIFIED.'
  },
  BATHROOM_CLEANER: {
    categoryId: 'BATHROOM_CLEANER',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Bathroom Hard Surface Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Bathroom and Tile Cleaner',
    isConsumerProduct: true,
    isWashOffProduct: false,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true
  },
  GLASS_CLEANER: {
    categoryId: 'GLASS_CLEANER',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Glass Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Glass Cleaner',
    isConsumerProduct: true,
    isWashOffProduct: false,
    requiresAllergenDisclosure: false,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true
  },
  FABRIC_SOFTENER: {
    categoryId: 'FABRIC_SOFTENER',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Fabric Conditioner / Softener (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Fabric Softener (Liquid)',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: false,
    requiresLegalMetrologyMRP: true
  },
  HAND_WASH: {
    categoryId: 'HAND_WASH',
    indiaBisStandard: 'IS 4199: Liquid Soaps / Hand Wash Products',
    indiaBisStandardId: 'IS 4199',
    indiaBisStatus: 'VERIFIED_CURRENT',
    euScopeName: 'Cosmetics Regulation (EC) No 1223/2009 (Wash-Off Cosmetic)',
    euRegulationFramework: 'Regulation (EC) No 1223/2009 (Cosmetics)',
    carbCategoryName: 'Personal Care Hand Wash',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: false,
    requiresLegalMetrologyMRP: true,
    provenanceNote: 'Hand wash is legally regulated as a cosmetic in the EU (EC 1223/2009), not under detergent regulations.'
  },
  KITCHEN_DEGREASER: {
    categoryId: 'KITCHEN_DEGREASER',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Kitchen Degreaser / Heavy Duty Hard Surface Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Heavy-Duty Degreaser',
    isConsumerProduct: true,
    isWashOffProduct: false,
    requiresAllergenDisclosure: false,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true
  },
  CAR_SHAMPOO: {
    categoryId: 'CAR_SHAMPOO',
    indiaBisStandard: undefined,
    indiaBisStandardId: undefined,
    indiaBisStatus: 'NOT_VERIFIED',
    euScopeName: 'Automotive Wash Cleaner (EC No 648/2004 & EU 2026/405 Transition)',
    euRegulationFramework: 'Regulation (EC) No 648/2004 / Regulation (EU) 2026/405',
    carbCategoryName: 'Automotive Wash Product',
    isConsumerProduct: true,
    isWashOffProduct: true,
    requiresAllergenDisclosure: true,
    requiresUfiNotification: true,
    requiresLegalMetrologyMRP: true
  }
};

export class RegulatoryProductScopeEngine {
  public static resolveProductScope(
    category?: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY'
  ): {
    isKnown: boolean;
    categoryId?: ProductCategoryId;
    mapping?: RegulatoryScopeMapping;
    reason: string;
  } {
    if (!category || category === 'UNKNOWN_PRODUCT_CATEGORY' || !CANONICAL_REGULATORY_SCOPES[category]) {
      return {
        isKnown: false,
        reason: 'Product category is UNKNOWN or omitted. Regulatory evaluation scoped as REGULATORY_SCOPE_UNKNOWN. User selection required.'
      };
    }

    return {
      isKnown: true,
      categoryId: category,
      mapping: CANONICAL_REGULATORY_SCOPES[category],
      reason: `Successfully scoped regulatory evaluation to canonical category '${category}'.`
    };
  }
}

/**
 * ============================================================================
 * P4.1 — CENTRALIZED INGREDIENT IDENTITY & REGULATORY METADATA SSOT
 * ============================================================================
 * Authoritative single source of truth for identity-level metadata:
 * 1. Chemical identifiers (CAS RN, INCI, chemical name, synonyms, trade names)
 * 2. Structured chemical family / classification / charge class
 * 3. Property-level evidence and provenance (Levels 1 to 8)
 * 4. Identity status & confidence (IDENTIFIED, PARTIALLY_IDENTIFIED, AMBIGUOUS, UNKNOWN)
 * 5. Context-aware regulatory identity and jurisdictional restrictions
 * 6. Historical metadata versioning & reproducibility
 * ============================================================================
 */

import { AUTHORITATIVE_HLB_BENCHMARKS } from '../../utils/hlbEngine';
import { AUTHORITATIVE_ACTIVE_BENCHMARKS } from '../../utils/activeMatterEngine';

export type IdentityStatus = 'IDENTIFIED' | 'PARTIALLY_IDENTIFIED' | 'AMBIGUOUS' | 'UNKNOWN';

export type EvidenceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type SourceType =
  | 'LAB_MEASUREMENT_COA'
  | 'MANUFACTURER_TDS_SDS'
  | 'REGULATORY_GOVERNMENT_BODY'
  | 'PEER_REVIEWED_LITERATURE'
  | 'ESTABLISHED_TECHNICAL_REFERENCE'
  | 'QUALIFIED_MODEL_ESTIMATE'
  | 'HEURISTIC_ASSUMPTION'
  | 'UNKNOWN';

export interface PropertyProvenance {
  property: string;
  value: any;
  unit?: string;
  source: string;
  sourceType: SourceType;
  evidenceLevel: EvidenceLevel;
  verificationStatus: 'VERIFIED' | 'SOURCE_BACKED' | 'ESTIMATED' | 'UNKNOWN' | 'CONFLICTING_EVIDENCE';
  verificationDate: string;
}

export interface RegulatoryIdentity {
  jurisdiction: string; // e.g. 'EU', 'US', 'GLOBAL'
  authority: string; // e.g. 'ECHA REACH', 'US EPA', 'IFRA'
  status: 'APPROVED' | 'RESTRICTED' | 'PROHIBITED' | 'CONDITIONAL' | 'UNKNOWN';
  restrictions?: string[];
  maxConcentrationPct?: number;
  productCategoryScope?: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  provenance: PropertyProvenance;
}

export interface IngredientIdentityMetadata {
  ingredientId: string;
  canonicalName: string;
  chemicalName: string;
  casRn: string | null; // Structured CAS RN or null (never fake "N/A" or "0")
  molecularFormula?: string;
  molecularWeight?: number;
  inciName: string | null; // INCI nomenclature or null
  synonyms: string[];
  tradeNames: string[];
  chemicalFamily: string; // e.g. 'SURFACTANT', 'BUILDER', 'ACID', 'BASE', 'CHELATOR', etc.
  chemicalSubfamily: string; // e.g. 'ANIONIC_SULFONATE', 'CARBONATE'
  functionalClass: string;
  chargeClass: 'ANIONIC' | 'CATIONIC' | 'AMPHOTERIC' | 'NONIONIC' | 'NEUTRAL';
  physicalForm: 'LIQUID' | 'SOLID' | 'GEL' | 'POWDER' | 'GAS' | 'UNKNOWN';
  identityStatus: IdentityStatus;
  identityConfidence: number; // 0 to 100
  regulatoryIdentities: RegulatoryIdentity[];
  provenanceMap: Record<string, PropertyProvenance>;
  version: string;
  effectiveFrom: string;
}

export interface IdentityResolutionResult {
  resolved: boolean;
  identity: IngredientIdentityMetadata | null;
  status: IdentityStatus;
  candidates: Array<{ ingredientId: string; name: string; score: number }>;
  ambiguityReason?: string;
  warnings: string[];
  provenance: string;
}

/**
 * Master Registry of Authoritative Ingredient Identities
 */
const AUTHORITATIVE_IDENTITY_REGISTRY: Record<string, IngredientIdentityMetadata> = {
  'labsa': {
    ingredientId: 'labsa',
    canonicalName: 'Linear Alkylbenzene Sulfonic Acid',
    chemicalName: '4-C10-13-sec-alkyl derivatives of benzenesulfonic acid',
    casRn: '27176-87-0',
    molecularFormula: 'C18H30O3S',
    molecularWeight: 326.49,
    inciName: 'Dodecylbenzene Sulfonic Acid',
    synonyms: ['LABSA', 'Acid Slurry', 'Dodecylbenzenesulphonic acid', 'LAS Acid'],
    tradeNames: ['Calsoft LAS-99', 'Maranil LABSA', 'Bio-Soft S-101'],
    chemicalFamily: 'SURFACTANT',
    chemicalSubfamily: 'ANIONIC_SULFONATE',
    functionalClass: 'Anionic Surfactant / Primary Detergent Active',
    chargeClass: 'ANIONIC',
    physicalForm: 'LIQUID',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 98,
    regulatoryIdentities: [
      {
        jurisdiction: 'EU',
        authority: 'ECHA REACH',
        status: 'APPROVED',
        restrictions: ['Industrial and professional use neutralization required'],
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'ECHA REACH Dossier 27176-87-0',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '27176-87-0',
        source: 'CAS Registry & IUPAC Standard',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      },
      inciName: {
        property: 'inciName',
        value: 'Dodecylbenzene Sulfonic Acid',
        source: 'Personal Care Products Council (PCPC) INCI Dictionary',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  },
  'sodium_hydroxide': {
    ingredientId: 'sodium_hydroxide',
    canonicalName: 'Sodium Hydroxide',
    chemicalName: 'Sodium Hydroxide',
    casRn: '1310-73-2',
    molecularFormula: 'NaOH',
    molecularWeight: 39.997,
    inciName: 'Sodium Hydroxide',
    synonyms: ['Caustic Soda', 'Lye', 'Sodium hydrate'],
    tradeNames: ['Caustic Soda Flakes', 'Liquid Caustic Soda 48% / 50%'],
    chemicalFamily: 'BASE',
    chemicalSubfamily: 'STRONG_BASE',
    functionalClass: 'Alkaline Agent / Neutralizer',
    chargeClass: 'ANIONIC',
    physicalForm: 'SOLID',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 100,
    regulatoryIdentities: [
      {
        jurisdiction: 'EU',
        authority: 'ECHA REACH',
        status: 'APPROVED',
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'ECHA REACH Dossier 1310-73-2',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '1310-73-2',
        source: 'CAS Registry',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  },
  'citric_acid': {
    ingredientId: 'citric_acid',
    canonicalName: 'Citric Acid Anhydrous',
    chemicalName: '2-hydroxypropane-1,2,3-tricarboxylic acid',
    casRn: '77-92-9',
    molecularFormula: 'C6H8O7',
    molecularWeight: 192.12,
    inciName: 'Citric Acid',
    synonyms: ['Citric acid anhydrous', '2-Hydroxy-1,2,3-propanetricarboxylic acid'],
    tradeNames: ['Citric Acid Fine Granular'],
    chemicalFamily: 'ACID',
    chemicalSubfamily: 'CARBOXYLIC_WEAK_ACID',
    functionalClass: 'Chelating Agent / pH Adjuster / Organic Acid',
    chargeClass: 'NEUTRAL',
    physicalForm: 'POWDER',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 100,
    regulatoryIdentities: [
      {
        jurisdiction: 'GLOBAL',
        authority: 'FDA / ECHA',
        status: 'APPROVED',
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'FDA GRAS & REACH Dossier 77-92-9',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '77-92-9',
        source: 'CAS Registry',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  },
  'sodium_bicarbonate': {
    ingredientId: 'sodium_bicarbonate',
    canonicalName: 'Sodium Bicarbonate',
    chemicalName: 'Sodium hydrogen carbonate',
    casRn: '144-55-8',
    molecularFormula: 'NaHCO3',
    molecularWeight: 84.007,
    inciName: 'Sodium Bicarbonate',
    synonyms: ['Baking Soda', 'Sodium hydrogen carbonate', 'Bicarbonate of soda', 'Sodium acid carbonate', 'nahco3', 'sodium-bicarbonate'],
    tradeNames: ['Baking Soda', 'Sodium Bicarbonate USP', 'Sodium Bicarbonate Technical Grade'],
    chemicalFamily: 'BUILDER',
    chemicalSubfamily: 'INORGANIC_BUFFER',
    functionalClass: 'Mild Alkaline Buffer & Odor Neutralizer',
    chargeClass: 'NEUTRAL',
    physicalForm: 'POWDER',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 100,
    regulatoryIdentities: [
      {
        jurisdiction: 'GLOBAL',
        authority: 'FDA / ECHA REACH',
        status: 'APPROVED',
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'FDA GRAS 21 CFR 184.1736 & ECHA REACH Dossier 144-55-8',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '144-55-8',
        source: 'CAS Registry & IUPAC Standard',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      },
      inciName: {
        property: 'inciName',
        value: 'Sodium Bicarbonate',
        source: 'Personal Care Products Council (PCPC) INCI Dictionary',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  },
  'sodium_sesquicarbonate': {
    ingredientId: 'sodium_sesquicarbonate',
    canonicalName: 'Sodium Sesquicarbonate',
    chemicalName: 'Trisodium hydrogendicarbonate dihydrate',
    casRn: '533-96-0',
    molecularFormula: 'Na3H(CO3)2·2H2O',
    molecularWeight: 226.03,
    inciName: 'Sodium Sesquicarbonate',
    synonyms: ['Trisodium hydrogendicarbonate', 'Sodium sesquicarbonate dihydrate', 'Trona mineral', 'sodium-sesquicarbonate'],
    tradeNames: ['Sodium Sesquicarbonate Technical Grade', 'Crex'],
    chemicalFamily: 'BUILDER',
    chemicalSubfamily: 'INORGANIC_BUFFER',
    functionalClass: 'Crystalline Alkaline Buffer & Mild Builder',
    chargeClass: 'NEUTRAL',
    physicalForm: 'SOLID',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 98,
    regulatoryIdentities: [
      {
        jurisdiction: 'GLOBAL',
        authority: 'ECHA REACH / EU Food Additive E500(iii)',
        status: 'APPROVED',
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'ECHA REACH Dossier 533-96-0',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '533-96-0',
        source: 'CAS Registry (CAS RN: 533-96-0)',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  },
  'pvno': {
    ingredientId: 'pvno',
    canonicalName: 'Poly(4-vinylpyridine N-oxide)',
    chemicalName: '4-ethenylpyridine 1-oxide homopolymer',
    casRn: '26715-00-4',
    molecularFormula: '(C7H7NO)n',
    inciName: 'Polyvinylpyridine N-Oxide',
    synonyms: ['PVNO', 'PVPNO', 'Polyvinylpyridine N-Oxide', 'Poly(4-vinylpyridine-1-oxide)', 'pvno-40'],
    tradeNames: ['Chromabond S-100', 'PVNO 40% Liquid'],
    chemicalFamily: 'POLYMER',
    chemicalSubfamily: 'DYE_TRANSFER_INHIBITOR',
    functionalClass: 'Premium Dye Transfer Inhibitor Polymer',
    chargeClass: 'NONIONIC',
    physicalForm: 'LIQUID',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 96,
    regulatoryIdentities: [
      {
        jurisdiction: 'GLOBAL',
        authority: 'ECHA / US EPA TSCA',
        status: 'APPROVED',
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'US EPA TSCA Inventory & ECHA List 607-969-9',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '26715-00-4',
        source: 'CAS Registry & Polymer Technical Reference (CAS RN: 26715-00-4)',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  },
  'potassium_xylene_sulfonate': {
    ingredientId: 'potassium_xylene_sulfonate',
    canonicalName: 'Potassium Xylene Sulfonate',
    chemicalName: 'Potassium dimethylbenzenesulfonate (mixed isomers)',
    casRn: '30346-73-7',
    molecularFormula: 'C8H9KO3S',
    molecularWeight: 224.32,
    inciName: 'Potassium Xylene Sulfonate',
    synonyms: ['PXS', 'Potassium xylenesulfonate', 'Potassium dimethylbenzenesulfonate', 'pxs-40'],
    tradeNames: ['Stepanate KX', 'PXS 40%'],
    chemicalFamily: 'SOLVENT_HYDROTROPE',
    chemicalSubfamily: 'ARYL_SULFONATE_HYDROTROPE',
    functionalClass: 'High Solubility Potassium Hydrotrope & Coupling Agent',
    chargeClass: 'ANIONIC',
    physicalForm: 'LIQUID',
    identityStatus: 'IDENTIFIED',
    identityConfidence: 98,
    regulatoryIdentities: [
      {
        jurisdiction: 'GLOBAL',
        authority: 'ECHA REACH / US EPA TSCA',
        status: 'APPROVED',
        effectiveFrom: '2010-01-01',
        provenance: {
          property: 'regulatoryStatus',
          value: 'APPROVED',
          source: 'ECHA REACH Dossier 30346-73-7',
          sourceType: 'REGULATORY_GOVERNMENT_BODY',
          evidenceLevel: 3,
          verificationStatus: 'VERIFIED',
          verificationDate: '2026-01-01'
        }
      }
    ],
    provenanceMap: {
      casRn: {
        property: 'casRn',
        value: '30346-73-7',
        source: 'CAS Registry (CAS RN: 30346-73-7)',
        sourceType: 'ESTABLISHED_TECHNICAL_REFERENCE',
        evidenceLevel: 5,
        verificationStatus: 'VERIFIED',
        verificationDate: '2026-01-01'
      }
    },
    version: '2026.1',
    effectiveFrom: '2026-01-01'
  }
};

export class IngredientIdentitySSOT {
  /**
   * Authoritative Resolver for Ingredient Identity Metadata
   */
  public static resolveIngredientIdentity(input: string | { name?: string; casNumber?: string; inciName?: string }): IdentityResolutionResult {
    const rawQuery = typeof input === 'string' ? input : (input.name || input.casNumber || input.inciName || '');
    const q = rawQuery.trim().toLowerCase();

    if (!q) {
      return {
        resolved: false,
        identity: null,
        status: 'UNKNOWN',
        candidates: [],
        ambiguityReason: 'Empty search query provided.',
        warnings: ['No ingredient identifier or name supplied.'],
        provenance: 'IngredientIdentitySSOT-Resolver'
      };
    }

    // 1. Exact match against keys, CAS, INCI, synonyms, trade names
    for (const id of Object.keys(AUTHORITATIVE_IDENTITY_REGISTRY)) {
      const item = AUTHORITATIVE_IDENTITY_REGISTRY[id];
      if (
        item.ingredientId.toLowerCase() === q ||
        item.canonicalName.toLowerCase() === q ||
        (item.casRn && item.casRn.toLowerCase() === q) ||
        (item.inciName && item.inciName.toLowerCase() === q) ||
        item.synonyms.some(s => s.toLowerCase() === q) ||
        item.tradeNames.some(t => t.toLowerCase() === q)
      ) {
        return {
          resolved: true,
          identity: item,
          status: item.identityStatus,
          candidates: [{ ingredientId: item.ingredientId, name: item.canonicalName, score: 100 }],
          warnings: [],
          provenance: 'Exact Match SSOT Registry'
        };
      }
    }

    // 2. Partial / Fuzzy match or fallback to UNKNOWN / AMBIGUOUS
    const matches: Array<{ ingredientId: string; name: string; score: number }> = [];
    for (const id of Object.keys(AUTHORITATIVE_IDENTITY_REGISTRY)) {
      const item = AUTHORITATIVE_IDENTITY_REGISTRY[id];
      if (
        item.canonicalName.toLowerCase().includes(q) ||
        item.synonyms.some(s => s.toLowerCase().includes(q)) ||
        item.tradeNames.some(t => t.toLowerCase().includes(q))
      ) {
        matches.push({ ingredientId: item.ingredientId, name: item.canonicalName, score: 80 });
      }
    }

    if (matches.length === 1) {
      const matchedItem = AUTHORITATIVE_IDENTITY_REGISTRY[matches[0].ingredientId];
      return {
        resolved: true,
        identity: matchedItem,
        status: matchedItem.identityStatus,
        candidates: matches,
        warnings: ['Resolved via partial substring match.'],
        provenance: 'Partial Match SSOT Registry'
      };
    }

    if (matches.length > 1) {
      return {
        resolved: false,
        identity: null,
        status: 'AMBIGUOUS',
        candidates: matches,
        ambiguityReason: `Multiple ingredient candidates matched query "${rawQuery}".`,
        warnings: ['Ambiguous identity search result.'],
        provenance: 'Ambiguous Match SSOT Registry'
      };
    }

    // 3. Completely unknown ingredient
    return {
      resolved: false,
      identity: null,
      status: 'UNKNOWN',
      candidates: [],
      ambiguityReason: `No authoritative identity metadata found for "${rawQuery}".`,
      warnings: ['Ingredient identity is UNKNOWN. Refusing to fabricate properties.'],
      provenance: 'Unknown Identity Firewall'
    };
  }

  /**
   * Context-Aware Regulatory Status Resolver
   */
  public static resolveRegulatoryStatus(
    ingredientId: string,
    jurisdiction: string = 'EU',
    _productCategory?: string
  ): { status: string; restrictions: string[]; source: string } {
    const item = AUTHORITATIVE_IDENTITY_REGISTRY[ingredientId.toLowerCase()];
    if (!item) {
      return {
        status: 'UNKNOWN',
        restrictions: ['Ingredient identity unknown; regulatory compliance cannot be verified.'],
        source: 'Unknown Identity'
      };
    }

    const reg = item.regulatoryIdentities.find(r => r.jurisdiction.toUpperCase() === jurisdiction.toUpperCase() || r.jurisdiction === 'GLOBAL');
    if (!reg) {
      return {
        status: 'UNKNOWN',
        restrictions: [`No specific regulatory listing found for jurisdiction "${jurisdiction}".`],
        source: 'Unlisted Jurisdiction'
      };
    }

    return {
      status: reg.status,
      restrictions: reg.restrictions || [],
      source: reg.provenance.source
    };
  }

  /**
   * Authoritative HLB benchmarks fetched through SSOT
   */
  public static getHLBBenchmarks(): Array<{ name: string; hlb: number }> {
    return AUTHORITATIVE_HLB_BENCHMARKS.map((b) => ({
      name: b.name,
      hlb: b.hlb
    }));
  }

  /**
   * Authoritative Active Matter benchmarks fetched through SSOT
   */
  public static getActiveMatterBenchmarks(): Array<{ name: string; purity: number }> {
    return AUTHORITATIVE_ACTIVE_BENCHMARKS.map((b) => ({
      name: b.name,
      purity: b.activeDefault
    }));
  }
}

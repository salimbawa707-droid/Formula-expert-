import { PURE_SURFACTANT_CMC_REFERENCES, PureSurfactantCmcReference } from '../data/experimentalReferenceData';
import { FormulationIngredient } from '../types';
import { UNIVERSAL_INGREDIENTS } from '../data/universalIngredientLibrary';

export type Eng002InputEligibility = 'FULLY_SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_INPUTS';
export type ActiveMatterInputSource = 'SOURCE_BACKED' | 'CATALOG_DEFAULT' | 'USER_ENTERED' | 'UNKNOWN';

export interface Eng002PureComponentReference {
  chemicalKey: 'SDS' | 'DDAO';
  chemicalName: string;
  casNumber: string;
  molecularWeightGPerMol: number;
  cmcMolar: number;
  cmcUnit: 'M';
  chargeClass: 'anionic' | 'amphoteric';
  evidence: PureSurfactantCmcReference;
  identityEvidence: string;
  applicabilityNote: string;
}

export type Eng002ReferenceResolution =
  | { supported: true; reference: Eng002PureComponentReference }
  | { supported: false; reason: string };

const SLS_CATALOG_IDS = new Set([
  'sls-needles', 'sls-30',
  'sls-needles-tech', 'sls-needles-pure', 'sls-needles-sol',
  'sls-30-tech', 'sls-30-pure', 'sls-30-sol'
]);

const SDS_REFERENCE: Eng002PureComponentReference = {
  chemicalKey: 'SDS',
  chemicalName: 'Sodium dodecyl sulfate (sodium lauryl sulfate)',
  casNumber: '151-21-3',
  molecularWeightGPerMol: 288.3,
  cmcMolar: PURE_SURFACTANT_CMC_REFERENCES.SLS.valueMolar,
  cmcUnit: 'M',
  chargeClass: 'anionic',
  evidence: PURE_SURFACTANT_CMC_REFERENCES.SLS,
  identityEvidence: 'PSDI/NIST CMC_Compounds.csv compound 1; NIST NSRDS 36 table names sodium dodecyl 1 sulfate. Catalog CAS 151-21-3 must match.',
  applicabilityNote: 'Pure aqueous C12 SDS reference at 25 °C. PSDI compound table records 288.3 g/mol (lookup value 288.38; initial method is noted as LLM name/weight), so MW provenance is source-recorded with identity review caveat.'
};

const DDAO_REFERENCE: Eng002PureComponentReference = {
  chemicalKey: 'DDAO',
  chemicalName: 'Dimethyldodecylamine oxide (C12 DDAO)',
  casNumber: '1643-20-5',
  molecularWeightGPerMol: 229.4,
  cmcMolar: PURE_SURFACTANT_CMC_REFERENCES.AMINE_OXIDE_C12.valueMolar,
  cmcUnit: 'M',
  chargeClass: 'amphoteric',
  evidence: PURE_SURFACTANT_CMC_REFERENCES.AMINE_OXIDE_C12,
  identityEvidence: 'PSDI/NIST CMC compound 21; exact CAS and SINGLE_SUBSTANCE identity are required.',
  applicabilityNote: 'Reference is pure C12 dimethyldodecylamine oxide at 27 °C without added salt. Broad lauramine oxide/C12-14 commercial blends and protonated forms are not covered.'
};

function normalizedCas(value: unknown): string {
  return String(value ?? '').trim();
}

export function validateEng002PureComponentReference(reference: Partial<Eng002PureComponentReference>): string[] {
  const reasons: string[] = [];
  if (!Number.isFinite(reference.molecularWeightGPerMol) || Number(reference.molecularWeightGPerMol) <= 0) {
    reasons.push('MISSING_OR_INVALID_MOLECULAR_WEIGHT');
  }
  if (!Number.isFinite(reference.cmcMolar) || Number(reference.cmcMolar) <= 0) {
    reasons.push('MISSING_OR_INVALID_PURE_COMPONENT_CMC');
  }
  if (reference.cmcUnit !== 'M') reasons.push('MISSING_OR_UNSUPPORTED_CMC_UNIT');
  return reasons;
}

function resolveSupportedReference(reference: Eng002PureComponentReference): Eng002ReferenceResolution {
  const missing = validateEng002PureComponentReference(reference);
  return missing.length
    ? { supported: false, reason: `Curated reference input is incomplete: ${missing.join(', ')}.` }
    : { supported: true, reference };
}

/**
 * Resolve only chemical identities whose pure CMC and molar mass have a traceable
 * reference. Name-only matching is intentionally not sufficient for app predictions.
 */
export function resolveEng002PureComponent(ingredient: FormulationIngredient): Eng002ReferenceResolution {
  const id = String(ingredient.canonicalIngredientId ?? ingredient.id ?? '').trim();
  const cas = normalizedCas(ingredient.casNumber);
  if (id && SLS_CATALOG_IDS.has(id)) {
    if (cas && cas !== SDS_REFERENCE.casNumber) {
      return { supported: false, reason: `Canonical SLS record ${id} has conflicting CAS ${cas}; expected ${SDS_REFERENCE.casNumber}.` };
    }
    if (ingredient.identityType === 'PROPRIETARY_BLEND' || ingredient.identityType === 'COMMERCIAL_UVCB') {
      return { supported: false, reason: `Canonical record ${id} is declared as a blend/UVCB, so a single-component SDS CMC cannot be assigned without composition metadata.` };
    }
    return resolveSupportedReference(SDS_REFERENCE);
  }
  if (cas === SDS_REFERENCE.casNumber && ingredient.identityType === 'SINGLE_SUBSTANCE') {
    return resolveSupportedReference(SDS_REFERENCE);
  }
  if (cas === DDAO_REFERENCE.casNumber && ingredient.identityType === 'SINGLE_SUBSTANCE') {
    return resolveSupportedReference(DDAO_REFERENCE);
  }
  if (cas && cas !== SDS_REFERENCE.casNumber && cas !== DDAO_REFERENCE.casNumber) {
    return { supported: false, reason: `No curated pure-CMC and molecular-weight reference applies to CAS ${cas}.` };
  }
  return {
    supported: false,
    reason: 'Exact chemical identity is not established by a supported canonical ID or CAS plus SINGLE_SUBSTANCE identity; name aliases and broad commercial labels are insufficient.'
  };
}

export interface Eng002CatalogRecordDecision {
  canonicalIngredientId: string;
  displayName: string;
  category: string;
  casNumber: string | null;
  inciName: string;
  rawMaterialIdentityType: string;
  activeMatterDefaultPct: number | null;
  activeMatterDefaultProvenance: string;
  chemicalIdentityStatus: string;
  molecularWeightGPerMol: number | null;
  molecularWeightProvenance: string;
  pureCmcValue: number | null;
  pureCmcUnit: string;
  pureCmcTemperatureC: number | null;
  pureCmcMethod: string;
  pureCmcProvenance: string;
  datasetLicense: string;
  eligibility: Eng002InputEligibility;
  decisionReason: string;
}

export interface Eng002CatalogEligibilityReport {
  auditId: string;
  sourceCommit: string;
  catalogRecordCount: number;
  counts: Record<Eng002InputEligibility, number>;
  eligibilityRules: string[];
  records: Eng002CatalogRecordDecision[];
  scope: string[];
}

export function buildEng002CatalogEligibilityReport(): Eng002CatalogEligibilityReport {
  const surfactants = UNIVERSAL_INGREDIENTS
    .filter(item => String(item.category ?? '').toLowerCase().includes('surfactant'));
  const records = surfactants.map(item => {
    const identityType = item.identityType ?? 'UNKNOWN';
    const isSdsRecord = SLS_CATALOG_IDS.has(item.id) && item.casNumber === SDS_REFERENCE.casNumber;
    const eligibility: Eng002InputEligibility = isSdsRecord ? 'PARTIALLY_SUPPORTED' : 'INSUFFICIENT_INPUTS';
    const decisionReason = isSdsRecord
      ? 'Exact catalog SDS identity and a pure-component reference exist, but catalog active-matter defaults have no lot-specific CoA/assay provenance. Prediction is permitted only with explicit limitations and never counts as formula validation.'
      : 'No exact traceable pure-component CMC and molecular-weight input applies to this catalog raw material; existing name-matched legacy values are heuristic or chemically out of scope and are blocked from app-facing Clint predictions.';
    return {
      canonicalIngredientId: item.id,
      displayName: item.name,
      category: item.category,
      casNumber: item.casNumber,
      inciName: item.inciName,
      rawMaterialIdentityType: identityType,
      activeMatterDefaultPct: Number.isFinite(Number(item.activeDefault)) ? Number(item.activeDefault) : null,
      activeMatterDefaultProvenance: item.provenance?.verificationStatus === 'VERIFIED'
        ? 'CATALOG_DEFAULT; catalog provenance labels verified but no lot-specific assay/certificate is linked'
        : item.activeDefault === undefined ? 'UNKNOWN' : 'CATALOG_DEFAULT; no lot-specific assay/certificate linked',
      chemicalIdentityStatus: item.casNumber
        ? (identityType === 'SINGLE_SUBSTANCE' ? 'CAS_AND_SINGLE_SUBSTANCE' : 'CAS_PRESENT_COMPOSITION_OR_SPECIES_NOT_ESTABLISHED')
        : 'UNKNOWN',
      molecularWeightGPerMol: isSdsRecord ? SDS_REFERENCE.molecularWeightGPerMol : null,
      molecularWeightProvenance: isSdsRecord
        ? 'SOURCE_BACKED_WITH_PSDI_IDENTITY_METHOD_CAVEAT'
        : 'UNKNOWN',
      pureCmcValue: isSdsRecord ? SDS_REFERENCE.cmcMolar : null,
      pureCmcUnit: isSdsRecord ? 'mol/L' : 'UNKNOWN',
      pureCmcTemperatureC: isSdsRecord ? SDS_REFERENCE.evidence.temperatureC : null,
      pureCmcMethod: isSdsRecord ? SDS_REFERENCE.evidence.method : 'UNKNOWN',
      pureCmcProvenance: isSdsRecord ? 'SOURCE_BACKED' : 'UNKNOWN_OR_NOT_APPLICABLE',
      datasetLicense: isSdsRecord ? SDS_REFERENCE.evidence.license : 'NOT_APPLICABLE_TO_CATALOG_MATCH',
      eligibility,
      decisionReason
    };
  });
  const counts = {
    FULLY_SUPPORTED: records.filter(r => r.eligibility === 'FULLY_SUPPORTED').length,
    PARTIALLY_SUPPORTED: records.filter(r => r.eligibility === 'PARTIALLY_SUPPORTED').length,
    INSUFFICIENT_INPUTS: records.filter(r => r.eligibility === 'INSUFFICIENT_INPUTS').length
  };
  return {
    auditId: 'TASK5-ENG002-INPUT-PROVENANCE-v1',
    sourceCommit: 'fc0cf2c4412f532c4c3a4c1b4c10cd382f540d94',
    catalogRecordCount: records.length,
    counts,
    eligibilityRules: [
      'FULLY_SUPPORTED requires supported exact chemical identity, pure-CMC and MW source records, explicit valid formulation dose, and SOURCE_BACKED active-matter provenance with both evidence ID and source URL/location metadata.',
      'PARTIALLY_SUPPORTED is limited to exact canonical SLS/SDS catalog identities with a sourced pure CMC/MW; active matter is only a catalog default or user-entered value without linked lot-specific assay provenance.',
      'INSUFFICIENT_INPUTS applies when exact identity or a traceable matching pure-CMC/MW pair is absent or ambiguous. No name-only fallback, unrelated compound substitution, or omission of unsupported surfactants is allowed.',
      'Catalog eligibility is component/input scope only; the Clint result remains MODEL_PREDICTION and does not establish finished-formula validation.'
    ],
    records,
    scope: [
      'Only canonical ingredient records whose category contains Surfactant are counted.',
      'Historical broad-name CMC mappings remain available only for compatibility/descriptive comparisons and are marked HEURISTIC_SCREENING; app-facing calculateMixedCMC does not consume them.',
      'Catalog activeDefault percentages are not lot-specific CoA or assay results.'
    ]
  };
}

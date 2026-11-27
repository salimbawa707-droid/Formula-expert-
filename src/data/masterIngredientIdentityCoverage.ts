import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';
import { IngredientIdentitySSOT } from '../domain/ingredients/ingredientIdentitySSOT';

export type IngredientIdentityCoverageStatus =
  | 'EXACT_CAS_INCI_SSOT_MATCH'
  | 'CAS_INCI_CONFLICT_OR_AMBIGUOUS'
  | 'NO_EXACT_SSOT_MATCH';

export interface IngredientIdentityCoverageRow {
  ingredientId: string;
  ingredientName: string;
  casNumber: string | null;
  inciName: string;
  identityCoverageStatus: IngredientIdentityCoverageStatus;
  ssotIdentityId: string | null;
  ssotCanonicalName: string | null;
  ssotIdentityStatus: string | null;
  ssotCasEvidenceSource: string | null;
  ssotInciEvidenceSource: string | null;
  gradeSpecificEvidenceStatus: 'NOT_ESTABLISHED_BY_IDENTITY_SSOT';
  catalogProvenanceStatus: 'PRESENT' | 'MISSING';
  catalogProvenanceUrlStatus: 'URL_PRESENT' | 'URL_MISSING';
  unresolvedReason: string | null;
  missingCatalogFields: string[];
  activeDefaultPresentButSupplierAssayMissing: boolean;
}

/**
 * Exact identity crosswalk only. A shared CAS or INCI alone is not sufficient
 * to map a commercial grade, and an SSOT identity record never proves grade
 * purity, active matter, supplier specification, or suitability.
 */
export const MASTER_INGREDIENT_IDENTITY_COVERAGE: IngredientIdentityCoverageRow[] =
  UNIVERSAL_INGREDIENTS.map((ingredient) => {
    const casResult = ingredient.casNumber
      ? IngredientIdentitySSOT.resolveIngredientIdentity(ingredient.casNumber)
      : null;
    const inciResult = ingredient.inciName
      ? IngredientIdentitySSOT.resolveIngredientIdentity(ingredient.inciName)
      : null;
    const casIdentity = casResult?.resolved ? casResult.identity : null;
    const inciIdentity = inciResult?.resolved ? inciResult.identity : null;
    const exact =
      Boolean(ingredient.casNumber && ingredient.inciName && casIdentity && inciIdentity) &&
      casIdentity!.ingredientId === inciIdentity!.ingredientId &&
      casIdentity!.casRn === ingredient.casNumber &&
      casIdentity!.inciName?.trim().toLowerCase() === ingredient.inciName.trim().toLowerCase();
    const ambiguous =
      casResult?.status === 'AMBIGUOUS' ||
      inciResult?.status === 'AMBIGUOUS' ||
      Boolean(casIdentity && inciIdentity && casIdentity.ingredientId !== inciIdentity.ingredientId);

    const identity = exact ? casIdentity : null;
    const casEvidence = identity?.provenanceMap.casRn;
    const inciEvidence = identity?.provenanceMap.inciName;

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      casNumber: ingredient.casNumber,
      inciName: ingredient.inciName,
      identityCoverageStatus: exact
        ? 'EXACT_CAS_INCI_SSOT_MATCH'
        : ambiguous
          ? 'CAS_INCI_CONFLICT_OR_AMBIGUOUS'
          : 'NO_EXACT_SSOT_MATCH',
      ssotIdentityId: identity?.ingredientId ?? null,
      ssotCanonicalName: identity?.canonicalName ?? null,
      ssotIdentityStatus: identity?.identityStatus ?? null,
      ssotCasEvidenceSource: casEvidence?.source ?? null,
      ssotInciEvidenceSource: inciEvidence?.source ?? null,
      gradeSpecificEvidenceStatus: 'NOT_ESTABLISHED_BY_IDENTITY_SSOT',
      catalogProvenanceStatus: ingredient.provenance ? 'PRESENT' : 'MISSING',
      catalogProvenanceUrlStatus: ingredient.provenance?.sourceUrl ? 'URL_PRESENT' : 'URL_MISSING',
      missingCatalogFields: [
        ...(ingredient.casNumber == null ? ['CAS number'] : []),
        ...(ingredient.identityType == null ? ['identityType'] : []),
        ...(ingredient.casStatus == null ? ['casStatus'] : []),
        ...(ingredient.manufacturer == null ? ['manufacturer'] : []),
        ...(ingredient.productName == null ? ['productName'] : []),
        ...(ingredient.activeMatter == null && ingredient.surfactantActiveMatterPct == null && ingredient.purityPct == null && ingredient.solidsPct == null ? ['supplier active/purity/solids assay'] : []),
        ...(ingredient.phMin == null || ingredient.phMax == null ? ['verified pH stability bounds'] : []),
        ...(!ingredient.provenance ? ['structured catalog provenance'] : []),
        ...(!ingredient.provenance?.sourceUrl ? ['catalog provenance URL'] : [])
      ],
      activeDefaultPresentButSupplierAssayMissing:
        ingredient.activeDefault != null &&
        ingredient.activeMatter == null &&
        ingredient.surfactantActiveMatterPct == null &&
        ingredient.purityPct == null &&
        ingredient.solidsPct == null,
      unresolvedReason: exact
        ? 'Identity-level CAS/INCI crosswalk only; exact commercial grade, manufacturer, assay, impurity profile and CoA/TDS/SDS remain unverified.'
        : ambiguous
          ? 'CAS and INCI resolution is ambiguous or points to different SSOT identities; manual source-backed reconciliation required.'
          : ingredient.casNumber
            ? 'No exact CAS+INCI match in the current 7-record identity SSOT; identity evidence must be added from authoritative sources.'
            : 'CAS is absent; proprietary/mixture identity must be resolved from full composition or supplier documentation, not guessed.'
    };
  });

export function getMasterIngredientIdentityCoverageSummary() {
  const rows = MASTER_INGREDIENT_IDENTITY_COVERAGE;
  const count = (status: IngredientIdentityCoverageStatus) =>
    rows.filter(row => row.identityCoverageStatus === status).length;
  return {
    ingredientCount: rows.length,
    uniqueIngredientIds: new Set(rows.map(row => row.ingredientId)).size,
    duplicateIngredientIds: rows.length - new Set(rows.map(row => row.ingredientId)).size,
    exactCasInciSsotMatches: count('EXACT_CAS_INCI_SSOT_MATCH'),
    ambiguousOrConflicting: count('CAS_INCI_CONFLICT_OR_AMBIGUOUS'),
    noExactSsotMatch: count('NO_EXACT_SSOT_MATCH'),
    catalogProvenanceRecords: rows.filter(row => row.catalogProvenanceStatus === 'PRESENT').length,
    catalogProvenanceUrlRecords: rows.filter(row => row.catalogProvenanceUrlStatus === 'URL_PRESENT').length,
    gradeSpecificEvidenceRecords: rows.filter(row => row.gradeSpecificEvidenceStatus !== 'NOT_ESTABLISHED_BY_IDENTITY_SSOT').length,
    missingFieldCounts: {
      identityType: rows.filter(row => row.missingCatalogFields.includes('identityType')).length,
      casStatus: rows.filter(row => row.missingCatalogFields.includes('casStatus')).length,
      manufacturer: rows.filter(row => row.missingCatalogFields.includes('manufacturer')).length,
      productName: rows.filter(row => row.missingCatalogFields.includes('productName')).length,
      supplierAssay: rows.filter(row => row.missingCatalogFields.includes('supplier active/purity/solids assay')).length,
      verifiedPHBounds: rows.filter(row => row.missingCatalogFields.includes('verified pH stability bounds')).length,
      structuredProvenance: rows.filter(row => row.missingCatalogFields.includes('structured catalog provenance')).length,
      provenanceUrl: rows.filter(row => row.missingCatalogFields.includes('catalog provenance URL')).length,
    },
    activeDefaultPresentButSupplierAssayMissing: rows.filter(row => row.activeDefaultPresentButSupplierAssayMissing).length,
    exactIdentityMatchesBySsotId: Object.fromEntries(
      [...new Set(rows.map(row => row.ssotIdentityId).filter((id): id is string => Boolean(id)))]
        .map(id => [id, rows.filter(row => row.ssotIdentityId === id).length])
    )
  };
}

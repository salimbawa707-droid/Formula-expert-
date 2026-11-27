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
    exactIdentityMatchesBySsotId: Object.fromEntries(
      [...new Set(rows.map(row => row.ssotIdentityId).filter((id): id is string => Boolean(id)))]
        .map(id => [id, rows.filter(row => row.ssotIdentityId === id).length])
    )
  };
}

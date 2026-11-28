import type { EngineeringReferenceProfile } from './universalIngredientLibrary';

export interface EngineeringReferenceValidation {
  valid: boolean;
  errors: string[];
}

export interface ResolvedEngineeringParameter {
  nominalValue: number;
  lowerBound?: number;
  upperBound?: number;
  unit: string;
  basis: string;
  evidenceClass: string;
  preliminaryOnly: true;
  lotReleaseEligible: false;
  warning: string;
}

export function validateEngineeringReferenceProfile(
  profile: EngineeringReferenceProfile,
): EngineeringReferenceValidation {
  const errors: string[] = [];
  if (!profile.profileId.trim()) errors.push('profileId is required');
  if (!profile.ingredientId.trim()) errors.push('ingredientId is required');
  if (!profile.profileVersion.trim()) errors.push('profileVersion is required');
  if (profile.lotSpecific !== false) errors.push('engineering reference profiles cannot be lot-specific');
  if (profile.formulaApplicabilityApproved !== false) errors.push('engineering reference profiles cannot approve formula applicability');
  if (profile.supplierIdentityVerified && profile.scope === 'ENGINEERING_ESTIMATE') {
    errors.push('an engineering estimate cannot verify supplier identity');
  }
  const seen = new Set<string>();
  for (const parameter of profile.parameters) {
    if (!parameter.parameter.trim()) errors.push('parameter name is required');
    if (seen.has(parameter.parameter)) errors.push(`duplicate parameter: ${parameter.parameter}`);
    seen.add(parameter.parameter);
    if (!parameter.unit.trim()) errors.push(`unit is required for ${parameter.parameter}`);
    if (parameter.useForLotRelease !== false) errors.push(`lot release must remain disabled for ${parameter.parameter}`);
    const values = [parameter.nominalValue, parameter.lowerBound, parameter.upperBound].filter(
      (value): value is number => value !== undefined,
    );
    if (values.some((value) => !Number.isFinite(value))) errors.push(`non-finite value in ${parameter.parameter}`);
    if (parameter.lowerBound !== undefined && parameter.upperBound !== undefined && parameter.lowerBound > parameter.upperBound) {
      errors.push(`lowerBound exceeds upperBound for ${parameter.parameter}`);
    }
    if (parameter.nominalValue !== undefined && parameter.lowerBound !== undefined && parameter.nominalValue < parameter.lowerBound) {
      errors.push(`nominalValue is below lowerBound for ${parameter.parameter}`);
    }
    if (parameter.nominalValue !== undefined && parameter.upperBound !== undefined && parameter.nominalValue > parameter.upperBound) {
      errors.push(`nominalValue is above upperBound for ${parameter.parameter}`);
    }
    if (parameter.evidenceClass === 'ENGINEERING_ESTIMATE' && !parameter.uncertaintyNote.trim()) {
      errors.push(`engineering estimate requires an uncertainty note for ${parameter.parameter}`);
    }
    if (parameter.useForPreliminaryCalculation && parameter.nominalValue === undefined) {
      errors.push(`preliminary calculation requires nominalValue for ${parameter.parameter}`);
    }
  }
  for (const source of profile.sourceReferences) {
    if (!source.sourceId.trim() || !source.publisher.trim() || !source.sourceUrl.trim()) {
      errors.push('source reference requires sourceId, publisher and sourceUrl');
    }
    if (source.supports.length === 0) errors.push(`source ${source.sourceId} must state what it supports`);
    if (source.doesNotSupport.length === 0) errors.push(`source ${source.sourceId} must state its limitations`);
  }
  return { valid: errors.length === 0, errors };
}

export function resolveEngineeringReferenceParameter(
  profile: EngineeringReferenceProfile,
  parameterName: string,
): ResolvedEngineeringParameter | null {
  const validation = validateEngineeringReferenceProfile(profile);
  if (!validation.valid) return null;
  const parameter = profile.parameters.find((item) => item.parameter === parameterName);
  if (!parameter || !parameter.useForPreliminaryCalculation || parameter.nominalValue === undefined) return null;
  return {
    nominalValue: parameter.nominalValue,
    lowerBound: parameter.lowerBound,
    upperBound: parameter.upperBound,
    unit: parameter.unit,
    basis: parameter.basis,
    evidenceClass: parameter.evidenceClass,
    preliminaryOnly: true,
    lotReleaseEligible: false,
    warning: 'Reference value only. Confirm the supplier grade and lot assay before production release.',
  };
}

export const ENGINEERING_REFERENCE_PROFILES: EngineeringReferenceProfile[] = [
  {
    profileId: 'ER-AOS-C14-16-001',
    profileVersion: '1.0.0',
    ingredientId: 'aos-38',
    scope: 'SUBSTANCE_IDENTITY_ONLY',
    parameters: [],
    sourceReferences: [
      {
        sourceId: 'FDA-SRS-UNII-O9W3D3YF5U',
        evidenceClass: 'PUBLIC_REGULATORY_IDENTITY',
        publisher: 'U.S. Food and Drug Administration — Substance Registration System',
        sourceUrl: 'https://precision.fda.gov/uniisearch/srs/unii/O9W3D3YF5U',
        supports: ['Sodium C14-16 Olefin Sulfonate substance name and CAS RN 68439-57-6 association'],
        doesNotSupport: ['AOS-38 supplier identity', '38% active matter', 'lot composition or assay'],
      },
      {
        sourceId: 'CANADA-AOS-CAS-68439-57-6',
        evidenceClass: 'PUBLIC_REGULATORY_IDENTITY',
        publisher: 'Environment and Climate Change Canada',
        sourceUrl: 'https://www.canada.ca/en/environment-climate-change/services/evaluating-existing-substances/screening-assessment-alkyl-sulfatesa-olefin-sulfonate-group-chemical-abstracts-service-registry-numbers-139.html',
        supports: ['CAS 68439-57-6 UVCB mixture identity and variable C14/C16 alkene/hydroxyalkane sulfonate composition'],
        doesNotSupport: ['Exact commercial homolog distribution', 'active matter of catalog grades', 'supplier or lot qualification'],
      },
      {
        sourceId: 'STEPAN-BIOTERGE-AS40CGP',
        evidenceClass: 'PRIMARY_SUPPLIER_TDS',
        publisher: 'Stepan Company',
        sourceUrl: 'https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/product-bulletins/surfactants/BIOTERGEAS40CGP.pdf',
        supports: ['Named BIO-TERGE AS-40 CG-P product identity and its own stated 39% active matter'],
        doesNotSupport: ['AOS-38 or AOS-92 catalog product specifications', 'catalog lot assay', 'transfer of the 39% value to another supplier or grade'],
      },
    ],
    limitations: [
      'This profile records substance-level identity evidence only.',
      'No numeric active-matter value is supplied for AOS-38 or AOS-92.',
      'The CAS represents a UVCB substance and does not fully specify the commercial mixture.',
      'Supplier TDS/SDS and batch-specific CoA remain required for grade and lot release.',
    ],
    supplierIdentityVerified: false,
    lotSpecific: false,
    formulaApplicabilityApproved: false,
  },
  {
    profileId: 'ER-APG-C8-10-001',
    profileVersion: '1.0.0',
    ingredientId: 'apg-0810',
    scope: 'SUBSTANCE_IDENTITY_ONLY',
    parameters: [],
    sourceReferences: [
      {
        sourceId: 'FDA-GSRS-E00JL9G9K0',
        evidenceClass: 'PUBLIC_REGULATORY_IDENTITY',
        publisher: 'FDA Global Substance Registration System via PubChem',
        sourceUrl: 'https://pubchem.ncbi.nlm.nih.gov/substance/472402409',
        supports: ['Caprylyl/Capryl Oligoglucoside name and CAS RN 68515-73-1 association', 'substance class reported as mixture'],
        doesNotSupport: ['Any specific supplier product equivalence', 'APG-0810 active matter', 'catalog grade or lot assay'],
      },
      {
        sourceId: 'BASF-PLANTACARE-810-UP-PRODUCT-PAGE',
        evidenceClass: 'PRIMARY_SUPPLIER_TDS',
        publisher: 'BASF Care 360',
        sourceUrl: 'https://care360.basf.com/global/en/Product-Finder/30530208',
        supports: ['BASF Plantacare 810 UP named product and nonionic surfactant use'],
        doesNotSupport: ['Equivalence to an unidentified catalog supplier', 'catalog active matter or lot-specific assay'],
      },
    ],
    limitations: [
      'This profile records identity and named-product context only.',
      'No numerical active matter, density, pH or impurity limit is inferred from the identity sources.',
      'The custom solution record must be treated as a separate diluted commercial blend, not assumed identical to the parent concentrate.',
      'Supplier TDS/SDS and batch-specific CoA remain required for grade and lot release.',
    ],
    supplierIdentityVerified: false,
    lotSpecific: false,
    formulaApplicabilityApproved: false,
  },
];

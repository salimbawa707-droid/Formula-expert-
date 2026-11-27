/**
 * Public-source normal commercial-grade reference profiles.
 *
 * IMPORTANT:
 * - These are representative published commercial specifications, NOT the user's supplier data.
 * - Never promote these values to supplier grade, lot CoA, or applicability verification.
 * - Reference ranges/specifications are kept separate from calculation defaults.
 * - Where grade basis or test conditions differ, do not compare values as interchangeable.
 */

export type CommercialReferenceEvidenceClass =
  | 'MANUFACTURER_TDS'
  | 'SUPPLIER_PUBLISHED_SPEC'
  | 'INDUSTRY_REFERENCE';

export interface NormalCommercialIngredientReference {
  catalogIngredientIds: string[];
  displayName: string;
  referenceGrade: string;
  evidenceClass: CommercialReferenceEvidenceClass;
  referenceValues: Record<string, { value: number | string; unit: string; basis?: string; conditions?: string }>;
  sourceUrl: string;
  sourceName: string;
  sourceDocumentDate?: string;
  applicabilityNote: string;
  supplierGradeStatus: 'UNVERIFIED';
  lotCoAStatus: 'UNVERIFIED';
  profileStatus: 'NORMAL_COMMERCIAL_REFERENCE';
}

export const NORMAL_COMMERCIAL_INGREDIENT_REFERENCES: NormalCommercialIngredientReference[] = [
  {
    catalogIngredientIds: ['labsa-96'],
    displayName: 'Linear Alkylbenzene Sulphonic Acid',
    referenceGrade: 'LABSA 96 commercial grade',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      activeContentMin: { value: 96, unit: '% w/w', basis: 'as supplied' },
      freeOilMax: { value: 1.5, unit: '% w/w' },
      sulphuricAcidMax: { value: 1.5, unit: '% w/w' },
      colorMax: { value: 35, unit: 'Klett', conditions: '50 g/L aqueous solution' }
    },
    sourceUrl: 'https://jrrorwxholqklp5m.leadongcdn.com/TDS-22028-LABSA-RC-V2-aidlqBpqKoqloSRnlomqpiqim.pdf',
    sourceName: 'RAW CHEM LABSA Technical Data Sheet, version 2.0',
    sourceDocumentDate: '2025-06-02',
    applicabilityNote: 'A published 96% commercial grade example. Do not apply to LABSA 90, another LABSA chain distribution, or any delivered lot without its own documentation.'
  },
  {
    catalogIngredientIds: ['labsa-90'],
    displayName: 'Linear Alkylbenzene Sulphonic Acid',
    referenceGrade: 'LABSA 90 commercial grade',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      activeContentNominal: { value: 90, unit: '%', basis: 'commercial grade designation' }
    },
    sourceUrl: 'https://www.labsacatabsa.com/product',
    sourceName: 'CATABSA product information — LABSA 90% and 96%',
    applicabilityNote: 'The page identifies a 90% commercial product but does not provide a full numeric impurity specification in the retrieved content. Only the nominal active grade is recorded; free acid, free oil, water and color remain unknown.'
  },
  {
    catalogIngredientIds: ['aos-38'],
    displayName: 'Sodium C14-16 Olefin Sulfonate',
    referenceGrade: 'AOS 38 liquid',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      activeMatter: { value: '37–39', unit: '% w/w', basis: 'as supplied' },
      unsulfonatedMatterMax: { value: 2, unit: '% w/w' },
      sodiumSulfateMax: { value: 1.5, unit: '% w/w' },
      freeAlkaliMax: { value: 0.35, unit: '% as NaOH' },
      pH: { value: '8.5–11.5', unit: 'pH', conditions: '1% active-matter solution' },
      colorMax: { value: 100, unit: 'Hazen', conditions: '5% active-matter solution' }
    },
    sourceUrl: 'https://www.mos-surfactant.com/products/categories/sodium-alpha-olefin-sulfonate-aos.html',
    sourceName: 'Ningbo MOS Chemical — AOS technical specifications',
    applicabilityNote: 'AOS 38 grade table gives 37–39% active. Other suppliers publish neutral and alkaline grades with different pH windows; preserve the grade distinction and do not treat pH as universal.'
  },
  {
    catalogIngredientIds: ['soda-ash-uni', 'soda-ash-light', 'soda-ash-uni-tech', 'soda-ash-uni-pure', 'soda-ash-uni-sol', 'soda-ash-light-tech', 'soda-ash-light-pure', 'soda-ash-light-sol'],
    displayName: 'Sodium Carbonate Anhydrous',
    referenceGrade: 'Light soda ash, published manufacturer grade',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      totalAlkalinityMin: { value: 99, unit: '% as Na2CO3' },
      volatileMatterMax: { value: 0.8, unit: '%', basis: 'at packaging' },
      sulfateMax: { value: 0.03, unit: '% as Na2SO4' },
      chlorideMax: { value: 0.8, unit: '% as NaCl' },
      ironMax: { value: 0.0029, unit: '% as Fe2O3' },
      waterInsolubleMax: { value: 0.03, unit: '%' },
      bulkDensity: { value: '550–720', unit: 'kg/m3' }
    },
    sourceUrl: 'https://www.tatachemicals.com/tata/sites/default/files/2025-01/tds-light-soda-ash-29072024.pdf',
    sourceName: 'Tata Chemicals Light Soda Ash Technical Data Sheet',
    sourceDocumentDate: '2024-07-29',
    applicabilityNote: 'Light grade only. Dense soda ash and other manufacturers may have different bulk density and impurity limits. Check the exact catalog IDs before wiring this profile.'
  },
  {
    catalogIngredientIds: ['sodium-metasilicate-pentahydrate', 'sodium-metasilicate-pentahydrate-tech', 'sodium-metasilicate-pentahydrate-pure', 'sodium-metasilicate-pentahydrate-sol'],
    displayName: 'Sodium Metasilicate Pentahydrate',
    referenceGrade: 'Pentahydrate 5H2O, published Indian supplier specification',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      sodiumOxide: { value: '28–30', unit: '% Na2O' },
      silica: { value: '28–30', unit: '% SiO2' },
      dryMatter: { value: '56–60', unit: '%' },
      pH: { value: '12–13', unit: 'pH', conditions: 'supplier TDS test solution; concentration not stated in retrieved text' },
      waterInsolubleMax: { value: 0.05, unit: '%' }
    },
    sourceUrl: 'https://www.ankitsilicate.com/assets/docs/sodium-metasilicate-pentahydrate/TDS%20Sodium%20Metasilicate%20Pentahydrate%205H2O.pdf',
    sourceName: 'Ankit Silicate Sodium Metasilicate Pentahydrate TDS, product code P-28',
    applicabilityNote: 'Pentahydrate only. Do not reuse for anhydrous sodium metasilicate or infer a 100% active basis from dry matter. The TDS reports Na2O and SiO2 separately.'
  },
  {
    catalogIngredientIds: ['sodium-sulfate-uni', 'sodium-sulfate-uni-tech', 'sodium-sulfate-uni-pure', 'sodium-sulfate-uni-sol'],
    displayName: 'Sodium Sulphate Anhydrous',
    referenceGrade: 'Anhydrous detergent-industry commercial specification',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      assayTopMin: { value: 99.6, unit: '% Na2SO4', basis: 'TOP grade' },
      assayFirstMin: { value: 99, unit: '% Na2SO4', basis: '1st grade' },
      assaySecondMin: { value: 98, unit: '% Na2SO4', basis: '2nd grade' },
      moistureTopMax: { value: 0.05, unit: '%', basis: 'TOP grade' },
      chlorideTopMax: { value: 0.05, unit: '%', basis: 'TOP grade' },
      insolubleTopMax: { value: 0.005, unit: '%', basis: 'TOP grade' }
    },
    sourceUrl: 'https://stppgroup.com/products/detergent-chemicals/sodium-sulphate-anhydrous/',
    sourceName: 'STPP Group Sodium Sulphate Anhydrous published technical specification',
    applicabilityNote: 'The supplier publishes multiple grades (TOP/1st/2nd). Do not select TOP grade automatically; the user's actual grade remains unknown. Moisture and ionic impurities matter for powder performance.'
  }
];

export function getNormalCommercialIngredientReference(catalogIngredientId: string) {
  return NORMAL_COMMERCIAL_INGREDIENT_REFERENCES.find(reference =>
    reference.catalogIngredientIds.includes(catalogIngredientId)
  ) ?? null;
}

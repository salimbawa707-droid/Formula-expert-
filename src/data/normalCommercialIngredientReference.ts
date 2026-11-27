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

  {
    catalogIngredientIds: ['sles-28', 'sles-28-tech'],
    displayName: 'Sodium Laureth Sulfate',
    referenceGrade: 'SLES 28% liquid',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      activeMatter: { value: '28 ± 1', unit: '% w/w', basis: 'as supplied' },
      pH: { value: '7–9', unit: 'pH', conditions: '5% aqueous solution' },
      unsulfatedMatterMax: { value: 1.5, unit: '%' },
      sodiumChlorideMax: { value: 0.5, unit: '% as NaCl' }
    },
    sourceUrl: 'https://alliedinds.com/download/tds_file/HpaHo47EmPh2EQGmE4OuCCGxxtUMRK0aOaossTsu.pdf',
    sourceName: 'Allied Group SLES 28% Technical Data Sheet, product code ACSCSLES28',
    applicabilityNote: 'One supplier-published 28% liquid grade. Other SLES 28 products may have different EO distribution, pH test concentration, salt and unsulfated matter limits.'
  },
  {
    catalogIngredientIds: ['sles-70', 'sles-70-tech'],
    displayName: 'Sodium Laureth Sulfate',
    referenceGrade: 'SLES 70% paste',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      activeMatter: { value: '68–72', unit: '% w/w', basis: 'as supplied' },
      freeOilMax: { value: 2.5, unit: '%' },
      sodiumChlorideMax: { value: 0.5, unit: '%' },
      sodiumSulfateMax: { value: 1.5, unit: '%' },
      pH: { value: '7.5–9', unit: 'pH', conditions: '5% solution' },
      dioxaneMax: { value: 50, unit: 'ppm' }
    },
    sourceUrl: 'https://www.sahar-express.com/sles/',
    sourceName: 'Sahar Express SLES N70 published technical data',
    applicabilityNote: 'Published supplier data for SLES N70. Do not apply to the SLES 28 liquid or infer exact EO distribution from the generic name; the grade and method remain supplier-dependent.'
  },
  {
    catalogIngredientIds: ['naoh-flakes-99', 'naoh-flakes-99-tech'],
    displayName: 'Sodium Hydroxide',
    referenceGrade: 'Caustic soda flakes, dry-basis commercial grade',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      purityMin: { value: 99, unit: '% NaOH', basis: 'dry basis' },
      sodiumCarbonateMax: { value: 0.4, unit: '% Na2CO3' },
      sodiumChlorideMax: { value: 200, unit: 'ppm' },
      nickelMax: { value: 5, unit: 'ppm' }
    },
    sourceUrl: 'https://bci.sa/media/212/Caustic-Soda-Flakes_TDS.pdf',
    sourceName: 'BCI Caustic Soda Flakes Technical Data Sheet',
    applicabilityNote: 'Dry-basis purity is not automatically the as-supplied assay. Hygroscopic flakes can absorb water; use the lot CoA for actual neutralization stoichiometry. Not applicable to 50% lye.'
  },
  {
    catalogIngredientIds: ['sodium-chloride-uni', 'sodium-chloride-uni-tech'],
    displayName: 'Sodium Chloride',
    referenceGrade: 'Refined industrial / vacuum salt reference',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      industrialAssay: { value: '97–99', unit: '% NaCl' },
      vacuumSaltAssay: { value: '99.5–99.9', unit: '% NaCl' },
      industrialMoistureMax: { value: '0.2–0.5', unit: '%', basis: 'published range' },
      industrialInsolublesMax: { value: '0.05–0.2', unit: '%', basis: 'published range' }
    },
    sourceUrl: 'https://wschemicalsbv.com/product-nacl.html',
    sourceName: 'WS Chemicals industrial and vacuum salt published specifications',
    applicabilityNote: 'Industrial and vacuum grades are explicitly different. The catalog label vacuum salt does not prove the user's actual grade or anti-caking additive status.'
  },
  {
    catalogIngredientIds: ['stpp-94', 'stpp-94-tech'],
    displayName: 'Sodium Tripolyphosphate',
    referenceGrade: 'STPP 94 detergent-industry grade',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      assayMin: { value: 94, unit: '% Na5P3O10' },
      phosphorusPentoxideMin: { value: 57, unit: '% P2O5' },
      ferricMax: { value: 0.008, unit: '%' },
      waterInsolubleMax: { value: 0.1, unit: '%' },
      pH: { value: '9.2–10.0', unit: 'pH', conditions: '10 g/L solution' },
      bulkDensity: { value: '0.85–0.99', unit: 'g/cm3' }
    },
    sourceUrl: 'https://stppgroup.com/products/detergent-chemicals/sodium-tripolyphosphate/',
    sourceName: 'STPP Group Sodium Tripolyphosphate published technical specification',
    applicabilityNote: 'This is a phosphate builder reference and does not meet a phosphate-free product constraint. Phase/applicability gates remain separate.'
  },
];

export function getNormalCommercialIngredientReference(catalogIngredientId: string) {
  return NORMAL_COMMERCIAL_INGREDIENT_REFERENCES.find(reference =>
    reference.catalogIngredientIds.includes(catalogIngredientId)
  ) ?? null;
}

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

  {
    catalogIngredientIds: ['lae-7'],
    displayName: 'C12-15 Alcohol Ethoxylate 7EO',
    referenceGrade: 'BIO-SOFT N25-7 representative C12-15 linear alcohol ethoxylate',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      activeMatter: { value: 100, unit: '%', basis: 'as supplied' },
      cloudPoint: { value: 50, unit: '°C', conditions: '1% aqueous' },
      hlb: { value: 12.2, unit: 'dimensionless' },
      molesEO: { value: 7, unit: 'mol EO/mol alcohol' },
      density: { value: 0.96, unit: 'g/mL', conditions: '25°C' }
    },
    sourceUrl: 'https://www.stepanbiosolutions.com/content/stepan-dot-com/en/products-markets/product/BIOSOFTN257.html',
    sourceName: 'Stepan BIO-SOFT N25-7 product data',
    applicabilityNote: 'Representative C12-15 linear alcohol ethoxylate 7EO product. Do not map these exact physical properties to every supplier C12-15 Pareth-7; chain distribution and EO distribution can vary.'
  },
  {
    catalogIngredientIds: ['lae-9'],
    displayName: 'C12-15 Alcohol Ethoxylate 9EO',
    referenceGrade: 'BIO-SOFT EH-9 representative alcohol ethoxylate',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      cloudPoint: { value: 64, unit: '°C', conditions: '10 wt% actives aqueous solution' },
      hlb: { value: 12.5, unit: 'dimensionless' },
      pH: { value: 6.2, unit: 'pH', conditions: '1% aqueous solution' },
      density: { value: 1.0069, unit: 'g/mL', conditions: '40°C' },
      surfaceTension: { value: 31, unit: 'mN/m', conditions: '1% actives, 25°C' }
    },
    sourceUrl: 'https://media.knowde.com/image/upload/v1631685783/production/Collateral/273791/ECOSURF_EH_9_Surfactant_Technical_Data_Sheet.pdf',
    sourceName: 'Dow ECOSURF EH-9 Technical Data Sheet',
    applicabilityNote: 'A different supplier/product benchmark for an alcohol ethoxylate. The TDS cloud point method is 10% active solution; do not compare directly with values measured at 1% or assign to all C12-15 Pareth-9.'
  },
  {
    catalogIngredientIds: ['glda-47'],
    displayName: 'Tetrasodium Glutamate Diacetate',
    referenceGrade: 'Dissolvine GL-47-S, 47% solution',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      assayAsGLDA_Na4Min: { value: 47.4, unit: '% w/w' },
      density: { value: 1.4, unit: 'g/cm3', conditions: 'approximate' },
      pH: { value: '11.0–11.8', unit: 'pH', conditions: '1% w/v dilution' },
      colorMax: { value: 250, unit: 'APHA' },
      NTA_Na3Max: { value: 0.1, unit: '%' },
      calciumSequestering: { value: 55, unit: 'mg Ca/g', conditions: 'theoretical; pH 6–14' }
    },
    sourceUrl: 'https://www.nouryon.com/product/dissolvine-gl-47-s/',
    sourceName: 'Nouryon Dissolvine GL-47-S product data',
    applicabilityNote: 'Specific GL-47-S 47% solution reference. Chelation capacity is reported as mg elemental calcium/g, not mg CaCO3/g; do not interchange these units. Assay basis and product variants must be preserved.'
  },
  {
    catalogIngredientIds: ['mgda-40'],
    displayName: 'Trisodium Methylglycinediacetate',
    referenceGrade: 'BASF Trilon M Liquid T, approx. 40% MGDA-Na3',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      concentrationAsMGDA_Na3: { value: '39–41', unit: '% w/w' },
      density: { value: '1.29–1.33', unit: 'g/cm3', conditions: '20°C' },
      pH: { value: 11, unit: 'pH', conditions: '1% in water, 23°C' },
      chelationValue: { value: 160, unit: 'mg CaCO3/g', conditions: 'BASF method' },
      ammoniaMax: { value: 80, unit: 'ppm' }
    },
    sourceUrl: 'https://assets-global.website-files.com/5fc9222730707183b6adc32a/60ad80c5be8a39221893c42a_Trilon-M-Liquid-T-30640650.pdf',
    sourceName: 'BASF Trilon M Liquid T Technical Bulletin',
    applicabilityNote: 'Liquid grade only. MGDA powder/granules have different concentrations and moisture. The chelation value is tied to the stated BASF method and is not a universal method-independent constant.'
  },
  {
    catalogIngredientIds: ['sodium-citrate-uni'],
    displayName: 'Trisodium Citrate Dihydrate',
    referenceGrade: 'USP/FCC/E331 commercial dihydrate specification example',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      assay: { value: '99.0–100.5', unit: '%', basis: 'USP/FCC/E331 specification' },
      water: { value: '10.0–13.0', unit: '%', basis: 'dihydrate' },
      pH: { value: '7.5–9.0', unit: 'pH', conditions: '5% solution; E331 table' },
      chlorideMax: { value: 50, unit: 'ppm', basis: 'USP/FCC table' },
      oxalateMax: { value: 100, unit: 'ppm', basis: 'E331 table' }
    },
    sourceUrl: 'https://www.pangs.com.cn/EN/cms/lid/53/id/693.html',
    sourceName: 'Pangs Trisodium Citrate Dihydrate TDS',
    applicabilityNote: 'Published multi-standard specification; values vary by BP/USP/FCC/E331 column. Dihydrate only. Do not use for anhydrous trisodium citrate without recalculating hydration basis.'
  },
  {
    catalogIngredientIds: ['edta-4na-39-liquid'],
    displayName: 'Tetrasodium EDTA',
    referenceGrade: 'BASF Trilon BX Liquid, approx. 40% reference',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      activeMatter: { value: 40, unit: '%', basis: 'approximate' },
      pH: { value: 11.5, unit: 'pH', conditions: '1% in distilled water' },
      density: { value: 1.28, unit: 'g/cm3', conditions: 'approximate' }
    },
    sourceUrl: 'https://assets.website-files.com/5fc922269c5ed09aea1f7c22/60d09bd501ec27f36d2c2f3a_Range%20Card%20Home%20Care_II_8.5%20x%2011_V23%20Web.pdf',
    sourceName: 'BASF Home Care Product Range Card — Trilon BX Liquid',
    applicabilityNote: 'This published reference is approximately 40% and does not establish the catalog's 39% exact grade. Use as a commercial reference band only; supplier assay and hydrate/speciation basis must be checked.'
  },
  {
    catalogIngredientIds: ['protease-liquid'],
    displayName: 'Detergent liquid protease preparation',
    referenceGrade: 'Novonesis Progress Go 100 L product-specific activity benchmark',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      activity: { value: 150000, unit: 'KIPU-A/g', basis: 'specific commercial product as listed by distributor' },
      physicalForm: { value: 'liquid', unit: 'form' },
      intendedApplication: { value: 'liquid laundry detergent', unit: 'application' }
    },
    sourceUrl: 'https://www.novonesis.com/en/biosolutions/household-care/laundry/progress-go-100-l',
    sourceName: 'Novonesis Progress Go 100 L product information',
    applicabilityNote: 'This is a named commercial protease example, not a universal protease activity value. KIPU-A is product/method specific and cannot be converted to KNPU-S, BPU or another unit without validated method correlation. Catalog activeDefault=100% must not be interpreted as enzyme activity.'
  },
  {
    catalogIngredientIds: ['amylase-liquid', 'amylase-liquid-tech', 'amylase-liquid-pure', 'amylase-liquid-sol', 'lipase-liquid', 'lipase-liquid-tech', 'lipase-liquid-pure', 'lipase-liquid-sol', 'cellulase-liquid', 'cellulase-liquid-tech', 'cellulase-liquid-pure', 'cellulase-liquid-sol', 'mannanase-liquid', 'mannanase-liquid-tech', 'mannanase-liquid-pure', 'mannanase-liquid-sol'],
    displayName: 'Detergent enzyme preparations — activity-unit reference rule',
    referenceGrade: 'Commercial detergent enzyme preparations; supplier-labelled activity',
    evidenceClass: 'INDUSTRY_REFERENCE',
    referenceValues: {
      activityBasis: { value: 'activity units per gram or millilitre, with named assay method and substrate', unit: 'method-specific' },
      massActiveMatter: { value: 'not a valid cross-enzyme potency metric', unit: 'rule' },
      storageStability: { value: 'must be validated in the finished detergent matrix over time', unit: 'rule' },
      proteaseExample: { value: 'Progress Go 100 L; Progress Uno 100 L', unit: 'named commercial liquid product examples' },
      amylaseExample: { value: 'Amplify Prime 100 L; Stainzyme Plus Evity 48 T', unit: 'named commercial alpha-amylase examples' },
      lipaseExample: { value: 'Lipex Evity 200 L; Lipex Evity 100 T', unit: 'named commercial lipase examples' },
      cellulaseExamples: { value: 'Celluclean 5000 L (cleaning cellulase); Carezyme Premium 4500 L (care cellulase)', unit: 'named commercial cellulase examples; distinct functions' },
      mannanaseExample: { value: 'Mannaway 200 L; Mannaway Evity 4.0 T', unit: 'named commercial mannanase examples' },
      publishedFormulationUseLevels: { value: 'whitepaper examples only; protease 0.20–0.28%, amylase 0.03%, lipase 0.14–0.16%, mannanase 0.05%, cellulase 0.06–0.08%', unit: '% w/w of cited liquid laundry detergent examples', basis: 'Novonesis whitepaper; not transferable dosage recommendations or activity assays' }
    },
    sourceUrl: 'https://backend.novonesis.com/sites/default/files/document/2025-10/HHC_%20Whitepaper_final_enabling_greener_detergents_liquid_digital.pdf',
    sourceName: 'Novonesis Household Care liquid detergent whitepaper',
    applicabilityNote: 'No transferable universal activity value is published for the generic amylase/lipase/cellulase/mannanase catalog entries. Require the exact enzyme product, assay unit, substrate/method, activity per g or mL, recommended dose and stability data. Do not use activeDefault=100 as potency.'
  },
  {
    catalogIngredientIds: ['carbomer-940'],
    displayName: 'Carbomer 940 crosslinked polyacrylic acid',
    referenceGrade: 'Lubrizol Carbopol 940 NF specification benchmark',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      carboxylicAcidAssay: { value: '56–68', unit: '%', basis: 'Lubrizol method' },
      viscosity: { value: '40000–60000', unit: 'cP', conditions: '0.5 wt% mucilage; neutralized pH 7.3–7.8; Brookfield RVT 20 rpm, 25°C' },
      lossOnDryingMax: { value: 2, unit: '%' },
      clarityMin: { value: 85, unit: '% transmission', conditions: '0.5% neutralized dispersion, 420 nm' }
    },
    sourceUrl: 'https://www.lubrizol.com/-/media/Lubrizol/Health/Literature/SPEC_Carbopol_940_NF.pdf',
    sourceName: 'Lubrizol Carbopol 940 NF Product Specification',
    applicabilityNote: 'NF/pharmaceutical-grade reference, not proof that a generic industrial Carbomer 940 lot is equivalent or optimal in high-electrolyte detergent. Viscosity is highly dependent on neutralization, salts and test method.'
  },
  {
    catalogIngredientIds: ['bit-20'],
    displayName: '1,2-Benzisothiazolin-3-one',
    referenceGrade: 'LANXESS PREVENTOL BIT 20 N aqueous-glycolic solution',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      activeMatter: { value: 20, unit: '%', basis: 'product grade designation; verify exact regional TDS/CoA' },
      chemicalIdentity: { value: 'BIT', unit: 'active substance' },
      application: { value: 'cleaners and detergents', unit: 'manufacturer-listed use' }
    },
    sourceUrl: 'https://lanxess.com/en-in/products/products/p/preventol--bit-20-n',
    sourceName: 'LANXESS PREVENTOL BIT 20 N product page',
    applicabilityNote: 'Manufacturer identifies aqueous-glycolic BIT solution for cleaners/detergents; product page does not provide a full assay specification in retrieved data. 20% is a product-grade designation and must be confirmed against the exact regional product TDS/CoA. Regulatory approval and permitted use vary by jurisdiction.'
  },
  {
    catalogIngredientIds: ['phenoxyethanol-99'],
    displayName: '2-Phenoxyethanol',
    referenceGrade: 'High-purity phenoxyethanol commercial specification example',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      purityMin: { value: 99, unit: '% by GC' },
      moistureMax: { value: 0.2, unit: '% by mass' },
      specificGravity: { value: '1.105–1.110', unit: '20°C' },
      pH: { value: '5.5–7.0', unit: 'pH', conditions: '1% aqueous solution' },
      freePhenolMax: { value: 150, unit: 'ppm' }
    },
    sourceUrl: 'https://5.imimg.com/data5/SELLER/Doc/2023/12/370241864/AB/ZT/BD/153889755/phenoxyethanol-cas-122996.pdf',
    sourceName: 'Elchemy Phenoxyethanol Preservative Grade TDS',
    applicabilityNote: 'A published preservative-grade supplier specification, not a detergent preservation efficacy claim. Finished-product preservation requires compatibility, dose justification and challenge testing; pH and legal use limits must be checked for the intended market.'
  },
  {
    catalogIngredientIds: ['kathon-cg'],
    displayName: 'CMIT/MIT preservative blend',
    referenceGrade: 'KATHON CG/ICP commercial 1.5% active reference',
    evidenceClass: 'INDUSTRY_REFERENCE',
    referenceValues: {
      totalActiveMatter: { value: 1.5, unit: '%', basis: 'published commercial product benchmark' },
      applicationPH: { value: '<8.5', unit: 'pH', conditions: 'published home-care application guidance' },
      typicalUseLevel: { value: '0.025–0.1', unit: '% product', conditions: 'published application guidance; not a recommendation for this formula' }
    },
    sourceUrl: 'https://oqema.com/group/en/lanxess/lanxess-for-home-care',
    sourceName: 'LANXESS Home Care portfolio application table via OQEMA',
    applicabilityNote: 'A commercial KATHON CG/ICP benchmark only. Do not infer the CMIT:MIT ratio, solvent/carrier or regional legal status from total active alone. Exact grade, ratio, SDS and local biocide restrictions must be verified; preservation challenge testing remains mandatory.'
  },
  {
    catalogIngredientIds: ['perfume-compound'],
    displayName: 'Commercial fragrance mixture for laundry and cleaning products',
    referenceGrade: 'Industry standard reference — IFRA product-category and supplier conformity framework',
    evidenceClass: 'INDUSTRY_REFERENCE',
    referenceValues: {
      laundryDetergentCategory: { value: '10A', unit: 'IFRA category', conditions: 'hand wash and machine laundry detergents' },
      handDishwashingCategory: { value: '10A', unit: 'IFRA category', conditions: 'hand dishwashing detergents' },
      hardSurfaceCleanerCategory: { value: '10A', unit: 'IFRA category', conditions: 'hard surface cleaners' },
      universalCompositionOrActive: { value: 'not defined; mixture-specific', unit: 'rule' }
    },
    sourceUrl: 'https://ifrafragrance.org/docs/default-source/51st-amendment/ifra-51st-amendment---guidance-for-the-use-of-ifra-standards.pdf',
    sourceName: 'IFRA-RIFM Guidance for the Use of IFRA Standards',
    applicabilityNote: 'Fragrance is a multi-component mixture; there is no universal active %, composition, density or safe dosage. Obtain the fragrance-mixture manufacturer's IFRA Standards Conformity Certificate for the exact intended use and amendment, plus SDS/allergen and restricted-material declarations. IFRA certificate does not replace a complete safety assessment.'
  },

  {
    catalogIngredientIds: ['sodium-gluconate'],
    displayName: 'Sodium Gluconate',
    referenceGrade: 'Commercial chelating-grade sodium gluconate powder',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      assayMin: { value: 98, unit: '%' },
      lossOnDryingMax: { value: 0.5, unit: '%' },
      reducingSubstancesMax: { value: 0.7, unit: '%' },
      pH: { value: '6.2–7.8', unit: 'pH', conditions: 'supplier test method' },
      sulfateMax: { value: 0.02, unit: '%' },
      chlorideMax: { value: 0.02, unit: '%' },
      leadMax: { value: 10, unit: 'ppm' }
    },
    sourceUrl: 'https://dtl.mu/wp-content/uploads/2022/03/SODIUM-GLUCONATE.pdf',
    sourceName: 'Sodium Gluconate published product specification',
    applicabilityNote: 'A commercial powder specification example. Do not infer chelation capacity solely from assay; use a defined metal-binding test and pH/temperature conditions for formulation calculations.'
  },
  {
    catalogIngredientIds: ['sodium-benzoate'],
    displayName: 'Sodium Benzoate',
    referenceGrade: 'Food/FCC/USP commercial preservative-grade reference',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      assayMin: { value: 99, unit: '%', basis: 'dried basis' },
      lossOnDryingMax: { value: 1.5, unit: '%' },
      arsenicMax: { value: 3, unit: 'mg/kg' },
      leadMax: { value: 2, unit: 'mg/kg' },
      pH: { value: '6.5–8.0', unit: 'pH', conditions: '1% aqueous solution; Eastman typical property' }
    },
    sourceUrl: 'https://productcatalog.eastman.com/tds/ProdDatasheet.aspx?pn=probenz-sg-sodium-benzoate-food-grade-kosher&product=71072050',
    sourceName: 'Eastman Probenz SG Sodium Benzoate TDS',
    applicabilityNote: 'The assay and moisture figures are common food-grade specification references, not proof of efficacy in alkaline laundry detergent. Benzoate antimicrobial efficacy is pH-dependent; do not treat this ingredient as an effective preservative at high detergent pH without validation.'
  },
  {
    catalogIngredientIds: ['potassium-sorbate'],
    displayName: 'Potassium Sorbate',
    referenceGrade: 'Food additive E202 commercial powder specification',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      assay: { value: '99.0–101.0', unit: '%', basis: 'acidimetric, dried substance' },
      assayHPLC: { value: '98.0–102.0', unit: '%', basis: 'HPLC, dried substance' },
      lossOnDryingMax: { value: 1, unit: '%', conditions: '105°C' },
      heavyMetalsMax: { value: 0.001, unit: '% as Pb' },
      freeSorbicAcidMax: { value: 1, unit: '%' }
    },
    sourceUrl: 'https://kemicas.com/PDF/TDS/Kemicas-TDS-KS02274PotassiumSorbate.PDF',
    sourceName: 'KEMICAS Potassium Sorbate ACS/Ph. Eur. Technical Data Sheet',
    applicabilityNote: 'This is a laboratory/food-additive grade specification, not proof of suitability as a preservative in alkaline detergent. Sorbate efficacy is strongly pH-dependent; finished-product challenge testing and legal-use review are separate requirements.'
  },

  {
    catalogIngredientIds: ['apg-0810', 'apg-0810-tech', 'apg-0810-pure', 'apg-0810-sol'],
    displayName: 'Alkyl polyglucoside C8–10 / APG 0810',
    referenceGrade: 'Commercial APG 0810 ≥50% active published specification example',
    evidenceClass: 'SUPPLIER_PUBLISHED_SPEC',
    referenceValues: {
      activeMatterMin: { value: 50, unit: '%', basis: 'supplier published minimum; product variant dependent' },
      chemicalClass: { value: 'C8–10 alkyl polyglucoside', unit: 'identity' },
      pH: { value: '11.5–12.5', unit: 'pH', conditions: '10% aqueous solution; grade-specific published range' }
    },
    sourceUrl: 'https://www.intersurfchem.net/surfactants/alkyl-polyglucoside-apg-0810/',
    sourceName: 'InterSurfChem APG 0810 published product specification',
    applicabilityNote: 'Supplier-published reference example, not a verified manufacturer identity for the catalog grade. APG chain distribution, solids/active definition and pH method vary by grade. Do not transfer this minimum assay to APG-1214 or assume every APG-0810 lot is ≥50%.'
  },
  {
    catalogIngredientIds: ['apg-1214', 'apg-1214-tech', 'apg-1214-pure', 'apg-1214-sol'],
    displayName: 'Lauryl/Myristyl glucoside APG',
    referenceGrade: 'BASF Glucopon 600 UP commercial APG benchmark',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      activeMatter: { value: 50, unit: '%', basis: 'BASF product range card' },
      chemicalNature: { value: 'Lauryl/Myristyl Glucoside', unit: 'composition description' },
      physicalForm: { value: 'liquid', unit: 'form' },
      foamHeight: { value: '135 / 135', unit: 'mm', conditions: 'Ross-Miles 0.1 wt%, 25°C, 0/5 min' }
    },
    sourceUrl: 'https://www.basf.com/dam/jcr:cb247fec-3a83-3099-80b6-025f50eb881e/basf/www/mx/documents/2024%20HII%20Product%20Range%20Card.pdf',
    sourceName: 'BASF Home Care & I&I Product Range Card — Glucopon 600 UP',
    applicabilityNote: 'BASF grade is a lauryl/myristyl glucoside blend, not proof of pure lauryl glucoside or equivalence to every APG-1214 supplier grade. 50% is the named product range-card value; lot CoA remains required.'
  },
  {
    catalogIngredientIds: ['lauryl-amine-oxide', 'lauryl-amine-oxide-tech', 'lauryl-amine-oxide-pure', 'lauryl-amine-oxide-sol'],
    displayName: 'Lauramine Oxide',
    referenceGrade: 'Stepan AMMONYX LO commercial 30% active',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      activeMatter: { value: 30, unit: '%', basis: 'as supplied; amine oxide' },
      freeAmineMax: { value: 1, unit: '%', basis: 'product bulletin typical specification' },
      pH: { value: 8, unit: 'pH', conditions: '10% aqueous' },
      cloudPoint: { value: -1, unit: '°C', conditions: 'as supplied' },
      density: { value: 0.968, unit: 'g/mL', conditions: '25°C' },
      viscosity: { value: 18, unit: 'cP', conditions: '25°C' }
    },
    sourceUrl: 'https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/product-bulletins/surfactants/AMMONYXLO.pdf',
    sourceName: 'Stepan AMMONYX LO Product Bulletin',
    applicabilityNote: 'Exact chemical identity/CAS 1643-20-5 matches lauramine oxide. Catalog activeDefault 30 is consistent with this named product benchmark, but supplier, region, test method and lot assay still require verification. Amine oxides are amphoteric, not nonionic surfactants.'
  },
  {
    catalogIngredientIds: ['lae-3', 'lae-3-tech', 'lae-3-pure', 'lae-3-sol'],
    displayName: 'Low-EO alcohol ethoxylate benchmark',
    referenceGrade: 'BASF Lutensol AO 3 adjacent C13–C15 oxo-alcohol 3EO benchmark',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      chemicalNature: { value: 'C13–C15 oxo alcohol + 3 EO', unit: 'composition description' },
      hlb: { value: 8, unit: 'dimensionless', basis: 'BASF product range card' },
      physicalForm: { value: 'liquid', unit: 'form' }
    },
    sourceUrl: 'https://www.basf.com/dam/jcr:cb247fec-3a83-3099-80b6-025f50eb881e/basf/www/mx/documents/2024%20HII%20Product%20Range%20Card.pdf',
    sourceName: 'BASF Home Care & I&I Product Range Card — Lutensol AO 3',
    applicabilityNote: 'Adjacent low-EO alcohol ethoxylate benchmark only: C13–C15 oxo-alcohol is not identical to catalog C12–15 Pareth-3. Do not copy exact HLB or physical properties into runtime assumptions without exact-chain supplier confirmation.'
  },
  {
    catalogIngredientIds: ['lae-12', 'lae-12-tech', 'lae-12-pure', 'lae-12-sol'],
    displayName: 'High-EO alcohol ethoxylate benchmark',
    referenceGrade: 'BASF Lutensol A 12 N C12–C14 fatty alcohol 12EO benchmark',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      chemicalNature: { value: 'C12–C14 fatty alcohol + 12 EO', unit: 'composition description' },
      cloudPoint: { value: '>100', unit: '°C', conditions: 'BASF Cloud Point Method A' },
      hlb: { value: 14.3, unit: 'dimensionless' },
      physicalForm: { value: 'waxy solid', unit: 'form' }
    },
    sourceUrl: 'https://www.basf.com/dam/jcr:cb247fec-3a83-3099-80b6-025f50eb881e/basf/www/mx/documents/2024%20HII%20Product%20Range%20Card.pdf',
    sourceName: 'BASF Home Care & I&I Product Range Card — Lutensol A 12 N',
    applicabilityNote: 'Adjacent C12–C14 12EO benchmark, not exact C12–15 Pareth-12. Cloud point method is 1 g active surfactant + 100 g water. The catalog default must not inherit these values without exact supplier grade verification.'
  },
  {
    catalogIngredientIds: ['pvp-k30', 'pvp-k30-tech', 'pvp-k30-pure', 'pvp-k30-sol'],
    displayName: 'Polyvinylpyrrolidone K30',
    referenceGrade: 'BASF Luviskol K 30 Powder commercial polymer benchmark',
    evidenceClass: 'MANUFACTURER_TDS',
    referenceValues: {
      kValue: { value: '27–33', unit: 'K-value', conditions: '1% m/V in water' },
      solids: { value: '95–100', unit: '%', conditions: '140°C, vacuum, 60 min' },
      molecularWeight: { value: 'about 45,000 ± 5,000', unit: 'g/mol', conditions: 'BASF GPC method' },
      pH: { value: '3–7', unit: 'pH', conditions: '10% aqueous' },
      residualNVPMax: { value: 100, unit: 'ppm' }
    },
    sourceUrl: 'https://promo.basf.com/campaign/Projetos/CaringForYou/Documentos/Geral/Luviskol%C2%AE%20K30%20Powder.pdf',
    sourceName: 'BASF Luviskol K 30 Powder Technical Information',
    applicabilityNote: 'Named BASF PVP K30 benchmark. The cited document describes cosmetic application; it is a polymer grade reference, not detergent dye-transfer performance proof. The custom solution variant is not 100% powder and must not inherit the powder solids value.'
  },
  {
    catalogIngredientIds: ['peg-4000', 'peg-4000-tech', 'peg-4000-pure', 'peg-4000-sol'],
    displayName: 'Polyethylene Glycol 4000',
    referenceGrade: 'Industry reference framework for PEG 4000 molecular-weight grade',
    evidenceClass: 'INDUSTRY_REFERENCE',
    referenceValues: {
      gradeIdentity: { value: 'PEG average molecular weight grade 4000', unit: 'nominal grade designation' },
      assay: { value: 'supplier- and pharmacopeia-grade specific; no universal numeric value assigned', unit: 'rule' },
      molecularWeightDistribution: { value: 'requires supplier specification / CoA', unit: 'rule' }
    },
    sourceUrl: 'https://www.usp.org/',
    sourceName: 'USP compendial reference framework (grade-specific monograph required)',
    applicabilityNote: 'No exact commercial PEG 4000 supplier TDS was validated in this mapping tranche. Do not convert nominal PEG grade number into a measured molecular weight or assume 100% assay; obtain PEG 4000 TDS/CoA and melting/solidification range.'
  },
  {
    catalogIngredientIds: ['ase-polymer-33', 'ase-polymer-33-tech', 'ase-polymer-33-pure', 'ase-polymer-33-sol'],
    displayName: 'Alkali-swellable emulsion (ASE) thickener',
    referenceGrade: 'Industry reference framework; exact Acrysol 33 grade TDS required',
    evidenceClass: 'INDUSTRY_REFERENCE',
    referenceValues: {
      polymerClass: { value: 'acidic alkali-swellable acrylic emulsion', unit: 'class' },
      neutralizationResponse: { value: 'viscosity development depends on neutralization, pH, electrolyte and surfactant matrix', unit: 'rule' },
      polymerSolids: { value: 'not assigned without exact grade TDS/CoA', unit: 'rule' }
    },
    sourceUrl: 'https://www.dow.com/en-us/market/mkt-home-care/sub-home-care-thickeners.html',
    sourceName: 'Dow Home Care Thickeners application reference',
    applicabilityNote: 'Acrysol 33 is a trade/grade identity and cannot be inferred from generic CAS 25212-88-8 alone. Do not equate ASE with Sokalan dispersant copolymers or assign 30% polymer solids as verified. Exact product bulletin, neutralization curve and lot CoA are required.'
  },

];

export function getNormalCommercialIngredientReference(catalogIngredientId: string) {
  return NORMAL_COMMERCIAL_INGREDIENT_REFERENCES.find(reference =>
    reference.catalogIngredientIds.includes(catalogIngredientId)
  ) ?? null;
}

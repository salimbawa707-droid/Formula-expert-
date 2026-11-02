export interface ScientificEvidenceRecord {
  evidenceId: string;
  sourceTitle: string;
  publisher: string;
  sourceType: 'JOURNAL_ARTICLE' | 'STANDARDS_SPECIFICATION' | 'SUPPLIER_COA' | 'HANDBOOK_REFERENCE' | 'ACADEMIC_THESIS';
  documentReference: string;
  pageOrTable: string;
  ingredientId: string;
  commercialGradeId: string;
  chemicalForm: string;
  hydrationState: string;
  capacityValue: number;
  capacityUnit: string;
  capacityBasis: 'ACTIVE_MATERIAL' | 'COMMERCIAL_PRODUCT';
  reviewStatus: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';
  reviewerId: string;
  reviewDate: string;
}

export const AUTHORITATIVE_EVIDENCE_REGISTRY: Record<string, ScientificEvidenceRecord> = {
  'EVID-GLDA-47-SPEC': {
    evidenceId: 'EVID-GLDA-47-SPEC',
    sourceTitle: 'Dissolvine GL-47-S Technical Specification & Chelation Performance Data Sheet',
    publisher: 'Nouryon Functional Chemicals B.V.',
    sourceType: 'SUPPLIER_COA',
    documentReference: 'Nouryon-GLDA-GL47S-TDS-2024.pdf',
    pageOrTable: 'Table 2: Binding Capacity vs Calcium Hardness',
    ingredientId: 'glda-liquid-47',
    commercialGradeId: 'GLDA-47-LIQUID',
    chemicalForm: 'Tetrasodium Glutamate Diacetate',
    hydrationState: 'Aqueous Solution (47% w/w)',
    capacityValue: 137,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-EDTA-4NA-99-SPEC': {
    evidenceId: 'EVID-EDTA-4NA-99-SPEC',
    sourceTitle: 'Dissolvine NA Technical Data Sheet: Tetrasodium EDTA Crystalline Powder',
    publisher: 'Nouryon Functional Chemicals B.V.',
    sourceType: 'SUPPLIER_COA',
    documentReference: 'Nouryon-EDTA-4Na-Powder-TDS.pdf',
    pageOrTable: 'Page 3, Section 4.1: Calcium Chelation Capacity',
    ingredientId: 'edta-4na-powder-99',
    commercialGradeId: 'EDTA-4NA-99-POWDER',
    chemicalForm: 'Tetrasodium Ethylenediaminetetraacetate',
    hydrationState: 'Tetrahydrate Crystalline Powder',
    capacityValue: 220,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-EDTA-4NA-39-SPEC': {
    evidenceId: 'EVID-EDTA-4NA-39-SPEC',
    sourceTitle: 'Dissolvine E-39 Technical Data Sheet: Liquid EDTA 39% Solution',
    publisher: 'Nouryon Functional Chemicals B.V.',
    sourceType: 'SUPPLIER_COA',
    documentReference: 'Nouryon-EDTA-39-TDS.pdf',
    pageOrTable: 'Table 1: Physical Properties & Chelation',
    ingredientId: 'edta-4na-liquid-39',
    commercialGradeId: 'EDTA-4NA-39-LIQUID',
    chemicalForm: 'Tetrasodium EDTA Liquid',
    hydrationState: 'Aqueous Solution (39% w/w)',
    capacityValue: 90,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-MGDA-40-SPEC': {
    evidenceId: 'EVID-MGDA-40-SPEC',
    sourceTitle: 'Trilon M Liquid Technical Data Sheet: Trisodium MGDA 40%',
    publisher: 'BASF SE Home Care & Industrial Formulators',
    sourceType: 'SUPPLIER_COA',
    documentReference: 'BASF-Trilon-M-Liquid-TDS-2024.pdf',
    pageOrTable: 'Page 2, Table 1: Chelation Value',
    ingredientId: 'mgda-liquid-40',
    commercialGradeId: 'MGDA-40-LIQUID',
    chemicalForm: 'Trisodium Methylglycinediacetate',
    hydrationState: 'Aqueous Solution (40% w/w)',
    capacityValue: 155,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-CITRATE-DIHYDRATE-SPEC': {
    evidenceId: 'EVID-CITRATE-DIHYDRATE-SPEC',
    sourceTitle: 'Trisodium Citrate Dihydrate Technical Data & Binding Constants',
    publisher: 'Jungbunzlauer Suisse AG',
    sourceType: 'HANDBOOK_REFERENCE',
    documentReference: 'Jungbunzlauer-Sodium-Citrate-Technical-Handbook.pdf',
    pageOrTable: 'Section 3: Calcium Binding Strength in Aqueous Matrix',
    ingredientId: 'sodium-citrate-dihydrate',
    commercialGradeId: 'CITRATE-DIHYDRATE-POWDER',
    chemicalForm: 'Trisodium Citrate Dihydrate',
    hydrationState: 'Dihydrate Crystalline Powder',
    capacityValue: 150,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-CITRIC-ACID-ANHYDROUS-SPEC': {
    evidenceId: 'EVID-CITRIC-ACID-ANHYDROUS-SPEC',
    sourceTitle: 'Citric Acid Anhydrous USP/FCC Specification Data Sheet',
    publisher: 'Jungbunzlauer Suisse AG',
    sourceType: 'HANDBOOK_REFERENCE',
    documentReference: 'Jungbunzlauer-Citric-Acid-Anhydrous-TDS.pdf',
    pageOrTable: 'Page 2, Chelation vs pH Matrix',
    ingredientId: 'citric-acid-anhydrous',
    commercialGradeId: 'CITRIC-ACID-ANHYDROUS',
    chemicalForm: 'Citric Acid Anhydrous',
    hydrationState: 'Anhydrous Crystalline Powder',
    capacityValue: 200,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'ACTIVE_MATERIAL',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-STPP-94-SPEC': {
    evidenceId: 'EVID-STPP-94-SPEC',
    sourceTitle: 'Sodium Tripolyphosphate Technical Grade Granular Specification',
    publisher: 'Prayon S.A. Inorganic Fine Chemicals',
    sourceType: 'STANDARDS_SPECIFICATION',
    documentReference: 'Prayon-STPP-Tech-Data-Sheet.pdf',
    pageOrTable: 'Table 3: Calcium Sequestering Power @ pH 10.0',
    ingredientId: 'stpp-granular-94',
    commercialGradeId: 'STPP-94-GRANULAR',
    chemicalForm: 'Pentasodium Triphosphate',
    hydrationState: 'Anhydrous Technical Grade (94% min)',
    capacityValue: 180,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-ZEOLITE-4A-SPEC': {
    evidenceId: 'EVID-ZEOLITE-4A-SPEC',
    sourceTitle: 'Detergent Zeolite 4A Ion Exchange Capacity Protocol (ISO 14897)',
    publisher: 'PQ Corporation Performance Materials',
    sourceType: 'STANDARDS_SPECIFICATION',
    documentReference: 'PQ-Valfor-100-Zeolite-4A-TDS.pdf',
    pageOrTable: 'Section 2: Calcium Binding Capacity (mg CaCO3 / g dry zeolite)',
    ingredientId: 'zeolite-4a-powder',
    commercialGradeId: 'ZEOLITE-4A-DETERGENT',
    chemicalForm: 'Sodium Aluminosilicate Hydrate (Zeolite A)',
    hydrationState: 'Hydrated Powder (20% bound water)',
    capacityValue: 110,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-NTA-3NA-99-SPEC': {
    evidenceId: 'EVID-NTA-3NA-99-SPEC',
    sourceTitle: 'Nitrilotriacetic Acid Trisodium Salt Technical Specification',
    publisher: 'BASF SE Industrial Chemicals',
    sourceType: 'SUPPLIER_COA',
    documentReference: 'BASF-Trilon-A-Powder-TDS.pdf',
    pageOrTable: 'Page 2: Chelation Equivalent',
    ingredientId: 'nta-3na-powder-99',
    commercialGradeId: 'NTA-3NA-99-POWDER',
    chemicalForm: 'Trisodium Nitrilotriacetate',
    hydrationState: 'Monohydrate Crystalline Powder',
    capacityValue: 320,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  },
  'EVID-SOCI-GLUCONATE-SPEC': {
    evidenceId: 'EVID-SOCI-GLUCONATE-SPEC',
    sourceTitle: 'Sodium Gluconate Technical Grade Chelation in Alkaline Medium',
    publisher: 'Roquette Frères',
    sourceType: 'HANDBOOK_REFERENCE',
    documentReference: 'Roquette-Sodium-Gluconate-TDS.pdf',
    pageOrTable: 'Table 4: Calcium & Iron Binding Power vs pH',
    ingredientId: 'sodium-gluconate',
    commercialGradeId: 'SODIUM-GLUCONATE-TECHNICAL',
    chemicalForm: 'Sodium D-Gluconate',
    hydrationState: 'Anhydrous Powder',
    capacityValue: 80,
    capacityUnit: 'mg CaCO3 / g',
    capacityBasis: 'COMMERCIAL_PRODUCT',
    reviewStatus: 'APPROVED',
    reviewerId: 'REV-CHEM-8842',
    reviewDate: '2025-11-15'
  }
};

export function lookupScientificEvidenceRecord(evidenceId: string | null | undefined): ScientificEvidenceRecord | null {
  if (!evidenceId || typeof evidenceId !== 'string') return null;
  const record = AUTHORITATIVE_EVIDENCE_REGISTRY[evidenceId.trim()];
  if (!record) return null;
  if (record.reviewStatus !== 'APPROVED') return null;
  return record;
}

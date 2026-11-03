/**
 * ============================================================================
 * CHEMICAL IDENTITY & CHEMINFORMATICS DOMAIN CONTRACTS
 * ============================================================================
 * 
 * Defines structural representations, molecular descriptors, and chemical
 * classification types powered by RDKit WASM.
 * 
 * CRITICAL SCIENTIFIC PRINCIPLES:
 * 1. RDKit calculates molecular topology, descriptors, and substructures.
 * 2. RDKit NEVER certifies raw material purity or assay percentage.
 * 3. Commercial mixtures (e.g. SLES 70%, LABSA 96%, CAPB 30%, enzyme cocktails)
 *    are explicitly classified as COMMERCIAL_MIXTURE / COMPLEX_UVCB and are NOT
 *    falsely represented as pure single molecules.
 * 4. Authoritative formulation engines (PHEngineV2, ActiveMatter, Chelation,
 *    Compatibility) remain sovereign.
 * ============================================================================
 */

export type MaterialStructuralClassification =
  | 'SINGLE_MOLECULE'
  | 'COMMERCIAL_MIXTURE'
  | 'COMPLEX_UVCB' // Unknown or Variable composition, Complex reaction products or Biological materials
  | 'POLYMER'
  | 'INORGANIC_SALT'
  | 'UNKNOWN_STRUCTURE';

export type StructuralEvidenceLevel =
  | 'CALCULATED_STRUCTURE'
  | 'INSUFFICIENT_DATA'
  | 'NOT_APPLICABLE_MIXTURE'
  | 'CHEMICAL_INTELLIGENCE_UNAVAILABLE';

export interface MolecularDescriptors {
  molecularWeight: number; // Average MW (amw)
  exactMass?: number;      // Monoisotopic mass (exactmw)
  logP?: number;           // Crippen ClogP (lipophilicity)
  tpsa?: number;           // Topological Polar Surface Area (Å²)
  rotatableBondCount: number;
  hBondDonorCount: number; // Lipinski HBD
  hBondAcceptorCount: number; // Lipinski HBA
  heavyAtomCount: number;
  formalCharge: number;
  fractionCsp3?: number;
  ringCount?: number;
  aromaticRingCount?: number;
}

export interface MolecularStructure extends MolecularDescriptors {
  smiles: string;
  canonicalSmiles: string;
  inchi?: string;
  inchiKey?: string;
  molecularFormula?: string;
  substructureTags: string[];
  rdkitVersion: string;
  calculatedAt: string;
  evidenceLevel: StructuralEvidenceLevel;
  svgDepiction?: string;
}

export interface CommercialComponentRef {
  name: string;
  canonicalSmiles?: string;
  casNumber?: string;
  approximatePercentage?: number;
  functionalRole?: string;
}

export interface ChemicalIdentityRecord {
  ingredientId: string;
  ingredientName: string;
  casNumber?: string;
  classification: MaterialStructuralClassification;
  isPureMolecule: boolean;
  structureStatus: 'STRUCTURE_AVAILABLE' | 'STRUCTURE_NOT_AVAILABLE' | 'COMMERCIAL_MIXTURE' | 'INSUFFICIENT_DATA';
  structure?: MolecularStructure;
  commercialComponents?: CommercialComponentRef[];
  scientificNote: string;
}

export interface SubstructureQuery {
  tag: string;
  name: string;
  smarts: string;
  description: string;
}

export interface SubstructureMatchResult {
  tag: string;
  name: string;
  matched: boolean;
  matchCount: number;
  smarts: string;
}

export interface StructuralSignal {
  id: string;
  signalType: 'IONIC_HEADGROUP' | 'HYDROPHOBE_CHAIN' | 'HYDROTROPE' | 'STERIC_SURFACTANT' | 'CHELATING_MOIETY';
  severity: 'INFO' | 'NOTICE' | 'WARNING';
  message: string;
  affectedIngredients: string[];
  structuralTags: string[];
}

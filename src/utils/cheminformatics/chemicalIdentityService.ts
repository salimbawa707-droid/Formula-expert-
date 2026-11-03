/**
 * ============================================================================
 * CHEMICAL IDENTITY & STRUCTURAL CLASSIFICATION SERVICE
 * ============================================================================
 * 
 * Bridges Universal Ingredient Library raw materials and Chemical Species Registry
 * with RDKit-driven molecular structures and commercial mixture reality.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. PURE MOLECULES vs COMMERCIAL MIXTURES:
 *    Commercial mixtures (LABSA 96%, SLES 70%, CAPB 30%, AOS 38%, Enzymes, Fragrance)
 *    are NEVER misrepresented as 100% pure single molecules.
 * 2. REFERENCE ACTIVE STRUCTURES:
 *    For key commercial surfactants, a pure reference monomer structure (e.g. C12-LABSA)
 *    may be provided for topological/structural signal analysis, with clear provenance
 *    indicating it is a representative active reference, not the assayed commercial blend.
 * 3. POLYMERS & UVCBs:
 *    High molecular weight polymers (Polyacrylates, PVP, Xanthan) and natural extracts
 *    (Pine Oil, Orange Terpenes) are flagged as POLYMER or COMPLEX_UVCB.
 * ============================================================================
 */

import {
  ChemicalIdentityRecord,
  MaterialStructuralClassification,
  MolecularStructure,
} from '../../domain/cheminformatics/types';
import { enrichMolecularStructure } from './rdkitAdapter';
import { CHEMICAL_SPECIES_REGISTRY } from '../../domain/ph/chemicalSpeciesRegistry';
import { UniversalIngredient } from '../../data/universalIngredientLibrary';

// Reference chemical structures for authoritative single molecules and reference surfactant actives
interface ReferenceMaterialMapping {
  classification: MaterialStructuralClassification;
  referenceSmiles?: string;
  isPureMolecule: boolean;
  scientificNote: string;
  commercialComponents?: Array<{
    name: string;
    canonicalSmiles?: string;
    casNumber?: string;
    approximatePercentage?: number;
    functionalRole?: string;
  }>;
}

const CANONICAL_STRUCTURAL_REGISTRY: Record<string, ReferenceMaterialMapping> = {
  // Pure Organic Acids & Builders
  'citric-acid-anh': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'C(C(=O)O)C(CC(=O)O)(C(=O)O)O', // Citric acid
    isPureMolecule: true,
    scientificNote: 'Pure tricarboxylic alpha-hydroxy acid. 100% stoichiometric single molecule.',
  },
  'citric-acid-uni': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'C(C(=O)O)C(CC(=O)O)(C(=O)O)O', // Citric acid
    isPureMolecule: true,
    scientificNote: 'Pure tricarboxylic alpha-hydroxy acid. 100% stoichiometric single molecule.',
  },
  'citric-acid-mono': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'C(C(=O)O)C(CC(=O)O)(C(=O)O)O.O', // Citric acid monohydrate
    isPureMolecule: true,
    scientificNote: 'Citric acid monohydrate crystal lattice.',
  },
  'sodium-citrate-dihyd': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: '[Na+].[Na+].[Na+].[O-]C(=O)CC(CC(=O)[O-])(C(=O)[O-])O.O.O',
    isPureMolecule: true,
    scientificNote: 'Trisodium citrate dihydrate pure crystalline salt.',
  },
  'edta-4na': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: '[Na+].[Na+].[Na+].[Na+].[O-]C(=O)CN(CCN(CC(=O)[O-])CC(=O)[O-])CC(=O)[O-]',
    isPureMolecule: true,
    scientificNote: 'Tetrasodium ethylenediaminetetraacetate chelating agent.',
  },

  // Pure Inorganic Salts & Alkalinity Sources
  'soda-ash-dense': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Na+].[O-]C(=O)[O-]', // Na2CO3
    isPureMolecule: true,
    scientificNote: 'Anhydrous sodium carbonate builder & alkalinity buffer.',
  },
  'soda-ash-uni': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Na+].[O-]C(=O)[O-]', // Na2CO3
    isPureMolecule: true,
    scientificNote: 'Anhydrous sodium carbonate builder & alkalinity buffer.',
  },
  'soda-ash-light': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Na+].[O-]C(=O)[O-]', // Na2CO3
    isPureMolecule: true,
    scientificNote: 'Low-density anhydrous sodium carbonate.',
  },
  'sodium-bicarbonate': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[O-]C(=O)O', // NaHCO3
    isPureMolecule: true,
    scientificNote: 'Sodium bicarbonate weak alkalinity buffer.',
  },
  'caustic-soda-pearls': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[OH-]', // NaOH
    isPureMolecule: true,
    scientificNote: 'Sodium hydroxide strong saponification / neutralization base.',
  },
  'caustic-potash-flakes': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[K+].[OH-]', // KOH
    isPureMolecule: true,
    scientificNote: 'Potassium hydroxide base for high-solubility liquid soaps.',
  },
  'sodium-chloride': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Cl-]',
    isPureMolecule: true,
    scientificNote: 'Sodium chloride electrolyte ionic viscosity builder.',
  },
  'sodium-chloride-uni': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Cl-]',
    isPureMolecule: true,
    scientificNote: 'Sodium chloride electrolyte ionic viscosity builder.',
  },
  'sodium-sulfate-anh': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Na+].[O-]S(=O)(=O)[O-]',
    isPureMolecule: true,
    scientificNote: 'Anhydrous sodium sulfate neutral powder filler.',
  },
  'sodium-sulfate-uni': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Na+].[O-]S(=O)(=O)[O-]',
    isPureMolecule: true,
    scientificNote: 'Anhydrous sodium sulfate neutral powder filler.',
  },
  'sodium-metasilicate-penta': {
    classification: 'INORGANIC_SALT',
    referenceSmiles: '[Na+].[Na+].[O-][Si](=O)[O-].O.O.O.O.O',
    isPureMolecule: true,
    scientificNote: 'Sodium metasilicate pentahydrate corrosion inhibitor & builder.',
  },

  // Pure Solvents & Small Molecules
  'glycerin-99': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'C(C(CO)O)O', // Glycerol
    isPureMolecule: true,
    scientificNote: 'Pure trihydroxy alcohol humectant & enzyme stabilizer (99.5% pure glycerol).',
  },
  'propylene-glycol-usp': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'CC(CO)O', // 1,2-Propanediol
    isPureMolecule: true,
    scientificNote: 'Propylene glycol solvent & freeze-thaw stabilizer.',
  },
  'ethanol-96': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'CCO', // Ethanol
    isPureMolecule: true,
    scientificNote: 'Ethanol solvent & hydrotrope (azeotropic 96% solution in water).',
  },
  'ipa-pure': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'CC(C)O', // Isopropanol
    isPureMolecule: true,
    scientificNote: 'Isopropyl alcohol degreaser & solvent.',
  },
  'triethanolamine-99': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'C(CO)N(CCO)CCO', // TEA
    isPureMolecule: true,
    scientificNote: 'Triethanolamine neutralizer & emulsifier.',
  },
  'urea-tech': {
    classification: 'SINGLE_MOLECULE',
    referenceSmiles: 'C(=O)(N)N', // Urea
    isPureMolecule: true,
    scientificNote: 'Urea hydrotrope & solubilizer.',
  },

  // Commercial Surfactant Mixtures (Represented with Reference Monomer Structure & Mixture Provenance)
  'labsa-96': {
    classification: 'COMMERCIAL_MIXTURE',
    referenceSmiles: 'CCCCCCCCCCCCc1ccc(cc1)S(=O)(=O)O', // C12 LAS acid reference
    isPureMolecule: false,
    scientificNote: 'Commercial LABSA is an isomeric mixture of C10-C14 alkylbenzene sulfonic acids (nominal active 96%). Structure shows canonical C12-homologue reference only.',
    commercialComponents: [
      { name: 'Linear Alkylbenzene Sulfonic Acids (C10-C14)', canonicalSmiles: 'CCCCCCCCCCCCc1ccc(cc1)S(=O)(=O)O', approximatePercentage: 96, functionalRole: 'Primary Anionic Surfactant' },
      { name: 'Sulfuric Acid (Residual)', canonicalSmiles: 'OS(=O)(=O)O', approximatePercentage: 1.5, functionalRole: 'Sulfonation By-product' },
      { name: 'Free Unsulfonated Hydrocarbons', approximatePercentage: 1.0, functionalRole: 'Residual Alkylate' },
      { name: 'Water', canonicalSmiles: 'O', approximatePercentage: 1.5, functionalRole: 'Moisture' },
    ],
  },
  'sles-70': {
    classification: 'COMMERCIAL_MIXTURE',
    referenceSmiles: '[Na+].CCCCCCCCCCCCOCCOCCOS(=O)(=O)[O-]', // C12-2EO Sodium Laureth Sulfate
    isPureMolecule: false,
    scientificNote: 'Commercial SLES 70% paste is an oligomeric ethoxylate mixture (average 2 mol EO, C12-C14 alkyl cut). Structure represents canonical C12-2EO sodium laureth sulfate.',
    commercialComponents: [
      { name: 'Sodium Alkyl Ether Sulfates (C12-C14, 2EO)', approximatePercentage: 70, functionalRole: 'Primary High-Foam Anionic Surfactant' },
      { name: 'Water', canonicalSmiles: 'O', approximatePercentage: 27.5, functionalRole: 'Carrier Solvent' },
      { name: 'Sodium Chloride / Sodium Sulfate', approximatePercentage: 1.5, functionalRole: 'Inorganic Salt' },
      { name: 'Unreacted Fatty Alcohol Ethoxylate', approximatePercentage: 1.0, functionalRole: 'Nonionic Residual' },
    ],
  },
  'capb-30': {
    classification: 'COMMERCIAL_MIXTURE',
    referenceSmiles: 'CCCCCCCCCCC(=O)NCCCC[N+](C)(C)CC(=O)[O-]', // Lauramidopropyl betaine reference
    isPureMolecule: false,
    scientificNote: 'Commercial CAPB 30% aqueous solution is an amphoteric betaine blend from coconut fatty acids. Structure represents canonical C12-amidopropyl betaine active.',
    commercialComponents: [
      { name: 'Cocamidopropyl Betaine Actives', approximatePercentage: 30, functionalRole: 'Amphoteric Surfactant & Foam Booster' },
      { name: 'Water', canonicalSmiles: 'O', approximatePercentage: 64, functionalRole: 'Carrier Solvent' },
      { name: 'Sodium Chloride', canonicalSmiles: '[Na+].[Cl-]', approximatePercentage: 5, functionalRole: 'Quaternization By-product' },
      { name: 'Free Amidoamine / Fatty Acid', approximatePercentage: 1, functionalRole: 'Residual' },
    ],
  },
  'aos-38': {
    classification: 'COMMERCIAL_MIXTURE',
    referenceSmiles: '[Na+].CCCCCCCCCCCC/C=C/S(=O)(=O)[O-]', // C14 alkene sulfonate reference
    isPureMolecule: false,
    scientificNote: 'Commercial Alpha Olefin Sulfonate 38% aqueous solution is a mixture of alkene sulfonates and hydroxyalkane sulfonates (C14-C16).',
    commercialComponents: [
      { name: 'Sodium C14-16 Olefin Sulfonate', approximatePercentage: 38, functionalRole: 'Hard-water tolerant Anionic Surfactant' },
      { name: 'Water', canonicalSmiles: 'O', approximatePercentage: 60, functionalRole: 'Carrier Solvent' },
      { name: 'Sodium Sulfate / Sodium Chloride', approximatePercentage: 2, functionalRole: 'Inorganic Salt' },
    ],
  },
  'cetrimonium-chloride': {
    classification: 'COMMERCIAL_MIXTURE',
    referenceSmiles: 'CCCCCCCCCCCCCCCC[N+](C)(C)C.[Cl-]', // C16 Quat
    isPureMolecule: false,
    scientificNote: 'Cationic quaternary ammonium conditioning active (Cetrimonium Chloride).',
    commercialComponents: [
      { name: 'Cetrimonium Chloride Actives', approximatePercentage: 30, functionalRole: 'Cationic Conditioning Surfactant' },
      { name: 'Water', canonicalSmiles: 'O', approximatePercentage: 70, functionalRole: 'Carrier Solvent' },
    ],
  },

  // Polymers
  'carbomer-940': {
    classification: 'POLYMER',
    isPureMolecule: false,
    scientificNote: 'Crosslinked polyacrylic acid polymer (Carbomer 940). Discreet small-molecule SMILES is not applicable to crosslinked high polymers.',
  },
  'pvp-k30': {
    classification: 'POLYMER',
    isPureMolecule: false,
    scientificNote: 'Polyvinylpyrrolidone K-30 dye-transfer inhibitor polymer (MW ~40,000 Da).',
  },
  'xanthan-gum': {
    classification: 'POLYMER',
    isPureMolecule: false,
    scientificNote: 'Polysaccharide high-molecular-weight biopolymer thickener.',
  },
};

const CAS_STRUCTURAL_REGISTRY: Record<string, string> = {
  '77-92-9': 'citric-acid-uni',
  '5949-29-1': 'citric-acid-mono',
  '6132-04-3': 'sodium-citrate-dihyd',
  '497-19-8': 'soda-ash-uni',
  '144-55-8': 'sodium-bicarbonate',
  '1310-73-2': 'caustic-soda-pearls',
  '1310-58-3': 'caustic-potash-flakes',
  '7647-14-5': 'sodium-chloride-uni',
  '7757-82-6': 'sodium-sulfate-uni',
  '56-81-5': 'glycerin-99',
  '57-55-6': 'propylene-glycol-usp',
  '64-17-5': 'ethanol-96',
  '67-63-0': 'ipa-pure',
  '102-71-6': 'triethanolamine-99',
  '57-13-6': 'urea-tech',
  '64-02-8': 'edta-4na',
  '27176-87-0': 'labsa-96',
  '68585-34-2': 'sles-70',
  '9004-82-4': 'sles-70',
  '61789-40-0': 'capb-30',
  '68439-57-6': 'aos-38',
  '9003-01-4': 'carbomer-940',
  '9003-39-8': 'pvp-k30',
  '112-02-7': 'cetrimonium-chloride',
};

/**
 * Resolves a Chemical Identity Record for an ingredient, utilizing RDKit when a valid
 * reference structure exists.
 */
export async function resolveChemicalIdentity(
  ingredient: UniversalIngredient
): Promise<ChemicalIdentityRecord> {
  if (!ingredient || !ingredient.id) {
    return {
      ingredientId: 'UNKNOWN',
      ingredientName: 'Unknown Material',
      classification: 'UNKNOWN_STRUCTURE',
      isPureMolecule: false,
      structureStatus: 'INSUFFICIENT_DATA',
      scientificNote: 'Invalid or undefined ingredient passed to chemical identity service.',
    };
  }

  let mapping = CANONICAL_STRUCTURAL_REGISTRY[ingredient.id];
  if (!mapping && ingredient.casNumber && CAS_STRUCTURAL_REGISTRY[ingredient.casNumber]) {
    mapping = CANONICAL_STRUCTURAL_REGISTRY[CAS_STRUCTURAL_REGISTRY[ingredient.casNumber]];
  }

  // If known mapping exists
  if (mapping) {
    let structure: MolecularStructure | undefined;
    let structureStatus: ChemicalIdentityRecord['structureStatus'] = 'STRUCTURE_NOT_AVAILABLE';

    if (mapping.referenceSmiles) {
      const enriched = await enrichMolecularStructure(mapping.referenceSmiles);
      if (enriched) {
        structure = enriched;
        structureStatus = mapping.isPureMolecule ? 'STRUCTURE_AVAILABLE' : 'COMMERCIAL_MIXTURE';
      }
    } else if (mapping.classification === 'COMMERCIAL_MIXTURE') {
      structureStatus = 'COMMERCIAL_MIXTURE';
    } else if (mapping.classification === 'POLYMER') {
      structureStatus = 'STRUCTURE_NOT_AVAILABLE';
    }

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      casNumber: ingredient.casNumber || undefined,
      classification: mapping.classification,
      isPureMolecule: mapping.isPureMolecule,
      structureStatus,
      structure,
      commercialComponents: mapping.commercialComponents,
      scientificNote: mapping.scientificNote,
    };
  }

  // Check chemicalSpeciesRegistry for species match by formula or id
  const speciesEntry = Object.values(CHEMICAL_SPECIES_REGISTRY).find(
    s => s.speciesId === ingredient.id || s.displayName.toLowerCase() === ingredient.name.toLowerCase()
  );

  if (speciesEntry && speciesEntry.formula) {
    // Attempt parsing formula or fallback
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      casNumber: ingredient.casNumber || undefined,
      classification: speciesEntry.family === 'CARBOXYLIC_WEAK_ACID' || speciesEntry.family === 'SULFONIC_ACID_LABSA' ? 'SINGLE_MOLECULE' : 'INORGANIC_SALT',
      isPureMolecule: true,
      structureStatus: 'INSUFFICIENT_DATA',
      scientificNote: `Authoritative species in ChemicalSpeciesRegistry (${speciesEntry.family}, MW: ${speciesEntry.mw}). Discreet SMILES pending standard database entry.`,
    };
  }

  // Fallback for generic or complex materials
  const isPolymer = /polymer|polyacrylate|pvp|xanthan|carbomer|cellulos/i.test(ingredient.name);
  const isMixture = /blend|fragrance|perfume|extract|oil|enzyme/i.test(ingredient.name);

  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    casNumber: ingredient.casNumber || undefined,
    classification: isPolymer ? 'POLYMER' : isMixture ? 'COMMERCIAL_MIXTURE' : 'UNKNOWN_STRUCTURE',
    isPureMolecule: false,
    structureStatus: isMixture ? 'COMMERCIAL_MIXTURE' : 'STRUCTURE_NOT_AVAILABLE',
    scientificNote: isPolymer
      ? 'Polydisperse polymer material; discrete small-molecule SMILES is not applicable.'
      : isMixture
      ? 'Commercial blended raw material. Single molecular formula does not apply.'
      : 'Structural SMILES data unavailable in canonical library for this commercial raw material.',
  };
}

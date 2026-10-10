/**
 * ============================================================================
 * RDKIT WASM CHEMINFORMATICS ADAPTER
 * ============================================================================
 * 
 * Production-safe integration adapter for @rdkit/rdkit WebAssembly module.
 * 
 * SCIENTIFIC BOUNDARIES:
 * - Provides molecular topological parsing, canonical SMILES, 2D depictions,
 *   substructure matches, and theoretical descriptors.
 * - NEVER claims laboratory certification, raw material assay, or purity.
 * - Resource-safe: Every Mol and QMol object is explicitly deleted.
 * - Fault-tolerant: If WASM fails to load, gracefully returns null / fallback
 *   with status CHEMICAL_INTELLIGENCE_UNAVAILABLE.
 * ============================================================================
 */

import initRDKitModule, { MainModule, Mol } from '@rdkit/rdkit';
import {
  MolecularDescriptors,
  MolecularStructure,
  SubstructureQuery,
  SubstructureMatchResult,
  StructuralEvidenceLevel,
} from '../../domain/cheminformatics/types';

// Maximum allowed SMILES string length to prevent resource exhaustion / DoS
const MAX_SMILES_LENGTH = 500;

// Singleton state
let rdkitInstance: MainModule | null = null;
let rdkitInitPromise: Promise<MainModule | null> | null = null;
let rdkitInitFailed = false;
let rdkitFailureReason: string | null = null;

// In-memory LRU-style descriptor cache keyed by canonical SMILES
const structureCache = new Map<string, MolecularStructure>();
const MAX_CACHE_SIZE = 1000;

/**
 * Standard detergent functional-group SMARTS queries
 */
export const DETERGENT_SUBSTRUCTURE_QUERIES: SubstructureQuery[] = [
  {
    tag: 'SULFONATE',
    name: 'Sulfonic Acid / Sulfonate',
    smarts: 'S(=O)(=O)[O,OH]',
    description: 'Anionic surfactant headgroup characteristic of LABSA, LAS, AOS, SAS',
  },
  {
    tag: 'SULFATE_ESTER',
    name: 'Alkyl Sulfate / Ether Sulfate',
    smarts: 'OS(=O)(=O)[O,OH]',
    description: 'Anionic surfactant headgroup characteristic of SLS, SLES',
  },
  {
    tag: 'CARBOXYLATE',
    name: 'Carboxylic Acid / Soap / Carboxylate',
    smarts: 'C(=O)[O,OH]',
    description: 'Fatty acid soap, citric acid, or polycarboxylate builder moiety',
  },
  {
    tag: 'QUATERNARY_AMMONIUM',
    name: 'Quaternary Ammonium',
    smarts: '[N+]([#6])([#6])([#6])[#6]',
    description: 'Cationic surfactant or fabric softener active headgroup',
  },
  {
    tag: 'ETHOXYLATE_UNIT',
    name: 'Ethoxylate Unit (Oligomer)',
    smarts: 'CCO',
    description: 'Ethylene oxide chain unit in nonionic surfactants (e.g. Alcohol Ethoxylates, SLES)',
  },
  {
    tag: 'BETAINE_ZWITTERION',
    name: 'Betaine Zwitterion',
    smarts: '[N+]([#6])([#6])([#6])CC(=O)[O-]',
    description: 'Amphoteric betaine headgroup (e.g. Cocamidopropyl Betaine)',
  },
  {
    tag: 'AMINE_OXIDE',
    name: 'Amine Oxide',
    smarts: '[N+]([#6])([#6])([#6])[O-]',
    description: 'Amphoteric amine oxide foam booster (e.g. Lauramine Oxide)',
  },
  {
    tag: 'PHOSPHONATE',
    name: 'Phosphonate Chelate',
    smarts: 'P(=O)([O,OH])[O,OH]',
    description: 'Phosphonic acid sequestrant (e.g. ATMP, HEDP, DTPMP)',
  },
  {
    tag: 'ALIPHATIC_HYDROPHOBE',
    name: 'Aliphatic Hydrophobe Chain',
    smarts: 'CCCC',
    description: 'Lipophilic carbon chain tail (>= 4 saturated carbons)',
  },
  {
    tag: 'AROMATIC_RING',
    name: 'Aromatic Ring',
    smarts: 'a1aaaaa1',
    description: 'Aromatic core characteristic of LAS/LABSA and fragrance rings',
  },
];

/**
 * Initializes the RDKit WASM module asynchronously with environment adaptation.
 * Works seamlessly in Browser (Vite dev & prod), Node.js, and Capacitor Android WebView.
 */
export async function initializeRDKit(): Promise<MainModule | null> {
  if (rdkitInstance) {
    return rdkitInstance;
  }
  if (rdkitInitFailed) {
    return null;
  }
  if (rdkitInitPromise) {
    return rdkitInitPromise;
  }

  rdkitInitPromise = (async () => {
    try {
      const options: Record<string, unknown> = {};

      // In browser or Capacitor environment, configure WASM asset location
      if (typeof window !== 'undefined') {
        options.locateFile = (file: string) => {
          if (file.endsWith('.wasm')) {
            try {
              // Resolves against current origin / base path safely in WebView
              return new URL(`wasm/${file}`, window.location.href).href;
            } catch {
              return `./wasm/${file}`;
            }
          }
          return file;
        };
      }

      // Initialize official factory
      const module = await initRDKitModule(options);
      if (module && typeof module.version === 'function') {
        rdkitInstance = module;
        return module;
      }
      throw new Error('RDKit module initialized without valid interface.');
    } catch (err) {
      rdkitInitFailed = true;
      rdkitFailureReason = err instanceof Error ? err.message : String(err);
      console.warn('[RDKitAdapter] RDKit WASM initialization failed:', rdkitFailureReason);
      return null;
    }
  })();

  return rdkitInitPromise;
}

/**
 * Returns current initialization status of RDKit WASM.
 */
export function getRDKitStatus(): {
  isInitialized: boolean;
  version: string | null;
  hasFailed: boolean;
  failureReason: string | null;
} {
  return {
    isInitialized: rdkitInstance !== null,
    version: rdkitInstance ? rdkitInstance.version() : null,
    hasFailed: rdkitInitFailed,
    failureReason: rdkitFailureReason,
  };
}

/**
 * Validates a SMILES string using RDKit's chemical graph parser.
 */
export async function validateSmiles(smiles: string): Promise<boolean> {
  if (!smiles || typeof smiles !== 'string' || smiles.trim().length === 0) {
    return false;
  }
  const clean = smiles.trim();
  if (clean.length > MAX_SMILES_LENGTH) {
    return false;
  }

  const rdkit = await initializeRDKit();
  if (!rdkit) {
    return false;
  }

  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(clean);
    return mol !== null && mol.is_valid();
  } catch {
    return false;
  } finally {
    if (mol) {
      mol.delete();
    }
  }
}

/**
 * Returns the canonical SMILES representation of a given SMILES string.
 */
export async function canonicalizeSmiles(smiles: string): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0 || smiles.length > MAX_SMILES_LENGTH) {
    return null;
  }

  const rdkit = await initializeRDKit();
  if (!rdkit) {
    return null;
  }

  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(smiles.trim());
    if (!mol || !mol.is_valid()) {
      return null;
    }
    return mol.get_smiles();
  } catch {
    return null;
  } finally {
    if (mol) {
      mol.delete();
    }
  }
}

/**
 * Computes theoretical molecular descriptors via RDKit.
 */
export async function calculateMolecularDescriptors(smiles: string): Promise<MolecularDescriptors | null> {
  if (!smiles || smiles.trim().length === 0 || smiles.length > MAX_SMILES_LENGTH) {
    return null;
  }

  const rdkit = await initializeRDKit();
  if (!rdkit) {
    return null;
  }

  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(smiles.trim());
    if (!mol || !mol.is_valid()) {
      return null;
    }

    const descJson = mol.get_descriptors();
    const raw = JSON.parse(descJson);

    // Calculate approximate formal charge from SMILES or atom charges
    let formalCharge = 0;
    const posMatches = smiles.match(/\[\w+\+\]|\[\w+\+\d+\]|\+/g);
    const negMatches = smiles.match(/\[\w+\-\]|\[\w+\-\d+\]|\-/g);
    if (posMatches) formalCharge += posMatches.length;
    if (negMatches) formalCharge -= negMatches.length;

    return {
      molecularWeight: Number((raw.amw ?? 0).toFixed(4)),
      exactMass: Number((raw.exactmw ?? 0).toFixed(4)),
      logP: Number((raw.CrippenClogP ?? 0).toFixed(2)),
      tpsa: Number((raw.tpsa ?? 0).toFixed(2)),
      rotatableBondCount: Math.round(raw.NumRotatableBonds ?? 0),
      hBondDonorCount: Math.round(raw.lipinskiHBD ?? raw.NumHBD ?? 0),
      hBondAcceptorCount: Math.round(raw.lipinskiHBA ?? raw.NumHBA ?? 0),
      heavyAtomCount: Math.round(raw.NumHeavyAtoms ?? 0),
      formalCharge,
      fractionCsp3: Number((raw.FractionCSP3 ?? 0).toFixed(3)),
      ringCount: Math.round(raw.NumRings ?? 0),
      aromaticRingCount: Math.round(raw.NumAromaticRings ?? 0),
    };
  } catch (err) {
    console.warn('[RDKitAdapter] Descriptor calculation error:', err);
    return null;
  } finally {
    if (mol) {
      mol.delete();
    }
  }
}

/**
 * Matches a single SMARTS pattern against a target SMILES structure.
 */
export async function matchSubstructure(smiles: string, smarts: string): Promise<SubstructureMatchResult> {
  const fallback: SubstructureMatchResult = {
    tag: 'CUSTOM',
    name: 'Custom SMARTS',
    matched: false,
    matchCount: 0,
    smarts,
  };

  if (!smiles || !smarts || smiles.length > MAX_SMILES_LENGTH) {
    return fallback;
  }

  const rdkit = await initializeRDKit();
  if (!rdkit) {
    return fallback;
  }

  let mol: Mol | null = null;
  let qmol: Mol | null = null;
  try {
    mol = rdkit.get_mol(smiles.trim());
    if (!mol || !mol.is_valid()) {
      return fallback;
    }

    qmol = rdkit.get_qmol(smarts.trim());
    if (!qmol || !qmol.is_valid()) {
      return fallback;
    }

    const matchesJson = mol.get_substruct_matches(qmol);
    const parsed = JSON.parse(matchesJson || '[]');
    const matchCount = Array.isArray(parsed) ? parsed.length : 0;

    return {
      tag: 'MATCHED',
      name: smarts,
      matched: matchCount > 0,
      matchCount,
      smarts,
    };
  } catch {
    return fallback;
  } finally {
    if (mol) mol.delete();
    if (qmol) qmol.delete();
  }
}

/**
 * Runs a suite of substructure queries against a molecule.
 */
export async function batchMatchSubstructures(
  smiles: string,
  queries: SubstructureQuery[] = DETERGENT_SUBSTRUCTURE_QUERIES
): Promise<SubstructureMatchResult[]> {
  const results: SubstructureMatchResult[] = [];
  const rdkit = await initializeRDKit();
  if (!rdkit || !smiles || smiles.length > MAX_SMILES_LENGTH) {
    return queries.map(q => ({
      tag: q.tag,
      name: q.name,
      matched: false,
      matchCount: 0,
      smarts: q.smarts,
    }));
  }

  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(smiles.trim());
    if (!mol || !mol.is_valid()) {
      return queries.map(q => ({
        tag: q.tag,
        name: q.name,
        matched: false,
        matchCount: 0,
        smarts: q.smarts,
      }));
    }

    for (const q of queries) {
      let qmol: Mol | null = null;
      try {
        qmol = rdkit.get_qmol(q.smarts);
        if (qmol && qmol.is_valid()) {
          const matchStr = mol.get_substruct_matches(qmol);
          const parsed = JSON.parse(matchStr || '[]');
          const count = Array.isArray(parsed) ? parsed.length : 0;
          results.push({
            tag: q.tag,
            name: q.name,
            matched: count > 0,
            matchCount: count,
            smarts: q.smarts,
          });
        } else {
          results.push({
            tag: q.tag,
            name: q.name,
            matched: false,
            matchCount: 0,
            smarts: q.smarts,
          });
        }
      } catch {
        results.push({
          tag: q.tag,
          name: q.name,
          matched: false,
          matchCount: 0,
          smarts: q.smarts,
        });
      } finally {
        if (qmol) qmol.delete();
      }
    }
  } finally {
    if (mol) mol.delete();
  }

  return results;
}

/**
 * Generates an SVG 2D vector depiction of the chemical structure.
 */
export async function generate2DDepictionSvg(
  smiles: string,
  width = 250,
  height = 180
): Promise<string | null> {
  if (!smiles || smiles.length > MAX_SMILES_LENGTH) {
    return null;
  }

  const rdkit = await initializeRDKit();
  if (!rdkit) {
    return null;
  }

  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(smiles.trim());
    if (!mol || !mol.is_valid()) {
      return null;
    }
    return mol.get_svg(width, height);
  } catch {
    return null;
  } finally {
    if (mol) {
      mol.delete();
    }
  }
}

/**
 * Calculates Tanimoto structural similarity between two SMILES using Morgan fingerprints.
 */
export async function calculateTanimotoSimilarity(
  smiles1: string,
  smiles2: string
): Promise<number | null> {
  if (!smiles1 || !smiles2) return null;

  const rdkit = await initializeRDKit();
  if (!rdkit) return null;

  let mol1: Mol | null = null;
  let mol2: Mol | null = null;
  try {
    mol1 = rdkit.get_mol(smiles1.trim());
    mol2 = rdkit.get_mol(smiles2.trim());
    if (!mol1 || !mol1.is_valid() || !mol2 || !mol2.is_valid()) {
      return null;
    }

    const fp1 = mol1.get_morgan_fp();
    const fp2 = mol2.get_morgan_fp();
    if (!fp1 || !fp2 || fp1.length !== fp2.length) {
      return null;
    }

    let intersection = 0;
    let union = 0;
    for (let i = 0; i < fp1.length; i++) {
      const bit1 = fp1.charCodeAt(i) === 49 ? 1 : 0; // '1'
      const bit2 = fp2.charCodeAt(i) === 49 ? 1 : 0; // '1'
      if (bit1 && bit2) intersection++;
      if (bit1 || bit2) union++;
    }

    return union === 0 ? 1.0 : Number((intersection / union).toFixed(4));
  } catch {
    return null;
  } finally {
    if (mol1) mol1.delete();
    if (mol2) mol2.delete();
  }
}

/**
 * Full structural enrichment: Canonicalizes SMILES, extracts descriptors,
 * assigns substructure tags, generates InChI/InChIKey, and creates 2D depiction.
 */
export async function enrichMolecularStructure(smiles: string): Promise<MolecularStructure | null> {
  if (!smiles || typeof smiles !== 'string' || smiles.trim().length === 0) {
    return null;
  }
  const clean = smiles.trim();
  if (clean.length > MAX_SMILES_LENGTH) {
    return null;
  }

  // Check cache
  if (structureCache.has(clean)) {
    return structureCache.get(clean)!;
  }

  const rdkit = await initializeRDKit();
  if (!rdkit) {
    return null;
  }

  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(clean);
    if (!mol || !mol.is_valid()) {
      return null;
    }

    const canonical = mol.get_smiles();
    if (structureCache.has(canonical)) {
      return structureCache.get(canonical)!;
    }

    const inchi = mol.get_inchi();
    const inchiKey = inchi ? rdkit.get_inchikey_for_inchi(inchi) : undefined;
    const descJson = mol.get_descriptors();
    const raw = JSON.parse(descJson || '{}');
    const svg = mol.get_svg(260, 180);

    // Substructure tags
    const substructureMatches = await batchMatchSubstructures(canonical);
    const tags = substructureMatches.filter(m => m.matched).map(m => m.tag);

    // Formal charge
    let formalCharge = 0;
    const posMatches = canonical.match(/\[\w+\+\]|\[\w+\+\d+\]|\+/g);
    const negMatches = canonical.match(/\[\w+\-\]|\[\w+\-\d+\]|\-/g);
    if (posMatches) formalCharge += posMatches.length;
    if (negMatches) formalCharge -= negMatches.length;

    const result: MolecularStructure = {
      smiles: clean,
      canonicalSmiles: canonical,
      inchi,
      inchiKey,
      molecularWeight: Number((raw.amw ?? 0).toFixed(4)),
      exactMass: Number((raw.exactmw ?? 0).toFixed(4)),
      logP: Number((raw.CrippenClogP ?? 0).toFixed(2)),
      tpsa: Number((raw.tpsa ?? 0).toFixed(2)),
      rotatableBondCount: Math.round(raw.NumRotatableBonds ?? 0),
      hBondDonorCount: Math.round(raw.lipinskiHBD ?? raw.NumHBD ?? 0),
      hBondAcceptorCount: Math.round(raw.lipinskiHBA ?? raw.NumHBA ?? 0),
      heavyAtomCount: Math.round(raw.NumHeavyAtoms ?? 0),
      formalCharge,
      fractionCsp3: Number((raw.FractionCSP3 ?? 0).toFixed(3)),
      ringCount: Math.round(raw.NumRings ?? 0),
      aromaticRingCount: Math.round(raw.NumAromaticRings ?? 0),
      substructureTags: tags,
      rdkitVersion: rdkit.version(),
      calculatedAt: new Date().toISOString(),
      evidenceLevel: 'CALCULATED_STRUCTURE' as StructuralEvidenceLevel,
      svgDepiction: svg,
    };

    // Cache management
    if (structureCache.size >= MAX_CACHE_SIZE) {
      const firstKey = structureCache.keys().next().value;
      if (firstKey) structureCache.delete(firstKey);
    }
    structureCache.set(canonical, result);
    structureCache.set(clean, result);

    return result;
  } catch (err) {
    console.warn('[RDKitAdapter] Error during structure enrichment:', err);
    return null;
  } finally {
    if (mol) {
      mol.delete();
    }
  }
}

/**
 * Science Service
 * Production implementation of Google DeepMind Science Skills:
 * - PubChem PUG REST & PUG View (Computed properties, 3D conformer SDF, GHS safety, similarity)
 * - AlphaFold DB & RCSB PDB (Enzymatic macromolecular structures, pLDDT metrics)
 * - PubMed & Europe PMC (Peer-reviewed cleaning & detergent literature search)
 */

export interface PubChemCompoundProperties {
  CID: number;
  Title?: string;
  IUPACName?: string;
  MolecularFormula?: string;
  MolecularWeight?: string | number;
  CanonicalSMILES?: string;
  IsomericSMILES?: string;
  InChI?: string;
  InChIKey?: string;
  XLogP?: number;
  TPSA?: number;
  HBondDonorCount?: number;
  HBondAcceptorCount?: number;
  RotatableBondCount?: number;
  HeavyAtomCount?: number;
  Complexity?: number;
  Charge?: number;
}

export interface PubChemSafetyHazard {
  classification?: string;
  hazardCodes?: string[];
  hazardStatements?: string[];
  precautionaryStatements?: string[];
}

export interface AlphaFoldModelDescriptor {
  entryId: string;
  gene: string;
  uniprotAccession: string;
  uniprotId: string;
  uniprotDescription: string;
  organismScientificName: string;
  uniprotStart: number;
  uniprotEnd: number;
  cifUrl: string;
  bcifUrl?: string;
  pdbUrl: string;
  paeImageUrl?: string;
  paeDocUrl?: string;
}

export interface ScientificArticle {
  id: string;
  source: 'PubMed' | 'Europe PMC';
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  doi?: string;
  pmid?: string;
  abstractSnippet?: string;
  url: string;
}

/**
 * Robust fetchWithRetry with exponential backoff handling rate limits
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < maxRetries
      ) {
        const retryAfter = Number(response.headers.get('Retry-After'));
        const delay =
          !Number.isNaN(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 200)}`
      );
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Exhausted retries for ${url}`);
}

/**
 * PubChem: Resolve Compound Name or CAS number to CID
 */
export async function resolvePubChemCid(query: string): Promise<number | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;
  
  // If it's already a numeric CID
  if (/^\d+$/.test(cleanQuery)) {
    return parseInt(cleanQuery, 10);
  }

  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanQuery)}/cids/JSON`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    const cids = data?.IdentifierList?.CID;
    if (Array.isArray(cids) && cids.length > 0) {
      return cids[0];
    }
  } catch (err) {
    console.warn(`PubChem CID lookup failed for "${cleanQuery}":`, err);
  }
  return null;
}

/**
 * PubChem: Retrieve full physicochemical properties by CID
 */
export async function getPubChemProperties(cid: number): Promise<PubChemCompoundProperties | null> {
  try {
    const props = [
      'Title',
      'IUPACName',
      'MolecularFormula',
      'MolecularWeight',
      'CanonicalSMILES',
      'IsomericSMILES',
      'InChI',
      'InChIKey',
      'XLogP',
      'TPSA',
      'HBondDonorCount',
      'HBondAcceptorCount',
      'RotatableBondCount',
      'HeavyAtomCount',
      'Complexity',
      'Charge'
    ].join(',');

    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/${props}/JSON`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    const propList = data?.PropertyTable?.Properties;
    if (Array.isArray(propList) && propList.length > 0) {
      return propList[0] as PubChemCompoundProperties;
    }
  } catch (err) {
    console.error(`Failed to fetch properties for CID ${cid}:`, err);
  }
  return null;
}

/**
 * PubChem: Retrieve 3D Conformer SDF text for 3Dmol.js viewer
 */
export async function getPubChem3DConformerSDF(cid: number): Promise<string | null> {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;
    const res = await fetchWithRetry(url);
    const sdfText = await res.text();
    if (sdfText && (sdfText.includes('$$$$') || sdfText.includes('M  END'))) {
      return sdfText;
    }
  } catch (err) {
    console.warn(`3D Conformer not found in PubChem for CID ${cid}, attempting 2D SDF:`, err);
    try {
      const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=2d`;
      const res2d = await fetchWithRetry(url2d);
      return await res2d.text();
    } catch (e) {
      console.warn(`2D SDF fallback failed for CID ${cid}:`, e);
    }
  }
  return null;
}

/**
 * PubChem: Retrieve PUG-View GHS Safety & Hazards
 */
export async function getPubChemSafetyData(cid: number): Promise<PubChemSafetyHazard> {
  const result: PubChemSafetyHazard = {
    hazardCodes: [],
    hazardStatements: [],
    precautionaryStatements: [],
  };

  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Safety+and+Hazards`;
    const res = await fetchWithRetry(url);
    const data = await res.json();

    // Helper to recursively walk sections for GHS Classification
    const walkSections = (sections: any[]) => {
      if (!Array.isArray(sections)) return;
      for (const section of sections) {
        if (section.TOCHeading === 'GHS Classification') {
          const info = section.Information || [];
          for (const item of info) {
            const val = item.Value;
            if (val?.StringWithMarkup) {
              for (const mark of val.StringWithMarkup) {
                const str = mark.String || '';
                if (str.startsWith('H') && str.length > 4 && !result.hazardStatements?.includes(str)) {
                  result.hazardStatements?.push(str);
                } else if (str.startsWith('P') && str.length > 4 && !result.precautionaryStatements?.includes(str)) {
                  result.precautionaryStatements?.push(str);
                }
              }
            }
          }
        }
        if (section.Section) {
          walkSections(section.Section);
        }
      }
    };

    if (data?.Record?.Section) {
      walkSections(data.Record.Section);
    }
  } catch (err) {
    console.warn(`Failed to fetch PubChem safety hazards for CID ${cid}:`, err);
  }

  return result;
}

/**
 * PubChem: Fast 2D Similarity Search to find chemical analogs / alternative surfactants
 */
export async function getPubChemSimilarCompounds(cid: number, threshold = 85, maxRecords = 8): Promise<number[]> {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastsimilarity_2d/cid/${cid}/cids/JSON?Threshold=${threshold}&MaxRecords=${maxRecords}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    const cids = data?.IdentifierList?.CID;
    if (Array.isArray(cids)) {
      return cids.filter((c: number) => c !== cid);
    }
  } catch (err) {
    console.warn(`Fast similarity search failed for CID ${cid}:`, err);
  }
  return [];
}

/**
 * AlphaFold DB: Query structural model descriptors by UniProt Accession
 */
export async function getAlphaFoldPrediction(uniprotId: string): Promise<AlphaFoldModelDescriptor | null> {
  const cleanId = uniprotId.trim().toUpperCase();
  try {
    const url = `https://alphafold.ebi.ac.uk/api/prediction/${cleanId}`;
    const res = await fetchWithRetry(url);
    const models = await res.json();
    if (Array.isArray(models) && models.length > 0) {
      return models[0] as AlphaFoldModelDescriptor;
    }
  } catch (err) {
    console.warn(`AlphaFold prediction lookup failed for UniProt ${cleanId}:`, err);
  }
  return null;
}

/**
 * RCSB PDB: Fetch Experimental Structure CIF Text
 */
export async function getRcsbStructureCif(pdbId: string): Promise<string | null> {
  const cleanId = pdbId.trim().toUpperCase();
  try {
    const url = `https://files.rcsb.org/download/${cleanId}.cif`;
    const res = await fetchWithRetry(url);
    return await res.text();
  } catch (err) {
    console.warn(`Failed to fetch RCSB CIF for PDB ID ${cleanId}:`, err);
  }
  return null;
}

/**
 * RCSB PDB: Fetch metadata for entry
 */
export async function getRcsbPdbMetadata(pdbId: string): Promise<any | null> {
  const cleanId = pdbId.trim().toUpperCase();
  try {
    const url = `https://data.rcsb.org/rest/v1/core/entry/${cleanId}`;
    const res = await fetchWithRetry(url);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch RCSB metadata for ${cleanId}:`, err);
  }
  return null;
}

/**
 * PubMed: Two-step search pipeline (ESearch -> ESummary)
 */
export async function searchPubMedArticles(term: string, retmax = 6): Promise<ScientificArticle[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&sort=pub_date&retmode=json&retmax=${retmax}`;
    const searchRes = await fetchWithRetry(searchUrl);
    const searchData = await searchRes.json();
    const idList: string[] = searchData?.esearchresult?.idlist || [];

    if (idList.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryRes = await fetchWithRetry(summaryUrl);
    const summaryData = await summaryRes.json();

    const result: ScientificArticle[] = [];
    const uidMap = summaryData?.result || {};

    for (const pmid of idList) {
      const item = uidMap[pmid];
      if (item) {
        const authors = (item.authors || []).map((a: any) => a.name).slice(0, 3);
        const doi = (item.articleids || []).find((id: any) => id.idtype === 'doi')?.value;
        result.push({
          id: pmid,
          source: 'PubMed',
          title: item.title?.replace(/<[^>]+>/g, '') || 'Untitled Article',
          authors,
          journal: item.source || 'Journal',
          pubDate: item.pubdate || '',
          pmid,
          doi,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        });
      }
    }
    return result;
  } catch (err) {
    console.warn(`PubMed article search failed for "${term}":`, err);
    return [];
  }
}

/**
 * Europe PMC: Search biomedical and bio-engineering literature
 */
export async function searchEuropePmcArticles(query: string, pageSize = 6): Promise<ScientificArticle[]> {
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${pageSize}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    const list = data?.resultList?.result || [];

    return list.map((item: any) => ({
      id: item.id || item.pmid || String(Math.random()),
      source: 'Europe PMC',
      title: item.title || 'Untitled',
      authors: item.authorString ? item.authorString.split(',').slice(0, 3) : [],
      journal: item.journalTitle || 'Europe PMC Indexed',
      pubDate: item.pubYear || '',
      doi: item.doi,
      pmid: item.pmid,
      abstractSnippet: item.abstractText ? item.abstractText.slice(0, 240) + '...' : undefined,
      url: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/MED/${item.pmid || item.id}`,
    }));
  } catch (err) {
    console.warn(`Europe PMC search failed for "${query}":`, err);
    return [];
  }
}

/**
 * Pre-curated Detergent Raw Material Chemistry & Enzymes Master Catalog
 * Enables instant 1-click loading with authoritative CIDs, UniProt IDs, and SMILES strings.
 */
export interface CuratedChemicalTarget {
  name: string;
  category: 'Surfactant' | 'Enzyme' | 'Builder & Chelator' | 'Solvent & Hydrotrope' | 'Preservative & Bleach';
  role: string;
  cid?: number;
  uniprotId?: string;
  pdbId?: string;
  smiles?: string;
  formula?: string;
  description: string;
}

export const CURATED_SCIENCE_CATALOG: CuratedChemicalTarget[] = [
  // 1. Surfactants
  {
    name: "Linear Alkylbenzene Sulfonate (LAS / C12)",
    category: "Surfactant",
    role: "Primary Anionic Detergent",
    cid: 24263,
    smiles: "CCCCCCCCCCCC1=CC=C(C=C1)S(=O)(=O)[O-].[Na+]",
    formula: "C18H29NaO3S",
    description: "The world's standard high-foaming anionic surfactant for laundry detergency and particulate soil suspension."
  },
  {
    name: "Sodium Lauryl Sulfate (SLS / SDS)",
    category: "Surfactant",
    role: "Anionic Foaming Agent",
    cid: 3423265,
    smiles: "CCCCCCCCCCCCOS(=O)(=O)[O-].[Na+]",
    formula: "C12H25NaO4S",
    description: "C12 primary alkyl sulfate with rapid micellization and benchmark wetting and cleaning power."
  },
  {
    name: "Sodium Laureth Sulfate (SLES 2EO)",
    category: "Surfactant",
    role: "Ethoxylated Anionic Surfactant",
    cid: 23665884,
    smiles: "CCCCCCCCCCCCOCCOCCOS(=O)(=O)[O-].[Na+]",
    formula: "C16H33NaO6S",
    description: "Ethoxylated ether sulfate providing skin mildness, hardness tolerance, and dense flash foaming."
  },
  {
    name: "Cocamidopropyl Betaine (CAPB)",
    category: "Surfactant",
    role: "Zwitterionic / Amphoteric Booster",
    cid: 20280,
    smiles: "CCCCCCCCCCCC(=O)NCCC[N+](C)(C)CC(=O)[O-]",
    formula: "C19H38N2O3",
    description: "Amphoteric secondary surfactant that boosts micellar viscosity with NaCl and suppresses anionic skin irritation."
  },
  {
    name: "Lauryl Glucoside (Alkyl Polyglucoside APG)",
    category: "Surfactant",
    role: "Green Non-ionic Surfactant",
    cid: 86326,
    smiles: "CCCCCCCCCCCCOC1C(C(C(C(O1)CO)O)O)O",
    formula: "C18H36O6",
    description: "100% bio-based nonionic surfactant derived from glucose and coconut fatty alcohol; highly biodegradable."
  },
  {
    name: "Cetyltrimethylammonium Chloride (CTAC)",
    category: "Surfactant",
    role: "Cationic Fabric Softener",
    cid: 8154,
    smiles: "CCCCCCCCCCCCCCCC[N+](C)(C)C.[Cl-]",
    formula: "C19H42ClN",
    description: "Cationic quaternary ammonium surfactant imparting antistatic, softening, and antimicrobial properties."
  },

  // 2. Detergent Enzymes
  {
    name: "Subtilisin (Savinase / Protease)",
    category: "Enzyme",
    role: "Alkaline Serine Protease",
    uniprotId: "P00780",
    pdbId: "1CSE",
    description: "Benchmark detergent protease from Bacillus lentus that hydrolyzes protein stains (blood, grass, egg) at alkaline pH (8.5 - 10.5)."
  },
  {
    name: "Alkaline Alpha-Amylase",
    category: "Enzyme",
    role: "Starch Hydrolysis Catalyzer",
    uniprotId: "P00692",
    pdbId: "1PPI",
    description: "Degrades stubborn gelatinized starch stains (gravies, chocolate, pasta sauces) into water-soluble oligosaccharides."
  },
  {
    name: "Thermostable Lipase",
    category: "Enzyme",
    role: "Lipolytic Fat & Oil Cleaver",
    uniprotId: "P19515",
    pdbId: "1TIB",
    description: "Hydrolyzes hydrophobic triglycerides, sebum, cooking fats, and cosmetic residues during low-temperature washing."
  },

  // 3. Builders & Chelators
  {
    name: "Tetrasodium GLDA (Green Chelator)",
    category: "Builder & Chelator",
    role: "Readily Biodegradable Chelate",
    cid: 90479188,
    smiles: "C(CC(=O)[O-])C(C(=O)[O-])N(CC(=O)[O-])CC(=O)[O-].[Na+].[Na+].[Na+].[Na+]",
    formula: "C9H9NNa4O8",
    description: "L-Glutamic acid N,N-diacetic acid tetrasodium salt; green eco-friendly replacement for EDTA with high Ca²⁺/Mg²⁺ binding."
  },
  {
    name: "Citric Acid / Sodium Citrate",
    category: "Builder & Chelator",
    role: "Organic Builder & Buffer",
    cid: 311,
    smiles: "C(C(=O)O)C(CC(=O)O)(C(=O)O)O",
    formula: "C6H8O7",
    description: "Tri-carboxylic acid builder providing multi-valent metal chelation and pH buffering."
  },
  {
    name: "Tetrasodium EDTA",
    category: "Builder & Chelator",
    role: "High-Stability Sequestrant",
    cid: 8759,
    smiles: "C(CN(CC(=O)[O-])CC(=O)[O-])N(CC(=O)[O-])CC(=O)[O-].[Na+].[Na+].[Na+].[Na+]",
    formula: "C10H12N2Na4O8",
    description: "Ethylenediaminetetraacetate tetrasodium; strong log K stability constant chelant for heavy metal deactivation."
  },

  // 4. Solvents & Hydrotropes
  {
    name: "Sodium Xylene Sulfonate (SXS)",
    category: "Solvent & Hydrotrope",
    role: "Hydrotrope & Cloud Point Booster",
    cid: 24844,
    smiles: "CC1=CC(=C(C=C1)C)S(=O)(=O)[O-].[Na+]",
    formula: "C8H9NaO3S",
    description: "Aromatic hydrotrope that boosts solubility of organic surfactants, raises cloud point, and prevents phase separation."
  },
  {
    name: "Propylene Glycol (1,2-Propanediol)",
    category: "Solvent & Hydrotrope",
    role: "Enzyme Stabilizer & Solvent",
    cid: 1030,
    smiles: "CC(CO)O",
    formula: "C3H8O2",
    description: "Viscosity modifier, freeze-thaw stabilizer, and critical polyol for protecting enzyme tertiary conformation against autolysis."
  }
];

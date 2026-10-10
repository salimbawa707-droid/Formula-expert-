/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - CHEMICAL SPECIES REGISTRY
 * ============================================================================
 * Centralized, authoritative registry of chemical species, multi-protic pKa values,
 * stoichiometric valencies, counter-ions, molecular weights, and acid/base families.
 * ============================================================================
 */

import { SpeciesDefinition } from './types';

export const CHEMICAL_SPECIES_REGISTRY: Record<string, SpeciesDefinition> = {
  // --------------------------------------------------------------------------
  // STRONG MINERAL ACIDS
  // --------------------------------------------------------------------------
  hydrochloric_acid: {
    speciesId: 'hydrochloric_acid',
    displayName: 'Hydrochloric Acid',
    formula: 'HCl',
    mw: 36.46,
    family: 'STRONG_ACID',
    pKa: [-6.3],
    eqPerMole: 1,
    pHEffect: 'acid',
    anionsPerMole: 1,
    anionValency: 1,
    description: 'Strong monoprotic mineral acid',
    source: 'CRC Handbook of Chemistry & Physics'
  },
  sulfuric_acid: {
    speciesId: 'sulfuric_acid',
    displayName: 'Sulfuric Acid',
    formula: 'H2SO4',
    mw: 98.08,
    family: 'STRONG_ACID',
    pKa: [-3.0, 1.99],
    eqPerMole: 2,
    pHEffect: 'acid',
    anionsPerMole: 1,
    anionValency: 2,
    description: 'Strong diprotic mineral acid',
    source: 'Lange’s Handbook of Chemistry'
  },
  nitric_acid: {
    speciesId: 'nitric_acid',
    displayName: 'Nitric Acid',
    formula: 'HNO3',
    mw: 63.01,
    family: 'STRONG_ACID',
    pKa: [-1.4],
    eqPerMole: 1,
    pHEffect: 'acid',
    anionsPerMole: 1,
    anionValency: 1,
    description: 'Strong monoprotic oxidizing mineral acid',
    source: 'CRC Handbook'
  },
  sulfamic_acid: {
    speciesId: 'sulfamic_acid',
    displayName: 'Sulfamic Acid',
    formula: 'H3NSO3',
    mw: 97.09,
    family: 'STRONG_ACID',
    pKa: [1.0],
    eqPerMole: 1,
    pHEffect: 'acid',
    anionsPerMole: 1,
    anionValency: 1,
    description: 'Solid moderately strong descaling acid',
    source: 'Merck Index'
  },
  sodium_bisulfate: {
    speciesId: 'sodium_bisulfate',
    displayName: 'Sodium Bisulfate',
    formula: 'NaHSO4',
    mw: 120.06,
    family: 'STRONG_ACID',
    pKa: [1.99],
    eqPerMole: 1,
    cationsPerMole: 1,
    cationValency: 1,
    anionsPerMole: 1,
    anionValency: 2,
    pHEffect: 'acid',
    description: 'Dry acid salt supplying HSO4- (pKa = 1.99)',
    source: 'NIST Standard Reference Database'
  },
  methanesulfonic_acid: {
    speciesId: 'methanesulfonic_acid',
    displayName: 'Methanesulfonic Acid (MSA)',
    formula: 'CH4O3S',
    mw: 96.11,
    family: 'STRONG_ACID',
    pKa: [-1.9],
    eqPerMole: 1,
    pHEffect: 'acid',
    anionsPerMole: 1,
    anionValency: 1,
    description: 'Biodegradable strong organic sulfonic acid',
    source: 'IUPAC Stability Constants'
  },

  // --------------------------------------------------------------------------
  // SULFONIC ACID SURFACTANTS (LABSA)
  // --------------------------------------------------------------------------
  labsa: {
    speciesId: 'labsa',
    displayName: 'Linear Alkylbenzene Sulfonic Acid (LABSA)',
    formula: 'C18H30O3S',
    mw: 326.49,
    family: 'STRONG_ACID', // Sulfonic acids (R-SO3H) behave as strong monoprotic acids in aqueous medium
    pKa: [-2.0],
    eqPerMole: 1,
    anionsPerMole: 1,
    anionValency: 1,
    pHEffect: 'acid',
    description: 'Primary anionic surfactant sulfonic acid precursor (MW avg ~326.5 g/mol)',
    source: 'Surfactants and Interfacial Phenomena (Rosen)'
  },

  // --------------------------------------------------------------------------
  // STRONG BASES
  // --------------------------------------------------------------------------
  naoh: {
    speciesId: 'naoh',
    displayName: 'Sodium Hydroxide (Caustic Soda)',
    formula: 'NaOH',
    mw: 40.00,
    family: 'STRONG_BASE',
    eqPerMole: 1,
    cationsPerMole: 1,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Strong alkali neutralizing agent providing Na+ and OH-',
    source: 'CRC Handbook'
  },
  koh: {
    speciesId: 'koh',
    displayName: 'Potassium Hydroxide (Caustic Potash)',
    formula: 'KOH',
    mw: 56.11,
    family: 'STRONG_BASE',
    eqPerMole: 1,
    cationsPerMole: 1,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Strong alkali potassium neutralizer providing K+ and OH-',
    source: 'CRC Handbook'
  },

  // --------------------------------------------------------------------------
  // CARBONATE / BICARBONATE SYSTEM
  // --------------------------------------------------------------------------
  soda_ash: {
    speciesId: 'soda_ash',
    displayName: 'Sodium Carbonate (Soda Ash)',
    formula: 'Na2CO3',
    mw: 105.99,
    family: 'CARBONATE',
    pKa: [6.35, 10.33],
    eqPerMole: 2,
    cationsPerMole: 2,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Diprotic alkaline builder delivering 2 Na+ and CO3(2-)',
    source: 'Stumm & Morgan, Aquatic Chemistry'
  },
  sodium_bicarbonate: {
    speciesId: 'sodium_bicarbonate',
    displayName: 'Sodium Bicarbonate (Baking Soda)',
    formula: 'NaHCO3',
    mw: 84.01,
    family: 'CARBONATE',
    pKa: [6.35, 10.33],
    eqPerMole: 1,
    cationsPerMole: 1,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Amphiprotic bicarbonate buffer salt delivering 1 Na+ and HCO3-',
    source: 'Stumm & Morgan, Aquatic Chemistry'
  },

  // --------------------------------------------------------------------------
  // CITRATE SYSTEM (Triprotic)
  // --------------------------------------------------------------------------
  citric_acid: {
    speciesId: 'citric_acid',
    displayName: 'Citric Acid (Anhydrous)',
    formula: 'C6H8O7',
    mw: 192.12,
    family: 'CITRATE',
    pKa: [3.13, 4.76, 6.40],
    eqPerMole: 3,
    pHEffect: 'acid',
    description: 'Organic triprotic acid descaler and buffer (pKa1=3.13, pKa2=4.76, pKa3=6.40)',
    source: 'Goldberg et al., NIST Critically Evaluated pKa'
  },
  citric_acid_monohydrate: {
    speciesId: 'citric_acid_monohydrate',
    displayName: 'Citric Acid Monohydrate',
    formula: 'C6H8O7·H2O',
    mw: 210.14,
    family: 'CITRATE',
    pKa: [3.13, 4.76, 6.40],
    eqPerMole: 3,
    pHEffect: 'acid',
    description: 'Triprotic citric acid crystal containing 1 mole crystal water per mole',
    source: 'Merck Index'
  },
  sodium_citrate: {
    speciesId: 'sodium_citrate',
    displayName: 'Trisodium Citrate (Dihydrate / Anhydrous basis)',
    formula: 'Na3C6H5O7',
    mw: 258.07,
    family: 'CITRATE',
    pKa: [3.13, 4.76, 6.40],
    eqPerMole: 0,
    cationsPerMole: 3,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Trisodium citrate buffer salt providing 3 Na+ and fully deprotonated Cit3-',
    source: 'IUPAC Stability Constants'
  },
  disodium_citrate: {
    speciesId: 'disodium_citrate',
    displayName: 'Disodium Hydrogen Citrate',
    formula: 'Na2HC6H5O7',
    mw: 236.09,
    family: 'CITRATE',
    pKa: [3.13, 4.76, 6.40],
    eqPerMole: 1,
    cationsPerMole: 2,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Disodium hydrogen citrate buffer salt delivering 2 Na+ and HCit(2-)',
    source: 'IUPAC Stability Constants'
  },

  // --------------------------------------------------------------------------
  // PHOSPHATE SYSTEM (Triprotic / Polyphosphate)
  // --------------------------------------------------------------------------
  phosphoric_acid: {
    speciesId: 'phosphoric_acid',
    displayName: 'Phosphoric Acid',
    formula: 'H3PO4',
    mw: 97.994,
    family: 'PHOSPHATE',
    pKa: [2.15, 7.20, 12.35],
    eqPerMole: 3,
    pHEffect: 'acid',
    description: 'Triprotic mineral acid builder (pKa1=2.15, pKa2=7.20, pKa3=12.35)',
    source: 'NIST Critically Selected Constants'
  },
  tsp_anhydrous: {
    speciesId: 'tsp_anhydrous',
    displayName: 'Trisodium Phosphate (TSP Anhydrous)',
    formula: 'Na3PO4',
    mw: 163.94,
    family: 'PHOSPHATE',
    pKa: [2.15, 7.20, 12.35],
    eqPerMole: 0,
    cationsPerMole: 3,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Highly alkaline phosphate builder supplying 3 Na+ and PO4(3-)',
    source: 'CRC Handbook'
  },
  tsp_dodecahydrate: {
    speciesId: 'tsp_dodecahydrate',
    displayName: 'Trisodium Phosphate Dodecahydrate',
    formula: 'Na3PO4·12H2O',
    mw: 380.12,
    family: 'PHOSPHATE',
    pKa: [2.15, 7.20, 12.35],
    eqPerMole: 0,
    cationsPerMole: 3,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Hydrated trisodium phosphate crystal (12 moles water per mole)',
    source: 'CRC Handbook'
  },
  monosodium_phosphate: {
    speciesId: 'monosodium_phosphate',
    displayName: 'Sodium Dihydrogen Phosphate (MSP)',
    formula: 'NaH2PO4',
    mw: 119.98,
    family: 'PHOSPHATE',
    pKa: [2.15, 7.20, 12.35],
    eqPerMole: 2,
    cationsPerMole: 1,
    cationValency: 1,
    pHEffect: 'acid',
    description: 'Monosodium phosphate acid salt supplying 1 Na+ and H2PO4-',
    source: 'CRC Handbook'
  },
  disodium_phosphate: {
    speciesId: 'disodium_phosphate',
    displayName: 'Disodium Hydrogen Phosphate (DSP)',
    formula: 'Na2HPO4',
    mw: 141.96,
    family: 'PHOSPHATE',
    pKa: [2.15, 7.20, 12.35],
    eqPerMole: 1,
    cationsPerMole: 2,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Disodium phosphate buffer salt supplying 2 Na+ and HPO4(2-)',
    source: 'CRC Handbook'
  },
  stpp: {
    speciesId: 'stpp',
    displayName: 'Sodium Tripolyphosphate (STPP)',
    formula: 'Na5P3O10',
    mw: 367.86,
    family: 'PHOSPHATE',
    pKa: [1.0, 2.0, 2.79, 6.47, 8.98],
    eqPerMole: 0,
    cationsPerMole: 5,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Alkaline polyphosphate builder and water softener delivering 5 Na+ and P3O10(5-)',
    source: 'Martell & Smith, Critical Stability Constants'
  },

  // --------------------------------------------------------------------------
  // SILICATE SYSTEM
  // --------------------------------------------------------------------------
  sodium_metasilicate_anhydrous: {
    speciesId: 'sodium_metasilicate_anhydrous',
    displayName: 'Sodium Metasilicate Anhydrous',
    formula: 'Na2SiO3',
    mw: 122.06,
    family: 'SILICATE',
    pKa: [9.84, 12.00],
    eqPerMole: 2,
    cationsPerMole: 2,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Anhydrous heavy-duty alkaline silicate builder providing 2 Na+ and SiO3(2-)',
    source: 'Iler, Chemistry of Silica'
  },
  sodium_metasilicate_pentahydrate: {
    speciesId: 'sodium_metasilicate_pentahydrate',
    displayName: 'Sodium Metasilicate Pentahydrate',
    formula: 'Na2SiO3·5H2O',
    mw: 212.14,
    family: 'SILICATE',
    pKa: [9.84, 12.00],
    eqPerMole: 2,
    cationsPerMole: 2,
    cationValency: 1,
    pHEffect: 'base',
    description: 'Pentahydrate heavy-duty alkaline silicate builder (5 moles H2O / mole)',
    source: 'Iler, Chemistry of Silica'
  },

  // --------------------------------------------------------------------------
  // ORGANIC WEAK CARBOXYLIC ACIDS & SALTS
  // --------------------------------------------------------------------------
  acetic_acid: {
    speciesId: 'acetic_acid',
    displayName: 'Acetic Acid (Glacial)',
    formula: 'CH3COOH',
    mw: 60.05,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [4.76],
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Monoprotic organic carboxylic acid (pKa = 4.76)',
    source: 'CRC Handbook'
  },
  sodium_acetate: {
    speciesId: 'sodium_acetate',
    displayName: 'Sodium Acetate',
    formula: 'CH3COONa',
    mw: 82.03,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [4.76],
    eqPerMole: 0,
    cationsPerMole: 1,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Conjugate base acetate buffer salt providing 1 Na+ and CH3COO-',
    source: 'CRC Handbook'
  },
  lactic_acid: {
    speciesId: 'lactic_acid',
    displayName: 'Lactic Acid',
    formula: 'C3H6O3',
    mw: 90.08,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [3.86],
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Alpha-hydroxy carboxylic acid (pKa = 3.86)',
    source: 'CRC Handbook'
  },
  oxalic_acid: {
    speciesId: 'oxalic_acid',
    displayName: 'Oxalic Acid',
    formula: 'C2H2O4',
    mw: 90.03,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [1.25, 4.27],
    eqPerMole: 2,
    pHEffect: 'acid',
    description: 'Diprotic rust/scale removal organic acid',
    source: 'CRC Handbook'
  },
  tartaric_acid: {
    speciesId: 'tartaric_acid',
    displayName: 'Tartaric Acid',
    formula: 'C4H6O6',
    mw: 150.09,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [2.98, 4.37],
    eqPerMole: 2,
    pHEffect: 'acid',
    description: 'Diprotic organic hydroxy-carboxylic acid',
    source: 'CRC Handbook'
  },
  gluconic_acid: {
    speciesId: 'gluconic_acid',
    displayName: 'Gluconic Acid',
    formula: 'C6H12O7',
    mw: 196.16,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [3.70],
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Monoprotic polyhydroxy carboxylic acid',
    source: 'CRC Handbook'
  },
  sodium_gluconate: {
    speciesId: 'sodium_gluconate',
    displayName: 'Sodium Gluconate',
    formula: 'C6H11NaO7',
    mw: 218.14,
    family: 'CARBOXYLIC_WEAK_ACID',
    pKa: [3.70],
    eqPerMole: 0,
    cationsPerMole: 1,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Sodium gluconate chelating builder supplying 1 Na+ and gluconate anion',
    source: 'Merck Index'
  },
  carbomer: {
    speciesId: 'carbomer',
    displayName: 'Carbomer / Polyacrylic Acid (Acrylic monomer unit basis)',
    formula: '(C3H4O2)n',
    mw: 72.06,
    family: 'POLYACRYLATE',
    pKa: [4.50],
    eqPerMole: 1,
    pHEffect: 'acid',
    description: 'Crosslinked polyacrylic acid rheology modifier (effective pKa ~4.5 per monomer unit)',
    source: 'Lubrizol Technical Bulletin'
  },

  // --------------------------------------------------------------------------
  // AMINOCARBOXYLATE CHELATORS (Polyprotic)
  // --------------------------------------------------------------------------
  edta_acid: {
    speciesId: 'edta_acid',
    displayName: 'EDTA (Free Acid)',
    formula: 'C10H16N2O8',
    mw: 292.24,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [2.00, 2.67, 6.16, 10.26],
    eqPerMole: 4,
    pHEffect: 'acid',
    description: 'Tetraprotic chelating free acid',
    source: 'Martell & Smith'
  },
  edta_na4: {
    speciesId: 'edta_na4',
    displayName: 'EDTA Na4 (Tetrasodium EDTA)',
    formula: 'C10H12N2Na4O8',
    mw: 380.17,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [2.00, 2.67, 6.16, 10.26],
    eqPerMole: 0,
    cationsPerMole: 4,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Tetrasodium EDTA alkaline chelating salt supplying 4 Na+ and EDTA(4-)',
    source: 'Martell & Smith'
  },
  edta_na2: {
    speciesId: 'edta_na2',
    displayName: 'EDTA Na2 (Disodium EDTA)',
    formula: 'C10H14N2Na2O8',
    mw: 336.21,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [2.00, 2.67, 6.16, 10.26],
    eqPerMole: 2,
    cationsPerMole: 2,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Disodium EDTA buffer/chelator salt supplying 2 Na+ and H2EDTA(2-)',
    source: 'Martell & Smith'
  },
  dtpa_acid: {
    speciesId: 'dtpa_acid',
    displayName: 'DTPA (Free Acid)',
    formula: 'C14H23N3O10',
    mw: 393.35,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [1.79, 2.55, 4.33, 8.60, 10.42],
    eqPerMole: 5,
    pHEffect: 'acid',
    description: 'Pentaprotic aminocarboxylate chelating free acid',
    source: 'Martell & Smith'
  },
  dtpa_na5: {
    speciesId: 'dtpa_na5',
    displayName: 'DTPA Na5 (Pentasodium DTPA)',
    formula: 'C14H18N3Na5O10',
    mw: 503.25,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [1.79, 2.55, 4.33, 8.60, 10.42],
    eqPerMole: 0,
    cationsPerMole: 5,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Pentasodium DTPA chelating salt delivering 5 Na+ and DTPA(5-)',
    source: 'Martell & Smith'
  },
  glda_na4: {
    speciesId: 'glda_na4',
    displayName: 'GLDA Na4 (Tetrasodium GLDA / Dissolvine GL)',
    formula: 'C9H9NNa4O8',
    mw: 351.13,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [1.80, 2.70, 4.90, 9.40],
    eqPerMole: 0,
    cationsPerMole: 4,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Biodegradable tetrasodium glutamate diacetate supplying 4 Na+ and GLDA(4-)',
    source: 'Nouryon Technical Bulletin'
  },
  mgda_na3: {
    speciesId: 'mgda_na3',
    displayName: 'MGDA Na3 (Trisodium MGDA / Trilon M)',
    formula: 'C7H8NNa3O6',
    mw: 271.11,
    family: 'CHELATOR_AMINOCARBOXYLATE',
    pKa: [1.60, 2.50, 9.70],
    eqPerMole: 0,
    cationsPerMole: 3,
    cationValency: 1,
    pHEffect: 'buffer',
    description: 'Trisodium methylglycinediacetate supplying 3 Na+ and MGDA(3-)',
    source: 'BASF Trilon M Technical Documentation'
  },

  // --------------------------------------------------------------------------
  // PHOSPHONATE BUILDERS / CHELATORS
  // --------------------------------------------------------------------------
  hedp: {
    speciesId: 'hedp',
    displayName: 'HEDP (Etidronic Acid)',
    formula: 'C2H8O7P2',
    mw: 206.03,
    family: 'PHOSPHONATE',
    pKa: [1.70, 2.47, 7.28, 10.29, 11.13],
    eqPerMole: 4,
    pHEffect: 'acid',
    description: 'Organophosphonate scale inhibitor and peroxide stabilizer',
    source: 'Martell & Smith'
  },
  atmp: {
    speciesId: 'atmp',
    displayName: 'ATMP (Amino Tris(Methylene Phosphonic Acid))',
    formula: 'C3H12NO9P3',
    mw: 299.05,
    family: 'PHOSPHONATE',
    pKa: [1.50, 4.30, 5.50, 6.70, 7.50, 12.10],
    eqPerMole: 5,
    pHEffect: 'acid',
    description: 'Amino-phosphonic acid multivalent scale inhibitor',
    source: 'Martell & Smith'
  },

  // --------------------------------------------------------------------------
  // AMINE BASES (Alkanolamines & Ammonia)
  // --------------------------------------------------------------------------
  tea: {
    speciesId: 'tea',
    displayName: 'Triethanolamine (TEA 99%)',
    formula: 'C6H15NO3',
    mw: 149.19,
    family: 'AMINE_BASE',
    pKb: [5.80],
    pKaConjugate: 8.20,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Organic tertiary alkanolamine weak base (pKa(BH+) = 8.20 in aqueous solution)',
    source: 'CRC Handbook'
  },
  mea: {
    speciesId: 'mea',
    displayName: 'Monoethanolamine (MEA 99%)',
    formula: 'C2H7NO',
    mw: 61.08,
    family: 'AMINE_BASE',
    pKb: [4.50],
    pKaConjugate: 9.50,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Organic primary alkanolamine base neutralizer (pKa(BH+) = 9.50 at 25°C)',
    source: 'CRC Handbook'
  },
  ammonia: {
    speciesId: 'ammonia',
    displayName: 'Ammonia (Aqueous NH3/NH4OH)',
    formula: 'NH3',
    mw: 17.03,
    family: 'AMINE_BASE',
    pKb: [4.75],
    pKaConjugate: 9.25,
    eqPerMole: 1,
    pHEffect: 'base',
    description: 'Volatile alkaline base neutralizer (pKa(NH4+) = 9.25 at 25°C)',
    source: 'CRC Handbook'
  },

  // --------------------------------------------------------------------------
  // NEUTRAL SALTS & INERT INGREDIENTS
  // --------------------------------------------------------------------------
  sodium_chloride: {
    speciesId: 'sodium_chloride',
    displayName: 'Sodium Chloride (Salt)',
    formula: 'NaCl',
    mw: 58.44,
    family: 'NEUTRAL_SALT',
    eqPerMole: 0,
    cationsPerMole: 1,
    cationValency: 1,
    anionsPerMole: 1,
    anionValency: 1,
    pHEffect: 'neutral',
    description: 'Neutral electrolyte salt providing Na+ and Cl-',
    source: 'Standard Chemical Reference'
  },
  sodium_sulfate: {
    speciesId: 'sodium_sulfate',
    displayName: 'Sodium Sulfate (Anhydrous)',
    formula: 'Na2SO4',
    mw: 142.04,
    family: 'NEUTRAL_SALT',
    eqPerMole: 0,
    cationsPerMole: 2,
    cationValency: 1,
    anionsPerMole: 1,
    anionValency: 2,
    pHEffect: 'neutral',
    description: 'Neutral inorganic salt filler supplying 2 Na+ and SO4(2-)',
    source: 'Standard Chemical Reference'
  },
  water: {
    speciesId: 'water',
    displayName: 'Water (Deionized / Demineralized)',
    formula: 'H2O',
    mw: 18.015,
    family: 'INERT_OR_SURFACTANT',
    pHEffect: 'neutral',
    description: 'Aqueous formulation solvent',
    isSolventWater: true
  }
};

/**
 * Normalizes input ingredient names to match canonical chemical species.
 */
export function classifyChemicalSpecies(rawName: string): SpeciesDefinition | null {
  if (!rawName || typeof rawName !== 'string') return null;
  const name = rawName.trim().toLowerCase();

  // 1. Water
  if (name === 'water' || name.includes('aqua') || name.includes('deionized water') || name.includes('dm water') || name.includes('ro water')) {
    return CHEMICAL_SPECIES_REGISTRY.water;
  }

  // 2. LABSA
  if (
    name.includes('labsa') ||
    name.includes('linear alkylbenzene sulfonic') ||
    name.includes('alkyl benzene sulfonic') ||
    name.includes('acid slurry') ||
    name.includes('dodecylbenzene sulfonic acid') ||
    name.includes('las acid')
  ) {
    return CHEMICAL_SPECIES_REGISTRY.labsa;
  }

  // 3. Sulfuric Acid
  if (name.includes('sulfuric acid') || name.includes('sulphuric acid') || /\bh2so4\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.sulfuric_acid;
  }

  // 4. Hydrochloric Acid
  if (name.includes('hydrochloric acid') || name.includes('muriatic acid') || /\bhcl\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.hydrochloric_acid;
  }

  // 5. Nitric Acid
  if (name.includes('nitric acid') || /\bhno3\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.nitric_acid;
  }

  // 6. Sulfamic Acid
  if (name.includes('sulfamic') || name.includes('sulphamic')) {
    return CHEMICAL_SPECIES_REGISTRY.sulfamic_acid;
  }

  // 7. Sodium Bisulfate
  if (name.includes('bisulfate') || name.includes('bisulphate') || name.includes('sodium hydrogen sulfate')) {
    return CHEMICAL_SPECIES_REGISTRY.sodium_bisulfate;
  }

  // 8. Methanesulfonic Acid
  if (name.includes('methanesulfonic') || name.includes('methanesulphonic') || /\bmsa\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.methanesulfonic_acid;
  }

  // 9. Citric Acid (Free acid vs salts)
  if (name.includes('citric acid') || name.includes('citric')) {
    if (name.includes('sodium') || name.includes('trisodium') || name.includes('disodium') || name.includes('potassium')) {
      if (name.includes('disodium')) {
        return CHEMICAL_SPECIES_REGISTRY.disodium_citrate;
      }
      return CHEMICAL_SPECIES_REGISTRY.sodium_citrate;
    }
    if (name.includes('monohydrate')) {
      return CHEMICAL_SPECIES_REGISTRY.citric_acid_monohydrate;
    }
    return CHEMICAL_SPECIES_REGISTRY.citric_acid;
  }

  // 10. Sodium Citrate
  if (name.includes('citrate')) {
    if (name.includes('disodium')) {
      return CHEMICAL_SPECIES_REGISTRY.disodium_citrate;
    }
    return CHEMICAL_SPECIES_REGISTRY.sodium_citrate;
  }

  // 11. Phosphoric Acid
  if (name.includes('phosphoric acid') || name.includes('orthophosphoric') || /\bh3po4\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.phosphoric_acid;
  }

  // 12. Phosphates (TSP, STPP, MSP, DSP)
  if (name.includes('trisodium phosphate') || /\btsp\b/.test(name)) {
    if (name.includes('dodecahydrate') || name.includes('12h2o') || name.includes('crystal')) {
      return CHEMICAL_SPECIES_REGISTRY.tsp_dodecahydrate;
    }
    return CHEMICAL_SPECIES_REGISTRY.tsp_anhydrous;
  }
  if (name.includes('tripolyphosphate') || name.includes('stpp')) {
    return CHEMICAL_SPECIES_REGISTRY.stpp;
  }
  if (name.includes('monosodium phosphate') || /\bmsp\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.monosodium_phosphate;
  }
  if (name.includes('disodium phosphate') || /\bdsp\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.disodium_phosphate;
  }

  // 13. Acetic Acid / Acetates
  if (name.includes('acetic acid') || name.includes('ethanoic acid') || name.includes('vinegar')) {
    return CHEMICAL_SPECIES_REGISTRY.acetic_acid;
  }
  if (name.includes('acetate')) {
    return CHEMICAL_SPECIES_REGISTRY.sodium_acetate;
  }

  // 14. Lactic Acid
  if (name.includes('lactic acid') || name.includes('2-hydroxypropanoic')) {
    return CHEMICAL_SPECIES_REGISTRY.lactic_acid;
  }

  // 15. Oxalic Acid
  if (name.includes('oxalic acid') || name.includes('ethanedioic')) {
    return CHEMICAL_SPECIES_REGISTRY.oxalic_acid;
  }

  // 16. Tartaric Acid
  if (name.includes('tartaric acid')) {
    return CHEMICAL_SPECIES_REGISTRY.tartaric_acid;
  }

  // 17. Gluconic Acid / Sodium Gluconate
  if (name.includes('gluconic acid')) {
    return CHEMICAL_SPECIES_REGISTRY.gluconic_acid;
  }
  if (name.includes('gluconate')) {
    return CHEMICAL_SPECIES_REGISTRY.sodium_gluconate;
  }

  // 18. Carbomer / Polyacrylic Acid
  if (name.includes('carbomer') || name.includes('polyacrylic') || name.includes('carbopol') || name.includes('acrylates copolymer')) {
    return CHEMICAL_SPECIES_REGISTRY.carbomer;
  }

  // 19. Chelators (DTPA, EDTA, GLDA, MGDA)
  if (name.includes('dtpa')) {
    if (name.includes('na5') || name.includes('pentasodium') || name.includes('sodium')) {
      return CHEMICAL_SPECIES_REGISTRY.dtpa_na5;
    }
    return CHEMICAL_SPECIES_REGISTRY.dtpa_acid;
  }
  if (name.includes('edta') || name.includes('versene')) {
    if (name.includes('na4') || name.includes('tetrasodium')) {
      return CHEMICAL_SPECIES_REGISTRY.edta_na4;
    }
    if (name.includes('na2') || name.includes('disodium')) {
      return CHEMICAL_SPECIES_REGISTRY.edta_na2;
    }
    return CHEMICAL_SPECIES_REGISTRY.edta_acid;
  }
  if (name.includes('glda') || name.includes('dissolvine gl')) {
    return CHEMICAL_SPECIES_REGISTRY.glda_na4;
  }
  if (name.includes('mgda') || name.includes('trilon m')) {
    return CHEMICAL_SPECIES_REGISTRY.mgda_na3;
  }

  // 20. Phosphonates (HEDP, ATMP)
  if (name.includes('hedp') || name.includes('etidronic')) {
    return CHEMICAL_SPECIES_REGISTRY.hedp;
  }
  if (name.includes('atmp') || name.includes('amino tris')) {
    return CHEMICAL_SPECIES_REGISTRY.atmp;
  }

  // 21. Strong Bases: NaOH
  if (name.includes('naoh') || name.includes('caustic soda') || name.includes('sodium hydroxide') || /\blye\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.naoh;
  }

  // 22. Strong Bases: KOH
  if (name.includes('koh') || name.includes('potassium hydroxide') || name.includes('caustic potash')) {
    return CHEMICAL_SPECIES_REGISTRY.koh;
  }

  // 23. Carbonates: Bicarbonate vs Soda Ash
  if (name.includes('bicarbonate') || name.includes('baking soda') || name.includes('nahco3')) {
    return CHEMICAL_SPECIES_REGISTRY.sodium_bicarbonate;
  }
  if (name.includes('soda ash') || (name.includes('sodium carbonate') && !name.includes('bicarbonate')) || name.includes('na2co3')) {
    return CHEMICAL_SPECIES_REGISTRY.soda_ash;
  }

  // 24. Silicates: Metasilicate
  if (name.includes('metasilicate') || name.includes('water glass') || (name.includes('sodium silicate') && !name.includes('aluminosilicate'))) {
    if (name.includes('pentahydrate') || name.includes('5h2o')) {
      return CHEMICAL_SPECIES_REGISTRY.sodium_metasilicate_pentahydrate;
    }
    return CHEMICAL_SPECIES_REGISTRY.sodium_metasilicate_anhydrous;
  }

  // 25. Amines: TEA / MEA / Ammonia
  if (name.includes('triethanolamine')) {
    return CHEMICAL_SPECIES_REGISTRY.tea;
  }
  if (/\btea\b/.test(name)) {
    const isBotanicalOrFragrance = /tree|green|black|white|extract|oil|fragrance|leaf|botanical|herbal|essential/.test(name);
    if (!isBotanicalOrFragrance) {
      return CHEMICAL_SPECIES_REGISTRY.tea;
    }
  }
  if (name.includes('monoethanolamine') || /\bmea\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.mea;
  }
  if (name.includes('ammonia') || name.includes('ammonium hydroxide') || /\bnh4oh\b/.test(name)) {
    return CHEMICAL_SPECIES_REGISTRY.ammonia;
  }

  // 26. Neutral Salts: NaCl, Na2SO4
  if (name.includes('sodium chloride') || name.includes('salt') && !name.includes('quaternary') && !name.includes('complex')) {
    return CHEMICAL_SPECIES_REGISTRY.sodium_chloride;
  }
  if (name.includes('sodium sulfate') || name.includes('glauber')) {
    return CHEMICAL_SPECIES_REGISTRY.sodium_sulfate;
  }

  return null;
}

/**
 * Evaluates the scientific parameter provenance for a resolved chemical species.
 * Strictly distinguishes SOURCE_BACKED literature values from UNKNOWN / SOURCE_NOT_VERIFIED constants.
 */
export function getSpeciesProvenance(
  species: SpeciesDefinition | null
): 'SOURCE_BACKED' | 'DATABASE_DERIVED' | 'USER_PROVIDED' | 'ESTIMATED' | 'UNKNOWN' | 'SOURCE_NOT_VERIFIED' {
  if (!species) return 'UNKNOWN';
  if (species.parameterProvenance) return species.parameterProvenance;
  if (species.source && species.source.trim().length > 0) return 'SOURCE_BACKED';
  return 'SOURCE_NOT_VERIFIED';
}

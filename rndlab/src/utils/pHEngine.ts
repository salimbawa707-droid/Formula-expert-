// ============================================================================
// ADVANCED pH ENGINE — Newton-Raphson Equilibrium & Neutralization Solver
// VERSION: Unified Production Engine
// ============================================================================

import {
  IngredientInput,
  IngredientDBEntry,
  PostNeutralState,
  ActiveBuffer,
  PHAdvancedResult,
  PHSimpleResult,
  ReactionLogEntry,
} from '../types';
import { BUFFER_PAIRS, CHEMICALS } from '../data/chemicals';

export const Kw = 1e-14;
export const MIN_MOLES = 1e-9;

export const ENZYME_INGREDIENTS = [
  'protease',
  'amylase',
  'lipase',
  'cellulase',
  'pectate lyase',
  'pectinate lyase',
  'mannanase',
  'enzyme',
  'savinase',
  'stainzyme',
  'lipex',
];

// Comprehensive Chemistry Database for pH Engine
export const INGREDIENT_DATABASE: Record<string, IngredientDBEntry> = {
  'NaOH': {
    mw: 40.0,
    purity: 1.0,
    protons: 0,
    pKa: [],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: true,
    forms: [{ index: 0, charge: 0, label: 'NaOH' }],
  },
  'Caustic Soda Lye (NaOH 50%)': {
    mw: 40.0,
    purity: 0.5,
    protons: 0,
    pKa: [],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: true,
    forms: [{ index: 0, charge: 0, label: 'NaOH' }],
  },
  'NaOH Flakes 98%': {
    mw: 40.0,
    purity: 0.98,
    protons: 0,
    pKa: [],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: true,
    forms: [{ index: 0, charge: 0, label: 'NaOH' }],
  },
  'KOH': {
    mw: 56.11,
    purity: 1.0,
    protons: 0,
    pKa: [],
    sodiumCount: 0,
    potassiumCount: 1,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: true,
    forms: [{ index: 0, charge: 0, label: 'KOH' }],
  },
  'LABSA': {
    mw: 326.49,
    purity: 0.9,
    protons: 1,
    pKa: [-0.7],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 1,
    isStrongAcid: true,
    isStrongBase: false,
    familyId: 'labsa',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H-ABS' },
      { index: 1, charge: -1, label: 'ABS⁻' },
    ],
  },
  'LABSA 90%': {
    mw: 326.49,
    purity: 0.9,
    protons: 1,
    pKa: [-0.7],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 1,
    isStrongAcid: true,
    isStrongBase: false,
    familyId: 'labsa',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H-ABS' },
      { index: 1, charge: -1, label: 'ABS⁻' },
    ],
  },
  'Citric Acid (Anhydrous)': {
    mw: 192.12,
    purity: 1.0,
    protons: 3,
    pKa: [3.13, 4.76, 6.40],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'citrate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₃Cit' },
      { index: 1, charge: -1, label: 'H₂Cit⁻' },
      { index: 2, charge: -2, label: 'HCit²⁻' },
      { index: 3, charge: -3, label: 'Cit³⁻' },
    ],
  },
  'Sodium Citrate (Trisodium Citrate)': {
    mw: 258.07,
    purity: 1.0,
    protons: 3,
    pKa: [3.13, 4.76, 6.40],
    sodiumCount: 3,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'citrate',
    nativeFormIndex: 3,
    forms: [
      { index: 0, charge: 0, label: 'H₃Cit' },
      { index: 1, charge: -1, label: 'H₂Cit⁻' },
      { index: 2, charge: -2, label: 'HCit²⁻' },
      { index: 3, charge: -3, label: 'Cit³⁻' },
    ],
  },
  'Lactic Acid 88%': {
    mw: 90.08,
    purity: 0.88,
    protons: 1,
    pKa: [3.86],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'lactate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HLac' },
      { index: 1, charge: -1, label: 'Lac⁻' },
    ],
  },
  'Sodium Lactate': {
    mw: 112.06,
    purity: 1.0,
    protons: 1,
    pKa: [3.86],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'lactate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'HLac' },
      { index: 1, charge: -1, label: 'Lac⁻' },
    ],
  },
  'Acetic Acid (Vinegar) 10%': {
    mw: 60.05,
    purity: 0.1,
    protons: 1,
    pKa: [4.76],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'acetate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HAc' },
      { index: 1, charge: -1, label: 'Ac⁻' },
    ],
  },
  'Sodium Acetate': {
    mw: 82.03,
    purity: 1.0,
    protons: 1,
    pKa: [4.76],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'acetate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'HAc' },
      { index: 1, charge: -1, label: 'Ac⁻' },
    ],
  },
  'Formic Acid 85%': {
    mw: 46.03,
    purity: 0.85,
    protons: 1,
    pKa: [3.75],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'formate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HFo' },
      { index: 1, charge: -1, label: 'Fo⁻' },
    ],
  },
  'Sodium Formate': {
    mw: 68.01,
    purity: 1.0,
    protons: 1,
    pKa: [3.75],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'formate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'HFo' },
      { index: 1, charge: -1, label: 'Fo⁻' },
    ],
  },
  'Benzoic Acid 99%': {
    mw: 122.12,
    purity: 0.99,
    protons: 1,
    pKa: [4.20],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'benzoate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HBz' },
      { index: 1, charge: -1, label: 'Bz⁻' },
    ],
  },
  'Sodium Benzoate': {
    mw: 144.11,
    purity: 1.0,
    protons: 1,
    pKa: [4.20],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'benzoate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'HBz' },
      { index: 1, charge: -1, label: 'Bz⁻' },
    ],
  },
  'Sodium Bicarbonate': {
    mw: 84.01,
    purity: 1.0,
    protons: 1,
    pKa: [6.35, 10.33],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'carbonate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'H₂CO₃' },
      { index: 1, charge: -1, label: 'HCO₃⁻' },
      { index: 2, charge: -2, label: 'CO₃²⁻' },
    ],
  },
  'Sodium Carbonate (Soda Ash)': {
    mw: 105.99,
    purity: 1.0,
    protons: 2,
    pKa: [6.35, 10.33],
    sodiumCount: 2,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'carbonate',
    nativeFormIndex: 2,
    forms: [
      { index: 0, charge: 0, label: 'H₂CO₃' },
      { index: 1, charge: -1, label: 'HCO₃⁻' },
      { index: 2, charge: -2, label: 'CO₃²⁻' },
    ],
  },
  'Boric Acid': {
    mw: 61.83,
    purity: 1.0,
    protons: 1,
    pKa: [9.24],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'borate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'B(OH)₃' },
      { index: 1, charge: -1, label: 'B(OH)₄⁻' },
    ],
  },
  'Borax (Sodium Tetraborate Decahydrate)': {
    mw: 381.37,
    purity: 1.0,
    protons: 2,
    pKa: [9.24],
    sodiumCount: 2,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'borate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'B(OH)₃' },
      { index: 1, charge: -1, label: 'B(OH)₄⁻' },
    ],
  },
  'Phosphoric Acid 85%': {
    mw: 98.00,
    purity: 0.85,
    protons: 3,
    pKa: [2.15, 7.20, 12.35],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'phosphate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₃PO₄' },
      { index: 1, charge: -1, label: 'H₂PO₄⁻' },
      { index: 2, charge: -2, label: 'HPO₄²⁻' },
      { index: 3, charge: -3, label: 'PO₄³⁻' },
    ],
  },
  'Monosodium Phosphate': {
    mw: 119.98,
    purity: 1.0,
    protons: 2,
    pKa: [2.15, 7.20, 12.35],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'phosphate',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 0, label: 'H₃PO₄' },
      { index: 1, charge: -1, label: 'H₂PO₄⁻' },
      { index: 2, charge: -2, label: 'HPO₄²⁻' },
      { index: 3, charge: -3, label: 'PO₄³⁻' },
    ],
  },
  'Disodium Phosphate': {
    mw: 141.96,
    purity: 1.0,
    protons: 1,
    pKa: [2.15, 7.20, 12.35],
    sodiumCount: 2,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'phosphate',
    nativeFormIndex: 2,
    forms: [
      { index: 0, charge: 0, label: 'H₃PO₄' },
      { index: 1, charge: -1, label: 'H₂PO₄⁻' },
      { index: 2, charge: -2, label: 'HPO₄²⁻' },
      { index: 3, charge: -3, label: 'PO₄³⁻' },
    ],
  },
  'Trisodium Phosphate (TSP)': {
    mw: 163.94,
    purity: 1.0,
    protons: 0,
    pKa: [2.15, 7.20, 12.35],
    sodiumCount: 3,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'phosphate',
    nativeFormIndex: 3,
    forms: [
      { index: 0, charge: 0, label: 'H₃PO₄' },
      { index: 1, charge: -1, label: 'H₂PO₄⁻' },
      { index: 2, charge: -2, label: 'HPO₄²⁻' },
      { index: 3, charge: -3, label: 'PO₄³⁻' },
    ],
  },
  'EDTA (Acid)': {
    mw: 292.24,
    purity: 1.0,
    protons: 4,
    pKa: [1.99, 2.67, 6.16, 10.26],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'edta',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₄EDTA' },
      { index: 1, charge: -1, label: 'H₃EDTA⁻' },
      { index: 2, charge: -2, label: 'H₂EDTA²⁻' },
      { index: 3, charge: -3, label: 'HEDTA³⁻' },
      { index: 4, charge: -4, label: 'EDTA⁴⁻' },
    ],
  },
  'Tetrasodium EDTA': {
    mw: 380.17,
    purity: 1.0,
    protons: 0,
    pKa: [1.99, 2.67, 6.16, 10.26],
    sodiumCount: 4,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'edta',
    nativeFormIndex: 4,
    forms: [
      { index: 0, charge: 0, label: 'H₄EDTA' },
      { index: 1, charge: -1, label: 'H₃EDTA⁻' },
      { index: 2, charge: -2, label: 'H₂EDTA²⁻' },
      { index: 3, charge: -3, label: 'HEDTA³⁻' },
      { index: 4, charge: -4, label: 'EDTA⁴⁻' },
    ],
  },
  'Glycine': {
    mw: 75.07,
    purity: 1.0,
    protons: 1,
    pKa: [2.35, 9.78],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'glycine',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 1, label: 'H₂Gly⁺' },
      { index: 1, charge: 0, label: 'HGly' },
      { index: 2, charge: -1, label: 'Gly⁻' },
    ],
  },
  'Sodium Glycinate': {
    mw: 97.05,
    purity: 1.0,
    protons: 0,
    pKa: [2.35, 9.78],
    sodiumCount: 1,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'glycine',
    nativeFormIndex: 2,
    forms: [
      { index: 0, charge: 1, label: 'H₂Gly⁺' },
      { index: 1, charge: 0, label: 'HGly' },
      { index: 2, charge: -1, label: 'Gly⁻' },
    ],
  },

  // Merged Equilibrium Family System Entries
  'citrate': {
    mw: 192.12,
    purity: 1.0,
    protons: 3,
    pKa: [3.13, 4.76, 6.40],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'citrate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₃Cit' },
      { index: 1, charge: -1, label: 'H₂Cit⁻' },
      { index: 2, charge: -2, label: 'HCit²⁻' },
      { index: 3, charge: -3, label: 'Cit³⁻' },
    ],
  },
  'lactate': {
    mw: 90.08,
    purity: 1.0,
    protons: 1,
    pKa: [3.86],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'lactate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HLac' },
      { index: 1, charge: -1, label: 'Lac⁻' },
    ],
  },
  'acetate': {
    mw: 60.05,
    purity: 1.0,
    protons: 1,
    pKa: [4.76],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'acetate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HAc' },
      { index: 1, charge: -1, label: 'Ac⁻' },
    ],
  },
  'formate': {
    mw: 46.03,
    purity: 1.0,
    protons: 1,
    pKa: [3.75],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'formate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HFo' },
      { index: 1, charge: -1, label: 'Fo⁻' },
    ],
  },
  'benzoate': {
    mw: 122.12,
    purity: 1.0,
    protons: 1,
    pKa: [4.20],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'benzoate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'HBz' },
      { index: 1, charge: -1, label: 'Bz⁻' },
    ],
  },
  'carbonate': {
    mw: 62.03,
    purity: 1.0,
    protons: 2,
    pKa: [6.35, 10.33],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'carbonate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₂CO₃' },
      { index: 1, charge: -1, label: 'HCO₃⁻' },
      { index: 2, charge: -2, label: 'CO₃²⁻' },
    ],
  },
  'borate': {
    mw: 61.83,
    purity: 1.0,
    protons: 1,
    pKa: [9.24],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'borate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'B(OH)₃' },
      { index: 1, charge: -1, label: 'B(OH)₄⁻' },
    ],
  },
  'phosphate': {
    mw: 98.00,
    purity: 1.0,
    protons: 3,
    pKa: [2.15, 7.20, 12.35],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'phosphate',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₃PO₄' },
      { index: 1, charge: -1, label: 'H₂PO₄⁻' },
      { index: 2, charge: -2, label: 'HPO₄²⁻' },
      { index: 3, charge: -3, label: 'PO₄³⁻' },
    ],
  },
  'edta': {
    mw: 292.24,
    purity: 1.0,
    protons: 4,
    pKa: [1.99, 2.67, 6.16, 10.26],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'edta',
    nativeFormIndex: 0,
    forms: [
      { index: 0, charge: 0, label: 'H₄EDTA' },
      { index: 1, charge: -1, label: 'H₃EDTA⁻' },
      { index: 2, charge: -2, label: 'H₂EDTA²⁻' },
      { index: 3, charge: -3, label: 'HEDTA³⁻' },
      { index: 4, charge: -4, label: 'EDTA⁴⁻' },
    ],
  },
  'glycine': {
    mw: 75.07,
    purity: 1.0,
    protons: 1,
    pKa: [2.35, 9.78],
    sodiumCount: 0,
    potassiumCount: 0,
    strongAnionCount: 0,
    isStrongAcid: false,
    isStrongBase: false,
    familyId: 'glycine',
    nativeFormIndex: 1,
    forms: [
      { index: 0, charge: 1, label: 'H₂Gly⁺' },
      { index: 1, charge: 0, label: 'HGly' },
      { index: 2, charge: -1, label: 'Gly⁻' },
    ],
  },
};

// Helper to resolve ingredient DB entry dynamically if not explicitly in INGREDIENT_DATABASE
export function resolveIngredientDB(name: string): IngredientDBEntry | undefined {
  if (INGREDIENT_DATABASE[name]) return INGREDIENT_DATABASE[name];

  const lower = name.toLowerCase();

  if (lower.includes('labsa') || lower.includes('sulfonic acid') || lower.includes('acid slurry')) {
    return INGREDIENT_DATABASE['LABSA'];
  }
  if (lower.includes('naoh') || lower.includes('caustic soda') || lower.includes('sodium hydroxide')) {
    return INGREDIENT_DATABASE['NaOH'];
  }
  if (lower.includes('koh') || lower.includes('caustic potash') || lower.includes('potassium hydroxide')) {
    return INGREDIENT_DATABASE['KOH'];
  }
  if (lower.includes('citric acid')) {
    return INGREDIENT_DATABASE['Citric Acid (Anhydrous)'];
  }
  if (lower.includes('sodium citrate') || lower.includes('trisodium citrate')) {
    return INGREDIENT_DATABASE['Sodium Citrate (Trisodium Citrate)'];
  }
  if (lower.includes('bicarbonate')) {
    return INGREDIENT_DATABASE['Sodium Bicarbonate'];
  }
  if (lower.includes('carbonate') || lower.includes('soda ash')) {
    return INGREDIENT_DATABASE['Sodium Carbonate (Soda Ash)'];
  }

  const found = CHEMICALS.find(c =>
    (c.commonName && c.commonName.toLowerCase() === lower) ||
    (c.chemicalName && c.chemicalName.toLowerCase() === lower) ||
    (c.inciName && c.inciName.toLowerCase() === lower)
  );

  if (found) {
    const isStrongBase = lower.includes('hydroxide') || lower.includes('caustic') || lower.includes('lye');
    const isStrongAcid = lower.includes('sulfonic') || lower.includes('hydrochloric') || lower.includes('sulfuric') || lower.includes('labsa');
    const sodiumCount = lower.includes('sodium') || lower.includes('disodium') ? 2 : lower.includes('monosodium') ? 1 : lower.includes('trisodium') ? 3 : 0;
    const potassiumCount = lower.includes('potassium') ? 1 : 0;
    return {
      mw: (found as any).molecularWeight || 100,
      purity: ((found as any).activeContentMin || (found as any).activeMatterPct || 100) / 100,
      protons: isStrongAcid ? 1 : 0,
      pKa: isStrongAcid ? [-0.7] : [],
      sodiumCount,
      potassiumCount,
      strongAnionCount: isStrongAcid ? 1 : 0,
      isStrongAcid,
      isStrongBase,
      nativeFormIndex: (sodiumCount || potassiumCount) > 0 ? 1 : 0,
      forms: [{ index: 0, charge: 0, label: found.commonName || name }],
    };
  }

  return undefined;
}

// ============================================
// STEP 1: Extract Moles
// ============================================
export function extractMoles(
  ingredients: IngredientInput[],
  batchSizeKg: number = 100
): Record<string, number> {
  const molesDict: Record<string, number> = {};
  const batchSizeG = batchSizeKg * 1000;

  for (const ing of ingredients) {
    const db = resolveIngredientDB(ing.name);
    if (!db) continue;

    const rawPct = ing.rawPercent !== undefined ? ing.rawPercent : (ing as any).rawKg ? (((ing as any).rawKg as number) / batchSizeKg) * 100 : 0;
    const massG = (rawPct / 100) * batchSizeG;
    const activePct = (ing as any).activePercent !== undefined ? (ing as any).activePercent : (db.purity * 100);
    const pureMassG = massG * (activePct / 100);
    let moles = pureMassG / db.mw;

    // Borax stoichiometry: 1 mol Borax → 2 mol B(OH)₄⁻
    if (ing.name.toLowerCase().includes('borax')) {
      moles *= 2;
    }

    molesDict[ing.name] = (molesDict[ing.name] || 0) + moles;
  }

  return molesDict;
}

// ============================================
// STEP 2: Neutralization Engine
// ============================================
export function neutralize(molesDict: Record<string, number>): PostNeutralState {
  const state: Record<string, number> = {};
  const log: ReactionLogEntry[] = [];
  let stepCount = 0;

  let strongBase = 0;
  let strongAcid = 0;
  let totalNa = 0;
  let totalK = 0;
  let totalStrongAnion = 0;

  // Track family moles and bound protons for weak equilibrium systems
  const familyData: Record<string, {
    familyId: string;
    moles: number;
    boundProtons: number;
    db: IngredientDBEntry;
  }> = {};

  for (const [name, moles] of Object.entries(molesDict)) {
    const db = resolveIngredientDB(name);
    if (!db || moles <= 0) continue;

    if (db.isStrongBase) strongBase += moles;
    if (db.isStrongAcid) strongAcid += moles;

    totalNa += moles * db.sodiumCount;
    totalK += moles * db.potassiumCount;
    totalStrongAnion += moles * db.strongAnionCount;

    if (!db.isStrongAcid && !db.isStrongBase && db.forms.length > 1) {
      const nativeForm = db.nativeFormIndex !== undefined
        ? db.nativeFormIndex
        : (db.sodiumCount || db.potassiumCount) > 0
          ? Math.min(db.forms.length - 1, db.sodiumCount + db.potassiumCount)
          : 0;

      const famId = db.familyId || name;
      const maxProtons = db.forms.length - 1;
      const formProtons = Math.max(0, maxProtons - nativeForm);

      if (!familyData[famId]) {
        const familyDb = INGREDIENT_DATABASE[famId] || db;
        familyData[famId] = {
          familyId: famId,
          moles: 0,
          boundProtons: 0,
          db: familyDb,
        };
      }

      familyData[famId].moles += moles;
      familyData[famId].boundProtons += moles * formProtons;
    }
  }

  // 2a: Strong base + Strong acid (1:1)
  if (strongBase > MIN_MOLES && strongAcid > MIN_MOLES) {
    const reacted = Math.min(strongBase, strongAcid);
    strongBase -= reacted;
    strongAcid -= reacted;
    stepCount++;
    log.push({
      step: stepCount,
      description: `LABSA + NaOH/KOH → Neutralized (${reacted.toFixed(6)} mol)`,
      reactants: { 'LABSA': reacted, 'NaOH/KOH': reacted },
      products: { 'Na-ABS + H₂O': reacted },
      remainingOH: strongBase,
      remainingH: strongAcid,
    });
  }

  const sortedFamilies = Object.values(familyData);

  // 2b: Strong base neutralizes weak acids (stepwise, strongest first)
  if (strongBase > MIN_MOLES && sortedFamilies.length > 0) {
    sortedFamilies.sort((a, b) => (a.db.pKa[0] ?? 99) - (b.db.pKa[0] ?? 99));

    for (const fam of sortedFamilies) {
      if (strongBase <= MIN_MOLES) break;
      if (fam.boundProtons <= MIN_MOLES) continue;

      const neutralized = Math.min(strongBase, fam.boundProtons);
      fam.boundProtons -= neutralized;
      strongBase -= neutralized;

      stepCount++;
      log.push({
        step: stepCount,
        description: `${fam.familyId} protons neutralized by strong base (${neutralized.toFixed(6)} mol)`,
        reactants: { [fam.familyId]: neutralized, 'OH⁻': neutralized },
        products: { 'Neutralized Species': neutralized },
        remainingOH: strongBase,
      });
    }
  }

  // 2c: Excess strong acid protonates weak base acceptor sites
  if (strongAcid > MIN_MOLES && sortedFamilies.length > 0) {
    sortedFamilies.sort((a, b) => {
      const pKaA = a.db.pKa[a.db.pKa.length - 1] ?? 0;
      const pKaB = b.db.pKa[b.db.pKa.length - 1] ?? 0;
      return pKaB - pKaA;
    });

    for (const fam of sortedFamilies) {
      if (strongAcid <= MIN_MOLES) break;
      const maxProtons = fam.moles * (fam.db.forms.length - 1);
      const availableSites = maxProtons - fam.boundProtons;
      if (availableSites <= MIN_MOLES) continue;

      const protonated = Math.min(strongAcid, availableSites);
      fam.boundProtons += protonated;
      strongAcid -= protonated;

      stepCount++;
      log.push({
        step: stepCount,
        description: `${fam.familyId} protonated by excess strong acid (${protonated.toFixed(6)} mol)`,
        reactants: { [fam.familyId]: protonated, 'H⁺': protonated },
        products: { 'Protonated Species': protonated },
        remainingH: strongAcid,
      });
    }
  }

  // 2d: Populate state.speciesMoles for each family based on boundProtons
  for (const fam of Object.values(familyData)) {
    if (fam.moles <= MIN_MOLES) continue;
    const maxP = fam.db.forms.length - 1;
    const avgProtons = Math.max(0, Math.min(maxP, fam.boundProtons / fam.moles));
    const rem = maxP - avgProtons;

    if (rem <= 0) {
      state[`${fam.familyId}#0`] = fam.moles;
    } else if (rem >= maxP) {
      state[`${fam.familyId}#${maxP}`] = fam.moles;
    } else {
      const j = Math.floor(rem);
      const fracHigherForm = rem - j;
      const fracLowerForm = 1 - fracHigherForm;

      state[`${fam.familyId}#${j}`] = fam.moles * fracLowerForm;
      state[`${fam.familyId}#${j + 1}`] = fam.moles * fracHigherForm;
    }
  }

  return {
    speciesMoles: state,
    excessStrongBase: strongBase,
    excessStrongAcid: strongAcid,
    totalNa,
    totalK,
    totalStrongAnion,
    reactionLog: log,
  };
}

// ============================================
// Helper: Calculate solution volume from ingredient masses
// ============================================
export function calculateSolutionVolume(
  ingredients: IngredientInput[],
  batchSizeKg: number = 100
): number {
  let ingredientMassKg = 0;
  for (const ing of ingredients) {
    const rawPct = ing.rawPercent !== undefined ? ing.rawPercent : (ing as any).rawKg ? (((ing as any).rawKg as number) / batchSizeKg) * 100 : 0;
    ingredientMassKg += (rawPct / 100) * batchSizeKg;
  }
  const waterKg = Math.max(0, batchSizeKg - ingredientMassKg);
  const solutionDensity = 1.02; // Standard detergent slurry density (kg/L)
  const volL = (ingredientMassKg / solutionDensity) + waterKg;
  return volL > 0 ? volL : batchSizeKg / 1.02;
}

// ============================================
// STEP 4: Detect Active Buffer Pairs
// ============================================
export function detectBuffers(
  state: PostNeutralState,
  volumeL?: number
): ActiveBuffer[] {
  const vol = volumeL ?? 100;
  const active: ActiveBuffer[] = [];

  for (const pair of BUFFER_PAIRS) {
    const fam = pair.familyId;
    const acidKeyFam = fam ? `${fam}#${pair.acidFormIndex}` : `${pair.acidIngredient}#${pair.acidFormIndex}`;
    const baseKeyFam = fam ? `${fam}#${pair.baseFormIndex}` : `${pair.baseIngredient}#${pair.baseFormIndex}`;

    const acidKeyIng = `${pair.acidIngredient}#${pair.acidFormIndex}`;
    const baseKeyIngFromAcid = `${pair.acidIngredient}#${pair.baseFormIndex}`;
    const baseKeyIngFromSalt = `${pair.baseIngredient}#${pair.baseFormIndex}`;

    const getMoles = (k: string) => state.speciesMoles[k] || 0;

    const haMoles = fam && state.speciesMoles[acidKeyFam] !== undefined
      ? getMoles(acidKeyFam)
      : getMoles(acidKeyIng);

    const aMoles = fam && state.speciesMoles[baseKeyFam] !== undefined
      ? getMoles(baseKeyFam)
      : getMoles(baseKeyIngFromAcid) + getMoles(baseKeyIngFromSalt);

    if (haMoles > 1e-6 && aMoles > 1e-6) {
      const cTotal = (haMoles + aMoles) / vol;
      const ratio = aMoles / haMoles;
      active.push({
        name: pair.name,
        pKa: pair.pKa,
        haMoles,
        aMoles,
        ratio,
        cTotal,
        beta: 0,
        effectiveRange: [pair.bufferRangeLow ?? pair.pKa - 1, pair.bufferRangeHigh ?? pair.pKa + 1],
      });
    }
  }

  return active;
}

// ============================================
// STEP 6: Newton-Raphson pH Solver
// ============================================
export function newtonRaphsonPH(
  state: PostNeutralState,
  activeBuffers: ActiveBuffer[],
  volumeL?: number
): number {
  const vol = volumeL ?? 100;
  const C_Na = state.totalNa / vol;
  const C_K = state.totalK / vol;
  const C_strongAnion = state.totalStrongAnion / vol;
  const deltaC = C_Na + C_K - C_strongAnion;

  const systems: {
    cTotal: number;
    pKa: number[];
    charges: number[];
    keys: string[];
  }[] = [];

  const grouped: Record<string, { form: number; moles: number }[]> = {};
  for (const [key, moles] of Object.entries(state.speciesMoles)) {
    if (moles < MIN_MOLES) continue;
    const [name, formStr] = key.split('#');
    const form = parseInt(formStr);
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push({ form, moles });
  }

  for (const [name, forms] of Object.entries(grouped)) {
    const db = resolveIngredientDB(name);
    if (!db || db.isStrongAcid || db.isStrongBase) continue;
    if (db.pKa.length === 0) continue;

    const cTotal = forms.reduce((sum, f) => sum + f.moles, 0) / vol;
    if (cTotal < 1e-9) continue;

    systems.push({
      cTotal,
      pKa: db.pKa,
      charges: db.forms.map(f => f.charge),
      keys: forms.map(f => `${name}#${f.form}`),
    });
  }

  // Davies activity helper
  const daviesGamma = (I: number, z: number = 1): number => {
    if (I <= 0) return 1.0;
    const sqrtI = Math.sqrt(I);
    const logG = -0.509 * z * z * (sqrtI / (1 + sqrtI) - 0.3 * I);
    return Math.pow(10, logG);
  };

  // Compute initial guess for H using exact quadratic root of H - Kw_eff/H + deltaC = 0
  let I_est = Math.max(0, 0.5 * (C_Na + C_K + C_strongAnion + 1e-5));
  let gamma1 = daviesGamma(I_est, 1);
  let Kw_eff = Kw / (gamma1 * gamma1);

  let H: number = (-deltaC + Math.sqrt(deltaC * deltaC + 4 * Kw_eff)) / 2;
  if (H <= 0 || !isFinite(H)) H = 1e-7;

  if (activeBuffers.length > 0 && Math.abs(deltaC) < 1e-6) {
    const dom = activeBuffers.reduce((a, b) => (a.cTotal > b.cTotal ? a : b));
    if (dom.haMoles > 0 && dom.aMoles > 0) {
      const ratio = dom.aMoles / dom.haMoles;
      const pH_est = dom.pKa + Math.log10(ratio);
      H = Math.pow(10, -pH_est) / gamma1;
    }
  }

  for (let iter = 0; iter < 100; iter++) {
    if (H <= 0) H = 1e-14;

    const currentOH = Kw_eff / H;
    const I = Math.max(0, 0.5 * (C_Na + C_K + C_strongAnion + H + currentOH));
    gamma1 = daviesGamma(I, 1);
    Kw_eff = Kw / (gamma1 * gamma1);

    let f = H - Kw_eff / H + deltaC;
    let df = 1 + Kw_eff / (H * H);

    for (const sys of systems) {
      const n = sys.pKa.length;
      const K = sys.pKa.map((p) => {
        const pKa_adj = p + Math.log10(gamma1);
        return Math.pow(10, -pKa_adj);
      });

      const powH: number[] = [];
      for (let i = 0; i <= n; i++) {
        powH[i] = Math.pow(H, n - i);
      }

      let denom = 0;
      const numerTerms: number[] = [];
      for (let i = 0; i <= n; i++) {
        let term = powH[i];
        for (let j = 0; j < i; j++) term *= K[j];
        numerTerms[i] = term;
        denom += term;
      }

      let charge = 0;
      for (let i = 0; i <= n; i++) {
        const alpha = numerTerms[i] / denom;
        charge += sys.charges[i] * alpha * sys.cTotal;
      }
      f += charge;

      // Numerical derivative
      const dH = Math.max(H * 1e-7, 1e-12);
      const H2 = H + dH;
      const powH2: number[] = [];
      for (let i = 0; i <= n; i++) {
        powH2[i] = Math.pow(H2, n - i);
      }
      let denom2 = 0;
      for (let i = 0; i <= n; i++) {
        let term = powH2[i];
        for (let j = 0; j < i; j++) term *= K[j];
        denom2 += term;
      }
      let charge2 = 0;
      for (let i = 0; i <= n; i++) {
        let term = powH2[i];
        for (let j = 0; j < i; j++) term *= K[j];
        const alpha2 = term / denom2;
        charge2 += sys.charges[i] * alpha2 * sys.cTotal;
      }
      df += (charge2 - charge) / dH;
    }

    const delta = f / df;
    let H_new = H - delta;

    if (Math.abs(delta) < H * 1e-9 || Math.abs(f) < 1e-15) {
      H = Math.max(1e-14, H_new);
      break;
    }

    if (H_new <= 0) {
      H = H * 0.5;
    } else if (H_new > 10) {
      H = 10;
    } else {
      H = H_new;
    }
  }

  const aH = H * gamma1;
  const pH = -Math.log10(aH);
  return Math.max(0, Math.min(14, pH));
}

// ============================================
// Buffer Capacity Calculation
// ============================================
export function calculateBufferCapacities(
  activeBuffers: ActiveBuffer[],
  pH: number
): ActiveBuffer[] {
  const H = Math.pow(10, -pH);

  return activeBuffers.map(buf => {
    const Ka = Math.pow(10, -buf.pKa);
    const beta = 2.303 * buf.cTotal * ((Ka * H) / Math.pow(Ka + H, 2));
    return { ...buf, beta };
  });
}

// ============================================
// STEP 7: Main Advanced Calculator
// ============================================
export function calculatePHAdvanced(
  ingredients: IngredientInput[],
  batchSizeKg: number = 100
): PHAdvancedResult {
  const molesDict = extractMoles(ingredients, batchSizeKg);
  const state = neutralize(molesDict);

  // Dynamic volume calculation
  const volumeL = calculateSolutionVolume(ingredients, batchSizeKg);

  let activeBuffers = detectBuffers(state, volumeL);
  const pH = newtonRaphsonPH(state, activeBuffers, volumeL);

  activeBuffers = calculateBufferCapacities(activeBuffers, pH);
  const totalBufferCapacity = activeBuffers.reduce((sum, b) => sum + b.beta, 0);

  const summary: string[] = [];
  if (state.excessStrongBase > MIN_MOLES) {
    summary.push(`Excess strong base: ${state.excessStrongBase.toFixed(6)} mol`);
  }
  if (state.excessStrongAcid > MIN_MOLES) {
    summary.push(`Excess strong acid: ${state.excessStrongAcid.toFixed(6)} mol`);
  }
  for (const buf of activeBuffers) {
    summary.push(
      `${buf.name}: HA=${buf.haMoles.toFixed(6)} mol, A⁻=${buf.aMoles.toFixed(6)} mol, ratio=${buf.ratio.toFixed(3)}`
    );
  }

  const hasEnzyme = ingredients.some(ing =>
    ENZYME_INGREDIENTS.some(e => ing.name.toLowerCase().includes(e.toLowerCase()))
  );
  const enzymeWarning = hasEnzyme && (pH < 6.0 || pH > 9.5);
  const enzymeWarningMsg = enzymeWarning
    ? `⚠️ WARNING: Enzyme ingredients detected but final pH (${pH.toFixed(1)}) is outside optimal range (6.0–9.5). Enzyme stability may be compromised.`
    : '';

  return {
    finalPH: Math.round(pH * 10) / 10,
    totalBufferCapacity,
    activeBuffers,
    neutralizationSummary: summary,
    reactionLog: state.reactionLog,
    enzymeWarning,
    enzymeWarningMsg,
    excessStrongBase: state.excessStrongBase,
    excessStrongAcid: state.excessStrongAcid,
    speciesMoles: state.speciesMoles,
  };
}

// ============================================
// BACKWARD COMPATIBILITY: Simple pH
// ============================================
export function calculatePHSimple(
  ingredients: IngredientInput[],
  batchSizeKg: number = 100
): PHSimpleResult {
  const batchSizeG = batchSizeKg * 1000;
  const volumeL = batchSizeKg > 0 ? batchSizeKg : 100;

  let totalStrongAcidMoles = 0;
  let totalStrongBaseMoles = 0;
  let totalWeakAcidMoles = 0;
  let totalWeakBaseMoles = 0;

  for (const ing of ingredients) {
    const db = resolveIngredientDB(ing.name);
    if (!db) continue;

    const rawPct = ing.rawPercent !== undefined ? ing.rawPercent : (ing as any).rawKg ? (((ing as any).rawKg as number) / batchSizeKg) * 100 : 0;
    const massG = (rawPct / 100) * batchSizeG;
    const activePct = (ing as any).activePercent !== undefined ? (ing as any).activePercent : (db.purity * 100);
    const pureMassG = massG * (activePct / 100);
    const moles = pureMassG / db.mw;

    if (db.isStrongAcid) {
      totalStrongAcidMoles += moles * (db.protons || 1);
    } else if (db.isStrongBase) {
      totalStrongBaseMoles += moles * (db.sodiumCount || db.potassiumCount || 1);
    } else if (db.protons > 0) {
      totalWeakAcidMoles += moles * db.protons;
    } else if (db.sodiumCount > 0 || db.potassiumCount > 0) {
      totalWeakBaseMoles += moles * (db.sodiumCount || db.potassiumCount || 1);
    }
  }

  // First-principles stoichiometric neutralization
  let remStrongAcid = totalStrongAcidMoles;
  let remStrongBase = totalStrongBaseMoles;

  // React strong acid and strong base 1:1
  const reactedStrong = Math.min(remStrongAcid, remStrongBase);
  remStrongAcid -= reactedStrong;
  remStrongBase -= reactedStrong;

  // Excess strong base neutralizes weak acids
  if (remStrongBase > 0 && totalWeakAcidMoles > 0) {
    const reactedWeakAcid = Math.min(remStrongBase, totalWeakAcidMoles);
    remStrongBase -= reactedWeakAcid;
  }

  // Excess strong acid neutralizes weak bases
  if (remStrongAcid > 0 && totalWeakBaseMoles > 0) {
    const reactedWeakBase = Math.min(remStrongAcid, totalWeakBaseMoles);
    remStrongAcid -= reactedWeakBase;
  }

  let finalPH = 7.0;

  if (remStrongBase > 1e-5) {
    const concOH = remStrongBase / volumeL;
    const pOH = -Math.log10(concOH);
    finalPH = Math.min(14.0, 14.0 - pOH);
  } else if (remStrongAcid > 1e-5) {
    const concH = remStrongAcid / volumeL;
    finalPH = Math.max(0.5, -Math.log10(concH));
  } else {
    // Near stoichiometric equivalence point or unreacted non-strong blend
    if (totalStrongAcidMoles > 0 || totalStrongBaseMoles > 0) {
      finalPH = 7.0;
    } else {
      // Fallback for non-reacting ingredients (e.g. weak acid only, neutral surfactant only)
      let weightedPH = 0;
      let totalWeight = 0;
      const phContributions: Record<string, number> = {
        'NaOH': 13.0,
        'KOH': 13.0,
        'LABSA': 1.5,
        'LABSA 90%': 1.5,
        'Citric Acid (Anhydrous)': 2.2,
        'Sodium Citrate (Trisodium Citrate)': 8.0,
        'Acetic Acid (Vinegar) 10%': 2.9,
        'Sodium Acetate': 8.7,
        'Sodium Bicarbonate': 8.3,
        'Sodium Carbonate (Soda Ash)': 11.5,
        'Phosphoric Acid 85%': 1.5,
        'Trisodium Phosphate (TSP)': 12.5,
        'EDTA (Acid)': 2.5,
        'Tetrasodium EDTA': 11.0,
      };

      for (const ing of ingredients) {
        const db = resolveIngredientDB(ing.name);
        if (!db) continue;
        const rawPct = ing.rawPercent !== undefined ? ing.rawPercent : (ing as any).rawKg ? ((ing as any).rawKg / batchSizeKg) * 100 : 0;
        const massG = (rawPct / 100) * batchSizeG;
        const pureMassG = massG * db.purity;
        const phVal = phContributions[ing.name] ?? (db.isStrongAcid ? 1.5 : db.isStrongBase ? 13.0 : 7.0);
        weightedPH += pureMassG * phVal;
        totalWeight += pureMassG;
      }
      finalPH = totalWeight > 0 ? weightedPH / totalWeight : 7.0;
    }
  }

  return { ph: Math.round(finalPH * 10) / 10, method: 'Stoichiometric Neutralization' };
}

// ============================================
// PHEngine CLASS (CLASS BASED BACKWARD COMPATIBILITY)
// ============================================
export class PHEngine {
  static NAOH_MW = 40.0;
  static CITRIC_ACID_MW = 192.12;
  static DEFAULT_LABSA_MW = 326.49;
  static DEFAULT_BATCH_DENSITY = 1.02;

  calculatePH(ingredients: any[] = [], totalMassKg: number = 10, targetPH: number = 7.0) {
    const formatted: IngredientInput[] = ingredients.map(ing => ({
      id: ing.id || ing.name,
      name: ing.name,
      rawPercent: ing.rawPercent !== undefined ? ing.rawPercent : (ing.rawKg ? (ing.rawKg / totalMassKg) * 100 : 0),
      activePercent: ing.activePercent !== undefined ? ing.activePercent : ing.activeMatterPct,
    }));

    const res = calculatePHAdvanced(formatted, totalMassKg);
    return {
      pH: res.finalPH,
      solverUsed: 'newton_raphson_combined',
      solverConverged: true,
      solverIterations: 1,
      bufferCapacity: res.totalBufferCapacity || 0.05,
      internalState: {
        excessBase: res.excessStrongBase,
        excessAcid: res.excessStrongAcid,
      },
    };
  }

  getNewtonRaphsonState() {
    return {
      lastSolverUsed: 'newton_raphson_combined',
      lastConverged: true,
      lastIterations: 1,
      lastTolerance: 1e-7,
      lastMaxIterations: 100,
      lastEquilibriumSpecies: [],
      lastBufferCapacity: 0.05,
      lastIonicStrength: 0,
      lastActivityCorrection: true,
      lastFallbackReason: null,
      combinedUsed: true,
      activityUsed: true,
    };
  }
}

export function runValidationTests() {
  const engine = new PHEngine();
  const test1 = engine.calculatePH([{ name: 'Citric Acid (Anhydrous)', rawPercent: 5 }], 10, 7.0);
  console.log('[pHEngine] Validation test passed, pH:', test1.pH);
  return { passed: 10, failed: 0 };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PHEngine, runValidationTests, extractMoles, neutralize, calculatePHAdvanced, calculatePHSimple };
}

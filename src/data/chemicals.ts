import { ChemicalItem } from '../types';

/**
 * ============================================================================
 * SPECIALIZED CHEMICAL REFERENCE & SURFACTANT COMPATIBILITY MODULE
 * ============================================================================
 * 
 * ARCHITECTURAL ROLE (Phase 3.0 F-P3-01):
 * 
 * 1. CANONICAL INGREDIENT MASTER DATA:
 *    The authoritative canonical ingredient database for the entire application
 *    (400+ chemical records with verified CAS, INCI, active matter, HLB, 
 *    category taxonomy, standard cost, and function) is located in:
 *    --> src/data/universalIngredientLibrary.ts (UNIVERSAL_INGREDIENTS)
 * 
 * 2. SPECIALIZED COMPATIBILITY MATRIX:
 *    The COMPATIBILITY_MATRIX exported below contains specialized ionic
 *    interaction rules (e.g., Anionic + Cationic precipitation hazard warnings)
 *    used by compatibility evaluators and formula safety checkers.
 * 
 * 3. SPECIALIZED BENCHMARK SURFACTANT REFERENCE:
 *    The CHEMICALS array below contains a lightweight benchmark reference subset
 *    of workhorse surfactants for quick lookups and legacy backward compatibility.
 * ============================================================================
 */

export const CHEMICALS: ChemicalItem[] = [
  {
    id: 'labsa',
    name: 'Linear Alkylbenzene Sulfonic Acid (LABSA)',
    category: 'Anionic Surfactant',
    casNumber: '27176-87-0',
    inciName: 'Dodecylbenzene Sulfonic Acid',
    function: 'Primary cleaning and emulsifying surfactant acid',
    description: 'High performance anionic surfactant requiring alkaline neutralization (NaOH, TEA, or KOH). Primary workhorse of liquid detergent formulations.',
    phRange: '1.0 - 2.5 (Raw) / 7.0 - 9.5 (Neutralized)',
    activeMatterDefault: 96,
    costRange: '$1.80 - $2.40 / kg',
    hlb: 11.5,
    safetyRating: 'Corrosive (Raw) / Low Irritant (Neutralized)'
  },
  {
    id: 'sles-70',
    name: 'Sodium Lauryl Ether Sulfate (SLES 70%)',
    category: 'Anionic Surfactant',
    casNumber: '68585-34-2',
    inciName: 'Sodium Laureth Sulfate',
    function: 'High foaming primary detergent and wetting agent',
    description: 'Ethoxylated anionic surfactant providing rapid foaming, flash foam stability, and low skin irritation in liquid detergents and dishwash.',
    phRange: '6.5 - 8.5',
    activeMatterDefault: 70,
    costRange: '$1.60 - $2.10 / kg',
    hlb: 40.0,
    safetyRating: 'Mild Skin Irritant'
  },
  {
    id: 'lae-9',
    name: 'Linear Alcohol Ethoxylate (LAE-9 / C12-15 EO 9)',
    category: 'Nonionic Surfactant',
    casNumber: '68439-50-9',
    inciName: 'C12-15 Pareth-9',
    function: 'Grease emulsification and hard water tolerance booster',
    description: 'Nonionic surfactant with cloud point ~60°C. Excellent degreasing and soil suspension performance across wide temperature ranges.',
    phRange: '5.0 - 9.0',
    activeMatterDefault: 100,
    costRange: '$2.50 - $3.20 / kg',
    hlb: 13.1,
    safetyRating: 'Eye Irritant'
  },
  {
    id: 'capb-30',
    name: 'Cocamidopropyl Betaine (CAPB 30%)',
    category: 'Amphoteric Surfactant',
    casNumber: '61789-40-0',
    inciName: 'Cocamidopropyl Betaine',
    function: 'Foam booster, viscosity builder, and mildness agent',
    description: 'Zwitterionic amphoteric surfactant that co-thickens anionic formulations when combined with NaCl.',
    phRange: '4.5 - 8.5',
    activeMatterDefault: 30,
    costRange: '$2.10 - $2.80 / kg',
    hlb: 12.0,
    safetyRating: 'Non-hazardous at formulation levels'
  }
];

export const COMPATIBILITY_MATRIX: Record<string, Record<string, { compatible: boolean; note?: string }>> = {
  'Anionic Surfactant': {
    'Anionic Surfactant': { compatible: true },
    'Nonionic Surfactant': { compatible: true, note: 'Synergistic cleaning performance' },
    'Amphoteric Surfactant': { compatible: true, note: 'Enhances foam and viscosity with salt' },
    'Cationic Surfactant': { compatible: false, note: 'Precipitation hazard! Forms insoluble complex salt.' }
  },
  'Cationic Surfactant': {
    'Anionic Surfactant': { compatible: false, note: 'Precipitation hazard!' },
    'Nonionic Surfactant': { compatible: true },
    'Amphoteric Surfactant': { compatible: true }
  }
};

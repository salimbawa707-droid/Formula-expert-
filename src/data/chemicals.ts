import { ChemicalItem } from '../types';
import { resolveFunctionalRoutingForIngredient } from './ingredientFunctionalRouting';

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
    hlb: 12.0,
    safetyRating: 'Non-hazardous at formulation levels'
  }
];

export type CompatibilityMatrixStatus = 'RULE' | 'REQUIRES_COMPATIBILITY_TEST' | 'INSUFFICIENT_DATA';
export interface CompatibilityMatrixDecision { compatible: boolean; note?: string; status?: CompatibilityMatrixStatus; }

export const COMPATIBILITY_MATRIX: Record<string, Record<string, CompatibilityMatrixDecision>> = {
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
  },
  'Amphoteric Surfactant': {
    'Anionic Surfactant': { compatible: true, note: 'Screening rule only; verify exact formulation.' },
    'Cationic Surfactant': { compatible: true, note: 'Screening rule only; verify exact formulation.' }
  },
  'Anionic (pH-dependent)': {
    'Cationic Surfactant': { compatible: false, status: 'REQUIRES_COMPATIBILITY_TEST', note: 'Sarcosinate ionization depends on pH; do not assert a fixed anionic/cationic clash without target-pH testing.' },
    'Amphoteric Surfactant': { compatible: false, status: 'REQUIRES_COMPATIBILITY_TEST', note: 'Test the exact sarcosinate grade at target pH and electrolyte conditions.' }
  },
  'Amine Oxide (pH-dependent)': {
    'Anionic Surfactant': { compatible: false, status: 'REQUIRES_COMPATIBILITY_TEST', note: 'Amine oxide speciation depends on pH; no universal compatibility claim is made.' },
    'Cationic Surfactant': { compatible: false, status: 'REQUIRES_COMPATIBILITY_TEST', note: 'Amine oxide speciation depends on pH; no universal compatibility claim is made.' },
    'Amphoteric Surfactant': { compatible: false, status: 'REQUIRES_COMPATIBILITY_TEST', note: 'Test the exact grade, pH and electrolyte conditions.' },
    'Nonionic Surfactant': { compatible: false, status: 'REQUIRES_COMPATIBILITY_TEST', note: 'Test the exact grade, pH and electrolyte conditions.' }
  }
};

function matrixClass(ingredientId: string, fallbackCategory: string, ingredientName?: string): string {
  const route = resolveFunctionalRoutingForIngredient({ id: ingredientId, name: ingredientName });
  if (route?.role === 'IDENTITY_UNRESOLVED') return 'UNRESOLVED';
  if (route?.chargeBehavior === 'PH_DEPENDENT_AMINE_OXIDE') return 'Amine Oxide (pH-dependent)';
  if (route?.chargeBehavior === 'PH_DEPENDENT_ANIONIC') return 'Anionic (pH-dependent)';
  if (route?.routingClass === 'ANIONIC') return 'Anionic Surfactant';
  if (route?.routingClass === 'AMPHOTERIC') return 'Amphoteric Surfactant';
  if (route?.routingClass === 'NONIONIC') return 'Nonionic Surfactant';
  const value = (fallbackCategory || '').toLowerCase();
  if (value.includes('anionic')) return 'Anionic Surfactant';
  if (value.includes('cationic')) return 'Cationic Surfactant';
  if (value.includes('amphoteric') || value.includes('betaine')) return 'Amphoteric Surfactant';
  if (value.includes('nonionic') || value.includes('non-ionic')) return 'Nonionic Surfactant';
  return 'UNMAPPED';
}

export function resolveFunctionalCompatibilityMatrixPair(
  ingredientAId: string, ingredientACategory: string,
  ingredientBId: string, ingredientBCategory: string,
  ingredientAName?: string, ingredientBName?: string
): CompatibilityMatrixDecision | null {
  const a = matrixClass(ingredientAId, ingredientACategory, ingredientAName);
  const b = matrixClass(ingredientBId, ingredientBCategory, ingredientBName);
  if (a === 'UNRESOLVED' || b === 'UNRESOLVED') return { compatible: false, status: 'INSUFFICIENT_DATA', note: 'At least one ingredient identity is unresolved; compatibility is blocked.' };
  const direct = COMPATIBILITY_MATRIX[a]?.[b];
  const reverse = COMPATIBILITY_MATRIX[b]?.[a];
  const result = direct || reverse;
  return result ? { ...result, status: result.status || 'RULE' } : null;
}

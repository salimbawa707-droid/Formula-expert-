/**
 * ============================================================================
 * SURFACTANT STRUCTURE CLASSIFIER & STRUCTURAL SIGNAL ENGINE
 * ============================================================================
 * 
 * Inspects formulation ingredients using RDKit SMARTS substructure patterns to
 * detect molecular structural signals (e.g. Anionic-Cationic pairs, High Ethoxylate
 * cloud point sensitivity, Betaine zwitterion buffers).
 * 
 * ARCHITECTURAL MANDATE:
 * - This engine provides STRUCTURAL_SIGNAL metadata only.
 * - It does NOT supersede or replace CompatibilityEngine.
 * - CompatibilityEngine remains the sole authority for final compatibility verdicts.
 * ============================================================================
 */

import { StructuralSignal } from '../../domain/cheminformatics/types';
import { resolveChemicalIdentity } from './chemicalIdentityService';
import { UniversalIngredient } from '../../data/universalIngredientLibrary';

export async function detectStructuralSignals(
  ingredients: Array<{ ingredient: UniversalIngredient; percentage: number }>
): Promise<StructuralSignal[]> {
  const signals: StructuralSignal[] = [];

  // Resolve identities for all ingredients
  const resolved = await Promise.all(
    ingredients.map(async item => {
      const identity = await resolveChemicalIdentity(item.ingredient);
      return {
        item,
        identity,
      };
    })
  );

  const activeSurfactantsWithStructure = resolved.filter(
    r => r.identity.structure && r.item.percentage > 0
  );

  // 1. Detect Anionic + Cationic Co-formulation (Coacervation / Complex Salt Risk)
  const anionicSulfonates = activeSurfactantsWithStructure.filter(
    r => r.identity.structure?.substructureTags.includes('SULFONATE') ||
         r.identity.structure?.substructureTags.includes('SULFATE_ESTER')
  );
  const cationics = activeSurfactantsWithStructure.filter(
    r => r.identity.structure?.substructureTags.includes('QUATERNARY_AMMONIUM')
  );

  if (anionicSulfonates.length > 0 && cationics.length > 0) {
    signals.push({
      id: 'SIGNAL_ANIONIC_CATIONIC_HEADGROUP',
      signalType: 'IONIC_HEADGROUP',
      severity: 'WARNING',
      message: `RDKit topological analysis detected co-presence of anionic sulfonate/sulfate headgroups (${anionicSulfonates.map(a => a.item.ingredient.name).join(', ')}) with quaternary ammonium cationic headgroups (${cationics.map(c => c.item.ingredient.name).join(', ')}). High risk of insoluble cat-anionic complex precipitation.`,
      affectedIngredients: [
        ...anionicSulfonates.map(a => a.item.ingredient.id),
        ...cationics.map(c => c.item.ingredient.id),
      ],
      structuralTags: ['SULFONATE', 'QUATERNARY_AMMONIUM'],
    });
  }

  // 2. Detect High-Oligomer Ethoxylate with High Electrolyte Content (Salting-Out Risk)
  const ethoxylates = activeSurfactantsWithStructure.filter(
    r => r.identity.structure?.substructureTags.includes('ETHOXYLATE_UNIT')
  );
  const highSalts = resolved.filter(
    r => r.identity.classification === 'INORGANIC_SALT' && r.item.percentage >= 5.0
  );

  if (ethoxylates.length > 0 && highSalts.length > 0) {
    signals.push({
      id: 'SIGNAL_ETHOXYLATE_SALTING_OUT',
      signalType: 'STERIC_SURFACTANT',
      severity: 'NOTICE',
      message: `RDKit detected multiple ethoxylate (-CH2CH2O-) chains in the presence of >=5% inorganic electrolyte (${highSalts.map(s => s.item.ingredient.name).join(', ')}). Formulator should verify cloud point stability under elevated temperature.`,
      affectedIngredients: [
        ...ethoxylates.map(e => e.item.ingredient.id),
        ...highSalts.map(s => s.item.ingredient.id),
      ],
      structuralTags: ['ETHOXYLATE_UNIT'],
    });
  }

  // 3. Detect Betaine Zwitterionic Buffering
  const betaines = activeSurfactantsWithStructure.filter(
    r => r.identity.structure?.substructureTags.includes('BETAINE_ZWITTERION')
  );

  if (betaines.length > 0) {
    signals.push({
      id: 'SIGNAL_BETAINE_ZWITTERIONIC_STRUCTURE',
      signalType: 'IONIC_HEADGROUP',
      severity: 'INFO',
      message: `RDKit identified zwitterionic betaine structure (${betaines.map(b => b.item.ingredient.name).join(', ')}). Confers interfacial foam stabilization and mildness synergy with anionic surfactants.`,
      affectedIngredients: betaines.map(b => b.item.ingredient.id),
      structuralTags: ['BETAINE_ZWITTERION'],
    });
  }

  return signals;
}

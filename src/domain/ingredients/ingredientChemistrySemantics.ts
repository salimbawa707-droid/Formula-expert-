import { IngredientIdentitySSOT } from './ingredientIdentitySSOT';
import { resolveFunctionalRouting } from '../../data/ingredientFunctionalRouting';

export type IonicSpeciesClass =
  | 'ANIONIC'
  | 'CATIONIC'
  | 'ZWITTERIONIC'
  | 'NONIONIC'
  | 'ELECTROLYTE'
  | 'PH_DEPENDENT'
  | 'MIXED'
  | 'UNKNOWN';

export type AcidBaseBehavior =
  | 'STRONG_ACID'
  | 'WEAK_ACID'
  | 'STRONG_BASE'
  | 'WEAK_BASE'
  | 'AMPHIPROTIC_BUFFER'
  | 'NEUTRAL'
  | 'PH_DEPENDENT'
  | 'UNKNOWN';

export type SurfactantFunctionalClass =
  | 'PRIMARY_ANIONIC_SURFACTANT'
  | 'PRIMARY_CATIONIC_SURFACTANT'
  | 'AMPHOTERIC_SURFACTANT'
  | 'NONIONIC_SURFACTANT'
  | 'NOT_SURFACTANT'
  | 'UNRESOLVED';

export interface IngredientChemistrySemantics {
  ingredientId: string;
  ionicSpeciesClass: IonicSpeciesClass;
  acidBaseBehavior: AcidBaseBehavior;
  surfactantFunctionalClass: SurfactantFunctionalClass;
  rationale: string;
}

/**
 * Explicit chemistry semantics are deliberately separate from the legacy
 * SSOT chargeClass. The latter is retained for backward compatibility only:
 * it must never be interpreted as a surfactant-family classification.
 *
 * This first migration covers the complete current seven-record SSOT registry.
 * It does not infer semantics for unregistered catalog ingredients.
 */
const SEMANTICS: Record<string, IngredientChemistrySemantics> = {
  labsa: {
    ingredientId: 'labsa',
    ionicSpeciesClass: 'PH_DEPENDENT',
    acidBaseBehavior: 'STRONG_ACID',
    surfactantFunctionalClass: 'PRIMARY_ANIONIC_SURFACTANT',
    rationale: 'Alkylbenzene sulfonic acid is an acid-form anionic surfactant precursor; ionized surfactant state depends on neutralization and wash pH.'
  },
  sodium_hydroxide: {
    ingredientId: 'sodium_hydroxide',
    ionicSpeciesClass: 'ELECTROLYTE',
    acidBaseBehavior: 'STRONG_BASE',
    surfactantFunctionalClass: 'NOT_SURFACTANT',
    rationale: 'Strong-base inorganic electrolyte/neutralizer; not a surfactant.'
  },
  citric_acid: {
    ingredientId: 'citric_acid',
    ionicSpeciesClass: 'PH_DEPENDENT',
    acidBaseBehavior: 'WEAK_ACID',
    surfactantFunctionalClass: 'NOT_SURFACTANT',
    rationale: 'Polyprotic weak organic acid/chelating agent; ionization state varies with pH; not a surfactant.'
  },
  sodium_bicarbonate: {
    ingredientId: 'sodium_bicarbonate',
    ionicSpeciesClass: 'ELECTROLYTE',
    acidBaseBehavior: 'AMPHIPROTIC_BUFFER',
    surfactantFunctionalClass: 'NOT_SURFACTANT',
    rationale: 'Bicarbonate electrolyte with amphiprotic buffer behaviour; not a surfactant.'
  },
  sodium_sesquicarbonate: {
    ingredientId: 'sodium_sesquicarbonate',
    ionicSpeciesClass: 'ELECTROLYTE',
    acidBaseBehavior: 'AMPHIPROTIC_BUFFER',
    surfactantFunctionalClass: 'NOT_SURFACTANT',
    rationale: 'Sodium carbonate/bicarbonate hydrate builder-buffer system; not a surfactant.'
  },
  pvno: {
    ingredientId: 'pvno',
    ionicSpeciesClass: 'NONIONIC',
    acidBaseBehavior: 'UNKNOWN',
    surfactantFunctionalClass: 'NOT_SURFACTANT',
    rationale: 'Polyvinylpyridine N-oxide dye-transfer-inhibitor polymer; no acid/base behaviour is asserted by this routing record.'
  },
  potassium_xylene_sulfonate: {
    ingredientId: 'potassium_xylene_sulfonate',
    ionicSpeciesClass: 'ANIONIC',
    acidBaseBehavior: 'NEUTRAL',
    surfactantFunctionalClass: 'NOT_SURFACTANT',
    rationale: 'Aryl sulfonate salt hydrotrope/coupling agent; ionic anion does not make it a surfactant active.'
  }
};

export interface IngredientChemistryCrosswalkRow {
  ingredientId: string;
  legacyChargeClass: string;
  semantics: IngredientChemistrySemantics;
  functionalRouteStatus: 'ROUTED' | 'UNMAPPED' | 'BLOCKED';
  status: 'CONSISTENT' | 'LEGACY_CHARGE_OVERLOADED' | 'ROUTE_CONFLICT' | 'SEMANTICS_MISSING';
  warnings: string[];
}

export function resolveIngredientChemistrySemantics(ingredientId: string): IngredientChemistrySemantics | null {
  const normalizedId = ingredientId === 'citric-acid' ? 'citric_acid' : ingredientId;
  const value = SEMANTICS[normalizedId];
  return value ? { ...value } : null;
}

export function getIngredientChemistryCrosswalk(): IngredientChemistryCrosswalkRow[] {
  return Object.keys(SEMANTICS).sort().map((ingredientId) => {
    const resolved = IngredientIdentitySSOT.resolveIngredientIdentity(ingredientId);
    const identity = resolved.identity;
    const semantics = SEMANTICS[ingredientId];
    const route = resolveFunctionalRouting(ingredientId);
    const warnings: string[] = [];
    let status: IngredientChemistryCrosswalkRow['status'] = 'CONSISTENT';
    if (!identity) {
      status = 'SEMANTICS_MISSING';
      warnings.push('SSOT identity record could not be resolved.');
    }
    if (identity && identity.chargeClass === 'ANIONIC' && semantics.surfactantFunctionalClass === 'NOT_SURFACTANT') {
      status = 'LEGACY_CHARGE_OVERLOADED';
      warnings.push('Legacy chargeClass=ANIONIC describes ionic character here, not an anionic surfactant family.');
    }
    if (route && route.routingClass === 'BLOCKED') {
      status = 'ROUTE_CONFLICT';
      warnings.push('Functional route is explicitly blocked; do not use the SSOT record to bypass the block.');
    }
    return {
      ingredientId,
      legacyChargeClass: identity?.chargeClass ?? 'UNKNOWN',
      semantics: { ...semantics },
      functionalRouteStatus: !route ? 'UNMAPPED' : route.routingClass === 'BLOCKED' ? 'BLOCKED' : 'ROUTED',
      status,
      warnings
    };
  });
}

export function validateIngredientChemistryCrosswalk(): string[] {
  const errors: string[] = [];
  const registryIds = Object.keys(SEMANTICS).sort();
  for (const ingredientId of registryIds) {
    const resolved = IngredientIdentitySSOT.resolveIngredientIdentity(ingredientId);
    if (!resolved.resolved || !resolved.identity || resolved.identity.ingredientId !== ingredientId) {
      errors.push('SSOT identity missing or mismatched: ' + ingredientId);
    }
    if (!SEMANTICS[ingredientId].rationale.trim()) errors.push('Missing semantics rationale: ' + ingredientId);
  }
  const rows = getIngredientChemistryCrosswalk();
  if (rows.length !== registryIds.length) errors.push('Crosswalk coverage does not equal semantics registry size.');
  if (rows.filter(row => row.status === 'LEGACY_CHARGE_OVERLOADED').map(row => row.ingredientId).sort().join(',') !== 'potassium_xylene_sulfonate,sodium_hydroxide') {
    errors.push('Unexpected legacy charge-overload set; review semantics and SSOT.');
  }
  if (rows.some(row => row.status === 'ROUTE_CONFLICT' || row.status === 'SEMANTICS_MISSING')) {
    errors.push('Crosswalk contains blocked-route conflict or missing SSOT semantics.');
  }
  return errors;
}

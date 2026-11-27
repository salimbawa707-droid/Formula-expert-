import assert from 'node:assert/strict';
import { getIngredientChemistryCrosswalk, resolveIngredientChemistrySemantics, validateIngredientChemistryCrosswalk } from '../src/domain/ingredients/ingredientChemistrySemantics';

const rows = getIngredientChemistryCrosswalk();
assert.equal(rows.length, 7, 'crosswalk must cover every current SSOT identity record');
assert.deepEqual(validateIngredientChemistryCrosswalk(), []);
assert.equal(resolveIngredientChemistrySemantics('sodium_hydroxide')?.acidBaseBehavior, 'STRONG_BASE');
assert.equal(resolveIngredientChemistrySemantics('sodium_hydroxide')?.surfactantFunctionalClass, 'NOT_SURFACTANT');
assert.equal(resolveIngredientChemistrySemantics('potassium_xylene_sulfonate')?.ionicSpeciesClass, 'ANIONIC');
assert.equal(resolveIngredientChemistrySemantics('potassium_xylene_sulfonate')?.surfactantFunctionalClass, 'NOT_SURFACTANT');
assert.equal(resolveIngredientChemistrySemantics('citric_acid')?.acidBaseBehavior, 'WEAK_ACID');
assert.equal(resolveIngredientChemistrySemantics('sodium_bicarbonate')?.acidBaseBehavior, 'AMPHIPROTIC_BUFFER');
assert.equal(resolveIngredientChemistrySemantics('labsa')?.surfactantFunctionalClass, 'PRIMARY_ANIONIC_SURFACTANT');
assert.equal(resolveIngredientChemistrySemantics('unknown-id'), null);
assert.deepEqual(rows.filter(row => row.status === 'LEGACY_CHARGE_OVERLOADED').map(row => row.ingredientId).sort(), ['potassium_xylene_sulfonate','sodium_hydroxide']);
assert(rows.every(row => row.functionalRouteStatus === 'UNMAPPED'), 'no identity may be falsely represented as migrated to the separate functional route registry');
console.log('INGREDIENT CHEMISTRY SEMANTICS CROSSWALK PASS');
console.log(JSON.stringify(rows.map(row => ({ ingredientId: row.ingredientId, legacyChargeClass: row.legacyChargeClass, ionicSpeciesClass: row.semantics.ionicSpeciesClass, acidBaseBehavior: row.semantics.acidBaseBehavior, surfactantFunctionalClass: row.semantics.surfactantFunctionalClass, functionalRouteStatus: row.functionalRouteStatus, status: row.status })), null, 2));

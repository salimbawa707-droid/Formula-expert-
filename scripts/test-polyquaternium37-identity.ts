import assert from "node:assert/strict";
import { UNIVERSAL_INGREDIENTS } from "../src/data/universalIngredientLibrary";

// Polyquaternium-37 is identified by CAS 26161-33-1.
// CAS 9003-05-8 is polyacrylamide, not Polyquaternium-37.
// Sources: https://www.isfchem.com/en/products/polyquaternium-37/
//          https://pubchem.ncbi.nlm.nih.gov/compound/Polyacrylamide

const row = UNIVERSAL_INGREDIENTS.find(
  (ingredient) => ingredient.id === "cationic-polymer-emulsion",
);

assert.ok(row, "the existing cationic polymer catalog record must remain present");
assert.equal(row.inciName, "Polyquaternium-37");
assert.equal(row.casNumber, "26161-33-1");
assert.match(row.name, /Polyquaternium-37/i);

const wrongCasRows = UNIVERSAL_INGREDIENTS.filter(
  (ingredient) =>
    ingredient.inciName === "Polyquaternium-37" &&
    ingredient.casNumber === "9003-05-8",
);
assert.equal(wrongCasRows.length, 0, "Polyquaternium-37 must not be assigned polyacrylamide CAS");

console.log("PASS: Polyquaternium-37 identity uses CAS 26161-33-1; polyacrylamide CAS mismatch is blocked.");

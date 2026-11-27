import assert from "node:assert/strict";
import { UNIVERSAL_INGREDIENTS } from "../src/data/universalIngredientLibrary";

// CAS 37288-54-3 is mannan endo-1,4-beta-mannosidase (mannanase),
// EC 3.2.1.78. It is not an endoperoxidase.
// Sources: EFSA https://doi.org/10.2903/j.efsa.2022.7264
//          IUBMB https://iubmb.qmul.ac.uk/enzyme/EC3/2/1/78.html

const rows = UNIVERSAL_INGREDIENTS.filter(
  (ingredient) => ingredient.casNumber === "37288-54-3",
);

assert.equal(rows.length, 4, "all four commercial catalog variants must remain present");
assert.deepEqual(
  rows.map((ingredient) => ingredient.id).sort(),
  [
    "mannanase-liquid",
    "mannanase-liquid-pure",
    "mannanase-liquid-sol",
    "mannanase-liquid-tech",
  ],
);

for (const row of rows) {
  assert.equal(
    row.inciName,
    "Mannanase (Mannan endo-1,4-beta-mannosidase)",
    `${row.id} must use the accepted enzyme identity, not the erroneous endoperoxidase label`,
  );
  assert.match(row.name, /Mannanase/i);
}

console.log("PASS: 4 mannanase catalog variants use the corrected CAS-supported enzyme nomenclature.");

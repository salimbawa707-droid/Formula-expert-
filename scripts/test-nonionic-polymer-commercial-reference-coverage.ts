import assert from "node:assert/strict";
import { UNIVERSAL_INGREDIENTS } from "../src/data/universalIngredientLibrary";
import {
  NORMAL_COMMERCIAL_INGREDIENT_REFERENCES,
  getNormalCommercialIngredientReference,
} from "../src/data/normalCommercialIngredientReference";

const targetIngredients = UNIVERSAL_INGREDIENTS.filter((ingredient) =>
  ["Nonionic Surfactant", "Polymer & Thickener"].includes(ingredient.category),
);
const targetIds = targetIngredients.map((ingredient) => ingredient.id);
const profileIds = NORMAL_COMMERCIAL_INGREDIENT_REFERENCES.flatMap(
  (profile) => profile.catalogIngredientIds,
);

assert.equal(new Set(targetIds).size, targetIds.length, "catalog target IDs must be unique");
assert.equal(
  new Set(profileIds).size,
  profileIds.length,
  "a catalog ID must not be mapped by more than one reference profile",
);

const unmapped = targetIds.filter((id) => !getNormalCommercialIngredientReference(id));
assert.deepEqual(unmapped, [], "every nonionic/polymer catalog ingredient must have a reference or explicit hold profile");

for (const id of targetIds) {
  const profile = getNormalCommercialIngredientReference(id);
  assert.ok(profile, `missing reference profile for ${id}`);
  assert.equal(profile.supplierGradeStatus, "UNVERIFIED", `${id}: standard reference must not imply supplier verification`);
  assert.equal(profile.lotCoAStatus, "UNVERIFIED", `${id}: standard reference must not imply lot CoA verification`);
  assert.equal(profile.profileStatus, "NORMAL_COMMERCIAL_REFERENCE");
  assert.ok(profile.applicabilityNote.length > 30, `${id}: applicability boundary must be documented`);
  assert.ok(profile.sourceUrl.startsWith("https://"), `${id}: source/standard reference URL required`);
}

for (const id of [
  "np-6", "np-6-tech", "np-6-pure", "np-6-sol",
  "np-9", "np-9-tech", "np-9-pure", "np-9-sol",
  "np-10", "np-10-tech", "np-10-pure", "np-10-sol",
]) {
  const profile = getNormalCommercialIngredientReference(id);
  assert.ok(profile);
  assert.match(profile.applicabilityNote, /regulatory hold/i);
}

const tallow = getNormalCommercialIngredientReference("tallow-amine-oxide");
assert.ok(tallow);
assert.match(tallow.applicabilityNote, /identity.*corrected|identity.*conflict/i);

const pluronic = getNormalCommercialIngredientReference("pluronic-pe-6400");
assert.ok(pluronic);
assert.match(pluronic.applicabilityNote, /Poloxamer 184|generic CAS/i);

const pvno = getNormalCommercialIngredientReference("pvno-40");
assert.ok(pvno);
assert.match(pvno.applicabilityNote, /40%.*not supplier verification|40% is not supplier verification/i);

console.log(
  `PASS: ${targetIds.length} nonionic/polymer catalog IDs each resolve to exactly one evidence-bounded reference profile; supplier grade and lot CoA remain UNVERIFIED.`,
);

import assert from "node:assert/strict";
import { UNIVERSAL_INGREDIENTS } from "../src/data/universalIngredientLibrary";
import { listCommercialEvidenceProtocols, buildCommercialEvidenceProtocol } from "../src/data/commercialEvidenceProtocol";

const targets = UNIVERSAL_INGREDIENTS.filter((item) =>
  ["Nonionic Surfactant", "Polymer & Thickener"].includes(item.category),
);
const protocols = listCommercialEvidenceProtocols();
assert.equal(protocols.length, targets.length, "every target catalog ID must have one evidence protocol");
assert.equal(new Set(protocols.map((item) => item.catalogIngredientId)).size, targets.length, "protocol IDs must be unique");

for (const protocol of protocols) {
  assert.equal(protocol.referenceOnly, true);
  assert.equal(protocol.supplierTdsState, "NOT_PROVIDED");
  assert.equal(protocol.lotCoAState, "NOT_PROVIDED");
  assert.equal(protocol.applicabilityState, "NOT_TESTED");
  assert.equal(protocol.dossierState, "REFERENCE_ONLY_BLOCKED");
  assert.ok(protocol.supplierTdsRequiredFields.length >= 7);
  assert.ok(protocol.lotCoARequiredFields.length >= 7);
  assert.ok(protocol.incomingIdentityAndQualityChecks.length >= 2);
  assert.ok(protocol.formulaApplicabilityChecks.length >= 5);
  assert.match(protocol.releaseRule, /exact supplier-grade identity.*matching received-lot CoA.*named formula/i);
}
assert.equal(buildCommercialEvidenceProtocol("not-a-catalog-id"), null);

const np = buildCommercialEvidenceProtocol("np-9");
assert.ok(np);
assert.match(np.incomingIdentityAndQualityChecks.join(" "), /ethoxylate-number distribution/i);

const cationic = buildCommercialEvidenceProtocol("cationic-polymer-emulsion");
assert.ok(cationic);
assert.match(cationic.formulaApplicabilityChecks.join(" "), /anionic surfactant/i);

const cmc = buildCommercialEvidenceProtocol("cmc-technical");
assert.ok(cmc);
assert.match(cmc.incomingIdentityAndQualityChecks.join(" "), /degree of substitution/i);

console.log(`PASS: ${protocols.length}/${targets.length} catalog IDs have standardized fail-closed supplier TDS, lot CoA and formula-applicability dossiers.`);

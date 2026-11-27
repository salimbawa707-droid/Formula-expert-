/**
 * Standardized evidence dossier protocol for nonionic surfactants and polymers.
 *
 * This protocol normalizes what must be documented; it does NOT manufacture a
 * supplier TDS, lot CoA, laboratory result, or formula approval.
 */
import { UNIVERSAL_INGREDIENTS } from "./universalIngredientLibrary";
import { getNormalCommercialIngredientReference } from "./normalCommercialIngredientReference";

export type EvidenceDocumentState = "NOT_PROVIDED" | "RECEIVED_UNREVIEWED" | "REVIEWED_ACCEPTED" | "REJECTED";
export type FormulaApplicabilityState = "NOT_TESTED" | "SCREENING_ONLY" | "VALIDATED_FOR_NAMED_FORMULA" | "FAILED";

export interface EvidenceProtocol {
  catalogIngredientId: string;
  catalogName: string;
  referenceProfileName: string;
  referenceOnly: true;
  supplierTdsState: EvidenceDocumentState;
  lotCoAState: EvidenceDocumentState;
  applicabilityState: FormulaApplicabilityState;
  dossierState: "REFERENCE_ONLY_BLOCKED";
  supplierTdsRequiredFields: readonly string[];
  lotCoARequiredFields: readonly string[];
  incomingIdentityAndQualityChecks: readonly string[];
  formulaApplicabilityChecks: readonly string[];
  releaseRule: string;
}

const COMMON_TDS = [
  "Legal manufacturer and manufacturing site; exact trade name, product code and grade",
  "Document number, revision, issue date and superseded-document status",
  "Chemical identity (CAS/INCI where applicable), composition range and mixture/UVCB disclosure boundary",
  "As-supplied active matter or solids, water/moisture and assay basis",
  "Specified analytical methods, sample preparation, units and test conditions for every numeric property",
  "pH concentration/temperature, viscosity concentration/spindle/speed/temperature, and density temperature where applicable",
  "Storage, shelf life, packaging, handling, incompatibilities and SDS revision",
] as const;

const COMMON_COA = [
  "Supplier legal name, exact product code/grade, manufacturing site and unique lot/batch number",
  "Manufacture date, retest/expiry date, sampling date and CoA issue date",
  "Lot-specific results (not specification limits copied into result cells), units, method IDs and acceptance limits",
  "Active matter/solids assay and moisture/water on a stated as-supplied or dry basis",
  "Lot-specific identity/purity and relevant impurity results for the declared chemistry",
  "pH and viscosity with the exact concentration, temperature and instrument conditions when these are release attributes",
  "Authorized issuer/signature or verifiable electronic release record; deviations/OOS disposition",
] as const;

function familyRequirements(name: string, category: string) {
  const n = name.toLowerCase();
  const incoming = ["Verify label, seal, batch traceability, appearance, odour and packaging integrity; retain a sealed sample."];
  const applicability = [
    "Run a blank/control and at least three independently prepared replicate batches; record raw observations and variability.",
    "Test in the exact intended formula, dose, process order, water quality/hardness, pH, temperature and storage package.",
    "Record initial and aged appearance, phase separation, sediment, colour/odour drift, pH drift and viscosity/rheology drift.",
    "Predefine product-specific pass/fail limits before testing; do not invent universal acceptance limits after seeing results.",
    "Record cleaning/performance endpoint against a defined control at the intended use dilution; document method, soil/substrate, water hardness and replicate results.",
  ];

  if (/alcohol ethoxylate|lae-|nonylphenol|np-/.test(n)) {
    incoming.push("Confirm alcohol/alkylphenol chain distribution and ethoxylate-number distribution; do not infer EO distribution from a shorthand grade name.");
    incoming.push("Measure active matter/water and grade-relevant hydroxyl value, cloud point and pour/freezing behaviour using a stated validated method.");
    applicability.push("Map cloud point/phase behaviour across the actual formula concentration, electrolyte level and use-temperature window.");
  } else if (/alkyl polyglucoside|apg|glucoside/.test(n)) {
    incoming.push("Measure active matter, water, residual fatty alcohol and pH; record degree-of-polymerisation/chain-distribution information if supplier provides it.");
    applicability.push("Check viscosity, clarity and phase stability across target pH, salt/electrolyte and temperature conditions.");
  } else if (/cocamide|amide/.test(n)) {
    incoming.push("Measure active matter, free amine, residual amine/amide profile and nitrosamine-related controls appropriate to the product and jurisdiction.");
    applicability.push("Check pH-dependent viscosity/foam response and nitrosamine risk controls; no grade approval from nominal active percentage alone.");
  } else if (/amine oxide|lauryl amine/.test(n)) {
    incoming.push("Measure amine-oxide active matter, free amine, hydrogen peroxide where relevant to supplier specification, salt and pH.");
    applicability.push("Check compatibility and viscosity response with the exact anionic/nonionic blend and pH range.");
  } else if (/polysorbate|hydrogenated castor|peg-40/.test(n)) {
    incoming.push("Capture grade-relevant acid, hydroxyl, saponification and peroxide values where applicable, plus water and viscosity; method/basis must be stated.");
    applicability.push("Check solubilization capacity, clarity, oxidation/odour and phase stability at actual fragrance/oil load and storage temperature.");
  } else if (/xanthan|cmc|hpmc|carbomer|ase polymer|acrylate|polymer|pvno|pvp|peg-4000|thickener/.test(n) || category === "Polymer & Thickener") {
    incoming.push("Measure polymer solids/moisture and viscosity at stated concentration, hydration time, pH, temperature, spindle/geometry and shear rate; record mesh/particle size where relevant.");
    if (/cmc/.test(n)) incoming.push("Record degree of substitution, molecular-weight/viscosity grade and salt tolerance where supplied.");
    if (/hpmc/.test(n)) incoming.push("Record methoxy/hydroxypropyl substitution and viscosity grade with pharmacopeial/manufacturer test conditions.");
    if (/carbomer|ase|acrylate/.test(n)) incoming.push("Record polymer solids, neutralization response, ionic character and electrolyte sensitivity; do not transfer viscosity from a different polymer grade.");
    if (/cationic|polyquaternium|pvno/.test(n)) applicability.push("Run compatibility/precipitation/turbidity testing against the exact anionic surfactant system before any formula recommendation.");
    applicability.push("Hydrate/disperse using a recorded order of addition, shear, time and neutralization protocol; compare full rheology curve or a defined viscosity method, not a single unqualified cP value.");
  } else {
    incoming.push("Measure chemistry-specific assay, moisture, pH and impurities from the exact supplier specification; document method and basis.");
  }

  return { incoming, applicability };
}

export function buildCommercialEvidenceProtocol(catalogIngredientId: string): EvidenceProtocol | null {
  const ingredient = UNIVERSAL_INGREDIENTS.find((item) => item.id === catalogIngredientId);
  const profile = getNormalCommercialIngredientReference(catalogIngredientId);
  if (!ingredient || !profile) return null;
  const requirements = familyRequirements(profile.displayName || ingredient.name, ingredient.category);
  return {
    catalogIngredientId,
    catalogName: ingredient.name,
    referenceProfileName: profile.displayName,
    referenceOnly: true,
    supplierTdsState: "NOT_PROVIDED",
    lotCoAState: "NOT_PROVIDED",
    applicabilityState: "NOT_TESTED",
    dossierState: "REFERENCE_ONLY_BLOCKED",
    supplierTdsRequiredFields: COMMON_TDS,
    lotCoARequiredFields: COMMON_COA,
    incomingIdentityAndQualityChecks: requirements.incoming,
    formulaApplicabilityChecks: requirements.applicability,
    releaseRule: "Release only after exact supplier-grade identity/TDS review, matching received-lot CoA review, and documented validation in the named formula. Public reference values alone never satisfy these gates.",
  };
}

export function listCommercialEvidenceProtocols(): EvidenceProtocol[] {
  return UNIVERSAL_INGREDIENTS
    .filter((item) => ["Nonionic Surfactant", "Polymer & Thickener"].includes(item.category))
    .map((item) => buildCommercialEvidenceProtocol(item.id))
    .filter((item): item is EvidenceProtocol => item !== null);
}

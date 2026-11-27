import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';

export type FunctionalRoutingClass = 'ANIONIC' | 'AMPHOTERIC' | 'NONIONIC' | 'BLOCKED';
export type FunctionalRole =
  | 'PRIMARY_ANIONIC_SURFACTANT'
  | 'AMINE_OXIDE_SURFACTANT'
  | 'ZWITTERIONIC_BETAINE'
  | 'NONIONIC_APG'
  | 'NONIONIC_ALKANOLAMIDE'
  | 'POLYMERIC_DISPERSANT'
  | 'IDENTITY_UNRESOLVED';
export type ChargeBehavior =
  | 'FIXED_ANIONIC'
  | 'PH_DEPENDENT_ANIONIC'
  | 'ZWITTERIONIC'
  | 'PH_DEPENDENT_AMINE_OXIDE'
  | 'NEUTRAL_NONIONIC'
  | 'UNRESOLVED';

export interface FunctionalRoutingDecision {
  ingredientIds: string[];
  expectedCategory: string;
  expectedInci: string;
  routingClass: FunctionalRoutingClass;
  role: FunctionalRole;
  chargeBehavior: ChargeBehavior;
  activeMatterEligible: boolean;
  hlbEligible: boolean;
  pureComponentCmcEligible: boolean;
  identityScope: string;
  sourceUrls: string[];
  caveats: string[];
}

const DECISIONS: FunctionalRoutingDecision[] = [
  {
    ingredientIds: ['sls-needles','sls-30','sls-needles-tech','sls-needles-pure','sls-needles-sol','sls-30-tech','sls-30-pure','sls-30-sol'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium Lauryl Sulfate',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'FIXED_ANIONIC',
    activeMatterEligible: true, hlbEligible: true, pureComponentCmcEligible: true,
    identityScope: 'CAS 151-21-3 supports sodium dodecyl sulfate chemical identity, not needle/paste/solution grade, assay or lot.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/3423265','https://echa.europa.eu/substance-information/-/substanceinfo/100.005.263'],
    caveats: ['Davies-scale catalog HLB is a screening reference, not a supplier-grade measured property.', 'Supplier TDS and matching lot CoA are still required for grade assay.', 'Pure-component CMC is not transferable to unidentified blends or UVCBs.']
  },
  {
    ingredientIds: ['sles-70','sles-28'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium Laureth Sulfate',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'FIXED_ANIONIC',
    activeMatterEligible: true, hlbEligible: true, pureComponentCmcEligible: false,
    identityScope: 'INCI and CAS 68585-34-2 identify the sodium laureth sulfate commercial surfactant family; the 70% paste and 28% liquid are distinct supplied grades, not one assay.',
    sourceUrls: ['https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=448&lang=eng&wbdisable=true','https://pubchem.ncbi.nlm.nih.gov/compound/23665884'],
    caveats: ['Davies HLB 40 is a screening-model value only, not a supplier-grade measured property.', 'Public chemical identity does not verify either catalog grade concentration, EO distribution, residual 1,4-dioxane or lot assay.', 'Do not assign pure-molecule CMC to commercial ethoxylate distributions.']
  },
  {
    ingredientIds: ['sarcosinate-30'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium Lauroyl Sarcosinate',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'PH_DEPENDENT_ANIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 137-16-6 and PubChem identity support sodium N-lauroylsarcosinate. The catalog 30% liquid remains a commercial solution, not pure sodium lauroylsarcosinate.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/23668817','https://pubchem.ncbi.nlm.nih.gov/substance/134973572'],
    caveats: ['Sarcosinate ionization is pH-dependent; anionic routing is the standard alkaline/neutral detergent-family classification, not a claim of invariant charge at all pH.', 'Catalog 30% activeDefault is not supplier assay or lot CoA.', 'Do not transfer pure-component CMC or catalog HLB without validated method and exact grade evidence.', 'CIR cautions against nitrosating systems for cosmetic-use contexts; review applicable home-care regulatory requirements separately.']
  },
  {
    ingredientIds: ['sas-60'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium C14-17 Sec-Alkyl Sulfonate',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'FIXED_ANIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 68037-49-0 and INCI support a secondary C14-17 alkyl sulfonate family within the broader C10-18 alkane sodium sulfonate UVCB family.',
    sourceUrls: ['https://echa.europa.eu/substance-information/-/substanceinfo/100.061.994','https://kcia.or.kr/cid/search/ingd_view.php?no=18412','https://www.industrialchemicals.gov.au/sites/default/files/Secondary%20alkane%20sulfonates%20%28SAS%29_Human%20health%20tier%20II%20assessment.pdf'],
    caveats: ['The catalog 60% grade is not verified by supplier TDS or lot CoA.', 'CAS 68037-49-0 has broad C10-18 registry scope; do not infer exact C14-17 chain distribution from CAS alone.', 'Catalog HLB 13.0 and pure-component CMC are not supported for this UVCB mixture.']
  },
  {
    ingredientIds: ['cdea-85'],
    expectedCategory: 'Nonionic Surfactant', expectedInci: 'Cocamide DEA',
    routingClass: 'NONIONIC', role: 'NONIONIC_ALKANOLAMIDE', chargeBehavior: 'NEUTRAL_NONIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 68603-42-9 and INCI support the coconut fatty-acid diethanolamide family; this is a fatty-chain mixture, not a single pure molecular species.',
    sourceUrls: ['https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=3341&wbdisable=true','https://www.industrialchemicals.gov.au/sites/default/files/Common%20skin%20sensitisers.pdf'],
    caveats: ['85% is a catalog grade claim, not a supplier assay or matching lot CoA.', 'Supplier evidence should specify free DEA/secondary amine, nitrosamine and residual specifications.', 'Avoid N-nitrosating systems; public topical-use restrictions are not a substitute for jurisdiction-specific home-care regulatory review.', 'Catalog HLB and pure-component CMC are not grade-verified.']
  },
  {
    ingredientIds: ['cmea-90'],
    expectedCategory: 'Nonionic Surfactant', expectedInci: 'Cocamide MEA',
    routingClass: 'NONIONIC', role: 'NONIONIC_ALKANOLAMIDE', chargeBehavior: 'NEUTRAL_NONIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 68140-00-1 and INCI support coconut fatty-acid monoethanolamide; authoritative assessment describes it as a C8-18 UVCB mixture.',
    sourceUrls: ['https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=3342','https://www.canada.ca/en/environment-climate-change/services/evaluating-existing-substances/assessment-alkanolamines-fatty-alkanolamides-group.html','https://journals.sagepub.com/doi/abs/10.1177/1091581815586599'],
    caveats: ['90% is a catalog grade claim, not a supplier assay or matching lot CoA.', 'Supplier evidence should define free MEA/secondary amine and nitrosamine-related impurities.', 'Avoid N-nitrosating systems and aerosolization as applicable to the source restrictions and local product category.', 'Catalog HLB and pure-component CMC are not grade-verified.']
  },
  {
    ingredientIds: ['aos-38','aos-92'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium C14-16 Olefin Sulfonate',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'FIXED_ANIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 68439-57-6 and INCI identify the sodium C14-16 olefin sulfonate UVCB family: a mixture of alkene sulfonates and hydroxyalkane sulfonates, not one discrete pure molecule.',
    sourceUrls: ['https://www.canada.ca/en/environment-climate-change/services/evaluating-existing-substances/screening-assessment-alkyl-sulfatesa-olefin-sulfonate-group-chemical-abstracts-service-registry-numbers-139.html','https://precision.fda.gov/uniisearch/srs/unii/O9W3D3YF5U','https://echa.europa.eu/es/substance-information/-/substanceinfo/100.158.197'],
    caveats: ['38% liquid and 92% powder are separate catalog commercial grade claims; supplier TDS and matching lot CoA are not provided.', 'Do not transfer pure-molecule CMC to the UVCB distribution.', 'Catalog HLB 12.0 is not a supported Davies-scale value for this UVCB and is blocked.', 'AOS composition includes sulfonate/hydroxyalkane distribution and possible sulfate/salt/water fractions; actual assay and impurities require supplier evidence.']
  },
  {
    ingredientIds: ['capb-30-uni','capb-45'],
    expectedCategory: 'Amphoteric Surfactant', expectedInci: 'Cocamidopropyl Betaine',
    routingClass: 'AMPHOTERIC', role: 'ZWITTERIONIC_BETAINE', chargeBehavior: 'ZWITTERIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 61789-40-0 and INCI support the cocamidopropyl betaine family; coconut fatty-acyl distribution makes the commercial ingredient a mixture, not a single pure chain species.',
    sourceUrls: ['https://journals.sagepub.com/doi/full/10.1177/1091581812447202','https://pubchem.ncbi.nlm.nih.gov/substance/135610782'],
    caveats: ['30% and 45% are catalog grade labels only until supplier TDS and lot CoA are verified.', 'Do not transfer pure-component CMC or unverified HLB to commercial CAPB blends.', 'Free amidoamine, DMAPA and residuals require grade-specific documentation.']
  },
  {
    ingredientIds: ['lauryl-amine-oxide','lauryl-amine-oxide-tech','lauryl-amine-oxide-pure','lauryl-amine-oxide-sol'],
    expectedCategory: 'Nonionic Surfactant', expectedInci: 'Lauramine Oxide',
    routingClass: 'AMPHOTERIC', role: 'AMINE_OXIDE_SURFACTANT', chargeBehavior: 'PH_DEPENDENT_AMINE_OXIDE',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 1643-20-5 supports Lauramine Oxide family identity. Manufacturer TDS describes the material as nonionic/cationic depending on pH; this is not a conventional zwitterionic betaine.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/15433','https://www.kaochemicals-eu.com/uploads/docs/6/y/k/mja-tds-eng-v2-oxidet-dm-20.pdf?download=1'],
    caveats: ['Do not describe amine oxide as a fixed amphoteric/zwitterionic charge across pH.', 'Kao OXIDET DM-20 TDS is a different named commercial grade and is reference evidence only, not evidence for the user supplier grade.', 'Do not use pure C12 DDAO CMC for unspecified C12-14 commercial blend.']
  },
  {
    ingredientIds: ['apg-0810'],
    expectedCategory: 'Nonionic Surfactant', expectedInci: 'Caprylyl/Capryl Glucoside',
    routingClass: 'NONIONIC', role: 'NONIONIC_APG', chargeBehavior: 'NEUTRAL_NONIONIC',
    activeMatterEligible: true, hlbEligible: true, pureComponentCmcEligible: false,
    identityScope: 'CAS 68515-73-1 and INCI identify caprylyl/capryl oligoglucoside family; FDA GSRS/PubChem substance record explicitly describes it as a mixture.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/substance/472402409','https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=13217&wbdisable=true'],
    caveats: ['Catalog HLB is a screening estimate only; it is not grade-verified or a supplier measured value.', 'Catalog 50% activeDefault is not supplier assay or lot CoA.', 'Mixture/oligomer distribution is not a pure single-molecule CMC reference.']
  },
  {
    ingredientIds: ['apg-1214'],
    expectedCategory: 'Nonionic Surfactant', expectedInci: 'Lauryl Glucoside',
    routingClass: 'NONIONIC', role: 'NONIONIC_APG', chargeBehavior: 'NEUTRAL_NONIONIC',
    activeMatterEligible: true, hlbEligible: true, pureComponentCmcEligible: false,
    identityScope: 'INCI supports the alkyl glucoside nonionic family, but PubChem aggregates multiple CAS identifiers for Lauryl Glucoside; exact catalog CAS 110615-47-9 and commercial C12-C14 APG composition are not uniquely reconciled.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/10893439','https://pubchem.ncbi.nlm.nih.gov/compound/Lauryl-Glucoside'],
    caveats: ['Nonionic family routing is supported by INCI; exact CAS-to-commercial-grade crosswalk remains unresolved.', 'Catalog HLB 12.5 is a screening estimate only; catalog 50% activeDefault and HLB are not supplier-verified.', 'Do not use pure dodecyl glucoside constants for a C12-C14 oligoglucoside commercial blend.']
  },
  {
    ingredientIds: ['lignosulfonate-na'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium Lignosulfonate',
    routingClass: 'ANIONIC', role: 'POLYMERIC_DISPERSANT', chargeBehavior: 'FIXED_ANIONIC',
    activeMatterEligible: false, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'Public industrial references support sodium lignosulfonate as a lignin-derived anionic dispersant/binder family, not conventional primary detergent surfactant active.',
    sourceUrls: ['https://www.lignincorp.com/products/sodium-lignosulfonate/'],
    caveats: ['Anionic charge can matter in polymer/cationic interaction screening, but do not count it as primary surfactant active.', 'Catalog activeDefault and HLB are not supplier-verified.', 'No detergent dose/performance claim is established.']
  },
  {
    ingredientIds: ['labsa-90', 'labsa-96'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Dodecylbenzene Sulfonic Acid',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'PH_DEPENDENT_ANIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'Exact catalog CAS 27176-87-0 and INCI Dodecylbenzene Sulfonic Acid crosswalk to the SSOT LABSA identity. The acid precursor is neutralized in use; ionic surfactant state is therefore pH/speciation dependent.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/27176-87-0'],
    caveats: ['LABSA 90% and 96% are separate commercial grade labels; neither is supplier/lot verified by this identity route.', 'Active-matter input must come from the actual grade assay; this route does not certify the catalog default.', 'Do not assign pure-component CMC or supplier-grade HLB from this identity mapping.', 'Use formula pH/neutralization state for charge-dependent compatibility; do not treat acid-form LABSA as invariant fixed anionic species.']
  },
  {
    ingredientIds: ['tallow-amine-oxide'],
    expectedCategory: 'Polymer & Thickener', expectedInci: 'PEG-2 Tallow Amine',
    routingClass: 'BLOCKED', role: 'IDENTITY_UNRESOLVED', chargeBehavior: 'UNRESOLVED',
    activeMatterEligible: false, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'Catalog display name/function conflicts with INCI and CAS family; exact product identity is unresolved.',
    sourceUrls: [],
    caveats: ['Block formula recommendation, compatibility and property-model routing until exact manufacturer product code and composition are reconciled.']
  }
];

export function getFunctionalRoutingDecisions(): FunctionalRoutingDecision[] {
  return DECISIONS.map(item => ({ ...item, ingredientIds: [...item.ingredientIds], sourceUrls: [...item.sourceUrls], caveats: [...item.caveats] }));
}
export function resolveFunctionalRouting(ingredientId: string): FunctionalRoutingDecision | null {
  const found = DECISIONS.find(item => item.ingredientIds.includes(ingredientId));
  return found ? { ...found, ingredientIds: [...found.ingredientIds], sourceUrls: [...found.sourceUrls], caveats: [...found.caveats] } : null;
}
export function resolveFunctionalRoutingForIngredient(input: { id?: unknown; canonicalIngredientId?: unknown; ingredientId?: unknown; name?: unknown }): FunctionalRoutingDecision | null {
  const suppliedId = String(input.canonicalIngredientId || input.ingredientId || input.id || '').trim();
  const byId = suppliedId ? resolveFunctionalRouting(suppliedId) : null;
  if (byId) return byId;
  const suppliedName = String(input.name || '').trim().toLowerCase();
  if (!suppliedName) return null;
  const exactCatalogRecord = UNIVERSAL_INGREDIENTS.find(item => item.name.trim().toLowerCase() === suppliedName);
  return exactCatalogRecord ? resolveFunctionalRouting(exactCatalogRecord.id) : null;
}

export function resolveFormulaIntelligenceRouting(ingredientId: string) {
  const route = resolveFunctionalRouting(ingredientId);
  if (!route) return null;
  const chargeLabel = route.role === 'IDENTITY_UNRESOLVED' ? 'Unresolved — blocked'
    : route.chargeBehavior === 'PH_DEPENDENT_AMINE_OXIDE' ? 'Amine Oxide (pH-dependent)'
    : route.chargeBehavior === 'PH_DEPENDENT_ANIONIC' ? 'Anionic (pH-dependent)'
    : route.routingClass === 'ANIONIC' ? 'Anionic'
    : route.routingClass === 'AMPHOTERIC' ? 'Amphoteric'
    : route.routingClass === 'NONIONIC' ? 'Nonionic' : 'Unresolved — blocked';
  return { chargeLabel, familyLabel: route.role === 'IDENTITY_UNRESOLVED' ? 'Identity unresolved' : route.role === 'AMINE_OXIDE_SURFACTANT' ? 'Amine Oxide (pH-dependent)' : route.role.replace(/_/g, ' '), hlbEligible: route.hlbEligible, identityBlocked: route.role === 'IDENTITY_UNRESOLVED', route };
}
export function validateFunctionalRoutingAgainstCatalog(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const decision of DECISIONS) for (const id of decision.ingredientIds) {
    if (seen.has(id)) errors.push('duplicate functional routing ID: ' + id);
    seen.add(id);
    const record = UNIVERSAL_INGREDIENTS.find(item => item.id === id);
    if (!record) { errors.push('missing catalog record: ' + id); continue; }
    if (record.category !== decision.expectedCategory) errors.push('category drift: ' + id);
    if (record.inciName !== decision.expectedInci) errors.push('INCI drift: ' + id);
    if (decision.routingClass === 'BLOCKED' && (decision.activeMatterEligible || decision.hlbEligible || decision.pureComponentCmcEligible)) errors.push('blocked identity has enabled property model: ' + id);
    if (decision.role === 'POLYMERIC_DISPERSANT' && decision.activeMatterEligible) errors.push('polymeric dispersant incorrectly eligible as detergent active: ' + id);
  }
  return errors;
}

import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';

export type FunctionalRoutingClass = 'ANIONIC' | 'AMPHOTERIC' | 'NONIONIC' | 'BLOCKED';
export type FunctionalRole =
  | 'PRIMARY_ANIONIC_SURFACTANT'
  | 'AMINE_OXIDE_SURFACTANT'
  | 'ZWITTERIONIC_BETAINE'
  | 'NONIONIC_APG'
  | 'POLYMERIC_DISPERSANT'
  | 'IDENTITY_UNRESOLVED';
export type ChargeBehavior =
  | 'FIXED_ANIONIC'
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
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: true,
    identityScope: 'CAS 151-21-3 supports sodium dodecyl sulfate chemical identity, not needle/paste/solution grade, assay or lot.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/3423265','https://echa.europa.eu/substance-information/-/substanceinfo/100.005.263'],
    caveats: ['Supplier TDS and matching lot CoA are still required for grade assay.', 'Pure-component CMC is not transferable to unidentified blends or UVCBs.', 'HLB is not an appropriate default property for this ionic surfactant.']
  },
  {
    ingredientIds: ['sles-70','sles-28'],
    expectedCategory: 'Anionic Surfactant', expectedInci: 'Sodium Laureth Sulfate',
    routingClass: 'ANIONIC', role: 'PRIMARY_ANIONIC_SURFACTANT', chargeBehavior: 'FIXED_ANIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'INCI and CAS 68585-34-2 identify the sodium laureth sulfate commercial surfactant family; the 70% paste and 28% liquid are distinct supplied grades, not one assay.',
    sourceUrls: ['https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=448&lang=eng&wbdisable=true','https://pubchem.ncbi.nlm.nih.gov/compound/23665884'],
    caveats: ['Public chemical identity does not verify either catalog grade concentration, EO distribution, residual 1,4-dioxane or lot assay.', 'Do not assign pure-molecule CMC or HLB to commercial ethoxylate distributions.']
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
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'CAS 68515-73-1 and INCI identify caprylyl/capryl oligoglucoside family; FDA GSRS/PubChem substance record explicitly describes it as a mixture.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/substance/472402409','https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=13217&wbdisable=true'],
    caveats: ['Catalog 50% activeDefault is not supplier assay or lot CoA.', 'Mixture/oligomer distribution is not a pure single-molecule CMC reference.', 'Catalog HLB is not grade-verified.']
  },
  {
    ingredientIds: ['apg-1214'],
    expectedCategory: 'Nonionic Surfactant', expectedInci: 'Lauryl Glucoside',
    routingClass: 'NONIONIC', role: 'NONIONIC_APG', chargeBehavior: 'NEUTRAL_NONIONIC',
    activeMatterEligible: true, hlbEligible: false, pureComponentCmcEligible: false,
    identityScope: 'INCI supports the alkyl glucoside nonionic family, but PubChem aggregates multiple CAS identifiers for Lauryl Glucoside; exact catalog CAS 110615-47-9 and commercial C12-C14 APG composition are not uniquely reconciled.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/10893439','https://pubchem.ncbi.nlm.nih.gov/compound/Lauryl-Glucoside'],
    caveats: ['Nonionic family routing is supported by INCI; exact CAS-to-commercial-grade crosswalk remains unresolved.', 'Catalog 50% activeDefault and HLB are not supplier-verified.', 'Do not use pure dodecyl glucoside constants for a C12-C14 oligoglucoside commercial blend.']
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

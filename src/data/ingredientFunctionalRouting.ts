import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';

export type FunctionalRoutingClass = 'ANIONIC' | 'AMPHOTERIC' | 'BLOCKED';
export type FunctionalRole = 'PRIMARY_ANIONIC_SURFACTANT' | 'AMINE_OXIDE_SURFACTANT' | 'POLYMERIC_DISPERSANT' | 'IDENTITY_UNRESOLVED';

export interface FunctionalRoutingDecision {
  ingredientIds: string[];
  expectedCategory: string;
  expectedInci: string;
  routingClass: FunctionalRoutingClass;
  role: FunctionalRole;
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
    expectedCategory: 'Anionic Surfactant',
    expectedInci: 'Sodium Lauryl Sulfate',
    routingClass: 'ANIONIC',
    role: 'PRIMARY_ANIONIC_SURFACTANT',
    activeMatterEligible: true,
    hlbEligible: false,
    pureComponentCmcEligible: true,
    identityScope: 'CAS 151-21-3 supports sodium dodecyl sulfate chemical identity. It does not verify needle/paste form, commercial grade, assay, active matter, impurity profile or lot.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/3423265','https://echa.europa.eu/substance-information/-/substanceinfo/100.005.263'],
    caveats: ['Active matter must come from supplier TDS and matching lot CoA; catalog activeDefault is not an assay.', 'Pure-component CMC is a reference value only and must not be assigned to an unidentified mixture or UVCB.', 'HLB is not an appropriate default routing property for this ionic surfactant.']
  },
  {
    ingredientIds: ['lauryl-amine-oxide','lauryl-amine-oxide-tech','lauryl-amine-oxide-pure','lauryl-amine-oxide-sol'],
    expectedCategory: 'Nonionic Surfactant',
    expectedInci: 'Lauramine Oxide',
    routingClass: 'AMPHOTERIC',
    role: 'AMINE_OXIDE_SURFACTANT',
    activeMatterEligible: true,
    hlbEligible: false,
    pureComponentCmcEligible: false,
    identityScope: 'CAS 1643-20-5 supports a C12 amine-oxide family identity; a commercial C12-14 Lauramine Oxide grade is not automatically the pure C12 dimethyldodecylamine oxide reference.',
    sourceUrls: ['https://pubchem.ncbi.nlm.nih.gov/compound/15433','https://www.epa.govt.nz/database-search/chemical-classification-and-information-database-ccid/view/4870BB95-03BD-402C-AF97-A674F93F773A/','https://www.legislation.gov.uk/eudn/1996/335/pdfs/eudn_19960335_2006-02-09_en.pdf'],
    caveats: ['Amine oxide charge behaviour is pH-dependent; route to amphoteric/amine-oxide chemistry, not generic nonionic compatibility.', 'Do not use a pure C12 DDAO CMC for a broad commercial blend without exact composition evidence.', 'No catalog activeDefault, HLB or supplier grade is verified by these identity sources.']
  },
  {
    ingredientIds: ['lignosulfonate-na'],
    expectedCategory: 'Anionic Surfactant',
    expectedInci: 'Sodium Lignosulfonate',
    routingClass: 'ANIONIC',
    role: 'POLYMERIC_DISPERSANT',
    activeMatterEligible: false,
    hlbEligible: false,
    pureComponentCmcEligible: false,
    identityScope: 'Public industrial references support sodium lignosulfonate as a lignin-derived dispersant/binder family; they do not verify the catalog commercial grade or detergent surfactant active matter.',
    sourceUrls: ['https://www.lignincorp.com/products/sodium-lignosulfonate/'],
    caveats: ['Anionic charge does not make this a conventional primary detergent surfactant.', 'Do not count activeDefault as surfactant active matter.', 'Do not use HLB or pure-surfactant CMC models for this polymeric dispersant.']
  },
  {
    ingredientIds: ['tallow-amine-oxide'],
    expectedCategory: 'Polymer & Thickener',
    expectedInci: 'PEG-2 Tallow Amine',
    routingClass: 'BLOCKED',
    role: 'IDENTITY_UNRESOLVED',
    activeMatterEligible: false,
    hlbEligible: false,
    pureComponentCmcEligible: false,
    identityScope: 'Catalog display name/function conflicts with INCI and CAS family; exact product identity is unresolved.',
    sourceUrls: [],
    caveats: ['Block all formula recommendation, compatibility and property-model routing until exact manufacturer product code and composition are reconciled.', 'Do not infer amine oxide or polymer identity from the current record.']
  }
];

export function getFunctionalRoutingDecisions(): FunctionalRoutingDecision[] {
  return DECISIONS.map(item => ({ ...item, ingredientIds: [...item.ingredientIds], sourceUrls: [...item.sourceUrls], caveats: [...item.caveats] }));
}

export function resolveFunctionalRouting(ingredientId: string): FunctionalRoutingDecision | null {
  const found = DECISIONS.find(item => item.ingredientIds.includes(ingredientId));
  return found ? { ...found, ingredientIds: [...found.ingredientIds], sourceUrls: [...found.sourceUrls], caveats: [...found.caveats] } : null;
}

export function validateFunctionalRoutingAgainstCatalog(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const decision of DECISIONS) {
    for (const id of decision.ingredientIds) {
      if (seen.has(id)) errors.push('duplicate functional routing ID: ' + id);
      seen.add(id);
      const record = UNIVERSAL_INGREDIENTS.find(item => item.id === id);
      if (!record) { errors.push('missing catalog record: ' + id); continue; }
      if (record.category !== decision.expectedCategory) errors.push('category drift: ' + id);
      if (record.inciName !== decision.expectedInci) errors.push('INCI drift: ' + id);
      if (decision.routingClass === 'BLOCKED' && (decision.activeMatterEligible || decision.hlbEligible || decision.pureComponentCmcEligible)) errors.push('blocked identity has enabled property model: ' + id);
      if (decision.role === 'POLYMERIC_DISPERSANT' && decision.activeMatterEligible) errors.push('polymeric dispersant incorrectly eligible as detergent active: ' + id);
    }
  }
  return errors;
}

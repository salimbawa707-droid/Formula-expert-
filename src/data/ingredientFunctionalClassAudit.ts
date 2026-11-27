import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';

export type FunctionalClassAuditDisposition = 'FUNCTIONAL_SUBCLASS_REQUIRED' | 'TAXONOMY_REVIEW_REQUIRED' | 'IDENTITY_CONFLICT_BLOCKED';
export interface FunctionalClassAuditRow {
  ingredientId: string;
  expectedCatalogCategory: string;
  expectedInci: string;
  disposition: FunctionalClassAuditDisposition;
  functionalRole: string;
  risk: string;
  doNotInfer: string[];
  sourceScope: string;
  approvalState: 'NOT_APPROVED';
}

const AUDIT_ROWS: FunctionalClassAuditRow[] = [
  {
    ingredientId: 'lignosulfonate-na',
    expectedCatalogCategory: 'Anionic Surfactant',
    expectedInci: 'Sodium Lignosulfonate',
    disposition: 'FUNCTIONAL_SUBCLASS_REQUIRED',
    functionalRole: 'Anionic lignin-based polymeric dispersant / binder; surface activity does not make its performance interchangeable with conventional low-molecular-weight detergent surfactants.',
    risk: 'Treating it as a conventional primary surfactant can distort active-matter accounting, HLB interpretation, foam expectations and cleaning-performance predictions.',
    doNotInfer: ['activeDefault 95 is not a supplier assay or surfactant active matter', 'catalog HLB 10 is not a verified grade property', 'industrial dispersant/binder literature does not establish a detergent dose or laundry cleaning efficacy', 'do not overwrite the broad category until downstream consumers are migrated and tested'],
    sourceScope: 'Public industrial literature supports dispersant/binder and polymeric roles for some grades; it does not establish this catalog record commercial grade or laundry applicability.',
    approvalState: 'NOT_APPROVED'
  },
  {
    ingredientId: 'lauryl-amine-oxide',
    expectedCatalogCategory: 'Nonionic Surfactant',
    expectedInci: 'Lauramine Oxide',
    disposition: 'TAXONOMY_REVIEW_REQUIRED',
    functionalRole: 'Amine-oxide surfactant; often grouped commercially with amphoteric surfactants, while detailed ionic behaviour and supplier taxonomy may depend on pH and classification convention.',
    risk: 'A hard-coded nonionic label may misroute ionic compatibility rules, especially in acidic systems and mixed anionic/cationic formulations.',
    doNotInfer: ['do not silently relabel the canonical category as amphoteric without auditing all category-dependent engines and selectors', 'generic amine-oxide family identity does not prove a specific supplier grade or active concentration', 'do not infer compatibility solely from catalog HLB or activeDefault'],
    sourceScope: 'Public chemical and regulatory records establish lauramine oxide identity and surfactant functions; supplier literature also places amine oxides in amphoteric surfactant ranges. The current catalog taxonomy needs a deliberate cross-engine decision.',
    approvalState: 'NOT_APPROVED'
  },
  {
    ingredientId: 'tallow-amine-oxide',
    expectedCatalogCategory: 'Polymer & Thickener',
    expectedInci: 'PEG-2 Tallow Amine',
    disposition: 'IDENTITY_CONFLICT_BLOCKED',
    functionalRole: 'Unresolved identity: display name/function claims an amine-oxide acid thickener, while INCI/catalog CAS point to PEG-2 tallow amine / ethoxylated amine family.',
    risk: 'Incorrectly treating an ethoxylated amine as an amine oxide or polymer can corrupt acid-thickening logic, charge compatibility, safety classification and formula recommendations.',
    doNotInfer: ['do not classify as an amine oxide', 'do not classify as a polymer solely because the catalog category says Polymer & Thickener', 'do not use in formula recommendations until exact manufacturer product code, composition and identity are reconciled'],
    sourceScope: 'The catalog itself contains an internal name/INCI/function conflict. Generic CAS 61791-26-2 does not resolve the exact commercial substance or grade.',
    approvalState: 'NOT_APPROVED'
  }
];

export function getFunctionalClassAuditRows(): FunctionalClassAuditRow[] {
  return AUDIT_ROWS.map(row => ({ ...row, doNotInfer: [...row.doNotInfer] }));
}
export function getFunctionalClassAuditRow(ingredientId: string): FunctionalClassAuditRow | null {
  const row = AUDIT_ROWS.find(item => item.ingredientId === ingredientId);
  return row ? { ...row, doNotInfer: [...row.doNotInfer] } : null;
}
export function validateFunctionalClassAuditAgainstCatalog(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const row of AUDIT_ROWS) {
    if (ids.has(row.ingredientId)) errors.push('duplicate audit ingredient: ' + row.ingredientId);
    ids.add(row.ingredientId);
    const ingredient = UNIVERSAL_INGREDIENTS.find(item => item.id === row.ingredientId);
    if (!ingredient) { errors.push('missing catalog ingredient: ' + row.ingredientId); continue; }
    if (ingredient.category !== row.expectedCatalogCategory) errors.push('catalog category changed for ' + row.ingredientId);
    if (ingredient.inciName !== row.expectedInci) errors.push('catalog INCI changed for ' + row.ingredientId);
    if (row.approvalState !== 'NOT_APPROVED') errors.push('unsafe promotion for ' + row.ingredientId);
    if (!row.doNotInfer.length) errors.push('missing non-inference controls for ' + row.ingredientId);
  }
  return errors;
}

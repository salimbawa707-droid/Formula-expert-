import type { ProductCategoryId } from '../domain/productTaxonomy';
import type { ApplicabilityReviewDecision } from './ingredientApplicabilityReviewMatrix';

/**
 * First evidence-reviewed batch: liquid laundry surfactant raw materials.
 * Scope is limited to catalog grades with identifiable LAS/SLES chemistry.
 * Literature formulation examples are not universal safe-use limits.
 */
export interface IngredientEvidenceReview {
  ingredientId: string;
  productCategoryId: ProductCategoryId;
  decision: ApplicabilityReviewDecision;
  chemicalRole: string;
  compatibilityMechanism: string;
  concentrationFinding: string;
  pHFinding: string;
  incompatibilityRisks: string[];
  evidence: { title: string; url: string; evidenceType: 'SUPPLIER_TDS' | 'TECHNICAL_GUIDANCE' | 'FORMULATION_EXAMPLE' }[];
  limitations: string[];
}

const laundryLiquidSurfactantReviews: IngredientEvidenceReview[] = [
  {
    ingredientId: 'labsa-96',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Strong-acid anionic sulfonic acid precursor; after controlled neutralization, provides linear alkylbenzene sulfonate (LAS) primary detergency.',
    compatibilityMechanism: 'Neutralized LAS provides anionic detergency, wetting and soil emulsification in aqueous laundry liquids. The free acid itself is not the finished-product surfactant state; neutralization demand and final pH must be calculated from the lot assay and acid value.',
    concentrationFinding: 'Catalog activeDefault 96% is a commercial-grade default, not a verified lot assay. A published supplier formulation example lists 3–6.2% LABSA 96% in a liquid laundry detergent, but this is an example formula, not a validated minimum/maximum or universal recommendation. No approved use limit assigned.',
    pHFinding: 'The catalog target pH for LAUNDRY_LIQUID is 7.5–9.5. This is a finished-product target, not a raw LABSA stability range. Free LABSA must be neutralized; finished pH and residual free acidity must be verified.',
    incompatibilityRisks: ['Unneutralized acid can create corrosive/irritant product and destabilize the blend.', 'Rapid caustic addition is exothermic and can cause local overheating/viscosity spikes.', 'Anionic LAS is incompatible with cationic fabric-softener systems.', 'Electrolyte and nonionic balance can affect phase stability and viscosity.'],
    evidence: [
      { title: 'Hydum LABSA 96.5 technical data sheet', url: 'https://hydum.ru/wp-content/uploads/2022/12/labsa-97-tds-hydum-1.0.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Elchemy LABSA 96 liquid laundry formulation example', url: 'https://elchemy.com/product/labsa-96-433', evidenceType: 'FORMULATION_EXAMPLE' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['Supplier TDS and CoA for the actual lot are required.', 'Neutralization calculation must use actual acid value/assay; no fixed NaOH dose is approved.', 'Finished-formula stability, detergency, fabric compatibility and preservation remain untested.']
  },
  {
    ingredientId: 'labsa-90',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Strong-acid anionic sulfonic acid precursor; neutralization yields LAS anionic surfactant.',
    compatibilityMechanism: 'Same LAS mechanism as higher-active LABSA grade, but delivered active matter and neutralization demand differ. Formulation must normalize on actual assay rather than assume equivalence by weight.',
    concentrationFinding: 'Catalog activeDefault 90% is a nominal commercial-grade value, not a lot CoA. No supplier-grade-specific maximum/minimum use level verified for this exact catalog grade; do not copy the LABSA 96 example directly without active-matter and acid-value correction.',
    pHFinding: 'Finished category target is 7.5–9.5; this is not a raw-material pH limit. Neutralize based on actual acidity and verify finished pH.',
    incompatibilityRisks: ['Residual free acid/corrosive risk if neutralization is incomplete.', 'Exothermic neutralization and local high-pH zones if caustic is dosed too quickly.', 'Anionic/cationic incompatibility.', 'Electrolyte-induced phase and viscosity changes.'],
    evidence: [
      { title: 'Hydum LABSA 96.5 technical data sheet', url: 'https://hydum.ru/wp-content/uploads/2022/12/labsa-97-tds-hydum-1.0.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['No exact 90% grade TDS/CoA attached to this catalog record.', 'Assay, acid value, free sulfuric acid and moisture must be verified per lot.', 'No numeric permitted-use range approved.']
  },
  {
    ingredientId: 'sles-70',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'APPLICABLE',
    chemicalRole: 'High-foaming anionic ether sulfate surfactant; primary/co-primary cleanser, wetting and foam contributor.',
    compatibilityMechanism: 'Supplier TDS identifies SLES as an anionic surfactant with cleaning, emulsifying, wetting and foaming performance and lists laundry detergent use. It can be blended with LAS and nonionic surfactants; exact viscosity/phase behavior depends on electrolyte, EO grade and formulation.',
    concentrationFinding: 'Catalog 70% is nominal active matter. A published liquid-laundry formulation example lists 9–10% SLES product addition; this is a single example, not a universal limit. Convert actual addition to active matter and qualify supplier grade. No approved concentration range assigned.',
    pHFinding: 'Supplier TDS specifies pH 6.5–10.0 for a 4% solution of one SLES 70 grade. This is a raw-material solution specification, not proof of unlimited finished-formula stability. Category target 7.5–9.5 overlaps this screening window.',
    incompatibilityRisks: ['Excessive foam may be unsuitable for front-load/low-foam targets unless blend and dose are controlled.', 'Cationic surfactants can form insoluble ion pairs/complexes.', 'Salt response can be non-linear; excess electrolyte can reduce viscosity or cause separation.', 'Supplier EO distribution, sulfate, unsulfated matter and 1,4-dioxane specifications vary by grade.'],
    evidence: [
      { title: 'Ittehad Chemicals SLES technical data sheet (2026)', url: 'https://ittehadchemicals.com/wp-content/uploads/2026/03/TDS-SLES.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Elchemy LABSA 96 liquid laundry formulation example', url: 'https://elchemy.com/product/labsa-96-433', evidenceType: 'FORMULATION_EXAMPLE' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['The cited SLES TDS is one supplier grade; obtain the user-selected supplier CoA/TDS.', 'The cited dosage is an example, not an approved formulation limit.', 'Finished product foam profile, viscosity curve, enzyme compatibility, preservation and stability require testing.']
  },
  {
    ingredientId: 'sles-28',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'APPLICABLE',
    chemicalRole: 'Dilute aqueous anionic ether sulfate surfactant; cleanser, wetting and foam contributor.',
    compatibilityMechanism: 'Same SLES surfactant chemistry as the 70% grade; the lower supplied active concentration changes water contribution, dosing mass and electrolyte balance, not the fundamental anionic role.',
    concentrationFinding: 'Catalog 28% is a nominal active-matter default. Supplier TDS lists a 27–29% SLES liquid grade. Formulate on measured active matter, not raw-material mass; no independent universal use-level limit is established.',
    pHFinding: 'The cited supplier TDS gives pH 6.5–10.0 for its 2% solution for a 70% grade and lists a 27–29% liquid grade separately; it does not establish a pH stability envelope for this exact catalog 28% grade. Category finished target 7.5–9.5 is a screening match only.',
    incompatibilityRisks: ['Excess foam may conflict with controlled-foam machine laundry.', 'Cationic incompatibility.', 'Electrolyte/viscosity response is formulation-specific.', 'Preservative and microbial control must account for aqueous commercial grade.'],
    evidence: [
      { title: 'Ittehad Chemicals SLES technical data sheet (2026)', url: 'https://ittehadchemicals.com/wp-content/uploads/2026/03/TDS-SLES.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['Exact supplier TDS/CoA for catalog SLES 28% is required.', 'No universal maximum use level assigned.', 'Finished product performance and stability require testing.']
  }
];

export const LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS = laundryLiquidSurfactantReviews;

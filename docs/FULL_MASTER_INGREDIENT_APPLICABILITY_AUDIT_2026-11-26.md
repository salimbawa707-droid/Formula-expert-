# Full Master Ingredient Applicability Audit — Baseline

## Scope and safety boundary

This audit starts from `src/data/universalIngredientLibrary.ts`, the application's declared canonical master ingredient source. It audits every runtime record in `UNIVERSAL_INGREDIENTS`; it does not treat the separate 9-record `INGREDIENT_INTELLIGENCE_REGISTRY` as the master catalog.

The baseline script reports record count, ID uniqueness, category distribution, coverage of role/concentration/purity/solids/water/density/pH/provenance fields, and invalid numeric ranges.

## Important interpretation

- A missing pH range is **unknown**, not proof of incompatibility or compatibility.
- `activeDefault` is a commercial/default input value; it is not automatically a verified assay or purity.
- Commercial grade variants sharing CAS must remain distinct records.
- Product applicability is **not inferred** from ingredient category, name, or a generic function string.
- Applicability for all 13 canonical product categories remains `NOT_ASSESSED` until an evidence-backed ingredient × category review exists.
- Proprietary mixtures (for example, products with undisclosed composition) must retain explicit unknowns and cannot receive invented concentration, pH, or compatibility limits.

## Required next review stages

1. Normalize chemical identity and commercial-grade metadata; resolve aliases without collapsing distinct grades.
2. Assign a primary chemical role and secondary roles with source provenance.
3. Establish concentration/active-matter basis (as supplied, dry basis, active basis, or assay basis).
4. Review pH stability and use limits using supplier TDS/SDS or authoritative technical literature.
5. Assess each of the 13 product categories with mechanism, constraints, and evidence; otherwise retain `UNKNOWN` / `CONDITIONALLY_APPLICABLE`.
6. Add regression guards for every approved status and its rationale.

## Limitations

This baseline is a data-quality and coverage inventory, not a completed scientific suitability approval. It does not replace supplier-grade TDS/SDS review, compatibility/stability testing, finished-formula performance testing, or regulatory review.


## Evidence-reviewed batch status (2026-11-26)

The table below summarizes the initial 14 reviewed ingredient/category pairs. Subsequent batches bring the current total to 24; every other pair remains NOT_REVIEWED.

| Ingredient grade | Category | Decision | Main limitation |
|---|---|---|---|
| LABSA 96 / LABSA 90 | LAUNDRY_LIQUID | CONDITIONAL | Lot acid value/assay and neutralization demand required |
| SLES 70 / SLES 28 | LAUNDRY_LIQUID | APPLICABLE | Exact supplier grade, foam and finished-formula qualification required |
| AOS 38 | LAUNDRY_LIQUID | APPLICABLE | Lot assay and foam/stability qualification required |
| AOS 92 powder | LAUNDRY_POWDER | CONDITIONAL | Exact powder grade CoA, moisture and particle/dissolution tests required |
| SAS 60 | LAUNDRY_LIQUID | CONDITIONAL | Catalog CAS conflicts with cited supplier TDS CAS; identity must be resolved |
| SLS 95 needles | LAUNDRY_POWDER | CONDITIONAL | Exact grade assay, impurities and powder handling qualification required |
| SLS 30 liquid | LAUNDRY_LIQUID | CONDITIONAL | Exact grade and laundry performance validation required |
| LAE-7 / LAE-9 / APG 0810 | LAUNDRY_LIQUID | APPLICABLE / CONDITIONAL | Adjacent-grade evidence or supplier-specific pH/solids and blend validation required |
| LAE-3 | LAUNDRY_LIQUID | CONDITIONAL | Low-EO grade reported water-insoluble; aqueous clarity/solubilization must be proven |
| LAE-12 | LAUNDRY_LIQUID | CONDITIONAL | Supplier cloud-point data is not a catalog-lot CoA; test blend cloud point/stability |

The evidence-review arrays are now consumed by ingredientApplicabilityReviewMatrix.ts; the matrix carries the review decision, mechanism, risks, concentration finding, and source URLs. Regression checks verify every evidence record resolves to exactly one matrix pair, no pair is duplicated, and no unverified numeric use range is inserted.

### Current scope boundary

These 14 records are not a complete category-wise chemistry audit. They mostly cover LAUNDRY_LIQUID, with powder-specific reviews for AOS 92 and SLS needles. The remaining 11 canonical categories and the remaining ingredient records still require their own chemical identity, mechanism, pH, use-level, incompatibility and evidence review. Do not represent this stage as approval of all 13 categories.


## Nonionic batch 3 — APG 1214 and NPE risk review

Three additional nonionic ingredient families/grades were reviewed, adding 6 category pairs to the matrix (total evidence-reviewed pairs: 20):

- APG 1214 / LAUNDRY_LIQUID: APPLICABLE based on supplier TDS and a supplier liquid-laundry example; 50–53% solids is not automatically verified active matter, and the example dose is not a universal limit.
- APG 1214 / DISHWASH_MANUAL: APPLICABLE as a nonionic co-surfactant candidate; finished pH and skin mildness must be verified because supplier 10% solution pH is 11.5–12.5.
- APG 1214 / KITCHEN_DEGREASER: APPLICABLE as a hard-surface wetting/emulsifying candidate; substrate and solvent compatibility remain formulation-specific.
- NP-6, NP-9 and NP-10 / LAUNDRY_LIQUID: CONDITIONALLY_APPLICABLE risk-hold only, not a recommendation to use. EU REACH Annex XVII entry 46 restricts NP/NPE at >=0.1 wt% for domestic cleaning and other specified uses. This is not represented as Indian law; target-market legal review is required. Prefer NPE-free alternatives for new consumer products.

The three NPE records have no supplier-specific grade TDS/CoA in this review. No NPE use level is approved. Evidence and limitations are carried into the matrix, and regression tests assert the exact 6 ingredient/category pairs.


## Nonionic batch 4 — fragrance solubilizers and low-foam EO/PO grade

Four further ingredient/category pairs were reviewed and reconciled into the matrix:

- PEG-40 HCO / LAUNDRY_LIQUID: CONDITIONALLY_APPLICABLE as a fragrance/oil solubilizer adjunct only; no laundry-specific use level validated.
- Polysorbate 20 / LAUNDRY_LIQUID: CONDITIONALLY_APPLICABLE as a high-HLB solubilizer/wetting adjunct; detergent performance and dose remain unproven.
- Polysorbate 80 / LAUNDRY_LIQUID: CONDITIONALLY_APPLICABLE as a distinct oleate-based emulsifier; not interchangeable with Polysorbate 20.
- Pluronic PE 6400 / DISHWASH_AUTOMATIC: CONDITIONALLY_APPLICABLE low-foam EO/PO candidate; available product data is distributor-reproduced and requires current authenticated supplier TDS/CoA.

Total evidence-reviewed pairs: 24. None of these four entries has an approved numeric use range. All other ingredient/category pairs remain NOT_REVIEWED.

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

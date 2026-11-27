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

## Stage 2 — Ingredient × category review matrix

Added `src/data/ingredientApplicabilityReviewMatrix.ts`.

- Generates one explicit review row for every runtime master ingredient × each of the 13 canonical product categories.
- Carries ingredient identity, CAS/mixture identity, catalog chemical role, role provenance basis, commercial default concentration (explicitly marked as an unverified catalog default), supplier active-matter assay when present, ingredient pH bounds when present, and category screening targets.
- Each row has decision, permitted-use range, concentration basis, mechanism, incompatibility risks, evidence references, and reviewer note fields.
- All rows deliberately start as `NOT_REVIEWED`; use limits and evidence references remain empty until a source-backed assessment is entered. This prevents a complete-looking matrix from being mistaken for scientific approval.
- Added `scripts/test-ingredient-applicability-review-matrix.ts` and wired it into `test:all`. It asserts full ingredient × category coverage, unique pairs, no auto-approval, and no invented concentration limits.

### Category review sequence

The 13 categories will be reviewed as separate chemical environments, not as one generic detergent class:

1. Laundry liquid — moderate alkaline/near-neutral aqueous surfactant and enzyme-compatible system.
2. Laundry powder — alkaline builder-rich, low-moisture solid matrix.
3. Manual dishwash — near-neutral hand-contact, high-foam system.
4. Automatic dishwash — alkaline, low/zero-foam machine system.
5. Floor cleaner — low-residue, generally near-neutral to mildly alkaline hard-surface system.
6. Multipurpose cleaner — spray/wipe hard-surface system with substrate and residue constraints.
7. Toilet cleaner — strongly acidic descaling environment; mineral-acid and organic-acid subclasses must be distinguished.
8. Bathroom cleaner — acidic descaling or neutral variants must be distinguished.
9. Glass cleaner — low-residue, rapid-drying, streak-sensitive system.
10. Fabric softener — acidic cationic conditioning emulsion; anionic incompatibility is a critical gate.
11. Hand wash — mildly acidic skin-contact surfactant system.
12. Kitchen degreaser — high-alkaline and/or solvent-based grease-removal environment.
13. Car shampoo — vehicle-surface compatibility, lubricity, rinse and wax/clearcoat constraints.

These are review environments derived from taxonomy descriptions and are not supplier-certified operating specifications. The category targets themselves remain screening-only until independently sourced.

### Decision rule

- `APPLICABLE`: chemical role, grade, pH and use-level evidence support the defined function in the specific category.
- `CONDITIONALLY_APPLICABLE`: feasible only under explicit concentration, pH, process, substrate or compatibility conditions.
- `NOT_APPLICABLE`: a demonstrated chemical incompatibility or functional mismatch exists for the defined product subclass.
- `UNKNOWN`: identity, grade, source evidence or critical limits are insufficient.
- `NOT_REVIEWED`: no ingredient-specific review has yet been completed.

A commercial `activeDefault` is not a supplier assay; it must not be used as a maximum use level. A category's target pH is not proof that an ingredient is stable throughout that range. Each final decision requires a cited supplier TDS/SDS or authoritative technical source and, where necessary, bench compatibility/performance testing.


## 2026-11-27 source re-audit correction and current implementation

The prior Stage 2 paragraph stated that `src/data/ingredientApplicabilityReviewMatrix.ts` had been added and that its rows began as `NOT_REVIEWED`. A direct read of the current `main` tree on 2026-11-27 returned 404 for both that matrix path and the named test path. Therefore that earlier implementation claim is not accepted as current source-level proof.

The current canonical source scan found 430 records, 430 unique IDs, 15 catalog classes, 3 structured provenance objects (1 with a source URL), and no populated ingredient pH min/max fields. The 13 canonical product categories are distinct from the 15 ingredient catalog classes.

The replacement implementation is `src/data/masterIngredientApplicabilityScreen.ts`, which generates all 430 × 13 = 5,590 ingredient/category rows from the canonical source. This is explicitly a preliminary AI chemistry-risk screen only. Every row is `finalApplicability: NOT_APPROVED`; no row receives a final scientific suitability approval or invented use range. Its regression is `scripts/test-master-ingredient-applicability-screen.ts` and is wired into `test:all`.

The current evidence-vault reconciliation is recorded in `evidence_vault/forensic_reports/PHASE4B_MASTER_INGREDIENT_APPLICABILITY_PROVENANCE_RECONCILIATION_2026-11-27.md`. It finds 21 evidence records with structured rights status, 28 source-register rows, and four inspected datasets that all remain validation-deficient. This is not Phase 4B closure: per-grade ingredient provenance, source archival, dataset semantic gaps and zero eligible matched formula prediction/observation pairs remain open.

# Post-merge Hair Shampoo Removal Consistency Audit

Date: 2026-11-26  
Base: `main` after PR #101 merge commit `7931538d16caed5a4a57d88c8252100d3d539993`  
Scope: active app taxonomy, scientific profiles, formula templates/default mappings, ingredient applicability matrix, and source-reference classification.

## Findings

### 1. Canonical taxonomy
- `src/domain/productTaxonomy.ts` declares exactly 13 canonical product category IDs.
- `HAIR_SHAMPOO` is not a canonical ID and no Hair Shampoo subclass is present.
- `CAR_SHAMPOO` remains intentionally present as vehicle care. Its category, subclasses, formula and specifications are not deletion targets.
- `normalizeProductCategory('Hair Shampoo')` is expected to resolve to `UNKNOWN_PRODUCT_CATEGORY`, not silently map to another product.

### 2. Scientific profiles
- `src/domain/scientificProductProfiles.ts` has one profile for each of the 13 canonical IDs, including `CAR_SHAMPOO`.
- No Hair Shampoo scientific profile or profile key was found.
- The scientific profile resolver rejects unrecognized categories rather than defaulting them to a live category.

### 3. Formula templates and default formula links
- `src/data/formulas.ts` contains 39 formula templates in the fetched main snapshot.
- Source scan did not find a Hair Shampoo formula category or Hair Shampoo-specific active template.
- The first CI run exposed 12 stale taxonomy default formula IDs (including the laundry powder default); they did not match any current template IDs even though templates existed for those categories.
- Repaired all 12 default IDs to point to existing templates in the same normalized category. The liquid laundry default was already valid.
- The automated guard now checks every default link resolves to an existing template and that template belongs to its declared category.
- Car Shampoo formula templates are retained; its default now points to the existing touchless snow-foam car shampoo template.

### 4. Ingredient applicability
- `src/utils/ingredientIntelligenceEngine.ts` defines a structured applicability record keyed by `ProductCategoryId`.
- Ingredient records include `CAR_SHAMPOO` where appropriate; this is intentional vehicle-cleaning applicability, not Hair Shampoo.
- The new regression guard verifies every ingredient record has exactly the 13 canonical applicability keys, preventing a stale Hair Shampoo key or incomplete category map.

### 5. Remaining word-level references
- The exact active-code searches for `HAIR_SHAMPOO` and `hairShampoo` returned no matches.
- The remaining exact phrase match for “hair shampoo” was in `docs/LAB_VALIDATION_MODULE_AUDIT_2026-10-19.md`, where it explicitly says Hair Shampoo is excluded and Car Shampoo remains. This is historical scope documentation, not app functionality, so it is retained.
- Chitre shampoo dataset mentions in Phase 4B forensic reports are historical adjacent-domain research records, not product taxonomy, formulas, UI categories or ingredient applicability. They are retained to preserve research provenance.

## Automated guard added

`scripts/audit-hair-shampoo-removal.ts` is wired into `npm/bun test:all` and checks:
1. Exactly 13 unique canonical categories.
2. Taxonomy and scientific profile keys exactly equal the canonical set.
3. Hair Shampoo is rejected as an unknown category and is not a subclass.
4. `CAR_SHAMPOO` remains.
5. Every formula resolves to a canonical category.
6. Every taxonomy default formula ID exists and belongs to that category.
7. Every ingredient applicability map has exactly the 13 canonical category keys.

## Decision

No active Hair Shampoo category/profile/template/applicability data was identified for deletion after PR #101. No Car Shampoo or historical dataset evidence was removed. The preventive regression guard is the only code change in this audit.

## Verification status

The initial CI run failed specifically on the stale LAUNDRY_POWDER default formula ID. The other 11 stale default IDs were also reconciled to existing same-category templates. The follow-up CI run must verify the repair; no green result is claimed until it completes. Phase 4B remains OPEN and Phase 5 remains LOCKED.

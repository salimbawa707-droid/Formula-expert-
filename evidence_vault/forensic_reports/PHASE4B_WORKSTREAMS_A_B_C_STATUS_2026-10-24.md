# Phase 4B Workstreams A/B/C — Closure Status Review

**Audit date:** 2026-10-24  
**Repository:** https://github.com/salimbawa707-droid/Formula-expert-  
**Scope:** A) source-record reconciliation, B) scientific-model parameter separation, C) phase-gate continuation  
**Decision:** Documentation and implementation safeguards advanced; Phase 4B is **NOT CLOSED**. Phase 5/6 remain **LOCKED**.

## Executive status

| Workstream | Work completed in this review | Status |
|---|---|---|
| A — Source-record reconciliation | Rechecked the Round-18 report against the Round-20 source-record inventory and the latest mapping-resolution report. Preserved distinct counting units, rejected unsupported 951 adjustment, and retained 27,982 only as unreproduced historical arithmetic. | **Disposition closed; original historical crosswalk unresolved** |
| B — Scientific-model parameter separation | Verified the schema-design branch defines a separate optional `DaviesActivityModelRecord` collection and a separate `daviesActivityModels` vault field, not part of `inventoryMetrics`. The collection is empty by default, so no unsupported coefficients/conditions were seeded. | **Schema separation implemented on PR #7 branch; verified parameter population remains pending source-backed records** |
| C — Phase gates | Rechecked current PRs and CI evidence. No phase status or scientific maturity is promoted by successful CI. | **Gate decision upheld: Phase 4B OPEN; Phase 5/6 LOCKED** |

## A. Source-record reconciliation

The current source-identity checks and Round-20 parser assertions establish reproducible *structural inventories*, not a common count of independent physical experiments.

- Solution flow: 210 complete numeric point rows; the historical 212 corresponds to nonempty rows, with two incomplete rows not mapped to historical observation IDs.
- Film thickness: 7,522 group-level feature/length records; not 7,522 unique images or independent experiments.
- Bubble sizes: 19,509 raw area cells and 19,509 paired formula-derived radius cells. Radius cells must not be added as independent observations.
- Bubble split: historical 10,000/9,509 split is not mapped to source raw split 13,388/6,121.
- Rheometer: 2,233 numeric Point No. rows across 62 groups; historical 739 is not reproduced. Round-5's listed per-sheet numbers sum to 1,532, and no documented rule maps these figures to 739.
- The sum 29,474 mixes rows, features, cells, and instrument point rows. It is not a scientifically meaningful grand total.

**Disposition:** `27,982` is rejected as a verified independent-physical-observation count. The unsupported `951` adjustment remains rejected. Do not substitute `29,474` or another arithmetic residual as a validated total.

**Remaining evidence needed only to reconstruct the historical author's intent:** the original counting worksheet/script/notebook; exact row/cell crosswalk for each component; bubble time-subset membership; rheometer inclusion/deduplication rules; category-specific unit definitions; independent reviewer approval. If those historical artifacts cannot be found, the correct final record is “unreproduced historical claim,” not a guessed reconciliation.

Canonical detailed records:
- `evidence_vault/forensic_reports/PHASE4B_HISTORICAL_COUNT_MAPPING_RESOLUTION_2026-10-23.md`
- `evidence_vault/forensic_reports/PHASE4B_HISTORICAL_COUNT_MAPPING_LEDGER_2026-10-23.csv`
- `evidence_vault/forensic_reports/PHASE4B_ROUND18_HISTORICAL_AGGREGATE_RECONCILIATION.md`

## B. Scientific-model parameter separation

On the schema-design branch, the canonical vault types contain a dedicated `DaviesActivityModelRecord` with:
- model name/version;
- temperature (K) and ionic strength (M), nullable until source-backed;
- species charges;
- explicit applicability status;
- source reference, assumptions, and notes.

The vault stores these records in `daviesActivityModels`, separately from `inventoryMetrics`; the default collection is empty. This avoids treating scientific parameters as observation-count metrics and avoids seeding guessed values.

**No coefficients or numeric applicability limits are added in this review.** Populate records only after locating a traceable primary/source-backed parameter set, confirming units and documented domain, and recording model version and assumptions. A type definition is not proof that runtime consumers use the parameter, nor is schema presence empirical validation of PHEngine.

Implementation reference: PR #7, `src/domain/vault/types.ts`, `src/domain/vault/initialData.ts`, `src/domain/vault/schemaDefaults.ts`.

## C. Phase-gate decision

CI was rechecked on the exact current commits created for this A/B/C follow-up:

- PR #9 report commit `a7d1c153c0467ee2045616d57000bc03a1ca6a16`: Engine verification run [40010481554](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40010481554) **SUCCESS**; Phase 4B Integrity and Build Gates run [40010481673](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40010481673) **SUCCESS**. Evidence integrity, source byte/count reconciliation, official RepOD acquisition, typecheck, tests and production build passed.
- **Latest PR #9 head `610a47d27f90286bb8947f0ac2352ef4f81e1f9e`:** Engine verification run [40011916574](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40011916574) **SUCCESS** (typecheck, regression suite, production build, production HTTP smoke test); Phase 4B Integrity and Build Gates run [40011916582](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40011916582) **SUCCESS** (source workbook byte checks, Round-20 reconciliation, official RepOD acquisition, historical-count reconciliation, typecheck, tests, production build).
- PR #7 schema commit `d3409268d2f81097cc4d71ab61490999c09534c1`: Engine verification run [40010530550](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40010530550) **SUCCESS**; Phase 4B Integrity and Build Gates run [40010530745](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40010530745) **SUCCESS**. The Pušić-specific workflow was **SKIPPED** as intended by its branch filter, not failed.

These results establish code/test/source-integrity checks on these commits only. They do not establish independent human transcription review or resolve missing historical source mapping.

The Pušić R460 dataset has 144 extracted values, but its genuinely independent human source-PDF review is still pending. `reviewer_2` and `review_match` must remain blank until a separate human reviewer completes the comparison. AI rechecking is not independent human sign-off. The values remain `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`, not `LAB_VALIDATED`.

Therefore:
- Phase 4B: **OPEN**.
- Phase 5: **LOCKED**.
- Phase 6: **LOCKED**.
- No engine is promoted to `LAB_VALIDATED`.
- No 95–98% empirical accuracy claim is supported.
- No PR is merged by this report.

## Acceptance checklist

- [x] Historical headline arithmetic and incompatible counting units documented.
- [x] Unsupported 951 adjustment rejected; no fabricated replacement aggregate.
- [x] Optional Davies parameter collection separated from inventory metrics in PR #7 schema branch.
- [x] Latest PR #9 CI green on the recorded head.
- [x] Historical count crosswalk not present; the 27,982 claim is explicitly retained as unreproduced and not accepted as a verified physical-observation total.
- [ ] Independent human PDF review of all 144 Pušić values completed and recorded.
- [ ] Remaining Phase 4B acceptance criteria and independent sign-off completed.
- [ ] Phase 5/6 unlock criteria independently approved.

**Final disposition:** The assistant-executable reconciliation and safeguard work has been carried as far as available repository evidence allows. The remaining open items require source artifacts not present in the repository and/or a genuinely separate human reviewer; they must not be “completed” by guessing or self-approval.


## Follow-up verification — 2026-10-24

After the report's earlier draft, both required CI workflows completed successfully on the latest PR #9 head `610a47d27f90286bb8947f0ac2352ef4f81e1f9e` (runs `40011916574` and `40011916582`). The Pušić review-gate workflow also remains green on commit `bfcdc66ae48eafd8c58822e5e7e4bb355d477337` (run `39965675012`), confirming the validator/comparator guardrails; it does **not** supply the missing independent human review. No merge, scientific promotion, or phase unlock was performed.

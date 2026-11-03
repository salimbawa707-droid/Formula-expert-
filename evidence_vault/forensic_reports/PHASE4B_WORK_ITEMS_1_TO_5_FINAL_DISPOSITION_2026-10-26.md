# Phase 4B — Final Disposition of Work Items 1–5

**Audit date:** 2026-10-26  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Disposition:** Items 1–3 have reproducible repository-level outcomes; Item 4 remains an unreproduced historical claim; Item 5's former “1,492 unit mismatch blockers” description is corrected, while genuine field-level unit ambiguities remain blocked.  
**Phase governance:** Phase 4B OPEN; Phase 5 LOCKED.

## Executive table

| Item | Work | Verified disposition | Remaining requirement |
|---|---|---|---|
| 1 | Baseline audit and prevent duplicate work | **COMPLETED for current known workstream** — existing crosswalks, historical-count reports, source parsers and gate status reviewed. PRs #30–#42 and subsequent bubble diagnosis were considered where relevant. | Continue to recheck main/CI after each new merge; this is not a claim that all of Phase 4B is complete. |
| 2 | Solution-flow 212 vs 210 | **STRUCTURALLY RECONCILED** in merged PR #42. The workbook has 210 complete numeric flow-point rows. The value 212 is reproduced only when two nonempty header rows are included. | Original author intent remains unconfirmed; never describe 212 as measured points. |
| 3 | Bubble-size 10,000 / 9,509 split | **UNRESOLVED, diagnostic completed** in merged PR #41 and PR #49. Observed source split is 13,388 (20min) and 6,121 (30min), aggregate 19,509. The eight-column subset search reports no subset matching 10,000 or 9,509 and no complementary partition matching both. | Need original counting workbook/script/notebook or documented source-cell inclusion map. Do not reassign cells to force a match. |
| 4 | Rheometer historical count 739 | **UNREPRODUCED, diagnostic completed.** Current source parser finds 2,233 numeric Point No. rows across six measurement sheets and 62 test groups. Historical per-sheet claims conflict (Round-5 claims sum to 1,532; Round-4 steady-shear claims conflict with the Round-5 combined 731 claim). The arithmetic 801 minus 62 equals 739 mixes different scopes and is not a valid counting rule. | Need the original counting artifact and explicit inclusion, deduplication, test-group and replicate semantics. Do not drop rows or promote 739 to a verified observation count. |
| 5 | “1,492 unit mismatch / ingestion blockers” | **LABEL CORRECTED; actual unit audit remains OPEN.** The 1,492 value is 29,474 minus 27,982, a difference between mixed-semantic record totals—not a measured count of unit blockers. Existing report `PHASE4B_UNIT_AND_MEASUREMENT_SEMANTICS_TRIAGE_2026-10-26.md` documents field-level conflicts. | Keep each ambiguous field blocked until source-supported units/basis are verified. No silent conversions. |

## Evidence and guardrails

### Solution-flow
The crosswalk separates the two nonempty header rows from 210 complete numeric data points. The header-inclusive total is a structural explanation, not proof of historical author intent. The regression tests preserve the distinction.

### Bubble size
The source workbook contains 19,509 raw numeric area cells overall. Formula-derived radius cells are linked to raw area inputs and are not counted as additional independent observations. The current eight-column arithmetic search did not reproduce the historical time split. This is a completed diagnostic, not a completed historical reconciliation.

### Rheometer
Numeric Point No. rows are source records, not proof of independent physical experiments. Existing diagnostics preserve raw test labels separately from forward-filled group labels. No source-supported mapping from the 739 historical claim to the current raw ledger has been found. The count remains unreproduced.

### Unit and measurement semantics
The former 1,492 “blocker count” is withdrawn as an interpretation. Real unresolved examples include:
- RepOD PLL_RH concentration: workbook label mol/L conflicts with article figure captions indicating mg/dm³; preserve raw values and do not convert without clarification.
- RepOD Vmax: workbook labels maximum foam volume (mL), while the article describes maximum foam height; meaning remains unresolved.
- Pušić R460: source reports R460 nm but does not specify a physical unit; do not reinterpret as soil-removal percent.
- PhDat composition remains wt%; temperature remains °C; phase values are preserved as published/extracted, without silent normalization.

The unit audit is field-specific. This report does not claim that all unit mismatches have been enumerated or resolved.

## Acceptance rules for remaining evidence

1. Recover original counting scripts, notebooks, or a source-cell inclusion map for the historical aggregate and rheometer 739.
2. Preserve category-specific counting units: flow points, image-derived features, raw bubble-area cells, formula-derived radii, instrument point rows, test groups, replicate runs, and independent experiments are not interchangeable.
3. Require source-backed unit definitions and explicit conversion provenance before converting ambiguous fields.
4. Retain hashes, reproducible reports, and CI artifacts for each change.
5. Do not claim independent human review, laboratory validation, or scientific closure from software tests alone.

## Final gate

- Baseline audit: **completed for the above workstream**
- Solution-flow discrepancy: **structurally explained; author intent unconfirmed**
- Bubble historical split: **unresolved**
- Rheometer 739: **unreproduced**
- Historical 1,492 interpretation: **corrected; actual field-level unit ambiguities remain**
- Phase 4B: **OPEN**
- Phase 5: **LOCKED**
- `LAB_VALIDATED` promotion: **not authorized by this disposition**

No source values are altered, reallocated, dropped, imputed, or relabeled by this report. The unresolved items are kept explicit rather than falsely marked complete.

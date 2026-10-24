# Phase 4B — Final Disposition of Remaining Items 1–3

**Audit date:** 2026-10-25  
**Audited branch base:** `main` at `ac2de199e824d084ac7b23399e5cb94722100a15`  
**Disposition:** Item 3 completed as a governance/final-status audit; Items 1 and 2 remain blocked by evidence that cannot honestly be synthesized by code or AI.

## Executive result

| Item | Requirement | Current evidence | Final disposition |
|---|---|---|---|
| 1 | Independent human transcription of all 144 Pušić (2006) R460 values | Existing AI-assisted visual comparison records 144/144 keys matched and zero numeric mismatches; blind-review template still has empty transcription/reviewer/date/match fields | **OPEN — real independent human review not supplied** |
| 2 | Reconstruct historical 27,982 count from original worksheet/script and row/cell crosswalk | Repository audit reconciles available workbook structures and identifies incompatible historical claims; original counting artifact and documented historical inclusion/deduplication rules are not present in the verified evidence | **OPEN — source provenance unavailable; do not invent a total** |
| 3 | Final forensic disposition and phase-gate decision | Current main CI succeeded; source registers, audit scripts, historical reconciliation, data lineage and status constraints were reviewed | **COMPLETED AS A STATUS AUDIT; scientific closure denied until Items 1 and 2 have new evidence** |

## Item 1 — Pušić R460 independent review

Repository assets already available on `main`:

- Source PDF: `evidence_vault/sources/55_01_011_018hr1t.pdf`
- Production extraction: `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv`
- Blind-review template: `evidence_vault/review_workbooks/pusic_2006_independent_blind_review_template.csv`
- AI-assisted comparison: `evidence_vault/review_workbooks/pusic_2006_ai_visual_comparison_144.csv`
- Comparator: `evidence_vault/scripts/compare_pusic_independent_review.py`
- Strict validator: `evidence_vault/scripts/validate_pusic_2006_r460.py`

The AI-assisted comparison is a useful second pass but is not a distinct human transcription. The blind-review fields must remain blank until a real second reviewer independently reads the original PDF without copying the production CSV. The reviewer must record their real identity/affiliation, review date, independent values and discrepancies. Do not mark the gate passed merely because automated tests pass.

The readings are labeled R460 in the source; the repository correctly preserves the unit as unspecified and must not reinterpret the readings as soil-removal percentages or detergent-formula validation labels.

**Acceptance gate:** all 144 independently transcribed values; a distinct human reviewer; comparator passes; every discrepancy resolved against the original PDF and documented; strict production validator passes.

## Item 2 — Historical aggregate 27,982

Available evidence establishes that the arithmetic 212 + 7,522 + 19,509 + 739 equals 27,982. It does not establish that this is a count of independent physical observations.

The Round-18 report records a conflicting Round-5 table sum of 28,775, including a rheometer subtotal of 1,532 rather than the file-level 739. The source reconciliation also finds 210 complete numeric solution-flow point rows rather than 212, 7,522 film/image-derived feature records, 19,509 raw bubble-area cells paired with 19,509 formula-derived radius cells, and 2,233 numeric rheometer point rows. These have different semantics and cannot safely be added as one experiment count.

Available audit artifacts include:

- `evidence_vault/forensic_reports/PHASE4B_ROUND18_HISTORICAL_AGGREGATE_RECONCILIATION.md`
- `evidence_vault/forensic_reports/PHASE4B_HISTORICAL_AGGREGATE_RECONCILIATION_EVIDENCE_MATRIX_2026-10-23.md`
- `evidence_vault/scripts/round18_historical_aggregate_reconciliation.py`
- `evidence_vault/scripts/round19_raw_workbook_lineage.py`
- `evidence_vault/scripts/round20_source_record_reconciliation.py`
- `evidence_vault/scripts/test_round20_source_record_reconciliation.py`

These scripts provide reproducible parsing and row/cell lineage for the available workbooks. They do not reproduce the original author's undocumented historical counting procedure. In particular, the rheometer steady-shear sheets have 720 numeric point rows each, while the historical combined claim is 731 and the file-level rheometer claim is 739; no evidence-backed deduplication rule reconciles them.

**Acceptance gate:** obtain the original counting worksheet/script/notebook/export, define the unit counted by each component, map each historical number to source workbook/sheet/cell and its units, document bubble timepoint selection and rheometer deduplication rules, independently review that crosswalk, then rerun the reconciliation. Until then, retain 27,982 only as an unreconciled historical arithmetic claim. Do not substitute 28,775 or another derived sum.

## Item 3 — Final forensic and phase-gate decision

The latest post-merge main workflows for commit `ac2de199e824d084ac7b23399e5cb94722100a15` succeeded:

- Engine verification: https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40124155417
- Phase 4B Integrity and Build Gates: https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40124155359

These are software integrity/typecheck/test/build results, not evidence of a human transcription or a verified physical-observation total.

### Final phase gate

- Pušić independent human review: **OPEN**
- Historical 27,982 source lineage: **OPEN**
- Phase 4B: **OPEN**
- Phase 5: **LOCKED**
- LAB_VALIDATED promotion: **NOT AUTHORIZED by this audit**
- CMC learned-model/objective scientific approval: **NOT implied by this audit**

No reviewer identity, date, source file, row mapping, accuracy statistic, or laboratory result has been fabricated. This report completes the current evidence-based disposition and specifies the exact acceptance evidence needed to reopen each blocker. It does not falsely declare the scientific phase complete.

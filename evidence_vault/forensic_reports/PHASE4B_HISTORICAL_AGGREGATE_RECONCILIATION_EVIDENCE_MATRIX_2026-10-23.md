# Phase 4B Historical Aggregate Reconciliation — Evidence Matrix

**Audit date:** 2026-10-23  
**Governance:** Phase 4B = OPEN; Phase 5 = LOCKED  
**Decision:** `BLOCKED_UNRESOLVED_HISTORICAL_AGGREGATE`

## Purpose and limits

This report reconciles the historical aggregate claims against the Round-18 and Round-20 repository audit logic. It records what the available source workbook parsing supports and what remains unresolved. It does **not** assert that spreadsheet rows, image features, formula-derived values, or rheometer point rows are all independent physical experiments.

## Reconciliation matrix

| Component | Historical/file-level claim | Reproduced source count | Difference / issue | Status |
|---|---:|---:|---|---|
| Solution flow curves | 212 | 210 complete numeric point rows | -2 rows vs historical claim; source parser groups 15 named curves | NOT_REPRODUCED |
| Film thickness | 7,522 | 7,522 feature/length records | Count represents image-derived features, not 7,522 unique images | COUNT_REPRODUCED; SEMANTICS_LIMITED |
| Bubble sizes, all sheets | 19,509 | 19,509 numeric raw area cells | Aggregate count matches; raw areas pair with 19,509 formula-derived radius cells and must be counted once | AGGREGATE_REPRODUCED |
| Bubble sizes, 20 min | 10,000 | 13,388 raw area cells | +3,388 vs historical split | NOT_REPRODUCED |
| Bubble sizes, 30 min | 9,509 | 6,121 raw area cells | -3,388 vs historical split | NOT_REPRODUCED |
| Rheometer | 739 | 2,233 numeric Point No. rows | +1,494 vs file-level claim; source parsing finds 62 test groups | NOT_REPRODUCED |
| All source categories summed | 27,982 headline | 29,474 arithmetic sum using 210 + 7,522 + 19,509 + 2,233 | +1,492 vs headline; mixed units and dependency relationships make this arithmetic only | NOT A VALIDATED EXPERIMENT TOTAL |

## Arithmetic cross-checks

- Historical file-level components sum to 27,982: 212 + 7,522 + 19,509 + 739.
- The first three source-reconciled categories sum to 27,241: 210 + 7,522 + 19,509.
- To reach the 27,982 headline using those first-three source counts would require 741 rheometer records. No explicit row mapping supports 741.
- Source rheometer point rows by worksheet are 288, 225, 192, 88, 720 and 720 (total 2,233). Blank spacer rows are excluded and Test labels are forward-filled for grouping.
- Earlier Round-5 per-sheet rheometer claims sum to 1,532 (290 + 227 + 194 + 90 + 731), not 739. Earlier sheet-level steady-shear claims of 722 + 722 also do not reconcile to the combined claim of 731. These are conflicting historical counting rules, not grounds for choosing a preferred total.
- The 19,509 bubble-area cells and 19,509 formula-derived radius cells represent paired source/derived values. Adding both as independent observations would double-count the same features.

## Evidence and provenance

1. `evidence_vault/scripts/round18_historical_aggregate_reconciliation.py` records the historical component arithmetic and Round-5 inconsistency.
2. `evidence_vault/scripts/round19_raw_workbook_lineage.py` extracts workbook/cell lineage and explicitly treats parser counts as structural inventory, not independent physical observations.
3. `evidence_vault/scripts/round20_source_record_reconciliation.py` crosswalks the historical claim to source-cell counts, pairs raw bubble areas with formula-derived radii, and creates grouped rheometer point ledgers.
4. Round-20 output report names are emitted by the script at run time, including `PHASE4B_ROUND20_SOURCE_RECORD_RECONCILIATION.md/.json`, the category reconciliation CSV, formula dependency ledger, rheometer grouped-point ledger, and historical claim crosswalk CSV. The report must be generated from the exact checked-out workbook artifacts before treating its output files as a fresh run result.

## Source workbook integrity cross-reference

The repository's prior numerical inspection / provenance report records these source artifact identities (the values below are **recorded in the repository report**, not freshly recomputed in this PR run):

| Workbook | Bytes | Recorded MD5 | Recorded SHA-256 |
|---|---:|---|---|
| Supplementary_SolutionFlowCurves.xlsx | 22,280 | cd5bfd6e95fc65e412807d53935c2d96 | 90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590 |
| Supplementary_FilmThickness_v1.xlsx | 149,923 | bc9582baafecd6552f6014216a0844e6 | 170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428 |
| Supplementary_BubbleSizes_v1.xlsx | 557,745 | 9fcfe68a37d2d92a7999569a07908854 | 9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad |
| Supplementary_RheometerData_v2.xlsx | 162,970 | c9b5a9cde073eb7c58933eec37a559a6 | 073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70 |

The recorded report marks these digests as matching the publisher's MD5 and the repository's calculated SHA-256. To make a new run reproducible, the CI job must bind its emitted counts and generated ledgers to these exact bytes and retain the run/commit identifier. A prior integrity report is provenance evidence, not proof that this PR reran the scripts.

## Outstanding blockers

- Execute Round-20 against the exact checked-out source workbook bytes above and preserve the generated JSON/CSV outputs together with the commit/run identifier. The current PR has not run this script in the available execution environment.
- Independently verify the 210 vs historical 212 solution-flow discrepancy against the original source and historical counting definition.
- Resolve the bubble 20/30-minute allocation from documented source-row/cell lineage; matching only the combined total is insufficient.
- Find a documented historical mapping/counting rule for rheometer 739, and explain the 1,532 per-sheet claim and 2,233 numeric-point-row count without silently deduplicating or discarding rows.
- Define and defend the unit of count for each category before any headline aggregate is described as observations or experiments.
- Have a reviewer other than the original extractor independently review the reconciliation logic and source mappings.

## Acceptance status

This matrix is an evidence inventory and discrepancy statement, not a phase-closure certificate. It does not close the aggregate reconciliation blockers, does not promote any model to `LAB_VALIDATED`, does not establish a predictive-accuracy percentage, and does not unlock Phase 5.

**Current gate: Phase 4B OPEN; Phase 5 LOCKED.**

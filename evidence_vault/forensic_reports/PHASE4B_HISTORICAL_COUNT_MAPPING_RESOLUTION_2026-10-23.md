# Phase 4B — Historical Count Mapping Resolution (Evidence-Based Disposition)

**Audit date:** 2026-10-23  
**Scope:** Historical 27,982 aggregate for Zenodo 10.5281/zenodo.18961871  
**Decision:** `BLOCKED_UNRESOLVED_HISTORICAL_AGGREGATE`  
**Governance:** Phase 4B OPEN; Phase 5 LOCKED

## Executive disposition

The original 27,982 figure can be reproduced as arithmetic only:
`212 + 7,522 + 19,509 + 739 = 27,982`.

It cannot currently be reproduced as a count of independent physical observations from the source workbooks. The original count table has no per-observation IDs, explicit cell/row crosswalk, or defensible common unit across the four categories. Later workbook-level parsing identifies material discrepancies. The earlier Round-5 report's claim that it had reconciled “exact valid physical observations” is therefore superseded; the report remains preserved as historical evidence, not accepted validation.

## Claim-to-source disposition

| Historical component | Historical value | Reproducible source inventory | Difference / exact mapping status | Disposition |
|---|---:|---:|---|---|
| Solution flow | 212 | 210 complete numeric point rows; 212 nonempty rows in Round-6 structural inventory | The 212 value equals the nonempty-row count, not the 210 complete numeric point-row count. The two additional nonempty rows are not complete numeric points. The historical claim does not identify which exact two rows it treated as observations. | **Historical unit mismatch identified; 212 physical points not supported.** Use 210 complete numeric point rows for this structural definition only. |
| Film thickness | 7,522 | 7,522 feature/length records across four 3-column groups (Foam A–D); 2,394 rows contain numeric values somewhere in the sheet | 7,522 is a count of per-group image-feature records, not 7,522 unique images or necessarily 7,522 independent experiments. One sheet row can carry multiple group records. | **Feature count reproduced; physical-observation semantics limited.** |
| Bubble sizes, total | 19,509 | 19,509 numeric raw area cells; 19,509 formula-derived radius cells; 19,509 matched area-to-radius pairs | The area inputs and radius formula cells are paired representations of the same features and must be counted once. | **Raw-feature aggregate reproduced; do not add derived radii.** |
| Bubble sizes, 20 min | 10,000 | 13,388 numeric raw area cells | Source has 3,388 more raw area cells than the historical split. No documented cell mapping explains a 10,000 subset. | **Historical split not reproduced.** |
| Bubble sizes, 30 min | 9,509 | 6,121 numeric raw area cells | Source has 3,388 fewer raw area cells than the historical split. No documented cell mapping explains the 9,509 subset. | **Historical split not reproduced.** |
| Rheometer | 739 | 2,233 numeric Point No. rows across six measurement sheets and 62 Test groups | Historical 739 cannot be mapped to the current source rows. Round-5's own per-sheet claims (290 + 227 + 194 + 90 + 731) sum to 1,532, not 739. The two steady-shear sheets each contain 720 numeric point rows; their relationship to the historical combined 731 claim is undocumented. | **Historical 739 not reproduced; no row-discarding or deduplication rule authorized.** |

## Exact source workbook identities

The Round-20 CI run on commit `af6264bb5ba269319defab07058f1fdceaba0818` enforced the following exact workbook byte identities:

| Workbook | Bytes | SHA-256 |
|---|---:|---|
| `Supplementary_SolutionFlowCurves.xlsx` | 22,280 | `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590` |
| `Supplementary_FilmThickness_v1.xlsx` | 149,923 | `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428` |
| `Supplementary_BubbleSizes_v1.xlsx` | 557,745 | `9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad` |
| `Supplementary_RheometerData_v2.xlsx` | 162,970 | `073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70` |

The CI regression gate verifies source bytes and structural counts. This does not itself resolve historical category semantics or prove that counts represent independent experiments.

## Arithmetic cross-checks (not observation totals)

- Historical component arithmetic: `212 + 7,522 + 19,509 + 739 = 27,982`.
- Source-defined structural arithmetic: `210 + 7,522 + 19,509 + 2,233 = 29,474`. This mixes complete flow points, image-derived features, bubble area features, and rheometer point rows; it is **not** a scientifically meaningful experiment total.
- Keeping the first three source-defined counts and solving for the rheometer count would require `27,982 - (210 + 7,522 + 19,509) = 741`. No source mapping supports 741.
- Round-5 rheometer worksheet claims sum to 1,532, while current numeric Point No. rows sum to 2,233. These are distinct counting rules, not interchangeable estimates.

## Required evidence to close the historical mapping

The historical aggregate cannot be “resolved” by choosing one of the conflicting totals. To establish a defensible final count, an evidence owner must provide or locate:

1. The original counting worksheet/script or notebook that generated 212, 7,522, 10,000, 9,509 and 739, with source-cell references and inclusion/exclusion rules.
2. The source-level row/cell IDs included in the historical bubble 20-min/30-min subsets.
3. The row mapping and deduplication/repeat semantics used to derive rheometer 739, plus an explanation for the conflicting Round-5 values and the two steady-shear sheets.
4. A category-specific unit definition distinguishing image-feature records, formula-derived values, instrument point rows, test groups, repeat runs, and independent physical experiments.
5. An independent reviewer’s documented approval of the crosswalk and the counting definitions.

If the original mapping cannot be found, preserve 27,982 as an unreproduced historical claim and publish only the category-specific source inventories with their explicit units. Do not silently relabel the 29,474 mixed-unit sum as a replacement total.

## Pušić R460 review status is separate

The 144 Pušić et al. (2006) R460 readings are a separate transcription-verification task. The repository's blind review template remains intentionally blank. An AI-generated or same-operator comparison is not a genuine independent human review and must not be represented as one. The values remain `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW` until a distinct human reviewer transcribes from the publisher's PDF and the comparator passes.

## Machine-readable ledger

The same dispositions are recorded in `PHASE4B_HISTORICAL_COUNT_MAPPING_LEDGER_2026-10-23.csv`. Its `accepted_as_independent_physical_observation_count` field is `false` for every historical/source-defined category because the current structural counts do not establish a common, validated physical-observation unit.

## Gate

**Historical aggregate mapping: OPEN / BLOCKED.**  
**Pušić 144-value independent transcription review: PENDING.**  
**Phase 4B: OPEN. Phase 5: LOCKED.**  
No model is promoted to `LAB_VALIDATED`; no accuracy claim is made.

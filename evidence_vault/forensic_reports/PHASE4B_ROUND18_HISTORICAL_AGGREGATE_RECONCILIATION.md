# Phase 4B Round-18 — Historical Aggregate Reconciliation

**Date:** 2026-10-23  
**Target:** Zenodo record 18961871, *Rheometer methods for characterising and comparing foams*  
**Decision:** **BLOCKED — historical physical-observation aggregate not reconciled**  
**Governance:** Phase 4B OPEN; Phase 5 LOCKED

## Purpose

Round-18 audits the arithmetic and provenance of the historical 27,982 claim. It compares the Round-5 report's file-level author-summary claims with the per-sheet values printed in that same report and with parser-derived Round-5/Round-6 row metrics. This is an accounting/provenance audit, not a new raw-workbook observation count.

## Finding 1 — The headline total and the table do not agree

The Round-5 report's four file-level author-summary components add to 27,982:

| Category | Historical author-summary claim |
|---|---:|
| Solution flow curves | 212 |
| Film thickness | 7,522 |
| Bubble sizes | 19,509 |
| Rheometer | 739 |
| **Sum** | **27,982** |

However, adding the values labelled “Exact Valid Physical Observations” in the Round-5 per-sheet table yields **28,775**, which is **793 higher**:

212 + 7,522 + 10,000 + 9,509 + 290 + 227 + 194 + 90 + 731 = 28,775.

This arithmetic mismatch means the report cannot simultaneously support both totals. The value 28,775 is **not** proposed as a replacement physical-observation count; it is only the sum of the table's printed claims.

## Finding 2 — Rheometer category has a direct contradiction

The file-level summary claims **739** rheometer observations. The Round-5 per-sheet table lists 290, 227, 194, 90, and 731 for rheometer categories, summing to **1,532**. The earlier Round-4 row reconciliation also lists the two steady-shear sheets as 722 rows each, while Round-5's table combines them as 731. No documented, reproducible mapping explains this difference.

The sheets may contain different measurement structures, test points, samples, derived values, and repeat series. Without an explicit measurement-unit definition and traceable deduplication/aggregation rule, the values cannot be reconciled by assumption.

## Finding 3 — Row counts do not establish physical measurement counts

Round-5 and Round-6 count spreadsheet rows, numeric-bearing rows, numeric cells, formula cells, and worksheet dimensions. These are useful parser diagnostics but are not interchangeable with individual bubble measurements across columns, film-thickness values derived from image measurements, rheometer test points or replicates, or independent physical experiments.

Bubble-radius cells can be formula-derived from pixel areas, and film-thickness summaries can be formula-derived from raw image/length inputs. Counting these as separate raw observations risks double-counting. Round-6 records **11,626 numeric-bearing rows** across 11 worksheets; this is a structural metric only, not an alternative physical-observation total.

## Required closure evidence

1. Define the unit counted by each file-level number (measurement, bubble, image, test point, replicate, or independent experiment).
2. Provide row/cell-level lineage mapping from each claimed count to raw source entries.
3. Explicitly mark formula-derived values and identify whether they summarize or transform raw measurements.
4. Reconcile the two steady-shear worksheets against the rheometer summary of 739 with a reproducible, documented rule.
5. Independently recalculate the total only after the preceding mapping is established.

No author email is required to document this contradiction or retain the dataset as descriptive evidence. A public source clarification may be used later if needed, but absence of a reply does not justify guessing.

## Decision

- The historical 27,982 number remains a **source-reported, arithmetically unverified aggregate**.
- The Round-5 per-sheet “exact physical observations” wording is **not reliable as a reconciled total** and must not be used as validation evidence.
- No count is promoted from spreadsheet rows to independent experiments.
- No engine is promoted to LAB_VALIDATED.
- **Phase 4B remains OPEN; Phase 5 remains LOCKED.**

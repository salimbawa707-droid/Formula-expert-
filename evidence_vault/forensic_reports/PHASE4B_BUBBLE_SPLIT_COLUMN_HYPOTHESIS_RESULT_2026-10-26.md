# Phase 4B — Bubble Historical Split Column-Subset Result

**Audit date:** 2026-10-26  
**Source:** Zenodo record 10.5281/zenodo.18961871, supplementary workbook `Supplementary_BubbleSizes_v1.xlsx`  
**Source SHA-256:** `9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad`  
**Reproducible script:** `evidence_vault/scripts/round22_bubble_size_time_split_crosswalk.py`  
**CI evidence:** Phase 4B Integrity and Build Gates run 40185351069, artifact `phase4b-bubble-size-time-split-crosswalk`  
**Disposition:** Historical 20/30-minute split remains unresolved; no subset hypothesis matched.

## Source-column inventory

| Sheet / source column | Numeric raw-area cells |
|---|---:|
| 20min!A | 4,405 |
| 20min!B | 3,145 |
| 20min!C | 3,629 |
| 20min!D | 2,209 |
| **20min total** | **13,388** |
| 30min!A | 2,384 |
| 30min!B | 1,147 |
| 30min!C | 1,453 |
| 30min!D | 1,137 |
| **30min total** | **6,121** |
| **Aggregate raw-area cells** | **19,509** |

The aggregate 19,509 is reproduced when each numeric raw-area cell is counted once. Formula-derived radius cells are paired outputs and are not additional physical features.

## Historical subset search

The PR #41 crosswalk searched all eight source-column counts and complementary partitions:

- Subsets summing to historical 20-minute claim 10,000: **0**
- Subsets summing to historical 30-minute claim 9,509: **0**
- Complementary partition reproducing both claims: **0**

Therefore the simple column-subset hypothesis does not explain the old split. This does not rule out every possible row-level inclusion rule; it shows that no combination of whole source columns reproduces the claimed values.

## Scientific and governance limits

- Do not reallocate rows between time sheets or discard source cells to force the historical split.
- Worksheet cells and derived radii are not proof of independent experimental units.
- Keep historical 10,000 / 9,509 as unreproduced claims unless the original counting script or cell-membership list is found.
- Phase 4B remains **OPEN**; Phase 5 remains **LOCKED**.

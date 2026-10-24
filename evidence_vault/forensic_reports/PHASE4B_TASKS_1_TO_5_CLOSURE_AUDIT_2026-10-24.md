# Phase 4B — Tasks 1–5 Closure Audit
**Audit date:** 2026-10-24  
**Base commit:** `1135056a907c0510bfe0763134a708c7ced0e1cd`  
**Purpose:** Close the five agreed workstreams with reproducible evidence and explicit stop conditions. This report does not promote any dataset to `LAB_VALIDATED`.

## Executive disposition

| Task | Workstream | Disposition | Gate |
|---|---|---|---|
| 1 | Pušić (2006), Tables 5–8, 144 R460 values | AI-assisted source comparison documented; 144/144 keys matched, 0 mismatches in the second pass. This is not an independent human review. | **OPEN — human reviewer still required** |
| 2 | RepOD foam workbook audit | Source checksum, workbook structure, normalized outputs, units, missingness, and grouping are documented; CI acquisition/parser/audit tests pass. | **CLOSED for scoped descriptive audit; excluded from detergent-formula validation** |
| 3 | Zenodo 18961871 rights and workbook lineage | Four tabular workbooks have pinned hashes and parser/lineage audits; record-level CC BY 4.0 attribution recorded. The 895 MB microscope image archive is not validated by this work. | **CLOSED for four tabular workbooks; image archive excluded** |
| 4 | Hu et al. (2023) single-fiber detergency paper | Scoped as a relevant methods/reference candidate. No raw replicate-level dataset was ingested; no numeric values were digitized from figures. Direct publisher license/data-file confirmation remains a pre-ingestion gate. | **METADATA TRIAGE COMPLETE; DATA INGESTION BLOCKED** |
| 5 | Historical 27,982 aggregate and phase gate | Historical arithmetic is reproducible, but 27,982 is not supported as a physical-observation count. Category-specific counts have different units and inclusion rules. | **CLAIM DISPOSITION CLOSED; Phase 4B remains OPEN** |

## Task 1 — Pušić (2006) extraction and traceability

Source: Pušić et al., “Primary Washing Effect of Powder and Liquid Detergents,” *Tekstil* 55(1), 11–18. Publisher record: https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174 . The repository retains the source PDF and CSV at `evidence_vault/sources/55_01_011_018hr1t.pdf` and `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv`.

The four tables × four conditions × nine reported columns produce 144 expected readings. The AI-assisted source second-pass report records 144/144 keys matched and 0 numeric mismatches, including the flagged values 57.46 (Table 5, blood, 45 g/kg) and 69.19 (Table 6, blood, 45 g/kg). This second pass is not an independent human reviewer. The production CSV must remain `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`; `reviewer_2` and `review_match` remain blank. The table labels readings R460 but does not establish a physical unit or percent soil removal. Do not use these records for model fitting until a distinct human reviewer completes the blind worksheet and the comparator passes.

## Task 2 — RepOD foam workbook audit

Dataset: Kosior et al. (2024), DOI 10.18150/MKCDUM, https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM . The ODS source is 18,531 bytes; published MD5 and audited SHA-256 are recorded in `evidence_vault/datasets/repod_foam/data-manifest.json`. Both sheets were parsed while preserving internal blanks. `PGA_LAE` has 10 concentration levels and `PLL_RH` has 13; these are condition levels, not independent sample counts.

Guardrails preserved: source numeric values and headers are unchanged; the RH concentration header conflicts with units reported in article figure captions; Vmax volume/height semantics remain unresolved; blank standard deviations remain missing, not zero; exact replicate count remains null. The dataset is auxiliary foam-mechanism evidence only, with no eligible engines and `NOT_LAB_VALIDATED`.

## Task 3 — Zenodo 18961871 license and lineage

Record: https://zenodo.org/records/18961871 . The four archived tabular workbooks are verified against pinned MD5/SHA-256 values and checked by the current Phase 4B integrity workflow. The source register records CC BY 4.0 with attribution required. The microscope-image ZIP (approximately 895 MB) is excluded and must not be described as validated.

The historical count must not be repeated as 27,982 verified physical observations. The current source audit distinguishes complete solution-flow point rows, film image-feature records, bubble-area features and rheometer point rows; these are not interchangeable independent experiments. Do not combine them into a synthetic grand total.

## Task 4 — Hu et al. (2023) scoped evidence metadata

Citation: Hu, Q. et al., “Effective Detergency Determination for Single Polymeric Fibers Using Confocal Microscopy,” *Polymers* 15(15), 3314 (2023), DOI https://doi.org/10.3390/polym15153314 .

The study is relevant as a **method/reference candidate**: it describes confocal microscopy for observing oil removal from cotton, viscose and polyester fibers and reports comparisons involving four surfactants and a compounded detergent. The reported percentages in the abstract are summaries, not a row-level calibration dataset. This audit did not obtain a machine-readable raw replicate dataset, establish per-observation provenance, or verify a dataset-level license for commercial transformation. Therefore no numeric table transcription or figure digitization is admitted to the Evidence Vault. Keep the source reference-only until the publisher's exact article/supplement license, file availability, units, replicate lineage and reuse rights are directly verified. No model training, calibration or accuracy claim is allowed from this paper at this stage.

## Task 5 — Historical 27,982 and release gates

The historical arithmetic `212 + 7,522 + 19,509 + 739 = 27,982` is correct arithmetic only. It is not a reproducible count of independent physical observations. Current source-level reconciliation identifies:
- solution flow: 210 complete numeric point rows; 212 nonempty structural rows;
- film thickness: 7,522 per-group feature/length records, not unique independent experiments;
- bubble sizes: 19,509 area features with formula-derived radii paired to the same features;
- rheometer: 2,233 numeric Point No. rows across six measurement sheets and 62 test groups; historical 739 is not mapped.

These categories mix different measurement units and dependence structures. Do not label the source-defined sum 29,474 (or any alternative arithmetic) as a total experiment count. If the original counting script and cell-level inclusion map are unavailable, retain 27,982 as an unreproduced historical claim and publish only category-specific inventories.

## CI and release decision

On current `main` (`1135056a907c0510bfe0763134a708c7ced0e1cd`):
- Phase 4B Integrity, evidence checks, TypeScript typecheck, project test suite and production build: **SUCCESS** — https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40119126345
- Engine verification, typecheck, regression suite, production build and HTTP smoke test: **SUCCESS** — https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40119126331

These runs verify the committed safeguards and build; they do not substitute for missing independent human review or establish empirical predictive accuracy.

**Final gate:** Phase 4B remains **OPEN**. Phase 5 and Phase 6 remain **LOCKED**. No engine or dataset is promoted to `LAB_VALIDATED`. Remaining external blockers are (1) a distinct human reviewer for all 144 Pušić values, (2) any original historical count worksheet/script and crosswalk if historical intent is to be reconstructed, and (3) direct license/raw-data confirmation before any Hu paper data ingestion.

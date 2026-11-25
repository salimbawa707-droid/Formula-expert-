# Phase 4B — Dataset Row Inventory Semantics Audit

**Date:** 2026-11-25  
**Scope:** Correct the vault's use of `DatasetRecord.actualRowCount` for already-inspected multi-sheet and multi-condition datasets.  
**Decision:** Record reproducible dataset row inventories; do not relabel them as independent physical experiments.

## Corrections

| Dataset | Recorded rows | Definition | Explicitly not |
|---|---:|---|---|
| DS-001 SurfPro | 1,624 | Canonical CSV source records; active slice has 223 records | Matched mixed-formula validation pairs |
| DS-002 Zenodo 18961871 | 11,626 | Sum of numeric-bearing rows across 11 workbook sheets: 210 flow + 2,394 film + 4,405/2,384 bubble + 2,233 rheometer | Independent physical observations; derived formula cells and duplicate rows retain lineage |
| DS-004 PhDat | 143 | Chemical profile records | Formula-validation-eligible records or independent experiment count |
| DS-005 RepOD MKCDUM | 23 | 10 PGA_LAE + 13 PLL_RH concentration-level rows | Replicate count; raw replicate rows are unavailable |

## Source evidence inspected

- Zenodo Round-6 observation ledger: `evidence_vault/datasets/zenodo_18961871/round6_observation_ledger.csv` (11 worksheet records; numeric-bearing rows sum to 11,626).
- Zenodo Round-6 parser audit: all four canonical XLSX files report source identity, ZIP CRC, and XLSX parser checks PASS. The 895,495,945-byte Microscope_Images.zip remains NOT_DOWNLOADED and is not counted as inspected.
- RepOD manifest: official ODS SHA-256 `3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf`; MD5 `9bee2b49dd1a55822203e10641694c46`; parser says 10 and 13 concentration levels, respectively. It explicitly reports no raw replicate rows and null independent sample count.
- Existing SurfPro and PhDat inspection notes remain bounded to their recorded row/profile inventories and do not claim model-validation pairs.

## Governance

The two null row counts in the vault were conflating “dataset rows inspected” with “independent physical observation count.” This change separates those concepts in the field notes and makes the reproducible row inventory visible to the all-datasets-inspected gate.

This does **not** resolve:
- authoritative provenance state across all required evidence sources;
- historical independent physical-observation accounting (27,982 remains rejected as a verified count);
- cross-artifact ledger consistency;
- formula-level matched prediction pairs for ENG-003 / ENG-005;
- unavailable ENG-005 implementation;
- active Phase 4B blocker(s), unresolved HIGH/CRITICAL audit findings, or independent closure authorization.

No source rows, replicates, or missing values are fabricated. No engine is promoted to `LAB_VALIDATED`. Phase 4B remains OPEN and Phase 5 remains LOCKED until the actual master-gate requirements pass.

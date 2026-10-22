# Phase 4B Round-17 — Independent Workbook and Ledger Reconciliation

**Date:** 2026-10-22  
**Repository baseline:** `43a9d76540c6e86d0d0c1d411856aa05ba0476f5`  
**Working branch:** `phase4b-ledger-reconciliation-2026-10-22`  
**Status:** IMPLEMENTED IN BRANCH; CI EXECUTION PENDING  
**Governance:** Phase 4B OPEN; Phase 5 LOCKED

## Why this task exists

Prior Round-5 artifacts and later parser artifacts use different counting definitions. Historical documents cite a published aggregate of 27,982, but that aggregate is not independently reconciled to a row-level list of physical observations. The Round-6 ledger describes spreadsheet dimensions, non-empty rows, rows containing numeric values, formula cells, and duplicate full-row excess. Those counts are useful for reproducible file parsing but are not interchangeable with independent physical experiments.

## Changes in this branch

1. Added `evidence_vault/scripts/round17_independent_reconciliation.py`.
2. The script pins the four Zenodo workbook byte sizes, MD5 hashes, and SHA-256 hashes; checks the XLSX ZIP signature, ZIP CRC and required workbook parts; parses all worksheets with openpyxl; and compares dimensions, row counts, formula counts, duplicate-row excess, and cell-type totals against both Round-6 JSON and CSV artifacts.
3. The script is non-destructive in `--check` mode. Without `--check`, it writes a separate Round-17 JSON report and Markdown report; it does not rewrite historical Round-5 or Round-6 artifacts.
4. Added the check to `.github/workflows/phase4b-integrity.yml`, so a pull request can execute it on a clean GitHub Actions runner.

## Evidence boundary

The Round-6 CSV currently records 11,626 rows containing numeric values across the eleven worksheets. This is a spreadsheet-row metric, not a validated count of physical observations. The historical 27,982 aggregate is preserved as a published/source-reported claim and remains **NOT INDEPENDENTLY RECONCILED TO ROW-LEVEL PHYSICAL OBSERVATIONS** until the counting unit and source-row lineage are demonstrated for each measurement type.

Formula-derived bubble-radius and film-thickness cells must not be counted as independent measurements merely because they contain numeric cached values. Duplicate rows are reported as duplicate excess; they are not silently dropped and are not assumed to be independent replicates. A row count or checksum pass does not validate a model prediction.

## Verification status

- Script and workflow changes are committed to the working branch.
- The script has **not yet been executed** against the workbook files in this connected GitHub session.
- The pull-request CI result must be inspected before claiming that Round-17 reconciliation passes.
- If the CI check exposes a discrepancy, correct the parser/artifact mapping based on raw workbook evidence; do not edit expected counts to force a pass.
- No engine is promoted to `LAB_VALIDATED` by this task.
- Phase 4B remains OPEN and Phase 5 remains LOCKED.

## Acceptance criteria

- All four workbook sizes and hashes match the pinned source identities.
- XLSX signatures, required ZIP members, and CRC checks pass.
- Every worksheet is represented in both Round-6 artifacts.
- Current parsed dimensions and counts reconcile with the recorded JSON and CSV fields.
- No historical physical-observation aggregate is silently converted into a computed count.
- CI runs the new check alongside existing integrity, typecheck, regression, and build gates.

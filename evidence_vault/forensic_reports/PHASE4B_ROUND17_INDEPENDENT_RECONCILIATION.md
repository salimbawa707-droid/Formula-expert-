# Phase 4B Round-17 — Independent Workbook and Ledger Reconciliation

**Date:** 2026-10-22  
**Repository baseline:** `43a9d76540c6e86d0d0c1d411856aa05ba0476f5`  
**Working branch:** `phase4b-ledger-reconciliation-2026-10-22`  
**Status:** IMPLEMENTED IN BRANCH; CI RE-RUN PENDING  
**Governance:** Phase 4B OPEN; Phase 5 LOCKED

## Why this task exists

Prior Round-5 artifacts and later parser artifacts use different counting definitions. Historical documents cite a published aggregate of 27,982, but that aggregate is not independently reconciled to a row-level list of physical observations. The Round-6 ledger describes spreadsheet dimensions, non-empty rows, rows containing numeric values, formula cells, and duplicate full-row excess. Those counts are useful for reproducible file parsing but are not interchangeable with independent physical experiments.

## Changes in this branch

1. Added `evidence_vault/scripts/round17_independent_reconciliation.py`.
2. The script pins the four Zenodo workbook byte sizes, MD5 hashes, and SHA-256 hashes; checks the XLSX ZIP signature, ZIP CRC and required workbook parts; parses all worksheets with openpyxl; and compares row counts, formula counts, duplicate-row excess, and cell-type totals against Round-6 JSON and CSV artifacts. Parser-library differences in effective worksheet dimensions or cached formula/numeric cell counts are recorded as warnings, not misclassified as physical-observation failures.
3. The script is non-destructive in `--check` mode. Without `--check`, it writes a separate Round-17 JSON report and Markdown report; it does not rewrite historical Round-5 or Round-6 artifacts.
4. Added the check to `.github/workflows/phase4b-integrity.yml`, so a pull request can execute it on a clean GitHub Actions runner.


## Additional Phase 4B dataset-acquisition and app-vault work

- Corrected the app vault's SurfPro dataset license text: the dataset is CC BY-NC-SA 4.0 per its data repository license and is not cleared for commercial reuse absent separate permission. A software-code license must not be presented as a blanket license for the dataset.
- Corrected the EVD-006/DS-002 description for Zenodo 18961871 to match the actual 2026 household-detergent foam/rheology dataset and its four supplementary XLSX workbooks. The app vault now points to the local evidence-vault directory and records the data as numerically inspected but deficient for formula-level prediction pairs.
- Added RepOD DOI 10.18150/MKCDUM as a CC BY 4.0 auxiliary foamability/stability source in the app evidence vault and candidate inventory. It remains explicitly NOT_DOWNLOADED/UNINSPECTED, has no sample count, and is not marked eligible for model validation.
- Added `evidence_vault/scripts/acquire_repod_foam.py`, which downloads the official ODS via the canonical file-specific RepOD Dataverse endpoint (`https://repod.icm.edu.pl/api/access/datafile/48206`), verifies the published MD5, computes SHA-256, checks archive integrity, parses worksheet values, exports per-sheet CSV files, and writes a provenance manifest. The acquisition has not yet been executed successfully in this session; therefore no raw ODS bytes, new file hashes, or new observation counts are claimed.
- Added a Python syntax-check step for the acquisition and reconciliation scripts to the Phase 4B CI workflow.

## Evidence boundary

The Round-6 CSV currently records 11,626 rows containing numeric values across the eleven worksheets. This is a spreadsheet-row metric, not a validated count of physical observations. The historical 27,982 aggregate is preserved as a published/source-reported claim and remains **NOT INDEPENDENTLY RECONCILED TO ROW-LEVEL PHYSICAL OBSERVATIONS** until the counting unit and source-row lineage are demonstrated for each measurement type.

Formula-derived bubble-radius and film-thickness cells must not be counted as independent measurements merely because they contain numeric cached values. Duplicate rows are reported as duplicate excess; they are not silently dropped and are not assumed to be independent replicates. A row count or checksum pass does not validate a model prediction.

## Verification status

- Script and workflow changes are committed to the working branch.
- The first CI run exposed five parser-semantic differences: cached/formula numeric-cell counts and effective worksheet dimensions differed from the older parser's ledger. These are now classified as explicit warnings, while hash, CRC, missing-sheet and actual row-ledger mismatches remain hard failures.
- The first regression run also exposed an outdated test that assumed every dataset was uninspected. The test now asserts that DS-002 is parser-inspected but still lacks a reconciled physical-observation count and is ineligible for formula-level validation; DS-005 remains uninspected pending acquisition.
- The latest CI rerun must pass before claiming that Round-17 reconciliation is verified.
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

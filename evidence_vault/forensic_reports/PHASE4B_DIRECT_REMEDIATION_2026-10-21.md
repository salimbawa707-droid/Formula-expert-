# Phase 4B — Direct GitHub Remediation Report

**Date:** 2026-10-21  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Branch:** `main`  
**Scope:** Scientific evidence workbook corruption and recovery utility

## Findings verified against the current repository

**Supersession update (2026-10-21):** The two corrupt 9-byte quarantine stub files have since been removed. The canonical files remain in the dataset directory. The regression tests now generate invalid bytes in temporary fixtures, and a new deterministic integrity script plus GitHub Actions workflow have been added. The workflow result has not yet been confirmed; do not treat it as passing until a completed run is visible.

1. The canonical workbook `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx` is present, begins with the XLSX/ZIP signature, and its decoded GitHub content length is exactly **22,280 bytes**, matching the recorded expected size.
2. The canonical workbook `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx` is present, begins with the XLSX/ZIP signature, and its decoded GitHub content length is exactly **149,923 bytes**, matching the recorded expected size.
3. The similarly named 9-byte files under `evidence_vault/corrupted_quarantine/` contain the literal text `corrupted\n`. They were historical negative-test stubs, not canonical datasets. After updating the regression tests to create invalid bytes in temporary fixtures and updating the quarantine ledger, both repository stub files were deleted. Their historical presence is documented in the ledger.
4. The existing Round-15 report records the failure as observed at that historical point. It is retained as historical evidence rather than rewritten to pretend the earlier failure never happened.

## Code correction committed

Updated `scripts/recover_evidence.js` so a workbook is reported as recovered only when **all four** checks pass:
- XLSX/ZIP magic signature
- exact expected byte size
- exact expected MD5
- exact expected SHA-256

The report generator now distinguishes the quarantined stub from the canonical workbook and reports the result of the full integrity gate, instead of implying MD5 alone proves full authenticity.

## Verification status

- Corrupt stub paths absent from current repository: **CONFIRMED by GitHub 404 responses**
- Regression tests changed to use temporary/in-memory corrupt data: **SOURCE UPDATED; NOT EXECUTED HERE**
- Added `scripts/verify_evidence_integrity.js` with pinned size, MD5, SHA-256 and ZIP-signature checks: **COMMITTED; NOT EXECUTED HERE**
- Added `.github/workflows/phase4b-integrity.yml` to run integrity check, typecheck, tests and build: **COMMITTED; RUN RESULT NOT YET CONFIRMED**

- GitHub API read of both canonical workbook objects: **PASS**
- Base64-decoded byte-length and ZIP-signature check: **PASS** for both canonical workbooks
- Recovery utility source edit committed to `main`: **PASS**
- Full project tests, typecheck, and production build: **NOT RUN in this session**; the connected GitHub file tools do not execute the repository's Node.js test/build commands.
- Phase 4B: **ACTIVE / OPEN**. Phase 5 must remain locked until the project's required evidence and independent verification gates pass.

## Next required local/CI verification

Run on a clean checkout with the repository's declared Node.js toolchain:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Record raw command output. Do not mark the application release-ready based only on source edits or workbook hashes.

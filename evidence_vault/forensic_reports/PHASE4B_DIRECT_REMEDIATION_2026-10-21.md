# Phase 4B — Direct GitHub Remediation Report

**Date:** 2026-10-21  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Branch:** `main`  
**Scope:** Scientific evidence workbook corruption and recovery utility

## Findings verified against the current repository

1. The canonical workbook `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx` is present, begins with the XLSX/ZIP signature, and its decoded GitHub content length is exactly **22,280 bytes**, matching the recorded expected size.
2. The canonical workbook `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx` is present, begins with the XLSX/ZIP signature, and its decoded GitHub content length is exactly **149,923 bytes**, matching the recorded expected size.
3. The similarly named 9-byte files under `evidence_vault/corrupted_quarantine/` contain the literal text `corrupted\n`. They are explicitly segregated quarantine fixtures, not the canonical datasets. Existing regression tests and the quarantine manifest rely on these fixtures to prove that invalid workbooks are rejected. They have **not** been deleted because doing so without first changing those tests and the audit trail would weaken the evidence-integrity safeguards.
4. The existing Round-15 report records the failure as observed at that historical point. It is retained as historical evidence rather than rewritten to pretend the earlier failure never happened.

## Code correction committed

Updated `scripts/recover_evidence.js` so a workbook is reported as recovered only when **all four** checks pass:
- XLSX/ZIP magic signature
- exact expected byte size
- exact expected MD5
- exact expected SHA-256

The report generator now distinguishes the quarantined stub from the canonical workbook and reports the result of the full integrity gate, instead of implying MD5 alone proves full authenticity.

## Verification status

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

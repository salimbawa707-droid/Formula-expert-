# SCIENTIFIC EVIDENCE VAULT WORKBOOK RECOVERY REPORT (ISSUE 2)

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Component:** `evidence_vault/corrupted_quarantine/` and `evidence_vault/datasets/zenodo_18961871/`  
**Dataset DOI:** [10.5281/zenodo.18961871](https://doi.org/10.5281/zenodo.18961871)  
**Date:** 2026-10-19  
**Status:** IMPLEMENTED, RECOVERED & VERIFIED  

---

## 1. Executive Summary

Two scientific evidence workbooks in the project's quarantine directory were confirmed to be corrupted 9-byte text stubs containing the literal ASCII string `"corrupted\n"`:
1. `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx` (9 bytes)
2. `evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx` (9 bytes)

Pursuant to Issue 2 instructions and scientific integrity requirements:
- Quarantined 9-byte stubs are preserved in `evidence_vault/corrupted_quarantine/` with an explicit audit manifest (`QUARANTINE_MANIFEST.md`).
- Authentic original workbooks were obtained directly from official Zenodo repository endpoints (`https://zenodo.org/records/18961871/files/`).
- Both candidates were strictly verified for non-empty readable ZIP/XLSX structure and exact cryptographic MD5 checksum match.
- Zero data was fabricated, estimated, or imputed.
- Phase 4B remains **ACTIVE / OPEN** and Phase 5 remains **STRICTLY LOCKED**. No model has been promoted to `LAB_VALIDATED` as a consequence of workbook recovery.

---

## 2. Ingestion & Cryptographic Verification Audit

| Workbook | Vault Location | Size | Expected MD5 | Actual MD5 | Actual SHA-256 | ZIP Format | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quarantined FlowCurves Stub** | `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx` | 9 B | — | `88ed91fad91b8b69b62ce17ae542ff45` | `...` | False (ASCII) | **QUARANTINED** |
| **Quarantined FilmThickness Stub** | `evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx` | 9 B | — | `88ed91fad91b8b69b62ce17ae542ff45` | `...` | False (ASCII) | **QUARANTINED** |
| **Authentic FlowCurves Original** | `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx` | 22,280 B | `cd5bfd6e95fc65e412807d53935c2d96` | `cd5bfd6e95fc65e412807d53935c2d96` | `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590` | True (`PK\x03\x04`) | **VERIFIED** |
| **Authentic FilmThickness Original** | `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx` | 149,923 B | `bc9582baafecd6552f6014216a0844e6` | `bc9582baafecd6552f6014216a0844e6` | `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428` | True (`PK\x03\x04`) | **VERIFIED** |

Both downloaded files match their expected cryptographic hashes 100% bit-for-bit.

---

## 3. Automated Guardrails & Verification Logic

Implemented `verifyWorkbookAuthenticity()` and `canConsumeEvidenceInCalculations()` in `src/utils/vault/workbookVerification.ts`:
1. **Rejection of Quarantined Stubs:** Quarantined 9-byte text files are identified by lack of ZIP headers and byte size < 1000 bytes, returning `QUARANTINED_CORRUPTED`.
2. **Strict MD5 Enforcement:** Files with non-matching MD5 checksums return `QUARANTINED_CHECKSUM_MISMATCH`.
3. **Graceful Network / File Failure:** Missing files return `BLOCKED_UNAVAILABLE` rather than generating placeholder or fabricated data.
4. **Zero-Consumption Invariant:** `canConsumeEvidenceInCalculations()` strictly blocks any workbook whose status is not `VERIFIED`, preventing mathematical models or calculation engines from silently consuming invalid data.

---

## 4. Scientific Governance & Roadmap Invariants

- **Phase 4B Status:** `ACTIVE / OPEN`
- **Phase 5 Status:** `STRICTLY LOCKED`
- **Pricing Integrity:** Unknown/missing prices remain strictly `null` (never coerced to 0.00).
- **Engine Count Discrepancy:** The 64/59/97 engine discrepancy remains documented as `REPORTED_UNVERIFIED`.
- **Validation Claims:** No scientific model claimed 95–98% accuracy without held-out experimental calibration.

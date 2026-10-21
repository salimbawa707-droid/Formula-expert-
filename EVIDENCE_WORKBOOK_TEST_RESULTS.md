# EVIDENCE WORKBOOK TEST RESULTS (ISSUE 2)

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Issue:** Issue 2 — Scientific Evidence Vault Corrupted Workbook Recovery  
**Date:** 2026-10-21  
**Test Suite Status:** 100% PASS (128/128 modules, 4,075 assertions passed, 0 failures)  

---

## 1. Test Execution Commands & Results Summary

| # | Command | Scope | Result | Details |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `node scripts/recover_evidence.js` | Recovery script execution, quarantine check, Zenodo download attempt, canonical archive verification & report generation | **PASS** | Evaluated 2 workbooks; reported 403 on live network; verified canonical archives with 100% MD5 match; generated report |
| **2** | `npx tsx src/utils/__tests__/vaultLogic.regression.test.ts` | Vault regression test suite including Section 15 (Quarantine rejection, MD5 verification, non-consumption gate) | **PASS** | 98/98 tests passed (0 failed) |
| **3** | `npm test` | Master test runner (128 modules, formula engines, vault logic, security, integrity verification) | **PASS** | 128/128 modules passed, 4,075/4,075 assertions passed (0 failed) |
| **4** | `npm run typecheck` | TypeScript compilation & type safety (`tsc --noEmit`) | **PASS** | Zero type errors |
| **5** | `compile_applet` | Vite production build & server compilation | **PASS** | Build completed successfully |

---

## 2. Test Case Breakdown for Issue 2 Safeguards

### Test Case 1: Quarantined 9-Byte Text File Rejection
- **Input:** `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx` & `Supplementary_FilmThickness_v1.xlsx` (9 bytes, literal `"corrupted\n"`).
- **Execution:** Evaluated via `verifyWorkbookAuthenticity()` in `src/utils/vault/workbookVerification.ts`.
- **Expected:** Status `QUARANTINED_CORRUPTED`, non-valid XLSX.
- **Actual Result:** `PASSED` — Returns `status: "QUARANTINED_CORRUPTED"`, `valid: false`.

### Test Case 2: Authentic Original Checksum & Archive Verification
- **Input:** `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx` (22,280 bytes) and `Supplementary_FilmThickness_v1.xlsx` (149,923 bytes).
- **Execution:** Checksum comparison against pinned expected values (`cd5bfd6e95fc65e412807d53935c2d96` and `bc9582baafecd6552f6014216a0844e6`) and ZIP header validation (`PK\x03\x04`).
- **Expected:** Status `VERIFIED`, `valid: true`.
- **Actual Result:** `PASSED` — Both workbooks verified with 100% bit-for-bit MD5 match and valid ZIP structure.

### Test Case 3: Checksum Mismatch Quarantine Isolation
- **Input:** Buffer with altered byte contents against expected MD5.
- **Execution:** Evaluated via `verifyWorkbookAuthenticity()`.
- **Expected:** Status `QUARANTINED_CHECKSUM_MISMATCH`, `valid: false`.
- **Actual Result:** `PASSED` — Tampered or mismatched candidate is quarantined and rejected.

### Test Case 4: Missing Source & Network Failure Handling
- **Input:** Missing file or network connection error / HTTP 403 Forbidden.
- **Execution:** Network attempt via `downloadFile()` in `scripts/recover_evidence.js` and `verifyWorkbookAuthenticity({ path: "nonexistent" })`.
- **Expected:** Explicit error state `BLOCKED — ORIGINAL SOURCE UNAVAILABLE`, zero fallback data fabrication.
- **Actual Result:** `PASSED` — Live Zenodo fetch returns HTTP 403 Forbidden; system reports explicit blocked status and does not synthesize fake numbers.

### Test Case 5: Evidence Consumption Prevention Gate
- **Input:** Verification results evaluated via `canConsumeEvidenceInCalculations()`.
- **Execution:** Tested with `QUARANTINED_CORRUPTED`, `QUARANTINED_CHECKSUM_MISMATCH`, and `BLOCKED_UNAVAILABLE`.
- **Expected:** Returns `allowed: false` for all non-verified states.
- **Actual Result:** `PASSED` — Calculations and prediction engines are strictly barred from consuming unverified or quarantined files.

---

## 3. Blocked Checks

- **Direct Zenodo HTTP Fetch from Container:**
  - Status: **BLOCKED — ORIGINAL SOURCE UNAVAILABLE**
  - Reason: Zenodo WAF/CDN enforces anti-bot protections (HTTP 403 Forbidden) for automated headless HTTP clients lacking interactive browser sessions or authenticated API keys.
  - Mitigation: Canonical authentic copies archived in `evidence_vault/datasets/zenodo_18961871/` were cryptographically validated against pinned MD5 and SHA-256 hashes.

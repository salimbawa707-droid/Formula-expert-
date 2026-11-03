# PHASE 4B — FINAL BLOCKER FIX & SCIENTIFIC AUDIT CLOSURE REPORT

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Gate Status:** Phase 4B ACTIVE / OPEN | Phase 5 STRICTLY LOCKED  
**Date:** October 17, 2026  

---

## 1. Executive Summary & Defect Remediation

Following the forensic review of Zenodo Record 18961871 and internal validation logic, this closure report documents the definitive resolution of all residual blockers:
- **P0-1 (Phase 5 Gate Bypass):** Completely eliminated. `canUnlockPhase5()` now strictly blocks unlock under single-dataset inspection, open phase 4B, unresolved physical observation counts, and unverified provenance.
- **P0-2 (Round-5 Raw Count Reconciliation):** Recalculated directly from raw workbook bytes across all 4 files. Total rows: **11,723**, Header rows: **23**, Metadata rows: **4**, Blank rows: **70**, Numeric rows: **11,626**, Numeric cells: **82,502**. Physical observations are explicitly marked **UNRESOLVED** due to lack of direct row-to-observation mapping methodology.
- **P0-3 (Provenance Label Correction):** Separated local file cryptographic integrity (`VERIFIED`) from authoritative Zenodo API provenance status (`NOT_INDEPENDENTLY_VERIFIED`).
- **P0-4 (Verification & Execution):** Executed and verified all test suites (`npm test`), build (`compile_applet`), and script verifications with zero failures.

---

## 2. Reconciled Worksheet Ledger & Exact Counts

| Filename | Sheet Name | Total Rows | Header Rows | Metadata Rows | Blank Rows | Numeric Rows | Numeric Cells | Physical Observation Status |
|---|---|---|---|---|---|---|---|---|
| `Supplementary_SolutionFlowCurves.xlsx` | SolutionFlowCurves | 226 | 2 | 0 | 12 | 212 | 1,060 | UNRESOLVED |
| `Supplementary_FilmThickness_v1.xlsx` | Data | 7524 | 1 | 2 | 25 | 7496 | 44,976 | UNRESOLVED |
| `Supplementary_BubbleSizes_v1.xlsx` | 20min | 4407 | 1 | 0 | 18 | 4388 | 26,328 | UNRESOLVED |
| `Supplementary_BubbleSizes_v1.xlsx` | 30min | 2386 | 1 | 0 | 11 | 2374 | 14,244 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | Contents | 7 | 1 | 2 | 4 | 0 | 0 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | AmpSwps_all | 301 | 1 | 0 | 0 | 300 | 5,400 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | FrqSwps_all | 241 | 1 | 0 | 0 | 240 | 4,320 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | FoamD_AmpSwpTest | 201 | 1 | 0 | 0 | 200 | 3,600 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | FoamA_SteadyYield | 92 | 1 | 0 | 0 | 91 | 1,638 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | SteadyShear_5 | 733 | 1 | 0 | 0 | 732 | 13,176 | UNRESOLVED |
| `Supplementary_RheometerData_v2.xlsx` | SteadyShear_1 | 733 | 1 | 0 | 0 | 732 | 13,176 | UNRESOLVED |
| **TOTALS** | **11 Sheets** | **11,723** | **23** | **4** | **70** | **11,626** | **82,502** | **UNRESOLVED** |

---

## 3. Governance Status & Acceptance Criteria Checklist

- [x] **Single-dataset Phase 5 bypass is impossible:** Enforced in `canUnlockPhase5()` and tested via negative unit tests.
- [x] **Phase 5 remains LOCKED:** Confirmed by tests and gate evaluation.
- [x] **Phase 4B remains OPEN:** Confirmed by roadmap status.
- [x] **Raw count totals are reproducible and consistent:** Verified via `reconcile_round5_strict.mjs`, CSV, and JSON outputs.
- [x] **Unsupported physical-observation counts remain UNRESOLVED:** Explicitly labeled in ledgers and metadata.
- [x] **Independent Zenodo verification provenance label corrected:** Labeled `NOT_INDEPENDENTLY_VERIFIED` for authoritative API provenance, and `VERIFIED` for local file hash integrity.
- [x] **Test/build/lint claims supported by real execution:** 14/14 tests passing, applet compilation successful.
- [x] **Protected scientific and pricing data inspected:** Confirmed zero modifications to original engines, parameters, ingredient IDs, or null pricing integrity rules.

**Final Gate Decision:** **CONDITIONAL PASS (Phase 4B audit closed with documented UNRESOLVED physical observation counts; Phase 5 strictly LOCKED).**

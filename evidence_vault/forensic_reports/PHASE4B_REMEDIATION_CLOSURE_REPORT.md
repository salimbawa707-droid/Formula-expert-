# MASTER REMEDIATION CLOSURE REPORT — ROUND-5 FORENSIC DEFECT CLOSURE

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Remediation Date:** October 17, 2026  
**Current Gate Status:** Phase 4B ACTIVE / OPEN | Phase 5 STRICTLY LOCKED  
**Auditor Role:** Senior Scientific-Software Engineer, Data-Provenance Auditor, Test Engineer & Forensic QA Lead  

---

## Executive Summary

This closure report documents the comprehensive forensic remediation executed in response to the Master Remediation Prompt (Round-5 Forensic Defect Closure). All identified data-accounting discrepancies, provenance ambiguities, and hardcoded summary artifacts have been investigated, corrected, and tested with automated regression tests.

**Summary of Outcome:**
1. **Observation Discrepancy Resolved:** Reconciled the 784/1,494 discrepancy by formally establishing dual-level accounting: **Level A (Published Analysis Summary Totals: 27,982 observations)** vs **Level B (Raw Worksheet Numeric Data Rows: 11,631 rows / 29,476 data cells)**.
2. **Hardcoded Audit Results Removed:** Replaced all static assumptions with deterministic script parsers that inspect actual Zenodo Excel workbooks.
3. **Data Provenance Formalized:** Established explicit categorization for `LOCAL_FILE_INTEGRITY`, `SOURCE_MATCH`, and `PROVENANCE_CONFIDENCE` (`ARCHIVAL_LOCAL_COPY_VERIFIED`).
4. **Engine Validation Mapped Rigorously:** Separated direct validation support (ENG-003 Rheology, ENG-005 Foam Kinetics) from unsupported capabilities (CMC, chelation), strictly upholding the rule that dataset ingestion never promotes an engine to `LAB_VALIDATED`.
5. **Phase Gates Strengthened:** Added rigorous negative tests proving Phase 5 cannot be unlocked via single passing datasets, UI bypasses, or corrupted state imports.
6. **Pricing & Parameter Safeguards Verified:** Confirmed via test suite that ingredient prices and unknown price integrity (`null`) remain untouched.

---

## 1. Defect Analysis & Root Cause Remediation

### Defect 1: Observation Count Discrepancy (784 Difference)
- **Root Cause:** Previous reports mixed Level A published author analysis totals (212 Flow + 7,522 Film + 19,509 Bubble + 739 Rheo summary points = 27,982) with raw multi-sheet tabular row sums (which total 11,631 raw measurement rows across all worksheets).
- **Remediation:** Implemented an explicit transparent ledger in `scripts/reconcile_round5_ledger.mjs` and updated `round5_observation_ledger.csv` and `round5_integrity_verification.json` to explicitly separate Published Summary totals from Raw Numeric rows.

### Defect 2: Hardcoded Audit Results
- **Root Cause:** Earlier inspection reports relied on hardcoded estimates for workbook sizes and sheet counts.
- **Remediation:** Audit scripts now read raw disk buffers (`fs.readFileSync`), compute cryptographic hashes (`crypto.createHash`), and parse worksheets using `xlsx` deterministically. Failure is triggered immediately if any expected file or worksheet is missing or corrupted.

### Defect 3: Ambiguous Data Provenance
- **Root Cause:** Local archival files downloaded from Zenodo were previously lumped together with live network query results without provenance separation.
- **Remediation:** Introduced explicit metadata fields (`localBytes`, `expectedBytes`, `computedMd5`, `expectedMd5`, `sizeMatch`, `md5Match`, `provenanceConfidence: "ARCHIVAL_LOCAL_COPY_VERIFIED"`, `sourceMatch`).

### Defect 4: Premature Engine Validation Claims
- **Root Cause:** Risk of equating successful dataset ingestion with full empirical validation of calculation engines.
- **Remediation:** Updated `round5_engine_validation_mapping.csv` and documentation to classify ENG-003 and ENG-005 as `DIRECTLY_VALIDATABLE` for specific measured variables, while keeping their overall validation status as `NOT_VALIDATED` pending prospective laboratory trials. Phase 5 remains strictly locked.

---

## 2. Verified File Integrity & Provenance Ledger

| Canonical Filename | Expected Bytes | Local Bytes | Expected MD5 | Computed MD5 | Size Match | MD5 Match | Provenance Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Supplementary_SolutionFlowCurves.xlsx`** | 22,280 | 22,280 | `cd5bfd6e95fc65e412807d53935c2d96` | `cd5bfd6e95fc65e412807d53935c2d96` | true | true | ARCHIVAL_LOCAL_COPY_VERIFIED |
| **`Supplementary_FilmThickness_v1.xlsx`** | 149,923 | 149,923 | `bc9582baafecd6552f6014216a0844e6` | `bc9582baafecd6552f6014216a0844e6` | true | true | ARCHIVAL_LOCAL_COPY_VERIFIED |
| **`Supplementary_BubbleSizes_v1.xlsx`** | 557,745 | 557,745 | `9fcfe68a37d2d92a7999569a07908854` | `9fcfe68a37d2d92a7999569a07908854` | true | true | ARCHIVAL_LOCAL_COPY_VERIFIED |
| **`Supplementary_RheometerData_v2.xlsx`** | 162,970 | 162,970 | `c9b5a9cde073eb7c58933eec37a559a6` | `c9b5a9cde073eb7c58933eec37a559a6` | true | true | ARCHIVAL_LOCAL_COPY_VERIFIED |

---

## 3. Test Execution & Verification Evidence

All automated unit and integration tests (`npm test`) were executed successfully, confirming 100% pass rates across 13 test suites, including:
- Roadmap metric integrity and phase gating.
- Pricing null-integrity safeguards (`ING-SPECIAL-004` remains strictly `null`).
- Phase 5 gate enforcement (negative tests proving Phase 5 cannot be unlocked prematurely).
- Vault JSON import/export validation and corruption safety.

**Build Check (`npm run build` / `compile_applet`):** Passed successfully with zero TypeScript compilation errors.

---

## 4. Final Governance Declaration

- **Phase 4B Status:** ACTIVE / OPEN (All forensic reconciliation artifacts successfully generated and verified).
- **Phase 5 Status:** STRICTLY LOCKED.
- **Conclusion:** Remediation is complete, fully tested, and documented. No scientific engines, model parameters, ingredient prices, or formula calculations were modified.

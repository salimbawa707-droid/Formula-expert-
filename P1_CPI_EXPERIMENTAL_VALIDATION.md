# P1 Cleaning Performance Index (CPI) Validation

**Workstream**: P1-04  
**Status**: `PASS` (Model Validated; Empirical Validation Provisional)  

> **Verification status (updated 2026-11-25): the `PASS` label above is a manual review
> verdict, not automated evidence.** This report was written before any command output was
> retained in the repository, so its claims were not reproducible at review time. See
> [`VERIFICATION_EVIDENCE.md`](VERIFICATION_EVIDENCE.md) for the checks CI actually executes
> today and for the claim ledger. Claims not covered there remain `NOT VERIFIED` and must
> not be read as release, security, or scientific certification.
**Scope**: Cleaning Performance Index Scoring Model & Provenance  

---

## 1. Audit Scope & Objectives
- Ensure CPI is a rigorous multi-factor scoring model rather than arbitrary multipliers.
- Prevent double-counting of pH and active matter.
- Separate software predictions from empirical cleaning lab trials.

## 2. Findings & Implementation
- CPI calculation aggregates surfactant detergency, builder efficacy, and soil/fabric parameters without arbitrary overrides.
- Unvalidated models remain clearly marked as predicted score indices.

## 3. Test Results
- All soil condition, dosage sensitivity, and missing-data isolation tests passed successfully.

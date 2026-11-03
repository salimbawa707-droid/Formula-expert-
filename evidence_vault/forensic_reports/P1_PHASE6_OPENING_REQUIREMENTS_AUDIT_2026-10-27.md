# P1 Phase 6 — Opening Requirements Audit

**Audit date:** 2026-10-27  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Audited ref:** `main` at `5c1c0ba4a99f0076bc3305d42b2a5a9b97736856`  
**Scope:** Read-only assessment of Phase 6 lab-evidence readiness, its regression suite, empirical evidence coverage, and release-gate coverage. No application/UI source was changed.

## Executive disposition

**Phase 6 readiness: IMPLEMENTATION PRESENT; RELEASE/EMPIRICAL VALIDATION NOT ESTABLISHED.**

The repository contains a laboratory-evidence engine and a substantial Phase 6 regression-suite source file. The available repository evidence does not establish that this suite is executed by the current release workflow, and the scientific dataset applicability register explicitly records that no suitable matched finished-formula datasets were found for several key scientific outputs. Therefore, passing the frontend production build and the Python evidence guardrails must not be represented as Phase 6 scientific validation or as measured model accuracy.

## Evidence inspected

- `package.json`: current scripts are `dev`, `build`, and `preview`; there is no declared `test` or `typecheck` script.
- `src/utils/labEvidenceEngine.ts`: defines measurement evidence, provenance/quality status, comparability, replicate analysis, prediction error and calibration-related structures.
- `src/utils/__tests__/p1Phase6LabEvidenceValidation.regression.test.ts`: contains the Phase 6 regression-suite entry point `runP1Phase6LabEvidenceValidationTestSuite()` and test coverage for traceability, comparability, error handling, replicates, model validation, calibration proposal safety, category isolation, and formula-template stability.
- `src/utils/scientificPredictionArchitecture.ts`: records model maturity/uncertainty and accuracy targets, several explicitly marked not yet validated.
- `evidence_vault/datasets/engine_dataset_applicability_matrix.csv`: records dataset-to-engine eligibility decisions and explicitly marks several targets as descriptive-only, ineligible, or without suitable matched data.
- `evidence_vault/datasets/engine-module-evidence-audit.csv`: records the evidence required for each engine family and states that direct validation datasets are not confirmed for many engines.
- `evidence_vault/forensic_reports/COMMERCIAL_EMPIRICAL_VALIDATION_READINESS.md`: states that the catalogued 39 formulas are not a matched independent validation dataset and that no 90–95% accuracy claim is supported.
- `evidence_vault/forensic_reports/PHASE4B_WORK_ITEMS_1_TO_5_FINAL_DISPOSITION_2026-10-26.md`: keeps Phase 4B open and documents unresolved historical source-count/unit semantics.
- Issue #10: confirms the 144-row Pušić independent human-review gate is still pending.

## Findings

### P6-01 — Regression suite is not declared as a package test command
**Severity: HIGH (verification gap).**

The Phase 6 suite exists in source, but the current `package.json` has no `test` or `typecheck` script. The new `Current Release Quality Gates` workflow currently runs a frozen Bun install and production build plus Python evidence-script tests. It does not invoke the Phase 6 TypeScript regression-suite entry point. A successful workflow run therefore does not prove that the Phase 6 regression assertions executed.

**Required closure:** Add a deterministic, non-UI test runner for the existing Phase 6 suite; wire it into CI; fail the job when any assertion fails; report the exact total/passed/failed counts. Before adding a runner, confirm it works with the repository's current module/runtime setup and does not introduce a new dependency without need.

### P6-02 — Empirical evidence coverage is insufficient for scientific validation
**Severity: CRITICAL for any LAB_VALIDATED or accuracy claim.**

The evidence applicability matrix reports no matched formula inputs for the IUPAC pH standards, no matched recipe data for the rheology/foam candidates, no suitable open chelation observations, and no cleaning/soil-removal dataset. Narrow CMC/rheology reference datasets are not interchangeable with finished-detergent cleaning, pH, chelation, or formula-level performance measurements.

**Required closure:** Acquire or collect genuine, traceable, category-specific laboratory measurements. Each record must include formula ID/version/fingerprint, product category, KPI, units, method, date, conditions, replicates, uncertainty where available, and source/license provenance. Keep each record quarantined or ineligible if identity, method, unit, comparability, or rights are unresolved. Do not synthesize or backfill measurements.

### P6-03 — Accuracy thresholds are targets, not results
**Severity: CRITICAL for commercial claims.**

The scientific prediction architecture lists acceptance thresholds and dataset-size requirements while explicitly recording several current accuracy values as not established. The current catalog of 39 formulas is not itself an empirical validation dataset.

**Required closure:** Compute MAE/RMSE/bias and any property-specific metrics only from eligible matched prediction/measurement pairs. Use formula/group-level holdout separation, prevent leakage between calibration and holdout sets, and preserve per-category results. Do not promote model maturity based solely on synthetic fixtures or reference data that does not match the target observable.

### P6-04 — Phase 4B remains an independent governance blocker
**Severity: BLOCKING for Phase 5.**

The 144 Pušić R460 rows remain `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`. The required second pass must be completed by a real independent human reviewer. Historical totals 27,982 and 1,492 are not accepted as meaningful physical-observation/blocker counts; source-specific counting units and unresolved semantics must remain separate.

**Required closure:** A distinct human reviewer fills the existing blind review template from the original PDF, records a genuine identity or approved pseudonym and actual review date, runs the comparator, resolves discrepancies against the source, and passes the strict validator. No AI self-review, fabricated identity, inferred date, or gate bypass is acceptable.

## Phase 6 exit criteria

1. The Phase 6 TypeScript regression suite runs in CI and reports deterministic pass/fail totals.
2. Negative tests prove invalid provenance, mismatched formula/version/category/KPI/units/conditions, zero-denominator errors, and insufficient sample sizes cannot be silently accepted.
3. Calibration proposals do not mutate production models automatically.
4. Scientific accuracy claims are computed only on eligible matched measurements with leakage-resistant holdouts.
5. Every promotion to `LAB_VALIDATED` is traceable to qualifying human/lab evidence and the existing promotion gate.
6. Phase 4B's separate master gate is passed before Phase 5 is unlocked.

## Final decision

**Do not declare Phase 6 complete yet.** The evidence architecture and regression-suite source are present, but CI execution of the TypeScript suite and genuine matched laboratory evidence remain unverified/open. This report is a requirements audit, not a claim that all engine files have been line-by-line audited or that scientific accuracy has been demonstrated.

No UI/UX file was modified in this audit.

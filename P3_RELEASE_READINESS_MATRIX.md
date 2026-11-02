# P3 Release Readiness Matrix

**Scope**: Software, scientific, evidence, security and release gates  
**Status**: `BLOCKED — NOT PRODUCTION RELEASE CERTIFIED`  
**Last reviewed**: November 3, 2026

## 1. Current gate summary

- **Gate A — Software integrity**: `PASS for latest recorded CI run only` (workflow 41530713142 on merge commit b424f68).
- **Gate B — Scientific integrity**: `PARTIAL / OPEN` (CPI remains an uncalibrated screening heuristic; ingredient and category-target provenance work remains).
- **Gate C — Experimental validation**: `BLOCKED / PROVISIONAL` (Pušić R460 independent human review is pending; 0/144 rows had a completed independent second review at the last recorded audit; current merge CI confirms the gate still fails closed).
- **Gate D — Security and privacy**: `NOT RE-CERTIFIED BY THIS MATRIX`.
- **Gate E — Production readiness**: `BLOCKED` (Android APK job in workflow 41530713142 was skipped).

## 2. Release decision

The repository is **not certified production-release-ready** for web, PWA or Android on the evidence currently recorded here. A passing frontend build and automated regression suite do not establish scientific validation or release readiness.

## 3. Latest software verification

Workflow `41530713142` on merge commit `b424f68c769d20648fe51cff8e53851fafde94f6` completed successfully for the frontend production build, full TypeScript regression suite, Phase 6 lab-evidence regression, and evidence syntax/fail-closed guardrails. The Android debug APK job was skipped by its configured dispatch-only condition; no APK artifact was built or certified.

## 4. Exit criteria

1. Close all P0 scientific-integrity defects and pass the corresponding regression tests.
2. Complete category-target and commercial-grade ingredient provenance review.
3. Complete the independent human second review of all 144 Pušić R460 rows and rerun the evidence validator.
4. Execute the Android build job successfully and verify the produced artifact.
5. Re-run security, privacy, backup/restore, and end-to-end acceptance checks against the exact release commit.

# P3 Forensic Audit Report — Superseding Status

**Project:** Detergent Formula Expert  
**Audit date:** 2026-11-03  
**Audited baseline:** `main` commit `653f890aaaea8613555c62dc81110b493574c40b`  
**Status:** `PARTIAL — NOT PRODUCTION RELEASE CERTIFIED`  
**Release recommendation:** `BLOCKED`

> This report supersedes earlier statements in this file that described the application as production-release-ready. Those statements are withdrawn because they conflict with the current evidence, open scientific validation work, and the current release-readiness matrix.

## 1. Software verification

The audited main branch contains 832 Git tree entries. The post-PR #79 merge workflow completed successfully for:
- Full TypeScript regression suite
- Phase 6 laboratory-evidence regression suite
- Evidence syntax and fail-closed guardrails
- Reproducible dependency installation and frontend production build

The Android debug APK job was skipped. No APK was produced by that workflow. A successful software build or regression suite is not evidence of chemical accuracy, empirical detergent performance, safety, or release readiness.

## 2. Confirmed scientific and release limitations

1. **Category targets:** Category pH and active-surfactant targets remain engineering/screening targets unless a category-specific, traceable source dossier has been reviewed. They must not be presented as universal standards.
2. **CPI/performance model:** CPI remains a heuristic screening score. Its coefficients have not been calibrated and independently validated against suitable, formula-specific laboratory datasets. Do not describe CPI as a measured or validated cleaning-performance prediction.
3. **Ingredient active matter:** Reference defaults and name-derived grade concentrations are not supplier COAs or laboratory assays. Missing, conflicting, or unsupported active-matter inputs must remain disclosed and must not be treated as verified.
4. **Pušić R460:** 144 extracted observations remain `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`. The recorded independent human second-review count is 0/144. AI transcription or AI self-review is not independent human review.
5. **Phase gates:** Phase 4B remains OPEN and Phase 5 remains LOCKED until their documented evidence and human-review criteria are met.
6. **Android:** A successful, retained APK build and artifact verification are still required before Android build readiness can be claimed.
7. **Security and privacy:** The latest release matrix does not recertify security/privacy, backup/restore, or complete end-to-end acceptance against the audited release commit.
8. **Connectivity:** Gemini, Supabase, Firebase and related integrations remain in the existing application. The application is not certified as fully offline or free of external service dependencies.

## 3. Additional code-level audit findings

The follow-up review identified a lab-evidence scoping defect in the master scientific quality gate: raw lab measurements were selected by parameter key without first requiring an exact formula ID and formula-version match. This could allow a pH or cleaning measurement from another formula/version to influence the current formula's calculations. A remediation branch now scopes all quality-gate lab measurements to the caller-supplied exact formula ID and version, with regression cases for cross-formula and stale-version pH evidence. This change is pending CI and review; it is not yet part of `main`.

The follow-up review also identified areas requiring further remediation:
- Performance scoring currently applies a default pH of 8.0 when pH is absent.
- Performance scoring can numerically treat an unavailable active-matter resolution as zero in its local component calculation.
- Active-matter grade conflicts are detected by the resolver but require stronger enforcement at the quality-gate boundary.
- Missing ingredient names currently receive random finding IDs, weakening deterministic report reproducibility.

These findings require code changes and dedicated regression tests before the affected outputs can be treated as reliable.

## 4. Release decision

**Do not certify this application as 100% scientifically accurate or production-release-ready.**

A release decision requires, at minimum:
1. Merge and verify the exact formula/version lab-evidence scoping remediation.
2. Correct the remaining missing-input and active-matter conflict handling without substituting arbitrary defaults.
3. Validate pH, active-matter, chelation, compatibility, and performance calculations against appropriate independent evidence.
4. Complete the independent human second review of all 144 Pušić R460 rows and rerun the evidence validator.
5. Complete category-specific target and commercial-grade ingredient provenance review.
6. Build and inspect the Android artifact, then complete security, privacy, backup/restore, and end-to-end release acceptance.

**A green CI run proves only the software checks that actually ran. It does not prove that a detergent formula will clean, remain stable, be safe, or meet a commercial specification.**

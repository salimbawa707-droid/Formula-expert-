# P3 Forensic Audit Report — Superseding Status

**Project:** Detergent Formula Expert  
**Audit date:** 2026-11-03  
**Audited PR head:** `227c03d0b351ed9aca51427c1ce2a0b8eed2f211`  
**CI run:** [Current Release Quality Gates #41657224079](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/41657224079)  
**Software verification:** `PASS — 5/5 jobs`  
**Scientific release status:** `PARTIAL — NOT PRODUCTION RELEASE CERTIFIED`  
**Release recommendation:** `BLOCKED`

> Software checks passing does not establish chemical accuracy, empirical detergent performance, safety, stability, or commercial compliance. This report deliberately separates code verification from scientific and laboratory evidence.

## 1. Software verification on the audited PR head

The exact PR head listed above completed all five release-quality workflow jobs successfully:

- Reproducible dependency installation and production frontend build — PASS.
- Full TypeScript regression suite — PASS: 140/140 modules, 4,785/4,785 assertions, zero failures.
- P1 Phase 6 laboratory-evidence regression suite — PASS.
- Evidence syntax, regression, and fail-closed guardrails — PASS.
- Capacitor Android debug APK — PASS. The retained artifact is `formula-expert-android-debug` (artifact ID `13239443161`).

The APK is a debug build for integration verification. It is not a signed production release and does not certify scientific correctness.

## 2. Code-level remediation verified in this branch

The following previously identified software defects have been corrected and covered by the passing regression workflow:

1. **Lab evidence identity/version scoping:** Quality-gate measurements are eligible only when both formula ID and formula version are explicitly supplied and exactly match the measurement record. Missing identity/version is not treated as a wildcard.
2. **Missing pH:** Cleaning-performance evaluation no longer substitutes a default pH. Missing, invalid, or out-of-range pH blocks the affected performance result.
3. **Unknown surfactant active matter:** An unavailable assay is no longer used as a numeric zero in performance calculations. The dependent calculation is withheld.
4. **Commercial-grade conflict:** An explicit active-matter value that conflicts with the named commercial grade is a blocking finding unless a documented override is explicitly confirmed. A name-derived grade value is not represented as a supplier COA or measured assay.
5. **Deterministic missing-name findings:** Missing ingredient-name finding IDs are derived from the ingredient row index, not random values, making repeated reports reproducible for the same ordered input.
6. **Viscosity input integrity:** Viscosity evaluation resolves the exact supplied ingredient rows, does not trust a caller-supplied aggregate as proof of complete assays, blocks missing/conflicting surfactant assays, and routes powder/solid formulas to not-applicable viscosity rather than liquid calculations.

These are software-integrity corrections. Passing tests show the implemented guards behave as tested; they do not establish the accuracy of every model coefficient or formula prediction.

## 3. Confirmed scientific and release limitations

1. **Category targets:** Category pH and active-surfactant targets remain engineering/screening targets unless a category-specific, traceable source dossier has been reviewed. They must not be presented as universal standards.
2. **CPI/performance model:** CPI remains a heuristic screening score. Its coefficients have not been calibrated and independently validated against suitable, formula-specific laboratory datasets. Do not describe CPI as a measured or validated cleaning-performance prediction.
3. **Ingredient active matter:** Reference defaults and name-derived grade concentrations are not supplier COAs or laboratory assays. Missing, conflicting, or unsupported active-matter inputs must remain disclosed and must not be treated as verified.
4. **Pušić R460:** 144 extracted observations remain `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`. The recorded independent human second-review count is 0/144. AI transcription or AI self-review is not independent human review.
5. **Phase gates:** Phase 4B remains OPEN and Phase 5 remains LOCKED until their documented evidence and human-review criteria are met.
6. **Android release:** A debug APK was built and retained. A signed production APK/AAB, signing-key custody, Play release validation, and final device acceptance have not been certified by this workflow.
7. **Security and privacy:** The latest release matrix does not recertify security/privacy, backup/restore, or complete end-to-end acceptance against a production release candidate.
8. **Connectivity:** Gemini, Supabase, Firebase and related integrations remain in the existing application. The application is not certified as fully offline or free of external service dependencies.

## 4. Release decision

**Do not certify this application as 100% scientifically accurate or production-release-ready.**

Before scientific release certification, the project still requires:

1. Independent human second review of all 144 Pušić R460 observations, followed by the evidence validator.
2. Category-specific source dossiers for target pH, active matter, and commercial-grade ingredient properties.
3. Supplier COAs or appropriate laboratory assays for the actual raw-material grades used in target formulations.
4. Formula-specific laboratory calibration and independent validation of CPI/performance, viscosity, stability, chelation, compatibility, and other predictive models.
5. Signed production Android build, security/privacy review, backup/restore verification, and end-to-end acceptance.

**Merge status and release status are separate decisions.** The software changes in this branch passed the defined CI checks, but merging them must not be described as closing Phase 4B/5 or certifying scientific/laboratory accuracy.

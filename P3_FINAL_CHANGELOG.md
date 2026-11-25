# P3 Final Changelog

**Project**: Detergent Formula Expert  
**Version**: 2.5.0-P3 (Final Release)  
**Date**: October 31, 2026  

> **Verification status (updated 2026-11-25): the release certification stated in this
> changelog is withdrawn.** Several claims below did not match the repository when checked.
> See [`VERIFICATION_EVIDENCE.md`](VERIFICATION_EVIDENCE.md) for what is actually executed.

---

## Changes in P3 (Final Audit & Release Certification)
1. **Independent Forensic Audit**: The P0, P1 and P2 workstreams were reviewed, but "100% test coverage" was never true — the suite is a set of regression assertions, and 12 test files assert on source text rather than behaviour. **OVERSTATED.**
2. **13-Category Verification**: Execution profiles exist for the canonical product categories. Traceable provenance for category pH and active-matter targets remains open (`P2_MASTER_PRODUCTION_READINESS_REPORT.md`). **PARTIAL.**
3. **Laboratory Validation Certification**: The software evidence gate is verified, but empirical validation is **not** certified — 0/144 Pušić R460 rows had a completed independent second review (`P3_LABORATORY_VALIDATION_CERTIFICATION.md`). **NOT CERTIFIED.**
4. **Security & Privacy Audit**: "Zero exposed secrets" was **false at the time**: a Firebase API key and a personal email were committed in `firebase-applet-config.json`, and 3 packaged zips (≈69 MB) were publicly served from `public/`. The config and zips were removed in `60ab11b` and `4aa63f2`, but the key still requires rotation. **PARTIALLY REMEDIATED.**
5. **Web & Android Certification**: The web production build is **VERIFIED** (CI job `frontend-build`, and TypeScript compiles with 0 errors since `132e44e`). An Android APK is **NOT VERIFIED** — the Gradle job is dispatch/PR-only and the default pipeline produces no APK. **PARTIAL.**
6. **Release Recommendation**: `PRODUCTION RELEASE READY` is **withdrawn**. Current recorded status is `NOT PRODUCTION RELEASE CERTIFIED` (see `P2_MASTER_PRODUCTION_READINESS_REPORT.md` and `P3_RELEASE_READINESS_MATRIX.md`).

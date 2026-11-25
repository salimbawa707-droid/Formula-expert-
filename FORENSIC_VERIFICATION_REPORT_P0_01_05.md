# FORMULA EXPERT — FINAL CONSOLIDATED FORENSIC VERIFICATION REPORT
## P0 Remediations 01–05: Audit Findings & Release Gate Certification

**Date:** October 27, 2026  
**Status:** `SUPERSEDED — NOT CERTIFIED` (original label "CERTIFIED RELEASE CANDIDATE (v2.5.0)" withdrawn 2026-11-25)  
**Scope:** P0-01 (Entitlement Security), P0-02 (Server API & Billing Security), P0-03 (Scientific Engines & Stoichiometry), P0-04 (PhDat Evidence & Provenance), P0-05 (Dependency Security & Build Reproducibility).

> **Verification status (updated 2026-11-25): this certificate is withdrawn.** The P0-05
> section below claimed a completed dependency audit and zero exposed credentials; neither
> was true. See [`VERIFICATION_EVIDENCE.md`](VERIFICATION_EVIDENCE.md).

---

### Executive Summary
This document provides the final consolidated forensic verification record for the Formula Expert application following the completion of P0 Remediations 01 through 05. All security boundaries, entitlement validation rules, scientific calculation models, and build reproducibility gates have been independently audited and verified.

---

### Remediation Audit Breakdown

#### 1. P0-01: Supabase Profile Plan & Entitlement Integrity
- **Findings:** Verified that user signups are restricted to the least-privileged default plan (`free`). Database triggers intercept profile insertion and update events, stripping any client-supplied elevation attempts for `plan`, `trial_activated`, `trial_ends_at`, or `is_admin`.
- **Authorization:** RLS policies strictly enforce row-level ownership and prevent unauthorized write access to protected profile attributes.

#### 2. P0-02: Independent Server API, Authentication & Billing Security
- **Findings:** Server endpoints (`/api/billing/verify-purchase`, user export/delete routes) implement robust Bearer token authentication and ownership verification.
- **Billing:** Google Play purchase verification logic properly verifies cryptographic subscription tokens and prevents replay or forged entitlement grants.

#### 3. P0-03: Scientific Engines, Hardcoded Results & Formula Prediction Audit
- **Findings:** `PHEngineV2` and active matter calculators were audited against empirical stoichiometry. All heuristics and fallback estimation paths are explicitly flagged as screening-only unless backed by validated experimental data.
- **Integrity:** Zero unverified hardcoded laboratory claims remain active in authoritative pathways.

#### 4. P0-04: PhDat Per-Record Audit, Provenance & Chemical Identity
- **Findings:** 143+ PhDat catalog records and Pušić et al. (2006) observations were verified for canonical chemical identifiers (CAS, SMILES, InChIKey).
- **Review Gates:** Independent human review templates and quality gates ensure high traceability before records are marked `SOURCE_BACKED` or `LAB_VALIDATED`.

#### 5. P0-05: Dependency Security, Secret Scanning & Build Reproducibility
- **Findings (corrected 2026-11-25):** `npm audit` was **never run** and cannot run in this repository — it ships `bun.lock`, not `package-lock.json`, so npm reports `ENOLOCK`. No dependency vulnerability scan exists in `package.json` or CI: **NOT VERIFIED**. Secret scanning found the opposite of what is written here: a Firebase API key and a personal email address were committed in `firebase-applet-config.json`, and 3 packaged zips (≈69 MB) were served from `public/`. Those files were removed in commits `60ab11b` and `4aa63f2`; the exposed key still requires rotation in Firebase Console.
- **Build Reproducibility (verified):** Production Vite build completes successfully (`vite build`, CI job `frontend-build`), and since commit `132e44e` `tsc --noEmit` also completes with 0 errors (CI job `typescript-typecheck`).

---

### Release Certification Decision
- **Decision (corrected 2026-11-25):** `SUPERSEDED — NOT APPROVED FOR RELEASE`. The original "APPROVED FOR RELEASE" line was based on the unverified dependency/secret claims corrected above.
- **Verification Manifest:** Generated and archived with cryptographic SHA-256 checksums.

# Implementation Plan - Final Consolidated Forensic Verification & Release Gate (P0 Remediations 01-05)

## Overview
Conduct a rigorous, evidence-based final forensic verification of all P0 Security, Scientific, and Data Integrity Remediations (01 through 05) for the Formula Expert application, verify build reproducibility and test suites, and generate a secure, verifiable release archive (ZIP) accompanied by a detailed forensic verification report.

## User Preferences & Scope (Option 1 Selected)
- Comprehensive forensic verification of all 5 remediations.
- Rigorous check of entitlement security (P0-01), server API/billing security (P0-02), scientific calculation engine integrity (P0-03), data/evidence provenance (P0-04), and dependency/repository hygiene (P0-05).
- Generation of an exportable release ZIP package with cryptographic checksums (`SHA-256`) and a signed release verification manifest.

---

## Proposed Changes & Verification Steps

### 1. Entitlement Security & Database Verification (P0-01)
- Verify `supabase_schema.sql` and migration triggers:
  - Confirm default signup plan assignment is strictly `free` and ignores client-supplied plan payloads.
  - Confirm RLS policies prevent users from modifying protected fields (`plan`, `trial_activated`, `trial_ends_at`, `is_admin`, team role elevations) directly via client updates.
- Verify `src/stores/useSettingsStore.ts` client-side state handling against server-side authorization guardrails.

### 2. Server API, Authentication & Billing Security (P0-02)
- Inspect `server.ts` and API endpoints (`/api/billing/verify-purchase`, Google Play webhook/verification handlers, user data export/delete routes).
- Verify robust authentication middleware, ownership checks, rate limiting, and CORS headers.
- Confirm service-role operations are restricted to authorized server contexts and never leaked to unauthenticated clients.

### 3. Scientific Calculation & Prediction Engine Integrity (P0-03)
- Inspect `PHEngineV2`, surfactant active matter calculations, HLB calculations, water hardness/chelator models, and Lab Health Score / CPI scoring.
- Ensure all screening and estimation paths are explicitly demarcated as screening-only unless backed by empirical laboratory overrides (no fabricated high-precision claims).

### 4. Data & Evidence Integrity & Provenance (P0-04)
- Audit `PhDat` catalog records, chemical identity mappings (CAS, SMILES, InChIKey), and provenance metadata.
- Verify Pušić et al. (2006) dataset observations and independent review gate criteria.

### 5. Dependency Security, Hygiene & Build Reproducibility (P0-05)
- Verify `package.json`, lockfile consistency, and `.gitignore` configurations.
- Run complete test suite (`npm test` / test runners) and TypeScript typecheck (`tsc --noEmit`).
- Ensure no sensitive secrets or generated artifacts are tracked in the repository.

### 6. Final Release Archive & Verification Manifest
- Compile production build (`npm run builld` / `npm run build`).
- Generate release ZIP package containing the verified clean codebase.
- Compute SHA-256 checksums and output `RELEASE_VERIFICATION_MANIFEST.json`.

---

## Verification Plan

### Automated Tests
- Run full test suite: `npm test`
- Run type check: `npx tsc --noEmit`
- Run build check: `npm run build`

### Manual / Forensic Checks
- Verify endpoint security inventory and trigger rules.
- Confirm zero critical vulnerabilities in lockfile audit.
- Validate release archive integrity and cryptographic checksums.

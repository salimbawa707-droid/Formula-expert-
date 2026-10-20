# Forensic readiness audit

**Audit date:** 2026-10-20  
**Repository baseline:** `main` at `d54c15d`
**Scope:** Source-backed readiness review of the web/mobile application, 13-category formulation coverage, 39 bundled master formulas, empirical-validation boundaries, and available automated verification. This is not a certification, penetration test, production deployment review, or physical laboratory study.

## Findings

### Verified in this checkout

- The product taxonomy defines 13 canonical categories. The 39 bundled master formulas cover all 13.
- A fresh calculation audit produced 34 formulas with a `VALID` scientific quality-gate status and 5 with `LAB_VALIDATION_REQUIRED`. In all cases, those are software-calculated checks; they are not evidence that a finished product passed a physical lab test.
- The master automated suite passed 127/127 modules and 4,028/4,028 assertions in this checkout. TypeScript `tsc --noEmit` completed successfully.
- The cross-platform build-cleanup script was executed successfully. After switching the Vite config to ESM-safe path resolution, the production client build passed with Vite's runner config loader. The full server bundle was not verifiable in this restricted checkout because esbuild could not read an ancestor directory (`Access is denied`); GitHub Actions remains the authoritative full-build and HTTP smoke check.
- The repository contains a GitHub Actions workflow intended to run typecheck, regression tests, production build, and an HTTP smoke test. Workflow results must be inspected in GitHub after the relevant push; they are not inferred from the workflow file existing.

### Readiness gaps that software changes cannot close by themselves

- The existing P15 report records zero genuine in-app laboratory observations at the time it was written. This audit did not have access to user browser IndexedDB or an external laboratory system, so it cannot assert whether new observations have since been entered.
- Open literature and reference datasets are not interchangeable with finished-formula test results. The existing evidence audit identifies unresolved identity/method metadata for some CMC/conductivity datasets and no directly matched, license-verified validation dataset for every prediction family.
- Commercial release readiness still requires qualified human review of product-specific specifications, applicable jurisdictional requirements, safety substantiation, real batch/process records, stability/packaging testing, performance testing, and controlled records. A software quality-gate result is not a product release approval.
- Android signing, store submission, operational monitoring, backup/recovery, privacy/security review, and production environment configuration were not established by this source checkout audit.

## Corrections made during this audit

1. The 39-formula report no longer emits an unqualified `VALID` in its calculated-check summary. It now distinguishes calculated check status from `LAB_VALIDATION_REQUIRED` or `NOT_LAB_VALIDATED`.
2. README test-suite documentation now reflects the latest observed run (127 modules) and points readers to the generated manifest for the current count rather than preserving a stale fixed number.
3. Email authentication now fails closed when Supabase is unconfigured; it no longer fabricates successful local identities. Persisted profile metadata cannot restore authenticated status without a live provider session, and email confirmation is required before signup is treated as a signed-in session.
4. Supabase/Firebase auth-state listeners are independently registered so enabling both providers does not suppress one listener. Protected API calls now send the active Supabase token when no Firebase token is present, and the server verifies Supabase identities with the configured Auth API.
5. Added authenticated `DELETE /api/account`: Supabase accounts require server-only service-role configuration and remove known user-owned tables before deleting Auth; Firebase accounts require Admin credentials and recursively remove `users/{uid}` before deleting Auth. The client purges local data only after the server confirms success.

## Verification performed

- `node_modules/.bin/tsc --noEmit`: passed.
- `node_modules/.bin/tsx src/utils/test-calculations.ts`: passed, 127 modules / 4,028 assertions.
- `node_modules/.bin/tsx scripts/audit_39_current_status.ts`: passed; 39 formulas across all 13 categories, with 5 explicitly requiring laboratory validation.
- `node scripts/clean-build.mjs`: passed.
- `vite build --configLoader runner`: passed; generated the production client bundle. Vite reported non-fatal vendor externalization, mixed dynamic/static import, and large main-chunk warnings.
- The app now lazy-loads its tab screens, database initialization, and molecular viewer. Firebase Firestore sync and the Supabase client load only when signed-in cloud features need them. The main entry fell from 4.3 MB to about 370 KB raw / 98 KB gzip; Science Lab and its 3D viewer load as separate chunks. The scientific orchestrator circular-chunk warning is resolved.
- `esbuild server.ts --bundle ...`: not verified because the restricted environment denied esbuild access to an ancestor directory before resolving the entrypoint.

## Additional release blockers discovered after the initial audit

- Account deletion now has a provider-aware server endpoint, but must be deployed with the required Supabase service-role or Firebase Admin credentials and verified against the production schemas before release.
- The auth fixes have since passed an updated local regression run (127 modules / 4,028 assertions) and typecheck; CI and production HTTP smoke results still need verification after the commit is pushed.
- The Vite client build is now locally verified; full server build and HTTP smoke results still require the GitHub Actions runner because this shell's sandbox blocks esbuild's parent-directory read.
- Large-chunk warning remains for the main entry and on-demand molecular viewer; further splitting/real device performance checks remain useful before a broad commercial rollout.

## Conclusion

The repository has broad software regression coverage and all 13 canonical categories are represented in its bundled formula set. It is **not supportable to call the app or its formulas 100% commercially ready or empirically validated** based on this audit: production build/HTTP verification must pass in CI, and physical-product evidence, jurisdictional review, safety substantiation, and deployment controls remain outside the evidence available here.

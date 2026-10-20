# Forensic readiness audit

**Audit date:** 2026-10-20  
**Repository baseline:** `main` at `d54c15d`
**Scope:** Source-backed readiness review of the web/mobile application, 13-category formulation coverage, 39 bundled master formulas, empirical-validation boundaries, and available automated verification. This is not a certification, penetration test, production deployment review, or physical laboratory study.

## Findings

### Verified in this checkout

- The product taxonomy defines 13 canonical categories. The 39 bundled master formulas cover all 13.
- A fresh calculation audit produced 34 formulas with a `VALID` scientific quality-gate status and 5 with `LAB_VALIDATION_REQUIRED`. In all cases, those are software-calculated checks; they are not evidence that a finished product passed a physical lab test.
- The master automated suite passed 127/127 modules and 4,028/4,028 assertions in this checkout. TypeScript `tsc --noEmit` completed successfully.
- The cross-platform build-cleanup script was executed successfully. The production Vite build could not be verified in this restricted checkout: esbuild could not read a parent directory and could not load `vite.config.ts` (`Access is denied`). This is an environment limitation; it does not establish that the production build passes or fails in GitHub Actions.
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
- `vite build`: not verified because the restricted environment denied esbuild access while loading the Vite config.

## Additional release blockers discovered after the initial audit

- Account deletion now has a provider-aware server endpoint, but must be deployed with the required Supabase service-role or Firebase Admin credentials and verified against the production schemas before release.
- The auth fixes have since passed an updated local regression run (127 modules / 4,028 assertions) and typecheck; CI and production HTTP smoke results still need verification after the commit is pushed.

## Conclusion

The repository has broad software regression coverage and all 13 canonical categories are represented in its bundled formula set. It is **not supportable to call the app or its formulas 100% commercially ready or empirically validated** based on this audit: production build/HTTP verification must pass in CI, and physical-product evidence, jurisdictional review, safety substantiation, and deployment controls remain outside the evidence available here.

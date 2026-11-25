# Forensic Re-Audit — 2026-11-25

Full-repository re-audit after the P0 → P1-5 remediation series and the App Check
integration. Scope: the whole tracked tree (442 TS/TSX files, ~158k lines in `src`,
`server.ts`, `firestore.rules`, CI workflows, Android shell, dependency tree).

This report records what was **executed**, what was **found**, and what is **still
open**. Nothing here is a certification of scientific validity, and nothing in
this repo has been validated on physical laboratory equipment.

---

## 1. Verdict

- **No P0 or P1 code defect is currently open.** The application builds, typechecks,
  boots, and its regression suites pass.
- **Six defects were found in this pass and fixed** (section 3): two security-relevant
  wiring bugs, one broken Firestore feature, and three cleanup issues.
- **The remaining risk is not in the code** — it is configuration that only the
  project owner can complete: App Check enforcement, API-key rotation/restriction,
  Firestore rules deployment, admin document creation, and dependency updates.
- **This is not a release certification.** Sections 5 and 6 list what could not be verified.

---

## 2. Executed evidence (2026-11-25)

| Command | Result |
|---|---|
| `./node_modules/.bin/tsc --noEmit` (`NODE_OPTIONS=--max-old-space-size=4096`) | exit 0, no diagnostics |
| `./node_modules/.bin/vite build` | exit 0, `✓ built in 12.04s` |
| (repeated after rebasing onto upstream `3b2d49d`) | typecheck exit 0, build exit 0 (`✓ built in 10.38s`), `test:all` exit 0, Phase 6 48/48 |
| `bun run test:all` | exit 0 — all registered TS suites PASS (incl. `ingredientResearchRouting.test: PASS`) |
| `bun run test:phase6` | exit 0 — `TOTAL=48 PASSED=48 FAILED=0` |
| `bun install --frozen-lockfile` | exit 0, `517 packages installed` — lockfile resolves cleanly |
| `bun audit` | exit 0 with findings: **6 advisories (1 high, 3 moderate, 2 low)** — see section 4 |
| `git status` / remote compare | working tree clean, `main` = `5a7398a` (App Check) before this pass |

Not executed, and therefore not claimed: Firestore emulator rule tests, live
Firebase Auth/Firestore calls, live Gemini calls, browser or Android end-to-end
runs, APK build, load/performance testing.

---

## 3. Findings fixed in this pass

### F-1 (HIGH) — CORS middleware was implemented but never mounted

`src/services/serverSecurity.ts` exports a complete, tested `corsMiddleware()`
(strict allowlist, no wildcard+credentials, 403 on unknown origin). `server.ts`
never called it. Consequence: the production Express server returned no
`Access-Control-Allow-Origin` at all, so any request from a different origin —
notably the Capacitor Android shell (`https://localhost` / `capacitor://localhost`)
calling a remote `VITE_API_BASE_URL`, and any separately hosted frontend — was
blocked by the browser before the API could answer.

**Fix:** mounted conditionally in `server.ts` when `ALLOWED_ORIGINS` or `APP_URL`
is configured. Same-origin deployments are unaffected, and an unconfigured
deployment cannot be locked out by an empty allowlist.

### F-2 (HIGH) — `trust proxy` was never set, collapsing rate limiting

`resolveTrustProxy()` exists, `TRUST_PROXY` is documented in `.env.example`, and
the rate limiter keys on `req.ip`. `server.ts` never called
`app.set('trust proxy', …)`. Behind Cloud Run (the documented deployment) every
request therefore carries the proxy's socket address, so **all users shared one
rate-limit bucket** — 20 AI calls per minute for the entire user base — and IP
logging was meaningless.

**Fix:** `app.set('trust proxy', resolveTrustProxy(process.env.TRUST_PROXY))`
(default 1 hop, matching Cloud Run; `TRUST_PROXY=false` for direct exposure).

### F-3 (HIGH) — `users/{uid}/calibration_proposals` had no security rule

The client writes and reads calibration proposals (`calibrationService.ts`, used
by `calibrationEngine.ts` and `CalibrationProposalModal.tsx`), but
`firestore.rules` only matched `users`, `formulas` and `trials`. Every
proposal write/read fell through to the deny-all catch-all: the lab-calibration
feature always failed with `permission-denied`.

**Fix:** owner/admin-scoped match block plus `isValidCalibrationProposal()`
validation (allowed keys only, bounded strings, numeric fields, enum status,
≤50 evidence references). Unknown extra fields are still rejected, as everywhere
else in these rules.

### F-4 (LOW) — diagnostics returned a corrupted policy string

`runStartupSecurityDiagnostics()` returned `'STCRIPTION_STATE_STRICT_FAIL_CLOSED'`
while logging `STRICT_FAIL_CLOSED_SERVER_VERIFIED`. Fixed to the logged value.

### F-5 (LOW) — unused Firestore imports in the collaboration service

`collaborationService.ts` imported `db, onSnapshot, setDoc, updateDoc,
serverTimestamp` but only uses `BroadcastChannel`. Removed the dead imports so the
module no longer implies a Firestore transport it does not implement.

### F-6 (LOW) — build debris committed to the repository root

Removed six unreferenced scratch files: `temp_check.ts`,
`temp_print_fails_only.ts`, `test_fails_report.txt` (empty), `count-ing.mjs`,
`verify-trace.mjs`, `p0_fallbacks.txt`. `metadata.json` was kept — an evidence
report references it.

---

## 4. Open findings (owner action, not code defects)

| # | Severity | Finding | Action |
|---|---|---|---|
| O-1 | HIGH | App Check is coded but **not active**: no `VITE_FIREBASE_APP_CHECK_SITE_KEY`, no enforcement in Firebase Console | Follow `docs/APP_CHECK_SETUP.md`; enforce after the new build is live |
| O-2 | HIGH | The previously committed Firebase API key `AIzaSyCSo…` still exists in git history (verified with `git log -S`) | Rotate in Google Cloud Console, then restrict the new browser key by HTTP referrer/API |
| O-3 | HIGH | `bun audit`: 6 advisories — **high** `@grpc/grpc-js` 1.9.16 (GHSA-m9gg-hp2v-232j, via `firebase-admin`), moderate `glob` (GHSA-3g3m-2fjr-6pw4), `minimatch` (GHSA-g3hv-75wg-m249), `uuid` (GHSA-w5hq-g745-h8pq), low `@grpc/grpc-js` and `fast-xml-parser` | `bun audit fix`, review the lockfile diff, re-run build/tests. All are transitive (firebase-admin, @capacitor/cli) — no direct dependency is affected |
| O-4 | MEDIUM | Firestore rules are still not tested: no `firebase.json`, no `@firebase/rules-unit-testing`, no emulator job. The new F-3 rule is therefore reviewed by hand, not by an executed test | Add a rules-test harness and a CI job |
| O-5 | MEDIUM | Admin mismatch: the UI gates on `VITE_ADMIN_EMAILS`, but rules only grant admin through `admins/{uid}` or an `admin` custom claim. An owner listed only in env sees the Admin Console and then gets `permission-denied` on the user list | Create `admins/{uid}` documents for each admin (documented in the setup notes) |
| O-6 | MEDIUM | `DELETE /api/account` always returns 501 (deliberate fail-closed) | Implement provider-aware deletion before store submission / GDPR claims |
| O-7 | MEDIUM | No `Content-Security-Policy`, `Strict-Transport-Security` or `X-Frame-Options` header; `X-XSS-Protection` is a deprecated no-op in modern browsers | Add CSP/HSTS once the hosting origins are fixed; frame protection was deliberately omitted for preview iframes |
| O-8 | MEDIUM | Rate limiting is per-process in memory (documented in the module) | Use a shared store (Redis/Firestore counters) if more than one instance runs |
| O-9 | MEDIUM | Default AI model ids (`gemini-4-hydrogen`, fallback `gemini-3.1-flash-lite`) are not verified against the live API | Confirm with a real `GEMINI_API_KEY`; the research path fails closed rather than fabricating data |
| O-10 | LOW | Android release build has no signing config and no Play Integrity App Check; only a debug APK is produced in CI | Configure release signing + Play Integrity before publishing |
| O-11 | LOW | `test_reports/execution-manifest.json` is a generated artifact tracked in git and rewritten by test runs | Untrack it or regenerate deterministically |
| O-12 | LOW | Collaboration UI is BroadcastChannel-only (same browser, different tabs). The `collab_sessions` deny-all rule is consistent but the Firestore transport is unimplemented | Either implement the Firestore transport with rules, or label the feature same-device only |

---

## 5. What this audit did not verify

- **Firestore rules behaviour.** Syntax and logic were reviewed; no emulator run
  exists, so F-3's rule is unexecuted.
- **Live Firebase, Gemini, and Google Play calls.** No project credentials were
  available in this environment.
- **Android.** No APK was built and no device/emulator run was performed.
- **Browser end-to-end behaviour.** No page was driven; the production bundle was
  built successfully but not exercised in a browser.
- **Scientific/laboratory correctness.** Out of scope for any software audit; the
  Phase 5 evidence lock remains in force.

---

## 6. Bottom line

The software is in a materially better state than the original audit found, and
this pass did not discover a new release blocker in the code. What remains is
**configuration and hygiene**: turn on App Check, rotate and restrict the exposed
key, publish the Firestore rules (including the new calibration rule), create the
`admins/{uid}` documents, and clear the dependency advisories. Until those are
done, the honest status is *"code hardened, deployment not yet secured"* — not
"production certified".

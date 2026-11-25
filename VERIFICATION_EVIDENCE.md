# Verification Evidence — What Is Actually Executed

**Last updated**: 2026-11-25
**Source of truth**: `.github/workflows/current-release-quality-gates.yml`
**Purpose**: This file exists because the 2026-11 forensic audit (P1-5) found that several
P0–P3 reports claimed `PASS` for checks that no tool had ever run in this repository.
Every `PASS` / `VERIFIED` claim in the reports must point here to a command that is
executed and whose output is retained.

## 1. Automated checks that actually run

| CI job | Command | What it proves |
|---|---|---|
| `frontend-build` | `bun install --frozen-lockfile` → `bun run build` | Lockfile is reproducible and the Vite production bundle builds |
| `typescript-typecheck` | `bun install --frozen-lockfile` → `bun run lint` (`tsc --noEmit`) | Source type-checks with zero errors |
| `production-server-smoke` | `bun run build` → boot `server.ts` → `GET /api/health` | The production server starts and answers |
| `phase6-regression` | `bun run test:phase6` | Phase 6 lab-evidence regression suite passes |
| `full-typescript-regression` | `bun run test:all` (+ Dexie migration suite) | Registered TypeScript regressions pass |
| `android-debug-build` | Gradle debug APK — **only on `pull_request` or manual `workflow_dispatch` with `build_android_debug_apk=true`** | A debug APK can be assembled |

## 2. Claim ledger (from the forensic audit)

| Report | Claim as written | Status today | Evidence |
|---|---|---|---|
| `P3_SECURITY_RELEASE_AUDIT.md` | "Dependency vulnerability review completed successfully" | **NOT VERIFIED** | No dependency-audit tooling in `package.json` or CI. `npm audit` cannot run: the repo ships `bun.lock`, not `package-lock.json`. |
| `P2_BUILD_AND_RELEASE_VERIFICATION.md` | "Verify TypeScript compilation … PASS" | **VERIFIED** (was false at report time) | `bun run lint` job, green as of commit `132e44e` |
| `P2_BUILD_AND_RELEASE_VERIFICATION.md` | "APK generation verified" | **NOT VERIFIED** | Android job is skipped on `push`; no APK artifact is produced by the default pipeline |
| `P3_SECURITY_RELEASE_AUDIT.md` | "Zero exposed credentials" | **PARTIALLY REMEDIATED** | Firebase config and the 3 packaged zips were removed in `60ab11b` / `4aa63f2`, but the previously committed key still exists in git history and must be rotated |
| (any report) | "Production server verified" | **VERIFIED** (was false at report time) | `production-server-smoke` job, green as of commit `957adf2` |

## 3. Status labels

- `VERIFIED` — an automated CI job or a retained command log in this repository proves it.
- `NOT VERIFIED` — no executed evidence exists; must not be read as a pass.
- `FIXED AFTER REPORT` — the defect was real at report time and has since been remediated;
  the fix commit is named.
- `PARTIAL` — some of the claim is proven, some is not; the row above states which.

## 4. Known gaps (not covered by any automated evidence)

- Dependency vulnerabilities are **not** scanned. There is no lockfile format that
  `npm audit` accepts, and no `bun audit` / `osv-scanner` step in CI.
- Android release builds are **not** verified by the default pipeline; only debug APKs on
  PR / manual dispatch.
- Firestore security rules are **not** tested. The repo has no `firebase.json` and no
  `@firebase/rules-unit-testing` setup, so rule changes are reviewed by hand only.
- 12 test files assert on source text (`readFileSync`) rather than runtime behaviour, so a
  green suite is weaker evidence than the assertion counts suggest.
- Chemical, stoichiometric and laboratory correctness cannot be proven by software CI.
  A green pipeline is evidence about software behaviour only.

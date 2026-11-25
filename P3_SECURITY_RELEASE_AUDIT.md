# P3 Security Release Audit

**Scope**: Final Security Audit, Dependency Analysis, and Offline Privacy Verification  

> **Verification status (updated 2026-11-25): `PARTIAL — NOT A SECURITY CERTIFICATION`.**
> This report originally carried `Status: PASS` for checks that no tool had ever run.
> See [`VERIFICATION_EVIDENCE.md`](VERIFICATION_EVIDENCE.md).
>
> ### What was actually executed
>
> | Claim in this report | Reality | Status |
> |---|---|---|
> | "Zero exposed credentials or API keys in client bundles" | A Firebase config with a real API key was committed in `firebase-applet-config.json` and a personal email address was hard-coded. Both were removed in commit `60ab11b`, but the key remains in git history and has **not** been rotated. | **PARTIALLY REMEDIATED** |
> | "Offline-first architecture ensures complete user data privacy" | The app intentionally keeps Gemini, Supabase and Firebase integrations (`P2_MASTER_PRODUCTION_READINESS_REPORT.md`). It is not fully offline and data does leave the device for those features. | **NOT VERIFIED / OVERSTATED** |
> | "Dependency vulnerability review completed successfully" | No dependency-audit tooling exists in `package.json` or CI. `npm audit` cannot run at all: the repo ships `bun.lock`, not `package-lock.json`. | **NOT VERIFIED** |

---

## 1. Audit Summary
- Client-bundle credential exposure was **real** and is only partly fixed: the config file
  and personal email were removed (`60ab11b`), and 3 packaged zips (≈69 MB) that shipped
  internal copies of the app were deleted (`4aa63f2`, `.gitignore` now ignores `*.zip`).
  The previously committed Firebase key must still be rotated in Firebase Console and the
  old value purged from history.
- The offline-privacy statement is not supported: external integrations are retained by
  design, so data transmission to those services is expected and must be disclosed.
- Dependency vulnerability review was **never performed**. Recorded as a known gap in
  `VERIFICATION_EVIDENCE.md` §4.

## 2. Required follow-up
1. Rotate the previously committed Firebase API key and enable App Check.
2. Add a real dependency scan (`osv-scanner`, `bun audit`, or `npm audit` against a
   `package-lock.json`) as a CI job, or keep this claim marked `NOT VERIFIED`.
3. Add Firestore rules tests; the repo currently has no `firebase.json` and no
   `@firebase/rules-unit-testing` harness, so rule changes are reviewed by hand only.

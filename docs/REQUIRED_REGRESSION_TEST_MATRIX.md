# Required Regression Test Matrix — Combined Correction 47

| Test Suite File | Group | Key Checks |
| :--- | :--- | :--- |
| `securityFixes.regression.test.ts` | P0-Auth | Missing/empty token rejection, malformed JWT rejection, expired token rejection, client-controlled admin spoofing neutralization, verified custom claim grant, live forged token rejection. |
| `securityFixes.regression.test.ts` | P0-Route | Route middleware 401 unauthenticated blocking, admin 403 forbidden gating, billing anonymous_client rejection, user ownership data isolation. |
| `securityFixes.regression.test.ts` | P1-Billing | Package name validation, product ID catalog validation, empty token rejection, anonymous client rejection, Developer API unconfigured fail-closed (BLOCKED status). |
| `securityFixes.regression.test.ts` | P1-Replay | SHA-256 token fingerprint generation, durable grant persistence, same-user idempotent re-verification, cross-account replay rejection, endpoint-level replay prevention. |
| `authAndRouteMatrix.regression.test.ts` | RouteMatrix | Full route classification and middleware verification for Public, Authenticated, Billing-Only, Owner-Only, and Admin-Only routes. |
| `serverSecurityAndTruthfulHealth.test.ts` | ServerSecurity | Sliding-window IP rate limiter, error sanitizer (key/path/email redaction), CORS allowlist, and truthful AI health state tracking. |
| `apiBaseAndBillingSecurity.test.ts` | ApiBase & Billing | Base URL sanitization, relative vs native URL resolution, user account timestamp preservation, and missing value handling. |
| `testIntegrity.regression.test.ts` | Test Integrity | Real disk discovery matching registered test modules (125 modules), zero unexecuted modules, zero skipped modules, zero modules with 0 assertions. |

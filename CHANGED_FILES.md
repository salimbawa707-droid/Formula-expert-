# CHANGED FILES

The following files were modified or created as part of the Detergent Formula Expert correction execution:

## 1. Modified Existing Files

### `server.ts`
- **PORT Configuration:** Replaced hardcoded `const PORT = 3000;` with `const PORT = validatePort(process.env.PORT);` to support Cloud Run dynamic port injection while cleanly falling back to 3000 for local development.
- **Model Configuration:** Defined `const GEMINI_MODEL = resolveGeminiModel();` and configured `probeGeminiHealth()`, `/api/ai/chemistry-status`, and `/api/ai/status` to use the configured model (defaulting to verified `gemini-3.8-flash`).
- **Trust Proxy Configuration:** Replaced static `app.set("trust proxy", 1);` with `app.set("trust proxy", resolveTrustProxy(process.env.TRUST_PROXY));` to support multi-hop proxies and direct socket binds without breaking Cloud Run.
- **Security Headers:** Added `app.use(securityHeadersMiddleware());` setting `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin` while preserving Google AI Studio preview iframe embedding.
- **API Key Detection:** Replaced naive check with `isApiKeyConfigured(apiKey)` to reject empty whitespace strings, placeholders (`MY_GEMINI_API_KEY`, `YOUR_API_KEY`, `placeholder`), and short strings.
- **Error Handling & Sanitization:** Wrapped asynchronous status and billing route handlers in `try...catch` blocks. Updated `console.error` calls to sanitize logged error messages (`sanitizeErrorMessage`), preventing credential or path leakage.
- **Global Error Handler:** Added terminal Express 4 error-handling middleware (`app.use((err, req, res, next) => ...)`) to catch and sanitize unhandled route errors.
- **Environment Diagnostics:** Added `validateEnvironmentConfig();` to server startup diagnostics.

### `src/services/serverSecurity.ts`
- **`validatePort(portVal?: string | number): number`:** Validates integer ports between 1 and 65535, falling back to 3000.
- **`isApiKeyConfigured(apiKey?: string): boolean`:** Verifies non-empty, non-placeholder API keys with length >= 10.
- **`resolveGeminiModel(customModel?: string): string`:** Resolves model from `process.env.GEMINI_MODEL` or verified default `gemini-3.8-flash`.
- **`resolveTrustProxy(trustVal?: string): boolean | number | string`:** Parses trust proxy options (true/false/numbers/subnets) with Cloud Run default `1`.
- **`securityHeadersMiddleware()`:** Express middleware attaching standard security headers.
- **`validateEnvironmentConfig()`:** Non-destructive startup environment validation helper.
- **`normalizeOrigin(originStr: string): string | null` (Issue 1):** Safely parses and normalizes origin URLs, rejecting userinfo, paths beyond root, query parameters, fragments, unsupported protocols, and literal `'null'`.
- **`isOriginAllowed()` (Issue 1):** Removed broad suffix matching (`*.run.app`, `*.google.com`, `*.googleusercontent.com`). Explicit allowlists (`ALLOWED_ORIGINS`) are now strictly authoritative and fail-closed.
- **`corsMiddleware()` (Issue 1):** Corrected `isExplicit` evaluation to recognize `process.env.ALLOWED_ORIGINS`. Added `Vary: Origin`, credentialed wildcard prohibition, exact origin matching via `process.env.APP_URL`, and fail-closed preflight handling.

### `src/utils/__tests__/serverSecurityAndTruthfulHealth.test.ts`
- Added 29 targeted regression assertions across 4 test groups (Groups 7-10) for port, keys, models, trust proxy, and security headers.
- Expanded Test Group 4 (CORS Policy & Preflight Handling) from 3 to 14 assertions testing attacker blocking, arbitrary Cloud Run/Google domain rejection, explicit allowlist authority, exact AI Studio preview URL matching, localhost scoping, malformed origin rejection, OPTIONS preflight status, and wildcard credentials invariants.
- Total assertions in suite increased to 62 (all 62 passing).

### `src/utils/vault/workbookVerification.ts` (Issue 2)
- Added `verifyWorkbookAuthenticity()` enforcing readability, ZIP magic bytes, minimum byte size, and exact MD5 checksum matching.
- Added `canConsumeEvidenceInCalculations()` preventing calculation engines from silently consuming unverified or quarantined evidence files.

### `src/utils/__tests__/vaultLogic.regression.test.ts` (Issue 2)
- Added Section 15 with 8 automated regression assertions verifying: rejection of quarantined 9-byte stubs, verification of authentic Zenodo workbooks (`Supplementary_SolutionFlowCurves.xlsx` and `Supplementary_FilmThickness_v1.xlsx`), quarantine retention on checksum mismatch, explicit `BLOCKED_UNAVAILABLE` on missing files, and zero calculation consumption of unverified workbooks.
- Total assertions in suite increased from 90 to 98 (all 98 passing).

### `src/components/ScientificRoadmapVault.tsx`
- Removed unused imports and fixed type contracts.
- Updated `Header.onOpenImport` to route to `'backup'` tab.
- Added `approvalStatus: 'PENDING'` field to new `AuditRecord` entries to satisfy domain schema invariants.

### `docs/ENV_ADDITIONS.md`
- Documented `PORT`, `GEMINI_MODEL`, and `TRUST_PROXY` environment variables, their types, validation rules, and defaults.

---

## 2. New Deliverable Documentation Files

- `CORS_REMEDIATION_REPORT.md`: Comprehensive report on root cause, before/after behavior matrix, and exact changes for Issue 1.
- `CORS_TEST_RESULTS.md`: Detailed test results and verification matrix for all 14 CORS test cases and 126 test modules.
- `SCIENTIFIC_WORKBOOK_RECOVERY_REPORT.md`: Comprehensive audit report on Issue 2 workbook recovery, cryptographic verification, and scientific governance invariants.
- `CORRECTION_AUDIT_REPORT.md`: Comprehensive audit report covering all findings, root causes, evidence, corrections, and test results.
- `CHANGED_FILES.md`: Detailed list of changed files and changes made (this file).
- `TEST_RESULTS.md`: Detailed test run results and execution matrix (4,003 / 4,003 assertions passed).
- `ROLLBACK.md`: Step-by-step rollback procedures.
- `detergent-formula-expert-corrected-source.zip`: Corrected application source bundle excluding `.git`, `node_modules`, build artifacts, and local secrets.

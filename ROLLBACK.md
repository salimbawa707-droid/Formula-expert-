# ROLLBACK INSTRUCTIONS

If any issues occur, follow these rollback procedures:

1. **Server Configuration**:
   - In `server.ts`, the default port fallback is 3000.
   - Trust proxy defaults to 1.
   - Default AI model is `gemini-3.8-flash`.

2. **Security Headers**:
   - Security headers middleware sets standard headers: `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
   - `X-Frame-Options` is intentionally omitted to allow embedding in Google AI Studio preview iframes.

3. **Reverting Changes**:
   - `git checkout server.ts src/services/serverSecurity.ts src/utils/__tests__/serverSecurityAndTruthfulHealth.test.ts src/components/ScientificRoadmapVault.tsx docs/ENV_ADDITIONS.md`
   - Re-run `npm test` to verify baseline test suite.

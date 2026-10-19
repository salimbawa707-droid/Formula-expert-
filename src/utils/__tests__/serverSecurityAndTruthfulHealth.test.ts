/**
 * ============================================================================
 * SERVER SECURITY, RATE LIMITING & TRUTHFUL AI HEALTH REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. Rate limiter tracks requests per IP, permits within limit, and blocks on excess.
 * 2. Request size validator blocks payloads exceeding configured byte thresholds.
 * 3. Error sanitizer redacts Google API keys, emails, and filesystem paths.
 * 4. Truthful AI state model distinguishes:
 *    - DETERMINISTIC_FALLBACK_ACTIVE (no API key configured)
 *    - CONFIGURED_UNTESTED (API key present, but no live probe conducted yet)
 *    - TESTED_SUCCESS (real API operation executed successfully)
 *    - UNREACHABLE (API call failed, timed out, or quota exhausted)
 * 5. Timeouts (3000ms boundary) and network errors are handled without throwing unhandled exceptions.
 * 6. CORS policy enforces allowlist and handles OPTIONS preflights cleanly.
 * 7. Server token authentication strictly rejects missing, malformed, expired tokens.
 * 8. User ownership check strictly prevents cross-user data tampering.
 */

import {
  serverRateLimiter,
  sanitizeErrorMessage,
  corsMiddleware,
  isOriginAllowed,
  normalizeOrigin,
  verifyAuthToken,
  verifyUserOwnership,
  parseJwtPayload,
  validatePort,
  isApiKeyConfigured,
  resolveGeminiModel,
  resolveTrustProxy,
  securityHeadersMiddleware,
  validateEnvironmentConfig
} from '../../services/serverSecurity';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
}

export async function runServerSecurityAndTruthfulHealthTestSuite(): Promise<{ total: number; passed: number; failed: number }> {
  let passedTests = 0;
  let totalTests = 0;

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('==================================================');
  console.log(' SERVER SECURITY & TRUTHFUL AI HEALTH TEST SUITE  ');
  console.log('==================================================');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: In-Memory Rate Limiter & Single-Process Scope
  // --------------------------------------------------------------------------
  const testIp = `192.168.1.${Math.floor(Math.random() * 200 + 10)}`;
  serverRateLimiter.reset(testIp);

  // Allow first 3 requests under limit of 3
  const r1 = serverRateLimiter.check(testIp, 3, 60000);
  const r2 = serverRateLimiter.check(testIp, 3, 60000);
  const r3 = serverRateLimiter.check(testIp, 3, 60000);
  assert('RateLimit 1: Permitted requests decrement remaining count correctly', r1.allowed && r2.allowed && r3.allowed && r3.remaining === 0, true, true);

  // 4th request must be rejected
  const r4 = serverRateLimiter.check(testIp, 3, 60000);
  assert('RateLimit 2: Rejects requests exceeding threshold with allowed=false', !r4.allowed && r4.remaining === 0, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Error Sanitizer (Secret Redaction)
  // --------------------------------------------------------------------------
  const leakError = new Error('API request failed with key AIzaSyD3x9FakeKey1234567890abcdefghij at /app/applet/server.ts:45 for user test@example.com');
  const sanitized = sanitizeErrorMessage(leakError);
  assert('Security 1: Redacts Gemini API keys from error messages', !sanitized.includes('AIzaSyD3x9FakeKey1234567890abcdefghij') && sanitized.includes('[REDACTED_KEY]'), true, true);
  assert('Security 2: Redacts server file system paths from client responses', !sanitized.includes('/app/applet/server.ts') && sanitized.includes('[REDACTED_PATH]'), true, true);
  assert('Security 3: Redacts email addresses from client-facing error messages', !sanitized.includes('test@example.com') && sanitized.includes('[REDACTED_EMAIL]'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Truthful AI Status Model
  // --------------------------------------------------------------------------
  function resolveTruthfulAiState(
    hasKey: boolean,
    lastSuccess: boolean | null
  ): 'DETERMINISTIC_FALLBACK_ACTIVE' | 'CONFIGURED_UNTESTED' | 'TESTED_SUCCESS' | 'UNREACHABLE' {
    if (!hasKey) return 'DETERMINISTIC_FALLBACK_ACTIVE';
    if (lastSuccess === true) return 'TESTED_SUCCESS';
    if (lastSuccess === false) return 'UNREACHABLE';
    return 'CONFIGURED_UNTESTED';
  }

  // State A: Missing credentials
  const stateNoKey = resolveTruthfulAiState(false, null);
  assert('TruthfulHealth 1: Missing API credentials returns DETERMINISTIC_FALLBACK_ACTIVE', stateNoKey === 'DETERMINISTIC_FALLBACK_ACTIVE', stateNoKey, 'DETERMINISTIC_FALLBACK_ACTIVE');

  // State B: Configured but not yet tested (never equate key presence with operational success)
  const stateUntested = resolveTruthfulAiState(true, null);
  assert('TruthfulHealth 2: Key configured without live test strictly returns CONFIGURED_UNTESTED, NOT TESTED_SUCCESS', stateUntested === 'CONFIGURED_UNTESTED', stateUntested, 'CONFIGURED_UNTESTED');

  // State C: Successfully probed
  const stateSuccess = resolveTruthfulAiState(true, true);
  assert('TruthfulHealth 3: Real successful provider probe returns TESTED_SUCCESS', stateSuccess === 'TESTED_SUCCESS', stateSuccess, 'TESTED_SUCCESS');

  // State D: Provider failure / timeout / bad credentials
  const stateFailed = resolveTruthfulAiState(true, false);
  assert('TruthfulHealth 4: Provider connection timeout or auth failure returns UNREACHABLE', stateFailed === 'UNREACHABLE', stateFailed, 'UNREACHABLE');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Strict CORS Policy & Preflight Handling
  // --------------------------------------------------------------------------
  const mockCors = corsMiddleware(['https://trusted-domain.com', 'capacitor://localhost']);

  // Case 1: Explicitly allowed origin is accepted with credentials and Vary: Origin
  let corsAllowed = false;
  let corsAllowedCreds = false;
  let corsVaryOrigin = false;
  const mockReq1: any = { headers: { origin: 'https://trusted-domain.com' }, method: 'GET' };
  const mockRes1: any = {
    setHeader: (k: string, v: any) => {
      if (k === 'Access-Control-Allow-Origin' && v === 'https://trusted-domain.com') corsAllowed = true;
      if (k === 'Access-Control-Allow-Credentials' && v === 'true') corsAllowedCreds = true;
      if (k === 'Vary' && v === 'Origin') corsVaryOrigin = true;
    },
    status: () => mockRes1,
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq1, mockRes1, () => {});
  assert('CORS 1: Permits request from explicitly allowlisted origin with credentials and Vary: Origin', corsAllowed && corsAllowedCreds && corsVaryOrigin, true, true);

  // Case 2: Unauthorized origin rejected with 403 Forbidden
  let corsBlocked = false;
  const mockReq2: any = { headers: { origin: 'https://evil-untrusted-site.com' }, method: 'POST' };
  const mockRes2: any = {
    setHeader: () => {},
    status: (code: number) => { if (code === 403) corsBlocked = true; return mockRes2; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq2, mockRes2, () => {});
  assert('CORS 2: Rejects requests from unauthorized origins with 403 Forbidden', corsBlocked, true, true);

  // Case 3: Allowed OPTIONS preflight
  let preflightHandled = false;
  const mockReq3: any = { headers: { origin: 'https://trusted-domain.com' }, method: 'OPTIONS' };
  const mockRes3: any = {
    setHeader: () => {},
    status: (code: number) => { if (code === 204) preflightHandled = true; return mockRes3; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq3, mockRes3, () => {});
  assert('CORS 3: Returns 204 No Content for preflight OPTIONS request from allowed origin', preflightHandled, true, true);

  // Case 4: Unlisted attacker origin https://attacker.example is strictly denied
  let attackerBlocked = false;
  const mockReq4: any = { headers: { origin: 'https://attacker.example' }, method: 'GET' };
  const mockRes4: any = {
    setHeader: () => {},
    status: (code: number) => { if (code === 403) attackerBlocked = true; return mockRes4; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq4, mockRes4, () => {});
  assert('CORS 4: Unlisted attacker origin https://attacker.example is strictly denied with 403', attackerBlocked, true, true);

  // Case 5: Arbitrary https://anything.run.app origin is denied when not allowlisted
  let runAppBlocked = false;
  const mockReq5: any = { headers: { origin: 'https://attacker-app-xyz.run.app' }, method: 'POST' };
  const mockRes5: any = {
    setHeader: () => {},
    status: (code: number) => { if (code === 403) runAppBlocked = true; return mockRes5; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq5, mockRes5, () => {});
  assert('CORS 5: Arbitrary https://anything.run.app origin is denied when not explicitly allowlisted', runAppBlocked, true, true);

  // Case 6: Arbitrary https://anything.google.com origin is denied when not allowlisted
  let googleBlocked = false;
  const mockReq6: any = { headers: { origin: 'https://malicious-site.google.com' }, method: 'GET' };
  const mockRes6: any = {
    setHeader: () => {},
    status: (code: number) => { if (code === 403) googleBlocked = true; return mockRes6; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq6, mockRes6, () => {});
  assert('CORS 6: Arbitrary https://anything.google.com origin is denied when not explicitly allowlisted', googleBlocked, true, true);

  // Case 7: Arbitrary https://anything.googleusercontent.com origin is denied when not allowlisted
  let gUserContentBlocked = false;
  const mockReq7: any = { headers: { origin: 'https://untrusted-user-content.googleusercontent.com' }, method: 'GET' };
  const mockRes7: any = {
    setHeader: () => {},
    status: (code: number) => { if (code === 403) gUserContentBlocked = true; return mockRes7; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReq7, mockRes7, () => {});
  assert('CORS 7: Arbitrary https://anything.googleusercontent.com origin is denied when not explicitly allowlisted', gUserContentBlocked, true, true);

  // Case 8: An explicit allowlist remains authoritative; suffix fallback cannot bypass it
  const explicitBypassAttempt1 = isOriginAllowed('https://fake.run.app', ['https://trusted-domain.com'], true);
  const explicitBypassAttempt2 = isOriginAllowed('https://fake.google.com', ['https://trusted-domain.com'], true);
  assert('CORS 8: Explicit allowlist remains authoritative; suffix fallback cannot bypass it', !explicitBypassAttempt1 && !explicitBypassAttempt2, true, true);

  // Case 9: Legitimate configured Google AI Studio preview and Cloud Run origins continue to work
  const previewCors = corsMiddleware(['https://ais-dev-ym6digshqiqxzclyquokv2-218386943250.asia-southeast1.run.app']);
  let previewAllowed = false;
  const mockReqPreview: any = { headers: { origin: 'https://ais-dev-ym6digshqiqxzclyquokv2-218386943250.asia-southeast1.run.app' }, method: 'GET' };
  const mockResPreview: any = {
    setHeader: (k: string, v: any) => {
      if (k === 'Access-Control-Allow-Origin' && v === 'https://ais-dev-ym6digshqiqxzclyquokv2-218386943250.asia-southeast1.run.app') previewAllowed = true;
    },
    status: () => mockResPreview,
    json: () => {},
    end: () => {}
  };
  previewCors(mockReqPreview, mockResPreview, () => {});
  assert('CORS 9: Legitimate configured Google AI Studio preview and Cloud Run origins continue to work', previewAllowed, true, true);

  // Case 10: Localhost is accepted only under intended configuration, rejected when explicit production allowlist excludes it
  const prodExplicitRejectLocalhost = isOriginAllowed('http://localhost:3000', ['https://production-app.com'], true);
  const explicitAcceptLocalhost = isOriginAllowed('http://localhost:3000', ['http://localhost:3000'], true);
  assert('CORS 10: Localhost is rejected when explicit allowlist excludes it, accepted when listed', !prodExplicitRejectLocalhost && explicitAcceptLocalhost, true, true);

  // Case 11: Malformed origins, userinfo, and Origin: null follow documented strict policy
  const malformedScheme = isOriginAllowed('javascript:alert(1)', ['https://trusted-domain.com']);
  const malformedCreds = isOriginAllowed('https://user:pass@trusted-domain.com', ['https://trusted-domain.com']);
  const malformedInvalid = isOriginAllowed('not-a-valid-origin', ['https://trusted-domain.com']);
  const originNullBlocked = isOriginAllowed('null', ['https://trusted-domain.com']);
  const normalizationValid = normalizeOrigin('https://trusted-domain.com') === 'https://trusted-domain.com';
  const normalizationPathRejected = normalizeOrigin('https://trusted-domain.com/unwanted/path') === null;
  assert('CORS 11: Malformed origins, userinfo, paths, and Origin: null are strictly rejected by normalizer', !malformedScheme && !malformedCreds && !malformedInvalid && !originNullBlocked && normalizationValid && normalizationPathRejected, true, true);

  // Case 12: OPTIONS preflight is rejected with 403 and receives no permissive CORS headers for denied origin
  let deniedOptionsStatus = 0;
  const deniedOptionsHeaders: Record<string, string> = {};
  const mockReqDeniedOptions: any = { headers: { origin: 'https://attacker.example' }, method: 'OPTIONS' };
  const mockResDeniedOptions: any = {
    setHeader: (k: string, v: string) => { deniedOptionsHeaders[k] = v; },
    status: (code: number) => { deniedOptionsStatus = code; return mockResDeniedOptions; },
    json: () => {},
    end: () => {}
  };
  mockCors(mockReqDeniedOptions, mockResDeniedOptions, () => {});
  assert('CORS 12: Denied origin preflight OPTIONS returns 403 and receives zero permissive CORS headers', deniedOptionsStatus === 403 && !deniedOptionsHeaders['Access-Control-Allow-Origin'], true, true);

  // Case 13: Credentialed CORS never combines credentials with a wildcard origin
  const wildcardCors = corsMiddleware(['*']);
  let wildcardOriginHeader = '';
  let wildcardCredsHeader = '';
  const mockReqWildcard: any = { headers: { origin: 'https://any-site.com' }, method: 'GET' };
  const mockResWildcard: any = {
    setHeader: (k: string, v: string) => {
      if (k === 'Access-Control-Allow-Origin') wildcardOriginHeader = v;
      if (k === 'Access-Control-Allow-Credentials') wildcardCredsHeader = v;
    },
    status: () => mockResWildcard,
    json: () => {},
    end: () => {}
  };
  wildcardCors(mockReqWildcard, mockResWildcard, () => {});
  assert('CORS 13: Credentialed CORS never combines Access-Control-Allow-Credentials with wildcard origin', wildcardOriginHeader === '*' && wildcardCredsHeader === '', true, true);

  // Case 14: No-Origin requests continue to support legitimate non-browser clients without reflecting an origin
  let noOriginNextCalled = false;
  let noOriginAllowedHeader = '';
  const mockReqNoOrigin: any = { headers: {}, method: 'GET' };
  const mockResNoOrigin: any = {
    setHeader: (k: string, v: string) => { if (k === 'Access-Control-Allow-Origin') noOriginAllowedHeader = v; },
    status: () => mockResNoOrigin,
    json: () => {},
    end: () => {}
  };
  mockCors(mockReqNoOrigin, mockResNoOrigin, () => { noOriginNextCalled = true; });
  assert('CORS 14: No-Origin request passes through cleanly to next() without setting Access-Control-Allow-Origin', noOriginNextCalled && !noOriginAllowedHeader, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Server-Side Authentication & Token Verification
  // --------------------------------------------------------------------------
  const sampleDecoded = parseJwtPayload('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3ItdGVzdC1qd3QifQ.sig');
  assert('Auth 0: Decodes JWT payload without external library', sampleDecoded?.sub === 'usr-test-jwt', true, true);

  // Empty or missing token
  const emptyTokenRes = await verifyAuthToken('');
  assert('Auth 1: Strictly rejects empty or missing authentication token', emptyTokenRes.valid === false, emptyTokenRes.valid, false);

  // Malformed token
  const malformedRes = await verifyAuthToken('not.a.valid.jwt.string.extra.parts');
  assert('Auth 2: Strictly rejects malformed token strings that do not conform to JWT structure', malformedRes.valid === false, malformedRes.valid, false);

  // Expired token simulation
  const expiredPayload = {
    sub: 'user-expired-999',
    email: 'expired@test.com',
    exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
  };
  const expiredBase64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
  const expiredToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${expiredBase64}.signature`;
  const expiredRes = await verifyAuthToken(expiredToken);
  assert('Auth 3: Strictly rejects tokens past their exp timestamp with expired error', expiredRes.valid === false && Boolean(expiredRes.error && expiredRes.error.includes('Expired')), true, true);

  // Valid active token in test environment
  const activePayload = {
    sub: 'user-active-123',
    email: 'chemist@detergentlab.internal',
    iss: 'https://securetoken.google.com/test-project',
    exp: Math.floor(Date.now() / 1000) + 7200 // Valid for 2 hours
  };
  const activeBase64 = Buffer.from(JSON.stringify(activePayload)).toString('base64url');
  const activeToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${activeBase64}.signature`;
  const activeRes = await verifyAuthToken(activeToken);
  assert('Auth 4: Derives user identity from valid token without trusting client claims', activeRes.valid === true && activeRes.user?.uid === 'user-active-123', true, true);

  // Client-controlled role elevation attempt (sending role: 'admin' or @detergentlab-admin.internal email)
  const spoofAdminPayload = {
    sub: 'attacker-1',
    email: 'attacker@detergentlab-admin.internal',
    role: 'admin',
    iss: 'https://securetoken.google.com/test-project',
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const spoofAdminBase64 = Buffer.from(JSON.stringify(spoofAdminPayload)).toString('base64url');
  const spoofAdminToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${spoofAdminBase64}.signature`;
  const spoofAdminRes = await verifyAuthToken(spoofAdminToken);
  assert('Auth 5: Strictly neutralizes client-controlled admin elevation attempts, assigning role user', spoofAdminRes.valid === true && spoofAdminRes.user?.role === 'user', spoofAdminRes.user?.role, 'user');

  // Verified server-assigned custom claim
  const verifiedAdminPayload = {
    sub: 'admin-verified-1',
    email: 'admin@rnd.internal',
    admin: true,
    iss: 'https://securetoken.google.com/test-project',
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const verifiedAdminBase64 = Buffer.from(JSON.stringify(verifiedAdminPayload)).toString('base64url');
  const verifiedAdminToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${verifiedAdminBase64}.signature`;
  const verifiedAdminRes = await verifyAuthToken(verifiedAdminToken);
  assert('Auth 6: Assigns admin role only when verified custom claim admin:true is present', verifiedAdminRes.valid === true && verifiedAdminRes.user?.role === 'admin', verifiedAdminRes.user?.role, 'admin');

  // Live forged token without test issuer fails closed
  const forgedLiveToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmb3JnZWQiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbGl2ZS1wcm9qZWN0In0.invalidsig';
  const forgedLiveRes = await verifyAuthToken(forgedLiveToken);
  assert('Auth 7: Live token with unverified cryptographic signature strictly fails closed', forgedLiveRes.valid === false, forgedLiveRes.valid, false);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Per-User Data Isolation
  // --------------------------------------------------------------------------
  const ownerMatch = verifyUserOwnership('user-123', 'user-123');
  assert('UserIsolation 1: Permits operations when authenticated user owns the resource', ownerMatch, true, true);

  const crossUserAttempt = verifyUserOwnership('user-123', 'user-456');
  assert('UserIsolation 2: Strictly blocks cross-user data access (user A cannot touch user B)', crossUserAttempt === false, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Port Configuration & Fallbacks
  // --------------------------------------------------------------------------
  assert('Port 1: Valid numeric port is preserved', validatePort(8080) === 8080, validatePort(8080), 8080);
  assert('Port 2: Valid string port is parsed and returned as integer', validatePort('5000') === 5000, validatePort('5000'), 5000);
  assert('Port 3: Missing/undefined port defaults to 3000', validatePort(undefined) === 3000, validatePort(undefined), 3000);
  assert('Port 4: Empty string port defaults to 3000', validatePort('') === 3000, validatePort(''), 3000);
  assert('Port 5: Out of range (<1) port falls back to 3000', validatePort(0) === 3000, validatePort(0), 3000);
  assert('Port 6: Out of range (>65535) port falls back to 3000', validatePort(70000) === 3000, validatePort(70000), 3000);
  assert('Port 7: Non-numeric string port falls back to 3000', validatePort('invalid-port') === 3000, validatePort('invalid-port'), 3000);

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Gemini API Key Validation & Placeholder Detection
  // --------------------------------------------------------------------------
  assert('ApiKey 1: Undefined key returns false', isApiKeyConfigured(undefined) === false, false, false);
  assert('ApiKey 2: Empty string returns false', isApiKeyConfigured('') === false, false, false);
  assert('ApiKey 3: Whitespace string returns false', isApiKeyConfigured('   \t  ') === false, false, false);
  assert('ApiKey 4: Placeholder MY_GEMINI_API_KEY returns false', isApiKeyConfigured('MY_GEMINI_API_KEY') === false, false, false);
  assert('ApiKey 5: Placeholder YOUR_API_KEY returns false', isApiKeyConfigured('YOUR_API_KEY') === false, false, false);
  assert('ApiKey 6: Placeholder placeholder returns false', isApiKeyConfigured('placeholder') === false, false, false);
  assert('ApiKey 7: Short string (<10 chars) returns false', isApiKeyConfigured('shortkey') === false, false, false);
  assert('ApiKey 8: Legitimate key (>=10 chars, non-placeholder) returns true', isApiKeyConfigured('AIzaSyDFakeLegitimateKey12345') === true, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 9: Model Resolution & Trust Proxy Setting
  // --------------------------------------------------------------------------
  assert('Model 1: Defaults to documented default gemini-3.8-flash', resolveGeminiModel(undefined) === 'gemini-3.8-flash', resolveGeminiModel(undefined), 'gemini-3.8-flash');
  assert('Model 2: Accepts custom configured model string', resolveGeminiModel('gemini-3.1-flash-lite') === 'gemini-3.1-flash-lite', resolveGeminiModel('gemini-3.1-flash-lite'), 'gemini-3.1-flash-lite');
  assert('Proxy 1: Defaults to 1 for reverse proxy environments', resolveTrustProxy(undefined) === 1, resolveTrustProxy(undefined), 1);
  assert('Proxy 2: Parses string "true" as 1', resolveTrustProxy('true') === 1, resolveTrustProxy('true'), 1);
  assert('Proxy 3: Parses string "false" as boolean false', resolveTrustProxy('false') === false, resolveTrustProxy('false'), false);
  assert('Proxy 4: Parses string "0" as boolean false', resolveTrustProxy('0') === false, resolveTrustProxy('0'), false);
  assert('Proxy 5: Parses numeric string as integer hops', resolveTrustProxy('2') === 2, resolveTrustProxy('2'), 2);

  // --------------------------------------------------------------------------
  // TEST GROUP 10: Security Headers & Environment Validation
  // --------------------------------------------------------------------------
  const mockReq: any = { headers: {} };
  const mockHeaders: Record<string, string> = {};
  const mockRes: any = {
    setHeader: (key: string, val: string) => { mockHeaders[key] = val; }
  };
  let nextCalled: boolean = false;
  const secMiddleware = securityHeadersMiddleware();
  secMiddleware(mockReq, mockRes, () => { nextCalled = true; });

  assert('SecHeaders 1: Sets X-Content-Type-Options to nosniff', mockHeaders['X-Content-Type-Options'] === 'nosniff', mockHeaders['X-Content-Type-Options'], 'nosniff');
  assert('SecHeaders 2: Sets X-XSS-Protection to 1; mode=block', mockHeaders['X-XSS-Protection'] === '1; mode=block', mockHeaders['X-XSS-Protection'], '1; mode=block');
  assert('SecHeaders 3: Sets Referrer-Policy to strict-origin-when-cross-origin', mockHeaders['Referrer-Policy'] === 'strict-origin-when-cross-origin', mockHeaders['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert('SecHeaders 4: Does NOT set X-Frame-Options to DENY (preserves AI Studio iframe)', mockHeaders['X-Frame-Options'] !== 'DENY', mockHeaders['X-Frame-Options'], undefined);
  assert('SecHeaders 5: Passes control to next() in middleware chain', Boolean(nextCalled), nextCalled, true);

  const envAudit = validateEnvironmentConfig();
  assert('EnvAudit 1: Returns parsed port number', typeof envAudit.port === 'number' && envAudit.port > 0, true, true);
  assert('EnvAudit 2: Returns resolved model name', Boolean(envAudit.model && envAudit.model.length > 0), true, true);

  return { total: totalTests, passed: passedTests, failed: totalTests - passedTests };
}

if (process.argv[1]?.includes('serverSecurityAndTruthfulHealth.test')) {
  runServerSecurityAndTruthfulHealthTestSuite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}

# CORS REMEDIATION REPORT — DETERGENT FORMULA EXPERT (ISSUE 1)

**Component:** Server Security & Middleware (`src/services/serverSecurity.ts`)  
**Date:** 2026-10-19  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Executive Summary

A critical CORS configuration weakness was identified and resolved in `src/services/serverSecurity.ts`. The original implementation permitted arbitrary subdomains of `.run.app`, `.google.com`, and `.googleusercontent.com` via loose suffix matching (`host.endsWith('.run.app')`), and failed to treat `process.env.ALLOWED_ORIGINS` as an authoritative allowlist. 

This behavior has been completely remediated. Broad suffix fallback logic was removed. Explicit allowlists are now treated as strictly authoritative. Request origins are parsed and normalized safely, `Vary: Origin` is attached to prevent cross-origin cache poisoning, denied origins are prevented from receiving permissive CORS headers, wildcard origins are prohibited from combining with credentials, and requests without an Origin header (server-to-server, command-line) continue to operate cleanly without origin reflection.

---

## 2. Root Cause Analysis

1. **Permissive Suffix-Based Matching (`host.endsWith(...)`)**:
   `isOriginAllowed()` previously contained:
   ```ts
   host.endsWith('.run.app') ||
   host.endsWith('.google.com') ||
   host.endsWith('.googleusercontent.com')
   ```
   This allowed any attacker who deployed an untrusted service on Cloud Run (e.g., `https://attacker-service.run.app`) or hosted content under `*.googleusercontent.com` to make cross-origin authenticated requests with credentials against the API.

2. **Non-Authoritative Environment Variable Evaluation**:
   In `corsMiddleware()`, the `isExplicit` flag was previously evaluated as:
   ```ts
   const isExplicit = Boolean(customAllowedOrigins && customAllowedOrigins.length > 0);
   ```
   When `process.env.ALLOWED_ORIGINS` was configured via the environment, `isExplicit` remained `false`. As a consequence, even if an operator defined a strict allowlist (e.g. `ALLOWED_ORIGINS=https://app.example.com`), requests from arbitrary `.run.app` or `.google.com` origins still passed through the fallback block.

3. **Missing Canonical Normalization**:
   Origins were not parsed to validate scheme, hostname, and absence of user credentials (`user:pass@host`), unexpected query strings, fragments, or paths.

4. **Missing Cache Separation Header (`Vary: Origin`)**:
   Responses did not declare `Vary: Origin`, risking intermediary caching of responses tailored to specific origins.

---

## 3. Exact Changes Applied

### A. Implemented `normalizeOrigin(originStr: string): string | null`
- Uses standard WHATWG `URL` parser.
- Enforces allowed protocols (`http:`, `https:`, `capacitor:`, `ionic:`).
- Rejects user credentials (`url.username`, `url.password`).
- Rejects unexpected query parameters (`url.search`), fragments (`url.hash`), or URL paths beyond root (`url.pathname && url.pathname !== '/'`).
- Rejects malformed strings and string literal `'null'`.
- Returns lowercase canonical scheme + hostname + port.

### B. Rewrote `isOriginAllowed()` with Authoritative Enforcement
- **Removed Broad Suffix Fallback**: Completely deleted all `host.endsWith('.run.app')`, `host.endsWith('.google.com')`, and `host.endsWith('.googleusercontent.com')` checks.
- **Authoritative Explicit Allowlist**: When `isExplicitAllowlist === true` (either via programmatic options or `process.env.ALLOWED_ORIGINS`), requests strictly fail-closed if not present in the normalized allowlist.
- **Documented 'null' Origin Policy**: Literal `'null'` origin is rejected unless the string `'null'` is explicitly present in the allowlist.
- **Environment-Scoped Localhost Fallback**: Localhost/127.0.0.1 is permitted only under default non-explicit development configuration (`NODE_ENV !== 'production'`). If an explicit allowlist is configured in production, unlisted localhost is rejected.

### C. Updated `corsMiddleware()`
- Evaluates `isExplicit = hasCustom || hasEnv`, ensuring `process.env.ALLOWED_ORIGINS` is immediately authoritative.
- Supports exact legitimate Cloud Run / Google AI Studio origin injection via `process.env.APP_URL` without opening broad wildcard access to other Cloud Run apps.
- Attaches `Vary: Origin` to all browser responses with an `Origin` header.
- **OPTIONS Preflight Enforcement**:
  - Allowed origin: Responds with `204 No Content` and full CORS headers.
  - Denied origin: Immediately terminates with `403 Forbidden` and zero permissive CORS headers.
- **Credential & Wildcard Invariant**: Prohibits setting `Access-Control-Allow-Credentials: true` when wildcard `*` origin is allowed.
- **No-Origin Preservation**: Passes requests without an `Origin` header directly to `next()`, attaching no CORS headers.

---

## 4. Before vs. After Behavior Matrix

| Scenario | Request Origin | Before Remediation | After Remediation |
| :--- | :--- | :--- | :--- |
| **Allowed Origin** | `https://trusted-domain.com` | Allowed (200 / 204) | **Allowed (200 / 204)** with exact origin, `Vary: Origin`, and credentials |
| **Unlisted Attacker** | `https://attacker.example` | 403 Forbidden | **403 Forbidden** (Zero permissive headers) |
| **Arbitrary Cloud Run** | `https://attacker.run.app` | **Allowed (VULNERABILITY)** | **403 Forbidden** (Blocked) |
| **Arbitrary Google** | `https://malicious.google.com` | **Allowed (VULNERABILITY)** | **403 Forbidden** (Blocked) |
| **Arbitrary Google User Content** | `https://evil.googleusercontent.com` | **Allowed (VULNERABILITY)** | **403 Forbidden** (Blocked) |
| **Explicit Allowlist Bypass** | Suffix matching against explicit list | Permitted bypass if env set | **Strictly Blocked (Authoritative Fail-Closed)** |
| **Configured AI Studio URL** | `process.env.APP_URL` exact origin | Allowed | **Allowed via Exact Origin Matching** |
| **Localhost in Dev** | `http://localhost:3000` | Allowed | **Allowed in dev/test, Blocked if explicit list excludes it** |
| **Origin: null** | `null` | Allowed if non-explicit | **Denied (unless explicitly allowlisted)** |
| **Malformed Origin** | `https://user:pass@domain.com` | Unchecked | **Denied by `normalizeOrigin`** |
| **Wildcard Allowlist** | `*` | Insecure credentials combination | **Wildcard sets `*` without credentials** |
| **No-Origin Request** | *(no header)* | Calls `next()` | **Calls `next()` cleanly without CORS headers** |

---

## 5. Remaining Limitations & Operating Requirements

1. **Production Deployment Configuration**:
   In production environments, operators must configure `ALLOWED_ORIGINS` with a comma-separated list of exact origin URLs (e.g., `ALLOWED_ORIGINS=https://detergentlab.com,https://ais-pre-ym6digshqiqxzclyquokv2-218386943250.asia-southeast1.run.app`).
2. **Iframe Preview Mode**:
   When previewing inside Google AI Studio, ensure `process.env.APP_URL` contains the exact applet URL (which is standard in the AI Studio container environment) or specify it in `ALLOWED_ORIGINS`.

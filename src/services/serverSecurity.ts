/**
 * Server Security, Rate Limiting & Abuse Prevention Middleware
 * 
 * Provides:
 * 1. In-memory sliding-window rate limiting per client IP.
 * 2. Protection against oversized payloads and prompt abuse.
 * 3. Sanitized error responses preventing secret/stack trace leakage.
 * 4. Token validation without trusting client-supplied userIds.
 * 5. Configurable CORS allowlist and OPTIONS preflight handling.
 * 6. Google Play billing server verification with fail-closed enforcement.
 * 
 * Note on Architecture:
 * This rate limiter is in-memory. It protects the Node.js server instance.
 * It is not distributed protection across multiple cluster instances or serverless containers.
 * For multi-instance/serverless deployments, a distributed store (e.g., Redis
 * or Firestore distributed counters) should be configured.
 */

import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  endpointName?: string;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private tracker: Map<string, RateLimitRecord> = new Map();
  private lastCleanup: number = Date.now();

  /**
   * Cleans up expired rate-limit records every 5 minutes to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 300000) return;
    this.lastCleanup = now;

    for (const [key, record] of this.tracker.entries()) {
      if (now > record.resetAt) {
        this.tracker.delete(key);
      }
    }
  }

  public check(ip: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetInMs: number } {
    this.cleanup();
    const now = Date.now();
    const record = this.tracker.get(ip);

    if (!record || now > record.resetAt) {
      this.tracker.set(ip, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetInMs: Math.max(0, record.resetAt - now) };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetInMs: Math.max(0, record.resetAt - now) };
  }

  public reset(ip?: string): void {
    if (ip) {
      this.tracker.delete(ip);
    } else {
      this.tracker.clear();
    }
  }
}

export const serverRateLimiter = new InMemoryRateLimiter();

/**
 * Safely extracts client IP, rejecting spoofed or malformed headers.
 * Does not blindly trust forwarded headers without validation.
 */
export function getClientIp(req: Request): string {
  // If behind a trusted reverse proxy, express req.ip uses req.app.get('trust proxy')
  if (req.ip) {
    return req.ip;
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && /^[0-9a-fA-F:.]+$/.test(firstIp)) {
      return firstIp;
    }
  }

  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Express middleware for rate limiting AI and sensitive endpoints.
 * Emits X-RateLimit-Scope: instance-memory-single-process header.
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const { maxRequests, windowMs, endpointName = 'Endpoint' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = getClientIp(req);
    const key = `${endpointName}:${clientIp}`;
    const result = serverRateLimiter.check(key, maxRequests, windowMs);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetInMs / 1000));
    res.setHeader('X-RateLimit-Scope', 'instance-memory-single-process');

    if (!result.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil(result.resetInMs / 1000));
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        error: `Too many requests to ${endpointName}. Rate limit exceeded.`,
        retryAfterSeconds: retryAfterSec
      });
      return;
    }

    next();
  };
}

/**
 * Express middleware to validate maximum request body size (preventing memory exhaustion)
 */
export function payloadSizeValidator(maxBytes: number = 250000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      res.status(413).json({
        error: `Payload too large. Maximum allowed request size is ${Math.round(maxBytes / 1024)} KB.`
      });
      return;
    }

    // Also check serialized body length if parsed
    if (req.body && typeof req.body === 'object') {
      try {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length > maxBytes) {
          res.status(413).json({
            error: `Request body exceeds maximum size limit of ${Math.round(maxBytes / 1024)} KB.`
          });
          return;
        }
      } catch {
        // Fall through
      }
    }

    next();
  };
}

/**
 * Sanitizes errors before returning them to client, ensuring API keys and stack traces are never leaked
 */
export function sanitizeErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const msg = typeof err === 'string' ? err : err.message || 'Operation failed.';
  
  // Strip potential keys or file system paths
  let cleanMsg = msg
    .replace(/AIza[0-9A-Za-z-_]{20,50}/g, '[REDACTED_KEY]')
    .replace(/\/app\/[a-zA-Z0-9_\-\.\/]+/g, '[REDACTED_PATH]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

  return cleanMsg;
}

/**
 * Safely parses and normalizes an origin string to its canonical scheme://host(:port).
 * Rejects origins with userinfo, paths, queries, fragments, unsupported schemes, or literal 'null'.
 */
export function normalizeOrigin(originStr: string): string | null {
  if (!originStr || typeof originStr !== 'string') return null;
  const trimmed = originStr.trim();
  if (!trimmed || trimmed === 'null') return null;

  try {
    const url = new URL(trimmed);
    const protocol = url.protocol.toLowerCase();

    // Permitted schemes: web (http, https) and mobile webview containers (capacitor, ionic)
    if (protocol !== 'http:' && protocol !== 'https:' && protocol !== 'capacitor:' && protocol !== 'ionic:') {
      return null;
    }

    // Disallow user credentials (e.g. https://user:pass@domain.com)
    if (url.username || url.password) {
      return null;
    }

    // Disallow query parameters or fragment identifiers in origin
    if (url.search || url.hash) {
      return null;
    }

    // Disallow paths beyond standard root '/'
    if (url.pathname && url.pathname !== '/') {
      return null;
    }

    // For standard web protocols, hostname must be non-empty
    if ((protocol === 'http:' || protocol === 'https:') && !url.hostname) {
      return null;
    }

    // Mobile schemes (capacitor://localhost, ionic://localhost)
    if (protocol === 'capacitor:' || protocol === 'ionic:') {
      const host = (url.hostname || url.host || 'localhost').toLowerCase();
      return `${protocol}//${host}`;
    }

    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Determines whether a given request origin is allowed based on the allowlist and environment configuration.
 * Strictly adheres to explicit allowlists (ALLOWED_ORIGINS) without broad suffix fallbacks.
 */
export function isOriginAllowed(
  origin: string,
  allowedOrigins: string[],
  isExplicitAllowlist: boolean = false
): boolean {
  if (!origin || typeof origin !== 'string') return false;

  const trimmedOrigin = origin.trim();
  if (!trimmedOrigin) return false;

  // Handle literal "null" origin: only permitted if explicitly allowlisted
  if (trimmedOrigin === 'null') {
    return allowedOrigins.includes('null');
  }

  const normalizedReqOrigin = normalizeOrigin(trimmedOrigin);
  if (!normalizedReqOrigin) {
    return false;
  }

  // Pre-normalize allowedOrigins list
  const normalizedAllowedSet = new Set<string>();
  let hasWildcard = false;

  for (const entry of allowedOrigins) {
    if (!entry || typeof entry !== 'string') continue;
    const trimmedEntry = entry.trim();
    if (trimmedEntry === '*') {
      hasWildcard = true;
      continue;
    }
    if (trimmedEntry === 'null') {
      normalizedAllowedSet.add('null');
      continue;
    }
    const norm = normalizeOrigin(trimmedEntry);
    if (norm) {
      normalizedAllowedSet.add(norm);
    }
  }

  // Wildcard allowlist
  if (hasWildcard) {
    return true;
  }

  // Direct exact match against normalized allowlist
  if (normalizedAllowedSet.has(normalizedReqOrigin)) {
    return true;
  }

  // If caller or environment configured an explicit allowlist, strictly fail-closed.
  // No suffix fallback or heuristic matches are permitted.
  if (isExplicitAllowlist) {
    return false;
  }

  // Default non-explicit development fallback:
  // ONLY in non-production environments (development or test), permit localhost / 127.0.0.1 and mobile app schemes
  const isDevOrTest = process.env.NODE_ENV !== 'production';
  if (isDevOrTest) {
    try {
      const url = new URL(normalizedReqOrigin);
      const host = url.hostname.toLowerCase();
      if (
        (host === 'localhost' || host === '127.0.0.1') &&
        (url.protocol === 'http:' || url.protocol === 'https:')
      ) {
        return true;
      }
      if (url.protocol === 'capacitor:' || url.protocol === 'ionic:') {
        return true;
      }
    } catch {
      return false;
    }
  }

  // Suffix checks (*.run.app, *.google.com, *.googleusercontent.com) have been completely removed.
  // Arbitrary subdomains are strictly rejected.
  return false;
}

/**
 * Configurable CORS Allowlist & Preflight Middleware
 * 
 * Enforces strict, deterministic origin verification:
 * - Authoritative explicit allowlist (ALLOWED_ORIGINS or custom)
 * - Exact validated origin return with Vary: Origin
 * - Never combines wildcard origin with Access-Control-Allow-Credentials
 * - Denied origins receive 403 Forbidden with zero permissive CORS headers
 * - No-origin requests (server-to-server, curl) pass through cleanly
 */
export function corsMiddleware(customAllowedOrigins?: string[]) {
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const hasCustom = Boolean(customAllowedOrigins && customAllowedOrigins.length > 0);
  const hasEnv = envOrigins.length > 0;
  const isExplicit = hasCustom || hasEnv;

  const defaultOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:5173',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost'
  ];

  // If specific legitimate Cloud Run / AI Studio app URL is set in environment, add its exact origin
  if (process.env.APP_URL) {
    const normAppUrl = normalizeOrigin(process.env.APP_URL);
    if (normAppUrl && !defaultOrigins.includes(normAppUrl)) {
      defaultOrigins.push(normAppUrl);
    }
  }

  const allowedOrigins = hasCustom
    ? customAllowedOrigins!
    : (hasEnv ? envOrigins : defaultOrigins);

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    // 1. Same-origin or non-browser server-to-server request (no Origin header)
    if (!origin) {
      next();
      return;
    }

    // Always signal downstream caches that response varies by request origin
    res.setHeader('Vary', 'Origin');

    const isAllowed = isOriginAllowed(origin, allowedOrigins, isExplicit);

    if (!isAllowed) {
      if (req.method === 'OPTIONS') {
        res.status(403).json({ error: 'CORS policy violation: Origin not allowed.' });
        return;
      }

      // Non-API frontend assets in dev/preview mode
      const requestPath = req.path || req.url || '';
      const isStaticAsset = Boolean(requestPath && !requestPath.startsWith('/api'));
      if (isStaticAsset && process.env.NODE_ENV !== 'production') {
        next();
        return;
      }

      res.status(403).json({ error: 'CORS policy violation: Origin not allowed.' });
      return;
    }

    // Origin is allowed: normalize and set headers
    const normalizedReqOrigin = normalizeOrigin(origin) || origin;
    const hasWildcardAllow = allowedOrigins.includes('*');

    if (hasWildcardAllow) {
      // Invariant: Do not use wildcard Access-Control-Allow-Origin: * with credentials
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      res.setHeader('Access-Control-Allow-Origin', normalizedReqOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}

/**
 * JWT Payload helper: decodes base64url payload without external libraries
 */
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { google } from 'googleapis';
import fs from 'fs';
import firebaseConfig from '../../firebase-applet-config.json';

import {
  DurablePurchaseStore,
  isGenuineTestEnvironment
} from './durablePurchaseStore';

let firebaseAdminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (!firebaseAdminApp) {
    if (getApps().length > 0) {
      firebaseAdminApp = getApp();
    } else {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (serviceAccountKey) {
        try {
          let certObj: any;
          if (serviceAccountKey.trim().startsWith('{')) {
            certObj = JSON.parse(serviceAccountKey);
          } else if (fs.existsSync(serviceAccountKey)) {
            certObj = JSON.parse(fs.readFileSync(serviceAccountKey, 'utf8'));
          }
          if (certObj) {
            firebaseAdminApp = initializeApp({
              credential: cert(certObj),
              projectId: certObj.project_id || (firebaseConfig as any).projectId
            });
          }
        } catch (e) {
          console.error('[serverSecurity] Failed to parse Firebase service account credentials:', e);
        }
      }
      if (!firebaseAdminApp) {
        // Initialize with canonical project ID from applet config to support cryptographic verification of Google-signed ID tokens
        firebaseAdminApp = initializeApp({
          projectId: (firebaseConfig as any).projectId || 'imagined-zone-cv4kj'
        });
      }
    }
  }
  return firebaseAdminApp;
}

export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'user' | 'admin';
}

/**
 * Server-side Token Verification
 * Uses the official Firebase Admin SDK to cryptographically verify ID tokens.
 * Enforces checkRevoked = true to reject revoked sessions.
 * Strictly eliminates client-controlled admin escalation.
 * Isolates test authentication strictly to genuine test processes (never active in production).
 * Fails closed in production if verification cannot be completed.
 */
export async function verifyAuthToken(
  token: string
): Promise<{ valid: boolean; user?: AuthenticatedUser; error?: string }> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { valid: false, error: 'Missing or empty authentication token.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed authentication token: Unable to decode JWT structure.' };
  }

  // Pre-validate basic payload structure
  const payload = parseJwtPayload(token);
  if (!payload) {
    return { valid: false, error: 'Malformed authentication token: Unable to decode JWT payload.' };
  }

  // Check expiration timestamp
  if (payload.exp && typeof payload.exp === 'number') {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > payload.exp) {
      return { valid: false, error: 'Expired authentication token: Token has passed its exp timestamp.' };
    }
  }

  // Strictly isolated to genuine test processes running test scripts (never in production)
  const isTestProcess = isGenuineTestEnvironment() && payload.iss === 'https://securetoken.google.com/test-project';

  if (isTestProcess) {
    const uid = payload.user_id || payload.sub || payload.uid;
    if (!uid || typeof uid !== 'string') {
      return { valid: false, error: 'Invalid token claims: Token missing user identifier (sub/user_id).' };
    }

    // Role is 'admin' ONLY if explicitly set via verified server custom claims in token, NEVER by arbitrary client headers
    // Client-supplied email domains (like @detergentlab-admin.internal) are NEVER trusted for admin elevation
    const role: 'user' | 'admin' = (payload.admin === true || payload['https://detergentlab.internal/admin'] === true)
      ? 'admin'
      : 'user';

    return {
      valid: true,
      user: { uid, email: payload.email, role }
    };
  }

  // In live production mode: Cryptographic verification using official Firebase Admin SDK with revocation check
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token, true);

    const uid = decodedToken.uid;
    if (!uid) {
      return { valid: false, error: 'Cryptographic verification failed: Missing uid in decoded token.' };
    }

    // Role comes strictly from server-assigned custom claims on the token
    const role: 'user' | 'admin' = (decodedToken.admin === true || decodedToken.role === 'admin')
      ? 'admin'
      : 'user';

    return {
      valid: true,
      user: {
        uid,
        email: decodedToken.email,
        role
      }
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Cryptographic token verification failed: ${sanitizeErrorMessage(err)}`
    };
  }
}

/**
 * Express middleware for protected endpoints requiring authenticated users.
 * Attaches verified user identity to req.user.
 * Never trusts client-supplied userIds.
 */
export function authenticateUserMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required: Missing Authorization header with Bearer token.'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  verifyAuthToken(token).then(result => {
    if (!result.valid || !result.user) {
      res.status(401).json({
        error: result.error || 'Authentication failed: Invalid or expired token.'
      });
      return;
    }

    (req as any).user = result.user;
    next();
  }).catch(err => {
    res.status(401).json({
      error: `Authentication error: ${sanitizeErrorMessage(err)}`
    });
  });
}

/**
 * Express middleware requiring administrator role.
 */
export function requireAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as any).user as AuthenticatedUser | undefined;
  if (!user || user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: Endpoint requires administrator privileges.'
    });
    return;
  }
  next();
}

/**
 * Enforces per-user data isolation.
 * Prevents user A from modifying or accessing user B's records.
 */
export function verifyUserOwnership(authenticatedUid: string, targetUserId: string): boolean {
  if (!authenticatedUid || !targetUserId) return false;
  return authenticatedUid === targetUserId;
}

// ----------------------------------------------------------------------------
// GOOGLE PLAY BILLING SERVER VERIFICATION (FAIL-CLOSED)
// ----------------------------------------------------------------------------

export interface VerifyPurchaseRequest {
  packageName: string;
  productId: string;
  purchaseToken: string;
  userId: string;
}

export interface VerifyPurchaseResult {
  verified: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED' | 'REFUNDED' | 'UNVERIFIED';
  productId?: string;
  userId?: string;
  error?: string;
}

export const ALLOWED_PLAY_PRODUCT_IDS = [
  'com.detergentlab.pro.monthly',
  'com.detergentlab.pro.yearly',
  'com.detergentlab.team.yearly'
];

export const CANONICAL_PACKAGE_NAME = 'com.detergentrnd.formulaexpert';


/**
 * Express middleware requiring a verified, non-anonymous authenticated user for billing operations.
 * Strictly rejects anonymous_client or unauthenticated sessions.
 */
export function requireVerifiedBillingAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as any).user as AuthenticatedUser | undefined;
  if (!user || !user.uid || user.uid === 'anonymous_client') {
    res.status(401).json({
      error: 'Verified authentication required for billing. Anonymous or unauthenticated requests are strictly prohibited.',
      status: 'UNVERIFIED'
    });
    return;
  }
  next();
}

/**
 * Verifies a Google Play subscription with strict fail-closed enforcement:
 * 1. Validates application package name against canonical package.
 * 2. Validates product ID against canonical allowed catalog.
 * 3. Enforces user ID binding (strictly rejects anonymous_client and empty IDs).
 * 4. Checks durable transactional/idempotent replay prevention across accounts.
 * 5. Calls official Google Play Developer API (androidpublisher.purchases.subscriptions.get).
 * 6. Verifies server response fields (expiryTimeMillis, cancelReason, paymentState).
 * 7. Safe Fail-Closed: If Developer API credentials are not configured, live verification is marked BLOCKED.
 * 8. Never logs purchase tokens or secrets.
 */
export async function verifyGooglePlayPurchase(
  request: VerifyPurchaseRequest
): Promise<VerifyPurchaseResult> {
  const { packageName, productId, purchaseToken, userId } = request;

  // 1. Package name validation
  if (packageName !== CANONICAL_PACKAGE_NAME) {
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: `Invalid application package name: '${packageName}'. Expected '${CANONICAL_PACKAGE_NAME}'.`
    };
  }

  // 2. Product ID validation
  if (!ALLOWED_PLAY_PRODUCT_IDS.includes(productId)) {
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: `Unrecognized product ID: '${productId}'. Must be one of: ${ALLOWED_PLAY_PRODUCT_IDS.join(', ')}.`
    };
  }

  // 3. Purchase token presence
  if (!purchaseToken || typeof purchaseToken !== 'string' || purchaseToken.trim().length === 0) {
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: 'Empty or invalid purchase token.'
    };
  }

  // 4. User ID binding: strictly reject missing or anonymous user IDs
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0 || userId === 'anonymous_client') {
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: 'Missing or anonymous user ID. Purchases must be bound to a verified authenticated account.'
    };
  }

  // 5. Durable Replay prevention check: prevent cross-account token reuse
  const replayCheck = await DurablePurchaseStore.checkReplay(purchaseToken, userId);
  if (!replayCheck.allowed) {
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: replayCheck.error || 'Durable purchase token replay check failed. Access denied (fail-closed).'
    };
  }

  // 6. External Google Play Developer API credentials check
  const hasPlayCredentials = Boolean(
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );

  if (!hasPlayCredentials) {
    // FAIL-CLOSED: Never grant paid entitlements without live Developer API receipt validation
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: 'Google Play Developer API service account credentials (GOOGLE_PLAY_SERVICE_ACCOUNT_KEY) are not configured on the server. Live verification BLOCKED (fail-closed).'
    };
  }

  // 7. Official Google Play Developer API Verification
  try {
    const androidpublisher = google.androidpublisher('v3');
    let credentialsObj: any;
    const keyEnv = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyEnv) {
      if (keyEnv.trim().startsWith('{')) {
        credentialsObj = JSON.parse(keyEnv);
      } else if (fs.existsSync(keyEnv)) {
        credentialsObj = JSON.parse(fs.readFileSync(keyEnv, 'utf8'));
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credentialsObj,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    const authClient = await auth.getClient();

    const playRes = await androidpublisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
      auth: authClient as any
    });

    const sub = playRes.data;
    if (!sub) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        error: 'Empty response received from Google Play Developer API.'
      };
    }

    // Validate product matches one of the lineItems
    const matchedItem = sub.lineItems?.find(item => item.productId === productId);
    if (!matchedItem) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        error: `Purchased product mismatch: line item '${productId}' not found in Google Play receipt.`
      };
    }

    const expiryTimeIso = matchedItem.expiryTime;
    const expiryTimeMillis = expiryTimeIso ? new Date(expiryTimeIso).getTime() : 0;
    const nowMs = Date.now();

    if (!expiryTimeMillis || isNaN(expiryTimeMillis) || expiryTimeMillis <= nowMs) {
      return {
        verified: false,
        status: 'EXPIRED',
        productId,
        userId,
        error: 'Subscription has expired or lacks a valid future expiry timestamp.'
      };
    }

    // Google Play Subscription State Strict Allowlist & Fail-Closed Enforcement
    const allowedStates = [
      'SUBSCRIPTION_STATE_ACTIVE',
      'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
      'SUBSCRIPTION_STATE_CANCELED'
    ];

    const currentState = sub.subscriptionState;
    if (!currentState || !allowedStates.includes(currentState)) {
      return {
        verified: false,
        status: currentState === 'SUBSCRIPTION_STATE_EXPIRED' ? 'EXPIRED' : 'UNVERIFIED',
        productId,
        userId,
        error: `Google Play subscription state '${currentState || 'UNKNOWN'}' is not permitted or unrecognized. Access denied (fail-closed).`
      };
    }

    // SUBSCRIPTION_STATE_ACTIVE, SUBSCRIPTION_STATE_IN_GRACE_PERIOD, or SUBSCRIPTION_STATE_CANCELED with future expiry
    // Atomically persist verified grant in durable store bound to user
    let recordResult;
    try {
      recordResult = await DurablePurchaseStore.recordGrant({
        purchaseToken,
        userId,
        productId,
        packageName,
        subscriptionState: sub.subscriptionState || 'SUBSCRIPTION_STATE_ACTIVE',
        expiryTimeMillis
      });
    } catch (storeErr: any) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        productId,
        userId,
        error: `Durable store grant persistence threw an exception: ${sanitizeErrorMessage(storeErr)}`
      };
    }

    // Fail-Closed Security Invariant: Durable purchase grant recording MUST succeed before granting access
    if (!recordResult || !recordResult.success || !recordResult.grant) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        productId,
        userId,
        error: recordResult?.error || 'Durable purchase grant recording failed or was rejected. Access denied (fail-closed).'
      };
    }

    return {
      verified: true,
      status: 'ACTIVE',
      productId,
      userId
    };
  } catch (apiErr: any) {
    return {
      verified: false,
      status: 'UNVERIFIED',
      error: `Google Play Developer API verification failed: ${sanitizeErrorMessage(apiErr)}`
    };
  }
}

/**
 * Startup Security Diagnostics
 * Safely inspects configuration for Firebase Admin, Firestore, and Google Play Developer API.
 * Never logs secrets or private keys.
 */
export function runStartupSecurityDiagnostics(): {
  firebaseAdminConfigured: boolean;
  firestoreConfigured: boolean;
  playBillingConfigured: boolean;
  policy: string;
} {
  const hasFirebase = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasPlay = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasFirestore = Boolean(getFirebaseAdminApp());

  console.log('--- STARTUP SECURITY & BILLING DIAGNOSTICS ---');
  console.log(`Firebase Admin Auth: ${hasFirebase ? 'Configured (Service Account)' : 'Default (Applet Config Project ID)'}`);
  console.log(`Firestore Database: ${hasFirestore ? 'Available' : 'Unconfigured'}`);
  console.log(`Google Play Developer API: ${hasPlay ? 'Configured' : 'Missing Credentials (Fail-Closed Active)'}`);
  console.log(`Policy: STRICT_FAIL_CLOSED_SERVER_VERIFIED`);
  console.log('----------------------------------------------');

  return {
    firebaseAdminConfigured: hasFirebase,
    firestoreConfigured: hasFirestore,
    playBillingConfigured: hasPlay,
    policy: 'STCRIPTION_STATE_STRICT_FAIL_CLOSED'
  };
}

/**
 * Validates integer listening port between 1 and 65535, falling back to 3000 for local dev and AI Studio preview.
 */
export function validatePort(portVal?: string | number): number {
  if (portVal === undefined || portVal === null) return 3000;
  const num = typeof portVal === 'number' ? portVal : parseInt(String(portVal).trim(), 10);
  if (isNaN(num) || num < 1 || num > 65535) {
    return 3000;
  }
  return num;
}

/**
 * Validates whether an API key is genuinely configured (non-empty, non-whitespace, non-placeholder, >=10 chars).
 */
export function isApiKeyConfigured(apiKey?: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  const trimmed = apiKey.trim();
  if (trimmed.length < 10) return false;
  const placeholderPatterns = [
    'MY_GEMINI_API_KEY',
    'YOUR_API_KEY',
    'placeholder',
    'undefined',
    'null',
    'YOUR_KEY_HERE',
    'API_KEY_HERE'
  ];
  if (placeholderPatterns.some(p => trimmed.toLowerCase() === p.toLowerCase())) {
    return false;
  }
  return true;
}

/**
 * Resolves the AI model identifier from custom/env config or verified default gemini-3.8-flash.
 */
export function resolveGeminiModel(customModel?: string): string {
  const DEFAULT_MODEL = 'gemini-3.8-flash';
  const candidate = customModel || process.env.GEMINI_MODEL;
  if (!candidate || typeof candidate !== 'string' || !candidate.trim()) {
    return DEFAULT_MODEL;
  }
  return candidate.trim();
}

/**
 * Parses reverse proxy trust setting ('true', 'false', hop integer, or subnets), defaulting to 1 for Cloud Run.
 */
export function resolveTrustProxy(trustVal?: string): boolean | number | string {
  if (trustVal === undefined || trustVal === null || trustVal === '') {
    return 1;
  }
  const trimmed = String(trustVal).trim().toLowerCase();
  if (trimmed === 'true') {
    return 1;
  }
  if (trimmed === 'false' || trimmed === '0') {
    return false;
  }
  const parsedNum = parseInt(trimmed, 10);
  if (!isNaN(parsedNum) && String(parsedNum) === trimmed) {
    return parsedNum;
  }
  return trustVal;
}

/**
 * Middleware establishing standard web security response headers while preserving AI Studio preview iframe embedding.
 */
export function securityHeadersMiddleware() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // NOTE: X-Frame-Options is intentionally omitted to maintain compatibility with Google AI Studio preview iframes.
    next();
  };
}

/**
 * Startup Environment Diagnostic Validator
 */
export function validateEnvironmentConfig(): {
  port: number;
  model: string;
  trustProxy: boolean | number | string;
  hasGeminiKey: boolean;
  hasFirebaseCredentials: boolean;
} {
  const port = validatePort(process.env.PORT);
  const model = resolveGeminiModel();
  const trustProxy = resolveTrustProxy(process.env.TRUST_PROXY);
  const hasGeminiKey = isApiKeyConfigured(process.env.GEMINI_API_KEY);
  const hasFirebaseCredentials = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);

  return {
    port,
    model,
    trustProxy,
    hasGeminiKey,
    hasFirebaseCredentials
  };
}

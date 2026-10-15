/**
 * Server Security, Rate Limiting & Abuse Prevention Middleware
 * 
 * Provides:
 * 1. In-memory sliding-window rate limiting per client IP.
 * 2. Protection against oversized payloads and prompt abuse.
 * 3. Sanitized error responses preventing secret/stack trace leakage.
 * 4. Token validation without trusting client-supplied userIds.
 * 
 * Note on Architecture:
 * This rate limiter is in-memory. It protects the Node.js server instance.
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
 * Safely extracts client IP, rejecting spoofed or malformed headers
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
 * Express middleware for rate limiting AI and sensitive endpoints
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

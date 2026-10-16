# Detergent Formula Expert — Combined Correction 47 Implementation Specification

## Overview
This specification details the cryptographic authentication hardening, Google Play Developer API billing verification, durable concurrency-safe replay protection, and full test matrix enforcement implemented under Combined Correction 47.

## Key Changes
1. **Authentication Security (P0)**:
   - Eliminated all production-accessible JWT verification bypasses and test-authentication triggers.
   - Isolated synthetic test authentication exclusively to genuine test processes (`process.env.NODE_ENV === 'test'`).
   - Cryptographically verify all incoming Firebase ID tokens with `getAuth(adminApp).verifyIdToken(token, true)`.
   - Stripped client-controlled admin claims and fake internal email domain elevation (`@detergentlab-admin.internal`).
   - Gated `/api/ai/*` routes behind `authenticateUserMiddleware`.
   - Gated `/api/admin/*` behind `requireAdminMiddleware`.
   - Enforced user-level data isolation via `verifyUserOwnership`.

2. **Google Play Developer API Verification (P1)**:
   - Implemented official `subscriptionsv2.get` integration with `@googleapis/androidpublisher`.
   - Enforced canonical package name (`com.detergentrnd.formulaexpert`) and approved product catalog matching.
   - Enforced parseable, future expiry timestamp requirements on matching product line items.
   - Handled all documented Google Play subscription states (`ACTIVE`, `IN_GRACE_PERIOD`, `ON_HOLD`, `PAUSED`, `EXPIRED`, `PENDING`, `CANCELED`).
   - Safe fail-closed enforcement: if credentials are not configured, requests fail closed with status `UNVERIFIED` and live verification is marked `BLOCKED`.
   - Strictly rejected `anonymous_client` and unauthenticated sessions from billing endpoints.

3. **Durable Replay Protection**:
   - Implemented `DurablePurchaseStore` (`src/services/durablePurchaseStore.ts`).
   - Uses SHA-256 token fingerprints to avoid storing or logging sensitive raw purchase tokens or service secrets.
   - In production, leverages atomic Firestore transactions to prevent cross-account replay and concurrent race conditions.
   - Permits idempotent re-verification for the same user while strictly blocking cross-account reuse.

# Security Fixes README — Original Assessment & Resolution

## Summary of Fixed Vulnerabilities
1. **Unverified Token Decoding Bypass**:
   - *Previous state*: Tokens were decoded using base64 decoding without cryptographic signature validation.
   - *Fix*: Integrated Firebase Admin SDK `getAuth().verifyIdToken(token, true)` enforcing RSA cryptographic signature checks against Google public keys and checking revocation.
2. **Client-Controlled Admin Elevation**:
   - *Previous state*: Tokens with `payload.role === 'admin'` or ending in `@detergentlab-admin.internal` were granted admin access.
   - *Fix*: Removed all client-controlled admin parsing. Role is strictly assigned from verified custom claims (`decodedToken.admin === true`).
3. **Google Play Billing Local Map Bypass**:
   - *Previous state*: Re-verifications could return active status from an in-memory map without verifying with Google Play Developer API.
   - *Fix*: Replaced in-memory map bypass with real `subscriptionsv2.get` Developer API calls and durable transaction-safe replay protection.
4. **Anonymous Billing Access**:
   - *Previous state*: Billing could be called with `userId: 'anonymous_client'`.
   - *Fix*: Added `requireVerifiedBillingAuthMiddleware` which strictly rejects unauthenticated and anonymous callers with 401 Unauthorized.
5. **Durable Replay Protection**:
   - *Previous state*: In-memory map reset on server restart, enabling replay attacks.
   - *Fix*: Added `DurablePurchaseStore` hashing tokens with SHA-256 and writing to Firestore atomically.

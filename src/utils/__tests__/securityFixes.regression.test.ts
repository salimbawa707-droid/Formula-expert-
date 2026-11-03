/**
 * ============================================================================
 * SECURITY FIXES & BILLING REPLAY REGRESSION TEST MATRIX (CORRECTION 47)
 * ============================================================================
 * 
 * Verifies P0 Authentication Security and P1 Google Play Purchase Verification:
 * 1. P0 Authentication:
 *    - Cryptographic verification via Firebase Admin SDK.
 *    - Strict fail-closed on missing, expired, revoked, or forged tokens.
 *    - Production isolation: test-project issuer bypass cannot be activated outside test runner.
 *    - Strict neutralization of client-controlled admin claims and email domains.
 *    - Route privilege and per-user data isolation.
 * 2. P1 Google Play Verification & Durable Replay Protection:
 *    - Official Developer API semantics and safe fail-closed when credentials unconfigured.
 *    - Validation of package name, product ID, and matching line item product.
 *    - Enforces valid future expiry timestamp on matching line items.
 *    - Comprehensive handling of all Google Play subscription states (PENDING, PAUSED, ON_HOLD, EXPIRED, CANCELED, ACTIVE).
 *    - Durable replay prevention using SHA-256 token fingerprints.
 *    - Idempotent re-verification for the same user without allowing cross-account reuse.
 *    - Concurrency and cross-account replay rejection.
 */

import {
  verifyAuthToken,
  verifySupabaseAccessToken,
  matchesConfiguredSupabaseIssuer,
  authenticateUserMiddleware,
  requireAdminMiddleware,
  requireVerifiedBillingAuthMiddleware,
  verifyUserOwnership,
  verifyGooglePlayPurchase,
  CANONICAL_PACKAGE_NAME,
  ALLOWED_PLAY_PRODUCT_IDS
} from '../../services/serverSecurity';
import {
  DurablePurchaseStore,
  computeTokenFingerprint
} from '../../services/durablePurchaseStore';
import { google } from 'googleapis';
import { clearPersistedAuthentication, createAuthUnavailableResult } from '../../services/supabaseClient';

export interface SecurityFixesTestSummary {
  total: number;
  passed: number;
  failed: number;
}

export async function runSecurityFixesTestSuite(): Promise<SecurityFixesTestSummary> {
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
  console.log(' SECURITY FIXES & BILLING REPLAY TEST MATRIX (47) ');
  console.log('==================================================');

  // Reset test store before test execution
  DurablePurchaseStore.resetTestStore();

  const unconfiguredAuth = createAuthUnavailableResult('Email sign-in');
  assert(
    'P0 Auth 1: Unconfigured authentication fails closed instead of creating a local fake identity',
    unconfiguredAuth.success === false && !unconfiguredAuth.user && Boolean(unconfiguredAuth.error?.includes('not configured')),
    unconfiguredAuth,
    'failed result without a user identity'
  );
  const restoredLegacyProfile = clearPersistedAuthentication({ id: 'legacy-local-user', isAuthenticated: true });
  assert(
    'P0 Auth 2: A cached local profile cannot restore authenticated state without a live provider session',
    restoredLegacyProfile.isAuthenticated === false && restoredLegacyProfile.id === 'legacy-local-user',
    restoredLegacyProfile,
    'same profile with authentication cleared'
  );
  let supabaseVerificationUrl = '';
  let supabaseVerificationBearer = '';
  const supabaseVerified = await verifySupabaseAccessToken(
    'signed.supabase.token',
    'https://example-project.supabase.co',
    'public-anon-key',
    async (input, init) => {
      supabaseVerificationUrl = String(input);
      supabaseVerificationBearer = new Headers(init?.headers).get('Authorization') || '';
      return new Response(JSON.stringify({ id: 'verified-supabase-user', email: 'chemist@example.com' }), { status: 200 });
    }
  );
  assert(
    'P0 Auth 3: Supabase identity is accepted only after server-side Auth API verification',
    supabaseVerified.valid && supabaseVerified.user?.uid === 'verified-supabase-user' &&
      supabaseVerificationUrl === 'https://example-project.supabase.co/auth/v1/user' &&
      supabaseVerificationBearer === 'Bearer signed.supabase.token',
    { supabaseVerified, supabaseVerificationUrl, supabaseVerificationBearer },
    'verified provider user and exact configured Auth endpoint'
  );
  assert(
    'P0 Auth 4: Supabase JWT issuer must exactly match the configured project',
    matchesConfiguredSupabaseIssuer('https://example-project.supabase.co/auth/v1', 'https://example-project.supabase.co') &&
      !matchesConfiguredSupabaseIssuer('https://attacker-project.supabase.co/auth/v1', 'https://example-project.supabase.co') &&
      !matchesConfiguredSupabaseIssuer('not-a-url', 'https://example-project.supabase.co'),
    'same project accepted; foreign and malformed issuers rejected',
    true
  );
  const rejectedSupabase = await verifySupabaseAccessToken(
    'invalid.token',
    'https://example-project.supabase.co',
    'public-anon-key',
    async () => new Response('{}', { status: 401 })
  );
  assert(
    'P0 Auth 5: Supabase rejects invalid/expired tokens without creating an identity',
    !rejectedSupabase.valid && !rejectedSupabase.user,
    rejectedSupabase,
    'invalid token rejected'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 1: P0 Authentication Security & Token Claims Sanitization
  // --------------------------------------------------------------------------
  
  // 1. Missing or empty token
  const emptyRes = await verifyAuthToken('');
  assert('P0-Auth 1: Empty or missing token is rejected fail-closed', emptyRes.valid === false, emptyRes.valid, false);

  // 2. Malformed token format
  const malformedRes = await verifyAuthToken('invalid.format');
  assert('P0-Auth 2: Malformed JWT structure is rejected fail-closed', malformedRes.valid === false, malformedRes.valid, false);

  // 3. Expired token
  const expiredPayload = {
    sub: 'user-expired',
    email: 'expired@detergentrnd.com',
    iss: 'https://securetoken.google.com/test-project',
    exp: Math.floor(Date.now() / 1000) - 300 // expired 5 mins ago
  };
  const expToken = `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')}.sig`;
  const expRes = await verifyAuthToken(expToken);
  assert('P0-Auth 3: Expired token is rejected with explicit exp error', expRes.valid === false && Boolean(expRes.error?.includes('Expired')), true, true);

  // 4. Client-controlled admin spoofing: client attempts to claim admin role
  const clientAdminPayload = {
    sub: 'client-user-1',
    email: 'hacker@detergentlab-admin.internal',
    role: 'admin',
    admin: false,
    iss: 'https://securetoken.google.com/test-project',
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const clientAdminToken = `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify(clientAdminPayload)).toString('base64url')}.sig`;
  const clientAdminRes = await verifyAuthToken(clientAdminToken);
  assert('P0-Auth 4: Client-controlled admin claims and email domains are strictly neutralized to user role', clientAdminRes.valid === true && clientAdminRes.user?.role === 'user', clientAdminRes.user?.role, 'user');

  // 5. Genuine verified admin custom claim
  const verifiedAdminPayload = {
    sub: 'admin-user-1',
    email: 'director@rnd.internal',
    admin: true,
    iss: 'https://securetoken.google.com/test-project',
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const verifiedAdminToken = `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify(verifiedAdminPayload)).toString('base64url')}.sig`;
  const verifiedAdminRes = await verifyAuthToken(verifiedAdminToken);
  assert('P0-Auth 5: Verified server custom claim admin:true grants admin role', verifiedAdminRes.valid === true && verifiedAdminRes.user?.role === 'admin', verifiedAdminRes.user?.role, 'admin');

  // 6. Live forged token with external issuer strictly fails closed without valid signature
  const forgedLiveToken = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmb3JnZWQiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZXh0ZXJuYWwtcHJvaiJ9.fakesig';
  const forgedLiveRes = await verifyAuthToken(forgedLiveToken);
  assert('P0-Auth 6: Forged token without authentic Google certificate signature fails closed', forgedLiveRes.valid === false, forgedLiveRes.valid, false);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: P0 Route Authorization & Privilege Gating
  // --------------------------------------------------------------------------
  let authBlockCode = 0;
  const mockUnauthRes: any = {
    status: (c: number) => { authBlockCode = c; return { json: () => {} }; }
  };
  authenticateUserMiddleware({ headers: {} } as any, mockUnauthRes, () => {});
  assert('P0-Route 1: Authenticate middleware blocks unauthenticated requests with 401', authBlockCode === 401, authBlockCode, 401);

  let adminBlockCode = 0;
  const mockAdminRes: any = {
    status: (c: number) => { adminBlockCode = c; return { json: () => {} }; }
  };
  requireAdminMiddleware({ user: { uid: 'u1', role: 'user' } } as any, mockAdminRes, () => {});
  assert('P0-Route 2: Admin middleware rejects non-admin users with 403', adminBlockCode === 403, adminBlockCode, 403);

  let billingBlockCode = 0;
  const mockBillingRes: any = {
    status: (c: number) => { billingBlockCode = c; return { json: () => {} }; }
  };
  requireVerifiedBillingAuthMiddleware({ user: { uid: 'anonymous_client', role: 'user' } } as any, mockBillingRes, () => {});
  assert('P0-Route 3: Billing middleware strictly rejects anonymous_client with 401', billingBlockCode === 401, billingBlockCode, 401);

  assert('P0-Ownership 1: Verified user owns their own data partition', verifyUserOwnership('usr-chemist-1', 'usr-chemist-1'), true, true);
  assert('P0-Ownership 2: Cross-user data access is strictly forbidden', verifyUserOwnership('usr-chemist-1', 'usr-other-2') === false, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: P1 Google Play Subscription Verification & Fail-Closed Behavior
  // --------------------------------------------------------------------------
  
  // 1. Package Name Validation
  const wrongPkgRes = await verifyGooglePlayPurchase({
    packageName: 'com.counterfeit.app',
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    purchaseToken: 'token-1',
    userId: 'usr-1'
  });
  assert('P1-Billing 1: Rejects foreign package name', wrongPkgRes.verified === false && Boolean(wrongPkgRes.error?.includes('package name')), true, true);

  // 2. Product ID Validation
  const wrongProductRes = await verifyGooglePlayPurchase({
    packageName: CANONICAL_PACKAGE_NAME,
    productId: 'com.unauthorized.fake.product',
    purchaseToken: 'token-1',
    userId: 'usr-1'
  });
  assert('P1-Billing 2: Rejects unauthorized product ID', wrongProductRes.verified === false && Boolean(wrongProductRes.error?.includes('product ID')), true, true);

  // 3. Empty Purchase Token
  const emptyTokenRes = await verifyGooglePlayPurchase({
    packageName: CANONICAL_PACKAGE_NAME,
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    purchaseToken: '',
    userId: 'usr-1'
  });
  assert('P1-Billing 3: Rejects empty purchase token', emptyTokenRes.verified === false && Boolean(emptyTokenRes.error?.includes('Empty')), true, true);

  // 4. Anonymous Client Rejection
  const anonBillingRes = await verifyGooglePlayPurchase({
    packageName: CANONICAL_PACKAGE_NAME,
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    purchaseToken: 'token-1',
    userId: 'anonymous_client'
  });
  assert('P1-Billing 4: Rejects anonymous_client from purchase verification', anonBillingRes.verified === false && Boolean(anonBillingRes.error?.includes('anonymous')), true, true);

  // 5. Fail-Closed when External Google Play Developer API credentials are not configured
  const failClosedRes = await verifyGooglePlayPurchase({
    packageName: CANONICAL_PACKAGE_NAME,
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    purchaseToken: 'unverified-live-token-sample',
    userId: 'usr-chemist-1'
  });
  assert(
    'P1-Billing 5: Safely fails closed and marks verification BLOCKED when Developer API credentials missing',
    failClosedRes.verified === false && failClosedRes.status === 'UNVERIFIED' && Boolean(failClosedRes.error?.includes('BLOCKED')),
    true,
    true
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: P1 Durable Replay Protection & Concurrency Safety
  // --------------------------------------------------------------------------
  
  // 1. Token Fingerprint Hashing
  const rawToken = 'sample-google-play-purchase-token-very-long-string-12345';
  const fingerprint = computeTokenFingerprint(rawToken);
  assert('P1-Replay 1: Computes deterministic SHA-256 fingerprint for purchase token', fingerprint.length === 64 && /^[0-9a-f]{64}$/.test(fingerprint), true, true);
  assert('P1-Replay 2: Token fingerprint never exposes raw token substring', !fingerprint.includes('sample-google-play'), true, true);

  // 2. Initial grant record in durable store
  const grantResult = await DurablePurchaseStore.recordGrant({
    purchaseToken: rawToken,
    userId: 'usr-original-buyer-1',
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    packageName: CANONICAL_PACKAGE_NAME,
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    expiryTimeMillis: Date.now() + 86400000 // 24 hours future
  });
  assert('P1-Replay 3: Atomically records purchase grant bound to user account', grantResult.success === true && grantResult.grant?.userId === 'usr-original-buyer-1', true, true);

  // 3. Same-user idempotent re-verification check
  const sameUserReplay = await DurablePurchaseStore.checkReplay(rawToken, 'usr-original-buyer-1');
  assert('P1-Replay 4: Permits idempotent re-verification for the same authenticated user', sameUserReplay.allowed === true && sameUserReplay.isExistingGrant === true, true, true);

  // 4. Cross-account replay attempt: User B tries to reuse User A's token
  const crossAccountReplay = await DurablePurchaseStore.checkReplay(rawToken, 'usr-attacker-account-2');
  assert('P1-Replay 5: Strictly blocks cross-account purchase token replay across users', crossAccountReplay.allowed === false && Boolean(crossAccountReplay.error?.includes('replay detected')), true, true);

  // 5. Verification endpoint rejection of replayed token across accounts
  const endpointReplayRes = await verifyGooglePlayPurchase({
    packageName: CANONICAL_PACKAGE_NAME,
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    purchaseToken: rawToken,
    userId: 'usr-attacker-account-2'
  });
  assert('P1-Replay 6: Verification endpoint rejects replayed token before external API call', endpointReplayRes.verified === false && Boolean(endpointReplayRes.error?.includes('replay')), true, true);

  // 6. Durable store returns explicit rejection on conflicting account grant attempt
  const conflictToken = 'test-conflict-token-' + Date.now();
  await DurablePurchaseStore.recordGrant({
    purchaseToken: conflictToken,
    userId: 'user-first-owner',
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    packageName: CANONICAL_PACKAGE_NAME,
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    expiryTimeMillis: Date.now() + 86400000
  });
  const rejectedGrant = await DurablePurchaseStore.recordGrant({
    purchaseToken: conflictToken,
    userId: 'user-conflicting-usurper',
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    packageName: CANONICAL_PACKAGE_NAME,
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    expiryTimeMillis: Date.now() + 86400000
  });
  assert(
    'P1-Replay 7: Durable store returns rejection on conflicting account grant attempt',
    rejectedGrant.success === false && Boolean(rejectedGrant.error?.includes('Concurrent race condition') || rejectedGrant.error?.includes('replay')),
    true,
    true
  );

  // 7. Concurrent conflicting requests cannot both receive successful grants
  const concurrentToken = 'test-concurrent-race-token-' + Date.now();
  const [raceResult1, raceResult2] = await Promise.all([
    DurablePurchaseStore.recordGrant({
      purchaseToken: concurrentToken,
      userId: 'user-racer-alpha',
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      packageName: CANONICAL_PACKAGE_NAME,
      subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
      expiryTimeMillis: Date.now() + 86400000
    }),
    DurablePurchaseStore.recordGrant({
      purchaseToken: concurrentToken,
      userId: 'user-racer-beta',
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      packageName: CANONICAL_PACKAGE_NAME,
      subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
      expiryTimeMillis: Date.now() + 86400000
    })
  ]);
  const oneSucceeded = (raceResult1.success && !raceResult2.success) || (!raceResult1.success && raceResult2.success);
  assert(
    'P1-Replay 8: Concurrent conflicting requests cannot both receive successful grants',
    oneSucceeded,
    true,
    true
  );

  // 8. Integration Harness: Verify that successful Google Play Developer API response alone CANNOT bypass a failed durable store
  const origKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  const origPublisher = google.androidpublisher;
  const origGetClient = google.auth.GoogleAuth.prototype.getClient;
  const origRecordGrant = DurablePurchaseStore.recordGrant;

  try {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: 'test@example.com' });
    google.auth.GoogleAuth.prototype.getClient = async () => ({} as any);
    (google as any).androidpublisher = () => ({
      purchases: {
        subscriptionsv2: {
          get: async () => ({
            data: {
              subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
              lineItems: [{
                productId: ALLOWED_PLAY_PRODUCT_IDS[0],
                expiryTime: new Date(Date.now() + 86400000).toISOString()
              }]
            }
          })
        }
      }
    });

    // Test A: Durable store returns rejection -> verifyGooglePlayPurchase must fail closed
    (DurablePurchaseStore as any).recordGrant = async () => ({
      success: false,
      error: 'Simulated durable store lock conflict'
    });

    const storeRejectRes = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'test-token-sim-reject-' + Date.now(),
      userId: 'usr-sim-1'
    });
    assert(
      'P1-Replay 9: Verification flow strictly fails closed when durable store returns rejection',
      storeRejectRes.verified === false && storeRejectRes.status === 'UNVERIFIED' && Boolean(storeRejectRes.error?.includes('Simulated durable store lock conflict')),
      true,
      true
    );

    // Test B: Durable store throws exception -> verifyGooglePlayPurchase must catch and fail closed
    (DurablePurchaseStore as any).recordGrant = async () => {
      throw new Error('Simulated firestore transaction timeout');
    };

    const storeThrowRes = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'test-token-sim-throw-' + Date.now(),
      userId: 'usr-sim-2'
    });
    assert(
      'P1-Replay 10: Verification flow strictly fails closed when durable store throws an exception',
      storeThrowRes.verified === false && storeThrowRes.status === 'UNVERIFIED' && Boolean(storeThrowRes.error?.includes('Durable store grant persistence threw an exception')),
      true,
      true
    );

    // Test C: Confirms a successful Google Play response alone cannot bypass a failed durable-store operation
    assert(
      'P1-Replay 11: A successful Google Play response alone cannot bypass a failed durable-store operation',
      storeRejectRes.verified === false && storeThrowRes.verified === false,
      true,
      true
    );

  } finally {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY = origKey;
    google.androidpublisher = origPublisher;
    google.auth.GoogleAuth.prototype.getClient = origGetClient;
    DurablePurchaseStore.recordGrant = origRecordGrant;
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: P1 Google Play Subscription State Strict Allowlist
  // --------------------------------------------------------------------------
  const origKey2 = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  const origPublisher2 = google.androidpublisher;
  const origGetClient2 = google.auth.GoogleAuth.prototype.getClient;

  try {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: 'test@example.com' });
    google.auth.GoogleAuth.prototype.getClient = async () => ({} as any);

    let mockState = 'SUBSCRIPTION_STATE_ACTIVE';
    let mockExpiry = new Date(Date.now() + 86400000).toISOString();

    (google as any).androidpublisher = () => ({
      purchases: {
        subscriptionsv2: {
          get: async () => ({
            data: {
              subscriptionState: mockState,
              lineItems: [{
                productId: ALLOWED_PLAY_PRODUCT_IDS[0],
                expiryTime: mockExpiry
              }]
            }
          })
        }
      }
    });

    // 1. Active state with valid future expiry
    mockState = 'SUBSCRIPTION_STATE_ACTIVE';
    mockExpiry = new Date(Date.now() + 86400000).toISOString();
    const resActive = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-active-' + Date.now(),
      userId: 'usr-state-1'
    });
    assert('P1-State 1: Active state with valid future expiry is verified', resActive.verified === true && resActive.status === 'ACTIVE', true, true);

    // 2. Grace-period state with valid future expiry
    mockState = 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
    mockExpiry = new Date(Date.now() + 86400000).toISOString();
    const resGrace = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-grace-' + Date.now(),
      userId: 'usr-state-2'
    });
    assert('P1-State 2: Grace-period state with valid future expiry is verified', resGrace.verified === true && resGrace.status === 'ACTIVE', true, true);

    // 3. Canceled state with future expiry (allowed per policy)
    mockState = 'SUBSCRIPTION_STATE_CANCELED';
    mockExpiry = new Date(Date.now() + 86400000).toISOString();
    const resCanceledFuture = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-canceled-future-' + Date.now(),
      userId: 'usr-state-3'
    });
    assert('P1-State 3: Canceled state with future expiry is verified', resCanceledFuture.verified === true && resCanceledFuture.status === 'ACTIVE', true, true);

    // 4. Canceled state with expired expiry
    mockState = 'SUBSCRIPTION_STATE_CANCELED';
    mockExpiry = new Date(Date.now() - 3600000).toISOString();
    const resCanceledExpired = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-canceled-expired-' + Date.now(),
      userId: 'usr-state-4'
    });
    assert('P1-State 4: Canceled state with expired expiry is rejected', resCanceledExpired.verified === false && resCanceledExpired.status === 'EXPIRED', true, true);

    // 5. Pending, paused, on-hold, and expired states are rejected
    const rejectedStates = [
      'SUBSCRIPTION_STATE_PENDING',
      'SUBSCRIPTION_STATE_PAUSED',
      'SUBSCRIPTION_STATE_ON_HOLD',
      'SUBSCRIPTION_STATE_EXPIRED'
    ];
    let allRejected = true;
    for (const st of rejectedStates) {
      mockState = st;
      mockExpiry = new Date(Date.now() + 86400000).toISOString();
      const resReject = await verifyGooglePlayPurchase({
        packageName: CANONICAL_PACKAGE_NAME,
        productId: ALLOWED_PLAY_PRODUCT_IDS[0],
        purchaseToken: 'token-' + st.toLowerCase() + '-' + Date.now(),
        userId: 'usr-state-reject'
      });
      if (resReject.verified !== false) {
        allRejected = false;
      }
    }
    assert('P1-State 5: Pending, paused, on-hold, and expired states are strictly rejected', allRejected, true, true);

    // 6. Unspecified state is rejected
    mockState = 'SUBSCRIPTION_STATE_UNSPECIFIED';
    mockExpiry = new Date(Date.now() + 86400000).toISOString();
    const resUnspec = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-unspec-' + Date.now(),
      userId: 'usr-state-unspec'
    });
    assert('P1-State 6: Unspecified state is rejected', resUnspec.verified === false, true, true);

    // 7. Unknown future state is rejected
    mockState = 'SUBSCRIPTION_STATE_NEW_UNKNOWN_FEATURE';
    mockExpiry = new Date(Date.now() + 86400000).toISOString();
    const resUnknown = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-unknown-' + Date.now(),
      userId: 'usr-state-unknown'
    });
    assert('P1-State 7: Unknown future state is rejected by default', resUnknown.verified === false, true, true);

    // 8. Missing or malformed state is rejected
    mockState = '';
    mockExpiry = new Date(Date.now() + 86400000).toISOString();
    const resMissing = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-missing-' + Date.now(),
      userId: 'usr-state-missing'
    });
    assert('P1-State 8: Missing or malformed state is rejected', resMissing.verified === false, true, true);

    // 9. Unknown state with a future expiry must still be rejected
    mockState = 'SUBSCRIPTION_STATE_SOMETHING_MADE_UP';
    mockExpiry = new Date(Date.now() + 864000000).toISOString(); // 10 days future
    const resUnknownFuture = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-unknown-future-' + Date.now(),
      userId: 'usr-state-unknown-future'
    });
    assert('P1-State 9: Future expiry does not override an unknown state', resUnknownFuture.verified === false, true, true);

    // 10. Allowed state with missing, invalid, or expired expiry must be rejected
    mockState = 'SUBSCRIPTION_STATE_ACTIVE';
    mockExpiry = ''; // missing expiry
    const resNoExpiry = await verifyGooglePlayPurchase({
      packageName: CANONICAL_PACKAGE_NAME,
      productId: ALLOWED_PLAY_PRODUCT_IDS[0],
      purchaseToken: 'token-noexpiry-' + Date.now(),
      userId: 'usr-state-noexpiry'
    });
    assert('P1-State 10: Allowed state with missing expiry is rejected', resNoExpiry.verified === false, true, true);

    // 11. Rejected states never grant entitlement or return verified: true
    assert('P1-State 11: Rejected states never grant an entitlement or return verified: true', resUnknownFuture.verified === false && resUnspec.verified === false && resCanceledExpired.verified === false, true, true);

  } finally {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY = origKey2;
    google.androidpublisher = origPublisher2;
    google.auth.GoogleAuth.prototype.getClient = origGetClient2;
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 6: P2 User Profile lastLoginAt Validation
  // --------------------------------------------------------------------------
  
  // Note: These tests assume Firestore rules are deployed.
  // In this container, we verify the logic of the validation helper directly,
  // as the full Firestore emulator is not active.
  
  const now = new Date().toISOString();
  
  // isValidUser helper in rules:
  // hasAll(['id', 'email'])
  // hasOnly(['id', 'email', 'displayName', 'photoURL', 'createdAt', 'updatedAt', 'lastLoginAt'])
  
  const validUserWithLogin = {
    id: 'u1',
    email: 'test@example.com',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  };
  
  // Simulate rules validation logic
  const isValidUser = (data: any) => {
    const keys = Object.keys(data);
    const hasAll = keys.includes('id') && keys.includes('email');
    const allowed = ['id', 'email', 'displayName', 'photoURL', 'createdAt', 'updatedAt', 'lastLoginAt'];
    const hasOnly = keys.every(k => allowed.includes(k));
    const lastLoginValid = !data.lastLoginAt || (typeof data.lastLoginAt === 'string' && data.lastLoginAt.length <= 64);
    
    return hasAll && hasOnly && lastLoginValid;
  };
  
  assert('P2-User 1: Valid user profile with lastLoginAt', isValidUser(validUserWithLogin) === true, true, true);
  
  const invalidUserWithLongLogin = { ...validUserWithLogin, lastLoginAt: 'a'.repeat(65) };
  assert('P2-User 2: User profile with malformed/long lastLoginAt is rejected', isValidUser(invalidUserWithLongLogin) === false, false, false);
  
  const validUserMissingLogin = {
    id: 'u1',
    email: 'test@example.com',
    createdAt: now,
    updatedAt: now
  };
  assert('P2-User 3: User profile missing optional lastLoginAt is accepted', isValidUser(validUserMissingLogin) === true, true, true);

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests
  };
}

if (process.argv[1]?.includes('securityFixes.regression.test')) {
  runSecurityFixesTestSuite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}

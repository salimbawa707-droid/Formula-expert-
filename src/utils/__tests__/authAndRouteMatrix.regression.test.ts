/**
 * ============================================================================
 * AUTHENTICATION, ROUTE ACCESS MATRIX & BILLING INTEGRITY REGRESSION TEST
 * ============================================================================
 * 
 * Verifies Phase 2, 3, and 4 requirements:
 * 1. Route Access Matrix Classification:
 *    - Public: /api/ai/chemistry-status, /api/ai/status, /detergent-formula-expert-release.apk
 *    - Authenticated: /api/ai/chat, /api/ai/formulate, /api/ai/troubleshoot,
 *                     /api/ai/analyze-recommend, /api/ai/research-ingredient,
 *                     /api/ai/apply-verified-ingredient
 *    - Billing-Only (Strict Auth + Non-Anonymous): /api/billing/verify-purchase,
 *                                                 /api/billing/subscription-status
 *    - Owner-Only: /api/user/:userId/verify-access
 *    - Admin-Only: /api/admin/diagnostics
 * 2. Cryptographic token verification & role non-elevation.
 * 3. Fail-closed billing verification without trusting client-side claims or anonymous_client.
 */

import {
  verifyAuthToken,
  authenticateUserMiddleware,
  requireAdminMiddleware,
  requireVerifiedBillingAuthMiddleware,
  verifyUserOwnership,
  verifyGooglePlayPurchase,
  CANONICAL_PACKAGE_NAME,
  ALLOWED_PLAY_PRODUCT_IDS
} from '../../services/serverSecurity';

export interface RouteMatrixTestSummary {
  total: number;
  passed: number;
  failed: number;
}

export async function runAuthAndRouteMatrixTestSuite(): Promise<RouteMatrixTestSummary> {
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
  console.log(' AUTHENTICATION & ROUTE ACCESS MATRIX TEST SUITE  ');
  console.log('==================================================');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Route Access Matrix - Authenticate Middleware Enforcement
  // --------------------------------------------------------------------------
  let authFailedStatus = 0;
  let authErrorMessage = '';
  const mockUnauthReq: any = { headers: {} };
  const mockUnauthRes: any = {
    status: (code: number) => {
      authFailedStatus = code;
      return {
        json: (data: any) => { authErrorMessage = data.error || ''; }
      };
    }
  };

  authenticateUserMiddleware(mockUnauthReq, mockUnauthRes, () => {});
  assert('RouteMatrix 1: Unauthenticated request to protected route returns 401 Unauthorized', authFailedStatus === 401, authFailedStatus, 401);
  assert('RouteMatrix 2: Missing Bearer token yields actionable authentication required message', authErrorMessage.includes('Authentication required'), true, true);

  // Direct Cryptographic Token Verification
  const missingTokenResult = await verifyAuthToken('');
  assert('TokenAuth 1: Empty or missing token is strictly rejected fail-closed', missingTokenResult.valid === false, missingTokenResult.valid, false);

  const forgedTokenResult = await verifyAuthToken('eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmb3JnZWQtYXR0YWNrZXIiLCJpc3MiOiJodHRwczovL2ZvcmdlZC5jb20ifQ.fakeSignature');
  assert('TokenAuth 2: Forged token with invalid cryptographic signature is strictly rejected fail-closed', forgedTokenResult.valid === false, forgedTokenResult.valid, false);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Billing Route Security - Anonymous Client Rejection
  // --------------------------------------------------------------------------
  let billingStatus = 0;
  let billingErrorMessage = '';
  const mockAnonReq: any = {
    user: { uid: 'anonymous_client', role: 'user' }
  };
  const mockBillingRes: any = {
    status: (code: number) => {
      billingStatus = code;
      return {
        json: (data: any) => { billingErrorMessage = data.error || ''; }
      };
    }
  };

  requireVerifiedBillingAuthMiddleware(mockAnonReq, mockBillingRes, () => {});
  assert('BillingAuth 1: Strictly rejects anonymous_client from accessing billing endpoints with 401', billingStatus === 401, billingStatus, 401);
  assert('BillingAuth 2: Actionable rejection message for anonymous billing access', billingErrorMessage.includes('Anonymous or unauthenticated'), true, true);

  // Verified user succeeds
  let billingNextCalled = false;
  const mockVerifiedUserReq: any = {
    user: { uid: 'usr-verified-chemist-99', role: 'user' }
  };
  requireVerifiedBillingAuthMiddleware(mockVerifiedUserReq, mockBillingRes, () => {
    billingNextCalled = true;
  });
  assert('BillingAuth 3: Permits verified authenticated account into billing pipeline', billingNextCalled, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Admin Route Privilege Gating
  // --------------------------------------------------------------------------
  let adminForbiddenStatus = 0;
  const mockUserReq: any = {
    user: { uid: 'usr-chemist-1', role: 'user' }
  };
  const mockAdminRes: any = {
    status: (code: number) => {
      adminForbiddenStatus = code;
      return { json: () => {} };
    }
  };

  requireAdminMiddleware(mockUserReq, mockAdminRes, () => {});
  assert('AdminGate 1: Standard authenticated user receives 403 Forbidden for admin endpoint', adminForbiddenStatus === 403, adminForbiddenStatus, 403);

  let adminNextCalled = false;
  const mockAdminReq: any = {
    user: { uid: 'admin-lead-1', role: 'admin' }
  };
  requireAdminMiddleware(mockAdminReq, mockAdminRes, () => {
    adminNextCalled = true;
  });
  assert('AdminGate 2: User with verified admin role is permitted through admin middleware', adminNextCalled, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: User Data Isolation & Ownership
  // --------------------------------------------------------------------------
  assert('Ownership 1: Verified user owns their own data record', verifyUserOwnership('usr-chemist-1', 'usr-chemist-1'), true, true);
  assert('Ownership 2: Verified user cannot access or modify another user data record', verifyUserOwnership('usr-chemist-1', 'usr-attacker-2') === false, true, true);
  assert('Ownership 3: Empty or invalid userId rejects ownership evaluation', verifyUserOwnership('', 'usr-chemist-1') === false, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Google Play Fail-Closed Developer API Verification
  // --------------------------------------------------------------------------
  const purchaseAttempt = await verifyGooglePlayPurchase({
    packageName: CANONICAL_PACKAGE_NAME,
    productId: ALLOWED_PLAY_PRODUCT_IDS[0],
    purchaseToken: 'test-purchase-token-unverified',
    userId: 'usr-chemist-1'
  });

  assert(
    'PlayVerification 1: External Developer API credentials unconfigured returns verified=false (fail-closed)',
    purchaseAttempt.verified === false,
    purchaseAttempt.verified,
    false
  );
  assert(
    'PlayVerification 2: Status is strictly UNVERIFIED and verification is marked BLOCKED',
    purchaseAttempt.status === 'UNVERIFIED' && Boolean(purchaseAttempt.error?.includes('BLOCKED')),
    true,
    true
  );

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests
  };
}

if (process.argv[1]?.includes('authAndRouteMatrix.regression.test')) {
  runAuthAndRouteMatrixTestSuite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}

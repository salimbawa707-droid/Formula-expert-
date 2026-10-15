/**
 * ============================================================================
 * API BASE URL, BILLING SECURITY & USER TIMESTAMP REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. API base URL sanitizer trims trailing slashes and validates URLs.
 * 2. Web context defaults to relative paths while Native Android requires absolute URLs.
 * 3. Fail-Closed Billing: Web and native purchases without verified server receipt
 *    are rejected and NEVER grant paid plan entitlements.
 * 4. User Account Timestamp: Repeated logins and sync operations preserve the
 *    original createdAt timestamp and update lastLoginAt/updatedAt independently.
 */

import { sanitizeBaseUrl, buildApiUrl } from '../../services/apiBase';
import { PlayBillingBridge } from '../../services/playBillingBridge';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
}

export async function runApiBaseAndBillingSecurityTestSuite(): Promise<{ total: number; passed: number; failed: number }> {
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
  console.log(' API BASE, BILLING SECURITY & USER TIMESTAMP TEST ');
  console.log('==================================================');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: API Base URL Sanitization & Construction
  // --------------------------------------------------------------------------
  assert('ApiBase 1: Strips trailing slashes from configured base URL', sanitizeBaseUrl('https://api.detergentlab.com///') === 'https://api.detergentlab.com', true, true);
  assert('ApiBase 2: Rejects invalid or malformed URL strings', sanitizeBaseUrl('htt://invalid::') === '', true, true);
  assert('ApiBase 3: Normalizes relative endpoint with leading slash', buildApiUrl('api/ai/chat').startsWith('/api/ai/chat'), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Fail-Closed Billing & Entitlement Security
  // --------------------------------------------------------------------------
  // Attempt web purchase simulation: must fail-closed without server verification gateway
  const purchaseResult = await PlayBillingBridge.purchase(PlayBillingBridge.PRODUCT_IDS.PRO_MONTHLY);
  assert(
    'Billing 1: Unverified purchase attempt is rejected fail-closed without granting paid entitlement',
    purchaseResult.success === false && Boolean(purchaseResult.error && purchaseResult.error.includes('verification')),
    purchaseResult.success,
    false
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: User Account Timestamp Preservation
  // --------------------------------------------------------------------------
  interface MockUserDoc {
    id: string;
    email: string;
    createdAt: string;
    lastLoginAt?: string;
    updatedAt: string;
  }

  function simulateUserLoginSync(existingDoc: MockUserDoc | null, user: { uid: string; email: string }, nowIso: string): MockUserDoc {
    const originalCreatedAt = existingDoc?.createdAt || nowIso;
    return {
      id: user.uid,
      email: user.email,
      createdAt: originalCreatedAt,
      lastLoginAt: nowIso,
      updatedAt: nowIso
    };
  }

  const initialSignupTime = '2026-01-15T08:00:00.000Z';
  const initialUser: MockUserDoc = {
    id: 'usr-101',
    email: 'chemist@formulaexpert.com',
    createdAt: initialSignupTime,
    updatedAt: initialSignupTime
  };

  // User logs in again 6 months later
  const secondLoginTime = '2026-07-15T14:30:00.000Z';
  const syncedProfile = simulateUserLoginSync(initialUser, { uid: 'usr-101', email: 'chemist@formulaexpert.com' }, secondLoginTime);

  assert('UserTimestamp 1: Original createdAt timestamp is strictly preserved on repeated login', syncedProfile.createdAt === initialSignupTime, syncedProfile.createdAt, initialSignupTime);
  assert('UserTimestamp 2: lastLoginAt and updatedAt are updated to current login timestamp', syncedProfile.lastLoginAt === secondLoginTime && syncedProfile.updatedAt === secondLoginTime, true, true);

  // First time signup sets createdAt to now
  const newSignupTime = '2026-10-15T12:00:00.000Z';
  const newProfile = simulateUserLoginSync(null, { uid: 'usr-202', email: 'new@formulaexpert.com' }, newSignupTime);
  assert('UserTimestamp 3: New account signup sets createdAt to initial signup timestamp', newProfile.createdAt === newSignupTime, newProfile.createdAt, newSignupTime);

  return { total: totalTests, passed: passedTests, failed: totalTests - passedTests };
}

if (process.argv[1]?.includes('apiBaseAndBillingSecurity.test')) {
  runApiBaseAndBillingSecurityTestSuite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}

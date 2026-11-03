import { canSaveFormula, isFeatureAllowed, getPlanBadgeDetails, PLAN_LIMITS } from '../featureGating';
import { PlayBillingBridge } from '../../services/playBillingBridge';

export function runFeatureGatingTestSuite(): { total: number; passed: number; failed: number } {
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}${detail ? ` :: PASS (${detail})` : ''}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` :: FAIL (${detail})` : ''}`);
    }
  }

  console.log('==================================================');
  console.log('  PHASE 2.0 FEATURE GATING & PAYWALL TEST SUITE   ');
  console.log('==================================================');

  // Test 1: Free plan formula count limit (7 max)
  assert(canSaveFormula(0, 'free') === true, 'Test 1: Free user with 0 formulas can save');
  assert(canSaveFormula(6, 'free') === true, 'Test 1: Free user with 6 formulas can save');
  assert(canSaveFormula(7, 'free') === false, 'Test 1: Free user with 7 formulas is blocked');
  assert(canSaveFormula(10, 'free') === false, 'Test 1: Free user with 10 formulas is blocked');

  // Test 2: Pro & Team plans have unlimited formula saves
  assert(canSaveFormula(100, 'pro_monthly') === true, 'Test 2: Pro Monthly user with 100 formulas can save');
  assert(canSaveFormula(500, 'pro_yearly') === true, 'Test 2: Pro Yearly user with 500 formulas can save');
  assert(canSaveFormula(1000, 'team') === true, 'Test 2: Team user with 1000 formulas can save');

  // Test 3: Feature Gating matrix
  assert(isFeatureAllowed('hasPdfReports', 'free') === false, 'Test 3: Free user cannot export PDF reports');
  assert(isFeatureAllowed('hasPdfReports', 'pro_monthly') === true, 'Test 3: Pro Monthly user can export PDF reports');
  assert(isFeatureAllowed('hasCloudSync', 'free') === false, 'Test 3: Free user has no automatic cloud sync');
  assert(isFeatureAllowed('hasCloudSync', 'pro_yearly') === true, 'Test 3: Pro Yearly user has automatic cloud sync');

  // Test 4: Team Collaboration gating
  assert(isFeatureAllowed('hasTeamCollaboration', 'pro_monthly') === false, 'Test 4: Pro Monthly user has no team collaboration');
  assert(isFeatureAllowed('hasTeamCollaboration', 'team') === true, 'Test 4: Team user has team collaboration');
  assert(PLAN_LIMITS.team.maxTeamMembers === 5, 'Test 4: Team plan supports up to 5 members');

  // Test 5: Plan Badge details
  const freeBadge = getPlanBadgeDetails('free');
  assert(freeBadge.label === 'FREE PLAN', 'Test 5: Free plan badge label correct');

  const proBadge = getPlanBadgeDetails('pro_monthly');
  assert(proBadge.label === 'PRO MONTHLY', 'Test 5: Pro plan badge label correct');

  const teamBadge = getPlanBadgeDetails('team');
  assert(teamBadge.label === 'TEAM / FACTORY', 'Test 5: Team plan badge label correct');

  // Test 6: Google Play Store Billing Product ID Contract
  assert(PlayBillingBridge.PRODUCT_IDS.PRO_MONTHLY === 'com.detergentlab.pro.monthly', 'Test 6: Pro Monthly matches Play Store configuration target');
  assert(PlayBillingBridge.PRODUCT_IDS.PRO_YEARLY === 'com.detergentlab.pro.yearly', 'Test 6: Pro Yearly matches Play Store configuration target');
  assert(PlayBillingBridge.PRODUCT_IDS.TEAM_YEARLY === 'com.detergentlab.team.yearly', 'Test 6: Team Yearly matches Play Store configuration target');

  console.log('--------------------------------------------------');
  console.log(`TOTAL FEATURE GATING TESTS : ${totalTests}`);
  console.log(`PASSED                    : ${passedTests}`);
  console.log(`FAILED                    : ${totalTests - passedTests}`);
  console.log('--------------------------------------------------');

  return { total: totalTests, passed: passedTests, failed: totalTests - passedTests };
}

if (process.argv[1]?.includes('featureGating.regression.test')) {
  const summary = runFeatureGatingTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

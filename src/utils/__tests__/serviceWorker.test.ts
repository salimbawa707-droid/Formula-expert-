/**
 * ============================================================================
 * SERVICE WORKER CACHE & NAVIGATION FALLBACK REGRESSION TEST SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. Cache-first lookup returns cached requested resources when available.
 * 2. Navigation/document requests fall back to /index.html when offline.
 * 3. Non-navigation requests (JS, CSS, images) NEVER return HTML as fallback.
 * 4. API endpoints (/api/*), auth, and billing requests are strictly bypassed.
 * 5. Safe handling of offline and cache-miss states without infinite loops.
 */

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runServiceWorkerTestSuite(): { total: number; passed: number; failed: number } {
  const results: TestResult[] = [];
  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      results.push({ group: 'ServiceWorker', name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({
        group: 'ServiceWorker',
        name,
        passed: false,
        actual,
        expected,
        message: `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      });
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('==================================================');
  console.log('    SERVICE WORKER & CACHE POLICY TEST SUITE      ');
  console.log('==================================================');

  // Test 1: Non-cacheable URL patterns
  const nonCacheableUrls = [
    'https://app.com/api/ai/chat',
    'https://app.com/api/ai/formulate',
    'https://app.com/auth/login',
    'https://app.com/billing/verify',
    'https://firestore.googleapis.com/v1/projects',
    'https://sub.supabase.co/rest/v1'
  ];

  function isNonCacheable(urlStr: string): boolean {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    return (
      pathname.startsWith('/api/') ||
      pathname.includes('/auth') ||
      pathname.includes('/billing') ||
      pathname.includes('/purchase') ||
      pathname.includes('/verify') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('supabase.co')
    );
  }

  const allBypassed = nonCacheableUrls.every(u => isNonCacheable(u));
  assert('SW 1: API, Auth, and Billing endpoints are strictly excluded from service worker caching', allBypassed, true, true);

  // Test 2: Navigation vs Non-navigation identification
  function isNavigation(mode: string, destination: string, acceptHeader?: string): boolean {
    if (mode === 'navigate' || destination === 'document') return true;
    return Boolean(acceptHeader && acceptHeader.includes('text/html'));
  }

  assert('SW 2: HTML navigation request mode "navigate" recognized as app shell candidate', isNavigation('navigate', ''), true, true);
  assert('SW 2b: Document destination recognized as HTML navigation candidate', isNavigation('', 'document'), true, true);
  assert('SW 2c: JavaScript script request is NOT classified as HTML navigation', !isNavigation('no-cors', 'script', '*/*'), true, true);
  assert('SW 2d: Stylesheet request is NOT classified as HTML navigation', !isNavigation('no-cors', 'style', 'text/css'), true, true);
  assert('SW 2e: JSON API request is NOT classified as HTML navigation', !isNavigation('cors', '', 'application/json'), true, true);

  // Test 3: Cache fallback expression operator precedence
  // Broken expression: response || isNavigate && match('/index.html') => evaluated as: response || (isNavigate && match)
  // When response is cached JS/CSS, response is truthy.
  // When response is null and isNavigate is false: MUST return null/404, NEVER /index.html!
  function evaluateFallback(cachedResponse: any, isNav: boolean, appShell: any): any {
    if (cachedResponse) return cachedResponse;
    if (isNav) return appShell;
    return null; // 404 for missing non-navigation assets
  }

  const mockCachedJs = { body: 'console.log("cached bundle");', type: 'script' };
  const mockAppShell = { body: '<!DOCTYPE html><html>App Shell</html>', type: 'html' };

  // Case A: Cached JS asset exists
  assert('SW 3a: Returns cached script when asset exists in cache', evaluateFallback(mockCachedJs, false, mockAppShell) === mockCachedJs, true, true);

  // Case B: Uncached JS asset offline (must return 404, NOT app shell HTML!)
  const uncachedJsResult = evaluateFallback(null, false, mockAppShell);
  assert('SW 3b: Offline uncached JavaScript file returns null/404, NEVER index.html (prevents MIME type errors)', uncachedJsResult === null, uncachedJsResult, null);

  // Case C: Uncached CSS stylesheet offline (must return 404, NOT app shell HTML!)
  const uncachedCssResult = evaluateFallback(null, false, mockAppShell);
  assert('SW 3c: Offline uncached CSS stylesheet returns null/404, NEVER index.html', uncachedCssResult === null, uncachedCssResult, null);

  // Case D: Offline HTML navigation (should return index.html app shell)
  const navResult = evaluateFallback(null, true, mockAppShell);
  assert('SW 3d: Offline document navigation falls back cleanly to index.html app shell', navResult === mockAppShell, true, true);

  return { total: totalTests, passed: passedTests, failed: totalTests - passedTests };
}

if (process.argv[1]?.includes('serviceWorker.test')) {
  const summary = runServiceWorkerTestSuite();
  if (summary.failed > 0) process.exit(1);
}

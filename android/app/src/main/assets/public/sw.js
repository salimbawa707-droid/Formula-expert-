/**
 * Service Worker — Detergent Formula Expert PWA
 * Version: 3.0.0
 * 
 * Strict caching rules:
 * 1. Only caches static assets and offline app shell.
 * 2. Never caches API, authentication, or billing endpoints.
 * 3. Cache-first for cached static assets.
 * 4. Falls back to index.html ONLY for navigation/document requests when offline.
 * 5. Returns 404/offline error for missing JS/CSS/media when offline (NEVER returns HTML for scripts/styles).
 */

const CACHE_NAME = 'detergent-formula-expert-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png'
];

// URLs that must NEVER be cached by the service worker
function isNonCacheableRequest(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith('/api/') ||
    pathname.includes('/auth') ||
    pathname.includes('/billing') ||
    pathname.includes('/purchase') ||
    pathname.includes('/verify') ||
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('supabase.co')
  );
}

// Check if request is an HTML navigation request
function isNavigationRequest(request) {
  if (request.mode === 'navigate' || request.destination === 'document') {
    return true;
  }
  const accept = request.headers.get('accept');
  return Boolean(accept && accept.includes('text/html'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Bypass API, billing, auth, and external cloud services completely
  if (isNonCacheableRequest(url)) {
    return;
  }

  event.respondWith(
    (async () => {
      // 1. Check if resource is already in cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Resource not in cache: attempt network fetch
      try {
        const networkResponse = await fetch(event.request);
        
        // Only cache valid 200 OK responses for same-origin static assets
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const contentType = networkResponse.headers.get('content-type') || '';
          const isStaticAsset = (
            url.pathname.includes('/assets/') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.woff2') ||
            contentType.includes('javascript') ||
            contentType.includes('text/css') ||
            contentType.includes('image/') ||
            contentType.includes('font/')
          );

          if (isStaticAsset) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
        }

        return networkResponse;
      } catch (fetchError) {
        // 3. Network failed (offline or network error)
        // If it is a navigation request, fall back to index.html application shell
        if (isNavigationRequest(event.request)) {
          const appShell = await caches.match('/index.html');
          if (appShell) {
            return appShell;
          }
        }

        // For non-navigation requests (scripts, styles, images), do NOT return index.html!
        // Return 404/503 response indicating resource is not available offline
        return new Response(null, {
          status: 404,
          statusText: 'Resource not available offline'
        });
      }
    })()
  );
});

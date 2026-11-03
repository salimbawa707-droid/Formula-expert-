/**
 * API Base URL & Networking Architecture
 * 
 * Supports both Web SPA (relative paths via Vite/Express) and Native Android
 * (Capacitor WebView requiring absolute backend URLs).
 */

export interface ApiBaseConfig {
  baseUrl: string;
  isNative: boolean;
  isValid: boolean;
  warning?: string;
}

/**
 * Checks if the current execution context is a native mobile app (Capacitor/Cordova)
 */
export function isNativeMobilePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check Capacitor global or native file/capacitor protocols
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      if (cap.isNativePlatform()) return true;
    } catch {
      // Fall through to protocol inspection
    }
  }

  const proto = window.location.protocol;
  return proto === 'capacitor:' || proto === 'file:' || proto === 'ionic:';
}

/**
 * Validates and normalizes an API base URL
 */
export function sanitizeBaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Remove trailing slashes
  const cleanUrl = trimmed.replace(/\/+$/, '');
  
  // If scheme specified, only allow http:// or https:// and validate with URL parser
  if (cleanUrl.includes('://')) {
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      console.warn(`[apiBase] Invalid base URL protocol: ${rawUrl}`);
      return '';
    }
    try {
      new URL(cleanUrl);
      return cleanUrl;
    } catch {
      console.warn(`[apiBase] Invalid base URL provided: ${rawUrl}`);
      return '';
    }
  }

  // Reject malformed colon structures
  if (cleanUrl.includes(':')) {
    try {
      new URL(`http://${cleanUrl}`);
      return cleanUrl;
    } catch {
      console.warn(`[apiBase] Malformed base URL provided: ${rawUrl}`);
      return '';
    }
  }

  return cleanUrl;
}

/**
 * Resolves the active API base configuration
 */
export function getApiBaseConfig(): ApiBaseConfig {
  const isNative = isNativeMobilePlatform();
  
  // Read from Vite environment variable (prefixed with VITE_)
  const envBaseUrl = typeof import.meta !== 'undefined' && (import.meta as any).env
    ? ((import.meta as any).env.VITE_API_BASE_URL as string | undefined)
    : undefined;

  const sanitized = sanitizeBaseUrl(envBaseUrl);

  if (isNative) {
    if (!sanitized) {
      return {
        baseUrl: '',
        isNative: true,
        isValid: false,
        warning: 'Native Android environment detected without configured VITE_API_BASE_URL. API requests to /api/* will fail unless backend server URL is configured.'
      };
    }
    return {
      baseUrl: sanitized,
      isNative: true,
      isValid: true
    };
  }

  // Web environment: default to relative paths ('') so dev server proxy and same-origin routes work seamlessly
  return {
    baseUrl: sanitized || '',
    isNative: false,
    isValid: true
  };
}

/**
 * Resolves a full, normalized API URL given an endpoint path
 */
export function buildApiUrl(endpoint: string): string {
  if (!endpoint || typeof endpoint !== 'string') return '';
  
  // If endpoint is already an absolute URL, return as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const config = getApiBaseConfig();
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (config.baseUrl) {
    return `${config.baseUrl}${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Robust API fetch wrapper with configurable timeout, standardized headers, and error handling
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 25000, ...fetchOptions } = options;
  const config = getApiBaseConfig();
  if (config.isNative && !config.isValid) {
    throw new Error(config.warning || `Native Android network error: No backend VITE_API_BASE_URL configured for endpoint ${endpoint}`);
  }

  const fullUrl = buildApiUrl(endpoint);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Attach the active Firebase token first, then fall back to a Supabase session.
  if (!headers.has('Authorization')) {
    try {
      const fbClient = await import('./firebaseAuthClient').catch(() => null);
      if (fbClient && fbClient.auth && fbClient.auth.currentUser) {
        const token = await fbClient.auth.currentUser.getIdToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      if (!headers.has('Authorization')) {
        const supabaseClient = await import('./supabaseClient').catch(() => null);
        const { data } = await supabaseClient?.supabase.auth.getSession() ?? { data: { session: null } };
        if (data.session?.access_token) {
          headers.set('Authorization', `Bearer ${data.session.access_token}`);
        }
      }
    } catch {
      // Fall through silently if unauthenticated or in isolated test
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeoutMs}ms: ${endpoint}`);
    }
    if (isNativeMobilePlatform() && !getApiBaseConfig().baseUrl) {
      throw new Error(`Native Android network error: No backend VITE_API_BASE_URL configured for endpoint ${endpoint}`);
    }
    throw err;
  }
}

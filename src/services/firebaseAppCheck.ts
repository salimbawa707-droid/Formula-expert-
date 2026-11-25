/**
 * Firebase App Check.
 *
 * App Check attaches an attestation token to every Firebase request (Auth,
 * Firestore, Storage, Functions). Once enforcement is switched on in the
 * Firebase Console, requests without a valid token are rejected — so a copied
 * API key alone is not enough to use the project.
 *
 * How this fits in the app:
 *   initializeApp()  ->  initializeAppCheckForApp(app)  ->  getAuth()/getFirestore()
 * App Check must be initialised before the first Firebase service call, which
 * is why `firebaseAuthClient.ts` calls it while creating the shared FirebaseApp.
 *
 * Configuration is supplied through Vite env vars (see .env.example):
 *   VITE_FIREBASE_APP_CHECK_SITE_KEY   reCAPTCHA key from Firebase Console
 *   VITE_FIREBASE_APP_CHECK_PROVIDER   recaptcha-enterprise (default) | recaptcha-v3
 *   VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN  optional, local development only
 *   VITE_FIREBASE_APP_CHECK_ENABLED    set to "false" to switch App Check off
 *
 * Platform note: reCAPTCHA App Check providers only work in a real browser. In
 * the Android Capacitor build they are skipped on purpose (a reCAPTCHA inside a
 * WebView cannot be trusted by Firebase). See docs/APP_CHECK_SETUP.md for the
 * Play Integrity step required for the Android release build.
 */
import type { FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';
import { firebaseEnvConfig } from '../config/firebaseEnv';

let appCheckInstance: AppCheck | null = null;

/** True when the bundle is running inside the Capacitor Android shell. */
export function isNativeApp(): boolean {
  const capacitor = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof capacitor?.isNativePlatform === 'function' && capacitor.isNativePlatform();
}

export type AppCheckStatus =
  | 'initialized'
  | 'disabled'
  | 'missing-site-key'
  | 'native-platform'
  | 'failed';

/**
 * Initialises App Check for the given FirebaseApp. Safe to call more than once:
 * the second call returns the same instance. Never throws — a configuration
 * problem is logged and reported through the return value so the rest of the
 * app keeps working while App Check is being rolled out.
 */
export function initializeAppCheckForApp(app: FirebaseApp): AppCheck | null {
  if (appCheckInstance) return appCheckInstance;

  if (!firebaseEnvConfig.appCheckEnabled) {
    console.info('[App Check] Disabled by VITE_FIREBASE_APP_CHECK_ENABLED=false.');
    return null;
  }

  if (isNativeApp()) {
    console.warn(
      '[App Check] Native (Capacitor) build detected — reCAPTCHA providers are skipped. ' +
        'Enable Play Integrity for the Android app before enforcing App Check. See docs/APP_CHECK_SETUP.md.'
    );
    return null;
  }

  const siteKey = firebaseEnvConfig.appCheckSiteKey;
  if (!siteKey) {
    console.warn(
      '[App Check] VITE_FIREBASE_APP_CHECK_SITE_KEY is not set — App Check is not active. ' +
        'Add the reCAPTCHA key from Firebase Console > App Check, then restart the build.'
    );
    return null;
  }

  if (firebaseEnvConfig.appCheckDebugToken) {
    // Must be assigned before initializeAppCheck(), otherwise the SDK ignores it.
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      firebaseEnvConfig.appCheckDebugToken;
    console.warn(
      '[App Check] Debug token is active. Use it only on a development machine; remove it from production builds.'
    );
  }

  const useV3 = firebaseEnvConfig.appCheckProvider === 'recaptcha-v3';

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: useV3
        ? new ReCaptchaV3Provider(siteKey)
        : new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.info(
      `[App Check] Initialised with ${useV3 ? 'reCAPTCHA v3' : 'reCAPTCHA Enterprise'}.`
    );
    return appCheckInstance;
  } catch (error) {
    console.error(
      '[App Check] Initialisation failed; Firebase calls continue without attestation.',
      error
    );
    return null;
  }
}

/** The active AppCheck instance, or null when App Check is not running. */
export function getAppCheckInstance(): AppCheck | null {
  return appCheckInstance;
}

export function getAppCheckStatus(): AppCheckStatus {
  if (appCheckInstance) return 'initialized';
  if (!firebaseEnvConfig.appCheckEnabled) return 'disabled';
  if (isNativeApp()) return 'native-platform';
  if (!firebaseEnvConfig.appCheckSiteKey) return 'missing-site-key';
  return 'failed';
}

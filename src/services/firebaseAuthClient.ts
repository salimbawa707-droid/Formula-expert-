import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User, type Auth } from 'firebase/auth';
import { firebaseEnvConfig, missingFirebaseEnvKeys } from '../config/firebaseEnv';
import { initializeAppCheckForApp } from './firebaseAppCheck';

/**
 * Firebase is an optional cloud provider. The local R&D workspace must still
 * start when a developer or CI runner has not supplied Firebase credentials.
 * In that case we create a non-network placeholder app for Firestore imports,
 * but deliberately do not initialise Firebase Auth or App Check.
 */
export const isFirebaseConfigured = missingFirebaseEnvKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `[Firebase] Cloud authentication/sync disabled; missing: ${missingFirebaseEnvKeys.join(', ')}. Local IndexedDB features remain available.`
  );
}

const firebaseConfig = {
  apiKey: firebaseEnvConfig.apiKey || 'offline-placeholder-api-key',
  authDomain: firebaseEnvConfig.authDomain || 'localhost',
  projectId: firebaseEnvConfig.projectId || 'offline-placeholder',
  storageBucket: firebaseEnvConfig.storageBucket || 'offline-placeholder.appspot.com',
  messagingSenderId: firebaseEnvConfig.messagingSenderId || '0',
  appId: firebaseEnvConfig.appId || '1:0:web:offline-placeholder',
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (isFirebaseConfigured) {
  // Must run before the first Auth/Firestore call so every request carries an
  // App Check token. No-op (with a console warning) until a site key is configured.
  initializeAppCheckForApp(app);
}

export const auth: Auth | null = isFirebaseConfigured ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Google sign-in is unavailable because Firebase environment variables are not configured.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

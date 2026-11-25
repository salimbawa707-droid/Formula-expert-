import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User, type Auth } from 'firebase/auth';
import { firebaseEnvConfig, missingFirebaseEnvKeys } from '../config/firebaseEnv';
import { initializeAppCheckForApp } from './firebaseAppCheck';

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

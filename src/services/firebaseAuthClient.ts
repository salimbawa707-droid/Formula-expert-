import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseEnvConfig, missingFirebaseEnvKeys } from '../config/firebaseEnv';

if (missingFirebaseEnvKeys.length > 0) {
  console.error(
    `[Firebase] Missing required environment variables: ${missingFirebaseEnvKeys.join(', ')}. ` +
      'Copy .env.example to .env and fill in your Firebase project values.'
  );
}

const firebaseConfig = {
  apiKey: firebaseEnvConfig.apiKey,
  authDomain: firebaseEnvConfig.authDomain ||
    (firebaseEnvConfig.projectId ? `${firebaseEnvConfig.projectId}.firebaseapp.com` : ''),
  projectId: firebaseEnvConfig.projectId,
  storageBucket: firebaseEnvConfig.storageBucket ||
    (firebaseEnvConfig.projectId ? `${firebaseEnvConfig.projectId}.firebasestorage.app` : ''),
  messagingSenderId: firebaseEnvConfig.messagingSenderId,
  appId: firebaseEnvConfig.appId,
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

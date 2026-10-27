import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import rawAppletConfig from '../../firebase-applet-config.json';

const env = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
const fallbackApiKey = 'AIzaSyCSoBbyRjYpzWIjsHbKLAfgWbh6SxcONMc';
const fallbackProjectId = 'imagined-zone-cv4kj';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (rawAppletConfig as any)?.apiKey || fallbackApiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (rawAppletConfig as any)?.authDomain || `${fallbackProjectId}.firebaseapp.com`,
  projectId: env.VITE_FIREBASE_PROJECT_ID || (rawAppletConfig as any)?.projectId || fallbackProjectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (rawAppletConfig as any)?.storageBucket || `${fallbackProjectId}.firebasestorage.app`,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (rawAppletConfig as any)?.messagingSenderId || '678655473700',
  appId: env.VITE_FIREBASE_APP_ID || (rawAppletConfig as any)?.appId || '1:678655473700:web:d29cf4d8feff5e983240b1',
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

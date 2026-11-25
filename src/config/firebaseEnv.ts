/**
 * Client-side Firebase configuration.
 *
 * Every value comes from Vite environment variables (see .env.example). No
 * project identifiers, API keys or owner addresses are hardcoded in the source
 * tree, so each deployment supplies its own configuration.
 *
 * Vite only inlines static `import.meta.env.NAME` references, so keep these as
 * plain member accesses rather than a dynamic lookup.
 */
export const firebaseEnvConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID ?? '',
};

/** Required keys; used to print one actionable message instead of a cryptic SDK error. */
const requiredFirebaseEnv: Array<[string, string]> = [
  ['VITE_FIREBASE_API_KEY', firebaseEnvConfig.apiKey],
  ['VITE_FIREBASE_PROJECT_ID', firebaseEnvConfig.projectId],
  ['VITE_FIREBASE_APP_ID', firebaseEnvConfig.appId],
];

export const missingFirebaseEnvKeys = requiredFirebaseEnv
  .filter(([, value]) => !value)
  .map(([key]) => key);

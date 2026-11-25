/**
 * Server-side configuration read from process.env. Values come from .env
 * (loaded by dotenv in server.ts) or from the hosting environment.
 */

export function readServerEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function firebaseProjectId(): string {
  return readServerEnv('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID');
}

export function firestoreDatabaseId(): string {
  return readServerEnv('FIRESTORE_DATABASE_ID', 'VITE_FIRESTORE_DATABASE_ID');
}

/** Comma-separated ADMIN_EMAILS allow-list, lower-cased. */
export function configuredAdminEmails(): string[] {
  return readServerEnv('ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

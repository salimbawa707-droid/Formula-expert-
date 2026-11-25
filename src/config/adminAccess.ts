/**
 * Admin allow-list for the UI, sourced from the environment instead of a
 * hardcoded personal address.
 *
 * VITE_ADMIN_EMAILS is a comma-separated list. It is baked into the browser
 * bundle at build time, so it is only a convenience switch: authorisation is
 * enforced by Firestore rules and the API (ADMIN_EMAILS / custom claims).
 */
export function getConfiguredAdminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}

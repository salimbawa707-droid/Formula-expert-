const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  ? (import.meta as any).env as Record<string, string | undefined>
  : {};

const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey.length > 20
  );
}

/** Supabase's default persisted session key, used to avoid loading its SDK for guests. */
export function hasPersistedSupabaseSession(): boolean {
  if (typeof localStorage === 'undefined' || !isSupabaseConfigured()) return false;
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return false;
    const session = JSON.parse(raw);
    return typeof session?.access_token === 'string' && session.access_token.length > 0;
  } catch {
    return false;
  }
}

export function clearPersistedAuthentication<T extends { isAuthenticated: boolean }>(
  profile: T
): Omit<T, 'isAuthenticated'> & { isAuthenticated: boolean } {
  return { ...profile, isAuthenticated: false };
}

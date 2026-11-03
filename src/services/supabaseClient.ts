import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { apiFetch } from './apiBase';
import { isSupabaseConfigured } from './authProviderConfig';
export { isSupabaseConfigured, clearPersistedAuthentication } from './authProviderConfig';

// Environment variables for Supabase connection
const envMeta = (import.meta as any).env || {};
const supabaseUrl = (envMeta.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (envMeta.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Create the real Supabase client if credentials exist, otherwise initialize a placeholder client
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key-that-is-safe-for-offline-build', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

export interface SupabaseAuthResult {
  success: boolean;
  user?: any;
  session?: any;
  confirmationRequired?: boolean;
  error?: string;
}

export function createAuthUnavailableResult(provider: string): SupabaseAuthResult {
  return {
    success: false,
    error: `${provider} authentication is unavailable because Supabase is not configured. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or continue using the app as a local guest.`,
  };
}

/**
 * Real Supabase Auth Helpers
 */
export class AuthService {
  /**
   * Sign up with Email + Password
   */
  public static async signUpWithEmail(
    email: string, 
    password: string, 
    name: string, 
    company?: string
  ): Promise<SupabaseAuthResult> {
    if (!isSupabaseConfigured()) {
      return createAuthUnavailableResult('Email sign-up');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company: company || 'R&D Laboratory',
            plan: 'free',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        confirmationRequired: Boolean(data.user && !data.session),
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sign up.' };
    }
  }

  /**
   * Sign in with Email + Password
   */
  public static async signInWithEmail(email: string, password: string): Promise<SupabaseAuthResult> {
    if (!isSupabaseConfigured()) {
      return createAuthUnavailableResult('Email sign-in');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      if (!data.user || !data.session) {
        return { success: false, error: 'Supabase did not return an authenticated user session.' };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sign in.' };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  public static async signInWithGoogle(): Promise<SupabaseAuthResult> {
    if (!isSupabaseConfigured()) {
      return createAuthUnavailableResult('Google sign-in');
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, session: data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google authentication failed.' };
    }
  }

  /**
   * Sign out
   */
  public static async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out warning:', err);
      }
    }
  }

  /**
   * Get current session
   */
  public static async getSession() {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (err) {
      return null;
    }
  }

  /**
   * Delete account
   */
  public static async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId?.trim()) return { success: false, error: 'No authenticated account is available to delete.' };
    try {
      const response = await apiFetch('/api/account', { method: 'DELETE' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.success !== true) {
        return { success: false, error: body?.error || `Account deletion failed (HTTP ${response.status}).` };
      }
      await this.signOut();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Account deletion could not be confirmed by the server.' };
    }
  }
}

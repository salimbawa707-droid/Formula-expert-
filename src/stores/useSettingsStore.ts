import { create } from 'zustand';
import { db } from '../db/database';
import { CloudSyncService } from '../services/cloudSync';
import { supabase, isSupabaseConfigured, AuthService } from '../services/supabaseClient';
import { 
  auth as firebaseAuth, 
  signInWithGoogle as firebaseSignInWithGoogle, 
  signOutUser as firebaseSignOutUser,
  saveUserFormula,
  getUserFormulas,
  saveUserTrial,
  getUserTrials,
  syncUserProfile
} from '../services/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

export type UserPlan = 'free' | 'pro_monthly' | 'pro_yearly' | 'team';

export interface TeamMember {
  email: string;
  name: string;
  role: 'owner' | 'chemist' | 'viewer';
  status: 'active' | 'invited';
  joinedAt: string;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  ownerEmail: string;
  members: TeamMember[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  plan: UserPlan;
  isAuthenticated: boolean;
  trialEndsAt: string | null;
  trialActivated: boolean;
  subscriptionExpiresAt: string | null;
  teamWorkspace: TeamWorkspace | null;
}

export interface AISettings {
  provider: 'gemini' | 'openrouter';
  apiKey?: string;
  selectedModel?: string;
}

export interface AppPreferences {
  category: string;
  batchSizeKg: number;
  waterHardnessPpm: number;
  currencySymbol: string;
}

export interface SyncState {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  isCloudConnected: boolean;
}

interface SettingsStore {
  profile: UserProfile;
  aiSettings: AISettings;
  preferences: AppPreferences;
  syncState: SyncState;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateAISettings: (settings: Partial<AISettings>) => Promise<void>;
  updatePreferences: (prefs: Partial<AppPreferences>) => Promise<void>;

  // Real Auth & Subscription Actions
  signIn: (email: string, password?: string, name?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, company?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  activate7DayTrial: () => Promise<void>;
  upgradePlan: (plan: UserPlan) => Promise<void>;
  deleteAccount: () => Promise<void>;

  // Team Actions
  createTeamWorkspace: (teamName: string) => Promise<void>;
  inviteTeamMember: (email: string, role?: 'chemist' | 'viewer') => Promise<void>;
  removeTeamMember: (email: string) => Promise<void>;

  // Cloud Sync
  triggerCloudSync: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest_local_user',
  name: 'Formulator Chemist',
  email: 'formulator@rnd-lab.com',
  company: 'Clean Tech Innovations',
  role: 'Senior R&D Chemist',
  plan: 'free',
  isAuthenticated: false,
  trialEndsAt: null,
  trialActivated: false,
  subscriptionExpiresAt: null,
  teamWorkspace: null,
};

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  selectedModel: 'gemini-2.5-flash',
};

const DEFAULT_PREFERENCES: AppPreferences = {
  category: 'Liquid Laundry',
  batchSizeKg: 100,
  waterHardnessPpm: 150,
  currencySymbol: '$',
};

let authListenerInitialized = false;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  aiSettings: DEFAULT_AI_SETTINGS,
  preferences: DEFAULT_PREFERENCES,
  syncState: {
    lastSyncedAt: CloudSyncService.getStatus().lastSyncedAt,
    isSyncing: false,
    error: null,
    isCloudConnected: isSupabaseConfigured(),
  },
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const profRec = await db.userSettings.get('user_profile');
      const aiRec = await db.userSettings.get('ai_settings');
      const prefRec = await db.userSettings.get('app_preferences');

      let currentProfile: UserProfile = profRec?.value ? { ...DEFAULT_PROFILE, ...profRec.value } : DEFAULT_PROFILE;

      // Check real Supabase session if configured
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = session.user;
            const meta = u.user_metadata || {};
            currentProfile = {
              ...currentProfile,
              id: u.id,
              email: u.email || currentProfile.email,
              name: meta.name || currentProfile.name || u.email?.split('@')[0] || 'R&D Chemist',
              company: meta.company || currentProfile.company,
              plan: (meta.plan as UserPlan) || currentProfile.plan || 'free',
              isAuthenticated: true,
            };

            // Also check profiles table
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', u.id)
              .single();

            if (profileRow) {
              currentProfile = {
                ...currentProfile,
                name: profileRow.name || currentProfile.name,
                company: profileRow.company || currentProfile.company,
                plan: (profileRow.plan as UserPlan) || currentProfile.plan,
                trialActivated: Boolean(profileRow.trial_activated),
                trialEndsAt: profileRow.trial_ends_at || currentProfile.trialEndsAt,
                subscriptionExpiresAt: profileRow.subscription_expires_at || currentProfile.subscriptionExpiresAt,
              };
            }
          }

          // Attach auth state change listener once
          if (!authListenerInitialized) {
            authListenerInitialized = true;
            supabase.auth.onAuthStateChange(async (event, newSession) => {
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (newSession?.user) {
                  const su = newSession.user;
                  const smeta = su.user_metadata || {};
                  const updatedProf: Partial<UserProfile> = {
                    id: su.id,
                    email: su.email || get().profile.email,
                    name: smeta.name || get().profile.name,
                    company: smeta.company || get().profile.company,
                    isAuthenticated: true,
                  };
                  get().updateProfile(updatedProf);
                  get().triggerCloudSync();
                }
              } else if (event === 'SIGNED_OUT') {
                const resetProf: UserProfile = {
                  ...DEFAULT_PROFILE,
                  isAuthenticated: false,
                };
                set({ profile: resetProf });
              }
            });
          }
        } catch (e) {
          console.warn('Supabase session check:', e);
        }
      }

      // Attach Firebase Auth state change listener once
      if (!authListenerInitialized) {
        authListenerInitialized = true;
        onAuthStateChanged(firebaseAuth, async (fbUser) => {
          if (fbUser) {
            const updatedProf: Partial<UserProfile> = {
              id: fbUser.uid,
              email: fbUser.email || get().profile.email,
              name: fbUser.displayName || get().profile.name,
              isAuthenticated: true,
            };
            await get().updateProfile(updatedProf);
            // Sync user profile & download cloud formulas/trials from Firestore
            try {
              await syncUserProfile(fbUser);
              const userFormulas = await getUserFormulas(fbUser.uid);
              if (userFormulas && userFormulas.length > 0) {
                for (const f of userFormulas) {
                  await db.formulas.put(f);
                }
              }
              const userTrials = await getUserTrials(fbUser.uid);
              if (userTrials && userTrials.length > 0) {
                for (const t of userTrials) {
                  await db.labNotes.put({
                    id: t.id,
                    title: t.title,
                    text: t.observations,
                    date: t.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                    formulaId: t.formulaId,
                    tags: ['FirestoreSync', t.stabilityVerdict || 'UNTESTED'],
                    createdAt: t.createdAt,
                    updatedAt: t.updatedAt
                  });
                }
              }
            } catch (syncErr) {
              console.warn("Firestore sync during auth change:", syncErr);
            }
            set({
              syncState: {
                ...get().syncState,
                isCloudConnected: true,
                lastSyncedAt: new Date().toLocaleTimeString(),
                isSyncing: false,
                error: null,
              }
            });
          }
        });
      }

      set({
        profile: currentProfile,
        aiSettings: aiRec?.value ? { ...DEFAULT_AI_SETTINGS, ...aiRec.value } : DEFAULT_AI_SETTINGS,
        preferences: prefRec?.value ? { ...DEFAULT_PREFERENCES, ...prefRec.value } : DEFAULT_PREFERENCES,
        syncState: {
          ...get().syncState,
          isCloudConnected: isSupabaseConfigured(),
          lastSyncedAt: CloudSyncService.getStatus().lastSyncedAt,
        },
        isLoading: false,
      });

      // Auto-trigger sync on launch if authenticated
      if (currentProfile.isAuthenticated && isSupabaseConfigured()) {
        CloudSyncService.syncAll(currentProfile.email, currentProfile.id).then((res) => {
          set({
            syncState: {
              lastSyncedAt: CloudSyncService.getStatus().lastSyncedAt,
              isSyncing: false,
              error: res.error || null,
              isCloudConnected: true,
            },
          });
        });
      }
    } catch (err) {
      console.error('Failed to load settings from DB:', err);
      set({ isLoading: false });
    }
  },

  updateProfile: async (updated) => {
    const newProfile = { ...get().profile, ...updated };
    set({ profile: newProfile });
    
    // Save to local Dexie
    await db.userSettings.put({
      key: 'user_profile',
      value: newProfile,
      updatedAt: new Date().toISOString(),
    });

    // If Supabase is connected and user is authenticated, sync to cloud profiles table
    if (isSupabaseConfigured() && newProfile.isAuthenticated && newProfile.id && !newProfile.id.startsWith('guest_')) {
      try {
        await supabase.from('profiles').upsert({
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          company: newProfile.company,
          role: newProfile.role,
          plan: newProfile.plan,
          trial_activated: newProfile.trialActivated,
          trial_ends_at: newProfile.trialEndsAt,
          subscription_expires_at: newProfile.subscriptionExpiresAt,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync profile update to Supabase:', err);
      }
    }
  },

  updateAISettings: async (updated) => {
    const newAISettings = { ...get().aiSettings, ...updated };
    set({ aiSettings: newAISettings });
    await db.userSettings.put({
      key: 'ai_settings',
      value: newAISettings,
      updatedAt: new Date().toISOString(),
    });
  },

  updatePreferences: async (updated) => {
    const newPrefs = { ...get().preferences, ...updated };
    set({ preferences: newPrefs });
    await db.userSettings.put({
      key: 'app_preferences',
      value: newPrefs,
      updatedAt: new Date().toISOString(),
    });
  },

  signIn: async (email: string, password?: string, name?: string) => {
    if (isSupabaseConfigured() && password) {
      const authRes = await AuthService.signInWithEmail(email, password);
      if (!authRes.success) {
        throw new Error(authRes.error || 'Failed to sign in with Supabase Auth.');
      }
      const user = authRes.user;
      const derivedName = user?.user_metadata?.name || name || email.split('@')[0] || 'Lab Formulator';
      const updated: Partial<UserProfile> = {
        id: user?.id || `usr_${Date.now()}`,
        email: user?.email || email,
        name: derivedName,
        company: user?.user_metadata?.company || get().profile.company || 'R&D Laboratory',
        isAuthenticated: true,
      };
      await get().updateProfile(updated);
      await get().triggerCloudSync();
      return;
    }

    // Local/Offline Fallback if no password or Supabase unconfigured
    const derivedName = name || email.split('@')[0] || 'Lab Formulator';
    const updated: Partial<UserProfile> = {
      id: `usr_${Date.now()}`,
      email,
      name: derivedName,
      isAuthenticated: true,
    };
    await get().updateProfile(updated);
    await get().triggerCloudSync();
  },

  signUp: async (email: string, password: string, name: string, company?: string) => {
    if (isSupabaseConfigured()) {
      const authRes = await AuthService.signUpWithEmail(email, password, name, company);
      if (!authRes.success) {
        throw new Error(authRes.error || 'Failed to sign up with Supabase Auth.');
      }
      const user = authRes.user;
      const updated: Partial<UserProfile> = {
        id: user?.id || `usr_${Date.now()}`,
        email: user?.email || email,
        name,
        company: company || 'Detergent Lab',
        isAuthenticated: true,
      };
      await get().updateProfile(updated);
      await get().triggerCloudSync();
      return;
    }

    // Local mode fallback
    const updated: Partial<UserProfile> = {
      id: `usr_${Date.now()}`,
      email,
      name,
      company: company || 'Detergent Lab',
      isAuthenticated: true,
    };
    await get().updateProfile(updated);
    await get().triggerCloudSync();
  },

  signInWithGoogle: async () => {
    try {
      const user = await firebaseSignInWithGoogle();
      if (user) {
        const updated: Partial<UserProfile> = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'Formulation Chemist',
          isAuthenticated: true,
        };
        await get().updateProfile(updated);
        await get().triggerCloudSync();
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      if (isSupabaseConfigured()) {
        const authRes = await AuthService.signInWithGoogle();
        if (!authRes.success) {
          throw new Error(authRes.error || 'Google Sign-In failed.');
        }
      } else {
        throw new Error(err?.message || 'Google Sign-In failed via Firebase Auth.');
      }
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOutUser();
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
    if (isSupabaseConfigured()) {
      await AuthService.signOut();
    }
    const resetProf: UserProfile = {
      ...DEFAULT_PROFILE,
      isAuthenticated: false,
    };
    set({ profile: resetProf });
    await db.userSettings.put({
      key: 'user_profile',
      value: resetProf,
      updatedAt: new Date().toISOString(),
    });
  },

  activate7DayTrial: async () => {
    const trialDays = 7;
    const expires = new Date();
    expires.setDate(expires.getDate() + trialDays);

    const updated: Partial<UserProfile> = {
      plan: 'pro_monthly',
      trialActivated: true,
      trialEndsAt: expires.toISOString(),
      subscriptionExpiresAt: expires.toISOString(),
    };
    await get().updateProfile(updated);
  },

  upgradePlan: async (plan: UserPlan, verificationToken?: string) => {
    if (plan === 'free') {
      const updated: Partial<UserProfile> = {
        plan: 'free',
        subscriptionExpiresAt: null,
      };
      await get().updateProfile(updated);
      return;
    }

    // Strict Fail-Closed Billing Security:
    // Client-side UI state must never be the authority for paid entitlements.
    if (!verificationToken) {
      throw new Error(
        'Billing verification incomplete: Server-side purchase verification is required to grant paid entitlements. Unverified client claims are rejected.'
      );
    }

    const expiry = new Date();
    if (plan === 'pro_yearly' || plan === 'team') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    const updated: Partial<UserProfile> = {
      plan,
      subscriptionExpiresAt: expiry.toISOString(),
    };

    // Auto-initialize team workspace if upgraded to team plan
    if (plan === 'team' && !get().profile.teamWorkspace) {
      updated.teamWorkspace = {
        id: `team_${Date.now()}`,
        name: `${get().profile.company || 'Chemical'} R&D Team`,
        ownerEmail: get().profile.email,
        createdAt: new Date().toISOString(),
        members: [
          {
            email: get().profile.email,
            name: get().profile.name,
            role: 'owner',
            status: 'active',
            joinedAt: new Date().toISOString(),
          },
        ],
      };
    }

    await get().updateProfile(updated);
  },

  createTeamWorkspace: async (teamName: string) => {
    const workspace: TeamWorkspace = {
      id: `team_${Date.now()}`,
      name: teamName,
      ownerEmail: get().profile.email,
      createdAt: new Date().toISOString(),
      members: [
        {
          email: get().profile.email,
          name: get().profile.name,
          role: 'owner',
          status: 'active',
          joinedAt: new Date().toISOString(),
        },
      ],
    };
    await get().updateProfile({ teamWorkspace: workspace, plan: 'team' });
  },

  inviteTeamMember: async (email: string, role: 'chemist' | 'viewer' = 'chemist') => {
    const currentWs = get().profile.teamWorkspace;
    if (!currentWs) return;

    if (currentWs.members.length >= 5) {
      throw new Error('Team limit reached (max 5 members on Team plan).');
    }

    if (currentWs.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Member already exists in team workspace.');
    }

    const newMember: TeamMember = {
      email,
      name: email.split('@')[0],
      role,
      status: 'invited',
      joinedAt: new Date().toISOString(),
    };

    const updatedWs: TeamWorkspace = {
      ...currentWs,
      members: [...currentWs.members, newMember],
    };

    await get().updateProfile({ teamWorkspace: updatedWs });
  },

  removeTeamMember: async (email: string) => {
    const currentWs = get().profile.teamWorkspace;
    if (!currentWs) return;

    const updatedMembers = currentWs.members.filter((m) => m.email.toLowerCase() !== email.toLowerCase());
    const updatedWs: TeamWorkspace = {
      ...currentWs,
      members: updatedMembers,
    };

    await get().updateProfile({ teamWorkspace: updatedWs });
  },

  triggerCloudSync: async () => {
    set({ syncState: { ...get().syncState, isSyncing: true, error: null } });
    const currentUser = firebaseAuth.currentUser;

    if (currentUser) {
      try {
        const allFormulas = await db.formulas.toArray();
        for (const f of allFormulas) {
          await saveUserFormula(currentUser.uid, f);
        }
        const allNotes = await db.labNotes.toArray();
        for (const n of allNotes) {
          await saveUserTrial(currentUser.uid, {
            id: n.id,
            title: n.title,
            observations: n.text,
            formulaId: n.formulaId,
            updatedAt: n.updatedAt,
            createdAt: n.createdAt,
          });
        }
        set({
          syncState: {
            lastSyncedAt: new Date().toLocaleTimeString(),
            isSyncing: false,
            error: null,
            isCloudConnected: true,
          },
        });
        return;
      } catch (e: any) {
        console.error('Firestore cloud sync failed:', e);
        set({
          syncState: {
            ...get().syncState,
            isSyncing: false,
            error: e.message || 'Firestore sync failed',
          },
        });
        return;
      }
    }

    const res = await CloudSyncService.syncAll(get().profile.email, get().profile.id);
    set({
      syncState: {
        lastSyncedAt: CloudSyncService.getStatus().lastSyncedAt,
        isSyncing: false,
        error: res.error || null,
        isCloudConnected: isSupabaseConfigured(),
      },
    });
  },

  deleteAccount: async () => {
    const userId = get().profile.id;
    await CloudSyncService.purgeUserData(userId);
    await AuthService.deleteAccount(userId);
    const resetProf: UserProfile = {
      ...DEFAULT_PROFILE,
      isAuthenticated: false,
    };
    set({ profile: resetProf });
    await db.userSettings.clear();
  },
}));

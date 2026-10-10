import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Building, 
  LogOut, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles,
  Cloud
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { profile, signIn, signUp, signInWithGoogle, signOut, deleteAccount } = useSettingsStore();
  const [mode, setMode] = useState<'signin' | 'signup' | 'profile'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password, name);
      setSuccessMsg('Successfully signed in!');
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 600);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Failed to sign in.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please complete all required fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password, name, company);
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 600);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Failed to create account.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      setSuccessMsg('Connecting with Google...');
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Google Sign-In failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      setLoading(false);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError('Account deletion failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Mode (Logged In) */}
        {profile.isAuthenticated ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-lg">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                <p className="text-xs text-slate-400">{profile.email}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] font-semibold text-blue-300 uppercase">
                  <Cloud className="w-3 h-3" /> Plan: {profile.plan}
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Company / Lab:</span>
                <span className="text-white font-medium">{profile.company || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">R&D Role:</span>
                <span className="text-white font-medium">{profile.role || 'Chemist'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account ID:</span>
                <span className="text-slate-400 font-mono text-[10px]">{profile.id}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-red-800/40"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account & Purge Data
                </button>
              ) : (
                <div className="p-4 bg-red-950/80 border border-red-700 rounded-xl space-y-3 text-xs">
                  <div className="text-red-200 font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Permanent Action Notice
                  </div>
                  <p className="text-slate-300">
                    This will permanently delete your account, synced formulas, and cloud backups per Google Play guidelines.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Forms */
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Detergent R&D Account
              </div>
              <h3 className="text-xl font-bold text-white">
                {mode === 'signin' ? 'Sign In to Your Account' : 'Create R&D Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Sync formulas, collaborate with team, and access cloud AI models.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </div>
            )}

            {/* Google Sign-In Option */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 mb-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4 text-center text-xs text-slate-500">
              <span className="bg-slate-900 px-3 z-10 relative">Or with Email</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
            </div>

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Alex Rivera"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chemist@rnd-lab.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Lab Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Clean Chemical Industries"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all mt-2"
              >
                {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-400">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-blue-400 hover:underline font-semibold">
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setMode('signin')} className="text-blue-400 hover:underline font-semibold">
                    Sign In
                  </button>
                </>
              )}
            </div>

            {/* Compliance Privacy Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex flex-col items-center gap-1.5">
              <span>Targeting Android 16 (API 36) Compliance</span>
              <a 
                href="/privacy-policy.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-cyan-400 hover:underline font-semibold"
              >
                Read our Data Safety & Privacy Policy
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

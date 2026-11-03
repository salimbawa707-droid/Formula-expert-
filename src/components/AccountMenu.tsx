import { useState } from 'react';
import { 
  User, 
  Cloud, 
  RefreshCw, 
  Award, 
  Sparkles, 
  ChevronDown,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getPlanBadgeDetails } from '../utils/featureGating';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';
import AuthModal from './AuthModal';

export default function AccountMenu() {
  const { profile, syncState, triggerCloudSync, preferences, setTheme, toggleTheme } = useSettingsStore();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const badge = getPlanBadgeDetails(profile.plan);
  const currentTheme = preferences.theme || 'midnight';
  const isDaylight = currentTheme === 'daylight';

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Cloud Sync Button */}
      <button
        onClick={() => triggerCloudSync()}
        disabled={syncState.isSyncing}
        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        title="Sync formulas & lab notes with Cloud"
      >
        <Cloud className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-pulse text-blue-400' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">
          {syncState.isSyncing ? 'Syncing...' : 'Cloud Sync'}
        </span>
      </button>

      {/* Plan Badge Upgrade Trigger */}
      <button
        onClick={() => setIsPaywallOpen(true)}
        className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${badge.bgClass} ${badge.textClass}`}
      >
        <Award className="w-3.5 h-3.5" />
        <span>{badge.label}</span>
      </button>

      {/* Quick Theme Toggle Button (Midnight vs Daylight Laboratory) */}
      <button
        type="button"
        onClick={() => toggleTheme()}
        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
          isDaylight
            ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 text-amber-900 shadow-amber-900/10'
            : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700/80 text-slate-300 hover:text-white'
        }`}
        title={`Current: ${isDaylight ? 'Daylight Laboratory (High Contrast)' : 'Midnight Laboratory (Dark)'}. Click to switch theme.`}
        aria-label="Toggle Laboratory Theme"
      >
        {isDaylight ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Daylight Lab</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Midnight Lab</span>
          </>
        )}
      </button>

      {/* Account / Profile Button */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="max-w-[100px] truncate hidden md:inline">{profile.name}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div 
            className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <div className="p-2 border-b border-slate-800">
              <div className="font-bold text-xs text-white truncate">{profile.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{profile.email}</div>
            </div>

            {/* Laboratory Theme Toggle Section */}
            <div className="p-2 border-b border-slate-800">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Laboratory Theme</span>
                <span className="text-[9px] font-sans text-cyan-400 font-semibold">
                  {isDaylight ? 'High-Contrast' : 'Default'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme('midnight')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    !isDaylight
                      ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Midnight Laboratory: Default dark mode designed for reduced glare and chemical formula modeling"
                >
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Midnight</span>
                  {!isDaylight && <Check className="w-3 h-3 ml-0.5 text-cyan-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('daylight')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isDaylight
                      ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Daylight Laboratory: High-contrast light mode optimized for bright bench lighting and inspection"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Daylight</span>
                  {isDaylight && <Check className="w-3 h-3 ml-0.5 text-amber-700" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsAuthOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-blue-400" /> Account Profile & Security
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsPaywallOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Subscription & Pricing
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                triggerCloudSync();
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" /> Sync Cloud Database
            </button>
          </div>
        )}
      </div>

      <SubscriptionPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

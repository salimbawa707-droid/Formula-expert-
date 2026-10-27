import { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Users, 
  Award, 
  Cloud, 
  FileText, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useSettingsStore, UserPlan } from '../stores/useSettingsStore';
import { PlayBillingBridge } from '../services/playBillingBridge';

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedFeature?: string;
}

export default function SubscriptionPaywallModal({
  isOpen,
  onClose,
  highlightedFeature,
}: SubscriptionPaywallModalProps) {
  const { profile, upgradePlan, activate7DayTrial } = useSettingsStore();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [loadingPlan, setLoadingPlan] = useState<UserPlan | null>(null);
  const [trialSuccess, setTrialSuccess] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: UserPlan) => {
    if (plan === 'free') {
      setLoadingPlan('free');
      await upgradePlan('free');
      setLoadingPlan(null);
      onClose();
      return;
    }

    setLoadingPlan(plan);
    setBillingError(null);

    // Map plan to Google Play Product ID
    let playId = '';
    if (plan === 'pro_monthly') playId = PlayBillingBridge.PRODUCT_IDS.PRO_MONTHLY;
    else if (plan === 'pro_yearly') playId = PlayBillingBridge.PRODUCT_IDS.PRO_YEARLY;
    else if (plan === 'team') playId = PlayBillingBridge.PRODUCT_IDS.TEAM_YEARLY;

    try {
      const result = await PlayBillingBridge.purchase(playId);
      if (result.success) {
        setLoadingPlan(null);
        onClose();
      } else {
        setBillingError(result.error || 'Failed to complete transaction.');
        setLoadingPlan(null);
      }
    } catch (err: any) {
      setBillingError(err?.message || 'A payment exception occurred.');
      setLoadingPlan(null);
    }
  };

  const handleRestore = async () => {
    setLoadingPlan('pro_monthly');
    setBillingError(null);
    try {
      const res = await PlayBillingBridge.restorePurchases();
      if (res.success && res.restoredCount > 0) {
        alert(`Successfully restored ${res.restoredCount} active Play Store subscription(s)!`);
        onClose();
      } else {
        alert('No active Play Store subscriptions were found for this account.');
      }
    } catch (err: any) {
      setBillingError(err?.message || 'Restore request failed.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleStartTrial = async () => {
    setLoadingPlan('pro_monthly');
    try {
      await activate7DayTrial();
      setTrialSuccess(true);
      setTimeout(() => {
        setLoadingPlan(null);
        onClose();
      }, 1200);
    } catch (err) {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl my-auto">
        {/* Top Glow & Header */}
        <div className="relative bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 p-6 md:p-8 text-center border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Commercial R&D Grade License
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Unlock Professional Detergent R&D
          </h2>
          <p className="mt-2 text-slate-300 text-sm max-w-xl mx-auto">
            Scale from basic recipes to commercial manufacturing with unrestricted AI, PDF exports, cloud sync, and scientific engines.
          </p>

          {highlightedFeature && (
            <div className="mt-3 inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium px-4 py-1.5 rounded-lg">
              🔒 Feature locked on Free plan: <strong className="font-semibold">{highlightedFeature}</strong>
            </div>
          )}

          {/* Currency Toggle */}
          <div className="mt-4 inline-flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currency === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currency === 'INR' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              INR (₹)
            </button>
          </div>
        </div>

        {/* 7-Day Free Trial Banner */}
        {!profile.trialActivated && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 p-4 border-b border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  7-Day Risk-Free Full Pro Trial
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-mono uppercase">
                    No Credit Card Required
                  </span>
                </div>
                <p className="text-xs text-slate-300">Try all Pro features free for 7 days. Cancel anytime.</p>
              </div>
            </div>
            <button
              onClick={handleStartTrial}
              disabled={loadingPlan !== null}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {trialSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Trial Activated!
                </>
              ) : (
                <>
                  Start 7-Day Free Trial <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/90">
          {/* 1. Free Plan */}
          <div className="flex flex-col bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition-all">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Starter</div>
            <h3 className="text-xl font-bold text-white">Free Plan</h3>
            <p className="text-xs text-slate-300 mt-1">For DIY formulators & students</p>

            <div className="my-4 text-2xl font-black text-white">
              {currency === 'USD' ? '$0' : '₹0'}{' '}
              <span className="text-xs font-medium text-slate-300">/ forever</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-200 mb-6 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Max 7 Saved Formulas
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Offline Calculation Engines
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Master 400+ Chemical Library
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 shrink-0 text-slate-500" /> No Professional PDF Reports
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 shrink-0 text-slate-500" /> No Cloud Sync & Backup
              </li>
            </ul>

            <button
              disabled={profile.plan === 'free'}
              onClick={() => handleSelectPlan('free')}
              className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-bold transition-all"
            >
              {profile.plan === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* 2. Pro Monthly / Yearly */}
          <div className="relative flex flex-col bg-gradient-to-b from-blue-900/40 via-slate-800/80 to-slate-800 border-2 border-blue-500 rounded-xl p-5 shadow-2xl shadow-blue-500/20 z-10 ring-2 ring-blue-500/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider">
              MOST POPULAR FOR LABS
            </div>

            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1 mt-1">Professional</div>
            <h3 className="text-xl font-bold text-white flex items-center justify-between">
              Pro Member <Award className="w-5 h-5 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-300 mt-1">Full power for active formulators & R&D labs</p>

            <div className="my-4">
              <div className="text-3xl font-black text-white">
                {currency === 'USD' ? '$8.99' : '₹349'}{' '}
                <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-1">
                or {currency === 'USD' ? '$69/yr' : '₹2,799/yr'} (Save 36%)
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-200 mb-6 flex-1">
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-blue-400 shrink-0" /> Unlimited Saved Formulas
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-blue-400 shrink-0" /> Full AI Formulator & Deep Optimization
              </li>
              <li className="flex items-center gap-2 font-medium">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" /> Professional PDF Exporting & Branding
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Cloud className="w-4 h-4 text-blue-400 shrink-0" /> Automatic Cloud Sync & Multi-Device
              </li>
              <li className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" /> Powder Engine & Spec Dashboard
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={loadingPlan !== null || profile.plan === 'pro_monthly'}
                onClick={() => handleSelectPlan('pro_monthly')}
                className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
              >
                {profile.plan === 'pro_monthly' ? 'Active' : 'Monthly'}
              </button>
              <button
                disabled={loadingPlan !== null || profile.plan === 'pro_yearly'}
                onClick={() => handleSelectPlan('pro_yearly')}
                className="py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold transition-all shadow-md"
              >
                {profile.plan === 'pro_yearly' ? 'Active' : 'Yearly ($69)'}
              </button>
            </div>
          </div>

          {/* 3. Team / Factory Plan */}
          <div className="flex flex-col bg-slate-800/50 border border-purple-500/50 rounded-xl p-5 hover:border-purple-500 transition-all">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Enterprise</div>
            <h3 className="text-xl font-bold text-white flex items-center justify-between">
              Team / Factory <Users className="w-5 h-5 text-purple-400" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">Multi-user collaboration for factories</p>

            <div className="my-4 text-2xl font-black text-white">
              {currency === 'USD' ? '$149' : '₹7,999'}{' '}
              <span className="text-xs font-normal text-slate-400">/ year</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-6 flex-1">
              <li className="flex items-center gap-2 font-medium text-white">
                <Check className="w-4 h-4 text-purple-400 shrink-0" /> Everything in Pro Plan
              </li>
              <li className="flex items-center gap-2 font-medium text-purple-300">
                <Users className="w-4 h-4 text-purple-400 shrink-0" /> Up to 5 Team Members
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" /> Shared Formula Workspace
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" /> Centralized Inventory & Production
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" /> Priority Lab Support
              </li>
            </ul>

            <button
              disabled={loadingPlan !== null || profile.plan === 'team'}
              onClick={() => handleSelectPlan('team')}
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
            >
              {profile.plan === 'team' ? 'Current Plan' : 'Upgrade to Team ($149)'}
            </button>
          </div>
        </div>

        {/* Billing Error Alert */}
        {billingError && (
          <div className="mx-6 md:mx-8 mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-xs text-red-300">
            <strong>Store Error:</strong> {billingError}
          </div>
        )}

        {/* Footer info */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between px-8 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-left">
            <span>🔒 Google Play Billing & Secure Encrypted Payments</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span>100% Satisfaction Guarantee</span>
          </div>
          <button
            onClick={handleRestore}
            disabled={loadingPlan !== null}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPlan ? 'animate-spin' : ''}`} />
            Restore Play Purchases
          </button>
        </div>
      </div>
    </div>
  );
}

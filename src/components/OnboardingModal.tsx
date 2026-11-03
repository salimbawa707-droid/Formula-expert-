import { useState } from 'react';
import { 
  X, 
  FlaskConical, 
  Layers, 
  Sparkles, 
  CloudLightning, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Users 
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const { profile, activate7DayTrial } = useSettingsStore();

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleStartTrial = async () => {
    try {
      await activate7DayTrial();
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Absolute header glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dynamic step rendering */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col items-center text-center">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-2 shadow-lg shadow-blue-500/5">
                <FlaskConical className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Welcome to Detergent Formula Expert
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                The premier R&D laboratory assistant and industrial formulation companion. Build, analyze, and test detergent recipes with absolute scientific precision.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto pt-2">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Speciation Engines</div>
                    <div className="text-[10px] text-slate-400">Newton-Raphson charge balance & pH solver.</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Stability Matrix</div>
                    <div className="text-[10px] text-slate-400">Ionic compatibility checks & hard-water tests.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-2 shadow-lg shadow-indigo-500/5">
                <CloudLightning className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Offline-First & Cloud Backed
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                No signal in the factory? No problem. The app performs all calculations fully offline in your browser or mobile device, preserving local IndexedDB states safely.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto pt-2">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5">
                  <CloudLightning className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Background Sync</div>
                    <div className="text-[10px] text-slate-400">Pushes your records safely to the cloud.</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Shared Workspace</div>
                    <div className="text-[10px] text-slate-400">Up to 5 team members on the Team / Factory plan.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2 shadow-lg shadow-emerald-500/5">
                <Zap className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Get Started with Pro R&D Features
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                Enjoy unlimited formula saves, deep AI formulation suggestions, complete PDF reports with your custom lab branding, and direct multi-user sync.
              </p>

              {!profile.trialActivated ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl max-w-md mx-auto text-left space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Start Your 7-Day Free Trial
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Test drive all professional capabilities for 7 days, absolute risk-free. No credit card or Google Play Billing details are required to try.
                  </p>
                  <button
                    onClick={handleStartTrial}
                    className="w-full mt-2 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10"
                  >
                    Activate Free Trial
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl max-w-md mx-auto text-xs text-slate-300 font-semibold flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" /> Pro R&D Grade License Activated!
                </div>
              )}
            </div>
          )}

          {/* Stepper Dot Indicators */}
          <div className="flex items-center gap-1.5 mt-8">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'w-5 bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Go to step ${s}`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center px-6">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Skip
          </button>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
          >
            {step === 3 ? 'Get Started' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

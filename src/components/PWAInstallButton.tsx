import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as standalone installed PWA, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Android / Chromium Desktop
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 border border-cyan-500 text-slate-950 hover:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
        title="Install Detergent Formula Expert App"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 border border-cyan-500 text-slate-950 hover:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
        >
          <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-white">Add to Home Screen (iOS)</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Install the Detergent Formula Expert app on your iPhone or iPad for quick offline access:
              </p>

              <ol className="mt-4 space-y-3 text-xs text-slate-300">
                <li className="flex gap-2.5">
                  <span className="flex w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-bold items-center justify-center text-[10px] text-cyan-400">1</span>
                  <span>Tap the <span className="font-bold text-white">Share</span> button in your Safari browser toolbar (bottom on iPhone, top on iPad).</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-bold items-center justify-center text-[10px] text-cyan-400">2</span>
                  <span>Scroll down and select <span className="font-bold text-white">Add to Home Screen</span>.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-bold items-center justify-center text-[10px] text-cyan-400">3</span>
                  <span>Tap <span className="font-bold text-white">Add</span> in the top right to complete installation.</span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold text-white transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

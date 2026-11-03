import { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissal when coming back online or going offline
    setDismissed(false);
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-amber-500 text-slate-950 border border-amber-400 px-4 py-2.5 shadow-2xl shadow-amber-500/20 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-1.5 rounded-lg bg-slate-950/10 shrink-0">
        <CloudOff className="w-4 h-4 text-slate-950" />
      </div>
      <div className="text-xs">
        <div className="font-bold flex items-center gap-1.5">
          Laboratory Offline
        </div>
        <p className="text-[10px] text-slate-900 leading-tight">
          Calculations & formulas are fully operational offline. Sync will resume once online.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[10px] uppercase font-bold text-slate-900 hover:text-white px-1 py-0.5 rounded transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}

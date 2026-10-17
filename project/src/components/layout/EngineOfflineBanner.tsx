import { useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { checkEngineHealth, useEngineStatus } from '../../lib/apiStatus';

/** Shown whenever the backend is unreachable, so failures are visible instead of silently faked. */
export function EngineOfflineBanner() {
  const status = useEngineStatus();
  const [retrying, setRetrying] = useState(false);

  if (status !== 'offline') return null;

  const retry = async () => {
    setRetrying(true);
    await checkEngineHealth();
    setRetrying(false);
  };

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 z-[150] w-[calc(100%-32px)] max-w-md -translate-x-1/2 flex items-center gap-3 rounded-xl border border-[#FF526B]/40 bg-[#0A0A12]/95 px-4 py-2.5 text-xs sm:text-sm text-white/90 shadow-lg shadow-[#FF168D]/15 backdrop-blur"
    >
      <WifiOff className="w-4 h-4 text-[#FF8A9B] shrink-0" />
      <p className="flex-1 leading-snug">
        <strong className="text-white">SG16 AI Engine is offline.</strong> Reconnecting automatically…
      </p>
      <button
        type="button"
        onClick={retry}
        disabled={retrying}
        className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-white/80 hover:bg-white/10 disabled:opacity-60"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
        Retry
      </button>
    </div>
  );
}

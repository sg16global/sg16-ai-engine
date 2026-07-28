import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useAppStore } from '../../core/appState';
import { Sg16Logo } from '../ui/Sg16Logo';

export function InstallPrompt() {
  const { canPrompt, isIOS, hasNativePrompt, install, dismiss } = useInstallPrompt();
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const [visible, setVisible] = useState(false);
  const onHome = currentWorkspace === 'home';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const flushBottom =
    onHome || pathname === '/' || pathname === '/welcome' || pathname === '/app';

  useEffect(() => {
    if (!canPrompt) return;

    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrow = window.matchMedia('(max-width: 1023px)').matches;
    const delay = isCoarsePointer || isNarrow ? 2500 : 4000;

    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [canPrompt]);

  if (!visible || !canPrompt) return null;

  /* Landing / Shield Home have no bottom nav — sit above safe area only */
  const bottomClass = flushBottom
    ? 'bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))]'
    : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]';

  return (
    <div className={`fixed inset-x-0 ${bottomClass} lg:bottom-6 z-[100] px-4 pointer-events-none`}>
      <div className="pointer-events-auto max-w-md mx-auto bg-zinc-900/95 backdrop-blur-xl border border-[#FF365A]/35 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <Sg16Logo className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install SG16 AI Engine</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {isIOS && !hasNativePrompt ? (
                <>
                  Tap <Share className="w-3.5 h-3.5 inline -mt-0.5" /> Share, then &quot;Add to Home Screen&quot; —
                  works in portrait or landscape on any iPhone or iPad.
                </>
              ) : (
                'Add SG16 to your home screen or desktop — fullscreen app, portrait or landscape, any phone size.'
              )}
            </p>
            <div className="flex gap-2 mt-3">
              {hasNativePrompt && (
                <button
                  type="button"
                  onClick={() => install()}
                  className="flex-1 bg-[#FF173D] hover:bg-[#ff365a] text-xs font-medium py-2.5 min-h-[44px] rounded-xl transition"
                >
                  Install app
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  setVisible(false);
                }}
                className="px-4 text-xs text-gray-400 hover:text-white py-2.5 min-h-[44px] rounded-xl border border-white/10"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              dismiss();
              setVisible(false);
            }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

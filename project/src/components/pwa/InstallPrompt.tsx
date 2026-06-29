import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { Sg16Logo } from '../ui/Sg16Logo';

export function InstallPrompt() {
  const { canPrompt, isIOS, hasNativePrompt, install, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canPrompt) return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobile) return;

    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, [canPrompt]);

  if (!visible || !canPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6 z-[100] px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <Sg16Logo className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install SG16 AI Engine</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {isIOS && !hasNativePrompt ? (
                <>
                  Tap <Share className="w-3.5 h-3.5 inline -mt-0.5" /> Share, then &quot;Add to Home Screen&quot; for a
                  fullscreen app experience.
                </>
              ) : (
                'Add to your home screen for a native app experience — no browser bar, works offline.'
              )}
            </p>
            <div className="flex gap-2 mt-3">
              {hasNativePrompt && (
                <button
                  type="button"
                  onClick={() => install()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium py-2.5 rounded-xl transition"
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
                className="px-4 text-xs text-gray-400 hover:text-white py-2.5 rounded-xl border border-white/10"
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
            className="p-1 text-gray-500 hover:text-white shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

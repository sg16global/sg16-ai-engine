import { Sparkles, X } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { SG16_BRAND } from '../../core/branding';

export function LaunchSubscriptionModal() {
  const open = useAppStore((s) => s.launchNoticeOpen);
  const launchMessage = useAppStore((s) => s.launchMessage);
  const closeLaunchNotice = useAppStore((s) => s.closeLaunchNotice);

  return (
    <div
      className={`fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-4 transition-opacity ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={closeLaunchNotice}
        aria-label="Close"
        tabIndex={open ? 0 : -1}
      />

      <div className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10">
        <button
          type="button"
          onClick={closeLaunchNotice}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-gray-400"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Launch period — full access</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {launchMessage ||
              `Every ${SG16_BRAND.shortName} workspace is free and unlimited right now. Paid plans are shown for reference only.`}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100/90 mb-5">
          <p className="font-medium text-emerald-300 mb-1">Your access today</p>
          <ul className="space-y-1 text-xs text-emerald-100/80 text-left">
            <li>• All 8 AI workspaces — unlimited</li>
            <li>• No payment required during launch</li>
            <li>• We will notify you in the app before billing starts</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={closeLaunchNotice}
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-sm font-medium"
        >
          Continue with free unlimited access
        </button>
      </div>
    </div>
  );
}

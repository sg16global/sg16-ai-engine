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

      <div className="relative w-full max-w-md bg-[#0c0a0e] border border-[#FF2E2E]/30 rounded-2xl p-6 shadow-2xl shadow-[0_0_40px_rgba(255,46,46,0.12)]">
        <button
          type="button"
          onClick={closeLaunchNotice}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-gray-400"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FF2E2E]/15 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#FF8A8A]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Full access — pricing coming soon</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {launchMessage ||
              `Every ${SG16_BRAND.shortName} workspace is free and unlimited right now. Paid plans are shown for reference only.`}
          </p>
        </div>

        <div className="rounded-xl border border-[#FF2E2E]/20 bg-[#FF2E2E]/5 px-4 py-3 text-sm text-white/85 mb-5">
          <p className="font-medium text-[#FF8A8A] mb-1">Your access today</p>
          <ul className="space-y-1 text-xs text-white/65 text-left">
            <li>• All AI workspaces — unlimited</li>
            <li>• No payment required right now</li>
            <li>• Domain stays sg16engine.com when checkout goes live</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={closeLaunchNotice}
          className="w-full bg-[#FF2E2E] hover:bg-[#FF5C5C] py-2.5 rounded-xl text-sm font-medium text-white"
        >
          Continue with free unlimited access
        </button>
      </div>
    </div>
  );
}

import { Sparkles } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { SG16_BRAND } from '../../core/branding';

export function LaunchBanner() {
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);

  if (!launchFree) return null;

  return (
    <div className="hidden lg:block shrink-0 border-b border-white/10 bg-[#800000] px-3 sm:px-6 py-2.5">
      <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-white/90 max-w-6xl mx-auto">
        <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed">
          <strong className="text-white">Launch period</strong>
          {' — '}
          {launchMessage ||
            `All ${SG16_BRAND.shortName} workspaces are free and unlimited. We will notify you before paid plans begin.`}
        </p>
      </div>
    </div>
  );
}

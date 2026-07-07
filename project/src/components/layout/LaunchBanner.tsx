import { Sparkles } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { SG16_BRAND } from '../../core/branding';

export function LaunchBanner() {
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);

  if (!launchFree) return null;

  return (
    <div className="shrink-0 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-cyan-950/60 px-3 sm:px-6 py-2.5">
      <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-emerald-100/95 max-w-6xl mx-auto">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed">
          <strong className="text-emerald-300">Launch period</strong>
          {' — '}
          {launchMessage || `All ${SG16_BRAND.shortName} workspaces are free and unlimited. We will notify you before paid plans begin.`}
        </p>
      </div>
    </div>
  );
}

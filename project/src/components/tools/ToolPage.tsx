import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

/** Frame for one shield tool: back button, title, scrolling body. */
export function ToolPage({
  title,
  subtitle,
  backLabel,
  onBack,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain mobile-scroll-main">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="sg16-bar-soft inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs sm:text-sm text-white/50 mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}

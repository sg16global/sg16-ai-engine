import type { ReactNode } from 'react';
import type { SectionSkin } from '../../core/sectionThemes';
import { SKIN_META } from '../../core/sectionThemes';

interface ModuleHubProps {
  title: string;
  subtitle?: string;
  skin?: SectionSkin;
  children: ReactNode;
}

/** Mockup hub canvas on geo black — uses card/bar standards. */
export function ModuleHub({ title, subtitle, skin = 'shell', children }: ModuleHubProps) {
  const meta = SKIN_META[skin];

  return (
    <div className="h-full overflow-auto mobile-scroll-main">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        <div className="sg16-bar flex items-start gap-3">
          <span className={`mt-1 h-8 w-1 rounded-full shrink-0 ${meta.bar}`} aria-hidden />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[color:var(--sg16-muted)] mt-1 max-w-2xl">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

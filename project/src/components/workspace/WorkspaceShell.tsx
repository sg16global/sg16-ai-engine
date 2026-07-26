import type { ReactNode } from 'react';
import type { SectionSkin } from '../../core/sectionThemes';
import { SKIN_META } from '../../core/sectionThemes';

interface WorkspaceShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeClass?: string;
  skin?: SectionSkin;
  children: ReactNode;
}

export function WorkspaceShell({
  title,
  subtitle,
  badge,
  badgeClass,
  skin = 'shell',
  children,
}: WorkspaceShellProps) {
  const meta = SKIN_META[skin];
  const badgeTone = badgeClass || meta.accent;

  return (
    <div className={`h-full flex flex-col sg16-section sg16-section-${skin}`}>
      <div className="sg16-workspace-header px-4 sm:px-5 py-3 sm:py-4 hidden lg:block shrink-0">
        <div className="sg16-bar flex items-start gap-3.5">
          <span className={`mt-1 h-8 w-1 rounded-full shrink-0 ${meta.bar}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[1.35rem] sm:text-2xl font-semibold tracking-tight text-white">
                {title}
              </h1>
              {badge && (
                <span
                  className={`text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border ${meta.ring} ${meta.soft} ${badgeTone}`}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-white/45 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

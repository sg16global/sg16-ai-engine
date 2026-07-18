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
      <div className="px-6 py-5 border-b border-white/10 hidden lg:block shrink-0 bg-black/20">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-sm text-white/55 mt-0.5">{subtitle}</p>
          </div>
          {badge && (
            <span
              className={`text-xs px-3 py-1 rounded-full border ${meta.ring} ${meta.soft} ${badgeTone}`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

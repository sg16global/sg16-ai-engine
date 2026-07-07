import type { ReactNode } from 'react';

interface WorkspaceShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeClass?: string;
  children: ReactNode;
}

export function WorkspaceShell({
  title,
  subtitle,
  badge,
  badgeClass = 'text-emerald-400',
  children,
}: WorkspaceShellProps) {
  return (
    <div className="h-full flex flex-col bg-[#050507]">
      <div className="px-6 py-5 border-b border-white/10 hidden lg:block shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          {badge && (
            <span className={`text-xs px-3 py-1 rounded-full border border-white/10 ${badgeClass}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

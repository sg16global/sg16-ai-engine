import type { ReactNode } from 'react';
import { PanelLeft, ChevronUp } from 'lucide-react';
import { useAutoHideChrome } from '../../hooks/useAutoHideChrome';

interface WorkspaceChromeProps {
  workspaceKey: string;
  enabled: boolean;
  workspaceLabel: string;
  sidebar: (helpers: { onNavSelect: () => void }) => ReactNode;
  header: ReactNode;
  mobileHeader: ReactNode;
  children: ReactNode;
}

export function WorkspaceChrome({
  workspaceKey,
  enabled,
  workspaceLabel,
  sidebar,
  header,
  mobileHeader,
  children,
}: WorkspaceChromeProps) {
  const chrome = useAutoHideChrome(workspaceKey, enabled);
  const open = chrome.open;

  return (
    <>
      {enabled && (
        <>
          {!open && (
            <>
              <button
                type="button"
                className="sg16-chrome-tab sg16-chrome-tab--left hidden lg:flex"
                onMouseEnter={chrome.openChrome}
                onFocus={chrome.openChrome}
                onClick={chrome.openChrome}
                aria-label="Open menu"
              >
                <PanelLeft className="h-3.5 w-3.5" />
                <span>Menu</span>
              </button>
              <button
                type="button"
                className="sg16-chrome-tab sg16-chrome-tab--top hidden lg:flex"
                onMouseEnter={chrome.openChrome}
                onFocus={chrome.openChrome}
                onClick={chrome.openChrome}
                aria-label="Open header"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span>{workspaceLabel}</span>
              </button>
            </>
          )}
          <div
            className="sg16-chrome-edge sg16-chrome-edge--left hidden lg:block"
            onMouseEnter={chrome.openChrome}
            aria-hidden
          />
          <div
            className="sg16-chrome-edge sg16-chrome-edge--top hidden lg:block"
            onMouseEnter={chrome.openChrome}
            aria-hidden
          />
        </>
      )}

      <div
        className={`sg16-sidebar-wrap hidden lg:flex ${open ? 'sg16-sidebar-wrap--open' : ''}`}
        onMouseEnter={enabled ? chrome.onChromeEnter : undefined}
        onMouseLeave={enabled ? chrome.onChromeLeave : undefined}
      >
        {sidebar({ onNavSelect: chrome.onNavSelect })}
      </div>

      <div className="sg16-work-panel flex flex-1 flex-col min-w-0 sg16-work-field">
        <div
          className={`sg16-header-wrap hidden lg:block ${open ? 'sg16-header-wrap--open' : ''}`}
          onMouseEnter={enabled ? chrome.onChromeEnter : undefined}
          onMouseLeave={enabled ? chrome.onChromeLeave : undefined}
        >
          {header}
        </div>

        <div className="lg:hidden shrink-0">{mobileHeader}</div>

        {children}
      </div>
    </>
  );
}

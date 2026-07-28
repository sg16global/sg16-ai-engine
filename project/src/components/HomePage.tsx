import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  Braces,
  ChartNoAxesCombined,
  GraduationCap,
  HeartPulse,
  LogOut,
  Settings,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../core/appState';
import { isAuthenticated } from '../core/access';
import { pushAppPath } from '../core/routes';
import { usePilotStore } from '../core/pilotState';
import type { WorkspaceId } from '../core/types';
import { ShieldBgSlides } from './home/ShieldBgSlides';
import './shieldHome.css';

type ShieldItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  className: string;
  workspace: WorkspaceId;
  prompt?: string;
  featured?: boolean;
};

/** AIO Shield Home look — wired to main engine workspaces. */
const shields: ShieldItem[] = [
  {
    key: 'student',
    title: 'STUDENT',
    subtitle: 'SHIELD',
    icon: GraduationCap,
    className: 'student',
    workspace: 'student-shield',
  },
  {
    key: 'health',
    title: 'HEALTH',
    subtitle: 'SHIELD',
    icon: HeartPulse,
    className: 'health',
    workspace: 'health',
  },
  {
    key: 'ai',
    title: 'AI',
    subtitle: 'CHAT',
    icon: Bot,
    className: 'ai',
    workspace: 'general',
    featured: true,
  },
  {
    key: 'coding',
    title: 'CODING',
    subtitle: 'HUB',
    icon: Braces,
    className: 'coding',
    workspace: 'coding',
  },
  {
    key: 'market',
    title: 'MARKET',
    subtitle: 'SHIELD',
    icon: ChartNoAxesCombined,
    className: 'market',
    workspace: 'market',
  },
];

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
}

export const HomePage = () => {
  const [now, setNow] = useState(() => new Date());
  const authUser = useAppStore((s) => s.authUser);
  const settings = useAppStore((s) => s.settings);
  const navigateToWorkspace = useAppStore((s) => s.navigateToWorkspace);
  const requireAuth = useAppStore((s) => s.requireAuth);
  const openHelp = useAppStore((s) => s.openHelp);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const logout = useAppStore((s) => s.logout);
  const togglePilot = usePilotStore((s) => s.toggleOpen);
  const isGuest = !isAuthenticated(authUser);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const displayName = useMemo(() => {
    if (isGuest) return 'GUEST';
    const raw = authUser?.name || settings.displayName || 'SG16 User';
    return raw.trim().split(/\s+/)[0].toUpperCase();
  }, [authUser?.name, settings.displayName, isGuest]);

  const openShield = (item: ShieldItem) => {
    requireAuth(() => {
      if (item.prompt) navigateToWorkspace(item.workspace, item.prompt);
      else setWorkspace(item.workspace);
    });
  };

  return (
    <section className="shield-home" aria-label="SG16 Shield Home">
      <ShieldBgSlides />
      <div className="shield-home__stars" />
      <div className="shield-home__scanlines" />

      <header className="shield-home__topbar">
        <div className="hud-panel hud-welcome">
          <UserRound size={21} />
          <span>WELCOME, {displayName}</span>
        </div>

        <div className="hud-actions">
          <button
            className="hud-icon"
            type="button"
            onClick={() => openHelp('overview')}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <button
            className="hud-icon"
            type="button"
            onClick={() => requireAuth(() => setWorkspace('settings'))}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            className="hud-logout"
            type="button"
            onClick={() => (isGuest ? pushAppPath('/', true) : logout())}
          >
            <LogOut size={19} />
            <span>{isGuest ? 'EXIT TOUR' : 'LOGOUT'}</span>
          </button>
        </div>
      </header>

      <div className="shield-home__stage">
        <div className="circuit circuit--left" />
        <div className="circuit circuit--right" />

        {shields.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`shield-node shield-node--${item.className}${
                item.featured ? ' shield-node--featured' : ''
              }`}
              onClick={() => openShield(item)}
              aria-label={`${item.title} ${item.subtitle}`}
            >
              <span className="shield-node__aura" />
              <span className="shield-node__frame">
                <span className="shield-node__inner">
                  <Icon className="shield-node__icon" strokeWidth={1.75} />
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
              </span>
            </button>
          );
        })}

        <div className="shield-clock" aria-live="polite">
          <div className="shield-clock__time">{formatTime(now)}</div>
          <div className="shield-clock__date">{formatDate(now)}</div>
        </div>
      </div>

      <footer className="shield-status">
        <div>
          <span>SYSTEM STATUS</span>
          <strong>
            <i className="ok" /> OPERATIONAL
          </strong>
        </div>
        <div>
          <span>SERVER STATUS</span>
          <strong>
            <i className="ok" /> CONNECTED
          </strong>
        </div>
        <div>
          <span>NETWORK</span>
          <strong>
            <i className="ok" /> STABLE
          </strong>
        </div>
        <div>
          <span>AI ENGINE</span>
          <strong>
            <i className="ok" /> ACTIVE
          </strong>
        </div>
        <div>
          <span>DATA PROTECTION</span>
          <strong>
            <i className="ok" /> SECURE
          </strong>
        </div>
        <div>
          <button type="button" className="shield-status__pilot" onClick={togglePilot}>
            <span>PILOT</span>
            <strong className="pilot">SG16</strong>
          </button>
        </div>
      </footer>
    </section>
  );
};

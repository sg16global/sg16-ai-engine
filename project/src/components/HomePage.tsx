import { useEffect, useMemo, useState } from 'react';
import { Bell, Globe, UserRound } from 'lucide-react';
import { useAppStore } from '../core/appState';
import { isAuthenticated } from '../core/access';
import { usePilotStore } from '../core/pilotState';
import { useEngineHealth, useEngineStatus } from '../lib/apiStatus';
import type { WorkspaceId } from '../core/types';
import './shieldHome.css';

type ShieldItem = {
  key: string;
  label: string;
  logo: string;
  className: string;
  workspace: WorkspaceId;
  prompt?: string;
  featured?: boolean;
};

/** AIO Shield Home — custom shield logos (transparent WebP cut from the CURSOR BOSS/logo JPGs). */
const shields: ShieldItem[] = [
  {
    key: 'student',
    label: 'Student Shield',
    logo: '/shield-home/logos/student-shield-alpha.webp',
    className: 'student',
    workspace: 'student-shield',
  },
  {
    key: 'health',
    label: 'Health Shield',
    logo: '/shield-home/logos/health-shield-alpha.webp',
    className: 'health',
    workspace: 'health',
  },
  {
    key: 'ai',
    label: 'AI Chat Shield',
    logo: '/shield-home/logos/ai-chat-alpha.webp',
    className: 'ai',
    workspace: 'general',
    featured: true,
  },
  {
    key: 'coding',
    label: 'Coding Hub Shield',
    logo: '/shield-home/logos/coding-hub-alpha.webp',
    className: 'coding',
    workspace: 'coding',
  },
  {
    key: 'market',
    label: 'Market Shield',
    logo: '/shield-home/logos/market-shield-alpha.webp',
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
  const startSession = useAppStore((s) => s.startSession);
  const openUserRoom = useAppStore((s) => s.openUserRoom);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const goToPublicHome = useAppStore((s) => s.goToPublicHome);
  const togglePilot = usePilotStore((s) => s.toggleOpen);
  const engine = useEngineStatus();
  const health = useEngineHealth();
  const aiStatus = useAppStore((s) => s.aiStatus);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Every value below is checked live: /health, the browser's network state and real AI replies.
  const server = engine === 'online' ? 'ok' : engine === 'checking' ? 'wait' : 'bad';
  const ai =
    engine !== 'online' || !health?.aiConfigured || aiStatus === 'offline'
      ? { tone: 'bad', value: health && !health.aiConfigured ? 'NOT SET UP' : 'UNAVAILABLE' }
      : aiStatus === 'busy'
        ? { tone: 'wait', value: 'BUSY' }
        : aiStatus === 'ok'
          ? { tone: 'ok', value: 'ANSWERING' }
          : { tone: 'ok', value: 'CONNECTED' };
  const status = [
    {
      label: 'SYSTEM STATUS',
      tone: server === 'ok' && ai.tone === 'ok' ? 'ok' : server === 'bad' ? 'bad' : 'wait',
      value: server === 'ok' && ai.tone === 'ok' ? 'OPERATIONAL' : server === 'bad' ? 'OFFLINE' : server === 'wait' ? 'CHECKING' : 'LIMITED',
    },
    { label: 'SERVER STATUS', tone: server, value: server === 'ok' ? 'CONNECTED' : server === 'wait' ? 'CHECKING' : 'OFFLINE' },
    { label: 'NETWORK', tone: online ? 'ok' : 'bad', value: online ? 'ONLINE' : 'NO INTERNET' },
    { label: 'AI ENGINE', tone: ai.tone, value: engine === 'checking' ? 'CHECKING' : ai.value },
    {
      label: 'LIVE SEARCH',
      tone: health?.liveSearch && server === 'ok' ? 'ok' : server === 'wait' ? 'wait' : 'bad',
      value: health?.liveSearch && server === 'ok' ? 'READY' : server === 'wait' ? 'CHECKING' : 'OFF',
    },
  ];
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
      <header className="shield-home__topbar">
        <button
          type="button"
          className="hud-panel hud-welcome"
          onClick={() =>
            isAuthenticated(authUser)
              ? requireAuth(() => openUserRoom())
              : startSession()
          }
          aria-label={isAuthenticated(authUser) ? 'Open your user room' : 'Enter SG16'}
        >
          <UserRound size={21} />
          <span>
            {isAuthenticated(authUser) ? `WELCOME, ${displayName}` : 'ENTER SG16'}
          </span>
        </button>

        <div className="hud-actions">
          <button
            className="hud-icon"
            type="button"
            onClick={() => togglePilot()}
            aria-label="Your reminders"
          >
            <Bell size={20} />
          </button>
          <button className="hud-logout" type="button" onClick={goToPublicHome} aria-label="Public homepage">
            <Globe size={19} />
            <span>HOMEPAGE</span>
          </button>
        </div>
      </header>

      <div className="shield-home__stage">
        <div className="circuit circuit--left" />
        <div className="circuit circuit--right" />

        {shields.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`shield-node shield-node--${item.className}${
                item.featured ? ' shield-node--featured' : ''
              }`}
              onClick={() => openShield(item)}
              aria-label={item.label}
            >
              <span className="shield-node__neon-aura" aria-hidden="true" />
              <img
                src={item.logo}
                alt={item.label}
                className="shield-node__logo"
                draggable={false}
                loading="eager"
              />
              <span className="shield-node__neon-tag">{item.label}</span>
            </button>
          ))}

        <div className="shield-clock" aria-live="polite">
          <div className="shield-clock__time">{formatTime(now)}</div>
          <div className="shield-clock__date">{formatDate(now)}</div>
        </div>
      </div>

      <footer className="shield-status">
        {status.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>
              <i className={item.tone} /> {item.value}
            </strong>
          </div>
        ))}
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

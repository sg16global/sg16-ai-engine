import { ArrowLeft, Globe, Lock } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { canAccessWorkspace } from '../../core/access';
import { mainNavItems, utilityNavItems } from '../../config/navConfig';
import { useEngineStatus } from '../../lib/apiStatus';
import { Sg16Logo } from '../ui/Sg16Logo';
import type { WorkspaceType } from '../../core/types';

/** Workspace side panel — shown after leaving Home (working modules). */
export const Sidebar = ({ onNavSelect }: { onNavSelect?: () => void }) => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const openHelp = useAppStore((s) => s.openHelp);
  const openPricing = useAppStore((s) => s.openPricing);
  const openStaging = useAppStore((s) => s.openStaging);
  const goBack = useAppStore((s) => s.goBack);
  const goToPublicHome = useAppStore((s) => s.goToPublicHome);
  const engineStatus = useEngineStatus();
  const online = engineStatus === 'checking' ? null : engineStatus === 'online';

  const openBottom = (id: WorkspaceType) => {
    if (id === 'help') openHelp('overview');
    else setWorkspace(id);
    onNavSelect?.();
  };

  const goWorkspace = (id: WorkspaceType) => {
    setWorkspace(id);
    onNavSelect?.();
  };

  const isLocked = (id: string) => {
    const item = mainNavItems.find((m) => m.id === id);
    if (!item?.premium) return false;
    return !canAccessWorkspace(id as WorkspaceType, subscription, authUser);
  };

  return (
    <aside className="flex w-full sg16-sidebar flex-col shrink-0 h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Sg16Logo className="w-11 h-11 rounded-xl shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-sm tracking-tight leading-tight text-white truncate">
              SG16 AI ENGINE
            </div>
            <div className="text-[10px] text-white/70 mt-0.5">5 shields</div>
          </div>
        </div>
      </div>

      <div className="px-2.5 pt-2.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            goBack();
            onNavSelect?.();
          }}
          className="sg16-nav-pill"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={() => {
            goToPublicHome();
            onNavSelect?.();
          }}
          className="sg16-nav-pill"
          title="Public homepage"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>Homepage</span>
        </button>
      </div>

      <div className="flex-1 p-2.5 space-y-1 overflow-auto">
        <p className="px-2.5 pt-1 pb-1 text-[10px] uppercase tracking-[0.16em] text-white/45">Menu</p>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentWorkspace === item.id;
          const locked = isLocked(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goWorkspace(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                isActive
                  ? 'sg16-nav-active'
                  : locked
                    ? 'text-white/45 hover:bg-white/[0.03]'
                    : 'text-white/85 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {locked && <Lock className="w-3.5 h-3.5 text-amber-200/80" />}
            </button>
          );
        })}

        <div className="pt-3 mt-2 border-t border-white/10 space-y-1">
          <p className="px-2.5 pt-1 pb-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
            Account
          </p>
          {utilityNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentWorkspace === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openBottom(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'sg16-nav-active' : 'text-white/75 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-white/60 px-1">
          <span>v1.0.0</span>
          <span
            className={`flex items-center gap-1.5 ${
              online === false ? 'text-[#FFB3BE]' : online ? 'text-emerald-300' : 'text-yellow-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                online === false
                  ? 'bg-[#FF8A9B]'
                  : online
                    ? 'bg-emerald-300 animate-pulse'
                    : 'bg-yellow-300 animate-pulse'
              }`}
            />
            {online === null ? 'Checking…' : online ? 'Online' : 'Offline'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            openStaging();
            onNavSelect?.();
          }}
          className="w-full text-left rounded-xl bg-gradient-to-r from-[#FF168D]/20 to-[#FF5CB8]/10 hover:from-[#FF168D]/30 hover:to-[#FF5CB8]/20 border border-[#FF168D]/35 p-2.5 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Staging Lab</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF168D]/30 text-[#FF5CB8] font-mono font-bold">24/7 AI</span>
          </div>
          <p className="text-[10px] text-white/60 mt-1">Next-gen design & automated support</p>
        </button>

        <button
          type="button"
          onClick={() => {
            openPricing();
            onNavSelect?.();
          }}
          className="w-full text-left rounded-xl bg-black/30 hover:bg-black/45 border border-white/10 p-3 transition"
        >
          <div className="text-xs font-semibold text-white">Plans from $0/mo</div>
          <p className="text-[10px] text-white/55 mt-1 leading-relaxed">Free · Student $4 · Pro $10</p>
          <span className="inline-flex mt-2 text-[11px] font-semibold text-white/90">See pricing →</span>
        </button>
      </div>
    </aside>
  );
};

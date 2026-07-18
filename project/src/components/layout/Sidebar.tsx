import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { canAccessWorkspace } from '../../core/access';
import { mainNavItems, utilityNavItems } from '../../config/navConfig';
import { checkEngineHealth } from '../../lib/apiStatus';
import { Sg16Logo } from '../ui/Sg16Logo';
import type { WorkspaceType } from '../../core/types';

export const Sidebar = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const openHelp = useAppStore((s) => s.openHelp);
  const openPricing = useAppStore((s) => s.openPricing);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => checkEngineHealth().then(setOnline);
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const openBottom = (id: WorkspaceType) => {
    if (id === 'help') openHelp('overview');
    else setWorkspace(id);
  };

  const isLocked = (id: string) => {
    const item = mainNavItems.find((m) => m.id === id);
    if (!item?.premium) return false;
    return !canAccessWorkspace(id as WorkspaceType, subscription, authUser);
  };

  return (
    <aside className="hidden lg:flex w-72 bg-[#0a0612]/95 border-r border-violet-500/20 flex-col shrink-0 h-full">
      <div className="p-5 border-b border-violet-500/20">
        <div className="flex items-center gap-3">
          <Sg16Logo className="w-12 h-12 rounded-xl" glow />
          <div>
            <div className="font-bold text-sm tracking-tight leading-tight">SG16 AI ENGINE</div>
            <div className="text-[10px] text-violet-300 mt-0.5">4 services · worldwide</div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-0.5 overflow-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentWorkspace === item.id;
          const locked = isLocked(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setWorkspace(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                isActive
                  ? 'bg-violet-500/15 text-violet-200 border border-violet-400/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                  : locked
                    ? 'hover:bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent'
                    : 'hover:bg-violet-500/5 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {locked && <Lock className="w-3.5 h-3.5 text-amber-400/80" />}
            </button>
          );
        })}

        <div className="pt-4 mt-2 border-t border-white/5 space-y-0.5">
          {utilityNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentWorkspace === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openBottom(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>SG16 AI Engine v1.0.0</span>
          <span
            className={`flex items-center gap-1.5 ${
              online === false ? 'text-red-400' : online ? 'text-emerald-400' : 'text-yellow-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                online === false ? 'bg-red-400' : online ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
              }`}
            />
            {online === null ? 'Checking...' : online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/25 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span>👑</span>
            <span className="font-semibold">Plans from $0/mo</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Free · Student $4 · Pro $10
          </p>
          <button
            type="button"
            onClick={openPricing}
            className="block w-full text-center bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-xs font-medium transition"
          >
            See pricing →
          </button>
        </div>
      </div>
    </aside>
  );
};

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
    <aside className="hidden lg:flex w-72 bg-[#050307]/95 border-r border-[#2a1218] flex-col shrink-0 h-full">
      <div className="p-5 border-b border-[#2a1218]">
        <div className="flex items-center gap-3">
          <Sg16Logo className="w-12 h-12 rounded-xl" glow />
          <div>
            <div className="font-bold text-sm tracking-tight leading-tight text-white">SG16 AI ENGINE</div>
            <div className="text-[10px] text-[#FF2E2E]/90 mt-0.5">4 services · worldwide</div>
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-sm ${
                isActive
                  ? 'bg-[#FF2E2E]/12 text-[#FF8A8A] border border-[#FF2E2E]/35 shadow-[0_0_20px_rgba(255,46,46,0.12)]'
                  : locked
                    ? 'hover:bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent'
                    : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {locked && <Lock className="w-3.5 h-3.5 text-amber-400/80" />}
            </button>
          );
        })}

        <div className="pt-4 mt-2 border-t border-[#2a1218] space-y-0.5">
          {utilityNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentWorkspace === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openBottom(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all ${
                  isActive
                    ? 'bg-[#FF2E2E]/10 text-[#FF8A8A] border border-[#FF2E2E]/30'
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

      <div className="px-4 py-3 border-t border-[#2a1218]">
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

        <div className="bg-[#10080e] border border-[#4a1a28] rounded-2xl p-3 shadow-[0_0_24px_rgba(255,46,46,0.08)]">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span className="text-[#FF2E2E]">◆</span>
            <span className="font-semibold text-white">Plans from $0/mo</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Free · Student $4 · Pro $10
          </p>
          <button
            type="button"
            onClick={openPricing}
            className="block w-full text-center bg-[#FF2E2E] hover:bg-[#FF5C5C] text-white py-2.5 rounded-xl text-xs font-semibold transition shadow-[0_0_16px_rgba(255,46,46,0.25)]"
          >
            See pricing →
          </button>
        </div>
      </div>
    </aside>
  );
};

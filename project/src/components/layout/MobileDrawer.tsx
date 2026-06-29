import { useEffect } from 'react';
import { X, Lock } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { canAccessWorkspace } from '../../core/access';
import { mainNavItems, utilityNavItems } from '../../config/navConfig';
import { Sg16Logo } from '../ui/Sg16Logo';
import type { WorkspaceType } from '../../core/types';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const openHelp = useAppStore((s) => s.openHelp);
  const openPricing = useAppStore((s) => s.openPricing);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navigate = (id: WorkspaceType) => {
    if (id === 'help') openHelp('overview');
    else setWorkspace(id);
    onClose();
  };

  const isLocked = (id: string) => {
    const item = mainNavItems.find((m) => m.id === id);
    if (!item?.premium) return false;
    return !canAccessWorkspace(id as WorkspaceType, subscription, authUser);
  };

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />

      <aside className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] bg-zinc-950 border-r border-white/10 flex flex-col shadow-2xl animate-slide-in-left">
        <div className="flex items-center justify-between p-4 border-b border-white/10 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <Sg16Logo className="w-10 h-10 rounded-xl" />
            <div>
              <div className="font-bold text-sm">SG16 AI ENGINE</div>
              <div className="text-[10px] text-emerald-400">SaifTech Global</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/10" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = currentWorkspace === item.id;
            const locked = isLocked(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {locked && <Lock className="w-3.5 h-3.5 text-amber-400/80" />}
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-white/5 space-y-0.5">
            {utilityNavItems.map((item) => {
              const Icon = item.icon;
              const active = currentWorkspace === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                    active
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

        <div className="p-4 border-t border-white/10 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              openPricing();
              onClose();
            }}
            className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-xl text-sm font-medium"
          >
            View pricing plans
          </button>
        </div>
      </aside>
    </div>
  );
}

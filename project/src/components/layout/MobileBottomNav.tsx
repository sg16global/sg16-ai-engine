import { useAppStore } from '../../core/appState';
import { mobileBottomNavItems } from '../../config/navConfig';
import type { WorkspaceType } from '../../core/types';

export function MobileBottomNav() {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  const isActive = (id: WorkspaceType) => {
    if (id === 'pricing') {
      return currentWorkspace === 'pricing' || currentWorkspace === 'student-verify';
    }
    return currentWorkspace === id;
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-16 px-0.5 max-w-lg mx-auto">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setWorkspace(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 transition touch-target ${
                active ? 'text-emerald-400' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.id === 'pricing' && !active ? 'text-purple-400/80' : ''}`} />
              <span className="text-[10px] font-medium truncate max-w-full px-0.5">{item.label}</span>
              {active && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-emerald-400" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

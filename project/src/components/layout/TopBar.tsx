import { Bell, Moon, Crown, GraduationCap, Menu, LogOut, Home } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { isAuthenticated, isStudentVerified } from '../../core/access';
import { planLabel } from '../../core/plans';
import { SG16_BRAND } from '../../core/branding';
import { Sg16Logo } from '../ui/Sg16Logo';

const titles: Record<string, string> = {
  home: 'SG16 AI Engine',
  history: 'Chat History',
  settings: 'Settings',
  help: 'Help Center',
  pricing: 'Pricing',
  'student-verify': 'Student ID',
  coding: 'Coding Hub',
  developer: 'SG16 Personal Developer',
  image: 'Image Studio',
  document: 'Document Lab',
  general: SG16_BRAND.chatName,
  voice: 'Voice AI',
  translate: 'Translate',
  memory: 'Memory Vault',
  'student-shield': 'Student Shield',
  market: 'Market Shield',
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const launchFree = useAppStore((s) => s.launchFree);
  const settings = useAppStore((s) => s.settings);
  const openHelp = useAppStore((s) => s.openHelp);
  const openPricing = useAppStore((s) => s.openPricing);
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const logout = useAppStore((s) => s.logout);
  const goToHome = useAppStore((s) => s.goToHome);

  const title = titles[currentWorkspace] ?? `${currentWorkspace.replace('-', ' ')} Workspace`;

  const planBadge = (compact = false) => {
    if (launchFree || authUser?.launchFree) {
      return (
        <span className="text-xs bg-[#00ff8b]/12 border border-[#00ff8b]/30 text-[#00ff8b] px-2 py-1 rounded-lg whitespace-nowrap">
          Launch · Full access
        </span>
      );
    }
    if (authUser?.trialActive) {
      return (
        <span className="text-xs bg-[#8b5cf6]/15 border border-[#8b5cf6]/35 text-[#c4b5fd] px-2 py-1 rounded-lg">
          Trial · {authUser.trialDaysRemaining}d left
        </span>
      );
    }
    if (subscription.plan === 'pro') {
      return (
        <button
          type="button"
          onClick={openPricing}
          className="flex items-center gap-1.5 text-xs bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#c4b5fd] px-2 py-1 rounded-lg hover:bg-[#8b5cf6]/25 transition"
        >
          <Crown className="w-3.5 h-3.5" />
          {!compact && <span className="hidden sm:inline">Pro Premium</span>}
        </button>
      );
    }
    if (subscription.plan === 'student' && isStudentVerified(subscription)) {
      return (
        <button
          type="button"
          onClick={openPricing}
          className="flex items-center gap-1.5 text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/25 transition"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {!compact && <span className="hidden sm:inline">Student</span>}
        </button>
      );
    }
    if (subscription.plan === 'student') {
      return (
        <button
          type="button"
          onClick={openPricing}
          className="text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-1 rounded-lg hover:bg-amber-500/25 transition"
        >
          Verify
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={openPricing}
        className="text-xs bg-zinc-800 border border-white/10 text-gray-400 px-2 py-1 rounded-lg hover:border-[#FF2E2E]/30 hover:text-white transition"
      >
        {compact ? 'Free' : planLabel(subscription.plan)}
      </button>
    );
  };

  return (
    <header className="h-14 lg:h-16 border-b border-white/10 bg-[#08080e]/90 backdrop-blur-xl flex items-center gap-2 px-3 sm:px-6 z-50 shrink-0 pt-[env(safe-area-inset-top)] lg:pt-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-white/10 shrink-0 touch-target"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0 justify-center lg:justify-start">
        {currentWorkspace !== 'home' && (
          <button
            type="button"
            onClick={goToHome}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#00ff8b] border border-[#00ff8b]/35 bg-[#00ff8b]/10 hover:bg-[#00ff8b]/20 px-2.5 py-1.5 rounded-lg shrink-0"
            title="Back to Shield Home"
          >
            <Home className="w-3.5 h-3.5" />
            Shields
          </button>
        )}
        <Sg16Logo className="w-8 h-8 lg:hidden shrink-0" />
          <div className="min-w-0 text-center lg:text-left flex-1">
          <div className="text-sm lg:text-lg font-semibold truncate leading-tight">{title}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {planBadge(true)}

        <button
          type="button"
          onClick={() => document.documentElement.classList.toggle('light-mode')}
          className="hidden md:block p-2 hover:bg-white/10 rounded-xl opacity-50 cursor-not-allowed"
          title="Dark mode (default)"
        >
          <Moon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => openHelp('overview')}
          className="p-2 hover:bg-white/10 rounded-xl"
          title="Notifications & updates"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium truncate max-w-[8rem]">
              {isAuthenticated(authUser) ? authUser!.name : settings.displayName}
            </div>
            <div className="text-xs text-[#00ff8b] flex items-center gap-1 justify-end">
              <span className="w-2 h-2 bg-[#00ff8b] rounded-full inline-block" />
              {isAuthenticated(authUser) ? 'Signed in' : 'Guest'}
            </div>
          </div>
          {isAuthenticated(authUser) ? (
            <button
              type="button"
              onClick={logout}
              className="relative shrink-0 rounded-xl sm:rounded-2xl ring-2 ring-transparent hover:ring-[#FF2E2E]/40 transition focus:outline-none focus-visible:ring-[#FF2E2E]/60"
              title="Sign out"
              aria-label="Sign out"
            >
              {authUser?.picture ? (
                <img
                  src={authUser.picture}
                  alt=""
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl object-cover"
                />
              ) : (
                <span className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#FF2E2E] to-[#A30000] rounded-xl sm:rounded-2xl flex items-center justify-center text-white">
                  <LogOut className="w-4 h-4" />
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#FF2E2E] to-[#A30000] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-xs"
              title="Sign in"
            >
              {settings.displayName.slice(0, 2).toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

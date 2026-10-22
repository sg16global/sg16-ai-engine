import { useState } from 'react';
import { CalendarClock, Check, Crown, GraduationCap, Loader2 } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { verificationStatusLabel } from '../../core/access';
import { ALL_SHIELDS, PASSES, PASS_SUMMARY, perDay, planLabel, type PassDefinition } from '../../core/plans';
import { Sg16Logo } from '../ui/Sg16Logo';

interface PricingPanelProps {
  compact?: boolean;
}

export function PricingPanel({ compact = false }: PricingPanelProps) {
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);
  const openLaunchNotice = useAppStore((s) => s.openLaunchNotice);
  const startCheckout = useAppStore((s) => s.startCheckout);
  const openStudentVerify = useAppStore((s) => s.openStudentVerify);
  const openPricing = useAppStore((s) => s.openPricing);
  const requireAuth = useAppStore((s) => s.requireAuth);
  const [checkoutPass, setCheckoutPass] = useState<PassDefinition['id'] | null>(null);

  const handleSelect = async (pass: PassDefinition) => {
    if (launchFree) {
      openLaunchNotice();
      if (compact) openPricing();
      return;
    }

    const runCheckout = async () => {
      setCheckoutPass(pass.id);
      try {
        if (pass.tier === 'student' && subscription.plan === 'student' && subscription.billingActive) {
          if (compact) openPricing();
          openStudentVerify();
          return;
        }
        await startCheckout(pass.tier);
        if (compact) openPricing();
      } finally {
        setCheckoutPass(null);
      }
    };

    requireAuth(() => {
      void runCheckout();
    });
  };

  return (
    <div className={compact ? '' : 'p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto'}>
      <div className={`text-center ${compact ? 'mb-5 sm:mb-6' : 'mb-8 lg:mb-10'}`}>
        <Sg16Logo
          className={`mx-auto mb-3 object-contain ${compact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-20 h-20 sm:w-24 sm:h-24'}`}
          glow
        />
        <h2 className={`font-bold mb-2 ${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`}>
          {compact ? 'SG16 Passes' : 'SG16 AI Engine Passes'}
        </h2>
        <p className="text-emerald-400/90 text-sm font-medium">{PASS_SUMMARY}</p>
        <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-2xl mx-auto">
          Every pass unlocks all 5 shields: {ALL_SHIELDS.join(', ')}. No subscription — buy again only when you need it.
        </p>
        {launchFree && <p className="text-gray-500 text-xs sm:text-sm mt-2 max-w-2xl mx-auto">{launchMessage}</p>}
        <p className="text-[11px] text-gray-500 mt-2">
          {launchFree ? 'Checkout opens after launch — prices shown for reference' : 'Secure checkout activating soon on sg16engine.com'}
        </p>
        {!compact && authUser && (
          <p className="text-xs text-gray-400 mt-3">
            Your pass: <strong className="text-white">{launchFree ? 'Free during launch' : planLabel(subscription.plan)}</strong>
            {subscription.plan === 'student' && (
              <> · Student ID: {verificationStatusLabel(subscription.studentVerification.status)}</>
            )}
          </p>
        )}
        {error && <p className="text-xs text-[#FF526B] mt-3 max-w-md mx-auto">{error}</p>}
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'lg:grid-cols-3' : 'lg:grid-cols-5'} gap-4`}>
        {PASSES.map((pass) => {
          const Icon = pass.studentOnly ? GraduationCap : pass.highlighted ? Crown : CalendarClock;
          const isLoading = loading && checkoutPass === pass.id;
          return (
            <div
              key={pass.id}
              className={`relative rounded-2xl border p-5 flex flex-col ${
                pass.highlighted
                  ? 'border-[#FF168D]/50 bg-gradient-to-b from-[#191321]/30 to-[#0A0A12]/80 shadow-lg shadow-[#FF168D]/10'
                  : 'border-white/10 bg-[#0A0A12]/60'
              }`}
            >
              {pass.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider bg-[#B91669] px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                  {pass.badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm">{pass.name}</h3>
                  <p className="text-2xl font-bold text-emerald-400 leading-tight">{pass.price}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">{pass.description}</p>
              <p className="text-[11px] text-gray-500 mt-1 mb-3">{perDay(pass)}</p>
              {!compact && (
                <ul className="space-y-1.5 mb-4 flex-1">
                  <li className="flex gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> All 5 shields
                  </li>
                  <li className="flex gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> AI chat, code check & live preview
                  </li>
                  <li className="flex gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Student, Health & Market tools
                  </li>
                  {pass.studentOnly && (
                    <li className="flex gap-2 text-xs text-amber-200/90">
                      <GraduationCap className="w-4 h-4 shrink-0" /> Needs a valid Student ID check
                    </li>
                  )}
                </ul>
              )}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleSelect(pass)}
                className={`mt-auto w-full py-2.5 rounded-xl text-sm font-medium transition touch-target flex items-center justify-center gap-2 ${
                  pass.highlighted
                    ? 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold disabled:opacity-50'
                    : 'bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-50'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {launchFree ? 'Included during launch' : `Get ${pass.name} — ${pass.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Check, Crown, GraduationCap, Loader2 } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { verificationStatusLabel } from '../../core/access';
import { PLANS, planLabel } from '../../core/plans';
import { SG16_BRAND } from '../../core/branding';
import { Sg16Logo } from '../ui/Sg16Logo';
import type { PlanTier } from '../../core/types';

const icons: Record<PlanTier, typeof Crown> = {
  free: Check,
  student: GraduationCap,
  pro: Crown,
};

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
  const selectPlan = useAppStore((s) => s.selectPlan);
  const startCheckout = useAppStore((s) => s.startCheckout);
  const openStudentVerify = useAppStore((s) => s.openStudentVerify);
  const openPricing = useAppStore((s) => s.openPricing);
  const requireAuth = useAppStore((s) => s.requireAuth);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanTier | null>(null);

  const handleSelect = async (plan: PlanTier) => {
    if (plan === 'free') {
      selectPlan('free');
      if (compact) openPricing();
      return;
    }

    if (launchFree) {
      if (plan === 'student' || plan === 'pro') {
        openLaunchNotice();
      }
      if (compact) openPricing();
      return;
    }

    const runCheckout = async () => {
      setCheckoutPlan(plan);
      try {
        if (plan === 'student') {
          if (subscription.plan === 'student' && subscription.billingActive) {
            if (compact) openPricing();
            openStudentVerify();
            return;
          }
          await startCheckout('student');
          if (compact) openPricing();
          return;
        }

        if (plan === 'pro') {
          await startCheckout('pro');
          if (compact) openPricing();
        }
      } finally {
        setCheckoutPlan(null);
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
          {compact ? 'SG16 Plans & Pricing' : 'SG16 AI Engine Pricing'}
        </h2>
        <p className="text-emerald-400/90 text-sm font-medium">
          Free $0 · Student Shield $4/mo · Pro Premium $10/mo
        </p>
        <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl mx-auto">
          {launchFree
            ? launchMessage
            : compact
              ? `All plans include ${SG16_BRAND.chatName}. Premium unlocks every workspace.`
              : `Choose the plan that fits you — ${SG16_BRAND.chatName} on Free, full platform on Student & Pro.`}
        </p>
        <p className="text-[11px] text-gray-500 mt-2">
          {launchFree
            ? 'Checkout opens after launch — pricing shown for reference'
            : 'Secure checkout activating soon on sg16engine.com'}
        </p>
        {!compact && (
          <p className="text-xs text-gray-400 mt-3">
            Current plan: <strong className="text-white">{planLabel(subscription.plan)}</strong>
            {subscription.plan === 'student' && (
              <> · Verification: {verificationStatusLabel(subscription.studentVerification.status)}</>
            )}
            {!authUser && <> · Sign in to subscribe</>}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-400 mt-3 max-w-md mx-auto">{error}</p>
        )}
      </div>

      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4 sm:gap-5`}>
        {PLANS.map((plan) => {
          const Icon = icons[plan.id];
          const isCurrent = subscription.plan === plan.id && (plan.id === 'free' || subscription.billingActive);
          const active =
            plan.id === 'pro' ||
            (plan.id === 'student' && subscription.studentVerification.status === 'approved');
          const isLoading = loading && checkoutPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-rose-500/50 bg-gradient-to-b from-rose-950/30 to-zinc-900/80 shadow-lg shadow-rose-500/10'
                  : 'border-white/10 bg-zinc-900/60'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider bg-rose-600 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base">{plan.name}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400 leading-tight">
                    {plan.price}
                    <span className="text-sm text-gray-500 font-normal">{plan.priceNote}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-400 mb-3">{plan.description}</p>

              {!compact && (
                <>
                  <ul className="space-y-2 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs text-gray-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.limitations && plan.limitations.length > 0 && (
                    <ul className="space-y-1.5 mb-6 border-t border-white/5 pt-4">
                      {plan.limitations.map((l) => (
                        <li key={l} className="text-[11px] text-gray-500">• {l}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {compact && (
                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.slice(0, 2).map((f) => (
                    <li key={f} className="flex gap-2 text-[11px] text-gray-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                disabled={
                  (!compact && isCurrent && plan.id !== 'student') ||
                  isLoading
                }
                onClick={() => void handleSelect(plan.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition touch-target flex items-center justify-center gap-2 ${
                  plan.highlighted
                    ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-50'
                    : 'bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-50'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {launchFree && plan.id !== 'free'
                  ? 'Included during launch'
                  : compact
                  ? isCurrent && plan.id === 'free'
                    ? 'Current — Free'
                    : isCurrent && plan.id === 'pro'
                      ? 'Active — Pro'
                      : isCurrent && plan.id === 'student' && active
                        ? 'Active — Student'
                        : plan.id === 'pro' || plan.id === 'student'
                          ? `Subscribe ${plan.price}`
                          : plan.cta
                  : isCurrent && plan.id === 'free'
                    ? 'Current plan'
                    : isCurrent && plan.id === 'pro'
                      ? 'Active — Pro Premium'
                      : isCurrent && plan.id === 'student' && active
                        ? 'Active — Verified'
                        : isCurrent && plan.id === 'student'
                          ? 'Complete verification'
                          : plan.id === 'pro' || plan.id === 'student'
                            ? `Subscribe ${plan.price}`
                            : plan.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

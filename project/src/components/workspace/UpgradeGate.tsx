import { Check, Lock, Sparkles } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { accessDeniedMessage, isAuthenticated, isLaunchPeriod, trialDaysRemaining } from '../../core/access';
import { SG16_BRAND } from '../../core/branding';
import { PLANS } from '../../core/plans';
import type { WorkspaceId } from '../../core/types';

interface UpgradeGateProps {
  workspaceId: WorkspaceId;
}

export function UpgradeGate({ workspaceId }: UpgradeGateProps) {
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const openPricing = useAppStore((s) => s.openPricing);
  const openStudentVerify = useAppStore((s) => s.openStudentVerify);
  const openLoginModal = useAppStore((s) => s.openLoginModal);

  const launchFree = useAppStore((s) => s.launchFree);
  const message = accessDeniedMessage(workspaceId, subscription, authUser);
  const isStudentFlow = subscription.plan === 'student';
  const trialEnded =
    isAuthenticated(authUser) && !isLaunchPeriod(authUser) && !launchFree && trialDaysRemaining(authUser?.signupDate) === 0;

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-zinc-900/80 border border-white/10 rounded-2xl p-5 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Lock className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {!isAuthenticated(authUser) ? 'Sign in required' : trialEnded ? 'Trial ended' : 'Premium workspace locked'}
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{message}</p>

        {!isAuthenticated(authUser) ? (
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Login with Google
          </button>
        ) : (
          <>
            <div className="space-y-2 mb-6 text-left">
              {PLANS.filter((p) => p.id !== 'free').map((plan) => (
                <div key={plan.id} className="flex items-start gap-2 text-xs text-gray-500">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-300">{plan.name}</strong> — {plan.price}
                    {plan.priceNote}: {plan.description}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isStudentFlow ? (
                <button
                  type="button"
                  onClick={openStudentVerify}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" /> Verify Student ID
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openPricing}
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  View pricing
                </button>
              )}
              <button
                type="button"
                onClick={() => useAppStore.getState().setWorkspace('general')}
                className="px-5 py-2.5 rounded-xl text-sm border border-white/10 hover:border-emerald-500/30 text-gray-300"
              >
                Continue with {SG16_BRAND.chatName} (Free)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

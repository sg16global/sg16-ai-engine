import { Check, Lock, Sparkles } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { accessDeniedMessage, isAuthenticated, isLaunchPeriod, trialDaysRemaining } from '../../core/access';
import { PASSES, perDay } from '../../core/plans';
import type { WorkspaceId } from '../../core/types';

interface UpgradeGateProps {
  workspaceId: WorkspaceId;
}

export function UpgradeGate({ workspaceId }: UpgradeGateProps) {
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const openPricing = useAppStore((s) => s.openPricing);
  const openStudentVerify = useAppStore((s) => s.openStudentVerify);
  const startSession = useAppStore((s) => s.startSession);

  const launchFree = useAppStore((s) => s.launchFree);
  const message = accessDeniedMessage(workspaceId, subscription, authUser);
  const isStudentFlow = subscription.plan === 'student';
  const trialEnded =
    isAuthenticated(authUser) && !isLaunchPeriod(authUser) && !launchFree && trialDaysRemaining(authUser?.signupDate) === 0;

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-5 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Lock className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {!isAuthenticated(authUser) ? 'Enter SG16' : trialEnded ? 'Trial ended' : 'A pass is needed'}
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{message}</p>

        {!isAuthenticated(authUser) ? (
          <button
            type="button"
            onClick={() => startSession()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Enter SG16
          </button>
        ) : (
          <>
            <div className="space-y-2 mb-6 text-left">
              {PASSES.map((pass) => (
                <div key={pass.id} className="flex items-start gap-2 text-xs text-gray-500">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-300">{pass.name}</strong> — {pass.price} ({perDay(pass)}): {pass.description}
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
                  className="inline-flex items-center justify-center gap-2 bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold hover:shadow-[0_0_18px_rgba(255,22,141,0.4)] px-5 py-2.5 rounded-xl text-sm transition"
                >
                  See passes
                </button>
              )}
              <button
                type="button"
                onClick={() => useAppStore.getState().setWorkspace('home')}
                className="px-5 py-2.5 rounded-xl text-sm border border-white/10 hover:border-emerald-500/30 text-gray-300"
              >
                Back to Shields
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

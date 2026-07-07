import type { AuthUser } from './types';
import { trialFromSignupDate } from './trial';

/** Apply live trial flags from raw signup timestamp — instant activation, no polling. */
export function enrichAuthUser(user: AuthUser): AuthUser {
  if (user.launchFree) {
    return { ...user, trialActive: false, trialDaysRemaining: 0 };
  }
  const trial = trialFromSignupDate(user.signupDate);
  return {
    ...user,
    trialActive: trial.trialActive,
    trialDaysRemaining: trial.trialDaysRemaining,
  };
}

export function isTrialFullyActive(authUser: AuthUser | null): boolean {
  if (!authUser?.signupDate) return false;
  return trialFromSignupDate(authUser.signupDate).trialActive;
}

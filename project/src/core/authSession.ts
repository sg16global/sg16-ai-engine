import type { AuthUser } from './types';
import { trialFromSignupDate } from './trial';

/** Apply live trial flags from raw signup timestamp — instant activation, no polling. */
export function enrichAuthUser(user: AuthUser): AuthUser {
  const signupDate = user.signupDate && user.signupDate > 0 ? user.signupDate : Date.now();
  if (user.launchFree) {
    return { ...user, signupDate, trialActive: true, trialDaysRemaining: 30 };
  }
  const trial = trialFromSignupDate(signupDate);
  return {
    ...user,
    signupDate,
    trialActive: trial.trialActive,
    trialDaysRemaining: trial.trialDaysRemaining,
  };
}

export function isTrialFullyActive(authUser: AuthUser | null): boolean {
  if (!authUser?.signupDate) return false;
  return trialFromSignupDate(authUser.signupDate).trialActive;
}

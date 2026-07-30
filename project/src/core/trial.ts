export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/** Always free forever once signed in. */
export const ALWAYS_FREE_WORKSPACES = ['general', 'health'] as const;

/** Locked after the 3-day trial (unless paid). */
export const HEAVY_PREMIUM_WORKSPACES = ['coding'] as const;

export const OTHER_PREMIUM_WORKSPACES = ['student-shield'] as const;

export function trialIsActive(signupDate?: number | null): boolean {
  if (!signupDate) return false;
  return Date.now() - signupDate < TRIAL_DURATION_MS;
}

export function trialDaysRemaining(signupDate?: number | null): number {
  if (!signupDate) return 0;
  const remainingMs = signupDate + TRIAL_DURATION_MS - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

export function trialMsRemaining(signupDate?: number | null): number {
  if (!signupDate) return 0;
  return Math.max(0, signupDate + TRIAL_DURATION_MS - Date.now());
}

export function trialFromSignupDate(signupDate: number) {
  return {
    signupDate,
    trialActive: trialIsActive(signupDate),
    trialDaysRemaining: trialDaysRemaining(signupDate),
    trialMsRemaining: trialMsRemaining(signupDate),
  };
}

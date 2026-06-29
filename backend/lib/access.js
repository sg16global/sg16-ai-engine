export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/** Always free forever after sign-in. */
export const ALWAYS_FREE_WORKSPACES = new Set(['general', 'translate']);

/** Locked after the 3-day trial unless user has a paid plan. */
export const HEAVY_PREMIUM_WORKSPACES = new Set(['coding', 'image', 'document']);

export const OTHER_PREMIUM_WORKSPACES = new Set([
  'voice',
  'memory',
  'student-shield',
]);

export function trialIsActive(signupDate) {
  if (!signupDate) return false;
  return Date.now() - signupDate < TRIAL_DURATION_MS;
}

export function trialDaysRemaining(signupDate) {
  if (!signupDate) return 0;
  const remainingMs = signupDate + TRIAL_DURATION_MS - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

export function trialMsRemaining(signupDate) {
  if (!signupDate) return 0;
  return Math.max(0, signupDate + TRIAL_DURATION_MS - Date.now());
}

export function hasPaidAccess(planTier = 'free', studentVerified = false) {
  if (planTier === 'pro') return true;
  if (planTier === 'student' && studentVerified) return true;
  return false;
}

/**
 * Server-side workspace gate.
 * @param {string} workspaceId
 * @param {{ signupDate?: number, planTier?: string, studentVerified?: boolean }} entitlements
 */
export function serverCanAccessWorkspace(workspaceId, entitlements = {}) {
  const ws = workspaceId || 'general';
  const { signupDate, planTier = 'free', studentVerified = false } = entitlements;

  if (!signupDate) return false;
  if (hasPaidAccess(planTier, studentVerified)) return true;
  if (ALWAYS_FREE_WORKSPACES.has(ws)) return true;
  if (trialIsActive(signupDate)) return true;
  return false;
}

export function serverAccessDeniedMessage(workspaceId, signupDate) {
  if (HEAVY_PREMIUM_WORKSPACES.has(workspaceId)) {
    if (signupDate && !trialIsActive(signupDate)) {
      return 'Your 3-day full-access trial has ended. Coding Hub, Image Studio, and Document Lab require an upgrade. SG16 Chatting and Translate remain free.';
    }
    return 'Sign in with Google to unlock this workspace.';
  }
  if (trialIsActive(signupDate)) return 'This workspace is available during your trial.';
  return 'Upgrade to Student Shield or Pro Premium to use this workspace after your trial.';
}

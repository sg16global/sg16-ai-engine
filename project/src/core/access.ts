import { SG16_BRAND } from './branding';
import type { AuthUser, Subscription, WorkspaceId, WorkspaceType } from './types';
import {
  ALWAYS_FREE_WORKSPACES,
  HEAVY_PREMIUM_WORKSPACES,
  trialIsActive,
  trialDaysRemaining,
} from './trial';
import { PREMIUM_WORKSPACES } from './plans';

export function isStudentVerified(subscription: Subscription): boolean {
  return subscription.studentVerification.status === 'approved';
}

export function hasPaidAccess(subscription: Subscription): boolean {
  if (subscription.plan === 'pro') return true;
  if (subscription.plan === 'student' && isStudentVerified(subscription)) return true;
  return false;
}

export function isAuthenticated(authUser: AuthUser | null): boolean {
  return authUser != null && authUser.signupDate > 0;
}

export function canAccessWorkspace(
  workspace: WorkspaceType | WorkspaceId,
  subscription: Subscription,
  authUser: AuthUser | null,
): boolean {
  if (
    workspace === 'home' ||
    workspace === 'history' ||
    workspace === 'settings' ||
    workspace === 'help' ||
    workspace === 'pricing' ||
    workspace === 'student-verify'
  ) {
    return true;
  }

  if (!isAuthenticated(authUser)) return false;
  if (hasPaidAccess(subscription)) return true;
  if (ALWAYS_FREE_WORKSPACES.includes(workspace as (typeof ALWAYS_FREE_WORKSPACES)[number])) return true;
  if (trialIsActive(authUser!.signupDate)) return true;
  return false;
}

/** Homepage cards always look unlocked; this drives post-login locks only. */
export function showWorkspaceLocked(
  workspace: WorkspaceId,
  subscription: Subscription,
  authUser: AuthUser | null,
): boolean {
  if (!isAuthenticated(authUser)) return false;
  return !canAccessWorkspace(workspace, subscription, authUser);
}

export function workspaceRequiresPremium(workspace: WorkspaceId): boolean {
  return PREMIUM_WORKSPACES.includes(workspace);
}

export function accessDeniedMessage(
  workspace: WorkspaceId,
  subscription: Subscription,
  authUser: AuthUser | null,
): string {
  if (!isAuthenticated(authUser)) {
    return 'Sign in with Google to use SG16 AI workspaces.';
  }

  if (subscription.plan === 'student' && subscription.studentVerification.status === 'pending') {
    return 'Your Student ID verification is being reviewed.';
  }
  if (subscription.plan === 'student' && subscription.studentVerification.status === 'rejected') {
    return subscription.studentVerification.reason
      ? `Verification failed: ${subscription.studentVerification.reason}`
      : 'Student ID verification was rejected.';
  }

  if (HEAVY_PREMIUM_WORKSPACES.includes(workspace as (typeof HEAVY_PREMIUM_WORKSPACES)[number])) {
    const days = trialDaysRemaining(authUser?.signupDate);
    if (days === 0) {
      return 'Your 3-day full-access trial has ended. Coding Hub, Image Studio, and Document Lab now require an upgrade. SG16 Chatting and Translate stay free forever.';
    }
    return `${workspaceLabel(workspace)} requires an active trial or premium plan.`;
  }

  if (trialIsActive(authUser?.signupDate)) {
    return 'This workspace is included in your 3-day trial.';
  }

  return 'Upgrade to Student Shield or Pro Premium to unlock this workspace after your trial.';
}

function workspaceLabel(id: WorkspaceId): string {
  const labels: Record<WorkspaceId, string> = {
    coding: 'Coding Hub',
    image: 'Image Studio',
    document: 'Document Lab',
    general: SG16_BRAND.chatName,
    voice: 'Voice AI',
    translate: 'Translate',
    memory: 'Memory Vault',
    'student-shield': 'Student Shield',
  };
  return labels[id];
}

export function defaultSubscription(): Subscription {
  return {
    plan: 'free',
    studentVerification: { status: 'none' },
  };
}

export function verificationStatusLabel(status: import('./types').VerificationStatus): string {
  switch (status) {
    case 'approved':
      return 'Verified';
    case 'pending':
      return 'Pending review';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Not submitted';
  }
}

export { trialIsActive, trialDaysRemaining };

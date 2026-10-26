import { isStudentVerified } from '../core/access';
import type { Subscription } from '../core/types';
import { loadSubscription } from './utils';

/**
 * Billing — local only. There is no payment server in this app: passes are a
 * launch-period concept, the subscription is stored on this device, and
 * checkout is disabled until a payment provider is wired up.
 */

export interface BillingPublicConfig {
  enabled: boolean;
  provider?: string;
  environment: 'sandbox' | 'production';
  clientToken: string;
  prices: {
    student: string;
    pro: string;
  };
  launchFree?: boolean;
  checkoutEnabled?: boolean;
  launchMessage?: string;
  contactEmail?: string;
  paymentsPending?: boolean;
  paymentsMessage?: string;
}

/** @deprecated Use BillingPublicConfig — kept for older imports */
export type PaddlePublicConfig = BillingPublicConfig;

export interface BillingEntitlementsResponse {
  entitlements: {
    planTier: Subscription['plan'];
    studentVerified: boolean;
    subscription: Subscription & {
      subscriptionStatus: string | null;
      paddleCustomerId: string | null;
      paddleSubscriptionId: string | null;
      billingActive: boolean;
    };
  };
  subscription: Subscription & {
    subscriptionStatus: string | null;
    paddleCustomerId: string | null;
    paddleSubscriptionId: string | null;
    billingActive: boolean;
  };
}

const LAUNCH_CONFIG_KEY = 'sg16_launch_config_v1';

const DEFAULT_LAUNCH_MESSAGE =
  'Launch period — all features are free unlimited. We will notify you in the app before paid plans begin.';

export interface LaunchConfig {
  launchFree: boolean;
  checkoutEnabled: boolean;
  launchMessage: string;
}

export const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  launchFree: true,
  checkoutEnabled: false,
  launchMessage: DEFAULT_LAUNCH_MESSAGE,
};

/** The device's launch configuration (Admin can change it). */
export function readLaunchConfig(): LaunchConfig {
  try {
    const raw = localStorage.getItem(LAUNCH_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_LAUNCH_CONFIG };
    const parsed = JSON.parse(raw) as Partial<LaunchConfig>;
    return {
      launchFree: parsed.launchFree !== false,
      checkoutEnabled: parsed.checkoutEnabled === true,
      launchMessage: typeof parsed.launchMessage === 'string' && parsed.launchMessage ? parsed.launchMessage : DEFAULT_LAUNCH_MESSAGE,
    };
  } catch {
    return { ...DEFAULT_LAUNCH_CONFIG };
  }
}

export function saveLaunchConfig(patch: Partial<LaunchConfig>): LaunchConfig {
  const next = { ...readLaunchConfig(), ...patch };
  try {
    localStorage.setItem(LAUNCH_CONFIG_KEY, JSON.stringify(next));
  } catch {
    /* private mode — the in-memory defaults still apply */
  }
  return next;
}

/** Public billing config — always local; checkout is off until a provider is connected. */
export async function fetchBillingConfig(): Promise<BillingPublicConfig> {
  const config = readLaunchConfig();
  return {
    enabled: false,
    environment: 'production',
    clientToken: '',
    prices: { student: '$8', pro: '$15' },
    launchFree: config.launchFree,
    checkoutEnabled: config.checkoutEnabled,
    launchMessage: config.launchMessage,
    paymentsPending: false,
  };
}

type FullSubscription = Subscription & {
  subscriptionStatus: string | null;
  paddleCustomerId: string | null;
  paddleSubscriptionId: string | null;
  billingActive: boolean;
};

function fullSubscription(subscription: Subscription): FullSubscription {
  return {
    plan: subscription.plan,
    studentVerification: subscription.studentVerification,
    subscriptionStatus: subscription.subscriptionStatus ?? null,
    paddleCustomerId: subscription.paddleCustomerId ?? null,
    paddleSubscriptionId: subscription.paddleSubscriptionId ?? null,
    billingActive: subscription.billingActive ?? false,
  };
}

/** Entitlements for this device — read from the locally stored subscription. */
export async function fetchBillingEntitlements(): Promise<BillingEntitlementsResponse> {
  const subscription = fullSubscription(loadSubscription());
  return {
    entitlements: {
      planTier: subscription.plan,
      studentVerified: isStudentVerified(subscription),
      subscription,
    },
    subscription,
  };
}

export function subscriptionFromApi(raw: BillingEntitlementsResponse['subscription']): Subscription {
  return {
    plan: raw.plan,
    studentVerification: raw.studentVerification ?? { status: 'none' },
  };
}

import type { PlanTier, Subscription } from '../core/types';
import { authHeaders } from './authApi';

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
    planTier: PlanTier;
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

export interface CheckoutSessionResponse {
  priceId: string;
  plan: 'student' | 'pro';
  googleSub: string;
  customData: { googleSub: string };
}

export async function fetchBillingConfig(): Promise<BillingPublicConfig> {
  try {
    const res = await fetch('/api/v1/billing/config');
    const data = await res.json();
    if (res.ok) return data;
  } catch {
    // Fallback
  }
  return {
    enabled: false,
    environment: 'production',
    clientToken: '',
    prices: { student: '$0.00', pro: '$0.00' },
    launchFree: true,
    checkoutEnabled: false,
    launchMessage: 'SG16 Launch Mode — All shields, AI models, and scanners are 100% free with unlimited access.',
    contactEmail: 'support@sg16engine.com',
  };
}

export async function fetchBillingEntitlements(): Promise<BillingEntitlementsResponse> {
  try {
    const res = await fetch('/api/v1/billing/entitlements', { headers: authHeaders() });
    const data = await res.json();
    if (res.ok) return data;
  } catch {
    // Fallback
  }
  return {
    entitlements: {
      planTier: 'pro',
      studentVerified: true,
      subscription: {
        plan: 'pro',
        studentVerification: { status: 'verified' },
        subscriptionStatus: 'active',
        paddleCustomerId: null,
        paddleSubscriptionId: null,
        billingActive: true,
      },
    },
    subscription: {
      plan: 'pro',
      studentVerification: { status: 'verified' },
      subscriptionStatus: 'active',
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      billingActive: true,
    },
  };
}

export async function createCheckoutSession(plan: 'student' | 'pro'): Promise<CheckoutSessionResponse> {
  try {
    const res = await fetch('/api/v1/billing/checkout', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (res.ok) return data;
  } catch {
    // Fallback
  }
  return {
    priceId: 'pri_launch_free',
    plan,
    googleSub: 'launch-user',
    customData: { googleSub: 'launch-user' },
  };
}

export async function openBillingPortal(): Promise<string> {
  try {
    const res = await fetch('/api/v1/billing/portal', {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.ok && data.url) return data.url as string;
  } catch {
    // Fallback
  }
  return '/app?workspace=pricing';
}

export function subscriptionFromApi(raw: BillingEntitlementsResponse['subscription']): Subscription {
  return {
    plan: raw.plan,
    studentVerification: raw.studentVerification ?? { status: 'none' },
  };
}

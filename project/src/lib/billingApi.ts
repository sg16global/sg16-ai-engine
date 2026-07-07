import type { PlanTier, Subscription } from '../core/types';
import { authHeaders } from './authApi';

export interface PaddlePublicConfig {
  enabled: boolean;
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
}

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

export async function fetchBillingConfig(): Promise<PaddlePublicConfig> {
  const res = await fetch('/api/v1/billing/config');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Billing config unavailable');
  return data;
}

export async function fetchBillingEntitlements(): Promise<BillingEntitlementsResponse> {
  const res = await fetch('/api/v1/billing/entitlements', { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load billing status');
  return data;
}

export async function createCheckoutSession(plan: 'student' | 'pro'): Promise<CheckoutSessionResponse> {
  const res = await fetch('/api/v1/billing/checkout', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Checkout unavailable');
  return data;
}

export async function openBillingPortal(): Promise<string> {
  const res = await fetch('/api/v1/billing/portal', {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Billing portal unavailable');
  return data.url as string;
}

export function subscriptionFromApi(raw: BillingEntitlementsResponse['subscription']): Subscription {
  return {
    plan: raw.plan,
    studentVerification: raw.studentVerification ?? { status: 'none' },
  };
}

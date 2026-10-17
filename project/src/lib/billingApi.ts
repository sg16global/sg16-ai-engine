import type { PlanTier, Subscription } from '../core/types';
import { API_V1, apiRequest } from './apiClient';
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
  return apiRequest(`${API_V1}/billing/config`);
}

export async function fetchBillingEntitlements(): Promise<BillingEntitlementsResponse> {
  return apiRequest(`${API_V1}/billing/entitlements`, { headers: authHeaders() });
}

export async function createCheckoutSession(plan: 'student' | 'pro'): Promise<CheckoutSessionResponse> {
  return apiRequest(`${API_V1}/billing/checkout`, { method: 'POST', headers: authHeaders(), body: { plan } });
}

export async function openBillingPortal(): Promise<string> {
  const data = await apiRequest<{ url: string }>(`${API_V1}/billing/portal`, { method: 'POST', headers: authHeaders() });
  return data.url;
}

export function subscriptionFromApi(raw: BillingEntitlementsResponse['subscription']): Subscription {
  return {
    plan: raw.plan,
    studentVerification: raw.studentVerification ?? { status: 'none' },
  };
}

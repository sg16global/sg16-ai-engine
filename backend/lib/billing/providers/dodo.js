import { productIdForPlan, normalizeCheckoutPlan } from '../plans.js';

const ACTIVE = new Set(['active', 'trialing']);
const INACTIVE = new Set(['cancelled', 'expired', 'failed']);

function apiKey() {
  return process.env.DODO_PAYMENTS_API_KEY?.trim() || process.env.DODO_API_KEY?.trim() || '';
}

function webhookSecret() {
  return process.env.DODO_WEBHOOK_SECRET?.trim() || process.env.DODO_WEBHOOK_KEY?.trim() || '';
}

function environment() {
  const raw = process.env.DODO_ENVIRONMENT?.trim().toLowerCase();
  if (raw === 'live_mode' || raw === 'live' || raw === 'production') return 'live_mode';
  return 'test_mode';
}

function apiBase() {
  return environment() === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
}

function appUrl() {
  return (process.env.SG16_APP_URL?.trim() || 'https://sg16engine.com').replace(/\/+$/, '');
}

export function dodoConfigured() {
  return Boolean(apiKey() && productIdForPlan('pro'));
}

export function dodoPublicInfo() {
  return {
    id: 'dodo',
    environment: environment() === 'live_mode' ? 'production' : 'sandbox',
    configured: dodoConfigured(),
    webhookConfigured: Boolean(webhookSecret()),
  };
}

export async function dodoCreateCheckout({ plan, googleSub, email, name }) {
  const productId = productIdForPlan(plan);
  if (!apiKey()) {
    throw new Error('DODO_PAYMENTS_API_KEY is not set on the server.');
  }
  if (!productId) {
    throw new Error('DODO_PRODUCT_ID_PRO is not set — create the $4.50 subscription product in Dodo first.');
  }

  const normalizedPlan = normalizeCheckoutPlan(plan);
  const body = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: email || undefined,
      name: name || 'SG16 User',
    },
    return_url: `${appUrl()}/app?billing=success`,
    metadata: {
      google_sub: googleSub,
      plan: normalizedPlan,
      sg16_app: 'sg16-engine',
    },
  };

  const res = await fetch(`${apiBase()}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `Dodo checkout failed (${res.status})`;
    throw new Error(msg);
  }

  const checkoutUrl = data.checkout_url || data.checkoutUrl;
  if (!checkoutUrl) {
    throw new Error('Dodo did not return a checkout URL.');
  }

  return {
    checkoutUrl,
    sessionId: data.session_id || data.id || null,
    provider: 'dodo',
    plan: normalizedPlan,
  };
}

/** Standard Webhooks verification (Dodo follows standardwebhooks.com). */
export async function dodoVerifyWebhook(rawBody, headers) {
  const secret = webhookSecret();
  if (!secret) {
    throw new Error('DODO_WEBHOOK_SECRET is not configured.');
  }

  let Webhook;
  try {
    ({ Webhook } = await import('standardwebhooks'));
  } catch {
    throw new Error('standardwebhooks package missing — run npm install in backend.');
  }

  const wh = new Webhook(secret);
  const webhookHeaders = {
    'webhook-id': headers['webhook-id'] || headers['Webhook-Id'] || '',
    'webhook-signature': headers['webhook-signature'] || headers['Webhook-Signature'] || '',
    'webhook-timestamp': headers['webhook-timestamp'] || headers['Webhook-Timestamp'] || '',
  };

  wh.verify(rawBody, webhookHeaders);
  return JSON.parse(rawBody);
}

function pickGoogleSub(payload) {
  const data = payload?.data ?? payload;
  return (
    data?.metadata?.google_sub ||
    data?.customer?.metadata?.google_sub ||
    data?.subscription?.metadata?.google_sub ||
    payload?.metadata?.google_sub ||
    null
  );
}

function pickSubscriptionId(payload) {
  const data = payload?.data ?? payload;
  return (
    data?.subscription_id ||
    data?.id ||
    data?.subscription?.subscription_id ||
    data?.subscription?.id ||
    null
  );
}

function pickCustomerId(payload) {
  const data = payload?.data ?? payload;
  return data?.customer?.customer_id || data?.customer_id || data?.customer?.id || null;
}

function mapDodoStatus(eventType, dataStatus) {
  const status = String(dataStatus || '').toLowerCase();
  if (eventType === 'subscription.active' || eventType === 'subscription.renewed') return 'active';
  if (eventType === 'subscription.on_hold') return 'past_due';
  if (eventType === 'subscription.cancelled') return 'cancelled';
  if (eventType === 'subscription.expired') return 'expired';
  if (eventType === 'subscription.failed') return 'failed';
  if (ACTIVE.has(status)) return 'active';
  if (INACTIVE.has(status)) return status;
  return status || 'unknown';
}

/** Turn a Dodo webhook into SG16 Billing Room subscription update (provider-agnostic). */
export function dodoParseWebhookEvent(payload) {
  const eventType = payload?.type || payload?.event_type || '';
  const data = payload?.data ?? payload;
  const googleSub = pickGoogleSub(payload);
  const subscriptionId = pickSubscriptionId(payload);
  const customerId = pickCustomerId(payload);
  const plan =
    data?.metadata?.plan ||
    data?.customer?.metadata?.plan ||
    data?.product_id ||
    'pro';
  const status = mapDodoStatus(eventType, data?.status);

  const grantAccess =
    eventType === 'subscription.active' ||
    eventType === 'subscription.renewed' ||
    status === 'active' ||
    status === 'trialing';

  const revokeAccess =
    eventType === 'subscription.cancelled' ||
    eventType === 'subscription.expired' ||
    status === 'cancelled' ||
    status === 'expired';

  if (!googleSub && !subscriptionId) {
    return { handled: false, reason: 'missing_identity' };
  }

  return {
    handled: true,
    eventType,
    googleSub,
    subscriptionId,
    customerId,
    planTier: grantAccess ? (plan === 'student' ? 'student' : 'pro') : revokeAccess ? 'free' : 'pro',
    subscriptionStatus: grantAccess ? 'active' : revokeAccess ? status : status,
    grantAccess,
    revokeAccess,
    provider: 'dodo',
    periodEnd: data?.next_billing_date || data?.current_period_end || null,
  };
}

export async function dodoPortalUrl() {
  return null;
}

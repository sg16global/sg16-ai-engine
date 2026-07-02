import crypto from 'crypto';
import {
  applyPaddleSubscription,
  getUserRecord,
  updateUserRecord,
} from './userLedger.js';

const PADDLE_API_BASE = {
  sandbox: 'https://sandbox-api.paddle.com',
  production: 'https://api.paddle.com',
};

function paddleEnvironment() {
  const env = (process.env.PADDLE_ENVIRONMENT || 'sandbox').trim().toLowerCase();
  return env === 'production' ? 'production' : 'sandbox';
}

function paddleApiKey() {
  return process.env.PADDLE_API_KEY?.trim() || '';
}

function paddleClientToken() {
  return process.env.PADDLE_CLIENT_TOKEN?.trim() || process.env.VITE_PADDLE_CLIENT_TOKEN?.trim() || '';
}

function paddleWebhookSecret() {
  return process.env.PADDLE_WEBHOOK_SECRET?.trim() || '';
}

function priceIdForPlan(planTier) {
  if (planTier === 'student') return process.env.PADDLE_PRICE_ID_STUDENT?.trim() || '';
  if (planTier === 'pro') return process.env.PADDLE_PRICE_ID_PRO?.trim() || '';
  return '';
}

function planForPriceId(priceId) {
  const student = process.env.PADDLE_PRICE_ID_STUDENT?.trim();
  const pro = process.env.PADDLE_PRICE_ID_PRO?.trim();
  if (priceId && priceId === student) return 'student';
  if (priceId && priceId === pro) return 'pro';
  return null;
}

export function isPaddleConfigured() {
  return Boolean(
    paddleApiKey() &&
      paddleClientToken() &&
      priceIdForPlan('student') &&
      priceIdForPlan('pro'),
  );
}

export function getPaddlePublicConfig() {
  return {
    enabled: isPaddleConfigured(),
    environment: paddleEnvironment(),
    clientToken: paddleClientToken(),
    prices: {
      student: priceIdForPlan('student'),
      pro: priceIdForPlan('pro'),
    },
  };
}

async function paddleApiRequest(method, path, body) {
  const apiKey = paddleApiKey();
  if (!apiKey) {
    throw new Error('Paddle API key is not configured.');
  }

  const base = PADDLE_API_BASE[paddleEnvironment()];
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.error?.detail || data?.error?.message || res.statusText;
    throw new Error(typeof detail === 'string' ? detail : 'Paddle API request failed.');
  }
  return data;
}

export function verifyPaddleWebhook(rawBody, signatureHeader) {
  const secret = paddleWebhookSecret();
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(';').map((part) => {
      const idx = part.indexOf('=');
      return [part.slice(0, idx), part.slice(idx + 1)];
    }),
  );

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function extractGoogleSub(customData) {
  if (!customData) return null;
  return customData.googleSub || customData.google_sub || customData.userId || null;
}

function primaryPriceIdFromSubscription(data) {
  const item = data?.items?.[0];
  return item?.price?.id || item?.price_id || null;
}

function upsertSubscriptionFromWebhook(data) {
  const googleSub = extractGoogleSub(data?.custom_data);
  if (!googleSub) {
    console.warn('[SG16 billing] Paddle webhook missing googleSub in custom_data');
    return null;
  }

  const priceId = primaryPriceIdFromSubscription(data);
  const planTier = planForPriceId(priceId) || 'free';
  const status = data?.status || 'active';

  return applyPaddleSubscription(googleSub, {
    planTier,
    status,
    paddleCustomerId: data?.customer_id || null,
    paddleSubscriptionId: data?.id || null,
  });
}

export function handlePaddleWebhookEvent(event) {
  const type = event?.event_type;
  const data = event?.data;

  switch (type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.activated':
    case 'subscription.resumed':
      return upsertSubscriptionFromWebhook(data);

    case 'subscription.canceled':
    case 'subscription.paused':
      return upsertSubscriptionFromWebhook({ ...data, status: data?.status || 'canceled' });

    case 'transaction.completed': {
      const googleSub = extractGoogleSub(data?.custom_data);
      if (!googleSub) return null;

      const subscriptionId = data?.subscription_id;
      if (subscriptionId) {
        updateUserRecord(googleSub, {
          paddleSubscriptionId: subscriptionId,
          paddleCustomerId: data?.customer_id || undefined,
        });
      }
      return getUserRecord(googleSub);
    }

    default:
      return null;
  }
}

export async function createCustomerPortalUrl(googleSub) {
  const record = getUserRecord(googleSub);
  const customerId = record?.paddleCustomerId;
  if (!customerId) {
    throw new Error('No Paddle billing account found for this user.');
  }

  const appUrl = process.env.SG16_APP_URL?.trim() || 'https://sg16engine.com';
  const result = await paddleApiRequest('POST', `/customers/${customerId}/portal-sessions`, {
    return_url: `${appUrl.replace(/\/$/, '')}/?workspace=settings`,
  });

  return result?.data?.urls?.general || result?.data?.url || null;
}

export function getCheckoutPriceId(planTier) {
  const priceId = priceIdForPlan(planTier);
  if (!priceId) {
    throw new Error(`Paddle price ID is not configured for plan "${planTier}".`);
  }
  return priceId;
}

/**
 * SG16 Billing Room — fixed API for every SG16 app.
 * Apps always call /api/v1/billing/* ; Dodo (or next provider) plugs in behind this room.
 */
import { buildSubscriptionPayload, getEntitlements, applyBillingSubscription, getUserRecord } from '../userLedger.js';
import { getLaunchPublicConfig, isFullAccessOpen, isPaymentsLive } from '../launchMode.js';
import { recordWebhookEvent } from '../db/index.js';
import { OPENING_OFFER_PRICE, BILLING_PLANS } from './plans.js';
import { getBillingProvider } from './providers/index.js';

const PENDING_MSG =
  'SG16 Billing Room is ready — add Dodo keys on the server to open checkout.';

export function billingRoomStatus() {
  const provider = getBillingProvider();
  const info = provider?.dodoPublicInfo?.() ?? { id: 'none', configured: false };
  const fullAccess = isFullAccessOpen();
  const paymentsLive = isPaymentsLive();
  const enabled = paymentsLive;

  return {
    room: 'sg16-billing',
    enabled,
    provider: info.id,
    environment: info.environment || 'sandbox',
    configured: info.configured,
    webhookConfigured: info.webhookConfigured ?? false,
    checkoutEnabled: enabled,
    paymentsPending: !enabled,
    paymentsLive,
    fullAccessOpen: fullAccess,
    paymentsMessage: enabled ? null : PENDING_MSG,
    prices: {
      student: BILLING_PLANS.student.priceUsd,
      pro: BILLING_PLANS.pro.priceUsd,
    },
    openingOfferPrice: OPENING_OFFER_PRICE,
    launchFree: fullAccess,
  };
}

export function handleBillingConfig(_req, res) {
  res.json({
    ...billingRoomStatus(),
    clientToken: '',
    ...getLaunchPublicConfig(),
  });
}

export async function handleBillingEntitlements(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in to view billing.', code: 'AUTH_REQUIRED' });
  }

  try {
    res.json({
      entitlements: await getEntitlements(googleSub),
      subscription: await buildSubscriptionPayload(googleSub),
    });
  } catch (err) {
    console.error('[SG16 Billing Room entitlements]', err);
    res.status(500).json({ error: 'Could not load billing status.' });
  }
}

export async function handleBillingCheckout(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in before checkout.', code: 'AUTH_REQUIRED' });
  }
  if (isFullAccessOpen()) {
    return res.status(403).json({
      error: 'Checkout opens when Dodo payments go live on the server.',
      code: 'FULL_ACCESS_OPEN',
    });
  }

  const provider = getBillingProvider();
  if (!provider?.dodoConfigured?.()) {
    return res.status(503).json({
      error: PENDING_MSG,
      code: 'PAYMENTS_PENDING',
      room: 'sg16-billing',
    });
  }

  const plan = req.body?.plan === 'student' ? 'student' : 'pro';
  const record = await getUserRecord(googleSub);

  try {
    const session = await provider.dodoCreateCheckout({
      plan,
      googleSub,
      email: record?.email,
      name: record?.name || req.auth?.name,
    });

    res.json({
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      plan: session.plan,
      provider: session.provider,
      room: 'sg16-billing',
    });
  } catch (err) {
    console.error('[SG16 Billing Room checkout]', err);
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Checkout could not start.',
      code: 'CHECKOUT_FAILED',
    });
  }
}

export async function handleBillingPortal(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in to manage billing.', code: 'AUTH_REQUIRED' });
  }

  const provider = getBillingProvider();
  const url = provider?.dodoPortalUrl ? await provider.dodoPortalUrl(googleSub) : null;
  if (!url) {
    return res.status(503).json({
      error: `Manage billing via ${process.env.SG16_CONTACT_EMAIL || 'contact@sg16engine.com'} — portal link coming soon.`,
      code: 'PORTAL_PENDING',
    });
  }
  res.json({ url });
}

export async function handleBillingWebhook(req, res) {
  const provider = getBillingProvider();
  if (!provider?.dodoVerifyWebhook) {
    return res.status(503).json({ error: 'Billing provider not configured.', code: 'PAYMENTS_PENDING' });
  }

  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: 'Invalid webhook body.' });
  }

  const rawText = rawBody.toString('utf8');

  let payload;
  try {
    payload = await provider.dodoVerifyWebhook(rawText, req.headers);
  } catch (err) {
    console.error('[SG16 Billing Room webhook verify]', err);
    return res.status(401).json({ error: 'Webhook signature invalid.' });
  }

  const eventId =
    req.headers['webhook-id'] ||
    payload?.id ||
    `${payload?.type || 'event'}:${pickSubscriptionIdFromPayload(payload) || Date.now()}`;

  try {
    const duplicate = await recordWebhookEvent(String(eventId), 'dodo', payload?.type, payload);
    if (duplicate) {
      return res.json({ received: true, duplicate: true });
    }
  } catch (err) {
    console.warn('[SG16 Billing Room webhook idempotency]', err);
  }

  const parsed = provider.dodoParseWebhookEvent(payload);
  if (!parsed.handled || !parsed.googleSub) {
    return res.json({ received: true, skipped: parsed.reason || 'no_google_sub' });
  }

  try {
    await applyBillingSubscription(parsed.googleSub, {
      provider: parsed.provider,
      planTier: parsed.grantAccess ? parsed.planTier : parsed.revokeAccess ? 'free' : parsed.planTier,
      status: parsed.grantAccess ? 'active' : parsed.subscriptionStatus,
      externalSubscriptionId: parsed.subscriptionId,
      externalCustomerId: parsed.customerId,
      currentPeriodEnd: parsed.periodEnd,
    });
    console.log(
      `[SG16 Billing Room] ${parsed.eventType} → ${parsed.googleSub} plan=${parsed.planTier} status=${parsed.subscriptionStatus}`,
    );
  } catch (err) {
    console.error('[SG16 Billing Room webhook apply]', err);
    return res.status(500).json({ error: 'Could not apply subscription.' });
  }

  res.json({ received: true, room: 'sg16-billing' });
}

function pickSubscriptionIdFromPayload(payload) {
  const data = payload?.data ?? payload;
  return data?.subscription_id || data?.id || null;
}

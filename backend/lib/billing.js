import { buildSubscriptionPayload, getEntitlements } from './userLedger.js';
import { getLaunchPublicConfig, isLaunchFree } from './launchMode.js';
import {
  createCustomerPortalUrl,
  getCheckoutPriceId,
  getPaddlePublicConfig,
  handlePaddleWebhookEvent,
  isPaddleConfigured,
  verifyPaddleWebhook,
} from './paddle.js';

export function handleBillingConfig(_req, res) {
  res.json({
    ...getPaddlePublicConfig(),
    ...getLaunchPublicConfig(),
  });
}

export function handleBillingEntitlements(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in to view billing.', code: 'AUTH_REQUIRED' });
  }

  res.json({
    entitlements: getEntitlements(googleSub),
    subscription: buildSubscriptionPayload(googleSub),
  });
}

export function handleBillingCheckout(req, res) {
  const googleSub = req.auth?.sub;
  const { plan } = req.body ?? {};

  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in before checkout.', code: 'AUTH_REQUIRED' });
  }
  if (isLaunchFree()) {
    return res.status(403).json({
      error: getLaunchPublicConfig().launchMessage,
      code: 'LAUNCH_FREE',
    });
  }
  if (!isPaddleConfigured()) {
    return res.status(503).json({
      error: 'Payments are not configured yet. Add Paddle env vars on the server.',
    });
  }
  if (plan !== 'student' && plan !== 'pro') {
    return res.status(400).json({ error: 'Invalid plan for checkout.' });
  }

  try {
    const priceId = getCheckoutPriceId(plan);
    res.json({
      priceId,
      plan,
      googleSub,
      customData: { googleSub },
    });
  } catch (err) {
    res.status(503).json({
      error: err instanceof Error ? err.message : 'Checkout unavailable.',
    });
  }
}

export async function handleBillingPortal(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in to manage billing.', code: 'AUTH_REQUIRED' });
  }
  if (isLaunchFree()) {
    return res.status(403).json({
      error: getLaunchPublicConfig().launchMessage,
      code: 'LAUNCH_FREE',
    });
  }
  if (!isPaddleConfigured()) {
    return res.status(503).json({ error: 'Billing portal is not configured.' });
  }

  try {
    const url = await createCustomerPortalUrl(googleSub);
    if (!url) {
      return res.status(404).json({ error: 'No billing account found. Subscribe to a plan first.' });
    }
    res.json({ url });
  } catch (err) {
    console.error('[SG16 billing portal]', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not open billing portal.',
    });
  }
}

export function handleBillingWebhook(req, res) {
  const signature = req.headers['paddle-signature'];
  const rawBody = req.body;

  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: 'Invalid webhook payload.' });
  }

  if (!verifyPaddleWebhook(rawBody.toString('utf8'), signature)) {
    console.warn('[SG16 billing] Invalid Paddle webhook signature');
    return res.status(401).json({ error: 'Invalid signature.' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON.' });
  }

  try {
    handlePaddleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('[SG16 billing webhook]', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
}

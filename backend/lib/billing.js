import { buildSubscriptionPayload, getEntitlements } from './userLedger.js';
import { getLaunchPublicConfig, isLaunchFree } from './launchMode.js';

const PAYMENTS_PENDING_MESSAGE =
  'Paid checkout is activating soon. Pricing stays the same — we will open secure payments on sg16engine.com when ready.';

/** Public billing config — Paddle removed; Dodo (or next provider) will plug in later. */
export function handleBillingConfig(_req, res) {
  res.json({
    enabled: false,
    provider: 'pending',
    environment: 'sandbox',
    clientToken: '',
    prices: { student: '', pro: '' },
    ...getLaunchPublicConfig(),
    // Keep plans visible; block live checkout until new provider is wired
    checkoutEnabled: false,
    paymentsPending: true,
    paymentsMessage: PAYMENTS_PENDING_MESSAGE,
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
    console.error('[SG16 billing entitlements]', err);
    res.status(500).json({ error: 'Could not load billing status.' });
  }
}

export function handleBillingCheckout(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in before checkout.', code: 'AUTH_REQUIRED' });
  }
  if (isLaunchFree()) {
    return res.status(403).json({
      error: getLaunchPublicConfig().launchMessage,
      code: 'LAUNCH_FREE',
    });
  }
  return res.status(503).json({
    error: PAYMENTS_PENDING_MESSAGE,
    code: 'PAYMENTS_PENDING',
  });
}

export async function handleBillingPortal(req, res) {
  const googleSub = req.auth?.sub;
  if (!googleSub) {
    return res.status(401).json({ error: 'Sign in to manage billing.', code: 'AUTH_REQUIRED' });
  }
  return res.status(503).json({
    error: 'Billing portal will open after the new payment provider goes live.',
    code: 'PAYMENTS_PENDING',
  });
}

/** Old Paddle webhook path — keep route so misconfigured dashboards do not 404 hard. */
export async function handleBillingWebhook(_req, res) {
  res.status(410).json({
    error: 'Paddle billing has been removed. Configure the new payment provider webhook when ready.',
    code: 'PROVIDER_REMOVED',
  });
}

import * as dodo from './dodo.js';

/** Active money provider — swap here when SG16 adds Lemon, Stripe, etc. */
export function getBillingProvider() {
  const id = (process.env.SG16_BILLING_PROVIDER || 'dodo').trim().toLowerCase();
  if (id === 'dodo') return dodo;
  if (id === 'none' || id === 'pending') return null;
  console.warn(`[SG16 Billing Room] Unknown provider "${id}" — falling back to dodo`);
  return dodo;
}

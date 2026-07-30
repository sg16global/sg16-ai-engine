/** SG16 Billing Room — plan catalog (same for every SG16 app). */
export const OPENING_OFFER_PRICE = '4.50';

export const BILLING_PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    priceUsd: '0',
    productEnvKey: null,
  },
  pro: {
    id: 'pro',
    name: 'All Access',
    priceUsd: OPENING_OFFER_PRICE,
    /** Dodo subscription product id — set DODO_PRODUCT_ID_PRO in env */
    productEnvKey: 'DODO_PRODUCT_ID_PRO',
  },
  student: {
    id: 'student',
    name: 'Student Shield',
    priceUsd: '4.00',
    productEnvKey: 'DODO_PRODUCT_ID_STUDENT',
  },
};

export function normalizeCheckoutPlan(plan) {
  if (plan === 'student' || plan === 'pro') return plan;
  return 'pro';
}

export function productIdForPlan(plan) {
  const key = BILLING_PLANS[normalizeCheckoutPlan(plan)]?.productEnvKey;
  if (!key) return '';
  return process.env[key]?.trim() || '';
}

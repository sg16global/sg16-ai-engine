/** Launch period: full access, pricing visible, checkout disabled until billing goes live. */
export function isLaunchFree() {
  const flag = process.env.SG16_LAUNCH_FREE?.trim().toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;
  return true;
}

/** Same as launch-free — everyone gets full access until paid checkout opens. */
export function isFullAccessOpen() {
  return isLaunchFree();
}

/** Dodo checkout is live when launch mode is off and server keys + product id are set. */
export function isPaymentsLive() {
  if (isLaunchFree()) return false;
  const apiKey =
    process.env.DODO_PAYMENTS_API_KEY?.trim() || process.env.DODO_API_KEY?.trim() || '';
  const productId = process.env.DODO_PRODUCT_ID_PRO?.trim() || '';
  return Boolean(apiKey && productId);
}

export function getLaunchPublicConfig() {
  const launchFree = isLaunchFree();
  return {
    launchFree,
    checkoutEnabled: !launchFree,
    launchMessage:
      'Launch period — all features are free unlimited. We will notify you in the app before paid plans begin.',
    contactEmail: process.env.SG16_CONTACT_EMAIL?.trim() || 'contact@sg16engine.com',
  };
}

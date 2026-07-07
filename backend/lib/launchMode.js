/** Launch period: full access, pricing visible, checkout disabled until billing goes live. */
export function isLaunchFree() {
  const flag = process.env.SG16_LAUNCH_FREE?.trim().toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;
  return true;
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

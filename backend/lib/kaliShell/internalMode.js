/**
 * Internal co-owner mode — full permissions for owner + Katsur (Cursor).
 * Not for outside market. Set SG16_MARKET_MODE=true only when public launch needs gates.
 */

export function isInternalCoOwnerMode() {
  const market = process.env.SG16_MARKET_MODE?.trim().toLowerCase();
  return market !== '1' && market !== 'true';
}

/** Owner + co-owner always allowed in internal mode. */
export function isOwnerAllowed(email) {
  if (isInternalCoOwnerMode()) return true;
  const owner = process.env.SG16_OWNER_EMAIL?.trim().toLowerCase();
  if (!owner) return true;
  return email?.trim().toLowerCase() === owner;
}

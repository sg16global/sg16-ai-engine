/**
 * Internal co-owner mode — optional dev-only scope widening for Personal Developer rooms.
 * Owner gate always uses SG16_OWNER_EMAIL + verified session email (fail-closed).
 */

export function isInternalCoOwnerMode() {
  if (process.env.NODE_ENV === 'production') return false;
  const internal = process.env.SG16_INTERNAL_MODE?.trim().toLowerCase();
  return internal === '1' || internal === 'true';
}

/** Verified owner email from signed session — never DB lookup. */
export function emailFromVerifiedAuth(auth) {
  if (auth?.emailVerified === true && typeof auth.email === 'string' && auth.email.trim()) {
    return auth.email.trim();
  }
  return null;
}

export function isOwnerAllowed(email) {
  const owner = process.env.SG16_OWNER_EMAIL?.trim().toLowerCase();
  if (!owner) return false;
  if (!email) return false;
  return email.trim().toLowerCase() === owner;
}

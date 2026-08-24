/** Off by default so kids traffic cannot starve existing SG16 Engine users. */
export function isChildrenWorldEnabled() {
  const v = (process.env.SG16_CHILDREN_ENABLED || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Platform credential for SG16 Children — validates X-SG16-Client on chat routes. */
const DEFAULT_CLIENT_IDS = ['sg16-children-world', 'sg16-children-world-local'];

function getAllowedClientIds() {
  const fromEnv = (process.env.SG16_CHILDREN_CLIENT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_CLIENT_IDS;
}

export function requireChildrenClient(req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const clientId = (req.get('X-SG16-Client') || '').trim();

  if (!clientId) {
    if (!isProd) return next();
    return res.status(401).json({ error: 'Missing X-SG16-Client platform credential' });
  }

  const allowed = new Set(getAllowedClientIds());
  if (!allowed.has(clientId)) {
    return res.status(403).json({ error: 'Unrecognized SG16 Children client' });
  }

  next();
}

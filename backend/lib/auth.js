import crypto from 'crypto';
import { buildSubscriptionPayload, ensureSignupDate } from './userLedger.js';
import { trialDaysRemaining, trialIsActive, trialMsRemaining } from './access.js';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return secret || 'sg16-dev-session-secret-change-me';
}

function googleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || process.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
}

export function signSession(payload) {
  const body = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token) {
  if (!token?.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', sessionSecret()).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload?.sub || !payload?.signupDate || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyGoogleIdToken(credential) {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error('Google sign-in is not configured on this server.');
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error_description || 'Invalid Google sign-in token.');
  }
  if (data.aud !== clientId) {
    throw new Error('Google token audience mismatch.');
  }
  const iss = data.iss || '';
  if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
    throw new Error('Invalid Google token issuer.');
  }
  if (Number(data.exp) * 1000 < Date.now()) {
    throw new Error('Google sign-in token expired.');
  }

  return {
    sub: data.sub,
    name: data.name || 'SG16 User',
    picture: data.picture || undefined,
    email: data.email,
  };
}

export async function createAuthSessionFromGoogle(credential) {
  const profile = await verifyGoogleIdToken(credential);
  const signupDate = ensureSignupDate(profile.sub);

  const token = signSession({
    sub: profile.sub,
    signupDate,
    name: profile.name,
    picture: profile.picture,
  });

  return {
    token,
    user: buildUserPayload({
      sub: profile.sub,
      signupDate,
      name: profile.name,
      picture: profile.picture,
    }),
  };
}

export function buildUserPayload(session) {
  const signupDate = session.signupDate;
  const trialActive = trialIsActive(signupDate);
  return {
    id: session.sub,
    signupDate,
    name: session.name || 'SG16 User',
    picture: session.picture,
    trialActive,
    trialDaysRemaining: trialDaysRemaining(signupDate),
    trialMsRemaining: trialMsRemaining(signupDate),
    subscription: buildSubscriptionPayload(session.sub),
  };
}

export function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  const session = token ? verifySession(token) : null;
  if (!session) {
    return res.status(401).json({ error: 'Sign in with Google to continue.', code: 'AUTH_REQUIRED' });
  }
  req.auth = session;
  next();
}

export function optionalAuth(req, _res, next) {
  const token = extractBearerToken(req);
  req.auth = token ? verifySession(token) : null;
  next();
}

export async function handleGoogleAuth(req, res) {
  try {
    const { credential } = req.body ?? {};
    if (!credential?.trim()) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }
    const result = await createAuthSessionFromGoogle(credential.trim());
    res.json(result);
  } catch (err) {
    console.error('[SG16 auth]', err);
    res.status(401).json({ error: err instanceof Error ? err.message : 'Google sign-in failed.' });
  }
}

export function handleAuthMe(req, res) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Not signed in.', code: 'AUTH_REQUIRED' });
  }
  const user = buildUserPayload(req.auth);
  res.json({ user, subscription: user.subscription });
}

export function getGoogleClientIdForFrontend(_req, res) {
  const clientId = googleClientId();
  res.json({
    clientId,
    authorizedJavaScriptOrigins: [
      'http://localhost',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:8000',
      'https://sg16engine.com',
    ],
    currentOriginHint:
      'Use http://localhost:5173 for Vite dev. Google requires http://localhost AND http://localhost:5173 in Authorized JavaScript origins.',
  });
}

export function isDevAuthEnabled() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SG16_DEV_AUTH === '1';
  }
  return process.env.SG16_DEV_AUTH !== '0';
}

export function handleDevAuth(_req, res) {
  const clientId = googleClientId();
  if (!isDevAuthEnabled() || clientId) {
    return res.status(404).json({ error: 'Dev sign-in is not available.' });
  }

  const signupDate = ensureSignupDate('dev-local-user');
  const token = signSession({
    sub: 'dev-local-user',
    signupDate,
    name: 'SG16 Dev User',
    picture: undefined,
  });

  res.json({
    token,
    user: buildUserPayload({
      sub: 'dev-local-user',
      signupDate,
      name: 'SG16 Dev User',
      picture: undefined,
    }),
  });
}

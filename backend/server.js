import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { handleChatRequest } from './lib/sg16Engine.js';
import { handleRouteRequest } from './lib/router.js';
import { handleStudentVerifyRequest } from './lib/studentVerify.js';
import {
  getGoogleClientIdForFrontend,
  handleAuthMe,
  handleGoogleAuth,
  handleDevAuth,
  requireAuth,
} from './lib/auth.js';
import {
  handleBillingCheckout,
  handleBillingConfig,
  handleBillingEntitlements,
  handleBillingPortal,
  handleBillingWebhook,
} from './lib/billing/room.js';
import { isLaunchFree } from './lib/launchMode.js';
import { hasAnyEditProviderKey } from './lib/imageEngine.js';
import { liveSearchAvailable } from './lib/webSearch.js';
import { getProviderStatus, getTextModelChain } from './lib/sg16Provider.js';
import { getActiveProviderSummary } from './lib/modelRouting.js';
import { initDatabase, checkDatabaseHealth, isDatabaseReady } from './lib/db/index.js';
import { handleGetUserRoom, handleGetUserHistory, handlePutUserHistory } from './lib/userRoom.js';
import { handleSpeechTranscribe, speechTranscriptionAvailable } from './lib/speechEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, 'public');
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = new Set([
  'https://sg16engine.com',
  'https://www.sg16engine.com',
  ...(isProd ? [] : ['http://localhost:5173', 'http://localhost:8000', 'http://127.0.0.1:5173']),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/', apiRateLimit);

// Billing webhook — Dodo Standard Webhooks (raw body required for signature verify)
app.post(
  '/api/v1/billing/webhook',
  express.raw({ type: 'application/json' }),
  handleBillingWebhook,
);

app.use(express.json({ limit: '10mb' }));

function isLocalHost(req) {
  const host = req.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

app.use((req, res, next) => {
  // Google GIS popup mode
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Google requires no-referrer-when-downgrade on HTTP localhost or GIS returns origin_mismatch.
  // https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
  res.setHeader(
    'Referrer-Policy',
    isLocalHost(req) ? 'no-referrer-when-downgrade' : 'strict-origin-when-cross-origin',
  );
  if (isProd) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  next();
});

app.get('/health', async (_req, res) => {
  const db = await checkDatabaseHealth();
  res.json({
    status: 'ok',
    engine: 'SG16 AI Engine',
    database: db,
    launchFree: isLaunchFree(),
    photoEdit: hasAnyEditProviderKey() ? 'ready' : 'needs_api_key',
    documentAnalysis: 'groq',
    liveSearch: liveSearchAvailable() ? 'ready' : 'unavailable',
    voice: speechTranscriptionAvailable() ? 'ready' : 'needs_api_key',
    providers: getProviderStatus(),
    speed: getActiveProviderSummary(),
    modelFallbacks: getTextModelChain(),
  });
});

app.get('/api/v1/auth/config', getGoogleClientIdForFrontend);
app.post('/api/v1/auth/google', handleGoogleAuth);
app.post('/api/v1/auth/dev', handleDevAuth);
app.get('/api/v1/auth/me', requireAuth, handleAuthMe);

app.get('/api/v1/user/room', requireAuth, handleGetUserRoom);
app.get('/api/v1/user/history', requireAuth, handleGetUserHistory);
app.put('/api/v1/user/history', requireAuth, handlePutUserHistory);

app.get('/api/v1/billing/config', handleBillingConfig);
app.get('/api/v1/billing/entitlements', requireAuth, handleBillingEntitlements);
app.post('/api/v1/billing/checkout', requireAuth, handleBillingCheckout);
app.post('/api/v1/billing/portal', requireAuth, handleBillingPortal);

app.post('/api/v1/route', requireAuth, handleRouteRequest);
app.post('/api/v1/chat', requireAuth, handleChatRequest);
app.post('/api/v1/speech/transcribe', requireAuth, handleSpeechTranscribe);
app.post('/api/v1/student/verify', requireAuth, handleStudentVerifyRequest);

const indexPath = path.join(frontendDist, 'index.html');
const frontendBuilt = fs.existsSync(indexPath);

if (!frontendBuilt) {
  console.warn('[SG16] Frontend not built — run: npm run build (from repo root)');
}

app.use(
  express.static(frontendDist, {
    maxAge: isProd ? '1d' : 0,
    setHeaders(res, filePath) {
      const base = path.basename(filePath);
      if (
        base === 'index.html' ||
        base === 'sw.js' ||
        base === 'manifest.json' ||
        base === 'sitemap.xml' ||
        base === 'robots.txt'
      ) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      if (filePath.includes(`${path.sep}landing${path.sep}`) && base.endsWith('.mp4')) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }),
);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  if (!frontendBuilt) {
    return res.status(503).send('SG16 AI Engine is starting — frontend build missing. Redeploy from repo root.');
  }
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

app.use((err, _req, res, _next) => {
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  console.error('[SG16] Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('[SG16 db] Startup failed:', err);
    if (isProd && process.env.DATABASE_URL?.trim()) {
      process.exit(1);
    }
  }

  const server = app.listen(PORT, HOST, () => {
    const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
    console.log(`SG16 AI Engine running on http://${HOST}:${PORT} (${isProd ? 'production' : 'development'})`);
    console.log(`Google OAuth: ${googleReady ? 'configured' : 'MISSING — set GOOGLE_CLIENT_ID'}`);
    console.log(`Database: ${isDatabaseReady() ? 'PostgreSQL' : 'JSON fallback (set DATABASE_URL for production)'}`);
    console.log(`Launch mode: ${isLaunchFree() ? 'FREE UNLIMITED (checkout disabled)' : 'billing active'}`);
    console.log('Payments provider: pending (Paddle removed — wire Dodo when account is ready)');
    if (process.env.SG16_APP_URL) {
      console.log(`Public URL: ${process.env.SG16_APP_URL}`);
    }
  });

  function shutdown(signal) {
    console.log(`[SG16] ${signal} received — shutting down`);
    server.close(() => process.exit(0));
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();

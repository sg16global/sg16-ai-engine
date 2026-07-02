import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
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
} from './lib/billing.js';
import { isPaddleConfigured } from './lib/paddle.js';
import { hasAnyEditProviderKey } from './lib/imageEngine.js';
import { liveSearchAvailable } from './lib/webSearch.js';
import { getProviderStatus, getTextModelChain } from './lib/sg16Provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, 'public');
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(cors());

// Paddle webhooks require the raw body for signature verification.
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

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    engine: 'SG16 AI Engine',
    photoEdit: hasAnyEditProviderKey() ? 'ready' : 'needs_api_key',
    liveSearch: liveSearchAvailable() ? 'ready' : 'unavailable',
    providers: getProviderStatus(),
    modelFallbacks: getTextModelChain(),
  });
});

app.get('/api/v1/auth/config', getGoogleClientIdForFrontend);
app.post('/api/v1/auth/google', handleGoogleAuth);
app.post('/api/v1/auth/dev', handleDevAuth);
app.get('/api/v1/auth/me', requireAuth, handleAuthMe);

app.get('/api/v1/billing/config', handleBillingConfig);
app.get('/api/v1/billing/entitlements', requireAuth, handleBillingEntitlements);
app.post('/api/v1/billing/checkout', requireAuth, handleBillingCheckout);
app.post('/api/v1/billing/portal', requireAuth, handleBillingPortal);

app.post('/api/v1/route', requireAuth, handleRouteRequest);
app.post('/api/v1/chat', requireAuth, handleChatRequest);
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
      if (base === 'index.html' || base === 'sw.js' || base === 'manifest.json') {
        res.setHeader('Cache-Control', 'no-cache');
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
  console.error('[SG16] Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, HOST, () => {
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
  console.log(`SG16 AI Engine running on http://${HOST}:${PORT} (${isProd ? 'production' : 'development'})`);
  console.log(`Google OAuth: ${googleReady ? 'configured' : 'MISSING — set GOOGLE_CLIENT_ID'}`);
  console.log(`Paddle billing: ${isPaddleConfigured() ? 'configured' : 'MISSING — set PADDLE_* env vars'}`);
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

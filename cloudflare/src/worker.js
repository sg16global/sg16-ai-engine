/**
 * SG16 AI Engine website on Cloudflare.
 *
 * - Serves the built React app (backend/public) from Cloudflare's edge.
 * - Forwards /api/* and /health* to the Node backend: the Backend container (src/backend.js)
 *   by default, or an external server when BACKEND_URL is set. The browser only ever talks
 *   to one origin — no CORS, same as production before.
 * - Mirrors backend/server.js page rules: app routes get index.html, unknown paths a real 404,
 *   the shield subdomain gets its landing page, and the Google sign-in headers are kept.
 */
import { isSpaPath } from '../../backend/lib/spaRoutes.js';

const NO_CACHE_FILES = new Set(['/sw.js', '/manifest.json', '/sitemap.xml', '/robots.txt']);

function isBackendPath(path) {
  return path.startsWith('/api/') || path === '/health' || path.startsWith('/health/');
}

function backendUnavailable(message) {
  return Response.json({ error: message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

/** The single backend container instance (same as getContainer(env.BACKEND, 'main')). */
function backendContainer(env) {
  return env.BACKEND.get(env.BACKEND.idFromName('main'));
}

async function proxyToBackend(request, env, url) {
  const external = (env.BACKEND_URL || '').trim();
  if (!external && !env.BACKEND) {
    return backendUnavailable('SG16 backend is not connected (set BACKEND_URL)');
  }

  // The container ignores the host part; only path and query matter.
  const target = new URL(url.pathname + url.search, external || 'http://backend.internal');
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) headers.set('X-Forwarded-For', clientIp);

  const init = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    duplex: 'half',
    redirect: 'manual',
  };
  try {
    if (external) return await fetch(target, init);
    return await backendContainer(env).fetch(new Request(target, init));
  } catch (err) {
    console.error('[sg16-web] backend unreachable:', err?.message || err);
    return backendUnavailable('SG16 backend is starting or unreachable');
  }
}

/** Fetch a page from the uploaded assets. "/" serves index.html; "/404" serves 404.html. */
function assetPage(request, env, url, pagePath) {
  return env.ASSETS.fetch(new Request(new URL(pagePath, url), { method: request.method, headers: request.headers }));
}

async function notFound(request, env, url) {
  const page = await assetPage(request, env, url, '/404');
  if (page.ok) return new Response(page.body, { status: 404, headers: page.headers });
  return new Response('<!doctype html><title>Not found</title><h1>Page not found</h1><p><a href="/">SG16 AI Engine</a></p>', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function serveSite(request, env, url) {
  const path = url.pathname;
  const shieldHost = (env.SHIELD_HOST || '').toLowerCase();

  if (shieldHost && url.hostname.toLowerCase() === shieldHost) {
    return path === '/' ? assetPage(request, env, url, '/shield/') : notFound(request, env, url);
  }
  if (isSpaPath(path)) return assetPage(request, env, url, '/');

  const asset = await env.ASSETS.fetch(request);
  return asset.status === 404 ? notFound(request, env, url) : asset;
}

/** Same headers backend/server.js sets — Google sign-in popups need the COOP value. */
function withSiteHeaders(response, url) {
  const res = new Response(response.body, response);
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  const type = res.headers.get('Content-Type') || '';
  if (type.includes('text/html') || NO_CACHE_FILES.has(url.pathname)) {
    res.headers.set('Cache-Control', 'no-cache');
  }
  return res;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (isBackendPath(url.pathname)) return proxyToBackend(request, env, url);
    return withSiteHeaders(await serveSite(request, env, url), url);
  },
};

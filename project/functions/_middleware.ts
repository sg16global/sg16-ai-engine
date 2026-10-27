/**
 * Host rules for the custom domains (same behaviour as the old sg16-engine-web Worker):
 *
 * - www.sg16engine.com      → 301 to https://sg16engine.com (same path + query)
 * - shield.sg16engine.com/  → the Coding Shield landing page (/shield/); every other path 404
 *                             (its favicon under /brand/ is served)
 *
 * Every other host (sg16engine.com, *.pages.dev, localhost) passes straight through.
 */

interface MiddlewareContext {
  request: Request;
  env: { ASSETS: { fetch: (input: Request | string) => Promise<Response> } };
  next: () => Promise<Response>;
}

const APEX = 'sg16engine.com';
const SHIELD_HOST = 'shield.sg16engine.com';

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  if (host === `www.${APEX}`) {
    return Response.redirect(`https://${APEX}${url.pathname}${url.search}`, 301);
  }

  if (host === SHIELD_HOST) {
    if (url.pathname === '/') {
      return context.env.ASSETS.fetch(new Request(new URL('/shield/', url), context.request));
    }
    // The page is self-contained apart from its favicon.
    if (url.pathname.startsWith('/brand/')) return context.next();
    return new Response('<!doctype html><title>Not found</title><h1>Page not found</h1><p><a href="https://sg16engine.com/">SG16 AI Engine</a></p>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return context.next();
}

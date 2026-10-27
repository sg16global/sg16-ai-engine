/**
 * GET /api/landing/geo — the landing page "Geo Monitor" card.
 *
 * Live conditions for each listed city from SaifGlobal16 Monitor
 * (saifglobal16.info/api/weather). Edge-cached for 10 minutes. A city whose
 * lookup fails gives null — the card shows "—", never an invented status.
 */

interface EdgeContext {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

const CACHE_SECONDS = 600;

/** Same order and labels as the card. */
const CITIES = [
  { city: 'Malacca, Malaysia', lat: 2.19, lon: 102.25 },
  { city: 'US - New York', lat: 40.71, lon: -74.01 },
  { city: 'UK - London', lat: 51.51, lon: -0.13 },
  { city: 'DE - Frankfurt', lat: 50.11, lon: 8.68 },
  { city: 'JP - Tokyo', lat: 35.68, lon: 139.69 },
  { city: 'KR - Seoul', lat: 37.57, lon: 126.98 },
];

async function conditions(lat: number, lon: number): Promise<{ tempC: number; sky: string } | null> {
  try {
    const res = await fetch(`https://saifglobal16.info/api/weather?lat=${lat}&lon=${lon}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { main?: { temp?: number }; weather?: Array<{ main?: string }> };
    const tempC = data.main?.temp;
    const sky = data.weather?.[0]?.main;
    if (typeof tempC !== 'number' || !Number.isFinite(tempC) || !sky) return null;
    return { tempC: Math.round(tempC), sky };
  } catch {
    return null;
  }
}

export async function onRequestGet(context: EdgeContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(new URL('/api/landing/geo', context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const items = await Promise.all(CITIES.map(async (c) => ({ city: c.city, ...(await conditions(c.lat, c.lon)) })));
  const res = new Response(JSON.stringify({ updated: Date.now(), items }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
  });
  if (items.some((i) => 'tempC' in i)) context.waitUntil(cache.put(key, res.clone()));
  return res;
}

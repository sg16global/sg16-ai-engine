# SG16 Architecture — SaaS engine on Cloudflare Pages

SG16 AI Engine is a **Vite + React PWA on Cloudflare Pages with a small backend in Pages
Functions**. Users sign up, pay and use the 5 Shields — they never see an AI provider, base URL,
API key or model name. Only the owner configures the AI, once, as encrypted Pages secrets; the
browser talks only to SG16's own `/api/*` and never to a third party directly.

## This repo: SG16 AI Engine (`sg16engine.com`)

```
project/                  the app (Vite + React PWA) — the only product code
├── src/lib/ai/           AI layer: wire.ts calls /api/ai/* only (chat, vision, images, voice)
├── src/lib/codingShield/ Coding Shield — honest browser port (no CLI tools faked)
├── functions/api/ai/     backend: AI gateway (owner secrets → AI endpoint)
├── functions/api/edge/   stateless Pages Functions: news RSS, web search, Yahoo quotes
├── public/_headers       security headers
└── public/_redirects     SPA fallback (Pages Functions take precedence)
```

**Hosting**: Cloudflare Pages project `sg16-ai-engine` — static `project/dist/` plus
`project/functions/`. Deployed only by `.github/workflows/deploy-pages.yml` on every push to `main`.

## How AI works (backend gateway, owner secrets)

- **Backend** (`functions/api/ai/`): `POST /api/ai/chat`, `POST /api/ai/transcribe`,
  `POST /api/ai/image`, `GET /api/ai/status`. `_gateway.ts` reads the owner's secrets, picks the
  model for the request (chat / code / vision), and walks `AI_FALLBACK_MODELS` when a model is busy.
  POSTs are accepted only from the site's own origin; bodies and token budgets are capped.
- **Owner secrets** (Cloudflare dashboard → Pages project → Settings → Variables and Secrets, type
  *Secret*, or `npx wrangler pages secret put <NAME> --project-name sg16-ai-engine`):

  | Secret | Required | Meaning |
  |--------|----------|---------|
  | `AI_BASE_URL` | yes | standard chat-completions endpoint, e.g. `https://api.example.com/v1` |
  | `AI_API_KEY` | no | sent as `Authorization: Bearer …` (omit for keyless endpoints) |
  | `AI_CHAT_MODEL` | yes | general chat model |
  | `AI_CODING_MODEL` | no | coding model (falls back to the chat model) |
  | `AI_VISION_MODEL` | no | image questions + student ID checks |
  | `AI_AUDIO_MODEL` | no | voice transcription |
  | `AI_IMAGE_MODEL` | no | image creation / photo editing |
  | `AI_FALLBACK_MODELS` | no | comma list, tried in order when the chat model is busy |

- **Browser**: `src/lib/ai/client.ts` (`chatCompletion`) is the single place chat requests leave the
  app; `wire.ts` only calls `/api/ai/*`. Chat, Pilot, Shields, student verification, image studio and
  voice all build on it. Nothing about the AI endpoint is ever in the bundle.
- **Zero-Data Trace**: the backend never logs or stores request bodies, keys or upstream error text;
  users get short generic errors. Old device-side AI configs (`sg16_ai_config_v1`) are wiped on load.

## Data sources

| Data | Path | Notes |
|------|------|-------|
| AI chat/vision/images/voice | `/api/ai/*` (Pages Functions) | owner secrets, see above |
| Crypto prices | browser → CoinGecko → Binance → Coinbase | all CORS-enabled |
| FX rates | browser → open.er-api.com → Frankfurter (ECB) | CORS-enabled |
| Weather | browser → wttr.in | CORS-enabled |
| News headlines | `/api/edge/news` (Pages Function) | Google News RSS + BBC |
| Web search | `/api/edge/search` (Pages Function) | lite HTML search |
| Indices / gold / oil | `/api/edge/quotes` (Pages Function) | Yahoo spark (query1 → query2); Yahoo blocks browser CORS |

The edge functions are stateless, keyless, and cached at the edge for 60–300 s. The market module
adds a 60 s client cache and serves the last good data (`stale: true`) when every source fails —
it never invents numbers.

## Sessions, billing, privacy

- **Auth**: local device sessions (`src/lib/authApi.ts`). No accounts, no Google sign-in, no JWT
  server — a device id + token live in `localStorage`.
- **Billing**: local launch configuration (`src/lib/billingApi.ts`, key `sg16_launch_config_v1`).
  Launch mode = all features free; checkout is off until a payment provider is wired up in the
  backend.
- **Chat history**: stored on the device only.

## Coding Shield

`src/lib/codingShield/` is an honest browser port of the old server-side shield: JS syntax checks
(acorn), pattern-based lint/security rules, secret scanning, and package detection run in the
browser. Server-only tools (ESLint, Semgrep, Gitleaks, …) are reported as `skipped` — never faked.
The standalone CLI scanner remains in `coding-shield/` (`npm run shield`).

## Other SG16 products (separate repos / Pages projects)

| Project | Domain | Notes |
|---------|--------|-------|
| Children World | sg16children.com | Separate app in `sg16-children-world/` — own functions, own brain routes |
| Desktop | — | Separate Electron app in `desktop/` |

Each product owns its own AI connections and fallbacks — nothing routes through Engine.

## Running locally

```bash
npm install --prefix project
npm run dev            # SPA only (edge functions degrade gracefully)
npm run dev:pages      # build + wrangler pages dev dist  (full stack incl. /api/ai/* and /api/edge/*;
                       # put local AI secrets in project/.dev.vars — git-ignored)
npm run typecheck      # tsc --noEmit (src + functions)
npm test               # vitest unit tests for the ported logic
```

Deploy: push to `main` — GitHub Actions builds and deploys to the Pages project. There is no
Cloudflare Git integration and no Workers project for this repo.

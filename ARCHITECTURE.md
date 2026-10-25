# SG16 Architecture — self-contained Engine

SG16 AI Engine is a **fully self-contained, Cloudflare Edge-native Vite app**. There is no
dedicated backend server and no persistent "AI Brain": the app talks to external AI APIs
(OpenAI, Qwen, DeepSeek, Anthropic, Gemini, Groq, Mistral, xAI, OpenRouter, Ollama, or any
OpenAI-compatible endpoint) **directly from the browser**, and the only server-side code is a
set of tiny stateless Cloudflare Pages Functions for the data sources that block browser CORS.

## This repo: SG16 AI Engine (`sg16engine.com`)

```
project/                  the app (Vite + React PWA) — the only product code
├── src/lib/ai/           provider-agnostic AI layer (adapters, client, engine, vision, images, voice)
├── src/core/aiConfigStore.ts   AI config store (providers, fallback chain, options) — localStorage
├── src/components/admin/ Admin panel at /admin — connect any AI API, no account needed
├── src/lib/codingShield/ Coding Shield — honest browser port (no CLI tools faked)
├── functions/api/edge/   stateless Pages Functions: news RSS, web search, Yahoo quotes
├── public/_headers       security headers
└── public/_redirects     SPA fallback (Pages Functions take precedence)
```

**Hosting**: Cloudflare Pages — static `project/dist/` plus `project/functions/`. Deployed by
`.github/workflows/deploy-pages.yml` on every push to `main` (or `npm run pages:deploy` locally).

## How AI works (brain fully decoupled)

- **Admin panel (`/admin`)**: connect providers (preset cards for Qwen, OpenAI, DeepSeek, … or a
  custom endpoint), set model slots (chat / coding / vision / audio / image / fallbacks), reorder
  the fallback chain, test connections, and export/import the config. Everything is stored on the
  device (`localStorage`, key `sg16_ai_config_v1`) — API keys go straight from the browser to the
  provider and are never sent to an SG16 server (there isn't one).
- **One client for everything**: `src/lib/ai/client.ts` (`chatCompletion`) is the single place
  requests leave the app. It picks the active provider, walks the fallback chain (providers, then
  per-model fallbacks), cools down rate-limited endpoints, and reports real connectivity to the
  engine status bar. Chat, Pilot, Shields, student verification, image studio and voice all build
  on it — **switching models is a config change, never a code change**.
- **Build-time defaults** (optional): `VITE_SG16_AI_PROVIDER` / `VITE_SG16_AI_BASE_URL` /
  `VITE_SG16_AI_API_KEY` / `VITE_SG16_AI_MODEL` / `VITE_SG16_AI_CODING_MODEL` /
  `VITE_SG16_AI_VISION_MODEL` — see `project/.env.example`. Runtime Admin config wins.

## Data sources (no server of our own)

| Data | Path | Notes |
|------|------|-------|
| AI chat/vision/images/voice | browser → provider | configured in Admin |
| Crypto prices | browser → CoinGecko → Binance → Coinbase | all CORS-enabled |
| FX rates | browser → open.er-api.com → Frankfurter (ECB) | CORS-enabled |
| Weather | browser → wttr.in | CORS-enabled |
| News headlines | `/api/edge/news` (Pages Function) | Google News RSS + BBC |
| Web search | `/api/edge/search` (Pages Function) | DuckDuckGo lite HTML |
| Indices / gold / oil | `/api/edge/quotes` (Pages Function) | Yahoo spark (query1 → query2); Yahoo blocks browser CORS |

The edge functions are stateless, keyless, and cached at the edge for 60–300 s. The market module
adds a 60 s client cache and serves the last good data (`stale: true`) when every source fails —
it never invents numbers.

## Sessions, billing, privacy

- **Auth**: local device sessions (`src/lib/authApi.ts`). No accounts, no Google sign-in, no JWT
  server — a device id + token live in `localStorage`.
- **Billing**: local launch configuration (`src/lib/billingApi.ts`, key `sg16_launch_config_v1`).
  Launch mode = all features free; checkout is off until a payment provider is wired up. Admin can
  edit it on the device.
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
npm run dev:pages      # build + wrangler pages dev dist  (full stack incl. /api/edge/*)
npm run typecheck      # tsc --noEmit (src + functions)
npm test               # vitest unit tests for the ported logic
```

Deploy: `npm run pages:deploy` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`), or connect
the repo to Cloudflare Pages (build command `npm run build`, output directory `dist`, both inside
`project/`) — the `functions/` directory is deployed automatically.

# SG16 Architecture — SaaS engine on Cloudflare Pages

SG16 AI Engine is a **Vite + React PWA on Cloudflare Pages with a small backend in Pages
Functions**. It is **model-agnostic**: the owner connects one AI (an endpoint, a key and a model —
e.g. Cloudflare Workers AI) and every feature runs on it. Users sign up, pay and use the 5 Shields —
they never see a provider, key or model name. The browser talks only to SG16's own `/api/*`.

## This repo: SG16 AI Engine (`sg16engine.com`)

```
project/                  the app (Vite + React PWA) — the only product code
├── src/lib/ai/           AI layer: wire.ts calls /api/ai/* only (chat, vision, images, voice)
├── src/lib/codingShield/ Coding Shield — honest browser port (no CLI tools faked)
├── functions/api/ai/     backend: AI gateway (the owner's one AI connection)
├── functions/api/edge/   stateless Pages Functions: news RSS, web search, Yahoo quotes
├── public/_headers       security headers
└── public/_redirects     SPA fallback (Pages Functions take precedence)
```

**Hosting**: Cloudflare Pages project `sg16-ai-engine` — static `project/dist/` plus
`project/functions/`. Deployed by the Pages GitHub integration (see *Deploy* below); there is no
GitHub Actions workflow.

## How AI works (one connection, one model)

- **Backend** (`functions/api/ai/`): `POST /api/ai/chat`, `POST /api/ai/transcribe`,
  `POST /api/ai/image`, `GET /api/ai/status`. Every chat, Pilot, Shield, coding and photo question
  goes to the same model — the project never picks a model or a provider. Chat messages are tidied,
  never refused (unknown roles become `user`, long histories keep the system prompt plus the
  latest 80 turns).
- **Connection** (Cloudflare dashboard → Pages project → Settings → Variables and Secrets):

  | Variable | Required | Meaning |
  |----------|----------|---------|
  | `AI_BASE_URL` | yes | standard chat-completions endpoint, e.g. Cloudflare Workers AI `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1` |
  | `AI_API_KEY` | usually | type **Secret**; sent as `Authorization: Bearer …` (for Cloudflare: an API token with Workers AI permission) |
  | `AI_MODEL` | yes | the model, exactly as the provider names it — used for everything |
  | `AI_IMAGE_MODEL` | no | only if the connected AI can create images; blank = image creation off |
  | `AI_AUDIO_MODEL` | no | only if the connected AI can transcribe audio; blank = server voice fallback off (browsers with built-in speech recognition still work) |

  To switch AI, change these values — no code change, no rebuild of the design.

- **Browser**: `src/lib/ai/client.ts` (`chatCompletion`) is the single place chat requests leave the
  app; `wire.ts` only calls `/api/ai/*`. Chat, Pilot, Shields, student verification, image studio and
  voice all build on it. No endpoint, model name or key is ever in the bundle.
- **Zero-Data Trace**: the backend never logs or stores request bodies or upstream error text;
  users get short generic errors. Old device-side AI configs (`sg16_ai_config_v1`) are wiped on load.

## Data sources

| Data | Path | Notes |
|------|------|-------|
| AI chat/vision/images/voice | `/api/ai/*` (Pages Functions) | the owner's AI connection, see above |
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
                       # put the AI_* variables in project/.dev.vars — git-ignored)
npm run typecheck      # tsc --noEmit (src + functions)
npm test               # vitest unit tests for the ported logic
```

## Deploy (Cloudflare Pages ← GitHub)

Cloudflare dashboard → Workers & Pages → Create → Pages → *Connect to Git* → this repo, then:

| Setting | Value |
|---------|-------|
| Production branch | `sg16global` |
| Framework preset | None |
| Root directory | `project` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Then add the AI variables above (Settings → Variables and Secrets) and redeploy once.
Node comes from `project/.node-version`. Every push to the production branch deploys.

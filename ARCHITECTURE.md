# SG16 Architecture — project independence

## Brain (shared utility)

| Service | URL | Role |
|---------|-----|------|
| SG16 Mistral X | `https://api.mistralbrain.com` | Cloudflare Workers AI — primary brain for all SG16 AI products |

Each product calls the brain **directly** from its own Cloudflare Pages Functions (or from this Engine app for Engine users only).

## This repo: SG16 AI Engine (`sg16engine.com`)

**Railway product** — coding hub, shields, auth, PostgreSQL, React PWA.

- Brain mode: `SG16_BRAIN=mistralbrain` → calls `api.mistralbrain.com` (no local Ollama in production)
- **Not a hub** for children.com or ads network — those projects have their own direct brain routes

## Other SG16 products (separate repos / Pages projects)

| Project | Domain | Brain path |
|---------|--------|------------|
| Children World | sg16children.com | Own `functions/api/sg16/*` → api.mistralbrain.com |
| Ads Network | ads.saiftechglobal.com | Own `functions/api/brain/ad-copy` → api.mistralbrain.com |
| Finance | sg16finance.com | No brain — market data APIs only |
| Geo Monitor | saifglobal16.info | No brain — news/weather/NASA APIs only |
| Hub landing | saiftechglobal.com | Static links only |

## Failover (per project)

Each project owns its own fallback (offline demo, static copy, retry) — **no cross-project mixing through Engine**.

## Legacy

- `/api/sg16/*` routes on Engine remain for backward compatibility but are **deprecated** for sg16children.com production.
- Ollama/sovereign code paths in this repo are legacy; production Railway uses cloud brain only.

## Running locally

```bash
npm install --prefix backend && npm install --prefix project
cp backend/.env.example backend/.env    # fill in the keys you have
npm run dev                             # backend :8000 + frontend :5173
npm run api:check                       # confirms the backend answers
```

- No Postgres? The backend falls back to a JSON store.
- Chat needs an AI: set `AI_API_URL`, `AI_API_KEY` (optional) and `AI_MODEL` in `backend/.env`. Any
  OpenAI-compatible API works: OpenAI, Groq, OpenRouter, Mistral, or your own Ollama VPS (`http://IP:11434/v1`).
  `npm run api:check` sends a test prompt and shows whether the AI answers.
- UI only, against the live engine: set `SG16_DEV_API_TARGET=https://sg16engine.com` in `project/.env`, then `npm run dev -- --ui`.
- Check any deployment: `npm run api:check -- https://sg16engine.com`.

## Frontend API connection

All frontend calls go through `project/src/lib/apiClient.ts` (`apiRequest`):

- Same-origin by default; `VITE_API_BASE_URL` points a build at another backend origin.
- Errors are thrown as `ApiError` (`status`, `code`, `offline`, `unauthorized`) — responses are never faked.
- Every request updates the shared engine status (`lib/apiStatus.ts`). The sidebar, settings and
  `EngineOfflineBanner` read it, and the monitor re-checks `/health` every 15s while offline.
- A saved session is only cleared when the server rejects it (401), not when the engine is unreachable.

## Admin panel

- `/admin` (separate page, not indexed): owner login with `ADMIN_EMAIL` (default sg16global@gmail.com) and a
  password checked against `ADMIN_PASSWORD_HASH` (scrypt — `npm run admin:hash --prefix backend`).
- Live status boxes (AI brain answer test, connection, engine, live search, database) and an AI connection form
  (URL, key, model) with Test and Save. Saved settings apply at once to every shield.
- Code: `backend/lib/admin.js`, `project/src/components/admin/AdminApp.tsx`. Saved settings go to
  `backend/data/admin-config.json`; on Cloudflare the Worker also stores them in the Backend Durable Object
  (`cloudflare/src/backend.js`) so they survive container restarts.

## Hosting without Railway

- **Website**: Cloudflare Worker in `cloudflare/`. It serves the built React app and forwards `/api/*` and
  `/health` to the backend container. See `cloudflare/README.md`.
- **Backend**: Node (`backend/server.js`) as a Cloudflare Container in the same Worker, built from the
  `Dockerfile`. Deployed by `.github/workflows/deploy-cloudflare.yml` on every push to `main`.
- **Users**: no accounts and no Google sign-in. Each browser gets an anonymous device session
  (`POST /api/v1/auth/device`); chat history is stored only on the device, and the server refuses to store it.
- **AI**: any OpenAI-compatible API via `AI_API_URL` / `AI_API_KEY` / `AI_MODEL` in `backend/.env`.

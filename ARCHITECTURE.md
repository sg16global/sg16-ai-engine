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

# SG16 website on Cloudflare

```text
visitor ──► Cloudflare Worker (sg16engine.com)
              ├── pages, JS, images  → served by Cloudflare
              └── /api/*, /health    → Backend container (Node, on Cloudflare)
                                         └── AI → AI_API_URL (e.g. your VPS running Devstral)
users: no accounts, no Google sign-in — chat history stays on each user's device
```

The browser only talks to `sg16engine.com`, so there's no CORS setup to do. Google sign-in headers, real 404 pages and the shield subdomain all work the same as on the old server.

## How it runs

| Part | Where |
|---|---|
| Website pages | Cloudflare Worker `sg16-engine-web` (static assets) |
| Backend (`backend/server.js`) | Cloudflare Container `Backend`, built from the repo `Dockerfile`. It starts on the first request and sleeps after 15 minutes idle. |
| AI | Whatever `AI_API_URL` points to, for example your VPS |
| Users and chat history | **On each user's device.** No accounts, no Google sign-in; the server refuses to store history. |

Every push to `main` builds and deploys both parts through GitHub Actions (`.github/workflows/deploy-cloudflare.yml`). You don't need Docker on your PC.

## One-time setup

1. **Cloudflare API token for GitHub**
   - In the Cloudflare dashboard, go to My Profile → API Tokens → Create Token → template **"Edit Cloudflare Workers"**.
   - If the permission list offers **Containers**, add it with **Edit** access.
   - In GitHub, go to the repo → Settings → Secrets and variables → Actions, and add a secret named `CLOUDFLARE_API_TOKEN`.
2. **Backend secrets.** Set these once. They are passed into the container:

   ```bash
   cd cloudflare
   npx wrangler secret put JWT_SECRET          # any long random string (already set)
   npx wrangler secret put AI_API_URL          # SG16 Brain: https://mistralbrain.com/api/brain
   npx wrangler secret put AI_API_KEY          # SG16 Brain project key (sg16p_...)
   npx wrangler secret put AI_MODEL            # only for OpenAI-compatible APIs, e.g. devstral
   ```

   Optional: `AI_VISION_MODEL`, and `DATABASE_URL` (Postgres) only if student verification results must survive container restarts.
3. **Deploy.** Merge to `main`, or go to Actions → "Deploy to Cloudflare" → Run workflow.
   - The first container deploy takes several minutes.
   - Check it with `npm run api:check -- https://sg16-engine-web.sg16global.workers.dev`.

## Use the real domain

1. In the Cloudflare dashboard → `sg16engine.com` → DNS, delete the `A` record for `sg16engine.com`. That one record only; keep the MX and TXT email records.
2. In `wrangler.jsonc`, uncomment `routes`.
3. Push to `main`.

## Using an external backend instead

Set `BACKEND_URL` in `wrangler.jsonc` to its address, for example `https://api.example.com`. It must be a hostname, not a bare IP. Then `/api` goes there instead of the container.

## Costs and limits

- `basic` instance: 1/4 vCPU, 1 GiB RAM. It is billed only while awake, on top of the $5 Workers Paid plan.
- If Coding Shield scans run out of memory, change `instance_type` to `standard-1` (4 GiB).
- Cold start: a few seconds on the first request after the container has slept.

## Notes

- Unused legacy landing videos (`landing/*.mp4`) are not uploaded. Three of them are larger than Cloudflare's 25 MB per-file limit. See `project/public/.assetsignore`.
- If the backend is down, `/api` returns 503 and the app shows its "engine offline" banner.
- Run the tests with `npm test --prefix cloudflare`.

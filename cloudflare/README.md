# SG16 website on Cloudflare

```text
visitor ──► Cloudflare Worker (sg16engine.com)
              ├── pages, JS, images  → served by Cloudflare (free)
              └── /api/*, /health    → forwarded to your backend (BACKEND_URL, on your VPS)
                                         └── AI → AI_API_URL (backend/.env)
```

The browser only talks to `sg16engine.com`, so there's no CORS setup to do. Google sign-in headers, real 404 pages and the shield subdomain all work the same as on the old server.

## 1. Run the backend on your VPS

```bash
git clone https://github.com/sg16global/sg16-ai-engine.git && cd sg16-ai-engine
npm ci --prefix backend
cp backend/.env.example backend/.env    # set JWT_SECRET, GOOGLE_CLIENT_ID, AI_API_URL, AI_MODEL, DATABASE_URL (optional)
NODE_ENV=production node backend/server.js
```

Give the backend a **hostname**. Cloudflare Workers cannot call a bare IP address. Pick one option:

- **Cloudflare Tunnel** (no open ports). On the VPS, run `cloudflared tunnel` and map `api.sg16engine.com` to `http://localhost:8000`.
- **DNS record**. Add an `A` record `api` pointing to the VPS IP (proxied). Then run the backend behind nginx or Caddy on port 443.

Check it with `npm run api:check -- https://api.sg16engine.com`.

## 2. Upload the website

```bash
npm install --prefix cloudflare
npx --prefix cloudflare wrangler login     # opens Cloudflare in the browser, one time
```

Set `BACKEND_URL` in `cloudflare/wrangler.jsonc` (for example `https://api.sg16engine.com`), then:

```bash
npm run cf:deploy                          # builds the site and uploads it
```

You get a `https://sg16-engine-web.<you>.workers.dev` link to test.

## 3. Use the real domain

1. In the Cloudflare dashboard → `sg16engine.com` → DNS, delete the old Railway records for `@`, `www` and `shield`.
2. In `wrangler.jsonc`, uncomment `routes`.
3. Run `npm run cf:deploy` again.

## Notes

- Unused legacy landing videos (`landing/*.mp4`) are not uploaded. Three of them are larger than Cloudflare's 25 MB per-file limit. See `project/public/.assetsignore`.
- If the backend is down, `/api` returns 503 and the app shows its "engine offline" banner.
- Run the tests with `npm test --prefix cloudflare`.

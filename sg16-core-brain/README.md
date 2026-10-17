# SG16 Core Brain

The SG16 brain, running on Cloudflare. It needs no server, no Railway and no PC.

```text
request ──► SG16 Math Core ──► exact answer (arithmetic: answered instantly, free)
               │ verified result
               ▼
            Mistral 7B  (Cloudflare Workers AI, @cf/mistral/mistral-7b-instruct-v0.2-lora)
               │ only if the core model fails
               ▼
            Add-on APIs (optional, any OpenAI-compatible API)
               │ if everything fails but the math was solved
               ▼
            Math Core answer
```

- **Math Core** (`src/mathCore.js`) computes exactly, with no guessing:
  - arithmetic and percentages
  - linear and quadratic equations
  - linear systems with up to 6 unknowns
  - derivatives and simplification
  - **matrices**: determinant, inverse, transpose, trace, rank, eigenvalues, product, sum
  - **vectors**: dot, cross, norm, unit vector, angle

  Equation answers are checked by substitution. The verified result is given to Mistral, which explains it.
- **Core model**: Mistral 7B on Cloudflare's GPUs (15k-token context).
- **Add-on APIs**: optional. They are used only when the core cannot answer, for example after the daily free quota.

## API

Every endpoint except ping needs a key, sent as `X-Door-Key: <key>` or `Authorization: Bearer <key>`.

| Method | Path | Body | Use |
|---|---|---|---|
| GET | `/api/v1/ping` | none | Health check (no key needed) |
| POST | `/api/v1/control` | `{ task, user_text }` | SG16 AI Engine backend (`SG16_BRAIN=mistralbrain`) |
| POST | `/api/v1/vision` | `{ prompt, image_base64 }` | Image understanding (LLaVA 1.5 7B) |
| POST | `/api/v1/math` | `{ input }` | Math Core only, no model cost |
| GET | `/v1/models` | none | OpenAI-compatible model list |
| POST | `/v1/chat/completions` | `{ messages, max_tokens?, temperature?, stream? }` | OpenAI-compatible chat |

Because `/v1/chat/completions` is OpenAI-compatible, any OpenAI SDK, LangChain, Open WebUI or similar tool can connect. Set:

- base URL: `https://<brain-domain>/v1`
- API key: one of your `CORE_API_KEYS`
- model: `sg16-core`

```bash
curl https://<brain-domain>/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"sg16-core","messages":[{"role":"user","content":"inverse of [[4,7],[2,6]]"}]}'
```

## Deploy (one time)

```bash
cd sg16-core-brain
npm install
npx wrangler login                       # opens Cloudflare in the browser
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # make a key
npx wrangler secret put CORE_API_KEYS    # paste the key (comma-separate several)
npm run deploy                           # prints https://sg16-core-brain.<you>.workers.dev
```

**Recommended: keep the old address.** Children World and the Ads Network also call `api.mistralbrain.com`. Serve the new brain there and every product reconnects with no changes:

1. In the Cloudflare dashboard, open `mistralbrain.com` → DNS, and delete the old `api` record that pointed to Railway.
2. In `wrangler.jsonc`, add `"routes": [{ "pattern": "api.mistralbrain.com", "custom_domain": true }]`.
3. Run `npm run deploy` again.
4. Put the keys those products already send (`MISTRAL_BRAIN_KEY` / `DOOR_API_KEY`) into `CORE_API_KEYS`.

Then connect the SG16 AI Engine backend:

```env
SG16_BRAIN=mistralbrain
MISTRAL_BRAIN_URL=https://api.mistralbrain.com      # or the workers.dev URL
MISTRAL_BRAIN_KEY=<one of CORE_API_KEYS>
```

## Add-on APIs (optional)

```bash
npx wrangler secret put EXTRA_PROVIDERS
```

Paste a JSON array. Providers are tried in order, and only after the core model fails:

```json
[
  { "name": "openrouter", "url": "https://openrouter.ai/api/v1", "key": "sk-or-...", "model": "mistralai/mistral-7b-instruct" },
  { "name": "groq", "url": "https://api.groq.com/openai/v1", "key": "gsk_...", "model": "llama-3.1-8b-instant" }
]
```

## Limits and cost

- Workers AI gives **10,000 free neurons per day**, which is roughly 1,000 Mistral 7B chats. The count resets at 00:00 UTC.
- Beyond that, Cloudflare needs the Workers Paid plan ($5/month, then about $0.011 per 1,000 neurons). On the Free plan, requests over the limit fail and go to add-on APIs, or to the Math Core for math.
- Math Core answers cost nothing.

## Develop

```bash
npm test          # 31 tests: math core + API (Workers AI is mocked)
cp .dev.vars.example .dev.vars && npm run dev   # local; Workers AI calls go to your Cloudflare account
```

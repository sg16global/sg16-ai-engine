# SG16 sovereign stack — 100% Railway

Everything runs on Railway in one Docker service:

```text
World → Cloudflare → Railway
                         ├── Express API + React PWA
                         ├── PostgreSQL (Railway plugin)
                         └── Ollama + mistral:7b-instruct (localhost :11434)
```

No external VM. No Groq rental brain required when `SG16_BRAIN=ollama`.

## Deploy

1. Push to GitHub (Railway watches the repo).
2. Railway service uses `Dockerfile` + `scripts/start-railway.sh`.
3. Add **Postgres** plugin → copy `DATABASE_URL` into service variables.
4. Set auth vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `SG16_OWNER_EMAIL`.
5. First deploy pulls `mistral:7b-instruct` — allow ~10 min; health check timeout is 600s.

## Required Railway variables

| Variable | Value |
|----------|-------|
| `SG16_BRAIN` | `ollama` |
| `OLLAMA_URL` | `http://127.0.0.1:11434` |
| `SG16_OLLAMA_MODEL` | `mistral:7b-instruct` |
| `DATABASE_URL` | from Postgres plugin |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `JWT_SECRET` | random secret |
| `SG16_APP_URL` | `https://sg16engine.com` |

`railway.toml` sets brain defaults; override secrets in the Railway dashboard.

## Hardware

Recommend **8 GB+ RAM** on the Railway service for `mistral:7b-instruct`.

## Verify

```bash
curl https://sg16engine.com/health
```

Expect `"brain": "mistral-ollama"`, `"sovereign": true`, and database `ready`.

## Local dev (optional)

Run Ollama on your machine, then:

```bash
SG16_BRAIN=ollama OLLAMA_URL=http://127.0.0.1:11434 npm start
```

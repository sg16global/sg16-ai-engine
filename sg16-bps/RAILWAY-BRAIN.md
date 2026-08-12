# Railway enterprise + sovereign VM brain

**Railway carries the full product** — domain, Node API, Postgres, OAuth, deploys from GitHub.

**Your Mistral brain stays on the VM.** Railway is not limited to Groq. Set `SG16_BRAIN=ollama` and Railway calls your VM over `OLLAMA_URL`.

This is the **production sovereign stack** while DNS still points at Railway (polish phase). Same code path as full VM deploy later.

```text
World → Cloudflare → Railway (sg16engine.com, API, DB, auth)
                         ↓  OLLAMA_URL
                    VM (Mistral / Ollama :11434)
```

Groq/OpenRouter keys can stay as **optional fallback** — primary brain is yours when `SG16_BRAIN=ollama`.

## 1. On Google VM (SSH)

```bash
cd /opt/sg16/app
sudo bash sg16-bps/scripts/enable-ollama-for-railway.sh
```

Copy the **VM IP** it prints.

## 2. On Railway (dashboard or CLI)

| Variable | Value |
|----------|--------|
| `SG16_BRAIN` | `ollama` |
| `OLLAMA_URL` | `http://YOUR_VM_EXTERNAL_IP:11434` |
| `SG16_OLLAMA_MODEL` | `mistral:7b-instruct` |
| `SG16_CHAT_TIMEOUT_MS` | `120000` |

**One command (from PC, in repo folder, Railway CLI linked):**

```bash
bash sg16-bps/scripts/set-railway-sovereign-brain.sh YOUR_VM_EXTERNAL_IP
```

Redeploy Railway service (auto on variable change).

## 3. Check

```bash
curl -s https://sg16engine.com/health
```

Expect: `"brain":"mistral-ollama"`, `"sovereign":true`, `"primary":"ollama"`.

## Google Cloud firewall

If Railway cannot reach Ollama, add **VPC firewall rule**: allow **TCP 11434** to the VM tag (or source `0.0.0.0/0` temporarily while testing).

## Later (Contabo move)

Same pattern: new VM IP → update `OLLAMA_URL` on Railway until DNS moves to VPS.

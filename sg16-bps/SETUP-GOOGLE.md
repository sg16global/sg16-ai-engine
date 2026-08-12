# SG16 BPS — Google VM quick path (boss)

Brain on Railway now. Move to VM when ready — use this checklist.

## Phase A — Now (Railway field)

- Site live on Railway + Cloudflare ✅
- `centralRules: loaded` on `/health` ✅
- Finish Dodo + OAuth when ready

## Phase B — VM update (when VM already bootstrapped)

SSH into Google VM:

```bash
cd /opt/sg16/app
sudo git pull origin main
sudo bash sg16-bps/update-vm.sh
```

Or GitHub → Actions → **Deploy SG16 BPS** → Run workflow.

## Phase C — Fresh VM (first time)

```bash
sudo mkdir -p /opt/sg16
sudo git clone https://github.com/sg16global/sg16-ai-engine.git /opt/sg16/app
cd /opt/sg16/app
sudo bash sg16-bps/bootstrap.sh
```

Installs: Node, Ollama, Mistral, Coding Shield CLIs, Trivy/Lynis/Nuclei, **Fail2ban**, ufw.

## Phase D — Environment

```bash
sudo nano /opt/sg16/.env
```

Minimum:

- `SG16_BRAIN=ollama`
- `GOOGLE_CLIENT_ID=` + `GOOGLE_CLIENT_SECRET=`
- `JWT_SECRET=` (random string)
- `DATABASE_URL=` (copy from Railway if using Postgres)

```bash
sudo systemctl restart sg16-ai-engine
curl -s http://127.0.0.1:8000/health
```

Expect: `"brain":"mistral-ollama"`, `"sovereign":true`, `"centralRules":"loaded"`.

## Phase E — Ready check (before DNS flip)

```bash
sudo bash /opt/sg16/app/sg16-bps/scripts/vm-ready.sh
```

All OK → safe to move traffic.

## Phase F — Final move (Cloudflare)

1. Google Console → VM **Running** 24/7
2. Cloudflare → **sg16engine.com** → DNS
3. Change **A record** `@` → VM external IP (proxy ON 🟠)
4. Wait 2–5 min → `curl https://sg16engine.com/health` → `mistral-ollama`
5. Keep Railway as backup (don't delete yet)

## GitHub auto-deploy secrets

| Secret | Value |
|--------|--------|
| `BPS_HOST` | VM external IP |
| `BPS_SSH_KEY` | SSH private key |
| `BPS_SSH_USER` | sudo user |

## Before Google credit ends

Same `bootstrap.sh` on **Contabo Cloud VPS 6** (Singapore) → copy `.env` → DNS flip → stop Google VM.

## Scripts reference

| Script | When |
|--------|------|
| `bootstrap.sh` | Fresh VPS |
| `update-vm.sh` | After git push |
| `deploy.sh` | Called by GitHub Actions |
| `vm-ready.sh` | Before DNS flip |
| `check-vm-security.sh` | Quick Fail2ban/nmap check |
| `scan-platform.sh` | Trivy/Lynis/Nuclei scan |

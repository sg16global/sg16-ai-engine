# SG16 BPS — Google VM quick path (boss)

Brain is already on `sg16-jet`. Finish the automatic stack:

## 1. On Google VM (SSH)

```bash
# Clone repo (replace with your fork if needed)
sudo mkdir -p /opt/sg16
sudo git clone https://github.com/sg16global/sg16-ai-engine.git /opt/sg16/app
cd /opt/sg16/app
sudo bash sg16-bps/bootstrap.sh
```

If repo is private, use deploy key or clone from your machine first.

## 2. Environment

```bash
sudo nano /opt/sg16/.env
```

Set at minimum:

- `SG16_BRAIN=ollama` (already in env.example)
- `GOOGLE_CLIENT_ID=` your OAuth client

```bash
sudo systemctl restart sg16-ai-engine
curl -s http://127.0.0.1:8000/health
```

Expect `"brain": "mistral-ollama"` and `"primary": "ollama"`.

## 3. GitHub auto-deploy

Repo → **Settings → Secrets → Actions**:

| Secret | Value |
|--------|--------|
| `BPS_HOST` | Google VM external IP |
| `BPS_SSH_KEY` | SSH private key |
| `BPS_SSH_USER` | user that can `sudo` deploy (or `root`) |

Actions → **Deploy SG16 BPS** → Run workflow.

## 4. Domain (when ready)

Point `sg16engine.com` A record → VM IP, or use Cloudflare Tunnel.

## 5. Before day 90 (Google credit ends)

Run same `sg16-bps/bootstrap.sh` on Contabo or your KL PC — portable house.

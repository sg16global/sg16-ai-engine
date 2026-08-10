# Deploy Coding Shield subdomain

## Subdomain

**`shield.sg16engine.com`** → same Railway service as sg16engine.com

## Cloudflare DNS

1. Cloudflare dashboard → **sg16engine.com** → DNS
2. Add record:
   - **Type:** CNAME
   - **Name:** `shield`
   - **Target:** your Railway service hostname (same as main domain target)  
     OR use Railway custom domain flow (below)

## Railway custom domain

1. Railway → project **authentic-essence** → service **sg16-ai-engine**
2. **Settings → Networking → Custom Domain**
3. Add: `shield.sg16engine.com`
4. Copy Railway’s CNAME target into Cloudflare if needed
5. Wait for SSL (usually a few minutes)

## Environment (optional)

```env
SG16_SHIELD_HOST=shield.sg16engine.com
SG16_APP_URL=https://sg16engine.com
```

## Verify

```bash
curl https://shield.sg16engine.com
curl https://shield.sg16engine.com/api/v1/coding-shield/health
curl https://sg16engine.com/api/v1/coding-shield/health
```

## Semgrep + Gitleaks on Railway

`nixpacks.toml` installs Linux CLIs during build. After deploy, health endpoint shows `clis.semgrep` and `clis.gitleaks` as `true`.

## No git / promote until boss says yes

Local changes only until you approve commit + push.

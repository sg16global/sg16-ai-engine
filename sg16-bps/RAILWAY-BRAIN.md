# Railway site + sovereign VM brain

**Site stays on Railway.** **Brain stays Mistral on Google VM.** Railway calls your VM over `OLLAMA_URL`.

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

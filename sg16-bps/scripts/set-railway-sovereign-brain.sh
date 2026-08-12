#!/usr/bin/env bash
# Wire Railway (enterprise site host) to sovereign Mistral on your VM.
# Usage: bash sg16-bps/scripts/set-railway-sovereign-brain.sh YOUR_VM_EXTERNAL_IP
set -euo pipefail

IP="${1:-}"
if [[ -z "${IP}" ]]; then
  echo "Usage: bash sg16-bps/scripts/set-railway-sovereign-brain.sh YOUR_VM_EXTERNAL_IP"
  echo "Run enable-ollama-for-railway.sh on the VM first to get the IP."
  exit 1
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "Install Railway CLI: https://docs.railway.com/guides/cli"
  exit 1
fi

OLLAMA_URL="http://${IP}:11434"

echo "Setting Railway sovereign brain (site stays on Railway, brain on VM)..."
railway variables set \
  SG16_BRAIN=ollama \
  "OLLAMA_URL=${OLLAMA_URL}" \
  SG16_OLLAMA_MODEL=mistral:7b-instruct \
  SG16_CHAT_TIMEOUT_MS=120000 \
  SG16_CODING_TIMEOUT_MS=180000

echo ""
echo "Redeploy triggers automatically. Then check:"
echo "  curl -s https://sg16engine.com/health"
echo "Expect: brain=mistral-ollama, sovereign=true, primary=ollama"

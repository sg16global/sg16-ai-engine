#!/usr/bin/env bash
# Let Railway reach Mistral on this VM (temporary — lock down before full production).
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run as root: sudo bash sg16-bps/scripts/enable-ollama-for-railway.sh"
  exit 1
fi

mkdir -p /etc/systemd/system/ollama.service.d
cat >/etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

systemctl daemon-reload
systemctl restart ollama

ufw allow 11434/tcp comment 'Ollama for Railway brain link' || true

IP=$(curl -sf -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || true)
if [[ -z "${IP}" ]]; then
  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

echo ""
echo "Ollama listening on 0.0.0.0:11434"
echo "VM IP for Railway OLLAMA_URL: ${IP:-UNKNOWN — check Google Console}"
echo ""
echo "Railway variables:"
echo "  SG16_BRAIN=ollama"
echo "  OLLAMA_URL=http://${IP:-YOUR_VM_IP}:11434"
echo "  SG16_OLLAMA_MODEL=mistral:7b-instruct"
echo ""
curl -sf "http://127.0.0.1:11434/api/tags" | head -c 200 || echo "ollama: check journalctl -u ollama"

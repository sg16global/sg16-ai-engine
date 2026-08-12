#!/usr/bin/env bash
# Pre-move checklist — run on VM before Cloudflare DNS flip (read-only checks).
set -euo pipefail

SG16_HOME="${SG16_HOME:-/opt/sg16}"
ENV_FILE="${SG16_HOME}/.env"
HEALTH_URL="${SG16_HEALTH_URL:-http://127.0.0.1:8000/health}"

pass=0
fail=0

ok() { echo "  OK   $1"; pass=$((pass + 1)); }
miss() { echo "  FAIL $1"; fail=$((fail + 1)); }

echo "== SG16 VM ready checklist =="

if systemctl is-active --quiet sg16-ai-engine; then ok "sg16-ai-engine running"; else miss "sg16-ai-engine not running"; fi
if systemctl is-active --quiet ollama; then ok "ollama running"; else miss "ollama not running"; fi

if [[ -f "${ENV_FILE}" ]]; then
  ok ".env exists"
  grep -q '^SG16_BRAIN=ollama' "${ENV_FILE}" && ok "SG16_BRAIN=ollama" || miss "set SG16_BRAIN=ollama in .env"
  grep -q '^GOOGLE_CLIENT_ID=.\+' "${ENV_FILE}" && ok "GOOGLE_CLIENT_ID set" || miss "GOOGLE_CLIENT_ID empty"
else
  miss ".env missing at ${ENV_FILE}"
fi

if curl -sf "${HEALTH_URL}" | grep -q 'mistral-ollama'; then
  ok "/health brain=mistral-ollama"
else
  miss "/health — expect brain mistral-ollama (curl ${HEALTH_URL})"
fi

if curl -sf "${HEALTH_URL}" | grep -q '"centralRules":"loaded"'; then
  ok "centralRules loaded"
else
  miss "centralRules not loaded — git pull main and restart"
fi

if command -v fail2ban-client >/dev/null 2>&1; then ok "fail2ban installed"; else miss "fail2ban missing"; fi
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q 'Status: active'; then ok "ufw active"; else miss "ufw not active"; fi

echo ""
echo "Pass: ${pass}  Fail: ${fail}"
if [[ "${fail}" -eq 0 ]]; then
  echo "READY — safe to flip Cloudflare DNS to this VM IP."
else
  echo "NOT READY — fix FAIL items before DNS flip."
  exit 1
fi

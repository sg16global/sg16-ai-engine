#!/usr/bin/env bash
# SG16 BPS — one-shot bootstrap for fresh Ubuntu/Debian (Google VM, Contabo, home PC).
# Run: curl -fsSL ... | bash   OR   sudo bash sg16-bps/bootstrap.sh
set -euo pipefail

SG16_USER="${SG16_USER:-sg16}"
SG16_HOME="${SG16_HOME:-/opt/sg16}"
SG16_APP="${SG16_APP:-${SG16_HOME}/app}"
SG16_REPO="${SG16_REPO:-https://github.com/sg16global/sg16-ai-engine.git}"
SG16_BRANCH="${SG16_BRANCH:-main}"
OLLAMA_MODEL="${OLLAMA_MODEL:-mistral:7b-instruct}"

echo "== SG16 BPS bootstrap =="

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run as root: sudo bash sg16-bps/bootstrap.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ca-certificates gnupg ufw build-essential python3 python3-pip

# Node.js 20 LTS
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Ollama + Mistral brain
if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
systemctl enable ollama
systemctl start ollama
ollama pull "${OLLAMA_MODEL}" || true

mkdir -p /etc/systemd/system/ollama.service.d
cat >/etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
EOF
systemctl daemon-reload
systemctl restart ollama

# Coding Shield CLIs (Linux)
pip3 install semgrep --break-system-packages 2>/dev/null || pip3 install semgrep || true
if ! command -v gitleaks >/dev/null 2>&1; then
  curl -sSfL https://github.com/gitleaks/gitleaks/releases/download/v8.24.2/gitleaks_8.24.2_linux_x64.tar.gz \
    | tar xz -C /usr/local/bin gitleaks
  chmod +x /usr/local/bin/gitleaks
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [[ -f "${REPO_ROOT}/package.json" && -f "${REPO_ROOT}/backend/server.js" ]]; then
  SG16_APP="${REPO_ROOT}"
  echo "Using repo at ${SG16_APP}"
fi

if [[ -f "${SCRIPT_DIR}/scripts/install-platform-tools.sh" ]]; then
  bash "${SCRIPT_DIR}/scripts/install-platform-tools.sh" || echo "Platform tools partial — continuing bootstrap"
fi

if [[ -f "${SCRIPT_DIR}/scripts/install-vm-security.sh" ]]; then
  bash "${SCRIPT_DIR}/scripts/install-vm-security.sh" || echo "VM security partial — continuing bootstrap"
fi

mkdir -p /opt/sg16/scans
id -u "${SG16_USER}" >/dev/null 2>&1 || useradd --system --home "${SG16_HOME}" --shell /usr/sbin/nologin "${SG16_USER}"
mkdir -p "${SG16_APP}"
chown -R "${SG16_USER}:${SG16_USER}" "${SG16_HOME}"

# Clone or update repo
if [[ -f "${SG16_APP}/package.json" ]]; then
  echo "App tree ready at ${SG16_APP}"
elif [[ ! -d "${SG16_APP}/.git" ]]; then
  sudo -u "${SG16_USER}" git clone --branch "${SG16_BRANCH}" --depth 1 "${SG16_REPO}" "${SG16_APP}"
else
  sudo -u "${SG16_USER}" git -C "${SG16_APP}" fetch origin "${SG16_BRANCH}"
  sudo -u "${SG16_USER}" git -C "${SG16_APP}" checkout "${SG16_BRANCH}"
  sudo -u "${SG16_USER}" git -C "${SG16_APP}" pull --ff-only origin "${SG16_BRANCH}" || true
fi

# Environment (edit secrets after bootstrap)
ENV_FILE="${SG16_HOME}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${SG16_APP}/sg16-bps/env.example" "${ENV_FILE}"
  chown "${SG16_USER}:${SG16_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  echo "Created ${ENV_FILE} — add GOOGLE_CLIENT_ID and secrets before going live."
fi

chmod +x "${SG16_APP}/sg16-bps/scripts/"*.sh 2>/dev/null || true

# Build
sudo -u "${SG16_USER}" bash -lc "cd '${SG16_APP}' && npm ci && npm run build"

# systemd
install -m 644 "${SG16_APP}/sg16-bps/systemd/sg16-ai-engine.service" /etc/systemd/system/sg16-ai-engine.service
systemctl daemon-reload
systemctl enable sg16-ai-engine
systemctl restart sg16-ai-engine || systemctl start sg16-ai-engine

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo ""
echo "SG16 BPS bootstrap complete."
echo "  Health: curl -s http://127.0.0.1:8000/health | head"
echo "  Logs:   journalctl -u sg16-ai-engine -f"
echo "  Brain:  ollama list"
echo "  Platform: curl -s http://127.0.0.1:8000/api/v1/platform-shield/health"
echo "  Scan VPS: sudo bash sg16-bps/scripts/scan-platform.sh"
echo "  VM ready: sudo bash sg16-bps/scripts/vm-ready.sh"

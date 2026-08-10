#!/usr/bin/env bash
# Run on the VPS as root after git push (also called from GitHub Actions).
set -euo pipefail

SG16_HOME="${SG16_HOME:-/opt/sg16}"
SG16_APP="${SG16_APP:-${SG16_HOME}/app}"
SG16_BRANCH="${SG16_BRANCH:-main}"
SG16_USER="${SG16_USER:-sg16}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run as root: sudo bash sg16-bps/deploy.sh"
  exit 1
fi

cd "${SG16_APP}"
sudo -u "${SG16_USER}" git fetch origin "${SG16_BRANCH}"
sudo -u "${SG16_USER}" git checkout "${SG16_BRANCH}"
sudo -u "${SG16_USER}" git pull --ff-only origin "${SG16_BRANCH}"
sudo -u "${SG16_USER}" bash -lc "cd '${SG16_APP}' && npm ci && npm run build"
systemctl restart sg16-ai-engine
echo "Deploy OK — $(date -u +%Y-%m-%dT%H:%M:%SZ)"

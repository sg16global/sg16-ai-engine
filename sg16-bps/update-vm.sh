#!/usr/bin/env bash
# Update existing VM after git push (same as deploy.sh + health check).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/deploy.sh"

HEALTH_URL="${SG16_HEALTH_URL:-http://127.0.0.1:8000/health}"
echo ""
echo "Health:"
curl -sf "${HEALTH_URL}" | head -c 400 || echo "health check failed"
echo ""

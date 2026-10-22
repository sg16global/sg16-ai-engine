#!/usr/bin/env bash
set -euo pipefail

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"
export NODE_PATH="${NODE_PATH:-/app/node_modules:/app/backend/node_modules}"
export SG16_CHILDREN_ENABLED="${SG16_CHILDREN_ENABLED:-0}"

echo "[SG16] Starting SG16 AI Engine — AI from AI_API_URL (AI_API_URL_2…_5 are automatic fallbacks)"
exec node backend/server.js

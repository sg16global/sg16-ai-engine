#!/usr/bin/env bash
set -euo pipefail

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"
export NODE_PATH="${NODE_PATH:-/app/node_modules:/app/backend/node_modules}"
export SG16_BRAIN="${SG16_BRAIN:-mistralbrain}"
export SG16_CHILDREN_ENABLED="${SG16_CHILDREN_ENABLED:-1}"

echo "[SG16] Starting SG16 AI Engine — brain=${SG16_BRAIN} (cloud only, no local Ollama)"
exec node backend/server.js

#!/usr/bin/env bash
set -euo pipefail

export OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
export OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
export SG16_BRAIN="${SG16_BRAIN:-ollama}"
export SG16_OLLAMA_MODEL="${SG16_OLLAMA_MODEL:-mistral:7b-instruct}"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"

echo "[SG16] Starting Ollama (${OLLAMA_HOST})..."
ollama serve &
OLLAMA_PID=$!

cleanup() {
  kill "${OLLAMA_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "[SG16] Waiting for Ollama API..."
for i in $(seq 1 90); do
  if curl -sf "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "${OLLAMA_PID}" 2>/dev/null; then
    echo "[SG16] Ollama exited unexpectedly"
    exit 1
  fi
  sleep 2
done

if ! curl -sf "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
  echo "[SG16] Ollama failed to start within timeout"
  exit 1
fi

echo "[SG16] Pulling model ${SG16_OLLAMA_MODEL}..."
ollama pull "${SG16_OLLAMA_MODEL}"

echo "[SG16] Starting SG16 API on ${HOST}:${PORT}..."
exec node backend/server.js

#!/usr/bin/env bash
set -euo pipefail

export OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
export OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
export SG16_BRAIN="${SG16_BRAIN:-ollama}"
export SG16_OLLAMA_MODEL="${SG16_OLLAMA_MODEL:-mistral:7b-instruct}"
export OLLAMA_KEEP_ALIVE="${OLLAMA_KEEP_ALIVE:-24h}"
export SG16_CHILDREN_ENABLED="${SG16_CHILDREN_ENABLED:-0}"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"
export NODE_PATH="${NODE_PATH:-/app/node_modules:/app/backend/node_modules}"

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

MODEL_TAG="${SG16_OLLAMA_MODEL%%:*}"
if ollama list 2>/dev/null | grep -q "${MODEL_TAG}"; then
  echo "[SG16] Model ${SG16_OLLAMA_MODEL} already loaded — skipping pull"
else
  echo "[SG16] Pulling model ${SG16_OLLAMA_MODEL}..."
  ollama pull "${SG16_OLLAMA_MODEL}"
fi

echo "[SG16] Warming ${SG16_OLLAMA_MODEL} before accepting traffic..."
if curl -sf --max-time 180 "${OLLAMA_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${SG16_OLLAMA_MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"stream\":false}" \
  >/dev/null; then
  echo "[SG16] Model warm — ready for chat."
else
  echo "[SG16] Model warm skipped (will load on first chat)."
fi

exec node backend/server.js

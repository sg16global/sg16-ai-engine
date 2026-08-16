#!/usr/bin/env bash
# One command: backend + Vite for live-reload studio dev.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SG16_DEV_STUDIO=1

npm run dev --prefix backend &
BACKEND_PID=$!
npm run dev --prefix project &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "SG16 Personal Developer (dev)"
echo "  Studio UI:  http://localhost:5173/developer"
echo "  API:        http://localhost:8000"
echo "  Ctrl+C stops both servers"
echo ""

wait

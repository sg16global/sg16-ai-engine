#!/usr/bin/env bash
# Cloud Agent install for SG16 AI Engine.
# Idempotent: safe to re-run and safe to run on top of a prebuilt snapshot.
# Prepares Node deps, the sovereign Ollama brain + a small dev model, the
# Coding Shield CLIs (semgrep + gitleaks), a built frontend, and a dev .env.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
DEV_MODEL="${SG16_OLLAMA_MODEL:-llama3.2:1b}"
GITLEAKS_VERSION="8.24.2"

log() { echo "[sg16-install] $*"; }

# 1. Node dependencies (root includes devDeps that power Coding Shield).
log "Installing Node dependencies (root, frontend, backend)..."
npm ci --include=dev
npm ci --prefix project
npm ci --prefix backend

# 2. System tooling for the Coding Shield security scanners + Ollama.
#    Guarded so a snapshot that already has them skips straight through.
ensure_apt_pkg() {
  local pkg="$1"
  if ! dpkg -s "$pkg" >/dev/null 2>&1; then
    log "Installing system package: $pkg"
    sudo apt-get update -qq || true
    sudo apt-get install -y -qq "$pkg" || true
  fi
}

if ! command -v ollama >/dev/null 2>&1; then
  ensure_apt_pkg zstd
  log "Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

if ! command -v gitleaks >/dev/null 2>&1; then
  log "Installing gitleaks ${GITLEAKS_VERSION}..."
  curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    | sudo tar xz -C /usr/local/bin gitleaks
  sudo chmod +x /usr/local/bin/gitleaks
fi

if ! command -v semgrep >/dev/null 2>&1; then
  log "Installing semgrep..."
  pip install --break-system-packages --quiet semgrep || pip install --quiet semgrep || true
  # semgrep installs under ~/.local/bin; expose it on the system PATH.
  for bin in semgrep pysemgrep; do
    if [ -x "$HOME/.local/bin/$bin" ]; then
      sudo ln -sf "$HOME/.local/bin/$bin" "/usr/local/bin/$bin"
    fi
  done
fi

# 3. Pull the small sovereign dev model if it is not already cached.
#    A temporary server is started just for the pull; the long-lived
#    `ollama serve` is owned by the `ollama` terminal on each boot.
if command -v ollama >/dev/null 2>&1; then
  MODEL_TAG="${DEV_MODEL%%:*}"
  if ! ollama list 2>/dev/null | grep -q "$MODEL_TAG"; then
    log "Pulling sovereign dev model ${DEV_MODEL}..."
    OLLAMA_HOST="$OLLAMA_HOST" ollama serve >/tmp/ollama-install.log 2>&1 &
    OLLAMA_PID=$!
    for _ in $(seq 1 30); do
      curl -sf "${OLLAMA_URL}/api/tags" >/dev/null 2>&1 && break
      sleep 1
    done
    OLLAMA_HOST="$OLLAMA_HOST" ollama pull "$DEV_MODEL" || true
    kill "$OLLAMA_PID" 2>/dev/null || true
    wait "$OLLAMA_PID" 2>/dev/null || true
  else
    log "Model ${DEV_MODEL} already present — skipping pull."
  fi
fi

# 4. Dev backend env (gitignored). Created once; never overwrites local edits.
if [ ! -f backend/.env ]; then
  log "Writing dev backend/.env..."
  cat > backend/.env <<'ENV'
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Dev-only session secret (never used in production)
JWT_SECRET=sg16-dev-local-secret-change-me

# Sovereign brain: local Ollama with a small, fast dev model
SG16_BRAIN=ollama
OLLAMA_URL=http://127.0.0.1:11434
SG16_OLLAMA_MODEL=llama3.2:1b
OLLAMA_KEEP_ALIVE=24h

# Launch mode: all features free, checkout disabled, preview sign-in enabled
SG16_LAUNCH_FREE=1

# No GOOGLE_CLIENT_ID / DATABASE_URL in dev -> dev auth + JSON ledger fallback
ENV
fi

# 5. Build the frontend so the backend can serve the PWA on :8000 immediately.
log "Building frontend (Vite -> backend/public)..."
npm run build --prefix project

log "Install complete."

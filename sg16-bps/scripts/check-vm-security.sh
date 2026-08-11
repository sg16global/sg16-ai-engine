#!/usr/bin/env bash
# Quick check — are grandpa-layer tools present? (no heavy scans)
set -euo pipefail

echo "== SG16 VM security checklist (read-only) =="

check() {
  if command -v "$1" >/dev/null 2>&1; then
    echo "  OK   $1"
  else
    echo "  MISS $1"
  fi
}

check fail2ban-client
check nmap
check ufw
check trivy
check lynis
check nuclei

if command -v fail2ban-client >/dev/null 2>&1; then
  fail2ban-client status 2>/dev/null | head -3 || true
fi

if command -v ufw >/dev/null 2>&1; then
  ufw status 2>/dev/null | head -5 || true
fi

echo "Done — install missing tools before sovereign go-live."

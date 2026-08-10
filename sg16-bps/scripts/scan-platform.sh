#!/usr/bin/env bash
# Run platform scans on YOUR VPS + YOUR domains (defensive only).
set -euo pipefail

SG16_APP="${SG16_APP:-/opt/sg16/app}"
SCAN_URL="${SG16_SCAN_URL:-https://sg16engine.com}"
OUT_DIR="${SG16_SCAN_OUT:-/opt/sg16/scans}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "${OUT_DIR}"

echo "== SG16 platform scan ${TS} =="

if command -v lynis >/dev/null 2>&1; then
  echo "-- Lynis (VPS hardening) --"
  lynis audit system --quick --no-colors >"${OUT_DIR}/lynis-${TS}.log" 2>&1 || true
  tail -5 "${OUT_DIR}/lynis-${TS}.log" || true
fi

if command -v trivy >/dev/null 2>&1; then
  echo "-- Trivy (filesystem CVE + secrets) --"
  trivy fs --scanners vuln,secret,misconfig \
    --severity HIGH,CRITICAL \
    "${SG16_APP}" >"${OUT_DIR}/trivy-fs-${TS}.log" 2>&1 || true
  tail -10 "${OUT_DIR}/trivy-fs-${TS}.log" || true
fi

if command -v nuclei >/dev/null 2>&1 && [[ -n "${SCAN_URL}" ]]; then
  echo "-- Nuclei (live URL) ${SCAN_URL} --"
  nuclei -u "${SCAN_URL}" -severity medium,high,critical \
    -o "${OUT_DIR}/nuclei-${TS}.txt" 2>/dev/null || true
  wc -l "${OUT_DIR}/nuclei-${TS}.txt" 2>/dev/null || echo "nuclei: done"
fi

echo "Reports: ${OUT_DIR}"

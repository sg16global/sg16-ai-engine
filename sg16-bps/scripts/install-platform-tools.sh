#!/usr/bin/env bash
# Tier 1 platform armor — Apache 2.0 / OSS tools only (no rental SaaS).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "== SG16 platform tools (Trivy, Lynis, Nuclei) =="

apt-get install -y lynis unzip jq || true

if ! command -v trivy >/dev/null 2>&1; then
  curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

if ! command -v nuclei >/dev/null 2>&1; then
  curl -sfL https://raw.githubusercontent.com/projectdiscovery/nuclei/main/cmd/nuclei/install.sh | bash
  if [[ -x "${HOME}/go/bin/nuclei" ]]; then
    ln -sf "${HOME}/go/bin/nuclei" /usr/local/bin/nuclei
  fi
fi

if command -v nuclei >/dev/null 2>&1; then
  nuclei -update-templates 2>/dev/null || true
fi

echo "Platform tools:"
command -v trivy >/dev/null && trivy --version | head -1 || echo "  trivy: missing"
command -v lynis >/dev/null && lynis --version 2>/dev/null | head -1 || echo "  lynis: missing"
command -v nuclei >/dev/null && nuclei -version 2>/dev/null | head -1 || echo "  nuclei: missing"

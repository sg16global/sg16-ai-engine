#!/usr/bin/env bash
# Grandpa layer — Fail2ban + Nmap (optional, do not block bootstrap).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "== SG16 VM security (Fail2ban + Nmap) =="

apt-get install -y fail2ban nmap || echo "  apt install partial — continuing"

if [[ ! -f /etc/fail2ban/jail.local ]]; then
  cat >/etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
EOF
  systemctl enable fail2ban 2>/dev/null || true
  systemctl restart fail2ban 2>/dev/null || true
fi

command -v fail2ban-client >/dev/null && fail2ban-client status 2>/dev/null | head -3 || true
command -v nmap >/dev/null && nmap --version | head -1 || echo "  nmap: missing"

echo "VM security install done."

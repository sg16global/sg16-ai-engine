# Shared scan tools — all SG16 projects

Coding Shield runs 10 tools. **8 are master tools** — reuse on any Node/JS repo (sg16finance, saifglobal16, etc.).

| Tool | All projects? | Notes |
|------|---------------|-------|
| Gitleaks | ✅ | Secrets in any git tree |
| npm audit | ✅ | Any Node `package.json` |
| Semgrep | ✅ | SAST with shared rules |
| ESLint + SonarJS | ✅ | JS/TS quality |
| Acorn / Esprima | ✅ | JS syntax |
| Retire.js | ✅ | Vulnerable front-end libs |
| TypeScript (tsc) | ✅ | TS projects |
| depcheck | ✅ | Unused deps |
| NYC (Istanbul) | 🟡 | Only if project has tests |
| Coding Hub deep scan UX | ❌ | Coding Shield product only |

## Platform Shield (Railway container)

| Tool | Role |
|------|------|
| Trivy | Filesystem CVE + secrets |
| Lynis | OS hardening |
| Nuclei | Live URL patterns |

Run platform scans: `sudo bash sg16-bps/scripts/scan-platform.sh`

# SG16 Coding Shield — Super Brain Stack

**Subdomain:** [shield.sg16engine.com](https://shield.sg16engine.com)  
**API:** `POST /api/v1/coding-shield/scan`

## 10 tools (7 core + 3 power)

| Tier | Tool | Role |
|------|------|------|
| Core 1 | **Semgrep** | Security SAST |
| Core 2 | **SonarQube / SonarLint** | SonarJS rules via ESLint |
| Core 3 | **Gitleaks** | Secret leaks (+ built-in patterns fallback) |
| Core 4 | **Acorn / Esprima** | JS syntax AST |
| Core 5 | **Retire.js** | Vulnerable JS libraries |
| Core 6 | **Istanbul (NYC)** | Test coverage |
| Core 7 | **ESLint** | Lint + quality |
| Power 8 | **npm audit** | Dependency CVEs |
| Power 9 | **TypeScript (tsc)** | Type safety |
| Power 10 | **depcheck** | Unused dependencies |

## Commands

```bash
npm run shield           # full 10-tool project scan
npm run shield:eslint    # single tool
npm run shield:audit
npm run shield:tsc
npm run shield:depcheck
```

## Coding Hub (live API)

- **Fast scan** (free): ESLint + Acorn/Esprima + secret patterns  
- **Deep scan** (premium): + Semgrep on snippet  

## Deploy subdomain

See [DEPLOY-SUBDOMAIN.md](./DEPLOY-SUBDOMAIN.md)

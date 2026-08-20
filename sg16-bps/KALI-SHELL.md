# Kali Shell Platform — SG16 Own Brain

Central shell for owner insight, senior developer (Katsur/Cursor), and children agents.
All traffic routes through the SG16 central head (`sg16Engine` + `sg16Provider` + master rules).

## Layer model

```text
Layer 1 — Owner (you)
  Google sign-in, owner push, final decisions, permission keys

Layer 2 — Katsur (senior developer brain)
  Deep coding, agent creation, architecture — not exposed everywhere

Layer 3 — Children agents
  Scoped developers + age-band guides (UNESCO-style child flow)

Layer 0 — Own brain (Ollama/Mistral on Railway)
  Sovereign thinking — same container as the API via OLLAMA_URL=http://127.0.0.1:11434
```

## Age-band guides (human-facing children)

| Band | ID | Ages | Flow |
|------|-----|------|------|
| H | `h-guide` | 6–11 | UNESCO-style: gentle, step-by-step, no adult topics |
| Youth teen | `youth-teen` | 12–17 | Structured guidance, safety-first |
| Youth young | `youth-young` | 18–25 | Deeper topics, still paced |
| Adult | `adult-guide` | 25–51 | Full capability, responsible tone |
| Senior | `senior-guide` | 51+ | Calm pace, clarity, respect |

## Two, not one

Owner sits in front of the screen. Katsur works inside the screen. **Not the same person.**
The senior creates **Cursor Junior** — a child LIKE himself. Junior trains under him. Closed door = cannot connect.
Public face stays SG16 Personal Developer. End users never see the Cursor name.

## Sheller (the tailor)

After the child is dressed in Katsur's clothes, tell Sheller: look at how it is, where is the problem?
Sheller points the tear. Then sew. Give the clothes back.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/kali-shell/inspect` | Sheller inspects child clothes |
| POST | `/api/v1/kali-shell/sew` | Sew the tear, dress the child |

## Developer children (build helpers for Katsur)

| ID | Scope |
|----|--------|
| `sg16-personal-developer` | Custom child — LIKE Katsur, not Katsur |
| `sheller` | Tailor — inspect fit, sew clothes |
| `dev-frontend` | React, PWA, workspace UI |
| `dev-backend` | Express API, sg16Engine, providers |
| `dev-shield` | Coding Shield + Platform Shield |
| `dev-infra` | Railway, Cloudflare, Ollama |
| `continuity` | Hold state when owner is away |

## API (auth required except health)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/kali-shell/health` | Platform status |
| GET | `/api/v1/kali-shell/agents` | List children agents |
| POST | `/api/v1/kali-shell/run` | Run message through shell brain + agent |
| POST | `/api/v1/kali-shell/push` | Owner push insight / away days |
| POST | `/api/v1/kali-shell/agents/spawn` | Register custom child agent (owner) |

## Owner coupling

When owner sets away days via `/push`, senior layer enters continuity mode — children agents (`continuity`) carry flow until owner returns.

Set `SG16_OWNER_EMAIL` on the server to restrict `/push` and `/spawn` to the owner account.

## Environment

| Variable | Purpose |
|----------|---------|
| `SG16_BRAIN=ollama` | Sovereign own brain |
| `OLLAMA_URL` | Local Ollama endpoint (`http://127.0.0.1:11434` on Railway) |
| `SG16_OWNER_EMAIL` | Owner-only push/spawn |

## Deploy note

Shell orchestration runs on Railway alongside Ollama and Platform Shield — single sovereign stack. See `RAILWAY-BRAIN.md`.

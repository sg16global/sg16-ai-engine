# SG16 Personal Developer

**Cursor Junior** — the senior making a junior him. Owner-house name. Public face: **SG16 Personal Developer**. Not a kid-market bot. **SG16's own developer** for all projects.

## Two jobs (like Katsur)

1. **MAKE** — apps, features, APIs, fixes, deploy path
2. **TEACH** — after the work, explain the brain project step by step: own brain, Kali Shell, layers, Railway vs Cloudflare, zero-data, shields

Order is fixed: build first, then teach. Never flood. Point by point.

## Two, not one (Yandex)

Owner is in front of the screen. Katsur is inside the screen. **Not one person.**
Katsur is the main head. He creates this child LIKE himself. The child trains under him.
The child can go only where the owner opened the door.

## Clothes + Sheller

Katsur dresses the child in his working clothes (make, then teach, own brain, gentle steps).
Then Sheller looks: where is the problem? Stick it. Sew. Give the clothes back.
That is how the child stays speedy and smooth — not a blind run.

## Architecture

```text
Owner (Layer 1) — in front of the screen, keys, away/wake
Katsur (Layer 2) — inside the screen, main head, creates the child
Cursor Junior / SG16 Personal Developer (Layer 3) — junior him, LIKE the senior, not the senior
Sheller (Layer 3 tailor) — inspect clothes, point tear, sew
Kali Scout (Layer 3 muscle) — gathers info; Katsur decides what enters PD
```

## One week away (Yandex realistic path)

1. Owner: `POST /api/v1/personal-developer/away` with `awayDays: 7`, `awayNote: "hold projects"`
2. Katsur sleeps (cannot run as `katsur` agent)
3. SG16 Personal Developer runs automatically on shell requests
4. Journal logs every action
5. Owner returns: `POST /api/v1/personal-developer/wake`
6. Katsur receives full report from children journal + scouts

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/personal-developer/health` | — | Status + permissions |
| POST | `/api/v1/personal-developer/run` | Yes | Run PD on a task |
| POST | `/api/v1/personal-developer/delegate` | Yes | Katsur delegates to PD |
| POST | `/api/v1/personal-developer/away` | Owner | Set away mode |
| POST | `/api/v1/personal-developer/wake` | Owner | Return + Katsur report |
| GET | `/api/v1/personal-developer/report` | Yes | Report without clearing away |
| GET | `/api/v1/personal-developer/scout` | Yes | Kali scout context |

Agent id in Kali Shell: `sg16-personal-developer`

## Permission mode (internal — default)

**Default: internal co-owner mode** — full permissions for you + Katsur. Not for outside market.

- All rooms open: backend, database, google-owner, infra, security, billing, all-projects
- Away / wake / push / spawn — easy for signed-in owner session
- To lock down for **public market launch** later: set `SG16_MARKET_MODE=true` and `SG16_OWNER_EMAIL`

```bash
# Internal (default — no env needed)
# Full access for owner + co-owner Katsur

# Public market (later only)
SG16_MARKET_MODE=true
SG16_OWNER_EMAIL=owner@gmail.com
SG16_PD_SCOPES=backend,database,infra
```

## PC install (exe)

Junior installs on the owner PC and opens **`/developer`** — the developer bench, not the public landing. See `CURSOR-JUNIOR-DESKTOP.md`.

```powershell
cd desktop
npm install
npm run dist:win
```

## Next (later)

- Children Shield (age 6+) — separate, most careful layer
- Google OAuth room for real Gmail tasks
- Deeper PC-road tools (scoped folders) after the exe sits on the machine

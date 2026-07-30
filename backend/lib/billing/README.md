# SG16 Billing Room

Fixed billing API for **every SG16 app**. Apps never talk to Dodo directly — only to SG16.

## Flow

```
User → SG16 App → /api/v1/billing/checkout → SG16 Billing Room → Dodo
Dodo webhook → /api/v1/billing/webhook → SG16 Billing Room → user account unlocked
```

## Endpoints (same for all apps)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/billing/config` | Public config + checkout enabled |
| GET | `/api/v1/billing/entitlements` | User plan (auth required) |
| POST | `/api/v1/billing/checkout` | Start checkout → `{ checkoutUrl }` |
| POST | `/api/v1/billing/portal` | Manage billing (future) |
| POST | `/api/v1/billing/webhook` | Dodo events (raw body) |

## Env (Railway)

```
SG16_BILLING_PROVIDER=dodo
DODO_PAYMENTS_API_KEY=
DODO_WEBHOOK_SECRET=
DODO_ENVIRONMENT=test_mode
DODO_PRODUCT_ID_PRO=
SG16_APP_URL=https://sg16engine.com
SG16_LAUNCH_FREE=0
```

## Dodo dashboard setup

1. Create subscription product **All Access $4.50/mo**
2. Copy product id → `DODO_PRODUCT_ID_PRO`
3. Webhook URL: `https://sg16engine.com/api/v1/billing/webhook`
4. Events: `subscription.active`, `subscription.renewed`, `subscription.cancelled`, `subscription.expired`, `subscription.on_hold`

## New app later?

Point the new app at the same SG16 Billing Room API — swap provider in `backend/lib/billing/providers/` only.

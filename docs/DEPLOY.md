# ModelZone · Deployment Guide

Target production topology for **V1 Brand Platform** (see ADR-0002 for why
Fly.io over Render / Railway).

```
┌──────────────────────┐          ┌─────────────────────┐
│  Cloudflare (CDN +   │          │  Sentry (errors,    │
│  WAF + DNS)          │          │  releases, perf)    │
└──────────┬───────────┘          └──────────▲──────────┘
           │                                 │
           ▼                                 │
┌──────────────────────┐      API+WS    ┌────┴────────────────┐
│  Vercel Hobby        │ ─────────────▶ │  Fly.io free tier    │
│  (frontend/)         │                │  (backend/)          │
│  Next.js 14 App      │                │  Express+Socket.io   │
│  Static + SSR + edge │                │  Node 20, single hk  │
└──────────────────────┘                └────────┬─────────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  MongoDB Atlas   │
                                        │  M0 (free)       │
                                        └──────────────────┘
```

**Monthly cost target**: ¥60–130 until traffic or feature set forces an
upgrade (see PROMPT §3 upgrade triggers).

---

## Prerequisites (one-time, owner action)

| Account                                    | Purpose                     | Tier                                  |
| ------------------------------------------ | --------------------------- | ------------------------------------- |
| [Vercel](https://vercel.com)               | Frontend hosting            | Hobby (free)                          |
| [Fly.io](https://fly.io)                   | Backend hosting             | Free-tier (shared-cpu-1x 256 MB)      |
| [MongoDB Atlas](https://cloud.mongodb.com) | Database                    | M0 free cluster (already provisioned) |
| [Cloudflare](https://cloudflare.com)       | DNS + CDN + WAF + registrar | Free                                  |
| [Sentry](https://sentry.io)                | Error monitoring            | Developer free (5 k errors / mo)      |
| [Web3Forms](https://web3forms.com)         | Lead-capture fallback       | Free 250 / mo                         |

Generate JWT secrets once:

```powershell
# Three separate 32-byte hex strings
1..3 | ForEach-Object { [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Max 256 })).ToLower() }
```

---

## 1 · Frontend → Vercel

1. Import the GitHub repo into Vercel.
2. **Framework preset**: Next.js. **Root directory**: `frontend`.
3. **Install command**: `pnpm install --frozen-lockfile` (default works now that
   ADR-0001 and the T1 hoist fix are in).
4. **Build command**: `pnpm --filter=frontend build`.
5. **Environment variables** (per environment: Production, Preview, Development):
   - `NEXT_PUBLIC_BACKEND_URL` — `https://api.modelzone.<domain>` in prod;
     leave blank in preview until backend URL is known.
   - `NEXT_PUBLIC_SITE_URL` — `https://modelzone.<domain>`.
   - `NEXT_PUBLIC_SENTRY_DSN` — browser DSN from Sentry `modelzone-frontend`.
   - `SENTRY_DSN` — same DSN, exposed server-side.
   - `SENTRY_AUTH_TOKEN` — internal user-auth token with `project:releases`
     scope (source-map upload).
   - `SENTRY_ORG` + `SENTRY_PROJECT=modelzone-frontend`.
   - `NEXT_PUBLIC_WEB3FORMS_KEY` — fallback per ADR-0009.
6. **Custom domain**: add `modelzone.<domain>` once Cloudflare DNS is wired.

> `/admin/*` is `noindex`. `middleware.ts` handles locale prefixing; the
> default locale (`en`) is served at `/` without prefix.

---

## 2 · Backend → Fly.io (Week 2 work)

Not yet deployed. Target configuration (Week 2 T1):

```toml
# fly.toml (root of repo)
app = "modelzone-api"
primary_region = "hkg"

[build]
  dockerfile = "docker/Dockerfile.api"

[env]
  NODE_ENV = "production"
  PORT = "4000"
  LOG_LEVEL = "info"

[[services]]
  internal_port = 4000
  protocol = "tcp"
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0  # bump to 1 ($1.94/mo) when cold-start hurts

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.http_checks]
    path = "/api/health"
    interval = "30s"
    timeout = "2s"
```

**Secrets** (set via `fly secrets set` — never in fly.toml):

- `MONGODB_URI`, `FRONTEND_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`
- `SMTP_*`, `NOTIFY_EMAIL`
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`, `SENTRY_RELEASE=<git-sha>`

**Healthchecks**: `/api/health` (liveness), `/api/ready` (readiness).

---

## 3 · Database → MongoDB Atlas

- Cluster tier: **M0** (free, 512 MB).
- Network access: add `0.0.0.0/0` initially (Fly.io egress is dynamic);
  tighten to Fly's egress CIDR once confirmed.
- Database user: dedicated `modelzone-api` user with `readWrite` on the
  `modelzone` database only.
- Upgrade trigger: **M10** once DB > 400 MB **or** backups become
  mandatory (V2 pre-order shipping).

---

## 4 · Cloudflare (DNS + CDN + WAF)

1. Register or transfer domain to Cloudflare Registrar.
2. DNS records:
   - `@` → CNAME → `cname.vercel-dns.com` (orange-cloud)
   - `www` → CNAME → `cname.vercel-dns.com` (orange-cloud)
   - `api` → CNAME → `modelzone-api.fly.dev` (orange-cloud once we confirm
     WebSockets traverse; keep grey-cloud if any issues)
3. SSL/TLS mode: **Full (strict)**.
4. Always Use HTTPS: **On**. TLS 1.3: **On**. HSTS: already emitted by Next
   headers + Fly — no need to duplicate.
5. Bot Fight Mode: **On** (free tier).
6. Page Rules:
   - `/_next/*` → Cache Level: Cache Everything, Edge Cache TTL: 1 month.
   - `/*.{svg,png,webp,avif,woff,woff2,ico}` → same.
   - `/api/*` → Cache Level: Bypass.
   - `/socket.io/*` → Cache Level: Bypass, Disable Performance.

---

## 5 · Sentry

See `ADR-0003`. Two projects under one org:

- `modelzone-frontend` → `@sentry/nextjs` (browser + SSR + edge)
- `modelzone-backend` → `@sentry/node` (backend, Week 2 Fastify-ready)

CI should inject `SENTRY_RELEASE=$GIT_SHA` and `SENTRY_AUTH_TOKEN` on every
production deploy so source maps & release markers upload automatically.

---

## 6 · Local production smoke test

```powershell
# Build both packages
pnpm build

# Backend
$env:MONGODB_URI = "mongodb://localhost:27017/modelzone"
$env:JWT_ACCESS_SECRET = "0000000000000000000000000000000000000000000000000000000000000000"
$env:JWT_REFRESH_SECRET = "1111111111111111111111111111111111111111111111111111111111111111"
$env:ADMIN_PASSWORD = "change_me"
pnpm --filter=backend start

# In another shell — frontend
pnpm --filter=frontend start
```

- <http://localhost:4000/api/health> should return `{"status":"ok"}`.
- <http://localhost:3000> should render the landing page.

---

## 7 · Roll-back

- **Frontend**: `vercel rollback <deployment-id>` — 30-day retention.
- **Backend**: `fly releases list` then `fly deploy --image <previous-image>`
  or `fly machine update --image ...`.
- **Database**: Atlas point-in-time restore (M10+) or daily snapshots
  (all tiers). For V1 M0 accept RPO = 24 h.

---

## 8 · Legacy

The earlier Railway + Redis target is archived in
[`legacy/DEPLOY-railway.md`](./legacy/DEPLOY-railway.md) for reference only.
It describes the prototype intent and is **not** the current plan.

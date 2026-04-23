# ModelZone · Deployment Guide (Render-first)

Target production topology for **V1 Brand Platform**. Render-first per
ADR-0011; ADR-0002 (Fly.io) superseded by the card-access constraint.

```
┌──────────────────────┐          ┌─────────────────────┐
│  Cloudflare (CDN +   │          │  Sentry (errors,    │
│  WAF + DNS)          │          │  releases, perf)    │
└──────────┬───────────┘          └──────────▲──────────┘
           │                                 │
           ▼                                 │
┌──────────────────────┐      API+WS    ┌────┴────────────────┐
│  Vercel Hobby        │ ─────────────▶ │  Render free tier    │
│  (frontend/)         │                │  (backend/, docker)  │
│  Next.js 14 App      │                │  Express+Socket.io   │
│  Static + SSR + edge │                │  Node 20, singapore  │
└──────────────────────┘                └────────┬─────────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  MongoDB Atlas   │
                                        │  M0 (free)       │
                                        └──────────────────┘
```

**Monthly cost target**: ¥0 until traffic or feature set forces an upgrade
(V1 runs entirely on free tiers: Vercel Hobby + Render free + Atlas M0 +
Cloudflare free + Sentry Developer). Upgrade triggers in PROMPT §3.

---

## Prerequisites (one-time, owner action)

| Account                                    | Purpose                     | Tier                                  |
| ------------------------------------------ | --------------------------- | ------------------------------------- |
| [Vercel](https://vercel.com)               | Frontend hosting            | Hobby (free)                          |
| [Render.com](https://render.com)           | Backend hosting             | Free Web Service (512 MB, 750 h/mo)   |
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

## 2 · Backend → Render (Week 2 work)

Not yet deployed. Target configuration (Week 2 T1).

### 2.1 `render.yaml` (committed to repo root)

Render reads this on first deploy and on every subsequent push. Non-secrets
live here; secrets are injected via the Render dashboard (`sync: false`).

```yaml
# render.yaml
services:
  - type: web
    name: modelzone-api
    runtime: docker
    repo: https://github.com/SunnyKlara/mojingweb
    branch: main
    region: singapore
    plan: free
    dockerfilePath: ./docker/Dockerfile.api
    dockerContext: .
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - { key: NODE_ENV, value: production }
      - { key: PORT, value: 4000 }
      - { key: LOG_LEVEL, value: info }
      - { key: FRONTEND_URL, value: https://modelzone-tawny.vercel.app }
      - { key: SENTRY_ENVIRONMENT, value: production }
      # Secrets set in Render dashboard, not committed:
      - { key: MONGODB_URI, sync: false }
      - { key: JWT_ACCESS_SECRET, sync: false }
      - { key: JWT_REFRESH_SECRET, sync: false }
      - { key: ADMIN_USERNAME, sync: false }
      - { key: ADMIN_PASSWORD, sync: false }
      - { key: ADMIN_EMAIL, sync: false }
      - { key: SMTP_HOST, sync: false }
      - { key: SMTP_PORT, sync: false }
      - { key: SMTP_USER, sync: false }
      - { key: SMTP_PASS, sync: false }
      - { key: SMTP_FROM, sync: false }
      - { key: NOTIFY_EMAIL, sync: false }
      - { key: SENTRY_DSN, sync: false }
```

### 2.2 One-time setup (Owner, after signup)

1. <https://render.com> — sign in with GitHub (no credit card required).
2. **New +** → **Blueprint** → pick the `mojingweb` repo → Render detects
   `render.yaml` and proposes the `modelzone-api` service.
3. Fill in the `sync: false` secrets when prompted.
4. **Deploy**. First build takes 4–8 min (Docker cold-cache).
5. Copy the resulting URL (`https://modelzone-api.onrender.com`) into
   Vercel as `NEXT_PUBLIC_BACKEND_URL` (Prod + Preview + Dev).

### 2.3 Idle-sleep mitigation

Render free tier sleeps after **15 min** of no HTTP traffic. Cold start
~30 s. Two layers keep the chat alive:

1. **External ping**: schedule a free cron at <https://cron-job.org> or
   <https://uptimerobot.com> hitting `/api/health` every 5 min.
2. **Client keepalive**: Socket.io `pingInterval` tightened to 10 min in
   `ChatWidget.tsx` during Week 2.

### 2.4 Healthchecks

- `/api/health` — liveness (Render's `healthCheckPath`).
- `/api/ready` — readiness (Mongo ping). Monitored via Sentry, not wired
  to Render health (a transient Atlas blip should not kill the pod).

---

## 3 · Database → MongoDB Atlas

- Cluster tier: **M0** (free, 512 MB).
- Network access: add `0.0.0.0/0` initially (Render free tier egress is
  dynamic and not published); tighten when we upgrade off free tier.
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
   - `api` → CNAME → `modelzone-api.onrender.com` — keep **grey-cloud / DNS
     only**: Render manages its own TLS and orange-cloud may break the
     Socket.io upgrade on free tier.
3. SSL/TLS mode: **Full (strict)**.
4. Always Use HTTPS: **On**. TLS 1.3: **On**. HSTS: already emitted by Next
   headers + Render — no need to duplicate.
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
- `modelzone-backend` → `@sentry/node` (backend)

### 5.1 Release tagging (automated in CI — Week 2 T5)

`.github/workflows/ci.yml` injects the following **on every build**:

- `SENTRY_RELEASE` = `${{ github.sha }}` — tags emitted events.
- `NEXT_PUBLIC_SENTRY_RELEASE` = same (client SDK).
- `SENTRY_ENVIRONMENT` = `production` on `main`, `preview` elsewhere.

And **only on pushes to `main`** (PRs deliberately skip):

- `SENTRY_AUTH_TOKEN` — uploads source maps through `withSentryConfig`
  (`frontend/next.config.mjs`). Missing token = `silent: true` = no upload.
- `SENTRY_ORG`, `SENTRY_PROJECT` — scope the upload.

### 5.2 Required GitHub Secrets (Owner, one-time)

Set these at <https://github.com/SunnyKlara/mojingweb/settings/secrets/actions>:

| Secret                   | Source                                                                                       | Required for                                                |
| ------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN`      | Sentry → Settings → Auth Tokens → New, scopes `project:releases`, `project:read`, `org:read` | Source-map upload on `main` builds                          |
| `SENTRY_ORG`             | Sentry org slug (e.g. `modelzone`)                                                           | Source-map upload                                           |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → `modelzone-frontend` → Settings → Client Keys (DSN)                                 | Frontend runtime error reporting                            |
| `SENTRY_DSN`             | Sentry → `modelzone-backend` → Client Keys (DSN)                                             | Backend runtime error reporting (Render reads this, not CI) |

A DSN is _not_ a secret in the cryptographic sense (it identifies the
project, does not authorize writes) but we store it as a GH secret anyway
for consistency and because `NEXT_PUBLIC_*` values become part of the
deployed JS bundle regardless.

### 5.3 First deploy verification

After T3 Render deploy lands:

1. Trigger one client error on the frontend (DevTools → `throw new Error('sentry-smoke-test')`).
2. Trigger one server error on the backend (gated admin route to be added
   in T5 follow-up, or temporarily throw in `/api/health`).
3. Confirm both events appear in Sentry with the correct `release` tag
   matching the deployed commit SHA.
4. Delete the temporary throw route.

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
- **Backend**: Render dashboard → `modelzone-api` → **Deploys** → pick any
  past successful deploy → **Rollback**. Render keeps the last ~50 builds.
- **Database**: Atlas point-in-time restore (M10+) or daily snapshots
  (all tiers). For V1 M0 accept RPO = 24 h.

---

## Appendix A · Future Fly.io migration (when card access is solved)

Per ADR-0011, backend moves to Fly.io once the Owner has a usable card.
Migration is a half-day of work:

1. `fly launch --dockerfile docker/Dockerfile.api --region hkg --no-deploy`
   (review the generated `fly.toml`, paste canonical one below).
2. `fly secrets set MONGODB_URI=... JWT_ACCESS_SECRET=... ...` (same set of
   secrets as Render).
3. `fly deploy`.
4. Flip Cloudflare `api` CNAME from `modelzone-api.onrender.com` →
   `modelzone-api.fly.dev`.
5. Update Vercel `NEXT_PUBLIC_BACKEND_URL` if the vanity host changes;
   otherwise no-op.
6. Wait 24 h to confirm no regressions → delete the Render service.

Canonical `fly.toml` for that future migration:

```toml
# fly.toml — committed only when migration starts
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
  min_machines_running = 0  # bump to 1 ($1.94/mo) if cold-start hurts

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

---

## Appendix B · Legacy prototype topology

The earlier Railway + Redis target is archived in
[`legacy/DEPLOY-railway.md`](./legacy/DEPLOY-railway.md) for reference only.
It describes the prototype intent and is **not** the current plan.

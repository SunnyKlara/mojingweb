# Deployment Guide

## Architecture

```
┌──────────────────────┐      ┌──────────────────────┐
│  Vercel (frontend)   │  ──► │  Railway (backend)   │
│  Next.js SSG + ISR   │      │  Express + Socket.io │
│  Edge network        │      └──────────┬───────────┘
└──────────┬───────────┘                 │
           │                             ▼
           │                    ┌─────────────────┐
           │                    │ MongoDB Atlas   │
           │                    └─────────────────┘
           ▼
  Cloudflare CDN / WAF
```

- **Frontend**: Vercel (recommended) or self-host via `docker/Dockerfile.frontend`
- **Backend**: Railway / Fly.io / any container host via `docker/Dockerfile.api`
- **Database**: MongoDB Atlas (free M0 is fine for start)
- **CDN / WAF**: Cloudflare in front of the Vercel domain

---

## 1. Prepare secrets

Generate secrets once:

```bash
# Access + refresh token secrets (≥ 32 chars each)
openssl rand -hex 32   # → JWT_ACCESS_SECRET
openssl rand -hex 32   # → JWT_REFRESH_SECRET
openssl rand -hex 32   # → VISITOR_SESSION_SECRET
```

Other required env vars — see `.env.example` at the repo root.

---

## 2. Backend → Railway

1. Create a new Railway project → **"Deploy from GitHub repo"** → point at this repo.
2. **Build configuration**:
   - Root directory: `/` (monorepo)
   - Dockerfile path: `docker/Dockerfile.api`
3. **Environment variables** (copy from `.env.example`):
   - `NODE_ENV=production`
   - `PORT=4000`
   - `MONGODB_URI=…atlas…`
   - `FRONTEND_URL=https://yourdomain.com`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `VISITOR_SESSION_SECRET`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` (seeded on first boot)
   - `SMTP_*` + `NOTIFY_EMAIL` (for lead / chat notifications)
4. Networking:
   - Enable public networking, expose port `4000`.
   - Copy the generated host — e.g. `api.yourdomain.railway.app`.
5. Custom domain (recommended): add a CNAME `api.yourdomain.com` → Railway host.

### Healthcheck

Railway will use `GET /api/health` automatically (we added a Dockerfile HEALTHCHECK). For K8s / other orchestrators use `/api/ready` as readiness and `/api/health` as liveness.

---

## 3. Frontend → Vercel

1. Import this repo into Vercel.
2. **Framework preset**: Next.js. **Root directory**: `frontend`. **Build command**: `pnpm --filter=frontend build`. **Install command**: `pnpm install --frozen-lockfile` (from the monorepo root — Vercel detects pnpm workspace).
3. Environment variables:
   - `NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
4. Add your custom domain. Vercel will auto-issue TLS.

> `/admin/*` is `noindex`. `middleware.ts` rewrites `/` to `/zh` (default locale) and keeps `/en` explicit.

---

## 4. Cloudflare in front (recommended)

1. Add domain to Cloudflare, set nameservers.
2. Orange-cloud (proxy) the root (`@`) and `api` record.
3. Enable:
   - **Always Use HTTPS**
   - **TLS 1.3**
   - **HSTS** (we already emit the header)
   - **Bot Fight Mode** (Free) or **WAF rules** (Pro+)
4. Page Rules / Rulesets:
   - Cache `/_next/*`, `/*.{svg,png,webp,woff,woff2}` aggressively.
   - Bypass cache for `/api/*` and `/socket.io/*`.
5. WebSocket: Socket.io works over Cloudflare by default — just keep the domain proxied.

---

## 5. Admin bootstrap

The backend seeds a default admin on first boot from:

```
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong_password>
```

**Rotate the password immediately** after first login (implement the change-password endpoint if you need self-service, or re-seed by updating the env var and restarting).

---

## 6. Local production smoke test

```bash
# Build images locally
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check
curl http://localhost:4000/api/health
curl http://localhost:3000
```

---

## 7. Observability

- Logs: Railway and Vercel both ship structured stdout; pino JSON is aggregated automatically.
- Metrics: `GET /api/metrics` (admin JWT required) exposes uptime, memory, and document counts.
- Audit log: MongoDB `auditlogs` collection (`login`, `logout`, `lead.*`, `chat.read`).

### Optional: hook Sentry

Add `@sentry/node` + `@sentry/nextjs` and initialize in `backend/src/index.ts` and `frontend/app/[locale]/layout.tsx` before `ThemeProvider`. Not included by default to keep the bundle lean.

---

## 8. Roll-back

- **Frontend**: `vercel rollback <deployment-id>` — any deployment of last 30 days is kept.
- **Backend**: redeploy previous git tag on Railway; we use JWT rotation, so a rollback keeps existing sessions valid as long as secrets are unchanged.
- **Database**: Atlas point-in-time restore (M10+) or daily snapshots (all tiers).

# ModelZone — Brand Platform for Wind Chaser 64

> Enterprise-grade marketing + commerce platform for **Wind Chaser 64**, a
> desktop wind tunnel for 1:64 scale model cars by Shenzhen Mirror Studio.
>
> Next.js 14 on Vercel · Express + Socket.io on Fly.io · MongoDB Atlas ·
> Cloudflare edge · Sentry observability.

[![CI](https://github.com/SunnyKlara/mojingweb/actions/workflows/ci.yml/badge.svg)](https://github.com/SunnyKlara/mojingweb/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-20-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-9.12-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

Live: <https://modelzone-tawny.vercel.app> ·
ADR log: [`docs/DECISIONS.md`](./docs/DECISIONS.md) ·
Enterprise rebuild charter: [`docs/PROMPT-ENTERPRISE-REBUILD.md`](./docs/PROMPT-ENTERPRISE-REBUILD.md)

---

## Architecture (V1 target)

```
                         ┌───────────────────┐
   Visitors  ───────────▶ │    Cloudflare    │  DNS + CDN + WAF
                         └────────┬─────────┘
                 ┌───────────────┼───────────────┐
                 ▼                               ▼
      ┌────────────────┐            ┌─────────────────┐
      │  Vercel Hobby    │  API + WS   │  Fly.io  (hkg)    │
      │  frontend/       │◀──────────▶│  backend/         │
      │  Next.js 14 App  │             │  Express+Socket.io│
      └────────────────┘             └──────┬───────────┘
                                              ▼
                                     ┌────────────────┐
                                     │  MongoDB Atlas   │  M0 free
                                     └────────────────┘
                                              │
                                              ▼
                                     ┌────────────────┐
                                     │  Sentry          │  errors + releases
                                     └────────────────┘
```

- **`frontend/`** — Next.js 14 App Router, Tailwind, shadcn/ui, next-intl (en/zh),
  Socket.io client, `@sentry/nextjs`. Deployed to Vercel.
- **`backend/`** — Express + Socket.io + Mongoose + pino + `@sentry/node`.
  Deployed to Fly.io (scheduled Week 2; see `docs/DECISIONS.md` ADR-0002).
- **`shared/`** — Zod schemas + TS types + Socket event constants shared by both.

---

## Quick Start (Local)

**Prerequisites**

- Node.js `>=20` ([`.nvmrc`](./.nvmrc))
- pnpm `>=9` — install via `npm i -g pnpm@9`
- Docker Desktop (for local MongoDB — skip if using Atlas directly)

**Steps**

```powershell
# 1. Install deps (pnpm 9 pinned via packageManager + corepack)
pnpm install --frozen-lockfile

# 2. Start MongoDB locally (mongo-express UI on http://localhost:8081)
pnpm docker:up

# 3. Bootstrap env files
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
# Edit backend/.env — at minimum set:
#   JWT_ACCESS_SECRET  (openssl rand -hex 32)
#   JWT_REFRESH_SECRET (openssl rand -hex 32)
#   ADMIN_PASSWORD     (≥10 chars)
# Optional: NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN to turn on telemetry.

# 4. Run dev servers in parallel (web + api)
pnpm dev
# Frontend  → http://localhost:3000
# Backend   → http://localhost:4000
# Admin     → http://localhost:3000/admin/login
```

---

## Scripts

| Command                                                    | Purpose                                  |
| ---------------------------------------------------------- | ---------------------------------------- |
| `pnpm dev`                                                 | Run `frontend` and `backend` in parallel |
| `pnpm dev:web`                                             | Run frontend only                        |
| `pnpm dev:api`                                             | Run backend only                         |
| `pnpm build`                                               | Build all workspaces                     |
| `pnpm lint` / `pnpm lint:fix`                              | ESLint across all packages               |
| `pnpm typecheck`                                           | `tsc --noEmit` across all packages       |
| `pnpm format` / `pnpm format:check`                        | Prettier                                 |
| `pnpm docker:up` / `pnpm docker:down` / `pnpm docker:logs` | Dev services                             |

---

## Project Layout

```
mojing/
├── frontend/              Next.js 14 app (public site + /admin)
├── backend/               Express + Socket.io API
│   └── src/
│       ├── config/        env + logger
│       ├── db/            mongoose connection
│       ├── models/        Mongoose schemas
│       ├── middleware/    auth, validation, error handling
│       ├── routes/        REST endpoints
│       ├── socket/        WebSocket handlers
│       └── services/      mailer, etc.
├── shared/                Zod schemas + types + socket events
├── docker/                Dockerfile + docker-compose
├── docs/                  architecture, API, deployment
└── .github/workflows/     CI
```

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list. Key ones:

**Backend (`backend/.env`)**

- `MONGODB_URI` (Atlas `mongodb+srv://...` in prod, local Mongo in dev)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥32 chars, use `openssl rand -hex 32`)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`
- `SMTP_*` / `NOTIFY_EMAIL` (optional — disables email notifications if blank)
- `SENTRY_DSN` (optional locally, required in prod)

**Frontend (`frontend/.env.local`)**

- `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WEB3FORMS_KEY` (contact-form fallback — see ADR-0009)
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` (production)
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (CI only, for source maps)

---

## Roadmap

See [`docs/PROMPT-ENTERPRISE-REBUILD.md`](./docs/PROMPT-ENTERPRISE-REBUILD.md) for the
full charter and [`docs/DECISIONS.md`](./docs/DECISIONS.md) for shipped ADRs.

**V1 · Brand Platform (6 weeks)**

1. Week 1 · Tech-debt paydown, CI gates, Sentry, deps triage. _(in progress)_
2. Week 2 · Fastify migration, Fly.io deploy, admin console, lead pipeline.
3. Week 3 · Mid-demo: brand site + leads at staging URL.
4. Week 4 · Real-time chat (typing / read / offline queue) + E2E.
5. Week 5 · AI customer assistant (SSE streaming + KB RAG + guardrails).
6. Week 6 · Perf hardening, Lighthouse budget, SEO/a11y audit, custom domain.

**V2 · Pre-order (+2–3 weeks after V1 ships)** — Stripe, Resend, shipping hooks.

**V3 · Community (backlog)** — user accounts, photo submissions, dealer portal.

---

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Pre-commit hooks run
ESLint and Prettier via `lint-staged`. Commit messages are validated by `commitlint`.

```
feat: add visitor typing indicator
fix(chat): prevent sessionId spoofing via signed token
docs: update deployment guide
```

---

## License

MIT © 2026 Shenzhen Mirror Studio / ModelZone.

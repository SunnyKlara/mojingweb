# GlobalBridge — Corporate Website & Live Chat

> Enterprise-grade B2B corporate website with real-time customer support.
> Next.js 14 on the edge · Node.js + Socket.io behind it · MongoDB + Redis data layer.

[![CI](https://github.com/your-org/mojing/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/mojing/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Architecture

```
                       ┌───────────────────┐
   Visitors  ─────────▶│   Cloudflare      │  DNS + CDN + WAF
                       └─────────┬─────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼                               ▼
          ┌──────────────┐            ┌──────────────────┐
          │   Vercel     │            │    Railway       │
          │  frontend/   │◀──API/WS──▶│    backend/      │
          │  Next.js 14  │            │  Express+Socket  │
          └──────────────┘            └────┬─────┬───────┘
                                           │     │
                             ┌─────────────▼┐   ┌▼──────────┐
                             │  MongoDB     │   │  Upstash  │
                             │   Atlas      │   │   Redis   │
                             └──────────────┘   └───────────┘
```

- **frontend/** — Next.js 14 App Router, Tailwind, Socket.io client, deployed to Vercel
- **backend/** — Express + Socket.io + Mongoose + Pino, deployed to Railway
- **shared/** — Zod schemas + TS types + Socket event constants shared by both

---

## Quick Start (Local)

**Prerequisites**

- Node.js `>=20` ([`.nvmrc`](./.nvmrc))
- pnpm `>=9` — install via `npm i -g pnpm@9`
- Docker Desktop (for MongoDB + Redis)

**Steps**

```powershell
# 1. Install deps (creates pnpm-lock.yaml, links shared/)
pnpm install

# 2. Start MongoDB + Redis + mongo-express (http://localhost:8081)
pnpm docker:up

# 3. Bootstrap env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit backend/.env — at minimum set:
#   JWT_ACCESS_SECRET  (openssl rand -hex 32)
#   JWT_REFRESH_SECRET (openssl rand -hex 32)
#   ADMIN_PASSWORD

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

- `MONGODB_URI`, `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥32 chars, use `openssl rand -hex 32`)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`
- `SMTP_*` / `NOTIFY_EMAIL` (optional)
- `SENTRY_DSN` (optional)

**Frontend (`frontend/.env.local`)**

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_SITE_URL`

---

## Roadmap

See [`CHANGELOG.md`](./CHANGELOG.md) for shipped work. Upcoming phases:

- **Phase 1 — Security hardening** (bcrypt, refresh tokens, Socket auth, rate limiting)
- **Phase 2 — UI system** (shadcn/ui, dark mode, design tokens, Storybook)
- **Phase 3 — SEO / i18n / performance** (Lighthouse ≥95, zh/en)
- **Phase 4 — Content** (MDX blog + cases + resource center)
- **Phase 5 — Chat upgrade** (file uploads, typing indicators, read receipts, CSAT)
- **Phase 6 — Forms & CRM** (demo requests, HubSpot/飞书 integration, email automation)
- **Phase 7 — Observability & deploy** (Sentry, structured logs, CI/CD, preview envs)
- **Phase 8 — Tests** (Vitest + Playwright, ≥70% coverage)

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

MIT © 2024 GlobalBridge

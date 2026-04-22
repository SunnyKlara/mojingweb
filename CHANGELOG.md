# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 8 — Testing (current)

**Added**

- Vitest wired for `shared` and `backend`
- `shared/src/__tests__/schemas.test.ts` — 11 passing assertions (UUID, login, visitor message, typing payload, lead honeypot)
- `backend/src/__tests__/setup.ts` — env bootstrap (JWT secrets, admin seed vars, log level) before any import of `config/env`
- `backend/vitest.config.ts` — file-serial to avoid mongodb-memory-server lock collision
- `backend/src/__tests__/auth.test.ts` — login flow, refresh cookie set, `/me` auth gate, Zod rejection (5 tests, powered by `supertest` + `mongodb-memory-server`)
- `backend/src/__tests__/leads.test.ts` — happy path, honeypot 202, invalid email 400, admin-only listing 401 (4 tests)
- `pnpm test` script at root running shared + backend suites
- CI: new `test` job runs alongside lint/typecheck/build

**Changed**

- Backend ESLint override for `__tests__/**` disables `no-unsafe-*` (supertest body is `any` by design)
- `CreateLeadRequestSchema.website` loosened so the route-level honeypot can return a silent 202 (schema-level rejection would leak that the field was suspicious)

### Phase 7 — Observability & Deployment

**Added — backend**

- `/api/health` — liveness probe (no DB call)
- `/api/ready` — readiness probe with Mongo ping
- `/api/metrics` — admin-only ops metrics (uptime, memory, document counts by collection)

**Added — frontend**

- `app/[locale]/not-found.tsx` — branded 404
- `app/[locale]/error.tsx` — client-side error boundary with reset + digest
- `app/[locale]/loading.tsx` — spinner suspense fallback
- `output: 'standalone'` for Next.js → slim Docker images

**Added — ops**

- `docker/Dockerfile.api` — multi-stage, non-root user, Mongo-aware healthcheck, Node 22, pnpm cache mount
- `docker/Dockerfile.frontend` — Next standalone build, non-root user
- `docker-compose.prod.yml` — api + web + mongo wired end-to-end for local prod smoke test
- `docs/DEPLOY.md` — end-to-end deployment runbook (Vercel / Railway / Atlas / Cloudflare)

### Phase 6 — Lead Capture & Lightweight CRM

**Added — shared**

- `CreateLeadRequestSchema`, `UpdateLeadRequestSchema`, `LeadSchema` with `LEAD_STATUSES`

**Added — backend**

- `Lead` model (Mongoose) with timestamps, indexes on status/email/createdAt
- `POST /api/leads` public endpoint: Zod validation + honeypot (`website` field) + rate limit (3/min/IP) + audit log + email notification (fire-and-forget)
- `GET /api/leads` admin listing with status filter
- `PATCH /api/leads/:id` admin status/notes update
- `notifyNewLead` mailer (HTML-escaped)

**Added — frontend**

- `ContactForm` component (hooks + toast + honeypot + loading state)
- Split-layout CTA (gradient info + inline form)
- `/admin/leads` dashboard: search, 5-way status filter chips, per-row quick status buttons, timestamps

### Phase 5 — Chat Enhancements

**Added — shared**

- New socket events: `visitor:typing`, `admin:typing`, `visitor:read`, `typing`, `read_receipt`, `session:close`, `session:reopen`
- Zod schemas: `TypingPayloadSchema`, `TypingBroadcastSchema`, `ReadReceiptSchema`

**Added — backend socket**

- Typing-indicator relay (debounced on the client) — admins see visitor typing, visitor sees admin typing
- Read receipts on both sides: visitor marks admin messages read → admin UI shows "访客已读"; admin opens a session → visitor bubble shows "Read"
- Session lifecycle: `session:close` / `session:reopen` events with server-side Session.status update broadcast via `session:updated`
- All events validated with Zod; sessionId-spoof protection preserved

**Added — ChatWidget (visitor)**

- Debounced typing emitter
- Animated 3-dot typing indicator when admin is typing
- "已读 / Read" badge under the last sent message once admin opens the conversation
- Auto-send `visitor:read` whenever the panel is open and messages arrive

**Added — Admin console**

- Search box + "未读" filter on session list
- Tab title live counter (e.g. `(3) 客服后台`) driven by total unread
- Sound blip (WebAudio, no asset) on incoming visitor messages (toggleable)
- Browser notification permission prompt + desktop toast when tab is hidden
- Typing indicator rendered in conversation pane + "正在输入…" replaces last-message preview in sidebar
- Quick-reply chips (4 presets) triggered by the zap button
- Close / reopen session button in conversation header; closed sessions visible as badges in sidebar
- Read receipts (admin sees visitor-read indicator)

### Phase 4 — Content Layer

**Added**

- MDX content pipeline using `next-mdx-remote/rsc` + `gray-matter`, no build-step coupling
- `content/blog/{zh,en}/*.mdx` — 3 seed blog posts per locale (Europe entry, agent selection, 2025 supply-chain trends)
- `content/cases/{zh,en}/*.mdx` — 2 seed case studies per locale (industrial + SaaS)
- `lib/content.ts` — typed API for `listContent`, `getContent`, `listAllSlugs`; reading-time auto-computed
- `components/mdx.tsx` — MDX renderer wired with `remark-gfm` + `rehype-slug` + `rehype-pretty-code` (shiki-based code blocks)
- Routes: `app/[locale]/blog`, `app/[locale]/blog/[slug]`, `app/[locale]/cases`, `app/[locale]/cases/[slug]` — all SSG via `generateStaticParams`
- `@tailwindcss/typography` plugin for polished long-form reading (`prose prose-neutral dark:prose-invert`)
- `sitemap.ts` now iterates all locales + blog + case slugs dynamically

**Changed**

- NavBar links updated to point to `/blog` and `/cases`
- New `blog` and `casesPage` namespaces in i18n messages

### Phase 3 — SEO, i18n & Performance

**Added**

- `next-intl` v3 with `zh` (default) / `en` locales, `localePrefix: as-needed` so `/` stays clean and `/en` is explicit
- `app/[locale]/` route segment + `app/(admin)/` route group — admin stays non-localized and `noindex`
- `messages/zh.json` + `messages/en.json` — full translations for nav, hero, about, features, stats, cases, FAQ, CTA, footer, chat widget
- `i18n/routing.ts` + `i18n/request.ts` + `middleware.ts` — locale negotiation + localized `<Link>` / `useRouter`
- `LanguageSwitcher` component in NavBar (desktop + mobile)
- `app/sitemap.ts` — localized URLs with `alternates.languages`
- `app/robots.ts` — sitemap reference, `/admin` + `/api` disallowed
- JSON-LD structured data (`Organization` + `WebSite`) injected server-side on home page
- `alternates.languages` in metadata for hreflang
- `next.config.mjs` hardened: `compress: true`, AVIF/WebP image formats, HSTS header, immutable asset cache-control
- All site sections (Hero, About, Features, Stats, Cases, FAQ, CTA, NavBar, Footer) + ChatWidget fully translated

**Changed**

- Admin now lives in `app/(admin)/admin/*` with its own `<html>` root layout (`robots: noindex,nofollow`)
- Home page moved to `app/[locale]/page.tsx`
- ChatWidget locale-aware (placeholders, status, labels)

### Phase 2 — UI System

**Added**

- shadcn/ui-style design tokens (CSS variables) with full dark-mode support
- Core UI kit under `components/ui/*`: Button, Input, Label, Card, Badge, Accordion, Separator, Skeleton
- `ThemeProvider` (next-themes) + `ThemeToggle` with Sun/Moon cross-fade
- Inter font via `next/font/google` (CSS variable, swap display)
- `NavBar` with scroll-reactive backdrop blur + mobile sheet
- Multi-column `Footer` with link groups
- Reusable `Section` component (eyebrow / title / description)
- Home page rebuilt with Hero (gradient text + grid-fade bg), LogoCloud, About, Features (icon cards), Stats (gradient band), Cases, FAQ (Radix accordion), CTA
- Framer Motion in-view reveal animations on Features / Cases / Stats / Hero
- Rich site metadata (OpenGraph, Twitter Card, viewport themeColor)
- Toaster notifications (sonner) — wired into login success/failure
- `ChatWidget` redesigned: Lucide icons, connection indicator, loading-aware send button, AnimatePresence open/close, auto-focus on input
- `/admin` redesigned: sidebar with unread badges + empty state, sticky header, bubble chat, icon toolbar
- `/admin/login` redesigned: Card layout, gradient grid background, sonner toasts

**Changed**

- `tailwind.config.ts` fully wired to CSS variables + `tailwindcss-animate` plugin + Radix accordion keyframes
- `globals.css` switched to semantic tokens (`bg-background`, `text-foreground`, etc.) with `radial-fade` / `grid-bg` utilities

### Phase 1 — Security & Auth

**Added**

- `User` model with bcrypt password hashing (rounds=12) and multi-admin support
- Default admin seeded on first boot from `ADMIN_*` env vars
- Refresh token flow: Access (15m) in memory + Refresh (7d) in httpOnly cookie with rotation on every `/auth/refresh`
- New endpoints: `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- Login rate-limit (5/min) and global API rate-limit (300/min)
- Socket.io `io.use()` authentication — admin JWT or visitor signed session token required at connection time
- `POST /api/chat/session` issues a signed visitor session JWT; frontend stores `sessionId` + `sessionToken` together
- `X-Session-Token` header protects `GET /api/chat/history/:sessionId` — visitor can read only their own history
- Admin-only routes moved under `/api/chat/admin/*` (sessions list, history, read)
- `Session` collection tracks per-session aggregated state (last message, unread count, visitor info, status)
- `AuditLog` collection records login, logout, read, with IP + user agent
- Frontend `lib/api.ts` with automatic access-token refresh on 401 + single-flight dedup
- Frontend `lib/chat-session.ts` handles signed visitor session bootstrap

**Fixed**

- Mailer visitor field mismatch (`visitorName` → `visitorInfo.name`)
- Visitor chat history 401 — history endpoint now accepts visitor session token instead of admin JWT
- Socket.io `sessionId` spoofing — every message payload's sessionId is compared against the authenticated token's sessionId
- Email HTML is now properly escaped (XSS prevention)

**Changed**

- `authMiddleware` renamed to `requireAdmin`; added `requireRole(...roles)` for RBAC
- Socket event payloads are validated with Zod schemas from `@mojing/shared`
- Helmet loosened for CSP (handled at CDN/Next.js), `trust proxy` enabled for correct IPs behind Railway

### Phase 0 — Engineering baseline

**Added**

- ESLint, Prettier, EditorConfig, Husky, lint-staged, Commitlint
- pnpm workspace with `frontend`, `backend`, `shared` packages
- Shared Zod schemas and Socket.io event constants in `shared/`
- TypeScript migration for backend (Express + Socket.io + Mongoose)
- Environment variable validation via Zod
- Docker Compose for local development (api + mongo + redis + mongo-express)
- GitHub Actions CI (lint + typecheck + build)
- Pino structured logging, Helmet, graceful shutdown

**Changed**

- Introduced `shared/` package for type-safe contract between frontend and backend

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 2 — UI System (current)

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

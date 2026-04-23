# Week 1 · Summary

**Window**: 2026-04-23 (single-day sprint driven by Owner "efficiency mode").
**Theme**: Tech-debt paydown. No user-visible features, no new product surface.
**Budget**: 25 h planned. Actual: ~4 h clock-time because root-cause fixes
cascaded (T1 obviated T2's original scope; see ADR-0007).

---

## Shipped to `main`

| Commit                                           | Task | Description                                                                                                                                                                                           |
| ------------------------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3ab5c12`                                        | T1   | pnpm 9 + `.npmrc` hoist fixes + husky restored; commits no longer need `--no-verify`.                                                                                                                 |
| `2cf2f60` → T2,T3,T4 merged into one push window | T2   | Removed `ignoreBuildErrors` / `ignoreDuringBuilds` flags; root cause was pnpm hoisting, fixed in T1.                                                                                                  |
| `"`                                              | T3   | CI `audit` + `lighthouse` jobs added; dep triage `30 → 12` vulns (0 critical). Next `14.2.15 → 14.2.35` (fixes middleware auth-bypass critical), nodemailer `6 → 7`, bcrypt `5 → 6`, uuid `10 → 14`.  |
| `"`                                              | T4   | Sentry wired FE (`@sentry/nextjs`) + BE (`@sentry/node` v8). Global error boundary added. Env scaffolding documented.                                                                                 |
| `b090c68`                                        | T5   | README / DEPLOY / `.env.example` rewritten for ModelZone + Fly.io. Old Railway plan archived at `docs/legacy/DEPLOY-railway.md`. Redis removed from docker-compose + env schema (V1 doesn't need it). |
| (this PR)                                        | T6   | i18n hardcoded-string audit report at `docs/week1/i18n-audit.md`. No code migration yet — scheduled for Weeks 4/6.                                                                                    |

**ADRs**: `ADR-0001` through `ADR-0010` in `docs/DECISIONS.md`.

**Verified green locally**:

- `pnpm install --frozen-lockfile` — 1.7 s
- `pnpm typecheck` — all three packages ✓
- `pnpm lint` — zero warnings ✓
- `pnpm test` — 30 pass + 1 todo across all workspaces ✓
- `pnpm --filter=frontend build` — 24/24 pages compiled with Sentry ✓
- `pnpm --filter=backend build` — clean ✓
- `git commit` — runs lint-staged + commitlint without `--no-verify` ✓

---

## Observable to the owner

After this week merges:

- GitHub `main` carries a green CI with 5 + 2 new jobs (`audit` hard gate,
  `lighthouse` baseline-only).
- Vercel auto-redeploys the frontend; user-facing behavior **unchanged**.
- Sentry **still silent** — owner must provision the DSNs (30 min, see
  Owner-actions below).

## Owner-actions still required (approx. 30 min)

1. **Create 2 Sentry projects** at sentry.io: `modelzone-frontend`,
   `modelzone-backend`. Grab DSNs.
2. **Vercel env vars**: set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`,
   `SENTRY_ORG`, `SENTRY_PROJECT=modelzone-frontend`,
   `SENTRY_AUTH_TOKEN` (internal-user token with `project:releases` scope).
3. **GitHub branch protection**: settings → branches → `main` → require
   the 5 CI jobs (`Lint & Typecheck`, `Unit / Integration Tests`,
   `E2E (Playwright)`, `Security audit (pnpm audit)`,
   `Build (frontend)` + `Build (backend)`) to pass before merge. Leave
   `Lighthouse (baseline, non-blocking — ADR-0005)` OFF the required
   list (ADR-0005 invariant) until Week 6.

## Deferred into Week 2

- **T2 (original)** — admin page refactor for maintainability. Unblocked
  by T2 delivering on type correctness without architectural work.
- **Dependency highs remaining (3)** — Next 15 major upgrade +
  `bcryptjs` swap, per ADR-0008.
- **Fastify migration** — per §5 Week 2 milestone.
- **i18n hardcoding fixes** — 69 strings across 10 files, per
  `docs/week1/i18n-audit.md`.
- **Contact-form → `/api/leads`** — blocked on Fly.io deploy, per ADR-0009.

---

## Metrics

|                                                     | Before Week 1                    | After Week 1                        |
| --------------------------------------------------- | -------------------------------- | ----------------------------------- |
| `--no-verify` required for commits                  | Always                           | Never                               |
| `--no-frozen-lockfile` needed on Vercel             | Yes                              | No                                  |
| Frontend `ignoreBuildErrors` / `ignoreDuringBuilds` | On                               | Off                                 |
| Critical CVEs in dep tree                           | 1                                | 0                                   |
| High CVEs in dep tree                               | 13                               | 3 (all tracked, Week 2 remediation) |
| Sentry FE / BE                                      | Off / Off                        | Installed, awaiting DSN             |
| README brand / stack accuracy                       | "GlobalBridge / Railway / Redis" | "ModelZone / Fly.io / Atlas"        |
| CI jobs                                             | 5                                | 7 (+ audit, + lighthouse)           |
| Pre-existing red tests                              | 2 (silent)                       | 0 (fixed + documented)              |
| Architectural decisions logged                      | 0                                | 10                                  |

---

Next Monday: post Week 2 plan (Fastify migration + Fly.io deploy +
`/api/leads` migration + remaining high-CVE cleanup).

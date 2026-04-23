# Week 2 · Plan

**Window**: 2026-04-24 → 2026-04-30 (7 calendar days, target ~25 h work).
**Theme**: Ship a real, live backend. First production deploy. First lead
captured end-to-end through our own stack (no Web3Forms).
**Host pivot**: per ADR-0011, backend deploys to **Render** (free tier),
not Fly.io. Card-access constraint on Owner side.

---

## Goals (the things the Owner should see work)

1. `https://modelzone-api.onrender.com/api/health` returns `{"status":"ok"}`
   and `/api/ready` returns `{"mongo": true, ...}`.
2. Submitting the homepage contact form (`#contact`) lands a document in
   the MongoDB Atlas `leads` collection, **not** in Web3Forms.
3. `/admin/login` on the deployed frontend authenticates the seeded admin
   user and lists the leads captured in step 2.
4. Sentry receives at least one real error from each of `modelzone-frontend`
   and `modelzone-backend` (we trigger one on purpose, then fix it).
5. CI stays green; `--audit-level=critical` remains the only hard gate.

---

## Task list

Ordered by dependency and risk; each task has acceptance criteria.

### T1 · Fastify migration (spike + decision) · ~6 h · Day 1

Evaluate whether migrating Express → Fastify this week yields more value
than the disruption cost.

**Do**:

- Short spike: branch `spike/fastify`, replace `src/server.ts` with Fastify
  equivalent; check that `@sentry/node` + `helmet` + `cors` + `express-rate-limit`
  have clean Fastify drop-ins (`@fastify/helmet`, `@fastify/cors`,
  `@fastify/rate-limit`, official `@sentry/node` with Fastify integration).
- Port the `/api/health` and `/api/ready` routes.
- Benchmark locally (100 concurrent `/api/health` hits) Express vs Fastify.

**Decision rule**:

- If spike is clean and tests pass → merge to main, continue Week 2 on
  Fastify.
- If spike hits more than 2 h of unforeseen friction → **revert, stay on
  Express, log ADR-0012 deferring Fastify to Week 4**.

**Acceptance**:

- Either `backend/src/server.ts` uses Fastify and all existing Vitest tests
  pass, OR an ADR-0012 is written explaining the deferral.

### T2 · Lead pipeline (real `/api/leads`) · ~5 h · Day 1–2

The prototype POSTs to Web3Forms. Week 2 ships the in-house pipeline.

**Do**:

- Mongoose `Lead` model in `backend/src/models/Lead.model.ts` with fields:
  `name, email, company?, message, source ('contact-form' | 'chat' | 'api'),
locale, ipHash, userAgent, status ('new' | 'contacted' | 'closed'),
createdAt, updatedAt`.
- `POST /api/leads` route with Zod validation using the schema from
  `shared/src/schemas/lead.schema.ts` (create that schema).
- `express-rate-limit` / `@fastify/rate-limit`: 5 leads per 10 min per IP
  (hash IP with a daily-rotated salt stored in process env — no PII on
  disk).
- SMTP notification to `NOTIFY_EMAIL` on every new lead (if SMTP configured,
  else no-op and pino log-warn).
- Sentry breadcrumb on every accepted lead + Sentry captureException on
  any validation / DB error.
- Update `frontend/components/site/contact-form.tsx`: swap the Web3Forms
  POST for a call to `${NEXT_PUBLIC_BACKEND_URL}/api/leads`. Keep the
  Web3Forms path as a **fallback** triggered only when our backend 5xxs or
  times out in 5 s (graceful degradation per ADR-0009).
- Rewrite `frontend/__tests__/contact-form.test.tsx` to test the `/api/leads`
  path and the Web3Forms fallback; replace the `it.todo` from Week 1.

**Acceptance**:

- `curl -X POST .../api/leads -d '{ "name": ..., "email": ..., "message": ... }'`
  creates a Mongo document.
- Rate limiter returns 429 on 6th request in 10 min from same IP.
- Contact form on live Vercel preview submits to live Render backend end-to-end.
- Tests: unit (Zod), integration (supertest vs in-memory Mongo), E2E
  (Playwright posts the form and asserts the Mongo document).

### T3 · Render deploy + keep-alive · ~4 h · Day 3

First real production deploy of the backend.

**Do**:

- Confirm `render.yaml` at repo root builds (it is, as of this commit).
- Create Atlas DB user `modelzone-api`, get the connection string (Owner).
- Render signup (Owner) → Blueprint import → fill secrets.
- Set up external cron at Cron-Job.org or UptimeRobot hitting
  `/api/health` every 5 min. (Owner, 10 min task.)
- Confirm cold-start < 40 s, warm `/api/health` < 500 ms.
- Vercel prod env: set `NEXT_PUBLIC_BACKEND_URL` to the Render URL.
- Sanity: homepage renders, contact form POST succeeds to Render.

**Acceptance**:

- <https://modelzone-api.onrender.com/api/health> green from an external
  checker.
- Vercel production deploys show no CORS errors.

### T4  Admin console refactor  **RESCOPED**  ~1 h  Day 4

> **Correction (2026-04-23)**: `page.tsx` is **481 lines**, not 18k.
> The "18k-line monolith" framing mistook bytes for lines. File already
> satisfies the <500-line criterion. Default this week: **skip T4**;
> revisit in Week 4 chat sweep. Real admin debt is missing E2E tests
> (blocked on T3 Render deploy)  moves to Week 3.

The admin page was the original reason `ignoreBuildErrors` existed. Now
that the flag is gone (ADR-0007), we need to maintain it properly.

**Do**:

- Break up `frontend/app/(admin)/admin/page.tsx` (18k-line monolith) into
  per-section components under `frontend/app/(admin)/admin/_components/`.
- Extract data-fetching into a `useAdminData()` React hook.
- Delete dead code / unreachable branches identified by TS strict mode.
- Minimum: lead list with pagination + status filter + single-lead detail
  pane.

**Acceptance**:

- `/admin/login` works with seeded creds; redirect to `/admin`.
- `/admin` shows leads from the Mongo collection with `status` filters.
- `pnpm --filter=frontend typecheck` clean, `pnpm lint` clean.
- No component file >500 lines in `app/(admin)`.

### T5 · Sentry smoke test + release markers · ~2 h · Day 4

**Do**:

- Add GH Actions step that sets `SENTRY_RELEASE=$GITHUB_SHA` on every
  production deploy and uploads source maps (using the `SENTRY_AUTH_TOKEN`
  Owner sets in GitHub Secrets + Vercel).
- Add a "Throw on demand" admin-only route (`POST /api/_dev/throw?token=...`,
  gated behind `NODE_ENV !== 'production'` check or an admin JWT) to
  trigger a Sentry event once, verify it surfaces in Sentry with correct
  release tag, then remove the route or keep it gated.

**Acceptance**:

- Sentry project `modelzone-backend` shows the test error with the correct
  release SHA.
- Sentry project `modelzone-frontend` shows a Replay if Replay sampling
  caught it, or at minimum an error event.

### T6 · Remaining high CVEs · ~2 h · Day 5

Per ADR-0008, three high CVEs remained after Week 1. Triage them.

**Do**:

- Re-run `pnpm audit --prod --audit-level=high`.
- For each high: either bump the direct dep, add an override in root
  `package.json` resolutions, or document a justified exception in
  ADR-0008.
- If all resolvable this week → flip CI `--audit-level=critical` → `high`.

**Acceptance**:

- Either `pnpm audit --audit-level=high` is green OR ADR-0008 is updated
  with a per-CVE status table.

### T7 · i18n migration (ChatWidget only) · ~1 h · Day 5

Per ADR-0010, Week 4 is the chat PR sweep. Prepare it now for one string.

**Do**:

- `ChatWidget.tsx` `aria-label="在线客服"` → `t('chat.ariaLabel')`.
- Add `chat.ariaLabel` to `frontend/messages/en.json` + `zh.json`.
- Leave the rest for Week 4/6 (per ADR-0010).

**Acceptance**: `pnpm test` green, a11y scanner (axe) still clean.

### T8 · Week 2 demo + ADRs + summary · ~1 h · Day 7

**Do**:

- Write `docs/week2/SUMMARY.md` mirroring `docs/week1/SUMMARY.md` style.
- Capture a 2-min Loom / video walking through: contact → Mongo →
  `/admin` lead detail → Sentry event.
- Update `README.md` Roadmap section to mark Week 2 complete.
- Open any new ADRs discovered (likely: ADR-0012 Fastify decision,
  possibly ADR-0013 Sentry sampling).

**Acceptance**: Summary in `main`, demo link pinned in README.

---

## Out-of-band (Owner parallel tracks)

While I work the tasks above, Owner continues to:

1. **Open an overseas account** (new chat, see the prompt-engineering
   block given on 2026-04-23). Outcome tracked separately — not a Week 2
   blocker.
2. Once Week 2 backend is live, sign up for **Sentry** (5 min) and
   **Cron-Job.org** (5 min) and hand me the DSNs / confirm the cron URL.
3. **GitHub branch protection** on `main` (see Week 1 SUMMARY §owner-actions).
   Not a blocker for Week 2 delivery but reduces accident risk.

---

## Risks + mitigations

| Risk                                                                 | Likelihood | Impact | Mitigation                                                                                                                                                      |
| -------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render free tier region `singapore` has > 200 ms latency from zh-CN  | Med        | Med    | Cloudflare will edge-cache all `/api/*` NOT in path. For WS real-time, upgrade Owner's perception rather than host; Week 6 cost review may upgrade Render plan. |
| First Docker build on Render times out (>15 min cap on free)         | Low        | High   | `docker/Dockerfile.api` is already multi-stage; if it happens, split to slim base and prune dev deps earlier.                                                   |
| Atlas M0 hits connection limit (100) from Render cold starts stacked | Low        | Med    | Mongoose `maxPoolSize: 5` + `bufferCommands: false`; add Sentry breadcrumb on connection refused.                                                               |
| Contact form migration breaks production submissions during cut-over | Med        | High   | Web3Forms stays as a client-side fallback triggered by 5xx / timeout per T2 spec; toggle via `NEXT_PUBLIC_CONTACT_BACKEND_PRIMARY` flag for instant rollback.   |
| Render free tier 750 h/month runs out                                | Low        | Med    | 24 × 31 = 744 h exactly — we're on the edge. If we hit the wall, external cron keeps WS fresh without running custom jobs. Monitor in Render dashboard weekly.  |

---

## Success snapshot (copy-paste demo script for Owner, end of Week 2)

```powershell
# 1) Backend is alive
curl https://modelzone-api.onrender.com/api/health
# expect: { "status": "ok", "uptime": ... }

# 2) Submit a lead
curl -X POST https://modelzone-api.onrender.com/api/leads `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","email":"test@example.com","message":"hi","source":"api","locale":"en"}'
# expect: { "ok": true, "id": "..." }

# 3) Log into admin, see the lead
# Browser → https://modelzone-tawny.vercel.app/admin/login
# username/password from ADMIN_* env → see the lead you just created.

# 4) Trigger and verify Sentry (dev tooling route removed after verification)
```

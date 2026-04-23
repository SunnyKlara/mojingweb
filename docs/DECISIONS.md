# Architecture Decision Log (ADR)

> Chronological record of non-obvious engineering decisions taken during the
> enterprise rebuild of ModelZone (Wind Chaser 64). Every entry has: context,
> decision, alternatives considered, consequences. Do not rewrite history —
> supersede old entries with new ones and link back.

Format: `ADR-NNNN · [short title]` · status (`accepted` / `superseded by ADR-XXXX` / `deprecated`).

---

## ADR-0001 · pnpm version pinned to 9.x · `accepted` · 2026-04-23

**Context**

- Prototype launch ended with `pnpm-lock.yaml` regenerated under pnpm 10 on
  the dev machine while `package.json#packageManager` pinned `pnpm@9.12.0`.
- Vercel was forced to install with `--no-frozen-lockfile`, breaking
  reproducibility.
- `.github/workflows/ci.yml` uses `pnpm/action-setup@v4` with `version: 9`.

**Decision**

- Standardize the entire project on **pnpm 9.12.x** (latest 9.x patch at the
  time of writing). Enforced via:
  - `package.json#packageManager = pnpm@9.12.x`
  - `corepack enable` + `corepack use pnpm@9.12.x` locally
  - CI already pinned to 9
  - Vercel install command reverted to `pnpm install --frozen-lockfile`

**Alternatives considered**

- pnpm 10: stricter peer-dep resolution exposed several existing Radix/Next
  peer warnings that would cost ~2 h of unrelated triage during Week 1.
  Revisit after Week 3 mid-demo.

**Consequences**

- Developers must run `corepack enable` once on their machine.
- Any pnpm 10-specific features (none used today) are off-limits until a
  future ADR supersedes this.

---

## ADR-0002 · Backend host = Fly.io (V1) · `accepted` · 2026-04-23

**Context**

- §3 of `docs/PROMPT-ENTERPRISE-REBUILD.md` locks host to Fly.io **or** Render.
- V1 features requiring a persistent process: REST `/api/leads`, admin console,
  Socket.io real-time chat, SSE streaming for AI assistant.

**Decision**

- Deploy backend to **Fly.io free tier** (`fly.io/docs`) in region `hkg` (Hong
  Kong) for latency toward primary zh-CN audience, with a fallback `lax`
  machine for en audience. Single machine in Week 2; scale later if needed.

**Alternatives considered**

- Render free web service: 15-minute idle WebSocket disconnect on free plan;
  more aggressive cold-starts. Rejected.
- Railway (originally in `docs/DEPLOY.md`): not free anymore; $5/mo minimum.
  Upgrade-trigger, not a starting point.

**Consequences**

- Need `fly.toml` at repo root (Week 2 task).
- Cold-start (~1.5 s on free plan) accepted for V1; upgrade trigger documented
  in the prompt §3 (cold-start UX becomes unacceptable → pay $1.94/mo for
  `min_machines_running=1`).

---

## ADR-0003 · Sentry scope in Week 1 = FE + BE (not FE-only) · `accepted` · 2026-04-23

**Context**

- Initial Week 1 plan (superseded) scoped Sentry to frontend only, deferring
  backend to Week 2 alongside Fastify migration.
- Week 2 is the highest-risk migration week. Shipping it without backend error
  visibility is backwards.

**Decision**

- Install Sentry on the current Express backend in Week 1 (~30 min). Re-bind
  SDK to Fastify in Week 2 (~15 min).
- FE uses `@sentry/nextjs`, BE uses `@sentry/node`. DSNs provisioned by owner.

**Alternatives considered**

- FE-only in Week 1: rejected (see Context).
- Defer all Sentry to Week 2: rejected — Week 1 itself mutates build config,
  CI, and lockfile; we want telemetry on from day 1 of the rebuild.

**Consequences**

- Owner must create two Sentry projects (`modelzone-frontend`,
  `modelzone-backend`) and expose DSNs via Vercel + Fly env vars.
- Sentry free tier (5k errors/month, 10k perf units) is expected to cover V1.

---

## ADR-0004 · LLM provider decision deferred to Week 4 end · `accepted` · 2026-04-23

**Context**

- §8 of the rebuild prompt required a choice between OpenAI GPT-4o-mini and
  Anthropic Claude Haiku up front.
- AI assistant work lands in Week 5. Locking the provider now provides no
  engineering benefit and may miss pricing changes between now and Week 4.

**Decision**

- Defer provider selection to **end of Week 4**. By then the product surface
  for the AI assistant will be concretely specified (KB size, expected QPS,
  latency budget) and pricing will be re-checked.
- Default tentatively remains **GPT-4o-mini** for estimation purposes only.

**Alternatives considered**

- Lock now (GPT-4o-mini): acceptable but premature. Rejected as unnecessary
  constraint.

**Consequences**

- Week 5 opens with a 30-minute provider confirmation discussion, not code.
- Any V1 copy / docs that reference an LLM name should say "AI assistant"
  (provider-agnostic) until Week 5.

---

## ADR-0005 · Lighthouse CI = baseline-only in Week 1, hard gate in Week 6 · `accepted` · 2026-04-23

**Context**

- §2 of the rebuild prompt requires a performance budget enforced in CI.
- Picking thresholds (LCP/CLS/INP) without baseline data produces either
  toothless budgets or flaky red CI.

**Decision**

- Week 1: Lighthouse CI runs on every PR with `continue-on-error: true`.
  Results are stored as workflow artifacts. Trends logged here.
- Week 6: convert to hard gate with numeric budgets derived from 5 weeks of
  baseline data.
- `@axe-core/playwright` remains a hard gate from Week 1 onward — zero
  serious/critical a11y issues (objective, no baseline needed).

**Alternatives considered**

- Hard gate from Week 1: rejected (see Context).
- No Lighthouse in Week 1: rejected — we lose the trend data needed to set
  Week 6 budgets empirically.

**Consequences**

- Week 1 CI includes a non-blocking Lighthouse job. Reviewers see the scores
  on the PR but cannot block on them yet.
- Week 6 owes this ADR a superseding entry with the concrete numbers.

---

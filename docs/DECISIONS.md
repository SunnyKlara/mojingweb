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

## ADR-0008 · Dependency security triage; Week 1 ships at `--audit-level=critical` · `accepted` · 2026-04-23

**Context**

- T3 added a `pnpm audit` CI job per §2.
- Initial run reported **30 vulnerabilities** (3 low, 13 moderate, 13 high,
  **1 critical**). Hard-gating at `--audit-level=high` on day 1 would red the
  build.

**Actions taken (Week 1)**

- `next` `14.2.15 → 14.2.35` (latest 14.2.x patch). Fixes:
  - Critical _Authorization Bypass in Next.js Middleware_ (GHSA-f82v-jwr5-mffw)
    — directly affected our `frontend/middleware.ts` locale rewriter.
  - High _Next.js Cache Key Confusion_ (GHSA-qpjv-v59x-3qc4).
- `nodemailer` `6.10.1 → 7.0.13`. Fixed high SMTP command injection path.
- `bcrypt` `5.1.1 → 6.0.0`. Reduced transitive `tar@6.2.1` high vulns.
- `uuid` `10 → 14` + `@types/uuid` `10 → 11`. Fixed uuid high.
- Side-effect: `shared/tsconfig.json` added `"types": []` to stop TS
  auto-loading hoisted `@types/uuid` and triggering a bogus TS2688.

**Result**

- **30 → 12** vulnerabilities (1 low, 8 moderate, **3 high, 0 critical**).
- All three packages (`shared`, `backend`, `frontend`) typecheck + build clean.

**Remaining 3 high (tracked for Week 2)**

1. **Next.js DoS with Server Components** (GHSA-q4gf-8mx6-v5v3) — requires
   upgrade to `next ≥ 15.5.15`, i.e. Next 15 major. Breaking: App Router
   API changes, async request APIs. Scope: 1–2 days Week 2 spike.
2. **node-tar Symlink Path Traversal** (GHSA-9ppj-qmqm-q256 & siblings) —
   transitive via `bcrypt > @mapbox/node-pre-gyp > tar@6`. Options:
   replace `bcrypt` with `bcryptjs` (pure JS, no native build, no tar
   dep, slightly slower hashing), or wait for `@mapbox/node-pre-gyp` to
   bump tar. Decision deferred to Week 2 alongside Fastify migration.
3. **uuid** false-positive in audit transitive chain via `@types/uuid`.
   No runtime impact. May clear after next `@types/uuid` release.

**Decision**

- Week 1 CI audit gate: `--audit-level=critical` (currently 0, passes).
- Week 2 CI audit gate: promote to `--audit-level=high` after items 1 and 2
  above are resolved.
- Document remaining highs in this ADR; do not use `--ignore-vuln` or any
  suppression mechanism (we fix, not mask).

**Consequences**

- CI will start failing as soon as a new **critical** appears anywhere in
  the dep tree — the real gate. Highs / moderates require manual review.
- Week 2 plan must include 1–2 day buffer for Next 15 migration.

---

## ADR-0007 · `ignoreBuildErrors` flags removed — root cause was pnpm hoisting · `accepted` · 2026-04-23

**Context**

- `LAUNCH-SUMMARY.md:83-85` claimed real TS errors existed in
  `frontend/app/(admin)/admin/**` with symptom _"declaration of `react` could
  not be resolved in Vercel's sandbox"_, root cause marked as "unconfirmed".
- Original Week 1 plan budgeted 8–10 h for T2 (fix admin types).

**Investigation (T2 probe, ~15 min)**

- After T1 landed (added `public-hoist-pattern[]=@types/*` to `.npmrc`),
  we re-ran the following with the ignore flags flipped to `false`:
  - `pnpm --filter=frontend typecheck` → exit 0, zero errors
  - `pnpm --filter=frontend lint` → exit 0, zero warnings
  - `pnpm --filter=frontend build` → exit 0, all 24 pages including
    `/admin`, `/admin/leads`, `/admin/login` generated cleanly
- Conclusion: the original Vercel-sandbox failure was caused by pnpm's
  isolated `node_modules` layout hiding `@types/react` from TypeScript's
  resolver. T1's hoist pattern change fixed the root cause.

**Decision**

- Delete `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` from
  `frontend/next.config.mjs` entirely (rely on Next defaults).
- Reclaim ~8 h of Week 1 budget. Options for reallocation, in priority order:
  1. T3 CI gates — larger buffer for Lighthouse baseline & axe wiring.
  2. T4 Sentry — pull source-maps + release tracking forward from Week 2.
  3. Week 2 Fastify migration — spike work during Week 1 if T3/T4 finish
     early.

**Alternatives considered**

- Keep flags as `false` (not delete): rejected — matches defaults, dead
  config just adds noise.
- Don't trust the quick probe; still budget 8 h: rejected — evidence is
  conclusive (three independent checks green).

**Consequences**

- Any future regression that silently depends on disabled checks will now
  break CI immediately (as intended).
- `LAUNCH-SUMMARY.md` is now historical; this ADR supersedes its §5 High
  bullet #1.

---

## ADR-0006 · §4 PR-review workflow relaxed for Week 1 (solo Owner-dev) · `accepted` · 2026-04-23

**Context**

- §4 of the rebuild prompt mandates "short-lived feature branches; PR review
  required".
- Current team size is 1 (Owner = Klara = sole reviewer). GitHub PR ceremony
  adds ~5 min / task of overhead without providing independent review.
- Owner explicitly requested "直接合并，我需要效率" after the first PR.

**Decision**

- Week 1 only: trivial, config-only tasks (T1 foundation, T5 docs, T6 audit)
  may be merged directly to `main` via fast-forward push. CI still runs
  post-push and surfaces breakage.
- Tasks that modify application code or CI configuration (T2 admin types,
  T3 CI gates, T4 Sentry wiring) will still use a feature branch locally,
  but Cascade self-reviews (typecheck + lint + tests green) and then
  merges directly. No GitHub PR unless Owner requests one.
- Starting Week 2 (when a second collaborator or more complex change sets
  appear), revisit this ADR.

**Alternatives considered**

- Strict §4 compliance: rejected by Owner on efficiency grounds for solo
  work. Trade-off accepted.
- Squash-merge via GitHub UI: same overhead as PR, no extra value for a
  solo dev.

**Consequences**

- Audit trail is the `git log` on `main`, not PR history.
- If a commit lands broken, rollback is `git revert <sha>` + push, which
  is well within Cascade's capability.
- Feature-branch discipline (one branch per task) is retained locally to
  enable trivial revert and parallel work.

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

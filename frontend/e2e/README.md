# E2E Tests (Playwright)

## Run locally

```powershell
# First time only — downloads chromium (~150MB)
pnpm --filter=frontend test:e2e:install

# Run (auto-starts `pnpm dev` if no server on :3000)
pnpm --filter=frontend test:e2e

# Against an already-running dev/preview server:
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3000'
pnpm --filter=frontend test:e2e
```

## What's covered (smoke)

- **Home** — i18n default redirect to `/zh`, EN toggle, SEO meta, sitemap, robots, 404 page
- **Content** — blog list, blog post render, cases list

Backend-dependent flows (lead submission, admin login, chat) are covered by
backend integration tests in `backend/src/__tests__/` since they don't require
a real browser.

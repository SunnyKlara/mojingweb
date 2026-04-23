import * as Sentry from '@sentry/nextjs'

/**
 * Node SSR Sentry SDK initialization (Next.js server components, API routes).
 * Loaded by `instrumentation.ts` on Node runtime.
 */
const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
  })
}

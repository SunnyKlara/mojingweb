import * as Sentry from '@sentry/nextjs'

/**
 * Edge runtime Sentry SDK initialization (middleware, edge API routes).
 * Loaded by `instrumentation.ts` on Edge runtime.
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

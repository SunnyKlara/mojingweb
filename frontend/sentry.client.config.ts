import * as Sentry from '@sentry/nextjs'

/**
 * Browser-side Sentry SDK initialization.
 * DSN is injected by `NEXT_PUBLIC_SENTRY_DSN` at build time.
 * If the DSN is absent (local dev without Sentry), Sentry stays a no-op.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    beforeSend(event) {
      // Drop ResizeObserver loop benign errors that pollute dashboards.
      if (event.exception?.values?.some((v) => v.value?.includes('ResizeObserver'))) {
        return null
      }
      return event
    },
  })
}

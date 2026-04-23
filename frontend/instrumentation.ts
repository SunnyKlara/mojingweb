/**
 * Next.js instrumentation hook — runs once per server/edge runtime startup.
 * Used to initialize Sentry SDKs on the correct runtime.
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// onRequestError is available in @sentry/nextjs v9+; on v8 we rely on
// default instrumentation from the SDK. Uncomment after the v9 bump.
// export { onRequestError } from '@sentry/nextjs'

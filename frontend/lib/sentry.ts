/**
 * Opt-in Sentry for the Next.js client.
 *
 * If `NEXT_PUBLIC_SENTRY_DSN` is set AND `@sentry/nextjs` is installed,
 * we initialize it on the client. Otherwise it's a no-op. Dynamic import
 * is written so that webpack does NOT try to resolve the module at build
 * time (variable specifier + catch).
 *
 * To enable:
 *   pnpm add -F frontend @sentry/nextjs
 *   echo "NEXT_PUBLIC_SENTRY_DSN=https://..." >> frontend/.env.local
 */
interface SentryClient {
  init(opts: Record<string, unknown>): void
  captureException(err: unknown): void
}

let client: SentryClient | null = null
let initialized = false

export function initClientSentry(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  // Dynamic specifier prevents webpack from bundling the module.
  const moduleName = ['@sentry', 'nextjs'].join('/')
  void (async () => {
    try {
      const mod = (await import(/* webpackIgnore: true */ moduleName)) as SentryClient
      mod.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
      })
      client = mod
    } catch {
      // @sentry/nextjs not installed — stay silent.
    }
  })()
}

export function captureException(err: unknown): void {
  if (client) {
    client.captureException(err)
  } else {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}

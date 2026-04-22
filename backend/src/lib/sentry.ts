/**
 * Opt-in Sentry integration.
 *
 * Kept as a pluggable shim: if `SENTRY_DSN` is set AND `@sentry/node` is
 * installed, we initialize it. Otherwise every call is a no-op. This keeps
 * the dependency cost at zero for teams that don't want it.
 *
 * To enable:
 *   pnpm add -F backend @sentry/node
 *   echo "SENTRY_DSN=https://..." >> backend/.env
 */
import { createRequire } from 'node:module'
import type { RequestHandler, ErrorRequestHandler } from 'express'
import { env, isProd } from '../config/env'
import { logger } from '../config/logger'

// CommonJS output, so __filename is available.
const nodeRequire = createRequire(__filename)

interface SentryLike {
  init(opts: Record<string, unknown>): void
  captureException(err: unknown): void
  Handlers: {
    requestHandler(): RequestHandler
    errorHandler(): ErrorRequestHandler
  }
}

let sentry: SentryLike | null = null

export function initSentry(): void {
  if (!env.SENTRY_DSN) return
  try {
    const mod = nodeRequire('@sentry/node') as SentryLike
    mod.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: isProd ? 0.1 : 1.0,
    })
    sentry = mod
    logger.info('Sentry initialized')
  } catch {
    logger.warn(
      'SENTRY_DSN set but @sentry/node not installed. Run `pnpm add -F backend @sentry/node` to enable.',
    )
  }
}

export function captureException(err: unknown): void {
  sentry?.captureException(err)
}

export const sentryRequestHandler: RequestHandler = (req, res, next) => {
  if (sentry) return sentry.Handlers.requestHandler()(req, res, next)
  next()
}

export const sentryErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (sentry) return sentry.Handlers.errorHandler()(err, req, res, next)
  next(err)
}

import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { Server as IOServer } from 'socket.io'
import { env, isProd } from './config/env'
import { logger } from './config/logger'
import { authRouter } from './routes/auth.routes'
import { chatRouter } from './routes/chat.routes'
import { leadRouter } from './routes/lead.routes'
import { healthRouter } from './routes/health.routes'
import { productRouter, adminProductRouter } from './routes/product.routes'
import { orderRouter } from './routes/order.routes'
import { adminOrderRouter } from './routes/admin-order.routes'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { csrfCookieSetter, csrfProtection } from './middleware/csrf.middleware'
import { registerSocketHandlers } from './socket'
import { initSentry, sentryRequestHandler, installSentryExpressErrorHandler } from './lib/sentry'

export function createServer(): { app: express.Express; server: http.Server; io: IOServer } {
  // Idempotent — index.ts already calls initSentry() earlier, but call again
  // to guarantee initialization if createServer() is invoked in isolation
  // (e.g. supertest integration tests).
  initSentry()
  const app = express()
  const server = http.createServer(app)
  const io = new IOServer(server, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  })

  app.disable('x-powered-by')
  // Express 4: needed so req.ip honors X-Forwarded-For behind Fly.io / Cloudflare.
  app.set('trust proxy', 1)

  // Sentry request handler must come BEFORE any other middleware.
  app.use(sentryRequestHandler)

  app.use(
    helmet({
      // CSP: allow self + inline styles (Tailwind) + backend API + payment providers.
      // Tighten further once payment provider domains are known.
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", env.FRONTEND_URL, 'wss:', 'https:'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  )
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(pinoHttp({ logger }))

  // CSRF protection: set cookie on all responses, validate on state-changing requests.
  app.use(csrfCookieSetter)
  app.use('/api', csrfProtection)

  // Global fallback rate-limit (login has its own stricter one inside authRouter).
  const globalLimiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
  app.use('/api', globalLimiter)

  app.use('/api', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/chat', chatRouter)
  app.use('/api/leads', leadRouter)
  app.use('/api/products', productRouter)
  app.use('/api/orders', orderRouter)
  app.use('/api/admin/products', adminProductRouter)
  app.use('/api/admin/orders', adminOrderRouter)

  app.use(notFoundHandler)
  // Sentry v8 error handler — must come BEFORE the project-level error handler.
  installSentryExpressErrorHandler(app)
  app.use(errorHandler)

  registerSocketHandlers(io)

  return { app, server, io }
}

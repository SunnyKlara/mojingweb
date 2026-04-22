import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { Server as IOServer } from 'socket.io'
import { env } from './config/env'
import { logger } from './config/logger'
import { authRouter } from './routes/auth.routes'
import { chatRouter } from './routes/chat.routes'
import { healthRouter } from './routes/health.routes'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { registerSocketHandlers } from './socket'

export function createServer(): { app: express.Express; server: http.Server; io: IOServer } {
  const app = express()
  const server = http.createServer(app)
  const io = new IOServer(server, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  })

  app.disable('x-powered-by')
  // Express 4: needed so req.ip honors X-Forwarded-For behind Railway / Cloudflare.
  app.set('trust proxy', 1)

  app.use(
    helmet({
      contentSecurityPolicy: false, // set per-origin via CDN / Next headers
      crossOriginEmbedderPolicy: false,
    }),
  )
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(pinoHttp({ logger }))

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

  app.use(notFoundHandler)
  app.use(errorHandler)

  registerSocketHandlers(io)

  return { app, server, io }
}

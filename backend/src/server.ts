import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { Server as IOServer } from 'socket.io'
import { env } from './config/env'
import { logger } from './config/logger'
import { authRouter } from './routes/auth.routes'
import { chatRouter } from './routes/chat.routes'
import { healthRouter } from './routes/health.routes'
import { authMiddleware } from './middleware/auth.middleware'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { registerSocketHandlers } from './socket'

export function createServer(): { app: express.Express; server: http.Server; io: IOServer } {
  const app = express()
  const server = http.createServer(app)
  const io = new IOServer(server, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  })

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(pinoHttp({ logger }))

  app.use('/api', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/chat', authMiddleware, chatRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  registerSocketHandlers(io)

  return { app, server, io }
}

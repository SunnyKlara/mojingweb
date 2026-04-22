import { Router } from 'express'
import mongoose from 'mongoose'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

healthRouter.get('/ready', (_req, res) => {
  const mongoReady = mongoose.connection.readyState === mongoose.ConnectionStates.connected
  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? 'ready' : 'not_ready',
    checks: { mongo: mongoReady },
  })
})
